from uuid import UUID
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session, selectinload

from api import models
from api.database import get_db
from api.deps import get_current_user
from api.models import Car, Invitation, Passenger, User
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
from api.utils.enums import InvitationStatus
from api.utils.security import generate_token

router = APIRouter()


# === Získání auta aktuálního uživatele ===
@router.get("/my", response_model=CarFullOut)
def read_my_car(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CarFullOut:
    if not current_user.car:
        raise HTTPException(status_code=404, detail="User has no car.")

    car = db.query(Car).options(selectinload(Car.owner)).filter(Car.id == current_user.car.id).first()
    db.refresh(car)

    return CarFullOut.from_orm_with_labels(car)


# === Získání auta, kde jsem cestujícím ===
@router.get("/as-passenger", response_model=CarFullOut | None)
def read_passenger_car(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CarFullOut | None:
    # Najdi auto, kde jsem cestujícím
    passenger_entry = db.query(Passenger).filter(Passenger.user_id == current_user.id).first()
    if not passenger_entry:
        return None
    
    car = db.query(Car).options(selectinload(Car.owner)).filter(Car.id == passenger_entry.car_id).first()
    if not car:
        return None
    
    db.refresh(car)
    return CarFullOut.from_orm_with_labels(car)


# === Získání auta podle ID ===
@router.get("/{car_id}", response_model=CarFullOut)
def read_car_by_id(
    car_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
) -> CarFullOut:
    car = db.query(Car).options(selectinload(Car.owner)).filter(Car.id == car_id).first()
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
    current_user: models.User = Depends(get_current_user),
) -> CarOut:
    if current_user.car:
        raise HTTPException(status_code=400, detail="User already has a car.")
    new_car = models.Car(**car_in.model_dump(), owner_id=current_user.id)
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
    current_user: models.User = Depends(get_current_user),
) -> CarOut:
    car = db.query(models.Car).filter(models.Car.id == car_id).first()
    if not car or car.owner_id != current_user.id:
        raise HTTPException(
            status_code=404, detail="Car not found or does not belong to you."
        )

    car.name = car_in.name
    car.layout = car_in.layout
    car.date = car_in.date

    db.commit()
    db.refresh(car)
    return CarOut.from_orm_with_labels(car)


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
            status_code=404, detail="Car not found or does not belong to you."
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
            status_code=403, detail="Car not found or does not belong to you."
        )

    # Kontrola proti pozvání sebe sama
    if invitation_in.invited_email.lower() == current_user.email.lower():
        raise HTTPException(
            status_code=400, detail="You cannot invite yourself."
        )

    existing = (
        db.query(models.Invitation)
        .filter(
            models.Invitation.car_id == car.id,
            models.Invitation.invited_email == invitation_in.invited_email,
            models.Invitation.status == InvitationStatus.PENDING,
            models.Invitation.created_at == invitation_in.created_at,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400, detail="Invitation has already been sent to this email."
        )

    token = generate_token()
    
    # Nastavíme expires_at na 7 dní od vytvoření
    expires_at = invitation_in.created_at + timedelta(days=7)

    invitation = models.Invitation(
        car_id=car.id,
        invited_email=invitation_in.invited_email,
        created_at=invitation_in.created_at,
        expires_at=expires_at,
        token=token,
        status=invitation_in.status,
    )

    db.add(invitation)
    db.commit()
    db.refresh(invitation)

    return InvitationOut.from_orm_with_labels(invitation)


# === Seznam odeslaných pozvánek ===
@router.get("/{car_id}/invitations", response_model=list[InvitationOut])
def list_sent_invitations(
    car_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[InvitationOut]:
    car = (
        db.query(Car).filter(Car.id == car_id, Car.owner_id == current_user.id).first()
    )
    if not car:
        raise HTTPException(
            status_code=404, detail="Car not found or does not belong to you."
        )

    invitations = db.query(Invitation).filter(Invitation.car_id == car.id).all()
    return [InvitationOut.from_orm_with_labels(inv) for inv in invitations]


# === Získání všech účastníků auta ===
@router.get("/participants", response_model=list[UserOut])
def list_participants(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[UserOut]:
    if not current_user.car:
        raise HTTPException(status_code=404, detail="User has no car.")

    car = current_user.car
    participant_ids = [seat.user_id for seat in car.seats] + [car.owner_id]

    users = db.query(User).filter(User.id.in_(participant_ids)).all()
    return [UserOut.model_validate(u) for u in users]


# === Moje místo ===
@router.get("/seats/my", response_model=SeatOut)
def get_my_seat(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SeatOut:
    if not current_user.seat:
        raise HTTPException(status_code=404, detail="User has no assigned seat.")

    return SeatOut.model_validate(current_user.seat)
