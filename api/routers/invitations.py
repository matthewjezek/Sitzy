from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from api.database import get_db
from api.deps import get_current_user
from api.enums import InvitationStatus
from api.models import Car, Invitation, User
from api.schemas import InvitationOut, UserOut
from api.translations.localization_utils import get_message

router = APIRouter(prefix="/invitations")


# === Zneplatnění pozvánky ===
@router.delete("/{token}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_invitation(
    token: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    invitation = (
        db.query(Invitation).join(Car).filter(Invitation.token == token).first()
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


# === Získání pozvánky podle tokenu ===
@router.get("/{token}", response_model=InvitationOut)
def get_invitation(
    token: str, request: Request, db: Session = Depends(get_db)
) -> InvitationOut:
    invitation = db.query(Invitation).filter(Invitation.token == token).first()
    if not invitation:
        raise HTTPException(
            status_code=404,
            detail=get_message("invitation_not_found", request.state.lang),
        )
    return InvitationOut.from_orm_with_labels(invitation, request.state.lang)


# === Přijetí pozvánky ===
@router.post("/{token}/accept", response_model=UserOut)
def accept_invitation(
    token: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserOut:
    invitation = db.query(Invitation).filter(Invitation.token == token).first()
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
    if invitation.invited_email.lower() != current_user.email.lower():
        raise HTTPException(
            status_code=403, detail=get_message("not_car_owner", request.state.lang)
        )
    if current_user.car is not None:
        raise HTTPException(
            status_code=400, detail=get_message("user_has_car", request.state.lang)
        )

    # Aktualizace stavu
    invitation.status = InvitationStatus.ACCEPTED
    current_user.car = invitation.car_id
    db.commit()
    return UserOut.model_validate(current_user)


# === Odmítnutí pozvánky ===
@router.post("/{token}/reject")
def reject_invitation(
    token: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    invitation = db.query(Invitation).filter(Invitation.token == token).first()
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
    if invitation.invited_email.lower() != current_user.email.lower():
        raise HTTPException(
            status_code=403, detail=get_message("not_car_owner", request.state.lang)
        )

    # Odmítnutí
    invitation.status = InvitationStatus.REJECTED
    db.commit()
    return {"message": get_message("invitation_rejected", request.state.lang)}
