"""Multilingual registry structured for English, Kannada, and future Indic providers."""

from app.schemas.common import LanguageInfo, LanguagesResponse


def get_supported_languages() -> LanguagesResponse:
    """Return active and roadmap languages with provider architecture metadata."""
    languages = [
        LanguageInfo(
            code="en",
            name="English",
            native_name="English",
            status="supported",
            ui_translated=True,
            ai_supported=True,
            speech_locale="en-IN",
            future_providers={"translation": "native", "tts": "Web SpeechSynthesis / Neural TTS"},
        ),
        LanguageInfo(
            code="kn",
            name="Kannada",
            native_name="ಕನ್ನಡ",
            status="supported",
            ui_translated=True,
            ai_supported=True,
            speech_locale="kn-IN",
            future_providers={"translation": "AI4Bharat IndicTrans2 (planned)", "tts": "AI4Bharat Indic-TTS (planned)"},
        ),
        LanguageInfo(
            code="hi",
            name="Hindi",
            native_name="हिन्दी",
            status="planned",
            ui_translated=False,
            ai_supported=True,
            speech_locale="hi-IN",
            future_providers={"translation": "AI4Bharat IndicTrans2 (planned)", "tts": "AI4Bharat Indic-TTS (planned)"},
        ),
        LanguageInfo(
            code="te",
            name="Telugu",
            native_name="తెలుగు",
            status="planned",
            ui_translated=False,
            ai_supported=True,
            speech_locale="te-IN",
            future_providers={"translation": "AI4Bharat IndicTrans2 (planned)", "tts": "AI4Bharat Indic-TTS (planned)"},
        ),
        LanguageInfo(
            code="ta",
            name="Tamil",
            native_name="தமிழ்",
            status="planned",
            ui_translated=False,
            ai_supported=True,
            speech_locale="ta-IN",
            future_providers={"translation": "AI4Bharat IndicTrans2 (planned)", "tts": "AI4Bharat Indic-TTS (planned)"},
        ),
    ]
    return LanguagesResponse(
        default_language="en",
        languages=languages,
        architecture_note=(
            "English and Kannada are fully supported across UI dictionaries, quizzes, and AI prompts. "
            "Browser SpeechSynthesis is used for optional client narration; modular translation and TTS "
            "interfaces are prepared for future AI4Bharat IndicTrans2 and Indic-TTS integration."
        ),
    )
