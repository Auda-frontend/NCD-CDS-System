"""Add explanations column to cds_recommendations

Revision ID: 20250306_explanations
Revises: 751cbc91c85c
Create Date: 2025-03-06

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20250306_explanations"
down_revision: Union[str, None] = "751cbc91c85c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "cds_recommendations",
        sa.Column("explanations", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("cds_recommendations", "explanations")
