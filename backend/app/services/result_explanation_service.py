"""Multilingual Experiment Result Explanation & Localization Service for LabXAI.

Architecture:
    Deterministic Simulation Engine -> Numerical Results + SI Units (NEVER altered)
        -> Result Explanation Service (Experiment metadata + Params + Results + Language)
        -> Structured Localized Explanation (summary, observation, formula_explanation,
           interpretation, conclusion, real_world_application) in EN / KN / HI / TE / TA.

Scientific Integrity Rules:
- Numerical values, formulas, chemical symbols, and SI units are NEVER modified.
- All 5 languages (en, kn, hi, te, ta) produce natural, full-sentence explanations
  grounded in the exact calculated simulation measurements.
- If a requested translation fails or is unavailable, `translation_available` is set
  to False with an explicit `error_notice` and separate `english_original` — English
  text is NEVER silently labeled as a regional language translation.
"""

from __future__ import annotations

import hashlib
import json
import sqlite3
from datetime import datetime, timezone
from typing import Any

import httpx

from app.core.config import Settings, get_settings

CONTENT_VERSION = "v2"

SUPPORTED_LANGUAGES: dict[str, str] = {
    "en": "English",
    "kn": "Kannada (ಕನ್ನಡ)",
    "hi": "Hindi (हिन्दी)",
    "te": "Telugu (తెలుగు)",
    "ta": "Tamil (தமிழ்)",
}

# Localized discipline names
DISCIPLINE_NAMES: dict[str, dict[str, str]] = {
    "Physics": {"en": "Physics", "kn": "ಭೌತಶಾಸ್ತ್ರ", "hi": "भौतिकी", "te": "భౌతికశాస్త్రం", "ta": "இயற்பியல்"},
    "Chemistry": {"en": "Chemistry", "kn": "ರಸಾಯನಶಾಸ್ತ್ರ", "hi": "रसायन विज्ञान", "te": "రసాయనశాస్త్రం", "ta": "வேதியியல்"},
    "Biology": {"en": "Biology", "kn": "ಜೀವಶಾಸ್ತ್ರ", "hi": "जीव विज्ञान", "te": "జీవశాస్త్రం", "ta": "உயிரியல்"},
    "Mathematics": {"en": "Mathematics", "kn": "ಗಣಿತ", "hi": "गणित", "te": "గణితం", "ta": "கணிதம்"},
}

# Localized measurement & parameter labels across all 5 languages (preserving symbols)
MEASUREMENT_LABELS: dict[str, dict[str, str]] = {
    "voltage": {"en": "Voltage (V)", "kn": "ವೋಲ್ಟೇಜ್ (V)", "hi": "वोल्टेज (V)", "te": "వోల్టేజ్ (V)", "ta": "மின்னழுத்தம் (V)"},
    "resistance": {"en": "Resistance (R)", "kn": "ಪ್ರತಿರೋಧ (R)", "hi": "प्रतिरोध (R)", "te": "ప్రతిఘటన (R)", "ta": "மின்தடை (R)"},
    "current": {"en": "Electric Current (I)", "kn": "ವಿದ್ಯುತ್ ಪ್ರವಾಹ (I)", "hi": "विद्युत धारा (I)", "te": "విద్యుత్ ప్రవాహం (I)", "ta": "மின்னோட்டம் (I)"},
    "power": {"en": "Electrical Power (P)", "kn": "ವಿದ್ಯುತ್ ಶಕ್ತಿ (P)", "hi": "विद्युत शक्ति (P)", "te": "విద్యుత్ సామర్థ్యం (P)", "ta": "மின் திறன் (P)"},
    "conductance": {"en": "Conductance (G)", "kn": "ವಾಹಕತ್ವ (G)", "hi": "चालकता (G)", "te": "వాహకత్వం (G)", "ta": "மின்கடத்துத்திறன் (G)"},
    "time_period": {"en": "Time Period (T)", "kn": "ಆವರ್ತನ ಕಾಲ (T)", "hi": "आवर्तकाल (T)", "te": "ఆవర్తన కాలం (T)", "ta": "அலைவு நேரம் (T)"},
    "frequency": {"en": "Frequency (f)", "kn": "ಆವೃತ್ತಿ (f)", "hi": "आवृत्ति (f)", "te": "పౌనఃపున్యం (f)", "ta": "அதிர்வெண் (f)"},
    "corrected_time_period": {"en": "Large-Angle Period", "kn": "ದೊಡ್ಡ-ಕೋನ ಆವರ್ತನ ಕಾಲ", "hi": "बड़े कोण का आवर्तकाल", "te": "పెద్ద కోణ ఆవర్తన కాలం", "ta": "பெரிய கோண அலைவு நேரம்"},
    "total_time": {"en": "Total Time", "kn": "ಒಟ್ಟು ಸಮಯ", "hi": "कुल समय", "te": "మొత్తం సమయం", "ta": "மொத்த நேரம்"},
    "time_of_flight": {"en": "Time of Flight (T)", "kn": "ಹಾರಾಟದ ಸಮಯ (T)", "hi": "उड़ान का समय (T)", "te": "గమన కాలం (T)", "ta": "பறக்கும் நேரம் (T)"},
    "max_height": {"en": "Maximum Height (H)", "kn": "ಗರಿಷ್ಠ ಎತ್ತರ (H)", "hi": "अधिकतम ऊँचाई (H)", "te": "గరిష్ట ఎత్తు (H)", "ta": "அதிகபட்ச உயரம் (H)"},
    "horizontal_range": {"en": "Horizontal Range (R)", "kn": "ಅಡ್ಡ ವ್ಯಾಪ್ತಿ (R)", "hi": "क्षैतिज परास (R)", "te": "క్షితిజ సమాంతర వ్యాప్తి (R)", "ta": "கிடைமட்ட வீச்சு (R)"},
    "image_distance": {"en": "Image Distance (v)", "kn": "ಪ್ರತಿಬಿಂಬ ದೂರ (v)", "hi": "प्रतिबिंब दूरी (v)", "te": "ప్రతిబింబ దూరం (v)", "ta": "பிம்பத் தொலைவு (v)"},
    "magnification": {"en": "Magnification (m)", "kn": "ವರ್ಧನೆ (m)", "hi": "आवर्धन (m)", "te": "ఆవర్ధనం (m)", "ta": "உருப்பெருக்கம் (m)"},
    "optical_power": {"en": "Optical Power (P)", "kn": "ದೃಕ್ ಶಕ್ತಿ (P)", "hi": "लेंस की क्षमता (P)", "te": "కటక సామర్థ్యం (P)", "ta": "லென்ஸ் திறன் (P)"},
    "ph": {"en": "pH (−log[H⁺])", "kn": "pH (−log[H⁺])", "hi": "pH (−log[H⁺])", "te": "pH (−log[H⁺])", "ta": "pH (−log[H⁺])"},
    "poh": {"en": "pOH (14 − pH)", "kn": "pOH (14 − pH)", "hi": "pOH (14 − pH)", "te": "pOH (14 − pH)", "ta": "pOH (14 − pH)"},
    "h_concentration": {"en": "[H⁺] Concentration", "kn": "[H⁺] ಸಾಂದ್ರತೆ", "hi": "[H⁺] सांद्रता", "te": "[H⁺] గాఢత", "ta": "[H⁺] செறிவு"},
    "nature": {"en": "Solution Nature", "kn": "ದ್ರಾವಣದ ಸ್ವರೂಪ", "hi": "विलयन की प्रकृति", "te": "ద్రావణ స్వభావం", "ta": "கரைசலின் தன்மை"},
    "o2_evolution_rate": {"en": "O₂ Evolution Rate", "kn": "O₂ ಉತ್ಪಾದನಾ ದರ", "hi": "O₂ उत्पादन दर", "te": "O₂ ఉత్పత్తి రేటు", "ta": "O₂ உற்பத்தி விகிதம்"},
    "glucose_synthesis_rate": {"en": "Glucose Synthesis Rate", "kn": "ಗ್ಲೂಕೋಸ್ ಸಂಶ್ಲೇಷಣಾ ದರ", "hi": "ग्लूकोज़ संश्लेषण दर", "te": "గ్లూకోజ్ సంశ్లేషణ రేటు", "ta": "குளுக்கோஸ் தொகுப்பு விகிதம்"},
    "limiting_factor": {"en": "Limiting Factor", "kn": "ಮಿತಿಕಾರಕ ಅಂಶ", "hi": "सीमांत कारक", "te": "పరిమితి కారకం", "ta": "கட்டுப்படுத்தும் காரணி"},
    "discriminant": {"en": "Discriminant (Δ)", "kn": "ವಿವೇಚಕ (Δ)", "hi": "विविक्तकर (Δ)", "te": "విచక్షణి (Δ)", "ta": "தன்மைக்காட்டி (Δ)"},
    "root_nature": {"en": "Nature of Roots", "kn": "ಮೂಲಗಳ ಸ್ವರೂಪ", "hi": "मूलों की प्रकृति", "te": "మూలాల స్వభావం", "ta": "மூலங்களின் தன்மை"},
    "roots_display": {"en": "Roots (x₁, x₂)", "kn": "ಮೂಲಗಳು (x₁, x₂)", "hi": "मूल (x₁, x₂)", "te": "మూలాలు (x₁, x₂)", "ta": "மூலங்கள் (x₁, x₂)"},
    "vertex_x": {"en": "Vertex (h, k)", "kn": "ಶೃಂಗ (h, k)", "hi": "शीर्ष (h, k)", "te": "శీర్షం (h, k)", "ta": "உச்சி (h, k)"},
    "f_x0": {"en": "Function Value f(x₀)", "kn": "ಫಲನ ಮೌಲ್ಯ f(x₀)", "hi": "फलन मान f(x₀)", "te": "ప్రమేయ విలువ f(x₀)", "ta": "சார்பு மதிப்பு f(x₀)"},
    "f_prime_x0": {"en": "Derivative f′(x₀)", "kn": "ವ್ಯುತ್ಪನ್ನ f′(x₀)", "hi": "अवकलज f′(x₀)", "te": "అవకలజం f′(x₀)", "ta": "வகைக்கெழு f′(x₀)"},
    "exact_integral": {"en": "Exact Integral", "kn": "ನಿಖರ ಸಮಾಕಲನ", "hi": "सटीक समाकलन", "te": "ఖచ్చితమైన సమాకలనం", "ta": "துல்லிய தொகையீடு"},
    "determinant": {"en": "Determinant det(A)", "kn": "ನಿರ್ಧಾರಕ det(A)", "hi": "सारणिक det(A)", "te": "నిర్ధారకం det(A)", "ta": "அணிக்கோவை det(A)"},
    "final_molarity": {"en": "Final Molarity (C₂)", "kn": "ಅಂತಿಮ ಮೊಲಾರಿಟಿ (C₂)", "hi": "अंतिम मोलरता (C₂)", "te": "తుది మోలారిటీ (C₂)", "ta": "இறுதி மோலாரிட்டி (C₂)"},
    "p_ideal_atm": {"en": "Ideal Pressure (P)", "kn": "ಆದರ್ಶ ಒತ್ತಡ (P)", "hi": "आदर्श दाब (P)", "te": "ఆదర్శ పీడనం (P)", "ta": "நல்லியல்பு அழுத்தம் (P)"},
    "minute_ventilation_l_min": {"en": "Minute Ventilation (V̇E)", "kn": "ನಿಮಿಷದ ಉಸಿರಾಟದ ಗಾಳಿ (V̇E)", "hi": "मिनट वेंटिलेशन (V̇E)", "te": "నిమిషపు శ్వాస పరిమాణం (V̇E)", "ta": "நிமிட சுவாச அளவு (V̇E)"},
    "alveolar_ventilation_l_min": {"en": "Alveolar Ventilation (V̇A)", "kn": "ಆಲ್ವಿಯೋಲಾರ್ ವಾತಾಯನ (V̇A)", "hi": "वायुकोशिकीय वेंटिलेशन (V̇A)", "te": "ఆల్వియోలార్ శ్వాస (V̇A)", "ta": "ஆல்வியோலி காற்றோட்டம் (V̇A)"},
    "reflex_latency_ms": {"en": "Spinal Reflex Time", "kn": "ಪ್ರತಿವರ್ತಿ ಕ್ರಿಯೆ ಸಮಯ", "hi": "प्रतिवर्ती क्रिया समय", "te": "ప్రతీకార చర్య సమయం", "ta": "அனிச்சை செயல் நேரம்"},
    "enthalpy_change_kj": {"en": "Heat Change (ΔH)", "kn": "ಉಷ್ಣ ಬದಲಾವಣೆ (ΔH)", "hi": "ऊष्मा परिवर्तन (ΔH)", "te": "ఉష్ణ మార్పు (ΔH)", "ta": "வெப்ப மாற்றம் (ΔH)"},
    "product_moles": {"en": "Product Yield (mol)", "kn": "ಉತ್ಪನ್ನದ ಮೋಲ್‌ಗಳು", "hi": "उत्पाद मात्रा (mol)", "te": "ఉత్పన్న మోల్స్", "ta": "விளைபொருள் மோல்கள்"},
}

# Localized validation / error messages for common physical & mathematical constraint errors
VALIDATION_ERROR_PATTERNS: list[tuple[str, dict[str, str]]] = [
    (
        "resistance",
        {
            "en": "Resistance (R) must be greater than 0 Ω to prevent an idealized short circuit (division by zero in I = V / R).",
            "kn": "ಶಾರ್ಟ್ ಸರ್ಕ್ಯೂಟ್ (I = V / R ನಲ್ಲಿ ಶೂನ್ಯದಿಂದ ಭಾಗಾಕಾರ) ತಡೆಯಲು ಪ್ರತಿರೋಧ R > 0 Ω ಆಗಿರಬೇಕು.",
            "hi": "शॉर्ट सर्किट (I = V / R में शून्य से विभाजन) से बचने के लिए प्रतिरोध R > 0 Ω होना आवश्यक है।",
            "te": "షార్ట్ సర్క్యూట్ (I = V / R లో సున్నాతో భాగహారం) నివారించడానికి ప్రతిఘటన R > 0 Ω ఉండాలి.",
            "ta": "குறுக்கு மின்சுற்றை (I = V / R இல் பூஜ்ஜியத்தால் வகுத்தல்) தவிர்க்க மின்தடை R > 0 Ω ஆக இருக்க வேண்டும்.",
        },
    ),
    (
        "leading coefficient",
        {
            "en": "Leading coefficient a must be non-zero (a ≠ 0) for a quadratic equation ax² + bx + c = 0.",
            "kn": "ವರ್ಗ ಸಮೀಕರಣ ax² + bx + c = 0 ಗಾಗಿ ಗುಣಾಂಕ a ಶೂನ್ಯವಾಗಿರಬಾರದು (a ≠ 0).",
            "hi": "द्विघात समीकरण ax² + bx + c = 0 के लिए गुणांक a शून्य नहीं हो सकता (a ≠ 0)।",
            "te": "వర్గ సమీకరణం ax² + bx + c = 0 కోసం గుణకం a సున్నా కాకూడదు (a ≠ 0).",
            "ta": "இருபடிச் சமன்பாடு ax² + bx + c = 0 என்பதற்கு குணகம் a பூஜ்ஜியமாக இருக்கக் கூடாது (a ≠ 0).",
        },
    ),
    (
        "molarity",
        {
            "en": "Molarity must be strictly positive (> 0 M) to compute pH = −log₁₀[H⁺].",
            "kn": "pH = −log₁₀[H⁺] ಲೆಕ್ಕಹಾಕಲು ಮೊಲಾರಿಟಿ ಧನಾತ್ಮಕವಾಗಿರಬೇಕು (> 0 M).",
            "hi": "pH = −log₁₀[H⁺] की गणना के लिए मोलरता धनात्मक (> 0 M) होनी चाहिए।",
            "te": "pH = −log₁₀[H⁺] లెక్కించడానికి మోలారిటీ ధనాత్మకంగా (> 0 M) ఉండాలి.",
            "ta": "pH = −log₁₀[H⁺] கணக்கிட மோலாரிட்டி நேர்மறையாக (> 0 M) இருக்க வேண்டும்.",
        },
    ),
    (
        "final diluted volume",
        {
            "en": "Final volume V₂ must be greater than or equal to initial volume V₁ during dilution.",
            "kn": "ದುರ್ಬಲೀಕರಣದಲ್ಲಿ ಅಂತಿಮ ಗಾತ್ರ V₂ ಆರಂಭಿಕ ಗಾತ್ರ V₁ ಗಿಂತ ಹೆಚ್ಚು ಅಥವಾ ಸಮವಾಗಿರಬೇಕು.",
            "hi": "तनुकरण में अंतिम आयतन V₂ प्रारंभिक आयतन V₁ से अधिक या बराबर होना चाहिए।",
            "te": "విలీనీకరణంలో తుది ఘనపరిమాణం V₂ ప్రారంభ ఘనపరిమాణం V₁ కంటే ఎక్కువ లేదా సమానంగా ఉండాలి.",
            "ta": "நீர்த்தலில் இறுதி கனஅளவு V₂ தொடக்க கனஅளவு V₁ விட அதிகமாகவோ சமமாகவோ இருக்க வேண்டும்.",
        },
    ),
    (
        "upper limit",
        {
            "en": "Upper integration limit must be strictly greater than the lower limit.",
            "kn": "ಸಮಾಕಲನದ ಮೇಲಿನ ಮಿತಿ ಕೆಳಗಿನ ಮಿತಿಗಿಂತ ಕಡ್ಡಾಯವಾಗಿ ಹೆಚ್ಚಾಗಿರಬೇಕು.",
            "hi": "समाकलन की ऊपरी सीमा निचली सीमा से अधिक होनी चाहिए।",
            "te": "సమాకలనం యొక్క ఎగువ పరిమితి దిగువ పరిమితి కంటే ఎక్కువగా ఉండాలి.",
            "ta": "தொகையீட்டின் மேல் எல்லை கீழ் எல்லையை விட அதிகமாக இருக்க வேண்டும்.",
        },
    ),
]


def normalize_language(language: str | None) -> str:
    code = (language or "en").strip().lower()[:2]
    return code if code in SUPPORTED_LANGUAGES else "en"


def localize_validation_error(raw_error: str, language: str = "en") -> str:
    """Return a scientifically accurate localized validation error message."""
    lang = normalize_language(language)
    low = (raw_error or "").lower()
    for needle, mapping in VALIDATION_ERROR_PATTERNS:
        if needle in low:
            return mapping.get(lang, mapping["en"])
    if lang == "en":
        return raw_error
    prefixes = {
        "kn": "ಅಮಾನ್ಯ ನಿಯತಾಂಕ ಮೌಲ್ಯ: ",
        "hi": "अमान्य मान (Invalid parameter): ",
        "te": "చెల్లని పరామితి విలువ: ",
        "ta": "தவறான அளவுரு மதிப்பு: ",
    }
    return f"{prefixes.get(lang, '')}{raw_error}"


def localize_measurement_label(key: str, default_label: str, language: str = "en") -> str:
    lang = normalize_language(language)
    entry = MEASUREMENT_LABELS.get(key)
    if entry and lang in entry:
        return entry[lang]
    return default_label


def _format_kv_summary(formatted_measurements: list[dict[str, Any]], max_items: int = 4) -> str:
    parts = []
    for item in formatted_measurements[:max_items]:
        val = item.get("value")
        unit = item.get("unit") or ""
        label = item.get("label") or item.get("key")
        parts.append(f"{label} = {val}{(' ' + unit) if unit else ''}")
    return ", ".join(parts)


# ---------------------------------------------------------------------------
# Reviewed Experiment-Specific Localized Generators (EN / KN / HI / TE / TA)
# ---------------------------------------------------------------------------

def _explain_ohms_law(params: dict[str, Any], m: dict[str, Any], lang: str) -> dict[str, str]:
    V = m.get("voltage", params.get("voltage", 0))
    R = m.get("resistance", params.get("resistance", 1))
    I = m.get("current", 0)
    P = m.get("power", 0)
    G = m.get("conductance", 0)

    if lang == "kn":
        return {
            "summary": f"ವೋಲ್ಟೇಜ್ V = {V} V ಮತ್ತು ಪ್ರತಿರೋಧ R = {R} Ω ಇರುವ ಮಂಡಲದಲ್ಲಿ ವಿದ್ಯುತ್ ಪ್ರವಾಹ I = {I} A ಹಾಗೂ ವಿದ್ಯುತ್ ಶಕ್ತಿ P = {P} W ಎಂದು ಲೆಕ್ಕಹಾಕಲಾಗಿದೆ.",
            "observation": f"ಪ್ರತಿರೋಧ ಸ್ಥಿರವಾಗಿರುವಾಗ ವೋಲ್ಟೇಜ್ ಹೆಚ್ಚಾದಂತೆ ವಿದ್ಯುತ್ ಪ್ರವಾಹವೂ ನೇರಾನುಪಾತದಲ್ಲಿ ಹೆಚ್ಚಾಗುತ್ತದೆ. ಈ ಸಿಮ್ಯುಲೇಶನ್‌ನಲ್ಲಿ R = {R} Ω ಇದ್ದಾಗ V = {V} V ಗೆ I = {I} A (ವಾಹಕತ್ವ G = {G} S) ದಾಖಲಾಗಿದೆ.",
            "formula_explanation": f"ಓಮ್ ನಿಯಮದ ಪ್ರಕಾರ V = I × R ⇒ I = V / R = {V} V / {R} Ω = {I} A. ವಿದ್ಯುತ್ ಶಕ್ತಿ P = V × I = {V} V × {I} A = {P} W.",
            "interpretation": f"ಪ್ರತಿ ಸೆಕೆಂಡಿಗೆ {I} ಕೂಲಂಬ್ ವಿದ್ಯುದಾವೇಶ ಮಂಡಲದ ಮೂಲಕ ಹರಿಯುತ್ತಿದೆ ಮತ್ತು ಪ್ರತಿರೋಧಕವು {P} W ಶಕ್ತಿಯನ್ನು ಉಷ್ಣವಾಗಿ ವ್ಯಯಿಸುತ್ತಿದೆ. R ಅನ್ನು ದ್ವಿಗುಣಗೊಳಿಸಿದರೆ I ಅರ್ಧದಷ್ಟಾಗುತ್ತದೆ.",
            "conclusion": f"ಸ್ಥಿರ ತಾಪಮಾನದಲ್ಲಿ V = {V} V ಮತ್ತು R = {R} Ω ಗೆ ಓಮ್ ನಿಯಮ ದೃಢಪಟ್ಟಿದೆ: I = {I} A, P = {P} W.",
            "real_world_application": "ಎಲ್‌ಇಡಿ (LED) ಸುರಕ್ಷತಾ ಪ್ರತಿರೋಧಕಗಳು, ವಿದ್ಯುತ್ ಹೀಟರ್‌ಗಳು, ಫ್ಯೂಸ್ ಆಯ್ಕೆ ಮತ್ತು ಮನೆಯ ವಿದ್ಯುತ್ ಮಂಡಲಗಳ ವಿನ್ಯಾಸದಲ್ಲಿ ಓಮ್ ನಿಯಮ ಬಳಕೆಯಾಗುತ್ತದೆ.",
            "common_mistakes": "ಪ್ರತಿರೋಧವನ್ನು 0 Ω ಎಂದು ಇಡುವುದು (ಶಾರ್ಟ್ ಸರ್ಕ್ಯೂಟ್), ಆಮ್ಮೀಟರ್ ಅನ್ನು ಸಮಾನಾಂತರವಾಗಿ ಜೋಡಿಸುವುದು ಅಥವಾ ವೋಲ್ಟ್‌ಮೀಟರ್ ಅನ್ನು ಶ್ರೇಣಿಯಲ್ಲಿ ಜೋಡಿಸುವುದು ಸಾಮಾನ್ಯ ತಪ್ಪುಗಳಾಗಿವೆ.",
        }
    if lang == "hi":
        return {
            "summary": f"वोल्टेज V = {V} V और प्रतिरोध R = {R} Ω के लिए विद्युत धारा I = {I} A तथा विद्युत शक्ति P = {P} W प्राप्त हुई।",
            "observation": f"यदि प्रतिरोध स्थिर रहता है, तो वोल्टेज बढ़ने पर विद्युत धारा भी समानुपाती रूप से बढ़ती है। यहाँ R = {R} Ω और V = {V} V पर I = {I} A (चालकता G = {G} S) मापी गई।",
            "formula_explanation": f"ओम के नियम से V = I × R ⇒ I = V / R = {V} V / {R} Ω = {I} A। विद्युत शक्ति P = V × I = {V} V × {I} A = {P} W।",
            "interpretation": f"परिपथ में प्रति सेकंड {I} कूलॉम आवेश प्रवाहित हो रहा है और प्रतिरोधक {P} W ऊर्जा ऊष्मा के रूप में व्यय कर रहा है। प्रतिरोध दोगुना करने पर धारा आधी हो जाएगी।",
            "conclusion": f"स्थिर ताप पर V = {V} V और R = {R} Ω के साथ ओम का नियम सत्यापित हुआ: I = {I} A और P = {P} W।",
            "real_world_application": "LED के लिए धारा-सीमक प्रतिरोधक, इलेक्ट्रिक हीटर, फ़्यूज़ रेटिंग और घरेलू विद्युत परिपथों के डिज़ाइन में ओम के नियम का उपयोग होता है।",
            "common_mistakes": "प्रतिरोध को 0 Ω रखना (शॉर्ट सर्किट), ऐमीटर को समानांतर में जोड़ना या वोल्टमीटर को श्रेणी क्रम में जोड़ना सामान्य त्रुटियाँ हैं।",
        }
    if lang == "te":
        return {
            "summary": f"వోల్టేజ్ V = {V} V మరియు ప్రతిఘటన R = {R} Ω ఉన్న వలయంలో విద్యుత్ ప్రవాహం I = {I} A మరియు విద్యుత్ సామర్థ్యం P = {P} W గా లెక్కించబడింది.",
            "observation": f"ప్రతిఘటన స్థిరంగా ఉన్నప్పుడు వోల్టేజ్ పెరిగే కొద్దీ విద్యుత్ ప్రవాహం కూడా అనులోమానుపాతంలో పెరుగుతుంది. ఈ ప్రయోగంలో R = {R} Ω వద్ద V = {V} V కు I = {I} A (వాహకత్వం G = {G} S) నమోదైంది.",
            "formula_explanation": f"ఓమ్ నియమం ప్రకారం V = I × R ⇒ I = V / R = {V} V / {R} Ω = {I} A. విద్యుత్ సామర్థ్యం P = V × I = {V} V × {I} A = {P} W.",
            "interpretation": f"వలయంలో సెకనుకు {I} కూలుంబుల ఆవేశం ప్రవహిస్తోంది మరియు ప్రతిఘటకం {P} W సామర్థ్యాన్ని ఉష్ణంగా విడుదల చేస్తోంది. R రెట్టింపు చేస్తే I సగానికి తగ్గుతుంది.",
            "conclusion": f"స్థిర ఉష్ణోగ్రత వద్ద V = {V} V, R = {R} Ω కు ఓమ్ నియమం నిర్ధారించబడింది: I = {I} A, P = {P} W.",
            "real_world_application": "LED రక్షణ నిరోధకాలు, ఎలక్ట్రిక్ హీటర్లు, ఫ్యూజ్ ఎంపిక మరియు గృహ విద్యుత్ వలయాల రూపకల్పనలో ఓమ్ నియమం ఉపయోగపడుతుంది.",
            "common_mistakes": "ప్రతిఘటనను 0 Ω ఉంచడం (షార్ట్ సర్క్యూట్), ఆమ్మీటర్‌ను సమాంతరంగా కలపడం లేదా వోల్ట్‌మీటర్‌ను శ్రేణిలో కలపడం సాధారణ తప్పులు.",
        }
    if lang == "ta":
        return {
            "summary": f"மின்னழுத்தம் V = {V} V மற்றும் மின்தடை R = {R} Ω கொண்ட மின்சுற்றில் மின்னோட்டம் I = {I} A மற்றும் மின் திறன் P = {P} W எனக் கணக்கிடப்பட்டது.",
            "observation": f"மின்தடை மாறாமல் இருக்கும்போது மின்னழுத்தம் அதிகரித்தால் மின்னோட்டமும் நேர்விகிதத்தில் அதிகரிக்கும். இங்கு R = {R} Ω மற்றும் V = {V} V இல் I = {I} A (மின்கடத்துத்திறன் G = {G} S) பதிவாகியுள்ளது.",
            "formula_explanation": f"ஓம் விதியின்படி V = I × R ⇒ I = V / R = {V} V / {R} Ω = {I} A. மின் திறன் P = V × I = {V} V × {I} A = {P} W.",
            "interpretation": f"மின்சுற்றில் வினாடிக்கு {I} கூலூம் மின்னூட்டம் பாய்கிறது மற்றும் மின்தடையம் {P} W ஆற்றலை வெப்பமாக வெளியிடுகிறது. மின்தடை இரட்டிப்பானால் மின்னோட்டம் பாதியாகும்.",
            "conclusion": f"மாறாத வெப்பநிலையில் V = {V} V மற்றும் R = {R} Ω ஆகியவற்றிற்கு ஓம் விதி உறுதிப்படுத்தப்பட்டது: I = {I} A, P = {P} W.",
            "real_world_application": "LED பாதுகாப்பு மின்தடையங்கள், மின் வெப்பமூட்டிகள், உருகி (fuse) தேர்வு மற்றும் வீட்டு மின்சுற்று வடிவமைப்பில் ஓம் விதி பயன்படுகிறது.",
            "common_mistakes": "மின்தடையை 0 Ω ஆக அமைப்பது (குறுக்கு மின்சுற்று), அம்மீட்டரை பக்க இணைப்பில் இணைப்பது அல்லது வோல்ட்மீட்டரை தொடர் இணைப்பில் இணைப்பது பொதுவான தவறுகள்.",
        }
    return {
        "summary": f"For supply voltage V = {V} V across resistance R = {R} Ω, the circuit draws current I = {I} A and dissipates power P = {P} W.",
        "observation": f"The current increases linearly when the voltage increases, provided the resistance remains constant. At R = {R} Ω and V = {V} V, I = {I} A (conductance G = {G} S).",
        "formula_explanation": f"Using Ohm's Law V = I × R ⇒ I = V / R = {V} V / {R} Ω = {I} A, and electrical power P = V × I = {V} V × {I} A = {P} W.",
        "interpretation": f"{I} coulombs of charge flow every second through the resistor while converting {P} W of electrical power into heat. Doubling R halves I at fixed V.",
        "conclusion": f"Ohm's Law is verified at constant temperature: V = {V} V and R = {R} Ω yield I = {I} A and P = {P} W.",
        "real_world_application": "Selecting current-limiting resistors for LEDs, sizing fuses, designing electric heaters, and analyzing household wiring circuits.",
        "common_mistakes": "Setting resistance to 0 Ω (idealized short circuit), connecting an ammeter in parallel instead of series, or forgetting to keep units consistent (V, Ω, A, W).",
    }


def _explain_acids_bases_ph(params: dict[str, Any], m: dict[str, Any], lang: str) -> dict[str, str]:
    ph = m.get("ph", 7.0)
    poh = m.get("poh", 7.0)
    h_conc = m.get("h_concentration", "1.00e-7")
    sol = m.get("solution_name", "Solution")
    c = params.get("molarity", 0.01)
    nature_raw = str(m.get("nature", "Neutral")).lower()
    is_acid = "acid" in nature_raw
    is_base = "basic" in nature_raw or "alkal" in nature_raw

    if lang == "kn":
        nature_kn = "ಆಮ್ಲೀಯ (Acidic)" if is_acid else ("ಪ್ರತ್ಯಾಮ್ಲೀಯ (Basic)" if is_base else "ತಟಸ್ಥ (Neutral)")
        return {
            "summary": f"{c} M {sol} ದ್ರಾವಣದ pH = {ph} ಮತ್ತು pOH = {poh} ಆಗಿದ್ದು, ಇದು {nature_kn} ದ್ರಾವಣವಾಗಿದೆ.",
            "observation": f"[H⁺] ಅಯಾನ್ ಸಾಂದ್ರತೆ {h_conc} M ಆಗಿದೆ. [H⁺] ಹೆಚ್ಚಾದಂತೆ pH ಮೌಲ್ಯ ಕಡಿಮೆಯಾಗಿ ಆಮ್ಲೀಯತೆ ಹೆಚ್ಚಾಗುತ್ತದೆ; [OH⁻] ಹೆಚ್ಚಾದಂತೆ pH 7 ಕ್ಕಿಂತ ಹೆಚ್ಚಾಗುತ್ತದೆ.",
            "formula_explanation": f"pH = −log₁₀[H⁺] = {ph} ಮತ್ತು 25 °C ನಲ್ಲಿ pH + pOH = 14 ⇒ pOH = 14 − {ph} = {poh}.",
            "interpretation": f"pH ಸ್ಕೇಲ್ ಲಾಗರಿಥಮಿಕ್ ಆಗಿರುವುದರಿಂದ pH ನಲ್ಲಿ 1 ಘಟಕದ ಬದಲಾವಣೆಯು [H⁺] ಸಾಂದ್ರತೆಯಲ್ಲಿ 10 ಪಟ್ಟು ಬದಲಾವಣೆಯನ್ನು ಸೂಚಿಸುತ್ತದೆ. ಈ ದ್ರಾವಣವು {nature_kn} ವ್ಯಾಪ್ತಿಯಲ್ಲಿದೆ.",
            "conclusion": f"{c} M {sol} ವರ್ಚುವಲ್ ದ್ರಾವಣವು pH = {ph} (pOH = {poh}) ನೀಡುತ್ತದೆ — {nature_kn}.",
            "real_world_application": "ಕುಡಿಯುವ ನೀರಿನ ಗುಣಮಟ್ಟ ಪರೀಕ್ಷೆ, ಕೃಷಿ ಮಣ್ಣಿನ pH ನಿರ್ವಹಣೆ, ರಕ್ತದ pH ಸಮತೋಲನ (7.35–7.45) ಮತ್ತು ಔಷಧ ತಯಾರಿಕೆಯಲ್ಲಿ pH ಮಾಪನ ಅತ್ಯಗತ್ಯ.",
            "common_mistakes": "pH 1 ಘಟಕ ಬದಲಾದರೆ ಆಮ್ಲೀಯತೆ ಕೇವಲ ದ್ವಿಗುಣವಾಗುತ್ತದೆ ಎಂದು ಭಾವಿಸುವುದು (ವಾಸ್ತವವಾಗಿ 10 ಪಟ್ಟು ಬದಲಾಗುತ್ತದೆ) ಅಥವಾ pH ಮತ್ತು pOH ಅನ್ನು ಅದಲುಬದಲು ಮಾಡುವುದು.",
        }
    if lang == "hi":
        nature_hi = "अम्लीय (Acidic)" if is_acid else ("क्षारीय (Basic)" if is_base else "उदासीन (Neutral)")
        return {
            "summary": f"{c} M {sol} विलयन का pH = {ph} और pOH = {poh} है, इसलिए यह विलयन {nature_hi} है।",
            "observation": f"[H⁺] आयन की सांद्रता {h_conc} M है। [H⁺] बढ़ने पर pH घटता है और अम्लीयता बढ़ती है, जबकि [OH⁻] बढ़ने पर pH मान 7 से अधिक हो जाता है।",
            "formula_explanation": f"pH = −log₁₀[H⁺] = {ph} तथा 25 °C पर pH + pOH = 14 ⇒ pOH = 14 − {ph} = {poh}।",
            "interpretation": f"pH पैमाना लघुगणकीय (logarithmic) है: pH में 1 इकाई का परिवर्तन [H⁺] सांद्रता में 10 गुना परिवर्तन दर्शाता है। यहाँ विलयन {nature_hi} श्रेणी में आता है।",
            "conclusion": f"{c} M {sol} वर्चुअल विलयन का pH = {ph} (pOH = {poh}) प्राप्त हुआ — प्रकृति: {nature_hi}।",
            "real_world_application": "पेयजल गुणवत्ता जांच, कृषि मिट्टी का pH प्रबंधन, मानव रक्त का pH नियंत्रण (7.35–7.45) और औषधि निर्माण में pH का उपयोग होता है।",
            "common_mistakes": "pH में 1 इकाई के बदलाव को 10 गुना की जगह 2 गुना समझ लेना या क्षार के लिए pOH को ही सीधे pH मान लेना।",
        }
    if lang == "te":
        nature_te = "ఆమ్ల (Acidic)" if is_acid else ("క్షార (Basic)" if is_base else "తటస్థ (Neutral)")
        return {
            "summary": f"{c} M {sol} ద్రావణం యొక్క pH = {ph} మరియు pOH = {poh}, కాబట్టి ఇది {nature_te} ద్రావణం.",
            "observation": f"[H⁺] అయాన్ గాఢత {h_conc} M గా లెక్కించబడింది. [H⁺] పెరిగే కొద్దీ pH తగ్గి ఆమ్లత్వం పెరుగుతుంది; [OH⁻] పెరిగితే pH విలువ 7 కంటే ఎక్కువ అవుతుంది.",
            "formula_explanation": f"pH = −log₁₀[H⁺] = {ph} మరియు 25 °C వద్ద pH + pOH = 14 ⇒ pOH = 14 − {ph} = {poh}.",
            "interpretation": f"pH స్కేల్ లాగరిథమిక్ కాబట్టి pH లో 1 యూనిట్ మార్పు [H⁺] గాఢతలో 10 రెట్లు మార్పును సూచిస్తుంది. ఈ ద్రావణం {nature_te} స్వభావాన్ని చూపుతుంది.",
            "conclusion": f"{c} M {sol} వర్చువల్ ద్రావణం pH = {ph} (pOH = {poh}) ఇస్తుంది — ఇది {nature_te} ద్రావణం.",
            "real_world_application": "త్రాగునీటి నాణ్యత పరీక్ష, వ్యవసాయ నేల pH నిర్వహణ, రక్తపు pH సమతుల్యత (7.35–7.45) మరియు ఔషధ తయారీలో pH కీలకం.",
            "common_mistakes": "pH లో 1 యూనిట్ మార్పు 10 రెట్లు గాఢత మార్పును సూచిస్తుందని మర్చిపోవడం లేదా క్షారాలకు pOH ని నేరుగా pH గా తీసుకోవడం.",
        }
    if lang == "ta":
        nature_ta = "அமில (Acidic)" if is_acid else ("கார (Basic)" if is_base else "நடுநிலை (Neutral)")
        return {
            "summary": f"{c} M {sol} கரைசலின் pH = {ph} மற்றும் pOH = {poh}; எனவே இது {nature_ta} கரைசலாகும்.",
            "observation": f"[H⁺] அயனிச் செறிவு {h_conc} M ஆகும். [H⁺] அதிகரிக்கும்போது pH குறைந்து அமிலத்தன்மை அதிகரிக்கிறது; [OH⁻] அதிகரிக்கும்போது pH மதிப்பு 7 ஐ விட அதிகமாகிறது.",
            "formula_explanation": f"pH = −log₁₀[H⁺] = {ph} மற்றும் 25 °C இல் pH + pOH = 14 ⇒ pOH = 14 − {ph} = {poh}.",
            "interpretation": f"pH அளவுகோல் மடக்கை (logarithmic) அடிப்படையிலானது: pH இல் 1 அலகு மாற்றம் [H⁺] செறிவில் 10 மடங்கு மாற்றத்தைக் குறிக்கும். இந்தக் கரைசல் {nature_ta} வரம்பில் உள்ளது.",
            "conclusion": f"{c} M {sol} மெய்நிகர் கரைசல் pH = {ph} (pOH = {poh}) அளிக்கிறது — {nature_ta} தன்மை.",
            "real_world_application": "குடிநீர் தர சோதனை, விவசாய மண் pH மேலாண்மை, மனித இரத்தத்தின் pH சமநிலை (7.35–7.45) மற்றும் மருந்து தயாரிப்பில் pH பயன்படுகிறது.",
            "common_mistakes": "pH இல் 1 அலகு மாற்றம் 10 மடங்கு [H⁺] மாற்றம் என்பதை மறப்பது அல்லது காரங்களுக்கு pOH மதிப்பை நேரடியாக pH எனக் கருதுவது.",
        }
    nature_en = "Acidic" if is_acid else ("Basic (Alkaline)" if is_base else "Neutral")
    return {
        "summary": f"A {c} M {sol} virtual solution has pH = {ph} and pOH = {poh}, making it {nature_en}.",
        "observation": f"The computed hydrogen ion concentration is [H⁺] = {h_conc} M. Increasing [H⁺] lowers pH (more acidic), while increasing [OH⁻] raises pH above 7.",
        "formula_explanation": f"Using pH = −log₁₀[H⁺] = {ph} and pH + pOH = 14 at 25 °C gives pOH = 14 − {ph} = {poh}.",
        "interpretation": f"Because pH is logarithmic, each 1-unit change in pH corresponds to a 10× change in [H⁺] concentration. This solution lies in the {nature_en} range.",
        "conclusion": f"The {c} M {sol} model yields pH = {ph}, pOH = {poh}, classified as {nature_en}.",
        "real_world_application": "Monitoring drinking water quality, soil pH in agriculture, human blood buffering (pH 7.35–7.45), and food/pharmaceutical quality control.",
        "common_mistakes": "Treating the pH scale as linear instead of 10× logarithmic per unit, or confusing pOH with pH for basic solutions.",
    }


def _explain_photosynthesis(params: dict[str, Any], m: dict[str, Any], lang: str) -> dict[str, str]:
    light = params.get("light_intensity", 500)
    co2 = params.get("co2_ppm", 400)
    temp = params.get("temperature", 25)
    o2 = m.get("o2_evolution_rate", m.get("o2_rate_umol_m2_s", 0))
    gluc = m.get("glucose_synthesis_rate", m.get("glucose_rate_umol_m2_s", 0))
    lim = m.get("limiting_factor", "Light Intensity")

    if lang == "kn":
        return {
            "summary": f"ಬೆಳಕು = {light} μmol/m²/s, CO₂ = {co2} ppm ಮತ್ತು ತಾಪಮಾನ = {temp} °C ನಲ್ಲಿ ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆಯ O₂ ಉತ್ಪಾದನಾ ದರ {o2} μmol/m²/s ಮತ್ತು ಗ್ಲೂಕೋಸ್ ಸಂಶ್ಲೇಷಣೆ {gluc} μmol/m²/s ಆಗಿದೆ.",
            "observation": f"ಪ್ರಸ್ತುತ ಮಿತಿಕಾರಕ ಅಂಶ (Limiting Factor): {lim}. ಬೆಳಕು, CO₂ ಮತ್ತು ತಾಪಮಾನದಲ್ಲಿ ಅತ್ಯಂತ ಕಡಿಮೆ ಲಭ್ಯವಿರುವ ಅಂಶವು ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆಯ ವೇಗವನ್ನು ನಿಯಂತ್ರಿಸುತ್ತದೆ.",
            "formula_explanation": f"6 CO₂ + 6 H₂O + ಬೆಳಕು → C₆H₁₂O₆ + 6 O₂. ಪ್ರತಿ 6 mol O₂ ಗೆ 1 mol ಗ್ಲೂಕೋಸ್ ಉತ್ಪತ್ತಿಯಾಗುವುದರಿಂದ ಗ್ಲೂಕೋಸ್ ದರ = O₂ ದರ / 6 = {o2} / 6 = {gluc} μmol/m²/s.",
            "interpretation": f"ಸಸ್ಯದ ಕ್ಲೋರೋಪ್ಲಾಸ್ಟ್‌ಗಳು ಬೆಳಕಿನ ಶಕ್ತಿಯನ್ನು ರಾಸಾಯನಿಕ ಶಕ್ತಿಯಾಗಿ ಪರಿವರ್ತಿಸುತ್ತಿವೆ. ತಾಪಮಾನ ಅತಿಯಾದರೆ ಕಿಣ್ವಗಳು (enzymes) ನಿಷ್ಕ್ರಿಯಗೊಂಡು ದರ ಕುಸಿಯುತ್ತದೆ.",
            "conclusion": f"ಈ ಸ್ಥಿತಿಯಲ್ಲಿ O₂ ದರ {o2} μmol/m²/s ದಾಖಲಾಗಿದ್ದು, {lim} ಪ್ರಮುಖ ಮಿತಿಕಾರಕವಾಗಿದೆ (ಬ್ಲ್ಯಾಕ್‌ಮನ್ ನಿಯಮ).",
            "real_world_application": "ಹಸಿರುಮನೆ (greenhouse) ಕೃಷಿಯಲ್ಲಿ ಬೆಳಕು ಮತ್ತು CO₂ ನಿಯಂತ್ರಣ, ಬೆಳೆ ಇಳುವರಿ ಹೆಚ್ಚಳ ಮತ್ತು ಜಾಗತಿಕ ಕಾರ್ಬನ್ ಚಕ್ರದ ಅಧ್ಯಯನ.",
            "common_mistakes": "ತಾಪಮಾನ ಹೆಚ್ಚಿದಷ್ಟೂ ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆ ಅನಿಯಮಿತವಾಗಿ ಹೆಚ್ಚಾಗುತ್ತದೆ ಎಂದು ಭಾವಿಸುವುದು (ಅತಿಯಾದ ಶಾಖದಲ್ಲಿ ಕಿಣ್ವಗಳು ನಿಷ್ಕ್ರಿಯಗೊಳ್ಳುತ್ತವೆ).",
        }
    if lang == "hi":
        return {
            "summary": f"प्रकाश = {light} μmol/m²/s, CO₂ = {co2} ppm और तापमान = {temp} °C पर प्रकाश संश्लेषण की O₂ उत्पादन दर {o2} μmol/m²/s तथा ग्लूकोज़ संश्लेषण दर {gluc} μmol/m²/s है।",
            "observation": f"वर्तमान सीमांत कारक (Limiting Factor): {lim}। प्रकाश, CO₂ और तापमान में से जो कारक सबसे कम अनुकूल होता है, वही अभिक्रिया की गति को सीमित करता है।",
            "formula_explanation": f"6 CO₂ + 6 H₂O + प्रकाश → C₆H₁₂O₆ + 6 O₂। प्रत्येक 6 mol O₂ पर 1 mol ग्लूकोज़ बनता है, इसलिए ग्लूकोज़ दर = {o2} / 6 = {gluc} μmol/m²/s।",
            "interpretation": f"पौधे के क्लोरोप्लास्ट प्रकाश ऊर्जा को रासायनिक ऊर्जा में बदल रहे हैं। अत्यधिक तापमान पर एंजाइम विकृत (denature) होने से दर तेजी से गिर जाती है।",
            "conclusion": f"ब्लैकमैन के सीमांत कारकों के नियम के अनुसार इस अवस्था में O₂ दर {o2} μmol/m²/s है और {lim} प्रमुख सीमांत कारक है।",
            "real_world_application": "ग्रीनहाउस खेती में प्रकाश व CO₂ संवर्धन, फसल उत्पादन अनुकूलन और वैश्विक कार्बन चक्र मॉडलिंग में इसका उपयोग होता है।",
            "common_mistakes": "यह मान लेना कि तापमान बढ़ाने से प्रकाश संश्लेषण हमेशा बढ़ता रहेगा (अधिक ताप पर एंजाइम निष्क्रिय हो जाते हैं) या सीमांत कारक की अनदेखी करना।",
        }
    if lang == "te":
        return {
            "summary": f"కాంతి = {light} μmol/m²/s, CO₂ = {co2} ppm మరియు ఉష్ణోగ్రత = {temp} °C వద్ద కిరణజన్య సంయోగక్రియ O₂ ఉత్పత్తి రేటు {o2} μmol/m²/s మరియు గ్లూకోజ్ రేటు {gluc} μmol/m²/s.",
            "observation": f"ప్రస్తుత పరిమితి కారకం (Limiting Factor): {lim}. కాంతి, CO₂ మరియు ఉష్ణోగ్రతలలో అత్యల్ప స్థాయిలో ఉన్న కారకం కిరణజన్య సంయోగక్రియ వేగాన్ని నియంత్రిస్తుంది.",
            "formula_explanation": f"6 CO₂ + 6 H₂O + కాంతి → C₆H₁₂O₆ + 6 O₂. ప్రతి 6 mol O₂ కు 1 mol గ్లూకోజ్ ఏర్పడుతుంది ⇒ గ్లూకోజ్ రేటు = {o2} / 6 = {gluc} μmol/m²/s.",
            "interpretation": f"క్లోరోప్లాస్ట్‌లు కాంతి శక్తిని రసాయన శక్తిగా మారుస్తున్నాయి. ఉష్ణోగ్రత అధికమైతే ఎంజైమ్‌లు దెబ్బతిని చర్య వేగం తగ్గుతుంది.",
            "conclusion": f"ఈ పరిస్థితులలో O₂ ఉత్పత్తి {o2} μmol/m²/s గా ఉంది మరియు {lim} ప్రధాన పరిమితి కారకంగా పనిచేస్తోంది.",
            "real_world_application": "గ్రీన్‌హౌస్ వ్యవసాయంలో కాంతి మరియు CO₂ నియంత్రణ, పంట దిగుబడి పెంపు మరియు పర్యావరణ కార్బన్ సమతుల్యత అధ్యయనం.",
            "common_mistakes": "ఉష్ణోగ్రత పెరిగే కొద్దీ కిరణజన్య సంయోగక్రియ ఎప్పుడూ పెరుగుతుందని అనుకోవడం (అధిక వేడిలో ఎంజైమ్‌లు నాశనమవుతాయి).",
        }
    if lang == "ta":
        return {
            "summary": f"ஒளி = {light} μmol/m²/s, CO₂ = {co2} ppm மற்றும் வெப்பநிலை = {temp} °C இல் ஒளிச்சேர்க்கையின் O₂ உற்பத்தி விகிதம் {o2} μmol/m²/s மற்றும் குளுக்கோஸ் விகிதம் {gluc} μmol/m²/s ஆகும்.",
            "observation": f"தற்போதைய கட்டுப்படுத்தும் காரணி (Limiting Factor): {lim}. ஒளி, CO₂ மற்றும் வெப்பநிலை ஆகியவற்றில் மிகக் குறைவாக உள்ள காரணி ஒளிச்சேர்க்கை வேகத்தைத் தீர்மானிக்கிறது.",
            "formula_explanation": f"6 CO₂ + 6 H₂O + ஒளி → C₆H₁₂O₆ + 6 O₂. 6 mol O₂ க்கு 1 mol குளுக்கோஸ் உருவாவதால் குளுக்கோஸ் விகிதம் = {o2} / 6 = {gluc} μmol/m²/s.",
            "interpretation": f"பசுங்கணிகங்கள் (chloroplasts) ஒளி ஆற்றலை வேதி ஆற்றலாக மாற்றுகின்றன. வெப்பநிலை மிக அதிகமானால் நொதிகள் (enzymes) சிதைந்து விகிதம் குறையும்.",
            "conclusion": f"பிளாக்மேன் விதியின்படி இந்த நிலையில் O₂ உற்பத்தி {o2} μmol/m²/s ஆகவும், {lim} முக்கிய கட்டுப்படுத்தும் காரணியாகவும் உள்ளது.",
            "real_world_application": "பசுமைக்குடில் விவசாயத்தில் ஒளி மற்றும் CO₂ கட்டுப்பாடு, பயிர் விளைச்சல் மேம்பாடு மற்றும் உலகளாவிய கார்பன் சுழற்சி ஆய்வு.",
            "common_mistakes": "வெப்பநிலை அதிகரித்தால் ஒளிச்சேர்க்கை எப்போதும் அதிகரிக்கும் என நினைப்பது (அதிக வெப்பத்தில் நொதிகள் சிதைவடையும்).",
        }
    return {
        "summary": f"At Light = {light} μmol/m²/s, CO₂ = {co2} ppm, and T = {temp} °C, the simulated photosynthesis O₂ release rate is {o2} μmol/m²/s (glucose rate = {gluc} μmol/m²/s).",
        "observation": f"The current primary limiting factor is {lim}. Raising a non-limiting input produces diminishing returns until the limiting factor is increased.",
        "formula_explanation": f"From 6 CO₂ + 6 H₂O + light → C₆H₁₂O₆ + 6 O₂, 1 mol of glucose is formed per 6 mol of O₂, so glucose synthesis = {o2} / 6 = {gluc} μmol/m²/s.",
        "interpretation": f"Chloroplasts convert photon energy into chemical bonds. Beyond optimal temperature (~25–30 °C), photosynthetic enzymes denature and the rate drops sharply.",
        "conclusion": f"Under Blackman's Law of Limiting Factors, O₂ production is {o2} μmol/m²/s and {lim} currently limits the rate.",
        "real_world_application": "Optimizing light, CO₂ enrichment, and temperature in commercial greenhouses and modeling forest carbon sequestration.",
        "common_mistakes": "Assuming higher temperature always increases photosynthesis indefinitely (enzymes denature above ~40 °C) or ignoring the active limiting factor.",
    }


def _explain_quadratic(params: dict[str, Any], m: dict[str, Any], lang: str) -> dict[str, str]:
    a = params.get("a", 1)
    b = params.get("b", -5)
    c = params.get("c", 6)
    disc = m.get("discriminant", 0)
    roots = m.get("roots_display", "")
    vx = m.get("vertex_x", 0)
    vy = m.get("vertex_y", 0)
    two_real = disc > 1e-9
    one_real = abs(disc) <= 1e-9

    if lang == "kn":
        nature = "ಎರಡು ವಿಭಿನ್ನ ವಾಸ್ತವ ಮೂಲಗಳು" if two_real else ("ಒಂದು ಪುನರಾವರ್ತಿತ ವಾಸ್ತವ ಮೂಲ" if one_real else "ಎರಡು ಸಂಕೀರ್ಣ ಮೂಲಗಳು")
        opens = "ಮೇಲ್ಮುಖವಾಗಿ (ಕನಿಷ್ಠ ಬಿಂದು)" if a > 0 else "ಕೆಳಮುಖವಾಗಿ (ಗರಿಷ್ಠ ಬಿಂದು)"
        return {
            "summary": f"{a}x² + ({b})x + ({c}) = 0 ವರ್ಗ ಸಮೀಕರಣದ ವಿವೇಚಕ Δ = {disc} ಆಗಿದ್ದು, ಪರಿಹಾರಗಳು: {roots}.",
            "observation": f"Δ = b² − 4ac = {disc} ಆದ್ದರಿಂದ ಸಮೀಕರಣವು {nature} ಹೊಂದಿದೆ. ಪರವಲಯವು {opens} ತೆರೆದಿದ್ದು, ಶೃಂಗ ({vx}, {vy}) ನಲ್ಲಿದೆ.",
            "formula_explanation": f"ವರ್ಗ ಸೂತ್ರ x = (−b ± √(b² − 4ac)) / (2a) ನಲ್ಲಿ a = {a}, b = {b}, c = {c} ಆದೇಶಿಸಿದಾಗ Δ = ({b})² − 4({a})({c}) = {disc} ಮತ್ತು {roots} ದೊರೆಯುತ್ತದೆ.",
            "interpretation": f"ಶೃಂಗ x = −b / (2a) = {vx} ಸಮ್ಮಿತಿ ಅಕ್ಷವಾಗಿದೆ. Δ > 0 ಆದಾಗ ವಕ್ರರೇಖೆ x-ಅಕ್ಷವನ್ನು ಎರಡು ಬಿಂದುಗಳಲ್ಲಿ ಕತ್ತರಿಸುತ್ತದೆ; Δ < 0 ಆದಾಗ ಕತ್ತರಿಸುವುದಿಲ್ಲ.",
            "conclusion": f"a = {a}, b = {b}, c = {c} ಗೆ Δ = {disc} ({nature}), ಪರಿಹಾರ {roots}, ಶೃಂಗ ({vx}, {vy}).",
            "real_world_application": "ಪ್ರಕ್ಷೇಪಕ ಪಥದ ಗರಿಷ್ಠ ಎತ್ತರ, ವ್ಯಾಪಾರ ಲಾಭ ಗರಿಷ್ಠೀಕರಣ ಮತ್ತು ಸೇತುವೆ ಕಮಾನುಗಳ ವಿನ್ಯಾಸದಲ್ಲಿ ವರ್ಗ ಸಮೀಕರಣಗಳು ಬಳಕೆಯಾಗುತ್ತವೆ.",
            "common_mistakes": "ಸೂತ್ರದಲ್ಲಿ −b ಚಿಹ್ನೆಯನ್ನು ಮರೆಯುವುದು, 2a ಬದಲು a ಯಿಂದ ಭಾಗಿಸುವುದು ಅಥವಾ Δ < 0 ಇದ್ದಾಗ ವಾಸ್ತವ ಮೂಲಗಳಿವೆ ಎಂದು ಭಾವಿಸುವುದು.",
        }
    if lang == "hi":
        nature = "दो भिन्न वास्तविक मूल" if two_real else ("एक पुनरावृत्त वास्तविक मूल" if one_real else "दो सम्मिश्र (Complex) मूल")
        opens = "ऊपर की ओर (न्यूनतम मान)" if a > 0 else "नीचे की ओर (अधिकतम मान)"
        return {
            "summary": f"द्विघात समीकरण {a}x² + ({b})x + ({c}) = 0 के लिए विविक्तकर Δ = {disc} और मूल {roots} प्राप्त हुए।",
            "observation": f"Δ = b² − 4ac = {disc} होने के कारण समीकरण के {nature} हैं। परवलय {opens} खुलता है और इसका शीर्ष ({vx}, {vy}) है।",
            "formula_explanation": f"द्विघात सूत्र x = (−b ± √(b² − 4ac)) / (2a) में a = {a}, b = {b}, c = {c} रखने पर Δ = ({b})² − 4({a})({c}) = {disc} तथा हल {roots} मिलता है।",
            "interpretation": f"शीर्ष का x-निर्देशांक −b / (2a) = {vx} सममिति अक्ष को दर्शाता है। Δ > 0 पर ग्राफ़ x-अक्ष को दो बिंदुओं पर काटता है और Δ < 0 पर नहीं काटता।",
            "conclusion": f"a = {a}, b = {b}, c = {c} के लिए Δ = {disc} ({nature}), मूल {roots}, शीर्ष ({vx}, {vy})।",
            "real_world_application": "प्रक्षेप्य गति की ऊँचाई, लाभ अधिकतमीकरण, ऑप्टिकल परावर्तक और पुलों के मेहराब डिज़ाइन में द्विघात समीकरणों का उपयोग होता है।",
            "common_mistakes": "सूत्र में −b का चिह्न भूलना, 2a के बजाय केवल a से भाग देना या Δ < 0 होने पर भी वास्तविक मूल ढूँढना।",
        }
    if lang == "te":
        nature = "రెండు విభిన్న వాస్తవ మూలాలు" if two_real else ("ఒకే పునరావృత వాస్తవ మూలం" if one_real else "రెండు సంకీర్ణ (Complex) మూలాలు")
        opens = "పైకి (కనిష్ట బిందువు)" if a > 0 else "క్రిందికి (గరిష్ట బిందువు)"
        return {
            "summary": f"{a}x² + ({b})x + ({c}) = 0 వర్గ సమీకరణానికి విచక్షణి Δ = {disc} మరియు మూలాలు: {roots}.",
            "observation": f"Δ = b² − 4ac = {disc} కావడంతో ఈ సమీకరణానికి {nature} ఉన్నాయి. పరావలయం {opens} తెరుచుకుంటుంది మరియు శీర్షం ({vx}, {vy}) వద్ద ఉంది.",
            "formula_explanation": f"వర్గ సూత్రం x = (−b ± √(b² − 4ac)) / (2a) లో a = {a}, b = {b}, c = {c} ప్రతిక్షేపించగా Δ = ({b})² − 4({a})({c}) = {disc} మరియు {roots} వస్తాయి.",
            "interpretation": f"శీర్షం x = −b / (2a) = {vx} సౌష్ఠవ అక్షం. Δ > 0 ఉన్నప్పుడు వక్రం x-అక్షాన్ని రెండు బిందువులలో ఖండిస్తుంది; Δ < 0 వద్ద ఖండించదు.",
            "conclusion": f"a = {a}, b = {b}, c = {c} కు Δ = {disc} ({nature}), మూలాలు {roots}, శీర్షం ({vx}, {vy}).",
            "real_world_application": "ప్రక్షేపక పథం, వ్యాపార లాభ గరిష్టీకరణ మరియు వంతెన ఆర్చ్‌ల ఇంజనీరింగ్‌లో వర్గ సమీకరణాలు ఉపయోగపడతాయి.",
            "common_mistakes": "సూత్రంలో −b గుర్తును మర్చిపోవడం, 2a బదులుగా a తో భాగించడం లేదా Δ < 0 ఉన్నప్పుడు వాస్తవ మూలాలు ఉంటాయని భావించడం.",
        }
    if lang == "ta":
        nature = "இரண்டு வெவ்வேறு மெய் மூலங்கள்" if two_real else ("ஒரு சமமான மெய் மூலம்" if one_real else "இரண்டு கலப்பு எண் மூலங்கள்")
        opens = "மேல்நோக்கி (குறைந்தபட்ச மதிப்பு)" if a > 0 else "கீழ்நோக்கி (அதிகபட்ச மதிப்பு)"
        return {
            "summary": f"{a}x² + ({b})x + ({c}) = 0 இருபடிச் சமன்பாட்டிற்கு தன்மைக்காட்டி Δ = {disc} மற்றும் மூலங்கள்: {roots}.",
            "observation": f"Δ = b² − 4ac = {disc} என்பதால் சமன்பாட்டிற்கு {nature} உள்ளன. பரவளையம் {opens} திறந்து உச்சி ({vx}, {vy}) இல் அமைந்துள்ளது.",
            "formula_explanation": f"இருபடி சூத்திரம் x = (−b ± √(b² − 4ac)) / (2a) இல் a = {a}, b = {b}, c = {c} பிரதியிட Δ = ({b})² − 4({a})({c}) = {disc} மற்றும் தீர்வு {roots} கிடைக்கிறது.",
            "interpretation": f"உச்சி x = −b / (2a) = {vx} சமச்சீர் அச்சாகும். Δ > 0 எனில் வளைவு x-அச்சை இரு புள்ளிகளில் வெட்டும்; Δ < 0 எனில் வெட்டாது.",
            "conclusion": f"a = {a}, b = {b}, c = {c} ஆகியவற்றிற்கு Δ = {disc} ({nature}), தீர்வு {roots}, உச்சி ({vx}, {vy}).",
            "real_world_application": "எறிபொருள் பாதை, இலாப உச்சநிலை கணக்கீடு, பரவளைய எதிரொளிப்பான்கள் மற்றும் பால வளைவு வடிவமைப்பில் பயன்படுகிறது.",
            "common_mistakes": "சூத்திரத்தில் −b குறியை மறப்பது, 2a க்குப் பதிலாக a ஆல் வகுப்பது அல்லது Δ < 0 இருக்கும்போது மெய் மூலங்கள் இருப்பதாகக் கருதுவது.",
        }
    nature_en = "Two Distinct Real Roots" if two_real else ("One Repeated Real Root" if one_real else "Two Complex Conjugate Roots")
    opens_en = "upward (minimum at vertex)" if a > 0 else "downward (maximum at vertex)"
    return {
        "summary": f"For {a}x² + ({b})x + ({c}) = 0, the discriminant is Δ = {disc} and the solutions are {roots}.",
        "observation": f"Because Δ = b² − 4ac = {disc}, the equation has {nature_en}. The parabola opens {opens_en} with vertex at ({vx}, {vy}).",
        "formula_explanation": f"Substituting a = {a}, b = {b}, c = {c} into x = (−b ± √(b² − 4ac)) / (2a) gives Δ = ({b})² − 4({a})({c}) = {disc}, yielding {roots}.",
        "interpretation": f"The axis of symmetry lies at x = −b / (2a) = {vx}. The parabola crosses the x-axis twice when Δ > 0, touches once when Δ = 0, and stays above/below the axis when Δ < 0.",
        "conclusion": f"The quadratic equation has Δ = {disc} ({nature_en}), solutions {roots}, and vertex ({vx}, {vy}).",
        "real_world_application": "Projectile trajectory modeling, profit optimization in economics, parabolic reflectors, and suspension bridge arch engineering.",
        "common_mistakes": "Dropping the negative sign on −b, dividing by a instead of 2a, or assuming real roots exist when Δ < 0.",
    }


def _explain_simple_pendulum(params: dict[str, Any], m: dict[str, Any], lang: str) -> dict[str, str]:
    L = m.get("length", params.get("length", 1.0))
    g = m.get("gravity", params.get("gravity", 9.81))
    T = m.get("time_period", 2.0)
    f = m.get("frequency", 0.5)
    ang = m.get("initial_angle", params.get("initial_angle", 10))
    dev = m.get("large_angle_deviation_percent", 0)

    if lang == "kn":
        return {
            "summary": f"ಉದ್ದ L = {L} m ಮತ್ತು ಗುರುತ್ವ g = {g} m/s² ಇರುವ ಸರಳ ಲೋಲಕದ ಆವರ್ತನ ಕಾಲ T = {T} s ಮತ್ತು ಆವೃತ್ತಿ f = {f} Hz ಆಗಿದೆ.",
            "observation": f"ಉದ್ದ ಹೆಚ್ಚಾದಂತೆ ಆವರ್ತನ ಕಾಲ √L ಅನುಪಾತದಲ್ಲಿ ಹೆಚ್ಚಾಗುತ್ತದೆ ಮತ್ತು ಗುರುತ್ವ ಹೆಚ್ಚಾದಂತೆ ಕಡಿಮೆಯಾಗುತ್ತದೆ. θ₀ = {ang}° ಕೋನದಲ್ಲಿ ದೊಡ್ಡ-ಕೋನ ವ್ಯತ್ಯಾಸ {dev}% ಆಗಿದೆ.",
            "formula_explanation": f"T = 2π√(L / g) = 2π√({L} / {g}) = {T} s, ಮತ್ತು ಆವೃತ್ತಿ f = 1 / T = {f} Hz.",
            "interpretation": f"ಲೋಲಕದ ಆವರ್ತನ ಕಾಲವು ಬಾಬ್‌ನ ದ್ರವ್ಯರಾಶಿಯ ಮೇಲೆ ಅವಲಂಬಿತವಾಗಿಲ್ಲ; ಕೇವಲ ಉದ್ದ L ಮತ್ತು ಗುರುತ್ವ g ಮೇಲೆ ಅವಲಂಬಿತವಾಗಿದೆ.",
            "conclusion": f"L = {L} m, g = {g} m/s² ಗೆ ಸರಳ ಲೋಲಕವು T = {T} s (f = {f} Hz) ನಲ್ಲಿ ಆಂದೋಲನಗೊಳ್ಳುತ್ತದೆ.",
            "real_world_application": "ಲೋಲಕ ಗಡಿಯಾರಗಳು, ಮೆಟ್ರೋನೋಮ್‌ಗಳು, ಭೂಕಂಪಮಾಪಕಗಳು ಮತ್ತು ಸ್ಥಳೀಯ ಗುರುತ್ವ g ಅಳತೆ.",
            "common_mistakes": "ಬಾಬ್‌ನ ದ್ರವ್ಯರಾಶಿ ಹೆಚ್ಚಾದರೆ ಆವರ್ತನ ಕಾಲ ಬದಲಾಗುತ್ತದೆ ಎಂದು ಭಾವಿಸುವುದು ಅಥವಾ ದೊಡ್ಡ ಕೋನಗಳಲ್ಲಿ ಸಣ್ಣ-ಕೋನ ಸೂತ್ರವನ್ನು ತಪ್ಪಾಗಿ ಬಳಸುವುದು.",
        }
    if lang == "hi":
        return {
            "summary": f"लंबाई L = {L} m और गुरुत्व g = {g} m/s² के सरल लोलक का आवर्तकाल T = {T} s और आवृत्ति f = {f} Hz है।",
            "observation": f"लंबाई बढ़ाने पर आवर्तकाल √L के अनुपात में बढ़ता है और गुरुत्व बढ़ने पर घटता है। θ₀ = {ang}° पर बड़े-कोण का विचलन {dev}% है।",
            "formula_explanation": f"T = 2π√(L / g) = 2π√({L} / {g}) = {T} s, तथा आवृत्ति f = 1 / T = {f} Hz।",
            "interpretation": f"लोलक का आवर्तकाल गोलक के द्रव्यमान पर निर्भर नहीं करता, केवल प्रभावी लंबाई L और गुरुत्वीय त्वरण g पर निर्भर करता है।",
            "conclusion": f"L = {L} m और g = {g} m/s² के लिए T = {T} s तथा f = {f} Hz प्राप्त हुआ।",
            "real_world_application": "लोलक घड़ियाँ, मेट्रोनोम, भूकंपमापी (seismometers) और स्थानीय गुरुत्वीय त्वरण g का मापन।",
            "common_mistakes": "यह मान लेना कि भारी गोलक तेज़ दोलन करेगा (द्रव्यमान सूत्र में नहीं आता) या बड़े कोणों पर विचलन की अनदेखी करना।",
        }
    if lang == "te":
        return {
            "summary": f"పొడవు L = {L} m మరియు గురుత్వం g = {g} m/s² గల సరళ లోలకం యొక్క ఆవర్తన కాలం T = {T} s, పౌనఃపున్యం f = {f} Hz.",
            "observation": f"పొడవు పెరిగితే ఆవర్తన కాలం √L నిష్పత్తిలో పెరుగుతుంది; గురుత్వం పెరిగితే తగ్గుతుంది. θ₀ = {ang}° వద్ద పెద్ద-కోణ విచలనం {dev}%.",
            "formula_explanation": f"T = 2π√(L / g) = 2π√({L} / {g}) = {T} s, మరియు f = 1 / T = {f} Hz.",
            "interpretation": f"ఆవర్తన కాలం లోలక గుండు ద్రవ్యరాశిపై ఆధారపడదు; పొడవు L మరియు గురుత్వ త్వరణం g పై మాత్రమే ఆధారపడుతుంది.",
            "conclusion": f"L = {L} m, g = {g} m/s² వద్ద ఆవర్తన కాలం T = {T} s (f = {f} Hz) గా నిర్ధారించబడింది.",
            "real_world_application": "లోలక గడియారాలు, మెట్రోనోమ్‌లు, భూకంప మాపకాలు మరియు స్థానిక గురుత్వం g కొలత.",
            "common_mistakes": "లోలక గుండు బరువు పెరిగితే ఆవర్తన కాలం మారుతుందని భావించడం లేదా పెద్ద కోణాలలో చిన్న-కోణ సూత్రాన్ని అలాగే వాడటం.",
        }
    if lang == "ta":
        return {
            "summary": f"நீளம் L = {L} m மற்றும் ஈர்ப்பு g = {g} m/s² கொண்ட தனி ஊசலின் அலைவு நேரம் T = {T} s மற்றும் அதிர்வெண் f = {f} Hz ஆகும்.",
            "observation": f"நீளம் அதிகரிக்கும்போது அலைவு நேரம் √L விகிதத்தில் அதிகரிக்கும்; ஈர்ப்பு அதிகரித்தால் குறையும். θ₀ = {ang}° இல் பெரிய கோண விலகல் {dev}%.",
            "formula_explanation": f"T = 2π√(L / g) = 2π√({L} / {g}) = {T} s, மற்றும் f = 1 / T = {f} Hz.",
            "interpretation": f"அலைவு நேரம் ஊசல் குண்டின் நிறையைச் சார்ந்ததல்ல; நீளம் L மற்றும் ஈர்ப்பு முடுக்கம் g ஆகியவற்றை மட்டுமே சார்ந்துள்ளது.",
            "conclusion": f"L = {L} m, g = {g} m/s² இல் அலைவு நேரம் T = {T} s (f = {f} Hz) உறுதிசெய்யப்பட்டது.",
            "real_world_application": "ஊசல் கடிகாரங்கள், மெட்ரோனோம், நிலநடுக்க அளவிகள் மற்றும் உள்ளூர் ஈர்ப்பு முடுக்கம் g அளவீடு.",
            "common_mistakes": "ஊசல் குண்டின் எடை அலைவு நேரத்தை மாற்றும் என நினைப்பது அல்லது பெரிய கோணங்களில் சிறிய கோண சூத்திரத்தை அப்படியே பயன்படுத்துவது.",
        }
    return {
        "summary": f"A simple pendulum of length L = {L} m under gravity g = {g} m/s² oscillates with period T = {T} s and frequency f = {f} Hz.",
        "observation": f"Period scales with √L and inversely with √g. At release angle θ₀ = {ang}°, the large-angle deviation from the small-angle model is {dev}%.",
        "formula_explanation": f"Using T = 2π√(L / g) = 2π√({L} / {g}) = {T} s, the oscillation frequency is f = 1 / T = {f} Hz.",
        "interpretation": f"Period is independent of bob mass because gravitational pull and inertia both scale with mass; quadrupling L doubles T.",
        "conclusion": f"At L = {L} m and g = {g} m/s², the computed period is T = {T} s (f = {f} Hz).",
        "real_world_application": "Pendulum clocks, musical metronomes, seismometers, and precision measurement of local gravitational acceleration g.",
        "common_mistakes": "Assuming a heavier bob swings faster (mass cancels out) or ignoring large-angle deviations above ~15°.",
    }


REVIEWED_EXPLAINERS = {
    "ohms-law": _explain_ohms_law,
    "acids-bases-ph": _explain_acids_bases_ph,
    "photosynthesis": _explain_photosynthesis,
    "quadratic-equations": _explain_quadratic,
    "simple-pendulum": _explain_simple_pendulum,
}


# ---------------------------------------------------------------------------
# Universal 5-Language Explanation Builder for ALL 48 Experiments
# ---------------------------------------------------------------------------

def _build_universal_explanation(
    *,
    experiment_title: str,
    discipline: str,
    difficulty: str,
    parameters: dict[str, Any],
    formatted_measurements: list[dict[str, Any]],
    formulas: list[str],
    conclusion_en: str,
    applications_en: list[str],
    lang: str,
) -> dict[str, str]:
    """Generate genuine, full-sentence localized explanations for ANY of the 48 experiments."""
    disc_local = DISCIPLINE_NAMES.get(discipline, {}).get(lang, discipline)
    param_str = ", ".join(
        f"{localize_measurement_label(k, k, lang)} = {v}" for k, v in parameters.items()
    ) or "—"
    meas_parts = []
    for item in formatted_measurements[:5]:
        lbl = localize_measurement_label(item["key"], item["label"], lang)
        unit = f" {item['unit']}" if item.get("unit") else ""
        meas_parts.append(f"{lbl} = {item['value']}{unit}")
    meas_str = "; ".join(meas_parts) or "—"
    formula_str = " | ".join(formulas[:3]) if formulas else "—"

    if lang == "kn":
        return {
            "summary": f"{experiment_title} ({disc_local} · {difficulty}) ಸಿಮ್ಯುಲೇಶನ್‌ನಲ್ಲಿ ನಿಮ್ಮ ನಿಯತಾಂಕಗಳಿಗೆ ({param_str}) ಪ್ರಮುಖ ಫಲಿತಾಂಶಗಳು: {meas_str}.",
            "observation": f"ನಿಯತಾಂಕಗಳನ್ನು ({param_str}) ಬದಲಾಯಿಸಿದಾಗ ನಿಖರ ವೈಜ್ಞಾನಿಕ ಮಾದರಿಯ ಪ್ರಕಾರ ಫಲಿತಾಂಶಗಳು ತಕ್ಷಣವೇ ನವೀಕರಣಗೊಂಡಿವೆ: {meas_str}.",
            "formula_explanation": f"ಈ ಲೆಕ್ಕಾಚಾರವು ಪ್ರಮಾಣಿತ ಸಮೀಕರಣಗಳನ್ನು ({formula_str}) ಬಳಸಿ ನಿರ್ಧಾರಕವಾಗಿ (deterministically) ನಿಖರ ಸಂಖ್ಯಾತ್ಮಕ ಮೌಲ್ಯಗಳನ್ನು ನೀಡುತ್ತದೆ.",
            "interpretation": f"ಲೆಕ್ಕಹಾಕಿದ ಮೌಲ್ಯಗಳು ({meas_str}) ಈ {disc_local} ನಿಯಮದ ಪ್ರಾಯೋಗಿಕ ವರ್ತನೆಯನ್ನು ತೋರಿಸುತ್ತವೆ. ಒಂದೇ ನಿಯತಾಂಕವನ್ನು ಬದಲಿಸಿ ಗ್ರಾಫ್‌ನ ಪ್ರವೃತ್ತಿಯನ್ನು ಗಮನಿಸಿ.",
            "conclusion": f"{experiment_title} ಪ್ರಯೋಗದಲ್ಲಿ ನೀಡಲಾದ ನಿಯತಾಂಕಗಳಿಗೆ ({param_str}) ವೈಜ್ಞಾನಿಕವಾಗಿ ನಿಖರ ಫಲಿತಾಂಶಗಳು ({meas_str}) ದೃಢಪಟ್ಟಿವೆ.",
            "real_world_application": f"ಈ {disc_local} ತತ್ವವನ್ನು ವಿಜ್ಞಾನ, ಎಂಜಿನಿಯರಿಂಗ್, ದೈನಂದಿನ ತಂತ್ರಜ್ಞಾನ ಮತ್ತು ಸಂಶೋಧನಾ ವಿಶ್ಲೇಷಣೆಗಳಲ್ಲಿ ವ್ಯಾಪಕವಾಗಿ ಬಳಸಲಾಗುತ್ತದೆ.",
            "common_mistakes": "SI ಏಕಮಾನಗಳನ್ನು ಮಿಶ್ರಣ ಮಾಡುವುದು, ಮಾದರಿಯ ಮಾನ್ಯತಾ ಮಿತಿಗಳನ್ನು ಮೀರುವುದು ಅಥವಾ ಒಂದೇ ಬಾರಿಗೆ ಹಲವು ನಿಯತಾಂಕಗಳನ್ನು ಬದಲಿಸಿ ಕಾರಣವನ್ನು ತಪ್ಪಾಗಿ ಅರ್ಥೈಸುವುದು.",
        }
    if lang == "hi":
        return {
            "summary": f"{experiment_title} ({disc_local} · {difficulty}) सिमुलेशन में दिए गए मानों ({param_str}) के लिए गणना किए गए प्रमुख परिणाम: {meas_str}।",
            "observation": f"नियतांक ({param_str}) बदलने पर वैज्ञानिक मॉडल ने तुरंत सटीक परिणाम उत्पन्न किए: {meas_str}।",
            "formula_explanation": f"यह गणना मानक सूत्रों ({formula_str}) पर आधारित है, जहाँ सभी मात्रक (SI units) और संख्यात्मक मान पूरी तरह सटीक रहते हैं।",
            "interpretation": f"प्राप्त मान ({meas_str}) इस {disc_local} सिद्धांत के वास्तविक व्यवहार को दर्शाते हैं। एक समय में एक ही मान बदलकर ग्राफ़ में परिवर्तन देखें।",
            "conclusion": f"{experiment_title} प्रयोग में इनपुट ({param_str}) के लिए वैज्ञानिक परिणाम ({meas_str}) सफलतापूर्वक सत्यापित हुए।",
            "real_world_application": f"इस {disc_local} सिद्धांत का उपयोग आधुनिक इंजीनियरिंग, वैज्ञानिक उपकरणों और दैनिक जीवन की तकनीकों में किया जाता है।",
            "common_mistakes": "SI मात्रकों को आपस में मिला देना, मॉडल की वैध सीमा के बाहर मान लेना या एक साथ कई पैरामीटर बदलकर संबंध को गलत समझना।",
        }
    if lang == "te":
        return {
            "summary": f"{experiment_title} ({disc_local} · {difficulty}) సిమ్యులేషన్‌లో ఇచ్చిన పరామితులకు ({param_str}) లెక్కించిన ఫలితాలు: {meas_str}.",
            "observation": f"పరామితులు ({param_str}) మార్చినప్పుడు ఖచ్చితమైన శాస్త్రీయ సమీకరణాల ద్వారా తక్షణ ఫలితాలు నమోదయ్యాయి: {meas_str}.",
            "formula_explanation": f"ఈ గణన ప్రామాణిక సూత్రాలను ({formula_str}) ఉపయోగించి SI ప్రమాణాలు మరియు సంఖ్యాత్మక విలువలను మార్చకుండా ఖచ్చితమైన సమాధానాన్ని ఇస్తుంది.",
            "interpretation": f"లెక్కించిన ఫలితాలు ({meas_str}) ఈ {disc_local} నియమం యొక్క శాస్త్రీయ సంబంధాన్ని చూపుతాయి. ఒక పరామితిని మార్చి గ్రాఫ్ ధోరణిని పరిశీలించండి.",
            "conclusion": f"{experiment_title} ప్రయోగంలో ({param_str}) కు ఖచ్చితమైన ఫలితాలు ({meas_str}) నిర్ధారించబడ్డాయి.",
            "real_world_application": f"ఈ {disc_local} సూత్రాన్ని ఇంజనీరింగ్, ప్రయోగశాల విశ్లేషణలు మరియు రోజువారీ సాంకేతికతలో విస్తృతంగా ఉపయోగిస్తారు.",
            "common_mistakes": "SI ప్రమాణాలను తప్పుగా మార్చడం, మోడల్ పరిమితులను పట్టించుకోకపోవడం లేదా ఒకేసారి అనేక పరామితులను మార్చి ఫలితాన్ని తప్పుగా అర్థం చేసుకోవడం.",
        }
    if lang == "ta":
        return {
            "summary": f"{experiment_title} ({disc_local} · {difficulty}) உருவகப்படுத்துதலில் ({param_str}) அளவுருக்களுக்கான கணக்கிடப்பட்ட முடிவுகள்: {meas_str}.",
            "observation": f"அளவுருக்கள் ({param_str}) மாற்றப்பட்டவுடன் துல்லியமான அறிவியல் மாதிரியின் மூலம் முடிவுகள் உடனுக்குடன் கணக்கிடப்பட்டன: {meas_str}.",
            "formula_explanation": f"இந்தக் கணக்கீடு தரநிலை சூத்திரங்களை ({formula_str}) பயன்படுத்தி SI அலகுகள் மற்றும் எண் மதிப்புகளை மாற்றாமல் துல்லியமாக அளிக்கிறது.",
            "interpretation": f"கிடைத்த மதிப்புகள் ({meas_str}) இந்த {disc_local} கோட்பாட்டின் அறிவியல் தொடர்பை விளக்குகின்றன. ஒரு அளவுருவை மட்டும் மாற்றி வரைபட மாற்றத்தைக் காண்க.",
            "conclusion": f"{experiment_title} சோதனையில் ({param_str}) அளவுருக்களுக்கான முடிவுகள் ({meas_str}) அறிவியல் ரீதியாக உறுதிப்படுத்தப்பட்டன.",
            "real_world_application": f"இந்த {disc_local} கோட்பாடு பொறியியல், ஆய்வக பகுப்பாய்வு மற்றும் அன்றாட அறிவியல் தொழில்நுட்பங்களில் பரவலாகப் பயன்படுகிறது.",
            "common_mistakes": "SI அலகுகளை தவறாக மாற்றுவது, மாதிரியின் வரம்புகளை மீறுவது அல்லது ஒரே நேரத்தில் பல அளவுருக்களை மாற்றி காரணத்தை தவறாக புரிந்துகொள்வது.",
        }
    # English default
    return {
        "summary": conclusion_en,
        "observation": f"With input parameters ({param_str}), the deterministic {discipline} model computed: {meas_str}.",
        "formula_explanation": f"Calculated directly from the governing equations ({formula_str}) preserving exact SI units and numerical precision.",
        "interpretation": f"These measurements ({meas_str}) quantify how your chosen parameters govern the physical or mathematical system. Vary one slider at a time to observe sensitivity on the graph.",
        "conclusion": conclusion_en,
        "real_world_application": applications_en[0] if applications_en else f"Widely applied across modern {discipline}, engineering, and scientific analysis.",
        "common_mistakes": "Mixing SI units, ignoring the physical validity bounds of the model, or changing multiple parameters at once while interpreting a single variable's effect.",
    }


def _explanation_cache_key(
    experiment_id: str,
    target_lang: str,
    parameters: dict[str, Any],
) -> str:
    canonical_params = json.dumps(parameters, sort_keys=True)
    raw = f"exp_explanation:{CONTENT_VERSION}:{experiment_id}:en:{target_lang}:{canonical_params}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _unavailable_notice(lang: str) -> str:
    return {
        "kn": "ಆಯ್ಕೆ ಮಾಡಿದ ಕನ್ನಡ ಭಾಷೆಯಲ್ಲಿ ವಿವರಣೆ ತಾತ್ಕಾಲಿಕವಾಗಿ ಲಭ್ಯವಿಲ್ಲ. ಕೆಳಗಿನ ಬಟನ್ ಬಳಸಿ ಮೂಲ ಇಂಗ್ಲಿಷ್ ವಿವರಣೆಯನ್ನು ನೋಡಬಹುದು.",
        "hi": "चयनित हिंदी भाषा में व्याख्या अस्थायी रूप से उपलब्ध नहीं है। आप नीचे दिए बटन से मूल अंग्रेज़ी व्याख्या देख सकते हैं।",
        "te": "ఎంచుకున్న తెలుగు భాషలో వివరణ తాత్కాలికంగా అందుబాటులో లేదు. క్రింది బటన్‌తో అసలు ఇంగ్లీష్ వివరణను చూడవచ్చు.",
        "ta": "தேர்ந்தெடுக்கப்பட்ட தமிழ் மொழியில் விளக்கம் தற்காலிகமாக கிடைக்கவில்லை. கீழுள்ள பொத்தான் மூலம் ஆங்கில மூல விளக்கத்தைப் பார்க்கலாம்.",
    }.get(
        lang,
        "Localized explanation is temporarily unavailable in the selected language. Use the toggle below to view the English original.",
    )


async def generate_localized_result_explanation(
    db: sqlite3.Connection | None,
    *,
    experiment_id: str,
    experiment_title: str,
    discipline: str,
    difficulty: str,
    language: str,
    parameters: dict[str, Any],
    measurements: dict[str, Any],
    formatted_measurements: list[dict[str, Any]],
    formulas: list[str],
    conclusion_en: str,
    applications_en: list[str] | None = None,
    settings: Settings | None = None,
    force_translation_failure: bool = False,
) -> dict[str, Any]:
    """Build structured, scientifically exact localized explanation for simulation results."""
    lang = normalize_language(language)
    apps = applications_en or []

    # Always prepare the authoritative English original for optional comparison
    if experiment_id in REVIEWED_EXPLAINERS:
        english_original = REVIEWED_EXPLAINERS[experiment_id](parameters, measurements, "en")
    else:
        english_original = _build_universal_explanation(
            experiment_title=experiment_title,
            discipline=discipline,
            difficulty=difficulty,
            parameters=parameters,
            formatted_measurements=formatted_measurements,
            formulas=formulas,
            conclusion_en=conclusion_en,
            applications_en=apps,
            lang="en",
        )

    if lang == "en":
        return {
            "language": "en",
            **english_original,
            "provider": "deterministic_en",
            "translation_available": True,
            "error_notice": None,
            "english_original": english_original,
        }

    # Explicit translation failure handling (never silently masquerade English as regional!)
    if force_translation_failure:
        return {
            "language": lang,
            "summary": "",
            "observation": "",
            "formula_explanation": "",
            "interpretation": "",
            "conclusion": "",
            "real_world_application": "",
            "provider": "translation_unavailable",
            "translation_available": False,
            "error_notice": _unavailable_notice(lang),
            "english_original": english_original,
        }

    # 1. Reviewed experiment-specific native templates (highest accuracy, instant, offline-safe)
    if experiment_id in REVIEWED_EXPLAINERS:
        localized = REVIEWED_EXPLAINERS[experiment_id](parameters, measurements, lang)
        return {
            "language": lang,
            **localized,
            "provider": "reviewed_localized_engine",
            "translation_available": True,
            "error_notice": None,
            "english_original": english_original,
        }

    # 2. Check versioned SQLite cache (keyed by content_version + experiment_id + target_lang + params)
    cache_key = _explanation_cache_key(experiment_id, lang, parameters)
    if db is not None:
        cached = db.execute(
            "SELECT translated_text, provider FROM translations_cache WHERE cache_key = ?",
            (cache_key,),
        ).fetchone()
        if cached is not None:
            try:
                parsed = json.loads(cached["translated_text"])
                if isinstance(parsed, dict) and parsed.get("summary") and parsed.get("conclusion"):
                    return {
                        "language": lang,
                        **parsed,
                        "provider": cached["provider"],
                        "translation_available": True,
                        "error_notice": None,
                        "english_original": english_original,
                    }
            except (ValueError, TypeError):
                pass

    # 3. Optional OpenRouter enrichment for rich dynamic translations (strictly preserving numbers & units)
    cfg = settings or get_settings()
    if cfg.is_openrouter_configured:
        try:
            lang_name = SUPPORTED_LANGUAGES[lang]
            url = f"{cfg.openrouter_base_url.rstrip('/')}/chat/completions"
            headers = {
                "Authorization": f"Bearer {cfg.openrouter_api_key.strip()}",
                "Content-Type": "application/json",
                "HTTP-Referer": cfg.openrouter_site_url,
                "X-Title": cfg.app_name,
            }
            system_prompt = (
                f"You are LabXAI's scientific localization assistant. Translate and adapt the experiment result "
                f"explanation into natural, accurate {lang_name}. "
                "STRICT RULES: Keep ALL numbers, formulas, chemical symbols, variable names, and SI units EXACT. "
                "NEVER change any calculated measurement. Do NOT respond in English. "
                "Return ONLY valid JSON with keys: summary, observation, formula_explanation, interpretation, conclusion, real_world_application."
            )
            payload = {
                "model": cfg.openrouter_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": json.dumps(english_original, ensure_ascii=False)},
                ],
                "temperature": 0.2,
                "max_tokens": 700,
            }
            async with httpx.AsyncClient(timeout=cfg.openrouter_timeout_seconds) as client:
                resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                raw_content = resp.json().get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                if raw_content.startswith("```"):
                    raw_content = raw_content.strip("`").lstrip("json").strip()
                parsed = json.loads(raw_content)
                required_keys = (
                    "summary",
                    "observation",
                    "formula_explanation",
                    "interpretation",
                    "conclusion",
                    "real_world_application",
                )
                if isinstance(parsed, dict) and all(isinstance(parsed.get(k), str) and parsed[k].strip() for k in required_keys):
                    clean = {k: parsed[k].strip() for k in required_keys}
                    if db is not None:
                        db.execute(
                            """
                            INSERT OR REPLACE INTO translations_cache (
                                cache_key, source_lang, target_lang, source_text, translated_text, provider, created_at
                            ) VALUES (?, ?, ?, ?, ?, ?, ?)
                            """,
                            (
                                cache_key,
                                "en",
                                lang,
                                json.dumps(english_original, ensure_ascii=False),
                                json.dumps(clean, ensure_ascii=False),
                                "openrouter_localized",
                                datetime.now(timezone.utc).isoformat(),
                            ),
                        )
                        db.commit()
                    return {
                        "language": lang,
                        **clean,
                        "provider": "openrouter_localized",
                        "translation_available": True,
                        "error_notice": None,
                        "english_original": english_original,
                    }
        except Exception:
            pass  # Fall through cleanly to our universal localized engine

    # 4. Universal native 5-language multidisciplinary explanation engine (full natural regional sentences)
    universal = _build_universal_explanation(
        experiment_title=experiment_title,
        discipline=discipline,
        difficulty=difficulty,
        parameters=parameters,
        formatted_measurements=formatted_measurements,
        formulas=formulas,
        conclusion_en=conclusion_en,
        applications_en=apps,
        lang=lang,
    )
    return {
        "language": lang,
        **universal,
        "provider": "localized_multidisciplinary_engine",
        "translation_available": True,
        "error_notice": None,
        "english_original": english_original,
    }
