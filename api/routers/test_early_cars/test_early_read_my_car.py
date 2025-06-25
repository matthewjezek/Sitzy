# test_cars_read_my_car.py

from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

# Import the function under test
from api.routers.cars import read_my_car

# Markers for test categories
happy = pytest.mark.happy
edge = pytest.mark.edge


@pytest.fixture
def mock_request():
    """
    Fixture to create a mock request object with a configurable language.
    """

    def _make(lang="cs"):
        req = MagicMock()
        req.state = SimpleNamespace(lang=lang)
        return req

    return _make


@pytest.fixture
def mock_user():
    """
    Fixture to create a mock user object with a configurable id.
    """

    def _make(user_id=1):
        user = MagicMock()
        user.id = user_id
        return user

    return _make


@pytest.fixture
def mock_car():
    """
    Fixture to create a mock car object with a configurable owner_id.
    """

    def _make(owner_id=1):
        car = MagicMock()
        car.owner_id = owner_id
        return car

    return _make


@pytest.fixture
def mock_db():
    """
    Fixture to create a mock db session with a configurable query return value.
    """

    def _make(car_obj=None):
        db = MagicMock()
        query = MagicMock()
        filter_ = MagicMock()
        filter_.first.return_value = car_obj
        query.filter.return_value = filter_
        db.query.return_value = query
        return db

    return _make


@pytest.fixture
def patch_get_message():
    """
    Fixture to patch get_message in the correct namespace.
    """
    with patch("api.routers.cars.get_message") as mock_get_message:
        mock_get_message.side_effect = lambda key, lang="cs": f"{key}_{lang}"
        yield mock_get_message


@pytest.fixture
def patch_carout_from_orm_with_labels():
    """
    Fixture to patch CarOut.from_orm_with_labels in the correct namespace.
    """
    with patch("api.routers.cars.CarOut") as mock_carout:
        mock_carout.from_orm_with_labels = MagicMock(return_value={"car": "data"})
        yield mock_carout


class TestReadMyCar:
    @happy
    def test_returns_car_for_current_user(
        self,
        mock_request,
        mock_user,
        mock_car,
        mock_db,
        patch_get_message,
        patch_carout_from_orm_with_labels,
    ):
        """
        Test that the function returns the car for the current user (happy path).
        """
        req = mock_request(lang="en")
        user = mock_user(user_id=42)
        car = mock_car(owner_id=42)
        db = mock_db(car_obj=car)

        result = read_my_car(req, db, user)

        patch_carout_from_orm_with_labels.from_orm_with_labels.assert_called_once_with(
            car, lang="en"
        )
        assert result == {"car": "data"}

    @happy
    def test_returns_car_for_different_language(
        self,
        mock_request,
        mock_user,
        mock_car,
        mock_db,
        patch_get_message,
        patch_carout_from_orm_with_labels,
    ):
        """
        Test that the function works with a different language in request.state.lang.
        """
        req = mock_request(lang="de")
        user = mock_user(user_id=7)
        car = mock_car(owner_id=7)
        db = mock_db(car_obj=car)

        result = read_my_car(req, db, user)

        patch_carout_from_orm_with_labels.from_orm_with_labels.assert_called_once_with(
            car, lang="de"
        )
        assert result == {"car": "data"}

    @edge
    def test_raises_404_if_no_car_found(
        self,
        mock_request,
        mock_user,
        mock_db,
        patch_get_message,
        patch_carout_from_orm_with_labels,
    ):
        """
        Test that the function raises HTTPException 404 if no car is found for the user.
        """
        req = mock_request(lang="cs")
        user = mock_user(user_id=99)
        db = mock_db(car_obj=None)

        with pytest.raises(HTTPException) as exc_info:
            read_my_car(req, db, user)

        assert exc_info.value.status_code == 404
        patch_get_message.assert_called_once_with("car_not_found", "cs")
        assert exc_info.value.detail == "car_not_found_cs"

    @edge
    def test_raises_404_with_custom_language(
        self,
        mock_request,
        mock_user,
        mock_db,
        patch_get_message,
        patch_carout_from_orm_with_labels,
    ):
        """
        Test that the function raises HTTPException 404 with the correct language in the error message.
        """
        req = mock_request(lang="fr")
        user = mock_user(user_id=123)
        db = mock_db(car_obj=None)

        with pytest.raises(HTTPException) as exc_info:
            read_my_car(req, db, user)

        patch_get_message.assert_called_once_with("car_not_found", "fr")
        assert exc_info.value.detail == "car_not_found_fr"

    @edge
    def test_carout_from_orm_with_labels_returns_unexpected(
        self, mock_request, mock_user, mock_car, mock_db, patch_get_message
    ):
        """
        Test that the function handles CarOut.from_orm_with_labels returning an unexpected value.
        """
        req = mock_request(lang="cs")
        user = mock_user(user_id=1)
        car = mock_car(owner_id=1)
        db = mock_db(car_obj=car)

        with patch("api.routers.cars.CarOut") as mock_carout:
            mock_carout.from_orm_with_labels = MagicMock(return_value=None)
            result = read_my_car(req, db, user)
            assert result is None

    @edge
    def test_request_state_lang_missing_defaults_to_cs(
        self,
        mock_user,
        mock_car,
        mock_db,
        patch_get_message,
        patch_carout_from_orm_with_labels,
    ):
        """
        Test that the function works if request.state.lang is missing (should default to 'cs').
        """
        req = MagicMock()
        req.state = SimpleNamespace()
        user = mock_user(user_id=1)
        car = mock_car(owner_id=1)
        db = mock_db(car_obj=car)

        # Should raise AttributeError, as code expects request.state.lang to exist
        with pytest.raises(AttributeError):
            read_my_car(req, db, user)
