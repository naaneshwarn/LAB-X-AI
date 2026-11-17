import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createCircuitComponent,
  getComponentTerminals,
} from '../../shared/simulations/circuits/circuitTypes.js'

test('creates stable component data with prepared terminals', () => {
  const battery = createCircuitComponent('battery', { x: 10, y: 20 }, 'battery-1')
  assert.deepEqual(battery, {
    id: 'battery-1',
    type: 'battery',
    x: 10,
    y: 20,
    rotation: 0,
    properties: { voltage: 6 },
  })
  assert.deepEqual(getComponentTerminals(battery).map(({ terminalId }) => terminalId), ['positive', 'negative'])
})

test('rotated terminal positions follow the component', () => {
  const bulb = createCircuitComponent('bulb', { x: 10, y: 20 }, 'bulb-1')
  const [first, second] = getComponentTerminals({ ...bulb, rotation: 90 })
  assert.deepEqual(first.position, { x: 56, y: 12 })
  assert.deepEqual(second.position, { x: 56, y: 104 })
})
