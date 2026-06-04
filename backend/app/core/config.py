import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Data Orchestrator"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-change-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # Database
    # Using SQLite for local dev abstraction initially
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./data_orchestrator.db")
    
    # Dataverse (to be configured later)
    DATAVERSE_URL: str = os.getenv("DATAVERSE_URL", "")
    DATAVERSE_CLIENT_ID: str = os.getenv("DATAVERSE_CLIENT_ID", "")
    DATAVERSE_CLIENT_SECRET: str = os.getenv("DATAVERSE_CLIENT_SECRET", "")
    DATAVERSE_TENANT_ID: str = os.getenv("DATAVERSE_TENANT_ID", "")
    
    # Celery / Redis
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
