import os
from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from api import models
from api.database import get_db
from api.deps import get_current_user
from api.schemas import UserOut

router = APIRouter()

# === JWT nastavení ===
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 týden


# === Získání aktuálního uživatele ===
@router.get("/me", response_model=UserOut)
def read_me(current_user: models.User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(current_user)


# === OAuth Login - Facebook ===
@router.post("/oauth/facebook")
def oauth_facebook_login(request: Request):
    """
    Initiate Facebook OAuth flow.
    
    TODO: Implement Facebook OAuth:
    - Generate state token for CSRF protection
    - Redirect to Facebook authorization URL
    - Store state in session/redis
    - Return redirect URL
    """
    raise HTTPException(status_code=501, detail="Facebook OAuth not implemented yet")


# === OAuth Login - X (Twitter) ===
@router.post("/oauth/x")
def oauth_x_login(request: Request):
    """
    Initiate X (Twitter) OAuth flow.
    
    TODO: Implement X OAuth:
    - Generate state token for CSRF protection
    - Redirect to X authorization URL
    - Store state in session/redis
    - Return redirect URL
    """
    raise HTTPException(status_code=501, detail="X OAuth not implemented yet")


# === OAuth Callback ===
@router.get("/oauth/callback")
def oauth_callback(
    code: str,
    state: str,
    provider: str,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Handle OAuth callback from provider (Facebook/X).
    
    TODO: Implement OAuth callback:
    - Validate state token (CSRF protection)
    - Exchange code for access token with provider
    - Get user info from provider
    - Find or create User record
    - Find or create SocialAccount record
    - Create SocialSession record
    - Generate JWT token
    - Return {access_token, token_type, user}
    """
    raise HTTPException(status_code=501, detail="OAuth callback not implemented yet")
