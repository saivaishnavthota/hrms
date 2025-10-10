from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Request, Query
from sqlmodel import Session, select, extract
from sqlalchemy.sql import text
from database import get_session
from models.expenses_model import ExpenseRequest, ExpenseAttachment, ExpenseHistory
from utils.code import generate_request_code
from auth import get_current_user, role_required
from models.user_model import User
from models.employee_master_model import EmployeeMaster
from models.employee_assignment_model import EmployeeManager, EmployeeHR
from sqlalchemy import func
from azure.storage.blob import BlobServiceClient, ContentSettings, generate_blob_sas, BlobSasPermissions
import os
from dotenv import load_dotenv
 
router = APIRouter(prefix="/expenses", tags=["Expenses"])
 
load_dotenv()
AZURE_CONNECTION_STRING = os.getenv("AZURE_CONNECTION_STRING", "DefaultEndpointsProtocol=https;AccountName=hrmsnxzen;AccountKey=Jug56pLmeZIJplobcV+f20v7IXnh6PWuih0hxRYpvRXpGh6tnJrzALqtqL/hRR3lpZK0ZTKIs2Pv+AStDvBH4w==;EndpointSuffix=core.windows.net")
AZURE_CONTAINER_NAME = os.getenv("AZURE_CONTAINER_NAME", "con-hrms")
ACCOUNT_NAME = os.getenv("ACCOUNT_NAME", "hrmsnxzen")
ACCOUNT_KEY = os.getenv("ACCOUNT_KEY", "Jug56pLmeZIJplobcV+f20v7IXnh6PWuih0hxRYpvRXpGh6tnJrzALqtqL/hRR3lpZK0ZTKIs2Pv+AStDvBH4w==")
 
blob_service_client = BlobServiceClient.from_connection_string(AZURE_CONNECTION_STRING)
container_client = blob_service_client.get_container_client(AZURE_CONTAINER_NAME)
 
def build_blob_url_with_sas(employee_id: int, file_name: str) -> str:
    """Generate the Azure Blob URL with SAS token for a file."""
    blob_name = f"expenses/{employee_id}/{file_name}"
   
    # Generate SAS token valid for 1 year
    sas_token = generate_blob_sas(
        account_name=ACCOUNT_NAME,
        container_name=AZURE_CONTAINER_NAME,
        blob_name=blob_name,
        account_key=ACCOUNT_KEY,
        permission=BlobSasPermissions(read=True),
        expiry=datetime.utcnow() + timedelta(days=365)
    )
   
    return f"https://{ACCOUNT_NAME}.blob.core.windows.net/{AZURE_CONTAINER_NAME}/{blob_name}?{sas_token}"
 
def calculate_final_amount(amount, discount_percentage=None, cgst_percentage=None, sgst_percentage=None):

    discount_percentage = discount_percentage or 0
    cgst_percentage = cgst_percentage or 0
    sgst_percentage = sgst_percentage or 0

    gross_amount = ((amount)/(sgst_percentage + cgst_percentage + 100))*100
 
    # Apply discount
    discount = (gross_amount * discount_percentage / 100)

    final_amount = gross_amount - discount
 
    # Apply taxes
    cgst_amount = final_amount * (cgst_percentage / 100)
    sgst_amount = final_amount * (sgst_percentage / 100)
 
    # Final total
    final_amount = (final_amount + cgst_amount + sgst_amount)
 
    print(f"\n--- Expense Calculation ---")
    print(f"Base amount: {amount}")
    print(f"Discount ({discount_percentage}%): {amount * discount_percentage / 100}")
    print(f"Discounted amount: {discount}")
    print(f"CGST ({cgst_percentage}%): {cgst_amount}")
    print(f"SGST ({sgst_percentage}%): {sgst_amount}")
    print(f"Final amount: {final_amount}")
    print(f"---------------------------\n")
 
    return round(final_amount, 2)
 
@router.post("/submit-exp", response_model=dict)
async def submit_expense(
    request: Request,
    employee_id: int = Form(...),
    category: str = Form(...),
    amount: float = Form(...),
    currency: str = Form(...),
    description: Optional[str] = Form(None),
    expense_date: str = Form(...),
    tax_included: bool = Form(False),
    files: List[UploadFile] = File(None),
 
    discount: Optional[float] = Form(0),
    cgst: Optional[float] = Form(0),
    sgst: Optional[float] = Form(0),
 
    session: Session = Depends(get_session),
):
    """Submit an expense request with optional attachments stored in Azure Blob Storage."""
    print(f"Received submit-exp request: employee_id={employee_id}, category={category}, amount={amount}, currency={currency}, expense_date={expense_date}, tax_included={tax_included}, files={[f.filename for f in files if f.filename]}")
   
    try:
        final_amount = calculate_final_amount(amount, discount, cgst, sgst)
 
        # Validate file size (5 MB = 5 * 1024 * 1024 bytes)
        for file in files:
            if file.size > 5 * 1024 * 1024:
                raise HTTPException(status_code=400, detail=f"File {file.filename} exceeds 5 MB limit")
 
        # Create expense request
        req = ExpenseRequest(
            request_code=generate_request_code(),
            employee_id=employee_id,
            category=category,
            amount=amount,
            currency=currency,
            description=description,
            expense_date=datetime.strptime(expense_date, "%Y-%m-%d"),
            tax_included=tax_included,
            discount_percentage=discount,
            cgst_percentage=cgst,
            sgst_percentage=sgst,
            final_amount=final_amount,
        )
        session.add(req)
        session.flush()
 
        attachments = []
        if files:
            for file in files:
                if not file.filename:
                    continue
                if file.filename:
                    file_data = await file.read()
                    if not file_data:
                        continue
 
                    # Upload to Azure Blob Storage
                    blob_name = f"expenses/{employee_id}/{file.filename}"
                    blob_client = container_client.get_blob_client(blob_name)
                    content_settings = ContentSettings(content_type=file.content_type)
                    blob_client.upload_blob(file_data, overwrite=True, content_settings=content_settings)
                    file_url = build_blob_url_with_sas(employee_id, file.filename)
 
                    # Call add_expense_attachment function
                    result = session.execute(
                        text("SELECT * FROM add_expense_attachment(:request_id, :file_name, :file_url, :file_type, :file_size)"),
                        {
                            "request_id": req.request_id,
                            "file_name": file.filename,
                            "file_url": file_url,
                            "file_type": file.content_type,
                            "file_size": len(file_data) / 1024,
                        }
                    ).fetchone()
 
                    if result:
                        attachments.append({
                            "attachment_id": result.attachment_id,
                            "file_name": result.file_name,
                            "file_url": result.file_url,
                            "file_type": result.file_type,
                            "file_size": result.file_size,
                            "uploaded_at": result.uploaded_at,
                        })
 
        session.commit()
        print(f"Expense submitted: request_id={req.request_id}, request_code={req.request_code}")
        return {
            "request_id": req.request_id,
            "request_code": req.request_code,
            "employee_id": req.employee_id,
            "category": req.category,
            "amount": req.amount,
            "currency": req.currency,
            "description": req.description,
            "expense_date": req.expense_date,
            "tax_included": req.tax_included,
            "discount_percentage": req.discount_percentage,
            "cgst_percentage": req.cgst_percentage,
            "sgst_percentage": req.sgst_percentage,
            "final_amount": req.final_amount,
            "submit_date": req.created_at,
            "status": req.status,
            "attachments": attachments,
        }
 
    except Exception as e:
        session.rollback()
        print(f"Error submitting expense: {str(e)}\nSQL: {e.__cause__}")
        raise HTTPException(status_code=500, detail=f"Failed to submit expense: {str(e)}")
 
@router.post("/add-attachment", response_model=dict)
async def add_attachment(
    request_id: int = Form(...),
    file: UploadFile = File(...),
    user_id: int = Form(...),
    session: Session = Depends(get_session),
):
    """Add an attachment to an existing expense request."""
    print(f"Adding attachment for request_id={request_id}, user_id={user_id}")
    expense = session.get(ExpenseRequest, request_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense request not found")
    if expense.employee_id != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized to add attachment")
 
    if file.size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File {file.filename} exceeds 5 MB limit")
 
    file_data = await file.read()
    if not file_data:
        raise HTTPException(status_code=400, detail="Empty file")
 
    try:
        blob_name = f"expenses/{user_id}/{file.filename}"
        blob_client = container_client.get_blob_client(blob_name)
        content_settings = ContentSettings(content_type=file.content_type)
        blob_client.upload_blob(file_data, overwrite=True, content_settings=content_settings)
        file_url = build_blob_url_with_sas(user_id, file.filename)
 
        result = session.execute(
            text("SELECT * FROM add_expense_attachment(:request_id, :file_name, :file_url, :file_type, :file_size)"),
            {
                "request_id": request_id,
                "file_name": file.filename,
                "file_url": file_url,
                "file_type": file.content_type,
                "file_size": len(file_data) / 1024,
            }
        ).fetchone()
 
        if not result:
            raise HTTPException(status_code=500, detail="Failed to add attachment")
 
        session.commit()
        return {
            "attachment_id": result.attachment_id,
            "file_name": result.file_name,
            "file_url": result.file_url,
            "file_type": result.file_type,
            "file_size": result.file_size,
            "uploaded_at": result.uploaded_at,
        }
    except Exception as e:
        session.rollback()
        print(f"Error adding attachment: {str(e)}\nSQL: {e.__cause__}")
        raise HTTPException(status_code=500, detail=f"Failed to add attachment: {str(e)}")
 
@router.get("/my-expenses", response_model=List[dict])
def list_my_expenses(
    employee_id: int = Query(...),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    session: Session = Depends(get_session),
):
    """List expenses for a specific employee, returning attachment metadata only."""
    try:
        employee_id = int(employee_id)  # Convert to int if string
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid employee_id format")
   
    print(f"Querying expenses for employee_id: {employee_id}, year: {year}, month: {month}")
    query = session.query(ExpenseRequest).filter(
        ExpenseRequest.employee_id == employee_id
    )
 
    if year is not None and month is not None:
        query = query.filter(
            extract("year", ExpenseRequest.created_at) == year,
            extract("month", ExpenseRequest.created_at) == month
        )
 
    expenses = query.order_by(ExpenseRequest.created_at.desc()).all()
    print(f"Fetched {len(expenses)} expenses for employee_id: {employee_id}")
    for exp in expenses:
        print(f"Expense: request_id={exp.request_id}, created_at={exp.created_at}, expense_date={exp.expense_date}, category={exp.category}")
 
    result = []
    for exp in expenses:
        history_entries = []
        for h in getattr(exp, "history", []):
            user = session.get(User, h.action_by)
            action_by_name = user.name if user else str(h.action_by)
            history_entries.append(
                {
                    "action_by": h.action_by,
                    "action_by_name": action_by_name,
                    "action_role": h.action_role,
                    "action": h.action,
                    "reason": h.reason,
                    "created_at": h.created_at
                }
            )
 
        attachments = [
            {
                "attachment_id": att.attachment_id,
                "file_name": att.file_name,
                "file_url": att.file_url,
                "file_type": att.file_type,
                "file_size": att.file_size,
                "uploaded_at": att.uploaded_at,
            }
            for att in exp.attachments
        ]
 
        result.append(
            {
                "request_id": exp.request_id,
                "request_code": exp.request_code,
                "employee_id": exp.employee_id,
                "category": exp.category,
                "amount": exp.amount,
                "currency": exp.currency,
                "description": exp.description,
                "expense_date": exp.expense_date,
                "tax_included": exp.tax_included,
                "status": exp.status,
                "attachments": attachments,
                "history": history_entries,
                "discount_percentage": exp.discount_percentage,
                "cgst_percentage": exp.cgst_percentage,
                "sgst_percentage": exp.sgst_percentage,
                "final_amount": exp.final_amount,
            }
        )
 
    return result
 
@router.get("/mgr-exp-list", response_model=List[dict])
def list_all_expenses(
    request: Request,
    session: Session = Depends(get_session),
    manager_id: int = Query(..., description="Manager ID"),
    year: int = Query(..., description="Year of expenses"),
    month: int = Query(..., description="Month of expenses"),
):
    """List expenses for employees under a manager, returning attachment metadata only."""
    print(f"Fetching expenses for manager_id={manager_id}, year={year}, month={month}")
   
    start_time = datetime.now()
    employee_ids = session.exec(
        select(EmployeeManager.employee_id).where(EmployeeManager.manager_id == manager_id)
    ).all()
    print(f"Fetched employee_ids in {datetime.now() - start_time}")
 
    employee_links = [e[0] if isinstance(e, tuple) else e for e in employee_ids]
    if not employee_links:
        print("No employees found for manager")
        return []
 
    expenses = session.exec(
        select(ExpenseRequest).where(
            ExpenseRequest.employee_id.in_(employee_links),
            ExpenseRequest.status.in_([
                "pending_manager_approval",
                "pending_hr_approval",
                "mgr_rejected",
                "approved"
            ]),
            func.extract("year", ExpenseRequest.created_at) == year,
            func.extract("month", ExpenseRequest.created_at) == month
        ).order_by(ExpenseRequest.created_at.desc())
    ).all()
    print(f"Fetched {len(expenses)} expenses in {datetime.now() - start_time}")
 
    result = []
    for exp in expenses:
        employee = session.get(User, exp.employee_id)
 
        attachments = [
            {
                "attachment_id": att.attachment_id,
                "file_name": att.file_name,
                "file_url": att.file_url,
                "file_type": att.file_type,
                "file_size": att.file_size,
                "uploaded_at": att.uploaded_at,
            }
            for att in exp.attachments
        ]
 
        history_entries = session.exec(
            select(ExpenseHistory)
            .where(ExpenseHistory.request_id == exp.request_id)
            .order_by(ExpenseHistory.created_at.asc())
        ).all()
 
        manager_reason = None
        for h in history_entries:
            if h.action_role == "Manager" and h.reason:
                manager_reason = h.reason
 
        result.append(
            {
                "id": exp.request_id,
                "employeeName": employee.name if employee else "Unknown",
                "employeeEmail": employee.company_email if employee else "Unknown",
                "category": exp.category,
                "amount": exp.amount,
                "currency": exp.currency,
                "status": exp.status,
                "description": exp.description,
                "date": exp.expense_date.strftime("%Y-%m-%d"),
                "taxIncluded": exp.tax_included,
                "submitted_at": exp.created_at.strftime("%Y-%m-%d"),
                "attachments": attachments,
                "reason": manager_reason or "-",
                "discount_percentage": exp.discount_percentage,
                "cgst_percentage": exp.cgst_percentage,
                "sgst_percentage": exp.sgst_percentage,
                "final_amount": exp.final_amount,
            }
        )
   
    print(f"Completed /mgr-exp-list in {datetime.now() - start_time}")
    return result
 
@router.put("/mgr-upd-status/{request_id}")
def update_expense_status(
    request_id: int,
    manager_id: int = Form(...),
    status: str = Form(...),
    reason: str = Form(None),
    session: Session = Depends(get_session)
):
    """Update the status of an expense request by a manager."""
    print(f"Updating expense status: request_id={request_id}, manager_id={manager_id}, status={status}, reason={reason}")
   
    if status not in ["Pending", "Approved", "Rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
 
    expense = session.get(ExpenseRequest, request_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
 
    # Verify manager authorization
    is_manager = session.exec(
        select(EmployeeManager).where(
            EmployeeManager.employee_id == expense.employee_id,
            EmployeeManager.manager_id == manager_id
        )
    ).first() is not None
    if not is_manager:
        raise HTTPException(status_code=403, detail="Unauthorized: Not the assigned manager")
 
    # Map frontend → DB statuses
    if status == "Pending":
        expense.status = "pending_manager_approval"
    elif status == "Approved":
        expense.status = "pending_hr_approval"
    elif status == "Rejected":
        expense.status = "mgr_rejected"
 
    expense.updated_at = datetime.utcnow()
    session.add(expense)
    session.commit()
    session.refresh(expense)
 
    history_entry = ExpenseHistory(
        request_id=request_id,
        action_by=manager_id,
        action_role="Manager",
        action=status,
        reason=reason
    )
    session.add(history_entry)
    session.commit()
 
    print(f"Expense status updated: request_id={request_id}, new_status={expense.status}")
    return {
        "message": "Manager Status updated",
        "request_id": expense.request_id,
        "new_status": expense.status
    }
 
@router.get("/hr-exp-list", response_model=List[dict])
def list_all_expenses(
    request: Request,
    session: Session = Depends(get_session),
    hr_id: int = Query(..., description="HR ID"),
    year: int = Query(..., description="Year of expenses"),
    month: int = Query(..., description="Month of expenses"),
):
    """List expenses for employees under an HR, returning attachment metadata only."""
    print(f"Fetching expenses for hr_id={hr_id}, year={year}, month={month}")
   
    start_time = datetime.now()
    employee_ids = session.exec(
        select(EmployeeHR.employee_id).where(EmployeeHR.hr_id == hr_id)
    ).all()
    print(f"Fetched employee_ids in {datetime.now() - start_time}")
 
    employee_links = [e[0] if isinstance(e, tuple) else e for e in employee_ids]
    if not employee_links:
        print("No employees found for HR")
        return []
 
    expenses = session.exec(
        select(ExpenseRequest).where(
            ExpenseRequest.employee_id.in_(employee_links),
            ExpenseRequest.status.in_([
                "pending_account_mgr_approval",
                "pending_hr_approval",
                "hr_rejected",
                "approved",
                "carried_forward"
            ]),
            func.extract("year", ExpenseRequest.created_at) == year,
            func.extract("month", ExpenseRequest.created_at) == month,
            # ExpenseRequest.deleted_at.is_(None)  # Handle soft deletes
        ).order_by(ExpenseRequest.created_at.desc())
    ).all()
    print(f"Fetched {len(expenses)} expenses in {datetime.now() - start_time}")
 
    result = []
    for exp in expenses:
        employee = session.get(User, exp.employee_id)
 
        attachments = [
            {
                "attachment_id": att.attachment_id,
                "file_name": att.file_name,
                "file_url": att.file_url,
                "file_type": att.file_type,
                "file_size": att.file_size,
                "uploaded_at": att.uploaded_at,
            }
            for att in exp.attachments
        ]
 
        history_entries = session.exec(
            select(ExpenseHistory)
            .where(ExpenseHistory.request_id == exp.request_id)
            .order_by(ExpenseHistory.created_at.asc())
        ).all()
 
        hr_reason = None
        for h in history_entries:
            if h.action_role == "HR" and h.reason:
                hr_reason = h.reason
 
        result.append(
            {
                "id": exp.request_id,
                "employeeName": employee.name if employee else "Unknown",
                "employeeEmail": employee.company_email if employee else "Unknown",
                "category": exp.category,
                "amount": exp.amount,
                "currency": exp.currency,
                "status": exp.status,
                "description": exp.description,
                "date": exp.expense_date.strftime("%Y-%m-%d"),
                "taxIncluded": exp.tax_included,
                "submitted_at": exp.created_at.strftime("%Y-%m-%d"),
                "attachments": attachments,
                "reason": hr_reason or "-",
                "discount_percentage": exp.discount_percentage,
                "cgst_percentage": exp.cgst_percentage,
                "sgst_percentage": exp.sgst_percentage,
                "final_amount": exp.final_amount,
            }
        )
 
    print(f"Completed /hr-exp-list in {datetime.now() - start_time}")
    return result
 
@router.put("/hr-upd-status/{request_id}")
def update_hr_status(
    request_id: int,
    hr_id: int = Form(...),
    status: str = Form(...),
    reason: str = Form(None),
    session: Session = Depends(get_session),
):
    """Update the status of an expense request by HR."""
    print(f"Updating expense status: request_id={request_id}, hr_id={hr_id}, status={status}, reason={reason}")
   
    if status not in ["Pending", "Approved", "Rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
 
    expense = session.get(ExpenseRequest, request_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
 
    # Verify HR authorization
    is_hr = session.exec(
        select(EmployeeHR).where(
            EmployeeHR.employee_id == expense.employee_id,
            EmployeeHR.hr_id == hr_id
        )
    ).first() is not None
    if not is_hr:
        raise HTTPException(status_code=403, detail="Unauthorized: Not the assigned HR")
 
    # Map frontend → DB statuses
    if status == "Pending":
        expense.status = "pending_hr_approval"
    elif status == "Approved":
        expense.status = "pending_account_mgr_approval"
    elif status == "Rejected":
        expense.status = "hr_rejected"
 
    expense.updated_at = datetime.utcnow()
    session.add(expense)
    session.commit()
    session.refresh(expense)
 
    history_entry = ExpenseHistory(
        request_id=request_id,
        action_by=hr_id,
        action_role="HR",
        action=status,
        reason=reason
    )
    session.add(history_entry)
    session.commit()
 
    print(f"Expense status updated: request_id={request_id}, new_status={expense.status}")
    return {
        "message": "HR status updated",
        "request_id": expense.request_id,
        "new_status": expense.status
    }
 
@router.get("/acc-mgr-exp-list", response_model=List[dict])
def list_acc_mgr_expenses(
    request: Request,
    session: Session = Depends(get_session),
    acc_mgr_id: int = Query(..., description="Account Manager ID"),
    year: int = Query(..., description="Year of expenses"),
    month: int = Query(..., description="Month of expenses"),
):
    """List expenses for employees in the same location as the account manager, returning attachment metadata only."""
    print(f"Fetching expenses for acc_mgr_id={acc_mgr_id}, year={year}, month={month}")
   
    start_time = datetime.now()
    acc_mgr = session.get(User, acc_mgr_id)
    if not acc_mgr or not acc_mgr.location_id:
        print("No account manager found or missing location_id")
        return []
 
    expenses = session.exec(
        select(ExpenseRequest)
        .join(User, User.id == ExpenseRequest.employee_id)
        .where(
            User.location_id == acc_mgr.location_id,
            ExpenseRequest.status.in_([
                "pending_account_mgr_approval",
                "approved",
                "acc_mgr_rejected"
            ]),
            func.extract("year", ExpenseRequest.created_at) == year,
            func.extract("month", ExpenseRequest.created_at) == month,
            ExpenseRequest.deleted_at.is_(None)  # Handle soft deletes
        )
        .order_by(ExpenseRequest.created_at.desc())
    ).all()
    print(f"Fetched {len(expenses)} expenses in {datetime.now() - start_time}")
 
    result = []
    for exp in expenses:
        employee = session.get(User, exp.employee_id)
 
        attachments = [
            {
                "attachment_id": att.attachment_id,
                "file_name": att.file_name,
                "file_url": att.file_url,
                "file_type": att.file_type,
                "file_size": att.file_size,
                "uploaded_at": att.uploaded_at,
            }
            for att in exp.attachments
        ]
 
        history_entries = session.exec(
            select(ExpenseHistory)
            .where(ExpenseHistory.request_id == exp.request_id)
            .order_by(ExpenseHistory.created_at.asc())
        ).all()
 
        acc_mgr_reason = None
        for h in history_entries:
            if h.action_role == "Account Manager" and h.reason:
                acc_mgr_reason = h.reason
 
        result.append(
            {
                "id": exp.request_id,
                "employeeName": employee.name if employee else "Unknown",
                "employeeEmail": employee.company_email if employee else "Unknown",
                "category": exp.category,
                "amount": exp.amount,
                "currency": exp.currency,
                "status": exp.status,
                "description": exp.description,
                "date": exp.expense_date.strftime("%Y-%m-%d"),
                "taxIncluded": exp.tax_included,
                "submitted_at": exp.created_at.strftime("%Y-%m-%d"),
                "attachments": attachments,
                "reason": acc_mgr_reason or "-",
                "discount_percentage": exp.discount_percentage,
                "cgst_percentage": exp.cgst_percentage,
                "sgst_percentage": exp.sgst_percentage,
                "final_amount": exp.final_amount,
            }
        )
 
    print(f"Completed /acc-mgr-exp-list in {datetime.now() - start_time}")
    return result
 
@router.put("/acc-mgr-upd-status/{request_id}")
def update_acc_mgr_status(
    request_id: int,
    acc_mgr_id: int = Form(...),
    status: str = Form(...),
    reason: str = Form(None),
    session: Session = Depends(get_session),
):
    """Update the status of an expense request by an account manager."""
    print(f"Updating expense status: request_id={request_id}, acc_mgr_id={acc_mgr_id}, status={status}, reason={reason}")
   
    if status not in ["Pending", "Approved", "Rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
 
    expense = session.get(ExpenseRequest, request_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
 
    # Verify account manager authorization (same location as employee)
    employee = session.get(User, expense.employee_id)
    acc_mgr = session.get(User, acc_mgr_id)
    if not employee or not acc_mgr or employee.location_id != acc_mgr.location_id:
        raise HTTPException(status_code=403, detail="Unauthorized: Account manager not in same location as employee")
 
    # Map frontend → DB statuses
    if status == "Pending":
        expense.status = "pending_account_mgr_approval"
    elif status == "Approved":
        expense.status = "approved"
    elif status == "Rejected":
        expense.status = "acc_mgr_rejected"
        expense.account_mgr_rejection_reason = reason
 
    expense.updated_at = datetime.utcnow()
    session.add(expense)
    session.commit()
    session.refresh(expense)
 
    history_entry = ExpenseHistory(
        request_id=request_id,
        action_by=acc_mgr_id,
        action_role="Account Manager",
        action=status,
        reason=reason
    )
    session.add(history_entry)
    session.commit()
 
    print(f"Expense status updated: request_id={request_id}, new_status={expense.status}")
    return {
        "message": "Account Manager status updated",
        "request_id": expense.request_id,
        "new_status": expense.status
    }
 
# @router.get("/attachment/{attachment_id}/access", response_model=dict)
# async def get_attachment_access(
#     attachment_id: int,
#     user_id: int = Query(..., description="User ID"),
#     session: Session = Depends(get_session),
# ):
#     """Generate a temporary SAS URL for an attachment, accessible to the employee who created the expense, their manager, HR, or Account Manager."""
#     # Fetch user from database
#     user = session.get(User, user_id)
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")
 
#     attachment = session.get(ExpenseAttachment, attachment_id)
#     if not attachment:
#         raise HTTPException(status_code=404, detail="Attachment not found")
 
#     # Get the associated expense request
#     expense = session.get(ExpenseRequest, attachment.request_id)
#     if not expense:
#         raise HTTPException(status_code=404, detail="Expense request not found")
 
#     # Check authorization
#     is_employee = user.id == expense.employee_id
#     is_manager = session.exec(
#         select(EmployeeManager).where(
#             EmployeeManager.employee_id == expense.employee_id,
#             EmployeeManager.manager_id == user.id
#         )
#     ).first() is not None
#     is_authorized_role = user.role in ["HR", "Account Manager"]
 
#     if not (is_employee or is_manager or is_authorized_role):
#         raise HTTPException(status_code=403, detail="Unauthorized to access attachment")
 
#     # Extract blob name from file_url
#     blob_name = attachment.file_url.split(f"/{AZURE_CONTAINER_NAME}/")[-1]
 
#     # Generate SAS token (valid for 1 hour)
#     sas_token = generate_blob_sas(
#         account_name=blob_service_client.account_name,
#         container_name=AZURE_CONTAINER_NAME,
#         blob_name=blob_name,
#         account_key=blob_service_client.credential.account_key,
#         permission=BlobSasPermissions(read=True),
#         expiry=datetime.utcnow() + timedelta(hours=1)
#     )
 
#     # Construct SAS URL
#     sas_url = f"https://{blob_service_client.account_name}.blob.core.windows.net/{AZURE_CONTAINER_NAME}/{blob_name}…
 
#     return {
#         "attachment_id": attachment.attachment_id,
#         "file_name": attachment.file_name,
#         "file_url": sas_url,
#         "file_type": attachment.file_type,
#         "file_size": attachment.file_size,
#         "uploaded_at": attachment.uploaded_at,
#     }
 
@router.delete("/{request_id}", response_model=dict)
async def delete_expense(
    request_id: int,
    user_id: int = Query(..., description="User ID"),
    session: Session = Depends(get_session),
):
    """Delete an expense request and its attachments, accessible to the employee who created it, HR, or Account Manager (for pending_manager_approval)."""
    try:
        # Fetch user from database
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
 
        # Fetch expense request
        expense = session.get(ExpenseRequest, request_id)
        if not expense:
            raise HTTPException(status_code=404, detail="Expense request not found")
 
        # Check authorization
        is_employee = user.id == expense.employee_id
        is_hr = user.role == "HR"
        is_account_manager = user.role == "Account Manager"
        can_delete = (
            (is_employee and expense.status in ["pending_manager_approval"]) or
            is_hr or
            (is_account_manager and expense.status == "pending_manager_approval")
        )
        if not can_delete:
            raise HTTPException(status_code=403, detail="Unauthorized to delete expense")
 
        print(f"Deleting expense request_id={request_id}, user_id={user_id}, role={user.role}")
 
        # 1. Delete expense_history records first (to satisfy foreign key constraint)
        history_records = session.exec(
            select(ExpenseHistory).where(ExpenseHistory.request_id == request_id)
        ).all()
        for history in history_records:
            session.delete(history)
        print(f"Deleted {len(history_records)} history records for request_id={request_id}")
 
        # 2. Fetch and delete attachments from database and Azure Blob Storage
        attachments = session.exec(
            select(ExpenseAttachment).where(ExpenseAttachment.request_id == request_id)
        ).all()
 
        for attachment in attachments:
            # Delete from Azure Blob Storage
            try:
                blob_name = attachment.file_url.split(f"/{AZURE_CONTAINER_NAME}/")[-1]
                blob_client = container_client.get_blob_client(blob_name)
                blob_client.delete_blob()
                print(f"Deleted blob: {blob_name}")
            except Exception as e:
                print(f"Failed to delete blob {blob_name}: {str(e)}")
                # Continue even if blob deletion fails
 
            # Delete from database
            session.delete(attachment)
 
        print(f"Deleted {len(attachments)} attachments for request_id={request_id}")
 
        # 3. Record deletion in history (before deleting the expense)
        history_entry = ExpenseHistory(
            request_id=request_id,
            action_by=user.id,
            action_role=user.role,
            action="Deleted",
            reason=f"Expense deleted by {user.role}",
            created_at=datetime.utcnow()
        )
        session.add(history_entry)
 
        # 4. Delete expense request
        session.delete(expense)
        session.commit()
 
        print(f"Expense deleted successfully: request_id={request_id}, user_id={user_id}, role={user.role}")
        return {
            "message": "Expense deleted successfully",
            "request_id": request_id
        }
 
    except Exception as e:
        session.rollback()
        print(f"Error deleting expense request_id={request_id}: {str(e)}\nSQL: {e.__cause__}")
        raise HTTPException(status_code=500, detail=f"Failed to delete expense: {str(e)}")