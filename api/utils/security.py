import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Optional
from uuid import UUID

from api.config import settings
from jose import jwt, JWTError

# JWT settings
SECRET_KEY = settings.secret_key
REFRESH_SECRET_KEY = settings.refresh_secret_key
ALGORITHM = settings.algorithm


def create_access_token(
    data: dict[str, Any],
    expires_delta: Optional[timedelta] = None,
    secret_key: str = SECRET_KEY,
    algorithm: str = ALGORITHM,
) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, secret_key, algorithm=algorithm)


def create_refresh_token(user_id: UUID, session_id: UUID) -> str:
    """Create a JWT refresh token."""
    expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    payload = {
        "sub": str(user_id),
        "session_id": str(session_id),
        "type": "refresh",
        "exp": expire,
    }
    return jwt.encode(payload, REFRESH_SECRET_KEY, algorithm=ALGORITHM)


def decode_refresh_token(token: str) -> dict[str, Any]:
    """Decode and validate refresh token."""
    payload = jwt.decode(token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
    if payload.get("type") != "refresh":
        raise JWTError("Invalid token type")
    return payload


def generate_token(length: int = 32) -> str:
    return secrets.token_urlsafe(length)
