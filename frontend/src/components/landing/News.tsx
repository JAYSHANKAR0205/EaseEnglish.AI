import React from 'react';
import { Newspaper, Calendar, ExternalLink } from 'lucide-react';

export interface NewsArticle {
  id: string;
  title: string;
  category: string;
  summary: string;
  date: string;
  readTime: string;
}

export const LATEST_NEWS_DATA: NewsArticle[] = [
  {
    id: 'news-1',
    title: 'The Shift from Memorization to Active Conversational AI Practice',
    category: 'Product & Pedagogy',
    summary: 'Why interactive verbal dialogue produces 3.4x faster vocabulary retention than traditional flashcards and multiple-choice drills.',
    date: 'Sep 2026',
    readTime: '3 min read',
  },
  {
    id: 'news-2',
    title: 'Engineered for Global Professionals: Overcoming English Speaking Hesitation',
    category: 'Workplace Fluency',
    summary: 'A look at how contextual AI feedback helps engineers and business leaders articulate nuanced ideas with poise.',
    date: 'Sep 2026',
    readTime: '4 min read',
  },
  {
    id: 'news-3',
    title: 'Precision Correction: Why "Good Enough" English Deserves Encouragement',
    category: 'AI Architecture',
    summary: 'How our Fast Path and Fallback pipeline avoids nitpicking correct English and focuses solely on high-value mistakes.',
    date: 'Sep 2026',
    readTime: '5 min read',
  },
];

export const News: React.FC = () => {
  return (
    <section id="news" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
        <div>
          <h2 className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-3">
            Updates & Insights
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Latest from Ease English
          </p>
        </div>
        <p className="text-sm text-slate-400 max-w-md mt-4 md:mt-0">
          Pedagogical research, engineering breakthroughs, and tips for speaking with natural executive clarity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {LATEST_NEWS_DATA.map((article) => (
          <article
            key={article.id}
            className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                <span className="font-semibold text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  {article.category}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {article.date}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-100 group-hover:text-emerald-400 transition-colors mb-3 leading-snug">
                {article.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                {article.summary}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-xs text-slate-400">
              <span>{article.readTime}</span>
              <span className="inline-flex items-center gap-1 text-emerald-400 font-medium group-hover:translate-x-0.5 transition-transform">
                Read insight <ExternalLink className="w-3 h-3" />
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
