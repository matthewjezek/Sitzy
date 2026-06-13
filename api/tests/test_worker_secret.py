import pytest
from fastapi.testclient import TestClient

from api.config import settings
from api.main import app


def test_worker_secret_middleware_when_disabled(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Test that if WORKER_SECRET is not configured, requests pass through without header check."""
    monkeypatch.setattr(settings, "worker_secret", None)

    client = TestClient(app)
    response = client.get("/alive")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_worker_secret_middleware_when_enabled_and_secret_matches(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Test that if WORKER_SECRET is configured and environment is production, requests with correct x-worker-secret header pass through."""
    monkeypatch.setattr(settings, "worker_secret", "test-secret-value-123")
    monkeypatch.setattr(settings, "environment", "production")

    client = TestClient(app)
    response = client.get(
        "/alive", headers={"x-worker-secret": "test-secret-value-123"}
    )
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_worker_secret_middleware_when_enabled_and_secret_mismatches(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Test that if WORKER_SECRET is configured and environment is production, requests with wrong or missing x-worker-secret header are rejected with 403."""
    monkeypatch.setattr(settings, "worker_secret", "test-secret-value-123")
    monkeypatch.setattr(settings, "environment", "production")

    client = TestClient(app)
    # Missing header
    response = client.get("/alive")
    assert response.status_code == 403
    assert response.text == "Forbidden"

    # Wrong header
    response = client.get("/alive", headers={"x-worker-secret": "wrong-secret"})
    assert response.status_code == 403
    assert response.text == "Forbidden"


def test_worker_secret_middleware_bypasses_options(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Test that OPTIONS requests bypass the x-worker-secret check even if WORKER_SECRET is enabled and environment is production."""
    monkeypatch.setattr(settings, "worker_secret", "test-secret-value-123")
    monkeypatch.setattr(settings, "environment", "production")

    client = TestClient(app)
    response = client.options("/alive")
    # OPTIONS requests should bypass the secret check and return status other than 403 (e.g. 405 Method Not Allowed)
    assert response.status_code != 403
