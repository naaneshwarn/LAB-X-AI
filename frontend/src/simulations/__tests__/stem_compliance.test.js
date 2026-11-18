import { describe, expect, it } from 'vitest';
import { getStemConnections, STEM_CONNECTIONS } from '../../data/stemConnectionsData';
import { getStemChallenge, STEM_CHALLENGES } from '../../data/stemChallengesData';
import { CLIENT_SIMULATION_REGISTRY } from '../engines/index.js';

describe('STEM Education Compliance Audit & Verification', () => {
  const allExperimentIds = Object.keys(CLIENT_SIMULATION_REGISTRY);

  describe('1. Interdisciplinary STEM Connections (Science, Technology, Engineering, Math)', () => {
    it('provides rich STEM connections for key multidisciplinary experiments', () => {
      const sampleIds = [
        'ohms-law',
        'simple-pendulum',
        'projectile-motion',
        'reflection-of-light',
        'acids-bases-ph',
        'atomic-structure',
        'human-respiratory-system',
        'human-circulatory-system',
        'trigonometric-functions',
        'quadratic-equations',
      ];

      sampleIds.forEach((id) => {
        const data = STEM_CONNECTIONS[id];
        expect(data, `Missing STEM connections for ${id}`).toBeDefined();
        expect(data.science.length).toBeGreaterThan(15);
        expect(data.technology.length).toBeGreaterThan(15);
        expect(data.engineering.length).toBeGreaterThan(15);
        expect(data.mathematics.length).toBeGreaterThan(15);
        expect(data.stemTags).toEqual(['Science', 'Technology', 'Engineering', 'Mathematics']);
      });
    });

    it('fallback helper getStemConnections produces a valid STEM object for all 51 experiments', () => {
      allExperimentIds.forEach((id) => {
        const conn = getStemConnections(id, 'Physics');
        expect(conn).toBeDefined();
        expect(conn.science).toBeDefined();
        expect(conn.technology).toBeDefined();
        expect(conn.engineering).toBeDefined();
        expect(conn.mathematics).toBeDefined();
        expect(conn.stemTags.length).toBe(4);
      });
    });

    it('contains real-world case studies with industry context and career pathways', () => {
      Object.keys(STEM_CONNECTIONS).forEach((id) => {
        const cs = STEM_CONNECTIONS[id].realWorldCaseStudy;
        expect(cs, `Case study missing for ${id}`).toBeDefined();
        expect(cs.title.length).toBeGreaterThan(5);
        expect(cs.industry.length).toBeGreaterThan(3);
        expect(cs.description.length).toBeGreaterThan(30);
        expect(cs.career.length).toBeGreaterThan(5);
      });
    });

    it('provides virtual microcontroller & sensor telemetry code snippets', () => {
      Object.keys(STEM_CONNECTIONS).forEach((id) => {
        const snippet = STEM_CONNECTIONS[id].microcontrollerSnippet;
        expect(snippet, `Snippet missing for ${id}`).toBeDefined();
        expect(snippet.platform.length).toBeGreaterThan(2);
        expect(snippet.title.length).toBeGreaterThan(5);
        expect(snippet.code.length).toBeGreaterThan(30);
      });
    });
  });

  describe('2. Critical Thinking & Predict-Before-Run Engine', () => {
    it('provides guided hypothesis options with exactly one correct answer and explanation', () => {
      Object.keys(STEM_CONNECTIONS).forEach((id) => {
        const prompt = STEM_CONNECTIONS[id].predictPrompt;
        expect(prompt, `Prediction prompt missing for ${id}`).toBeDefined();
        expect(prompt.question.length).toBeGreaterThan(10);
        expect(prompt.options.length).toBeGreaterThanOrEqual(3);

        const correctOpts = prompt.options.filter((o) => o.correct);
        expect(correctOpts.length, `Expected 1 correct option for ${id}`).toBe(1);
        expect(prompt.explanation.length).toBeGreaterThan(15);
        expect(prompt.whatIfFollowUp.length).toBeGreaterThan(10);
      });
    });
  });

  describe('3. STEM Engineering Challenges & Physical Constraints Validation', () => {
    it('contains all 8 required real-world engineering challenges', () => {
      expect(STEM_CHALLENGES.length).toBe(8);
      const expectedChallengeIds = [
        'led-circuit-guard',
        'water-filtration-eco',
        'smart-irrigation-iot',
        'thermal-heat-shield',
        'seismic-bridge-builder',
        'solar-microgrid',
        'respiratory-biometrics',
        'parabolic-arch-bridge',
      ];
      expectedChallengeIds.forEach((id) => {
        expect(STEM_CHALLENGES.some((c) => c.id === id), `Missing challenge ${id}`).toBe(true);
      });
    });

    it('each challenge specifies constraints, parameters, connections, and evaluation function', () => {
      STEM_CHALLENGES.forEach((ch) => {
        expect(ch.id).toBeDefined();
        expect(ch.title.length).toBeGreaterThan(5);
        expect(ch.problemStatement.length).toBeGreaterThan(30);
        expect(ch.constraints.length).toBeGreaterThanOrEqual(2);
        expect(ch.parameters.length).toBeGreaterThanOrEqual(3);
        expect(typeof ch.evaluateSolution).toBe('function');
        expect(ch.reflection.length).toBeGreaterThan(10);
      });
    });

    it('Challenge 1 (LED Circuit Guard) verifies current constraints and resistor power', () => {
      const ch = getStemChallenge('led-circuit-guard');

      // Balanced parameters: 9V, 470 ohm, 1 LED -> (9 - 2.2)/470 = 14.46 mA ≈ 15mA
      const goodParams = { supplyVoltage: 9.0, resistorValue: 400, ledCount: 1 };
      const resGood = ch.evaluateSolution(goodParams);
      expect(resGood.success).toBe(true);
      expect(resGood.score).toBeGreaterThanOrEqual(85);
      expect(resGood.current_mA).toBeGreaterThanOrEqual(15.0);
      expect(resGood.current_mA).toBeLessThanOrEqual(22.0);

      // Low resistor causing dangerous burnout current: 9V, 100 ohm, 1 LED -> 68 mA
      const badParams = { supplyVoltage: 9.0, resistorValue: 100, ledCount: 1 };
      const resBad = ch.evaluateSolution(badParams);
      expect(resBad.success).toBe(false);
      expect(resBad.current_mA).toBeGreaterThan(22.0);
      expect(resBad.message).toContain('Danger');
    });

    it('Challenge 2 (Water Filtration) verifies turbidity and flow rate balance', () => {
      const ch = getStemChallenge('water-filtration-eco');

      // Optimal: 8cm gravel, 14cm sand, 10cm carbon
      const good = ch.evaluateSolution({ gravelLayerCm: 8, sandLayerCm: 14, carbonLayerCm: 10 });
      expect(good.turbidity_NTU).toBeLessThanOrEqual(4.0);
      expect(good.flowRate_Lph).toBeGreaterThanOrEqual(1.5);
      expect(good.success).toBe(true);

      // Shallow sand/carbon layers -> water remains turbid
      const dirty = ch.evaluateSolution({ gravelLayerCm: 4, sandLayerCm: 8, carbonLayerCm: 4 });
      expect(dirty.turbidity_NTU).toBeGreaterThan(4.0);
      expect(dirty.success).toBe(false);
    });

    it('Challenge 3 (Smart Irrigation) verifies moisture threshold and runoff waste', () => {
      const ch = getStemChallenge('smart-irrigation-iot');

      // Balanced: trigger 40%, 35 sec, 1.0 L/min
      const good = ch.evaluateSolution({ triggerThreshold: 40, pumpDurationSec: 35, emitterFlowLpm: 1.0 });
      expect(good.equilibriumMoisture_pct).toBeGreaterThanOrEqual(45.0);
      expect(good.equilibriumMoisture_pct).toBeLessThanOrEqual(70.0);
      expect(good.success).toBe(true);

      // Saturated over-watering: trigger 55%, 90 sec, 3.0 L/min -> severe runoff
      const over = ch.evaluateSolution({ triggerThreshold: 55, pumpDurationSec: 90, emitterFlowLpm: 3.0 });
      expect(over.success).toBe(false);
      expect(over.message).toContain('Waterlogged');
    });

    it('Challenge 5 (Seismic Damper) detects harmonic resonance vs 2.5 Hz ground shaking', () => {
      const ch = getStemChallenge('seismic-bridge-builder');

      // Resonant trap parameters: deck 35T, pier stiffness 8.6 MN/m -> fn ≈ 2.5 Hz
      const resonant = ch.evaluateSolution({ deckMassTons: 35, pierStiffnessMN: 8.6, dampingRatioPct: 4 });
      expect(resonant.freqDifference_Hz).toBeLessThan(0.5);
      expect(resonant.success).toBe(false);
      expect(resonant.message).toContain('RESONANCE');

      // Stiffened safe piers: pier stiffness 28 MN/m -> fn ≈ 4.5 Hz (well clear of 2.5Hz)
      const safe = ch.evaluateSolution({ deckMassTons: 35, pierStiffnessMN: 28, dampingRatioPct: 12 });
      expect(safe.freqDifference_Hz).toBeGreaterThanOrEqual(0.5);
      expect(safe.peakSway_cm).toBeLessThanOrEqual(12.0);
      expect(safe.success).toBe(true);
    });

    it('Challenge 8 (Parabolic Arch Bridge) validates boat clearance and abutment thrust', () => {
      const ch = getStemChallenge('parabolic-arch-bridge');

      // Adequate height h=10m, span 40m, load 15 kN/m
      // Thrust H = (15 * 1600) / (8 * 10) = 300 kN <= 750 kN
      const good = ch.evaluateSolution({ archHeightM: 10.0, spanLengthM: 40.0, deckUniformLoad: 15.0 });
      expect(good.horizontalThrust_kN).toBeLessThanOrEqual(750.0);
      expect(good.success).toBe(true);

      // Very flat arch h=5m -> boat clearance violated
      const flat = ch.evaluateSolution({ archHeightM: 5.0, spanLengthM: 40.0, deckUniformLoad: 15.0 });
      expect(flat.success).toBe(false);
      expect(flat.message).toContain('Insufficient boat clearance');
    });
  });
});
