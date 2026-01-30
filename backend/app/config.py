from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # App
    app_name: str = "AI Alpha Scanner"
    app_env: str = "development"
    log_level: str = "DEBUG"

    # Database
    database_url: str = "sqlite+aiosqlite:///../data/alpha_scanner.db"

    # GitHub
    github_token: Optional[str] = None
    github_collect_interval_hours: int = 6

    # Testnet platforms
    testnet_collect_interval_hours: int = 12

    # Rate limiting
    requests_per_minute: int = 30

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
