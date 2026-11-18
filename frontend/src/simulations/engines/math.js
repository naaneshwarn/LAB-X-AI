/**
 * Deterministic client-side Mathematics calculation engines (12 experiments),
 * mirroring backend/app/services/simulations/math_sim.py.
 */

const round = (v, d = 4) => Number(Number(v).toFixed(d));

function gcd(a, b) {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function nCr(n, r) {
  if (r < 0 || r > n) return 0;
  let res = 1;
  for (let i = 1; i <= Math.min(r, n - r); i += 1) {
    res = (res * (n - i + 1)) / i;
  }
  return Math.round(res);
}

export function computeNumberSystems({ number = 42 }) {
  const n = Math.round(Number(number));
  if (n < 1 || n > 4095) throw new Error('Integer n must be between 1 and 4095.');
  const factors = [];
  let temp = n;
  for (let d = 2; d * d <= temp; d += 1) {
    while (temp % d === 0) { factors.push(d); temp /= d; }
  }
  if (temp > 1) factors.push(temp);
  const isPrime = factors.length === 1;
  const factorStr = factors.length ? factors.join(' × ') : '1';
  let divs = 0;
  for (let i = 1; i <= n; i += 1) if (n % i === 0) divs += 1;
  const bin = n.toString(2);
  const oct = n.toString(8);
  const hex = n.toString(16).toUpperCase();
  const measurements = { decimal: n, binary: bin, octal: oct, hexadecimal: hex, prime_factorization: factorStr, is_prime: isPrime, divisor_count: divs };
  return {
    parameters: { number: n },
    measurements,
    formatted_measurements: [
      { key: 'binary', label: 'Binary (Base 2)', value: `0b${bin}`, unit: '' },
      { key: 'octal', label: 'Octal (Base 8)', value: `0o${oct}`, unit: '' },
      { key: 'hexadecimal', label: 'Hex (Base 16)', value: `0x${hex}`, unit: '' },
      { key: 'prime_factorization', label: 'Prime Factors', value: factorStr, unit: '' },
      { key: 'is_prime', label: 'Type', value: isPrime ? 'Prime' : n === 1 ? 'Unit (1)' : 'Composite', unit: '' },
      { key: 'divisor_count', label: 'Divisors', value: divs, unit: '' },
    ],
    series_data: [...bin].reverse().map((b, i) => ({ bit_position: i, place_contribution: Number(b) * 2 ** i })),
    conclusion_summary: `${n}₁₀ = ${bin}₂ = ${oct}₈ = ${hex}₁₆; prime factorization = ${factorStr}.`,
  };
}

export function computeFractionsDecimals({ num1 = 3, den1 = 4, num2 = 2, den2 = 5, operation = 0 }) {
  const n1 = Math.round(Number(num1)), d1 = Math.round(Number(den1));
  const n2 = Math.round(Number(num2)), d2 = Math.round(Number(den2));
  const op = Math.round(Number(operation));
  if (d1 <= 0 || d2 <= 0) throw new Error('Denominators must be positive.');
  if (op === 3 && n2 === 0) throw new Error('Division by zero is undefined (Numerator 2 cannot be 0).');
  const syms = ['+', '−', '×', '÷'];
  let rn, rd;
  if (op === 0) { rn = n1 * d2 + n2 * d1; rd = d1 * d2; }
  else if (op === 1) { rn = n1 * d2 - n2 * d1; rd = d1 * d2; }
  else if (op === 2) { rn = n1 * n2; rd = d1 * d2; }
  else { rn = n1 * d2; rd = d1 * n2; }
  if (rd < 0) { rn = -rn; rd = -rd; }
  const g = gcd(rn, rd);
  rn /= g; rd /= g;
  const dec = rn / rd;
  const lcm = (d1 * d2) / gcd(d1, d2);
  const red = rd === 1 ? String(rn) : `${rn}/${rd}`;
  const expr = `${n1}/${d1} ${syms[op]} ${n2}/${d2}`;
  const measurements = { reduced_numerator: rn, reduced_denominator: rd, reduced_fraction: red, decimal_value: round(dec, 5), percentage: round(dec * 100, 2), lcm_denominators: lcm, expression: expr, f1_dec: round(n1 / d1, 4), f2_dec: round(n2 / d2, 4) };
  return {
    parameters: { num1: n1, den1: d1, num2: n2, den2: d2, operation: op },
    measurements,
    formatted_measurements: [
      { key: 'reduced_fraction', label: 'Reduced Fraction', value: red, unit: '' },
      { key: 'decimal_value', label: 'Decimal', value: measurements.decimal_value, unit: '' },
      { key: 'percentage', label: 'Percentage', value: measurements.percentage, unit: '%' },
      { key: 'lcm_denominators', label: 'Common Denom (LCM)', value: lcm, unit: '' },
    ],
    series_data: [{ item: 'Frac 1', decimal_value: round(n1 / d1, 4) }, { item: 'Frac 2', decimal_value: round(n2 / d2, 4) }, { item: 'Result', decimal_value: round(dec, 4) }],
    conclusion_summary: `${expr} = ${red} = ${measurements.decimal_value} (${measurements.percentage}%).`,
  };
}

export function computeBasicGeometry({ side_a = 5, side_b = 6, side_c = 7, circle_radius = 4 }) {
  const a = Number(side_a), b = Number(side_b), c = Number(side_c), r = Number(circle_radius);
  if (a + b <= c || a + c <= b || b + c <= a) throw new Error('Triangle inequality violated: sum of any two sides must exceed the third.');
  const perim = a + b + c, s = perim / 2;
  const area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
  const angA = (Math.acos(Math.max(-1, Math.min(1, (b * b + c * c - a * a) / (2 * b * c)))) * 180) / Math.PI;
  const angB = (Math.acos(Math.max(-1, Math.min(1, (a * a + c * c - b * b) / (2 * a * c)))) * 180) / Math.PI;
  const angC = 180 - angA - angB;
  const sorted = [a, b, c].sort((x, y) => x - y);
  let type = Math.abs(a - b) < 1e-4 && Math.abs(b - c) < 1e-4 ? 'Equilateral' : (Math.abs(a - b) < 1e-4 || Math.abs(b - c) < 1e-4 || Math.abs(a - c) < 1e-4) ? 'Isosceles' : 'Scalene';
  if (Math.abs(sorted[0] ** 2 + sorted[1] ** 2 - sorted[2] ** 2) < 1e-2) type += ' Right';
  const measurements = { side_a: a, side_b: b, side_c: c, circle_radius: r, triangle_type: type, perimeter: round(perim, 3), triangle_area: round(area, 3), angle_A_deg: round(angA, 1), angle_B_deg: round(angB, 1), angle_C_deg: round(angC, 1), circle_circumference: round(2 * Math.PI * r, 3), circle_area: round(Math.PI * r * r, 3) };
  return {
    parameters: { side_a: a, side_b: b, side_c: c, circle_radius: r },
    measurements,
    formatted_measurements: [
      { key: 'triangle_type', label: 'Triangle Type', value: type, unit: '' },
      { key: 'triangle_area', label: 'Heron Area', value: measurements.triangle_area, unit: 'u²' },
      { key: 'perimeter', label: 'Perimeter', value: measurements.perimeter, unit: 'u' },
      { key: 'angle_A_deg', label: 'Angles (A/B/C)', value: `${measurements.angle_A_deg}° / ${measurements.angle_B_deg}° / ${measurements.angle_C_deg}°`, unit: '' },
      { key: 'circle_area', label: 'Circle Area (πr²)', value: measurements.circle_area, unit: 'u²' },
      { key: 'circle_circumference', label: 'Circumference (2πr)', value: measurements.circle_circumference, unit: 'u' },
    ],
    series_data: Array.from({ length: 10 }, (_, i) => ({ radius: i + 1, circumference: round(2 * Math.PI * (i + 1), 2), area: round(Math.PI * (i + 1) ** 2, 2) })),
    conclusion_summary: `${type} triangle (${a},${b},${c}) has area ${measurements.triangle_area} u²; circle (r=${r}) has area ${measurements.circle_area} u².`,
  };
}

export function computeAlgebraicExpressions({ p = 2, q = 3, x_value = 4 }) {
  const P = Number(p), Q = Number(q), X = Number(x_value);
  const lin = P * X + Q, sq = lin * lin;
  const aE = P * P, bE = 2 * P * Q, cE = Q * Q;
  const form = `${round(aE, 2)}x² + (${round(bE, 2)})x + ${round(cE, 2)}`;
  const measurements = { linear_value: round(lin, 3), squared_value: round(sq, 3), expanded_a: round(aE, 3), expanded_b: round(bE, 3), expanded_c: round(cE, 3), expanded_form: form, px: round(P * X, 2), q: round(Q, 2) };
  return {
    parameters: { p: P, q: Q, x_value: X },
    measurements,
    formatted_measurements: [
      { key: 'linear_value', label: 'Linear (px + q)', value: measurements.linear_value, unit: '' },
      { key: 'squared_value', label: 'Squared (px + q)²', value: measurements.squared_value, unit: '' },
      { key: 'expanded_form', label: 'Expanded Identity', value: form, unit: '' },
    ],
    series_data: Array.from({ length: 11 }, (_, i) => ({ x: i - 5, linear: round(P * (i - 5) + Q, 2), squared: round((P * (i - 5) + Q) ** 2, 2) })),
    conclusion_summary: `At x=${X}: (${P}x + ${Q}) = ${measurements.linear_value}, (${P}x + ${Q})² = ${measurements.squared_value}.`,
  };
}

export function computeTrigonometricFunctions({ angle_deg = 30, amplitude = 2, frequency = 1, phase_deg = 0 }) {
  const ang = Number(angle_deg), A = Number(amplitude), w = Number(frequency), ph = Number(phase_deg);
  const rad = (ang * Math.PI) / 180;
  const s = Math.sin(rad), c = Math.cos(rad);
  const tanUndef = Math.abs(c) < 1e-9;
  const t = tanUndef ? null : s / c;
  const y = A * Math.sin(w * rad + (ph * Math.PI) / 180);
  const period = 360 / w;
  const measurements = { angle_deg: ang, angle_rad: round(rad, 4), sin_theta: round(s, 4), cos_theta: round(c, 4), tan_theta: t !== null ? round(t, 4) : null, wave_value_y: round(y, 4), period_deg: round(period, 1) };
  return {
    parameters: { angle_deg: ang, amplitude: A, frequency: w, phase_deg: ph },
    measurements,
    formatted_measurements: [
      { key: 'angle_rad', label: 'Radians', value: measurements.angle_rad, unit: 'rad' },
      { key: 'sin_theta', label: 'sin(θ)', value: measurements.sin_theta, unit: '' },
      { key: 'cos_theta', label: 'cos(θ)', value: measurements.cos_theta, unit: '' },
      { key: 'tan_theta', label: 'tan(θ)', value: tanUndef ? 'Undefined (∞)' : measurements.tan_theta, unit: '' },
      { key: 'wave_value_y', label: 'Wave y', value: measurements.wave_value_y, unit: '' },
      { key: 'period_deg', label: 'Period', value: measurements.period_deg, unit: '°' },
    ],
    series_data: Array.from({ length: 25 }, (_, i) => {
      const d = i * 15;
      const r = (d * Math.PI) / 180;
      return { angle_deg: d, wave_sin: round(A * Math.sin(w * r + (ph * Math.PI) / 180), 3), unit_cos: round(Math.cos(r), 3) };
    }),
    conclusion_summary: `At θ=${ang}°: sin=${measurements.sin_theta}, cos=${measurements.cos_theta}, wave y=${measurements.wave_value_y} (period ${measurements.period_deg}°).`,
  };
}

export function computeCoordinateGeometry({ x1 = -2, y1 = 1, x2 = 4, y2 = 5 }) {
  const X1 = Number(x1), Y1 = Number(y1), X2 = Number(x2), Y2 = Number(y2);
  const dx = X2 - X1, dy = Y2 - Y1;
  const dist = Math.hypot(dx, dy);
  const mx = (X1 + X2) / 2, my = (Y1 + Y2) / 2;
  const vert = Math.abs(dx) < 1e-9;
  const slope = vert ? null : dy / dx;
  const intercept = vert ? null : Y1 - slope * X1;
  const inc = vert ? 90 : (Math.atan(slope) * 180) / Math.PI;
  const eq = vert ? `x = ${round(X1, 2)}` : `y = ${round(slope, 2)}x ${intercept >= 0 ? '+' : '−'} ${round(Math.abs(intercept), 2)}`;
  const loX = Math.min(X1, X2) - 2, hiX = Math.max(X1, X2) + 2;
  const series_data = vert
    ? Array.from({ length: 9 }, (_, i) => ({ x: X1, y: round(Math.min(Y1, Y2) - 1 + ((Math.abs(dy) + 2) * i) / 8, 2) }))
    : Array.from({ length: 11 }, (_, i) => { const xp = loX + ((hiX - loX) * i) / 10; return { x: round(xp, 2), y: round(slope * xp + intercept, 2) }; });
  const measurements = { x1: X1, y1: Y1, x2: X2, y2: Y2, distance: round(dist, 4), midpoint_x: round(mx, 2), midpoint_y: round(my, 2), slope: slope !== null ? round(slope, 3) : null, y_intercept: intercept !== null ? round(intercept, 3) : null, inclination_deg: round(inc, 1), line_equation: eq };
  return {
    parameters: { x1: X1, y1: Y1, x2: X2, y2: Y2 },
    measurements,
    formatted_measurements: [
      { key: 'distance', label: 'Distance (d)', value: measurements.distance, unit: 'u' },
      { key: 'midpoint_x', label: 'Midpoint M', value: `(${measurements.midpoint_x}, ${measurements.midpoint_y})`, unit: '' },
      { key: 'slope', label: 'Slope (m)', value: vert ? 'Undefined' : measurements.slope, unit: '' },
      { key: 'line_equation', label: 'Equation', value: eq, unit: '' },
      { key: 'inclination_deg', label: 'Inclination', value: measurements.inclination_deg, unit: '°' },
    ],
    series_data,
    conclusion_summary: `Distance = ${measurements.distance}, Midpoint = (${measurements.midpoint_x}, ${measurements.midpoint_y}), Line: ${eq}.`,
  };
}

export function computeProbabilityStats({ trials = 10, prob_success = 0.5, target_k = 5 }) {
  const n = Math.round(Number(trials)), p = Number(prob_success), k = Math.min(n, Math.max(0, Math.round(Number(target_k))));
  const pmf = (r) => nCr(n, r) * p ** r * (1 - p) ** (n - r);
  const exact = pmf(k);
  let cdf = 0;
  for (let r = 0; r <= k; r += 1) cdf += pmf(r);
  const mean = n * p, variance = n * p * (1 - p), sd = Math.sqrt(variance);
  const measurements = { p_exact_k: round(exact, 5), p_at_most_k: round(cdf, 5), mean: round(mean, 3), variance: round(variance, 3), std_dev: round(sd, 3), target_k: k };
  return {
    parameters: { trials: n, prob_success: p, target_k: k },
    measurements,
    formatted_measurements: [
      { key: 'p_exact_k', label: `P(X = ${k})`, value: measurements.p_exact_k, unit: '' },
      { key: 'p_at_most_k', label: `P(X ≤ ${k})`, value: measurements.p_at_most_k, unit: '' },
      { key: 'mean', label: 'Mean (μ = np)', value: measurements.mean, unit: '' },
      { key: 'variance', label: 'Variance (σ²)', value: measurements.variance, unit: '' },
      { key: 'std_dev', label: 'Std Dev (σ)', value: measurements.std_dev, unit: '' },
    ],
    series_data: Array.from({ length: n + 1 }, (_, r) => ({ k: r, probability: round(pmf(r), 4) })),
    conclusion_summary: `Binomial(n=${n}, p=${p}): P(X=${k}) = ${measurements.p_exact_k}, μ = ${measurements.mean}, σ = ${measurements.std_dev}.`,
  };
}

export function computeQuadraticEquations({ a = 1, b = -5, c = 6 }) {
  const A = Number(a), B = Number(b), C = Number(c);
  if (Math.abs(A) < 1e-9) throw new Error('Leading coefficient a must be non-zero for a quadratic equation.');
  const disc = B * B - 4 * A * C;
  const vx = -B / (2 * A), vy = A * vx * vx + B * vx + C;
  let nature, rootsStr, r1 = null, r2 = null;
  if (disc > 1e-9) {
    r1 = (-B + Math.sqrt(disc)) / (2 * A);
    r2 = (-B - Math.sqrt(disc)) / (2 * A);
    nature = 'Two Distinct Real Roots';
    rootsStr = `x₁ = ${round(r1, 3)}, x₂ = ${round(r2, 3)}`;
  } else if (Math.abs(disc) <= 1e-9) {
    r1 = r2 = vx;
    nature = 'One Repeated Real Root';
    rootsStr = `x = ${round(vx, 3)}`;
  } else {
    const im = Math.sqrt(-disc) / (2 * Math.abs(A));
    nature = 'Two Complex Conjugate Roots';
    rootsStr = `${round(vx, 2)} ± ${round(im, 2)}i`;
  }
  const measurements = { discriminant: round(disc, 3), root_nature: nature, root_1: r1 !== null ? round(r1, 3) : null, root_2: r2 !== null ? round(r2, 3) : null, roots_display: rootsStr, vertex_x: round(vx, 3), vertex_y: round(vy, 3), opens: A > 0 ? 'Upward (Minimum)' : 'Downward (Maximum)' };
  return {
    parameters: { a: A, b: B, c: C },
    measurements,
    formatted_measurements: [
      { key: 'discriminant', label: 'Discriminant (Δ)', value: measurements.discriminant, unit: '' },
      { key: 'root_nature', label: 'Nature of Roots', value: nature, unit: '' },
      { key: 'roots_display', label: 'Solutions', value: rootsStr, unit: '' },
      { key: 'vertex_x', label: 'Vertex (h, k)', value: `(${measurements.vertex_x}, ${measurements.vertex_y})`, unit: '' },
      { key: 'opens', label: 'Orientation', value: measurements.opens, unit: '' },
    ],
    series_data: Array.from({ length: 21 }, (_, i) => {
      const xp = vx + (i - 10) * 0.6;
      return { x: round(xp, 2), y: round(A * xp * xp + B * xp + C, 2) };
    }),
    conclusion_summary: `Δ = ${measurements.discriminant} (${nature}): ${rootsStr}; vertex at (${measurements.vertex_x}, ${measurements.vertex_y}).`,
  };
}

export function computeDifferentialCalculus({ a = 1, b = -3, c = 2, d = 1, x0 = 2 }) {
  const A = Number(a), B = Number(b), C = Number(c), D = Number(d), X0 = Number(x0);
  const fx = A * X0 ** 3 + B * X0 ** 2 + C * X0 + D;
  const dfx = 3 * A * X0 ** 2 + 2 * B * X0 + C;
  const d2fx = 6 * A * X0 + 2 * B;
  const trend = dfx > 1e-6 ? 'Increasing' : dfx < -1e-6 ? 'Decreasing' : 'Stationary';
  const conc = d2fx > 1e-6 ? 'Concave Up' : d2fx < -1e-6 ? 'Concave Down' : 'Inflection / Linear';
  const measurements = { f_x0: round(fx, 4), f_prime_x0: round(dfx, 4), f_double_prime_x0: round(d2fx, 4), trend, concavity: conc };
  return {
    parameters: { a: A, b: B, c: C, d: D, x0: X0 },
    measurements,
    formatted_measurements: [
      { key: 'f_x0', label: `f(${X0})`, value: measurements.f_x0, unit: '' },
      { key: 'f_prime_x0', label: `Slope f'(${X0})`, value: measurements.f_prime_x0, unit: '' },
      { key: 'f_double_prime_x0', label: `Curvature f''(${X0})`, value: measurements.f_double_prime_x0, unit: '' },
      { key: 'trend', label: 'Local Behavior', value: `${trend} · ${conc}`, unit: '' },
    ],
    series_data: Array.from({ length: 25 }, (_, i) => {
      const xp = X0 + (i - 12) * 0.3;
      return { x: round(xp, 2), f_x: round(A * xp ** 3 + B * xp ** 2 + C * xp + D, 2), tangent: round(fx + dfx * (xp - X0), 2) };
    }),
    conclusion_summary: `At x₀=${X0}: f(${X0})=${measurements.f_x0}, f'(${X0})=${measurements.f_prime_x0} (${trend}), f''(${X0})=${measurements.f_double_prime_x0} (${conc}).`,
  };
}

export function computeIntegralCalculus({ a = 1, b = 0, c = 1, lower_limit = 0, upper_limit = 3, subintervals = 12 }) {
  const A = Number(a), B = Number(b), C = Number(c), lo = Number(lower_limit), hi = Number(upper_limit), N = Math.round(Number(subintervals));
  if (hi <= lo) throw new Error('Upper limit must be strictly greater than lower limit.');
  const f = (x) => A * x * x + B * x + C;
  const F = (x) => (A / 3) * x ** 3 + (B / 2) * x ** 2 + C * x;
  const exact = F(hi) - F(lo);
  const dx = (hi - lo) / N;
  let midSum = 0, leftSum = 0;
  const series_data = [];
  for (let i = 0; i < N; i += 1) {
    const xm = lo + (i + 0.5) * dx;
    midSum += f(xm) * dx;
    leftSum += f(lo + i * dx) * dx;
    series_data.push({ x: round(xm, 2), f_x: round(f(xm), 3) });
  }
  const err = (Math.abs(midSum - exact) / Math.max(1e-9, Math.abs(exact))) * 100;
  const measurements = { exact_integral: round(exact, 4), midpoint_riemann: round(midSum, 4), left_riemann: round(leftSum, 4), approx_error_pct: round(err, 3), average_value: round(exact / (hi - lo), 4) };
  return {
    parameters: { a: A, b: B, c: C, lower_limit: lo, upper_limit: hi, subintervals: N },
    measurements,
    formatted_measurements: [
      { key: 'exact_integral', label: 'Exact Definite Integral', value: measurements.exact_integral, unit: '' },
      { key: 'midpoint_riemann', label: `Midpoint Riemann (N=${N})`, value: measurements.midpoint_riemann, unit: '' },
      { key: 'left_riemann', label: 'Left Riemann Sum', value: measurements.left_riemann, unit: '' },
      { key: 'approx_error_pct', label: 'Midpoint Error', value: measurements.approx_error_pct, unit: '%' },
      { key: 'average_value', label: 'Mean Value', value: measurements.average_value, unit: '' },
    ],
    series_data,
    conclusion_summary: `Exact ∫[${lo}, ${hi}] = ${measurements.exact_integral}; ${N}-bin midpoint sum = ${measurements.midpoint_riemann} (${measurements.approx_error_pct}% error).`,
  };
}

export function computeMatrices({ a11 = 3, a12 = 1, a21 = 2, a22 = 4 }) {
  const m11 = Number(a11), m12 = Number(a12), m21 = Number(a21), m22 = Number(a22);
  const det = m11 * m22 - m12 * m21;
  const tr = m11 + m22;
  const frob = Math.sqrt(m11 ** 2 + m12 ** 2 + m21 ** 2 + m22 ** 2);
  const invOk = Math.abs(det) > 1e-9;
  const invStr = invOk ? `[${round(m22 / det, 2)}, ${round(-m12 / det, 2)}; ${round(-m21 / det, 2)}, ${round(m11 / det, 2)}]` : 'Singular (No Inverse)';
  const disc = tr * tr - 4 * det;
  const eigStr = disc >= 0 ? `λ₁ = ${round((tr + Math.sqrt(disc)) / 2, 3)}, λ₂ = ${round((tr - Math.sqrt(disc)) / 2, 3)}` : `${round(tr / 2, 2)} ± ${round(Math.sqrt(-disc) / 2, 2)}i`;
  const corners = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]].map(([x, y]) => ({ x_transformed: round(m11 * x + m12 * y, 2), y_transformed: round(m21 * x + m22 * y, 2) }));
  const measurements = { a11: m11, a12: m12, a21: m21, a22: m22, determinant: round(det, 3), trace: round(tr, 3), invertible: invOk, inverse_display: invStr, eigenvalues_display: eigStr, frobenius_norm: round(frob, 3), area_scale_factor: round(Math.abs(det), 3) };
  return {
    parameters: { a11: m11, a12: m12, a21: m21, a22: m22 },
    measurements,
    formatted_measurements: [
      { key: 'determinant', label: 'Determinant det(A)', value: measurements.determinant, unit: '' },
      { key: 'trace', label: 'Trace tr(A)', value: measurements.trace, unit: '' },
      { key: 'inverse_display', label: 'Inverse A⁻¹', value: invStr, unit: '' },
      { key: 'eigenvalues_display', label: 'Eigenvalues (λ)', value: eigStr, unit: '' },
      { key: 'frobenius_norm', label: 'Frobenius Norm', value: measurements.frobenius_norm, unit: '' },
    ],
    series_data: corners,
    conclusion_summary: `det(A) = ${measurements.determinant}, tr(A) = ${measurements.trace}, eigenvalues ${eigStr}.`,
  };
}

export function compute3DGeometry({ ux = 3, uy = 4, uz = 0, vx = 1, vy = 0, vz = 2 }) {
  const U = [Number(ux), Number(uy), Number(uz)], V = [Number(vx), Number(vy), Number(vz)];
  const magU = Math.hypot(...U), magV = Math.hypot(...V);
  const dist = Math.hypot(U[0] - V[0], U[1] - V[1], U[2] - V[2]);
  const dot = U[0] * V[0] + U[1] * V[1] + U[2] * V[2];
  const cx = U[1] * V[2] - U[2] * V[1], cy = U[2] * V[0] - U[0] * V[2], cz = U[0] * V[1] - U[1] * V[0];
  const magC = Math.hypot(cx, cy, cz);
  const angle = magU > 1e-9 && magV > 1e-9 ? (Math.acos(Math.max(-1, Math.min(1, dot / (magU * magV)))) * 180) / Math.PI : null;
  const crossDisp = `(${round(cx, 2)}, ${round(cy, 2)}, ${round(cz, 2)})`;
  const measurements = { ux: U[0], uy: U[1], uz: U[2], vx: V[0], vy: V[1], vz: V[2], cross_x: round(cx, 2), cross_y: round(cy, 2), cross_z: round(cz, 2), mag_u: round(magU, 3), mag_v: round(magV, 3), distance: round(dist, 3), dot_product: round(dot, 3), cross_display: crossDisp, parallelogram_area: round(magC, 3), angle_deg: angle !== null ? round(angle, 2) : null };
  return {
    parameters: { ux: U[0], uy: U[1], uz: U[2], vx: V[0], vy: V[1], vz: V[2] },
    measurements,
    formatted_measurements: [
      { key: 'mag_u', label: '|u| / |v|', value: `${measurements.mag_u} / ${measurements.mag_v}`, unit: '' },
      { key: 'dot_product', label: 'Dot Product (u · v)', value: measurements.dot_product, unit: '' },
      { key: 'cross_display', label: 'Cross Product (u × v)', value: crossDisp, unit: '' },
      { key: 'parallelogram_area', label: 'Area |u × v|', value: measurements.parallelogram_area, unit: 'u²' },
      { key: 'angle_deg', label: 'Angle θ', value: angle !== null ? measurements.angle_deg : 'Undefined', unit: angle !== null ? '°' : '' },
      { key: 'distance', label: 'Distance |u − v|', value: measurements.distance, unit: 'u' },
    ],
    series_data: [
      { axis: 'X', u_component: U[0], v_component: V[0], cross_component: round(cx, 2) },
      { axis: 'Y', u_component: U[1], v_component: V[1], cross_component: round(cy, 2) },
      { axis: 'Z', u_component: U[2], v_component: V[2], cross_component: round(cz, 2) },
    ],
    conclusion_summary: `u·v = ${measurements.dot_product}, u×v = ${crossDisp} (area ${measurements.parallelogram_area} u²), θ = ${measurements.angle_deg}°.`,
  };
}
