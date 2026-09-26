import React, { useState, useRef, useEffect, memo } from 'react';
import {
  Send,
  Sparkles,
  X,
  CornerDownLeft,
  Zap,
  SlidersHorizontal,
  ChevronDown,
  Globe,
  Gauge,
  Layers,
} from 'lucide-react';
import { SmartPromptOptions } from '../model/types';

interface ChatInputProps {
  onSend: (text: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  activeChapterName?: string;
  promptOptions?: SmartPromptOptions;
  onChangeOptions?: (opts: Partial<SmartPromptOptions>) => void;
}

const SMART_QUICK_ACTIONS: {
  id: string;
  label: string;
  getPrompt: (ch?: string) => string;
}[] = [
  {
    id: 'concept',
    label: '📘 Explain Concept',
    getPrompt: (ch) =>
      `Explain ${ch || 'this concept'} in simple language from fundamentals to board level with NCERT backing`,
  },
  {
    id: 'memory_tricks',
    label: '🧠 Memory Tricks',
    getPrompt: (ch) =>
      `Provide memory tricks, mnemonics, and mental models to easily remember all formulas and exceptions in ${ch || 'this chapter'}`,
  },
  {
    id: 'revision_notes',
    label: '📝 Revision Notes',
    getPrompt: (ch) =>
      `Create structured, high-yield CBSE Class 12 revision notes and key summary points for ${ch || 'this chapter'}`,
  },
  {
    id: 'ncert_summary',
    label: '📄 NCERT Summary',
    getPrompt: (ch) =>
      `Deliver authentic NCERT textbook summary with core definitions, in-text citations, and key points to remember for ${ch || 'this chapter'}`,
  },
  {
    id: 'board_questions',
    label: '🎯 Board Questions',
    getPrompt: (ch) =>
      `Predict top expected 2, 3, and 5-mark CBSE Board questions with official marking scheme for ${ch || 'this chapter'}`,
  },
  {
    id: 'pyqs',
    label: '❓ PYQs',
    getPrompt: (ch) =>
      `Detail the most repeated CBSE Class 12 Previous Year Questions (PYQs) from Delhi & All India with step marks for ${ch || 'this chapter'}`,
  },
  {
    id: 'numericals',
    label: '🧮 Numericals',
    getPrompt: (ch) =>
      `Provide essential numerical practice problems for ${ch || 'this chapter'} with step-by-step formula substitutions and SI units`,
  },
  {
    id: 'formula_sheet',
    label: '📚 Formula Sheet',
    getPrompt: (ch) =>
      `Compile the master CBSE formula sheet for ${ch || 'this chapter'} with symbols, units, dimensions, and sign conventions`,
  },
  {
    id: 'one_shot',
    label: '⚡ One Shot Revision',
    getPrompt: (ch) =>
      `Provide an intensive, high-impact one shot board exam revision guide for ${ch || 'this chapter'}`,
  },
  {
    id: 'topper_strategy',
    label: '🏆 Topper Strategy',
    getPrompt: (ch) =>
      `Explain 95%+ topper exam presentation strategies, common pitfall traps, and scoring tips for ${ch || 'this chapter'}`,
  },
  {
    id: 'competency',
    label: '🧩 Competency Questions',
    getPrompt: (ch) =>
      `Construct authentic CBSE competency-based case studies, passage questions, and assertion-reason drills for ${ch || 'this chapter'}`,
  },
];

export const ChatInputComponent: React.FC<ChatInputProps> = ({
  onSend,
  isLoading,
  disabled,
  activeChapterName,
  promptOptions,
  onChangeOptions,
}) => {
  const [input, setInput] = useState('');
  const [showOptionsBar, setShowOptionsBar] = useState(false);
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

  const handleChipClick = (action: typeof SMART_QUICK_ACTIONS[0]) => {
    if (isLoading || disabled) return;

    if (input.trim()) {
      // Append chip action to current doubt
      onSend(`${input.trim()} • ${action.label}`);
      setInput('');
    } else {
      // Generate prompt for active chapter using optimized template
      const generated = action.getPrompt(activeChapterName);
      onSend(generated);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [input]);

  return (
    <div className="w-full space-y-2 max-w-4xl mx-auto">
      {/* 1. SMART QUICK ACTIONS CHIPS (Arc / Notion styled horizontal scroll) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-1">
        <span className="text-[10px] uppercase font-bold text-muted-foreground shrink-0 flex items-center gap-1 pr-1">
          <Zap className="w-3 h-3 text-purple-500 fill-purple-500" />
          <span>Quick Actions:</span>
        </span>
        {SMART_QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => handleChipClick(action)}
            disabled={isLoading || disabled}
            className="text-[11px] font-semibold text-muted-foreground hover:text-purple-600 dark:hover:text-purple-300 bg-slate-100/90 dark:bg-slate-800/90 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:border-purple-300 dark:hover:border-purple-800/60 px-3 py-1 rounded-full border border-slate-200/80 dark:border-slate-700/60 transition-all shrink-0 cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* 2. SMART PROMPT OPTIONS (Level, Depth, Language toggles) */}
      {promptOptions && onChangeOptions && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Level Selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200/80 dark:border-white/10 text-[11px]">
              <span className="text-muted-foreground pl-1.5 pr-0.5 font-bold text-[10px] flex items-center gap-1">
                <Gauge className="w-3 h-3 text-blue-500" />
                <span>Level:</span>
              </span>
              {(['Explain Like Beginner', 'Board Level', 'Topper Level'] as const).map(
                (lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => onChangeOptions({ level: lvl })}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                      promptOptions.level === lvl
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {lvl === 'Explain Like Beginner' ? 'Beginner' : lvl === 'Board Level' ? 'Board' : 'Topper'}
                  </button>
                )
              )}
            </div>

            {/* Depth Selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200/80 dark:border-white/10 text-[11px]">
              <span className="text-muted-foreground pl-1.5 pr-0.5 font-bold text-[10px] flex items-center gap-1">
                <Layers className="w-3 h-3 text-indigo-500" />
                <span>Depth:</span>
              </span>
              {(['Default', 'Very Detailed', 'Very Short'] as const).map(
                (dp) => (
                  <button
                    key={dp}
                    type="button"
                    onClick={() => onChangeOptions({ depth: dp })}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                      promptOptions.depth === dp
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {dp === 'Very Detailed' ? 'Detailed' : dp === 'Very Short' ? 'Short' : 'Balanced'}
                  </button>
                )
              )}
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200/80 dark:border-white/10 text-[11px]">
              <span className="text-muted-foreground pl-1.5 pr-0.5 font-bold text-[10px] flex items-center gap-1">
                <Globe className="w-3 h-3 text-emerald-500" />
                <span>Lang:</span>
              </span>
              {(['Auto', 'English', 'Hindi', 'Hinglish'] as const).map(
                (lng) => (
                  <button
                    key={lng}
                    type="button"
                    onClick={() => onChangeOptions({ language: lng })}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                      promptOptions.language === lng
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {lng}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Input Dock (ChatGPT + Notion sleek card with glassmorphism) */}
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
            placeholder={
              activeChapterName
                ? `Ask about ${activeChapterName} (e.g. 'Explain derivations' or 'Top 5 numericals')...`
                : "Ask any concept or doubt (e.g. 'Explain Electrochemistry' or 'Gauss Law derivations')..."
            }
            className="w-full resize-none bg-transparent px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden max-h-32 leading-relaxed font-sans"
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
          <CornerDownLeft className="w-3 h-3 opacity-60" /> Press{' '}
          <strong>Enter</strong> to generate, <strong>Shift + Enter</strong> for
          new line
        </span>
        <span className="text-right ml-auto">
          Rankify AI Study Coach • 0ms Local Synthesis • Zero API calls
        </span>
      </div>
    </div>
  );
};

export const ChatInput = memo(ChatInputComponent);
