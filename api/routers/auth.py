import os
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from api import models
from api.database import get_db
from api.deps import get_current_user
from api.schemas import UserCreate, UserLogin, UserOut
from api.translations.localization_utils import get_message
from api.utils.security import create_access_token, get_password_hash, verify_password

router = APIRouter()

# === JWT nastavení ===
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 týden


# === Registrace ===
@router.post("/register", response_model=UserOut)
def register(
    request: Request, user_in: UserCreate, db: Session = Depends(get_db)
) -> UserOut:
    user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400, detail=get_message("email_registered", request.state.lang)
        )

    hashed_password = get_password_hash(user_in.password)
    new_user = models.User(email=user_in.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return UserOut.model_validate(new_user)


# === Přihlášení ===
@router.post("/login")
def login(
    request: Request, user_in: UserLogin, db: Session = Depends(get_db)
) -> dict[str, Any]:
    user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=401, detail=get_message("login_failed", request.state.lang)
        )

    token = create_access_token(
        {"sub": str(user.id)}, expires_delta=ACCESS_TOKEN_EXPIRE_MINUTES, secret_key=SECRET_KEY, algorithm=ALGORITHM
    )
    return {"access_token": token, "token_type": "bearer"}


# === Získání aktuálního uživatele ===
@router.get("/me", response_model=UserOut)
def read_me(current_user: models.User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(current_user)
