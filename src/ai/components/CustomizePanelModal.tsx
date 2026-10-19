import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Gauge,
  Layers,
  Globe,
  Bot,
  BookOpen,
  Sparkles,
  Zap,
} from 'lucide-react';
import { SmartPromptOptions, AiMode, DetectedSubject } from '../model/types';

interface CustomizePanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptOptions: SmartPromptOptions;
  onChangeOptions: (opts: Partial<SmartPromptOptions>) => void;
  activeMode: AiMode;
  onSelectMode: (mode: AiMode) => void;
  detectedSubject?: DetectedSubject;
  onSelectSubject?: (subj: DetectedSubject) => void;
}

export const CustomizePanelModal: React.FC<CustomizePanelModalProps> = ({
  isOpen,
  onClose,
  promptOptions,
  onChangeOptions,
  activeMode,
  onSelectMode,
  detectedSubject = 'General CBSE',
  onSelectSubject,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="w-full sm:max-w-md bg-card border-t sm:border border-border sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh] z-10"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-card shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-foreground">
                Customize AI Output
              </h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Tune your study coach persona and details
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* AI Mode Selection */}
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-purple-500" />
              <span>AI Study Mode</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/60 rounded-xl border border-border">
              {(['Tutor', 'Solver', 'Notes', 'Revision', 'Planner', 'Exam'] as const).map(
                (m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => onSelectMode(m)}
                    className={`py-1.5 px-2 rounded-lg font-bold text-xs transition cursor-pointer text-center ${
                      activeMode === m
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
                    }`}
                  >
                    {m}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Level Option */}
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-blue-500" />
              <span>Explanations Level</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/60 rounded-xl border border-border">
              {(['Explain Like Beginner', 'Board Level', 'Topper Level'] as const).map(
                (lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => onChangeOptions({ level: lvl })}
                    className={`py-1.5 px-2 rounded-lg font-bold text-xs transition cursor-pointer text-center truncate ${
                      promptOptions.level === lvl
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
                    }`}
                    title={lvl}
                  >
                    {lvl === 'Explain Like Beginner' ? 'Beginner' : lvl === 'Board Level' ? 'Board' : 'Topper'}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Depth Option */}
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>Details & Length</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/60 rounded-xl border border-border">
              {(['Default', 'Very Detailed', 'Very Short'] as const).map(
                (dp) => (
                  <button
                    key={dp}
                    type="button"
                    onClick={() => onChangeOptions({ depth: dp })}
                    className={`py-1.5 px-2 rounded-lg font-bold text-xs transition cursor-pointer text-center truncate ${
                      promptOptions.depth === dp
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
                    }`}
                  >
                    {dp === 'Very Detailed' ? 'Detailed' : dp === 'Very Short' ? 'Short' : 'Balanced'}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Language Option */}
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-500" />
              <span>Response Language</span>
            </label>
            <div className="grid grid-cols-4 gap-1 p-1 bg-muted/60 rounded-xl border border-border">
              {(['Auto', 'English', 'Hindi', 'Hinglish'] as const).map(
                (lng) => (
                  <button
                    key={lng}
                    type="button"
                    onClick={() => onChangeOptions({ language: lng })}
                    className={`py-1.5 px-1 rounded-lg font-bold text-[11px] transition cursor-pointer text-center ${
                      promptOptions.language === lng
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
                    }`}
                  >
                    {lng}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Subject Setting */}
          {onSelectSubject && (
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-rose-500" />
                <span>Primary Subject</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted/60 rounded-xl border border-border">
                {(['Physics', 'Chemistry', 'Mathematics', 'General CBSE'] as const).map(
                  (subj) => {
                    const isActive = detectedSubject === subj;
                    return (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => onSelectSubject(subj)}
                        className={`py-1.5 px-2 rounded-lg font-bold text-xs transition cursor-pointer text-center ${
                          isActive
                            ? 'bg-purple-600 text-white shadow-2xs'
                            : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
                        }`}
                      >
                        {subj === 'Mathematics' ? 'Maths' : subj}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          )}
        </div>

        {/* Apply Action Button */}
        <div className="p-4 border-t border-border shrink-0 bg-muted/10">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-sm shadow-purple-500/20 transition cursor-pointer text-center"
          >
            Apply Settings & Tune Coach
          </button>
        </div>
      </motion.div>
    </div>
  );
};
