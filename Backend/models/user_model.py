# app/models/user_model.py
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime

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
    company_employee_id: Optional[str] = Field(max_length=50, default=None)
    reassignment: Optional[bool] = Field(default=False)  # Track if employee has been assigned before
    login_status: Optional[bool] = Field(default=False)
    location_id: Optional[int] = Field(default=None, foreign_key="locations.id")
    employment_type: Optional[str] = Field(default="Full-Time", max_length=50)
    
    doj: Optional[datetime] = Field(default=None)

   
    