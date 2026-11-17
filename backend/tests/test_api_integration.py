"""End-to-end FastAPI endpoint and SQLite persistence tests."""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.api.routes.ai import get_openrouter_service
from app.core.config import Settings
from app.database.init_db import init_db
from app.database.session import create_connection, get_db
from app.main import app
from app.services.openrouter_service import OpenRouterService


@pytest.fixture()
def client(tmp_path: Path):
    db_file = str(tmp_path / "test_labxai.db")
    init_db(db_path=db_file)

    def override_get_db():
        conn = create_connection(db_file)
        try:
            yield conn
        finally:
            conn.close()

    def override_ai_service():
        # Force deterministic fallback in automated API tests so no external network calls occur
        return OpenRouterService(Settings(openrouter_api_key=""))

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_openrouter_service] = override_ai_service

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def test_preserved_existing_endpoints(client: TestClient):
    r_root = client.get("/")
    assert r_root.status_code == 200
    assert r_root.json()["project"] == "LabXAI"
    assert r_root.json()["status"] == "running"

    r_health = client.get("/health")
    assert r_health.status_code == 200
    assert r_health.json()["service"] == "LabXAI Backend"
    assert r_health.json()["database"] == "connected"

    r_v1 = client.get("/api/v1")
    assert r_v1.status_code == 200
    assert r_v1.json()["version"] == "v1"
    assert "Virtual Experiments" in r_v1.json()["available_modules"]


def test_v1_health_and_languages(client: TestClient):
    r_health = client.get("/api/v1/health")
    assert r_health.status_code == 200
    assert r_health.json()["database"] == "connected"

    r_lang = client.get("/api/v1/languages")
    assert r_lang.status_code == 200
    codes = [lang["code"] for lang in r_lang.json()["languages"]]
    assert "en" in codes
    assert "kn" in codes
    assert {"hi", "te", "ta"}.issubset(set(codes))


def test_experiments_catalog_and_simulation_persistence(client: TestClient):
    r_list = client.get("/api/v1/experiments")
    assert r_list.status_code == 200
    ids = {exp["id"] for exp in r_list.json()}
    assert ids == {"ohms-law", "simple-pendulum", "projectile-motion", "convex-lens"}

    r_detail = client.get("/api/v1/experiments/ohms-law")
    assert r_detail.status_code == 200
    assert len(r_detail.json()["instructions"]) >= 4

    # Valid simulation
    r_sim = client.post(
        "/api/v1/experiments/ohms-law/simulate",
        json={
            "student_id": "demo-student-1",
            "parameters": {"voltage": 10.0, "resistance": 5.0},
            "save_run": True,
            "notes": "Verified linear V-I curve",
        },
    )
    assert r_sim.status_code == 200
    sim_data = r_sim.json()
    assert sim_data["run_id"] is not None
    assert sim_data["measurements"]["current"] == pytest.approx(2.0)
    assert sim_data["measurements"]["power"] == pytest.approx(20.0)

    # Zero resistance rejected
    r_bad = client.post(
        "/api/v1/experiments/ohms-law/simulate",
        json={"student_id": "demo-student-1", "parameters": {"voltage": 10.0, "resistance": 0.0}},
    )
    assert r_bad.status_code == 422

    # Progress reflects saved run
    r_prog = client.get("/api/v1/students/demo-student-1/progress")
    assert r_prog.status_code == 200
    assert r_prog.json()["experiments_completed"] == 1
    assert r_prog.json()["total_simulation_runs"] == 1


def test_quiz_flow_and_history_persistence(client: TestClient):
    r_quizzes = client.get("/api/v1/quizzes")
    assert r_quizzes.status_code == 200
    assert len(r_quizzes.json()) == 4

    r_quiz = client.get("/api/v1/quizzes/quiz-ohms-law")
    assert r_quiz.status_code == 200
    questions = r_quiz.json()["questions"]
    assert len(questions) == 5

    answers = {
        "q-ohm-1": 1,
        "q-ohm-2": 2,
        "q-ohm-3": 2,
        "q-ohm-4": 1,
        "q-ohm-5": 0,
    }
    r_submit = client.post(
        "/api/v1/quizzes/quiz-ohms-law/submit",
        json={"student_id": "demo-student-1", "answers": answers},
    )
    assert r_submit.status_code == 200
    res = r_submit.json()
    assert res["score"] == 5
    assert res["total_questions"] == 5
    assert res["percentage"] == 100.0
    assert res["passed"] is True

    r_hist = client.get("/api/v1/students/demo-student-1/history")
    assert r_hist.status_code == 200
    assert len(r_hist.json()["quiz_attempts"]) == 1
    assert len(r_hist.json()["recent_activities"]) >= 1


def test_ai_explain_and_chat_endpoints(client: TestClient):
    r_explain = client.post(
        "/api/v1/ai/explain",
        json={
            "experiment_id": "projectile-motion",
            "parameters": {"initial_velocity": 20.0, "launch_angle": 45.0, "gravity": 9.81},
            "measurements": {"horizontal_range": 40.77, "max_height": 10.19, "time_of_flight": 2.88},
            "language": "en",
        },
    )
    assert r_explain.status_code == 200
    assert r_explain.json()["fallback_used"] is True
    assert "40.77" in r_explain.json()["reply"]

    r_chat = client.post(
        "/api/v1/ai/chat",
        json={
            "experiment_id": "convex-lens",
            "question": "Why is the image real?",
            "parameters": {"object_distance": 30.0, "focal_length": 15.0},
            "measurements": {"image_distance": 30.0, "magnification": -1.0, "image_type": "Real", "image_orientation": "Inverted"},
            "language": "kn",
        },
    )
    assert r_chat.status_code == 200
    assert r_chat.json()["language"] == "kn"


def test_student_profile_update(client: TestClient):
    r_patch = client.patch(
        "/api/v1/students/demo-student-1",
        json={"name": "Riya Kulkarni", "preferred_language": "kn", "narration_enabled": False},
    )
    assert r_patch.status_code == 200
    data = r_patch.json()
    assert data["name"] == "Riya Kulkarni"
    assert data["preferred_language"] == "kn"
    assert data["narration_enabled"] is False
