import random
from datetime import datetime
from typing import Optional, Dict
from app.schemas.models import PracticeLevel

def get_time_of_day_greeting() -> str:
    current_hour = datetime.now().hour
    if 5 <= current_hour < 12:
        return "Good morning"
    elif 12 <= current_hour < 17:
        return "Good afternoon"
    else:
        return "Good evening"

OPENING_QUESTIONS_BY_LEVEL = {
    PracticeLevel.BEGINNER: [
        ("Welcome to Ease English! Could you introduce yourself briefly and tell me where you are from?", "Could you introduce yourself briefly and tell me where you are from?"),
        ("It's great to practice with you today. What is your favorite hobby or thing to do in your free time?", "What is your favorite hobby or thing to do in your free time?"),
        ("I'm happy to help you practice English today. How has your day been so far?", "How has your day been so far?"),
        ("Let's start with something simple. What is your current job or what are you studying?", "What is your current job or what are you studying?")
    ],
    PracticeLevel.INTERMEDIATE: [
        ("Could you give me a brief introduction about yourself and what you are currently working on?", "Could you give me a brief introduction about yourself and what you are currently working on?"),
        ("What inspired you to improve your English speaking skills this year?", "What inspired you to improve your English speaking skills this year?"),
        ("What kind of professional or everyday situations do you most want to feel confident in?", "What kind of professional or everyday situations do you most want to feel confident in?"),
        ("Could you share a memorable experience or a challenge you handled recently at work or school?", "Could you share a memorable experience or a challenge you handled recently at work or school?")
    ],
    PracticeLevel.ADVANCED: [
        ("Could you provide a high-level overview of your professional background and the projects currently commanding your focus?", "Could you provide a high-level overview of your professional background and the projects currently commanding your focus?"),
        ("In your industry, what emerging trends or technologies are driving the most significant strategic changes?", "In your industry, what emerging trends or technologies are driving the most significant strategic changes?"),
        ("When articulating complex arguments or negotiating, what English nuances do you find most critical to master?", "When articulating complex arguments or negotiating, what English nuances do you find most critical to master?"),
        ("Could you discuss a recent complex problem you resolved and the strategic reasoning behind your approach?", "Could you discuss a recent complex problem you resolved and the strategic reasoning behind your approach?")
    ]
}

def generate_session_greeting(
    level: PracticeLevel = PracticeLevel.INTERMEDIATE,
    is_returning: bool = False,
    user_name: Optional[str] = None
) -> Dict[str, str]:
    time_greeting = get_time_of_day_greeting()
    name_str = f", {user_name}" if user_name else ""

    if is_returning:
        greeting_prefix = random.choice([
            f"{time_greeting}{name_str}! Welcome back to Ease English.",
            f"Welcome back{name_str}! Ready for another conversation session?",
            f"{time_greeting}{name_str}! Great to see you back for more English practice."
        ])
    else:
        greeting_prefix = random.choice([
            f"{time_greeting}{name_str}! Welcome to Ease English.",
            f"Hello{name_str}! Welcome to Ease English, your AI English practice platform.",
            f"{time_greeting}! I am excited to practice speaking English with you today."
        ])

    questions = OPENING_QUESTIONS_BY_LEVEL.get(level, OPENING_QUESTIONS_BY_LEVEL[PracticeLevel.INTERMEDIATE])
    full_text, next_q = random.choice(questions)

    response_text = f"{greeting_prefix} {full_text}"

    return {
        "greeting": greeting_prefix,
        "full_message": response_text,
        "opening_question": next_q
    }
