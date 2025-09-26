# app/schemas/employee_master_schema.py
from sqlmodel import SQLModel
from typing import Optional

class EmployeeMasterCreate(SQLModel):
    emp_id: int
    manager1_id: int
    hr1_id: int
    manager2_id: Optional[int]
    manager3_id: Optional[int]
    hr2_id: Optional[int]

class EmployeeMasterResponse(SQLModel):
    emp_id: int
    manager1_id: int
    hr1_id: int
    manager2_id: Optional[int]
    manager3_id: Optional[int]
    hr2_id: Optional[int]