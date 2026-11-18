/**
 * Deterministic client-side Chemistry calculation engines (12 experiments),
 * mirroring backend/app/services/simulations/chemistry_sim.py.
 */

const AVOGADRO = 6.02214076e23;
const FARADAY = 96485.33212;
const GAS_R = 8.314462618;
const GAS_R_ATM = 0.082057366;
const KB = 1.380649e-23;

const round = (v, d = 4) => Number(Number(v).toFixed(d));

export const ELEMENTS = {
  1: { symbol: 'H', name: 'Hydrogen', mass: 1.008, period: 1, group: 1, en: 2.2, ie: 1312, radius: 53, cat: 'Nonmetal', block: 's' },
  2: { symbol: 'He', name: 'Helium', mass: 4.003, period: 1, group: 18, en: 0, ie: 2372, radius: 31, cat: 'Noble Gas', block: 's' },
  3: { symbol: 'Li', name: 'Lithium', mass: 6.94, period: 2, group: 1, en: 0.98, ie: 520, radius: 167, cat: 'Alkali Metal', block: 's' },
  4: { symbol: 'Be', name: 'Beryllium', mass: 9.012, period: 2, group: 2, en: 1.57, ie: 900, radius: 112, cat: 'Alkaline Earth', block: 's' },
  5: { symbol: 'B', name: 'Boron', mass: 10.81, period: 2, group: 13, en: 2.04, ie: 801, radius: 87, cat: 'Metalloid', block: 'p' },
  6: { symbol: 'C', name: 'Carbon', mass: 12.011, period: 2, group: 14, en: 2.55, ie: 1086, radius: 67, cat: 'Nonmetal', block: 'p' },
  7: { symbol: 'N', name: 'Nitrogen', mass: 14.007, period: 2, group: 15, en: 3.04, ie: 1402, radius: 56, cat: 'Nonmetal', block: 'p' },
  8: { symbol: 'O', name: 'Oxygen', mass: 15.999, period: 2, group: 16, en: 3.44, ie: 1314, radius: 48, cat: 'Nonmetal', block: 'p' },
  9: { symbol: 'F', name: 'Fluorine', mass: 18.998, period: 2, group: 17, en: 3.98, ie: 1681, radius: 42, cat: 'Halogen', block: 'p' },
  10: { symbol: 'Ne', name: 'Neon', mass: 20.18, period: 2, group: 18, en: 0, ie: 2081, radius: 38, cat: 'Noble Gas', block: 'p' },
  11: { symbol: 'Na', name: 'Sodium', mass: 22.99, period: 3, group: 1, en: 0.93, ie: 496, radius: 190, cat: 'Alkali Metal', block: 's' },
  12: { symbol: 'Mg', name: 'Magnesium', mass: 24.305, period: 3, group: 2, en: 1.31, ie: 738, radius: 145, cat: 'Alkaline Earth', block: 's' },
  13: { symbol: 'Al', name: 'Aluminium', mass: 26.982, period: 3, group: 13, en: 1.61, ie: 578, radius: 118, cat: 'Post-Transition Metal', block: 'p' },
  14: { symbol: 'Si', name: 'Silicon', mass: 28.085, period: 3, group: 14, en: 1.9, ie: 787, radius: 111, cat: 'Metalloid', block: 'p' },
  15: { symbol: 'P', name: 'Phosphorus', mass: 30.974, period: 3, group: 15, en: 2.19, ie: 1012, radius: 98, cat: 'Nonmetal', block: 'p' },
  16: { symbol: 'S', name: 'Sulfur', mass: 32.06, period: 3, group: 16, en: 2.58, ie: 1000, radius: 88, cat: 'Nonmetal', block: 'p' },
  17: { symbol: 'Cl', name: 'Chlorine', mass: 35.45, period: 3, group: 17, en: 3.16, ie: 1251, radius: 79, cat: 'Halogen', block: 'p' },
  18: { symbol: 'Ar', name: 'Argon', mass: 39.948, period: 3, group: 18, en: 0, ie: 1521, radius: 71, cat: 'Noble Gas', block: 'p' },
  19: { symbol: 'K', name: 'Potassium', mass: 39.098, period: 4, group: 1, en: 0.82, ie: 419, radius: 243, cat: 'Alkali Metal', block: 's' },
  20: { symbol: 'Ca', name: 'Calcium', mass: 40.078, period: 4, group: 2, en: 1.0, ie: 590, radius: 194, cat: 'Alkaline Earth', block: 's' },
  21: { symbol: 'Sc', name: 'Scandium', mass: 44.956, period: 4, group: 3, en: 1.36, ie: 633, radius: 184, cat: 'Transition Metal', block: 'd' },
  22: { symbol: 'Ti', name: 'Titanium', mass: 47.867, period: 4, group: 4, en: 1.54, ie: 659, radius: 176, cat: 'Transition Metal', block: 'd' },
  23: { symbol: 'V', name: 'Vanadium', mass: 50.942, period: 4, group: 5, en: 1.63, ie: 651, radius: 171, cat: 'Transition Metal', block: 'd' },
  24: { symbol: 'Cr', name: 'Chromium', mass: 51.996, period: 4, group: 6, en: 1.66, ie: 653, radius: 166, cat: 'Transition Metal', block: 'd' },
  25: { symbol: 'Mn', name: 'Manganese', mass: 54.938, period: 4, group: 7, en: 1.55, ie: 717, radius: 161, cat: 'Transition Metal', block: 'd' },
  26: { symbol: 'Fe', name: 'Iron', mass: 55.845, period: 4, group: 8, en: 1.83, ie: 762, radius: 156, cat: 'Transition Metal', block: 'd' },
  27: { symbol: 'Co', name: 'Cobalt', mass: 58.933, period: 4, group: 9, en: 1.88, ie: 760, radius: 152, cat: 'Transition Metal', block: 'd' },
  28: { symbol: 'Ni', name: 'Nickel', mass: 58.693, period: 4, group: 10, en: 1.91, ie: 737, radius: 149, cat: 'Transition Metal', block: 'd' },
  29: { symbol: 'Cu', name: 'Copper', mass: 63.546, period: 4, group: 11, en: 1.9, ie: 745, radius: 145, cat: 'Transition Metal', block: 'd' },
  30: { symbol: 'Zn', name: 'Zinc', mass: 65.38, period: 4, group: 12, en: 1.65, ie: 906, radius: 142, cat: 'Transition Metal', block: 'd' },
  31: { symbol: 'Ga', name: 'Gallium', mass: 69.723, period: 4, group: 13, en: 1.81, ie: 579, radius: 136, cat: 'Post-Transition Metal', block: 'p' },
  32: { symbol: 'Ge', name: 'Germanium', mass: 72.63, period: 4, group: 14, en: 2.01, ie: 762, radius: 125, cat: 'Metalloid', block: 'p' },
  33: { symbol: 'As', name: 'Arsenic', mass: 74.922, period: 4, group: 15, en: 2.18, ie: 947, radius: 114, cat: 'Metalloid', block: 'p' },
  34: { symbol: 'Se', name: 'Selenium', mass: 78.971, period: 4, group: 16, en: 2.55, ie: 941, radius: 103, cat: 'Nonmetal', block: 'p' },
  35: { symbol: 'Br', name: 'Bromine', mass: 79.904, period: 4, group: 17, en: 2.96, ie: 1140, radius: 94, cat: 'Halogen', block: 'p' },
  36: { symbol: 'Kr', name: 'Krypton', mass: 83.798, period: 4, group: 18, en: 0, ie: 1351, radius: 88, cat: 'Noble Gas', block: 'p' },
};

function getShells(e) {
  if (e <= 0) return [0];
  if (e <= 2) return [e];
  if (e <= 10) return [2, e - 2];
  if (e <= 18) return [2, 8, e - 10];
  if (e <= 20) return [2, 8, 8, e - 18];
  if (e === 24) return [2, 8, 13, 1];
  if (e === 29) return [2, 8, 18, 1];
  if (e <= 30) return [2, 8, e - 12, 2];
  return [2, 8, 18, e - 28];
}

export function computeAtomicStructure({ protons = 6, neutrons = 6, charge = 0 }) {
  const Z = Math.round(Number(protons));
  const N = Math.round(Number(neutrons));
  const q = Math.round(Number(charge));
  if (Z < 1 || Z > 36) throw new Error('Atomic number Z must be between 1 and 36.');
  const electrons = Z - q;
  if (electrons < 0) throw new Error('Electrons cannot be negative.');
  const el = ELEMENTS[Z];
  const shells = getShells(electrons);
  const shellStr = shells.join(', ');
  const species = q === 0 ? 'Neutral Atom' : q > 0 ? 'Cation (+)' : 'Anion (−)';
  const measurements = {
    symbol: el.symbol, element_name: el.name, protons: Z, neutrons: N, electrons,
    mass_number: Z + N, charge: q, shells, shell_configuration: shellStr,
    valence_electrons: shells[shells.length - 1], species_type: species, category: el.cat,
  };
  return {
    parameters: { protons: Z, neutrons: N, charge: q },
    measurements,
    formatted_measurements: [
      { key: 'element_name', label: 'Element', value: `${el.name} (${el.symbol})`, unit: '' },
      { key: 'mass_number', label: 'Mass Number (A)', value: Z + N, unit: 'u' },
      { key: 'electrons', label: 'Electrons (e⁻)', value: electrons, unit: '' },
      { key: 'shell_configuration', label: 'Bohr Shells', value: shellStr, unit: '' },
      { key: 'valence_electrons', label: 'Valence e⁻', value: measurements.valence_electrons, unit: '' },
      { key: 'species_type', label: 'Species', value: species, unit: '' },
    ],
    series_data: shells.map((c, i) => ({ shell: i + 1, electrons: c, capacity: 2 * (i + 1) ** 2 })),
    conclusion_summary: `${el.name}-${Z + N} has Z=${Z}, N=${N}, ${electrons} e⁻ in shells [${shellStr}] (${species}).`,
  };
}

export function computePeriodicTable({ atomic_number = 11 }) {
  const Z = Math.round(Number(atomic_number));
  if (Z < 1 || Z > 36) throw new Error('Atomic number Z must be between 1 and 36.');
  const el = ELEMENTS[Z];
  const shells = getShells(Z);
  const series_data = Object.entries(ELEMENTS)
    .filter(([, v]) => v.period === el.period)
    .map(([k, v]) => ({ atomic_number: Number(k), ionization_energy: v.ie, atomic_radius: v.radius, electronegativity: v.en }));
  const measurements = {
    atomic_number: Z, symbol: el.symbol, element_name: el.name, atomic_mass: el.mass,
    period: el.period, group: el.group, block: el.block, category: el.cat,
    electronegativity: el.en, ionization_energy_kj: el.ie, atomic_radius_pm: el.radius, shells,
  };
  return {
    parameters: { atomic_number: Z },
    measurements,
    formatted_measurements: [
      { key: 'element_name', label: 'Element', value: `${el.name} (${el.symbol})`, unit: '' },
      { key: 'atomic_mass', label: 'Atomic Mass', value: el.mass, unit: 'u' },
      { key: 'period', label: 'Period / Group / Block', value: `P${el.period} · G${el.group} · ${el.block}`, unit: '' },
      { key: 'electronegativity', label: 'Electronegativity', value: el.en || 'N/A', unit: '' },
      { key: 'ionization_energy_kj', label: '1st Ionization Energy', value: el.ie, unit: 'kJ/mol' },
      { key: 'atomic_radius_pm', label: 'Atomic Radius', value: el.radius, unit: 'pm' },
    ],
    series_data,
    conclusion_summary: `${el.name} (Z=${Z}, ${el.cat}) sits in Period ${el.period}, Group ${el.group} (r=${el.radius} pm, IE₁=${el.ie} kJ/mol).`,
  };
}

export function computeAcidsBasesPh({ solution_type = 0, molarity = 0.01 }) {
  const st = Math.round(Number(solution_type));
  const C = Number(molarity);
  if (C <= 0) throw new Error('Molarity must be positive.');
  const kw = 1e-14;
  const ka = 1.8e-5;
  const names = ['Strong Acid (HCl)', 'Strong Base (NaOH)', 'Weak Acid (CH₃COOH)', 'Weak Base (NH₃)'];
  let h, oh;
  if (st === 0) { h = 0.5 * (C + Math.sqrt(C * C + 4 * kw)); oh = kw / h; }
  else if (st === 1) { oh = 0.5 * (C + Math.sqrt(C * C + 4 * kw)); h = kw / oh; }
  else if (st === 2) { h = Math.max(1e-7, 0.5 * (-ka + Math.sqrt(ka * ka + 4 * ka * C))); oh = kw / h; }
  else { oh = Math.max(1e-7, 0.5 * (-ka + Math.sqrt(ka * ka + 4 * ka * C))); h = kw / oh; }
  const ph = Math.max(0, Math.min(14, -Math.log10(h)));
  const poh = 14 - ph;
  const nature = ph < 6.8 ? 'Acidic' : ph > 7.2 ? 'Basic (Alkaline)' : 'Neutral';
  const series_data = [];
  for (let e = -6; e <= 0; e += 1) {
    const cp = 10 ** e;
    let phPt = 7;
    if (st === 0) phPt = -Math.log10(0.5 * (cp + Math.sqrt(cp * cp + 4 * kw)));
    else if (st === 1) phPt = 14 + Math.log10(0.5 * (cp + Math.sqrt(cp * cp + 4 * kw)));
    else if (st === 2) phPt = -Math.log10(Math.max(1e-7, 0.5 * (-ka + Math.sqrt(ka * ka + 4 * ka * cp))));
    else phPt = 14 + Math.log10(Math.max(1e-7, 0.5 * (-ka + Math.sqrt(ka * ka + 4 * ka * cp))));
    series_data.push({ log_molarity: e, ph: round(Math.max(0, Math.min(14, phPt)), 2) });
  }
  const measurements = { solution_name: names[st], ph: round(ph, 3), poh: round(poh, 3), h_concentration: h.toExponential(2), oh_concentration: oh.toExponential(2), nature };
  return {
    parameters: { solution_type: st, molarity: C },
    measurements,
    formatted_measurements: [
      { key: 'solution_name', label: 'Virtual Solution', value: names[st], unit: '' },
      { key: 'ph', label: 'pH (−log[H⁺])', value: measurements.ph, unit: '' },
      { key: 'poh', label: 'pOH (14 − pH)', value: measurements.poh, unit: '' },
      { key: 'h_concentration', label: '[H⁺] Concentration', value: measurements.h_concentration, unit: 'M' },
      { key: 'nature', label: 'Classification', value: nature, unit: '' },
    ],
    series_data,
    conclusion_summary: `${C} M ${names[st]} gives pH = ${measurements.ph} (pOH = ${measurements.poh}), classified as ${nature}.`,
  };
}

export function computeStatesOfMatter({ substance = 0, temperature = 25, pressure = 1.0 }) {
  const s = Math.round(Number(substance));
  const T = Number(temperature);
  const P = Number(pressure);
  const subs = [
    { name: 'Water (H₂O)', mp: 0, bp: 100, mm: 0.018015 },
    { name: 'Ethanol (C₂H₅OH)', mp: -114.1, bp: 78.37, mm: 0.04607 },
    { name: 'Nitrogen (N₂)', mp: -210, bp: -195.8, mm: 0.028014 },
    { name: 'Iron (Fe)', mp: 1538, bp: 2862, mm: 0.055845 },
  ][s] || { name: 'Water (H₂O)', mp: 0, bp: 100, mm: 0.018015 };
  const tk = T + 273.15;
  if (tk <= 0) throw new Error('Temperature must exceed absolute zero (−273.15 °C).');
  const bpAdj = subs.bp + 28 * Math.log(P);
  const phase = T < subs.mp - 0.5 ? 'Solid' : Math.abs(T - subs.mp) <= 0.5 ? 'Melting Point' : T < bpAdj - 0.5 ? 'Liquid' : Math.abs(T - bpAdj) <= 0.5 ? 'Boiling Point' : 'Gas';
  const keZj = 1.5 * KB * tk * 1e21;
  const vRms = Math.sqrt((3 * GAS_R * tk) / subs.mm);
  const series_data = [];
  for (let i = 0; i < 12; i += 1) {
    const tkPt = 50 + 50 * i;
    series_data.push({ temp_K: tkPt, v_rms: round(Math.sqrt((3 * GAS_R * tkPt) / subs.mm), 1) });
  }
  const measurements = {
    substance_name: subs.name, temperature_k: round(tk, 2), melting_point_c: round(subs.mp, 1),
    boiling_point_c: round(bpAdj, 1), phase, avg_kinetic_energy_zj: round(keZj, 3), rms_speed_ms: round(vRms, 1),
  };
  return {
    parameters: { substance: s, temperature: T, pressure: P },
    measurements,
    formatted_measurements: [
      { key: 'substance_name', label: 'Substance', value: subs.name, unit: '' },
      { key: 'phase', label: 'Physical State', value: phase, unit: '' },
      { key: 'temperature_k', label: 'Kelvin Temp', value: measurements.temperature_k, unit: 'K' },
      { key: 'boiling_point_c', label: 'Melting / Boiling', value: `${measurements.melting_point_c} / ${measurements.boiling_point_c}`, unit: '°C' },
      { key: 'avg_kinetic_energy_zj', label: 'Avg KE', value: measurements.avg_kinetic_energy_zj, unit: 'zJ' },
      { key: 'rms_speed_ms', label: 'Thermal v_rms', value: measurements.rms_speed_ms, unit: 'm/s' },
    ],
    series_data,
    conclusion_summary: `At ${T} °C (${measurements.temperature_k} K) and ${P} atm, ${subs.name} is in the ${phase} phase.`,
  };
}

export function computeReactionBalancing({ reaction_id = 0, coeff_1 = 2, coeff_2 = 1, coeff_3 = 2, coeff_4 = 1 }) {
  const id = Math.round(Number(reaction_id));
  const c1 = Math.round(Number(coeff_1));
  const c2 = Math.round(Number(coeff_2));
  const c3 = Math.round(Number(coeff_3));
  const c4 = Math.round(Number(coeff_4));
  const rxns = [
    { label: `${c1} H₂ + ${c2} O₂ → ${c3} H₂O`, r: [{ H: 2 }, { O: 2 }], p: [{ H: 2, O: 1 }], uses4: false },
    { label: `${c1} N₂ + ${c2} H₂ → ${c3} NH₃`, r: [{ N: 2 }, { H: 2 }], p: [{ N: 1, H: 3 }], uses4: false },
    { label: `${c1} CH₄ + ${c2} O₂ → ${c3} CO₂ + ${c4} H₂O`, r: [{ C: 1, H: 4 }, { O: 2 }], p: [{ C: 1, O: 2 }, { H: 2, O: 1 }], uses4: true },
    { label: `${c1} Fe + ${c2} O₂ → ${c3} Fe₂O₃`, r: [{ Fe: 1 }, { O: 2 }], p: [{ Fe: 2, O: 3 }], uses4: false },
  ];
  const rxn = rxns[id] || rxns[0];
  const rc = {}, pc = {};
  [c1, c2].forEach((c, idx) => Object.entries(rxn.r[idx]).forEach(([el, n]) => { rc[el] = (rc[el] || 0) + c * n; }));
  (rxn.uses4 ? [c3, c4] : [c3]).forEach((c, idx) => Object.entries(rxn.p[idx]).forEach(([el, n]) => { pc[el] = (pc[el] || 0) + c * n; }));
  const elems = [...new Set([...Object.keys(rc), ...Object.keys(pc)])].sort();
  const balanced = elems.every((e) => (rc[e] || 0) === (pc[e] || 0));
  const summary = elems.map((e) => `${e}: ${rc[e] || 0}→${pc[e] || 0}`).join(', ');
  const measurements = { equation_template: rxn.label, is_balanced: balanced, atom_summary: summary, reactant_atoms: rc, product_atoms: pc };
  return {
    parameters: { reaction_id: id, coeff_1: c1, coeff_2: c2, coeff_3: c3, coeff_4: c4 },
    measurements,
    formatted_measurements: [
      { key: 'equation_template', label: 'Current Equation', value: rxn.label, unit: '' },
      { key: 'is_balanced', label: 'Status', value: balanced ? 'Balanced ✓' : 'Unbalanced ✗', unit: '' },
      { key: 'atom_summary', label: 'Atom Tally (LHS → RHS)', value: summary, unit: '' },
    ],
    series_data: elems.map((e, idx) => ({ element_index: idx + 1, reactant_atoms: rc[e] || 0, product_atoms: pc[e] || 0 })),
    conclusion_summary: `${rxn.label} is ${balanced ? 'BALANCED' : 'NOT balanced'} (${summary}).`,
  };
}

export function computeMoleStoichiometry({ sample_mass = 18, molar_mass = 18, stoich_ratio = 2 }) {
  const m = Number(sample_mass);
  const M = Number(molar_mass);
  const r = Number(stoich_ratio);
  if (M <= 0) throw new Error('Molar mass must be positive.');
  const n = m / M;
  const particles = (n * AVOGADRO) / 1e23;
  const stp = n * 22.414;
  const prod = n * r;
  const measurements = { moles: round(n, 4), particles_1e23: round(particles, 3), stp_gas_volume_l: round(stp, 3), product_moles: round(prod, 4) };
  return {
    parameters: { sample_mass: m, molar_mass: M, stoich_ratio: r },
    measurements,
    formatted_measurements: [
      { key: 'moles', label: 'Moles (n = m/M)', value: measurements.moles, unit: 'mol' },
      { key: 'particles_1e23', label: 'Particles (N)', value: measurements.particles_1e23, unit: '×10²³' },
      { key: 'stp_gas_volume_l', label: 'STP Volume', value: measurements.stp_gas_volume_l, unit: 'L' },
      { key: 'product_moles', label: 'Product Moles', value: measurements.product_moles, unit: 'mol' },
    ],
    series_data: Array.from({ length: 11 }, (_, i) => ({ mass_g: round((m * i) / 10, 1), moles: round(((m * i) / 10) / M, 4) })),
    conclusion_summary: `${m} g (M=${M} g/mol) = ${measurements.moles} mol (${measurements.particles_1e23}×10²³ particles), yielding ${measurements.product_moles} mol product.`,
  };
}

export function computeChemicalBonding({ en_a = 0.95, en_b = 3.15, bond_order = 1 }) {
  const ea = Number(en_a);
  const eb = Number(en_b);
  const bo = Math.round(Number(bond_order));
  const dEn = Math.abs(ea - eb);
  const ionicPct = (1 - Math.exp(-0.25 * dEn * dEn)) * 100;
  const bondType = dEn < 0.4 ? 'Nonpolar Covalent' : dEn <= 1.7 ? 'Polar Covalent' : 'Ionic';
  const shared = bondType === 'Ionic' ? 0 : 2 * bo;
  const measurements = { delta_en: round(dEn, 3), ionic_character_pct: round(ionicPct, 2), covalent_character_pct: round(100 - ionicPct, 2), bond_type: bondType, bond_order: bo, shared_electrons: shared };
  return {
    parameters: { en_a: ea, en_b: eb, bond_order: bo },
    measurements,
    formatted_measurements: [
      { key: 'delta_en', label: 'Δχ Difference', value: measurements.delta_en, unit: '' },
      { key: 'bond_type', label: 'Bond Classification', value: bondType, unit: '' },
      { key: 'ionic_character_pct', label: 'Ionic Character', value: measurements.ionic_character_pct, unit: '%' },
      { key: 'covalent_character_pct', label: 'Covalent Character', value: measurements.covalent_character_pct, unit: '%' },
      { key: 'shared_electrons', label: 'Shared Electrons', value: shared, unit: 'e⁻' },
    ],
    series_data: Array.from({ length: 18 }, (_, i) => ({ delta_en: round(i * 0.2, 1), ionic_character_pct: round((1 - Math.exp(-0.25 * (i * 0.2) ** 2)) * 100, 1) })),
    conclusion_summary: `Δχ = ${measurements.delta_en} predicts a ${bondType} bond (${measurements.ionic_character_pct}% ionic character).`,
  };
}

export function computeConcentrationDilution({ initial_molarity = 2, initial_volume = 50, final_volume = 250, solute_molar_mass = 58 }) {
  const c1 = Number(initial_molarity);
  const v1 = Number(initial_volume);
  const v2 = Number(final_volume);
  const mm = Number(solute_molar_mass);
  if (v2 < v1) throw new Error('Final diluted volume (V₂) must be ≥ initial volume (V₁).');
  const c2 = (c1 * v1) / v2;
  const df = v2 / v1;
  const moles = c1 * (v1 / 1000);
  const mass = moles * mm;
  const measurements = { final_molarity: round(c2, 4), dilution_factor: round(df, 2), solvent_added_ml: round(v2 - v1, 1), moles_solute: round(moles, 5), solute_mass_g: round(mass, 3) };
  return {
    parameters: { initial_molarity: c1, initial_volume: v1, final_volume: v2, solute_molar_mass: mm },
    measurements,
    formatted_measurements: [
      { key: 'final_molarity', label: 'Final Molarity (C₂)', value: measurements.final_molarity, unit: 'M' },
      { key: 'dilution_factor', label: 'Dilution Factor', value: measurements.dilution_factor, unit: '×' },
      { key: 'solvent_added_ml', label: 'Solvent Added', value: measurements.solvent_added_ml, unit: 'mL' },
      { key: 'moles_solute', label: 'Conserved Moles', value: measurements.moles_solute, unit: 'mol' },
      { key: 'solute_mass_g', label: 'Solute Mass', value: measurements.solute_mass_g, unit: 'g' },
    ],
    series_data: Array.from({ length: 11 }, (_, i) => {
      const vp = v1 + ((v2 - v1) * i) / 10;
      return { volume_ml: round(vp, 1), molarity: round((c1 * v1) / vp, 4) };
    }),
    conclusion_summary: `Diluting ${v1} mL of ${c1} M to ${v2} mL yields C₂ = ${measurements.final_molarity} M (${measurements.dilution_factor}× dilution).`,
  };
}

export function computeChemicalEquilibrium({ kc = 4, conc_a = 1, conc_b = 1, conc_c = 0.2 }) {
  const Kc = Number(kc), a0 = Number(conc_a), b0 = Number(conc_b), c0 = Number(conc_c);
  const qc = (c0 * c0) / (a0 * b0);
  const qa = 4 - Kc, qb = 4 * c0 + Kc * (a0 + b0), qt = c0 * c0 - Kc * a0 * b0;
  let x = 0;
  const lo = -c0 / 2, hi = Math.min(a0, b0);
  if (Math.abs(qa) < 1e-9) x = -qt / qb;
  else {
    const disc = Math.max(0, qb * qb - 4 * qa * qt);
    const r1 = (-qb + Math.sqrt(disc)) / (2 * qa);
    const r2 = (-qb - Math.sqrt(disc)) / (2 * qa);
    x = r1 >= lo - 1e-6 && r1 <= hi + 1e-6 ? r1 : r2;
  }
  const shift = Math.abs(qc - Kc) < 1e-3 ? 'At Equilibrium' : qc < Kc ? 'Forward (Products Favored)' : 'Reverse (Reactants Favored)';
  const measurements = { qc: round(qc, 4), kc: round(Kc, 4), shift_direction: shift, a_eq: round(Math.max(0, a0 - x), 4), b_eq: round(Math.max(0, b0 - x), 4), c_eq: round(Math.max(0, c0 + 2 * x), 4) };
  return {
    parameters: { kc: Kc, conc_a: a0, conc_b: b0, conc_c: c0 },
    measurements,
    formatted_measurements: [
      { key: 'qc', label: 'Reaction Quotient (Qc)', value: measurements.qc, unit: '' },
      { key: 'shift_direction', label: 'Shift Direction', value: shift, unit: '' },
      { key: 'a_eq', label: 'Equilibrium [A]', value: measurements.a_eq, unit: 'M' },
      { key: 'b_eq', label: 'Equilibrium [B]', value: measurements.b_eq, unit: 'M' },
      { key: 'c_eq', label: 'Equilibrium [C]', value: measurements.c_eq, unit: 'M' },
    ],
    series_data: Array.from({ length: 13 }, (_, i) => {
      const xt = x * (1 - Math.exp(-0.4 * i));
      return { step: i, A: round(a0 - xt, 3), C: round(c0 + 2 * xt, 3) };
    }),
    conclusion_summary: `Qc = ${measurements.qc} vs Kc = ${Kc}: shifts ${shift} to [A]=${measurements.a_eq} M, [B]=${measurements.b_eq} M, [C]=${measurements.c_eq} M.`,
  };
}

export function computeElectrochemicalCells({ e_cathode = 0.34, e_anode = -0.76, electrons = 2, reaction_quotient = 1, temperature = 298.15 }) {
  const ec = Number(e_cathode), ea = Number(e_anode), n = Math.round(Number(electrons)), Q = Number(reaction_quotient), T = Number(temperature);
  if (Q <= 0) throw new Error('Reaction quotient Q must be positive.');
  const e0 = ec - ea;
  const eCell = e0 - ((GAS_R * T) / (n * FARADAY)) * Math.log(Q);
  const dG = (-n * FARADAY * eCell) / 1000;
  const spont = eCell > 0;
  const measurements = { e0_cell_v: round(e0, 4), e_cell_v: round(eCell, 4), delta_g_kj: round(dG, 2), spontaneous: spont, cell_type: spont ? 'Galvanic (Spontaneous)' : 'Electrolytic (Non-spontaneous)' };
  return {
    parameters: { e_cathode: ec, e_anode: ea, electrons: n, reaction_quotient: Q, temperature: T },
    measurements,
    formatted_measurements: [
      { key: 'e0_cell_v', label: 'Standard E°_cell', value: measurements.e0_cell_v, unit: 'V' },
      { key: 'e_cell_v', label: 'Nernst E_cell', value: measurements.e_cell_v, unit: 'V' },
      { key: 'delta_g_kj', label: 'Gibbs Free Energy ΔG', value: measurements.delta_g_kj, unit: 'kJ/mol' },
      { key: 'cell_type', label: 'Thermodynamic Mode', value: measurements.cell_type, unit: '' },
    ],
    series_data: Array.from({ length: 9 }, (_, i) => {
      const lq = i - 4;
      return { log10_Q: lq, e_cell_V: round(e0 - ((GAS_R * T) / (n * FARADAY)) * Math.log(10 ** lq), 4) };
    }),
    conclusion_summary: `E°_cell = ${measurements.e0_cell_v} V; Nernst gives E_cell = ${measurements.e_cell_v} V and ΔG = ${measurements.delta_g_kj} kJ/mol.`,
  };
}

export function computeReactionKinetics({ activation_energy = 50, temperature = 300, initial_conc = 1, pre_exponential = 1e7 }) {
  const Ea = Number(activation_energy), T = Number(temperature), a0 = Number(initial_conc), A = Number(pre_exponential);
  const k = Math.max(1e-12, A * Math.exp(-(Ea * 1000) / (GAS_R * T)));
  const tHalf = Math.LN2 / k;
  const r0 = k * a0;
  const span = Math.min(10000, Math.max(1, 4 * tHalf));
  const measurements = { rate_constant_k: k.toExponential(3), half_life_s: round(tHalf, 4), initial_rate: r0.toExponential(3), conc_after_one_halflife: round(a0 / 2, 4) };
  return {
    parameters: { activation_energy: Ea, temperature: T, initial_conc: a0, pre_exponential: A },
    measurements,
    formatted_measurements: [
      { key: 'rate_constant_k', label: 'Rate Constant (k)', value: measurements.rate_constant_k, unit: 's⁻¹' },
      { key: 'half_life_s', label: 'Half-Life (t₁/₂)', value: measurements.half_life_s, unit: 's' },
      { key: 'initial_rate', label: 'Initial Rate (r₀)', value: measurements.initial_rate, unit: 'M/s' },
      { key: 'conc_after_one_halflife', label: '[A] at t₁/₂', value: measurements.conc_after_one_halflife, unit: 'M' },
    ],
    series_data: Array.from({ length: 17 }, (_, i) => {
      const tp = (span * i) / 16;
      return { time_s: round(tp, 2), concentration_M: round(a0 * Math.exp(-k * tp), 4) };
    }),
    conclusion_summary: `At T=${T} K and Ea=${Ea} kJ/mol, k = ${measurements.rate_constant_k} s⁻¹ and first-order t₁/₂ = ${measurements.half_life_s} s.`,
  };
}

export function computeGasLaws({ moles = 1, volume = 22.4, temperature = 298.15 }) {
  const n = Number(moles), V = Number(volume), T = Number(temperature);
  const a = 3.592, b = 0.04267;
  if (V <= n * b + 0.05) throw new Error(`Volume must exceed excluded molecular volume (${round(n * b + 0.05, 2)} L).`);
  const pIdeal = (n * GAS_R_ATM * T) / V;
  const pVdw = (n * GAS_R_ATM * T) / (V - n * b) - a * (n / V) ** 2;
  const Z = (pVdw * V) / (n * GAS_R_ATM * T);
  const dev = ((pVdw - pIdeal) / pIdeal) * 100;
  const measurements = { p_ideal_atm: round(pIdeal, 4), p_vdw_atm: round(pVdw, 4), compressibility_z: round(Z, 4), deviation_pct: round(dev, 2) };
  return {
    parameters: { moles: n, volume: V, temperature: T },
    measurements,
    formatted_measurements: [
      { key: 'p_ideal_atm', label: 'Ideal Pressure (PV=nRT)', value: measurements.p_ideal_atm, unit: 'atm' },
      { key: 'p_vdw_atm', label: 'van der Waals Pressure', value: measurements.p_vdw_atm, unit: 'atm' },
      { key: 'compressibility_z', label: 'Compressibility (Z)', value: measurements.compressibility_z, unit: '' },
      { key: 'deviation_pct', label: 'Real-Gas Deviation', value: measurements.deviation_pct, unit: '%' },
    ],
    series_data: Array.from({ length: 14 }, (_, i) => {
      const vp = n * b + 0.2 + ((Math.max(30, V) - (n * b + 0.2)) * (i + 1)) / 14;
      return { volume_L: round(vp, 2), p_ideal_atm: round((n * GAS_R_ATM * T) / vp, 3), p_vdw_atm: round((n * GAS_R_ATM * T) / (vp - n * b) - a * (n / vp) ** 2, 3) };
    }),
    conclusion_summary: `P_ideal = ${measurements.p_ideal_atm} atm vs P_vdW = ${measurements.p_vdw_atm} atm (Z = ${measurements.compressibility_z}).`,
  };
}

export const CONTROLLED_REACTIONS = [
  {
    id: 0,
    name: 'Acid-Base Neutralization',
    reactantA: 'HCl (Hydrochloric Acid)',
    reactantB: 'NaOH (Sodium Hydroxide)',
    equation: 'HCl + NaOH → NaCl + H₂O',
    stoich: [1, 1, 1],
    deltaH: -57.3,
    requiresHeat: false,
    effect: 'neutralization',
    liquidColor: '#22c55e',
    energyType: 'Exothermic',
    condition: 'Room temperature (25 °C), aqueous mixing',
    observation: 'Clear solution warms gently; universal indicator shifts toward neutral green (pH ≈ 7).',
  },
  {
    id: 1,
    name: 'Zinc + Hydrochloric Acid',
    reactantA: 'Zn (Zinc Granules)',
    reactantB: 'HCl (Dilute Acid)',
    equation: 'Zn + 2 HCl → ZnCl₂ + H₂↑',
    stoich: [1, 2, 1],
    deltaH: -153.9,
    requiresHeat: false,
    effect: 'bubbles',
    liquidColor: '#38bdf8',
    energyType: 'Exothermic',
    condition: 'Room temperature, test tube or conical flask',
    observation: 'Brisk effervescence (H₂ gas bubbles) rises rapidly as zinc reacts and warms the flask.',
  },
  {
    id: 2,
    name: 'Silver Chloride Precipitation',
    reactantA: 'AgNO₃ (Silver Nitrate)',
    reactantB: 'NaCl (Sodium Chloride)',
    equation: 'AgNO₃ + NaCl → AgCl↓ + NaNO₃',
    stoich: [1, 1, 1],
    deltaH: -65.5,
    requiresHeat: false,
    effect: 'precipitate',
    liquidColor: '#e2e8f0',
    energyType: 'Exothermic',
    condition: 'Room temperature, double displacement',
    observation: 'Instant curdy white precipitate of insoluble AgCl forms and settles at the bottom.',
  },
  {
    id: 3,
    name: 'Marble (CaCO₃) + Acid',
    reactantA: 'CaCO₃ (Marble Chips)',
    reactantB: 'HCl (Hydrochloric Acid)',
    equation: 'CaCO₃ + 2 HCl → CaCl₂ + H₂O + CO₂↑',
    stoich: [1, 2, 1],
    deltaH: -15.2,
    requiresHeat: false,
    effect: 'bubbles',
    liquidColor: '#bae6fd',
    energyType: 'Exothermic',
    condition: 'Room temperature, aqueous acid on carbonate',
    observation: 'Vigorous fizzing releases CO₂ gas bubbles (which turn limewater milky).',
  },
  {
    id: 4,
    name: 'Magnesium Combustion',
    reactantA: 'Mg (Magnesium Ribbon)',
    reactantB: 'O₂ (Oxygen Gas)',
    equation: '2 Mg + O₂ → 2 MgO',
    stoich: [2, 1, 2],
    deltaH: -1203.4,
    requiresHeat: true,
    effect: 'bright_flame',
    liquidColor: '#fef08a',
    energyType: 'Strongly Exothermic',
    condition: 'Requires Bunsen burner ignition',
    observation: 'Burns with a dazzling bright white glow producing white magnesium oxide (MgO) ash.',
  },
  {
    id: 5,
    name: 'Thermal Decomposition of CaCO₃',
    reactantA: 'CaCO₃ (Limestone)',
    reactantB: 'Thermal Heat (Δ)',
    equation: 'CaCO₃ → CaO + CO₂↑ (with heat)',
    stoich: [1, 1, 1],
    deltaH: 178.3,
    requiresHeat: true,
    effect: 'endothermic_gas',
    liquidColor: '#cbd5e1',
    energyType: 'Endothermic',
    condition: 'Requires continuous Bunsen burner heating',
    observation: 'Absorbs Bunsen heat to decompose limestone into quicklime (CaO) and CO₂ gas.',
  },
];

export function computeChemicalReactionPlayground({ reaction_id = 0, moles_a = 0.2, moles_b = 0.2, heat_on = 0 }) {
  const idx = Math.max(0, Math.min(CONTROLLED_REACTIONS.length - 1, Math.round(Number(reaction_id))));
  const nA = Number(moles_a);
  const nB = Number(moles_b);
  const heat = Math.round(Number(heat_on)) === 1 ? 1 : 0;
  const rxn = CONTROLLED_REACTIONS[idx];
  const [aC, bC, pC] = rxn.stoich;
  const occurs = !rxn.requiresHeat || heat === 1;
  let extent = 0;
  let limiting = 'Activation heat required (turn ON Bunsen burner)';
  if (occurs) {
    const extA = nA / aC;
    const extB = idx === 5 ? extA : nB / bC;
    extent = Math.min(extA, extB);
    limiting =
      idx === 5
        ? 'CaCO₃ (single reactant)'
        : Math.abs(extA - extB) < 1e-6
        ? 'Stoichiometric equivalence'
        : extA < extB
        ? 'Reactant A (limiting)'
        : 'Reactant B (limiting)';
  }
  const prodMoles = extent * pC;
  const heatKj = extent * rxn.deltaH;
  const dT = idx <= 3 ? -heatKj / 1.046 : occurs ? -heatKj / 10.0 : 0;
  const finalT = Math.max(5, Math.min(900, 25 + dT));
  const measurements = {
    reaction_name: rxn.name,
    equation: rxn.equation,
    reaction_occurs: occurs,
    limiting_reagent: limiting,
    product_moles: round(prodMoles, 4),
    enthalpy_change_kj: round(heatKj, 2),
    final_temp_c: round(finalT, 1),
    energy_type: rxn.energyType,
    observable_change: occurs ? rxn.observation : 'No reaction yet — turn ON the Bunsen burner to provide heat.',
  };
  return {
    parameters: { reaction_id: idx, moles_a: nA, moles_b: nB, heat_on: heat },
    measurements,
    formatted_measurements: [
      { key: 'equation', label: 'Balanced Equation', value: rxn.equation, unit: '' },
      { key: 'product_moles', label: 'Primary Product Yield', value: measurements.product_moles, unit: 'mol' },
      { key: 'enthalpy_change_kj', label: 'Heat Change (ΔH)', value: measurements.enthalpy_change_kj, unit: 'kJ' },
      { key: 'final_temp_c', label: 'Thermometer Reading', value: measurements.final_temp_c, unit: '°C' },
      { key: 'limiting_reagent', label: 'Limiting Factor', value: limiting, unit: '' },
    ],
    series_data: [
      { stage: 'Initial A', moles: round(nA, 3) },
      { stage: 'Initial B', moles: round(nB, 3) },
      { stage: 'Product', moles: round(prodMoles, 3) },
      { stage: 'Excess A', moles: round(Math.max(0, nA - extent * aC), 3) },
    ],
    conclusion_summary: `${rxn.equation}: yields ${measurements.product_moles} mol product, ΔH = ${measurements.enthalpy_change_kj} kJ (${rxn.energyType}).`,
  };
}
