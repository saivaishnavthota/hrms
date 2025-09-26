from sqlmodel import SQLModel
from typing import Optional
from datetime import date

class EmployeeDetailsResponse(SQLModel):
    employee_id: int
    full_name: str
    contact_no: str
    personal_email: Optional[str]
    company_email: Optional[str]
    doj: Optional[date]
    dob: date
    address: Optional[str]
    gender: Optional[str]
    graduation_year: Optional[int]
    work_experience_years: int
    emergency_contact_name: Optional[str]
    emergency_contact_number: Optional[str]
    emergency_contact_relation: Optional[str]
    employment_type: Optional[str]

    class Config:
        orm_mode = True

class LocationCreate(SQLModel):
    name: str

class LocationRead(SQLModel):
    id: int
    name: str