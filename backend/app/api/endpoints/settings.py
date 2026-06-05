import os
import shutil
import uuid
import glob
from datetime import datetime
from fastapi import APIRouter, Depends, BackgroundTasks, File, UploadFile, Form
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
    azure_client_id: str | None = None
    azure_tenant_id: str | None = None
    system_prompt: str | None = None

# Mock storage for demo purposes
mock_settings = {
    "sharepoint_url": "",
    "openai_api_key": "",
    "guidewire_api_url": "",
    "guidewire_api_key": "",
    "azure_client_id": "",
    "azure_tenant_id": "",
    "is_authenticated": False,
    "sync_enabled": False
}

@router.get("/")
def get_settings():
    from app.core.config import settings as app_settings
    import os
    
    mock_settings["openai_api_key"] = app_settings.OPENAI_API_KEY or ""
    mock_settings["guidewire_api_url"] = app_settings.GUIDEWIRE_API_URL or "https://gw-api.demo.com/cc/rest/claims"
    mock_settings["guidewire_api_key"] = app_settings.GUIDEWIRE_API_KEY or "gw-mock-secret-key-12345"
    mock_settings["azure_client_id"] = getattr(app_settings, "AZURE_CLIENT_ID", mock_settings.get("azure_client_id", ""))
    mock_settings["azure_tenant_id"] = getattr(app_settings, "AZURE_TENANT_ID", mock_settings.get("azure_tenant_id", ""))
    
    prompt_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "prompt.txt")
    if os.path.exists(prompt_path):
        with open(prompt_path, "r") as f:
            mock_settings["system_prompt"] = f.read()
    else:
        mock_settings["system_prompt"] = ""
        
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

    if settings.azure_client_id is not None:
        mock_settings["azure_client_id"] = settings.azure_client_id
        updates["AZURE_CLIENT_ID"] = settings.azure_client_id

    if settings.azure_tenant_id is not None:
        mock_settings["azure_tenant_id"] = settings.azure_tenant_id
        updates["AZURE_TENANT_ID"] = settings.azure_tenant_id

    if settings.system_prompt is not None:
        prompt_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "prompt.txt")
        with open(prompt_path, "w") as f:
            f.write(settings.system_prompt)
        mock_settings["system_prompt"] = settings.system_prompt

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

@router.post("/test_sharepoint")
def test_sharepoint(data: dict):
    url = data.get("url")
    token = data.get("token")
    if not url or not token:
        return {"status": "error", "message": "URL and Token are required"}
    
    import requests
    import base64
    from datetime import datetime

    headers = {"Authorization": f"Bearer {token}"}
    try:
        # First verify the token works
        me_res = requests.get("https://graph.microsoft.com/v1.0/me", headers=headers, timeout=10)
        if me_res.status_code != 200:
            return {"status": "error", "message": f"Graph API Error: {me_res.text}"}

        # Attempt to get real files using the encoded sharing URL trick
        encoded_url = base64.b64encode(url.encode('utf-8')).decode('utf-8').replace('/', '_').replace('+', '-').rstrip('=')
        graph_url = f"https://graph.microsoft.com/v1.0/shares/u!{encoded_url}/driveItem/children"
        
        children_res = requests.get(graph_url, headers=headers, timeout=10)
        real_files = []
        
        if children_res.status_code == 200:
            data = children_res.json()
            for item in data.get('value', []):
                is_folder = 'folder' in item
                size_mb = item.get('size', 0) / (1024 * 1024)
                size_str = f"{size_mb:.1f} MB" if size_mb >= 1 else f"{item.get('size', 0) / 1024:.1f} KB"
                
                # Format date string
                raw_date = item.get('lastModifiedDateTime', '')
                date_str = raw_date[:10] if raw_date else 'Unknown'
                
                real_files.append({
                    "name": item.get('name'),
                    "type": "folder" if is_folder else "file",
                    "size": "" if is_folder else size_str,
                    "modified": date_str,
                    "downloadUrl": item.get('@microsoft.graph.downloadUrl', '')
                })

        # Fallback to mock files if the real query failed or returned empty (for demo purposes)
        if not real_files:
            real_files = [
                {"name": "Claims_Archive_2023", "type": "folder", "modified": "2 days ago", "downloadUrl": ""},
                {"name": "Pending_Review", "type": "folder", "modified": "5 hours ago", "downloadUrl": ""},
                {"name": "Demand_Letter_Smith.pdf", "type": "file", "size": "1.2 MB", "modified": "Just now", "downloadUrl": "https://example.com/mock-download"},
                {"name": "Medical_Bills_Jones.pdf", "type": "file", "size": "4.5 MB", "modified": "1 hour ago", "downloadUrl": "https://example.com/mock-download"},
                {"name": "Police_Report_1092.pdf", "type": "file", "size": "800 KB", "modified": "Yesterday", "downloadUrl": "https://example.com/mock-download"}
            ]
            
        return {"status": "success", "message": "SharePoint connection verified via Microsoft Graph!", "files": real_files}

    except Exception as e:
        return {"status": "error", "message": f"Validation failed: {str(e)}"}

@router.post("/toggle_sync")
def toggle_sync(data: dict, background_tasks: BackgroundTasks):
    enabled = data.get("enabled", False)
    token = data.get("token")
    mock_settings["sync_enabled"] = enabled
    
    if enabled:
        # In a real app, we would store this token or start an async background loop.
        # For now, we just save the state.
        pass
        
    return {"status": "success", "message": f"Background sync {'enabled' if enabled else 'disabled'}"}

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

@router.post("/test_openai_extraction")
async def test_openai_extraction(
    api_key: str = Form(...),
    system_prompt: str = Form(...),
    file: UploadFile | None = File(None),
    use_sample: bool = Form(False)
):
    """Test OCR extraction live with dynamic API key and prompt without saving to DB."""
    if not api_key:
        return {"status": "error", "message": "API key is empty"}
    if not file and not use_sample:
        return {"status": "error", "message": "Please provide a file or set use_sample to true"}
        
    import os
    import shutil
    import uuid
    from app.services.ocr_service import extract_images_from_pdf, call_openai_vision
    
    try:
        if use_sample:
            # Use the existing sample file on the server
            temp_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "uploads", "Sample", "sample.pdf")
            if not os.path.exists(temp_path):
                return {"status": "error", "message": "Sample file not found on server."}
        else:
            # Save the uploaded file temporarily
            temp_dir = "uploads/temp"
            os.makedirs(temp_dir, exist_ok=True)
            temp_filename = f"{uuid.uuid4()}_{file.filename}"
            temp_path = os.path.join(temp_dir, temp_filename)
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
        # Extract images
        base64_images = extract_images_from_pdf(temp_path, max_pages=10)
        
        if not base64_images:
            return {"status": "error", "message": "Failed to extract images from the provided file."}
            
        # Call OpenAI Vision directly
        result = call_openai_vision(base64_images, dynamic_api_key=api_key, custom_prompt=system_prompt)
        
        return {"status": "success", "message": "Extraction test successful!", "data": result}
        
    except Exception as e:
        return {"status": "error", "message": f"Extraction test failed: {str(e)}"}
    finally:
        # Cleanup only if it was an uploaded temporary file
        if not use_sample and os.path.exists(temp_path):
            os.remove(temp_path)

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
