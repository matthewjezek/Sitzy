from datetime import datetime
from typing import TYPE_CHECKING, cast
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator

from .utils.base_models import BaseModelWithLabels
from .utils.enums import CarLayout, InvitationStatus

if TYPE_CHECKING:
    from .models import Car, Invitation, Seat


# === User ===
class UserBase(BaseModel):
    email: str | None = None


class SocialAccountOut(BaseModel):
    provider: str
    email: str | None = None
    linked_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserOut(BaseModelWithLabels["UserOut"], UserBase):
    id: UUID
    full_name: str | None = None
    avatar_url: str | None = None
    created_at: datetime
    updated_at: datetime
    social_accounts: list[SocialAccountOut] = []

    model_config = ConfigDict(from_attributes=True)

    @field_validator("email", mode="before")
    @classmethod
    def mask_fake_email(cls, v: object) -> object:
        """Hides internal fake emails used for social accounts (ending with .invalid) from API output."""
        if isinstance(v, str) and v.endswith(".invalid"):
            return None
        return v


# === Car Driver ===
class CarDriverOut(BaseModel):
    id: UUID
    car_id: UUID
    driver_id: UUID
    is_active: bool
    assigned_at: datetime
    revoked_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class TransferDriverIn(BaseModel):
    new_driver_id: UUID


# === Car ===
class CarBase(BaseModel):
    name: str
    layout: CarLayout


class CarCreate(CarBase):
    pass


class CarOut(BaseModelWithLabels["CarOut"], CarBase):
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
            owner_name=car.owner.full_name if car.owner else None,
            created_at=car.created_at,
            updated_at=car.updated_at,
            name=car.name,
            layout=car.layout,
        )


# === Seat ===
class SeatOut(BaseModelWithLabels["SeatOut"]):
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


# === Passenger ===
class PassengerSeatIn(BaseModel):
    seat_position: int


class PassengerSeatInOptional(BaseModel):
    seat_position: int | None = None


class PassengerOut(BaseModel):
    user_id: UUID
    seat_position: int
    full_name: str | None = None
    avatar_url: str | None = None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_passenger(cls, passenger: object) -> "PassengerOut":
        from .models import Passenger

        p = cast("Passenger", passenger)
        return cls(
            user_id=p.user_id,
            seat_position=p.seat_position,
            full_name=p.user.full_name if p.user else None,
            avatar_url=p.user.avatar_url if p.user else None,
        )


# === Ride ===
class RideCreate(BaseModel):
    car_id: UUID
    departure_time: datetime
    destination: str


class RideUpdate(BaseModel):
    departure_time: datetime
    destination: str


class RideOut(BaseModel):
    id: UUID
    car_id: UUID
    car_driver_id: UUID
    departure_time: datetime
    destination: str
    created_at: datetime
    passengers: list[PassengerOut] = []
    car: CarOut | None = None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_ride(cls, ride: object) -> "RideOut":
        from .models import Ride

        r = cast("Ride", ride)
        return cls(
            id=r.id,
            car_id=r.car_id,
            car_driver_id=r.car_driver_id,
            departure_time=r.departure_time,
            destination=r.destination,
            created_at=r.created_at,
            passengers=[PassengerOut.from_passenger(p) for p in r.passengers],
            car=CarOut.from_orm_with_labels(r.car) if r.car else None,
        )


# === Car Complete Info ===
class CarFullOut(CarOut):
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
    invited_email: EmailStr


class InvitationOut(BaseModelWithLabels["InvitationOut"]):
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
            ride=RideOut.from_ride(inv.ride) if inv.ride else None,
        )
