import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Copy, RotateCw, Trash2, Zap, Route } from 'lucide-react';
import { getComponentDef } from '../../simulations/playground/circuitSolver';
import {
  buildRoundedSvgPath,
  computeWireRoute,
  findNearestTerminal,
  getTerminalGeometry,
  samplePolyline,
} from '../../simulations/playground/wireRouter';
import Lightweight3DCanvas from '../../components/Lightweight3DCanvas';

export function getTerminalCoords(comp, terminalId) {
  return getTerminalGeometry(comp, terminalId);
}

const BASE_W = 760;
const BASE_H = 440;
const GRID_STEP = 10;

export default function CircuitCanvas({
  components,
  wires,
  solution,
  running,
  tick,
  selectedId,
  selectedWireId,
  toolMode = 'select', // 'select' | 'wire'
  pendingTerminal,
  wireColor = '#2563eb',
  showGrid = true,
  snapToGrid = true,
  zoom = 1,
  pan = { x: 0, y: 0 },
  view3D = false,
  onZoomPanChange,
  onSelectComponent,
  onSelectWire,
  onMoveComponent,
  onMoveCommit,
  onDropNewComponent,
  onStartWire,
  onCompleteWire,
  onCancelWire,
  onUpdateWireWaypoints,
  onToggleSwitch,
  onRotateComponent,
  onDuplicateComponent,
  onDeleteComponent,
  onDeleteWire,
  onResetWireRoute,
}) {
  const svgRef = useRef(null);
  const [spacePressed, setSpacePressed] = useState(false);
  const [pointerSvg, setPointerSvg] = useState(null);
  const [hoveredTerminal, setHoveredTerminal] = useState(null);
  const [dragGhost, setDragGhost] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [invalidSnapNotice, setInvalidSnapNotice] = useState('');

  // Unified pointer interaction state machine ref
  const interactionRef = useRef({ mode: 'idle' });

  const snap = (val) => (snapToGrid ? Math.round(val / GRID_STEP) * GRID_STEP : Math.round(val));

  const clientToSvg = (clientX, clientY, z = zoom, p = pan) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return { x: BASE_W / 2, y: BASE_H / 2 };
    const vbW = BASE_W / z;
    const vbH = BASE_H / z;
    return {
      x: p.x + ((clientX - rect.left) / rect.width) * vbW,
      y: p.y + ((clientY - rect.top) / rect.height) * vbH,
    };
  };

  // Track Spacebar for Space+Drag panning
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        setSpacePressed(true);
      }
      if (e.key === 'Escape') {
        setContextMenu(null);
        setInvalidSnapNotice('');
        interactionRef.current = { mode: 'idle' };
        onCancelWire?.();
      }
    };
    const onKeyUp = (e) => {
      if (e.code === 'Space') setSpacePressed(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [onCancelWire]);

  // Pointer-centered mouse-wheel zoom without accidental page scroll
  useEffect(() => {
    const el = svgRef.current;
    if (!el || view3D) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : 0.89;
      const nextZoom = Math.max(0.55, Math.min(2.4, Number((zoom * factor).toFixed(3))));
      if (nextZoom === zoom) return;

      const rect = el.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width;
      const relY = (e.clientY - rect.top) / rect.height;

      const oldW = BASE_W / zoom;
      const oldH = BASE_H / zoom;
      const newW = BASE_W / nextZoom;
      const newH = BASE_H / nextZoom;

      const worldX = pan.x + relX * oldW;
      const worldY = pan.y + relY * oldH;

      onZoomPanChange?.(nextZoom, {
        x: worldX - relX * newW,
        y: worldY - relY * newH,
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoom, pan, view3D, onZoomPanChange]);

  // Precompute orthogonal rounded routes for all logical wires
  const routedWires = useMemo(() => {
    return wires
      .map((w) => {
        const c1 = components.find((c) => c.id === w.from.componentId);
        const c2 = components.find((c) => c.id === w.to.componentId);
        if (!c1 || !c2) return null;
        const t1 = getTerminalGeometry(c1, w.from.terminalId);
        const t2 = getTerminalGeometry(c2, w.to.terminalId);
        const points = computeWireRoute(t1, t2, components, [c1.id, c2.id], w.waypoints || []);
        const pathD = buildRoundedSvgPath(points, 10);
        return { wire: w, points, pathD };
      })
      .filter(Boolean);
  }, [wires, components]);

  // Live wire preview route while drawing (Click-Click OR Click-Drag!)
  const livePreview = useMemo(() => {
    if (!pendingTerminal || !pointerSvg) return null;
    const srcComp = components.find((c) => c.id === pendingTerminal.componentId);
    if (!srcComp) return null;
    const startGeom = getTerminalGeometry(srcComp, pendingTerminal.terminalId);
    const snappedTarget = findNearestTerminal(pointerSvg, components, pendingTerminal, 26);

    const endGeom = snappedTarget
      ? { x: snappedTarget.x, y: snappedTarget.y, nx: snappedTarget.nx, ny: snappedTarget.ny }
      : { x: snap(pointerSvg.x), y: snap(pointerSvg.y), nx: 0, ny: 0 };

    const ignoreIds = snappedTarget ? [srcComp.id, snappedTarget.componentId] : [srcComp.id];
    const pts = computeWireRoute(startGeom, endGeom, components, ignoreIds);
    return {
      pathD: buildRoundedSvgPath(pts, 10),
      snappedTarget,
      endGeom,
    };
  }, [pendingTerminal, pointerSvg, components, snapToGrid]);

  // Optional 3D Workbench View
  const circuit3D = useMemo(() => {
    const nodes = components.map((c) => {
      const res = solution?.componentResults?.[c.id];
      const colorMap = {
        battery: '#2563eb',
        'dc-supply': '#0284c7',
        resistor: '#fb923c',
        'variable-resistor': '#f59e0b',
        bulb: running && res?.active ? '#facc15' : '#94a3b8',
        led: running && res?.active ? '#ef4444' : '#94a3b8',
        switch: c.closed !== false ? '#22c55e' : '#ef4444',
        ammeter: '#0ea5e9',
        voltmeter: '#8b5cf6',
        capacitor: '#14b8a6',
        diode: '#64748b',
      };
      return {
        id: c.id,
        x: (c.x - BASE_W / 2) * 0.55,
        y: (c.y - BASE_H / 2) * 0.55,
        z: 10,
        rx: 20,
        ry: 15,
        color: colorMap[c.type] || '#38bdf8',
        label: c.label || getComponentDef(c.type).name,
      };
    });
    const tubes = wires
      .map((w) => {
        const c1 = components.find((c) => c.id === w.from.componentId);
        const c2 = components.find((c) => c.id === w.to.componentId);
        if (!c1 || !c2) return null;
        return {
          id: w.id,
          x1: (c1.x - BASE_W / 2) * 0.55,
          y1: (c1.y - BASE_H / 2) * 0.55,
          z1: 10,
          x2: (c2.x - BASE_W / 2) * 0.55,
          y2: (c2.y - BASE_H / 2) * 0.55,
          z2: 10,
          radius: 4,
          color: w.color || (running && solution?.circuitClosed ? '#facc15' : '#38bdf8'),
        };
      })
      .filter(Boolean);
    return { nodes, tubes };
  }, [components, wires, solution, running]);

  if (view3D) {
    return (
      <Lightweight3DCanvas
        nodes={circuit3D.nodes}
        tubes={circuit3D.tubes}
        selectedId={selectedId}
        onSelect={onSelectComponent}
        width={BASE_W}
        height={BASE_H}
        bgColor="#f0f9ff"
        hintText="3D Circuit Preview · Drag to rotate · Switch to 2D Canvas to draw/edit wires"
      />
    );
  }

  // Drag-and-drop from Left Component Library with live placement ghost
  const handleDragOver = (e) => {
    e.preventDefault();
    const pt = clientToSvg(e.clientX, e.clientY);
    setDragGhost({ x: snap(pt.x), y: snap(pt.y) });
  };

  const handleDragLeave = () => {
    setDragGhost(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragGhost(null);
    const type = e.dataTransfer.getData('application/labxai-component');
    if (!type) return;
    const pt = clientToSvg(e.clientX, e.clientY);
    onDropNewComponent?.(type, { x: snap(pt.x), y: snap(pt.y) });
  };

  // Pointer handlers implementing clean interaction state machine
  const handleCanvasPointerDown = (e) => {
    setContextMenu(null);
    setInvalidSnapNotice('');

    // Middle-mouse button OR Space+LeftClick OR clicking background pans canvas
    const isMiddle = e.button === 1;
    const isBg = e.target === svgRef.current || e.target.dataset.bg === 'grid';

    if (isMiddle || spacePressed) {
      e.preventDefault();
      interactionRef.current = {
        mode: 'panning',
        startX: e.clientX,
        startY: e.clientY,
        origPan: { ...pan },
      };
      return;
    }

    if (isBg && e.button === 0) {
      if (pendingTerminal) {
        onCancelWire?.();
        return;
      }
      onSelectComponent?.(null);
      onSelectWire?.(null);
      interactionRef.current = {
        mode: 'panning',
        startX: e.clientX,
        startY: e.clientY,
        origPan: { ...pan },
      };
    }
  };

  const handleTerminalPointerDown = (e, term) => {
    e.stopPropagation();
    setContextMenu(null);
    setInvalidSnapNotice('');
    if (e.button !== 0 || spacePressed) return;

    const pt = clientToSvg(e.clientX, e.clientY);
    setPointerSvg(pt);

    if (pendingTerminal) {
      // Second click in click-click wiring flow
      if (pendingTerminal.componentId === term.componentId) {
        if (pendingTerminal.terminalId === term.terminalId) {
          onCancelWire?.();
        } else {
          setInvalidSnapNotice('Cannot connect a component directly to its own terminal.');
        }
        return;
      }
      onCompleteWire?.(pendingTerminal, term);
      interactionRef.current = { mode: 'idle' };
      return;
    }

    // Start new wire (works for BOTH click-click AND click-drag!)
    onStartWire?.(term);
    interactionRef.current = {
      mode: 'drawing-wire',
      startTerminal: term,
      startClientX: e.clientX,
      startClientY: e.clientY,
      dragged: false,
    };
  };

  const handleComponentPointerDown = (e, comp) => {
    e.stopPropagation();
    setContextMenu(null);
    if (e.button === 1 || spacePressed) {
      interactionRef.current = {
        mode: 'panning',
        startX: e.clientX,
        startY: e.clientY,
        origPan: { ...pan },
      };
      return;
    }
    if (e.button !== 0) return;

    // Prevent wiring to component body when drawing wire — give helpful feedback!
    if (pendingTerminal) {
      setInvalidSnapNotice('Snap the wire to a colored terminal dot — not the component body.');
      return;
    }

    onSelectComponent?.(comp.id);
    if (toolMode === 'wire') return;

    const pt = clientToSvg(e.clientX, e.clientY);
    interactionRef.current = {
      mode: 'dragging-component',
      id: comp.id,
      dx: pt.x - comp.x,
      dy: pt.y - comp.y,
      moved: false,
    };
  };

  const handleWaypointPointerDown = (e, wire, wpIndex, isNew = false, initialPt = null) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    const baseWaypoints = Array.isArray(wire.waypoints) ? [...wire.waypoints] : [];
    let targetIndex = wpIndex;
    if (isNew && initialPt) {
      baseWaypoints.splice(wpIndex, 0, { x: snap(initialPt.x), y: snap(initialPt.y) });
      onUpdateWireWaypoints?.(wire.id, baseWaypoints, false);
    }
    interactionRef.current = {
      mode: 'dragging-waypoint',
      wireId: wire.id,
      wpIndex: targetIndex,
      waypoints: baseWaypoints,
    };
  };

  const handlePointerMove = (e) => {
    const pt = clientToSvg(e.clientX, e.clientY);
    setPointerSvg(pt);

    const state = interactionRef.current;

    // Proximity hover detection for magnetic terminal highlighting
    if (state.mode === 'idle' || state.mode === 'drawing-wire') {
      const near = findNearestTerminal(pt, components, pendingTerminal, 24);
      setHoveredTerminal(near);
    }

    if (state.mode === 'panning') {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const dx = ((e.clientX - state.startX) / rect.width) * (BASE_W / zoom);
      const dy = ((e.clientY - state.startY) / rect.height) * (BASE_H / zoom);
      onZoomPanChange?.(zoom, {
        x: state.origPan.x - dx,
        y: state.origPan.y - dy,
      });
    } else if (state.mode === 'dragging-component') {
      state.moved = true;
      const nx = snap(pt.x - state.dx);
      const ny = snap(pt.y - state.dy);
      onMoveComponent?.(state.id, { x: nx, y: ny });
    } else if (state.mode === 'drawing-wire') {
      if (Math.hypot(e.clientX - state.startClientX, e.clientY - state.startClientY) > 10) {
        state.dragged = true;
      }
    } else if (state.mode === 'dragging-waypoint') {
      const updated = state.waypoints.map((wp, idx) =>
        idx === state.wpIndex ? { x: snap(pt.x), y: snap(pt.y) } : wp
      );
      state.waypoints = updated;
      onUpdateWireWaypoints?.(state.wireId, updated, false);
    }
  };

  const handlePointerUp = (e) => {
    const state = interactionRef.current;
    if (state.mode === 'dragging-component' && state.moved) {
      onMoveCommit?.();
    } else if (state.mode === 'dragging-waypoint') {
      onUpdateWireWaypoints?.(state.wireId, state.waypoints, true);
    } else if (state.mode === 'drawing-wire' && state.dragged) {
      // Complete Click-and-Drag wire if released near a compatible terminal!
      const pt = clientToSvg(e.clientX, e.clientY);
      const target = findNearestTerminal(pt, components, state.startTerminal, 28);
      if (target && target.compatible) {
        onCompleteWire?.(state.startTerminal, {
          componentId: target.componentId,
          terminalId: target.terminalId,
        });
      } else if (target && !target.compatible) {
        setInvalidSnapNotice(target.reason);
        onCancelWire?.();
      } else {
        onCancelWire?.();
      }
    }
    interactionRef.current = { mode: 'idle' };
  };

  const openContextMenu = (e, payload) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setContextMenu({
      x: Math.min(rect.width - 175, Math.max(8, e.clientX - rect.left)),
      y: Math.min(rect.height - 150, Math.max(8, e.clientY - rect.top)),
      ...payload,
    });
  };

  const vbW = BASE_W / zoom;
  const vbH = BASE_H / zoom;

  const renderComponentBody = (comp) => {
    const res = solution?.componentResults?.[comp.id];
    const active = running && Boolean(res?.active);
    const brightness = active ? res?.brightness || 0 : 0;

    switch (comp.type) {
      case 'battery':
      case 'dc-supply':
        return (
          <g>
            <rect x="-34" y="-22" width="68" height="44" rx="9" fill="#dbeafe" stroke="#2563eb" strokeWidth="2.5" />
            <rect x="-34" y="-22" width="18" height="44" rx="7" fill="#2563eb" />
            <text x="-25" y="4" textAnchor="middle" fontSize="13" fontWeight="900" fill="#fff">+</text>
            <text x="24" y="4" textAnchor="middle" fontSize="13" fontWeight="900" fill="#1e3a8a">−</text>
            <text x="3" y="4" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#1e293b">
              {comp.voltage ?? 12}V
            </text>
          </g>
        );
      case 'resistor':
      case 'variable-resistor':
        return (
          <g>
            <line x1="-42" y1="0" x2="-24" y2="0" stroke="#475569" strokeWidth="3" />
            <line x1="24" y1="0" x2="42" y2="0" stroke="#475569" strokeWidth="3" />
            <rect x="-24" y="-13" width="48" height="26" rx="6" fill="#fef3c7" stroke="#d97706" strokeWidth="2.2" />
            <rect x="-14" y="-12" width="5" height="24" fill="#ef4444" />
            <rect x="-3" y="-12" width="5" height="24" fill="#2563eb" />
            <rect x="8" y="-12" width="5" height="24" fill="#22c55e" />
            {comp.type === 'variable-resistor' && (
              <path d="M-16,18 L18,-18" stroke="#0f172a" strokeWidth="2" />
            )}
            <text x="0" y="25" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#92400e">
              {comp.resistance ?? 100} Ω
            </text>
          </g>
        );
      case 'bulb':
        return (
          <g>
            {active && (
              <circle cx="0" cy="-2" r={26 + brightness * 13} fill="#facc15" fillOpacity={0.22 + brightness * 0.36} />
            )}
            <line x1="-42" y1="0" x2="-18" y2="0" stroke="#475569" strokeWidth="3" />
            <line x1="18" y1="0" x2="42" y2="0" stroke="#475569" strokeWidth="3" />
            <circle
              cx="0"
              cy="-2"
              r="20"
              fill={active ? '#fef08a' : '#f1f5f9'}
              stroke={active ? '#eab308' : '#64748b'}
              strokeWidth="2.5"
            />
            <path d="M-8,6 L-4,-6 L4,-6 L8,6" fill="none" stroke={active ? '#ea580c' : '#94a3b8'} strokeWidth="2.2" />
            <text x="0" y="30" textAnchor="middle" fontSize="9" fontWeight="800" fill="#334155">
              {active ? `${res.power} W` : `${comp.resistance ?? 24} Ω`}
            </text>
          </g>
        );
      case 'led':
        return (
          <g>
            {active && <circle cx="0" cy="0" r="26" fill={comp.color || '#ef4444'} fillOpacity="0.28" />}
            <line x1="-42" y1="0" x2="-14" y2="0" stroke="#475569" strokeWidth="3" />
            <line x1="14" y1="0" x2="42" y2="0" stroke="#475569" strokeWidth="3" />
            <polygon points="-14,-13 12,0 -14,13" fill={active ? (comp.color || '#ef4444') : '#fca5a5'} stroke="#991b1b" strokeWidth="2" />
            <line x1="12" y1="-13" x2="12" y2="13" stroke="#991b1b" strokeWidth="3" />
            <text x="0" y="25" textAnchor="middle" fontSize="9" fontWeight="800" fill="#991b1b">
              LED {active ? `${(res.current * 1000).toFixed(0)}mA` : '(A→K)'}
            </text>
          </g>
        );
      case 'switch': {
        const closed = comp.closed !== false;
        return (
          <g
            onDoubleClick={(e) => {
              e.stopPropagation();
              onToggleSwitch?.(comp.id);
            }}
          >
            <rect x="-34" y="-18" width="68" height="36" rx="8" fill={closed ? '#dcfce7' : '#fee2e2'} stroke={closed ? '#16a34a' : '#dc2626'} strokeWidth="2" />
            <circle cx="-18" cy="2" r="4" fill="#1e293b" />
            <circle cx="18" cy="2" r="4" fill="#1e293b" />
            <line
              x1="-18"
              y1="2"
              x2="16"
              y2={closed ? '2' : '-12'}
              stroke="#1e293b"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <text x="0" y="30" textAnchor="middle" fontSize="9" fontWeight="800" fill={closed ? '#15803d' : '#b91c1c'}>
              Switch: {closed ? 'ON' : 'OFF'}
            </text>
          </g>
        );
      }
      case 'ammeter':
      case 'voltmeter': {
        const isAmp = comp.type === 'ammeter';
        const val = running && res
          ? isAmp
            ? `${res.current.toFixed(2)} A`
            : `${res.voltageDrop.toFixed(2)} V`
          : isAmp
          ? '0.00 A'
          : '0.00 V';
        return (
          <g>
            <line x1="-42" y1="0" x2="-22" y2="0" stroke="#475569" strokeWidth="3" />
            <line x1="22" y1="0" x2="42" y2="0" stroke="#475569" strokeWidth="3" />
            <circle cx="0" cy="0" r="22" fill="#1e293b" stroke={isAmp ? '#38bdf8' : '#a78bfa'} strokeWidth="3" />
            <text x="0" y="-4" textAnchor="middle" fontSize="9" fontWeight="800" fill={isAmp ? '#38bdf8' : '#c4b5fd'}>
              {isAmp ? 'A' : 'V'}
            </text>
            <text x="0" y="9" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#ffffff">
              {val}
            </text>
          </g>
        );
      }
      case 'capacitor':
        return (
          <g>
            <line x1="-42" y1="0" x2="-7" y2="0" stroke="#475569" strokeWidth="3" />
            <line x1="7" y1="0" x2="42" y2="0" stroke="#475569" strokeWidth="3" />
            <line x1="-7" y1="-18" x2="-7" y2="18" stroke="#0d9488" strokeWidth="4" />
            <line x1="7" y1="-18" x2="7" y2="18" stroke="#0d9488" strokeWidth="4" />
            <text x="0" y="29" textAnchor="middle" fontSize="9" fontWeight="800" fill="#0f766e">
              {comp.capacitance_uf ?? 100} μF
            </text>
          </g>
        );
      case 'diode':
      default:
        return (
          <g>
            <line x1="-42" y1="0" x2="-12" y2="0" stroke="#475569" strokeWidth="3" />
            <line x1="12" y1="0" x2="42" y2="0" stroke="#475569" strokeWidth="3" />
            <polygon points="-12,-12 10,0 -12,12" fill="#64748b" stroke="#1e293b" strokeWidth="2" />
            <line x1="10" y1="-12" x2="10" y2="12" stroke="#1e293b" strokeWidth="3" />
            <text x="0" y="24" textAnchor="middle" fontSize="9" fontWeight="800" fill="#334155">Diode</text>
          </g>
        );
    }
  };

  const hasFault = solution && !solution.valid && solution.errors.length > 0;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-sky-200 bg-white shadow-inner dark:border-navy-700 dark:bg-navy-950"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Inline Helpful Feedback Toast on Canvas */}
      {invalidSnapNotice && (
        <div className="absolute left-3 top-3 z-20 rounded-xl border border-rose-200 bg-rose-50/95 px-3 py-1.5 text-xs font-bold text-rose-700 shadow-sm">
          {invalidSnapNotice}
        </div>
      )}

      {/* Interactive SVG Circuit Canvas */}
      <svg
        ref={svgRef}
        viewBox={`${pan.x} ${pan.y} ${vbW} ${vbH}`}
        className={`block h-[440px] w-full select-none touch-none ${
          spacePressed
            ? 'cursor-grab active:cursor-grabbing'
            : toolMode === 'wire' || pendingTerminal
            ? 'cursor-crosshair'
            : 'cursor-default'
        }`}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          setHoveredTerminal(null);
          if (interactionRef.current.mode === 'panning' || interactionRef.current.mode === 'dragging-component') {
            interactionRef.current = { mode: 'idle' };
          }
        }}
        role="application"
        aria-label="Interactive Electrical Circuit Canvas"
      >
        <defs>
          <pattern id="pg-grid-minor" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.7" />
          </pattern>
          <pattern id="pg-grid-major" width="100" height="100" patternUnits="userSpaceOnUse">
            <rect width="100" height="100" fill="url(#pg-grid-minor)" />
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#cbd5e1" strokeWidth="1" />
          </pattern>
        </defs>

        <rect data-bg="grid" x={pan.x - 1200} y={pan.y - 1200} width={vbW + 2400} height={vbH + 2400} fill="#f8fafc" />
        {showGrid && (
          <rect data-bg="grid" x={pan.x - 1200} y={pan.y - 1200} width={vbW + 2400} height={vbH + 2400} fill="url(#pg-grid-major)" />
        )}

        {/* Drag-and-drop placement preview ghost */}
        {dragGhost && (
          <g transform={`translate(${dragGhost.x}, ${dragGhost.y})`} className="pointer-events-none">
            <rect x="-44" y="-24" width="88" height="48" rx="10" fill="#38bdf8" fillOpacity="0.2" stroke="#2563eb" strokeWidth="2" strokeDasharray="5 3" />
            <text x="0" y="4" textAnchor="middle" fontSize="10" fontWeight="800" fill="#1d4ed8">Drop Here</text>
          </g>
        )}

        {/* Routed Orthogonal Rounded Wires */}
        {routedWires.map(({ wire, points, pathD }) => {
          const isSel = wire.id === selectedWireId;
          const energized = running && solution?.circuitClosed;
          const strokeColor = hasFault
            ? '#ef4444'
            : isSel
            ? '#f59e0b'
            : wire.color || (energized ? '#2563eb' : '#475569');

          const electron1 = energized ? samplePolyline(points, (tick * 0.015) % 1) : null;
          const electron2 = energized ? samplePolyline(points, (tick * 0.015 + 0.5) % 1) : null;

          // Midpoints for adding new bend points on selected wire
          const segMidpoints = isSel
            ? points.slice(0, -1).map((p, i) => ({
                x: (p.x + points[i + 1].x) / 2,
                y: (p.y + points[i + 1].y) / 2,
                len: Math.hypot(points[i + 1].x - p.x, points[i + 1].y - p.y),
              }))
            : [];

          return (
            <g
              key={wire.id}
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onSelectWire?.(wire.id);
              }}
              onContextMenu={(e) => {
                onSelectWire?.(wire.id);
                openContextMenu(e, { kind: 'wire', id: wire.id });
              }}
            >
              {/* Wide invisible hit stroke for easy wire clicking */}
              <path d={pathD} fill="none" stroke="transparent" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />

              {/* Soft glow halo when selected or energized */}
              {(isSel || energized) && (
                <path
                  d={pathD}
                  fill="none"
                  stroke={isSel ? '#facc15' : '#38bdf8'}
                  strokeOpacity={isSel ? 0.45 : 0.25}
                  strokeWidth={isSel ? 10 : 8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Primary crisp rounded wire */}
              <path
                d={pathD}
                fill="none"
                stroke={strokeColor}
                strokeWidth={isSel ? 4.2 : 3.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Animated Electron Flow Dots following exact orthogonal polyline */}
              {electron1 && (
                <circle cx={electron1.x} cy={electron1.y} r="4.3" fill="#facc15" stroke="#1e293b" strokeWidth="1.2" className="pointer-events-none" />
              )}
              {electron2 && (
                <circle cx={electron2.x} cy={electron2.y} r="4.3" fill="#facc15" stroke="#1e293b" strokeWidth="1.2" className="pointer-events-none" />
              )}

              {/* Existing Draggable Bend Point Handles (when wire selected) */}
              {isSel &&
                (wire.waypoints || []).map((wp, idx) => (
                  <circle
                    key={`wp-${idx}`}
                    cx={wp.x}
                    cy={wp.y}
                    r="6.5"
                    fill="#facc15"
                    stroke="#1e293b"
                    strokeWidth="2"
                    className="cursor-move"
                    onPointerDown={(e) => handleWaypointPointerDown(e, wire, idx, false)}
                  />
                ))}

              {/* Segment Midpoint Handles — Drag to bend wire anywhere! */}
              {isSel &&
                segMidpoints.map((mp, idx) =>
                  mp.len > 48 ? (
                    <circle
                      key={`mp-${idx}`}
                      cx={mp.x}
                      cy={mp.y}
                      r="5"
                      fill="#ffffff"
                      stroke="#2563eb"
                      strokeWidth="2"
                      className="cursor-move"
                      onPointerDown={(e) =>
                        handleWaypointPointerDown(
                          e,
                          wire,
                          Math.min((wire.waypoints || []).length, idx),
                          true,
                          mp
                        )
                      }
                    />
                  ) : null
                )}
            </g>
          );
        })}

        {/* Live Orthogonal Wire Preview While Drawing */}
        {livePreview && (
          <g className="pointer-events-none">
            <path
              d={livePreview.pathD}
              fill="none"
              stroke={
                livePreview.snappedTarget
                  ? livePreview.snappedTarget.compatible
                    ? '#22c55e'
                    : '#ef4444'
                  : wireColor
              }
              strokeWidth="3.5"
              strokeDasharray="7 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {livePreview.snappedTarget && (
              <circle
                cx={livePreview.snappedTarget.x}
                cy={livePreview.snappedTarget.y}
                r="13"
                fill={livePreview.snappedTarget.compatible ? '#22c55e' : '#ef4444'}
                fillOpacity="0.22"
                stroke={livePreview.snappedTarget.compatible ? '#16a34a' : '#dc2626'}
                strokeWidth="2.5"
              />
            )}
          </g>
        )}

        {/* Placed Electrical Components */}
        {components.map((comp) => {
          const def = getComponentDef(comp.type);
          const isSel = comp.id === selectedId;
          return (
            <g
              key={comp.id}
              transform={`translate(${comp.x}, ${comp.y}) rotate(${comp.rotation || 0})`}
              className={toolMode === 'wire' ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}
              onPointerDown={(e) => handleComponentPointerDown(e, comp)}
              onContextMenu={(e) => {
                onSelectComponent?.(comp.id);
                openContextMenu(e, { kind: 'component', id: comp.id, comp });
              }}
            >
              {isSel && (
                <rect
                  x="-54"
                  y="-32"
                  width="108"
                  height="68"
                  rx="14"
                  fill="#38bdf8"
                  fillOpacity="0.12"
                  stroke="#2563eb"
                  strokeWidth="2"
                  strokeDasharray="5 3"
                />
              )}

              {renderComponentBody(comp)}

              <text x="0" y="-26" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#334155">
                {comp.label || def.name}
              </text>

              {/* High-Precision Interactive Connection Terminals */}
              {def.terminals.map((termId, idx) => {
                const tx = idx === 0 ? -44 : 44;
                const isPending =
                  pendingTerminal?.componentId === comp.id &&
                  pendingTerminal?.terminalId === termId;
                const isHovered =
                  hoveredTerminal?.componentId === comp.id &&
                  hoveredTerminal?.terminalId === termId;
                const termLabel =
                  termId === 'pos' ? '+' : termId === 'neg' ? '−' : idx === 0 ? '1' : '2';

                return (
                  <g
                    key={termId}
                    className="cursor-crosshair"
                    onPointerDown={(e) =>
                      handleTerminalPointerDown(e, { componentId: comp.id, terminalId: termId })
                    }
                  >
                    {/* Generous invisible hit target for easy student clicking */}
                    <circle cx={tx} cy="0" r="14" fill="transparent" />
                    {/* Proximity approach halo */}
                    {(isHovered || isPending) && (
                      <circle
                        cx={tx}
                        cy="0"
                        r="12"
                        fill={
                          isPending
                            ? '#facc15'
                            : hoveredTerminal?.compatible === false
                            ? '#ef4444'
                            : '#22c55e'
                        }
                        fillOpacity="0.28"
                      />
                    )}
                    <circle
                      cx={tx}
                      cy="0"
                      r={isHovered || isPending ? 7.8 : 6.2}
                      fill={
                        isPending
                          ? '#facc15'
                          : termId === 'pos'
                          ? '#ef4444'
                          : termId === 'neg'
                          ? '#2563eb'
                          : '#22c55e'
                      }
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    {isHovered && (
                      <text
                        x={tx}
                        y="-12"
                        textAnchor="middle"
                        fontSize="8.5"
                        fontWeight="800"
                        fill="#0f172a"
                      >
                        {termLabel}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>

      {/* Right-Click Context Menu */}
      {contextMenu && (
        <div
          className="absolute z-30 w-44 rounded-xl border border-slate-200 bg-white p-1.5 text-xs shadow-elevated dark:border-navy-700 dark:bg-navy-900"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.kind === 'component' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onRotateComponent?.(contextMenu.id);
                  setContextMenu(null);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-sky-50 dark:text-slate-200 dark:hover:bg-navy-800"
              >
                <RotateCw className="h-3.5 w-3.5 text-blue-600" /> Rotate 90° (R)
              </button>
              <button
                type="button"
                onClick={() => {
                  onDuplicateComponent?.(contextMenu.id);
                  setContextMenu(null);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-sky-50 dark:text-slate-200 dark:hover:bg-navy-800"
              >
                <Copy className="h-3.5 w-3.5 text-emerald-600" /> Duplicate
              </button>
              {contextMenu.comp?.type === 'switch' && (
                <button
                  type="button"
                  onClick={() => {
                    onToggleSwitch?.(contextMenu.id);
                    setContextMenu(null);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-sky-50 dark:text-slate-200 dark:hover:bg-navy-800"
                >
                  <Zap className="h-3.5 w-3.5 text-amber-500" /> Toggle Switch
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  onDeleteComponent?.(contextMenu.id);
                  setContextMenu(null);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete Component
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  onResetWireRoute?.(contextMenu.id);
                  setContextMenu(null);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-sky-50 dark:text-slate-200 dark:hover:bg-navy-800"
              >
                <Route className="h-3.5 w-3.5 text-blue-600" /> Auto-Route Wire
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteWire?.(contextMenu.id);
                  setContextMenu(null);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete Wire
              </button>
            </>
          )}
        </div>
      )}

      {/* Helpful Canvas Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-sky-100 bg-sky-50/60 px-3.5 py-1.5 text-[11px] font-medium text-slate-600 dark:border-navy-800 dark:bg-navy-900 dark:text-slate-300">
        <span>
          {pendingTerminal
            ? 'Drawing wire: Click or drop onto another terminal dot to snap · Press Esc to cancel'
            : selectedWireId
            ? 'Wire selected: Drag any blue/yellow circle on the wire to reroute bend points · Right-click for Auto-Route'
            : 'Click or drag between colored terminal dots to wire · Scroll to zoom · Space+drag to pan · Right-click parts for menu'}
        </span>
        <span className="font-mono text-[10px] font-extrabold text-blue-700 dark:text-sky-300">
          {Math.round(zoom * 100)}% · {components.length} parts · {wires.length} wires
        </span>
      </div>
    </div>
  );
}
