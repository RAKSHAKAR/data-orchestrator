import fitz

file_path = "c:/Users/priyer/.gemini/antigravity-ide/scratch/Demmo/data-orchestrator/2026-05-28T06_48_06.2441973Z.pdf"
doc = fitz.open(file_path)
text = ""
for page in doc:
    text += page.get_text()

print("Extracted Text Length:", len(text))
if len(text) > 50:
    print(text[:500])
