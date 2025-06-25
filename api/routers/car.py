from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from api import models
from api.database import get_db
from api.deps import get_current_user
from api.models import Car, User
from api.schemas import CarBase, CarCreate, CarOut
from api.translations.utils import get_message

router = APIRouter()


# === Cesty pro správu aut ===
@router.get("/me", response_model=CarOut)
def read_my_car(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    car = db.query(Car).filter(Car.owner_id == current_user.id).first()
    if not car:
        raise HTTPException(status_code=404, detail=get_message("car_not_found", request.state.lang))
    return CarOut.from_orm_with_labels(car, lang=request.state.lang)


@router.post("/", response_model=CarOut)
def create_car(
    request: Request,
    car_in: CarCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.car:
        raise HTTPException(status_code=400, detail=get_message("user_has_car", request.state.lang))
    new_car = models.Car(**car_in.model_dump(), owner_id=current_user.id)
    db.add(new_car)
    db.commit()
    db.refresh(new_car)
    return new_car


@router.patch("/{car_id}", response_model=CarOut)
def change_car(
    request: Request,
    car_id: UUID,
    car_in: CarBase,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    car = db.query(models.Car).filter(models.Car.id == car_id).first()
    if not car or car.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail=get_message("car_not_yours", request.state.lang))

    car.name = car_in.name
    car.layout = car_in.layout
    car.date = car_in.date

    db.commit()
    db.refresh(car)
    return car


@router.delete("/{car_id}", status_code=204)
def delete_car(
    request: Request,
    car_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    car = db.query(models.Car).filter(models.Car.id == car_id).first()
    if not car or car.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail=get_message("car_not_yours", request.state.lang))

    db.delete(car)
    db.commit()
    return
