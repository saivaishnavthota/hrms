from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlmodel import Session, select
from typing import List, Optional
from database import get_session
from models.asset_model import Vendor, Asset, AssetAllocation, AssetMaintenance
from models.user_model import User as EmployeeModel
from schemas.asset_schema import (
    VendorCreate, VendorUpdate, VendorResponse,
    AssetCreate, AssetUpdate, AssetResponse,
    AssetAllocationCreate, AssetAllocationUpdate, AssetAllocationResponse,
    AssetMaintenanceCreate, AssetMaintenanceUpdate, AssetMaintenanceResponse
)
from models.user_model import User
from schemas.user_schema import Employee as EmployeeSchema
from auth import get_current_user
import csv
from io import StringIO
from datetime import datetime

router = APIRouter(prefix="/assets", tags=["Assets"])

@router.post("/vendors/", response_model=VendorResponse, status_code=201)
def create_vendor(vendor: VendorCreate, session: Session = Depends(get_session)):
    db_vendor = Vendor(**vendor.dict())
    session.add(db_vendor)
    session.commit()
    session.refresh(db_vendor)
    return VendorResponse.from_orm(db_vendor)

@router.get("/vendors/", response_model=List[VendorResponse])
def get_vendors(
    session: Session = Depends(get_session),
    vendor_type: Optional[str] = Query(None, description="Filter by vendor type (Purchased/Rental)")
):
    query = select(Vendor)
    if vendor_type:
        query = query.where(Vendor.vendor_type == vendor_type)
    return [VendorResponse.from_orm(v) for v in session.exec(query).all()]

@router.get("/vendors/{vendor_id}", response_model=VendorResponse)
def get_vendor(vendor_id: int, session: Session = Depends(get_session)):
    vendor = session.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return VendorResponse.from_orm(vendor)

@router.put("/vendors/{vendor_id}", response_model=VendorResponse)
def update_vendor(vendor_id: int, vendor: VendorUpdate, session: Session = Depends(get_session)):
    db_vendor = session.get(Vendor, vendor_id)
    if not db_vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    for key, value in vendor.dict(exclude_unset=True).items():
        setattr(db_vendor, key, value)
    session.commit()
    session.refresh(db_vendor)
    return VendorResponse.from_orm(db_vendor)

@router.delete("/vendors/{vendor_id}", status_code=204)
def delete_vendor(vendor_id: int, session: Session = Depends(get_session)):
    vendor = session.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    session.delete(vendor)
    session.commit()
    return None

@router.post("/assets/", response_model=AssetResponse, status_code=201)
def create_asset(asset: AssetCreate, session: Session = Depends(get_session)):
    existing_asset = session.exec(select(Asset).where((Asset.asset_tag == asset.asset_tag) | (Asset.serial_number == asset.serial_number))).first()
    if existing_asset:
        raise HTTPException(status_code=400, detail="Asset tag or serial number already exists")
    if asset.vendor_id:
        vendor = session.get(Vendor, asset.vendor_id)
        if not vendor:
            raise HTTPException(status_code=400, detail="Vendor not found")
    db_asset = Asset(**asset.dict())
    session.add(db_asset)
    session.commit()
    session.refresh(db_asset)
    return AssetResponse.from_orm(db_asset)

@router.get("/assets/", response_model=List[AssetResponse])
def get_assets(
    session: Session = Depends(get_session),
    status: Optional[str] = Query(None, description="Filter by status"),
    asset_type: Optional[str] = Query(None, description="Filter by asset type")
):
    query = select(Asset)
    if status:
        query = query.where(Asset.status == status)
    if asset_type:
        query = query.where(Asset.asset_type.ilike(f"%{asset_type}%"))
    return [AssetResponse.from_orm(a) for a in session.exec(query).all()]

@router.get("/assets/{asset_id}", response_model=AssetResponse)
def get_asset(asset_id: int, session: Session = Depends(get_session)):
    asset = session.get(Asset, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return AssetResponse.from_orm(asset)

@router.post("/assets/bulk-upload", response_model=dict)
def bulk_upload_assets(
    file: UploadFile = File(..., description="CSV file with asset records"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ["Admin", "IT Supporter", "HR", "Manager"]:
        raise HTTPException(status_code=403, detail="Access denied")

    raw = file.file.read().decode("utf-8-sig")
    reader = csv.DictReader(StringIO(raw))

    def norm(key: str) -> str:
        return (key or "").strip().lower().replace(" ", "_")

    # Build header map for tolerant matching
    header_map = {norm(h): h for h in reader.fieldnames or []}

    def get(row, *candidates):
        for cand in candidates:
            h = header_map.get(norm(cand))
            if h and h in row and str(row[h]).strip() != "":
                return str(row[h]).strip()
        return None

    def parse_date(val: str):
        if not val:
            return None
        for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y"):
            try:
                return datetime.strptime(val, fmt).date()
            except Exception:
                continue
        return None

    created = 0
    updated = 0
    skipped = 0
    errors = []

    for idx, row in enumerate(reader, start=2):  # start=2 accounts for header row
        try:
            asset_name = get(row, "asset_name", "asset_nam")
            asset_type = get(row, "asset_type")
            asset_tag = get(row, "asset_tag")
            serial_number = get(row, "serial_number", "serial_num")

            if not asset_name or not asset_type or not asset_tag or not serial_number:
                skipped += 1
                errors.append(f"Row {idx}: Missing required fields (asset_name, asset_type, asset_tag, serial_number)")
                continue

            # Resolve vendor
            vendor_name = get(row, "vendor_name")
            vendor_type = get(row, "vendor_type")
            vendor_id = None
            if vendor_name:
                vendor = session.exec(
                    select(Vendor).where(Vendor.vendor_name == vendor_name)
                ).first()
                if not vendor:
                    vendor = Vendor(
                        vendor_name=vendor_name,
                        vendor_type=vendor_type if vendor_type in ("Purchased", "Rental") else None,
                    )
                    session.add(vendor)
                    session.flush()
                vendor_id = vendor.vendor_id

            # Prepare asset fields
            asset_data = {
                "asset_name": asset_name,
                "asset_type": asset_type,
                "asset_tag": asset_tag,
                "serial_number": serial_number,
                "brand": get(row, "brand"),
                "model": get(row, "model"),
                "model_no": get(row, "model_no"),
                "operating_system": get(row, "operating_system", "os"),
                "ram": get(row, "ram", "operating_ram"),
                "hdd_capacity": get(row, "hdd_capacity", "storage"),
                "processor": get(row, "processor"),
                "purchase_date": parse_date(get(row, "purchase_date")),
                "purchase_price": float(get(row, "purchase_price") or 0) or None,
                "vendor_id": vendor_id,
                "status": get(row, "status") or "In Stock",
                "condition": get(row, "condition") or "Good",
                "eol_date": parse_date(get(row, "eol_date")),
                "amc_start_date": parse_date(get(row, "amc_start_date")),
                "amc_end_date": parse_date(get(row, "amc_end_date")),
                "rental_cost": float(get(row, "rental_cost") or 0) or None,
                "administrator": get(row, "administrator"),
                "additional_notes": get(row, "notes", "additional_notes"),
            }

            # Upsert by asset_tag or serial_number
            existing = session.exec(
                select(Asset).where(
                    (Asset.asset_tag == asset_tag) | (Asset.serial_number == serial_number)
                )
            ).first()

            if existing:
                for k, v in asset_data.items():
                    setattr(existing, k, v)
                session.add(existing)
                updated += 1
            else:
                obj = Asset(**asset_data)
                session.add(obj)
                created += 1

        except Exception as e:
            errors.append(f"Row {idx}: {str(e)}")
            skipped += 1

    session.commit()

    return {
        "success": True,
        "created": created,
        "updated": updated,
        "skipped": skipped,
        "errors": errors[:20],  # cap details
    }

@router.post("/allocations/bulk-upload", response_model=dict)
def bulk_upload_allocations(
    file: UploadFile = File(..., description="CSV file with asset allocations"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ["Admin", "IT Supporter", "HR", "Manager"]:
        raise HTTPException(status_code=403, detail="Access denied")

    raw = file.file.read().decode("utf-8-sig")
    reader = csv.DictReader(StringIO(raw))

    def norm(key: str) -> str:
        return (key or "").strip().lower().replace(" ", "_")

    header_map = {norm(h): h for h in reader.fieldnames or []}

    def get(row, *candidates):
        for cand in candidates:
            h = header_map.get(norm(cand))
            if h and h in row and str(row[h]).strip() != "":
                return str(row[h]).strip()
        return None

    def parse_bool(val: str):
        if val is None:
            return None
        v = val.strip().lower()
        if v in ("true", "yes", "1", "y"):
            return True
        if v in ("false", "no", "0", "n"):
            return False
        return None

    def parse_date(val: str):
        if not val:
            return None
        for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y"):
            try:
                return datetime.strptime(val, fmt).date()
            except Exception:
                continue
        return None

    created = 0
    updated = 0
    skipped = 0
    errors = []

    for idx, row in enumerate(reader, start=2):
        try:
            asset_tag = get(row, "asset_tag")
            # Prefer mapping by company_employee_id to avoid mistakes
            employee_company_id_raw = get(row, "employee_id", "company_employee_id", "ytpl_emp_id")
            allocation_date = parse_date(get(row, "allocation_date"))
            expected_return_date = parse_date(get(row, "expected_return_date"))
            condition_at_allocation = get(row, "condition_at_allocation")
            employee_ack = parse_bool(get(row, "employee_ack"))
            notes = get(row, "notes")

            if not asset_tag or not employee_company_id_raw or not allocation_date:
                skipped += 1
                errors.append(f"Row {idx}: Missing required fields (asset_tag, employee_company_id, allocation_date)")
                continue

            # Resolve asset
            asset = session.exec(select(Asset).where(Asset.asset_tag == asset_tag)).first()
            if not asset:
                skipped += 1
                errors.append(f"Row {idx}: Asset with tag '{asset_tag}' not found")
                continue

            # Resolve employee STRICTLY by company_employee_id (normalize and zero-pad)
            clean_comp_id = employee_company_id_raw
            # Remove trailing .0 if present and whitespace
            if clean_comp_id.endswith('.0'):
                clean_comp_id = clean_comp_id[:-2]
            clean_comp_id = clean_comp_id.strip()
            # Keep only integer part if like 800105.0
            if '.' in clean_comp_id:
                clean_comp_id = clean_comp_id.split('.')[0]
            # Zero-pad to 6 characters
            if len(clean_comp_id) < 6:
                clean_comp_id = clean_comp_id.zfill(6)

            emp_obj = session.exec(
                select(EmployeeModel).where(EmployeeModel.company_employee_id == clean_comp_id)
            ).first()

            if not emp_obj:
                skipped += 1
                errors.append(f"Row {idx}: Employee with company_employee_id '{employee_company_id_raw}' (normalized='{clean_comp_id}') not found")
                continue

            # Idempotent upsert: unique by (asset_id, employee_id, allocation_date)
            existing = session.exec(
                select(AssetAllocation).where(
                    (AssetAllocation.asset_id == asset.asset_id)
                    & (AssetAllocation.employee_id == emp_obj.id)
                    & (AssetAllocation.allocation_date == allocation_date)
                )
            ).first()

            if existing:
                existing.expected_return_date = expected_return_date
                existing.condition_at_allocation = condition_at_allocation or existing.condition_at_allocation
                if employee_ack is not None:
                    existing.employee_ack = employee_ack
                existing.notes = notes or existing.notes
                session.add(existing)
                updated += 1
            else:
                alloc = AssetAllocation(
                    asset_id=asset.asset_id,
                    employee_id=emp_obj.id,
                    allocation_date=allocation_date,
                    expected_return_date=expected_return_date,
                    condition_at_allocation=condition_at_allocation,
                    employee_ack=bool(employee_ack) if employee_ack is not None else False,
                    notes=notes,
                )
                session.add(alloc)
                created += 1

            # Optionally mark asset status when allocated
            if asset.status != "Allocated":
                asset.status = "Allocated"
                session.add(asset)

        except Exception as e:
            skipped += 1
            errors.append(f"Row {idx}: {str(e)}")

    session.commit()

    return {
        "success": True,
        "created": created,
        "updated": updated,
        "skipped": skipped,
        "errors": errors[:20],
    }

@router.put("/assets/{asset_id}", response_model=AssetResponse)
def update_asset(asset_id: int, asset: AssetUpdate, session: Session = Depends(get_session)):
    db_asset = session.get(Asset, asset_id)
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    if asset.asset_tag:
        existing_asset = session.exec(select(Asset).where(Asset.asset_tag == asset.asset_tag, Asset.asset_id != asset_id)).first()
        if existing_asset:
            raise HTTPException(status_code=400, detail="Asset tag already exists")
    if asset.serial_number:
        existing_asset = session.exec(select(Asset).where(Asset.serial_number == asset.serial_number, Asset.asset_id != asset_id)).first()
        if existing_asset:
            raise HTTPException(status_code=400, detail="Serial number already exists")
    if asset.vendor_id:
        vendor = session.get(Vendor, asset.vendor_id)
        if not vendor:
            raise HTTPException(status_code=400, detail="Vendor not found")
    for key, value in asset.dict(exclude_unset=True).items():
        setattr(db_asset, key, value)
    session.commit()
    session.refresh(db_asset)
    return AssetResponse.from_orm(db_asset)

@router.delete("/assets/{asset_id}", status_code=204)
def delete_asset(asset_id: int, session: Session = Depends(get_session)):
    asset = session.get(Asset, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    session.delete(asset)
    session.commit()
    return None

@router.post("/allocations/", response_model=AssetAllocationResponse, status_code=201)
def create_allocation(allocation: AssetAllocationCreate, session: Session = Depends(get_session)):
    asset = session.get(Asset, allocation.asset_id)
    if not asset:
        raise HTTPException(status_code=400, detail="Asset not found")
    employee = session.get(User, allocation.employee_id)
    if not employee:
        raise HTTPException(status_code=400, detail="Employee not found")
    db_allocation = AssetAllocation(**allocation.dict())
    session.add(db_allocation)
    session.commit()
    session.refresh(db_allocation)
    return AssetAllocationResponse.from_orm(db_allocation)

@router.get("/allocations/", response_model=List[AssetAllocationResponse])
def get_allocations(
    session: Session = Depends(get_session),
    asset_id: Optional[int] = Query(None, description="Filter by asset ID"),
    employee_id: Optional[int] = Query(None, description="Filter by employee ID")
):
    query = select(AssetAllocation)
    if asset_id:
        query = query.where(AssetAllocation.asset_id == asset_id)
    if employee_id:
        query = query.where(AssetAllocation.employee_id == employee_id)
    return [AssetAllocationResponse.from_orm(a) for a in session.exec(query).all()]

@router.get("/allocations/detailed/", response_model=List[dict])
def get_detailed_allocations(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    status: Optional[str] = Query(None, description="Filter by allocation status")
):
    """
    Get asset allocations with detailed employee and asset information
    - Super-HR sees all allocations
    - Regular HR sees only allocations of employees assigned to them
    """
    
    # Check if user is Super-HR
    is_super_hr = current_user.role == 'HR' and current_user.super_hr == True
    
    # Join allocations with assets and users
    query = select(
        AssetAllocation,
        Asset,
        User
    ).join(
        Asset, AssetAllocation.asset_id == Asset.asset_id
    ).join(
        User, AssetAllocation.employee_id == User.id
    )
    
    # Filter by HR assignment if not Super-HR
    if not is_super_hr:
        # Import EmployeeHR model
        from models.employee_assignment_model import EmployeeHR
        
        # Get employee IDs assigned to this HR
        hr_employee_ids = session.exec(
            select(EmployeeHR.employee_id).where(
                EmployeeHR.hr_id == current_user.id
            )
        ).all()
        
        # Filter allocations to only include employees assigned to this HR
        if hr_employee_ids:
            query = query.where(AssetAllocation.employee_id.in_(hr_employee_ids))
        else:
            # If no employees assigned, return empty list
            return []
    
    if status:
        query = query.where(AssetAllocation.status == status)
    
    results = session.exec(query).all()
    
    detailed_allocations = []
    for allocation, asset, employee in results:
        detailed_allocations.append({
            "allocation_id": allocation.allocation_id,
            "employee_id": allocation.employee_id,
            "employee_name": employee.name or "Unknown Employee",
            "asset_id": asset.asset_id,
            "asset_name": asset.asset_name,
            "asset_tag": asset.asset_tag,
            "asset_type": asset.asset_type,
            "brand": asset.brand,
            "model": asset.model,
            "serial_number": asset.serial_number,
            "condition": asset.condition,
            "allocation_date": allocation.allocation_date,
            "expected_return_date": allocation.expected_return_date,
            "actual_return_date": allocation.actual_return_date,
            "condition_at_allocation": allocation.condition_at_allocation,
            "employee_ack": allocation.employee_ack,
            "notes": allocation.notes,
           
        })
    
    return detailed_allocations

@router.put("/allocations/{allocation_id}", response_model=AssetAllocationResponse)
def update_allocation(allocation_id: int, allocation: AssetAllocationUpdate, session: Session = Depends(get_session)):
    db_allocation = session.get(AssetAllocation, allocation_id)
    if not db_allocation:
        raise HTTPException(status_code=404, detail="Allocation not found")
    if allocation.asset_id:
        asset = session.get(Asset, allocation.asset_id)
        if not asset:
            raise HTTPException(status_code=400, detail="Asset not found")
    if allocation.employee_id:
        employee = session.get(User, allocation.employee_id)
        if not employee:
            raise HTTPException(status_code=400, detail="Employee not found")
    for key, value in allocation.dict(exclude_unset=True).items():
        setattr(db_allocation, key, value)
    session.commit()
    session.refresh(db_allocation)
    return AssetAllocationResponse.from_orm(db_allocation)

@router.delete("/allocations/{allocation_id}", status_code=204)
def delete_allocation(allocation_id: int, session: Session = Depends(get_session)):
    allocation = session.get(AssetAllocation, allocation_id)
    if not allocation:
        raise HTTPException(status_code=404, detail="Allocation not found")
    session.delete(allocation)
    session.commit()
    return None

@router.post("/maintenance/", response_model=AssetMaintenanceResponse, status_code=201)
def create_maintenance(maintenance: AssetMaintenanceCreate, session: Session = Depends(get_session)):
    asset = session.get(Asset, maintenance.asset_id)
    if not asset:
        raise HTTPException(status_code=400, detail="Asset not found")
    if maintenance.vendor_id:
        vendor = session.get(Vendor, maintenance.vendor_id)
        if not vendor:
            raise HTTPException(status_code=400, detail="Vendor not found")
    db_maintenance = AssetMaintenance(**maintenance.dict())
    session.add(db_maintenance)
    session.commit()
    session.refresh(db_maintenance)
    return AssetMaintenanceResponse.from_orm(db_maintenance)

@router.get("/maintenance/", response_model=List[AssetMaintenanceResponse])
def get_maintenance(
    session: Session = Depends(get_session),
    asset_id: Optional[int] = Query(None, description="Filter by asset ID"),
    maintenance_type: Optional[str] = Query(None, description="Filter by maintenance type")
):
    query = select(AssetMaintenance)
    if asset_id:
        query = query.where(AssetMaintenance.asset_id == asset_id)
    if maintenance_type:
        query = query.where(AssetMaintenance.maintenance_type == maintenance_type)
    return [AssetMaintenanceResponse.from_orm(m) for m in session.exec(query).all()]

@router.put("/maintenance/{maintenance_id}", response_model=AssetMaintenanceResponse)
def update_maintenance(maintenance_id: int, maintenance: AssetMaintenanceUpdate, session: Session = Depends(get_session)):
    db_maintenance = session.get(AssetMaintenance, maintenance_id)
    if not db_maintenance:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    if maintenance.asset_id:
        asset = session.get(Asset, maintenance.asset_id)
        if not asset:
            raise HTTPException(status_code=400, detail="Asset not found")
    if maintenance.vendor_id:
        vendor = session.get(Vendor, maintenance.vendor_id)
        if not vendor:
            raise HTTPException(status_code=400, detail="Vendor not found")
    for key, value in maintenance.dict(exclude_unset=True).items():
        setattr(db_maintenance, key, value)
    session.commit()
    session.refresh(db_maintenance)
    return AssetMaintenanceResponse.from_orm(db_maintenance)

@router.delete("/maintenance/{maintenance_id}", status_code=204)
def delete_maintenance(maintenance_id: int, session: Session = Depends(get_session)):
    maintenance = session.get(AssetMaintenance, maintenance_id)
    if not maintenance:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    session.delete(maintenance)
    session.commit()
    return None


@router.get("/test-db-connection")
async def test_db_connection(db: Session = Depends(get_session)):
    """Test endpoint to verify database connection and User table access"""
    try:
        from models.user_model import User
        from sqlmodel import text
        
        # Test basic database connection
        result = db.exec(text("SELECT 1")).first()
        print(f"Basic DB query result: {result}")
        
        # Test User table exists and has data
        user_count = db.exec(text("SELECT COUNT(*) FROM employees")).first()
        print(f"Total users in employees table: {user_count}")
        
        # Test SQLModel query
        users = db.exec(select(User)).all()
        print(f"SQLModel query found {len(users)} users")
        
        return {
            "status": "success",
            "basic_query": result,
            "user_count": user_count,
            "sqlmodel_count": len(users)
        }
    except Exception as e:
        print(f"Database test error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Database test failed: {str(e)}")


@router.get("/employees/", response_model=List[EmployeeSchema])
async def get_employees(o_status: Optional[bool] = True, role: Optional[str] = None, db: Session = Depends(get_session)):
    try:
        # Import User model here to avoid circular imports
        from models.user_model import User
        
        print(f"Fetching employees with o_status={o_status}, role={role}")
        
        query = select(User).where(User.o_status == o_status)
        if role:
            query = query.where(User.role == role)
        
        employees = db.exec(query).all()
        print(f"Found {len(employees)} employees in database")
        
        employee_list = []
        for emp in employees:
            try:
                print(f"Processing employee: ID={emp.id}, Name={emp.name}, Email={emp.email}, Role={emp.role}")
                
                # Handle None values safely
                employee_obj = EmployeeSchema(
                    employeeId=emp.id,
                    name=emp.name or "Unknown",
                    email=emp.email or emp.company_email or "No email",
                    role=emp.role or "Unknown",
                    hrs=[],
                    managers=[]
                )
                employee_list.append(employee_obj)
                print(f"Successfully created Employee object for {emp.name}")
            except Exception as e:
                # Log the error but continue with other employees
                print(f"Error creating Employee object for ID {emp.id}: {e}")
                continue
        
        print(f"Returning {len(employee_list)} employee objects")
        return employee_list
    except Exception as e:
        print(f"Error in get_employees endpoint: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching employees: {str(e)}")

@router.get("/employee/{employee_id}/assets", response_model=List[dict])
def get_employee_assets(employee_id: int, session: Session = Depends(get_session)):
    """
    Get all assets allocated to a specific employee with asset details
    """
    # Get allocations for the employee
    allocations = session.exec(
        select(AssetAllocation).where(AssetAllocation.employee_id == employee_id)
    ).all()
    
    employee_assets = []
    for allocation in allocations:
        # Get asset details
        asset = session.get(Asset, allocation.asset_id)
        if asset:
            employee_assets.append({
                "allocation_id": allocation.allocation_id,
                "asset_id": asset.asset_id,
                "asset_name": asset.asset_name,
                "asset_tag": asset.asset_tag,
                "asset_type": asset.asset_type,
                "brand": asset.brand,
                "model": asset.model,
                "serial_number": asset.serial_number,
                "condition": asset.condition,
                "allocation_date": allocation.allocation_date,
                "expected_return_date": allocation.expected_return_date,
                "actual_return_date": allocation.actual_return_date,
                "condition_at_allocation": allocation.condition_at_allocation,
                "employee_ack": allocation.employee_ack,
                "notes": allocation.notes,
                "status": asset.status
            })
    
    return employee_assets