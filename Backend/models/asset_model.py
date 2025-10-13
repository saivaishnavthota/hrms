from sqlmodel import SQLModel, Field, JSON, Column
from typing import Optional, List
from datetime import date

class Vendor(SQLModel, table=True):
    __tablename__ = "vendors"
    vendor_id: Optional[int] = Field(default=None, primary_key=True)
    vendor_name: str = Field(max_length=255, nullable=False)
    vendor_type: str = Field(max_length=20, regex="^(Purchased|Rental)$")
    contact_email: Optional[str] = Field(max_length=255, default=None)
    contact_phone: Optional[str] = Field(max_length=20, default=None)
    payment_terms: Optional[str] = Field(default=None)
    contract_start_date: Optional[date] = Field(default=None)
    contract_end_date: Optional[date] = Field(default=None)
    notes: Optional[str] = Field(default=None)

class Asset(SQLModel, table=True):
    __tablename__ = "assets"
    asset_id: Optional[int] = Field(default=None, primary_key=True)
    asset_name: str = Field(max_length=255, nullable=False)
    asset_tag: str = Field(max_length=100, unique=True, nullable=False)
    asset_type: str = Field(max_length=50, nullable=False)
    brand: Optional[str] = Field(max_length=100, default=None)
    model: Optional[str] = Field(max_length=100, default=None)
    model_no: Optional[str] = Field(max_length=100, default=None)
    serial_number: str = Field(max_length=100, unique=True, nullable=False)
    purchase_date: Optional[date] = Field(default=None)
    eol_date: Optional[date] = Field(default=None)
    amc_start_date: Optional[date] = Field(default=None)
    amc_end_date: Optional[date] = Field(default=None)
    purchase_price: Optional[float] = Field(default=None, ge=0)
    rental_cost: Optional[float] = Field(default=None, ge=0)
    vendor_id: Optional[int] = Field(default=None, foreign_key="vendors.vendor_id", ondelete="CASCADE")
    status: str = Field(max_length=20, regex="^(In Stock|Allocated|Under Repair|Scrapped|Returned)$")
    condition: str = Field(max_length=20, regex="^(New|Good|Fair|Damaged)$")
    checkout_date: Optional[date] = Field(default=None)
    operating_system: Optional[str] = Field(max_length=100, default=None)
    ram: Optional[str] = Field(max_length=50, default=None)
    hdd_capacity: Optional[str] = Field(max_length=50, default=None)
    processor: Optional[str] = Field(max_length=100, default=None)
    administrator: Optional[str] = Field(max_length=255, default=None)
    additional_notes: Optional[str] = Field(default=None)
    allocation_history: List[dict] = Field(sa_column=Column(JSON), default=[])

class AssetAllocation(SQLModel, table=True):
    __tablename__ = "asset_allocations"
    allocation_id: Optional[int] = Field(default=None, primary_key=True)
    asset_id: int = Field(foreign_key="assets.asset_id", ondelete="CASCADE")
    employee_id: int = Field(foreign_key="employees.id", ondelete="CASCADE", nullable=False)  # Add nullable=False
    allocation_date: date = Field(default_factory=date.today)
    expected_return_date: Optional[date] = Field(default=None)
    actual_return_date: Optional[date] = Field(default=None)
    condition_at_allocation: Optional[str] = Field(max_length=20, default=None, regex="^(New|Good|Fair|Damaged)$")
    condition_at_return: Optional[str] = Field(max_length=20, default=None, regex="^(New|Good|Fair|Damaged)$")
    employee_ack: bool = Field(default=False)
    notes: Optional[str] = Field(default=None)

class AssetMaintenance(SQLModel, table=True):
    __tablename__ = "asset_maintenance"
    maintenance_id: Optional[int] = Field(default=None, primary_key=True)
    asset_id: int = Field(foreign_key="assets.asset_id", ondelete="CASCADE")
    maintenance_type: str = Field(max_length=50, regex="^(Warranty|AMC|Repair)$")
    start_date: date = Field(nullable=False)
    end_date: Optional[date] = Field(default=None)
    vendor_id: Optional[int] = Field(default=None, foreign_key="vendors.vendor_id", ondelete="CASCADE")
    cost: Optional[float] = Field(default=None, ge=0)
    notes: Optional[str] = Field(default=None)