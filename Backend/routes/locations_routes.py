from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_session
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/locations", tags=["Locations"])

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
