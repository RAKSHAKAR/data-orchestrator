from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Data Orchestrator"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "super-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # Database
    DATABASE_URL: str = "sqlite:///./data_orchestrator.db"
    
    # Celery
    CELERY_BROKER_URL: str = "sqla+sqlite:///celery_broker.db"
    CELERY_RESULT_BACKEND: str = "db+sqlite:///celery_results.db"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
