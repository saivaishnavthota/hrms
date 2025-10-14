from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class SoftwareRequest(SQLModel, table=True):
    __tablename__ = "software_requests"
    id: Optional[int] = Field(default=None, primary_key=True)
    employee_id: int = Field(foreign_key="employees.id")
    manager_id: Optional[int] = Field(default=None, foreign_key="employees.id")
    it_admin_id: int = Field(foreign_key="employees.id")
    software_name: str = Field(max_length=100)
    software_version: Optional[str] = Field(max_length=50)
    status: str = Field(default="Pending", max_length=20)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = Field(default=None)
    comments: Optional[str] = Field(default=None, max_length=500)
    additional_info: Optional[str] = Field(default=None, max_length=500)

class AuditTrail(SQLModel, table=True):
    __tablename__ = "audit_trails"
    id: Optional[int] = Field(default=None, primary_key=True)
    request_id: int = Field(foreign_key="software_requests.id")
    action: str = Field(max_length=50)
    performed_by_id: int = Field(foreign_key="employees.id")
    performed_at: datetime = Field(default_factory=datetime.now)
    details: Optional[str] = Field(default=None, max_length=500)