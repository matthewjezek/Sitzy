from datetime import datetime
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, EmailStr, StringConstraints

from .enums import CarLayout


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

    class Config:
        from_attributes = True
