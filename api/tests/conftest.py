import os
from collections.abc import Generator
from datetime import datetime, timezone
from types import SimpleNamespace
from typing import Any
from uuid import UUID, uuid4

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.requests import Request as StarletteRequest
from starlette.responses import Response as StarletteResponse

from api.database import get_db
from api.deps import UserContext, get_current_user
from api.models import User
from api.utils.limiter import limiter

# Minimal env required by api.config imports in tests.
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
os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")


def _rate_limit_exception_handler(
    request: StarletteRequest, exc: Exception
) -> StarletteResponse:
    if isinstance(exc, RateLimitExceeded):
        return _rate_limit_exceeded_handler(request, exc)
    raise exc


class FakeQuery:
    def __init__(
        self, *, first_result: Any = None, all_result: list[Any] | None = None
    ):
        self._first_result = first_result
        self._all_result = all_result or []

    def filter(self, *args: Any, **kwargs: Any) -> "FakeQuery":
        return self

    def filter_by(self, *args: Any, **kwargs: Any) -> "FakeQuery":
        return self

    def join(self, *args: Any, **kwargs: Any) -> "FakeQuery":
        return self

    def outerjoin(self, *args: Any, **kwargs: Any) -> "FakeQuery":
        return self

    def order_by(self, *args: Any, **kwargs: Any) -> "FakeQuery":
        return self

    def options(self, *args: Any, **kwargs: Any) -> "FakeQuery":
        return self

    def distinct(self) -> "FakeQuery":
        return self

    def first(self) -> Any:
        return self._first_result

    def all(self) -> list[Any]:
        return self._all_result


class FakeDB:
    def __init__(self, query_results: dict[Any, FakeQuery] | None = None):
        self.query_results = query_results or {}
        self.added: list[Any] = []
        self.deleted: list[Any] = []
        self.commit_called = False
        self.flush_called = False

    def query(self, model: Any) -> FakeQuery:
        return self.query_results.get(model, FakeQuery())

    def add(self, instance: Any) -> None:
        self.added.append(instance)

    def delete(self, instance: Any) -> None:
        self.deleted.append(instance)

    def commit(self) -> None:
        self.commit_called = True

    def refresh(self, instance: Any) -> None:
        now = datetime.now(timezone.utc)
        if getattr(instance, "id", None) is None:
            instance.id = uuid4()
        if getattr(instance, "created_at", None) is None:
            instance.created_at = now
        if getattr(instance, "updated_at", None) is None:
            instance.updated_at = now
        if hasattr(instance, "owner") and instance.owner is None:
            instance.owner = SimpleNamespace(full_name="Test Owner")

    def flush(self) -> None:
        self.flush_called = True
        for instance in self.added:
            if getattr(instance, "id", None) is None:
                instance.id = uuid4()


def create_client(
    *,
    router: Any,
    prefix: str,
    fake_db: FakeDB,
    current_user: UserContext | None = None,
) -> TestClient:
    app = FastAPI()
    app.state.limiter = limiter
    app.add_middleware(SlowAPIMiddleware)
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exception_handler)
    app.include_router(router, prefix=prefix)

    def _get_db_override() -> Generator[FakeDB, None, None]:
        yield fake_db

    app.dependency_overrides[get_db] = _get_db_override

    if current_user is not None:
        app.dependency_overrides[get_current_user] = lambda: current_user

    return TestClient(app)


@pytest.fixture
def fake_user_context() -> UserContext:
    user = User(
        id=uuid4(),
        email="owner@example.com",
        full_name="Owner User",
        avatar_url=None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    return UserContext(
        user=user, session_id=UUID("11111111-1111-1111-1111-111111111111")
    )


@pytest.fixture(autouse=True)
def reset_rate_limiter() -> None:
    # SlowAPI counters are global in process and must be reset for deterministic tests.
    limiter.reset()
