# test_cars_create_car.py

from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from api.routers.cars import create_car

# Markers for test categories
pytestmark = pytest.mark.usefixtures("mock_dependencies")


@pytest.fixture
def mock_request():
    """Fixture to mock FastAPI Request with language state."""
    mock = MagicMock()
    mock.state.lang = "en"
    return mock


@pytest.fixture
def mock_db():
    """Fixture to mock SQLAlchemy Session."""
    db = MagicMock()
    db.add = MagicMock()
    db.commit = MagicMock()
    db.refresh = MagicMock()
    return db


@pytest.fixture
def mock_car_create():
    """Fixture to mock CarCreate object."""
    mock = MagicMock()
    # model_dump returns a dict of car fields
    mock.model_dump.return_value = {"make": "Toyota", "model": "Corolla", "year": 2020}
    return mock


@pytest.fixture
def mock_user_no_car():
    """Fixture to mock a User with no car."""
    mock = MagicMock()
    mock.id = 123
    mock.car = None
    return mock


@pytest.fixture
def mock_user_with_car():
    """Fixture to mock a User who already has a car."""
    mock = MagicMock()
    mock.id = 456
    mock.car = MagicMock()  # Simulate existing car
    return mock


@pytest.fixture
def mock_new_car():
    """Fixture to mock a new Car instance."""
    mock = MagicMock()
    mock.id = 789
    mock.make = "Toyota"
    mock.model = "Corolla"
    mock.year = 2020
    mock.owner_id = 123
    return mock


@pytest.fixture(autouse=True)
def mock_dependencies(monkeypatch, mock_new_car):
    """Auto-used fixture to patch external dependencies."""
    # Patch CarOut.from_orm_with_labels
    carout_mock = MagicMock(return_value="carout_obj")
    monkeypatch.setattr("api.routers.cars.CarOut.from_orm_with_labels", carout_mock)
    # Patch models.Car to return mock_new_car
    monkeypatch.setattr("api.routers.cars.models.Car", lambda **kwargs: mock_new_car)
    return carout_mock


class TestCreateCar:
    # === Happy Path Tests ===

    @pytest.mark.happy
    def test_create_car_success(
        self, mock_request, mock_car_create, mock_db, mock_user_no_car, mock_new_car
    ):
        """
        Test that a new car is created successfully when the user does not already own a car.
        """
        result = create_car(
            request=mock_request,
            car_in=mock_car_create,
            db=mock_db,
            current_user=mock_user_no_car,
        )
        # CarOut.from_orm_with_labels should be called with the new car and correct lang
        from api.routers.cars import CarOut

        CarOut.from_orm_with_labels.assert_called_once_with(mock_new_car, lang="en")
        # DB methods should be called
        mock_db.add.assert_called_once_with(mock_new_car)
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once_with(mock_new_car)
        assert result == "carout_obj"

    @pytest.mark.happy
    def test_create_car_with_different_language(
        self, mock_request, mock_car_create, mock_db, mock_user_no_car, mock_new_car
    ):
        """
        Test car creation with a different language in request.state.lang.
        """
        mock_request.state.lang = "de"
        result = create_car(
            request=mock_request,
            car_in=mock_car_create,
            db=mock_db,
            current_user=mock_user_no_car,
        )
        from api.routers.cars import CarOut

        CarOut.from_orm_with_labels.assert_called_once_with(mock_new_car, lang="de")
        assert result == "carout_obj"

    # === Edge Case & Error Tests ===

    @pytest.mark.edge
    def test_create_car_user_already_has_car(
        self, mock_request, mock_car_create, mock_db, mock_user_with_car
    ):
        """
        Test that an HTTPException is raised if the user already owns a car.
        """
        with pytest.raises(HTTPException) as excinfo:
            create_car(
                request=mock_request,
                car_in=mock_car_create,
                db=mock_db,
                current_user=mock_user_with_car,
            )
        assert excinfo.value.status_code == 400
        # The detail should be the result of get_message with correct key/lang
        assert excinfo.value.detail == "msg:user_has_car:en"

    @pytest.mark.edge
    def test_create_car_model_dump_returns_empty(
        self, mock_request, mock_db, mock_user_no_car, mock_new_car
    ):
        """
        Test car creation when car_in.model_dump returns an empty dict (edge case).
        """
        mock_car_create = MagicMock()
        mock_car_create.model_dump.return_value = {}
        result = create_car(
            request=mock_request,
            car_in=mock_car_create,
            db=mock_db,
            current_user=mock_user_no_car,
        )
        from api.routers.cars import CarOut

        CarOut.from_orm_with_labels.assert_called_once_with(mock_new_car, lang="en")
        assert result == "carout_obj"

    @pytest.mark.edge
    def test_create_car_db_commit_raises(
        self, mock_request, mock_car_create, mock_db, mock_user_no_car
    ):
        """
        Test that an exception in db.commit propagates (simulates DB failure).
        """
        mock_db.commit.side_effect = Exception("DB error")
        with pytest.raises(Exception) as excinfo:
            create_car(
                request=mock_request,
                car_in=mock_car_create,
                db=mock_db,
                current_user=mock_user_no_car,
            )
        assert "DB error" in str(excinfo.value)

    @pytest.mark.edge
    def test_create_car_from_orm_with_labels_raises(
        self, mock_request, mock_car_create, mock_db, mock_user_no_car, monkeypatch
    ):
        """
        Test that an exception in CarOut.from_orm_with_labels propagates.
        """

        def raise_exc(*args, **kwargs):
            raise ValueError("label error")

        monkeypatch.setattr("api.routers.cars.CarOut.from_orm_with_labels", raise_exc)
        with pytest.raises(ValueError) as excinfo:
            create_car(
                request=mock_request,
                car_in=mock_car_create,
                db=mock_db,
                current_user=mock_user_no_car,
            )
        assert "label error" in str(excinfo.value)
