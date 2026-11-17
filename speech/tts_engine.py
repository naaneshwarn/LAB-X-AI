import os
from pathlib import Path

AUDIO_CACHE_DIR = Path(__file__).parent / "audio_cache"
AUDIO_CACHE_DIR.mkdir(parents=True, exist_ok=True)

def get_or_generate_speech(text: str, lang: str = "kn", filename: str = "narration.mp3") -> dict:
    """
    Contract function for Naaneshwar's POST /api/speech/generate endpoint.
    Checks if a reviewed/cached audio file already exists first; otherwise generates it.
    """
    output_path = AUDIO_CACHE_DIR / filename

    # 1. Return existing pre-generated audio immediately if available (Zero latency/VRAM)
    if output_path.exists():
        return {
            "status": "success",
            "language": lang,
            "audio_path": str(output_path),
            "source": "cached_prerecorded"
        }

    # 2. Generate audio file for English ('en') or Kannada ('kn')
    try:
        from gtts import gTTS
        tts = gTTS(text=text, lang=lang, slow=False)
        tts.save(str(output_path))
        return {
            "status": "success",
            "language": lang,
            "audio_path": str(output_path),
            "source": "generated_tts"
        }
    except Exception as e:
        return {
            "status": "fallback_text_only",
            "language": lang,
            "audio_path": None,
            "message": f"Audio unavailable ({e}). Displaying text explanation."
        }