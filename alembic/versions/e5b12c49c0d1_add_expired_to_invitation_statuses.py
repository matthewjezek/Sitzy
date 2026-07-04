"""add_expired_to_invitation_statuses

Revision ID: e5b12c49c0d1
Revises: 7d1f3b7a6f21
Create Date: 2026-07-04 23:33:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5b12c49c0d1'
down_revision: Union[str, Sequence[str], None] = '7d1f3b7a6f21'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Postgres specific alteration
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        with op.get_context().autocommit_block():
            op.execute("ALTER TYPE invitation_statuses ADD VALUE 'EXPIRED'")


def downgrade() -> None:
    # Downgrade is not easily supported in Postgres without dropping the type,
    # which we want to avoid. We will log a warning.
    import logging
    log = logging.getLogger("alembic.runtime.migration")
    log.warning("Downgrade is not supported for adding values to enum types. Leaving 'EXPIRED' in invitation_statuses.")
