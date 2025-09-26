# app/models/employee_master_model.py
from sqlmodel import SQLModel, Field
from typing import Optional

class EmployeeMaster(SQLModel, table=True):
    __tablename__ = "employee_master"
    emp_id: int = Field(primary_key=True, foreign_key="employees.id")
    manager1_id: int = Field(foreign_key="employees.id")
    hr1_id: int = Field(foreign_key="employees.id")
    manager2_id: Optional[int] = Field(default=None, foreign_key="employees.id")
    manager3_id: Optional[int] = Field(default=None, foreign_key="employees.id")
    hr2_id: Optional[int] = Field(default=None, foreign_key="employees.id")