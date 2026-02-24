from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session, selectinload

from api import models
from api.database import get_db
from api.deps import UserContext, get_current_user
from api.models import Car, Invitation, Ride
from api.schemas import (
    CarBase,
    CarCreate,
    CarFullOut,
    CarOut,
    InvitationCreate,
    InvitationOut,
)
from api.utils.enums import InvitationStatus
from api.utils.security import generate_token

router = APIRouter()


# === Seznam mých aut (kde jsem vlastníkem) ===
@router.get("/", response_model=list[CarOut])
def list_my_cars(
    request: Request,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> list[CarOut]:
    cars = db.query(Car).filter(Car.owner_id == ctx.user.id).all()
    return [CarOut.from_orm_with_labels(car) for car in cars]


@router.post("/{ride_id}/invite", response_model=InvitationOut)
def invite_passenger(
    ride_id: UUID,
    invitation_in: InvitationCreate,
    request: Request,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> InvitationOut:
    ride = db.query(Ride).join(Car).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found.")
    if ride.car.owner_id != ctx.user.id:
        raise HTTPException(
            status_code=403, detail="Only car owner can invite passengers."
        )
    if ctx.user.email and invitation_in.invited_email.lower() == ctx.user.email.lower():
        raise HTTPException(status_code=400, detail="You cannot invite yourself.")

    existing = (
        db.query(Invitation)
        .filter_by(ride_id=ride_id, invited_email=str(invitation_in.invited_email))
        .filter(Invitation.status == InvitationStatus.PENDING)
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


# === Získání auta podle ID ===
@router.get("/{car_id}", response_model=CarFullOut)
def read_car_by_id(
    car_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
) -> CarFullOut:
    car = (
        db.query(Car).options(selectinload(Car.owner)).filter(Car.id == car_id).first()
    )
    if not car:
        raise HTTPException(status_code=404, detail="Car not found.")

    db.refresh(car)
    return CarFullOut.from_orm_with_labels(car)


# === Vytvoření nového auta ===
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
    new_car = models.Car(**car_in.model_dump(), owner_id=ctx.user.id)
    db.add(new_car)
    db.commit()
    db.refresh(new_car)
    return CarOut.from_orm_with_labels(new_car)


# === Úpravy auta ===
@router.patch("/{car_id}", response_model=CarOut)
def change_car(
    request: Request,
    car_id: UUID,
    car_in: CarBase,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> CarOut:
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


# === Smazání auta ===
@router.delete("/{car_id}", status_code=204)
def delete_car(
    request: Request,
    car_id: UUID,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> Response:
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
    raise HTTPException(status_code=501, detail="Driver transfer not implemented yet")
