import os
import shutil
import uuid
import glob
from datetime import datetime
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.database import get_db
from app.models.domain import Document
from app.worker.tasks import process_document_pipeline

router = APIRouter()

class SettingsUpdate(BaseModel):
    sharepoint_url: str

# Mock storage for demo purposes
mock_settings = {
    "sharepoint_url": "",
    "is_authenticated": False
}

@router.get("/")
def get_settings():
    return mock_settings

@router.post("/")
def update_settings(settings: SettingsUpdate):
    mock_settings["sharepoint_url"] = settings.sharepoint_url
    return mock_settings

@router.post("/auth")
def authenticate_microsoft():
    # Simulate an OAuth login success
    mock_settings["is_authenticated"] = True
    return {"status": "success", "message": "Successfully authenticated with Microsoft"}

@router.post("/simulate_sharepoint_upload")
def simulate_sharepoint_upload(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if not mock_settings["is_authenticated"]:
        return {"status": "error", "message": "Not authenticated with Microsoft"}
    if not mock_settings["sharepoint_url"]:
        return {"status": "error", "message": "SharePoint URL not configured"}
        
    # Find an existing PDF in the uploads folder to use as a template
    upload_dir = "uploads"
    pdf_files = glob.glob(os.path.join(upload_dir, "*.pdf"))
    
    if not pdf_files:
        return {"status": "error", "message": "No sample PDFs available in the uploads folder. Please upload at least one PDF manually first to serve as a mock template for SharePoint."}
        
    sample_pdf = pdf_files[0]
    
    # Create a new unique filename
    new_filename = f"sharepoint_sync_{uuid.uuid4().hex[:8]}.pdf"
    new_filepath = os.path.join(upload_dir, new_filename)
    
    # Copy the file
    shutil.copy2(sample_pdf, new_filepath)
    
    # Create DB record
    new_doc = Document(
        file_name=new_filename,
        file_path=new_filepath,
        status="FILE UPLOADED",
        created_at=datetime.utcnow()
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    
    # Trigger background pipeline
    background_tasks.add_task(process_document_pipeline, new_doc.id, new_filepath)
    
    return {"status": "success", "message": f"Successfully pulled new file from SharePoint: {new_filename} and triggered processing workflow."}
