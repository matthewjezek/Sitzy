from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from api.database import get_db
from api.deps import get_current_user
from api.models import Seat, User
from api.schemas import SeatBase, SeatOut

router = APIRouter()


# === Získání všech sedadel konkrétního auta ===
@router.get("/", response_model=list[SeatOut])
def get_seats(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[SeatOut]:
    if not current_user.passenger_entries:
        raise HTTPException(
            status_code=400, detail="User is not a passenger"
        )

    car_id = current_user.passenger_entries[0].car_id
    seats = db.query(Seat).filter_by(car_id=car_id).all()
    return [SeatOut.model_validate(seat) for seat in seats]


# === Výběr sedadla ===
@router.post("/choose", response_model=SeatOut, status_code=status.HTTP_201_CREATED)
def choose_seat(
    seat_in: SeatBase,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SeatOut:
    if not current_user.passenger_entries:
        raise HTTPException(
            status_code=400, detail="User is not a passenger"
        )

    car_id = current_user.passenger_entries[0].car_id

    existing_seat = (
        db.query(Seat).filter_by(car_id=car_id, position=seat_in.position).first()
    )
    if existing_seat:
        raise HTTPException(
            status_code=400,
            detail="Seat already taken",
        )

    if current_user.seat:
        raise HTTPException(
            status_code=400,
            detail="Seat already taken",
        )

    new_seat = Seat(car_id=car_id, user_id=current_user.id, position=seat_in.position)
    db.add(new_seat)
    db.commit()
    db.refresh(new_seat)
    return SeatOut.model_validate(new_seat)


# === Uvolnění sedadla ===
@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
def leave_seat(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    seat = current_user.seat
    if not seat:
        raise HTTPException(
            status_code=404,
            detail="No seat found",
        )

    db.delete(seat)
    db.commit()


# === Změna sedadla ===
@router.patch("/change", response_model=SeatOut)
def change_seat(
    seat_in: SeatBase,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SeatOut:
    if not current_user.seat:
        raise HTTPException(
            status_code=400,
            detail="No seat to change",
        )

    current_seat = current_user.seat
    if current_seat.position == seat_in.position:
        raise HTTPException(
            status_code=400,
            detail="Already on this seat",
        )

    existing = (
        db.query(Seat)
        .filter_by(car_id=current_seat.car_id, position=seat_in.position)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Seat already taken",
        )

    current_seat.position = seat_in.position
    db.commit()
    db.refresh(current_seat)
    return SeatOut.from_orm_with_labels(current_seat)
