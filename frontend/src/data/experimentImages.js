/**
 * Centralized, data-driven image mapping for all 51 LabXAI Experiments.
 * Every experiment has its own unique, scientifically accurate SVG illustration.
 */

export const EXPERIMENT_IMAGES = {
  // ==========================================
  // PHYSICS (12)
  // ==========================================
  'ohms-law': {
    image: '/assets/experiments/physics/ohms-law.svg',
    alt: 'Circuit diagram with battery, ammeter, voltmeter and resistor illustrating Ohm’s law',
    fit: 'contain',
    subjectBg: '#EFF6FF',
  },
  'simple-pendulum': {
    image: '/assets/experiments/physics/simple-pendulum.svg',
    alt: 'Apparatus of a simple pendulum showing oscillation angle and period T',
    fit: 'contain',
    subjectBg: '#EFF6FF',
  },
  'reflection-of-light': {
    image: '/assets/experiments/physics/reflection-of-light.svg',
    alt: 'Plane mirror ray diagram showing incident, reflected ray and normal',
    fit: 'contain',
    subjectBg: '#EFF6FF',
  },
  'refraction-of-light': {
    image: '/assets/experiments/physics/refraction-of-light.svg',
    alt: 'Light ray bending through a glass slab and prism according to Snell’s law',
    fit: 'contain',
    subjectBg: '#EFF6FF',
  },
  'projectile-motion': {
    image: '/assets/experiments/physics/projectile-motion.svg',
    alt: 'Parabolic trajectory of a projectile with velocity vectors and range',
    fit: 'contain',
    subjectBg: '#EFF6FF',
  },
  'convex-lens': {
    image: '/assets/experiments/physics/convex-lens.svg',
    alt: 'Ray optics diagram of a biconvex lens forming a real inverted image',
    fit: 'contain',
    subjectBg: '#EFF6FF',
  },
  'series-parallel-circuits': {
    image: '/assets/experiments/physics/series-parallel-circuits.svg',
    alt: 'Comparison schematic of resistors connected in series and parallel',
    fit: 'contain',
    subjectBg: '#EFF6FF',
  },
  'newtons-laws': {
    image: '/assets/experiments/physics/newtons-laws.svg',
    alt: 'Force vectors, acceleration on an inclined plane and action-reaction pairs',
    fit: 'contain',
    subjectBg: '#EFF6FF',
  },
  'electromagnetic-induction': {
    image: '/assets/experiments/physics/electromagnetic-induction.svg',
    alt: 'Bar magnet moving through a solenoid coil inducing electric current',
    fit: 'contain',
    subjectBg: '#EFF6FF',
  },
  'wave-interference': {
    image: '/assets/experiments/physics/wave-interference.svg',
    alt: 'Young’s double slit wave interference fringes and intensity peaks',
    fit: 'contain',
    subjectBg: '#EFF6FF',
  },
  'thermodynamic-processes': {
    image: '/assets/experiments/physics/thermodynamic-processes.svg',
    alt: 'PV indicator diagram showing isothermal and adiabatic gas expansion',
    fit: 'contain',
    subjectBg: '#EFF6FF',
  },
  'photoelectric-effect': {
    image: '/assets/experiments/physics/photoelectric-effect.svg',
    alt: 'Photons striking a metal surface ejecting photoelectrons',
    fit: 'contain',
    subjectBg: '#EFF6FF',
  },

  // ==========================================
  // CHEMISTRY (13)
  // ==========================================
  'atomic-structure': {
    image: '/assets/experiments/chemistry/atomic-structure.svg',
    alt: 'Bohr model of atom with protons, neutrons and orbiting electrons',
    fit: 'contain',
    subjectBg: '#F0FDF4',
  },
  'periodic-table-explorer': {
    image: '/assets/experiments/chemistry/periodic-table-explorer.svg',
    alt: 'Interactive periodic table grid with elemental blocks and groups',
    fit: 'contain',
    subjectBg: '#F0FDF4',
  },
  'acids-bases-ph': {
    image: '/assets/experiments/chemistry/acids-bases-ph.svg',
    alt: 'Color-coded pH scale from 0 to 14 with acid and base indicator test tubes',
    fit: 'contain',
    subjectBg: '#F0FDF4',
  },
  'chemical-reaction-playground': {
    image: '/assets/experiments/chemistry/chemical-reaction-playground.svg',
    alt: 'Erlenmeyer flask reaction with molecular transformation and bubbling',
    fit: 'contain',
    subjectBg: '#F0FDF4',
  },
  'states-of-matter': {
    image: '/assets/experiments/chemistry/states-of-matter.svg',
    alt: 'Microscopic particulate arrangements in solid, liquid and gaseous phases',
    fit: 'contain',
    subjectBg: '#F0FDF4',
  },
  'reaction-balancing': {
    image: '/assets/experiments/chemistry/reaction-balancing.svg',
    alt: 'Stoichiometric balance scale demonstrating conservation of mass',
    fit: 'contain',
    subjectBg: '#F0FDF4',
  },
  'mole-stoichiometry': {
    image: '/assets/experiments/chemistry/mole-stoichiometry.svg',
    alt: 'Mole-mass-volume conversions centered on Avogadro constant',
    fit: 'contain',
    subjectBg: '#F0FDF4',
  },
  'chemical-bonding': {
    image: '/assets/experiments/chemistry/chemical-bonding.svg',
    alt: 'Covalent electron sharing and ionic charge transfer diagrams',
    fit: 'contain',
    subjectBg: '#F0FDF4',
  },
  'concentration-dilution': {
    image: '/assets/experiments/chemistry/concentration-dilution.svg',
    alt: 'Serial dilution showing solute particles dispersing in solvent',
    fit: 'contain',
    subjectBg: '#F0FDF4',
  },
  'chemical-equilibrium': {
    image: '/assets/experiments/chemistry/chemical-equilibrium.svg',
    alt: 'Dynamic equilibrium showing forward and reverse reaction balance',
    fit: 'contain',
    subjectBg: '#F0FDF4',
  },
  'electrochemical-cells': {
    image: '/assets/experiments/chemistry/electrochemical-cells.svg',
    alt: 'Daniell voltaic cell with zinc and copper electrodes and salt bridge',
    fit: 'contain',
    subjectBg: '#F0FDF4',
  },
  'reaction-kinetics': {
    image: '/assets/experiments/chemistry/reaction-kinetics.svg',
    alt: 'Activation energy barrier and reaction progress curve with catalyst',
    fit: 'contain',
    subjectBg: '#F0FDF4',
  },
  'gas-laws-thermodynamics': {
    image: '/assets/experiments/chemistry/gas-laws-thermodynamics.svg',
    alt: 'Piston chamber illustrating Boyle and Charles gas laws',
    fit: 'contain',
    subjectBg: '#F0FDF4',
  },

  // ==========================================
  // BIOLOGY (14)
  // ==========================================
  'plant-cell-structure': {
    image: '/assets/experiments/biology/plant-cell-structure.svg',
    alt: 'Eukaryotic plant cell diagram showing cell wall, chloroplasts and vacuole',
    fit: 'contain',
    subjectBg: '#FFF1F2',
  },
  'animal-cell-structure': {
    image: '/assets/experiments/biology/animal-cell-structure.svg',
    alt: 'Animal cell anatomical cross-section showing nucleus and mitochondria',
    fit: 'contain',
    subjectBg: '#FFF1F2',
  },
  'human-respiratory-system': {
    image: '/assets/experiments/biology/human-respiratory-system.svg',
    alt: 'Human respiratory anatomy showing trachea, bronchi and lungs with alveoli',
    fit: 'contain',
    subjectBg: '#FFF1F2',
  },
  'human-digestive-system': {
    image: '/assets/experiments/biology/human-digestive-system.svg',
    alt: 'Alimentary canal anatomy with stomach, liver, pancreas and intestines',
    fit: 'contain',
    subjectBg: '#FFF1F2',
  },
  'photosynthesis': {
    image: '/assets/experiments/biology/photosynthesis.svg',
    alt: 'Plant leaf chloroplast converting sunlight, water and CO2 into glucose',
    fit: 'contain',
    subjectBg: '#FFF1F2',
  },
  'mitosis-meiosis': {
    image: '/assets/experiments/biology/mitosis-meiosis.svg',
    alt: 'Cell division cycle through prophase, metaphase, anaphase and telophase',
    fit: 'contain',
    subjectBg: '#FFF1F2',
  },
  'dna-structure-replication': {
    image: '/assets/experiments/biology/dna-structure-replication.svg',
    alt: 'DNA double helix with adenine-thymine and guanine-cytosine base pairs',
    fit: 'contain',
    subjectBg: '#FFF1F2',
  },
  'human-circulatory-system': {
    image: '/assets/experiments/biology/human-circulatory-system.svg',
    alt: 'Four-chambered human heart and systemic blood circulatory loops',
    fit: 'contain',
    subjectBg: '#FFF1F2',
  },
  'human-nervous-system': {
    image: '/assets/experiments/biology/human-nervous-system.svg',
    alt: 'Central brain, spinal cord and neuron with axon, dendrites and synapse',
    fit: 'contain',
    subjectBg: '#FFF1F2',
  },
  'food-chain-ecosystem': {
    image: '/assets/experiments/biology/food-chain-ecosystem.svg',
    alt: 'Trophic energy pyramid from primary producers to apex predators',
    fit: 'contain',
    subjectBg: '#FFF1F2',
  },
  'mendelian-genetics': {
    image: '/assets/experiments/biology/mendelian-genetics.svg',
    alt: 'Punnett square showing dominant and recessive monohybrid genetic cross',
    fit: 'contain',
    subjectBg: '#FFF1F2',
  },
  'natural-selection-evolution': {
    image: '/assets/experiments/biology/natural-selection-evolution.svg',
    alt: 'Evolutionary divergence and directional natural selection traits',
    fit: 'contain',
    subjectBg: '#FFF1F2',
  },
  'cellular-respiration': {
    image: '/assets/experiments/biology/cellular-respiration.svg',
    alt: 'Mitochondrial ATP synthesis via glycolysis and Krebs citric acid cycle',
    fit: 'contain',
    subjectBg: '#FFF1F2',
  },
  'population-genetics': {
    image: '/assets/experiments/biology/population-genetics.svg',
    alt: 'Hardy-Weinberg allele frequency distribution in biological populations',
    fit: 'contain',
    subjectBg: '#FFF1F2',
  },

  // ==========================================
  // MATHEMATICS (12)
  // ==========================================
  'number-systems': {
    image: '/assets/experiments/mathematics/number-systems.svg',
    alt: 'Nested number sets Venn diagram from natural numbers to reals',
    fit: 'contain',
    subjectBg: '#F5F3FF',
  },
  'fractions-decimals': {
    image: '/assets/experiments/mathematics/fractions-decimals.svg',
    alt: 'Visual fraction pie charts and decimal number line partitions',
    fit: 'contain',
    subjectBg: '#F5F3FF',
  },
  'basic-geometry': {
    image: '/assets/experiments/mathematics/basic-geometry.svg',
    alt: 'Euclidean geometry shapes with angles and Pythagorean right triangle',
    fit: 'contain',
    subjectBg: '#F5F3FF',
  },
  'algebraic-expressions': {
    image: '/assets/experiments/mathematics/algebraic-expressions.svg',
    alt: 'Algebraic balance scale solving linear equations with variables',
    fit: 'contain',
    subjectBg: '#F5F3FF',
  },
  'trigonometric-functions': {
    image: '/assets/experiments/mathematics/trigonometric-functions.svg',
    alt: 'Unit circle with sine and cosine wave projection and angle theta',
    fit: 'contain',
    subjectBg: '#F5F3FF',
  },
  'coordinate-geometry': {
    image: '/assets/experiments/mathematics/coordinate-geometry.svg',
    alt: 'Cartesian 2D plane showing linear equations, slope and distance',
    fit: 'contain',
    subjectBg: '#F5F3FF',
  },
  'probability-statistics': {
    image: '/assets/experiments/mathematics/probability-statistics.svg',
    alt: 'Gaussian normal bell curve, dice rolls and sample distribution',
    fit: 'contain',
    subjectBg: '#F5F3FF',
  },
  'quadratic-equations': {
    image: '/assets/experiments/mathematics/quadratic-equations.svg',
    alt: 'Parabolic curve y = ax^2 + bx + c with vertex and real roots',
    fit: 'contain',
    subjectBg: '#F5F3FF',
  },
  'differential-calculus': {
    image: '/assets/experiments/mathematics/differential-calculus.svg',
    alt: 'Secant line approaching tangent line representing derivative dy/dx',
    fit: 'contain',
    subjectBg: '#F5F3FF',
  },
  'integral-calculus': {
    image: '/assets/experiments/mathematics/integral-calculus.svg',
    alt: 'Definite integral area under the curve using Riemann rectangular sums',
    fit: 'contain',
    subjectBg: '#F5F3FF',
  },
  'matrices-linear-algebra': {
    image: '/assets/experiments/mathematics/matrices-linear-algebra.svg',
    alt: 'Matrix multiplication grid with 2D vector coordinate transformation',
    fit: 'contain',
    subjectBg: '#F5F3FF',
  },
  'three-dimensional-geometry': {
    image: '/assets/experiments/mathematics/three-dimensional-geometry.svg',
    alt: '3D coordinate axes X-Y-Z with sphere, cylinder and plane equations',
    fit: 'contain',
    subjectBg: '#F5F3FF',
  },
};

export const FALLBACK_EXPERIMENT_IMAGE = {
  image: '/assets/experiments/fallback.svg',
  alt: 'Interactive Virtual Science Laboratory Illustration',
  fit: 'contain',
  subjectBg: '#F8FAFC',
};

/**
 * Returns the relevant image object for an experiment ID, falling back gracefully.
 * @param {string} experimentId
 * @returns {{image: string, alt: string, fit: string, subjectBg: string}}
 */
export function getExperimentImage(experimentId) {
  if (!experimentId) return FALLBACK_EXPERIMENT_IMAGE;
  return EXPERIMENT_IMAGES[experimentId] || FALLBACK_EXPERIMENT_IMAGE;
}
