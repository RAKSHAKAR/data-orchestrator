import fitz
from paddleocr import PaddleOCR
from PIL import Image
import numpy as np
import io
import os
os.environ["FLAGS_enable_pir_api"] = "0"
os.environ["FLAGS_use_mkldnn"] = "0"

file_path = "c:/Users/priyer/.gemini/antigravity-ide/scratch/Demmo/data-orchestrator/2026-05-28T06_48_06.2441973Z.pdf"
ocr_engine = PaddleOCR(use_textline_orientation=True, lang='en')

text = ""
doc = fitz.open(file_path)
for page in doc:
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
    img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
    img_array = np.array(img)
    result = ocr_engine.predict(img_array)
    print("Raw result:", result)
    # Just to prevent crashes for now, we won't try to parse it yet
    break


print("OCR text length:", len(text))
print("OCR text:")
print(text)
