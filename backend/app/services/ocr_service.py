import os
import json
import base64
import logging
from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
import fitz  # PyMuPDF
from openai import OpenAI

from app.core.config import settings
from app.db.database import SessionLocal
from app.models.domain import Document, ExtractedData, ProcessingLog, StatusHistory

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# LLM SCHEMA DEFINITION
# ---------------------------------------------------------------------------
class ExtractedField(BaseModel):
    value: str = Field(description="The extracted value. If not found, use 'Not found'. For money use '0.00'. For dates use MM/DD/YYYY.")
    confidence: float = Field(description="Confidence score between 0.0 and 1.0 based on how clear the text is.")

class DemandLetterExtraction(BaseModel):
    policy_number: ExtractedField
    claim_number: ExtractedField
    claimant_name: ExtractedField
    provider: ExtractedField
    firm_name: ExtractedField
    firm_address: ExtractedField
    amount_billed: ExtractedField
    eighty_percent_amount_billed: ExtractedField
    amount_paid: ExtractedField
    amount_owed: ExtractedField
    date_of_loss: ExtractedField
    documents_in_envelope: ExtractedField
    date_of_service_from: ExtractedField
    date_of_service_to: ExtractedField
    document_date: ExtractedField
    total_postage_cost: ExtractedField
    certification_number: ExtractedField
    envelope_type: ExtractedField
    certified_mail: ExtractedField
    assignment_of_benefit: ExtractedField


SYSTEM_PROMPT = """
You are an expert data extraction AI. You are extracting values from an insurance / legal demand letter and its related envelope pages. 
You will be provided with images of the document.

Extract these fields:
1. Claim Number (Numeric only, e.g. 123456789. Do not use file numbers)
2. Claimant Name (Patient/Insured name)
3. Firm Name (Law firm name from letterhead)
4. Provider (Medical facility)
5. Amount Owed (Balance due)
6. Certified Mail (Yes/No)
7. Firm Address (Address from letterhead)
8. Amount Billed (Total billed)
9. Amount Paid (Previous payments)
10. No. of Documents in Envelope
11. Policy Number (Alphanumeric, e.g. FLA12345)
12. DOL (Date of Loss, MM/DD/YYYY)
13. Certification Number (Tracking number)
14. Document Date (Date of letter, MM/DD/YYYY)
15. Assignment of Benefit (Yes/No)
16. 80% Amount Billed (@ 80% amount)
17. Date of Service From
18. Date of Service To
19. Envelope Type
20. Total Postage Cost

Normalization rules:
- Money: return only the numeric value with exactly 2 decimal places, no $ and no commas (e.g. 123.46). If not found, return "0.00".
- Dates: return in MM/DD/YYYY when possible.
- Yes/No fields: return "Yes", "No", or "Not found".
- Missing fields: return "Not found" (except money which should be "0.00").
- Names/addresses: plain text, remove apostrophes.

For each field, also provide a confidence score between 0.0 and 1.0 based on how clearly you can read it.
"""

def extract_images_from_pdf(file_path: str, max_pages: int = 50) -> List[str]:
    """Convert the pages of a PDF to Base64 JPEG strings."""
    base64_images = []
    try:
        pdf_doc = fitz.open(file_path)
        pages_to_process = min(max_pages, len(pdf_doc))
        
        for page_num in range(pages_to_process):
            page = pdf_doc[page_num]
            pix = page.get_pixmap(dpi=150)
            jpeg_bytes = pix.tobytes("jpeg")
            img_str = base64.b64encode(jpeg_bytes).decode("utf-8")
            base64_images.append(img_str)
            
        pdf_doc.close()
    except Exception as e:
        logger.error(f"Error converting PDF to images: {e}")
    return base64_images


def call_openai_vision(base64_images: List[str]) -> dict:
    """Call OpenAI Vision API to extract structured data."""
    if not settings.OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY is not set in environment variables.")
        
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    
    # Construct message content
    content = [{"type": "text", "text": "Extract the specified fields from these document images."}]
    for img_str in base64_images:
        content.append({
            "type": "image_url",
            "image_url": {
                "url": f"data:image/jpeg;base64,{img_str}"
            }
        })

    # Call OpenAI Structured Outputs
    completion = client.beta.chat.completions.parse(
        model="gpt-4o",  # or gpt-4o-mini depending on cost/perf
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": content}
        ],
        response_format=DemandLetterExtraction,
    )
    
    # Convert Pydantic object to dict
    parsed = completion.choices[0].message.parsed
    return parsed.model_dump()


# ---------------------------------------------------------------------------
# MAIN PROCESSING PIPELINE
# ---------------------------------------------------------------------------

def process_document_task(document_id: int, file_path: str):
    """Process a document: extract text via OpenAI Vision API and parse structured data."""
    db = SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            logger.error(f"Document {document_id} not found")
            return

        # Delete any existing extracted data for re-processing
        existing = db.query(ExtractedData).filter(ExtractedData.document_id == doc.id).first()
        if existing:
            db.delete(existing)
            db.commit()

        doc.status = "Processing"
        db.add(StatusHistory(document_id=doc.id, new_status="Processing", previous_status="File Uploaded"))
        db.add(ProcessingLog(document_id=doc.id, description="Started processing with OpenAI Vision API.", status="Processing", created_by="System"))
        db.commit()

        # Check API Key
        if not settings.OPENAI_API_KEY:
            doc.status = "Failed"
            msg = "Missing OPENAI_API_KEY in .env file. Extraction aborted."
            db.add(StatusHistory(document_id=doc.id, new_status="Failed", previous_status="Processing"))
            db.add(ProcessingLog(document_id=doc.id, description=msg, status="Failed", created_by="System"))
            db.commit()
            logger.error(msg)
            return

        # ---- Extract Images ----
        db.add(ProcessingLog(document_id=doc.id, description="Converting PDF pages to images...", status="Processing", created_by="System"))
        db.commit()

        base64_images = extract_images_from_pdf(file_path, max_pages=50)
        
        if not base64_images:
            doc.status = "Failed"
            db.add(StatusHistory(document_id=doc.id, new_status="Failed", previous_status="Processing"))
            db.add(ProcessingLog(document_id=doc.id, description="Failed: could not convert PDF to images.", status="Failed", created_by="System"))
            db.commit()
            return

        # ---- Call OpenAI Vision API ----
        db.add(ProcessingLog(document_id=doc.id, description=f"Sending {len(base64_images)} pages to OpenAI gpt-4o for structured extraction...", status="Processing", created_by="System"))
        db.commit()

        parsed = call_openai_vision(base64_images)

        # Log the full extraction result as JSON for debugging
        logger.info(f"Document {document_id} AI extraction result: {json.dumps(parsed, indent=2)}")

        # ---- Map parsed fields to ExtractedData model ----
        today = datetime.utcnow().strftime("%m/%d/%Y")
        
        db_fields = {
            "processing_date": today,
            "received_date": today,
            "claimant_number": "N/A" # Default
        }
        
        # Add values from AI response
        for parsed_key, field_data in parsed.items():
            if hasattr(ExtractedData, parsed_key):
                val = field_data["value"]
                if val and val not in ("N/A", "0.00", "Not found"):
                    db_fields[parsed_key] = str(val)

        extracted = ExtractedData(document_id=doc.id, **db_fields)
        db.add(extracted)

        # ---- Calculate overall confidence ----
        confidences = [data["confidence"] for key, data in parsed.items()]
        avg_confidence = sum(confidences) / max(len(confidences), 1)
        
        filled_fields = [k for k, v in parsed.items() if v["value"] not in ("N/A", "0.00", "Not found", "No")]
        field_coverage = len(filled_fields) / len(parsed)

        # Overall confidence: weighted average
        overall_confidence = round(0.7 * avg_confidence + 0.3 * field_coverage, 2)
        overall_accuracy = round(min(0.99, overall_confidence * 0.95 + 0.04), 2)

        doc.confidence_score = overall_confidence
        doc.accuracy_score = overall_accuracy

        # ---- Finalize ----
        doc.status = "Data Extracted"
        db.add(StatusHistory(document_id=doc.id, new_status="Data Extracted", previous_status="Processing"))

        db.add(ProcessingLog(
            document_id=doc.id,
            description=f"AI Extraction complete in seconds! {len(filled_fields)} fields extracted. Confidence: {overall_confidence:.0%}.",
            status="Data Extracted", created_by="System"
        ))
        db.commit()
        logger.info(f"Document {document_id} processed via OpenAI. {len(filled_fields)} fields, confidence {overall_confidence:.0%}")

    except Exception as e:
        logger.error(f"Document {document_id} processing failed: {e}", exc_info=True)
        db.rollback()
        try:
            doc = db.query(Document).filter(Document.id == document_id).first()
            if doc:
                doc.status = "Failed"
                db.add(StatusHistory(document_id=doc.id, new_status="Failed", previous_status="Processing"))
                db.add(ProcessingLog(document_id=doc.id, description=f"Processing failed: {str(e)}", status="Failed", created_by="System"))
                db.commit()
        except Exception as inner_e:
            logger.error(f"Failed to update error status: {inner_e}")
    finally:
        db.close()
