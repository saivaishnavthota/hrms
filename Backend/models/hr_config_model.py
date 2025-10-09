from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class LeaveCategory(SQLModel, table=True):
    __tablename__ = "leave_categories"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    default_days: int = Field(default=0)
    description: Optional[str] = None
    is_active: bool = Field(default=True)
    created_by: int = Field(foreign_key="employees.id")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

class Department(SQLModel, table=True):
    __tablename__ = "departments"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    description: Optional[str] = None
    is_active: bool = Field(default=True)
    created_by: int = Field(foreign_key="employees.id")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

