# app/schemas/document_schema.py
from sqlmodel import SQLModel
from typing import Optional
from datetime import datetime

class DocumentCreate(SQLModel):
    employee_id: int
    file_name: str
    file_type: str
    file_data: bytes

class DocumentResponse(SQLModel):
    id: int
    employee_id: int
    file_name: str
    file_type: str

class DraftResponse(SQLModel):
    message: str
    saved_at: datetime