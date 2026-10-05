import logging
import re
from app.schemas.models import ConversationRequest, AIResponse, InputQuality
from app.services.fast_path import evaluate_fast_path
from app.services.gibberish import analyze_input_quality
from app.providers.factory import ProviderFactory

logger = logging.getLogger(__name__)

async def process_conversation_turn(req: ConversationRequest) -> AIResponse:
    """
    Executes the full conversational processing pipeline:
    Input -> Normalize -> Quality Check -> Fast Path -> Provider LLM -> Validation
    """
    user_input = req.message.strip()

    # Step 1: Preprocessing & Fast Path Decision
    has_prior_history = bool(req.conversation_history and any(m.role == "user" for m in req.conversation_history))
    fast_path_result = evaluate_fast_path(
        user_input=user_input,
        level=req.level,
        user_name=req.user_name,
        has_prior_history=has_prior_history
    )

    if fast_path_result is not None:
        logger.info(f"Handled via Fast Path (quality={fast_path_result.input_quality})")
        return fast_path_result

    # Step 2: Fallback AI Path (Full AI reasoning)
    provider = ProviderFactory.get_conversation_provider()
    logger.info(f"Invoking Conversation Provider: {provider.__class__.__name__}")
    response = await provider.generate_conversation(req)

    # Architectural Guardrail: Capitalization and punctuation alone are NEVER English errors
    if response.has_correction and response.correction:
        c1 = re.sub(r'[^a-zA-Z0-9]', '', response.correction or '').lower()
        c2 = re.sub(r'[^a-zA-Z0-9]', '', req.message or '').lower()
        if c1 == c2:
            response.has_correction = False
            response.correction = None
            response.explanation = None
            response.error_type = None

    return response
