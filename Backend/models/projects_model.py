from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime, date
from .user_model import User

class ProjectStatusLog(SQLModel, table=True):
    __tablename__ = "project_status_logs"

    log_id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="projects.project_id")
    updated_by: Optional[int] = Field(foreign_key="employees.id")
    new_status: Optional[str]
    updated_at: datetime = Field(default_factory=datetime.now)

class EmployeeProjectAssignment(SQLModel, table=True):
    __tablename__ = "employee_project_assignments"

    assignment_id: Optional[int] = Field(default=None, primary_key=True)
    employee_id: int = Field(foreign_key="employees.id")
    project_id: int = Field(foreign_key="projects.project_id")
    assigned_by: Optional[int] = Field(foreign_key="employees.id")
    assigned_at: datetime = Field(default_factory=datetime.now)

class Project(SQLModel, table=True):
    __tablename__ = "projects"

    project_id: Optional[int] = Field(default=None, primary_key=True)
    project_name: str
    project_objective: Optional[str]
    client_requirements: Optional[str]
    budget: Optional[float]
    start_date: Optional[date]
    end_date: Optional[date]
    skills_required: Optional[str]
    status: str = Field(default="Active")
    created_at: datetime = Field(default_factory=datetime.now)

    # Relationships
    assignments: List[EmployeeProjectAssignment] = Relationship(back_populates="project")
    status_logs: List[ProjectStatusLog] = Relationship(back_populates="project")

# Link back relationships
EmployeeProjectAssignment.project = Relationship(back_populates="assignments")
ProjectStatusLog.project = Relationship(back_populates="status_logs")
