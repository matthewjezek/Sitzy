from typing import Literal

from pydantic import AnyUrl, Field, ValidationInfo, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    environment: Literal["development", "production"] = Field(
        "development", validation_alias="ENVIRONMENT"
    )

    # OAuth2
    facebook_client_id: str = Field(
        ..., validation_alias="FACEBOOK_CLIENT_ID", min_length=1
    )
    facebook_client_secret: str = Field(
        ..., validation_alias="FACEBOOK_CLIENT_SECRET", min_length=1
    )
    facebook_redirect_uri: AnyUrl = Field(..., validation_alias="FACEBOOK_REDIRECT_URI")

    x_client_id: str = Field(..., validation_alias="X_CLIENT_ID", min_length=1)
    x_client_secret: str = Field(..., validation_alias="X_CLIENT_SECRET", min_length=1)
    x_redirect_uri: AnyUrl = Field(..., validation_alias="X_REDIRECT_URI")

    # Redis
    redis_url: str = Field("redis://localhost:6379/0", validation_alias="REDIS_URL")

    # JWT
    secret_key: str = Field(..., validation_alias="SECRET_KEY", min_length=32)
    refresh_secret_key: str = Field(
        ..., validation_alias="REFRESH_SECRET_KEY", min_length=32
    )
    algorithm: str = Field("HS256", validation_alias="ALGORITHM")
    access_token_expire_minutes: int = Field(
        15, validation_alias="ACCESS_TOKEN_EXPIRE_MINUTES"
    )
    refresh_token_expire_days: int = Field(
        7, validation_alias="REFRESH_TOKEN_EXPIRE_DAYS"
    )

    # CORS
    frontend_origin: str = Field(..., validation_alias="FRONTEND_ORIGIN", min_length=1)

    @field_validator("x_redirect_uri", "facebook_redirect_uri")
    @classmethod
    def https_in_production(cls, v: AnyUrl, info: ValidationInfo) -> AnyUrl:
        env = info.data.get("environment", "development")
        if env == "production" and not str(v).startswith("https://"):
            raise ValueError("Redirect URI must start with https:// in production environment.")
        return v

    @field_validator("secret_key", "refresh_secret_key")
    @classmethod
    def keys_must_differ(cls, v: str, info: ValidationInfo) -> str:
        other = info.data.get("secret_key")
        if info.field_name == "refresh_secret_key" and other and v == other:
            raise ValueError("SECRET_KEY and REFRESH_SECRET_KEY must be different.")
        return v

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)


settings = Settings()  # type: ignore[call-arg]
