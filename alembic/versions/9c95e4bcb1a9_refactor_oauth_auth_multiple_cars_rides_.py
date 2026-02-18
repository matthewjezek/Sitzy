"""refactor: OAuth auth, multiple cars, rides model

Revision ID: 9c95e4bcb1a9
Revises: 75f0d805127a
Create Date: 2026-02-18 21:56:26.245645

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '9c95e4bcb1a9'
down_revision: Union[str, Sequence[str], None] = '75f0d805127a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - drop old tables and create new clean schema."""
    # Drop all old tables (in dependency order)
    op.execute('DROP TABLE IF EXISTS passengers CASCADE')
    op.execute('DROP TABLE IF EXISTS seats CASCADE')
    op.execute('DROP TABLE IF EXISTS invitations CASCADE')
    op.execute('DROP TABLE IF EXISTS cars CASCADE')
    op.execute('DROP TABLE IF EXISTS users CASCADE')
    
    # Create new clean schema
    
    # Users table - now OAuth-based, no password
    op.create_table('users',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('email', sa.String(), nullable=False),
    sa.Column('full_name', sa.String(), nullable=True),
    sa.Column('avatar_url', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default='now()', nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default='now()', nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('email')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    
    # Cars table - owner_id is now just FK, not unique (1:N ownership)
    op.create_table('cars',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('owner_id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('layout', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default='now()', nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default='now()', nullable=False),
    sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_cars_owner_id'), 'cars', ['owner_id'], unique=False)
    
    # Seats table - composite PK (car_id, position)
    op.create_table('seats',
    sa.Column('car_id', sa.UUID(), nullable=False),
    sa.Column('position', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['car_id'], ['cars.id'], ),
    sa.PrimaryKeyConstraint('car_id', 'position')
    )
    
    # Invitations table
    op.create_table('invitations',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('car_id', sa.UUID(), nullable=False),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default='now()', nullable=False),
    sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['car_id'], ['cars.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_invitations_expires_at'), 'invitations', ['expires_at'], unique=False)
    op.create_index(op.f('ix_invitations_user_id'), 'invitations', ['user_id'], unique=False)
    
    # OAuth tables
    op.create_table('social_accounts',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('provider', sa.String(), nullable=False),
    sa.Column('social_id', sa.String(), nullable=False),
    sa.Column('email', sa.String(), nullable=False),
    sa.Column('linked_at', sa.DateTime(timezone=True), server_default='now()', nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('provider', 'social_id', name='uq_social_provider_id')
    )
    op.create_index(op.f('ix_social_accounts_user_id'), 'social_accounts', ['user_id'], unique=False)
    
    op.create_table('social_sessions',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('social_account_id', sa.UUID(), nullable=False),
    sa.Column('access_token', sa.String(), nullable=False),
    sa.Column('refresh_token', sa.String(), nullable=True),
    sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('user_agent', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['social_account_id'], ['social_accounts.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_social_sessions_expires_at'), 'social_sessions', ['expires_at'], unique=False)
    op.create_index(op.f('ix_social_sessions_social_account_id'), 'social_sessions', ['social_account_id'], unique=False)
    
    # Driver history table
    op.create_table('car_drivers',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('car_id', sa.UUID(), nullable=False),
    sa.Column('driver_id', sa.UUID(), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('assigned_at', sa.DateTime(timezone=True), server_default='now()', nullable=False),
    sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['car_id'], ['cars.id'], ),
    sa.ForeignKeyConstraint(['driver_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_car_drivers_car_id'), 'car_drivers', ['car_id'], unique=False)
    op.create_index(op.f('ix_car_drivers_driver_id'), 'car_drivers', ['driver_id'], unique=False)
    
    # Create partial unique index for active driver per car
    op.execute("""
        CREATE UNIQUE INDEX uq_car_drivers_one_active 
        ON car_drivers(car_id) 
        WHERE is_active = true
    """)
    
    # Rides table
    op.create_table('rides',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('car_id', sa.UUID(), nullable=False),
    sa.Column('car_driver_id', sa.UUID(), nullable=False),
    sa.Column('departure_time', sa.DateTime(timezone=True), nullable=False),
    sa.Column('destination', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default='now()', nullable=False),
    sa.ForeignKeyConstraint(['car_driver_id'], ['car_drivers.id'], ),
    sa.ForeignKeyConstraint(['car_id'], ['cars.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_rides_car_driver_id'), 'rides', ['car_driver_id'], unique=False)
    op.create_index(op.f('ix_rides_car_id'), 'rides', ['car_id'], unique=False)
    op.create_index(op.f('ix_rides_departure_time'), 'rides', ['departure_time'], unique=False)
    
    # Passengers table - references rides, not cars
    op.create_table('passengers',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('ride_id', sa.UUID(), nullable=False),
    sa.Column('seat_position', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['ride_id'], ['rides.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_passengers_user_id'), 'passengers', ['user_id'], unique=False)
    op.create_index(op.f('ix_passengers_ride_id'), 'passengers', ['ride_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop all new tables (reverse dependency order)
    op.execute('DROP TABLE IF EXISTS passengers CASCADE')
    op.execute('DROP TABLE IF EXISTS rides CASCADE')
    op.execute('DROP TABLE IF EXISTS car_drivers CASCADE')
    op.execute('DROP TABLE IF EXISTS social_sessions CASCADE')
    op.execute('DROP TABLE IF EXISTS social_accounts CASCADE')
    op.execute('DROP TABLE IF EXISTS invitations CASCADE')
    op.execute('DROP TABLE IF EXISTS seats CASCADE')
    op.execute('DROP TABLE IF EXISTS cars CASCADE')
    op.execute('DROP TABLE IF EXISTS users CASCADE')
