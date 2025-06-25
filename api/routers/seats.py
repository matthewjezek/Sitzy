from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from api.database import get_db
from api.deps import get_current_user
from api.models import Seat, User
from api.schemas import SeatBase, SeatOut
from api.translations.localization_utils import get_message

router = APIRouter()


@router.get("/seats", response_model=list[SeatOut])
def get_seats(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[SeatOut]:
    if not current_user.passenger_entries:
        raise HTTPException(
            status_code=400, detail=get_message("not_passenger", request.state.lang)
        )

    car_id = current_user.passenger_entries[0].car_id
    seats = db.query(Seat).filter_by(car_id=car_id).all()
    return [SeatOut.model_validate(seat) for seat in seats]


@router.post(
    "/seats/choose", response_model=SeatOut, status_code=status.HTTP_201_CREATED
)
def choose_seat(
    seat_in: SeatBase,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SeatOut:
    if not current_user.passenger_entries:
        raise HTTPException(
            status_code=400, detail=get_message("not_passenger", request.state.lang)
        )

    car_id = current_user.passenger_entries[0].car_id

    existing_seat = (
        db.query(Seat).filter_by(car_id=car_id, position=seat_in.position).first()
    )
    if existing_seat:
        raise HTTPException(
            status_code=400,
            detail=get_message("seat_already_taken", request.state.lang),
        )

    if current_user.seat:
        raise HTTPException(
            status_code=400,
            detail=get_message("seat_already_taken", request.state.lang),
        )

    new_seat = Seat(car_id=car_id, user_id=current_user.id, position=seat_in.position)
    db.add(new_seat)
    db.commit()
    db.refresh(new_seat)
    return SeatOut.model_validate(new_seat)


@router.delete("/seats/me", status_code=status.HTTP_204_NO_CONTENT)
def release_seat(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    if not current_user.seat:
        raise HTTPException(
            status_code=404, detail=get_message("user_not_in_seat", request.state.lang)
        )

    db.delete(current_user.seat)
    db.commit()
