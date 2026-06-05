import os
import shutil
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, Response
from fastapi.responses import FileResponse, StreamingResponse
import csv
import io
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

@router.get("/sample/download")
def download_sample_pdf():
    sample_path = os.path.join(UPLOAD_DIR, "Sample", "sample.pdf")
    if not os.path.exists(sample_path):
        raise HTTPException(status_code=404, detail="Sample PDF not found")
    return FileResponse(
        sample_path, 
        media_type="application/pdf", 
        filename="sample.pdf",
        content_disposition_type="attachment"
    )

import pandas as pd
from io import BytesIO

@router.post("/export/excel")
def export_documents_excel(data: dict, db: Session = Depends(get_db)):
    document_ids = data.get("document_ids", [])
    if document_ids:
        docs = db.query(Document).filter(Document.id.in_(document_ids)).all()
    else:
        docs = db.query(Document).all()
    
    # Convert standard headers to Title Case
    headers = ["ID", "File Name", "Status", "Confidence", "Accuracy", "Created At"]
    
    field_mapping = {
        "document_date": "Document Date",
        "processing_date": "Processing Date",
        "received_date": "Received Date",
        
        "claim_number": "Claim Number",
        "claimant_name": "Claimant Name",
        "claimant_number": "Claimant Number",
        "policy_number": "Policy Number",
        "date_of_loss": "Date of Loss",
        
        "firm_name": "Firm Name",
        "firm_address": "Firm Address",
        "firm_vendor_id": "Firm Vendor ID",
        
        "provider": "Provider",
        "provider_vendor_id": "Provider Vendor ID",
        
        "amount_billed": "Amount Billed",
        "eighty_percent_amount_billed": "80% Amount Billed",
        "amount_owed": "Amount Owed",
        "amount_paid": "Amount Paid",
        
        "date_of_service_from": "Service Date From",
        "date_of_service_to": "Service Date To",
        
        "envelope_type": "Envelope Type",
        "certified_mail": "Certified Mail",
        "certification_number": "Certification Number",
        "documents_in_envelope": "Documents in Envelope",
        "total_postage_cost": "Total Postage Cost",
        "postage_cost_per_document": "Postage Cost Per Doc",
        "assignment_of_benefit": "Assignment of Benefit"
    }
    
    db_fields = list(field_mapping.keys())
    excel_headers = list(field_mapping.values())
    
    rows = []
    for doc in docs:
        # Convert datetime to string to avoid timezone issues in excel
        created_at_str = doc.created_at.strftime("%Y-%m-%d %H:%M:%S") if doc.created_at else ""
        row = [
            doc.id, doc.file_name, doc.status, doc.confidence_score, doc.accuracy_score, created_at_str
        ]
        if doc.extracted_data:
            for field in db_fields:
                row.append(getattr(doc.extracted_data, field, ""))
        else:
            row.extend([""] * len(db_fields))
            
        rows.append(row)

    df = pd.DataFrame(rows, columns=headers + excel_headers)
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Documents')
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]), 
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
        headers={"Content-Disposition": "attachment; filename=documents_export.xlsx"}
    )

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

@router.post("/{document_id}/validate")
def validate_document(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc or not doc.extracted_data:
        raise HTTPException(status_code=404, detail="Document or extracted data not found")
        
    extracted = doc.extracted_data
    
    # Mock Guidewire Response
    # We will purposely create a mismatch for Amount Billed if it's not a round number, 
    # or just force a mismatch on a couple fields to demonstrate the UI.
    mock_guidewire_data = {
        "claim_number": extracted.claim_number or "N/A",
        "claimant_name": extracted.claimant_name or "N/A",
        "amount_billed": "999.99", # Force mismatch
        "provider": extracted.provider or "N/A",
    }
    
    mismatches = []
    
    if extracted.amount_billed != mock_guidewire_data["amount_billed"]:
        mismatches.append({
            "field": "amount_billed",
            "extracted": extracted.amount_billed,
            "guidewire": mock_guidewire_data["amount_billed"]
        })
        
    if extracted.provider and mock_guidewire_data["provider"] and extracted.provider.lower() != mock_guidewire_data["provider"].lower():
        mismatches.append({
            "field": "provider",
            "extracted": extracted.provider,
            "guidewire": mock_guidewire_data["provider"]
        })
        
    status = "VALIDATED" if len(mismatches) == 0 else "PENDING_VALIDATION"
    doc.status = status
    
    log = ProcessingLog(document_id=doc.id, description=f"Validation triggered. Status set to {status}.", status=status, created_by="System")
    db.add(log)
    db.commit()
    db.refresh(doc)
    
    return {
        "status": status,
        "mismatches": mismatches,
        "mock_guidewire_data": mock_guidewire_data
    }

@router.post("/{document_id}/send_guidewire")
def send_to_guidewire(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if doc.status not in ["VALIDATED", "PENDING_VALIDATION", "COMPLETED"]:
        raise HTTPException(status_code=400, detail="Document not ready to be sent")
        
    doc.status = "COMPLETED"
    from app.core.config import settings as app_settings
    gw_url = app_settings.GUIDEWIRE_API_URL or "default mock endpoint"
    log = ProcessingLog(document_id=doc.id, description=f"Document sent to Guidewire via API at {gw_url}.", status="COMPLETED", created_by="Admin User")
    db.add(log)
    db.commit()
    return {"status": "success"}

from pydantic import BaseModel
class BulkSendRequest(BaseModel):
    document_ids: List[int]

@router.post("/bulk_send_guidewire")
def bulk_send_guidewire(request: BulkSendRequest, db: Session = Depends(get_db)):
    docs = db.query(Document).filter(Document.id.in_(request.document_ids)).all()
    count = 0
    for doc in docs:
        if doc.status in ["VALIDATED", "PENDING_VALIDATION"]:
            doc.status = "COMPLETED"
            log = ProcessingLog(document_id=doc.id, description="Document sent to Guidewire via Bulk API.", status="COMPLETED", created_by="Admin User")
            db.add(log)
            count += 1
    db.commit()
    return {"status": "success", "sent_count": count}
