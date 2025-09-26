from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlmodel import select
from typing import Dict, List
from dependencies import get_session
from auth import get_current_user
from models.user_model import User
from models.employee_assignment_model import EmployeeManager, EmployeeHR
from datetime import datetime
from schemas.attendance_schema import AttendanceCreate, AttendanceBase
from datetime import timedelta, date

router = APIRouter(prefix="/attendance", tags=["Attendance"])

VALID_ACTIONS = ["Present", "WFH", "Leave"]

# Employee fetch active assigned projects
from typing import List, Optional
from fastapi import Query

@router.get("/active-projects", response_model=List[dict])
def get_active_projects(
    manager_id: Optional[int] = Query(None),
    employee_id: Optional[int] = Query(None),
    hr_id: Optional[int] = Query(None),
    session: Session = Depends(get_session)
):
    user_id = employee_id or manager_id or hr_id
    if not user_id:
        raise HTTPException(status_code=400, detail="employee_id, manager_id, or hr_id is required")

    query = text("""
        SELECT p.project_id, p.project_name
        FROM projects p
        JOIN employee_project_assignments epa
        ON p.project_id = epa.project_id
        WHERE epa.employee_id = :user_id
        AND p.status = 'Active'
        ORDER BY p.created_at DESC
    """)

    projects = session.execute(query, {"user_id": user_id}).fetchall()

    return [
        {"project_id": p._mapping["project_id"], "project_name": p._mapping["project_name"]}
        for p in projects
    ]


# Save Attendance with projects & subtasks
@router.post("/")
async def save_attendance(
    data: Dict[str, AttendanceCreate],
    employee_id: int = Query(None),
    manager_id: int = Query(None),
    hr_id: int = Query(None),
    session: Session = Depends(get_session)
):
    # Determine the ID to use
    user_id = employee_id or manager_id or hr_id
    if not user_id:
        raise HTTPException(status_code=400, detail="employee_id, manager_id, or hr_id is required")

    try:
        for date_str, entry in data.items():
            if (not entry.action or entry.action.strip() == "") and \
               (not entry.hours or entry.hours == 0) and \
               (not entry.project_ids or len(entry.project_ids) == 0):
                session.execute(
                    text("DELETE FROM attendance WHERE employee_id = :emp_id AND date = :date"),
                    {"emp_id": user_id, "date": entry.date}
                )
                continue  # skip save_attendance
            
            if entry.action not in VALID_ACTIONS:
                continue

            project_ids = entry.project_ids or []
            sub_tasks = entry.sub_tasks or []
            # if len(project_ids) != len(sub_tasks):
            #     raise HTTPException(
            #         status_code=400,
            #         detail=f"project_ids and sub_tasks length mismatch for date {entry.date}"
            #     )

            session.execute(
                text("""SELECT save_attendance(
                    :employee_id,
                    :date,
                    :action,
                    :hours,
                    :project_ids,
                    :sub_tasks
                )"""),
                {
                    "employee_id": user_id,
                    "date": entry.date,
                    "action": entry.action,
                    "hours": entry.hours,
                    "project_ids": project_ids,
                    "sub_tasks": sub_tasks
                }
            )

        session.commit()
        return {"success": True, "message": "Attendance submitted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/weekly")
def get_weekly_attendance(
    employee_id: int = Query(None),
    manager_id: int = Query(None),
    hr_id: int = Query(None),
    session: Session = Depends(get_session),
):
    user_id = employee_id or manager_id or hr_id
    if not user_id:
        raise HTTPException(status_code=400, detail="employee_id, manager_id, or hr_id is required")

    today = date.today()
    monday = today - timedelta(days=today.weekday())
    sunday = monday + timedelta(days=6)

    query = text("""
        SELECT a.id as attendance_id, a.date, a.action, a.status, a.hours,
               p.project_name, ap.sub_task
        FROM attendance a
        LEFT JOIN attendance_projects ap ON a.id = ap.attendance_id
        LEFT JOIN projects p ON ap.project_id = p.project_id
        WHERE a.employee_id = :emp_id
        AND a.date BETWEEN :monday AND :sunday
        ORDER BY a.date, p.project_name
    """)

    result = session.execute(query, {"emp_id": user_id, "monday": monday, "sunday": sunday}).fetchall()
    # same processing as before...
    attendance = {}
    for row in result:
        key = str(row.date)
        if key not in attendance:
            attendance[key] = {"action": row.action, "hours": row.hours, "status": row.action, "projects": [], "subTasks": []}
        if row.project_name:
            attendance[key]["projects"].append({"value": row.project_name, "label": row.project_name})
        if row.sub_task:
            attendance[key]["subTasks"].append({"project": row.project_name, "subTask": row.sub_task})

    return attendance



from collections import defaultdict


@router.get("/daily")
def get_daily_attendance(
    year: int,
    month: int,
    employee_id: int = Query(None),
    manager_id: int = Query(None),
    hr_id: int = Query(None),
    session: Session = Depends(get_session)
):
    employee_ids = []

    if employee_id:
        # Fetch only this employee
        employee_ids = [employee_id]

    elif manager_id:
        # Fetch employees reporting to this manager
        mgr_employees = session.exec(
            select(EmployeeManager.employee_id).where(EmployeeManager.manager_id == manager_id)
        ).all()
        employee_ids = [e[0] if isinstance(e, tuple) else e for e in mgr_employees]

    elif hr_id:
        # Fetch managers assigned to this HR
        hr_managers = session.exec(
            select(EmployeeHR.manager_id).where(EmployeeHR.hr_id == hr_id)
        ).all()
        manager_ids = [m[0] if isinstance(m, tuple) else m for m in hr_managers]

        # Fetch employees reporting to those managers
        if manager_ids:
            mgr_employees = session.exec(
                select(EmployeeManager.employee_id).where(EmployeeManager.manager_id.in_(manager_ids))
            ).all()
            employee_ids = [e[0] if isinstance(e, tuple) else e for e in mgr_employees]

        # Include managers themselves
        employee_ids.extend(manager_ids)

    else:
        raise HTTPException(status_code=400, detail="employee_id, manager_id, or hr_id must be provided")

    if not employee_ids:
        return []

    # Fetch attendance for selected employees
    query = text("""
        SELECT 
            u.id as employee_id,
            u.name,
            u.company_email,
            a.id as attendance_id, 
            a.date, 
            a.action, 
            a.status, 
            a.hours,
            p.project_name, 
            ap.sub_task
        FROM employees u
        LEFT JOIN attendance a ON u.id = a.employee_id
            AND EXTRACT(YEAR FROM a.date) = :year
            AND EXTRACT(MONTH FROM a.date) = :month
        LEFT JOIN attendance_projects ap ON a.id = ap.attendance_id
        LEFT JOIN projects p ON ap.project_id = p.project_id
        WHERE u.id = ANY(:employee_ids)
        ORDER BY u.name, a.date, p.project_name
    """)

    result = session.execute(
        query,
        {"employee_ids": employee_ids, "year": year, "month": month}
    ).fetchall()

    attendance_list = []

    for row in result:
        if not row.date:
        # Skip rows with no attendance
            continue

        att = {
        "employee_id": row.employee_id,
        "name": row.name,
        "email": row.company_email,
        "date": str(row.date),
        "day": row.date.strftime("%A"),
        "status": row.action,
        "hours": row.hours,
        "projects": [],
        "subTasks": []
    }

        if row.project_name:
            att["projects"].append({"label": row.project_name, "value": row.project_name})

        if row.sub_task:
            att["subTasks"].append({"project": row.project_name, "subTask": row.sub_task})

        attendance_list.append(att)

    return attendance_list

@router.get("/mgr-assigned")
async def get_assigned_mgr_employees_summary(
    month: int = None,
    year: int = None,
    manager_id: int = Query(None),
    employee_id: int = Query(None),
    session: Session = Depends(get_session)
):
    try:
        # Determine date range
        if month and year:
            month_start = date(year, month, 1)
            if month == 12:
                month_end = date(year + 1, 1, 1)
            else:
                month_end = date(year, month + 1, 1)
        else:
            month_start = date(1900, 1, 1)
            month_end = datetime.now().date() + timedelta(days=1)

        # If manager_id is provided, get their employees
        if manager_id:
            employee_ids = session.exec(
                select(EmployeeManager.employee_id).where(EmployeeManager.manager_id == manager_id)
            ).all()
            employee_ids = [e[0] if isinstance(e, tuple) else e for e in employee_ids]
        elif employee_id:
            employee_ids = [employee_id]
        else:
            raise HTTPException(status_code=400, detail="manager_id or employee_id must be provided")

        if not employee_ids:
            return []

        # Fetch attendance summary
        query = text("""
            SELECT u.id AS employee_id, u.name, u.company_email,
                   COUNT(*) FILTER (WHERE a.action='Present') AS present,
                   COUNT(*) FILTER (WHERE a.action='WFH') AS wfh,
                   COUNT(*) FILTER (WHERE a.action='Leave') AS leave
            FROM employees u
            LEFT JOIN attendance a ON u.id = a.employee_id
            AND a.date >= :month_start AND a.date < :month_end
            WHERE u.id = ANY(:employee_ids)
            GROUP BY u.id, u.name, u.company_email
            ORDER BY u.name
        """)

        result = session.execute(
            query,
            {
                "month_start": month_start,
                "month_end": month_end,
                "employee_ids": employee_ids
            }
        ).all()

        employees_summary = [
            {
                "employee_id": r.employee_id,
                "name": r.name,
                "email": r.company_email,
                "present": r.present or 0,
                "wfh": r.wfh or 0,
                "leave": r.leave or 0
            }
            for r in result
        ]

        return employees_summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/hr-assigned")
async def get_assigned_hr_employees_summary(
    hr_id: int = Query(..., description="HR ID to fetch assigned employees for"),
    month: int = None,
    year: int = None,
    session: Session = Depends(get_session),
):
    try:
        # Determine month range
        if month and year:
            month_start = date(year, month, 1)
            month_end = date(year + (month // 12), (month % 12) + 1, 1)
        else:
            month_start = date(1900, 1, 1)
            month_end = datetime.now().date() + timedelta(days=1)

        # Fetch employees assigned to this HR
        employee_ids = session.exec(
            select(EmployeeHR.employee_id).where(EmployeeHR.hr_id == hr_id)
        ).all()

        # flatten list
        employee_ids = [e[0] if isinstance(e, tuple) else e for e in employee_ids]

        if not employee_ids:
            return []

        query = text("""
            SELECT 
                u.id AS employee_id,
                u.name,
                u.company_email,
                COUNT(*) FILTER (WHERE a.action='Present') AS present,
                COUNT(*) FILTER (WHERE a.action='WFH') AS wfh,
                COUNT(*) FILTER (WHERE a.action='Leave') AS leave
            FROM employees u
            LEFT JOIN attendance a 
                ON u.id = a.employee_id
                AND a.date >= :month_start 
                AND a.date < :month_end
            WHERE u.id = ANY(:employee_ids)
            GROUP BY u.id, u.name, u.company_email
            ORDER BY u.name
        """)

        result = session.execute(
            query,
            {
                "month_start": month_start,
                "month_end": month_end,
                "employee_ids": employee_ids
            }
        ).all()

        employees_summary = [
            {
                "employee_id": r.employee_id,
                "name": r.name,
                "email": r.company_email,
                "present": r.present or 0,
                "wfh": r.wfh or 0,
                "leave": r.leave or 0
            }
            for r in result
        ]

        return employees_summary

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




@router.get("/hr-daily")
def get_daily_attendance(
    year: int,
    month: int,
    employee_id: int = Query(None),
    manager_id: int = Query(None),
    hr_id: int = Query(None),
    session: Session = Depends(get_session)
):
    employee_ids = []

    # If employee_id is provided
    if employee_id:
        employee_ids = [employee_id]

    # If manager_id is provided
    elif manager_id:
        mgr_employees = session.exec(
            select(EmployeeManager.employee_id).where(EmployeeManager.manager_id == manager_id)
        ).all()
        employee_ids = [e[0] if isinstance(e, tuple) else e for e in mgr_employees]

    # If hr_id is provided
    elif hr_id:
        hr_managers = session.exec(
            select(EmployeeHR.employee_id).where(EmployeeHR.hr_id == hr_id)
        ).all()
        manager_ids = [m[0] if isinstance(m, tuple) else m for m in hr_managers]

        # Employees under those managers
        if manager_ids:
            mgr_employees = session.exec(
                select(EmployeeManager.employee_id).where(EmployeeManager.manager_id.in_(manager_ids))
            ).all()
            employee_ids = [e[0] if isinstance(e, tuple) else e for e in mgr_employees]

        # Include the managers themselves
        employee_ids.extend(manager_ids)

    else:
        raise HTTPException(status_code=400, detail="employee_id, manager_id, or hr_id must be provided")

    if not employee_ids:
        return []

    # Fetch attendance with projects and subtasks
    query = text("""
        SELECT 
            u.id AS employee_id,
            u.name,
            u.company_email,
            u.role,
            a.id AS attendance_id,
            a.date,
            a.action,
            a.status,
            a.hours,
            p.project_name,
            ap.sub_task
        FROM employees u
        LEFT JOIN attendance a ON u.id = a.employee_id
            AND EXTRACT(YEAR FROM a.date) = :year
            AND EXTRACT(MONTH FROM a.date) = :month
        LEFT JOIN attendance_projects ap ON a.id = ap.attendance_id
        LEFT JOIN projects p ON ap.project_id = p.project_id
        WHERE u.id = ANY(:employee_ids)
        ORDER BY u.name, a.date, p.project_name
    """)

    result = session.execute(
        query,
        {"employee_ids": employee_ids, "year": year, "month": month}
    ).fetchall()

    # Aggregate projects and subtasks
    attendance_dict = {}
    for row in result:
        if not row.date:
            continue  # skip if no attendance

        key = (row.employee_id, row.date)
        if key not in attendance_dict:
            attendance_dict[key] = {
                "employee_id": row.employee_id,
                "name": row.name,
                "email": row.company_email,
                "type": row.role or "Employee",
                "date": str(row.date),
                "day": row.date.strftime("%A"),
                "status": row.action,
                "hours": row.hours,
                "projects": [],
                "subTasks": []
            }

        if row.project_name:
            attendance_dict[key]["projects"].append({
                "label": row.project_name,
                "value": row.project_name
            })

        if row.sub_task:
            attendance_dict[key]["subTasks"].append({
                "project": row.project_name,
                "subTask": row.sub_task
            })

    attendance_list = list(attendance_dict.values())
    return attendance_list
