import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateCurrent,
  getCircuitObservation,
  validateCircuit,
} from '../../shared/simulations/circuits/circuitLogic.js'

test('calculates current for an active circuit', () => {
  assert.equal(calculateCurrent(6, 12, true, true), 0.5)
})

test('returns zero for an open or incomplete circuit', () => {
  assert.equal(calculateCurrent(6, 12, false, true), 0)
  assert.equal(calculateCurrent(6, 12, true, false), 0)
  assert.equal(calculateCurrent(6, 0, true, true), 0)
})

test('validates circuit state', () => {
  assert.equal(validateCircuit({ isClosed: true, isComplete: true }), true)
  assert.equal(validateCircuit({ isClosed: false, isComplete: true }), false)
})

test('describes the current circuit observation', () => {
  assert.equal(getCircuitObservation(0, false), 'Close the switch to complete the path and allow current to flow.')
  assert.equal(getCircuitObservation(0, true, false), 'Check that all components are connected in one complete loop.')
  assert.match(getCircuitObservation(0.5, true), /0.50 A/)
})
