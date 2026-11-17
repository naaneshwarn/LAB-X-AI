import { CIRCUIT_LIMITS } from './circuitConstants.js'

/**
 * Validates that the circuit forms an active complete loop.
 *
 * @param {Object} state - Circuit state object
 * @param {boolean} state.isClosed - Switch state
 * @param {boolean} state.isComplete - Physical connection state
 * @returns {boolean} True if circuit path is fully active
 */
export function validateCircuit({ isClosed, isComplete }) {
  return Boolean(isClosed && isComplete)
}

/**
 * Validates circuit input parameters (voltage and resistance) against educational bounds.
 *
 * @param {number} voltage - Voltage value to check
 * @param {number} resistance - Resistance value to check
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateCircuitParams(voltage, resistance) {
  const errors = []
  if (typeof voltage !== 'number' || Number.isNaN(voltage)) {
    errors.push('Voltage must be a valid number.')
  } else if (voltage < CIRCUIT_LIMITS.MIN_VOLTAGE || voltage > CIRCUIT_LIMITS.MAX_VOLTAGE) {
    errors.push(`Voltage must be between ${CIRCUIT_LIMITS.MIN_VOLTAGE}V and ${CIRCUIT_LIMITS.MAX_VOLTAGE}V.`)
  }

  if (typeof resistance !== 'number' || Number.isNaN(resistance)) {
    errors.push('Resistance must be a valid number.')
  } else if (resistance < CIRCUIT_LIMITS.MIN_RESISTANCE || resistance > CIRCUIT_LIMITS.MAX_RESISTANCE) {
    errors.push(`Resistance must be between ${CIRCUIT_LIMITS.MIN_RESISTANCE}Ω and ${CIRCUIT_LIMITS.MAX_RESISTANCE}Ω.`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
