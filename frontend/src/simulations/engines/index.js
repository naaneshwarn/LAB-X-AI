/**
 * Unified Client-Side Deterministic Simulation Dispatcher for all 48 LabXAI Experiments.
 * Preserves existing Physics computations from ../physics.js and integrates all
 * Physics, Chemistry, Biology, and Mathematics calculation modules.
 */

import {
  computeConvexLens,
  computeOhmsLaw,
  computeProjectileMotion,
  computeSimplePendulum,
} from '../physics';
import {
  computeEMInduction,
  computeNewtonsLaws,
  computePhotoelectricEffect,
  computeReflectionOfLight,
  computeRefractionOfLight,
  computeSeriesParallel,
  computeThermodynamicProcesses,
  computeWaveInterference,
} from './physicsExtra';
import {
  computeAcidsBasesPh,
  computeAtomicStructure,
  computeChemicalBonding,
  computeChemicalEquilibrium,
  computeChemicalReactionPlayground,
  computeConcentrationDilution,
  computeElectrochemicalCells,
  computeGasLaws,
  computeMoleStoichiometry,
  computePeriodicTable,
  computeReactionBalancing,
  computeReactionKinetics,
  computeStatesOfMatter,
} from './chemistry';
import {
  computeAnimalCell,
  computeCellularRespiration,
  computeCirculatorySystem,
  computeDigestiveSystem,
  computeDnaReplication,
  computeFoodChain,
  computeMendelianGenetics,
  computeMitosisMeiosis,
  computeNaturalSelection,
  computeNervousSystem,
  computePhotosynthesis,
  computePlantCell,
  computePopulationGenetics,
  computeRespiratorySystem,
} from './biology';
import {
  compute3DGeometry,
  computeAlgebraicExpressions,
  computeBasicGeometry,
  computeCoordinateGeometry,
  computeDifferentialCalculus,
  computeFractionsDecimals,
  computeIntegralCalculus,
  computeMatrices,
  computeNumberSystems,
  computeProbabilityStats,
  computeQuadraticEquations,
  computeTrigonometricFunctions,
} from './math';

export const CLIENT_SIMULATION_REGISTRY = {
  // Physics (12)
  'ohms-law': computeOhmsLaw,
  'simple-pendulum': computeSimplePendulum,
  'reflection-of-light': computeReflectionOfLight,
  'refraction-of-light': computeRefractionOfLight,
  'projectile-motion': computeProjectileMotion,
  'convex-lens': computeConvexLens,
  'series-parallel-circuits': computeSeriesParallel,
  'newtons-laws': computeNewtonsLaws,
  'electromagnetic-induction': computeEMInduction,
  'wave-interference': computeWaveInterference,
  'thermodynamic-processes': computeThermodynamicProcesses,
  'photoelectric-effect': computePhotoelectricEffect,
  // Chemistry (12)
  'atomic-structure': computeAtomicStructure,
  'periodic-table-explorer': computePeriodicTable,
  'acids-bases-ph': computeAcidsBasesPh,
  'chemical-reaction-playground': computeChemicalReactionPlayground,
  'states-of-matter': computeStatesOfMatter,
  'reaction-balancing': computeReactionBalancing,
  'mole-stoichiometry': computeMoleStoichiometry,
  'chemical-bonding': computeChemicalBonding,
  'concentration-dilution': computeConcentrationDilution,
  'chemical-equilibrium': computeChemicalEquilibrium,
  'electrochemical-cells': computeElectrochemicalCells,
  'reaction-kinetics': computeReactionKinetics,
  'gas-laws-thermodynamics': computeGasLaws,
  // Biology (14)
  'plant-cell-structure': computePlantCell,
  'animal-cell-structure': computeAnimalCell,
  'human-respiratory-system': computeRespiratorySystem,
  'human-digestive-system': computeDigestiveSystem,
  photosynthesis: computePhotosynthesis,
  'mitosis-meiosis': computeMitosisMeiosis,
  'dna-structure-replication': computeDnaReplication,
  'human-circulatory-system': computeCirculatorySystem,
  'human-nervous-system': computeNervousSystem,
  'food-chain-ecosystem': computeFoodChain,
  'mendelian-genetics': computeMendelianGenetics,
  'natural-selection-evolution': computeNaturalSelection,
  'cellular-respiration': computeCellularRespiration,
  'population-genetics': computePopulationGenetics,
  // Mathematics (12)
  'number-systems': computeNumberSystems,
  'fractions-decimals': computeFractionsDecimals,
  'basic-geometry': computeBasicGeometry,
  'algebraic-expressions': computeAlgebraicExpressions,
  'trigonometric-functions': computeTrigonometricFunctions,
  'coordinate-geometry': computeCoordinateGeometry,
  'probability-statistics': computeProbabilityStats,
  'quadratic-equations': computeQuadraticEquations,
  'differential-calculus': computeDifferentialCalculus,
  'integral-calculus': computeIntegralCalculus,
  'matrices-linear-algebra': computeMatrices,
  'three-dimensional-geometry': compute3DGeometry,
};

export const CHART_CONFIG_BY_EXPERIMENT = {
  // Physics
  'ohms-law': { type: 'line', xKey: 'voltage', yKey: 'current', xLabel: 'Voltage (V)', yLabel: 'Current (A)', color: '#2563eb' },
  'simple-pendulum': { type: 'line', xKey: 'length', yKey: 'period', xLabel: 'Length (m)', yLabel: 'Period T (s)', color: '#2563eb' },
  'reflection-of-light': { type: 'line', xKey: 'incident_angle', yKey: 'deviation', xLabel: 'Incident Angle (°)', yLabel: 'Deviation δ (°)', color: '#2563eb' },
  'refraction-of-light': { type: 'line', xKey: 'incident_angle', yKey: 'refracted_angle', xLabel: 'Incident Angle (°)', yLabel: 'Refracted Angle (°)', color: '#2563eb' },
  'projectile-motion': { type: 'line', xKey: 'x', yKey: 'y', xLabel: 'Range x (m)', yLabel: 'Height y (m)', color: '#0891b2' },
  'convex-lens': { type: 'line', xKey: 'object_distance', yKey: 'image_distance', xLabel: 'Object |u| (cm)', yLabel: 'Image v (cm)', color: '#2563eb' },
  'series-parallel-circuits': { type: 'line', xKey: 'voltage', yKey: 'parallel_current', y2Key: 'series_current', xLabel: 'Voltage (V)', yLabel: 'Parallel vs Series I (A)', color: '#2563eb' },
  'newtons-laws': { type: 'line', xKey: 'time', yKey: 'displacement', y2Key: 'velocity', xLabel: 'Time (s)', yLabel: 'Displacement (m) & Velocity (m/s)', color: '#2563eb' },
  'electromagnetic-induction': { type: 'line', xKey: 'time', yKey: 'emf', xLabel: 'Time (s)', yLabel: 'Induced EMF (V)', color: '#2563eb' },
  'wave-interference': { type: 'line', xKey: 'position_mm', yKey: 'intensity', y2Key: 'envelope', xLabel: 'Screen Position (mm)', yLabel: 'Relative Intensity', color: '#2563eb' },
  'thermodynamic-processes': { type: 'line', xKey: 'volume_L', yKey: 'pressure_kPa', xLabel: 'Volume (L)', yLabel: 'Pressure (kPa)', color: '#2563eb' },
  'photoelectric-effect': { type: 'line', xKey: 'frequency_THz', yKey: 'k_max_eV', xLabel: 'Frequency (THz)', yLabel: 'K_max (eV)', color: '#2563eb' },
  // Chemistry
  'atomic-structure': { type: 'bar', xKey: 'shell', yKey: 'electrons', xLabel: 'Shell n', yLabel: 'Electrons', color: '#7c3aed' },
  'periodic-table-explorer': { type: 'line', xKey: 'atomic_number', yKey: 'ionization_energy', xLabel: 'Atomic Number Z', yLabel: '1st Ionization Energy (kJ/mol)', color: '#7c3aed' },
  'acids-bases-ph': { type: 'line', xKey: 'log_molarity', yKey: 'ph', xLabel: 'log₁₀(Molarity)', yLabel: 'pH', color: '#22c55e' },
  'chemical-reaction-playground': { type: 'bar', xKey: 'stage', yKey: 'moles', xLabel: 'Reaction Stage', yLabel: 'Moles (mol)', color: '#22c55e' },
  'states-of-matter': { type: 'line', xKey: 'temp_K', yKey: 'v_rms', xLabel: 'Temperature (K)', yLabel: 'Thermal v_rms (m/s)', color: '#7c3aed' },
  'reaction-balancing': { type: 'bar', xKey: 'element_index', yKey: 'reactant_atoms', y2Key: 'product_atoms', xLabel: 'Element #', yLabel: 'Reactant vs Product Atoms', color: '#7c3aed' },
  'mole-stoichiometry': { type: 'line', xKey: 'mass_g', yKey: 'moles', xLabel: 'Sample Mass (g)', yLabel: 'Moles (mol)', color: '#7c3aed' },
  'chemical-bonding': { type: 'line', xKey: 'delta_en', yKey: 'ionic_character_pct', xLabel: 'Δχ', yLabel: 'Ionic Character (%)', color: '#7c3aed' },
  'concentration-dilution': { type: 'line', xKey: 'volume_ml', yKey: 'molarity', xLabel: 'Total Volume (mL)', yLabel: 'Molarity (M)', color: '#7c3aed' },
  'chemical-equilibrium': { type: 'line', xKey: 'step', yKey: 'C', y2Key: 'A', xLabel: 'Reaction Progress', yLabel: '[C] & [A] (M)', color: '#7c3aed' },
  'electrochemical-cells': { type: 'line', xKey: 'log10_Q', yKey: 'e_cell_V', xLabel: 'log₁₀(Q)', yLabel: 'Cell Voltage E (V)', color: '#7c3aed' },
  'reaction-kinetics': { type: 'line', xKey: 'time_s', yKey: 'concentration_M', xLabel: 'Time (s)', yLabel: '[A](t) (M)', color: '#7c3aed' },
  'gas-laws-thermodynamics': { type: 'line', xKey: 'volume_L', yKey: 'p_ideal_atm', y2Key: 'p_vdw_atm', xLabel: 'Volume (L)', yLabel: 'Ideal vs van der Waals P (atm)', color: '#7c3aed' },
  // Biology
  'plant-cell-structure': { type: 'line', xKey: 'side_um', yKey: 'sa_to_vol', xLabel: 'Cell Side (μm)', yLabel: 'SA:V Ratio (μm⁻¹)', color: '#059669' },
  'animal-cell-structure': { type: 'line', xKey: 'radius_um', yKey: 'sa_to_vol', xLabel: 'Cell Radius (μm)', yLabel: 'SA:V Ratio (μm⁻¹)', color: '#22c55e' },
  'human-respiratory-system': { type: 'line', xKey: 'time_s', yKey: 'lung_volume_ml', xLabel: 'Time (s)', yLabel: 'Lung Volume (mL)', color: '#fb7185' },
  'human-digestive-system': { type: 'line', xKey: 'ph', yKey: 'activity_pct', xLabel: 'pH', yLabel: 'Enzyme Activity (%)', color: '#22c55e' },
  photosynthesis: { type: 'line', xKey: 'light_intensity', yKey: 'o2_rate', xLabel: 'Light (μmol/m²/s)', yLabel: 'O₂ Rate (μmol/m²/s)', color: '#22c55e' },
  'mitosis-meiosis': { type: 'bar', xKey: 'stage_index', yKey: 'dna_content_C', xLabel: 'Stage (0–4)', yLabel: 'DNA Ploidy (C)', color: '#22c55e' },
  'dna-structure-replication': { type: 'bar', xKey: 'base', yKey: 'percentage', xLabel: 'Nitrogenous Base', yLabel: 'Composition (%)', color: '#22c55e' },
  'human-circulatory-system': { type: 'line', xKey: 'time_s', yKey: 'pressure_mmHg', xLabel: 'Time (s)', yLabel: 'Arterial Pressure (mmHg)', color: '#fb7185' },
  'human-nervous-system': { type: 'line', xKey: 'time_ms', yKey: 'membrane_mv', xLabel: 'Time (ms)', yLabel: 'Membrane Potential (mV)', color: '#fb7185' },
  'food-chain-ecosystem': { type: 'bar', xKey: 'trophic_level', yKey: 'energy_kcal', xLabel: 'Trophic Level', yLabel: 'Available Energy (kcal)', color: '#059669' },
  'mendelian-genetics': { type: 'bar', xKey: 'genotype', yKey: 'probability_pct', xLabel: 'Genotype', yLabel: 'Probability (%)', color: '#059669' },
  'natural-selection-evolution': { type: 'line', xKey: 'generation', yKey: 'p_dominant', y2Key: 'q_recessive', xLabel: 'Generation', yLabel: 'Allele Freq (p vs q)', color: '#059669' },
  'cellular-respiration': { type: 'bar', xKey: 'stage', yKey: 'atp_yield', xLabel: 'Pathway Stage', yLabel: 'ATP Yield (mol)', color: '#059669' },
  'population-genetics': { type: 'line', xKey: 'p', yKey: '2pq_Aa', y2Key: 'p2_AA', xLabel: 'Allele Freq p', yLabel: 'Heterozygotes (2pq) vs AA (p²)', color: '#059669' },
  // Mathematics
  'number-systems': { type: 'bar', xKey: 'bit_position', yKey: 'place_contribution', xLabel: 'Bit Position (2ⁱ)', yLabel: 'Place Value', color: '#ea580c' },
  'fractions-decimals': { type: 'bar', xKey: 'item', yKey: 'decimal_value', xLabel: 'Operand / Result', yLabel: 'Decimal Value', color: '#ea580c' },
  'basic-geometry': { type: 'line', xKey: 'radius', yKey: 'area', y2Key: 'circumference', xLabel: 'Circle Radius r', yLabel: 'Area (πr²) & Circumference', color: '#ea580c' },
  'algebraic-expressions': { type: 'line', xKey: 'x', yKey: 'squared', y2Key: 'linear', xLabel: 'x', yLabel: '(px+q)² vs (px+q)', color: '#ea580c' },
  'trigonometric-functions': { type: 'line', xKey: 'angle_deg', yKey: 'wave_sin', y2Key: 'unit_cos', xLabel: 'Angle (°)', yLabel: 'Wave y vs cos(θ)', color: '#ea580c' },
  'coordinate-geometry': { type: 'line', xKey: 'x', yKey: 'y', xLabel: 'x', yLabel: 'y = mx + c', color: '#ea580c' },
  'probability-statistics': { type: 'bar', xKey: 'k', yKey: 'probability', xLabel: 'Successes k', yLabel: 'P(X = k)', color: '#ea580c' },
  'quadratic-equations': { type: 'line', xKey: 'x', yKey: 'y', xLabel: 'x', yLabel: 'ax² + bx + c', color: '#ea580c' },
  'differential-calculus': { type: 'line', xKey: 'x', yKey: 'f_x', y2Key: 'tangent', xLabel: 'x', yLabel: 'f(x) & Tangent Line', color: '#ea580c' },
  'integral-calculus': { type: 'bar', xKey: 'x', yKey: 'f_x', xLabel: 'Riemann Midpoint x', yLabel: 'f(x) Height', color: '#ea580c' },
  'matrices-linear-algebra': { type: 'line', xKey: 'x_transformed', yKey: 'y_transformed', xLabel: "x'", yLabel: "y' (Transformed Square)", color: '#ea580c' },
  'three-dimensional-geometry': { type: 'bar', xKey: 'axis', yKey: 'u_component', y2Key: 'cross_component', xLabel: '3D Axis', yLabel: 'u vs u × v Components', color: '#ea580c' },
};

export function runMultidisciplinarySimulation(experimentId, parameters = {}) {
  const fn = CLIENT_SIMULATION_REGISTRY[experimentId];
  if (!fn) {
    throw new Error(`Unsupported experiment '${experimentId}'.`);
  }
  return fn(parameters);
}
