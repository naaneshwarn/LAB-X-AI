import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Bot, Box, Layers, Pause, Play, RotateCcw, Sun } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ANIMAL_ORGANELLES, PLANT_ORGANELLES } from '../engines/biology';
import Lightweight3DCanvas from '../../components/Lightweight3DCanvas';

const RespiratorySystemVisualizer = lazy(() => import('./biology/RespiratorySystemVisualizer'));
const DigestiveSystemVisualizer = lazy(() => import('./biology/DigestiveSystemVisualizer'));
const CirculatorySystemVisualizer = lazy(() => import('./biology/CirculatorySystemVisualizer'));
const NervousSystemVisualizer = lazy(() => import('./biology/NervousSystemVisualizer'));

export default function BiologyVisualizer({
  experimentId,
  params,
  measurements,
  onParamChange,
  onAskTutor,
}) {
  const { lowPowerMode } = useApp();
  const [playing, setPlaying] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [viewMode, setViewMode] = useState('2d');
  const [tick, setTick] = useState(0);
  const [dnaRepStep, setDnaRepStep] = useState(0); // 0=Double Helix, 1=Helicase Unzips, 2=Polymerase Pairs, 3=Two Daughter Helices

  useEffect(() => {
    if (lowPowerMode) setViewMode('2d');
  }, [lowPowerMode]);

  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => setTick((t) => (t + 1) % 360), 60);
    return () => clearInterval(id);
  }, [playing]);

  // Auto-step animation for Mitosis/Meiosis stages
  useEffect(() => {
    if (!playing || experimentId !== 'mitosis-meiosis') return undefined;
    const id = setInterval(() => {
      const next = (Math.round(Number(params.stage ?? 0)) + 1) % 5;
      onParamChange?.('stage', next);
    }, 1600);
    return () => clearInterval(id);
  }, [playing, experimentId, params.stage, onParamChange]);

  // Human Body 4 Systems
  if (experimentId === 'human-respiratory-system') {
    return (
      <Suspense fallback={<div className="lab-card p-6 text-center text-xs text-slate-500">Loading Respiratory System...</div>}>
        <RespiratorySystemVisualizer params={params} measurements={measurements} onParamChange={onParamChange} onAskTutor={onAskTutor} />
      </Suspense>
    );
  }
  if (experimentId === 'human-digestive-system') {
    return (
      <Suspense fallback={<div className="lab-card p-6 text-center text-xs text-slate-500">Loading Digestive System...</div>}>
        <DigestiveSystemVisualizer params={params} measurements={measurements} onParamChange={onParamChange} onAskTutor={onAskTutor} />
      </Suspense>
    );
  }
  if (experimentId === 'human-circulatory-system') {
    return (
      <Suspense fallback={<div className="lab-card p-6 text-center text-xs text-slate-500">Loading Circulatory System...</div>}>
        <CirculatorySystemVisualizer params={params} measurements={measurements} onParamChange={onParamChange} onAskTutor={onAskTutor} />
      </Suspense>
    );
  }
  if (experimentId === 'human-nervous-system') {
    return (
      <Suspense fallback={<div className="lab-card p-6 text-center text-xs text-slate-500">Loading Nervous System...</div>}>
        <NervousSystemVisualizer params={params} measurements={measurements} onParamChange={onParamChange} onAskTutor={onAskTutor} />
      </Suspense>
    );
  }

  // 1 & 2. Interactive Plant & Animal Cell Explorer (2D + 3D Orbit)
  if (experimentId === 'plant-cell-structure' || experimentId === 'animal-cell-structure') {
    const isPlant = experimentId === 'plant-cell-structure';
    const list = isPlant ? PLANT_ORGANELLES : ANIMAL_ORGANELLES;
    const activeIdx = Math.max(0, Math.min(list.length - 1, Math.round(Number(params.organelle_index ?? 1))));
    const selected = list[activeIdx] || list[0];

    const hotspots = isPlant
      ? [
          { idx: 0, label: 'Cell Wall', x: 34, y: 24, w: 412, h: 178, color: '#15803d', type: 'rect' },
          { idx: 7, label: 'Plasma Membrane', x: 46, y: 36, w: 388, h: 154, color: '#22c55e', type: 'rect' },
          { idx: 2, label: 'Central Vacuole', cx: 300, cy: 114, rx: 86, ry: 48, color: '#38bdf8', type: 'ellipse' },
          { idx: 3, label: 'Nucleus', cx: 132, cy: 96, rx: 36, ry: 32, color: '#8b5cf6', type: 'ellipse' },
          { idx: 1, label: 'Chloroplast', cx: 132, cy: 160, rx: 30, ry: 14, color: '#16a34a', type: 'ellipse' },
          { idx: 4, label: 'Mitochondrion', cx: 205, cy: 162, rx: 24, ry: 12, color: '#f97316', type: 'ellipse' },
          { idx: 5, label: 'ER', cx: 192, cy: 82, rx: 24, ry: 15, color: '#ec4899', type: 'ellipse' },
          { idx: 6, label: 'Golgi', cx: 212, cy: 124, rx: 22, ry: 12, color: '#eab308', type: 'ellipse' },
        ]
      : [
          { idx: 7, label: 'Plasma Membrane', cx: 240, cy: 112, rx: 188, ry: 90, color: '#38bdf8', type: 'ellipse' },
          { idx: 0, label: 'Nucleus', cx: 228, cy: 106, rx: 42, ry: 38, color: '#8b5cf6', type: 'ellipse' },
          { idx: 1, label: 'Mitochondrion', cx: 338, cy: 90, rx: 28, ry: 14, color: '#f97316', type: 'ellipse' },
          { idx: 2, label: 'Lysosome', cx: 124, cy: 130, rx: 18, ry: 18, color: '#fb7185', type: 'ellipse' },
          { idx: 3, label: 'Centrosome', cx: 145, cy: 78, rx: 16, ry: 14, color: '#14b8a6', type: 'ellipse' },
          { idx: 5, label: 'Golgi', cx: 326, cy: 146, rx: 28, ry: 14, color: '#eab308', type: 'ellipse' },
          { idx: 6, label: 'ER', cx: 282, cy: 62, rx: 28, ry: 14, color: '#ec4899', type: 'ellipse' },
          { idx: 4, label: 'Ribosome', cx: 182, cy: 164, rx: 15, ry: 10, color: '#22c55e', type: 'ellipse' },
        ];

    const cell3DNodes = isPlant
      ? [
          { id: 0, x: 0, y: 0, z: -20, rx: 118, ry: 88, color: '#22c55e', highlight: '#bbf7d0', shadow: '#15803d', label: 'Cell Wall', opacity: 0.25 },
          { id: 2, x: 35, y: 5, z: 0, rx: 52, ry: 36, color: '#38bdf8', highlight: '#e0f2fe', shadow: '#0284c7', label: 'Vacuole', opacity: 0.8 },
          { id: 3, x: -55, y: -15, z: 18, rx: 28, ry: 26, color: '#8b5cf6', highlight: '#ddd6fe', shadow: '#5b21b6', label: 'Nucleus' },
          { id: 1, x: -52, y: 40, z: 30, rx: 22, ry: 12, color: '#16a34a', highlight: '#86efac', shadow: '#14532d', label: 'Chloroplast' },
          { id: 4, x: 4, y: 48, z: 26, rx: 18, ry: 10, color: '#fb923c', highlight: '#fed7aa', shadow: '#c2410c', label: 'Mitochondrion' },
          { id: 5, x: -20, y: -38, z: 22, rx: 18, ry: 12, color: '#f472b6', highlight: '#fbcfe8', shadow: '#be185d', label: 'ER' },
          { id: 6, x: 8, y: 12, z: 38, rx: 16, ry: 10, color: '#facc15', highlight: '#fef08a', shadow: '#a16207', label: 'Golgi' },
        ]
      : [
          { id: 7, x: 0, y: 0, z: -18, rx: 115, ry: 86, color: '#38bdf8', highlight: '#e0f2fe', shadow: '#0369a1', label: 'Membrane', opacity: 0.22 },
          { id: 0, x: -8, y: -6, z: 12, rx: 32, ry: 30, color: '#8b5cf6', highlight: '#ddd6fe', shadow: '#5b21b6', label: 'Nucleus' },
          { id: 1, x: 64, y: -18, z: 24, rx: 22, ry: 11, color: '#fb923c', highlight: '#fed7aa', shadow: '#c2410c', label: 'Mitochondrion' },
          { id: 2, x: -64, y: 20, z: 28, rx: 16, ry: 16, color: '#fb7185', highlight: '#fecdd3', shadow: '#be123c', label: 'Lysosome' },
          { id: 3, x: -56, y: -34, z: 18, rx: 14, ry: 12, color: '#14b8a6', highlight: '#99f6e4', shadow: '#0f766e', label: 'Centrosome' },
          { id: 5, x: 54, y: 34, z: 20, rx: 20, ry: 11, color: '#facc15', highlight: '#fef08a', shadow: '#a16207', label: 'Golgi' },
          { id: 6, x: 24, y: -42, z: 16, rx: 20, ry: 11, color: '#f472b6', highlight: '#fbcfe8', shadow: '#be185d', label: 'ER' },
          { id: 4, x: -24, y: 48, z: 34, rx: 10, ry: 10, color: '#22c55e', highlight: '#bbf7d0', shadow: '#15803d', label: 'Ribosome' },
        ];

    return (
      <div className="lab-card p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Interactive {isPlant ? 'Plant' : 'Animal'} Cell Explorer
            </h3>
            <p className="text-xs text-slate-500">Click any organelle to highlight it and inspect its function</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCompareMode((c) => !c)}
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
            >
              {compareMode ? 'Hide Comparison' : 'Compare Plant vs Animal'}
            </button>
            <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 dark:border-navy-700 dark:bg-navy-950">
              <button type="button" onClick={() => setViewMode('2d')} className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold ${viewMode === '2d' ? 'bg-white text-blue-700 shadow-sm dark:bg-navy-800 dark:text-sky-300' : 'text-slate-500'}`}>
                <Layers className="h-3 w-3" /> 2D
              </button>
              <button type="button" onClick={() => setViewMode('3d')} className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold ${viewMode === '3d' ? 'bg-white text-blue-700 shadow-sm dark:bg-navy-800 dark:text-sky-300' : 'text-slate-500'}`}>
                <Box className="h-3 w-3" /> 3D
              </button>
            </div>
          </div>
        </div>

        {viewMode === '3d' ? (
          <Lightweight3DCanvas
            nodes={cell3DNodes}
            selectedId={activeIdx}
            onSelect={(id) => onParamChange?.('organelle_index', id)}
            bgColor={isPlant ? '#f0fdf4' : '#f0f9ff'}
            hintText={`Drag to rotate 3D ${isPlant ? 'Plant' : 'Animal'} Cell · Click any organelle`}
          />
        ) : (
          <svg viewBox="0 0 480 228" className="w-full rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 via-white to-sky-50/60 dark:border-navy-800 dark:from-navy-950 dark:to-navy-900">
            {hotspots.map((h) => {
              const isSel = h.idx === activeIdx;
              if (h.type === 'rect') {
                return (
                  <rect
                    key={h.idx}
                    x={h.x}
                    y={h.y}
                    width={h.w}
                    height={h.h}
                    rx="24"
                    fill={h.idx === 0 ? '#dcfce7' : '#ecfdf5'}
                    stroke={isSel ? '#facc15' : h.color}
                    strokeWidth={isSel ? 4.5 : 3}
                    className="cursor-pointer transition"
                    onClick={() => onParamChange?.('organelle_index', h.idx)}
                  />
                );
              }
              return (
                <g key={h.idx} className="cursor-pointer" onClick={() => onParamChange?.('organelle_index', h.idx)}>
                  <ellipse
                    cx={h.cx}
                    cy={h.cy}
                    rx={h.rx}
                    ry={h.ry}
                    fill={h.color}
                    fillOpacity={h.idx === 7 && !isPlant ? 0.16 : 0.85}
                    stroke={isSel ? '#facc15' : '#1e293b'}
                    strokeWidth={isSel ? 3.5 : 1.2}
                  />
                  <text
                    x={h.cx}
                    y={h.idx === 7 && !isPlant ? h.cy - h.ry + 15 : h.cy + 4}
                    textAnchor="middle"
                    fill={h.idx === 7 && !isPlant ? '#0369a1' : '#ffffff'}
                    fontSize="9.5"
                    fontWeight="800"
                  >
                    {h.label}
                  </text>
                </g>
              );
            })}
          </svg>
        )}

        {/* Organelle Pills & Role */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {list.map((org, idx) => (
            <button
              key={org.name}
              type="button"
              onClick={() => onParamChange?.('organelle_index', idx)}
              className={`rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                idx === activeIdx
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-emerald-50 dark:border-navy-700 dark:bg-navy-950 dark:text-slate-300'
              }`}
            >
              {org.name}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50/80 p-3 text-xs text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-200">
          <p className="flex-1">
            <strong>{selected.name}:</strong> {selected.role}
          </p>
          {onAskTutor && (
            <button
              type="button"
              onClick={() =>
                onAskTutor(`Explain the function of the ${selected.name} in a ${isPlant ? 'plant' : 'animal'} cell.`, {
                  selected_structure: selected.name,
                })
              }
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700"
            >
              <Bot className="h-3 w-3" /> Ask AI Tutor
            </button>
          )}
        </div>

        {compareMode && (
          <div className="mt-3 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs sm:grid-cols-2 dark:border-navy-700 dark:bg-navy-950">
            <div>
              <p className="font-extrabold text-emerald-700 dark:text-emerald-400">Plant Cell Unique Features</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-slate-600 dark:text-slate-300">
                <li>Rigid cellulose Cell Wall for fixed shape</li>
                <li>Chloroplasts for photosynthesis</li>
                <li>Large Central Vacuole maintaining turgor pressure</li>
              </ul>
            </div>
            <div>
              <p className="font-extrabold text-blue-700 dark:text-sky-400">Animal Cell Unique Features</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-slate-600 dark:text-slate-300">
                <li>Flexible Plasma Membrane only (varied shapes)</li>
                <li>Lysosomes for intracellular enzyme recycling</li>
                <li>Centrosomes with centrioles guiding mitosis</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. Photosynthesis Interactive Leaf & Chloroplast Visualizer
  if (experimentId === 'photosynthesis') {
    const light = Number(params.light_intensity ?? 600);
    const o2Rate = Number(measurements.o2_evolution_rate ?? 0);
    const bubbleCount = Math.max(1, Math.min(10, Math.round(o2Rate / 2.2)));
    return (
      <div className="lab-card p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white">
              <Sun className="h-4 w-4 text-amber-500" />
              Interactive Photosynthesis Chamber
            </h3>
            <p className="text-xs text-slate-500">6 CO₂ + 6 H₂O + Sunlight → C₆H₁₂O₆ (Glucose) + 6 O₂↑</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 font-mono text-xs font-extrabold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
            Limiting: {measurements.limiting_factor}
          </span>
        </div>
        <svg viewBox="0 0 480 215" className="w-full rounded-2xl border border-emerald-100 bg-gradient-to-b from-sky-100 via-sky-50 to-emerald-50 dark:border-navy-800 dark:from-navy-950 dark:to-emerald-950/40">
          {/* Glowing Sun */}
          <circle cx="72" cy="46" r={16 + (light / 2000) * 14} fill="#facc15" stroke="#f59e0b" strokeWidth="3" />
          {[0, 1, 2, 3].map((i) => (
            <line
              key={i}
              x1={92 + i * 8}
              y1={64 + i * 2}
              x2={175 + i * 16}
              y2={112}
              stroke="#fbbf24"
              strokeWidth={Math.max(1.2, (light / 1500) * 3.5)}
              strokeDasharray="6 4"
            />
          ))}
          {/* Green Leaf / Chloroplast Chamber */}
          <path d="M125,148 Q240,68 372,140 Q258,204 125,148 Z" fill="#22c55e" stroke="#15803d" strokeWidth="3" />
          <line x1="125" y1="148" x2="364" y2="140" stroke="#bbf7d0" strokeWidth="2.5" />
          {/* Chloroplast Grana Stacks */}
          {[200, 245, 290].map((gx) => (
            <g key={gx}>
              <ellipse cx={gx} cy="134" rx="14" ry="5" fill="#15803d" />
              <ellipse cx={gx} cy="126" rx="14" ry="5" fill="#166534" />
            </g>
          ))}
          {/* Water uptake from roots */}
          <text x="108" y="198" fontSize="10" fontWeight="800" fill="#0284c7">H₂O Absorbed ↑</text>
          {/* CO2 Entering */}
          <text x="26" y="138" fontSize="10" fontWeight="800" fill="#475569">CO₂ ({params.co2_ppm} ppm) →</text>
          {/* Rising O2 Bubbles proportional to live O2 evolution rate */}
          {Array.from({ length: bubbleCount }, (_, i) => {
            const bx = 210 + (i % 5) * 30;
            const by = 115 - ((tick * 1.4 + i * 23) % 95);
            return (
              <g key={i}>
                <circle cx={bx} cy={by} r="6" fill="#38bdf8" fillOpacity="0.8" stroke="#0284c7" strokeWidth="1.5" />
                <text x={bx} y={by + 3} textAnchor="middle" fontSize="6.5" fontWeight="800" fill="#fff">O₂</text>
              </g>
            );
          })}
          {/* Glucose Production Badge */}
          <rect x="358" y="158" width="110" height="44" rx="10" fill="#ffffff" stroke="#22c55e" strokeWidth="2" />
          <text x="413" y="176" textAnchor="middle" fontSize="9" fontWeight="800" fill="#15803d">Glucose Produced</text>
          <text x="413" y="191" textAnchor="middle" fontSize="10" fontWeight="800" fill="#1e293b">
            {measurements.glucose_synthesis_rate} μmol/m²/s
          </text>
        </svg>
      </div>
    );
  }

  // 4. Cellular Respiration Animated Mitochondrion & ATP Factory
  if (experimentId === 'cellular-respiration') {
    const aerobic = Number(params.oxygen_availability ?? 100) > 10;
    return (
      <div className="lab-card p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Cellular Respiration &amp; ATP Energy Factory
            </h3>
            <p className="text-xs text-slate-500">C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O + ATP Energy</p>
          </div>
          <span className="rounded-full bg-orange-100 px-3 py-1 font-mono text-xs font-extrabold text-orange-800 dark:bg-orange-950 dark:text-orange-200">
            Net Yield: {measurements.total_atp_mol} mol ATP
          </span>
        </div>
        <svg viewBox="0 0 480 195" className="w-full rounded-2xl border border-orange-100 bg-gradient-to-r from-sky-50 via-white to-orange-50 dark:border-navy-800 dark:from-navy-950 dark:to-navy-900">
          {/* Cytoplasm Box */}
          <rect x="16" y="24" width="142" height="145" rx="16" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="2" />
          <text x="87" y="45" textAnchor="middle" fontSize="10" fontWeight="800" fill="#0369a1">Cytoplasm</text>
          <text x="87" y="64" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1e293b">1. Glycolysis</text>
          <text x="87" y="82" textAnchor="middle" fontSize="8.5" fill="#475569">Glucose → Pyruvate</text>
          <rect x="38" y="102" width="98" height="32" rx="10" fill="#facc15" />
          <text x="87" y="122" textAnchor="middle" fontSize="10" fontWeight="800" fill="#713f12">
            +{measurements.glycolysis_atp} ATP
          </text>

          {/* Arrow into Mitochondrion */}
          <line x1="158" y1="96" x2="195" y2="96" stroke="#2563eb" strokeWidth="3" />
          <polygon points="195,91 205,96 195,101" fill="#2563eb" />

          {/* Mitochondrion Oval */}
          <ellipse cx="332" cy="96" rx="124" ry="70" fill={aerobic ? '#fed7aa' : '#e2e8f0'} stroke={aerobic ? '#ea580c' : '#64748b'} strokeWidth="3" />
          {/* Inner Cristae Wavy Path */}
          <path d="M236,96 Q256,55 276,96 Q296,137 316,96 Q336,55 356,96 Q376,137 396,96 Q416,55 426,96" fill="none" stroke={aerobic ? '#fb923c' : '#94a3b8'} strokeWidth="4" />
          <text x="332" y="46" textAnchor="middle" fontSize="10" fontWeight="800" fill="#9a3412">
            Mitochondrion ({aerobic ? 'Aerobic Mode' : 'Anaerobic Bypass'})
          </text>
          <rect x="256" y="72" width="152" height="52" rx="12" fill="#ffffff" fillOpacity="0.92" stroke="#f97316" strokeWidth="1.5" />
          <text x="332" y="92" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#1e293b">
            Krebs: +{measurements.krebs_atp} ATP
          </text>
          <text x="332" y="109" textAnchor="middle" fontSize="10" fontWeight="800" fill="#ea580c">
            OxPhos: +{measurements.oxphos_atp} ATP
          </text>
          <text x="332" y="148" textAnchor="middle" fontSize="9" fontWeight="700" fill="#475569">
            O₂ used: {measurements.o2_consumed_mol} mol · CO₂ out: {measurements.co2_released_mol} mol
          </text>
        </svg>
      </div>
    );
  }

  // 5. Animated Mitosis & Meiosis Stages
  if (experimentId === 'mitosis-meiosis') {
    const stage = Math.max(0, Math.min(4, Math.round(Number(params.stage ?? 2))));
    const isMit = Number(params.division_mode ?? 0) === 0;
    const stageTitles = ['Interphase (G₁)', 'Prophase (DNA 4C)', 'Metaphase Alignment', 'Anaphase Separation', isMit ? '2 Diploid (2n) Cells' : '4 Haploid (n) Gametes'];
    return (
      <div className="lab-card p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {measurements.mode_name} — {stageTitles[stage]}
            </h3>
            <p className="text-xs text-slate-500">Click any stage below or press Animate to watch chromosomes divide</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => setPlaying((p) => !p)} className="lab-btn-primary px-3 py-1 text-xs">
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {playing ? 'Pause' : 'Animate'}
            </button>
            <button type="button" onClick={() => onParamChange?.('stage', 0)} className="lab-btn-secondary p-1.5 text-xs" aria-label="Reset stages">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <svg viewBox="0 0 480 190" className="w-full rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 via-white to-violet-50/40 dark:border-navy-800 dark:from-navy-950 dark:to-navy-900">
          {stage < 4 ? (
            <>
              <ellipse cx="240" cy="96" rx={stage === 3 ? 122 : 82} ry="68" fill="#dcfce7" stroke="#22c55e" strokeWidth="3" />
              {stage >= 2 && (
                <>
                  <circle cx="148" cy="96" r="7" fill="#f59e0b" />
                  <circle cx="332" cy="96" r="7" fill="#f59e0b" />
                </>
              )}
              {stage === 2 && (
                <>
                  <line x1="240" y1="28" x2="240" y2="164" stroke="#94a3b8" strokeDasharray="4 4" />
                  {[66, 86, 106, 126].map((y) => (
                    <g key={y}>
                      <line x1="148" y1="96" x2="232" y2={y} stroke="#cbd5e1" strokeWidth="1.2" />
                      <line x1="332" y1="96" x2="248" y2={y} stroke="#cbd5e1" strokeWidth="1.2" />
                      <rect x="230" y={y - 5} width="20" height="10" rx="5" fill="#7c3aed" />
                    </g>
                  ))}
                </>
              )}
              {stage === 3 &&
                [68, 96, 124].map((y) => (
                  <g key={y}>
                    <line x1="148" y1="96" x2="180" y2={y} stroke="#38bdf8" strokeWidth="1.5" />
                    <line x1="332" y1="96" x2="300" y2={y} stroke="#fb7185" strokeWidth="1.5" />
                    <circle cx="182" cy={y} r="7" fill="#2563eb" />
                    <circle cx="298" cy={y} r="7" fill="#e11d48" />
                  </g>
                ))}
              {stage <= 1 && (
                <circle cx="240" cy="96" r="34" fill="#a78bfa" fillOpacity="0.65" stroke="#6d28d9" strokeDasharray={stage === 1 ? '5 4' : 'none'} strokeWidth="2.5" />
              )}
            </>
          ) : isMit ? (
            [162, 318].map((cx) => (
              <g key={cx}>
                <circle cx={cx} cy="96" r="56" fill="#dcfce7" stroke="#22c55e" strokeWidth="3" />
                <circle cx={cx} cy="96" r="24" fill="#a78bfa" />
                <text x={cx} y="100" textAnchor="middle" fill="#1e293b" fontSize="11" fontWeight="800">2n={params.diploid_number}</text>
              </g>
            ))
          ) : (
            [86, 188, 292, 394].map((cx) => (
              <g key={cx}>
                <circle cx={cx} cy="96" r="40" fill="#dcfce7" stroke="#22c55e" strokeWidth="2.5" />
                <circle cx={cx} cy="96" r="18" fill="#fb7185" />
                <text x={cx} y="100" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="800">n={Math.round(params.diploid_number / 2)}</text>
              </g>
            ))
          )}
          <text x="16" y="20" fill="#0f172a" fontSize="10.5" fontWeight="800">
            DNA Content: {measurements.dna_content_c}C · Chromatids: {measurements.chromatids_per_cell}
          </text>
        </svg>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {stageTitles.map((title, idx) => (
            <button
              key={title}
              type="button"
              onClick={() => {
                setPlaying(false);
                onParamChange?.('stage', idx);
              }}
              className={`rounded-xl px-2.5 py-1 text-xs font-bold ${
                stage === idx
                  ? 'bg-emerald-600 text-white'
                  : 'border border-slate-200 bg-slate-50 text-slate-700 dark:border-navy-700 dark:bg-navy-950 dark:text-slate-300'
              }`}
            >
              {idx + 1}. {title}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 6. DNA Double Helix & Step-by-Step Replication
  if (experimentId === 'dna-structure-replication') {
    const pairs = [
      ['A', 'T', 2], ['G', 'C', 3], ['T', 'A', 2], ['C', 'G', 3],
      ['A', 'T', 2], ['G', 'C', 3], ['C', 'G', 3], ['T', 'A', 2],
    ];
    const repSteps = [
      '0. Intact Double Helix',
      '1. Helicase Unzips H-Bonds',
      '2. DNA Polymerase Adds Bases',
      '3. Two Identical Daughter DNA Helices',
    ];
    return (
      <div className="lab-card p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              DNA Double Helix &amp; Step-by-Step Replication
            </h3>
            <p className="text-xs text-slate-500">GC = {measurements.gc_content_pct}% · {measurements.hydrogen_bonds} H-bonds · Semi-conservative synthesis</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {repSteps.map((lbl, idx) => (
              <button
                key={lbl}
                type="button"
                onClick={() => setDnaRepStep(idx)}
                className={`rounded-lg px-2 py-1 text-[11px] font-bold ${
                  dnaRepStep === idx
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-200 bg-slate-50 text-slate-600 dark:border-navy-700 dark:bg-navy-950 dark:text-slate-300'
                }`}
              >
                Step {idx}
              </button>
            ))}
          </div>
        </div>
        <svg viewBox="0 0 480 185" className="w-full rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/60 via-white to-violet-50/40 dark:border-navy-800 dark:from-navy-950 dark:to-navy-900">
          {pairs.map(([b1, b2, bonds], i) => {
            const x = 44 + i * 56;
            const split = dnaRepStep >= 1 && i >= 3 ? (dnaRepStep === 3 ? 28 : 20) : 0;
            const wave = Math.sin(i * 0.7 + tick * 0.04) * (split > 0 ? 12 : 40);
            const y1 = 92 + wave - split;
            const y2 = 92 - wave + split;
            return (
              <g key={i}>
                {split === 0 && (
                  <line x1={x} y1={y1} x2={x} y2={y2} stroke={bonds === 3 ? '#f59e0b' : '#38bdf8'} strokeDasharray={bonds === 3 ? '3 2' : '5 4'} strokeWidth="2.8" />
                )}
                {/* Original Strands */}
                <circle cx={x} cy={y1} r="12" fill={b1 === 'A' || b1 === 'T' ? '#2563eb' : '#16a34a'} />
                <text x={x} y={y1 + 4} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="800">{b1}</text>
                <circle cx={x} cy={y2} r="12" fill={b2 === 'A' || b2 === 'T' ? '#7c3aed' : '#ea580c'} />
                <text x={x} y={y2 + 4} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="800">{b2}</text>
                {/* Newly Synthesized Complementary Strands */}
                {dnaRepStep >= 2 && i >= 3 && (
                  <>
                    <circle cx={x} cy={y1 + 26} r="9.5" fill="#fb7185" stroke="#fff" strokeWidth="1.5" />
                    <text x={x} y={y1 + 29} textAnchor="middle" fill="#fff" fontSize="8.5" fontWeight="800">{b2}</text>
                    <circle cx={x} cy={y2 - 26} r="9.5" fill="#fb7185" stroke="#fff" strokeWidth="1.5" />
                    <text x={x} y={y2 - 23} textAnchor="middle" fill="#fff" fontSize="8.5" fontWeight="800">{b1}</text>
                  </>
                )}
              </g>
            );
          })}
          {dnaRepStep === 1 && (
            <polygon points="185,92 212,76 212,108" fill="#facc15" stroke="#a16207" strokeWidth="2" />
          )}
          <text x="14" y="172" fill="#334155" fontSize="10" fontWeight="700">
            {repSteps[dnaRepStep]} · A=T (2 H-bonds), G≡C (3 H-bonds) · Length = {measurements.helix_length_nm} nm
          </text>
        </svg>
      </div>
    );
  }

  // 7. Mendelian Genetics Interactive Punnett Square
  if (experimentId === 'mendelian-genetics') {
    const grid = measurements.punnett_grid || ['AA', 'Aa', 'Aa', 'aa'];
    const p1 = measurements.parent1_alleles || ['A', 'a'];
    const p2 = measurements.parent2_alleles || ['A', 'a'];
    return (
      <div className="lab-card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            Interactive Punnett Square ({measurements.cross})
          </h3>
          <span className="rounded-full bg-emerald-100 px-3 py-1 font-mono text-xs font-extrabold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
            {measurements.dominant_phenotype_pct}% Dominant · {measurements.recessive_phenotype_pct}% Recessive
          </span>
        </div>
        <div className="mx-auto grid max-w-sm grid-cols-3 gap-2.5 text-center font-mono">
          <div className="rounded-xl bg-slate-100 p-2.5 text-xs font-bold text-slate-500 dark:bg-navy-950">Parent ×</div>
          <div className="rounded-xl bg-emerald-100 p-2.5 text-base font-extrabold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">{p2[0]}</div>
          <div className="rounded-xl bg-emerald-100 p-2.5 text-base font-extrabold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">{p2[1]}</div>

          <div className="rounded-xl bg-sky-100 p-3 text-base font-extrabold text-blue-900 dark:bg-blue-950 dark:text-blue-200">{p1[0]}</div>
          {[grid[0], grid[1]].map((g, i) => (
            <div key={i} className={`rounded-xl border-2 p-3 text-lg font-extrabold ${g === 'aa' ? 'border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200' : 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'}`}>
              {g}
              <span className="block font-sans text-[10px] font-semibold">{g === 'aa' ? 'Recessive' : 'Dominant'}</span>
            </div>
          ))}

          <div className="rounded-xl bg-sky-100 p-3 text-base font-extrabold text-blue-900 dark:bg-blue-950 dark:text-blue-200">{p1[1]}</div>
          {[grid[2], grid[3]].map((g, i) => (
            <div key={i + 2} className={`rounded-xl border-2 p-3 text-lg font-extrabold ${g === 'aa' ? 'border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200' : 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'}`}>
              {g}
              <span className="block font-sans text-[10px] font-semibold">{g === 'aa' ? 'Recessive' : 'Dominant'}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 8. Food Chain & Ecosystem Food Web + Energy Pyramid
  if (experimentId === 'food-chain-ecosystem') {
    const tiers = [
      { label: 'L4 Apex Predators (Hawk / Eagle)', val: measurements.tertiary_consumers_kcal, w: '40%', bg: 'bg-rose-500' },
      { label: 'L3 Secondary Consumers (Frog / Snake)', val: measurements.secondary_consumers_kcal, w: '60%', bg: 'bg-orange-500' },
      { label: 'L2 Primary Consumers (Grasshopper / Rabbit)', val: measurements.primary_consumers_kcal, w: '80%', bg: 'bg-emerald-500' },
      { label: 'L1 Primary Producers (Grass / Plants)', val: measurements.producers_kcal, w: '100%', bg: 'bg-green-600' },
    ];
    return (
      <div className="lab-card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            Food Web &amp; Trophic Energy Pyramid (η = {params.transfer_efficiency}%)
          </h3>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
            Heat lost / step: {measurements.heat_loss_per_step_pct}%
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          {tiers.map((tier) => (
            <div
              key={tier.label}
              className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-xs font-extrabold text-white shadow-sm ${tier.bg}`}
              style={{ width: tier.w }}
            >
              <span>{tier.label}</span>
              <span className="font-mono">{tier.val} kcal</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 9 & 10. Natural Selection & Population Genetics — Live Organism Population Dot Field
  const pFreq = Number(measurements.final_p ?? measurements.p ?? 0.5);
  const qFreq = 1 - pFreq;
  const nDots = 40;
  const nAA = Math.round(pFreq * pFreq * nDots);
  const nAa = Math.round(2 * pFreq * qFreq * nDots);
  return (
    <div className="lab-card p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            Interactive Population Genetics Field (40 Sample Organisms)
          </h3>
          <p className="text-xs text-slate-500">
            {measurements.selection_regime || `Hardy-Weinberg Distribution (p = ${pFreq.toFixed(2)}, q = ${qFreq.toFixed(2)})`}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold">
          <span className="inline-flex items-center gap-1 text-emerald-700"><span className="h-2.5 w-2.5 rounded-full bg-emerald-600" /> AA ({nAA})</span>
          <span className="inline-flex items-center gap-1 text-blue-700"><span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Aa ({nAa})</span>
          <span className="inline-flex items-center gap-1 text-amber-700"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> aa ({Math.max(0, nDots - nAA - nAa)})</span>
        </div>
      </div>
      <div className="grid grid-cols-10 gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 dark:border-navy-800 dark:bg-navy-950">
        {Array.from({ length: nDots }, (_, i) => {
          const geno = i < nAA ? 'AA' : i < nAA + nAa ? 'Aa' : 'aa';
          const bg = geno === 'AA' ? 'bg-emerald-600 text-white' : geno === 'Aa' ? 'bg-sky-500 text-white' : 'bg-amber-400 text-slate-900';
          return (
            <div key={i} className={`flex h-7 w-7 items-center justify-center rounded-full font-mono text-[10px] font-extrabold shadow-sm ${bg}`}>
              {geno}
            </div>
          );
        })}
      </div>
    </div>
  );
}
