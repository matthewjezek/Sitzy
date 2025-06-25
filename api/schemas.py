from datetime import datetime
from typing import TYPE_CHECKING, Annotated
from uuid import UUID

from pydantic import BaseModel, EmailStr, StringConstraints

from .enums import CarLayout

if TYPE_CHECKING:
    from .models import Car


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: Annotated[str, StringConstraints(min_length=8)]


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(UserBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class CarBase(BaseModel):
    name: str
    layout: CarLayout
    date: datetime


class CarCreate(CarBase):
    pass


class CarOut(CarBase):
    id: UUID
    owner_id: UUID
    created_at: datetime
    layout_label: str  # nový jazykově závislý atribut

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
