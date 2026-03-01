import os
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from uuid import UUID, uuid4

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from jose import JWTError
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

# Minimal env required by api.config / api.database imports
os.environ.setdefault("ENVIRONMENT", "development")
os.environ.setdefault("FACEBOOK_CLIENT_ID", "fb-client")
os.environ.setdefault("FACEBOOK_CLIENT_SECRET", "fb-secret")
os.environ.setdefault("FACEBOOK_REDIRECT_URI", "http://localhost:5173/auth/callback")
os.environ.setdefault("X_CLIENT_ID", "x-client")
os.environ.setdefault("X_CLIENT_SECRET", "x-secret")
os.environ.setdefault("X_REDIRECT_URI", "http://localhost:5173/auth/callback")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("SECRET_KEY", "a" * 40)
os.environ.setdefault("REFRESH_SECRET_KEY", "b" * 40)
os.environ.setdefault("ALGORITHM", "HS256")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "15")
os.environ.setdefault("REFRESH_TOKEN_EXPIRE_DAYS", "7")
os.environ.setdefault("FRONTEND_ORIGIN", "http://localhost:5173")
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")

from api.database import get_db
from api.deps import UserContext, get_current_user
from api.models import SocialSession
from api.routers import auth


@pytest.fixture(autouse=True)
def reset_limiter_state() -> None:
    """Reset SlowAPI in-memory counters before each test for stability."""
    auth.limiter.reset()


class FakeQuery:
    def __init__(self, result):
        self._result = result

    def filter(self, *args, **kwargs):
        return self

    def first(self):
        return self._result


class FakeDB:
    def __init__(self, query_results=None):
        self.query_results = query_results or {}
        self.commit_called = False

    def query(self, model):
        return FakeQuery(self.query_results.get(model))

    def commit(self):
        self.commit_called = True


def create_client(fake_db: FakeDB, current_user: UserContext | None = None) -> TestClient:
    app = FastAPI()
    app.state.limiter = auth.limiter
    app.add_middleware(SlowAPIMiddleware)
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.include_router(auth.router, prefix="/auth")

    def _get_db_override():
        yield fake_db

    app.dependency_overrides[get_db] = _get_db_override

    if current_user is not None:
        app.dependency_overrides[get_current_user] = lambda: current_user

    return TestClient(app)


def test_facebook_init_returns_authorization_url(monkeypatch: pytest.MonkeyPatch):
    fake_db = FakeDB()
    client = create_client(fake_db)

    called = {}

    monkeypatch.setattr(auth.state_manager, "generate_state", lambda: "state-123")

    def _store_state(state: str, provider: str, code_verifier=None, ttl: int = 600):
        called["state"] = state
        called["provider"] = provider
        called["code_verifier"] = code_verifier
        called["ttl"] = ttl

    monkeypatch.setattr(auth.state_manager, "store_state", _store_state)
    monkeypatch.setattr(
        auth.fb_client,
        "get_authorization_url",
        lambda state: f"https://facebook.example/auth?state={state}",
    )

    response = client.post("/auth/oauth/facebook/init")

    assert response.status_code == 200
    assert response.json() == {
        "authorization_url": "https://facebook.example/auth?state=state-123",
        "state": "state-123",
    }
    assert called["provider"] == "facebook"
    assert called["code_verifier"] is None


def test_x_init_returns_authorization_url_and_stores_pkce(monkeypatch: pytest.MonkeyPatch):
    fake_db = FakeDB()
    client = create_client(fake_db)

    called = {}

    monkeypatch.setattr(auth.state_manager, "generate_state", lambda: "state-x")
    monkeypatch.setattr(auth.x_client, "generate_pkce", lambda: ("verifier", "challenge"))

    def _store_state(state: str, provider: str, code_verifier=None, ttl: int = 600):
        called["state"] = state
        called["provider"] = provider
        called["code_verifier"] = code_verifier

    monkeypatch.setattr(auth.state_manager, "store_state", _store_state)
    monkeypatch.setattr(
        auth.x_client,
        "get_authorization_url",
        lambda state, code_challenge: f"https://x.example/auth?state={state}&cc={code_challenge}",
    )

    response = client.post("/auth/oauth/x/init")

    assert response.status_code == 200
    assert response.json() == {
        "authorization_url": "https://x.example/auth?state=state-x&cc=challenge",
        "state": "state-x",
    }
    assert called == {"state": "state-x", "provider": "x", "code_verifier": "verifier"}


def test_oauth_callback_creates_tokens_and_commits(monkeypatch: pytest.MonkeyPatch):
    fake_db = FakeDB()
    client = create_client(fake_db)

    user_id = uuid4()
    social_account_id = uuid4()
    session_id = uuid4()

    fake_user = SimpleNamespace(id=user_id, social_accounts=[SimpleNamespace(id=social_account_id)])
    fake_session = SimpleNamespace(id=session_id)

    monkeypatch.setattr(
        auth.state_manager,
        "validate_and_consume_state",
        lambda state: ("facebook", None),
    )
    monkeypatch.setattr(
        auth.fb_client,
        "exchange_code",
        lambda code: {"access_token": "provider-token", "expires_in": 3600},
    )

    async def _fake_fb_user_info(access_token: str):
        return {
            "id": "fb-123",
            "email": "user@example.com",
            "full_name": "OAuth User",
            "avatar_url": "https://example.com/avatar.png",
        }

    monkeypatch.setattr(auth.fb_client, "get_user_info", _fake_fb_user_info)
    monkeypatch.setattr(auth, "find_or_create_user", lambda **kwargs: fake_user)
    monkeypatch.setattr(auth, "create_or_update_session", lambda **kwargs: fake_session)
    monkeypatch.setattr(auth, "create_access_token", lambda payload: "access-xyz")
    monkeypatch.setattr(auth, "create_refresh_token", lambda user_id, session_id: "refresh-xyz")

    response = client.get(
        "/auth/oauth/callback",
        params={"code": "abc", "state": "st", "provider": "facebook"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "access_token": "access-xyz",
        "refresh_token": "refresh-xyz",
        "token_type": "bearer",
    }
    assert fake_db.commit_called is True


def test_refresh_returns_new_access_token(monkeypatch: pytest.MonkeyPatch):
    session_id = uuid4()
    user_id = uuid4()

    valid_session = SimpleNamespace(
        id=session_id,
        revoked_at=None,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
    )

    fake_db = FakeDB(query_results={SocialSession: valid_session})
    client = create_client(fake_db)

    monkeypatch.setattr(
        auth,
        "decode_refresh_token",
        lambda token: {"sub": str(user_id), "session_id": str(session_id)},
    )
    monkeypatch.setattr(auth, "create_access_token", lambda payload: "new-access")

    response = client.post("/auth/refresh", json={"refresh_token": "refresh-token"})

    assert response.status_code == 200
    assert response.json() == {"access_token": "new-access", "token_type": "bearer"}


def test_refresh_rejects_invalid_token(monkeypatch: pytest.MonkeyPatch):
    fake_db = FakeDB()
    client = create_client(fake_db)

    def _raise_invalid(_: str):
        raise JWTError("invalid")

    monkeypatch.setattr(auth, "decode_refresh_token", _raise_invalid)

    response = client.post("/auth/refresh", json={"refresh_token": "bad"})

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid refresh token."


def test_revoke_marks_session_revoked(monkeypatch: pytest.MonkeyPatch):
    session_id = uuid4()
    fake_user = SimpleNamespace(id=uuid4())
    context = UserContext(user=fake_user, session_id=session_id)

    target_session = SimpleNamespace(id=session_id, revoked_at=None)
    fake_db = FakeDB(query_results={SocialSession: target_session})
    client = create_client(fake_db, current_user=context)

    response = client.post("/auth/revoke")

    assert response.status_code == 204
    assert target_session.revoked_at is not None
    assert fake_db.commit_called is True


def test_facebook_init_rate_limit_returns_429(monkeypatch: pytest.MonkeyPatch):
    fake_db = FakeDB()
    client = create_client(fake_db)

    monkeypatch.setattr(auth.state_manager, "generate_state", lambda: "state-rate")
    monkeypatch.setattr(auth.state_manager, "store_state", lambda *args, **kwargs: None)
    monkeypatch.setattr(
        auth.fb_client,
        "get_authorization_url",
        lambda state: f"https://facebook.example/auth?state={state}",
    )

    statuses = [client.post("/auth/oauth/facebook/init").status_code for _ in range(11)]

    assert statuses[:10] == [200] * 10
    assert statuses[10] == 429


def test_oauth_callback_rejects_invalid_or_expired_state(monkeypatch: pytest.MonkeyPatch):
    fake_db = FakeDB()
    client = create_client(fake_db)

    monkeypatch.setattr(auth.state_manager, "validate_and_consume_state", lambda state: None)

    response = client.get(
        "/auth/oauth/callback",
        params={"code": "abc", "state": "invalid", "provider": "facebook"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid or expired state token."


def test_oauth_callback_x_rejects_missing_pkce_verifier(monkeypatch: pytest.MonkeyPatch):
    fake_db = FakeDB()
    client = create_client(fake_db)

    monkeypatch.setattr(
        auth.state_manager,
        "validate_and_consume_state",
        lambda state: ("x", None),
    )

    response = client.get(
        "/auth/oauth/callback",
        params={"code": "abc", "state": "st", "provider": "x"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Missing PKCE code verifier."


def test_oauth_callback_x_success(monkeypatch: pytest.MonkeyPatch):
    fake_db = FakeDB()
    client = create_client(fake_db)

    user_id = uuid4()
    social_account_id = uuid4()
    session_id = uuid4()
    fake_user = SimpleNamespace(id=user_id, social_accounts=[SimpleNamespace(id=social_account_id)])
    fake_session = SimpleNamespace(id=session_id)

    monkeypatch.setattr(
        auth.state_manager,
        "validate_and_consume_state",
        lambda state: ("x", "pkce-verifier"),
    )
    monkeypatch.setattr(
        auth.x_client,
        "exchange_code",
        lambda code, code_verifier: {
            "access_token": "x-provider-token",
            "refresh_token": "x-provider-refresh",
            "expires_in": 1800,
        },
    )

    async def _fake_x_user_info(access_token: str):
        return {
            "id": "x-123",
            "email": None,
            "full_name": "X User",
            "avatar_url": "https://example.com/x.png",
        }

    monkeypatch.setattr(auth.x_client, "get_user_info", _fake_x_user_info)
    monkeypatch.setattr(auth, "find_or_create_user", lambda **kwargs: fake_user)
    monkeypatch.setattr(auth, "create_or_update_session", lambda **kwargs: fake_session)
    monkeypatch.setattr(auth, "create_access_token", lambda payload: "x-access")
    monkeypatch.setattr(auth, "create_refresh_token", lambda user_id, session_id: "x-refresh")

    response = client.get(
        "/auth/oauth/callback",
        params={"code": "xcode", "state": "xstate", "provider": "x"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "access_token": "x-access",
        "refresh_token": "x-refresh",
        "token_type": "bearer",
    }


def test_refresh_rejects_missing_claims(monkeypatch: pytest.MonkeyPatch):
    fake_db = FakeDB()
    client = create_client(fake_db)

    monkeypatch.setattr(auth, "decode_refresh_token", lambda token: {"sub": str(uuid4())})

    response = client.post("/auth/refresh", json={"refresh_token": "refresh-token"})

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid refresh token."


def test_refresh_rejects_when_session_not_found(monkeypatch: pytest.MonkeyPatch):
    fake_db = FakeDB(query_results={SocialSession: None})
    client = create_client(fake_db)

    monkeypatch.setattr(
        auth,
        "decode_refresh_token",
        lambda token: {"sub": str(uuid4()), "session_id": str(uuid4())},
    )

    response = client.post("/auth/refresh", json={"refresh_token": "refresh-token"})

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid refresh token."


def test_revoke_without_matching_session_still_returns_204():
    fake_db = FakeDB(query_results={SocialSession: None})
    context = UserContext(user=SimpleNamespace(id=uuid4()), session_id=uuid4())
    client = create_client(fake_db, current_user=context)

    response = client.post("/auth/revoke")

    assert response.status_code == 204
    assert fake_db.commit_called is False


def test_me_returns_current_user_payload():
    fake_user = SimpleNamespace(
        id=uuid4(),
        email="me@example.com",
        full_name="Me User",
        avatar_url=None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    context = UserContext(user=fake_user, session_id=uuid4())
    client = create_client(FakeDB(), current_user=context)

    response = client.get("/auth/me")

    assert response.status_code == 200
    data = response.json()
    assert UUID(data["id"]) == fake_user.id
    assert data["email"] == "me@example.com"
    assert data["full_name"] == "Me User"


def test_oauth_callback_rate_limit_returns_429(monkeypatch: pytest.MonkeyPatch):
    fake_db = FakeDB()
    client = create_client(fake_db)

    monkeypatch.setattr(
        auth.state_manager,
        "validate_and_consume_state",
        lambda state: ("facebook", None),
    )
    monkeypatch.setattr(
        auth.fb_client,
        "exchange_code",
        lambda code: {"access_token": "provider-token", "expires_in": 3600},
    )

    async def _fake_fb_user_info(access_token: str):
        return {
            "id": "fb-123",
            "email": "user@example.com",
            "full_name": "OAuth User",
            "avatar_url": "https://example.com/avatar.png",
        }

    fake_user = SimpleNamespace(id=uuid4(), social_accounts=[SimpleNamespace(id=uuid4())])
    fake_session = SimpleNamespace(id=uuid4())

    monkeypatch.setattr(auth.fb_client, "get_user_info", _fake_fb_user_info)
    monkeypatch.setattr(auth, "find_or_create_user", lambda **kwargs: fake_user)
    monkeypatch.setattr(auth, "create_or_update_session", lambda **kwargs: fake_session)
    monkeypatch.setattr(auth, "create_access_token", lambda payload: "access-xyz")
    monkeypatch.setattr(auth, "create_refresh_token", lambda user_id, session_id: "refresh-xyz")

    statuses = [
        client.get(
            "/auth/oauth/callback",
            params={"code": "abc", "state": f"st-{idx}", "provider": "facebook"},
        ).status_code
        for idx in range(6)
    ]

    assert statuses[:5] == [200] * 5
    assert statuses[5] == 429
