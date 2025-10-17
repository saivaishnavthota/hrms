# HRMS Database Schema Map

## Overview
This document provides a comprehensive map of the HRMS database schema including all tables, columns, relationships, and recent updates.

**Last Updated**: October 2025  
**Database**: PostgreSQL  
**Version**: Latest with Entra ID Integration

---

## Table: `employees`

### Description
Main table storing employee/user information. Supports both traditional authentication and Microsoft Entra ID SSO.

### Columns

| Column Name | Type | Nullable | Default | Description |
|------------|------|----------|---------|-------------|
| `id` | INTEGER | NO | AUTO | Primary key, unique employee identifier |
| `name` | VARCHAR | NO | - | Full name of employee |
| `email` | VARCHAR | NO | - | Personal email address |
| `company_email` | VARCHAR | NO | - | Company email (used for login) |
| `password_hash` | VARCHAR | YES | '' | Hashed password (empty for Entra ID users) |
| `role` | VARCHAR | NO | 'Employee' | User role: HR, Manager, Employee, Account Manager, ITSupporter, Intern |
| `employment_type` | VARCHAR | YES | - | Full-time, Part-time, Contract, Intern |
| `location_id` | INTEGER | YES | NULL | FK to locations table |
| `company_employee_id` | VARCHAR | YES | NULL | Company-specific employee ID |
| `doj` | DATE | YES | NULL | Date of joining |
| `o_status` | BOOLEAN | NO | false | Onboarding status (true = onboarded) |
| `login_status` | BOOLEAN | NO | false | Can user login |
| `super_hr` | BOOLEAN | YES | false | Super HR privileges (for HR role only) |
| `reassignment` | BOOLEAN | YES | NULL | Reassignment status |
| `reset_otp` | VARCHAR | YES | NULL | OTP for password reset |
| `created_at` | TIMESTAMP | NO | NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMP | YES | - | Last update timestamp |
| **`entra_id`** | VARCHAR | YES | NULL | **NEW: Microsoft Entra ID unique identifier** |
| **`job_title`** | VARCHAR | YES | NULL | **NEW: Job title from Entra ID** |
| **`department`** | VARCHAR | YES | NULL | **NEW: Department from Entra ID** |
| **`auth_provider`** | VARCHAR | YES | 'local' | **NEW: Authentication provider (local/entra)** |

### Indexes
- `PRIMARY KEY (id)`
- `UNIQUE INDEX ON (email)`
- `UNIQUE INDEX ON (company_email)`
- **`UNIQUE INDEX ix_employees_entra_id ON (entra_id)`** ← NEW

### Recent Changes (Entra ID Integration)
Added 4 new columns to support Microsoft Entra ID authentication:
- `entra_id`: Stores unique identifier from Microsoft
- `job_title`: Job title synced from Entra ID
- `department`: Department synced from Entra ID
- `auth_provider`: Tracks authentication method

---

## Table: `employee_details`

### Description
Extended employee information including personal details and emergency contacts.

### Columns

| Column Name | Type | Nullable | Description |
|------------|------|----------|-------------|
| `id` | INTEGER | NO | Primary key |
| `employee_id` | INTEGER | NO | FK to employees(id) |
| `full_name` | VARCHAR | YES | Full legal name |
| `contact_no` | VARCHAR | YES | Phone number |
| `personal_email` | VARCHAR | YES | Personal email |
| `company_email` | VARCHAR | YES | Company email |
| `doj` | DATE | YES | Date of joining |
| `dob` | DATE | YES | Date of birth |
| `address` | TEXT | YES | Residential address |
| `gender` | VARCHAR | YES | Gender |
| `graduation_year` | INTEGER | YES | Year of graduation |
| `work_experience_years` | INTEGER | YES | Years of experience |
| `emergency_contact_name` | VARCHAR | YES | Emergency contact person |
| `emergency_contact_number` | VARCHAR | YES | Emergency contact phone |
| `emergency_contact_relation` | VARCHAR | YES | Relationship to employee |
| `employment_type` | VARCHAR | YES | Employment type |
| `created_at` | TIMESTAMP | NO | Record creation |
| `updated_at` | TIMESTAMP | YES | Last update |

### Relationships
- `employee_id` → `employees(id)` (ONE-TO-ONE)

---

## Table: `employee_masters`

### Description
Master assignment table linking employees to HRs and managers.

### Columns

| Column Name | Type | Nullable | Description |
|------------|------|----------|-------------|
| `id` | INTEGER | NO | Primary key |
| `emp_id` | INTEGER | NO | FK to employees(id) |
| `hr1_id` | INTEGER | YES | Primary HR assigned |
| `hr2_id` | INTEGER | YES | Secondary HR assigned |
| `manager1_id` | INTEGER | YES | Primary manager |
| `manager2_id` | INTEGER | YES | Secondary manager |
| `manager3_id` | INTEGER | YES | Tertiary manager |
| `created_at` | TIMESTAMP | NO | Record creation |
| `updated_at` | TIMESTAMP | YES | Last update |

### Relationships
- `emp_id` → `employees(id)`
- `hr1_id`, `hr2_id` → `employees(id)` where role='HR'
- `manager1_id`, `manager2_id`, `manager3_id` → `employees(id)` where role='Manager'

---

## Table: `employee_hrs`

### Description
Additional HR assignments beyond the master table.

### Columns

| Column Name | Type | Nullable | Description |
|------------|------|----------|-------------|
| `id` | INTEGER | NO | Primary key |
| `employee_id` | INTEGER | NO | FK to employees(id) |
| `hr_id` | INTEGER | NO | FK to employees(id) where role='HR' |
| `assigned_at` | TIMESTAMP | NO | Assignment timestamp |

### Relationships
- `employee_id` → `employees(id)`
- `hr_id` → `employees(id)` where role='HR'

---

## Table: `employee_managers`

### Description
Additional manager assignments beyond the master table.

### Columns

| Column Name | Type | Nullable | Description |
|------------|------|----------|-------------|
| `id` | INTEGER | NO | Primary key |
| `employee_id` | INTEGER | NO | FK to employees(id) |
| `manager_id` | INTEGER | NO | FK to employees(id) where role='Manager' |
| `assigned_at` | TIMESTAMP | NO | Assignment timestamp |

### Relationships
- `employee_id` → `employees(id)`
- `manager_id` → `employees(id)` where role='Manager'

---

## Table: `candidates` (formerly `onboarding`)

### Description
Candidate information during onboarding process (before becoming employees).

### Columns

| Column Name | Type | Nullable | Description |
|------------|------|----------|-------------|
| `id` | INTEGER | NO | Primary key |
| `name` | VARCHAR | NO | Candidate name |
| `email` | VARCHAR | NO | Candidate email |
| `password` | VARCHAR | YES | Hashed password |
| `role` | VARCHAR | YES | Assigned role |
| `o_status` | BOOLEAN | NO | Onboarding completion status |
| `login_status` | BOOLEAN | NO | Can login |
| `created_at` | TIMESTAMP | NO | Record creation |

---

## Table: `locations`

### Description
Office locations/branches.

### Columns

| Column Name | Type | Nullable | Description |
|------------|------|----------|-------------|
| `id` | INTEGER | NO | Primary key |
| `name` | VARCHAR | NO | Location name |
| `address` | TEXT | YES | Full address |
| `city` | VARCHAR | YES | City |
| `state` | VARCHAR | YES | State |
| `country` | VARCHAR | YES | Country |
| `created_at` | TIMESTAMP | NO | Record creation |

---

## Table: `leaves`

### Description
Leave applications and records.

### Columns

| Column Name | Type | Nullable | Description |
|------------|------|----------|-------------|
| `id` | INTEGER | NO | Primary key |
| `employee_id` | INTEGER | NO | FK to employees(id) |
| `leave_type` | VARCHAR | NO | Sick, Casual, Earned, etc. |
| `from_date` | DATE | NO | Leave start date |
| `to_date` | DATE | NO | Leave end date |
| `days` | DECIMAL | NO | Number of days |
| `reason` | TEXT | YES | Leave reason |
| `status` | VARCHAR | NO | Pending, Approved, Rejected |
| `approved_by` | INTEGER | YES | FK to employees(id) |
| `applied_date` | TIMESTAMP | NO | Application date |
| `approved_date` | TIMESTAMP | YES | Approval/rejection date |
| `comments` | TEXT | YES | Comments from approver |

### Relationships
- `employee_id` → `employees(id)`
- `approved_by` → `employees(id)` where role IN ('HR', 'Manager')

---

## Table: `leave_balances`

### Description
Leave balance tracking for each employee.

### Columns

| Column Name | Type | Nullable | Description |
|------------|------|----------|-------------|
| `id` | INTEGER | NO | Primary key |
| `employee_id` | INTEGER | NO | FK to employees(id) |
| `leave_type` | VARCHAR | NO | Leave type |
| `balance` | DECIMAL | NO | Available balance |
| `used` | DECIMAL | NO | Used leaves |
| `total_allocated` | DECIMAL | NO | Total allocated |
| `year` | INTEGER | NO | Financial year |
| `updated_at` | TIMESTAMP | YES | Last update |

### Relationships
- `employee_id` → `employees(id)`

---

## Table: `attendance`

### Description
Daily attendance records.

### Columns

| Column Name | Type | Nullable | Description |
|------------|------|----------|-------------|
| `id` | INTEGER | NO | Primary key |
| `employee_id` | INTEGER | NO | FK to employees(id) |
| `date` | DATE | NO | Attendance date |
| `check_in` | TIME | YES | Check-in time |
| `check_out` | TIME | YES | Check-out time |
| `status` | VARCHAR | NO | Present, Absent, Half-day, WFH |
| `work_hours` | DECIMAL | YES | Total work hours |
| `created_at` | TIMESTAMP | NO | Record creation |

### Relationships
- `employee_id` → `employees(id)`

---

## Table: `expenses`

### Description
Employee expense claims.

### Columns

| Column Name | Type | Nullable | Description |
|------------|------|----------|-------------|
| `id` | INTEGER | NO | Primary key |
| `employee_id` | INTEGER | NO | FK to employees(id) |
| `expense_type` | VARCHAR | NO | Travel, Food, Equipment, etc. |
| `amount` | DECIMAL | NO | Expense amount |
| `date` | DATE | NO | Expense date |
| `description` | TEXT | YES | Expense description |
| `receipt_url` | VARCHAR | YES | Receipt file URL |
| `status` | VARCHAR | NO | Pending, Approved, Rejected |
| `approved_by` | INTEGER | YES | FK to employees(id) |
| `submitted_date` | TIMESTAMP | NO | Submission date |
| `approved_date` | TIMESTAMP | YES | Approval date |

### Relationships
- `employee_id` → `employees(id)`
- `approved_by` → `employees(id)` where role IN ('HR', 'Manager', 'Account Manager')

---

## Table: `projects`

### Description
Project information and assignments.

### Columns

| Column Name | Type | Nullable | Description |
|------------|------|----------|-------------|
| `id` | INTEGER | NO | Primary key |
| `project_name` | VARCHAR | NO | Project name |
| `project_code` | VARCHAR | YES | Unique project code |
| `description` | TEXT | YES | Project description |
| `start_date` | DATE | YES | Project start date |
| `end_date` | DATE | YES | Project end date |
| `status` | VARCHAR | NO | Active, Completed, On Hold |
| `manager_id` | INTEGER | YES | FK to employees(id) |
| `created_at` | TIMESTAMP | NO | Record creation |

### Relationships
- `manager_id` → `employees(id)` where role='Manager'

---

## Table: `assets`

### Description
Company assets assigned to employees.

### Columns

| Column Name | Type | Nullable | Description |
|------------|------|----------|-------------|
| `id` | INTEGER | NO | Primary key |
| `asset_name` | VARCHAR | NO | Asset name |
| `asset_type` | VARCHAR | NO | Laptop, Phone, etc. |
| `asset_code` | VARCHAR | YES | Unique asset code |
| `assigned_to` | INTEGER | YES | FK to employees(id) |
| `assigned_date` | DATE | YES | Assignment date |
| `return_date` | DATE | YES | Return date |
| `status` | VARCHAR | NO | Available, Assigned, Damaged |
| `created_at` | TIMESTAMP | NO | Record creation |

### Relationships
- `assigned_to` → `employees(id)`

---

## Table: `documents`

### Description
Employee documents (ID proofs, certificates, etc.).

### Columns

| Column Name | Type | Nullable | Description |
|------------|------|----------|-------------|
| `id` | INTEGER | NO | Primary key |
| `employee_id` | INTEGER | NO | FK to employees(id) |
| `doc_type` | VARCHAR | NO | aadhar, pan, resume, etc. |
| `file_name` | VARCHAR | NO | Original filename |
| `file_url` | VARCHAR | NO | Storage path/URL |
| `uploaded_at` | TIMESTAMP | NO | Upload timestamp |
| `status` | VARCHAR | YES | Pending, Approved, Rejected |

### Relationships
- `employee_id` → `employees(id)`

---

## Table: `policies`

### Description
Company policies and documents.

### Columns

| Column Name | Type | Nullable | Description |
|------------|------|----------|-------------|
| `id` | INTEGER | NO | Primary key |
| `title` | VARCHAR | NO | Policy title |
| `description` | TEXT | YES | Policy description |
| `file_url` | VARCHAR | YES | Policy document URL |
| `category` | VARCHAR | YES | Policy category |
| `effective_date` | DATE | YES | When policy becomes effective |
| `created_by` | INTEGER | YES | FK to employees(id) |
| `created_at` | TIMESTAMP | NO | Record creation |
| `updated_at` | TIMESTAMP | YES | Last update |

### Relationships
- `created_by` → `employees(id)` where role='HR'

---

## Table: `weekoffs`

### Description
Week-off configuration for employees.

### Columns

| Column Name | Type | Nullable | Description |
|------------|------|----------|-------------|
| `id` | INTEGER | NO | Primary key |
| `employee_id` | INTEGER | NO | FK to employees(id) |
| `weekoff_day` | VARCHAR | NO | Monday, Tuesday, etc. |
| `is_active` | BOOLEAN | NO | Active status |
| `created_at` | TIMESTAMP | NO | Record creation |

### Relationships
- `employee_id` → `employees(id)`

---

## Table: `hr_config`

### Description
HR configuration settings (leave policies, etc.).

### Columns

| Column Name | Type | Nullable | Description |
|------------|------|----------|-------------|
| `id` | INTEGER | NO | Primary key |
| `config_key` | VARCHAR | NO | Configuration key |
| `config_value` | TEXT | YES | Configuration value (JSON) |
| `description` | TEXT | YES | Config description |
| `updated_at` | TIMESTAMP | YES | Last update |
| `updated_by` | INTEGER | YES | FK to employees(id) |

### Relationships
- `updated_by` → `employees(id)` where role='HR'

---

## Table: `sessions`

### Description
User session management (for candidates and token-based auth).

### Columns

| Column Name | Type | Nullable | Description |
|------------|------|----------|-------------|
| `id` | INTEGER | NO | Primary key |
| `session_id` | VARCHAR | NO | Unique session identifier |
| `user_id` | INTEGER | NO | User/candidate ID |
| `user_type` | VARCHAR | NO | 'user' or 'candidate' |
| `role` | VARCHAR | NO | User role |
| `expires_at` | TIMESTAMP | NO | Session expiration |
| `is_active` | BOOLEAN | NO | Session active status |
| `created_at` | TIMESTAMP | NO | Session creation |

---

## Table: `request_logs`

### Description
API request logging for audit trails.

### Columns

| Column Name | Type | Nullable | Description |
|------------|------|----------|-------------|
| `id` | INTEGER | NO | Primary key |
| `user_id` | INTEGER | YES | FK to employees(id) |
| `endpoint` | VARCHAR | NO | API endpoint |
| `method` | VARCHAR | NO | HTTP method |
| `status_code` | INTEGER | NO | Response status |
| `request_body` | TEXT | YES | Request payload |
| `response_body` | TEXT | YES | Response payload |
| `ip_address` | VARCHAR | YES | Client IP |
| `user_agent` | VARCHAR | YES | Client user agent |
| `timestamp` | TIMESTAMP | NO | Request timestamp |

### Relationships
- `user_id` → `employees(id)`

---

## Entity Relationships Diagram (ERD)

```
employees (1) ─────< (M) employee_details
    │
    ├─────< (M) employee_hrs >─────┐
    │                               │
    ├─────< (M) employee_managers ─┤
    │                               │
    │                          (relationship to self)
    │
    ├─────< (M) leaves
    │
    ├─────< (M) leave_balances
    │
    ├─────< (M) attendance
    │
    ├─────< (M) expenses
    │
    ├─────< (M) assets
    │
    ├─────< (M) documents
    │
    ├─────< (M) weekoffs
    │
    └─────> (1) locations
```

---

## Entra ID Integration Changes

### Migration: `add_entra_id_fields`

**Applied**: October 2025

**Changes**:
1. Added `entra_id` column to `employees` table
   - Type: VARCHAR, nullable, unique
   - Purpose: Store Microsoft Entra ID unique identifier
   - Index: Created unique index for fast lookups

2. Added `job_title` column to `employees` table
   - Type: VARCHAR, nullable
   - Purpose: Sync job title from Entra ID profile

3. Added `department` column to `employees` table
   - Type: VARCHAR, nullable
   - Purpose: Sync department from Entra ID profile

4. Added `auth_provider` column to `employees` table
   - Type: VARCHAR, nullable, default 'local'
   - Purpose: Track authentication method (local/entra)
   - Values: 'local' (traditional login) or 'entra' (Microsoft SSO)

**Impact**:
- Existing records: `auth_provider` defaults to 'local'
- New Entra ID users: `auth_provider` set to 'entra'
- Backward compatible: No impact on existing functionality

**Rollback**: 
```sql
DROP INDEX ix_employees_entra_id;
ALTER TABLE employees DROP COLUMN auth_provider;
ALTER TABLE employees DROP COLUMN department;
ALTER TABLE employees DROP COLUMN job_title;
ALTER TABLE employees DROP COLUMN entra_id;
```

---

## Authentication Flow

### Traditional Authentication
1. User provides email + password
2. System validates against `password_hash` in `employees` table
3. JWT token generated with user claims
4. `auth_provider` = 'local'

### Entra ID Authentication
1. User authenticates with Microsoft
2. Backend receives Microsoft tokens
3. User profile fetched from Microsoft Graph API
4. System checks `employees` table by `company_email`
5. If user exists: Update `entra_id`, `job_title`, `department`
6. If new user: Create record with role based on job title
7. JWT token generated with user claims (same as traditional)
8. `auth_provider` = 'entra'

---

## Indexes Summary

### Primary Keys
- All tables have auto-incrementing INTEGER primary keys

### Unique Indexes
- `employees.email` (UNIQUE)
- `employees.company_email` (UNIQUE)
- `employees.entra_id` (UNIQUE) ← NEW
- `locations.name` (UNIQUE)

### Foreign Key Indexes
- `employee_details.employee_id`
- `employee_masters.emp_id`
- `employee_hrs.employee_id`
- `employee_hrs.hr_id`
- `employee_managers.employee_id`
- `employee_managers.manager_id`
- `leaves.employee_id`
- `leave_balances.employee_id`
- `attendance.employee_id`
- `expenses.employee_id`
- `assets.assigned_to`
- `documents.employee_id`

---

## Data Types Summary

- **INTEGER**: IDs, years, counts
- **VARCHAR**: Short text fields (names, emails, codes)
- **TEXT**: Long text fields (descriptions, comments)
- **DATE**: Date fields (doj, dob, leave dates)
- **TIME**: Time fields (check-in, check-out)
- **TIMESTAMP**: Date+time fields (created_at, updated_at)
- **DECIMAL**: Numeric fields (amounts, days, hours)
- **BOOLEAN**: True/false flags (status, is_active)

---

## Security Notes

### Password Storage
- All passwords stored as bcrypt hashes
- Never store plain text passwords
- Entra ID users: `password_hash` = '' (empty string)

### Entra ID Security
- `entra_id` field stores Microsoft's unique identifier
- This field is immutable once set
- Used for account linking and SSO
- Never exposed to frontend

### Sensitive Data
- Personal information encrypted at rest
- Access logs maintained in `request_logs`
- Role-based access control enforced

---

## Maintenance Procedures

### Regular Tasks
1. **Weekly**: Backup database
2. **Monthly**: Archive old request logs
3. **Quarterly**: Review and optimize indexes
4. **Yearly**: Purge inactive candidate records

### Migration Best Practices
1. Always create backup before migration
2. Test migrations on staging first
3. Document all schema changes
4. Update this schema map after changes

---

**End of Schema Map**

For questions or schema change requests, contact the development team.

