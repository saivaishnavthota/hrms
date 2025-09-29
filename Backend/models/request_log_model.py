from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional
import uuid


class RequestLog(SQLModel, table=True):
    __tablename__ = "request_logs"

    id: Optional[int] = Field(default=None, primary_key=True)
    employee_id: int = Field(foreign_key="employees.id", nullable=False)  # link to employee
      # HR/Admin who requested
    document_type: str = Field(nullable=False)
    status: str = Field(default="pending")  # pending, submitted, verified, etc.
    requested_at: datetime = Field(default_factory=datetime.utcnow)
   