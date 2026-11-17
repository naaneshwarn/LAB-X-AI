from educational_content.content_loader import load_experiment_content
from speech.tts_engine import get_or_generate_speech
from pathlib import Path

def build_fixed_audio_files():
    data = load_experiment_content("basic-electric-circuit")
    explanations = data.get("fixed_explanations", {})

    for event_name, content in explanations.items():
        for lang in ["en", "kn"]:
            text = content.get(lang)
            audio_rel_path = content.get("audio_file", {}).get(lang)
            if text and audio_rel_path:
                filename = Path(audio_rel_path).name
                result = get_or_generate_speech(text=text, lang=lang, filename=filename)
                print(f"[{event_name} - {lang}] -> {result}")

if __name__ == "__main__":
    build_fixed_audio_files()