from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class EmployeeManager(SQLModel, table=True):
    __tablename__ = "employee_managers"
    id: Optional[int] = Field(default=None, primary_key=True)
    employee_id: int = Field(foreign_key="employees.id")
    manager_id: int = Field(foreign_key="employees.id")
    created_at: datetime = Field(default_factory=datetime.now)


class EmployeeHR(SQLModel, table=True):
    __tablename__ = "employee_hrs"
    id: Optional[int] = Field(default=None, primary_key=True)
    employee_id: int = Field(foreign_key="employees.id")
    hr_id: int = Field(foreign_key="employees.id")
    created_at: datetime = Field(default_factory=datetime.now)
