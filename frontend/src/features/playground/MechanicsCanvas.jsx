import React from 'react';

/**
 * Interactive Mechanics Playground Canvas supporting all 7 real mathematical physics scenes:
 * Inclined Plane, Newton's Laws, Projectile Motion, Free Fall, Pendulum, Hooke's Law Spring, Pulley.
 */
export default function MechanicsCanvas({ config, state }) {
  const scene = config.scene || 'inclined-plane';

  return (
    <div className="overflow-hidden rounded-2xl border border-sky-200 bg-white dark:border-navy-700 dark:bg-navy-950">
      <svg
        viewBox="0 0 720 420"
        className="block h-[420px] w-full"
        role="img"
        aria-label={`Interactive Mechanics Simulation: ${scene}`}
      >
        <defs>
          <pattern id="mech-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="720" height="420" fill="#f8fafc" />
        <rect width="720" height="420" fill="url(#mech-grid)" />

        {/* Live Timer & Formula Banner */}
        <rect x="16" y="14" width="210" height="44" rx="12" fill="#1e293b" />
        <text x="30" y="33" fontSize="10" fontWeight="700" fill="#94a3b8">STOPWATCH TIMER</text>
        <text x="30" y="49" fontSize="14" fontWeight="800" fill="#facc15">
          t = {state.time} s  |  v = {state.velocity} m/s
        </text>
        <rect x="440" y="14" width="264" height="34" rx="10" fill="#e0f2fe" stroke="#38bdf8" />
        <text x="572" y="35" textAnchor="middle" fontSize="11" fontWeight="800" fill="#0369a1">
          {state.formula}
        </text>

        {/* 1. Inclined Plane */}
        {scene === 'inclined-plane' && (() => {
          const ang = Math.max(5, Math.min(60, Number(config.angle ?? 30)));
          const rad = (ang * Math.PI) / 180;
          const xBase = 580;
          const yBase = 355;
          const rampPx = 420;
          const xTop = xBase - rampPx * Math.cos(rad);
          const yTop = yBase - rampPx * Math.sin(rad);
          const p = state.progress || 0;
          const bx = xTop + (xBase - xTop) * p;
          const by = yTop + (yBase - yTop) * p;
          return (
            <g>
              <line x1="60" y1={yBase} x2="660" y2={yBase} stroke="#64748b" strokeWidth="4" />
              <polygon points={`${xTop},${yTop} ${xBase},${yBase} ${xTop},${yBase}`} fill="#dbeafe" stroke="#2563eb" strokeWidth="3" />
              <g transform={`translate(${bx}, ${by}) rotate(${ang})`}>
                <rect x="-22" y="-36" width="44" height="36" rx="6" fill="#fb923c" stroke="#c2410c" strokeWidth="2.5" />
                <text x="0" y="-14" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">{config.mass}kg</text>
              </g>
              <text x={xBase - 55} y={yBase - 12} fontSize="12" fontWeight="800" fill="#1d4ed8">θ = {ang}°</text>
              <text x="360" y="392" textAnchor="middle" fontSize="12" fontWeight="800" fill="#1e293b">
                {state.status} · Displacement s = {state.displacement} m
              </text>
            </g>
          );
        })()}

        {/* 2. Newton's Laws Horizontal Block */}
        {scene === 'newtons-laws' && (() => {
          const bx = 110 + (state.progress || 0) * 480;
          return (
            <g>
              <line x1="40" y1="315" x2="680" y2="315" stroke="#475569" strokeWidth="5" />
              {/* Ruler ticks */}
              {[0, 5, 10, 15, 20, 25, 30].map((mMark, i) => (
                <g key={mMark}>
                  <line x1={110 + i * 80} y1="315" x2={110 + i * 80} y2="328" stroke="#64748b" strokeWidth="2" />
                  <text x={110 + i * 80} y="344" textAnchor="middle" fontSize="10" fontWeight="700" fill="#475569">{mMark}m</text>
                </g>
              ))}
              <rect x={bx - 32} y="255" width="64" height="60" rx="10" fill="#2563eb" stroke="#1e3a8a" strokeWidth="2.5" />
              <text x={bx} y="290" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">{config.mass} kg</text>
              {/* Applied Force Vector */}
              <line x1={bx + 34} y1="285" x2={bx + 100} y2="285" stroke="#22c55e" strokeWidth="5" />
              <polygon points={`${bx + 100},278 ${bx + 114},285 ${bx + 100},292`} fill="#22c55e" />
              <text x={bx + 72} y="272" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#15803d">F = {config.force} N</text>
              {/* Friction Force Vector */}
              <line x1={bx - 34} y1="304" x2={bx - 78} y2="304" stroke="#ef4444" strokeWidth="4" />
              <text x={bx - 56} y="295" textAnchor="middle" fontSize="10" fontWeight="800" fill="#dc2626">f = {state.frictionForce} N</text>
              <text x="360" y="385" textAnchor="middle" fontSize="12" fontWeight="800" fill="#1e293b">{state.status}</text>
            </g>
          );
        })()}

        {/* 3. Projectile Motion */}
        {scene === 'projectile' && (() => {
          const maxR = Math.max(10, state.range || 30);
          const maxH = Math.max(5, state.maxHeight || 15);
          const sx = (x) => 80 + (x / maxR) * 560;
          const sy = (y) => 350 - (y / (maxH * 1.25)) * 240;
          const pts = Array.from({ length: 30 }, (_, i) => {
            const frac = i / 29;
            const tP = frac * (state.timeOfFlight || 2);
            const rad = (Number(config.angle ?? 45) * Math.PI) / 180;
            const v0 = Number(config.initialSpeed ?? 18);
            const g = Number(config.gravity ?? 9.81);
            const x = v0 * Math.cos(rad) * tP;
            const y = Math.max(0, v0 * Math.sin(rad) * tP - 0.5 * g * tP * tP);
            return `${sx(x)},${sy(y)}`;
          }).join(' ');
          return (
            <g>
              <line x1="50" y1="350" x2="670" y2="350" stroke="#22c55e" strokeWidth="5" />
              <polyline points={pts} fill="none" stroke="#38bdf8" strokeWidth="3" strokeDasharray="6 4" />
              <circle cx={sx(state.x || 0)} cy={sy(state.y || 0)} r="13" fill="#fb7185" stroke="#be123c" strokeWidth="2.5" />
              <text x="360" y="386" textAnchor="middle" fontSize="12" fontWeight="800" fill="#1e293b">
                Range = {state.range} m · Max Height = {state.maxHeight} m · {state.status}
              </text>
            </g>
          );
        })()}

        {/* 4. Free Fall */}
        {scene === 'free-fall' && (() => {
          const by = 92 + (state.progress || 0) * 248;
          return (
            <g>
              <rect x="240" y="80" width="44" height="275" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" />
              <line x1="120" y1="355" x2="600" y2="355" stroke="#22c55e" strokeWidth="5" />
              <line x1="450" y1="92" x2="450" y2="355" stroke="#94a3b8" strokeDasharray="4 4" />
              <text x="466" y="102" fontSize="11" fontWeight="800" fill="#475569">h = {config.height} m</text>
              <circle cx="360" cy={by} r="18" fill="#fb923c" stroke="#c2410c" strokeWidth="2.5" />
              <text x="360" y={by + 4} textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff">{config.mass}kg</text>
              <text x="360" y="390" textAnchor="middle" fontSize="12" fontWeight="800" fill="#1e293b">{state.status}</text>
            </g>
          );
        })()}

        {/* 5. Simple Pendulum */}
        {scene === 'pendulum' && (() => {
          const pivotX = 360;
          const pivotY = 82;
          const rodLen = Math.min(240, Math.max(95, Number(config.length ?? 1.5) * 85));
          const rad = ((state.angleDeg || 0) * Math.PI) / 180;
          const bobX = pivotX + rodLen * Math.sin(rad);
          const bobY = pivotY + rodLen * Math.cos(rad);
          return (
            <g>
              <rect x="260" y="72" width="200" height="12" rx="4" fill="#334155" />
              <line x1={pivotX} y1={pivotY} x2={pivotX} y2={pivotY + rodLen + 22} stroke="#cbd5e1" strokeDasharray="5 5" />
              <line x1={pivotX} y1={pivotY} x2={bobX} y2={bobY} stroke="#1e293b" strokeWidth="3.5" />
              <circle cx={bobX} cy={bobY} r="22" fill="#2563eb" stroke="#1e3a8a" strokeWidth="3" />
              <text x={bobX} y={bobY + 4} textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff">{config.mass}kg</text>
              <text x="360" y="390" textAnchor="middle" fontSize="12" fontWeight="800" fill="#1e293b">
                L = {config.length} m · Period T = {state.period} s · θ = {state.angleDeg}°
              </text>
            </g>
          );
        })()}

        {/* 6. Hooke's Law Spring-Mass */}
        {scene === 'spring' && (() => {
          const topY = 82;
          const stretchPx = Math.min(220, Math.max(70, 95 + (state.displacement || 0.5) * 90));
          const coils = 10;
          const dy = stretchPx / coils;
          let d = `M 360 ${topY}`;
          for (let i = 0; i < coils; i += 1) {
            const yMid = topY + i * dy + dy / 2;
            const yEnd = topY + (i + 1) * dy;
            d += ` L ${i % 2 === 0 ? 336 : 384} ${yMid} L 360 ${yEnd}`;
          }
          const massY = topY + stretchPx;
          return (
            <g>
              <rect x="270" y="70" width="180" height="12" rx="4" fill="#334155" />
              <path d={d} fill="none" stroke="#0284c7" strokeWidth="3.5" strokeLinejoin="round" />
              <rect x="330" y={massY} width="60" height="48" rx="10" fill="#22c55e" stroke="#15803d" strokeWidth="2.5" />
              <text x="360" y={massY + 28} textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff">{config.mass} kg</text>
              <text x="360" y="392" textAnchor="middle" fontSize="12" fontWeight="800" fill="#1e293b">
                k = {config.springK} N/m · Spring Force = {state.springForce} N · {state.status}
              </text>
            </g>
          );
        })()}

        {/* 7. Pulley / Atwood Machine */}
        {scene === 'pulley' && (() => {
          const shift = (state.progress || 0) * 75;
          const y1 = 215 - shift;
          const y2 = 215 + shift;
          return (
            <g>
              <rect x="352" y="68" width="16" height="42" fill="#475569" />
              <circle cx="360" cy="118" r="34" fill="#cbd5e1" stroke="#334155" strokeWidth="4" />
              <line x1="326" y1="118" x2="326" y2={y1} stroke="#1e293b" strokeWidth="3" />
              <line x1="394" y1="118" x2="394" y2={y2} stroke="#1e293b" strokeWidth="3" />
              <rect x="298" y={y1} width="56" height="46" rx="8" fill="#38bdf8" stroke="#0369a1" strokeWidth="2.5" />
              <text x="326" y={y1 + 27} textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">m₁={config.mass}kg</text>
              <rect x="366" y={y2} width="56" height="46" rx="8" fill="#fb7185" stroke="#be123c" strokeWidth="2.5" />
              <text x="394" y={y2 + 27} textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">m₂={config.mass2}kg</text>
              <text x="360" y="390" textAnchor="middle" fontSize="12" fontWeight="800" fill="#1e293b">
                {state.status} · Tension T = {state.tension} N
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
