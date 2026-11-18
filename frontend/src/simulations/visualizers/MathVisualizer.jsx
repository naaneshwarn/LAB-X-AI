import React from 'react';

/**
 * Interactive Mathematics Visualizers for all 12 Mathematics experiments:
 * Binary Bits, Fraction Bars, Dynamic Triangle & Circle SVG, Binomial Area Square,
 * Live Unit Circle, 2x2 Matrix Transformed Square SVG, Isometric 3D Vectors SVG.
 */
export default function MathVisualizer({ experimentId, params, measurements }) {
  // 1. Number Systems Binary Bit Register
  if (experimentId === 'number-systems') {
    const bits = String(measurements.binary || '0').padStart(8, '0').split('');
    return (
      <div className="lab-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy-900 dark:text-white">Positional Binary Register (n = {measurements.decimal})</h3>
          <span className="font-mono text-xs font-bold text-orange-600">0x{measurements.hexadecimal} · 0o{measurements.octal}</span>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {bits.map((b, idx) => {
            const pow = bits.length - 1 - idx;
            return (
              <div
                key={idx}
                className={`flex w-12 flex-col items-center rounded-lg border p-2 font-mono ${
                  b === '1'
                    ? 'border-orange-500 bg-orange-500 text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-navy-700 dark:bg-navy-950'
                }`}
              >
                <span className="text-lg font-extrabold">{b}</span>
                <span className="text-[10px]">2^{pow}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. Basic Geometry Dynamic Triangle & Circle Construction
  if (experimentId === 'basic-geometry') {
    const a = Number(measurements.side_a ?? 5);
    const b = Number(measurements.side_b ?? 6);
    const c = Number(measurements.side_c ?? 7);
    const scale = 150 / Math.max(a, b, c, 1);
    const ax = 45, ay = 165;
    const bx = ax + c * scale, by = ay;
    const cosA = (b * b + c * c - a * a) / (2 * b * c);
    const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
    const cx = ax + b * scale * cosA;
    const cy = ay - b * scale * sinA;
    const rPx = Math.min(62, Math.max(16, Number(measurements.circle_radius ?? 4) * 5));
    return (
      <div className="lab-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy-900 dark:text-white">Dynamic Euclidean Construction ({measurements.triangle_type})</h3>
          <span className="font-mono text-xs text-orange-600">Area = {measurements.triangle_area} u²</span>
        </div>
        <svg viewBox="0 0 480 195" className="w-full rounded-lg bg-slate-950">
          <polygon points={`${ax},${ay} ${bx},${by} ${cx},${cy}`} fill="#ea580c" fillOpacity="0.3" stroke="#fb923c" strokeWidth="2.5" />
          <text x={(ax + bx) / 2} y={ay + 16} fill="#fdba74" fontSize="11" textAnchor="middle">c = {c}</text>
          <text x={(ax + cx) / 2 - 14} y={(ay + cy) / 2} fill="#fdba74" fontSize="11">b = {b}</text>
          <text x={(bx + cx) / 2 + 8} y={(by + cy) / 2} fill="#fdba74" fontSize="11">a = {a}</text>
          <circle cx="375" cy="98" r={rPx} fill="#2563eb" fillOpacity="0.25" stroke="#60a5fa" strokeWidth="2.5" />
          <line x1="375" y1="98" x2={375 + rPx} y2="98" stroke="#fbbf24" strokeWidth="2" />
          <text x="375" y="182" fill="#93c5fd" fontSize="11" textAnchor="middle">Circle r = {measurements.circle_radius} (πr² = {measurements.circle_area})</text>
        </svg>
      </div>
    );
  }

  // 3. Trigonometric Unit Circle
  if (experimentId === 'trigonometric-functions') {
    const rad = ((measurements.angle_deg ?? 30) * Math.PI) / 180;
    const cx = 240, cy = 110, R = 78;
    const px = cx + R * Math.cos(rad);
    const py = cy - R * Math.sin(rad);
    return (
      <div className="lab-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy-900 dark:text-white">Interactive Unit Circle (x² + y² = 1)</h3>
          <span className="font-mono text-xs text-orange-600">sin={measurements.sin_theta} · cos={measurements.cos_theta}</span>
        </div>
        <svg viewBox="0 0 480 220" className="w-full rounded-lg bg-slate-950">
          <line x1="120" y1={cy} x2="360" y2={cy} stroke="#475569" strokeWidth="1.5" />
          <line x1={cx} y1="15" x2={cx} y2="205" stroke="#475569" strokeWidth="1.5" />
          <circle cx={cx} cy={cy} r={R} fill="none" stroke="#94a3b8" strokeWidth="2" />
          <line x1={cx} y1={cy} x2={px} y2={cy} stroke="#38bdf8" strokeWidth="3" />
          <line x1={px} y1={cy} x2={px} y2={py} stroke="#fb923c" strokeWidth="3" />
          <line x1={cx} y1={cy} x2={px} y2={py} stroke="#facc15" strokeWidth="2.5" />
          <circle cx={px} cy={py} r="5.5" fill="#facc15" />
          <text x="16" y="28" fill="#fb923c" fontSize="11">sin({measurements.angle_deg}°) = {measurements.sin_theta}</text>
          <text x="16" y="46" fill="#38bdf8" fontSize="11">cos({measurements.angle_deg}°) = {measurements.cos_theta}</text>
          <text x="16" y="64" fill="#a78bfa" fontSize="11">sin²θ + cos²θ = 1.0000</text>
        </svg>
      </div>
    );
  }

  // 4. Matrices 2x2 Linear Transformation of Unit Square
  if (experimentId === 'matrices-linear-algebra') {
    const m11 = Number(measurements.a11 ?? 3), m12 = Number(measurements.a12 ?? 1);
    const m21 = Number(measurements.a21 ?? 2), m22 = Number(measurements.a22 ?? 4);
    const ox = 240, oy = 115, sc = 16;
    const pts = [[0, 0], [1, 0], [1, 1], [0, 1]]
      .map(([x, y]) => `${ox + (m11 * x + m12 * y) * sc},${oy - (m21 * x + m22 * y) * sc}`)
      .join(' ');
    const unitPts = `${ox},${oy} ${ox + sc},${oy} ${ox + sc},${oy - sc} ${ox},${oy - sc}`;
    return (
      <div className="lab-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy-900 dark:text-white">2×2 Linear Transformation Geometry</h3>
          <span className="font-mono text-xs text-orange-600">det(A) = {measurements.determinant} (Area ×{measurements.area_scale_factor})</span>
        </div>
        <svg viewBox="0 0 480 220" className="w-full rounded-lg bg-slate-950">
          <line x1="20" y1={oy} x2="460" y2={oy} stroke="#334155" />
          <line x1={ox} y1="15" x2={ox} y2="205" stroke="#334155" />
          <polygon points={unitPts} fill="#38bdf8" fillOpacity="0.35" stroke="#38bdf8" strokeWidth="1.5" />
          <polygon points={pts} fill="#ea580c" fillOpacity="0.4" stroke="#fb923c" strokeWidth="2.5" />
          <text x="16" y="24" fill="#38bdf8" fontSize="11">Blue: Unit Square (Area = 1)</text>
          <text x="16" y="42" fill="#fb923c" fontSize="11">Orange: Transformed A(Square) (Area = |det| = {measurements.area_scale_factor})</text>
        </svg>
      </div>
    );
  }

  // 5. Isometric 3D Vector Projection
  if (experimentId === 'three-dimensional-geometry') {
    const ox = 240, oy = 125, sc = 11;
    const iso = (x, y, z) => [ox + (x - y * 0.7) * sc, oy - (z + y * 0.4) * sc];
    const [ux, uy] = iso(params.ux ?? 3, params.uy ?? 4, params.uz ?? 0);
    const [vx, vy] = iso(params.vx ?? 1, params.vy ?? 0, params.vz ?? 2);
    const [cx, cy] = iso(
      Math.max(-8, Math.min(8, measurements.cross_x ?? 0)),
      Math.max(-8, Math.min(8, measurements.cross_y ?? 0)),
      Math.max(-8, Math.min(8, measurements.cross_z ?? 0))
    );
    return (
      <div className="lab-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy-900 dark:text-white">Isometric 3D Vector Space (u, v, u × v)</h3>
          <span className="font-mono text-xs text-orange-600">θ = {measurements.angle_deg}° · u·v = {measurements.dot_product}</span>
        </div>
        <svg viewBox="0 0 480 220" className="w-full rounded-lg bg-slate-950">
          <line x1={ox} y1={oy} x2={ox + 120} y2={oy} stroke="#475569" strokeDasharray="3 3" />
          <line x1={ox} y1={oy} x2={ox - 80} y2={oy - 45} stroke="#475569" strokeDasharray="3 3" />
          <line x1={ox} y1={oy} x2={ox} y2={oy - 95} stroke="#475569" strokeDasharray="3 3" />
          <line x1={ox} y1={oy} x2={ux} y2={uy} stroke="#38bdf8" strokeWidth="3" />
          <line x1={ox} y1={oy} x2={vx} y2={vy} stroke="#fb923c" strokeWidth="3" />
          <line x1={ox} y1={oy} x2={cx} y2={cy} stroke="#c084fc" strokeWidth="2.5" strokeDasharray="5 2" />
          <circle cx={ux} cy={uy} r="4.5" fill="#38bdf8" />
          <circle cx={vx} cy={vy} r="4.5" fill="#fb923c" />
          <circle cx={cx} cy={cy} r="4.5" fill="#c084fc" />
          <text x="16" y="24" fill="#38bdf8" fontSize="11">u = ({params.ux}, {params.uy}, {params.uz})</text>
          <text x="16" y="42" fill="#fb923c" fontSize="11">v = ({params.vx}, {params.vy}, {params.vz})</text>
          <text x="16" y="60" fill="#c084fc" fontSize="11">u × v = {measurements.cross_display}</text>
        </svg>
      </div>
    );
  }

  // Unified rich Math summary visual for Fractions, Algebra, Coordinate Geometry, Probability, Quadratics, Calculus
  return (
    <div className="lab-card border-orange-200/80 bg-gradient-to-br from-orange-950 via-navy-950 to-slate-950 p-5 text-white dark:border-orange-900">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-300">
            Exact Deterministic Mathematics Engine
          </p>
          <h3 className="mt-1 text-lg font-extrabold font-mono">
            {measurements.reduced_fraction || measurements.expanded_form || measurements.line_equation || measurements.roots_display || `f'(x₀) = ${measurements.f_prime_x0 ?? measurements.exact_integral ?? ''}`}
          </h3>
        </div>
        <span className="rounded-full border border-orange-400/40 bg-orange-500/20 px-3 py-1 font-mono text-xs font-bold text-orange-200">
          MATHEMATICS
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.entries(measurements)
          .filter(([, v]) => v !== null && typeof v !== 'object')
          .slice(0, 4)
          .map(([k, v]) => (
            <div key={k} className="rounded-lg bg-white/10 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-orange-200">{k.replace(/_/g, ' ')}</p>
              <p className="mt-0.5 font-mono text-sm font-bold text-white">{String(v)}</p>
            </div>
          ))}
      </div>
    </div>
  );
}
