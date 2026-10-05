import React from 'react';
import { Mic, Sparkles, MessageSquare, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button';

interface HeroProps {
  onStartSpeaking: () => void;
  isAuthenticated: boolean;
}

export const Hero: React.FC<HeroProps> = ({ onStartSpeaking, isAuthenticated }) => {
  return (
    <section className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="text-center relative z-10 max-w-4xl mx-auto">
        {/* Brand Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-8">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          Enterprise AI English Practice
        </div>

        {/* Hero Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
          Practice English. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            Speak naturally.
          </span> <br />
          Improve with every conversation.
        </h1>

        {/* Supporting message */}
        <p className="text-lg sm:text-xl md:text-2xl text-slate-300 font-normal max-w-2xl mx-auto leading-relaxed mb-10">
          Build confidence through natural AI-powered English conversations. Not a robotic grammar test—a real, supportive speaking partner.
        </p>

        {/* Primary CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <Button
            size="lg"
            variant="primary"
            onClick={onStartSpeaking}
            className="w-full sm:w-auto text-base px-8 py-4 shadow-xl shadow-emerald-500/30 hover:scale-[1.02] transition-transform"
            leftIcon={<Mic className="w-5 h-5 text-slate-950" />}
            rightIcon={<ArrowRight className="w-5 h-5 text-slate-950" />}
          >
            Start Speaking Now
          </Button>

          <a
            href="#why-it-works"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 px-6 py-3.5 transition"
          >
            <MessageSquare className="w-4 h-4" />
            See How It Works
          </a>
        </div>

        {/* Proof metrics / reassurance pills */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs text-slate-300 font-medium">Contextual Corrections, No Nitpicking</span>
          </div>
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <Mic className="w-5 h-5 text-teal-400 shrink-0" />
            <span className="text-xs text-slate-300 font-medium">Real-Time Voice & Text Modes</span>
          </div>
          <div className="col-span-2 md:col-span-1 flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
            <span className="text-xs text-slate-300 font-medium">Persistent MongoDB History</span>
          </div>
        </div>
      </div>
    </section>
  );
};
