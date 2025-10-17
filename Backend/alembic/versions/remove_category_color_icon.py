"""remove color and icon from policy categories

Revision ID: remove_category_color_icon
Revises: 
Create Date: 2025-10-16

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'remove_category_color_icon'
down_revision = None  # Update this with the previous migration revision
branch_labels = None
depends_on = None


def upgrade():
    # Drop color and icon columns from policy_categories table
    op.drop_column('policy_categories', 'color')
    op.drop_column('policy_categories', 'icon')


def downgrade():
    # Re-add color and icon columns if rolling back
    op.add_column('policy_categories', 
        sa.Column('color', sa.String(), nullable=True, server_default='#3B82F6')
    )
    op.add_column('policy_categories', 
        sa.Column('icon', sa.String(), nullable=True, server_default='📄')
    )

