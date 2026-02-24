from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session, selectinload

from api import models
from api.database import get_db
from api.deps import UserContext, get_current_user
from api.models import Car
from api.schemas import CarBase, CarCreate, CarFullOut, CarOut

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
