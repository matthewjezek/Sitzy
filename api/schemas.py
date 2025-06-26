from datetime import datetime
from typing import TYPE_CHECKING, Annotated, cast
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, StringConstraints

from api.translations.localization_utils import get_position_label

from .utils.base_models import BaseModelWithLabels
from .utils.enums import CarLayout, InvitationStatus

if TYPE_CHECKING:
    from .models import Car, Invitation, Seat


# === Uživatelská schémata ===
class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: Annotated[str, StringConstraints(min_length=8)]


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModelWithLabels["UserOut"], UserBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# === Auta ===
class CarBase(BaseModel):
    name: str
    layout: CarLayout
    date: datetime


class CarCreate(CarBase):
    pass


class CarOut(BaseModelWithLabels["CarOut"], CarBase):
    id: UUID
    owner_id: UUID
    created_at: datetime
    layout_label: str

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_with_labels(cls, car: object, lang: str = "cs") -> "CarOut":
        car = cast("Car", car)
        return cls(
            id=car.id,
            owner_id=car.owner_id,
            created_at=car.created_at,
            name=car.name,
            layout=car.layout,
            date=car.date,
            layout_label=car.layout.get_label(lang),
        )


# === Pozvánky ===
class InvitationBase(BaseModel):
    invited_email: EmailStr


class InvitationCreate(InvitationBase):
    car_id: UUID


class InvitationOut(BaseModelWithLabels["InvitationOut"], InvitationBase):
    id: UUID
    car_id: UUID
    token: str
    status: InvitationStatus
    status_label: str
    created_at: datetime
    expires_at: datetime | None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_with_labels(cls, inv: object, lang: str = "cs") -> "InvitationOut":
        inv = cast("Invitation", inv)
        return cls(
            id=inv.id,
            car_id=inv.car_id,
            invited_email=inv.invited_email,
            token=inv.token,
            status=inv.status,
            status_label=inv.status.get_label(lang),
            created_at=inv.created_at,
            expires_at=inv.expires_at,
        )


class SeatBase(BaseModel):
    position: int


# === Sedadla ===
class SeatOut(BaseModelWithLabels["SeatOut"]):
    car_id: UUID
    user_id: UUID | None
    position: int
    position_label: str
    user_name: str | None = None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_with_labels(cls, seat: object, lang: str = "cs") -> "SeatOut":
        seat = cast("Seat", seat)
        return cls(
            car_id=seat.car_id,
            user_id=seat.user_id,
            position=seat.position,
            position_label=get_position_label(seat.position, seat.car.layout, lang),
            user_name=seat.user.email if seat.user else None,
        )


# === Kompletní informace o autě ===
class CarFullOut(CarOut):
    invitations: list[InvitationOut]
    seats: list[SeatOut]

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_with_labels(cls, car: object, lang: str = "cs") -> "CarFullOut":
        car = cast("Car", car)
        return cls(
            id=car.id,
            owner_id=car.owner_id,
            created_at=car.created_at,
            name=car.name,
            layout=car.layout,
            layout_label=car.layout.get_label(lang),
            date=car.date,
            invitations=[
                InvitationOut.from_orm_with_labels(inv, lang) for inv in car.invitations
            ],
            seats=[SeatOut.from_orm_with_labels(seat, lang) for seat in car.seats],
        )


class DashboardOut(BaseModel):
    owned_car: CarOut | None
    passenger_cars: list[CarOut]
    pending_invitations: list[InvitationOut]
