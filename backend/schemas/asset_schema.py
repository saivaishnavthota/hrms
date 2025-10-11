from sqlmodel import SQLModel, Field
from typing import Optional, List
from datetime import date

class VendorCreate(SQLModel):
    vendor_name: str = Field(max_length=255, nullable=False)
    vendor_type: str = Field(max_length=20, regex="^(Purchased|Rental)$")
    contact_email: Optional[str] = Field(max_length=255, default=None)
    contact_phone: Optional[str] = Field(max_length=20, default=None)
    payment_terms: Optional[str] = Field(default=None)
    contract_start_date: Optional[date] = Field(default=None)
    contract_end_date: Optional[date] = Field(default=None)
    notes: Optional[str] = Field(default=None)

class VendorUpdate(SQLModel):
    vendor_name: Optional[str] = Field(max_length=255, default=None)
    vendor_type: Optional[str] = Field(max_length=20, regex="^(Purchased|Rental)$", default=None)
    contact_email: Optional[str] = Field(max_length=255, default=None)
    contact_phone: Optional[str] = Field(max_length=20, default=None)
    payment_terms: Optional[str] = Field(default=None)
    contract_start_date: Optional[date] = Field(default=None)
    contract_end_date: Optional[date] = Field(default=None)
    notes: Optional[str] = Field(default=None)

class VendorResponse(SQLModel):
    vendor_id: int
    vendor_name: str
    vendor_type: str
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    payment_terms: Optional[str] = None
    contract_start_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    notes: Optional[str] = None

class AssetCreate(SQLModel):
    asset_name: str = Field(max_length=255, nullable=False)
    asset_tag: str = Field(max_length=100, nullable=False)
    asset_type: str = Field(max_length=50, nullable=False)
    brand: Optional[str] = Field(max_length=100, default=None)
    model: Optional[str] = Field(max_length=100, default=None)
    model_no: Optional[str] = Field(max_length=100, default=None)
    serial_number: str = Field(max_length=100, nullable=False)
    purchase_date: Optional[date] = Field(default=None)
    eol_date: Optional[date] = Field(default=None)
    amc_start_date: Optional[date] = Field(default=None)
    amc_end_date: Optional[date] = Field(default=None)
    purchase_price: Optional[float] = Field(default=None, ge=0)
    rental_cost: Optional[float] = Field(default=None, ge=0)
    vendor_id: Optional[int] = Field(default=None)
    status: str = Field(max_length=20, regex="^(In Stock|Allocated|Under Repair|Scrapped|Returned)$")
    condition: str = Field(max_length=20, regex="^(New|Good|Fair|Damaged)$")
    operating_system: Optional[str] = Field(max_length=100, default=None)
    ram: Optional[str] = Field(max_length=50, default=None)
    hdd_capacity: Optional[str] = Field(max_length=50, default=None)
    processor: Optional[str] = Field(max_length=100, default=None)
    administrator: Optional[str] = Field(max_length=255, default=None)
    additional_notes: Optional[str] = Field(default=None)

class AssetUpdate(SQLModel):
    asset_name: Optional[str] = Field(max_length=255, default=None)
    asset_tag: Optional[str] = Field(max_length=100, default=None)
    asset_type: Optional[str] = Field(max_length=50, default=None)
    brand: Optional[str] = Field(max_length=100, default=None)
    model: Optional[str] = Field(max_length=100, default=None)
    model_no: Optional[str] = Field(max_length=100, default=None)
    serial_number: Optional[str] = Field(max_length=100, default=None)
    purchase_date: Optional[date] = Field(default=None)
    eol_date: Optional[date] = Field(default=None)
    amc_start_date: Optional[date] = Field(default=None)
    amc_end_date: Optional[date] = Field(default=None)
    purchase_price: Optional[float] = Field(default=None, ge=0)
    rental_cost: Optional[float] = Field(default=None, ge=0)
    vendor_id: Optional[int] = Field(default=None)
    status: Optional[str] = Field(max_length=20, regex="^(In Stock|Allocated|Under Repair|Scrapped|Returned)$", default=None)
    condition: Optional[str] = Field(max_length=20, regex="^(New|Good|Fair|Damaged)$", default=None)
    operating_system: Optional[str] = Field(max_length=100, default=None)
    ram: Optional[str] = Field(max_length=50, default=None)
    hdd_capacity: Optional[str] = Field(max_length=50, default=None)
    processor: Optional[str] = Field(max_length=100, default=None)
    administrator: Optional[str] = Field(max_length=255, default=None)
    additional_notes: Optional[str] = Field(default=None)

class AssetResponse(SQLModel):
    asset_id: int
    asset_name: str
    asset_tag: str
    asset_type: str
    brand: Optional[str] = None
    model: Optional[str] = None
    model_no: Optional[str] = None
    serial_number: str
    purchase_date: Optional[date] = None
    eol_date: Optional[date] = None
    amc_start_date: Optional[date] = None
    amc_end_date: Optional[date] = None
    purchase_price: Optional[float] = None
    rental_cost: Optional[float] = None
    vendor_id: Optional[int] = None
    status: Optional[str] = None
    condition: Optional[str] = None
    checkout_date: Optional[date] = None
    operating_system: Optional[str] = None
    ram: Optional[str] = None
    hdd_capacity: Optional[str] = None
    processor: Optional[str] = None
    administrator: Optional[str] = None
    additional_notes: Optional[str] = None
    allocation_history: List[dict] = []

class AssetAllocationCreate(SQLModel):
    asset_id: int
    employee_id: int
    allocation_date: date = Field(default_factory=date.today)
    expected_return_date: Optional[date] = Field(default=None)
    actual_return_date: Optional[date] = Field(default=None)
    condition_at_allocation: Optional[str] = Field(max_length=20, default=None, regex="^(New|Good|Fair|Damaged)$")
    condition_at_return: Optional[str] = Field(max_length=20, default=None, regex="^(New|Good|Fair|Damaged)$")
    employee_ack: bool = Field(default=False)
    notes: Optional[str] = Field(default=None)

class AssetAllocationUpdate(SQLModel):
    asset_id: Optional[int] = Field(default=None)
    employee_id: Optional[int] = Field(default=None)
    allocation_date: Optional[date] = Field(default=None)
    expected_return_date: Optional[date] = Field(default=None)
    actual_return_date: Optional[date] = Field(default=None)
    condition_at_allocation: Optional[str] = Field(max_length=20, default=None, regex="^(New|Good|Fair|Damaged)$")
    condition_at_return: Optional[str] = Field(max_length=20, default=None, regex="^(New|Good|Fair|Damaged)$")
    employee_ack: Optional[bool] = Field(default=None)
    notes: Optional[str] = Field(default=None)

class AssetAllocationResponse(SQLModel):
    allocation_id: int
    asset_id: int
    employee_id: int
    allocation_date: date
    expected_return_date: Optional[date] = None
    actual_return_date: Optional[date] = None
    condition_at_allocation: Optional[str] = None
    condition_at_return: Optional[str] = None
    employee_ack: bool
    notes: Optional[str] = None

class AssetMaintenanceCreate(SQLModel):
    asset_id: int
    maintenance_type: str = Field(max_length=50, regex="^(Warranty|AMC|Repair)$")
    start_date: date
    end_date: Optional[date] = Field(default=None)
    vendor_id: Optional[int] = Field(default=None)
    cost: Optional[float] = Field(default=None, ge=0)
    notes: Optional[str] = Field(default=None)

class AssetMaintenanceUpdate(SQLModel):
    asset_id: Optional[int] = Field(default=None)
    maintenance_type: Optional[str] = Field(max_length=50, regex="^(Warranty|AMC|Repair)$", default=None)
    start_date: Optional[date] = Field(default=None)
    end_date: Optional[date] = Field(default=None)
    vendor_id: Optional[int] = Field(default=None)
    cost: Optional[float] = Field(default=None, ge=0)
    notes: Optional[str] = Field(default=None)

class AssetMaintenanceResponse(SQLModel):
    maintenance_id: int
    asset_id: int
    maintenance_type: str
    start_date: date
    end_date: Optional[date] = None
    vendor_id: Optional[int] = None
    cost: Optional[float] = None
    notes: Optional[str] = None