from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlmodel import Session, select
from database import get_session
from models.expenses_model import ExpenseRequest, ExpenseAttachment, ExpenseHistory
from models.user_model import User
# EmployeeMaster model no longer used - all manager/HR data is in EmployeeManager/EmployeeHR tables
from models.employee_assignment_model import EmployeeManager, EmployeeHR
from auth import get_current_user, role_required
from utils.code import generate_request_code
from pydantic import BaseModel
from sqlalchemy import and_, or_, func, extract
import os
 
router = APIRouter(prefix="/expense-management", tags=["Expense Management"])
 
UPLOAD_DIR = "uploads/expenses"
os.makedirs(UPLOAD_DIR, exist_ok=True)
BASE_URL = "http://localhost:8000"
 
class ExpenseRequestCreate(BaseModel):
    category: str
    amount: float
    currency: str
    description: Optional[str] = None
    expense_date: str  # YYYY-MM-DD format
    tax_included: bool = False
 
class ExpenseRequestResponse(BaseModel):
    request_id: int
    request_code: str
    employee_id: int
    employee_name: str
    category: str
    amount: float
    currency: str
    description: Optional[str]
    expense_date: datetime
    tax_included: bool
    status: str
    manager_status: str
    hr_status: str
    account_manager_status: str
    created_at: datetime
    updated_at: datetime
    attachments: List[dict] = []
 
class ExpenseApprovalRequest(BaseModel):
    action: str  # "Approved" or "Rejected"
    reason: Optional[str] = None
 
@router.post("/submit", response_model=ExpenseRequestResponse)
def submit_expense_request(
    category: str = Form(...),
    amount: float = Form(...),
    currency: str = Form(...),
    description: str = Form(None),
    expense_date: str = Form(...),
    tax_included: bool = Form(False),
    file: UploadFile = File(None),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Submit expense request - Employee only"""
    try:
        # Validate that receipt is provided
        if not file or not file.filename:
            raise HTTPException(status_code=400, detail="Receipt submission is mandatory. Please upload a receipt.")
        
        # Validate expense date
        expense_dt = datetime.strptime(expense_date, "%Y-%m-%d")
       
        # Create expense request
        expense_request = ExpenseRequest(
            request_code=generate_request_code(),
            employee_id=current_user.id,
            category=category,
            amount=amount,
            currency=currency,
            description=description,
            expense_date=expense_dt,
            tax_included=tax_included,
        )
        session.add(expense_request)
        session.commit()
        session.refresh(expense_request)
 
        # Handle file attachment
        attachment_data = []
        if file:
            folder_path = os.path.join(UPLOAD_DIR, str(expense_request.request_code))
            os.makedirs(folder_path, exist_ok=True)
            file_location = os.path.join(folder_path, file.filename)
           
            with open(file_location, "wb") as f:
                f.write(file.file.read())
               
            rel_path = os.path.join("uploads/expenses", str(expense_request.request_code), file.filename).replace(os.sep, "/")
 
            attachment = ExpenseAttachment(
                request_id=expense_request.request_id,
                file_name=file.filename,
                file_path=rel_path,
                file_type=file.content_type,
                file_size=os.path.getsize(file_location),
            )
            session.add(attachment)
            session.commit()
            session.refresh(attachment)
       
            public_url = f"{BASE_URL}/{rel_path.lstrip('/')}"
       
            attachment_data = [{
                "attachment_id": attachment.attachment_id,
                "file_name": attachment.file_name,
                "file_path": public_url,
                "file_type": attachment.file_type,
                "file_size": attachment.file_size,
            }]
 
        return ExpenseRequestResponse(
            request_id=expense_request.request_id,
            request_code=expense_request.request_code,
            employee_id=expense_request.employee_id,
            employee_name=f"{current_user.first_name} {current_user.last_name}",
            category=expense_request.category,
            amount=expense_request.amount,
            currency=expense_request.currency,
            description=expense_request.description,
            expense_date=expense_request.expense_date,
            tax_included=expense_request.tax_included,
            status=expense_request.status,
            manager_status=expense_request.manager_status,
            hr_status=expense_request.hr_status,
            account_manager_status=expense_request.account_manager_status,
            created_at=expense_request.created_at,
            updated_at=expense_request.updated_at,
            attachments=attachment_data
        )
 
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Error submitting expense: {str(e)}")
 
@router.get("/my-expenses", response_model=List[ExpenseRequestResponse])
def get_my_expenses(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    year: Optional[int] = Query(None, description="Filter by year"),
    month: Optional[int] = Query(None, description="Filter by month"),
    status: Optional[str] = Query(None, description="Filter by status")
):
    """Get current user's expense requests"""
    query = select(ExpenseRequest).where(ExpenseRequest.employee_id == current_user.id)
   
    if year:
        query = query.where(extract('year', ExpenseRequest.expense_date) == year)
   
    if month:
        query = query.where(extract('month', ExpenseRequest.expense_date) == month)
   
    if status:
        query = query.where(ExpenseRequest.status == status)
   
    expenses = session.exec(query.order_by(ExpenseRequest.created_at.desc())).all()
   
    result = []
    for expense in expenses:
        # Get attachments
        attachments = session.exec(
            select(ExpenseAttachment).where(ExpenseAttachment.request_id == expense.request_id)
        ).all()
       
        attachment_data = [
            {
                "attachment_id": att.attachment_id,
                "file_name": att.file_name,
                "file_path": f"{BASE_URL}/{att.file_path.lstrip('/')}",
                "file_type": att.file_type,
                "file_size": att.file_size,
            }
            for att in attachments
        ]
       
        result.append(ExpenseRequestResponse(
            request_id=expense.request_id,
            request_code=expense.request_code,
            employee_id=expense.employee_id,
            employee_name=f"{current_user.first_name} {current_user.last_name}",
            category=expense.category,
            amount=expense.amount,
            currency=expense.currency,
            description=expense.description,
            expense_date=expense.expense_date,
            tax_included=expense.tax_included,
            status=expense.status,
            manager_status=expense.manager_status,
            hr_status=expense.hr_status,
            account_manager_status=expense.account_manager_status,
            created_at=expense.created_at,
            updated_at=expense.updated_at,
            attachments=attachment_data
        ))
   
    return result
 
@router.get("/pending-manager", response_model=List[ExpenseRequestResponse])
def get_pending_manager_expenses(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    year: Optional[int] = Query(None, description="Filter by year"),
    month: Optional[int] = Query(None, description="Filter by month")
):
    """Get pending expense requests for manager approval"""
    # Check if user is a manager
    manager_assignments = session.exec(
        select(EmployeeManager).where(EmployeeManager.manager_id == current_user.id)
    ).all()
   
    if not manager_assignments:
        raise HTTPException(status_code=403, detail="Access denied. Manager role required.")
   
    # Get employee IDs managed by this manager
    employee_ids = [assignment.employee_id for assignment in manager_assignments]
   
    # Get pending expense requests for these employees
    query = select(ExpenseRequest, User).join(
        User, ExpenseRequest.employee_id == User.id
    ).where(
        and_(
            ExpenseRequest.employee_id.in_(employee_ids),
            ExpenseRequest.manager_status == "Pending"
        )
    )
   
    if year:
        query = query.where(extract('year', ExpenseRequest.expense_date) == year)
   
    if month:
        query = query.where(extract('month', ExpenseRequest.expense_date) == month)
   
    query = query.order_by(ExpenseRequest.created_at.desc())
    results = session.exec(query).all()
   
    result = []
    for expense, user in results:
        # Get attachments
        attachments = session.exec(
            select(ExpenseAttachment).where(ExpenseAttachment.request_id == expense.request_id)
        ).all()
       
        attachment_data = [
            {
                "attachment_id": att.attachment_id,
                "file_name": att.file_name,
                "file_path": f"{BASE_URL}/{att.file_path.lstrip('/')}",
                "file_type": att.file_type,
                "file_size": att.file_size,
            }
            for att in attachments
        ]
       
        result.append(ExpenseRequestResponse(
            request_id=expense.request_id,
            request_code=expense.request_code,
            employee_id=expense.employee_id,
            employee_name=f"{user.first_name} {user.last_name}",
            category=expense.category,
            amount=expense.amount,
            currency=expense.currency,
            description=expense.description,
            expense_date=expense.expense_date,
            tax_included=expense.tax_included,
            status=expense.status,
            manager_status=expense.manager_status,
            hr_status=expense.hr_status,
            account_manager_status=expense.account_manager_status,
            created_at=expense.created_at,
            updated_at=expense.updated_at,
            attachments=attachment_data
        ))
   
    return result
 
@router.get("/pending-hr", response_model=List[ExpenseRequestResponse])
def get_pending_hr_expenses(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    year: Optional[int] = Query(None, description="Filter by year"),
    month: Optional[int] = Query(None, description="Filter by month")
):
    """Get pending expense requests for HR approval"""
    # Check if user is HR
    if current_user.role not in ["HR", "Admin"]:
        raise HTTPException(status_code=403, detail="Access denied. HR role required.")
   
    # Get HR assignments
    hr_assignments = session.exec(
        select(EmployeeHR).where(EmployeeHR.hr_id == current_user.id)
    ).all()
   
    employee_ids = [assignment.employee_id for assignment in hr_assignments]
   
    # Get expense requests that are manager approved but HR pending
    query = select(ExpenseRequest, User).join(
        User, ExpenseRequest.employee_id == User.id
    ).where(
        and_(
            ExpenseRequest.employee_id.in_(employee_ids) if employee_ids else True,
            ExpenseRequest.manager_status == "Approved",
            ExpenseRequest.hr_status == "Pending"
        )
    )
   
    if year:
        query = query.where(extract('year', ExpenseRequest.expense_date) == year)
   
    if month:
        query = query.where(extract('month', ExpenseRequest.expense_date) == month)
   
    query = query.order_by(ExpenseRequest.created_at.desc())
    results = session.exec(query).all()
   
    result = []
    for expense, user in results:
        # Get attachments
        attachments = session.exec(
            select(ExpenseAttachment).where(ExpenseAttachment.request_id == expense.request_id)
        ).all()
       
        attachment_data = [
            {
                "attachment_id": att.attachment_id,
                "file_name": att.file_name,
                "file_path": f"{BASE_URL}/{att.file_path.lstrip('/')}",
                "file_type": att.file_type,
                "file_size": att.file_size,
            }
            for att in attachments
        ]
       
        result.append(ExpenseRequestResponse(
            request_id=expense.request_id,
            request_code=expense.request_code,
            employee_id=expense.employee_id,
            employee_name=f"{user.first_name} {user.last_name}",
            category=expense.category,
            amount=expense.amount,
            currency=expense.currency,
            description=expense.description,
            expense_date=expense.expense_date,
            tax_included=expense.tax_included,
            status=expense.status,
            manager_status=expense.manager_status,
            hr_status=expense.hr_status,
            account_manager_status=expense.account_manager_status,
            created_at=expense.created_at,
            updated_at=expense.updated_at,
            attachments=attachment_data
        ))
   
    return result
 
@router.put("/manager-approval/{request_id}")
def manager_expense_approval(
    request_id: int,
    approval: ExpenseApprovalRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Manager approval/rejection of expense request"""
    # Get the expense request
    expense = session.get(ExpenseRequest, request_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense request not found")
   
    # Check if current user is the manager for this employee
    manager_assignment = session.exec(
        select(EmployeeManager).where(
            and_(
                EmployeeManager.employee_id == expense.employee_id,
                EmployeeManager.manager_id == current_user.id
            )
        )
    ).first()
   
    if not manager_assignment:
        raise HTTPException(status_code=403, detail="Access denied. You are not the manager for this employee.")
   
    # Validate action
    if approval.action not in ["Approved", "Rejected"]:
        raise HTTPException(status_code=400, detail="Invalid action. Must be 'Approved' or 'Rejected'")
   
    # Update expense request
    expense.manager_status = approval.action
    expense.updated_at = datetime.now()
   
    # If rejected by manager, set final status to rejected
    if approval.action == "Rejected":
        expense.status = "Rejected"
   
    # Add to expense history
    history = ExpenseHistory(
        request_id=request_id,
        action_by=current_user.id,
        action=approval.action,
        reason=approval.reason,
        action_date=datetime.now()
    )
    session.add(history)
   
    session.add(expense)
    session.commit()
   
    return {
        "success": True,
        "message": f"Expense request {approval.action.lower()} by manager",
        "request_id": request_id,
        "action": approval.action
    }
 
@router.put("/hr-approval/{request_id}")
def hr_expense_approval(
    request_id: int,
    approval: ExpenseApprovalRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """HR approval/rejection of expense request"""
    # Check if user is HR
    if current_user.role not in ["HR", "Admin"]:
        raise HTTPException(status_code=403, detail="Access denied. HR role required.")
   
    # Get the expense request
    expense = session.get(ExpenseRequest, request_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense request not found")
   
    # Check if expense is manager approved
    if expense.manager_status != "Approved":
        raise HTTPException(status_code=400, detail="Expense must be manager approved first")
   
    # Validate action
    if approval.action not in ["Approved", "Rejected"]:
        raise HTTPException(status_code=400, detail="Invalid action. Must be 'Approved' or 'Rejected'")
   
    # Update expense request
    expense.hr_status = approval.action
    expense.updated_at = datetime.now()
   
    # If HR approves, move to account manager for final approval
    if approval.action == "Approved":
        expense.status = "Pending Account Manager Approval"
    else:
        expense.status = "Rejected"
   
    # Add to expense history
    history = ExpenseHistory(
        request_id=request_id,
        action_by=current_user.id,
        action=approval.action,
        reason=approval.reason,
        action_date=datetime.now()
    )
    session.add(history)
   
    session.add(expense)
    session.commit()
   
    return {
        "success": True,
        "message": f"Expense request {approval.action.lower()} by HR",
        "request_id": request_id,
        "action": approval.action
    }
 
@router.get("/all-expenses", response_model=List[ExpenseRequestResponse])
def get_all_expenses(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    status: Optional[str] = Query(None, description="Filter by status"),
    employee_id: Optional[int] = Query(None, description="Filter by employee ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    year: Optional[int] = Query(None, description="Filter by year"),
    month: Optional[int] = Query(None, description="Filter by month")
):
    """Get all expense requests - HR/Admin only"""
    # Check if user is HR or Admin
    if current_user.role not in ["HR", "Admin"]:
        raise HTTPException(status_code=403, detail="Access denied. HR/Admin role required.")
   
    query = select(ExpenseRequest, User).join(
        User, ExpenseRequest.employee_id == User.id
    )
   
    # Apply filters
    if status:
        query = query.where(ExpenseRequest.status == status)
   
    if employee_id:
        query = query.where(ExpenseRequest.employee_id == employee_id)
   
    if category:
        query = query.where(ExpenseRequest.category == category)
   
    if year:
        query = query.where(extract('year', ExpenseRequest.expense_date) == year)
   
    if month:
        query = query.where(extract('month', ExpenseRequest.expense_date) == month)
   
    query = query.order_by(ExpenseRequest.created_at.desc())
    results = session.exec(query).all()
   
    result = []
    for expense, user in results:
        # Get attachments
        attachments = session.exec(
            select(ExpenseAttachment).where(ExpenseAttachment.request_id == expense.request_id)
        ).all()
       
        attachment_data = [
            {
                "attachment_id": att.attachment_id,
                "file_name": att.file_name,
                "file_path": f"{BASE_URL}/{att.file_path.lstrip('/')}",
                "file_type": att.file_type,
                "file_size": att.file_size,
            }
            for att in attachments
        ]
       
        result.append(ExpenseRequestResponse(
            request_id=expense.request_id,
            request_code=expense.request_code,
            employee_id=expense.employee_id,
            employee_name=f"{user.first_name} {user.last_name}",
            category=expense.category,
            amount=expense.amount,
            currency=expense.currency,
            description=expense.description,
            expense_date=expense.expense_date,
            tax_included=expense.tax_included,
            status=expense.status,
            manager_status=expense.manager_status,
            hr_status=expense.hr_status,
            account_manager_status=expense.account_manager_status,
            created_at=expense.created_at,
            updated_at=expense.updated_at,
            attachments=attachment_data
        ))
   
    return result
 
@router.get("/{request_id}", response_model=ExpenseRequestResponse)
def get_expense_request(
    request_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get specific expense request details"""
    # Get the expense request with employee details
    query = select(ExpenseRequest, User).join(
        User, ExpenseRequest.employee_id == User.id
    ).where(ExpenseRequest.request_id == request_id)
   
    result = session.exec(query).first()
   
    if not result:
        raise HTTPException(status_code=404, detail="Expense request not found")
   
    expense, user = result
   
    # Check access permissions
    is_employee = expense.employee_id == current_user.id
    is_manager = session.exec(
        select(EmployeeManager).where(
            and_(
                EmployeeManager.employee_id == expense.employee_id,
                EmployeeManager.manager_id == current_user.id
            )
        )
    ).first() is not None
    is_hr_admin = current_user.role in ["HR", "Admin"]
   
    if not (is_employee or is_manager or is_hr_admin):
        raise HTTPException(status_code=403, detail="Access denied")
   
    # Get attachments
    attachments = session.exec(
        select(ExpenseAttachment).where(ExpenseAttachment.request_id == expense.request_id)
    ).all()
   
    attachment_data = [
        {
            "attachment_id": att.attachment_id,
            "file_name": att.file_name,
            "file_path": f"{BASE_URL}/{att.file_path.lstrip('/')}",
            "file_type": att.file_type,
            "file_size": att.file_size,
        }
        for att in attachments
    ]
   
    return ExpenseRequestResponse(
        request_id=expense.request_id,
        request_code=expense.request_code,
        employee_id=expense.employee_id,
        employee_name=f"{user.first_name} {user.last_name}",
        category=expense.category,
        amount=expense.amount,
        currency=expense.currency,
        description=expense.description,
        expense_date=expense.expense_date,
        tax_included=expense.tax_included,
        status=expense.status,
        manager_status=expense.manager_status,
        hr_status=expense.hr_status,
        account_manager_status=expense.account_manager_status,
        created_at=expense.created_at,
        updated_at=expense.updated_at,
        attachments=attachment_data
    )
 
@router.delete("/{request_id}")
def cancel_expense_request(
    request_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Cancel expense request - Employee can cancel their own pending requests"""
    # Get the expense request
    expense = session.get(ExpenseRequest, request_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense request not found")
   
    # Check if current user is the employee who submitted the expense
    if expense.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied. You can only cancel your own expense requests.")
   
    # Check if expense is still pending (can only cancel pending requests)
    if expense.status != "Pending":
        raise HTTPException(status_code=400, detail="Cannot cancel expense request that is already processed")
   
    # Delete attachments first
    attachments = session.exec(
        select(ExpenseAttachment).where(ExpenseAttachment.request_id == request_id)
    ).all()
   
    for attachment in attachments:
        # Delete file from filesystem
        try:
            file_path = os.path.join(UPLOAD_DIR, str(expense.request_code), attachment.file_name)
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception:
            pass  # Continue even if file deletion fails
       
        session.delete(attachment)
   
    # Delete the expense request
    session.delete(expense)
    session.commit()
   
    return {"message": "Expense request cancelled successfully"}
 
@router.get("/categories/list")
def get_expense_categories(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get list of expense categories"""
    categories = [
        "Travel",
        "Meals",
        "Office Supplies",
        "Training",
        "Transportation",
        "Accommodation",
        "Communication",
        "Equipment",
        "Software",
        "Medical",
        "Other"
    ]
   
    return {"categories": categories}
 
@router.get("/statistics/summary")
def get_expense_statistics(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    year: Optional[int] = Query(None, description="Filter by year"),
    month: Optional[int] = Query(None, description="Filter by month")
):
    """Get expense statistics - HR/Admin only"""
    # Check if user is HR or Admin
    if current_user.role not in ["HR", "Admin"]:
        raise HTTPException(status_code=403, detail="Access denied. HR/Admin role required.")
   
    query = select(ExpenseRequest)
   
    if year:
        query = query.where(extract('year', ExpenseRequest.expense_date) == year)
   
    if month:
        query = query.where(extract('month', ExpenseRequest.expense_date) == month)
   
    expenses = session.exec(query).all()
   
    total_requests = len(expenses)
    total_amount = sum(expense.amount for expense in expenses)
   
    status_counts = {}
    category_amounts = {}
   
    for expense in expenses:
        # Count by status
        status_counts[expense.status] = status_counts.get(expense.status, 0) + 1
       
        # Sum by category
        category_amounts[expense.category] = category_amounts.get(expense.category, 0) + expense.amount
   
    return {
        "total_requests": total_requests,
        "total_amount": total_amount,
        "status_breakdown": status_counts,
        "category_breakdown": category_amounts,
        "average_amount": total_amount / total_requests if total_requests > 0 else 0
    }
 