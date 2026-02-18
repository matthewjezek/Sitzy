from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from api.database import get_db
from api.deps import get_current_user
from api.models import Passenger, Ride, User
from api.schemas import RideOut

router = APIRouter()


# === Seznam mých jízd (kde jsem cestující) ===
@router.get("/rides", response_model=list[RideOut])
def get_my_rides(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[RideOut]:
    rides = (
        db.query(Ride)
        .join(Passenger, Ride.id == Passenger.ride_id)
        .filter(Passenger.user_id == current_user.id)
        .all()
    )
    return [RideOut.model_validate(ride) for ride in rides]
