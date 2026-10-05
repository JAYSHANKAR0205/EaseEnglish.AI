import { PracticeLevel } from './conversation';

export type InputQuality = 'valid' | 'gibberish' | 'empty' | 'injection_attempt';

export interface AIDataResponse {
  inputQuality: InputQuality;
  transcript: string;
  hasCorrection: boolean;
  correction: string | null;
  explanation: string | null;
  errorType?: string | null;
  response: string;
  nextQuestion: string | null;
  difficulty: PracticeLevel;
  fastPath: boolean;
  audioBase64?: string | null;
}
