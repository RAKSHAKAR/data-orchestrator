import os
import sys

# Add backend directory to sys path so we can import from app
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.db.session import SessionLocal
from app.db.models import Document, ProcessingLog

db = SessionLocal()
doc = db.query(Document).order_by(Document.id.desc()).first()
print(f"Document ID: {doc.id}")
print(f"Status: {doc.status}")
print(f"Extracted Data: {doc.extracted_data}")
print("--- Logs ---")
for log in doc.processing_logs:
    print(f"{log.created_at} - {log.status} - {log.description}")
