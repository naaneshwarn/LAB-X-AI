import { useRef, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Battery, Cable, CircleDot, Lightbulb, RotateCcw, Trash2, ToggleLeft } from 'lucide-react-native'
import Svg, { Line } from 'react-native-svg'
import { CIRCUIT_COMPONENT_TYPES, createCircuitComponent, getComponentTerminals } from '../../../shared/simulations/circuits/circuitTypes'
import { colors } from '../../constants/theme'

const icons = { battery: Battery, bulb: Lightbulb, resistor: CircleDot, switch: ToggleLeft, wire: Cable }

function MobileComponent({ component, selected, wireMode, pendingTerminal, onSelect, onMove, onDelete, onTerminal }) {
  const start = useRef(null)
  const Icon = icons[component.type]
  return <Pressable
    onPress={() => onSelect(component.id)}
    onLongPress={(event) => { start.current = { x: event.nativeEvent.pageX - component.x, y: event.nativeEvent.pageY - component.y }; onSelect(component.id) }}
    onTouchMove={(event) => {
      if (!start.current) return
      const { pageX, pageY } = event.nativeEvent
      onMove(component.id, { x: Math.max(8, pageX - start.current.x), y: Math.max(8, pageY - start.current.y) })
    }}
    onTouchEnd={() => { start.current = null }}
    style={{ position: 'absolute', left: component.x, top: component.y, width: 88, height: 70, borderRadius: 10, borderWidth: selected ? 2 : 1, borderColor: selected ? colors.blue : '#C9D6E8', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}
  >
    {getComponentTerminals(component).map((terminal, index) => <Pressable key={terminal.terminalId} onPress={(event) => { event.stopPropagation(); onTerminal(terminal) }} style={{ position: 'absolute', left: index === 0 ? -9 : 79, top: 26, width: wireMode ? 30 : 20, height: wireMode ? 30 : 20, borderRadius: 16, borderWidth: 3, borderColor: pendingTerminal?.componentId === component.id && pendingTerminal.terminalId === terminal.terminalId ? '#fff' : wireMode ? colors.blue : '#8DA3C1', backgroundColor: pendingTerminal?.componentId === component.id && pendingTerminal.terminalId === terminal.terminalId ? colors.blue : '#fff', zIndex: 4 }} />)}
    <Icon size={22} color={component.type === 'bulb' ? '#E99B46' : colors.blue} />
    <Text style={{ color: colors.muted, fontSize: 9, marginTop: 3 }}>{component.type}</Text>
    {selected && <Pressable onPress={() => onDelete(component.id)} style={{ position: 'absolute', right: -9, top: -9, borderRadius: 12, padding: 4, backgroundColor: '#fff' }}><Trash2 size={13} color="#CC625E" /></Pressable>}
  </Pressable>
}

export function CircuitBuilder({ onBack }) {
  const [components, setComponents] = useState([])
  const [connections, setConnections] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [wireMode, setWireMode] = useState(false)
  const [pendingTerminal, setPendingTerminal] = useState(null)
  const [connectionMessage, setConnectionMessage] = useState('')
  const add = (type) => {
    const component = createCircuitComponent(type, { x: 18 + (components.length % 3) * 102, y: 25 + (components.length % 4) * 84 })
    setComponents((current) => [...current, component])
    setSelectedId(component.id)
  }
  const update = (id, changes) => setComponents((current) => current.map((component) => component.id === id ? { ...component, ...changes } : component))
  const remove = (id) => { setComponents((current) => current.filter((component) => component.id !== id)); setConnections((current) => current.filter((connection) => connection.from.componentId !== id && connection.to.componentId !== id)); setSelectedId(null) }
  const reset = () => { setComponents([]); setConnections([]); setSelectedId(null); setWireMode(false); setPendingTerminal(null); setConnectionMessage('') }
  const selectTerminal = (terminal) => {
    if (!wireMode) return
    if (!pendingTerminal) { setPendingTerminal(terminal); setConnectionMessage('Select the second terminal'); return }
    if (pendingTerminal.componentId === terminal.componentId) { setConnectionMessage('Choose another component'); return }
    const duplicate = connections.some((connection) => (
      (connection.from.componentId === pendingTerminal.componentId && connection.from.terminalId === pendingTerminal.terminalId && connection.to.componentId === terminal.componentId && connection.to.terminalId === terminal.terminalId)
      || (connection.to.componentId === pendingTerminal.componentId && connection.to.terminalId === pendingTerminal.terminalId && connection.from.componentId === terminal.componentId && connection.from.terminalId === terminal.terminalId)
    ))
    if (duplicate) { setConnectionMessage('Those terminals are already connected'); return }
    setConnections((current) => [...current, { id: `wire-${Date.now()}`, from: { componentId: pendingTerminal.componentId, terminalId: pendingTerminal.terminalId }, to: { componentId: terminal.componentId, terminalId: terminal.terminalId } }])
    setWireMode(false); setPendingTerminal(null); setConnectionMessage('')
  }

  return <View style={{ marginTop: 18 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
      <Pressable onPress={onBack}><Text style={{ color: colors.blue, fontSize: 12 }}>← Predefined circuit</Text></Pressable>
      <Pressable onPress={reset} style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}><RotateCcw size={14} color={colors.blue} /><Text style={{ color: colors.blue, fontSize: 11 }}>Reset</Text></Pressable>
    </View>
    <Text style={{ color: colors.blue, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>STAGE 1 · CIRCUIT BUILDER</Text>
    <Text style={{ color: colors.navy, fontSize: 25, fontWeight: '700', marginTop: 6 }}>Build your own circuit</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 15 }}>
      {Object.entries(CIRCUIT_COMPONENT_TYPES).map(([type, definition]) => { const Icon = icons[type]; return <Pressable key={type} onPress={() => add(type)} style={{ width: '18%', minWidth: 56, alignItems: 'center', paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#DDE6F2', backgroundColor: '#fff' }}><Icon size={18} color={colors.blue} /><Text numberOfLines={1} style={{ color: colors.navy, fontSize: 8, marginTop: 4 }}>{definition.label}</Text></Pressable> })}
      <Pressable onPress={() => { setWireMode(true); setPendingTerminal(null); setConnectionMessage('Select the first terminal') }} style={{ width: '18%', minWidth: 56, alignItems: 'center', paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: wireMode ? colors.blue : '#DDE6F2', backgroundColor: '#fff' }}><Cable size={18} color={colors.blue} /><Text numberOfLines={1} style={{ color: colors.navy, fontSize: 8, marginTop: 4 }}>Wire</Text></Pressable>
    </View>
    <View style={{ height: 470, marginTop: 12, borderWidth: 1, borderColor: '#DDE6F2', borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff' }}>
      <View style={{ position: 'absolute', inset: 0, opacity: .7, backgroundColor: '#F8FBFF' }} />
      <Svg style={{ position: 'absolute', inset: 0, zIndex: 1 }} width="100%" height="100%">
        {connections.map((connection) => {
          const from = getComponentTerminals(components.find((component) => component.id === connection.from.componentId)).find((terminal) => terminal.terminalId === connection.from.terminalId)
          const to = getComponentTerminals(components.find((component) => component.id === connection.to.componentId)).find((terminal) => terminal.terminalId === connection.to.terminalId)
          return <Line key={connection.id} x1={from.position.x + 8} y1={from.position.y + 8} x2={to.position.x + 8} y2={to.position.y + 8} stroke="#527DBD" strokeWidth="4" />
        })}
      </Svg>
      {components.map((component) => <MobileComponent key={component.id} component={component} selected={component.id === selectedId} wireMode={wireMode} pendingTerminal={pendingTerminal} onSelect={setSelectedId} onMove={update} onDelete={remove} onTerminal={selectTerminal} />)}
      {!components.length && <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.muted, fontSize: 12 }}>Tap a component above to place it</Text></View>}
    </View>
    {wireMode && <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 9 }}><Text style={{ color: colors.blue, fontSize: 10 }}>{connectionMessage}</Text><Pressable onPress={() => { setWireMode(false); setPendingTerminal(null); setConnectionMessage('') }}><Text style={{ color: '#CC625E', fontSize: 10 }}>Cancel</Text></Pressable></View>}
    <Text style={{ color: colors.muted, fontSize: 10, lineHeight: 16, marginTop: 9 }}>Long-press a component, then drag it to move. Tap Wire, then tap two terminals to connect them.</Text>
  </View>
}
