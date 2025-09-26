from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, text, select
from database import get_session
from schemas.attendance_schema import AttendanceCreate, AttendanceResponse
from typing import Dict, List, Optional
from datetime import date, datetime, timedelta
from auth import get_current_user
from models.user_model import User
from models.attendance_model import Attendance
from sqlalchemy import func
from datetime import date

router = APIRouter(tags=["Attendance"])

@router.post("/attendance")
async def save_attendance(
    data: Dict[str, AttendanceCreate],
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    
    VALID_ACTIONS = ["Present", "WFH", "Leave"]
    try:

        employee_id = current_user.id 

        for date_str, entry in data.items():
            if entry.action not in VALID_ACTIONS:
                continue
            session.execute(
                text("""
                    SELECT save_attendance(
                        :employee_id,
                        :date,
                        :action,
                        :hours,
                        :project_name,
                        :sub_task
                    )
                """),
                {
                    "employee_id": employee_id,
                    "date": entry.date,
                    "action": entry.action,
                    "hours": entry.hours,
                    "project_name": entry.project_name,
                    "sub_task": entry.sub_task
                }
            )

        session.commit()
        return {"success": True, "message": "Attendance submitted successfully"}

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/get_attendance", response_model=List[AttendanceResponse])
async def get_attendance(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    records = session.exec(
        select(Attendance).where(Attendance.employee_id == current_user.id)
    ).all()
    return records


@router.get("/attendance/daily")
async def get_daily_attendance(
    year: int = Query(..., description="Year filter"),
    month: Optional[int] = Query(None, description="Month filter"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    try:
        query = select(Attendance).where(Attendance.employee_id == current_user.id)
        query = query.where(func.extract("year", Attendance.date) == year)

        if month:
            query = query.where(func.extract("month", Attendance.date) == month)

        records = session.exec(query).all()

        formatted = [
            {
                "date": r.date,
                "action": r.action,
                "hours": r.hours,
                "project": r.project_name,  
                "subTask": r.sub_task       
            }
            for r in records
        ]

        return formatted

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/attendance/summary/{employee_id}")
async def get_monthly_summary(
    employee_id: int,
    session: Session = Depends(get_session)
):
    try:
        now = datetime.now()
        month_start = now.replace(day=1).date()

        result = session.execute(
            text("""
                SELECT 
                    COUNT(*) FILTER (WHERE action = 'Present') AS present_count,
                    COUNT(*) FILTER (WHERE action = 'WFH') AS wfh_count,
                    COUNT(*) FILTER (WHERE action = 'Leave') AS leave_count
                FROM attendance
                WHERE employee_id = :employee_id
                  AND date >= :month_start
                  AND date <= :month_end
            """),
            {
                "employee_id": employee_id,
                "month_start": month_start,
                "month_end": now.date()
            }
        ).fetchone()

        return {
            "month": now.strftime("%B %Y"),
            "present": result.present_count or 0,
            "wfh": result.wfh_count or 0,
            "leave": result.leave_count or 0
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/attendance/hr-assigned")
async def get_assigned_hr_employees_summary(
    month: int = None,
    year: int = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    try:
        if month and year:
            month_start = date(year, month, 1)
            if month == 12:
                month_end = date(year + 1, 1, 1)
            else:
                month_end = date(year, month + 1, 1)
        else:
            month_start = date(1900, 1, 1)
            month_end = datetime.now().date() + timedelta(days=1)

        query = text("""
                    SELECT 
                        u.id AS employee_id,
                        u.name,
                        u.email,
                    COUNT(*) FILTER (WHERE a.action='Present') AS present,
                    COUNT(*) FILTER (WHERE a.action='WFH') AS wfh,
                    COUNT(*) FILTER (WHERE a.action='Leave') AS leave
                    FROM employees u
                    JOIN employee_master em
                        ON em.emp_id = u.id
                        AND (:hr_id = em.hr1_id OR :hr_id = em.hr2_id)
                    LEFT JOIN attendance a 
                        ON u.id = a.employee_id
                        AND a.date >= :month_start 
                        AND a.date < :month_end
                    GROUP BY u.id, u.name, u.email
                    ORDER BY u.name
                """)

        result = session.execute(
            query,
            {
                "month_start": month_start,
                "month_end": month_end,
                "hr_id": current_user.id
            }
        ).all()


        employees_summary = [
            {
                "employee_id": r.employee_id,
                "name": r.name,
                "email": r.email,
                # "department": r.department,
                "present": r.present or 0,
                "wfh": r.wfh or 0,
                "leave": r.leave or 0
            }
            for r in result
        ]

        return employees_summary

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/attendance/mgr-assigned")
async def get_assigned_mgr_employees_summary(
    month: int = None,
    year: int = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    try:
        if month and year:
            month_start = date(year, month, 1)
            if month == 12:
                month_end = date(year + 1, 1, 1)
            else:
                month_end = date(year, month + 1, 1)
        else:
            month_start = date(1900, 1, 1)
            month_end = datetime.now().date() + timedelta(days=1)

        query = text("""
                    SELECT 
                        u.id AS employee_id,
                        u.name,
                        u.email,
                    COUNT(*) FILTER (WHERE a.action='Present') AS present,
                    COUNT(*) FILTER (WHERE a.action='WFH') AS wfh,
                    COUNT(*) FILTER (WHERE a.action='Leave') AS leave
                    FROM employees u
                    JOIN employee_master em
                        ON em.emp_id = u.id
                        AND (:mgr_id = em.manager1_id OR :mgr_id = em.manager2_id OR :mgr_id = em.manager3_id)
                    LEFT JOIN attendance a 
                        ON u.id = a.employee_id
                        AND a.date >= :month_start 
                        AND a.date < :month_end
                    GROUP BY u.id, u.name, u.email
                    ORDER BY u.name
                """)

        result = session.execute(
            query,
            {
                "month_start": month_start,
                "month_end": month_end,
                "mgr_id": current_user.id
            }
        ).all()


        employees_summary = [
            {
                "employee_id": r.employee_id,
                "name": r.name,
                "email": r.email,
                # "department": r.department,
                "present": r.present or 0,
                "wfh": r.wfh or 0,
                "leave": r.leave or 0
            }
            for r in result
        ]

        return employees_summary

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
