from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from datetime import datetime, timedelta
from sqlalchemy import text
from database import get_session
from models.leave_model import LeaveManagement
from models.user_model import User
from schemas.leave_schema import LeaveCreate, LeaveResponse, LeaveApprovalCreate
from schemas.leave_balance_schema import LeaveBalanceResponse, LeaveBalance, LeaveBalanceUpdate
from models.employee_assignment_model import EmployeeManager, EmployeeHR
from utils.email import send_manager_leave_notification, send_hr_leave_notification, send_employee_leave_status
from typing import Literal
import os
from dotenv import load_dotenv
import logging

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/leave", tags=["Leaves"])

@router.post("/apply_leave")
async def apply_leave(leave: dict, session: Session = Depends(get_session)):
    logger.info(f"Received leave request: {leave}")
    try:
        # 1. Verify employee
        logger.info(f"Fetching employee with ID {leave['employee_id']}")
        employee = session.get(User, leave["employee_id"])
        if not employee:
            logger.error(f"Employee not found for ID {leave['employee_id']}")
            raise HTTPException(status_code=404, detail="Employee not found")
        location_id = employee.location_id
        logger.info(f"Employee found: {employee.name}, Location ID: {location_id}")
        weekoffs = get_employee_weekoffs(employee.id, session)
        logger.info(f"Employee weekoffs: {weekoffs}")
        start_date = datetime.strptime(leave["start_date"], "%Y-%m-%d").date()
        end_date = datetime.strptime(leave["end_date"], "%Y-%m-%d").date()
        logger.info(f"Parsed dates: start_date={start_date}, end_date={end_date}")

        # 2. Fetch holidays for location
        logger.info(f"Fetching holidays for location ID {location_id}")
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
        logger.info(f"Holidays found: {holiday_dates}")

        # 3. Calculate leave days excluding holidays + weekoffs
        total_days = 0
        day = start_date
        while day <= end_date:
            if day not in holiday_dates and day.strftime("%A") not in weekoffs:
                total_days += 1
            day += timedelta(days=1)
        logger.info(f"Calculated total leave days: {total_days}")

        if total_days <= 0:
            logger.error("Leave falls only on holidays/weekoffs")
            raise HTTPException(status_code=400, detail="Leave falls only on holidays/weekoffs")

        # 4. Call stored procedure
        logger.info("Calling apply_leave stored procedure")
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
                "no_of_days": total_days
            },
        )
        row = result.fetchone()
        logger.info(f"Stored procedure result: {row}")
        session.commit()

        if not row:
            logger.error("Leave not created by stored procedure")
            raise HTTPException(status_code=500, detail="Leave not created")

        # 5. Get manager
        logger.info(f"Fetching manager for employee ID {leave['employee_id']}")
        manager_assignment = session.exec(
            select(EmployeeManager).where(EmployeeManager.employee_id == leave["employee_id"])
        ).first()
        if not manager_assignment:
            logger.error(f"Manager not assigned for employee ID {leave['employee_id']}")
            raise HTTPException(status_code=404, detail="Manager not assigned")
        manager = session.get(User, manager_assignment.manager_id)
        if not manager:
            logger.error(f"Manager not found for manager ID {manager_assignment.manager_id}")
            raise HTTPException(status_code=404, detail="Manager not found")
        logger.info(f"Manager found: {manager.name}, Email: {manager.company_email}")

        # 6. Send email to manager
        base_url = os.getenv("BASE_URL", "http://localhost:8000")
        approve_url = f"{base_url}/leave/manager/leave-action/{row.id}?action=Approved"
        reject_url = f"{base_url}/leave/manager/leave-action/{row.id}?action=Rejected"
        logger.info(f"Preparing to send manager notification to {manager.company_email}")
        logger.info(f"Approve URL: {approve_url}, Reject URL: {reject_url}")
        email_sent = await send_manager_leave_notification(
            email=manager.company_email,
            employee_name=employee.name,
            employee_email=employee.company_email,
            leave_type=leave["leave_type"],
            start_date=str(start_date),
            end_date=str(end_date),
            no_of_days=total_days,
            reason=leave["reason"],
            approve_url=approve_url,
            reject_url=reject_url
        )
        if not email_sent:
            logger.error(f"Failed to send manager notification to {manager.company_email}")
        else:
            logger.info(f"Manager notification sent successfully to {manager.company_email}")

        logger.info("Leave application processed successfully")
        return {
            "id": row.id,
            "leaveType": row.leave_type,
            "startDate": row.start_date,
            "endDate": row.end_date,
            "totalDays": total_days,
            "reason": row.reason,
            "status": row.status,
            "createdAt": row.created_at
        }

    except Exception as e:
        logger.error(f"Error applying leave: {str(e)}")
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Error applying leave: {str(e)}")

@router.get("/all_leaves/{employee_id}", response_model=list[LeaveResponse])
def get_all_leaves(employee_id: int, session: Session = Depends(get_session)):
    statement = (
        select(LeaveManagement, User.name)
        .join(User, LeaveManagement.employee_id == User.id)
        .where(LeaveManagement.employee_id == employee_id)
    )
    results = session.exec(statement).all()
    leaves_with_name = []
    for leave, name in results:
        leave_dict = leave.dict()
        leave_dict["employee_name"] = name
        leaves_with_name.append(leave_dict)
    return leaves_with_name

@router.get("/manager/pending-leaves/{manager_id}")
def get_manager_pending_leaves(manager_id: int, session: Session = Depends(get_session)):
    query = text("""
        SELECT lm.*, e.name AS employee_name, e.company_email AS employee_email
        FROM leave_management lm
        JOIN employees e ON lm.employee_id = e.id
        JOIN employee_managers em ON e.id = em.employee_id
        WHERE lm.manager_status = 'Pending'
          AND em.manager_id = :manager_id
    """)
    rows = session.execute(query, {"manager_id": manager_id}).mappings().all()
    return [dict(row) for row in rows]

@router.get("/manager/leave-action/{leave_id}")
async def manager_leave_action(
    leave_id: int,
    action: Literal["Approved", "Rejected"],
    session: Session = Depends(get_session)
):
    logger.info(f"Processing manager action for leave ID {leave_id}: {action}")
    leave = session.get(LeaveManagement, leave_id)
    if not leave:
        logger.error(f"Leave not found for ID {leave_id}")
        raise HTTPException(status_code=404, detail="Leave not found")
    if leave.manager_status != "Pending":
        logger.error(f"Action already taken for leave ID {leave_id}: {leave.manager_status}")
        raise HTTPException(status_code=400, detail="Action already taken")

    leave.manager_status = action
    leave.updated_at = datetime.now()

    if action == "Rejected":
        leave.status = "Rejected"
        # Send email to employee
        employee = session.get(User, leave.employee_id)
        logger.info(f"Sending rejection email to employee {employee.company_email}")
        await send_employee_leave_status(
            email=employee.company_email,
            leave_type=leave.leave_type,
            start_date=str(leave.start_date),
            end_date=str(leave.end_date),
            no_of_days=leave.no_of_days,
            reason=leave.reason,
            status="Rejected"
        )
    else:
        # Get HR
        logger.info(f"Fetching HR for employee ID {leave.employee_id}")
        hr_assignment = session.exec(
            select(EmployeeHR).where(EmployeeHR.employee_id == leave.employee_id)
        ).first()
        if not hr_assignment:
            logger.error(f"HR not assigned for employee ID {leave.employee_id}")
            raise HTTPException(status_code=404, detail="HR not assigned")
        hr = session.get(User, hr_assignment.hr_id)
        if not hr:
            logger.error(f"HR not found for HR ID {hr_assignment.hr_id}")
            raise HTTPException(status_code=404, detail="HR not found")

        # Send email to HR
        base_url = os.getenv("BASE_URL", "http://localhost:8000")
        approve_url = f"{base_url}/leave/hr/leave-action/{leave_id}?action=Approved"
        reject_url = f"{base_url}/leave/hr/leave-action/{leave_id}?action=Rejected"
        employee = session.get(User, leave.employee_id)
        logger.info(f"Sending HR notification to {hr.company_email}")
        await send_hr_leave_notification(
            email=hr.company_email,
            employee_name=employee.name,
            employee_email=employee.company_email,
            leave_type=leave.leave_type,
            start_date=str(leave.start_date),
            end_date=str(leave.end_date),
            no_of_days=leave.no_of_days,
            reason=leave.reason,
            approve_url=approve_url,
            reject_url=reject_url
        )

    session.add(leave)
    session.commit()
    logger.info(f"Manager action completed: Leave ID {leave_id} {action}")
    return {"success": True, "message": f"Leave {action} by Manager"}

@router.post("/manager/leave-action/{leave_id}")
async def manager_leave_action_post(leave_id: int, data: dict, session: Session = Depends(get_session)):
    logger.info(f"Processing manager POST action for leave ID {leave_id}: {data}")
    leave = session.get(LeaveManagement, leave_id)
    if not leave:
        logger.error(f"Leave not found for ID {leave_id}")
        raise HTTPException(status_code=404, detail="Leave not found")

    action = data.get("action")
    if action not in ["Approved", "Rejected"]:
        logger.error(f"Invalid action: {action}")
        raise HTTPException(status_code=400, detail="Invalid action")

    leave.manager_status = action
    leave.updated_at = datetime.now()

    if action == "Rejected":
        leave.status = "Rejected"
        # Send email to employee
        employee = session.get(User, leave.employee_id)
        logger.info(f"Sending rejection email to employee {employee.company_email}")
        await send_employee_leave_status(
            email=employee.company_email,
            leave_type=leave.leave_type,
            start_date=str(leave.start_date),
            end_date=str(leave.end_date),
            no_of_days=leave.no_of_days,
            reason=leave.reason,
            status="Rejected"
        )
    else:
        # Get HR
        logger.info(f"Fetching HR for employee ID {leave.employee_id}")
        hr_assignment = session.exec(
            select(EmployeeHR).where(EmployeeHR.employee_id == leave.employee_id)
        ).first()
        if not hr_assignment:
            logger.error(f"HR not assigned for employee ID {leave.employee_id}")
            raise HTTPException(status_code=404, detail="HR not assigned")
        hr = session.get(User, hr_assignment.hr_id)
        if not hr:
            logger.error(f"HR not found for HR ID {hr_assignment.hr_id}")
            raise HTTPException(status_code=404, detail="HR not found")

        # Send email to HR
        base_url = os.getenv("BASE_URL", "http://localhost:8000")
        approve_url = f"{base_url}/leave/hr/leave-action/{leave_id}?action=Approved"
        reject_url = f"{base_url}/leave/hr/leave-action/{leave_id}?action=Rejected"
        employee = session.get(User, leave.employee_id)
        logger.info(f"Sending HR notification to {hr.company_email}")
        await send_hr_leave_notification(
            email=hr.company_email,
            employee_name=employee.name,
            employee_email=employee.company_email,
            leave_type=leave.leave_type,
            start_date=str(leave.start_date),
            end_date=str(leave.end_date),
            no_of_days=leave.no_of_days,
            reason=leave.reason,
            approve_url=approve_url,
            reject_url=reject_url
        )

    session.add(leave)
    session.commit()
    logger.info(f"Manager POST action completed: Leave ID {leave_id} {action}")
    return {"success": True, "message": f"Leave {action} by Manager"}

@router.get("/hr/pending-leaves/{hr_id}")
def get_hr_pending_leaves(hr_id: int, session: Session = Depends(get_session)):
    query = text("""
        SELECT lm.*, e.name AS employee_name, e.company_email AS employee_email
        FROM leave_management lm
        JOIN employees e ON lm.employee_id = e.id
        JOIN employee_hrs eh ON e.id = eh.employee_id
        WHERE lm.manager_status = 'Approved'
          AND lm.hr_status = 'Pending'
          AND eh.hr_id = :hr_id
    """)
    rows = session.execute(query, {"hr_id": hr_id}).mappings().all()
    return [dict(row) for row in rows]

@router.get("/hr/leave-action/{leave_id}")
async def hr_leave_action(
    leave_id: int,
    action: Literal["Approved", "Rejected"],
    session: Session = Depends(get_session)
):
    logger.info(f"Processing HR action for leave ID {leave_id}: {action}")
    leave = session.get(LeaveManagement, leave_id)
    if not leave:
        logger.error(f"Leave not found for ID {leave_id}")
        raise HTTPException(status_code=404, detail="Leave not found")
    if leave.hr_status != "Pending":
        logger.error(f"Action already taken for leave ID {leave_id}: {leave.hr_status}")
        raise HTTPException(status_code=400, detail="Action already taken")

    leave.hr_status = action
    leave.status = action
    leave.updated_at = datetime.now()

    if action == "Approved":
        logger.info(f"Updating leave balance for employee ID {leave.employee_id}")
        balance = session.query(LeaveBalance).filter_by(employee_id=leave.employee_id).first()
        if balance:
            leave_type = leave.leave_type.strip()
            if leave_type == "Sick Leave":
                balance.sick_leaves = max(0, balance.sick_leaves - leave.no_of_days)
            elif leave_type == "Casual Leave":
                balance.casual_leaves = max(0, balance.casual_leaves - leave.no_of_days)
            elif leave_type == "Annual Leave":
                balance.paid_leaves = max(0, balance.paid_leaves - leave.no_of_days)
            elif leave_type == "Maternity Leave":
                balance.maternity_leave = max(0, balance.maternity_leave - leave.no_of_days)
            elif leave_type == "Paternity Leave":
                balance.paternity_leave = max(0, balance.paternity_leave - leave.no_of_days)
            balance.updated_at = datetime.now()
            session.add(balance)
            logger.info(f"Leave balance updated: {leave_type} reduced by {leave.no_of_days}")

    # Send email to employee
    employee = session.get(User, leave.employee_id)
    logger.info(f"Sending status email to employee {employee.company_email}: {action}")
    await send_employee_leave_status(
        email=employee.company_email,
        leave_type=leave.leave_type,
        start_date=str(leave.start_date),
        end_date=str(leave.end_date),
        no_of_days=leave.no_of_days,
        reason=leave.reason,
        status=action
    )

    session.add(leave)
    session.commit()
    logger.info(f"HR action completed: Leave ID {leave_id} {action}")
    return {"success": True, "message": f"Leave {action} by HR"}

@router.post("/hr/leave-action/{leave_id}")
async def hr_leave_action_post(leave_id: int, data: dict, session: Session = Depends(get_session)):
    logger.info(f"Processing HR POST action for leave ID {leave_id}: {data}")
    leave = session.get(LeaveManagement, leave_id)
    if not leave:
        logger.error(f"Leave not found for ID {leave_id}")
        raise HTTPException(status_code=404, detail="Leave not found")

    action = data.get("action")
    if action not in ["Approved", "Rejected"]:
        logger.error(f"Invalid action: {action}")
        raise HTTPException(status_code=400, detail="Invalid action")

    leave.hr_status = action
    leave.status = action
    leave.updated_at = datetime.now()

    if action == "Approved":
        logger.info(f"Updating leave balance for employee ID {leave.employee_id}")
        balance = session.query(LeaveBalance).filter_by(employee_id=leave.employee_id).first()
        if balance:
            leave_type = leave.leave_type.strip()
            if leave_type == "Sick Leave":
                balance.sick_leaves = max(0, balance.sick_leaves - leave.no_of_days)
            elif leave_type == "Casual Leave":
                balance.casual_leaves = max(0, balance.casual_leaves - leave.no_of_days)
            elif leave_type == "Annual Leave":
                balance.paid_leaves = max(0, balance.paid_leaves - leave.no_of_days)
            elif leave_type == "Maternity Leave":
                balance.maternity_leave = max(0, balance.maternity_leave - leave.no_of_days)
            elif leave_type == "Paternity Leave":
                balance.paternity_leave = max(0, balance.paternity_leave - leave.no_of_days)
            balance.updated_at = datetime.now()
            session.add(balance)
            logger.info(f"Leave balance updated: {leave_type} reduced by {leave.no_of_days}")

    # Send email to employee
    employee = session.get(User, leave.employee_id)
    logger.info(f"Sending status email to employee {employee.company_email}: {action}")
    await send_employee_leave_status(
        email=employee.company_email,
        leave_type=leave.leave_type,
        start_date=str(leave.start_date),
        end_date=str(leave.end_date),
        no_of_days=leave.no_of_days,
        reason=leave.reason,
        status=action
    )

    session.add(leave)
    session.commit()
    logger.info(f"HR POST action completed: Leave ID {leave_id} {action}")
    return {"success": True, "message": f"Leave {action} by HR"}

@router.get("/leave-requests/{manager_id}")
def get_manager_leave_requests(manager_id: int, status: str = None, session: Session = Depends(get_session)):
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
    query = (
        select(LeaveManagement, User)
        .join(EmployeeHR, EmployeeHR.employee_id == LeaveManagement.employee_id)
        .join(User, User.id == LeaveManagement.employee_id)
        .where(EmployeeHR.hr_id == hr_id)
        .where(LeaveManagement.manager_status == "Approved")
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