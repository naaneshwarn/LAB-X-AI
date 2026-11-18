import React, { useEffect, useState } from 'react';
import { AlertTriangle, Bot, Flame, FlaskConical, Play, Pause } from 'lucide-react';
import { CONTROLLED_REACTIONS } from '../../engines/chemistry';
import ChemistryApparatusBench from './ChemistryApparatusBench';

const INCOMPATIBLE_EXAMPLES = [
  'Pure Water + Quartz Sand (SiO₂) → Insoluble physical mixture, no chemical reaction.',
  'Gold (Au) + Dilute HCl → Gold is below hydrogen in the reactivity series; no reaction.',
  'NaCl(aq) + KNO₃(aq) → All ions remain soluble spectators; no net chemical reaction.',
];

export default function ChemicalReactionVisualizer({
  params,
  measurements,
  onParamChange,
  onAskTutor,
}) {
  const [apparatus, setApparatus] = useState('conical-flask');
  const [stirring, setStirring] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [tick, setTick] = useState(0);
  const [unsupportedMsg, setUnsupportedMsg] = useState('');

  const rxnIdx = Math.max(0, Math.min(CONTROLLED_REACTIONS.length - 1, Math.round(Number(params.reaction_id ?? 0))));
  const rxn = CONTROLLED_REACTIONS[rxnIdx];
  const heatOn = Math.round(Number(params.heat_on ?? 0)) === 1;
  const occurs = Boolean(measurements.reaction_occurs);

  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => setTick((t) => (t + 1) % 360), 50);
    return () => clearInterval(id);
  }, [playing]);

  return (
    <div className="lab-card space-y-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
              <FlaskConical className="h-4 w-4" />
            </span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Virtual Chemistry Bench &amp; Reaction Playground
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Select verified reactants, toggle Bunsen heat, and watch molecules rearrange in real time
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="lab-btn-secondary px-2.5 py-1.5 text-xs"
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {playing ? 'Pause' : 'Play'}
          </button>
          {onAskTutor && (
            <button
              type="button"
              onClick={() =>
                onAskTutor(
                  `Explain the balanced reaction ${rxn.equation} and why its heat change is ${measurements.enthalpy_change_kj} kJ.`,
                  { selected_reaction: rxn.name, selected_apparatus: apparatus }
                )
              }
              className="inline-flex items-center gap-1 rounded-xl bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700"
            >
              <Bot className="h-3.5 w-3.5" /> Ask AI Tutor
            </button>
          )}
        </div>
      </div>

      {/* Controlled Verified Reaction Selector */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {CONTROLLED_REACTIONS.map((item) => {
          const active = item.id === rxnIdx;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setUnsupportedMsg('');
                onParamChange?.('reaction_id', item.id);
              }}
              className={`rounded-2xl border p-2.5 text-left transition ${
                active
                  ? 'border-green-500 bg-green-50 shadow-sm ring-2 ring-green-500/20 dark:bg-green-950/40'
                  : 'border-slate-200 bg-slate-50/70 hover:bg-white dark:border-navy-700 dark:bg-navy-950'
              }`}
            >
              <p className="text-xs font-extrabold text-slate-900 dark:text-white">{item.name}</p>
              <p className="mt-0.5 font-mono text-[11px] font-semibold text-green-700 dark:text-green-300">
                {item.equation}
              </p>
              <span className="mt-1 inline-block rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-navy-900">
                {item.requiresHeat ? '🔥 Requires Bunsen Heat' : item.energyType}
              </span>
            </button>
          );
        })}
      </div>

      {/* Safe Non-Reacting Pair Test Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs dark:border-amber-900/60 dark:bg-amber-950/20">
        <span className="font-semibold text-amber-900 dark:text-amber-200">
          Why can&apos;t arbitrary chemicals react? Test a non-reacting pair:
        </span>
        <button
          type="button"
          onClick={() =>
            setUnsupportedMsg(
              INCOMPATIBLE_EXAMPLES[Math.floor(tick % INCOMPATIBLE_EXAMPLES.length)]
            )
          }
          className="rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-100 dark:bg-navy-900 dark:text-amber-200"
        >
          Test Incompatible Mixture
        </button>
      </div>
      {unsupportedMsg && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <span><strong>No Fabricated Reaction:</strong> {unsupportedMsg}</span>
        </div>
      )}

      {/* Main Bench + Molecular Rearrangement Split */}
      <div className="grid gap-4 md:grid-cols-12">
        {/* Left: Virtual Glassware + Bunsen Burner + Thermometer */}
        <div className="md:col-span-7">
          <svg
            viewBox="0 0 380 230"
            className="w-full rounded-2xl border border-green-100 bg-gradient-to-b from-sky-50/70 via-white to-slate-100/80 dark:border-navy-800 dark:from-navy-950 dark:to-navy-900"
            role="img"
            aria-label="Virtual Chemistry Apparatus Reaction Bench"
          >
            {/* Lab Bench Surface */}
            <rect x="0" y="196" width="380" height="34" fill="#cbd5e1" />

            {/* Digital Weighing Balance (Left) */}
            <g transform="translate(18, 152)">
              <rect x="0" y="24" width="76" height="22" rx="5" fill="#334155" />
              <rect x="10" y="18" width="56" height="6" rx="2" fill="#94a3b8" />
              <rect x="12" y="29" width="52" height="12" rx="3" fill="#0f172a" />
              <text x="38" y="38" textAnchor="middle" fontSize="8" fontWeight="800" fill="#22c55e">
                {(Number(params.moles_a ?? 0.2) * 58.5).toFixed(1)} g
              </text>
              <text x="38" y="12" textAnchor="middle" fontSize="8" fontWeight="700" fill="#475569">Balance</text>
            </g>

            {/* Tripod Stand & Wire Gauze */}
            <line x1="138" y1="158" x2="232" y2="158" stroke="#475569" strokeWidth="4" />
            <line x1="146" y1="158" x2="136" y2="196" stroke="#475569" strokeWidth="3.5" />
            <line x1="224" y1="158" x2="234" y2="196" stroke="#475569" strokeWidth="3.5" />

            {/* Bunsen Burner Underneath */}
            <g className="cursor-pointer" onClick={() => onParamChange?.('heat_on', heatOn ? 0 : 1)}>
              <rect x="179" y="170" width="12" height="26" rx="2" fill="#64748b" />
              <rect x="168" y="192" width="34" height="6" rx="3" fill="#334155" />
              {heatOn && (
                <>
                  <path
                    d={`M185,170 Q174,158 185,${142 + Math.sin(tick * 0.4) * 3} Q196,158 185,170 Z`}
                    fill="#38bdf8"
                    opacity="0.9"
                  />
                  <path
                    d="M185,170 Q179,161 185,152 Q191,161 185,170 Z"
                    fill="#facc15"
                  />
                </>
              )}
            </g>

            {/* Reaction Vessel (Conical Flask / Beaker / Test Tube) */}
            {apparatus === 'test-tube' ? (
              <g>
                <rect x="167" y="64" width="36" height="90" rx="18" fill="#ffffff" fillOpacity="0.7" stroke="#64748b" strokeWidth="2.5" />
                <rect x="170" y="106" width="30" height="45" rx="14" fill={occurs ? rxn.liquidColor : '#e0f2fe'} fillOpacity="0.85" />
              </g>
            ) : apparatus === 'beaker' ? (
              <g>
                <rect x="148" y="72" width="74" height="84" rx="6" fill="#ffffff" fillOpacity="0.7" stroke="#64748b" strokeWidth="2.5" />
                <rect x="151" y="108" width="68" height="45" rx="4" fill={occurs ? rxn.liquidColor : '#e0f2fe'} fillOpacity="0.85" />
              </g>
            ) : (
              <g>
                <path
                  d="M170,62 L200,62 L200,88 L228,154 L142,154 L170,88 Z"
                  fill="#ffffff"
                  fillOpacity="0.75"
                  stroke="#64748b"
                  strokeWidth="2.5"
                />
                <path
                  d="M159,116 L211,116 L224,151 L146,151 Z"
                  fill={occurs ? rxn.liquidColor : '#e0f2fe'}
                  fillOpacity="0.85"
                />
              </g>
            )}

            {/* Stir Bar Animation */}
            {stirring && (
              <ellipse
                cx="185"
                cy="148"
                rx={10 * Math.abs(Math.cos(tick * 0.25)) + 2}
                ry="2.5"
                fill="#1e293b"
              />
            )}

            {/* Observable Effects: Gas Bubbles / White Precipitate / Magnesium Glow */}
            {occurs && (rxn.effect === 'bubbles' || rxn.effect === 'endothermic_gas') &&
              [0, 1, 2, 3, 4, 5].map((i) => {
                const by = 144 - ((tick * 1.6 + i * 24) % 72);
                const bx = 172 + (i % 3) * 12 + Math.sin(tick * 0.2 + i) * 3;
                return <circle key={i} cx={bx} cy={by} r="3.5" fill="#ffffff" stroke="#0284c7" strokeWidth="1.2" />;
              })}

            {occurs && rxn.effect === 'precipitate' &&
              [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <circle key={i} cx={158 + i * 8} cy={146 + (i % 2) * 3} r="3.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
              ))}

            {occurs && rxn.effect === 'bright_flame' && (
              <circle cx="185" cy="126" r={18 + Math.sin(tick * 0.5) * 4} fill="#fef08a" fillOpacity="0.85" stroke="#f59e0b" strokeWidth="2" />
            )}

            {/* Digital Thermometer Probe (Right) */}
            <g transform="translate(278, 42)">
              <rect x="0" y="0" width="84" height="54" rx="10" fill="#1e293b" stroke="#475569" strokeWidth="2" />
              <text x="42" y="18" textAnchor="middle" fontSize="8" fontWeight="700" fill="#94a3b8">THERMOMETER</text>
              <text x="42" y="39" textAnchor="middle" fontSize="14" fontWeight="800" fill={measurements.final_temp_c > 30 ? '#fb923c' : '#38bdf8'}>
                {measurements.final_temp_c} °C
              </text>
            </g>
            {/* Thermometer Probe Wire to Flask */}
            <path d="M278,68 Q232,68 194,122" fill="none" stroke="#ef4444" strokeWidth="2" />

            {/* Status Banner */}
            <text x="14" y="22" fontSize="10.5" fontWeight="800" fill="#0f172a">
              {rxn.equation}
            </text>
            <text x="14" y="38" fontSize="9" fontWeight="700" fill={occurs ? '#15803d' : '#c2410c'}>
              {occurs ? `ΔH = ${measurements.enthalpy_change_kj} kJ (${rxn.energyType})` : 'Turn ON Bunsen Burner to start reaction!'}
            </text>
          </svg>
        </div>

        {/* Right: Particle Rearrangement Chamber + Observation */}
        <div className="flex flex-col gap-3 md:col-span-5">
          <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-3 dark:border-blue-900 dark:bg-blue-950/20">
            <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-blue-800 dark:text-sky-300">
              Molecular Rearrangement View
            </p>
            <svg viewBox="0 0 240 108" className="w-full rounded-xl bg-white dark:bg-navy-950">
              {/* Reactant Molecules (Left) */}
              <text x="46" y="16" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#475569">Reactants</text>
              {[0, 1, 2].map((i) => {
                const x = 28 + Math.sin(tick * 0.08 + i * 2) * 8 + (i % 2) * 28;
                const y = 36 + i * 24;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="7" fill="#38bdf8" />
                    <circle cx={x + 11} cy={y} r="5.5" fill="#fb7185" />
                  </g>
                );
              })}
              {/* Reaction Arrow */}
              <line x1="98" y1="58" x2="132" y2="58" stroke={occurs ? '#22c55e' : '#94a3b8'} strokeWidth="3" />
              <polygon points="132,53 142,58 132,63" fill={occurs ? '#22c55e' : '#94a3b8'} />
              {/* Product Molecules (Right) */}
              <text x="190" y="16" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#15803d">Products</text>
              {occurs ? (
                [0, 1, 2].map((i) => {
                  const x = 166 + Math.cos(tick * 0.08 + i * 2) * 8 + (i % 2) * 26;
                  const y = 36 + i * 24;
                  return (
                    <g key={i}>
                      <circle cx={x} cy={y} r="7" fill="#22c55e" />
                      <circle cx={x + 11} cy={y - 3} r="5" fill="#facc15" />
                    </g>
                  );
                })
              ) : (
                <text x="190" y="62" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#c2410c">Needs Heat</text>
              )}
            </svg>
          </div>

          <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-3.5 text-xs dark:border-navy-700 dark:bg-navy-950">
            <p className="font-extrabold text-slate-900 dark:text-white">Observable Lab Change</p>
            <p className="mt-1 leading-relaxed text-slate-600 dark:text-slate-300">
              {measurements.observable_change}
            </p>
            <p className="mt-2 text-[11px] font-semibold text-slate-500">
              <strong>Condition:</strong> {rxn.condition}
            </p>
            {rxn.requiresHeat && !heatOn && (
              <button
                type="button"
                onClick={() => onParamChange?.('heat_on', 1)}
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-orange-600"
              >
                <Flame className="h-3.5 w-3.5" /> Ignite Bunsen Burner
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive 12-Apparatus Chemistry Rack */}
      <ChemistryApparatusBench
        activeApparatusId={apparatus}
        onSelectApparatus={setApparatus}
        heatOn={heatOn}
        onToggleHeat={() => onParamChange?.('heat_on', heatOn ? 0 : 1)}
        stirring={stirring}
        onToggleStir={() => setStirring((s) => !s)}
        onAskTutor={onAskTutor}
      />
    </div>
  );
}
