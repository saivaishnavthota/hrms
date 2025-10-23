-- Migration: Add file_data column to expense_attachments table
-- This allows storing file content directly in PostgreSQL as bytea

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

