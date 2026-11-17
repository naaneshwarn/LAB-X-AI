import { CircuitComponent } from './components/CircuitComponent'
import { getComponentTerminals } from '../../../../../shared/simulations/circuits/circuitTypes'
import { useState } from 'react'

export function CircuitWorkspace({ components, connections, selectedId, wireMode, pendingTerminal, onSelect, onAdd, onMove, onDelete, onTerminal }) {
  const [pointerPosition, setPointerPosition] = useState(null)
  const terminalMap = new Map(components.flatMap((component) => getComponentTerminals(component).map((terminal) => [`${terminal.componentId}:${terminal.terminalId}`, terminal.position])))
  const getPosition = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const type = event.dataTransfer?.getData('application/x-labxai-component')
    return {
      type,
      position: {
        x: Math.max(12, Math.min(event.clientX - bounds.left - 46, bounds.width - 104)),
        y: Math.max(12, Math.min(event.clientY - bounds.top - 38, bounds.height - 90)),
      },
    }
  }

  return (
    <section
      className="builder-workspace"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        const { type, position } = getPosition(event)
        if (type) onAdd(type, position)
      }}
      onPointerDown={() => onSelect(null)}
      onPointerMove={(event) => {
        if (!wireMode || !pendingTerminal) return
        const bounds = event.currentTarget.getBoundingClientRect()
        setPointerPosition({ x: event.clientX - bounds.left, y: event.clientY - bounds.top })
      }}
      onKeyDown={(event) => {
        const target = event.target
        if ((event.key === 'Delete' || event.key === 'Backspace') && target === event.currentTarget) {
          event.preventDefault()
          if (selectedId) onDelete(selectedId)
        }
      }}
      tabIndex={0}
      aria-label="Circuit builder workspace"
    >
      <div className="builder-grid" aria-hidden="true" />
      <svg className="builder-wires" aria-hidden="true">
        {connections.map((connection) => {
          const from = terminalMap.get(`${connection.from.componentId}:${connection.from.terminalId}`)
          const to = terminalMap.get(`${connection.to.componentId}:${connection.to.terminalId}`)
          if (!from || !to) return null
          const midX = (from.x + to.x) / 2
          return <path key={connection.id} d={`M ${from.x} ${from.y} H ${midX} V ${to.y} H ${to.x}`} />
        })}
        {wireMode && pendingTerminal && pointerPosition && <line className="builder-wire-preview" x1={pendingTerminal.position.x} y1={pendingTerminal.position.y} x2={pointerPosition.x} y2={pointerPosition.y} />}
      </svg>
      {components.map((component) => (
        <CircuitComponent
          component={component}
          key={component.id}
          selected={component.id === selectedId}
          wireMode={wireMode}
          pendingTerminal={pendingTerminal}
          onSelect={onSelect}
          onMove={onMove}
          onDelete={onDelete}
          onTerminal={onTerminal}
        />
      ))}
      {!components.length && <div className="builder-empty-state"><span>+</span><strong>Drop components here</strong><small>or tap a toolbox item to place it</small></div>}
    </section>
  )
}
