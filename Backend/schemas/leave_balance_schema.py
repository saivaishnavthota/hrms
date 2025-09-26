# app/schemas/leave_balance_schema.py
from sqlmodel import SQLModel,Field
from typing import Optional
from datetime import datetime

class LeaveBalanceResponse(SQLModel):
    id: int
    employee_id: int
    sick_leaves: int
    casual_leaves: int
    paid_leaves: int
    maternity_leave: int
    paternity_leave: int
    created_at: datetime
    updated_at: datetime

class LeaveBalance(SQLModel, table=True):
    __tablename__ = "leave_balance"

    id: Optional[int] = Field(default=None, primary_key=True)
    employee_id: int
    sick_leaves: int = 0
    casual_leaves: int = 0
    paid_leaves: int = 0
    maternity_leave: int = 0
    paternity_leave: int = 0
    created_at: datetime
    updated_at: datetime

class LeaveBalanceUpdate(SQLModel):
    sick_leaves: int
    casual_leaves: int
    paid_leaves: int
    maternity_leave: int
    paternity_leave: int