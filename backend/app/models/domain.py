from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String, index=True)
    file_path = Column(String)
    status = Column(String, index=True)
    confidence_score = Column(Float, nullable=True)
    accuracy_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    extracted_data = relationship("ExtractedData", back_populates="document", uselist=False)
    audit_history = relationship("AuditHistory", back_populates="document")
    processing_logs = relationship("ProcessingLog", back_populates="document")
    status_history = relationship("StatusHistory", back_populates="document")

class ExtractedData(Base):
    __tablename__ = "extracted_data"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), unique=True)
    
    # Document Information
    document_date = Column(String, nullable=True)
    processing_date = Column(String, nullable=True)
    received_date = Column(String, nullable=True)
    
    # Claim Information
    claim_number = Column(String, index=True, nullable=True)
    claimant_name = Column(String, index=True, nullable=True)
    claimant_number = Column(String, nullable=True)
    policy_number = Column(String, nullable=True)
    date_of_loss = Column(String, nullable=True)
    
    # Firm Information
    firm_name = Column(String, index=True, nullable=True)
    firm_address = Column(String, nullable=True)
    firm_vendor_id = Column(String, nullable=True)
    
    # Provider Information
    provider = Column(String, nullable=True)
    provider_vendor_id = Column(String, nullable=True)
    
    # Financial Information
    amount_paid = Column(String, nullable=True)
    amount_billed = Column(String, nullable=True)
    eighty_percent_amount_billed = Column(String, nullable=True)
    amount_owed = Column(String, nullable=True)
    
    # Service Information
    date_of_service_from = Column(String, nullable=True)
    date_of_service_to = Column(String, nullable=True)
    
    # Mail Information
    total_postage_cost = Column(String, nullable=True)
    certification_number = Column(String, nullable=True)
    documents_in_envelope = Column(String, nullable=True)
    postage_cost_per_document = Column(String, nullable=True)
    envelope_type = Column(String, nullable=True)
    certified_mail = Column(String, nullable=True)
    assignment_of_benefit = Column(String, nullable=True)

    document = relationship("Document", back_populates="extracted_data")

class AuditHistory(Base):
    __tablename__ = "audit_history"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    field_name = Column(String)
    original_value = Column(String, nullable=True)
    updated_value = Column(String, nullable=True)
    updated_by = Column(String)
    updated_at = Column(DateTime(timezone=True), server_default=func.now())

    document = relationship("Document", back_populates="audit_history")

class ProcessingLog(Base):
    __tablename__ = "processing_logs"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    description = Column(String)
    status = Column(String)
    created_by = Column(String, default="System")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    document = relationship("Document", back_populates="processing_logs")

class StatusHistory(Base):
    __tablename__ = "status_history"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    previous_status = Column(String, nullable=True)
    new_status = Column(String)
    updated_at = Column(DateTime(timezone=True), server_default=func.now())

    document = relationship("Document", back_populates="status_history")
