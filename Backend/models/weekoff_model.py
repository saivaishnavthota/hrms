from sqlmodel import SQLModel, Field
from typing import Optional, List
from datetime import date
from sqlalchemy.dialects.postgresql import ARRAY


class Weekoff(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    employee_id: int = Field(foreign_key="employee.id")  
    week_start: date
    week_end: date
    off_days: List[str] = Field(sa_column_kwargs={"type_": ARRAY(str)})
