import React from 'react';
import { Mic, Headphones, Brain, CheckCircle, HelpCircle, RefreshCw } from 'lucide-react';

const WORKFLOW_STEPS = [
  {
    icon: Mic,
    title: '1. You Speak or Type',
    description: 'Express your thoughts naturally in full sentences—just like talking to a colleague or friend.',
    badge: 'Natural Input'
  },
  {
    icon: Headphones,
    title: '2. AI Listens with Precision',
    description: 'Speech-to-text captures nuances, pauses, and vocabulary without interrupting your thought process.',
    badge: 'STT & Quality Check'
  },
  {
    icon: Brain,
    title: '3. AI Understands Context',
    description: 'Remembers what you said three turns ago. Tracks your job, goals, and conversational background.',
    badge: 'Context Awareness'
  },
  {
    icon: CheckCircle,
    title: '4. Targeted English Correction',
    description: 'Only catches meaningful mistakes (tense, duration, prepositions). Never penalizes already-correct sentences.',
    badge: 'Educational Feedback'
  },
  {
    icon: HelpCircle,
    title: '5. Short & Clear Explanation',
    description: 'A single concise rule explains why the correction was made so you learn without overwhelming grammar jargon.',
    badge: 'Zero Jargon'
  },
  {
    icon: RefreshCw,
    title: '6. ONE Relevant Follow-Up',
    description: 'Deepens the dialogue with exactly one intelligent question that moves your story forward.',
    badge: 'Dynamic Dialogue'
  },
];

export const WhyItWorks: React.FC = () => {
  return (
    <section id="why-it-works" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-3">
          Methodology
        </h2>
        <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
          Why Natural Conversation Outperforms Grammar Drills
        </p>
        <p className="text-base text-slate-400 leading-relaxed">
          Traditional apps force you to fill in multiple-choice blanks. Ease English immerses you in active verbal dialogue, activating the language centers of your brain through immediate feedback.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {WORKFLOW_STEPS.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              className="relative p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-900 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1 rounded-md bg-slate-800">
                  {step.badge}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">{step.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
