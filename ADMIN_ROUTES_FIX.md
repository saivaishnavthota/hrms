# Admin Routes Database Schema Fix

## Issue
The admin expense route was failing with error:
```
column em.employee_id does not exist
LINE 37: LEFT JOIN employee_master em ON e.id = em.employee_id...
HINT: Perhaps you meant to reference the column "er.employee_id".
```

## Root Cause
The `employee_master` table has a different structure than expected:
- **Actual schema**: Uses `emp_id` (not `employee_id`) and only contains manager/HR relationship data
- **Query was trying to**: Join on `em.employee_id` and fetch `department` and `designation` fields that don't exist

### Employee Master Table Structure
```sql
CREATE TABLE employee_master (
    emp_id INT PRIMARY KEY REFERENCES employees(id),
    manager1_id INT REFERENCES employees(id),
    hr1_id INT REFERENCES employees(id),
    manager2_id INT REFERENCES employees(id),
    manager3_id INT REFERENCES employees(id),
    hr2_id INT REFERENCES employees(id)
);
```

**Note**: This table only tracks employee-manager-HR relationships, NOT department or designation.

## Solution

### Backend Changes (`Backend/routes/expenses_routes.py`)

1. **Removed incorrect JOIN**:
   ```sql
   -- REMOVED:
   LEFT JOIN employee_master em ON e.id = em.employee_id
   ```

2. **Changed fields to use data from `employees` table**:
   ```sql
   -- CHANGED FROM:
   em.department,
   em.designation,
   
   -- CHANGED TO:
   e.role,
   e.employment_type,
   ```

3. **Updated GROUP BY clause**:
   ```sql
   GROUP BY
       er.request_id, er.request_code, er.employee_id, e.name, e.company_email,
       e.role, e.employment_type,  -- Changed from em.department, em.designation
       er.category, er.amount, er.currency,
       ...
   ```

4. **Updated response object**:
   ```python
   "role": row.role,              # Instead of department
   "employment_type": row.employment_type,  # Instead of designation
   ```

### Frontend Changes (`Frontend/src/components/Admin/ExpenseManagement.jsx`)

Updated Excel export to use correct field names:
```javascript
'Role': exp.role || 'N/A',              // Instead of Department
'Employment Type': exp.employment_type || 'N/A',  // Instead of Designation
```

Also added additional fields that were missing:
```javascript
'Tax Included': exp.tax_included ? 'Yes' : 'No',
'Discount %': exp.discount_percentage || 0,
'CGST %': exp.cgst_percentage || 0,
'SGST %': exp.sgst_percentage || 0,
'Final Amount': exp.final_amount || 0,
```

## Updated API Response

### Expense Request Response Format
```json
{
  "request_id": 63,
  "request_code": "EXP-20251010-8EF394",
  "employee_id": 71,
  "employee_name": "Jane Smith",
  "employee_email": "jane.smith@company.com",
  "role": "Employee",                    // ✅ FROM employees table
  "employment_type": "Full-time",        // ✅ FROM employees table
  "category": "Training & Education",
  "amount": 600.0,
  "currency": "INR",
  "description": "Training",
  "expense_date": "2025-10-10",
  "tax_included": true,
  "status": "pending_manager_approval",
  "discount_percentage": 10.0,
  "cgst_percentage": 9.0,
  "sgst_percentage": 9.0,
  "final_amount": 540.0,
  "created_at": "2025-10-10 08:12:14.690044",
  "updated_at": "2025-10-10 08:12:14.690092",
  "attachments": []
}
```

## Corrected SQL Query

```sql
SELECT
    er.request_id,
    er.request_code,
    er.employee_id,
    e.name AS employee_name,
    e.company_email AS employee_email,
    e.role,                    -- ✅ FROM employees
    e.employment_type,         -- ✅ FROM employees
    er.category,
    er.amount,
    er.currency,
    er.description,
    er.expense_date,
    er.tax_included,
    er.status,
    er.discount_percentage,
    er.cgst_percentage,
    er.sgst_percentage,
    er.final_amount,
    er.created_at,
    er.updated_at,
    COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', ea.attachment_id,
                'file_name', ea.file_name,
                'file_url', ea.file_url,
                'file_type', ea.file_type,
                'uploaded_at', ea.uploaded_at
            )
        ) FILTER (WHERE ea.attachment_id IS NOT NULL),
        '[]'
    ) AS attachments
FROM expense_requests er
INNER JOIN employees e ON er.employee_id = e.id
LEFT JOIN expense_attachments ea ON er.request_id = ea.request_id
WHERE e.o_status = true AND er.deleted_at IS NULL
GROUP BY
    er.request_id, er.request_code, er.employee_id, e.name, e.company_email,
    e.role, e.employment_type, er.category, er.amount, er.currency,
    er.description, er.expense_date, er.tax_included, er.status, 
    er.discount_percentage, er.cgst_percentage, er.sgst_percentage, 
    er.final_amount, er.created_at, er.updated_at
ORDER BY er.created_at DESC;
```

## Testing

After deploying these changes:

1. **Restart the backend**:
   ```bash
   docker-compose restart fastapi_app
   ```

2. **Test the endpoint**:
   ```bash
   curl http://localhost:8000/expenses/admin/all-expense-requests \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```

3. **Expected result**: Should return all expense requests with `role` and `employment_type` fields instead of `department` and `designation`.

## Status
✅ **Fixed** - Query now works correctly with the actual database schema.

---

**Date**: October 16, 2025  
**Issue**: Database schema mismatch in admin expense route  
**Resolution**: Updated query to use correct table and column names from employees table

