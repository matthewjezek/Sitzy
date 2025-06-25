from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from api.database import get_db
from api.deps import get_current_user
from api.models import Invitation, User
from api.schemas import CarOut, DashboardOut, InvitationOut

router = APIRouter()


# === Získání dashboardu aktuálního uživatele ===
@router.get("/", response_model=DashboardOut)
def get_dashboard(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardOut:
    lang = request.state.lang

    # Auto, které vlastním
    owned_car = None
    if current_user.car:
        owned_car = CarOut.from_orm_with_labels(current_user.car, lang)

    # Auta, kam jsem pozván jako pasažér
    cars_as_passenger = [
        CarOut.from_orm_with_labels(p.car, lang) for p in current_user.passenger_entries
    ]

    # Čekající pozvánky
    pending_invitations = (
        db.query(Invitation)
        .filter(
            Invitation.invited_email.ilike(current_user.email),
            Invitation.status == "pending",
        )
        .all()
    )
    invitations_out = [
        InvitationOut.from_orm_with_labels(inv, lang) for inv in pending_invitations
    ]

    return DashboardOut(
        owned_car=owned_car,
        passenger_cars=cars_as_passenger,
        pending_invitations=invitations_out,
    )
