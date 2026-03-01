from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session, selectinload

from api import models
from api.database import get_db
from api.deps import UserContext, get_current_user
from api.models import Car, Ride
from api.schemas import (
    CarBase,
    CarCreate,
    CarFullOut,
    CarOut,
    RideOut,
)

router = APIRouter()


@router.get("/", response_model=list[CarOut])
def list_my_cars(
    request: Request,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> list[CarOut]:
    """List of cars owned by the current user."""
    cars = db.query(Car).filter(Car.owner_id == ctx.user.id).all()
    return [CarOut.from_orm_with_labels(car) for car in cars]


@router.get("/{car_id}", response_model=CarFullOut)
def read_car_by_id(
    car_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> CarFullOut:
    """Get complete info about a car by its ID."""
    car = (
        db.query(Car)
        .options(
            selectinload(Car.owner),
            selectinload(Car.seats),
            selectinload(Car.drivers),
            selectinload(Car.rides),
        )
        .filter(Car.id == car_id)
        .first()
    )
    if not car:
        raise HTTPException(status_code=404, detail="Car not found.")
    if car.owner_id != ctx.user.id:
        raise HTTPException(status_code=403, detail="This car does not belong to you.")

    db.refresh(car)
    return CarFullOut.from_orm_with_labels(car)


@router.post(
    "/",
    response_model=CarOut,
)
def create_car(
    request: Request,
    car_in: CarCreate,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> CarOut:
    """Create a new car"""
    new_car = models.Car(**car_in.model_dump(), owner_id=ctx.user.id)
    db.add(new_car)
    db.commit()
    db.refresh(new_car)
    return CarOut.from_orm_with_labels(new_car)


@router.patch("/{car_id}", response_model=CarOut)
def change_car(
    request: Request,
    car_id: UUID,
    car_in: CarBase,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> CarOut:
    """Update car info."""
    car = db.query(models.Car).filter(models.Car.id == car_id).first()
    if not car or car.owner_id != ctx.user.id:
        raise HTTPException(
            status_code=404, detail="Car not found or does not belong to you."
        )

    car.name = car_in.name
    car.layout = car_in.layout

    db.commit()
    db.refresh(car)
    return CarOut.from_orm_with_labels(car)


@router.delete("/{car_id}", status_code=204)
def delete_car(
    request: Request,
    car_id: UUID,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> Response:
    """Delete a car."""
    car = db.query(models.Car).filter(models.Car.id == car_id).first()
    if not car or car.owner_id != ctx.user.id:
        raise HTTPException(
            status_code=404, detail="Car not found or does not belong to you."
        )

    db.delete(car)
    db.commit()
    return Response(status_code=204)


@router.post("/{car_id}/transfer-driver")
def transfer_driver(
    car_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> dict[str, str]:
    """Transfer car driver role to another invited user."""
    raise HTTPException(status_code=501, detail="Driver transfer not implemented yet")


@router.get("/{car_id}/rides", response_model=list[RideOut])
def list_car_rides(
    car_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> list[RideOut]:
    """List of rides for a car."""
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car or car.owner_id != ctx.user.id:
        raise HTTPException(
            status_code=403, detail="Car not found or does not belong to you."
        )
    rides = (
        db.query(Ride)
        .filter(Ride.car_id == car_id)
        .order_by(Ride.departure_time.asc())
        .all()
    )
    return [RideOut.model_validate(ride) for ride in rides]
