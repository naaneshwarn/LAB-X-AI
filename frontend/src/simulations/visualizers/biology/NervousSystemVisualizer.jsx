import React, { useEffect, useState } from 'react';
import { Bot, Flame, Zap } from 'lucide-react';
import { NERVOUS_STRUCTURES } from '../../engines/biology';

export default function NervousSystemVisualizer({
  params,
  measurements,
  onParamChange,
  onAskTutor,
}) {
  const [impulseT, setImpulseT] = useState(0); // 0 = idle, 0..1 sensory -> spinal -> motor
  const [firing, setFiring] = useState(false);

  const selectedIdx = Math.max(
    0,
    Math.min(NERVOUS_STRUCTURES.length - 1, Math.round(Number(params.structure_index ?? 1)))
  );
  const selected = NERVOUS_STRUCTURES[selectedIdx];
  const fired = Boolean(measurements.action_potential_fired);

  useEffect(() => {
    if (!firing) return undefined;
    let rafId;
    let last = performance.now();
    const speed = Number(params.myelination ?? 1) === 1 ? 0.85 : 0.28;
    const step = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      setImpulseT((prev) => {
        const next = prev + dt * speed;
        if (next >= 1) {
          setFiring(false);
          return 1;
        }
        return next;
      });
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [firing, params.myelination]);

  const triggerReflex = () => {
    if (!fired) {
      onParamChange?.('stimulus_intensity', 75);
    }
    setImpulseT(0.01);
    setFiring(true);
  };

  // Compute glowing signal dot along the reflex arc
  let sigX = 76;
  let sigY = 122;
  let phaseLabel = 'Ready — click "Trigger Reflex Stimulus" to test!';
  if (impulseT > 0) {
    if (impulseT < 0.45) {
      const f = impulseT / 0.45;
      sigX = 76 + f * (270 - 76);
      sigY = 122 - Math.sin(f * Math.PI) * 32;
      phaseLabel = '1. Sensory Neuron carrying impulse to Spinal Cord';
    } else if (impulseT < 0.58) {
      sigX = 276;
      sigY = 136;
      phaseLabel = '2. Spinal Cord Interneuron integrating reflex (2 ms synapse)';
    } else if (impulseT < 0.96) {
      const f = (impulseT - 0.58) / 0.38;
      sigX = 270 - f * (270 - 84);
      sigY = 165 + Math.sin(f * Math.PI) * 26;
      phaseLabel = '3. Motor Neuron sending command to Muscle';
    } else {
      sigX = 82;
      sigY = 178;
      phaseLabel = `4. Muscle contracts & pulls hand away in ${measurements.reflex_latency_ms} ms!`;
    }
  }

  const musclePulled = impulseT >= 0.92;

  return (
    <div className="lab-card p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <Zap className="h-4 w-4" />
            </span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Interactive Human Nervous System &amp; Spinal Reflex Arc
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Trigger a heat stimulus to watch signal transmission · Click Brain, Spinal Cord, or Neurons
          </p>
        </div>

        <button
          type="button"
          onClick={triggerReflex}
          className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-3.5 py-2 text-xs font-extrabold text-white shadow-sm transition hover:bg-orange-600"
        >
          <Flame className="h-4 w-4" />
          Trigger Reflex Stimulus
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-12">
        <div className="md:col-span-7">
          <svg
            viewBox="0 0 380 260"
            className="w-full rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/40 via-white to-sky-50/50 dark:border-navy-800 dark:from-navy-950 dark:to-navy-900"
            role="img"
            aria-label="Interactive Human Nervous System and Reflex Arc Diagram"
          >
            {/* 0: Brain (Top Right) */}
            <g className="cursor-pointer" onClick={() => onParamChange?.('structure_index', 0)}>
              <ellipse
                cx="305"
                cy="42"
                rx="44"
                ry="26"
                fill={selectedIdx === 0 ? '#facc15' : '#f472b6'}
                stroke={selectedIdx === 0 ? '#1e293b' : '#be185d'}
                strokeWidth="2"
              />
              <text x="305" y="45" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#1e293b">
                Brain
              </text>
            </g>

            {/* Ascending Pathway to Brain (Conscious perception - slower) */}
            <line
              x1="286"
              y1="96"
              x2="298"
              y2="68"
              stroke="#94a3b8"
              strokeWidth="3"
              strokeDasharray="4 3"
            />
            <text x="308" y="84" fontSize="8" fontWeight="700" fill="#64748b">To Brain (~165ms)</text>

            {/* 1: Spinal Cord Cross-Section */}
            <g className="cursor-pointer" onClick={() => onParamChange?.('structure_index', 1)}>
              <ellipse
                cx="286"
                cy="142"
                rx="44"
                ry="48"
                fill={selectedIdx === 1 ? '#fde047' : '#e0e7ff'}
                stroke={selectedIdx === 1 ? '#1e293b' : '#4f46e5'}
                strokeWidth="2.5"
              />
              {/* Gray matter H-butterfly */}
              <path
                d="M274,116 Q286,132 298,116 Q296,142 302,166 Q286,152 270,166 Q276,142 274,116 Z"
                fill="#818cf8"
                opacity="0.7"
              />
              <text x="286" y="205" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#3730a3">
                Spinal Cord
              </text>
            </g>

            {/* Hot Stimulus & Hand Skin Receptor */}
            <g transform={musclePulled ? 'translate(-12, -14)' : 'translate(0, 0)'}>
              <rect x="28" y="102" width="52" height="36" rx="10" fill="#fed7aa" stroke="#ea580c" strokeWidth="1.8" />
              <text x="54" y="118" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#9a3412">Skin</text>
              <text x="54" y="130" textAnchor="middle" fontSize="8" fontWeight="700" fill="#c2410c">Receptor</text>
              {/* Flame Stimulus */}
              <path d="M18,128 Q12,115 20,104 Q28,114 22,128 Z" fill="#ef4444" />
            </g>

            {/* Effector Muscle */}
            <g transform={musclePulled ? 'scale(1.06, 0.92)' : 'scale(1)'} style={{ transformOrigin: '60px 180px' }}>
              <ellipse cx="62" cy="180" rx="34" ry="16" fill={musclePulled ? '#22c55e' : '#fb7185'} stroke="#881337" strokeWidth="2" />
              <text x="62" y="183" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#fff">
                {musclePulled ? 'Pulled Away!' : 'Arm Muscle'}
              </text>
            </g>

            {/* 3: Sensory Neuron Pathway (Top Arc) */}
            <g className="cursor-pointer" onClick={() => onParamChange?.('structure_index', 3)}>
              <path
                d="M80,118 Q175,78 268,124"
                fill="none"
                stroke={selectedIdx === 3 ? '#facc15' : '#0284c7'}
                strokeWidth="6"
                strokeLinecap="round"
              />
              {/* Myelin Sheath Beads if myelination === 1 */}
              {Number(params.myelination ?? 1) === 1 &&
                [122, 165, 210].map((mx) => (
                  <rect key={mx} x={mx} y="92" width="16" height="9" rx="4" fill="#bae6fd" stroke="#0369a1" />
                ))}
              <text x="172" y="84" textAnchor="middle" fontSize="9" fontWeight="800" fill="#0369a1">
                Sensory Neuron (Afferent →)
              </text>
            </g>

            {/* 4: Motor Neuron Pathway (Bottom Arc) */}
            <g className="cursor-pointer" onClick={() => onParamChange?.('structure_index', 4)}>
              <path
                d="M268,162 Q175,204 94,180"
                fill="none"
                stroke={selectedIdx === 4 ? '#facc15' : '#16a34a'}
                strokeWidth="6"
                strokeLinecap="round"
              />
              {Number(params.myelination ?? 1) === 1 &&
                [130, 175, 218].map((mx) => (
                  <rect key={mx} x={mx} y="180" width="16" height="9" rx="4" fill="#bbf7d0" stroke="#15803d" />
                ))}
              <text x="178" y="210" textAnchor="middle" fontSize="9" fontWeight="800" fill="#15803d">
                ← Motor Neuron (Efferent)
              </text>
            </g>

            {/* 2: Peripheral Nerve Bundle Marker */}
            <g className="cursor-pointer" onClick={() => onParamChange?.('structure_index', 2)}>
              <rect
                x="148"
                y="132"
                width="62"
                height="20"
                rx="10"
                fill={selectedIdx === 2 ? '#facc15' : '#f1f5f9'}
                stroke="#64748b"
              />
              <text x="179" y="145" textAnchor="middle" fontSize="8" fontWeight="800" fill="#1e293b">
                Peripheral Nerve
              </text>
            </g>

            {/* Glowing Action Potential Pulse */}
            {impulseT > 0 && (
              <g>
                <circle cx={sigX} cy={sigY} r="10" fill="#facc15" fillOpacity="0.45" />
                <circle cx={sigX} cy={sigY} r="5.5" fill="#eab308" stroke="#1e293b" strokeWidth="1.5" />
              </g>
            )}

            <text x="12" y="246" fontSize="9" fontWeight="700" fill="#334155">
              {phaseLabel}
            </text>
          </svg>
        </div>

        <div className="flex flex-col gap-3 md:col-span-5">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 dark:border-amber-900 dark:bg-amber-950/30">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Selected Neural Structure
              </span>
              {onAskTutor && (
                <button
                  type="button"
                  onClick={() =>
                    onAskTutor(
                      `How does the ${selected.name} work during a reflex arc?`,
                      { selected_structure: selected.name }
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-amber-700"
                >
                  <Bot className="h-3 w-3" /> Ask AI Tutor
                </button>
              )}
            </div>
            <h4 className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">
              {selected.name}
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
              {selected.role}
            </p>
          </div>

          {/* Reflex vs Voluntary Speed Comparison */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 text-xs dark:border-navy-700 dark:bg-navy-950">
            <p className="font-extrabold text-slate-900 dark:text-white">
              Spinal Reflex vs Voluntary Response
            </p>
            <div className="mt-2 space-y-2">
              <div>
                <div className="flex justify-between font-semibold">
                  <span className="text-emerald-700 dark:text-emerald-400">Spinal Reflex</span>
                  <span className="font-mono">{measurements.reflex_latency_ms} ms</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-slate-100 dark:bg-navy-800">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${Math.min(100, (measurements.reflex_latency_ms / 260) * 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between font-semibold">
                  <span className="text-blue-700 dark:text-sky-400">Conscious Brain Reaction</span>
                  <span className="font-mono">{measurements.voluntary_reaction_ms} ms</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-slate-100 dark:bg-navy-800">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${Math.min(100, (measurements.voluntary_reaction_ms / 260) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Structure Selector Pills */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {NERVOUS_STRUCTURES.map((st, idx) => (
          <button
            key={st.id}
            type="button"
            onClick={() => onParamChange?.('structure_index', idx)}
            className={`rounded-xl px-2.5 py-1 text-xs font-bold transition ${
              idx === selectedIdx
                ? 'bg-amber-500 text-white shadow-sm'
                : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-amber-50 dark:border-navy-700 dark:bg-navy-950 dark:text-slate-300'
            }`}
          >
            {st.name}
          </button>
        ))}
      </div>
    </div>
  );
}
