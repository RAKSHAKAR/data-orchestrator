from fastapi import APIRouter
from app.api.endpoints import auth, documents, settings

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
