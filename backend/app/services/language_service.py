"""Multilingual registry supporting English, Kannada, Hindi, Telugu, and Tamil."""

from app.schemas.common import LanguageInfo, LanguagesResponse
from app.schemas.translation import SpeechConfigResponse, SpeechLocaleConfig
from app.services.tts_service import get_tts_provider_status


def get_supported_languages() -> LanguagesResponse:
    """Return all 5 active languages with speech locales and extensible provider metadata."""
    languages = [
        LanguageInfo(
            code="en",
            name="English",
            native_name="English",
            status="supported",
            ui_translated=True,
            ai_supported=True,
            speech_locale="en-IN",
            future_providers={"translation": "native / OpenRouter", "tts": "Web SpeechSynthesis / Neural TTS"},
        ),
        LanguageInfo(
            code="kn",
            name="Kannada",
            native_name="ಕನ್ನಡ",
            status="supported",
            ui_translated=True,
            ai_supported=True,
            speech_locale="kn-IN",
            future_providers={"translation": "Scientific Glossary + Cache + AI4Bharat IndicTrans2", "tts": "Web SpeechSynthesis / Indic-TTS"},
        ),
        LanguageInfo(
            code="hi",
            name="Hindi",
            native_name="हिन्दी",
            status="supported",
            ui_translated=True,
            ai_supported=True,
            speech_locale="hi-IN",
            future_providers={"translation": "Scientific Glossary + Cache + AI4Bharat IndicTrans2", "tts": "Web SpeechSynthesis / Indic-TTS"},
        ),
        LanguageInfo(
            code="te",
            name="Telugu",
            native_name="తెలుగు",
            status="supported",
            ui_translated=True,
            ai_supported=True,
            speech_locale="te-IN",
            future_providers={"translation": "Scientific Glossary + Cache + AI4Bharat IndicTrans2", "tts": "Web SpeechSynthesis / Indic-TTS"},
        ),
        LanguageInfo(
            code="ta",
            name="Tamil",
            native_name="தமிழ்",
            status="supported",
            ui_translated=True,
            ai_supported=True,
            speech_locale="ta-IN",
            future_providers={"translation": "Scientific Glossary + Cache + AI4Bharat IndicTrans2", "tts": "Web SpeechSynthesis / Indic-TTS"},
        ),
    ]
    return LanguagesResponse(
        default_language="en",
        languages=languages,
        architecture_note=(
            "English, Kannada, Hindi, Telugu, and Tamil are supported across UI dictionaries, "
            "experiment metadata, scientific-symbol-preserving translation, Web Speech voice I/O, "
            "and language-aware AI Tutor prompts."
        ),
    )


def get_speech_config() -> SpeechConfigResponse:
    """Return Web Speech API locale configuration and honest browser capability notes."""
    locales = [
        SpeechLocaleConfig(
            code="en",
            name="English",
            native_name="English",
            recognition_locale="en-IN",
            synthesis_locale="en-IN",
            browser_stt_note="Widely supported in Chromium/Edge/Chrome via Web SpeechRecognition.",
            browser_tts_note="Native voices installed on Windows, macOS, Android, and iOS.",
        ),
        SpeechLocaleConfig(
            code="kn",
            name="Kannada",
            native_name="ಕನ್ನಡ",
            recognition_locale="kn-IN",
            synthesis_locale="kn-IN",
            browser_stt_note="Supported in Chrome/Edge when online speech recognition is available.",
            browser_tts_note="Requires OS or browser Kannada (kn-IN) voice pack; otherwise notifies user cleanly.",
        ),
        SpeechLocaleConfig(
            code="hi",
            name="Hindi",
            native_name="हिन्दी",
            recognition_locale="hi-IN",
            synthesis_locale="hi-IN",
            browser_stt_note="Supported in Chrome/Edge via hi-IN Web SpeechRecognition.",
            browser_tts_note="Native hi-IN voices widely available in Edge/Chrome/Windows.",
        ),
        SpeechLocaleConfig(
            code="te",
            name="Telugu",
            native_name="తెలుగు",
            recognition_locale="te-IN",
            synthesis_locale="te-IN",
            browser_stt_note="Supported in Chrome/Edge via te-IN Web SpeechRecognition.",
            browser_tts_note="Requires OS or browser Telugu (te-IN) voice pack.",
        ),
        SpeechLocaleConfig(
            code="ta",
            name="Tamil",
            native_name="தமிழ்",
            recognition_locale="ta-IN",
            synthesis_locale="ta-IN",
            browser_stt_note="Supported in Chrome/Edge via ta-IN Web SpeechRecognition.",
            browser_tts_note="Requires OS or browser Tamil (ta-IN) voice pack.",
        ),
    ]
    tts_status = get_tts_provider_status()
    return SpeechConfigResponse(
        default_language="en",
        web_speech_primary=not tts_status["available"],
        server_tts_available=bool(tts_status["available"]),
        tts_provider=str(tts_status["provider"]),
        tts_voices=dict(tts_status["voices"]),
        locales=locales,
        browser_limitations_note=(
            f"Regional Text-to-Speech uses backend provider '{tts_status['provider']}' for en-IN, kn-IN, hi-IN, ta-IN, and te-IN "
            "(independent of Windows OS voices). Voice input uses browser Web SpeechRecognition (best in Chrome/Edge)."
        ),
    )
