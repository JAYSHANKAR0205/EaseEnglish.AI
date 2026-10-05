export type PracticeLevel = 'beginner' | 'intermediate' | 'advanced';
export type PracticeMode = 'chat' | 'voice';
export type LanguageOption = 'english' | 'hindi';

export interface Message {
  _id?: string;
  role: 'user' | 'assistant' | 'system';
  transcript: string;
  hasCorrection?: boolean;
  correction?: string | null;
  explanation?: string | null;
  errorType?: string | null;
  response?: string | null;
  nextQuestion?: string | null;
  fastPath?: boolean;
  timestamp: string | Date;
}

export interface Conversation {
  _id: string;
  userId: string;
  title: string;
  level: PracticeLevel;
  mode: PracticeMode;
  language: LanguageOption;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  level: PracticeLevel;
  mode: PracticeMode;
  language: LanguageOption;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastSnippet: string;
}
