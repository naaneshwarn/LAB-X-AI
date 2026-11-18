/**
 * Deterministic Geometric Optics Engine for LabXAI Physics Playground.
 * Supports:
 * - Plane, Concave, and Convex Mirrors (Reflection law & Mirror formula 1/f = 1/v + 1/u)
 * - Convex and Concave Lenses (Thin lens formula 1/f = 1/v - 1/u, magnification m = v/u)
 * - Glass Prism Dispersion (Snell's Law with Cauchy refractive index n(λ) across visible spectrum)
 */

const r = (v, d = 3) => Number(Number(v).toFixed(d));

export const OPTICS_ELEMENTS = [
  { id: 'convex-lens', name: 'Convex Lens (Converging)', category: 'Lenses', description: 'Converges parallel rays to a focal point (+f); forms real or magnified virtual images.' },
  { id: 'concave-lens', name: 'Concave Lens (Diverging)', category: 'Lenses', description: 'Diverges parallel rays (−f); always forms an upright, diminished virtual image.' },
  { id: 'concave-mirror', name: 'Concave Mirror', category: 'Mirrors', description: 'Converging mirror used in telescopes, headlights, and solar concentrators.' },
  { id: 'plane-mirror', name: 'Plane Mirror (Reflection)', category: 'Mirrors', description: 'Demonstrates Law of Reflection: Angle of Incidence θᵢ = Angle of Reflection θᵣ.' },
  { id: 'prism', name: 'Glass Prism (Dispersion)', category: 'Refraction', description: 'Splits white light into VIBGYOR spectrum via wavelength-dependent Snell refraction.' },
];

export const OPTICS_DEFAULTS = {
  element: 'convex-lens',
  focalLength: 15, // cm
  objectDistance: 30, // cm (positive magnitude)
  objectHeight: 4, // cm
  incidentAngle: 42, // degrees (for plane mirror & prism)
  prismApexAngle: 60, // degrees
};

const PRISM_SPECTRUM = [
  { name: 'Red', wavelengthNm: 656, n: 1.514, color: '#ef4444' },
  { name: 'Orange', wavelengthNm: 610, n: 1.517, color: '#f97316' },
  { name: 'Yellow', wavelengthNm: 589, n: 1.519, color: '#eab308' },
  { name: 'Green', wavelengthNm: 532, n: 1.523, color: '#22c55e' },
  { name: 'Blue', wavelengthNm: 486, n: 1.529, color: '#2563eb' },
  { name: 'Violet', wavelengthNm: 405, n: 1.541, color: '#7c3aed' },
];

export function evaluateOptics(cfg) {
  const el = cfg.element || 'convex-lens';
  const fMag = Math.max(5, Number(cfg.focalLength ?? 15));
  const uMag = Math.max(2, Number(cfg.objectDistance ?? 30));
  const hObj = Math.max(1, Number(cfg.objectHeight ?? 4));
  const thetaI = Math.max(5, Math.min(80, Number(cfg.incidentAngle ?? 42)));
  const apexDeg = Math.max(30, Math.min(75, Number(cfg.prismApexAngle ?? 60)));

  if (el === 'plane-mirror') {
    const dev = 180 - 2 * thetaI;
    return {
      element: el,
      incidentAngle: r(thetaI, 1),
      reflectedAngle: r(thetaI, 1),
      deviationAngle: r(dev, 1),
      imageNature: 'Virtual, Upright, Laterally Inverted (Same Size)',
      magnification: 1.0,
      formula: 'θᵢ = θᵣ,  δ = 180° − 2θᵢ',
      summary: `Ray strikes mirror at ${r(thetaI, 1)}° and reflects at ${r(thetaI, 1)}° (deviation = ${r(dev, 1)}°).`,
    };
  }

  if (el === 'prism') {
    const i1 = (thetaI * Math.PI) / 180;
    const A = (apexDeg * Math.PI) / 180;
    const rays = PRISM_SPECTRUM.map((band) => {
      const r1 = Math.asin(Math.min(0.999, Math.sin(i1) / band.n));
      const r2 = A - r1;
      const sinI2 = band.n * Math.sin(r2);
      const tir = Math.abs(sinI2) >= 1;
      const i2 = tir ? null : Math.asin(sinI2);
      const deviationDeg = tir ? null : ((i1 + i2 - A) * 180) / Math.PI;
      return {
        ...band,
        refracted1Deg: r((r1 * 180) / Math.PI, 2),
        emergentDeg: i2 !== null ? r((i2 * 180) / Math.PI, 2) : null,
        deviationDeg: deviationDeg !== null ? r(deviationDeg, 2) : null,
        tir,
      };
    });
    const redDev = rays[0].deviationDeg;
    const violetDev = rays[rays.length - 1].deviationDeg;
    const angularSpread = redDev !== null && violetDev !== null ? r(violetDev - redDev, 2) : null;
    return {
      element: el,
      incidentAngle: r(thetaI, 1),
      prismApexAngle: r(apexDeg, 1),
      rays,
      redDeviation: redDev,
      violetDeviation: violetDev,
      angularDispersion: angularSpread,
      formula: 'n₁ sin θ₁ = n₂ sin θ₂,  δ = i₁ + i₂ − A',
      summary:
        angularSpread !== null
          ? `White light disperses across ${angularSpread}° (Red δ = ${redDev}°, Violet δ = ${violetDev}°).`
          : 'Total internal reflection occurs for shorter wavelengths at this angle — increase incident angle.',
    };
  }

  if (el === 'concave-mirror') {
    // Sign convention: u = -uMag, f = -fMag, 1/v = 1/f - 1/u
    const f = -fMag;
    const u = -uMag;
    if (Math.abs(uMag - fMag) < 0.2) {
      return {
        element: el,
        focalLength: f,
        objectDistance: u,
        imageDistance: null,
        magnification: null,
        imageHeight: null,
        imageNature: 'At Infinity (Parallel Reflected Rays)',
        formula: '1/f = 1/v + 1/u,  m = −v/u',
        summary: 'Object sits at the focal point (u = f): reflected rays emerge parallel (image at infinity).',
      };
    }
    const v = 1 / (1 / f - 1 / u);
    const m = -v / u;
    const hImg = m * hObj;
    const nature = v < 0 ? 'Real & Inverted' : 'Virtual & Upright';
    return {
      element: el,
      focalLength: r(f, 2),
      objectDistance: r(u, 2),
      imageDistance: r(v, 2),
      magnification: r(m, 3),
      imageHeight: r(hImg, 2),
      imageNature: nature,
      formula: '1/f = 1/v + 1/u,  m = −v/u',
      summary: `Concave mirror (f=${f} cm) with object at ${uMag} cm forms a ${nature} image at v = ${r(v, 2)} cm (m = ${r(m, 2)}×).`,
    };
  }

  // Thin Lenses (Convex: +f, Concave: -f): 1/v = 1/f + 1/u with u = -uMag
  const f = el === 'concave-lens' ? -fMag : fMag;
  const u = -uMag;
  if (el === 'convex-lens' && Math.abs(uMag - fMag) < 0.2) {
    return {
      element: el,
      focalLength: f,
      objectDistance: u,
      imageDistance: null,
      magnification: null,
      imageHeight: null,
      opticalPowerD: r(100 / f, 2),
      imageNature: 'At Infinity (Parallel Refracted Rays)',
      formula: '1/f = 1/v − 1/u,  m = v/u,  P = 100/f (D)',
      summary: 'Object at focal point (|u| = f): rays emerge parallel to infinity.',
    };
  }
  const v = 1 / (1 / f + 1 / u);
  const m = v / u;
  const hImg = m * hObj;
  const nature = v > 0 ? 'Real & Inverted' : 'Virtual & Upright';
  return {
    element: el,
    focalLength: r(f, 2),
    objectDistance: r(u, 2),
    imageDistance: r(v, 2),
    magnification: r(m, 3),
    imageHeight: r(hImg, 2),
    opticalPowerD: r(100 / f, 2),
    imageNature: nature,
    formula: '1/f = 1/v − 1/u,  m = v/u,  P = 100/f (D)',
    summary: `${el === 'convex-lens' ? 'Convex' : 'Concave'} lens (f=${f} cm, P=${r(100 / f, 2)} D) forms a ${nature} image at v = ${r(v, 2)} cm (m = ${r(m, 2)}×).`,
  };
}
