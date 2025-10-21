from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ComplianceRequest(BaseModel):
    request_ids: List[int]

class ComplianceQuestionBase(BaseModel):
    question_text: str

class ComplianceQuestionCreate(ComplianceQuestionBase):
    pass

class ComplianceQuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    is_active: Optional[bool] = None

class ComplianceQuestionResponse(ComplianceQuestionBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_active: bool  # Include to show status
    deleted_at: Optional[datetime] = None  # Include for auditing

    class Config:
        from_attributes = True

class ComplianceAnswerCreate(BaseModel):
    question_id: int
    answer: str

class ComplianceAnswerResponse(BaseModel):
    id: int
    question_id: int
    answer: str
    question_text: str
    created_at: datetime

    class Config:
        from_attributes = True

class SoftwareRequestCreate(BaseModel):
    employee_id: int
    manager_id: Optional[int] = None
    it_admin_id: int
    asset_id: Optional[int] = None  # New field for asset selection
    software_name: str
    software_version: Optional[str] = None
    additional_info: Optional[str] = None
    business_unit_id: Optional[int] = None  # New field
    software_duration: Optional[str] = None  # New field

class SoftwareRequestUpdate(BaseModel):
    status: str
    comments: Optional[str] = None

class SoftwareRequestResponse(BaseModel):
    id: int
    employee_id: int
    manager_id: Optional[int]
    it_admin_id: int
    asset_id: Optional[int] = None  # New field for asset selection
    software_name: str
    software_version: Optional[str]
    status: str
    created_at: datetime
    updated_at: Optional[datetime]
    comments: Optional[str]
    additional_info: Optional[str]
    employee_name: Optional[str] = None
    employee_email: Optional[str] = None
    manager_name: Optional[str] = None
    manager_email: Optional[str] = None
    it_admin_name: Optional[str] = None
    it_admin_email: Optional[str] = None
    compliance_answered: bool
    business_unit_id: Optional[int] = None  # New field
    business_unit_name: Optional[str] = None  # New field for location name
    software_duration: Optional[str] = None  # New field
    compliance_answers: List[ComplianceAnswerResponse] = []

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True