export const CIRCUIT_COMPONENT_TYPES = {
  battery: {
    label: 'Battery',
    description: 'Provides electrical energy',
    properties: { voltage: 6 },
    terminals: ['positive', 'negative'],
  },
  bulb: {
    label: 'Bulb',
    description: 'Converts electrical energy to light',
    properties: { power: 3 },
    terminals: ['input', 'output'],
  },
  resistor: {
    label: 'Resistor',
    description: 'Opposes the flow of current',
    properties: { resistance: 12 },
    terminals: ['input', 'output'],
  },
  switch: {
    label: 'Switch',
    description: 'Controls the circuit path',
    properties: { isClosed: false },
    terminals: ['input', 'output'],
  },
}

export const TERMINAL_OFFSETS = {
  battery: [{ id: 'positive', x: 0, y: 38 }, { id: 'negative', x: 92, y: 38 }],
  bulb: [{ id: 'terminal-a', x: 0, y: 38 }, { id: 'terminal-b', x: 92, y: 38 }],
  resistor: [{ id: 'terminal-a', x: 0, y: 38 }, { id: 'terminal-b', x: 92, y: 38 }],
  switch: [{ id: 'terminal-a', x: 0, y: 38 }, { id: 'terminal-b', x: 92, y: 38 }],
}

export function getComponentTerminals(component) {
  const radians = (component.rotation * Math.PI) / 180
  const center = { x: component.x + 46, y: component.y + 38 }
  return TERMINAL_OFFSETS[component.type].map((terminal) => {
    const localX = terminal.x - 46
    const localY = terminal.y - 38
    return {
      componentId: component.id,
      terminalId: terminal.id,
      position: {
        x: center.x + localX * Math.cos(radians) - localY * Math.sin(radians),
        y: center.y + localX * Math.sin(radians) + localY * Math.cos(radians),
      },
    }
  })
}

export function createCircuitComponent(type, position = { x: 80, y: 80 }, id) {
  if (!CIRCUIT_COMPONENT_TYPES[type]) {
    throw new Error(`Unknown circuit component type: ${type}`)
  }

  const definition = CIRCUIT_COMPONENT_TYPES[type]
  return {
    id: id || `component-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    x: position.x,
    y: position.y,
    rotation: 0,
    properties: { ...definition.properties },
  }
}
