from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from jose import JWTError
from sqlalchemy.orm import Session

from api.config import settings
from api.database import get_db
from api.deps import UserContext, get_current_user
from api.models import SocialSession
from api.schemas import UserOut
from api.services.oauth_service import (
    FacebookOAuthClient,
    OAuthStateManager,
    XOAuthClient,
    create_or_update_session,
    find_or_create_user,
)
from api.utils.limiter import limiter
from api.utils.logging_config import get_logger
from api.utils.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
)

router = APIRouter(tags=["auth"])
logger = get_logger(__name__)
state_manager = OAuthStateManager()
x_client = XOAuthClient()
fb_client = FacebookOAuthClient()


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    """Set refresh token as HttpOnly, SameSite=Lax cookie."""
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.environment == "production",
        samesite="lax",
        max_age=settings.refresh_token_expire_days * 24 * 3600,
        path="/auth",
    )


def _clear_refresh_cookie(response: Response) -> None:
    """Clear refresh token cookie on logout."""
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=settings.environment == "production",
        samesite="lax",
        path="/auth",
    )


@router.post("/oauth/facebook/init", response_model=dict[str, str])
@limiter.limit("10/minute")
def facebook_init(request: Request) -> dict[str, str]:
    """Initialize Facebook OAuth flow."""
    state = state_manager.generate_state()
    state_manager.store_state(state, provider="facebook")
    authorization_url = fb_client.get_authorization_url(state)
    logger.info("Facebook OAuth initialization", extra={"provider": "facebook"})
    return {"authorization_url": authorization_url, "state": state}


@router.post("/oauth/x/init", response_model=dict[str, str])
@limiter.limit("5/minute")
def x_init(request: Request) -> dict[str, str]:
    """Initialize X OAuth flow with PKCE."""
    state = state_manager.generate_state()
    code_verifier, code_challenge = x_client.generate_pkce()
    state_manager.store_state(state, provider="x", code_verifier=code_verifier)
    authorization_url = x_client.get_authorization_url(state, code_challenge)
    logger.info("X OAuth initialization", extra={"provider": "x"})
    return {"authorization_url": authorization_url, "state": state}


@router.get("/oauth/callback")
@limiter.limit("5/minute")
async def oauth_callback(
    request: Request,
    response: Response,
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Handle OAuth callback and create session.

    Provider is determined from the state token (no query parameter needed).
    """
    result = state_manager.validate_and_consume_state(state)
    if not result:
        logger.warning(
            "OAuth callback with invalid state",
            extra={"state_valid": False},
        )
        raise HTTPException(status_code=400, detail="Invalid or expired state token.")

    provider, code_verifier = result

    _, code_verifier = result
    logger.info(f"OAuth callback for provider: {provider}")

    try:
        if provider == "x":
            if not code_verifier:
                logger.warning(
                    "OAuth callback missing PKCE code verifier", extra={"provider": "x"}
                )
                raise HTTPException(
                    status_code=400, detail="Missing PKCE code verifier."
                )
            token_data = x_client.exchange_code(code, code_verifier)
            logger.info("X token exchange complete, fetching user info")
            user_info = await x_client.get_user_info(token_data["access_token"])
        else:
            token_data = fb_client.exchange_code(code)
            logger.info("Facebook token exchange complete, fetching user info")
            user_info = await fb_client.get_user_info(token_data["access_token"])

        logger.info(f"User info fetched: {user_info}")

        raw_id = user_info.get("id")
        if not raw_id:
            logger.error("Failed to fetch user profile", extra={"provider": provider})
            raise HTTPException(status_code=502, detail="Failed to fetch user profile.")
        social_id: str = str(raw_id)
        email = user_info.get("email") or f"{social_id}@{provider}.invalid"

        logger.info(f"Creating/updating user for {provider}:{social_id}")
        user = find_or_create_user(
            provider=provider,
            social_id=social_id,
            email=email,
            full_name=user_info.get("full_name"),
            avatar_url=user_info.get("avatar_url"),
            db=db,
        )
        logger.info(f"User created/found: {user.id}")

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
        logger.info(f"Session created: {session.id}")

        db.commit()
        logger.info("Database committed")

        access_token = create_access_token(
            {"sub": str(user.id), "session_id": str(session.id)}
        )
        refresh_token = create_refresh_token(user.id, session.id)

        _set_refresh_cookie(response, refresh_token)
        logger.info("Refresh cookie set, returning access token")

        logger.info(
            "OAuth callback successful",
            extra={
                "provider": provider,
                "user_id": str(user.id),
                "session_id": str(session.id),
            },
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
        }
    except Exception as e:
        logger.error(
            f"OAuth callback exception: {str(e)}",
            extra={"exception": str(e)},
            exc_info=True,
        )
        raise


@router.post("/refresh", response_model=dict[str, str])
@limiter.limit("30/minute")
def refresh_access_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Issue new access token from refresh token cookie."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid refresh token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise credentials_exception

    try:
        payload = decode_refresh_token(refresh_token)
    except JWTError:
        logger.warning("Refresh token decode failed - invalid token")
        raise credentials_exception

    user_id = payload.get("sub")
    session_id = payload.get("session_id")
    if not user_id or not session_id:
        logger.warning(
            "Refresh token missing required claims",
            extra={
                "has_user_id": user_id is not None,
                "has_session_id": session_id is not None,
            },
        )
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
        logger.warning(
            "Refresh token session not found or revoked",
            extra={"session_id": session_id, "user_id": user_id},
        )
        raise credentials_exception

    access_token = create_access_token({"sub": user_id, "session_id": session_id})

    new_refresh_token = create_refresh_token(UUID(user_id), UUID(session_id))
    _set_refresh_cookie(response, new_refresh_token)

    logger.info("Token refreshed", extra={"user_id": user_id, "session_id": session_id})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/revoke", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("10/minute")
def revoke_session(
    request: Request,
    response: Response,
    ctx: UserContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Revoke current session and clear refresh token cookie."""
    session = db.query(SocialSession).filter(SocialSession.id == ctx.session_id).first()
    if session:
        session.revoked_at = datetime.now(timezone.utc)
        db.commit()
        logger.info(
            "Session revoked",
            extra={"user_id": str(ctx.user.id), "session_id": str(ctx.session_id)},
        )
    else:
        logger.warning(
            "Revoke attempted on non-existent session",
            extra={"session_id": str(ctx.session_id)},
        )

    _clear_refresh_cookie(response)


@router.get("/me", response_model=UserOut)
def read_me(ctx: UserContext = Depends(get_current_user)) -> UserOut:
    """Return current authenticated user."""
    logger.debug("User info requested", extra={"user_id": str(ctx.user.id)})
    return UserOut.model_validate(ctx.user)


@router.delete("/delete-account", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("3/minute")
def delete_account(
    request: Request,
    response: Response,
    ctx: UserContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Delete user account and all associated data (GDPR compliance).

    Cascades delete:
    - SocialAccounts (OAuth links)
    - SocialSessions (active sessions)
    - Cars (owned vehicles)
    - CarDrivers (driver assignments)
    - Passenger entries (ride participations)
    - Invitations are orphaned but remain for audit trail
    """
    user = ctx.user
    user_id = str(user.id)

    logger.info(
        "Account deletion initiated", extra={"user_id": user_id, "email": user.email}
    )

    # Delete user (cascades handle related data via SQLAlchemy relationships)
    db.delete(user)
    db.commit()

    # Clear refresh cookie
    _clear_refresh_cookie(response)

    logger.info("Account deleted successfully", extra={"user_id": user_id})


@router.post("/facebook/deletion", status_code=status.HTTP_200_OK)
@limiter.limit("10/minute")
def facebook_data_deletion_callback(
    request: Request,
    signed_request: str,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Facebook Data Deletion Callback (required for App Review).

    Facebook sends signed_request when user deletes app from their settings.
    We return a confirmation URL with code for tracking deletion status.

    Note: For production, verify signed_request signature with app secret.
    For academic/prototype use, we accept the request and process deletion.

    See: https://developers.facebook.com/docs/apps/delete-data
    Returns:
    {"url": "https://sitzy.example.com/deletion-status?code=...&status=confirmed"}
    """
    import base64
    import json
    import secrets

    from api.models import SocialAccount

    try:
        # Decode signed_request (format: signature.payload)
        # Production should verify HMAC signature with app secret
        encoded_sig, payload = signed_request.split('.', 1)

        # Add padding if needed for base64
        padding = len(payload) % 4
        if padding:
            payload += '=' * (4 - padding)

        decoded_payload = base64.urlsafe_b64decode(payload)
        data = json.loads(decoded_payload)

        facebook_user_id = data.get('user_id')

        if not facebook_user_id:
            logger.warning("Facebook deletion callback missing user_id")
            raise HTTPException(
                status_code=400, detail="Missing user_id in signed_request"
            )

        # Find user by Facebook social account
        social_account = (
            db.query(SocialAccount)
            .filter(
                SocialAccount.provider == "facebook",
                SocialAccount.social_id == str(facebook_user_id),
            )
            .first()
        )

        # Generate confirmation code for status tracking
        confirmation_code = secrets.token_urlsafe(16)

        if social_account:
            user = social_account.user
            user_id = str(user.id)

            logger.info(
                "Facebook deletion callback - deleting user",
                extra={"user_id": user_id, "facebook_id": facebook_user_id},
            )

            db.delete(user)
            db.commit()
        else:
            logger.info(
                "Facebook deletion callback - user not found",
                extra={"facebook_id": facebook_user_id},
            )

        # Return confirmation code as per Facebook spec
        # In production, you would return:
        # {"url": "https://your-domain.cz/deletion-status?code=..."}
        # For development/testing, just return the confirmation code
        return {"confirmation_code": confirmation_code}

    except Exception as e:
        logger.error(
            "Facebook deletion callback failed", extra={"error": str(e)}, exc_info=True
        )
        raise HTTPException(
            status_code=400, detail="Failed to process deletion request"
        )
