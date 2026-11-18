"""Unified multidisciplinary subject and experiment seed catalog (4 subjects, 48 experiments)."""

from __future__ import annotations

from typing import Any

from app.database.catalog_biology import BIOLOGY_EXPERIMENTS
from app.database.catalog_chemistry import CHEMISTRY_EXPERIMENTS
from app.database.catalog_math import MATH_EXPERIMENTS
from app.database.catalog_physics import PHYSICS_EXPERIMENTS

SUBJECTS_SEED: list[dict[str, Any]] = [
    {
        "id": "physics",
        "name": "Physics",
        "slug": "physics",
        "description": "Explore mechanics, electricity, optics, waves, thermodynamics, and modern physics through interactive simulations.",
        "icon": "Atom",
        "color": "blue",
        "order_index": 1,
        "translations": {
            "kn": {"name": "ಭೌತಶಾಸ್ತ್ರ", "description": "ಸಂವಾದಾತ್ಮಕ ಸಿಮ್ಯುಲೇಶನ್‌ಗಳ ಮೂಲಕ ಯಂತ್ರಶಾಸ್ತ್ರ, ವಿದ್ಯುತ್, ದೃಗ್ವಿಜ್ಞಾನ, ತರಂಗಗಳು, ಉಷ್ಣಬಲವಿಜ್ಞಾನ ಮತ್ತು ಆಧುನಿಕ ಭೌತಶಾಸ್ತ್ರವನ್ನು ಅನ್ವೇಷಿಸಿ."},
            "hi": {"name": "भौतिकी", "description": "इंटरैक्टिव सिमुलेशन के माध्यम से यांत्रिकी, विद्युत, प्रकाशिकी, तरंगों, ऊष्मागतिकी और आधुनिक भौतिकी का अन्वेषण करें।"},
            "te": {"name": "భౌతికశాస్త్రం", "description": "ఇంటరాక్టివ్ సిమ్యులేషన్ల ద్వారా యాంత్రికశాస్త్రం, విద్యుత్, దృగ్విజ్ఞానం, తరంగాలు మరియు ఆధునిక భౌతికశాస్త్రాన్ని అన్వేషించండి."},
            "ta": {"name": "இயற்பியல்", "description": "ஊடாடும் உருவகப்படுத்துதல்கள் மூலம் இயக்கவியல், மின்சாரம், ஒளியியல், அலைகள் மற்றும் நவீன இயற்பியலை ஆராயுங்கள்."},
        },
    },
    {
        "id": "chemistry",
        "name": "Chemistry",
        "slug": "chemistry",
        "description": "Understand chemical reactions, molecular structures, acids, bases, periodic trends, and chemical equations through virtual experiments.",
        "icon": "FlaskConical",
        "color": "purple",
        "order_index": 2,
        "translations": {
            "kn": {"name": "ರಸಾಯನಶಾಸ್ತ್ರ", "description": "ವರ್ಚುವಲ್ ಪ್ರಯೋಗಗಳ ಮೂಲಕ ರಾಸಾಯನಿಕ ಕ್ರಿಯೆಗಳು, ಪರಮಾಣು ರಚನೆ, ಆಮ್ಲ-ಪ್ರತ್ಯಾಮ್ಲಗಳು, ಆವರ್ತಕ ಪ್ರವೃತ್ತಿಗಳು ಮತ್ತು ಸಮೀಕರಣಗಳನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ."},
            "hi": {"name": "रसायन विज्ञान", "description": "वर्चुअल प्रयोगों के माध्यम से रासायनिक अभिक्रियाएँ, आणविक संरचना, अम्ल-क्षार और आवर्ती प्रवृत्तियाँ समझें।"},
            "te": {"name": "రసాయనశాస్త్రం", "description": "వర్చువల్ ప్రయోగాల ద్వారా రసాయన చర్యలు, పరమాణు నిర్మాణం, ఆమ్లాలు, క్షారాలు మరియు ఆవర్తన ధర్మాలను అర్థం చేసుకోండి."},
            "ta": {"name": "வேதியியல்", "description": "மெய்நிகர் சோதனைகள் மூலம் வேதிவினைகள், மூலக்கூறு அமைப்புகள், அமில-காரங்கள் மற்றும் தனிம போக்குகளைப் புரிந்துகொள்ளுங்கள்."},
        },
    },
    {
        "id": "biology",
        "name": "Biology",
        "slug": "biology",
        "description": "Explore cells, genetics, anatomy, ecology, microbiology, and biological processes using interactive visual models.",
        "icon": "Dna",
        "color": "green",
        "order_index": 3,
        "translations": {
            "kn": {"name": "ಜೀವಶಾಸ್ತ್ರ", "description": "ಸಂವಾದಾತ್ಮಕ ದೃಶ್ಯ ಮಾದರಿಗಳನ್ನು ಬಳಸಿ ಜೀವಕೋಶಗಳು, ತಳಿಶಾಸ್ತ್ರ, ಶರೀರಶಾಸ್ತ್ರ, ಪರಿಸರಶಾಸ್ತ್ರ ಮತ್ತು ಜೈವಿಕ ಪ್ರಕ್ರಿಯೆಗಳನ್ನು ಅನ್ವೇಷಿಸಿ."},
            "hi": {"name": "जीव विज्ञान", "description": "इंटरैक्टिव विज़ुअल मॉडल से कोशिकाओं, आनुवंशिकी, शरीर क्रिया विज्ञान, पारिस्थितिकी और जैविक प्रक्रियाओं का अध्ययन करें।"},
            "te": {"name": "జీవశాస్త్రం", "description": "ఇంటరాక్టివ్ దృశ్య నమూనాలతో కణాలు, జన్యుశాస్త్రం, శరీరధర్మశాస్త్రం మరియు పర్యావరణ వ్యవస్థలను అన్వేషించండి."},
            "ta": {"name": "உயிரியல்", "description": "ஊடாடும் மாதிரிகள் மூலம் செல்கள், மரபியல், உடலியல், சூழலியல் மற்றும் உயிரியல் செயல்முறைகளை ஆராயுங்கள்."},
        },
    },
    {
        "id": "mathematics",
        "name": "Mathematics",
        "slug": "mathematics",
        "description": "Learn algebra, geometry, calculus, statistics, trigonometry, and probability through dynamic mathematical visualizations.",
        "icon": "Calculator",
        "color": "orange",
        "order_index": 4,
        "translations": {
            "kn": {"name": "ಗಣಿತಶಾಸ್ತ್ರ", "description": "ಚಲನಶೀಲ ಗಣಿತೀಯ ದೃಶ್ಯೀಕರಣಗಳ ಮೂಲಕ ಬೀಜಗಣಿತ, ರೇಖಾಗಣಿತ, ಕಲನಶಾಸ್ತ್ರ, ಸಂಖ್ಯಾಶಾಸ್ತ್ರ, ತ್ರಿಕೋನಮಿತಿ ಮತ್ತು ಸಂಭವನೀಯತೆಯನ್ನು ಕಲಿಯಿರಿ."},
            "hi": {"name": "गणित", "description": "गतिशील गणितीय ग्राफ़ के माध्यम से बीजगणित, ज्यामिति, कलन, सांख्यिकी, त्रिकोणमिति और प्रायिकता सीखें।"},
            "te": {"name": "గణితశాస్త్రం", "description": "డైనమిక్ గణిత గ్రాఫ్‌ల ద్వారా బీజగణితం, రేఖాగణితం, కలనగణితం, త్రికోణమితి మరియు సంభావ్యతను నేర్చుకోండి."},
            "ta": {"name": "கணிதம்", "description": "இயக்கக் கணித வரைபடங்கள் மூலம் இயற்கணிதம், வடிவியல், நுண்கணிதம், முக்கோணவியல் மற்றும் நிகழ்தகவைக் கற்றுக்கொள்ளுங்கள்."},
        },
    },
]

ALL_EXPERIMENTS_SEED: list[dict[str, Any]] = [
    *PHYSICS_EXPERIMENTS,
    *CHEMISTRY_EXPERIMENTS,
    *BIOLOGY_EXPERIMENTS,
    *MATH_EXPERIMENTS,
]
