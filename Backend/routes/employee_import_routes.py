from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_session
from auth import get_current_user
from models.user_model import User
from services.employee_import_service import EmployeeImportService
import tempfile
import os

router = APIRouter(prefix="/employee-import", tags=["Employee Import"])

@router.post("/import")
async def import_employees(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Upload Excel file for bulk import of employees
    """
    # Check if user has permission (Admin or HR only)
    if current_user.role not in ["Admin", "HR"]:
        raise HTTPException(status_code=403, detail="Access denied: Admin or HR only")
    
    # Validate file type
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Only Excel files (.xlsx, .xls) are allowed")
    
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_file_path = tmp_file.name
    
    try:
        # Import employees
        result = EmployeeImportService.import_employees_from_excel(tmp_file_path, session)
        
        return {
            "success": result["success"],
            "message": result["message"],
            "imported": result.get("imported", 0),
            "updated": result.get("updated", 0),
            "errors": result.get("errors", 0),
            "error_details": result.get("error_details", [])
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
    
    finally:
        # Clean up temporary file
        if os.path.exists(tmp_file_path):
            os.unlink(tmp_file_path)

@router.get("/template")
async def download_template(current_user: User = Depends(get_current_user)):
    """
    Download Excel template for employee import
    """
    # Check if user has permission (Admin or HR only)
    if current_user.role not in ["Admin", "HR"]:
        raise HTTPException(status_code=403, detail="Access denied: Admin or HR only")
    
    # Create template data
    template_data = {
        'YTPL Emp ID': ['100013', '100014', '100015'],
        'Employee Full Name': ['John Doe', 'Jane Smith', 'Mike Johnson'],
        'Title': ['Software Engineer', 'Senior Developer', 'Project Manager'],
        'Location': ['Hyderabad', 'Bangalore', 'Mumbai'],
        'Company Email': ['john.doe@company.com', 'jane.smith@company.com', 'mike.johnson@company.com']
    }
    
    # Create Excel file
    import pandas as pd
    import io
    
    df = pd.DataFrame(template_data)
    
    # Create Excel file in memory
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Employees')
    
    output.seek(0)
    
    return {
        "filename": "employee_import_template.xlsx",
        "content": output.getvalue(),
        "content_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }
