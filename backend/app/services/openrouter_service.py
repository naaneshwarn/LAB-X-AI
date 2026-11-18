"""OpenRouter AI integration service with strict server-side credentials and 48-experiment fallback."""

from __future__ import annotations

import json
import time
from typing import Any

import httpx

from app.core.config import Settings, get_settings
from app.core.security import sanitize_text
from app.services.conversation_service import (
    answer_scientific_followup,
    get_conversation_manager,
)
from app.services.local_llm_service import LocalLlmService, get_local_llm_service
from app.services.result_explanation_service import (
    REVIEWED_EXPLAINERS,
    SUPPORTED_LANGUAGES,
    _build_universal_explanation,
    normalize_language,
)

LABXAI_SYSTEM_PROMPT = """You are LabXAI's scientific tutor covering Physics, Chemistry, Biology, and Mathematics across Basic, Intermediate, and Advanced levels.

You receive structured context about the student's active virtual experiment, including its discipline, difficulty level, formulas, input parameters, and authoritative calculated simulation measurements.

STRICT RULES:
1. Always respond in the student's selected language specified in the Language Requirement. Do NOT switch to English unless the student explicitly requests it.
2. Explain scientific and mathematical concepts accurately and naturally in the selected language.
3. Retain standard scientific symbols, formulas, SI units, chemical symbols, variable names, and mathematical notation exactly.
4. When a technical English term has no commonly accepted regional equivalent, retain the technical term and explain its meaning in the selected language.
5. Use ONLY the supplied simulation parameters and calculated results as the sole source of scientific truth. NEVER fabricate or alter experimental measurements.
6. Match the student's difficulty level (Basic = intuitive step-by-step; Intermediate = quantitative with graphs & formulas; Advanced = rigorous modeling & assumptions).
7. In 'hint' mode, guide the student with a helpful nudge instead of revealing the final quiz answer immediately.
8. In 'practice' mode, generate 2 targeted practice questions grounded in the current experiment.
9. In 'simplify' mode, re-explain the concept using an everyday analogy.
10. Clearly treat all activities as virtual simulations (never instruct dangerous physical or home chemistry experiments)."""

LANGUAGE_INSTRUCTIONS: dict[str, str] = {
    "en": "Always respond in clear, student-friendly English.",
    "kn": "Always respond in natural, accurate Kannada (ಕನ್ನಡ). Do NOT switch to English unless requested. Keep standard scientific symbols, formulas, chemical symbols, SI units, and numeric values exact.",
    "hi": "Always respond in natural, accurate Hindi (हिन्दी). Do NOT switch to English unless requested. Keep standard scientific symbols, formulas, chemical symbols, SI units, and numeric values exact.",
    "te": "Always respond in natural, accurate Telugu (తెలుగు). Do NOT switch to English unless requested. Keep standard scientific symbols, formulas, chemical symbols, SI units, and numeric values exact.",
    "ta": "Always respond in natural, accurate Tamil (தமிழ்). Do NOT switch to English unless requested. Keep standard scientific symbols, formulas, chemical symbols, SI units, and numeric values exact.",
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


SUGGESTED_QUESTIONS_GENERIC: dict[str, list[str]] = {
    "en": [
        "What scientific principle explains these calculated measurements?",
        "How do the parameters affect the graph and formula output?",
        "Where is this principle applied in everyday life?",
    ],
    "kn": [
        "ಈ ಲೆಕ್ಕಹಾಕಿದ ಫಲಿತಾಂಶಗಳನ್ನು ಯಾವ ವೈಜ್ಞಾನಿಕ ತತ್ವ ವಿವರಿಸುತ್ತದೆ?",
        "ನಿಯತಾಂಕಗಳನ್ನು ಬದಲಾಯಿಸಿದಾಗ ಗ್ರಾಫ್ ಮತ್ತು ಸೂತ್ರದ ಫಲಿತಾಂಶ ಹೇಗೆ ಬದಲಾಗುತ್ತದೆ?",
        "ಈ ತತ್ವವನ್ನು ದೈನಂದಿನ ಜೀವನದಲ್ಲಿ ಎಲ್ಲಿ ಬಳಸಲಾಗುತ್ತದೆ?",
    ],
    "hi": [
        "इन गणना किए गए परिणामों के पीछे कौन सा वैज्ञानिक सिद्धांत काम करता है?",
        "नियतांक बदलने पर ग्राफ़ और सूत्र के परिणाम कैसे बदलते हैं?",
        "दैनिक जीवन में इस सिद्धांत का उपयोग कहाँ किया जाता है?",
    ],
    "te": [
        "ఈ లెక్కించిన ఫలితాలను ఏ శాస్త్రీయ సూత్రం వివరిస్తుంది?",
        "పరామితులను మార్చినప్పుడు గ్రాఫ్ మరియు సూత్ర ఫలితం ఎలా మారుతుంది?",
        "రోజువారీ జీవితంలో ఈ సూత్రాన్ని ఎక్కడ ఉపయోగిస్తారు?",
    ],
    "ta": [
        "இந்த கணக்கிடப்பட்ட முடிவுகளை எந்த அறிவியல் கோட்பாடு விளக்குகிறது?",
        "அளவுருக்களை மாற்றும்போது வரைபடம் மற்றும் சூத்திர மதிப்பு எவ்வாறு மாறுகிறது?",
        "அன்றாட வாழ்க்கையில் இந்தக் கோட்பாடு எங்கு பயன்படுகிறது?",
    ],
}


def get_suggested_questions(experiment_id: str, language: str = "en", discipline: str = "Physics") -> list[str]:
    lang = normalize_language(language)
    exp_map = SUGGESTED_QUESTIONS_BY_EXP.get(experiment_id, {})
    if exp_map.get(lang):
        return exp_map[lang]
    if lang != "en":
        return SUGGESTED_QUESTIONS_GENERIC[lang]
    if exp_map.get("en"):
        return exp_map["en"]
    by_disc = {
        "Chemistry": [
            "How do my current parameters determine the calculated chemical results?",
            "What model assumptions or limitations apply to this virtual chemistry experiment?",
            "Give me a real-world industrial or biological application of this principle.",
        ],
        "Biology": [
            "How do the simulated measurements illustrate this biological mechanism?",
            "How does this simplified visual model differ from a real living system?",
            "What common misconceptions should I avoid in this biology topic?",
        ],
        "Mathematics": [
            "Walk me step by step through the mathematical formula behind these outputs.",
            "What special edge cases or singularities exist for these parameters?",
            "Give me a practice problem similar to my current simulation setup.",
        ],
    }
    return by_disc.get(discipline, SUGGESTED_QUESTIONS_GENERIC["en"])


def build_deterministic_fallback(
    experiment_id: str,
    experiment_title: str,
    parameters: dict[str, Any],
    measurements: dict[str, Any],
    language: str,
    question: str | None = None,
    *,
    discipline: str = "Physics",
    difficulty: str = "Basic",
    formulas: list[str] | None = None,
    common_mistakes: list[str] | None = None,
    applications: list[str] | None = None,
    mode: str = "explain",
) -> str:
    """Generate a scientifically accurate fallback explanation from authoritative measurements."""
    lang = language if language in ("en", "kn", "hi", "te", "ta") else "en"

    # Use the unified 7-section localized explanation generator for Ohm's Law, Simple Pendulum,
    # and all 48 multidisciplinary labs across EN, KN, HI, TA, and TE.
    # Keep projectile-motion and convex-lens bespoke EN/KN blocks for backwards compatibility.
    if experiment_id == "projectile-motion" and lang in ("en", "kn"):
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

    if experiment_id == "convex-lens" and lang in ("en", "kn"):
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

    # Rich, measurement-grounded, full-sentence 5-language fallback for ALL 48 experiments
    if experiment_id in REVIEWED_EXPLAINERS:
        exp_block = REVIEWED_EXPLAINERS[experiment_id](parameters, measurements, lang)
    else:
        fmt_list = [
            {"key": k, "label": k, "value": v, "unit": ""}
            for k, v in measurements.items()
            if v is not None and not isinstance(v, (list, dict))
        ]
        exp_block = _build_universal_explanation(
            experiment_title=experiment_title,
            discipline=discipline,
            difficulty=difficulty,
            parameters=parameters,
            formatted_measurements=fmt_list,
            formulas=formulas or [],
            conclusion_en=f"Calculated results for {experiment_title}.",
            applications_en=applications or [],
            lang=lang,
        )

    headers = {
        "en": (
            "Multilingual Lab Explanation",
            "1. Experiment Result Summary",
            "2. What the Calculated Values Mean",
            "3. Scientific / Mathematical Principle",
            "4. Step-by-Step Interpretation",
            "5. Real-World Application",
            "6. Common Mistakes",
            "7. Final Conclusion",
        ),
        "kn": (
            "ಸಿಮ್ಯುಲೇಶನ್ ಫಲಿತಾಂಶ ವಿವರಣೆ (ಆಫ್‌ಲೈನ್ ಮಾರ್ಗದರ್ಶಿ)",
            "1. ಪ್ರಯೋಗದ ಫಲಿತಾಂಶ ಸಾರಾಂಶ",
            "2. ಲೆಕ್ಕಹಾಕಿದ ಮೌಲ್ಯಗಳ ಅರ್ಥ",
            "3. ವೈಜ್ಞಾನಿಕ / ಗಣಿತ ತತ್ವ",
            "4. ಹಂತ-ಹಂತದ ವಿವರಣೆ",
            "5. ನೈಜ ಜೀವನದ ಬಳಕೆ",
            "6. ಸಾಮಾನ್ಯ ತಪ್ಪುಗಳು",
            "7. ಅಂತಿಮ ತೀರ್ಮಾನ",
        ),
        "hi": (
            "सिमुलेशन परिणाम व्याख्या",
            "1. प्रयोग परिणाम सारांश",
            "2. गणना किए गए मानों का अर्थ",
            "3. वैज्ञानिक / गणितीय सिद्धांत",
            "4. चरण-दर-चरण व्याख्या",
            "5. व्यावहारिक उपयोग",
            "6. सामान्य त्रुटियाँ",
            "7. अंतिम निष्कर्ष",
        ),
        "te": (
            "సిమ్యులేషన్ ఫలిత వివరణ",
            "1. ప్రయోగ ఫలిత సారాంశం",
            "2. లెక్కించిన విలువల అర్థం",
            "3. శాస్త్రీయ / గణిత సూత్రం",
            "4. దశలవారీ విశ్లేషణ",
            "5. నిజ జీవిత వినియోగం",
            "6. సాధారణ తప్పులు",
            "7. తుది నిర్ధారణ",
        ),
        "ta": (
            "உருவகப்படுத்துதல் முடிவு விளக்கம்",
            "1. சோதனை முடிவுச் சுருக்கம்",
            "2. கணக்கிடப்பட்ட மதிப்புகளின் பொருள்",
            "3. அறிவியல் / கணித கோட்பாடு",
            "4. படிப்படியான விளக்கம்",
            "5. நடைமுறை பயன்பாடு",
            "6. பொதுவான தவறுகள்",
            "7. இறுதி முடிவுரை",
        ),
    }[lang]

    mode_notes = {
        "hint": {
            "en": "Tutor Hint: Change one slider at a time and check how it affects the governing equation above.",
            "kn": "ಸುಳಿವು: ಒಂದೇ ನಿಯತಾಂಕವನ್ನು ಬದಲಿಸಿ, ಮೇಲಿನ ಸೂತ್ರದ ಮೇಲೆ ಅದರ ಪರಿಣಾಮವನ್ನು ಗಮನಿಸಿ.",
            "hi": "संकेत: एक समय में एक ही मान बदलें और देखें कि ऊपर दिए सूत्र का परिणाम कैसे बदलता है।",
            "te": "సూచన: ఒకేసారి ఒక పరామితిని మార్చి, పై సూత్రంపై దాని ప్రభావాన్ని పరిశీలించండి.",
            "ta": "குறிப்பு: ஒரு நேரத்தில் ஒரு அளவுருவை மட்டும் மாற்றி, மேலுள்ள சூத்திரத்தின் மாற்றத்தைக் காண்க.",
        },
        "practice": {
            "en": "Practice: Double one input parameter and predict the new output using the formula before checking.",
            "kn": "ಅಭ್ಯಾಸ: ಒಂದು ನಿಯತಾಂಕವನ್ನು ದ್ವಿಗುಣಗೊಳಿಸಿ, ಸೂತ್ರದಿಂದ ಹೊಸ ಫಲಿತಾಂಶವನ್ನು ಊಹಿಸಿ ನಂತರ ಪರಿಶೀಲಿಸಿ.",
            "hi": "अभ्यास: किसी एक इनपुट मान को दोगुना करें और सूत्र से नए परिणाम का अनुमान लगाकर जांचें।",
            "te": "అభ్యాసం: ఒక ఇన్‌పుట్ పరామితిని రెట్టింపు చేసి, సూత్రం ద్వారా కొత్త ఫలితాన్ని అంచనా వేసి తనిఖీ చేయండి.",
            "ta": "பயிற்சி: ஒரு உள்ளீட்டு அளவுருவை இரட்டிப்பாக்கி, சூத்திரத்தின் மூலம் புதிய விடையை கணித்து சரிபார்க்கவும்.",
        },
        "simplify": {
            "en": "Simple Intuition: Focus on how one input pushes the measured output up or down step by step.",
            "kn": "ಸರಳ ಅರ್ಥೈಸುವಿಕೆ: ಒಂದು ನಿಯತಾಂಕ ಬದಲಾದಾಗ ಫಲಿತಾಂಶ ಹೇಗೆ ಏರುತ್ತದೆ ಅಥವಾ ಇಳಿಯುತ್ತದೆ ಎಂಬುದನ್ನು ಹಂತ ಹಂತವಾಗಿ ಗಮನಿಸಿ.",
            "hi": "सरल समझ: ध्यान दें कि एक मान बदलने पर मापा गया परिणाम सीधे कैसे बढ़ता या घटता है।",
            "te": "సులభ అవగాహన: ఒక ఇన్‌పుట్ మారినప్పుడు కొలిచిన ఫలితం ఎలా పెరుగుతుందో లేదా తగ్గుతుందో గమనించండి.",
            "ta": "எளிய புரிதல்: ஒரு உள்ளீடு மாறும்போது கணக்கிடப்பட்ட மதிப்பு எவ்வாறு உயர்கிறது அல்லது குறைகிறது என்பதைப் பாருங்கள்.",
        },
    }
    mode_suffix = f"\n- **{mode_notes[mode][lang]}**" if mode in mode_notes else ""
    q_prefix = f"Q: \"{question}\"\n\n" if question else ""
    mistakes_text = exp_block.get("common_mistakes") or (common_mistakes[0] if common_mistakes else "")

    return (
        f"{q_prefix}**{experiment_title} — {headers[0]}**\n\n"
        f"- **{headers[1]}:** {exp_block['summary']}\n"
        f"- **{headers[2]}:** {exp_block['interpretation']}\n"
        f"- **{headers[3]}:** {exp_block['formula_explanation']}\n"
        f"- **{headers[4]}:** {exp_block['observation']}\n"
        f"- **{headers[5]}:** {exp_block['real_world_application']}\n"
        f"- **{headers[6]}:** {mistakes_text}\n"
        f"- **{headers[7]}:** {exp_block['conclusion']}"
        f"{mode_suffix}"
    )


class OpenRouterService:
    """3-Tier AI Tutor router: OpenRouter -> Lightweight Local LLM -> Deterministic Scientific Tutor."""

    def __init__(
        self,
        settings: Settings | None = None,
        local_llm: LocalLlmService | None = None,
    ):
        self.settings = settings or get_settings()
        self.local_llm = local_llm or get_local_llm_service(self.settings)

    def _build_context_block(
        self,
        experiment_id: str,
        experiment_title: str,
        objectives: list[str],
        parameters: dict[str, Any],
        measurements: dict[str, Any],
        language: str,
        *,
        discipline: str = "Physics",
        difficulty: str = "Basic",
        formulas: list[str] | None = None,
        mode: str = "explain",
        values_changed: bool = False,
    ) -> str:
        lang = normalize_language(language)
        lang_name = SUPPORTED_LANGUAGES.get(lang, "English")
        lang_hint = LANGUAGE_INSTRUCTIONS.get(lang, LANGUAGE_INSTRUCTIONS["en"])
        update_note = (
            "IMPORTANT: The student changed the simulation parameters since the previous message. "
            "Treat ONLY the measurements below as current; do NOT cite older values as current.\n"
            if values_changed
            else ""
        )
        return (
            f"Target Response Language: {lang_name} ({lang})\n"
            f"Discipline: {discipline}\n"
            f"Difficulty Level: {difficulty}\n"
            f"Tutor Mode: {mode}\n"
            f"Experiment ID: {experiment_id}\n"
            f"Experiment Title: {experiment_title}\n"
            f"Key Formulas: {json.dumps(formulas or [], ensure_ascii=False)}\n"
            f"Learning Objectives: {json.dumps(objectives, ensure_ascii=False)}\n"
            f"{update_note}"
            f"Current Student Input Parameters: {json.dumps(parameters, ensure_ascii=False)}\n"
            f"Latest Authoritative Simulation Measurements (DO NOT ALTER): "
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
        discipline: str = "Physics",
        difficulty: str = "Basic",
        formulas: list[str] | None = None,
        common_mistakes: list[str] | None = None,
        applications: list[str] | None = None,
        mode: str = "explain",
        conversation_id: str | None = None,
    ) -> dict[str, Any]:
        """Route across OpenRouter -> Lightweight Local LLM -> Deterministic Scientific Tutor."""
        t0 = time.perf_counter()
        lang = normalize_language(language)
        suggested = get_suggested_questions(experiment_id, lang, discipline)
        conv_mgr = get_conversation_manager()
        session, values_changed = conv_mgr.get_or_update(
            conversation_id=conversation_id,
            experiment_id=experiment_id,
            experiment_title=experiment_title,
            subject=discipline,
            difficulty=difficulty,
            language=lang,
            parameters=parameters,
            measurements=measurements,
            incoming_history=history,
        )

        context_block = self._build_context_block(
            experiment_id,
            experiment_title,
            objectives,
            parameters,
            measurements,
            lang,
            discipline=discipline,
            difficulty=difficulty,
            formulas=formulas,
            mode=mode,
            values_changed=values_changed,
        )
        messages: list[dict[str, str]] = [
            {"role": "system", "content": LABXAI_SYSTEM_PROMPT},
            {"role": "system", "content": context_block},
        ]

        # Bounded rolling conversation history from session manager
        active_history = session.messages[-self.settings.max_chat_history :]
        for item in active_history:
            role = item.get("role")
            content = sanitize_text(str(item.get("content", "")), self.settings.max_message_chars)
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})

        clean_q = sanitize_text(question, self.settings.max_message_chars) if question else None
        if clean_q:
            messages.append({"role": "user", "content": clean_q})
        else:
            mode_prompts = {
                "explain": "Please explain my current virtual experiment results clearly using the provided simulation measurements.",
                "hint": "Give me a helpful conceptual hint for understanding these results without spoiling quiz answers.",
                "practice": "Generate 2 short practice problems grounded in my current experiment and parameters.",
                "simplify": "Simplify this concept using an intuitive everyday analogy while referencing my simulation numbers.",
            }
            messages.append({"role": "user", "content": mode_prompts.get(mode, mode_prompts["explain"])})

        error_notice: str | None = None

        # ------------------------------------------------------------------
        # TIER 1: OpenRouter Cloud Provider (when API key is configured)
        # ------------------------------------------------------------------
        if self.settings.is_openrouter_configured:
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
                "max_tokens": 750,
            }
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
                            reply_text = content.strip()
                            turns = conv_mgr.append_turn(session.conversation_id, clean_q, reply_text)
                            return {
                                "success": True,
                                "conversation_id": session.conversation_id,
                                "conversation_turns": turns,
                                "experiment_id": experiment_id,
                                "language": lang,
                                "provider": "openrouter",
                                "model": data.get("model", self.settings.openrouter_model),
                                "fallback_used": False,
                                "error_notice": None,
                                "reply": reply_text,
                                "explanation": reply_text,
                                "latency_ms": round((time.perf_counter() - t0) * 1000.0, 1),
                                "local_model_status": None,
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

        # ------------------------------------------------------------------
        # TIER 2: Lightweight Local LLM (GGUF via llama-cpp-python or llama-server)
        # Skip probing local server if a mocked OpenRouter test client was explicitly passed
        # ------------------------------------------------------------------
        local_status_label = "not_installed"
        if client is None:
            try:
                local_res = await self.local_llm.generate_chat(messages=messages, max_tokens=512, temperature=0.4)
                if local_res and local_res.get("reply"):
                    reply_text = local_res["reply"]
                    turns = conv_mgr.append_turn(session.conversation_id, clean_q, reply_text)
                    return {
                        "success": True,
                        "conversation_id": session.conversation_id,
                        "conversation_turns": turns,
                        "experiment_id": experiment_id,
                        "language": lang,
                        "provider": "local",
                        "model": local_res.get("model", self.settings.local_llm_model_name),
                        "fallback_used": False,
                        "error_notice": None,
                        "reply": reply_text,
                        "explanation": reply_text,
                        "latency_ms": local_res.get("latency_ms"),
                        "local_model_status": "ready",
                        "suggested_questions": suggested,
                    }
            except Exception as exc:
                local_status_label = f"error: {exc}"

        # ------------------------------------------------------------------
        # TIER 3: Deterministic Scientific Tutor (Honest Offline Mode + Intent Q&A)
        # ------------------------------------------------------------------
        if error_notice is None:
            error_notice = (
                "OpenRouter API key is not configured and no local GGUF model is installed. "
                "Showing deterministic scientific guidance grounded in your live simulation data "
                "(full free-form AI conversation requires OpenRouter or a local Q4 GGUF model)."
            )

        followup_reply = (
            answer_scientific_followup(
                experiment_id=experiment_id,
                question=clean_q,
                parameters=parameters,
                measurements=measurements,
                language=lang,
                formulas=formulas,
            )
            if clean_q
            else None
        )
        fallback_reply = followup_reply or build_deterministic_fallback(
            experiment_id,
            experiment_title,
            parameters,
            measurements,
            lang,
            clean_q,
            discipline=discipline,
            difficulty=difficulty,
            formulas=formulas,
            common_mistakes=common_mistakes,
            applications=applications,
            mode=mode,
        )
        turns = conv_mgr.append_turn(session.conversation_id, clean_q, fallback_reply)
        return {
            "success": True,
            "conversation_id": session.conversation_id,
            "conversation_turns": turns,
            "experiment_id": experiment_id,
            "language": lang,
            "provider": "deterministic_fallback",
            "model": self.settings.openrouter_model,
            "fallback_used": True,
            "error_notice": error_notice,
            "reply": fallback_reply,
            "explanation": fallback_reply,
            "latency_ms": round((time.perf_counter() - t0) * 1000.0, 1),
            "local_model_status": local_status_label,
            "suggested_questions": suggested,
        }
