import React, { useState } from 'react';
import { Bot, Droplets } from 'lucide-react';
import ChemistryApparatusBench from './ChemistryApparatusBench';

const PH_COLORS = [
  '#dc2626', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0284c7', '#2563eb', '#4f46e5', '#7c3aed', '#6b21a8',
];

const SUBSTANCE_PRESETS = [
  { name: 'Strong Acid (HCl 0.1 M)', solution_type: 0, molarity: 0.1 },
  { name: 'Lemon / Vinegar (Weak Acid 0.05 M)', solution_type: 2, molarity: 0.05 },
  { name: 'Nearly Neutral (10⁻⁶ M HCl)', solution_type: 0, molarity: 0.0001 },
  { name: 'Ammonia Cleaner (Weak Base 0.05 M)', solution_type: 3, molarity: 0.05 },
  { name: 'Strong Base (NaOH 0.1 M)', solution_type: 1, molarity: 0.1 },
];

const INDICATORS = [
  { id: 'universal', name: 'Universal Indicator' },
  { id: 'litmus', name: 'Litmus Paper' },
  { id: 'phenol', name: 'Phenolphthalein' },
];

export default function AcidsBasesPhVisualizer({
  params,
  measurements,
  onParamChange,
  onAskTutor,
}) {
  const [indicator, setIndicator] = useState('universal');
  const [apparatus, setApparatus] = useState('ph-meter');
  const [stirring, setStirring] = useState(false);

  const ph = Number(measurements.ph ?? 7);
  const idx = Math.max(0, Math.min(14, Math.round(ph)));
  const markerLeft = `${(ph / 14) * 100}%`;

  let liquidColor = PH_COLORS[idx];
  let indicatorNote = `Universal indicator turns color band #${idx} (${measurements.nature}).`;
  if (indicator === 'litmus') {
    liquidColor = ph < 6.8 ? '#ef4444' : ph > 7.2 ? '#2563eb' : '#a855f7';
    indicatorNote = ph < 6.8 ? 'Blue litmus turns RED in acidic solutions.' : ph > 7.2 ? 'Red litmus turns BLUE in basic solutions.' : 'Neutral purple — no litmus color shift.';
  } else if (indicator === 'phenol') {
    liquidColor = ph >= 8.3 ? '#ec4899' : '#e2e8f0';
    indicatorNote = ph >= 8.3 ? 'Phenolphthalein turns bright PINK in basic solutions (pH ≥ 8.3).' : 'Phenolphthalein stays colorless in acidic & neutral solutions.';
  }

  return (
    <div className="lab-card space-y-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
              <Droplets className="h-4 w-4" />
            </span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Virtual Acids, Bases &amp; Digital pH Meter Lab
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Select a substance, switch indicators, and adjust concentration to see live pH &amp; [H⁺]
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-green-100 px-3 py-1 font-mono text-xs font-extrabold text-green-900 dark:bg-green-950 dark:text-green-200">
            pH = {ph} · {measurements.nature}
          </span>
          {onAskTutor && (
            <button
              type="button"
              onClick={() =>
                onAskTutor(
                  `Why is the pH ${ph} for ${params.molarity} M ${measurements.solution_name}?`,
                  { selected_apparatus: apparatus, indicator }
                )
              }
              className="inline-flex items-center gap-1 rounded-xl bg-green-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-green-700"
            >
              <Bot className="h-3.5 w-3.5" /> Ask Tutor
            </button>
          )}
        </div>
      </div>

      {/* Substance Presets */}
      <div className="flex flex-wrap gap-1.5">
        {SUBSTANCE_PRESETS.map((sub) => (
          <button
            key={sub.name}
            type="button"
            onClick={() => {
              onParamChange?.('solution_type', sub.solution_type);
              onParamChange?.('molarity', sub.molarity);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 transition hover:border-green-400 hover:bg-green-50 dark:border-navy-700 dark:bg-navy-950 dark:text-slate-200"
          >
            {sub.name}
          </button>
        ))}
      </div>

      {/* Indicator Switcher */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-500">Indicator:</span>
        {INDICATORS.map((ind) => (
          <button
            key={ind.id}
            type="button"
            onClick={() => setIndicator(ind.id)}
            className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
              indicator === ind.id
                ? 'bg-blue-600 text-white'
                : 'border border-slate-200 bg-white text-slate-600 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-300'
            }`}
          >
            {ind.name}
          </button>
        ))}
      </div>

      {/* Beaker + Digital pH Probe + Scale */}
      <div className="grid items-center gap-5 md:grid-cols-12">
        <div className="md:col-span-5">
          <svg viewBox="0 0 240 190" className="w-full rounded-2xl border border-green-100 bg-gradient-to-b from-sky-50/50 to-white dark:border-navy-800 dark:from-navy-950 dark:to-navy-900">
            {/* Dropper above Beaker */}
            <rect x="66" y="10" width="12" height="26" rx="4" fill="#ef4444" />
            <path d="M68,36 L76,36 L73,58 L71,58 Z" fill="#cbd5e1" stroke="#64748b" />
            <circle cx="72" cy="70" r="3.5" fill={liquidColor} />

            {/* Beaker */}
            <rect x="44" y="76" width="102" height="96" rx="10" fill="#ffffff" fillOpacity="0.6" stroke="#64748b" strokeWidth="2.5" />
            <rect x="47" y="104" width="96" height="65" rx="7" fill={liquidColor} fillOpacity="0.88" className="transition-colors duration-300" />
            <text x="95" y="140" textAnchor="middle" fontSize="14" fontWeight="800" fill={liquidColor === '#e2e8f0' ? '#1e293b' : '#ffffff'}>
              pH {ph}
            </text>

            {/* Digital pH Meter Probe dipped into Beaker */}
            <rect x="114" y="54" width="8" height="94" rx="4" fill="#334155" />
            <circle cx="118" cy="148" r="5" fill="#38bdf8" stroke="#0f172a" />
            <path d="M118,54 Q155,34 166,52" fill="none" stroke="#334155" strokeWidth="2" />

            {/* Digital pH Readout Box */}
            <rect x="156" y="52" width="74" height="58" rx="10" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <text x="193" y="70" textAnchor="middle" fontSize="8" fontWeight="700" fill="#94a3b8">pH METER</text>
            <text x="193" y="90" textAnchor="middle" fontSize="15" fontWeight="800" fill="#22c55e">{ph}</text>
            <text x="193" y="103" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#cbd5e1">pOH {measurements.poh}</text>
          </svg>
        </div>

        <div className="space-y-3 md:col-span-7">
          <div className="relative flex h-9 w-full overflow-hidden rounded-xl shadow-inner">
            {PH_COLORS.map((c, i) => (
              <div key={i} className="flex flex-1 items-center justify-center text-[10px] font-extrabold text-white" style={{ backgroundColor: c }}>
                {i}
              </div>
            ))}
          </div>
          <div className="relative h-6 w-full">
            <div
              className="absolute -top-1 -translate-x-1/2 rounded-lg bg-slate-900 px-2 py-0.5 font-mono text-[11px] font-extrabold text-white shadow-sm dark:bg-white dark:text-slate-900"
              style={{ left: markerLeft }}
            >
              ▲ pH {ph}
            </div>
          </div>
          <div className="flex justify-between text-[11px] font-bold text-slate-500">
            <span className="text-red-600">Acidic (0–6.8)</span>
            <span className="text-emerald-600">Neutral (7.0)</span>
            <span className="text-blue-600">Basic (7.2–14)</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-navy-700 dark:bg-navy-950 dark:text-slate-200">
            <p className="font-bold text-slate-900 dark:text-white">{indicatorNote}</p>
            <p className="mt-1 font-mono text-[11px] text-slate-600 dark:text-slate-400">
              [H⁺] = {measurements.h_concentration} M · [OH⁻] = {measurements.oh_concentration} M · pH + pOH = 14.00
            </p>
          </div>
        </div>
      </div>

      <ChemistryApparatusBench
        activeApparatusId={apparatus}
        onSelectApparatus={setApparatus}
        stirring={stirring}
        onToggleStir={() => setStirring((s) => !s)}
        onAskTutor={onAskTutor}
      />
    </div>
  );
}
