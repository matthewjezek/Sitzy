from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from jose import JWTError
from sqlalchemy.orm import Session

from api.config import settings
from api.database import get_db
from api.deps import UserContext, get_current_user
from api.models import IntegrationAuditLog, SocialAccount, SocialSession
from api.schemas import (
    IntegrationAuditEventOut,
    SocialAccountDashboardOut,
    SocialDashboardOut,
    SocialSessionOut,
    UserOut,
)
from api.services.oauth_service import (
    FacebookOAuthClient,
    OAuthStateManager,
    XOAuthClient,
    create_or_update_session,
    find_or_create_user,
)
from api.utils.integration_audit import emit_integration_event
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


def _is_fake_email(email: str | None) -> bool:
    return bool(email and email.endswith(".invalid"))


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
    emit_integration_event(
        event="oauth_state_created",
        provider="facebook",
        metadata={"has_pkce": False},
    )
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
    emit_integration_event(
        event="oauth_state_created",
        provider="x",
        metadata={"has_pkce": True},
    )
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
    emit_integration_event(
        event="oauth_state_consumed",
        provider=provider,
        metadata={"has_pkce": code_verifier is not None},
    )

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
            emit_integration_event(
                event="oauth_token_exchanged",
                provider="x",
                metadata={"has_refresh_token": bool(token_data.get("refresh_token"))},
            )
            logger.info("X token exchange complete, fetching user info")
            user_info = await x_client.get_user_info(token_data["access_token"])
        else:
            token_data = fb_client.exchange_code(code)
            emit_integration_event(
                event="oauth_token_exchanged",
                provider="facebook",
                metadata={"has_refresh_token": bool(token_data.get("refresh_token"))},
            )
            logger.info("Facebook token exchange complete, fetching user info")
            user_info = await fb_client.get_user_info(token_data["access_token"])

        logger.info(f"User info fetched: {user_info}")

        raw_id = user_info.get("id")
        if not raw_id:
            logger.error("Failed to fetch user profile", extra={"provider": provider})
            raise HTTPException(status_code=502, detail="Failed to fetch user profile.")
        social_id: str = str(raw_id)
        email = user_info.get("email") or f"{social_id}@{provider}.invalid"
        email_missing = _is_fake_email(email)

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
        emit_integration_event(
            event="oauth_profile_fetched",
            provider=provider,
            user_id=user.id,
            metadata={
                "social_id": social_id,
                "email_missing": email_missing,
            },
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
        logger.info(f"Session created: {session.id}")

        db.commit()
        logger.info("Database committed")
        emit_integration_event(
            event="social_session_created",
            provider=provider,
            user_id=user.id,
            metadata={
                "session_id": str(session.id),
                "expires_in": expires_in,
            },
            db=db,
        )
        db.commit()

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
    emit_integration_event(
        event="social_session_refreshed",
        user_id=UUID(user_id),
        metadata={"session_id": session_id},
        db=db,
    )
    db.commit()

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
        social_account = getattr(session, "social_account", None)
        emit_integration_event(
            event="social_session_revoked",
            provider=social_account.provider if social_account else None,
            user_id=ctx.user.id,
            metadata={"session_id": str(ctx.session_id), "via": "current_session"},
            db=db,
        )
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


@router.get("/social/dashboard", response_model=SocialDashboardOut)
def get_social_dashboard(
    ctx: UserContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SocialDashboardOut:
    """Return linked social providers, session visibility and integration events."""
    accounts = (
        db.query(SocialAccount)
        .filter(SocialAccount.user_id == ctx.user.id)
        .order_by(SocialAccount.linked_at.desc())
        .all()
    )

    sessions = (
        db.query(SocialSession)
        .join(SocialAccount, SocialSession.social_account_id == SocialAccount.id)
        .filter(SocialSession.user_id == ctx.user.id)
        .order_by(SocialSession.created_at.desc())
        .all()
    )

    session_rows: list[SocialSessionOut] = []
    active_count_by_account: dict[UUID, int] = {}
    last_login_by_account: dict[UUID, datetime] = {}

    for session in sessions:
        account_id = session.social_account_id
        if session.revoked_at is None:
            active_count_by_account[account_id] = (
                active_count_by_account.get(account_id, 0) + 1
            )

        last_seen = last_login_by_account.get(account_id)
        if last_seen is None or session.created_at > last_seen:
            last_login_by_account[account_id] = session.created_at

        session_rows.append(
            SocialSessionOut(
                id=session.id,
                provider=session.social_account.provider,
                created_at=session.created_at,
                expires_at=session.expires_at,
                revoked_at=session.revoked_at,
                user_agent=session.user_agent,
                is_current=session.id == ctx.session_id,
            )
        )

    account_rows = [
        SocialAccountDashboardOut(
            provider=account.provider,
            social_id=account.social_id,
            linked_at=account.linked_at,
            provider_email=None if _is_fake_email(account.email) else account.email,
            has_real_email=not _is_fake_email(account.email),
            active_sessions=active_count_by_account.get(account.id, 0),
            last_login_at=last_login_by_account.get(account.id),
        )
        for account in accounts
    ]

    events = (
        db.query(IntegrationAuditLog)
        .filter(IntegrationAuditLog.user_id == ctx.user.id)
        .order_by(IntegrationAuditLog.created_at.desc())
        .limit(30)
        .all()
    )

    event_rows = [
        IntegrationAuditEventOut(
            event=event.event,
            provider=event.provider,
            created_at=event.created_at,
            metadata=event.metadata_json,
        )
        for event in events
    ]

    return SocialDashboardOut(
        accounts=account_rows,
        sessions=session_rows,
        events=event_rows,
    )


@router.post(
    "/social/sessions/{session_id}/revoke", status_code=status.HTTP_204_NO_CONTENT
)
def revoke_session_by_id(
    session_id: UUID,
    response: Response,
    ctx: UserContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Revoke one of the current user's social sessions."""
    session = (
        db.query(SocialSession)
        .filter(
            SocialSession.id == session_id,
            SocialSession.user_id == ctx.user.id,
        )
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    if session.revoked_at is None:
        session.revoked_at = datetime.now(timezone.utc)

    social_account = getattr(session, "social_account", None)

    emit_integration_event(
        event="social_session_revoked",
        provider=social_account.provider if social_account else None,
        user_id=ctx.user.id,
        metadata={"session_id": str(session_id), "via": "dashboard"},
        db=db,
    )

    db.commit()

    if session_id == ctx.session_id:
        _clear_refresh_cookie(response)


@router.post(
    "/social/providers/{provider}/unlink", status_code=status.HTTP_204_NO_CONTENT
)
def unlink_provider(
    provider: str,
    response: Response,
    ctx: UserContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Unlink a social provider account from the current user."""
    normalized_provider = provider.strip().lower()

    accounts = (
        db.query(SocialAccount).filter(SocialAccount.user_id == ctx.user.id).all()
    )
    if len(accounts) <= 1:
        raise HTTPException(
            status_code=409,
            detail="Cannot unlink the only login provider.",
        )

    account_to_unlink = next(
        (a for a in accounts if a.provider.lower() == normalized_provider), None
    )
    if not account_to_unlink:
        raise HTTPException(status_code=404, detail="Provider is not linked.")

    current_session_will_be_revoked = False
    for session in account_to_unlink.sessions:
        if session.revoked_at is None:
            session.revoked_at = datetime.now(timezone.utc)
        if session.id == ctx.session_id:
            current_session_will_be_revoked = True

    db.delete(account_to_unlink)
    emit_integration_event(
        event="social_provider_unlinked",
        provider=account_to_unlink.provider,
        user_id=ctx.user.id,
        metadata={"provider": account_to_unlink.provider},
        db=db,
    )
    db.commit()

    if current_session_will_be_revoked:
        _clear_refresh_cookie(response)


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
    emit_integration_event(
        event="account_deletion_requested",
        user_id=user.id,
        metadata={"email_present": user.email is not None},
        db=db,
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
            emit_integration_event(
                event="account_deleted_by_provider_callback",
                provider="facebook",
                user_id=user.id,
                metadata={"facebook_user_id": str(facebook_user_id)},
                db=db,
            )
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
