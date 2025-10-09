# HR Menu Restrictions - Onboarding Employees Tab

## Overview
Removed "Onboarding Employees" tab from regular HR dashboard. This tab is now **only visible to Super HR** users.

## What Was Changed

### Files Modified

#### 1. `Frontend/src/components/layouts/layout-1/components/main.jsx`
**Line 79-86:** Updated `EMPLOYEE_OPERATIONS` array to conditionally show "Onboarding Employees"

**Before:**
```javascript
const EMPLOYEE_OPERATIONS = [
  { title: 'Employees', path: (isSuperHRPath ? '/super-hr/employee-management' : '/hr/employee-management'), icon: Users },
  { title: 'Onboarding Employees', path: (isSuperHRPath ? '/super-hr/onboarding-employees' : '/hr/onboarding-employees'), icon: UserCheck },
  { title: 'Document Collection', path: (isSuperHRPath ? '/super-hr/document-collection' : '/hr/document-collection'), icon: Upload },
  // ...
];
```

**After:**
```javascript
const EMPLOYEE_OPERATIONS = [
  { title: 'Employees', path: (isSuperHRPath ? '/super-hr/employee-management' : '/hr/employee-management'), icon: Users },
  // Only Super HR can see Onboarding Employees
  ...(isSuperHRPath ? [{ title: 'Onboarding Employees', path: '/super-hr/onboarding-employees', icon: UserCheck }] : []),
  { title: 'Document Collection', path: (isSuperHRPath ? '/super-hr/document-collection' : '/hr/document-collection'), icon: Upload },
  // ...
];
```

#### 2. `Frontend/src/config/layout-1.config.jsx`
**Lines 86-90:** Already commented out (was done previously)

```javascript
// {
//   title: 'Onboarding Employees',
//   icon: UserCheck,
//   path: '/hr/onboarding-employees',
// },
```

#### 3. `Frontend/src/components/layouts/HRLayoutWrapper.jsx`
**Already exists** - This component filters the sidebar menu for regular HRs

```javascript
const filteredMenu = useMemo(() => {
  if (isSuperHR) {
    return MENU_SIDEBAR;
  }
  
  // Regular HR: filter out "Onboarding Employees"
  return MENU_SIDEBAR.filter(item => 
    item.title !== 'Onboarding Employees'
  );
}, [isSuperHR]);
```

## How It Works

### Regular HR Users
- **Sidebar:** Already filtered by `HRLayoutWrapper.jsx` (no change needed)
- **Top Navbar:** Now filtered in `main.jsx` - "Onboarding Employees" tab is **hidden**

### Super HR Users
- **Sidebar:** Shows all menu items
- **Top Navbar:** Shows all tabs including "Onboarding Employees"

## Visual Impact

### Regular HR Dashboard Top Navigation:
```
EMPLOYEE OPERATIONS
├── Employees
├── [Onboarding Employees - REMOVED]
├── Document Collection
├── Assign Leaves
└── Company Policies

MANAGEMENT & ANALYTICS
├── Leave Management
├── Expense Management
├── Attendance
├── Holidays
├── View Projects
└── My Activity
```

### Super HR Dashboard Top Navigation:
```
EMPLOYEE OPERATIONS
├── Employees
├── Onboarding Employees ✓ (VISIBLE)
├── Document Collection
├── Assign Leaves
└── Company Policies

MANAGEMENT & ANALYTICS
├── Leave Management
├── Expense Management
├── Attendance
├── Holidays
├── View Projects
└── HR Config ✓ (Super HR only)
```

## Testing

### Test Cases:

1. **Login as Regular HR**
   - Go to HR Dashboard
   - ✅ "Onboarding Employees" should NOT appear in top navbar
   - ✅ Can still access other tabs (Employees, Document Collection, etc.)

2. **Login as Super HR**
   - Go to HR Dashboard or Super HR Dashboard
   - ✅ "Onboarding Employees" should appear in top navbar
   - ✅ "HR Config" tab should also be visible

3. **Direct URL Access**
   - Regular HR tries to access `/hr/onboarding-employees`
   - ✅ Should be blocked (if route protection is in place)

## Related Files

### Route Configuration
Check these files if you need to add route-level protection:
- `Frontend/src/routing/` - Route definitions
- Backend routes that check `super_hr` flag

### Access Control
- Backend: `Backend/routes/onboarding_routes.py` - Should check `super_hr` flag
- Frontend: `Frontend/src/contexts/UserContext.jsx` - Provides user role info

## Notes

- The change is **purely visual** (UI-level restriction)
- For complete security, **backend routes** should also check `super_hr` flag
- The `/super-hr` path prefix automatically indicates Super HR access
- The conditional rendering uses spread operator for clean array building

## Security Reminder

⚠️ **Important:** This change only hides the menu item from the UI. Make sure backend routes properly validate the `super_hr` flag to prevent unauthorized access via direct API calls.

---

**Status:** ✅ Complete
**Date:** January 9, 2025

