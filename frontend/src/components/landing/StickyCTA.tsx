import React, { useState, useEffect } from 'react';
import { Mic, ArrowRight } from 'lucide-react';
import { Button } from '../common/Button';

interface StickyCTAProps {
  onStartSpeaking: () => void;
  isAuthenticated: boolean;
}

export const StickyCTA: React.FC<StickyCTAProps> = ({ onStartSpeaking, isAuthenticated }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show when scrolled past 250px so it's always accessible while scrolling
      if (window.scrollY > 250) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-[env(safe-area-inset-bottom)]"
      role="region"
      aria-label="Floating Action"
    >
      <Button
        variant="primary"
        size="lg"
        onClick={onStartSpeaking}
        className="shadow-2xl shadow-emerald-500/40 border border-emerald-400/40 text-slate-950 font-bold px-6 py-3.5 rounded-2xl hover:scale-105 active:scale-95 transition-transform flex items-center gap-2"
        leftIcon={<Mic className="w-5 h-5 text-slate-950 animate-pulse" />}
        rightIcon={<ArrowRight className="w-4 h-4 text-slate-950" />}
      >
        <span className="hidden sm:inline">Start Speaking Now</span>
        <span className="sm:hidden">Practice Now</span>
      </Button>
    </div>
  );
};
