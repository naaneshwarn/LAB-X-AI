/**
 * Deterministic DC Circuit Calculation Engine for LabXAI Physics Playground.
 * Uses Modified Nodal Analysis (MNA) with Gaussian elimination.
 *
 * Supported Scope (clearly defined):
 * - Steady-state DC circuits with 1+ voltage sources (Battery, DC Power Supply),
 *   Resistors, Variable Resistors, Bulbs, Switches, Ammeters (0.001 Ω), Voltmeters (10 MΩ),
 *   LEDs (forward drop 2.0 V), Diodes (forward drop 0.7 V), and Capacitors (DC steady-state Q=CV).
 * - Handles Ohm's Law, Series circuits, Parallel circuits, Voltage Dividers, Current Dividers,
 *   and Series-Parallel resistive DC networks.
 * - Detects open circuits, open switches, missing power sources, short circuits, and LED overcurrent.
 */

export const CIRCUIT_COMPONENT_DEFS = [
  {
    type: 'battery',
    name: 'Battery',
    category: 'Power',
    symbol: '🔋',
    description: 'DC voltage source supplying electrical potential energy (V).',
    terminals: ['pos', 'neg'],
    defaults: { voltage: 12 },
  },
  {
    type: 'dc-supply',
    name: 'DC Power Supply',
    category: 'Power',
    symbol: '⚡',
    description: 'Adjustable bench DC voltage supply (1–24 V).',
    terminals: ['pos', 'neg'],
    defaults: { voltage: 9 },
  },
  {
    type: 'resistor',
    name: 'Resistor',
    category: 'Passive',
    symbol: '〰️',
    description: 'Opposes electric current according to Ohm’s Law (V = I·R).',
    terminals: ['a', 'b'],
    defaults: { resistance: 100 },
  },
  {
    type: 'variable-resistor',
    name: 'Variable Resistor',
    category: 'Passive',
    symbol: '🎛️',
    description: 'Adjustable rheostat/potentiometer (5–1000 Ω) to vary current.',
    terminals: ['a', 'b'],
    defaults: { resistance: 50 },
  },
  {
    type: 'bulb',
    name: 'Light Bulb',
    category: 'Output',
    symbol: '💡',
    description: 'Filament lamp converting electrical power (P = V·I) into light & heat.',
    terminals: ['a', 'b'],
    defaults: { resistance: 24 },
  },
  {
    type: 'led',
    name: 'LED',
    category: 'Output',
    symbol: '🔴',
    description: 'Light-Emitting Diode (~2.0 V forward drop). Conducts from anode (+) to cathode (−).',
    terminals: ['pos', 'neg'],
    defaults: { forwardVoltage: 2.0, resistance: 15, color: '#ef4444' },
  },
  {
    type: 'switch',
    name: 'Switch',
    category: 'Control',
    symbol: '🔘',
    description: 'Opens or closes a circuit branch to control current flow.',
    terminals: ['a', 'b'],
    defaults: { closed: true },
  },
  {
    type: 'ammeter',
    name: 'Ammeter (A)',
    category: 'Meters',
    symbol: '🅰️',
    description: 'Connect in SERIES to measure electric current in Amperes (A).',
    terminals: ['pos', 'neg'],
    defaults: {},
  },
  {
    type: 'voltmeter',
    name: 'Voltmeter (V)',
    category: 'Meters',
    symbol: '🇻',
    description: 'Connect in PARALLEL across a component to measure voltage drop (V).',
    terminals: ['pos', 'neg'],
    defaults: {},
  },
  {
    type: 'capacitor',
    name: 'Capacitor',
    category: 'Passive',
    symbol: '⏸️',
    description: 'Stores electrical charge Q = C·V and energy E = ½CV² in DC steady state.',
    terminals: ['pos', 'neg'],
    defaults: { capacitance_uf: 100 },
  },
  {
    type: 'diode',
    name: 'Diode',
    category: 'Passive',
    symbol: '▶️',
    description: 'Allows DC current in one direction (anode + → cathode −, ~0.7 V drop).',
    terminals: ['pos', 'neg'],
    defaults: { forwardVoltage: 0.7, resistance: 5 },
  },
];

export function getComponentDef(type) {
  return CIRCUIT_COMPONENT_DEFS.find((d) => d.type === type) || CIRCUIT_COMPONENT_DEFS[2];
}

/**
 * Union-Find to group wire-connected terminals into electrical nodes.
 */
function buildElectricalNodes(components, wires) {
  const parent = new Map();
  const find = (x) => {
    if (!parent.has(x)) parent.set(x, x);
    let r = x;
    while (parent.get(r) !== r) r = parent.get(r);
    let cur = x;
    while (parent.get(cur) !== r) {
      const next = parent.get(cur);
      parent.set(cur, r);
      cur = next;
    }
    return r;
  };
  const union = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };

  components.forEach((c) => {
    const def = getComponentDef(c.type);
    def.terminals.forEach((t) => find(`${c.id}:${t}`));
  });

  wires.forEach((w) => {
    const k1 = `${w.from.componentId}:${w.from.terminalId}`;
    const k2 = `${w.to.componentId}:${w.to.terminalId}`;
    if (parent.has(k1) && parent.has(k2)) {
      union(k1, k2);
    }
  });

  const rootToNode = new Map();
  let nextIdx = 0;
  const terminalNode = new Map();
  for (const key of parent.keys()) {
    const root = find(key);
    if (!rootToNode.has(root)) {
      rootToNode.set(root, nextIdx++);
    }
    terminalNode.set(key, rootToNode.get(root));
  }
  return { terminalNode, nodeCount: nextIdx };
}

/**
 * Solve dense linear system A * x = b using Gaussian elimination with partial pivoting.
 */
function solveLinearSystem(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < n; row += 1) {
      if (Math.abs(M[row][col]) > Math.abs(M[pivot][col])) pivot = row;
    }
    if (Math.abs(M[pivot][col]) < 1e-12) return null;
    if (pivot !== col) {
      const tmp = M[col];
      M[col] = M[pivot];
      M[pivot] = tmp;
    }
    const div = M[col][col];
    for (let j = col; j <= n; j += 1) M[col][j] /= div;
    for (let row = 0; row < n; row += 1) {
      if (row === col) continue;
      const factor = M[row][col];
      if (Math.abs(factor) < 1e-15) continue;
      for (let j = col; j <= n; j += 1) M[row][j] -= factor * M[col][j];
    }
  }
  return M.map((row) => row[n]);
}

function runMnaPass(components, terminalNode, nodeCount, gndNode, diodeStates) {
  const sources = components.filter((c) => c.type === 'battery' || c.type === 'dc-supply');
  // Map non-ground nodes to 0..N-1
  const nodeIndex = new Map();
  let idx = 0;
  for (let n = 0; n < nodeCount; n += 1) {
    if (n !== gndNode) nodeIndex.set(n, idx++);
  }
  const N = idx;
  const M = sources.length;
  const size = N + M;
  if (size === 0) return null;

  const A = Array.from({ length: size }, () => Array(size).fill(0));
  const z = Array(size).fill(0);

  // Tiny leakage conductance (1e-10 S) to ground keeps floating islands non-singular
  for (let i = 0; i < N; i += 1) {
    A[i][i] += 1e-10;
  }

  const stampConductance = (nA, nB, g) => {
    const iA = nodeIndex.get(nA);
    const iB = nodeIndex.get(nB);
    if (iA !== undefined) A[iA][iA] += g;
    if (iB !== undefined) A[iB][iB] += g;
    if (iA !== undefined && iB !== undefined) {
      A[iA][iB] -= g;
      A[iB][iA] -= g;
    }
  };

  const stampCurrentSource = (nFrom, nTo, current) => {
    const iFrom = nodeIndex.get(nFrom);
    const iTo = nodeIndex.get(nTo);
    if (iFrom !== undefined) z[iFrom] -= current;
    if (iTo !== undefined) z[iTo] += current;
  };

  components.forEach((c) => {
    const def = getComponentDef(c.type);
    const n1 = terminalNode.get(`${c.id}:${def.terminals[0]}`);
    const n2 = terminalNode.get(`${c.id}:${def.terminals[1]}`);
    if (n1 === undefined || n2 === undefined) return;

    if (c.type === 'resistor' || c.type === 'variable-resistor' || c.type === 'bulb') {
      const r = Math.max(0.01, Number(c.resistance ?? def.defaults.resistance));
      stampConductance(n1, n2, 1 / r);
    } else if (c.type === 'switch') {
      const closed = c.closed !== false;
      stampConductance(n1, n2, closed ? 1 / 0.001 : 1e-10);
    } else if (c.type === 'ammeter') {
      stampConductance(n1, n2, 1 / 0.001);
    } else if (c.type === 'voltmeter') {
      stampConductance(n1, n2, 1 / 1e7);
    } else if (c.type === 'capacitor') {
      // DC steady-state capacitor acts as open circuit (very high resistance)
      stampConductance(n1, n2, 1e-9);
    } else if (c.type === 'led' || c.type === 'diode') {
      const conducting = diodeStates.get(c.id) !== false;
      if (conducting) {
        const vf = Number(c.forwardVoltage ?? def.defaults.forwardVoltage);
        const ron = Math.max(1, Number(c.resistance ?? def.defaults.resistance));
        const g = 1 / ron;
        // Norton equivalent of Vf in series with Ron: conductance g in parallel with current source Vf*g from neg->pos
        stampConductance(n1, n2, g);
        stampCurrentSource(n2, n1, vf * g);
      } else {
        stampConductance(n1, n2, 1e-9);
      }
    }
  });

  sources.forEach((src, sIdx) => {
    const nPos = terminalNode.get(`${src.id}:pos`);
    const nNeg = terminalNode.get(`${src.id}:neg`);
    const row = N + sIdx;
    const iPos = nodeIndex.get(nPos);
    const iNeg = nodeIndex.get(nNeg);
    if (iPos !== undefined) {
      A[iPos][row] += 1;
      A[row][iPos] += 1;
    }
    if (iNeg !== undefined) {
      A[iNeg][row] -= 1;
      A[row][iNeg] -= 1;
    }
    z[row] = Number(src.voltage ?? 12);
  });

  const sol = solveLinearSystem(A, z);
  if (!sol) return null;

  const nodeVoltages = new Map();
  nodeVoltages.set(gndNode, 0);
  for (const [nodeId, matrixIdx] of nodeIndex.entries()) {
    nodeVoltages.set(nodeId, sol[matrixIdx]);
  }
  const sourceCurrents = new Map();
  sources.forEach((src, sIdx) => {
    // MNA sign convention: current leaving positive terminal is -sol[N + sIdx]
    sourceCurrents.set(src.id, -sol[N + sIdx]);
  });

  return { nodeVoltages, sourceCurrents };
}

export function solveCircuit(components = [], wires = []) {
  const errors = [];
  const warnings = [];

  if (components.length === 0) {
    return {
      valid: false,
      circuitClosed: false,
      totalVoltage: 0,
      totalCurrent: 0,
      equivalentResistance: null,
      totalPower: 0,
      componentResults: {},
      errors: ['Workspace is empty. Drag a Battery and a Resistor or Bulb onto the canvas to start.'],
      warnings: [],
      topologySummary: 'No components placed',
    };
  }

  const sources = components.filter((c) => c.type === 'battery' || c.type === 'dc-supply');
  if (sources.length === 0) {
    return {
      valid: false,
      circuitClosed: false,
      totalVoltage: 0,
      totalCurrent: 0,
      equivalentResistance: null,
      totalPower: 0,
      componentResults: {},
      errors: ['No power source found. Add a Battery or DC Power Supply to energize your circuit.'],
      warnings: [],
      topologySummary: 'Missing power source',
    };
  }

  const { terminalNode, nodeCount } = buildElectricalNodes(components, wires);

  // Check for direct short circuit across any voltage source
  for (const src of sources) {
    const nPos = terminalNode.get(`${src.id}:pos`);
    const nNeg = terminalNode.get(`${src.id}:neg`);
    if (nPos === nNeg) {
      errors.push(
        `Short circuit detected across ${src.label || 'Battery'}! Never connect the + and − terminals directly without a resistor or load.`
      );
    }
  }

  // Check for invalid Ammeter connected in PARALLEL directly across a voltage source
  const ammeters = components.filter((c) => c.type === 'ammeter');
  for (const amm of ammeters) {
    const a1 = terminalNode.get(`${amm.id}:pos`);
    const a2 = terminalNode.get(`${amm.id}:neg`);
    for (const src of sources) {
      const sPos = terminalNode.get(`${src.id}:pos`);
      const sNeg = terminalNode.get(`${src.id}:neg`);
      if ((a1 === sPos && a2 === sNeg) || (a1 === sNeg && a2 === sPos)) {
        errors.push(
          `Invalid Meter Connection: ${amm.label || 'Ammeter'} is wired in PARALLEL directly across ${src.label || 'Battery'}! Ammeters have near-zero resistance and must always be connected in SERIES.`
        );
      }
    }
  }

  // Check for disconnected / floating components
  const terminalWireCounts = new Map();
  wires.forEach((w) => {
    const k1 = `${w.from.componentId}:${w.from.terminalId}`;
    const k2 = `${w.to.componentId}:${w.to.terminalId}`;
    terminalWireCounts.set(k1, (terminalWireCounts.get(k1) || 0) + 1);
    terminalWireCounts.set(k2, (terminalWireCounts.get(k2) || 0) + 1);
  });
  const disconnectedNames = [];
  components.forEach((c) => {
    const def = getComponentDef(c.type);
    const connectedTerms = def.terminals.filter(
      (t) => (terminalWireCounts.get(`${c.id}:${t}`) || 0) > 0
    ).length;
    if (connectedTerms < def.terminals.length) {
      disconnectedNames.push(c.label || def.name);
    }
  });
  if (disconnectedNames.length > 0) {
    warnings.push(
      `Unconnected terminal(s) on: ${disconnectedNames.slice(0, 4).join(', ')}${disconnectedNames.length > 4 ? '…' : ''}. Connect both terminals to include them in the circuit.`
    );
  }

  if (errors.length > 0) {
    return {
      valid: false,
      circuitClosed: false,
      totalVoltage: Number(sources[0].voltage ?? 12),
      totalCurrent: 0,
      equivalentResistance: 0,
      totalPower: 0,
      componentResults: {},
      errors,
      warnings,
      topologySummary: 'Short circuit fault',
    };
  }

  const gndNode = terminalNode.get(`${sources[0].id}:neg`);
  const diodes = components.filter((c) => c.type === 'led' || c.type === 'diode');
  const diodeStates = new Map(diodes.map((d) => [d.id, true]));

  // Up to 4 iterations for diode/LED forward-bias convergence
  let mna = null;
  for (let iter = 0; iter < 4; iter += 1) {
    mna = runMnaPass(components, terminalNode, nodeCount, gndNode, diodeStates);
    if (!mna) break;
    let changed = false;
    for (const d of diodes) {
      const def = getComponentDef(d.type);
      const vPos = mna.nodeVoltages.get(terminalNode.get(`${d.id}:pos`)) ?? 0;
      const vNeg = mna.nodeVoltages.get(terminalNode.get(`${d.id}:neg`)) ?? 0;
      const vDrop = vPos - vNeg;
      const vf = Number(d.forwardVoltage ?? def.defaults.forwardVoltage);
      const shouldConduct = vDrop >= vf - 0.05;
      if (diodeStates.get(d.id) !== shouldConduct) {
        diodeStates.set(d.id, shouldConduct);
        changed = true;
      }
    }
    if (!changed) break;
  }

  if (!mna) {
    return {
      valid: false,
      circuitClosed: false,
      totalVoltage: Number(sources[0].voltage ?? 12),
      totalCurrent: 0,
      equivalentResistance: null,
      totalPower: 0,
      componentResults: {},
      errors: ['Conflicting voltage sources in parallel or unsolvable loop. Ensure voltage sources are not wired directly in parallel with different voltages.'],
      warnings: [],
      topologySummary: 'Conflicting sources',
    };
  }

  const componentResults = {};
  let totalSourceCurrent = 0;
  let totalSourcePower = 0;
  let totalVoltage = 0;

  sources.forEach((src) => {
    const v = Number(src.voltage ?? 12);
    const i = mna.sourceCurrents.get(src.id) ?? 0;
    const p = Math.abs(v * i);
    totalVoltage += v;
    totalSourceCurrent += Math.abs(i);
    totalSourcePower += p;
    componentResults[src.id] = {
      voltageDrop: Number(v.toFixed(4)),
      current: Number(Math.abs(i).toFixed(4)),
      power: Number(p.toFixed(4)),
      active: Math.abs(i) > 1e-5,
    };
  });

  // Check for excessive short-circuit current through a closed switch / ammeter only
  if (totalSourceCurrent > 50) {
    errors.push(
      `Dangerous short circuit (${totalSourceCurrent.toFixed(1)} A)! Add a resistor or bulb in series to limit current safely.`
    );
    return {
      valid: false,
      circuitClosed: false,
      totalVoltage: Number(totalVoltage.toFixed(3)),
      totalCurrent: 0,
      equivalentResistance: 0,
      totalPower: 0,
      componentResults,
      errors,
      warnings,
      topologySummary: 'Short circuit (excessive current)',
    };
  }

  components.forEach((c) => {
    if (c.type === 'battery' || c.type === 'dc-supply') return;
    const def = getComponentDef(c.type);
    const v1 = mna.nodeVoltages.get(terminalNode.get(`${c.id}:${def.terminals[0]}`)) ?? 0;
    const v2 = mna.nodeVoltages.get(terminalNode.get(`${c.id}:${def.terminals[1]}`)) ?? 0;
    const vDrop = v1 - v2;
    let current = 0;
    let active = false;
    let status = 'OK';

    if (c.type === 'resistor' || c.type === 'variable-resistor' || c.type === 'bulb') {
      const r = Math.max(0.01, Number(c.resistance ?? def.defaults.resistance));
      current = vDrop / r;
      active = Math.abs(current) > 1e-5;
    } else if (c.type === 'switch') {
      const closed = c.closed !== false;
      current = closed ? vDrop / 0.001 : 0;
      active = closed && Math.abs(current) > 1e-5;
      status = closed ? 'Closed (ON)' : 'Open (OFF)';
    } else if (c.type === 'ammeter') {
      current = vDrop / 0.001;
      active = Math.abs(current) > 1e-5;
    } else if (c.type === 'voltmeter') {
      current = vDrop / 1e7;
      active = Math.abs(vDrop) > 1e-4;
    } else if (c.type === 'capacitor') {
      const cUf = Number(c.capacitance_uf ?? 100);
      const qUc = Math.abs(vDrop) * cUf;
      const energyMj = 0.5 * (cUf * 1e-6) * vDrop * vDrop * 1000;
      current = 0;
      active = Math.abs(vDrop) > 1e-3;
      status = `Charged: Q=${qUc.toFixed(1)} μC, E=${energyMj.toFixed(2)} mJ`;
    } else if (c.type === 'led' || c.type === 'diode') {
      const conducting = diodeStates.get(c.id) !== false;
      const vf = Number(c.forwardVoltage ?? def.defaults.forwardVoltage);
      const ron = Math.max(1, Number(c.resistance ?? def.defaults.resistance));
      if (conducting && vDrop > vf - 0.05) {
        current = Math.max(0, (vDrop - vf) / ron);
        active = current > 0.0005;
        status = 'Forward-Biased (Conducting)';
        if (c.type === 'led' && current > 0.035) {
          warnings.push(
            `${c.label || 'LED'} current is ${(current * 1000).toFixed(1)} mA (> 35 mA). Add a series resistor (e.g., 330 Ω) to protect the LED!`
          );
          status = 'Overcurrent Warning!';
        }
      } else {
        current = 0;
        active = false;
        status = vDrop < -0.05 ? 'Reverse-Biased (Blocked)' : 'Below Forward Voltage';
        if (vDrop < -0.05) {
          warnings.push(`${c.label || c.type.toUpperCase()} is reverse-biased — flip its connections so + faces the battery positive side.`);
        }
      }
    }

    const power = Math.abs(vDrop * current);
    componentResults[c.id] = {
      voltageDrop: Number(Math.abs(vDrop).toFixed(4)),
      signedVoltage: Number(vDrop.toFixed(4)),
      current: Number(Math.abs(current).toFixed(4)),
      power: Number(power.toFixed(4)),
      brightness: c.type === 'bulb' ? Math.min(1, power / 6) : c.type === 'led' ? Math.min(1, Math.abs(current) / 0.02) : 0,
      active,
      status,
    };
  });

  const hasOpenSwitch = components.some((c) => c.type === 'switch' && c.closed === false);
  const circuitClosed = totalSourceCurrent > 1e-5;
  if (!circuitClosed) {
    // Check if a voltmeter is accidentally wired in SERIES blocking all current
    const seriesVoltmeter = components.find(
      (c) =>
        c.type === 'voltmeter' &&
        componentResults[c.id]?.voltageDrop > totalVoltage * 0.85 &&
        (terminalWireCounts.get(`${c.id}:pos`) || 0) === 1 &&
        (terminalWireCounts.get(`${c.id}:neg`) || 0) === 1
    );
    if (seriesVoltmeter) {
      warnings.push(
        `Invalid Meter Connection: ${seriesVoltmeter.label || 'Voltmeter'} appears to be wired in SERIES, blocking current flow. Always connect a Voltmeter in PARALLEL across a component.`
      );
    } else if (hasOpenSwitch) {
      warnings.push('Circuit is open because a Switch is OFF. Click the switch or toggle it ON to close the loop.');
    } else {
      warnings.push('Open or incomplete circuit — connect a complete path from the Battery (+) terminal back to (−).');
    }
  }

  const req = circuitClosed ? totalVoltage / totalSourceCurrent : null;
  const loadCount = components.filter((c) => ['resistor', 'variable-resistor', 'bulb', 'led'].includes(c.type)).length;

  return {
    valid: errors.length === 0,
    circuitClosed,
    totalVoltage: Number(totalVoltage.toFixed(3)),
    totalCurrent: Number(totalSourceCurrent.toFixed(4)),
    equivalentResistance: req !== null ? Number(req.toFixed(3)) : null,
    totalPower: Number(totalSourcePower.toFixed(4)),
    componentResults,
    errors,
    warnings,
    topologySummary: circuitClosed
      ? `Closed DC Circuit (${loadCount} load${loadCount === 1 ? '' : 's'}) · Req = ${req.toFixed(2)} Ω`
      : 'Open Circuit (0 A)',
  };
}

export const CIRCUIT_PRESETS = {
  ohmsLaw: {
    name: "Ohm's Law (12 V + 100 Ω)",
    components: [
      { id: 'bat-1', type: 'battery', label: 'Battery 12V', x: 110, y: 180, rotation: 0, voltage: 12 },
      { id: 'res-1', type: 'resistor', label: 'Resistor 100Ω', x: 320, y: 120, rotation: 0, resistance: 100 },
      { id: 'amm-1', type: 'ammeter', label: 'Ammeter', x: 320, y: 245, rotation: 0 },
    ],
    wires: [
      { id: 'w-1', from: { componentId: 'bat-1', terminalId: 'pos' }, to: { componentId: 'res-1', terminalId: 'a' } },
      { id: 'w-2', from: { componentId: 'res-1', terminalId: 'b' }, to: { componentId: 'amm-1', terminalId: 'pos' } },
      { id: 'w-3', from: { componentId: 'amm-1', terminalId: 'neg' }, to: { componentId: 'bat-1', terminalId: 'neg' } },
    ],
  },
  series: {
    name: 'Series Circuit (R₁ + R₂ + Switch)',
    components: [
      { id: 'bat-1', type: 'battery', label: 'Battery 12V', x: 95, y: 185, rotation: 0, voltage: 12 },
      { id: 'sw-1', type: 'switch', label: 'Switch', x: 250, y: 95, rotation: 0, closed: true },
      { id: 'res-1', type: 'resistor', label: 'R₁ (40Ω)', x: 430, y: 95, rotation: 0, resistance: 40 },
      { id: 'bulb-1', type: 'bulb', label: 'Bulb (20Ω)', x: 430, y: 250, rotation: 0, resistance: 20 },
    ],
    wires: [
      { id: 'w-1', from: { componentId: 'bat-1', terminalId: 'pos' }, to: { componentId: 'sw-1', terminalId: 'a' } },
      { id: 'w-2', from: { componentId: 'sw-1', terminalId: 'b' }, to: { componentId: 'res-1', terminalId: 'a' } },
      { id: 'w-3', from: { componentId: 'res-1', terminalId: 'b' }, to: { componentId: 'bulb-1', terminalId: 'a' } },
      { id: 'w-4', from: { componentId: 'bulb-1', terminalId: 'b' }, to: { componentId: 'bat-1', terminalId: 'neg' } },
    ],
  },
  parallel: {
    name: 'Parallel Circuit (Two Branches)',
    components: [
      { id: 'bat-1', type: 'battery', label: 'Battery 12V', x: 100, y: 185, rotation: 0, voltage: 12 },
      { id: 'res-1', type: 'resistor', label: 'Branch R₁ (60Ω)', x: 330, y: 110, rotation: 0, resistance: 60 },
      { id: 'res-2', type: 'resistor', label: 'Branch R₂ (30Ω)', x: 330, y: 255, rotation: 0, resistance: 30 },
    ],
    wires: [
      { id: 'w-1', from: { componentId: 'bat-1', terminalId: 'pos' }, to: { componentId: 'res-1', terminalId: 'a' } },
      { id: 'w-2', from: { componentId: 'bat-1', terminalId: 'pos' }, to: { componentId: 'res-2', terminalId: 'a' } },
      { id: 'w-3', from: { componentId: 'res-1', terminalId: 'b' }, to: { componentId: 'bat-1', terminalId: 'neg' } },
      { id: 'w-4', from: { componentId: 'res-2', terminalId: 'b' }, to: { componentId: 'bat-1', terminalId: 'neg' } },
    ],
  },
  ledCircuit: {
    name: 'LED + Protective Resistor',
    components: [
      { id: 'bat-1', type: 'battery', label: 'Battery 9V', x: 100, y: 185, rotation: 0, voltage: 9 },
      { id: 'res-1', type: 'resistor', label: 'Resistor 330Ω', x: 280, y: 110, rotation: 0, resistance: 330 },
      { id: 'led-1', type: 'led', label: 'Red LED', x: 440, y: 185, rotation: 0, forwardVoltage: 2.0, resistance: 15, color: '#ef4444' },
      { id: 'sw-1', type: 'switch', label: 'Switch', x: 280, y: 260, rotation: 0, closed: true },
    ],
    wires: [
      { id: 'w-1', from: { componentId: 'bat-1', terminalId: 'pos' }, to: { componentId: 'res-1', terminalId: 'a' } },
      { id: 'w-2', from: { componentId: 'res-1', terminalId: 'b' }, to: { componentId: 'led-1', terminalId: 'pos' } },
      { id: 'w-3', from: { componentId: 'led-1', terminalId: 'neg' }, to: { componentId: 'sw-1', terminalId: 'a' } },
      { id: 'w-4', from: { componentId: 'sw-1', terminalId: 'b' }, to: { componentId: 'bat-1', terminalId: 'neg' } },
    ],
  },
};
