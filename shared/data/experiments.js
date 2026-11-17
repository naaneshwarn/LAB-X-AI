const experiments = [
  {
    id: 'circuit',
    subject: 'Physics',
    title: 'Basic Electric Circuit',
    description: 'Explore how voltage, resistance and current work together.',
    level: 'Beginner',
    time: '10 min',
    available: true,
    objectives: ['Apply Ohm’s Law', 'Identify circuit components', 'Observe current flow'],
  },
  {
    id: 'reactions',
    subject: 'Chemistry',
    title: 'Chemical Reactions',
    description: 'Explore how substances combine and form new products.',
    level: 'Intermediate',
    time: '15 min',
    available: false,
    objectives: ['Identify reactants', 'Observe reaction signs'],
  },
  {
    id: 'body',
    subject: 'Biology',
    title: 'Human Body Systems',
    description: 'Discover how major organs work together.',
    level: 'Beginner',
    time: '12 min',
    available: false,
    objectives: ['Map major organs', 'Understand circulation'],
  },
  {
    id: 'reflection',
    subject: 'Physics',
    title: 'Light and Reflection',
    description: 'Experiment with angles and mirrors to understand reflected light.',
    level: 'Intermediate',
    time: '12 min',
    available: false,
    objectives: ['Measure angles', 'Test reflection'],
  },
]

export default experiments
export { experiments }
