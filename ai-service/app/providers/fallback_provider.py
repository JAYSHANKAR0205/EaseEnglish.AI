from typing import Optional
from app.providers.base import ConversationProvider, SpeechToTextProvider, TextToSpeechProvider
from app.schemas.models import ConversationRequest, AIResponse, InputQuality
from app.services.linguistic_coach import (
    analyze_and_correct_english,
    generate_empathetic_coaching_response
)
from app.services.comprehension import (
    analyze_question_expectation,
    is_numeric_response,
    is_incomplete_sentence,
    is_gibberish,
    is_symbol_or_punctuation_only,
    QuestionExpectation
)

class FallbackConversationProvider(ConversationProvider):
    async def generate_conversation(self, req: ConversationRequest) -> AIResponse:
        user_text = req.message.strip()

        # Evaluate previous question expectation
        last_assistant = next((m for m in reversed(req.conversation_history or []) if m.role == "assistant"), None)
        last_q = (last_assistant.next_question or last_assistant.response or "").strip() if last_assistant else ""
        exp_type, _ = analyze_question_expectation(last_q)

        is_gib = is_gibberish(user_text) or is_symbol_or_punctuation_only(user_text)
        is_incomp = is_incomplete_sentence(user_text)
        is_unrelated_num = is_numeric_response(user_text) and exp_type != QuestionExpectation.NUMERIC

        # Step 1: Deep linguistic & grammatical analysis (only for actual language input)
        if is_gib or is_incomp or is_unrelated_num:
            has_error, correction, explanation, error_type = False, None, None, None
        else:
            has_error, correction, explanation, error_type = analyze_and_correct_english(user_text, req.level)

        # Step 2: Empathetic, connected conversational response & ONE follow-up question
        reply, next_q = generate_empathetic_coaching_response(
            user_text=user_text,
            level=req.level,
            history=req.conversation_history,
            user_name=req.user_name
        )

        quality = InputQuality.GIBBERISH if is_gib else InputQuality.VALID

        return AIResponse(
            input_quality=quality,
            transcript=user_text,
            has_correction=has_error,
            correction=correction,
            explanation=explanation,
            error_type=error_type,
            response=reply,
            next_question=next_q,
            difficulty=req.level,
            fast_path=False
        )

class FallbackSpeechToTextProvider(SpeechToTextProvider):
    async def transcribe(self, audio_base64: str, mime_type: str = "audio/webm") -> str:
        return ""

class FallbackTextToSpeechProvider(TextToSpeechProvider):
    async def synthesize(self, text: str, voice_name: Optional[str] = None) -> Optional[str]:
        return None
