/**
 * Deterministically calculates electric current using Ohm's Law (I = V / R).
 * Current is 0 A if the circuit is open, incomplete, or resistance is non-positive.
 *
 * @param {number} voltage - Voltage in Volts (V)
 * @param {number} resistance - Resistance in Ohms (Ω)
 * @param {boolean} isClosed - Switch state (true = closed / ON)
 * @param {boolean} isComplete - Loop completeness (true = complete conducting path)
 * @returns {number} Current in Amperes (A)
 */
export function calculateCurrent(voltage, resistance, isClosed, isComplete = true) {
  if (!isClosed || !isComplete || resistance <= 0) return 0
  return voltage / resistance
}

/**
 * Calculates electrical power in Watts (P = V * I).
 *
 * @param {number} voltage - Voltage in Volts (V)
 * @param {number} current - Current in Amperes (A)
 * @returns {number} Power in Watts (W)
 */
export function calculatePower(voltage, current) {
  if (voltage < 0 || current < 0) return 0
  return voltage * current
}

/**
 * Generates an educational observation text based on circuit state and current.
 *
 * @param {number} current - Current in Amperes (A)
 * @param {boolean} isClosed - Switch state
 * @param {boolean} isComplete - Completeness state
 * @returns {string} Educational observation string
 */
export function getCircuitObservation(current, isClosed, isComplete = true) {
  if (!isComplete) return 'Check that all components are connected in one complete loop.'
  if (!isClosed) return 'Close the switch to complete the path and allow current to flow.'
  if (current === 0) return 'Check that all components are connected in one complete loop.'
  return `Current is flowing at ${current.toFixed(2)} A. The bulb is illuminated.`
}
