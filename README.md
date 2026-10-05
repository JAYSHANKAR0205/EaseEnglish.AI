# Ease English — Enterprise AI English Practice Platform

**Ease English** is a production-quality AI-powered English conversation platform where learners build natural spoken and written English fluency. 

Unlike basic grammar quizzes or standard chatbots, Ease English operates as an intelligent conversation coach:
1. Listens to or reads user speech/text in context.
2. Performs real-time input quality and gibberish filtering.
3. Understands conversation history and ongoing topics.
4. Identifies meaningful English mistakes (tense, duration, prepositions) without penalizing natural or correct sentences.
5. Provides concise 1-sentence explanations.
6. Continues the dialogue naturally by asking **ONE** engaging follow-up question.

---

## Architecture Overview

```
                      +-----------------------------+
                      | React + TypeScript Frontend |
                      |    (Vite, Tailwind CSS,    |
                      |   @react-oauth/google,     |
                      |     Web Speech API)        |
                      +--------------+--------------+
                                     |
                                     | HTTP / JWT / REST
                                     v
                      +-----------------------------+
                      |     Node.js Express API     |
                      | (Auth, Sessions, Ownership, |
                      |  MongoDB Mongoose Models,   |
                      |      Proxy Orchestration)   |
                      +--------------+--------------+
                                     |
                                     | Internal HTTP JSON
                                     v
                      +-----------------------------+
                      |   Python AI Microservice    |
                      |   (FastAPI, Pydantic, Fast  |
                      |  Path & Fallback, Gibberish |
                      |   Engine, Greeting Engine)  |
                      +--------------+--------------+
                                     |
                         +-----------+-----------+
                         |                       |
                         v                       v
               +-------------------+   +-------------------+
               |  Gemini Provider  |   | Fallback Heuristic|
               | (gemini-2.5-flash)|   |  Provider (Resil) |
               +-------------------+   +-------------------+
```

---

## Directory Structure

```
Ease_English/
├── frontend/                 # React 18 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/       # Common, Landing, and Practice UI components
│   │   ├── contexts/         # AuthContext & PracticeContext
│   │   ├── hooks/            # useSpeechRecognition & useSpeechSynthesis
│   │   ├── services/         # API clients (auth, conversation, AI)
│   │   ├── types/            # Strict TypeScript interfaces
│   │   ├── App.tsx           # View router (Landing vs Practice)
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                  # Node.js + Express API server
│   ├── src/
│   │   ├── config/           # Database & centralized environment config
│   │   ├── controllers/      # Auth, Conversation, and AI proxy controllers
│   │   ├── middleware/       # JWT auth & error handling middleware
│   │   ├── models/           # Mongoose User and Conversation schemas
│   │   ├── routes/           # Express routes (/auth, /conversations, /ai)
│   │   └── server.js         # Express server entry point
│   ├── tests/                # Unit tests & full live E2E integration runner
│   └── package.json
│
├── ai-service/               # Python FastAPI AI microservice
│   ├── app/
│   │   ├── api/routes.py     # FastAPI endpoints (/conversation, /greeting, etc.)
│   │   ├── config.py         # AI service environment configuration
│   │   ├── prompts/          # Enterprise prompt templates with injection defenses
│   │   ├── providers/        # Swappable STT, LLM, and TTS provider interfaces
│   │   ├── schemas/          # Pydantic validation schemas
│   │   ├── services/         # Gibberish, Greeting, Fast Path, Conversation
│   │   └── main.py
│   ├── tests/                # Pytest unit tests
│   └── requirements.txt
│
└── package.json              # Root orchestration scripts
```

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (verified on v24.18.0)
- **Python**: 3.10+ (verified on Python 3.14.6)
- **MongoDB**: MongoDB Atlas or local MongoDB instance (port 27017)

---

### 2. Environment Configuration

Copy the provided `.env.example` templates in each service directory to create your local `.env` files.
**Note:** Real `.env` files are excluded from version control and will never be published to GitHub.

#### Backend (`backend/.env`):
```bash
cp backend/.env.example backend/.env
```
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ease_english
JWT_SECRET=your_super_strong_jwt_secret_min_32_characters
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
PYTHON_AI_SERVICE_URL=http://localhost:8000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

#### AI Service (`ai-service/.env`):
```bash
cp ai-service/.env.example ai-service/.env
```
```env
PORT=8000
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_LLM_MODEL=gemini-2.5-flash
GEMINI_STT_MODEL=gemini-2.5-flash
GEMINI_TTS_MODEL=gemini-2.5-flash
NODE_BACKEND_URL=http://localhost:5000
ENVIRONMENT=development
```

#### Frontend (`frontend/.env`):
```bash
cp frontend/.env.example frontend/.env
```
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
VITE_API_URL=http://localhost:5000/api
```

---

### 3. How to Run Locally

You can run the three services in separate terminals:

#### Terminal 1: Python AI Service
```bash
cd ai-service
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### Terminal 2: Node.js Backend API
```bash
cd backend
npm start
```

#### Terminal 3: React Frontend (Vite)
```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## Testing & Verification

Run all test suites across the stack with:

```bash
# 1. Run Python AI Unit Tests (7/7 passed)
npm run test:ai

# 2. Run Backend Unit Tests (4/4 passed)
npm run test:backend

# 3. Verify Frontend TypeScript & Production Build (Built in 5.4s)
npm run build:frontend

# 4. Run Full Live End-to-End Integration Suite (13/13 passed)
npm run test:integration

# Or run all 4 in sequence:
npm run test:all
```

---

## Core Features Implemented

1. **Returning User Experience**:
   - Checking authentication occurs smoothly without flashing login screens.
   - Returning authenticated users clicking **Start Speaking Now** jump directly into their practice workspace.
2. **Google OAuth & Dev Test Login**:
   - Authenticates with Google ID tokens via `@react-oauth/google` and server-side verification.
   - Includes instant developer test login for local development.
3. **Gibberish & Input Quality Pipeline**:
   - Evaluates input prior to LLM processing.
   - Friendly retry messages without inventing fake grammatical errors.
4. **Context-Aware Greeting Engine**:
   - Dynamically determines time of day, returning status, and level.
   - Pairs greeting with exactly ONE engaging opening question.
5. **English Mistake Identification**:
   - Identifies genuine mistakes (e.g. "I am working from two years" -> "I have been working for two years").
   - Does NOT invent mistakes for already correct English sentences.
6. **Chat Mode & Voice Mode**:
   - **Chat Mode**: User can speak or type; AI answers in text only.
   - **Voice Mode**: User speaks; AI answers in text AND automatically synthesizes voice audio via TTS.
7. **New Chat & History in MongoDB**:
   - New Chat saves current conversation and initializes a fresh session without deleting past history.
   - History drawer restores past conversations and context.
   - Strict ownership protection prevents cross-user access (403 Forbidden).
