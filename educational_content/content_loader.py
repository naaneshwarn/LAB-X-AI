import json
from pathlib import Path

CONTENT_DIR = Path(__file__).parent

def load_experiment_content(experiment_id: str) -> dict:
    """Loads the JSON file for a given experiment_id."""
    file_path = CONTENT_DIR / "basic_electric_circuit.json"
    if experiment_id != "basic-electric-circuit" or not file_path.exists():
        raise ValueError(f"Unsupported or missing experiment_id: {experiment_id}")
    with open(file_path, "r", encoding="utf-8") as file:
        return json.load(file)

def get_fixed_explanation(experiment_id: str, event_name: str, lang: str = "en") -> dict:
    """Returns reviewed explanation text and audio path for a simulation event."""
    data = load_experiment_content(experiment_id)
    event_data = data.get("fixed_explanations", {}).get(event_name, {})
    return {
        "experiment_id": experiment_id,
        "event": event_name,
        "language": lang,
        "text": event_data.get(lang, event_data.get("en", "Explanation not found.")),
        "audio_path": event_data.get("audio_file", {}).get(lang)
    }

def evaluate_quiz(experiment_id: str, answers: dict, lang: str = "en") -> dict:
    """
    Grades student quiz submissions.
    answers format: {"q1": 1, "q2": 0}
    """
    data = load_experiment_content(experiment_id)
    questions = data.get("quiz", [])
    score = 0
    feedback = []

    for q in questions:
        qid = q["question_id"]
        selected = answers.get(qid)
        is_correct = (selected == q["correct_index"])
        if is_correct:
            score += 1
        feedback.append({
            "question_id": qid,
            "is_correct": is_correct,
            "correct_index": q["correct_index"],
            "explanation": q["explanation"].get(lang, q["explanation"]["en"])
        })

    return {
        "experiment_id": experiment_id,
        "score": score,
        "total": len(questions),
        "feedback": feedback
    }