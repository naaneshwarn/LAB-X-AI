/**
 * Circuit Component Definitions and Terminal Specifications
 */

export const CIRCUIT_COMPONENT_TYPES = {
  battery: {
    type: 'battery',
    label: 'Battery',
    description: 'Provides electrical energy (DC voltage)',
    properties: { voltage: 6 },
    terminals: [
      { id: 'positive', label: '+', name: 'Positive Terminal', x: 0, y: 38 },
      { id: 'negative', label: '-', name: 'Negative Terminal', x: 92, y: 38 },
    ],
  },
  bulb: {
    type: 'bulb',
    label: 'Bulb',
    description: 'Converts electrical energy to light',
    properties: { power: 3 },
    terminals: [
      { id: 'terminal-a', label: 'A', name: 'Terminal A', x: 0, y: 38 },
      { id: 'terminal-b', label: 'B', name: 'Terminal B', x: 92, y: 38 },
    ],
  },
  resistor: {
    type: 'resistor',
    label: 'Resistor',
    description: 'Opposes the flow of current',
    properties: { resistance: 12 },
    terminals: [
      { id: 'terminal-a', label: 'A', name: 'Terminal A', x: 0, y: 38 },
      { id: 'terminal-b', label: 'B', name: 'Terminal B', x: 92, y: 38 },
    ],
  },
  switch: {
    type: 'switch',
    label: 'Switch',
    description: 'Controls the conducting path (Open/Closed)',
    properties: { isClosed: false },
    terminals: [
      { id: 'terminal-a', label: 'A', name: 'Terminal A', x: 0, y: 38 },
      { id: 'terminal-b', label: 'B', name: 'Terminal B', x: 92, y: 38 },
    ],
  },
}

export const COMPONENT_DIMENSIONS = {
  width: 92,
  height: 76,
  centerX: 46,
  centerY: 38,
}

let componentCounter = 0

/**
 * Creates a new circuit component with a guaranteed unique, stable ID.
 */
export function createCircuitComponent(type, position = { x: 80, y: 80 }, id) {
  if (!CIRCUIT_COMPONENT_TYPES[type]) {
    throw new Error(`Unknown circuit component type: ${type}`)
  }

  componentCounter += 1
  const definition = CIRCUIT_COMPONENT_TYPES[type]
  const uniqueId = id || `comp-${Date.now()}-${componentCounter}-${Math.random().toString(36).slice(2, 7)}`

  return {
    id: uniqueId,
    type,
    x: Math.round(position.x),
    y: Math.round(position.y),
    rotation: 0,
    properties: { ...definition.properties },
  }
}

/**
 * Calculates absolute terminal positions in workspace coordinates based on component position and rotation.
 *
 * @param {Object} component - Placed component object { id, type, x, y, rotation }
 * @param {Array} connections - Optional list of active connections to check connection status
 * @returns {Array} List of calculated terminals
 */
export function getComponentTerminals(component, connections = []) {
  if (!component || !CIRCUIT_COMPONENT_TYPES[component.type]) return []
  const definition = CIRCUIT_COMPONENT_TYPES[component.type]
  const rotation = component.rotation || 0
  const radians = (rotation * Math.PI) / 180
  const center = {
    x: component.x + COMPONENT_DIMENSIONS.centerX,
    y: component.y + COMPONENT_DIMENSIONS.centerY,
  }

  return definition.terminals.map((terminal) => {
    const localX = terminal.x - COMPONENT_DIMENSIONS.centerX
    const localY = terminal.y - COMPONENT_DIMENSIONS.centerY
    const rotatedX = localX * Math.cos(radians) - localY * Math.sin(radians)
    const rotatedY = localX * Math.sin(radians) + localY * Math.cos(radians)

    const isConnected = Array.isArray(connections) && connections.some(
      (c) =>
        (c.from?.componentId === component.id && c.from?.terminalId === terminal.id) ||
        (c.to?.componentId === component.id && c.to?.terminalId === terminal.id)
    )

    return {
      componentId: component.id,
      componentType: component.type,
      terminalId: terminal.id,
      label: terminal.label,
      name: terminal.name,
      localX: terminal.x,
      localY: terminal.y,
      position: {
        x: Math.round(center.x + rotatedX),
        y: Math.round(center.y + rotatedY),
      },
      isConnected,
    }
  })
}

/**
 * Validates whether two terminals can be connected.
 *
 * @param {Object} fromTerminal - Starting terminal { componentId, terminalId }
 * @param {Object} toTerminal - Target terminal { componentId, terminalId }
 * @param {Array} existingConnections - Current array of connection objects
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateWireConnection(fromTerminal, toTerminal, existingConnections = []) {
  if (!fromTerminal || !toTerminal) {
    return { valid: false, error: 'Both terminals must be selected.' }
  }

  if (fromTerminal.componentId === toTerminal.componentId) {
    return { valid: false, error: 'Cannot connect a component to itself. Select a terminal on another component.' }
  }

  const isDuplicate = existingConnections.some((c) => {
    const matchForward =
      c.from.componentId === fromTerminal.componentId &&
      c.from.terminalId === fromTerminal.terminalId &&
      c.to.componentId === toTerminal.componentId &&
      c.to.terminalId === toTerminal.terminalId

    const matchReverse =
      c.to.componentId === fromTerminal.componentId &&
      c.to.terminalId === fromTerminal.terminalId &&
      c.from.componentId === toTerminal.componentId &&
      c.from.terminalId === toTerminal.terminalId

    return matchForward || matchReverse
  })

  if (isDuplicate) {
    return { valid: false, error: 'Those two terminals are already connected together.' }
  }

  return { valid: true }
}

/**
 * Generates an SVG path string for orthogonal wire routing between two points.
 * Uses horizontal and vertical segments with a midpoint step.
 *
 * @param {{ x: number, y: number }} from - Starting coordinate
 * @param {{ x: number, y: number }} to - Ending coordinate
 * @returns {string} SVG path d attribute string
 */
export function getOrthogonalWirePath(from, to) {
  if (!from || !to) return ''
  const midX = Math.round((from.x + to.x) / 2)
  return `M ${from.x} ${from.y} H ${midX} V ${to.y} H ${to.x}`
}
