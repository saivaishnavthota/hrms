from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlmodel import select
from typing import Dict, List, Optional
from dependencies import get_session
from auth import get_current_user
from models.user_model import User
from models.employee_assignment_model import EmployeeManager, EmployeeHR
from datetime import datetime, date, timedelta
from schemas.attendance_schema import AttendanceCreate, AttendanceBase, AttendanceResponse
import json
 
router = APIRouter(prefix="/attendance", tags=["Attendance"])
 
VALID_ACTIONS = ["Present", "WFH", "Leave"]
 
# Employee fetch active assigned projects
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
 
@router.post("/", response_model=dict)
async def save_attendance(
    data: Dict[str, AttendanceCreate],
    employee_id: int = Query(None),
    manager_id: int = Query(None),
    hr_id: int = Query(None),
    session: Session = Depends(get_session)
):
    user_id = employee_id or manager_id or hr_id
    if not user_id:
        raise HTTPException(status_code=400, detail="employee_id, manager_id, or hr_id is required")
 
    try:
        for date_str, entry in data.items():
            if (not entry.action or entry.action.strip() == "") and \
               (not entry.project_ids or len(entry.project_ids) == 0) and \
               (not entry.sub_tasks or len(entry.sub_tasks) == 0):
                continue
 
            if entry.action not in VALID_ACTIONS:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid action '{entry.action}' for date {entry.date}. Valid actions: {VALID_ACTIONS}"
                )
 
            project_ids = entry.project_ids or []
            sub_tasks = entry.sub_tasks or []
 
            # Calculate total hours from subtask hours (using float)
            total_hours = sum(float(st.hours) for st in sub_tasks if st.hours is not None) if sub_tasks else 0.0
            print(f"Calculated total_hours for {entry.date}: {total_hours}")  # Debug log
 
            for st in sub_tasks:
                if st.hours < 0:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Negative hours ({st.hours}) for sub_task '{st.sub_task}' on date {entry.date}"
                    )
                result = session.execute(
                    text("""
                        SELECT 1
                        FROM employee_project_assignments
                        WHERE employee_id = :user_id AND project_id = :project_id
                    """),
                    {"user_id": user_id, "project_id": st.project_id}
                ).fetchone()
                if not result:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid project_id {st.project_id} for employee {user_id} on date {entry.date}"
                    )
 
            sub_tasks_json = [
                {"project_id": st.project_id, "sub_task": st.sub_task, "hours": float(st.hours)}
                for st in sub_tasks
            ]
 
            result = session.execute(
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
                    "hours": round(float(total_hours), 2),  # Ensure float and precision
                    "project_ids": project_ids,
                    "sub_tasks": json.dumps(sub_tasks_json)
                }
            ).fetchone()
 
            if result[0] != 'Attendance Saved Successfully':
                raise HTTPException(status_code=500, detail=result[0])
 
        session.commit()
        return {"success": True, "message": "Attendance submitted successfully"}
 
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
 
@router.get("/weekly", response_model=Dict[str, AttendanceResponse])
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
        SELECT
            a.id as attendance_id,
            a.date,
            a.action,
            a.status,
            a.hours as stored_hours,
            psh.project_id,
            psh.project_name,
            psh.sub_task,
            psh.hours as sub_task_hours,
            psh.total_project_hours
        FROM attendance a
        LEFT JOIN project_subtask_hours psh ON a.id = psh.attendance_id
        WHERE a.employee_id = :emp_id
        AND a.date BETWEEN :monday AND :sunday
        ORDER BY a.date, psh.project_name, psh.sub_task
    """)
 
    result = session.execute(query, {"emp_id": user_id, "monday": monday, "sunday": sunday}).fetchall()
 
    attendance = {}
    for row in result:
        key = str(row.date)
        if key not in attendance:
            attendance[key] = {
                "date": key,
                "action": row.action or "",
                "hours": 0.0,  # Initialize to 0.0, will be updated by subtask hours
                "status": row.action or "",
                "projects": [],
                "subTasks": []
            }
        
        if row.project_name and {"value": str(row.project_id), "label": row.project_name, "total_hours": float(row.total_project_hours or 0)} not in attendance[key]["projects"]:
            attendance[key]["projects"].append({
                "value": str(row.project_id),
                "label": row.project_name,
                "total_hours": float(row.total_project_hours or 0)
            })
        
        if row.sub_task and row.project_name:
            sub_task_entry = next((st for st in attendance[key]["subTasks"] if st["project"] == row.project_name), None)
            if sub_task_entry:
                if {"sub_task": row.sub_task, "hours": float(row.sub_task_hours)} not in sub_task_entry["subTasks"]:
                    sub_task_entry["subTasks"].append({
                        "sub_task": row.sub_task,
                        "hours": float(row.sub_task_hours)
                    })
            else:
                attendance[key]["subTasks"].append({
                    "project": row.project_name,
                    "subTasks": [{"sub_task": row.sub_task, "hours": float(row.sub_task_hours)}]
                })
 
        # Update total hours based on sum of sub_task_hours
        attendance[key]["hours"] = round(sum(
            float(st["hours"]) for sub_task in attendance[key]["subTasks"] for st in sub_task["subTasks"]
        ), 2)
 
    print(f"Weekly Attendance Response: {attendance}")  # Debug log
    return attendance
 
@router.get("/daily", response_model=List[dict])
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
        employee_ids = [employee_id]
    elif manager_id:
        mgr_employees = session.exec(
            select(EmployeeManager.employee_id).where(EmployeeManager.manager_id == manager_id)
        ).all()
        employee_ids = [e[0] if isinstance(e, tuple) else e for e in mgr_employees]
    elif hr_id:
        hr_managers = session.exec(
            select(EmployeeHR.manager_id).where(EmployeeHR.hr_id == hr_id)
        ).all()
        manager_ids = [m[0] if isinstance(m, tuple) else m for m in hr_managers]
        if manager_ids:
            mgr_employees = session.exec(
                select(EmployeeManager.employee_id).where(EmployeeManager.manager_id.in_(manager_ids))
            ).all()
            employee_ids = [e[0] if isinstance(e, tuple) else e for e in mgr_employees]
        employee_ids.extend(manager_ids)
    else:
        raise HTTPException(status_code=400, detail="employee_id, manager_id, or hr_id must be provided")
 
    if not employee_ids:
        return []
 
    query = text("""
        SELECT
            u.id as employee_id,
            u.name,
            u.company_email,
            a.id as attendance_id,
            a.date,
            a.action,
            a.status,
            a.hours as stored_hours,
            psh.project_id,
            psh.project_name,
            psh.sub_task,
            psh.hours as sub_task_hours,
            psh.total_project_hours
        FROM employees u
        LEFT JOIN attendance a ON u.id = a.employee_id
            AND EXTRACT(YEAR FROM a.date) = :year
            AND EXTRACT(MONTH FROM a.date) = :month
        LEFT JOIN project_subtask_hours psh ON a.id = psh.attendance_id
        WHERE u.id = ANY(:employee_ids)
        ORDER BY u.name, a.date, psh.project_name, psh.sub_task
    """)
 
    result = session.execute(
        query,
        {"employee_ids": employee_ids, "year": year, "month": month}
    ).fetchall()
 
    attendance_list = []
    attendance_by_employee_date = {}
 
    for row in result:
        if not row.date:
            continue
 
        key = (row.employee_id, str(row.date))
        if key not in attendance_by_employee_date:
            att = {
                "employee_id": row.employee_id,
                "name": row.name,
                "email": row.company_email,
                "date": str(row.date),
                "day": row.date.strftime("%A"),
                "status": row.action or row.status or "Not set",
                "hours": 0.0,  # Initialize to 0.0, will be updated by subtask hours
                "projects": [],
                "subTasks": []
            }
            attendance_by_employee_date[key] = att
            attendance_list.append(att)
 
        att = attendance_by_employee_date[key]
        if row.project_name and {"label": row.project_name, "value": str(row.project_id), "total_hours": float(row.total_project_hours or 0)} not in att["projects"]:
            att["projects"].append({
                "label": row.project_name,
                "value": str(row.project_id),
                "total_hours": float(row.total_project_hours or 0)
            })
        
        if row.sub_task and row.project_name:
            sub_task_entry = next((st for st in att["subTasks"] if st["project"] == row.project_name), None)
            if sub_task_entry:
                if {"sub_task": row.sub_task, "hours": float(row.sub_task_hours)} not in sub_task_entry["subTasks"]:
                    sub_task_entry["subTasks"].append({
                        "sub_task": row.sub_task,
                        "hours": float(row.sub_task_hours)
                    })
            else:
                att["subTasks"].append({
                    "project": row.project_name,
                    "subTasks": [{"sub_task": row.sub_task, "hours": float(row.sub_task_hours)}]
                })
 
        # Update total hours based on sum of sub_task_hours
        att["hours"] = round(sum(
            float(st["hours"]) for sub_task in att["subTasks"] for st in sub_task["subTasks"]
        ), 2)
 
    print(f"Daily Attendance Response: {attendance_list}")  # Debug log
    return attendance_list
 
@router.get("/hr-daily", response_model=List[dict])
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
        employee_ids = [employee_id]
    elif manager_id:
        mgr_employees = session.exec(
            select(EmployeeManager.employee_id).where(EmployeeManager.manager_id == manager_id)
        ).all()
        employee_ids = [e[0] if isinstance(e, tuple) else e for e in mgr_employees]
    elif hr_id:
        hr_employees = session.exec(
            select(EmployeeHR.employee_id).where(EmployeeHR.hr_id == hr_id)
        ).all()
        employee_ids = [e[0] if isinstance(e, tuple) else e for e in hr_employees]
    else:
        raise HTTPException(status_code=400, detail="employee_id, manager_id, or hr_id must be provided")
 
    if not employee_ids:
        return []
 
    query = text("""
        SELECT
            u.id AS employee_id,
            u.name,
            u.company_email,
            u.role,
            u.employment_type,
            a.id AS attendance_id,
            a.date,
            a.action,
            a.status,
            a.hours AS total_hours,
            psh.project_name,
            psh.sub_task,
            psh.hours AS sub_task_hours,
            psh.total_project_hours
        FROM employees u
        LEFT JOIN attendance a ON u.id = a.employee_id
            AND EXTRACT(YEAR FROM a.date) = :year
            AND EXTRACT(MONTH FROM a.date) = :month
        LEFT JOIN project_subtask_hours psh ON a.id = psh.attendance_id
        WHERE u.id = ANY(:employee_ids)
        ORDER BY u.name, a.date, psh.project_name, psh.sub_task
    """)
 
    result = session.execute(
        query,
        {"employee_ids": employee_ids, "year": year, "month": month}
    ).fetchall()
 
    attendance_dict = {}
    for row in result:
        if not row.date:
            continue
 
        key = (row.employee_id, str(row.date))
        if key not in attendance_dict:
            attendance_dict[key] = {
                "employee_id": row.employee_id,
                "name": row.name,
                "email": row.company_email,
                "role": row.role or "Employee",
                "type": row.employment_type,
                "date": str(row.date),
                "day": row.date.strftime("%A"),
                "status": row.action,
                "hours": float(row.total_hours or 0),  # Ensure float
                "projects": [],
                "subTasks": []
            }
 
        att = attendance_dict[key]
        if row.project_name and {"label": row.project_name, "value": row.project_name, "total_hours": float(row.total_project_hours or 0)} not in att["projects"]:
            att["projects"].append({
                "label": row.project_name,
                "value": row.project_name,
                "total_hours": float(row.total_project_hours or 0)  # Ensure float
            })
 
        if row.sub_task and row.project_name:
            att["subTasks"].append({
                "project": row.project_name,
                "subTask": row.sub_task,
                "hours": float(row.sub_task_hours)  # Ensure float
            })
 
    return list(attendance_dict.values())
 
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
                   COUNT(*) FILTER (WHERE a.action='Leave') AS leave,
                   SUM(a.hours) AS total_hours  -- Add total hours
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
                "leave": r.leave or 0,
                "total_hours": float(r.total_hours or 0)  # Ensure float
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
                COUNT(*) FILTER (WHERE a.action='Leave') AS leave,
                SUM(a.hours) AS total_hours  -- Add total hours
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
                "leave": r.leave or 0,
                "total_hours": float(r.total_hours or 0)  # Ensure float
            }
            for r in result
        ]
 
        return employees_summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
@router.get("/daily-project-summary", response_model=List[dict])
def get_daily_project_summary(
    employee_id: int = Query(None),
    manager_id: int = Query(None),
    hr_id: int = Query(None),
    date: str = Query(...),
    session: Session = Depends(get_session)
):
    employee_ids = []
 
    if employee_id:
        employee_ids = [employee_id]
    elif manager_id:
        mgr_employees = session.exec(
            select(EmployeeManager.employee_id).where(EmployeeManager.manager_id == manager_id)
        ).all()
        employee_ids = [e[0] if isinstance(e, tuple) else e for e in mgr_employees]
    elif hr_id:
        hr_managers = session.exec(
            select(EmployeeHR.manager_id).where(EmployeeHR.hr_id == hr_id)
        ).all()
        manager_ids = [m[0] if isinstance(m, tuple) else m for m in hr_managers]
        if manager_ids:
            mgr_employees = session.exec(
                select(EmployeeManager.employee_id).where(EmployeeManager.manager_id.in_(manager_ids))
            ).all()
            employee_ids = [e[0] if isinstance(e, tuple) else e for e in mgr_employees]
        employee_ids.extend(manager_ids)
    else:
        raise HTTPException(status_code=400, detail="employee_id, manager_id, or hr_id must be provided")
 
    if not employee_ids:
        return []
 
    query = text("""
        SELECT
            dph.employee_id,
            e.name,
            e.company_email,
            dph.date,
            dph.project_id,
            dph.project_name,
            dph.total_project_hours
        FROM daily_project_hours dph
        JOIN employees e ON dph.employee_id = e.id
        WHERE dph.employee_id = ANY(:employee_ids)
        AND dph.date = :date
        ORDER BY e.name, dph.project_name
    """)
 
    result = session.execute(
        query,
        {"employee_ids": employee_ids, "date": date}
    ).fetchall()
 
    summary = {}
    for row in result:
        key = (row.employee_id, str(row.date))
        if key not in summary:
            summary[key] = {
                "employee_id": row.employee_id,
                "name": row.name,
                "email": row.company_email,
                "date": str(row.date),
                "day": row.date.strftime("%A"),
                "projects": []
            }
        summary[key]["projects"].append({
            "project_id": str(row.project_id),
            "project_name": row.project_name,
            "total_hours": float(row.total_project_hours or 0)  # Ensure float
        })
 
    return list(summary.values())
 
@router.get("/project-details", response_model=dict)
def get_project_details(
    employee_id: int = Query(...),
    date: str = Query(...),
    project_id: int = Query(...),
    session: Session = Depends(get_session)
):
    query = text("""
        SELECT
            project_name,
            sub_task,
            hours as sub_task_hours,
            total_project_hours
        FROM project_subtask_hours
        WHERE employee_id = :employee_id
        AND date = :date
        AND project_id = :project_id
        ORDER BY sub_task
    """)
 
    result = session.execute(
        query,
        {"employee_id": employee_id, "date": date, "project_id": project_id}
    ).fetchall()
 
    if not result:
        return {
            "project_name": "",
            "total_hours": 0.0,  # Use float
            "subTasks": []
        }
 
    return {
        "project_name": result[0].project_name,
        "total_hours": float(result[0].total_project_hours or 0),  # Ensure float
        "subTasks": [
            {"sub_task": row.sub_task, "hours": float(row.sub_task_hours)}  # Ensure float
            for row in result
        ]
    }