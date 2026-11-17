import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateCurrent,
  calculatePower,
  getCircuitObservation,
} from '../../shared/simulations/circuits/circuitCalculations.js'

describe('Circuit Calculations', () => {
  it('calculates current correctly with Ohm’s law when closed and complete', () => {
    // 6V / 12Ω = 0.5A
    const current = calculateCurrent(6, 12, true, true)
    assert.equal(current, 0.5)
  })

  it('returns 0 A when switch is open', () => {
    const current = calculateCurrent(6, 12, false, true)
    assert.equal(current, 0)
  })

  it('returns 0 A when circuit is incomplete', () => {
    const current = calculateCurrent(6, 12, true, false)
    assert.equal(current, 0)
  })

  it('returns 0 A when resistance is non-positive', () => {
    assert.equal(calculateCurrent(6, 0, true, true), 0)
    assert.equal(calculateCurrent(6, -5, true, true), 0)
  })

  it('calculates power correctly', () => {
    // P = V * I = 6 * 0.5 = 3W
    assert.equal(calculatePower(6, 0.5), 3)
    assert.equal(calculatePower(6, 0), 0)
  })

  it('generates appropriate observations', () => {
    assert.match(getCircuitObservation(0, false, true), /Close the switch/)
    assert.match(getCircuitObservation(0, true, false), /connected in one complete loop/)
    assert.match(getCircuitObservation(0.5, true, true), /Current is flowing at 0.50 A/)
  })
})
