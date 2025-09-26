from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from models.user_model import User


class ExpenseAttachment(SQLModel, table=True):
    __tablename__ = "expense_attachments"

    attachment_id: Optional[int] = Field(default=None, primary_key=True) 
    request_id: int = Field(foreign_key="expense_requests.request_id")
    file_name: str
    file_path: str
    file_type: Optional[str] = None
    file_size: Optional[float] = None
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

    expense_request: Optional["ExpenseRequest"] = Relationship(back_populates="attachments")


class ExpenseRequest(SQLModel, table=True):
    __tablename__ = "expense_requests"

    request_id: Optional[int] = Field(default=None, primary_key=True)
    request_code: str
    employee_id: int = Field(foreign_key="employees.id")
    category: str
    amount: float
    currency: str
    description: Optional[str] = None
    expense_date: datetime
    tax_included: bool = False
    status: str = "pending_manager_approval"

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    attachments: List[ExpenseAttachment] = Relationship(back_populates="expense_request")
    history: List["ExpenseHistory"] = Relationship(back_populates="expense_request")  


class ExpenseHistory(SQLModel, table=True):
    __tablename__ = "expense_history"

    id: Optional[int] = Field(default=None, primary_key=True)
    request_id: int = Field(foreign_key="expense_requests.request_id")
    action_by: int = Field(foreign_key="employees.id")
    action_role: str 
    action: str      
    reason: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    expense_request: Optional[ExpenseRequest] = Relationship(back_populates="history")
