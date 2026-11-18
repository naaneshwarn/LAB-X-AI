"""Comprehensive scientific & mathematical validation tests for all 48 simulation engines."""

import math
import pytest

from app.services.simulation_engine import (
    SIMULATION_REGISTRY,
    SimulationValidationError,
    run_simulation,
)


def test_all_48_simulations_registered_and_run_with_defaults():
    assert len(SIMULATION_REGISTRY) == 51
    for exp_id in SIMULATION_REGISTRY:
        res = run_simulation(exp_id, {})
        assert "measurements" in res
        assert "formatted_measurements" in res and len(res["formatted_measurements"]) >= 3
        assert "conclusion_summary" in res and len(res["conclusion_summary"]) > 10


class TestPhysicsExpanded:
    def test_reflection_of_light(self):
        r = run_simulation("reflection-of-light", {"incident_angle": 35.0, "mirror_inclination": 90.0})
        m = r["measurements"]
        assert m["reflected_angle"] == pytest.approx(35.0)
        assert m["deviation_angle"] == pytest.approx(110.0)
        assert m["images_between_mirrors"] == 3

    def test_refraction_snell_and_tir(self):
        r = run_simulation("refraction-of-light", {"incident_angle": 30.0, "n1": 1.0, "n2": 1.5})
        assert r["measurements"]["refracted_angle"] == pytest.approx(math.degrees(math.asin(0.5 / 1.5)), rel=1e-2)
        tir = run_simulation("refraction-of-light", {"incident_angle": 60.0, "n1": 1.5, "n2": 1.0})
        assert tir["measurements"]["total_internal_reflection"] is True
        assert tir["special_case"] == "total_internal_reflection"

    def test_series_and_parallel_circuits(self):
        s = run_simulation("series-parallel-circuits", {"voltage": 12.0, "r1": 10.0, "r2": 20.0, "r3": 30.0, "mode": 0})
        assert s["measurements"]["equivalent_resistance"] == pytest.approx(60.0)
        assert s["measurements"]["total_current"] == pytest.approx(0.2)
        p = run_simulation("series-parallel-circuits", {"voltage": 12.0, "r1": 10.0, "r2": 10.0, "r3": 10.0, "mode": 1})
        assert p["measurements"]["equivalent_resistance"] == pytest.approx(10.0 / 3.0, rel=1e-3)

    def test_newtons_laws_equilibrium_and_motion(self):
        eq = run_simulation("newtons-laws", {"mass": 10.0, "applied_force": 5.0, "friction_coeff": 0.5, "time": 2.0})
        assert eq["measurements"]["acceleration"] == 0.0
        assert eq["special_case"] == "static_equilibrium"
        mv = run_simulation("newtons-laws", {"mass": 5.0, "applied_force": 20.0, "friction_coeff": 0.0, "time": 3.0})
        assert mv["measurements"]["acceleration"] == pytest.approx(4.0)
        assert mv["measurements"]["displacement"] == pytest.approx(18.0)

    def test_em_induction_wave_thermo_photoelectric(self):
        em = run_simulation("electromagnetic-induction", {"turns": 100, "magnetic_field": 0.5, "coil_area": 0.1, "frequency": 1.0, "resistance": 10.0})
        assert em["measurements"]["peak_emf"] == pytest.approx(100 * 0.5 * 0.1 * 2 * math.pi, rel=1e-3)

        wi = run_simulation("wave-interference", {"wavelength": 500.0, "slit_separation": 0.5, "slit_width": 0.1, "screen_distance": 2.0})
        assert wi["measurements"]["fringe_width_mm"] == pytest.approx(2.0, rel=1e-3)
        with pytest.raises(SimulationValidationError):
            run_simulation("wave-interference", {"slit_separation": 0.2, "slit_width": 0.3})

        th = run_simulation("thermodynamic-processes", {"moles": 1.0, "initial_temp": 300.0, "initial_volume": 0.01, "final_volume": 0.02, "process_type": 0})
        assert th["measurements"]["delta_u_J"] == pytest.approx(0.0)
        assert th["measurements"]["heat_q_J"] == pytest.approx(th["measurements"]["work_J"], rel=1e-3)

        pe_active = run_simulation("photoelectric-effect", {"wavelength": 250.0, "work_function": 2.0, "intensity": 50.0})
        assert pe_active["measurements"]["emission_occurs"] is True
        assert pe_active["measurements"]["k_max_ev"] == pytest.approx(1239.841984 / 250.0 - 2.0, rel=1e-3)
        pe_off = run_simulation("photoelectric-effect", {"wavelength": 700.0, "work_function": 4.0, "intensity": 100.0})
        assert pe_off["measurements"]["emission_occurs"] is False
        assert pe_off["measurements"]["k_max_ev"] == 0.0


class TestChemistrySimulations:
    def test_atomic_and_periodic(self):
        a = run_simulation("atomic-structure", {"protons": 11, "neutrons": 12, "charge": 1})
        assert a["measurements"]["symbol"] == "Na"
        assert a["measurements"]["mass_number"] == 23
        assert a["measurements"]["electrons"] == 10
        assert a["measurements"]["shells"] == [2, 8]

        p = run_simulation("periodic-table-explorer", {"atomic_number": 9})
        assert p["measurements"]["symbol"] == "F"
        assert p["measurements"]["electronegativity"] == pytest.approx(3.98)

    def test_ph_balancing_stoichiometry_dilution(self):
        acid = run_simulation("acids-bases-ph", {"solution_type": 0, "molarity": 0.01})
        assert acid["measurements"]["ph"] == pytest.approx(2.0, abs=0.02)
        assert acid["measurements"]["poh"] == pytest.approx(12.0, abs=0.02)

        bal = run_simulation("reaction-balancing", {"reaction_id": 1, "coeff_1": 1, "coeff_2": 3, "coeff_3": 2, "coeff_4": 1})
        assert bal["measurements"]["is_balanced"] is True
        unbal = run_simulation("reaction-balancing", {"reaction_id": 1, "coeff_1": 1, "coeff_2": 1, "coeff_3": 1, "coeff_4": 1})
        assert unbal["measurements"]["is_balanced"] is False

        mol = run_simulation("mole-stoichiometry", {"sample_mass": 36.03, "molar_mass": 18.015, "stoich_ratio": 2.0})
        assert mol["measurements"]["moles"] == pytest.approx(2.0, rel=1e-3)
        assert mol["measurements"]["product_moles"] == pytest.approx(4.0, rel=1e-3)

        dil = run_simulation("concentration-dilution", {"initial_molarity": 2.0, "initial_volume": 50.0, "final_volume": 250.0, "solute_molar_mass": 58.44})
        assert dil["measurements"]["final_molarity"] == pytest.approx(0.4, rel=1e-3)
        with pytest.raises(SimulationValidationError):
            run_simulation("concentration-dilution", {"initial_volume": 200.0, "final_volume": 100.0})

    def test_equilibrium_electrochemistry_kinetics_gas(self):
        eq = run_simulation("chemical-equilibrium", {"kc": 4.0, "conc_a": 1.0, "conc_b": 1.0, "conc_c": 0.0})
        m = eq["measurements"]
        # Verify (c_eq)^2 / (a_eq * b_eq) == Kc
        assert (m["c_eq"] ** 2) / (m["a_eq"] * m["b_eq"]) == pytest.approx(4.0, rel=1e-2)

        ec = run_simulation("electrochemical-cells", {"e_cathode": 0.34, "e_anode": -0.76, "electrons": 2, "reaction_quotient": 1.0, "temperature": 298.15})
        assert ec["measurements"]["e_cell_v"] == pytest.approx(1.10, rel=1e-3)
        assert ec["measurements"]["spontaneous"] is True

        kin = run_simulation("reaction-kinetics", {"activation_energy": 50.0, "temperature": 300.0, "initial_conc": 2.0, "pre_exponential": 1e7})
        assert kin["measurements"]["conc_after_one_halflife"] == pytest.approx(1.0)

        gas = run_simulation("gas-laws-thermodynamics", {"moles": 1.0, "volume": 22.414, "temperature": 273.15})
        assert gas["measurements"]["p_ideal_atm"] == pytest.approx(1.0, rel=1e-2)


class TestBiologySimulations:
    def test_cells_photosynthesis_dna_circulation_ecology(self):
        pc = run_simulation("plant-cell-structure", {"organelle_index": 1, "cell_length": 30.0, "water_potential": 1.2})
        assert pc["measurements"]["sa_to_volume_ratio"] == pytest.approx(0.2)

        ph = run_simulation("photosynthesis", {"light_intensity": 600.0, "co2_ppm": 400.0, "temperature": 25.0})
        assert ph["measurements"]["o2_evolution_rate"] == pytest.approx(6.0 * ph["measurements"]["glucose_synthesis_rate"], rel=1e-2)

        dna = run_simulation("dna-structure-replication", {"adenine_pct": 28.0, "length_bp": 100, "replication_rate": 50.0})
        assert dna["measurements"]["guanine_pct"] == pytest.approx(22.0)
        assert dna["measurements"]["helix_length_nm"] == pytest.approx(34.0)

        circ = run_simulation("human-circulatory-system", {"heart_rate": 70.0, "stroke_volume": 80.0, "systolic_bp": 120.0, "diastolic_bp": 75.0})
        assert circ["measurements"]["cardiac_output_l_min"] == pytest.approx(5.6)
        assert circ["measurements"]["map_mmhg"] == pytest.approx(90.0)
        with pytest.raises(SimulationValidationError):
            run_simulation("human-circulatory-system", {"systolic_bp": 70.0, "diastolic_bp": 80.0})

        eco = run_simulation("food-chain-ecosystem", {"producer_energy": 10000.0, "transfer_efficiency": 10.0})
        assert eco["measurements"]["tertiary_consumers_kcal"] == pytest.approx(10.0)

    def test_genetics_evolution_respiration_hardy_weinberg(self):
        mend = run_simulation("mendelian-genetics", {"parent_1": 1, "parent_2": 1, "offspring_count": 200})
        assert mend["measurements"]["dominant_phenotype_pct"] == pytest.approx(75.0)
        assert mend["measurements"]["expected_recessive"] == pytest.approx(50.0)

        resp_aer = run_simulation("cellular-respiration", {"glucose_moles": 1.0, "oxygen_availability": 100.0})
        assert resp_aer["measurements"]["total_atp_mol"] == pytest.approx(32.0)
        resp_ana = run_simulation("cellular-respiration", {"glucose_moles": 1.0, "oxygen_availability": 0.0})
        assert resp_ana["measurements"]["total_atp_mol"] == pytest.approx(2.0)

        hw = run_simulation("population-genetics", {"allele_p": 0.7, "population_size": 1000})
        m = hw["measurements"]
        assert m["freq_AA"] == pytest.approx(0.49)
        assert m["freq_Aa"] == pytest.approx(0.42)
        assert m["freq_aa"] == pytest.approx(0.09)
        assert m["freq_AA"] + m["freq_Aa"] + m["freq_aa"] == pytest.approx(1.0)


class TestMathematicsSimulations:
    def test_basic_math(self):
        ns = run_simulation("number-systems", {"number": 42})
        assert ns["measurements"]["binary"] == "101010"
        assert ns["measurements"]["hexadecimal"] == "2A"

        fr = run_simulation("fractions-decimals", {"num1": 3, "den1": 4, "num2": 2, "den2": 5, "operation": 0})
        assert fr["measurements"]["reduced_fraction"] == "23/20"
        with pytest.raises(SimulationValidationError):
            run_simulation("fractions-decimals", {"num1": 1, "den1": 2, "num2": 0, "den2": 3, "operation": 3})

        geo = run_simulation("basic-geometry", {"side_a": 6.0, "side_b": 8.0, "side_c": 10.0, "circle_radius": 5.0})
        assert geo["measurements"]["triangle_area"] == pytest.approx(24.0)
        assert geo["measurements"]["angle_A_deg"] + geo["measurements"]["angle_B_deg"] + geo["measurements"]["angle_C_deg"] == pytest.approx(180.0, abs=0.1)
        with pytest.raises(SimulationValidationError):
            run_simulation("basic-geometry", {"side_a": 2.0, "side_b": 3.0, "side_c": 10.0, "circle_radius": 4.0})

        alg = run_simulation("algebraic-expressions", {"p": 2.0, "q": 3.0, "x_value": 4.0})
        assert alg["measurements"]["squared_value"] == pytest.approx(121.0)

    def test_intermediate_and_advanced_math(self):
        tr = run_simulation("trigonometric-functions", {"angle_deg": 30.0, "amplitude": 2.0, "frequency": 2.0, "phase_deg": 0.0})
        assert tr["measurements"]["sin_theta"] == pytest.approx(0.5, rel=1e-4)
        assert tr["measurements"]["period_deg"] == pytest.approx(180.0)
        tr90 = run_simulation("trigonometric-functions", {"angle_deg": 90.0})
        assert tr90["measurements"]["tan_theta"] is None

        cg = run_simulation("coordinate-geometry", {"x1": 0.0, "y1": 0.0, "x2": 3.0, "y2": 4.0})
        assert cg["measurements"]["distance"] == pytest.approx(5.0)
        assert cg["measurements"]["slope"] == pytest.approx(4.0 / 3.0, rel=1e-3)

        pr = run_simulation("probability-statistics", {"trials": 10, "prob_success": 0.5, "target_k": 5})
        assert pr["measurements"]["mean"] == pytest.approx(5.0)
        assert pr["measurements"]["p_exact_k"] == pytest.approx(252 / 1024, rel=1e-3)

        qd = run_simulation("quadratic-equations", {"a": 1.0, "b": -5.0, "c": 6.0})
        assert qd["measurements"]["discriminant"] == pytest.approx(1.0)
        assert {qd["measurements"]["root_1"], qd["measurements"]["root_2"]} == {2.0, 3.0}

        dc = run_simulation("differential-calculus", {"a": 1.0, "b": -3.0, "c": 2.0, "d": 1.0, "x0": 2.0})
        assert dc["measurements"]["f_x0"] == pytest.approx(1.0)
        assert dc["measurements"]["f_prime_x0"] == pytest.approx(2.0)
        assert dc["measurements"]["f_double_prime_x0"] == pytest.approx(6.0)

        ic = run_simulation("integral-calculus", {"a": 1.0, "b": 0.0, "c": 1.0, "lower_limit": 0.0, "upper_limit": 3.0, "subintervals": 20})
        assert ic["measurements"]["exact_integral"] == pytest.approx(12.0, rel=1e-4)

        mt = run_simulation("matrices-linear-algebra", {"a11": 3.0, "a12": 1.0, "a21": 2.0, "a22": 4.0})
        assert mt["measurements"]["determinant"] == pytest.approx(10.0)
        assert mt["measurements"]["trace"] == pytest.approx(7.0)
        assert {mt["measurements"]["eigenvalue_1"], mt["measurements"]["eigenvalue_2"]} == {5.0, 2.0}

        v3 = run_simulation("three-dimensional-geometry", {"ux": 3.0, "uy": 0.0, "uz": 0.0, "vx": 0.0, "vy": 4.0, "vz": 0.0})
        assert v3["measurements"]["dot_product"] == pytest.approx(0.0)
        assert v3["measurements"]["angle_deg"] == pytest.approx(90.0)
        assert v3["measurements"]["cross_z"] == pytest.approx(12.0)
