import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Target,
  Zap,
} from 'lucide-react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { DetectedChapter, DetectedSubject } from '../model/types';

interface SmartSuggestionsProps {
  currentChapter?: DetectedChapter;
  currentSubject?: DetectedSubject;
  onSelectPrompt: (promptText: string) => void;
}

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  currentChapter,
  currentSubject,
  onSelectPrompt,
}) => {
  const { chapterProgressMap } = useOnboarding();
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

  // Find other weak / needs-focus chapters
  const needsFocusChapters = allProgress.filter(
    (c) =>
      (c.needsFocus || c.confidence <= 2 || c.progressPercentage < 50) &&
      (!currentProgress || c.chapterId !== currentProgress.chapterId)
  );

  // Suggest next chapter if completed
  const nextChapters = allProgress.filter(
    (c) =>
      c.progressPercentage < 100 &&
      (!currentSubject ||
        currentSubject === 'General CBSE' ||
        c.subjectName === currentSubject)
  );

  // Case 1: Active Chapter is marked "Needs Focus" or Weak
  if (
    currentChapter &&
    currentProgress &&
    (currentProgress.needsFocus ||
      currentProgress.confidence <= 2 ||
      currentProgress.progressPercentage < 50)
  ) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 sm:mx-6 mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-between gap-2 shadow-xs"
      >
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="font-semibold truncate">
            <strong>{currentChapter.name}</strong> is marked <em>Needs Focus</em> (Confidence {currentProgress.confidence || 2}/5).
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() =>
              onSelectPrompt(`Explain ${currentChapter.name} Derivations step by step for CBSE Boards`)
            }
            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[11px] transition cursor-pointer"
          >
            Derivations
          </button>
          <button
            onClick={() =>
              onSelectPrompt(`Top repeated PYQs and marking scheme for ${currentChapter.name}`)
            }
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-semibold text-[11px] transition cursor-pointer"
          >
            Top PYQs
          </button>
          <button
            onClick={() =>
              onSelectPrompt(`Common mistakes and numerical tips for ${currentChapter.name}`)
            }
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-semibold text-[11px] transition cursor-pointer"
          >
            Common Mistakes
          </button>
        </div>
      </motion.div>
    );
  }

  // Case 2: Active Chapter is Completed (100% or completion is true)
  if (
    currentChapter &&
    currentProgress &&
    (currentProgress.completion || currentProgress.progressPercentage === 100)
  ) {
    const recommendedNext = nextChapters[0];
    return (
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 sm:mx-6 mt-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-900 dark:text-emerald-200 flex flex-wrap items-center justify-between gap-2 shadow-xs"
      >
        <div className="flex items-center gap-2 min-w-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-semibold truncate">
            Mastered <strong>{currentChapter.name}</strong> (100% Complete)!
          </span>
        </div>

        {recommendedNext && (
          <button
            onClick={() =>
              onSelectPrompt(`Explain ${recommendedNext.chapterName} in simple language for CBSE Boards`)
            }
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition cursor-pointer shrink-0"
          >
            <span>Next: {recommendedNext.chapterName}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </motion.div>
    );
  }

  // Case 3: Global Weak Chapters Suggestion Banner (when 1 or more chapters need focus)
  if (needsFocusChapters.length > 0 && !currentChapter) {
    const topWeak = needsFocusChapters[0];
    return (
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 sm:mx-6 mt-3 p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-900 dark:text-purple-200 flex flex-wrap items-center justify-between gap-2 shadow-xs"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
          <span className="truncate">
            Target Weak Chapter: <strong>{topWeak.chapterName}</strong> ({topWeak.subjectName})
          </span>
        </div>

        <button
          onClick={() =>
            onSelectPrompt(`Explain ${topWeak.chapterName} one shot revision with NCERT derivation and numericals`)
          }
          className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[11px] flex items-center gap-1 transition cursor-pointer shrink-0"
        >
          <span>Generate Study Plan</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </motion.div>
    );
  }

  return null;
};
