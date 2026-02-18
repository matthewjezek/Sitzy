"""Add server_default to CarDriver.revoked_at

Revision ID: 09dd302d3e8b
Revises: 9c95e4bcb1a9
Create Date: 2026-02-18 22:53:57.765807

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '09dd302d3e8b'
down_revision: Union[str, Sequence[str], None] = '9c95e4bcb1a9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - add server_default to car_drivers.revoked_at."""
    op.alter_column(
        'car_drivers',
        'revoked_at',
        existing_type=sa.DateTime(timezone=True),
        server_default='now()',
        existing_nullable=True,
    )


def downgrade() -> None:
    """Downgrade schema - remove server_default from car_drivers.revoked_at."""
    op.alter_column(
        'car_drivers',
        'revoked_at',
        existing_type=sa.DateTime(timezone=True),
        server_default=None,
        existing_nullable=True,
    )
