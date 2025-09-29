# app/models/document_model.py
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
import uuid

class Document(SQLModel, table=True):
    __tablename__ = "employee_documents"

    id: Optional[int] = Field(default=None, primary_key=True)
    employee_id: int
    doc_type: str  # e.g., "passport", "aadhar", "offer_letter", etc.
    file_id: str = Field(default_factory=lambda: str(uuid.uuid4()))  # unique identifier
    file_name: str  # original file name
    file_url: str  # Azure Blob URL
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)