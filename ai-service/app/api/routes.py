from fastapi import APIRouter, HTTPException
from app.schemas.models import (
    ConversationRequest,
    AIResponse,
    GreetingRequest,
    TranscriptionRequest,
    SynthesizeRequest
)
from app.services.conversation import process_conversation_turn
from app.services.greeting import generate_session_greeting
from app.providers.factory import ProviderFactory

router = APIRouter(prefix="/ai", tags=["AI"])

@router.post("/conversation", response_model=AIResponse)
async def handle_conversation(req: ConversationRequest):
    try:
        return await process_conversation_turn(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI processing error: {str(e)}")

@router.post("/greeting")
async def handle_greeting(req: GreetingRequest):
    try:
        greeting_data = generate_session_greeting(
            level=req.level,
            is_returning=req.is_returning,
            user_name=req.user_name
        )
        return greeting_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Greeting error: {str(e)}")

@router.post("/transcribe")
async def handle_transcribe(req: TranscriptionRequest):
    try:
        stt_provider = ProviderFactory.get_stt_provider()
        transcript = await stt_provider.transcribe(
            audio_base64=req.audio_base64 or "",
            mime_type=req.mime_type or "audio/webm"
        )
        return {"transcript": transcript}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription error: {str(e)}")

@router.post("/synthesize")
async def handle_synthesize(req: SynthesizeRequest):
    try:
        tts_provider = ProviderFactory.get_tts_provider()
        audio_data = await tts_provider.synthesize(
            text=req.text,
            voice_name=req.voice_name
        )
        return {"audio_base64": audio_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Synthesis error: {str(e)}")
