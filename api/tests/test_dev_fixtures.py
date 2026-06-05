from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

import pytest

from api.config import settings
from api.models import Car, IntegrationAuditLog, User
from api.routers import dev_fixtures

from .conftest import FakeDB, FakeQuery, create_client, fake_user_context


def test_seed_success_creates_demo_entities(fake_user_context, monkeypatch):
    fake_db = FakeDB()
    client = create_client(
        router=dev_fixtures.router,
        prefix="/auth",
        fake_db=fake_db,
        current_user=fake_user_context,
    )

    monkeypatch.setattr(
        dev_fixtures.RideOut,
        "from_ride",
        classmethod(lambda cls, r: {"id": str(getattr(r, "id", "unknown"))}),
    )

    response = client.post("/auth/dev/fixtures/generate")

    assert response.status_code == 200
    payload = response.json()
    assert "meta" in payload
    meta = payload["meta"]
    assert (
        "car_id" in meta
        and "ride_id" in meta
        and "visitor_ride_id" in meta
        and "invitation_token" in meta
    )

    # integration event should have been added and db.commit called
    assert fake_db.commit_called is True
    assert any(isinstance(a, IntegrationAuditLog) for a in fake_db.added)


def test_seed_forbidden_when_disabled(fake_user_context, monkeypatch):
    # Temporarily disable demo fixtures
    monkeypatch.setattr(settings, "demo_fixtures_enabled", False)

    fake_db = FakeDB()
    client = create_client(
        router=dev_fixtures.router,
        prefix="/auth",
        fake_db=fake_db,
        current_user=fake_user_context,
    )

    response = client.post("/auth/dev/fixtures/generate")
    assert response.status_code == 403
    assert (
        response.json()["detail"] == "Demo fixtures are disabled in this environment."
    )


def test_reset_deletes_demo_cars(fake_user_context):
    car1 = SimpleNamespace(id=uuid4(), name="DEMO_AUTOGEN:abc")
    car2 = SimpleNamespace(id=uuid4(), name="DEMO_VISIT:xyz")

    user1 = SimpleNamespace(
        id=uuid4(),
        email="demo-host+1@example.com",
        full_name=f"{dev_fixtures.DEMO_NAME_PREFIX} Host 01",
    )
    user2 = SimpleNamespace(
        id=uuid4(),
        email="demo-passenger-1+abcd@example.com",
        full_name=f"{dev_fixtures.DEMO_NAME_PREFIX} Passenger 01",
    )

    fake_db = FakeDB(
        query_results={
            Car: FakeQuery(all_result=[car1, car2]),
            User: FakeQuery(all_result=[user1, user2]),
        }
    )
    client = create_client(
        router=dev_fixtures.router,
        prefix="/auth",
        fake_db=fake_db,
        current_user=fake_user_context,
    )

    response = client.post("/auth/dev/fixtures/reset")

    assert response.status_code == 200
    body = response.json()
    assert body["deleted_cars"] == 2
    assert any(
        getattr(d, 'name', None) and d.name.startswith('DEMO_') for d in fake_db.deleted
    )
    assert any(
        getattr(d, 'full_name', None)
        and d.full_name.startswith(dev_fixtures.DEMO_NAME_PREFIX)
        for d in fake_db.deleted
    )
    assert fake_db.commit_called is True
