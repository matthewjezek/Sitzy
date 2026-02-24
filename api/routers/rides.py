from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response
from sqlalchemy.orm import Session

from api.database import get_db
from api.deps import UserContext, get_current_user
from api.models import Passenger, Ride
from api.schemas import RideOut

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
