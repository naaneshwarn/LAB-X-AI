import { RotateCw, Trash2, Cable } from 'lucide-react'

export function SelectedComponentPanel({
  component,
  selectedWire,
  onRotate,
  onDeleteComponent,
  onDeleteWire,
}) {
  if (selectedWire) {
    return (
      <aside className="builder-properties" aria-label="Selected wire properties">
        <span className="eyebrow">Selected Connection</span>
        <h2>
          <Cable size={18} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
          Connecting Wire
        </h2>
        <dl>
          <div>
            <dt>Wire ID</dt>
            <dd>{selectedWire.id}</dd>
          </div>
          <div>
            <dt>From</dt>
            <dd>
              {selectedWire.from.componentId} ({selectedWire.from.terminalId})
            </dd>
          </div>
          <div>
            <dt>To</dt>
            <dd>
              {selectedWire.to.componentId} ({selectedWire.to.terminalId})
            </dd>
          </div>
        </dl>
        <div className="builder-property-actions">
          <button
            type="button"
            className="builder-danger-button"
            onClick={() => onDeleteWire(selectedWire.id)}
          >
            <Trash2 size={14} /> Delete Wire
          </button>
        </div>
      </aside>
    )
  }

  if (!component) {
    return (
      <aside className="builder-properties builder-properties-empty">
        <span className="eyebrow">Properties</span>
        <p>Click a component or wire in the workspace to view and edit its properties.</p>
      </aside>
    )
  }

  return (
    <aside className="builder-properties" aria-label="Selected component properties">
      <span className="eyebrow">Selected Component</span>
      <h2>{component.type.charAt(0).toUpperCase() + component.type.slice(1)}</h2>
      <dl>
        <div>
          <dt>Component ID</dt>
          <dd>{component.id}</dd>
        </div>
        <div>
          <dt>Coordinates</dt>
          <dd>
            X: {Math.round(component.x)}, Y: {Math.round(component.y)}
          </dd>
        </div>
        <div>
          <dt>Rotation</dt>
          <dd>{component.rotation || 0}°</dd>
        </div>
        {component.properties?.voltage !== undefined && (
          <div>
            <dt>Voltage</dt>
            <dd>{component.properties.voltage} V</dd>
          </div>
        )}
        {component.properties?.resistance !== undefined && (
          <div>
            <dt>Resistance</dt>
            <dd>{component.properties.resistance} Ω</dd>
          </div>
        )}
      </dl>
      <div className="builder-property-actions">
        <button
          type="button"
          className="builder-secondary-button"
          onClick={onRotate}
        >
          <RotateCw size={14} /> Rotate 90°
        </button>
        <button
          type="button"
          className="builder-danger-button"
          onClick={() => onDeleteComponent(component.id)}
        >
          <Trash2 size={14} /> Delete Component
        </button>
      </div>
    </aside>
  )
}
