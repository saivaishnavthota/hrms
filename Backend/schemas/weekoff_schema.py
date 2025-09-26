from typing import List, Optional
from datetime import date
from sqlmodel import SQLModel
from pydantic import validator

class WeekoffBase(SQLModel):
    week_start: date
    week_end: date
    off_days: List[str]

    @validator("off_days")
    def check_off_days(cls, v):
        if len(v) > 2: 
            raise ValueError("off_days must have at most 2 items")
        return v

class WeekoffCreate(WeekoffBase):
    employee_id: int

class WeekoffRead(WeekoffBase):
    id: Optional[int]
    employee_id: int

    class Config:
        orm_mode = True
