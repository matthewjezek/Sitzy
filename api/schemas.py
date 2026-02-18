from datetime import datetime
from typing import TYPE_CHECKING, cast
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr

from .utils.base_models import BaseModelWithLabels
from .utils.enums import CarLayout, InvitationStatus

if TYPE_CHECKING:
    from .models import Car, Invitation, Seat


# === Uživatelská schémata ===
class UserBase(BaseModel):
    email: EmailStr


class UserOut(BaseModelWithLabels["UserOut"], UserBase):
    id: UUID
    full_name: str | None = None
    avatar_url: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# === Auta ===
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
            owner_name=car.owner.email if car.owner else None,
            created_at=car.created_at,
            updated_at=car.updated_at,
            name=car.name,
            layout=car.layout,
        )


# === Pozvánky ===
class InvitationBase(BaseModel):
    invited_email: EmailStr
    car_id: UUID
    created_at: datetime


class InvitationCreate(InvitationBase):
    status: InvitationStatus = InvitationStatus.PENDING


class InvitationOut(BaseModelWithLabels["InvitationOut"], InvitationBase):
    id: UUID
    car_id: UUID
    invited_email: EmailStr
    token: str
    status: InvitationStatus
    created_at: datetime
    expires_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_with_labels(cls, inv: object) -> "InvitationOut":
        inv = cast("Invitation", inv)
        return cls(
            id=inv.id,
            car_id=inv.car_id,
            invited_email=inv.invited_email,
            token=inv.token,
            status=inv.status,
            created_at=inv.created_at,
            expires_at=inv.expires_at,
        )


class SeatBase(BaseModel):
    position: int


# === Sedadla ===
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


# === Kompletní informace o autě ===
class CarFullOut(CarOut):
    invitations: list[InvitationOut]
    seats: list[SeatOut]

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_with_labels(cls, car: object) -> "CarFullOut":
        car = cast("Car", car)
        return cls(
            id=car.id,
            owner_id=car.owner_id,
            owner_name=car.owner.email if car.owner else None,
            created_at=car.created_at,
            updated_at=car.updated_at,
            name=car.name,
            layout=car.layout,
            invitations=[
                InvitationOut.from_orm_with_labels(inv) for inv in car.invitations
            ],
            seats=[SeatOut.from_orm_with_labels(seat) for seat in car.seats],
        )


class DashboardOut(BaseModel):
    owned_car: CarOut | None
    passenger_cars: list[CarOut]
    pending_invitations: list[InvitationOut]
