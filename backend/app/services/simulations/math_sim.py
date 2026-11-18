"""Deterministic Mathematics simulation engines (12 experiments across Basic, Intermediate, Advanced)."""

from __future__ import annotations

import math
from typing import Any

from app.services.simulations.common import SimulationValidationError, check_bounds, require_float, require_int


def _prime_factors(n: int) -> list[int]:
    factors: list[int] = []
    d = 2
    temp = n
    while d * d <= temp:
        while temp % d == 0:
            factors.append(d)
            temp //= d
        d += 1
    if temp > 1:
        factors.append(temp)
    return factors


def simulate_number_systems(params: dict[str, Any]) -> dict[str, Any]:
    """Base conversions (Bin/Oct/Dec/Hex) & Prime Factorization."""
    number = require_int(params, "number", 42)
    check_bounds(number, 1, 4095, "Integer (n)")

    factors = _prime_factors(number)
    is_prime = len(factors) == 1
    unique_primes = sorted(set(factors))
    factor_str = " × ".join(str(f) for f in factors) if factors else "1"

    # Count divisors
    divisors = [i for i in range(1, number + 1) if number % i == 0]
    binary = bin(number)[2:]
    octal = oct(number)[2:]
    hexa = hex(number)[2:].upper()

    # Place-value bit breakdown for plotting
    bits_rev = list(reversed(binary))
    series_data = [
        {"bit_position": float(i), "bit_value": float(int(b)), "place_contribution": float(int(b) * (2 ** i))}
        for i, b in enumerate(bits_rev)
    ]

    measurements = {
        "decimal": number,
        "binary": binary,
        "octal": octal,
        "hexadecimal": hexa,
        "prime_factorization": factor_str,
        "is_prime": is_prime,
        "divisor_count": len(divisors),
        "unique_prime_count": len(unique_primes),
    }
    formatted = [
        {"key": "binary", "label": "Binary (Base 2)", "value": f"0b{binary}", "unit": ""},
        {"key": "octal", "label": "Octal (Base 8)", "value": f"0o{octal}", "unit": ""},
        {"key": "hexadecimal", "label": "Hexadecimal (Base 16)", "value": f"0x{hexa}", "unit": ""},
        {"key": "prime_factorization", "label": "Prime Factorization", "value": factor_str, "unit": ""},
        {"key": "is_prime", "label": "Classification", "value": "Prime" if is_prime else ("Unit (1)" if number == 1 else "Composite"), "unit": ""},
        {"key": "divisor_count", "label": "Total Divisors", "value": len(divisors), "unit": ""},
    ]
    return {
        "parameters": {"number": float(number)},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": "prime" if is_prime else None,
        "assumptions": [
            "Exact unsigned integer representation in positional bases 2, 8, 10, and 16.",
            "Fundamental Theorem of Arithmetic: every integer > 1 has a unique prime factorization.",
        ],
        "conclusion_summary": (
            f"{number}₁₀ = {binary}₂ = {octal}₈ = {hexa}₁₆; prime factorization is {factor_str} with {len(divisors)} positive divisors."
        ),
    }


def simulate_fractions_decimals(params: dict[str, Any]) -> dict[str, Any]:
    """Exact rational arithmetic: (n1/d1) op (n2/d2) reduced by GCD."""
    n1 = require_int(params, "num1", 3)
    d1 = require_int(params, "den1", 4)
    n2 = require_int(params, "num2", 2)
    d2 = require_int(params, "den2", 5)
    op = require_int(params, "operation", 0)  # 0=Add, 1=Subtract, 2=Multiply, 3=Divide

    check_bounds(n1, -50, 50, "Numerator 1")
    check_bounds(n2, -50, 50, "Numerator 2")
    check_bounds(d1, 1, 50, "Denominator 1")
    check_bounds(d2, 1, 50, "Denominator 2")
    if op not in (0, 1, 2, 3):
        raise SimulationValidationError("Operation must be 0 (+), 1 (−), 2 (×), or 3 (÷).")
    if op == 3 and n2 == 0:
        raise SimulationValidationError("Division by zero is undefined (Numerator 2 cannot be 0).")

    op_sym = {0: "+", 1: "−", 2: "×", 3: "÷"}[op]
    if op == 0:
        rn, rd = n1 * d2 + n2 * d1, d1 * d2
    elif op == 1:
        rn, rd = n1 * d2 - n2 * d1, d1 * d2
    elif op == 2:
        rn, rd = n1 * n2, d1 * d2
    else:
        rn, rd = n1 * d2, d1 * n2

    if rd < 0:
        rn, rd = -rn, -rd
    g = math.gcd(abs(rn), abs(rd))
    rn //= g
    rd //= g

    decimal_val = rn / rd
    pct_val = decimal_val * 100.0
    lcm_den = (d1 * d2) // math.gcd(d1, d2)

    series_data = [
        {"item": 1.0, "decimal_value": round(n1 / d1, 4)},
        {"item": 2.0, "decimal_value": round(n2 / d2, 4)},
        {"item": 3.0, "decimal_value": round(decimal_val, 4)},
    ]

    measurements = {
        "reduced_numerator": rn,
        "reduced_denominator": rd,
        "reduced_fraction": f"{rn}/{rd}" if rd != 1 else str(rn),
        "decimal_value": round(decimal_val, 6),
        "percentage": round(pct_val, 2),
        "lcm_denominators": lcm_den,
        "expression": f"{n1}/{d1} {op_sym} {n2}/{d2}",
    }
    formatted = [
        {"key": "reduced_fraction", "label": "Exact Reduced Fraction", "value": measurements["reduced_fraction"], "unit": ""},
        {"key": "decimal_value", "label": "Decimal Equivalent", "value": measurements["decimal_value"], "unit": ""},
        {"key": "percentage", "label": "Percentage", "value": measurements["percentage"], "unit": "%"},
        {"key": "lcm_denominators", "label": "Common Denominator (LCM)", "value": lcm_den, "unit": ""},
    ]
    return {
        "parameters": {"num1": float(n1), "den1": float(d1), "num2": float(n2), "den2": float(d2), "operation": float(op)},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": None,
        "assumptions": [
            "Exact integer rational arithmetic simplified by Euclidean greatest common divisor (GCD).",
        ],
        "conclusion_summary": (
            f"{measurements['expression']} = {measurements['reduced_fraction']} = {measurements['decimal_value']} ({measurements['percentage']}%)."
        ),
    }


def simulate_basic_geometry(params: dict[str, Any]) -> dict[str, Any]:
    """Triangle properties (Heron's Formula + Law of Cosines) & Circle geometry."""
    a = require_float(params, "side_a", 5.0)
    b = require_float(params, "side_b", 6.0)
    c = require_float(params, "side_c", 7.0)
    r = require_float(params, "circle_radius", 4.0)

    for lbl, s in [("Side a", a), ("Side b", b), ("Side c", c), ("Radius r", r)]:
        check_bounds(s, 0.5, 100.0, lbl, "units")

    if a + b <= c or a + c <= b or b + c <= a:
        raise SimulationValidationError("Triangle inequality violated: the sum of any two sides must exceed the third side.")

    perimeter = a + b + c
    s = perimeter / 2.0
    area = math.sqrt(s * (s - a) * (s - b) * (s - c))
    angle_a = math.degrees(math.acos(max(-1.0, min(1.0, (b * b + c * c - a * a) / (2.0 * b * c)))))
    angle_b = math.degrees(math.acos(max(-1.0, min(1.0, (a * a + c * c - b * b) / (2.0 * a * c)))))
    angle_c = 180.0 - angle_a - angle_b

    sides_sorted = sorted([a, b, c])
    if abs(a - b) < 1e-4 and abs(b - c) < 1e-4:
        tri_type = "Equilateral"
    elif abs(a - b) < 1e-4 or abs(b - c) < 1e-4 or abs(a - c) < 1e-4:
        tri_type = "Isosceles"
    else:
        tri_type = "Scalene"
    if abs(sides_sorted[0] ** 2 + sides_sorted[1] ** 2 - sides_sorted[2] ** 2) < 1e-3:
        tri_type += " Right"

    circle_circumference = 2.0 * math.pi * r
    circle_area = math.pi * (r ** 2)

    series_data = [
        {"radius": float(rad), "circumference": round(2.0 * math.pi * rad, 2), "area": round(math.pi * rad * rad, 2)}
        for rad in range(1, 11)
    ]

    measurements = {
        "triangle_type": tri_type,
        "perimeter": round(perimeter, 4),
        "triangle_area": round(area, 4),
        "angle_A_deg": round(angle_a, 2),
        "angle_B_deg": round(angle_b, 2),
        "angle_C_deg": round(angle_c, 2),
        "circle_circumference": round(circle_circumference, 4),
        "circle_area": round(circle_area, 4),
    }
    formatted = [
        {"key": "triangle_type", "label": "Triangle Classification", "value": tri_type, "unit": ""},
        {"key": "triangle_area", "label": "Triangle Area (Heron)", "value": measurements["triangle_area"], "unit": "u²"},
        {"key": "perimeter", "label": "Triangle Perimeter", "value": measurements["perimeter"], "unit": "u"},
        {"key": "angle_A_deg", "label": "Interior Angles (A/B/C)", "value": f"{measurements['angle_A_deg']}° / {measurements['angle_B_deg']}° / {measurements['angle_C_deg']}°", "unit": ""},
        {"key": "circle_area", "label": "Circle Area (πr²)", "value": measurements["circle_area"], "unit": "u²"},
        {"key": "circle_circumference", "label": "Circumference (2πr)", "value": measurements["circle_circumference"], "unit": "u"},
    ]
    return {
        "parameters": {"side_a": a, "side_b": b, "side_c": c, "circle_radius": r},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": tri_type.lower().replace(" ", "_"),
        "assumptions": [
            "Euclidean plane geometry; interior angles of every triangle sum strictly to 180°.",
        ],
        "conclusion_summary": (
            f"Triangle ({a}, {b}, {c}) is {tri_type} with area {measurements['triangle_area']} u² and angles "
            f"{measurements['angle_A_deg']}°, {measurements['angle_B_deg']}°, {measurements['angle_C_deg']}°. Circle (r={r}) has area {measurements['circle_area']} u²."
        ),
    }


def simulate_algebraic_expressions(params: dict[str, Any]) -> dict[str, Any]:
    """Evaluate polynomial & binomial square expansion (px + q)^2."""
    p = require_float(params, "p", 2.0)
    q = require_float(params, "q", 3.0)
    x_val = require_float(params, "x_value", 4.0)

    check_bounds(p, -20.0, 20.0, "Coefficient p")
    check_bounds(q, -20.0, 20.0, "Constant q")
    check_bounds(x_val, -20.0, 20.0, "Variable x")

    linear_val = p * x_val + q
    a_exp = p * p
    b_exp = 2.0 * p * q
    c_exp = q * q
    expanded_val = a_exp * (x_val ** 2) + b_exp * x_val + c_exp

    series_data = [
        {"x": float(x_pt), "linear": round(p * x_pt + q, 3), "squared": round((p * x_pt + q) ** 2, 3)}
        for x_pt in range(-5, 6)
    ]

    measurements = {
        "linear_value": round(linear_val, 4),
        "squared_value": round(expanded_val, 4),
        "expanded_a": round(a_exp, 4),
        "expanded_b": round(b_exp, 4),
        "expanded_c": round(c_exp, 4),
        "expanded_form": f"{round(a_exp, 2)}x² + ({round(b_exp, 2)})x + {round(c_exp, 2)}",
    }
    formatted = [
        {"key": "linear_value", "label": "Linear Value (px + q)", "value": measurements["linear_value"], "unit": ""},
        {"key": "squared_value", "label": "Binomial Square (px + q)²", "value": measurements["squared_value"], "unit": ""},
        {"key": "expanded_form", "label": "Expanded Identity", "value": measurements["expanded_form"], "unit": ""},
    ]
    return {
        "parameters": {"p": p, "q": q, "x_value": x_val},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": None,
        "assumptions": [
            "Algebraic identity (px + q)² = p²x² + 2pqx + q² holds for all real numbers x.",
        ],
        "conclusion_summary": (
            f"At x = {x_val}, ({p}x + {q}) = {measurements['linear_value']} and ({p}x + {q})² = {measurements['squared_value']} "
            f"(matching {measurements['expanded_form']})."
        ),
    }


def simulate_trigonometric_functions(params: dict[str, Any]) -> dict[str, Any]:
    """Unit Circle Trig Values & Sinusoidal Wave y = A sin(ωx + φ)."""
    angle_deg = require_float(params, "angle_deg", 30.0)
    amplitude = require_float(params, "amplitude", 2.0)
    freq_omega = require_float(params, "frequency", 1.0)
    phase_deg = require_float(params, "phase_deg", 0.0)

    check_bounds(angle_deg, 0.0, 360.0, "Angle (θ)", "°")
    check_bounds(amplitude, 0.1, 10.0, "Amplitude (A)")
    check_bounds(freq_omega, 0.25, 5.0, "Angular frequency (ω)")
    check_bounds(phase_deg, -180.0, 180.0, "Phase shift (φ)", "°")

    rad = math.radians(angle_deg)
    sin_v = math.sin(rad)
    cos_v = math.cos(rad)
    is_tan_undef = abs(cos_v) < 1e-9
    tan_v = None if is_tan_undef else (sin_v / cos_v)
    period_deg = 360.0 / freq_omega
    wave_y = amplitude * math.sin(freq_omega * rad + math.radians(phase_deg))

    series_data = []
    for deg in range(0, 361, 15):
        r_pt = math.radians(deg)
        series_data.append(
            {
                "angle_deg": float(deg),
                "wave_sin": round(amplitude * math.sin(freq_omega * r_pt + math.radians(phase_deg)), 4),
                "unit_cos": round(math.cos(r_pt), 4),
            }
        )

    measurements = {
        "angle_rad": round(rad, 5),
        "sin_theta": round(sin_v, 5),
        "cos_theta": round(cos_v, 5),
        "tan_theta": round(tan_v, 5) if tan_v is not None else None,
        "pythagorean_check": round(sin_v ** 2 + cos_v ** 2, 6),
        "wave_value_y": round(wave_y, 4),
        "period_deg": round(period_deg, 2),
    }
    formatted = [
        {"key": "angle_rad", "label": "Angle in Radians", "value": measurements["angle_rad"], "unit": "rad"},
        {"key": "sin_theta", "label": "sin(θ)", "value": measurements["sin_theta"], "unit": ""},
        {"key": "cos_theta", "label": "cos(θ)", "value": measurements["cos_theta"], "unit": ""},
        {"key": "tan_theta", "label": "tan(θ)", "value": "Undefined (∞)" if is_tan_undef else measurements["tan_theta"], "unit": ""},
        {"key": "wave_value_y", "label": "Wave y = A sin(ωθ + φ)", "value": measurements["wave_value_y"], "unit": ""},
        {"key": "period_deg", "label": "Wave Period", "value": measurements["period_deg"], "unit": "°"},
    ]
    return {
        "parameters": {"angle_deg": angle_deg, "amplitude": amplitude, "frequency": freq_omega, "phase_deg": phase_deg},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": "tan_asymptote" if is_tan_undef else None,
        "assumptions": [
            "Trigonometric ratios defined on the unit circle x² + y² = 1 (sin²θ + cos²θ = 1).",
        ],
        "conclusion_summary": (
            f"At θ = {angle_deg}° ({measurements['angle_rad']} rad): sin θ = {measurements['sin_theta']}, "
            f"cos θ = {measurements['cos_theta']}, and wave y = {measurements['wave_value_y']} (period {measurements['period_deg']}°)."
        ),
    }


def simulate_coordinate_geometry(params: dict[str, Any]) -> dict[str, Any]:
    """2D Analytic Geometry: distance, midpoint, slope, line equation."""
    x1 = require_float(params, "x1", -2.0)
    y1 = require_float(params, "y1", 1.0)
    x2 = require_float(params, "x2", 4.0)
    y2 = require_float(params, "y2", 5.0)

    for lbl, v in [("x₁", x1), ("y₁", y1), ("x₂", x2), ("y₂", y2)]:
        check_bounds(v, -50.0, 50.0, lbl)

    dx = x2 - x1
    dy = y2 - y1
    dist = math.hypot(dx, dy)
    mid_x = (x1 + x2) / 2.0
    mid_y = (y1 + y2) / 2.0

    is_vertical = abs(dx) < 1e-9
    if is_vertical:
        slope = None
        y_intercept = None
        inclination = 90.0 if abs(dy) > 1e-9 else 0.0
        eq_str = f"x = {round(x1, 2)}"
        special_case = "vertical_line"
    else:
        slope = dy / dx
        y_intercept = y1 - slope * x1
        inclination = math.degrees(math.atan(slope))
        sign = "+" if y_intercept >= 0 else "−"
        eq_str = f"y = {round(slope, 3)}x {sign} {round(abs(y_intercept), 3)}"
        special_case = "horizontal_line" if abs(slope) < 1e-9 else None

    series_data = []
    if not is_vertical:
        lo_x = min(x1, x2) - 2.0
        hi_x = max(x1, x2) + 2.0
        for i in range(11):
            xp = lo_x + (hi_x - lo_x) * i / 10.0
            series_data.append({"x": round(xp, 2), "y": round(slope * xp + y_intercept, 3)})  # type: ignore[operator]
    else:
        for i in range(11):
            yp = min(y1, y2) - 2.0 + (abs(dy) + 4.0) * i / 10.0
            series_data.append({"x": round(x1, 2), "y": round(yp, 2)})

    measurements = {
        "distance": round(dist, 4),
        "midpoint_x": round(mid_x, 4),
        "midpoint_y": round(mid_y, 4),
        "slope": round(slope, 4) if slope is not None else None,
        "y_intercept": round(y_intercept, 4) if y_intercept is not None else None,
        "inclination_deg": round(inclination, 2),
        "line_equation": eq_str,
    }
    formatted = [
        {"key": "distance", "label": "Euclidean Distance (d)", "value": measurements["distance"], "unit": "units"},
        {"key": "midpoint_x", "label": "Midpoint M(x, y)", "value": f"({measurements['midpoint_x']}, {measurements['midpoint_y']})", "unit": ""},
        {"key": "slope", "label": "Slope (m = Δy/Δx)", "value": "Undefined (Vertical)" if is_vertical else measurements["slope"], "unit": ""},
        {"key": "line_equation", "label": "Line Equation", "value": eq_str, "unit": ""},
        {"key": "inclination_deg", "label": "Inclination Angle", "value": measurements["inclination_deg"], "unit": "°"},
    ]
    return {
        "parameters": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": special_case,
        "assumptions": ["Standard 2D Cartesian plane with orthonormal axes."],
        "conclusion_summary": (
            f"Between ({x1}, {y1}) and ({x2}, {y2}): distance d = {measurements['distance']}, "
            f"midpoint = ({measurements['midpoint_x']}, {measurements['midpoint_y']}), line equation: {eq_str}."
        ),
    }


def simulate_probability_statistics(params: dict[str, Any]) -> dict[str, Any]:
    """Binomial Distribution B(n, p): exact PMF, CDF, mean, variance, std dev."""
    n = require_int(params, "trials", 10)
    p = require_float(params, "prob_success", 0.5)
    k = require_int(params, "target_k", 5)

    check_bounds(n, 1, 30, "Number of trials (n)")
    check_bounds(p, 0.0, 1.0, "Success probability (p)")
    check_bounds(k, 0, n, "Target successes (k)")

    def pmf(r: int) -> float:
        return math.comb(n, r) * (p ** r) * ((1.0 - p) ** (n - r))

    exact_pk = pmf(k)
    cdf_pk = sum(pmf(r) for r in range(k + 1))
    mean = n * p
    variance = n * p * (1.0 - p)
    std_dev = math.sqrt(variance)

    series_data = [{"k": float(r), "probability": round(pmf(r), 5)} for r in range(n + 1)]

    measurements = {
        "p_exact_k": round(exact_pk, 5),
        "p_at_most_k": round(cdf_pk, 5),
        "p_at_least_k": round(1.0 - sum(pmf(r) for r in range(k)), 5),
        "mean": round(mean, 4),
        "variance": round(variance, 4),
        "std_dev": round(std_dev, 4),
    }
    formatted = [
        {"key": "p_exact_k", "label": f"Exact P(X = {k})", "value": measurements["p_exact_k"], "unit": ""},
        {"key": "p_at_most_k", "label": f"Cumulative P(X ≤ {k})", "value": measurements["p_at_most_k"], "unit": ""},
        {"key": "mean", "label": "Expected Value (μ = np)", "value": measurements["mean"], "unit": ""},
        {"key": "variance", "label": "Variance (σ² = npq)", "value": measurements["variance"], "unit": ""},
        {"key": "std_dev", "label": "Standard Deviation (σ)", "value": measurements["std_dev"], "unit": ""},
    ]
    return {
        "parameters": {"trials": float(n), "prob_success": p, "target_k": float(k)},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": None,
        "assumptions": [
            "n independent Bernoulli trials with constant probability p of success.",
        ],
        "conclusion_summary": (
            f"For X ~ Binomial(n={n}, p={p}), P(X={k}) = {measurements['p_exact_k']} and P(X≤{k}) = {measurements['p_at_most_k']}, "
            f"with μ = {measurements['mean']} and σ = {measurements['std_dev']}."
        ),
    }


def simulate_quadratic_equations(params: dict[str, Any]) -> dict[str, Any]:
    """Quadratic Solver: ax^2 + bx + c = 0, discriminant, vertex, roots."""
    a = require_float(params, "a", 1.0)
    b = require_float(params, "b", -5.0)
    c = require_float(params, "c", 6.0)

    check_bounds(a, -20.0, 20.0, "Coefficient a")
    check_bounds(b, -50.0, 50.0, "Coefficient b")
    check_bounds(c, -50.0, 50.0, "Constant c")
    if abs(a) < 1e-9:
        raise SimulationValidationError("Coefficient 'a' must be non-zero for a quadratic equation.")

    disc = b * b - 4.0 * a * c
    vx = -b / (2.0 * a)
    vy = a * vx * vx + b * vx + c

    if disc > 1e-9:
        r1 = (-b + math.sqrt(disc)) / (2.0 * a)
        r2 = (-b - math.sqrt(disc)) / (2.0 * a)
        root_nature = "Two Distinct Real Roots"
        roots_str = f"x₁ = {round(r1, 4)}, x₂ = {round(r2, 4)}"
        special_case = "two_real_roots"
    elif abs(disc) <= 1e-9:
        r1 = r2 = vx
        root_nature = "One Repeated Real Root"
        roots_str = f"x = {round(r1, 4)}"
        special_case = "repeated_root"
    else:
        r1 = r2 = None
        imag = math.sqrt(-disc) / (2.0 * abs(a))
        root_nature = "Two Complex Conjugate Roots"
        roots_str = f"{round(vx, 3)} ± {round(imag, 3)}i"
        special_case = "complex_roots"

    series_data = []
    for i in range(-10, 11):
        xp = vx + i * 0.6
        yp = a * xp * xp + b * xp + c
        series_data.append({"x": round(xp, 2), "y": round(yp, 3)})

    measurements = {
        "discriminant": round(disc, 4),
        "root_nature": root_nature,
        "root_1": round(r1, 4) if r1 is not None else None,
        "root_2": round(r2, 4) if r2 is not None else None,
        "roots_display": roots_str,
        "vertex_x": round(vx, 4),
        "vertex_y": round(vy, 4),
        "opens": "Upward (Minimum)" if a > 0 else "Downward (Maximum)",
    }
    formatted = [
        {"key": "discriminant", "label": "Discriminant (Δ = b²−4ac)", "value": measurements["discriminant"], "unit": ""},
        {"key": "root_nature", "label": "Nature of Roots", "value": root_nature, "unit": ""},
        {"key": "roots_display", "label": "Solutions", "value": roots_str, "unit": ""},
        {"key": "vertex_x", "label": "Vertex (h, k)", "value": f"({measurements['vertex_x']}, {measurements['vertex_y']})", "unit": ""},
        {"key": "opens", "label": "Parabola Orientation", "value": measurements["opens"], "unit": ""},
    ]
    return {
        "parameters": {"a": a, "b": b, "c": c},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": special_case,
        "assumptions": ["Exact quadratic formula x = (−b ± √(b² − 4ac)) / (2a) for a ≠ 0."],
        "conclusion_summary": (
            f"For {a}x² + ({b})x + ({c}) = 0: Δ = {measurements['discriminant']} ({root_nature}), "
            f"solutions: {roots_str}, vertex at ({measurements['vertex_x']}, {measurements['vertex_y']})."
        ),
    }


def simulate_differential_calculus(params: dict[str, Any]) -> dict[str, Any]:
    """Exact Derivatives & Tangent Line for cubic f(x) = a*x^3 + b*x^2 + c*x + d."""
    a = require_float(params, "a", 1.0)
    b = require_float(params, "b", -3.0)
    c = require_float(params, "c", 2.0)
    d = require_float(params, "d", 1.0)
    x0 = require_float(params, "x0", 2.0)

    for lbl, v in [("a", a), ("b", b), ("c", c), ("d", d)]:
        check_bounds(v, -10.0, 10.0, f"Coefficient {lbl}")
    check_bounds(x0, -10.0, 10.0, "Evaluation point x₀")

    fx = a * (x0 ** 3) + b * (x0 ** 2) + c * x0 + d
    dfx = 3.0 * a * (x0 ** 2) + 2.0 * b * x0 + c
    d2fx = 6.0 * a * x0 + 2.0 * b
    concavity = "Concave Up" if d2fx > 1e-6 else ("Concave Down" if d2fx < -1e-6 else "Inflection / Linear")
    trend = "Increasing" if dfx > 1e-6 else ("Decreasing" if dfx < -1e-6 else "Stationary Point")

    series_data = []
    for i in range(-12, 13):
        xp = x0 + i * 0.35
        y_f = a * (xp ** 3) + b * (xp ** 2) + c * xp + d
        y_tan = fx + dfx * (xp - x0)
        y_df = 3.0 * a * (xp ** 2) + 2.0 * b * xp + c
        series_data.append({"x": round(xp, 2), "f_x": round(y_f, 3), "tangent": round(y_tan, 3), "f_prime": round(y_df, 3)})

    measurements = {
        "f_x0": round(fx, 4),
        "f_prime_x0": round(dfx, 4),
        "f_double_prime_x0": round(d2fx, 4),
        "trend": trend,
        "concavity": concavity,
        "tangent_intercept": round(fx - dfx * x0, 4),
    }
    formatted = [
        {"key": "f_x0", "label": f"Function Value f({x0})", "value": measurements["f_x0"], "unit": ""},
        {"key": "f_prime_x0", "label": f"1st Derivative f'({x0}) (Slope)", "value": measurements["f_prime_x0"], "unit": ""},
        {"key": "f_double_prime_x0", "label": f"2nd Derivative f''({x0})", "value": measurements["f_double_prime_x0"], "unit": ""},
        {"key": "trend", "label": "Local Behavior", "value": f"{trend} · {concavity}", "unit": ""},
    ]
    return {
        "parameters": {"a": a, "b": b, "c": c, "d": d, "x0": x0},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": "stationary_point" if abs(dfx) < 1e-6 else None,
        "assumptions": ["Analytical polynomial differentiation: d/dx(xⁿ) = n·xⁿ⁻¹."],
        "conclusion_summary": (
            f"At x₀ = {x0}: f({x0}) = {measurements['f_x0']}, instantaneous slope f'({x0}) = {measurements['f_prime_x0']} ({trend}), "
            f"and f''({x0}) = {measurements['f_double_prime_x0']} ({concavity})."
        ),
    }


def simulate_integral_calculus(params: dict[str, Any]) -> dict[str, Any]:
    """Definite Integral vs Midpoint Riemann Sum for f(x) = a*x^2 + b*x + c."""
    a = require_float(params, "a", 1.0)
    b = require_float(params, "b", 0.0)
    c = require_float(params, "c", 1.0)
    x_low = require_float(params, "lower_limit", 0.0)
    x_high = require_float(params, "upper_limit", 3.0)
    subintervals = require_int(params, "subintervals", 12)

    for lbl, v in [("a", a), ("b", b), ("c", c)]:
        check_bounds(v, -10.0, 10.0, f"Coefficient {lbl}")
    check_bounds(x_low, -10.0, 10.0, "Lower limit")
    check_bounds(x_high, -10.0, 10.0, "Upper limit")
    if x_high <= x_low:
        raise SimulationValidationError("Upper integration limit must be strictly greater than lower limit.")
    check_bounds(subintervals, 2, 100, "Riemann subintervals (N)")

    def f(x: float) -> float:
        return a * x * x + b * x + c

    def antideriv(x: float) -> float:
        return (a / 3.0) * (x ** 3) + (b / 2.0) * (x ** 2) + c * x

    exact_integral = antideriv(x_high) - antideriv(x_low)
    dx = (x_high - x_low) / subintervals
    midpoint_sum = sum(f(x_low + (i + 0.5) * dx) * dx for i in range(subintervals))
    left_sum = sum(f(x_low + i * dx) * dx for i in range(subintervals))
    error_pct = abs(midpoint_sum - exact_integral) / max(1e-9, abs(exact_integral)) * 100.0
    avg_val = exact_integral / (x_high - x_low)

    series_data = [
        {"x": round(x_low + (i + 0.5) * dx, 3), "f_x": round(f(x_low + (i + 0.5) * dx), 3)}
        for i in range(subintervals)
    ]

    measurements = {
        "exact_integral": round(exact_integral, 5),
        "midpoint_riemann": round(midpoint_sum, 5),
        "left_riemann": round(left_sum, 5),
        "approx_error_pct": round(error_pct, 4),
        "average_value": round(avg_val, 4),
    }
    formatted = [
        {"key": "exact_integral", "label": "Exact Definite Integral", "value": measurements["exact_integral"], "unit": ""},
        {"key": "midpoint_riemann", "label": f"Midpoint Riemann (N={subintervals})", "value": measurements["midpoint_riemann"], "unit": ""},
        {"key": "left_riemann", "label": "Left Riemann Sum", "value": measurements["left_riemann"], "unit": ""},
        {"key": "approx_error_pct", "label": "Midpoint Relative Error", "value": measurements["approx_error_pct"], "unit": "%"},
        {"key": "average_value", "label": "Mean Function Value", "value": measurements["average_value"], "unit": ""},
    ]
    return {
        "parameters": {"a": a, "b": b, "c": c, "lower_limit": x_low, "upper_limit": x_high, "subintervals": float(subintervals)},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": None,
        "assumptions": ["Fundamental Theorem of Calculus for continuous quadratic integrand over [a, b]."],
        "conclusion_summary": (
            f"∫[{x_low}, {x_high}] ({a}x² + {b}x + {c}) dx = {measurements['exact_integral']} exactly; "
            f"{subintervals}-bin midpoint Riemann sum gives {measurements['midpoint_riemann']} ({measurements['approx_error_pct']}% error)."
        ),
    }


def simulate_matrices_linear_algebra(params: dict[str, Any]) -> dict[str, Any]:
    """2x2 Matrix Determinant, Trace, Inverse, Eigenvalues, and Area Scaling."""
    a11 = require_float(params, "a11", 3.0)
    a12 = require_float(params, "a12", 1.0)
    a21 = require_float(params, "a21", 2.0)
    a22 = require_float(params, "a22", 4.0)

    for lbl, v in [("a₁₁", a11), ("a₁₂", a12), ("a₂₁", a21), ("a₂₂", a22)]:
        check_bounds(v, -20.0, 20.0, lbl)

    det = a11 * a22 - a12 * a21
    trace = a11 + a22
    frob = math.sqrt(a11 ** 2 + a12 ** 2 + a21 ** 2 + a22 ** 2)
    invertible = abs(det) > 1e-9

    if invertible:
        inv = [[round(a22 / det, 4), round(-a12 / det, 4)], [round(-a21 / det, 4), round(a11 / det, 4)]]
        inv_str = f"[{inv[0][0]}, {inv[0][1]}; {inv[1][0]}, {inv[1][1]}]"
    else:
        inv = None
        inv_str = "Singular (No Inverse)"

    char_disc = trace * trace - 4.0 * det
    if char_disc >= 0.0:
        eig1 = (trace + math.sqrt(char_disc)) / 2.0
        eig2 = (trace - math.sqrt(char_disc)) / 2.0
        eig_str = f"λ₁ = {round(eig1, 4)}, λ₂ = {round(eig2, 4)}"
    else:
        re = trace / 2.0
        im = math.sqrt(-char_disc) / 2.0
        eig1 = eig2 = None
        eig_str = f"{round(re, 3)} ± {round(im, 3)}i"

    # Unit square corners transformed by A
    corners = [(0, 0), (1, 0), (1, 1), (0, 1), (0, 0)]
    series_data = [
        {"x_transformed": round(a11 * x + a12 * y, 3), "y_transformed": round(a21 * x + a22 * y, 3)}
        for x, y in corners
    ]

    measurements = {
        "determinant": round(det, 4),
        "trace": round(trace, 4),
        "invertible": invertible,
        "inverse_matrix": inv,
        "inverse_display": inv_str,
        "eigenvalue_1": round(eig1, 4) if eig1 is not None else None,
        "eigenvalue_2": round(eig2, 4) if eig2 is not None else None,
        "eigenvalues_display": eig_str,
        "frobenius_norm": round(frob, 4),
        "area_scale_factor": round(abs(det), 4),
    }
    formatted = [
        {"key": "determinant", "label": "Determinant det(A)", "value": measurements["determinant"], "unit": ""},
        {"key": "trace", "label": "Trace tr(A)", "value": measurements["trace"], "unit": ""},
        {"key": "inverse_display", "label": "Inverse Matrix A⁻¹", "value": inv_str, "unit": ""},
        {"key": "eigenvalues_display", "label": "Eigenvalues (λ)", "value": eig_str, "unit": ""},
        {"key": "frobenius_norm", "label": "Frobenius Norm ‖A‖_F", "value": measurements["frobenius_norm"], "unit": ""},
    ]
    return {
        "parameters": {"a11": a11, "a12": a12, "a21": a21, "a22": a22},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": "singular_matrix" if not invertible else None,
        "assumptions": ["Real 2×2 linear transformation mapping the unit square to a parallelogram of area |det(A)|."],
        "conclusion_summary": (
            f"Matrix A has det(A) = {measurements['determinant']}, tr(A) = {measurements['trace']}, "
            f"eigenvalues {eig_str}, and is {'invertible' if invertible else 'singular (non-invertible)'}."
        ),
    }


def simulate_three_dimensional_geometry(params: dict[str, Any]) -> dict[str, Any]:
    """3D Vector Operations: dot product, cross product, angle, distance, and sphere geometry."""
    ux = require_float(params, "ux", 3.0)
    uy = require_float(params, "uy", 4.0)
    uz = require_float(params, "uz", 0.0)
    vx = require_float(params, "vx", 1.0)
    vy = require_float(params, "vy", 0.0)
    vz = require_float(params, "vz", 2.0)

    for lbl, v in [("u_x", ux), ("u_y", uy), ("u_z", uz), ("v_x", vx), ("v_y", vy), ("v_z", vz)]:
        check_bounds(v, -20.0, 20.0, lbl)

    mag_u = math.sqrt(ux ** 2 + uy ** 2 + uz ** 2)
    mag_v = math.sqrt(vx ** 2 + vy ** 2 + vz ** 2)
    dist = math.sqrt((ux - vx) ** 2 + (uy - vy) ** 2 + (uz - vz) ** 2)
    dot = ux * vx + uy * vy + uz * vz
    cx = uy * vz - uz * vy
    cy = uz * vx - ux * vz
    cz = ux * vy - uy * vx
    mag_cross = math.sqrt(cx ** 2 + cy ** 2 + cz ** 2)

    if mag_u > 1e-9 and mag_v > 1e-9:
        cos_ang = max(-1.0, min(1.0, dot / (mag_u * mag_v)))
        angle_deg = math.degrees(math.acos(cos_ang))
    else:
        angle_deg = None

    sphere_vol = (4.0 / 3.0) * math.pi * (mag_u ** 3)
    series_data = [
        {"axis": 1.0, "u_component": ux, "v_component": vx, "cross_component": round(cx, 3)},
        {"axis": 2.0, "u_component": uy, "v_component": vy, "cross_component": round(cy, 3)},
        {"axis": 3.0, "u_component": uz, "v_component": vz, "cross_component": round(cz, 3)},
    ]

    measurements = {
        "mag_u": round(mag_u, 4),
        "mag_v": round(mag_v, 4),
        "distance": round(dist, 4),
        "dot_product": round(dot, 4),
        "cross_x": round(cx, 4),
        "cross_y": round(cy, 4),
        "cross_z": round(cz, 4),
        "cross_display": f"({round(cx, 2)}, {round(cy, 2)}, {round(cz, 2)})",
        "parallelogram_area": round(mag_cross, 4),
        "angle_deg": round(angle_deg, 2) if angle_deg is not None else None,
        "sphere_volume": round(sphere_vol, 3),
    }
    formatted = [
        {"key": "mag_u", "label": "Magnitudes |u| / |v|", "value": f"{measurements['mag_u']} / {measurements['mag_v']}", "unit": ""},
        {"key": "dot_product", "label": "Dot Product (u · v)", "value": measurements["dot_product"], "unit": ""},
        {"key": "cross_display", "label": "Cross Product (u × v)", "value": measurements["cross_display"], "unit": ""},
        {"key": "parallelogram_area", "label": "Parallelogram Area |u × v|", "value": measurements["parallelogram_area"], "unit": "u²"},
        {"key": "angle_deg", "label": "Angle Between Vectors", "value": measurements["angle_deg"] if angle_deg is not None else "Undefined", "unit": "°" if angle_deg is not None else ""},
        {"key": "distance", "label": "3D Distance |u − v|", "value": measurements["distance"], "unit": "u"},
    ]
    return {
        "parameters": {"ux": ux, "uy": uy, "uz": uz, "vx": vx, "vy": vy, "vz": vz},
        "measurements": measurements,
        "formatted_measurements": formatted,
        "series_data": series_data,
        "special_case": "orthogonal" if (angle_deg is not None and abs(angle_deg - 90.0) < 0.05) else None,
        "assumptions": ["Right-handed 3D Cartesian coordinate system (i × j = k)."],
        "conclusion_summary": (
            f"For u=({ux},{uy},{uz}) and v=({vx},{vy},{vz}): u·v = {measurements['dot_product']}, "
            f"u×v = {measurements['cross_display']} (area {measurements['parallelogram_area']} u²), angle = {measurements['angle_deg']}°."
        ),
    }


MATH_SIMULATIONS = {
    "number-systems": simulate_number_systems,
    "fractions-decimals": simulate_fractions_decimals,
    "basic-geometry": simulate_basic_geometry,
    "algebraic-expressions": simulate_algebraic_expressions,
    "trigonometric-functions": simulate_trigonometric_functions,
    "coordinate-geometry": simulate_coordinate_geometry,
    "probability-statistics": simulate_probability_statistics,
    "quadratic-equations": simulate_quadratic_equations,
    "differential-calculus": simulate_differential_calculus,
    "integral-calculus": simulate_integral_calculus,
    "matrices-linear-algebra": simulate_matrices_linear_algebra,
    "three-dimensional-geometry": simulate_three_dimensional_geometry,
}
