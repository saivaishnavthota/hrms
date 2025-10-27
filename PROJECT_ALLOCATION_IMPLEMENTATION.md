# Project Allocation System Implementation

## Overview
This implementation adds a comprehensive project allocation system to the HRMS that tracks monthly day limits for employees across different projects. The system validates attendance against allocations and prevents over-allocation.

## Key Features

### 1. Monthly Day Limits
- Employees can work maximum 20 days per month across all projects
- Project-specific allocations with monthly limits
- Real-time validation before marking attendance

### 2. Excel Import System
- Dynamic column detection (metadata columns + monthly data)
- Fuzzy employee name matching
- Comprehensive error reporting
- Support for fractional days

### 3. Allocation Validation
- Pre-attendance validation
- Post-attendance consumption tracking
- Monthly summary reports

## Implementation Details

### Database Changes

#### New Table: `project_allocations`
```sql
CREATE TABLE project_allocations (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id),
    project_id INTEGER REFERENCES projects(project_id),
    employee_name VARCHAR NOT NULL,
    company VARCHAR,
    level VARCHAR,
    client VARCHAR,
    service_line VARCHAR,
    month VARCHAR NOT NULL,  -- Format: YYYY-MM
    allocated_days FLOAT DEFAULT 0.0,
    consumed_days FLOAT DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX ix_project_allocations_employee_id ON project_allocations(employee_id);
CREATE INDEX ix_project_allocations_project_id ON project_allocations(project_id);
CREATE INDEX ix_project_allocations_month ON project_allocations(month);
```

#### Updated Tables
- `attendance`: Added `days_count` column (FLOAT, default 1.0)
- `attendance_projects`: Added `days_worked` column (FLOAT, default 1.0)

### API Endpoints

#### 1. Import Allocations
```
POST /api/allocations/import
```
- Upload Excel file with project allocations
- Required: `project_id` (form field)
- File: Excel file (.xlsx, .xls)
- Returns: Import summary with success/error counts

#### 2. Get Allocation Summary
```
GET /api/allocations/summary/{employee_id}/{month}
```
- Get monthly allocation summary for an employee
- Month format: YYYY-MM
- Returns: List of projects with allocated/consumed/remaining days

#### 3. Get Employee Allocations
```
GET /api/allocations/employee/{employee_id}
```
- Get all allocations for an employee
- Optional: `start_month`, `end_month` query params
- Returns: Multi-month allocation data grouped by month

#### 4. Get Project Allocations
```
GET /api/allocations/project/{project_id}/{month}
```
- Get all employee allocations for a project in a month
- Returns: List of employees with their allocations

#### 5. Validate Allocation
```
GET /api/allocations/validate/{employee_id}/{project_id}/{date}
```
- Validate if an employee can work on a project
- Date format: YYYY-MM-DD
- Returns: Validation result with message

### Excel Import Format

#### Expected Structure
```
Column A: Employee Name (e.g., "Adittya Raj")
Column B: Company/Division (e.g., "YTPL")
Column C: Level (e.g., "L1", "L2.1")
Column D: Client (e.g., "UKPN")
Column E: Service Line (e.g., "Managed Services Delivery")
Columns F-J: Additional metadata (Department, Location, Work Mode, etc.)
Columns K+: Monthly allocations (e.g., "Nov-25", "Dec-25", "Jan-26")
```

#### Data Processing
- **Month Detection**: Uses regex pattern `^[A-Z][a-z]{2}-\d{2}$` to identify month columns
- **Employee Matching**: Three-tier approach:
  1. Exact match (case-insensitive)
  2. Fuzzy match (80% similarity threshold)
  3. Partial match (substring matching)
- **Data Validation**:
  - Skips empty cells, "-", or "nan" values
  - Warns for values >30 days (potential data entry errors)
  - Supports fractional days (0.5 for half-day)

### Attendance Integration

#### Pre-Validation
Before marking attendance, the system:
1. Validates total monthly days < 20
2. Checks project-specific allocation availability
3. Returns detailed error messages for failures

#### Post-Processing
After successful attendance creation:
1. Updates `consumed_days` for each project
2. Tracks fractional days (hours/8.0)
3. Maintains allocation balance

### Service Layer

#### ProjectAllocationService Methods

##### `import_from_excel(file_path, project_id, session)`
- Processes Excel file with dynamic column detection
- Handles missing headers and malformed data
- Returns comprehensive import results

##### `check_allocation_available(employee_id, project_id, date, days_to_consume, session)`
- Validates allocation before attendance
- Returns (bool, message) tuple

##### `update_consumed_days(employee_id, project_id, date, days_consumed, session)`
- Updates consumption after attendance creation
- Handles fractional days

##### `get_allocation_summary(employee_id, month, session)`
- Returns monthly allocation summary
- Includes remaining days calculation

##### `parse_month_header(header)`
- Converts "Nov-25" to "2025-11"
- Handles invalid formats gracefully

### Validation Rules

#### Monthly Limits
- **Total Days**: Employee cannot exceed 20 days per month across all projects
- **Project Limits**: Cannot exceed allocated days for specific project
- **Fractional Days**: Supports 0.5 day increments (4-hour blocks)

#### Error Handling
- **Missing Allocations**: Clear error messages for unallocated projects
- **Over-allocation**: Detailed breakdown of current vs. requested days
- **Data Quality**: Warnings for unrealistic values (>30 days)

### Usage Examples

#### 1. Import Allocations
```python
# Upload Excel file via API
POST /api/allocations/import
Content-Type: multipart/form-data

project_id: 123
file: allocations.xlsx
```

#### 2. Check Monthly Summary
```python
# Get employee's November 2025 allocations
GET /api/allocations/summary/456/2025-11

# Response
{
  "employee_id": 456,
  "month": "2025-11",
  "allocations": [
    {
      "project_id": 123,
      "project_name": "Project Alpha",
      "allocated_days": 18.0,
      "consumed_days": 12.0,
      "remaining_days": 6.0,
      "employee_name": "John Doe",
      "company": "YTPL",
      "client": "UKPN"
    }
  ]
}
```

#### 3. Validate Before Attendance
```python
# Check if employee can work on project for specific date
GET /api/allocations/validate/456/123/2025-11-15?days_to_consume=1.0

# Response
{
  "valid": true,
  "message": "Allocation validation passed",
  "employee_id": 456,
  "project_id": 123,
  "date": "2025-11-15",
  "days_to_consume": 1.0
}
```

### Migration Instructions

#### 1. Install Dependencies
```bash
pip install pandas openpyxl fuzzywuzzy python-Levenshtein
```

#### 2. Run Migration
```bash
cd Backend
alembic upgrade head
```

#### 3. Test Import
1. Create Excel file with allocation data
2. Use `/api/allocations/import` endpoint
3. Verify data in database

### Error Scenarios

#### Common Import Errors
- **Employee Not Found**: Fuzzy matching fails for all strategies
- **Invalid Month Format**: Non-standard month headers
- **Data Type Errors**: Non-numeric values in allocation columns
- **Missing Project**: Project ID doesn't exist in database

#### Validation Failures
- **Monthly Limit Exceeded**: Total days > 20 for the month
- **Project Limit Exceeded**: Requested days > allocated days
- **No Allocation**: Employee not allocated to project for the month

### Performance Considerations

#### Database Indexes
- `employee_id` + `month` for quick employee lookups
- `project_id` + `month` for project-specific queries
- `month` for monthly summaries

#### Batch Operations
- Excel import uses batch commits for performance
- Allocation updates are atomic per attendance record

### Security

#### Access Control
- **Import**: Admin and HR only
- **Summary**: Employee can view own data, HR/Admin can view all
- **Validation**: Employee can validate own allocations

#### Data Validation
- File type restrictions (Excel only)
- Input sanitization for all parameters
- SQL injection prevention through SQLModel

### Monitoring and Logging

#### Import Process
- Detailed logging of processing steps
- Error tracking with row/column information
- Success/failure counts

#### Validation Process
- Allocation check logging
- Performance metrics for validation queries

### Future Enhancements

#### Potential Features
1. **Bulk Allocation Updates**: Modify multiple allocations at once
2. **Allocation Templates**: Reuse allocation patterns across months
3. **Advanced Reporting**: Allocation vs. actual usage analytics
4. **Notification System**: Alerts for approaching limits
5. **Historical Tracking**: Allocation change audit trail

#### Performance Optimizations
1. **Caching**: Redis cache for frequently accessed allocations
2. **Async Processing**: Background processing for large imports
3. **Database Partitioning**: Partition by month for large datasets

## Conclusion

This implementation provides a robust foundation for project allocation management with comprehensive validation, flexible Excel import, and real-time attendance tracking. The system is designed to scale with growing data volumes while maintaining data integrity and user experience.
