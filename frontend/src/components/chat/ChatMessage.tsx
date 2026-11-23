import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { User as UserIcon, Bot, Copy, Check, Sparkles } from 'lucide-react';
import { Message } from '../../types/chat';
import { parseCitations } from '../../utils/citations';
import { formatDateTime } from '../../utils/date';
import { CitationGroup } from './CitationCard';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isStreaming = false }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const { text, citations } = isUser
    ? { text: message.content, citations: [] }
    : parseCitations(message.content);

  // Normalize <br> to self-closing <br /> for rehype-raw without inserting table-breaking newlines
  const processedText = text.replace(/<br\s*\/?>/gi, '<br />');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  return (
    <div
      className={`py-5 px-4 md:px-6 transition-colors ${
        isUser ? 'bg-transparent' : 'bg-slate-50/70 border-y border-slate-100'
      }`}
    >
      <div className="max-w-3xl mx-auto flex gap-4">
        {/* Avatar */}
        <div className="shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-semibold text-xs shadow-xs">
              <UserIcon className="w-4 h-4 text-slate-600" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-semibold text-xs shadow-xs shadow-sky-600/30">
              <Bot className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-800">
                {isUser ? 'You' : 'PolicyPilot Assistant'}
              </span>
              {!isUser && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium bg-sky-100/80 text-sky-700">
                  <Sparkles className="w-2.5 h-2.5" />
                  AI Verified
                </span>
              )}
              {message.created_at && (
                <span className="text-[11px] text-slate-400">
                  {formatDateTime(message.created_at)}
                </span>
              )}
            </div>

            {!isUser && !isStreaming && (
              <button
                type="button"
                onClick={handleCopy}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-md hover:bg-slate-200/50 flex items-center gap-1 text-[11px]"
                title="Copy answer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Formatted Markdown Content without raw *, |, or <br> */}
          <div className="text-sm text-slate-800 leading-relaxed break-words">
            {isUser ? (
              <p className="whitespace-pre-wrap">{text}</p>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  // Render markdown tables cleanly
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-3 border border-slate-200 rounded-xl shadow-xs bg-white">
                      <table className="w-full text-xs text-left border-collapse">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[11px] tracking-wider">
                      {children}
                    </thead>
                  ),
                  th: ({ children }) => (
                    <th className="py-2.5 px-3.5 border-r border-slate-200 last:border-r-0 font-semibold text-slate-800">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="py-2.5 px-3.5 border-t border-slate-200 border-r last:border-r-0 text-slate-700 align-top leading-relaxed">
                      {children}
                    </td>
                  ),
                  tr: ({ children }) => (
                    <tr className="even:bg-slate-50/50 hover:bg-slate-50/80 transition-colors">
                      {children}
                    </tr>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-slate-900">{children}</strong>
                  ),
                  p: ({ children }) => (
                    <p className="my-1.5 leading-relaxed">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                  ),
                }}
              >
                {processedText}
              </ReactMarkdown>
            )}

            {isStreaming && (
              <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-sky-600 animate-pulse" />
            )}
          </div>

          {/* Source Citations */}
          {!isUser && citations.length > 0 && <CitationGroup citations={citations} />}
        </div>
      </div>
    </div>
  );
};
