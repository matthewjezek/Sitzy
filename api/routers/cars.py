from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session, selectinload

from api import models
from api.database import get_db
from api.deps import UserContext, get_current_user
from api.models import Car, Ride, Seat
from api.schemas import (
    CarBase,
    CarCreate,
    CarFullOut,
    CarOut,
    RideOut,
)
from api.utils.logging_config import get_logger
from api.utils.seats import get_layout_seat_positions

router = APIRouter()
logger = get_logger(__name__)


@router.get("/", response_model=list[CarOut])
def list_my_cars(
    request: Request,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> list[CarOut]:
    """List of cars owned by the current user."""
    cars = db.query(Car).filter(Car.owner_id == ctx.user.id).all()
    logger.debug("Cars listed", extra={"user_id": str(ctx.user.id), "count": len(cars)})
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
            selectinload(Car.rides).selectinload(Ride.car_driver),
        )
        .filter(Car.id == car_id)
        .first()
    )
    if not car or car.owner_id != ctx.user.id:
        logger.warning(
            "Car access denied - not owner",
            extra={"user_id": str(ctx.user.id), "car_id": str(car_id)},
        )
        raise HTTPException(
            status_code=404, detail="Car not found or does not belong to you."
        )

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
    db.flush()

    for position in get_layout_seat_positions(new_car.layout):
        db.add(Seat(car_id=new_car.id, position=position))

    db.commit()
    db.refresh(new_car)
    logger.info(
        "Car created",
        extra={
            "user_id": str(ctx.user.id),
            "car_id": str(new_car.id),
            "name": new_car.name,
        },
    )
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
        logger.warning(
            "Car update denied - not found or not owner",
            extra={"user_id": str(ctx.user.id), "car_id": str(car_id)},
        )
        raise HTTPException(
            status_code=404, detail="Car not found or does not belong to you."
        )

    layout_changed = car.layout != car_in.layout
    car.name = car_in.name
    car.layout = car_in.layout

    if layout_changed:
        db.query(Seat).filter(Seat.car_id == car.id).delete()
        for position in get_layout_seat_positions(car.layout):
            db.add(Seat(car_id=car.id, position=position))

    db.commit()
    db.refresh(car)
    logger.info(
        "Car updated", extra={"user_id": str(ctx.user.id), "car_id": str(car_id)}
    )
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
        logger.warning(
            "Car deletion denied - not found or not owner",
            extra={"user_id": str(ctx.user.id), "car_id": str(car_id)},
        )
        raise HTTPException(
            status_code=404, detail="Car not found or does not belong to you."
        )

    db.delete(car)
    db.commit()
    logger.info(
        "Car deleted", extra={"user_id": str(ctx.user.id), "car_id": str(car_id)}
    )
    return Response(status_code=204)


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
        logger.warning(
            "Car rides access denied - not found or not owner",
            extra={"user_id": str(ctx.user.id), "car_id": str(car_id)},
        )
        raise HTTPException(
            status_code=403, detail="Car not found or does not belong to you."
        )
    rides = (
        db.query(Ride)
        .filter(Ride.car_id == car_id)
        .order_by(Ride.departure_time.asc())
        .all()
    )
    logger.debug(
        "Car rides listed",
        extra={"user_id": str(ctx.user.id), "car_id": str(car_id), "count": len(rides)},
    )
    return [RideOut.from_ride(ride) for ride in rides]
