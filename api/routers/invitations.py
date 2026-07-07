from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from api.database import get_db
from api.deps import UserContext, get_current_user
from api.models import Car, Invitation, Passenger, Ride
from api.schemas import (
    InvitationOut,
    InvitationResolveOut,
    PassengerSeatInOptional,
    RideOut,
)
from api.utils.enums import InvitationStatus
from api.utils.integration_audit import emit_integration_event
from api.utils.logging_config import get_logger
from api.utils.seats import get_layout_seat_positions

router = APIRouter()
logger = get_logger(__name__)


def _assert_invitation_ride_not_past(invitation: Invitation) -> None:
    if invitation.ride.departure_time < datetime.now(timezone.utc):
        raise HTTPException(status_code=409, detail="Past rides are read-only.")


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
    logger.debug(
        "Invitations retrieved",
        extra={"user_id": str(ctx.user.id), "count": len(invitations)},
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
        logger.warning(
            "Invitation cancellation denied",
            extra={"user_id": str(ctx.user.id), "token": token},
        )
        raise HTTPException(
            status_code=403, detail="User is not the owner of this car."
        )

    _assert_invitation_ride_not_past(invitation)

    db.delete(invitation)
    db.commit()
    logger.info(
        "Invitation cancelled", extra={"user_id": str(ctx.user.id), "token": token}
    )


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


@router.get("/{token}/resolve", response_model=InvitationResolveOut)
def resolve_invitation_token(
    token: str,
    request: Request,
    db: Session = Depends(get_db),
) -> InvitationResolveOut:
    """Resolve invitation token into safe ride context for invite ingress route."""
    invitation = (
        db.query(Invitation).join(Ride).filter(Invitation.token == token).first()
    )
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found.")
    if invitation.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="Invitation has expired.")

    # Validate email match if authenticated
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token_str = auth_header.split(" ")[1]
        try:
            from jose import jwt

            from api.config import settings
            from api.models import User

            payload = jwt.decode(
                token_str, settings.secret_key, algorithms=[settings.algorithm]
            )
            user_id = payload.get("sub")
            if user_id:
                user = db.query(User).filter(User.id == UUID(user_id)).first()
                if (
                    user
                    and user.email
                    and invitation.invited_email.lower() != "public@sitzy.local"
                ):
                    if invitation.invited_email.lower() != user.email.lower():
                        raise HTTPException(
                            status_code=403,
                            detail=(
                                "Tato pozvánka je určena pro jiný účet. "
                                "Přihlaste se prosím správným účtem."
                            ),
                        )
        except HTTPException:
            raise
        except Exception:
            pass

    emit_integration_event(
        event="invite_link_resolved",
        metadata={
            "token_prefix": token[:8],
            "ride_id": str(invitation.ride_id),
            "status": invitation.status.value,
        },
        db=db,
    )
    db.commit()

    driver_name = None
    car_name = None
    if invitation.ride:
        car_driver = getattr(invitation.ride, "car_driver", None)
        driver = getattr(car_driver, "driver", None) if car_driver else None
        car = getattr(invitation.ride, "car", None)
        owner = getattr(car, "owner", None) if car else None

        if driver:
            driver_name = getattr(driver, "full_name", None)
        elif owner:
            driver_name = getattr(owner, "full_name", None)

        if car:
            car_name = getattr(car, "name", None)

    return InvitationResolveOut(
        ride_id=invitation.ride_id,
        status=invitation.status,
        expires_at=invitation.expires_at,
        destination=invitation.ride.destination if invitation.ride else None,
        departure_time=invitation.ride.departure_time if invitation.ride else None,
        driver_name=driver_name,
        car_name=car_name,
    )


@router.post("/{token}/accept", response_model=RideOut)
def accept_invitation(
    token: str,
    seat_in: PassengerSeatInOptional,
    request: Request,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> RideOut:
    """Accept an invitation and become a passenger on the ride.
    If seat_position is not provided, the first available seat is assigned."""
    invitation = db.query(Invitation).filter(Invitation.token == token).first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found.")
    if invitation.expires_at < datetime.now(timezone.utc):
        logger.warning(
            "Invitation acceptance denied - expired",
            extra={"user_id": str(ctx.user.id), "token": token},
        )
        raise HTTPException(status_code=410, detail="Invitation has expired.")
    _assert_invitation_ride_not_past(invitation)
    if invitation.status != InvitationStatus.PENDING:
        raise HTTPException(
            status_code=400, detail="Invitation has already been processed."
        )
    is_public_invite = invitation.invited_email.lower() == "public@sitzy.local"
    if not is_public_invite:
        if (
            not ctx.user.email
            or invitation.invited_email.lower() != ctx.user.email.lower()
        ):
            logger.warning(
                "Invitation acceptance denied - email mismatch",
                extra={"user_id": str(ctx.user.id), "token": token},
            )
            raise HTTPException(status_code=403, detail="This is not your invitation.")

    existing = (
        db.query(Passenger)
        .filter_by(user_id=ctx.user.id, ride_id=invitation.ride_id)
        .first()
    )
    if existing:
        logger.warning(
            "Invitation acceptance denied - already passenger",
            extra={"user_id": str(ctx.user.id), "ride_id": str(invitation.ride_id)},
        )
        raise HTTPException(
            status_code=400, detail="User is already a passenger on this ride."
        )

    ride = invitation.ride
    seat_positions = [s.position for s in ride.car.seats]
    if not seat_positions:
        seat_positions = get_layout_seat_positions(ride.car.layout)

    occupied = {p.seat_position for p in ride.passengers}
    occupied.add(1)
    available = [position for position in seat_positions if position not in occupied]

    if not available:
        raise HTTPException(status_code=400, detail="No available seats.")

    if seat_in.seat_position is None:
        seat_position = available[0]
    else:
        if seat_in.seat_position not in available:
            raise HTTPException(
                status_code=400,
                detail=f"Seat {seat_in.seat_position} is not available.",
            )
        seat_position = seat_in.seat_position

    if not is_public_invite:
        invitation.status = InvitationStatus.ACCEPTED
    passenger = Passenger(
        user_id=ctx.user.id,
        ride_id=invitation.ride_id,
        seat_position=seat_position,
    )
    db.add(passenger)
    db.commit()
    logger.info(
        "Invitation accepted",
        extra={
            "user_id": str(ctx.user.id),
            "ride_id": str(invitation.ride_id),
            "seat_position": seat_position,
            "token": token,
        },
    )
    db.refresh(ride)
    return RideOut.from_ride(ride)


@router.post("/{token}/reject", response_model=InvitationOut)
def reject_invitation(
    token: str,
    request: Request,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user),
) -> InvitationOut:
    """Reject an invitation."""
    invitation = db.query(Invitation).filter(Invitation.token == token).first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found.")
    if invitation.status != InvitationStatus.PENDING:
        raise HTTPException(
            status_code=400, detail="Invitation has already been processed."
        )
    _assert_invitation_ride_not_past(invitation)
    if not ctx.user.email or invitation.invited_email.lower() != ctx.user.email.lower():
        logger.warning(
            "Invitation rejection denied - email mismatch",
            extra={"user_id": str(ctx.user.id), "token": token},
        )
        raise HTTPException(status_code=403, detail="This is not your invitation.")

    invitation.status = InvitationStatus.REJECTED
    db.commit()
    logger.info(
        "Invitation rejected", extra={"user_id": str(ctx.user.id), "token": token}
    )
    return InvitationOut.from_orm_with_labels(invitation)
