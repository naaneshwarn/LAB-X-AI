import { useCallback, useState } from 'react'
import { createCircuitComponent } from '../../../../../../shared/simulations/circuits/circuitTypes'

const INITIAL_COMPONENTS = []

export function useCircuitBuilder() {
  const [components, setComponents] = useState(INITIAL_COMPONENTS)
  const [connections, setConnections] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [wireMode, setWireMode] = useState(false)
  const [pendingTerminal, setPendingTerminal] = useState(null)
  const [connectionMessage, setConnectionMessage] = useState('')

  const addComponent = useCallback((type, position) => {
    const component = createCircuitComponent(type, position)
    setComponents((current) => [...current, component])
    setSelectedId(component.id)
    return component.id
  }, [])

  const startWireMode = useCallback(() => {
    setWireMode(true)
    setPendingTerminal(null)
    setConnectionMessage('Select the first terminal')
  }, [])

  const cancelWireMode = useCallback(() => {
    setWireMode(false)
    setPendingTerminal(null)
    setConnectionMessage('')
  }, [])

  const selectTerminal = useCallback((terminal) => {
    if (!wireMode) return
    if (!pendingTerminal) {
      setPendingTerminal(terminal)
      setConnectionMessage('Select the second terminal')
      return
    }
    if (pendingTerminal.componentId === terminal.componentId) {
      setConnectionMessage('Choose a terminal on another component')
      return
    }
    const terminalInUse = connections.some((connection) => (
      (connection.from.componentId === terminal.componentId && connection.from.terminalId === terminal.terminalId)
      || (connection.to.componentId === terminal.componentId && connection.to.terminalId === terminal.terminalId)
    ))
    if (terminalInUse) {
      setConnectionMessage('That terminal is already connected')
      return
    }
    const duplicate = connections.some((connection) => (
      (connection.from.componentId === pendingTerminal.componentId && connection.from.terminalId === pendingTerminal.terminalId && connection.to.componentId === terminal.componentId && connection.to.terminalId === terminal.terminalId)
      || (connection.to.componentId === pendingTerminal.componentId && connection.to.terminalId === pendingTerminal.terminalId && connection.from.componentId === terminal.componentId && connection.from.terminalId === terminal.terminalId)
    ))
    if (duplicate) {
      setConnectionMessage('Those terminals are already connected')
      return
    }
    setConnections((current) => [...current, {
      id: `wire-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      from: { componentId: pendingTerminal.componentId, terminalId: pendingTerminal.terminalId },
      to: { componentId: terminal.componentId, terminalId: terminal.terminalId },
    }])
    cancelWireMode()
  }, [cancelWireMode, connections, pendingTerminal, wireMode])

  const updateComponent = useCallback((id, changes) => {
    setComponents((current) => current.map((component) => (
      component.id === id ? { ...component, ...changes } : component
    )))
  }, [])

  const deleteSelected = useCallback(() => {
    if (!selectedId) return
    setComponents((current) => current.filter((component) => component.id !== selectedId))
    setConnections((current) => current.filter((connection) => connection.from.componentId !== selectedId && connection.to.componentId !== selectedId))
    setSelectedId(null)
  }, [selectedId])

  const deleteComponent = useCallback((id) => {
    setComponents((current) => current.filter((component) => component.id !== id))
    setConnections((current) => current.filter((connection) => connection.from.componentId !== id && connection.to.componentId !== id))
    setSelectedId((current) => current === id ? null : current)
  }, [])

  const reset = useCallback(() => {
    setComponents([])
    setConnections([])
    setSelectedId(null)
    cancelWireMode()
  }, [cancelWireMode])

  return {
    components,
    connections,
    selectedId,
    setSelectedId,
    addComponent,
    updateComponent,
    deleteSelected,
    deleteComponent,
    wireMode,
    pendingTerminal,
    connectionMessage,
    startWireMode,
    cancelWireMode,
    selectTerminal,
    reset,
  }
}
