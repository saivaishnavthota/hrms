from sqlmodel import SQLModel, Field
from typing import Optional

class EmployeeCreate(SQLModel):
    name: str = Field(max_length=255, nullable=False)
    role: Optional[str] = Field(max_length=100, default=None)
    email: Optional[str] = Field(max_length=255, default=None)

class EmployeeUpdate(SQLModel):
    name: Optional[str] = Field(max_length=255, default=None)
    role: Optional[str] = Field(max_length=100, default=None)
    email: Optional[str] = Field(max_length=255, default=None)

class EmployeeResponse(SQLModel):
    id: int
    name: str
    role: Optional[str] = None
    email: Optional[str] = None