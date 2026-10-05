from app.config import settings
from app.providers.base import ConversationProvider, SpeechToTextProvider, TextToSpeechProvider
from app.providers.gemini_provider import (
    GeminiConversationProvider,
    GeminiSpeechToTextProvider,
    GeminiTextToSpeechProvider
)
from app.providers.fallback_provider import (
    FallbackConversationProvider,
    FallbackSpeechToTextProvider,
    FallbackTextToSpeechProvider
)

class ProviderFactory:
    @staticmethod
    def get_conversation_provider() -> ConversationProvider:
        provider_name = settings.AI_PROVIDER.lower()
        if provider_name == "gemini":
            return GeminiConversationProvider(
                api_key=settings.GEMINI_API_KEY,
                model_name=settings.GEMINI_LLM_MODEL
            )
        # Future providers (OpenAI, Claude, etc.) plug in here cleanly
        return FallbackConversationProvider()

    @staticmethod
    def get_stt_provider() -> SpeechToTextProvider:
        provider_name = settings.AI_PROVIDER.lower()
        if provider_name == "gemini":
            return GeminiSpeechToTextProvider(
                api_key=settings.GEMINI_API_KEY,
                model_name=settings.GEMINI_STT_MODEL
            )
        return FallbackSpeechToTextProvider()

    @staticmethod
    def get_tts_provider() -> TextToSpeechProvider:
        provider_name = settings.AI_PROVIDER.lower()
        if provider_name == "gemini":
            return GeminiTextToSpeechProvider(
                api_key=settings.GEMINI_API_KEY,
                model_name=settings.GEMINI_TTS_MODEL
            )
        return FallbackTextToSpeechProvider()
