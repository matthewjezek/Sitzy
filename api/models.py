import uuid

from sqlalchemy import Column, DateTime
from sqlalchemy import Enum as SqlEnum
from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base
from .enums import CarLayout, InvitationStatus


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    car = relationship(
        "Car", back_populates="owner", uselist=False, cascade="all, delete"
    )


class Car(Base):
    __tablename__ = "cars"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    owner_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False
    )
    name = Column(String, nullable=False)
    layout: CarLayout = Column(SqlEnum(CarLayout, name="car_layouts"), nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    owner = relationship("User", back_populates="car")
    invitations = relationship(
        "Invitation", back_populates="car", cascade="all, delete"
    )


class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    car_id = Column(
        UUID(as_uuid=True), ForeignKey("cars.id"), nullable=False, index=True
    )
    invited_email = Column(String, index=True, nullable=False)
    token = Column(String, unique=True, nullable=False)
    status: InvitationStatus = Column(
        SqlEnum(InvitationStatus, name="invitation_statuses"),
        nullable=False,
        default=InvitationStatus.PENDING,
    )
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    expires_at = Column(DateTime(timezone=True), nullable=True)

    car = relationship("Car", back_populates="invitations")
