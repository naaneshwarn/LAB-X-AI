import React, { useEffect, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';

/**
 * Interactive visualizers for the 8 additional Physics experiments
 * (preserving the 4 original Physics visualizers untouched).
 */
export default function PhysicsExtraVisualizer({ experimentId, params, measurements }) {
  const [playing, setPlaying] = useState(true);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => setPhase((p) => (p + 0.06) % (Math.PI * 2)), 40);
    return () => clearInterval(id);
  }, [playing]);

  const animControls = (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => setPlaying((v) => !v)}
        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-navy-700 dark:bg-navy-800 dark:text-slate-200"
      >
        {playing ? <Pause className="inline h-3 w-3 mr-1" /> : <Play className="inline h-3 w-3 mr-1" />}
        {playing ? 'Pause' : 'Play'}
      </button>
      <button
        type="button"
        onClick={() => setPhase(0)}
        className="rounded-md border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50 dark:border-navy-700 dark:bg-navy-800 dark:text-slate-300"
        title="Reset animation"
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  // 1. Reflection of Light
  if (experimentId === 'reflection-of-light') {
    const ai = ((measurements.incident_angle ?? 35) * Math.PI) / 180;
    const cx = 240, cy = 190, len = 140;
    const ix = cx - len * Math.sin(ai), iy = cy - len * Math.cos(ai);
    const rx = cx + len * Math.sin(ai), ry = cy - len * Math.cos(ai);
    return (
      <div className="lab-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy-900 dark:text-white">Plane Mirror Ray Diagram</h3>
          <span className="font-mono text-xs text-blue-600">θᵢ = θᵣ = {measurements.incident_angle}°</span>
        </div>
        <svg viewBox="0 0 480 230" className="w-full rounded-lg bg-slate-950">
          <line x1="60" y1={cy} x2="420" y2={cy} stroke="#94a3b8" strokeWidth="6" />
          <line x1={cx} y1="25" x2={cx} y2={cy} stroke="#64748b" strokeDasharray="5 5" strokeWidth="1.5" />
          <line x1={ix} y1={iy} x2={cx} y2={cy} stroke="#38bdf8" strokeWidth="3" />
          <line x1={cx} y1={cy} x2={rx} y2={ry} stroke="#fbbf24" strokeWidth="3" />
          <circle cx={cx} cy={cy} r="4" fill="#ffffff" />
          <text x={cx + 6} y="38" fill="#94a3b8" fontSize="11">Normal</text>
          <text x={ix - 15} y={iy - 6} fill="#38bdf8" fontSize="11">Incident ({measurements.incident_angle}°)</text>
          <text x={rx - 30} y={ry - 6} fill="#fbbf24" fontSize="11">Reflected ({measurements.reflected_angle}°)</text>
          <text x="195" y="214" fill="#cbd5e1" fontSize="11">Plane Mirror Surface</text>
        </svg>
      </div>
    );
  }

  // 2. Refraction of Light & TIR
  if (experimentId === 'refraction-of-light') {
    const a1 = ((measurements.incident_angle ?? 30) * Math.PI) / 180;
    const isTir = measurements.total_internal_reflection;
    const a2 = isTir ? a1 : ((measurements.refracted_angle ?? 20) * Math.PI) / 180;
    const cx = 240, cy = 120, len = 105;
    const ix = cx - len * Math.sin(a1), iy = cy - len * Math.cos(a1);
    const rx = cx + len * Math.sin(a2), ry = isTir ? cy - len * Math.cos(a2) : cy + len * Math.cos(a2);
    return (
      <div className="lab-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy-900 dark:text-white">Snell&apos;s Law &amp; Optical Interface</h3>
          <span className={`font-mono text-xs font-bold ${isTir ? 'text-rose-600' : 'text-blue-600'}`}>
            {isTir ? 'TOTAL INTERNAL REFLECTION' : `θ₂ = ${measurements.refracted_angle}°`}
          </span>
        </div>
        <svg viewBox="0 0 480 240" className="w-full rounded-lg bg-slate-950">
          <rect x="0" y="0" width="480" height={cy} fill="#0f172a" />
          <rect x="0" y={cy} width="480" height="120" fill="#1e3a5f" opacity="0.65" />
          <line x1="0" y1={cy} x2="480" y2={cy} stroke="#60a5fa" strokeWidth="2" />
          <line x1={cx} y1="12" x2={cx} y2="228" stroke="#64748b" strokeDasharray="4 4" />
          <line x1={ix} y1={iy} x2={cx} y2={cy} stroke="#38bdf8" strokeWidth="3" />
          <line x1={cx} y1={cy} x2={rx} y2={ry} stroke={isTir ? '#f43f5e' : '#34d399'} strokeWidth="3" />
          <text x="16" y="24" fill="#cbd5e1" fontSize="11">Medium 1: n₁ = {measurements.n1}</text>
          <text x="16" y="142" fill="#93c5fd" fontSize="11">Medium 2: n₂ = {measurements.n2}</text>
          <text x="320" y="24" fill="#fbbf24" fontSize="11">
            {measurements.critical_angle ? `θc = ${measurements.critical_angle}°` : 'n₁ ≤ n₂ (No TIR)'}
          </text>
        </svg>
      </div>
    );
  }

  // 3. Series & Parallel Circuits
  if (experimentId === 'series-parallel-circuits') {
    const isSeries = Number(params.mode ?? 0) === 0;
    return (
      <div className="lab-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy-900 dark:text-white">
            {isSeries ? 'Series Resistor Network' : 'Parallel Resistor Network'}
          </h3>
          <span className="font-mono text-xs text-blue-600">Req = {measurements.equivalent_resistance} Ω · I = {measurements.total_current} A</span>
        </div>
        <svg viewBox="0 0 480 210" className="w-full rounded-lg bg-slate-950">
          <rect x="30" y="75" width="44" height="60" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
          <text x="38" y="109" fill="#38bdf8" fontSize="12" fontWeight="bold">{params.voltage}V</text>
          {isSeries ? (
            <>
              <polyline points="52,75 52,40 430,40 430,170 52,170 52,135" fill="none" stroke="#60a5fa" strokeWidth="2.5" />
              {[
                { x: 115, lbl: `R₁=${params.r1}Ω`, v: `${measurements.v1}V` },
                { x: 220, lbl: `R₂=${params.r2}Ω`, v: `${measurements.v2}V` },
                { x: 325, lbl: `R₃=${params.r3}Ω`, v: `${measurements.v3}V` },
              ].map((r) => (
                <g key={r.lbl}>
                  <rect x={r.x} y="26" width="76" height="28" rx="4" fill="#1e3a8a" stroke="#93c5fd" strokeWidth="1.5" />
                  <text x={r.x + 8} y="44" fill="#fff" fontSize="10">{r.lbl}</text>
                  <text x={r.x + 18} y="68" fill="#fbbf24" fontSize="10">{r.v}</text>
                </g>
              ))}
            </>
          ) : (
            <>
              <line x1="74" y1="105" x2="140" y2="105" stroke="#60a5fa" strokeWidth="2.5" />
              <line x1="140" y1="40" x2="140" y2="170" stroke="#60a5fa" strokeWidth="2.5" />
              <line x1="390" y1="40" x2="390" y2="170" stroke="#60a5fa" strokeWidth="2.5" />
              <line x1="390" y1="105" x2="435" y2="105" stroke="#60a5fa" strokeWidth="2.5" />
              <polyline points="435,105 435,195 52,195 52,135" fill="none" stroke="#60a5fa" strokeWidth="2" />
              {[
                { y: 40, lbl: `R₁=${params.r1}Ω`, i: `I₁=${measurements.i1}A` },
                { y: 105, lbl: `R₂=${params.r2}Ω`, i: `I₂=${measurements.i2}A` },
                { y: 170, lbl: `R₃=${params.r3}Ω`, i: `I₃=${measurements.i3}A` },
              ].map((b) => (
                <g key={b.lbl}>
                  <line x1="140" y1={b.y} x2="390" y2={b.y} stroke="#60a5fa" strokeWidth="2" />
                  <rect x="215" y={b.y - 13} width="95" height="26" rx="4" fill="#312e81" stroke="#a5b4fc" />
                  <text x="225" y={b.y + 4} fill="#fff" fontSize="10">{b.lbl}</text>
                  <text x="322" y={b.y - 4} fill="#34d399" fontSize="10">{b.i}</text>
                </g>
              ))}
            </>
          )}
        </svg>
      </div>
    );
  }

  // 4. Newton's Laws Block Motion
  if (experimentId === 'newtons-laws') {
    const accel = measurements.acceleration ?? 0;
    const progress = accel > 0 ? (phase / (Math.PI * 2)) : 0;
    const bx = 65 + progress * 280;
    return (
      <div className="lab-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy-900 dark:text-white">Free-Body Diagram &amp; Motion Track</h3>
          {animControls}
        </div>
        <svg viewBox="0 0 480 180" className="w-full rounded-lg bg-slate-950">
          <line x1="20" y1="135" x2="460" y2="135" stroke="#475569" strokeWidth="4" />
          <rect x={bx} y="85" width="70" height="50" rx="6" fill="#2563eb" stroke="#93c5fd" strokeWidth="2" />
          <text x={bx + 14} y="114" fill="#fff" fontSize="12" fontWeight="bold">{params.mass} kg</text>
          {/* Applied Force Vector */}
          <line x1={bx + 70} y1="110" x2={bx + 125} y2="110" stroke="#34d399" strokeWidth="3" />
          <text x={bx + 76} y="102" fill="#34d399" fontSize="10">F={params.applied_force}N</text>
          {/* Friction Vector */}
          {measurements.friction_force > 0 && (
            <>
              <line x1={bx} y1="125" x2={Math.max(15, bx - 48)} y2="125" stroke="#f43f5e" strokeWidth="3" />
              <text x={Math.max(15, bx - 52)} y="118" fill="#f43f5e" fontSize="10">f={measurements.friction_force}N</text>
            </>
          )}
          <text x="24" y="28" fill="#e2e8f0" fontSize="12">
            a = {measurements.acceleration} m/s² · F_net = {measurements.net_force} N
          </text>
        </svg>
      </div>
    );
  }

  // 5. Electromagnetic Induction AC Generator
  if (experimentId === 'electromagnetic-induction') {
    const rx = 50 * Math.abs(Math.cos(phase));
    const emfNow = (measurements.peak_emf ?? 10) * Math.sin(phase);
    return (
      <div className="lab-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy-900 dark:text-white">Rotating Coil AC Generator</h3>
          {animControls}
        </div>
        <svg viewBox="0 0 480 190" className="w-full rounded-lg bg-slate-950">
          <rect x="28" y="45" width="60" height="100" rx="6" fill="#dc2626" />
          <text x="51" y="102" fill="#fff" fontSize="22" fontWeight="bold">N</text>
          <rect x="392" y="45" width="60" height="100" rx="6" fill="#2563eb" />
          <text x="416" y="102" fill="#fff" fontSize="22" fontWeight="bold">S</text>
          {[65, 95, 125].map((y) => (
            <line key={y} x1="95" y1={y} x2="385" y2={y} stroke="#475569" strokeDasharray="6 4" />
          ))}
          <ellipse cx="240" cy="95" rx={Math.max(6, rx)} ry="48" fill="none" stroke="#f59e0b" strokeWidth="4" />
          <text x="165" y="25" fill="#fbbf24" fontSize="12" fontWeight="bold">
            Live ε(t) = {emfNow.toFixed(1)} V (Peak: {measurements.peak_emf} V)
          </text>
          <text x="175" y="172" fill="#93c5fd" fontSize="11">B = {params.magnetic_field} T · N = {params.turns} turns</text>
        </svg>
      </div>
    );
  }

  // 6. Wave Interference Optical Fringe Strip
  if (experimentId === 'wave-interference') {
    const lam = Number(params.wavelength ?? 550);
    const hue = Math.max(0, Math.min(280, Math.round(((700 - lam) / 320) * 270)));
    return (
      <div className="lab-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy-900 dark:text-white">Double-Slit Optical Fringe Screen</h3>
          <span className="font-mono text-xs text-blue-600">λ = {lam} nm · β = {measurements.fringe_width_mm} mm</span>
        </div>
        <div className="rounded-lg bg-slate-950 p-4">
          <div className="flex h-24 w-full overflow-hidden rounded border border-slate-700">
            {Array.from({ length: 61 }, (_, i) => {
              const x = (i - 30) / 30;
              const d = Number(params.slit_separation ?? 0.5);
              const a = Number(params.slit_width ?? 0.1);
              const beta = x * Math.PI * (d / a) * 1.4;
              const alpha = x * Math.PI * 1.4;
              const sinc = Math.abs(alpha) < 1e-6 ? 1 : Math.sin(alpha) / alpha;
              const inten = Math.cos(beta) ** 2 * sinc ** 2;
              return (
                <div
                  key={i}
                  className="h-full flex-1"
                  style={{ backgroundColor: `hsla(${hue}, 95%, 55%, ${inten.toFixed(3)})` }}
                />
              );
            })}
          </div>
          <p className="mt-2 text-center font-mono text-[11px] text-slate-400">
            Simulated Fraunhofer interference fringes inside central diffraction envelope
          </p>
        </div>
      </div>
    );
  }

  // 7. Thermodynamic Piston-Cylinder
  if (experimentId === 'thermodynamic-processes') {
    const vRatio = Math.min(1, Math.max(0.15, Number(params.final_volume ?? 0.025) / 0.08));
    const pistonX = 90 + vRatio * 240;
    return (
      <div className="lab-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy-900 dark:text-white">Ideal Gas Piston-Cylinder ({measurements.process_name})</h3>
          <span className="font-mono text-xs text-blue-600">Q = {measurements.heat_q_J} J · W = {measurements.work_J} J</span>
        </div>
        <svg viewBox="0 0 480 165" className="w-full rounded-lg bg-slate-950">
          <rect x="60" y="35" width="350" height="95" rx="6" fill="#0f172a" stroke="#64748b" strokeWidth="3" />
          <rect x="63" y="38" width={pistonX - 63} height="89" fill="#2563eb" opacity="0.35" />
          <rect x={pistonX} y="36" width="18" height="93" fill="#cbd5e1" />
          <line x1={pistonX + 18} y1="82" x2="435" y2="82" stroke="#94a3b8" strokeWidth="6" />
          <text x="76" y="78" fill="#e2e8f0" fontSize="12">P₂ = {measurements.p2_kPa} kPa</text>
          <text x="76" y="98" fill="#93c5fd" fontSize="12">T₂ = {measurements.t2_K} K</text>
          <text x="76" y="150" fill="#fbbf24" fontSize="11">First Law: Q ({measurements.heat_q_J} J) = ΔU ({measurements.delta_u_J} J) + W ({measurements.work_J} J)</text>
        </svg>
      </div>
    );
  }

  // 8. Photoelectric Effect
  const emits = Boolean(measurements.emission_occurs);
  const lam = Number(params.wavelength ?? 300);
  const photonColor = lam < 400 ? '#a855f7' : lam < 500 ? '#3b82f6' : lam < 580 ? '#22c55e' : '#ef4444';
  return (
    <div className="lab-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-navy-900 dark:text-white">Quantum Photoelectric Phototube</h3>
        {animControls}
      </div>
      <svg viewBox="0 0 480 185" className="w-full rounded-lg bg-slate-950">
        <rect x="55" y="35" width="370" height="115" rx="50" fill="#0f172a" stroke="#475569" strokeWidth="2" />
        <rect x="85" y="55" width="16" height="75" fill="#94a3b8" />
        <text x="72" y="146" fill="#cbd5e1" fontSize="10">Cathode (φ={params.work_function} eV)</text>
        <rect x="380" y="55" width="14" height="75" fill="#64748b" />
        <text x="368" y="146" fill="#cbd5e1" fontSize="10">Anode</text>
        {/* Incoming Photons */}
        {[0, 1, 2].map((i) => (
          <line key={i} x1="15" y1={52 + i * 24} x2="82" y2={72 + i * 18} stroke={photonColor} strokeWidth="2.5" strokeDasharray="5 3" />
        ))}
        {/* Emitted Electrons */}
        {emits ? (
          [0, 1, 2, 3].map((i) => {
            const ex = 110 + (((phase * 40 + i * 65) % 260));
            return <circle key={i} cx={ex} cy={70 + i * 15} r="4.5" fill="#38bdf8" />;
          })
        ) : (
          <text x="155" y="98" fill="#f43f5e" fontSize="13" fontWeight="bold">
            Below Threshold (E = {measurements.photon_energy_ev} eV ≤ φ)
          </text>
        )}
        <text x="155" y="24" fill="#34d399" fontSize="11">
          E = {measurements.photon_energy_ev} eV · K_max = {measurements.k_max_ev} eV · V₀ = {measurements.stopping_potential_v} V
        </text>
      </svg>
    </div>
  );
}
