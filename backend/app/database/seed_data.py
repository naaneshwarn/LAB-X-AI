"""Seed dataset for LabXAI: demo student, four physics experiments, and 20 quiz questions."""

from typing import Any

DEFAULT_DEMO_STUDENT: dict[str, Any] = {
    "id": "demo-student-1",
    "name": "Aarav Sharma (Demo Student)",
    "email": "demo.student@labxai.edu",
    "grade_level": "Class 10 - High School",
    "preferred_language": "en",
    "theme": "light",
    "narration_enabled": True,
    "is_demo": True,
}

EXPERIMENTS_SEED: list[dict[str, Any]] = [
    {
        "id": "ohms-law",
        "title": "Ohm's Law & DC Circuit Analysis",
        "title_kn": "ಓಮ್ ನಿಯಮ ಮತ್ತು ಡಿ.ಸಿ. ವಿದ್ಯುತ್ ಮಂಡಲ ವಿಶ್ಲೇಷಣೆ",
        "subject": "Physics - Electricity",
        "difficulty": "Beginner",
        "duration_minutes": 15,
        "short_description": (
            "Explore the linear relationship between voltage, current, and resistance in a "
            "direct-current circuit with live ammeter, voltmeter, and power calculations."
        ),
        "short_description_kn": (
            "ವೋಲ್ಟೇಜ್, ವಿದ್ಯುತ್ ಪ್ರವಾಹ ಮತ್ತು ರೋಧದ ನಡುವಿನ ರೇಖೀಯ ಸಂಬಂಧವನ್ನು "
            "ನೇರ ಆಮ್ಮೀಟರ್, ವೋಲ್ಟ್‌ಮೀಟರ್ ಮತ್ತು ಶಕ್ತಿ ಲೆಕ್ಕಾಚಾರಗಳೊಂದಿಗೆ ಅಧ್ಯಯನ ಮಾಡಿ."
        ),
        "theory": (
            "Ohm's Law states that at constant temperature, the electric current (I) flowing "
            "through an ohmic conductor between two points is directly proportional to the "
            "potential difference (V) across the two points and inversely proportional to the "
            "resistance (R): V = I × R. Electrical power dissipated by the resistor is P = V × I."
        ),
        "theory_kn": (
            "ಸ್ಥಿರ ತಾಪಮಾನದಲ್ಲಿ, ವಾಹಕದ ಮೂಲಕ ಹರಿಯುವ ವಿದ್ಯುತ್ ಪ್ರವಾಹವು (I) ಅದರ ಎರಡು ತುದಿಗಳ ನಡುವಿನ "
            "ವಿಭವಾಂತರಕ್ಕೆ (V) ನೇರಾನುಪಾತದಲ್ಲಿಯೂ ಮತ್ತು ರೋಧಕ್ಕೆ (R) ವಿಲೋಮಾನುಪಾತದಲ್ಲಿಯೂ ಇರುತ್ತದೆ: "
            "V = I × R. ರೋಧಕದಲ್ಲಿ ವ್ಯಯವಾಗುವ ವಿದ್ಯುತ್ ಶಕ್ತಿ P = V × I."
        ),
        "objectives": [
            "Verify the direct proportionality between voltage (V) and current (I) at constant resistance.",
            "Observe how increasing resistance reduces current for a fixed supply voltage.",
            "Calculate electrical power dissipated across an ohmic resistor (P = V × I).",
            "Interpret the linear V–I characteristic graph whose slope equals resistance.",
        ],
        "objectives_kn": [
            "ಸ್ಥಿರ ರೋಧದಲ್ಲಿ ವೋಲ್ಟೇಜ್ (V) ಮತ್ತು ವಿದ್ಯುತ್ ಪ್ರವಾಹದ (I) ನೇರಾನುಪಾತವನ್ನು ಪರಿಶೀಲಿಸುವುದು.",
            "ಸ್ಥಿರ ವೋಲ್ಟೇಜ್‌ನಲ್ಲಿ ರೋಧ ಹೆಚ್ಚಾದಂತೆ ವಿದ್ಯುತ್ ಪ್ರವಾಹ ಹೇಗೆ ಕಡಿಮೆಯಾಗುತ್ತದೆ ಎಂಬುದನ್ನು ಗಮನಿಸುವುದು.",
            "ರೋಧಕದಲ್ಲಿ ವ್ಯಯವಾಗುವ ವಿದ್ಯುತ್ ಶಕ್ತಿಯನ್ನು (P = V × I) ಲೆಕ್ಕಾಚಾರ ಮಾಡುವುದು.",
            "ರೇಖೀಯ V–I ಗ್ರಾಫ್‌ನ ಇಳಿಜಾರನ್ನು ರೋಧದೊಂದಿಗೆ ಹೋಲಿಸಿ ವಿಶ್ಲೇಷಿಸುವುದು.",
        ],
        "apparatus": [
            "Variable DC Power Supply (0.5 V – 24 V)",
            "Precision Variable Resistor (1 Ω – 200 Ω)",
            "Digital Ammeter (in series)",
            "Digital Voltmeter (in parallel)",
            "Connecting Leads & Switch",
        ],
        "instructions": [
            "Set an initial resistance value (e.g., 10 Ω) using the resistance slider.",
            "Adjust the supply voltage across at least 4 distinct values (e.g., 2 V, 4 V, 6 V, 8 V).",
            "Record each reading into the observation table and watch the V–I graph update.",
            "Double the resistance while holding voltage constant and observe the change in current and power.",
            "Use the AI Tutor to review your measured observations and test your understanding with the quiz.",
        ],
        "instructions_kn": [
            "ರೋಧ ಸ್ಲೈಡರ್ ಬಳಸಿ ಆರಂಭಿಕ ರೋಧದ ಮೌಲ್ಯವನ್ನು (ಉದಾ: 10 Ω) ನಿಗದಿಪಡಿಸಿ.",
            "ವೋಲ್ಟೇಜ್ ಅನ್ನು ಕನಿಷ್ಠ 4 ವಿಭಿನ್ನ ಮೌಲ್ಯಗಳಿಗೆ (ಉದಾ: 2 V, 4 V, 6 V, 8 V) ಬದಲಾಯಿಸಿ.",
            "ಪ್ರತಿ ವಾಚನವನ್ನು ವೀಕ್ಷಣಾ ಪಟ್ಟಿಯಲ್ಲಿ ದಾಖಲಿಸಿ ಮತ್ತು V–I ಗ್ರಾಫ್ ಬದಲಾಗುವುದನ್ನು ಗಮನಿಸಿ.",
            "ವೋಲ್ಟೇಜ್ ಸ್ಥಿರವಾಗಿಟ್ಟು ರೋಧವನ್ನು ದ್ವಿಗುಣಗೊಳಿಸಿ ಪ್ರವಾಹ ಮತ್ತು ಶಕ್ತಿಯ ಬದಲಾವಣೆಯನ್ನು ಗಮನಿಸಿ.",
            "ನಿಮ್ಮ ಫಲಿತಾಂಶಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಲು AI ಬೋಧಕರನ್ನು ಬಳಸಿ ಮತ್ತು ರಸಪ್ರಶ್ನೆ ಪೂರ್ಣಗೊಳಿಸಿ.",
        ],
        "formulas": [
            "V = I × R",
            "I = V / R",
            "P = V × I = I² × R = V² / R",
        ],
        "assumptions": [
            "Conductor behaves as an ideal ohmic resistor with constant temperature.",
            "Connecting wires have negligible resistance and power supply has zero internal resistance.",
            "Resistance must remain strictly positive (R > 0 Ω) to prevent a short circuit.",
        ],
        "parameters_schema": [
            {
                "name": "voltage",
                "label": "Supply Voltage (V)",
                "unit": "V",
                "min": 0.5,
                "max": 24.0,
                "step": 0.5,
                "default": 12.0,
            },
            {
                "name": "resistance",
                "label": "Resistance (R)",
                "unit": "Ω",
                "min": 1.0,
                "max": 200.0,
                "step": 1.0,
                "default": 20.0,
            },
        ],
    },
    {
        "id": "simple-pendulum",
        "title": "Simple Pendulum & Harmonic Motion",
        "title_kn": "ಸರಳ ಲೋಲಕ ಮತ್ತು ಸರಳ ಸಂಗತ ಚಲನೆ",
        "subject": "Physics - Mechanics",
        "difficulty": "Beginner",
        "duration_minutes": 15,
        "short_description": (
            "Investigate how pendulum length, gravitational acceleration, and initial release angle "
            "determine oscillation period and frequency."
        ),
        "short_description_kn": (
            "ಲೋಲಕದ ಉದ್ದ, ಗುರುತ್ವ ವೇಗೋತ್ಕರ್ಷ ಮತ್ತು ಆರಂಭಿಕ ಕೋನವು ಆವರ್ತನ ಕಾಲ ಮತ್ತು "
            "ಆವೃತ್ತಿಯನ್ನು ಹೇಗೆ ನಿರ್ಧರಿಸುತ್ತದೆ ಎಂಬುದನ್ನು ಅಧ್ಯಯನ ಮಾಡಿ."
        ),
        "theory": (
            "For small angular displacements (θ ≤ 15°), a simple pendulum undergoes simple harmonic "
            "motion with time period T = 2π√(L/g) and frequency f = 1/T. Notably, the ideal small-angle "
            "period depends on length (L) and gravity (g), and is independent of bob mass. For larger "
            "angles, a second-order correction slightly increases the actual period."
        ),
        "theory_kn": (
            "ಸಣ್ಣ ಕೋನೀಯ ಸ್ಥಾನಪಲ್ಲಟಗಳಿಗೆ (θ ≤ 15°), ಸರಳ ಲೋಲಕವು T = 2π√(L/g) ಆವರ್ತನ ಕಾಲ ಮತ್ತು "
            "f = 1/T ಆವೃತ್ತಿಯೊಂದಿಗೆ ಸರಳ ಸಂಗತ ಚಲನೆಯನ್ನು ಮಾಡುತ್ತದೆ. ಸಣ್ಣ ಕೋನದ ಸನ್ನಿಹಿತದಲ್ಲಿ "
            "ಆವರ್ತನ ಕಾಲವು ಉದ್ದ (L) ಮತ್ತು ಗುರುತ್ವದ (g) ಮೇಲೆ ಅವಲಂಬಿತವಾಗಿರುತ್ತದೆ."
        ),
        "objectives": [
            "Measure how time period T scales with the square root of pendulum length L.",
            "Compare pendulum behavior under Earth, Moon, and Mars gravitational accelerations.",
            "Evaluate the small-angle approximation and observe when larger initial angles deviate.",
            "Calculate frequency and total time elapsed over N complete oscillations.",
        ],
        "objectives_kn": [
            "ಆವರ್ತನ ಕಾಲ T ಲೋಲಕದ ಉದ್ದದ ವರ್ಗಮೂಲದೊಂದಿಗೆ ಹೇಗೆ ಬದಲಾಗುತ್ತದೆ ಎಂಬುದನ್ನು ಅಳೆಯುವುದು.",
            "ಭೂಮಿ, ಚಂದ್ರ ಮತ್ತು ಮಂಗಳ ಗ್ರಹದ ಗುರುತ್ವದಲ್ಲಿ ಲೋಲಕದ ಚಲನೆಯನ್ನು ಹೋಲಿಸುವುದು.",
            "ಸಣ್ಣ-ಕೋನ ಸನ್ನಿಹಿತವನ್ನು ಪರಿಶೀಲಿಸುವುದು ಮತ್ತು ದೊಡ್ಡ ಕೋನಗಳಲ್ಲಿ ವ್ಯತ್ಯಾಸವನ್ನು ಗಮನಿಸುವುದು.",
            "N ಪೂರ್ಣ ಆಂದೋಲನಗಳಿಗೆ ಆವೃತ್ತಿ ಮತ್ತು ಒಟ್ಟು ಸಮಯವನ್ನು ಲೆಕ್ಕಾಚಾರ ಮಾಡುವುದು.",
        ],
        "apparatus": [
            "Rigid Support Stand & Protractor Scale",
            "Inextensible Massless String (0.2 m – 5.0 m)",
            "Point-Mass Metallic Bob",
            "Precision Digital Stopwatch",
            "Gravity Environment Selector (Earth / Moon / Mars / Custom)",
        ],
        "instructions": [
            "Start with length L = 1.0 m, Earth gravity g = 9.81 m/s², and small angle θ = 10°.",
            "Record the small-angle time period T and frequency f in the observation table.",
            "Increase length to 2.0 m and 4.0 m — notice that quadrupling length doubles the period.",
            "Switch gravity to Moon (1.62 m/s²) and observe how the pendulum swings much slower.",
            "Increase initial angle above 20° to compare the small-angle approximation with the corrected period.",
        ],
        "instructions_kn": [
            "ಉದ್ದ L = 1.0 m, ಭೂಮಿಯ ಗುರುತ್ವ g = 9.81 m/s² ಮತ್ತು ಸಣ್ಣ ಕೋನ θ = 10° ದೊಂದಿಗೆ ಪ್ರಾರಂಭಿಸಿ.",
            "ಸಣ್ಣ-ಕೋನದ ಆವರ್ತನ ಕಾಲ T ಮತ್ತು ಆವೃತ್ತಿ f ಅನ್ನು ವೀಕ್ಷಣಾ ಪಟ್ಟಿಯಲ್ಲಿ ದಾಖಲಿಸಿ.",
            "ಉದ್ದವನ್ನು 2.0 m ಮತ್ತು 4.0 m ಗೆ ಹೆಚ್ಚಿಸಿ — ಉದ್ದ ನಾಲ್ಕು ಪಟ್ಟಾದಾಗ ಆವರ್ತನ ಕಾಲ ದ್ವಿಗುಣಗೊಳ್ಳುವುದನ್ನು ಗಮನಿಸಿ.",
            "ಗುರುತ್ವವನ್ನು ಚಂದ್ರನ ಮೌಲ್ಯಕ್ಕೆ (1.62 m/s²) ಬದಲಾಯಿಸಿ ಲೋಲಕದ ನಿಧಾನ ಚಲನೆಯನ್ನು ವೀಕ್ಷಿಸಿ.",
            "ಆರಂಭಿಕ ಕೋನವನ್ನು 20° ಗಿಂತ ಹೆಚ್ಚಿಸಿ ಸಣ್ಣ-ಕೋನ ಸನ್ನಿಹಿತ ಮತ್ತು ತಿದ್ದುಪಡಿ ಆವರ್ತನ ಕಾಲವನ್ನು ಹೋಲಿಸಿ.",
        ],
        "formulas": [
            "T = 2π√(L / g)  (small-angle approximation)",
            "f = 1 / T",
            "T_corrected ≈ T × [1 + (1/16)θ₀² + (11/3072)θ₀⁴]  (θ₀ in radians)",
        ],
        "assumptions": [
            "Ideal massless, inextensible string and frictionless pivot.",
            "No air drag or energy damping.",
            "Small-angle formula T = 2π√(L/g) assumes sin(θ) ≈ θ (accurate within ~1% for θ ≤ 15°).",
        ],
        "parameters_schema": [
            {
                "name": "length",
                "label": "Pendulum Length (L)",
                "unit": "m",
                "min": 0.2,
                "max": 5.0,
                "step": 0.1,
                "default": 1.0,
            },
            {
                "name": "gravity",
                "label": "Gravity (g)",
                "unit": "m/s²",
                "min": 1.0,
                "max": 25.0,
                "step": 0.01,
                "default": 9.81,
            },
            {
                "name": "initial_angle",
                "label": "Initial Angle (θ₀)",
                "unit": "°",
                "min": 2.0,
                "max": 60.0,
                "step": 1.0,
                "default": 12.0,
            },
            {
                "name": "oscillations",
                "label": "Number of Oscillations (N)",
                "unit": "cycles",
                "min": 1,
                "max": 50,
                "step": 1,
                "default": 10,
            },
        ],
    },
    {
        "id": "projectile-motion",
        "title": "Projectile Motion & 2D Kinematics",
        "title_kn": "ಪ್ರಕ್ಷೇಪಕ ಚಲನೆ ಮತ್ತು ದ್ವಿ-ಆಯಾಮದ ಚಲನಶಾಸ್ತ್ರ",
        "subject": "Physics - Kinematics",
        "difficulty": "Intermediate",
        "duration_minutes": 20,
        "short_description": (
            "Launch a projectile across varying speeds, angles, and gravity fields to analyze "
            "parabolic trajectories, velocity vectors, apex height, flight time, and range."
        ),
        "short_description_kn": (
            "ವಿವಿಧ ವೇಗ, ಕೋನ ಮತ್ತು ಗುರುತ್ವದಲ್ಲಿ ಪ್ರಕ್ಷೇಪಕವನ್ನು ಉಡಾಯಿಸಿ ಪ್ಯಾರಾಬೋಲಿಕ್ ಪಥ, "
            "ವೇಗ ಸದಿಶಗಳು, ಗರಿಷ್ಠ ಎತ್ತರ, ಹಾರಾಟದ ಸಮಯ ಮತ್ತು ವ್ಯಾಪ್ತಿಯನ್ನು ವಿಶ್ಲೇಷಿಸಿ."
        ),
        "theory": (
            "In idealized projectile motion over level ground with negligible air resistance, "
            "horizontal motion has constant velocity (vx = u cos θ) while vertical motion experiences "
            "constant downward acceleration (−g). Combining both independent components yields a "
            "parabolic path with time of flight T = 2u sin(θ)/g, maximum height H = u² sin²(θ)/(2g), "
            "and horizontal range R = u² sin(2θ)/g."
        ),
        "theory_kn": (
            "ಗಾಳಿಯ ಪ್ರತಿರೋಧವಿಲ್ಲದ ಸಮತಟ್ಟಾದ ನೆಲದ ಮೇಲಿನ ಆದರ್ಶ ಪ್ರಕ್ಷೇಪಕ ಚಲನೆಯಲ್ಲಿ, ಅಡ್ಡ ವೇಗವು "
            "ಸ್ಥಿರವಾಗಿರುತ್ತದೆ (vx = u cos θ) ಮತ್ತು ಲಂಬ ಚಲನೆಯು ಸ್ಥಿರ ಗುರುತ್ವ ವೇಗೋತ್ಕರ್ಷ (−g) ಅನುಭವಿಸುತ್ತದೆ. "
            "ಹಾರಾಟದ ಸಮಯ T = 2u sin(θ)/g, ಗರಿಷ್ಠ ಎತ್ತರ H = u² sin²(θ)/(2g), ಮತ್ತು ವ್ಯಾಪ್ತಿ R = u² sin(2θ)/g."
        ),
        "objectives": [
            "Decompose initial launch velocity into horizontal (vx) and vertical (vy) components.",
            "Verify that 45° produces maximum horizontal range on level ground without air drag.",
            "Confirm that complementary launch angles (e.g., 30° and 60°) yield identical horizontal range.",
            "Observe how gravitational acceleration scales both flight time and maximum height.",
        ],
        "objectives_kn": [
            "ಆರಂಭಿಕ ವೇಗವನ್ನು ಅಡ್ಡ (vx) ಮತ್ತು ಲಂಬ (vy) ಘಟಕಗಳಾಗಿ ವಿಭಜಿಸುವುದು.",
            "ಗಾಳಿಯ ಪ್ರತಿರೋಧವಿಲ್ಲದೆ 45° ಕೋನದಲ್ಲಿ ಗರಿಷ್ಠ ಅಡ್ಡ ವ್ಯಾಪ್ತಿ ದೊರೆಯುತ್ತದೆ ಎಂದು ಪರಿಶೀಲಿಸುವುದು.",
            "ಪೂರಕ ಕೋನಗಳು (ಉದಾ: 30° ಮತ್ತು 60°) ಒಂದೇ ಅಡ್ಡ ವ್ಯಾಪ್ತಿಯನ್ನು ನೀಡುತ್ತವೆ ಎಂದು ದೃಢಪಡಿಸುವುದು.",
            "ಗುರುತ್ವ ವೇಗೋತ್ಕರ್ಷವು ಹಾರಾಟದ ಸಮಯ ಮತ್ತು ಗರಿಷ್ಠ ಎತ್ತರವನ್ನು ಹೇಗೆ ಪ್ರಭಾವಿಸುತ್ತದೆ ಎಂಬುದನ್ನು ಗಮನಿಸುವುದು.",
        ],
        "apparatus": [
            "Calibrated Pneumatic Projectile Launcher",
            "Digital Launch Angle Protractor (1° – 89°)",
            "Photogate Initial Velocity Sensor",
            "2D Optical Trajectory Tracker & Vector Overlay",
        ],
        "instructions": [
            "Set initial velocity u = 20 m/s, launch angle θ = 45°, and gravity g = 9.81 m/s².",
            "Run the simulation and inspect the velocity vectors, maximum height, and range.",
            "Test complementary angles (30° and 60°) at the same initial speed and compare their ranges.",
            "Double the initial velocity and observe that range and maximum height increase by a factor of 4.",
            "Record observations and ask the AI Tutor to explain why vertical velocity becomes zero at the apex.",
        ],
        "instructions_kn": [
            "ಆರಂಭಿಕ ವೇಗ u = 20 m/s, ಉಡಾವಣಾ ಕೋನ θ = 45°, ಮತ್ತು ಗುರುತ್ವ g = 9.81 m/s² ನಿಗದಿಪಡಿಸಿ.",
            "ಸಿಮ್ಯುಲೇಶನ್ ಚಾಲನೆ ಮಾಡಿ ವೇಗ ಸದಿಶಗಳು, ಗರಿಷ್ಠ ಎತ್ತರ ಮತ್ತು ವ್ಯಾಪ್ತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ.",
            "ಒಂದೇ ವೇಗದಲ್ಲಿ ಪೂರಕ ಕೋನಗಳನ್ನು (30° ಮತ್ತು 60°) ಪರೀಕ್ಷಿಸಿ ಅವುಗಳ ವ್ಯಾಪ್ತಿಯನ್ನು ಹೋಲಿಸಿ.",
            "ಆರಂಭಿಕ ವೇಗವನ್ನು ದ್ವಿಗುಣಗೊಳಿಸಿ ವ್ಯಾಪ್ತಿ ಮತ್ತು ಗರಿಷ್ಠ ಎತ್ತರ 4 ಪಟ್ಟು ಹೆಚ್ಚಾಗುವುದನ್ನು ಗಮನಿಸಿ.",
            "ವೀಕ್ಷಣೆಗಳನ್ನು ದಾಖಲಿಸಿ ಮತ್ತು ತುತ್ತತುದಿಯಲ್ಲಿ ಲಂಬ ವೇಗ ಏಕೆ ಶೂನ್ಯವಾಗುತ್ತದೆ ಎಂದು AI ಬೋಧಕರನ್ನು ಕೇಳಿ.",
        ],
        "formulas": [
            "vx = u cos(θ),  vy₀ = u sin(θ)",
            "T = 2 u sin(θ) / g",
            "H = u² sin²(θ) / (2g)",
            "R = u² sin(2θ) / g",
        ],
        "assumptions": [
            "Negligible air resistance and no wind or Magnus lift.",
            "Uniform downward gravitational acceleration (g) over flat horizontal ground.",
            "Launch and landing occur at the same vertical elevation (y₀ = 0 m).",
        ],
        "parameters_schema": [
            {
                "name": "initial_velocity",
                "label": "Initial Velocity (u)",
                "unit": "m/s",
                "min": 1.0,
                "max": 100.0,
                "step": 1.0,
                "default": 25.0,
            },
            {
                "name": "launch_angle",
                "label": "Launch Angle (θ)",
                "unit": "°",
                "min": 1.0,
                "max": 89.0,
                "step": 1.0,
                "default": 45.0,
            },
            {
                "name": "gravity",
                "label": "Gravity (g)",
                "unit": "m/s²",
                "min": 1.0,
                "max": 25.0,
                "step": 0.01,
                "default": 9.81,
            },
        ],
    },
    {
        "id": "convex-lens",
        "title": "Convex Lens Optics & Ray Diagrams",
        "title_kn": "ಪೀನ ಮಸೂರ ದೃಗ್ವಿಜ್ಞಾನ ಮತ್ತು ಕಿರಣ ಚಿತ್ರಗಳು",
        "subject": "Physics - Optics",
        "difficulty": "Intermediate",
        "duration_minutes": 20,
        "short_description": (
            "Trace principal rays through a thin converging convex lens using the Cartesian sign "
            "convention to explore real, virtual, magnified, diminished, and infinity-image regimes."
        ),
        "short_description_kn": (
            "ಕಾರ್ಟೀಸಿಯನ್ ಚಿಹ್ನೆ ನಿಯಮವನ್ನು ಬಳಸಿ ತೆಳುವಾದ ಪೀನ ಮಸೂರದ ಮೂಲಕ ಕಿರಣಗಳನ್ನು ಅನುಸರಿಸಿ "
            "ನೈಜ, ಮಿಥ್ಯ, ವರ್ಧಿತ, ಕುಗ್ಗಿದ ಮತ್ತು ಅನಂತ ಪ್ರತಿಬಿಂಬದ ಸ್ಥಿತಿಗಳನ್ನು ಅಧ್ಯಯನ ಮಾಡಿ."
        ),
        "theory": (
            "Using the standard New Cartesian Sign Convention, light travels left-to-right, the optical "
            "center is the origin, a convex lens has positive focal length (f > 0), and a real object "
            "placed to the left has negative object distance (u < 0). The thin lens equation "
            "1/f = 1/v − 1/u determines image distance v, and lateral magnification is m = v / u."
        ),
        "theory_kn": (
            "ನವ ಕಾರ್ಟೀಸಿಯನ್ ಚಿಹ್ನೆ ನಿಯಮದ ಪ್ರಕಾರ, ಬೆಳಕು ಎಡದಿಂದ ಬಲಕ್ಕೆ ಚಲಿಸುತ್ತದೆ, ದೃಗ್ ಕೇಂದ್ರವು ಮೂಲಬಿಂದುವಾಗಿದೆ, "
            "ಪೀನ ಮಸೂರದ ನಾಭಿದೂರ ಧನಾತ್ಮಕ (f > 0) ಮತ್ತು ಎಡಭಾಗದಲ್ಲಿರುವ ವಸ್ತುವಿನ ದೂರ ಋಣಾತ್ಮಕ (u < 0). "
            "ತೆಳುವಾದ ಮಸೂರದ ಸಮೀಕರಣ 1/f = 1/v − 1/u ಮತ್ತು ವರ್ಧನೆ m = v / u."
        ),
        "objectives": [
            "Apply the thin lens equation (1/f = 1/v − 1/u) using the Cartesian sign convention.",
            "Identify real & inverted vs. virtual & upright images across all object distance regions.",
            "Observe the special singularity when the object is placed at the focal point (|u| = f).",
            "Analyze how magnification m = v/u determines both image size and orientation.",
        ],
        "objectives_kn": [
            "ಕಾರ್ಟೀಸಿಯನ್ ಚಿಹ್ನೆ ನಿಯಮದೊಂದಿಗೆ ತೆಳುವಾದ ಮಸೂರ ಸಮೀಕರಣವನ್ನು (1/f = 1/v − 1/u) ಅನ್ವಯಿಸುವುದು.",
            "ವಿವಿಧ ವಸ್ತು ದೂರಗಳಲ್ಲಿ ನೈಜ-ತಲೆಕೆಳಗಾದ ಮತ್ತು ಮಿಥ್ಯ-ನೇರ ಪ್ರತಿಬಿಂಬಗಳನ್ನು ಗುರುತಿಸುವುದು.",
            "ವಸ್ತುವನ್ನು ನಾಭಿಬಿಂದುವಿನಲ್ಲಿ (|u| = f) ಇರಿಸಿದಾಗ ಉಂಟಾಗುವ ವಿಶೇಷ ಸ್ಥಿತಿಯನ್ನು ಗಮನಿಸುವುದು.",
            "ವರ್ಧನೆ m = v/u ಪ್ರತಿಬಿಂಬದ ಗಾತ್ರ ಮತ್ತು ದಿಕ್ಕನ್ನು ಹೇಗೆ ನಿರ್ಧರಿಸುತ್ತದೆ ಎಂಬುದನ್ನು ವಿಶ್ಲೇಷಿಸುವುದು.",
        ],
        "apparatus": [
            "Optical Bench with Centimeter Scale",
            "Thin Biconvex Converging Lens (Adjustable f: 5 cm – 40 cm)",
            "Illuminated Arrow Object",
            "Movable Projection Screen & Ray Tracer",
        ],
        "instructions": [
            "Keep focal length f = 15 cm and place the object beyond 2F (e.g., object distance 40 cm, u = −40 cm).",
            "Move the object to exactly 2F (30 cm) and verify that the real image forms at +30 cm with m = −1.",
            "Slide the object between F and 2F (e.g., 22 cm) to create a real, inverted, magnified image.",
            "Set object distance equal to focal length (15 cm) to observe parallel emergent rays (image at infinity).",
            "Move the object inside the focal length (e.g., 10 cm) to observe a virtual, upright, magnified image.",
        ],
        "instructions_kn": [
            "ನಾಭಿದೂರ f = 15 cm ಇಟ್ಟು, ವಸ್ತುವನ್ನು 2F ಗಿಂತ ದೂರದಲ್ಲಿ (ಉದಾ: 40 cm, u = −40 cm) ಇರಿಸಿ.",
            "ವಸ್ತುವನ್ನು ಸರಿಯಾಗಿ 2F (30 cm) ನಲ್ಲಿ ಇರಿಸಿ, ಪ್ರತಿಬಿಂಬ +30 cm ನಲ್ಲಿ m = −1 ದೊಂದಿಗೆ ಮೂಡುವುದನ್ನು ಪರಿಶೀಲಿಸಿ.",
            "ವಸ್ತುವನ್ನು F ಮತ್ತು 2F ನಡುವೆ (ಉದಾ: 22 cm) ಇರಿಸಿ ನೈಜ, ತಲೆಕೆಳಗಾದ, ವರ್ಧಿತ ಪ್ರತಿಬಿಂಬವನ್ನು ಗಮನಿಸಿ.",
            "ವಸ್ತು ದೂರವನ್ನು ನಾಭಿದೂರಕ್ಕೆ ಸಮನಾಗಿ (15 cm) ಇರಿಸಿ ಸಮಾನಾಂತರ ಕಿರಣಗಳನ್ನು (ಅನಂತದಲ್ಲಿ ಪ್ರತಿಬಿಂಬ) ವೀಕ್ಷಿಸಿ.",
            "ವಸ್ತುವನ್ನು ನಾಭಿದೂರದ ಒಳಗೆ (ಉದಾ: 10 cm) ತಂದು ಮಿಥ್ಯ, ನೇರ, ವರ್ಧಿತ ಪ್ರತಿಬಿಂಬವನ್ನು ಗಮನಿಸಿ.",
        ],
        "formulas": [
            "1/f = 1/v − 1/u  (Cartesian Sign Convention, u < 0, f > 0)",
            "v = (f × u) / (f + u)",
            "m = v / u = h_i / h_o",
            "P = 100 / f(cm)  (Optical Power in Diopters)",
        ],
        "assumptions": [
            "Thin-lens paraxial approximation (lens thickness negligible compared to distances).",
            "Monochromatic light with no spherical or chromatic aberration.",
            "Cartesian sign convention: real object to the left has negative u; converging lens has positive f.",
        ],
        "parameters_schema": [
            {
                "name": "object_distance",
                "label": "Object Distance |u| (Left of Lens)",
                "unit": "cm",
                "min": 2.0,
                "max": 100.0,
                "step": 1.0,
                "default": 30.0,
            },
            {
                "name": "focal_length",
                "label": "Focal Length (f)",
                "unit": "cm",
                "min": 5.0,
                "max": 40.0,
                "step": 1.0,
                "default": 15.0,
            },
            {
                "name": "object_height",
                "label": "Object Height (h₀)",
                "unit": "cm",
                "min": 1.0,
                "max": 10.0,
                "step": 0.5,
                "default": 4.0,
            },
        ],
    },
]

QUIZZES_SEED: list[dict[str, Any]] = [
    {
        "id": "quiz-ohms-law",
        "experiment_id": "ohms-law",
        "title": "Ohm's Law Mastery Quiz",
        "title_kn": "ಓಮ್ ನಿಯಮ ಪರಿಶೀಲನಾ ರಸಪ್ರಶ್ನೆ",
        "description": "Assess your understanding of voltage, current, resistance, and power in DC circuits.",
        "description_kn": "ಡಿ.ಸಿ. ವಿದ್ಯುತ್ ಮಂಡಲದಲ್ಲಿ ವೋಲ್ಟೇಜ್, ಪ್ರವಾಹ, ರೋಧ ಮತ್ತು ಶಕ್ತಿಯ ತಿಳುವಳಿಕೆಯನ್ನು ಪರೀಕ್ಷಿಸಿ.",
        "passing_score": 60,
        "questions": [
            {
                "id": "q-ohm-1",
                "order_index": 1,
                "question_text": "A 12 V battery is connected across a 4 Ω resistor. What current flows through the circuit?",
                "question_text_kn": "12 V ಬ್ಯಾಟರಿಯನ್ನು 4 Ω ರೋಧಕಕ್ಕೆ ಜೋಡಿಸಲಾಗಿದೆ. ಮಂಡಲದಲ್ಲಿ ಹರಿಯುವ ವಿದ್ಯುತ್ ಪ್ರವಾಹ ಎಷ್ಟು?",
                "options": ["0.33 A", "3.0 A", "8.0 A", "48.0 A"],
                "options_kn": ["0.33 A", "3.0 A", "8.0 A", "48.0 A"],
                "correct_option_index": 1,
                "explanation": "By Ohm's Law, I = V / R = 12 V / 4 Ω = 3.0 A.",
                "explanation_kn": "ಓಮ್ ನಿಯಮದ ಪ್ರಕಾರ, I = V / R = 12 V / 4 Ω = 3.0 A.",
            },
            {
                "id": "q-ohm-2",
                "order_index": 2,
                "question_text": "If the resistance in a circuit is doubled while keeping supply voltage constant, what happens to the current?",
                "question_text_kn": "ವೋಲ್ಟೇಜ್ ಸ್ಥಿರವಾಗಿಟ್ಟು ಮಂಡಲದ ರೋಧವನ್ನು ದ್ವಿಗುಣಗೊಳಿಸಿದರೆ ವಿದ್ಯುತ್ ಪ್ರವಾಹಕ್ಕೆ ಏನಾಗುತ್ತದೆ?",
                "options": [
                    "It doubles",
                    "It remains unchanged",
                    "It is reduced to half",
                    "It becomes four times larger",
                ],
                "options_kn": [
                    "ಅದು ದ್ವಿಗುಣಗೊಳ್ಳುತ್ತದೆ",
                    "ಅದು ಬದಲಾಗುವುದಿಲ್ಲ",
                    "ಅದು ಅರ್ಧದಷ್ಟು ಕಡಿಮೆಯಾಗುತ್ತದೆ",
                    "ಅದು ನಾಲ್ಕು ಪಟ್ಟು ಹೆಚ್ಚಾಗುತ್ತದೆ",
                ],
                "correct_option_index": 2,
                "explanation": "Current is inversely proportional to resistance (I = V / R), so doubling R halves I.",
                "explanation_kn": "ವಿದ್ಯುತ್ ಪ್ರವಾಹವು ರೋಧಕ್ಕೆ ವಿಲೋಮಾನುಪಾತದಲ್ಲಿರುತ್ತದೆ (I = V / R), ಆದ್ದರಿಂದ R ದ್ವಿಗುಣಗೊಂಡಾಗ I ಅರ್ಧವಾಗುತ್ತದೆ.",
            },
            {
                "id": "q-ohm-3",
                "order_index": 3,
                "question_text": "How much electrical power is dissipated when 10 V drives 2 A through an ohmic resistor?",
                "question_text_kn": "10 V ವೋಲ್ಟೇಜ್ ಒಂದು ರೋಧಕದ ಮೂಲಕ 2 A ಪ್ರವಾಹವನ್ನು ಹರಿಸಿದಾಗ ವ್ಯಯವಾಗುವ ವಿದ್ಯುತ್ ಶಕ್ತಿ ಎಷ್ಟು?",
                "options": ["5 W", "12 W", "20 W", "40 W"],
                "options_kn": ["5 W", "12 W", "20 W", "40 W"],
                "correct_option_index": 2,
                "explanation": "Electrical power is P = V × I = 10 V × 2 A = 20 W.",
                "explanation_kn": "ವಿದ್ಯುತ್ ಶಕ್ತಿ P = V × I = 10 V × 2 A = 20 W.",
            },
            {
                "id": "q-ohm-4",
                "order_index": 4,
                "question_text": "On a graph with Voltage (V) on the vertical axis and Current (I) on the horizontal axis, what does the slope represent?",
                "question_text_kn": "ಲಂಬ ಅಕ್ಷದಲ್ಲಿ ವೋಲ್ಟೇಜ್ (V) ಮತ್ತು ಅಡ್ಡ ಅಕ್ಷದಲ್ಲಿ ಪ್ರವಾಹ (I) ಇರುವ ಗ್ರಾಫ್‌ನ ಇಳಿಜಾರು ಏನನ್ನು ಸೂಚಿಸುತ್ತದೆ?",
                "options": ["Power (P)", "Resistance (R)", "Charge (Q)", "Conductance (1/R)"],
                "options_kn": ["ಶಕ್ತಿ (P)", "ರೋಧ (R)", "ಆವೇಶ (Q)", "ವಾಹಕತೆ (1/R)"],
                "correct_option_index": 1,
                "explanation": "Since V = R × I, the slope ΔV / ΔI equals the resistance R.",
                "explanation_kn": "V = R × I ಆಗಿರುವುದರಿಂದ, ಇಳಿಜಾರು ΔV / ΔI ರೋಧ R ಗೆ ಸಮನಾಗಿರುತ್ತದೆ.",
            },
            {
                "id": "q-ohm-5",
                "order_index": 5,
                "question_text": "How should an ammeter and a voltmeter be connected to measure current through and voltage across a resistor?",
                "question_text_kn": "ರೋಧಕದ ಪ್ರವಾಹ ಮತ್ತು ವಿಭವಾಂತರ ಅಳೆಯಲು ಆಮ್ಮೀಟರ್ ಮತ್ತು ವೋಲ್ಟ್‌ಮೀಟರ್ ಅನ್ನು ಹೇಗೆ ಜೋಡಿಸಬೇಕು?",
                "options": [
                    "Ammeter in series, voltmeter in parallel",
                    "Both in parallel",
                    "Ammeter in parallel, voltmeter in series",
                    "Both in series",
                ],
                "options_kn": [
                    "ಆಮ್ಮೀಟರ್ ಸರಣಿಯಲ್ಲಿ, ವೋಲ್ಟ್‌ಮೀಟರ್ ಸಮಾನಾಂತರವಾಗಿ",
                    "ಎರಡೂ ಸಮಾನಾಂತರವಾಗಿ",
                    "ಆಮ್ಮೀಟರ್ ಸಮಾನಾಂತರವಾಗಿ, ವೋಲ್ಟ್‌ಮೀಟರ್ ಸರಣಿಯಲ್ಲಿ",
                    "ಎರಡೂ ಸರಣಿಯಲ್ಲಿ",
                ],
                "correct_option_index": 0,
                "explanation": "An ammeter measures through-current in series (low resistance), while a voltmeter measures potential difference across two nodes in parallel (high resistance).",
                "explanation_kn": "ಆಮ್ಮೀಟರ್ ಪ್ರವಾಹವನ್ನು ಅಳೆಯಲು ಸರಣಿಯಲ್ಲಿ ಮತ್ತು ವೋಲ್ಟ್‌ಮೀಟರ್ ವಿಭವಾಂತರವನ್ನು ಅಳೆಯಲು ಸಮಾನಾಂತರವಾಗಿ ಜೋಡಿಸಬೇಕು.",
            },
        ],
    },
    {
        "id": "quiz-simple-pendulum",
        "experiment_id": "simple-pendulum",
        "title": "Simple Pendulum Mastery Quiz",
        "title_kn": "ಸರಳ ಲೋಲಕ ಪರಿಶೀಲನಾ ರಸಪ್ರಶ್ನೆ",
        "description": "Test your understanding of pendulum period, frequency, gravity effects, and small-angle harmonic motion.",
        "description_kn": "ಲೋಲಕದ ಆವರ್ತನ ಕಾಲ, ಆವೃತ್ತಿ, ಗುರುತ್ವದ ಪ್ರಭಾವ ಮತ್ತು ಸಣ್ಣ-ಕೋನ ಚಲನೆಯ ತಿಳುವಳಿಕೆಯನ್ನು ಪರೀಕ್ಷಿಸಿ.",
        "passing_score": 60,
        "questions": [
            {
                "id": "q-pend-1",
                "order_index": 1,
                "question_text": "What happens to the small-angle time period T of a simple pendulum if its length L is increased to 4 times its original value?",
                "question_text_kn": "ಸರಳ ಲೋಲಕದ ಉದ್ದ L ಅನ್ನು 4 ಪಟ್ಟು ಹೆಚ್ಚಿಸಿದರೆ ಅದರ ಸಣ್ಣ-ಕೋನದ ಆವರ್ತನ ಕಾಲ T ಗೆ ಏನಾಗುತ್ತದೆ?",
                "options": [
                    "It halves",
                    "It stays the same",
                    "It doubles",
                    "It becomes 4 times larger",
                ],
                "options_kn": [
                    "ಅದು ಅರ್ಧವಾಗುತ್ತದೆ",
                    "ಅದು ಬದಲಾಗುವುದಿಲ್ಲ",
                    "ಅದು ದ್ವಿಗುಣಗೊಳ್ಳುತ್ತದೆ",
                    "ಅದು 4 ಪಟ್ಟು ಹೆಚ್ಚಾಗುತ್ತದೆ",
                ],
                "correct_option_index": 2,
                "explanation": "Since T = 2π√(L/g), multiplying L by 4 multiplies T by √4 = 2.",
                "explanation_kn": "T = 2π√(L/g) ಆಗಿರುವುದರಿಂದ, L ಅನ್ನು 4 ರಿಂದ ಗುಣಿಸಿದಾಗ T √4 = 2 ಪಟ್ಟು ಹೆಚ್ಚಾಗುತ್ತದೆ.",
            },
            {
                "id": "q-pend-2",
                "order_index": 2,
                "question_text": "For an ideal simple pendulum in the small-angle regime, how does doubling the mass of the bob affect the time period?",
                "question_text_kn": "ಆದರ್ಶ ಸರಳ ಲೋಲಕದ ಬಾಬ್‌ನ ದ್ರವ್ಯರಾಶಿಯನ್ನು ದ್ವಿಗುಣಗೊಳಿಸಿದರೆ ಆವರ್ತನ ಕಾಲದ ಮೇಲೆ ಯಾವ ಪರಿಣಾಮವಾಗುತ್ತದೆ?",
                "options": [
                    "Period doubles",
                    "Period halves",
                    "No effect on the period",
                    "Period increases by √2",
                ],
                "options_kn": [
                    "ಆವರ್ತನ ಕಾಲ ದ್ವಿಗುಣಗೊಳ್ಳುತ್ತದೆ",
                    "ಆವರ್ತನ ಕಾಲ ಅರ್ಧವಾಗುತ್ತದೆ",
                    "ಆವರ್ತನ ಕಾಲದ ಮೇಲೆ ಯಾವುದೇ ಪರಿಣಾಮವಿಲ್ಲ",
                    "ಆವರ್ತನ ಕಾಲ √2 ಪಟ್ಟು ಹೆಚ್ಚಾಗುತ್ತದೆ",
                ],
                "correct_option_index": 2,
                "explanation": "Mass cancels out of the equation of motion; T = 2π√(L/g) is independent of bob mass.",
                "explanation_kn": "ಚಲನೆಯ ಸಮೀಕರಣದಲ್ಲಿ ದ್ರವ್ಯರಾಶಿ ರದ್ದಾಗುತ್ತದೆ; T = 2π√(L/g) ಬಾಬ್‌ನ ದ್ರವ್ಯರಾಶಿಯಿಂದ ಸ್ವತಂತ್ರವಾಗಿದೆ.",
            },
            {
                "id": "q-pend-3",
                "order_index": 3,
                "question_text": "If a pendulum is moved from Earth (g ≈ 9.81 m/s²) to the Moon (g ≈ 1.62 m/s²) with the same length, what happens to its time period?",
                "question_text_kn": "ಒಂದೇ ಉದ್ದದ ಲೋಲಕವನ್ನು ಭೂಮಿಯಿಂದ ಚಂದ್ರನಿಗೆ (g ≈ 1.62 m/s²) ಕೊಂಡೊಯ್ದರೆ ಆವರ್ತನ ಕಾಲಕ್ಕೆ ಏನಾಗುತ್ತದೆ?",
                "options": [
                    "It decreases significantly",
                    "It increases significantly",
                    "It stays identical",
                    "The pendulum stops oscillating",
                ],
                "options_kn": [
                    "ಅದು ಗಮನಾರ್ಹವಾಗಿ ಕಡಿಮೆಯಾಗುತ್ತದೆ",
                    "ಅದು ಗಮನಾರ್ಹವಾಗಿ ಹೆಚ್ಚಾಗುತ್ತದೆ",
                    "ಅದು ಹಾಗೆಯೇ ಇರುತ್ತದೆ",
                    "ಲೋಲಕ ಆಂದೋಲಿಸುವುದನ್ನು ನಿಲ್ಲಿಸುತ್ತದೆ",
                ],
                "correct_option_index": 1,
                "explanation": "Because T is inversely proportional to √g, weaker gravity on the Moon produces a much longer time period.",
                "explanation_kn": "T ಮೌಲ್ಯವು √g ಗೆ ವಿಲೋಮಾನುಪಾತದಲ್ಲಿರುವುದರಿಂದ, ಚಂದ್ರನ ಕಡಿಮೆ ಗುರುತ್ವದಲ್ಲಿ ಆವರ್ತನ ಕಾಲ ಹೆಚ್ಚಾಗುತ್ತದೆ.",
            },
            {
                "id": "q-pend-4",
                "order_index": 4,
                "question_text": "What is the approximate time period of a 1.0 m simple pendulum on Earth (g = 9.81 m/s²)?",
                "question_text_kn": "ಭೂಮಿಯ ಮೇಲೆ (g = 9.81 m/s²) 1.0 m ಉದ್ದದ ಸರಳ ಲೋಲಕದ ಅಂದಾಜು ಆವರ್ತನ ಕಾಲ ಎಷ್ಟು?",
                "options": ["0.50 s", "1.00 s", "2.01 s", "6.28 s"],
                "options_kn": ["0.50 s", "1.00 s", "2.01 s", "6.28 s"],
                "correct_option_index": 2,
                "explanation": "T = 2π√(1.0 / 9.81) ≈ 2.006 s ≈ 2.01 s (known as a seconds pendulum).",
                "explanation_kn": "T = 2π√(1.0 / 9.81) ≈ 2.006 s ≈ 2.01 s.",
            },
            {
                "id": "q-pend-5",
                "order_index": 5,
                "question_text": "If a pendulum completes 10 oscillations in 25 seconds, what is its frequency?",
                "question_text_kn": "ಒಂದು ಲೋಲಕವು 25 ಸೆಕೆಂಡುಗಳಲ್ಲಿ 10 ಆಂದೋಲನಗಳನ್ನು ಪೂರ್ಣಗೊಳಿಸಿದರೆ, ಅದರ ಆವೃತ್ತಿ ಎಷ್ಟು?",
                "options": ["0.40 Hz", "2.50 Hz", "10.0 Hz", "250 Hz"],
                "options_kn": ["0.40 Hz", "2.50 Hz", "10.0 Hz", "250 Hz"],
                "correct_option_index": 0,
                "explanation": "Period T = 25 s / 10 = 2.5 s, so frequency f = 1 / T = 1 / 2.5 = 0.40 Hz.",
                "explanation_kn": "ಆವರ್ತನ ಕಾಲ T = 25 s / 10 = 2.5 s, ಆದ್ದರಿಂದ ಆವೃತ್ತಿ f = 1 / T = 0.40 Hz.",
            },
        ],
    },
    {
        "id": "quiz-projectile-motion",
        "experiment_id": "projectile-motion",
        "title": "Projectile Motion Mastery Quiz",
        "title_kn": "ಪ್ರಕ್ಷೇಪಕ ಚಲನೆ ಪರಿಶೀಲನಾ ರಸಪ್ರಶ್ನೆ",
        "description": "Evaluate your mastery of 2D kinematics, launch angles, trajectory apex, and range equations.",
        "description_kn": "ದ್ವಿ-ಆಯಾಮದ ಚಲನಶಾಸ್ತ್ರ, ಉಡಾವಣಾ ಕೋನಗಳು, ತುತ್ತತುದಿ ಮತ್ತು ವ್ಯಾಪ್ತಿ ಸಮೀಕರಣಗಳ ಜ್ಞಾನವನ್ನು ಪರೀಕ್ಷಿಸಿ.",
        "passing_score": 60,
        "questions": [
            {
                "id": "q-proj-1",
                "order_index": 1,
                "question_text": "On level ground with negligible air resistance, which launch angle maximizes horizontal range for a fixed launch speed?",
                "question_text_kn": "ಗಾಳಿಯ ಪ್ರತಿರೋಧವಿಲ್ಲದ ಸಮತಟ್ಟಾದ ನೆಲದಲ್ಲಿ ಸ್ಥಿರ ವೇಗಕ್ಕೆ ಗರಿಷ್ಠ ಅಡ್ಡ ವ್ಯಾಪ್ತಿ ನೀಡುವ ಉಡಾವಣಾ ಕೋನ ಯಾವುದು?",
                "options": ["30°", "45°", "60°", "90°"],
                "options_kn": ["30°", "45°", "60°", "90°"],
                "correct_option_index": 1,
                "explanation": "Range R = u² sin(2θ) / g is maximized when sin(2θ) = 1, which occurs at 2θ = 90° or θ = 45°.",
                "explanation_kn": "R = u² sin(2θ) / g ಮೌಲ್ಯವು sin(2θ) = 1 ಆದಾಗ ಅಂದರೆ θ = 45° ನಲ್ಲಿ ಗರಿಷ್ಠವಾಗಿರುತ್ತದೆ.",
            },
            {
                "id": "q-proj-2",
                "order_index": 2,
                "question_text": "At the highest point (apex) of a projectile's trajectory, what is true about its velocity?",
                "question_text_kn": "ಪ್ರಕ್ಷೇಪಕ ಪಥದ ಅತ್ಯುನ್ನತ ಬಿಂದುವಿನಲ್ಲಿ ಅದರ ವೇಗದ ಬಗ್ಗೆ ಯಾವುದು ಸರಿ?",
                "options": [
                    "Both horizontal and vertical velocities are zero",
                    "Vertical velocity is zero while horizontal velocity equals u cos(θ)",
                    "Horizontal velocity is zero while vertical velocity is maximum",
                    "Acceleration becomes zero",
                ],
                "options_kn": [
                    "ಅಡ್ಡ ಮತ್ತು ಲಂಬ ವೇಗಗಳೆರಡೂ ಶೂನ್ಯವಾಗಿರುತ್ತವೆ",
                    "ಲಂಬ ವೇಗ ಶೂನ್ಯವಾಗಿರುತ್ತದೆ ಮತ್ತು ಅಡ್ಡ ವೇಗ u cos(θ) ಆಗಿರುತ್ತದೆ",
                    "ಅಡ್ಡ ವೇಗ ಶೂನ್ಯ ಮತ್ತು ಲಂಬ ವೇಗ ಗರಿಷ್ಠವಾಗಿರುತ್ತದೆ",
                    "ವೇಗೋತ್ಕರ್ಷ ಶೂನ್ಯವಾಗುತ್ತದೆ",
                ],
                "correct_option_index": 1,
                "explanation": "At the apex, vy = 0 m/s, but horizontal velocity vx = u cos(θ) remains constant and gravity still acts downward.",
                "explanation_kn": "ತುತ್ತತುದಿಯಲ್ಲಿ vy = 0 ಆಗುತ್ತದೆ, ಆದರೆ ಅಡ್ಡ ವೇಗ vx = u cos(θ) ಸ್ಥಿರವಾಗಿರುತ್ತದೆ.",
            },
            {
                "id": "q-proj-3",
                "order_index": 3,
                "question_text": "Which pair of launch angles produces the exact same horizontal range for a given speed (ignoring air resistance)?",
                "question_text_kn": "ಒಂದೇ ವೇಗದಲ್ಲಿ ಯಾವ ಜೋಡಿ ಉಡಾವಣಾ ಕೋನಗಳು ಸಮಾನ ಅಡ್ಡ ವ್ಯಾಪ್ತಿಯನ್ನು ನೀಡುತ್ತವೆ?",
                "options": ["20° and 40°", "30° and 60°", "45° and 90°", "15° and 60°"],
                "options_kn": ["20° ಮತ್ತು 40°", "30° ಮತ್ತು 60°", "45° ಮತ್ತು 90°", "15° ಮತ್ತು 60°"],
                "correct_option_index": 1,
                "explanation": "Complementary angles (θ₁ + θ₂ = 90°) satisfy sin(2θ₁) = sin(2θ₂), so 30° and 60° give identical ranges.",
                "explanation_kn": "ಪೂರಕ ಕೋನಗಳಿಗೆ (30° + 60° = 90°) sin(2θ) ಸಮನಾಗಿರುವುದರಿಂದ ಒಂದೇ ವ್ಯಾಪ್ತಿ ಸಿಗುತ್ತದೆ.",
            },
            {
                "id": "q-proj-4",
                "order_index": 4,
                "question_text": "A ball is launched at 20 m/s at 30° where g = 10 m/s². What is its total time of flight?",
                "question_text_kn": "g = 10 m/s² ಇರುವಾಗ 20 m/s ವೇಗದಲ್ಲಿ 30° ಕೋನದಲ್ಲಿ ಎಸೆದ ಚೆಂಡಿನ ಒಟ್ಟು ಹಾರಾಟದ ಸಮಯ ಎಷ್ಟು?",
                "options": ["1.0 s", "2.0 s", "3.46 s", "4.0 s"],
                "options_kn": ["1.0 s", "2.0 s", "3.46 s", "4.0 s"],
                "correct_option_index": 1,
                "explanation": "T = 2u sin(θ) / g = (2 × 20 × 0.5) / 10 = 2.0 s.",
                "explanation_kn": "T = 2u sin(θ) / g = (2 × 20 × 0.5) / 10 = 2.0 s.",
            },
            {
                "id": "q-proj-5",
                "order_index": 5,
                "question_text": "If initial launch speed u is doubled while angle and gravity stay constant, how does maximum height H change?",
                "question_text_kn": "ಕೋನ ಮತ್ತು ಗುರುತ್ವ ಸ್ಥಿರವಾಗಿಟ್ಟು ಆರಂಭಿಕ ವೇಗ u ಅನ್ನು ದ್ವಿಗುಣಗೊಳಿಸಿದರೆ ಗರಿಷ್ಠ ಎತ್ತರ H ಹೇಗೆ ಬದಲಾಗುತ್ತದೆ?",
                "options": [
                    "It doubles",
                    "It triples",
                    "It increases by a factor of 4",
                    "It remains the same",
                ],
                "options_kn": [
                    "ಅದು ದ್ವಿಗುಣಗೊಳ್ಳುತ್ತದೆ",
                    "ಅದು ಮೂರು ಪಟ್ಟಾಗುತ್ತದೆ",
                    "ಅದು 4 ಪಟ್ಟು ಹೆಚ್ಚಾಗುತ್ತದೆ",
                    "ಅದು ಬದಲಾಗುವುದಿಲ್ಲ",
                ],
                "correct_option_index": 2,
                "explanation": "Since H = u² sin²(θ) / (2g), H scales with u², so doubling u multiplies H by 4.",
                "explanation_kn": "H = u² sin²(θ) / (2g) ಆಗಿರುವುದರಿಂದ, u ದ್ವಿಗುಣಗೊಂಡಾಗ H 4 ಪಟ್ಟು ಹೆಚ್ಚಾಗುತ್ತದೆ.",
            },
        ],
    },
    {
        "id": "quiz-convex-lens",
        "experiment_id": "convex-lens",
        "title": "Convex Lens Optics Mastery Quiz",
        "title_kn": "ಪೀನ ಮಸೂರ ದೃಗ್ವಿಜ್ಞಾನ ಪರಿಶೀಲನಾ ರಸಪ್ರಶ್ನೆ",
        "description": "Verify your skills with the thin lens formula, Cartesian signs, magnification, and ray diagrams.",
        "description_kn": "ತೆಳುವಾದ ಮಸೂರದ ಸಮೀಕರಣ, ಕಾರ್ಟೀಸಿಯನ್ ಚಿಹ್ನೆಗಳು, ವರ್ಧನೆ ಮತ್ತು ಕಿರಣ ಚಿತ್ರಗಳ ಜ್ಞಾನವನ್ನು ಪರೀಕ್ಷಿಸಿ.",
        "passing_score": 60,
        "questions": [
            {
                "id": "q-lens-1",
                "order_index": 1,
                "question_text": "An object is placed 30 cm to the left of a convex lens (u = −30 cm) of focal length f = +15 cm. Where is the image formed?",
                "question_text_kn": "f = +15 cm ನಾಭಿದೂರದ ಪೀನ ಮಸೂರದ ಎಡಕ್ಕೆ 30 cm ದೂರದಲ್ಲಿ (u = −30 cm) ವಸ್ತು ಇಟ್ಟಾಗ ಪ್ರತಿಬಿಂಬ ಎಲ್ಲಿ ಮೂಡುತ್ತದೆ?",
                "options": [
                    "v = +15 cm (real)",
                    "v = +30 cm (real)",
                    "v = −30 cm (virtual)",
                    "At infinity",
                ],
                "options_kn": [
                    "v = +15 cm (ನೈಜ)",
                    "v = +30 cm (ನೈಜ)",
                    "v = −30 cm (ಮಿಥ್ಯ)",
                    "ಅನಂತದಲ್ಲಿ",
                ],
                "correct_option_index": 1,
                "explanation": "1/v = 1/f + 1/u = 1/15 − 1/30 = 1/30, so v = +30 cm (real, inverted, same size at 2F).",
                "explanation_kn": "1/v = 1/15 − 1/30 = 1/30, ಆದ್ದರಿಂದ v = +30 cm (2F ನಲ್ಲಿ ನೈಜ ಮತ್ತು ಸಮಾನ ಗಾತ್ರದ ಪ್ರತಿಬಿಂಬ).",
            },
            {
                "id": "q-lens-2",
                "order_index": 2,
                "question_text": "What kind of image is formed when a real object is placed between the optical center and the focal point (|u| < f) of a convex lens?",
                "question_text_kn": "ವಸ್ತುವನ್ನು ಪೀನ ಮಸೂರದ ದೃಗ್ ಕೇಂದ್ರ ಮತ್ತು ನಾಭಿಬಿಂದುವಿನ ನಡುವೆ (|u| < f) ಇರಿಸಿದಾಗ ಯಾವ ರೀತಿಯ ಪ್ರತಿಬಿಂಬ ಮೂಡುತ್ತದೆ?",
                "options": [
                    "Real, inverted, diminished",
                    "Real, inverted, magnified",
                    "Virtual, upright, magnified",
                    "Virtual, upright, diminished",
                ],
                "options_kn": [
                    "ನೈಜ, ತಲೆಕೆಳಗಾದ, ಕುಗ್ಗಿದ",
                    "ನೈಜ, ತಲೆಕೆಳಗಾದ, ವರ್ಧಿತ",
                    "ಮಿಥ್ಯ, ನೇರ, ವರ್ಧಿತ",
                    "ಮಿಥ್ಯ, ನೇರ, ಕುಗ್ಗಿದ",
                ],
                "correct_option_index": 2,
                "explanation": "Inside the focal length, a convex lens acts as a magnifying glass, forming a virtual, upright, magnified image on the same side as the object (v < 0, m > +1).",
                "explanation_kn": "ನಾಭಿದೂರದ ಒಳಗೆ ಪೀನ ಮಸೂರವು ಭೂತಗನ್ನಡಿಯಂತೆ ವರ್ತಿಸಿ ಮಿಥ್ಯ, ನೇರ ಮತ್ತು ವರ್ಧಿತ ಪ್ರತಿಬಿಂಬವನ್ನು ನೀಡುತ್ತದೆ.",
            },
            {
                "id": "q-lens-3",
                "order_index": 3,
                "question_text": "What happens to the refracted rays when an object is placed exactly at the focal point (|u| = f) of a convex lens?",
                "question_text_kn": "ವಸ್ತುವನ್ನು ಪೀನ ಮಸೂರದ ಸರಿಯಾದ ನಾಭಿಬಿಂದುವಿನಲ್ಲಿ (|u| = f) ಇರಿಸಿದಾಗ ವಕ್ರೀಭವನಗೊಂಡ ಕಿರಣಗಳಿಗೆ ಏನಾಗುತ್ತದೆ?",
                "options": [
                    "They converge at 2F",
                    "They emerge parallel, forming an image at infinity",
                    "They reflect backward",
                    "They form a same-size upright image at F",
                ],
                "options_kn": [
                    "ಅವು 2F ನಲ್ಲಿ ಒಂದಾಗುತ್ತವೆ",
                    "ಅವು ಸಮಾನಾಂತರವಾಗಿ ಹೊರಬಂದು ಅನಂತದಲ್ಲಿ ಪ್ರತಿಬಿಂಬ ಮೂಡಿಸುತ್ತವೆ",
                    "ಅವು ಹಿಂದಕ್ಕೆ ಪ್ರತಿಫಲಿಸುತ್ತವೆ",
                    "ಅವು F ನಲ್ಲಿ ಸಮಾನ ಗಾತ್ರದ ನೇರ ಪ್ರತಿಬಿಂಬ ನೀಡುತ್ತವೆ",
                ],
                "correct_option_index": 1,
                "explanation": "At u = −f, 1/v = 1/f + 1/(−f) = 0, meaning v → ∞ and the emergent rays are parallel.",
                "explanation_kn": "u = −f ಆದಾಗ 1/v = 0 ಆಗುತ್ತದೆ, ಅಂದರೆ ಕಿರಣಗಳು ಸಮಾನಾಂತರವಾಗಿ ಸಾಗಿ ಅನಂತದಲ್ಲಿ ಪ್ರತಿಬಿಂಬ ಉಂಟಾಗುತ್ತದೆ.",
            },
            {
                "id": "q-lens-4",
                "order_index": 4,
                "question_text": "In the Cartesian sign convention for a thin lens, what does a negative magnification (m < 0) signify?",
                "question_text_kn": "ಕಾರ್ಟೀಸಿಯನ್ ಚಿಹ್ನೆ ನಿಯಮದಲ್ಲಿ ಋಣಾತ್ಮಕ ವರ್ಧನೆ (m < 0) ಏನನ್ನು ಸೂಚಿಸುತ್ತದೆ?",
                "options": [
                    "The image is upright and virtual",
                    "The image is inverted (and real for a real object)",
                    "The lens is diverging",
                    "The object is at infinity",
                ],
                "options_kn": [
                    "ಪ್ರತಿಬಿಂಬವು ನೇರ ಮತ್ತು ಮಿಥ್ಯವಾಗಿದೆ",
                    "ಪ್ರತಿಬಿಂಬವು ತಲೆಕೆಳಗಾಗಿದೆ (ಮತ್ತು ನೈಜ ವಸ್ತುವಿಗೆ ನೈಜವಾಗಿದೆ)",
                    "ಮಸೂರವು ನಿಮ್ನವಾಗಿದೆ",
                    "ವಸ್ತು ಅನಂತದಲ್ಲಿದೆ",
                ],
                "correct_option_index": 1,
                "explanation": "Since m = h_i / h_o = v / u, a negative m means h_i has the opposite sign to h_o — the image is inverted.",
                "explanation_kn": "m = h_i / h_o ಆಗಿರುವುದರಿಂದ, ಋಣಾತ್ಮಕ m ಪ್ರತಿಬಿಂಬವು ತಲೆಕೆಳಗಾಗಿದೆ ಎಂಬುದನ್ನು ಸೂಚಿಸುತ್ತದೆ.",
            },
            {
                "id": "q-lens-5",
                "order_index": 5,
                "question_text": "What is the optical power (in Diopters) of a convex lens with focal length f = +20 cm?",
                "question_text_kn": "f = +20 cm ನಾಭಿದೂರವಿರುವ ಪೀನ ಮಸೂರದ ದೃಗ್ ಶಕ್ತಿ (ಡಯಾಪ್ಟರ್‌ಗಳಲ್ಲಿ) ಎಷ್ಟು?",
                "options": ["+0.05 D", "+2.0 D", "+5.0 D", "+20.0 D"],
                "options_kn": ["+0.05 D", "+2.0 D", "+5.0 D", "+20.0 D"],
                "correct_option_index": 2,
                "explanation": "Optical power P = 1 / f(meters) = 1 / 0.20 m = +5.0 D.",
                "explanation_kn": "ದೃಗ್ ಶಕ್ತಿ P = 1 / f(ಮೀಟರ್) = 1 / 0.20 m = +5.0 D.",
            },
        ],
    },
]
