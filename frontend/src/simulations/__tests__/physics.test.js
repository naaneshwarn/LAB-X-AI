import { describe, expect, it } from 'vitest';
import {
  computeConvexLens,
  computeOhmsLaw,
  computeProjectileMotion,
  computeSimplePendulum,
} from '../physics';

describe('LabXAI Frontend Deterministic Physics Engine', () => {
  it('computes Ohm Law accurately and rejects zero resistance', () => {
    const res = computeOhmsLaw({ voltage: 12, resistance: 4 });
    expect(res.measurements.current).toBeCloseTo(3.0, 4);
    expect(res.measurements.power).toBeCloseTo(36.0, 4);
    expect(() => computeOhmsLaw({ voltage: 12, resistance: 0 })).toThrow();
  });

  it('computes Simple Pendulum T = 2*pi*sqrt(L/g) and angle correction', () => {
    const res = computeSimplePendulum({ length: 1.0, gravity: 9.81, initial_angle: 10, oscillations: 10 });
    expect(res.measurements.time_period).toBeCloseTo(2.006, 2);
    expect(res.measurements.frequency).toBeCloseTo(0.4985, 3);
    const large = computeSimplePendulum({ length: 1.0, gravity: 9.81, initial_angle: 45, oscillations: 5 });
    expect(large.measurements.corrected_time_period).toBeGreaterThan(large.measurements.time_period);
  });

  it('computes Projectile Motion exact kinematics and complementary ranges', () => {
    const exact = computeProjectileMotion({ initial_velocity: 20, launch_angle: 30, gravity: 10 });
    expect(exact.measurements.time_of_flight).toBeCloseTo(2.0, 4);
    expect(exact.measurements.max_height).toBeCloseTo(5.0, 4);

    const r30 = computeProjectileMotion({ initial_velocity: 25, launch_angle: 30, gravity: 9.81 });
    const r60 = computeProjectileMotion({ initial_velocity: 25, launch_angle: 60, gravity: 9.81 });
    expect(r30.measurements.horizontal_range).toBeCloseTo(r60.measurements.horizontal_range, 3);
  });

  it('computes Convex Lens Cartesian equation and handles |u| = f singularity', () => {
    const at2F = computeConvexLens({ object_distance: 30, focal_length: 15, object_height: 4 });
    expect(at2F.measurements.image_distance).toBeCloseTo(30, 3);
    expect(at2F.measurements.magnification).toBeCloseTo(-1, 3);
    expect(at2F.measurements.image_type).toBe('Real');

    const virtualImg = computeConvexLens({ object_distance: 10, focal_length: 15, object_height: 4 });
    expect(virtualImg.measurements.image_distance).toBeCloseTo(-30, 3);
    expect(virtualImg.measurements.image_type).toBe('Virtual');
    expect(virtualImg.measurements.image_orientation).toBe('Upright');

    const singular = computeConvexLens({ object_distance: 15, focal_length: 15, object_height: 4 });
    expect(singular.measurements.is_at_infinity).toBe(true);
    expect(singular.measurements.image_distance).toBeNull();
  });
});
