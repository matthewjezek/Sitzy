import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime
from sqlalchemy import Enum as SqlEnum
from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from .utils.enums import CarLayout, InvitationStatus


# Deklarativní základna pro modely
class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    full_name: Mapped[str | None] = mapped_column(String, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default="now()"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default="now()", onupdate=datetime.now(timezone.utc)
    )

    cars: Mapped[list["Car"]] = relationship(
        back_populates="owner", cascade="all, delete"
    )
    social_accounts: Mapped[list["SocialAccount"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    car_drivers: Mapped[list["CarDriver"]] = relationship(
        back_populates="driver", cascade="all, delete-orphan"
    )
    passenger_entries: Mapped[list["Passenger"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class SocialAccount(Base):
    __tablename__ = "social_accounts"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    provider: Mapped[str] = mapped_column(String, nullable=False)  # "facebook" | "x"
    social_id: Mapped[str] = mapped_column(String, nullable=False)  # Permanent UID from provider
    email: Mapped[str] = mapped_column(String, nullable=False)
    linked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default="now()"
    )

    user: Mapped["User"] = relationship(back_populates="social_accounts")
    sessions: Mapped[list["SocialSession"]] = relationship(
        back_populates="social_account", cascade="all, delete-orphan"
    )


class SocialSession(Base):
    __tablename__ = "social_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    social_account_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("social_accounts.id"), nullable=False, index=True
    )
    access_token: Mapped[str] = mapped_column(String, nullable=False)
    refresh_token: Mapped[str | None] = mapped_column(String, nullable=True)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    user_agent: Mapped[str | None] = mapped_column(String, nullable=True)

    social_account: Mapped["SocialAccount"] = relationship(back_populates="sessions")


class Car(Base):
    __tablename__ = "cars"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    layout: Mapped[CarLayout] = mapped_column(
        SqlEnum(CarLayout, name="car_layouts"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default="now()"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default="now()", onupdate=datetime.now(timezone.utc)
    )

    owner: Mapped["User"] = relationship(back_populates="cars")
    invitations: Mapped[list["Invitation"]] = relationship(
        back_populates="car", cascade="all, delete"
    )
    drivers: Mapped[list["CarDriver"]] = relationship(
        back_populates="car", cascade="all, delete-orphan"
    )
    rides: Mapped[list["Ride"]] = relationship(
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


class CarDriver(Base):
    __tablename__ = "car_drivers"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    car_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("cars.id"), nullable=False, index=True
    )
    driver_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default="now()"
    )
    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, server_default="now()"
    )

    car: Mapped["Car"] = relationship(back_populates="drivers")
    driver: Mapped["User"] = relationship(back_populates="car_drivers")
    rides: Mapped[list["Ride"]] = relationship(
        back_populates="car_driver", cascade="all, delete-orphan"
    )


class Ride(Base):
    __tablename__ = "rides"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    car_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("cars.id"), nullable=False, index=True
    )
    car_driver_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("car_drivers.id"), nullable=False, index=True
    )
    departure_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    destination: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default="now()"
    )

    car: Mapped["Car"] = relationship(back_populates="rides")
    car_driver: Mapped["CarDriver"] = relationship(back_populates="rides")
    passengers: Mapped[list["Passenger"]] = relationship(
        back_populates="ride", cascade="all, delete-orphan"
    )


class Passenger(Base):
    __tablename__ = "passengers"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    ride_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("rides.id"), nullable=False, index=True
    )
    seat_position: Mapped[int] = mapped_column(nullable=False)

    user: Mapped["User"] = relationship(back_populates="passenger_entries")
    ride: Mapped["Ride"] = relationship(back_populates="passengers")


class Seat(Base):
    __tablename__ = "seats"

    car_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("cars.id"), primary_key=True
    )
    position: Mapped[int] = mapped_column(primary_key=True)

    car: Mapped["Car"] = relationship(back_populates="seats")
