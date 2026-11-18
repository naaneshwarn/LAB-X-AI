"""Deterministic Physics simulation engines (12 experiments across Basic, Intermediate, Advanced)."""

from __future__ import annotations

import math
from typing import Any

from app.services.simulations.common import SimulationValidationError, check_bounds, require_float, require_int

SPEED_OF_LIGHT = 2.99792458e8  # m/s
GAS_CONSTANT_R = 8.314462618  # J/(mol*K)
HC_EV_NM = 1239.841984  # eV*nm
ELECTRON_MASS_KG = 9.1093837015e-31
EV_TO_JOULES = 1.602176634e-19


def simulate_ohms_law(params: dict[str, Any]) -> dict[str, Any]:
    """Ohm's Law: V = I * R, I = V / R, P = V * I."""
    voltage = require_float(params, "voltage", 12.0)
    resistance = require_float(params, "resistance", 20.0)

    if voltage < 0.0 or voltage > 240.0:
        raise SimulationValidationError("Voltage must be between 0.0 V and 240.0 V.")
    if resistance <= 0.0:
        raise SimulationValidationError(
            "Resistance must be strictly greater than 0 Ω to prevent a short circuit."
        )
    if resistance > 10000.0:
        raise SimulationValidationError("Resistance must not exceed 10,000 Ω.")

    current = voltage / resistance
    power = voltage * current
    conductance = 1.0 / resistance

    max_v = max(24.0, voltage)
    steps = 12
    series_data = []
    for i in range(steps + 1):
        v_pt = round((max_v / steps) * i, 3)
        i_pt = round(v_pt / resistance, 5)
        p_pt = round(v_pt * i_pt, 5)
        series_data.append({"voltage": v_pt, "current": i_pt, "power": p_pt})

    measurements = {
        "voltage": round(voltage, 4),
        "resistance": round(resistance, 4),
        "current": round(current, 4),
        "power": round(power, 4),
        "conductance": round(conductance, 5),
    }

    formatted = [
        {"key": "voltage", "label": "Supply Voltage (V)", "value": measurements["voltage"], "unit": "V"},
        {"key": "resistance", "label": "Resistance (R)", "value": measurements["resistance"], "unit": "Ω"},
        {"key": "current", "label": "Electric Current (I)", "value": measurements["current"], "unit": "A"},
        {"key": "power", "label": "Dissipated Power (P)", "value": measurements["power"], "unit": "W"},
        {"key": "conductance", "label": "Conductance (G)", "value": measurements["conductance"], "unit": "S"},
    ]

    conclusion = (
        f"With V = {measurements['voltage']} V and R = {measurements['resistance']} Ω, "
        f"the circuit draws I = {measurements['current']} A and dissipates P = {measurements['power']} W, "
        f"confirming V = I × R."
    )

    return {
        "parameters": {"voltage": voltage, "resistance": resistance},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": "zero_voltage" if voltage == 0.0 else None,
        "assumptions": [
            "Ideal ohmic resistor at constant temperature.",
            "Zero wire and internal battery resistance.",
            "Resistance strictly positive (R > 0 Ω).",
        ],
        "conclusion_summary": conclusion,
    }


def simulate_simple_pendulum(params: dict[str, Any]) -> dict[str, Any]:
    """Simple Pendulum: T = 2*pi*sqrt(L/g) with explicit large-angle correction."""
    length = require_float(params, "length", 1.0)
    gravity = require_float(params, "gravity", 9.81)
    initial_angle = require_float(params, "initial_angle", 12.0)
    oscillations = require_int(params, "oscillations", 10)

    if length <= 0.05 or length > 50.0:
        raise SimulationValidationError("Pendulum length must be between 0.05 m and 50.0 m.")
    if gravity <= 0.1 or gravity > 50.0:
        raise SimulationValidationError("Gravity must be between 0.1 m/s² and 50.0 m/s².")
    if initial_angle <= 0.0 or initial_angle > 85.0:
        raise SimulationValidationError("Initial angle must be between 0.5° and 85°.")
    if oscillations < 1 or oscillations > 100:
        raise SimulationValidationError("Number of oscillations must be between 1 and 100.")

    period_small_angle = 2.0 * math.pi * math.sqrt(length / gravity)
    theta_rad = math.radians(initial_angle)
    correction_factor = 1.0 + (theta_rad ** 2) / 16.0 + (11.0 * (theta_rad ** 4)) / 3072.0
    period_corrected = period_small_angle * correction_factor
    deviation_percent = (correction_factor - 1.0) * 100.0

    frequency = 1.0 / period_small_angle
    angular_frequency = 2.0 * math.pi * frequency
    total_time = period_small_angle * oscillations

    series_data = []
    for i in range(1, 16):
        l_pt = round(0.2 + (4.8 * (i - 1) / 14.0), 3)
        t_pt = round(2.0 * math.pi * math.sqrt(l_pt / gravity), 4)
        series_data.append({"length": l_pt, "period": t_pt, "period_squared": round(t_pt ** 2, 4)})

    measurements = {
        "length": round(length, 4),
        "gravity": round(gravity, 4),
        "initial_angle": round(initial_angle, 2),
        "oscillations": oscillations,
        "time_period": round(period_small_angle, 4),
        "corrected_time_period": round(period_corrected, 4),
        "large_angle_deviation_percent": round(deviation_percent, 3),
        "frequency": round(frequency, 4),
        "angular_frequency": round(angular_frequency, 4),
        "total_time_for_oscillations": round(total_time, 4),
    }

    formatted = [
        {"key": "time_period", "label": "Time Period T (Small-Angle)", "value": measurements["time_period"], "unit": "s"},
        {"key": "frequency", "label": "Frequency (f)", "value": measurements["frequency"], "unit": "Hz"},
        {"key": "total_time_for_oscillations", "label": f"Total Time ({oscillations} oscillations)", "value": measurements["total_time_for_oscillations"], "unit": "s"},
        {"key": "corrected_time_period", "label": "Angle-Corrected Period", "value": measurements["corrected_time_period"], "unit": "s"},
        {"key": "large_angle_deviation_percent", "label": "Small-Angle Deviation", "value": measurements["large_angle_deviation_percent"], "unit": "%"},
    ]

    special_case = "large_angle_regime" if initial_angle > 15.0 else "small_angle_approximation_valid"

    conclusion = (
        f"For L = {measurements['length']} m and g = {measurements['gravity']} m/s², "
        f"the ideal small-angle period is T = {measurements['time_period']} s "
        f"(f = {measurements['frequency']} Hz), taking {measurements['total_time_for_oscillations']} s "
        f"for {oscillations} oscillations. At θ₀ = {measurements['initial_angle']}°, "
        f"the large-angle correction shifts T by {measurements['large_angle_deviation_percent']}%."
    )

    return {
        "parameters": {
            "length": length,
            "gravity": gravity,
            "initial_angle": initial_angle,
            "oscillations": float(oscillations),
        },
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": special_case,
        "assumptions": [
            "Massless, inextensible string and frictionless pivot with zero air drag.",
            "Standard formula T = 2π√(L/g) uses the small-angle approximation sin(θ) ≈ θ (accurate within ~1% for θ ≤ 15°).",
            "Angle-corrected period uses the 4th-order elliptic integral series expansion.",
        ],
        "conclusion_summary": conclusion,
    }


def simulate_reflection_of_light(params: dict[str, Any]) -> dict[str, Any]:
    """Plane Mirror Reflection: angle_r = angle_i, deviation = 180 - 2*i."""
    angle_i = require_float(params, "incident_angle", 35.0)
    mirror_angle = require_float(params, "mirror_inclination", 90.0)
    check_bounds(angle_i, 0.0, 89.0, "Incident angle", "°")
    check_bounds(mirror_angle, 15.0, 180.0, "Mirror inclination angle", "°")

    angle_r = angle_i
    grazing_angle = 90.0 - angle_i
    deviation = 180.0 - 2.0 * angle_i
    ratio = 360.0 / mirror_angle
    images_count = int(round(ratio)) - 1 if abs(ratio - round(ratio)) < 1e-6 else int(math.floor(ratio))

    series_data = [
        {"incident_angle": float(a), "reflected_angle": float(a), "deviation": float(180 - 2 * a)}
        for a in range(0, 90, 5)
    ]

    measurements = {
        "incident_angle": round(angle_i, 2),
        "reflected_angle": round(angle_r, 2),
        "grazing_angle": round(grazing_angle, 2),
        "deviation_angle": round(deviation, 2),
        "mirror_inclination": round(mirror_angle, 2),
        "images_between_mirrors": images_count,
    }
    formatted = [
        {"key": "incident_angle", "label": "Angle of Incidence (θᵢ)", "value": measurements["incident_angle"], "unit": "°"},
        {"key": "reflected_angle", "label": "Angle of Reflection (θᵣ)", "value": measurements["reflected_angle"], "unit": "°"},
        {"key": "grazing_angle", "label": "Glancing Angle (g)", "value": measurements["grazing_angle"], "unit": "°"},
        {"key": "deviation_angle", "label": "Angle of Deviation (δ)", "value": measurements["deviation_angle"], "unit": "°"},
        {"key": "images_between_mirrors", "label": "Images (Two Mirrors)", "value": images_count, "unit": "images"},
    ]
    return {
        "parameters": {"incident_angle": angle_i, "mirror_inclination": mirror_angle},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": "normal_incidence" if angle_i == 0.0 else None,
        "assumptions": [
            "Ideal specular reflection on an optically flat plane mirror.",
            "Incident ray, reflected ray, and normal lie in the same plane.",
        ],
        "conclusion_summary": (
            f"At θᵢ = {measurements['incident_angle']}°, the reflected ray leaves at θᵣ = {measurements['reflected_angle']}° "
            f"(deviation δ = {measurements['deviation_angle']}°). Two mirrors inclined at {measurements['mirror_inclination']}° form {images_count} images."
        ),
    }


def simulate_refraction_of_light(params: dict[str, Any]) -> dict[str, Any]:
    """Snell's Law: n1 * sin(theta1) = n2 * sin(theta2) with Total Internal Reflection."""
    angle1 = require_float(params, "incident_angle", 30.0)
    n1 = require_float(params, "n1", 1.0)
    n2 = require_float(params, "n2", 1.5)
    check_bounds(angle1, 0.0, 89.0, "Incident angle", "°")
    check_bounds(n1, 1.0, 3.0, "Refractive index n₁")
    check_bounds(n2, 1.0, 3.0, "Refractive index n₂")

    sin_t2 = (n1 / n2) * math.sin(math.radians(angle1))
    critical_angle = math.degrees(math.asin(n2 / n1)) if n1 > n2 else None
    is_tir = sin_t2 > 1.0

    if is_tir:
        angle2 = None
        deviation = 180.0 - 2.0 * angle1
        special_case = "total_internal_reflection"
    else:
        angle2 = math.degrees(math.asin(min(1.0, max(-1.0, sin_t2))))
        deviation = abs(angle1 - angle2)
        special_case = "normal_incidence" if angle1 == 0.0 else None

    v1 = SPEED_OF_LIGHT / n1 / 1e8  # in 10^8 m/s
    v2 = SPEED_OF_LIGHT / n2 / 1e8

    series_data = []
    for a in range(0, 86, 5):
        s2 = (n1 / n2) * math.sin(math.radians(a))
        if s2 <= 1.0:
            series_data.append({"incident_angle": float(a), "refracted_angle": round(math.degrees(math.asin(s2)), 2)})

    measurements = {
        "incident_angle": round(angle1, 2),
        "n1": round(n1, 3),
        "n2": round(n2, 3),
        "refracted_angle": round(angle2, 2) if angle2 is not None else None,
        "critical_angle": round(critical_angle, 2) if critical_angle is not None else None,
        "total_internal_reflection": is_tir,
        "deviation_angle": round(deviation, 2),
        "speed_medium_1": round(v1, 3),
        "speed_medium_2": round(v2, 3),
    }
    formatted = [
        {"key": "refracted_angle", "label": "Refracted Angle (θ₂)", "value": "TIR (Reflected)" if is_tir else measurements["refracted_angle"], "unit": "" if is_tir else "°"},
        {"key": "critical_angle", "label": "Critical Angle (θc)", "value": measurements["critical_angle"] if critical_angle is not None else "N/A (n₁ ≤ n₂)", "unit": "°" if critical_angle is not None else ""},
        {"key": "deviation_angle", "label": "Ray Deviation", "value": measurements["deviation_angle"], "unit": "°"},
        {"key": "speed_medium_1", "label": "Speed in Medium 1", "value": measurements["speed_medium_1"], "unit": "×10⁸ m/s"},
        {"key": "speed_medium_2", "label": "Speed in Medium 2", "value": measurements["speed_medium_2"], "unit": "×10⁸ m/s"},
    ]
    conclusion = (
        f"Total Internal Reflection occurs because n₁ ({n1}) > n₂ ({n2}) and θ₁ ({angle1}°) exceeds the critical angle θc = {round(critical_angle, 2)}°."
        if is_tir
        else f"By Snell's Law (n₁ sin θ₁ = n₂ sin θ₂), light at θ₁ = {angle1}° refracts to θ₂ = {round(angle2, 2)}° across the interface (n₁={n1} → n₂={n2})."
    )
    return {
        "parameters": {"incident_angle": angle1, "n1": n1, "n2": n2},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": special_case,
        "assumptions": [
            "Monochromatic light ray (no chromatic dispersion).",
            "Smooth, optically isotropic planar boundary between media.",
        ],
        "conclusion_summary": conclusion,
    }


def simulate_projectile_motion(params: dict[str, Any]) -> dict[str, Any]:
    """Idealized 2D Projectile Motion over level ground (negligible air resistance)."""
    u = require_float(params, "initial_velocity", 25.0)
    angle_deg = require_float(params, "launch_angle", 45.0)
    g = require_float(params, "gravity", 9.81)

    if u <= 0.0 or u > 500.0:
        raise SimulationValidationError("Initial velocity must be between 0.1 m/s and 500 m/s.")
    if angle_deg < 0.0 or angle_deg > 90.0:
        raise SimulationValidationError("Launch angle must be between 0° and 90°.")
    if g <= 0.1 or g > 50.0:
        raise SimulationValidationError("Gravity must be between 0.1 m/s² and 50.0 m/s².")

    theta = math.radians(angle_deg)
    vx = u * math.cos(theta)
    vy0 = u * math.sin(theta)

    if abs(angle_deg - 90.0) < 1e-9:
        vx = 0.0
    if abs(angle_deg) < 1e-9:
        vy0 = 0.0

    time_of_flight = (2.0 * vy0) / g
    time_to_apex = vy0 / g
    max_height = (vy0 ** 2) / (2.0 * g)
    horizontal_range = (u ** 2) * math.sin(2.0 * theta) / g
    if abs(angle_deg - 90.0) < 1e-9 or abs(angle_deg) < 1e-9:
        horizontal_range = 0.0

    num_samples = 40
    series_data = []
    for i in range(num_samples + 1):
        t = (time_of_flight * i / num_samples) if time_of_flight > 0 else 0.0
        x = vx * t
        y = max(0.0, vy0 * t - 0.5 * g * (t ** 2))
        vy_t = vy0 - g * t
        speed_t = math.hypot(vx, vy_t)
        series_data.append(
            {
                "t": round(t, 4),
                "x": round(x, 3),
                "y": round(y, 3),
                "vx": round(vx, 3),
                "vy": round(vy_t, 3),
                "speed": round(speed_t, 3),
            }
        )

    measurements = {
        "initial_velocity": round(u, 4),
        "launch_angle": round(angle_deg, 2),
        "gravity": round(g, 4),
        "horizontal_velocity": round(vx, 4),
        "vertical_velocity": round(vy0, 4),
        "time_of_flight": round(time_of_flight, 4),
        "time_to_apex": round(time_to_apex, 4),
        "max_height": round(max_height, 4),
        "horizontal_range": round(horizontal_range, 4),
    }

    formatted = [
        {"key": "horizontal_velocity", "label": "Horizontal Velocity (vx)", "value": measurements["horizontal_velocity"], "unit": "m/s"},
        {"key": "vertical_velocity", "label": "Initial Vertical Velocity (vy₀)", "value": measurements["vertical_velocity"], "unit": "m/s"},
        {"key": "time_of_flight", "label": "Time of Flight (T)", "value": measurements["time_of_flight"], "unit": "s"},
        {"key": "max_height", "label": "Maximum Height (H)", "value": measurements["max_height"], "unit": "m"},
        {"key": "horizontal_range", "label": "Horizontal Range (R)", "value": measurements["horizontal_range"], "unit": "m"},
    ]

    special_case = None
    if abs(angle_deg - 45.0) < 0.01:
        special_case = "maximum_range_angle"
    elif abs(angle_deg - 90.0) < 0.01:
        special_case = "vertical_launch"
    elif abs(angle_deg) < 0.01:
        special_case = "horizontal_ground_launch"

    conclusion = (
        f"Launched at u = {measurements['initial_velocity']} m/s and θ = {measurements['launch_angle']}° "
        f"(g = {measurements['gravity']} m/s²), the projectile has vx = {measurements['horizontal_velocity']} m/s "
        f"and vy₀ = {measurements['vertical_velocity']} m/s, reaching a peak height of "
        f"{measurements['max_height']} m and landing at range {measurements['horizontal_range']} m "
        f"after {measurements['time_of_flight']} s."
    )

    return {
        "parameters": {"initial_velocity": u, "launch_angle": angle_deg, "gravity": g},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": special_case,
        "assumptions": [
            "Negligible air resistance (vacuum approximation).",
            "Constant downward gravitational acceleration (g) and flat Earth surface.",
            "Projectile launches and lands at the same vertical elevation (y₀ = 0 m).",
        ],
        "conclusion_summary": conclusion,
    }


def simulate_convex_lens(params: dict[str, Any]) -> dict[str, Any]:
    """Thin Convex Lens using New Cartesian Sign Convention: 1/f = 1/v - 1/u."""
    raw_u = require_float(params, "object_distance", 30.0)
    f = require_float(params, "focal_length", 15.0)
    object_height = require_float(params, "object_height", 4.0)

    if abs(raw_u) < 0.5 or abs(raw_u) > 500.0:
        raise SimulationValidationError("Object distance magnitude |u| must be between 0.5 cm and 500 cm.")
    if f <= 0.5 or f > 200.0:
        raise SimulationValidationError("Convex lens focal length (f) must be positive and between 0.5 cm and 200 cm.")
    if object_height <= 0.1 or object_height > 50.0:
        raise SimulationValidationError("Object height must be between 0.1 cm and 50 cm.")

    u = -abs(raw_u)
    abs_u = abs(u)
    optical_power = 100.0 / f

    denominator = f + u
    is_at_focus = abs(denominator) < 1e-6

    if is_at_focus:
        v = None
        magnification = None
        image_height = None
        image_type = "At Infinity"
        image_orientation = "Undefined (Parallel Emergent Rays)"
        image_size = "Infinitely Magnified"
        special_case = "object_at_focal_point"
        conclusion = (
            f"The object is located exactly at the focal point (u = {round(u, 2)} cm, f = +{round(f, 2)} cm). "
            f"Since 1/v = 1/f + 1/u = 0, refracted rays emerge parallel and no finite image is formed (v → ∞)."
        )
    else:
        v = (f * u) / denominator
        magnification = v / u
        image_height = magnification * object_height

        if v > 0:
            image_type = "Real"
            image_orientation = "Inverted"
        else:
            image_type = "Virtual"
            image_orientation = "Upright"

        abs_m = abs(magnification)
        if abs(abs_m - 1.0) < 0.02:
            image_size = "Same Size"
            special_case = "object_at_2f"
        elif abs_m > 1.0:
            image_size = "Magnified"
            special_case = "virtual_magnifier" if v < 0 else "between_f_and_2f"
        else:
            image_size = "Diminished"
            special_case = "beyond_2f"

        conclusion = (
            f"With u = {round(u, 2)} cm and f = +{round(f, 2)} cm, the thin lens formula gives "
            f"v = {round(v, 2)} cm and magnification m = {round(magnification, 3)}. "
            f"The lens forms a {image_type.lower()}, {image_orientation.lower()}, {image_size.lower()} image."
        )

    series_data = []
    for d in range(max(2, int(f * 0.3)), int(f * 4.0) + 1, max(1, int(f * 0.2))):
        if abs(d - f) < max(1.0, f * 0.08):
            continue
        u_pt = -float(d)
        v_pt = (f * u_pt) / (f + u_pt)
        if abs(v_pt) <= 250.0:
            series_data.append(
                {
                    "object_distance": float(d),
                    "image_distance": round(v_pt, 2),
                    "magnification": round(v_pt / u_pt, 3),
                }
            )

    measurements = {
        "object_distance_cartesian": round(u, 4),
        "object_distance_magnitude": round(abs_u, 4),
        "focal_length": round(f, 4),
        "image_distance": round(v, 4) if v is not None else None,
        "magnification": round(magnification, 4) if magnification is not None else None,
        "object_height": round(object_height, 4),
        "image_height": round(image_height, 4) if image_height is not None else None,
        "optical_power_diopters": round(optical_power, 4),
        "image_type": image_type,
        "image_orientation": image_orientation,
        "image_size": image_size,
        "is_at_infinity": is_at_focus,
    }

    formatted = [
        {"key": "object_distance_cartesian", "label": "Object Position (u)", "value": measurements["object_distance_cartesian"], "unit": "cm"},
        {"key": "focal_length", "label": "Focal Length (f)", "value": measurements["focal_length"], "unit": "cm"},
        {"key": "image_distance", "label": "Image Position (v)", "value": "∞ (Infinity)" if is_at_focus else measurements["image_distance"], "unit": "" if is_at_focus else "cm"},
        {"key": "magnification", "label": "Magnification (m = v/u)", "value": "Undefined (∞)" if is_at_focus else measurements["magnification"], "unit": "×" if not is_at_focus else ""},
        {"key": "image_type", "label": "Image Nature", "value": f"{image_type}, {image_orientation}", "unit": ""},
        {"key": "optical_power_diopters", "label": "Optical Power (P)", "value": measurements["optical_power_diopters"], "unit": "D"},
    ]

    return {
        "parameters": {"object_distance": abs_u, "focal_length": f, "object_height": object_height},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": special_case,
        "assumptions": [
            "Thin-lens paraxial approximation with negligible lens thickness.",
            "New Cartesian Sign Convention: light travels left-to-right, u < 0 for real objects, f > 0 for convex lens.",
            "Monochromatic rays free of chromatic and spherical aberration.",
        ],
        "conclusion_summary": conclusion,
    }


def simulate_series_parallel_circuits(params: dict[str, Any]) -> dict[str, Any]:
    """Compare Series (mode=0) and Parallel (mode=1) 3-resistor DC circuits."""
    voltage = require_float(params, "voltage", 12.0)
    r1 = require_float(params, "r1", 10.0)
    r2 = require_float(params, "r2", 20.0)
    r3 = require_float(params, "r3", 30.0)
    mode = require_int(params, "mode", 0)  # 0 = Series, 1 = Parallel

    check_bounds(voltage, 0.0, 240.0, "Voltage", "V")
    for name, r in [("R₁", r1), ("R₂", r2), ("R₃", r3)]:
        check_bounds(r, 0.0, 10000.0, f"Resistance {name}", "Ω", strict_low=True)
    if mode not in (0, 1):
        raise SimulationValidationError("Circuit mode must be 0 (Series) or 1 (Parallel).")

    if mode == 0:
        r_eq = r1 + r2 + r3
        i_total = voltage / r_eq
        i1 = i2 = i3 = i_total
        v1, v2, v3 = i_total * r1, i_total * r2, i_total * r3
        mode_name = "Series"
    else:
        r_eq = 1.0 / (1.0 / r1 + 1.0 / r2 + 1.0 / r3)
        i1, i2, i3 = voltage / r1, voltage / r2, voltage / r3
        i_total = i1 + i2 + i3
        v1 = v2 = v3 = voltage
        mode_name = "Parallel"

    power = voltage * i_total
    series_data = [
        {"voltage": round(v_pt, 2), "series_current": round(v_pt / (r1 + r2 + r3), 4), "parallel_current": round(v_pt * (1.0 / r1 + 1.0 / r2 + 1.0 / r3), 4)}
        for v_pt in [voltage * k / 10.0 for k in range(11)]
    ]

    measurements = {
        "mode_name": mode_name,
        "equivalent_resistance": round(r_eq, 4),
        "total_current": round(i_total, 4),
        "total_power": round(power, 4),
        "v1": round(v1, 3),
        "v2": round(v2, 3),
        "v3": round(v3, 3),
        "i1": round(i1, 4),
        "i2": round(i2, 4),
        "i3": round(i3, 4),
    }
    formatted = [
        {"key": "mode_name", "label": "Configuration", "value": mode_name, "unit": ""},
        {"key": "equivalent_resistance", "label": "Equivalent Resistance (Req)", "value": measurements["equivalent_resistance"], "unit": "Ω"},
        {"key": "total_current", "label": "Total Current (I_total)", "value": measurements["total_current"], "unit": "A"},
        {"key": "total_power", "label": "Total Power (P)", "value": measurements["total_power"], "unit": "W"},
        {"key": "v1", "label": "Voltage Drops (V₁/V₂/V₃)", "value": f"{measurements['v1']} / {measurements['v2']} / {measurements['v3']}", "unit": "V"},
        {"key": "i1", "label": "Branch Currents (I₁/I₂/I₃)", "value": f"{measurements['i1']} / {measurements['i2']} / {measurements['i3']}", "unit": "A"},
    ]
    return {
        "parameters": {"voltage": voltage, "r1": r1, "r2": r2, "r3": r3, "mode": float(mode)},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": "series_circuit" if mode == 0 else "parallel_circuit",
        "assumptions": [
            "Ideal DC voltage source with zero internal resistance.",
            "Ohmic resistors obeying Kirchhoff's Voltage and Current Laws (KVL & KCL).",
        ],
        "conclusion_summary": (
            f"In {mode_name} mode with R₁={r1} Ω, R₂={r2} Ω, R₃={r3} Ω at V={voltage} V: "
            f"Req = {measurements['equivalent_resistance']} Ω, I_total = {measurements['total_current']} A, P = {measurements['total_power']} W."
        ),
    }


def simulate_newtons_laws(params: dict[str, Any]) -> dict[str, Any]:
    """Newton's Second Law with Kinetic Friction: F_net = F - mu*m*g, a = F_net / m."""
    mass = require_float(params, "mass", 5.0)
    applied_force = require_float(params, "applied_force", 30.0)
    mu = require_float(params, "friction_coeff", 0.2)
    duration = require_float(params, "time", 4.0)
    g = 9.81

    check_bounds(mass, 0.1, 1000.0, "Mass", "kg")
    check_bounds(applied_force, 0.0, 5000.0, "Applied force", "N")
    check_bounds(mu, 0.0, 1.5, "Coefficient of friction")
    check_bounds(duration, 0.5, 30.0, "Time duration", "s")

    normal_force = mass * g
    max_friction = mu * normal_force
    if applied_force <= max_friction:
        friction_force = applied_force
        net_force = 0.0
        special_case = "static_equilibrium"
    else:
        friction_force = max_friction
        net_force = applied_force - friction_force
        special_case = "accelerated_motion"

    acceleration = net_force / mass
    final_velocity = acceleration * duration
    displacement = 0.5 * acceleration * (duration ** 2)
    momentum = mass * final_velocity
    work_done = net_force * displacement

    series_data = []
    for i in range(13):
        t_pt = round(duration * i / 12.0, 3)
        v_pt = round(acceleration * t_pt, 3)
        s_pt = round(0.5 * acceleration * (t_pt ** 2), 3)
        series_data.append({"time": t_pt, "velocity": v_pt, "displacement": s_pt})

    measurements = {
        "normal_force": round(normal_force, 3),
        "friction_force": round(friction_force, 3),
        "net_force": round(net_force, 3),
        "acceleration": round(acceleration, 4),
        "final_velocity": round(final_velocity, 3),
        "displacement": round(displacement, 3),
        "momentum": round(momentum, 3),
        "work_done": round(work_done, 3),
    }
    formatted = [
        {"key": "net_force", "label": "Net Force (F_net)", "value": measurements["net_force"], "unit": "N"},
        {"key": "friction_force", "label": "Friction Force (f)", "value": measurements["friction_force"], "unit": "N"},
        {"key": "acceleration", "label": "Acceleration (a = F/m)", "value": measurements["acceleration"], "unit": "m/s²"},
        {"key": "final_velocity", "label": "Velocity after t (v)", "value": measurements["final_velocity"], "unit": "m/s"},
        {"key": "displacement", "label": "Displacement (s)", "value": measurements["displacement"], "unit": "m"},
        {"key": "momentum", "label": "Final Momentum (p)", "value": measurements["momentum"], "unit": "kg·m/s"},
    ]
    return {
        "parameters": {"mass": mass, "applied_force": applied_force, "friction_coeff": mu, "time": duration},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": special_case,
        "assumptions": [
            "Horizontal surface with uniform gravitational acceleration g = 9.81 m/s².",
            "Object starts from rest (v₀ = 0 m/s) with constant applied force and friction coefficient.",
        ],
        "conclusion_summary": (
            f"Friction opposes motion up to {round(max_friction, 2)} N; the block stays at rest (F_net = 0 N)."
            if special_case == "static_equilibrium"
            else f"F_net = {measurements['net_force']} N accelerates the {mass} kg block at a = {measurements['acceleration']} m/s², reaching {measurements['final_velocity']} m/s over {measurements['displacement']} m in {duration} s."
        ),
    }


def simulate_electromagnetic_induction(params: dict[str, Any]) -> dict[str, Any]:
    """Faraday's Law & AC Generator: E0 = N*B*A*omega, I_peak = E0/R."""
    turns = require_int(params, "turns", 200)
    magnetic_field = require_float(params, "magnetic_field", 0.5)  # Tesla
    coil_area = require_float(params, "coil_area", 0.04)  # m^2
    frequency = require_float(params, "frequency", 5.0)  # Hz
    resistance = require_float(params, "resistance", 10.0)  # Ohm

    check_bounds(turns, 1, 5000, "Coil turns (N)")
    check_bounds(magnetic_field, 0.01, 10.0, "Magnetic field (B)", "T")
    check_bounds(coil_area, 0.001, 2.0, "Coil area (A)", "m²")
    check_bounds(frequency, 0.1, 120.0, "Rotation frequency (f)", "Hz")
    check_bounds(resistance, 0.1, 10000.0, "Load resistance (R)", "Ω")

    omega = 2.0 * math.pi * frequency
    max_flux = magnetic_field * coil_area
    peak_emf = turns * magnetic_field * coil_area * omega
    rms_emf = peak_emf / math.sqrt(2.0)
    peak_current = peak_emf / resistance
    avg_power = (rms_emf ** 2) / resistance

    period = 1.0 / frequency
    series_data = []
    for i in range(25):
        t_pt = period * i / 24.0
        emf_pt = peak_emf * math.sin(omega * t_pt)
        flux_pt = max_flux * math.cos(omega * t_pt)
        series_data.append({"time": round(t_pt, 4), "emf": round(emf_pt, 3), "flux": round(flux_pt, 5)})

    measurements = {
        "max_flux": round(max_flux, 5),
        "angular_velocity": round(omega, 3),
        "peak_emf": round(peak_emf, 3),
        "rms_emf": round(rms_emf, 3),
        "peak_current": round(peak_current, 4),
        "average_power": round(avg_power, 3),
    }
    formatted = [
        {"key": "max_flux", "label": "Max Magnetic Flux (Φ₀)", "value": measurements["max_flux"], "unit": "Wb"},
        {"key": "peak_emf", "label": "Peak Induced EMF (ε₀)", "value": measurements["peak_emf"], "unit": "V"},
        {"key": "rms_emf", "label": "RMS EMF (ε_rms)", "value": measurements["rms_emf"], "unit": "V"},
        {"key": "peak_current", "label": "Peak Induced Current", "value": measurements["peak_current"], "unit": "A"},
        {"key": "average_power", "label": "Average Power Output", "value": measurements["average_power"], "unit": "W"},
    ]
    return {
        "parameters": {
            "turns": float(turns),
            "magnetic_field": magnetic_field,
            "coil_area": coil_area,
            "frequency": frequency,
            "resistance": resistance,
        },
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": None,
        "assumptions": [
            "Uniform static magnetic field B perpendicular to the rotation axis.",
            "Negligible coil self-inductance and eddy-current losses.",
        ],
        "conclusion_summary": (
            f"Rotating a {turns}-turn coil (A={coil_area} m²) at {frequency} Hz in B={magnetic_field} T induces "
            f"ε₀ = {measurements['peak_emf']} V (ε_rms = {measurements['rms_emf']} V) and peak current {measurements['peak_current']} A."
        ),
    }


def simulate_wave_interference(params: dict[str, Any]) -> dict[str, Any]:
    """Young's Double-Slit Interference & Single-Slit Diffraction Envelope."""
    wavelength_nm = require_float(params, "wavelength", 550.0)  # nm
    slit_sep_mm = require_float(params, "slit_separation", 0.5)  # mm
    slit_width_mm = require_float(params, "slit_width", 0.1)  # mm
    screen_dist_m = require_float(params, "screen_distance", 1.5)  # m

    check_bounds(wavelength_nm, 380.0, 750.0, "Wavelength (λ)", "nm")
    check_bounds(slit_sep_mm, 0.05, 5.0, "Slit separation (d)", "mm")
    check_bounds(slit_width_mm, 0.01, 2.0, "Slit width (a)", "mm")
    check_bounds(screen_dist_m, 0.2, 5.0, "Screen distance (D)", "m")
    if slit_width_mm >= slit_sep_mm:
        raise SimulationValidationError("Slit width (a) must be strictly smaller than slit separation (d).")

    lam = wavelength_nm * 1e-9
    d = slit_sep_mm * 1e-3
    a = slit_width_mm * 1e-3
    fringe_width_mm = (lam * screen_dist_m / d) * 1e3
    central_max_width_mm = (2.0 * lam * screen_dist_m / a) * 1e3
    first_order_angle_deg = math.degrees(math.asin(min(1.0, lam / d)))
    missing_order_ratio = d / a

    # Intensity profile across screen [-10 mm, +10 mm]
    max_y_mm = min(15.0, max(5.0, 4.0 * fringe_width_mm))
    series_data = []
    for i in range(-30, 31):
        y_mm = (max_y_mm * i) / 30.0
        y_m = y_mm * 1e-3
        beta = (math.pi * d * y_m) / (lam * screen_dist_m)
        alpha = (math.pi * a * y_m) / (lam * screen_dist_m)
        sinc = 1.0 if abs(alpha) < 1e-9 else math.sin(alpha) / alpha
        intensity = (math.cos(beta) ** 2) * (sinc ** 2)
        series_data.append({"position_mm": round(y_mm, 3), "intensity": round(intensity, 4), "envelope": round(sinc ** 2, 4)})

    measurements = {
        "wavelength_nm": round(wavelength_nm, 1),
        "fringe_width_mm": round(fringe_width_mm, 4),
        "central_diffraction_width_mm": round(central_max_width_mm, 4),
        "first_order_angle_deg": round(first_order_angle_deg, 4),
        "fringes_in_central_max": round(2.0 * missing_order_ratio - 1.0, 2),
    }
    formatted = [
        {"key": "fringe_width_mm", "label": "Interference Fringe Width (β)", "value": measurements["fringe_width_mm"], "unit": "mm"},
        {"key": "central_diffraction_width_mm", "label": "Central Diffraction Width", "value": measurements["central_diffraction_width_mm"], "unit": "mm"},
        {"key": "first_order_angle_deg", "label": "1st-Order Maximum Angle", "value": measurements["first_order_angle_deg"], "unit": "°"},
        {"key": "fringes_in_central_max", "label": "Bright Fringes in Central Max", "value": measurements["fringes_in_central_max"], "unit": ""},
    ]
    return {
        "parameters": {
            "wavelength": wavelength_nm,
            "slit_separation": slit_sep_mm,
            "slit_width": slit_width_mm,
            "screen_distance": screen_dist_m,
        },
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": None,
        "assumptions": [
            "Coherent, monochromatic plane-wave illumination (Fraunhofer far-field limit D ≫ d).",
            "Small-angle paraxial approximation sin(θ) ≈ tan(θ) = y/D.",
        ],
        "conclusion_summary": (
            f"At λ = {wavelength_nm} nm, d = {slit_sep_mm} mm, and D = {screen_dist_m} m, interference fringes are spaced by "
            f"β = {measurements['fringe_width_mm']} mm inside a {measurements['central_diffraction_width_mm']} mm central diffraction envelope."
        ),
    }


def simulate_thermodynamic_processes(params: dict[str, Any]) -> dict[str, Any]:
    """First Law of Thermodynamics for ideal gas processes (0=Isothermal, 1=Isobaric, 2=Adiabatic, 3=Isochoric)."""
    moles = require_float(params, "moles", 1.0)
    t1 = require_float(params, "initial_temp", 300.0)  # K
    v1 = require_float(params, "initial_volume", 0.01)  # m^3
    v2 = require_float(params, "final_volume", 0.025)  # m^3
    process_type = require_int(params, "process_type", 0)
    gamma = 1.4  # Diatomic ideal gas
    cv = GAS_CONSTANT_R / (gamma - 1.0)

    check_bounds(moles, 0.1, 20.0, "Moles (n)", "mol")
    check_bounds(t1, 100.0, 2000.0, "Initial temperature (T₁)", "K")
    check_bounds(v1, 0.001, 1.0, "Initial volume (V₁)", "m³")
    check_bounds(v2, 0.001, 1.0, "Final volume (V₂)", "m³")
    if process_type not in (0, 1, 2, 3):
        raise SimulationValidationError("Process type must be 0 (Isothermal), 1 (Isobaric), 2 (Adiabatic), or 3 (Isochoric).")

    p1 = (moles * GAS_CONSTANT_R * t1) / v1  # Pa
    process_names = {0: "Isothermal", 1: "Isobaric", 2: "Adiabatic", 3: "Isochoric"}
    name = process_names[process_type]

    if process_type == 0:  # Isothermal
        t2 = t1
        p2 = p1 * (v1 / v2)
        work = moles * GAS_CONSTANT_R * t1 * math.log(v2 / v1)
        delta_u = 0.0
        heat_q = work
    elif process_type == 1:  # Isobaric
        p2 = p1
        t2 = t1 * (v2 / v1)
        work = p1 * (v2 - v1)
        delta_u = moles * cv * (t2 - t1)
        heat_q = delta_u + work
    elif process_type == 2:  # Adiabatic
        p2 = p1 * ((v1 / v2) ** gamma)
        t2 = t1 * ((v1 / v2) ** (gamma - 1.0))
        delta_u = moles * cv * (t2 - t1)
        work = -delta_u
        heat_q = 0.0
    else:  # Isochoric (heat added raises T2 proportionally to V2/V1 ratio used as temp multiplier)
        v2_eff = v1
        t2 = t1 * (v2 / v1)
        p2 = p1 * (t2 / t1)
        work = 0.0
        delta_u = moles * cv * (t2 - t1)
        heat_q = delta_u
        v2 = v2_eff

    series_data = []
    for i in range(17):
        frac = i / 16.0
        if process_type == 3:
            v_pt = v1
            p_pt = p1 + (p2 - p1) * frac
        else:
            v_pt = v1 + (v2 - v1) * frac
            if process_type == 0:
                p_pt = p1 * (v1 / v_pt)
            elif process_type == 1:
                p_pt = p1
            else:
                p_pt = p1 * ((v1 / v_pt) ** gamma)
        series_data.append({"volume_L": round(v_pt * 1000.0, 3), "pressure_kPa": round(p_pt / 1000.0, 2)})

    measurements = {
        "process_name": name,
        "p1_kPa": round(p1 / 1000.0, 2),
        "p2_kPa": round(p2 / 1000.0, 2),
        "t2_K": round(t2, 2),
        "work_J": round(work, 2),
        "delta_u_J": round(delta_u, 2),
        "heat_q_J": round(heat_q, 2),
    }
    formatted = [
        {"key": "process_name", "label": "Thermodynamic Process", "value": name, "unit": ""},
        {"key": "p1_kPa", "label": "Initial Pressure (P₁)", "value": measurements["p1_kPa"], "unit": "kPa"},
        {"key": "p2_kPa", "label": "Final Pressure (P₂)", "value": measurements["p2_kPa"], "unit": "kPa"},
        {"key": "t2_K", "label": "Final Temperature (T₂)", "value": measurements["t2_K"], "unit": "K"},
        {"key": "work_J", "label": "Work Done by Gas (W)", "value": measurements["work_J"], "unit": "J"},
        {"key": "delta_u_J", "label": "Internal Energy ΔU", "value": measurements["delta_u_J"], "unit": "J"},
        {"key": "heat_q_J", "label": "Heat Transferred (Q)", "value": measurements["heat_q_J"], "unit": "J"},
    ]
    return {
        "parameters": {
            "moles": moles,
            "initial_temp": t1,
            "initial_volume": v1,
            "final_volume": v2,
            "process_type": float(process_type),
        },
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": name.lower(),
        "assumptions": [
            "Quasi-static reversible process of an ideal diatomic gas (γ = 1.4).",
            "First Law sign convention: Q = ΔU + W (W > 0 for expansion).",
        ],
        "conclusion_summary": (
            f"During the {name} process, Q = {measurements['heat_q_J']} J, ΔU = {measurements['delta_u_J']} J, "
            f"and W = {measurements['work_J']} J (verifying Q = ΔU + W), ending at P₂ = {measurements['p2_kPa']} kPa, T₂ = {measurements['t2_K']} K."
        ),
    }


def simulate_photoelectric_effect(params: dict[str, Any]) -> dict[str, Any]:
    """Einstein's Photoelectric Equation: K_max = hc/lambda - phi."""
    wavelength_nm = require_float(params, "wavelength", 300.0)  # nm
    work_function = require_float(params, "work_function", 2.3)  # eV (Sodium ~2.28 eV)
    intensity = require_float(params, "intensity", 50.0)  # %

    check_bounds(wavelength_nm, 100.0, 800.0, "Wavelength (λ)", "nm")
    check_bounds(work_function, 1.5, 6.5, "Work function (φ)", "eV")
    check_bounds(intensity, 1.0, 100.0, "Light intensity", "%")

    photon_energy_ev = HC_EV_NM / wavelength_nm
    frequency_thz = (SPEED_OF_LIGHT / (wavelength_nm * 1e-9)) / 1e12
    threshold_wavelength_nm = HC_EV_NM / work_function
    emission_occurs = photon_energy_ev > work_function

    if emission_occurs:
        k_max_ev = photon_energy_ev - work_function
        stopping_potential = k_max_ev
        v_max_km_s = math.sqrt((2.0 * k_max_ev * EV_TO_JOULES) / ELECTRON_MASS_KG) / 1000.0
        photocurrent_ua = round(0.45 * intensity, 2)
        special_case = "photoemission_active"
    else:
        k_max_ev = 0.0
        stopping_potential = 0.0
        v_max_km_s = 0.0
        photocurrent_ua = 0.0
        special_case = "below_threshold"

    series_data = []
    for f_thz in range(300, 2100, 150):
        e_ev = (6.62607015e-34 * (f_thz * 1e12)) / EV_TO_JOULES
        k_pt = max(0.0, e_ev - work_function)
        series_data.append({"frequency_THz": float(f_thz), "k_max_eV": round(k_pt, 3)})

    measurements = {
        "photon_energy_ev": round(photon_energy_ev, 4),
        "frequency_thz": round(frequency_thz, 2),
        "threshold_wavelength_nm": round(threshold_wavelength_nm, 2),
        "emission_occurs": emission_occurs,
        "k_max_ev": round(k_max_ev, 4),
        "stopping_potential_v": round(stopping_potential, 4),
        "max_electron_speed_kms": round(v_max_km_s, 2),
        "photocurrent_ua": photocurrent_ua,
    }
    formatted = [
        {"key": "photon_energy_ev", "label": "Photon Energy (E = hc/λ)", "value": measurements["photon_energy_ev"], "unit": "eV"},
        {"key": "threshold_wavelength_nm", "label": "Threshold Wavelength (λ₀)", "value": measurements["threshold_wavelength_nm"], "unit": "nm"},
        {"key": "k_max_ev", "label": "Max Kinetic Energy (K_max)", "value": measurements["k_max_ev"], "unit": "eV"},
        {"key": "stopping_potential_v", "label": "Stopping Potential (V₀)", "value": measurements["stopping_potential_v"], "unit": "V"},
        {"key": "max_electron_speed_kms", "label": "Max Photoelectron Speed", "value": measurements["max_electron_speed_kms"], "unit": "km/s"},
        {"key": "photocurrent_ua", "label": "Saturation Photocurrent", "value": measurements["photocurrent_ua"], "unit": "μA"},
    ]
    conclusion = (
        f"Photon energy ({measurements['photon_energy_ev']} eV) is below the work function φ = {work_function} eV (λ > λ₀ = {measurements['threshold_wavelength_nm']} nm), so zero photoelectrons are emitted regardless of intensity."
        if not emission_occurs
        else f"Photon energy ({measurements['photon_energy_ev']} eV) exceeds φ = {work_function} eV, ejecting electrons with K_max = {measurements['k_max_ev']} eV (V₀ = {measurements['stopping_potential_v']} V, v_max = {measurements['max_electron_speed_kms']} km/s)."
    )
    return {
        "parameters": {"wavelength": wavelength_nm, "work_function": work_function, "intensity": intensity},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": special_case,
        "assumptions": [
            "Clean metal surface in high vacuum; single-photon absorption per electron.",
            "Constants: hc = 1239.84 eV·nm, mₑ = 9.109 × 10⁻³¹ kg.",
        ],
        "conclusion_summary": conclusion,
    }


PHYSICS_SIMULATIONS = {
    "ohms-law": simulate_ohms_law,
    "simple-pendulum": simulate_simple_pendulum,
    "reflection-of-light": simulate_reflection_of_light,
    "refraction-of-light": simulate_refraction_of_light,
    "projectile-motion": simulate_projectile_motion,
    "convex-lens": simulate_convex_lens,
    "series-parallel-circuits": simulate_series_parallel_circuits,
    "newtons-laws": simulate_newtons_laws,
    "electromagnetic-induction": simulate_electromagnetic_induction,
    "wave-interference": simulate_wave_interference,
    "thermodynamic-processes": simulate_thermodynamic_processes,
    "photoelectric-effect": simulate_photoelectric_effect,
}
