import { RotateCcw, Trash2, Cable } from 'lucide-react'
import { ComponentToolbox } from './components/ComponentToolbox'
import { CircuitWorkspace } from './CircuitWorkspace'
import { SelectedComponentPanel } from './components/SelectedComponentPanel'
import { useCircuitBuilder } from './hooks/useCircuitBuilder'
import '../../../styles/circuitBuilder.css'

export function CircuitBuilder({ onBack }) {
  const builder = useCircuitBuilder()
  const selected = builder.components.find((c) => c.id === builder.selectedId)
  const selectedWire = builder.connections.find((c) => c.id === builder.selectedWireId)

  const placeFromToolbox = (type) => {
    builder.addComponent(type, {
      x: 48 + (builder.components.length % 4) * 116,
      y: 48 + Math.floor(builder.components.length / 4) * 96,
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
        <button type="button" className="back-button" onClick={onBack}>
          ← Predefined circuit
        </button>
        <div>
          <span className="eyebrow">Stage 2 · Interactive Circuit Builder</span>
          <h1>Build your own circuit</h1>
        </div>
        <button type="button" className="reset-button" onClick={builder.reset}>
          <RotateCcw size={14} /> Reset workspace
        </button>
      </div>

      <div className="builder-layout">
        <ComponentToolbox
          onSelectComponent={placeFromToolbox}
          onStartWire={builder.startWireMode}
          wireMode={builder.wireMode}
        />

        <div className="builder-canvas-column">
          <div className="builder-canvas-header">
            <div>
              <strong>Workspace</strong>
              <span>
                {builder.components.length} component{builder.components.length === 1 ? '' : 's'} ·{' '}
                {builder.connections.length} wire{builder.connections.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="builder-canvas-actions">
              {builder.wireMode ? (
                <div className="builder-connection-banner">
                  <Cable size={14} className="builder-wire-icon" />
                  <span className="builder-connection-message">
                    {builder.connectionMessage || 'Select a terminal to connect'}
                  </span>
                  <button
                    type="button"
                    className="builder-cancel-link"
                    onClick={builder.cancelWireMode}
                  >
                    Cancel
                  </button>
                </div>
              ) : selected ? (
                <button
                  type="button"
                  className="builder-delete-link"
                  onClick={builder.deleteSelected}
                >
                  <Trash2 size={14} /> Delete selected component
                </button>
              ) : selectedWire ? (
                <button
                  type="button"
                  className="builder-delete-link"
                  onClick={builder.deleteSelected}
                >
                  <Trash2 size={14} /> Delete selected wire
                </button>
              ) : null}
            </div>
          </div>

          <CircuitWorkspace
            components={builder.components}
            connections={builder.connections}
            selectedId={builder.selectedId}
            selectedWireId={builder.selectedWireId}
            wireMode={builder.wireMode}
            pendingTerminal={builder.pendingTerminal}
            onSelect={builder.selectComponent}
            onSelectWire={builder.selectWire}
            onAdd={builder.addComponent}
            onMove={moveComponent}
            onDelete={builder.deleteComponent}
            onDeleteWire={builder.deleteWire}
            onTerminal={builder.selectTerminal}
          />

          <p className="builder-help">
            <strong>Controls:</strong> Click to select · Drag to reposition · Click Connecting Wire and click two terminals to create a wire · Press Delete or Backspace to remove selected items.
          </p>
        </div>

        <SelectedComponentPanel
          component={selected}
          selectedWire={selectedWire}
          onRotate={() => {
            if (selected) {
              builder.updateComponent(selected.id, {
                rotation: ((selected.rotation || 0) + 90) % 360,
              })
            }
          }}
          onDeleteComponent={builder.deleteComponent}
          onDeleteWire={builder.deleteWire}
        />
      </div>
    </main>
  )
}
