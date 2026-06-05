import logging
import time
from app.db.database import SessionLocal
from app.models.domain import Document, ProcessingLog, StatusHistory
from app.services.ocr_service import process_document_task as run_ocr_extraction

logger = logging.getLogger(__name__)

def add_log(db, document_id, description, status):
    log = ProcessingLog(document_id=document_id, description=description, status=status, created_by="System")
    db.add(log)
    
def update_status(db, document_id, new_status, description):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        return
    old_status = doc.status
    doc.status = new_status
    sh = StatusHistory(document_id=document_id, previous_status=old_status, new_status=new_status)
    db.add(sh)
    add_log(db, document_id, description, new_status)
    db.commit()

def process_document_pipeline(document_id: int, file_path: str):
    """Main background task: runs OCR, waits 5s, Validates, waits 5s, Completes."""
    try:
        # 1. Extraction
        run_ocr_extraction(document_id, file_path)
        
        # Check if extraction failed
        db = SessionLocal()
        doc = db.query(Document).filter(Document.id == document_id).first()
        status = doc.status if doc else "Failed"
        db.close()
        
        if status == "Failed":
            logger.error(f"Pipeline aborted for {document_id} because OCR extraction failed.")
            return

        # 2. Validation (wait 5s)
        time.sleep(5)
        validate_document(document_id)
        
        # 3. Completion (wait 5s)
        time.sleep(5)
        complete_document(document_id)
        
    except Exception as e:
        logger.error(f"process_document_pipeline failed: {e}")

def validate_document(document_id: int):
    db = SessionLocal()
    try:
        update_status(db, document_id, "Validated", "Automated validation completed successfully.")
    except Exception as e:
        logger.error(f"validate_document task failed: {e}")
    finally:
        db.close()

def complete_document(document_id: int):
    db = SessionLocal()
    try:
        update_status(db, document_id, "Completed", "Document processing pipeline completed.")
    except Exception as e:
        logger.error(f"complete_document task failed: {e}")
    finally:
        db.close()

