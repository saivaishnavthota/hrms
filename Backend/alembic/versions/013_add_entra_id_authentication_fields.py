"""add entra id authentication fields

Revision ID: 013_add_entra_id_fields
Revises: remove_category_color_icon
Create Date: 2025-10-17

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '013_add_entra_id_fields'
down_revision = 'remove_category_color_icon'
branch_labels = None
depends_on = None


def upgrade():
    """Add Microsoft Entra ID authentication fields to employees table"""
    
    # Add entra_id column (unique identifier from Microsoft)
    op.add_column('employees', 
        sa.Column('entra_id', sa.String(length=255), nullable=True)
    )
    
    # Add job_title column (from Entra ID profile)
    op.add_column('employees', 
        sa.Column('job_title', sa.String(length=200), nullable=True)
    )
    
    # Add department column (from Entra ID profile)
    op.add_column('employees', 
        sa.Column('department', sa.String(length=200), nullable=True)
    )
    
    # Add auth_provider column (track authentication method)
    op.add_column('employees', 
        sa.Column('auth_provider', sa.String(length=50), nullable=True, server_default='local')
    )
    
    # Create index on entra_id for fast lookups
    op.create_index('ix_employees_entra_id', 'employees', ['entra_id'], unique=True)
    
    # Update existing users to have 'local' auth provider
    op.execute("UPDATE employees SET auth_provider = 'local' WHERE auth_provider IS NULL")


def downgrade():
    """Remove Microsoft Entra ID authentication fields"""
    
    # Drop index first
    op.drop_index('ix_employees_entra_id', 'employees')
    
    # Drop columns
    op.drop_column('employees', 'auth_provider')
    op.drop_column('employees', 'department')
    op.drop_column('employees', 'job_title')
    op.drop_column('employees', 'entra_id')

