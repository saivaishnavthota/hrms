from sqlmodel import SQLModel,Field
from datetime import date

class HolidayCreate(SQLModel):
    location_id: int
    holiday_date: str
    holiday_name: str

class MasterCalendar(SQLModel, table=True):
    __tablename__ = "master_calendar"

    id: int = Field(default=None, primary_key=True)
    location_id: int
    holiday_date: date
    holiday_name: str