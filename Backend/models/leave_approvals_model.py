# app/models/leave_approvals_model.py
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class LeaveApproval(SQLModel, table=True):
    __tablename__ = "leave_approvals"
    id: Optional[int] = Field(default=None, primary_key=True)
    leave_id: int = Field(foreign_key="leave_management.id")
    approver_id: int = Field(foreign_key="employees.id")
    approver_role: Optional[str] = Field(max_length=50)
    status: str = Field(default="Pending", max_length=20)
    updated_at: Optional[datetime] = Field(default_factory=datetime.now)