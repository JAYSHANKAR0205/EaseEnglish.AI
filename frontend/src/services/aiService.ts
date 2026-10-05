import { api } from './api';
import { AIDataResponse } from '../types/ai';
import { PracticeLevel, PracticeMode, LanguageOption } from '../types/conversation';

export const aiService = {
  async sendConversationTurn(
    conversationId: string,
    message: string,
    level: PracticeLevel,
    mode: PracticeMode,
    language: LanguageOption
  ): Promise<AIDataResponse> {
    const res = await api.post<{ success: boolean; data: AIDataResponse }>('/ai/conversation', {
      conversationId,
      message,
      level,
      mode,
      language,
    });
    return res.data.data;
  },

  async transcribeAudio(audioBase64: string, mimeType: string = 'audio/webm'): Promise<string> {
    const res = await api.post<{ success: boolean; transcript: string }>('/ai/transcribe', {
      audio_base64: audioBase64,
      mime_type: mimeType,
    });
    return res.data.transcript;
  },

  async synthesizeSpeech(text: string, voiceName?: string): Promise<string | null> {
    const res = await api.post<{ success: boolean; audioBase64: string | null }>('/ai/synthesize', {
      text,
      voice_name: voiceName,
    });
    return res.data.audioBase64 || null;
  },
};
