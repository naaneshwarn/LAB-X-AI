import { Battery, CircleDot, Lightbulb, ToggleLeft, Trash2 } from 'lucide-react'
import { useRef } from 'react'
import { getComponentTerminals } from '../../../../../../shared/simulations/circuits/circuitTypes'

const componentIcons = {
  battery: Battery,
  bulb: Lightbulb,
  resistor: CircleDot,
  switch: ToggleLeft,
}

export function CircuitComponent({
  component,
  selected,
  wireMode,
  pendingTerminal,
  connections = [],
  onSelect,
  onMove,
  onDelete,
  onTerminal,
}) {
  const Icon = componentIcons[component.type] || CircleDot
  const pointerOffset = useRef(null)
  const isDragging = useRef(false)
  const terminals = getComponentTerminals(component, connections)

  const handlePointerDown = (event) => {
    // Prevent event from bubbling to workspace background
    event.stopPropagation()

    if (wireMode) {
      // In wire mode, do not drag components
      return
    }

    onSelect(component.id)

    const workspace = event.currentTarget.closest('.builder-workspace')
    if (!workspace) return

    const workspaceBounds = workspace.getBoundingClientRect()
    pointerOffset.current = {
      x: event.clientX - workspaceBounds.left - component.x,
      y: event.clientY - workspaceBounds.top - component.y,
    }
    isDragging.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event) => {
    if (!isDragging.current || !pointerOffset.current) return
    const workspace = event.currentTarget.closest('.builder-workspace')
    if (!workspace) return

    const workspaceBounds = workspace.getBoundingClientRect()
    const newX = event.clientX - workspaceBounds.left - pointerOffset.current.x
    const newY = event.clientY - workspaceBounds.top - pointerOffset.current.y

    onMove(component.id, {
      x: Math.max(8, Math.min(newX, workspaceBounds.width - 100)),
      y: Math.max(8, Math.min(newY, workspaceBounds.height - 84)),
    })
  }

  const handlePointerUp = (event) => {
    if (isDragging.current) {
      isDragging.current = false
      pointerOffset.current = null
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
    }
  }

  return (
    <div
      className={`placed-component placed-${component.type} ${selected ? 'selected' : ''}`}
      style={{
        left: component.x,
        top: component.y,
        transform: `rotate(${component.rotation || 0}deg)`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      role="button"
      tabIndex={0}
      aria-label={`${component.type} component, ID ${component.id}`}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.stopPropagation()
          onSelect(component.id)
        }
        if (event.key === 'Delete' || event.key === 'Backspace') {
          event.stopPropagation()
          onDelete(component.id)
        }
      }}
    >
      {/* Terminals rendered inside component so they rotate with it */}
      <div className="component-terminals" aria-label="Component terminals">
        {terminals.map((terminal) => {
          const isPending =
            pendingTerminal?.componentId === component.id &&
            pendingTerminal?.terminalId === terminal.terminalId

          return (
            <button
              key={terminal.terminalId}
              type="button"
              className={`component-terminal terminal-${terminal.terminalId} ${
                wireMode ? 'available' : ''
              } ${isPending ? 'pending' : ''} ${terminal.isConnected ? 'connected' : ''}`}
              style={{
                left: terminal.localX - 8,
                top: terminal.localY - 8,
              }}
              onPointerDown={(event) => {
                event.stopPropagation()
              }}
              onClick={(event) => {
                event.stopPropagation()
                onTerminal(terminal)
              }}
              title={`${terminal.name} (${terminal.label})`}
              aria-label={`Terminal ${terminal.label} of ${component.type}`}
            >
              <span className="terminal-badge">{terminal.label}</span>
            </button>
          )
        })}
      </div>

      <span className="placed-icon">
        <Icon size={24} />
      </span>
      <strong>{component.type}</strong>

      {/* Delete button when selected */}
      {selected && (
        <button
          type="button"
          className="component-delete"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation()
            onDelete(component.id)
          }}
          title={`Delete ${component.type}`}
          aria-label={`Delete ${component.type}`}
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  )
}
