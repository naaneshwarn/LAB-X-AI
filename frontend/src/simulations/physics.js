/**
 * Deterministic client-side scientific calculation engine mirroring backend/app/services/simulation_engine.py.
 * Provides zero-latency interactive physics while backend persists authoritative runs.
 */

export const DEFAULT_PARAMETERS = {
  'ohms-law': { voltage: 12.0, resistance: 20.0 },
  'simple-pendulum': { length: 1.0, gravity: 9.81, initial_angle: 12.0, oscillations: 10 },
  'projectile-motion': { initial_velocity: 25.0, launch_angle: 45.0, gravity: 9.81 },
  'convex-lens': { object_distance: 30.0, focal_length: 15.0, object_height: 4.0 },
};

export function computeOhmsLaw({ voltage = 12, resistance = 20 }) {
  const V = Number(voltage);
  const R = Number(resistance);
  if (!Number.isFinite(V) || V < 0 || V > 240) {
    throw new Error('Voltage must be between 0 V and 240 V.');
  }
  if (!Number.isFinite(R) || R <= 0) {
    throw new Error('Resistance must be strictly greater than 0 Ω to prevent a short circuit.');
  }

  const I = V / R;
  const P = V * I;
  const G = 1 / R;

  const maxV = Math.max(24, V);
  const seriesData = [];
  for (let i = 0; i <= 12; i += 1) {
    const vPt = Number(((maxV / 12) * i).toFixed(2));
    const iPt = Number((vPt / R).toFixed(4));
    seriesData.push({ voltage: vPt, current: iPt, power: Number((vPt * iPt).toFixed(4)) });
  }

  const measurements = {
    voltage: Number(V.toFixed(4)),
    resistance: Number(R.toFixed(4)),
    current: Number(I.toFixed(4)),
    power: Number(P.toFixed(4)),
    conductance: Number(G.toFixed(5)),
  };

  return {
    parameters: { voltage: V, resistance: R },
    measurements,
    formatted_measurements: [
      { key: 'voltage', label: 'Supply Voltage (V)', value: measurements.voltage, unit: 'V' },
      { key: 'resistance', label: 'Resistance (R)', value: measurements.resistance, unit: 'Ω' },
      { key: 'current', label: 'Electric Current (I)', value: measurements.current, unit: 'A' },
      { key: 'power', label: 'Dissipated Power (P)', value: measurements.power, unit: 'W' },
      { key: 'conductance', label: 'Conductance (G)', value: measurements.conductance, unit: 'S' },
    ],
    series_data: seriesData,
    special_case: V === 0 ? 'zero_voltage' : null,
    conclusion_summary: `With V = ${measurements.voltage} V and R = ${measurements.resistance} Ω, the circuit draws I = ${measurements.current} A and dissipates P = ${measurements.power} W (V = I × R).`,
  };
}

export function computeSimplePendulum({
  length = 1.0,
  gravity = 9.81,
  initial_angle = 12.0,
  oscillations = 10,
}) {
  const L = Number(length);
  const g = Number(gravity);
  const thetaDeg = Number(initial_angle);
  const N = Math.round(Number(oscillations));

  if (!Number.isFinite(L) || L <= 0.05) throw new Error('Pendulum length must exceed 0.05 m.');
  if (!Number.isFinite(g) || g <= 0.1) throw new Error('Gravity must exceed 0.1 m/s².');
  if (!Number.isFinite(thetaDeg) || thetaDeg <= 0 || thetaDeg > 85) {
    throw new Error('Initial angle must be between 0.5° and 85°.');
  }

  const T = 2 * Math.PI * Math.sqrt(L / g);
  const thetaRad = (thetaDeg * Math.PI) / 180;
  const correction = 1 + (thetaRad ** 2) / 16 + (11 * thetaRad ** 4) / 3072;
  const TCorrected = T * correction;
  const deviationPct = (correction - 1) * 100;
  const f = 1 / T;
  const totalTime = T * N;

  const seriesData = [];
  for (let i = 0; i < 15; i += 1) {
    const lPt = Number((0.2 + (4.8 * i) / 14).toFixed(2));
    const tPt = Number((2 * Math.PI * Math.sqrt(lPt / g)).toFixed(4));
    seriesData.push({ length: lPt, period: tPt, period_squared: Number((tPt ** 2).toFixed(3)) });
  }

  const measurements = {
    length: Number(L.toFixed(4)),
    gravity: Number(g.toFixed(4)),
    initial_angle: Number(thetaDeg.toFixed(2)),
    oscillations: N,
    time_period: Number(T.toFixed(4)),
    corrected_time_period: Number(TCorrected.toFixed(4)),
    large_angle_deviation_percent: Number(deviationPct.toFixed(3)),
    frequency: Number(f.toFixed(4)),
    total_time_for_oscillations: Number(totalTime.toFixed(4)),
  };

  return {
    parameters: { length: L, gravity: g, initial_angle: thetaDeg, oscillations: N },
    measurements,
    formatted_measurements: [
      { key: 'time_period', label: 'Time Period T (Small-Angle)', value: measurements.time_period, unit: 's' },
      { key: 'frequency', label: 'Frequency (f)', value: measurements.frequency, unit: 'Hz' },
      {
        key: 'total_time_for_oscillations',
        label: `Total Time (${N} oscillations)`,
        value: measurements.total_time_for_oscillations,
        unit: 's',
      },
      {
        key: 'corrected_time_period',
        label: 'Angle-Corrected Period',
        value: measurements.corrected_time_period,
        unit: 's',
      },
      {
        key: 'large_angle_deviation_percent',
        label: 'Small-Angle Deviation',
        value: measurements.large_angle_deviation_percent,
        unit: '%',
      },
    ],
    series_data: seriesData,
    special_case: thetaDeg > 15 ? 'large_angle_regime' : 'small_angle_approximation_valid',
    conclusion_summary: `For L = ${measurements.length} m and g = ${measurements.gravity} m/s², small-angle T = ${measurements.time_period} s (f = ${measurements.frequency} Hz). Large-angle deviation at ${measurements.initial_angle}° is ${measurements.large_angle_deviation_percent}%.`,
  };
}

export function computeProjectileMotion({
  initial_velocity = 25,
  launch_angle = 45,
  gravity = 9.81,
}) {
  const u = Number(initial_velocity);
  const angle = Number(launch_angle);
  const g = Number(gravity);

  if (!Number.isFinite(u) || u <= 0) throw new Error('Initial velocity must be positive.');
  if (!Number.isFinite(angle) || angle < 0 || angle > 90) {
    throw new Error('Launch angle must be between 0° and 90°.');
  }
  if (!Number.isFinite(g) || g <= 0.1) throw new Error('Gravity must exceed 0.1 m/s².');

  const rad = (angle * Math.PI) / 180;
  const vx = Math.abs(angle - 90) < 1e-6 ? 0 : u * Math.cos(rad);
  const vy0 = Math.abs(angle) < 1e-6 ? 0 : u * Math.sin(rad);
  const tof = (2 * vy0) / g;
  const maxHeight = (vy0 * vy0) / (2 * g);
  const range =
    Math.abs(angle - 90) < 1e-6 || Math.abs(angle) < 1e-6
      ? 0
      : (u * u * Math.sin(2 * rad)) / g;

  const seriesData = [];
  for (let i = 0; i <= 40; i += 1) {
    const t = tof > 0 ? (tof * i) / 40 : 0;
    const x = vx * t;
    const y = Math.max(0, vy0 * t - 0.5 * g * t * t);
    const vy = vy0 - g * t;
    seriesData.push({
      t: Number(t.toFixed(3)),
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
      vx: Number(vx.toFixed(2)),
      vy: Number(vy.toFixed(2)),
    });
  }

  const measurements = {
    initial_velocity: Number(u.toFixed(4)),
    launch_angle: Number(angle.toFixed(2)),
    gravity: Number(g.toFixed(4)),
    horizontal_velocity: Number(vx.toFixed(4)),
    vertical_velocity: Number(vy0.toFixed(4)),
    time_of_flight: Number(tof.toFixed(4)),
    time_to_apex: Number((vy0 / g).toFixed(4)),
    max_height: Number(maxHeight.toFixed(4)),
    horizontal_range: Number(range.toFixed(4)),
  };

  return {
    parameters: { initial_velocity: u, launch_angle: angle, gravity: g },
    measurements,
    formatted_measurements: [
      { key: 'horizontal_velocity', label: 'Horizontal Velocity (vx)', value: measurements.horizontal_velocity, unit: 'm/s' },
      { key: 'vertical_velocity', label: 'Initial Vertical Velocity (vy₀)', value: measurements.vertical_velocity, unit: 'm/s' },
      { key: 'time_of_flight', label: 'Time of Flight (T)', value: measurements.time_of_flight, unit: 's' },
      { key: 'max_height', label: 'Maximum Height (H)', value: measurements.max_height, unit: 'm' },
      { key: 'horizontal_range', label: 'Horizontal Range (R)', value: measurements.horizontal_range, unit: 'm' },
    ],
    series_data: seriesData,
    special_case: Math.abs(angle - 45) < 0.01 ? 'maximum_range_angle' : null,
    conclusion_summary: `At u = ${measurements.initial_velocity} m/s and θ = ${measurements.launch_angle}°, peak height is ${measurements.max_height} m, range is ${measurements.horizontal_range} m, and flight time is ${measurements.time_of_flight} s (assuming negligible air resistance).`,
  };
}

export function computeConvexLens({
  object_distance = 30,
  focal_length = 15,
  object_height = 4,
}) {
  const absU = Math.abs(Number(object_distance));
  const f = Number(focal_length);
  const h0 = Number(object_height);

  if (!Number.isFinite(absU) || absU < 0.5) throw new Error('Object distance |u| must be at least 0.5 cm.');
  if (!Number.isFinite(f) || f <= 0.5) throw new Error('Focal length f must be positive (> 0.5 cm).');

  // Cartesian sign convention: u < 0, f > 0
  const u = -absU;
  const denom = f + u;
  const isAtFocus = Math.abs(denom) < 1e-6;
  const opticalPower = 100 / f;

  let v = null;
  let m = null;
  let imageHeight = null;
  let imageType = 'At Infinity';
  let imageOrientation = 'Undefined (Parallel Rays)';
  let imageSize = 'Infinitely Magnified';
  let specialCase = 'object_at_focal_point';

  if (!isAtFocus) {
    v = (f * u) / denom;
    m = v / u;
    imageHeight = m * h0;
    imageType = v > 0 ? 'Real' : 'Virtual';
    imageOrientation = v > 0 ? 'Inverted' : 'Upright';
    if (Math.abs(Math.abs(m) - 1) < 0.02) {
      imageSize = 'Same Size';
      specialCase = 'object_at_2f';
    } else if (Math.abs(m) > 1) {
      imageSize = 'Magnified';
      specialCase = v < 0 ? 'virtual_magnifier' : 'between_f_and_2f';
    } else {
      imageSize = 'Diminished';
      specialCase = 'beyond_2f';
    }
  }

  const seriesData = [];
  const step = Math.max(1, Math.floor(f * 0.2));
  for (let d = Math.max(2, Math.floor(f * 0.3)); d <= Math.floor(f * 4); d += step) {
    if (Math.abs(d - f) < Math.max(1, f * 0.08)) continue;
    const uPt = -d;
    const vPt = (f * uPt) / (f + uPt);
    if (Math.abs(vPt) <= 250) {
      seriesData.push({
        object_distance: d,
        image_distance: Number(vPt.toFixed(2)),
        magnification: Number((vPt / uPt).toFixed(3)),
      });
    }
  }

  const measurements = {
    object_distance_cartesian: Number(u.toFixed(4)),
    object_distance_magnitude: Number(absU.toFixed(4)),
    focal_length: Number(f.toFixed(4)),
    image_distance: v !== null ? Number(v.toFixed(4)) : null,
    magnification: m !== null ? Number(m.toFixed(4)) : null,
    object_height: Number(h0.toFixed(4)),
    image_height: imageHeight !== null ? Number(imageHeight.toFixed(4)) : null,
    optical_power_diopters: Number(opticalPower.toFixed(4)),
    image_type: imageType,
    image_orientation: imageOrientation,
    image_size: imageSize,
    is_at_infinity: isAtFocus,
  };

  return {
    parameters: { object_distance: absU, focal_length: f, object_height: h0 },
    measurements,
    formatted_measurements: [
      { key: 'object_distance_cartesian', label: 'Object Position (u)', value: measurements.object_distance_cartesian, unit: 'cm' },
      { key: 'focal_length', label: 'Focal Length (f)', value: measurements.focal_length, unit: 'cm' },
      {
        key: 'image_distance',
        label: 'Image Position (v)',
        value: isAtFocus ? '∞ (Infinity)' : measurements.image_distance,
        unit: isAtFocus ? '' : 'cm',
      },
      {
        key: 'magnification',
        label: 'Magnification (m = v/u)',
        value: isAtFocus ? 'Undefined (∞)' : measurements.magnification,
        unit: isAtFocus ? '' : '×',
      },
      { key: 'image_type', label: 'Image Nature', value: `${imageType}, ${imageOrientation}`, unit: '' },
      { key: 'optical_power_diopters', label: 'Optical Power (P)', value: measurements.optical_power_diopters, unit: 'D' },
    ],
    series_data: seriesData,
    special_case: specialCase,
    conclusion_summary: isAtFocus
      ? `At u = ${u} cm (equal to focal length f = +${f} cm), refracted rays emerge parallel and the image forms at infinity.`
      : `With u = ${u} cm and f = +${f} cm, the thin lens equation yields v = ${measurements.image_distance} cm and m = ${measurements.magnification} (${imageType}, ${imageOrientation}, ${imageSize}).`,
  };
}

export function runClientSimulation(experimentId, params) {
  switch (experimentId) {
    case 'ohms-law':
      return computeOhmsLaw(params);
    case 'simple-pendulum':
      return computeSimplePendulum(params);
    case 'projectile-motion':
      return computeProjectileMotion(params);
    case 'convex-lens':
      return computeConvexLens(params);
    default:
      throw new Error(`Unknown experiment: ${experimentId}`);
  }
}
