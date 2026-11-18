"""Reusable Conversation Session Manager & Intent-Aware Multilingual Scientific Follow-Up Engine.

Manages bounded per-experiment conversation context (`conversation_id`), automatically refreshes
simulation parameters & calculated results whenever the student moves sliders mid-chat, and
provides scientifically accurate intent-matched responses in EN / KN / HI / TA / TE when running
in deterministic offline mode (never pretending to be a neural LLM).
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from app.services.result_explanation_service import normalize_language

MAX_CONVERSATIONS_IN_MEMORY = 200


@dataclass
class ConversationSession:
    conversation_id: str
    experiment_id: str
    experiment_title: str
    subject: str
    difficulty: str
    language: str
    parameters: dict[str, Any] = field(default_factory=dict)
    measurements: dict[str, Any] = field(default_factory=dict)
    messages: list[dict[str, str]] = field(default_factory=list)
    updated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ConversationManager:
    """In-memory bounded session store keeping live simulation state synchronized with chat."""

    def __init__(self, max_history: int = 12):
        self.max_history = max_history
        self._sessions: dict[str, ConversationSession] = {}

    def get_or_update(
        self,
        *,
        conversation_id: str | None,
        experiment_id: str,
        experiment_title: str,
        subject: str,
        difficulty: str,
        language: str,
        parameters: dict[str, Any],
        measurements: dict[str, Any],
        incoming_history: list[dict[str, str]] | None = None,
    ) -> tuple[ConversationSession, bool]:
        """Return session and flag indicating whether simulation values changed since last turn."""
        cid = (conversation_id or "").strip() or f"conv-{experiment_id}-{uuid.uuid4().hex[:8]}"
        lang = normalize_language(language)
        existing = self._sessions.get(cid)
        values_changed = False

        if existing is None or existing.experiment_id != experiment_id:
            if len(self._sessions) >= MAX_CONVERSATIONS_IN_MEMORY:
                oldest_key = next(iter(self._sessions))
                self._sessions.pop(oldest_key, None)
            existing = ConversationSession(
                conversation_id=cid,
                experiment_id=experiment_id,
                experiment_title=experiment_title,
                subject=subject,
                difficulty=difficulty,
                language=lang,
                parameters=dict(parameters),
                measurements=dict(measurements),
                messages=list(incoming_history or [])[-self.max_history :],
            )
            self._sessions[cid] = existing
        else:
            if existing.parameters != parameters or existing.measurements != measurements:
                values_changed = True
                existing.parameters = dict(parameters)
                existing.measurements = dict(measurements)
            existing.language = lang
            existing.experiment_title = experiment_title
            if incoming_history and len(incoming_history) > len(existing.messages):
                existing.messages = list(incoming_history)[-self.max_history :]
            existing.updated_at = datetime.now(timezone.utc).isoformat()

        return existing, values_changed

    def append_turn(self, conversation_id: str, user_msg: str | None, assistant_msg: str) -> int:
        sess = self._sessions.get(conversation_id)
        if sess is None:
            return 0
        if user_msg:
            sess.messages.append({"role": "user", "content": user_msg})
        if assistant_msg:
            sess.messages.append({"role": "assistant", "content": assistant_msg})
        if len(sess.messages) > self.max_history:
            sess.messages = sess.messages[-self.max_history :]
        sess.updated_at = datetime.now(timezone.utc).isoformat()
        return len(sess.messages)

    def get_session(self, conversation_id: str) -> ConversationSession | None:
        return self._sessions.get(conversation_id)


_conversation_manager = ConversationManager()


def get_conversation_manager() -> ConversationManager:
    return _conversation_manager


# ---------------------------------------------------------------------------
# Intent-Aware Deterministic Scientific Q&A (All 5 Languages: EN/KN/HI/TA/TE)
# Answers specific student questions directly rather than repeating a fixed template.
# ---------------------------------------------------------------------------

def answer_scientific_followup(
    *,
    experiment_id: str,
    question: str,
    parameters: dict[str, Any],
    measurements: dict[str, Any],
    language: str,
    formulas: list[str] | None = None,
) -> str | None:
    """Match genuine scientific follow-up questions in EN/KN/HI/TA/TE and answer directly."""
    lang = normalize_language(language)
    q = (question or "").strip().lower()
    if not q:
        return None

    # 1. Chemistry — Acids & Bases pH causal question (why pH decreases / why acidic)
    if experiment_id == "acids-bases-ph":
        ph = measurements.get("ph", "—")
        poh = measurements.get("poh", "—")
        h_conc = measurements.get("h_concentration", "—")
        c = parameters.get("molarity", "—")
        is_ph_causal = any(
            kw in q
            for kw in (
                "ph", "acid", "decrease", "lower", "conc", "acidic", "alkal", "base",
                "ಆಮ್ಲ", "ಸಾಂದ್ರತೆ", "ಕಡಿಮೆ", "अम्ल", "सांद्रता", "कम", "அமில", "செறிவு", "குறை", "ఆమ్ల", "గాఢత", "తగ్గు",
            )
        )
        if is_ph_causal:
            return {
                "en": (
                    f"Because pH is defined with a negative logarithm (`pH = −log₁₀[H⁺]`), increasing acid concentration raises `[H⁺]` (currently `{h_conc} M` at `{c} M`), which makes `pH` smaller (`pH = {ph}`, `pOH = {poh}`). "
                    "A 10× increase in `[H⁺]` lowers `pH` by exactly 1 unit. Lower `pH` (< 7) therefore means a more strongly acidic solution."
                ),
                "kn": (
                    f"`pH = −log₁₀[H⁺]` ಸೂತ್ರದಲ್ಲಿ ಋಣಾತ್ಮಕ ಲಾಗರಿಥಮ್ (−) ಇರುವುದರಿಂದ, ಆಮ್ಲದ ಸಾಂದ್ರತೆಯನ್ನು ಹೆಚ್ಚಿಸಿದಾಗ `[H⁺]` ಅಯಾನ್‌ಗಳ ಸಂಖ್ಯೆ ಹೆಚ್ಚಾಗುತ್ತದೆ (ಪ್ರಸ್ತುತ `{c} M` ನಲ್ಲಿ `[H⁺] = {h_conc} M`), ಇದರಿಂದ `pH` ಮೌಲ್ಯ ಕಡಿಮೆಯಾಗುತ್ತದೆ (`pH = {ph}`, `pOH = {poh}`). "
                    "`[H⁺]` 10 ಪಟ್ಟು ಹೆಚ್ಚಾದರೆ `pH` ನಿಖರವಾಗಿ 1 ಘಟಕ ಕಡಿಮೆಯಾಗುತ್ತದೆ; ಕಡಿಮೆ `pH` (< 7) ಎಂದರೆ ಹೆಚ್ಚು ಆಮ್ಲೀಯ ದ್ರಾವಣ."
                ),
                "hi": (
                    f"चूँकि `pH = −log₁₀[H⁺]` में ऋणात्मक लघुगणक (−) होता है, अम्ल की सांद्रता बढ़ाने पर `[H⁺]` आयनों की सांद्रता बढ़ती है (यहाँ `{c} M` पर `[H⁺] = {h_conc} M`), इसलिए `pH` का मान घटता है (`pH = {ph}`, `pOH = {poh}`)। "
                    "`[H⁺]` के 10 गुना बढ़ने पर `pH` ठीक 1 इकाई कम हो जाता है। 7 से कम `pH` अधिक अम्लीयता दर्शाता है।"
                ),
                "ta": (
                    f"`pH = −log₁₀[H⁺]` சூத்திரத்தில் எதிர்மறை மடக்கை (−) உள்ளதால், அமிலத்தின் செறிவை அதிகரிக்கும்போது `[H⁺]` அயனிச் செறிவு அதிகரிக்கிறது (தற்போது `{c} M` இல் `[H⁺] = {h_conc} M`); அதனால் `pH` மதிப்பு குறைகிறது (`pH = {ph}`, `pOH = {poh}`). "
                    "`[H⁺]` 10 மடங்கு அதிகரித்தால் `pH` சரியாக 1 அலகு குறையும்; `pH < 7` என்பது அதிக அமிலத்தன்மையைக் குறிக்கும்."
                ),
                "te": (
                    f"`pH = −log₁₀[H⁺]` సూత్రంలో రుణాత్మక లాగరిథమ్ (−) ఉండటం వల్ల, ఆమ్లం గాఢత పెరిగినప్పుడు `[H⁺]` అయాన్ల గాఢత పెరుగుతుంది (ప్రస్తుతం `{c} M` వద్ద `[H⁺] = {h_conc} M`), ఫలితంగా `pH` విలువ తగ్గుతుంది (`pH = {ph}`, `pOH = {poh}`). "
                    "`[H⁺]` 10 రెట్లు పెరిగితే `pH` ఖచ్చితంగా 1 యూనిట్ తగ్గుతుంది; `pH < 7` ఎక్కువ ఆమ్లత్వాన్ని సూచిస్తుంది."
                ),
            }[lang]

    # 2. Physics — Ohm's Law causal follow-ups (current, voltage, resistance, power, short circuit)
    if experiment_id == "ohms-law":
        v = measurements.get("voltage", parameters.get("voltage", "—"))
        r = measurements.get("resistance", parameters.get("resistance", "—"))
        i = measurements.get("current", "—")
        p = measurements.get("power", "—")
        if any(kw in q for kw in ("zero", "0", "short", "ಶೂನ್ಯ", "शून्य", "பூஜ்ஜிய", "సున్నా")):
            return {
                "en": f"In `I = V / R`, as `R → 0 Ω` at fixed `V = {v} V`, the theoretical current diverges toward infinity (a short circuit). Real wires and batteries have small internal resistance, yet very large current causes dangerous overheating — which is why fuses and resistors are essential.",
                "kn": f"`I = V / R` ನಲ್ಲಿ `V = {v} V` ಸ್ಥಿರವಾಗಿರುವಾಗ `R → 0 Ω` ಆದರೆ ವಿದ್ಯುತ್ ಪ್ರವಾಹ ಅನಂತದತ್ತ ಏರುತ್ತದೆ (ಶಾರ್ಟ್ ಸರ್ಕ್ಯೂಟ್). ಇದು ತಂತಿಗಳು ಅತಿಯಾಗಿ ಬಿಸಿಯಾಗಲು ಕಾರಣವಾಗುತ್ತದೆ; ಆದ್ದರಿಂದ ಫ್ಯೂಸ್ ಮತ್ತು ಪ್ರತಿರೋಧಕಗಳು ಅಗತ್ಯ.",
                "hi": f"`I = V / R` में यदि `V = {v} V` स्थिर हो और `R → 0 Ω` हो जाए, तो धारा अनंत की ओर बढ़ने लगती है (शॉर्ट सर्किट)। इससे तार अत्यधिक गर्म हो सकते हैं, इसलिए परिपथ में फ़्यूज़ और प्रतिरोधक लगाए जाते हैं।",
                "ta": f"`I = V / R` இல் `V = {v} V` மாறாமல் `R → 0 Ω` ஆனால் மின்னோட்டம் முடிவிலியை நோக்கி மிக அதிகமாக உயரும் (குறுக்கு மின்சுற்று). இதனால் கம்பிகள் அதிக வெப்பமடையும் என்பதால் உருகி (fuse) அவசியம்.",
                "te": f"`I = V / R` లో `V = {v} V` స్థిరంగా ఉండి `R → 0 Ω` అయితే విద్యుత్ ప్రవాహం అనంతంగా పెరుగుతుంది (షార్ట్ సర్క్యూట్). దీనివల్ల తీగలు అధికంగా వేడెక్కుతాయి, అందుకే ఫ్యూజ్‌లు అవసరం.",
            }[lang]
        if any(kw in q for kw in ("power", "watt", "heat", "ಶಕ್ತಿ", "शक्ति", "திறன்", "సామర్థ్యం")):
            return {
                "en": f"Your live power dissipation is `P = V × I = {v} V × {i} A = {p} W` (equivalently `P = V² / R` or `P = I²R`). At fixed voltage `V = {v} V`, lowering resistance increases both current and power inversely (`P ∝ 1/R`).",
                "kn": f"ಪ್ರಸ್ತುತ ವ್ಯಯವಾದ ಶಕ್ತಿ `P = V × I = {v} V × {i} A = {p} W` (`P = V² / R = I²R`). ವೋಲ್ಟೇಜ್ `V = {v} V` ಸ್ಥಿರವಾಗಿದ್ದಾಗ ಪ್ರತಿರೋಧ ಕಡಿಮೆಯಾದರೆ ಪ್ರವಾಹ ಮತ್ತು ಶಕ್ತಿ ಎರಡೂ ಹೆಚ್ಚಾಗುತ್ತವೆ.",
                "hi": f"आपकी वर्तमान विद्युत शक्ति `P = V × I = {v} V × {i} A = {p} W` है (`P = V² / R = I²R`)। स्थिर वोल्टेज `V = {v} V` पर प्रतिरोध घटाने से धारा और शक्ति दोनों बढ़ते हैं।",
                "ta": f"தற்போதைய மின் திறன் `P = V × I = {v} V × {i} A = {p} W` (`P = V² / R = I²R`). `V = {v} V` மாறாமல் இருக்கும்போது மின்தடை குறைந்தால் மின்னோட்டமும் திறனும் அதிகரிக்கும்.",
                "te": f"ప్రస్తుత విద్యుత్ సామర్థ్యం `P = V × I = {v} V × {i} A = {p} W` (`P = V² / R = I²R`). `V = {v} V` స్థిరంగా ఉన్నప్పుడు ప్రతిఘటన తగ్గితే ప్రవాహం మరియు సామర్థ్యం పెరుగుతాయి.",
            }[lang]
        if any(kw in q for kw in ("why", "current", "voltage", "resistance", "change", "increase", "decrease", "ಏಕೆ", "ಕಡಿಮೆ", "ಹೆಚ್ಚ", "क्यों", "ஏன்", "ఎందుకు")):
            return {
                "en": f"From Ohm's Law (`I = V / R`), current is directly proportional to voltage and inversely proportional to resistance. With your current values `V = {v} V` and `R = {r} Ω`, we get `I = {v} / {r} = {i} A` and `P = {p} W`. Increasing `V` pushes more charge per second, while increasing `R` opposes the flow.",
                "kn": f"ಓಮ್ ನಿಯಮದ ಪ್ರಕಾರ (`I = V / R`) ವಿದ್ಯುತ್ ಪ್ರವಾಹವು ವೋಲ್ಟೇಜ್‌ಗೆ ನೇರಾನುಪಾತದಲ್ಲಿಯೂ ಪ್ರತಿರೋಧಕ್ಕೆ ವಿಲೋಮಾನುಪಾತದಲ್ಲಿಯೂ ಇರುತ್ತದೆ. ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಮೌಲ್ಯಗಳು `V = {v} V`, `R = {r} Ω` ಗೆ `I = {i} A` ಮತ್ತು `P = {p} W` ಬಂದಿವೆ.",
                "hi": f"ओम के नियम (`I = V / R`) के अनुसार विद्युत धारा वोल्टेज के समानुपाती और प्रतिरोध के व्युत्क्रमानुपाती होती है। आपके वर्तमान मान `V = {v} V` और `R = {r} Ω` से `I = {i} A` तथा `P = {p} W` प्राप्त हुए।",
                "ta": f"ஓம் விதியின்படி (`I = V / R`) மின்னோட்டம் மின்னழுத்தத்திற்கு நேர்விகிதத்திலும் மின்தடைக்கு எதிர்விகிதத்திலும் இருக்கும். உங்கள் தற்போதைய மதிப்புகள் `V = {v} V`, `R = {r} Ω` இல் `I = {i} A` மற்றும் `P = {p} W` கிடைத்துள்ளது.",
                "te": f"ఓమ్ నియమం (`I = V / R`) ప్రకారం విద్యుత్ ప్రవాహం వోల్టేజ్‌కు అనులోమానుపాతంలోనూ, ప్రతిఘటనకు విలోమానుపాతంలోనూ ఉంటుంది. మీ ప్రస్తుత విలువలు `V = {v} V`, `R = {r} Ω` వద్ద `I = {i} A` మరియు `P = {p} W` వచ్చాయి.",
            }[lang]

    # 3. Biology — Photosynthesis follow-up (limiting factor / temperature / light / CO2)
    if experiment_id == "photosynthesis":
        o2 = measurements.get("o2_evolution_rate", "—")
        lim = measurements.get("limiting_factor", "Light Intensity")
        temp = parameters.get("temperature", "—")
        return {
            "en": f"In your current photosynthesis setup (`T = {temp} °C`), the O₂ evolution rate is `{o2} μmol/m²/s` and the active limiting factor is `{lim}`. Under Blackman's Law, the slowest environmental factor caps the overall rate; also, temperatures above ~35–40 °C denature chloroplast enzymes and reduce the rate.",
            "kn": f"ನಿಮ್ಮ ಪ್ರಸ್ತುತ ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆ ಸೆಟಪ್‌ನಲ್ಲಿ (`T = {temp} °C`) O₂ ಉತ್ಪಾದನಾ ದರ `{o2} μmol/m²/s` ಆಗಿದ್ದು, ಪ್ರಸ್ತುತ ಮಿತಿಕಾರಕ `{lim}` ಆಗಿದೆ. ಬ್ಲ್ಯಾಕ್‌ಮನ್ ನಿಯಮದಂತೆ ಅತ್ಯಂತ ಕಡಿಮೆ ಇರುವ ಅಂಶವೇ ವೇಗವನ್ನು ನಿಯಂತ್ರಿಸುತ್ತದೆ; ತಾಪಮಾನ ~35–40 °C ಮೀರಿದರೆ ಕಿಣ್ವಗಳು ನಿಷ್ಕ್ರಿಯಗೊಳ್ಳುತ್ತವೆ.",
            "hi": f"आपके वर्तमान प्रकाश संश्लेषण सेटअप (`T = {temp} °C`) में O₂ उत्पादन दर `{o2} μmol/m²/s` है और सक्रिय सीमांत कारक `{lim}` है। ब्लैकमैन के नियम के अनुसार सबसे कम उपलब्ध कारक अभिक्रिया की गति सीमित करता है; ~35–40 °C से अधिक ताप पर एंजाइम निष्क्रिय हो जाते हैं।",
            "ta": f"உங்கள் தற்போதைய ஒளிச்சேர்க்கை அமைப்பில் (`T = {temp} °C`) O₂ உற்பத்தி விகிதம் `{o2} μmol/m²/s` மற்றும் கட்டுப்படுத்தும் காரணி `{lim}` ஆகும். பிளாக்மேன் விதியின்படி குறைந்த அளவில் உள்ள காரணியே வேகத்தை வரையறுக்கும்; ~35–40 °C க்கு மேல் நொதிகள் சிதைவடையும்.",
            "te": f"మీ ప్రస్తుత కిరణజన్య సంయోగక్రియ సెటప్‌లో (`T = {temp} °C`) O₂ ఉత్పత్తి రేటు `{o2} μmol/m²/s` మరియు ప్రస్తుత పరిమితి కారకం `{lim}`. బ్లాక్‌మన్ నియమం ప్రకారం తక్కువ స్థాయిలో ఉన్న కారకమే వేగాన్ని పరిమితం చేస్తుంది; ~35–40 °C దాటితే ఎంజైమ్‌లు దెబ్బతింటాయి.",
        }[lang]

    # 4. Mathematics — Quadratic Equations follow-up (discriminant / roots / vertex)
    if experiment_id == "quadratic-equations":
        disc = measurements.get("discriminant", "—")
        roots = measurements.get("roots_display", "—")
        vx = measurements.get("vertex_x", "—")
        vy = measurements.get("vertex_y", "—")
        return {
            "en": f"The discriminant `Δ = b² − 4ac = {disc}` determines the root type: `Δ > 0` gives two distinct real roots, `Δ = 0` gives one repeated real root, and `Δ < 0` gives complex conjugate roots. For your parameters, the roots are `{roots}` and the parabola vertex is `({vx}, {vy})`.",
            "kn": f"ವಿವೇಚಕ `Δ = b² − 4ac = {disc}` ಮೂಲಗಳ ಸ್ವರೂಪವನ್ನು ನಿರ್ಧರಿಸುತ್ತದೆ: `Δ > 0` ಎರಡು ವಿಭಿನ್ನ ವಾಸ್ತವ ಮೂಲಗಳು, `Δ = 0` ಒಂದು ಪುನರಾವರ್ತಿತ ಮೂಲ, `Δ < 0` ಸಂಕೀರ್ಣ ಮೂಲಗಳು. ನಿಮ್ಮ ನಿಯತಾಂಕಗಳಿಗೆ ಮೂಲಗಳು `{roots}` ಮತ್ತು ಶೃಂಗ `({vx}, {vy})`.",
            "hi": f"विविक्तकर `Δ = b² − 4ac = {disc}` मूलों की प्रकृति तय करता है: `Δ > 0` पर दो भिन्न वास्तविक मूल, `Δ = 0` पर एक समान वास्तविक मूल, और `Δ < 0` पर सम्मिश्र मूल मिलते हैं। आपके मानों के लिए हल `{roots}` और शीर्ष `({vx}, {vy})` है।",
            "ta": f"தன்மைக்காட்டி `Δ = b² − 4ac = {disc}` மூலங்களின் வகையைத் தீர்மானிக்கிறது: `Δ > 0` எனில் இரு வெவ்வேறு மெய் மூலங்கள், `Δ = 0` எனில் ஒரு சம மூலம், `Δ < 0` எனில் கலப்பு எண் மூலங்கள். உங்கள் மதிப்புகளுக்கு தீர்வு `{roots}`, உச்சி `({vx}, {vy})`.",
            "te": f"విచక్షణి `Δ = b² − 4ac = {disc}` మూలాల స్వభావాన్ని నిర్ణయిస్తుంది: `Δ > 0` అయితే రెండు విభిన్న వాస్తవ మూలాలు, `Δ = 0` అయితే ఒకే వాస్తవ మూలం, `Δ < 0` అయితే సంకీర్ణ మూలాలు. మీ విలువలకు మూలాలు `{roots}`, శీర్షం `({vx}, {vy})`.",
        }[lang]

    # 4b. Biology — Human Respiratory System (Organ-aware, e.g. Alveoli gas exchange in EN/KN/HI/TA/TE)
    if experiment_id == "human-respiratory-system":
        organ = parameters.get("selected_structure") or measurements.get("organ_name", "Alveoli")
        role = parameters.get("organ_role") or measurements.get("organ_role", "")
        ve = measurements.get("minute_ventilation_l_min", "—")
        va = measurements.get("alveolar_ventilation_l_min", "—")
        rate = parameters.get("breathing_rate", 16)
        if "alveol" in str(organ).lower() or "alveol" in q or "gas" in q or "what happens here" in q:
            return {
                "en": f"In the {organ}, tiny thin-walled air sacs surrounded by pulmonary capillaries perform gas exchange by diffusion: oxygen (O₂) moves from inhaled air into red blood cells, while carbon dioxide (CO₂) moves from blood into the lungs to be exhaled. At your current rate ({rate} breaths/min), minute ventilation is `{ve} L/min` and alveolar ventilation is `{va} L/min`.",
                "kn": f"{organ} (ಆಲ್ವಿಯೋಲಿ) ಸೂಕ್ಷ್ಮ ಗಾಳಿಚೀಲಗಳಾಗಿದ್ದು, ಇಲ್ಲಿ ವಿಸರಣೆಯ ಮೂಲಕ ಅನಿಲ ವಿನಿಮಯ ನಡೆಯುತ್ತದೆ: ಉಸಿರೆಳೆದುಕೊಂಡ ಗಾಳಿಯಿಂದ ಆಮ್ಲಜನಕ (O₂) ರಕ್ತಕ್ಕೆ ಸೇರುತ್ತದೆ ಮತ್ತು ರಕ್ತದಿಂದ ಕಾರ್ಬನ್ ಡೈಆಕ್ಸೈಡ್ (CO₂) ಹೊರಹೋಗುತ್ತದೆ. ನಿಮ್ಮ ಪ್ರಸ್ತುತ ವೇಗ ({rate} breaths/min) ದಲ್ಲಿ V̇E = `{ve} L/min`, V̇A = `{va} L/min`.",
                "hi": f"{organ} (वायुकोशिकाओं) में पतली झिल्ली के पार विसरण द्वारा गैस विनिमय होता है: ऑक्सीजन (O₂) फेफड़ों की हवा से रक्त में जाती है और कार्बन डाइऑक्साइड (CO₂) रक्त से बाहर निकलती है। आपकी वर्तमान दर ({rate} breaths/min) पर V̇E = `{ve} L/min` और V̇A = `{va} L/min` है।",
                "ta": f"{organ} (ஆல்வியோலி) நுண்ணிய காற்றுப் பைகளில் விரவல் மூலம் வாயு பரிமாற்றம் நடைபெறுகிறது: ஆக்ஸிஜன் (O₂) இரத்தத்திற்குள் செல்கிறது, கார்பன் டை ஆக்சைடு (CO₂) வெளியேறுகிறது. உங்கள் தற்போதைய விகிதத்தில் ({rate} breaths/min) V̇E = `{ve} L/min`, V̇A = `{va} L/min`.",
                "te": f"{organ} (ఆల్వియోలీ) సూక్ష్మ గాలి సంచులలో వ్యాపనం ద్వారా వాయు మార్పిడి జరుగుతుంది: ఆక్సిజన్ (O₂) రక్తంలోకి చేరుతుంది మరియు కార్బన్ డైఆక్సైడ్ (CO₂) బయటకు వెళుతుంది. ప్రస్తుత రేటు ({rate} breaths/min) వద్ద V̇E = `{ve} L/min`, V̇A = `{va} L/min`.",
            }[lang]
        return {
            "en": f"Selected respiratory structure: **{organ}**. {role} With breathing rate `{rate} breaths/min`, minute ventilation is `{ve} L/min`.",
            "kn": f"ಆಯ್ಕೆ ಮಾಡಿದ ಅಂಗ: **{organ}**. {role} ಪ್ರಸ್ತುತ ಉಸಿರಾಟದ ವೇಗ `{rate} breaths/min` ನಲ್ಲಿ V̇E = `{ve} L/min`.",
            "hi": f"चयनित श्वसन अंग: **{organ}**। {role} वर्तमान श्वसन दर `{rate} breaths/min` पर V̇E = `{ve} L/min` है।",
            "ta": f"தேர்ந்தெடுக்கப்பட்ட உறுப்பு: **{organ}**. {role} தற்போதைய சுவாச விகிதம் `{rate} breaths/min` இல் V̇E = `{ve} L/min`.",
            "te": f"ఎంచుకున్న శ్వాస అంగం: **{organ}**. {role} ప్రస్తుత శ్వాస రేటు `{rate} breaths/min` వద్ద V̇E = `{ve} L/min`.",
        }[lang]

    # 4c. Biology — Nervous System (Reflex Arc & Myelin)
    if experiment_id == "human-nervous-system":
        st = parameters.get("selected_structure") or measurements.get("structure_name", "Spinal Cord")
        lat = measurements.get("reflex_latency_ms", "—")
        vol = measurements.get("voluntary_reaction_ms", "—")
        v = measurements.get("conduction_velocity_ms", 80)
        return {
            "en": f"In the **{st}**, nerve impulses travel at `{v} m/s`. A spinal reflex arc routes Sensory Neuron → Spinal Cord → Motor Neuron in `{lat} ms`, much faster than conscious brain reaction (`{vol} ms`).",
            "kn": f"**{st}** ನಲ್ಲಿ ನರ ಸಂಕೇತಗಳು `{v} m/s` ವೇಗದಲ್ಲಿ ಚಲಿಸುತ್ತವೆ. ಬೆನ್ನುಹುರಿಯ ಪ್ರತಿವರ್ತಿ ಕ್ರಿಯೆ `{lat} ms` ನಲ್ಲಿ ಪೂರ್ಣಗೊಳ್ಳುತ್ತದೆ (ಮೆದುಳಿನ ಪ್ರತಿಕ್ರಿಯೆ `{vol} ms`).",
            "hi": f"**{st}** में तंत्रिका आवेग `{v} m/s` की गति से चलते हैं। मेरुरज्जु प्रतिवर्ती क्रिया केवल `{lat} ms` में होती है, जबकि मस्तिष्क की प्रतिक्रिया `{vol} ms` लेती है।",
            "ta": f"**{st}** இல் நரம்புத் தூண்டல்கள் `{v} m/s` வேகத்தில் பயணிக்கின்றன. தண்டுவட அனிச்சை செயல் `{lat} ms` இல் நிகழ்கிறது (மூளை எதிர்வினை `{vol} ms`).",
            "te": f"**{st}** లో నాడీ సంకేతాలు `{v} m/s` వేగంతో ప్రయాణిస్తాయి. వెన్నుపాము ప్రతీకార చర్య `{lat} ms` లో పూర్తవుతుంది (మెదడు ప్రతిస్పందన `{vol} ms`).",
        }[lang]

    # 4d. Chemistry — Chemical Reaction Playground
    if experiment_id == "chemical-reaction-playground":
        eq = measurements.get("equation", "")
        dh = measurements.get("enthalpy_change_kj", 0)
        prod = measurements.get("product_moles", 0)
        obs = measurements.get("observable_change", "")
        return {
            "en": f"For `{eq}`, stoichiometry produces `{prod} mol` product with heat change `ΔH = {dh} kJ`. Observation: {obs}",
            "kn": f"`{eq}` ಕ್ರಿಯೆಯಲ್ಲಿ `{prod} mol` ಉತ್ಪನ್ನ ದೊರೆಯುತ್ತದೆ ಮತ್ತು ಉಷ್ಣ ಬದಲಾವಣೆ `ΔH = {dh} kJ` ಆಗಿದೆ. ವೀಕ್ಷಣೆ: {obs}",
            "hi": f"`{eq}` अभिक्रिया में `{prod} mol` उत्पाद बनता है और ऊष्मा परिवर्तन `ΔH = {dh} kJ` है। अवलोकन: {obs}",
            "ta": f"`{eq}` வினையில் `{prod} mol` விளைபொருள் உருவாகிறது மற்றும் வெப்ப மாற்றம் `ΔH = {dh} kJ` ஆகும். கவனிப்பு: {obs}",
            "te": f"`{eq}` చర్యలో `{prod} mol` ఉత్పన్నం ఏర్పడుతుంది మరియు ఉష్ణ మార్పు `ΔH = {dh} kJ`. పరిశీలన: {obs}",
        }[lang]

    # 5. Generic formula / why question for any of the experiments
    if formulas and any(kw in q for kw in ("formula", "equation", "calculate", "ಸೂತ್ರ", "सूत्र", "சூத்திரம்", "సూత్రం")):
        f_str = " | ".join(formulas[:3])
        return {
            "en": f"The governing equation(s) for this experiment are `{f_str}`. Every displayed measurement is computed deterministically from your current input parameters using these exact relations.",
            "kn": f"ಈ ಪ್ರಯೋಗದ ಪ್ರಮುಖ ಸೂತ್ರಗಳು: `{f_str}`. ತೋರಿಸಿರುವ ಪ್ರತಿಯೊಂದು ಮೌಲ್ಯವನ್ನೂ ನಿಮ್ಮ ಪ್ರಸ್ತುತ ನಿಯತಾಂಕಗಳಿಂದ ಈ ನಿಖರ ಸಮೀಕರಣಗಳ ಮೂಲಕ ಲೆಕ್ಕಹಾಕಲಾಗಿದೆ.",
            "hi": f"इस प्रयोग के मुख्य सूत्र `{f_str}` हैं। दिखाए गए सभी मान आपके वर्तमान इनपुट पैरामीटर से इन्हीं सटीक समीकरणों द्वारा गणना किए गए हैं।",
            "ta": f"இந்த சோதனையின் முக்கிய சூத்திரங்கள்: `{f_str}`. காட்டப்படும் அனைத்து மதிப்புகளும் உங்கள் தற்போதைய அளவுருக்களிலிருந்து இச்சமன்பாடுகளால் துல்லியமாக கணக்கிடப்படுகின்றன.",
            "te": f"ఈ ప్రయోగం యొక్క ముఖ్య సూత్రాలు: `{f_str}`. చూపబడిన ప్రతి విలువ మీ ప్రస్తుత పరామితుల ఆధారంగా ఈ ఖచ్చితమైన సమీకరణాలతో లెక్కించబడింది.",
        }[lang]

    return None
