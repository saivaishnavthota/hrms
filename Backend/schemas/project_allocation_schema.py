from sqlmodel import SQLModel
from typing import Optional, List
from datetime import datetime

class ProjectAllocationBase(SQLModel):
    employee_id: int
    project_id: int
    employee_name: str
    company: Optional[str] = None
    level: Optional[str] = None
    client: Optional[str] = None
    service_line: Optional[str] = None
    month: str
    allocated_days: float = 0.0
    consumed_days: float = 0.0

class ProjectAllocationCreate(ProjectAllocationBase):
    pass

class ProjectAllocationResponse(ProjectAllocationBase):
    id: int
    remaining_days: float
    created_at: datetime
    updated_at: datetime

class AllocationSummaryItem(SQLModel):
    project_id: int
    project_name: str
    allocated_days: float
    consumed_days: float
    remaining_days: float
    employee_name: str
    company: Optional[str] = None
    client: Optional[str] = None

class AllocationSummaryResponse(SQLModel):
    employee_id: int
    month: str
    allocations: List[AllocationSummaryItem]

class ImportResultResponse(SQLModel):
    success: bool
    message: str
    imported_count: int
    error_count: int
    error_details: List[str] = []

class ValidationResponse(SQLModel):
    valid: bool
    message: str
    employee_id: int
    project_id: int
    date: str
    days_to_consume: float
