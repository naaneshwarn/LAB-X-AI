/**
 * Deterministic client-side calculation engines for the 8 additional Physics experiments,
 * mirroring backend/app/services/simulations/physics_sim.py for zero-latency interactivity.
 */

const C_LIGHT = 2.99792458e8;
const R_GAS = 8.314462618;
const HC_EV_NM = 1239.841984;
const ME_KG = 9.1093837015e-31;
const EV_J = 1.602176634e-19;

const round = (v, d = 4) => Number(Number(v).toFixed(d));

export function computeReflectionOfLight({ incident_angle = 35, mirror_inclination = 90 }) {
  const ai = Number(incident_angle);
  const alpha = Number(mirror_inclination);
  if (ai < 0 || ai > 89) throw new Error('Incident angle must be between 0° and 89°.');
  if (alpha < 15 || alpha > 180) throw new Error('Mirror angle must be between 15° and 180°.');
  const grazing = 90 - ai;
  const deviation = 180 - 2 * ai;
  const ratio = 360 / alpha;
  const images = Math.abs(ratio - Math.round(ratio)) < 1e-6 ? Math.round(ratio) - 1 : Math.floor(ratio);
  const series_data = [];
  for (let a = 0; a < 90; a += 5) {
    series_data.push({ incident_angle: a, reflected_angle: a, deviation: 180 - 2 * a });
  }
  const measurements = {
    incident_angle: round(ai, 2),
    reflected_angle: round(ai, 2),
    grazing_angle: round(grazing, 2),
    deviation_angle: round(deviation, 2),
    mirror_inclination: round(alpha, 2),
    images_between_mirrors: images,
  };
  return {
    parameters: { incident_angle: ai, mirror_inclination: alpha },
    measurements,
    formatted_measurements: [
      { key: 'incident_angle', label: 'Angle of Incidence (θᵢ)', value: measurements.incident_angle, unit: '°' },
      { key: 'reflected_angle', label: 'Angle of Reflection (θᵣ)', value: measurements.reflected_angle, unit: '°' },
      { key: 'grazing_angle', label: 'Glancing Angle (g)', value: measurements.grazing_angle, unit: '°' },
      { key: 'deviation_angle', label: 'Angle of Deviation (δ)', value: measurements.deviation_angle, unit: '°' },
      { key: 'images_between_mirrors', label: 'Images (Two Mirrors)', value: images, unit: 'images' },
    ],
    series_data,
    special_case: ai === 0 ? 'normal_incidence' : null,
    conclusion_summary: `At θᵢ = ${measurements.incident_angle}°, θᵣ = ${measurements.reflected_angle}° with deviation δ = ${measurements.deviation_angle}°. Two mirrors at ${alpha}° form ${images} images.`,
  };
}

export function computeRefractionOfLight({ incident_angle = 30, n1 = 1.0, n2 = 1.5 }) {
  const a1 = Number(incident_angle);
  const N1 = Number(n1);
  const N2 = Number(n2);
  if (a1 < 0 || a1 > 89) throw new Error('Incident angle must be between 0° and 89°.');
  if (N1 < 1 || N2 < 1) throw new Error('Refractive indices must be ≥ 1.0.');
  const sinT2 = (N1 / N2) * Math.sin((a1 * Math.PI) / 180);
  const critical = N1 > N2 ? (Math.asin(N2 / N1) * 180) / Math.PI : null;
  const isTir = sinT2 > 1.0;
  const a2 = isTir ? null : (Math.asin(Math.min(1, Math.max(-1, sinT2))) * 180) / Math.PI;
  const deviation = isTir ? 180 - 2 * a1 : Math.abs(a1 - a2);
  const v1 = C_LIGHT / N1 / 1e8;
  const v2 = C_LIGHT / N2 / 1e8;
  const series_data = [];
  for (let a = 0; a <= 85; a += 5) {
    const s2 = (N1 / N2) * Math.sin((a * Math.PI) / 180);
    if (s2 <= 1) series_data.push({ incident_angle: a, refracted_angle: round((Math.asin(s2) * 180) / Math.PI, 2) });
  }
  const measurements = {
    incident_angle: round(a1, 2),
    n1: round(N1, 3),
    n2: round(N2, 3),
    refracted_angle: a2 !== null ? round(a2, 2) : null,
    critical_angle: critical !== null ? round(critical, 2) : null,
    total_internal_reflection: isTir,
    deviation_angle: round(deviation, 2),
    speed_medium_1: round(v1, 3),
    speed_medium_2: round(v2, 3),
  };
  return {
    parameters: { incident_angle: a1, n1: N1, n2: N2 },
    measurements,
    formatted_measurements: [
      { key: 'refracted_angle', label: 'Refracted Angle (θ₂)', value: isTir ? 'TIR (Reflected)' : measurements.refracted_angle, unit: isTir ? '' : '°' },
      { key: 'critical_angle', label: 'Critical Angle (θc)', value: critical !== null ? measurements.critical_angle : 'N/A', unit: critical !== null ? '°' : '' },
      { key: 'deviation_angle', label: 'Ray Deviation', value: measurements.deviation_angle, unit: '°' },
      { key: 'speed_medium_1', label: 'Speed in Medium 1', value: measurements.speed_medium_1, unit: '×10⁸ m/s' },
      { key: 'speed_medium_2', label: 'Speed in Medium 2', value: measurements.speed_medium_2, unit: '×10⁸ m/s' },
    ],
    series_data,
    special_case: isTir ? 'total_internal_reflection' : null,
    conclusion_summary: isTir
      ? `Total Internal Reflection occurs because n₁ (${N1}) > n₂ (${N2}) and θ₁ (${a1}°) > θc (${measurements.critical_angle}°).`
      : `By Snell's Law (n₁ sin θ₁ = n₂ sin θ₂), θ₁ = ${a1}° refracts to θ₂ = ${measurements.refracted_angle}°.`,
  };
}

export function computeSeriesParallel({ voltage = 12, r1 = 10, r2 = 20, r3 = 30, mode = 0 }) {
  const V = Number(voltage);
  const R1 = Number(r1);
  const R2 = Number(r2);
  const R3 = Number(r3);
  const m = Math.round(Number(mode));
  if (R1 <= 0 || R2 <= 0 || R3 <= 0) throw new Error('All resistor values must exceed 0 Ω.');
  let rEq, iTot, i1, i2, i3, v1, v2, v3, modeName;
  if (m === 0) {
    modeName = 'Series';
    rEq = R1 + R2 + R3;
    iTot = V / rEq;
    i1 = i2 = i3 = iTot;
    v1 = iTot * R1;
    v2 = iTot * R2;
    v3 = iTot * R3;
  } else {
    modeName = 'Parallel';
    rEq = 1 / (1 / R1 + 1 / R2 + 1 / R3);
    i1 = V / R1;
    i2 = V / R2;
    i3 = V / R3;
    iTot = i1 + i2 + i3;
    v1 = v2 = v3 = V;
  }
  const power = V * iTot;
  const series_data = [];
  for (let k = 0; k <= 10; k += 1) {
    const vp = round((V * k) / 10, 2);
    series_data.push({
      voltage: vp,
      series_current: round(vp / (R1 + R2 + R3), 4),
      parallel_current: round(vp * (1 / R1 + 1 / R2 + 1 / R3), 4),
    });
  }
  const measurements = {
    mode_name: modeName,
    equivalent_resistance: round(rEq, 4),
    total_current: round(iTot, 4),
    total_power: round(power, 4),
    v1: round(v1, 2),
    v2: round(v2, 2),
    v3: round(v3, 2),
    i1: round(i1, 3),
    i2: round(i2, 3),
    i3: round(i3, 3),
  };
  return {
    parameters: { voltage: V, r1: R1, r2: R2, r3: R3, mode: m },
    measurements,
    formatted_measurements: [
      { key: 'mode_name', label: 'Configuration', value: modeName, unit: '' },
      { key: 'equivalent_resistance', label: 'Equivalent Resistance (Req)', value: measurements.equivalent_resistance, unit: 'Ω' },
      { key: 'total_current', label: 'Total Current (I_total)', value: measurements.total_current, unit: 'A' },
      { key: 'total_power', label: 'Total Power (P)', value: measurements.total_power, unit: 'W' },
      { key: 'v1', label: 'Drops V₁/V₂/V₃', value: `${measurements.v1} / ${measurements.v2} / ${measurements.v3}`, unit: 'V' },
      { key: 'i1', label: 'Currents I₁/I₂/I₃', value: `${measurements.i1} / ${measurements.i2} / ${measurements.i3}`, unit: 'A' },
    ],
    series_data,
    special_case: m === 0 ? 'series_circuit' : 'parallel_circuit',
    conclusion_summary: `${modeName} circuit gives Req = ${measurements.equivalent_resistance} Ω, I_total = ${measurements.total_current} A, P = ${measurements.total_power} W.`,
  };
}

export function computeNewtonsLaws({ mass = 5, applied_force = 30, friction_coeff = 0.2, time = 4 }) {
  const m = Number(mass);
  const F = Number(applied_force);
  const mu = Number(friction_coeff);
  const t = Number(time);
  if (m <= 0) throw new Error('Mass must be strictly positive.');
  const N = m * 9.81;
  const fMax = mu * N;
  const isStatic = F <= fMax;
  const friction = isStatic ? F : fMax;
  const fNet = isStatic ? 0 : F - fMax;
  const a = fNet / m;
  const v = a * t;
  const s = 0.5 * a * t * t;
  const p = m * v;
  const series_data = [];
  for (let i = 0; i <= 12; i += 1) {
    const tp = round((t * i) / 12, 2);
    series_data.push({ time: tp, velocity: round(a * tp, 2), displacement: round(0.5 * a * tp * tp, 2) });
  }
  const measurements = {
    normal_force: round(N, 2),
    friction_force: round(friction, 2),
    net_force: round(fNet, 2),
    acceleration: round(a, 4),
    final_velocity: round(v, 2),
    displacement: round(s, 2),
    momentum: round(p, 2),
  };
  return {
    parameters: { mass: m, applied_force: F, friction_coeff: mu, time: t },
    measurements,
    formatted_measurements: [
      { key: 'net_force', label: 'Net Force (F_net)', value: measurements.net_force, unit: 'N' },
      { key: 'friction_force', label: 'Friction Force (f)', value: measurements.friction_force, unit: 'N' },
      { key: 'acceleration', label: 'Acceleration (a = F/m)', value: measurements.acceleration, unit: 'm/s²' },
      { key: 'final_velocity', label: 'Final Velocity (v)', value: measurements.final_velocity, unit: 'm/s' },
      { key: 'displacement', label: 'Displacement (s)', value: measurements.displacement, unit: 'm' },
      { key: 'momentum', label: 'Momentum (p = mv)', value: measurements.momentum, unit: 'kg·m/s' },
    ],
    series_data,
    special_case: isStatic ? 'static_equilibrium' : 'accelerated_motion',
    conclusion_summary: isStatic
      ? `Friction (${round(fMax, 2)} N max) balances F = ${F} N, keeping the block at rest (a = 0 m/s²).`
      : `F_net = ${measurements.net_force} N accelerates m = ${m} kg at a = ${measurements.acceleration} m/s², covering ${measurements.displacement} m in ${t} s.`,
  };
}

export function computeEMInduction({ turns = 200, magnetic_field = 0.5, coil_area = 0.04, frequency = 5, resistance = 10 }) {
  const N = Math.round(Number(turns));
  const B = Number(magnetic_field);
  const A = Number(coil_area);
  const f = Number(frequency);
  const R = Number(resistance);
  if (R <= 0) throw new Error('Resistance must exceed 0 Ω.');
  const omega = 2 * Math.PI * f;
  const maxFlux = B * A;
  const peakEmf = N * B * A * omega;
  const rmsEmf = peakEmf / Math.SQRT2;
  const peakI = peakEmf / R;
  const avgP = (rmsEmf * rmsEmf) / R;
  const period = 1 / f;
  const series_data = [];
  for (let i = 0; i <= 24; i += 1) {
    const tp = (period * i) / 24;
    series_data.push({ time: round(tp, 4), emf: round(peakEmf * Math.sin(omega * tp), 3), flux: round(maxFlux * Math.cos(omega * tp), 5) });
  }
  const measurements = {
    max_flux: round(maxFlux, 5),
    angular_velocity: round(omega, 3),
    peak_emf: round(peakEmf, 3),
    rms_emf: round(rmsEmf, 3),
    peak_current: round(peakI, 4),
    average_power: round(avgP, 3),
  };
  return {
    parameters: { turns: N, magnetic_field: B, coil_area: A, frequency: f, resistance: R },
    measurements,
    formatted_measurements: [
      { key: 'max_flux', label: 'Max Magnetic Flux (Φ₀)', value: measurements.max_flux, unit: 'Wb' },
      { key: 'peak_emf', label: 'Peak Induced EMF (ε₀)', value: measurements.peak_emf, unit: 'V' },
      { key: 'rms_emf', label: 'RMS EMF (ε_rms)', value: measurements.rms_emf, unit: 'V' },
      { key: 'peak_current', label: 'Peak Current', value: measurements.peak_current, unit: 'A' },
      { key: 'average_power', label: 'Average Power', value: measurements.average_power, unit: 'W' },
    ],
    series_data,
    special_case: null,
    conclusion_summary: `AC generator induces ε₀ = ${measurements.peak_emf} V (ε_rms = ${measurements.rms_emf} V) and average power ${measurements.average_power} W.`,
  };
}

export function computeWaveInterference({ wavelength = 550, slit_separation = 0.5, slit_width = 0.1, screen_distance = 1.5 }) {
  const lamNm = Number(wavelength);
  const dMm = Number(slit_separation);
  const aMm = Number(slit_width);
  const D = Number(screen_distance);
  if (aMm >= dMm) throw new Error('Slit width (a) must be strictly smaller than slit separation (d).');
  const lam = lamNm * 1e-9;
  const d = dMm * 1e-3;
  const a = aMm * 1e-3;
  const fringeMm = ((lam * D) / d) * 1e3;
  const centralMm = ((2 * lam * D) / a) * 1e3;
  const firstAngle = (Math.asin(Math.min(1, lam / d)) * 180) / Math.PI;
  const maxY = Math.min(15, Math.max(5, 4 * fringeMm));
  const series_data = [];
  for (let i = -30; i <= 30; i += 1) {
    const yMm = (maxY * i) / 30;
    const yM = yMm * 1e-3;
    const beta = (Math.PI * d * yM) / (lam * D);
    const alpha = (Math.PI * a * yM) / (lam * D);
    const sinc = Math.abs(alpha) < 1e-9 ? 1 : Math.sin(alpha) / alpha;
    series_data.push({ position_mm: round(yMm, 2), intensity: round(Math.cos(beta) ** 2 * sinc ** 2, 4), envelope: round(sinc ** 2, 4) });
  }
  const measurements = {
    wavelength_nm: round(lamNm, 1),
    fringe_width_mm: round(fringeMm, 4),
    central_diffraction_width_mm: round(centralMm, 4),
    first_order_angle_deg: round(firstAngle, 4),
    fringes_in_central_max: round((2 * dMm) / aMm - 1, 2),
  };
  return {
    parameters: { wavelength: lamNm, slit_separation: dMm, slit_width: aMm, screen_distance: D },
    measurements,
    formatted_measurements: [
      { key: 'fringe_width_mm', label: 'Fringe Width (β)', value: measurements.fringe_width_mm, unit: 'mm' },
      { key: 'central_diffraction_width_mm', label: 'Central Max Width', value: measurements.central_diffraction_width_mm, unit: 'mm' },
      { key: 'first_order_angle_deg', label: '1st-Order Angle', value: measurements.first_order_angle_deg, unit: '°' },
      { key: 'fringes_in_central_max', label: 'Fringes in Central Max', value: measurements.fringes_in_central_max, unit: '' },
    ],
    series_data,
    special_case: null,
    conclusion_summary: `At λ = ${lamNm} nm, interference fringes are spaced by β = ${measurements.fringe_width_mm} mm within a ${measurements.central_diffraction_width_mm} mm central diffraction envelope.`,
  };
}

export function computeThermodynamicProcesses({ moles = 1, initial_temp = 300, initial_volume = 0.01, final_volume = 0.025, process_type = 0 }) {
  const n = Number(moles);
  const T1 = Number(initial_temp);
  const V1 = Number(initial_volume);
  const V2 = Number(final_volume);
  const pt = Math.round(Number(process_type));
  const gamma = 1.4;
  const cv = R_GAS / (gamma - 1);
  const P1 = (n * R_GAS * T1) / V1;
  const names = ['Isothermal', 'Isobaric', 'Adiabatic', 'Isochoric'];
  const name = names[pt] || 'Isothermal';
  let T2, P2, W, dU, Q;
  if (pt === 0) {
    T2 = T1; P2 = P1 * (V1 / V2); W = n * R_GAS * T1 * Math.log(V2 / V1); dU = 0; Q = W;
  } else if (pt === 1) {
    P2 = P1; T2 = T1 * (V2 / V1); W = P1 * (V2 - V1); dU = n * cv * (T2 - T1); Q = dU + W;
  } else if (pt === 2) {
    P2 = P1 * (V1 / V2) ** gamma; T2 = T1 * (V1 / V2) ** (gamma - 1); dU = n * cv * (T2 - T1); W = -dU; Q = 0;
  } else {
    T2 = T1 * (V2 / V1); P2 = P1 * (T2 / T1); W = 0; dU = n * cv * (T2 - T1); Q = dU;
  }
  const series_data = [];
  for (let i = 0; i <= 16; i += 1) {
    const f = i / 16;
    const vp = pt === 3 ? V1 : V1 + (V2 - V1) * f;
    let pp = P1;
    if (pt === 0) pp = P1 * (V1 / vp);
    else if (pt === 2) pp = P1 * (V1 / vp) ** gamma;
    else if (pt === 3) pp = P1 + (P2 - P1) * f;
    series_data.push({ volume_L: round(vp * 1000, 2), pressure_kPa: round(pp / 1000, 2) });
  }
  const measurements = {
    process_name: name,
    p1_kPa: round(P1 / 1000, 2),
    p2_kPa: round(P2 / 1000, 2),
    t2_K: round(T2, 2),
    work_J: round(W, 2),
    delta_u_J: round(dU, 2),
    heat_q_J: round(Q, 2),
  };
  return {
    parameters: { moles: n, initial_temp: T1, initial_volume: V1, final_volume: V2, process_type: pt },
    measurements,
    formatted_measurements: [
      { key: 'process_name', label: 'Process', value: name, unit: '' },
      { key: 'p1_kPa', label: 'P₁ / P₂', value: `${measurements.p1_kPa} → ${measurements.p2_kPa}`, unit: 'kPa' },
      { key: 't2_K', label: 'Final Temp (T₂)', value: measurements.t2_K, unit: 'K' },
      { key: 'work_J', label: 'Work Done (W)', value: measurements.work_J, unit: 'J' },
      { key: 'delta_u_J', label: 'Internal Energy ΔU', value: measurements.delta_u_J, unit: 'J' },
      { key: 'heat_q_J', label: 'Heat (Q = ΔU + W)', value: measurements.heat_q_J, unit: 'J' },
    ],
    series_data,
    special_case: name.toLowerCase(),
    conclusion_summary: `${name}: Q = ${measurements.heat_q_J} J, ΔU = ${measurements.delta_u_J} J, W = ${measurements.work_J} J (First Law verified).`,
  };
}

export function computePhotoelectricEffect({ wavelength = 300, work_function = 2.3, intensity = 50 }) {
  const lam = Number(wavelength);
  const phi = Number(work_function);
  const inten = Number(intensity);
  const E = HC_EV_NM / lam;
  const fThz = C_LIGHT / (lam * 1e-9) / 1e12;
  const lam0 = HC_EV_NM / phi;
  const emits = E > phi;
  const kMax = emits ? E - phi : 0;
  const vMax = emits ? Math.sqrt((2 * kMax * EV_J) / ME_KG) / 1000 : 0;
  const current = emits ? round(0.45 * inten, 2) : 0;
  const series_data = [];
  for (let f = 300; f <= 2000; f += 150) {
    const ePt = (6.62607015e-34 * (f * 1e12)) / EV_J;
    series_data.push({ frequency_THz: f, k_max_eV: round(Math.max(0, ePt - phi), 3) });
  }
  const measurements = {
    photon_energy_ev: round(E, 4),
    frequency_thz: round(fThz, 2),
    threshold_wavelength_nm: round(lam0, 2),
    emission_occurs: emits,
    k_max_ev: round(kMax, 4),
    stopping_potential_v: round(kMax, 4),
    max_electron_speed_kms: round(vMax, 2),
    photocurrent_ua: current,
  };
  return {
    parameters: { wavelength: lam, work_function: phi, intensity: inten },
    measurements,
    formatted_measurements: [
      { key: 'photon_energy_ev', label: 'Photon Energy (E)', value: measurements.photon_energy_ev, unit: 'eV' },
      { key: 'threshold_wavelength_nm', label: 'Threshold λ₀', value: measurements.threshold_wavelength_nm, unit: 'nm' },
      { key: 'k_max_ev', label: 'Max Kinetic Energy', value: measurements.k_max_ev, unit: 'eV' },
      { key: 'stopping_potential_v', label: 'Stopping Potential (V₀)', value: measurements.stopping_potential_v, unit: 'V' },
      { key: 'max_electron_speed_kms', label: 'Max Electron Speed', value: measurements.max_electron_speed_kms, unit: 'km/s' },
      { key: 'photocurrent_ua', label: 'Photocurrent', value: current, unit: 'μA' },
    ],
    series_data,
    special_case: emits ? 'photoemission_active' : 'below_threshold',
    conclusion_summary: emits
      ? `E = ${measurements.photon_energy_ev} eV > φ (${phi} eV): photoelectrons emit with K_max = ${measurements.k_max_ev} eV (V₀ = ${measurements.stopping_potential_v} V).`
      : `E = ${measurements.photon_energy_ev} eV ≤ φ (${phi} eV): below threshold — zero photoemission regardless of intensity.`,
  };
}
