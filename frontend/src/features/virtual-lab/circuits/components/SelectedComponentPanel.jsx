import { RotateCw, Trash2 } from 'lucide-react'

export function SelectedComponentPanel({ component, onRotate, onDelete }) {
  if (!component) {
    return <aside className="builder-properties builder-properties-empty"><span className="eyebrow">Properties</span><p>Select a component to view its properties.</p></aside>
  }

  return (
    <aside className="builder-properties">
      <span className="eyebrow">Selected component</span>
      <h2>{component.type === 'wire' ? 'Connecting wire' : component.type}</h2>
      <dl>
        <div><dt>Component ID</dt><dd>{component.id}</dd></div>
        <div><dt>Position</dt><dd>{Math.round(component.x)}, {Math.round(component.y)}</dd></div>
        <div><dt>Terminals</dt><dd>2 prepared</dd></div>
      </dl>
      <div className="builder-property-actions">
        <button className="builder-secondary-button" onClick={onRotate}><RotateCw size={14} /> Rotate</button>
        <button className="builder-danger-button" onClick={onDelete}><Trash2 size={14} /> Delete</button>
      </div>
      <p className="builder-note">Connections and electrical validation will be added in a future stage.</p>
    </aside>
  )
}
