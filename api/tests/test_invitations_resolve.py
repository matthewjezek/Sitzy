from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from uuid import uuid4

from api.models import IntegrationAuditLog
from api.models import Invitation as InvitationModel
from api.routers import invitations
from api.utils.enums import InvitationStatus

from .conftest import FakeDB, FakeQuery, create_client


def _ride():
    now = datetime.now(timezone.utc)
    return SimpleNamespace(
        id=uuid4(),
        departure_time=now + timedelta(hours=2),
        destination="Testtown",
        car=SimpleNamespace(name="TestCar", layout="SEDAQ", seats=[]),
    )


def test_resolve_invitation_valid_token_emits_event():
    ride = _ride()
    invitation = SimpleNamespace(
        id=uuid4(),
        token="valid-token",
        ride_id=ride.id,
        invited_email="someone@example.com",
        status=InvitationStatus.PENDING,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
        ride=ride,
    )

    fake_db = FakeDB(
        query_results={InvitationModel: FakeQuery(first_result=invitation)}
    )
    client = create_client(
        router=invitations.router, prefix="/invitations", fake_db=fake_db
    )

    response = client.get(f"/invitations/{invitation.token}/resolve")

    assert response.status_code == 200
    payload = response.json()
    assert payload["ride_id"] == str(ride.id)
    assert payload["destination"] == ride.destination
    # integration event should have been added and db.commit called
    assert fake_db.commit_called is True
    assert any(isinstance(a, IntegrationAuditLog) for a in fake_db.added)


def test_resolve_invitation_not_found():
    fake_db = FakeDB(query_results={InvitationModel: FakeQuery(first_result=None)})
    client = create_client(
        router=invitations.router, prefix="/invitations", fake_db=fake_db
    )

    response = client.get("/invitations/missing-token/resolve")

    assert response.status_code == 404
    assert response.json()["detail"] == "Invitation not found."


def test_resolve_invitation_expired():
    ride = _ride()
    invitation = SimpleNamespace(
        id=uuid4(),
        token="expired-token",
        ride_id=ride.id,
        invited_email="someone@example.com",
        status=InvitationStatus.PENDING,
        expires_at=datetime.now(timezone.utc) - timedelta(hours=1),
        ride=ride,
    )

    fake_db = FakeDB(
        query_results={InvitationModel: FakeQuery(first_result=invitation)}
    )
    client = create_client(
        router=invitations.router, prefix="/invitations", fake_db=fake_db
    )

    response = client.get(f"/invitations/{invitation.token}/resolve")

    assert response.status_code == 410
    assert response.json()["detail"] == "Invitation has expired."
