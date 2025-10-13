from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from sqlalchemy import text
from database import get_session
from schemas.weekoff_schema import WeekoffCreate, WeekoffRead
from datetime import date, timedelta

router = APIRouter(prefix="/weekoffs", tags=["Weekoffs"])

def set_default_weekoffs(employee_id: int, session: Session):
    """
    Set default weekoffs (Saturday and Sunday) for an employee for the current year
    """
    try:
        current_year = date.today().year
        # Start from January 1st of current year
        start_date = date(current_year, 1, 1)
        
        # Generate weekoffs for the entire year
        current_date = start_date
        while current_date.year == current_year:
            # Find the start of the week (Monday)
            days_since_monday = current_date.weekday()
            week_start = current_date - timedelta(days=days_since_monday)
            week_end = week_start + timedelta(days=6)
            
            # Set default weekoffs as Saturday and Sunday
            default_off_days = ["Saturday", "Sunday"]
            
            # Check if weekoff already exists for this week
            existing = session.execute(
                text("SELECT id FROM weekoffs WHERE employee_id = :emp_id AND week_start = :start"),
                {"emp_id": employee_id, "start": week_start}
            ).fetchone()
            
            if not existing:
                # Insert default weekoff
                session.execute(
                    text("SELECT save_weekoffs(:emp_id, :start, :end, :days)"),
                    {
                        "emp_id": employee_id,
                        "start": week_start,
                        "end": week_end,
                        "days": default_off_days
                    }
                )
            
            # Move to next week
            current_date = week_end + timedelta(days=1)
        
        session.commit()
        print(f"✅ Default weekoffs set for employee {employee_id}")
        return True
    except Exception as e:
        print(f"❌ Error setting default weekoffs: {str(e)}")
        session.rollback()
        return False

@router.post("", response_model=WeekoffRead)
@router.post("/", response_model=WeekoffRead)
def set_weekoffs(weekoff: WeekoffCreate, session: Session = Depends(get_session)):
    print("=" * 80)
    print("🚀 WEEKOFF SAVE ROUTE CALLED")
    print(f"👤 Employee ID: {weekoff.employee_id}")
    print(f"📅 Week Start: {weekoff.week_start}")
    print(f"📅 Week End: {weekoff.week_end}")
    print(f"🏖️ Off Days: {weekoff.off_days}")
    print("=" * 80)
    
    # allow 0, 1, or 2 weekoffs
    if len(weekoff.off_days) > 2:
        print("❌ Too many weekoff days")
        raise HTTPException(status_code=400, detail="Employee can have at most 2 weekoffs")

    try:
        print("🔄 Calling save_weekoffs function...")
        # Call PostgreSQL function
        session.execute(
            text("SELECT save_weekoffs(:emp_id, :start, :end, :days)"),
            {
                "emp_id": weekoff.employee_id,
                "start": weekoff.week_start,
                "end": weekoff.week_end,
                "days": weekoff.off_days
            }
        )
        session.commit()
        print("✅ Weekoff function called successfully")

        # Fetch the inserted/updated row id
        print("🔍 Fetching inserted weekoff record...")
        result = session.execute(
            text("""
                SELECT id FROM weekoffs 
                WHERE employee_id = :emp_id AND week_start = :start AND week_end = :end
            """),
            {
                "emp_id": weekoff.employee_id,
                "start": weekoff.week_start,
                "end": weekoff.week_end
            }
        ).fetchone()

        weekoff_id = result[0] if result else None
        print(f"✅ Weekoff ID: {weekoff_id}")
        print("=" * 80)

        return WeekoffRead(
            id=weekoff_id,
            employee_id=weekoff.employee_id,
            week_start=weekoff.week_start,
            week_end=weekoff.week_end,
            off_days=weekoff.off_days
        )
    except Exception as e:
        print(f"❌ Error saving weekoff: {str(e)}")
        print("=" * 80)
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Error saving weekoff: {str(e)}")


@router.get("/{employee_id}", response_model=list[WeekoffRead])
def get_weekoffs(employee_id: int, session: Session = Depends(get_session)):
    print("=" * 80)
    print("🔍 GET WEEKOFF ROUTE CALLED")
    print(f"👤 Employee ID: {employee_id}")
    
    try:
        # Fetch weekoffs for employee
        result = session.execute(
            text("SELECT * FROM weekoffs WHERE employee_id = :emp_id"),
            {"emp_id": employee_id}
        ).all()
        
        print(f"📊 Found {len(result)} weekoff records")
        print("=" * 80)

        # Convert results to Pydantic schema
        return [
            WeekoffRead(
                id=row.id,
                employee_id=row.employee_id,
                week_start=row.week_start,
                week_end=row.week_end,
                off_days=row.off_days
            ) for row in result
        ]
    except Exception as e:
        print(f"❌ Error fetching weekoffs: {str(e)}")
        print("=" * 80)
        raise HTTPException(status_code=500, detail=f"Error fetching weekoffs: {str(e)}")


@router.post("/{employee_id}/set-default")
def set_default_weekoffs_endpoint(employee_id: int, session: Session = Depends(get_session)):
    """
    Set default weekoffs (Saturday and Sunday) for an employee
    """
    try:
        success = set_default_weekoffs(employee_id, session)
        if success:
            return {"message": "Default weekoffs set successfully", "status": "success"}
        else:
            raise HTTPException(status_code=500, detail="Failed to set default weekoffs")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error setting default weekoffs: {str(e)}")


@router.get("/{employee_id}/default")
def get_default_weekoffs(employee_id: int, session: Session = Depends(get_session)):
    """
    Get default weekoffs for an employee (Saturday and Sunday)
    """
    try:
        # Return the default weekoff configuration
        default_weekoffs = {
            "employee_id": employee_id,
            "default_off_days": ["Saturday", "Sunday"],
            "description": "Default weekoffs are Saturday and Sunday. Employees can modify these as needed."
        }
        return default_weekoffs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting default weekoffs: {str(e)}")
