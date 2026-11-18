import React, { useEffect, useState } from 'react';
import { Bot, HeartPulse, Minus, Pause, Play, Plus } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

const CIRCULATORY_PARTS = [
  { id: 'ra', name: 'Right Atrium', blood: 'Deoxygenated', role: 'Upper right chamber receiving oxygen-poor blood returning from the body via the Superior & Inferior Vena Cava.' },
  { id: 'rv', name: 'Right Ventricle', blood: 'Deoxygenated', role: 'Lower right muscular chamber pumping oxygen-poor blood through the Pulmonary Artery to the lungs.' },
  { id: 'la', name: 'Left Atrium', blood: 'Oxygenated', role: 'Upper left chamber receiving freshly oxygenated blood returning from the lungs via the Pulmonary Veins.' },
  { id: 'lv', name: 'Left Ventricle', blood: 'Oxygenated', role: 'Thickest, strongest chamber pumping oxygen-rich blood into the Aorta to supply the entire body.' },
  { id: 'aorta', name: 'Aorta', blood: 'Oxygenated', role: 'Largest artery in the body carrying high-pressure oxygen-rich blood from the left ventricle to systemic arteries.' },
  { id: 'vena-cava', name: 'Vena Cava', blood: 'Deoxygenated', role: 'Large systemic veins (Superior & Inferior) returning oxygen-poor blood from body tissues back to the right atrium.' },
  { id: 'pulm-art', name: 'Pulmonary Arteries', blood: 'Deoxygenated', role: 'Carry oxygen-poor blood away from the right ventricle to the lungs for gas exchange.' },
  { id: 'pulm-vein', name: 'Pulmonary Veins', blood: 'Oxygenated', role: 'Carry oxygen-rich blood from the lungs back into the left atrium of the heart.' },
  { id: 'capillaries', name: 'Body & Lung Capillaries', blood: 'Gas Exchange', role: 'Microscopic one-cell-thick blood vessels where O₂ and nutrients diffuse into tissues and CO₂ enters blood.' },
];

// Double circulation loop waypoints (Pulmonary top + Systemic bottom)
const PULMONARY_DEOX = [
  [180, 178], [150, 145], [140, 88], [185, 56],
];
const PULMONARY_OX = [
  [215, 56], [260, 88], [250, 145], [220, 152],
];
const SYSTEMIC_OX = [
  [222, 182], [248, 128], [295, 165], [305, 255], [225, 286],
];
const SYSTEMIC_DEOX = [
  [175, 286], [95, 255], [105, 165], [150, 152], [178, 152],
];

function samplePath(pts, t) {
  const totalSegs = pts.length - 1;
  const scaled = Math.max(0, Math.min(totalSegs - 0.0001, t * totalSegs));
  const i = Math.floor(scaled);
  const f = scaled - i;
  return {
    x: pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f,
    y: pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f,
  };
}

export default function CirculatorySystemVisualizer({
  params,
  measurements,
  onParamChange,
  onAskTutor,
}) {
  const { reducedMotion } = useApp();
  const [playing, setPlaying] = useState(!reducedMotion);
  const [beatPhase, setBeatPhase] = useState(0);
  const [flowPhase, setFlowPhase] = useState(0);
  const [selectedId, setSelectedId] = useState('lv');
  const [circuitFilter, setCircuitFilter] = useState('both'); // 'both' | 'pulmonary' | 'systemic'

  const heartRate = Number(params.heart_rate ?? 72);
  const selected = CIRCULATORY_PARTS.find((p) => p.id === selectedId) || CIRCULATORY_PARTS[3];

  useEffect(() => {
    if (!playing) return undefined;
    let rafId;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const bps = heartRate / 60;
      setBeatPhase((p) => (p + dt * bps) % 1);
      setFlowPhase((p) => (p + dt * bps * 0.35) % 1);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [playing, heartRate]);

  // Lub-dub systolic contraction pulse
  const pulse = beatPhase < 0.2 ? Math.sin((beatPhase / 0.2) * Math.PI) : 0;
  const heartScale = 1 + pulse * 0.065;

  const renderCells = (pts, color, offsetBase = 0) =>
    [0, 0.33, 0.66].map((off, idx) => {
      const pos = samplePath(pts, (flowPhase + off + offsetBase) % 1);
      return (
        <circle
          key={idx}
          cx={pos.x}
          cy={pos.y}
          r="5"
          fill={color}
          stroke="#ffffff"
          strokeWidth="1.5"
        />
      );
    });

  return (
    <div className="lab-card p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300">
              <HeartPulse className="h-4 w-4" />
            </span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Interactive Human Circulatory System &amp; 4-Chamber Heart
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Click any heart chamber or blood vessel · Adjust heart rate to observe cardiac output
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="lab-btn-primary px-3 py-1.5 text-xs"
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {playing ? 'Pause Beat' : 'Start Beat'}
          </button>

          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 dark:border-navy-700 dark:bg-navy-950">
            <button
              type="button"
              onClick={() => onParamChange?.('heart_rate', Math.max(40, heartRate - 5))}
              className="rounded-lg p-1 text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-navy-800"
              aria-label="Decrease heart rate"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="px-2 font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
              {heartRate} BPM
            </span>
            <button
              type="button"
              onClick={() => onParamChange?.('heart_rate', Math.min(180, heartRate + 5))}
              className="rounded-lg p-1 text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-navy-800"
              aria-label="Increase heart rate"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Circulation Focus Filter */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1.5">
          {[
            { id: 'both', label: 'Double Circulation' },
            { id: 'pulmonary', label: 'Pulmonary Loop (Lungs)' },
            { id: 'systemic', label: 'Systemic Loop (Body)' },
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setCircuitFilter(mode.id)}
              className={`rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                circuitFilter === mode.id
                  ? 'bg-rose-500 text-white'
                  : 'border border-slate-200 bg-slate-50 text-slate-600 dark:border-navy-700 dark:bg-navy-950 dark:text-slate-300'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Scientific Color Legend */}
        <div className="flex items-center gap-3 text-[11px] font-bold">
          <span className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Oxygen-Rich Blood
          </span>
          <span className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600" /> Oxygen-Poor Blood
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-12">
        <div className="md:col-span-7">
          <svg
            viewBox="0 0 400 325"
            className="w-full rounded-2xl border border-rose-100 bg-gradient-to-b from-sky-50/50 via-white to-rose-50/40 dark:border-navy-800 dark:from-navy-950 dark:to-navy-900"
            role="img"
            aria-label="Interactive Double Circulation & 4-Chamber Heart Diagram"
          >
            {/* Pulmonary Capillaries (Lungs at top) */}
            <g
              className="cursor-pointer"
              opacity={circuitFilter === 'systemic' ? 0.25 : 1}
              onClick={() => setSelectedId('capillaries')}
            >
              <rect
                x="130"
                y="26"
                width="140"
                height="46"
                rx="22"
                fill="#fce7f3"
                stroke={selectedId === 'capillaries' ? '#facc15' : '#f472b6'}
                strokeWidth="2.5"
              />
              <text x="200" y="47" textAnchor="middle" fontSize="10" fontWeight="800" fill="#9d174d">
                Lungs (Pulmonary Capillaries)
              </text>
              <text x="200" y="61" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#be185d">
                CO₂ Out · O₂ Picked Up
              </text>
            </g>

            {/* Pulmonary Artery (Right Ventricle -> Lungs, Blue) */}
            <path
              d="M180,178 C150,145 140,88 185,56"
              fill="none"
              stroke={selectedId === 'pulm-art' ? '#facc15' : '#2563eb'}
              strokeWidth="10"
              strokeLinecap="round"
              opacity={circuitFilter === 'systemic' ? 0.2 : 0.9}
              className="cursor-pointer"
              onClick={() => setSelectedId('pulm-art')}
            />
            <text x="64" y="96" fontSize="8.5" fontWeight="700" fill="#1d4ed8">Pulmonary Artery</text>

            {/* Pulmonary Vein (Lungs -> Left Atrium, Red) */}
            <path
              d="M215,56 C260,88 250,145 220,152"
              fill="none"
              stroke={selectedId === 'pulm-vein' ? '#facc15' : '#ef4444'}
              strokeWidth="10"
              strokeLinecap="round"
              opacity={circuitFilter === 'systemic' ? 0.2 : 0.9}
              className="cursor-pointer"
              onClick={() => setSelectedId('pulm-vein')}
            />
            <text x="268" y="96" fontSize="8.5" fontWeight="700" fill="#dc2626">Pulmonary Vein</text>

            {/* Systemic Aorta & Arteries (Left Ventricle -> Body, Red) */}
            <path
              d="M222,182 C248,128 295,165 305,255 C305,278 265,286 225,286"
              fill="none"
              stroke={selectedId === 'aorta' ? '#facc15' : '#ef4444'}
              strokeWidth="11"
              strokeLinecap="round"
              opacity={circuitFilter === 'pulmonary' ? 0.2 : 0.9}
              className="cursor-pointer"
              onClick={() => setSelectedId('aorta')}
            />
            <text x="312" y="198" fontSize="9" fontWeight="800" fill="#dc2626">Aorta &amp;</text>
            <text x="312" y="210" fontSize="9" fontWeight="800" fill="#dc2626">Arteries</text>

            {/* Systemic Vena Cava & Veins (Body -> Right Atrium, Blue) */}
            <path
              d="M175,286 C135,286 95,278 95,255 C105,165 148,152 178,152"
              fill="none"
              stroke={selectedId === 'vena-cava' ? '#facc15' : '#2563eb'}
              strokeWidth="11"
              strokeLinecap="round"
              opacity={circuitFilter === 'pulmonary' ? 0.2 : 0.9}
              className="cursor-pointer"
              onClick={() => setSelectedId('vena-cava')}
            />
            <text x="22" y="198" fontSize="9" fontWeight="800" fill="#1d4ed8">Vena Cava</text>
            <text x="22" y="210" fontSize="9" fontWeight="800" fill="#1d4ed8">&amp; Veins</text>

            {/* Systemic Body Capillaries (Bottom) */}
            <g
              className="cursor-pointer"
              opacity={circuitFilter === 'pulmonary' ? 0.25 : 1}
              onClick={() => setSelectedId('capillaries')}
            >
              <rect
                x="130"
                y="264"
                width="140"
                height="44"
                rx="20"
                fill="#e0f2fe"
                stroke={selectedId === 'capillaries' ? '#facc15' : '#0284c7'}
                strokeWidth="2.5"
              />
              <text x="200" y="284" textAnchor="middle" fontSize="10" fontWeight="800" fill="#0c4a6e">
                Body Tissues (Capillaries)
              </text>
              <text x="200" y="297" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#0369a1">
                O₂ Delivered · CO₂ Collected
              </text>
            </g>

            {/* 4-Chamber Pulsing Heart */}
            <g transform={`translate(200, 174) scale(${heartScale}) translate(-200, -174)`}>
              {/* Outer Myocardium */}
              <path
                d="M200,128 C176,112 146,126 146,158 C146,192 178,214 200,228 C222,214 254,192 254,158 C254,126 224,112 200,128 Z"
                fill="#fff1f2"
                stroke="#be123c"
                strokeWidth="3"
              />
              {/* Right Atrium (top-left of diagram) */}
              <rect
                x="156"
                y="138"
                width="40"
                height="30"
                rx="8"
                fill={selectedId === 'ra' ? '#facc15' : '#3b82f6'}
                stroke="#1e3a8a"
                strokeWidth="1.5"
                className="cursor-pointer"
                onClick={() => setSelectedId('ra')}
              />
              <text x="176" y="156" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#fff" className="pointer-events-none">RA</text>

              {/* Right Ventricle (bottom-left of diagram) */}
              <path
                d="M156,172 L196,172 L196,216 C174,206 158,192 156,172 Z"
                fill={selectedId === 'rv' ? '#facc15' : '#1d4ed8'}
                stroke="#1e3a8a"
                strokeWidth="1.5"
                className="cursor-pointer"
                onClick={() => setSelectedId('rv')}
              />
              <text x="179" y="191" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#fff" className="pointer-events-none">RV</text>

              {/* Left Atrium (top-right of diagram) */}
              <rect
                x="204"
                y="138"
                width="40"
                height="30"
                rx="8"
                fill={selectedId === 'la' ? '#facc15' : '#f87171'}
                stroke="#991b1b"
                strokeWidth="1.5"
                className="cursor-pointer"
                onClick={() => setSelectedId('la')}
              />
              <text x="224" y="156" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#fff" className="pointer-events-none">LA</text>

              {/* Left Ventricle (bottom-right of diagram) */}
              <path
                d="M204,172 L244,172 C242,192 226,206 204,216 Z"
                fill={selectedId === 'lv' ? '#facc15' : '#dc2626'}
                stroke="#991b1b"
                strokeWidth="1.5"
                className="cursor-pointer"
                onClick={() => setSelectedId('lv')}
              />
              <text x="221" y="191" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#fff" className="pointer-events-none">LV</text>
            </g>

            {/* Animated Flowing Blood Cells */}
            {circuitFilter !== 'systemic' && renderCells(PULMONARY_DEOX, '#1d4ed8', 0)}
            {circuitFilter !== 'systemic' && renderCells(PULMONARY_OX, '#ef4444', 0.15)}
            {circuitFilter !== 'pulmonary' && renderCells(SYSTEMIC_OX, '#ef4444', 0.05)}
            {circuitFilter !== 'pulmonary' && renderCells(SYSTEMIC_DEOX, '#1d4ed8', 0.25)}
          </svg>
        </div>

        {/* Right Panel: Selected Chamber / Vessel Details & Live Hemodynamics */}
        <div className="flex flex-col gap-3 md:col-span-5">
          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-3.5 dark:border-rose-900 dark:bg-rose-950/30">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-extrabold text-rose-700 dark:bg-navy-900 dark:text-rose-300">
                {selected.blood}
              </span>
              {onAskTutor && (
                <button
                  type="button"
                  onClick={() =>
                    onAskTutor(
                      `Explain the role of the ${selected.name} in blood circulation.`,
                      { selected_structure: selected.name, blood_type: selected.blood }
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-700"
                >
                  <Bot className="h-3 w-3" /> Ask AI Tutor
                </button>
              )}
            </div>
            <h4 className="mt-2 text-base font-extrabold text-slate-900 dark:text-white">
              {selected.name}
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
              {selected.role}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-navy-700 dark:bg-navy-950">
              <p className="text-[10px] font-bold uppercase text-slate-500">Cardiac Output</p>
              <p className="mt-0.5 font-mono text-base font-extrabold text-rose-600 dark:text-rose-400">
                {measurements.cardiac_output_l_min} L/min
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-navy-700 dark:bg-navy-950">
              <p className="text-[10px] font-bold uppercase text-slate-500">Mean Arterial BP</p>
              <p className="mt-0.5 font-mono text-base font-extrabold text-blue-600 dark:text-sky-400">
                {measurements.map_mmhg} mmHg
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-navy-800 dark:bg-navy-950 dark:text-slate-300">
            <p className="font-bold text-slate-900 dark:text-white">Blood Pathway Order:</p>
            <p className="mt-1">
              Body → Vena Cava → <strong>RA → RV</strong> → Pulmonary Artery → Lungs (O₂) → Pulmonary Vein → <strong>LA → LV</strong> → Aorta → Body.
            </p>
          </div>
        </div>
      </div>

      {/* Clickable Part Pills */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {CIRCULATORY_PARTS.map((part) => (
          <button
            key={part.id}
            type="button"
            onClick={() => setSelectedId(part.id)}
            className={`rounded-xl px-2.5 py-1 text-xs font-bold transition ${
              part.id === selectedId
                ? 'bg-rose-500 text-white shadow-sm'
                : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-rose-50 dark:border-navy-700 dark:bg-navy-950 dark:text-slate-300'
            }`}
          >
            {part.name}
          </button>
        ))}
      </div>
    </div>
  );
}
