# Admin API Endpoints - Documentation

## Overview
This document provides detailed information about the Admin-specific API endpoints for fetching leaves and expenses.

---

## 1. Get All Leave Requests (Admin)

### Endpoint
```
GET /leave/admin/all-leave-requests
```

### Access
- **Role Required**: Admin only
- **Authentication**: Bearer token required

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status: `pending`, `approved`, `rejected`, or omit for all |

### Request Examples

**Get all leave requests:**
```bash
curl -X GET "http://localhost:8000/leave/admin/all-leave-requests" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get only pending leaves:**
```bash
curl -X GET "http://localhost:8000/leave/admin/all-leave-requests?status=pending" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get only approved leaves:**
```bash
curl -X GET "http://localhost:8000/leave/admin/all-leave-requests?status=approved" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Response Format
```json
[
  {
    "id": 56,
    "employee_id": 81,
    "employee_name": "John Doe",
    "employee_email": "john.doe@company.com",
    "leave_type": "Annual Leave",
    "start_date": "2025-10-05",
    "end_date": "2025-10-11",
    "no_of_days": 5,
    "reason": "vacation",
    "status": "Approved",
    "manager_status": "Approved",
    "hr_status": "Approved",
    "manager_remarks": null,
    "hr_remarks": null,
    "created_at": "2025-10-04 22:49:09.997009",
    "updated_at": "2025-10-04 22:50:09.240676"
  },
  {
    "id": 58,
    "employee_id": 71,
    "employee_name": "Jane Smith",
    "employee_email": "jane.smith@company.com",
    "leave_type": "Sick Leave",
    "start_date": "2025-10-09",
    "end_date": "2025-10-11",
    "no_of_days": 3,
    "reason": "Sick",
    "status": "Pending",
    "manager_status": "Pending",
    "hr_status": "Pending",
    "manager_remarks": null,
    "hr_remarks": null,
    "created_at": "2025-10-08 07:17:04.162374",
    "updated_at": "2025-10-08 07:17:04.162374"
  }
]
```

### Database Query
```sql
SELECT 
    lm.id,
    lm.employee_id,
    u.name AS employee_name,
    u.company_email AS employee_email,
    lm.leave_type,
    lm.start_date,
    lm.end_date,
    lm.no_of_days,
    lm.reason,
    lm.status,
    lm.manager_status,
    lm.hr_status,
    lm.manager_remarks,
    lm.hr_remarks,
    lm.created_at,
    lm.updated_at
FROM leave_management lm
INNER JOIN employees u ON lm.employee_id = u.id
WHERE u.o_status = true
-- Optional filters:
-- AND (lm.manager_status = 'Pending' OR lm.hr_status = 'Pending') -- for status=pending
-- AND (lm.manager_status = 'Approved' AND lm.hr_status = 'Approved') -- for status=approved
-- AND (lm.manager_status = 'Rejected' OR lm.hr_status = 'Rejected') -- for status=rejected
ORDER BY lm.created_at DESC;
```

---

## 2. Get All Expense Requests (Admin)

### Endpoint
```
GET /expenses/admin/all-expense-requests
```

### Access
- **Role Required**: Admin only
- **Authentication**: Bearer token required

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status: `pending_manager_approval`, `pending_hr_approval`, `approved`, etc., or omit for all |

### Request Examples

**Get all expense requests:**
```bash
curl -X GET "http://localhost:8000/expenses/admin/all-expense-requests" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get only pending manager approval:**
```bash
curl -X GET "http://localhost:8000/expenses/admin/all-expense-requests?status=pending_manager_approval" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get only approved expenses:**
```bash
curl -X GET "http://localhost:8000/expenses/admin/all-expense-requests?status=approved" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Response Format
```json
[
  {
    "request_id": 63,
    "request_code": "EXP-20251010-8EF394",
    "employee_id": 71,
    "employee_name": "Jane Smith",
    "employee_email": "jane.smith@company.com",
    "department": "Engineering",
    "designation": "Software Engineer",
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
    "attachments": [
      {
        "id": 123,
        "file_name": "receipt.pdf",
        "file_url": "https://...",
        "file_type": "application/pdf",
        "uploaded_at": "2025-10-10 08:12:15"
      }
    ]
  },
  {
    "request_id": 64,
    "request_code": "EXP-20251013-FDF547",
    "employee_id": 71,
    "employee_name": "Jane Smith",
    "employee_email": "jane.smith@company.com",
    "department": "Engineering",
    "designation": "Software Engineer",
    "category": "Food",
    "amount": 1000.0,
    "currency": "INR",
    "description": "Food",
    "expense_date": "2025-10-13",
    "tax_included": false,
    "status": "pending_manager_approval",
    "discount_percentage": 0.0,
    "cgst_percentage": 0.0,
    "sgst_percentage": 0.0,
    "final_amount": 1000.0,
    "created_at": "2025-10-13 08:14:35.121825",
    "updated_at": "2025-10-13 08:14:35.121852",
    "attachments": []
  }
]
```

### Database Query
```sql
SELECT
    er.request_id,
    er.request_code,
    er.employee_id,
    e.name AS employee_name,
    e.company_email AS employee_email,
    em.department,
    em.designation,
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
LEFT JOIN employee_master em ON e.id = em.employee_id
LEFT JOIN expense_attachments ea ON er.request_id = ea.request_id
WHERE e.o_status = true 
  AND er.deleted_at IS NULL
-- Optional filter:
-- AND er.status = 'pending_manager_approval' -- for specific status
GROUP BY
    er.request_id, er.request_code, er.employee_id, e.name, e.company_email,
    em.department, em.designation, er.category, er.amount, er.currency,
    er.description, er.expense_date, er.tax_included, er.status, 
    er.discount_percentage, er.cgst_percentage, er.sgst_percentage, 
    er.final_amount, er.created_at, er.updated_at
ORDER BY er.created_at DESC;
```

---

## Status Values

### Leave Status Values
- **Pending**: Either manager or HR hasn't approved yet
- **Approved**: Both manager and HR have approved
- **Rejected**: Either manager or HR has rejected

### Expense Status Values
- `pending_manager_approval` - Waiting for manager approval
- `pending_hr_approval` - Waiting for HR approval
- `pending_account_mgr_approval` - Waiting for account manager approval
- `approved` - Fully approved
- `manager_rejected` - Rejected by manager
- `hr_rejected` - Rejected by HR
- `carried_forward` - Carried forward to next period

---

## Error Responses

### 403 Forbidden (Non-Admin User)
```json
{
  "detail": "Access denied: Admin only"
}
```

### 401 Unauthorized (No Token)
```json
{
  "detail": "Not authenticated"
}
```

---

## Testing with Sample Data

Based on your database sample:

**Leave ID 56 (Approved)**
- Employee: ID 81
- Dates: 2025-10-05 to 2025-10-11 (5 days)
- Type: Annual Leave
- Status: Approved by both Manager and HR

**Leave ID 58 (Pending)**
- Employee: ID 71
- Dates: 2025-10-09 to 2025-10-11 (3 days)
- Type: Sick Leave
- Status: Pending with both Manager and HR

**Expense ID 63 (Pending)**
- Employee: ID 71
- Code: EXP-20251010-8EF394
- Amount: 600 INR (Final: 540 INR after discount and tax)
- Status: pending_manager_approval

**Expense ID 64 (Pending)**
- Employee: ID 71
- Code: EXP-20251013-FDF547
- Amount: 1000 INR (Final: 1000 INR, no tax)
- Status: pending_manager_approval

---

## Integration Notes

1. **Frontend Usage**: The Admin dashboard and components automatically use these endpoints
2. **Pagination**: Not implemented yet; all records are returned
3. **Performance**: Queries are optimized with proper JOINs and indexes
4. **Security**: All routes check for Admin role before execution
5. **Soft Deletes**: Expenses with `deleted_at` not null are excluded

---

**Last Updated**: October 16, 2025
**API Version**: 1.0

