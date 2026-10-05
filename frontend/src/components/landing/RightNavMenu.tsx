import React, { useEffect } from 'react';
import { X, ArrowRight, Sparkles, BookOpen, Compass, Globe, Newspaper } from 'lucide-react';
import { Button } from '../common/Button';

interface RightNavMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onStartSpeaking: () => void;
  isAuthenticated: boolean;
}

export const RightNavMenu: React.FC<RightNavMenuProps> = ({
  isOpen,
  onClose,
  onStartSpeaking,
  isAuthenticated,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navLinks = [
    { href: '#why-it-works', label: 'Why It Works', icon: Compass, desc: 'Conversation workflow and methodology' },
    { href: '#use-cases', label: 'Use Cases', icon: BookOpen, desc: 'Workplace, interviews, and daily fluency' },
    { href: '#languages', label: 'Languages', icon: Globe, desc: 'English & Hindi support architecture' },
    { href: '#news', label: 'News & Insights', icon: Newspaper, desc: 'Latest articles and pedagogy updates' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className="w-screen max-w-sm bg-slate-900 border-l border-slate-800 shadow-2xl p-6 flex flex-col justify-between"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
        >
          <div>
            <div className="flex items-center justify-between pb-6 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-white text-lg tracking-tight">Ease English</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Links */}
            <nav className="mt-8 space-y-3">
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-slate-800/80 transition group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300 group-hover:text-emerald-400 group-hover:border-emerald-500/30 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors block">
                        {item.label}
                      </span>
                      <span className="text-xs text-slate-400 leading-snug block">
                        {item.desc}
                      </span>
                    </div>
                  </a>
                );
              })}
            </nav>
          </div>

          {/* Bottom CTA */}
          <div className="pt-6 border-t border-slate-800">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => {
                onClose();
                onStartSpeaking();
              }}
            >
              {isAuthenticated ? 'Open Practice Workspace' : 'Start Speaking Now'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
