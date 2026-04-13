from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from urllib.parse import parse_qs, urlparse
from uuid import uuid4

import pytest

from api.services import oauth_service


class _FakeRedis:
    def __init__(self):
        self.storage: dict[str, str] = {}

    def set(self, key: str, value: str, ex: int | None = None) -> None:
        self.storage[key] = value

    def getdel(self, key: str):
        return self.storage.pop(key, None)


def test_oauth_state_manager_store_and_consume(monkeypatch: pytest.MonkeyPatch):
    fake_redis = _FakeRedis()
    monkeypatch.setattr(oauth_service, "_redis", fake_redis)

    manager = oauth_service.OAuthStateManager()
    state = "state-abc"
    manager.store_state(state=state, provider="x", code_verifier="verifier", ttl=120)

    assert manager.validate_and_consume_state(state) == ("x", "verifier")
    assert manager.validate_and_consume_state(state) is None


def test_x_oauth_authorization_url_contains_pkce_and_state():
    client = oauth_service.XOAuthClient()

    url = client.get_authorization_url(state="state-1", code_challenge="challenge-1")
    query = parse_qs(urlparse(url).query)

    assert query["response_type"] == ["code"]
    assert query["state"] == ["state-1"]
    assert query["code_challenge"] == ["challenge-1"]
    assert query["code_challenge_method"] == ["S256"]


def test_facebook_oauth_authorization_url_contains_required_params():
    client = oauth_service.FacebookOAuthClient()

    url = client.get_authorization_url(state="state-2")
    query = parse_qs(urlparse(url).query)

    assert query["state"] == ["state-2"]
    assert query["response_type"] == ["code"]
    assert query["scope"] == ["email,public_profile"]


def test_find_or_create_user_creates_new_user_when_missing():
    created: dict[str, object] = {}

    class FakeDB:
        def __init__(self):
            self.social = None
            self.user = None

        def query(self, model):
            class _Q:
                def __init__(self, outer, model_ref):
                    self.outer = outer
                    self.model_ref = model_ref

                def filter_by(self, **kwargs):
                    return self

                def filter(self, *args, **kwargs):
                    return self

                def first(self):
                    if self.model_ref.__name__ == "SocialAccount":
                        return self.outer.social
                    return self.outer.user

            return _Q(self, model)

        def add(self, obj):
            if obj.__class__.__name__ == "User":
                created["user"] = obj
                self.user = obj
            else:
                created["social_account"] = obj
                self.social = obj

        def flush(self):
            if "user" in created and getattr(created["user"], "id", None) is None:
                created["user"].id = uuid4()
            if (
                "social_account" in created
                and getattr(created["social_account"], "id", None) is None
            ):
                created["social_account"].id = uuid4()

    db = FakeDB()

    user = oauth_service.find_or_create_user(
        provider="facebook",
        social_id="fb-1",
        email="new@example.com",
        full_name="New User",
        avatar_url="https://example.com/new.png",
        db=db,
    )

    assert user.email == "new@example.com"
    assert "social_account" in created


def test_create_or_update_session_sets_expiry_and_tokens():
    added: list[object] = []

    class FakeDB:
        def add(self, obj):
            added.append(obj)

        def flush(self):
            for obj in added:
                if getattr(obj, "id", None) is None:
                    obj.id = uuid4()

    db = FakeDB()
    session = oauth_service.create_or_update_session(
        user_id=uuid4(),
        social_account_id=uuid4(),
        provider_access_token="access-token",
        provider_refresh_token="refresh-token",
        expires_in=3600,
        user_agent="pytest",
        db=db,
    )

    assert session.access_token == "access-token"
    assert session.refresh_token == "refresh-token"
    assert session.expires_at > datetime.now(timezone.utc) + timedelta(minutes=50)
    assert len(added) == 1
