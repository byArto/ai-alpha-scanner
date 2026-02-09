from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    # App
    app_name: str = "AI Alpha Scanner"
    app_env: str = "development"
    log_level: str = "DEBUG"

    # Database
    database_url: str = "sqlite+aiosqlite:///./data/alpha_scanner.db"

    # GitHub
    github_token: Optional[str] = None
    github_collect_interval_hours: int = 6

    # Testnet platforms
    testnet_collect_interval_hours: int = 12

    # Rate limiting
    requests_per_minute: int = 30

    # CORS
    cors_origins: str = "http://localhost:3000"

    # Admin Authentication
    admin_api_key: Optional[str] = None

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
