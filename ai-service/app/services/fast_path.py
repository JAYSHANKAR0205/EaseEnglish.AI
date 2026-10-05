import re
from typing import Optional
from app.schemas.models import AIResponse, InputQuality, PracticeLevel
from app.services.gibberish import analyze_input_quality

def evaluate_fast_path(
    user_input: str,
    level: PracticeLevel = PracticeLevel.INTERMEDIATE,
    user_name: Optional[str] = None,
    has_prior_history: bool = False
) -> Optional[AIResponse]:
    """
    Evaluates whether the input can be handled safely and deterministically via Fast Path.
    Only handles strictly empty/whitespace input and prompt injection defense.
    All conversational turns (greetings, questions, statements, gibberish) proceed to the LLM.
    """
    if not user_input or not user_input.strip():
        return AIResponse(
            input_quality=InputQuality.EMPTY,
            transcript="",
            has_correction=False,
            correction=None,
            explanation=None,
            response="Please enter or say something in English so we can practice together.",
            next_question="Whenever you are ready, what would you like to speak about?",
            difficulty=level,
            fast_path=True
        )

    input_quality, reason_message = analyze_input_quality(user_input)

    # Fast Path: Prompt injection safety defense only
    if input_quality == InputQuality.INJECTION_ATTEMPT:
        return AIResponse(
            input_quality=InputQuality.VALID,
            transcript=user_input.strip(),
            has_correction=False,
            correction=None,
            explanation=None,
            response="Let's focus on practicing your English! I am here to help you speak with natural confidence.",
            next_question="Could you tell me a little about what you're working on or your favorite hobby?",
            difficulty=level,
            fast_path=True
        )

    # All conversational inputs (greetings, conversation, questions, gibberish) are sent to the LLM
    return None
