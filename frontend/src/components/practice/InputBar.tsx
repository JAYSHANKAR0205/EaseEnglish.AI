import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, Square, Volume2, AlertCircle, RefreshCw } from 'lucide-react';
import { usePractice } from '../../contexts/PracticeContext';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

export const InputBar: React.FC = () => {
  const {
    sendMessage,
    isSending,
    mode,
    activeError,
    clearError,
    isSpeaking,
    stopSpeech,
    voiceListenTrigger,
    isHistoryOpen,
  } = usePractice();
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const prevIsSending = useRef(isSending);

  const handleSpeechTranscript = useCallback((transcriptText: string) => {
    if (transcriptText.trim()) {
      sendMessage(transcriptText.trim());
    }
  }, [sendMessage]);

  const {
    state: micState,
    errorMessage: micError,
    errorInfo: micErrorInfo,
    startListening,
    stopListening,
    retryListening,
    resetState: resetMicState,
    isListening,
    isProcessing,
  } = useSpeechRecognition({
    onTranscript: handleSpeechTranscript,
  });

  // Part 1: Auto-focus keyboard after AI response finishes in Chat Mode
  useEffect(() => {
    if (prevIsSending.current && !isSending) {
      if (mode === 'chat' && !isHistoryOpen) {
        const activeEl = document.activeElement;
        const isInteractingWithOther =
          activeEl &&
          activeEl !== document.body &&
          activeEl !== inputRef.current &&
          (activeEl.tagName === 'BUTTON' ||
            activeEl.tagName === 'SELECT' ||
            activeEl.getAttribute('role') === 'dialog');

        if (!isInteractingWithOther) {
          inputRef.current?.focus({ preventScroll: true });
        }
      }
    }
    prevIsSending.current = isSending;
  }, [isSending, mode, isHistoryOpen]);

  // Parts 2 & 3: In Voice Mode, automatically start listening after AI finishes speaking
  useEffect(() => {
    if (voiceListenTrigger > 0 && mode === 'voice' && !isSending && !isSpeaking && !isHistoryOpen) {
      startListening();
    }
  }, [voiceListenTrigger, mode, isSending, isSpeaking, isHistoryOpen, startListening]);

  const prevModeRef = useRef(mode);
  // Stop microphone if user explicitly switches from voice mode to chat mode
  useEffect(() => {
    if (prevModeRef.current === 'voice' && mode === 'chat' && isListening) {
      stopListening();
    }
    prevModeRef.current = mode;
  }, [mode, isListening, stopListening]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;
    sendMessage(inputText.trim());
    setInputText('');
  };

  const handleMicClick = () => {
    if (isSpeaking) {
      stopSpeech();
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="border-t border-slate-800 bg-slate-950/90 backdrop-blur-md p-4 sm:p-5 sticky bottom-0 z-20 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="max-w-4xl mx-auto">
        {/* Error / Warning Notice Bar */}
        {(activeError || micError) && (
          <div className="mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span className="truncate sm:whitespace-normal">{activeError || micError}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {micError && micErrorInfo?.canRetry !== false && (
                <button
                  type="button"
                  onClick={() => retryListening()}
                  className="text-amber-300 hover:text-white bg-amber-500/20 hover:bg-amber-500/30 px-2 py-0.5 rounded transition text-[11px] font-semibold flex items-center gap-1 border border-amber-500/30"
                >
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  clearError();
                  resetMicState();
                }}
                className="text-amber-400/80 hover:text-white p-1 rounded transition text-[11px] font-medium"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Live Audio State Status Indicator */}
        {(isListening || isSpeaking || isProcessing) && (
          <div className="flex items-center justify-between px-3 py-1.5 mb-2 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              {isListening && (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-rose-400 font-semibold">Listening to you speak...</span>
                  <span className="text-slate-400 text-[11px] hidden sm:inline">(speak in complete sentences)</span>
                </>
              )}
              {isProcessing && (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 font-semibold">Processing your speech...</span>
                </>
              )}
              {isSpeaking && (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 font-semibold">Ease English is speaking...</span>
                </>
              )}
            </div>

            {isSpeaking && (
              <button
                onClick={stopSpeech}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition"
              >
                <Square className="w-3 h-3 fill-current" /> Stop Audio
              </button>
            )}
          </div>
        )}

        {/* Unified Input Box */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 sm:gap-3">
          {/* Microphone Button */}
          <button
            type="button"
            onClick={handleMicClick}
            disabled={isSending || isProcessing}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 ${
              isProcessing
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : isListening
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30 scale-105 animate-pulse focus:ring-rose-400'
                : micState === 'permission-denied'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 hover:border-emerald-500/40 focus:ring-emerald-500'
            }`}
            title={
              isProcessing
                ? 'Processing your speech...'
                : isListening
                ? 'Listening... Click to finish'
                : micState === 'permission-denied'
                ? 'Microphone permission blocked. Click to retry'
                : 'Click to speak'
            }
            aria-label="Microphone input"
          >
            {isListening ? (
              <Square className="w-5 h-5 fill-current" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          {/* Text Input */}
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                mode === 'voice'
                  ? 'Speak with mic or type your response here...'
                  : 'Type your message in English...'
              }
              disabled={isSending}
              className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-2xl px-4 sm:px-5 py-3.5 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="w-12 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 flex items-center justify-center transition-all duration-200 shadow-md shadow-emerald-500/20 shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-400">
          <span>
            Mode: <strong className="text-slate-300 capitalize">{mode}</strong> ({mode === 'voice' ? 'Speaks response automatically' : 'Responds in text only'})
          </span>
          <span className="hidden sm:inline">Press Enter to send</span>
        </div>
      </div>
    </div>
  );
};
