from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ExtractedDataBase(BaseModel):
    document_date: Optional[str] = None
    processing_date: Optional[str] = None
    received_date: Optional[str] = None
    
    claim_number: Optional[str] = None
    claimant_name: Optional[str] = None
    claimant_number: Optional[str] = None
    policy_number: Optional[str] = None
    date_of_loss: Optional[str] = None
    
    firm_name: Optional[str] = None
    firm_address: Optional[str] = None
    firm_vendor_id: Optional[str] = None
    
    provider: Optional[str] = None
    provider_vendor_id: Optional[str] = None
    
    amount_paid: Optional[str] = None
    amount_billed: Optional[str] = None
    eighty_percent_amount_billed: Optional[str] = None
    amount_owed: Optional[str] = None
    
    date_of_service_from: Optional[str] = None
    date_of_service_to: Optional[str] = None
    
    total_postage_cost: Optional[str] = None
    certification_number: Optional[str] = None
    documents_in_envelope: Optional[str] = None
    postage_cost_per_document: Optional[str] = None
    envelope_type: Optional[str] = None
    certified_mail: Optional[str] = None
    assignment_of_benefit: Optional[str] = None

class ExtractedDataCreate(ExtractedDataBase):
    pass

class ExtractedDataUpdate(ExtractedDataBase):
    pass

class ExtractedDataResponse(ExtractedDataBase):
    id: int
    document_id: int

    class Config:
        from_attributes = True

class ProcessingLogResponse(BaseModel):
    id: int
    description: str
    status: str
    created_by: str
    created_at: datetime

    class Config:
        from_attributes = True

class AuditHistoryResponse(BaseModel):
    id: int
    field_name: str
    original_value: Optional[str]
    updated_value: Optional[str]
    updated_by: str
    updated_at: datetime

    class Config:
        from_attributes = True

class DocumentBase(BaseModel):
    file_name: str
    status: str
    confidence_score: Optional[float] = None
    accuracy_score: Optional[float] = None

class DocumentResponse(DocumentBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    extracted_data: Optional[ExtractedDataResponse] = None
    processing_logs: List[ProcessingLogResponse] = []
    audit_history: List[AuditHistoryResponse] = []

    class Config:
        from_attributes = True

class DocumentListResponse(DocumentBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
