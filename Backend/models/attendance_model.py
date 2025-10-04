from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime, date
from zoneinfo import ZoneInfo
from .user_model import User
 
class AttendanceProject(SQLModel, table=True):
    __tablename__ = "attendance_projects"
 
    attendance_project_id: Optional[int] = Field(default=None, primary_key=True)
    attendance_id: int = Field(foreign_key="attendance.id")
    project_id: int = Field(foreign_key="projects.project_id")
    sub_task: Optional[str]
    hours: Optional[float]  # Changed from int to float
 
    # Relationships
    attendance: Optional["Attendance"] = Relationship(back_populates="attendance_projects")
 
class Attendance(SQLModel, table=True):
    __tablename__ = "attendance"
 
    id: Optional[int] = Field(default=None, primary_key=True)
    employee_id: int = Field(foreign_key="employees.id")
    date: date
    day: Optional[str]
    action: Optional[str]
    status: Optional[str]
    hours: Optional[float]  # Changed from int to float
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=ZoneInfo("Asia/Kolkata")))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(tz=ZoneInfo("Asia/Kolkata")))
 
    # Relationships
    employee: Optional[User] = Relationship(back_populates="attendances")
    attendance_projects: List[AttendanceProject] = Relationship(back_populates="attendance")
 
# Link back relationships
AttendanceProject.attendance = Relationship(back_populates="attendance_projects")