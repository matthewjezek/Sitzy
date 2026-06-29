from datetime import datetime, timezone
from uuid import uuid4

from fastapi.testclient import TestClient

from api.models import Car, Ride
from api.routers import rides
from api.utils.enums import CarLayout

from .conftest import FakeDB, FakeQuery, create_client


def test_og_image_endpoint_not_found():
    fake_db = FakeDB({Ride: FakeQuery(first_result=None)})
    client = create_client(router=rides.router, prefix="/api/rides", fake_db=fake_db)
    response = client.get(f"/api/rides/og/{uuid4()}")
    assert response.status_code == 404


def test_og_image_endpoint_success():
    # Setup mock data structure
    ride_id = uuid4()
    mock_car = Car(name="Škoda Superb", layout=CarLayout.SEDAQ)
    mock_ride = Ride(
        id=ride_id,
        destination="Brno",
        departure_time=datetime.now(timezone.utc),
        car=mock_car,
        passengers=[],
    )

    # Mock database to return our fake ride
    fake_db = FakeDB({Ride: FakeQuery(first_result=mock_ride)})
    client = create_client(router=rides.router, prefix="/api/rides", fake_db=fake_db)

    response = client.get(f"/api/rides/og/{ride_id}")
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"


def test_format_czech_datetime():
    from api.utils.og import format_czech_datetime

    # Test summer time (CEST - UTC+2)
    dt_summer = datetime(2026, 6, 30, 6, 0, tzinfo=timezone.utc)
    formatted_summer = format_czech_datetime(dt_summer)
    assert "Úterý 30. 6. v 8:00" in formatted_summer

    # Test winter time (CET - UTC+1)
    dt_winter = datetime(2026, 12, 24, 16, 30, tzinfo=timezone.utc)
    formatted_winter = format_czech_datetime(dt_winter)
    assert "Čtvrtek 24. 12. v 17:30" in formatted_winter
