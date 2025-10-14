from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from typing import List
from models.user_model import User
from models.employee_assignment_model import EmployeeManager
from models.swreq_model import SoftwareRequest
from schemas.swreq_schema import SoftwareRequestCreate, SoftwareRequestUpdate, SoftwareRequestResponse, UserResponse
from utils.email import send_new_request_email, send_approval_email_to_employee, send_approval_email_to_it, send_rejection_email, send_completion_email
from datetime import datetime
from database import get_session
from sqlalchemy import text
from sqlalchemy.orm import aliased

router = APIRouter(prefix="/software_requests", tags=["software_requests"])


@router.post("/", response_model=SoftwareRequestResponse)
async def create_software_request(
    request: SoftwareRequestCreate,
    session: Session = Depends(get_session)
):
    employee = session.get(User, request.employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    it_admin = session.get(User, request.it_admin_id)
    if not it_admin or it_admin.role != "IT Admin":
        raise HTTPException(status_code=404, detail="IT Admin not found")

    manager = None
    if request.manager_id:
        manager = session.get(User, request.manager_id)
        if not manager or manager.role != "Manager":
            raise HTTPException(status_code=404, detail="Manager not found")

    # Call stored procedure
    result = session.execute(
        text("""
            SELECT create_software_request(
                :employee_id, :manager_id, :it_admin_id, 
                :software_name, :software_version, :additional_info
            ) AS id
        """),
        {
            "employee_id": request.employee_id,
            "manager_id": request.manager_id,
            "it_admin_id": request.it_admin_id,
            "software_name": request.software_name,
            "software_version": request.software_version,
            "additional_info": request.additional_info
        }
    ).first()
    session.commit()
    if not result or not result.id:
        raise HTTPException(status_code=500, detail="Failed to create software request")

    request_id = result.id
    base_url = "http://127.0.0.1:8000/software_requests"

    approve_url = f"{base_url}/{request_id}/manager-action?action=Approved" if manager else None
    reject_url = f"{base_url}/{request_id}/manager-action?action=Rejected" if manager else None

    await send_new_request_email(
        manager_email=manager.company_email if manager else None,
        it_admin_email=it_admin.company_email,
        employee_name=employee.name,
        employee_email=employee.company_email,
        software_name=request.software_name,
        software_version=request.software_version,
        additional_info=request.additional_info,
        approve_url=approve_url,
        reject_url=reject_url
    )

    return session.get(SoftwareRequest, request_id)

@router.get("/{request_id}/manager-action")
async def manager_action(
    request_id: int,
    action: str,
    session: Session = Depends(get_session)
):
    valid_actions = ["Approved", "Rejected"]
    if action not in valid_actions:
        raise HTTPException(status_code=400, detail="Invalid action")

    # Fetch request and users
    db_request = session.exec(select(SoftwareRequest).where(SoftwareRequest.id == request_id)).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Software request not found")

    manager = session.exec(select(User).where(User.id == db_request.manager_id)).first()
    employee = session.exec(select(User).where(User.id == db_request.employee_id)).first()
    it_admin = session.exec(select(User).where(User.id == db_request.it_admin_id)).first()

    if not manager:
        raise HTTPException(status_code=404, detail="Manager not assigned")

    # Update status
    query = text("""
        SELECT update_software_request_status(
            :request_id,
            :status,
            :comments,
            :performed_by_id
        )
    """)
    session.execute(query, {
        "request_id": request_id,
        "status": action,
        "comments": f"Action performed by manager",
        "performed_by_id": manager.id
    })
    session.commit()

    # Send emails
    if action == "Approved":
        await send_approval_email_to_employee(employee, manager, db_request)
        await send_approval_email_to_it(it_admin, employee, manager, db_request)
    elif action == "Rejected":
        await send_rejection_email(employee, it_admin, manager, db_request, comments="Rejected by manager")

    return {"message": f"Software request {action} successfully"}

@router.get("/{request_id}/complete")
async def complete_software_request(
    request_id: int,
    session: Session = Depends(get_session)
):
    # Fetch the request
    db_request = session.exec(select(SoftwareRequest).where(SoftwareRequest.id == request_id)).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Software request not found")

    # Fetch IT Admin and employee
    it_admin = session.exec(select(User).where(User.id == db_request.it_admin_id)).first()
    employee = session.exec(select(User).where(User.id == db_request.employee_id)).first()

    if not it_admin:
        raise HTTPException(status_code=404, detail="IT Admin not assigned")

    # Update status to Completed via SQL function
    query = text("""
        SELECT update_software_request_status(
            :request_id,
            :status,
            :comments,
            :performed_by_id
        )
    """)
    session.execute(query, {
        "request_id": request_id,
        "status": "Completed",
        "comments": "Marked as completed by IT Admin",
        "performed_by_id": it_admin.id
    })
    session.commit()

    # Send completion notification to employee
    await send_completion_email(employee.company_email, db_request.software_name, employee.name)

    return {"message": "Software request marked as Completed successfully"}


@router.get("/", response_model=List[SoftwareRequestResponse])
async def list_software_requests(session: Session = Depends(get_session)):
    # Create aliases for the User table
    EmployeeUser = aliased(User, name="employee_user")
    ManagerUser = aliased(User, name="manager_user")
    ItAdminUser = aliased(User, name="it_admin_user")

    query = (
        select(
            SoftwareRequest.id,
            SoftwareRequest.employee_id,
            SoftwareRequest.manager_id,
            SoftwareRequest.it_admin_id,
            SoftwareRequest.software_name,
            SoftwareRequest.software_version,
            SoftwareRequest.status,
            SoftwareRequest.created_at,
            SoftwareRequest.updated_at,
            SoftwareRequest.comments,
            SoftwareRequest.additional_info,
            EmployeeUser.name.label("employee_name"),
            EmployeeUser.company_email.label("employee_email"),
            ManagerUser.name.label("manager_name"),
            ManagerUser.company_email.label("manager_email"),
            ItAdminUser.name.label("it_admin_name"),
            ItAdminUser.company_email.label("it_admin_email")
        )
        .join(EmployeeUser, EmployeeUser.id == SoftwareRequest.employee_id, isouter=False)
        .outerjoin(ManagerUser, ManagerUser.id == SoftwareRequest.manager_id)
        .outerjoin(ItAdminUser, ItAdminUser.id == SoftwareRequest.it_admin_id)
    )
    results = session.exec(query).all()

    # Transform results into list of dictionaries
    response = [
        {
            "id": result.id,
            "employee_id": result.employee_id,
            "employee_name": result.employee_name,
            "employee_email": result.employee_email,
            "manager_id": result.manager_id,
            "manager_name": result.manager_name,
            "manager_email": result.manager_email,
            "it_admin_id": result.it_admin_id,
            "it_admin_name": result.it_admin_name,
            "it_admin_email": result.it_admin_email,
            "software_name": result.software_name,
            "software_version": result.software_version,
            "additional_info": result.additional_info,
            "status": result.status,
            "created_at": result.created_at.isoformat(),
            "updated_at": result.updated_at.isoformat() if result.updated_at else None,
            "comments": result.comments
        }
        for result in results
    ]

    return response

@router.get("/employees/{employee_id}/managers", response_model=List[UserResponse])
async def get_employee_managers(employee_id: int, session: Session = Depends(get_session)):
    managers = session.exec(
        select(User)
        .join(EmployeeManager, EmployeeManager.manager_id == User.id)
        .where(EmployeeManager.employee_id == employee_id)
    ).all()

    return [{"id": m.id, "name": m.name, "email": m.company_email} for m in managers]

@router.get("/it_admins/", response_model=List[UserResponse])
async def get_it_admins(session: Session = Depends(get_session)):
    it_admins = session.exec(select(User).where(User.role == "IT Admin")).all()
    return [{"id": a.id, "name": a.name, "email": a.company_email} for a in it_admins]