"""Automated tests for Multilingual Experiment Result Explanations, AI Tutor Language Enforcement,
Translation Cache Isolation, and Explicit Failure Handling across EN, KN, HI, TE, and TA.
"""

from __future__ import annotations

import re
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import app
from app.services.openrouter_service import OpenRouterService
from app.services.result_explanation_service import (
    CONTENT_VERSION,
    generate_localized_result_explanation,
)
from app.services.translation_service import _cache_key

# Unicode script detectors proving genuine regional script output (not English prose)
SCRIPT_REGEX = {
    "kn": re.compile(r"[\u0C80-\u0CFF]{3,}"),  # Kannada
    "hi": re.compile(r"[\u0900-\u097F]{3,}"),  # Devanagari (Hindi)
    "te": re.compile(r"[\u0C00-\u0C7F]{3,}"),  # Telugu
    "ta": re.compile(r"[\u0B80-\u0BFF]{3,}"),  # Tamil
}

REVIEWED_OHMS_PHRASES = {
    "en": ("Ohm's Law", "V = I × R", "current"),
    "kn": ("ಪ್ರತಿರೋಧ", "ವಿದ್ಯುತ್ ಪ್ರವಾಹ", "V = I × R"),
    "hi": ("प्रतिरोध", "विद्युत धारा", "V = I × R"),
    "te": ("ప్రతిఘటన", "విద్యుత్ ప్రవాహం", "V = I × R"),
    "ta": ("மின்தடை", "மின்னோட்டம்", "V = I × R"),
}


def _assert_all_explanation_fields_localized(exp_obj: dict, lang: str) -> None:
    assert exp_obj["language"] == lang
    assert exp_obj["translation_available"] is True
    for field in (
        "summary",
        "observation",
        "formula_explanation",
        "interpretation",
        "conclusion",
        "real_world_application",
    ):
        text = exp_obj[field]
        assert isinstance(text, str) and len(text.strip()) > 15, f"Missing {field} for {lang}"
        if lang in SCRIPT_REGEX:
            assert SCRIPT_REGEX[lang].search(text), (
                f"Field '{field}' for '{lang}' does not contain native script: {text!r}"
            )


@pytest.mark.parametrize("lang", ["en", "kn", "hi", "te", "ta"])
def test_ohms_law_12v_4ohm_all_five_languages(lang: str) -> None:
    """Section 12 primary test: V=12 V, R=4 Ω -> I=3 A, P=36 W across all 5 languages."""
    with TestClient(app) as client:
        resp = client.post(
            "/api/v1/experiments/ohms-law/simulate",
            json={
                "student_id": "demo-student-1",
                "language": lang,
                "parameters": {"voltage": 12, "resistance": 4},
                "save_run": False,
            },
        )
        assert resp.status_code == 200
        data = resp.json()

        # 1. Exact deterministic numerical results MUST stay identical in all 5 languages
        assert data["language"] == lang
        assert data["measurements"]["voltage"] == pytest.approx(12.0, abs=1e-4)
        assert data["measurements"]["resistance"] == pytest.approx(4.0, abs=1e-4)
        assert data["measurements"]["current"] == pytest.approx(3.0, abs=1e-4)
        assert data["measurements"]["power"] == pytest.approx(36.0, abs=1e-4)
        assert data["results"]["current"]["value"] == pytest.approx(3.0, abs=1e-4)
        assert data["results"]["current"]["unit"] == "A"
        assert data["results"]["power"]["value"] == pytest.approx(36.0, abs=1e-4)
        assert data["results"]["power"]["unit"] == "W"

        # 2. All 6 dynamic explanation sections localized in native script
        exp = data["explanation"]
        _assert_all_explanation_fields_localized(exp, lang)

        # 3. Reviewed scientific terminology, formula symbols, and SI units preserved
        combined = " ".join(
            [exp["summary"], exp["observation"], exp["formula_explanation"], exp["conclusion"]]
        )
        for phrase in REVIEWED_OHMS_PHRASES[lang]:
            assert phrase in combined, f"Expected reviewed phrase '{phrase}' in {lang} explanation"
        assert "12.0 V" in combined or "12 V" in combined
        assert "4.0 Ω" in combined or "4 Ω" in combined
        assert "3.0 A" in combined or "3 A" in combined
        assert "36.0 W" in combined or "36 W" in combined

        # 4. Localized measurement labels and English original preserved separately
        if lang in SCRIPT_REGEX:
            assert SCRIPT_REGEX[lang].search(data["results"]["current"]["label"])
            assert SCRIPT_REGEX[lang].search(data["conclusion_summary"])
        assert "Ohm's Law" in exp["english_original"]["conclusion"]


@pytest.mark.parametrize("lang", ["en", "kn", "hi", "te", "ta"])
def test_validation_error_localized_for_zero_resistance(lang: str) -> None:
    """Invalid input errors (R = 0) return localized messages in all 5 languages."""
    with TestClient(app) as client:
        resp = client.post(
            "/api/v1/experiments/ohms-law/simulate",
            json={
                "student_id": "demo-student-1",
                "language": lang,
                "parameters": {"voltage": 12, "resistance": 0},
                "save_run": False,
            },
        )
        assert resp.status_code == 422
        detail = resp.json()["detail"]
        assert "0 Ω" in detail or "R" in detail
        if lang in SCRIPT_REGEX:
            assert SCRIPT_REGEX[lang].search(detail)


@pytest.mark.parametrize(
    "exp_id,params,expected_key,expected_val",
    [
        ("acids-bases-ph", {"solution_type": 0, "molarity": 0.01}, "ph", 2.0),
        ("photosynthesis", {"light_intensity": 600, "co2_ppm": 400, "temperature": 25}, "o2_evolution_rate", None),
        ("quadratic-equations", {"a": 1, "b": -5, "c": 6}, "discriminant", 1.0),
        # Universal non-hardcoded experiments proving reusable 48-experiment localization:
        ("concentration-dilution", {"initial_molarity": 2.0, "initial_volume": 50, "final_volume": 200}, "final_molarity", 0.5),
        ("differential-calculus", {"a": 1, "b": 0, "c": 0, "d": 0, "x0": 2}, "f_prime_x0", 12.0),
    ],
)
@pytest.mark.parametrize("lang", ["en", "kn", "hi", "te", "ta"])
def test_multidisciplinary_localization_across_all_subjects(
    exp_id: str, params: dict, expected_key: str, expected_val: float | None, lang: str
) -> None:
    """Verify Chemistry (pH, Dilution), Biology (Photosynthesis), and Math (Quadratic, Calculus) in all 5 languages."""
    with TestClient(app) as client:
        resp = client.post(
            f"/api/v1/experiments/{exp_id}/simulate",
            json={
                "student_id": "demo-student-1",
                "language": lang,
                "parameters": params,
                "save_run": False,
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["language"] == lang
        if expected_val is not None:
            assert data["measurements"][expected_key] == pytest.approx(expected_val, abs=0.05)
        else:
            assert data["measurements"][expected_key] > 0
        _assert_all_explanation_fields_localized(data["explanation"], lang)


@pytest.mark.parametrize("lang", ["en", "kn", "hi", "te", "ta"])
def test_ai_tutor_responds_in_selected_language(lang: str) -> None:
    """AI Tutor (deterministic fallback + suggested questions) respects all 5 languages."""
    with TestClient(app) as client:
        resp = client.post(
            "/api/v1/ai/explain",
            json={
                "experiment_id": "ohms-law",
                "language": lang,
                "parameters": {"voltage": 12, "resistance": 4},
                "measurements": {"voltage": 12, "resistance": 4, "current": 3, "power": 36},
                "student_id": "demo-student-1",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["language"] == lang
        assert "3" in data["reply"] and "36" in data["reply"]
        if lang in SCRIPT_REGEX:
            assert SCRIPT_REGEX[lang].search(data["reply"])
            assert any(SCRIPT_REGEX[lang].search(q) for q in data["suggested_questions"])


@pytest.mark.asyncio
async def test_openrouter_prompt_enforces_selected_language() -> None:
    """Verify live OpenRouter request explicitly enforces the student's selected language."""
    settings = Settings(openrouter_api_key="sk-or-test-key", openrouter_model="test/model:free")
    svc = OpenRouterService(settings=settings)

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "model": "test/model:free",
        "choices": [
            {
                "message": {
                    "content": "ಪ್ರತಿರೋಧ ಸ್ಥಿರವಾಗಿರುವಾಗ ವೋಲ್ಟೇಜ್ ಹೆಚ್ಚಾದಂತೆ ವಿದ್ಯುತ್ ಪ್ರವಾಹ I = 3 A ಆಗುತ್ತದೆ."
                }
            }
        ],
    }
    mock_client = AsyncMock()
    mock_client.post.return_value = mock_resp

    res = await svc.generate_response(
        experiment_id="ohms-law",
        experiment_title="Ohm's Law",
        objectives=["Verify V = I * R"],
        parameters={"voltage": 12, "resistance": 4},
        measurements={"voltage": 12, "resistance": 4, "current": 3, "power": 36},
        language="kn",
        client=mock_client,
    )
    assert res["fallback_used"] is False
    assert SCRIPT_REGEX["kn"].search(res["reply"])
    sent_payload = mock_client.post.call_args.kwargs["json"]
    system_msgs = " ".join(m["content"] for m in sent_payload["messages"] if m["role"] == "system")
    assert "Kannada" in system_msgs
    assert "Do NOT switch to English" in system_msgs


@pytest.mark.asyncio
async def test_translation_failure_never_silently_labels_english_as_regional() -> None:
    """Explicit failure sets translation_available=False and keeps English separate."""
    res = await generate_localized_result_explanation(
        None,
        experiment_id="ohms-law",
        experiment_title="Ohm's Law",
        discipline="Physics",
        difficulty="Basic",
        language="hi",
        parameters={"voltage": 12, "resistance": 4},
        measurements={"voltage": 12, "resistance": 4, "current": 3, "power": 36},
        formatted_measurements=[],
        formulas=["V = I * R"],
        conclusion_en="At V = 12 V and R = 4 Ω, I = 3 A.",
        force_translation_failure=True,
    )
    assert res["translation_available"] is False
    assert res["provider"] == "translation_unavailable"
    assert res["summary"] == ""  # Never falsely masquerades English as Hindi
    assert res["error_notice"] is not None
    assert SCRIPT_REGEX["hi"].search(res["error_notice"])
    assert "3 A" in res["english_original"]["conclusion"]


def test_translation_cache_keys_isolate_languages_and_versions() -> None:
    """Cache keys must strictly separate source/target languages and content versions."""
    sample = "At V = 12 V and R = 4 Ω, I = 3 A."
    k_kn = _cache_key("en", "kn", sample, CONTENT_VERSION)
    k_hi = _cache_key("en", "hi", sample, CONTENT_VERSION)
    k_te = _cache_key("en", "te", sample, CONTENT_VERSION)
    k_ta = _cache_key("en", "ta", sample, CONTENT_VERSION)
    k_kn_old = _cache_key("en", "kn", sample, "v1")
    assert len({k_kn, k_hi, k_te, k_ta, k_kn_old}) == 5


@pytest.mark.parametrize("lang", ["en", "kn", "hi", "ta", "te"])
def test_ai_explain_current_results_ohms_law_12v_20ohm_all_five_languages(lang: str) -> None:
    """Section 10 test: V=12 V, R=20 Ω, I=0.6 A, P=7.2 W via POST /api/v1/ai/explain in all 5 languages."""
    with TestClient(app) as client:
        resp = client.post(
            "/api/v1/ai/explain",
            json={
                "experiment_id": "ohms-law",
                "language": lang,
                "parameters": {"voltage": 12, "resistance": 20},
                "results": {"voltage": 12, "resistance": 20, "current": 0.6, "power": 7.2},
                "mode": "explain",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["language"] == lang
        explanation = data["explanation"]
        assert explanation == data["reply"]
        # Exact computed numbers & SI units preserved
        assert "12 V" in explanation and "20 Ω" in explanation
        assert "0.6 A" in explanation and "7.2 W" in explanation
        assert "V = I × R" in explanation
        # All 7 structured sections present
        for sec_num in ("1.", "2.", "3.", "4.", "5.", "6.", "7."):
            assert sec_num in explanation
        # Native script verification for regional languages
        if lang in SCRIPT_REGEX:
            assert SCRIPT_REGEX[lang].search(explanation)


@pytest.mark.parametrize("mode", ["explain", "hint", "practice", "simplify"])
def test_ai_explain_updates_on_parameter_change_and_supports_all_modes(mode: str) -> None:
    """Verify Explain/Hint/Practice/Simplify modes & dynamic regeneration when values change."""
    with TestClient(app) as client:
        resp = client.post(
            "/api/v1/ai/explain",
            json={
                "experiment_id": "ohms-law",
                "language": "kn",
                "parameters": {"voltage": 24, "resistance": 10},
                "measurements": {"voltage": 24, "resistance": 10, "current": 2.4, "power": 57.6},
                "mode": mode,
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["language"] == "kn"
        assert "2.4 A" in data["explanation"]
        assert "57.6 W" in data["explanation"]
        assert SCRIPT_REGEX["kn"].search(data["explanation"])
