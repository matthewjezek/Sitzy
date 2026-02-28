from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException, Query, Request, status
from jose import JWTError
from sqlalchemy.orm import Session

from api.database import get_db
from api.deps import UserContext, get_current_user
from api.models import SocialSession
from api.schemas import UserOut
from api.services.oauth_service import (
    FacebookOAuthClient,
    OAuthStateManager,
    Provider,
    XOAuthClient,
    create_or_update_session,
    find_or_create_user,
)
from api.utils.limiter import limiter
from api.utils.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
)

router = APIRouter(tags=["auth"])
state_manager = OAuthStateManager()
x_client = XOAuthClient()
fb_client = FacebookOAuthClient()


@router.post("/oauth/facebook/init", response_model=dict[str, str])
@limiter.limit("10/minute")
def facebook_init(request: Request) -> dict[str, str]:
    """Initialize Facebook OAuth flow."""
    state = state_manager.generate_state()
    state_manager.store_state(state, provider="facebook")
    authorization_url = fb_client.get_authorization_url(state)
    return {"authorization_url": authorization_url, "state": state}


@router.post("/oauth/x/init", response_model=dict[str, str])
@limiter.limit("10/minute")
def x_init(request: Request) -> dict[str, str]:
    """Initialize X OAuth flow with PKCE."""
    state = state_manager.generate_state()
    code_verifier, code_challenge = x_client.generate_pkce()
    state_manager.store_state(state, provider="x", code_verifier=code_verifier)
    authorization_url = x_client.get_authorization_url(state, code_challenge)
    return {"authorization_url": authorization_url, "state": state}


@router.get("/oauth/callback")
@limiter.limit("5/minute")
async def oauth_callback(
    request: Request,
    code: str = Query(...),
    state: str = Query(...),
    provider: Provider = Query(...),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Handle OAuth callback and create session."""
    result = state_manager.validate_and_consume_state(state)
    if not result or result[0] != provider:
        raise HTTPException(status_code=400, detail="Invalid or expired state token.")

    _, code_verifier = result

    if provider == "x":
        if not code_verifier:
            raise HTTPException(status_code=400, detail="Missing PKCE code verifier.")
        token_data = x_client.exchange_code(code, code_verifier)
        user_info = await x_client.get_user_info(token_data["access_token"])
    else:
        token_data = fb_client.exchange_code(code)
        user_info = await fb_client.get_user_info(token_data["access_token"])

    raw_id = user_info.get("id")
    if not raw_id:
        raise HTTPException(status_code=502, detail="Failed to fetch user profile.")
    social_id: str = str(raw_id)
    email = user_info.get("email") or f"{social_id}@{provider}.invalid"

    user = find_or_create_user(
        provider=provider,
        social_id=social_id,
        email=email,
        full_name=user_info.get("full_name"),
        avatar_url=user_info.get("avatar_url"),
        db=db,
    )

    expires_in: int = int(token_data.get("expires_in", 7200))

    session = create_or_update_session(
        user_id=user.id,
        social_account_id=user.social_accounts[-1].id,
        provider_access_token=token_data["access_token"],
        provider_refresh_token=token_data.get("refresh_token"),
        expires_in=expires_in,
        user_agent=request.headers.get("user-agent"),
        db=db,
    )

    db.commit()

    access_token = create_access_token(
        {"sub": str(user.id), "session_id": str(session.id)}
    )
    refresh_token = create_refresh_token(user.id, session.id)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=dict[str, str])
@limiter.limit("30/minute")
def refresh_access_token(
    request: Request,
    refresh_token: str = Body(..., embed=True),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Issue new access token from refresh token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid refresh token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_refresh_token(refresh_token)
    except JWTError:
        raise credentials_exception

    user_id = payload.get("sub")
    session_id = payload.get("session_id")
    if not user_id or not session_id:
        raise credentials_exception

    session = (
        db.query(SocialSession)
        .filter(
            SocialSession.id == UUID(session_id),
            SocialSession.revoked_at.is_(None),
            SocialSession.expires_at > datetime.now(timezone.utc),
        )
        .first()
    )
    if not session:
        raise credentials_exception

    access_token = create_access_token({"sub": user_id, "session_id": session_id})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/revoke", status_code=status.HTTP_204_NO_CONTENT)
def revoke_session(
    request: Request,
    ctx: UserContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Revoke current session (logout)."""
    session = db.query(SocialSession).filter(SocialSession.id == ctx.session_id).first()
    if session:
        session.revoked_at = datetime.now(timezone.utc)
        db.commit()


@router.get("/me", response_model=UserOut)
def read_me(ctx: UserContext = Depends(get_current_user)) -> UserOut:
    """Return current authenticated user."""
    return UserOut.model_validate(ctx.user)
