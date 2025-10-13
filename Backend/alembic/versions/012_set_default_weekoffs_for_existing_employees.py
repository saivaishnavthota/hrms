"""Set default weekoffs for existing employees

Revision ID: 012_set_default_weekoffs_for_existing_employees
Revises: 011_fix_allocation_history_jsonb
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
from datetime import date, timedelta

# revision identifiers, used by Alembic.
revision = '012_set_default_weekoffs_for_existing_employees'
down_revision = '011_fix_allocation_history_jsonb'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Set default weekoffs (Saturday and Sunday) for all existing employees
    who don't already have weekoffs configured for the current year
    """
    # Create a function to set default weekoffs for an employee
    op.execute(text("""
        CREATE OR REPLACE FUNCTION set_default_weekoffs_for_employee(p_employee_id INTEGER)
        RETURNS TEXT
        LANGUAGE plpgsql
        AS $$
        DECLARE
            current_year INTEGER;
            start_date DATE;
            current_date DATE;
            week_start DATE;
            week_end DATE;
            default_off_days TEXT[] := ARRAY['Saturday', 'Sunday'];
            existing_count INTEGER;
        BEGIN
            current_year := EXTRACT(YEAR FROM CURRENT_DATE);
            start_date := DATE(current_year || '-01-01');
            current_date := start_date;
            
            -- Generate weekoffs for the entire year
            WHILE EXTRACT(YEAR FROM current_date) = current_year LOOP
                -- Find the start of the week (Monday)
                week_start := current_date - (EXTRACT(DOW FROM current_date)::INTEGER - 1) * INTERVAL '1 day';
                week_end := week_start + INTERVAL '6 days';
                
                -- Check if weekoff already exists for this week
                SELECT COUNT(*) INTO existing_count
                FROM weekoffs 
                WHERE employee_id = p_employee_id 
                AND week_start = week_start::DATE;
                
                -- Insert default weekoff if it doesn't exist
                IF existing_count = 0 THEN
                    INSERT INTO weekoffs (employee_id, week_start, week_end, off_days)
                    VALUES (p_employee_id, week_start::DATE, week_end::DATE, default_off_days)
                    ON CONFLICT (employee_id, week_start) DO NOTHING;
                END IF;
                
                -- Move to next week
                current_date := week_end + INTERVAL '1 day';
            END LOOP;
            
            RETURN 'Default weekoffs set successfully for employee ' || p_employee_id;
        EXCEPTION
            WHEN OTHERS THEN
                RETURN 'Error setting default weekoffs for employee ' || p_employee_id || ': ' || SQLERRM;
        END;
        $$;
    """))
    
    # Set default weekoffs for all existing employees
    op.execute(text("""
        DO $$
        DECLARE
            emp_record RECORD;
            result TEXT;
        BEGIN
            -- Loop through all employees
            FOR emp_record IN 
                SELECT DISTINCT e.id 
                FROM employees e 
                WHERE e.id IS NOT NULL
            LOOP
                -- Set default weekoffs for this employee
                SELECT set_default_weekoffs_for_employee(emp_record.id) INTO result;
                RAISE NOTICE 'Employee %: %', emp_record.id, result;
            END LOOP;
        END $$;
    """))


def downgrade() -> None:
    """
    Remove the function and optionally remove default weekoffs
    Note: This will not remove existing weekoffs, just the function
    """
    # Drop the function
    op.execute(text("DROP FUNCTION IF EXISTS set_default_weekoffs_for_employee(INTEGER);"))
