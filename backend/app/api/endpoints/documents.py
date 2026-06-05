import os
import shutil
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.domain import Document, ExtractedData, ProcessingLog, AuditHistory, StatusHistory
from app.schemas.domain import DocumentResponse, ExtractedDataUpdate, ExtractedDataResponse
from app.worker.tasks import process_document_pipeline

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/", response_model=List[DocumentResponse])
def read_documents(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    docs = db.query(Document).order_by(Document.created_at.desc()).offset(skip).limit(limit).all()
    return docs

@router.get("/{document_id}", response_model=DocumentResponse)
def read_document(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@router.get("/{document_id}/file")
def get_document_file(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if not doc.file_path or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    return FileResponse(
        doc.file_path, 
        media_type="application/pdf", 
        filename=doc.file_name,
        content_disposition_type="inline"
    )

@router.post("/upload", response_model=DocumentResponse)
def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    # Generate unique filename to prevent collisions
    original_name = file.filename or "unnamed.pdf"
    ext = os.path.splitext(original_name)[1] or ".pdf"
    stored_name = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, stored_name)
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Create Document record
    doc = Document(
        file_name=original_name,
        file_path=file_path,
        status="File Uploaded",
        confidence_score=None,
        accuracy_score=None
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    # Add initial Processing Log
    log1 = ProcessingLog(document_id=doc.id, description="PDF file uploaded and saved.", status="File Uploaded", created_by="System")
    db.add(log1)
    db.commit()
    
    # Trigger task pipeline via BackgroundTasks
    background_tasks.add_task(process_document_pipeline, doc.id, file_path)
    
    # Refresh to get updated data after processing
    db.refresh(doc)
    return doc

@router.put("/{document_id}/extracted_data", response_model=ExtractedDataResponse)
def update_extracted_data(
    document_id: int, 
    data_in: ExtractedDataUpdate, 
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    extracted = doc.extracted_data
    if not extracted:
        raise HTTPException(status_code=404, detail="Extracted data not found")
        
    update_data = data_in.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        original_value = getattr(extracted, field)
        if original_value != value:
            audit = AuditHistory(
                document_id=document_id,
                field_name=field,
                original_value=str(original_value) if original_value else None,
                updated_value=str(value) if value else None,
                updated_by="admin@demo.com"
            )
            db.add(audit)
            setattr(extracted, field, value)
            
    db.commit()
    db.refresh(extracted)
    return extracted

@router.get("/{document_id}/audit")
def get_document_audit(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    audits = db.query(AuditHistory).filter(AuditHistory.document_id == document_id).all()
    # Return a list of field names that were edited
    edited_fields = list(set([a.field_name for a in audits]))
    return {"edited_fields": edited_fields}

@router.delete("/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete the physical file
    if doc.file_path and os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except OSError:
            pass
    
    db.delete(doc)
    db.commit()
    return {"detail": "Document deleted successfully"}
