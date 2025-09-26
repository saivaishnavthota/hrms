from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime, date
from .user_model import User

class AttendanceProject(SQLModel, table=True):
    __tablename__ = "attendance_projects"

    attendance_project_id: Optional[int] = Field(default=None, primary_key=True)
    attendance_id: int = Field(foreign_key="attendance.id")
    project_id: int = Field(foreign_key="projects.project_id")
    sub_task: Optional[str]

class Attendance(SQLModel, table=True):
    __tablename__ = "attendance"

    id: Optional[int] = Field(default=None, primary_key=True)
    employee_id: int = Field(foreign_key="employees.id")
    date: date
    day: Optional[str]
    action: Optional[str]
    status: Optional[str]
    hours: Optional[int]
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    # Relationships
    employee: Optional[User] = Relationship(back_populates="attendances")
    attendance_projects: List[AttendanceProject] = Relationship(back_populates="attendance")

# Link back relationships
AttendanceProject.attendance = Relationship(back_populates="attendance_projects")
