-- Migration: Add project_name_commercial and account columns to projects table
-- This allows storing commercial project names and account information

-- Add project_name_commercial column
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS project_name_commercial VARCHAR(100);

-- Add account column  
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS account VARCHAR(100);

-- Add comments for documentation
COMMENT ON COLUMN projects.project_name_commercial IS 'Commercial name for the project (displayed in project assignments)';
COMMENT ON COLUMN projects.account IS 'Account name associated with the project';

-- Update existing projects with default values if needed (optional)
-- UPDATE projects SET project_name_commercial = project_name WHERE project_name_commercial IS NULL;
-- UPDATE projects SET account = 'Default Account' WHERE account IS NULL;
