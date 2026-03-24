"""Add decisions column to cds_recommendations table

Revision ID: 20260324_add_decisions
Revises: add_status_to_appointments
Create Date: 2026-03-24 07:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260324_add_decisions'
down_revision = 'add_status_to_appointments'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add decisions column to cds_recommendations table
    op.add_column('cds_recommendations', sa.Column('decisions', sa.JSON(), nullable=True))


def downgrade() -> None:
    # Remove decisions column from cds_recommendations table
    op.drop_column('cds_recommendations', 'decisions')
