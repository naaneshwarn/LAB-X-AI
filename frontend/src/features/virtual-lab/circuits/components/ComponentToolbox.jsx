import { Battery, CircleDot, Lightbulb, ToggleLeft, Cable } from 'lucide-react'
import { CIRCUIT_COMPONENT_TYPES } from '../../../../../../shared/simulations/circuits/circuitTypes'

const componentIcons = {
  battery: Battery,
  bulb: Lightbulb,
  resistor: CircleDot,
  switch: ToggleLeft,
}

export function ComponentToolbox({ onSelectComponent, onStartWire, wireMode }) {
  return (
    <aside className="builder-toolbox" aria-label="Circuit component toolbox">
      <div className="builder-panel-heading">
        <span className="eyebrow">Toolbox</span>
        <h2>Components</h2>
        <p>Drag a component in, or tap to place it.</p>
      </div>

      <div className="toolbox-items">
        {Object.entries(CIRCUIT_COMPONENT_TYPES).map(([type, definition]) => {
          const Icon = componentIcons[type]
          return (
            <button
              key={type}
              type="button"
              className={`toolbox-item toolbox-${type}`}
              draggable
              onClick={() => onSelectComponent(type)}
              onDragStart={(event) => {
                event.dataTransfer.setData('application/x-labxai-component', type)
              }}
              title={definition.description}
            >
              <span className="toolbox-icon">
                <Icon size={20} />
              </span>
              <span>
                <strong>{definition.label}</strong>
                <small>{definition.description}</small>
              </span>
            </button>
          )
        })}

        <div className="toolbox-divider" />

        <button
          type="button"
          className={`toolbox-item toolbox-wire ${wireMode ? 'active' : ''}`}
          onClick={onStartWire}
          title="Connect two component terminals with a wire"
        >
          <span className="toolbox-icon">
            <Cable size={20} />
          </span>
          <span>
            <strong>Connecting Wire</strong>
            <small>{wireMode ? 'Connection mode active' : 'Click to connect terminals'}</small>
          </span>
        </button>
      </div>
    </aside>
  )
}
