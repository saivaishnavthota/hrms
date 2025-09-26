# app/models/leave_model.py
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime, date

class LeaveManagement(SQLModel, table=True):
    __tablename__ = "leave_management"
    id: Optional[int] = Field(default=None, primary_key=True)
    employee_id: int = Field(foreign_key="employees.id")
    reason: Optional[str]
    start_date: date
    end_date: date
    no_of_days:int=Field(default=0)
    
    status: str = Field(default="Pending", max_length=20)
    created_at: Optional[datetime] = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = Field(default_factory=datetime.now)
    manager_status: str = Field(default="Pending", max_length=20)
    hr_status: str = Field(default="Pending", max_length=20)
    leave_type: Optional[str] = Field(max_length=20)
