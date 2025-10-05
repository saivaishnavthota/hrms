from sqlmodel import SQLModel
from typing import Optional,List
from datetime import datetime,date
from pydantic import EmailStr

class UserCreate(SQLModel):
    name:str
    email:str
    role:str
    type:str

class UsercreateResponse(SQLModel):
    id:int
    name:str
    email:str

class EmployeeOnboardingRequest(SQLModel):
    employee_id: int
    full_name: str
    contact_no: str
    personal_email: str
    
    dob: date  # Date of Birth
    address: str
    gender: str
    graduation_year: int
    work_experience_years: int
    emergency_contact_name: str
    emergency_contact_number: str
    emergency_contact_relation: str

class EmployeeOnboardingResponse(SQLModel):
    status: str
    message: str
    employee_id: int


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

class AssignEmployeeRequest(SQLModel):
    employee_id: int
    location_id: int
    doj: date
    to_email:EmailStr
    company_email: EmailStr   # HR provides this
    company_employee_id: str | None = None  # Company-specific employee ID
    role: str | None = None  # Optional role change during assignment
    manager1_id: int
    manager2_id: int | None = None
    manager3_id: int | None = None
    hr1_id: int
    hr2_id: int | None = None

class ReassignEmployeeRequest(SQLModel):
    employee_id: int
    location_id: int
    company_email: EmailStr   # HR can update company email
    role: str | None = None  # Optional role change during reassignment
    manager1_id: int
    manager2_id: int | None = None
    manager3_id: int | None = None
    hr1_id: int
    hr2_id: int | None = None

class DocumentStatus(SQLModel):
    doc_type: str
    file_url: Optional[str]
    uploaded_at: Optional[str]

class EmployeeDocuments(SQLModel):
    id: int
    name: str
    email: str
    role: Optional[str]
    documents: List["DocumentStatus"]