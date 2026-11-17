export function calculateCurrent(voltage, resistance, isClosed, isComplete = true) {
  if (!isClosed || !isComplete || resistance <= 0) return 0
  return voltage / resistance
}

export function getCircuitObservation(current, isClosed, isComplete = true) {
  if (!isComplete) return 'Check that all components are connected in one complete loop.'
  if (!isClosed) return 'Close the switch to complete the path and allow current to flow.'
  return `Current is flowing at ${current.toFixed(2)} A. The bulb is illuminated.`
}

export function validateCircuit({ isClosed, isComplete }) {
  return Boolean(isClosed && isComplete)
}
