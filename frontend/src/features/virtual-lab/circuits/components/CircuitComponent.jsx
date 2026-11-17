import { Battery, CircleDot, Lightbulb, ToggleLeft, Trash2 } from 'lucide-react'
import { useRef } from 'react'
import { getComponentTerminals } from '../../../../../../shared/simulations/circuits/circuitTypes'

const componentIcons = { battery: Battery, bulb: Lightbulb, resistor: CircleDot, switch: ToggleLeft }

export function CircuitComponent({ component, selected, wireMode, pendingTerminal, onSelect, onMove, onDelete, onTerminal }) {
  const Icon = componentIcons[component.type]
  const pointerOffset = useRef(null)

  const handlePointerDown = (event) => {
    event.stopPropagation()
    onSelect(component.id)
    const workspaceBounds = event.currentTarget.parentElement.getBoundingClientRect()
    pointerOffset.current = {
      x: event.clientX - workspaceBounds.left - component.x,
      y: event.clientY - workspaceBounds.top - component.y,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event) => {
    if (!pointerOffset.current) return
    const workspaceBounds = event.currentTarget.parentElement.getBoundingClientRect()
    onMove(component.id, {
      x: event.clientX - workspaceBounds.left - pointerOffset.current.x,
      y: event.clientY - workspaceBounds.top - pointerOffset.current.y,
    })
  }

  const handlePointerUp = () => {
    pointerOffset.current = null
  }

  return (
    <div
      className={`placed-component placed-${component.type} ${selected ? 'selected' : ''}`}
      style={{ left: component.x, top: component.y, transform: `rotate(${component.rotation}deg)` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      role="button"
      tabIndex={0}
      aria-label={`${component.type} component`}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onSelect(component.id)
        if (event.key === 'Delete' || event.key === 'Backspace') onDelete(component.id)
      }}
    >
      <span className="component-terminals">
        {getComponentTerminals(component).map((terminal, index) => (
          <button
            className={`component-terminal ${wireMode ? 'available' : ''} ${pendingTerminal?.componentId === component.id && pendingTerminal.terminalId === terminal.terminalId ? 'pending' : ''}`}
            key={terminal.terminalId}
            style={{ left: index === 0 ? -6 : 86, top: 32 }}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => { event.stopPropagation(); onTerminal(terminal) }}
            aria-label={`Select ${terminal.terminalId} terminal`}
          />
        ))}
      </span>
      <span className="placed-icon"><Icon size={24} /></span>
      <strong>{component.type === 'wire' ? 'Wire' : component.type}</strong>
      {selected && <button className="component-delete" onPointerDown={(event) => event.stopPropagation()} onClick={() => onDelete(component.id)} aria-label={`Delete ${component.type}`}><Trash2 size={13} /></button>}
    </div>
  )
}
