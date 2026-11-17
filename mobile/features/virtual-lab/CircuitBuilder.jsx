import { useRef, useState } from 'react'
import { Pressable, Text, View, ScrollView } from 'react-native'
import {
  Battery,
  Cable,
  CircleDot,
  Lightbulb,
  RotateCcw,
  RotateCw,
  Trash2,
  ToggleLeft,
} from 'lucide-react-native'
import Svg, { Path, Line } from 'react-native-svg'
import {
  CIRCUIT_COMPONENT_TYPES,
  createCircuitComponent,
  getComponentTerminals,
  validateWireConnection,
  getOrthogonalWirePath,
} from '../../../shared/simulations/circuits/circuitTypes'
import { colors } from '../../constants/theme'

const componentIcons = {
  battery: Battery,
  bulb: Lightbulb,
  resistor: CircleDot,
  switch: ToggleLeft,
}

function MobileComponent({
  component,
  selected,
  wireMode,
  pendingTerminal,
  connections,
  onSelect,
  onMove,
  onDelete,
  onTerminal,
}) {
  const start = useRef(null)
  const Icon = componentIcons[component.type] || CircleDot
  const terminals = getComponentTerminals(component, connections)

  return (
    <Pressable
      onPress={() => onSelect(component.id)}
      onLongPress={(event) => {
        start.current = {
          x: event.nativeEvent.pageX - component.x,
          y: event.nativeEvent.pageY - component.y,
        }
        onSelect(component.id)
      }}
      onTouchMove={(event) => {
        if (!start.current) return
        const { pageX, pageY } = event.nativeEvent
        onMove(component.id, {
          x: Math.max(8, pageX - start.current.x),
          y: Math.max(8, pageY - start.current.y),
        })
      }}
      onTouchEnd={() => {
        start.current = null
      }}
      style={{
        position: 'absolute',
        left: component.x,
        top: component.y,
        width: 92,
        height: 76,
        borderRadius: 12,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? colors.blue : '#C9D6E8',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: selected ? 10 : 2,
        shadowColor: '#344D72',
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: selected ? 4 : 2,
        transform: [{ rotate: `${component.rotation || 0}deg` }],
      }}
    >
      {/* Terminals with comfortable touch targets */}
      {terminals.map((terminal) => {
        const isPending =
          pendingTerminal?.componentId === component.id &&
          pendingTerminal?.terminalId === terminal.terminalId

        return (
          <Pressable
            key={terminal.terminalId}
            onPress={(event) => {
              event.stopPropagation()
              onTerminal(terminal)
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
              position: 'absolute',
              left: terminal.localX - 12,
              top: terminal.localY - 12,
              width: 24,
              height: 24,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: isPending
                ? '#FFFFFF'
                : wireMode
                ? colors.blue
                : terminal.isConnected
                ? colors.green
                : '#64748B',
              backgroundColor: isPending ? colors.blue : '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 12,
              elevation: 4,
            }}
          >
            <Text
              style={{
                fontSize: 8,
                fontWeight: '700',
                color: isPending ? '#FFFFFF' : '#475569',
              }}
            >
              {terminal.label}
            </Text>
          </Pressable>
        )
      })}

      <Icon
        size={22}
        color={
          component.type === 'bulb'
            ? colors.orange
            : component.type === 'resistor'
            ? colors.purple
            : component.type === 'switch'
            ? colors.green
            : colors.blue
        }
      />
      <Text
        style={{
          color: colors.muted,
          fontSize: 9,
          fontWeight: '600',
          marginTop: 4,
          textTransform: 'capitalize',
        }}
      >
        {component.type}
      </Text>

      {/* Delete button when selected */}
      {selected && (
        <Pressable
          onPress={(event) => {
            event.stopPropagation()
            onDelete(component.id)
          }}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          style={{
            position: 'absolute',
            right: -8,
            top: -8,
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#FECACA',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 14,
            elevation: 5,
          }}
        >
          <Trash2 size={12} color="#DC2626" />
        </Pressable>
      )}
    </Pressable>
  )
}

export function CircuitBuilder({ onBack }) {
  const [components, setComponents] = useState([])
  const [connections, setConnections] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [wireMode, setWireMode] = useState(false)
  const [pendingTerminal, setPendingTerminal] = useState(null)
  const [connectionMessage, setConnectionMessage] = useState('')

  const selected = components.find((c) => c.id === selectedId)

  const add = (type) => {
    const component = createCircuitComponent(type, {
      x: 18 + (components.length % 3) * 106,
      y: 28 + Math.floor(components.length / 3) * 92,
    })
    setComponents((current) => [...current, component])
    setSelectedId(component.id)
    setWireMode(false)
    setPendingTerminal(null)
    setConnectionMessage('')
  }

  const update = (id, changes) => {
    setComponents((current) =>
      current.map((c) => (c.id === id ? { ...c, ...changes } : c))
    )
  }

  const rotate = (id) => {
    const target = components.find((c) => c.id === id)
    if (target) {
      update(id, { rotation: ((target.rotation || 0) + 90) % 360 })
    }
  }

  const remove = (id) => {
    setComponents((current) => current.filter((c) => c.id !== id))
    setConnections((current) =>
      current.filter((c) => c.from.componentId !== id && c.to.componentId !== id)
    )
    setSelectedId((current) => (current === id ? null : current))
  }

  const reset = () => {
    setComponents([])
    setConnections([])
    setSelectedId(null)
    setWireMode(false)
    setPendingTerminal(null)
    setConnectionMessage('')
  }

  const selectTerminal = (terminal) => {
    if (!wireMode) {
      setWireMode(true)
      setSelectedId(null)
      setPendingTerminal(terminal)
      setConnectionMessage('Select the second terminal')
      return
    }

    if (!pendingTerminal) {
      setPendingTerminal(terminal)
      setConnectionMessage('Select the second terminal')
      return
    }

    const validation = validateWireConnection(pendingTerminal, terminal, connections)
    if (!validation.valid) {
      setConnectionMessage(validation.error || 'Invalid connection')
      return
    }

    const newConnection = {
      id: `wire-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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
  }

  return (
    <View style={{ marginTop: 18, flex: 1 }}>
      {/* Top action bar */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <Pressable onPress={onBack}>
          <Text style={{ color: colors.blue, fontSize: 13, fontWeight: '600' }}>
            ← Predefined circuit
          </Text>
        </Pressable>
        <Pressable
          onPress={reset}
          style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}
        >
          <RotateCcw size={14} color={colors.blue} />
          <Text style={{ color: colors.blue, fontSize: 12, fontWeight: '600' }}>
            Reset
          </Text>
        </Pressable>
      </View>

      <Text
        style={{
          color: colors.blue,
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}
      >
        Stage 2 · Interactive Circuit Builder
      </Text>
      <Text
        style={{
          color: colors.navy,
          fontSize: 24,
          fontWeight: '700',
          marginTop: 4,
        }}
      >
        Build your own circuit
      </Text>

      {/* Component & Wire Toolbox */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
        {Object.entries(CIRCUIT_COMPONENT_TYPES).map(([type, definition]) => {
          const Icon = componentIcons[type] || CircleDot
          return (
            <Pressable
              key={type}
              onPress={() => add(type)}
              style={{
                flex: 1,
                minWidth: 58,
                alignItems: 'center',
                paddingVertical: 8,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#DDE6F2',
                backgroundColor: '#FFFFFF',
              }}
            >
              <Icon size={18} color={colors.blue} />
              <Text
                numberOfLines={1}
                style={{
                  color: colors.navy,
                  fontSize: 9,
                  fontWeight: '600',
                  marginTop: 3,
                }}
              >
                {definition.label}
              </Text>
            </Pressable>
          )
        })}

        <Pressable
          onPress={() => {
            if (wireMode) {
              setWireMode(false)
              setPendingTerminal(null)
              setConnectionMessage('')
            } else {
              setWireMode(true)
              setPendingTerminal(null)
              setSelectedId(null)
              setConnectionMessage('Select the first terminal')
            }
          }}
          style={{
            flex: 1,
            minWidth: 58,
            alignItems: 'center',
            paddingVertical: 8,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: wireMode ? colors.blue : '#DDE6F2',
            backgroundColor: wireMode ? '#EDF4FF' : '#FFFFFF',
          }}
        >
          <Cable size={18} color={colors.blue} />
          <Text
            numberOfLines={1}
            style={{
              color: colors.navy,
              fontSize: 9,
              fontWeight: '600',
              marginTop: 3,
            }}
          >
            {wireMode ? 'Wiring' : 'Wire'}
          </Text>
        </Pressable>
      </View>

      {/* Status banner in wire mode */}
      {wireMode && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#EDF4FF',
            paddingVertical: 7,
            paddingHorizontal: 12,
            borderRadius: 8,
            marginTop: 10,
            borderWidth: 1,
            borderColor: '#BFDBFE',
          }}
        >
          <Text style={{ color: colors.blue, fontSize: 11, fontWeight: '600', flex: 1 }}>
            {connectionMessage || 'Tap a terminal to connect'}
          </Text>
          <Pressable
            onPress={() => {
              setWireMode(false)
              setPendingTerminal(null)
              setConnectionMessage('')
            }}
          >
            <Text style={{ color: '#DC2626', fontSize: 11, fontWeight: '700' }}>
              Cancel
            </Text>
          </Pressable>
        </View>
      )}

      {/* Workspace Area */}
      <View
        style={{
          height: 480,
          marginTop: 10,
          borderWidth: 1,
          borderColor: '#DDE6F2',
          borderRadius: 14,
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          position: 'relative',
        }}
      >
        <Pressable
          onPress={() => {
            if (!wireMode) setSelectedId(null)
          }}
          style={{ position: 'absolute', inset: 0, backgroundColor: '#F8FBFF' }}
        />

        {/* SVG wire layer underneath components */}
        <Svg style={{ position: 'absolute', inset: 0, zIndex: 1 }} width="100%" height="100%">
          {connections.map((connection) => {
            const fromComp = components.find((c) => c.id === connection.from.componentId)
            const toComp = components.find((c) => c.id === connection.to.componentId)
            if (!fromComp || !toComp) return null

            const fromTerms = getComponentTerminals(fromComp)
            const toTerms = getComponentTerminals(toComp)
            const fromTerm = fromTerms.find((t) => t.terminalId === connection.from.terminalId)
            const toTerm = toTerms.find((t) => t.terminalId === connection.to.terminalId)
            if (!fromTerm || !toTerm) return null

            const pathD = getOrthogonalWirePath(fromTerm.position, toTerm.position)

            return (
              <Path
                key={connection.id}
                d={pathD}
                stroke={colors.blue}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )
          })}
        </Svg>

        {/* Components layer */}
        {components.map((component) => (
          <MobileComponent
            key={component.id}
            component={component}
            selected={component.id === selectedId}
            wireMode={wireMode}
            pendingTerminal={pendingTerminal}
            connections={connections}
            onSelect={(id) => {
              if (!wireMode) setSelectedId(id)
            }}
            onMove={update}
            onDelete={remove}
            onTerminal={selectTerminal}
          />
        ))}

        {components.length === 0 && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.muted, fontSize: 13 }}>
              Tap a component above to place it
            </Text>
          </View>
        )}
      </View>

      {/* Selected Component Floating Action Bar */}
      {selected && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#E6ECF5',
            borderRadius: 12,
            padding: 12,
            marginTop: 10,
          }}
        >
          <View>
            <Text
              style={{
                color: colors.navy,
                fontSize: 13,
                fontWeight: '700',
                textTransform: 'capitalize',
              }}
            >
              {selected.type}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 10, marginTop: 2 }}>
              ID: {selected.id.slice(0, 16)}... · {selected.rotation || 0}°
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={() => rotate(selected.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: colors.blueLight,
                paddingVertical: 7,
                paddingHorizontal: 11,
                borderRadius: 8,
              }}
            >
              <RotateCw size={13} color={colors.blue} />
              <Text style={{ color: colors.blue, fontSize: 11, fontWeight: '700' }}>
                Rotate
              </Text>
            </Pressable>

            <Pressable
              onPress={() => remove(selected.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: '#FFF1F2',
                paddingVertical: 7,
                paddingHorizontal: 11,
                borderRadius: 8,
              }}
            >
              <Trash2 size={13} color="#DC2626" />
              <Text style={{ color: '#DC2626', fontSize: 11, fontWeight: '700' }}>
                Delete
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      <Text
        style={{
          color: colors.muted,
          fontSize: 10,
          lineHeight: 16,
          marginTop: 10,
        }}
      >
        Tip: Long-press a component and drag to move. Tap Wire then tap two terminals to connect them. Tap Rotate to turn a component 90°.
      </Text>
    </View>
  )
}
