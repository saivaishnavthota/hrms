# Expense File Storage Migration Guide
## From Local File Storage to PostgreSQL Bytea

This guide explains the migration from local file storage to PostgreSQL bytea storage for expense attachments.

---

## ✅ Changes Made

### 1. Database Schema Changes
Files are now stored directly in PostgreSQL as binary data (bytea) instead of the local filesystem.

### 2. Backend Changes
- **Removed**: Local file storage functions and endpoints
- **Added**: Database bytea storage for file content
- **Updated**: File serving endpoint to retrieve from database
- **Modified**: All file upload endpoints to store in database

### 3. File Size Limit
- Maximum file size: **70 KB** per attachment (enforced in backend)

---

## 📋 Database Migration Steps

### Step 1: Run the SQL Migration Script

Execute this SQL script on your PostgreSQL database:

```bash
cd /home/pradeep1a/saivaishnav/hrms/Backend
psql -U your_username -d your_database_name -f migrations/add_file_data_to_expense_attachments.sql
```

**Or manually run these SQL commands:**

```sql
-- Add file_data column to store binary file content
ALTER TABLE expense_attachments 
ADD COLUMN IF NOT EXISTS file_data BYTEA;

-- Add content_type column if not exists (for proper file serving)
ALTER TABLE expense_attachments 
ADD COLUMN IF NOT EXISTS content_type VARCHAR(100);

-- Make file_url nullable since we'll generate it on-the-fly
ALTER TABLE expense_attachments 
ALTER COLUMN file_url DROP NOT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_expense_attachments_request_id 
ON expense_attachments(request_id);

-- Add comment for documentation
COMMENT ON COLUMN expense_attachments.file_data IS 'Binary file content stored as bytea (max 70KB per expense rules)';
COMMENT ON COLUMN expense_attachments.content_type IS 'MIME type of the file (e.g., image/png, application/pdf)';
```

### Step 2: Verify Migration

Check that the columns were added successfully:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'expense_attachments' 
AND column_name IN ('file_data', 'content_type');
```

Expected output:
```
 column_name  | data_type | is_nullable 
--------------+-----------+-------------
 file_data    | bytea     | YES
 content_type | varchar   | YES
```

---

## 🔧 How It Works Now

### File Upload Flow
1. **User uploads file** → Frontend sends multipart/form-data
2. **Backend receives file** → Validates size (max 70KB)
3. **Store in database** → Binary data saved in `expense_attachments.file_data` column
4. **Generate URL** → Dynamic URL like `https://hrms.nxzen.com/expenses/attachment/{attachment_id}`
5. **Return metadata** → Attachment ID, filename, URL, size, type

### File Retrieval Flow
1. **User clicks attachment** → Requests `/expenses/attachment/{attachment_id}`
2. **Backend fetches from DB** → Retrieves bytea data and content-type
3. **Serve as response** → Returns file with proper MIME type
4. **Browser displays** → Images show inline, PDFs open in viewer

---

## 🌐 API Endpoints

### Upload Expense with Attachments
```http
POST /expenses/submit-exp
Content-Type: multipart/form-data

Form Fields:
- employee_id: int
- category: string
- amount: float
- currency: string
- description: string
- expense_date: string (YYYY-MM-DD)
- tax_included: boolean
- files: File[] (max 70KB each)
- discount: float (optional)
- cgst: float (optional)
- sgst: float (optional)

Response:
{
  "request_id": 123,
  "request_code": "EXP-2024-001",
  "attachments": [
    {
      "attachment_id": 456,
      "file_name": "receipt.pdf",
      "file_url": "https://hrms.nxzen.com/expenses/attachment/456",
      "file_type": "application/pdf",
      "file_size": 45.2,
      "uploaded_at": "2024-01-15T10:30:00"
    }
  ]
}
```

### Get Attachment File
```http
GET /expenses/attachment/{attachment_id}

Response:
- Binary file content with proper Content-Type header
- Content-Disposition: inline (displays in browser)
```

### Storage Information
```http
GET /expenses/storage-info

Response:
{
  "status": "success",
  "data": {
    "total_files": 150,
    "total_size_kb": 5432.5,
    "total_size_mb": 5.31,
    "total_size_bytes": 5562880,
    "storage_type": "PostgreSQL Database (bytea)"
  }
}
```

---

## 🎯 Benefits of Database Storage

### Advantages
✅ **Simplified Architecture**: No need to manage filesystem permissions or paths
✅ **Atomic Operations**: File and metadata updates are transactional
✅ **Backup Simplicity**: Files included in regular database backups
✅ **Scalability**: Works seamlessly with database replication
✅ **Security**: No direct filesystem access needed
✅ **Cloud-Ready**: Works on any cloud platform without filesystem concerns

### Performance Considerations
- ✅ **70KB limit** ensures database performance
- ✅ **Indexed lookups** for fast retrieval
- ✅ **BYTEA storage** is efficient in PostgreSQL
- ✅ **No disk I/O** for file operations

---

## 🔒 Security

### File Size Validation
- Maximum 70KB per file enforced at backend
- Prevents database bloat
- Quick upload/download times

### Access Control
- Files served through authenticated endpoints
- Can add role-based access checks if needed
- No direct URL access to files

### Content Type Validation
- File MIME types stored and validated
- Prevents malicious file uploads
- Proper browser rendering

---

## 📊 Database Storage Example

```sql
-- View stored files
SELECT 
    attachment_id,
    request_id,
    file_name,
    content_type,
    file_size,
    OCTET_LENGTH(file_data) as actual_bytes,
    uploaded_at
FROM expense_attachments
WHERE file_data IS NOT NULL
ORDER BY uploaded_at DESC
LIMIT 10;

-- Storage usage by request
SELECT 
    er.request_code,
    COUNT(ea.attachment_id) as file_count,
    SUM(ea.file_size) as total_kb,
    SUM(OCTET_LENGTH(ea.file_data)) as total_bytes
FROM expense_requests er
LEFT JOIN expense_attachments ea ON er.request_id = ea.request_id
WHERE ea.file_data IS NOT NULL
GROUP BY er.request_code
ORDER BY total_bytes DESC;
```

---

## 🚀 Deployment Steps

1. **Backup Database**
   ```bash
   pg_dump -U username -d database_name > backup_before_migration.sql
   ```

2. **Run Migration Script**
   ```bash
   psql -U username -d database_name -f migrations/add_file_data_to_expense_attachments.sql
   ```

3. **Restart Backend Server**
   ```bash
   cd /home/pradeep1a/saivaishnav/hrms/Backend
   # Stop current server (Ctrl+C)
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

4. **Test File Upload**
   - Create new expense with attachment
   - Verify file is stored in database
   - Click attachment to verify it displays correctly

5. **Monitor Storage**
   ```bash
   curl https://hrms.nxzen.com/expenses/storage-info
   ```

---

## 📝 Notes

- **Existing Files**: Old files in local storage are not migrated automatically
- **New Uploads**: All new uploads go directly to database
- **File URLs**: Generated dynamically, not stored in database
- **Backward Compatibility**: Old local file endpoints removed
- **Database Size**: Monitor database size as files accumulate

---

## 🆘 Troubleshooting

### Issue: File upload fails
**Solution**: Check file size is under 70KB

### Issue: Attachment doesn't display
**Solution**: Verify `file_data` column has content and `content_type` is correct

### Issue: Database size growing rapidly
**Solution**: Review file size limit, check for duplicate uploads

### Issue: Slow file serving
**Solution**: Ensure index on `request_id` exists, check database performance

---

## 📞 Support

For issues or questions, check:
- Backend logs for error messages
- Database query performance
- File size and content-type validity

