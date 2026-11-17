import React from 'react';

export default function ConvexLensVisualizer({ measurements }) {
  const u = measurements?.object_distance_cartesian ?? -30; // negative
  const f = measurements?.focal_length ?? 15; // positive
  const v = measurements?.image_distance; // positive (real), negative (virtual), or null (infinity)
  const h0 = measurements?.object_height ?? 4;
  const hi = measurements?.image_height;
  const isAtInfinity = Boolean(measurements?.is_at_infinity);

  const W = 640;
  const H = 310;
  const cx = W / 2;
  const cy = H / 2;

  // Dynamic horizontal scale so object, F, 2F, and image fit cleanly
  const maxDist = Math.max(
    Math.abs(u) * 1.25,
    2.4 * f,
    v !== null && Number.isFinite(v) ? Math.min(140, Math.abs(v) * 1.15) : 2.4 * f
  );
  const scaleX = (W / 2 - 36) / maxDist;
  const scaleY = 12;

  const toX = (cm) => cx + cm * scaleX;
  const objX = toX(u);
  const objTopY = cy - Math.min(82, h0 * scaleY);

  const hasFiniteImage = !isAtInfinity && v !== null && Number.isFinite(v);
  const clampedV = hasFiniteImage ? Math.max(-maxDist * 0.98, Math.min(maxDist * 0.98, v)) : 0;
  const imgX = toX(clampedV);
  const clampedHi = hasFiniteImage ? Math.max(-88, Math.min(88, (hi || 0) * scaleY)) : 0;
  const imgTipY = cy - clampedHi;

  const f1X = toX(-f);
  const f2X = toX(f);
  const twoF1X = toX(-2 * f);
  const twoF2X = toX(2 * f);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-950 p-4 dark:border-navy-700">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
        <span className="font-mono uppercase tracking-wider text-blue-300">
          Thin Convex Lens Ray Diagram (1/f = 1/v − 1/u)
        </span>
        <span className="font-mono text-violet-300">
          {isAtInfinity
            ? 'Singularity: |u| = f → Image at ∞'
            : `${measurements?.image_type} · ${measurements?.image_orientation} · m = ${measurements?.magnification}×`}
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Convex Lens Ray Diagram">
        {/* Principal Axis */}
        <line x1="16" y1={cy} x2={W - 16} y2={cy} stroke="#475569" strokeWidth="1.8" />

        {/* Thin Convex Lens */}
        <path
          d={`M ${cx} ${cy - 108} Q ${cx + 22} ${cy} ${cx} ${cy + 108} Q ${cx - 22} ${cy} ${cx} ${cy - 108} Z`}
          fill="#1d4ed8"
          fillOpacity="0.28"
          stroke="#60a5fa"
          strokeWidth="2.5"
        />
        <line x1={cx} y1={cy - 114} x2={cx} y2={cy + 114} stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 3" />

        {/* Focal points F1, 2F1, F2, 2F2 */}
        {[
          { x: twoF1X, label: '2F₁' },
          { x: f1X, label: 'F₁' },
          { x: f2X, label: 'F₂' },
          { x: twoF2X, label: '2F₂' },
        ].map((pt) => (
          <g key={pt.label}>
            <circle cx={pt.x} cy={cy} r="3.5" fill="#f59e0b" />
            <text x={pt.x} y={cy + 18} textAnchor="middle" fill="#fbbf24" fontSize="11" fontFamily="monospace">
              {pt.label}
            </text>
          </g>
        ))}

        {/* Ray 1: Parallel to principal axis -> refracts through F2 */}
        <line x1={objX} y1={objTopY} x2={cx} y2={objTopY} stroke="#38bdf8" strokeWidth="2" />
        {isAtInfinity ? (
          <>
            <line x1={cx} y1={objTopY} x2={W - 24} y2={objTopY + ((cy - objTopY) / (f2X - cx)) * (W - 24 - cx)} stroke="#38bdf8" strokeWidth="2" />
            {/* Ray 2: Through optical center */}
            <line x1={objX} y1={objTopY} x2={W - 24} y2={cy + ((cy - objTopY) / (cx - objX)) * (W - 24 - cx)} stroke="#a78bfa" strokeWidth="2" />
          </>
        ) : v > 0 ? (
          <>
            <line x1={cx} y1={objTopY} x2={imgX} y2={imgTipY} stroke="#38bdf8" strokeWidth="2" />
            <line x1={objX} y1={objTopY} x2={imgX} y2={imgTipY} stroke="#a78bfa" strokeWidth="2" />
          </>
        ) : (
          <>
            {/* Diverging emergent rays to the right + dashed virtual back-extensions */}
            <line
              x1={cx}
              y1={objTopY}
              x2={f2X + (f2X - cx) * 0.7}
              y2={cy + (cy - objTopY) * 0.7}
              stroke="#38bdf8"
              strokeWidth="2"
            />
            <line x1={cx} y1={objTopY} x2={imgX} y2={imgTipY} stroke="#38bdf8" strokeWidth="1.6" strokeDasharray="5 4" />
            <line
              x1={objX}
              y1={objTopY}
              x2={cx + (cx - objX) * 1.4}
              y2={cy + (cy - objTopY) * 1.4}
              stroke="#a78bfa"
              strokeWidth="2"
            />
            <line x1={objX} y1={objTopY} x2={imgX} y2={imgTipY} stroke="#a78bfa" strokeWidth="1.6" strokeDasharray="5 4" />
          </>
        )}

        {/* Object Arrow (Emerald) */}
        <line x1={objX} y1={cy} x2={objX} y2={objTopY} stroke="#10b981" strokeWidth="4" />
        <polygon points={`${objX},${objTopY - 7} ${objX - 5},${objTopY + 4} ${objX + 5},${objTopY + 4}`} fill="#10b981" />
        <text x={objX} y={cy + 34} textAnchor="middle" fill="#6ee7b7" fontSize="11" fontFamily="monospace">
          Object (u={u} cm)
        </text>

        {/* Image Arrow (Rose for Real, Violet dashed for Virtual) */}
        {hasFiniteImage && (
          <g>
            <line
              x1={imgX}
              y1={cy}
              x2={imgX}
              y2={imgTipY}
              stroke={v > 0 ? '#f43f5e' : '#c084fc'}
              strokeWidth="4"
              strokeDasharray={v > 0 ? undefined : '5 3'}
            />
            <circle cx={imgX} cy={imgTipY} r="4.5" fill={v > 0 ? '#f43f5e' : '#c084fc'} />
            <text
              x={imgX}
              y={v > 0 ? cy - 12 : cy + 34}
              textAnchor="middle"
              fill={v > 0 ? '#fda4af' : '#e9d5ff'}
              fontSize="11"
              fontFamily="monospace"
            >
              Image (v={v.toFixed(1)} cm)
            </text>
          </g>
        )}

        {isAtInfinity && (
          <text x={W - 150} y={48} textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="600">
            Parallel Rays → Image at ∞
          </text>
        )}
      </svg>
    </div>
  );
}
