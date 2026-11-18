"""Create the initial CampusWell relational schema.

Revision ID: 0001_initial
Revises:
Create Date: 2026-11-18
"""
from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=False)
    op.create_index("ix_users_role", "users", ["role"], unique=False)

    op.create_table(
        "student_profiles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(length=150), nullable=False),
        sa.Column("student_number", sa.String(length=50), nullable=True),
        sa.Column("department", sa.String(length=120), nullable=True),
        sa.Column("course", sa.String(length=120), nullable=True),
        sa.Column("year_of_study", sa.Integer(), nullable=True),
        sa.Column("phone", sa.String(length=30), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id"),
        sa.UniqueConstraint("student_number"),
    )
    op.create_index("ix_student_profiles_student_number", "student_profiles", ["student_number"], unique=False)

    op.create_table(
        "counsellor_profiles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(length=150), nullable=False),
        sa.Column("employee_id", sa.String(length=50), nullable=True),
        sa.Column("specialization", sa.String(length=200), nullable=True),
        sa.Column("qualification", sa.String(length=200), nullable=True),
        sa.Column("phone", sa.String(length=30), nullable=True),
        sa.Column("is_available", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id"),
        sa.UniqueConstraint("employee_id"),
    )
    op.create_index("ix_counsellor_profiles_employee_id", "counsellor_profiles", ["employee_id"], unique=False)

    op.create_table(
        "resources",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("url", sa.String(length=1000), nullable=True),
        sa.Column("is_published", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_resources_category", "resources", ["category"], unique=False)

    op.create_table(
        "appointments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("counsellor_id", sa.Integer(), nullable=False),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.Column("mode", sa.String(length=30), nullable=False),
        sa.Column("reason", sa.String(length=120), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("counsellor_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["student_id"], ["student_profiles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["counsellor_id"], ["counsellor_profiles.id"]),
    )
    op.create_index("ix_appointments_student_id", "appointments", ["student_id"], unique=False)
    op.create_index("ix_appointments_counsellor_id", "appointments", ["counsellor_id"], unique=False)
    op.create_index("ix_appointments_scheduled_at", "appointments", ["scheduled_at"], unique=False)
    op.create_index("ix_appointments_status", "appointments", ["status"], unique=False)

    op.create_table(
        "wellness_checkins",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("mood", sa.String(length=60), nullable=True),
        sa.Column("sleep_hours", sa.Float(), nullable=True),
        sa.Column("energy_level", sa.String(length=40), nullable=True),
        sa.Column("stress_level", sa.String(length=40), nullable=True),
        sa.Column("score", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("score >= 0 AND score <= 100", name="ck_wellness_score_range"),
        sa.ForeignKeyConstraint(["student_id"], ["student_profiles.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_wellness_checkins_student_id", "wellness_checkins", ["student_id"], unique=False)
    op.create_index("ix_wellness_checkins_submitted_at", "wellness_checkins", ["submitted_at"], unique=False)

    op.create_table(
        "support_requests",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("assigned_counsellor_id", sa.Integer(), nullable=True),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("priority", sa.String(length=30), nullable=False),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["student_id"], ["student_profiles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["assigned_counsellor_id"], ["counsellor_profiles.id"]),
    )
    op.create_index("ix_support_requests_student_id", "support_requests", ["student_id"], unique=False)
    op.create_index("ix_support_requests_assigned_counsellor_id", "support_requests", ["assigned_counsellor_id"], unique=False)
    op.create_index("ix_support_requests_status", "support_requests", ["status"], unique=False)

    op.create_table(
        "campus_voice_submissions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("student_id", sa.Integer(), nullable=True),
        sa.Column("is_anonymous", sa.Boolean(), nullable=False),
        sa.Column("submission_type", sa.String(length=40), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["student_id"], ["student_profiles.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_campus_voice_submissions_student_id", "campus_voice_submissions", ["student_id"], unique=False)
    op.create_index("ix_campus_voice_submissions_status", "campus_voice_submissions", ["status"], unique=False)
    op.create_index("ix_campus_voice_submissions_created_at", "campus_voice_submissions", ["created_at"], unique=False)

    op.create_table(
        "saved_resources",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("resource_id", sa.Integer(), nullable=False),
        sa.Column("saved_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["student_id"], ["student_profiles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["resource_id"], ["resources.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_saved_resources_student_id", "saved_resources", ["student_id"], unique=False)
    op.create_index("ix_saved_resources_resource_id", "saved_resources", ["resource_id"], unique=False)

    op.create_table(
        "interventions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("counsellor_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("intervention_type", sa.String(length=100), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["student_id"], ["student_profiles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["counsellor_id"], ["counsellor_profiles.id"]),
    )
    op.create_index("ix_interventions_student_id", "interventions", ["student_id"], unique=False)
    op.create_index("ix_interventions_counsellor_id", "interventions", ["counsellor_id"], unique=False)
    op.create_index("ix_interventions_status", "interventions", ["status"], unique=False)

    op.create_table(
        "follow_ups",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("counsellor_id", sa.Integer(), nullable=False),
        sa.Column("appointment_id", sa.Integer(), nullable=True),
        sa.Column("due_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("mode", sa.String(length=30), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("outcome", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["student_id"], ["student_profiles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["counsellor_id"], ["counsellor_profiles.id"]),
        sa.ForeignKeyConstraint(["appointment_id"], ["appointments.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_follow_ups_student_id", "follow_ups", ["student_id"], unique=False)
    op.create_index("ix_follow_ups_counsellor_id", "follow_ups", ["counsellor_id"], unique=False)
    op.create_index("ix_follow_ups_due_at", "follow_ups", ["due_at"], unique=False)
    op.create_index("ix_follow_ups_status", "follow_ups", ["status"], unique=False)

    op.create_table(
        "outcome_records",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("counsellor_id", sa.Integer(), nullable=False),
        sa.Column("intervention_id", sa.Integer(), nullable=True),
        sa.Column("initial_assessment", sa.Integer(), nullable=True),
        sa.Column("latest_assessment", sa.Integer(), nullable=True),
        sa.Column("goals_done", sa.Integer(), nullable=False),
        sa.Column("goals_total", sa.Integer(), nullable=False),
        sa.Column("intervention_type", sa.String(length=100), nullable=True),
        sa.Column("outcome_status", sa.String(length=40), nullable=False),
        sa.Column("evaluation_date", sa.Date(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["student_id"], ["student_profiles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["counsellor_id"], ["counsellor_profiles.id"]),
        sa.ForeignKeyConstraint(["intervention_id"], ["interventions.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_outcome_records_student_id", "outcome_records", ["student_id"], unique=False)
    op.create_index("ix_outcome_records_counsellor_id", "outcome_records", ["counsellor_id"], unique=False)

    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("notification_type", sa.String(length=50), nullable=True),
        sa.Column("target_url", sa.String(length=500), nullable=True),
        sa.Column("is_read", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"], unique=False)
    op.create_index("ix_notifications_is_read", "notifications", ["is_read"], unique=False)


def downgrade():
    op.drop_table("notifications")
    op.drop_table("outcome_records")
    op.drop_table("follow_ups")
    op.drop_table("interventions")
    op.drop_table("saved_resources")
    op.drop_table("campus_voice_submissions")
    op.drop_table("support_requests")
    op.drop_table("wellness_checkins")
    op.drop_table("appointments")
    op.drop_table("resources")
    op.drop_table("counsellor_profiles")
    op.drop_table("student_profiles")
    op.drop_table("users")
