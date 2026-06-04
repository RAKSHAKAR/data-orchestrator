import requests

url = "http://localhost:8000/api/v1/documents/upload/"
file_path = "c:/Users/priyer/.gemini/antigravity-ide/scratch/Demmo/data-orchestrator/2026-05-28T06_48_06.2441973Z.pdf"

with open(file_path, "rb") as f:
    files = {"file": f}
    # Upload to API
    response = requests.post(url, files=files)
    print("Status Code:", response.status_code)
    print("Response JSON:", response.json())
