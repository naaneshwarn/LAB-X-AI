import { RotateCcw, Trash2 } from 'lucide-react'
import { ComponentToolbox } from './components/ComponentToolbox'
import { CircuitWorkspace } from './CircuitWorkspace'
import { SelectedComponentPanel } from './components/SelectedComponentPanel'
import { useCircuitBuilder } from './hooks/useCircuitBuilder'
import '../../../styles/circuitBuilder.css'

export function CircuitBuilder({ onBack }) {
  const builder = useCircuitBuilder()
  const selected = builder.components.find((component) => component.id === builder.selectedId)
  const placeFromToolbox = (type) => {
    if (!type) return builder.startWireMode()
    builder.addComponent(type, {
    x: 42 + (builder.components.length % 4) * 112,
    y: 42 + (builder.components.length % 3) * 92,
    })
  }

  const moveComponent = (id, position) => {
    builder.updateComponent(id, {
      x: Math.max(12, position.x),
      y: Math.max(12, position.y),
    })
  }

  return (
    <main className="builder-page">
      <div className="builder-topline">
        <button className="back-button" onClick={onBack}>← Predefined circuit</button>
        <div><span className="eyebrow">Stage 1 · Interactive circuit builder</span><h1>Build your own circuit</h1></div>
        <button className="reset-button" onClick={builder.reset}><RotateCcw size={14} /> Reset workspace</button>
      </div>
      <div className="builder-layout">
        <ComponentToolbox onSelect={placeFromToolbox} />
        <div className="builder-canvas-column">
          <div className="builder-canvas-header"><div><strong>Workspace</strong><span>{builder.components.length} component{builder.components.length === 1 ? '' : 's'}</span></div><div className="builder-canvas-actions">{builder.wireMode && <><span className="builder-connection-message">{builder.connectionMessage}</span><button className="builder-cancel-link" onClick={builder.cancelWireMode}>Cancel</button></>}{selected && <button className="builder-delete-link" onClick={builder.deleteSelected}><Trash2 size={14} /> Delete selected</button>}</div></div>
          <CircuitWorkspace {...builder} onAdd={builder.addComponent} onMove={moveComponent} onDelete={builder.deleteComponent} onTerminal={builder.selectTerminal} />
          <p className="builder-help">Tip: Select and drag components to align them. Stage 1 focuses on building; terminals are ready for future connections.</p>
        </div>
        <SelectedComponentPanel component={selected} onRotate={() => builder.updateComponent(selected.id, { rotation: selected.rotation + 90 })} onDelete={builder.deleteSelected} />
      </div>
    </main>
  )
}
