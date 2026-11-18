"""Shared validation utilities for LabXAI deterministic simulation modules."""

from __future__ import annotations

import math
from typing import Any


class SimulationValidationError(ValueError):
    """Raised when experiment input parameters violate physical or mathematical bounds."""


def require_float(params: dict[str, Any], key: str, default: float | None = None) -> float:
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


def require_int(params: dict[str, Any], key: str, default: int | None = None) -> int:
    val = require_float(params, key, float(default) if default is not None else None)
    return int(round(val))


def check_bounds(value: float, low: float, high: float, label: str, unit: str = "", strict_low: bool = False) -> None:
    u = f" {unit}" if unit else ""
    if strict_low:
        if value <= low or value > high:
            raise SimulationValidationError(f"{label} must be > {low}{u} and ≤ {high}{u}.")
    else:
        if value < low or value > high:
            raise SimulationValidationError(f"{label} must be between {low}{u} and {high}{u}.")
