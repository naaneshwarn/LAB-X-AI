"""Business logic for retrieving verified educational videos and recommendations."""

from __future__ import annotations

import sqlite3

from app.schemas.videos import VideoItem


def _to_video(row: sqlite3.Row) -> VideoItem:
    return VideoItem(
        id=row["id"],
        title=row["title"],
        subject=row["subject"],
        experiment_id=row["experiment_id"],
        difficulty=row["difficulty"],
        language=row["language"],
        provider=row["provider"],
        category=row["category"],
        video_url=row["video_url"],
        embed_url=row["embed_url"],
        thumbnail_url=row["thumbnail_url"] or "",
        duration=row["duration"] or "",
        description=row["description"] or "",
        transcript=row["transcript"] or "",
        captions_available=bool(row["captions_available"]),
        featured=bool(row["featured"]),
    )


def list_videos(
    db: sqlite3.Connection,
    *,
    subject: str | None = None,
    experiment_id: str | None = None,
    difficulty: str | None = None,
    language: str | None = None,
    search: str | None = None,
    featured: bool | None = None,
) -> list[VideoItem]:
    """List verified educational videos with flexible filtering."""
    rows = db.execute("SELECT * FROM videos ORDER BY featured DESC, subject ASC, title ASC").fetchall()
    results: list[VideoItem] = []
    for row in rows:
        if subject and subject.lower() != "all" and row["subject"].lower() != subject.strip().lower():
            continue
        if experiment_id and experiment_id.lower() != "all" and row["experiment_id"] != experiment_id:
            continue
        if difficulty and difficulty.lower() != "all":
            q_diff = "basic" if difficulty.strip().lower() == "beginner" else difficulty.strip().lower()
            if row["difficulty"].lower() != q_diff:
                continue
        if language and language.lower() != "all" and row["language"].lower() != language.strip().lower():
            continue
        if featured is not None and bool(row["featured"]) != featured:
            continue
        if search:
            q = search.strip().lower()
            haystack = " ".join(
                [
                    row["title"],
                    row["subject"],
                    row["experiment_id"] or "",
                    row["provider"],
                    row["category"],
                    row["description"],
                ]
            ).lower()
            if q not in haystack:
                continue
        results.append(_to_video(row))
    return results


def recommend_videos(
    db: sqlite3.Connection,
    *,
    experiment_id: str | None = None,
    subject: str | None = None,
    limit: int = 6,
) -> list[VideoItem]:
    """Recommend verified videos prioritizing direct experiment match, then same subject."""
    all_rows = db.execute("SELECT * FROM videos ORDER BY featured DESC, title ASC").fetchall()
    direct: list[VideoItem] = []
    same_subject: list[VideoItem] = []

    resolved_subject = subject
    if experiment_id and not resolved_subject:
        exp_row = db.execute("SELECT discipline FROM experiments WHERE id = ?", (experiment_id,)).fetchone()
        if exp_row:
            resolved_subject = exp_row["discipline"]

    for row in all_rows:
        item = _to_video(row)
        if experiment_id and item.experiment_id == experiment_id:
            direct.append(item)
        elif resolved_subject and item.subject.lower() == resolved_subject.lower():
            same_subject.append(item)

    combined = direct + same_subject
    if not combined:
        combined = [_to_video(r) for r in all_rows[:limit]]
    return combined[:limit]
