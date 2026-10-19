import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Trophy,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  RotateCcw,
  Zap,
  Flame,
  Award,
  ArrowRight,
  Bookmark,
  Check,
  Brain,
  Moon,
  Rocket,
  X,
  Target,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DailyMissionReport, TaskItem } from '@/services/daily-mission-service';
import { formatTime } from '@/utils/formatters';
import { formatStreak } from '@/hooks/use-today-stats';

interface MissionCompleteModalProps {
  isOpen: boolean;
  report: DailyMissionReport | null;
  onDoneForToday: () => void;
  onStartExtraPractice: () => void;
  onClose: () => void;
}

export const MissionCompleteModal: React.FC<MissionCompleteModalProps> = ({
  isOpen,
  report,
  onDoneForToday,
  onStartExtraPractice,
  onClose,
}) => {
  const [showRestWellModal, setShowRestWellModal] = useState(false);

  // Trigger subtle confetti on open
  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.5, x: 0.3 },
        colors: ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.5, x: 0.7 },
          colors: ['#8b5cf6', '#3b82f6', '#10b981', '#ec4899'],
        });
      }, 250);
    }
  }, [isOpen]);

  // iOS-safe scroll locking for modal
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const originalTop = document.body.style.top;
      const scrollY = window.scrollY;

      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.top = originalTop;
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen || !report) return null;

  const handleDoneClick = () => {
    setShowRestWellModal(true);
    setTimeout(() => {
      setShowRestWellModal(false);
      onDoneForToday();
    }, 2000);
  };

  const timeFormatted = formatTime(report.studyMinutes);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/90 sm:bg-black/85 backdrop-blur-md animate-fadeIn [overscroll-behavior:none]">
      {/* Rest Well Interstitial Screen - Render alone so previous modal text never ghosts through */}
      {showRestWellModal ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 z-60 flex flex-col items-center justify-center bg-black/95 text-center p-6 text-white space-y-4"
        >
          <div className="w-20 h-20 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 animate-pulse">
            <Moon className="w-10 h-10 fill-indigo-400/40" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            🌙 Great work today!
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-md font-medium">
            Rest well. We'll prepare tomorrow's personalized mission.
          </p>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
            <Check className="w-4 h-4" />
            <span>Today's Mission Saved & Synced</span>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.96 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          style={{
            maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 32px)',
          }}
          className="relative w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden my-auto select-none flex flex-col"
        >
          {/* Header Ribbon Glow */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-purple-600/20 via-indigo-600/10 to-transparent pointer-events-none" />

          {/* Sticky Close (X) Button */}
          <div className="sticky top-0 right-0 z-30 flex justify-end p-3 pointer-events-none">
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-card/95 border border-border text-foreground hover:bg-muted transition cursor-pointer pointer-events-auto shadow-md"
              aria-label="Close"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          <div className="p-5 sm:p-8 pt-0 space-y-6 relative z-10 overflow-y-auto [overscroll-behavior:contain] flex-1">
            {/* Hero Banner */}
            <div className="text-center space-y-2 pt-1">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-purple-600/30"
              >
                <Trophy className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce" />
              </motion.div>

              <div className="space-y-1">
                <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest text-purple-600 dark:text-purple-400 bg-purple-500/10 px-3 py-0.5 rounded-full border border-purple-500/20">
                  CBSE Class 12 Daily Target
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                  🎉 Mission Complete!
                </h1>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  Excellent work! You completed today's study mission.
                </p>
              </div>

              {/* Motivational Quote */}
              <div className="p-3 rounded-2xl bg-muted/40 border border-border text-xs font-semibold text-muted-foreground italic max-w-lg mx-auto">
                "{report.motivationalQuote}"
              </div>
            </div>

            {/* Today's Report Grid (10 Required Statistics) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-600" />
                <span>Today's Report & Statistics</span>
              </h3>
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                100% Target Met
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
              {/* 1. Study Time */}
              <div className="p-3 rounded-2xl bg-muted/30 border border-border space-y-0.5">
                <Clock className="w-4 h-4 mx-auto text-purple-600" />
                <span className="text-[10px] text-muted-foreground font-medium block">Study Time</span>
                <span className="text-sm font-black font-mono text-foreground">{timeFormatted}</span>
              </div>

              {/* 2. Tasks Completed */}
              <div className="p-3 rounded-2xl bg-muted/30 border border-border space-y-0.5">
                <CheckCircle2 className="w-4 h-4 mx-auto text-emerald-500" />
                <span className="text-[10px] text-muted-foreground font-medium block">Tasks Done</span>
                <span className="text-sm font-black font-mono text-foreground">
                  {report.tasksCompleted}/{report.totalTasks}
                </span>
              </div>

              {/* 3. Questions Solved */}
              <div className="p-3 rounded-2xl bg-muted/30 border border-border space-y-0.5">
                <Target className="w-4 h-4 mx-auto text-blue-500" />
                <span className="text-[10px] text-muted-foreground font-medium block">Questions</span>
                <span className="text-sm font-black font-mono text-foreground">{report.questionsSolved}</span>
              </div>

              {/* 4. Revision Completed */}
              <div className="p-3 rounded-2xl bg-muted/30 border border-border space-y-0.5">
                <RotateCcw className="w-4 h-4 mx-auto text-indigo-500" />
                <span className="text-[10px] text-muted-foreground font-medium block">Revision</span>
                <span className="text-sm font-black font-mono text-foreground">{report.revisionCompleted} topics</span>
              </div>

              {/* 5. Lectures Completed */}
              <div className="p-3 rounded-2xl bg-muted/30 border border-border space-y-0.5">
                <BookOpen className="w-4 h-4 mx-auto text-amber-500" />
                <span className="text-[10px] text-muted-foreground font-medium block">Lectures</span>
                <span className="text-sm font-black font-mono text-foreground">{report.lecturesCompleted} done</span>
              </div>

              {/* 6. Flashcards Reviewed */}
              <div className="p-3 rounded-2xl bg-muted/30 border border-border space-y-0.5">
                <Bookmark className="w-4 h-4 mx-auto text-pink-500" />
                <span className="text-[10px] text-muted-foreground font-medium block">Flashcards</span>
                <span className="text-sm font-black font-mono text-foreground">{report.flashcardsReviewed} reviewed</span>
              </div>

              {/* 7. Mistakes Fixed */}
              <div className="p-3 rounded-2xl bg-muted/30 border border-border space-y-0.5">
                <ShieldCheck className="w-4 h-4 mx-auto text-teal-500" />
                <span className="text-[10px] text-muted-foreground font-medium block">Mistakes Fixed</span>
                <span className="text-sm font-black font-mono text-foreground">{report.mistakesFixed} cured</span>
              </div>

              {/* 8. AI Sessions */}
              <div className="p-3 rounded-2xl bg-muted/30 border border-border space-y-0.5">
                <Brain className="w-4 h-4 mx-auto text-purple-500" />
                <span className="text-[10px] text-muted-foreground font-medium block">AI Sessions</span>
                <span className="text-sm font-black font-mono text-foreground">{report.aiSessions}</span>
              </div>

              {/* 9. XP Earned */}
              <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-0.5">
                <Zap className="w-4 h-4 mx-auto text-purple-600 fill-purple-600" />
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block">XP Earned</span>
                <span className="text-sm font-black font-mono text-purple-700 dark:text-purple-300">
                  +{report.xpEarned} XP
                </span>
              </div>

              {/* 10. Current Streak */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-0.5">
                <Flame className="w-4 h-4 mx-auto text-amber-500 fill-amber-500" />
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">Streak</span>
                <span className="text-sm font-black font-mono text-amber-700 dark:text-amber-300">
                  {formatStreak(report.currentStreak)} 🔥
                </span>
              </div>
            </div>
          </div>

          {/* AI Feedback Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/20 via-indigo-950/20 to-slate-900/40 border border-purple-500/25 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-foreground">Rankify AI Daily Briefing</span>
              <span className="text-[9px] font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.2 rounded-full border border-purple-500/20 ml-auto">
                Adaptive
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              "{report.aiSummary}"
            </p>
          </div>

          {/* Unlocked Achievements Section */}
          {report.unlockedAchievements.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>Achievements Unlocked</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {report.unlockedAchievements.map((ach) => (
                  <motion.div
                    key={ach.id}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20"
                  >
                    <span className="text-2xl">{ach.icon}</span>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-black text-foreground truncate">{ach.title}</p>
                        <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                          +{ach.pointsAward} XP
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{ach.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons (2 Required Buttons) */}
          <div className="pt-2 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Primary 1: Done for Today */}
              <button
                onClick={handleDoneClick}
                className="p-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 transition shadow-md shadow-purple-600/25 flex flex-col items-start text-left space-y-1 cursor-pointer group"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm font-black flex items-center gap-1.5">
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Done for Today</span>
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-[11px] text-purple-100 font-normal leading-snug">
                  End today's study. Tomorrow's AI plan will be generated automatically.
                </p>
              </button>

              {/* Primary 2: Extra Practice */}
              <button
                onClick={onStartExtraPractice}
                className="p-4 rounded-2xl bg-card border border-border hover:border-purple-500/50 hover:bg-muted/40 transition flex flex-col items-start text-left space-y-1 cursor-pointer group shadow-xs"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm font-black text-foreground flex items-center gap-1.5">
                    <Rocket className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Extra Practice</span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Generate optional practice for weak chapters. No penalty.
                </p>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
      )}
    </div>
  );
};
