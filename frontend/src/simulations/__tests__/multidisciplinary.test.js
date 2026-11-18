import { describe, expect, it } from 'vitest';
import {
  CHART_CONFIG_BY_EXPERIMENT,
  CLIENT_SIMULATION_REGISTRY,
  runMultidisciplinarySimulation,
} from '../engines';

describe('LabXAI Frontend Multidisciplinary Simulation Registry (All 51 Experiments)', () => {
  const allExperimentIds = Object.keys(CLIENT_SIMULATION_REGISTRY);

  it('registers all 51 multidisciplinary experiments with matching chart configs', () => {
    expect(allExperimentIds).toHaveLength(51);
    for (const id of allExperimentIds) {
      expect(CHART_CONFIG_BY_EXPERIMENT[id]).toBeDefined();
      const res = runMultidisciplinarySimulation(id, {});
      expect(res).toBeDefined();
      expect(res.measurements).toBeTypeOf('object');
      expect(Array.isArray(res.formatted_measurements)).toBe(true);
      expect(res.formatted_measurements.length).toBeGreaterThan(0);
      expect(Array.isArray(res.series_data)).toBe(true);
      expect(res.series_data.length).toBeGreaterThan(0);
      expect(typeof res.conclusion_summary).toBe('string');
      expect(res.conclusion_summary.length).toBeGreaterThan(10);
    }
  });

  it('throws cleanly on unknown experiment IDs', () => {
    expect(() => runMultidisciplinarySimulation('non-existent-lab', {})).toThrow();
  });

  it('verifies deterministic Physics extra calculations (Refraction & Photoelectric)', () => {
    // Snell's Law: n1=1.0, n2=1.5, angle=30 => sin(r) = 0.5/1.5 = 1/3 => r ≈ 19.47°
    const refr = runMultidisciplinarySimulation('refraction-of-light', {
      incident_angle: 30,
      n1: 1.0,
      n2: 1.5,
    });
    expect(refr.measurements.total_internal_reflection).toBe(false);
    expect(refr.measurements.refracted_angle).toBeCloseTo(19.47, 1);

    // Total internal reflection when n1 > n2 and angle > critical
    const tir = runMultidisciplinarySimulation('refraction-of-light', {
      incident_angle: 60,
      n1: 1.5,
      n2: 1.0,
    });
    expect(tir.measurements.total_internal_reflection).toBe(true);

    // Photoelectric: wavelength=600 nm (E ≈ 2.066 eV) < work_function=4.5 eV => no emission
    const noEmit = runMultidisciplinarySimulation('photoelectric-effect', {
      wavelength: 600,
      work_function: 4.5,
      intensity: 80,
    });
    expect(noEmit.measurements.emission_occurs).toBe(false);
    expect(noEmit.measurements.k_max_ev).toBe(0);
    expect(noEmit.measurements.photocurrent_ua).toBe(0);
  });

  it('verifies deterministic Chemistry calculations (pH, Dilution, Ideal Gas)', () => {
    // 0.01 M strong acid => pH = 2.0, pOH = 12.0
    const acid = runMultidisciplinarySimulation('acids-bases-ph', {
      solution_type: 0,
      molarity: 0.01,
    });
    expect(acid.measurements.ph).toBeCloseTo(2.0, 2);
    expect(acid.measurements.poh).toBeCloseTo(12.0, 2);

    // C1*V1 = C2*V2: 2.0 M * 50 mL diluted to 200 mL => 0.5 M, solvent added = 150 mL
    const dil = runMultidisciplinarySimulation('concentration-dilution', {
      initial_molarity: 2.0,
      initial_volume: 50,
      final_volume: 200,
    });
    expect(dil.measurements.final_molarity).toBeCloseTo(0.5, 4);
    expect(dil.measurements.solvent_added_ml).toBeCloseTo(150, 1);

    // Rejects invalid final_volume < initial_volume
    expect(() =>
      runMultidisciplinarySimulation('concentration-dilution', {
        initial_molarity: 2.0,
        initial_volume: 200,
        final_volume: 50,
      })
    ).toThrow();

    // Ideal Gas: n=1, T=273.15 K, V=22.414 L => P ≈ 1.0 atm
    const gas = runMultidisciplinarySimulation('gas-laws-thermodynamics', {
      moles: 1,
      temperature: 273.15,
      volume: 22.414,
    });
    expect(gas.measurements.p_ideal_atm).toBeCloseTo(1.0, 2);
  });

  it('verifies deterministic Biology calculations (Hardy-Weinberg & Trophic 10% Law)', () => {
    // Hardy-Weinberg: p = 0.6 => q = 0.4, p^2 = 0.36, 2pq = 0.48, q^2 = 0.16
    const hw = runMultidisciplinarySimulation('population-genetics', {
      allele_p: 0.6,
      population_size: 1000,
    });
    expect(hw.measurements.q).toBeCloseTo(0.4, 3);
    expect(hw.measurements.freq_AA).toBeCloseTo(0.36, 4);
    expect(hw.measurements.freq_Aa).toBeCloseTo(0.48, 4);
    expect(hw.measurements.freq_aa).toBeCloseTo(0.16, 4);
    expect(hw.measurements.count_Aa).toBeCloseTo(480, 1);

    // Food chain 10% energy transfer
    const eco = runMultidisciplinarySimulation('food-chain-ecosystem', {
      producer_energy: 10000,
      transfer_efficiency: 10,
    });
    expect(eco.measurements.primary_consumers_kcal).toBeCloseTo(1000, 1);
    expect(eco.measurements.secondary_consumers_kcal).toBeCloseTo(100, 1);
    expect(eco.measurements.tertiary_consumers_kcal).toBeCloseTo(10, 1);
  });

  it('verifies deterministic Mathematics calculations (Quadratic, Calculus, Matrices, 3D)', () => {
    // Quadratic: x^2 - 5x + 6 = 0 => roots 3 and 2
    const quad = runMultidisciplinarySimulation('quadratic-equations', { a: 1, b: -5, c: 6 });
    expect(quad.measurements.discriminant).toBeCloseTo(1, 3);
    expect(quad.measurements.root_1).toBeCloseTo(3, 3);
    expect(quad.measurements.root_2).toBeCloseTo(2, 3);

    // Derivative of f(x) = 2x^3 + 3x^2 + x + 1 at x0 = 2 => f(2)=31, f'(2)=37, f''(2)=30
    const deriv = runMultidisciplinarySimulation('differential-calculus', {
      a: 2,
      b: 3,
      c: 1,
      d: 1,
      x0: 2,
    });
    expect(deriv.measurements.f_x0).toBeCloseTo(31, 4);
    expect(deriv.measurements.f_prime_x0).toBeCloseTo(37, 4);
    expect(deriv.measurements.f_double_prime_x0).toBeCloseTo(30, 4);

    // Integral of f(x) = 3x^2 from 0 to 2 => exact = 8
    const integ = runMultidisciplinarySimulation('integral-calculus', {
      a: 3,
      b: 0,
      c: 0,
      lower_limit: 0,
      upper_limit: 2,
      subintervals: 20,
    });
    expect(integ.measurements.exact_integral).toBeCloseTo(8, 4);

    // Matrix [[2, 1], [1, 3]] => det = 5, trace = 5
    const mat = runMultidisciplinarySimulation('matrices-linear-algebra', {
      a11: 2,
      a12: 1,
      a21: 1,
      a22: 3,
    });
    expect(mat.measurements.determinant).toBeCloseTo(5, 3);
    expect(mat.measurements.trace).toBeCloseTo(5, 3);
    expect(mat.measurements.invertible).toBe(true);

    // 3D Geometry: i x j = k, dot = 0, angle = 90°
    const vec = runMultidisciplinarySimulation('three-dimensional-geometry', {
      ux: 1,
      uy: 0,
      uz: 0,
      vx: 0,
      vy: 1,
      vz: 0,
    });
    expect(vec.measurements.dot_product).toBeCloseTo(0, 3);
    expect(vec.measurements.angle_deg).toBeCloseTo(90, 2);
    expect(vec.measurements.cross_z).toBeCloseTo(1, 3);
  });
});
