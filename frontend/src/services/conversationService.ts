import { api } from './api';
import { Conversation, ConversationSummary, PracticeLevel, PracticeMode, LanguageOption } from '../types/conversation';

export const conversationService = {
  async createConversation(
    level: PracticeLevel = 'intermediate',
    mode: PracticeMode = 'chat',
    language: LanguageOption = 'english'
  ): Promise<Conversation> {
    const res = await api.post<{ success: boolean; conversation: Conversation }>('/conversations', {
      level,
      mode,
      language,
    });
    return res.data.conversation;
  },

  async getConversations(): Promise<ConversationSummary[]> {
    const res = await api.get<{ success: boolean; conversations: ConversationSummary[] }>('/conversations');
    return res.data.conversations;
  },

  async getConversationById(id: string): Promise<Conversation> {
    const res = await api.get<{ success: boolean; conversation: Conversation }>(`/conversations/${id}`);
    return res.data.conversation;
  },

  async deleteConversation(id: string): Promise<void> {
    await api.delete(`/conversations/${id}`);
  },
};
