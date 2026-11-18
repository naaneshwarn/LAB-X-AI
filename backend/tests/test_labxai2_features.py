"""Automated backend tests for LabXAI 2.0 Biology, Chemistry, AI Context & Playground Persistence."""

from __future__ import annotations

from pathlib import Path

import pytest

from app.api.routes.playground import (
    create_playground_project,
    delete_playground_project,
    get_playground_project,
    list_playground_projects,
    update_playground_project,
)
from app.database.init_db import init_db
from app.database.session import create_connection
from app.schemas.playground import PlaygroundProjectCreate, PlaygroundProjectUpdate
from app.services.conversation_service import answer_scientific_followup
from app.services.simulation_engine import run_simulation


def test_respiratory_nervous_and_reaction_backend_engines():
    resp = run_simulation(
        "human-respiratory-system",
        {"breathing_rate": 16, "tidal_volume": 500, "age_group": 1, "organ_index": 8},
    )
    assert resp["measurements"]["organ_name"] == "Alveoli"
    assert resp["measurements"]["minute_ventilation_l_min"] == pytest.approx(8.0)
    assert resp["measurements"]["alveolar_ventilation_l_min"] == pytest.approx(5.6)

    nerv = run_simulation(
        "human-nervous-system",
        {"stimulus_intensity": 80, "myelination": 1, "pathway_length_cm": 100, "structure_index": 1},
    )
    assert nerv["measurements"]["action_potential_fired"] is True
    # (2 * 1.0 m / 80 m/s) * 1000 + 2 ms = 27.0 ms
    assert nerv["measurements"]["reflex_latency_ms"] == pytest.approx(27.0, abs=0.05)

    rxn = run_simulation(
        "chemical-reaction-playground",
        {"reaction_id": 1, "moles_a": 0.25, "moles_b": 0.4, "heat_on": 0},
    )
    # Zn + 2 HCl -> ZnCl2 + H2: 0.4 mol HCl limits reaction to 0.2 mol extent
    assert rxn["measurements"]["reaction_occurs"] is True
    assert rxn["measurements"]["product_moles"] == pytest.approx(0.2, abs=1e-4)


@pytest.mark.parametrize("lang", ["en", "kn", "hi", "ta", "te"])
def test_ai_tutor_alveoli_context_all_five_languages(lang: str):
    reply = answer_scientific_followup(
        experiment_id="human-respiratory-system",
        question="What happens here?",
        parameters={"breathing_rate": 16, "selected_structure": "Alveoli"},
        measurements={"organ_name": "Alveoli", "minute_ventilation_l_min": 8.0, "alveolar_ventilation_l_min": 5.6},
        language=lang,
    )
    assert reply is not None
    assert "O₂" in reply and "CO₂" in reply
    assert "8.0" in reply


def test_playground_projects_sqlite_crud_persistence(tmp_path: Path):
    db_file = str(tmp_path / "test_playground.db")
    init_db(db_path=db_file)
    conn = create_connection(db_file)
    try:
        # 1. Create & persist
        created = create_playground_project(
            PlaygroundProjectCreate(
                student_id="demo-student-1",
                name="My 12V Resistor Circuit",
                mode="circuit",
                workspace={
                    "circuit": {
                        "components": [{"id": "bat-1", "type": "battery", "voltage": 12}],
                        "wires": [],
                    }
                },
                observations=[{"summary": "I = 0.12 A at 12V, 100 ohm"}],
            ),
            db=conn,
        )
        assert created.id.startswith("proj-")
        assert created.name == "My 12V Resistor Circuit"
        assert len(created.observations) == 1

        # 2. List & Reload
        listed = list_playground_projects(student_id="demo-student-1", mode="circuit", db=conn)
        assert len(listed) == 1
        assert listed[0].id == created.id

        reloaded = get_playground_project(created.id, db=conn)
        assert reloaded.workspace["circuit"]["components"][0]["voltage"] == 12

        # 3. Rename & Update
        updated = update_playground_project(
            created.id,
            PlaygroundProjectUpdate(name="Renamed Series Circuit"),
            db=conn,
        )
        assert updated.name == "Renamed Series Circuit"

        # 4. Delete
        delete_playground_project(created.id, db=conn)
        assert list_playground_projects(student_id="demo-student-1", mode=None, db=conn) == []
    finally:
        conn.close()
