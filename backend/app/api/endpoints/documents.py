import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.domain import Document, ExtractedData, ProcessingLog, AuditHistory, StatusHistory
from app.schemas.domain import DocumentListResponse, DocumentResponse, ExtractedDataUpdate, ExtractedDataResponse
from app.services.ocr_service import process_document_task

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

@router.post("/upload", response_model=DocumentResponse)
def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    # Save file
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Create Document record
    doc = Document(
        file_name=file.filename,
        file_path=file_path,
        status="Uploaded",
        confidence_score=None,
        accuracy_score=None
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    # Add initial Processing Log
    log1 = ProcessingLog(document_id=doc.id, description="PDF file uploaded and saved.", status="Uploaded", created_by="System")
    db.add(log1)
    db.commit()
    
    # Trigger Background Task
    background_tasks.add_task(process_document_task, doc.id, file_path, db)
    
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
            # Create audit log
            audit = AuditHistory(
                document_id=document_id,
                field_name=field,
                original_value=str(original_value) if original_value else None,
                updated_value=str(value) if value else None,
                updated_by="admin@foodrush.com"  # Hardcoded for demo, normally from JWT token
            )
            db.add(audit)
            setattr(extracted, field, value)
            
    db.commit()
    db.refresh(extracted)
    return extracted
