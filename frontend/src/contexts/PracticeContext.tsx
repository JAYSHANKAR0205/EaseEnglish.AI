import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Conversation, ConversationSummary, PracticeLevel, PracticeMode, LanguageOption, Message } from '../types/conversation';
import { conversationService } from '../services/conversationService';
import { aiService } from '../services/aiService';
import { useAuth } from './AuthContext';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { getVoiceSections } from '../utils/speechUtils';

interface PracticeContextType {
  currentConversation: Conversation | null;
  conversations: ConversationSummary[];
  level: PracticeLevel;
  mode: PracticeMode;
  language: LanguageOption;
  isSending: boolean;
  isHistoryOpen: boolean;
  activeError: string | null;
  isSpeaking: boolean;
  voiceListenTrigger: number;
  speak: (input: string | string[], onEnd?: () => void) => void;
  stopSpeech: () => void;
  setLevel: (lvl: PracticeLevel) => void;
  setMode: (m: PracticeMode) => void;
  setLanguage: (lang: LanguageOption) => void;
  sendMessage: (text: string) => Promise<void>;
  newChat: () => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  toggleHistory: (open?: boolean) => void;
  clearError: () => void;
}

const PracticeContext = createContext<PracticeContextType | undefined>(undefined);

export const PracticeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [level, setLevelState] = useState<PracticeLevel>('intermediate');
  const [mode, setModeState] = useState<PracticeMode>('chat');
  const [language, setLanguageState] = useState<LanguageOption>('english');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [activeError, setActiveError] = useState<string | null>(null);
  const [voiceListenTrigger, setVoiceListenTrigger] = useState<number>(0);

  const isSendingRef = useRef<boolean>(false);
  const isInitializingRef = useRef<boolean>(false);
  const hasInitializedRef = useRef<boolean>(false);

  const { speak: synthSpeak, stop: synthStop, isSpeaking } = useSpeechSynthesis();

  const speak = useCallback(
    (input: string | string[], onEnd?: () => void) => {
      synthSpeak(input, () => {
        onEnd?.();
        if (mode === 'voice') {
          setVoiceListenTrigger((prev) => prev + 1);
        }
      });
    },
    [synthSpeak, mode]
  );

  const stopSpeech = useCallback(() => {
    synthStop();
  }, [synthStop]);

  // Load conversation history and initialize active session when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentConversation(null);
      setConversations([]);
      localStorage.removeItem('ease_english_active_conv_id');
      hasInitializedRef.current = false;
      return;
    }

    if (hasInitializedRef.current || isInitializingRef.current) {
      return;
    }

    const initPractice = async () => {
      isInitializingRef.current = true;
      try {
        const historyList = await conversationService.getConversations();
        setConversations(historyList);

        if (historyList.length > 0) {
          // Check if there is an active conversation ID stored in localStorage
          const savedActiveId = localStorage.getItem('ease_english_active_conv_id');
          const targetSummary = savedActiveId ? historyList.find((c) => c.id === savedActiveId) : null;
          const targetId = targetSummary ? targetSummary.id : historyList[0].id;

          const activeConv = await conversationService.getConversationById(targetId);
          setCurrentConversation(activeConv);
          localStorage.setItem('ease_english_active_conv_id', activeConv._id);
          setLevelState(activeConv.level || 'intermediate');
          setModeState(activeConv.mode || 'chat');
          setLanguageState(activeConv.language || 'english');
        } else {
          // Initialize fresh first conversation session
          const newConv = await conversationService.createConversation('intermediate', 'chat', 'english');
          setCurrentConversation(newConv);
          localStorage.setItem('ease_english_active_conv_id', newConv._id);
          setConversations([
            {
              id: newConv._id,
              title: newConv.title,
              level: newConv.level,
              mode: newConv.mode,
              language: newConv.language,
              createdAt: newConv.createdAt,
              updatedAt: newConv.updatedAt,
              messageCount: newConv.messages.length,
              lastSnippet: newConv.messages[0]?.transcript || '',
            },
          ]);
        }
        hasInitializedRef.current = true;
      } catch (err: any) {
        console.error('Failed to initialize conversation session:', err);
      } finally {
        isInitializingRef.current = false;
      }
    };

    initPractice();
  }, [isAuthenticated]);

  const setLevel = useCallback((newLevel: PracticeLevel) => {
    setLevelState(newLevel);
    if (currentConversation) {
      setCurrentConversation((prev) => (prev ? { ...prev, level: newLevel } : prev));
    }
  }, [currentConversation]);

  const setMode = useCallback((newMode: PracticeMode) => {
    setModeState(newMode);
    if (currentConversation) {
      setCurrentConversation((prev) => (prev ? { ...prev, mode: newMode } : prev));
    }
    // Stop ongoing speech if user switches to chat mode
    if (newMode === 'chat') {
      synthStop();
    }
  }, [currentConversation, synthStop]);

  const setLanguage = useCallback((newLang: LanguageOption) => {
    setLanguageState(newLang);
    if (currentConversation) {
      setCurrentConversation((prev) => (prev ? { ...prev, language: newLang } : prev));
    }
  }, [currentConversation]);

  const toggleHistory = useCallback((open?: boolean) => {
    setIsHistoryOpen((prev) => (open !== undefined ? open : !prev));
  }, []);

  const clearError = useCallback(() => {
    setActiveError(null);
  }, []);

  const newChat = useCallback(async () => {
    if (isSendingRef.current) return;
    isSendingRef.current = true;
    setIsSending(true);
    synthStop();
    try {
      const newConv = await conversationService.createConversation(level, mode, language);
      setCurrentConversation(newConv);
      localStorage.setItem('ease_english_active_conv_id', newConv._id);

      // Refresh history list
      const updatedList = await conversationService.getConversations();
      setConversations(updatedList);

      // If in Voice Mode, synthesize the new greeting with natural pacing
      if (mode === 'voice' && newConv.messages.length > 0) {
        const greetingSections = getVoiceSections(newConv.messages[0]);
        speak(greetingSections.length > 0 ? greetingSections : (newConv.messages[0].response || newConv.messages[0].transcript));
      }
    } catch (err: any) {
      console.error('Error creating new conversation:', err);
      setActiveError('Could not start a new conversation. Please try again.');
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
    }
  }, [level, mode, language, speak, synthStop]);

  const loadConversation = useCallback(async (id: string) => {
    if (isSendingRef.current) return;
    isSendingRef.current = true;
    setIsSending(true);
    synthStop();
    try {
      const conv = await conversationService.getConversationById(id);
      setCurrentConversation(conv);
      localStorage.setItem('ease_english_active_conv_id', conv._id);
      setLevelState(conv.level || 'intermediate');
      setModeState(conv.mode || 'chat');
      setLanguageState(conv.language || 'english');
      setIsHistoryOpen(false);
    } catch (err: any) {
      console.error('Error loading conversation:', err);
      setActiveError('Could not load the selected conversation.');
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
    }
  }, [synthStop]);

  const deleteConversation = useCallback(async (id: string) => {
    try {
      await conversationService.deleteConversation(id);
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);
      if (localStorage.getItem('ease_english_active_conv_id') === id) {
        localStorage.removeItem('ease_english_active_conv_id');
      }
      if (currentConversation && currentConversation._id === id) {
        if (remaining.length > 0) {
          // Switch cleanly to the next available conversation
          await loadConversation(remaining[0].id);
        } else {
          // No conversations left, start a clean new chat session
          await newChat();
        }
      }
    } catch (err: any) {
      console.error('Error deleting conversation:', err);
      setActiveError('Failed to delete conversation.');
    }
  }, [conversations, currentConversation, loadConversation, newChat]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !currentConversation || isSendingRef.current) return;

    setActiveError(null);
    isSendingRef.current = true;
    setIsSending(true);

    const userMessage: Message = {
      role: 'user',
      transcript: text.trim(),
      timestamp: new Date().toISOString(),
    };

    // Optimistically update conversation
    setCurrentConversation((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: [...prev.messages, userMessage],
      };
    });

    try {
      const aiResult = await aiService.sendConversationTurn(
        currentConversation._id,
        text.trim(),
        level,
        mode,
        language
      );

      const assistantMessage: Message = {
        role: 'assistant',
        transcript: aiResult.response,
        hasCorrection: aiResult.hasCorrection,
        correction: aiResult.correction,
        explanation: aiResult.explanation,
        errorType: aiResult.errorType || null,
        response: aiResult.response,
        nextQuestion: aiResult.nextQuestion,
        fastPath: aiResult.fastPath,
        timestamp: new Date().toISOString(),
      };

      setCurrentConversation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, assistantMessage],
        };
      });

      // Update sidebar history snippet
      setConversations((prev) =>
        prev.map((c) =>
          c.id === currentConversation._id
            ? { ...c, lastSnippet: aiResult.response, updatedAt: new Date().toISOString() }
            : c
        )
      );

      // Voice Mode: Automatically speak structured response with natural pauses
      if (mode === 'voice') {
        const voiceSections = getVoiceSections(aiResult);
        speak(voiceSections);
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      setActiveError('I am having trouble responding right now. Please try again.');
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
    }
  }, [currentConversation, level, mode, language, speak]);

  return (
    <PracticeContext.Provider
      value={{
        currentConversation,
        conversations,
        level,
        mode,
        language,
        isSending,
        isHistoryOpen,
        activeError,
        isSpeaking,
        voiceListenTrigger,
        speak,
        stopSpeech,
        setLevel,
        setMode,
        setLanguage,
        sendMessage,
        newChat,
        loadConversation,
        deleteConversation,
        toggleHistory,
        clearError,
      }}
    >
      {children}
    </PracticeContext.Provider>
  );
};

export const usePractice = () => {
  const context = useContext(PracticeContext);
  if (!context) {
    throw new Error('usePractice must be used within a PracticeProvider');
  }
  return context;
};
