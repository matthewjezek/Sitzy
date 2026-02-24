from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from api.database import get_db
from api.deps import get_current_user, UserContext
from api.models import Car, Invitation, Passenger
from api.schemas import InvitationOut, UserOut
from api.utils.enums import InvitationStatus

router = APIRouter()


# === Získání pozvánek aktuálního uživatele ===
@router.get("/received", response_model=list[InvitationOut])
def get_received_invitations(
    request: Request,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> list[InvitationOut]:
    if not ctx.user.email:
        return []
    invitations = (
        db.query(Invitation)
        .filter(Invitation.invited_email.ilike(ctx.user.email))
        .order_by(Invitation.created_at.desc())
        .all()
    )
    return [InvitationOut.from_orm_with_labels(inv) for inv in invitations]


# === Zneplatnění pozvánky ===
@router.delete("/{token}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_invitation(
    token: str,
    request: Request,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> None:
    invitation = (
        db.query(Invitation).join(Car).filter(Invitation.token == token).first()
    )

    if not invitation:
        raise HTTPException(
            status_code=404,
            detail="Invitation not found.",
        )

    if invitation.car.owner_id != ctx.user.id:
        raise HTTPException(
            status_code=403,
            detail="User is not the owner of this car.",
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
            detail="Invitation not found.",
        )
    return InvitationOut.from_orm_with_labels(invitation)


# === Přijetí pozvánky ===
@router.post("/{token}/accept", response_model=UserOut)
def accept_invitation(
    token: str,
    request: Request,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> UserOut:
    invitation = db.query(Invitation).filter(Invitation.token == token).first()
    if not invitation:
        raise HTTPException(
            status_code=404,
            detail="Invitation not found.",
        )
    if invitation.status != InvitationStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail="Invitation has already been processed.",
        )
    if invitation.invited_email.lower() != ctx.user.email.lower():
        raise HTTPException(
            status_code=403, detail="User is not the owner of this car."
        )

    # Aktualizace stavu
    invitation.status = InvitationStatus.ACCEPTED
    passenger = Passenger(user_id=ctx.user.id, car_id=invitation.car_id)
    existing = (
        db.query(Passenger)
        .filter_by(user_id=ctx.user.id, car_id=invitation.car_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="User is already in the car.")
    db.add(passenger)
    db.commit()
    return UserOut.model_validate(ctx.user)


# === Odmítnutí pozvánky ===
@router.post("/{token}/reject")
def reject_invitation(
    token: str,
    request: Request,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> dict[str, str]:
    invitation = db.query(Invitation).filter(Invitation.token == token).first()
    if not invitation:
        raise HTTPException(
            status_code=404,
            detail="Invitation not found.",
        )
    if invitation.status != InvitationStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail="Invitation has already been processed.",
        )
    if not ctx.user.email or invitation.invited_email.lower() != ctx.user.email.lower():
        raise HTTPException(
            status_code=403, detail="This is not your invitation."
        )

    # Odmítnutí
    invitation.status = InvitationStatus.REJECTED
    db.commit()
    return {"detail": "Invitation has been successfully rejected."}
