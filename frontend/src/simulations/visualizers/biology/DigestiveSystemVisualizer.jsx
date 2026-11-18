import React, { useEffect, useState } from 'react';
import { Bot, Pause, Play, RotateCcw, Utensils } from 'lucide-react';

const DIGESTIVE_ORGANS = [
  { id: 'mouth', name: 'Mouth', stage: 0, x: 176, y: 58, role: 'Entry point for food where mechanical chewing and chemical starch digestion begin.' },
  { id: 'teeth', name: 'Teeth', stage: 0, x: 162, y: 58, role: 'Cut, tear, and grind solid food into small pieces, increasing surface area for enzymes.' },
  { id: 'tongue', name: 'Tongue', stage: 0, x: 186, y: 63, role: 'Mixes chewed food with saliva into a soft bolus and pushes it backward for swallowing.' },
  { id: 'salivary', name: 'Salivary Glands', stage: 0, x: 146, y: 68, role: 'Secrete saliva containing salivary amylase (pH ~6.8) that starts breaking starch into maltose.' },
  { id: 'pharynx', name: 'Pharynx', stage: 1, x: 176, y: 80, role: 'Muscular throat passage guiding the swallowed bolus safely past the epiglottis into the esophagus.' },
  { id: 'esophagus', name: 'Esophagus', stage: 1, x: 176, y: 122, role: 'Muscular food pipe that pushes food downward using rhythmic wave contractions called peristalsis.' },
  { id: 'stomach', name: 'Stomach', stage: 2, x: 204, y: 176, role: 'J-shaped muscular sac secreting HCl (pH ~2) and pepsin to churn food into chyme and break down proteins.' },
  { id: 'liver', name: 'Liver', stage: 3, x: 142, y: 168, role: 'Produces bile to emulsify large fat droplets into tiny micelles so lipase enzymes can digest fats.' },
  { id: 'gallbladder', name: 'Gallbladder', stage: 3, x: 148, y: 194, role: 'Stores and concentrates bile from the liver, releasing it into the small intestine after fatty meals.' },
  { id: 'pancreas', name: 'Pancreas', stage: 3, x: 186, y: 204, role: 'Secretes alkaline bicarbonate and digestive enzymes (trypsin, pancreatic amylase, lipase) into the duodenum.' },
  { id: 'small-intestine', name: 'Small Intestine', stage: 4, x: 176, y: 248, role: 'Coiled ~6 m tube lined with finger-like villi where carbohydrates, proteins, and fats finish digesting and absorb into blood & lymph.' },
  { id: 'large-intestine', name: 'Large Intestine', stage: 5, x: 124, y: 245, role: 'Absorbs remaining water, electrolytes, and vitamins (like Vitamin K from gut bacteria) to form solid waste.' },
  { id: 'rectum', name: 'Rectum', stage: 6, x: 176, y: 300, role: 'Final muscular storage chamber holding undigested fiber and waste before elimination.' },
  { id: 'anus', name: 'Anus', stage: 6, x: 176, y: 320, role: 'Sphincter-controlled opening that eliminates undigested solid waste from the body.' },
];

const FOODS = [
  {
    id: 'rice-apple',
    name: 'Rice & Apple',
    tag: 'Carbohydrate-Rich',
    color: '#facc15',
    stomachHours: '1.5 – 2.5 hrs (Faster emptying)',
    enzymeStart: 0, // Salivary amylase
    breakdown: 'Starch → Maltose (mouth amylase) → Glucose (small intestine) → absorbed into blood capillaries.',
    nutrients: { carbs: 80, protein: 12, fat: 8 },
    speedFactor: 1.25,
  },
  {
    id: 'egg-dal',
    name: 'Boiled Egg & Dal',
    tag: 'Protein-Rich',
    color: '#fb923c',
    stomachHours: '3 – 4 hrs (Moderate digestion)',
    enzymeStart: 1, // Pepsin
    breakdown: 'Proteins → Peptides (stomach pepsin at pH 2) → Amino Acids (trypsin in small intestine) → absorbed into blood.',
    nutrients: { carbs: 25, protein: 60, fat: 15 },
    speedFactor: 0.95,
  },
  {
    id: 'butter-nuts',
    name: 'Butter & Peanuts',
    tag: 'Fat-Rich',
    color: '#f59e0b',
    stomachHours: '4.5 – 6 hrs (Slowest emptying)',
    enzymeStart: 2, // Bile + Lipase/Trypsin in Small Intestine
    breakdown: 'Fats → Emulsified by liver/gallbladder bile → Fatty Acids & Glycerol (pancreatic lipase) → absorbed into lacteals.',
    nutrients: { carbs: 15, protein: 20, fat: 65 },
    speedFactor: 0.68,
  },
];

// Path waypoints from Mouth -> Anus
const JOURNEY_PATH = [
  { x: 176, y: 58, stage: 'Mouth (Chewing & Salivary Amylase)', organId: 'mouth' },
  { x: 176, y: 84, stage: 'Pharynx (Swallowing)', organId: 'pharynx' },
  { x: 176, y: 128, stage: 'Esophagus (Peristaltic Waves)', organId: 'esophagus' },
  { x: 206, y: 176, stage: 'Stomach (Acid HCl + Pepsin Churning)', organId: 'stomach' },
  { x: 176, y: 215, stage: 'Duodenum (Liver Bile + Pancreatic Enzymes)', organId: 'pancreas' },
  { x: 176, y: 248, stage: 'Small Intestine (Villi Nutrient Absorption)', organId: 'small-intestine' },
  { x: 124, y: 246, stage: 'Large Intestine (Water & Mineral Absorption)', organId: 'large-intestine' },
  { x: 176, y: 306, stage: 'Rectum & Anus (Waste Elimination)', organId: 'rectum' },
];

export default function DigestiveSystemVisualizer({
  params,
  measurements,
  onParamChange,
  onAskTutor,
}) {
  const [selectedFoodId, setSelectedFoodId] = useState('egg-dal');
  const [selectedOrganId, setSelectedOrganId] = useState('stomach');
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 .. JOURNEY_PATH.length - 1

  const food = FOODS.find((f) => f.id === selectedFoodId) || FOODS[1];
  const selectedOrgan = DIGESTIVE_ORGANS.find((o) => o.id === selectedOrganId) || DIGESTIVE_ORGANS[6];

  useEffect(() => {
    if (!playing) return undefined;
    let rafId;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      setProgress((prev) => {
        const next = prev + dt * 0.65 * food.speedFactor;
        if (next >= JOURNEY_PATH.length - 1) {
          setPlaying(false);
          return JOURNEY_PATH.length - 1;
        }
        return next;
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [playing, food.speedFactor]);

  // Interpolate bolus coordinates along tract
  const segIdx = Math.min(JOURNEY_PATH.length - 2, Math.floor(progress));
  const segT = progress - segIdx;
  const pA = JOURNEY_PATH[segIdx];
  const pB = JOURNEY_PATH[segIdx + 1];
  const bolusX = pA.x + (pB.x - pA.x) * segT;
  const bolusY = pA.y + (pB.y - pA.y) * segT;
  const currentStage = JOURNEY_PATH[Math.round(progress)] || JOURNEY_PATH[0];

  const handleSelectFood = (f) => {
    setSelectedFoodId(f.id);
    setProgress(0);
    setPlaying(true);
    onParamChange?.('enzyme', f.enzymeStart);
    onParamChange?.('ph', f.enzymeStart === 0 ? 6.8 : f.enzymeStart === 1 ? 2.0 : 8.0);
  };

  return (
    <div className="lab-card p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <Utensils className="h-4 w-4" />
            </span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Interactive Human Digestive System &amp; Food Journey
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Select a food item to watch its journey &amp; enzyme breakdown · Click any of the 14 organs
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              if (progress >= JOURNEY_PATH.length - 1) setProgress(0);
              setPlaying((p) => !p);
            }}
            className="lab-btn-accent px-3 py-1.5 text-xs"
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {playing ? 'Pause Journey' : 'Start Digestion'}
          </button>
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setProgress(0);
            }}
            className="lab-btn-secondary px-2.5 py-1.5 text-xs"
            aria-label="Reset digestion animation"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Food Selector Cards (shows different digestion rates!) */}
      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        {FOODS.map((f) => {
          const active = f.id === selectedFoodId;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => handleSelectFood(f)}
              className={`rounded-2xl border p-2.5 text-left transition ${
                active
                  ? 'border-emerald-500 bg-emerald-50 shadow-sm ring-2 ring-emerald-500/20 dark:bg-emerald-950/40'
                  : 'border-slate-200 bg-slate-50/70 hover:bg-white dark:border-navy-700 dark:bg-navy-950'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">{f.name}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-navy-900 dark:text-emerald-300">
                  {f.tag}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Est. gastric transit: {f.stomachHours}
              </p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-12">
        {/* Recognizable Human Torso & Digestive Tract SVG */}
        <div className="md:col-span-7">
          <svg
            viewBox="0 0 360 345"
            className="w-full rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50/50 via-white to-amber-50/30 dark:border-navy-800 dark:from-navy-950 dark:to-navy-900"
            role="img"
            aria-label="Interactive Human Digestive System Diagram"
          >
            {/* Human Head & Torso Silhouette */}
            <path
              d="M142,10 C142,3 210,3 210,10 C222,18 224,42 218,62 C214,72 206,78 200,84 L200,100 C246,108 286,126 294,168 L298,334 L54,334 L58,168 C66,126 106,108 152,100 L152,84 C146,78 138,72 134,62 C128,42 130,18 142,10 Z"
              fill="#fde6d8"
              fillOpacity="0.6"
              stroke="#cbd5e1"
              strokeWidth="2"
            />

            {/* Salivary Glands */}
            <circle
              cx="148"
              cy="68"
              r="7"
              fill={selectedOrganId === 'salivary' ? '#facc15' : '#38bdf8'}
              stroke="#0369a1"
              strokeWidth="1.5"
              className="cursor-pointer"
              onClick={() => setSelectedOrganId('salivary')}
            />

            {/* Mouth, Teeth & Tongue */}
            <ellipse
              cx="176"
              cy="58"
              rx="18"
              ry="10"
              fill={selectedOrganId === 'mouth' ? '#facc15' : '#fda4af'}
              stroke="#be123c"
              strokeWidth="1.5"
              className="cursor-pointer"
              onClick={() => setSelectedOrganId('mouth')}
            />
            <rect
              x="164"
              y="52"
              width="24"
              height="4"
              rx="2"
              fill={selectedOrganId === 'teeth' ? '#facc15' : '#ffffff'}
              stroke="#94a3b8"
              className="cursor-pointer"
              onClick={() => setSelectedOrganId('teeth')}
            />
            <ellipse
              cx="178"
              cy="63"
              rx="10"
              ry="4"
              fill={selectedOrganId === 'tongue' ? '#facc15' : '#f43f5e'}
              className="cursor-pointer"
              onClick={() => setSelectedOrganId('tongue')}
            />

            {/* Pharynx & Esophagus */}
            <rect
              x="170"
              y="69"
              width="12"
              height="18"
              rx="4"
              fill={selectedOrganId === 'pharynx' ? '#facc15' : '#fb923c'}
              className="cursor-pointer"
              onClick={() => setSelectedOrganId('pharynx')}
            />
            <rect
              x="171"
              y="87"
              width="10"
              height="74"
              rx="4"
              fill={selectedOrganId === 'esophagus' ? '#facc15' : '#fdba74'}
              stroke="#c2410c"
              strokeWidth="1.3"
              className="cursor-pointer"
              onClick={() => setSelectedOrganId('esophagus')}
            />

            {/* Liver */}
            <path
              d="M114,154 C135,142 174,148 176,164 C172,182 146,188 122,184 C110,180 108,162 114,154 Z"
              fill={selectedOrganId === 'liver' ? '#facc15' : '#b45309'}
              stroke="#78350f"
              strokeWidth="1.5"
              className="cursor-pointer"
              onClick={() => setSelectedOrganId('liver')}
            />
            {/* Gallbladder */}
            <ellipse
              cx="148"
              cy="191"
              rx="9"
              ry="6"
              fill={selectedOrganId === 'gallbladder' ? '#facc15' : '#22c55e'}
              stroke="#15803d"
              strokeWidth="1.5"
              className="cursor-pointer"
              onClick={() => setSelectedOrganId('gallbladder')}
            />

            {/* Stomach (J-shaped) */}
            <path
              d="M178,154 C206,144 234,162 230,188 C226,208 198,214 180,202 C170,196 172,172 178,154 Z"
              fill={selectedOrganId === 'stomach' ? '#facc15' : '#fb7185'}
              stroke="#be123c"
              strokeWidth="2"
              className="cursor-pointer"
              onClick={() => setSelectedOrganId('stomach')}
            />

            {/* Pancreas */}
            <path
              d="M168,205 Q196,198 220,210 Q196,218 168,214 Z"
              fill={selectedOrganId === 'pancreas' ? '#facc15' : '#fde047'}
              stroke="#ca8a04"
              strokeWidth="1.4"
              className="cursor-pointer"
              onClick={() => setSelectedOrganId('pancreas')}
            />

            {/* Large Intestine Frame (Ascending, Transverse, Descending Colon) */}
            <path
              d="M122,286 L122,226 Q122,216 134,216 L220,216 Q232,216 232,228 L232,282 Q232,294 214,294 L182,294"
              fill="none"
              stroke={selectedOrganId === 'large-intestine' ? '#facc15' : '#a78bfa'}
              strokeWidth="18"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="cursor-pointer"
              onClick={() => setSelectedOrganId('large-intestine')}
            />

            {/* Coiled Small Intestine */}
            <path
              d="M142,232 C164,224 190,236 210,232 C216,242 140,248 144,256 C150,264 212,258 208,268 C202,276 146,274 152,282 C162,288 196,286 202,284"
              fill="none"
              stroke={selectedOrganId === 'small-intestine' ? '#facc15' : '#fb923c'}
              strokeWidth="11"
              strokeLinecap="round"
              className="cursor-pointer"
              onClick={() => setSelectedOrganId('small-intestine')}
            />

            {/* Rectum & Anus */}
            <rect
              x="169"
              y="290"
              width="14"
              height="24"
              rx="5"
              fill={selectedOrganId === 'rectum' ? '#facc15' : '#8b5cf6'}
              className="cursor-pointer"
              onClick={() => setSelectedOrganId('rectum')}
            />
            <ellipse
              cx="176"
              cy="320"
              rx="9"
              ry="4"
              fill={selectedOrganId === 'anus' ? '#facc15' : '#6d28d9'}
              className="cursor-pointer"
              onClick={() => setSelectedOrganId('anus')}
            />

            {/* Animated Food Bolus */}
            <g>
              <circle cx={bolusX} cy={bolusY} r="9" fill={food.color} stroke="#1e293b" strokeWidth="2" />
              <circle cx={bolusX} cy={bolusY} r="13" fill="none" stroke={food.color} strokeWidth="1.5" strokeDasharray="3 2" />
            </g>

            {/* Key Anatomy Callouts */}
            <text x="16" y="168" fontSize="9" fontWeight="700" fill="#78350f">Liver &amp; Gallbladder</text>
            <text x="238" y="176" fontSize="9" fontWeight="700" fill="#be123c">Stomach (pH 2)</text>
            <text x="238" y="212" fontSize="9" fontWeight="700" fill="#a16207">Pancreas</text>
            <text x="242" y="256" fontSize="9" fontWeight="700" fill="#6d28d9">Large Intestine</text>
            <text x="16" y="264" fontSize="9" fontWeight="700" fill="#c2410c">Small Intestine</text>
          </svg>
        </div>

        {/* Right Side: Live Stage, Nutrient Breakdown & Organ Inspector */}
        <div className="flex flex-col gap-3 md:col-span-5">
          {/* Active Journey Stage */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 dark:border-emerald-900 dark:bg-emerald-950/30">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Food Journey Stage ({Math.round((progress / (JOURNEY_PATH.length - 1)) * 100)}%)
            </p>
            <p className="mt-1 text-sm font-extrabold text-slate-900 dark:text-white">
              {currentStage.stage}
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white dark:bg-navy-900">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${(progress / (JOURNEY_PATH.length - 1)) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
              <strong>{food.name}:</strong> {food.breakdown}
            </p>

            {/* Macronutrient Composition Bars */}
            <div className="mt-2.5 grid grid-cols-3 gap-1.5 text-center text-[10px] font-bold">
              <div className="rounded-lg bg-amber-100 px-2 py-1 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                Carbs {food.nutrients.carbs}%
              </div>
              <div className="rounded-lg bg-rose-100 px-2 py-1 text-rose-900 dark:bg-rose-950 dark:text-rose-200">
                Protein {food.nutrients.protein}%
              </div>
              <div className="rounded-lg bg-sky-100 px-2 py-1 text-sky-900 dark:bg-sky-950 dark:text-sky-200">
                Fats {food.nutrients.fat}%
              </div>
            </div>
          </div>

          {/* Selected Organ Inspector */}
          <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-navy-700 dark:bg-navy-950">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Selected Organ
              </span>
              {onAskTutor && (
                <button
                  type="button"
                  onClick={() =>
                    onAskTutor(
                      `What happens to ${food.name} in the ${selectedOrgan.name}?`,
                      { selected_structure: selectedOrgan.name, selected_food: food.name }
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700"
                >
                  <Bot className="h-3 w-3" /> Ask AI Tutor
                </button>
              )}
            </div>
            <h4 className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">
              {selectedOrgan.name}
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {selectedOrgan.role}
            </p>
            <div className="mt-2.5 rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-600 dark:bg-navy-900 dark:text-slate-300">
              <strong>Active Enzyme Model:</strong> {measurements.enzyme_name} ({measurements.relative_activity_pct}% activity at pH {params.ph})
            </div>
          </div>
        </div>
      </div>

      {/* All 14 Clickable Organs */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {DIGESTIVE_ORGANS.map((org) => (
          <button
            key={org.id}
            type="button"
            onClick={() => setSelectedOrganId(org.id)}
            className={`rounded-xl px-2.5 py-1 text-xs font-bold transition ${
              org.id === selectedOrganId
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-emerald-50 dark:border-navy-700 dark:bg-navy-950 dark:text-slate-300'
            }`}
          >
            {org.name}
          </button>
        ))}
      </div>
    </div>
  );
}
