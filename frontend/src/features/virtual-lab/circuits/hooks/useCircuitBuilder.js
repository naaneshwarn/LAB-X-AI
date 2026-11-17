import { useCallback, useState } from 'react'
import {
  createCircuitComponent,
  validateWireConnection,
} from '../../../../../../shared/simulations/circuits/circuitTypes'

let wireCounter = 0

export function useCircuitBuilder() {
  const [components, setComponents] = useState([])
  const [connections, setConnections] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [selectedWireId, setSelectedWireId] = useState(null)
  const [wireMode, setWireMode] = useState(false)
  const [pendingTerminal, setPendingTerminal] = useState(null)
  const [connectionMessage, setConnectionMessage] = useState('')

  const selectComponent = useCallback((id) => {
    setSelectedId(id)
    setSelectedWireId(null)
  }, [])

  const selectWire = useCallback((wireId) => {
    setSelectedWireId(wireId)
    setSelectedId(null)
  }, [])

  const addComponent = useCallback((type, position) => {
    const component = createCircuitComponent(type, position)
    setComponents((current) => [...current, component])
    setSelectedId(component.id)
    setSelectedWireId(null)
    setWireMode(false)
    setPendingTerminal(null)
    setConnectionMessage('')
    return component.id
  }, [])

  const updateComponent = useCallback((id, changes) => {
    setComponents((current) =>
      current.map((comp) => (comp.id === id ? { ...comp, ...changes } : comp))
    )
  }, [])

  const deleteComponent = useCallback((id) => {
    if (!id) return
    setComponents((current) => current.filter((comp) => comp.id !== id))
    setConnections((current) =>
      current.filter(
        (conn) => conn.from.componentId !== id && conn.to.componentId !== id
      )
    )
    setSelectedId((current) => (current === id ? null : current))
  }, [])

  const deleteWire = useCallback((wireId) => {
    if (!wireId) return
    setConnections((current) => current.filter((conn) => conn.id !== wireId))
    setSelectedWireId((current) => (current === wireId ? null : current))
  }, [])

  const deleteSelected = useCallback(() => {
    if (selectedId) {
      deleteComponent(selectedId)
    } else if (selectedWireId) {
      deleteWire(selectedWireId)
    }
  }, [deleteComponent, deleteWire, selectedId, selectedWireId])

  const startWireMode = useCallback(() => {
    setWireMode(true)
    setPendingTerminal(null)
    setSelectedId(null)
    setSelectedWireId(null)
    setConnectionMessage('Select the first terminal')
  }, [])

  const cancelWireMode = useCallback(() => {
    setWireMode(false)
    setPendingTerminal(null)
    setConnectionMessage('')
  }, [])

  const selectTerminal = useCallback(
    (terminal) => {
      if (!wireMode) {
        // If not already in wire mode, clicking a terminal initiates wire mode with it as the starting terminal
        setWireMode(true)
        setSelectedId(null)
        setSelectedWireId(null)
        setPendingTerminal(terminal)
        setConnectionMessage('Select the second terminal')
        return
      }

      // If we don't have a starting terminal yet
      if (!pendingTerminal) {
        setPendingTerminal(terminal)
        setConnectionMessage('Select the second terminal')
        return
      }

      // We have both terminals, validate the connection
      const validation = validateWireConnection(pendingTerminal, terminal, connections)
      if (!validation.valid) {
        setConnectionMessage(validation.error || 'Invalid connection')
        return
      }

      // Create new wire connection
      wireCounter += 1
      const newConnection = {
        id: `wire-${Date.now()}-${wireCounter}-${Math.random().toString(36).slice(2, 7)}`,
        from: {
          componentId: pendingTerminal.componentId,
          terminalId: pendingTerminal.terminalId,
        },
        to: {
          componentId: terminal.componentId,
          terminalId: terminal.terminalId,
        },
      }

      setConnections((current) => [...current, newConnection])
      setWireMode(false)
      setPendingTerminal(null)
      setConnectionMessage('')
    },
    [connections, pendingTerminal, wireMode]
  )

  const reset = useCallback(() => {
    setComponents([])
    setConnections([])
    setSelectedId(null)
    setSelectedWireId(null)
    setWireMode(false)
    setPendingTerminal(null)
    setConnectionMessage('')
  }, [])

  return {
    components,
    connections,
    selectedId,
    selectedWireId,
    wireMode,
    pendingTerminal,
    connectionMessage,
    onSelect: selectComponent,
    setSelectedId: selectComponent,
    selectComponent,
    selectWire,
    addComponent,
    updateComponent,
    deleteComponent,
    deleteWire,
    deleteSelected,
    startWireMode,
    cancelWireMode,
    selectTerminal,
    reset,
  }
}
