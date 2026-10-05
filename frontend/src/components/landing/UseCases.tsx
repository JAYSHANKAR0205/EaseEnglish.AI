import React from 'react';
import { Briefcase, UserCheck, MessageCircle, Award, Coffee, Sparkles } from 'lucide-react';

export interface UseCaseItem {
  id: string;
  icon: any;
  title: string;
  subtitle: string;
  description: string;
  examplePrompt: string;
}

export const USE_CASES_DATA: UseCaseItem[] = [
  {
    id: 'daily-practice',
    icon: Coffee,
    title: 'Daily English Practice',
    subtitle: 'Everyday Fluency',
    description: 'Talk casually about your weekend, daily routines, movies, or hobbies. Build seamless speaking stamina without pressure.',
    examplePrompt: '"Tell me about what you cooked for dinner yesterday."',
  },
  {
    id: 'workplace-english',
    icon: Briefcase,
    title: 'Workplace English',
    subtitle: 'Professional Presence',
    description: 'Practice standup updates, client meetings, technical architecture debates, and cross-functional collaboration dialogues.',
    examplePrompt: '"Could you walk me through your engineering roadmap?"',
  },
  {
    id: 'interview-prep',
    icon: UserCheck,
    title: 'Interview Preparation',
    subtitle: 'High-Stakes Scenarios',
    description: 'Prepare behavioral responses, explain complex technical projects, and tackle tricky follow-up questions confidently.',
    examplePrompt: '"Describe a disagreement you had with a team member and how you resolved it."',
  },
  {
    id: 'professional-comm',
    icon: Award,
    title: 'Professional Communication',
    subtitle: 'Leadership & Nuance',
    description: 'Master diplomatic phrasing, executive summaries, strategic reasoning, and polished business presentations.',
    examplePrompt: '"How would you pitch this restructuring proposal to leadership?"',
  },
  {
    id: 'confidence-building',
    icon: Sparkles,
    title: 'Confidence Building',
    subtitle: 'Overcome Speaking Anxiety',
    description: 'A completely judgment-free space to speak aloud, make mistakes, and overcome hesitation through encouraging reinforcement.',
    examplePrompt: '"Take your time; try expressing that idea in your own words."',
  },
  {
    id: 'conversation-practice',
    icon: MessageCircle,
    title: 'Conversation Practice',
    subtitle: 'Storytelling & Flow',
    description: 'Learn how to keep a dialogue moving, handle rapid topic changes, and speak without pauses or internal translation delays.',
    examplePrompt: '"What surprised you most about that travel destination?"',
  },
];

export const UseCases: React.FC = () => {
  return (
    <section id="use-cases" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-3">
          Adaptability
        </h2>
        <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
          Tailored For Every Stage of Your Life & Career
        </p>
        <p className="text-base text-slate-400 leading-relaxed">
          Whether you are preparing for an overseas tech interview or just want to chat smoothly with international peers, Ease English adapts instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {USE_CASES_DATA.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/30 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-emerald-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">{item.title}</h3>
                    <span className="text-xs text-slate-400">{item.subtitle}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">{item.description}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
                <span className="text-[11px] font-semibold text-emerald-400 block mb-1">Coach Follow-up Example:</span>
                <span className="text-slate-300 italic">{item.examplePrompt}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
