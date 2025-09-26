# app/schemas/employee_create_schema.py
from sqlmodel import SQLModel
from typing import Optional
from datetime import date
from pydantic import EmailStr

class EmployeeCreateRequest(SQLModel):
    name: str
    email: EmailStr
    company_email: Optional[EmailStr] = None
    role: str
    employment_type: Optional[str] = "Full-Time"
    location_id: Optional[int] = None
    doj: Optional[date] = None
    
    # Employee details
    full_name: Optional[str] = None
    contact_no: Optional[str] = None
    personal_email: Optional[EmailStr] = None
    dob: Optional[date] = None
    address: Optional[str] = None
    gender: Optional[str] = None
    graduation_year: Optional[int] = None
    work_experience_years: Optional[int] = 0
    emergency_contact_name: Optional[str] = None
    emergency_contact_number: Optional[str] = None
    emergency_contact_relation: Optional[str] = None

class EmployeeUpdateRequest(SQLModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    company_email: Optional[EmailStr] = None
    role: Optional[str] = None
    employment_type: Optional[str] = None
    location_id: Optional[int] = None
    doj: Optional[date] = None
    
    # Employee details
    full_name: Optional[str] = None
    contact_no: Optional[str] = None
    personal_email: Optional[EmailStr] = None
    dob: Optional[date] = None
    address: Optional[str] = None
    gender: Optional[str] = None
    graduation_year: Optional[int] = None
    work_experience_years: Optional[int] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_number: Optional[str] = None
    emergency_contact_relation: Optional[str] = None

class EmployeeResponse(SQLModel):
    id: int
    name: str
    email: str
    company_email: Optional[str] = None
    role: str
    employment_type: Optional[str] = None
    location_id: Optional[int] = None
    location_name: Optional[str] = None
    doj: Optional[date] = None
    o_status: bool
    login_status: bool
    created_at: Optional[str] = None
    
    # Employee details
    full_name: Optional[str] = None
    contact_no: Optional[str] = None
    personal_email: Optional[str] = None
    dob: Optional[date] = None
    address: Optional[str] = None
    gender: Optional[str] = None
    graduation_year: Optional[int] = None
    work_experience_years: Optional[int] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_number: Optional[str] = None
    emergency_contact_relation: Optional[str] = None

class EmployeeDeleteResponse(SQLModel):
    status: str
    message: str
    employee_id: int