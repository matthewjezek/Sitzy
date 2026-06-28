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
