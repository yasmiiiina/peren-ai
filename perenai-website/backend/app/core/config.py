from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "PEREN AI Monitor"
    app_env: str = Field(default="development", alias="APP_ENV")
    secret_key: str = Field(alias="SECRET_KEY")
    access_token_expire_minutes: int = Field(default=60 * 24, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")

    database_url: str = Field(alias="DATABASE_URL")

    google_client_id: str = Field(default="", alias="GOOGLE_CLIENT_ID")
    google_client_secret: str = Field(default="", alias="GOOGLE_CLIENT_SECRET")
    google_callback_url: str = Field(
        default="http://localhost:5173/auth/google/callback",
        alias="GOOGLE_CALLBACK_URL",
    )
    client_id: str = Field(default="", alias="CLIENT_ID")
    client_secret: str = Field(default="", alias="CLIENT_SECRET")

    email_user: str = Field(default="", alias="EMAIL_USER")
    email_pass: str = Field(default="", alias="EMAIL_PASS")

    frontend_origin: str = Field(default="http://localhost:5173", alias="FRONTEND_ORIGIN")
    frontend_google_callback_path: str = Field(default="/auth/callback", alias="FRONTEND_GOOGLE_CALLBACK_PATH")
    payzone_merchant_id: str = Field(default="", alias="PAYZONE_MERCHANT_ID")
    payzone_secret_key: str = Field(default="", alias="PAYZONE_SECRET_KEY")
    payzone_base_url: str = Field(default="https://secure.payzone.ma/payment", alias="PAYZONE_BASE_URL")
    payzone_api_url: str = Field(default="https://api.payzone.ma", alias="PAYZONE_API_URL")
    payzone_callback_url: str = Field(
        default="http://localhost:8000/api/payments/callback",
        alias="PAYZONE_CALLBACK_URL",
    )
    payzone_return_success_url: str = Field(default="http://localhost:5173/payment/success", alias="PAYZONE_RETURN_SUCCESS_URL")
    payzone_return_failure_url: str = Field(default="http://localhost:5173/payment/failure", alias="PAYZONE_RETURN_FAILURE_URL")

    paypal_client_id: str = Field(default="", alias="PAYPAL_CLIENT_ID")
    paypal_client_secret: str = Field(default="", alias="PAYPAL_CLIENT_SECRET")
    paypal_mode: str = Field(default="sandbox", alias="PAYPAL_MODE")

    payment_webhook_secret: str = Field(default="", alias="PAYMENT_WEBHOOK_SECRET")

    openai_api_key: str = Field(default="", alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4o-mini", alias="OPENAI_MODEL")

    _PLACEHOLDER_MARKERS = (
        "ton_vrai",
        "your_",
        "change_me",
        "placeholder",
        "example.com",
        "votre_",
    )

    @classmethod
    def _sanitize_credential(cls, value: str) -> str:
        cleaned = (value or "").strip().strip('"').strip("'")
        if not cleaned:
            return ""
        lowered = cleaned.lower()
        if any(marker in lowered for marker in cls._PLACEHOLDER_MARKERS):
            return ""
        return cleaned

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"

    @property
    def resolved_google_client_id(self) -> str:
        return self._sanitize_credential(self.google_client_id or self.client_id)

    @property
    def resolved_google_client_secret(self) -> str:
        return self._sanitize_credential(self.google_client_secret or self.client_secret)

    @property
    def has_google_oauth(self) -> bool:
        return bool(self.resolved_google_client_id and self.resolved_google_client_secret)

    @property
    def resolved_openai_api_key(self) -> str:
        return self._sanitize_credential(self.openai_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
