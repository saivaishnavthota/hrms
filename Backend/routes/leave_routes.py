# app/routes/leave_routes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from datetime import datetime,timedelta
from sqlalchemy import text
from database import get_session
from models.leave_model import LeaveManagement
from models.user_model import User  # assuming you already have this
from schemas.leave_schema import LeaveCreate, LeaveResponse, LeaveApprovalCreate
from schemas.leave_balance_schema import LeaveBalanceResponse,LeaveBalance,LeaveBalanceUpdate
from models.employee_assignment_model import EmployeeManager, EmployeeHR


# ------------------ EMPLOYEE APPLY LEAVE ------------------ #
router = APIRouter(prefix="/leave", tags=["Leaves"])
@router.post("/apply_leave")
def apply_leave(leave: dict, session: Session = Depends(get_session)):
    try:
        # 1. Get employee
        employee = session.get(User, leave["employee_id"])
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")

        location_id = employee.location_id
        weekoffs = get_employee_weekoffs(employee.id, session)  # e.g. {"Saturday","Sunday","Monday"}

        start_date = datetime.strptime(leave["start_date"], "%Y-%m-%d").date()
        end_date = datetime.strptime(leave["end_date"], "%Y-%m-%d").date()

        # 2. Fetch holidays for location
        holidays = session.execute(
            text("""
                SELECT holiday_date 
                FROM master_calendar 
               WHERE location_id = :loc 
                  AND holiday_date BETWEEN :start AND :end
            """),
            {"loc": location_id, "start": start_date, "end": end_date}
        ).all()
        holiday_dates = {h[0] for h in holidays}

        # 3. Calculate leave days excluding holidays + weekoffs
        total_days = 0
        day = start_date
        while day <= end_date:
            if day not in holiday_dates and day.strftime("%A") not in weekoffs:
                total_days += 1
            day += timedelta(days=1)

        if total_days <= 0:
            raise HTTPException(status_code=400, detail="Leave falls only on holidays/weekoffs")

        # 4. Call stored procedure (still inserts raw start/end range in DB)
        result = session.execute(
            text("""
                SELECT * FROM apply_leave(
                    :employee_id, 
                    :leave_type, 
                    :reason, 
                    :start_date, 
                    :end_date,
                    :no_of_days
                )
            """),
            {
                "employee_id": leave["employee_id"],
                "leave_type": leave["leave_type"],
                "reason": leave["reason"],
                "start_date": start_date,
                "end_date": end_date,
                "no_of_days": total_days  # ✅ dynamic corrected leave days
            },
        )
        row = result.fetchone()
        session.commit()

        if not row:
            raise HTTPException(status_code=500, detail="Leave not created")

        return {
            "id": row.id,
            "leaveType": row.leave_type,
            "startDate": row.start_date,
            "endDate": row.end_date,
            "totalDays": total_days,  # ✅ dynamic corrected leave days
            "reason": row.reason,
            "status": row.status,
            "createdAt": row.created_at
        }

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Error applying leave: {str(e)}")
# ------------------ EMPLOYEE LEAVE HISTORY ------------------ #
@router.get("/all_leaves/{employee_id}", response_model=list[LeaveResponse])
def get_all_leaves(employee_id: int, session: Session = Depends(get_session)):
    leaves = session.exec(
        select(LeaveManagement).where(LeaveManagement.employee_id == employee_id)
    ).all()
    return leaves


@router.get("/manager/pending-leaves/{manager_id}")
def get_manager_pending_leaves(manager_id: int, session: Session = Depends(get_session)):
    query = text("""
        SELECT lm.*, e.name AS employee_name, e.email AS employee_email
        FROM leave_management lm
        JOIN employees e ON lm.employee_id = e.id
        JOIN employee_managers em ON e.id = em.employee_id
        WHERE lm.manager_status = 'Pending'
          AND em.manager_id = :manager_id
    """)
    rows = session.execute(query, {"manager_id": manager_id}).mappings().all()
    return [dict(row) for row in rows]

@router.post("/manager/leave-action/{leave_id}")
def manager_leave_action(leave_id: int, data: dict, session: Session = Depends(get_session)):
    leave = session.get(LeaveManagement, leave_id)
    if not leave:
        raise HTTPException(status_code=404, detail="Leave not found")

    action = data.get("action")
    if action not in ["Approved", "Rejected"]:
        raise HTTPException(status_code=400, detail="Invalid action")

    leave.manager_status = action
    leave.updated_at = datetime.now()

    if action == "Rejected":
        leave.status = "Rejected"

    session.add(leave)
    session.commit()
    return {"success": True, "message": f"Leave {action} by Manager"}


# ------------------ HR PENDING LEAVES ------------------ #
@router.get("/hr/pending-leaves/{hr_id}")
def get_hr_pending_leaves(hr_id: int, session: Session = Depends(get_session)):
    query = text("""
        SELECT lm.*, e.name AS employee_name, e.email AS employee_email
        FROM leave_management lm
        JOIN employees e ON lm.employee_id = e.id
        JOIN employee_hrs eh ON e.id = eh.employee_id
        WHERE lm.manager_status = 'Approved'
          AND lm.hr_status = 'Pending'
          AND eh.hr_id = :hr_id
    """)
    rows = session.execute(query, {"hr_id": hr_id}).mappings().all()
    return [dict(row) for row in rows]



# ------------------ HR ALL LEAVES ------------------ #
@router.post("/hr/leave-action/{leave_id}")
def hr_leave_action(leave_id: int, data: dict, session: Session = Depends(get_session)):
    leave = session.get(LeaveManagement, leave_id)
    if not leave:
        raise HTTPException(status_code=404, detail="Leave not found")

    action = data.get("action")
    if action not in ["Approved", "Rejected"]:
        raise HTTPException(status_code=400, detail="Invalid action")

    leave.hr_status = action
    leave.updated_at = datetime.now()
    leave.status = action  # final status depends on HR decision

    session.add(leave)
    session.commit()
    return {"success": True, "message": f"Leave {action} by HR"}


@router.get("/leave-requests/{manager_id}")
def get_manager_leave_requests(manager_id: int, status: str = None, session: Session = Depends(get_session)):
    """
    Get all leave requests for employees assigned to this manager.
    Optional filter by status.
    """
    query = (
        select(LeaveManagement, User)
        .join(EmployeeManager, EmployeeManager.employee_id == LeaveManagement.employee_id)
        .join(User, User.id == LeaveManagement.employee_id)
        .where(EmployeeManager.manager_id == manager_id)
    )

    if status:
        query = query.where(LeaveManagement.manager_status == status)

    results = session.exec(query).all()

    return [
        {
            "leave_id": leave.id,
            "employee_id": leave.employee_id,
            "employee_name": emp.name,
            "leave_type": leave.leave_type,
            "reason": leave.reason,
            "start_date": leave.start_date,
            "end_date": leave.end_date,
            "no_of_days": leave.no_of_days,
            "manager_status": leave.manager_status,
            "hr_status": leave.hr_status,
            "final_status": leave.status,
        }
        for leave, emp in results
    ]


@router.get("/hr/leave-requests/{hr_id}")
def get_hr_leave_requests(hr_id: int, status: str = None, session: Session = Depends(get_session)):
    """
    Get all leave requests assigned to this HR after manager approval.
    """
    query = (
        select(LeaveManagement, User)
        .join(EmployeeHR, EmployeeHR.employee_id == LeaveManagement.employee_id)
        .join(User, User.id == LeaveManagement.employee_id)
        .where(EmployeeHR.hr_id == hr_id)
        .where(LeaveManagement.manager_status == "Approved")  # ✅ only after manager approval
    )
    
    if status:
        query = query.where(LeaveManagement.hr_status == status)

    results = session.exec(query).all()

    return [
        {
            "leave_id": leave.id,
            "employee_id": leave.employee_id,
            "employee_name": emp.name,
            "leave_type": leave.leave_type,
            "reason": leave.reason,
            "start_date": leave.start_date,
            "end_date": leave.end_date,
            "no_of_days": leave.no_of_days,
            "manager_status": leave.manager_status,
            "hr_status": leave.hr_status,
            "final_status": leave.status,
        }
        for leave, emp in results
    ]


@router.get("/leave_balances/{employee_id}")
def get_leave_balance(employee_id: int, session: Session = Depends(get_session)):
    balance = session.exec(
        select(LeaveBalance).where(LeaveBalance.employee_id == employee_id)
    ).first()
    if not balance:
        raise HTTPException(status_code=404, detail="Leave balance not found")
    return balance

@router.post("/init/{employee_id}", response_model=LeaveBalanceResponse)
def init_leave_balance(employee_id: int, session: Session = Depends(get_session)):
    existing = session.query(LeaveBalance).filter_by(employee_id=employee_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Leave balance already exists")

    balance = LeaveBalance(
        employee_id=employee_id,
        sick_leaves=0,
        casual_leaves=0,
        paid_leaves=0,
        maternity_leave=0,
        paternity_leave=0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    session.add(balance)
    session.commit()
    session.refresh(balance)
    return balance


# 3. Update leave balance (only sick, casual, paid)
@router.put("/leave-balance/{employee_id}", response_model=LeaveBalanceResponse)
def update_leave_balance(
    employee_id: int,
    updates: LeaveBalanceUpdate,
    session: Session = Depends(get_session),
):
    balance = session.query(LeaveBalance).filter_by(employee_id=employee_id).first()
    if not balance:
        raise HTTPException(status_code=404, detail="Leave balance not found")

    balance.sick_leaves = updates.sick_leaves
    balance.casual_leaves = updates.casual_leaves
    balance.paid_leaves = updates.paid_leaves
    balance.maternity_leave = updates.maternity_leave
    balance.paternity_leave = updates.paternity_leave
    balance.updated_at = datetime.utcnow()

    session.commit()
    session.refresh(balance)
    return balance

def get_employee_weekoffs(employee_id: int, session: Session):
    """
    Fetches the weekoff days (day names) for a given employee.
    Returns a set of day names, e.g., {"Monday", "Wednesday"}.
    """
    result = session.execute(
        text("SELECT off_days FROM weekoffs WHERE employee_id = :emp"),
        {"emp": employee_id}
    ).all()
    
    # Each row[0] is already a list/set of day names
    # Flatten all rows into a single set
    weekoff_days = set()
    for row in result:
        if row[0]:  # check not null
            weekoff_days.update(row[0])
    
    return weekoff_days