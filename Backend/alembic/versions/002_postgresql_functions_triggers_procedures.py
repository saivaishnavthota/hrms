"""Add PostgreSQL functions, triggers, and procedures

Revision ID: 002_postgresql_functions
Revises: 001_initial
Create Date: 2025-01-30 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002_postgresql_functions'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create sequences that are referenced by functions
    op.execute("CREATE SEQUENCE IF NOT EXISTS public.expense_request_seq START WITH 1 INCREMENT BY 1")
    
    # 1. Account Manager Expense Update Functions
    op.execute("""
        CREATE OR REPLACE FUNCTION public.account_mgr_update_expense(p_request_id integer, p_action character varying) 
        RETURNS character varying
        LANGUAGE plpgsql
        AS $$
        DECLARE
            new_status VARCHAR;
        BEGIN
            IF p_action = 'approve' THEN
                new_status := 'approved';
            ELSE
                new_status := 'requeue';
            END IF;
            
            UPDATE expense_requests
            SET status = new_status,
                updated_at = NOW()
            WHERE request_id = p_request_id;
            
            RETURN new_status;
        END;
        $$;
    """)
    
    op.execute("""
        CREATE OR REPLACE FUNCTION public.account_mgr_update_expense(p_request_id integer, p_action character varying, p_reason text DEFAULT NULL::text) 
        RETURNS character varying
        LANGUAGE plpgsql
        AS $$
        DECLARE
            new_status VARCHAR;
        BEGIN
            IF p_action = 'approve' THEN
                new_status := 'approved';
                UPDATE expense_requests
                SET status = new_status,
                    updated_at = NOW()
                WHERE request_id = p_request_id;
            ELSE
                new_status := 'rejected';
                UPDATE expense_requests
                SET status = new_status,
                    updated_at = NOW(),
                WHERE request_id = p_request_id;
            END IF;
            
            RETURN new_status;
        END;
        $$;
    """)
    
    op.execute("""
        CREATE OR REPLACE FUNCTION public.account_mgr_update_expense(p_request_id integer, p_acc_mgr_id integer, p_action character varying, p_reason text DEFAULT NULL::text) 
        RETURNS character varying
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
    """)
    
    # 2. Add Employee Function
    op.execute("""
        CREATE OR REPLACE FUNCTION public.add_employee(e_name character varying, e_email character varying, e_role character varying, e_type character varying) 
        RETURNS text
        LANGUAGE plpgsql
        AS $$
        declare
        temp_password text;
        begin
        temp_password :=substr(md5(random()::text),1,8);
        insert into onboarding_employees(name,email,role,type,password)
        values(e_name,e_email,e_role,e_type,crypt(temp_password,gen_salt('bf')));
        return temp_password;
        end;
        $$;
    """)
    
    # 3. Add Expense Attachment Function
    op.execute("""
        CREATE OR REPLACE FUNCTION public.add_expense_attachment(p_request_id integer, p_file_name character varying, p_file_path text, p_file_type character varying, p_file_size numeric) 
        RETURNS TABLE(attachment_id integer, request_id integer, file_name character varying, file_path text)
        LANGUAGE plpgsql
        AS $$
        DECLARE
            new_id INT;
        BEGIN
            INSERT INTO expense_attachments (
                request_id, file_name, file_path, file_type, file_size
            ) VALUES (
                p_request_id, p_file_name, p_file_path, p_file_type, p_file_size
            )
            RETURNING attachment_id INTO new_id;
            
            RETURN QUERY SELECT new_id, p_request_id, p_file_name, p_file_path;
        END;
        $$;
    """)
    
    # 4. Apply Leave Function
    op.execute("""
        CREATE OR REPLACE FUNCTION public.apply_leave(e_employee_id integer, e_leave_type character varying, e_reason character varying, e_start_date date, e_end_date date, e_no_of_days integer)
        RETURNS text
        LANGUAGE plpgsql
        AS $$
        BEGIN
            INSERT INTO leave_management(employee_id, leave_type, reason, start_date, end_date, no_of_days, status, manager_status, hr_status, created_at, updated_at)
            VALUES(e_employee_id, e_leave_type, e_reason, e_start_date, e_end_date, e_no_of_days, 'pending', 'pending', 'pending', NOW(), NOW());
            
            RETURN 'Leave applied successfully';
        EXCEPTION
            WHEN OTHERS THEN
                RETURN 'Error applying leave: ' || SQLERRM;
        END;
        $$;
    """)
    
    # 5. Approve Employee Procedure
    op.execute("""
        CREATE OR REPLACE PROCEDURE public.approve_employee(
            IN p_onboarding_id integer,
            OUT new_emp_id integer
        )
        LANGUAGE plpgsql
        AS $$
        BEGIN
            -- Insert into employees
            INSERT INTO employees (name, email, role, employment_type, o_status, created_at)
            SELECT name, email, role, type, TRUE, now()
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
    """)
    
    # 6. Assign Employee Procedure
    op.execute("""
        CREATE OR REPLACE PROCEDURE public.assign_employee(IN p_employee_id integer, IN p_location_id integer, IN p_doj date, IN p_company_email text, IN p_managers integer[], IN p_hrs integer[], IN p_role text DEFAULT NULL, IN p_company_employee_id text DEFAULT NULL, IN p_is_reassignment boolean DEFAULT false)
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
            SELECT p_employee_id, mgr, now()
            FROM unnest(p_managers) AS mgr
            WHERE mgr IS NOT NULL;
            
            -- Insert HRs (ignoring NULLs)
            DELETE FROM employee_hrs WHERE employee_id = p_employee_id;
            INSERT INTO employee_hrs (employee_id, hr_id, created_at)
            SELECT p_employee_id, hr, now()
            FROM unnest(p_hrs) AS hr
            WHERE hr IS NOT NULL;
        END;
        $$;
    """)
    
    # 7. Employee Details Function
    op.execute("""
        CREATE OR REPLACE FUNCTION public.emp_details(e_emp_id integer, e_full_name character varying, e_contact_no character varying, e_personal_mail character varying, e_dob date, e_address text, e_gender character varying, e_grad_year integer, e_w_exp integer, e_eme_c_name character varying, e_eme_c_no character varying, e_eme_c_rel character varying) 
        RETURNS void
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
    """)
    
    # 8. Forgot Password Function
    op.execute("""
        CREATE OR REPLACE FUNCTION public.forgot_password(e_email character varying) 
        RETURNS text
        LANGUAGE plpgsql
        AS $$
        declare
        temp_password text;
        begin
        temp_password=substr(md5(random()::text),1,8);
        update employees
        set password_hash=crypt(temp_password,gen_salt('bf'))
        where email=e_email;
        return temp_password;
        end;
        $$;
    """)
    
    # 9. Generate Request Code Function
    op.execute("""
        CREATE OR REPLACE FUNCTION public.generate_request_code() 
        RETURNS character varying
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
    """)
    
    # 10. HR Update Expense Functions
    op.execute("""
        CREATE OR REPLACE FUNCTION public.hr_update_expense(p_request_id integer, p_action character varying) 
        RETURNS character varying
        LANGUAGE plpgsql
        AS $$
        DECLARE
            new_status VARCHAR;
        BEGIN
            IF p_action = 'approve' THEN
                new_status := 'pending_account_mgr_approval';
            ELSE
                new_status := 'rejected';
            END IF;
            
            UPDATE expense_requests
            SET status = new_status,
                updated_at = NOW()
            WHERE request_id = p_request_id;
            
            RETURN new_status;
        END;
        $$;
    """)
    
    op.execute("""
        CREATE OR REPLACE FUNCTION public.hr_update_expense(p_request_id integer, p_action character varying, p_reason text DEFAULT NULL::text) 
        RETURNS character varying
        LANGUAGE plpgsql
        AS $$
        DECLARE
            new_status VARCHAR;
        BEGIN 
            IF p_action = 'approve' THEN
                new_status := 'pending_account_mgr_approval';
                UPDATE expense_requests
                SET status = new_status,
                    updated_at = NOW()
                WHERE request_id = p_request_id;
            ELSE
                new_status := 'rejected';
                UPDATE expense_requests
                SET status = new_status,
                    updated_at = NOW()
                WHERE request_id = p_request_id;
            END IF;
            
            RETURN new_status;
        END;
        $$;
    """)
    
    op.execute("""
        CREATE OR REPLACE FUNCTION public.hr_update_expense(p_request_id integer, p_hr_id integer, p_action character varying, p_reason text DEFAULT NULL::text) 
        RETURNS character varying
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
    """)
    
    # 11. Leave Balance Initialization Function (Trigger Function)
    op.execute("""
        CREATE OR REPLACE FUNCTION public.init_leave_balance() 
        RETURNS trigger
        LANGUAGE plpgsql
        AS $$
        BEGIN
            INSERT INTO leave_balance (employee_id, sick_leaves, casual_leaves, paid_leaves, maternity_leave, paternity_leave, created_at, updated_at)
            VALUES (NEW.id, 0, 0, 0, 0, 0, NOW(), NOW());
            
            RETURN NEW;
        END;
        $$;
    """)
    
    # 12. Manager Update Expense Functions
    op.execute("""
        CREATE OR REPLACE FUNCTION public.manager_update_expense(p_request_id integer, p_action character varying) 
        RETURNS character varying
        LANGUAGE plpgsql
        AS $$
        DECLARE
            new_status VARCHAR;
        BEGIN
            IF p_action = 'approve' THEN
                new_status := 'pending_hr_approval';
            ELSE
                new_status := 'rejected';
            END IF;
            
            UPDATE expense_requests
            SET status = new_status,
                updated_at = NOW()
            WHERE request_id = p_request_id;
            
            RETURN new_status;
        END;
        $$;
    """)
    
    op.execute("""
        CREATE OR REPLACE FUNCTION public.manager_update_expense(p_request_id integer, p_action character varying, p_reason text DEFAULT NULL::text) 
        RETURNS character varying
        LANGUAGE plpgsql
        AS $$
        DECLARE 
            new_status VARCHAR;
        BEGIN 
            IF p_action = 'approve' THEN
                new_status := 'pending_hr_approval';
                UPDATE expense_requests
                SET status = new_status,
                    updated_at = NOW()
                WHERE request_id = p_request_id;
            ELSE
                new_status := 'rejected';
                UPDATE expense_requests
                SET status = new_status,
                    updated_at = NOW()
                WHERE request_id = p_request_id;
            END IF;
            
            RETURN new_status;
        END;
        $$;
    """)
    
    op.execute("""
        CREATE OR REPLACE FUNCTION public.manager_update_expense(p_request_id integer, p_manager_id integer, p_action character varying, p_reason text DEFAULT NULL::text) 
        RETURNS character varying
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
    """)
    
    # 13. Save Attendance Function
    op.execute("""
        CREATE OR REPLACE FUNCTION public.save_attendance(e_emp_id integer, e_date date, e_action character varying, e_hours integer, e_project_ids integer[], e_sub_tasks jsonb) 
        RETURNS text
        LANGUAGE plpgsql
        AS $$
        DECLARE
            attendance_id INT;
            project_id INT;
            day_name VARCHAR;
        BEGIN
            SELECT EXTRACT(DOW FROM e_date) INTO day_name;
            
            INSERT INTO attendance (employee_id, date, day, action, status, hours, created_at, updated_at)
            VALUES (e_emp_id, e_date, day_name, e_action, 'present', e_hours, NOW(), NOW())
            ON CONFLICT (employee_id, date)
            DO UPDATE SET
                action = EXCLUDED.action,
                status = EXCLUDED.status,
                hours = EXCLUDED.hours,
                updated_at = NOW()
            RETURNING id INTO attendance_id;
            
            -- Delete existing project associations
            DELETE FROM attendance_projects WHERE attendance_id = attendance_id;
            
            -- Add new project associations
            FOREACH project_id IN ARRAY e_project_ids
            LOOP
                INSERT INTO attendance_projects (attendance_id, project_id, sub_task)
                VALUES (
                    attendance_id, 
                    project_id, 
                    (e_sub_tasks->project_id::text)::VARCHAR
                );
            END LOOP;
            
            RETURN 'Attendance saved successfully';
        EXCEPTION
            WHEN OTHERS THEN
                RETURN 'Error saving attendance: ' || SQLERRM;
        END;
        $$;
    """)
    
    # 14. Save Employee Master Function
    op.execute("""
        CREATE OR REPLACE FUNCTION public.save_employee_master(e_emp_id integer, e_m1_id integer, e_hr1_id integer, e_m2_id integer DEFAULT NULL::integer, e_m3_id integer DEFAULT NULL::integer, e_hr2_id integer DEFAULT NULL::integer) 
        RETURNS text
        LANGUAGE plpgsql
        AS $$
        BEGIN
            INSERT INTO employee_master (emp_id, manager1_id, hr1_id, manager2_id, manager3_id, hr2_id)
            VALUES (e_emp_id, e_m1_id, e_hr1_id, e_m2_id, e_m3_id, e_hr2_id);
            
            RETURN 'Employee master details saved successfully';
        EXCEPTION
            WHEN OTHERS THEN
                RETURN 'Error saving employee master: ' || SQLERRM;
        END;
        $$;
    """)
    
    # 15. Save Weekoffs Function
    op.execute("""
        CREATE OR REPLACE FUNCTION public.save_weekoffs(p_employee_id integer, p_week_start date, p_week_end date, p_off_days text[]) 
        RETURNS text
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
    """)
    
    # 16. Set Employee Password Function
    op.execute("""
        CREATE OR REPLACE FUNCTION public.set_emp_password(e_email character varying, e_old_pass text, e_new_pass text) 
        RETURNS boolean
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
    """)
    
    # 17. Submit Expense Request Function
    op.execute("""
        CREATE OR REPLACE FUNCTION public.submit_expense_request(p_employee_id integer, p_category character varying, p_amount numeric, p_currency character varying, p_description text, p_expense_date date, p_tax_included boolean DEFAULT false) 
        RETURNS TABLE(request_id integer, request_code character varying, status character varying)
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
            
            RETURN QUERY SELECT new_request_id, new_request_code, 'pending_manager_approval';
        END;
        $$;
    """)
    
    # 18. Update Leave Balance Function (Trigger Function)
    op.execute("""
        CREATE OR REPLACE FUNCTION public.update_leave_balance() 
        RETURNS trigger
        LANGUAGE plpgsql
        AS $$
        BEGIN
        IF NEW.status = 'Approved' THEN
        IF NEW.leave_type = 'Sick' THEN
        UPDATE leave_balance
        SET sick_leaves = sick_leaves - NEW.no_of_days,updated_at=NOW()
        where employee_id=NEW.employee_id;
        elseif NEW.leave_type='Casual' then
        update leave_balance
        set casual_leaves=casual_leaves-NEW.no_of_days,updated_at=NOW()
        where employee_id=NEW.employee_id;
        elseif NEW.leave_type='paid' then
        update leave_balance
        set paid_leaves=paid_leaves-NEW.no_of_days,updated_at=NOW()
        where employee_id=NEW.employee_id;
        end if;
        end if;
        return NEW;
        end;
        $$;
    """)
    
    # 19. Upload Document Function
    op.execute('''
        CREATE OR REPLACE FUNCTION public.upload_document(e_emp_id integer, e_doc_type text, e_doc bytea) RETURNS text
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
    ''')
    
    # Create triggers
    op.execute("""
        CREATE TRIGGER trg_init_leave_balance 
        AFTER INSERT ON public.employees 
        FOR EACH ROW EXECUTE FUNCTION public.init_leave_balance();
    """)
    
    op.execute("""
        CREATE TRIGGER trg_update_leave_balance 
        AFTER INSERT OR UPDATE ON public.leave_management 
        FOR EACH ROW EXECUTE FUNCTION public.update_leave_balance();
    """)


def downgrade() -> None:
    # Drop triggers first
    op.execute("DROP TRIGGER IF EXISTS trg_update_leave_balance ON public.leave_management")
    op.execute("DROP TRIGGER IF EXISTS trg_init_leave_balance ON public.employees")
    
    # Drop functions and procedures
    functions_and_procedures = [
        "public.upload_document(integer, text, bytea)",
        "public.update_leave_balance()",
        "public.submit_expense_request(integer, character varying, numeric, character varying, text, date, boolean)",
        "public.set_emp_password(character varying, text, text)",
        "public.save_weekoffs(integer, date, date, text[])",
        "public.save_employee_master(integer, integer, integer, integer, integer, integer)",
        "public.save_attendance(integer, date, character varying, integer, integer[], jsonb)",
        "public.manager_update_expense(integer, integer, character varying, text)",
        "public.manager_update_expense(integer, character varying, text)",
        "public.manager_update_expense(integer, character varying)",
        "public.init_leave_balance()",
        "public.hr_update_expense(integer, integer, character varying, text)",
        "public.hr_update_expense(integer, character varying, text)",
        "public.hr_update_expense(integer, character varying)",
        "public.generate_request_code()",
        "public.forgot_password(character varying)",
        "public.emp_details(integer, character varying, character varying, character varying, date, text, character varying, integer, integer, character varying, character varying, character varying)",
        "public.assign_employee(integer, integer, date, text, integer[], integer[], text, text, boolean)",
        "public.approve_employee(integer)",
        "public.apply_leave(integer, character varying, character varying, date, date, integer)",
        "public.add_expense_attachment(integer, character varying, text, character varying, numeric)",
        "public.add_employee(character varying, character varying, character varying, character varying)",
        "public.account_mgr_update_expense(integer, integer, character varying, text)",
        "public.account_mgr_update_expense(integer, character varying, text)",
        "public.account_mgr_update_expense(integer, character varying)"
    ]
    
    for obj in functions_and_procedures:
        op.execute(f"DROP FUNCTION IF EXISTS {obj}")
        op.execute(f"DROP PROCEDURE IF EXISTS {obj}")
    
    # Drop the sequence
    op.execute("DROP SEQUENCE IF EXISTS public.expense_request_seq")
