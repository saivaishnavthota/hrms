"""Initial migration with all models

Revision ID: 001_initial
Revises: 
Create Date: 2025-01-30 15:45:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create employees table
    op.create_table('employees',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=True),
    sa.Column('email', sa.String(length=100), nullable=True),
    sa.Column('password_hash', sa.String(), nullable=True),
    sa.Column('role', sa.String(length=100), nullable=True),
    sa.Column('o_status', sa.Boolean(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('reset_otp', sa.String(length=6), nullable=True),
    sa.Column('company_email', sa.String(length=100), nullable=True),
    sa.Column('login_status', sa.Boolean(), nullable=True),
    sa.Column('location_id', sa.Integer(), nullable=True),
    sa.Column('employment_type', sa.String(length=50), nullable=True),
    sa.Column('doj', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    
    # Create locations table
    op.create_table('locations',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    
    # Create employee_master table
    op.create_table('employee_master',
    sa.Column('emp_id', sa.Integer(), nullable=False),
    sa.Column('manager1_id', sa.Integer(), nullable=False),
    sa.Column('hr1_id', sa.Integer(), nullable=False),
    sa.Column('manager2_id', sa.Integer(), nullable=True),
    sa.Column('manager3_id', sa.Integer(), nullable=True),
    sa.Column('hr2_id', sa.Integer(), nullable=True),
    sa.PrimaryKeyConstraint('emp_id')
    )
    
    # Create employee_details table
    op.create_table('employee_details',
    sa.Column('employee_id', sa.Integer(), nullable=False),
    sa.Column('full_name', sa.String(length=150), nullable=False),
    sa.Column('contact_no', sa.String(length=15), nullable=False),
    sa.Column('personal_email', sa.String(length=100), nullable=True),
    sa.Column('company_email', sa.String(length=100), nullable=True),
    sa.Column('doj', sa.Date(), nullable=True),
    sa.Column('dob', sa.Date(), nullable=False),
    sa.Column('address', sa.String(), nullable=True),
    sa.Column('gender', sa.String(length=10), nullable=True),
    sa.Column('graduation_year', sa.Integer(), nullable=True),
    sa.Column('work_experience_years', sa.Integer(), nullable=False),
    sa.Column('emergency_contact_name', sa.String(), nullable=True),
    sa.Column('emergency_contact_number', sa.String(), nullable=True),
    sa.Column('emergency_contact_relation', sa.String(), nullable=True),
    sa.Column('employment_type', sa.String(length=20), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('employee_id')
    )
    
    # Create employee_managers table
    op.create_table('employee_managers',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('employee_id', sa.Integer(), nullable=False),
    sa.Column('manager_id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    
    # Create employee_hrs table
    op.create_table('employee_hrs',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('employee_id', sa.Integer(), nullable=False),
    sa.Column('hr_id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    
    # Create onboarding_employees table
    op.create_table('onboarding_employees',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=True),
    sa.Column('email', sa.String(length=100), nullable=True),
    sa.Column('password', sa.String(), nullable=True),
    sa.Column('role', sa.String(length=100), nullable=True),
    sa.Column('type', sa.String(length=100), nullable=True),
    sa.Column('o_status', sa.Boolean(), nullable=True),
    sa.Column('login_status', sa.Boolean(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    
    # Create onboarding_emp_docs table
    op.create_table('onboarding_emp_docs',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('employee_id', sa.Integer(), nullable=False),
    sa.Column('doc_type', sa.String(), nullable=False),
    sa.Column('file_name', sa.String(), nullable=True),
    sa.Column('file_url', sa.String(), nullable=True),
    sa.Column('uploaded_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    
    # Create attendance table
    op.create_table('attendance',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('employee_id', sa.Integer(), nullable=False),
    sa.Column('date', sa.Date(), nullable=False),
    sa.Column('day', sa.String(), nullable=True),
    sa.Column('action', sa.String(), nullable=True),
    sa.Column('status', sa.String(), nullable=True),
    sa.Column('hours', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    
    # Create attendance_projects table
    op.create_table('attendance_projects',
    sa.Column('attendance_project_id', sa.Integer(), nullable=False),
    sa.Column('attendance_id', sa.Integer(), nullable=False),
    sa.Column('project_id', sa.Integer(), nullable=False),
    sa.Column('sub_task', sa.String(), nullable=True),
    sa.PrimaryKeyConstraint('attendance_project_id')
    )
    
    # Create employee_documents table
    op.create_table('employee_documents',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('employee_id', sa.Integer(), nullable=False),
    sa.Column('doc_type', sa.String(), nullable=False),
    sa.Column('file_id', sa.String(), nullable=False),
    sa.Column('file_name', sa.String(), nullable=False),
    sa.Column('file_url', sa.String(), nullable=False),
    sa.Column('uploaded_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    
    # Create expense_requests table
    op.create_table('expense_requests',
    sa.Column('request_id', sa.Integer(), nullable=False),
    sa.Column('request_code', sa.String(), nullable=False),
    sa.Column('employee_id', sa.Integer(), nullable=False),
    sa.Column('category', sa.String(), nullable=False),
    sa.Column('amount', sa.Float(), nullable=False),
    sa.Column('currency', sa.String(), nullable=False),
    sa.Column('description', sa.String(), nullable=True),
    sa.Column('expense_date', sa.DateTime(), nullable=False),
    sa.Column('tax_included', sa.Boolean(), nullable=False),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('request_id')
    )
    
    # Create expense_attachments table
    op.create_table('expense_attachments',
    sa.Column('attachment_id', sa.Integer(), nullable=False),
    sa.Column('request_id', sa.Integer(), nullable=False),
    sa.Column('file_name', sa.String(), nullable=False),
    sa.Column('file_path', sa.String(), nullable=False),
    sa.Column('file_type', sa.String(), nullable=True),
    sa.Column('file_size', sa.Float(), nullable=True),
    sa.Column('uploaded_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('attachment_id')
    )
    
    # Create expense_history table
    op.create_table('expense_history',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('request_id', sa.Integer(), nullable=False),
    sa.Column('action_by', sa.Integer(), nullable=False),
    sa.Column('action_role', sa.String(), nullable=False),
    sa.Column('action', sa.String(), nullable=False),
    sa.Column('reason', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    
    # Create leave_management table
    op.create_table('leave_management',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('employee_id', sa.Integer(), nullable=False),
    sa.Column('reason', sa.String(), nullable=True),
    sa.Column('start_date', sa.Date(), nullable=False),
    sa.Column('end_date', sa.Date(), nullable=False),
    sa.Column('no_of_days', sa.Integer(), nullable=False),
    sa.Column('status', sa.String(length=20), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.Column('manager_status', sa.String(length=20), nullable=False),
    sa.Column('hr_status', sa.String(length=20), nullable=False),
    sa.Column('leave_type', sa.String(length=20), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    
    # Create leave_balance table
    op.create_table('leave_balance',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('employee_id', sa.Integer(), nullable=False),
    sa.Column('sick_leaves', sa.Integer(), nullable=False),
    sa.Column('casual_leaves', sa.Integer(), nullable=False),
    sa.Column('paid_leaves', sa.Integer(), nullable=False),
    sa.Column('maternity_leave', sa.Integer(), nullable=True),
    sa.Column('paternity_leave', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    
    # Create leave_approvals table
    op.create_table('leave_approvals',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('leave_id', sa.Integer(), nullable=False),
    sa.Column('approver_id', sa.Integer(), nullable=False),
    sa.Column('approver_role', sa.String(length=50), nullable=True),
    sa.Column('status', sa.String(length=20), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    
    # Create projects table
    op.create_table('projects',
    sa.Column('project_id', sa.Integer(), nullable=False),
    sa.Column('project_name', sa.String(), nullable=False),
    sa.Column('project_objective', sa.String(), nullable=True),
    sa.Column('client_requirements', sa.String(), nullable=True),
    sa.Column('budget', sa.Float(), nullable=True),
    sa.Column('start_date', sa.Date(), nullable=True),
    sa.Column('end_date', sa.Date(), nullable=True),
    sa.Column('skills_required', sa.String(), nullable=True),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('project_id')
    )
    
    # Create employee_project_assignments table
    op.create_table('employee_project_assignments',
    sa.Column('assignment_id', sa.Integer(), nullable=False),
    sa.Column('employee_id', sa.Integer(), nullable=False),
    sa.Column('project_id', sa.Integer(), nullable=False),
    sa.Column('assigned_by', sa.Integer(), nullable=True),
    sa.Column('assigned_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('assignment_id')
    )
    
    # Create project_status_logs table
    op.create_table('project_status_logs',
    sa.Column('log_id', sa.Integer(), nullable=False),
    sa.Column('project_id', sa.Integer(), nullable=False),
    sa.Column('updated_by', sa.Integer(), nullable=True),
    sa.Column('new_status', sa.String(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('log_id')
    )
    
    # Create request_logs table
    op.create_table('request_logs',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('employee_id', sa.Integer(), nullable=False),
    sa.Column('document_type', sa.String(), nullable=False),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('requested_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    
    # Create weekoff table
    op.create_table('weekoff',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('employee_id', sa.Integer(), nullable=False),
    sa.Column('week_start', sa.Date(), nullable=False),
    sa.Column('week_end', sa.Date(), nullable=False),
    sa.Column('off_days', postgresql.ARRAY(sa.String()), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    
    # Create foreign key constraints
    op.create_foreign_key('fk_employees_location_id', 'employees', 'locations', ['location_id'], ['id'])
    op.create_foreign_key('fk_employee_master_emp_id', 'employee_master', 'employees', ['emp_id'], ['id'])
    op.create_foreign_key('fk_employee_master_manager1_id', 'employee_master', 'employees', ['manager1_id'], ['id'])
    op.create_foreign_key('fk_employee_master_hr1_id', 'employee_master', 'employees', ['hr1_id'], ['id'])
    op.create_foreign_key('fk_employee_master_manager2_id', 'employee_master', 'employees', ['manager2_id'], ['id'])
    op.create_foreign_key('fk_employee_master_manager3_id', 'employee_master', 'employees', ['manager3_id'], ['id'])
    op.create_foreign_key('fk_employee_master_hr2_id', 'employee_master', 'employees', ['hr2_id'], ['id'])
    op.create_foreign_key('fk_employee_details_employee_id', 'employee_details', 'employees', ['employee_id'], ['id'])
    op.create_foreign_key('fk_employee_managers_employee_id', 'employee_managers', 'employees', ['employee_id'], ['id'])
    op.create_foreign_key('fk_employee_managers_manager_id', 'employee_managers', 'employees', ['manager_id'], ['id'])
    op.create_foreign_key('fk_employee_hrs_employee_id', 'employee_hrs', 'employees', ['employee_id'], ['id'])
    op.create_foreign_key('fk_employee_hrs_hr_id', 'employee_hrs', 'employees', ['hr_id'], ['id'])
    op.create_foreign_key('fk_attendance_employee_id', 'attendance', 'employees', ['employee_id'], ['id'])
    op.create_foreign_key('fk_attendance_projects_attendance_id', 'attendance_projects', 'attendance', ['attendance_id'], ['id'])
    op.create_foreign_key('fk_attendance_projects_project_id', 'attendance_projects', 'projects', ['project_id'], ['project_id'])
    op.create_foreign_key('fk_expense_requests_employee_id', 'expense_requests', 'employees', ['employee_id'], ['id'])
    op.create_foreign_key('fk_expense_attachments_request_id', 'expense_attachments', 'expense_requests', ['request_id'], ['request_id'])
    op.create_foreign_key('fk_expense_history_request_id', 'expense_history', 'expense_requests', ['request_id'], ['request_id'])
    op.create_foreign_key('fk_expense_history_action_by', 'expense_history', 'employees', ['action_by'], ['id'])
    op.create_foreign_key('fk_leave_management_employee_id', 'leave_management', 'employees', ['employee_id'], ['id'])
    op.create_foreign_key('fk_leave_balance_employee_id', 'leave_balance', 'employees', ['employee_id'], ['id'])
    op.create_foreign_key('fk_leave_approvals_leave_id', 'leave_approvals', 'leave_management', ['leave_id'], ['id'])
    op.create_foreign_key('fk_leave_approvals_approver_id', 'leave_approvals', 'employees', ['approver_id'], ['id'])
    op.create_foreign_key('fk_employee_project_assignments_employee_id', 'employee_project_assignments', 'employees', ['employee_id'], ['id'])
    op.create_foreign_key('fk_employee_project_assignments_project_id', 'employee_project_assignments', 'projects', ['project_id'], ['project_id'])
    op.create_foreign_key('fk_employee_project_assignments_assigned_by', 'employee_project_assignments', 'employees', ['assigned_by'], ['id'])
    op.create_foreign_key('fk_project_status_logs_project_id', 'project_status_logs', 'projects', ['project_id'], ['project_id'])
    op.create_foreign_key('fk_project_status_logs_updated_by', 'project_status_logs', 'employees', ['updated_by'], ['id'])
    op.create_foreign_key('fk_request_logs_employee_id', 'request_logs', 'employees', ['employee_id'], ['id'])
    op.create_foreign_key('fk_weekoff_employee_id', 'weekoff', 'employees', ['employee_id'], ['id'])


def downgrade() -> None:
    # Drop all foreign key constraints first
    op.drop_constraint('fk_weekoff_employee_id', 'weekoff', type_='foreignkey')
    op.drop_constraint('fk_request_logs_employee_id', 'request_logs', type_='foreignkey')
    op.drop_constraint('fk_project_status_logs_updated_by', 'project_status_logs', type_='foreignkey')
    op.drop_constraint('fk_project_status_logs_project_id', 'project_status_logs', type_='foreignkey')
    op.drop_constraint('fk_employee_project_assignments_assigned_by', 'employee_project_assignments', type_='foreignkey')
    op.drop_constraint('fk_employee_project_assignments_project_id', 'employee_project_assignments', type_='foreignkey')
    op.drop_constraint('fk_employee_project_assignments_employee_id', 'employee_project_assignments', type_='foreignkey')
    op.drop_constraint('fk_leave_approvals_approver_id', 'leave_approvals', type_='foreignkey')
    op.drop_constraint('fk_leave_approvals_leave_id', 'leave_approvals', type_='foreignkey')
    op.drop_constraint('fk_leave_balance_employee_id', 'leave_balance', type_='foreignkey')
    op.drop_constraint('fk_leave_management_employee_id', 'leave_management', type_='foreignkey')
    op.drop_constraint('fk_expense_history_action_by', 'expense_history', type_='foreignkey')
    op.drop_constraint('fk_expense_history_request_id', 'expense_history', type_='foreignkey')
    op.drop_constraint('fk_expense_attachments_request_id', 'expense_attachments', type_='foreignkey')
    op.drop_constraint('fk_expense_requests_employee_id', 'expense_requests', type_='foreignkey')
    op.drop_constraint('fk_attendance_projects_project_id', 'attendance_projects', type_='foreignkey')
    op.drop_constraint('fk_attendance_projects_attendance_id', 'attendance_projects', type_='foreignkey')
    op.drop_constraint('fk_attendance_employee_id', 'attendance', type_='foreignkey')
    op.drop_constraint('fk_employee_hrs_hr_id', 'employee_hrs', type_='foreignkey')
    op.drop_constraint('fk_employee_hrs_employee_id', 'employee_hrs', type_='foreignkey')
    op.drop_constraint('fk_employee_managers_manager_id', 'employee_managers', type_='foreignkey')
    op.drop_constraint('fk_employee_managers_employee_id', 'employee_managers', type_='foreignkey')
    op.drop_constraint('fk_employee_details_employee_id', 'employee_details', type_='foreignkey')
    op.drop_constraint('fk_employee_master_hr2_id', 'employee_master', type_='foreignkey')
    op.drop_constraint('fk_employee_master_manager3_id', 'employee_master', type_='foreignkey')
    op.drop_constraint('fk_employee_master_manager2_id', 'employee_master', type_='foreignkey')
    op.drop_constraint('fk_employee_master_hr1_id', 'employee_master', type_='foreignkey')
    op.drop_constraint('fk_employee_master_manager1_id', 'employee_master', type_='foreignkey')
    op.drop_constraint('fk_employee_master_emp_id', 'employee_master', type_='foreignkey')
    op.drop_constraint('fk_employees_location_id', 'employees', type_='foreignkey')
    
    # Drop all tables
    op.drop_table('weekoff')
    op.drop_table('request_logs')
    op.drop_table('project_status_logs')
    op.drop_table('employee_project_assignments')
    op.drop_table('projects')
    op.drop_table('leave_approvals')
    op.drop_table('leave_balance')
    op.drop_table('leave_management')
    op.drop_table('expense_history')
    op.drop_table('expense_attachments')
    op.drop_table('expense_requests')
    op.drop_table('employee_documents')
    op.drop_table('attendance_projects')
    op.drop_table('attendance')
    op.drop_table('onboarding_emp_docs')
    op.drop_table('onboarding_employees')
    op.drop_table('employee_hrs')
    op.drop_table('employee_managers')
    op.drop_table('employee_details')
    op.drop_table('employee_master')
    op.drop_table('locations')
    op.drop_table('employees')
