import { useState, useMemo } from 'react'
import { CircuitComponent } from './components/CircuitComponent'
import {
  getComponentTerminals,
  getOrthogonalWirePath,
} from '../../../../../shared/simulations/circuits/circuitTypes'

export function CircuitWorkspace({
  components = [],
  connections = [],
  selectedId,
  selectedWireId,
  wireMode,
  pendingTerminal,
  onSelect,
  onSelectWire,
  onAdd,
  onMove,
  onDelete,
  onDeleteWire,
  onTerminal,
}) {
  const [pointerPosition, setPointerPosition] = useState(null)

  // Map each componentId:terminalId to its current rotated workspace position
  const terminalMap = useMemo(() => {
    const map = new Map()
    components.forEach((component) => {
      const terminals = getComponentTerminals(component, connections)
      terminals.forEach((term) => {
        map.set(`${term.componentId}:${term.terminalId}`, term.position)
      })
    })
    return map
  }, [components, connections])

  const handleDragOver = (event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = (event) => {
    event.preventDefault()
    const type = event.dataTransfer?.getData('application/x-labxai-component')
    if (!type) return

    const bounds = event.currentTarget.getBoundingClientRect()
    const position = {
      x: Math.max(12, Math.min(event.clientX - bounds.left - 46, bounds.width - 104)),
      y: Math.max(12, Math.min(event.clientY - bounds.top - 38, bounds.height - 90)),
    }
    onAdd(type, position)
  }

  const handleWorkspacePointerDown = (event) => {
    // Check if the click target is the workspace background, grid, or empty SVG space
    const target = event.target
    const isBackground =
      target === event.currentTarget ||
      target.classList?.contains('builder-grid') ||
      target.tagName?.toLowerCase() === 'svg' ||
      target.classList?.contains('builder-empty-state')

    if (isBackground) {
      if (!wireMode) {
        onSelect(null)
        if (onSelectWire) onSelectWire(null)
      }
    }
  }

  const handlePointerMove = (event) => {
    if (!wireMode || !pendingTerminal) return
    const bounds = event.currentTarget.getBoundingClientRect()
    setPointerPosition({
      x: Math.round(event.clientX - bounds.left),
      y: Math.round(event.clientY - bounds.top),
    })
  }

  const handleKeyDown = (event) => {
    const tagName = event.target?.tagName?.toLowerCase()
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
      return
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (selectedId) {
        event.preventDefault()
        onDelete(selectedId)
      } else if (selectedWireId && onDeleteWire) {
        event.preventDefault()
        onDeleteWire(selectedWireId)
      }
    }
  }

  return (
    <section
      className={`builder-workspace ${wireMode ? 'wire-mode-active' : ''}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onPointerDown={handleWorkspacePointerDown}
      onPointerMove={handlePointerMove}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label="Circuit builder workspace. Use arrow keys, mouse or touch to build circuits."
    >
      <div className="builder-grid" aria-hidden="true" />

      {/* SVG layer underneath components for wire connections */}
      <svg className="builder-wires" aria-label="Circuit wire connections">
        {connections.map((connection) => {
          const fromPos = terminalMap.get(`${connection.from.componentId}:${connection.from.terminalId}`)
          const toPos = terminalMap.get(`${connection.to.componentId}:${connection.to.terminalId}`)
          if (!fromPos || !toPos) return null

          const pathD = getOrthogonalWirePath(fromPos, toPos)
          const isSelected = selectedWireId === connection.id

          return (
            <g
              key={connection.id}
              className={`builder-wire-group ${isSelected ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                if (!wireMode && onSelectWire) {
                  onSelectWire(connection.id)
                }
              }}
            >
              {/* Invisible wider stroke for easy clicking/touching */}
              <path
                d={pathD}
                className="builder-wire-hitarea"
                pointerEvents="stroke"
              />
              {/* Outer halo when selected */}
              {isSelected && (
                <path
                  d={pathD}
                  className="builder-wire-halo"
                  pointerEvents="none"
                />
              )}
              {/* Visible wire stroke */}
              <path
                d={pathD}
                className={`builder-wire-path ${isSelected ? 'selected' : ''}`}
                pointerEvents="none"
              />
            </g>
          )
        })}

        {/* Live wire preview line while selecting second terminal */}
        {wireMode && pendingTerminal && pointerPosition && (
          <line
            className="builder-wire-preview"
            x1={pendingTerminal.position.x}
            y1={pendingTerminal.position.y}
            x2={pointerPosition.x}
            y2={pointerPosition.y}
          />
        )}
      </svg>

      {/* Placed Components Layer */}
      {components.map((component) => (
        <CircuitComponent
          key={component.id}
          component={component}
          selected={component.id === selectedId}
          wireMode={wireMode}
          pendingTerminal={pendingTerminal}
          connections={connections}
          onSelect={onSelect}
          onMove={onMove}
          onDelete={onDelete}
          onTerminal={onTerminal}
        />
      ))}

      {components.length === 0 && (
        <div className="builder-empty-state">
          <span>+</span>
          <strong>Drop components here</strong>
          <small>or tap an item in the toolbox on the left</small>
        </div>
      )}
    </section>
  )
}
