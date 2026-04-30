import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from api.config import settings
from api.database import get_db
from api.deps import UserContext, get_current_user
from api.models import (
    Car,
    CarDriver,
    Invitation,
    Passenger,
    Ride,
    Seat,
    User,
)
from api.schemas import RideOut
from api.utils.enums import CarLayout, InvitationStatus
from api.utils.integration_audit import emit_integration_event
from api.utils.logging_config import get_logger
from api.utils.seats import get_layout_seat_positions

router = APIRouter()
logger = get_logger(__name__)

DEMO_NAME_PREFIX = "Sitzy Thesis Demo"


def _ensure_dev_enabled() -> None:
    if not settings.demo_fixtures_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo fixtures are disabled in this environment.",
        )


def _demo_whitelist_emails() -> set[str]:
    return {
        email.strip().lower()
        for email in settings.demo_fixture_whitelist_emails.split(",")
        if email.strip()
    }


def _is_real_email(email: str | None) -> bool:
    return bool(email and not email.endswith(".invalid"))


def _ensure_demo_account_allowed(ctx: UserContext) -> None:
    if settings.environment != "production":
        return

    whitelist = _demo_whitelist_emails()
    user_email = ctx.user.email.strip().lower() if ctx.user.email else None
    if user_email and user_email in whitelist:
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="This demo account is not whitelisted for production fixtures.",
    )


def _valid_demo_email(prefix: str) -> str:
    return f"{prefix}+{uuid.uuid4().hex[:12]}@example.com"


def _demo_user_name(kind: str, index: int) -> str:
    return f"{DEMO_NAME_PREFIX} {kind} {index:02d}"


@router.post("/dev/fixtures/generate")
def generate_demo_fixtures(
    ctx: UserContext = Depends(get_current_user), db: Session = Depends(get_db)
) -> dict[str, Any]:
    """Generate deterministic demo fixtures for the current authenticated user.

    In production, only whitelisted demo accounts may use this endpoint.
    """
    _ensure_dev_enabled()
    _ensure_demo_account_allowed(ctx)

    token = uuid.uuid4().hex[:8]
    car_name = f"DEMO_AUTOGEN:{token}"

    # Create the user's demo ride with mock passengers.
    car = Car(owner_id=ctx.user.id, name=car_name, layout=CarLayout.PRAQ)
    db.add(car)
    db.flush()

    # Create seats for layout
    positions = get_layout_seat_positions(CarLayout.PRAQ)
    for pos in positions:
        db.add(Seat(car_id=car.id, position=pos))

    # Create car driver (current user)
    car_driver = CarDriver(car_id=car.id, driver_id=ctx.user.id, is_active=True)
    db.add(car_driver)
    db.flush()

    # Create a ride for tomorrow
    departure = datetime.now(timezone.utc) + timedelta(days=1)
    ride = Ride(
        car_id=car.id,
        car_driver_id=car_driver.id,
        departure_time=departure,
        destination="Demo: Test route",
    )
    db.add(ride)
    db.flush()

    # Create two mock passengers on the user's ride.
    created_passengers = []
    seat_iter = iter([p for p in positions if p != 1])
    for i in range(3):
        demo_user = User(
            email=_valid_demo_email(f"demo-passenger-{i + 1}"),
            full_name=_demo_user_name("Passenger", i + 1),
        )
        db.add(demo_user)
        db.flush()

        try:
            seat_pos = next(seat_iter)
        except StopIteration:
            seat_pos = positions[-1]

        passenger = Passenger(
            user_id=demo_user.id, ride_id=ride.id, seat_position=seat_pos
        )
        db.add(passenger)
        db.flush()
        created_passengers.append(str(passenger.id))

    # Create a second demo ride and invite the current user to it.
    visitor_owner = User(
        email=_valid_demo_email("demo-host"),
        full_name=_demo_user_name("Host", 1),
    )
    db.add(visitor_owner)
    db.flush()

    visitor_car = Car(
        owner_id=visitor_owner.id,
        name=f"DEMO_VISIT:{token}",
        layout=CarLayout.SEDAQ,
    )
    db.add(visitor_car)
    db.flush()

    for position in get_layout_seat_positions(CarLayout.SEDAQ):
        db.add(Seat(car_id=visitor_car.id, position=position))

    visitor_driver = CarDriver(
        car_id=visitor_car.id,
        driver_id=visitor_owner.id,
        is_active=True,
    )
    db.add(visitor_driver)
    db.flush()

    visitor_ride = Ride(
        car_id=visitor_car.id,
        car_driver_id=visitor_driver.id,
        departure_time=departure + timedelta(hours=2),
        destination="Demo: Visitor route",
    )
    db.add(visitor_ride)
    db.flush()

    db.add(
        Passenger(
            user_id=visitor_owner.id,
            ride_id=visitor_ride.id,
            seat_position=1,
        )
    )

    if not ctx.user.email:
        current_user_email = _valid_demo_email("demo-current-user")
        ctx.user.email = current_user_email
        db.flush()
    else:
        current_user_email = ctx.user.email

    invite = Invitation(
        ride_id=visitor_ride.id,
        invited_email=current_user_email,
        token=uuid.uuid4().hex,
        status=InvitationStatus.PENDING,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
    )
    db.add(invite)

    metadata = {
        "demo_batch_id": token,
        "car_id": str(car.id),
        "ride_id": str(ride.id),
        "passenger_ids": created_passengers,
        "visitor_ride_id": str(visitor_ride.id),
        "invitation_token": invite.token,
    }

    emit_integration_event(
        event="demo_fixtures_created", user_id=ctx.user.id, metadata=metadata, db=db
    )

    # Commit everything, including the audit row.
    db.commit()

    logger.info(
        "Demo fixtures generated",
        extra={"user_id": str(ctx.user.id), "car_id": str(car.id)},
    )

    return {
        "detail": "Demo fixtures generated.",
        "user_ride": RideOut.from_ride(ride),
        "visitor_ride": RideOut.from_ride(visitor_ride),
        "meta": metadata,
    }


@router.post("/dev/fixtures/reset")
def reset_demo_fixtures(
    ctx: UserContext = Depends(get_current_user), db: Session = Depends(get_db)
) -> dict[str, int | str]:
    """Delete demo-generated fixtures for the current authenticated user."""
    _ensure_dev_enabled()

    cars = (
        db.query(Car)
        .filter(or_(Car.name.like("DEMO_AUTOGEN:%"), Car.name.like("DEMO_VISIT:%")))
        .all()
    )
    deleted_cars = 0
    for car in cars:
        db.delete(car)
        deleted_cars += 1

    users = (
        db.query(User)
        .filter(
            or_(
                User.email.ilike("demo-%@example.com"),
                User.full_name.ilike(f"{DEMO_NAME_PREFIX}%"),
            )
        )
        .all()
    )
    deleted_users = 0
    for user in users:
        db.delete(user)
        deleted_users += 1

    emit_integration_event(
        event="demo_fixtures_reset",
        user_id=ctx.user.id,
        metadata={"deleted_cars": deleted_cars, "deleted_users": deleted_users},
        db=db,
    )

    db.commit()

    logger.info(
        "Demo fixtures reset",
        extra={
            "user_id": str(ctx.user.id),
            "deleted_cars": deleted_cars,
            "deleted_users": deleted_users,
        },
    )

    return {
        "detail": "Demo fixtures reset.",
        "deleted_cars": deleted_cars,
        "deleted_users": deleted_users,
    }
