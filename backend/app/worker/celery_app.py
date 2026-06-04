from celery import Celery
from app.core.config import settings
import os

celery_app = Celery(
    "worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

# Run tasks synchronously for local development without Redis
celery_app.conf.task_always_eager = True
celery_app.conf.task_eager_propagates = True

celery_app.conf.task_routes = {"app.worker.tasks.*": "main-queue"}

