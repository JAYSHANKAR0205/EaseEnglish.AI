import re
import random
from enum import Enum
from typing import Optional, List, Tuple, Dict, Any
from app.schemas.models import HistoryMessage, InputQuality, PracticeLevel

class MessageIntent(str, Enum):
    MEANINGFUL_STATEMENT = "meaningful_statement"
    CONTEXTUAL_ANSWER = "contextual_answer"
    TOPIC_CHANGE = "topic_change"
    LEARNER_ENGLISH_ERROR = "learner_english_error"
    INCOMPLETE_SENTENCE = "incomplete_sentence"
    UNCLEAR_OUT_OF_CONTEXT = "unclear_out_of_context"
    GIBBERISH = "gibberish"
    EMPTY = "empty"

class QuestionExpectation(str, Enum):
    NUMERIC = "numeric"
    CONFIRMATION = "confirmation"
    PROFESSION = "profession"
    TECHNOLOGY = "technology"
    LOCATION = "location"
    HOBBY = "hobby"
    GOAL = "goal"
    OPEN = "open"

# Common keyboard row runs and mash signatures
KEYBOARD_MASH_PATTERNS = [
    r"\b(?:qwerty|asdfgh|zxcvbn|poiuyt|lkjhgf|mnbvcx|asdfghjkl|qwertyuiop)[a-z]*\b",
    r"(.)\1{4,}",
    r"\b[bcdfghjklmnpqrstvwxyz]{6,}\b",
]

def analyze_question_expectation(question_text: str) -> Tuple[QuestionExpectation, str]:
    """
    Analyzes the previous question to determine what type of response was expected
    and extracts a clean topic label for contextual clarification.
    """
    if not question_text:
        return QuestionExpectation.OPEN, "our conversation"

    q_lower = question_text.lower()

    # Numeric / Quantity expectation:
    # e.g. "What is your age?", "How old are you?", "How many years have you been working?",
    # "How long have you lived there?", "When did you start?"
    if re.search(r"\b(age|how old|how many|how long|how much|what year|when did|when were|years of experience|number of)\b", q_lower):
        if "age" in q_lower or "old" in q_lower:
            return QuestionExpectation.NUMERIC, "your age"
        if "years" in q_lower or "how long" in q_lower:
            return QuestionExpectation.NUMERIC, "how long you have been working or practicing"
        return QuestionExpectation.NUMERIC, "the quantity or time we were discussing"

    # Confirmation / Choice expectation (Yes / No / Either):
    # e.g. "Do you like programming?", "Have you ever traveled?", "Are you working today?", "Is it difficult?"
    if re.search(r"^(do|does|did|are|is|have|has|had|can|could|would|will|should)\s+you\b", q_lower) or " or " in q_lower:
        topic_match = re.search(r"(?:do you|are you|would you)\s+(?:like|enjoy|prefer|think|have)\s+([^?]+)", q_lower)
        topic = topic_match.group(1).strip() if topic_match else "that question"
        return QuestionExpectation.CONFIRMATION, topic

    # Profession / Work expectation:
    if any(k in q_lower for k in ["kind of work", "where do you work", "what do you do", "your career", "your role", "industry"]):
        return QuestionExpectation.PROFESSION, "what kind of work you do"

    # Technology / Tools expectation:
    if any(k in q_lower for k in ["programming language", "technolog", "what tool", "what stack", "what framework", "what language"]):
        return QuestionExpectation.TECHNOLOGY, "the technologies or tools you use"

    # Location expectation:
    if any(k in q_lower for k in ["which city", "which town", "where are you from", "where do you live", "where have you lived"]):
        return QuestionExpectation.LOCATION, "where you are from or where you live"

    # Hobbies / Free time expectation:
    if any(k in q_lower for k in ["free time", "weekend", "weekends", "hobby", "hobbies", "spare time", "for fun"]):
        return QuestionExpectation.HOBBY, "what you enjoy doing on weekends or in your free time"

    # Goal / Reason expectation:
    if any(k in q_lower for k in ["why", "what is your goal", "what inspired you", "what made you", "reason"]):
        return QuestionExpectation.GOAL, "your goal or reason"

    return QuestionExpectation.OPEN, "what we were discussing"

def is_numeric_response(text: str) -> bool:
    """
    Checks if the user's message is primarily a number, duration, or quantity.
    """
    s = text.strip().lower()
    if s.isdigit():
        return True
    if re.match(r"^\d+\s*(?:years?|months?|days?|hours?|weeks?|mins?|minutes?)?(?:\s*old)?$", s):
        return True
    written_nums = r"^(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)(?:\s+(?:one|two|three|four|five|six|seven|eight|nine))?\s*(?:years?|months?|days?)?(?:\s*old)?$"
    if re.match(written_nums, s):
        return True
    return False

def is_confirmation_response(text: str) -> Tuple[bool, Optional[bool]]:
    """
    Checks if the user's message is an affirmative or negative answer.
    Returns (is_confirmation, is_affirmative)
    """
    s = re.sub(r"[^\w\s]", "", text.strip().lower())
    affirmatives = {"yes", "yeah", "yep", "sure", "definitely", "of course", "absolutely", "i do", "i am", "certainly"}
    negatives = {"no", "nope", "nah", "not really", "never", "i dont", "i do not", "not at all"}
    if s in affirmatives:
        return True, True
    if s in negatives:
        return True, False
    return False, None

def is_incomplete_sentence(text: str) -> bool:
    """
    Detects if the user started a sentence that cuts off abruptly
    with a dangling preposition, conjunction, or auxiliary verb.
    """
    s = text.strip().rstrip(".,!?")
    words = s.split()
    if len(words) < 2:
        return False

    last_word = words[-1].lower()
    dangling_prepositions = {"in", "at", "on", "with", "for", "about", "to", "from", "into", "of", "by"}
    dangling_conjunctions = {"because", "although", "when", "if", "while", "since", "so", "but"}
    
    if last_word in dangling_prepositions or last_word in dangling_conjunctions:
        return True

    if re.search(r"\b(i want to|i would like to|i am trying to|i need to|i plan to)$", s, re.IGNORECASE):
        return True

    return False

def is_topic_change(text: str, is_ongoing: bool = True) -> bool:
    """
    Detects if the user is explicitly introducing a new topic or requesting a pivot during an ongoing conversation.
    """
    if not is_ongoing:
        return False

    lower = text.lower().strip()
    topic_change_markers = [
        r"\bi want to (improve|practice|work on|focus on)\s+(?:my\s+)?(pronunciation|accent|vocabulary|fluency|interviews?|grammar)\b",
        r"\bcan we (talk about|practice|discuss|switch to|focus on)\b",
        r"\blet's (talk about|discuss|practice|switch to)\b",
        r"\bi have a question about\b",
        r"\bwhat does (.+) mean\b",
        r"\bhow do you say\b",
        r"\bcould you explain\b",
        r"\bchange the topic\b",
        r"\bdifferent topic\b"
    ]
    return any(re.search(p, lower) for p in topic_change_markers)

def is_gibberish(text: str) -> bool:
    """
    Checks if text exhibits obvious keyboard mash or non-phonetic structure.
    """
    cleaned = text.strip()
    if not cleaned:
        return False

    words = cleaned.split()
    # A multi-word message where most words contain vowels is not gibberish
    if len(words) >= 4:
        vowels_in_words = sum(1 for w in words if re.search(r"[aeiouyAEIOUY]", w))
        if vowels_in_words / len(words) >= 0.5:
            return False

    lower = cleaned.lower()
    for pattern in KEYBOARD_MASH_PATTERNS:
        if re.search(pattern, lower):
            return True

    words = cleaned.split()
    if len(words) == 1 and len(words[0]) > 7:
        vowels = len(re.findall(r"[aeiouyAEIOUY]", words[0]))
        if vowels == 0 or (len(words[0]) > 9 and vowels / len(words[0]) < 0.15):
            return True

    return False

def is_symbol_or_punctuation_only(text: str) -> bool:
    """
    Checks if text consists entirely of punctuation, symbols, or whitespace.
    """
    cleaned = text.strip()
    if not cleaned:
        return False
    return not bool(re.search(r"[a-zA-Z0-9]", cleaned))
