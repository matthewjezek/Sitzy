"""invitation_ride_fk

Revision ID: 4b47027ef03f
Revises: cb36a732d7d7
Create Date: 2026-02-24 02:42:40.233501

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4b47027ef03f'
down_revision: Union[str, Sequence[str], None] = 'cb36a732d7d7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('invitations', sa.Column('ride_id', sa.UUID(), nullable=False))
    op.drop_index(op.f('ix_invitations_car_id'), table_name='invitations')
    op.create_index(op.f('ix_invitations_ride_id'), 'invitations', ['ride_id'], unique=False)
    op.drop_constraint(op.f('invitations_car_id_fkey'), 'invitations', type_='foreignkey')
    op.create_foreign_key(
        'fk_invitations_ride_id', 'invitations', 'rides', ['ride_id'], ['id']
    )
    op.drop_column('invitations', 'car_id')


def downgrade() -> None:
    op.add_column('invitations', sa.Column('car_id', sa.UUID(), autoincrement=False, nullable=False))
    op.drop_constraint('fk_invitations_ride_id', 'invitations', type_='foreignkey')
    op.create_foreign_key(
        op.f('invitations_car_id_fkey'), 'invitations', 'cars', ['car_id'], ['id']
    )
    op.drop_index(op.f('ix_invitations_ride_id'), table_name='invitations')
    op.create_index(op.f('ix_invitations_car_id'), 'invitations', ['car_id'], unique=False)
    op.drop_column('invitations', 'ride_id')
    