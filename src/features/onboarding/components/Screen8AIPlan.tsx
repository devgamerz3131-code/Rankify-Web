import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  BrainCircuit,
  ArrowRight,
  Target,
  Clock,
  Calendar,
  Layers,
} from 'lucide-react';

const STAGES = [
  'Analyzing syllabus...',
  'Checking weak chapters...',
  'Calculating available time...',
  'Creating daily targets...',
  'Preparing your roadmap...',
];

const MOTIVATIONAL_MESSAGES = [
  '“Focus on small daily wins; they compound into board exam excellence.”',
  '“Isolating weak chapters early is the secret weapon of all top scorers.”',
  '“Consistency beats intensity. Your personalized study schedule is almost ready.”',
  '“Great students are not born; they are engineered through structured revision.”',
];

export const Screen8AIPlan: React.FC = () => {
  const {
    isPlanGenerating,
    generationProgress,
    generationMessage,
    aiStudyPlan,
    startAIPlanGeneration,
    completeOnboarding,
    studentDetails,
    isSaving,
  } = useOnboarding();

  const [activeMessageIndex, setActiveMessageIndex] = useState(0);

  // Auto-start generation on mount if not already generating or completed
  useEffect(() => {
    if (!aiStudyPlan && !isPlanGenerating) {
      startAIPlanGeneration(false);
    }
  }, [aiStudyPlan, isPlanGenerating, startAIPlanGeneration]);

  // Rotate motivational messages every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMessageIndex((prev) => (prev + 1) % MOTIVATIONAL_MESSAGES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // When generation finishes and plan is ready, automatically finalize and redirect to Home
  useEffect(() => {
    if (aiStudyPlan && !isPlanGenerating && !isSaving) {
      const timer = setTimeout(() => {
        completeOnboarding();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [aiStudyPlan, isPlanGenerating, isSaving, completeOnboarding]);

  // Current stage index based on progress 0-100
  const currentStageIndex = Math.min(
    STAGES.length - 1,
    Math.floor((generationProgress / 100) * STAGES.length)
  );

  return (
    <div className="max-w-3xl mx-auto py-10 sm:py-16 px-4">
      <div className="text-center space-y-6">
        {/* Holographic Glowing AI Brain Animation */}
        <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
          {/* Outer Rotating Gradient Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-2 border-dashed border-purple-500/40 pointer-events-none"
          />

          {/* Secondary Pulse Ring */}
          <motion.div
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.25, 0.6, 0.25],
            }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-2 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-500 to-pink-500 blur-2xl pointer-events-none"
          />

          {/* Center Brain Core */}
          <div className="relative z-10 w-28 h-28 rounded-3xl bg-slate-950 border border-purple-500/50 shadow-2xl flex flex-col items-center justify-center backdrop-blur-xl">
            <BrainCircuit className="w-12 h-12 text-purple-400 animate-pulse" />
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-[10px] font-mono font-bold text-purple-300 mt-1"
            >
              RANKIFY PLANNER
            </motion.div>
          </div>
        </div>

        {/* Primary Heading */}
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Rankify is analysing your syllabus...
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
            Calibrating syllabus weightage, student confidence metrics, and study routines for{' '}
            <strong>{studentDetails.name || 'Student'}</strong> (CBSE Class 12 PCM).
          </p>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="max-w-md mx-auto space-y-2.5">
          <div className="h-3.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-300 dark:border-slate-700/60 shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 rounded-full"
              style={{ width: `${generationProgress}%` }}
              transition={{ ease: 'easeOut', duration: 0.3 }}
            />
          </div>
          <div className="flex items-center justify-between text-xs font-mono font-bold text-muted-foreground">
            <span className="text-purple-600 dark:text-purple-400 font-semibold">
              {STAGES[currentStageIndex]}
            </span>
            <span className="font-extrabold text-foreground text-sm">{generationProgress}%</span>
          </div>
        </div>

        {/* 5 Distinct Pipeline Stages Checklist */}
        <div className="max-w-md mx-auto rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 p-4 text-left shadow-xs backdrop-blur-xl space-y-2">
          {STAGES.map((stage, idx) => {
            const isCompleted = currentStageIndex > idx || generationProgress === 100;
            const isCurrent = currentStageIndex === idx && generationProgress < 100;

            return (
              <div
                key={stage}
                className={`flex items-center justify-between text-xs px-3 py-2 rounded-xl transition ${
                  isCurrent
                    ? 'bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-300 font-bold'
                    : isCompleted
                    ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                    : 'text-muted-foreground opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-purple-600 text-white animate-spin'
                        : 'bg-slate-200 dark:bg-slate-800 text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <span>{stage}</span>
                </div>
                {isCompleted && (
                  <span className="text-[10px] font-mono uppercase text-emerald-500 font-bold">
                    Done
                  </span>
                )}
                {isCurrent && (
                  <span className="text-[10px] font-mono uppercase text-purple-500 font-bold animate-pulse">
                    Processing
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Rotating Motivational Message Box */}
        <div className="max-w-md mx-auto min-h-[50px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={activeMessageIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4 }}
              className="text-xs sm:text-sm text-purple-700 dark:text-purple-300 font-medium italic"
            >
              {MOTIVATIONAL_MESSAGES[activeMessageIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Fast Track / Instant Generate Button */}
        <div className="pt-2">
          <Button
            variant="glass"
            size="sm"
            onClick={() => startAIPlanGeneration(true)}
            className="text-xs font-semibold gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Fast Track (Instant Generate & Go to Home)</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
