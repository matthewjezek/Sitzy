import asyncio
import importlib
import json
import logging
import sys
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from uuid import uuid4

import httpx
import pytest
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, ConfigDict
from starlette.requests import Request

from api.config import Settings
from api.database import get_db, normalize_database_url
from api.deps import UserContext, get_current_user
from api.models import SocialSession, User
from api.schemas import CarFullOut, SeatOut, UserOut
from api.services import oauth_service
from api.utils import logging_config, logging_patterns, security, seats
from api.utils.base_models import BaseModelWithLabels
from api.utils.enums import CarLayout


class _FakeLogger:
    def __init__(self) -> None:
        self.calls: list[tuple[int, str, dict[str, object] | None]] = []

    def log(self, level: int, message: str, extra: dict[str, object] | None = None) -> None:
        self.calls.append((level, message, extra))

    def info(self, message: str, extra: dict[str, object] | None = None) -> None:
        self.log(logging.INFO, message, extra)

    def warning(self, message: str, extra: dict[str, object] | None = None) -> None:
        self.log(logging.WARNING, message, extra)

    def error(self, message: str, extra: dict[str, object] | None = None) -> None:
        self.log(logging.ERROR, message, extra)


class _FakeQuery:
    def __init__(self, result: object | None):
        self._result = result

    def filter(self, *args: object, **kwargs: object) -> "_FakeQuery":
        return self

    def first(self) -> object | None:
        return self._result


class _FakeDbForDeps:
    def __init__(self, user: object | None, session: object | None):
        self._user = user
        self._session = session
        self._queries: list[object] = []

    def query(self, model: object) -> _FakeQuery:
        self._queries.append(model)
        if model is User:
            return _FakeQuery(self._user)
        if model is SocialSession:
            return _FakeQuery(self._session)
        return _FakeQuery(None)


class _FakeSession:
    def __init__(self) -> None:
        self.closed = False

    def close(self) -> None:
        self.closed = True


class _LabelSource:
    def __init__(self, value: int) -> None:
        self.value = value


class _LabelModel(BaseModelWithLabels["_LabelModel"]):
    model_config = ConfigDict(from_attributes=True)

    value: int


@pytest.fixture(autouse=True)
def _reset_logging_context() -> None:
    logging_config.set_request_context("N/A")
    logging_config.operation_start_time.set(0.0)


def test_base_model_with_labels_uses_model_validate() -> None:
    source = _LabelSource(7)

    model = _LabelModel.from_orm_with_labels(source)

    assert model.value == 7


def test_security_token_helpers(monkeypatch: pytest.MonkeyPatch) -> None:
    encoded_payloads: list[dict[str, object]] = []

    def fake_encode(payload: dict[str, object], secret_key: str, algorithm: str) -> str:
        encoded_payloads.append(payload)
        return f"token-{len(encoded_payloads)}"

    def fake_decode(token: str, secret_key: str, algorithms: list[str]) -> dict[str, object]:
        if token == "refresh-token":
            return {"type": "refresh", "sub": "user-id", "session_id": "session-id"}
        return {"type": "wrong"}

    monkeypatch.setattr(security.jwt, "encode", fake_encode)
    monkeypatch.setattr(security.jwt, "decode", fake_decode)
    monkeypatch.setattr(security.secrets, "token_urlsafe", lambda length: f"generated-{length}")

    access_token = security.create_access_token({"sub": "user-id"}, timedelta(minutes=5))
    refresh_token = security.create_refresh_token(uuid4(), uuid4())

    assert access_token == "token-1"
    assert refresh_token == "token-2"
    assert encoded_payloads[0]["type"] == "access"
    assert encoded_payloads[1]["type"] == "refresh"
    assert security.decode_refresh_token("refresh-token")["type"] == "refresh"

    with pytest.raises(Exception):
        security.decode_refresh_token("bad-token")

    assert security.generate_token(12) == "generated-12"


def test_settings_validators_reject_invalid_values() -> None:
    with pytest.raises(ValueError, match="https://"):
        Settings.https_in_production(
            "http://localhost/auth/callback",
            SimpleNamespace(data={"environment": "production"}),
        )

    with pytest.raises(ValueError, match="must be different"):
        Settings.keys_must_differ(
            "a" * 32,
            SimpleNamespace(data={"secret_key": "a" * 32}, field_name="refresh_secret_key"),
        )


def test_schema_helpers_cover_custom_label_and_masking_paths() -> None:
    user = SimpleNamespace(
        id=uuid4(),
        email="hidden.invalid",
        full_name="Hidden User",
        avatar_url=None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        social_accounts=[],
    )
    user_out = UserOut.model_validate(user)
    assert user_out.email is None

    seat = SimpleNamespace(car_id=uuid4(), position=3)
    assert SeatOut.from_orm_with_labels(seat).position == 3

    car = SimpleNamespace(
        id=uuid4(),
        owner_id=uuid4(),
        owner=SimpleNamespace(full_name="Owner User"),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        name="Skoda",
        layout=CarLayout.SEDAQ,
        seats=[],
        drivers=[],
        rides=[],
    )
    car_full = CarFullOut.from_orm_with_labels(car)
    assert car_full.owner_name == "Owner User"


def test_database_helpers_and_session_cleanup(monkeypatch: pytest.MonkeyPatch) -> None:
    assert normalize_database_url("postgres://example.com/db") == "postgresql://example.com/db"
    assert normalize_database_url("sqlite:///tmp.db") == "sqlite:///tmp.db"

    fake_session = _FakeSession()
    monkeypatch.setattr("api.database.SessionLocal", lambda: fake_session)

    generator = get_db()
    assert next(generator) is fake_session

    with pytest.raises(StopIteration):
        next(generator)

    assert fake_session.closed


def test_database_module_raises_without_database_url(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setattr("dotenv.load_dotenv", lambda *args, **kwargs: None)
    sys.modules.pop("api.database", None)

    with pytest.raises(ValueError, match="DATABASE_URL není nastavený"):
        importlib.import_module("api.database")


def test_get_current_user_validates_token_and_session(monkeypatch: pytest.MonkeyPatch) -> None:
    user = SimpleNamespace(id=uuid4())
    session = SimpleNamespace(id=uuid4(), revoked_at=None, expires_at=datetime.now(timezone.utc) + timedelta(minutes=5))
    token = {"sub": str(user.id), "session_id": str(session.id), "type": "access"}

    monkeypatch.setattr(logging_config.settings, "secret_key", "a" * 32)
    monkeypatch.setattr(logging_config.settings, "algorithm", "HS256")
    monkeypatch.setattr("api.deps.jwt.decode", lambda *args, **kwargs: token)

    current_user = get_current_user.__wrapped__ if hasattr(get_current_user, "__wrapped__") else get_current_user
    context = current_user(
        token="access-token",
        db=_FakeDbForDeps(user=user, session=session),
    )

    assert isinstance(context, UserContext)
    assert context.user is user
    assert context.session_id == session.id


@pytest.mark.parametrize(
    "decode_result, expected_message",
    [
        (ValueError("bad token"), "Could not validate credentials"),
        ({"sub": 123, "session_id": "abc", "type": "access"}, "Could not validate credentials"),
        ({"sub": str(uuid4()), "session_id": str(uuid4()), "type": "refresh"}, "Could not validate credentials"),
    ],
)
def test_get_current_user_rejects_invalid_tokens(
    monkeypatch: pytest.MonkeyPatch,
    decode_result: object,
    expected_message: str,
) -> None:
    monkeypatch.setattr(logging_config.settings, "secret_key", "a" * 32)
    monkeypatch.setattr(logging_config.settings, "algorithm", "HS256")

    if isinstance(decode_result, Exception):
        monkeypatch.setattr("api.deps.jwt.decode", lambda *args, **kwargs: (_ for _ in ()).throw(decode_result))
    else:
        monkeypatch.setattr("api.deps.jwt.decode", lambda *args, **kwargs: decode_result)

    with pytest.raises(Exception, match=expected_message):
        get_current_user(token="access-token", db=_FakeDbForDeps(user=None, session=None))


@pytest.mark.parametrize(
    "user, session",
    [
        (None, SimpleNamespace(id=uuid4(), revoked_at=None, expires_at=datetime.now(timezone.utc) + timedelta(minutes=5))),
        (SimpleNamespace(id=uuid4()), None),
    ],
)
def test_get_current_user_rejects_missing_user_or_session(
    monkeypatch: pytest.MonkeyPatch,
    user: object | None,
    session: object | None,
) -> None:
    token = {"sub": str(uuid4()), "session_id": str(uuid4()), "type": "access"}
    monkeypatch.setattr(logging_config.settings, "secret_key", "a" * 32)
    monkeypatch.setattr(logging_config.settings, "algorithm", "HS256")
    monkeypatch.setattr("api.deps.jwt.decode", lambda *args, **kwargs: token)

    with pytest.raises(Exception, match="Could not validate credentials"):
        get_current_user(token="access-token", db=_FakeDbForDeps(user=user, session=session))


def test_oauth_service_import_and_state_generation_branches(monkeypatch: pytest.MonkeyPatch) -> None:
    captured: dict[str, object] = {}

    def fake_from_url(url: str, **kwargs: object) -> object:
        captured["url"] = url
        captured["kwargs"] = kwargs
        return SimpleNamespace()

    monkeypatch.setattr(oauth_service.settings, "redis_url", "rediss://localhost:6379/0")
    monkeypatch.setattr(oauth_service.redis_lib, "from_url", fake_from_url)
    reloaded = importlib.reload(oauth_service)

    state_manager = reloaded.OAuthStateManager()
    state = state_manager.generate_state()

    assert captured["url"] == "rediss://localhost:6379/0"
    assert captured["kwargs"]["ssl_cert_reqs"] == oauth_service.ssl.CERT_NONE
    assert len(state) == 64
    assert reloaded.normalize_avatar_url("http://example.com/avatar.png") == "https://example.com/avatar.png"


def test_oauth_service_updates_existing_user_by_email() -> None:
    existing_user = SimpleNamespace(
        id=uuid4(),
        email="hidden.invalid",
        full_name="Old Name",
        avatar_url="http://old.example/avatar.png",
    )

    class FakeDb:
        def query(self, model: object) -> object:
            class _Query:
                def __init__(self, model_ref: object) -> None:
                    self.model_ref = model_ref

                def filter_by(self, **kwargs: object) -> object:
                    return self

                def filter(self, *args: object, **kwargs: object) -> object:
                    return self

                def first(self) -> object | None:
                    if self.model_ref.__name__ == "SocialAccount":
                        return None
                    return existing_user

            return _Query(model)

        def add(self, obj: object) -> None:
            return None

        def flush(self) -> None:
            return None

    result = oauth_service.find_or_create_user(
        provider="facebook",
        social_id="fb-1",
        email="real@example.com",
        full_name="Updated Name",
        avatar_url="https://example.com/avatar.png",
        db=FakeDb(),
    )

    assert result is existing_user
    assert existing_user.email == "real@example.com"
    assert existing_user.full_name == "Updated Name"


def test_oauth_service_generate_pkce(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(oauth_service, "generate_token", lambda length: "verifier-xyz")
    monkeypatch.setattr(
        oauth_service,
        "create_s256_code_challenge",
        lambda verifier: f"challenge-{verifier}",
    )

    verifier, challenge = oauth_service.XOAuthClient().generate_pkce()

    assert verifier == "verifier-xyz"
    assert challenge == "challenge-verifier-xyz"


def test_x_oauth_exchange_code_success_and_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    class _SuccessResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict[str, str]:
            return {"access_token": "token-123"}

    class _SuccessClient:
        def __init__(self, *args: object, **kwargs: object) -> None:
            self.calls: list[tuple[str, dict[str, object], tuple[str, str]]] = []

        def __enter__(self) -> "_SuccessClient":
            return self

        def __exit__(self, exc_type, exc, tb) -> None:
            return None

        def post(self, url: str, data: dict[str, object], auth: tuple[str, str]) -> _SuccessResponse:
            self.calls.append((url, data, auth))
            return _SuccessResponse()

    class _FailureResponse:
        def raise_for_status(self) -> None:
            raise httpx.HTTPError("boom")

    class _FailureClient(_SuccessClient):
        def post(self, url: str, data: dict[str, object], auth: tuple[str, str]) -> _FailureResponse:
            self.calls.append((url, data, auth))
            return _FailureResponse()

    monkeypatch.setattr(oauth_service.httpx, "Client", _SuccessClient)
    result = oauth_service.XOAuthClient().exchange_code("code-1", "verifier-1")
    assert result == {"access_token": "token-123"}

    monkeypatch.setattr(oauth_service.httpx, "Client", _FailureClient)
    with pytest.raises(httpx.HTTPError):
        oauth_service.XOAuthClient().exchange_code("code-2", "verifier-2")


def test_x_oauth_get_user_info_success(monkeypatch: pytest.MonkeyPatch) -> None:
    payload = {"data": {"id": "x-1", "name": "X User", "profile_image_url": "http://example.com/x.png"}}

    class _FakeResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict[str, object]:
            return payload

    class _FakeAsyncClient:
        def __init__(self, *args: object, **kwargs: object) -> None:
            return None

        async def __aenter__(self) -> "_FakeAsyncClient":
            return self

        async def __aexit__(self, exc_type, exc, tb) -> None:
            return None

        async def get(self, *args: object, **kwargs: object) -> _FakeResponse:
            return _FakeResponse()

    monkeypatch.setattr(oauth_service.httpx, "AsyncClient", _FakeAsyncClient)
    result = asyncio.run(oauth_service.XOAuthClient().get_user_info("token-1"))

    assert result["id"] == "x-1"
    assert result["avatar_url"] == "https://example.com/x.png"


def test_facebook_oauth_exchange_code_success_and_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    class _SuccessResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict[str, str]:
            return {"access_token": "fb-token"}

    class _SuccessClient:
        def __init__(self, *args: object, **kwargs: object) -> None:
            self.calls: list[tuple[str, dict[str, object]]] = []

        def __enter__(self) -> "_SuccessClient":
            return self

        def __exit__(self, exc_type, exc, tb) -> None:
            return None

        def get(self, url: str, params: dict[str, object]) -> _SuccessResponse:
            self.calls.append((url, params))
            return _SuccessResponse()

    class _FailureResponse:
        def raise_for_status(self) -> None:
            raise httpx.HTTPError("boom")

    class _FailureClient(_SuccessClient):
        def get(self, url: str, params: dict[str, object]) -> _FailureResponse:
            self.calls.append((url, params))
            return _FailureResponse()

    monkeypatch.setattr(oauth_service.httpx, "Client", _SuccessClient)
    result = oauth_service.FacebookOAuthClient().exchange_code("code-1")
    assert result == {"access_token": "fb-token"}

    monkeypatch.setattr(oauth_service.httpx, "Client", _FailureClient)
    with pytest.raises(httpx.HTTPError):
        oauth_service.FacebookOAuthClient().exchange_code("code-2")


@pytest.mark.parametrize(
    "layout, expected",
    [
        (CarLayout.TRAPAQ, [1, 2]),
        (CarLayout.SEDAQ, [1, 2, 3, 4]),
        (CarLayout.PRAQ, [1, 2, 3, 4, 5, 6, 7]),
    ],
)
def test_get_layout_seat_positions(layout: CarLayout, expected: list[int]) -> None:
    assert seats.get_layout_seat_positions(layout) == expected


def test_get_layout_seat_positions_falls_back_for_unknown_value() -> None:
    assert seats.get_layout_seat_positions(SimpleNamespace()) == [1, 2, 3, 4]


def test_logging_formatter_covers_dev_and_production_modes(monkeypatch: pytest.MonkeyPatch) -> None:
    formatter = logging_config.JSONFormatter()
    record = logging.LogRecord("api.test", logging.INFO, __file__, 42, "Hello %s", ("world",), None)
    record.extra_fields = {"request_id": "abc123", "action": "demo"}

    monkeypatch.setattr(logging_config.settings, "environment", "development")
    logging_config.set_request_context("abc123")

    dev_output = formatter.format(record)
    assert "Hello world" in dev_output
    assert "action" in dev_output
    assert "abc123" in dev_output

    try:
        raise RuntimeError("boom")
    except RuntimeError:
        record.exc_info = sys.exc_info()

    monkeypatch.setattr(logging_config.settings, "environment", "production")
    prod_output = formatter.format(record)
    parsed = json.loads(prod_output)

    assert parsed["logger"] == "api.test"
    assert parsed["message"] == "Hello world"
    assert parsed["request_id"] == "abc123"
    assert parsed["action"] == "demo"
    assert parsed["exception"]


def test_logging_helpers_emit_expected_context(monkeypatch: pytest.MonkeyPatch) -> None:
    fake_logger = _FakeLogger()

    logging_config.set_request_context("req-1")
    logging_config.start_operation_timer()
    assert logging_config.get_request_context() == "req-1"
    assert logging_config.get_operation_duration() >= 0

    logging_config.log_entry(fake_logger, "hello")
    logging_config.log_entry(fake_logger, "world", user_id="123")
    logging_config.log_action(fake_logger, "create_ride", status="started", car_id="car-1")
    logging_config.log_action_timing(fake_logger, "create_ride", 12.5, car_id="car-1")
    logging_config.log_error_action(fake_logger, "create_ride", "boom", car_id="car-1")
    logging_config.log_with_context(fake_logger, logging.INFO, "legacy", user_id="123")

    assert len(fake_logger.calls) == 6
    assert fake_logger.calls[0][2] is None
    assert fake_logger.calls[1][2] == {"extra_fields": {"user_id": "123"}}
    assert fake_logger.calls[2][2]["extra_fields"]["action"] == "create_ride"
    assert fake_logger.calls[3][2]["extra_fields"]["duration_ms"] == 12.5
    assert fake_logger.calls[4][2]["extra_fields"]["status"] == "failed"
    assert fake_logger.calls[5][1] == "legacy"


def test_logging_patterns_cover_sync_async_and_example_paths() -> None:
    @logging_patterns.log_database_operation("lookup_user")
    def lookup_user() -> str:
        return "ok"

    @logging_patterns.log_database_operation("lookup_user_fail")
    def lookup_user_fail() -> str:
        raise RuntimeError("boom")

    @logging_patterns.log_oauth_operation("facebook", "token_exchange")
    async def exchange_token() -> str:
        return "token"

    @logging_patterns.log_oauth_operation("facebook", "token_exchange_fail")
    async def exchange_token_fail() -> str:
        raise RuntimeError("boom")

    assert lookup_user() == "ok"
    with pytest.raises(RuntimeError):
        lookup_user_fail()
    assert asyncio.run(exchange_token()) == "token"
    with pytest.raises(RuntimeError):
        asyncio.run(exchange_token_fail())

    logging_patterns.example_simple_log()
    logging_patterns.example_action_log()
    logging_patterns.example_error_log()
    logging_patterns.example_multi_step_log()
    logging_patterns.example_crud_log()
    logging_patterns.bad_example_1()
    logging_patterns.bad_example_2()
    logging_patterns.bad_example_3()
    logging_patterns.bad_example_4()


def test_logging_reference_imports_safe_after_monkeypatch(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(logging_config, "get_logger", lambda name: _FakeLogger())
    monkeypatch.setattr(logging_config, "get_operation_duration", lambda: 12.3)
    monkeypatch.setattr(logging_config, "log_action", lambda *args, **kwargs: None)
    monkeypatch.setattr(logging_config, "log_action_timing", lambda *args, **kwargs: None)
    monkeypatch.setattr(logging_config, "log_entry", lambda *args, **kwargs: None)
    monkeypatch.setattr(logging_config, "log_error_action", lambda *args, **kwargs: None)
    monkeypatch.setattr(logging_config, "start_operation_timer", lambda: None)

    sys.modules.pop("api.utils.logging_reference", None)
    module = importlib.import_module("api.utils.logging_reference")

    assert module.logger is not None


def test_main_module_missing_dev_fixtures_branch(monkeypatch: pytest.MonkeyPatch) -> None:
    original_import_module = importlib.import_module

    def fake_import_module(name: str, package: str | None = None):
        if name == "api.routers.dev_fixtures":
            raise ModuleNotFoundError
        return original_import_module(name, package)

    monkeypatch.setattr(importlib, "import_module", fake_import_module)
    sys.modules.pop("api.main", None)
    module = importlib.import_module("api.main")

    assert module.dev_fixtures is None


def test_main_validation_handler_and_middleware_error_branch(monkeypatch: pytest.MonkeyPatch) -> None:
    sys.modules.pop("api.main", None)
    module = importlib.import_module("api.main")
    fake_logger = _FakeLogger()
    monkeypatch.setattr(module, "logger", fake_logger)
    monkeypatch.setattr(module, "get_request_context", lambda: "req-2")
    monkeypatch.setattr(module, "get_operation_duration", lambda: 42.0)
    monkeypatch.setattr(module.uuid, "uuid4", lambda: uuid4())

    scope = {
        "type": "http",
        "method": "POST",
        "path": "/test",
        "raw_path": b"/test",
        "scheme": "http",
        "query_string": b"",
        "headers": [],
        "client": ("127.0.0.1", 12345),
        "server": ("testserver", 80),
        "root_path": "",
        "http_version": "1.1",
        "asgi": {"version": "3.0"},
    }
    request = Request(scope)

    async def _raise(_: Request) -> object:
        raise RuntimeError("boom")

    with pytest.raises(RuntimeError):
        asyncio.run(module.logging_middleware(request, _raise))

    assert fake_logger.calls[-1][0] == logging.ERROR

    validation_error = RequestValidationError(
        [
            {
                "loc": ("body", "field"),
                "msg": "field required",
                "type": "value_error.missing",
            }
        ]
    )
    response = asyncio.run(module.validation_exception_handler(request, validation_error))

    assert response.status_code == 422
    assert fake_logger.calls[-1][0] == logging.WARNING
