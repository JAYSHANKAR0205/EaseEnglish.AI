export interface VoiceSectionSource {
  hasCorrection?: boolean;
  correction?: string | null;
  explanation?: string | null;
  response?: string | null;
  transcript?: string | null;
  nextQuestion?: string | null;
}

/**
 * Extracts ordered logical voice sections from a structured AI response or message.
 * This ensures TTS plays each logical idea (correction, explanation, conversational response,
 * and follow-up question) sequentially with natural human-like pauses between them,
 * rather than concatenating everything into one flat, robotic audio stream.
 */
export function getVoiceSections(source: VoiceSectionSource): string[] {
  const sections: string[] = [];

  // Section 1: Spoken English correction (when a genuine error was identified)
  if (source.hasCorrection && source.correction && source.correction.trim()) {
    const rawCorrection = source.correction.trim();
    const framedCorrection = /^your sentence|^you can say|^better:/i.test(rawCorrection)
      ? rawCorrection
      : `Your sentence can be improved to: ${rawCorrection}`;
    sections.push(framedCorrection);

    // Section 2: Educational explanation of the grammar rule / word choice
    if (source.explanation && source.explanation.trim()) {
      const rawExplanation = source.explanation.trim();
      const framedExplanation = /^why:|^because/i.test(rawExplanation)
        ? rawExplanation
        : `Why: ${rawExplanation}`;
      sections.push(framedExplanation);
    }
  }

  // Section 3: Conversational coaching response
  const responseText = (source.response || source.transcript || '').trim();
  if (responseText) {
    sections.push(responseText);
  }

  // Section 4: Follow-up question
  if (source.nextQuestion && source.nextQuestion.trim()) {
    sections.push(source.nextQuestion.trim());
  }

  return sections;
}
