import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Target,
  Clock,
  Compass,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Zap,
  BookOpen,
  Calendar,
  Flame,
  ArrowRight,
  RefreshCw,
  Award,
  Layers,
  Check,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AIStudyPlan, ChapterProgress } from '@/types/onboarding';

export interface TaskItem {
  id: string;
  taskTitle: string;
  subjectName: string;
  chapterName: string;
  allocatedMinutes: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Board Level' | 'Topper Level' | 'Foundation' | string;
  isCompleted: boolean;
  status: 'pending' | 'completed' | 'skipped';
}

interface RankifySmartPlanCardProps {
  plan: AIStudyPlan | null;
  tasks: TaskItem[];
  overallCoverage: number;
  progressPercent: number;
  completedTasksCount: number;
  totalTasksCount: number;
  weakChapters: string[];
  chaptersList: ChapterProgress[];
  onCompleteTask: (taskId: string) => void;
  onSkipTask: (taskId: string) => void;
  onAddNewTask?: () => void;
  onNavigateToAi?: (prefill?: {
    subject?: string;
    chapter?: string;
    difficulty?: string;
    questionType?: string;
    query?: string;
  }) => void;
  onOpenStudyTab?: () => void;
  onRegeneratePlan?: () => void;
  isRegenerating?: boolean;
}

export const RankifySmartPlanCard: React.FC<RankifySmartPlanCardProps> = ({
  plan,
  tasks,
  overallCoverage,
  progressPercent,
  completedTasksCount,
  totalTasksCount,
  weakChapters,
  chaptersList,
  onCompleteTask,
  onSkipTask,
  onAddNewTask,
  onNavigateToAi,
  onOpenStudyTab,
  onRegeneratePlan,
  isRegenerating,
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'weekly' | 'weak' | 'revision'>('today');

  // Next Recommended Topic: First uncompleted priority or weak chapter
  const nextRecommendedTopic = useMemo(() => {
    // 1. Check priority queue from plan
    if (plan?.priorityQueue && plan.priorityQueue.length > 0) {
      const p = plan.priorityQueue[0];
      return {
        title: p.chapterName,
        subject: p.subjectName,
        reason: p.reason || 'High Deficit Topic',
      };
    }

    // 2. Check pending tasks
    const pendingTask = tasks.find((t) => !t.isCompleted && t.status !== 'skipped');
    if (pendingTask) {
      return {
        title: pendingTask.chapterName,
        subject: pendingTask.subjectName,
        reason: 'Today’s Immediate Target',
      };
    }

    // 3. Fallback to first incomplete chapter
    const incomplete = chaptersList.find((c) => !c.completion && (c.progressPercentage || 0) < 100);
    if (incomplete) {
      return {
        title: incomplete.chapterName,
        subject: incomplete.subjectName,
        reason: 'Syllabus Sequence',
      };
    }

    return {
      title: 'Ray Optics & Wave Optics',
      subject: 'Physics',
      reason: 'High Weightage Board Section',
    };
  }, [plan, tasks, chaptersList]);

  // Current Focus Chapter
  const currentFocusChapter =
    plan?.focusTopic ||
    (plan?.todaysChapters && plan.todaysChapters[0]) ||
    tasks.find((t) => !t.isCompleted)?.chapterName ||
    'Electric Charges and Fields';

  // Today's Goal text
  const todaysGoalTitle =
    plan?.todaysMission ||
    `${tasks.length} Daily CBSE Class 12 Core Targets`;

  // Pending tasks count
  const pendingTasksCount = tasks.filter((t) => !t.isCompleted && t.status !== 'skipped').length;

  return (
    <Card className="relative overflow-hidden rounded-3xl border-2 border-purple-500/30 dark:border-purple-500/20 bg-gradient-to-br from-white/95 via-purple-50/40 to-slate-50/95 dark:from-slate-900/95 dark:via-purple-950/20 dark:to-slate-950/95 backdrop-blur-2xl shadow-xl shadow-purple-500/5 transition-all">
      {/* Top Banner & Header */}
      <div className="p-5 sm:p-6 pb-4 border-b border-purple-100 dark:border-white/5 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 shrink-0 ring-4 ring-purple-500/10">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-600 text-white shadow-xs">
                  AI Roadmap
                </span>
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300 font-mono">
                  CBSE Class 12 PCM
                </span>
                {plan?.difficultyRating && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                    {plan.difficultyRating}
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mt-1 flex items-center gap-2">
                <span>Rankify SmartPlan</span>
              </h2>

              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                Your AI generated study roadmap
              </p>
            </div>
          </div>

          {/* Quick Stats Pill Ribbon */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            {onRegeneratePlan && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRegeneratePlan}
                disabled={isRegenerating}
                className="h-8 text-xs font-semibold gap-1.5 rounded-xl cursor-pointer text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                title="Recalibrate AI roadmap using latest progress"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-purple-600 ${isRegenerating ? 'animate-spin' : ''}`} />
                <span>Recalibrate</span>
              </Button>
            )}

            {onOpenStudyTab && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenStudyTab}
                className="h-8 text-xs font-bold gap-1.5 rounded-xl border-purple-500/30 text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 cursor-pointer shadow-2xs"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Full SmartPlan</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* 5 Core Metrics Grid (Mandatory by Brief):
            1. Today's Goal
            2. Current Focus Chapter
            3. Pending Tasks
            4. Progress %
            5. Next Recommended Topic */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-5">
          {/* 1. Today's Goal */}
          <div className="col-span-2 lg:col-span-1 p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 shadow-xs">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-600 dark:text-purple-400">
              <Target className="w-3.5 h-3.5" />
              <span>Today's Goal</span>
            </div>
            <div className="text-xs sm:text-sm font-extrabold text-foreground truncate mt-1" title={todaysGoalTitle}>
              {todaysGoalTitle}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Goal: {plan?.todaysQuestions || 25} Practice Questions
            </div>
          </div>

          {/* 2. Current Focus Chapter */}
          <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 shadow-xs">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400">
              <Compass className="w-3.5 h-3.5" />
              <span>Current Focus</span>
            </div>
            <div className="text-xs sm:text-sm font-extrabold text-foreground truncate mt-1" title={currentFocusChapter}>
              {currentFocusChapter}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
              {plan?.todaysChapters?.join(', ') || 'Class 12 Core'}
            </div>
          </div>

          {/* 3. Pending Tasks */}
          <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 shadow-xs">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Tasks</span>
            </div>
            <div className="text-xs sm:text-sm font-extrabold font-mono text-foreground mt-1">
              {pendingTasksCount} of {totalTasksCount} Remaining
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {completedTasksCount} finished today
            </div>
          </div>

          {/* 4. Progress % */}
          <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Today's Progress</span>
              </div>
              <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">
                {progressPercent}%
              </span>
            </div>
            {/* Mini Progress bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-[10px] text-muted-foreground mt-1.5 flex items-center justify-between font-mono">
              <span>Overall: {overallCoverage}%</span>
              <span>Streak: {plan?.studyStreak || 1}d</span>
            </div>
          </div>

          {/* 5. Next Recommended Topic */}
          <div className="p-3.5 rounded-2xl bg-purple-500/10 dark:bg-purple-950/40 border border-purple-500/25 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-700 dark:text-purple-300">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span>Next Recommended</span>
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-foreground truncate mt-1" title={nextRecommendedTopic.title}>
                {nextRecommendedTopic.title}
              </div>
              <div className="text-[10px] text-purple-600 dark:text-purple-300 font-semibold truncate mt-0.5">
                {nextRecommendedTopic.subject} • {nextRecommendedTopic.reason}
              </div>
            </div>

            {onNavigateToAi && (
              <button
                type="button"
                onClick={() =>
                  onNavigateToAi({
                    subject: nextRecommendedTopic.subject,
                    chapter: nextRecommendedTopic.title,
                    difficulty: 'Board Level',
                    questionType: 'Concept',
                    query: `Explain ${nextRecommendedTopic.title} step by step for CBSE Boards`,
                  })
                }
                className="text-[10px] font-bold text-purple-600 dark:text-purple-300 hover:text-purple-700 flex items-center gap-1 mt-2 cursor-pointer transition-colors"
              >
                <span>Generate Study Prompt</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Strip: Daily Tasks | Weekly Targets | Weak Chapters | Revision Suggestions */}
      <div className="px-5 sm:px-6 py-2.5 bg-slate-100/50 dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'today', label: "Today's Actionable Tasks", count: tasks.length },
          { id: 'weekly', label: 'Weekly Targets', count: plan?.weeklyTargets?.length || 4 },
          { id: 'weak', label: 'Weak Chapter Plan', count: weakChapters.length || 3 },
          { id: 'revision', label: 'Revision Queue', count: plan?.revisionTasks?.length || 3 },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white/80 dark:bg-slate-800/80 text-muted-foreground hover:text-foreground hover:bg-white dark:hover:bg-slate-800 border border-slate-200/60 dark:border-white/5'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-muted-foreground'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="p-5 sm:p-6 pt-4">
        {/* TAB 1: DAILY TASKS */}
        {activeTab === 'today' && (
          <div className="space-y-3">
            {onAddNewTask && (
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-semibold text-muted-foreground">
                  Completing a task updates your syllabus, dashboard, and streaks in real time.
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAddNewTask}
                  className="h-7 text-xs font-bold gap-1 rounded-xl text-purple-600 dark:text-purple-300 border-purple-500/30 hover:bg-purple-50 dark:hover:bg-purple-950/40 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-purple-500" />
                  <span>+ Add Target</span>
                </Button>
              </div>
            )}
            {tasks.map((task) => {
              const isDone = task.isCompleted || task.status === 'completed';
              const isSkipped = task.status === 'skipped';

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isDone
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30 opacity-75'
                      : isSkipped
                      ? 'bg-slate-100/50 dark:bg-slate-900/30 border-slate-300/40 dark:border-white/5 opacity-60'
                      : 'bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-white/10 shadow-xs hover:border-purple-500/40'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isDone
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : isSkipped
                          ? 'bg-slate-300 dark:bg-slate-700 text-muted-foreground'
                          : 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300'
                      }`}
                    >
                      {isDone ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            task.subjectName === 'Physics'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                              : task.subjectName === 'Chemistry'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                          }`}
                        >
                          {task.subjectName}
                        </span>

                        <span className="text-[10px] font-semibold text-muted-foreground font-mono">
                          {task.allocatedMinutes} Mins
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            task.difficulty === 'Topper Level'
                              ? 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20'
                              : task.difficulty === 'Foundation'
                              ? 'text-teal-600 dark:text-teal-400 bg-teal-500/10 border-teal-500/20'
                              : 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20'
                          }`}
                        >
                          {task.difficulty || 'Board Target'}
                        </span>
                      </div>

                      <h4
                        className={`text-sm font-bold text-foreground leading-snug ${
                          isDone ? 'line-through text-muted-foreground' : ''
                        }`}
                      >
                        {task.taskTitle}
                      </h4>

                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <span>Chapter:</span>
                        <strong className="text-foreground">{task.chapterName}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Actions for Task: Ask AI, Skip, Complete */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {!isDone && !isSkipped && (
                      <>
                        {onNavigateToAi && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              onNavigateToAi({
                                subject: task.subjectName,
                                chapter: task.chapterName,
                                difficulty: 'Board Level',
                                questionType: 'Concept',
                                query: `Explain ${task.chapterName} with key formulas and derivations for today's task`,
                              })
                            }
                            className="text-xs h-8 px-2.5 rounded-xl font-bold border-purple-500/30 text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 cursor-pointer shadow-2xs"
                            title="Ask AI Coach about this task"
                          >
                            <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-500" />
                            <span>Ask AI</span>
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSkipTask(task.id)}
                          className="text-xs h-8 px-2.5 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          Skip
                        </Button>

                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => onCompleteTask(task.id)}
                          className="text-xs h-8 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer shadow-md shadow-purple-600/20"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          <span>Complete</span>
                        </Button>
                      </>
                    )}

                    {isDone && (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Completed</span>
                      </span>
                    )}

                    {isSkipped && (
                      <span className="text-xs text-muted-foreground italic">
                        Skipped
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: WEEKLY TARGETS */}
        {activeTab === 'weekly' && (
          <div className="space-y-3">
            {(plan?.weeklyTargets || [
              {
                id: 'w1',
                weekNumber: 1,
                title: 'Week 1: High Deficit Recovery & NCERT Foundations',
                goals: [
                  'Master Electric Charges & Coulomb’s Law',
                  'Solve 30 NCERT Solved Examples in Solutions',
                  'Matrices & Determinants Board PYQ sprint',
                ],
                isCompleted: false,
              },
              {
                id: 'w2',
                weekNumber: 2,
                title: 'Week 2: Advanced Derivations & Numericals Sprint',
                goals: [
                  'Gauss Theorem applications and electric dipole',
                  'Raoult’s Law and abnormal molar mass',
                  'Integrals substitution and integration by parts',
                ],
                isCompleted: false,
              },
            ]).map((wt) => (
              <div
                key={wt.id}
                className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                    {wt.title}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-300 font-bold">
                    Week {wt.weekNumber}
                  </span>
                </div>
                <div className="space-y-1.5 mt-2">
                  {wt.goals.map((g, gIdx) => (
                    <div key={gIdx} className="text-xs text-foreground/90 flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 mt-0.5 shrink-0" />
                      <span>{g}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: WEAK CHAPTER IMPROVEMENT PLAN */}
        {activeTab === 'weak' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="text-xs text-foreground font-semibold">
                  Chapters in Needs Focus rotate automatically when test accuracy reaches <strong>80%+</strong>.
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold shrink-0">
                Continuous Rebalance
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {weakChapters.map((ch, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-rose-200 dark:border-rose-950/40 shadow-xs space-y-2"
                >
                  <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                    Priority #{idx + 1}
                  </div>
                  <div className="text-sm font-extrabold text-foreground">{ch}</div>
                  <p className="text-[11px] text-muted-foreground">
                    Action Plan: Focus on NCERT derivations and 10-year Delhi PYQ drills.
                  </p>
                  {onNavigateToAi && (
                    <button
                      type="button"
                      onClick={() =>
                        onNavigateToAi({
                          chapter: ch,
                          difficulty: 'Board Level',
                          questionType: 'Important Questions',
                          query: `Top repeated board questions and memory tricks for ${ch}`,
                        })
                      }
                      className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer pt-1"
                    >
                      <span>Study Weak Subtopics</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: REVISION QUEUE & PRACTICE RECOMMENDATIONS */}
        {activeTab === 'revision' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground mb-2">
                <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
                <span>Spaced Revision Suggestions</span>
              </div>
              <div className="space-y-2.5">
                {(plan?.revisionTasks || [
                  { id: 'r1', title: 'Formula Recall: Ray Optics & Snell’s Law', chapterName: 'Ray Optics', subjectName: 'Physics', isCompleted: false },
                  { id: 'r2', title: 'Named Reactions: Aldol & Cannizzaro', chapterName: 'Aldehyde Ketone', subjectName: 'Chemistry', isCompleted: false },
                  { id: 'r3', title: 'Matrices Determinants Quick Drill', chapterName: 'Matrices', subjectName: 'Mathematics', isCompleted: false },
                ]).map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                        <RotateCcw className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-foreground">{rev.title}</h5>
                        <span className="text-[10px] text-muted-foreground">
                          {rev.subjectName} • {rev.chapterName}
                        </span>
                      </div>
                    </div>

                    {onNavigateToAi && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onNavigateToAi({
                            subject: rev.subjectName,
                            chapter: rev.chapterName,
                            difficulty: 'Board Level',
                            questionType: 'Revision',
                            query: `Quick one-shot revision notes and formulas for ${rev.chapterName}`,
                          })
                        }
                        className="text-xs font-bold text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-xl"
                      >
                        <span>Quick Revise</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Practice Recommendations */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-white/5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground mb-2">
                <Target className="w-3.5 h-3.5 text-indigo-600" />
                <span>Practice Recommendations</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    title: '10-Year Delhi PYQs Drill',
                    subject: 'Physics',
                    chapter: 'Electric Charges & Fields',
                    questions: 15,
                    type: 'Board PYQ',
                  },
                  {
                    title: 'NCERT Exemplar Numericals',
                    subject: 'Chemistry',
                    chapter: 'Solutions',
                    questions: 20,
                    type: 'High-Yield',
                  },
                  {
                    title: 'Speed & Step-Marking Sprint',
                    subject: 'Mathematics',
                    chapter: 'Integrals',
                    questions: 12,
                    type: 'HOTS',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                          {item.type}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground font-semibold">
                          {item.questions} Qs
                        </span>
                      </div>
                      <h6 className="text-xs font-extrabold text-foreground mt-1.5">{item.title}</h6>
                      <p className="text-[11px] text-muted-foreground">{item.subject} • {item.chapter}</p>
                    </div>

                    {onNavigateToAi && (
                      <button
                        type="button"
                        onClick={() =>
                          onNavigateToAi({
                            subject: item.subject,
                            chapter: item.chapter,
                            difficulty: 'Board Level',
                            questionType: item.type,
                            query: `Provide ${item.questions} high-yield ${item.type} practice problems for CBSE Class 12 ${item.chapter} with step-by-step solutions`,
                          })
                        }
                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer pt-1"
                      >
                        <span>Start Practice</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ambient decorative glow */}
      <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
    </Card>
  );
};
