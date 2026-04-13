from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from uuid import UUID, uuid4

import pytest
from jose import JWTError

from api.models import SocialSession
from api.routers import auth

from .conftest import FakeDB, FakeQuery, create_client


def test_facebook_init_returns_authorization_url(monkeypatch: pytest.MonkeyPatch):
    fake_db = FakeDB()
    client = create_client(router=auth.router, prefix="/auth", fake_db=fake_db)

    monkeypatch.setattr(auth.state_manager, "generate_state", lambda: "state-123")
    monkeypatch.setattr(auth.state_manager, "store_state", lambda *args, **kwargs: None)
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


def test_x_init_returns_authorization_url_and_state(monkeypatch: pytest.MonkeyPatch):
    fake_db = FakeDB()
    client = create_client(router=auth.router, prefix="/auth", fake_db=fake_db)

    monkeypatch.setattr(auth.state_manager, "generate_state", lambda: "state-x")
    monkeypatch.setattr(auth.x_client, "generate_pkce", lambda: ("verifier", "challenge"))
    monkeypatch.setattr(auth.state_manager, "store_state", lambda *args, **kwargs: None)
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


def test_oauth_callback_success_returns_access_and_cookie(
    monkeypatch: pytest.MonkeyPatch,
):
    fake_db = FakeDB()
    client = create_client(router=auth.router, prefix="/auth", fake_db=fake_db)

    fake_user = SimpleNamespace(id=uuid4(), social_accounts=[SimpleNamespace(id=uuid4())])
    fake_session = SimpleNamespace(id=uuid4())

    monkeypatch.setattr(auth.state_manager, "validate_and_consume_state", lambda state: ("facebook", None))
    monkeypatch.setattr(auth.fb_client, "exchange_code", lambda code: {"access_token": "provider-token", "expires_in": 3600})

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

    response = client.get("/auth/oauth/callback", params={"code": "abc", "state": "st"})

    assert response.status_code == 200
    assert response.json() == {"access_token": "access-xyz", "token_type": "bearer"}
    assert "refresh_token=refresh-xyz" in response.headers.get("set-cookie", "")
    assert fake_db.commit_called is True


def test_oauth_callback_rejects_invalid_state(monkeypatch: pytest.MonkeyPatch):
    fake_db = FakeDB()
    client = create_client(router=auth.router, prefix="/auth", fake_db=fake_db)

    monkeypatch.setattr(auth.state_manager, "validate_and_consume_state", lambda state: None)

    response = client.get("/auth/oauth/callback", params={"code": "abc", "state": "invalid"})

    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid or expired state token."


def test_oauth_callback_x_requires_code_verifier(monkeypatch: pytest.MonkeyPatch):
    fake_db = FakeDB()
    client = create_client(router=auth.router, prefix="/auth", fake_db=fake_db)

    monkeypatch.setattr(auth.state_manager, "validate_and_consume_state", lambda state: ("x", None))

    response = client.get("/auth/oauth/callback", params={"code": "abc", "state": "st"})

    assert response.status_code == 400
    assert response.json()["detail"] == "Missing PKCE code verifier."


def test_refresh_returns_new_access_token_and_renews_cookie(
    monkeypatch: pytest.MonkeyPatch,
):
    session_id = uuid4()
    user_id = uuid4()
    valid_session = SimpleNamespace(
        id=session_id,
        revoked_at=None,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
    )
    fake_db = FakeDB(query_results={SocialSession: FakeQuery(first_result=valid_session)})
    client = create_client(router=auth.router, prefix="/auth", fake_db=fake_db)

    monkeypatch.setattr(auth, "decode_refresh_token", lambda token: {"sub": str(user_id), "session_id": str(session_id)})
    monkeypatch.setattr(auth, "create_access_token", lambda payload: "new-access")
    monkeypatch.setattr(auth, "create_refresh_token", lambda uid, sid: "new-refresh")
    client.cookies.set("refresh_token", "old-refresh")

    response = client.post("/auth/refresh")

    assert response.status_code == 200
    assert response.json() == {"access_token": "new-access", "token_type": "bearer"}
    assert "refresh_token=new-refresh" in response.headers.get("set-cookie", "")


def test_refresh_rejects_missing_cookie():
    fake_db = FakeDB()
    client = create_client(router=auth.router, prefix="/auth", fake_db=fake_db)

    response = client.post("/auth/refresh")

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid refresh token."


def test_refresh_rejects_invalid_token(monkeypatch: pytest.MonkeyPatch):
    fake_db = FakeDB()
    client = create_client(router=auth.router, prefix="/auth", fake_db=fake_db)

    def _raise_invalid(_: str):
        raise JWTError("invalid")

    monkeypatch.setattr(auth, "decode_refresh_token", _raise_invalid)
    client.cookies.set("refresh_token", "bad")

    response = client.post("/auth/refresh")

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid refresh token."


def test_revoke_marks_session_revoked(fake_user_context):
    target_session = SimpleNamespace(id=fake_user_context.session_id, revoked_at=None)
    fake_db = FakeDB(query_results={SocialSession: FakeQuery(first_result=target_session)})
    client = create_client(
        router=auth.router,
        prefix="/auth",
        fake_db=fake_db,
        current_user=fake_user_context,
    )

    response = client.post("/auth/revoke")

    assert response.status_code == 204
    assert target_session.revoked_at is not None
    assert fake_db.commit_called is True
    assert "refresh_token=" in response.headers.get("set-cookie", "")


def test_revoke_without_session_returns_204(fake_user_context):
    fake_db = FakeDB(query_results={SocialSession: FakeQuery(first_result=None)})
    client = create_client(
        router=auth.router,
        prefix="/auth",
        fake_db=fake_db,
        current_user=fake_user_context,
    )

    response = client.post("/auth/revoke")

    assert response.status_code == 204
    assert fake_db.commit_called is False


def test_me_returns_authenticated_user(fake_user_context):
    client = create_client(
        router=auth.router,
        prefix="/auth",
        fake_db=FakeDB(),
        current_user=fake_user_context,
    )

    response = client.get("/auth/me")

    assert response.status_code == 200
    data = response.json()
    assert UUID(data["id"]) == fake_user_context.user.id
    assert data["email"] == "owner@example.com"


def test_delete_account_deletes_user_and_clears_cookie(fake_user_context):
    fake_db = FakeDB()
    client = create_client(
        router=auth.router,
        prefix="/auth",
        fake_db=fake_db,
        current_user=fake_user_context,
    )

    response = client.delete("/auth/delete-account")

    assert response.status_code == 204
    assert fake_user_context.user in fake_db.deleted
    assert fake_db.commit_called is True
    assert "refresh_token=" in response.headers.get("set-cookie", "")


def test_facebook_init_rate_limit_returns_429(monkeypatch: pytest.MonkeyPatch):
    fake_db = FakeDB()
    client = create_client(router=auth.router, prefix="/auth", fake_db=fake_db)

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
