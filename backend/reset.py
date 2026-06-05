import sqlite3
import os
import sys

sys.path.append('.')
from app.services.ocr_service import process_document_task

conn = sqlite3.connect('data_orchestrator.db')
conn.execute('DELETE FROM extracted_data')
conn.execute('UPDATE documents SET status="Uploaded"')
conn.commit()

# Re-run for the first document
process_document_task(1, 'uploads/2023-12-14T14_21_50.1381539Z.pdf')
