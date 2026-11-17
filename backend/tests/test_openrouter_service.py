"""Unit tests for OpenRouter integration with mocked HTTP responses (no real API quota spent)."""

import httpx
import pytest

from app.core.config import Settings
from app.services.openrouter_service import OpenRouterService


def _make_settings(api_key: str = "test-secret-key", model: str = "nvidia/nemotron-3.5-lightning:free") -> Settings:
    return Settings(
        openrouter_api_key=api_key,
        openrouter_model=model,
        openrouter_base_url="https://openrouter.ai/api/v1",
        openrouter_timeout_seconds=10.0,
    )


@pytest.mark.asyncio
async def test_missing_api_key_uses_deterministic_fallback():
    service = OpenRouterService(_make_settings(api_key=""))
    result = await service.generate_response(
        experiment_id="ohms-law",
        experiment_title="Ohm's Law",
        objectives=["Verify V = I * R"],
        parameters={"voltage": 12.0, "resistance": 6.0},
        measurements={"voltage": 12.0, "resistance": 6.0, "current": 2.0, "power": 24.0},
        language="en",
    )
    assert result["provider"] == "deterministic_fallback"
    assert result["fallback_used"] is True
    assert "not configured" in result["error_notice"].lower()
    assert "2.0 A" in result["reply"]


@pytest.mark.asyncio
async def test_openrouter_success_mocked():
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        captured["auth"] = request.headers.get("Authorization")
        return httpx.Response(
            200,
            json={
                "model": "nvidia/nemotron-3.5-lightning:free",
                "choices": [
                    {
                        "message": {
                            "role": "assistant",
                            "content": "With V = 12 V and R = 6 Ω, current is 2.0 A per Ohm's Law.",
                        }
                    }
                ],
            },
        )

    transport = httpx.MockTransport(handler)
    service = OpenRouterService(_make_settings())

    async with httpx.AsyncClient(transport=transport) as client:
        result = await service.generate_response(
            experiment_id="ohms-law",
            experiment_title="Ohm's Law",
            objectives=["Verify V = I * R"],
            parameters={"voltage": 12.0, "resistance": 6.0},
            measurements={"voltage": 12.0, "resistance": 6.0, "current": 2.0, "power": 24.0},
            language="en",
            question="Why is current 2 A?",
            client=client,
        )

    assert captured["url"] == "https://openrouter.ai/api/v1/chat/completions"
    assert captured["auth"] == "Bearer test-secret-key"
    assert result["provider"] == "openrouter"
    assert result["fallback_used"] is False
    assert result["error_notice"] is None
    assert "2.0 A" in result["reply"]


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "status_code,expected_fragment",
    [
        (401, "authentication"),
        (402, "insufficient credits"),
        (404, "unavailable"),
        (429, "rate limit"),
        (503, "http 503"),
    ],
)
async def test_openrouter_error_codes_trigger_honest_fallback(status_code: int, expected_fragment: str):
    transport = httpx.MockTransport(lambda _req: httpx.Response(status_code, json={"error": "failed"}))
    service = OpenRouterService(_make_settings())

    async with httpx.AsyncClient(transport=transport) as client:
        result = await service.generate_response(
            experiment_id="simple-pendulum",
            experiment_title="Simple Pendulum",
            objectives=["Measure period"],
            parameters={"length": 1.0, "gravity": 9.81, "initial_angle": 10.0},
            measurements={"length": 1.0, "gravity": 9.81, "time_period": 2.006, "frequency": 0.4985},
            language="en",
            client=client,
        )

    assert result["provider"] == "deterministic_fallback"
    assert result["fallback_used"] is True
    assert expected_fragment in result["error_notice"].lower()
    assert "2.006" in result["reply"]


@pytest.mark.asyncio
async def test_openrouter_timeout_handled_gracefully():
    def raise_timeout(_req: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("timed out")

    transport = httpx.MockTransport(raise_timeout)
    service = OpenRouterService(_make_settings())

    async with httpx.AsyncClient(transport=transport) as client:
        result = await service.generate_response(
            experiment_id="convex-lens",
            experiment_title="ಪೀನ ಮಸೂರ",
            objectives=["Apply thin lens formula"],
            parameters={"object_distance": 30.0, "focal_length": 15.0},
            measurements={
                "object_distance_cartesian": -30.0,
                "focal_length": 15.0,
                "image_distance": 30.0,
                "magnification": -1.0,
                "image_type": "Real",
                "image_orientation": "Inverted",
            },
            language="kn",
            client=client,
        )

    assert result["fallback_used"] is True
    assert "timed out" in result["error_notice"].lower()
    assert "ಆಫ್‌ಲೈನ್ ಮಾರ್ಗದರ್ಶಿ" in result["reply"]
