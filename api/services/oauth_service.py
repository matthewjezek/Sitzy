from __future__ import annotations

import json
import secrets
from datetime import datetime, timedelta, timezone
from typing import Literal
from urllib.parse import urlencode
from uuid import UUID

import httpx
import redis as redis_lib
from authlib.oauth2.rfc7636 import create_s256_code_challenge
from sqlalchemy.orm import Session

from api import models
from api.config import settings
from api.utils.logging_config import get_logger
from api.utils.security import generate_token

Provider = Literal["x", "facebook"]

_redis = redis_lib.from_url(settings.redis_url, decode_responses=True)  # type: ignore
logger = get_logger(__name__)


class OAuthStateManager:
    _PREFIX = "oauth:state:"

    def generate_state(self) -> str:
        """Generate a secure random state string."""
        return secrets.token_hex(32)

    def _key(self, state: str) -> str:
        """Generate Redis key for a given state."""
        return f"{self._PREFIX}{state}"

    def store_state(
        self,
        state: str,
        provider: Provider,
        code_verifier: str | None = None,
        ttl: int = 600,
    ) -> None:
        """Store state with associated provider and optional PKCE code verifier
        in Redis."""
        data = {"provider": provider, "code_verifier": code_verifier}
        _redis.set(self._key(state), json.dumps(data), ex=ttl)
        logger.debug(
            "OAuth state stored",
            extra={
                "provider": provider,
                "has_pkce": code_verifier is not None,
                "ttl": ttl,
            },
        )

    def validate_and_consume_state(
        self, state: str
    ) -> tuple[Provider, str | None] | None:
        """Validate state and return associated provider and code_verifier,
        then delete it."""
        raw = _redis.getdel(self._key(state))
        if not raw:
            logger.warning("OAuth state validation failed - state not found")
            return None
        data = json.loads(raw)
        logger.debug(
            "OAuth state validated and consumed",
            extra={"provider": data.get("provider")},
        )
        return data["provider"], data.get("code_verifier")


class XOAuthClient:
    AUTHORIZE_URL = "https://x.com/i/oauth2/authorize"
    TOKEN_URL = "https://api.x.com/2/oauth2/token"
    USER_URL = "https://api.x.com/2/users/me"
    SCOPE = "tweet.read users.read offline.access"

    def generate_pkce(self) -> tuple[str, str]:
        """Generate PKCE code verifier and challenge."""
        code_verifier = generate_token(48)
        code_challenge = create_s256_code_challenge(code_verifier)
        return code_verifier, code_challenge

    def get_authorization_url(self, state: str, code_challenge: str) -> str:
        """Generate X authorization URL with PKCE."""
        params = {
            "response_type": "code",
            "client_id": settings.x_client_id,
            "redirect_uri": str(settings.x_redirect_uri),
            "scope": self.SCOPE,
            "state": state,
            "code_challenge": code_challenge,
            "code_challenge_method": "S256",
        }
        query = urlencode(params)
        return f"{self.AUTHORIZE_URL}?{query}"

    def exchange_code(self, code: str, code_verifier: str) -> dict[str, str]:
        """Exchange authorization code for access token."""
        with httpx.Client(timeout=httpx.Timeout(5.0)) as client:
            try:
                response = client.post(
                    self.TOKEN_URL,
                    data={
                        "grant_type": "authorization_code",
                        "code": code,
                        "redirect_uri": str(settings.x_redirect_uri),
                        "code_verifier": code_verifier,
                        "client_id": settings.x_client_id,
                    },
                    auth=(settings.x_client_id, settings.x_client_secret),
                )
                response.raise_for_status()
                result: dict[str, str] = response.json()
                logger.info("X OAuth token exchange successful")
                return result
            except httpx.HTTPError as e:
                logger.error("X OAuth token exchange failed", extra={"error": str(e)})
                raise

    async def get_user_info(self, access_token: str) -> dict[str, str | None]:
        """Fetch user profile from X API."""
        async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:
            response = await client.get(
                self.USER_URL,
                params={"user.fields": "id,name,profile_image_url"},
                headers={"Authorization": f"Bearer {access_token}"},
            )
            response.raise_for_status()
            data = response.json().get("data", {})
            return {
                "id": data.get("id"),
                "email": data.get("email") or None,
                "full_name": data.get("name"),
                "avatar_url": data.get("profile_image_url"),
            }


class FacebookOAuthClient:
    AUTHORIZE_URL = "https://www.facebook.com/v25.0/dialog/oauth"
    TOKEN_URL = "https://graph.facebook.com/v20.0/oauth/access_token"
    USER_URL = "https://graph.facebook.com/v20.0/me"

    def get_authorization_url(self, state: str) -> str:
        """Generate Facebook authorization URL."""
        params = {
            "client_id": settings.facebook_client_id,
            "redirect_uri": str(settings.facebook_redirect_uri),
            "scope": "email,public_profile",
            "state": state,
            "response_type": "code",
        }
        query = urlencode(params)
        return f"{self.AUTHORIZE_URL}?{query}"

    def exchange_code(self, code: str) -> dict[str, str]:
        """Exchange authorization code for access token."""
        with httpx.Client(timeout=httpx.Timeout(5.0)) as client:
            try:
                response = client.get(
                    self.TOKEN_URL,
                    params={
                        "client_id": settings.facebook_client_id,
                        "client_secret": settings.facebook_client_secret,
                        "redirect_uri": str(settings.facebook_redirect_uri),
                        "code": code,
                    },
                )
                response.raise_for_status()
                result: dict[str, str] = response.json()
                logger.info("Facebook OAuth token exchange successful")
                return result
            except httpx.HTTPError as e:
                logger.error(
                    "Facebook OAuth token exchange failed", extra={"error": str(e)}
                )
                raise

    async def get_user_info(self, access_token: str) -> dict[str, str | None]:
        """Fetch user profile from Facebook Graph API."""
        async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:
            response = await client.get(
                self.USER_URL,
                params={
                    "fields": "id,name,email,picture",
                    "access_token": access_token,
                },
            )
            response.raise_for_status()
            data = response.json()
            return {
                "id": data.get("id"),
                "email": data.get("email") or None,
                "full_name": data.get("name"),
                "avatar_url": data.get("picture", {}).get("data", {}).get("url"),
            }


def find_or_create_user(
    provider: Provider,
    social_id: str,
    email: str,
    full_name: str | None,
    avatar_url: str | None,
    db: Session,
) -> models.User:
    """Find existing user by social account or email, or create new one."""
    social_account = (
        db.query(models.SocialAccount)
        .filter_by(provider=provider, social_id=social_id)
        .first()
    )
    if social_account:
        logger.debug(
            "Existing user found by social account",
            extra={"provider": provider, "user_id": str(social_account.user_id)},
        )
        return social_account.user

    user = (
        db.query(models.User).filter(models.User.email == email).first()
        if email
        else None
    )
    if not user:
        user = models.User(email=email, full_name=full_name, avatar_url=avatar_url)
        db.add(user)
        db.flush()
        logger.info(
            "New user created",
            extra={"provider": provider, "email": email, "user_id": str(user.id)},
        )
    else:
        logger.info(
            "User found by email",
            extra={"provider": provider, "email": email, "user_id": str(user.id)},
        )

    social_account = models.SocialAccount(
        user_id=user.id,
        provider=provider,
        social_id=social_id,
        email=email,
    )
    db.add(social_account)
    db.flush()
    logger.debug(
        "Social account created", extra={"provider": provider, "user_id": str(user.id)}
    )
    return user


def create_or_update_session(
    user_id: UUID,
    social_account_id: UUID,
    provider_access_token: str,
    provider_refresh_token: str | None,
    expires_in: int,
    user_agent: str | None,
    db: Session,
) -> models.SocialSession:
    """Create new social session for user or update existing one."""
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
    session = models.SocialSession(
        user_id=user_id,
        social_account_id=social_account_id,
        access_token=provider_access_token,
        refresh_token=provider_refresh_token,
        expires_at=expires_at,
        user_agent=user_agent,
    )
    db.add(session)
    db.flush()
    logger.info(
        "Session created",
        extra={
            "user_id": str(user_id),
            "session_id": str(session.id),
            "expires_in": expires_in,
        },
    )
    return session
