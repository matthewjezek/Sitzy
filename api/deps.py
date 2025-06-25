import os
from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from api.database import get_db
from api.translations.localization_utils import get_message

# JWT nastavení
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
ALGORITHM = "HS256"

# Cesta k tokenu (standardní schema „Bearer <token>“)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# Funkce pro získání aktuálního uživatele
def get_current_user(
    request: Request,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    from api import \
        models  # Import uvnitř funkce kvůli vyhnutí se kruhovým importům

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=get_message("invalid_token", request.state.lang),
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not isinstance(user_id, str):
            raise credentials_exception
        user_uuid = UUID(user_id)
    except (JWTError, ValueError):
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == user_uuid).first()
    if not user:
        raise credentials_exception
    return user
