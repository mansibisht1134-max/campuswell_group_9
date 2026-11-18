from fastapi.testclient import TestClient

from main import app
import models


client = TestClient(app)


def test_root_endpoint_reports_api():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["name"] == "CampusWell API"


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_database_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["database"] == "connected"


def test_notifications_require_authentication():
    response = client.get("/api/v1/notifications")
    assert response.status_code == 401


def test_account_endpoint_requires_authentication():
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_expected_database_tables_are_registered():
    expected = {
        "users",
        "student_profiles",
        "counsellor_profiles",
        "appointments",
        "wellness_checkins",
        "support_requests",
        "campus_voice_submissions",
        "resources",
        "saved_resources",
        "interventions",
        "follow_ups",
        "outcome_records",
        "notifications",
    }
    assert expected.issubset(set(models.Base.metadata.tables))
