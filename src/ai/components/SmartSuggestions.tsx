import React from 'react';
import { motion } from 'framer-motion';
import {
  Flame,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  BookOpen,
  FileText,
  Calculator,
  Compass,
  Award,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { DetectedChapter, DetectedSubject } from '../model/types';

interface SmartSuggestionsProps {
  currentChapter?: DetectedChapter;
  currentSubject?: DetectedSubject;
  onSelectPrompt: (promptText: string) => void;
}

const SMART_BUTTONS: {
  label: string;
  template: (chapter: string) => string;
  icon: React.FC<{ className?: string }>;
}[] = [
  {
    label: "Revise Today's Chapter",
    template: (ch) => `Revise ${ch} one shot with NCERT board highlights and key formulas`,
    icon: BookOpen,
  },
  {
    label: 'Generate PYQs',
    template: (ch) => `Generate top CBSE Previous Year Questions (PYQs) for ${ch} with marking scheme`,
    icon: Award,
  },
  {
    label: 'Generate Formula Sheet',
    template: (ch) => `Generate complete formula sheet with SI units and dimensions for ${ch}`,
    icon: FileText,
  },
  {
    label: 'Generate Numericals',
    template: (ch) => `Generate high-yield numerical practice problems for ${ch} with step-by-step solutions`,
    icon: Calculator,
  },
  {
    label: 'Explain Like Beginner',
    template: (ch) => `Explain ${ch} like a beginner with simple everyday analogies and zero confusion`,
    icon: Compass,
  },
  {
    label: 'Create Mind Map',
    template: (ch) => `Create a structured conceptual mind map and chapter flow for ${ch}`,
    icon: Layers,
  },
  {
    label: 'Revision Notes',
    template: (ch) => `Provide crisp high-yield NCERT revision notes and memory tricks for ${ch}`,
    icon: FileText,
  },
  {
    label: 'Important Derivations',
    template: (ch) => `Explain the most important CBSE derivations in ${ch} step by step`,
    icon: Sparkles,
  },
  {
    label: 'Competency Questions',
    template: (ch) => `Generate CBSE competency-based and case-study questions with answer key for ${ch}`,
    icon: HelpCircle,
  },
  {
    label: 'Expected Board Questions',
    template: (ch) => `Predict the top expected CBSE board exam questions (2, 3, and 5 marks) for ${ch}`,
    icon: Award,
  },
];

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  currentChapter,
  currentSubject,
  onSelectPrompt,
}) => {
  const { chapterProgressMap, aiStudyPlan } = useOnboarding();
  const allProgress = Object.values(chapterProgressMap || {});

  // Find progress for the currently detected chapter
  const currentProgress = currentChapter
    ? allProgress.find(
        (c) =>
          c.chapterName.toLowerCase().trim() ===
            currentChapter.name.toLowerCase().trim() ||
          currentChapter.name.toLowerCase().includes(c.chapterName.toLowerCase()) ||
          c.chapterName.toLowerCase().includes(currentChapter.name.toLowerCase())
      )
    : null;

  // Find needs-focus chapters
  const needsFocusChapters = allProgress.filter(
    (c) =>
      (c.needsFocus || c.confidence <= 2 || c.progressPercentage < 50) &&
      !c.completion &&
      c.progressPercentage < 100
  );

  // Completed chapters filter - never recommend mastered chapters
  const nextUncompletedChapters = allProgress.filter(
    (c) =>
      !c.completion &&
      (c.progressPercentage || 0) < 100 &&
      (!currentSubject ||
        currentSubject === 'General CBSE' ||
        c.subjectName === currentSubject)
  );

  // Today's focus chapter from study plan or fallback
  const todaysPlanChapter =
    aiStudyPlan?.todaysChapters?.[0] || 'Electrochemistry';

  const activeTargetChapterName =
    currentChapter?.name || todaysPlanChapter;

  return (
    <div className="w-full space-y-2">
      {/* 1. Needs Focus Banner: "🔥 Recommended Today" */}
      {currentChapter &&
        currentProgress &&
        (currentProgress.needsFocus ||
          currentProgress.confidence <= 2 ||
          currentProgress.progressPercentage < 50) && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 sm:mx-6 mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-purple-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-between gap-2 shadow-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-black text-[10px] uppercase tracking-wider shadow-xs">
                <Flame className="w-3 h-3 fill-white" />
                <span>Recommended Today</span>
              </span>
              <span className="font-semibold truncate">
                <strong>{currentChapter.name}</strong> is marked <em>Needs Focus</em> (Confidence: {currentProgress.confidence || 2}/5). Strengthen this topic today!
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() =>
                  onSelectPrompt(
                    `Explain ${currentChapter.name} complete derivations and step by step formulas for CBSE Boards`
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] transition cursor-pointer shadow-xs"
              >
                Derivations
              </button>
              <button
                type="button"
                onClick={() =>
                  onSelectPrompt(
                    `Top repeated CBSE PYQs with marking scheme for ${currentChapter.name}`
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-bold text-[11px] transition cursor-pointer"
              >
                Top PYQs
              </button>
              <button
                type="button"
                onClick={() =>
                  onSelectPrompt(
                    `Common mistakes and high-yield numerical traps for ${currentChapter.name}`
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-bold text-[11px] transition cursor-pointer"
              >
                Common Mistakes
              </button>
            </div>
          </motion.div>
        )}

      {/* 2. Global Needs Focus Banner (if no current chapter is active and there are weak chapters) */}
      {!currentChapter && needsFocusChapters.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 sm:mx-6 mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-purple-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-between gap-2 shadow-xs"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-black text-[10px] uppercase tracking-wider shadow-xs">
              <Flame className="w-3 h-3 fill-white" />
              <span>Recommended Today</span>
            </span>
            <span className="font-semibold truncate">
              Focus on <strong>{needsFocusChapters[0].chapterName}</strong> ({needsFocusChapters[0].subjectName}) to boost overall board percentile!
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              onSelectPrompt(
                `Explain ${needsFocusChapters[0].chapterName} from scratch with board pattern derivations and formulas`
              )
            }
            className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] flex items-center gap-1 transition cursor-pointer shadow-xs"
          >
            <span>Ask Coach</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </motion.div>
      )}

      {/* 3. Completed Chapter Notice: Never recommend mastered chapters; recommend the next one */}
      {currentChapter &&
        currentProgress &&
        (currentProgress.completion ||
          currentProgress.progressPercentage === 100) && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 sm:mx-6 mt-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-900 dark:text-emerald-200 flex flex-wrap items-center justify-between gap-2 shadow-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold truncate">
                🎉 Mastered <strong>{currentChapter.name}</strong> (100% Complete)!
              </span>
            </div>

            {nextUncompletedChapters.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  onSelectPrompt(
                    `Explain ${nextUncompletedChapters[0].chapterName} step by step for CBSE Boards`
                  )
                }
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition cursor-pointer shrink-0"
              >
                <span>Next: {nextUncompletedChapters[0].chapterName}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </motion.div>
        )}

      {/* 4. Smart Suggestions Buttons Bar */}
      <div className="mx-4 sm:mx-6 px-1 py-1">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[10px] uppercase font-bold text-muted-foreground shrink-0 flex items-center gap-1 pr-1">
            <Sparkles className="w-3 h-3 text-purple-500" />
            <span>Smart Prompts:</span>
          </span>
          {SMART_BUTTONS.map((btn) => {
            const Icon = btn.icon;
            return (
              <button
                key={btn.label}
                type="button"
                onClick={() => onSelectPrompt(btn.template(activeTargetChapterName))}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-muted-foreground hover:text-purple-600 dark:hover:text-purple-300 border border-slate-200/80 dark:border-slate-700/60 font-semibold text-[11px] whitespace-nowrap transition cursor-pointer shrink-0 shadow-2xs"
              >
                <Icon className="w-3 h-3 text-purple-500" />
                <span>{btn.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
