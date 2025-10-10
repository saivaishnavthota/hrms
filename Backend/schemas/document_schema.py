# app/schemas/document_schema.py
from sqlmodel import SQLModel
from typing import Optional,List
from datetime import datetime

class DocumentStatus(SQLModel):
    doc_type: str
    file_url: Optional[str]
    uploaded_at: Optional[str]

class EmployeeDocuments(SQLModel):
    id: int
    name: str
    email: str
    role: str
    type:str
    documents: List[DocumentStatus]

class DraftResponse(SQLModel):
    message: str
    saved_at: str