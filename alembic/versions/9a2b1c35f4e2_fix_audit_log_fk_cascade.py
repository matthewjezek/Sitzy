"""fix_audit_log_fk_cascade

Revision ID: 9a2b1c35f4e2
Revises: 8f19ac34e2d1
Create Date: 2026-04-14 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9a2b1c35f4e2"
down_revision: Union[str, Sequence[str], None] = "8f19ac34e2d1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint("integration_audit_logs_user_id_fkey", "integration_audit_logs", type_="foreignkey")
    op.create_foreign_key(
        "integration_audit_logs_user_id_fkey",
        "integration_audit_logs",
        "users",
        ["user_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("integration_audit_logs_user_id_fkey", "integration_audit_logs", type_="foreignkey")
    op.create_foreign_key(
        "integration_audit_logs_user_id_fkey",
        "integration_audit_logs",
        "users",
        ["user_id"],
        ["id"],
    )
