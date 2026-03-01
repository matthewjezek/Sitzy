from datetime import datetime
from typing import TYPE_CHECKING, cast
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr

from .utils.base_models import BaseModelWithLabels
from .utils.enums import CarLayout, InvitationStatus

if TYPE_CHECKING:
    from .models import Car, Invitation, Seat


# === User ===
class UserBase(BaseModel):
    """Base user info, used in both input and output schemas."""

    email: EmailStr | None = (
        None  # X ussually doesn't provide email, but if it does, we want to store it
    )


class UserOut(BaseModelWithLabels["UserOut"], UserBase):
    """User info returned in API responses."""

    id: UUID
    full_name: str | None = None
    avatar_url: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# === Car Driver ===
class CarDriverOut(BaseModel):
    """Info about a driver of a car, used in CarFullOut."""

    id: UUID
    car_id: UUID
    driver_id: UUID
    is_active: bool
    assigned_at: datetime
    revoked_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


# === Ride ===
class RideCreate(BaseModel):
    """Data needed to create a new ride."""

    car_id: UUID
    departure_time: datetime
    destination: str


class RideUpdate(BaseModel):
    """Data needed to update an existing ride."""

    departure_time: datetime
    destination: str


class RideOut(BaseModel):
    """Info about a ride, used in API responses."""

    id: UUID
    car_id: UUID
    car_driver_id: UUID
    departure_time: datetime
    destination: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# === Car ===
class CarBase(BaseModel):
    """Base car info, used in both input and output schemas."""

    name: str
    layout: CarLayout


class CarCreate(CarBase):
    """Data needed to create a new car."""

    pass


class CarOut(BaseModelWithLabels["CarOut"], CarBase):
    """Info about a car, used in API responses."""

    id: UUID
    owner_id: UUID
    owner_name: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_with_labels(cls, car: object) -> "CarOut":
        car = cast("Car", car)
        return cls(
            id=car.id,
            owner_id=car.owner_id,
            owner_name=(
                car.owner.full_name if car.owner else None
            ),  # ✅ full_name místo email
            created_at=car.created_at,
            updated_at=car.updated_at,
            name=car.name,
            layout=car.layout,
        )


# === Seat ===
class SeatOut(BaseModelWithLabels["SeatOut"]):
    """Info about a seat in a car, used in CarFullOut."""

    car_id: UUID
    position: int

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_with_labels(cls, seat: object) -> "SeatOut":
        seat = cast("Seat", seat)
        return cls(
            car_id=seat.car_id,
            position=seat.position,
        )


# === Car Complete Info ===
class CarFullOut(CarOut):
    """Complete info about a car, including its seats and drivers,
    used in API responses."""

    seats: list[SeatOut]
    drivers: list[CarDriverOut] = []
    rides: list[RideOut] = []

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_with_labels(cls, car: object) -> "CarFullOut":
        car = cast("Car", car)
        return cls(
            id=car.id,
            owner_id=car.owner_id,
            owner_name=car.owner.full_name if car.owner else None,
            created_at=car.created_at,
            updated_at=car.updated_at,
            name=car.name,
            layout=car.layout,
            seats=[SeatOut.from_orm_with_labels(seat) for seat in car.seats],
            drivers=[CarDriverOut.model_validate(d) for d in car.drivers],
            rides=[RideOut.model_validate(r) for r in car.rides],
        )


# === Invitation ===
class InvitationCreate(BaseModel):
    """Data needed to create a new invitation."""

    invited_email: EmailStr


class InvitationOut(BaseModelWithLabels["InvitationOut"]):
    """Info about an invitation, used in API responses."""

    id: UUID
    ride_id: UUID
    invited_email: EmailStr
    token: str
    status: InvitationStatus
    created_at: datetime
    expires_at: datetime
    ride: RideOut | None = None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_with_labels(cls, inv: object) -> "InvitationOut":
        inv = cast("Invitation", inv)
        return cls(
            id=inv.id,
            ride_id=inv.ride_id,
            invited_email=inv.invited_email,
            token=inv.token,
            status=inv.status,
            created_at=inv.created_at,
            expires_at=inv.expires_at,
            ride=RideOut.model_validate(inv.ride) if inv.ride else None,
        )


# === Passenger ===
class PassengerSeatIn(BaseModel):
    """Data needed to assign a passenger to a specific seat in a car."""

    seat_position: int


# === Dashboard ===
class DashboardOut(BaseModel):
    """Info about user's dashboard, including owned car, passenger cars
    and pending invitations."""

    owned_car: CarOut | None
    passenger_cars: list[CarOut]
    pending_invitations: list[InvitationOut]
