from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pytest
from fastapi import status
from fastapi.testclient import TestClient

from api.models import SocialAccount, User
from api.routers import auth
from api.schemas import PassengerOut, UserBasicOut, UserOut
from api.services.oauth_service import normalize_avatar_url

from .conftest import FakeDB, FakeQuery, create_client


def test_get_facebook_proxy_url_rewrites_facebook_urls():
    user_id = uuid4()
    fb_url = "https://platform-lookaside.fbsbx.com/platform/profilepic/?asid=123"
    non_fb_url = "https://example.com/avatar.png"

    # Schema imports
    from api.schemas import get_facebook_proxy_url

    rewritten = get_facebook_proxy_url(user_id, fb_url)
    assert rewritten is not None
    assert "/auth/users/" in rewritten
    assert str(user_id) in rewritten
    assert rewritten.endswith("/avatar")

    assert get_facebook_proxy_url(user_id, non_fb_url) == non_fb_url
    assert get_facebook_proxy_url(user_id, None) is None


def test_schemas_serialize_and_rewrite_facebook_urls():
    user_id = uuid4()
    fb_url = "https://platform-lookaside.fbsbx.com/platform/profilepic/?asid=123"

    # 1. UserOut
    user_out = UserOut(
        id=user_id,
        email="test@example.com",
        full_name="Test User",
        avatar_url=fb_url,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    assert "/auth/users/" in user_out.avatar_url
    assert str(user_id) in user_out.avatar_url

    # 2. UserBasicOut
    user_basic_out = UserBasicOut(
        id=user_id,
        full_name="Test User",
        avatar_url=fb_url,
    )
    assert "/auth/users/" in user_basic_out.avatar_url

    # 3. PassengerOut
    passenger_out = PassengerOut(
        user_id=user_id,
        seat_position=2,
        full_name="Passenger",
        avatar_url=fb_url,
    )
    assert "/auth/users/" in passenger_out.avatar_url


def test_avatar_proxy_route_not_found():
    fake_db = FakeDB()
    client = create_client(router=auth.router, prefix="/auth", fake_db=fake_db)

    # User does not exist
    response = client.get(f"/auth/users/{uuid4()}/avatar", follow_redirects=False)
    assert response.status_code == 404
    assert response.json()["detail"] == "Avatar not found"


def test_avatar_proxy_route_redirects_non_facebook_immediately():
    user_id = uuid4()
    avatar_url = "https://example.com/avatar.png"
    user = User(
        id=user_id,
        email="test@example.com",
        full_name="Test User",
        avatar_url=avatar_url,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

    class CustomFakeDB(FakeDB):
        def query(self, model):
            if model == User:
                return FakeQuery(first_result=user)
            return FakeQuery()

    client = create_client(router=auth.router, prefix="/auth", fake_db=CustomFakeDB())

    response = client.get(f"/auth/users/{user_id}/avatar", follow_redirects=False)
    assert (
        response.status_code == status.HTTP_307_TEMPORARY_REDIRECT
        or response.status_code == status.HTTP_302_FOUND
    )
    assert response.headers["location"] == avatar_url


def test_avatar_proxy_route_redirects_fresh_facebook_immediately():
    user_id = uuid4()
    fb_url = "https://platform-lookaside.fbsbx.com/platform/profilepic/?asid=123"
    user = User(
        id=user_id,
        email="test@example.com",
        full_name="Test User",
        avatar_url=fb_url,
        created_at=datetime.now(timezone.utc),
        # updated_at is current, so it's fresh (no fetch needed)
        updated_at=datetime.now(timezone.utc),
    )

    class CustomFakeDB(FakeDB):
        def query(self, model):
            if model == User:
                return FakeQuery(first_result=user)
            return FakeQuery()

    client = create_client(router=auth.router, prefix="/auth", fake_db=CustomFakeDB())

    response = client.get(f"/auth/users/{user_id}/avatar", follow_redirects=False)
    assert response.headers["location"] == fb_url


def test_avatar_proxy_route_refreshes_stale_facebook(monkeypatch):
    user_id = uuid4()
    old_fb_url = "https://platform-lookaside.fbsbx.com/platform/profilepic/?asid=123"
    new_fb_url = (
        "https://platform-lookaside.fbsbx.com/platform/profilepic/?asid=123-new-token"
    )

    user = User(
        id=user_id,
        email="test@example.com",
        full_name="Test User",
        avatar_url=old_fb_url,
        created_at=datetime.now(timezone.utc),
        # updated_at is 15 hours ago (stale)
        updated_at=datetime.now(timezone.utc) - timedelta(hours=15),
    )

    social_account = SocialAccount(
        provider="facebook",
        social_id="fb-123",
        user_id=user_id,
        user=user,
    )
    user.social_accounts = [social_account]

    class CustomFakeDB(FakeDB):
        def query(self, model):
            if model == User:
                return FakeQuery(first_result=user)
            return FakeQuery()

    # Mock the httpx call
    class FakeResponse:
        status_code = 200

        def json(self):
            return {"data": {"url": new_fb_url}}

    class FakeAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            pass

        async def get(self, url, params=None):
            return FakeResponse()

    monkeypatch.setattr(auth.httpx, "AsyncClient", FakeAsyncClient)

    client = create_client(router=auth.router, prefix="/auth", fake_db=CustomFakeDB())
    response = client.get(f"/auth/users/{user_id}/avatar", follow_redirects=False)

    # Verify redirect location is the new URL
    assert response.headers["location"] == new_fb_url
    # Verify database avatar_url was updated
    assert user.avatar_url == new_fb_url


def test_avatar_proxy_route_graceful_on_facebook_error(monkeypatch):
    user_id = uuid4()
    old_fb_url = "https://platform-lookaside.fbsbx.com/platform/profilepic/?asid=123"

    user = User(
        id=user_id,
        email="test@example.com",
        full_name="Test User",
        avatar_url=old_fb_url,
        created_at=datetime.now(timezone.utc),
        # stale
        updated_at=datetime.now(timezone.utc) - timedelta(hours=15),
    )

    social_account = SocialAccount(
        provider="facebook",
        social_id="fb-123",
        user_id=user_id,
        user=user,
    )
    user.social_accounts = [social_account]

    class CustomFakeDB(FakeDB):
        def query(self, model):
            if model == User:
                return FakeQuery(first_result=user)
            return FakeQuery()

    # Mock the httpx call to fail
    class FakeAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            pass

        async def get(self, url, params=None):
            raise Exception("Facebook API down")

    monkeypatch.setattr(auth.httpx, "AsyncClient", FakeAsyncClient)

    client = create_client(router=auth.router, prefix="/auth", fake_db=CustomFakeDB())
    response = client.get(f"/auth/users/{user_id}/avatar", follow_redirects=False)

    # Should fall back to redirecting to the old avatar URL instead of failing with 500
    assert response.headers["location"] == old_fb_url
