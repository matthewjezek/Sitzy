from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pytest

from api.models import Invitation
from api.scripts.clean_expired_invitations import clean_expired_invitations
from api.utils.enums import InvitationStatus


class FakeQuery:
    def __init__(self, results):
        self.results = results

    def filter(self, *args, **kwargs):
        return self

    def all(self):
        return self.results

    def update(self, values, synchronize_session=False):
        count = 0
        new_status = values.get(Invitation.status)
        for obj in self.results:
            obj.status = new_status
            count += 1
        return count


class FakeSession:
    def __init__(self, query_results):
        self.query_results = query_results
        self.committed = False
        self.rolled_back = False
        self.closed = False

    def query(self, model):
        return FakeQuery(self.query_results.get(model, []))

    def commit(self):
        self.committed = True

    def rollback(self):
        self.rolled_back = True

    def close(self):
        self.closed = True


def test_clean_expired_invitations_no_expired(monkeypatch):
    session = FakeSession({Invitation: []})
    monkeypatch.setattr(
        "api.scripts.clean_expired_invitations.SessionLocal", lambda: session
    )

    clean_expired_invitations()

    assert not session.committed
    assert session.closed


def test_clean_expired_invitations_with_expired(monkeypatch):
    expired_inv1 = Invitation(
        id=uuid4(),
        status=InvitationStatus.PENDING,
        expires_at=datetime.now(timezone.utc) - timedelta(hours=1),
        token="token1",
    )
    expired_inv2 = Invitation(
        id=uuid4(),
        status=InvitationStatus.PENDING,
        expires_at=datetime.now(timezone.utc) - timedelta(minutes=5),
        token="token2",
    )

    session = FakeSession({Invitation: [expired_inv1, expired_inv2]})
    monkeypatch.setattr(
        "api.scripts.clean_expired_invitations.SessionLocal", lambda: session
    )

    clean_expired_invitations()

    assert expired_inv1.status == InvitationStatus.EXPIRED
    assert expired_inv2.status == InvitationStatus.EXPIRED
    assert session.committed
    assert session.closed


def test_clean_expired_invitations_rollback_on_error(monkeypatch):
    class ExplodingSession(FakeSession):
        def commit(self):
            raise Exception("DB Error")

    expired_inv = Invitation(
        id=uuid4(),
        status=InvitationStatus.PENDING,
        expires_at=datetime.now(timezone.utc) - timedelta(hours=1),
        token="token1",
    )
    session = ExplodingSession({Invitation: [expired_inv]})
    monkeypatch.setattr(
        "api.scripts.clean_expired_invitations.SessionLocal", lambda: session
    )

    with pytest.raises(Exception, match="DB Error"):
        clean_expired_invitations()

    assert session.rolled_back
    assert session.closed
