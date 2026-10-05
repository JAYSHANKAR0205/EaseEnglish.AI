import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  MessageSquare,
  Mic,
  History,
  Plus,
  LogOut,
  ChevronDown,
  Layers,
  Globe2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePractice } from '../../contexts/PracticeContext';
import { PracticeLevel, PracticeMode, LanguageOption } from '../../types/conversation';
import { Button } from '../common/Button';

export const PracticeHeader: React.FC<{ onExitToLanding: () => void }> = ({ onExitToLanding }) => {
  const { user, logout } = useAuth();
  const {
    level,
    setLevel,
    mode,
    setMode,
    language,
    setLanguage,
    newChat,
    toggleHistory,
    isSending,
  } = usePractice();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const levels: { id: PracticeLevel; label: string; desc: string }[] = [
    { id: 'beginner', label: 'Beginner', desc: 'Simple vocabulary & supportive explanations' },
    { id: 'intermediate', label: 'Intermediate', desc: 'Natural conversations & balanced depth' },
    { id: 'advanced', label: 'Advanced', desc: 'Nuanced vocabulary & complex discussions' },
  ];

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Brand & New Chat */}
      <div className="flex items-center gap-4 sm:gap-6">
        <button
          onClick={onExitToLanding}
          className="flex items-center gap-2.5 text-left group focus:outline-none"
          title="Back to Landing Page"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="hidden sm:block">
            <span className="font-extrabold text-white text-base tracking-tight block leading-tight">
              Ease English
            </span>
            <span className="text-[10px] text-emerald-400 font-medium tracking-wide uppercase">
              AI Coach
            </span>
          </div>
        </button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => newChat()}
          isLoading={isSending}
          leftIcon={<Plus className="w-4 h-4 text-emerald-400" />}
          className="text-xs"
        >
          New Chat
        </Button>
      </div>

      {/* Center Controls: Level & Mode Selectors */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Practice Level Selector */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
          {levels.map((lvl) => (
            <button
              key={lvl.id}
              onClick={() => setLevel(lvl.id)}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                level === lvl.id
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={lvl.desc}
            >
              {lvl.label}
            </button>
          ))}
        </div>

        {/* Practice Mode Selector: Chat vs Voice */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
          <button
            onClick={() => setMode('chat')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              mode === 'chat'
                ? 'bg-slate-800 text-emerald-400 font-semibold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Chat Mode: Text and voice input; AI answers in text only"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chat</span>
          </button>
          <button
            onClick={() => setMode('voice')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              mode === 'voice'
                ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Voice Mode: Spoken input with automatic voice TTS response"
          >
            <Mic className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Voice</span>
          </button>
        </div>

        {/* Language selector toggle */}
        <button
          onClick={() => setLanguage(language === 'english' ? 'hindi' : 'english')}
          className="hidden md:flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-xl transition"
          title="Switch Language Context"
        >
          <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="capitalize">{language}</span>
        </button>
      </div>

      {/* Right User Profile Menu & History toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => toggleHistory()}
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition"
          title="Conversation History"
          aria-label="Toggle Conversation History"
        >
          <History className="w-5 h-5" />
        </button>

        {/* User Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 p-1 pl-2 rounded-xl hover:bg-slate-900 border border-slate-800/80 transition"
            aria-expanded={isMenuOpen}
            aria-label="User Menu"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover border border-emerald-500/30"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-3 border-b border-slate-800">
                <p className="text-sm font-bold text-white truncate">{user?.name || 'Learner'}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    newChat();
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  New Chat
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    toggleHistory(true);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  <History className="w-4 h-4 text-slate-400" />
                  Conversation History
                </button>
              </div>

              <div className="pt-1 border-t border-slate-800">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
