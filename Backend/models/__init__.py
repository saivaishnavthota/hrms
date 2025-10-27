# Import base models first (models with fewer dependencies)
from .user_model import User
from .projects_model import Project, ProjectStatusLog, EmployeeProjectAssignment

# Then import dependent models
from .attendance_model import Attendance, AttendanceProject
from .project_allocation_model import ProjectAllocation

# Export all models
__all__ = [
    "User",
    "Project",
    "ProjectStatusLog", 
    "EmployeeProjectAssignment",
    "Attendance",
    "AttendanceProject",
    "ProjectAllocation"
]
