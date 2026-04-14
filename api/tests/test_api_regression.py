from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from uuid import uuid4

import pytest

from api.models import (
    Car,
    IntegrationAuditLog,
    Invitation,
    Passenger,
    Ride,
    SocialAccount,
    SocialSession,
)
from api.routers import auth, cars, invitations, rides
from api.utils.enums import CarLayout, InvitationStatus

from .conftest import FakeDB, FakeQuery, create_client


def _car(owner_id):
    now = datetime.now(timezone.utc)
    return SimpleNamespace(
        id=uuid4(),
        owner_id=owner_id,
        owner=SimpleNamespace(full_name="Owner User"),
        name="Skoda",
        layout=CarLayout.SEDAQ,
        created_at=now,
        updated_at=now,
        seats=[SimpleNamespace(car_id=uuid4(), position=i) for i in [1, 2, 3, 4]],
        drivers=[],
        rides=[],
    )


def _ride(car, driver_id):
    now = datetime.now(timezone.utc)
    car_driver = SimpleNamespace(
        id=uuid4(),
        car_id=car.id,
        driver_id=driver_id,
        is_active=True,
        assigned_at=now,
        revoked_at=None,
    )
    return SimpleNamespace(
        id=uuid4(),
        car_id=car.id,
        car_driver_id=car_driver.id,
        car=car,
        car_driver=car_driver,
        departure_time=now + timedelta(hours=2),
        destination="Brno",
        created_at=now,
        passengers=[],
    )


def test_list_my_cars_returns_owned_cars(fake_user_context):
    car = _car(fake_user_context.user.id)
    fake_db = FakeDB(query_results={Car: FakeQuery(all_result=[car])})
    client = create_client(
        router=cars.router,
        prefix="/cars",
        fake_db=fake_db,
        current_user=fake_user_context,
    )

    response = client.get("/cars/")

    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 1
    assert payload[0]["owner_id"] == str(fake_user_context.user.id)


def test_read_car_by_id_requires_owner(fake_user_context):
    other_car = _car(uuid4())
    fake_db = FakeDB(query_results={Car: FakeQuery(first_result=other_car)})
    client = create_client(
        router=cars.router,
        prefix="/cars",
        fake_db=fake_db,
        current_user=fake_user_context,
    )

    response = client.get(f"/cars/{other_car.id}")

    assert response.status_code == 404


def test_update_car_rejects_non_owner(fake_user_context):
    other_car = _car(uuid4())
    fake_db = FakeDB(query_results={Car: FakeQuery(first_result=other_car)})
    client = create_client(
        router=cars.router,
        prefix="/cars",
        fake_db=fake_db,
        current_user=fake_user_context,
    )

    response = client.patch(
        f"/cars/{other_car.id}",
        json={"name": "Updated", "layout": "Sedan"},
    )

    assert response.status_code == 404


def test_delete_car_rejects_non_owner(fake_user_context):
    other_car = _car(uuid4())
    fake_db = FakeDB(query_results={Car: FakeQuery(first_result=other_car)})
    client = create_client(
        router=cars.router,
        prefix="/cars",
        fake_db=fake_db,
        current_user=fake_user_context,
    )

    response = client.delete(f"/cars/{other_car.id}")

    assert response.status_code == 404


def test_list_car_rides_for_owner(fake_user_context):
    car = _car(fake_user_context.user.id)
    ride = _ride(car, fake_user_context.user.id)
    fake_db = FakeDB(
        query_results={
            Car: FakeQuery(first_result=car),
            Ride: FakeQuery(all_result=[ride]),
        }
    )
    client = create_client(
        router=cars.router,
        prefix="/cars",
        fake_db=fake_db,
        current_user=fake_user_context,
    )

    response = client.get(f"/cars/{car.id}/rides")

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_get_my_rides_includes_owner_rides(fake_user_context):
    car = _car(fake_user_context.user.id)
    ride = _ride(car, fake_user_context.user.id)
    fake_db = FakeDB(query_results={Ride: FakeQuery(all_result=[ride])})
    client = create_client(
        router=rides.router,
        prefix="/rides",
        fake_db=fake_db,
        current_user=fake_user_context,
    )

    response = client.get("/rides/")

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_create_ride_rejects_non_owner(fake_user_context):
    car = _car(uuid4())
    fake_db = FakeDB(query_results={Car: FakeQuery(first_result=car)})
    client = create_client(
        router=rides.router,
        prefix="/rides",
        fake_db=fake_db,
        current_user=fake_user_context,
    )

    response = client.post(
        "/rides/",
        json={
            "car_id": str(car.id),
            "departure_time": (
                datetime.now(timezone.utc) + timedelta(hours=1)
            ).isoformat(),
            "destination": "Prague",
        },
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Only the car owner can create a ride."


def test_book_seat_rejects_already_booked(
    fake_user_context, monkeypatch: pytest.MonkeyPatch
):
    car = _car(fake_user_context.user.id)
    ride = _ride(car, fake_user_context.user.id)
    existing = SimpleNamespace(
        user_id=fake_user_context.user.id, ride_id=ride.id, seat_position=2
    )

    monkeypatch.setattr(rides, "_get_ride_or_404", lambda ride_id, db: ride)
    fake_db = FakeDB(query_results={Passenger: FakeQuery(first_result=existing)})
    client = create_client(
        router=rides.router,
        prefix="/rides",
        fake_db=fake_db,
        current_user=fake_user_context,
    )

    response = client.post(f"/rides/{ride.id}/book", json={"seat_position": 3})

    assert response.status_code == 409
    assert response.json()["detail"] == "Already booked."


def test_invite_passenger_rejects_self_invite(
    fake_user_context, monkeypatch: pytest.MonkeyPatch
):
    car = _car(fake_user_context.user.id)
    ride = _ride(car, fake_user_context.user.id)
    monkeypatch.setattr(rides, "_get_ride_or_404", lambda ride_id, db: ride)

    client = create_client(
        router=rides.router,
        prefix="/rides",
        fake_db=FakeDB(),
        current_user=fake_user_context,
    )

    response = client.post(
        f"/rides/{ride.id}/invite",
        json={"invited_email": "owner@example.com"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "You cannot invite yourself."


def test_invite_passenger_rejects_duplicate_pending(
    fake_user_context, monkeypatch: pytest.MonkeyPatch
):
    car = _car(fake_user_context.user.id)
    ride = _ride(car, fake_user_context.user.id)
    invitation = SimpleNamespace(status=InvitationStatus.PENDING)
    monkeypatch.setattr(rides, "_get_ride_or_404", lambda ride_id, db: ride)

    fake_db = FakeDB(query_results={Invitation: FakeQuery(first_result=invitation)})
    client = create_client(
        router=rides.router,
        prefix="/rides",
        fake_db=fake_db,
        current_user=fake_user_context,
    )

    response = client.post(
        f"/rides/{ride.id}/invite",
        json={"invited_email": "passenger@example.com"},
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "Invitation already sent."


def test_transfer_driver_requires_passenger(
    fake_user_context, monkeypatch: pytest.MonkeyPatch
):
    car = _car(fake_user_context.user.id)
    ride = _ride(car, fake_user_context.user.id)
    monkeypatch.setattr(rides, "_get_ride_or_404", lambda ride_id, db: ride)

    client = create_client(
        router=rides.router,
        prefix="/rides",
        fake_db=FakeDB(),
        current_user=fake_user_context,
    )

    response = client.post(
        f"/rides/{ride.id}/transfer-driver",
        json={"new_driver_id": str(uuid4())},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "New driver must be a passenger on this ride."


def test_get_received_invitations_returns_empty_for_user_without_email(
    fake_user_context,
):
    fake_user_context.user.email = None
    client = create_client(
        router=invitations.router,
        prefix="/invitations",
        fake_db=FakeDB(),
        current_user=fake_user_context,
    )

    response = client.get("/invitations/received")

    assert response.status_code == 200
    assert response.json() == []


def test_get_invitation_rejects_expired_token():
    invitation = SimpleNamespace(
        id=uuid4(),
        token="expired-token",
        expires_at=datetime.now(timezone.utc) - timedelta(seconds=1),
    )
    fake_db = FakeDB(query_results={Invitation: FakeQuery(first_result=invitation)})
    client = create_client(
        router=invitations.router,
        prefix="/invitations",
        fake_db=fake_db,
    )

    response = client.get("/invitations/expired-token")

    assert response.status_code == 410
    assert response.json()["detail"] == "Invitation has expired."


def test_accept_invitation_requires_email_match(fake_user_context):
    ride = SimpleNamespace(id=uuid4(), car=SimpleNamespace(seats=[]), passengers=[])
    invitation = SimpleNamespace(
        id=uuid4(),
        token="invite-token",
        ride_id=ride.id,
        invited_email="someone@example.com",
        status=InvitationStatus.PENDING,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
        ride=ride,
    )
    fake_db = FakeDB(query_results={Invitation: FakeQuery(first_result=invitation)})
    client = create_client(
        router=invitations.router,
        prefix="/invitations",
        fake_db=fake_db,
        current_user=fake_user_context,
    )

    response = client.post("/invitations/invite-token/accept", json={})

    assert response.status_code == 403
    assert response.json()["detail"] == "This is not your invitation."


def test_reject_invitation_updates_status(fake_user_context):
    invitation = SimpleNamespace(
        id=uuid4(),
        token="invite-token",
        invited_email="owner@example.com",
        status=InvitationStatus.PENDING,
        created_at=datetime.now(timezone.utc),
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
        ride_id=uuid4(),
        ride=None,
    )
    fake_db = FakeDB(query_results={Invitation: FakeQuery(first_result=invitation)})
    client = create_client(
        router=invitations.router,
        prefix="/invitations",
        fake_db=fake_db,
        current_user=fake_user_context,
    )

    response = client.post("/invitations/invite-token/reject")

    assert response.status_code == 200
    assert response.json()["status"] == "Rejected"
    assert invitation.status == InvitationStatus.REJECTED
    assert fake_db.commit_called is True


def test_social_dashboard_returns_accounts_sessions_and_events(fake_user_context):
    now = datetime.now(timezone.utc)
    account = SimpleNamespace(
        id=uuid4(),
        user_id=fake_user_context.user.id,
        provider="x",
        social_id="x-123",
        email="x-123@x.invalid",
        linked_at=now - timedelta(days=1),
    )
    session = SimpleNamespace(
        id=uuid4(),
        user_id=fake_user_context.user.id,
        social_account_id=account.id,
        social_account=account,
        created_at=now,
        expires_at=now + timedelta(hours=2),
        revoked_at=None,
        user_agent="pytest-agent",
    )
    event = SimpleNamespace(
        event="social_session_created",
        provider="x",
        created_at=now,
        metadata_json={"session_id": str(session.id)},
    )

    fake_db = FakeDB(
        query_results={
            SocialAccount: FakeQuery(all_result=[account]),
            SocialSession: FakeQuery(all_result=[session]),
            IntegrationAuditLog: FakeQuery(all_result=[event]),
        }
    )
    client = create_client(
        router=auth.router,
        prefix="/auth",
        fake_db=fake_db,
        current_user=fake_user_context,
    )

    response = client.get("/auth/social/dashboard")

    assert response.status_code == 200
    payload = response.json()
    assert payload["accounts"][0]["provider"] == "x"
    assert payload["accounts"][0]["provider_email"] is None
    assert payload["accounts"][0]["has_real_email"] is False
    assert payload["sessions"][0]["is_current"] is False
    assert payload["events"][0]["event"] == "social_session_created"


def test_revoke_session_by_id_marks_revoked(fake_user_context):
    now = datetime.now(timezone.utc)
    account = SimpleNamespace(provider="facebook")
    session_id = uuid4()
    session = SimpleNamespace(
        id=session_id,
        user_id=fake_user_context.user.id,
        social_account=account,
        revoked_at=None,
    )

    fake_db = FakeDB(query_results={SocialSession: FakeQuery(first_result=session)})
    client = create_client(
        router=auth.router,
        prefix="/auth",
        fake_db=fake_db,
        current_user=fake_user_context,
    )

    response = client.post(f"/auth/social/sessions/{session_id}/revoke")

    assert response.status_code == 204
    assert session.revoked_at is not None
    assert fake_db.commit_called is True


def test_unlink_provider_rejects_when_only_provider_left(fake_user_context):
    account = SimpleNamespace(provider="facebook")
    fake_db = FakeDB(query_results={SocialAccount: FakeQuery(all_result=[account])})
    client = create_client(
        router=auth.router,
        prefix="/auth",
        fake_db=fake_db,
        current_user=fake_user_context,
    )

    response = client.post("/auth/social/providers/facebook/unlink")

    assert response.status_code == 409
    assert response.json()["detail"] == "Cannot unlink the only login provider."
