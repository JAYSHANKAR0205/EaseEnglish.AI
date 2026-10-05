import React, { useEffect, useRef } from 'react';
import { Sparkles, User, HelpCircle, Volume2, VolumeX } from 'lucide-react';
import { usePractice } from '../../contexts/PracticeContext';
import { useAuth } from '../../contexts/AuthContext';
import { CorrectionCard } from './CorrectionCard';
import { getVoiceSections } from '../../utils/speechUtils';
import { Message } from '../../types/conversation';

export const ConversationArea: React.FC = () => {
  const { currentConversation, isSending, mode, speak, stopSpeech, isSpeaking } = usePractice();
  const { user } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = currentConversation?.messages || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSpeakMessage = (msg: Message) => {
    if (isSpeaking) {
      stopSpeech();
    } else {
      const sections = getVoiceSections(msg);
      speak(sections.length > 0 ? sections : (msg.response || msg.transcript));
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 max-w-4xl mx-auto w-full">
      {messages.map((msg, index) => {
        const isUser = msg.role === 'user';
        const prevMsg = index > 0 ? messages[index - 1] : null;
        const userSaidText = prevMsg && prevMsg.role === 'user' ? prevMsg.transcript : '';

        return (
          <div
            key={msg._id || index}
            className={`flex items-start gap-3 sm:gap-4 animate-in fade-in duration-300 ${
              isUser ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div className="shrink-0 mt-1">
              {isUser ? (
                user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="You"
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-emerald-500/40"
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs border border-emerald-500/30">
                    <User className="w-4 h-4" />
                  </div>
                )
              ) : (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-slate-950 font-bold flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Sparkles className="w-4 h-4 text-slate-950" />
                </div>
              )}
            </div>

            {/* Message Bubble Content */}
            <div className={`max-w-[85%] sm:max-w-[78%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              <span className="text-[11px] font-semibold text-slate-400 mb-1 px-1">
                {isUser ? 'You' : 'Ease English'}
              </span>

              <div
                className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-tr-none shadow-md shadow-emerald-900/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none shadow-xl'
                }`}
              >
                {/* Assistant Message Content */}
                {!isUser && (
                  <div>
                    {/* Correction Card: ONLY when hasCorrection is true */}
                    {msg.hasCorrection && msg.correction && (
                      <CorrectionCard
                        userSaid={userSaidText || 'Your sentence'}
                        correction={msg.correction}
                        explanation={msg.explanation}
                        errorType={msg.errorType}
                      />
                    )}

                    {/* Main Conversational Response */}
                    <p className="text-slate-200">{msg.response || msg.transcript}</p>

                    {/* ONE Relevant Follow-Up Question Container */}
                    {msg.nextQuestion && (
                      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-start gap-2.5 bg-emerald-500/5 -mx-4 -mb-4 p-3.5 rounded-b-2xl border-emerald-500/10">
                        <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block mb-0.5">
                            Follow-Up Question
                          </span>
                          <span className="text-emerald-100 font-medium text-xs sm:text-sm">
                            {msg.nextQuestion}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Manual audio speak icon for Chat Mode accessibility */}
                    <div className="flex items-center justify-end mt-2 pt-1">
                      <button
                        onClick={() => handleSpeakMessage(msg)}
                        className="text-slate-400 hover:text-emerald-400 p-1 rounded-lg transition"
                        title="Listen to AI voice"
                      >
                        {isSpeaking ? (
                          <VolumeX className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* User Message Content */}
                {isUser && <p>{msg.transcript}</p>}
              </div>

              <span className="text-[10px] text-slate-400 mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        );
      })}

      {/* AI Typing / Processing Indicator */}
      {isSending && (
        <div className="flex items-start gap-3 sm:gap-4 animate-in fade-in duration-200">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-slate-950">
            <Sparkles className="w-4 h-4 text-slate-950 animate-spin" />
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl rounded-tl-none text-xs text-slate-400 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Ease English is listening & formulating response...</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
