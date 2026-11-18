"""Tests for 3-tier AI provider routing (OpenRouter -> Local LLM -> Deterministic),
session conversation memory, 5-language follow-up Q&A, and multi-provider Regional TTS.
"""

from __future__ import annotations

import base64
import re
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import app
from app.services.local_llm_service import LocalLlmService
from app.services.openrouter_service import OpenRouterService
from app.services.tts_service import (
    TtsError,
    prepare_text_for_tts,
    resolve_cached_audio_path,
    split_text_chunks,
    synthesize_speech,
)

SCRIPT_REGEX = {
    "kn": re.compile(r"[\u0C80-\u0CFF]{3,}"),
    "hi": re.compile(r"[\u0900-\u097F]{3,}"),
    "ta": re.compile(r"[\u0B80-\u0BFF]{3,}"),
    "te": re.compile(r"[\u0C00-\u0C7F]{3,}"),
}

PH_QUESTIONS = {
    "en": "Why did the pH value decrease when I increased the acid concentration?",
    "kn": "ಆಮ್ಲದ ಸಾಂದ್ರತೆಯನ್ನು ಹೆಚ್ಚಿಸಿದಾಗ pH ಮೌಲ್ಯ ಏಕೆ ಕಡಿಮೆಯಾಯಿತು?",
    "hi": "अम्ल की सांद्रता बढ़ाने पर pH का मान क्यों कम हुआ?",
    "ta": "அமிலத்தின் செறிவை அதிகரிக்கும்போது pH மதிப்பு ஏன் குறைகிறது?",
    "te": "ఆమ్లం గాఢత పెరిగినప్పుడు pH విలువ ఎందుకు తగ్గుతుంది?",
}


def test_ai_providers_and_speech_config_endpoints() -> None:
    with TestClient(app) as client:
        r_ai = client.get("/api/v1/ai/providers")
        assert r_ai.status_code == 200
        ai_data = r_ai.json()
        assert ai_data["priority"] == ["openrouter", "local", "deterministic_fallback"]
        assert "local" in ai_data["providers"]
        assert "recommended_model" in ai_data["providers"]["local"]
        assert ai_data["tts"]["provider"] == "edge"
        assert ai_data["tts"]["available"] is True

        r_sp = client.get("/api/v1/speech/config")
        assert r_sp.status_code == 200
        sp_data = r_sp.json()
        assert sp_data["server_tts_available"] is True
        assert sp_data["tts_provider"] == "edge"
        for code in ("en", "kn", "hi", "ta", "te"):
            assert code in sp_data["tts_voices"]


@pytest.mark.parametrize("lang", ["en", "kn", "hi", "ta", "te"])
def test_five_language_followup_conversation_with_session_memory(lang: str) -> None:
    """Test real follow-up questions in EN/KN/HI/TA/TE with conversation_id & message alias."""
    with TestClient(app) as client:
        cid = f"session-ph-{lang}"
        # Turn 1: Ask why pH decreased
        r1 = client.post(
            "/api/v1/ai/chat",
            json={
                "conversation_id": cid,
                "experiment_id": "acids-bases-ph",
                "language": lang,
                "message": PH_QUESTIONS[lang],
                "parameters": {"solution_type": 0, "molarity": 0.01},
                "simulation_results": {"ph": 2.0, "poh": 12.0, "h_concentration": "1.00e-2"},
            },
        )
        assert r1.status_code == 200
        d1 = r1.json()
        assert d1["success"] is True
        assert d1["conversation_id"] == cid
        assert d1["conversation_turns"] >= 2
        assert d1["language"] == lang
        assert "2.0" in d1["reply"] and "12.0" in d1["reply"]
        if lang in SCRIPT_REGEX:
            assert SCRIPT_REGEX[lang].search(d1["reply"])

        # Turn 2: Change simulation values (molarity 0.1 -> pH 1.0) and verify updated measurement is used
        r2 = client.post(
            "/api/v1/ai/chat",
            json={
                "conversation_id": cid,
                "experiment_id": "acids-bases-ph",
                "language": lang,
                "message": PH_QUESTIONS[lang],
                "parameters": {"solution_type": 0, "molarity": 0.1},
                "simulation_results": {"ph": 1.0, "poh": 13.0, "h_concentration": "1.00e-1"},
            },
        )
        assert r2.status_code == 200
        d2 = r2.json()
        assert d2["conversation_turns"] >= 4
        assert "1.0" in d2["reply"] and "13.0" in d2["reply"]


@pytest.mark.asyncio
async def test_local_llm_provider_tier_takes_over_when_openrouter_unconfigured() -> None:
    """Verify Tier-2 Local LLM routing when OpenRouter is off and local llama-server responds."""
    cfg = Settings(
        openrouter_api_key="",
        local_llm_enabled="true",
        local_llm_backend="openai_compat",
        local_llm_server_url="http://127.0.0.1:8080/v1",
        local_llm_model_name="Qwen2.5-1.5B-Instruct-Q4_K_M",
    )
    local_svc = LocalLlmService(settings=cfg)

    async def fake_generate_chat(*, messages, max_tokens=512, temperature=0.4, client=None):
        # Verify updated simulation context reached local LLM
        sys_text = " ".join(m["content"] for m in messages if m["role"] == "system")
        assert "Tamil" in sys_text
        assert '"ph": 2.0' in sys_text
        return {
            "reply": "அமிலத்தின் செறிவு அதிகரிப்பதால் [H+] அதிகரித்து pH = 2.0 ஆகக் குறைகிறது.",
            "model": "Qwen2.5-1.5B-Instruct-Q4_K_M",
            "backend": "openai_compat",
            "latency_ms": 142.5,
            "load_time_ms": 0.0,
        }

    local_svc.generate_chat = fake_generate_chat  # type: ignore[method-assign]
    router_svc = OpenRouterService(settings=cfg, local_llm=local_svc)

    res = await router_svc.generate_response(
        experiment_id="acids-bases-ph",
        experiment_title="Acids and Bases",
        objectives=["Understand pH"],
        parameters={"solution_type": 0, "molarity": 0.01},
        measurements={"ph": 2.0, "poh": 12.0},
        language="ta",
        question=PH_QUESTIONS["ta"],
        conversation_id="local-ta-session",
    )
    assert res["provider"] == "local"
    assert res["fallback_used"] is False
    assert res["conversation_id"] == "local-ta-session"
    assert SCRIPT_REGEX["ta"].search(res["reply"])


def test_tts_text_preprocessing_chunking_and_path_safety() -> None:
    raw = "**1. Summary:** At `V = 12 V` and R = 20 Ω, CO₂ rises at 25 °C ⇒ I = 0.6 A."
    cleaned_en = prepare_text_for_tts(raw, "en")
    assert "**" not in cleaned_en and "`" not in cleaned_en
    assert "ohms" in cleaned_en
    assert "degrees Celsius" in cleaned_en
    assert "CO2" in cleaned_en

    cleaned_kn = prepare_text_for_tts("**ವೋಲ್ಟೇಜ್** 12 V, R = 20 Ω", "kn")
    assert "**" not in cleaned_kn
    assert "ಓಂ" in cleaned_kn
    assert SCRIPT_REGEX["kn"].search(cleaned_kn)

    long_text = " ".join(["This is a scientific sentence."] * 30)
    chunks = split_text_chunks(long_text, max_chars=200)
    assert len(chunks) > 2
    assert all(len(c) <= 200 for c in chunks)

    # Path traversal must be rejected
    assert resolve_cached_audio_path("../labxai.db") is None
    assert resolve_cached_audio_path("nothex.mp3") is None


@pytest.mark.asyncio
async def test_cloud_tts_providers_sarvam_azure_google_mocked() -> None:
    """Verify Sarvam AI, Azure Speech, and Google Cloud TTS adapters + disabled error handling."""
    fake_wav = b"RIFF" + b"\x00" * 400
    fake_mp3 = b"ID3" + b"\x00" * 400

    # 1. Sarvam AI mocked
    mock_sarvam_resp = MagicMock()
    mock_sarvam_resp.status_code = 200
    mock_sarvam_resp.json.return_value = {"audios": [base64.b64encode(fake_wav).decode()]}
    mock_client = AsyncMock()
    mock_client.post.return_value = mock_sarvam_resp

    cfg_sarvam = Settings(tts_provider="sarvam", tts_api_key="test-sarvam-key")
    res_s = await synthesize_speech(text="வணக்கம் pH = 2", language="ta", speed=1.0, settings=cfg_sarvam, client=mock_client)
    assert res_s["success"] is True and res_s["provider"] == "sarvam" and res_s["content_type"] == "audio/wav"

    # 2. Azure Speech mocked
    mock_azure_resp = MagicMock()
    mock_azure_resp.status_code = 200
    mock_azure_resp.content = fake_mp3
    mock_client.post.return_value = mock_azure_resp
    cfg_azure = Settings(tts_provider="azure", tts_api_key="test-azure-key", tts_region="centralindia")
    res_a = await synthesize_speech(text="నమస్కారం V = 12 V", language="te", speed=1.25, settings=cfg_azure, client=mock_client)
    assert res_a["success"] is True and res_a["provider"] == "azure" and res_a["content_type"] == "audio/mpeg"

    # 3. Google Cloud TTS mocked
    mock_google_resp = MagicMock()
    mock_google_resp.status_code = 200
    mock_google_resp.json.return_value = {"audioContent": base64.b64encode(fake_mp3).decode()}
    mock_client.post.return_value = mock_google_resp
    cfg_google = Settings(tts_provider="google", tts_api_key="test-google-key")
    res_g = await synthesize_speech(text="नमस्ते I = 0.6 A", language="hi", speed=1.0, settings=cfg_google, client=mock_client)
    assert res_g["success"] is True and res_g["provider"] == "google"

    # 4. Disabled provider raises explicit TtsError
    cfg_off = Settings(tts_provider="disabled")
    with pytest.raises(TtsError):
        await synthesize_speech(text="Hello", language="en", settings=cfg_off)
