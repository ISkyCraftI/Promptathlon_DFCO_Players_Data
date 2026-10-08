#
# Imports
#

from enum import Enum
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Perso

#
# Enums
#

class Env(str, Enum):
    DEVELOPMENT = "development"
    PRODUCTION = "production"


class LogLevel(str, Enum):
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

#
# Config
#

class Settings(BaseSettings):
    """
        Application settings loaded from environment / .env.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    #
    # Base
    #

    APP_NAME: str = Field(
        default="Easyfoot",
        description="The name of the application",
    )
    APP_VERSION: str = Field(
        default="0.1.0",
        description="The version of the application",
    )
    APP_PREFIX: str = Field(
        default="/api",
        description="The prefix of the API routes",
    )
    APP_ENV: Env = Field(
        default=Env.DEVELOPMENT,
        description="The environment of the application",
    )
    APP_LOG_LEVEL: LogLevel = Field(
        default=LogLevel.INFO,
        description="The level of the application logs",
    )
    APP_PORT: int = Field(
        default=5059,
        description="The port the backend listens on",
    )

    #
    # Security / CORS
    #

    CORS_ALLOW_ORIGINS_PROD: list[str] = Field(
        default_factory=lambda: [
            "https://localhost:8089",
            "http://localhost:8089",
        ],
        description="Origins allowed to access the API in production",
    )

    #
    # Database (SQLite)
    #

    DB_PATH: str = Field(
        default="data/app.db",
        description="Relative or absolute path to the SQLite file",
    )


@lru_cache
def get_settings() -> Settings:
    """
        Returns:
            - Cached Settings instance.
    """
    return Settings()
