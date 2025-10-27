# app/models/user_model.py
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime

if TYPE_CHECKING:
    from .attendance_model import Attendance
    from .project_allocation_model import ProjectAllocation

class User(SQLModel, table=True):
    __tablename__ = "employees"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: Optional[str] = Field(max_length=100)
    email: Optional[str] = Field(max_length=100)
    password_hash: Optional[str]
    role: Optional[str] = Field(max_length=100)
    o_status :Optional[bool]=Field(default=False)
    created_at: Optional[datetime] = Field(default_factory=datetime.now)
    reset_otp: Optional[str] = Field(default=None, max_length=6)
    company_email:Optional[str] = Field(max_length=100)
    company_employee_id: Optional[str] = Field(max_length=6, default=None)
    designation: Optional[str] = Field(max_length=200, default=None)  # Job title/designation
    band: Optional[str] = Field(max_length=50, default=None)  # Employee band level
    reassignment: Optional[bool] = Field(default=False)  # Track if employee has been assigned before
    login_status: Optional[bool] = Field(default=False)
    location_id: Optional[int] = Field(default=None, foreign_key="locations.id")
    employment_type: Optional[str] = Field(default="Full-Time", max_length=50)
    super_hr: Optional[bool] = Field(default=False)  # True for super-HR with elevated access
    
    doj: Optional[datetime] = Field(default=None)
    
    # Microsoft Entra ID fields
    entra_id: Optional[str] = Field(default=None, max_length=255, index=True, unique=True)  # Microsoft unique identifier
    job_title: Optional[str] = Field(default=None, max_length=200)  # Job title from Entra ID
    department: Optional[str] = Field(default=None, max_length=200)  # Department from Entra ID
    auth_provider: Optional[str] = Field(default="local", max_length=50)  # Authentication provider: "local" or "entra"

    # Relationships - using string references to avoid circular imports
    attendances: List["Attendance"] = Relationship(back_populates="employee")
    project_allocations: List["ProjectAllocation"] = Relationship(back_populates="employee")
    