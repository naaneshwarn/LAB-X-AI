import React from 'react';

/**
 * Interactive Optics Playground Canvas:
 * Convex Lens, Concave Lens, Concave Mirror, Plane Mirror, and Glass Prism Dispersion.
 */
export default function OpticsCanvas({ config, result }) {
  const el = config.element || 'convex-lens';
  const cx = 360;
  const cy = 210;

  return (
    <div className="overflow-hidden rounded-2xl border border-sky-200 bg-white dark:border-navy-700 dark:bg-navy-950">
      <svg
        viewBox="0 0 720 420"
        className="block h-[420px] w-full"
        role="img"
        aria-label={`Interactive Optics Simulation: ${el}`}
      >
        <defs>
          <pattern id="opt-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#e2e8f0" strokeWidth="0.7" />
          </pattern>
        </defs>
        <rect width="720" height="420" fill="#f8fafc" />
        <rect width="720" height="420" fill="url(#opt-grid)" />

        {/* Principal Axis */}
        <line x1="20" y1={cy} x2="700" y2={cy} stroke="#94a3b8" strokeDasharray="6 4" strokeWidth="1.5" />

        {/* Formula Badge */}
        <rect x="18" y="14" width="285" height="32" rx="10" fill="#eff6ff" stroke="#93c5fd" />
        <text x="30" y="34" fontSize="11" fontWeight="800" fill="#1d4ed8">
          {result.formula}
        </text>

        {/* 1. Plane Mirror Reflection */}
        {el === 'plane-mirror' && (() => {
          const ang = (Number(config.incidentAngle ?? 42) * Math.PI) / 180;
          const len = 165;
          const xIn = cx - len * Math.sin(ang);
          const yIn = cy - len * Math.cos(ang);
          const xRef = cx + len * Math.sin(ang);
          const yRef = cy - len * Math.cos(ang);
          return (
            <g>
              {/* Mirror Surface */}
              <rect x="140" y={cy} width="440" height="12" fill="#38bdf8" stroke="#0284c7" strokeWidth="2" />
              {/* Normal Line */}
              <line x1={cx} y1="55" x2={cx} y2={cy} stroke="#64748b" strokeDasharray="5 4" strokeWidth="2" />
              <text x={cx + 8} y="70" fontSize="10" fontWeight="700" fill="#475569">Normal (90°)</text>
              {/* Incident Ray */}
              <line x1={xIn} y1={yIn} x2={cx} y2={cy} stroke="#ef4444" strokeWidth="4" />
              <circle cx={xIn} cy={yIn} r="8" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
              <text x={xIn - 12} y={yIn - 12} fontSize="11" fontWeight="800" fill="#dc2626">
                Incident (θᵢ = {result.incidentAngle}°)
              </text>
              {/* Reflected Ray */}
              <line x1={cx} y1={cy} x2={xRef} y2={yRef} stroke="#22c55e" strokeWidth="4" />
              <text x={xRef - 24} y={yRef - 12} fontSize="11" fontWeight="800" fill="#15803d">
                Reflected (θᵣ = {result.reflectedAngle}°)
              </text>
            </g>
          );
        })()}

        {/* 2. Glass Prism Dispersion (VIBGYOR Rainbow) */}
        {el === 'prism' && (() => {
          const rays = result.rays || [];
          const hitX = 310;
          const hitY = 215;
          return (
            <g>
              {/* Darkened optical chamber backdrop for visible rainbow */}
              <rect x="24" y="58" width="672" height="310" rx="16" fill="#0f172a" />
              {/* Glass Prism Triangle */}
              <polygon points="360,96 250,310 470,310" fill="#38bdf8" fillOpacity="0.22" stroke="#7dd3fc" strokeWidth="3" />
              {/* White Light Source & Beam */}
              <rect x="52" y="232" width="54" height="24" rx="6" fill="#facc15" />
              <text x="79" y="248" textAnchor="middle" fontSize="9.5" fontWeight="900" fill="#1e293b">SOURCE</text>
              <line x1="106" y1="244" x2={hitX} y2={hitY} stroke="#ffffff" strokeWidth="5" />
              {/* Dispersed Spectrum Rays */}
              {rays.map((ray, idx) => {
                const exitX = 412 + idx * 3;
                const exitY = 204 + idx * 8;
                const screenY = 175 + idx * 24;
                return (
                  <g key={ray.name}>
                    <line x1={hitX} y1={hitY} x2={exitX} y2={exitY} stroke={ray.color} strokeWidth="2.2" opacity="0.85" />
                    {!ray.tir && (
                      <line x1={exitX} y1={exitY} x2="640" y2={screenY} stroke={ray.color} strokeWidth="3.2" />
                    )}
                    <text x="650" y={screenY + 4} fontSize="10" fontWeight="800" fill={ray.color}>{ray.name}</text>
                  </g>
                );
              })}
              {/* Observation Screen */}
              <rect x="636" y="150" width="8" height="175" rx="3" fill="#e2e8f0" />
            </g>
          );
        })()}

        {/* 3. Convex Lens, Concave Lens & Concave Mirror */}
        {(el === 'convex-lens' || el === 'concave-lens' || el === 'concave-mirror') && (() => {
          const scale = 5.2; // px per cm
          const fPx = Math.min(180, Number(config.focalLength ?? 15) * scale);
          const uPx = Math.min(280, Number(config.objectDistance ?? 30) * scale);
          const hObjPx = Math.min(85, Number(config.objectHeight ?? 4) * 14);
          const objX = cx - uPx;
          const objTopY = cy - hObjPx;

          const hasImg = result.imageDistance !== null && Number.isFinite(result.imageDistance);
          const imgX = hasImg
            ? el === 'concave-mirror'
              ? cx + Math.max(-290, Math.min(290, result.imageDistance * scale))
              : cx + Math.max(-290, Math.min(290, result.imageDistance * scale))
            : null;
          const imgTopY = hasImg
            ? cy - Math.max(-130, Math.min(130, (result.imageHeight || 0) * 14))
            : null;

          return (
            <g>
              {/* Optical Element at cx */}
              {el === 'convex-lens' && (
                <path d={`M ${cx},85 Q ${cx + 24},${cy} ${cx},335 Q ${cx - 24},${cy} ${cx},85 Z`} fill="#bae6fd" fillOpacity="0.65" stroke="#0284c7" strokeWidth="3" />
              )}
              {el === 'concave-lens' && (
                <path d={`M ${cx - 18},85 Q ${cx - 4},${cy} ${cx - 18},335 L ${cx + 18},335 Q ${cx + 4},${cy} ${cx + 18},85 Z`} fill="#bae6fd" fillOpacity="0.65" stroke="#0284c7" strokeWidth="3" />
              )}
              {el === 'concave-mirror' && (
                <path d={`M ${cx - 10},85 Q ${cx + 22},${cy} ${cx - 10},335`} fill="none" stroke="#0284c7" strokeWidth="6" />
              )}

              {/* Focal Points F */}
              <circle cx={cx - fPx} cy={cy} r="5" fill="#2563eb" />
              <text x={cx - fPx} y={cy + 20} textAnchor="middle" fontSize="11" fontWeight="800" fill="#1d4ed8">F</text>
              {el !== 'concave-mirror' && (
                <>
                  <circle cx={cx + fPx} cy={cy} r="5" fill="#2563eb" />
                  <text x={cx + fPx} y={cy + 20} textAnchor="middle" fontSize="11" fontWeight="800" fill="#1d4ed8">F&apos;</text>
                </>
              )}

              {/* Object Arrow */}
              <line x1={objX} y1={cy} x2={objX} y2={objTopY} stroke="#16a34a" strokeWidth="4.5" />
              <polygon points={`${objX - 7},${objTopY + 10} ${objX},${objTopY - 2} ${objX + 7},${objTopY + 10}`} fill="#16a34a" />
              <text x={objX} y={cy + 20} textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#15803d">Object</text>

              {/* Principal Rays */}
              <line x1={objX} y1={objTopY} x2={cx} y2={objTopY} stroke="#f97316" strokeWidth="2.5" />
              {hasImg && (
                <>
                  <line x1={cx} y1={objTopY} x2={imgX} y2={imgTopY} stroke="#f97316" strokeWidth="2.5" strokeDasharray={result.imageNature?.includes('Virtual') ? '5 4' : 'none'} />
                  <line x1={objX} y1={objTopY} x2={imgX} y2={imgTopY} stroke="#ef4444" strokeWidth="2" opacity="0.8" />
                  {/* Image Arrow */}
                  <line
                    x1={imgX}
                    y1={cy}
                    x2={imgX}
                    y2={imgTopY}
                    stroke="#7c3aed"
                    strokeWidth="4.5"
                    strokeDasharray={result.imageNature?.includes('Virtual') ? '6 3' : 'none'}
                  />
                  <text x={imgX} y={imgTopY < cy ? imgTopY - 10 : imgTopY + 18} textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#6d28d9">
                    Image ({result.imageNature?.split(' ')[0]})
                  </text>
                </>
              )}
            </g>
          );
        })()}

        {/* Bottom Summary */}
        <text x="360" y="398" textAnchor="middle" fontSize="11.5" fontWeight="800" fill="#1e293b">
          {result.summary}
        </text>
      </svg>
    </div>
  );
}
