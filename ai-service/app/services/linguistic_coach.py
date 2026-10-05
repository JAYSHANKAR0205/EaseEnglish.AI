import re
from typing import Tuple, Optional, List, Dict
from app.schemas.models import PracticeLevel, HistoryMessage
from app.services.comprehension import (
    analyze_question_expectation,
    is_numeric_response,
    is_confirmation_response,
    is_incomplete_sentence,
    is_topic_change,
    is_gibberish,
    is_symbol_or_punctuation_only,
    QuestionExpectation
)

# Proper nouns requiring capitalization
INDIAN_STATES = {
    "bihar", "delhi", "punjab", "maharashtra", "karnataka", "uttar pradesh",
    "west bengal", "kerala", "tamil nadu", "gujarat", "rajasthan", "haryana",
    "madhya pradesh", "odisha", "assam", "jharkhand", "andhra pradesh",
    "telangana", "goa", "himachal pradesh", "uttarakhand", "chhattisgarh"
}

MAJOR_CITIES = {
    "patna", "mumbai", "delhi", "bangalore", "bengaluru", "kolkata", "chennai",
    "hyderabad", "pune", "ahmedabad", "jaipur", "lucknow", "chandigarh",
    "noida", "gurgaon", "gurugram", "indore", "bhopal", "london", "new york",
    "san francisco", "toronto", "sydney", "singapore", "dubai"
}

LANGUAGES = {
    "english", "hindi", "bengali", "tamil", "telugu", "marathi", "gujarati",
    "kannada", "malayalam", "punjabi", "urdu", "spanish", "french", "german",
    "japanese", "chinese", "russian"
}

COUNTRIES = {
    "india", "usa", "uk", "canada", "australia", "germany", "france", "japan",
    "singapore", "uae", "england", "america"
}

def normalize_surface_formatting(text: str) -> str:
    """
    Normalizes surface capitalization and punctuation for clean display.
    This does NOT constitute a language error.
    """
    s = text.strip()
    if not s:
        return s

    # 1. Capitalize standalone pronoun 'I' and contractions
    s = re.sub(r"\bi\b", "I", s)
    s = re.sub(r"\bi'(m|ve|ll|d)\b", lambda m: f"I'{m.group(1)}", s)

    # 2. Capitalize proper nouns: places (states, cities, countries) and languages
    for word_set in [LANGUAGES, INDIAN_STATES | MAJOR_CITIES | COUNTRIES]:
        for noun in sorted(word_set, key=len, reverse=True):
            pattern = rf"\b{re.escape(noun)}\b"
            s = re.sub(pattern, lambda m: m.group(0).title(), s, flags=re.IGNORECASE)

    # 3. Capitalize personal names following 'my name is'
    name_intro_match = re.search(r"\b(my name is)\s+([a-z]+(?:\s+[a-z]+)?)\b", s, re.IGNORECASE)
    if name_intro_match:
        raw_name = name_intro_match.group(2)
        common_words = {"a", "an", "the", "not"}
        name_parts = raw_name.split()
        if not any(p.lower() in common_words for p in name_parts):
            capped_name = " ".join(p.capitalize() for p in name_parts)
            start, end = name_intro_match.span(2)
            s = s[:start] + capped_name + s[end:]

    # 4. Conjunction commas (e.g. "...so I am..." -> "... , so I am...")
    s = re.sub(r"([a-zA-Z0-9])\s*\.\s*so\s+i\b", r"\1. So I", s)
    s = re.sub(r"([a-zA-Z0-9])\s+so\s+I\s+am\b", r"\1, so I am", s)

    # 5. Sentence initial capitalization and after periods
    if s and s[0].islower():
        s = s[0].upper() + s[1:]
    s = re.sub(r"(\.\s+)([a-z])", lambda m: m.group(1) + m.group(2).upper(), s)

    # 6. Ensure ending punctuation
    if s and not s.endswith(('.', '!', '?')):
        s += '.'

    return s


def analyze_and_correct_english(
    text: str,
    level: PracticeLevel = PracticeLevel.INTERMEDIATE
) -> Tuple[bool, Optional[str], Optional[str], Optional[str]]:
    """
    Performs linguistic, grammatical, and collocation analysis on user input.
    Distinguishes:
    - Genuine language errors (verb tenses, prepositions, articles, pronouns, adverbs, word choice, conjunctions, subject-verb agreement)
    - Surface formatting/capitalization (which are NOT errors!)

    Returns:
        (has_correction: bool,
         corrected_text: Optional[str],
         explanation: Optional[str],
         error_type: Optional[str])
    """
    original = text.strip()
    if not original:
        return False, None, None, None

    corrected = original
    matched_error_type: Optional[str] = None
    specific_explanation: Optional[str] = None

    def apply_rule(pattern, repl, explanation, error_type, flags=re.IGNORECASE):
        nonlocal corrected, matched_error_type, specific_explanation
        if specific_explanation:
            return
        match = re.search(pattern, corrected, flags=flags)
        if match:
            if callable(repl):
                corrected = re.sub(pattern, repl, corrected, flags=flags)
            else:
                corrected = re.sub(pattern, repl, corrected, flags=flags)
            specific_explanation = explanation
            matched_error_type = error_type

    # 1. Pronoun errors (High priority)
    apply_rule(
        r"\bme am\s+(?:a\s+)?(software developer|developer|programmer|engineer|doctor|teacher|student|manager)\b",
        lambda m: f"I am a {m.group(1)}",
        "Use the subject pronoun 'I' rather than 'Me' as the subject of the sentence.",
        "pronoun"
    )
    apply_rule(
        r"\bme am\b",
        "I am",
        "'I' is the correct subject pronoun to use as the subject of the sentence.",
        "pronoun"
    )
    apply_rule(
        r"\bme (want|have|work|need|like)\b",
        lambda m: f"I {m.group(1)}",
        "Use the subject pronoun 'I' rather than 'Me' as the subject of the sentence.",
        "pronoun"
    )
    apply_rule(
        r"\bmyself\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\b",
        lambda m: f"I am {m.group(1)}",
        "Introduce yourself with 'I am' or 'My name is' rather than 'Myself'.",
        "pronoun"
    )
    apply_rule(
        r"\b(him|her)\s+is\b",
        lambda m: f"{'he' if m.group(1).lower() == 'him' else 'she'} is",
        "Use subject pronouns ('he' or 'she') as the subject of the verb.",
        "pronoun"
    )

    # 2. Verb tense & duration errors
    apply_rule(
        r"\b(yesterday|last night|last week|last month|last year)\s+(?:i\s+)?go\s+to\s+office\b",
        lambda m: f"{m.group(1)} I went to the office",
        "Use the past tense 'went' because the action happened yesterday, and include 'the office'.",
        "verb_tense"
    )
    apply_rule(
        r"\b(yesterday|last night|last week|last month|last year)\s+(?:i\s+)?go\s+to\s+the\s+office\b",
        lambda m: f"{m.group(1)} I went to the office",
        "Use the past tense 'went' because the action happened in the past.",
        "verb_tense"
    )
    apply_rule(
        r"\b(yesterday|last night|last week|last month|last year)\s+(?:i|we|they|he|she)\s+go\b",
        lambda m: f"{m.group(1)} went",
        "Use the past tense 'went' because the action happened in the past.",
        "verb_tense"
    )
    apply_rule(
        r"\b(i am|i'm)\s+working\s+(?:here\s+)?from\s+(\d+|one|two|three|four|five|six|several|many)\s+(years?|months?)\b",
        lambda m: f"I have been working for {m.group(2)} {m.group(3)}",
        "Use 'have been working' for an ongoing action that started in the past, and 'for' with a duration (e.g. 'for two years').",
        "verb_tense"
    )
    apply_rule(
        r"\b(i am|i'm)\s+working\s+as\s+([a-zA-Z\s]+?)\s+from\s+(\d+|one|two|three|four|five|several|many)\s+(years?|months?)\b",
        lambda m: f"I have been working as {m.group(2).strip()} for {m.group(3)} {m.group(4)}",
        "Use 'have been working' for an ongoing action that started in the past, and 'for' with duration (e.g. 'for two years').",
        "verb_tense"
    )
    apply_rule(
        r"\bworking\s+(?:here\s+)?from\s+(\d+|one|two|three|four|five|six|several|many)\s+(years?|months?)\b",
        lambda m: f"working for {m.group(1)} {m.group(2)}",
        "Use 'for' instead of 'from' to express a duration of time (e.g. 'for two years').",
        "verb_tense"
    )
    apply_rule(
        r"\b(i am|i'm)\s+working\s+(?:here\s+)?since\s+(\d+|one|two|three|four|five|six|several|many)\s+(years?|months?)\b",
        lambda m: f"I have been working here for {m.group(2)} {m.group(3)}",
        "Use 'have been working' with 'for two years' to describe an action that started in the past and continues now.",
        "verb_tense"
    )
    apply_rule(
        r"\bworking\s+(?:here\s+)?since\s+(\d+|one|two|three|four|five|six|several|many)\s+(years?|months?)\b",
        lambda m: f"working here for {m.group(1)} {m.group(2)}",
        "Use 'for' with a duration of time; 'since' is for a specific starting point.",
        "verb_tense"
    )
    apply_rule(
        r"\bsince\s+(\d+|one|two|three|four|five)\s+(years?|months?)\b",
        lambda m: f"for {m.group(1)} {m.group(2)}",
        "Use 'for' with duration of time; 'since' is for starting points (e.g. 'since 2022').",
        "verb_tense"
    )
    apply_rule(
        r"\b(i have|i am having)\s+(\d{1,2})\s+years old\b",
        lambda m: f"I am {m.group(2)} years old",
        "Express age using 'I am ... years old' rather than 'I have'.",
        "verb_tense"
    )
    apply_rule(
        r"\b(i am|i'm)\s+agree\b",
        "I agree",
        "'Agree' is a verb; say 'I agree' rather than 'I am agree'.",
        "verb_tense"
    )
    apply_rule(
        r"\bdid\s+(went|came|saw|ate)\b",
        lambda m: {
            "went": "did go", "came": "did come", "saw": "did see", "ate": "did eat"
        }.get(m.group(1).lower(), m.group(0)),
        "Use the base form of the verb after 'did' (e.g. 'did go').",
        "verb_tense"
    )

    # 3. Preposition & collocation errors
    apply_rule(
        r"\bpractice in [eE]nglish\b",
        "practice English",
        "Say 'practice English' rather than 'practice in English'.",
        "preposition"
    )
    apply_rule(
        r"\binterested on\b",
        "interested in",
        "The adjective 'interested' is naturally followed by the preposition 'in'.",
        "preposition"
    )
    apply_rule(
        r"\bgood in (coding|programming|speaking|english|maths?)\b",
        r"good at \1",
        "Use 'good at' to describe ability in a subject or skill.",
        "preposition"
    )
    apply_rule(
        r"\bmarried with\b",
        "married to",
        "Say 'married to' instead of 'married with'.",
        "preposition"
    )
    apply_rule(
        r"\blisten (music|songs|podcasts?)\b",
        r"listen to \1",
        "The verb 'listen' requires the preposition 'to'.",
        "preposition"
    )
    apply_rule(
        r"\bdiscuss about\b",
        "discuss",
        "'Discuss' directly takes an object without 'about'.",
        "preposition"
    )
    apply_rule(
        r"\bexplain me\b",
        "explain to me",
        "'Explain' takes 'to' before the person being explained to.",
        "preposition"
    )
    apply_rule(
        r"\bcongratulate for\b",
        "congratulate on",
        "Use 'congratulate on' rather than 'congratulate for'.",
        "preposition"
    )
    apply_rule(
        r"\bdepend of\b",
        "depend on",
        "Use 'depend on' rather than 'depend of'.",
        "preposition"
    )

    # 4. Article errors
    apply_rule(
        r"\b(i am|i'm)\s+(software developer|developer|programmer|doctor|teacher|student|manager)\b",
        lambda m: f"I am a {m.group(2)}",
        "Use the article 'a' before a singular countable profession.",
        "article"
    )
    apply_rule(
        r"\b(i am|i'm)\s+engineer\b",
        "I am an engineer",
        "Use the article 'an' before a vowel sound (e.g. 'an engineer').",
        "article"
    )
    apply_rule(
        r"\b(he is|he's|she is|she's)\s+(software developer|developer|programmer|doctor|teacher|student|manager)\b",
        lambda m: f"{m.group(1)} a {m.group(2)}",
        "Use the article 'a' before a singular countable profession.",
        "article"
    )
    apply_rule(
        r"\b(he is|he's|she is|she's)\s+engineer\b",
        lambda m: f"{m.group(1)} an engineer",
        "Use the article 'an' before a vowel sound.",
        "article"
    )
    apply_rule(
        r"\b(there is|it is|it's)\s+(pretty good|great|good|nice|happy|vibrant|positive)\s+(environment|atmosphere|ambiance|vibe)\b",
        lambda m: f"{m.group(1)} a {m.group(2)} {m.group(3)}",
        "Use the article 'a' before a singular countable noun phrase (e.g. 'a pretty good environment').",
        "article"
    )
    apply_rule(
        r"\b(and\s+i\s+attend\s+that|and\s+i\s+attend\s+it)\b",
        "and I attended it",
        "Use the past tense 'attended' when referring to an event you went to earlier.",
        "verb_tense"
    )

    # 5. Adjective / Adverb errors
    apply_rule(
        r"\bspeaks?\s+very\s+good\b",
        "speaks very well",
        "'Well' is the adverb used to describe how someone speaks.",
        "adverb"
    )
    apply_rule(
        r"\bspeaks?\s+good\b",
        "speaks well",
        "'Well' is the adverb used to describe how someone speaks.",
        "adverb"
    )
    apply_rule(
        r"\bdrives?\s+fastly\b",
        "drives fast",
        "'Fast' is both an adjective and an adverb; 'fastly' is not standard English.",
        "adverb"
    )
    apply_rule(
        r"\bmore better\b",
        "better",
        "'Better' is already comparative; avoid saying 'more better'.",
        "adverb"
    )

    # 6. Word choice errors
    apply_rule(
        r"\b(did|do)\s+a\s+decision\b",
        lambda m: "made a decision" if m.group(1).lower() == "did" else "make a decision",
        "The natural expression in English is 'make a decision', not 'do a decision'.",
        "word_choice"
    )
    apply_rule(
        r"\btake\s+a\s+decision\b",
        "make a decision",
        "The standard expression in English is 'make a decision'.",
        "word_choice"
    )
    apply_rule(
        r"\b(did|do)\s+a\s+mistake\b",
        lambda m: "made a mistake" if m.group(1).lower() == "did" else "make a mistake",
        "The natural expression in English is 'make a mistake', not 'do a mistake'.",
        "word_choice"
    )
    apply_rule(
        r"\bgive\s+an\s+exam\b",
        "take an exam",
        "Students 'take' an exam; teachers 'give' an exam.",
        "word_choice"
    )
    apply_rule(
        r"\bpassed out from (college|university|school)\b",
        r"graduated from \1",
        "Use 'graduated from' for completing studies.",
        "word_choice"
    )
    apply_rule(
        r"\binformations\b",
        "information",
        "'Information' is an uncountable noun and does not take plural '-s'.",
        "word_choice"
    )
    apply_rule(
        r"\badvices\b",
        "advice",
        "'Advice' is uncountable; say 'advice' or 'pieces of advice'.",
        "word_choice"
    )
    apply_rule(
        r"\bfeedbacks\b",
        "feedback",
        "'Feedback' is an uncountable noun; use 'feedback'.",
        "word_choice"
    )
    apply_rule(
        r"\bmuch people\b",
        "many people",
        "Use 'many' with countable nouns like 'people'.",
        "word_choice"
    )
    apply_rule(
        r"\b(i am|i'm)\s+fearing\s+about\s+(.+?)(?=[.,!?]|$)",
        lambda m: f"I am worried about {m.group(2)}",
        "In standard English, use 'worried about' or 'afraid of' rather than 'fearing about'.",
        "word_choice"
    )
    apply_rule(
        r"\bfearing\s+about\s+(.+?)(?=[.,!?]|$)",
        lambda m: f"worried about {m.group(1)}",
        "Use 'worried about' or 'afraid of' instead of 'fearing about'.",
        "word_choice"
    )
    apply_rule(
        r"\bfear\s+about\s+(.+?)(?=[.,!?]|$)",
        lambda m: f"worried about {m.group(1)}",
        "Use 'worried about' or 'afraid of' instead of 'fear about'.",
        "word_choice"
    )

    # 7. Conjunction & sentence structure errors
    apply_rule(
        r"\bbecause\s+(.+?)\s+so\s+(.+)\b",
        lambda m: f"Because {m.group(1).strip()}, {m.group(2).strip()}",
        "'Because' already introduces the reason, so 'so' is unnecessary in this sentence structure.",
        "conjunction"
    )
    apply_rule(
        r"\balthough\s+(.+?)\s+but\s+(.+)\b",
        lambda m: f"Although {m.group(1).strip()}, {m.group(2).strip()}",
        "'Although' already introduces the contrast, so 'but' is unnecessary.",
        "conjunction"
    )

    # 8. Subject-verb agreement
    apply_rule(
        r"\b(he|she|it)\s+don't\b",
        lambda m: f"{m.group(1)} doesn't",
        "With third-person singular subjects (he, she, it), use 'doesn't'.",
        "subject_verb_agreement"
    )
    apply_rule(
        r"\b(he|she)\s+go\b",
        lambda m: f"{m.group(1)} goes",
        "Third-person singular present verbs take '-s' (e.g. 'he goes').",
        "subject_verb_agreement"
    )
    apply_rule(
        r"\b(they|we)\s+was\b",
        lambda m: f"{m.group(1)} were",
        "Use 'were' with plural subjects (they, we).",
        "subject_verb_agreement"
    )
    apply_rule(
        r"\b(i|he|she)\s+were\b",
        lambda m: f"{m.group(1)} was",
        "Use 'was' with singular subjects (I, he, she).",
        "subject_verb_agreement"
    )

    # CRITICAL CHECK: Did ANY substantive linguistic rule trigger?
    if not matched_error_type or not specific_explanation:
        # NO real language error detected. Capitalization/punctuation alone is NOT an error.
        return False, None, None, None

    # A real language error was detected. Normalize surface formatting of the corrected sentence.
    final_corrected = normalize_surface_formatting(corrected)

    return True, final_corrected, specific_explanation, matched_error_type


def generate_empathetic_coaching_response(
    user_text: str,
    level: PracticeLevel = PracticeLevel.INTERMEDIATE,
    history: List[HistoryMessage] = None,
    user_name: Optional[str] = None
) -> Tuple[str, str]:
    """
    Generates an empathetic, natural conversational response and exactly ONE contextual follow-up question.
    Never uses generic filler like 'That is an insightful perspective on your experience'.
    """
    lower = user_text.lower()
    recent_history_text = " ".join([h.transcript or "" for h in (history[-12:] if history else [])]).lower()
    user_history_turns = [h.transcript for h in (history or []) if h.role == "user" and h.transcript]
    combined_user_history = " ".join(user_history_turns).lower()
    is_ongoing = len(user_history_turns) > 0

    # Extract previous question and its expectation from history
    last_assistant = next((m for m in reversed(history or []) if m.role == "assistant"), None)
    last_q = (last_assistant.next_question or last_assistant.response or "").strip() if last_assistant else ""
    expectation, topic_label = analyze_question_expectation(last_q)

    # 1. Context Recall Queries (e.g. "What did I say I work with?", "What do I work with?", "What did I mention?", "Where did I say I am from?")
    is_context_query = bool(re.search(
        r"\b(what\s+did\s+i\s+(say|mention|tell)|what\s+do\s+i\s+work\s+with|what\s+did\s+i\s+work\s+with|where\s+did\s+i\s+say|what\s+is\s+my\s+job|what\s+technolog(y|ies)\s+did\s+i|what\s+stack\s+did\s+i|do\s+you\s+remember\s+what\s+i)\b",
        lower
    ))
    if is_context_query and history:
        # Check what the user previously shared regarding work / tech / tools
        if any(w in lower for w in ["work", "job", "profession", "stack", "technology", "technologies", "tool", "tools"]):
            found_tech = []
            for t in ["react", "node", "python", "javascript", "typescript", "mongodb", "sql", "java", "c++", "golang", "angular", "vue", "html", "css"]:
                if re.search(rf"\b{t}\b", combined_user_history):
                    found_tech.append(t.title() if t != "mongodb" else "MongoDB")
            prof = None
            for p in ["software developer", "software engineer", "developer", "programmer", "engineer", "teacher", "student", "doctor"]:
                if p in combined_user_history:
                    prof = p.title()
                    break

            if found_tech and prof:
                tech_str = ", ".join(found_tech)
                return (
                    f"You mentioned earlier that you work as a {prof}, and you primarily work with {tech_str}!",
                    f"Would you like to practice describing a project you built with {found_tech[0]}, or discuss how you use it in your daily work?"
                )
            elif found_tech:
                tech_str = ", ".join(found_tech)
                return (
                    f"You mentioned earlier that you work with {tech_str}!",
                    f"Would you like to share more about a project you've developed using {found_tech[0]}?"
                )
            elif prof:
                return (
                    f"You mentioned earlier that you work as a {prof}!",
                    f"What kind of projects or challenges have you been working on recently in your role?"
                )

        # Check what the user previously shared regarding location
        if any(w in lower for w in ["from", "live", "living", "place", "city", "state", "origin"]):
            for loc in sorted(INDIAN_STATES | MAJOR_CITIES | COUNTRIES, key=len, reverse=True):
                if re.search(rf"\b{re.escape(loc)}\b", combined_user_history):
                    return (
                        f"You mentioned earlier that you are from {loc.title()}!",
                        f"What is something special or unique about {loc.title()} that you really appreciate?"
                    )

        # General context recall fallback
        if user_history_turns:
            return (
                f"Earlier, you mentioned: \"{user_history_turns[-1]}\". I'm following our conversation carefully!",
                "Would you like to build further on that, or discuss something else?"
            )

    # 2. Obvious Gibberish / Symbols / Non-language handling
    if is_gibberish(user_text):
        return (
            "I didn't quite catch that. Could you say that again in a complete English sentence?",
            f"Regarding {topic_label}, what were you hoping to share?" if last_q else "What would you like to speak about today?"
        )

    if is_symbol_or_punctuation_only(user_text):
        return (
            "I'm listening! Whenever you're ready, feel free to type or speak your thoughts in English.",
            f"Regarding {topic_label}, what are your thoughts?" if last_q else "What would you like to practice today?"
        )

    # 3. Incomplete Sentence Detection (e.g. "I work in", "Because when I")
    if is_incomplete_sentence(user_text):
        return (
            f"It sounds like your sentence was left incomplete after \"{user_text.strip()}\". In English, we usually complete that phrase by mentioning your workplace, industry, or details.",
            "Could you complete the rest of that sentence for me?"
        )

    # 3. User Introductions (ONLY when not an ongoing conversation)
    # e.g. "Hello i am jayshankar kumar. I am from bihar. i want to learn english so i am here to practice in english"
    if not is_ongoing:
        if ("from bihar" in lower or "in bihar" in lower) and ("learn english" in lower or "practice" in lower):
            name_call = f", {user_name}" if user_name else ""
            return (
                f"Nice to meet you{name_call}! It is wonderful to welcome you from Bihar. Regular conversation practice is the absolute best way to turn your English knowledge into confident, natural speech.",
                "What is your primary goal or reason for improving your English right now—is it for your job, studies, or daily communication?"
            )

        if "my name is" in lower:
            name_str = f", {user_name}" if user_name else ""
            return (
                f"Hello{name_str}! It's a pleasure to meet you. I'm excited to be your English conversation coach.",
                "Could you share a little about what you do or what you enjoy doing in your free time?"
            )

    # 4. Contextual vs Out-of-Context Numbers (e.g. "65")
    if is_numeric_response(user_text):
        if expectation == QuestionExpectation.NUMERIC:
            # Meaningful answer to a numeric question
            if "age" in topic_label or "old" in topic_label:
                return (
                    f"{user_text.strip()} is a wonderful stage in life with so much rich life experience to draw upon! It is a pleasure to practice English with you.",
                    "What are some of your favorite ways to spend your time or hobbies you enjoy these days?"
                )
            elif "how long" in topic_label or "years" in topic_label:
                return (
                    f"{user_text.strip()} is a solid amount of time to build practical, real-world experience!",
                    "What has been one of the most rewarding or interesting parts of that experience for you?"
                )
            else:
                return (
                    f"Thank you for sharing that! That gives me helpful context.",
                    "Could you tell me a little more about what that has been like?"
                )
        else:
            # Out-of-context number: NEVER invent meaning or pretend to understand!
            return (
                f"I'm not quite sure I understood how \"{user_text.strip()}\" connects to what we were discussing about {topic_label}. Could you explain what you meant in a full sentence?",
                f"Regarding {topic_label}, what activities or thoughts would you like to share?"
            )

    # 5. Contextual vs Out-of-Context Binary Confirmation (Yes / No)
    is_conf, is_aff = is_confirmation_response(user_text)
    if is_conf:
        if expectation == QuestionExpectation.CONFIRMATION:
            if is_aff:
                return (
                    "That is wonderful to hear! Having a positive outlook makes practicing conversation much more productive.",
                    f"Could you tell me a little more about what you find most interesting about {topic_label}?"
                )
            else:
                return (
                    "That makes complete sense! Everyone has their own preferences and perspective.",
                    "What would you prefer to focus on or talk about instead?"
                )
        else:
            return (
                f"I'm not completely sure what you are referring to with that answer. Could you tell me a little more in relation to {topic_label}?",
                "Could you say that in a full sentence?"
            )

    # 6. Explicit Topic Change during ongoing chat (e.g. "I want to improve my pronunciation")
    if is_ongoing and is_topic_change(user_text, is_ongoing=True):
        if "pronunciation" in lower:
            return (
                "Working on your pronunciation is a fantastic goal! Clear pronunciation helps you speak English with greater clarity and confidence.",
                "Are there specific English words, sounds, or speaking situations where you feel your pronunciation needs the most practice?"
            )
        elif "interview" in lower:
            return (
                "Preparing for interviews is one of the most effective ways to use our practice sessions! Being able to explain your experience clearly is key.",
                "What kind of position or interview are you currently preparing for?"
            )
        else:
            return (
                "I would be glad to switch to that topic! Practicing topics that are directly relevant to your daily needs is the best way to learn.",
                "Could you start by sharing your main thought or question on that topic?"
            )

    # 7. Short Entity Answers matching question expectation (e.g. "software" after "Where do you work?")
    if expectation == QuestionExpectation.PROFESSION and any(w in lower for w in ["software", "coding", "developer", "engineering", "teaching", "student", "doctor", "design", "finance", "business"]):
        return (
            "Working in software is an exciting and fast-paced field where clear English communication makes a huge difference!",
            "What specific role or technology do you work on within software?"
        )
    if expectation == QuestionExpectation.TECHNOLOGY and any(w in lower for w in ["javascript", "python", "react", "node", "java", "c++", "golang", "sql", "html", "css"]):
        return (
            "That is a great technology to work with! Having deep familiarity with your core tools allows you to solve engineering problems much faster.",
            "Could you describe an interesting feature or challenge you tackled with that recently?"
        )

    # 8. Empathy towards Learning Anxiety, Fear, and Hesitation
    # e.g. "I am fearing about english", "I feel nervous", "I lack confidence"
    if any(k in lower for k in ["fearing", "fear about", "afraid", "nervous", "scared", "lack confidence", "low confidence", "hesitant", "hesitate", "shy to speak", "worry about", "worried about"]):
        return (
            "It is completely natural to feel nervous or worried about speaking English! Almost every fluent speaker started from the exact same place. You don't have to be perfect here—every turn you take builds genuine confidence and fluency.",
            "What makes you feel most hesitant when speaking English: finding the right vocabulary, grammar, or speaking with others?"
        )

    # 4. Location / Origin mentioned
    if "bihar" in lower:
        return (
            "Bihar has such a rich history and vibrant culture! Connecting with people from different regions is one of the best parts of practicing English together.",
            "Which city or town in Bihar are you from, or what do you like most about living there?"
        )

    if any(k in lower for k in ["yesterday", "went to the office", "went to office", "go to office"]):
        return (
            "Going into the office can be a productive change of pace compared to working remotely.",
            "How did your day at the office go yesterday?"
        )

    if any(k in lower for k in ["decision", "decided"]):
        return (
            "Making decisions—especially important ones—can take a lot of thought and reflection.",
            "Could you share a little about what decision you were thinking through?"
        )

    if any(k in lower for k in ["lived in", "living in", "live in"]):
        city_match = re.search(r"\b(?:lived in|living in|live in)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\b", user_text, re.IGNORECASE)
        loc_str = city_match.group(1).title() if city_match else "the city"
        return (
            f"Living in {loc_str} sounds like a rich and dynamic experience! Everyday experiences in a lively place provide so much great material for conversation practice.",
            f"What is something you particularly enjoy or find most interesting about living in {loc_str}?"
        )

    # 3. Purpose: Job / Interviews / Career
    if any(k in lower for k in ["for my job", "for job", "workplace", "career", "office"]):
        return (
            "That is a very practical and important motivation. Having confident English in the workplace makes a massive difference in meetings, team presentations, and career advancement.",
            "What kind of work or industry are you currently in?"
        )

    if any(k in lower for k in ["interview", "interviews", "job interview"]):
        return (
            "Preparing for interviews is one of the highest-value reasons to practice. Being able to explain your thoughts and problem-solving clearly under pressure is key.",
            "What kind of role or position are you currently preparing interviews for?"
        )

    # 4. Learning English / Practice
    if any(k in lower for k in ["want to learn english", "improve my english", "practice english", "speak english"]):
        return (
            "You are in the right place! The key to speaking naturally is consistency—speaking aloud and getting immediate, supportive feedback without worrying about making mistakes.",
            "What do you find most challenging when speaking English right now: finding the right words, grammar, or confidence?"
        )

    # Greetings / Intros
    if any(k in lower for k in ["hello", "hi", "hey", "greetings"]) and len(user_text.split()) <= 4:
        name_str = f", {user_name}" if user_name else ""
        if is_ongoing:
            return (
                f"Hello{name_str}! Glad to continue practicing with you.",
                "What would you like to talk about next?"
            )
        return (
            f"Hello{name_str}! It is wonderful to meet you. I am excited to help you practice your English.",
            "Could you start by telling me a little about yourself or what you'd like to talk about today?"
        )

    # Celebrations & Gatherings (dynamically reflects the user's actual event)
    if any(k in lower for k in ["celebrat", "festival", "visarjan", "puja", "party", "holiday"]):
        event_match = re.search(r"\b(?:celebrating|celebrate|doing|festival of|enjoying)\s+([a-zA-Z\s]+?)(?:\.|$|,|!|\?|and)", user_text, re.IGNORECASE)
        event_name = event_match.group(1).strip().title() if event_match else "the celebration"
        return (
            f"Celebrating {event_name} brings such vibrant energy and memorable moments! Celebrating special occasions with friends, family, and colleagues is a wonderful experience.",
            f"What do you enjoy most about celebrating {event_name}?"
        )

    # 6. Software Developer / Tech / Programming
    if any(k in lower for k in ["software developer", "developer", "programmer", "coding", "software engineer", "web dev"]):
        if any(k in lower for k in ["two years", "2 years", "few years", "years"]):
            return (
                "That's great! Two years in software development is a solid foundation where you've transitioned from learning basics to building real-world features.",
                "What made you choose software development as your career path?"
            )
        return (
            "Software development is a fast-evolving and rewarding field! Clear English communication is especially helpful when explaining technical architectures and collaborating with global teams.",
            "What kind of development do you specialize in—backend, frontend, or full-stack?"
        )

    # 6. Backend / Node.js / MongoDB / APIs
    if any(k in lower for k in ["backend", "node.js", "nodejs", "apis", "api", "database", "mongodb", "sql", "postgres"]):
        if "node" in lower:
            return (
                "Node.js is fantastic for building scalable asynchronous APIs and microservices. Working with JavaScript across the stack is very popular.",
                "What database or tools do you typically pair with Node.js in your projects?"
            )
        if "api" in lower:
            return (
                "Designing clean, reliable APIs is the backbone of modern web applications.",
                "What kind of APIs have you built recently—were they for web apps, internal services, or mobile apps?"
            )
        if "database" in lower or "mongodb" in lower:
            return (
                "Working with databases like MongoDB is critical for data modeling and query optimization.",
                "What do you enjoy most about designing database schemas and optimizing queries?"
            )
        return (
            "Backend systems are fascinating because you deal with performance, scalability, and system architecture.",
            "What technologies or programming languages do you use most frequently for backend work?"
        )

    # 7. Contextual follow-up when user mentions a technology (e.g. user previously said software dev, now says Node.js)
    if any(k in recent_history_text for k in ["software", "developer", "backend", "programmer"]):
        if any(k in lower for k in ["node", "python", "react", "java", "c++", "golang", "mongo"]):
            return (
                "That is a strong technology stack! Having deep familiarity with your core tools allows you to solve engineering problems much faster.",
                "Could you describe an interesting feature or challenge you tackled with that technology recently?"
            )

    # 8. Hobbies / Sports / Interests
    if "cricket" in lower:
        return (
            "Cricket is such an exciting sport with an incredible following across the world!",
            "Do you prefer playing cricket yourself, or do you mostly enjoy watching international and league matches?"
        )

    if any(k in lower for k in ["football", "soccer"]):
        return (
            "Football is a thrilling sport with tremendous energy!",
            "Which club or national team do you support?"
        )

    if any(k in lower for k in ["reading", "books", "novel"]):
        return (
            "Reading is a wonderful habit that also naturally expands your English vocabulary and sentence structures.",
            "What kind of books do you enjoy reading most—fiction, self-help, or technical topics?"
        )

    if any(k in lower for k in ["travel", "traveling", "trip"]):
        return (
            "Traveling gives you wonderful experiences and great stories to share!",
            "What has been one of the most memorable places you have visited so far?"
        )

    # 9. Daily life / Feeling
    if any(k in lower for k in ["good morning", "good afternoon", "good evening"]):
        name_str = f", {user_name}" if user_name else ""
        return (
            f"Hello{name_str}! It is wonderful to speak with you today.",
            "Could you start by telling me a little about how your day has been so far?"
        )

    if any(k in lower for k in ["busy", "tiring", "productive", "fine", "great", "doing well"]):
        return (
            "I hear you! Our daily routines keep us on our toes.",
            "What was the main thing you spent your time on today?"
        )

    # Default Dialogue: Check whether the input contains an understandable clause or is an ambiguous fragment
    words = user_text.split()
    has_clause = len(words) >= 3 and any(w in lower for w in [
        "i", "you", "we", "he", "she", "it", "they", "am", "is", "are", "have", "has",
        "do", "does", "want", "like", "go", "work", "live", "feel", "think", "prefer", "enjoy"
    ])

    if not has_clause:
        # Ambiguous, short fragment with no verb or clause that didn't match any context
        return (
            f"I'm not quite sure I understood what you meant by that. Could you tell me a little more in a complete sentence?",
            f"Regarding {topic_label}, what were you hoping to share?" if last_q else "What would you like to speak about today?"
        )

    # General meaningful dialogue without fake boilerplate praise
    if level == PracticeLevel.ADVANCED:
        return (
            "You are articulating your thoughts clearly. Being able to explain your perspective concisely is a hallmark of strong communication.",
            "What perspective or experience shaped your thinking the most on this topic?"
        )
    else:
        return (
            "That makes complete sense, and continuing to express your thoughts aloud is the best way to build speaking fluency.",
            "Could you share a little more detail about that experience, or what example comes to mind?"
        )
