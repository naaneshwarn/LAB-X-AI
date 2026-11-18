"""Multidisciplinary quiz bank for all 48 LabXAI experiments.

Preserves the 4 original bilingual Physics quizzes verbatim and adds validated
quizzes for all 44 additional Physics, Chemistry, Biology, and Mathematics experiments
covering MCQ, True/False, Numerical, and Formula-based question types.
"""

from __future__ import annotations

from typing import Any

from app.database.seed_data import QUIZZES_SEED as ORIGINAL_QUIZZES_SEED


def _mcq(qid: str, idx: int, text: str, options: list[str], correct: int, explanation: str, qtype: str = "mcq") -> dict[str, Any]:
    return {
        "id": qid,
        "order_index": idx,
        "question_type": qtype,
        "question_text": text,
        "question_text_kn": text,
        "options": options,
        "options_kn": options,
        "correct_option_index": correct,
        "numeric_answer": None,
        "numeric_tolerance": 0.05,
        "unit": "",
        "explanation": explanation,
        "explanation_kn": explanation,
    }


def _tf(qid: str, idx: int, text: str, is_true: bool, explanation: str) -> dict[str, Any]:
    return {
        "id": qid,
        "order_index": idx,
        "question_type": "true_false",
        "question_text": text,
        "question_text_kn": text,
        "options": ["True", "False"],
        "options_kn": ["ಸರಿ (True)", "ತಪ್ಪು (False)"],
        "correct_option_index": 0 if is_true else 1,
        "numeric_answer": None,
        "numeric_tolerance": 0.05,
        "unit": "",
        "explanation": explanation,
        "explanation_kn": explanation,
    }


def _num(qid: str, idx: int, text: str, answer: float, unit: str, tolerance: float, explanation: str) -> dict[str, Any]:
    return {
        "id": qid,
        "order_index": idx,
        "question_type": "numerical",
        "question_text": text,
        "question_text_kn": text,
        "options": [],
        "options_kn": [],
        "correct_option_index": 0,
        "numeric_answer": answer,
        "numeric_tolerance": tolerance,
        "unit": unit,
        "explanation": explanation,
        "explanation_kn": explanation,
    }


def _quiz(exp_id: str, subject: str, difficulty: str, title: str, title_kn: str, desc: str, questions: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "id": f"quiz-{exp_id}",
        "experiment_id": exp_id,
        "subject": subject,
        "difficulty": difficulty,
        "title": title,
        "title_kn": title_kn,
        "description": desc,
        "description_kn": desc,
        "passing_score": 60,
        "questions": questions,
    }


# Tag original 4 quizzes with subject and difficulty cleanly without mutating IDs
_ORIG_META = {
    "quiz-ohms-law": ("Physics", "Basic"),
    "quiz-simple-pendulum": ("Physics", "Basic"),
    "quiz-projectile-motion": ("Physics", "Intermediate"),
    "quiz-convex-lens": ("Physics", "Intermediate"),
}

PRESERVED_QUIZZES: list[dict[str, Any]] = []
for _q in ORIGINAL_QUIZZES_SEED:
    subj, diff = _ORIG_META[_q["id"]]
    PRESERVED_QUIZZES.append(
        {
            **_q,
            "subject": subj,
            "difficulty": diff,
            "questions": [
                {
                    "question_type": "mcq",
                    "numeric_answer": None,
                    "numeric_tolerance": 0.05,
                    "unit": "",
                    **item,
                }
                for item in _q["questions"]
            ],
        }
    )


NEW_QUIZZES: list[dict[str, Any]] = [
    # ==================== NEW PHYSICS (8) ====================
    _quiz(
        "reflection-of-light", "Physics", "Basic",
        "Reflection of Light Quiz", "ಬೆಳಕಿನ ಪ್ರತಿಫಲನ ರಸಪ್ರಶ್ನೆ",
        "Verify the laws of specular reflection, deviation angles, and inclined plane mirrors.",
        [
            _mcq("q-refl-1", 1, "If a light ray strikes a plane mirror at an incident angle of 35° to the normal, what is the angle of reflection?", ["25°", "35°", "55°", "70°"], 1, "By the Law of Reflection, θᵣ = θᵢ = 35°."),
            _num("q-refl-2", 2, "Calculate the angle of deviation δ = 180° − 2θᵢ when θᵢ = 30°.", 120.0, "°", 0.5, "δ = 180° − 2(30°) = 120°."),
            _tf("q-refl-3", 3, "Angles of incidence and reflection are measured from the mirror's surface rather than the normal.", False, "False — both θᵢ and θᵣ are always measured from the surface normal."),
            _mcq("q-refl-4", 4, "How many images are formed between two plane mirrors inclined at 90°?", ["1", "2", "3", "4"], 2, "n = (360° / 90°) − 1 = 3 images."),
        ],
    ),
    _quiz(
        "refraction-of-light", "Physics", "Basic",
        "Refraction & Snell's Law Quiz", "ವಕ್ರೀಭವನ ಮತ್ತು ಸ್ನೆಲ್ ನಿಯಮ ರಸಪ್ರಶ್ನೆ",
        "Test Snell's Law, refractive index speed scaling, and Total Internal Reflection.",
        [
            _mcq("q-refr-1", 1, "Which formula correctly states Snell's Law?", ["n₁ cos θ₁ = n₂ cos θ₂", "n₁ sin θ₁ = n₂ sin θ₂", "n₁ / sin θ₁ = n₂ / sin θ₂", "n₁ tan θ₁ = n₂ tan θ₂"], 1, "Snell's Law is n₁ sin θ₁ = n₂ sin θ₂.", "formula"),
            _tf("q-refr-2", 2, "Total Internal Reflection can occur when light travels from air (n=1.0) into glass (n=1.5).", False, "False — TIR only occurs when light travels from a denser medium (n₁ > n₂) to a rarer medium."),
            _num("q-refr-3", 3, "What is the speed of light (in ×10⁸ m/s) in a medium with refractive index n = 1.5? (Take c = 3.0 × 10⁸ m/s)", 2.0, "×10⁸ m/s", 0.05, "v = c / n = 3.0 / 1.5 = 2.0 × 10⁸ m/s."),
            _mcq("q-refr-4", 4, "What is the critical angle θc for glass (n=1.5) to air (n=1.0)?", ["24.4°", "41.8°", "48.6°", "60.0°"], 1, "sin θc = 1.0 / 1.5 = 0.6667 → θc ≈ 41.8°."),
        ],
    ),
    _quiz(
        "series-parallel-circuits", "Physics", "Intermediate",
        "Series & Parallel Circuits Quiz", "ಶ್ರೇಣಿ ಮತ್ತು ಸಮಾನಾಂತರ ಮಂಡಲ ರಸಪ್ರಶ್ನೆ",
        "Master equivalent resistance, current splitting, and voltage division.",
        [
            _num("q-sp-1", 1, "Three resistors of 10 Ω, 20 Ω, and 30 Ω are connected in series. What is Req (in Ω)?", 60.0, "Ω", 0.1, "In series, Req = R₁ + R₂ + R₃ = 10 + 20 + 30 = 60 Ω."),
            _num("q-sp-2", 2, "Two 10 Ω resistors are connected in parallel. What is their equivalent resistance (in Ω)?", 5.0, "Ω", 0.1, "1/Req = 1/10 + 1/10 = 2/10 → Req = 5 Ω."),
            _tf("q-sp-3", 3, "In a parallel circuit, the voltage across every branch is identical to the supply voltage.", True, "True — all parallel branches share the same two electrical nodes."),
            _mcq("q-sp-4", 4, "Why are household appliances wired in parallel rather than series?", ["To increase total resistance", "So each appliance gets full mains voltage and operates independently", "To reduce total current drawn", "Because series circuits cannot use AC"], 1, "Parallel wiring supplies full mains voltage to each device independently."),
        ],
    ),
    _quiz(
        "newtons-laws", "Physics", "Intermediate",
        "Newton's Laws & Friction Quiz", "ನ್ಯೂಟನ್ ನಿಯಮಗಳ ರಸಪ್ರಶ್ನೆ",
        "Evaluate F = ma, kinetic friction, equilibrium, and momentum calculations.",
        [
            _num("q-newt-1", 1, "A 5 kg block experiences a net force of 20 N. What is its acceleration (in m/s²)?", 4.0, "m/s²", 0.05, "By Newton's Second Law, a = F_net / m = 20 / 5 = 4.0 m/s²."),
            _mcq("q-newt-2", 2, "Which formula gives maximum friction force on a flat horizontal surface?", ["f = μ m / g", "f = μ m g", "f = m g / μ", "f = ½ μ m v²"], 1, "Normal force N = mg, so friction f = μN = μmg.", "formula"),
            _tf("q-newt-3", 3, "If the applied horizontal force is less than maximum static friction, the block accelerates slowly.", False, "False — static friction matches the applied force so F_net = 0 and acceleration is zero."),
            _num("q-newt-4", 4, "Starting from rest with a = 3 m/s² for t = 4 s, what displacement (in m) does the block cover?", 24.0, "m", 0.1, "s = ½ a t² = 0.5 × 3 × 16 = 24 m."),
        ],
    ),
    _quiz(
        "electromagnetic-induction", "Physics", "Advanced",
        "Electromagnetic Induction Quiz", "ವಿದ್ಯುತ್ಕಾಂತೀಯ ಪ್ರೇರಣೆ ರಸಪ್ರಶ್ನೆ",
        "Assess Faraday's Law, magnetic flux linkage, and AC generator peak/RMS EMF.",
        [
            _mcq("q-emi-1", 1, "Which expression gives peak induced EMF ε₀ for a rotating N-turn coil of area A in field B?", ["N B A / ω", "N B A ω", "B A / (N ω)", "½ N B A²"], 1, "ε(t) = NBAω sin(ωt), so peak EMF ε₀ = NBAω.", "formula"),
            _tf("q-emi-2", 2, "Maximum induced EMF occurs when magnetic flux Φ(t) through the rotating coil crosses zero.", True, "True — EMF is proportional to the rate of change dΦ/dt, which is steepest when cos(ωt) = 0."),
            _num("q-emi-3", 3, "If peak AC voltage ε₀ = 141.4 V, what is ε_rms (in V)?", 100.0, "V", 0.5, "ε_rms = ε₀ / √2 ≈ 141.4 / 1.414 = 100 V."),
            _mcq("q-emi-4", 4, "Doubling the rotation frequency f of an AC generator causes peak EMF ε₀ to:", ["Stay constant", "Double", "Quadruple", "Halve"], 1, "Since ω = 2πf and ε₀ = NBAω, doubling f doubles ε₀."),
        ],
    ),
    _quiz(
        "wave-interference", "Physics", "Advanced",
        "Wave Interference & Diffraction Quiz", "ತರಂಗ ವ್ಯತಿಕರಣ ರಸಪ್ರಶ್ನೆ",
        "Verify Young's double-slit fringe spacing and Fraunhofer diffraction envelopes.",
        [
            _mcq("q-wave-1", 1, "In Young's double-slit experiment, what is the fringe width formula β?", ["β = d D / λ", "β = λ D / d", "β = λ d / D", "β = D / (λ d)"], 1, "Fringe spacing β = λD/d.", "formula"),
            _num("q-wave-2", 2, "For λ = 500 nm, d = 0.5 mm, D = 2.0 m, compute fringe width β in mm.", 2.0, "mm", 0.05, "β = (500×10⁻⁹ × 2.0) / (0.5×10⁻³) = 2.0×10⁻³ m = 2.0 mm."),
            _tf("q-wave-3", 3, "Switching from blue light (450 nm) to red light (650 nm) makes interference fringes wider apart.", True, "True — β is directly proportional to wavelength λ."),
            _mcq("q-wave-4", 4, "Reducing the slit separation d by half causes interference fringe width β to:", ["Halve", "Stay the same", "Double", "Become zero"], 2, "β = λD/d is inversely proportional to d, so halving d doubles β."),
        ],
    ),
    _quiz(
        "thermodynamic-processes", "Physics", "Advanced",
        "Thermodynamic Processes Quiz", "ಉಷ್ಣಬಲವಿಜ್ಞಾನ ರಸಪ್ರಶ್ನೆ",
        "Apply the First Law Q = ΔU + W across Isothermal, Isobaric, Adiabatic, and Isochoric processes.",
        [
            _mcq("q-thermo-1", 1, "In an isothermal process of an ideal gas, which quantity is strictly zero?", ["Work W", "Heat Q", "Change in internal energy ΔU", "Pressure change ΔP"], 2, "Internal energy of an ideal gas depends only on temperature T, so ΔT = 0 implies ΔU = 0."),
            _tf("q-thermo-2", 2, "During an adiabatic expansion of an ideal gas, the gas cools down because W > 0 and Q = 0.", True, "True — since Q = 0, ΔU = −W < 0, reducing temperature T."),
            _num("q-thermo-3", 3, "An ideal gas expands isobarically at P = 200 Pa by ΔV = 0.5 m³. Compute work W (in J).", 100.0, "J", 0.5, "For an isobaric process, W = P ΔV = 200 × 0.5 = 100 J."),
            _mcq("q-thermo-4", 4, "In an isochoric (constant-volume) heating process, how does heat Q relate to ΔU?", ["Q = 0", "Q = ΔU (since W = 0)", "Q = −ΔU", "Q = 2ΔU"], 1, "With ΔV = 0, no mechanical work is done (W = 0), so Q = ΔU."),
        ],
    ),
    _quiz(
        "photoelectric-effect", "Physics", "Advanced",
        "Photoelectric Effect Quiz", "ದ್ಯುತಿವಿದ್ಯುತ್ ಪರಿಣಾಮ ರಸಪ್ರಶ್ನೆ",
        "Master Einstein's photon equation, threshold wavelength, and stopping potential.",
        [
            _mcq("q-pe-1", 1, "Which formula is Einstein's photoelectric equation for maximum kinetic energy?", ["K_max = φ − hf", "K_max = hf − φ", "K_max = hf + φ", "K_max = I × φ"], 1, "Each photon of energy hf overcomes binding work function φ, leaving K_max = hf − φ.", "formula"),
            _num("q-pe-2", 2, "A 4.0 eV photon strikes a metal with work function φ = 2.3 eV. What is K_max (in eV)?", 1.7, "eV", 0.05, "K_max = E − φ = 4.0 − 2.3 = 1.7 eV."),
            _tf("q-pe-3", 3, "Increasing light intensity above threshold frequency increases the maximum kinetic energy K_max of each emitted electron.", False, "False — intensity increases the number of emitted electrons (photocurrent), whereas K_max depends only on frequency and φ."),
            _mcq("q-pe-4", 4, "If incident photon energy is less than the work function (E < φ), what happens?", ["Electrons emit slowly after warming up", "Zero photoelectrons are emitted regardless of intensity", "Stopping potential doubles", "Electrons emit with negative mass"], 1, "Quantum threshold requires E > φ for single-photon photoemission."),
        ],
    ),

    # ==================== CHEMISTRY (12) ====================
    _quiz(
        "atomic-structure", "Chemistry", "Basic",
        "Atomic Structure Quiz", "ಪರಮಾಣು ರಚನೆ ರಸಪ್ರಶ್ನೆ",
        "Check your mastery of protons, neutrons, isotopes, ions, and Bohr electron shells.",
        [
            _num("q-atom-1", 1, "Carbon-14 has Z = 6 protons. How many neutrons does it contain?", 8.0, "neutrons", 0.01, "N = A − Z = 14 − 6 = 8 neutrons."),
            _mcq("q-atom-2", 2, "What is the Bohr electron shell configuration of neutral Sodium (Z = 11)?", ["2, 9", "2, 8, 1", "2, 7, 2", "1, 8, 2"], 1, "K shell holds 2, L shell holds 8, leaving 1 valence electron in the M shell: [2, 8, 1]."),
            _tf("q-atom-3", 3, "Isotopes of the same element have identical proton counts (Z) but different neutron counts (N).", True, "True — proton count Z defines the element; varying N creates isotopes."),
            _num("q-atom-4", 4, "How many electrons are in an Mg²⁺ cation (Z = 12, charge = +2)?", 10.0, "electrons", 0.01, "Electrons = Z − q = 12 − 2 = 10 electrons."),
        ],
    ),
    _quiz(
        "periodic-table-explorer", "Chemistry", "Basic",
        "Periodic Trends Quiz", "ಆವರ್ತಕ ಪ್ರವೃತ್ತಿಗಳ ರಸಪ್ರಶ್ನೆ",
        "Test atomic radius, ionization energy, electronegativity, and periodic group properties.",
        [
            _mcq("q-pt-1", 1, "Moving left to right across Period 2 (Li → F), how does atomic radius generally change?", ["Increases steadily", "Decreases due to higher effective nuclear charge", "Remains constant", "Drops to zero"], 1, "Increasing nuclear charge pulls electrons in the same shell closer to the nucleus."),
            _mcq("q-pt-2", 2, "Which element has the highest Pauling electronegativity on the periodic table?", ["Oxygen (O)", "Chlorine (Cl)", "Fluorine (F)", "Helium (He)"], 2, "Fluorine (Z=9) has the highest electronegativity at 3.98."),
            _tf("q-pt-3", 3, "Alkali metals (Group 1) have higher first ionization energies than Noble gases (Group 18) in the same period.", False, "False — Noble gases have full valence shells and the highest ionization energies; alkali metals have the lowest."),
            _num("q-pt-4", 4, "What is the atomic number Z of Neon (Period 2 Noble Gas)?", 10.0, "", 0.01, "Neon has Z = 10 with shell configuration [2, 8]."),
        ],
    ),
    _quiz(
        "acids-bases-ph", "Chemistry", "Basic",
        "Acids, Bases & pH Scale Quiz", "ಆಮ್ಲ-ಪ್ರತ್ಯಾಮ್ಲ ಮತ್ತು pH ರಸಪ್ರಶ್ನೆ",
        "Verify logarithmic pH/pOH calculations and strong vs weak acid dissociation.",
        [
            _num("q-ph-1", 1, "Calculate the pH of a 0.01 M (10⁻² M) strong acid HCl solution at 25°C.", 2.0, "pH", 0.05, "pH = −log₁₀(10⁻²) = 2.0."),
            _num("q-ph-2", 2, "If an aqueous solution at 25°C has pH = 11.0, what is its pOH?", 3.0, "pOH", 0.05, "pH + pOH = 14 → pOH = 14 − 11 = 3.0."),
            _mcq("q-ph-3", 3, "How many times more concentrated in [H⁺] is a solution at pH 3 compared to pH 5?", ["2×", "20×", "100×", "1000×"], 2, "Each pH unit is a factor of 10, so 2 pH units equals 10² = 100×."),
            _tf("q-ph-4", 4, "At the same 0.01 M concentration, acetic acid (weak acid) has a higher pH than HCl (strong acid).", True, "True — weak acids ionize only partially, yielding lower [H⁺] and thus higher pH."),
        ],
    ),
    _quiz(
        "states-of-matter", "Chemistry", "Basic",
        "States of Matter Quiz", "ದ್ರವ್ಯದ ಸ್ಥಿತಿಗಳ ರಸಪ್ರಶ್ನೆ",
        "Assess phase transitions, temperature scales, and kinetic molecular theory.",
        [
            _num("q-som-1", 1, "Convert 25 °C into absolute Kelvin temperature (use +273.15).", 298.15, "K", 0.2, "T(K) = 25 + 273.15 = 298.15 K."),
            _mcq("q-som-2", 2, "According to kinetic-molecular theory, average translational kinetic energy of gas particles depends directly on:", ["Container shape", "Absolute temperature in Kelvin", "Particle color", "Molar mass alone"], 1, "KE_avg = (3/2) k_B T depends solely on absolute temperature T.", "formula"),
            _tf("q-som-3", 3, "Increasing external pressure above 1 atm raises the boiling point of liquid water.", True, "True — higher pressure requires higher vapor pressure (and thus temperature) to boil."),
            _mcq("q-som-4", 4, "At 25 °C and 1 atm, which phase is Nitrogen (boiling point −195.8 °C)?", ["Solid", "Liquid", "Gas", "Plasma"], 2, "25 °C is far above −195.8 °C, so N₂ is a gas."),
        ],
    ),
    _quiz(
        "reaction-balancing", "Chemistry", "Intermediate",
        "Chemical Equation Balancing Quiz", "ರಾಸಾಯನಿಕ ಸಮೀಕರಣ ಸರಿದೂಗಿಸುವಿಕೆ ರಸಪ್ರಶ್ನೆ",
        "Verify stoichiometric atom conservation and simplest whole-number ratios.",
        [
            _mcq("q-bal-1", 1, "What are the simplest balanced coefficients for __N₂ + __H₂ → __NH₃?", ["1, 2, 2", "1, 3, 2", "2, 3, 2", "1, 1, 2"], 1, "1 N₂ + 3 H₂ → 2 NH₃ conserves 2 N and 6 H atoms."),
            _tf("q-bal-2", 2, "When balancing a chemical equation, you may alter molecular subscripts like changing H₂O to H₂O₂.", False, "False — altering subscripts changes the chemical substance; only leading coefficients may be adjusted."),
            _num("q-bal-3", 3, "In the balanced combustion CH₄ + 2 O₂ → CO₂ + 2 H₂O, how many total Oxygen atoms appear on the right-hand side?", 4.0, "atoms", 0.01, "1 CO₂ (2 O) + 2 H₂O (2 O) = 4 Oxygen atoms."),
            _mcq("q-bal-4", 4, "Balancing chemical equations directly enforces which fundamental law?", ["Law of Conservation of Mass", "Ohm's Law", "Snell's Law", "Boyle's Law"], 0, "Lavoisier's Law of Conservation of Mass requires identical atom counts before and after reaction."),
        ],
    ),
    _quiz(
        "mole-stoichiometry", "Chemistry", "Intermediate",
        "Mole Concept & Stoichiometry Quiz", "ಮೋಲ್ ಮತ್ತು ಸ್ಟೋಯಿಕಿಯೊಮೆಟ್ರಿ ರಸಪ್ರಶ್ನೆ",
        "Solve molar mass, Avogadro particle count, and STP volume problems.",
        [
            _num("q-mol-1", 1, "How many moles are in 36 g of Water (M = 18 g/mol)?", 2.0, "mol", 0.05, "n = m / M = 36 / 18 = 2.0 mol."),
            _mcq("q-mol-2", 2, "How many particles are in 1.0 mole of any substance (Avogadro's constant)?", ["6.022 × 10²⁰", "6.022 × 10²³", "3.00 × 10⁸", "9.65 × 10⁴"], 1, "Nₐ = 6.02214 × 10²³ mol⁻¹."),
            _num("q-mol-3", 3, "What volume (in L) does 2.0 moles of an ideal gas occupy at STP (22.414 L/mol)?", 44.83, "L", 0.2, "V_STP = 2.0 × 22.414 = 44.828 L."),
            _tf("q-mol-4", 4, "One mole of Hydrogen gas (H₂) and one mole of Oxygen gas (O₂) contain the exact same number of molecules.", True, "True — 1 mole always equals 6.022 × 10²³ molecules regardless of molar mass."),
        ],
    ),
    _quiz(
        "chemical-bonding", "Chemistry", "Intermediate",
        "Chemical Bonding Quiz", "ರಾಸಾಯನಿಕ ಬಂಧ ರಸಪ್ರಶ್ನೆ",
        "Classify ionic, polar covalent, and nonpolar covalent bonds via electronegativity.",
        [
            _mcq("q-bond-1", 1, "With χ(Na) = 0.93 and χ(Cl) = 3.16 (Δχ = 2.23), what bond type forms in NaCl?", ["Nonpolar Covalent", "Polar Covalent", "Ionic", "Metallic"], 2, "Δχ = 2.23 > 1.7 indicates predominantly ionic bonding."),
            _num("q-bond-2", 2, "How many shared bonding electrons make up a triple covalent bond (like N≡N)?", 6.0, "electrons", 0.01, "Each covalent bond shares 2 electrons, so bond order 3 shares 6 electrons."),
            _tf("q-bond-3", 3, "Two identical atoms bonded together (such as O₂ or Cl₂) always have Δχ = 0 and form a nonpolar covalent bond.", True, "True — identical electronegativity shares electrons symmetrically."),
            _mcq("q-bond-4", 4, "A bond with Δχ = 1.24 (such as O–H in water) is classified as:", ["Nonpolar Covalent", "Polar Covalent", "Pure Ionic", "Nuclear"], 1, "0.4 ≤ Δχ ≤ 1.7 corresponds to polar covalent bonding."),
        ],
    ),
    _quiz(
        "concentration-dilution", "Chemistry", "Intermediate",
        "Concentration & Dilution Quiz", "ಸಾಂದ್ರತೆ ಮತ್ತು ದುರ್ಬಲೀಕರಣ ರಸಪ್ರಶ್ನೆ",
        "Apply C₁V₁ = C₂V₂ and solute mole conservation.",
        [
            _num("q-dil-1", 1, "50 mL of 2.0 M stock solution is diluted to 250 mL. Calculate final molarity C₂ (in M).", 0.4, "M", 0.02, "C₂ = (C₁ V₁) / V₂ = (2.0 × 50) / 250 = 0.40 M."),
            _mcq("q-dil-2", 2, "Which dilution equation expresses solute mole conservation?", ["C₁ / V₁ = C₂ / V₂", "C₁ V₁ = C₂ V₂", "C₁ + V₁ = C₂ + V₂", "C₁² V₁ = C₂² V₂"], 1, "Moles n = C × V remain conserved: C₁V₁ = C₂V₂.", "formula"),
            _tf("q-dil-3", 3, "Adding pure water to a salt solution decreases the total number of moles of dissolved salt.", False, "False — adding solvent lowers concentration (M), but total solute moles stay unchanged."),
            _num("q-dil-4", 4, "How many mL of solvent must be added to dilute 50 mL of stock up to a final volume of 200 mL?", 150.0, "mL", 0.5, "Solvent added = V₂ − V₁ = 200 − 50 = 150 mL."),
        ],
    ),
    _quiz(
        "chemical-equilibrium", "Chemistry", "Advanced",
        "Chemical Equilibrium Quiz", "ರಾಸಾಯನಿಕ ಸಮತೋಲನ ರಸಪ್ರಶ್ನೆ",
        "Evaluate reaction quotient Qc vs Kc and Le Chatelier's Principle.",
        [
            _mcq("q-eq-1", 1, "If reaction quotient Qc < Kc, which direction does the reversible reaction shift?", ["Forward toward products", "Reverse toward reactants", "No shift occurs", "Reaction halts permanently"], 0, "When Qc < Kc, too few products exist relative to equilibrium, so the reaction shifts forward."),
            _tf("q-eq-2", 2, "At dynamic chemical equilibrium, forward and reverse reaction rates are equal.", True, "True — equilibrium is dynamic with equal forward and reverse rates."),
            _num("q-eq-3", 3, "For A + B ⇌ 2C with [A] = 1.0 M, [B] = 2.0 M, [C] = 2.0 M, compute Qc = [C]² / ([A][B]).", 2.0, "", 0.05, "Qc = 2.0² / (1.0 × 2.0) = 4 / 2 = 2.0."),
            _mcq("q-eq-4", 4, "According to Le Chatelier's Principle, adding extra product C to an equilibrium mixture causes the system to:", ["Shift forward", "Shift reverse to consume C", "Increase Kc", "Stop colliding"], 1, "The system counteracts the disturbance by shifting reverse to restore Qc = Kc."),
        ],
    ),
    _quiz(
        "electrochemical-cells", "Chemistry", "Advanced",
        "Electrochemical Cells Quiz", "ವಿದ್ಯುದ್ರಾಸಾಯನಿಕ ಕೋಶ ರಸಪ್ರಶ್ನೆ",
        "Calculate E°_cell, Nernst potential, and Gibbs spontaneity ΔG = −nFE.",
        [
            _num("q-ec-1", 1, "Compute E°_cell (in V) for a Daniell cell with E°_cathode(Cu) = +0.34 V and E°_anode(Zn) = −0.76 V.", 1.1, "V", 0.02, "E°_cell = 0.34 − (−0.76) = +1.10 V."),
            _mcq("q-ec-2", 2, "A redox cell reaction is thermodynamically spontaneous when:", ["E_cell < 0 and ΔG > 0", "E_cell > 0 and ΔG < 0", "E_cell = 0 and ΔG > 0", "Q = 0 only"], 1, "Since ΔG = −nFE_cell, positive E_cell yields negative ΔG (spontaneous)."),
            _tf("q-ec-3", 3, "At the anode of a galvanic cell, oxidation (loss of electrons) takes place.", True, "True — Anode = Oxidation, Cathode = Reduction."),
            _mcq("q-ec-4", 4, "As a galvanic battery discharges and product quotient Q grows much larger than 1, E_cell:", ["Increases", "Decreases toward 0 V", "Remains fixed at E°_cell", "Becomes infinite"], 1, "By the Nernst equation E = E° − (RT/nF) ln Q, rising Q reduces E_cell."),
        ],
    ),
    _quiz(
        "reaction-kinetics", "Chemistry", "Advanced",
        "Reaction Kinetics Quiz", "ರಾಸಾಯನಿಕ ಚಲನಶಾಸ್ತ್ರ ರಸಪ್ರಶ್ನೆ",
        "Master Arrhenius activation energy and first-order half-life decay.",
        [
            _mcq("q-kin-1", 1, "For a first-order reaction, how does half-life t₁/₂ depend on initial concentration [A]₀?", ["Directly proportional", "Inversely proportional", "Independent of [A]₀ (t₁/₂ = ln 2 / k)", "Proportional to [A]₀²"], 2, "First-order t₁/₂ = 0.693/k depends solely on rate constant k."),
            _num("q-kin-2", 2, "If a first-order reaction has k = 0.693 s⁻¹, what is its half-life t₁/₂ (in s)?", 1.0, "s", 0.05, "t₁/₂ = ln(2) / 0.693 ≈ 1.0 s."),
            _tf("q-kin-3", 3, "A catalyst speeds up a reaction by providing an alternate pathway with lower activation energy Ea.", True, "True — lowering Ea increases the Arrhenius exponential factor exp(−Ea/RT)."),
            _mcq("q-kin-4", 4, "Starting with [A]₀ = 2.0 M, what concentration remains after exactly 2 half-lives?", ["1.0 M", "0.5 M", "0.25 M", "0.0 M"], 1, "2.0 M → 1.0 M (1st half-life) → 0.5 M (2nd half-life)."),
        ],
    ),
    _quiz(
        "gas-laws-thermodynamics", "Chemistry", "Advanced",
        "Gas Laws & Real Gases Quiz", "ಅನಿಲ ನಿಯಮಗಳ ರಸಪ್ರಶ್ನೆ",
        "Contrast Ideal Gas Law PV = nRT with van der Waals real-gas corrections.",
        [
            _mcq("q-gas-1", 1, "In the van der Waals equation (P + an²/V²)(V − nb) = nRT, what does constant 'a' correct for?", ["Molecular volume", "Intermolecular attractive forces", "Container gravity", "Gas color"], 1, "Constant 'a' accounts for attractive intermolecular forces that reduce wall pressure."),
            _mcq("q-gas-2", 2, "Under what conditions does a real gas behave most like an ideal gas?", ["High pressure and low temperature", "Low pressure and high temperature", "Near its boiling point", "Zero volume"], 1, "At low pressure (large V) and high T, molecular volume and attractions become negligible."),
            _tf("q-gas-3", 3, "For an ideal gas, the compressibility factor Z = PV/(nRT) is strictly equal to 1.", True, "True — Z = 1 defines ideal gas behavior."),
            _num("q-gas-4", 4, "Using PV = nRT (R = 0.0821 L·atm/mol·K), find P (in atm) for n = 1 mol, T = 273 K, V = 22.4 L.", 1.0, "atm", 0.05, "P = (1 × 0.0821 × 273) / 22.4 ≈ 1.00 atm."),
        ],
    ),

    # ==================== BIOLOGY (12) ====================
    _quiz(
        "plant-cell-structure", "Biology", "Basic",
        "Plant Cell Structure Quiz", "ಸಸ್ಯ ಕೋಶದ ರಸಪ್ರಶ್ನೆ",
        "Identify plant-specific organelles, osmotic turgor pressure, and SA:V scaling.",
        [
            _mcq("q-pcell-1", 1, "Which three structures are characteristic of plant cells but absent in typical animal cells?", ["Nucleus, ribosome, membrane", "Cell wall, chloroplast, large central vacuole", "Mitochondria, Golgi, ER", "Lysosome, centriole, flagella"], 1, "Plant cells uniquely possess a cellulose cell wall, chloroplasts, and a large central vacuole."),
            _tf("q-pcell-2", 2, "Plant cells contain chloroplasts and therefore do not need mitochondria.", False, "False — plant cells require mitochondria to generate ATP by cellular respiration day and night."),
            _num("q-pcell-3", 3, "For a cuboidal plant cell with side length L = 30 μm, compute SA:V = 6 / L (in μm⁻¹).", 0.2, "μm⁻¹", 0.01, "SA:V = 6 / 30 = 0.20 μm⁻¹."),
            _mcq("q-pcell-4", 4, "What keeps healthy herbaceous plant stems crisp and upright?", ["Plasmolysis", "Turgor pressure in the central vacuole", "Absence of water", "High salt externally"], 1, "Water entering the central vacuole exerts outward turgor pressure against the cell wall."),
        ],
    ),
    _quiz(
        "animal-cell-structure", "Biology", "Basic",
        "Animal Cell Structure Quiz", "ಪ್ರಾಣಿ ಕೋಶದ ರಸಪ್ರಶ್ನೆ",
        "Test eukaryotic animal organelles and spherical SA:V diffusion principles.",
        [
            _mcq("q-acell-1", 1, "Which organelle contains hydrolytic enzymes that digest cellular waste and worn-out organelles?", ["Ribosome", "Lysosome", "Centriole", "Nucleolus"], 1, "Lysosomes are acidic recycling compartments packed with hydrolytic enzymes."),
            _mcq("q-acell-2", 2, "Which organelle is the primary site of aerobic ATP synthesis?", ["Mitochondrion", "Golgi apparatus", "Smooth ER", "Plasma membrane"], 0, "Mitochondria generate most cellular ATP via oxidative phosphorylation."),
            _num("q-acell-3", 3, "For a spherical cell of radius r = 10 μm, compute SA:V = 3 / r (in μm⁻¹).", 0.3, "μm⁻¹", 0.01, "SA:V = (4πr²) / ((4/3)πr³) = 3 / r = 3 / 10 = 0.30 μm⁻¹."),
            _tf("q-acell-4", 4, "Doubling a cell's radius increases its surface-area-to-volume ratio.", False, "False — doubling radius halves SA:V, slowing passive diffusion."),
        ],
    ),
    _quiz(
        "human-digestive-system", "Biology", "Basic",
        "Human Digestive System Quiz", "ಮಾನವ ಜೀರ್ಣಾಂಗ ವ್ಯೂಹ ರಸಪ್ರಶ್ನೆ",
        "Verify digestive enzymes, optimal pH environments, and thermal denaturation.",
        [
            _mcq("q-dig-1", 1, "Which enzyme initiates protein digestion in the highly acidic stomach (pH ~2)?", ["Salivary Amylase", "Pepsin", "Trypsin", "Lipase"], 1, "Pepsin functions optimally around pH 2.0 in stomach hydrochloric acid."),
            _mcq("q-dig-2", 2, "What macromolecule does salivary amylase break down in the mouth?", ["Lipids", "Proteins", "Starch (carbohydrates)", "Nucleic acids"], 2, "Salivary amylase hydrolyzes starch into maltose near pH 6.8."),
            _tf("q-dig-3", 3, "Heating human digestive enzymes to 70 °C permanently denatures their active sites.", True, "True — high heat disrupts hydrogen and hydrophobic bonds, unfolding the enzyme."),
            _num("q-dig-4", 4, "What is normal human core body temperature (in °C) where digestive enzymes operate optimally?", 37.0, "°C", 0.5, "Human digestive enzymes peak near 37 °C."),
        ],
    ),
    _quiz(
        "photosynthesis", "Biology", "Basic",
        "Photosynthesis & Limiting Factors Quiz", "ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆ ರಸಪ್ರಶ್ನೆ",
        "Assess photosynthetic stoichiometry and Blackman's Law of Limiting Factors.",
        [
            _mcq("q-photo-1", 1, "Which balanced equation represents oxygenic photosynthesis?", ["C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O", "6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂", "CO₂ + O₂ → H₂O", "2H₂O → 2H₂ + O₂"], 1, "Photosynthesis converts 6CO₂ + 6H₂O into 1 glucose + 6O₂ using light energy.", "formula"),
            _num("q-photo-2", 2, "If a leaf evolves 12 μmol of O₂ per second, how many μmol of glucose are synthesized per second?", 2.0, "μmol/s", 0.05, "Because 6 O₂ are released per 1 glucose, Glucose Rate = 12 / 6 = 2.0 μmol/s."),
            _tf("q-photo-3", 3, "When light intensity is already saturating, raising CO₂ concentration can increase the rate of photosynthesis.", True, "True — once light saturates, CO₂ or temperature becomes the limiting factor."),
            _mcq("q-photo-4", 4, "In which plant organelle does photosynthesis take place?", ["Mitochondrion", "Chloroplast", "Ribosome", "Lysosome"], 1, "Chloroplasts house chlorophyll thylakoids and Calvin cycle stroma."),
        ],
    ),
    _quiz(
        "mitosis-meiosis", "Biology", "Intermediate",
        "Mitosis & Meiosis Quiz", "ಮೈಟೋಸಿಸ್ ಮತ್ತು ಮಿಯೋಸಿಸ್ ರಸಪ್ರಶ್ನೆ",
        "Compare somatic mitosis with gametogenic meiosis across ploidy and DNA content.",
        [
            _num("q-mit-1", 1, "A human somatic cell has 2n = 46 chromosomes. How many chromosomes does each haploid gamete have after Meiosis?", 23.0, "chromosomes", 0.01, "Meiosis halves diploid 2n = 46 to haploid n = 23."),
            _mcq("q-mit-2", 2, "What is the final outcome of one round of Mitosis from a single diploid (2n) parent cell?", ["4 haploid gametes", "2 genetically identical diploid (2n) cells", "2 haploid cells", "4 identical diploid cells"], 1, "Mitosis yields 2 identical 2n somatic daughter cells."),
            _tf("q-mit-3", 3, "Crossing-over between homologous chromosomes occurs during Meiosis to create genetic diversity.", True, "True — homologous recombination in Prophase I shuffles maternal and paternal alleles."),
            _mcq("q-mit-4", 4, "During which stage do chromosomes align along the cell's equatorial plate?", ["Prophase", "Metaphase", "Anaphase", "Telophase"], 1, "Metaphase aligns chromosomes on the metaphase plate before separation."),
        ],
    ),
    _quiz(
        "dna-structure-replication", "Biology", "Intermediate",
        "DNA Structure & Replication Quiz", "DNA ರಚನೆ ಮತ್ತು ಪ್ರತಿಕೃತಿ ರಸಪ್ರಶ್ನೆ",
        "Verify Chargaff's rules, hydrogen bonding, and double helix geometry.",
        [
            _num("q-dna-1", 1, "If a double-stranded DNA sample contains 28% Adenine (A), what percentage is Guanine (G)?", 22.0, "%", 0.2, "A = T = 28% (56% total), leaving 44% split evenly: G = C = 22%."),
            _mcq("q-dna-2", 2, "How many hydrogen bonds hold together a Guanine–Cytosine (G≡C) base pair?", ["1", "2", "3", "4"], 2, "A=T pairs have 2 H-bonds; G≡C pairs have 3 H-bonds, increasing thermal stability."),
            _tf("q-dna-3", 3, "DNA replication is semi-conservative: each new duplex keeps one original strand and one newly synthesized strand.", True, "True — demonstrated famously by the Meselson-Stahl experiment."),
            _num("q-dna-4", 4, "At 0.34 nm rise per base pair, what is the length (in nm) of a 100 bp B-DNA segment?", 34.0, "nm", 0.2, "100 bp × 0.34 nm/bp = 34.0 nm."),
        ],
    ),
    _quiz(
        "human-circulatory-system", "Biology", "Intermediate",
        "Human Circulatory System Quiz", "ರಕ್ತಪರಿಚಲನಾ ವ್ಯೂಹ ರಸಪ್ರಶ್ನೆ",
        "Calculate Cardiac Output, Pulse Pressure, and Mean Arterial Pressure.",
        [
            _num("q-circ-1", 1, "Compute Cardiac Output (in L/min) for HR = 70 bpm and Stroke Volume SV = 80 mL.", 5.6, "L/min", 0.05, "CO = (70 × 80) / 1000 = 5.60 L/min."),
            _num("q-circ-2", 2, "For blood pressure 120/75 mmHg, what is the Mean Arterial Pressure MAP = DBP + (SBP−DBP)/3?", 90.0, "mmHg", 0.5, "MAP = 75 + (120 − 75)/3 = 75 + 15 = 90 mmHg."),
            _tf("q-circ-3", 3, "Arteries carry blood away from the heart while veins return blood to the heart.", True, "True — defined by flow direction relative to the heart."),
            _mcq("q-circ-4", 4, "Which heart chamber pumps oxygenated blood into the systemic aorta?", ["Right Atrium", "Right Ventricle", "Left Atrium", "Left Ventricle"], 3, "The muscular Left Ventricle generates systemic systolic pressure into the aorta."),
        ],
    ),
    _quiz(
        "food-chain-ecosystem", "Biology", "Intermediate",
        "Food Chain & Ecosystem Quiz", "ಆಹಾರ ಸರಪಳಿ ಮತ್ತು ಪರಿಸರ ರಸಪ್ರಶ್ನೆ",
        "Apply Lindeman's 10% energy transfer law across trophic pyramids.",
        [
            _num("q-eco-1", 1, "If primary producers capture 10,000 kcal and transfer efficiency is 10%, how many kcal reach Secondary Consumers (Level 3)?", 100.0, "kcal", 0.5, "Level 1 = 10,000 → Level 2 = 1,000 → Level 3 = 100 kcal."),
            _mcq("q-eco-2", 2, "Where does roughly 90% of ecological energy go between consecutive trophic levels?", ["Destroyed completely", "Converted into metabolic heat and unassimilated waste", "Stored permanently in apex predators", "Recycled back into sunlight"], 1, "Cellular respiration dissipates ~90% as heat per the Second Law of Thermodynamics."),
            _tf("q-eco-3", 3, "Energy cycles indefinitely around an ecosystem just like carbon and nitrogen atoms.", False, "False — matter cycles, whereas energy flows one-way from sunlight to dissipated heat."),
            _mcq("q-eco-4", 4, "Why do terrestrial ecosystems rarely support more than 4 or 5 trophic levels?", ["Predators lack teeth", "Too little usable energy remains after repeated ~90% losses", "Producers stop photosynthesizing", "Gravity increases"], 1, "Exponential energy loss leaves insufficient energy to sustain viable Level 6 populations."),
        ],
    ),
    _quiz(
        "mendelian-genetics", "Biology", "Advanced",
        "Mendelian Genetics Quiz", "ಮೆಂಡೆಲಿಯನ್ ತಳಿಶಾಸ್ತ್ರ ರಸಪ್ರಶ್ನೆ",
        "Solve monohybrid Punnett squares, test crosses, and inheritance ratios.",
        [
            _mcq("q-mend-1", 1, "In a monohybrid cross of two heterozygotes (Aa × Aa) with complete dominance, what is the expected phenotype ratio?", ["1 : 1", "2 : 1", "3 : 1", "9 : 3 : 3 : 1"], 2, "AA, Aa, Aa show dominant phenotype (3) and aa shows recessive phenotype (1)."),
            _num("q-mend-2", 2, "In an Aa × Aa cross producing 200 offspring, how many are expected to be homozygous recessive (aa)?", 50.0, "offspring", 0.5, "P(aa) = 1/4 = 25%; 0.25 × 200 = 50."),
            _mcq("q-mend-3", 3, "What parental cross is a classic Test Cross to determine an unknown dominant parent's genotype?", ["Crossing with AA", "Crossing with homozygous recessive aa", "Crossing with Aa", "Self-pollinating F₂"], 1, "Crossing with aa reveals hidden recessive alleles if any aa offspring appear."),
            _tf("q-mend-4", 4, "Crossing AA × aa produces 100% heterozygous (Aa) offspring in the F₁ generation.", True, "True — every gamete from AA carries A and every gamete from aa carries a."),
        ],
    ),
    _quiz(
        "natural-selection-evolution", "Biology", "Advanced",
        "Natural Selection & Evolution Quiz", "ನೈಸರ್ಗಿಕ ಆಯ್ಕೆ ರಸಪ್ರಶ್ನೆ",
        "Analyze genotype fitness, directional selection, and heterozygote advantage.",
        [
            _mcq("q-evol-1", 1, "When the heterozygote has higher fitness than both homozygotes (w_Aa > w_AA and w_Aa > w_aa), what occurs?", ["Instant allele extinction", "Balancing selection maintaining both alleles", "Zero mutation", "Population collapse"], 1, "Heterozygote advantage (like sickle-cell trait in malaria zones) preserves both alleles."),
            _tf("q-evol-2", 2, "Natural selection acts directly on phenotypes, causing heritable allele frequencies in the gene pool to shift over generations.", True, "True — differential survival/reproduction of phenotypes alters population allele frequencies."),
            _mcq("q-evol-3", 3, "Why is a deleterious recessive allele (a) eliminated slowly when it becomes rare?", ["Because most copies are hidden in healthy Aa heterozygotes", "Because recessive alleles mutate faster", "Because natural selection ignores homozygotes", "Because q² > 2pq when q is tiny"], 0, "When q is small, 2pq ≫ q², shielding the allele from selection inside carriers."),
            _num("q-evol-4", 4, "If p = 0.5, q = 0.5, w_AA = 1.0, w_Aa = 1.0, w_aa = 0.6, compute mean fitness w̄ = p²w_AA + 2pqw_Aa + q²w_aa.", 0.9, "", 0.02, "w̄ = 0.25(1) + 0.5(1) + 0.25(0.6) = 0.25 + 0.50 + 0.15 = 0.90."),
        ],
    ),
    _quiz(
        "cellular-respiration", "Biology", "Advanced",
        "Cellular Respiration Quiz", "ಕೋಶೀಯ ಉಸಿರಾಟ ರಸಪ್ರಶ್ನೆ",
        "Account for ATP yields in glycolysis, citric acid cycle, oxidative phosphorylation, and fermentation.",
        [
            _mcq("q-resp-1", 1, "Which stage of aerobic cellular respiration produces the largest share of ATP (~28 ATP per glucose)?", ["Glycolysis", "Pyruvate oxidation", "Citric Acid Cycle", "Oxidative Phosphorylation (ETC + ATP Synthase)"], 3, "Chemiosmosis in the inner mitochondrial membrane yields ~28 of the ~32 total ATP."),
            _num("q-resp-2", 2, "How many net ATP molecules are produced per glucose molecule during anaerobic fermentation alone?", 2.0, "ATP", 0.01, "Only glycolysis generates net ATP (2 ATP) anaerobically."),
            _tf("q-resp-3", 3, "Glycolysis takes place in the cytosol and does not require molecular oxygen (O₂).", True, "True — glycolysis is an ancient anaerobic cytoplasmic pathway."),
            _num("q-resp-4", 4, "How many moles of O₂ are consumed to completely oxidize 2 moles of glucose aerobically?", 12.0, "mol O₂", 0.05, "C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O, so 2 mol glucose consumes 12 mol O₂."),
        ],
    ),
    _quiz(
        "population-genetics", "Biology", "Advanced",
        "Population Genetics & Hardy-Weinberg Quiz", "ಜನಸಂಖ್ಯಾ ತಳಿಶಾಸ್ತ್ರ ರಸಪ್ರಶ್ನೆ",
        "Solve Hardy-Weinberg allele and genotype frequency equations.",
        [
            _num("q-hw-1", 1, "If dominant allele frequency p = 0.7 in Hardy-Weinberg equilibrium, what is heterozygote frequency 2pq?", 0.42, "", 0.01, "q = 1 − 0.7 = 0.3, so 2pq = 2 × 0.7 × 0.3 = 0.42."),
            _num("q-hw-2", 2, "If 9% (0.09) of a Hardy-Weinberg population exhibits the recessive trait (q² = 0.09), what is recessive allele frequency q?", 0.3, "", 0.01, "q = √(0.09) = 0.30."),
            _mcq("q-hw-3", 3, "At which allele frequency p is heterozygosity (2pq) maximized?", ["p = 0.0", "p = 0.25", "p = 0.50", "p = 1.0"], 2, "2p(1−p) peaks at p = 0.50, yielding 2pq = 0.50."),
            _tf("q-hw-4", 4, "Natural selection and gene flow (migration) do not disturb Hardy-Weinberg equilibrium.", False, "False — Hardy-Weinberg requires no selection, no migration, no mutation, random mating, and large population."),
        ],
    ),

    # ==================== MATHEMATICS (12) ====================
    _quiz(
        "number-systems", "Mathematics", "Basic",
        "Number Systems & Primes Quiz", "ಸಂಖ್ಯಾ ಪದ್ಧತಿಗಳ ರಸಪ್ರಶ್ನೆ",
        "Convert bases (Binary/Octal/Hex) and verify unique prime factorizations.",
        [
            _mcq("q-num-1", 1, "What is the binary (base 2) representation of decimal 42?", ["101010", "110010", "100110", "101100"], 0, "42 = 32 + 8 + 2 = 2⁵ + 2³ + 2¹ = 101010₂."),
            _mcq("q-num-2", 2, "What is hexadecimal 0x2A in decimal?", ["32", "40", "42", "44"], 2, "2 × 16 + 10 = 42."),
            _num("q-num-3", 3, "How many positive divisors does 12 have?", 6.0, "divisors", 0.01, "The positive divisors of 12 are 1, 2, 3, 4, 6, and 12 (6 total)."),
            _tf("q-num-4", 4, "The number 1 is considered a prime number.", False, "False — primes must have exactly two distinct positive divisors (1 and themselves)."),
        ],
    ),
    _quiz(
        "fractions-decimals", "Mathematics", "Basic",
        "Fractions & Decimals Quiz", "ಭಿನ್ನರಾಶಿ ಮತ್ತು ದಶಮಾಂಶ ರಸಪ್ರಶ್ನೆ",
        "Verify exact rational operations, GCD reduction, and decimal conversion.",
        [
            _mcq("q-frac-1", 1, "What is 3/4 + 2/5 in simplest reduced fraction form?", ["5/9", "23/20", "11/20", "6/20"], 1, "3/4 + 2/5 = 15/20 + 8/20 = 23/20."),
            _num("q-frac-2", 2, "Convert the fraction 7/8 into its exact decimal value.", 0.875, "", 0.002, "7 ÷ 8 = 0.875."),
            _mcq("q-frac-3", 3, "What is (2/3) ÷ (4/9) in lowest terms?", ["8/27", "3/2", "2/3", "1/2"], 1, "(2/3) × (9/4) = 18/12 = 3/2."),
            _tf("q-frac-4", 4, "The least common multiple (LCM) of 4 and 6 is 12.", True, "True — LCM(4, 6) = (4 × 6) / GCD(4, 6) = 24 / 2 = 12."),
        ],
    ),
    _quiz(
        "basic-geometry", "Mathematics", "Basic",
        "Basic Geometry Quiz", "ಮೂಲಭೂತ ರೇಖಾಗಣಿತ ರಸಪ್ರಶ್ನೆ",
        "Verify Triangle Inequality, Heron's Formula, interior angles, and circle formulas.",
        [
            _num("q-geo-1", 1, "Compute the area of a right triangle with sides 6, 8, and 10 units.", 24.0, "u²", 0.1, "Heron's formula (or ½ × 6 × 8) gives Area = 24 u²."),
            _tf("q-geo-2", 2, "Line segments of lengths 2, 3, and 7 can form a closed Euclidean triangle.", False, "False — violates the Triangle Inequality because 2 + 3 = 5 ≤ 7."),
            _mcq("q-geo-3", 3, "If you double the radius of a circle, how does its area πr² change?", ["Doubles", "Triples", "Quadruples (4×)", "Stays the same"], 2, "π(2r)² = 4πr²."),
            _num("q-geo-4", 4, "Two angles of a triangle measure 55° and 65°. What is the third angle (in °)?", 60.0, "°", 0.1, "180° − (55° + 65°) = 60°."),
        ],
    ),
    _quiz(
        "algebraic-expressions", "Mathematics", "Basic",
        "Algebraic Expressions Quiz", "ಬೀಜಗಣಿತ ರಸಪ್ರಶ್ನೆ",
        "Master polynomial evaluation and binomial expansion identities.",
        [
            _mcq("q-alg-1", 1, "Which expression is the correct expansion of (2x + 3)²?", ["4x² + 9", "4x² + 6x + 9", "4x² + 12x + 9", "2x² + 12x + 9"], 2, "(2x + 3)² = (2x)² + 2(2x)(3) + 3² = 4x² + 12x + 9.", "formula"),
            _num("q-alg-2", 2, "Evaluate f(x) = (2x + 3)² at x = 4.", 121.0, "", 0.1, "(2·4 + 3)² = 11² = 121."),
            _tf("q-alg-3", 3, "For all real numbers a and b, (a + b)² equals a² + b².", False, "False — the cross term 2ab is missing unless a = 0 or b = 0."),
            _num("q-alg-4", 4, "Evaluate (3x − 2)² at x = 2.", 16.0, "", 0.1, "(6 − 2)² = 4² = 16."),
        ],
    ),
    _quiz(
        "trigonometric-functions", "Mathematics", "Intermediate",
        "Trigonometric Functions Quiz", "ತ್ರಿಕೋನಮಿತಿ ರಸಪ್ರಶ್ನೆ",
        "Verify unit-circle identities, exact trig values, and sinusoidal wave parameters.",
        [
            _num("q-trig-1", 1, "What is the exact value of sin(30°)?", 0.5, "", 0.01, "sin(30°) = 1/2 = 0.5."),
            _mcq("q-trig-2", 2, "Which Pythagorean identity holds for every real angle θ?", ["sin θ + cos θ = 1", "sin²θ + cos²θ = 1", "sin²θ − cos²θ = 1", "tan²θ + sin²θ = 1"], 1, "Coordinates (cos θ, sin θ) lie on the unit circle x² + y² = 1.", "formula"),
            _num("q-trig-3", 3, "What is the period (in degrees) of y = 3 sin(2θ)?", 180.0, "°", 0.5, "Period = 360° / ω = 360° / 2 = 180°."),
            _tf("q-trig-4", 4, "tan(90°) is undefined because cos(90°) = 0.", True, "True — tan θ = sin θ / cos θ has vertical asymptotes wherever cos θ = 0."),
        ],
    ),
    _quiz(
        "coordinate-geometry", "Mathematics", "Intermediate",
        "Coordinate Geometry Quiz", "ನಿರ್ದೇಶಾಂಕ ರೇಖಾಗಣಿತ ರಸಪ್ರಶ್ನೆ",
        "Compute Euclidean distance, midpoints, slopes, and linear equations.",
        [
            _num("q-cg-1", 1, "Find the Euclidean distance between P₁(0, 0) and P₂(3, 4).", 5.0, "units", 0.05, "d = √(3² + 4²) = √25 = 5."),
            _num("q-cg-2", 2, "Find the slope m of the line passing through (1, 2) and (5, 10).", 2.0, "", 0.02, "m = (10 − 2) / (5 − 1) = 8 / 4 = 2.0."),
            _mcq("q-cg-3", 3, "What is the midpoint of (−2, 4) and (6, 8)?", ["(4, 12)", "(2, 6)", "(4, 2)", "(2, 4)"], 1, "M = ((−2+6)/2, (4+8)/2) = (2, 6)."),
            _tf("q-cg-4", 4, "A vertical line x = 5 has slope equal to 0.", False, "False — a horizontal line has slope 0; a vertical line has undefined slope (Δx = 0)."),
        ],
    ),
    _quiz(
        "probability-statistics", "Mathematics", "Intermediate",
        "Probability & Statistics Quiz", "ಸಂಭವನೀಯತೆ ಮತ್ತು ಸಂಖ್ಯಾಶಾಸ್ತ್ರ ರಸಪ್ರಶ್ನೆ",
        "Solve Binomial distribution probabilities, expected value, and variance.",
        [
            _num("q-prob-1", 1, "For X ~ Binomial(n = 20, p = 0.25), calculate the expected value μ = np.", 5.0, "", 0.05, "μ = 20 × 0.25 = 5.0."),
            _num("q-prob-2", 2, "For X ~ Binomial(n = 16, p = 0.5), calculate standard deviation σ = √(np(1−p)).", 2.0, "", 0.05, "σ = √(16 × 0.5 × 0.5) = √4 = 2.0."),
            _mcq("q-prob-3", 3, "Tossing 2 fair coins, what is the probability of getting exactly 1 Head?", ["0.25", "0.50", "0.75", "1.00"], 1, "C(2,1)(0.5)¹(0.5)¹ = 2 × 0.25 = 0.50."),
            _tf("q-prob-4", 4, "The sum of P(X = k) over all k = 0, 1, ..., n in any binomial distribution equals exactly 1.", True, "True — by the Binomial Theorem, (p + (1−p))ⁿ = 1ⁿ = 1."),
        ],
    ),
    _quiz(
        "quadratic-equations", "Mathematics", "Intermediate",
        "Quadratic Equations Quiz", "ವರ್ಗ ಸಮೀಕರಣಗಳ ರಸಪ್ರಶ್ನೆ",
        "Analyze discriminants, real/complex roots, and parabola vertices.",
        [
            _num("q-quad-1", 1, "Calculate the discriminant Δ = b² − 4ac for x² − 5x + 6 = 0.", 1.0, "", 0.05, "Δ = (−5)² − 4(1)(6) = 25 − 24 = 1."),
            _mcq("q-quad-2", 2, "If discriminant Δ < 0 for a real quadratic ax² + bx + c = 0, what is the nature of the roots?", ["Two distinct real roots", "One repeated real root", "Two complex conjugate roots", "Infinitely many roots"], 2, "Negative Δ implies √Δ is imaginary, producing complex conjugate roots."),
            _num("q-quad-3", 3, "Find the x-coordinate of the vertex h = −b/(2a) for y = x² − 6x + 5.", 3.0, "", 0.05, "h = −(−6)/(2·1) = 3.0."),
            _tf("q-quad-4", 4, "A parabola y = ax² + bx + c opens downward whenever a < 0.", True, "True — negative leading coefficient produces a maximum vertex opening downward."),
        ],
    ),
    _quiz(
        "differential-calculus", "Mathematics", "Advanced",
        "Differential Calculus Quiz", "ಅವಕಲನ ಕಲನಶಾಸ್ತ್ರ ರಸಪ್ರಶ್ನೆ",
        "Verify derivatives, tangent slopes, stationary points, and concavity.",
        [
            _num("q-diff-1", 1, "For f(x) = x³ − 3x² + 2x + 1, calculate f'(2).", 2.0, "", 0.05, "f'(x) = 3x² − 6x + 2 → f'(2) = 12 − 12 + 2 = 2."),
            _mcq("q-diff-2", 2, "If f'(x₀) = 0 and f''(x₀) > 0, what type of point is x₀?", ["Local Maximum", "Local Minimum", "Vertical Asymptote", "Discontinuity"], 1, "Zero slope with upward concavity (f'' > 0) indicates a local minimum."),
            _num("q-diff-3", 3, "For f(x) = 2x³ + 5x, compute the second derivative f''(1).", 12.0, "", 0.05, "f'(x) = 6x² + 5 → f''(x) = 12x → f''(1) = 12."),
            _tf("q-diff-4", 4, "The derivative of any constant function f(x) = c is zero everywhere.", True, "True — a horizontal line has zero rate of change."),
        ],
    ),
    _quiz(
        "integral-calculus", "Mathematics", "Advanced",
        "Integral Calculus Quiz", "ಸಮಾಕಲನ ಕಲನಶಾಸ್ತ್ರ ರಸಪ್ರಶ್ನೆ",
        "Evaluate definite integrals, antiderivatives, and Riemann sum convergence.",
        [
            _num("q-int-1", 1, "Evaluate the exact definite integral ∫[0, 3] (x² + 1) dx.", 12.0, "", 0.05, "[x³/3 + x]₀³ = (9 + 3) − 0 = 12.0."),
            _num("q-int-2", 2, "Evaluate ∫[0, 4] 2x dx.", 16.0, "", 0.05, "[x²]₀⁴ = 16 − 0 = 16."),
            _tf("q-int-3", 3, "As the number of Riemann subintervals N → ∞ for a continuous function, the Riemann sum converges to the exact definite integral.", True, "True — this is the Riemann definition of the definite integral."),
            _mcq("q-int-4", 4, "Which expression gives the average value of f(x) over [a, b]?", ["∫[a,b] f(x) dx", "(1 / (b − a)) ∫[a,b] f(x) dx", "(b − a) ∫[a,b] f(x) dx", "f(b) − f(a)"], 1, "Mean value equals total integral divided by interval width (b − a).", "formula"),
        ],
    ),
    _quiz(
        "matrices-linear-algebra", "Mathematics", "Advanced",
        "Matrices & Linear Algebra Quiz", "ಮ್ಯಾಟ್ರಿಕ್ಸ್ ಮತ್ತು ರೇಖೀಯ ಬೀಜಗಣಿತ ರಸಪ್ರಶ್ನೆ",
        "Verify determinants, invertibility, trace, and eigenvalues.",
        [
            _num("q-mat-1", 1, "Compute det(A) for A = [[3, 1], [2, 4]].", 10.0, "", 0.05, "det(A) = 3×4 − 1×2 = 12 − 2 = 10."),
            _num("q-mat-2", 2, "Compute trace tr(A) for A = [[3, 1], [2, 4]].", 7.0, "", 0.05, "tr(A) = a₁₁ + a₂₂ = 3 + 4 = 7."),
            _tf("q-mat-3", 3, "A square matrix A is invertible if and only if det(A) ≠ 0.", True, "True — singular matrices with det(A) = 0 collapse dimension and have no inverse."),
            _mcq("q-mat-4", 4, "What are the eigenvalues of A = [[3, 1], [2, 4]] (tr = 7, det = 10)?", ["λ = 1 and 10", "λ = 5 and 2", "λ = 3 and 4", "λ = −5 and −2"], 1, "λ² − 7λ + 10 = (λ − 5)(λ − 2) = 0 → λ = 5, 2."),
        ],
    ),
    _quiz(
        "three-dimensional-geometry", "Mathematics", "Advanced",
        "3D Geometry & Vectors Quiz", "3D ವೆಕ್ಟರ್ ಮತ್ತು ರೇಖಾಗಣಿತ ರಸಪ್ರಶ್ನೆ",
        "Master 3D dot products, cross products, orthogonality, and distances.",
        [
            _num("q-3d-1", 1, "Compute the dot product u · v for u = (3, 4, 0) and v = (1, 0, 2).", 3.0, "", 0.05, "u · v = 3(1) + 4(0) + 0(2) = 3."),
            _num("q-3d-2", 2, "Compute the magnitude |u| of u = (3, 4, 0).", 5.0, "", 0.05, "|u| = √(3² + 4² + 0²) = 5."),
            _mcq("q-3d-3", 3, "If u · v = 0 for two non-zero 3D vectors, what is the angle between them?", ["0°", "45°", "90° (Orthogonal)", "180°"], 2, "cos θ = 0 implies θ = 90°."),
            _tf("q-3d-4", 4, "The cross product u × v is perpendicular to both u and v, and its magnitude equals the spanned parallelogram area.", True, "True — |u × v| = |u||v|sin θ gives parallelogram area."),
        ],
    ),
    _quiz(
        "human-respiratory-system", "Biology", "Basic",
        "Human Respiratory System Quiz", "ಮಾನವ ಉಸಿರಾಟದ ವ್ಯವಸ್ಥೆ ರಸಪ್ರಶ್ನೆ",
        "Check your understanding of breathing mechanics, diaphragm movement, and alveolar gas exchange.",
        [
            _mcq("q-resp-1", 1, "Where does gas exchange of oxygen (O₂) and carbon dioxide (CO₂) take place in the lungs?", ["Trachea", "Alveoli", "Larynx", "Pharynx"], 1, "Alveoli are tiny thin-walled air sacs surrounded by capillaries where O₂ enters blood and CO₂ leaves."),
            _mcq("q-resp-2", 2, "What happens to the diaphragm during inhalation?", ["It relaxes and curves upward", "It contracts and flattens downward", "It stays completely still", "It closes the trachea"], 1, "When the diaphragm contracts downward, thoracic volume increases and air is drawn into the lungs."),
            _num("q-resp-3", 3, "Calculate minute ventilation (L/min) for breathing rate 16 breaths/min and tidal volume 500 mL.", 8.0, "L/min", 0.1, "V̇E = (16 × 500) / 1000 = 8.0 L/min."),
            _tf("q-resp-4", 4, "The trachea is kept open by C-shaped rings of cartilage.", True, "True — cartilage rings prevent the windpipe from collapsing during inhalation."),
        ],
    ),
    _quiz(
        "human-nervous-system", "Biology", "Intermediate",
        "Human Nervous System & Reflex Arc Quiz", "ಮಾನವ ನರವ್ಯೂಹ ರಸಪ್ರಶ್ನೆ",
        "Verify reflex arc pathways, sensory vs motor neurons, and myelinated nerve conduction.",
        [
            _mcq("q-nerv-1", 1, "Which structure integrates a rapid protective spinal reflex arc first?", ["Cerebrum", "Spinal Cord", "Stomach", "Heart"], 1, "Spinal reflexes route through the spinal cord so the muscle responds rapidly before conscious brain processing."),
            _mcq("q-nerv-2", 2, "Which neuron carries signals from a skin receptor toward the spinal cord?", ["Motor neuron", "Sensory neuron", "Red blood cell", "Platelet"], 1, "Sensory (afferent) neurons carry impulses from receptors to the CNS."),
            _tf("q-nerv-3", 3, "Myelinated axons transmit nerve impulses significantly faster than unmyelinated axons.", True, "True — saltatory conduction jumps between nodes of Ranvier (~80 m/s vs ~2 m/s)."),
            _tf("q-nerv-4", 4, "A stimulus below the threshold still triggers a half-size action potential.", False, "False — action potentials obey the all-or-nothing principle."),
        ],
    ),
    _quiz(
        "chemical-reaction-playground", "Chemistry", "Basic",
        "Chemical Reactions & Lab Apparatus Quiz", "ರಾಸಾಯನಿಕ ಕ್ರಿಯೆಗಳ ರಸಪ್ರಶ್ನೆ",
        "Test balanced equations, precipitates, gas evolution, and exothermic vs endothermic reactions.",
        [
            _mcq("q-rxnp-1", 1, "Which gas is released when zinc metal reacts with dilute hydrochloric acid (Zn + 2HCl)?", ["Oxygen (O₂)", "Hydrogen (H₂)", "Nitrogen (N₂)", "Chlorine (Cl₂)"], 1, "Zn + 2 HCl → ZnCl₂ + H₂↑ releases hydrogen gas bubbles."),
            _mcq("q-rxnp-2", 2, "What visible change occurs when AgNO₃(aq) is mixed with NaCl(aq)?", ["White precipitate of AgCl forms", "Blue flame appears", "Solution freezes", "No change"], 0, "Silver chloride (AgCl) is insoluble and forms a curdy white precipitate."),
            _tf("q-rxnp-3", 3, "An exothermic reaction has negative enthalpy change (ΔH < 0) and releases heat to its surroundings.", True, "True — exothermic reactions release heat and raise thermometer temperature."),
            _mcq("q-rxnp-4", 4, "Which apparatus is best for heating a solid like CaCO₃ strongly during thermal decomposition?", ["Dropper", "pH meter", "Bunsen burner", "Weighing balance"], 2, "A Bunsen burner supplies the high activation heat needed for thermal decomposition."),
        ],
    ),
]

ALL_QUIZZES_SEED: list[dict[str, Any]] = [*PRESERVED_QUIZZES, *NEW_QUIZZES]
