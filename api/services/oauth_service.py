from __future__ import annotations

from dataclasses import dataclass
from typing import Literal
from datetime import datetime, timedelta, timezone

import redis
from authlib.integrations.starlette_client import OAuth
from authlib.oauth2.rfc7636 import create_s256_code_challenge

from api.config import settings
from api.utils.security import generate_token

Provider = Literal["x", "facebook"]

oauth = OAuth()
oauth.register(
    name="x",
    client_id=settings.x_client_id,
    client_secret=settings.x_client_secret,
    access_token_url="https://api.x.com/2/oauth2/token",
    authorize_url="https://x.com/i/oauth2/authorize",
    client_kwargs={"scope": "tweet.read users.read offline.access"},
)
oauth.register(
    name="facebook",
    client_id=settings.facebook_client_id,
    client_secret=settings.facebook_client_secret,
    access_token_url="https://graph.facebook.com/v20.0/oauth/access_token",
    authorize_url="https://www.facebook.com/v20.0/dialog/oauth",
    client_kwargs={"scope": "email public_profile"},
)

@dataclass
class OAuthState:
    provider: Provider
    code_verifier: str | None

class OAuthService:
    def __init__(self) -> None:
        self.redis = redis.from_url(settings.redis_url, decode_responses=True)

    def _state_key(self, state: str) -> str:
        return f"oauth:state:{state}"

    def create_authorize_url(self, provider: Provider) -> tuple[str, str]:
        client = oauth.create_client(provider)
        state = generate_token(24)

        code_verifier = None
        extra = {}
        if provider == "x":
            code_verifier = generate_token(48)
            code_challenge = create_s256_code_challenge(code_verifier)
            extra = {"code_challenge": code_challenge, "code_challenge_method": "S256"}

        redirect_uri = settings.x_redirect_uri if provider == "x" else settings.facebook_redirect_uri
        authorization_url, _ = client.create_authorization_url(
            client.authorize_url,
            redirect_uri=redirect_uri,
            state=state,
            **extra,
        )

        # store state in Redis (TTL 600s)
        self.redis.setex(
            self._state_key(state),
            600,
            f"{provider}:{code_verifier or ''}",
        )
        return authorization_url, state

    def pop_state(self, state: str) -> OAuthState | None:
        raw = self.redis.get(self._state_key(state))
        if not raw:
            return None
        self.redis.delete(self._state_key(state))

        provider, _, code_verifier = raw.partition(":")
        return OAuthState(provider=provider, code_verifier=code_verifier or None)

    def fetch_token(self, provider: Provider, code: str, state: OAuthState) -> dict:
        client = oauth.create_client(provider)
        redirect_uri = settings.x_redirect_uri if provider == "x" else settings.facebook_redirect_uri

        extra = {}
        if provider == "x" and state.code_verifier:
            extra["code_verifier"] = state.code_verifier

        return client.fetch_token(
            client.access_token_url,
            code=code,
            redirect_uri=redirect_uri,
            **extra,
        )