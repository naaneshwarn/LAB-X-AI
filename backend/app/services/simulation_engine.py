"""Unified deterministic scientific & mathematical simulation dispatcher for LabXAI.

Preserves all original Physics exports while registering all 48 multidisciplinary experiments
across Physics, Chemistry, Biology, and Mathematics. AI models NEVER invent or alter
computed simulation outputs.
"""

from __future__ import annotations

from typing import Any

from app.services.simulations import (
    ALL_SIMULATIONS,
    BIOLOGY_SIMULATIONS,
    CHEMISTRY_SIMULATIONS,
    MATH_SIMULATIONS,
    PHYSICS_SIMULATIONS,
    SimulationValidationError,
)
from app.services.simulations.physics_sim import (
    simulate_convex_lens,
    simulate_ohms_law,
    simulate_projectile_motion,
    simulate_simple_pendulum,
)

SIMULATION_REGISTRY = ALL_SIMULATIONS


def run_simulation(experiment_id: str, parameters: dict[str, Any]) -> dict[str, Any]:
    """Dispatch deterministic simulation by experiment ID."""
    simulator = SIMULATION_REGISTRY.get(experiment_id)
    if simulator is None:
        raise KeyError(f"Unsupported experiment '{experiment_id}'.")
    return simulator(parameters)


__all__ = [
    "BIOLOGY_SIMULATIONS",
    "CHEMISTRY_SIMULATIONS",
    "MATH_SIMULATIONS",
    "PHYSICS_SIMULATIONS",
    "SIMULATION_REGISTRY",
    "SimulationValidationError",
    "run_simulation",
    "simulate_convex_lens",
    "simulate_ohms_law",
    "simulate_projectile_motion",
    "simulate_simple_pendulum",
]
