import random
import time

class OCRService:
    def extract_data_from_pdf(self, file_path: str):
        # Mocking an OCR extraction with random confidence and accuracy
        time.sleep(2)
        confidence = round(random.uniform(70.0, 99.9), 2)
        accuracy = round(random.uniform(75.0, 99.9), 2)
        
        extracted_data = {
            "document_date": "2023-10-01",
            "processing_date": "2023-10-05",
            "received_date": "2023-10-02",
            "claim_number": f"{random.randint(1000000000, 9999999999)}",
            "claimant_name": "John Doe",
            "claimant_number": f"CL-{random.randint(1000, 9999)}",
            "policy_number": f"POL-{random.randint(1000, 9999)}",
            "date_of_loss": "2023-09-15",
            "firm_name": "Smith & Associates",
            "firm_address": "123 Legal Way, Suite 100",
            "firm_vendor_id": "V-55512",
            "provider": "General Hospital",
            "provider_vendor_id": "P-99123",
            "amount_paid": "$500.00",
            "amount_billed": "$1500.00",
            "eighty_percent_amount_billed": "$1200.00",
            "amount_owed": "$1000.00",
            "date_of_service_from": "2023-09-16",
            "date_of_service_to": "2023-09-18",
            "total_postage_cost": "$2.50",
            "certification_number": "CERT-88123",
            "documents_in_envelope": "3",
            "postage_cost_per_document": "$0.83",
            "envelope_type": "Standard",
            "certified_mail": "Yes",
            "assignment_of_benefit": "No"
        }
        return {"data": extracted_data, "confidence": confidence, "accuracy": accuracy}
