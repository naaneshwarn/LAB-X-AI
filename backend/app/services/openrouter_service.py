"""OpenRouter AI integration service with strict server-side credentials and deterministic fallback."""

from __future__ import annotations

import json
from typing import Any

import httpx

from app.core.config import Settings, get_settings
from app.core.security import sanitize_text

LABXAI_SYSTEM_PROMPT = """You are LabXAI, an educational science laboratory tutor.

You explain scientific concepts accurately and in a student-friendly way.

You receive structured information about the current experiment.

Use the provided simulation measurements as the source of truth.

Never fabricate measurements.

Never change the simulation's calculated values.

Explain:
- What the student did.
- What happened.
- Why it happened.
- The relevant scientific principle.
- How the measurements support the principle.
- Common mistakes.
- A practical real-world application.

Use clear language appropriate for students.

When the student asks a question, answer using the experiment context.

If information is missing, say so rather than inventing it.

Do not claim that an experiment was performed physically. These are virtual simulations."""

LANGUAGE_INSTRUCTIONS: dict[str, str] = {
    "en": "Respond in clear, student-friendly English.",
    "kn": (
        "Respond primarily in clear, accurate Kannada (ಕನ್ನಡ) suitable for science students. "
        "Keep standard SI units, formulas, and numeric values exact."
    ),
    "hi": (
        "Respond in clear, student-friendly Hindi (हिन्दी). Keep standard SI units and numeric values exact."
    ),
    "te": (
        "Respond in clear, student-friendly Telugu (తెలుగు). Keep standard SI units and numeric values exact."
    ),
    "ta": (
        "Respond in clear, student-friendly Tamil (தமிழ்). Keep standard SI units and numeric values exact."
    ),
}

SUGGESTED_QUESTIONS_BY_EXP: dict[str, dict[str, list[str]]] = {
    "ohms-law": {
        "en": [
            "Why did the current change with my voltage and resistance settings?",
            "How does power depend on resistance when voltage is fixed?",
            "What would happen if resistance approached zero?",
        ],
        "kn": [
            "ವೋಲ್ಟೇಜ್ ಮತ್ತು ರೋಧ ಬದಲಾದಾಗ ವಿದ್ಯುತ್ ಪ್ರವಾಹ ಏಕೆ ಬದಲಾಯಿತು?",
            "ವೋಲ್ಟೇಜ್ ಸ್ಥಿರವಾಗಿದ್ದಾಗ ಶಕ್ತಿಯು ರೋಧದ ಮೇಲೆ ಹೇಗೆ ಅವಲಂಬಿತವಾಗಿದೆ?",
            "ರೋಧವು ಶೂನ್ಯಕ್ಕೆ ಹತ್ತಿರವಾದರೆ ಏನಾಗುತ್ತದೆ?",
        ],
    },
    "simple-pendulum": {
        "en": [
            "Why doesn't the bob's mass appear in the pendulum formula?",
            "How would this pendulum behave on the Moon?",
            "When does the small-angle approximation start losing accuracy?",
        ],
        "kn": [
            "ಲೋಲಕದ ಸೂತ್ರದಲ್ಲಿ ಬಾಬ್‌ನ ದ್ರವ್ಯರಾಶಿ ಏಕೆ ಬರುವುದಿಲ್ಲ?",
            "ಈ ಲೋಲಕವು ಚಂದ್ರನ ಮೇಲೆ ಹೇಗೆ ವರ್ತಿಸುತ್ತದೆ?",
            "ಸಣ್ಣ-ಕೋನ ಸನ್ನಿಹಿತವು ಯಾವಾಗ ನಿಖರತೆಯನ್ನು ಕಳೆದುಕೊಳ್ಳುತ್ತದೆ?",
        ],
    },
    "projectile-motion": {
        "en": [
            "Why is 45° the optimal angle for maximum range?",
            "Why is vertical velocity zero at the apex while acceleration is not?",
            "How would air resistance alter my simulated range?",
        ],
        "kn": [
            "ಗರಿಷ್ಠ ವ್ಯಾಪ್ತಿಗೆ 45° ಏಕೆ ಅತ್ಯುತ್ತಮ ಕೋನವಾಗಿದೆ?",
            "ತುತ್ತತುದಿಯಲ್ಲಿ ಲಂಬ ವೇಗ ಶೂನ್ಯವಾಗಿದ್ದರೂ ವೇಗೋತ್ಕರ್ಷ ಏಕೆ ಶೂನ್ಯವಲ್ಲ?",
            "ಗಾಳಿಯ ಪ್ರತಿರೋಧವು ನನ್ನ ಸಿಮ್ಯುಲೇಶನ್ ವ್ಯಾಪ್ತಿಯನ್ನು ಹೇಗೆ ಬದಲಾಯಿಸುತ್ತದೆ?",
        ],
    },
    "convex-lens": {
        "en": [
            "Why does the sign of image distance v flip when |u| < f?",
            "What happens physically when the object is placed at the focal point?",
            "How does a camera lens differ from a magnifying glass using this equation?",
        ],
        "kn": [
            "|u| < f ಆದಾಗ ಪ್ರತಿಬಿಂಬ ದೂರ v ಯ ಚಿಹ್ನೆ ಏಕೆ ಬದಲಾಗುತ್ತದೆ?",
            "ವಸ್ತುವನ್ನು ನಾಭಿಬಿಂದುವಿನಲ್ಲಿ ಇರಿಸಿದಾಗ ಏನಾಗುತ್ತದೆ?",
            "ಕ್ಯಾಮೆರಾ ಮಸೂರ ಮತ್ತು ಭೂತಗನ್ನಡಿಯ ನಡುವಿನ ವ್ಯತ್ಯಾಸವೇನು?",
        ],
    },
}


def get_suggested_questions(experiment_id: str, language: str = "en") -> list[str]:
    exp_map = SUGGESTED_QUESTIONS_BY_EXP.get(experiment_id, {})
    return exp_map.get(language) or exp_map.get("en") or [
        "What scientific principle explains these measurements?",
        "What common mistakes should I avoid in this experiment?",
        "Where is this principle applied in real life?",
    ]


def build_deterministic_fallback(
    experiment_id: str,
    experiment_title: str,
    parameters: dict[str, Any],
    measurements: dict[str, Any],
    language: str,
    question: str | None = None,
) -> str:
    """Generate a scientifically accurate fallback explanation from authoritative measurements."""
    lang = language if language in ("en", "kn") else "en"

    if experiment_id == "ohms-law":
        v = measurements.get("voltage", parameters.get("voltage", "N/A"))
        r = measurements.get("resistance", parameters.get("resistance", "N/A"))
        i = measurements.get("current", "N/A")
        p = measurements.get("power", "N/A")
        if lang == "kn":
            return (
                f"**{experiment_title} — ಸಿಮ್ಯುಲೇಶನ್ ವಿಶ್ಲೇಷಣೆ (ಆಫ್‌ಲೈನ್ ಮಾರ್ಗದರ್ಶಿ)**\n\n"
                f"- **ನೀವು ಏನು ಮಾಡಿದ್ದೀರಿ:** ವರ್ಚುವಲ್ ಮಂಡಲದಲ್ಲಿ ವೋಲ್ಟೇಜ್ V = {v} V ಮತ್ತು ರೋಧ R = {r} Ω ನಿಗದಿಪಡಿಸಿದ್ದೀರಿ.\n"
                f"- **ಏನು ನಡೆಯಿತು:** ಲೆಕ್ಕಹಾಕಿದ ವಿದ್ಯುತ್ ಪ್ರವಾಹ I = {i} A ಮತ್ತು ವ್ಯಯವಾದ ಶಕ್ತಿ P = {p} W.\n"
                f"- **ವೈಜ್ಞಾನಿಕ ತತ್ವ (ಓಮ್ ನಿಯಮ):** ಸ್ಥಿರ ತಾಪಮಾನದಲ್ಲಿ V = I × R. ವೋಲ್ಟೇಜ್ ಹೆಚ್ಚಾದಂತೆ ಪ್ರವಾಹ ಹೆಚ್ಚಾಗುತ್ತದೆ ಮತ್ತು ರೋಧ ಹೆಚ್ಚಾದಂತೆ ಪ್ರವಾಹ ಕಡಿಮೆಯಾಗುತ್ತದೆ.\n"
                f"- **ಸಾಮಾನ್ಯ ತಪ್ಪುಗಳು:** ರೋಧವನ್ನು 0 Ω ಇಡುವುದು (ಶಾರ್ಟ್ ಸರ್ಕ್ಯೂಟ್) ಅಥವಾ ಆಮ್ಮೀಟರ್ ಅನ್ನು ಸಮಾನಾಂತರವಾಗಿ ಜೋಡಿಸುವುದು.\n"
                f"- **ನೈಜ ಜೀವನದ ಬಳಕೆ:** ಎಲ್‌ಇಡಿ (LED) ಸುರಕ್ಷತಾ ರೋಧಕಗಳು, ವಿದ್ಯುತ್ ಹೀಟರ್‌ಗಳು ಮತ್ತು ಮನೆಯ ಸರ್ಕ್ಯೂಟ್ ವಿನ್ಯಾಸ."
            )
        q_prefix = f"Regarding your question (\"{question}\"):\n\n" if question else ""
        return (
            f"{q_prefix}**{experiment_title} — Deterministic Lab Analysis**\n\n"
            f"- **What you did:** In this virtual circuit simulation, you set supply voltage **V = {v} V** and resistance **R = {r} Ω**.\n"
            f"- **What happened:** The circuit produced an electric current of **I = {i} A** and dissipated **P = {p} W** of power.\n"
            f"- **Why & Scientific Principle:** According to Ohm's Law (`V = I × R`), current rises linearly with voltage and decreases inversely with resistance. Your measured values confirm `I = {v} / {r} = {i} A` and `P = V × I = {p} W`.\n"
            f"- **Common mistakes:** Confusing series vs. parallel meter connections (ammeters go in series; voltmeters in parallel) or forgetting that zero resistance causes an idealized short circuit.\n"
            f"- **Real-world application:** Choosing current-limiting resistors for LEDs, sizing fuses, and designing safe household electrical circuits."
        )

    if experiment_id == "simple-pendulum":
        l_val = measurements.get("length", parameters.get("length", "N/A"))
        g_val = measurements.get("gravity", parameters.get("gravity", "N/A"))
        t_val = measurements.get("time_period", "N/A")
        f_val = measurements.get("frequency", "N/A")
        ang = measurements.get("initial_angle", parameters.get("initial_angle", "N/A"))
        dev = measurements.get("large_angle_deviation_percent", 0)
        if lang == "kn":
            return (
                f"**{experiment_title} — ಸಿಮ್ಯುಲೇಶನ್ ವಿಶ್ಲೇಷಣೆ (ಆಫ್‌ಲೈನ್ ಮಾರ್ಗದರ್ಶಿ)**\n\n"
                f"- **ನೀವು ಏನು ಮಾಡಿದ್ದೀರಿ:** ಉದ್ದ L = {l_val} m, ಗುರುತ್ವ g = {g_val} m/s² ಮತ್ತು ಕೋನ θ₀ = {ang}° ಹೊಂದಿಸಿದ್ದೀರಿ.\n"
                f"- **ಏನು ನಡೆಯಿತು:** ಸಣ್ಣ-ಕೋನ ಆವರ್ತನ ಕಾಲ T = {t_val} s ಮತ್ತು ಆವೃತ್ತಿ f = {f_val} Hz (ದೊಡ್ಡ ಕೋನ ವ್ಯತ್ಯಾಸ: {dev}%).\n"
                f"- **ವೈಜ್ಞಾನಿಕ ತತ್ವ:** T = 2π√(L/g). ಆವರ್ತನ ಕಾಲವು ಉದ್ದದ ವರ್ಗಮೂಲಕ್ಕೆ ನೇರಾನುಪಾತದಲ್ಲಿಯೂ, ಗುರುತ್ವದ ವರ್ಗಮೂಲಕ್ಕೆ ವಿಲೋಮಾನುಪಾತದಲ್ಲಿಯೂ ಇರುತ್ತದೆ.\n"
                f"- **ಸಾಮಾನ್ಯ ತಪ್ಪುಗಳು:** ಬಾಬ್‌ನ ದ್ರವ್ಯರಾಶಿ ಆವರ್ತನ ಕಾಲವನ್ನು ಬದಲಿಸುತ್ತದೆ ಎಂದು ಭಾವಿಸುವುದು.\n"
                f"- **ನೈಜ ಜೀವನದ ಬಳಕೆ:** ಲೋಲಕ ಗಡಿಯಾರಗಳು, ಭೂಕಂಪಮಾಪಕಗಳು (seismometers) ಮತ್ತು ಸ್ಥಳೀಯ ಗುರುತ್ವ ಅಳತೆ."
            )
        q_prefix = f"Regarding your question (\"{question}\"):\n\n" if question else ""
        return (
            f"{q_prefix}**{experiment_title} — Deterministic Lab Analysis**\n\n"
            f"- **What you did:** You configured a virtual pendulum with length **L = {l_val} m**, gravity **g = {g_val} m/s²**, and initial release angle **θ₀ = {ang}°**.\n"
            f"- **What happened:** The small-angle period is **T = {t_val} s** (frequency **f = {f_val} Hz**), with a large-angle deviation of **{dev}%**.\n"
            f"- **Why & Scientific Principle:** Under `T = 2π√(L/g)`, gravity provides the restoring torque proportional to `sin(θ) ≈ θ`. Increasing length slows oscillations by `√L`, while stronger gravity speeds them up.\n"
            f"- **Common mistakes:** Assuming heavier bobs swing faster (mass cancels out) or applying `T = 2π√(L/g)` blindly at very large angles without noting the correction.\n"
            f"- **Real-world application:** Mechanical pendulum clocks, metronomes, and measuring local gravitational acceleration."
        )

    if experiment_id == "projectile-motion":
        u_val = measurements.get("initial_velocity", parameters.get("initial_velocity", "N/A"))
        ang = measurements.get("launch_angle", parameters.get("launch_angle", "N/A"))
        g_val = measurements.get("gravity", parameters.get("gravity", "N/A"))
        tof = measurements.get("time_of_flight", "N/A")
        h_max = measurements.get("max_height", "N/A")
        rng = measurements.get("horizontal_range", "N/A")
        if lang == "kn":
            return (
                f"**{experiment_title} — ಸಿಮ್ಯುಲೇಶನ್ ವಿಶ್ಲೇಷಣೆ (ಆಫ್‌ಲೈನ್ ಮಾರ್ಗದರ್ಶಿ)**\n\n"
                f"- **ನೀವು ಏನು ಮಾಡಿದ್ದೀರಿ:** ವೇಗ u = {u_val} m/s, ಕೋನ θ = {ang}° ಮತ್ತು ಗುರುತ್ವ g = {g_val} m/s² ನಲ್ಲಿ ಉಡಾವಣೆ ಮಾಡಿದ್ದೀರಿ.\n"
                f"- **ಏನು ನಡೆಯಿತು:** ಗರಿಷ್ಠ ಎತ್ತರ H = {h_max} m, ಅಡ್ಡ ವ್ಯಾಪ್ತಿ R = {rng} m, ಮತ್ತು ಹಾರಾಟದ ಸಮಯ T = {tof} s.\n"
                f"- **ವೈಜ್ಞಾನಿಕ ತತ್ವ:** ಅಡ್ಡ ವೇಗ ಸ್ಥಿರವಾಗಿರುತ್ತದೆ (u cos θ) ಮತ್ತು ಲಂಬ ಚಲನೆ ಗುರುತ್ವದ (−g) ಅಡಿಯಲ್ಲಿರುತ್ತದೆ.\n"
                f"- **ಸಾಮಾನ್ಯ ತಪ್ಪುಗಳು:** ತುತ್ತತುದಿಯಲ್ಲಿ ಗುರುತ್ವ ಶೂನ್ಯವಾಗುತ್ತದೆ ಎಂದು ತಪ್ಪಾಗಿ ಭಾವಿಸುವುದು.\n"
                f"- **ನೈಜ ಜೀವನದ ಬಳಕೆ:** ಕ್ರೀಡಾ ಚಲನಶಾಸ್ತ್ರ, ನೀರಿನ ಕಾರಂಜಿ ವಿನ್ಯಾಸ ಮತ್ತು ಬಾಹ್ಯಾಕಾಶ ಪಥದ ಲೆಕ್ಕಾಚಾರ."
            )
        q_prefix = f"Regarding your question (\"{question}\"):\n\n" if question else ""
        return (
            f"{q_prefix}**{experiment_title} — Deterministic Lab Analysis**\n\n"
            f"- **What you did:** You launched a virtual projectile at **u = {u_val} m/s**, angle **θ = {ang}°**, and gravity **g = {g_val} m/s²**.\n"
            f"- **What happened:** The projectile reached a maximum height of **H = {h_max} m**, traveled a horizontal range of **R = {rng} m**, and stayed airborne for **T = {tof} s**.\n"
            f"- **Why & Scientific Principle:** Horizontal velocity (`vx = u cos θ`) stays constant while gravity uniformly decelerates vertical velocity (`vy = u sin θ − gt`), creating a symmetric parabola (under negligible air resistance).\n"
            f"- **Common mistakes:** Thinking total velocity or acceleration is zero at the peak (only `vy = 0`; `vx` and downward `g` remain active).\n"
            f"- **Real-world application:** Sports trajectory analysis, fountain nozzle engineering, and rescue drop planning."
        )

    if experiment_id == "convex-lens":
        u_val = measurements.get("object_distance_cartesian", parameters.get("object_distance", "N/A"))
        f_val = measurements.get("focal_length", parameters.get("focal_length", "N/A"))
        v_val = "∞ (Infinity)" if measurements.get("is_at_infinity") else measurements.get("image_distance", "N/A")
        m_val = "Undefined" if measurements.get("is_at_infinity") else measurements.get("magnification", "N/A")
        nature = f"{measurements.get('image_type', 'N/A')}, {measurements.get('image_orientation', 'N/A')}"
        if lang == "kn":
            return (
                f"**{experiment_title} — ಸಿಮ್ಯುಲೇಶನ್ ವಿಶ್ಲೇಷಣೆ (ಆಫ್‌ಲೈನ್ ಮಾರ್ಗದರ್ಶಿ)**\n\n"
                f"- **ನೀವು ಏನು ಮಾಡಿದ್ದೀರಿ:** ವಸ್ತು ದೂರ u = {u_val} cm ಮತ್ತು ನಾಭಿದೂರ f = +{f_val} cm ನಿಗದಿಪಡಿಸಿದ್ದೀರಿ.\n"
                f"- **ಏನು ನಡೆಯಿತು:** ಪ್ರತಿಬಿಂಬ ದೂರ v = {v_val} cm, ವರ್ಧನೆ m = {m_val}, ಸ್ವರೂಪ: {nature}.\n"
                f"- **ವೈಜ್ಞಾನಿಕ ತತ್ವ:** ಕಾರ್ಟೀಸಿಯನ್ ಚಿಹ್ನೆ ನಿಯಮದ ತೆಳುವಾದ ಮಸೂರ ಸಮೀಕರಣ `1/f = 1/v − 1/u`.\n"
                f"- **ಸಾಮಾನ್ಯ ತಪ್ಪುಗಳು:** u ಗೆ ಋಣಾತ್ಮಕ ಚಿಹ್ನೆಯನ್ನು ಮರೆಯುವುದು.\n"
                f"- **ನೈಜ ಜೀವನದ ಬಳಕೆ:** ಕ್ಯಾಮೆರಾ ಮಸೂರಗಳು, ಸೂಕ್ಷ್ಮದರ್ಶಕಗಳು, ಪ್ರೊಜೆಕ್ಟರ್‌ಗಳು ಮತ್ತು ಕನ್ನಡಕಗಳು."
            )
        q_prefix = f"Regarding your question (\"{question}\"):\n\n" if question else ""
        return (
            f"{q_prefix}**{experiment_title} — Deterministic Lab Analysis**\n\n"
            f"- **What you did:** You placed the virtual object at Cartesian position **u = {u_val} cm** before a convex lens of focal length **f = +{f_val} cm**.\n"
            f"- **What happened:** The computed image position is **v = {v_val}** (magnification **m = {m_val}**), producing a **{nature}** image.\n"
            f"- **Why & Scientific Principle:** The thin lens equation `1/f = 1/v − 1/u` governs ray convergence. Beyond `F`, rays converge to a real inverted image (`v > 0`); inside `F`, rays diverge and trace back to a virtual upright magnified image (`v < 0`).\n"
            f"- **Common mistakes:** Dropping the negative sign for real object distance `u` or assuming a convex lens can only create real images.\n"
            f"- **Real-world application:** Camera optics, magnifying glasses, microscopes, projectors, and eyeglasses for hyperopia."
        )

    return (
        f"**{experiment_title} — Deterministic Lab Analysis**\n\n"
        f"Parameters: `{json.dumps(parameters)}`\n"
        f"Computed measurements: `{json.dumps(measurements)}`\n\n"
        "The live AI tutor is currently in offline deterministic fallback mode."
    )


class OpenRouterService:
    """Async OpenRouter client with explicit error handling and deterministic fallback."""

    def __init__(self, settings: Settings | None = None):
        self.settings = settings or get_settings()

    def _build_context_block(
        self,
        experiment_id: str,
        experiment_title: str,
        objectives: list[str],
        parameters: dict[str, Any],
        measurements: dict[str, Any],
        language: str,
    ) -> str:
        lang_hint = LANGUAGE_INSTRUCTIONS.get(language, LANGUAGE_INSTRUCTIONS["en"])
        return (
            f"Experiment ID: {experiment_id}\n"
            f"Experiment Title: {experiment_title}\n"
            f"Learning Objectives: {json.dumps(objectives, ensure_ascii=False)}\n"
            f"Student Input Parameters: {json.dumps(parameters, ensure_ascii=False)}\n"
            f"Authoritative Simulation Measurements (DO NOT ALTER): "
            f"{json.dumps(measurements, ensure_ascii=False)}\n"
            f"Language Requirement: {lang_hint}"
        )

    async def generate_response(
        self,
        *,
        experiment_id: str,
        experiment_title: str,
        objectives: list[str],
        parameters: dict[str, Any],
        measurements: dict[str, Any],
        language: str = "en",
        question: str | None = None,
        history: list[dict[str, str]] | None = None,
        client: httpx.AsyncClient | None = None,
    ) -> dict[str, Any]:
        """Call OpenRouter chat completions or gracefully return deterministic fallback."""
        suggested = get_suggested_questions(experiment_id, language)

        if not self.settings.is_openrouter_configured:
            fallback_reply = build_deterministic_fallback(
                experiment_id, experiment_title, parameters, measurements, language, question
            )
            return {
                "experiment_id": experiment_id,
                "language": language,
                "provider": "deterministic_fallback",
                "model": self.settings.openrouter_model,
                "fallback_used": True,
                "error_notice": (
                    "OpenRouter API key is not configured on the server. "
                    "Showing deterministic scientific guidance based on your computed simulation data."
                ),
                "reply": fallback_reply,
                "suggested_questions": suggested,
            }

        context_block = self._build_context_block(
            experiment_id, experiment_title, objectives, parameters, measurements, language
        )
        messages: list[dict[str, str]] = [
            {"role": "system", "content": LABXAI_SYSTEM_PROMPT},
            {"role": "system", "content": context_block},
        ]

        # Enforce conversation history cap
        if history:
            trimmed = history[-self.settings.max_chat_history :]
            for item in trimmed:
                role = item.get("role")
                content = sanitize_text(str(item.get("content", "")), self.settings.max_message_chars)
                if role in ("user", "assistant") and content:
                    messages.append({"role": role, "content": content})

        if question:
            clean_q = sanitize_text(question, self.settings.max_message_chars)
            messages.append({"role": "user", "content": clean_q})
        else:
            messages.append(
                {
                    "role": "user",
                    "content": (
                        "Please explain my current virtual experiment results clearly using the "
                        "provided simulation measurements."
                    ),
                }
            )

        url = f"{self.settings.openrouter_base_url.rstrip('/')}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.settings.openrouter_api_key.strip()}",
            "Content-Type": "application/json",
            "HTTP-Referer": self.settings.openrouter_site_url,
            "X-Title": self.settings.app_name,
        }
        payload = {
            "model": self.settings.openrouter_model,
            "messages": messages,
            "temperature": 0.4,
            "max_tokens": 700,
        }

        error_notice: str | None = None
        try:
            if client is not None:
                response = await client.post(
                    url,
                    headers=headers,
                    json=payload,
                    timeout=self.settings.openrouter_timeout_seconds,
                )
            else:
                async with httpx.AsyncClient(timeout=self.settings.openrouter_timeout_seconds) as async_client:
                    response = await async_client.post(url, headers=headers, json=payload)

            if response.status_code == 200:
                data = response.json()
                choices = data.get("choices")
                if not isinstance(choices, list) or not choices:
                    error_notice = "AI provider returned an unexpected empty response."
                else:
                    content = choices[0].get("message", {}).get("content", "")
                    if isinstance(content, str) and content.strip():
                        return {
                            "experiment_id": experiment_id,
                            "language": language,
                            "provider": "openrouter",
                            "model": data.get("model", self.settings.openrouter_model),
                            "fallback_used": False,
                            "error_notice": None,
                            "reply": content.strip(),
                            "suggested_questions": suggested,
                        }
                    error_notice = "AI provider returned an empty assistant message."
            elif response.status_code == 401:
                error_notice = "OpenRouter authentication failed. Please verify OPENROUTER_API_KEY in backend/.env."
            elif response.status_code == 402:
                error_notice = "OpenRouter account has insufficient credits for the configured model."
            elif response.status_code in (400, 404):
                error_notice = (
                    f"Configured OpenRouter model '{self.settings.openrouter_model}' is unavailable "
                    "or invalid. You can update OPENROUTER_MODEL in backend/.env."
                )
            elif response.status_code == 429:
                error_notice = "OpenRouter rate limit reached. Showing deterministic explanation while you wait."
            else:
                error_notice = (
                    f"OpenRouter service returned HTTP {response.status_code}. "
                    "Showing deterministic lab guidance instead."
                )
        except httpx.TimeoutException:
            error_notice = "OpenRouter request timed out. Showing deterministic lab guidance instead."
        except httpx.RequestError:
            error_notice = "Could not reach OpenRouter API (network error). Showing deterministic lab guidance."
        except (ValueError, KeyError, TypeError):
            error_notice = "Failed to parse OpenRouter API response. Showing deterministic lab guidance."

        fallback_reply = build_deterministic_fallback(
            experiment_id, experiment_title, parameters, measurements, language, question
        )
        return {
            "experiment_id": experiment_id,
            "language": language,
            "provider": "deterministic_fallback",
            "model": self.settings.openrouter_model,
            "fallback_used": True,
            "error_notice": error_notice,
            "reply": fallback_reply,
            "suggested_questions": suggested,
        }
