# Dynamic Default Leaves Implementation

## Overview
Fixed the Assign Leaves component to dynamically reflect the leave categories configured in HR Config, replacing all hardcoded values with database-driven configuration.

## What Was Fixed

### Problem
- Button text showed hardcoded `(6/6/15)` regardless of configured values
- Default leaves were hardcoded in the `assignDefaultLeaves` function
- Changes in HR Config didn't reflect in the Assign Leaves page

### Solution

#### 1. **Smart Category Name Mapping**
Created `mapCategoryToField()` function that intelligently maps category names to backend fields:

```javascript
// Maps category names to backend fields
const mapCategoryToField = (categoryName) => {
  const name = categoryName.toLowerCase();
  if (name.includes('sick')) return 'sick_leaves';
  if (name.includes('casual')) return 'casual_leaves';
  if (name.includes('annual') || name.includes('paid') || name.includes('earned')) return 'paid_leaves';
  if (name.includes('maternity')) return 'maternity_leave';
  if (name.includes('paternity')) return 'paternity_leave';
  return null;
};
```

**Examples:**
- "Sick Leave" → `sick_leaves`
- "Casual Leave" → `casual_leaves`
- "Annual Leave" / "Paid Leave" / "Earned Leave" → `paid_leaves`
- "Maternity Leave" → `maternity_leave`
- "Paternity Leave" → `paternity_leave`

#### 2. **Dynamic Configuration Builder**
Created `getDefaultLeavesConfig()` function that builds the defaults object from configured categories:

```javascript
const getDefaultLeavesConfig = () => {
  const defaults = {
    sick_leaves: 0,
    casual_leaves: 0,
    paid_leaves: 0,
    maternity_leave: 0,
    paternity_leave: 0,
  };

  leaveCategories.forEach(cat => {
    const field = mapCategoryToField(cat.name);
    if (field) {
      defaults[field] = cat.totalLeaves;
    }
  });

  return defaults;
};
```

#### 3. **Dynamic Button Text**
Created `getButtonText()` function that generates the button text based on configured values:

```javascript
const getButtonText = () => {
  if (leaveCategories.length === 0) {
    return 'Assign Default Leaves';
  }
  
  const values = [];
  const config = getDefaultLeavesConfig();
  
  // Show the main leave types
  if (config.sick_leaves > 0) values.push(config.sick_leaves);
  if (config.casual_leaves > 0) values.push(config.casual_leaves);
  if (config.paid_leaves > 0) values.push(config.paid_leaves);
  
  if (values.length > 0) {
    return `Assign Default Leaves (${values.join('/')})`;
  }
  
  return 'Assign Default Leaves';
};
```

**Examples:**
- Config: Sick=10, Casual=12, Annual=20 → Button: `Assign Default Leaves (10/12/20)`
- Config: Sick=5, Annual=15 → Button: `Assign Default Leaves (5/15)`
- No config → Button: `Assign Default Leaves`

#### 4. **Updated Assignment Logic**
Modified `assignDefaultLeaves()` to use dynamic configuration:

```javascript
const assignDefaultLeaves = async () => {
  // ... validation code ...
  
  // Get defaults from configured leave categories
  const DEFAULTS = getDefaultLeavesConfig();
  
  // Check if any leaves are configured
  const hasLeaves = Object.values(DEFAULTS).some(val => val > 0);
  if (!hasLeaves) {
    toast.error('No leave categories configured. Please configure leave categories in HR Config first.');
    return;
  }
  
  // ... rest of assignment logic uses DEFAULTS ...
};
```

## How It Works

### Flow:
1. **Page Load** → Fetches leave categories from API
2. **Category Mapping** → Maps category names to backend fields
3. **Button Text** → Dynamically generated from configured values
4. **Assignment** → Uses configured values instead of hardcoded ones

### Example Scenarios:

#### Scenario 1: Standard Configuration
```
HR Config:
- Sick Leave: 6 days
- Casual Leave: 6 days  
- Annual Leave: 15 days

Result:
- Button: "Assign Default Leaves (6/6/15)"
- Assigns: sick_leaves=6, casual_leaves=6, paid_leaves=15
```

#### Scenario 2: Custom Configuration
```
HR Config:
- Sick Leave: 10 days
- Paid Leave: 20 days
- Maternity Leave: 90 days

Result:
- Button: "Assign Default Leaves (10/20)"
- Assigns: sick_leaves=10, paid_leaves=20, maternity_leave=90
```

#### Scenario 3: No Configuration
```
HR Config: (empty)

Result:
- Button: "Assign Default Leaves"
- Click: Shows error "No leave categories configured..."
```

## Benefits

✅ **Real-time Updates** - Changes in HR Config immediately reflect in Assign Leaves
✅ **Flexible Naming** - Works with various category names (Sick/Sick Leave/Sickness, etc.)
✅ **User Feedback** - Clear button text shows what will be assigned
✅ **Validation** - Prevents assignment when no leaves are configured
✅ **Maintainable** - No hardcoded values to update

## Testing

### Test Cases:

1. **Configure default categories** in HR Config
   - Add: Sick Leave (6), Casual Leave (6), Annual Leave (15)
   - Go to Assign Leaves
   - ✅ Button should show: `Assign Default Leaves (6/6/15)`

2. **Change values** in HR Config
   - Update: Sick Leave to 10
   - Refresh Assign Leaves page
   - ✅ Button should show: `Assign Default Leaves (10/6/15)`

3. **Add new category**
   - Add: Maternity Leave (90)
   - Refresh Assign Leaves page
   - ✅ Button text updates, assignment includes maternity leave

4. **No configuration**
   - Delete all leave categories
   - Go to Assign Leaves
   - ✅ Button shows: `Assign Default Leaves`
   - ✅ Click shows error message

5. **Custom naming**
   - Create categories: "Sickness" (5), "Earned Leave" (20)
   - ✅ Maps to: sick_leaves=5, paid_leaves=20
   - ✅ Button shows: `Assign Default Leaves (5/20)`

## Files Modified

1. **Frontend/src/components/HR/AssignLeaves.jsx**
   - Added `mapCategoryToField()` helper
   - Added `getDefaultLeavesConfig()` function
   - Added `getButtonText()` function
   - Updated `assignDefaultLeaves()` to use dynamic config
   - Updated button to use `getButtonText()`

## Notes

- The category name matching is **case-insensitive** and uses **partial matching**
- Only **Sick**, **Casual**, and **Annual/Paid** leaves show in the button text (primary types)
- **Maternity** and **Paternity** leaves are assigned but not shown in button text (to keep it concise)
- If a category name doesn't match any known pattern, it's **ignored** (won't cause errors)

## Future Enhancements

Possible improvements:
1. Show all configured categories in button tooltip
2. Add a "Preview" button to see what will be assigned
3. Support custom field mapping via configuration
4. Add bulk import from CSV with custom mappings

---

**Status:** ✅ Complete and Working
**Date:** January 9, 2025

