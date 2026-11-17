import { Battery, CircleDot, Lightbulb, ToggleLeft, Cable } from 'lucide-react'
import { CIRCUIT_COMPONENT_TYPES } from '../../../../../../shared/simulations/circuits/circuitTypes'

const icons = { battery: Battery, bulb: Lightbulb, resistor: CircleDot, switch: ToggleLeft, wire: Cable }

export function ComponentToolbox({ onSelect }) {
  return (
    <aside className="builder-toolbox" aria-label="Circuit component toolbox">
      <div className="builder-panel-heading">
        <span className="eyebrow">Toolbox</span>
        <h2>Components</h2>
        <p>Drag a component in, or tap to place it.</p>
      </div>
      <div className="toolbox-items">
        {Object.entries(CIRCUIT_COMPONENT_TYPES).map(([type, definition]) => {
          const Icon = icons[type]
          return (
            <button
              className={`toolbox-item toolbox-${type}`}
              draggable
              key={type}
              onClick={() => onSelect(type)}
              onDragStart={(event) => event.dataTransfer.setData('application/x-labxai-component', type)}
              title={definition.description}
            >
              <span className="toolbox-icon"><Icon size={20} /></span>
              <span><strong>{definition.label}</strong><small>{definition.description}</small></span>
            </button>
          )
        })}
        <button className="toolbox-item toolbox-wire" onClick={onSelect} title="Connect two component terminals">
          <span className="toolbox-icon"><Cable size={20} /></span>
          <span><strong>Connecting wire</strong><small>Connect two terminals</small></span>
        </button>
      </div>
    </aside>
  )
}
