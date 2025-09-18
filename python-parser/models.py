"""
Data models for parsed verses
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ParsedVerse(BaseModel):
    """Model for a parsed verse"""
    title: str
    chapter: int
    verse_number: int
    sanskrit: str
    transliteration: Optional[str] = None
    word_by_word_translation: Optional[str] = None
    translation: str
    commentary: Optional[str] = None
    source: str = "Vedabase"
    language: str = "ru"
    url: Optional[str] = None
    metadata: Optional[dict] = None


class ParseResult(BaseModel):
    """Model for parse operation result"""
    text_type: str
    total_verses: int = 0
    successful_verses: int = 0
    failed_verses: int = 0
    errors: List[str] = []
    duration: float = 0.0
    verses: List[ParsedVerse] = []
    success: bool = False


class ChapterInfo(BaseModel):
    """Model for chapter information"""
    text_type: str
    chapter_number: int
    total_verses: int
    url: str
    status: str = "pending"  # pending, parsing, completed, failed
    verses: List[ParsedVerse] = []
    errors: List[str] = []
