import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X, CornerDownLeft } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

const QUICK_CHIPS = [
  'Explain Electrochemistry',
  'Explain Electric Charges and Fields',
  'Explain Integrals',
  'Explain Chemical Kinetics',
  'Explain Solutions',
  'Explain Ray Optics',
];

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading, disabled }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading || disabled) return;
    onSend(input);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChipClick = (chipText: string) => {
    if (isLoading || disabled) return;
    onSend(chipText);
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  return (
    <div className="w-full space-y-2 max-w-4xl mx-auto">
      {/* Quick Chips Horizontal Scroll */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1">
        <span className="text-[10px] uppercase font-bold text-muted-foreground shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-purple-500" />
          <span>Quick:</span>
        </span>
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => handleChipClick(chip)}
            disabled={isLoading || disabled}
            className="text-[11px] font-semibold text-muted-foreground hover:text-foreground bg-slate-100/80 dark:bg-slate-800/80 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:border-purple-300 dark:hover:border-purple-800/60 px-3 py-1 rounded-full border border-slate-200/80 dark:border-slate-700/60 transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Main Input Dock */}
      <form
        onSubmit={handleSubmit}
        className="relative flex items-end gap-2 p-2 sm:p-2.5 rounded-2xl bg-card border border-slate-200/80 dark:border-white/10 shadow-lg focus-within:border-purple-500/80 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all"
      >
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || disabled}
            placeholder="Ask any concept (e.g. 'Explain Electrochemistry' or 'Gauss Law derivations')..."
            className="w-full resize-none bg-transparent px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden max-h-32 leading-relaxed"
          />
        </div>

        {input && (
          <button
            type="button"
            onClick={() => setInput('')}
            className="p-2 text-muted-foreground hover:text-foreground rounded-xl transition cursor-pointer"
            title="Clear"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <button
          type="submit"
          disabled={!input.trim() || isLoading || disabled}
          className="h-10 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md hover:from-purple-500 hover:to-indigo-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Generate Prompt</span>
              <Send className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground px-2">
        <span className="hidden sm:inline-flex items-center gap-1">
          <CornerDownLeft className="w-3 h-3 opacity-60" /> Press <strong>Enter</strong> to generate, <strong>Shift + Enter</strong> for new line
        </span>
        <span className="text-right ml-auto">
          Generates CBSE Class 12 structured prompt • Zero external APIs
        </span>
      </div>
    </div>
  );
};
