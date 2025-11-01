"""
Application configuration
"""
import os
from typing import Optional


class Settings:
    """Application settings"""
    
    # Database
    DATABASE_HOST: str = os.getenv("DATABASE_HOST", "127.0.0.1")
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"postgresql://challenge:challenge_2024@{DATABASE_HOST}:5432/challenge_db"
    )
    
    # Connection Pool Settings
    DB_POOL_MIN_SIZE: int = int(os.getenv("DB_POOL_MIN_SIZE", "5"))
    DB_POOL_MAX_SIZE: int = int(os.getenv("DB_POOL_MAX_SIZE", "20"))
    DB_POOL_MAX_QUERIES: int = int(os.getenv("DB_POOL_MAX_QUERIES", "50000"))
    DB_POOL_MAX_INACTIVE_LIFETIME: int = int(os.getenv("DB_POOL_MAX_INACTIVE_LIFETIME", "300"))
    DB_COMMAND_TIMEOUT: int = int(os.getenv("DB_COMMAND_TIMEOUT", "60"))
    
    # Cache
    CACHE_ENABLED: bool = os.getenv("CACHE_ENABLED", "true").lower() == "true"
    CACHE_TTL: int = int(os.getenv("CACHE_TTL", "300"))  # 5 minutes
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT: str = os.getenv("LOG_FORMAT", "json")
    
    # API
    API_TITLE: str = "Restaurant Analytics API"
    API_VERSION: str = "1.0.0"
    API_DESCRIPTION: str = "Analytics customizável para restaurantes"
    
    # CORS
    CORS_ORIGINS: list = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:3001"
    ).split(",")


settings = Settings()

