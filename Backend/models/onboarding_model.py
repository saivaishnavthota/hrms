from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class candidate(SQLModel, table=True):
    __tablename__ = "onboarding_employees"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: Optional[str] = Field(max_length=100)
    email: Optional[str] = Field(max_length=100)
    password: Optional[str]
    role: Optional[str] = Field(max_length=100)
    type: Optional[str] = Field(max_length=100)
    o_status :Optional[bool]=Field(default=False)
    login_status :Optional[bool]=Field(default=False)

class onboard_emp_doc(SQLModel, table=True):
    __tablename__ = "onboarding_emp_docs"

    id: Optional[int] = Field(default=None, primary_key=True)
    employee_id: int
    doc_type: str
    file_name: Optional[str]
    file_url: Optional[str]
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

