import React from 'react';
import { Globe2, Check } from 'lucide-react';
import { LanguageOption } from '../../types/conversation';

export interface SupportedLanguage {
  code: LanguageOption;
  name: string;
  nativeName: string;
  description: string;
  sampleGreeting: string;
  active: boolean;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  {
    code: 'english',
    name: 'English',
    nativeName: 'English (Global)',
    description: 'Practice natural American, British, or International English with conversational corrections and contextual follow-ups.',
    sampleGreeting: '"Hello! How is your day going so far?"',
    active: true,
  },
  {
    code: 'hindi',
    name: 'Hindi Support',
    nativeName: 'हिन्दी सहायता',
    description: 'Speak in Hinglish or switch comfortably; Ease English understands bilingual context and guides you into fluent English.',
    sampleGreeting: '"नमस्ते! आज आप किस विषय पर अभ्यास करना चाहेंगे?"',
    active: true,
  },
];

export const Languages: React.FC = () => {
  return (
    <section id="languages" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-3">
          Language Architecture
        </h2>
        <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
          Focused First on English & Hindi
        </p>
        <p className="text-base text-slate-400 leading-relaxed">
          Engineered with an extensible multi-language schema. Designed to eliminate hesitation for bilingual speakers making the leap to full English fluency.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <div
            key={lang.code}
            className="p-8 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 transition-all duration-200 relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Globe2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-100">{lang.name}</h3>
                  <span className="text-xs font-medium text-emerald-400">{lang.nativeName}</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                <Check className="w-3 h-3" /> Ready
              </span>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed mb-6">{lang.description}</p>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400">
              <span className="font-medium text-slate-300 block mb-1">Greeting Tone:</span>
              <span className="italic">{lang.sampleGreeting}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
