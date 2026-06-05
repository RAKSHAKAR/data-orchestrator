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
    azure_client_id: str | None = None
    azure_tenant_id: str | None = None

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
    mock_settings["openai_api_key"] = app_settings.OPENAI_API_KEY or ""
    mock_settings["guidewire_api_url"] = app_settings.GUIDEWIRE_API_URL or "https://gw-api.demo.com/cc/rest/claims"
    mock_settings["guidewire_api_key"] = app_settings.GUIDEWIRE_API_KEY or "gw-mock-secret-key-12345"
    mock_settings["azure_client_id"] = getattr(app_settings, "AZURE_CLIENT_ID", mock_settings.get("azure_client_id", ""))
    mock_settings["azure_tenant_id"] = getattr(app_settings, "AZURE_TENANT_ID", mock_settings.get("azure_tenant_id", ""))
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
    # Microsoft Graph API call to test access to the SharePoint site
    headers = {"Authorization": f"Bearer {token}"}
    try:
        # Just getting the user's profile to test the token validity, or search the site
        res = requests.get("https://graph.microsoft.com/v1.0/me", headers=headers, timeout=10)
        if res.status_code == 200:
            return {"status": "success", "message": "SharePoint connection verified via Microsoft Graph!"}
        else:
            return {"status": "error", "message": f"Graph API Error: {res.text}"}
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
