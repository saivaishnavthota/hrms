"""Replace save_attendance to align with app allocation rules

Revision ID: 010_update_save_attendance_function
Revises: 002_postgresql_functions
Create Date: 2025-10-30 19:50:00.000000

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '010_update_save_attendance_function'
down_revision = '002_postgresql_functions'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE OR REPLACE FUNCTION public.save_attendance(
            e_emp_id integer,
            e_date date,
            e_action character varying,
            e_hours double precision,
            e_project_ids integer[],
            e_sub_tasks jsonb
        )
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
            v_month_str text := to_char(e_date, 'YYYY-MM');
            v_is_inhouse boolean;
            v_is_unassigned boolean;
        BEGIN
            IF e_hours < 0 THEN
                RAISE EXCEPTION 'Total hours cannot be negative: %', e_hours;
            END IF;
            IF e_hours > 8 THEN
                RAISE EXCEPTION 'Total hours cannot exceed 8 hours per day: %', e_hours;
            END IF;

            -- Validate project_ids (assignments and allocations), skipping Unassigned and In-House
            IF e_project_ids IS NOT NULL AND array_length(e_project_ids, 1) > 0 THEN
                FOREACH v_project_id IN ARRAY e_project_ids LOOP
                    v_is_unassigned := (v_project_id = 123);
                    SELECT EXISTS (
                        SELECT 1 FROM projects p
                        WHERE p.project_id = v_project_id
                          AND p.project_name = 'In-House Project'
                          AND p.account = 'Internal'
                    ) INTO v_is_inhouse;

                    IF NOT v_is_unassigned AND NOT v_is_inhouse THEN
                        -- Allocation check by exact month
                        IF NOT EXISTS (
                            SELECT 1 FROM project_allocations pa
                            WHERE pa.employee_id = e_emp_id
                              AND pa.project_id = v_project_id
                              AND pa.month = v_month_str
                              AND pa.allocated_days > 0
                        ) THEN
                            RAISE EXCEPTION 'Invalid project_id % for employee % on date %. Employee not allocated to this project for %', v_project_id, e_emp_id, e_date, v_month_str;
                        END IF;
                    END IF;
                END LOOP;
            END IF;

            -- Validate subtasks similarly and accumulate hours
            IF e_sub_tasks IS NOT NULL AND jsonb_array_length(e_sub_tasks) > 0 THEN
                FOR v_sub_task IN SELECT jsonb_array_elements(e_sub_tasks) LOOP
                    v_project_id := (v_sub_task->>'project_id')::integer;
                    v_sub_task_text := v_sub_task->>'sub_task';
                    v_sub_task_hours := (v_sub_task->>'hours')::float;
                    IF v_project_id IS NULL OR v_sub_task_text IS NULL OR v_sub_task_hours IS NULL THEN
                        RAISE EXCEPTION 'Invalid project_id, sub_task, or hours in sub_task: %', v_sub_task;
                    END IF;
                    IF v_sub_task_hours < 0 THEN
                        RAISE EXCEPTION 'Hours cannot be negative in sub_task: %', v_sub_task;
                    END IF;
                    IF v_sub_task_hours > 8 THEN
                        RAISE EXCEPTION 'Hours cannot exceed 8 hours in sub_task: %', v_sub_task;
                    END IF;

                    v_is_unassigned := (v_project_id = 123);
                    SELECT EXISTS (
                        SELECT 1 FROM projects p
                        WHERE p.project_id = v_project_id
                          AND p.project_name = 'In-House Project'
                          AND p.account = 'Internal'
                    ) INTO v_is_inhouse;

                    IF NOT v_is_unassigned AND NOT v_is_inhouse THEN
                        IF NOT EXISTS (
                            SELECT 1 FROM project_allocations pa
                            WHERE pa.employee_id = e_emp_id
                              AND pa.project_id = v_project_id
                              AND pa.month = v_month_str
                              AND pa.allocated_days > 0
                        ) THEN
                            RAISE EXCEPTION 'Invalid project_id % for employee % on date %. Employee not allocated to this project for %', v_project_id, e_emp_id, e_date, v_month_str;
                        END IF;
                    END IF;

                    v_total_sub_task_hours := v_total_sub_task_hours + v_sub_task_hours;
                END LOOP;
                IF v_total_sub_task_hours != e_hours THEN
                    RAISE EXCEPTION 'Total subtask hours (%) does not match provided hours (%)', v_total_sub_task_hours, e_hours;
                END IF;
            END IF;

            -- Upsert attendance
            INSERT INTO attendance (employee_id, date, day, action, status, hours, updated_at)
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

            -- Reset and insert subtasks
            DELETE FROM attendance_projects WHERE attendance_id = v_attendance_id;

            IF e_sub_tasks IS NOT NULL AND jsonb_array_length(e_sub_tasks) > 0 THEN
                FOR v_sub_task IN SELECT jsonb_array_elements(e_sub_tasks) LOOP
                    v_project_id := (v_sub_task->>'project_id')::integer;
                    v_sub_task_text := v_sub_task->>'sub_task';
                    v_sub_task_hours := (v_sub_task->>'hours')::float;
                    IF v_project_id IS NOT NULL AND v_sub_task_text IS NOT NULL AND v_sub_task_hours IS NOT NULL THEN
                        INSERT INTO attendance_projects(attendance_id, project_id, sub_task, hours)
                        VALUES (v_attendance_id, v_project_id, v_sub_task_text, v_sub_task_hours)
                        ON CONFLICT (attendance_id, project_id, sub_task)
                        DO UPDATE SET hours = EXCLUDED.hours;
                    END IF;
                END LOOP;
            END IF;

            -- Insert bare project associations from e_project_ids (if provided)
            IF e_project_ids IS NOT NULL AND array_length(e_project_ids, 1) > 0 THEN
                FOREACH v_project_id IN ARRAY e_project_ids LOOP
                    INSERT INTO attendance_projects(attendance_id, project_id, sub_task, hours)
                    VALUES (v_attendance_id, v_project_id, NULL, NULL)
                    ON CONFLICT (attendance_id, project_id, sub_task) DO NOTHING;
                END LOOP;
            END IF;

            RETURN 'Attendance Saved Successfully';
        EXCEPTION
            WHEN OTHERS THEN
                RETURN 'Error saving attendance: ' || SQLERRM;
        END;
        $function$;
        """
    )


def downgrade() -> None:
    # no-op: keep function behavior
    pass


