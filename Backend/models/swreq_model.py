from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime

class ComplianceQuestion(SQLModel, table=True):
    __tablename__ = "compliance_questions"
    id: Optional[int] = Field(default=None, primary_key=True)
    question_text: str = Field(max_length=500)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = Field(default=None)
    is_active: bool = Field(default=True)  
    deleted_at: Optional[datetime] = Field(default=None) 

class ComplianceAnswer(SQLModel, table=True):
    __tablename__ = "compliance_answers"
    id: Optional[int] = Field(default=None, primary_key=True)
    request_id: int = Field(foreign_key="software_requests.id")
    question_id: int = Field(foreign_key="compliance_questions.id")
    answer: str = Field()
    created_at: datetime = Field(default_factory=datetime.now)
    request: "SoftwareRequest" = Relationship(back_populates="compliance_answers")
    question: ComplianceQuestion = Relationship()

class SoftwareRequest(SQLModel, table=True):
    __tablename__ = "software_requests"
    id: Optional[int] = Field(default=None, primary_key=True)
    employee_id: int = Field(foreign_key="employees.id")
    manager_id: Optional[int] = Field(default=None, foreign_key="employees.id")
    it_admin_id: int = Field(foreign_key="employees.id")
    asset_id: Optional[int] = Field(default=None, foreign_key="assets.asset_id")  # New field for asset selection
    software_name: str = Field(max_length=100)
    software_version: Optional[str] = Field(max_length=50)
    status: str = Field(default="Pending", max_length=20)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = Field(default=None)
    comments: Optional[str] = Field(default=None, max_length=500)
    additional_info: Optional[str] = Field(default=None, max_length=500)
    compliance_answered: bool = Field(default=False)
    business_unit_id: Optional[int] = Field(default=None, foreign_key="locations.id")  # New field
    software_duration: Optional[str] = Field(default=None, max_length=50)  # New field
    compliance_answers: List[ComplianceAnswer] = Relationship(back_populates="request")

class AuditTrail(SQLModel, table=True):
    __tablename__ = "audit_trails"
    id: Optional[int] = Field(default=None, primary_key=True)
    request_id: int = Field(foreign_key="software_requests.id")
    action: str = Field(max_length=50)
    performed_by_id: int = Field(foreign_key="employees.id")
    performed_at: datetime = Field(default_factory=datetime.now)
    details: Optional[str] = Field(default=None, max_length=500)