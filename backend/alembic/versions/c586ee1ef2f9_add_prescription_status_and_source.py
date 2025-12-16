"""add prescription status and source

Revision ID: c586ee1ef2f9
Revises: 8581cbbc6a86
Create Date: 2025-12-12 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c586ee1ef2f9'
down_revision: Union[str, None] = '8581cbbc6a86'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enum types
    op.execute("CREATE TYPE prescriptionstatus AS ENUM ('DRAFT', 'APPROVED', 'DISPENSED', 'CANCELLED')")
    op.execute("CREATE TYPE prescriptionsource AS ENUM ('AI_CDS', 'MANUAL')")

    # Add columns
    op.add_column('prescriptions', sa.Column('status', sa.Enum('DRAFT', 'APPROVED', 'DISPENSED', 'CANCELLED', name='prescriptionstatus'), nullable=False, default='DRAFT'))
    op.add_column('prescriptions', sa.Column('source', sa.Enum('AI_CDS', 'MANUAL', name='prescriptionsource'), nullable=False, default='MANUAL'))
    op.add_column('prescriptions', sa.Column('reason', sa.Text(), nullable=True))


def downgrade() -> None:
    # Remove columns
    op.drop_column('prescriptions', 'reason')
    op.drop_column('prescriptions', 'source')
    op.drop_column('prescriptions', 'status')

    # Drop enum types
    op.execute("DROP TYPE IF EXISTS prescriptionsource")
    op.execute("DROP TYPE IF EXISTS prescriptionstatus")