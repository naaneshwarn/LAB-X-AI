import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Bot, Box, Layers, Pause, Play, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ELEMENTS } from '../engines/chemistry';
import Lightweight3DCanvas from '../../components/Lightweight3DCanvas';

const ChemicalReactionVisualizer = lazy(() => import('./chemistry/ChemicalReactionVisualizer'));
const AcidsBasesPhVisualizer = lazy(() => import('./chemistry/AcidsBasesPhVisualizer'));

const ELECTRON_CONFIGS = {
  1: '1s¹', 2: '1s²', 3: '[He] 2s¹', 4: '[He] 2s²', 5: '[He] 2s² 2p¹', 6: '[He] 2s² 2p²',
  7: '[He] 2s² 2p³', 8: '[He] 2s² 2p⁴', 9: '[He] 2s² 2p⁵', 10: '[He] 2s² 2p⁶',
  11: '[Ne] 3s¹', 12: '[Ne] 3s²', 13: '[Ne] 3s² 3p¹', 14: '[Ne] 3s² 3p²', 15: '[Ne] 3s² 3p³',
  16: '[Ne] 3s² 3p⁴', 17: '[Ne] 3s² 3p⁵', 18: '[Ne] 3s² 3p⁶',
  19: '[Ar] 4s¹', 20: '[Ar] 4s²', 21: '[Ar] 3d¹ 4s²', 22: '[Ar] 3d² 4s²', 23: '[Ar] 3d³ 4s²',
  24: '[Ar] 3d⁵ 4s¹', 25: '[Ar] 3d⁵ 4s²', 26: '[Ar] 3d⁶ 4s²', 27: '[Ar] 3d⁷ 4s²', 28: '[Ar] 3d⁸ 4s²',
  29: '[Ar] 3d¹⁰ 4s¹', 30: '[Ar] 3d¹⁰ 4s²', 31: '[Ar] 3d¹⁰ 4s² 4p¹', 32: '[Ar] 3d¹⁰ 4s² 4p²',
  33: '[Ar] 3d¹⁰ 4s² 4p³', 34: '[Ar] 3d¹⁰ 4s² 4p⁴', 35: '[Ar] 3d¹⁰ 4s² 4p⁵', 36: '[Ar] 3d¹⁰ 4s² 4p⁶',
};

const ATOM_PRESETS = [
  { label: 'Hydrogen (¹H)', p: 1, n: 0, q: 0 },
  { label: 'Carbon-12 (¹²C)', p: 6, n: 6, q: 0 },
  { label: 'Carbon-14 Isotope', p: 6, n: 8, q: 0 },
  { label: 'Oxygen (¹⁶O)', p: 8, n: 8, q: 0 },
  { label: 'Sodium Ion (Na⁺)', p: 11, n: 12, q: 1 },
  { label: 'Chloride Ion (Cl⁻)', p: 17, n: 18, q: -1 },
];

export default function ChemistryVisualizer({
  experimentId,
  params,
  measurements,
  onParamChange,
  onAskTutor,
}) {
  const { lowPowerMode } = useApp();
  const [playing, setPlaying] = useState(true);
  const [viewMode, setViewMode] = useState('2d');
  const [tick, setTick] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    if (lowPowerMode) setViewMode('2d');
  }, [lowPowerMode]);

  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => setTick((t) => (t + 1) % 360), 45);
    return () => clearInterval(id);
  }, [playing]);

  // Dedicated Virtual Chemistry Labs
  if (experimentId === 'chemical-reaction-playground') {
    return (
      <Suspense fallback={<div className="lab-card p-6 text-center text-xs text-slate-500">Loading Virtual Chemistry Lab...</div>}>
        <ChemicalReactionVisualizer params={params} measurements={measurements} onParamChange={onParamChange} onAskTutor={onAskTutor} />
      </Suspense>
    );
  }

  if (experimentId === 'acids-bases-ph') {
    return (
      <Suspense fallback={<div className="lab-card p-6 text-center text-xs text-slate-500">Loading Acids &amp; Bases Lab...</div>}>
        <AcidsBasesPhVisualizer params={params} measurements={measurements} onParamChange={onParamChange} onAskTutor={onAskTutor} />
      </Suspense>
    );
  }

  // 1. Atomic Structure (2D Bohr + 3D Orbit + Isotope Explorer)
  if (experimentId === 'atomic-structure') {
    const shells = measurements.shells || [2, 4];
    const cx = 240;
    const cy = 122;
    const atom3D = useMemo(() => {
      const nodes = [
        { id: 'nucleus', x: 0, y: 0, z: 0, rx: 22, ry: 22, color: '#7c3aed', highlight: '#ddd6fe', shadow: '#4c1d95', label: `${measurements.symbol}-${measurements.mass_number}` },
      ];
      const particles = [];
      shells.forEach((count, sIdx) => {
        const r = 48 + sIdx * 28;
        for (let e = 0; e < count; e += 1) {
          const a = (e / Math.max(1, count)) * Math.PI * 2 + tick * (sIdx % 2 === 0 ? 0.03 : -0.02);
          const tilt = (sIdx * Math.PI) / 4;
          particles.push({
            x: r * Math.cos(a),
            y: r * Math.sin(a) * Math.cos(tilt),
            z: r * Math.sin(a) * Math.sin(tilt),
            r: 5.5,
            color: '#0284c7',
          });
        }
      });
      return { nodes, particles };
    }, [shells, tick, measurements.symbol, measurements.mass_number]);

    const stdN = Math.round((ELEMENTS[measurements.protons]?.mass || measurements.protons * 2) - measurements.protons);
    const isIsotope = Math.abs((measurements.neutrons ?? 0) - stdN) >= 1;

    return (
      <div className="lab-card space-y-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Atomic Structure — {measurements.element_name} ({measurements.symbol}-{measurements.mass_number})
            </h3>
            <p className="text-xs text-slate-500">
              p⁺ = {measurements.protons} · n⁰ = {measurements.neutrons} · e⁻ = {measurements.electrons} · {isIsotope ? 'Variant Isotope' : 'Common Isotope'}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => setPlaying((p) => !p)} className="lab-btn-secondary px-2 py-1 text-xs">
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
            <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 dark:border-navy-700 dark:bg-navy-950">
              <button type="button" onClick={() => setViewMode('2d')} className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold ${viewMode === '2d' ? 'bg-white text-green-700 shadow-sm dark:bg-navy-800 dark:text-green-300' : 'text-slate-500'}`}>
                <Layers className="h-3 w-3" /> 2D Shells
              </button>
              <button type="button" onClick={() => setViewMode('3d')} className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold ${viewMode === '3d' ? 'bg-white text-green-700 shadow-sm dark:bg-navy-800 dark:text-green-300' : 'text-slate-500'}`}>
                <Box className="h-3 w-3" /> 3D Orbit
              </button>
            </div>
          </div>
        </div>

        {/* Quick Element & Isotope Presets */}
        <div className="flex flex-wrap gap-1.5">
          {ATOM_PRESETS.map((pr) => (
            <button
              key={pr.label}
              type="button"
              onClick={() => {
                onParamChange?.('protons', pr.p);
                onParamChange?.('neutrons', pr.n);
                onParamChange?.('charge', pr.q);
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 hover:border-green-400 hover:bg-green-50 dark:border-navy-700 dark:bg-navy-950 dark:text-slate-200"
            >
              {pr.label}
            </button>
          ))}
        </div>

        {viewMode === '3d' ? (
          <Lightweight3DCanvas
            nodes={atom3D.nodes}
            particles={atom3D.particles}
            bgColor="#f0fdf4"
            hintText="Drag to rotate 3D electron shell model · Simplified Bohr educational visualization"
          />
        ) : (
          <svg viewBox="0 0 480 245" className="w-full rounded-2xl border border-green-100 bg-gradient-to-br from-sky-50/70 via-white to-green-50/60 dark:border-navy-800 dark:from-navy-950 dark:to-navy-900">
            {shells.map((count, sIdx) => {
              const r = 36 + sIdx * 24;
              return (
                <g key={sIdx}>
                  <circle cx={cx} cy={cy} r={r} fill="none" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth="1.5" />
                  {Array.from({ length: count }, (_, eIdx) => {
                    const angle = (eIdx / Math.max(1, count)) * 2 * Math.PI + tick * (sIdx % 2 === 0 ? 0.025 : -0.018);
                    return <circle key={eIdx} cx={cx + r * Math.cos(angle)} cy={cy + r * Math.sin(angle)} r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.3" />;
                  })}
                </g>
              );
            })}
            <circle cx={cx} cy={cy} r="22" fill="#7c3aed" stroke="#c4b5fd" strokeWidth="3" />
            <text x={cx} y={cy + 5} textAnchor="middle" fill="#fff" fontSize="14" fontWeight="800">
              {measurements.symbol}
            </text>
            <text x="16" y="24" fill="#1e293b" fontSize="11" fontWeight="800">
              Z = {measurements.protons} (p⁺) · N = {measurements.neutrons} (n⁰) · A = {measurements.mass_number} · e⁻ = {measurements.electrons}
            </text>
            <text x="16" y="232" fill="#475569" fontSize="9.5" fontWeight="600">
              Note: Concentric shell drawings are simplified educational models (real electrons occupy 3D quantum orbitals).
            </text>
          </svg>
        )}
      </div>
    );
  }

  // 2. True 18-Column Modern Periodic Table Explorer (Z = 1..36)
  if (experimentId === 'periodic-table-explorer') {
    const selectedZ = Number(params.atomic_number ?? 11);
    const catColors = {
      'Alkali Metal': 'bg-rose-100 border-rose-300 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200',
      'Alkaline Earth': 'bg-orange-100 border-orange-300 text-orange-900 dark:bg-orange-950/60 dark:text-orange-200',
      'Transition Metal': 'bg-sky-100 border-sky-300 text-sky-900 dark:bg-sky-950/60 dark:text-sky-200',
      'Post-Transition Metal': 'bg-indigo-100 border-indigo-300 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200',
      Metalloid: 'bg-teal-100 border-teal-300 text-teal-900 dark:bg-teal-950/60 dark:text-teal-200',
      Nonmetal: 'bg-green-100 border-green-300 text-green-900 dark:bg-green-950/60 dark:text-green-200',
      Halogen: 'bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200',
      'Noble Gas': 'bg-violet-100 border-violet-300 text-violet-900 dark:bg-violet-950/60 dark:text-violet-200',
    };
    const categories = ['All', ...Object.keys(catColors)];

    return (
      <div className="lab-card space-y-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Interactive Periodic Table (Periods 1–4, Groups 1–18)
            </h3>
            <p className="text-xs text-slate-500">Click any element to inspect atomic mass, electron configuration &amp; periodic trends</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-green-100 px-3 py-1 font-mono text-xs font-extrabold text-green-900 dark:bg-green-950 dark:text-green-200">
              {measurements.element_name} ({measurements.symbol}, Z={selectedZ}) · {ELECTRON_CONFIGS[selectedZ]}
            </span>
            {onAskTutor && (
              <button
                type="button"
                onClick={() =>
                  onAskTutor(`Tell me about ${measurements.element_name} (${measurements.symbol}, Z=${selectedZ}) and why it belongs to ${measurements.category}.`, {
                    selected_element: measurements.element_name,
                  })
                }
                className="inline-flex items-center gap-1 rounded-xl bg-green-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-green-700"
              >
                <Bot className="h-3 w-3" /> Ask Tutor
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Legend */}
        <div className="flex flex-wrap gap-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-lg px-2 py-0.5 text-[10px] font-bold transition ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'border border-slate-200 bg-slate-50 text-slate-600 dark:border-navy-700 dark:bg-navy-950 dark:text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 18-Column IUPAC Grid */}
        <div className="overflow-x-auto pb-1">
          <div className="grid min-w-[640px] grid-cols-18 gap-1" style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))' }}>
            {[1, 2, 3, 4].map((period) =>
              Array.from({ length: 18 }, (_, gIdx) => {
                const group = gIdx + 1;
                const entry = Object.entries(ELEMENTS).find(
                  ([, el]) => el.period === period && el.group === group
                );
                if (!entry) {
                  return <div key={`${period}-${group}`} className="h-12" />;
                }
                const [zStr, el] = entry;
                const z = Number(zStr);
                const active = z === selectedZ;
                const dimmed = categoryFilter !== 'All' && el.cat !== categoryFilter;
                return (
                  <button
                    key={z}
                    type="button"
                    onClick={() => onParamChange?.('atomic_number', z)}
                    className={`flex h-12 flex-col items-center justify-center rounded-lg border p-0.5 text-center transition ${
                      active
                        ? 'z-10 scale-110 border-blue-600 bg-blue-600 text-white shadow-md ring-2 ring-amber-400'
                        : catColors[el.cat] || 'border-slate-200 bg-slate-50'
                    } ${dimmed ? 'opacity-25' : ''}`}
                    title={`${el.name} (Z=${z}, Mass=${el.mass} u, ${ELECTRON_CONFIGS[z]})`}
                  >
                    <span className="text-[8px] font-bold leading-none opacity-80">{z}</span>
                    <span className="text-xs font-extrabold leading-tight">{el.symbol}</span>
                    <span className="text-[7px] leading-none opacity-80">{el.mass.toFixed(0)}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. States of Matter Particle Chamber (Bright Student-Friendly)
  if (experimentId === 'states-of-matter') {
    const phase = measurements.phase || 'Liquid';
    const isSolid = phase.includes('Solid');
    const isGas = phase.includes('Gas');
    return (
      <div className="lab-card p-4 sm:p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            States of Matter Chamber — {measurements.substance_name} ({phase})
          </h3>
          <button type="button" onClick={() => setPlaying((p) => !p)} className="lab-btn-secondary px-2.5 py-1 text-xs">
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
        </div>
        <svg viewBox="0 0 480 185" className="w-full rounded-2xl border border-green-100 bg-gradient-to-b from-sky-50 to-white dark:border-navy-800 dark:from-navy-950 dark:to-navy-900">
          <rect x="90" y="18" width="300" height="145" rx="12" fill="#f8fafc" stroke="#22c55e" strokeWidth="2.5" />
          {Array.from({ length: 24 }, (_, i) => {
            const col = i % 6;
            const row = Math.floor(i / 6);
            let px;
            let py;
            if (isSolid) {
              px = 165 + col * 30 + Math.sin(tick * 0.4 + i) * 1.6;
              py = 76 + row * 20 + Math.cos(tick * 0.4 + i) * 1.6;
            } else if (isGas) {
              px = 108 + ((i * 53 + tick * (3 + (i % 4))) % 264);
              py = 32 + ((i * 37 + tick * (2 + (i % 3))) % 116);
            } else {
              px = 122 + col * 42 + Math.sin(tick * 0.16 + i * 1.3) * 12;
              py = 90 + row * 17 + Math.cos(tick * 0.12 + i) * 6;
            }
            return <circle key={i} cx={px} cy={py} r="7" fill={isSolid ? '#2563eb' : isGas ? '#fb923c' : '#22c55e'} stroke="#ffffff" strokeWidth="1.5" />;
          })}
          <text x="14" y="28" fill="#1e293b" fontSize="11" fontWeight="800">{params.temperature} °C</text>
          <text x="14" y="46" fill="#15803d" fontSize="11" fontWeight="800">{phase}</text>
        </svg>
      </div>
    );
  }

  // 4. Balancing Chemical Equations — Live Atom Pan Scale
  if (experimentId === 'reaction-balancing') {
    const balanced = Boolean(measurements.is_balanced);
    const rc = measurements.reactant_atoms || {};
    const pc = measurements.product_atoms || {};
    const elems = [...new Set([...Object.keys(rc), ...Object.keys(pc)])].sort();
    const totalL = Object.values(rc).reduce((s, v) => s + v, 0);
    const totalR = Object.values(pc).reduce((s, v) => s + v, 0);
    const tilt = Math.max(-14, Math.min(14, (totalR - totalL) * 2.5));
    return (
      <div className="lab-card p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            {measurements.equation_template}
          </h3>
          <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${balanced ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'}`}>
            {balanced ? 'Balanced ✓ Conservation of Mass' : 'Unbalanced ✗ Adjust Coefficients'}
          </span>
        </div>
        <svg viewBox="0 0 480 175" className="w-full rounded-2xl border border-green-100 bg-gradient-to-b from-green-50/40 to-white dark:border-navy-800 dark:from-navy-950 dark:to-navy-900">
          <polygon points="240,95 215,155 265,155" fill="#64748b" />
          <g transform={`rotate(${tilt}, 240, 95)`}>
            <line x1="95" y1="95" x2="385" y2="95" stroke={balanced ? '#22c55e' : '#ef4444'} strokeWidth="6" strokeLinecap="round" />
            <rect x="65" y="65" width="90" height="28" rx="8" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
            <text x="110" y="83" textAnchor="middle" fontSize="10" fontWeight="800" fill="#1e3a8a">LHS: {totalL} atoms</text>
            <rect x="325" y="65" width="90" height="28" rx="8" fill="#dcfce7" stroke="#16a34a" strokeWidth="2" />
            <text x="370" y="83" textAnchor="middle" fontSize="10" fontWeight="800" fill="#14532d">RHS: {totalR} atoms</text>
          </g>
          <text x="240" y="30" textAnchor="middle" fontSize="11" fontWeight="800" fill="#1e293b">
            {elems.map((e) => `${e}: ${rc[e] || 0} vs ${pc[e] || 0}`).join('   |   ')}
          </text>
        </svg>
      </div>
    );
  }

  // 5. Electrochemical Galvanic Cell
  if (experimentId === 'electrochemical-cells') {
    const spont = Boolean(measurements.spontaneous);
    return (
      <div className="lab-card p-4 sm:p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Electrochemical Galvanic Cell</h3>
          <span className={`font-mono text-xs font-extrabold ${spont ? 'text-emerald-600' : 'text-rose-600'}`}>
            E_cell = {measurements.e_cell_v} V ({spont ? 'Spontaneous' : 'Non-Spontaneous'})
          </span>
        </div>
        <svg viewBox="0 0 480 195" className="w-full rounded-2xl border border-green-100 bg-sky-50/40 dark:border-navy-800 dark:bg-navy-950">
          <rect x="45" y="75" width="135" height="95" rx="8" fill="#ffffff" stroke="#64748b" strokeWidth="2.5" />
          <rect x="48" y="106" width="129" height="61" fill="#38bdf8" opacity="0.35" />
          <rect x="95" y="60" width="22" height="82" rx="3" fill="#94a3b8" stroke="#475569" />
          <text x="64" y="186" fill="#334155" fontSize="10.5" fontWeight="700">Anode (E°={params.e_anode}V)</text>

          <rect x="300" y="75" width="135" height="95" rx="8" fill="#ffffff" stroke="#64748b" strokeWidth="2.5" />
          <rect x="303" y="106" width="129" height="61" fill="#2563eb" opacity="0.35" />
          <rect x="355" y="60" width="22" height="82" rx="3" fill="#f97316" stroke="#9a3412" />
          <text x="310" y="186" fill="#334155" fontSize="10.5" fontWeight="700">Cathode (E°={params.e_cathode}V)</text>

          <path d="M 155 120 L 155 64 Q 240 42 325 64 L 325 120" fill="none" stroke="#cbd5e1" strokeWidth="12" />
          <text x="240" y="68" textAnchor="middle" fill="#1e293b" fontSize="9" fontWeight="800">Salt Bridge</text>

          <polyline points="106,60 106,24 366,24 366,60" fill="none" stroke="#22c55e" strokeWidth="3" />
          {spont && <circle cx={110 + ((tick * 3) % 250)} cy="24" r="4.5" fill="#facc15" stroke="#1e293b" />}
          <circle cx="240" cy="24" r="20" fill="#1e293b" stroke="#22c55e" strokeWidth="2.5" />
          <text x="240" y="28" textAnchor="middle" fill="#22c55e" fontSize="10" fontWeight="800">{measurements.e_cell_v}V</text>
        </svg>
      </div>
    );
  }

  // 6. Gas Laws & Thermochemistry — Movable Piston Cylinder
  if (experimentId === 'gas-laws-thermodynamics') {
    const vol = Number(params.volume ?? 22.4);
    const pistonX = Math.max(120, Math.min(360, 100 + (vol / 50) * 260));
    return (
      <div className="lab-card p-4 sm:p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            Gas Laws Piston Cylinder (PV = nRT vs van der Waals)
          </h3>
          <span className="font-mono text-xs font-extrabold text-green-700 dark:text-green-300">
            P_ideal = {measurements.p_ideal_atm} atm · Z = {measurements.compressibility_z}
          </span>
        </div>
        <svg viewBox="0 0 480 175" className="w-full rounded-2xl border border-green-100 bg-sky-50/40 dark:border-navy-800 dark:bg-navy-950">
          <rect x="40" y="34" width="350" height="106" rx="8" fill="#ffffff" stroke="#475569" strokeWidth="3" />
          <rect x="43" y="37" width={pistonX - 43} height="100" fill="#e0f2fe" />
          {/* Moving Gas Molecules */}
          {Array.from({ length: Math.min(18, Math.round(Number(params.moles ?? 1) * 5)) }, (_, i) => {
            const span = Math.max(24, pistonX - 60);
            const gx = 52 + ((i * 39 + tick * (2 + (i % 3))) % span);
            const gy = 48 + ((i * 29 + tick * (2 + (i % 2))) % 80);
            return <circle key={i} cx={gx} cy={gy} r="4.5" fill="#2563eb" />;
          })}
          {/* Movable Piston */}
          <rect x={pistonX} y="37" width="16" height="100" fill="#64748b" />
          <rect x={pistonX + 16} y="80" width={420 - pistonX} height="14" fill="#94a3b8" />
          <text x="50" y="160" fontSize="10" fontWeight="800" fill="#1e293b">
            V = {vol} L · T = {params.temperature} K · P_vdW = {measurements.p_vdw_atm} atm
          </text>
        </svg>
      </div>
    );
  }

  // 7. Dedicated Bright Visualizers for Mole Stoichiometry, Chemical Bonding, Dilution, Equilibrium, Kinetics
  const titleMap = {
    'mole-stoichiometry': `Weighing Balance & Avogadro Counter (${measurements.moles} mol = ${measurements.particles_1e23}×10²³ particles)`,
    'chemical-bonding': `${measurements.bond_type} Bond Model (Δχ = ${measurements.delta_en}, ${measurements.ionic_character_pct}% Ionic)`,
    'concentration-dilution': `Volumetric Dilution Flask (C₂ = ${measurements.final_molarity} M · ${measurements.dilution_factor}× Diluted)`,
    'chemical-equilibrium': `Reversible Equilibrium Chamber (Qc = ${measurements.qc} vs Kc = ${measurements.kc})`,
    'reaction-kinetics': `Arrhenius Collision & Decay Chamber (t₁/₂ = ${measurements.half_life_s} s)`,
  };

  const dilutionOpacity = experimentId === 'concentration-dilution'
    ? Math.max(0.15, Math.min(0.95, Number(measurements.final_molarity ?? 0.5) / 2.5))
    : 0.7;

  return (
    <div className="lab-card p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
          {titleMap[experimentId] || 'Interactive Chemistry Chamber'}
        </h3>
        <span className="rounded-full bg-green-100 px-3 py-1 font-mono text-xs font-extrabold text-green-800 dark:bg-green-950 dark:text-green-200">
          {experimentId.replace(/-/g, ' ').toUpperCase()}
        </span>
      </div>

      {/* Interactive SVG tailored to each chemistry experiment */}
      <svg viewBox="0 0 480 160" className="w-full rounded-2xl border border-green-100 bg-gradient-to-br from-green-50/50 via-white to-sky-50/50 dark:border-navy-800 dark:from-navy-950 dark:to-navy-900">
        {experimentId === 'chemical-bonding' ? (
          <g>
            <circle cx="155" cy="80" r="38" fill="#38bdf8" fillOpacity="0.85" stroke="#0284c7" strokeWidth="2.5" />
            <text x="155" y="84" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">Atom A</text>
            <circle cx="325" cy="80" r="38" fill="#22c55e" fillOpacity="0.85" stroke="#15803d" strokeWidth="2.5" />
            <text x="325" y="84" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">Atom B</text>
            {measurements.bond_type === 'Ionic' ? (
              <>
                <path d="M195,55 Q240,25 285,55" fill="none" stroke="#f97316" strokeWidth="3" strokeDasharray="5 3" />
                <text x="240" y="34" textAnchor="middle" fontSize="10" fontWeight="800" fill="#c2410c">e⁻ Transferred (Ionic)</text>
              </>
            ) : (
              <>
                <ellipse cx="240" cy="80" rx="58" ry="22" fill="#facc15" fillOpacity="0.35" stroke="#eab308" strokeWidth="2" />
                <text x="240" y="84" textAnchor="middle" fontSize="10" fontWeight="800" fill="#854d0e">{measurements.shared_electrons} Shared e⁻</text>
              </>
            )}
          </g>
        ) : experimentId === 'concentration-dilution' ? (
          <g>
            <rect x="65" y="42" width="84" height="90" rx="8" fill="#ffffff" stroke="#64748b" strokeWidth="2.5" />
            <rect x="68" y="80" width="78" height="49" fill="#2563eb" fillOpacity="0.9" />
            <text x="107" y="148" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#1e293b">Stock C₁={params.initial_molarity}M</text>
            <text x="218" y="88" textAnchor="middle" fontSize="11" fontWeight="800" fill="#0284c7">+{measurements.solvent_added_ml} mL H₂O →</text>
            <rect x="300" y="28" width="108" height="104" rx="10" fill="#ffffff" stroke="#64748b" strokeWidth="2.5" />
            <rect x="303" y="54" width="102" height="75" fill="#2563eb" fillOpacity={dilutionOpacity} />
            <text x="354" y="148" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#1e293b">Diluted C₂={measurements.final_molarity}M</text>
          </g>
        ) : (
          <g>
            <rect x="34" y="26" width="180" height="106" rx="14" fill="#ffffff" stroke="#22c55e" strokeWidth="2" />
            <text x="124" y="52" textAnchor="middle" fontSize="10" fontWeight="800" fill="#15803d">Reactant / Sample State</text>
            {[0, 1, 2, 3, 4].map((i) => (
              <circle key={i} cx={66 + i * 28} cy={92 + Math.sin(tick * 0.15 + i) * 10} r="7" fill="#38bdf8" />
            ))}
            <line x1="224" y1="80" x2="258" y2="80" stroke="#22c55e" strokeWidth="3.5" />
            <polygon points="258,74 268,80 258,86" fill="#22c55e" />
            <rect x="274" y="26" width="174" height="106" rx="14" fill="#f0fdf4" stroke="#16a34a" strokeWidth="2" />
            <text x="361" y="52" textAnchor="middle" fontSize="10" fontWeight="800" fill="#15803d">Computed Output</text>
            <text x="361" y="88" textAnchor="middle" fontSize="12" fontWeight="800" fill="#1e293b">
              {measurements.shift_direction || `${measurements.product_moles ?? measurements.half_life_s ?? ''} ${measurements.product_moles ? 'mol' : 's'}`}
            </text>
          </g>
        )}
      </svg>

      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {Object.entries(measurements)
          .filter(([, v]) => v !== null && typeof v !== 'object')
          .slice(0, 4)
          .map(([k, v]) => (
            <div key={k} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-navy-700 dark:bg-navy-950">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{k.replace(/_/g, ' ')}</p>
              <p className="mt-0.5 font-mono text-xs font-extrabold text-slate-900 dark:text-white">{String(v)}</p>
            </div>
          ))}
      </div>
    </div>
  );
}
