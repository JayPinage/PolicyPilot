import React from 'react';
import { FileText, Bookmark } from 'lucide-react';
import { Citation } from '../../types/chat';

interface CitationCardProps {
  citation: Citation;
}

export const CitationCard: React.FC<CitationCardProps> = ({ citation }) => {
  return (
    <div className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 rounded-lg text-xs text-slate-700 transition-colors shadow-xs">
      <div className="p-1 rounded bg-sky-100 text-sky-700 shrink-0">
        <FileText className="w-3.5 h-3.5" />
      </div>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="font-medium text-slate-800 truncate max-w-[200px]" title={citation.source}>
          {citation.source}
        </span>
        <span className="text-slate-300">•</span>
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-200/70 text-[11px] font-semibold text-slate-700 shrink-0">
          <Bookmark className="w-2.5 h-2.5 text-slate-500" />
          Page {citation.page}
        </span>
      </div>
    </div>
  );
};

export const CitationGroup: React.FC<{ citations: Citation[] }> = ({ citations }) => {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-slate-100">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
        <span>Verified Sources & Citations</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {citations.map((c, idx) => (
          <CitationCard key={`${c.source}-${c.page}-${idx}`} citation={c} />
        ))}
      </div>
    </div>
  );
};
