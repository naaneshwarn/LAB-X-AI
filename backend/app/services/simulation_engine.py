"""Deterministic scientific simulation engine for LabXAI virtual experiments.

All authoritative scientific calculations are performed here (and mirrored in the
frontend for zero-latency interactivity). AI models must NEVER invent or alter
these computed values.
"""

from __future__ import annotations

import math
from typing import Any


class SimulationValidationError(ValueError):
    """Raised when experiment input parameters violate physical or numeric bounds."""


def _require_float(params: dict[str, Any], key: str, default: float | None = None) -> float:
    raw = params.get(key, default)
    if raw is None:
        raise SimulationValidationError(f"Missing required parameter '{key}'.")
    try:
        value = float(raw)
    except (TypeError, ValueError) as exc:
        raise SimulationValidationError(f"Parameter '{key}' must be a valid number.") from exc
    if math.isnan(value) or math.isinf(value):
        raise SimulationValidationError(f"Parameter '{key}' must be a finite number.")
    return value


def simulate_ohms_law(params: dict[str, Any]) -> dict[str, Any]:
    """Ohm's Law: V = I * R, I = V / R, P = V * I."""
    voltage = _require_float(params, "voltage", 12.0)
    resistance = _require_float(params, "resistance", 20.0)

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

    # Generate V-I characteristic sweep across 0..max(24, voltage)
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
    length = _require_float(params, "length", 1.0)
    gravity = _require_float(params, "gravity", 9.81)
    initial_angle = _require_float(params, "initial_angle", 12.0)
    oscillations = int(round(_require_float(params, "oscillations", 10)))

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

    # Series of T vs L for graphing
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

    special_case = (
        "large_angle_regime"
        if initial_angle > 15.0
        else "small_angle_approximation_valid"
    )

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


def simulate_projectile_motion(params: dict[str, Any]) -> dict[str, Any]:
    """Idealized 2D Projectile Motion over level ground (negligible air resistance)."""
    u = _require_float(params, "initial_velocity", 25.0)
    angle_deg = _require_float(params, "launch_angle", 45.0)
    g = _require_float(params, "gravity", 9.81)

    if u <= 0.0 or u > 500.0:
        raise SimulationValidationError("Initial velocity must be between 0.1 m/s and 500 m/s.")
    if angle_deg < 0.0 or angle_deg > 90.0:
        raise SimulationValidationError("Launch angle must be between 0° and 90°.")
    if g <= 0.1 or g > 50.0:
        raise SimulationValidationError("Gravity must be between 0.1 m/s² and 50.0 m/s².")

    theta = math.radians(angle_deg)
    vx = u * math.cos(theta)
    vy0 = u * math.sin(theta)

    # Guard exact trigonometric zeros at 0° and 90°
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

    # Generate 41 trajectory sample points
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
    """Thin Convex Lens using New Cartesian Sign Convention: 1/f = 1/v - 1/u.

    Input object_distance may be provided as a positive distance to the left of the lens
    (e.g., 30 cm -> u = -30 cm) or directly as negative Cartesian u (e.g., -30 cm).
    """
    raw_u = _require_float(params, "object_distance", 30.0)
    f = _require_float(params, "focal_length", 15.0)
    object_height = _require_float(params, "object_height", 4.0)

    if abs(raw_u) < 0.5 or abs(raw_u) > 500.0:
        raise SimulationValidationError(
            "Object distance magnitude |u| must be between 0.5 cm and 500 cm."
        )
    if f <= 0.5 or f > 200.0:
        raise SimulationValidationError(
            "Convex lens focal length (f) must be positive and between 0.5 cm and 200 cm."
        )
    if object_height <= 0.1 or object_height > 50.0:
        raise SimulationValidationError("Object height must be between 0.1 cm and 50 cm.")

    # Enforce Cartesian sign convention: real object placed to the left of lens => u < 0
    u = -abs(raw_u)
    abs_u = abs(u)
    optical_power = 100.0 / f  # Diopters (f in cm)

    denominator = f + u  # Since 1/v = 1/f + 1/u = (u + f) / (f * u)
    is_at_focus = abs(denominator) < 1e-6

    if is_at_focus:
        v: float | None = None
        magnification: float | None = None
        image_height: float | None = None
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

    # Generate image-distance vs object-distance curve (skipping singularity near f)
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
        {
            "key": "image_distance",
            "label": "Image Position (v)",
            "value": "∞ (Infinity)" if is_at_focus else measurements["image_distance"],
            "unit": "" if is_at_focus else "cm",
        },
        {
            "key": "magnification",
            "label": "Magnification (m = v/u)",
            "value": "Undefined (∞)" if is_at_focus else measurements["magnification"],
            "unit": "×" if not is_at_focus else "",
        },
        {"key": "image_type", "label": "Image Nature", "value": f"{image_type}, {image_orientation}", "unit": ""},
        {"key": "optical_power_diopters", "label": "Optical Power (P)", "value": measurements["optical_power_diopters"], "unit": "D"},
    ]

    return {
        "parameters": {
            "object_distance": abs_u,
            "focal_length": f,
            "object_height": object_height,
        },
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


SIMULATION_REGISTRY = {
    "ohms-law": simulate_ohms_law,
    "simple-pendulum": simulate_simple_pendulum,
    "projectile-motion": simulate_projectile_motion,
    "convex-lens": simulate_convex_lens,
}


def run_simulation(experiment_id: str, parameters: dict[str, Any]) -> dict[str, Any]:
    """Dispatch deterministic simulation by experiment ID."""
    simulator = SIMULATION_REGISTRY.get(experiment_id)
    if simulator is None:
        raise KeyError(f"Unsupported experiment '{experiment_id}'.")
    return simulator(parameters)
