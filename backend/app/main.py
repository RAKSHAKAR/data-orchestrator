from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import engine, Base, SessionLocal
from app.models import *  # Import all models so Base knows about them
from app.core.security import get_password_hash
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

from app.api.api import api_router

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def on_startup():
    # Auto-create all tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified.")
    
    # Seed default admin user if none exists
    db = SessionLocal()
    try:
        from app.models.user import User
        existing = db.query(User).first()
        if not existing:
            admin = User(
                email="admin@demo.com",
                hashed_password=get_password_hash("admin123"),
                full_name="Admin User",
                is_active=True,
                is_superuser=True
            )
            db.add(admin)
            db.commit()
            logger.info("Default admin user created: admin@demo.com / admin123")
        else:
            logger.info(f"Users already exist. Skipping seed.")
    except Exception as e:
        logger.error(f"Error seeding user: {e}")
        db.rollback()
    finally:
        db.close()

@app.get("/health")
def health_check():
    return {"status": "ok", "project": settings.PROJECT_NAME}
