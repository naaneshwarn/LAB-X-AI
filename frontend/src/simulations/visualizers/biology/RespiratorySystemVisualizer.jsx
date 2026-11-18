import React, { useEffect, useMemo, useState } from 'react';
import { Bot, Box, Layers, Minus, Pause, Play, Plus, RotateCcw, Wind } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { RESPIRATORY_ORGANS } from '../../engines/biology';
import Lightweight3DCanvas from '../../../components/Lightweight3DCanvas';

const LEARNING_TABS = [
  { id: 'mechanics', label: 'Inhalation & Exhalation' },
  { id: 'alveoli', label: 'Alveolar Gas Exchange' },
  { id: 'rates', label: 'Normal Breathing Rates' },
  { id: 'check', label: 'Quick Check' },
];

export default function RespiratorySystemVisualizer({
  params,
  measurements,
  onParamChange,
  onAskTutor,
}) {
  const { lowPowerMode, reducedMotion } = useApp();
  const [viewMode, setViewMode] = useState(lowPowerMode ? '2d' : '2d');
  const [playing, setPlaying] = useState(!reducedMotion);
  const [phase, setPhase] = useState(0); // 0..1 breath cycle
  const [learnTab, setLearnTab] = useState('mechanics');
  const [quizChoice, setQuizChoice] = useState(null);

  const breathingRate = Number(params.breathing_rate ?? 16);
  const selectedIdx = Math.max(
    0,
    Math.min(RESPIRATORY_ORGANS.length - 1, Math.round(Number(params.organ_index ?? 8)))
  );
  const selectedOrgan = RESPIRATORY_ORGANS[selectedIdx];

  useEffect(() => {
    if (lowPowerMode) setViewMode('2d');
  }, [lowPowerMode]);

  useEffect(() => {
    if (!playing) return undefined;
    let rafId;
    let last = performance.now();
    const step = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const cyclesPerSec = breathingRate / 60;
      setPhase((p) => (p + dt * cyclesPerSec) % 1);
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [playing, breathingRate]);

  // Smooth inhalation (0 -> 0.45) and exhalation (0.45 -> 1.0)
  const inhaleAmount = 0.5 * (1 - Math.cos(2 * Math.PI * phase)); // 0 (empty) to 1 (full)
  const isInhaling = phase < 0.5;
  const lungScaleX = 1 + inhaleAmount * 0.12;
  const lungScaleY = 1 + inhaleAmount * 0.08;
  // Diaphragm flattens downward (+y) during inhalation, domes upward (-y) during exhalation
  const diaphragmCurveY = 278 + inhaleAmount * 20;

  const selectOrgan = (idx) => {
    onParamChange?.('organ_index', idx);
  };

  // 3D Orbit Model Data
  const model3D = useMemo(() => {
    const expand = inhaleAmount * 7;
    const diaY = 82 + inhaleAmount * 14;
    const nodes = [
      { id: 0, x: 0, y: -124, z: 24, rx: 12, ry: 9, color: '#fb923c', highlight: '#fed7aa', shadow: '#c2410c', label: 'Nose' },
      { id: 1, x: 0, y: -106, z: 22, rx: 13, ry: 7, color: '#f43f5e', highlight: '#fda4af', shadow: '#9f1239', label: 'Mouth' },
      { id: 2, x: 0, y: -96, z: 0, rx: 11, ry: 12, color: '#f97316', highlight: '#fdba74', shadow: '#9a3412', label: 'Pharynx' },
      { id: 3, x: 0, y: -74, z: 4, rx: 13, ry: 10, color: '#a855f7', highlight: '#d8b4fe', shadow: '#6b21a8', label: 'Larynx' },
      { id: 4, x: 0, y: -42, z: 2, rx: 10, ry: 26, color: '#38bdf8', highlight: '#bae6fd', shadow: '#0369a1', label: 'Trachea' },
      { id: 5, x: -24, y: -10, z: 2, rx: 16, ry: 8, color: '#0ea5e9', highlight: '#7dd3fc', shadow: '#0369a1', label: 'Bronchi' },
      { id: 6, x: 30, y: -8, z: 4, rx: 15, ry: 8, color: '#0284c7', highlight: '#7dd3fc', shadow: '#075985', label: 'Bronchioles' },
      { id: 7, x: -46 - expand * 0.4, y: 18, z: 0, rx: 34 + expand, ry: 56 + expand * 0.7, color: '#fb7185', highlight: '#fecdd3', shadow: '#be123c', label: 'Right Lung', opacity: 0.85 },
      { id: 7, x: 46 + expand * 0.4, y: 18, z: 0, rx: 32 + expand, ry: 54 + expand * 0.7, color: '#fb7185', highlight: '#fecdd3', shadow: '#be123c', label: 'Left Lung', opacity: 0.85 },
      { id: 8, x: 52 + expand * 0.4, y: 40, z: 24, rx: 15, ry: 15, color: '#facc15', highlight: '#fef08a', shadow: '#a16207', label: 'Alveoli' },
      { id: 9, x: 0, y: diaY, z: 0, rx: 82, ry: 12, color: '#ef4444', highlight: '#fca5a5', shadow: '#991b1b', label: 'Diaphragm' },
    ];
    const tubes = [
      { id: 4, x1: 0, y1: -72, z1: 2, x2: 0, y2: -14, z2: 2, radius: 11, color: '#7dd3fc' },
      { id: 5, x1: 0, y1: -14, z1: 2, x2: -40, y2: 6, z2: 0, radius: 8, color: '#38bdf8' },
      { id: 5, x1: 0, y1: -14, z1: 2, x2: 40, y2: 6, z2: 0, radius: 8, color: '#38bdf8' },
    ];
    const pT = isInhaling ? phase * 2 : (1 - phase) * 2;
    const particles = [0, 0.25, 0.5, 0.75].map((off) => {
      const f = (pT + off) % 1;
      const y = -118 + f * 140;
      const x = y > -14 ? ((off * 4) % 2 === 0 ? -1 : 1) * ((y + 14) * 0.65) : 0;
      return {
        x,
        y,
        z: 10,
        r: 4.5,
        color: isInhaling ? '#0ea5e9' : '#f97316',
      };
    });
    return { nodes, tubes, particles };
  }, [inhaleAmount, isInhaling, phase]);

  // Gas flow dots for 2D SVG
  const flowDots = [0, 0.22, 0.44, 0.66, 0.88].map((offset) => {
    const progress = isInhaling ? (phase * 2 + offset) % 1 : 1 - (((phase - 0.5) * 2 + offset) % 1);
    const y = 52 + progress * 150;
    const branch = offset > 0.4 ? 1 : -1;
    const x = y < 145 ? 180 : 180 + branch * (y - 145) * 0.95;
    return { x, y, color: isInhaling ? '#38bdf8' : '#fb923c' };
  });

  return (
    <div className="lab-card overflow-hidden p-4 sm:p-5">
      {/* Header Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300">
              <Wind className="h-4 w-4" />
            </span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Interactive Human Respiratory System
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Click any organ to highlight it · Watch lungs &amp; diaphragm move together
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Phase Indicator */}
          <span
            className={`rounded-full px-3 py-1 text-xs font-extrabold ${
              isInhaling
                ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200'
                : 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200'
            }`}
          >
            {isInhaling ? '↓ Inhaling (O₂ In)' : '↑ Exhaling (CO₂ Out)'}
          </span>

          {/* Play / Pause */}
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="lab-btn-primary px-3 py-1.5 text-xs"
            aria-label={playing ? 'Pause breathing animation' : 'Start breathing animation'}
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {playing ? 'Pause' : 'Start Breathing'}
          </button>

          {/* Quick Rate − / + */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 dark:border-navy-700 dark:bg-navy-950">
            <button
              type="button"
              onClick={() => onParamChange?.('breathing_rate', Math.max(6, breathingRate - 2))}
              className="rounded-lg p-1 text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-navy-800"
              aria-label="Decrease breathing rate"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="px-2 font-mono text-xs font-bold text-slate-800 dark:text-slate-100">
              {breathingRate} bpm
            </span>
            <button
              type="button"
              onClick={() => onParamChange?.('breathing_rate', Math.min(40, breathingRate + 2))}
              className="rounded-lg p-1 text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-navy-800"
              aria-label="Increase breathing rate"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* 2D / 3D Switch */}
          <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 dark:border-navy-700 dark:bg-navy-950">
            <button
              type="button"
              onClick={() => setViewMode('2d')}
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold ${
                viewMode === '2d'
                  ? 'bg-white text-blue-700 shadow-sm dark:bg-navy-800 dark:text-sky-300'
                  : 'text-slate-500'
              }`}
            >
              <Layers className="h-3 w-3" /> 2D Anatomy
            </button>
            <button
              type="button"
              onClick={() => setViewMode('3d')}
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold ${
                viewMode === '3d'
                  ? 'bg-white text-blue-700 shadow-sm dark:bg-navy-800 dark:text-sky-300'
                  : 'text-slate-500'
              }`}
            >
              <Box className="h-3 w-3" /> 3D Orbit
            </button>
          </div>
        </div>
      </div>

      {/* Main Anatomical View + Alveoli Magnifier */}
      {viewMode === '3d' ? (
        <Lightweight3DCanvas
          nodes={model3D.nodes}
          tubes={model3D.tubes}
          particles={model3D.particles}
          selectedId={selectedIdx}
          onSelect={selectOrgan}
          bgColor="#fff1f2"
          hintText="Drag to orbit 3D respiratory tract · Blue dots = O₂ entering, Orange dots = CO₂ exiting"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-12">
          {/* Anatomically Recognizable Human Torso SVG */}
          <div className="md:col-span-7">
            <svg
              viewBox="0 0 360 345"
              className="w-full rounded-2xl border border-sky-100 bg-gradient-to-b from-sky-50 via-white to-rose-50/40 dark:border-navy-800 dark:from-navy-950 dark:to-navy-900"
              role="img"
              aria-label="Interactive Human Respiratory System Anatomy"
            >
              {/* Human Head, Neck, Shoulders & Torso Outline */}
              <path
                d="M145,12 C145,4 215,4 215,12 C226,18 228,42 222,60 C220,68 212,76 205,82 L205,100 C248,108 288,125 298,165 L304,335 L56,335 L62,165 C72,125 112,108 155,100 L155,82 C148,76 140,68 138,60 C132,42 134,18 145,12 Z"
                fill="#fde6d8"
                fillOpacity="0.65"
                stroke="#cbd5e1"
                strokeWidth="2"
              />
              {/* Subtle Ribcage Guides */}
              {[155, 180, 205, 230, 255].map((ry) => (
                <path
                  key={ry}
                  d={`M98,${ry} Q180,${ry + 12} 262,${ry}`}
                  fill="none"
                  stroke="#94a3b8"
                  strokeOpacity="0.22"
                  strokeWidth="3"
                />
              ))}

              {/* 0: Nose & Nasal Cavity */}
              <g className="cursor-pointer" onClick={() => selectOrgan(0)}>
                <path
                  d="M168,36 Q180,26 196,36 Q200,48 186,52 L170,50 Z"
                  fill={selectedIdx === 0 ? '#facc15' : '#fb923c'}
                  stroke={selectedIdx === 0 ? '#1e293b' : '#c2410c'}
                  strokeWidth={selectedIdx === 0 ? 2.5 : 1.2}
                />
                <text x="206" y="42" fontSize="9" fontWeight="700" fill="#1e293b">Nose/Nasal Cavity</text>
              </g>

              {/* 1: Mouth */}
              <g className="cursor-pointer" onClick={() => selectOrgan(1)}>
                <ellipse
                  cx="180"
                  cy="61"
                  rx="13"
                  ry="6"
                  fill={selectedIdx === 1 ? '#facc15' : '#fb7185'}
                  stroke={selectedIdx === 1 ? '#1e293b' : '#be123c'}
                  strokeWidth={selectedIdx === 1 ? 2.5 : 1.2}
                />
                <text x="115" y="64" fontSize="9" fontWeight="700" fill="#1e293b">Mouth</text>
              </g>

              {/* 2: Pharynx */}
              <g className="cursor-pointer" onClick={() => selectOrgan(2)}>
                <rect
                  x="173"
                  y="66"
                  width="14"
                  height="22"
                  rx="6"
                  fill={selectedIdx === 2 ? '#facc15' : '#fdba74'}
                  stroke={selectedIdx === 2 ? '#1e293b' : '#ea580c'}
                  strokeWidth={selectedIdx === 2 ? 2.2 : 1.2}
                />
                <text x="202" y="80" fontSize="9" fontWeight="700" fill="#1e293b">Pharynx</text>
              </g>

              {/* 3: Larynx */}
              <g className="cursor-pointer" onClick={() => selectOrgan(3)}>
                <rect
                  x="171"
                  y="88"
                  width="18"
                  height="15"
                  rx="5"
                  fill={selectedIdx === 3 ? '#facc15' : '#c084fc'}
                  stroke={selectedIdx === 3 ? '#1e293b' : '#7e22ce'}
                  strokeWidth={selectedIdx === 3 ? 2.2 : 1.2}
                />
                <text x="116" y="99" fontSize="9" fontWeight="700" fill="#1e293b">Larynx</text>
              </g>

              {/* 4: Trachea with C-shaped cartilage rings */}
              <g className="cursor-pointer" onClick={() => selectOrgan(4)}>
                <rect
                  x="173"
                  y="103"
                  width="14"
                  height="48"
                  rx="4"
                  fill={selectedIdx === 4 ? '#facc15' : '#7dd3fc'}
                  stroke={selectedIdx === 4 ? '#1e293b' : '#0284c7'}
                  strokeWidth={selectedIdx === 4 ? 2.2 : 1.4}
                />
                {[110, 118, 126, 134, 142].map((y) => (
                  <line key={y} x1="174" y1={y} x2="186" y2={y} stroke="#0369a1" strokeWidth="1.5" />
                ))}
                <text x="198" y="128" fontSize="9" fontWeight="700" fill="#0369a1">Trachea</text>
              </g>

              {/* 7: Right & Left Lungs (Animated expansion/contraction) */}
              <g
                transform={`translate(180, 205) scale(${lungScaleX}, ${lungScaleY}) translate(-180, -205)`}
                className="cursor-pointer"
                onClick={() => selectOrgan(7)}
              >
                {/* Right Lung (3 lobes - viewer's left) */}
                <path
                  d="M168,144 C135,142 104,170 98,215 C94,248 106,272 135,270 C156,268 168,255 168,236 Z"
                  fill={selectedIdx === 7 ? '#fde047' : '#fda4af'}
                  fillOpacity="0.88"
                  stroke={selectedIdx === 7 ? '#1e293b' : '#e11d48'}
                  strokeWidth={selectedIdx === 7 ? 3 : 2}
                />
                {/* Left Lung (2 lobes with cardiac notch - viewer's right) */}
                <path
                  d="M192,144 C225,142 256,170 262,215 C266,248 252,272 224,268 C206,265 198,250 202,235 C195,222 192,202 192,188 Z"
                  fill={selectedIdx === 7 ? '#fde047' : '#fda4af'}
                  fillOpacity="0.88"
                  stroke={selectedIdx === 7 ? '#1e293b' : '#e11d48'}
                  strokeWidth={selectedIdx === 7 ? 3 : 2}
                />

                {/* 5: Right & Left Bronchi */}
                <g onClick={(e) => { e.stopPropagation(); selectOrgan(5); }}>
                  <path
                    d="M178,148 L145,172 M182,148 L215,172"
                    fill="none"
                    stroke={selectedIdx === 5 ? '#facc15' : '#0284c7'}
                    strokeWidth={selectedIdx === 5 ? 8 : 6}
                    strokeLinecap="round"
                  />
                </g>

                {/* 6: Bronchioles Tree */}
                <g onClick={(e) => { e.stopPropagation(); selectOrgan(6); }}>
                  <path
                    d="M145,172 L125,190 M145,172 L148,205 M145,172 L120,218 M215,172 L236,192 M215,172 L214,208 M215,172 L240,222"
                    fill="none"
                    stroke={selectedIdx === 6 ? '#facc15' : '#0369a1'}
                    strokeWidth={selectedIdx === 6 ? 4.5 : 3}
                    strokeLinecap="round"
                  />
                </g>

                {/* 8: Alveoli Clusters */}
                <g onClick={(e) => { e.stopPropagation(); selectOrgan(8); }}>
                  {[
                    [119, 193], [125, 198], [116, 222], [148, 211],
                    [239, 195], [244, 224], [216, 214], [234, 232],
                  ].map(([cx, cy], i) => (
                    <circle
                      key={i}
                      cx={cx}
                      cy={cy}
                      r={4.5 + inhaleAmount * 1.4}
                      fill={selectedIdx === 8 ? '#facc15' : '#fef08a'}
                      stroke={selectedIdx === 8 ? '#1e293b' : '#ca8a04'}
                      strokeWidth="1.3"
                    />
                  ))}
                </g>
              </g>

              {/* 9: Synchronized Diaphragm Dome */}
              <g className="cursor-pointer" onClick={() => selectOrgan(9)}>
                <path
                  d={`M90,295 Q180,${diaphragmCurveY - 26} 270,295 Q180,${diaphragmCurveY - 12} 90,295 Z`}
                  fill={selectedIdx === 9 ? '#facc15' : '#ef4444'}
                  stroke={selectedIdx === 9 ? '#1e293b' : '#991b1b'}
                  strokeWidth={selectedIdx === 9 ? 2.5 : 1.5}
                />
                <text x="180" y="316" textAnchor="middle" fontSize="10" fontWeight="800" fill="#991b1b">
                  Diaphragm ({isInhaling ? 'Contracting ↓' : 'Relaxing ↑'})
                </text>
              </g>

              {/* Animated O2 / CO2 Airflow Particles */}
              {flowDots.map((dot, idx) => (
                <circle key={idx} cx={dot.x} cy={dot.y} r="4" fill={dot.color} stroke="#fff" strokeWidth="1" />
              ))}

              {/* Legend */}
              <g transform="translate(12, 16)">
                <circle cx="6" cy="6" r="4" fill="#38bdf8" />
                <text x="14" y="9" fontSize="8.5" fontWeight="700" fill="#0369a1">O₂ In</text>
                <circle cx="6" cy="20" r="4" fill="#fb923c" />
                <text x="14" y="23" fontSize="8.5" fontWeight="700" fill="#c2410c">CO₂ Out</text>
              </g>
            </svg>
          </div>

          {/* Right Panel: Alveolar Gas Exchange Inset + Selected Organ Inspector */}
          <div className="flex flex-col gap-3 md:col-span-5">
            {/* Magnified Alveolus Gas Exchange Diagram */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900/60 dark:bg-amber-950/20">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-900 dark:text-amber-200">
                  Alveolus Gas Exchange (Zoomed)
                </span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-navy-900 dark:text-slate-300">
                  Diffusion
                </span>
              </div>
              <svg viewBox="0 0 240 120" className="w-full rounded-xl bg-white dark:bg-navy-950">
                {/* Alveolar Air Sac */}
                <circle
                  cx="118"
                  cy="54"
                  r={34 + inhaleAmount * 4}
                  fill="#fef9c3"
                  stroke="#eab308"
                  strokeWidth="2.5"
                />
                <text x="118" y="48" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#854d0e">Alveolar Air</text>
                <text x="118" y="61" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#0284c7">High O₂</text>
                {/* Pulmonary Capillary Wrapping Around */}
                <path
                  d="M14,96 Q118,112 226,96"
                  fill="none"
                  stroke="url(#capGrad)"
                  strokeWidth="14"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="50%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
                {/* O2 Arrow Down into Blood */}
                <path d="M138,76 L138,94" stroke="#0ea5e9" strokeWidth="2.5" markerEnd="url(#arrO2)" />
                <text x="148" y="86" fontSize="8.5" fontWeight="800" fill="#0284c7">O₂ → Blood</text>
                {/* CO2 Arrow Up into Alveolus */}
                <path d="M96,94 L96,76" stroke="#f97316" strokeWidth="2.5" />
                <text x="36" y="86" fontSize="8.5" fontWeight="800" fill="#c2410c">CO₂ ↑ Air</text>
                <text x="20" y="114" fontSize="8" fontWeight="700" fill="#1d4ed8">Deoxygenated</text>
                <text x="166" y="114" fontSize="8" fontWeight="700" fill="#dc2626">Oxygenated</text>
              </svg>
            </div>

            {/* Selected Organ Card */}
            <div className="flex-1 rounded-2xl border border-sky-200 bg-sky-50/70 p-3.5 dark:border-blue-900 dark:bg-blue-950/30">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-sky-300">
                  Selected Organ ({selectedIdx + 1}/10)
                </span>
                {onAskTutor && (
                  <button
                    type="button"
                    onClick={() =>
                      onAskTutor(
                        `What happens in the ${selectedOrgan.name} during breathing?`,
                        { selected_structure: selectedOrgan.name, organ_role: selectedOrgan.role }
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-blue-700"
                  >
                    <Bot className="h-3 w-3" /> Ask AI Tutor
                  </button>
                )}
              </div>
              <h4 className="mt-1.5 text-base font-extrabold text-slate-900 dark:text-white">
                {selectedOrgan.name}
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                {selectedOrgan.role}
              </p>
              <div className="mt-3 rounded-xl bg-white/90 px-3 py-2 text-[11px] font-semibold text-slate-700 dark:bg-navy-900 dark:text-slate-200">
                <span className="text-emerald-600 dark:text-emerald-400">Age Context: </span>
                {measurements.rate_status}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clickable 10-Organ Selector Pills */}
      <div className="mt-4">
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Select Any Respiratory Structure to Highlight:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {RESPIRATORY_ORGANS.map((org, idx) => (
            <button
              key={org.id}
              type="button"
              onClick={() => selectOrgan(idx)}
              className={`rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                idx === selectedIdx
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-rose-50 dark:border-navy-700 dark:bg-navy-950 dark:text-slate-300'
              }`}
            >
              {org.name}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Learning Mode Sub-Panel */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-navy-800 dark:bg-navy-950/60">
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {LEARNING_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setLearnTab(tab.id)}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                learnTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-sky-50 dark:bg-navy-900 dark:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {learnTab === 'mechanics' && (
          <div className="grid gap-2.5 text-xs sm:grid-cols-2">
            <div className="rounded-xl bg-sky-50 p-3 text-slate-700 dark:bg-sky-950/40 dark:text-slate-200">
              <p className="font-extrabold text-sky-900 dark:text-sky-200">Inhalation (Breathing In)</p>
              <p className="mt-1">Diaphragm contracts &amp; moves down, ribcage lifts up and out, chest volume rises, air pressure drops, and O₂-rich air rushes into the lungs.</p>
            </div>
            <div className="rounded-xl bg-orange-50 p-3 text-slate-700 dark:bg-orange-950/40 dark:text-slate-200">
              <p className="font-extrabold text-orange-900 dark:text-orange-200">Exhalation (Breathing Out)</p>
              <p className="mt-1">Diaphragm relaxes upward into a dome, elastic lungs recoil, chest volume decreases, and CO₂-rich air flows out through the bronchi and trachea.</p>
            </div>
          </div>
        )}

        {learnTab === 'alveoli' && (
          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">
            Alveoli provide a huge, moist, one-cell-thick surface area surrounded by pulmonary capillaries. Oxygen (O₂) diffuses from high concentration in alveolar air into blood hemoglobin, while carbon dioxide (CO₂) diffuses from blood into alveolar air to be exhaled.
          </p>
        )}

        {learnTab === 'rates' && (
          <div className="grid gap-2 text-xs sm:grid-cols-3">
            <div className="rounded-xl bg-white p-2.5 dark:bg-navy-900">
              <p className="font-extrabold text-blue-700 dark:text-sky-300">Children (6–12 yrs)</p>
              <p className="mt-0.5 font-mono font-bold">18–30 breaths/min</p>
            </div>
            <div className="rounded-xl bg-white p-2.5 dark:bg-navy-900">
              <p className="font-extrabold text-emerald-700 dark:text-emerald-300">Teens (13–17 yrs)</p>
              <p className="mt-0.5 font-mono font-bold">12–20 breaths/min</p>
            </div>
            <div className="rounded-xl bg-white p-2.5 dark:bg-navy-900">
              <p className="font-extrabold text-violet-700 dark:text-violet-300">Adults (18+ yrs)</p>
              <p className="mt-0.5 font-mono font-bold">12–20 breaths/min</p>
            </div>
          </div>
        )}

        {learnTab === 'check' && (
          <div className="space-y-2 text-xs">
            <p className="font-bold text-slate-800 dark:text-slate-100">
              Quick Check: Which structure exchanges O₂ and CO₂ with blood capillaries?
            </p>
            <div className="flex flex-wrap gap-2">
              {['Trachea', 'Alveoli', 'Larynx', 'Diaphragm'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setQuizChoice(opt)}
                  className={`rounded-lg border px-3 py-1 font-bold ${
                    quizChoice === opt
                      ? opt === 'Alveoli'
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-rose-500 bg-rose-500 text-white'
                      : 'border-slate-200 bg-white text-slate-700 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-200'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {quizChoice && (
              <p className={`font-bold ${quizChoice === 'Alveoli' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>
                {quizChoice === 'Alveoli'
                  ? 'Correct! Millions of thin-walled alveoli exchange O₂ into blood and CO₂ out of blood.'
                  : 'Try again — look at the zoomed Alveolus Gas Exchange diagram above!'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
