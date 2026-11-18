/**
 * Deterministic Mechanics Physics Engine for LabXAI Physics Playground.
 * Covers Newton's Laws, Inclined Plane, Projectile Motion, Free Fall,
 * Simple Pendulum, Hooke's Law Spring-Mass, and Pulley (Atwood Machine).
 */

const r = (v, d = 3) => Number(Number(v).toFixed(d));

export const MECHANICS_SCENES = [
  { id: 'inclined-plane', name: 'Inclined Plane (Ramp & Block)', category: 'Forces & Motion', description: 'Slide a block down a tilted ramp with adjustable mass, slope angle, friction μ, and gravity g.' },
  { id: 'newtons-laws', name: "Newton's Second Law (F = ma)", category: 'Forces & Motion', description: 'Push a block across a surface with applied force F, mass m, and kinetic friction μ.' },
  { id: 'projectile', name: 'Projectile Motion', category: 'Kinematics', description: 'Launch a ball at speed v₀ and angle θ under gravity g to measure apex height and range.' },
  { id: 'free-fall', name: 'Free Fall & Drop Timer', category: 'Kinematics', description: 'Drop a weight from height h under Earth, Moon, or Mars gravity.' },
  { id: 'pendulum', name: 'Simple Pendulum', category: 'Oscillations', description: 'Swing a pendulum bob of length L to measure period T = 2π√(L/g).' },
  { id: 'spring', name: "Hooke's Law Spring-Mass", category: 'Oscillations', description: 'Hang mass m on a spring of stiffness k to observe equilibrium stretch Δx = mg/k and SHM.' },
  { id: 'pulley', name: 'Pulley (Atwood Machine)', category: 'Forces & Motion', description: 'Connect two masses m₁ and m₂ over a frictionless pulley to compute acceleration and string tension.' },
];

export const MECHANICS_DEFAULTS = {
  scene: 'inclined-plane',
  mass: 4.0,
  mass2: 6.0,
  force: 25.0,
  angle: 30.0,
  friction: 0.15,
  gravity: 9.81,
  initialSpeed: 18.0,
  height: 25.0,
  length: 1.5,
  springK: 40.0,
};

export function evaluateMechanicsState(cfg, timeSec = 0) {
  const t = Math.max(0, Number(timeSec));
  const m = Math.max(0.1, Number(cfg.mass ?? 4));
  const m2 = Math.max(0.1, Number(cfg.mass2 ?? 6));
  const F = Number(cfg.force ?? 25);
  const angleDeg = Number(cfg.angle ?? 30);
  const rad = (angleDeg * Math.PI) / 180;
  const mu = Math.max(0, Number(cfg.friction ?? 0.15));
  const g = Math.max(0.5, Number(cfg.gravity ?? 9.81));
  const v0 = Math.max(1, Number(cfg.initialSpeed ?? 18));
  const h0 = Math.max(1, Number(cfg.height ?? 25));
  const L = Math.max(0.2, Number(cfg.length ?? 1.5));
  const k = Math.max(5, Number(cfg.springK ?? 40));

  switch (cfg.scene) {
    case 'inclined-plane': {
      const fParallel = m * g * Math.sin(rad);
      const normal = m * g * Math.cos(rad);
      const fFrictionMax = mu * normal;
      const fNet = Math.max(0, fParallel - fFrictionMax);
      const a = fNet / m;
      const rampLen = 10; // meters
      const maxT = a > 1e-4 ? Math.sqrt((2 * rampLen) / a) : 0;
      const tc = a > 1e-4 ? Math.min(t, maxT) : 0;
      const disp = 0.5 * a * tc * tc;
      const vel = a * tc;
      return {
        time: r(tc, 2),
        displacement: r(disp, 3),
        velocity: r(vel, 3),
        acceleration: r(a, 3),
        normalForce: r(normal, 2),
        frictionForce: r(Math.min(fParallel, fFrictionMax), 2),
        netForce: r(fNet, 2),
        finished: a > 1e-4 && t >= maxT,
        status: a <= 1e-4 ? 'Static Equilibrium (Friction holds block)' : `Sliding down ramp at a = ${r(a, 2)} m/s²`,
        progress: Math.min(1, disp / rampLen),
        formula: 'a = g(sin θ − μ cos θ)',
      };
    }

    case 'newtons-laws': {
      const normal = m * g;
      const fMax = mu * normal;
      const fNet = F > fMax ? F - fMax : 0;
      const a = fNet / m;
      const disp = 0.5 * a * t * t;
      const vel = a * t;
      return {
        time: r(t, 2),
        displacement: r(disp, 3),
        velocity: r(vel, 3),
        acceleration: r(a, 3),
        normalForce: r(normal, 2),
        frictionForce: r(Math.min(F, fMax), 2),
        netForce: r(fNet, 2),
        finished: disp >= 30,
        status: a <= 1e-4 ? `Static Equilibrium (Need F > ${r(fMax, 1)} N to move)` : `Accelerating at a = ${r(a, 2)} m/s²`,
        progress: Math.min(1, disp / 30),
        formula: 'F_net = F − μmg,  a = F_net / m',
      };
    }

    case 'projectile': {
      const vx = v0 * Math.cos(rad);
      const vy0 = v0 * Math.sin(rad);
      const tFlight = (2 * vy0) / g;
      const tc = Math.min(t, tFlight);
      const x = vx * tc;
      const y = Math.max(0, vy0 * tc - 0.5 * g * tc * tc);
      const vy = vy0 - g * tc;
      const speed = Math.hypot(vx, vy);
      const maxH = (vy0 * vy0) / (2 * g);
      const range = vx * tFlight;
      return {
        time: r(tc, 2),
        x: r(x, 2),
        y: r(y, 2),
        displacement: r(x, 2),
        velocity: r(speed, 2),
        acceleration: r(g, 2),
        maxHeight: r(maxH, 2),
        range: r(range, 2),
        timeOfFlight: r(tFlight, 2),
        finished: t >= tFlight,
        status: t >= tFlight ? `Landed at Range = ${r(range, 2)} m` : `In flight (Height = ${r(y, 2)} m)`,
        progress: tFlight > 0 ? Math.min(1, tc / tFlight) : 1,
        formula: 'x = v₀ cos(θ)t,  y = v₀ sin(θ)t − ½gt²',
      };
    }

    case 'free-fall': {
      const tHit = Math.sqrt((2 * h0) / g);
      const tc = Math.min(t, tHit);
      const fallen = 0.5 * g * tc * tc;
      const currH = Math.max(0, h0 - fallen);
      const vel = g * tc;
      return {
        time: r(tc, 2),
        displacement: r(fallen, 2),
        heightRemaining: r(currH, 2),
        velocity: r(vel, 2),
        acceleration: r(g, 2),
        impactTime: r(tHit, 2),
        impactSpeed: r(g * tHit, 2),
        finished: t >= tHit,
        status: t >= tHit ? `Hit ground at ${r(g * tHit, 2)} m/s` : `Falling (${r(currH, 1)} m above ground)`,
        progress: Math.min(1, fallen / h0),
        formula: 's = ½gt²,  v = gt',
      };
    }

    case 'pendulum': {
      const period = 2 * Math.PI * Math.sqrt(L / g);
      const omega = Math.sqrt(g / L);
      const theta0 = Math.min(45, Math.max(5, angleDeg)) * (Math.PI / 180);
      const theta = theta0 * Math.cos(omega * t);
      const angularVel = -theta0 * omega * Math.sin(omega * t);
      const linVel = Math.abs(angularVel * L);
      return {
        time: r(t, 2),
        angleDeg: r((theta * 180) / Math.PI, 2),
        displacement: r(L * Math.sin(theta), 3),
        velocity: r(linVel, 3),
        period: r(period, 3),
        frequency: r(1 / period, 3),
        finished: false,
        status: `Oscillating with Period T = ${r(period, 2)} s`,
        progress: (t % period) / period,
        formula: 'T = 2π√(L / g)',
      };
    }

    case 'spring': {
      const eqStretch = (m * g) / k;
      const omega = Math.sqrt(k / m);
      const period = (2 * Math.PI) / omega;
      const amp = Math.min(0.45, eqStretch * 0.65);
      const xOff = amp * Math.cos(omega * t);
      const totalStretch = eqStretch + xOff;
      const vel = -amp * omega * Math.sin(omega * t);
      const springForce = k * totalStretch;
      return {
        time: r(t, 2),
        equilibriumStretch: r(eqStretch, 3),
        displacement: r(totalStretch, 3),
        velocity: r(vel, 3),
        springForce: r(springForce, 2),
        period: r(period, 3),
        finished: false,
        status: `Equilibrium stretch = ${r(eqStretch, 3)} m · T = ${r(period, 2)} s`,
        progress: (t % period) / period,
        formula: 'F = −k·x,  Δx_eq = mg/k,  T = 2π√(m/k)',
      };
    }

    case 'pulley':
    default: {
      const a = ((m2 - m) / (m + m2)) * g;
      const tension = ((2 * m * m2) / (m + m2)) * g;
      const maxD = 4.0;
      const absA = Math.abs(a);
      const maxT = absA > 1e-4 ? Math.sqrt((2 * maxD) / absA) : 0;
      const tc = absA > 1e-4 ? Math.min(t, maxT) : 0;
      const disp = 0.5 * a * tc * tc;
      const vel = a * tc;
      return {
        time: r(tc, 2),
        displacement: r(disp, 3),
        velocity: r(vel, 3),
        acceleration: r(a, 3),
        tension: r(tension, 2),
        finished: absA > 1e-4 && t >= maxT,
        status:
          Math.abs(m2 - m) < 1e-4
            ? 'Balanced (m₁ = m₂, a = 0)'
            : m2 > m
            ? `m₂ (${m2} kg) descending at ${r(absA, 2)} m/s²`
            : `m₁ (${m} kg) descending at ${r(absA, 2)} m/s²`,
        progress: Math.max(-1, Math.min(1, disp / maxD)),
        formula: 'a = g(m₂ − m₁)/(m₁ + m₂),  T = 2m₁m₂g/(m₁ + m₂)',
      };
    }
  }
}
