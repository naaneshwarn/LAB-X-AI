from educational_content.content_loader import (
    load_experiment_content,
    get_fixed_explanation,
    evaluate_quiz
)
from multilingual.translator import LabXAITranslator
from speech.tts_engine import get_or_generate_speech

def run_all_tests():
    print("=== Starting Janith's LabXAI Module Tests ===\n")

    # TEST 1: Experiment Content & Terminology Loading
    print("1. Testing Experiment Content Loader...")
    content = load_experiment_content("basic-electric-circuit")
    assert content["experiment_id"] == "basic-electric-circuit"
    assert "en" in content["title"] and "kn" in content["title"]
    assert len(content["terminology"]) >= 3
    print("   [PASS] Bilingual title, objectives, and terminology loaded.\n")

    # TEST 2: Milestone 1 Event Payload Lookup (SWITCH_ON in English & Kannada)
    print("2. Testing SWITCH_ON Event Explanation (EN & KN)...")
    en_event = get_fixed_explanation("basic-electric-circuit", "SWITCH_ON", "en")
    kn_event = get_fixed_explanation("basic-electric-circuit", "SWITCH_ON", "kn")
    assert "9V" in en_event["text"]
    assert "9V" in kn_event["text"]
    assert kn_event["audio_path"] == "speech/audio_cache/switch_on_kn.mp3"
    print(f"   [PASS] KN Explanation: {kn_event['text']}")
    print(f"   [PASS] KN Audio Path:  {kn_event['audio_path']}\n")

    # TEST 3: Quiz Assessment Grading (English & Kannada Feedback)
    print("3. Testing Quiz Evaluation...")
    # Submitting q1=1 (correct) and q2=1 (incorrect, correct is 0)
    quiz_result = evaluate_quiz(
        experiment_id="basic-electric-circuit",
        answers={"q1": 1, "q2": 1},
        lang="kn"
    )
    assert quiz_result["score"] == 1
    assert quiz_result["total"] == 2
    assert quiz_result["feedback"][0]["is_correct"] is True
    assert quiz_result["feedback"][1]["is_correct"] is False
    print(f"   [PASS] Quiz Score: {quiz_result['score']}/{quiz_result['total']}")
    print(f"   [PASS] Q1 KN Feedback: {quiz_result['feedback'][0]['explanation']}\n")

    # TEST 4: Translation Module & Safe Glossary Fallback
    print("4. Testing Translator & Error Handling...")
    translator = LabXAITranslator(use_indictrans2=False)

    # 4a. Valid English -> Kannada translation with scientific glossary injection
    sample_ai_output = "The electric circuit is closed so electric current flows from the battery to the bulb."
    trans_res = translator.translate_text(sample_ai_output, source_lang="en", target_lang="kn")
    assert trans_res["status"] == "success"
    assert "ವಿದ್ಯುತ್ ವಲಯ" in trans_res["translated_text"]
    print(f"   [PASS] Glossary-enhanced output:\n   {trans_res['translated_text']}\n")

    # 4b. Invalid language code check (Integration Contract requirement)
    invalid_res = translator.translate_text("Hello", source_lang="en", target_lang="fr")
    assert invalid_res["status"] == "error"
    print(f"   [PASS] Invalid language handled safely: {invalid_res}\n")

    # TEST 5: Speech / Audio Playback Cache Check
    print("5. Testing Speech Generation & Audio Cache...")
    tts_res = get_or_generate_speech(
        text=kn_event["text"],
        lang="kn",
        filename="switch_on_kn.mp3"
    )
    assert tts_res["status"] in ["success", "fallback_text_only"]
    print(f"   [PASS] Speech Engine Response: {tts_res}\n")

    print("=== ALL JANITH MODULE TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_all_tests()