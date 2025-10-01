from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_session
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/locations", tags=["Locations"])

class LocationCreate(BaseModel):
    name: str

@router.get("/")
async def get_locations(session: Session = Depends(get_session)):
    try:
        with session.connection().connection.cursor() as cur:
            cur.execute("SELECT id, name FROM locations ORDER BY name ASC")
            rows = cur.fetchall()

        locations = [{"id": row[0], "name": row[1]} for row in rows]

        return {
            "status": "success",
            "data": locations
        }

    except Exception as e:
        logger.error(f"Error fetching locations: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching locations: {str(e)}"
        )

@router.post("/")
async def add_location(location: LocationCreate, session: Session = Depends(get_session)):
    try:
        with session.connection().connection.cursor() as cur:
            cur.execute(
                "INSERT INTO locations (name) VALUES (%s) RETURNING id, name",
                (location.name,)
            )
            result = cur.fetchone()
            session.commit()

        new_location = {"id": result[0], "name": result[1]}

        return {
            "status": "success",
            "message": "Location added successfully",
            "data": new_location
        }

    except Exception as e:
        session.rollback()
        logger.error(f"Error adding location: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error adding location: {str(e)}"
        )
