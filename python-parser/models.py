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
    canto: Optional[int] = None  # For Srimad Bhagavatam (1-12 cantos)
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


class Verse(BaseModel):
    """Model for database verse (used in backup operations)"""
    id: str
    sessionId: Optional[str] = None
    chapter: int
    verseNumber: int
    sanskrit: str
    translation: str
    commentary: Optional[str] = None
    assignedTo: Optional[str] = None
    isRead: bool = False
    readAt: Optional[datetime] = None
    order: Optional[int] = None
    createdAt: datetime
    createdBy: Optional[str] = None
    language: str = "ru"
    source: str = "AI Generated"
    title: str
    transliteration: Optional[str] = None
    updatedAt: datetime
    wordByWordTranslation: Optional[str] = None
    isMergedVerse: bool = False
    mergedWith: Optional[str] = None
    mergedBlockId: Optional[str] = None
    canto: Optional[int] = None
    metadata: Optional[str] = None
