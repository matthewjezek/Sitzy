from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from api import models
from api.database import get_db
from api.deps import get_current_user
from api.enums import InvitationStatus
from api.models import User
from api.schemas import InvitationOut
from api.translations.localization_utils import get_message

router = APIRouter(prefix="/invitations")


# === Získání pozvánky podle tokenu (např. z odkazu v e-mailu) ===
@router.get("/{token}", response_model=InvitationOut)
def get_invitation_by_token(
    token: str,
    request: Request,
    db: Session = Depends(get_db),
) -> InvitationOut:
    invitation = (
        db.query(models.Invitation).filter(models.Invitation.token == token).first()
    )

    if not invitation:
        raise HTTPException(
            status_code=404,
            detail=get_message("invitation_not_found", request.state.lang),
        )

    return InvitationOut.from_orm_with_labels(invitation, lang=request.state.lang)


# === Přijetí nebo odmítnutí pozvánky ===
@router.patch("/{token}", response_model=InvitationOut)
def respond_to_invitation(
    token: str,
    request: Request,
    accepted: bool,
    db: Session = Depends(get_db),
) -> InvitationOut:
    invitation = (
        db.query(models.Invitation).filter(models.Invitation.token == token).first()
    )

    if not invitation:
        raise HTTPException(
            status_code=404,
            detail=get_message("invitation_not_found", request.state.lang),
        )

    if invitation.status != InvitationStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=get_message("invitation_already_responded", request.state.lang),
        )

    invitation.status = (
        InvitationStatus.ACCEPTED if accepted else InvitationStatus.REJECTED
    )
    db.commit()
    db.refresh(invitation)

    return InvitationOut.from_orm_with_labels(invitation, lang=request.state.lang)


# === Zneplatnění pozvánky ===
@router.delete("/{token}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_invitation(
    token: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    invitation = (
        db.query(models.Invitation)
        .join(models.Car)
        .filter(models.Invitation.token == token)
        .first()
    )

    if not invitation:
        raise HTTPException(
            status_code=404,
            detail=get_message("invitation_not_found", request.state.lang),
        )

    if invitation.car.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail=get_message("not_car_owner", request.state.lang),
        )

    db.delete(invitation)
    db.commit()
