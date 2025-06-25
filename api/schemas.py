from datetime import datetime
from typing import TYPE_CHECKING, Annotated
from uuid import UUID

from pydantic import BaseModel, EmailStr, StringConstraints

from .enums import CarLayout, InvitationStatus
from .utils.base_models import BaseModelWithLabels

if TYPE_CHECKING:
    from .models import Car, Invitation


# === Uživatelská schémata ===
class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: Annotated[str, StringConstraints(min_length=8)]


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModelWithLabels, UserBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# === Auta ===
class CarBase(BaseModel):
    name: str
    layout: CarLayout
    date: datetime


class CarCreate(CarBase):
    pass


class CarOut(BaseModelWithLabels, CarBase):
    id: UUID
    owner_id: UUID
    created_at: datetime
    layout_label: str

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_with_labels(cls, car: "Car", lang: str = "cs") -> "CarOut":
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


class InvitationOut(BaseModelWithLabels, InvitationBase):
    id: UUID
    car_id: UUID
    token: str
    status: InvitationStatus
    status_label: str
    created_at: datetime
    expires_at: datetime | None

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_with_labels(
        cls, inv: "Invitation", lang: str = "cs"
    ) -> "InvitationOut":
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
