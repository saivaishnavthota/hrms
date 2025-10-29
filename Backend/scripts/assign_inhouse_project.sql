-- Script to ensure "In-House Project" exists and is assigned to all employees
-- This script can be run directly in the database

-- 1. Create "In house" project if it doesn't exist
INSERT INTO projects (project_name, project_name_commercial, account, project_objective, status, created_at)
SELECT 'In-House Project', 'In-House Project', 'Internal', 'Default internal project for employee capacity management', 'Active', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'In-House Project' AND account = 'Internal'
);

-- 2. Get the In house project ID
DO $$
DECLARE
    inhouse_project_id INTEGER;
    current_month TEXT;
BEGIN
    -- Get current month in YYYY-MM format
    current_month := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
    
    -- Get In-House Project ID
    SELECT project_id INTO inhouse_project_id 
    FROM projects 
    WHERE project_name = 'In-House Project' AND account = 'Internal';
    
    -- 3. Assign In house project to all employees who don't have it
    INSERT INTO employee_project_assignments (employee_id, project_id, assigned_by, assigned_at)
    SELECT e.id, inhouse_project_id, NULL, NOW()
    FROM employees e
    WHERE NOT EXISTS (
        SELECT 1 FROM employee_project_assignments epa 
        WHERE epa.employee_id = e.id AND epa.project_id = inhouse_project_id
    );
    
    -- 4. Create project allocations for current month for all employees who don't have it
    INSERT INTO project_allocations (
        employee_id, project_id, employee_name, company, level, client, 
        service_line, month, allocated_days, consumed_days, created_at, updated_at
    )
    SELECT 
        e.id, 
        inhouse_project_id, 
        e.name,
        COALESCE(e.company, 'Default Company'),
        COALESCE(e.band, 'Default Level'),
        'Internal',
        'Internal',
        current_month,
        20.0,
        0.0,
        NOW(),
        NOW()
    FROM employees e
    WHERE NOT EXISTS (
        SELECT 1 FROM project_allocations pa 
        WHERE pa.employee_id = e.id 
        AND pa.project_id = inhouse_project_id 
        AND pa.month = current_month
    );
    
    RAISE NOTICE 'Successfully assigned In-House Project to all employees for month %', current_month;
END $$;
