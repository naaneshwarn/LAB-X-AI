/**
 * Deterministic client-side Biology calculation engines (12 experiments),
 * mirroring backend/app/services/simulations/biology_sim.py.
 */

const round = (v, d = 4) => Number(Number(v).toFixed(d));

export const PLANT_ORGANELLES = [
  { name: 'Cell Wall', role: 'Rigid cellulose outer layer providing structural support and protection against osmotic bursting.', plantOnly: true },
  { name: 'Chloroplast', role: 'Site of photosynthesis converting light energy, CO₂, and H₂O into glucose and O₂.', plantOnly: true },
  { name: 'Central Vacuole', role: 'Large fluid sac maintaining turgor pressure and storing water, ions, and nutrients.', plantOnly: true },
  { name: 'Nucleus', role: 'Stores genomic DNA and coordinates transcription and cell reproduction.', plantOnly: false },
  { name: 'Mitochondrion', role: 'Generates ATP via aerobic cellular respiration.', plantOnly: false },
  { name: 'Endoplasmic Reticulum', role: 'Synthesizes and folds proteins (rough ER) and lipids (smooth ER).', plantOnly: false },
  { name: 'Golgi Apparatus', role: 'Modifies, sorts, and packages macromolecules for delivery.', plantOnly: false },
  { name: 'Plasma Membrane', role: 'Selectively permeable phospholipid bilayer regulating transport.', plantOnly: false },
];

export const ANIMAL_ORGANELLES = [
  { name: 'Nucleus', role: 'Houses linear chromosomes and regulates gene expression.' },
  { name: 'Mitochondrion', role: 'Produces ATP through oxidative phosphorylation to power cellular work.' },
  { name: 'Lysosome', role: 'Acidic digestive vesicles containing hydrolytic enzymes that recycle cellular waste.' },
  { name: 'Centrosome (Centrioles)', role: 'Organizes spindle microtubules during animal cell mitosis.' },
  { name: 'Ribosome', role: 'Translates mRNA codons into polypeptide chains.' },
  { name: 'Golgi Apparatus', role: 'Processes and packages proteins and lipids into vesicles.' },
  { name: 'Endoplasmic Reticulum', role: 'Network for protein synthesis (rough ER) and lipid/calcium regulation (smooth ER).' },
  { name: 'Plasma Membrane', role: 'Flexible lipid bilayer enabling endocytosis, signaling, and cell motility.' },
];

export function computePlantCell({ organelle_index = 1, cell_length = 50, water_potential = 1.2 }) {
  const idx = Math.max(0, Math.min(PLANT_ORGANELLES.length - 1, Math.round(Number(organelle_index))));
  const L = Number(cell_length);
  const wp = Number(water_potential);
  const org = PLANT_ORGANELLES[idx];
  const sa = 6 * L * L;
  const vol = L ** 3;
  const saV = 6 / L;
  const turgor = wp > 1.08 ? 'Turgid (Optimal)' : wp < 0.92 ? 'Plasmolyzed' : 'Flaccid (Isotonic)';
  const measurements = { organelle_name: org.name, organelle_role: org.role, plant_specific: org.plantOnly, surface_area_um2: round(sa, 1), volume_um3: round(vol, 1), sa_to_volume_ratio: round(saV, 4), turgor_state: turgor, organelle_index: idx };
  return {
    parameters: { organelle_index: idx, cell_length: L, water_potential: wp },
    measurements,
    formatted_measurements: [
      { key: 'organelle_name', label: 'Selected Organelle', value: org.name, unit: '' },
      { key: 'plant_specific', label: 'Plant-Specific?', value: org.plantOnly ? 'Yes' : 'Shared', unit: '' },
      { key: 'sa_to_volume_ratio', label: 'SA : Volume Ratio', value: measurements.sa_to_volume_ratio, unit: 'μm⁻¹' },
      { key: 'turgor_state', label: 'Osmotic State', value: turgor, unit: '' },
    ],
    series_data: Array.from({ length: 10 }, (_, i) => ({ side_um: 10 + i * 15, sa_to_vol: round(6 / (10 + i * 15), 4) })),
    conclusion_summary: `${org.name}: ${org.role} (SA:V = ${measurements.sa_to_volume_ratio} μm⁻¹, ${turgor}).`,
  };
}

export function computeAnimalCell({ organelle_index = 1, cell_radius = 12 }) {
  const idx = Math.max(0, Math.min(ANIMAL_ORGANELLES.length - 1, Math.round(Number(organelle_index))));
  const r = Number(cell_radius);
  const org = ANIMAL_ORGANELLES[idx];
  const sa = 4 * Math.PI * r * r;
  const vol = (4 / 3) * Math.PI * r ** 3;
  const saV = 3 / r;
  const measurements = { organelle_name: org.name, organelle_role: org.role, surface_area_um2: round(sa, 1), volume_um3: round(vol, 1), sa_to_volume_ratio: round(saV, 4), organelle_index: idx };
  return {
    parameters: { organelle_index: idx, cell_radius: r },
    measurements,
    formatted_measurements: [
      { key: 'organelle_name', label: 'Selected Organelle', value: org.name, unit: '' },
      { key: 'surface_area_um2', label: 'Surface Area (4πr²)', value: measurements.surface_area_um2, unit: 'μm²' },
      { key: 'volume_um3', label: 'Volume (4/3 πr³)', value: measurements.volume_um3, unit: 'μm³' },
      { key: 'sa_to_volume_ratio', label: 'SA : Volume (3/r)', value: measurements.sa_to_volume_ratio, unit: 'μm⁻¹' },
    ],
    series_data: Array.from({ length: 10 }, (_, i) => ({ radius_um: 5 + i * 7, sa_to_vol: round(3 / (5 + i * 7), 4) })),
    conclusion_summary: `${org.name}: ${org.role} (SA:V = ${measurements.sa_to_volume_ratio} μm⁻¹).`,
  };
}

export function computeDigestiveSystem({ enzyme = 1, ph = 2.0, temperature = 37, substrate_conc = 50 }) {
  const id = Math.round(Number(enzyme));
  const P = Number(ph), T = Number(temperature), S = Number(substrate_conc);
  const enz = [
    { name: 'Salivary Amylase (Mouth)', opt: 6.8, sig: 1.2, rxn: 'Starch → Maltose' },
    { name: 'Pepsin (Stomach)', opt: 2.0, sig: 1.0, rxn: 'Proteins → Peptides' },
    { name: 'Trypsin (Small Intestine)', opt: 8.0, sig: 1.2, rxn: 'Peptides → Amino Acids' },
  ][id] || { name: 'Pepsin (Stomach)', opt: 2.0, sig: 1.0, rxn: 'Proteins → Peptides' };
  const phF = Math.exp(-0.5 * ((P - enz.opt) / enz.sig) ** 2);
  const tF = T <= 37 ? Math.exp(-0.5 * ((T - 37) / 14) ** 2) : Math.max(0, Math.exp(-0.5 * ((T - 37) / 6.5) ** 2));
  const mm = S / (25 + S);
  const act = 100 * phF * tF * mm;
  const status = T > 55 ? 'Denatured (High Temp)' : act >= 55 ? 'Optimal Range' : 'Suboptimal Activity';
  const measurements = { enzyme_name: enz.name, reaction: enz.rxn, optimal_ph: enz.opt, relative_activity_pct: round(act, 2), ph_efficiency_pct: round(phF * 100, 1), status };
  return {
    parameters: { enzyme: id, ph: P, temperature: T, substrate_conc: S },
    measurements,
    formatted_measurements: [
      { key: 'enzyme_name', label: 'Enzyme', value: enz.name, unit: '' },
      { key: 'reaction', label: 'Catalyzed Breakdown', value: enz.rxn, unit: '' },
      { key: 'relative_activity_pct', label: 'Relative Activity', value: measurements.relative_activity_pct, unit: '%' },
      { key: 'optimal_ph', label: 'Optimum pH', value: enz.opt, unit: '' },
      { key: 'status', label: 'Status', value: status, unit: '' },
    ],
    series_data: Array.from({ length: 23 }, (_, i) => {
      const pPt = round(1 + i * 0.5, 1);
      return { ph: pPt, activity_pct: round(100 * Math.exp(-0.5 * ((pPt - enz.opt) / enz.sig) ** 2) * tF * mm, 1) };
    }),
    conclusion_summary: `${enz.name} shows ${measurements.relative_activity_pct}% activity at pH ${P} and ${T} °C (${status}).`,
  };
}

export function computePhotosynthesis({ light_intensity = 600, co2_ppm = 400, temperature = 25 }) {
  const L = Number(light_intensity), C = Number(co2_ppm), T = Number(temperature);
  const fL = L > 0 ? L / (L + 250) : 0;
  const fC = C > 0 ? C / (C + 300) : 0;
  const fT = T < 45 ? Math.max(0, Math.exp(-0.5 * ((T - 27) / 10) ** 2)) : Math.max(0, 0.1 * (50 - T) / 5);
  const o2 = 30 * Math.min(fL, fC) * fT;
  const gluc = o2 / 6;
  const minVal = Math.min(fL, fC, fT);
  const limiting = minVal === fL ? 'Light Intensity' : minVal === fC ? 'CO₂ Concentration' : 'Temperature (Enzymes)';
  const measurements = { o2_evolution_rate: round(o2, 3), glucose_synthesis_rate: round(gluc, 4), limiting_factor: limiting, light_saturation_pct: round(fL * 100, 1), co2_saturation_pct: round(fC * 100, 1) };
  return {
    parameters: { light_intensity: L, co2_ppm: C, temperature: T },
    measurements,
    formatted_measurements: [
      { key: 'o2_evolution_rate', label: 'O₂ Evolution Rate', value: measurements.o2_evolution_rate, unit: 'μmol/m²/s' },
      { key: 'glucose_synthesis_rate', label: 'Glucose Rate', value: measurements.glucose_synthesis_rate, unit: 'μmol/m²/s' },
      { key: 'limiting_factor', label: 'Limiting Factor', value: limiting, unit: '' },
      { key: 'light_saturation_pct', label: 'Light Factor', value: measurements.light_saturation_pct, unit: '%' },
    ],
    series_data: Array.from({ length: 11 }, (_, i) => {
      const lp = i * 200;
      return { light_intensity: lp, o2_rate: round(30 * Math.min(lp / (lp + 250), fC) * fT, 2) };
    }),
    conclusion_summary: `O₂ rate = ${measurements.o2_evolution_rate} μmol/m²/s (glucose ${measurements.glucose_synthesis_rate}); limited by ${limiting}.`,
  };
}

export function computeMitosisMeiosis({ diploid_number = 46, division_mode = 0, stage = 2 }) {
  const dn = Math.round(Number(diploid_number));
  const mode = Math.round(Number(division_mode));
  const st = Math.max(0, Math.min(4, Math.round(Number(stage))));
  if (dn % 2 !== 0 || dn < 2) throw new Error('Diploid number 2n must be an even integer ≥ 2.');
  const stages = ['Interphase (G₁)', 'Prophase (post-S)', 'Metaphase', 'Anaphase', 'Cytokinesis (Final)'];
  const n = dn / 2;
  const isMit = mode === 0;
  const daughters = isMit ? (st === 4 ? 2 : 1) : st === 4 ? 4 : st === 3 ? 2 : 1;
  const chrom = isMit ? dn : st === 4 ? n : dn;
  const dnaC = (isMit ? [2, 4, 4, 4, 2] : [2, 4, 4, 2, 1])[st];
  const chromatids = (isMit ? [dn, 2 * dn, 2 * dn, 2 * dn, dn] : [dn, 2 * dn, 2 * dn, dn, n])[st];
  const measurements = { mode_name: isMit ? 'Mitosis' : 'Meiosis (I & II)', stage_name: stages[st], daughter_cells: daughters, chromosomes_per_cell: chrom, chromatids_per_cell: chromatids, dna_content_c: dnaC, stage_index: st };
  return {
    parameters: { diploid_number: dn, division_mode: mode, stage: st },
    measurements,
    formatted_measurements: [
      { key: 'mode_name', label: 'Process', value: measurements.mode_name, unit: '' },
      { key: 'stage_name', label: 'Stage', value: stages[st], unit: '' },
      { key: 'chromosomes_per_cell', label: 'Chromosomes / Cell', value: chrom, unit: '' },
      { key: 'chromatids_per_cell', label: 'Chromatids / Cell', value: chromatids, unit: '' },
      { key: 'dna_content_c', label: 'DNA Ploidy', value: `${dnaC}C`, unit: '' },
      { key: 'daughter_cells', label: 'Cells', value: daughters, unit: '' },
    ],
    series_data: (isMit ? [2, 4, 4, 4, 2] : [2, 4, 4, 2, 1]).map((c, i) => ({ stage_index: i, dna_content_C: c })),
    conclusion_summary: `${measurements.mode_name} (${stages[st]}): ${chrom} chromosomes, ${dnaC}C DNA, ${daughters} cell(s).`,
  };
}

export function computeDnaReplication({ adenine_pct = 28, length_bp = 1050, replication_rate = 50 }) {
  const A = Number(adenine_pct), L = Math.round(Number(length_bp)), rate = Number(replication_rate);
  if (A <= 0 || A >= 50) throw new Error('Adenine % must be strictly between 0% and 50%.');
  const T = A, G = 50 - A, C = G, gc = G + C;
  const atPairs = Math.round((L * (A + T)) / 100);
  const gcPairs = L - atPairs;
  const hBonds = 2 * atPairs + 3 * gcPairs;
  const turns = L / 10.5;
  const nm = L * 0.34;
  const repTime = L / rate;
  const measurements = { adenine_pct: round(A, 1), thymine_pct: round(T, 1), guanine_pct: round(G, 1), cytosine_pct: round(C, 1), gc_content_pct: round(gc, 1), hydrogen_bonds: hBonds, helix_turns: round(turns, 2), helix_length_nm: round(nm, 1), replication_time_s: round(repTime, 2) };
  return {
    parameters: { adenine_pct: A, length_bp: L, replication_rate: rate },
    measurements,
    formatted_measurements: [
      { key: 'adenine_pct', label: 'Chargaff (A/T/G/C)', value: `${A}% / ${T}% / ${G}% / ${C}%`, unit: '' },
      { key: 'gc_content_pct', label: 'GC Content', value: measurements.gc_content_pct, unit: '%' },
      { key: 'hydrogen_bonds', label: 'Hydrogen Bonds', value: hBonds, unit: '' },
      { key: 'helix_turns', label: 'Helical Turns', value: measurements.helix_turns, unit: 'turns' },
      { key: 'helix_length_nm', label: 'Contour Length', value: measurements.helix_length_nm, unit: 'nm' },
      { key: 'replication_time_s', label: 'Replication Time', value: measurements.replication_time_s, unit: 's' },
    ],
    series_data: [
      { base: 'A', percentage: A }, { base: 'T', percentage: T }, { base: 'G', percentage: G }, { base: 'C', percentage: C },
    ],
    conclusion_summary: `Chargaff's rules give A=T=${A}%, G=C=${G}% (${hBonds} H-bonds, ${measurements.helix_length_nm} nm).`,
  };
}

export function computeCirculatorySystem({ heart_rate = 72, stroke_volume = 70, systolic_bp = 120, diastolic_bp = 80 }) {
  const hr = Number(heart_rate), sv = Number(stroke_volume), sbp = Number(systolic_bp), dbp = Number(diastolic_bp);
  if (sbp <= dbp) throw new Error('Systolic BP must exceed Diastolic BP.');
  const co = (hr * sv) / 1000;
  const pp = sbp - dbp;
  const map = dbp + pp / 3;
  const cycle = 60 / hr;
  const daily = co * 1440;
  const series_data = Array.from({ length: 25 }, (_, i) => {
    const ph = (i % 12) / 12;
    const pW = ph < 0.25 ? dbp + pp * Math.sin((ph / 0.25) * (Math.PI / 2)) : ph < 0.4 ? sbp - 0.35 * pp * ((ph - 0.25) / 0.15) : dbp + 0.65 * pp * Math.exp(-3 * (ph - 0.4));
    return { time_s: round((i * cycle) / 12, 3), pressure_mmHg: round(pW, 1) };
  });
  const measurements = { cardiac_output_l_min: round(co, 3), map_mmhg: round(map, 1), pulse_pressure_mmhg: round(pp, 1), cardiac_cycle_s: round(cycle, 3), daily_blood_pumped_l: Math.round(daily) };
  return {
    parameters: { heart_rate: hr, stroke_volume: sv, systolic_bp: sbp, diastolic_bp: dbp },
    measurements,
    formatted_measurements: [
      { key: 'cardiac_output_l_min', label: 'Cardiac Output (CO)', value: measurements.cardiac_output_l_min, unit: 'L/min' },
      { key: 'map_mmhg', label: 'Mean Arterial Pressure', value: measurements.map_mmhg, unit: 'mmHg' },
      { key: 'pulse_pressure_mmhg', label: 'Pulse Pressure', value: measurements.pulse_pressure_mmhg, unit: 'mmHg' },
      { key: 'cardiac_cycle_s', label: 'Cardiac Cycle', value: measurements.cardiac_cycle_s, unit: 's' },
      { key: 'daily_blood_pumped_l', label: 'Daily Volume', value: measurements.daily_blood_pumped_l, unit: 'L/day' },
    ],
    series_data,
    conclusion_summary: `CO = ${measurements.cardiac_output_l_min} L/min, MAP = ${measurements.map_mmhg} mmHg, Pulse Pressure = ${measurements.pulse_pressure_mmhg} mmHg.`,
  };
}

export function computeFoodChain({ producer_energy = 10000, transfer_efficiency = 10 }) {
  const E0 = Number(producer_energy), eff = Number(transfer_efficiency);
  const eta = eff / 100;
  const e1 = E0 * eta, e2 = e1 * eta, e3 = e2 * eta;
  const measurements = { producers_kcal: round(E0, 1), primary_consumers_kcal: round(e1, 1), secondary_consumers_kcal: round(e2, 2), tertiary_consumers_kcal: round(e3, 2), heat_loss_per_step_pct: round(100 - eff, 1) };
  return {
    parameters: { producer_energy: E0, transfer_efficiency: eff },
    measurements,
    formatted_measurements: [
      { key: 'producers_kcal', label: 'L1: Producers', value: measurements.producers_kcal, unit: 'kcal' },
      { key: 'primary_consumers_kcal', label: 'L2: Herbivores', value: measurements.primary_consumers_kcal, unit: 'kcal' },
      { key: 'secondary_consumers_kcal', label: 'L3: Secondary', value: measurements.secondary_consumers_kcal, unit: 'kcal' },
      { key: 'tertiary_consumers_kcal', label: 'L4: Apex Predators', value: measurements.tertiary_consumers_kcal, unit: 'kcal' },
      { key: 'heat_loss_per_step_pct', label: 'Heat Loss / Step', value: measurements.heat_loss_per_step_pct, unit: '%' },
    ],
    series_data: [
      { trophic_level: 1, energy_kcal: round(E0, 1) }, { trophic_level: 2, energy_kcal: round(e1, 1) },
      { trophic_level: 3, energy_kcal: round(e2, 2) }, { trophic_level: 4, energy_kcal: round(e3, 2) },
    ],
    conclusion_summary: `At ${eff}% efficiency, ${E0} kcal drops to ${measurements.tertiary_consumers_kcal} kcal by Level 4.`,
  };
}

export function computeMendelianGenetics({ parent_1 = 1, parent_2 = 1, offspring_count = 100 }) {
  const p1 = Math.round(Number(parent_1)), p2 = Math.round(Number(parent_2)), N = Math.round(Number(offspring_count));
  const map = { 0: ['A', 'A'], 1: ['A', 'a'], 2: ['a', 'a'] };
  const g1 = map[p1] || map[1], g2 = map[p2] || map[1];
  const counts = { AA: 0, Aa: 0, aa: 0 };
  const grid = [];
  g1.forEach((a1) => g2.forEach((a2) => {
    const geno = a1 === 'A' && a2 === 'A' ? 'AA' : a1 === 'a' && a2 === 'a' ? 'aa' : 'Aa';
    counts[geno] += 1;
    grid.push(geno);
  }));
  const domPct = ((counts.AA + counts.Aa) / 4) * 100;
  const recPct = (counts.aa / 4) * 100;
  const labels = ['AA', 'Aa', 'aa'];
  const measurements = {
    cross: `${labels[p1]} × ${labels[p2]}`, punnett_grid: grid, parent1_alleles: g1, parent2_alleles: g2,
    prob_AA_pct: counts.AA * 25, prob_Aa_pct: counts.Aa * 25, prob_aa_pct: counts.aa * 25,
    dominant_phenotype_pct: domPct, recessive_phenotype_pct: recPct,
    expected_dominant: round((domPct / 100) * N, 1), expected_recessive: round((recPct / 100) * N, 1),
  };
  return {
    parameters: { parent_1: p1, parent_2: p2, offspring_count: N },
    measurements,
    formatted_measurements: [
      { key: 'cross', label: 'Cross', value: measurements.cross, unit: '' },
      { key: 'prob_AA_pct', label: 'Genotype Ratio (AA:Aa:aa)', value: `${counts.AA}:${counts.Aa}:${counts.aa}`, unit: '' },
      { key: 'dominant_phenotype_pct', label: 'Dominant Phenotype', value: domPct, unit: '%' },
      { key: 'recessive_phenotype_pct', label: 'Recessive Phenotype', value: recPct, unit: '%' },
      { key: 'expected_dominant', label: `Expected (N=${N})`, value: `${measurements.expected_dominant} Dom / ${measurements.expected_recessive} Rec`, unit: '' },
    ],
    series_data: [
      { genotype: 'AA', probability_pct: counts.AA * 25 }, { genotype: 'Aa', probability_pct: counts.Aa * 25 }, { genotype: 'aa', probability_pct: counts.aa * 25 },
    ],
    conclusion_summary: `${measurements.cross} produces ${counts.AA} AA : ${counts.Aa} Aa : ${counts.aa} aa (${domPct}% dominant, ${recPct}% recessive).`,
  };
}

export function computeNaturalSelection({ initial_p = 0.2, fitness_AA = 1.0, fitness_Aa = 0.9, fitness_aa = 0.6, generations = 30 }) {
  const p0 = Number(initial_p), w1 = Number(fitness_AA), w2 = Number(fitness_Aa), w3 = Number(fitness_aa), G = Math.round(Number(generations));
  let p = p0, wBar = 1;
  const series_data = [{ generation: 0, p_dominant: round(p, 4), q_recessive: round(1 - p, 4) }];
  const step = Math.max(1, Math.floor(G / 20));
  for (let g = 1; g <= G; g += 1) {
    const q = 1 - p;
    wBar = p * p * w1 + 2 * p * q * w2 + q * q * w3;
    if (wBar <= 1e-12) break;
    p = (p * p * w1 + p * q * w2) / wBar;
    if (g % step === 0 || g === G) series_data.push({ generation: g, p_dominant: round(p, 4), q_recessive: round(1 - p, 4) });
  }
  const regime = w2 > w1 && w2 > w3 ? 'Balancing Selection (Heterozygote Advantage)' : p > p0 + 1e-3 ? 'Directional Selection for A' : p < p0 - 1e-3 ? 'Directional Selection for a' : 'Neutral';
  const measurements = { initial_p: round(p0, 3), final_p: round(p, 4), final_q: round(1 - p, 4), delta_p: round(p - p0, 4), mean_fitness: round(wBar, 4), selection_regime: regime };
  return {
    parameters: { initial_p: p0, fitness_AA: w1, fitness_Aa: w2, fitness_aa: w3, generations: G },
    measurements,
    formatted_measurements: [
      { key: 'final_p', label: `Final p (Gen ${G})`, value: measurements.final_p, unit: '' },
      { key: 'final_q', label: 'Final q', value: measurements.final_q, unit: '' },
      { key: 'delta_p', label: 'Net Shift (Δp)', value: measurements.delta_p, unit: '' },
      { key: 'mean_fitness', label: 'Mean Fitness (w̄)', value: measurements.mean_fitness, unit: '' },
      { key: 'selection_regime', label: 'Regime', value: regime, unit: '' },
    ],
    series_data,
    conclusion_summary: `${regime}: p shifted from ${p0} to ${measurements.final_p} over ${G} generations.`,
  };
}

export function computeCellularRespiration({ glucose_moles = 1, oxygen_availability = 100 }) {
  const g = Number(glucose_moles), o2 = Number(oxygen_availability);
  const aer = o2 / 100, ana = 1 - aer;
  const glyc = 2 * g, krebs = 2 * g * aer, ox = 28 * g * aer, tot = glyc + krebs + ox;
  const eff = ((tot * 30.5) / (g * 2870)) * 100;
  const pathway = o2 >= 99 ? 'Fully Aerobic Respiration' : o2 <= 1 ? 'Anaerobic Fermentation' : 'Mixed Aerobic / Anaerobic';
  const measurements = { pathway, total_atp_mol: round(tot, 2), glycolysis_atp: round(glyc, 2), krebs_atp: round(krebs, 2), oxphos_atp: round(ox, 2), o2_consumed_mol: round(6 * g * aer, 2), co2_released_mol: round(6 * g * aer, 2), lactate_mol: round(2 * g * ana, 2), energy_efficiency_pct: round(eff, 1) };
  return {
    parameters: { glucose_moles: g, oxygen_availability: o2 },
    measurements,
    formatted_measurements: [
      { key: 'pathway', label: 'Metabolic Mode', value: pathway, unit: '' },
      { key: 'total_atp_mol', label: 'Total Net ATP', value: measurements.total_atp_mol, unit: 'mol' },
      { key: 'oxphos_atp', label: 'OxPhos ATP', value: measurements.oxphos_atp, unit: 'mol' },
      { key: 'o2_consumed_mol', label: 'O₂ / CO₂', value: `${measurements.o2_consumed_mol} / ${measurements.co2_released_mol}`, unit: 'mol' },
      { key: 'energy_efficiency_pct', label: 'Energy Efficiency', value: measurements.energy_efficiency_pct, unit: '%' },
    ],
    series_data: [
      { stage: 'Glycolysis', atp_yield: measurements.glycolysis_atp },
      { stage: 'Citric Acid', atp_yield: measurements.krebs_atp },
      { stage: 'OxPhos', atp_yield: measurements.oxphos_atp },
    ],
    conclusion_summary: `${g} mol glucose at ${o2}% O₂ yields ${measurements.total_atp_mol} mol ATP (${measurements.energy_efficiency_pct}% efficiency).`,
  };
}

export function computePopulationGenetics({ allele_p = 0.6, population_size = 1000 }) {
  const p = Number(allele_p), N = Math.round(Number(population_size)), q = 1 - p;
  const fAA = p * p, fAa = 2 * p * q, faa = q * q;
  const measurements = { p: round(p, 3), q: round(q, 3), freq_AA: round(fAA, 4), freq_Aa: round(fAa, 4), freq_aa: round(faa, 4), count_AA: round(fAA * N, 1), count_Aa: round(fAa * N, 1), count_aa: round(faa * N, 1) };
  return {
    parameters: { allele_p: p, population_size: N },
    measurements,
    formatted_measurements: [
      { key: 'p', label: 'Alleles (p / q)', value: `${measurements.p} / ${measurements.q}`, unit: '' },
      { key: 'freq_AA', label: 'AA (p²)', value: `${measurements.freq_AA} (${measurements.count_AA})`, unit: '' },
      { key: 'freq_Aa', label: 'Aa (2pq)', value: `${measurements.freq_Aa} (${measurements.count_Aa})`, unit: '' },
      { key: 'freq_aa', label: 'aa (q²)', value: `${measurements.freq_aa} (${measurements.count_aa})`, unit: '' },
    ],
    series_data: Array.from({ length: 11 }, (_, i) => {
      const x = i / 10;
      return { p: x, p2_AA: round(x * x, 3), '2pq_Aa': round(2 * x * (1 - x), 3), q2_aa: round((1 - x) ** 2, 3) };
    }),
    conclusion_summary: `Hardy-Weinberg (p=${measurements.p}, N=${N}): ${measurements.count_AA} AA, ${measurements.count_Aa} Aa, ${measurements.count_aa} aa.`,
  };
}

export const RESPIRATORY_ORGANS = [
  { id: 'nose', name: 'Nose & Nasal Cavity', role: 'Filters dust with hairs and mucus, warms, and humidifies inhaled air before it enters the airways.' },
  { id: 'mouth', name: 'Mouth (Oral Cavity)', role: 'Secondary airway for breathing during speaking or heavy exercise when extra airflow is needed.' },
  { id: 'pharynx', name: 'Pharynx (Throat)', role: 'Shared muscular passage guiding air from the nasal and oral cavities toward the larynx.' },
  { id: 'larynx', name: 'Larynx (Voice Box)', role: 'Protects the airway with the epiglottis during swallowing and houses vocal cords for speech.' },
  { id: 'trachea', name: 'Trachea (Windpipe)', role: 'C-shaped cartilage-ringed tube that stays open and carries air down into the chest.' },
  { id: 'bronchi', name: 'Right & Left Bronchi', role: 'Two main airway branches splitting from the trachea into the right and left lungs.' },
  { id: 'bronchioles', name: 'Bronchioles', role: 'Fine branching air tubes inside the lungs that regulate airflow into tiny alveolar sacs.' },
  { id: 'lungs', name: 'Right & Left Lungs', role: 'Spongy, elastic thoracic organs that expand during inhalation and recoil during exhalation.' },
  { id: 'alveoli', name: 'Alveoli', role: 'Millions of microscopic thin-walled air sacs surrounded by capillaries where O₂ diffuses into blood and CO₂ diffuses out.' },
  { id: 'diaphragm', name: 'Diaphragm', role: 'Dome-shaped muscle beneath the lungs that flattens downward during inhalation to draw air in and relaxes upward during exhalation.' },
];

export function computeRespiratorySystem({ breathing_rate = 16, tidal_volume = 500, age_group = 1, organ_index = 8 }) {
  const f = Number(breathing_rate);
  const vt = Number(tidal_volume);
  const age = Math.max(0, Math.min(2, Math.round(Number(age_group))));
  const idx = Math.max(0, Math.min(RESPIRATORY_ORGANS.length - 1, Math.round(Number(organ_index))));
  if (f <= 0) throw new Error('Breathing rate must be positive.');
  const organ = RESPIRATORY_ORGANS[idx];
  const deadSpace = age === 0 ? 100 : 150;
  const ve = (f * vt) / 1000;
  const va = Math.max(0, (f * Math.max(0, vt - deadSpace)) / 1000);
  const cycle = 60 / f;
  const o2 = va * 1000 * 0.048;
  const co2 = o2 * 0.82;
  const ageMeta = [
    { label: 'Child (6–12 yrs)', lo: 18, hi: 30 },
    { label: 'Teen (13–17 yrs)', lo: 12, hi: 20 },
    { label: 'Adult (18+ yrs)', lo: 12, hi: 20 },
  ][age];
  const rateStatus =
    f < ageMeta.lo
      ? `Below typical resting range (${ageMeta.lo}–${ageMeta.hi} bpm for ${ageMeta.label})`
      : f > ageMeta.hi
      ? `Elevated above resting range (${ageMeta.lo}–${ageMeta.hi} bpm for ${ageMeta.label})`
      : `Normal resting rate (${ageMeta.lo}–${ageMeta.hi} bpm for ${ageMeta.label})`;

  const series_data = Array.from({ length: 25 }, (_, i) => {
    const t = (i * cycle * 2) / 24;
    const ph = (t % cycle) / cycle;
    const vol = 2400 + vt * 0.5 * (1 - Math.cos(2 * Math.PI * ph));
    return { time_s: round(t, 2), lung_volume_ml: round(vol, 1) };
  });

  const measurements = {
    organ_name: organ.name,
    organ_role: organ.role,
    minute_ventilation_l_min: round(ve, 2),
    alveolar_ventilation_l_min: round(va, 2),
    breath_cycle_s: round(cycle, 2),
    o2_uptake_ml_min: round(o2, 1),
    co2_output_ml_min: round(co2, 1),
    age_context: ageMeta.label,
    rate_status: rateStatus,
    organ_index: idx,
  };
  return {
    parameters: { breathing_rate: f, tidal_volume: vt, age_group: age, organ_index: idx },
    measurements,
    formatted_measurements: [
      { key: 'organ_name', label: 'Selected Structure', value: organ.name, unit: '' },
      { key: 'minute_ventilation_l_min', label: 'Minute Ventilation (V̇E)', value: measurements.minute_ventilation_l_min, unit: 'L/min' },
      { key: 'alveolar_ventilation_l_min', label: 'Alveolar Ventilation (V̇A)', value: measurements.alveolar_ventilation_l_min, unit: 'L/min' },
      { key: 'breath_cycle_s', label: 'Breath Cycle', value: measurements.breath_cycle_s, unit: 's' },
      { key: 'o2_uptake_ml_min', label: 'Est. O₂ Uptake', value: measurements.o2_uptake_ml_min, unit: 'mL/min' },
      { key: 'rate_status', label: 'Age Context', value: rateStatus, unit: '' },
    ],
    series_data,
    conclusion_summary: `At ${f} breaths/min and ${vt} mL tidal volume, V̇E = ${measurements.minute_ventilation_l_min} L/min (V̇A = ${measurements.alveolar_ventilation_l_min} L/min). Selected: ${organ.name}.`,
  };
}

export const NERVOUS_STRUCTURES = [
  { id: 'brain', name: 'Brain', role: 'Central command organ processing conscious thought, memory, sensory perception, and voluntary movement.' },
  { id: 'spinal-cord', name: 'Spinal Cord', role: 'Main neural highway inside the spine; integrates rapid protective spinal reflex arcs immediately.' },
  { id: 'peripheral', name: 'Peripheral Nerves', role: 'Bundles of sensory and motor axons linking the central nervous system to limbs, skin, and organs.' },
  { id: 'sensory', name: 'Sensory Neuron (Afferent)', role: 'Detects stimuli (heat, pressure, stretch) at receptors and transmits electrical impulses to the spinal cord.' },
  { id: 'motor', name: 'Motor Neuron (Efferent)', role: 'Carries command impulses from the spinal cord or brain to effector muscles to trigger movement.' },
];

export function computeNervousSystem({ stimulus_intensity = 70, myelination = 1, pathway_length_cm = 100, structure_index = 1 }) {
  const stim = Number(stimulus_intensity);
  const myel = Math.round(Number(myelination)) === 1 ? 1 : 0;
  const lenCm = Number(pathway_length_cm);
  const idx = Math.max(0, Math.min(NERVOUS_STRUCTURES.length - 1, Math.round(Number(structure_index))));
  const st = NERVOUS_STRUCTURES[idx];
  const fired = stim >= 30;
  const v = myel === 1 ? 80 : 2;
  const reflexMs = fired ? ((2 * (lenCm / 100)) / v) * 1000 + 2.0 : 0;
  const voluntaryMs = fired ? reflexMs + 165 : 0;
  const measurements = {
    structure_name: st.name,
    structure_role: st.role,
    action_potential_fired: fired,
    axon_type: myel === 1 ? 'Myelinated (Saltatory)' : 'Unmyelinated (Continuous)',
    conduction_velocity_ms: v,
    reflex_latency_ms: round(reflexMs, 2),
    voluntary_reaction_ms: round(voluntaryMs, 1),
    structure_index: idx,
  };
  return {
    parameters: { stimulus_intensity: stim, myelination: myel, pathway_length_cm: lenCm, structure_index: idx },
    measurements,
    formatted_measurements: [
      { key: 'structure_name', label: 'Selected Structure', value: st.name, unit: '' },
      { key: 'action_potential_fired', label: 'Action Potential', value: fired ? 'Fired (+35 mV)' : 'Below Threshold', unit: '' },
      { key: 'conduction_velocity_ms', label: 'Conduction Speed', value: v, unit: 'm/s' },
      { key: 'reflex_latency_ms', label: 'Spinal Reflex Time', value: measurements.reflex_latency_ms, unit: 'ms' },
      { key: 'voluntary_reaction_ms', label: 'Voluntary Reaction', value: measurements.voluntary_reaction_ms, unit: 'ms' },
    ],
    series_data: [
      { time_ms: 0.0, membrane_mv: -70 },
      { time_ms: 0.5, membrane_mv: round(-70 + (fired ? 15 : stim * 0.4), 1) },
      { time_ms: 1.0, membrane_mv: fired ? 35 : round(-70 + stim * 0.45, 1) },
      { time_ms: 1.8, membrane_mv: fired ? -55 : round(-70 + stim * 0.2, 1) },
      { time_ms: 2.6, membrane_mv: fired ? -80 : -70 },
      { time_ms: 4.0, membrane_mv: -70 },
    ],
    conclusion_summary: `${fired ? 'Action potential fired!' : 'Subthreshold stimulus (<30).'} Reflex latency = ${measurements.reflex_latency_ms} ms vs voluntary ${measurements.voluntary_reaction_ms} ms (${measurements.axon_type}).`,
  };
}
