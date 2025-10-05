from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
from sqlalchemy import Column, JSON

class CompanyPolicy(SQLModel, table=True):
    __tablename__ = "company_policies"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    location_id: int = Field(foreign_key="locations.id")
    file_name: str = Field(max_length=255)
    file_url: str  # Azure Blob Storage URL with SAS token
    uploaded_by: int = Field(foreign_key="employees.id")
    sections_json: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: Optional[datetime] = None  # Soft delete
