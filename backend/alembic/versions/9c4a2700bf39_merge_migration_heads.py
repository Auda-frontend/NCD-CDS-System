"""merge_migration_heads

Revision ID: 9c4a2700bf39
Revises: 20250306_explanations, c66d1e682706
Create Date: 2026-03-06 10:23:03.350319

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9c4a2700bf39'
down_revision: Union[str, None] = ('20250306_explanations', 'c66d1e682706')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
