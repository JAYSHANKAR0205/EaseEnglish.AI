import re
import random
from typing import Tuple
from app.schemas.models import InputQuality

# Genuine keyboard mash patterns (e.g. "asdfghjkl", "qwertyuiop", repeated chars "aaaaa", or 6+ consonants without vowels)
KEYBOARD_MASH_PATTERNS = [
    r"\b(?:qwerty|asdfgh|zxcvbn|poiuyt|lkjhgf|mnbvcx|asdfghjkl|qwertyuiop)[a-z]*\b",
    r"(.)\1{4,}",  # 5+ identical consecutive characters
    r"\b[bcdfghjklmnpqrstvwxyz]{6,}\b",  # 6+ consecutive consonants without vowel
]

GIBBERISH_FRIENDLY_RESPONSES = [
    "I didn't quite catch that. Could you try saying that again in English?",
    "I couldn't understand that clearly. Try saying it again in a complete sentence.",
    "That seemed a bit unclear. Could you repeat what you meant to say?",
    "I'm listening! Please say that again so we can continue practicing.",
    "I couldn't quite hear you clearly. Let's try that one more time."
]

EMPTY_RESPONSES = [
    "No speech detected. Try speaking again or type your message.",
    "It seems quiet! Whenever you're ready, press the microphone and speak.",
    "I didn't hear anything that time. Please try speaking again."
]

INJECTION_PATTERNS = [
    r"ignore (all )?(previous|prior) (instructions|prompts)",
    r"reveal (your )?(system|internal) (prompt|instructions)",
    r"you are now a",
    r"repeat the text above",
    r"bypass safety"
]

def analyze_input_quality(text: str) -> Tuple[InputQuality, str]:
    """
    Evaluates input quality before passing to LLM or fast path.
    Returns (InputQuality, friendly_message_if_unusable)
    """
    # Check for empty
    if not text or not text.strip():
        return InputQuality.EMPTY, random.choice(EMPTY_RESPONSES)

    cleaned = text.strip()

    # Check for punctuation/symbols only (e.g. "....", "???")
    if not re.search(r"[a-zA-Z0-9]", cleaned):
        return InputQuality.GIBBERISH, "I'm listening! Whenever you're ready, feel free to type or speak your thoughts in English."

    # Check for prompt injection attempts
    lower_text = cleaned.lower()
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, lower_text):
            return InputQuality.INJECTION_ATTEMPT, "Let's focus on practicing your English! What would you like to talk about today?"

    words = cleaned.split()

    # If the user has typed a coherent multi-word message (4+ words) with normal vowels,
    # it is NEVER keyboard mash or gibberish.
    if len(words) >= 4:
        vowel_word_count = sum(1 for w in words if re.search(r"[aeiouyAEIOUY]", w))
        if vowel_word_count / len(words) >= 0.5:
            return InputQuality.VALID, ""

    # Check for keyboard mash patterns in single or short token inputs
    for pattern in KEYBOARD_MASH_PATTERNS:
        if re.search(pattern, lower_text):
            return InputQuality.GIBBERISH, random.choice(GIBBERISH_FRIENDLY_RESPONSES)

    # Check character variety / entropy if single long token
    words = cleaned.split()
    if len(words) == 1 and len(words[0]) > 8:
        # Check vowel count
        vowels = len(re.findall(r"[aeiouyAEIOUY]", words[0]))
        if vowels == 0 or (len(words[0]) > 10 and vowels / len(words[0]) < 0.15):
            return InputQuality.GIBBERISH, random.choice(GIBBERISH_FRIENDLY_RESPONSES)

    # Check repeated short gibberish tokens (e.g., "zxczxc", "asdf asdf asdf")
    if len(words) <= 3 and all(len(w) > 3 and not re.search(r"[aeiouyAEIOUY]", w) for w in words):
        return InputQuality.GIBBERISH, random.choice(GIBBERISH_FRIENDLY_RESPONSES)

    return InputQuality.VALID, ""
