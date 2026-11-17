"""SQLite database connection management using Python's built-in sqlite3 module."""

from __future__ import annotations

import sqlite3
from collections.abc import Generator
from pathlib import Path

from app.core.config import get_settings


def resolve_sqlite_path(database_url: str) -> str:
    """Convert a sqlite:/// URL or file path into a local filesystem path."""
    if database_url == ":memory:" or database_url.endswith(":memory:"):
        return ":memory:"
    if database_url.startswith("sqlite:///"):
        raw = database_url[len("sqlite:///") :]
        # Handle Windows drive paths like /C:/... if present
        if len(raw) >= 3 and raw[0] == "/" and raw[2] == ":":
            raw = raw[1:]
        path = Path(raw)
        path.parent.mkdir(parents=True, exist_ok=True)
        return str(path)
    path = Path(database_url)
    path.parent.mkdir(parents=True, exist_ok=True)
    return str(path)


def create_connection(db_path: str | None = None) -> sqlite3.Connection:
    """Create a configured SQLite connection with Row factory and foreign keys enabled."""
    target = db_path or resolve_sqlite_path(get_settings().database_url)
    conn = sqlite3.connect(target, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def get_db() -> Generator[sqlite3.Connection, None, None]:
    """FastAPI dependency yielding a scoped SQLite connection."""
    conn = create_connection()
    try:
        yield conn
    finally:
        conn.close()


def check_db_connection(db_path: str | None = None) -> bool:
    """Verify SQLite database connectivity without modifying data."""
    try:
        conn = create_connection(db_path)
        try:
            conn.execute("SELECT 1").fetchone()
            return True
        finally:
            conn.close()
    except Exception:
        return False
