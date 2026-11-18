import { describe, expect, it } from 'vitest';
import { CIRCUIT_PRESETS, solveCircuit } from '../playground/circuitSolver';
import {
  buildRoundedSvgPath,
  computeWireRoute,
  findNearestTerminal,
  getComponentBounds,
  getTerminalGeometry,
  samplePolyline,
  segmentIntersectsBox,
} from '../playground/wireRouter';
import { evaluateMechanicsState, MECHANICS_DEFAULTS } from '../playground/mechanicsEngine';
import { evaluateOptics, OPTICS_DEFAULTS } from '../playground/opticsEngine';
import { runMultidisciplinarySimulation } from '../engines';

describe('LabXAI 2.0 Physics Playground — Electrical Circuit Solver', () => {
  it('computes exact Ohm’s Law values: Battery 12 V + Resistor 100 Ω -> I = 0.12 A, P = 1.44 W', () => {
    const res = solveCircuit(CIRCUIT_PRESETS.ohmsLaw.components, CIRCUIT_PRESETS.ohmsLaw.wires);
    expect(res.valid).toBe(true);
    expect(res.circuitClosed).toBe(true);
    expect(res.totalVoltage).toBeCloseTo(12, 3);
    expect(res.totalCurrent).toBeCloseTo(0.12, 3);
    expect(res.equivalentResistance).toBeCloseTo(100, 1);
    expect(res.totalPower).toBeCloseTo(1.44, 3);
    expect(res.componentResults['amm-1'].current).toBeCloseTo(0.12, 3);
  });

  it('computes series resistance and voltage division accurately (40 Ω + 20 Ω = 60 Ω at 12 V)', () => {
    const res = solveCircuit(CIRCUIT_PRESETS.series.components, CIRCUIT_PRESETS.series.wires);
    expect(res.valid).toBe(true);
    expect(res.equivalentResistance).toBeCloseTo(60, 1);
    expect(res.totalCurrent).toBeCloseTo(0.2, 3);
    expect(res.componentResults['res-1'].voltageDrop).toBeCloseTo(8.0, 2);
    expect(res.componentResults['bulb-1'].voltageDrop).toBeCloseTo(4.0, 2);
  });

  it('computes parallel resistance and current division accurately (60 Ω || 30 Ω = 20 Ω at 12 V)', () => {
    const res = solveCircuit(CIRCUIT_PRESETS.parallel.components, CIRCUIT_PRESETS.parallel.wires);
    expect(res.valid).toBe(true);
    expect(res.equivalentResistance).toBeCloseTo(20, 1);
    expect(res.totalCurrent).toBeCloseTo(0.6, 3);
    expect(res.componentResults['res-1'].current).toBeCloseTo(0.2, 3);
    expect(res.componentResults['res-2'].current).toBeCloseTo(0.4, 3);
  });

  it('stops current and reports clear warning when a switch is OPEN', () => {
    const openSeries = CIRCUIT_PRESETS.series.components.map((c) =>
      c.id === 'sw-1' ? { ...c, closed: false } : c
    );
    const res = solveCircuit(openSeries, CIRCUIT_PRESETS.series.wires);
    expect(res.circuitClosed).toBe(false);
    expect(res.totalCurrent).toBeCloseTo(0, 4);
    expect(res.warnings.some((w) => w.toLowerCase().includes('switch'))).toBe(true);
  });

  it('detects direct short circuits and missing power sources with understandable errors', () => {
    const shortRes = solveCircuit(
      [{ id: 'b1', type: 'battery', voltage: 12, x: 100, y: 100 }],
      [{ id: 'w1', from: { componentId: 'b1', terminalId: 'pos' }, to: { componentId: 'b1', terminalId: 'neg' } }]
    );
    expect(shortRes.valid).toBe(false);
    expect(shortRes.errors[0].toLowerCase()).toContain('short circuit');

    const noSource = solveCircuit([{ id: 'r1', type: 'resistor', resistance: 100, x: 100, y: 100 }], []);
    expect(noSource.valid).toBe(false);
    expect(noSource.errors[0].toLowerCase()).toContain('power source');
  });

  it('handles forward-biased LED with protective resistor safely', () => {
    const res = solveCircuit(CIRCUIT_PRESETS.ledCircuit.components, CIRCUIT_PRESETS.ledCircuit.wires);
    expect(res.valid).toBe(true);
    expect(res.circuitClosed).toBe(true);
    // (9V - 2V) / (330 + 15) ≈ 0.0203 A (20.3 mA)
    expect(res.totalCurrent).toBeCloseTo(0.0203, 3);
    expect(res.componentResults['led-1'].active).toBe(true);
  });

  it('detects invalid parallel ammeter across battery and disconnected components', () => {
    const parallelAmmeter = solveCircuit(
      [
        { id: 'b1', type: 'battery', label: 'Battery 12V', voltage: 12, x: 100, y: 150 },
        { id: 'a1', type: 'ammeter', label: 'Ammeter 1', x: 300, y: 150 },
      ],
      [
        { id: 'w1', from: { componentId: 'b1', terminalId: 'pos' }, to: { componentId: 'a1', terminalId: 'pos' } },
        { id: 'w2', from: { componentId: 'b1', terminalId: 'neg' }, to: { componentId: 'a1', terminalId: 'neg' } },
      ]
    );
    expect(parallelAmmeter.valid).toBe(false);
    expect(parallelAmmeter.errors.some((e) => e.toLowerCase().includes('ammeter'))).toBe(true);

    const floating = solveCircuit(
      [
        { id: 'b1', type: 'battery', label: 'Battery 12V', voltage: 12, x: 100, y: 150 },
        { id: 'r1', type: 'resistor', label: 'Floating R', resistance: 100, x: 300, y: 150 },
      ],
      []
    );
    expect(floating.warnings.some((w) => w.includes('Floating R'))).toBe(true);
  });
});

describe('LabXAI Physics Playground — Intelligent Orthogonal Wire Router', () => {
  it('routes wires orthogonally around obstacle components and generates rounded SVG paths', () => {
    const comps = [
      { id: 'c1', type: 'battery', x: 100, y: 200, rotation: 0 },
      { id: 'obs', type: 'resistor', x: 260, y: 200, rotation: 0 },
      { id: 'c2', type: 'bulb', x: 420, y: 200, rotation: 0 },
    ];
    const start = getTerminalGeometry(comps[0], 'neg'); // right side of c1 (144, 200)
    const end = getTerminalGeometry(comps[2], 'a'); // left side of c2 (376, 200)
    const route = computeWireRoute(start, end, comps, ['c1', 'c2']);
    const obsBox = getComponentBounds(comps[1], 4);

    // Every segment should avoid the obstacle box!
    for (let i = 0; i < route.length - 1; i += 1) {
      expect(segmentIntersectsBox(route[i], route[i + 1], obsBox)).toBe(false);
    }

    const svgPath = buildRoundedSvgPath(route, 10);
    expect(svgPath).toContain('M ');
    expect(svgPath).toContain('Q ');

    const mid = samplePolyline(route, 0.5);
    expect(Number.isFinite(mid.x)).toBe(true);
    expect(Number.isFinite(mid.y)).toBe(true);
  });

  it('snaps pointer magnetically to nearby terminals and flags same-component incompatibility', () => {
    const comps = [
      { id: 'b1', type: 'battery', x: 100, y: 200, rotation: 0 },
      { id: 'r1', type: 'resistor', x: 300, y: 200, rotation: 0 },
    ];
    // Resistor left terminal is at (256, 200)
    const validSnap = findNearestTerminal({ x: 262, y: 205 }, comps, { componentId: 'b1', terminalId: 'pos' }, 26);
    expect(validSnap).not.toBeNull();
    expect(validSnap.componentId).toBe('r1');
    expect(validSnap.compatible).toBe(true);

    // Battery right terminal is at (144, 200) — same component as source!
    const invalidSnap = findNearestTerminal({ x: 146, y: 202 }, comps, { componentId: 'b1', terminalId: 'pos' }, 26);
    expect(invalidSnap).not.toBeNull();
    expect(invalidSnap.compatible).toBe(false);
  });

  it('respects user-dragged custom bend waypoints orthogonally', () => {
    const comps = [
      { id: 'b1', type: 'battery', x: 100, y: 200, rotation: 0 },
      { id: 'r1', type: 'resistor', x: 300, y: 200, rotation: 0 },
    ];
    const start = getTerminalGeometry(comps[0], 'neg');
    const end = getTerminalGeometry(comps[1], 'a');
    const route = computeWireRoute(start, end, comps, ['b1', 'r1'], [{ x: 200, y: 120 }]);
    expect(route.some((p) => p.y === 120)).toBe(true);
  });
});

describe('LabXAI 2.0 Physics Playground — Mechanics & Optics Engines', () => {
  it('computes inclined plane acceleration a = g(sin θ − μ cos θ)', () => {
    const s = evaluateMechanicsState({ ...MECHANICS_DEFAULTS, scene: 'inclined-plane', angle: 30, friction: 0, gravity: 9.81 }, 2);
    expect(s.acceleration).toBeCloseTo(4.905, 2);
    expect(s.velocity).toBeCloseTo(9.81, 2);
  });

  it('computes Hooke’s law spring equilibrium stretch Δx = mg / k and Atwood pulley acceleration', () => {
    const sp = evaluateMechanicsState({ ...MECHANICS_DEFAULTS, scene: 'spring', mass: 4, springK: 40, gravity: 10 }, 0);
    expect(sp.equilibriumStretch).toBeCloseTo(1.0, 3);

    const pul = evaluateMechanicsState({ ...MECHANICS_DEFAULTS, scene: 'pulley', mass: 2, mass2: 6, gravity: 10 }, 1);
    expect(pul.acceleration).toBeCloseTo(5.0, 3);
    expect(pul.tension).toBeCloseTo(30.0, 2);
  });

  it('computes optics law of reflection, convex lens 2f imaging, and prism dispersion', () => {
    const refl = evaluateOptics({ ...OPTICS_DEFAULTS, element: 'plane-mirror', incidentAngle: 35 });
    expect(refl.reflectedAngle).toBe(35);
    expect(refl.deviationAngle).toBe(110);

    const lens = evaluateOptics({ ...OPTICS_DEFAULTS, element: 'convex-lens', focalLength: 15, objectDistance: 30 });
    expect(lens.imageDistance).toBeCloseTo(30, 2);
    expect(lens.magnification).toBeCloseTo(-1, 2);

    const prism = evaluateOptics({ ...OPTICS_DEFAULTS, element: 'prism', incidentAngle: 48, prismApexAngle: 60 });
    expect(prism.violetDeviation).toBeGreaterThan(prism.redDeviation);
    expect(prism.angularDispersion).toBeGreaterThan(1.5);
  });
});

describe('LabXAI 2.0 New Biology & Chemistry Deterministic Engines', () => {
  it('computes Respiratory System minute & alveolar ventilation accurately', () => {
    const resp = runMultidisciplinarySimulation('human-respiratory-system', {
      breathing_rate: 16,
      tidal_volume: 500,
      age_group: 1,
      organ_index: 8,
    });
    expect(resp.measurements.organ_name).toBe('Alveoli');
    expect(resp.measurements.minute_ventilation_l_min).toBeCloseTo(8.0, 2);
    expect(resp.measurements.alveolar_ventilation_l_min).toBeCloseTo(5.6, 2);
  });

  it('computes Nervous System threshold & myelinated reflex speed boost', () => {
    const sub = runMultidisciplinarySimulation('human-nervous-system', { stimulus_intensity: 20 });
    expect(sub.measurements.action_potential_fired).toBe(false);

    const myel = runMultidisciplinarySimulation('human-nervous-system', { stimulus_intensity: 75, myelination: 1, pathway_length_cm: 100 });
    const unmyel = runMultidisciplinarySimulation('human-nervous-system', { stimulus_intensity: 75, myelination: 0, pathway_length_cm: 100 });
    expect(myel.measurements.action_potential_fired).toBe(true);
    expect(myel.measurements.reflex_latency_ms).toBeLessThan(unmyel.measurements.reflex_latency_ms);
  });

  it('computes Chemical Reaction Playground stoichiometry and Bunsen heat gate', () => {
    const neut = runMultidisciplinarySimulation('chemical-reaction-playground', { reaction_id: 0, moles_a: 0.2, moles_b: 0.5, heat_on: 0 });
    expect(neut.measurements.reaction_occurs).toBe(true);
    expect(neut.measurements.product_moles).toBeCloseTo(0.2, 4);
    expect(neut.measurements.enthalpy_change_kj).toBeCloseTo(-11.46, 2);

    const coldMg = runMultidisciplinarySimulation('chemical-reaction-playground', { reaction_id: 4, moles_a: 0.2, moles_b: 0.2, heat_on: 0 });
    expect(coldMg.measurements.reaction_occurs).toBe(false);
    expect(coldMg.measurements.product_moles).toBe(0);
  });
});
