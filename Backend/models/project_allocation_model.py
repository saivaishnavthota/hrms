from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, TYPE_CHECKING
from datetime import datetime
from zoneinfo import ZoneInfo

if TYPE_CHECKING:
    from .user_model import User
    from .project_model import Project

class ProjectAllocation(SQLModel, table=True):
    __tablename__ = "project_allocations"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    employee_id: int = Field(foreign_key="employees.id", index=True)
    project_id: int = Field(foreign_key="projects.project_id", index=True)
    
    # Store metadata from Excel
    employee_name: str
    company: Optional[str] = Field(default=None)
    level: Optional[str] = Field(default=None)
    client: Optional[str] = Field(default=None)
    service_line: Optional[str] = Field(default=None)
    
    month: str = Field(index=True)  # Format: YYYY-MM
    allocated_days: float = Field(default=0.0)
    consumed_days: float = Field(default=0.0)
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=ZoneInfo("Asia/Kolkata")))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(tz=ZoneInfo("Asia/Kolkata")))
    
    # Relationships
    employee: Optional["User"] = Relationship(back_populates="project_allocations")
    project: Optional["Project"] = Relationship(back_populates="allocations")
