"""CRUD endpoints for persisting Physics Playground projects in SQLite."""

from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.database.session import get_db
from app.schemas.playground import (
    PlaygroundProjectCreate,
    PlaygroundProjectResponse,
    PlaygroundProjectUpdate,
)

router = APIRouter()


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _row_to_response(row: sqlite3.Row) -> PlaygroundProjectResponse:
    return PlaygroundProjectResponse(
        id=row["id"],
        student_id=row["student_id"],
        name=row["name"],
        mode=row["mode"],
        workspace=json.loads(row["workspace_json"] or "{}"),
        observations=json.loads(row["observations_json"] or "[]"),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


@router.get("/playground/projects", response_model=list[PlaygroundProjectResponse])
def list_playground_projects(
    student_id: str = Query(default="demo-student-1"),
    mode: str | None = Query(default=None),
    db: sqlite3.Connection = Depends(get_db),
) -> list[PlaygroundProjectResponse]:
    if mode:
        rows = db.execute(
            """
            SELECT * FROM playground_projects
            WHERE student_id = ? AND mode = ?
            ORDER BY updated_at DESC
            """,
            (student_id, mode),
        ).fetchall()
    else:
        rows = db.execute(
            """
            SELECT * FROM playground_projects
            WHERE student_id = ?
            ORDER BY updated_at DESC
            """,
            (student_id,),
        ).fetchall()
    return [_row_to_response(r) for r in rows]


@router.post(
    "/playground/projects",
    response_model=PlaygroundProjectResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_playground_project(
    payload: PlaygroundProjectCreate,
    db: sqlite3.Connection = Depends(get_db),
) -> PlaygroundProjectResponse:
    student = db.execute(
        "SELECT id FROM students WHERE id = ?", (payload.student_id,)
    ).fetchone()
    if student is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student '{payload.student_id}' not found.",
        )

    project_id = f"proj-{uuid.uuid4().hex[:10]}"
    now = _utc_now()
    db.execute(
        """
        INSERT INTO playground_projects (
            id, student_id, name, mode, workspace_json, observations_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            project_id,
            payload.student_id,
            payload.name.strip(),
            payload.mode,
            json.dumps(payload.workspace, ensure_ascii=False),
            json.dumps(payload.observations, ensure_ascii=False),
            now,
            now,
        ),
    )
    db.execute(
        """
        INSERT INTO learning_activities (
            student_id, activity_type, experiment_id, title, summary, metadata_json, created_at
        ) VALUES (?, 'playground_save', 'physics-playground', ?, ?, ?, ?)
        """,
        (
            payload.student_id,
            f"Saved Playground: {payload.name.strip()}",
            f"Saved {payload.mode} experiment workspace with {len(payload.observations)} observation(s).",
            json.dumps({"project_id": project_id, "mode": payload.mode}),
            now,
        ),
    )
    db.commit()
    row = db.execute("SELECT * FROM playground_projects WHERE id = ?", (project_id,)).fetchone()
    return _row_to_response(row)


@router.get("/playground/projects/{project_id}", response_model=PlaygroundProjectResponse)
def get_playground_project(
    project_id: str,
    db: sqlite3.Connection = Depends(get_db),
) -> PlaygroundProjectResponse:
    row = db.execute("SELECT * FROM playground_projects WHERE id = ?", (project_id,)).fetchone()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Playground project '{project_id}' not found.",
        )
    return _row_to_response(row)


@router.patch("/playground/projects/{project_id}", response_model=PlaygroundProjectResponse)
def update_playground_project(
    project_id: str,
    payload: PlaygroundProjectUpdate,
    db: sqlite3.Connection = Depends(get_db),
) -> PlaygroundProjectResponse:
    row = db.execute("SELECT * FROM playground_projects WHERE id = ?", (project_id,)).fetchone()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Playground project '{project_id}' not found.",
        )

    name = payload.name.strip() if payload.name is not None else row["name"]
    mode = payload.mode if payload.mode is not None else row["mode"]
    workspace_json = (
        json.dumps(payload.workspace, ensure_ascii=False)
        if payload.workspace is not None
        else row["workspace_json"]
    )
    observations_json = (
        json.dumps(payload.observations, ensure_ascii=False)
        if payload.observations is not None
        else row["observations_json"]
    )
    now = _utc_now()
    db.execute(
        """
        UPDATE playground_projects
        SET name = ?, mode = ?, workspace_json = ?, observations_json = ?, updated_at = ?
        WHERE id = ?
        """,
        (name, mode, workspace_json, observations_json, now, project_id),
    )
    db.commit()
    updated = db.execute("SELECT * FROM playground_projects WHERE id = ?", (project_id,)).fetchone()
    return _row_to_response(updated)


@router.delete("/playground/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_playground_project(
    project_id: str,
    db: sqlite3.Connection = Depends(get_db),
) -> None:
    cur = db.execute("DELETE FROM playground_projects WHERE id = ?", (project_id,))
    db.commit()
    if cur.rowcount == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Playground project '{project_id}' not found.",
        )
