import React from 'react';
import { Sparkles, CheckCircle2, HelpCircle } from 'lucide-react';

interface CorrectionCardProps {
  userSaid: string;
  correction: string;
  explanation?: string | null;
  errorType?: string | null;
}

export const CorrectionCard: React.FC<CorrectionCardProps> = ({
  userSaid,
  correction,
  explanation,
  errorType,
}) => {
  return (
    <div className="my-3 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 shadow-sm animate-in fade-in duration-300">
      <div className="flex items-center justify-between gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-emerald-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>English Improvement</span>
        </div>
        {errorType && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 capitalize tracking-normal">
            {errorType.replace(/_/g, ' ')}
          </span>
        )}
      </div>

      <div className="space-y-2.5 text-xs sm:text-sm">
        {/* You said: Clean, intact, never struck through */}
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
          <span className="font-semibold text-slate-400 min-w-[70px] shrink-0">You said:</span>
          <span className="text-slate-200 font-normal">
            {userSaid}
          </span>
        </div>

        {/* Better: Clear improved version */}
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
          <span className="font-semibold text-emerald-400 min-w-[70px] shrink-0 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline shrink-0" />
            Better:
          </span>
          <span className="text-emerald-300 font-semibold">{correction}</span>
        </div>

        {/* Why: Friendly educational explanation */}
        {explanation && (
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 pt-2 border-t border-slate-800/80 text-xs">
            <span className="font-semibold text-slate-400 min-w-[70px] shrink-0 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 inline shrink-0" />
              Why:
            </span>
            <span className="text-slate-300 italic leading-relaxed">{explanation}</span>
          </div>
        )}
      </div>
    </div>
  );
};
