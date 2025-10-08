# app/schemas/leave_schema.py
from sqlmodel import SQLModel
from typing import Optional
from datetime import date, datetime


class LeaveCreate(SQLModel):
    employee_id: int
    leave_type: str
    reason: Optional[str]
    start_date: date
    end_date: date


class LeaveResponse(SQLModel):
    id: int
    employee_id: int
    employee_name: str
    leave_type: str
    reason: Optional[str]
    start_date: date
    end_date: date
    no_of_days: int
    status: str
    manager_status: str
    hr_status: str
    created_at: Optional[datetime]
    
    

class LeaveApprovalCreate(SQLModel):
    leave_id: int
    approver_id: int
    approver_role: str
    status: str