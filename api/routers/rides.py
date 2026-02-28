from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response
from sqlalchemy.orm import Session

from api.database import get_db
from api.deps import UserContext, get_current_user
from api.models import Car, Invitation, Passenger, Ride
from api.schemas import InvitationCreate, InvitationOut, RideOut
from api.utils.enums import InvitationStatus
from api.utils.security import generate_token

router = APIRouter()


@router.post("/", response_model=None)
def create_ride(
    request: Request,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> Any:
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.get("/", response_model=list[RideOut])
def get_my_rides(
    request: Request,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> list[RideOut]:
    rides = (
        db.query(Ride)
        .join(Passenger, Ride.id == Passenger.ride_id)
        .filter(Passenger.user_id == ctx.user.id)
        .all()
    )
    return [RideOut.model_validate(ride) for ride in rides]


@router.get("/{ride_id}", response_model=None)
def get_ride(
    ride_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> Any:
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.patch("/{ride_id}", response_model=None)
def update_ride(
    ride_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> Any:
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.delete("/{ride_id}", status_code=204)
def cancel_ride(
    ride_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> Response:
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.post("/{ride_id}/book", response_model=None)
def book_seat(
    ride_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> Any:
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.delete("/{ride_id}/book", status_code=204)
def cancel_booking(
    ride_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> Response:
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.get("/car/{car_id}", response_model=None)
def list_car_rides(
    car_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> Any:
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.post("/{ride_id}/invite", response_model=InvitationOut)
def invite_passenger(
    ride_id: UUID,
    invitation_in: InvitationCreate,
    request: Request,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> InvitationOut:
    """Invite a passanger to a ride."""
    ride = (
        db.query(Ride)
        .join(Car, Ride.car_id == Car.id)
        .filter(Ride.id == ride_id)
        .first()
    )
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found.")
    if ride.car.owner_id != ctx.user.id:
        raise HTTPException(
            status_code=403, detail="Only car owner can invite passengers."
        )
    if (
        ctx.user.email
        and str(invitation_in.invited_email).lower() == ctx.user.email.lower()
    ):
        raise HTTPException(status_code=400, detail="You cannot invite yourself.")
    if len(ride.passengers) >= len(ride.car.seats) - 1:  # -1 for driver!
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
