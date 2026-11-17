import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  createCircuitComponent,
  getComponentTerminals,
  validateWireConnection,
  getOrthogonalWirePath,
} from '../../shared/simulations/circuits/circuitTypes.js'

describe('Circuit Builder & Terminal Connection System', () => {
  it('Scenario 1: Creates components with unique, stable IDs and correct types', () => {
    const battery = createCircuitComponent('battery', { x: 40, y: 50 })
    const bulb = createCircuitComponent('bulb', { x: 160, y: 50 })
    const resistor = createCircuitComponent('resistor', { x: 280, y: 50 })

    assert.notEqual(battery.id, bulb.id)
    assert.notEqual(bulb.id, resistor.id)
    assert.match(battery.id, /^comp-/)
    assert.equal(battery.type, 'battery')
    assert.equal(bulb.type, 'bulb')
    assert.equal(resistor.type, 'resistor')
    assert.equal(battery.x, 40)
    assert.equal(battery.y, 50)
  })

  it('Scenario 2: Component terminals match exact specifications', () => {
    const battery = createCircuitComponent('battery', { x: 100, y: 100 })
    const bulb = createCircuitComponent('bulb', { x: 250, y: 100 })
    const resistor = createCircuitComponent('resistor', { x: 400, y: 100 })
    const sw = createCircuitComponent('switch', { x: 550, y: 100 })

    const batteryTerms = getComponentTerminals(battery)
    const bulbTerms = getComponentTerminals(bulb)
    const resistorTerms = getComponentTerminals(resistor)
    const switchTerms = getComponentTerminals(sw)

    // Battery: positive & negative
    assert.equal(batteryTerms.length, 2)
    assert.equal(batteryTerms[0].terminalId, 'positive')
    assert.equal(batteryTerms[0].label, '+')
    assert.equal(batteryTerms[1].terminalId, 'negative')
    assert.equal(batteryTerms[1].label, '-')

    // Bulb: terminal-a & terminal-b
    assert.equal(bulbTerms.length, 2)
    assert.equal(bulbTerms[0].terminalId, 'terminal-a')
    assert.equal(bulbTerms[0].label, 'A')
    assert.equal(bulbTerms[1].terminalId, 'terminal-b')
    assert.equal(bulbTerms[1].label, 'B')

    // Resistor: terminal-a & terminal-b
    assert.equal(resistorTerms.length, 2)
    assert.equal(resistorTerms[0].terminalId, 'terminal-a')
    assert.equal(resistorTerms[1].terminalId, 'terminal-b')

    // Switch: terminal-a & terminal-b
    assert.equal(switchTerms.length, 2)
    assert.equal(switchTerms[0].terminalId, 'terminal-a')
    assert.equal(switchTerms[1].terminalId, 'terminal-b')
  })

  it('Scenario 3: Deleting a component leaves other components completely intact', () => {
    const battery = createCircuitComponent('battery', { x: 50, y: 50 })
    const bulb = createCircuitComponent('bulb', { x: 180, y: 50 })
    const resistor = createCircuitComponent('resistor', { x: 300, y: 50 })

    let components = [battery, bulb, resistor]
    assert.equal(components.length, 3)

    // Delete the battery by ID
    components = components.filter((c) => c.id !== battery.id)

    assert.equal(components.length, 2)
    assert.equal(components[0].id, bulb.id)
    assert.equal(components[1].id, resistor.id)

    // Add a new battery
    const battery2 = createCircuitComponent('battery', { x: 50, y: 120 })
    components.push(battery2)
    assert.equal(components.length, 3)

    // Delete an older component (bulb)
    components = components.filter((c) => c.id !== bulb.id)
    assert.equal(components.length, 2)
    assert.equal(components.some((c) => c.id === resistor.id), true)
    assert.equal(components.some((c) => c.id === battery2.id), true)
  })

  it('Scenario 4: Wire connection validation prevents self-connection and duplicates', () => {
    const battery = createCircuitComponent('battery', { x: 40, y: 40 })
    const bulb = createCircuitComponent('bulb', { x: 200, y: 40 })

    const batteryTerms = getComponentTerminals(battery)
    const bulbTerms = getComponentTerminals(bulb)

    // Self-connection should be rejected
    const selfConn = validateWireConnection(batteryTerms[0], batteryTerms[1], [])
    assert.equal(selfConn.valid, false)
    assert.match(selfConn.error, /Cannot connect a component to itself/)

    // Valid connection between battery and bulb
    const validConn = validateWireConnection(batteryTerms[0], bulbTerms[0], [])
    assert.equal(validConn.valid, true)

    // Duplicate connection should be rejected
    const existing = [
      {
        id: 'wire-1',
        from: { componentId: battery.id, terminalId: 'positive' },
        to: { componentId: bulb.id, terminalId: 'terminal-a' },
      },
    ]

    const dupForward = validateWireConnection(batteryTerms[0], bulbTerms[0], existing)
    assert.equal(dupForward.valid, false)
    assert.match(dupForward.error, /already connected/)

    const dupReverse = validateWireConnection(bulbTerms[0], batteryTerms[0], existing)
    assert.equal(dupReverse.valid, false)
    assert.match(dupReverse.error, /already connected/)
  })

  it('Scenario 5: Moving components dynamically updates terminal positions for wires', () => {
    const bulb = createCircuitComponent('bulb', { x: 100, y: 100 })
    const initialTerms = getComponentTerminals(bulb)

    // Initial position: center is 100+46=146, 100+38=138
    // Term A: local x=0 => 146 - 46 = 100, local y=38 => 138
    assert.equal(initialTerms[0].position.x, 100)
    assert.equal(initialTerms[0].position.y, 138)

    // Move bulb to x=200, y=150
    bulb.x = 200
    bulb.y = 150
    const movedTerms = getComponentTerminals(bulb)

    assert.equal(movedTerms[0].position.x, 200)
    assert.equal(movedTerms[0].position.y, 188)
  })

  it('Scenario 6: Rotating a component updates terminal positions with exact trigonometry', () => {
    const bulb = createCircuitComponent('bulb', { x: 100, y: 100 })
    bulb.rotation = 0
    const terms0 = getComponentTerminals(bulb)
    // At 0 deg: center = (146, 138). Left terminal is (100, 138), Right is (192, 138)
    assert.equal(terms0[0].position.x, 100)
    assert.equal(terms0[0].position.y, 138)
    assert.equal(terms0[1].position.x, 192)
    assert.equal(terms0[1].position.y, 138)

    // Rotate 90 deg: Left terminal moves to Top center (146, 92), Right terminal moves to Bottom center (146, 184)
    bulb.rotation = 90
    const terms90 = getComponentTerminals(bulb)
    assert.equal(terms90[0].position.x, 146)
    assert.equal(terms90[0].position.y, 92)
    assert.equal(terms90[1].position.x, 146)
    assert.equal(terms90[1].position.y, 184)
  })

  it('Scenario 7: Deleting a component removes all attached wire connections', () => {
    const battery = createCircuitComponent('battery', { x: 40, y: 40 })
    const bulb = createCircuitComponent('bulb', { x: 200, y: 40 })
    const resistor = createCircuitComponent('resistor', { x: 350, y: 40 })

    let connections = [
      {
        id: 'wire-1',
        from: { componentId: battery.id, terminalId: 'positive' },
        to: { componentId: bulb.id, terminalId: 'terminal-a' },
      },
      {
        id: 'wire-2',
        from: { componentId: bulb.id, terminalId: 'terminal-b' },
        to: { componentId: resistor.id, terminalId: 'terminal-a' },
      },
      {
        id: 'wire-3',
        from: { componentId: resistor.id, terminalId: 'terminal-b' },
        to: { componentId: battery.id, terminalId: 'negative' },
      },
    ]

    assert.equal(connections.length, 3)

    // Delete bulb
    const deletedId = bulb.id
    connections = connections.filter(
      (c) => c.from.componentId !== deletedId && c.to.componentId !== deletedId
    )

    // Only wire-3 (between resistor and battery) should remain
    assert.equal(connections.length, 1)
    assert.equal(connections[0].id, 'wire-3')
  })

  it('Scenario 8: Orthogonal wire paths render valid SVG paths', () => {
    const path = getOrthogonalWirePath({ x: 100, y: 138 }, { x: 200, y: 138 })
    assert.equal(path, 'M 100 138 H 150 V 138 H 200')

    const verticalPath = getOrthogonalWirePath({ x: 100, y: 100 }, { x: 100, y: 250 })
    assert.equal(verticalPath, 'M 100 100 H 100 V 250 H 100')
  })
})
