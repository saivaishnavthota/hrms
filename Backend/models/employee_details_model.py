from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import date, datetime

class EmployeeDetails(SQLModel, table=True):
    __tablename__ = "employee_details"

    employee_id: int = Field(primary_key=True, foreign_key="employees.id")
    full_name: str = Field(max_length=150)
    contact_no: str = Field(max_length=15)
    personal_email: Optional[str] = Field(max_length=100, default=None)
    company_email: Optional[str] = Field(max_length=100, default=None)
    doj: Optional[date] = None
    dob: date
    address: Optional[str] = None
    gender: Optional[str] = Field(max_length=10, default=None)
    graduation_year: Optional[int] = None
    work_experience_years: int = Field(default=0)
    emergency_contact_name: Optional[str] = None
    emergency_contact_number: Optional[str] = None
    emergency_contact_relation: Optional[str] = None
    employment_type: Optional[str] = Field(max_length=20, default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Location(SQLModel, table=True):
    __tablename__ = "locations"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(nullable=False)