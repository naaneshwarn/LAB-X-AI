import React from 'react';

export default function OhmsLawVisualizer({ measurements }) {
  const V = measurements?.voltage ?? 12;
  const R = measurements?.resistance ?? 20;
  const I = measurements?.current ?? 0.6;
  const P = measurements?.power ?? 7.2;

  // Animation speed proportional to current (higher I = faster charge flow)
  const animDuration = I > 0.01 ? Math.max(0.45, Math.min(6, 2.2 / Math.sqrt(I))) : 0;
  const heatIntensity = Math.min(1, P / 40);
  const resistorStroke =
    heatIntensity > 0.55 ? '#dc2626' : heatIntensity > 0.2 ? '#ea580c' : '#2563eb';

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-950 p-4 dark:border-navy-700">
      <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
        <span className="font-mono uppercase tracking-wider text-blue-300">
          DC Ohmic Circuit Schematic
        </span>
        <span className="font-mono text-emerald-400">
          I = {I.toFixed(3)} A · P = {P.toFixed(2)} W
        </span>
      </div>
      <svg viewBox="0 0 640 310" className="h-auto w-full" role="img" aria-label="Ohm's Law Circuit Diagram">
        <defs>
          <radialGradient id="resistorGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f97316" stopOpacity={heatIntensity * 0.65} />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Main closed circuit loop */}
        <path
          id="circuitLoop"
          d="M 110 235 L 110 85 L 250 85 L 390 85 L 530 85 L 530 235 L 110 235"
          fill="none"
          stroke="#475569"
          strokeWidth="4"
          strokeLinejoin="round"
        />

        {/* Animated current flow markers */}
        {animDuration > 0 &&
          [0, 0.2, 0.4, 0.6, 0.8].map((offset) => (
            <circle key={offset} r="5" fill="#38bdf8">
              <animateMotion
                dur={`${animDuration}s`}
                begin={`-${offset * animDuration}s`}
                repeatCount="indefinite"
                path="M 110 235 L 110 85 L 530 85 L 530 235 L 110 235"
              />
            </circle>
          ))}

        {/* DC Battery (left branch) */}
        <rect x="82" y="132" width="56" height="58" rx="6" fill="#0f1d3d" stroke="#334155" strokeWidth="2" />
        <line x1="94" y1="150" x2="126" y2="150" stroke="#60a5fa" strokeWidth="4" />
        <line x1="102" y1="164" x2="118" y2="164" stroke="#94a3b8" strokeWidth="3" />
        <text x="128" y="148" fill="#60a5fa" fontSize="13" fontWeight="700">+</text>
        <text x="128" y="176" fill="#94a3b8" fontSize="14" fontWeight="700">−</text>
        <text x="20" y="158" fill="#e2e8f0" fontSize="13" fontWeight="600">Battery</text>
        <text x="20" y="176" fill="#60a5fa" fontFamily="monospace" fontSize="14" fontWeight="700">
          {V.toFixed(1)} V
        </text>

        {/* Ammeter in Series (right branch) */}
        <circle cx="530" cy="160" r="30" fill="#0f1d3d" stroke="#10b981" strokeWidth="3" />
        <text x="530" y="156" textAnchor="middle" fill="#10b981" fontSize="16" fontWeight="700">A</text>
        <text x="530" y="174" textAnchor="middle" fill="#ecfdf5" fontFamily="monospace" fontSize="11">
          {I.toFixed(2)}A
        </text>
        <text x="572" y="158" fill="#cbd5e1" fontSize="12" fontWeight="600">Ammeter</text>
        <text x="572" y="174" fill="#64748b" fontSize="11">(Series)</text>

        {/* Resistor (top branch) with thermal glow */}
        <ellipse cx="320" cy="85" rx="68" ry="30" fill="url(#resistorGlow)" />
        <rect x="255" y="65" width="130" height="40" rx="8" fill="#0f1d3d" />
        <polyline
          points="250,85 266,85 276,68 292,102 308,68 324,102 340,68 356,102 368,85 390,85"
          fill="none"
          stroke={resistorStroke}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x="320" y="42" textAnchor="middle" fill="#e2e8f0" fontSize="13" fontWeight="600">
          Resistor R = {R.toFixed(1)} Ω
        </text>

        {/* Voltmeter in Parallel across Resistor */}
        <polyline
          points="240,85 240,165 290,165"
          fill="none"
          stroke="#a78bfa"
          strokeWidth="2.5"
          strokeDasharray="6 4"
        />
        <polyline
          points="400,85 400,165 350,165"
          fill="none"
          stroke="#a78bfa"
          strokeWidth="2.5"
          strokeDasharray="6 4"
        />
        <circle cx="240" cy="85" r="4.5" fill="#a78bfa" />
        <circle cx="400" cy="85" r="4.5" fill="#a78bfa" />
        <circle cx="320" cy="165" r="30" fill="#0f1d3d" stroke="#8b5cf6" strokeWidth="3" />
        <text x="320" y="161" textAnchor="middle" fill="#c4b5fd" fontSize="16" fontWeight="700">V</text>
        <text x="320" y="179" textAnchor="middle" fill="#f5f3ff" fontFamily="monospace" fontSize="11">
          {V.toFixed(1)}V
        </text>
        <text x="320" y="212" textAnchor="middle" fill="#c4b5fd" fontSize="11">
          Voltmeter (Parallel)
        </text>

        {/* Direction indicator */}
        <text x="320" y="275" textAnchor="middle" fill="#94a3b8" fontSize="12" fontFamily="monospace">
          Conventional Current Flow →  |  V = I × R  →  {V.toFixed(1)} V = {I.toFixed(3)} A × {R.toFixed(1)} Ω
        </text>
      </svg>
    </div>
  );
}
