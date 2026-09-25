import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Zap,
  Calendar,
  Clock,
  Target,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  BrainCircuit,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';

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

  const [activePlanTab, setActivePlanTab] = useState<'overview' | 'daily' | 'weekly' | 'revision'>('overview');

  useEffect(() => {
    if (!aiStudyPlan && !isPlanGenerating) {
      startAIPlanGeneration(false);
    }
  }, [aiStudyPlan, isPlanGenerating, startAIPlanGeneration]);

  // View A: Calibrated AI Generation Animation Screen
  if (isPlanGenerating || !aiStudyPlan) {
    return (
      <div className="max-w-2xl mx-auto py-12 sm:py-20 px-4 text-center">
        {/* Holographic Glowing Pulse */}
        <div className="relative w-36 h-36 mx-auto mb-8 flex items-center justify-center">
          <motion.div
            animate={{
              scale: [1, 1.25, 1],
              rotate: [0, 180, 360],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-500 to-pink-500 blur-xl pointer-events-none"
          />
          <div className="relative z-10 w-24 h-24 rounded-full bg-slate-900 border border-purple-500/40 shadow-2xl flex items-center justify-center">
            <BrainCircuit className="w-10 h-10 text-purple-400 animate-pulse" />
          </div>
        </div>

        {/* Status Message */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-2">
          Rankify AI is Building Your Study Plan
        </h2>
        <AnimatePresence mode="wait">
          <motion.p
            key={generationMessage}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-sm font-semibold text-purple-600 dark:text-purple-400 min-h-[24px]"
          >
            {generationMessage}
          </motion.p>
        </AnimatePresence>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto mt-6 space-y-2">
          <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-300 dark:border-slate-700/60 shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 rounded-full"
              style={{ width: `${generationProgress}%` }}
              transition={{ ease: 'linear' }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground font-mono font-semibold">
            <span>Synthesizing syllabus roadmap...</span>
            <span>{generationProgress}%</span>
          </div>
        </div>

        {/* Fast Track Option */}
        <div className="mt-10">
          <button
            type="button"
            onClick={() => startAIPlanGeneration(true)}
            className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-300 hover:bg-purple-500/20 transition cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Fast Track (Instant Generate)</span>
          </button>
        </div>
      </div>
    );
  }

  // View B: Finished AI Study Plan Presentation
  return (
    <div className="max-w-4xl mx-auto py-2 sm:py-6 px-3 sm:px-4 space-y-6">
      {/* Plan Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950 text-white border border-purple-500/30 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-purple-200 border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>Rankify AI Study Engine • Validated Roadmap</span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/30 border border-purple-400/40 text-xs font-bold text-white">
              <span>Difficulty: {aiStudyPlan.difficultyRating}</span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Personalized Study Plan for {studentDetails.name || 'Student'}
          </h2>

          <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed max-w-2xl font-normal">
            {aiStudyPlan.summary}
          </p>

          {/* Key Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-1.5 text-[11px] text-purple-200 font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>Daily Study</span>
              </div>
              <div className="text-lg sm:text-xl font-extrabold font-mono mt-0.5">
                {aiStudyPlan.recommendedStudyHours} hrs/day
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-1.5 text-[11px] text-purple-200 font-medium">
                <Zap className="w-3.5 h-3.5" />
                <span>Pomodoro Session</span>
              </div>
              <div className="text-lg sm:text-xl font-extrabold font-mono mt-0.5">
                {aiStudyPlan.recommendedSessionLength} mins
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-1.5 text-[11px] text-purple-200 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                <span>Target Completion</span>
              </div>
              <div className="text-xs sm:text-sm font-extrabold mt-1 truncate">
                {aiStudyPlan.expectedCompletionDate}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-1.5 text-[11px] text-purple-200 font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-rose-300" />
                <span>Priority Focus</span>
              </div>
              <div className="text-lg sm:text-xl font-extrabold font-mono mt-0.5 text-rose-300">
                {aiStudyPlan.weakChapters.length} Chapters
              </div>
            </div>
          </div>
        </div>

        {/* Ambient glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* Plan Section Nav Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setActivePlanTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activePlanTab === 'overview'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Priority Queue ({aiStudyPlan.priorityQueue.length})
        </button>

        <button
          type="button"
          onClick={() => setActivePlanTab('daily')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activePlanTab === 'daily'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          7-Day Targets ({aiStudyPlan.dailyTargets.length})
        </button>

        <button
          type="button"
          onClick={() => setActivePlanTab('weekly')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activePlanTab === 'weekly'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          4-Week Goals
        </button>

        <button
          type="button"
          onClick={() => setActivePlanTab('revision')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activePlanTab === 'revision'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Revision Queue
        </button>
      </div>

      {/* Tab 1: Priority Queue */}
      {activePlanTab === 'overview' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">
              Immediate Deficit Recovery Queue (Rank-Ordered)
            </h3>
            <span className="text-[11px] text-muted-foreground">
              Master these chapters first to raise board aggregate
            </span>
          </div>

          <div className="space-y-2.5">
            {aiStudyPlan.priorityQueue.map((item, idx) => (
              <div
                key={item.chapterId}
                className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{item.chapterName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-muted-foreground font-semibold">
                        {item.subjectName}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.reason}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      item.priority === 'Urgent'
                        ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                        : item.priority === 'High'
                        ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                    }`}
                  >
                    {item.priority}
                  </span>
                  <span className="text-xs font-mono font-semibold text-muted-foreground">
                    ~{item.estimatedMinutes} mins
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Daily Targets */}
      {activePlanTab === 'daily' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Next 7 Days Task Allocation</h3>
            <span className="text-[11px] text-muted-foreground">Calibrated to your school & coaching timings</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {aiStudyPlan.dailyTargets.map((d) => (
              <div
                key={d.id}
                className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                    Day {d.dayNumber} • {d.date}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-muted-foreground">
                    {d.allocatedMinutes} Mins
                  </span>
                </div>
                <div className="font-bold text-sm text-foreground">{d.taskTitle}</div>
                <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-purple-500" />
                  <span>Subject: {d.subjectName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Weekly Targets */}
      {activePlanTab === 'weekly' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">4-Week Syllabus Milestones</h3>
            <span className="text-[11px] text-muted-foreground">Sequential syllabus coverage targets</span>
          </div>

          <div className="space-y-3">
            {aiStudyPlan.weeklyTargets.map((w) => (
              <div
                key={w.id}
                className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs space-y-3"
              >
                <div className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span>{w.title}</span>
                </div>
                <ul className="space-y-1.5">
                  {w.goals.map((g, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Revision Queue */}
      {activePlanTab === 'revision' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Spaced Repetition Schedule</h3>
            <span className="text-[11px] text-muted-foreground">Automated recall intervals</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {aiStudyPlan.revisionQueue.map((rev, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                    Scheduled: {rev.scheduledDate}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-500/10 text-purple-600">
                    {rev.subjectName}
                  </span>
                </div>
                <div className="font-bold text-sm text-foreground">{rev.chapterName}</div>
                <div className="text-[11px] text-muted-foreground">{rev.revisionMethod}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Final Completion CTA Banner */}
      <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8">
        <div>
          <div className="font-bold text-base text-foreground">
            Ready to Activate Your Rankify Study Engine?
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your customized syllabus tracker, routine targets, and AI plan will be synced and stored permanently.
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={completeOnboarding}
          isLoading={isSaving}
          className="h-12 px-8 rounded-2xl text-sm font-bold shadow-xl shadow-purple-600/25 shrink-0 cursor-pointer"
        >
          <span>Complete Onboarding</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};
