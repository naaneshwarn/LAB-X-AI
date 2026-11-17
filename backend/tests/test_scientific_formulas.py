"""Deterministic scientific formula verification against analytical reference cases."""

import math
import pytest

from app.services.simulation_engine import (
    SimulationValidationError,
    simulate_convex_lens,
    simulate_ohms_law,
    simulate_projectile_motion,
    simulate_simple_pendulum,
)


class TestOhmsLaw:
    def test_standard_circuit(self):
        result = simulate_ohms_law({"voltage": 12.0, "resistance": 4.0})
        m = result["measurements"]
        assert m["current"] == pytest.approx(3.0, rel=1e-4)
        assert m["power"] == pytest.approx(36.0, rel=1e-4)
        assert m["conductance"] == pytest.approx(0.25, rel=1e-4)

    def test_zero_resistance_rejected(self):
        with pytest.raises(SimulationValidationError, match="strictly greater than 0"):
            simulate_ohms_law({"voltage": 12.0, "resistance": 0.0})

    def test_negative_resistance_rejected(self):
        with pytest.raises(SimulationValidationError):
            simulate_ohms_law({"voltage": 5.0, "resistance": -10.0})


class TestSimplePendulum:
    def test_seconds_pendulum_earth(self):
        result = simulate_simple_pendulum(
            {"length": 1.0, "gravity": 9.81, "initial_angle": 10.0, "oscillations": 10}
        )
        m = result["measurements"]
        expected_t = 2.0 * math.pi * math.sqrt(1.0 / 9.81)
        assert m["time_period"] == pytest.approx(expected_t, rel=1e-3)
        assert m["frequency"] == pytest.approx(1.0 / expected_t, rel=1e-3)
        assert m["total_time_for_oscillations"] == pytest.approx(10 * expected_t, rel=1e-3)

    def test_quadruple_length_doubles_period(self):
        r1 = simulate_simple_pendulum({"length": 1.0, "gravity": 9.81, "initial_angle": 5.0, "oscillations": 5})
        r4 = simulate_simple_pendulum({"length": 4.0, "gravity": 9.81, "initial_angle": 5.0, "oscillations": 5})
        assert r4["measurements"]["time_period"] == pytest.approx(
            2.0 * r1["measurements"]["time_period"], rel=1e-3
        )

    def test_large_angle_correction_exceeds_small_angle(self):
        result = simulate_simple_pendulum(
            {"length": 1.0, "gravity": 9.81, "initial_angle": 45.0, "oscillations": 5}
        )
        m = result["measurements"]
        assert m["corrected_time_period"] > m["time_period"]
        assert result["special_case"] == "large_angle_regime"


class TestProjectileMotion:
    def test_exact_kinematics_case(self):
        # u = 20 m/s, angle = 30 deg, g = 10 m/s^2
        # vx = 10*sqrt(3), vy0 = 10, T = 2.0 s, H = 5.0 m, R = 20*sqrt(3)
        result = simulate_projectile_motion(
            {"initial_velocity": 20.0, "launch_angle": 30.0, "gravity": 10.0}
        )
        m = result["measurements"]
        assert m["horizontal_velocity"] == pytest.approx(10.0 * math.sqrt(3), rel=1e-3)
        assert m["vertical_velocity"] == pytest.approx(10.0, rel=1e-4)
        assert m["time_of_flight"] == pytest.approx(2.0, rel=1e-4)
        assert m["max_height"] == pytest.approx(5.0, rel=1e-4)
        assert m["horizontal_range"] == pytest.approx(20.0 * math.sqrt(3), rel=1e-3)

    def test_complementary_angles_same_range(self):
        r30 = simulate_projectile_motion({"initial_velocity": 30.0, "launch_angle": 30.0, "gravity": 9.81})
        r60 = simulate_projectile_motion({"initial_velocity": 30.0, "launch_angle": 60.0, "gravity": 9.81})
        assert r30["measurements"]["horizontal_range"] == pytest.approx(
            r60["measurements"]["horizontal_range"], rel=1e-4
        )

    def test_45_deg_maximizes_range(self):
        r45 = simulate_projectile_motion({"initial_velocity": 25.0, "launch_angle": 45.0, "gravity": 9.81})
        r35 = simulate_projectile_motion({"initial_velocity": 25.0, "launch_angle": 35.0, "gravity": 9.81})
        assert r45["measurements"]["horizontal_range"] > r35["measurements"]["horizontal_range"]
        assert r45["special_case"] == "maximum_range_angle"


class TestConvexLens:
    def test_object_at_2f_same_size_real_inverted(self):
        # u = -30 cm, f = +15 cm -> v = +30 cm, m = -1
        result = simulate_convex_lens({"object_distance": 30.0, "focal_length": 15.0, "object_height": 4.0})
        m = result["measurements"]
        assert m["object_distance_cartesian"] == -30.0
        assert m["image_distance"] == pytest.approx(30.0, rel=1e-4)
        assert m["magnification"] == pytest.approx(-1.0, rel=1e-4)
        assert m["image_type"] == "Real"
        assert m["image_orientation"] == "Inverted"
        assert m["image_size"] == "Same Size"

    def test_object_inside_focus_virtual_upright_magnified(self):
        # u = -10 cm, f = +15 cm -> 1/v = 1/15 - 1/10 = -1/30 -> v = -30 cm, m = +3
        result = simulate_convex_lens({"object_distance": 10.0, "focal_length": 15.0, "object_height": 4.0})
        m = result["measurements"]
        assert m["image_distance"] == pytest.approx(-30.0, rel=1e-4)
        assert m["magnification"] == pytest.approx(3.0, rel=1e-4)
        assert m["image_type"] == "Virtual"
        assert m["image_orientation"] == "Upright"
        assert m["image_size"] == "Magnified"

    def test_object_at_focal_point_singularity_handled(self):
        result = simulate_convex_lens({"object_distance": 15.0, "focal_length": 15.0, "object_height": 4.0})
        m = result["measurements"]
        assert m["is_at_infinity"] is True
        assert m["image_distance"] is None
        assert m["magnification"] is None
        assert result["special_case"] == "object_at_focal_point"
