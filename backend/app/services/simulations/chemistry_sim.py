"""Deterministic Chemistry simulation engines (12 experiments across Basic, Intermediate, Advanced)."""

from __future__ import annotations

import math
from typing import Any

from app.services.simulations.common import SimulationValidationError, check_bounds, require_float, require_int

AVOGADRO = 6.02214076e23
FARADAY = 96485.33212  # C/mol
GAS_R = 8.314462618  # J/(mol*K)
GAS_R_ATM = 0.082057366  # L*atm/(mol*K)
KB = 1.380649e-23

# Verified IUPAC periodic data for elements Z = 1..36
ELEMENTS_DATA: dict[int, dict[str, Any]] = {
    1: {"symbol": "H", "name": "Hydrogen", "mass": 1.008, "period": 1, "group": 1, "en": 2.20, "ie": 1312, "radius": 53, "cat": "Nonmetal", "block": "s"},
    2: {"symbol": "He", "name": "Helium", "mass": 4.0026, "period": 1, "group": 18, "en": 0.0, "ie": 2372, "radius": 31, "cat": "Noble Gas", "block": "s"},
    3: {"symbol": "Li", "name": "Lithium", "mass": 6.94, "period": 2, "group": 1, "en": 0.98, "ie": 520, "radius": 167, "cat": "Alkali Metal", "block": "s"},
    4: {"symbol": "Be", "name": "Beryllium", "mass": 9.0122, "period": 2, "group": 2, "en": 1.57, "ie": 900, "radius": 112, "cat": "Alkaline Earth", "block": "s"},
    5: {"symbol": "B", "name": "Boron", "mass": 10.81, "period": 2, "group": 13, "en": 2.04, "ie": 801, "radius": 87, "cat": "Metalloid", "block": "p"},
    6: {"symbol": "C", "name": "Carbon", "mass": 12.011, "period": 2, "group": 14, "en": 2.55, "ie": 1086, "radius": 67, "cat": "Nonmetal", "block": "p"},
    7: {"symbol": "N", "name": "Nitrogen", "mass": 14.007, "period": 2, "group": 15, "en": 3.04, "ie": 1402, "radius": 56, "cat": "Nonmetal", "block": "p"},
    8: {"symbol": "O", "name": "Oxygen", "mass": 15.999, "period": 2, "group": 16, "en": 3.44, "ie": 1314, "radius": 48, "cat": "Nonmetal", "block": "p"},
    9: {"symbol": "F", "name": "Fluorine", "mass": 18.998, "period": 2, "group": 17, "en": 3.98, "ie": 1681, "radius": 42, "cat": "Halogen", "block": "p"},
    10: {"symbol": "Ne", "name": "Neon", "mass": 20.180, "period": 2, "group": 18, "en": 0.0, "ie": 2081, "radius": 38, "cat": "Noble Gas", "block": "p"},
    11: {"symbol": "Na", "name": "Sodium", "mass": 22.990, "period": 3, "group": 1, "en": 0.93, "ie": 496, "radius": 190, "cat": "Alkali Metal", "block": "s"},
    12: {"symbol": "Mg", "name": "Magnesium", "mass": 24.305, "period": 3, "group": 2, "en": 1.31, "ie": 738, "radius": 145, "cat": "Alkaline Earth", "block": "s"},
    13: {"symbol": "Al", "name": "Aluminium", "mass": 26.982, "period": 3, "group": 13, "en": 1.61, "ie": 578, "radius": 118, "cat": "Post-Transition Metal", "block": "p"},
    14: {"symbol": "Si", "name": "Silicon", "mass": 28.085, "period": 3, "group": 14, "en": 1.90, "ie": 787, "radius": 111, "cat": "Metalloid", "block": "p"},
    15: {"symbol": "P", "name": "Phosphorus", "mass": 30.974, "period": 3, "group": 15, "en": 2.19, "ie": 1012, "radius": 98, "cat": "Nonmetal", "block": "p"},
    16: {"symbol": "S", "name": "Sulfur", "mass": 32.06, "period": 3, "group": 16, "en": 2.58, "ie": 1000, "radius": 88, "cat": "Nonmetal", "block": "p"},
    17: {"symbol": "Cl", "name": "Chlorine", "mass": 35.45, "period": 3, "group": 17, "en": 3.16, "ie": 1251, "radius": 79, "cat": "Halogen", "block": "p"},
    18: {"symbol": "Ar", "name": "Argon", "mass": 39.948, "period": 3, "group": 18, "en": 0.0, "ie": 1521, "radius": 71, "cat": "Noble Gas", "block": "p"},
    19: {"symbol": "K", "name": "Potassium", "mass": 39.098, "period": 4, "group": 1, "en": 0.82, "ie": 419, "radius": 243, "cat": "Alkali Metal", "block": "s"},
    20: {"symbol": "Ca", "name": "Calcium", "mass": 40.078, "period": 4, "group": 2, "en": 1.00, "ie": 590, "radius": 194, "cat": "Alkaline Earth", "block": "s"},
    21: {"symbol": "Sc", "name": "Scandium", "mass": 44.956, "period": 4, "group": 3, "en": 1.36, "ie": 633, "radius": 184, "cat": "Transition Metal", "block": "d"},
    22: {"symbol": "Ti", "name": "Titanium", "mass": 47.867, "period": 4, "group": 4, "en": 1.54, "ie": 659, "radius": 176, "cat": "Transition Metal", "block": "d"},
    23: {"symbol": "V", "name": "Vanadium", "mass": 50.942, "period": 4, "group": 5, "en": 1.63, "ie": 651, "radius": 171, "cat": "Transition Metal", "block": "d"},
    24: {"symbol": "Cr", "name": "Chromium", "mass": 51.996, "period": 4, "group": 6, "en": 1.66, "ie": 653, "radius": 166, "cat": "Transition Metal", "block": "d"},
    25: {"symbol": "Mn", "name": "Manganese", "mass": 54.938, "period": 4, "group": 7, "en": 1.55, "ie": 717, "radius": 161, "cat": "Transition Metal", "block": "d"},
    26: {"symbol": "Fe", "name": "Iron", "mass": 55.845, "period": 4, "group": 8, "en": 1.83, "ie": 762, "radius": 156, "cat": "Transition Metal", "block": "d"},
    27: {"symbol": "Co", "name": "Cobalt", "mass": 58.933, "period": 4, "group": 9, "en": 1.88, "ie": 760, "radius": 152, "cat": "Transition Metal", "block": "d"},
    28: {"symbol": "Ni", "name": "Nickel", "mass": 58.693, "period": 4, "group": 10, "en": 1.91, "ie": 737, "radius": 149, "cat": "Transition Metal", "block": "d"},
    29: {"symbol": "Cu", "name": "Copper", "mass": 63.546, "period": 4, "group": 11, "en": 1.90, "ie": 745, "radius": 145, "cat": "Transition Metal", "block": "d"},
    30: {"symbol": "Zn", "name": "Zinc", "mass": 65.38, "period": 4, "group": 12, "en": 1.65, "ie": 906, "radius": 142, "cat": "Transition Metal", "block": "d"},
    31: {"symbol": "Ga", "name": "Gallium", "mass": 69.723, "period": 4, "group": 13, "en": 1.81, "ie": 579, "radius": 136, "cat": "Post-Transition Metal", "block": "p"},
    32: {"symbol": "Ge", "name": "Germanium", "mass": 72.63, "period": 4, "group": 14, "en": 2.01, "ie": 762, "radius": 125, "cat": "Metalloid", "block": "p"},
    33: {"symbol": "As", "name": "Arsenic", "mass": 74.922, "period": 4, "group": 15, "en": 2.18, "ie": 947, "radius": 114, "cat": "Metalloid", "block": "p"},
    34: {"symbol": "Se", "name": "Selenium", "mass": 78.971, "period": 4, "group": 16, "en": 2.55, "ie": 941, "radius": 103, "cat": "Nonmetal", "block": "p"},
    35: {"symbol": "Br", "name": "Bromine", "mass": 79.904, "period": 4, "group": 17, "en": 2.96, "ie": 1140, "radius": 94, "cat": "Halogen", "block": "p"},
    36: {"symbol": "Kr", "name": "Krypton", "mass": 83.798, "period": 4, "group": 18, "en": 0.0, "ie": 1351, "radius": 88, "cat": "Noble Gas", "block": "p"},
}


def _electron_shells(e_count: int) -> list[int]:
    if e_count <= 0:
        return [0]
    if e_count <= 2:
        return [e_count]
    if e_count <= 10:
        return [2, e_count - 2]
    if e_count <= 18:
        return [2, 8, e_count - 10]
    if e_count <= 20:
        return [2, 8, 8, e_count - 18]
    if e_count <= 30:
        # Transition metals (with Cr=24 and Cu=29 noted simply)
        if e_count == 24:
            return [2, 8, 13, 1]
        if e_count == 29:
            return [2, 8, 18, 1]
        return [2, 8, e_count - 12, 2]
    return [2, 8, 18, e_count - 28]


def simulate_atomic_structure(params: dict[str, Any]) -> dict[str, Any]:
    """Bohr Shell Atomic Model: protons Z, neutrons N, charge q -> shells & isotope."""
    protons = require_int(params, "protons", 6)
    neutrons = require_int(params, "neutrons", 6)
    charge = require_int(params, "charge", 0)

    check_bounds(protons, 1, 36, "Atomic number (Z)")
    check_bounds(neutrons, 0, 50, "Neutrons (N)")
    check_bounds(charge, -4, 4, "Ionic charge (q)")

    electrons = protons - charge
    if electrons < 0:
        raise SimulationValidationError("Electron count cannot be negative (charge exceeds proton number).")

    el = ELEMENTS_DATA[protons]
    mass_number = protons + neutrons
    shells = _electron_shells(electrons)
    valence = shells[-1]
    shell_str = ", ".join(str(s) for s in shells)
    species = "Neutral Atom" if charge == 0 else ("Cation (+)" if charge > 0 else "Anion (−)")

    series_data = [{"shell": idx + 1, "electrons": count, "capacity": 2 * ((idx + 1) ** 2)} for idx, count in enumerate(shells)]
    measurements = {
        "symbol": el["symbol"],
        "element_name": el["name"],
        "protons": protons,
        "neutrons": neutrons,
        "electrons": electrons,
        "mass_number": mass_number,
        "charge": charge,
        "shells": shells,
        "shell_configuration": shell_str,
        "valence_electrons": valence,
        "species_type": species,
        "category": el["cat"],
    }
    formatted = [
        {"key": "element_name", "label": "Element", "value": f"{el['name']} ({el['symbol']})", "unit": ""},
        {"key": "mass_number", "label": "Mass Number (A = Z+N)", "value": mass_number, "unit": "u"},
        {"key": "electrons", "label": "Electrons (e⁻)", "value": electrons, "unit": ""},
        {"key": "shell_configuration", "label": "Bohr Shells (K,L,M,N)", "value": shell_str, "unit": ""},
        {"key": "valence_electrons", "label": "Valence Electrons", "value": valence, "unit": ""},
        {"key": "species_type", "label": "Species", "value": species, "unit": ""},
    ]
    return {
        "parameters": {"protons": float(protons), "neutrons": float(neutrons), "charge": float(charge)},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": "ion" if charge != 0 else "neutral_atom",
        "assumptions": [
            "Simplified 2D Bohr shell visualization (real electrons occupy 3D quantum orbitals).",
            "Virtual simulation for educational conceptual modeling only.",
        ],
        "conclusion_summary": (
            f"{el['name']} ({el['symbol']}-{mass_number}) has Z = {protons} protons, N = {neutrons} neutrons, "
            f"and {electrons} electrons arranged in shells [{shell_str}] ({species})."
        ),
    }


def simulate_periodic_table_explorer(params: dict[str, Any]) -> dict[str, Any]:
    """Periodic Trends Explorer across Z = 1..36."""
    z = require_int(params, "atomic_number", 11)
    check_bounds(z, 1, 36, "Atomic number (Z)")

    el = ELEMENTS_DATA[z]
    shells = _electron_shells(z)
    period = el["period"]

    series_data = [
        {
            "atomic_number": float(k),
            "ionization_energy": float(v["ie"]),
            "atomic_radius": float(v["radius"]),
            "electronegativity": float(v["en"]),
        }
        for k, v in ELEMENTS_DATA.items()
        if v["period"] == period
    ]

    measurements = {
        "atomic_number": z,
        "symbol": el["symbol"],
        "element_name": el["name"],
        "atomic_mass": el["mass"],
        "period": period,
        "group": el["group"],
        "block": el["block"],
        "category": el["cat"],
        "electronegativity": el["en"],
        "ionization_energy_kj": el["ie"],
        "atomic_radius_pm": el["radius"],
        "shells": shells,
    }
    formatted = [
        {"key": "element_name", "label": "Element", "value": f"{el['name']} ({el['symbol']})", "unit": ""},
        {"key": "atomic_mass", "label": "Standard Atomic Mass", "value": el["mass"], "unit": "u"},
        {"key": "period", "label": "Period / Group / Block", "value": f"P{period} · G{el['group']} · {el['block']}-block", "unit": ""},
        {"key": "electronegativity", "label": "Electronegativity (Pauling)", "value": el["en"] if el["en"] > 0 else "N/A", "unit": ""},
        {"key": "ionization_energy_kj", "label": "1st Ionization Energy", "value": el["ie"], "unit": "kJ/mol"},
        {"key": "atomic_radius_pm", "label": "Atomic Radius", "value": el["radius"], "unit": "pm"},
    ]
    return {
        "parameters": {"atomic_number": float(z)},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": el["cat"].lower().replace(" ", "_"),
        "assumptions": [
            "Uses standard IUPAC atomic weights and empirical covalent/calculated atomic radii.",
            "Noble gases have unassigned Pauling electronegativity values.",
        ],
        "conclusion_summary": (
            f"{el['name']} (Z={z}, {el['cat']}) lies in Period {period}, Group {el['group']} with atomic radius "
            f"{el['radius']} pm and 1st ionization energy {el['ie']} kJ/mol."
        ),
    }


def simulate_acids_bases_ph(params: dict[str, Any]) -> dict[str, Any]:
    """Aqueous pH & pOH calculator at 25°C (Kw = 1.0e-14)."""
    solution_type = require_int(params, "solution_type", 0)  # 0=Strong Acid, 1=Strong Base, 2=Weak Acid, 3=Weak Base
    molarity = require_float(params, "molarity", 0.01)  # mol/L

    if solution_type not in (0, 1, 2, 3):
        raise SimulationValidationError("Solution type must be 0 (Strong Acid), 1 (Strong Base), 2 (Weak Acid), or 3 (Weak Base).")
    check_bounds(molarity, 1e-6, 2.0, "Molarity (C)", "M")

    kw = 1.0e-14
    ka_acetic = 1.8e-5
    kb_ammonia = 1.8e-5
    names = {0: "Strong Acid (HCl)", 1: "Strong Base (NaOH)", 2: "Weak Acid (CH₃COOH)", 3: "Weak Base (NH₃)"}

    if solution_type == 0:
        h_conc = 0.5 * (molarity + math.sqrt(molarity ** 2 + 4.0 * kw))
        oh_conc = kw / h_conc
    elif solution_type == 1:
        oh_conc = 0.5 * (molarity + math.sqrt(molarity ** 2 + 4.0 * kw))
        h_conc = kw / oh_conc
    elif solution_type == 2:
        # Exact quadratic for weak acid dissociation: x^2 + Ka*x - Ka*C = 0
        h_conc = 0.5 * (-ka_acetic + math.sqrt(ka_acetic ** 2 + 4.0 * ka_acetic * molarity))
        h_conc = max(h_conc, 1e-7)
        oh_conc = kw / h_conc
    else:
        oh_conc = 0.5 * (-kb_ammonia + math.sqrt(kb_ammonia ** 2 + 4.0 * kb_ammonia * molarity))
        oh_conc = max(oh_conc, 1e-7)
        h_conc = kw / oh_conc

    ph = max(0.0, min(14.0, -math.log10(h_conc)))
    poh = 14.0 - ph
    if ph < 6.8:
        nature = "Acidic"
    elif ph > 7.2:
        nature = "Basic (Alkaline)"
    else:
        nature = "Neutral"

    series_data = []
    for exp_i in range(-6, 1):
        c_pt = 10.0 ** exp_i
        if solution_type == 0:
            h_pt = 0.5 * (c_pt + math.sqrt(c_pt ** 2 + 4.0 * kw))
            ph_pt = -math.log10(h_pt)
        elif solution_type == 1:
            oh_pt = 0.5 * (c_pt + math.sqrt(c_pt ** 2 + 4.0 * kw))
            ph_pt = 14.0 + math.log10(oh_pt)
        elif solution_type == 2:
            h_pt = max(1e-7, 0.5 * (-ka_acetic + math.sqrt(ka_acetic ** 2 + 4.0 * ka_acetic * c_pt)))
            ph_pt = -math.log10(h_pt)
        else:
            oh_pt = max(1e-7, 0.5 * (-kb_ammonia + math.sqrt(kb_ammonia ** 2 + 4.0 * kb_ammonia * c_pt)))
            ph_pt = 14.0 + math.log10(oh_pt)
        series_data.append({"log_molarity": float(exp_i), "ph": round(max(0.0, min(14.0, ph_pt)), 3)})

    measurements = {
        "solution_name": names[solution_type],
        "ph": round(ph, 3),
        "poh": round(poh, 3),
        "h_concentration": float(f"{h_conc:.3e}"),
        "oh_concentration": float(f"{oh_conc:.3e}"),
        "nature": nature,
    }
    formatted = [
        {"key": "solution_name", "label": "Virtual Solution", "value": names[solution_type], "unit": ""},
        {"key": "ph", "label": "pH (−log[H⁺])", "value": measurements["ph"], "unit": ""},
        {"key": "poh", "label": "pOH (14 − pH)", "value": measurements["poh"], "unit": ""},
        {"key": "h_concentration", "label": "[H⁺] Ion Concentration", "value": f"{h_conc:.2e}", "unit": "M"},
        {"key": "nature", "label": "Classification", "value": nature, "unit": ""},
    ]
    return {
        "parameters": {"solution_type": float(solution_type), "molarity": molarity},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": nature.lower().split()[0],
        "assumptions": [
            "Dilute aqueous solution at 25°C (298.15 K) with Kw = 1.0 × 10⁻¹⁴ and unit activity coefficients.",
            "Virtual simulation only — never handle concentrated acids or bases outside supervised laboratories.",
        ],
        "conclusion_summary": (
            f"A {molarity} M virtual solution of {names[solution_type]} has pH = {measurements['ph']} "
            f"(pOH = {measurements['poh']}), classifying it as {nature}."
        ),
    }


def simulate_states_of_matter(params: dict[str, Any]) -> dict[str, Any]:
    """Phase state, kinetic energy, and RMS molecular speed vs temperature."""
    substance = require_int(params, "substance", 0)  # 0=Water, 1=Ethanol, 2=Nitrogen, 3=Iron
    temp_c = require_float(params, "temperature", 25.0)
    pressure_atm = require_float(params, "pressure", 1.0)

    if substance not in (0, 1, 2, 3):
        raise SimulationValidationError("Substance must be 0 (Water), 1 (Ethanol), 2 (Nitrogen), or 3 (Iron).")
    check_bounds(temp_c, -250.0, 3200.0, "Temperature", "°C")
    check_bounds(pressure_atm, 0.1, 10.0, "Pressure", "atm")

    subs = {
        0: {"name": "Water (H₂O)", "mp": 0.0, "bp": 100.0, "molar_mass": 0.018015},
        1: {"name": "Ethanol (C₂H₅OH)", "mp": -114.1, "bp": 78.37, "molar_mass": 0.04607},
        2: {"name": "Nitrogen (N₂)", "mp": -210.0, "bp": -195.8, "molar_mass": 0.028014},
        3: {"name": "Iron (Fe)", "mp": 1538.0, "bp": 2862.0, "molar_mass": 0.055845},
    }[substance]

    # Simple Clausius-Clapeyron boiling shift approximation around 1 atm
    bp_adj = subs["bp"] + 28.0 * math.log(pressure_atm)
    mp = subs["mp"]
    temp_k = temp_c + 273.15
    if temp_k <= 0.0:
        raise SimulationValidationError("Temperature must exceed absolute zero (−273.15 °C).")

    if temp_c < mp - 0.5:
        phase = "Solid"
    elif abs(temp_c - mp) <= 0.5:
        phase = "Melting / Freezing Point"
    elif temp_c < bp_adj - 0.5:
        phase = "Liquid"
    elif abs(temp_c - bp_adj) <= 0.5:
        phase = "Boiling / Condensation Point"
    else:
        phase = "Gas"

    ke_avg_zj = 1.5 * KB * temp_k * 1e21  # zeptojoules (10^-21 J)
    v_rms = math.sqrt((3.0 * GAS_R * temp_k) / subs["molar_mass"])

    series_data = [
        {"temp_K": round(tk, 1), "v_rms": round(math.sqrt((3.0 * GAS_R * tk) / subs["molar_mass"]), 1)}
        for tk in [50 + 50 * i for i in range(12)]
    ]

    measurements = {
        "substance_name": subs["name"],
        "temperature_k": round(temp_k, 2),
        "melting_point_c": round(mp, 2),
        "boiling_point_c": round(bp_adj, 2),
        "phase": phase,
        "avg_kinetic_energy_zj": round(ke_avg_zj, 3),
        "rms_speed_ms": round(v_rms, 1),
    }
    formatted = [
        {"key": "substance_name", "label": "Substance", "value": subs["name"], "unit": ""},
        {"key": "phase", "label": "Physical State", "value": phase, "unit": ""},
        {"key": "temperature_k", "label": "Absolute Temperature", "value": measurements["temperature_k"], "unit": "K"},
        {"key": "melting_point_c", "label": "Melting / Boiling Pt", "value": f"{measurements['melting_point_c']} / {measurements['boiling_point_c']}", "unit": "°C"},
        {"key": "avg_kinetic_energy_zj", "label": "Avg Kinetic Energy", "value": measurements["avg_kinetic_energy_zj"], "unit": "zJ"},
        {"key": "rms_speed_ms", "label": "Thermal RMS Speed", "value": measurements["rms_speed_ms"], "unit": "m/s"},
    ]
    return {
        "parameters": {"substance": float(substance), "temperature": temp_c, "pressure": pressure_atm},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": phase.lower().split()[0],
        "assumptions": [
            "Kinetic-molecular theory estimate for average translational kinetic energy (3/2 k_B T).",
            "Boiling point adjustment approximates pressure dependence near 1 atm.",
        ],
        "conclusion_summary": (
            f"At {temp_c} °C ({measurements['temperature_k']} K) and {pressure_atm} atm, {subs['name']} is in the "
            f"{phase} state with average particle kinetic energy {measurements['avg_kinetic_energy_zj']} zJ."
        ),
    }


def simulate_reaction_balancing(params: dict[str, Any]) -> dict[str, Any]:
    """Verify stoichiometric atom conservation for selectable chemical equations."""
    rxn_id = require_int(params, "reaction_id", 0)
    c1 = require_int(params, "coeff_1", 2)
    c2 = require_int(params, "coeff_2", 1)
    c3 = require_int(params, "coeff_3", 2)
    c4 = require_int(params, "coeff_4", 1)

    if rxn_id not in (0, 1, 2, 3):
        raise SimulationValidationError("Reaction ID must be 0, 1, 2, or 3.")
    for label, c in [("c₁", c1), ("c₂", c2), ("c₃", c3), ("c₄", c4)]:
        check_bounds(c, 1, 12, f"Coefficient {label}")

    reactions = {
        0: {
            "label": "c₁ H₂ + c₂ O₂ → c₃ H₂O",
            "reactants": [{"H": 2}, {"O": 2}],
            "products": [{"H": 2, "O": 1}],
            "solution": (2, 1, 2, 1),
            "uses_c4": False,
        },
        1: {
            "label": "c₁ N₂ + c₂ H₂ → c₃ NH₃",
            "reactants": [{"N": 2}, {"H": 2}],
            "products": [{"N": 1, "H": 3}],
            "solution": (1, 3, 2, 1),
            "uses_c4": False,
        },
        2: {
            "label": "c₁ CH₄ + c₂ O₂ → c₃ CO₂ + c₄ H₂O",
            "reactants": [{"C": 1, "H": 4}, {"O": 2}],
            "products": [{"C": 1, "O": 2}, {"H": 2, "O": 1}],
            "solution": (1, 2, 1, 2),
            "uses_c4": True,
        },
        3: {
            "label": "c₁ Fe + c₂ O₂ → c₃ Fe₂O₃",
            "reactants": [{"Fe": 1}, {"O": 2}],
            "products": [{"Fe": 2, "O": 3}],
            "solution": (4, 3, 2, 1),
            "uses_c4": False,
        },
    }
    rxn = reactions[rxn_id]
    r_counts: dict[str, int] = {}
    p_counts: dict[str, int] = {}
    r_coeffs = [c1, c2]
    p_coeffs = [c3, c4] if rxn["uses_c4"] else [c3]

    for coeff, species in zip(r_coeffs, rxn["reactants"]):
        for elem, cnt in species.items():
            r_counts[elem] = r_counts.get(elem, 0) + coeff * cnt
    for coeff, species in zip(p_coeffs, rxn["products"]):
        for elem, cnt in species.items():
            p_counts[elem] = p_counts.get(elem, 0) + coeff * cnt

    elements = sorted(set(r_counts.keys()) | set(p_counts.keys()))
    is_balanced = all(r_counts.get(e, 0) == p_counts.get(e, 0) for e in elements)
    active_coeffs = [c1, c2, c3, c4] if rxn["uses_c4"] else [c1, c2, c3]
    gcd_val = math.gcd(*active_coeffs)
    is_simplest = is_balanced and gcd_val == 1

    series_data = [
        {"element_index": float(i + 1), "reactant_atoms": float(r_counts.get(e, 0)), "product_atoms": float(p_counts.get(e, 0))}
        for i, e in enumerate(elements)
    ]
    atom_summary = ", ".join(f"{e}: {r_counts.get(e, 0)}→{p_counts.get(e, 0)}" for e in elements)

    measurements = {
        "equation_template": rxn["label"],
        "is_balanced": is_balanced,
        "is_simplest_ratio": is_simplest,
        "atom_summary": atom_summary,
        "reactant_atoms": r_counts,
        "product_atoms": p_counts,
        "total_reactant_atoms": sum(r_counts.values()),
        "total_product_atoms": sum(p_counts.values()),
    }
    formatted = [
        {"key": "equation_template", "label": "Reaction", "value": rxn["label"], "unit": ""},
        {"key": "is_balanced", "label": "Balance Status", "value": "Balanced (Simplest)" if is_simplest else ("Balanced (Reductible)" if is_balanced else "Unbalanced"), "unit": ""},
        {"key": "atom_summary", "label": "Atom Tally (LHS → RHS)", "value": atom_summary, "unit": ""},
        {"key": "total_reactant_atoms", "label": "Total Atoms (LHS / RHS)", "value": f"{sum(r_counts.values())} / {sum(p_counts.values())}", "unit": "atoms"},
    ]
    return {
        "parameters": {"reaction_id": float(rxn_id), "coeff_1": float(c1), "coeff_2": float(c2), "coeff_3": float(c3), "coeff_4": float(c4)},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": "balanced" if is_balanced else "unbalanced",
        "assumptions": [
            "Law of Conservation of Mass: atoms of every element must match on both sides of the equation.",
            "Virtual stoichiometric model; does not instruct physical laboratory synthesis.",
        ],
        "conclusion_summary": (
            f"The equation is {'BALANCED' if is_balanced else 'NOT balanced'} ({atom_summary})."
        ),
    }


def simulate_mole_stoichiometry(params: dict[str, Any]) -> dict[str, Any]:
    """Mole Concept: n = m / M, N = n * N_A, V_STP = n * 22.414 L."""
    mass_g = require_float(params, "sample_mass", 18.015)
    molar_mass = require_float(params, "molar_mass", 18.015)
    stoich_ratio = require_float(params, "stoich_ratio", 2.0)

    check_bounds(mass_g, 0.01, 5000.0, "Sample mass", "g")
    check_bounds(molar_mass, 1.0, 500.0, "Molar mass (M)", "g/mol")
    check_bounds(stoich_ratio, 0.25, 10.0, "Product-to-reactant mole ratio")

    moles = mass_g / molar_mass
    particles_1e23 = (moles * AVOGADRO) / 1e23
    stp_volume_l = moles * 22.414
    product_moles = moles * stoich_ratio

    series_data = [
        {"mass_g": round(mass_g * i / 10.0, 2), "moles": round((mass_g * i / 10.0) / molar_mass, 4)}
        for i in range(11)
    ]

    measurements = {
        "moles": round(moles, 5),
        "particles_1e23": round(particles_1e23, 4),
        "stp_gas_volume_l": round(stp_volume_l, 4),
        "product_moles": round(product_moles, 5),
    }
    formatted = [
        {"key": "moles", "label": "Moles of Reactant (n = m/M)", "value": measurements["moles"], "unit": "mol"},
        {"key": "particles_1e23", "label": "Particles (N = n·Nₐ)", "value": measurements["particles_1e23"], "unit": "×10²³"},
        {"key": "stp_gas_volume_l", "label": "Ideal Gas Volume at STP", "value": measurements["stp_gas_volume_l"], "unit": "L"},
        {"key": "product_moles", "label": "Theoretical Product Moles", "value": measurements["product_moles"], "unit": "mol"},
    ]
    return {
        "parameters": {"sample_mass": mass_g, "molar_mass": molar_mass, "stoich_ratio": stoich_ratio},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": None,
        "assumptions": [
            "Avogadro constant Nₐ = 6.02214 × 10²³ mol⁻¹; molar volume at 0°C, 1 atm = 22.414 L/mol.",
            "Assumes 100% theoretical yield with no limiting side-reactions.",
        ],
        "conclusion_summary": (
            f"{mass_g} g of a substance with M = {molar_mass} g/mol equals {measurements['moles']} mol "
            f"({measurements['particles_1e23']} × 10²³ particles), yielding {measurements['product_moles']} mol of product."
        ),
    }


def simulate_chemical_bonding(params: dict[str, Any]) -> dict[str, Any]:
    """Electronegativity difference & Pauling ionic character classification."""
    en_a = require_float(params, "en_a", 0.93)  # e.g. Na
    en_b = require_float(params, "en_b", 3.16)  # e.g. Cl
    bond_order = require_int(params, "bond_order", 1)

    check_bounds(en_a, 0.7, 4.0, "Electronegativity χ_A")
    check_bounds(en_b, 0.7, 4.0, "Electronegativity χ_B")
    if bond_order not in (1, 2, 3):
        raise SimulationValidationError("Bond order must be 1 (Single), 2 (Double), or 3 (Triple).")

    delta_en = abs(en_a - en_b)
    ionic_pct = (1.0 - math.exp(-0.25 * (delta_en ** 2))) * 100.0
    covalent_pct = 100.0 - ionic_pct

    if delta_en < 0.4:
        bond_type = "Nonpolar Covalent"
    elif delta_en <= 1.7:
        bond_type = "Polar Covalent"
    else:
        bond_type = "Ionic"

    shared_electrons = 2 * bond_order if bond_type != "Ionic" else 0
    series_data = [
        {"delta_en": round(x * 0.2, 2), "ionic_character_pct": round((1.0 - math.exp(-0.25 * ((x * 0.2) ** 2))) * 100.0, 2)}
        for x in range(18)
    ]

    measurements = {
        "delta_en": round(delta_en, 3),
        "ionic_character_pct": round(ionic_pct, 2),
        "covalent_character_pct": round(covalent_pct, 2),
        "bond_type": bond_type,
        "bond_order": bond_order,
        "shared_electrons": shared_electrons,
    }
    formatted = [
        {"key": "delta_en", "label": "Electronegativity Diff (Δχ)", "value": measurements["delta_en"], "unit": ""},
        {"key": "bond_type", "label": "Predicted Bond Type", "value": bond_type, "unit": ""},
        {"key": "ionic_character_pct", "label": "Pauling Ionic Character", "value": measurements["ionic_character_pct"], "unit": "%"},
        {"key": "covalent_character_pct", "label": "Covalent Character", "value": measurements["covalent_character_pct"], "unit": "%"},
        {"key": "shared_electrons", "label": "Shared Bonding Electrons", "value": shared_electrons, "unit": "e⁻"},
    ]
    return {
        "parameters": {"en_a": en_a, "en_b": en_b, "bond_order": float(bond_order)},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": bond_type.lower().replace(" ", "_"),
        "assumptions": [
            "Uses Pauling's empirical formula: % Ionic = 100 × (1 − exp(−0.25 Δχ²)).",
            "Bonding is a continuum; 0.4 and 1.7 are pedagogical classification thresholds.",
        ],
        "conclusion_summary": (
            f"With Δχ = {measurements['delta_en']}, the bond is classified as {bond_type} "
            f"({measurements['ionic_character_pct']}% ionic character, {measurements['covalent_character_pct']}% covalent)."
        ),
    }


def simulate_concentration_dilution(params: dict[str, Any]) -> dict[str, Any]:
    """Dilution equation C1*V1 = C2*V2 and solute mass calculation."""
    c1 = require_float(params, "initial_molarity", 2.0)  # M
    v1_ml = require_float(params, "initial_volume", 50.0)  # mL
    v2_ml = require_float(params, "final_volume", 250.0)  # mL
    molar_mass = require_float(params, "solute_molar_mass", 58.44)  # g/mol (NaCl)

    check_bounds(c1, 0.01, 18.0, "Initial molarity (C₁)", "M")
    check_bounds(v1_ml, 1.0, 2000.0, "Initial volume (V₁)", "mL")
    check_bounds(v2_ml, 1.0, 5000.0, "Final volume (V₂)", "mL")
    check_bounds(molar_mass, 1.0, 500.0, "Solute molar mass", "g/mol")
    if v2_ml < v1_ml:
        raise SimulationValidationError("Final diluted volume (V₂) must be greater than or equal to initial volume (V₁).")

    c2 = (c1 * v1_ml) / v2_ml
    dilution_factor = v2_ml / v1_ml
    solvent_added = v2_ml - v1_ml
    moles_solute = c1 * (v1_ml / 1000.0)
    solute_mass_g = moles_solute * molar_mass

    series_data = [
        {"volume_ml": round(v1_ml + (v2_ml - v1_ml) * i / 10.0, 1), "molarity": round((c1 * v1_ml) / (v1_ml + (v2_ml - v1_ml) * i / 10.0), 4)}
        for i in range(11)
    ]

    measurements = {
        "final_molarity": round(c2, 4),
        "dilution_factor": round(dilution_factor, 3),
        "solvent_added_ml": round(solvent_added, 2),
        "moles_solute": round(moles_solute, 5),
        "solute_mass_g": round(solute_mass_g, 4),
    }
    formatted = [
        {"key": "final_molarity", "label": "Final Concentration (C₂)", "value": measurements["final_molarity"], "unit": "M"},
        {"key": "dilution_factor", "label": "Dilution Factor (V₂/V₁)", "value": measurements["dilution_factor"], "unit": "×"},
        {"key": "solvent_added_ml", "label": "Solvent Added (ΔV)", "value": measurements["solvent_added_ml"], "unit": "mL"},
        {"key": "moles_solute", "label": "Conserved Moles (n)", "value": measurements["moles_solute"], "unit": "mol"},
        {"key": "solute_mass_g", "label": "Solute Mass", "value": measurements["solute_mass_g"], "unit": "g"},
    ]
    return {
        "parameters": {"initial_molarity": c1, "initial_volume": v1_ml, "final_volume": v2_ml, "solute_molar_mass": molar_mass},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": None,
        "assumptions": [
            "Additive solution volumes and conserved solute moles (n₁ = n₂).",
            "Virtual calculation — always follow lab safety protocols (e.g., acid into water) in real labs.",
        ],
        "conclusion_summary": (
            f"Diluting {v1_ml} mL of {c1} M solution to {v2_ml} mL ({measurements['dilution_factor']}×) yields "
            f"C₂ = {measurements['final_molarity']} M while conserving {measurements['moles_solute']} mol of solute."
        ),
    }


def simulate_chemical_equilibrium(params: dict[str, Any]) -> dict[str, Any]:
    """Reversible reaction A + B <-> 2C: compute Qc, shift direction, and exact ICE equilibrium."""
    kc = require_float(params, "kc", 4.0)
    a0 = require_float(params, "conc_a", 1.0)
    b0 = require_float(params, "conc_b", 1.0)
    c0 = require_float(params, "conc_c", 0.2)

    check_bounds(kc, 0.01, 1000.0, "Equilibrium constant (Kc)")
    check_bounds(a0, 0.01, 5.0, "Initial [A]", "M")
    check_bounds(b0, 0.01, 5.0, "Initial [B]", "M")
    check_bounds(c0, 0.0, 5.0, "Initial [C]", "M")

    qc = (c0 ** 2) / (a0 * b0)
    # Solve (c0 + 2x)^2 = Kc * (a0 - x) * (b0 - x)
    # (4 - Kc) x^2 + (4 c0 + Kc (a0 + b0)) x + (c0^2 - Kc a0 b0) = 0
    qa = 4.0 - kc
    qb = 4.0 * c0 + kc * (a0 + b0)
    qc_term = (c0 ** 2) - kc * a0 * b0

    low_x = -c0 / 2.0
    high_x = min(a0, b0)
    if abs(qa) < 1e-9:
        x_eq = -qc_term / qb
    else:
        disc = max(0.0, qb ** 2 - 4.0 * qa * qc_term)
        r1 = (-qb + math.sqrt(disc)) / (2.0 * qa)
        r2 = (-qb - math.sqrt(disc)) / (2.0 * qa)
        valid = [r for r in (r1, r2) if low_x - 1e-9 <= r <= high_x + 1e-9]
        x_eq = valid[0] if valid else 0.0

    a_eq = max(0.0, a0 - x_eq)
    b_eq = max(0.0, b0 - x_eq)
    c_eq = max(0.0, c0 + 2.0 * x_eq)

    if abs(qc - kc) < 1e-3:
        shift = "At Equilibrium (Qc = Kc)"
    elif qc < kc:
        shift = "Forward (Products Favored)"
    else:
        shift = "Reverse (Reactants Favored)"

    series_data = []
    for i in range(13):
        frac = 1.0 - math.exp(-0.4 * i)
        x_t = x_eq * frac
        series_data.append(
            {"step": float(i), "A": round(a0 - x_t, 4), "B": round(b0 - x_t, 4), "C": round(c0 + 2.0 * x_t, 4)}
        )

    measurements = {
        "qc": round(qc, 4),
        "kc": round(kc, 4),
        "shift_direction": shift,
        "extent_x": round(x_eq, 4),
        "a_eq": round(a_eq, 4),
        "b_eq": round(b_eq, 4),
        "c_eq": round(c_eq, 4),
    }
    formatted = [
        {"key": "qc", "label": "Reaction Quotient (Qc)", "value": measurements["qc"], "unit": ""},
        {"key": "shift_direction", "label": "Equilibrium Shift", "value": shift, "unit": ""},
        {"key": "a_eq", "label": "Equilibrium [A]", "value": measurements["a_eq"], "unit": "M"},
        {"key": "b_eq", "label": "Equilibrium [B]", "value": measurements["b_eq"], "unit": "M"},
        {"key": "c_eq", "label": "Equilibrium [C]", "value": measurements["c_eq"], "unit": "M"},
    ]
    return {
        "parameters": {"kc": kc, "conc_a": a0, "conc_b": b0, "conc_c": c0},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": "forward" if qc < kc else ("reverse" if qc > kc else "at_equilibrium"),
        "assumptions": [
            "Homogeneous ideal solution at constant temperature (constant Kc).",
            "Stoichiometry modeled as A + B ⇌ 2C using exact ICE quadratic equilibrium solver.",
        ],
        "conclusion_summary": (
            f"Since Qc = {measurements['qc']} vs Kc = {measurements['kc']}, the system shifts {shift}, "
            f"reaching [A]={measurements['a_eq']} M, [B]={measurements['b_eq']} M, [C]={measurements['c_eq']} M."
        ),
    }


def simulate_electrochemical_cells(params: dict[str, Any]) -> dict[str, Any]:
    """Galvanic Cell Nernst Equation & Gibbs Free Energy."""
    e_cathode = require_float(params, "e_cathode", 0.34)  # Cu2+/Cu
    e_anode = require_float(params, "e_anode", -0.76)  # Zn2+/Zn
    n_elec = require_int(params, "electrons", 2)
    q_val = require_float(params, "reaction_quotient", 1.0)
    temp_k = require_float(params, "temperature", 298.15)

    check_bounds(e_cathode, -3.1, 3.1, "Cathode reduction potential", "V")
    check_bounds(e_anode, -3.1, 3.1, "Anode reduction potential", "V")
    check_bounds(n_elec, 1, 6, "Electrons transferred (n)")
    check_bounds(q_val, 1e-4, 1e4, "Reaction quotient (Q)")
    check_bounds(temp_k, 250.0, 400.0, "Temperature (T)", "K")

    e0_cell = e_cathode - e_anode
    e_cell = e0_cell - ((GAS_R * temp_k) / (n_elec * FARADAY)) * math.log(q_val)
    delta_g_kj = (-n_elec * FARADAY * e_cell) / 1000.0
    spontaneous = e_cell > 0.0

    series_data = []
    for log_q in range(-4, 5):
        q_pt = 10.0 ** log_q
        e_pt = e0_cell - ((GAS_R * temp_k) / (n_elec * FARADAY)) * math.log(q_pt)
        series_data.append({"log10_Q": float(log_q), "e_cell_V": round(e_pt, 4)})

    measurements = {
        "e0_cell_v": round(e0_cell, 4),
        "e_cell_v": round(e_cell, 4),
        "delta_g_kj": round(delta_g_kj, 3),
        "spontaneous": spontaneous,
        "cell_type": "Galvanic (Spontaneous)" if spontaneous else "Electrolytic (Non-spontaneous)",
    }
    formatted = [
        {"key": "e0_cell_v", "label": "Standard Cell EMF (E°_cell)", "value": measurements["e0_cell_v"], "unit": "V"},
        {"key": "e_cell_v", "label": "Nernst Cell Potential (E_cell)", "value": measurements["e_cell_v"], "unit": "V"},
        {"key": "delta_g_kj", "label": "Gibbs Free Energy (ΔG)", "value": measurements["delta_g_kj"], "unit": "kJ/mol"},
        {"key": "cell_type", "label": "Thermodynamic Mode", "value": measurements["cell_type"], "unit": ""},
    ]
    return {
        "parameters": {
            "e_cathode": e_cathode,
            "e_anode": e_anode,
            "electrons": float(n_elec),
            "reaction_quotient": q_val,
            "temperature": temp_k,
        },
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": "spontaneous" if spontaneous else "non_spontaneous",
        "assumptions": [
            "Ideal Nernst behavior using Faraday constant F = 96,485.3 C/mol.",
            "Negligible internal cell overpotential and junction potential.",
        ],
        "conclusion_summary": (
            f"With E°_cell = {measurements['e0_cell_v']} V and Q = {q_val} at {temp_k} K, the Nernst equation gives "
            f"E_cell = {measurements['e_cell_v']} V and ΔG = {measurements['delta_g_kj']} kJ/mol ({measurements['cell_type']})."
        ),
    }


def simulate_reaction_kinetics(params: dict[str, Any]) -> dict[str, Any]:
    """Arrhenius Equation & First-Order Integrated Rate Law."""
    ea_kj = require_float(params, "activation_energy", 50.0)  # kJ/mol
    temp_k = require_float(params, "temperature", 300.0)  # K
    a0 = require_float(params, "initial_conc", 1.0)  # M
    pre_exp = require_float(params, "pre_exponential", 1e7)  # s^-1

    check_bounds(ea_kj, 5.0, 200.0, "Activation energy (Ea)", "kJ/mol")
    check_bounds(temp_k, 200.0, 1000.0, "Temperature (T)", "K")
    check_bounds(a0, 0.05, 10.0, "Initial concentration [A]₀", "M")
    check_bounds(pre_exp, 1e2, 1e12, "Frequency factor (A)", "s⁻¹")

    k_val = pre_exp * math.exp(-(ea_kj * 1000.0) / (GAS_R * temp_k))
    k_val = max(k_val, 1e-12)
    half_life = math.log(2.0) / k_val
    initial_rate = k_val * a0

    t_span = min(10000.0, max(1.0, 4.0 * half_life))
    series_data = []
    for i in range(17):
        t_pt = (t_span * i) / 16.0
        c_pt = a0 * math.exp(-k_val * t_pt)
        series_data.append({"time_s": round(t_pt, 3), "concentration_M": round(c_pt, 5)})

    measurements = {
        "rate_constant_k": float(f"{k_val:.4e}"),
        "half_life_s": round(half_life, 4),
        "initial_rate": float(f"{initial_rate:.4e}"),
        "conc_after_one_halflife": round(a0 / 2.0, 4),
    }
    formatted = [
        {"key": "rate_constant_k", "label": "Rate Constant (k)", "value": f"{k_val:.3e}", "unit": "s⁻¹"},
        {"key": "half_life_s", "label": "First-Order Half-Life (t₁/₂)", "value": measurements["half_life_s"], "unit": "s"},
        {"key": "initial_rate", "label": "Initial Rate (r₀ = k[A]₀)", "value": f"{initial_rate:.3e}", "unit": "M/s"},
        {"key": "conc_after_one_halflife", "label": "[A] at t = t₁/₂", "value": measurements["conc_after_one_halflife"], "unit": "M"},
    ]
    return {
        "parameters": {"activation_energy": ea_kj, "temperature": temp_k, "initial_conc": a0, "pre_exponential": pre_exp},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": None,
        "assumptions": [
            "First-order irreversible reaction obeying Arrhenius temperature dependence k = A·exp(−Ea/RT).",
            "Constant temperature and well-mixed homogeneous system.",
        ],
        "conclusion_summary": (
            f"At T = {temp_k} K and Ea = {ea_kj} kJ/mol, k = {k_val:.3e} s⁻¹ and t₁/₂ = {measurements['half_life_s']} s "
            f"(independent of [A]₀ for first-order kinetics)."
        ),
    }


def simulate_gas_laws_thermodynamics(params: dict[str, Any]) -> dict[str, Any]:
    """Ideal Gas Law vs van der Waals real gas equation (CO₂ constants)."""
    moles = require_float(params, "moles", 1.0)
    volume_l = require_float(params, "volume", 22.4)
    temp_k = require_float(params, "temperature", 298.15)
    # CO2 van der Waals constants: a = 3.592 L^2*atm/mol^2, b = 0.04267 L/mol
    a_vdw = 3.592
    b_vdw = 0.04267

    check_bounds(moles, 0.1, 10.0, "Moles (n)", "mol")
    check_bounds(temp_k, 150.0, 1500.0, "Temperature (T)", "K")
    min_v = moles * b_vdw + 0.05
    if volume_l <= min_v or volume_l > 200.0:
        raise SimulationValidationError(f"Volume must be > {round(min_v, 3)} L (excluded molecular volume nb) and ≤ 200 L.")

    p_ideal = (moles * GAS_R_ATM * temp_k) / volume_l
    p_vdw = ((moles * GAS_R_ATM * temp_k) / (volume_l - moles * b_vdw)) - a_vdw * ((moles / volume_l) ** 2)
    z_factor = (p_vdw * volume_l) / (moles * GAS_R_ATM * temp_k)
    deviation_pct = ((p_vdw - p_ideal) / p_ideal) * 100.0 if p_ideal > 0 else 0.0

    series_data = []
    for i in range(1, 16):
        v_pt = min_v + ((max(30.0, volume_l) - min_v) * i / 15.0)
        pi_pt = (moles * GAS_R_ATM * temp_k) / v_pt
        pv_pt = ((moles * GAS_R_ATM * temp_k) / (v_pt - moles * b_vdw)) - a_vdw * ((moles / v_pt) ** 2)
        series_data.append({"volume_L": round(v_pt, 2), "p_ideal_atm": round(pi_pt, 3), "p_vdw_atm": round(pv_pt, 3)})

    measurements = {
        "p_ideal_atm": round(p_ideal, 4),
        "p_vdw_atm": round(p_vdw, 4),
        "compressibility_z": round(z_factor, 4),
        "deviation_pct": round(deviation_pct, 3),
    }
    formatted = [
        {"key": "p_ideal_atm", "label": "Ideal Gas Pressure (PV=nRT)", "value": measurements["p_ideal_atm"], "unit": "atm"},
        {"key": "p_vdw_atm", "label": "van der Waals Pressure", "value": measurements["p_vdw_atm"], "unit": "atm"},
        {"key": "compressibility_z", "label": "Compressibility Factor (Z)", "value": measurements["compressibility_z"], "unit": ""},
        {"key": "deviation_pct", "label": "Real-Gas Deviation", "value": measurements["deviation_pct"], "unit": "%"},
    ]
    return {
        "parameters": {"moles": moles, "volume": volume_l, "temperature": temp_k},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": "attractive_dominated" if z_factor < 0.99 else ("repulsive_dominated" if z_factor > 1.01 else "near_ideal"),
        "assumptions": [
            "Uses CO₂ van der Waals parameters (a = 3.592 L²·atm/mol², b = 0.04267 L/mol).",
            "Valid in the single-phase gas regime away from liquid-vapor coexistence.",
        ],
        "conclusion_summary": (
            f"For {moles} mol at {temp_k} K in {volume_l} L, P_ideal = {measurements['p_ideal_atm']} atm vs "
            f"P_vdW = {measurements['p_vdw_atm']} atm (Z = {measurements['compressibility_z']}, deviation {measurements['deviation_pct']}%)."
        ),
    }


CONTROLLED_REACTIONS = [
    {
        "id": 0,
        "name": "Acid-Base Neutralization",
        "reactants": "HCl(aq) + NaOH(aq)",
        "products": "NaCl(aq) + H₂O(l)",
        "equation": "HCl + NaOH → NaCl + H₂O",
        "stoich": (1.0, 1.0, 1.0),
        "delta_h_kj_mol": -57.3,
        "requires_heat": False,
        "observation": "Clear solution warms gently; universal indicator shifts toward neutral green (pH ≈ 7) at equivalence.",
        "condition": "Room temperature (25 °C), aqueous mixing",
        "energy_type": "Exothermic",
    },
    {
        "id": 1,
        "name": "Zinc + Hydrochloric Acid",
        "reactants": "Zn(s) + 2 HCl(aq)",
        "products": "ZnCl₂(aq) + H₂(g)↑",
        "equation": "Zn + 2 HCl → ZnCl₂ + H₂↑",
        "stoich": (1.0, 2.0, 1.0),
        "delta_h_kj_mol": -153.9,
        "requires_heat": False,
        "observation": "Brisk effervescence (colourless H₂ gas bubbles) as zinc dissolves and temperature rises.",
        "condition": "Room temperature, dilute HCl in test tube/conical flask",
        "energy_type": "Exothermic",
    },
    {
        "id": 2,
        "name": "Silver Chloride Precipitation",
        "reactants": "AgNO₃(aq) + NaCl(aq)",
        "products": "AgCl(s)↓ + NaNO₃(aq)",
        "equation": "AgNO₃ + NaCl → AgCl↓ + NaNO₃",
        "stoich": (1.0, 1.0, 1.0),
        "delta_h_kj_mol": -65.5,
        "requires_heat": False,
        "observation": "Instant curdy white precipitate of insoluble AgCl forms and settles at the bottom.",
        "condition": "Room temperature, aqueous double displacement",
        "energy_type": "Exothermic",
    },
    {
        "id": 3,
        "name": "Marble (CaCO₃) + Hydrochloric Acid",
        "reactants": "CaCO₃(s) + 2 HCl(aq)",
        "products": "CaCl₂(aq) + H₂O(l) + CO₂(g)↑",
        "equation": "CaCO₃ + 2 HCl → CaCl₂ + H₂O + CO₂↑",
        "stoich": (1.0, 2.0, 1.0),
        "delta_h_kj_mol": -15.2,
        "requires_heat": False,
        "observation": "Vigorous fizzing releasing CO₂ gas (turns limewater milky).",
        "condition": "Room temperature, calcium carbonate chips + acid",
        "energy_type": "Exothermic",
    },
    {
        "id": 4,
        "name": "Magnesium Ribbon Combustion",
        "reactants": "2 Mg(s) + O₂(g)",
        "products": "2 MgO(s)",
        "equation": "2 Mg + O₂ → 2 MgO",
        "stoich": (2.0, 1.0, 2.0),
        "delta_h_kj_mol": -1203.4,
        "requires_heat": True,
        "observation": "Burns with a dazzling white flame forming white powdery magnesium oxide ash.",
        "condition": "Requires Bunsen burner ignition (T ≥ 450 °C)",
        "energy_type": "Strongly Exothermic",
    },
    {
        "id": 5,
        "name": "Thermal Decomposition of Calcium Carbonate",
        "reactants": "CaCO₃(s) + Heat",
        "products": "CaO(s) + CO₂(g)↑",
        "equation": "CaCO₃ → CaO + CO₂↑ (with heat)",
        "stoich": (1.0, 1.0, 1.0),
        "delta_h_kj_mol": 178.3,
        "requires_heat": True,
        "observation": "Endothermic decomposition absorbs Bunsen heat, yielding quicklime (CaO) and CO₂ gas.",
        "condition": "Requires strong Bunsen burner heating",
        "energy_type": "Endothermic",
    },
]


def simulate_chemical_reaction_playground(params: dict[str, Any]) -> dict[str, Any]:
    """Controlled Chemical Reaction Playground with stoichiometry, limiting reagent & thermochemistry."""
    reaction_idx = require_int(params, "reaction_id", 0)
    moles_a = require_float(params, "moles_a", 0.2)
    moles_b = require_float(params, "moles_b", 0.2)
    heat_on = require_int(params, "heat_on", 0)

    check_bounds(reaction_idx, 0, len(CONTROLLED_REACTIONS) - 1, "Reaction selector")
    check_bounds(moles_a, 0.05, 2.0, "Reactant A moles", "mol")
    check_bounds(moles_b, 0.05, 2.0, "Reactant B moles", "mol")
    check_bounds(heat_on, 0, 1, "Bunsen burner heat")

    rxn = CONTROLLED_REACTIONS[reaction_idx]
    a_coef, b_coef, p_coef = rxn["stoich"]
    reaction_occurs = (not rxn["requires_heat"]) or (heat_on == 1)

    if not reaction_occurs:
        extent = 0.0
        limiting = "Activation heat required (turn ON Bunsen burner)"
    else:
        ext_a = moles_a / a_coef
        ext_b = moles_b / b_coef if reaction_idx != 5 else ext_a
        extent = min(ext_a, ext_b)
        if reaction_idx == 5:
            limiting = "CaCO₃ (single reactant)"
        elif abs(ext_a - ext_b) < 1e-6:
            limiting = "Stoichiometric equivalence (neither in excess)"
        elif ext_a < ext_b:
            limiting = "Reactant A (limiting)"
        else:
            limiting = "Reactant B (limiting)"

    product_moles = extent * p_coef
    heat_kj = extent * rxn["delta_h_kj_mol"]
    # Solution/calorimeter temperature shift estimate assuming 250 mL aqueous heat capacity (~1.046 kJ/K)
    delta_t_c = (-heat_kj) / 1.046 if reaction_idx in (0, 1, 2, 3) else ((-heat_kj) / 10.0 if reaction_occurs else 0.0)
    final_temp_c = max(5.0, min(900.0, 25.0 + delta_t_c))

    series_data = [
        {"stage": "Initial A", "moles": round(moles_a, 3)},
        {"stage": "Initial B", "moles": round(moles_b, 3)},
        {"stage": "Product", "moles": round(product_moles, 3)},
        {"stage": "Excess A", "moles": round(max(0.0, moles_a - extent * a_coef), 3)},
    ]

    measurements = {
        "reaction_name": rxn["name"],
        "equation": rxn["equation"],
        "reaction_occurs": reaction_occurs,
        "limiting_reagent": limiting,
        "product_moles": round(product_moles, 4),
        "enthalpy_change_kj": round(heat_kj, 2),
        "final_temp_c": round(final_temp_c, 1),
        "energy_type": rxn["energy_type"],
        "observable_change": rxn["observation"] if reaction_occurs else "No reaction yet — turn ON the Bunsen burner to supply activation energy.",
    }
    formatted = [
        {"key": "equation", "label": "Balanced Equation", "value": rxn["equation"], "unit": ""},
        {"key": "product_moles", "label": "Primary Product Yield", "value": measurements["product_moles"], "unit": "mol"},
        {"key": "enthalpy_change_kj", "label": "Heat Change (ΔH)", "value": measurements["enthalpy_change_kj"], "unit": "kJ"},
        {"key": "final_temp_c", "label": "Thermometer Reading", "value": measurements["final_temp_c"], "unit": "°C"},
        {"key": "limiting_reagent", "label": "Limiting Factor", "value": limiting, "unit": ""},
    ]
    return {
        "parameters": {
            "reaction_id": float(reaction_idx),
            "moles_a": moles_a,
            "moles_b": moles_b,
            "heat_on": float(heat_on),
        },
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": "heat_required" if not reaction_occurs else rxn["energy_type"].lower().replace(" ", "_"),
        "assumptions": [
            "Only scientifically verified reactions from the controlled library are simulated.",
            "Standard reaction enthalpies ΔH° at 298 K; aqueous reactions assume 250 mL calorimeter heat capacity.",
        ],
        "conclusion_summary": (
            f"{rxn['equation']}: yields {measurements['product_moles']} mol product with ΔH = {measurements['enthalpy_change_kj']} kJ "
            f"({rxn['energy_type']}). {measurements['observable_change']}"
        ),
    }


CHEMISTRY_SIMULATIONS = {
    "atomic-structure": simulate_atomic_structure,
    "periodic-table-explorer": simulate_periodic_table_explorer,
    "acids-bases-ph": simulate_acids_bases_ph,
    "chemical-reaction-playground": simulate_chemical_reaction_playground,
    "states-of-matter": simulate_states_of_matter,
    "reaction-balancing": simulate_reaction_balancing,
    "mole-stoichiometry": simulate_mole_stoichiometry,
    "chemical-bonding": simulate_chemical_bonding,
    "concentration-dilution": simulate_concentration_dilution,
    "chemical-equilibrium": simulate_chemical_equilibrium,
    "electrochemical-cells": simulate_electrochemical_cells,
    "reaction-kinetics": simulate_reaction_kinetics,
    "gas-laws-thermodynamics": simulate_gas_laws_thermodynamics,
}
