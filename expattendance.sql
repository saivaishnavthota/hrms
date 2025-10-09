--
-- PostgreSQL Database Schema for HRMS
-- Generated from Alembic migrations: 001-009
-- Clean schema with no data - only tables, views, functions, procedures, and triggers
-- Last updated: 2025-01-30
--

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Sequences
CREATE SEQUENCE IF NOT EXISTS public.expense_request_seq START WITH 1 INCREMENT BY 1;

-- =====================================================
-- TABLES
-- =====================================================

-- Locations Table
CREATE TABLE public.locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL
);

-- Employees Table (Main User Table)
CREATE TABLE public.employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    password_hash VARCHAR,
    role VARCHAR(100),
    o_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    reset_otp VARCHAR(6),
    company_email VARCHAR(100),
    company_employee_id VARCHAR(50),
    reassignment BOOLEAN DEFAULT FALSE,
    login_status BOOLEAN DEFAULT FALSE,
    location_id INTEGER REFERENCES locations(id),
    employment_type VARCHAR(50) DEFAULT 'Full-Time',
    doj TIMESTAMP,
    super_hr BOOLEAN DEFAULT FALSE
);

-- Employee Master Table


-- Employee Details Table
CREATE TABLE public.employee_details (
    employee_id INTEGER PRIMARY KEY REFERENCES employees(id),
    full_name VARCHAR(150) NOT NULL,
    contact_no VARCHAR(15) NOT NULL,
    personal_email VARCHAR(100),
    company_email VARCHAR(100),
    doj DATE,
    dob DATE NOT NULL,
    address TEXT,
    gender VARCHAR(10),
    graduation_year INTEGER,
    work_experience_years INTEGER DEFAULT 0 NOT NULL,
    emergency_contact_name VARCHAR,
    emergency_contact_number VARCHAR,
    emergency_contact_relation VARCHAR,
    employment_type VARCHAR(20),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Employee Managers Table (Additional Managers)
CREATE TABLE public.employee_managers (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    manager_id INTEGER NOT NULL REFERENCES employees(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Employee HRs Table (Additional HRs)
CREATE TABLE public.employee_hrs (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    hr_id INTEGER NOT NULL REFERENCES employees(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Onboarding Employees Table
CREATE TABLE public.onboarding_employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    password VARCHAR,
    role VARCHAR(100),
    type VARCHAR(100),
    o_status BOOLEAN DEFAULT FALSE,
    login_status BOOLEAN DEFAULT FALSE
);

-- Onboarding Employee Documents Table
CREATE TABLE public.onboarding_emp_docs (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    doc_type VARCHAR NOT NULL,
    file_name VARCHAR,
    file_url VARCHAR,
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Onboarding Employee Details Table
CREATE TABLE public.onboarding_emp_details (
    employee_id INTEGER PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    contact_no VARCHAR(15) NOT NULL,
    personal_email VARCHAR(100),
    company_email VARCHAR(100),
    doj DATE,
    dob DATE NOT NULL,
    address TEXT,
    gender VARCHAR(10),
    graduation_year INTEGER,
    work_experience_years INTEGER DEFAULT 0,
    emergency_contact_name VARCHAR(100),
    emergency_contact_number VARCHAR(15),
    emergency_contact_relation VARCHAR(50),
    employment_type VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT onboarding_emp_details_employment_type_check CHECK (employment_type IN ('Full-Time', 'Intern', 'Contract')),
    CONSTRAINT onboarding_emp_details_gender_check CHECK (gender IN ('Male', 'Female', 'Other')),
    CONSTRAINT onboarding_emp_details_graduation_year_check CHECK (graduation_year >= 1900 AND graduation_year <= EXTRACT(YEAR FROM CURRENT_DATE))
);

-- Projects Table
CREATE TABLE public.projects (
    project_id SERIAL PRIMARY KEY,
    project_name VARCHAR NOT NULL,
    project_objective VARCHAR,
    client_requirements VARCHAR,
    budget FLOAT,
    start_date DATE,
    end_date DATE,
    skills_required VARCHAR,
    status VARCHAR NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Employee Project Assignments Table
CREATE TABLE public.employee_project_assignments (
    assignment_id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    project_id INTEGER NOT NULL REFERENCES projects(project_id),
    assigned_by INTEGER REFERENCES employees(id),
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Project Status Logs Table
CREATE TABLE public.project_status_logs (
    log_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(project_id),
    updated_by INTEGER REFERENCES employees(id),
    new_status VARCHAR,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Attendance Table (Updated to use FLOAT for hours)
CREATE TABLE public.attendance (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    date DATE NOT NULL,
    day VARCHAR,
    action VARCHAR,
    status VARCHAR,
    hours FLOAT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(employee_id, date)
);

-- Attendance Projects Table
CREATE TABLE public.attendance_projects (
    attendance_project_id SERIAL PRIMARY KEY,
    attendance_id INTEGER NOT NULL REFERENCES attendance(id),
    project_id INTEGER NOT NULL REFERENCES projects(project_id),
    sub_task VARCHAR,
    hours FLOAT
);

-- Employee Documents Table
CREATE TABLE public.employee_documents (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    doc_type VARCHAR NOT NULL,
    file_id VARCHAR NOT NULL,
    file_name VARCHAR NOT NULL,
    file_url VARCHAR NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Request Logs Table
CREATE TABLE public.request_logs (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    document_type VARCHAR NOT NULL,
    status VARCHAR NOT NULL,
    requested_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Expense Requests Table
CREATE TABLE public.expense_requests (
    request_id SERIAL PRIMARY KEY,
    request_code VARCHAR NOT NULL,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    category VARCHAR NOT NULL,
    amount FLOAT NOT NULL,
    currency VARCHAR NOT NULL,
    description VARCHAR,
    expense_date TIMESTAMP NOT NULL,
    tax_included BOOLEAN NOT NULL,
    status VARCHAR NOT NULL,
    discount_percentage FLOAT,
    cgst_percentage FLOAT,
    sgst_percentage FLOAT,
    final_amount FLOAT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Expense Attachments Table
CREATE TABLE public.expense_attachments (
    attachment_id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES expense_requests(request_id),
    file_name VARCHAR NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR,
    file_size FLOAT,
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Expense History Table
CREATE TABLE public.expense_history (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES expense_requests(request_id),
    action_by INTEGER NOT NULL REFERENCES employees(id),
    action_role VARCHAR NOT NULL,
    action VARCHAR NOT NULL,
    reason VARCHAR,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Leave Management Table
CREATE TABLE public.leave_management (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    reason VARCHAR,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    no_of_days INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    manager_status VARCHAR(20) NOT NULL,
    hr_status VARCHAR(20) NOT NULL,
    leave_type VARCHAR(20)
);

-- Leave Balance Table
CREATE TABLE public.leave_balance (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    sick_leaves INTEGER NOT NULL,
    casual_leaves INTEGER NOT NULL,
    paid_leaves INTEGER NOT NULL,
    maternity_leave INTEGER,
    paternity_leave INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Leave Approvals Table
CREATE TABLE public.leave_approvals (
    id SERIAL PRIMARY KEY,
    leave_id INTEGER NOT NULL REFERENCES leave_management(id),
    approver_id INTEGER NOT NULL REFERENCES employees(id),
    approver_role VARCHAR(50),
    status VARCHAR(20) NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Weekoff Table
CREATE TABLE public.weekoffs (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    off_days TEXT[] NOT NULL,
    UNIQUE(employee_id, week_start)
);

-- Company Policies Table
CREATE TABLE public.company_policies (
    id SERIAL PRIMARY KEY,
    location_id INTEGER NOT NULL REFERENCES locations(id),
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_by INTEGER NOT NULL REFERENCES employees(id),
    sections_json JSON,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Sessions Table (for authentication and session management)
CREATE TABLE public.sessions (
    session_id VARCHAR PRIMARY KEY,
    user_id INTEGER NOT NULL,
    role VARCHAR NOT NULL,
    user_type VARCHAR NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Master Calendar Table (for holidays management)
CREATE TABLE public.master_calendar (
    id SERIAL PRIMARY KEY,
    location_id INTEGER NOT NULL REFERENCES locations(id),
    holiday_date DATE NOT NULL,
    holiday_name VARCHAR NOT NULL,
    UNIQUE(location_id, holiday_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS ix_company_policies_location_id ON public.company_policies(location_id);
CREATE INDEX IF NOT EXISTS ix_company_policies_deleted_at ON public.company_policies(deleted_at);

-- =====================================================
-- VIEWS
-- =====================================================

-- Project Subtask Hours View (Used for attendance reporting)
CREATE OR REPLACE VIEW public.project_subtask_hours AS
SELECT 
    a.employee_id,
    a.date,
    ap.attendance_id,
    ap.project_id,
    p.project_name,
    ap.sub_task,
    ap.hours,
    SUM(ap.hours) OVER (PARTITION BY a.employee_id, a.date, ap.project_id) AS total_project_hours
FROM attendance a
JOIN attendance_projects ap ON a.id = ap.attendance_id
JOIN projects p ON ap.project_id = p.project_id
WHERE ap.hours IS NOT NULL;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- 1. Generate Request Code Function
CREATE OR REPLACE FUNCTION public.generate_request_code() 
RETURNS VARCHAR
LANGUAGE plpgsql
AS $$
DECLARE
    new_code VARCHAR;
    seq_num BIGINT;
BEGIN
    seq_num := nextval('expense_request_seq');
    new_code := 'EXP-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || lpad(seq_num::text, 4, '0');
    RETURN new_code;
END;
$$;

-- 2. Add Employee Function
CREATE OR REPLACE FUNCTION public.add_employee(
    e_name VARCHAR, 
    e_email VARCHAR, 
    e_role VARCHAR, 
    e_type VARCHAR
) 
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    temp_password TEXT;
BEGIN
    temp_password := substr(md5(random()::text), 1, 8);
    INSERT INTO onboarding_employees(name, email, role, type, password)
    VALUES(e_name, e_email, e_role, e_type, crypt(temp_password, gen_salt('bf')));
    RETURN temp_password;
END;
$$;

-- 3. Employee Details Function
CREATE OR REPLACE FUNCTION public.emp_details(
    e_emp_id INTEGER, 
    e_full_name VARCHAR, 
    e_contact_no VARCHAR, 
    e_personal_mail VARCHAR, 
    e_dob DATE, 
    e_address TEXT, 
    e_gender VARCHAR, 
    e_grad_year INTEGER, 
    e_w_exp INTEGER, 
    e_eme_c_name VARCHAR, 
    e_eme_c_no VARCHAR, 
    e_eme_c_rel VARCHAR
) 
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO onboarding_emp_details(
        employee_id, full_name, contact_no, personal_email,
        dob, address, gender, graduation_year, work_experience_years,
        emergency_contact_name, emergency_contact_number, emergency_contact_relation
    )
    VALUES(
        e_emp_id, e_full_name, e_contact_no, e_personal_mail, e_dob, e_address, e_gender,
        e_grad_year, e_w_exp, e_eme_c_name, e_eme_c_no, e_eme_c_rel
    )
    ON CONFLICT (employee_id) 
    DO UPDATE SET
        full_name = EXCLUDED.full_name,
        contact_no = EXCLUDED.contact_no,
        personal_email = EXCLUDED.personal_email,
        dob = EXCLUDED.dob,
        address = EXCLUDED.address,
        gender = EXCLUDED.gender,
        graduation_year = EXCLUDED.graduation_year,
        work_experience_years = EXCLUDED.work_experience_years,
        emergency_contact_name = EXCLUDED.emergency_contact_name,
        emergency_contact_number = EXCLUDED.emergency_contact_number,
        emergency_contact_relation = EXCLUDED.emergency_contact_relation;
END;
$$;

-- 4. Forgot Password Function
CREATE OR REPLACE FUNCTION public.forgot_password(e_email VARCHAR) 
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    temp_password TEXT;
BEGIN
    temp_password := substr(md5(random()::text), 1, 8);
    UPDATE employees
    SET password_hash = crypt(temp_password, gen_salt('bf'))
    WHERE email = e_email;
    RETURN temp_password;
END;
$$;

-- 5. Set Employee Password Function
CREATE OR REPLACE FUNCTION public.set_emp_password(
    e_email VARCHAR, 
    e_old_pass TEXT, 
    e_new_pass TEXT
) 
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE employees
    SET password_hash = crypt(e_new_pass, gen_salt('bf')),
        updated_at = NOW()
    WHERE email = e_email 
    AND password_hash = crypt(e_old_pass, password_hash);
    
    RETURN FOUND;
END;
$$;

-- 6. Apply Leave Function
CREATE OR REPLACE FUNCTION public.apply_leave(e_employee_id integer, e_leave_type character varying, e_reason character varying, e_start_date date, e_end_date date, e_no_of_days integer)
 RETURNS TABLE(id integer, employee_id integer, leave_type character varying, reason character varying, start_date date, end_date date, no_of_days integer, status character varying, manager_status character varying, hr_status character varying, created_at timestamp without time zone, updated_at timestamp without time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    INSERT INTO leave_management(
        employee_id, leave_type, reason, start_date, end_date,no_of_days,
        status, manager_status, hr_status, created_at, updated_at
    )
    VALUES (
        e_employee_id,
        e_leave_type,
        e_reason,
        e_start_date,
        e_end_date,
        e_no_of_days,
        'Pending',
        'Pending',
        'Pending',
        NOW(),
        NOW()
    )
    RETURNING leave_management.id,
              leave_management.employee_id,
              leave_management.leave_type,
              leave_management.reason,
              leave_management.start_date,
              leave_management.end_date,
              leave_management.no_of_days,
              leave_management.status,
              leave_management.manager_status,
              leave_management.hr_status,
              leave_management.created_at,
              leave_management.updated_at;
END;
$function$;


-- 8. Save Attendance Function (Updated to support FLOAT hours)
CREATE OR REPLACE FUNCTION public.save_attendance(e_emp_id integer, e_date date, e_action character varying, e_hours double precision, e_project_ids integer[], e_sub_tasks jsonb)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_attendance_id INT;
    v_sub_task jsonb;
    v_project_id integer;
    v_sub_task_text text;
    v_sub_task_hours float;
    v_total_sub_task_hours float := 0;
BEGIN
    IF e_hours < 0 THEN
        RAISE EXCEPTION 'Total hours cannot be negative: %', e_hours;
    END IF;
    IF e_project_ids IS NOT NULL AND array_length(e_project_ids, 1) > 0 THEN
        FOR v_project_id IN SELECT unnest(e_project_ids)
        LOOP
            IF NOT EXISTS (
                SELECT 1
                FROM employee_project_assignments epa
                WHERE epa.employee_id = e_emp_id AND epa.project_id = v_project_id
            ) THEN
                RAISE EXCEPTION 'Invalid project_id % for employee %', v_project_id, e_emp_id;
            END IF;
        END LOOP;
    END IF;
    IF e_sub_tasks IS NOT NULL AND jsonb_array_length(e_sub_tasks) > 0 THEN
        FOR v_sub_task IN SELECT jsonb_array_elements(e_sub_tasks)
        LOOP
            v_project_id := (v_sub_task->>'project_id')::integer;
            v_sub_task_text := v_sub_task->>'sub_task';
            v_sub_task_hours := (v_sub_task->>'hours')::float;
            IF v_project_id IS NULL OR v_sub_task_text IS NULL OR v_sub_task_hours IS NULL THEN
                RAISE EXCEPTION 'Invalid project_id, sub_task, or hours in sub_task: %', v_sub_task;
            END IF;
            IF v_sub_task_hours < 0 THEN
                RAISE EXCEPTION 'Hours cannot be negative in sub_task: %', v_sub_task;
            END IF;
            IF NOT EXISTS (
                SELECT 1
                FROM employee_project_assignments epa
                WHERE epa.employee_id = e_emp_id AND epa.project_id = v_project_id
            ) THEN
                RAISE EXCEPTION 'Invalid project_id % for employee % in sub_task', v_project_id, e_emp_id;
            END IF;
            v_total_sub_task_hours := v_total_sub_task_hours + v_sub_task_hours;
        END LOOP;
        IF v_total_sub_task_hours != e_hours THEN
            RAISE EXCEPTION 'Total subtask hours (%) does not match provided hours (%)', v_total_sub_task_hours, e_hours;
        END IF;
    END IF;
    INSERT INTO attendance (
        employee_id, date, day, action, status, hours, updated_at
    )
    VALUES (
        e_emp_id,
        e_date,
        trim(to_char(e_date, 'Day')),
        e_action,
        e_action,
        e_hours,
        NOW()
    )
    ON CONFLICT (employee_id, date)
    DO UPDATE SET
        day = trim(to_char(EXCLUDED.date, 'Day')),
        action = EXCLUDED.action,
        status = EXCLUDED.action,
        hours = EXCLUDED.hours,
        updated_at = NOW()
    RETURNING id INTO v_attendance_id;
    DELETE FROM attendance_projects
    WHERE attendance_id = v_attendance_id;
    IF e_sub_tasks IS NOT NULL AND jsonb_array_length(e_sub_tasks) > 0 THEN
        FOR v_sub_task IN SELECT jsonb_array_elements(e_sub_tasks)
        LOOP
            v_project_id := (v_sub_task->>'project_id')::integer;
            v_sub_task_text := v_sub_task->>'sub_task';
            v_sub_task_hours := (v_sub_task->>'hours')::float;
            IF v_project_id IS NOT NULL AND v_sub_task_text IS NOT NULL AND v_sub_task_hours IS NOT NULL THEN
                INSERT INTO attendance_projects(attendance_id, project_id, sub_task, hours)
                VALUES (
                    v_attendance_id,
                    v_project_id,
                    v_sub_task_text,
                    v_sub_task_hours
                )
                ON CONFLICT (attendance_id, project_id, sub_task)
                DO UPDATE SET
                    hours = EXCLUDED.hours;
            END IF;
        END LOOP;
    END IF;
    IF e_project_ids IS NOT NULL AND array_length(e_project_ids, 1) > 0 THEN
        FOR v_project_id IN SELECT unnest(e_project_ids)
        LOOP
            INSERT INTO attendance_projects(attendance_id, project_id, sub_task, hours)
            VALUES (
                v_attendance_id,
                v_project_id,
                NULL,
                NULL
            )
            ON CONFLICT (attendance_id, project_id, sub_task) DO NOTHING;
        END LOOP;
    END IF;
    RETURN 'Attendance Saved Successfully';
END;
$function$;

-- 9. Save Weekoffs Function
CREATE OR REPLACE FUNCTION public.save_weekoffs(
    p_employee_id INTEGER, 
    p_week_start DATE, 
    p_week_end DATE, 
    p_off_days TEXT[]
) 
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO weekoff (employee_id, week_start, week_end, off_days)
    VALUES (p_employee_id, p_week_start, p_week_end, p_off_days)
    ON CONFLICT (employee_id, week_start)
    DO UPDATE SET
        week_end = EXCLUDED.week_end,
        off_days = EXCLUDED.off_days;
    
    RETURN 'Weekoffs saved successfully';
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error saving weekoffs: ' || SQLERRM;
END;
$$;

-- 10. Submit Expense Request Function
CREATE OR REPLACE FUNCTION public.submit_expense_request(
    p_employee_id INTEGER, 
    p_category VARCHAR, 
    p_amount NUMERIC, 
    p_currency VARCHAR, 
    p_description TEXT, 
    p_expense_date DATE, 
    p_tax_included BOOLEAN DEFAULT FALSE
) 
RETURNS TABLE(request_id INTEGER, request_code VARCHAR, status VARCHAR)
LANGUAGE plpgsql
AS $$
DECLARE
    new_request_id INT;
    new_request_code VARCHAR;
BEGIN
    new_request_code := generate_request_code();
    
    INSERT INTO expense_requests (
        request_code, employee_id, category, amount, currency, 
        description, expense_date, tax_included, status, created_at, updated_at
    )
    VALUES (
        new_request_code, p_employee_id, p_category, p_amount, p_currency,
        p_description, p_expense_date, p_tax_included, 'pending_manager_approval', NOW(), NOW()
    )
    RETURNING expense_requests.request_id INTO new_request_id;
    
    RETURN QUERY SELECT new_request_id, new_request_code, 'pending_manager_approval'::VARCHAR;
END;
$$;

-- 11. Add Expense Attachment Function
CREATE OR REPLACE FUNCTION public.add_expense_attachment(
    p_request_id INTEGER, 
    p_file_name VARCHAR, 
    p_file_url TEXT, 
    p_file_type VARCHAR, 
    p_file_size NUMERIC
) 
RETURNS TABLE(
    attachment_id INTEGER, 
    request_id INTEGER, 
    file_name VARCHAR, 
    file_url TEXT,
    file_type VARCHAR,
    file_size NUMERIC,
    uploaded_at TIMESTAMP
)
LANGUAGE plpgsql
AS $$
DECLARE
    new_id INT;
BEGIN
    INSERT INTO expense_attachments (
        request_id, file_name, file_url, file_type, file_size, uploaded_at
    ) VALUES (
        p_request_id, p_file_name, p_file_url, p_file_type, p_file_size, NOW()
    ) RETURNING expense_attachments.attachment_id INTO new_id;
    
    RETURN QUERY
    SELECT 
        ea.attachment_id,
        ea.request_id,
        ea.file_name,
        ea.file_url,
        ea.file_type,
        ea.file_size,
        ea.uploaded_at
    FROM expense_attachments ea
    WHERE ea.attachment_id = new_id;
END;
$$;

-- 12. Manager Update Expense Function
CREATE OR REPLACE FUNCTION public.manager_update_expense(
    p_request_id INTEGER, 
    p_manager_id INTEGER, 
    p_action VARCHAR, 
    p_reason TEXT DEFAULT NULL
) 
RETURNS VARCHAR
LANGUAGE plpgsql
AS $$
DECLARE
    new_status VARCHAR;
BEGIN 
    IF p_action = 'approve' THEN
        new_status := 'pending_hr_approval';
    ELSE
        new_status := 'manager_rejected';
    END IF;
    
    UPDATE expense_requests
    SET status = new_status,
        updated_at = NOW()
    WHERE request_id = p_request_id;
    
    INSERT INTO expense_history(request_id, action_by, action_role, action, reason)
    VALUES (p_request_id, p_manager_id, 'Manager', p_action, p_reason);
    
    RETURN new_status;
END;
$$;

-- 13. HR Update Expense Function
CREATE OR REPLACE FUNCTION public.hr_update_expense(
    p_request_id INTEGER, 
    p_hr_id INTEGER, 
    p_action VARCHAR, 
    p_reason TEXT DEFAULT NULL
) 
RETURNS VARCHAR
LANGUAGE plpgsql
AS $$
DECLARE
    new_status VARCHAR;
BEGIN 
    IF p_action = 'approve' THEN
        new_status := 'pending_account_mgr_approval';
    ELSE
        new_status := 'hr_rejected';
    END IF;
    
    UPDATE expense_requests
    SET status = new_status,
        updated_at = NOW()
    WHERE request_id = p_request_id;
    
    INSERT INTO expense_history(request_id, action_by, action_role, action, reason)
    VALUES (p_request_id, p_hr_id, 'HR', p_action, p_reason);
    
    RETURN new_status;
END;
$$;

-- 14. Account Manager Update Expense Function
CREATE OR REPLACE FUNCTION public.account_mgr_update_expense(
    p_request_id INTEGER, 
    p_acc_mgr_id INTEGER, 
    p_action VARCHAR, 
    p_reason TEXT DEFAULT NULL
) 
RETURNS VARCHAR
LANGUAGE plpgsql
AS $$
DECLARE
    new_status VARCHAR;
BEGIN
    IF p_action = 'approve' THEN
        new_status := 'approved';
    ELSE
        new_status := 'acc_mgr_rejected';
    END IF;
    
    UPDATE expense_requests
    SET status = new_status,
        updated_at = NOW()
    WHERE request_id = p_request_id;
    
    INSERT INTO expense_history(request_id, action_by, action_role, action, reason)
    VALUES (p_request_id, p_acc_mgr_id, 'Account Manager', p_action, p_reason);
    
    RETURN new_status;
END;
$$;

-- 15. Upload Document Function
CREATE OR REPLACE FUNCTION public.upload_document(
    e_emp_id INTEGER, 
    e_doc_type TEXT, 
    e_doc BYTEA
) 
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    doc_id INT;
BEGIN
    INSERT INTO employee_documents (employee_id, doc_type, file_id, file_name, file_url, uploaded_at)
    VALUES (e_emp_id, e_doc_type, encode(e_doc, 'base64'), 'document', '/api/documents/' || e_emp_id, NOW())
    RETURNING id INTO doc_id;
    
    RETURN 'Document uploaded successfully with ID: ' || doc_id;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error uploading document: ' || SQLERRM;
END;
$$;

-- 16. Initialize Leave Balance Trigger Function
CREATE OR REPLACE FUNCTION public.init_leave_balance() 
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO leave_balance (
        employee_id, sick_leaves, casual_leaves, paid_leaves, 
        maternity_leave, paternity_leave, created_at, updated_at
    )
    VALUES (NEW.id, 0, 0, 0, 0, 0, NOW(), NOW());
    
    RETURN NEW;
END;
$$;

-- 17. Update Leave Balance Trigger Function
CREATE OR REPLACE FUNCTION public.update_leave_balance() 
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status = 'Approved' THEN
        IF NEW.leave_type = 'Sick' THEN
            UPDATE leave_balance
            SET sick_leaves = sick_leaves - NEW.no_of_days, updated_at = NOW()
            WHERE employee_id = NEW.employee_id;
        ELSIF NEW.leave_type = 'Casual' THEN
            UPDATE leave_balance
            SET casual_leaves = casual_leaves - NEW.no_of_days, updated_at = NOW()
            WHERE employee_id = NEW.employee_id;
        ELSIF NEW.leave_type = 'paid' THEN
            UPDATE leave_balance
            SET paid_leaves = paid_leaves - NEW.no_of_days, updated_at = NOW()
            WHERE employee_id = NEW.employee_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- =====================================================
-- PROCEDURES
-- =====================================================

-- 1. Approve Employee Procedure
CREATE OR REPLACE PROCEDURE public.approve_employee(
    IN p_onboarding_id INTEGER,
    OUT new_emp_id INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insert into employees
    INSERT INTO employees (name, email, role, employment_type, o_status, created_at)
    SELECT name, email, role, type, TRUE, NOW()
    FROM onboarding_employees
    WHERE id = p_onboarding_id
    RETURNING id INTO new_emp_id;
    
    -- Insert into employee_details
    INSERT INTO employee_details (
        employee_id, full_name, contact_no, personal_email, dob, address, gender,
        graduation_year, work_experience_years, emergency_contact_name,
        emergency_contact_number, emergency_contact_relation, created_at, updated_at
    )
    SELECT new_emp_id, full_name, contact_no, personal_email, dob, address, gender,
           graduation_year, work_experience_years, emergency_contact_name,
           emergency_contact_number, emergency_contact_relation, NOW(), NOW()
    FROM onboarding_emp_details
    WHERE employee_id = p_onboarding_id;
    
    -- Copy documents from onboarding to employee_documents
    INSERT INTO employee_documents (
        employee_id, doc_type, file_id, file_name, file_url, uploaded_at
    )
    SELECT 
        new_emp_id,
        doc_type,
        COALESCE(file_name, doc_type || '_' || new_emp_id::text) as file_id,
        COALESCE(file_name, doc_type || '.pdf') as file_name,
        file_url,
        uploaded_at
    FROM onboarding_emp_docs
    WHERE employee_id = p_onboarding_id;
    
    -- Delete from onboarding tables
    DELETE FROM onboarding_employees WHERE id = p_onboarding_id;
    DELETE FROM onboarding_emp_docs WHERE employee_id = p_onboarding_id;
    DELETE FROM onboarding_emp_details WHERE employee_id = p_onboarding_id;
END;
$$;

-- 2. Assign Employee Procedure
CREATE OR REPLACE PROCEDURE public.assign_employee(
    IN p_employee_id INTEGER, 
    IN p_location_id INTEGER, 
    IN p_doj DATE, 
    IN p_company_email TEXT, 
    IN p_managers INTEGER[], 
    IN p_hrs INTEGER[], 
    IN p_role TEXT DEFAULT NULL, 
    IN p_company_employee_id TEXT DEFAULT NULL, 
    IN p_is_reassignment BOOLEAN DEFAULT FALSE
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Ensure employee exists
    IF NOT EXISTS (SELECT 1 FROM employees WHERE id = p_employee_id) THEN
        RAISE EXCEPTION 'Employee with id % not found', p_employee_id;
    END IF;
    
    -- Update employee details
    UPDATE employees
    SET doj = CASE WHEN p_is_reassignment THEN doj ELSE p_doj END,
        location_id = p_location_id,
        company_email = CASE WHEN p_is_reassignment THEN company_email ELSE p_company_email END,
        role = COALESCE(p_role, role),
        company_employee_id = CASE WHEN p_is_reassignment THEN company_employee_id ELSE COALESCE(p_company_employee_id, company_employee_id) END
    WHERE id = p_employee_id;
    
    -- Update employee_details table with company_email only for initial assignment
    IF NOT p_is_reassignment THEN
        UPDATE employee_details
        SET company_email = p_company_email
        WHERE employee_id = p_employee_id;
    END IF;
    
    -- Insert managers (ignoring NULLs)
    DELETE FROM employee_managers WHERE employee_id = p_employee_id;
    INSERT INTO employee_managers (employee_id, manager_id, created_at)
    SELECT p_employee_id, mgr, NOW()
    FROM unnest(p_managers) AS mgr
    WHERE mgr IS NOT NULL;
    
    -- Insert HRs (ignoring NULLs)
    DELETE FROM employee_hrs WHERE employee_id = p_employee_id;
    INSERT INTO employee_hrs (employee_id, hr_id, created_at)
    SELECT p_employee_id, hr, NOW()
    FROM unnest(p_hrs) AS hr
    WHERE hr IS NOT NULL;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to initialize leave balance when new employee is added
DROP TRIGGER IF EXISTS trg_init_leave_balance ON public.employees;
CREATE TRIGGER trg_init_leave_balance 
AFTER INSERT ON public.employees 
FOR EACH ROW 
EXECUTE FUNCTION public.init_leave_balance();

-- Trigger to update leave balance when leave status changes
DROP TRIGGER IF EXISTS trg_update_leave_balance ON public.leave_management;
CREATE TRIGGER trg_update_leave_balance 
AFTER INSERT OR UPDATE ON public.leave_management 
FOR EACH ROW 
EXECUTE FUNCTION public.update_leave_balance();

-- =====================================================
-- END OF SCHEMA
-- =====================================================