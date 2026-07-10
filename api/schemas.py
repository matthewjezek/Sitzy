import re
from datetime import datetime
from typing import TYPE_CHECKING, cast
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from .utils.base_models import BaseModelWithLabels
from .utils.enums import CarLayout, InvitationStatus

if TYPE_CHECKING:
    from .models import Car, Invitation, Seat

EMAIL_RE = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


def get_facebook_proxy_url(user_id: UUID, current_avatar_url: str | None) -> str | None:
    """Helper to rewrite a Facebook avatar URL to point to the local proxy endpoint."""
    if current_avatar_url and (
        "fbsbx.com" in current_avatar_url or "facebook.com" in current_avatar_url
    ):
        from urllib.parse import urlparse

        from api.config import settings

        parsed = urlparse(str(settings.facebook_redirect_uri))
        base_url = f"{parsed.scheme}://{parsed.netloc}"
        return f"{base_url}/auth/users/{user_id}/avatar"
    return current_avatar_url


# === User ===
class UserBase(BaseModel):
    email: str | None = None


class SocialAccountOut(BaseModel):
    provider: str
    social_id: str
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

    @model_validator(mode="after")
    def rewrite_avatar_url(self) -> "UserOut":
        self.avatar_url = get_facebook_proxy_url(self.id, self.avatar_url)
        return self

    @field_validator("email", mode="before")
    @classmethod
    def mask_fake_email(cls, v: object) -> object:
        """Hides internal fake emails used for social accounts
        (ending with .invalid) from API output."""
        if isinstance(v, str) and v.endswith(".invalid"):
            return None
        return v


class UserBasicOut(BaseModel):
    id: UUID
    full_name: str | None = None
    avatar_url: str | None = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def rewrite_avatar_url(self) -> "UserBasicOut":
        self.avatar_url = get_facebook_proxy_url(self.id, self.avatar_url)
        return self


class SocialSessionOut(BaseModel):
    id: UUID
    provider: str
    created_at: datetime
    expires_at: datetime
    revoked_at: datetime | None = None
    user_agent: str | None = None
    is_current: bool = False


class SocialAccountDashboardOut(BaseModel):
    provider: str
    social_id: str
    linked_at: datetime
    provider_email: str | None = None
    has_real_email: bool
    active_sessions: int
    last_login_at: datetime | None = None


class IntegrationAuditEventOut(BaseModel):
    event: str
    provider: str | None = None
    created_at: datetime
    metadata: dict[str, object] = Field(default_factory=dict)


class SocialDashboardOut(BaseModel):
    accounts: list[SocialAccountDashboardOut]
    sessions: list[SocialSessionOut]
    events: list[IntegrationAuditEventOut]


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

    @model_validator(mode="after")
    def rewrite_avatar_url(self) -> "PassengerOut":
        self.avatar_url = get_facebook_proxy_url(self.user_id, self.avatar_url)
        return self

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
    driver_user_id: UUID
    departure_time: datetime
    destination: str
    created_at: datetime
    passengers: list[PassengerOut] = []
    car: CarOut | None = None
    driver: UserBasicOut | None = None
    public_invite_token: str | None = None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_ride(cls, ride: object) -> "RideOut":
        from .models import Ride

        r = cast("Ride", ride)

        public_invite_token = None
        if hasattr(r, "invitations"):
            for inv in r.invitations:
                if (
                    inv.invited_email == "public@sitzy.local"
                    and inv.status == InvitationStatus.PENDING
                ):
                    public_invite_token = inv.token
                    break

        return cls(
            id=r.id,
            car_id=r.car_id,
            car_driver_id=r.car_driver_id,
            driver_user_id=r.car_driver.driver_id,
            departure_time=r.departure_time,
            destination=r.destination,
            created_at=r.created_at,
            passengers=[PassengerOut.from_passenger(p) for p in r.passengers],
            car=CarOut.from_orm_with_labels(r.car) if r.car else None,
            driver=(
                UserBasicOut.model_validate(getattr(r.car_driver, "driver", None))
                if getattr(r, "car_driver", None)
                and getattr(r.car_driver, "driver", None)
                else None
            ),
            public_invite_token=public_invite_token,
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
            rides=[RideOut.from_ride(r) for r in car.rides],
        )


# === Invitation ===
class InvitationCreate(BaseModel):
    invited_email: str

    @field_validator("invited_email")
    @classmethod
    def validate_invited_email(cls, v: str) -> str:
        v_clean = v.strip()
        if not EMAIL_RE.match(v_clean):
            raise ValueError("Invalid email format")
        return v_clean


class InvitationOut(BaseModelWithLabels["InvitationOut"]):
    id: UUID
    ride_id: UUID
    invited_email: str
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


class InvitationResolveOut(BaseModel):
    ride_id: UUID
    status: InvitationStatus
    expires_at: datetime
    destination: str | None = None
    departure_time: datetime | None = None
    driver_name: str | None = None
    car_name: str | None = None
