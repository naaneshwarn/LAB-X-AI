"""Independent Multi-Provider Backend Regional Text-to-Speech (TTS) Service for LabXAI.

Eliminates dependence on Windows/browser-installed OS voices for Indian regional languages:
- English (en-IN)
- Kannada (kn-IN)
- Hindi   (hi-IN)
- Tamil   (ta-IN)
- Telugu  (te-IN)

Supported providers via `TTS_PROVIDER` in backend/.env:
1. `edge`   — Zero-credential Microsoft Neural Voices via `edge-tts` (MP3, works out-of-the-box)
2. `sarvam` — Sarvam AI Bulbul TTS REST API (WAV, requires TTS_API_KEY)
3. `azure`  — Microsoft Azure Speech REST API (MP3, requires TTS_API_KEY + TTS_REGION)
4. `google` — Google Cloud Text-to-Speech REST API (MP3, requires TTS_API_KEY)
"""

from __future__ import annotations

import asyncio
import base64
import hashlib
import html
import importlib.util
import re
import time
from pathlib import Path
from typing import Any

import httpx

from app.core.config import BACKEND_DIR, Settings, get_settings

TTS_CACHE_DIR = BACKEND_DIR / "tts_cache"
TTS_CACHE_DIR.mkdir(parents=True, exist_ok=True)
MAX_CACHE_FILES = 200

LOCALE_BY_LANG: dict[str, str] = {
    "en": "en-IN",
    "kn": "kn-IN",
    "hi": "hi-IN",
    "ta": "ta-IN",
    "te": "te-IN",
}

SARVAM_DEFAULT_SPEAKERS: dict[str, str] = {
    "en": "anushka",
    "kn": "anushka",
    "hi": "anushka",
    "ta": "anushka",
    "te": "anushka",
}

GOOGLE_DEFAULT_VOICES: dict[str, str] = {
    "en": "en-IN-Neural2-A",
    "kn": "kn-IN-Standard-A",
    "hi": "hi-IN-Neural2-A",
    "ta": "ta-IN-Standard-A",
    "te": "te-IN-Standard-A",
}

# Language-appropriate verbalizations for common scientific symbols so TTS never skips units
SYMBOL_SPEECH_MAP: dict[str, dict[str, str]] = {
    "en": {"Ω": " ohms ", "°C": " degrees Celsius ", "°": " degrees ", "×": " times ", "⇒": ", therefore ", "→": " gives ", "−": " minus ", "≤": " less than or equal to ", "≥": " greater than or equal to ", "≠": " not equal to ", "Δ": " delta ", "π": " pi ", "μ": " micro "},
    "kn": {"Ω": " ಓಂ ", "°C": " ಡಿಗ್ರಿ ಸೆಲ್ಸಿಯಸ್ ", "°": " ಡಿಗ್ರಿ ", "×": " ಗುಣಿಸು ", "⇒": ", ಆದ್ದರಿಂದ ", "→": " ನೀಡುತ್ತದೆ ", "−": " ಮೈನಸ್ ", "Δ": " ಡೆಲ್ಟಾ ", "π": " ಪೈ ", "μ": " ಮೈಕ್ರೋ "},
    "hi": {"Ω": " ओम ", "°C": " डिग्री सेल्सियस ", "°": " डिग्री ", "×": " गुणा ", "⇒": ", इसलिए ", "→": " देता है ", "−": " माइनस ", "Δ": " डेल्टा ", "π": " पाई ", "μ": " माइक्रो "},
    "ta": {"Ω": " ஓம் ", "°C": " டிகிரி செல்சியஸ் ", "°": " டிகிரி ", "×": " பெருக்கல் ", "⇒": ", எனவே ", "→": " தருகிறது ", "−": " கழித்தல் ", "Δ": " டெல்டா ", "π": " பை ", "μ": " மைக்ரோ "},
    "te": {"Ω": " ఓం ", "°C": " డిగ్రీ సెల్సియస్ ", "°": " డిగ్రీలు ", "×": " గుణించు ", "⇒": ", కాబట్టి ", "→": " ఇస్తుంది ", "−": " మైనస్ ", "Δ": " డెల్టా ", "π": " పై ", "μ": " మైక్రో "},
}

SUBSCRIPT_TRANS = str.maketrans("₀₁₂₃₄₅₆₇₈₉²³⁺⁻", "012345678923+-")


class TtsError(RuntimeError):
    """Explicit backend TTS synthesis error."""


def prepare_text_for_tts(text: str, language: str = "en") -> str:
    """Strip raw Markdown formatting while preserving Unicode scripts, units, and scientific meaning."""
    lang = (language or "en").strip().lower()[:2]
    clean = str(text or "")

    # 1. Remove Markdown syntax (bold, code spans, headings, links, list dashes)
    clean = re.sub(r"```[\s\S]*?```", " ", clean)
    clean = re.sub(r"\*\*(.*?)\*\*", r"\1", clean)
    clean = re.sub(r"\*(.*?)\*", r"\1", clean)
    clean = re.sub(r"`([^`]+)`", r"\1", clean)
    clean = re.sub(r"^\s*#{1,6}\s*", "", clean, flags=re.MULTILINE)
    clean = re.sub(r"^\s*[-•>]\s+", "", clean, flags=re.MULTILINE)
    clean = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", clean)

    # 2. Convert scientific symbols to spoken equivalents without dropping values/units
    sym_map = SYMBOL_SPEECH_MAP.get(lang, SYMBOL_SPEECH_MAP["en"])
    for sym, spoken in sym_map.items():
        clean = clean.replace(sym, spoken)

    # 3. Normalize Unicode subscripts/superscripts (CO₂ -> CO2, H⁺ -> H+) for clear speech
    clean = clean.translate(SUBSCRIPT_TRANS)

    # 4. Collapse excessive whitespace & newlines cleanly into pauses
    clean = re.sub(r"\n+", ". ", clean)
    clean = re.sub(r"\s+", " ", clean).strip()
    clean = re.sub(r"\.\s*\.", ".", clean)
    return clean


def split_text_chunks(text: str, max_chars: int = 450) -> list[str]:
    """Split long text on sentence boundaries without losing sentence order."""
    if len(text) <= max_chars:
        return [text]
    sentences = re.split(r"(?<=[.!?।])\s+", text)
    chunks: list[str] = []
    current = ""
    for sent in sentences:
        if not sent:
            continue
        if len(current) + len(sent) + 1 <= max_chars:
            current = f"{current} {sent}".strip()
        else:
            if current:
                chunks.append(current)
            if len(sent) <= max_chars:
                current = sent
            else:
                # Hard wrap very long single sentence on spaces
                words = sent.split()
                buf = ""
                for w in words:
                    if len(buf) + len(w) + 1 <= max_chars:
                        buf = f"{buf} {w}".strip()
                    else:
                        if buf:
                            chunks.append(buf)
                        buf = w
                current = buf
    if current:
        chunks.append(current)
    return chunks or [text[:max_chars]]


def _cleanup_old_cache_files(ttl_hours: int = 24) -> None:
    """Safely prune expired or excess cached audio files."""
    try:
        now = time.time()
        ttl_sec = max(1, ttl_hours) * 3600
        files = sorted(
            [p for p in TTS_CACHE_DIR.iterdir() if p.is_file() and p.suffix in (".mp3", ".wav")],
            key=lambda p: p.stat().st_mtime,
            reverse=True,
        )
        for idx, path in enumerate(files):
            if idx >= MAX_CACHE_FILES or (now - path.stat().st_mtime) > ttl_sec:
                path.unlink(missing_ok=True)
    except OSError:
        pass


def _speed_to_edge_rate(speed: float) -> str:
    pct = int(round((speed - 1.0) * 100))
    pct = max(-50, min(100, pct))
    return f"+{pct}%" if pct >= 0 else f"{pct}%"


def get_tts_provider_status(settings: Settings | None = None) -> dict[str, Any]:
    """Return honest status of the configured backend TTS provider."""
    cfg = settings or get_settings()
    provider = (cfg.tts_provider or "edge").strip().lower()
    voices = {lang: cfg.get_tts_voice(lang) for lang in LOCALE_BY_LANG}

    if provider == "disabled":
        return {"available": False, "provider": "disabled", "voices": voices, "message": "Backend TTS is disabled."}
    if provider == "edge":
        installed = importlib.util.find_spec("edge_tts") is not None
        return {
            "available": installed,
            "provider": "edge",
            "voices": voices,
            "message": (
                "Microsoft Neural TTS (edge-tts) active for en-IN, kn-IN, hi-IN, ta-IN, and te-IN."
                if installed
                else "edge-tts package is not installed in backend/.venv."
            ),
        }
    if provider in ("sarvam", "azure", "google"):
        configured = cfg.is_tts_api_key_configured
        return {
            "available": configured,
            "provider": provider,
            "voices": voices,
            "message": (
                f"{provider.title()} regional TTS configured."
                if configured
                else f"TTS_PROVIDER={provider} requires TTS_API_KEY in backend/.env."
            ),
        }
    return {"available": False, "provider": provider, "voices": voices, "message": f"Unknown TTS provider '{provider}'."}


async def _synthesize_edge(chunks: list[str], voice: str, speed: float, timeout: float) -> bytes:
    if importlib.util.find_spec("edge_tts") is None:
        raise TtsError("edge-tts is not installed in backend/.venv.")
    import edge_tts  # type: ignore[import-not-found]

    rate_str = _speed_to_edge_rate(speed)
    audio_parts: list[bytes] = []

    async def _synth_chunk(chunk_text: str) -> bytes:
        comm = edge_tts.Communicate(text=chunk_text, voice=voice, rate=rate_str)
        buf = bytearray()
        async for ev in comm.stream():
            if ev.get("type") == "audio" and ev.get("data"):
                buf.extend(ev["data"])
        return bytes(buf)

    for chunk in chunks:
        part = await asyncio.wait_for(_synth_chunk(chunk), timeout=timeout)
        if not part:
            raise TtsError(f"Edge Neural TTS returned empty audio for voice '{voice}'.")
        audio_parts.append(part)
    return b"".join(audio_parts)


async def _synthesize_sarvam(
    chunks: list[str], language: str, voice: str, speed: float, cfg: Settings, client: httpx.AsyncClient | None
) -> bytes:
    if not cfg.is_tts_api_key_configured:
        raise TtsError("TTS_API_KEY is required for Sarvam AI TTS.")
    locale = LOCALE_BY_LANG[language]
    speaker = voice if voice and not voice.endswith("Neural") else SARVAM_DEFAULT_SPEAKERS[language]
    url = "https://api.sarvam.ai/text-to-speech"
    headers = {"api-subscription-key": cfg.tts_api_key.strip(), "Content-Type": "application/json"}
    payload = {
        "inputs": [chunks[0][:500]],
        "target_language_code": locale,
        "speaker": speaker,
        "pace": max(0.5, min(2.0, speed)),
        "model": cfg.tts_model or "bulbul:v2",
    }
    if client is not None:
        resp = await client.post(url, headers=headers, json=payload, timeout=cfg.tts_timeout_seconds)
    else:
        async with httpx.AsyncClient(timeout=cfg.tts_timeout_seconds) as c:
            resp = await c.post(url, headers=headers, json=payload)
    if resp.status_code != 200:
        raise TtsError(f"Sarvam AI TTS failed with HTTP {resp.status_code}.")
    audios = resp.json().get("audios") or []
    if not audios:
        raise TtsError("Sarvam AI TTS returned no audio payload.")
    return base64.b64decode(audios[0])


async def _synthesize_azure(
    chunks: list[str], language: str, voice: str, speed: float, cfg: Settings, client: httpx.AsyncClient | None
) -> bytes:
    if not cfg.is_tts_api_key_configured:
        raise TtsError("TTS_API_KEY is required for Microsoft Azure Speech TTS.")
    locale = LOCALE_BY_LANG[language]
    rate_str = _speed_to_edge_rate(speed)
    escaped = html.escape(" ".join(chunks))
    ssml = (
        f"<speak version='1.0' xml:lang='{locale}'>"
        f"<voice xml:lang='{locale}' name='{voice}'>"
        f"<prosody rate='{rate_str}'>{escaped}</prosody>"
        f"</voice></speak>"
    )
    url = f"https://{cfg.tts_region}.tts.speech.microsoft.com/cognitiveservices/v1"
    headers = {
        "Ocp-Apim-Subscription-Key": cfg.tts_api_key.strip(),
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        "User-Agent": "LabXAI-Backend",
    }
    if client is not None:
        resp = await client.post(url, headers=headers, content=ssml.encode("utf-8"), timeout=cfg.tts_timeout_seconds)
    else:
        async with httpx.AsyncClient(timeout=cfg.tts_timeout_seconds) as c:
            resp = await c.post(url, headers=headers, content=ssml.encode("utf-8"))
    if resp.status_code != 200 or not resp.content:
        raise TtsError(f"Azure Speech TTS failed with HTTP {resp.status_code}.")
    return resp.content


async def _synthesize_google(
    chunks: list[str], language: str, voice: str, speed: float, cfg: Settings, client: httpx.AsyncClient | None
) -> bytes:
    if not cfg.is_tts_api_key_configured:
        raise TtsError("TTS_API_KEY is required for Google Cloud Text-to-Speech.")
    locale = LOCALE_BY_LANG[language]
    g_voice = voice if voice and not voice.endswith("Neural") else GOOGLE_DEFAULT_VOICES[language]
    url = f"https://texttospeech.googleapis.com/v1/text:synthesize?key={cfg.tts_api_key.strip()}"
    payload = {
        "input": {"text": " ".join(chunks)},
        "voice": {"languageCode": locale, "name": g_voice},
        "audioConfig": {"audioEncoding": "MP3", "speakingRate": max(0.5, min(2.0, speed))},
    }
    if client is not None:
        resp = await client.post(url, json=payload, timeout=cfg.tts_timeout_seconds)
    else:
        async with httpx.AsyncClient(timeout=cfg.tts_timeout_seconds) as c:
            resp = await c.post(url, json=payload)
    if resp.status_code != 200:
        raise TtsError(f"Google Cloud TTS failed with HTTP {resp.status_code}.")
    audio_b64 = resp.json().get("audioContent")
    if not audio_b64:
        raise TtsError("Google Cloud TTS returned empty audioContent.")
    return base64.b64decode(audio_b64)


async def synthesize_speech(
    *,
    text: str,
    language: str = "en",
    speed: float = 1.0,
    settings: Settings | None = None,
    client: httpx.AsyncClient | None = None,
) -> dict[str, Any]:
    """Synthesize regional-language speech and return safe cached audio URL + provider metadata."""
    cfg = settings or get_settings()
    lang = (language or "en").strip().lower()[:2]
    if lang not in LOCALE_BY_LANG:
        raise ValueError(f"Unsupported TTS language '{language}'. Supported: {', '.join(LOCALE_BY_LANG)}.")

    cleaned = prepare_text_for_tts(text, lang)
    if not cleaned:
        raise ValueError("Text for speech synthesis cannot be empty after cleaning.")
    if len(cleaned) > cfg.tts_max_text_chars:
        cleaned = cleaned[: cfg.tts_max_text_chars]

    clamped_speed = round(max(0.5, min(2.0, float(speed))), 2)
    provider = (cfg.tts_provider or "edge").strip().lower()
    if provider == "disabled":
        raise TtsError("Backend TTS provider is disabled in server configuration.")

    voice = cfg.get_tts_voice(lang)
    ext = ".wav" if provider == "sarvam" else ".mp3"
    content_type = "audio/wav" if ext == ".wav" else "audio/mpeg"

    # Anonymous content-addressed cache key (never stores student identifiers)
    cache_hash = hashlib.sha256(
        f"tts:v1:{provider}:{voice}:{lang}:{clamped_speed}:{cleaned}".encode("utf-8")
    ).hexdigest()[:32]
    cache_filename = f"{cache_hash}{ext}"
    cache_path = TTS_CACHE_DIR / cache_filename

    t0 = time.perf_counter()
    if cache_path.is_file() and cache_path.stat().st_size > 256:
        return {
            "success": True,
            "audio_url": f"/api/v1/speech/tts/audio/{cache_filename}",
            "content_type": content_type,
            "language": lang,
            "locale": LOCALE_BY_LANG[lang],
            "voice": voice,
            "provider": provider,
            "cached": True,
            "audio_bytes": cache_path.stat().st_size,
            "generation_ms": round((time.perf_counter() - t0) * 1000.0, 1),
            "error": None,
        }

    chunks = split_text_chunks(cleaned, max_chars=450)
    if provider == "edge":
        audio_bytes = await _synthesize_edge(chunks, voice, clamped_speed, cfg.tts_timeout_seconds)
    elif provider == "sarvam":
        audio_bytes = await _synthesize_sarvam(chunks, lang, voice, clamped_speed, cfg, client)
    elif provider == "azure":
        audio_bytes = await _synthesize_azure(chunks, lang, voice, clamped_speed, cfg, client)
    elif provider == "google":
        audio_bytes = await _synthesize_google(chunks, lang, voice, clamped_speed, cfg, client)
    else:
        raise TtsError(f"Unsupported TTS_PROVIDER '{provider}'.")

    # Atomic write to cache & background prune
    tmp_path = TTS_CACHE_DIR / f"{cache_hash}.tmp"
    tmp_path.write_bytes(audio_bytes)
    tmp_path.replace(cache_path)
    _cleanup_old_cache_files(cfg.tts_cache_ttl_hours)

    return {
        "success": True,
        "audio_url": f"/api/v1/speech/tts/audio/{cache_filename}",
        "content_type": content_type,
        "language": lang,
        "locale": LOCALE_BY_LANG[lang],
        "voice": voice,
        "provider": provider,
        "cached": False,
        "audio_bytes": len(audio_bytes),
        "generation_ms": round((time.perf_counter() - t0) * 1000.0, 1),
        "error": None,
    }


def resolve_cached_audio_path(filename: str) -> Path | None:
    """Strictly validate hex cache filename to prevent path traversal."""
    if not re.fullmatch(r"[0-9a-f]{32}\.(?:mp3|wav)", filename or ""):
        return None
    candidate = (TTS_CACHE_DIR / filename).resolve()
    if candidate.parent != TTS_CACHE_DIR.resolve() or not candidate.is_file():
        return None
    return candidate
