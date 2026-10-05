from abc import ABC, abstractmethod
from typing import Optional
from app.schemas.models import ConversationRequest, AIResponse

class SpeechToTextProvider(ABC):
    @abstractmethod
    async def transcribe(self, audio_base64: str, mime_type: str = "audio/webm") -> str:
        """Transcribes incoming audio to text"""
        pass

class ConversationProvider(ABC):
    @abstractmethod
    async def generate_conversation(self, req: ConversationRequest) -> AIResponse:
        """Processes conversational input, identifies errors, and asks follow-up question"""
        pass

class TextToSpeechProvider(ABC):
    @abstractmethod
    async def synthesize(self, text: str, voice_name: Optional[str] = None) -> Optional[str]:
        """Synthesizes text into audio base64 string"""
        pass
