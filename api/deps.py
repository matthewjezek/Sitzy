from dataclasses import dataclass
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from api.config import settings
from api.database import get_db
from api.models import SocialSession, User

# Cesta k tokenu (standardní schema „Bearer <token>“)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


@dataclass
class UserContext:
    """Current user context with a session_id."""

    user: User
    session_id: UUID


# Get current user from JWT token
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> UserContext:
    """Decode JWT token and validate session in DB."""

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        user_id = payload.get("sub")
        session_id = payload.get("session_id")
        token_type = payload.get("type")

        if (
            not isinstance(user_id, str)
            or not isinstance(session_id, str)
            or token_type != "access"
        ):
            raise credentials_exception

        user_uuid = UUID(user_id)
        session_uuid = UUID(session_id)
    except (JWTError, ValueError):
        raise credentials_exception

    user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        raise credentials_exception

    # Validate session exists, not revoked, and not expired
    session = (
        db.query(SocialSession)
        .filter(
            SocialSession.id == session_uuid,
            SocialSession.revoked_at.is_(None),
        )
        .first()
    )
    if not session:
        raise credentials_exception

    return UserContext(user=user, session_id=session_uuid)
