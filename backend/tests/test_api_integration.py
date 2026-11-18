"""End-to-end FastAPI endpoint, multidisciplinary catalog, translation, video, quiz, and SQLite tests."""

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


def test_v1_health_languages_and_speech_config(client: TestClient):
    r_health = client.get("/api/v1/health")
    assert r_health.status_code == 200
    assert r_health.json()["database"] == "connected"

    r_lang = client.get("/api/v1/languages")
    assert r_lang.status_code == 200
    langs = r_lang.json()["languages"]
    codes = {lang["code"] for lang in langs}
    assert codes == {"en", "kn", "hi", "te", "ta"}
    assert all(lang["status"] == "supported" and lang["ui_translated"] for lang in langs)

    r_speech = client.get("/api/v1/speech/config")
    assert r_speech.status_code == 200
    assert len(r_speech.json()["locales"]) == 5


def test_subjects_and_48_experiment_catalog(client: TestClient):
    r_subjs = client.get("/api/v1/subjects")
    assert r_subjs.status_code == 200
    subjs = r_subjs.json()
    assert [s["name"] for s in subjs] == ["Physics", "Chemistry", "Biology", "Mathematics"]
    expected_counts = {"Physics": 12, "Chemistry": 13, "Biology": 14, "Mathematics": 12}
    for s in subjs:
        assert s["experiment_count"] == expected_counts[s["name"]]

    r_list = client.get("/api/v1/experiments")
    assert r_list.status_code == 200
    exps = r_list.json()
    assert len(exps) == 51
    ids = {exp["id"] for exp in exps}
    assert {"ohms-law", "simple-pendulum", "projectile-motion", "convex-lens", "human-respiratory-system", "human-nervous-system", "chemical-reaction-playground"}.issubset(ids)

    # Filter by subject & difficulty (including Beginner -> Basic alias)
    r_chem_adv = client.get("/api/v1/experiments?subject=Chemistry&difficulty=Advanced")
    assert r_chem_adv.status_code == 200
    assert len(r_chem_adv.json()) == 4

    r_bio_basic = client.get("/api/v1/experiments?subject=Biology&difficulty=Beginner")
    assert r_bio_basic.status_code == 200
    assert len(r_bio_basic.json()) == 5


def test_simulation_persistence_and_subject_progress(client: TestClient):
    r_detail = client.get("/api/v1/experiments/ohms-law")
    assert r_detail.status_code == 200
    detail = r_detail.json()
    assert len(detail["instructions"]) >= 4
    assert len(detail["real_world_applications"]) >= 2
    assert len(detail["common_mistakes"]) >= 2

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

    # Progress reflects saved run and subject breakdown
    r_prog = client.get("/api/v1/students/demo-student-1/progress")
    assert r_prog.status_code == 200
    prog = r_prog.json()
    assert prog["experiments_completed"] == 1
    assert prog["total_simulation_runs"] == 1
    assert len(prog["subject_progress"]) == 4
    phys_prog = next(sp for sp in prog["subject_progress"] if sp["subject"] == "Physics")
    assert phys_prog["completed_experiments"] == 1


def test_quiz_flow_mcq_and_numerical_grading(client: TestClient):
    r_quizzes = client.get("/api/v1/quizzes")
    assert r_quizzes.status_code == 200
    assert len(r_quizzes.json()) == 48

    # Original preserved MCQ quiz
    r_quiz = client.get("/api/v1/quizzes/quiz-ohms-law")
    assert r_quiz.status_code == 200
    assert len(r_quiz.json()["questions"]) == 5

    r_submit = client.post(
        "/api/v1/quizzes/quiz-ohms-law/submit",
        json={
            "student_id": "demo-student-1",
            "answers": {"q-ohm-1": 1, "q-ohm-2": 2, "q-ohm-3": 2, "q-ohm-4": 1, "q-ohm-5": 0},
        },
    )
    assert r_submit.status_code == 200
    res = r_submit.json()
    assert res["score"] == 5
    assert res["percentage"] == 100.0
    assert res["passed"] is True

    # Multidisciplinary quiz with Numerical + True/False + MCQ questions
    r_chem_submit = client.post(
        "/api/v1/quizzes/quiz-acids-bases-ph/submit",
        json={
            "student_id": "demo-student-1",
            "answers": {"q-ph-1": 2.0, "q-ph-2": 3.0, "q-ph-3": 2, "q-ph-4": 0},
        },
    )
    assert r_chem_submit.status_code == 200
    chem_res = r_chem_submit.json()
    assert chem_res["score"] == 4
    assert chem_res["passed"] is True

    r_hist = client.get("/api/v1/students/demo-student-1/history")
    assert r_hist.status_code == 200
    assert len(r_hist.json()["quiz_attempts"]) == 2


def test_videos_and_translation_endpoints(client: TestClient):
    r_vids = client.get("/api/v1/videos")
    assert r_vids.status_code == 200
    vids = r_vids.json()
    assert len(vids) >= 30

    r_math_vids = client.get("/api/v1/videos?subject=Mathematics")
    assert r_math_vids.status_code == 200
    assert len(r_math_vids.json()) >= 8

    r_rec = client.get("/api/v1/videos/recommendations?experiment_id=ohms-law")
    assert r_rec.status_code == 200
    assert r_rec.json()[0]["experiment_id"] == "ohms-law"

    # Translation preserves scientific formulas & units and caches on second call
    payload = {
        "text": "By Ohm's law V = I × R, a 12 V supply across 6 Ω yields 2 A.",
        "source_lang": "en",
        "target_lang": "kn",
        "preserve_scientific_terms": True,
    }
    r_t1 = client.post("/api/v1/translate", json=payload)
    assert r_t1.status_code == 200
    t1 = r_t1.json()
    assert "V = I × R" in t1["translated_text"]
    assert "12 V" in t1["translated_text"]
    assert t1["cached"] is False

    r_t2 = client.post("/api/v1/translate", json=payload)
    assert r_t2.status_code == 200
    assert r_t2.json()["cached"] is True


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
            "experiment_id": "differential-calculus",
            "question": "Explain the slope at x0=2.",
            "parameters": {"a": 1.0, "b": -3.0, "c": 2.0, "d": 1.0, "x0": 2.0},
            "measurements": {},
            "language": "hi",
            "mode": "hint",
        },
    )
    assert r_chat.status_code == 200
    assert r_chat.json()["language"] == "hi"
    assert "अवकलज f′(x₀) = 2.0" in r_chat.json()["reply"]


def test_student_profile_update(client: TestClient):
    r_patch = client.patch(
        "/api/v1/students/demo-student-1",
        json={"name": "Riya Kulkarni", "preferred_language": "ta", "narration_enabled": False},
    )
    assert r_patch.status_code == 200
    data = r_patch.json()
    assert data["name"] == "Riya Kulkarni"
    assert data["preferred_language"] == "ta"
    assert data["narration_enabled"] is False
