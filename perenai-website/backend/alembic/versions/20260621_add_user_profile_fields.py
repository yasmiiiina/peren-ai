"""Add user profile_type and picture_url

Revision ID: 20260621_profile
Revises: c9262a67e13d
Create Date: 2026-06-21
"""

from alembic import op
import sqlalchemy as sa

revision = "20260621_profile"
down_revision = "c9262a67e13d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("profile_type", sa.String(length=50), server_default="individu", nullable=False))
    op.add_column("users", sa.Column("picture_url", sa.String(length=512), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "picture_url")
    op.drop_column("users", "profile_type")
