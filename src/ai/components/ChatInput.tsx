import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
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
  Mic,
  MicOff,
  Paperclip,
  Image as ImageIcon,
  FileText,
  BookOpen,
  HelpCircle,
  Brain,
  FileCode,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import { SmartPromptOptions } from '../model/types';
import toast from 'react-hot-toast';
import { isTourActive } from '@/features/tour/tourReadOnlyGate';

interface ChatInputProps {
  onSend: (text: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  activeChapterName?: string;
  promptOptions?: SmartPromptOptions;
  onChangeOptions?: (opts: Partial<SmartPromptOptions>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

const QUICK_PROMPT_CHIPS = [
  {
    id: 'tutor',
    label: '🎓 Tutor',
    prompt: (ch?: string) =>
      `Act as my AI Tutor and explain ${ch || 'this concept'} step by step from fundamentals to board level`,
  },
  {
    id: 'revision',
    label: '⚡ Revision',
    prompt: (ch?: string) =>
      `Provide a high-impact one shot revision guide for ${ch || 'this chapter'}`,
  },
  {
    id: 'formula',
    label: '📚 Formula',
    prompt: (ch?: string) =>
      `Compile complete formula sheet with SI units & dimensions for ${ch || 'this chapter'}`,
  },
  {
    id: 'ncert',
    label: '📄 NCERT',
    prompt: (ch?: string) =>
      `Provide authentic NCERT textbook summary with core definitions and in-text solutions for ${ch || 'this chapter'}`,
  },
  {
    id: 'questions',
    label: '🎯 Questions',
    prompt: (ch?: string) =>
      `Predict top expected 2, 3, and 5-mark CBSE Board questions for ${ch || 'this chapter'}`,
  },
  {
    id: 'notes',
    label: '📝 Notes',
    prompt: (ch?: string) =>
      `Generate high-yield short revision notes with key definitions and bullet points for ${ch || 'this chapter'}`,
  },
  {
    id: 'summary',
    label: '📖 Summary',
    prompt: (ch?: string) =>
      `Summarize ${ch || 'this chapter'} into 5 core concepts and key derivations`,
  },
  {
    id: 'exam',
    label: '🏆 Exam',
    prompt: (ch?: string) =>
      `Detail repeated CBSE Previous Year Questions (PYQs) with official marking scheme for ${ch || 'this chapter'}`,
  },
  {
    id: 'planner',
    label: '📅 Planner',
    prompt: (ch?: string) =>
      `Create a structured 7-day CBSE Board mastery sprint plan for ${ch || 'this chapter'}`,
  },
  {
    id: 'weakness',
    label: '🔥 Weakness',
    prompt: (ch?: string) =>
      `Analyze common student misconceptions, exam traps, and numerical pitfalls in ${ch || 'this chapter'}`,
  },
];

const INTELLIGENT_PLACEHOLDERS = [
  'Explain Electrochemistry...',
  'Create Revision Notes...',
  'Generate 30 PYQs...',
  'Solve this Numerical...',
  'Teach me Current Electricity...',
  'Make a Study Plan...',
];

export const ChatInputComponent: React.FC<ChatInputProps> = ({
  onSend,
  isLoading,
  disabled,
  activeChapterName,
  promptOptions,
  onChangeOptions,
  onFocus,
  onBlur,
}) => {
  const [input, setInput] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string; type: string } | null>(null);
  const [showOptionsBar, setShowOptionsBar] = useState(false);
  const speechRecognitionSupported =
    typeof window !== 'undefined' &&
    Boolean(
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
        (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
    );

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Rotating placeholder interval
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % INTELLIGENT_PLACEHOLDERS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Auto-resize textarea dynamically: grows up to ~4 lines (approx 120px) then scrolls inside itself
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      // 4 lines at 1.5 line-height of 16px is approx 96px-120px
      const newHeight = Math.min(Math.max(scrollH, 56), 128);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isTourActive()) return;
    const trimmed = input.trim();
    if (!trimmed || isLoading || disabled) return;

    let finalPrompt = trimmed;
    if (attachedFile) {
      finalPrompt += `\n[Attached File: ${attachedFile.name} (${attachedFile.size})]`;
    }

    onSend(finalPrompt);
    setInput('');
    setAttachedFile(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isTourActive()) return;
    // Check if device has fine pointer / physical keyboard support
    const isTouchOnly =
      typeof window !== 'undefined' &&
      window.matchMedia('(hover: none) and (pointer: coarse)').matches;

    // On touch devices, Enter creates a new line; only send via the send button
    if (isTouchOnly) {
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChipClick = (chip: typeof QUICK_PROMPT_CHIPS[0]) => {
    if (isTourActive() || isLoading || disabled) return;
    const generated = chip.prompt(activeChapterName);
    setInput(generated);
    if (textareaRef.current && !isTourActive()) {
      textareaRef.current.focus();
    }
  };

  // Voice Input Toggle via Web Speech Recognition
  const toggleVoiceInput = useCallback(() => {
    if (isTourActive()) return;
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error('Voice input is not supported in this browser. Please type your prompt.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        toast.success('Listening... Speak your question now.');
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInput(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      toast.error('Could not initialize voice input.');
      setIsRecording(false);
    }
  }, [isRecording]);

  // File Attachment Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isTourActive()) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    setAttachedFile({
      name: file.name,
      size: `${sizeInMb} MB`,
      type: file.type.includes('pdf') ? 'pdf' : 'image',
    });
    toast.success(`Attached ${file.name}`);
  };

  const activePlaceholder = activeChapterName
    ? `Ask about ${activeChapterName} (e.g. 'Explain derivations' or 'Top 5 numericals')...`
    : INTELLIGENT_PLACEHOLDERS[placeholderIndex];

  return (
    <div className="w-full space-y-3 max-w-4xl mx-auto">
      {/* 1. QUICK PROMPT CHIPS */}
      <div data-tour="ai-quick-prompts" className="relative group">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1 snap-x snap-mandatory scroll-smooth pr-6">
          <span className="text-[10px] uppercase font-bold text-muted-foreground shrink-0 flex items-center gap-1.5 pr-1 snap-start">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Quick Prompts:</span>
          </span>

          {QUICK_PROMPT_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => handleChipClick(chip)}
              disabled={isLoading || disabled}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted hover:bg-purple-500/15 text-foreground hover:text-purple-600 dark:hover:text-purple-300 border border-border font-semibold text-xs whitespace-nowrap transition-all cursor-pointer shrink-0 disabled:opacity-50 shadow-2xs hover:scale-[1.02] active:scale-95 snap-start"
            >
              <span>{chip.label}</span>
            </button>
          ))}
        </div>
        {/* Right fade gradient indicator */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-card to-transparent" />
      </div>

      {/* 2. SMART PROMPT OPTIONS (Level, Depth, Language toggles) */}
      {promptOptions && onChangeOptions && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <button
            type="button"
            onClick={() => setShowOptionsBar(!showOptionsBar)}
            className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-purple-500" />
            <span>Tune Output Style</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${showOptionsBar ? 'rotate-180' : ''}`}
            />
          </button>

          {(showOptionsBar || true) && (
            <div className="flex items-center gap-2 flex-wrap">
              {/* Level Selector */}
              <div className="flex items-center gap-1 bg-muted p-0.5 rounded-xl border border-border text-[11px]">
                <span className="text-foreground/80 pl-1.5 pr-0.5 font-bold text-[10px] flex items-center gap-1">
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
                          : 'text-foreground/80 hover:text-foreground hover:bg-card'
                      }`}
                    >
                      {lvl === 'Explain Like Beginner' ? 'Beginner' : lvl === 'Board Level' ? 'Board' : 'Topper'}
                    </button>
                  )
                )}
              </div>

              {/* Depth Selector */}
              <div className="flex items-center gap-1 bg-muted p-0.5 rounded-xl border border-border text-[11px]">
                <span className="text-foreground/80 pl-1.5 pr-0.5 font-bold text-[10px] flex items-center gap-1">
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
                          : 'text-foreground/80 hover:text-foreground hover:bg-card'
                      }`}
                    >
                      {dp === 'Very Detailed' ? 'Detailed' : dp === 'Very Short' ? 'Short' : 'Balanced'}
                    </button>
                  )
                )}
              </div>

              {/* Language Selector */}
              <div className="flex items-center gap-1 bg-muted p-0.5 rounded-xl border border-border text-[11px]">
                <span className="text-foreground/80 pl-1.5 pr-0.5 font-bold text-[10px] flex items-center gap-1">
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
                          : 'text-foreground/80 hover:text-foreground hover:bg-card'
                      }`}
                    >
                      {lng}
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. PROMINENT LARGE PROMPT DOCK */}
      <form
        data-tour="ai-input"
        onSubmit={handleSubmit}
        className="relative flex flex-col justify-between p-3.5 sm:p-4 rounded-3xl bg-card border-2 border-border shadow-xl focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-500/15 transition-all duration-200"
      >
        {/* Attached File Chip Preview */}
        {attachedFile && (
          <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-xs font-semibold w-fit">
            {attachedFile.type === 'image' ? (
              <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-purple-500" />
            )}
            <span>{attachedFile.name}</span>
            <span className="text-[10px] text-muted-foreground">({attachedFile.size})</span>
            <button
              type="button"
              onClick={() => setAttachedFile(null)}
              className="p-0.5 rounded-full hover:bg-purple-500/20 cursor-pointer ml-1"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Large Textarea Area (Min 3 lines, expandable) */}
        <textarea
          ref={textareaRef}
          rows={3}
          value={input}
          onChange={(e) => {
            if (isTourActive()) return;
            setInput(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onFocus={(e) => {
            if (isTourActive()) {
              e.currentTarget.blur();
              return;
            }
            if (onFocus) onFocus();
          }}
          onBlur={onBlur}
          disabled={isLoading || disabled}
          placeholder={activePlaceholder}
          className="w-full resize-none bg-transparent px-1 py-1 text-base text-foreground placeholder:text-muted-foreground/70 focus:outline-hidden leading-relaxed font-sans min-h-[56px] max-h-36 overflow-y-auto"
        />

        {/* Bottom Toolbar inside the Input Dock */}
        <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-border/60">
          {/* Left Controls: Attachments, Voice Input */}
          <div data-tour="ai-attach-voice" className="flex items-center gap-1.5">
            {/* Attachment Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,.pdf"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || disabled}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer touch-target border border-border"
              title="Attach diagram, PDF or screenshot"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Voice Input Button (hidden when speech recognition is missing) */}
            {speechRecognitionSupported && (
              <button
                type="button"
                onClick={toggleVoiceInput}
                disabled={isLoading || disabled}
                className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all cursor-pointer touch-target border ${
                  isRecording
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-500 animate-pulse'
                    : 'bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground border-border'
                }`}
                title={isRecording ? 'Listening... Click to stop' : 'Voice search / Ask question via microphone'}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}

            {/* Clear Button */}
            {input && (
              <button
                type="button"
                onClick={() => setInput('')}
                className="px-2.5 py-1 min-h-[44px] text-xs font-semibold text-muted-foreground hover:text-foreground rounded-lg transition cursor-pointer flex items-center"
              >
                Clear
              </button>
            )}
          </div>

          {/* Right Action: Large Circular Send Button */}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={!input.trim() || isLoading || disabled}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-primary hover:bg-primary-hover text-primary-foreground font-bold shadow-lg shadow-purple-600/30 flex items-center justify-center transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 active:scale-95 hover:scale-105"
              title="Send Prompt to Rankify AI Coach"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5 fill-current" />
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Keyboard & Offline Footer Helper - only show keyboard instructions on fine pointer + hover */}
      <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground px-2">
        <span className="hidden [@media(hover:hover)_and_(pointer:fine)]:inline-flex items-center gap-1">
          <CornerDownLeft className="w-3 h-3 opacity-60" /> Press{' '}
          <strong className="text-foreground">Enter</strong> to generate,{' '}
          <strong className="text-foreground">Shift + Enter</strong> for new line
        </span>
        <span className="text-right ml-auto font-mono text-[10px]">
          Rankify AI Study Engine • CBSE Class 12 Science Core
        </span>
      </div>
    </div>
  );
};

export const ChatInput = memo(ChatInputComponent);
