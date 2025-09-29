from sqlmodel import SQLModel
from datetime import datetime

class RequestLogCreate(SQLModel):
    employee_id: int
    document_type: str

class RequestLogResponse(SQLModel):
    id: int
    employee_id: int
    
    document_type: str
    status: str
    requested_at: datetime

    class Config:
        orm_mode = True
