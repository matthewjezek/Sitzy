"""Tests for health check endpoints."""

import pytest
from fastapi.testclient import TestClient

from api.main import app

client = TestClient(app)


def test_health_check_returns_ok():
    """Test /health endpoint returns healthy status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "database" in data
    assert "redis" in data


def test_liveness_returns_ok():
    """Test /alive endpoint returns ok for container orchestration."""
    response = client.get("/alive")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
