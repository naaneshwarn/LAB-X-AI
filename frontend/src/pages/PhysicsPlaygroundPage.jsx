import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Box,
  Cable,
  CheckCircle2,
  Copy,
  Cpu,
  Download,
  FilePlus2,
  FolderOpen,
  Grid3X3,
  Layers,
  Magnet,
  Maximize2,
  MousePointer2,
  Pause,
  Play,
  Plus,
  Redo2,
  RotateCcw,
  RotateCw,
  Route,
  Save,
  Search,
  Sparkles,
  Square,
  Trash2,
  Undo2,
  Zap,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { labApi } from '../api/client';
import { useApp } from '../context/AppContext';
import {
  CIRCUIT_COMPONENT_DEFS,
  CIRCUIT_PRESETS,
  getComponentDef,
  solveCircuit,
} from '../simulations/playground/circuitSolver';
import { WIRE_COLORS } from '../simulations/playground/wireRouter';
import {
  evaluateMechanicsState,
  MECHANICS_DEFAULTS,
  MECHANICS_SCENES,
} from '../simulations/playground/mechanicsEngine';
import {
  evaluateOptics,
  OPTICS_DEFAULTS,
  OPTICS_ELEMENTS,
} from '../simulations/playground/opticsEngine';
import CircuitCanvas from '../features/playground/CircuitCanvas';
import MechanicsCanvas from '../features/playground/MechanicsCanvas';
import OpticsCanvas from '../features/playground/OpticsCanvas';
import AiTutorPanel from '../components/AiTutorPanel';
import { Badge, Modal } from '../components/StatusStates';

const MODES = [
  { id: 'circuit', label: 'Electrical Circuits', icon: Zap, color: 'bg-blue-600' },
  { id: 'mechanics', label: 'Mechanics Lab', icon: Cpu, color: 'bg-orange-500' },
  { id: 'optics', label: 'Optics Bench', icon: Sparkles, color: 'bg-violet-600' },
];

export default function PhysicsPlaygroundPage() {
  const { studentId, lowPowerMode, addToast } = useApp();

  // Mode & Persistent Project State
  const [mode, setMode] = useState('circuit');
  const [projectId, setProjectId] = useState(null);
  const [projectName, setProjectName] = useState("Ohm's Law Starter Circuit");
  const [savedProjects, setSavedProjects] = useState([]);
  const [openModalVisible, setOpenModalVisible] = useState(false);
  const [savingProject, setSavingProject] = useState(false);

  // Electrical Circuit Graph (independent of SVG paths!) + Undo/Redo
  const [components, setComponents] = useState(CIRCUIT_PRESETS.ohmsLaw.components);
  const [wires, setWires] = useState(CIRCUIT_PRESETS.ohmsLaw.wires);
  const [historyPast, setHistoryPast] = useState([]);
  const [historyFuture, setHistoryFuture] = useState([]);
  const [selectedId, setSelectedId] = useState('res-1');
  const [selectedWireId, setSelectedWireId] = useState(null);
  const [toolMode, setToolMode] = useState('select'); // 'select' | 'wire'
  const [pendingTerminal, setPendingTerminal] = useState(null);
  const [activeWireColor, setActiveWireColor] = useState(WIRE_COLORS[0].hex);

  // Canvas View Controls
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);

  // Mechanics & Optics State
  const [mechConfig, setMechConfig] = useState(MECHANICS_DEFAULTS);
  const [mechTime, setMechTime] = useState(0);
  const [opticsConfig, setOpticsConfig] = useState(OPTICS_DEFAULTS);

  // Shared Simulation & UI State
  const [running, setRunning] = useState(true);
  const [tick, setTick] = useState(0);
  const [view3D, setView3D] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [bottomTab, setBottomTab] = useState('results');
  const [observations, setObservations] = useState([]);
  const [noteDraft, setNoteDraft] = useState('');

  useEffect(() => {
    if (lowPowerMode) setView3D(false);
  }, [lowPowerMode]);

  // Animation loop
  useEffect(() => {
    if (!running) return undefined;
    let rafId;
    let last = performance.now();
    const step = (now) => {
      const dt = Math.min(0.06, (now - last) / 1000);
      last = now;
      setTick((t) => (t + 1) % 10000);
      if (mode === 'mechanics') {
        setMechTime((mt) => mt + dt);
      }
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [running, mode]);

  // Deterministic Calculations
  const circuitSolution = useMemo(() => solveCircuit(components, wires), [components, wires]);
  const mechanicsState = useMemo(() => evaluateMechanicsState(mechConfig, mechTime), [mechConfig, mechTime]);
  const opticsResult = useMemo(() => evaluateOptics(opticsConfig), [opticsConfig]);

  useEffect(() => {
    if (mode === 'mechanics' && running && mechanicsState.finished) {
      setRunning(false);
    }
  }, [mode, running, mechanicsState.finished]);

  // Undo/Redo History Management
  const pushUndoSnapshot = useCallback(
    (nextComponents, nextWires) => {
      setHistoryPast((prev) => [...prev.slice(-29), { components, wires }]);
      setHistoryFuture([]);
      setComponents(nextComponents);
      setWires(nextWires);
    },
    [components, wires]
  );

  const handleUndo = useCallback(() => {
    setHistoryPast((past) => {
      if (past.length === 0) return past;
      const prev = past[past.length - 1];
      setHistoryFuture((f) => [{ components, wires }, ...f.slice(0, 29)]);
      setComponents(prev.components);
      setWires(prev.wires);
      return past.slice(0, -1);
    });
  }, [components, wires]);

  const handleRedo = useCallback(() => {
    setHistoryFuture((future) => {
      if (future.length === 0) return future;
      const next = future[0];
      setHistoryPast((p) => [...p.slice(-29), { components, wires }]);
      setComponents(next.components);
      setWires(next.wires);
      return future.slice(1);
    });
  }, [components, wires]);

  // Circuit Component Actions
  const addComponent = (type, pos = null) => {
    const def = getComponentDef(type);
    const id = `${type}-${Date.now().toString(36)}-${Math.floor(Math.random() * 99)}`;
    const nextComp = {
      id,
      type,
      label: `${def.name} ${components.filter((c) => c.type === type).length + 1}`,
      x: pos?.x ?? 180 + (components.length % 4) * 130,
      y: pos?.y ?? 130 + Math.floor(components.length / 4) * 100,
      rotation: 0,
      ...def.defaults,
    };
    pushUndoSnapshot([...components, nextComp], wires);
    setSelectedId(id);
    setSelectedWireId(null);
    setToolMode('select');
  };

  const updateComponent = (id, changes) => {
    setComponents((prev) => prev.map((c) => (c.id === id ? { ...c, ...changes } : c)));
  };

  const rotateComponent = useCallback(
    (id) => {
      const target = components.find((c) => c.id === id);
      if (!target) return;
      pushUndoSnapshot(
        components.map((c) => (c.id === id ? { ...c, rotation: ((c.rotation || 0) + 90) % 360 } : c)),
        wires
      );
    },
    [components, wires, pushUndoSnapshot]
  );

  const duplicateComponent = useCallback(
    (id) => {
      const target = components.find((c) => c.id === id);
      if (!target) return;
      const newId = `${target.type}-${Date.now().toString(36)}-${Math.floor(Math.random() * 99)}`;
      const copy = {
        ...target,
        id: newId,
        label: `${target.label || getComponentDef(target.type).name} (Copy)`,
        x: target.x + 40,
        y: target.y + 40,
      };
      pushUndoSnapshot([...components, copy], wires);
      setSelectedId(newId);
      setSelectedWireId(null);
    },
    [components, wires, pushUndoSnapshot]
  );

  const deleteComponent = useCallback(
    (id) => {
      if (!id) return;
      pushUndoSnapshot(
        components.filter((c) => c.id !== id),
        wires.filter((w) => w.from.componentId !== id && w.to.componentId !== id)
      );
      if (selectedId === id) setSelectedId(null);
    },
    [components, wires, selectedId, pushUndoSnapshot]
  );

  const deleteWire = useCallback(
    (wireId) => {
      if (!wireId) return;
      pushUndoSnapshot(
        components,
        wires.filter((w) => w.id !== wireId)
      );
      if (selectedWireId === wireId) setSelectedWireId(null);
    },
    [components, wires, selectedWireId, pushUndoSnapshot]
  );

  const handleDeleteSelected = useCallback(() => {
    if (selectedId) deleteComponent(selectedId);
    else if (selectedWireId) deleteWire(selectedWireId);
  }, [selectedId, selectedWireId, deleteComponent, deleteWire]);

  // Flexible Wire Creation (supports both Click->Click AND Click-Drag!)
  const handleCompleteWire = useCallback(
    (fromTerm, toTerm) => {
      if (!fromTerm || !toTerm) return;
      if (fromTerm.componentId === toTerm.componentId) {
        addToast('Cannot connect a component directly to its own terminal.', 'error');
        setPendingTerminal(null);
        return;
      }
      const exists = wires.some(
        (w) =>
          (w.from.componentId === fromTerm.componentId &&
            w.from.terminalId === fromTerm.terminalId &&
            w.to.componentId === toTerm.componentId &&
            w.to.terminalId === toTerm.terminalId) ||
          (w.to.componentId === fromTerm.componentId &&
            w.to.terminalId === fromTerm.terminalId &&
            w.from.componentId === toTerm.componentId &&
            w.from.terminalId === toTerm.terminalId)
      );
      if (exists) {
        addToast('Those two terminals are already connected by a wire.', 'info');
        setPendingTerminal(null);
        return;
      }
      const nextWire = {
        id: `wire-${Date.now().toString(36)}-${Math.floor(Math.random() * 999)}`,
        from: { componentId: fromTerm.componentId, terminalId: fromTerm.terminalId },
        to: { componentId: toTerm.componentId, terminalId: toTerm.terminalId },
        color: activeWireColor,
        waypoints: [],
      };
      pushUndoSnapshot(components, [...wires, nextWire]);
      setPendingTerminal(null);
      setSelectedWireId(nextWire.id);
      setSelectedId(null);
    },
    [components, wires, activeWireColor, pushUndoSnapshot, addToast]
  );

  const handleUpdateWireWaypoints = useCallback(
    (wireId, nextWaypoints, commitHistory = false) => {
      const nextWires = wires.map((w) =>
        w.id === wireId ? { ...w, waypoints: nextWaypoints } : w
      );
      if (commitHistory) {
        pushUndoSnapshot(components, nextWires);
      } else {
        setWires(nextWires);
      }
    },
    [components, wires, pushUndoSnapshot]
  );

  const handleUpdateWireColor = (wireId, hex) => {
    setActiveWireColor(hex);
    if (!wireId) return;
    pushUndoSnapshot(
      components,
      wires.map((w) => (w.id === wireId ? { ...w, color: hex } : w))
    );
  };

  const handleResetWireRoute = (wireId) => {
    pushUndoSnapshot(
      components,
      wires.map((w) => (w.id === wireId ? { ...w, waypoints: [] } : w))
    );
  };

  // Fit-to-screen bounding box framing
  const handleFitToScreen = () => {
    if (components.length === 0) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }
    const minX = Math.min(...components.map((c) => c.x)) - 90;
    const maxX = Math.max(...components.map((c) => c.x)) + 90;
    const minY = Math.min(...components.map((c) => c.y)) - 70;
    const maxY = Math.max(...components.map((c) => c.y)) + 70;
    const boxW = Math.max(240, maxX - minX);
    const boxH = Math.max(180, maxY - minY);
    const nextZoom = Math.max(0.65, Math.min(1.45, Math.min(760 / boxW, 440 / boxH)));
    const vbW = 760 / nextZoom;
    const vbH = 440 / nextZoom;
    setZoom(Number(nextZoom.toFixed(2)));
    setPan({
      x: (minX + maxX) / 2 - vbW / 2,
      y: (minY + maxY) / 2 - vbH / 2,
    });
  };

  // Editor Keyboard Shortcuts (V, W, R, Delete/Backspace, Ctrl+Z, Ctrl+Y)
  useEffect(() => {
    if (mode !== 'circuit') return undefined;
    const onKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteSelected();
      } else if (e.key.toLowerCase() === 'r' && selectedId) {
        e.preventDefault();
        rotateComponent(selectedId);
      } else if (e.key.toLowerCase() === 'w') {
        setToolMode('wire');
      } else if (e.key.toLowerCase() === 'v') {
        setToolMode('select');
        setPendingTerminal(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mode, selectedId, handleUndo, handleRedo, handleDeleteSelected, rotateComponent]);

  const loadCircuitPreset = (presetKey) => {
    const p = CIRCUIT_PRESETS[presetKey];
    if (!p) return;
    pushUndoSnapshot(p.components, p.wires);
    setProjectName(p.name);
    setSelectedId(p.components[0]?.id || null);
    setSelectedWireId(null);
    setPendingTerminal(null);
    setRunning(true);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    addToast(`Loaded "${p.name}" preset.`, 'info');
  };

  // Project Persistence (SQLite)
  const fetchSavedProjects = async () => {
    try {
      const list = await labApi.listPlaygroundProjects({ studentId });
      setSavedProjects(list);
    } catch (err) {
      addToast(err.message || 'Unable to load saved projects from backend.', 'error');
    }
  };

  const handleOpenModal = async () => {
    setOpenModalVisible(true);
    await fetchSavedProjects();
  };

  const buildWorkspacePayload = () => ({
    circuit: { components, wires },
    mechanics: mechConfig,
    optics: opticsConfig,
  });

  const handleSaveProject = async () => {
    const trimmed = projectName.trim() || 'Untitled Physics Experiment';
    setSavingProject(true);
    try {
      if (projectId) {
        const updated = await labApi.updatePlaygroundProject(projectId, {
          name: trimmed,
          mode,
          workspace: buildWorkspacePayload(),
          observations,
        });
        setProjectId(updated.id);
        addToast(`Saved "${updated.name}" to SQLite database.`, 'success');
      } else {
        const created = await labApi.createPlaygroundProject({
          studentId,
          name: trimmed,
          mode,
          workspace: buildWorkspacePayload(),
          observations,
        });
        setProjectId(created.id);
        addToast(`Created & saved "${created.name}" to SQLite database.`, 'success');
      }
    } catch (err) {
      addToast(err.message || 'Failed to save project to backend.', 'error');
    } finally {
      setSavingProject(false);
    }
  };

  const handleLoadProject = (proj) => {
    setProjectId(proj.id);
    setProjectName(proj.name);
    setMode(proj.mode || 'circuit');
    if (proj.workspace?.circuit) {
      setComponents(proj.workspace.circuit.components || []);
      setWires(proj.workspace.circuit.wires || []);
    }
    if (proj.workspace?.mechanics) {
      setMechConfig({ ...MECHANICS_DEFAULTS, ...proj.workspace.mechanics });
      setMechTime(0);
    }
    if (proj.workspace?.optics) {
      setOpticsConfig({ ...OPTICS_DEFAULTS, ...proj.workspace.optics });
    }
    setObservations(proj.observations || []);
    setOpenModalVisible(false);
    addToast(`Opened "${proj.name}".`, 'success');
  };

  const handleDeleteSavedProject = async (id) => {
    try {
      await labApi.deletePlaygroundProject(id);
      setSavedProjects((prev) => prev.filter((p) => p.id !== id));
      if (projectId === id) setProjectId(null);
      addToast('Project deleted.', 'info');
    } catch (err) {
      addToast(err.message || 'Delete failed.', 'error');
    }
  };

  const handleNewProject = () => {
    setProjectId(null);
    setProjectName('New Physics Experiment');
    if (mode === 'circuit') {
      pushUndoSnapshot([], []);
      setSelectedId(null);
      setSelectedWireId(null);
      setPendingTerminal(null);
    } else if (mode === 'mechanics') {
      setMechConfig(MECHANICS_DEFAULTS);
      setMechTime(0);
    } else {
      setOpticsConfig(OPTICS_DEFAULTS);
    }
    setObservations([]);
    addToast('Started a fresh workspace.', 'info');
  };

  const handleReset = () => {
    if (mode === 'circuit') {
      loadCircuitPreset('ohmsLaw');
    } else if (mode === 'mechanics') {
      setMechTime(0);
      setRunning(false);
    } else {
      setOpticsConfig(OPTICS_DEFAULTS);
    }
  };

  const handleExportSummary = () => {
    const summaryObj = {
      project: projectName,
      mode,
      exportedAt: new Date().toISOString(),
      workspace: buildWorkspacePayload(),
      results:
        mode === 'circuit'
          ? {
              totalVoltage: circuitSolution.totalVoltage,
              totalCurrent: circuitSolution.totalCurrent,
              equivalentResistance: circuitSolution.equivalentResistance,
              totalPower: circuitSolution.totalPower,
              topology: circuitSolution.topologySummary,
            }
          : mode === 'mechanics'
          ? mechanicsState
          : opticsResult,
      observations,
    };
    const blob = new Blob([JSON.stringify(summaryObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Exported project summary JSON.', 'success');
  };

  const handleRecordObservation = () => {
    const summaryText =
      mode === 'circuit'
        ? `V=${circuitSolution.totalVoltage}V, I=${circuitSolution.totalCurrent}A, P=${circuitSolution.totalPower}W (${circuitSolution.topologySummary})`
        : mode === 'mechanics'
        ? `${mechConfig.scene}: t=${mechanicsState.time}s, s=${mechanicsState.displacement}m, v=${mechanicsState.velocity}m/s`
        : `${opticsConfig.element}: ${opticsResult.summary}`;

    setObservations((prev) => [
      {
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        mode,
        summary: summaryText,
        note: noteDraft.trim(),
      },
      ...prev,
    ]);
    setNoteDraft('');
    addToast('Observation added to log.', 'success');
  };

  const selectedComp = components.find((c) => c.id === selectedId);
  const selectedDef = selectedComp ? getComponentDef(selectedComp.type) : null;
  const selectedWire = wires.find((w) => w.id === selectedWireId);

  // Connected wires for selected component (shown in Right Properties Panel!)
  const selectedCompConnections = useMemo(() => {
    if (!selectedComp) return [];
    return wires
      .filter((w) => w.from.componentId === selectedComp.id || w.to.componentId === selectedComp.id)
      .map((w) => {
        const isFrom = w.from.componentId === selectedComp.id;
        const myTerm = isFrom ? w.from.terminalId : w.to.terminalId;
        const otherEnd = isFrom ? w.to : w.from;
        const otherComp = components.find((c) => c.id === otherEnd.componentId);
        return {
          wireId: w.id,
          myTerm,
          otherName: otherComp?.label || otherEnd.componentId,
          otherTerm: otherEnd.terminalId,
        };
      });
  }, [selectedComp, wires, components]);

  const filteredCircuitDefs = CIRCUIT_COMPONENT_DEFS.filter((d) => {
    const matchesSearch =
      !searchQuery.trim() ||
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'All' || d.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  // Grounded AI Tutor Context
  const tutorParams =
    mode === 'circuit'
      ? {
          playground_mode: 'Electrical Circuit',
          total_voltage_V: circuitSolution.totalVoltage,
          component_count: components.length,
          wire_count: wires.length,
        }
      : mode === 'mechanics'
      ? { playground_mode: `Mechanics (${mechConfig.scene})`, ...mechConfig }
      : { playground_mode: `Optics (${opticsConfig.element})`, ...opticsConfig };

  const tutorMeasurements =
    mode === 'circuit'
      ? {
          voltage: circuitSolution.totalVoltage,
          current: circuitSolution.totalCurrent,
          resistance: circuitSolution.equivalentResistance ?? 0,
          power: circuitSolution.totalPower,
          topology: circuitSolution.topologySummary,
        }
      : mode === 'mechanics'
      ? mechanicsState
      : opticsResult;

  const tutorExpId =
    mode === 'circuit'
      ? 'ohms-law'
      : mode === 'mechanics'
      ? mechConfig.scene === 'pendulum'
        ? 'simple-pendulum'
        : mechConfig.scene === 'projectile'
        ? 'projectile-motion'
        : 'newtons-laws'
      : opticsConfig.element === 'plane-mirror'
      ? 'reflection-of-light'
      : 'convex-lens';

  return (
    <div className="mx-auto max-w-[1440px] px-3 py-4 sm:px-5">
      {/* TOP EDITOR TOOLBAR */}
      <div className="lab-card mb-3 space-y-2.5 p-3">
        {/* Row 1: Project Identity, Mode Switcher, Persistence */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-sm">
              <Cpu className="h-5 w-5" />
            </div>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              aria-label="Project name"
              className="w-48 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-extrabold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none sm:w-60 dark:border-navy-700 dark:bg-navy-950 dark:text-white"
            />
            {projectId && <Badge variant="emerald">Saved</Badge>}
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-navy-700 dark:bg-navy-950">
            {MODES.map((m) => {
              const Icon = m.icon;
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setMode(m.id);
                    if (m.id === 'mechanics') {
                      setMechTime(0);
                      setRunning(false);
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-extrabold transition ${
                    active
                      ? `${m.color} text-white shadow-sm`
                      : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-navy-800'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {m.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button type="button" onClick={handleNewProject} className="lab-btn-secondary px-2.5 py-1.5 text-xs" title="New experiment">
              <FilePlus2 className="h-3.5 w-3.5" /> New
            </button>
            <button type="button" onClick={handleOpenModal} className="lab-btn-secondary px-2.5 py-1.5 text-xs" title="Open saved project">
              <FolderOpen className="h-3.5 w-3.5" /> Open
            </button>
            <button type="button" onClick={handleSaveProject} disabled={savingProject} className="lab-btn-primary px-3 py-1.5 text-xs" title="Save to SQLite database">
              <Save className="h-3.5 w-3.5" /> {savingProject ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={handleExportSummary} className="lab-btn-secondary px-2.5 py-1.5 text-xs" title="Export JSON summary">
              <Download className="h-3.5 w-3.5" /> Export
            </button>
          </div>
        </div>

        {/* Row 2: Editor Tools (Select, Wire, Delete, Undo/Redo, Zoom, Fit, Grid, Snap, Run/Pause/Stop/Reset) */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5 dark:border-navy-800">
          {mode === 'circuit' ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Select vs Wire Tool */}
              <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 dark:border-navy-700 dark:bg-navy-950">
                <button
                  type="button"
                  onClick={() => {
                    setToolMode('select');
                    setPendingTerminal(null);
                  }}
                  title="Select & Move Tool (V)"
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    toolMode === 'select'
                      ? 'bg-white text-blue-700 shadow-sm dark:bg-navy-800 dark:text-sky-300'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <MousePointer2 className="h-3.5 w-3.5" /> Select
                </button>
                <button
                  type="button"
                  onClick={() => setToolMode('wire')}
                  title="Wire Drawing Tool (W)"
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    toolMode === 'wire'
                      ? 'bg-amber-400 text-slate-900 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Cable className="h-3.5 w-3.5" /> Wire
                </button>
              </div>

              {/* Active Wire Color Dots */}
              <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1 dark:border-navy-700 dark:bg-navy-950" title="Active wire color">
                {WIRE_COLORS.map((wc) => (
                  <button
                    key={wc.id}
                    type="button"
                    onClick={() => handleUpdateWireColor(selectedWireId, wc.hex)}
                    aria-label={`Wire color ${wc.name}`}
                    className={`h-4 w-4 rounded-full transition ${
                      activeWireColor === wc.hex ? 'scale-125 ring-2 ring-slate-900 ring-offset-1' : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: wc.hex }}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleDeleteSelected}
                disabled={!selectedId && !selectedWireId}
                className="lab-btn-secondary px-2 py-1 text-xs text-rose-600"
                title="Delete selected (Del)"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={handleUndo} disabled={historyPast.length === 0} className="lab-btn-secondary px-2 py-1 text-xs" title="Undo (Ctrl+Z)" aria-label="Undo">
                <Undo2 className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={handleRedo} disabled={historyFuture.length === 0} className="lab-btn-secondary px-2 py-1 text-xs" title="Redo (Ctrl+Y)" aria-label="Redo">
                <Redo2 className="h-3.5 w-3.5" />
              </button>

              <div className="mx-0.5 h-5 w-px bg-slate-200 dark:bg-navy-700" />

              {/* Zoom, Fit, Grid, Snap */}
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2.2, Number((z + 0.15).toFixed(2))))}
                className="lab-btn-secondary px-2 py-1 text-xs"
                title="Zoom In"
                aria-label="Zoom in"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.6, Number((z - 0.15).toFixed(2))))}
                className="lab-btn-secondary px-2 py-1 text-xs"
                title="Zoom Out"
                aria-label="Zoom out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleFitToScreen}
                className="lab-btn-secondary px-2 py-1 text-xs"
                title="Fit circuit to screen"
              >
                <Maximize2 className="h-3.5 w-3.5" /> Fit
              </button>
              <button
                type="button"
                onClick={() => setShowGrid((g) => !g)}
                aria-pressed={showGrid}
                className={`inline-flex items-center gap-1 rounded-xl border px-2 py-1 text-xs font-bold transition ${
                  showGrid ? 'border-sky-300 bg-sky-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-sky-300' : 'border-slate-200 text-slate-500'
                }`}
                title="Toggle background grid"
              >
                <Grid3X3 className="h-3.5 w-3.5" /> Grid
              </button>
              <button
                type="button"
                onClick={() => setSnapToGrid((s) => !s)}
                aria-pressed={snapToGrid}
                className={`inline-flex items-center gap-1 rounded-xl border px-2 py-1 text-xs font-bold transition ${
                  snapToGrid ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' : 'border-slate-200 text-slate-500'
                }`}
                title="Toggle snap to grid"
              >
                <Magnet className="h-3.5 w-3.5" /> Snap
              </button>
            </div>
          ) : (
            <span className="text-xs font-bold text-slate-500">
              {mode === 'mechanics' ? 'Real-Time Mathematical Mechanics Simulator' : 'Geometric Optics Ray Tracer'}
            </span>
          )}

          {/* Simulation Transport Controls */}
          <div className="flex flex-wrap items-center gap-1.5">
            {mode === 'circuit' && (
              <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 dark:border-navy-700 dark:bg-navy-950">
                <button type="button" onClick={() => setView3D(false)} className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold ${!view3D ? 'bg-white text-blue-700 shadow-sm dark:bg-navy-800 dark:text-sky-300' : 'text-slate-500'}`}>
                  <Layers className="h-3 w-3" /> 2D
                </button>
                <button type="button" onClick={() => setView3D(true)} className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold ${view3D ? 'bg-white text-blue-700 shadow-sm dark:bg-navy-800 dark:text-sky-300' : 'text-slate-500'}`}>
                  <Box className="h-3 w-3" /> 3D
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                if (mode === 'mechanics' && mechanicsState.finished) setMechTime(0);
                setRunning((r) => !r);
              }}
              className="lab-btn-accent px-3 py-1.5 text-xs"
            >
              {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {running ? 'Pause' : 'Run'}
            </button>
            <button
              type="button"
              onClick={() => {
                setRunning(false);
                if (mode === 'mechanics') setMechTime(0);
              }}
              className="lab-btn-secondary px-2 py-1.5 text-xs"
              aria-label="Stop simulation"
              title="Stop"
            >
              <Square className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={handleReset} className="lab-btn-secondary px-2.5 py-1.5 text-xs" title="Reset workspace">
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* MAIN 3-COLUMN WORKSPACE */}
      <div className="grid gap-3.5 lg:grid-cols-12">
        {/* LEFT SIDEBAR: Components Library */}
        <aside className="lab-card flex flex-col gap-3 p-3.5 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              {mode === 'circuit' ? 'Components Library' : mode === 'mechanics' ? 'Mechanics Experiments' : 'Optics Apparatus'}
            </h2>
            {mode === 'circuit' && (
              <span className="text-[10px] font-bold text-slate-400">Drag or Click</span>
            )}
          </div>

          {mode === 'circuit' && (
            <>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search battery, LED, meter..."
                  className="lab-input py-1.5 pl-8 text-xs"
                />
              </div>

              <div className="flex flex-wrap gap-1">
                {['All', 'Power', 'Passive', 'Output', 'Control', 'Meters'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`rounded-lg px-2 py-0.5 text-[10px] font-bold transition ${
                      categoryFilter === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-sky-50 dark:bg-navy-950 dark:text-slate-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid max-h-[265px] grid-cols-2 gap-2 overflow-y-auto pr-0.5">
                {filteredCircuitDefs.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('application/labxai-component', item.type)}
                    onClick={() => addComponent(item.type)}
                    className="group flex flex-col items-start rounded-xl border border-slate-200 bg-slate-50/80 p-2 text-left transition hover:-translate-y-0.5 hover:border-blue-400 hover:bg-sky-50 dark:border-navy-700 dark:bg-navy-950"
                  >
                    <span className="text-base leading-none transition-transform group-hover:scale-110">{item.symbol}</span>
                    <span className="mt-1 text-[11px] font-extrabold text-slate-800 dark:text-white">
                      {item.name}
                    </span>
                    <span className="text-[9.5px] text-slate-500">{item.category}</span>
                  </button>
                ))}
              </div>

              {/* Starter Circuit Templates */}
              <div className="border-t border-slate-100 pt-2.5 dark:border-navy-800">
                <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  1-Click Starter Circuits
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(CIRCUIT_PRESETS).map(([key, p]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => loadCircuitPreset(key)}
                      className="rounded-lg border border-blue-200 bg-blue-50/70 px-2 py-1.5 text-left text-[10.5px] font-bold text-blue-900 transition hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-sky-200"
                    >
                      {p.name.split('(')[0].trim()}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {mode === 'mechanics' && (
            <div className="space-y-1.5">
              {MECHANICS_SCENES.map((sc) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => {
                    setMechConfig((prev) => ({ ...prev, scene: sc.id }));
                    setMechTime(0);
                    setRunning(true);
                  }}
                  className={`w-full rounded-xl border p-2.5 text-left transition ${
                    mechConfig.scene === sc.id
                      ? 'border-orange-500 bg-orange-50 shadow-sm dark:bg-orange-950/40'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-white dark:border-navy-700 dark:bg-navy-950'
                  }`}
                >
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white">{sc.name}</p>
                  <p className="mt-0.5 text-[10.5px] text-slate-500">{sc.description}</p>
                </button>
              ))}
            </div>
          )}

          {mode === 'optics' && (
            <div className="space-y-1.5">
              {OPTICS_ELEMENTS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setOpticsConfig((prev) => ({ ...prev, element: opt.id }))}
                  className={`w-full rounded-xl border p-2.5 text-left transition ${
                    opticsConfig.element === opt.id
                      ? 'border-violet-500 bg-violet-50 shadow-sm dark:bg-violet-950/40'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-white dark:border-navy-700 dark:bg-navy-950'
                  }`}
                >
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white">{opt.name}</p>
                  <p className="mt-0.5 text-[10.5px] text-slate-500">{opt.description}</p>
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* CENTRE: Interactive Canvas */}
        <section className="flex flex-col gap-2.5 lg:col-span-6">
          {mode === 'circuit' && (
            <CircuitCanvas
              components={components}
              wires={wires}
              solution={circuitSolution}
              running={running}
              tick={tick}
              selectedId={selectedId}
              selectedWireId={selectedWireId}
              toolMode={toolMode}
              pendingTerminal={pendingTerminal}
              wireColor={activeWireColor}
              showGrid={showGrid}
              snapToGrid={snapToGrid}
              zoom={zoom}
              pan={pan}
              view3D={view3D}
              onZoomPanChange={(z, p) => {
                setZoom(z);
                setPan(p);
              }}
              onSelectComponent={(id) => {
                setSelectedId(id);
                setSelectedWireId(null);
              }}
              onSelectWire={(id) => {
                setSelectedWireId(id);
                setSelectedId(null);
              }}
              onMoveComponent={(id, pos) => updateComponent(id, pos)}
              onMoveCommit={() => {
                setHistoryPast((prev) => [...prev.slice(-29), { components, wires }]);
              }}
              onDropNewComponent={(type, pos) => addComponent(type, pos)}
              onStartWire={(term) => {
                setPendingTerminal(term);
                setSelectedId(null);
                setSelectedWireId(null);
              }}
              onCompleteWire={handleCompleteWire}
              onCancelWire={() => setPendingTerminal(null)}
              onUpdateWireWaypoints={handleUpdateWireWaypoints}
              onToggleSwitch={(id) => {
                const target = components.find((c) => c.id === id);
                if (target) {
                  pushUndoSnapshot(
                    components.map((c) => (c.id === id ? { ...c, closed: c.closed === false } : c)),
                    wires
                  );
                }
              }}
              onRotateComponent={rotateComponent}
              onDuplicateComponent={duplicateComponent}
              onDeleteComponent={deleteComponent}
              onDeleteWire={deleteWire}
              onResetWireRoute={handleResetWireRoute}
            />
          )}

          {mode === 'mechanics' && <MechanicsCanvas config={mechConfig} state={mechanicsState} />}

          {mode === 'optics' && <OpticsCanvas config={opticsConfig} result={opticsResult} />}
        </section>

        {/* RIGHT SIDEBAR: Properties & Connection Inspector */}
        <aside className="lab-card flex flex-col gap-3 p-4 lg:col-span-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            Properties &amp; Inspector
          </h2>

          {mode === 'circuit' && (
            <>
              {selectedComp && selectedDef ? (
                <div className="space-y-3">
                  <div className="rounded-xl bg-sky-50 p-3 dark:bg-blue-950/40">
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white">{selectedDef.name}</p>
                    <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-300">{selectedDef.description}</p>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Label</label>
                    <input
                      type="text"
                      value={selectedComp.label || ''}
                      onChange={(e) => updateComponent(selectedComp.id, { label: e.target.value })}
                      className="lab-input mt-1 py-1.5 text-xs"
                    />
                  </div>

                  {(selectedComp.type === 'battery' || selectedComp.type === 'dc-supply') && (
                    <div>
                      <div className="flex justify-between text-xs font-bold">
                        <span>Voltage (V)</span>
                        <span className="font-mono text-blue-600">{selectedComp.voltage} V</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="24"
                        step="0.5"
                        value={selectedComp.voltage ?? 12}
                        onChange={(e) => updateComponent(selectedComp.id, { voltage: parseFloat(e.target.value) })}
                        className="lab-slider mt-1"
                      />
                    </div>
                  )}

                  {(selectedComp.type === 'resistor' || selectedComp.type === 'variable-resistor' || selectedComp.type === 'bulb') && (
                    <div>
                      <div className="flex justify-between text-xs font-bold">
                        <span>Resistance (Ω)</span>
                        <span className="font-mono text-orange-600">{selectedComp.resistance} Ω</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="1000"
                        step="5"
                        value={selectedComp.resistance ?? 100}
                        onChange={(e) => updateComponent(selectedComp.id, { resistance: parseFloat(e.target.value) })}
                        className="lab-slider mt-1"
                      />
                    </div>
                  )}

                  {selectedComp.type === 'capacitor' && (
                    <div>
                      <div className="flex justify-between text-xs font-bold">
                        <span>Capacitance (μF)</span>
                        <span className="font-mono text-teal-600">{selectedComp.capacitance_uf ?? 100} μF</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="1000"
                        step="10"
                        value={selectedComp.capacitance_uf ?? 100}
                        onChange={(e) => updateComponent(selectedComp.id, { capacitance_uf: parseFloat(e.target.value) })}
                        className="lab-slider mt-1"
                      />
                    </div>
                  )}

                  {selectedComp.type === 'switch' && (
                    <button
                      type="button"
                      onClick={() => updateComponent(selectedComp.id, { closed: selectedComp.closed === false })}
                      className={`w-full rounded-xl py-2 text-xs font-extrabold text-white transition ${
                        selectedComp.closed !== false ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'
                      }`}
                    >
                      Switch: {selectedComp.closed !== false ? 'CLOSED (ON)' : 'OPEN (OFF)'} — Toggle
                    </button>
                  )}

                  {/* Component Live Measurements */}
                  {circuitSolution.componentResults[selectedComp.id] && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-mono text-xs dark:border-navy-700 dark:bg-navy-950">
                      <p>Voltage: <strong>{circuitSolution.componentResults[selectedComp.id].voltageDrop} V</strong></p>
                      <p>Current: <strong>{circuitSolution.componentResults[selectedComp.id].current} A</strong></p>
                      <p>Power: <strong>{circuitSolution.componentResults[selectedComp.id].power} W</strong></p>
                      {circuitSolution.componentResults[selectedComp.id].status && (
                        <p className="mt-1 font-sans text-[11px] font-bold text-blue-700 dark:text-sky-300">
                          {circuitSolution.componentResults[selectedComp.id].status}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Connection Details */}
                  <div className="rounded-xl border border-slate-200 bg-white p-2.5 text-[11px] dark:border-navy-700 dark:bg-navy-950">
                    <p className="font-extrabold text-slate-700 dark:text-slate-200">
                      Connections ({selectedCompConnections.length})
                    </p>
                    {selectedCompConnections.length === 0 ? (
                      <p className="mt-1 text-slate-500">No wires attached yet. Click or drag from a colored terminal dot.</p>
                    ) : (
                      <ul className="mt-1 space-y-1 text-slate-600 dark:text-slate-300">
                        {selectedCompConnections.map((conn) => (
                          <li key={conn.wireId} className="flex items-center justify-between gap-1">
                            <span className="truncate">
                              ({conn.myTerm}) → <strong>{conn.otherName}</strong> ({conn.otherTerm})
                            </span>
                            <button
                              type="button"
                              onClick={() => deleteWire(conn.wireId)}
                              className="text-rose-500 hover:text-rose-700"
                              title="Disconnect wire"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Rotate, Duplicate, Delete */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <button type="button" onClick={() => rotateComponent(selectedComp.id)} className="lab-btn-secondary px-2 py-1.5 text-[11px]" title="Rotate 90° (R)">
                      <RotateCw className="h-3.5 w-3.5" /> Rotate
                    </button>
                    <button type="button" onClick={() => duplicateComponent(selectedComp.id)} className="lab-btn-secondary px-2 py-1.5 text-[11px]" title="Duplicate component">
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteComponent(selectedComp.id)}
                      className="inline-flex items-center justify-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-rose-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Del
                    </button>
                  </div>
                </div>
              ) : selectedWire ? (
                <div className="space-y-3">
                  <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-950/30">
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white">Connecting Wire</p>
                    <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                      Drag any blue or yellow circle handle directly on the wire to bend its route around components.
                    </p>
                  </div>

                  <div>
                    <p className="mb-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">Wire Color</p>
                    <div className="flex flex-wrap gap-2">
                      {WIRE_COLORS.map((wc) => (
                        <button
                          key={wc.id}
                          type="button"
                          onClick={() => handleUpdateWireColor(selectedWire.id, wc.hex)}
                          className={`h-6 w-6 rounded-full transition ${
                            (selectedWire.color || '#2563eb') === wc.hex
                              ? 'scale-110 ring-2 ring-slate-900 ring-offset-2'
                              : 'opacity-85 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: wc.hex }}
                          title={wc.name}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleResetWireRoute(selectedWire.id)}
                    className="lab-btn-secondary w-full py-2 text-xs"
                  >
                    <Route className="h-3.5 w-3.5 text-blue-600" />
                    Auto-Route Wire ({(selectedWire.waypoints || []).length} custom bends)
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteWire(selectedWire.id)}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-rose-500 py-2 text-xs font-bold text-white hover:bg-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete Wire
                  </button>
                </div>
              ) : (
                <div className="space-y-3 rounded-xl border border-dashed border-slate-300 p-4 text-xs text-slate-500">
                  <p className="font-bold text-slate-700 dark:text-slate-200">Quick Wiring Tips</p>
                  <ul className="list-disc space-y-1 pl-4">
                    <li>Click a terminal dot, then click another terminal — OR click-and-drag directly!</li>
                    <li>Click any wire to change its color or drag bend handles to reroute it.</li>
                    <li>Shortcuts: <code>V</code> Select, <code>W</code> Wire, <code>R</code> Rotate, <code>Del</code> Delete, <code>Esc</code> Cancel.</li>
                  </ul>
                </div>
              )}
            </>
          )}

          {mode === 'mechanics' && (
            <div className="space-y-3 text-xs">
              {[
                { key: 'mass', label: 'Mass m₁', unit: 'kg', min: 0.5, max: 20, step: 0.5 },
                ...(mechConfig.scene === 'pulley' ? [{ key: 'mass2', label: 'Mass m₂', unit: 'kg', min: 0.5, max: 20, step: 0.5 }] : []),
                ...(mechConfig.scene === 'newtons-laws' ? [{ key: 'force', label: 'Applied Force F', unit: 'N', min: 0, max: 120, step: 5 }] : []),
                ...(['inclined-plane', 'projectile', 'pendulum'].includes(mechConfig.scene) ? [{ key: 'angle', label: 'Angle θ', unit: '°', min: 5, max: 75, step: 1 }] : []),
                ...(['inclined-plane', 'newtons-laws'].includes(mechConfig.scene) ? [{ key: 'friction', label: 'Friction μ', unit: '', min: 0, max: 0.8, step: 0.05 }] : []),
                ...(mechConfig.scene === 'projectile' ? [{ key: 'initialSpeed', label: 'Launch Speed v₀', unit: 'm/s', min: 5, max: 40, step: 1 }] : []),
                ...(mechConfig.scene === 'free-fall' ? [{ key: 'height', label: 'Drop Height h', unit: 'm', min: 5, max: 80, step: 5 }] : []),
                ...(mechConfig.scene === 'pendulum' ? [{ key: 'length', label: 'Length L', unit: 'm', min: 0.4, max: 3.0, step: 0.1 }] : []),
                ...(mechConfig.scene === 'spring' ? [{ key: 'springK', label: 'Spring Stiffness k', unit: 'N/m', min: 10, max: 150, step: 5 }] : []),
                { key: 'gravity', label: 'Gravity g', unit: 'm/s²', min: 1.62, max: 20, step: 0.2 },
              ].map((ctrl) => (
                <div key={ctrl.key}>
                  <div className="flex justify-between font-bold">
                    <span>{ctrl.label}</span>
                    <span className="font-mono text-orange-600">{mechConfig[ctrl.key]} {ctrl.unit}</span>
                  </div>
                  <input
                    type="range"
                    min={ctrl.min}
                    max={ctrl.max}
                    step={ctrl.step}
                    value={mechConfig[ctrl.key]}
                    onChange={(e) => {
                      setMechConfig((prev) => ({ ...prev, [ctrl.key]: parseFloat(e.target.value) }));
                      setMechTime(0);
                    }}
                    className="lab-slider mt-1"
                  />
                </div>
              ))}
              <div className="flex gap-1.5 pt-1">
                {[{ label: 'Earth', g: 9.81 }, { label: 'Moon', g: 1.62 }, { label: 'Mars', g: 3.71 }].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setMechConfig((prev) => ({ ...prev, gravity: p.g }));
                      setMechTime(0);
                    }}
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-1 text-[11px] font-bold hover:bg-sky-50 dark:border-navy-700 dark:bg-navy-950"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'optics' && (
            <div className="space-y-3 text-xs">
              {opticsConfig.element === 'plane-mirror' || opticsConfig.element === 'prism' ? (
                <>
                  <div>
                    <div className="flex justify-between font-bold">
                      <span>Incident Angle θᵢ</span>
                      <span className="font-mono text-violet-600">{opticsConfig.incidentAngle}°</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="75"
                      step="1"
                      value={opticsConfig.incidentAngle}
                      onChange={(e) => setOpticsConfig((p) => ({ ...p, incidentAngle: parseFloat(e.target.value) }))}
                      className="lab-slider mt-1"
                    />
                  </div>
                  {opticsConfig.element === 'prism' && (
                    <div>
                      <div className="flex justify-between font-bold">
                        <span>Prism Apex Angle A</span>
                        <span className="font-mono text-violet-600">{opticsConfig.prismApexAngle}°</span>
                      </div>
                      <input
                        type="range"
                        min="35"
                        max="70"
                        step="1"
                        value={opticsConfig.prismApexAngle}
                        onChange={(e) => setOpticsConfig((p) => ({ ...p, prismApexAngle: parseFloat(e.target.value) }))}
                        className="lab-slider mt-1"
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <div className="flex justify-between font-bold">
                      <span>Focal Length |f|</span>
                      <span className="font-mono text-violet-600">{opticsConfig.focalLength} cm</span>
                    </div>
                    <input
                      type="range"
                      min="6"
                      max="30"
                      step="1"
                      value={opticsConfig.focalLength}
                      onChange={(e) => setOpticsConfig((p) => ({ ...p, focalLength: parseFloat(e.target.value) }))}
                      className="lab-slider mt-1"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between font-bold">
                      <span>Object Distance |u|</span>
                      <span className="font-mono text-violet-600">{opticsConfig.objectDistance} cm</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="55"
                      step="1"
                      value={opticsConfig.objectDistance}
                      onChange={(e) => setOpticsConfig((p) => ({ ...p, objectDistance: parseFloat(e.target.value) }))}
                      className="lab-slider mt-1"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between font-bold">
                      <span>Object Height h</span>
                      <span className="font-mono text-violet-600">{opticsConfig.objectHeight} cm</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="7"
                      step="0.5"
                      value={opticsConfig.objectHeight}
                      onChange={(e) => setOpticsConfig((p) => ({ ...p, objectHeight: parseFloat(e.target.value) }))}
                      className="lab-slider mt-1"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* BOTTOM PANEL: Results, Validation Diagnostics, Observation Log & AI Tutor */}
      <div className="lab-card mt-4 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5 dark:border-navy-800">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'results', label: 'Simulation Measurements' },
              {
                id: 'diagnostics',
                label: `Circuit Validation (${(circuitSolution.errors?.length || 0) + (circuitSolution.warnings?.length || 0)})`,
              },
              { id: 'log', label: `Observation Log (${observations.length})` },
              { id: 'tutor', label: 'AI Science Tutor' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setBottomTab(tab.id)}
                className={`rounded-xl px-3 py-1.5 text-xs font-extrabold transition ${
                  bottomTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-sky-50 dark:bg-navy-950 dark:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            {mode === 'circuit' ? circuitSolution.topologySummary : 'Deterministic Calculation Engine'}
          </span>
        </div>

        {bottomTab === 'results' && (
          <div>
            {mode === 'circuit' && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3 dark:border-blue-900 dark:bg-blue-950/30">
                  <p className="text-[11px] font-bold text-slate-500">Total Voltage (V)</p>
                  <p className="font-mono text-xl font-extrabold text-blue-700 dark:text-sky-300">{circuitSolution.totalVoltage} V</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
                  <p className="text-[11px] font-bold text-slate-500">Circuit Current (I = V/R)</p>
                  <p className="font-mono text-xl font-extrabold text-emerald-700 dark:text-emerald-300">{circuitSolution.totalCurrent} A</p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-900 dark:bg-amber-950/30">
                  <p className="text-[11px] font-bold text-slate-500">Equivalent Resistance (Req)</p>
                  <p className="font-mono text-xl font-extrabold text-amber-800 dark:text-amber-300">
                    {circuitSolution.equivalentResistance !== null ? `${circuitSolution.equivalentResistance} Ω` : 'Open (∞)'}
                  </p>
                </div>
                <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-3 dark:border-violet-900 dark:bg-violet-950/30">
                  <p className="text-[11px] font-bold text-slate-500">Total Power (P = V·I)</p>
                  <p className="font-mono text-xl font-extrabold text-violet-700 dark:text-violet-300">{circuitSolution.totalPower} W</p>
                </div>
              </div>
            )}

            {mode === 'mechanics' && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(mechanicsState)
                  .filter(([k, v]) => typeof v === 'number' && k !== 'progress')
                  .slice(0, 6)
                  .map(([k, v]) => (
                    <div key={k} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-navy-700 dark:bg-navy-950">
                      <p className="text-[11px] font-bold uppercase text-slate-500">{k.replace(/([A-Z])/g, ' $1')}</p>
                      <p className="font-mono text-lg font-extrabold text-slate-900 dark:text-white">{v}</p>
                    </div>
                  ))}
              </div>
            )}

            {mode === 'optics' && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(opticsResult)
                  .filter(([k, v]) => v !== null && typeof v !== 'object' && k !== 'element' && k !== 'formula' && k !== 'summary')
                  .map(([k, v]) => (
                    <div key={k} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-navy-700 dark:bg-navy-950">
                      <p className="text-[11px] font-bold uppercase text-slate-500">{k.replace(/([A-Z])/g, ' $1')}</p>
                      <p className="font-mono text-base font-extrabold text-slate-900 dark:text-white">{String(v)}</p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {bottomTab === 'diagnostics' && (
          <div className="space-y-2 text-xs">
            {mode === 'circuit' && circuitSolution.errors.length === 0 && circuitSolution.warnings.length === 0 ? (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>All connections valid and operating safely within steady-state DC solver scope!</span>
              </div>
            ) : null}
            {circuitSolution.errors.map((err) => (
              <div key={err} className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <span><strong>Error:</strong> {err}</span>
              </div>
            ))}
            {circuitSolution.warnings.map((warn) => (
              <div key={warn} className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <span><strong>Validation Tip:</strong> {warn}</span>
              </div>
            ))}
            <p className="text-[11px] text-slate-500">
              Supported DC Solver Scope: Resistive series, parallel &amp; series-parallel DC networks, switches, bulbs, LEDs/diodes (piecewise forward drop), ideal ammeters/voltmeters, and steady-state capacitors.
            </p>
          </div>
        )}

        {bottomTab === 'log' && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Record a student observation (e.g., Doubling resistance halved current)..."
                className="lab-input flex-1 text-xs"
              />
              <button type="button" onClick={handleRecordObservation} className="lab-btn-primary px-3.5 py-2 text-xs">
                <Plus className="h-3.5 w-3.5" /> Record Observation
              </button>
            </div>
            {observations.length === 0 ? (
              <p className="text-xs text-slate-500">No observations recorded yet. Click &ldquo;Record Observation&rdquo; and Save to store them in SQLite.</p>
            ) : (
              <ul className="space-y-2 text-xs">
                {observations.map((obs) => (
                  <li key={obs.id} className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-navy-700 dark:bg-navy-950">
                    <div className="flex justify-between font-bold">
                      <span>[{obs.mode.toUpperCase()}] {obs.summary}</span>
                      <span className="font-mono text-[10px] text-slate-400">{obs.time}</span>
                    </div>
                    {obs.note && <p className="mt-1 text-slate-600 dark:text-slate-300">Note: {obs.note}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {bottomTab === 'tutor' && (
          <AiTutorPanel
            experimentId={tutorExpId}
            parameters={tutorParams}
            measurements={tutorMeasurements}
          />
        )}
      </div>

      {/* OPEN SAVED PROJECT MODAL */}
      <Modal
        open={openModalVisible}
        title="Open Saved Physics Playground Project"
        onClose={() => setOpenModalVisible(false)}
      >
        {savedProjects.length === 0 ? (
          <p className="text-sm text-slate-500">
            No saved projects found yet. Build a circuit or mechanics setup and click <strong>Save</strong> to persist it in SQLite!
          </p>
        ) : (
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {savedProjects.map((proj) => (
              <div
                key={proj.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 p-3 dark:border-navy-700"
              >
                <div>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white">{proj.name}</p>
                  <p className="text-[11px] text-slate-500">
                    Mode: {proj.mode} · Updated {new Date(proj.updated_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleLoadProject(proj)}
                    className="lab-btn-primary px-3 py-1.5 text-xs"
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSavedProject(proj.id)}
                    className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"
                    aria-label={`Delete ${proj.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
