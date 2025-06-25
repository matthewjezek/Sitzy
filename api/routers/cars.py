from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from api import models
from api.database import get_db
from api.deps import get_current_user
from api.models import Car, Passenger, User
from api.schemas import (
    CarBase,
    CarCreate,
    CarFullOut,
    CarOut,
    InvitationCreate,
    InvitationOut,
    SeatOut,
    UserOut,
)
from api.translations.localization_utils import get_message
from api.utils.enums import InvitationStatus
from api.utils.security import generate_token

router = APIRouter()


# === Získání auta aktuálního uživatele ===
@router.get("/me", response_model=CarFullOut)
def read_my_car(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CarFullOut:
    if not current_user.car:
        raise HTTPException(status_code=404, detail="Uživatel zatím nemá auto.")

    car = db.query(Car).filter(Car.id == current_user.car.id).first()
    db.refresh(car)

    return CarFullOut.from_orm_with_labels(car, lang=request.state.lang)


# === Vytvoření nového auta ===
@router.post("/", response_model=CarOut)
def create_car(
    request: Request,
    car_in: CarCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> CarOut:
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
) -> CarOut:
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
) -> Response:
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
) -> InvitationOut:
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


# === Získání všech účastníků auta ===
@router.get("/participants", response_model=list[UserOut])
def list_participants(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[UserOut]:
    if not current_user.car:
        raise HTTPException(status_code=404, detail="Nemáte vlastní auto.")

    car = current_user.car
    participant_ids = [seat.user_id for seat in car.seats] + [car.owner_id]

    users = db.query(User).filter(User.id.in_(participant_ids)).all()
    return [UserOut.model_validate(u) for u in users]


# === Moje místo ===
@router.get("/seats/me", response_model=SeatOut)
def get_my_seat(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SeatOut:
    if not current_user.seat:
        raise HTTPException(status_code=404, detail="Nemáte přiřazené místo.")

    return SeatOut.model_validate(current_user.seat)


# === Získání aut, kde je uživatel cestující ===
@router.get("/as-passenger", response_model=list[CarOut])
def get_passenger_cars(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CarOut]:
    cars = (
        db.query(Car)
        .join(Passenger)
        .filter(Passenger.user_id == current_user.id)
        .order_by(Car.date.desc())
        .all()
    )
    return [CarOut.from_orm_with_labels(car, request.state.lang) for car in cars]
