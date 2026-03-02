from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response
from sqlalchemy.orm import Session

from api.database import get_db
from api.deps import UserContext, get_current_user
from api.models import Car, CarDriver, Invitation, Passenger, Ride
from api.schemas import (
    InvitationCreate,
    InvitationOut,
    PassengerSeatIn,
    RideCreate,
    RideOut,
    RideUpdate,
    TransferDriverIn,
)
from api.utils.enums import InvitationStatus
from api.utils.logging_config import get_logger
from api.utils.security import generate_token

router = APIRouter()
logger = get_logger(__name__)


def _get_ride_or_404(ride_id: UUID, db: Session) -> Ride:
    """Helper to get a ride by ID or raise 404 if not found."""
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found.")
    return ride


def _assert_ride_access(
    ride: Ride,
    user_id: UUID,
    *,
    owner_only: bool = False,
    driver_or_owner: bool = False,
) -> None:
    """Check if user has access to a ride.

    - owner_only      — only car owner can access
    - driver_or_owner — driver or owner can access, passengers cannot
    - default         — driver, owner or passenger can access
    """
    is_owner = ride.car.owner_id == user_id
    is_current_driver = ride.car_driver.driver_id == user_id
    is_passenger = any(p.user_id == user_id for p in ride.passengers)

    if owner_only:
        if not is_owner:
            raise HTTPException(
                status_code=403,
                detail="Only the car owner can perform this action.",
            )
    elif driver_or_owner:
        if not is_owner and not is_current_driver:
            raise HTTPException(
                status_code=403,
                detail="Only the current driver or car owner can perform this action.",
            )
    else:
        if not is_owner and not is_current_driver and not is_passenger:
            raise HTTPException(
                status_code=403,
                detail="You are not part of this ride.",
            )


@router.get("/", response_model=list[RideOut])
def get_my_rides(
    request: Request,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> list[RideOut]:
    """Get all rides where the user is a passenger."""
    rides = (
        db.query(Ride)
        .join(Passenger, Ride.id == Passenger.ride_id)
        .filter(Passenger.user_id == ctx.user.id)
        .all()
    )
    logger.debug(
        "Rides retrieved", extra={"user_id": str(ctx.user.id), "count": len(rides)}
    )
    return [RideOut.model_validate(ride) for ride in rides]


@router.post("/", response_model=RideOut)
def create_ride(
    request: Request,
    ride_in: RideCreate,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> RideOut:
    """Create a new ride."""
    car = db.query(Car).filter(Car.id == ride_in.car_id).first()
    if not car or car.owner_id != ctx.user.id:
        logger.warning(
            "Ride creation denied - not car owner",
            extra={"user_id": str(ctx.user.id), "car_id": str(ride_in.car_id)},
        )
        raise HTTPException(
            status_code=403,
            detail="Only the car owner can create a ride.",
        )

    # The driver of the ride is always the car owner, but we need to ensure
    # there's an active CarDriver record for it
    car_driver = (
        db.query(CarDriver)
        .filter(
            CarDriver.car_id == ride_in.car_id,
            CarDriver.driver_id == ctx.user.id,
        )
        .first()
    )
    if not car_driver:
        car_driver = CarDriver(
            car_id=ride_in.car_id,
            driver_id=ctx.user.id,
            is_active=True,
        )
        db.add(car_driver)
    else:
        car_driver.is_active = True
    db.flush()

    ride = Ride(
        car_id=ride_in.car_id,
        car_driver_id=car_driver.id,
        departure_time=ride_in.departure_time,
        destination=ride_in.destination,
    )
    db.add(ride)
    db.commit()
    db.refresh(ride)
    logger.info(
        "Ride created",
        extra={
            "user_id": str(ctx.user.id),
            "ride_id": str(ride.id),
            "car_id": str(ride.car_id),
        },
    )
    return RideOut.model_validate(ride)


@router.get("/{ride_id}", response_model=RideOut)
def get_ride(
    ride_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> RideOut:
    """Get ride detail."""
    ride = _get_ride_or_404(ride_id, db)
    _assert_ride_access(ride, ctx.user.id)
    return RideOut.model_validate(ride)


@router.patch("/{ride_id}", response_model=RideOut)
def update_ride(
    ride_id: UUID,
    ride_in: RideUpdate,
    request: Request,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> RideOut:
    """Update ride."""
    ride = _get_ride_or_404(ride_id, db)
    _assert_ride_access(ride, ctx.user.id, driver_or_owner=True)

    ride.departure_time = ride_in.departure_time
    ride.destination = ride_in.destination
    db.commit()
    db.refresh(ride)
    return RideOut.model_validate(ride)


@router.delete("/{ride_id}", status_code=204)
def cancel_ride(
    ride_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> Response:
    """Cancel a ride."""
    ride = _get_ride_or_404(ride_id, db)
    _assert_ride_access(ride, ctx.user.id, owner_only=True)

    db.delete(ride)
    db.commit()
    logger.info(
        "Ride cancelled", extra={"user_id": str(ctx.user.id), "ride_id": str(ride_id)}
    )
    return Response(status_code=204)


@router.post("/{ride_id}/book", response_model=RideOut)
def book_seat(
    ride_id: UUID,
    seat_in: PassengerSeatIn,
    request: Request,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> RideOut:
    """Book a seat on a ride. If seat_position is not provided,
    the first available seat is assigned automatically."""
    ride = _get_ride_or_404(ride_id, db)

    occupied = {p.seat_position for p in ride.passengers}
    occupied.add(1)
    available = [
        s.position for s in ride.car.seats if s.position not in occupied
    ]

    if not available:
        logger.warning(
            "Seat booking failed - no available seats",
            extra={"user_id": str(ctx.user.id), "ride_id": str(ride_id)},
        )
        raise HTTPException(status_code=400, detail="No available seats.")

    existing = (
        db.query(Passenger).filter_by(user_id=ctx.user.id, ride_id=ride_id).first()
    )
    if existing:
        logger.warning(
            "Seat booking failed - already booked",
            extra={"user_id": str(ctx.user.id), "ride_id": str(ride_id)},
        )
        raise HTTPException(status_code=409, detail="Already booked.")

    if seat_in.seat_position is None:
        seat_position = available[0]
    else:
        if seat_in.seat_position not in available:
            raise HTTPException(
                status_code=400,
                detail=f"Seat {seat_in.seat_position} is not available.",
            )
        seat_position = seat_in.seat_position

    passenger = Passenger(
        user_id=ctx.user.id,
        ride_id=ride_id,
        seat_position=seat_position,
    )
    db.add(passenger)
    db.commit()
    db.refresh(ride)
    logger.info(
        "Passenger booked seat",
        extra={
            "user_id": str(ctx.user.id),
            "ride_id": str(ride_id),
            "seat_position": seat_position,
        },
    )
    return RideOut.model_validate(ride)


@router.delete("/{ride_id}/book", status_code=204)
def cancel_booking(
    ride_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> Response:
    """Cancel own booking on a ride."""
    passenger = (
        db.query(Passenger).filter_by(user_id=ctx.user.id, ride_id=ride_id).first()
    )
    if not passenger:
        raise HTTPException(status_code=404, detail="Booking not found.")

    db.delete(passenger)
    db.commit()
    return Response(status_code=204)


@router.post("/{ride_id}/invite", response_model=InvitationOut)
def invite_passenger(
    ride_id: UUID,
    invitation_in: InvitationCreate,
    request: Request,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> InvitationOut:
    """Invite a passenger to a ride."""
    ride = _get_ride_or_404(ride_id, db)
    _assert_ride_access(ride, ctx.user.id, driver_or_owner=True)

    if (
        ctx.user.email
        and str(invitation_in.invited_email).lower() == ctx.user.email.lower()
    ):
        raise HTTPException(status_code=400, detail="You cannot invite yourself.")

    if len(ride.passengers) >= len(ride.car.seats) - 1:
        raise HTTPException(status_code=400, detail="No available seats in this ride.")

    existing = (
        db.query(Invitation)
        .filter(
            Invitation.ride_id == ride_id,
            Invitation.invited_email == str(invitation_in.invited_email),
            Invitation.status == InvitationStatus.PENDING,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Invitation already sent.")

    invitation = Invitation(
        ride_id=ride_id,
        invited_email=str(invitation_in.invited_email),
        token=generate_token(32),
        status=InvitationStatus.PENDING,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    return InvitationOut.from_orm_with_labels(invitation)


@router.post("/{ride_id}/transfer-driver", response_model=RideOut)
def transfer_driver(
    ride_id: UUID,
    transfer_in: TransferDriverIn,
    request: Request,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> RideOut:
    """Transfer driver role for a specific ride to a passenger.
    Only car owner can transfer. New driver must be a passenger on the ride."""
    ride = _get_ride_or_404(ride_id, db)
    _assert_ride_access(ride, ctx.user.id, owner_only=True)

    is_passenger = any(p.user_id == transfer_in.new_driver_id for p in ride.passengers)
    if not is_passenger:
        raise HTTPException(
            status_code=400,
            detail="New driver must be a passenger on this ride.",
        )
    
    if ride.car_driver.driver_id == transfer_in.new_driver_id:
        raise HTTPException(
            status_code=400,
            detail="This passenger is already the driver.",
        )

    current_driver = ride.car_driver
    if current_driver.driver_id != ride.car.owner_id:
        current_driver.is_active = False
        current_driver.revoked_at = datetime.now(timezone.utc)

    new_car_driver = (
        db.query(CarDriver)
        .filter(
            CarDriver.car_id == ride.car_id,
            CarDriver.driver_id == transfer_in.new_driver_id,
        )
        .first()
    )
    if not new_car_driver:
        new_car_driver = CarDriver(
            car_id=ride.car_id,
            driver_id=transfer_in.new_driver_id,
            is_active=True,
        )
        db.add(new_car_driver)
        db.flush()
    else:
        new_car_driver.is_active = True
        new_car_driver.revoked_at = None

    ride.car_driver_id = new_car_driver.id
    db.commit()
    db.refresh(ride)

    logger.info(
        "Driver transferred",
        extra={
            "ride_id": str(ride_id),
            "new_driver_id": str(transfer_in.new_driver_id),
            "owner_id": str(ctx.user.id),
        },
    )
    return RideOut.model_validate(ride)
