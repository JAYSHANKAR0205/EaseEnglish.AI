from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field

class PracticeLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

class PracticeMode(str, Enum):
    CHAT = "chat"
    VOICE = "voice"

class InputQuality(str, Enum):
    VALID = "valid"
    GIBBERISH = "gibberish"
    EMPTY = "empty"
    INJECTION_ATTEMPT = "injection_attempt"

class HistoryMessage(BaseModel):
    role: str # "user" | "assistant"
    transcript: str
    has_correction: Optional[bool] = False
    correction: Optional[str] = None
    explanation: Optional[str] = None
    error_type: Optional[str] = None
    response: Optional[str] = None
    next_question: Optional[str] = None
    timestamp: Optional[str] = None

class ConversationRequest(BaseModel):
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    message: str = Field(..., description="User typed or transcribed input")
    level: PracticeLevel = PracticeLevel.INTERMEDIATE
    mode: PracticeMode = PracticeMode.CHAT
    language: str = "english"
    conversation_history: List[HistoryMessage] = []
    is_first_message: bool = False

class GreetingRequest(BaseModel):
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    level: PracticeLevel = PracticeLevel.INTERMEDIATE
    is_returning: bool = False
    language: str = "english"

class TranscriptionRequest(BaseModel):
    audio_base64: Optional[str] = None
    mime_type: Optional[str] = "audio/webm"
    audio_text: Optional[str] = None

class SynthesizeRequest(BaseModel):
    text: str
    level: Optional[PracticeLevel] = PracticeLevel.INTERMEDIATE
    voice_name: Optional[str] = None

class AIResponse(BaseModel):
    input_quality: InputQuality = Field(..., description="Input quality assessment")
    transcript: str = Field(..., description="Normalized user transcript")
    has_correction: bool = Field(default=False, description="Whether correction is present")
    correction: Optional[str] = Field(default=None, description="Corrected sentence if error found")
    explanation: Optional[str] = Field(default=None, description="Concise explanation of the grammar rule")
    error_type: Optional[str] = Field(default=None, description="Language error category (e.g. verb_tense, preposition, article, pronoun, adverb, word_choice, conjunction, subject_verb_agreement)")
    response: str = Field(..., description="Natural conversational reply")
    next_question: Optional[str] = Field(default=None, description="ONE contextual follow-up question")
    difficulty: PracticeLevel = PracticeLevel.INTERMEDIATE
    fast_path: bool = Field(default=False, description="Whether fast path handled the turn")
    audio_base64: Optional[str] = Field(default=None, description="Optional synthesized audio")
