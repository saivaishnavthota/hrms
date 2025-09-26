from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_session
import logging
from sqlmodel import Session, select

from schemas.calendar_schema import HolidayCreate,MasterCalendar

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/calendar", tags=["calendar"])

@router.post("/add")
async def add_holiday( 
    holiday: HolidayCreate,
    session: Session = Depends(get_session)):
    try:
        with session.connection().connection.cursor() as cur:
            cur.execute(
                """
                INSERT INTO master_calendar (location_id, holiday_date, holiday_name)
                VALUES (%s, %s, %s)
                ON CONFLICT (location_id, holiday_date) DO NOTHING
                """,
                (holiday.location_id, holiday.holiday_date, holiday.holiday_name)
            )
        session.commit()
        return {"status": "success", "message": "Holiday added"}
    except Exception as e:
        session.rollback()
        logger.error(f"Error adding holiday: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error adding holiday: {str(e)}")


@router.get("/")
async def get_holidays(location_id: int = None, session: Session = Depends(get_session)):
    try:
        query = "SELECT id, location_id, holiday_date, holiday_name FROM master_calendar"
        params = []
        if location_id:
            query += " WHERE location_id = %s"
            params.append(location_id)

        with session.connection().connection.cursor() as cur:
            cur.execute(query, params)
            rows = cur.fetchall()

        holidays = [
            {"id": row[0], "location_id": row[1], "holiday_date": str(row[2]), "holiday_name": row[3]}
            for row in rows
        ]
        return {"status": "success", "data": holidays}
    except Exception as e:
        logger.error(f"Error fetching holidays: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching holidays: {str(e)}")



@router.delete("/{holiday_id}")
async def delete_holiday(holiday_id: int, session: Session = Depends(get_session)):
    try:
        with session.connection().connection.cursor() as cur:
            cur.execute("DELETE FROM master_calendar WHERE id = %s", (holiday_id,))
        session.commit()
        return {"status": "success", "message": "Holiday deleted"}
    except Exception as e:
        session.rollback()
        logger.error(f"Error deleting holiday: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting holiday: {str(e)}")

@router.get("/by-location/{location_id}")
async def get_holidays_by_location(location_id: int, session: Session = Depends(get_session)):
    """
    Get holidays only for a given location_id.
    """
    try:
        query = select(MasterCalendar).where(MasterCalendar.location_id == location_id)
        holidays = session.exec(query).all()

        if not holidays:
            return {"status": "success", "data": []}

        return {
            "status": "success",
            "data": [
                {
                    "id": h.id,
                    "location_id": h.location_id,
                    "holiday_date": str(h.holiday_date),
                    "holiday_name": h.holiday_name,
                }
                for h in holidays
            ],
        }

    except Exception as e:
        logger.error(f"Error fetching holidays for location {location_id}: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error fetching holidays for location {location_id}: {str(e)}"
        )
