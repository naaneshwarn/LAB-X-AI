import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  validateCircuit,
  validateCircuitParams,
} from '../../shared/simulations/circuits/circuitValidation.js'

describe('Circuit Validation', () => {
  it('validates circuit activity correctly', () => {
    assert.equal(validateCircuit({ isClosed: true, isComplete: true }), true)
    assert.equal(validateCircuit({ isClosed: false, isComplete: true }), false)
    assert.equal(validateCircuit({ isClosed: true, isComplete: false }), false)
    assert.equal(validateCircuit({ isClosed: false, isComplete: false }), false)
  })

  it('validates parameters within educational limits', () => {
    const valid = validateCircuitParams(6, 12)
    assert.equal(valid.valid, true)
    assert.equal(valid.errors.length, 0)

    const invalidVoltage = validateCircuitParams(50, 12)
    assert.equal(invalidVoltage.valid, false)
    assert.match(invalidVoltage.errors[0], /Voltage must be between/)

    const invalidResistance = validateCircuitParams(6, 100)
    assert.equal(invalidResistance.valid, false)
    assert.match(invalidResistance.errors[0], /Resistance must be between/)
  })
})
