import time
from app.worker.celery_app import celery_app
from app.db.database import SessionLocal
from app.models.domain import Document, ExtractedData, ProcessingLog, StatusHistory
from app.services.ocr import OCRService

ocr_service = OCRService()

def add_log(db, document_id, description, status):
    log = ProcessingLog(document_id=document_id, description=description, status=status)
    db.add(log)
    
def update_status(db, document_id, new_status, description):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        return
    old_status = doc.status
    doc.status = new_status
    
    # Add Status History
    sh = StatusHistory(document_id=document_id, previous_status=old_status, new_status=new_status)
    db.add(sh)
    
    # Add Processing Log
    add_log(db, document_id, description, new_status)
    db.commit()

@celery_app.task(name="process_document")
def process_document(document_id: int):
    db = SessionLocal()
    try:
        # Step 2: OCR/AI extraction starts
        update_status(db, document_id, "DATA_EXTRACTION_STARTED", "Data extraction initiated.")
        
        # Step 3: OCR/AI extracts data from PDF
        doc = db.query(Document).filter(Document.id == document_id).first()
        result = ocr_service.extract_data_from_pdf(doc.file_path)
        
        doc.confidence_score = result["confidence"]
        doc.accuracy_score = result["accuracy"]
        db.commit()
        
        update_status(db, document_id, "DATA_EXTRACTED", "Data extracted successfully.")
        
        # Step 4: Save extracted data into Dataverse
        ext_data = ExtractedData(document_id=document_id, **result["data"])
        db.add(ext_data)
        db.commit()
        
        update_status(db, document_id, "DATA_SAVED", "Extracted data saved into Dataverse.")
        
        # Trigger validation delay
        validate_document.apply_async(args=[document_id], countdown=5)
    except Exception as e:
        update_status(db, document_id, "FAILED", f"Processing failed: {str(e)}")
    finally:
        db.close()

@celery_app.task(name="validate_document")
def validate_document(document_id: int):
    db = SessionLocal()
    try:
        # Step 5: After 5 seconds automatically update status
        update_status(db, document_id, "VALIDATED", "Validation completed.")
        
        # Trigger completed delay
        complete_document.apply_async(args=[document_id], countdown=5)
    finally:
        db.close()

@celery_app.task(name="complete_document")
def complete_document(document_id: int):
    db = SessionLocal()
    try:
        # Step 6: After another 5 seconds automatically update status
        update_status(db, document_id, "COMPLETED", "Document processing completed.")
    finally:
        db.close()
