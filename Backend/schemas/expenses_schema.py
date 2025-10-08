from datetime import date, datetime
from typing import Optional, List
from sqlmodel import SQLModel
 
class ExpenseAttachmentCreate(SQLModel):
    file_name: str
    file_url: str  # Changed from file_path
    file_type: Optional[str] = None
    file_size: Optional[float] = None
 
class ExpenseAttachmentRead(ExpenseAttachmentCreate):
    attachment_id: int
    uploaded_at: datetime
 
class ExpenseHistoryRead(SQLModel):
    action_by: int
    action_role: str
    action: str
    reason: Optional[str]
    created_at: datetime
 
class ExpenseRequestCreate(SQLModel):
    employee_id: int
    category: str
    amount: float
    currency: str
    description: Optional[str] = None
    expense_date: date
    tax_included: bool = False
 
    discount_percentage: Optional[float] = None
    cgst_percentage: Optional[float] = None
    sgst_percentage: Optional[float] = None
 
class ExpenseRequestRead(SQLModel):
    request_id: int
    request_code: str
    employee_id: int
    category: str
    amount: float
    currency: str
    description: Optional[str]
    expense_date: date
    tax_included: bool
    discount_percentage: Optional[float] = None
    cgst_percentage: Optional[float] = None
    sgst_percentage: Optional[float] = None
    final_amount: Optional[float] = None
    status: str
    created_at: datetime
    updated_at: datetime
 
    attachments: List[ExpenseAttachmentRead] = []
    history: List[ExpenseHistoryRead] = []