"""Merge migration heads

Revision ID: 751cbc91c85c
Revises: add_status_to_appointments, e9699ec0811f
Create Date: 2025-12-16 09:48:13.786746

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '751cbc91c85c'
down_revision: Union[str, None] = ('add_status_to_appointments', 'e9699ec0811f')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
