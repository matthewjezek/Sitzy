from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from api import models
from api.database import get_db
from api.deps import get_current_user
from api.enums import InvitationStatus
from api.models import Car, User
from api.schemas import CarBase, CarCreate, CarOut, InvitationCreate, InvitationOut
from api.translations.localization_utils import get_message
from api.utils.security import generate_token

router = APIRouter()


# === Získání auta aktuálního uživatele ===
@router.get("/me", response_model=CarOut)
def read_my_car(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    car = db.query(Car).filter(Car.owner_id == current_user.id).first()
    if not car:
        raise HTTPException(
            status_code=404, detail=get_message("car_not_found", request.state.lang)
        )
    return CarOut.from_orm_with_labels(car, lang=request.state.lang)


# === Vytvoření nového auta ===
@router.post("/", response_model=CarOut)
def create_car(
    request: Request,
    car_in: CarCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.car:
        raise HTTPException(
            status_code=400, detail=get_message("user_has_car", request.state.lang)
        )
    new_car = models.Car(**car_in.model_dump(), owner_id=current_user.id)
    db.add(new_car)
    db.commit()
    db.refresh(new_car)
    return CarOut.from_orm_with_labels(new_car, lang=request.state.lang)


# === Úpravy auta ===
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
        raise HTTPException(
            status_code=404, detail=get_message("car_not_yours", request.state.lang)
        )

    car.name = car_in.name
    car.layout = car_in.layout
    car.date = car_in.date

    db.commit()
    db.refresh(car)
    return CarOut.from_orm_with_labels(car, lang=request.state.lang)


# === Smazání auta ===
@router.delete("/{car_id}", status_code=204)
def delete_car(
    request: Request,
    car_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    car = db.query(models.Car).filter(models.Car.id == car_id).first()
    if not car or car.owner_id != current_user.id:
        raise HTTPException(
            status_code=404, detail=get_message("car_not_yours", request.state.lang)
        )

    db.delete(car)
    db.commit()
    return Response(status_code=204)


# === Vytvoření pozvánky pro auto ===
@router.post("/{car_id}/invite", response_model=InvitationOut)
def create_invitation(
    car_id: UUID,
    request: Request,
    invitation_in: InvitationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    car = db.query(models.Car).filter(models.Car.id == car_id).first()
    if not car or car.owner_id != current_user.id:
        raise HTTPException(
            status_code=403, detail=get_message("car_not_yours", request.state.lang)
        )

    existing = (
        db.query(models.Invitation)
        .filter(
            models.Invitation.car_id == car.id,
            models.Invitation.invited_email == invitation_in.invited_email,
            models.Invitation.status == InvitationStatus.PENDING,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400, detail=get_message("invitation_exists", request.state.lang)
        )

    token = generate_token()

    invitation = models.Invitation(
        car_id=car.id,
        invited_email=invitation_in.invited_email,
        token=token,
        status=InvitationStatus.PENDING,
    )

    db.add(invitation)
    db.commit()
    db.refresh(invitation)

    return InvitationOut.from_orm_with_labels(invitation, lang=request.state.lang)
