from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from api.database import get_db
from api.deps import UserContext, get_current_user
from api.models import Car, Invitation, Passenger, Ride
from api.schemas import InvitationOut, PassengerSeatIn, UserOut
from api.utils.enums import InvitationStatus

router = APIRouter()


@router.get("/received", response_model=list[InvitationOut])
def get_received_invitations(
    request: Request,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> list[InvitationOut]:
    """List of invitations received by the current user."""
    if not ctx.user.email:
        return []
    invitations = (
        db.query(Invitation)
        .filter(Invitation.invited_email.ilike(ctx.user.email))
        .order_by(Invitation.created_at.desc())
        .all()
    )
    return [InvitationOut.from_orm_with_labels(inv) for inv in invitations]


@router.get("/ride/{ride_id}", response_model=list[InvitationOut])
def get_ride_invitations(
    ride_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> list[InvitationOut]:
    """List of invitations for a specific ride (only for car owner)."""
    ride = db.query(Ride).join(Car).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found.")
    if ride.car.owner_id != ctx.user.id:
        raise HTTPException(
            status_code=403, detail="User is not the owner of this car."
        )
    invitations = (
        db.query(Invitation)
        .filter(Invitation.ride_id == ride_id)
        .order_by(Invitation.created_at.desc())
        .all()
    )
    return [InvitationOut.from_orm_with_labels(inv) for inv in invitations]


@router.delete("/{token}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_invitation(
    token: str,
    request: Request,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> None:
    """Cancel an invitation."""
    invitation = (
        db.query(Invitation)
        .join(Ride)
        .join(Car)
        .filter(Invitation.token == token)
        .first()
    )
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found.")
    if invitation.ride.car.owner_id != ctx.user.id:
        raise HTTPException(
            status_code=403, detail="User is not the owner of this car."
        )

    db.delete(invitation)
    db.commit()


@router.get("/{token}", response_model=InvitationOut)
def get_invitation(
    token: str,
    request: Request,
    db: Session = Depends(get_db),
) -> InvitationOut:
    """Get invitation details by token (public endpoint, no auth required)."""
    invitation = db.query(Invitation).filter(Invitation.token == token).first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found.")
    if invitation.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="Invitation has expired.")
    return InvitationOut.from_orm_with_labels(invitation)


@router.post("/{token}/accept", response_model=UserOut)
def accept_invitation(
    token: str,
    seat_in: PassengerSeatIn,
    request: Request,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> UserOut:
    """Accept an invitation and become a passenger on the ride."""
    invitation = db.query(Invitation).filter(Invitation.token == token).first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found.")
    if invitation.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="Invitation has expired.")
    if invitation.status != InvitationStatus.PENDING:
        raise HTTPException(
            status_code=400, detail="Invitation has already been processed."
        )
    if not ctx.user.email or invitation.invited_email.lower() != ctx.user.email.lower():
        raise HTTPException(status_code=403, detail="This is not your invitation.")

    existing = (
        db.query(Passenger)
        .filter_by(user_id=ctx.user.id, ride_id=invitation.ride_id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400, detail="User is already a passenger on this ride."
        )

    invitation.status = InvitationStatus.ACCEPTED
    passenger = Passenger(
        user_id=ctx.user.id,
        ride_id=invitation.ride_id,
        seat_position=seat_in.seat_position,
    )
    db.add(passenger)
    db.commit()
    return UserOut.model_validate(ctx.user)


@router.post("/{token}/reject")
def reject_invitation(
    token: str,
    request: Request,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> dict[str, str]:
    """Reject an invitation."""
    invitation = db.query(Invitation).filter(Invitation.token == token).first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found.")
    if invitation.status != InvitationStatus.PENDING:
        raise HTTPException(
            status_code=400, detail="Invitation has already been processed."
        )
    if not ctx.user.email or invitation.invited_email.lower() != ctx.user.email.lower():
        raise HTTPException(status_code=403, detail="This is not your invitation.")

    invitation.status = InvitationStatus.REJECTED
    db.commit()
    return {"detail": "Invitation has been successfully rejected."}
