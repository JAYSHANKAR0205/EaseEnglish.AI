import json
import logging
import base64
import re
from typing import Optional
from app.config import settings
from app.providers.base import ConversationProvider, SpeechToTextProvider, TextToSpeechProvider
from app.providers.fallback_provider import (
    FallbackConversationProvider,
    FallbackSpeechToTextProvider,
    FallbackTextToSpeechProvider
)
from app.schemas.models import ConversationRequest, AIResponse, InputQuality
from app.prompts.conversation import build_conversation_prompt

logger = logging.getLogger(__name__)

class GeminiConversationProvider(ConversationProvider):
    def __init__(self, api_key: str, model_name: str = "gemini-2.0-flash"):
        self.api_key = api_key
        self.model_name = model_name
        self.client = None
        self.fallback = FallbackConversationProvider()
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Could not initialize google-genai client: {e}")

    async def generate_conversation(self, req: ConversationRequest) -> AIResponse:
        if not self.client or not self.api_key:
            return await self.fallback.generate_conversation(req)

        prompt = build_conversation_prompt(
            user_message=req.message,
            level=req.level,
            language=req.language,
            history=req.conversation_history,
            user_name=req.user_name
        )

        try:
            try:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config={"response_mime_type": "application/json"}
                )
            except Exception as model_err:
                logger.warning(f"Error calling {self.model_name}: {model_err}. Retrying with gemini-1.5-flash...")
                response = self.client.models.generate_content(
                    model="gemini-1.5-flash",
                    contents=prompt,
                    config={"response_mime_type": "application/json"}
                )

            text_resp = response.text.strip()
            # Parse JSON
            parsed = json.loads(text_resp)

            # Sanitize and validate
            input_quality_str = parsed.get("input_quality", "valid")
            if input_quality_str not in [q.value for q in InputQuality]:
                input_quality_str = "valid"

            has_corr = bool(parsed.get("has_correction", False))
            corr = parsed.get("correction") if has_corr else None
            expl = parsed.get("explanation") if has_corr else None
            err_type = parsed.get("error_type") if has_corr else None

            # GUARDRAIL: Capitalization and punctuation alone are NEVER English errors
            if has_corr and corr:
                def simplify(s: str) -> str:
                    return re.sub(r'[^a-zA-Z0-9]', '', s or '').lower()
                if simplify(corr) == simplify(req.message):
                    has_corr = False
                    corr = None
                    expl = None
                    err_type = None

            return AIResponse(
                input_quality=InputQuality(input_quality_str),
                transcript=parsed.get("transcript", req.message),
                has_correction=has_corr,
                correction=corr,
                explanation=expl,
                error_type=err_type,
                response=parsed.get("response", "Thank you for sharing."),
                next_question=parsed.get("next_question"),
                difficulty=req.level,
                fast_path=False
            )
        except Exception as e:
            logger.error(f"Gemini API error, smoothly invoking fallback: {e}")
            return await self.fallback.generate_conversation(req)

class GeminiSpeechToTextProvider(SpeechToTextProvider):
    def __init__(self, api_key: str, model_name: str = "gemini-2.0-flash"):
        self.api_key = api_key
        self.model_name = model_name
        self.client = None
        self.fallback = FallbackSpeechToTextProvider()
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Could not initialize google-genai for STT: {e}")

    async def transcribe(self, audio_base64: str, mime_type: str = "audio/webm") -> str:
        if not self.client or not self.api_key or not audio_base64:
            return await self.fallback.transcribe(audio_base64, mime_type)

        try:
            audio_bytes = base64.b64decode(audio_base64)
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[
                    {
                        "parts": [
                            {"inline_data": {"mime_type": mime_type, "data": audio_bytes}},
                            {"text": "Accurately transcribe this audio in English. Output only the transcribed text."}
                        ]
                    }
                ]
            )
            return response.text.strip()
        except Exception as e:
            logger.error(f"Gemini STT error: {e}")
            return await self.fallback.transcribe(audio_base64, mime_type)

class GeminiTextToSpeechProvider(TextToSpeechProvider):
    def __init__(self, api_key: str, model_name: str = "gemini-2.0-flash"):
        self.api_key = api_key
        self.model_name = model_name
        self.fallback = FallbackTextToSpeechProvider()

    async def synthesize(self, text: str, voice_name: Optional[str] = None) -> Optional[str]:
        # Return None so client browser Web Speech Synthesis / edge synthesis handles voice seamlessly
        return await self.fallback.synthesize(text, voice_name)
