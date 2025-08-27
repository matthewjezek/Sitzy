import uuid
from datetime import datetime

from sqlalchemy import DateTime
from sqlalchemy import Enum as SqlEnum
from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base
from .utils.enums import CarLayout, InvitationStatus


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default="now()"
    )

    car: Mapped["Car"] = relationship(
        back_populates="owner", uselist=False, cascade="all, delete"
    )
    passenger_entries: Mapped[list["Passenger"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    seat: Mapped["Seat | None"] = relationship(back_populates="user", uselist=False)


class Car(Base):
    __tablename__ = "cars"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    layout: Mapped[CarLayout] = mapped_column(
        SqlEnum(CarLayout, name="car_layouts"), nullable=False
    )
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default="now()"
    )

    owner: Mapped["User"] = relationship(back_populates="car")
    invitations: Mapped[list["Invitation"]] = relationship(
        back_populates="car", cascade="all, delete"
    )
    passengers: Mapped[list["Passenger"]] = relationship(
        back_populates="car", cascade="all, delete-orphan"
    )
    seats: Mapped[list["Seat"]] = relationship(
        back_populates="car", cascade="all, delete"
    )


class Invitation(Base):
    __tablename__ = "invitations"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    car_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("cars.id"), nullable=False, index=True
    )
    invited_email: Mapped[str] = mapped_column(String, nullable=False, index=True)
    token: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    status: Mapped[InvitationStatus] = mapped_column(
        SqlEnum(InvitationStatus, name="invitation_statuses"),
        default=InvitationStatus.PENDING,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default="now()"
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )

    car: Mapped["Car"] = relationship(back_populates="invitations")


class Passenger(Base):
    __tablename__ = "passengers"

    user_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True
    )
    car_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("cars.id"), primary_key=True
    )

    user: Mapped["User"] = relationship(back_populates="passenger_entries")
    car: Mapped["Car"] = relationship(back_populates="passengers")


class Seat(Base):
    __tablename__ = "seats"

    car_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("cars.id"), primary_key=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True
    )
    position: Mapped[int] = mapped_column(nullable=False)

    car: Mapped["Car"] = relationship(back_populates="seats")
    user: Mapped["User"] = relationship(back_populates="seat")
