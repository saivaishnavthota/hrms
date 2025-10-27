"""remove project_name revenue field

Revision ID: 018
Revises: 016
Create Date: 2025-10-26 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '018'
down_revision = '016'
branch_labels = None
depends_on = None


def upgrade():
    # Remove project_name column (Revenue field)
    op.drop_column('projects', 'project_name')


def downgrade():
    # Re-add project_name column
    op.add_column('projects', sa.Column('project_name', sa.String(), nullable=False))
