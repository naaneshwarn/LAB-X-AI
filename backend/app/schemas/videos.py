"""Pydantic schemas for verified educational video library."""

from pydantic import BaseModel


class VideoItem(BaseModel):
    id: str
    title: str
    subject: str
    experiment_id: str | None = None
    difficulty: str = "Basic"
    language: str = "en"
    provider: str
    category: str = "Concept Introduction"
    video_url: str
    embed_url: str | None = None
    thumbnail_url: str = ""
    duration: str = ""
    description: str = ""
    transcript: str = ""
    captions_available: bool = True
    featured: bool = False
