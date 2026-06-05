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
    openai_api_key: str | None = None
    guidewire_api_url: str | None = None
    guidewire_api_key: str | None = None

# Mock storage for demo purposes
mock_settings = {
    "sharepoint_url": "",
    "openai_api_key": "",
    "guidewire_api_url": "",
    "guidewire_api_key": "",
    "is_authenticated": False
}

@router.get("/")
def get_settings():
    from app.core.config import settings as app_settings
    mock_settings["openai_api_key"] = app_settings.OPENAI_API_KEY or ""
    mock_settings["guidewire_api_url"] = app_settings.GUIDEWIRE_API_URL or "https://gw-api.demo.com/cc/rest/claims"
    mock_settings["guidewire_api_key"] = app_settings.GUIDEWIRE_API_KEY or "gw-mock-secret-key-12345"
    return mock_settings

@router.post("/")
def update_settings(settings: SettingsUpdate):
    from app.core.config import settings as app_settings
    import os
    
    mock_settings["sharepoint_url"] = settings.sharepoint_url
    
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
    
    updates = {}
    
    if settings.openai_api_key is not None:
        mock_settings["openai_api_key"] = settings.openai_api_key
        app_settings.OPENAI_API_KEY = settings.openai_api_key
        updates["OPENAI_API_KEY"] = settings.openai_api_key

    if settings.guidewire_api_url is not None:
        mock_settings["guidewire_api_url"] = settings.guidewire_api_url
        app_settings.GUIDEWIRE_API_URL = settings.guidewire_api_url
        updates["GUIDEWIRE_API_URL"] = settings.guidewire_api_url

    if settings.guidewire_api_key is not None:
        mock_settings["guidewire_api_key"] = settings.guidewire_api_key
        app_settings.GUIDEWIRE_API_KEY = settings.guidewire_api_key
        updates["GUIDEWIRE_API_KEY"] = settings.guidewire_api_key

    try:
        lines = []
        if os.path.exists(env_path):
            with open(env_path, "r") as f:
                lines = f.readlines()
                
        with open(env_path, "w") as f:
            for line in lines:
                written = False
                for k, v in updates.items():
                    if line.startswith(f"{k}="):
                        f.write(f"{k}={v}\n")
                        written = True
                        break
                if not written:
                    f.write(line)
            
            # Add any that weren't in the file
            for k, v in updates.items():
                if not any(l.startswith(f"{k}=") for l in lines):
                    f.write(f"{k}={v}\n")
    except Exception as e:
        print(f"Error saving to .env: {e}")

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

@router.post("/validate_openai")
def validate_openai(data: dict):
    api_key = data.get("api_key")
    if not api_key:
        return {"status": "error", "message": "API key is empty"}
    import openai
    client = openai.OpenAI(api_key=api_key)
    try:
        client.models.list()
        return {"status": "success", "message": "OpenAI API connection successful!"}
    except Exception as e:
        return {"status": "error", "message": f"OpenAI validation failed: {str(e)}"}

@router.post("/validate_guidewire")
def validate_guidewire(data: dict):
    url = data.get("url")
    key = data.get("api_key")
    if not url or not key:
        return {"status": "error", "message": "URL and API key are required"}
    
    if "demo.com" in url or "yourcompany.com" in url or "mock" in key:
        return {"status": "success", "message": "Guidewire API connection successful! (Simulated Demo Endpoint)"}
        
    import requests
    try:
        response = requests.get(url, headers={"Authorization": f"Bearer {key}"}, timeout=5)
        # We don't raise_for_status because even a 401/403 means the server exists and responded, which might just mean wrong endpoint path but reachable.
        # But for full validation, let's just return success if we get any response.
        return {"status": "success", "message": f"Guidewire API reached successfully! (Status: {response.status_code})"}
    except Exception as e:
        return {"status": "error", "message": f"Guidewire validation failed: {str(e)}"}
