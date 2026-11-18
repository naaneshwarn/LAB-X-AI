"""Reusable multilingual translation service with scientific symbol protection and SQLite cache.

Supports English (en), Kannada (kn), Hindi (hi), Telugu (te), and Tamil (ta).
Protects scientific formulas, chemical formulas, numbers, and SI units from distortion.
"""

from __future__ import annotations

import hashlib
import re
import sqlite3
from datetime import datetime, timezone

import httpx

from app.core.config import Settings, get_settings
from app.schemas.translation import TranslateResponse

SUPPORTED_LANG_CODES = {
    "en": "English",
    "kn": "Kannada (ಕನ್ನಡ)",
    "hi": "Hindi (हिन्दी)",
    "te": "Telugu (తెలుగు)",
    "ta": "Tamil (தமிழ்)",
}

# Pattern matching formulas, chemical species, numeric values with SI units, and code spans
SCIENTIFIC_TOKEN_RE = re.compile(
    r"(`[^`]+`"
    r"|[A-Za-z0-9₀-₉]+(?:\s*[=≈⇌→+\-×÷/]\s*[A-Za-z0-9₀-₉²³π√().]+)+"
    r"|\b\d+(?:\.\d+)?\s*(?:m/s²|m/s|kJ/mol|g/mol|L/min|mmHg|kcal|μmol/m²/s|μm⁻¹|μm|nm|mm|cm|mL|kPa|atm|mol|eV|Hz|THz|Ω|V|A|W|J|K|S|D|T|M|°C|°|%)\b"
    r"|\b(?:H₂O|CO₂|O₂|N₂|H₂|CH₄|NH₃|NaCl|HCl|NaOH|CH₃COOH|Fe₂O₃|C₆H₁₂O₆|ATP|DNA|mRNA|pH|pOH)\b)"
)

# Curated scientific glossary across Kannada, Hindi, Telugu, and Tamil
SCIENTIFIC_GLOSSARY: dict[str, dict[str, str]] = {
    "kn": {
        "voltage": "ವೋಲ್ಟೇಜ್",
        "current": "ವಿದ್ಯುತ್ ಪ್ರವಾಹ",
        "resistance": "ರೋಧ",
        "power": "ಶಕ್ತಿ",
        "gravity": "ಗುರುತ್ವ",
        "pendulum": "ಲೋಲಕ",
        "frequency": "ಆವೃತ್ತಿ",
        "velocity": "ವೇಗ",
        "acceleration": "ವೇಗೋತ್ಕರ್ಷ",
        "force": "ಬಲ",
        "friction": "ಘರ್ಷಣೆ",
        "reflection": "ಪ್ರತಿಫಲನ",
        "refraction": "ವಕ್ರೀಭವನ",
        "lens": "ಮಸೂರ",
        "wavelength": "ತರಂಗಾಂತರ",
        "atom": "ಪರಮಾಣು",
        "electron": "ಎಲೆಕ್ಟ್ರಾನ್",
        "proton": "ಪ್ರೋಟಾನ್",
        "neutron": "ನ್ಯೂಟ್ರಾನ್",
        "acid": "ಆಮ್ಲ",
        "base": "ಪ್ರತ್ಯಾಮ್ಲ",
        "equilibrium": "ಸಮತೋಲನ",
        "cell": "ಜೀವಕೋಶ",
        "photosynthesis": "ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆ",
        "genetics": "ತಳಿಶಾಸ್ತ್ರ",
        "mitosis": "ಮೈಟೋಸಿಸ್",
        "meiosis": "ಮಿಯೋಸಿಸ್",
        "derivative": "ವ್ಯುತ್ಪನ್ನ",
        "integral": "ಸಮಾಕಲನ",
        "matrix": "ಮ್ಯಾಟ್ರಿಕ್ಸ್",
        "probability": "ಸಂಭವನೀಯತೆ",
        "triangle": "ತ್ರಿಭುಜ",
        "circle": "ವೃತ್ತ",
        "experiment": "ಪ್ರಯೋಗ",
        "simulation": "ಸಿಮ್ಯುಲೇಶನ್",
        "formula": "ಸೂತ್ರ",
        "temperature": "ತಾಪಮಾನ",
        "pressure": "ಒತ್ತಡ",
        "energy": "ಶಕ್ತಿ",
    },
    "hi": {
        "voltage": "वोल्टेज",
        "current": "विद्युत धारा",
        "resistance": "प्रतिरोध",
        "power": "शक्ति",
        "gravity": "गुरुत्वाकर्षण",
        "pendulum": "लोलक",
        "frequency": "आवृत्ति",
        "velocity": "वेग",
        "acceleration": "त्वरण",
        "force": "बल",
        "friction": "घर्षण",
        "reflection": "परावर्तन",
        "refraction": "अपवर्तन",
        "lens": "लेंस",
        "wavelength": "तरंगदैर्ध्य",
        "atom": "परमाणु",
        "electron": "इलेक्ट्रॉन",
        "proton": "प्रोटॉन",
        "neutron": "न्यूट्रॉन",
        "acid": "अम्ल",
        "base": "क्षार",
        "equilibrium": "साम्यावस्था",
        "cell": "कोशिका",
        "photosynthesis": "प्रकाश संश्लेषण",
        "genetics": "आनुवंशिकी",
        "mitosis": "समसूत्री विभाजन",
        "meiosis": "अर्धसूत्री विभाजन",
        "derivative": "अवकलज",
        "integral": "समाकलन",
        "matrix": "आव्यूह",
        "probability": "प्रायिकता",
        "triangle": "त्रिभुज",
        "circle": "वृत्त",
        "experiment": "प्रयोग",
        "simulation": "सिमुलेशन",
        "formula": "सूत्र",
        "temperature": "तापमान",
        "pressure": "दाब",
        "energy": "ऊर्जा",
    },
    "te": {
        "voltage": "వోల్టేజ్",
        "current": "విద్యుత్ ప్రవాహం",
        "resistance": "నిరోధం",
        "power": "సామర్థ్యం",
        "gravity": "గురుత్వాకర్షణ",
        "pendulum": "లోలకం",
        "frequency": "పౌనఃపున్యం",
        "velocity": "వేగం",
        "acceleration": "త్వరణం",
        "force": "బలం",
        "friction": "ఘర్షణ",
        "reflection": "పరావర్తనం",
        "refraction": "వక్రీభవనం",
        "lens": "కటకం",
        "wavelength": "తరంగదైర్ఘ్యం",
        "atom": "పరమాణువు",
        "electron": "ఎలక్ట్రాన్",
        "proton": "ప్రోటాన్",
        "neutron": "న్యూట్రాన్",
        "acid": "ఆమ్లం",
        "base": "క్షారం",
        "equilibrium": "సమతాస్థితి",
        "cell": "కణం",
        "photosynthesis": "కిరణజన్య సంయోగక్రియ",
        "genetics": "జన్యుశాస్త్రం",
        "mitosis": "సమవిభజన",
        "meiosis": "క్షయకరణ విభజన",
        "derivative": "అవకలజం",
        "integral": "సమాకలనం",
        "matrix": "మాత్రిక",
        "probability": "సంభావ్యత",
        "triangle": "త్రిభుజం",
        "circle": "వృత్తం",
        "experiment": "ప్రయోగం",
        "simulation": "సిమ్యులేషన్",
        "formula": "సూత్రం",
        "temperature": "ఉష్ణోగ్రత",
        "pressure": "పీడనం",
        "energy": "శక్తి",
    },
    "ta": {
        "voltage": "மின்னழுத்தம்",
        "current": "மின்னோட்டம்",
        "resistance": "மின்தடை",
        "power": "திறன்",
        "gravity": "ஈர்ப்பு விசை",
        "pendulum": "ஊசல்",
        "frequency": "அதிர்வெண்",
        "velocity": "திசைவேகம்",
        "acceleration": "முடுக்கம்",
        "force": "விசை",
        "friction": "உராய்வு",
        "reflection": "எதிரொளிப்பு",
        "refraction": "ஒளி விலகல்",
        "lens": "லென்ஸ்",
        "wavelength": "அலைநீளம்",
        "atom": "அணு",
        "electron": "எலக்ட்ரான்",
        "proton": "புரோட்டான்",
        "neutron": "நியூட்ரான்",
        "acid": "அமிலம்",
        "base": "காரம்",
        "equilibrium": "சமநிலை",
        "cell": "செல்",
        "photosynthesis": "ஒளிச்சேர்க்கை",
        "genetics": "மரபியல்",
        "mitosis": "மைட்டாசிஸ்",
        "meiosis": "மியாசிஸ்",
        "derivative": "வகைக்கெழு",
        "integral": "தொகையீடு",
        "matrix": "அணி",
        "probability": "நிகழ்தகவு",
        "triangle": "முக்கோணம்",
        "circle": "வட்டம்",
        "experiment": "சோதனை",
        "simulation": "உருவகப்படுத்துதல்",
        "formula": "சூத்திரம்",
        "temperature": "வெப்பநிலை",
        "pressure": "அழுத்தம்",
        "energy": "ஆற்றல்",
    },
}


def protect_scientific_tokens(text: str) -> tuple[str, list[str]]:
    """Replace scientific formulas, chemical symbols, and SI unit measurements with placeholders."""
    tokens: list[str] = []

    def _repl(match: re.Match[str]) -> str:
        idx = len(tokens)
        tokens.append(match.group(0))
        return f"[[SCI_{idx}]]"

    masked = SCIENTIFIC_TOKEN_RE.sub(_repl, text)
    return masked, tokens


def restore_scientific_tokens(text: str, tokens: list[str]) -> str:
    """Restore preserved scientific tokens back into translated output."""
    out = text
    for idx, tok in enumerate(tokens):
        out = out.replace(f"[[SCI_{idx}]]", tok)
    return out


CONTENT_VERSION = "v2"


def _cache_key(source_lang: str, target_lang: str, text: str, content_version: str = CONTENT_VERSION) -> str:
    """Cache key strictly bound to content version, source lang, target lang, and source hash."""
    h = hashlib.sha256(f"{content_version}:{source_lang}:{target_lang}:{text}".encode("utf-8")).hexdigest()
    return h


def _glossary_translate(text: str, source_lang: str, target_lang: str) -> tuple[str, list[str]]:
    """Deterministic scientific glossary translation preserving all symbols & formulas."""
    masked, tokens = protect_scientific_tokens(text)

    if target_lang == "en" and source_lang in SCIENTIFIC_GLOSSARY:
        # Reverse glossary lookup (Indic -> English key terms)
        rev_map = {v: k for k, v in SCIENTIFIC_GLOSSARY[source_lang].items()}
        matched = [f"{ind} = {en}" for ind, en in rev_map.items() if ind in masked]
        restored = restore_scientific_tokens(masked, tokens)
        if matched:
            return f"{restored} [Terms: {', '.join(matched[:6])}]", tokens
        return restored, tokens

    glossary = SCIENTIFIC_GLOSSARY.get(target_lang, {})
    matched_terms: list[str] = []
    lower_masked = masked.lower()
    for en_term, local_term in glossary.items():
        if re.search(rf"\b{re.escape(en_term)}\b", lower_masked):
            matched_terms.append(f"{en_term} ({local_term})")

    restored = restore_scientific_tokens(masked, tokens)
    if matched_terms:
        header = {
            "kn": "ಪ್ರಮುಖ ವೈಜ್ಞಾನಿಕ ಪದಗಳು",
            "hi": "प्रमुख वैज्ञानिक शब्द",
            "te": "ముఖ్య శాస్త్రీయ పదాలు",
            "ta": "முக்கிய அறிவியல் சொற்கள்",
        }.get(target_lang, "Key Terms")
        return f"{restored}\n[{header}: {', '.join(matched_terms[:8])}]", tokens

    return restored, tokens


async def translate_text(
    db: sqlite3.Connection,
    *,
    text: str,
    source_lang: str = "en",
    target_lang: str = "kn",
    preserve_scientific_terms: bool = True,
    settings: Settings | None = None,
) -> TranslateResponse:
    """Translate text with scientific token protection, SQLite caching, and optional OpenRouter provider."""
    cfg = settings or get_settings()
    src = source_lang.strip().lower()
    tgt = target_lang.strip().lower()

    if src not in SUPPORTED_LANG_CODES:
        raise ValueError(f"Unsupported source language '{source_lang}'. Supported: {', '.join(SUPPORTED_LANG_CODES)}.")
    if tgt not in SUPPORTED_LANG_CODES:
        raise ValueError(f"Unsupported target language '{target_lang}'. Supported: {', '.join(SUPPORTED_LANG_CODES)}.")

    if src == tgt or not text.strip():
        return TranslateResponse(
            source_lang=src,
            target_lang=tgt,
            original_text=text,
            translated_text=text,
            provider="passthrough",
            cached=False,
            preserved_tokens=[],
        )

    # 1. Check SQLite cache
    key = _cache_key(src, tgt, text)
    cached_row = db.execute(
        "SELECT translated_text, provider FROM translations_cache WHERE cache_key = ?", (key,)
    ).fetchone()
    if cached_row is not None:
        _, tokens = protect_scientific_tokens(text) if preserve_scientific_terms else (text, [])
        return TranslateResponse(
            source_lang=src,
            target_lang=tgt,
            original_text=text,
            translated_text=cached_row["translated_text"],
            provider=cached_row["provider"],
            cached=True,
            preserved_tokens=tokens,
        )

    masked, tokens = protect_scientific_tokens(text) if preserve_scientific_terms else (text, [])

    # 2. If OpenRouter is configured, perform neural scientific translation preserving [[SCI_i]] tokens
    if cfg.is_openrouter_configured:
        try:
            url = f"{cfg.openrouter_base_url.rstrip('/')}/chat/completions"
            headers = {
                "Authorization": f"Bearer {cfg.openrouter_api_key.strip()}",
                "Content-Type": "application/json",
                "HTTP-Referer": cfg.openrouter_site_url,
                "X-Title": cfg.app_name,
            }
            prompt = (
                f"Translate the following educational text from {SUPPORTED_LANG_CODES[src]} to {SUPPORTED_LANG_CODES[tgt]}. "
                "CRITICAL: Keep every placeholder token like [[SCI_0]], [[SCI_1]], all mathematical equations, chemical symbols, "
                "numbers, and SI units completely unchanged. Output ONLY the translated text."
            )
            payload = {
                "model": cfg.openrouter_model,
                "messages": [
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": masked},
                ],
                "temperature": 0.2,
                "max_tokens": 800,
            }
            async with httpx.AsyncClient(timeout=cfg.openrouter_timeout_seconds) as client:
                resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                content = resp.json().get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                if content:
                    final_text = restore_scientific_tokens(content, tokens) if preserve_scientific_terms else content
                    db.execute(
                        """
                        INSERT OR REPLACE INTO translations_cache (
                            cache_key, source_lang, target_lang, source_text, translated_text, provider, created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)
                        """,
                        (key, src, tgt, text, final_text, "openrouter", datetime.now(timezone.utc).isoformat()),
                    )
                    db.commit()
                    return TranslateResponse(
                        source_lang=src,
                        target_lang=tgt,
                        original_text=text,
                        translated_text=final_text,
                        provider="openrouter",
                        cached=False,
                        preserved_tokens=tokens,
                    )
        except Exception:
            pass  # Fall back cleanly to glossary helper with explicit notice

    # 3. Deterministic offline scientific glossary fallback (transparently labeled, never pretending to be full neural translation)
    translated, tokens = _glossary_translate(text, src, tgt)
    full_translated = False
    db.execute(
        """
        INSERT OR REPLACE INTO translations_cache (
            cache_key, source_lang, target_lang, source_text, translated_text, provider, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (key, src, tgt, text, translated, "scientific_glossary_fallback", datetime.now(timezone.utc).isoformat()),
    )
    db.commit()
    return TranslateResponse(
        source_lang=src,
        target_lang=tgt,
        original_text=text,
        translated_text=translated,
        provider="scientific_glossary_fallback",
        cached=False,
        translation_available=full_translated,
        preserved_tokens=tokens,
        notice=(
            "Full neural translation is temporarily unavailable (OPENROUTER_API_KEY not configured). "
            "Showing scientific glossary annotation with original English text and exact formulas/SI units preserved."
        ),
    )
