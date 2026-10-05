import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.config import settings
from app.api.routes import router as ai_router

app = FastAPI(
    title="Ease English AI Service",
    description="Enterprise AI conversation, grammar analysis, fast path, and provider orchestration engine.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_router)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Ease English AI Service",
        "provider": settings.AI_PROVIDER,
        "models": {
            "llm": settings.GEMINI_LLM_MODEL,
            "stt": settings.GEMINI_STT_MODEL,
            "tts": settings.GEMINI_TTS_MODEL
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
