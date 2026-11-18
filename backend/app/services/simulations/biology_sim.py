"""Deterministic Biology simulation engines (12 experiments across Basic, Intermediate, Advanced)."""

from __future__ import annotations

import math
from typing import Any

from app.services.simulations.common import SimulationValidationError, check_bounds, require_float, require_int

PLANT_ORGANELLES = [
    {"name": "Cell Wall", "role": "Rigid cellulose outer layer providing structural support and protection against osmotic bursting.", "plant_only": True},
    {"name": "Chloroplast", "role": "Site of photosynthesis converting light energy, CO₂, and H₂O into glucose and O₂.", "plant_only": True},
    {"name": "Central Vacuole", "role": "Large fluid sac maintaining turgor pressure and storing water, ions, and nutrients.", "plant_only": True},
    {"name": "Nucleus", "role": "Stores genomic DNA and coordinates transcription and cell reproduction.", "plant_only": False},
    {"name": "Mitochondrion", "role": "Generates ATP via aerobic cellular respiration.", "plant_only": False},
    {"name": "Endoplasmic Reticulum", "role": "Synthesizes and folds proteins (rough ER) and lipids (smooth ER).", "plant_only": False},
    {"name": "Golgi Apparatus", "role": "Modifies, sorts, and packages macromolecules for secretion or organelle delivery.", "plant_only": False},
    {"name": "Plasma Membrane", "role": "Selectively permeable phospholipid bilayer regulating transport into and out of the cell.", "plant_only": False},
]

ANIMAL_ORGANELLES = [
    {"name": "Nucleus", "role": "Houses linear chromosomes and regulates gene expression.", "animal_distinct": False},
    {"name": "Mitochondrion", "role": "Produces ATP through oxidative phosphorylation to power cellular work.", "animal_distinct": False},
    {"name": "Lysosome", "role": "Acidic digestive vesicles containing hydrolytic enzymes that recycle cellular waste.", "animal_distinct": True},
    {"name": "Centrosome (Centrioles)", "role": "Organizes spindle microtubules during animal cell mitosis.", "animal_distinct": True},
    {"name": "Ribosome", "role": "Translates mRNA codons into polypeptide chains.", "animal_distinct": False},
    {"name": "Golgi Apparatus", "role": "Processes and packages proteins and lipids into transport vesicles.", "animal_distinct": False},
    {"name": "Endoplasmic Reticulum", "role": "Network for protein synthesis (rough ER) and calcium/lipid regulation (smooth ER).", "animal_distinct": False},
    {"name": "Plasma Membrane", "role": "Flexible lipid bilayer enabling endocytosis, signaling, and cell motility.", "animal_distinct": False},
]


def simulate_plant_cell_structure(params: dict[str, Any]) -> dict[str, Any]:
    """Plant cell organelle inspection & geometric surface-area-to-volume ratio."""
    organelle_idx = require_int(params, "organelle_index", 1)
    cell_length_um = require_float(params, "cell_length", 50.0)
    osmolarity_ratio = require_float(params, "water_potential", 1.0)  # 0.5 hypertonic, 1.0 isotonic, 1.5 hypotonic

    check_bounds(organelle_idx, 0, len(PLANT_ORGANELLES) - 1, "Organelle index")
    check_bounds(cell_length_um, 10.0, 200.0, "Cell side length", "μm")
    check_bounds(osmolarity_ratio, 0.4, 1.6, "Water potential index")

    org = PLANT_ORGANELLES[organelle_idx]
    surface_area = 6.0 * (cell_length_um ** 2)
    volume = cell_length_um ** 3
    sa_v = 6.0 / cell_length_um
    turgor_state = "Turgid (Optimal)" if osmolarity_ratio > 1.08 else ("Plasmolyzed" if osmolarity_ratio < 0.92 else "Flaccid (Isotonic)")

    series_data = [
        {"side_um": float(s), "sa_to_vol": round(6.0 / s, 4)}
        for s in range(10, 160, 15)
    ]
    measurements = {
        "organelle_name": org["name"],
        "organelle_role": org["role"],
        "plant_specific": org["plant_only"],
        "surface_area_um2": round(surface_area, 1),
        "volume_um3": round(volume, 1),
        "sa_to_volume_ratio": round(sa_v, 4),
        "turgor_state": turgor_state,
    }
    formatted = [
        {"key": "organelle_name", "label": "Selected Organelle", "value": org["name"], "unit": ""},
        {"key": "plant_specific", "label": "Unique to Plant Cells?", "value": "Yes" if org["plant_only"] else "Shared with Animal Cells", "unit": ""},
        {"key": "sa_to_volume_ratio", "label": "SA : Volume Ratio", "value": measurements["sa_to_volume_ratio"], "unit": "μm⁻¹"},
        {"key": "turgor_state", "label": "Osmotic State", "value": turgor_state, "unit": ""},
    ]
    return {
        "parameters": {"organelle_index": float(organelle_idx), "cell_length": cell_length_um, "water_potential": osmolarity_ratio},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": turgor_state.lower().split()[0],
        "assumptions": [
            "Simplified cuboidal geometry model for plant parenchyma cells.",
            "Visual model represents a generalized eukaryotic plant cell.",
        ],
        "conclusion_summary": (
            f"Inspecting {org['name']}: {org['role']} At side length {cell_length_um} μm, SA:V = {measurements['sa_to_volume_ratio']} μm⁻¹ ({turgor_state})."
        ),
    }


def simulate_animal_cell_structure(params: dict[str, Any]) -> dict[str, Any]:
    """Animal cell organelle inspector & spherical SA:V diffusion model."""
    organelle_idx = require_int(params, "organelle_index", 1)
    radius_um = require_float(params, "cell_radius", 12.0)

    check_bounds(organelle_idx, 0, len(ANIMAL_ORGANELLES) - 1, "Organelle index")
    check_bounds(radius_um, 3.0, 100.0, "Cell radius", "μm")

    org = ANIMAL_ORGANELLES[organelle_idx]
    surface_area = 4.0 * math.pi * (radius_um ** 2)
    volume = (4.0 / 3.0) * math.pi * (radius_um ** 3)
    sa_v = 3.0 / radius_um

    series_data = [{"radius_um": float(r), "sa_to_vol": round(3.0 / r, 4)} for r in range(5, 80, 7)]
    measurements = {
        "organelle_name": org["name"],
        "organelle_role": org["role"],
        "surface_area_um2": round(surface_area, 2),
        "volume_um3": round(volume, 2),
        "sa_to_volume_ratio": round(sa_v, 4),
    }
    formatted = [
        {"key": "organelle_name", "label": "Selected Organelle", "value": org["name"], "unit": ""},
        {"key": "surface_area_um2", "label": "Membrane Area (4πr²)", "value": measurements["surface_area_um2"], "unit": "μm²"},
        {"key": "volume_um3", "label": "Cell Volume (4/3 πr³)", "value": measurements["volume_um3"], "unit": "μm³"},
        {"key": "sa_to_volume_ratio", "label": "SA : Volume Ratio (3/r)", "value": measurements["sa_to_volume_ratio"], "unit": "μm⁻¹"},
    ]
    return {
        "parameters": {"organelle_index": float(organelle_idx), "cell_radius": radius_um},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": None,
        "assumptions": [
            "Spherical geometric approximation for typical eukaryotic animal cells.",
            "Smaller radii yield higher SA:V ratios, improving passive nutrient diffusion.",
        ],
        "conclusion_summary": (
            f"Inspecting {org['name']}: {org['role']} For r = {radius_um} μm, SA:V = {measurements['sa_to_volume_ratio']} μm⁻¹."
        ),
    }


def simulate_human_digestive_system(params: dict[str, Any]) -> dict[str, Any]:
    """Digestive enzyme activity model (Amylase, Pepsin, Trypsin) vs pH, Temperature, Substrate."""
    enzyme_id = require_int(params, "enzyme", 1)  # 0=Salivary Amylase, 1=Pepsin, 2=Trypsin
    ph = require_float(params, "ph", 2.0)
    temp_c = require_float(params, "temperature", 37.0)
    substrate = require_float(params, "substrate_conc", 50.0)  # mM

    if enzyme_id not in (0, 1, 2):
        raise SimulationValidationError("Enzyme must be 0 (Amylase), 1 (Pepsin), or 2 (Trypsin).")
    check_bounds(ph, 1.0, 12.0, "pH")
    check_bounds(temp_c, 5.0, 75.0, "Temperature", "°C")
    check_bounds(substrate, 1.0, 200.0, "Substrate concentration", "mM")

    enz = {
        0: {"name": "Salivary Amylase (Mouth)", "opt_ph": 6.8, "sigma_ph": 1.2, "substrate": "Starch → Maltose"},
        1: {"name": "Pepsin (Stomach)", "opt_ph": 2.0, "sigma_ph": 1.0, "substrate": "Proteins → Peptides"},
        2: {"name": "Trypsin (Small Intestine)", "opt_ph": 8.0, "sigma_ph": 1.2, "substrate": "Peptides → Amino Acids"},
    }[enzyme_id]

    ph_factor = math.exp(-0.5 * (((ph - enz["opt_ph"]) / enz["sigma_ph"]) ** 2))
    if temp_c <= 37.0:
        temp_factor = math.exp(-0.5 * (((temp_c - 37.0) / 14.0) ** 2))
    else:
        temp_factor = max(0.0, math.exp(-0.5 * (((temp_c - 37.0) / 6.5) ** 2)))
    mm_factor = substrate / (25.0 + substrate)
    activity_pct = 100.0 * ph_factor * temp_factor * mm_factor

    series_data = [
        {
            "ph": round(p * 0.5, 1),
            "activity_pct": round(100.0 * math.exp(-0.5 * (((p * 0.5 - enz["opt_ph"]) / enz["sigma_ph"]) ** 2)) * temp_factor * mm_factor, 2),
        }
        for p in range(2, 25)
    ]

    status = "Denatured (High Temp)" if temp_c > 55.0 else ("Optimal Range" if activity_pct >= 55.0 else "Suboptimal Activity")
    measurements = {
        "enzyme_name": enz["name"],
        "reaction": enz["substrate"],
        "optimal_ph": enz["opt_ph"],
        "relative_activity_pct": round(activity_pct, 2),
        "ph_efficiency_pct": round(ph_factor * 100.0, 1),
        "status": status,
    }
    formatted = [
        {"key": "enzyme_name", "label": "Digestive Enzyme", "value": enz["name"], "unit": ""},
        {"key": "reaction", "label": "Catalyzed Breakdown", "value": enz["substrate"], "unit": ""},
        {"key": "relative_activity_pct", "label": "Relative Enzyme Activity", "value": measurements["relative_activity_pct"], "unit": "%"},
        {"key": "optimal_ph", "label": "Optimum pH", "value": enz["opt_ph"], "unit": ""},
        {"key": "status", "label": "Catalytic Status", "value": status, "unit": ""},
    ]
    return {
        "parameters": {"enzyme": float(enzyme_id), "ph": ph, "temperature": temp_c, "substrate_conc": substrate},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": "denatured" if temp_c > 55.0 else None,
        "assumptions": [
            "Simplified bell-curve pH/temperature and Michaelis-Menten (Km = 25 mM) pedagogical model.",
            "Human physiological core temperature is modeled at 37 °C.",
        ],
        "conclusion_summary": (
            f"{enz['name']} operates at {measurements['relative_activity_pct']}% relative activity at pH {ph} and {temp_c} °C ({status})."
        ),
    }


def simulate_photosynthesis(params: dict[str, Any]) -> dict[str, Any]:
    """Blackman's Law of Limiting Factors for Photosynthesis."""
    light = require_float(params, "light_intensity", 600.0)  # umol/m^2/s
    co2 = require_float(params, "co2_ppm", 400.0)  # ppm
    temp_c = require_float(params, "temperature", 25.0)  # C

    check_bounds(light, 0.0, 2000.0, "Light intensity", "μmol/m²/s")
    check_bounds(co2, 0.0, 1200.0, "CO₂ concentration", "ppm")
    check_bounds(temp_c, 0.0, 50.0, "Temperature", "°C")

    f_light = light / (light + 250.0) if light > 0 else 0.0
    f_co2 = co2 / (co2 + 300.0) if co2 > 0 else 0.0
    f_temp = max(0.0, math.exp(-0.5 * (((temp_c - 27.0) / 10.0) ** 2))) if temp_c < 45.0 else max(0.0, 0.1 * (50.0 - temp_c) / 5.0)

    # Limiting-factor multiplicative saturation model
    o2_rate = 30.0 * min(f_light, f_co2) * f_temp  # umol O2 / m^2 / s
    glucose_rate = o2_rate / 6.0

    factors = {"Light Intensity": f_light, "CO₂ Concentration": f_co2, "Temperature (Enzymes)": f_temp}
    limiting_factor = min(factors, key=factors.get)  # type: ignore[arg-type]

    series_data = [
        {"light_intensity": float(l_pt), "o2_rate": round(30.0 * min(l_pt / (l_pt + 250.0), f_co2) * f_temp, 3)}
        for l_pt in range(0, 2001, 200)
    ]

    measurements = {
        "o2_evolution_rate": round(o2_rate, 3),
        "glucose_synthesis_rate": round(glucose_rate, 4),
        "limiting_factor": limiting_factor,
        "light_saturation_pct": round(f_light * 100.0, 1),
        "co2_saturation_pct": round(f_co2 * 100.0, 1),
    }
    formatted = [
        {"key": "o2_evolution_rate", "label": "O₂ Evolution Rate", "value": measurements["o2_evolution_rate"], "unit": "μmol/m²/s"},
        {"key": "glucose_synthesis_rate", "label": "Glucose Synthesis Rate", "value": measurements["glucose_synthesis_rate"], "unit": "μmol/m²/s"},
        {"key": "limiting_factor", "label": "Current Limiting Factor", "value": limiting_factor, "unit": ""},
        {"key": "light_saturation_pct", "label": "Light Factor", "value": measurements["light_saturation_pct"], "unit": "%"},
    ]
    return {
        "parameters": {"light_intensity": light, "co2_ppm": co2, "temperature": temp_c},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": "darkness" if light == 0.0 else None,
        "assumptions": [
            "Simplified C3 leaf photosynthesis model (6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂).",
            "Does not model photorespiration or stomatal closure during drought stress.",
        ],
        "conclusion_summary": (
            f"O₂ evolution rate is {measurements['o2_evolution_rate']} μmol/m²/s (glucose rate {measurements['glucose_synthesis_rate']} μmol/m²/s); "
            f"the primary limiting factor is {limiting_factor}."
        ),
    }


def simulate_mitosis_meiosis(params: dict[str, Any]) -> dict[str, Any]:
    """Chromosome and DNA ploidy tracking across Mitosis vs Meiosis stages."""
    diploid_2n = require_int(params, "diploid_number", 46)
    mode = require_int(params, "division_mode", 0)  # 0=Mitosis, 1=Meiosis
    stage = require_int(params, "stage", 2)  # 0=G1, 1=S/Prophase, 2=Metaphase, 3=Anaphase, 4=Telophase/Cytokinesis

    if diploid_2n < 2 or diploid_2n > 100 or diploid_2n % 2 != 0:
        raise SimulationValidationError("Diploid chromosome number (2n) must be an even integer between 2 and 100.")
    if mode not in (0, 1):
        raise SimulationValidationError("Division mode must be 0 (Mitosis) or 1 (Meiosis).")
    check_bounds(stage, 0, 4, "Stage index")

    stage_names = ["Interphase (G₁)", "Prophase (post-S)", "Metaphase", "Anaphase", "Cytokinesis (Final)"]
    n = diploid_2n // 2
    if mode == 0:
        mode_name = "Mitosis"
        daughters = 2 if stage == 4 else 1
        chrom_per_cell = diploid_2n
        dna_c = [2, 4, 4, 4, 2][stage]
        chromatids = [diploid_2n, 2 * diploid_2n, 2 * diploid_2n, 2 * diploid_2n, diploid_2n][stage]
        genetic_outcome = "2 Genetically Identical Diploid (2n) Cells"
    else:
        mode_name = "Meiosis (I & II)"
        daughters = 4 if stage == 4 else (2 if stage == 3 else 1)
        chrom_per_cell = n if stage == 4 else diploid_2n
        dna_c = [2, 4, 4, 2, 1][stage]
        chromatids = [diploid_2n, 2 * diploid_2n, 2 * diploid_2n, diploid_2n, n][stage]
        genetic_outcome = "4 Genetically Unique Haploid (n) Gametes"

    series_data = [
        {"stage_index": float(i), "dna_content_C": float([2, 4, 4, 4, 2][i] if mode == 0 else [2, 4, 4, 2, 1][i])}
        for i in range(5)
    ]
    measurements = {
        "mode_name": mode_name,
        "stage_name": stage_names[stage],
        "daughter_cells": daughters,
        "chromosomes_per_cell": chrom_per_cell,
        "chromatids_per_cell": chromatids,
        "dna_content_c": dna_c,
        "genetic_outcome": genetic_outcome,
    }
    formatted = [
        {"key": "mode_name", "label": "Division Process", "value": mode_name, "unit": ""},
        {"key": "stage_name", "label": "Current Stage", "value": stage_names[stage], "unit": ""},
        {"key": "chromosomes_per_cell", "label": "Chromosomes / Cell", "value": chrom_per_cell, "unit": ""},
        {"key": "chromatids_per_cell", "label": "Chromatids / Cell", "value": chromatids, "unit": ""},
        {"key": "dna_content_c", "label": "Relative DNA Content", "value": f"{dna_c}C", "unit": ""},
        {"key": "daughter_cells", "label": "Cell Count", "value": daughters, "unit": "cells"},
    ]
    return {
        "parameters": {"diploid_number": float(diploid_2n), "division_mode": float(mode), "stage": float(stage)},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": mode_name.lower().split()[0],
        "assumptions": [
            "Standard eukaryotic somatic mitosis vs gametogenic meiosis (crossing-over occurs in Prophase I).",
            "Simplified ploidy model assuming error-free chromosome disjunction.",
        ],
        "conclusion_summary": (
            f"In {mode_name} ({stage_names[stage]}) for 2n = {diploid_2n}, each cell has {chrom_per_cell} chromosomes and {dna_c}C DNA content; "
            f"end result: {genetic_outcome}."
        ),
    }


def simulate_dna_structure_replication(params: dict[str, Any]) -> dict[str, Any]:
    """Chargaff's Base-Pairing Rules, Double Helix Geometry & Replication Timing."""
    adenine_pct = require_float(params, "adenine_pct", 28.0)
    length_bp = require_int(params, "length_bp", 1050)
    polymerase_rate = require_float(params, "replication_rate", 50.0)  # bp/s (eukaryotic ~50, bacterial ~1000)

    check_bounds(adenine_pct, 1.0, 49.0, "Adenine percentage (A%)", "%")
    check_bounds(length_bp, 10, 100000, "DNA length", "bp")
    check_bounds(polymerase_rate, 10.0, 1500.0, "Polymerase speed", "bp/s")

    thymine_pct = adenine_pct
    guanine_pct = 50.0 - adenine_pct
    cytosine_pct = guanine_pct
    gc_pct = guanine_pct + cytosine_pct

    at_pairs = int(round(length_bp * (adenine_pct + thymine_pct) / 100.0))
    gc_pairs = length_bp - at_pairs
    h_bonds = 2 * at_pairs + 3 * gc_pairs
    helix_turns = length_bp / 10.5
    helix_length_nm = length_bp * 0.34
    replication_time_s = length_bp / polymerase_rate

    series_data = [
        {"base_index": 1.0, "percentage": round(adenine_pct, 2)},
        {"base_index": 2.0, "percentage": round(thymine_pct, 2)},
        {"base_index": 3.0, "percentage": round(guanine_pct, 2)},
        {"base_index": 4.0, "percentage": round(cytosine_pct, 2)},
    ]

    measurements = {
        "adenine_pct": round(adenine_pct, 2),
        "thymine_pct": round(thymine_pct, 2),
        "guanine_pct": round(guanine_pct, 2),
        "cytosine_pct": round(cytosine_pct, 2),
        "gc_content_pct": round(gc_pct, 2),
        "hydrogen_bonds": h_bonds,
        "helix_turns": round(helix_turns, 2),
        "helix_length_nm": round(helix_length_nm, 2),
        "replication_time_s": round(replication_time_s, 2),
    }
    formatted = [
        {"key": "adenine_pct", "label": "Chargaff Composition (A/T/G/C)", "value": f"{measurements['adenine_pct']}% / {measurements['thymine_pct']}% / {measurements['guanine_pct']}% / {measurements['cytosine_pct']}%", "unit": ""},
        {"key": "gc_content_pct", "label": "GC Content (Thermal Stability)", "value": measurements["gc_content_pct"], "unit": "%"},
        {"key": "hydrogen_bonds", "label": "Total Hydrogen Bonds", "value": h_bonds, "unit": "H-bonds"},
        {"key": "helix_turns", "label": "B-DNA Helical Turns", "value": measurements["helix_turns"], "unit": "turns"},
        {"key": "helix_length_nm", "label": "Contour Length", "value": measurements["helix_length_nm"], "unit": "nm"},
        {"key": "replication_time_s", "label": "Single-Fork Replication Time", "value": measurements["replication_time_s"], "unit": "s"},
    ]
    return {
        "parameters": {"adenine_pct": adenine_pct, "length_bp": float(length_bp), "replication_rate": polymerase_rate},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": None,
        "assumptions": [
            "Double-stranded B-form DNA (10.5 bp/turn, 0.34 nm rise per base pair).",
            "A=T pairs have 2 hydrogen bonds; G≡C pairs have 3 hydrogen bonds.",
        ],
        "conclusion_summary": (
            f"By Chargaff's rules (A=T={adenine_pct}%, G=C={guanine_pct}%), this {length_bp} bp duplex contains "
            f"{h_bonds} hydrogen bonds, spans {measurements['helix_length_nm']} nm ({measurements['helix_turns']} turns), and replicates in {measurements['replication_time_s']} s."
        ),
    }


def simulate_human_circulatory_system(params: dict[str, Any]) -> dict[str, Any]:
    """Cardiac Output (CO = HR * SV) and Mean Arterial Pressure (MAP)."""
    hr = require_float(params, "heart_rate", 72.0)  # bpm
    sv = require_float(params, "stroke_volume", 70.0)  # mL/beat
    sbp = require_float(params, "systolic_bp", 120.0)  # mmHg
    dbp = require_float(params, "diastolic_bp", 80.0)  # mmHg

    check_bounds(hr, 35.0, 210.0, "Heart rate", "bpm")
    check_bounds(sv, 30.0, 150.0, "Stroke volume", "mL")
    check_bounds(sbp, 70.0, 220.0, "Systolic BP", "mmHg")
    check_bounds(dbp, 40.0, 140.0, "Diastolic BP", "mmHg")
    if sbp <= dbp:
        raise SimulationValidationError("Systolic blood pressure must be strictly greater than diastolic blood pressure.")

    co_l_min = (hr * sv) / 1000.0
    pulse_pressure = sbp - dbp
    map_mmhg = dbp + (pulse_pressure / 3.0)
    cardiac_cycle_s = 60.0 / hr
    daily_volume_l = co_l_min * 60.0 * 24.0

    # Arterial pressure waveform over 2 cardiac cycles
    series_data = []
    for i in range(25):
        phase = (i % 12) / 12.0
        # Simplified arterial systolic peak + dicrotic notch + diastolic runoff
        if phase < 0.25:
            p_wave = dbp + pulse_pressure * math.sin((phase / 0.25) * (math.pi / 2.0))
        elif phase < 0.4:
            p_wave = sbp - 0.35 * pulse_pressure * ((phase - 0.25) / 0.15)
        else:
            p_wave = dbp + 0.65 * pulse_pressure * math.exp(-3.0 * (phase - 0.4))
        series_data.append({"time_s": round(i * cardiac_cycle_s / 12.0, 3), "pressure_mmHg": round(p_wave, 1)})

    measurements = {
        "cardiac_output_l_min": round(co_l_min, 3),
        "map_mmhg": round(map_mmhg, 2),
        "pulse_pressure_mmhg": round(pulse_pressure, 1),
        "cardiac_cycle_s": round(cardiac_cycle_s, 3),
        "daily_blood_pumped_l": round(daily_volume_l, 0),
    }
    formatted = [
        {"key": "cardiac_output_l_min", "label": "Cardiac Output (CO = HR×SV)", "value": measurements["cardiac_output_l_min"], "unit": "L/min"},
        {"key": "map_mmhg", "label": "Mean Arterial Pressure (MAP)", "value": measurements["map_mmhg"], "unit": "mmHg"},
        {"key": "pulse_pressure_mmhg", "label": "Pulse Pressure (SBP − DBP)", "value": measurements["pulse_pressure_mmhg"], "unit": "mmHg"},
        {"key": "cardiac_cycle_s", "label": "Cardiac Cycle Duration", "value": measurements["cardiac_cycle_s"], "unit": "s"},
        {"key": "daily_blood_pumped_l", "label": "Blood Pumped per Day", "value": measurements["daily_blood_pumped_l"], "unit": "L/day"},
    ]
    return {
        "parameters": {"heart_rate": hr, "stroke_volume": sv, "systolic_bp": sbp, "diastolic_bp": dbp},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": None,
        "assumptions": [
            "Educational hemodynamic model (not a medical diagnostic tool).",
            "MAP approximated at resting heart rates by DBP + 1/3(SBP − DBP).",
        ],
        "conclusion_summary": (
            f"At HR = {hr} bpm and SV = {sv} mL, cardiac output is {measurements['cardiac_output_l_min']} L/min "
            f"with MAP = {measurements['map_mmhg']} mmHg and pulse pressure {measurements['pulse_pressure_mmhg']} mmHg."
        ),
    }


def simulate_food_chain_ecosystem(params: dict[str, Any]) -> dict[str, Any]:
    """Lindeman's Trophic Energy Pyramid (10% Rule generalized to efficiency η)."""
    producer_energy = require_float(params, "producer_energy", 10000.0)  # kcal/m^2/yr
    efficiency_pct = require_float(params, "transfer_efficiency", 10.0)  # %

    check_bounds(producer_energy, 100.0, 1000000.0, "Producer energy", "kcal/m²/yr")
    check_bounds(efficiency_pct, 2.0, 30.0, "Trophic transfer efficiency", "%")

    eta = efficiency_pct / 100.0
    e_p = producer_energy
    e_c1 = e_p * eta
    e_c2 = e_c1 * eta
    e_c3 = e_c2 * eta
    heat_lost_pct = 100.0 - efficiency_pct

    series_data = [
        {"trophic_level": 1.0, "energy_kcal": round(e_p, 2)},
        {"trophic_level": 2.0, "energy_kcal": round(e_c1, 2)},
        {"trophic_level": 3.0, "energy_kcal": round(e_c2, 2)},
        {"trophic_level": 4.0, "energy_kcal": round(e_c3, 2)},
    ]

    measurements = {
        "producers_kcal": round(e_p, 2),
        "primary_consumers_kcal": round(e_c1, 2),
        "secondary_consumers_kcal": round(e_c2, 2),
        "tertiary_consumers_kcal": round(e_c3, 3),
        "heat_loss_per_step_pct": round(heat_lost_pct, 1),
    }
    formatted = [
        {"key": "producers_kcal", "label": "Level 1: Producers", "value": measurements["producers_kcal"], "unit": "kcal"},
        {"key": "primary_consumers_kcal", "label": "Level 2: Primary Consumers", "value": measurements["primary_consumers_kcal"], "unit": "kcal"},
        {"key": "secondary_consumers_kcal", "label": "Level 3: Secondary Consumers", "value": measurements["secondary_consumers_kcal"], "unit": "kcal"},
        {"key": "tertiary_consumers_kcal", "label": "Level 4: Apex Predators", "value": measurements["tertiary_consumers_kcal"], "unit": "kcal"},
        {"key": "heat_loss_per_step_pct", "label": "Metabolic Heat Loss / Step", "value": measurements["heat_loss_per_step_pct"], "unit": "%"},
    ]
    return {
        "parameters": {"producer_energy": producer_energy, "transfer_efficiency": efficiency_pct},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": None,
        "assumptions": [
            "Simplified 4-level linear food chain without omnivory or detrital loops.",
            "Energy lost at each transfer exits primarily as cellular respiration heat (Second Law of Thermodynamics).",
        ],
        "conclusion_summary": (
            f"Starting from {measurements['producers_kcal']} kcal at {efficiency_pct}% efficiency, only {measurements['tertiary_consumers_kcal']} kcal "
            f"reaches Level 4 apex predators, explaining why food chains rarely exceed 4–5 trophic levels."
        ),
    }


def simulate_mendelian_genetics(params: dict[str, Any]) -> dict[str, Any]:
    """Exact Monohybrid Punnett Square (0=AA, 1=Aa, 2=aa)."""
    p1 = require_int(params, "parent_1", 1)
    p2 = require_int(params, "parent_2", 1)
    offspring_n = require_int(params, "offspring_count", 100)

    if p1 not in (0, 1, 2) or p2 not in (0, 1, 2):
        raise SimulationValidationError("Parent genotypes must be 0 (AA), 1 (Aa), or 2 (aa).")
    check_bounds(offspring_n, 4, 10000, "Offspring sample size")

    alleles_map = {0: ("A", "A"), 1: ("A", "a"), 2: ("a", "a")}
    g1 = alleles_map[p1]
    g2 = alleles_map[p2]

    counts = {"AA": 0, "Aa": 0, "aa": 0}
    grid = []
    for a1 in g1:
        for a2 in g2:
            geno = "AA" if (a1 == "A" and a2 == "A") else ("aa" if (a1 == "a" and a2 == "a") else "Aa")
            counts[geno] += 1
            grid.append(geno)

    p_aa = counts["AA"] / 4.0
    p_het = counts["Aa"] / 4.0
    p_rec = counts["aa"] / 4.0
    p_dom_pheno = p_aa + p_het

    series_data = [
        {"genotype_idx": 1.0, "expected_count": round(p_aa * offspring_n, 1), "probability_pct": round(p_aa * 100.0, 1)},
        {"genotype_idx": 2.0, "expected_count": round(p_het * offspring_n, 1), "probability_pct": round(p_het * 100.0, 1)},
        {"genotype_idx": 3.0, "expected_count": round(p_rec * offspring_n, 1), "probability_pct": round(p_rec * 100.0, 1)},
    ]

    labels = {0: "AA", 1: "Aa", 2: "aa"}
    measurements = {
        "cross": f"{labels[p1]} × {labels[p2]}",
        "punnett_grid": grid,
        "prob_AA_pct": round(p_aa * 100.0, 1),
        "prob_Aa_pct": round(p_het * 100.0, 1),
        "prob_aa_pct": round(p_rec * 100.0, 1),
        "dominant_phenotype_pct": round(p_dom_pheno * 100.0, 1),
        "recessive_phenotype_pct": round(p_rec * 100.0, 1),
        "expected_dominant": round(p_dom_pheno * offspring_n, 1),
        "expected_recessive": round(p_rec * offspring_n, 1),
    }
    formatted = [
        {"key": "cross", "label": "Parental Cross", "value": measurements["cross"], "unit": ""},
        {"key": "prob_AA_pct", "label": "Genotype Ratio (AA:Aa:aa)", "value": f"{counts['AA']}:{counts['Aa']}:{counts['aa']}", "unit": ""},
        {"key": "dominant_phenotype_pct", "label": "Dominant Phenotype", "value": measurements["dominant_phenotype_pct"], "unit": "%"},
        {"key": "recessive_phenotype_pct", "label": "Recessive Phenotype", "value": measurements["recessive_phenotype_pct"], "unit": "%"},
        {"key": "expected_dominant", "label": f"Expected (N={offspring_n})", "value": f"{measurements['expected_dominant']} Dom / {measurements['expected_recessive']} Rec", "unit": ""},
    ]
    return {
        "parameters": {"parent_1": float(p1), "parent_2": float(p2), "offspring_count": float(offspring_n)},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": None,
        "assumptions": [
            "Complete autosomal dominance (A dominant over a) following Mendel's Law of Segregation.",
            "Equal gamete viability and random fertilization without linkage or epistasis.",
        ],
        "conclusion_summary": (
            f"Crossing {measurements['cross']} yields genotype ratio {counts['AA']} AA : {counts['Aa']} Aa : {counts['aa']} aa "
            f"({measurements['dominant_phenotype_pct']}% dominant vs {measurements['recessive_phenotype_pct']}% recessive phenotype)."
        ),
    }


def simulate_natural_selection_evolution(params: dict[str, Any]) -> dict[str, Any]:
    """Deterministic Diploid Selection Model over G generations."""
    p0 = require_float(params, "initial_p", 0.2)
    w_aa_dom = require_float(params, "fitness_AA", 1.0)
    w_het = require_float(params, "fitness_Aa", 0.9)
    w_rec = require_float(params, "fitness_aa", 0.6)
    generations = require_int(params, "generations", 30)

    check_bounds(p0, 0.01, 0.99, "Initial allele frequency (p₀)")
    check_bounds(w_aa_dom, 0.0, 1.0, "Fitness w_AA")
    check_bounds(w_het, 0.0, 1.0, "Fitness w_Aa")
    check_bounds(w_rec, 0.0, 1.0, "Fitness w_aa")
    check_bounds(generations, 5, 100, "Generations")
    if w_aa_dom == 0.0 and w_het == 0.0 and w_rec == 0.0:
        raise SimulationValidationError("At least one genotype must have positive fitness.")

    p = p0
    series_data = [{"generation": 0.0, "p_dominant": round(p, 4), "q_recessive": round(1.0 - p, 4)}]
    w_bar = 1.0
    for gen in range(1, generations + 1):
        q = 1.0 - p
        w_bar = (p * p * w_aa_dom) + (2.0 * p * q * w_het) + (q * q * w_rec)
        if w_bar <= 1e-12:
            break
        p = ((p * p * w_aa_dom) + (p * q * w_het)) / w_bar
        if gen % max(1, generations // 20) == 0 or gen == generations:
            series_data.append({"generation": float(gen), "p_dominant": round(p, 4), "q_recessive": round(1.0 - p, 4)})

    regime = (
        "Heterozygote Advantage (Balancing Selection)"
        if (w_het > w_aa_dom and w_het > w_rec)
        else ("Directional Selection for A" if p > p0 + 1e-3 else ("Directional Selection for a" if p < p0 - 1e-3 else "Neutral / Equilibrium"))
    )

    measurements = {
        "initial_p": round(p0, 4),
        "final_p": round(p, 4),
        "final_q": round(1.0 - p, 4),
        "delta_p": round(p - p0, 4),
        "mean_fitness": round(w_bar, 4),
        "selection_regime": regime,
    }
    formatted = [
        {"key": "final_p", "label": f"Final Allele Freq p (Gen {generations})", "value": measurements["final_p"], "unit": ""},
        {"key": "final_q", "label": "Final Allele Freq q", "value": measurements["final_q"], "unit": ""},
        {"key": "delta_p", "label": "Net Allele Shift (Δp)", "value": measurements["delta_p"], "unit": ""},
        {"key": "mean_fitness", "label": "Population Mean Fitness (w̄)", "value": measurements["mean_fitness"], "unit": ""},
        {"key": "selection_regime", "label": "Selection Regime", "value": regime, "unit": ""},
    ]
    return {
        "parameters": {"initial_p": p0, "fitness_AA": w_aa_dom, "fitness_Aa": w_het, "fitness_aa": w_rec, "generations": float(generations)},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": None,
        "assumptions": [
            "Infinite population (no genetic drift), random mating, discrete non-overlapping generations.",
            "Constant relative viabilities w_AA, w_Aa, w_aa with no migration or mutation.",
        ],
        "conclusion_summary": (
            f"Over {generations} generations under {regime}, dominant allele frequency p shifted from {p0} to {measurements['final_p']} (Δp = {measurements['delta_p']})."
        ),
    }


def simulate_cellular_respiration(params: dict[str, Any]) -> dict[str, Any]:
    """Biochemical ATP accounting for Aerobic vs Anaerobic Glucose Metabolism."""
    glucose_mol = require_float(params, "glucose_moles", 1.0)
    oxygen_pct = require_float(params, "oxygen_availability", 100.0)  # % aerobic fraction

    check_bounds(glucose_mol, 0.1, 20.0, "Glucose input", "mol")
    check_bounds(oxygen_pct, 0.0, 100.0, "Oxygen availability", "%")

    aerobic_frac = oxygen_pct / 100.0
    anaerobic_frac = 1.0 - aerobic_frac

    glycolysis_atp = 2.0 * glucose_mol
    krebs_atp = 2.0 * glucose_mol * aerobic_frac
    oxphos_atp = 28.0 * glucose_mol * aerobic_frac
    total_atp = glycolysis_atp + krebs_atp + oxphos_atp
    o2_consumed = 6.0 * glucose_mol * aerobic_frac
    co2_released = 6.0 * glucose_mol * aerobic_frac
    lactate_produced = 2.0 * glucose_mol * anaerobic_frac
    # Energy capture: ~30.5 kJ/mol ATP vs 2870 kJ/mol glucose
    efficiency_pct = ((total_atp * 30.5) / (glucose_mol * 2870.0)) * 100.0

    series_data = [
        {"stage": 1.0, "atp_yield": round(glycolysis_atp, 2)},
        {"stage": 2.0, "atp_yield": round(krebs_atp, 2)},
        {"stage": 3.0, "atp_yield": round(oxphos_atp, 2)},
    ]
    pathway = "Fully Aerobic Respiration" if oxygen_pct >= 99.0 else ("Anaerobic Fermentation" if oxygen_pct <= 1.0 else "Mixed Aerobic / Anaerobic")

    measurements = {
        "pathway": pathway,
        "total_atp_mol": round(total_atp, 2),
        "glycolysis_atp": round(glycolysis_atp, 2),
        "krebs_atp": round(krebs_atp, 2),
        "oxphos_atp": round(oxphos_atp, 2),
        "o2_consumed_mol": round(o2_consumed, 2),
        "co2_released_mol": round(co2_released, 2),
        "lactate_mol": round(lactate_produced, 2),
        "energy_efficiency_pct": round(efficiency_pct, 1),
    }
    formatted = [
        {"key": "pathway", "label": "Metabolic Mode", "value": pathway, "unit": ""},
        {"key": "total_atp_mol", "label": "Total Net ATP Yield", "value": measurements["total_atp_mol"], "unit": "mol ATP"},
        {"key": "oxphos_atp", "label": "Oxidative Phosphorylation ATP", "value": measurements["oxphos_atp"], "unit": "mol ATP"},
        {"key": "o2_consumed_mol", "label": "O₂ Consumed / CO₂ Released", "value": f"{measurements['o2_consumed_mol']} / {measurements['co2_released_mol']}", "unit": "mol"},
        {"key": "energy_efficiency_pct", "label": "Free-Energy Capture Efficiency", "value": measurements["energy_efficiency_pct"], "unit": "%"},
    ]
    return {
        "parameters": {"glucose_moles": glucose_mol, "oxygen_availability": oxygen_pct},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": "anaerobic" if oxygen_pct <= 1.0 else "aerobic",
        "assumptions": [
            "Modern eukaryotic ATP accounting (~32 ATP per glucose aerobically: 2 Glycolysis + 2 Citric Acid Cycle + ~28 Oxidative Phosphorylation).",
            "Anaerobic pathway modeled as lactic acid fermentation (2 net ATP + 2 lactate per glucose).",
        ],
        "conclusion_summary": (
            f"Metabolizing {glucose_mol} mol glucose at {oxygen_pct}% O₂ availability ({pathway}) yields "
            f"{measurements['total_atp_mol']} mol ATP ({measurements['energy_efficiency_pct']}% energy capture efficiency)."
        ),
    }


def simulate_population_genetics(params: dict[str, Any]) -> dict[str, Any]:
    """Hardy-Weinberg Equilibrium: p + q = 1, p^2 + 2pq + q^2 = 1."""
    p = require_float(params, "allele_p", 0.6)
    pop_size = require_int(params, "population_size", 1000)

    check_bounds(p, 0.0, 1.0, "Dominant allele frequency (p)")
    check_bounds(pop_size, 10, 1000000, "Population size (N)")

    q = 1.0 - p
    f_aa = p * p
    f_het = 2.0 * p * q
    f_rec = q * q

    series_data = [
        {"p": round(x / 10.0, 1), "p2_AA": round((x / 10.0) ** 2, 3), "2pq_Aa": round(2.0 * (x / 10.0) * (1.0 - x / 10.0), 3), "q2_aa": round((1.0 - x / 10.0) ** 2, 3)}
        for x in range(11)
    ]

    measurements = {
        "p": round(p, 4),
        "q": round(q, 4),
        "freq_AA": round(f_aa, 4),
        "freq_Aa": round(f_het, 4),
        "freq_aa": round(f_rec, 4),
        "count_AA": round(f_aa * pop_size, 1),
        "count_Aa": round(f_het * pop_size, 1),
        "count_aa": round(f_rec * pop_size, 1),
    }
    formatted = [
        {"key": "p", "label": "Allele Frequencies (p / q)", "value": f"{measurements['p']} / {measurements['q']}", "unit": ""},
        {"key": "freq_AA", "label": "Homozygous Dominant (p²)", "value": f"{measurements['freq_AA']} ({measurements['count_AA']})", "unit": ""},
        {"key": "freq_Aa", "label": "Heterozygotes (2pq)", "value": f"{measurements['freq_Aa']} ({measurements['count_Aa']})", "unit": ""},
        {"key": "freq_aa", "label": "Homozygous Recessive (q²)", "value": f"{measurements['freq_aa']} ({measurements['count_aa']})", "unit": ""},
    ]
    return {
        "parameters": {"allele_p": p, "population_size": float(pop_size)},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": "max_heterozygosity" if abs(p - 0.5) < 0.01 else None,
        "assumptions": [
            "Five Hardy-Weinberg conditions: large population, random mating, no selection, no mutation, no gene flow.",
            "Genotype frequencies sum strictly to 1 (p² + 2pq + q² = 1).",
        ],
        "conclusion_summary": (
            f"At p = {measurements['p']} and q = {measurements['q']} in N = {pop_size}, Hardy-Weinberg predicts "
            f"{measurements['count_AA']} AA (p²={measurements['freq_AA']}), {measurements['count_Aa']} Aa (2pq={measurements['freq_Aa']}), and {measurements['count_aa']} aa (q²={measurements['freq_aa']})."
        ),
    }


RESPIRATORY_ORGANS = [
    {"name": "Nose & Nasal Cavity", "role": "Filters dust with hairs and mucus, warms, and humidifies inhaled air before it enters the airways."},
    {"name": "Mouth (Oral Cavity)", "role": "Secondary airway for breathing during speaking or heavy exercise when higher airflow is needed."},
    {"name": "Pharynx (Throat)", "role": "Shared muscular passage guiding air from the nasal/oral cavities toward the larynx."},
    {"name": "Larynx (Voice Box)", "role": "Protects the airway with the epiglottis during swallowing and houses vocal cords for speech."},
    {"name": "Trachea (Windpipe)", "role": "C-shaped cartilage-ringed tube that stays open and carries air down to the chest."},
    {"name": "Right & Left Bronchi", "role": "Two primary airway branches splitting from the trachea into the right and left lungs."},
    {"name": "Bronchioles", "role": "Fine branching air passages inside the lungs that regulate airflow into alveolar sacs."},
    {"name": "Right & Left Lungs", "role": "Spongy, elastic organs in the thoracic cavity that expand during inhalation and recoil during exhalation."},
    {"name": "Alveoli", "role": "Millions of tiny thin-walled air sacs surrounded by capillaries where O₂ diffuses into blood and CO₂ diffuses out."},
    {"name": "Diaphragm", "role": "Dome-shaped skeletal muscle below the lungs; contracts and flattens downward to draw air in, relaxes upward to push air out."},
]

NERVOUS_STRUCTURES = [
    {"name": "Brain", "role": "Central command organ processing conscious thought, memory, sensory perception, and voluntary motor commands."},
    {"name": "Spinal Cord", "role": "Main neural highway inside the vertebral column; integrates rapid spinal reflex arcs without waiting for the brain."},
    {"name": "Peripheral Nerves", "role": "Bundles of sensory and motor axons linking the central nervous system to limbs, skin, and organs."},
    {"name": "Sensory Neuron (Afferent)", "role": "Detects stimuli (heat, pressure, stretch) via receptors and transmits electrical impulses toward the spinal cord."},
    {"name": "Motor Neuron (Efferent)", "role": "Carries command impulses from the spinal cord or brain to muscles and glands to produce a physical response."},
]


def simulate_human_respiratory_system(params: dict[str, Any]) -> dict[str, Any]:
    """Human Respiratory System ventilation, alveolar gas exchange & age-context model."""
    breathing_rate = require_float(params, "breathing_rate", 16.0)
    tidal_volume = require_float(params, "tidal_volume", 500.0)
    age_group = require_int(params, "age_group", 1)  # 0=Child(6-12), 1=Teen(13-17), 2=Adult(18+)
    organ_idx = require_int(params, "organ_index", 8)

    check_bounds(breathing_rate, 6.0, 45.0, "Breathing rate", "breaths/min")
    check_bounds(tidal_volume, 200.0, 1200.0, "Tidal volume", "mL")
    check_bounds(age_group, 0, 2, "Age group index")
    check_bounds(organ_idx, 0, len(RESPIRATORY_ORGANS) - 1, "Organ index")

    organ = RESPIRATORY_ORGANS[organ_idx]
    dead_space_ml = 100.0 if age_group == 0 else 150.0
    minute_ventilation = (breathing_rate * tidal_volume) / 1000.0
    alveolar_ventilation = max(0.0, (breathing_rate * max(0.0, tidal_volume - dead_space_ml)) / 1000.0)
    breath_cycle_s = 60.0 / breathing_rate
    o2_uptake_ml_min = alveolar_ventilation * 1000.0 * 0.048  # ~4.8% net O2 extraction from alveolar air
    co2_output_ml_min = o2_uptake_ml_min * 0.82  # Respiratory Quotient ~0.82

    age_ranges = {
        0: ("Child (6–12 yrs)", 18.0, 30.0),
        1: ("Teen (13–17 yrs)", 12.0, 20.0),
        2: ("Adult (18+ yrs)", 12.0, 20.0),
    }
    age_label, low_norm, high_norm = age_ranges[age_group]
    if breathing_rate < low_norm:
        rate_status = f"Below typical resting range ({int(low_norm)}–{int(high_norm)} bpm for {age_label})"
    elif breathing_rate > high_norm:
        rate_status = f"Elevated above resting range ({int(low_norm)}–{int(high_norm)} bpm for {age_label})"
    else:
        rate_status = f"Normal resting rate ({int(low_norm)}–{int(high_norm)} bpm for {age_label})"

    series_data = []
    for i in range(25):
        t_pt = (i * breath_cycle_s * 2.0) / 24.0
        phase = (t_pt % breath_cycle_s) / breath_cycle_s
        # Sinusoidal lung volume wave above FRC (~2400 mL)
        vol_ml = 2400.0 + tidal_volume * 0.5 * (1.0 - math.cos(2.0 * math.pi * phase))
        series_data.append({"time_s": round(t_pt, 2), "lung_volume_ml": round(vol_ml, 1)})

    measurements = {
        "organ_name": organ["name"],
        "organ_role": organ["role"],
        "minute_ventilation_l_min": round(minute_ventilation, 2),
        "alveolar_ventilation_l_min": round(alveolar_ventilation, 2),
        "breath_cycle_s": round(breath_cycle_s, 2),
        "o2_uptake_ml_min": round(o2_uptake_ml_min, 1),
        "co2_output_ml_min": round(co2_output_ml_min, 1),
        "age_context": age_label,
        "rate_status": rate_status,
        "organ_index": organ_idx,
    }
    formatted = [
        {"key": "organ_name", "label": "Selected Structure", "value": organ["name"], "unit": ""},
        {"key": "minute_ventilation_l_min", "label": "Minute Ventilation (V̇E)", "value": measurements["minute_ventilation_l_min"], "unit": "L/min"},
        {"key": "alveolar_ventilation_l_min", "label": "Alveolar Ventilation (V̇A)", "value": measurements["alveolar_ventilation_l_min"], "unit": "L/min"},
        {"key": "breath_cycle_s", "label": "Breath Cycle Duration", "value": measurements["breath_cycle_s"], "unit": "s"},
        {"key": "o2_uptake_ml_min", "label": "Estimated O₂ Uptake", "value": measurements["o2_uptake_ml_min"], "unit": "mL/min"},
        {"key": "rate_status", "label": "Age Rate Context", "value": rate_status, "unit": ""},
    ]
    return {
        "parameters": {
            "breathing_rate": breathing_rate,
            "tidal_volume": tidal_volume,
            "age_group": float(age_group),
            "organ_index": float(organ_idx),
        },
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": "elevated_breathing" if breathing_rate > high_norm else "normal_breathing",
        "assumptions": [
            f"Anatomical dead space approximated as {int(dead_space_ml)} mL for {age_label}.",
            "Steady sinusoidal tidal breathing at sea-level atmospheric pressure (21% O₂).",
        ],
        "conclusion_summary": (
            f"At {breathing_rate} breaths/min and {tidal_volume} mL tidal volume, minute ventilation is "
            f"{measurements['minute_ventilation_l_min']} L/min and alveolar ventilation is {measurements['alveolar_ventilation_l_min']} L/min. "
            f"Selected structure: {organ['name']} — {organ['role']}"
        ),
    }


def simulate_human_nervous_system(params: dict[str, Any]) -> dict[str, Any]:
    """Human Nervous System action potential threshold & spinal reflex arc latency model."""
    stimulus_intensity = require_float(params, "stimulus_intensity", 70.0)
    myelination = require_int(params, "myelination", 1)  # 0=Unmyelinated (2 m/s), 1=Myelinated (80 m/s)
    pathway_length_cm = require_float(params, "pathway_length_cm", 100.0)
    structure_idx = require_int(params, "structure_index", 1)

    check_bounds(stimulus_intensity, 0.0, 100.0, "Stimulus intensity")
    check_bounds(myelination, 0, 1, "Myelination mode")
    check_bounds(pathway_length_cm, 30.0, 180.0, "Pathway length", "cm")
    check_bounds(structure_idx, 0, len(NERVOUS_STRUCTURES) - 1, "Structure index")

    structure = NERVOUS_STRUCTURES[structure_idx]
    threshold = 30.0
    fired = stimulus_intensity >= threshold
    conduction_velocity_ms = 80.0 if myelination == 1 else 2.0
    length_m = pathway_length_cm / 100.0
    # Reflex arc: sensory afferent + spinal interneuron synapse (2 ms) + motor efferent
    synaptic_delay_ms = 2.0
    reflex_time_ms = ((2.0 * length_m) / conduction_velocity_ms) * 1000.0 + synaptic_delay_ms if fired else 0.0
    voluntary_time_ms = reflex_time_ms + 165.0 if fired else 0.0  # cortical processing adds ~165 ms

    series_data = [
        {"time_ms": 0.0, "membrane_mv": -70.0},
        {"time_ms": 0.5, "membrane_mv": -70.0 + (15.0 if fired else stimulus_intensity * 0.4)},
        {"time_ms": 1.0, "membrane_mv": 35.0 if fired else -70.0 + stimulus_intensity * 0.45},
        {"time_ms": 1.8, "membrane_mv": -55.0 if fired else -70.0 + stimulus_intensity * 0.2},
        {"time_ms": 2.6, "membrane_mv": -80.0 if fired else -70.0},
        {"time_ms": 4.0, "membrane_mv": -70.0},
    ]

    measurements = {
        "structure_name": structure["name"],
        "structure_role": structure["role"],
        "action_potential_fired": fired,
        "axon_type": "Myelinated (Saltatory)" if myelination == 1 else "Unmyelinated (Continuous)",
        "conduction_velocity_ms": conduction_velocity_ms,
        "reflex_latency_ms": round(reflex_time_ms, 2),
        "voluntary_reaction_ms": round(voluntary_time_ms, 1),
        "structure_index": structure_idx,
    }
    formatted = [
        {"key": "structure_name", "label": "Selected Structure", "value": structure["name"], "unit": ""},
        {"key": "action_potential_fired", "label": "Action Potential", "value": "Fired (+35 mV)" if fired else "Below Threshold (<30)", "unit": ""},
        {"key": "conduction_velocity_ms", "label": "Conduction Speed", "value": conduction_velocity_ms, "unit": "m/s"},
        {"key": "reflex_latency_ms", "label": "Spinal Reflex Time", "value": measurements["reflex_latency_ms"], "unit": "ms"},
        {"key": "voluntary_reaction_ms", "label": "Voluntary Reaction", "value": measurements["voluntary_reaction_ms"], "unit": "ms"},
    ]
    return {
        "parameters": {
            "stimulus_intensity": stimulus_intensity,
            "myelination": float(myelination),
            "pathway_length_cm": pathway_length_cm,
            "structure_index": float(structure_idx),
        },
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": "reflex_fired" if fired else "subthreshold",
        "assumptions": [
            "All-or-nothing action potential threshold set at intensity ≥ 30 (membrane depolarization from −70 mV to −55 mV).",
            "Spinal reflex arc includes 2.0 ms synaptic integration delay; voluntary response adds ~165 ms cortical processing.",
        ],
        "conclusion_summary": (
            f"{'Action potential fired!' if fired else 'Subthreshold stimulus — no impulse fired.'} "
            f"Along a {pathway_length_cm} cm {measurements['axon_type']} pathway ({conduction_velocity_ms} m/s), "
            f"spinal reflex latency is {measurements['reflex_latency_ms']} ms vs voluntary reaction {measurements['voluntary_reaction_ms']} ms."
        ),
    }


BIOLOGY_SIMULATIONS = {
    "plant-cell-structure": simulate_plant_cell_structure,
    "animal-cell-structure": simulate_animal_cell_structure,
    "human-respiratory-system": simulate_human_respiratory_system,
    "human-digestive-system": simulate_human_digestive_system,
    "photosynthesis": simulate_photosynthesis,
    "mitosis-meiosis": simulate_mitosis_meiosis,
    "dna-structure-replication": simulate_dna_structure_replication,
    "human-circulatory-system": simulate_human_circulatory_system,
    "human-nervous-system": simulate_human_nervous_system,
    "food-chain-ecosystem": simulate_food_chain_ecosystem,
    "mendelian-genetics": simulate_mendelian_genetics,
    "natural-selection-evolution": simulate_natural_selection_evolution,
    "cellular-respiration": simulate_cellular_respiration,
    "population-genetics": simulate_population_genetics,
}
