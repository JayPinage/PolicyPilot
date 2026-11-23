import React, { useState, useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onStopStreaming?: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStopStreaming,
  isStreaming,
  disabled = false,
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea as text grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isStreaming || disabled) return;

    const message = input.trim();
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    onSendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-4 bg-white border-t border-slate-200/90 shadow-subtle">
      <div className="max-w-3xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-end gap-2 bg-slate-50 border border-slate-300 rounded-2xl p-2 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100 transition-all shadow-xs"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isStreaming}
            placeholder={
              isStreaming
                ? 'PolicyPilot is generating a response...'
                : 'Ask a question about company policies (e.g., leave, benefits, working hours)...'
            }
            className="w-full resize-none bg-transparent px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none disabled:opacity-60 max-h-44 leading-relaxed"
          />

          <div className="flex items-center gap-1.5 pb-1 pr-1">
            {isStreaming ? (
              <button
                type="button"
                onClick={onStopStreaming}
                className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-900 text-white transition-colors cursor-pointer shadow-xs"
                title="Stop response"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() || disabled}
                className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 text-white disabled:text-slate-400 transition-all cursor-pointer disabled:cursor-not-allowed shadow-xs"
                title="Send message (Enter)"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </form>

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span>Answers are grounded directly in uploaded company policy manuals.</span>
          <span className="hidden sm:inline-flex items-center gap-1 text-slate-400">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px]">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px]">Shift+Enter</kbd> for new line
          </span>
        </div>
      </div>
    </div>
  );
};
