from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List, Optional
from database import get_session
from models.asset_model import Vendor, Asset, AssetAllocation, AssetMaintenance
from schemas.asset_schema import (
    VendorCreate, VendorUpdate, VendorResponse,
    AssetCreate, AssetUpdate, AssetResponse,
    AssetAllocationCreate, AssetAllocationUpdate, AssetAllocationResponse,
    AssetMaintenanceCreate, AssetMaintenanceUpdate, AssetMaintenanceResponse
)
from models.user_model import User
from schemas.user_schema import Employee
from auth import get_current_user

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


@router.get("/employees/", response_model=List[Employee])
async def get_employees(o_status: Optional[bool] = True, role: Optional[str] = None, db: Session = Depends(get_session)):
    query = select(User).where(User.o_status == o_status)
    if role:
        query = query.where(User.role == role)
    employees = db.exec(query).all()
    return [
        Employee(
            employeeId=emp.id,
            name=emp.name,
            email=emp.email,
            role=emp.role,
            hrs=[],
            managers=[]
        )
        for emp in employees
    ]

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