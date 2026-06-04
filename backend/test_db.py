import os
import sys

from app.db.database import SessionLocal
from app.models.domain import Document, ProcessingLog

db = SessionLocal()
doc = db.query(Document).order_by(Document.id.desc()).first()
print(f"Document ID: {doc.id}")
print("--- Raw Text Extracted ---")
print(doc.extracted_text if hasattr(doc, 'extracted_text') else "N/A")
