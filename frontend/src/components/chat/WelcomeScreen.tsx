import React from 'react';
import { ShieldCheck, FileCheck, BookmarkCheck, Sparkles, ArrowRight } from 'lucide-react';

interface WelcomeScreenProps {
  onSelectPrompt: (prompt: string) => void;
}

const SUGGESTED_QUESTIONS = [
  {
    title: 'Leave & Absence Policy',
    prompt: 'What are the rules regarding annual leave and loss of pay when leave entitlement is exhausted?',
  },
  {
    title: 'Remote & Hybrid Work',
    prompt: 'What is the company policy regarding working from home and remote work expectations?',
  },
  {
    title: 'Health & Wellness Benefits',
    prompt: 'What medical insurance coverage and employee wellness benefits are provided?',
  },
  {
    title: 'Working Hours & Overtime',
    prompt: 'What are the official core working hours and the policy on overtime compensation?',
  },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectPrompt }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 max-w-3xl mx-auto w-full text-center">
      {/* Badge & Icon */}
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-100 text-sky-600 mb-5 shadow-xs border border-sky-200/60">
        <Sparkles className="w-7 h-7" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
        Welcome to PolicyPilot AI
      </h1>
      <p className="mt-2 text-sm text-slate-600 max-w-lg leading-relaxed">
        Your dedicated AI policy assistant. Ask questions about your company’s HR policies,
        benefits, code of conduct, and leave entitlement with strict page-numbered citations.
      </p>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mt-6 text-left">
        <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center gap-2 text-sky-600 mb-1">
            <FileCheck className="w-4 h-4" />
            <span className="text-xs font-semibold text-slate-800">Company Grounded</span>
          </div>
          <p className="text-xs text-slate-500">
            Every response is strictly synthesized from verified company documents.
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <BookmarkCheck className="w-4 h-4" />
            <span className="text-xs font-semibold text-slate-800">Source Citations</span>
          </div>
          <p className="text-xs text-slate-500">
            Document names and exact page numbers are attached to answers.
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-semibold text-slate-800">AI Guardrails</span>
          </div>
          <p className="text-xs text-slate-500">
            Answers are verified against strict safety and hallucination guardrails.
          </p>
        </div>
      </div>

      {/* Suggested Questions */}
      <div className="w-full mt-8 text-left">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Suggested Questions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {SUGGESTED_QUESTIONS.map((item, index) => (
            <button
              key={index}
              onClick={() => onSelectPrompt(item.prompt)}
              className="flex items-start justify-between gap-3 p-3.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all text-left group shadow-xs cursor-pointer"
            >
              <div>
                <h4 className="text-xs font-semibold text-slate-800 group-hover:text-sky-600 transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {item.prompt}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
