import React, { useState } from 'react';
import { Bot, Flame, RotateCw } from 'lucide-react';

export const LAB_APPARATUS = [
  { id: 'beaker', name: 'Beaker (250 mL)', icon: '🧪', role: 'Wide-mouthed glass vessel with spout for mixing, stirring, and heating liquid solutions.' },
  { id: 'conical-flask', name: 'Conical Flask', icon: '⚗️', role: 'Erlenmeyer flask with narrow neck to swirl liquids during titrations without splashing.' },
  { id: 'test-tube', name: 'Test Tube', icon: '🧫', role: 'Small cylindrical glass tube for observing small-scale qualitative tests like gas evolution or precipitates.' },
  { id: 'measuring-cylinder', name: 'Measuring Cylinder', icon: '📏', role: 'Graduated cylinder used to measure liquid volumes accurately (read bottom of meniscus).' },
  { id: 'dropper', name: 'Dropper', icon: '💧', role: 'Delivers small drops of indicator (universal indicator, phenolphthalein) or reagent carefully.' },
  { id: 'burette', name: 'Burette', icon: '🔬', role: 'Precision graduated glass tube with stopcock tap for dispensing exact volumes in acid-base titrations.' },
  { id: 'pipette', name: 'Pipette', icon: '💉', role: 'Transfers a fixed, high-precision volume of liquid (e.g., 10 mL or 25 mL) between vessels.' },
  { id: 'bunsen-burner', name: 'Bunsen Burner', icon: '🔥', role: 'Provides controlled flame heating (blue non-luminous flame ~1500 °C) for endothermic and ignition reactions.' },
  { id: 'thermometer', name: 'Thermometer', icon: '🌡️', role: 'Measures solution temperature in °C to detect exothermic (heating) or endothermic (cooling) reactions.' },
  { id: 'balance', name: 'Digital Weighing Balance', icon: '⚖️', role: 'Measures solid sample mass accurately in grams (g) for stoichiometric mole calculations (n = m / M).' },
  { id: 'ph-meter', name: 'Digital pH Meter', icon: '📊', role: 'Glass electrode sensor that directly measures hydrogen ion activity (pH = −log₁₀[H⁺]) from 0 to 14.' },
  { id: 'stirrer', name: 'Magnetic Stirrer', icon: '🌀', role: 'Spins a coated stir bar inside the beaker to ensure uniform mixing and faster dissolution.' },
];

export default function ChemistryApparatusBench({
  activeApparatusId = 'beaker',
  onSelectApparatus,
  heatOn = false,
  onToggleHeat,
  stirring = false,
  onToggleStir,
  onAskTutor,
}) {
  const [selectedId, setSelectedId] = useState(activeApparatusId);
  const currentId = onSelectApparatus ? activeApparatusId : selectedId;
  const selected = LAB_APPARATUS.find((a) => a.id === currentId) || LAB_APPARATUS[0];

  const handleSelect = (id) => {
    setSelectedId(id);
    onSelectApparatus?.(id);
  };

  return (
    <div className="rounded-2xl border border-green-200 bg-green-50/50 p-3 dark:border-green-900/60 dark:bg-green-950/20">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-green-800 dark:text-green-300">
          Virtual Chemistry Apparatus Rack (12 Lab Instruments — Click to Select)
        </span>
        <div className="flex items-center gap-1.5">
          {onToggleHeat && (
            <button
              type="button"
              onClick={onToggleHeat}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                heatOn
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-orange-50 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-200'
              }`}
            >
              <Flame className="h-3.5 w-3.5" />
              Bunsen: {heatOn ? 'ON' : 'OFF'}
            </button>
          )}
          {onToggleStir && (
            <button
              type="button"
              onClick={onToggleStir}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                stirring
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-sky-50 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-200'
              }`}
            >
              <RotateCw className={`h-3.5 w-3.5 ${stirring ? 'animate-spin' : ''}`} />
              Stirrer: {stirring ? 'ON' : 'OFF'}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {LAB_APPARATUS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleSelect(item.id)}
            className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition ${
              item.id === currentId
                ? 'bg-green-600 text-white shadow-sm'
                : 'border border-green-200/80 bg-white text-slate-700 hover:bg-green-100/70 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-200'
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/90 px-3 py-2 text-xs text-slate-700 dark:bg-navy-900 dark:text-slate-200">
        <p className="flex-1">
          <strong className="text-green-800 dark:text-green-300">{selected.name}:</strong> {selected.role}
        </p>
        {onAskTutor && (
          <button
            type="button"
            onClick={() =>
              onAskTutor(`How is a ${selected.name} used safely in a chemistry laboratory?`, {
                selected_apparatus: selected.name,
              })
            }
            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-green-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-green-700"
          >
            <Bot className="h-3 w-3" /> Ask Tutor
          </button>
        )}
      </div>
    </div>
  );
}
