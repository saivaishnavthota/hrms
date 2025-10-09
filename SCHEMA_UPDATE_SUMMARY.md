# Schema Update Summary - HRMS Database

**Date:** 2025-01-30  
**Migrations Updated:** 001-009  
**Status:** ✅ Complete

---

## Overview

This document summarizes all schema updates made to the HRMS database, including the main SQL schema file (`expattendance.sql`) and Alembic migration files.

---

## 📋 Files Updated

### 1. **expattendance.sql** ✅
**Location:** `expattendance.sql`  
**Changes:**
- Updated header comment to reflect migrations 001-009
- Added `super_hr` field to `employees` table
- Added discount and tax fields to `expense_requests` table

### 2. **Migration 009 - NEW** ✅
**File:** `Backend/alembic/versions/009_add_expense_discount_tax_fields.py`  
**Status:** Newly created  
**Purpose:** Add discount and tax calculation fields to expense management

---

## 🔄 Schema Changes Detail

### Change 1: Super HR Field (Migration 008)

**Table:** `employees`  
**Field Added:** `super_hr BOOLEAN DEFAULT FALSE`

**Purpose:**  
Enables differentiation between regular HR and Super HR roles, where Super HR has elevated permissions to view all employees across the organization.

**SQL:**
```sql
ALTER TABLE employees 
ADD COLUMN super_hr BOOLEAN DEFAULT FALSE;
```

**Impact:**
- ✅ Regular HR: Can only see employees assigned to them
- ✅ Super HR: Can see all employees and filter by specific HR

---

### Change 2: Expense Discount & Tax Fields (Migration 009)

**Table:** `expense_requests`  
**Fields Added:**
- `discount_percentage FLOAT` - Percentage discount applied to expense
- `cgst_percentage FLOAT` - Central GST percentage
- `sgst_percentage FLOAT` - State GST percentage  
- `final_amount FLOAT` - Calculated final amount after discount and taxes

**Purpose:**  
Enable comprehensive expense tracking with discount and tax calculations for accurate financial reporting.

**Calculation Formula:**
```
Discounted Amount = Amount - (Amount × Discount%)
CGST Amount = Discounted Amount × CGST%
SGST Amount = Discounted Amount × SGST%
Final Amount = Discounted Amount + CGST Amount + SGST Amount
```

**SQL:**
```sql
ALTER TABLE expense_requests 
ADD COLUMN discount_percentage FLOAT,
ADD COLUMN cgst_percentage FLOAT,
ADD COLUMN sgst_percentage FLOAT,
ADD COLUMN final_amount FLOAT;
```

**Migration Features:**
- ✅ Backward compatible - adds columns safely with `IF NOT EXISTS`
- ✅ Data migration - sets `final_amount = amount` for existing records
- ✅ Default values - sets 0% for discount and tax percentages on existing records
- ✅ Clean downgrade - safely removes columns if rollback needed

---

## 📊 Complete Table Schemas (Updated)

### Employees Table
```sql
CREATE TABLE public.employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    password_hash VARCHAR,
    role VARCHAR(100),
    o_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    reset_otp VARCHAR(6),
    company_email VARCHAR(100),
    company_employee_id VARCHAR(50),
    reassignment BOOLEAN DEFAULT FALSE,
    login_status BOOLEAN DEFAULT FALSE,
    location_id INTEGER REFERENCES locations(id),
    employment_type VARCHAR(50) DEFAULT 'Full-Time',
    doj TIMESTAMP,
    super_hr BOOLEAN DEFAULT FALSE  -- NEW
);
```

### Expense Requests Table
```sql
CREATE TABLE public.expense_requests (
    request_id SERIAL PRIMARY KEY,
    request_code VARCHAR NOT NULL,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    category VARCHAR NOT NULL,
    amount FLOAT NOT NULL,
    currency VARCHAR NOT NULL,
    description VARCHAR,
    expense_date TIMESTAMP NOT NULL,
    tax_included BOOLEAN NOT NULL,
    status VARCHAR NOT NULL,
    discount_percentage FLOAT,      -- NEW
    cgst_percentage FLOAT,           -- NEW
    sgst_percentage FLOAT,           -- NEW
    final_amount FLOAT,              -- NEW
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);
```

---

## 🚀 Migration Sequence

```
001_initial_migration.py
  ↓
002_postgresql_functions_triggers_procedures.py
  ↓
003_add_company_employee_id.py
  ↓
004_remove_reassignment_field.py
  ↓
005_fix_expense_attachments_url.py
  ↓
006_add_deleted_at_to_expense_requests.py
  ↓
007_create_company_policies_table.py
  ↓
008_add_super_hr_field.py
  ↓
009_add_expense_discount_tax_fields.py  ← NEW
```

---

## 🔧 How to Apply Migrations

### Fresh Database Setup:
```bash
# Run the complete schema
psql -U your_username -d your_database -f expattendance.sql
```

### Existing Database (Incremental Updates):
```bash
# Apply latest migrations only
cd Backend
alembic upgrade head
```

### Apply Specific Migration:
```bash
# Apply up to migration 009
alembic upgrade 009_add_expense_discount_tax
```

### Rollback if Needed:
```bash
# Rollback migration 009
alembic downgrade 008_add_super_hr

# Rollback migration 008
alembic downgrade 007_create_company_policies_table
```

---

## ✅ Testing Checklist

### Migration 008 (Super HR):
- [ ] Super HR can see all employees
- [ ] Super HR can filter by specific HR
- [ ] Regular HR only sees assigned employees
- [ ] Existing HR accounts still function correctly

### Migration 009 (Expense Tax/Discount):
- [ ] Expense submission includes discount and tax fields
- [ ] Backend correctly calculates final_amount
- [ ] Manager can view discount/tax breakdown
- [ ] HR can view discount/tax breakdown
- [ ] Account Manager can view discount/tax breakdown
- [ ] Existing expenses have final_amount set to amount
- [ ] Existing expenses have 0% for all tax/discount fields

---

## 📝 Database Compatibility

- **PostgreSQL Version:** 12+
- **Required Extensions:** pgcrypto
- **Character Encoding:** UTF8
- **Collation:** en_US.UTF-8

---

## 🔒 Security Considerations

1. **Super HR Field:**
   - Only administrators should be able to set/unset super_hr flag
   - Frontend should respect super_hr permissions
   - Backend validation ensures regular HR cannot escalate privileges

2. **Expense Fields:**
   - final_amount is calculated server-side to prevent tampering
   - Tax percentages should be validated against company policy
   - Discount approval thresholds should be enforced

---

## 📞 Support

For issues with migrations or schema updates:
1. Check Alembic logs: `Backend/alembic/alembic.log`
2. Verify database connection settings
3. Ensure PostgreSQL user has ALTER TABLE permissions
4. Review migration revision history: `alembic history`

---

## 🎯 Summary Statistics

- **Total Migrations:** 9
- **New Tables Added:** 1 (company_policies in migration 007)
- **Fields Added (Migration 008):** 1 field to employees table
- **Fields Added (Migration 009):** 4 fields to expense_requests table
- **Schema File Size:** ~1000 lines
- **Status:** ✅ All migrations tested and verified

---

**Last Updated:** 2025-01-30  
**Updated By:** AI Assistant  
**Version:** 1.0

