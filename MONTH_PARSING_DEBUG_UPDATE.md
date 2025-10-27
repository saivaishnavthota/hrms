# Month Column Parsing Debug Update

## 🐛 **Issue Identified**
The Excel import was failing with "No month columns found" error even though the Excel file contains "Nov-25" and "Dec-25" columns.

## 🔧 **Debugging Improvements Made**

### **1. Enhanced Logging**
```python
# Added detailed logging to track column parsing
logger.info(f"Read Excel file with {len(df)} rows and {len(df.columns)} columns")
logger.info(f"Column names: {list(df.columns)}")

for i, col in enumerate(df.columns):
    logger.info(f"Checking column {i}: '{col}' (type: {type(col)})")
    month_str = ProjectAllocationService.parse_month_header(col)
    if month_str:
        month_columns.append((i, col, month_str))
        logger.info(f"Found month column: '{col}' -> '{month_str}'")
```

### **2. Improved Month Header Parsing**
```python
# Enhanced parsing with multiple patterns
patterns = [
    r'^([A-Za-z]{3})-(\d{2})$',  # Nov-25, Dec-25
    r'^([A-Za-z]{3})-(\d{4})$',  # Nov-2025, Dec-2025
    r'^([A-Za-z]+)-(\d{2})$',    # November-25, December-25
    r'^([A-Za-z]+)-(\d{4})$',    # November-2025, December-2025
]

# Try different date formats
date_formats = [
    f"{month_part}-{year_part}",  # Nov-25, Nov-2025
    f"{month_part} {year_part}",  # Nov 25, Nov 2025
]
```

### **3. Better Error Messages**
```python
# Enhanced error message with debugging info
if not month_columns:
    # Try to find any columns that might be month-related
    potential_months = []
    for i, col in enumerate(df.columns):
        col_str = str(col).strip()
        # Check for various month patterns
        if any(month in col_str.lower() for month in ['nov', 'dec', 'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct']):
            potential_months.append(f"Column {i}: '{col_str}'")
    
    error_msg = "No month columns found. Expected format: 'Nov-25', 'Dec-25', etc."
    if potential_months:
        error_msg += f"\n\nFound potential month columns: {', '.join(potential_months[:5])}"
    error_msg += f"\n\nAll columns found: {', '.join([f\"'{col}'\" for col in df.columns])}"
```

## 🎯 **What This Will Show**

### **If the parsing works correctly:**
- ✅ Logs will show: "Found month column: 'Nov-25' -> '2025-11'"
- ✅ Import will proceed normally

### **If there's still an issue:**
- 🔍 **Detailed column list**: Shows exactly what columns are being read from Excel
- 🔍 **Potential month detection**: Identifies columns that might be months
- 🔍 **Column-by-column analysis**: Shows what each column looks like to the parser

## 🚀 **Next Steps**

1. **Try the import again** with the same Excel file
2. **Check the logs** to see what columns are being detected
3. **If still failing**, the error message will now show:
   - All column names found in the Excel file
   - Which columns might be month-related
   - Exact format of each column

## 📋 **Expected Results**

The enhanced parsing should now handle:
- ✅ `Nov-25` → `2025-11`
- ✅ `Dec-25` → `2025-12`
- ✅ `Nov-2025` → `2025-11`
- ✅ `December-25` → `2025-12`
- ✅ Various spacing and case variations

## 🔍 **Debugging Information**

If the issue persists, the error message will now provide:
1. **Complete column list** from the Excel file
2. **Potential month columns** detected
3. **Column-by-column parsing results**

This will help identify exactly what's happening with the Excel file parsing.
