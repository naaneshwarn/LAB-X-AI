"""Modular multidisciplinary deterministic simulation package."""

from app.services.simulations.biology_sim import BIOLOGY_SIMULATIONS
from app.services.simulations.chemistry_sim import CHEMISTRY_SIMULATIONS
from app.services.simulations.common import SimulationValidationError
from app.services.simulations.math_sim import MATH_SIMULATIONS
from app.services.simulations.physics_sim import PHYSICS_SIMULATIONS

ALL_SIMULATIONS = {
    **PHYSICS_SIMULATIONS,
    **CHEMISTRY_SIMULATIONS,
    **BIOLOGY_SIMULATIONS,
    **MATH_SIMULATIONS,
}

__all__ = [
    "ALL_SIMULATIONS",
    "BIOLOGY_SIMULATIONS",
    "CHEMISTRY_SIMULATIONS",
    "MATH_SIMULATIONS",
    "PHYSICS_SIMULATIONS",
    "SimulationValidationError",
]
