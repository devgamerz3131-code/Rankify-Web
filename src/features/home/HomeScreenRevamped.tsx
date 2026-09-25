import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/hooks/use-auth';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { syncEngine } from '@/services/sync-engine';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Flame,
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle,
  RotateCcw,
  SkipForward,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Target,
  ArrowRight,
  BookOpen,
  Award,
  Zap,
  RefreshCw,
  Star,
  Quote,
  Activity,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface TaskItem {
  id: string;
  taskTitle: string;
  subjectName: string;
  chapterName: string;
  allocatedMinutes: number;
  isCompleted: boolean;
  status?: 'pending' | 'completed' | 'skipped';
}

export interface StudyStatistics {
  streak: number;
  completedTasksCount: number;
  todayProgressPercent: number;
  totalStudyMinutes: number;
  questionsSolved: number;
  lastActiveDate: string;
  updatedAt?: string;
}

const MOTIVATIONAL_QUOTES = [
  {
    quote: 'The secret of getting ahead is getting started. Break your complex tasks into manageable milestones.',
    author: 'Mark Twain',
  },
  {
    quote: 'Small disciplines repeated with consistency every day lead to great achievements gained slowly over time.',
    author: 'John C. Maxwell',
  },
  {
    quote: 'You do not rise to the level of your goals. You fall to the level of your systems.',
    author: 'James Clear',
  },
  {
    quote: 'Focus is a muscle. Every Pomodoro completed strengthens your mastery over the board syllabus.',
    author: 'Rankify Learning OS',
  },
];

/**
 * Clean Web Audio chime synthesizer for mission complete celebration
 */
function playCelebrationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + idx * 0.12 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 0.5);
    });
  } catch (e) {
    // Audio context may require prior interaction
  }
}

export const HomeScreenRevamped: React.FC = () => {
  const { user } = useAuth();
  const { setActiveTab } = useNavigation();
  const {
    studentDetails: contextDetails,
    chapterProgressMap: contextChapters,
    aiStudyPlan: contextPlan,
    upcomingExam: contextExam,
    updateChapterProgress,
  } = useOnboarding();

  // Real-time Firestore state with immediate local cache fallbacks
  const [profileData, setProfileData] = useState<{
    displayName?: string;
    board?: string;
    classNumber?: number;
    targetPercentage?: number;
    stream?: string;
  }>(() => {
    if (!user?.uid) return {};
    const cached = syncEngine.getLocalCache<Record<string, unknown>>('student_details', user.uid);
    return {
      displayName: (cached?.name as string) || user.displayName || 'Student',
      board: (cached?.board as string) || 'CBSE',
      classNumber: (cached?.classNumber as number) || 10,
      targetPercentage: (cached?.targetPercentage as number) || 92,
      stream: (cached?.stream as string) || 'general',
    };
  });

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    if (!user?.uid) return [];
    const cached = syncEngine.getLocalCache<any>('active_study_plan', user.uid);
    if (cached?.dailyTargets?.length) {
      return cached.dailyTargets.map((d: any) => ({
        id: d.id,
        taskTitle: d.taskTitle,
        subjectName: d.subjectName,
        chapterName: d.chapterName,
        allocatedMinutes: d.allocatedMinutes || 45,
        isCompleted: d.isCompleted || false,
        status: d.isCompleted ? 'completed' : 'pending',
      }));
    }
    return [];
  });

  const [statistics, setStatistics] = useState<StudyStatistics>(() => {
    if (!user?.uid) {
      return {
        streak: 1,
        completedTasksCount: 0,
        todayProgressPercent: 0,
        totalStudyMinutes: 0,
        questionsSolved: 0,
        lastActiveDate: new Date().toISOString().split('T')[0],
      };
    }
    const cached = syncEngine.getLocalCache<StudyStatistics>('study_statistics', user.uid);
    return (
      cached || {
        streak: 1,
        completedTasksCount: 0,
        todayProgressPercent: 0,
        totalStudyMinutes: 0,
        questionsSolved: 0,
        lastActiveDate: new Date().toISOString().split('T')[0],
      }
    );
  });

  const [examInfo, setExamInfo] = useState<{ examType: string; examDate: string }>({
    examType: contextExam.examType || 'Boards',
    examDate: contextExam.examDate || new Date(new Date().setMonth(new Date().getMonth() + 2)).toISOString().split('T')[0],
  });

  const [weakChapters, setWeakChapters] = useState<string[]>([]);
  const [hasCelebratedToday, setHasCelebratedToday] = useState(false);
  const [showCelebrationBanner, setShowCelebrationBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Subscribe to Firestore in Real Time
  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    const uid = user.uid;

    // A. User Profile Listener
    const unsubUser = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setProfileData((prev) => ({
            ...prev,
            displayName: data.displayName || prev.displayName,
            board: data.board || prev.board,
            classNumber: data.classNumber || prev.classNumber,
            targetPercentage: data.targetPercentage || prev.targetPercentage,
            stream: data.stream || prev.stream,
          }));
        }
      },
      (err) => console.warn('User listener error:', err)
    );

    // B. Study Plan Listener (study_plan/current or study_plan/active)
    const unsubPlanCurrent = onSnapshot(
      doc(db, 'users', uid, 'study_plan', 'current'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.dailyTasks?.length) {
            setTasks(data.dailyTasks);
          }
          if (data.weakChapters) {
            setWeakChapters(data.weakChapters);
          }
        }
        setIsLoading(false);
      },
      () => {
        // Fallback to study_plan/active
        const unsubPlanActive = onSnapshot(
          doc(db, 'users', uid, 'study_plan', 'active'),
          (snap2) => {
            if (snap2.exists()) {
              const data2 = snap2.data();
              if (data2.dailyTargets?.length) {
                setTasks(
                  data2.dailyTargets.map((d: any) => ({
                    id: d.id,
                    taskTitle: d.taskTitle,
                    subjectName: d.subjectName,
                    chapterName: d.chapterName,
                    allocatedMinutes: d.allocatedMinutes || 45,
                    isCompleted: d.isCompleted || false,
                    status: d.isCompleted ? 'completed' : 'pending',
                  }))
                );
              }
              if (data2.weakChapters) {
                setWeakChapters(data2.weakChapters);
              }
            }
            setIsLoading(false);
          },
          () => setIsLoading(false)
        );
        return () => unsubPlanActive();
      }
    );

    // C. Study Statistics Listener
    const unsubStats = onSnapshot(
      doc(db, 'users', uid, 'study_statistics', 'current'),
      (snap) => {
        if (snap.exists()) {
          setStatistics(snap.data() as StudyStatistics);
        }
      },
      () => {
        // Fallback root document study_statistics
        const unsubStatsDoc = onSnapshot(
          doc(db, 'users', uid, 'study_statistics'),
          (snap2) => {
            if (snap2.exists()) {
              setStatistics(snap2.data() as StudyStatistics);
            }
          },
          () => {}
        );
        return () => unsubStatsDoc();
      }
    );

    // D. Exam Information Listener
    const unsubExam = onSnapshot(
      doc(db, 'users', uid, 'exam_information', 'primary'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setExamInfo({
            examType: data.examType || 'Boards',
            examDate: data.examDate || '',
          });
        }
      },
      () => {}
    );

    return () => {
      unsubUser();
      unsubPlanCurrent();
      unsubStats();
      unsubExam();
    };
  }, [user?.uid]);

  // Derived Weak Chapters from context if not populated from Firestore yet
  useEffect(() => {
    if (weakChapters.length === 0 && contextChapters) {
      const weaks = Object.values(contextChapters)
        .filter((c) => c.confidence <= 2 || c.status === 'Need Revision')
        .map((c) => c.chapterName);
      if (weaks.length > 0) setWeakChapters(weaks);
    }
  }, [weakChapters.length, contextChapters]);

  // Dynamic Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  // Calculate Days Remaining for Exam
  const daysRemaining = useMemo(() => {
    if (!examInfo.examDate) return 45;
    const target = new Date(examInfo.examDate).getTime();
    const today = new Date().getTime();
    const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    return isNaN(diff) || diff < 0 ? 0 : diff;
  }, [examInfo.examDate]);

  // Completed Tasks Count & Progress %
  const completedCount = useMemo(() => tasks.filter((t) => t.isCompleted).length, [tasks]);
  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Check if all tasks completed and trigger celebration once
  useEffect(() => {
    if (totalTasks > 0 && completedCount === totalTasks && !hasCelebratedToday) {
      setHasCelebratedToday(true);
      setShowCelebrationBanner(true);
      playCelebrationChime();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#6366f1', '#ec4899', '#3b82f6', '#10b981'],
      });
    }
  }, [completedCount, totalTasks, hasCelebratedToday]);

  // 2. Task System Actions (Complete, Skip, Ask for New Task)
  const handleCompleteTask = async (taskId: string) => {
    if (!user?.uid) return;
    const uid = user.uid;

    const taskToUpdate = tasks.find((t) => t.id === taskId);
    if (!taskToUpdate) return;

    const nextTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, isCompleted: true, status: 'completed' as const } : t
    );
    setTasks(nextTasks);

    // Update study statistics
    const newStats: StudyStatistics = {
      ...statistics,
      streak: statistics.streak || 1,
      completedTasksCount: (statistics.completedTasksCount || 0) + 1,
      totalStudyMinutes: (statistics.totalStudyMinutes || 0) + (taskToUpdate.allocatedMinutes || 45),
      questionsSolved: (statistics.questionsSolved || 0) + 10,
      todayProgressPercent: Math.round(
        (nextTasks.filter((t) => t.isCompleted).length / nextTasks.length) * 100
      ),
      lastActiveDate: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    };
    setStatistics(newStats);

    toast.success(`Completed: ${taskToUpdate.taskTitle}`, {
      icon: '✅',
      duration: 3000,
    });

    // Sync to Firestore & local cache
    syncEngine.setLocalCache('study_statistics', newStats, uid);
    syncEngine.queueSync(uid, 'users', `${uid}/study_statistics/current`, newStats as unknown as Record<string, unknown>);
    syncEngine.queueSync(uid, 'users', `${uid}/study_statistics`, newStats as unknown as Record<string, unknown>);

    syncEngine.queueSync(
      uid,
      'users',
      `${uid}/study_plan/current`,
      {
        dailyTasks: nextTasks,
        updatedAt: new Date().toISOString(),
      },
      'update'
    );
  };

  const handleSkipTask = async (taskId: string) => {
    if (!user?.uid) return;
    const uid = user.uid;

    const nextTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, status: 'skipped' as const } : t
    );
    setTasks(nextTasks);
    toast('Task skipped. Added to upcoming revision schedule.', { icon: '⏭️' });

    syncEngine.queueSync(
      uid,
      'users',
      `${uid}/study_plan/current`,
      {
        dailyTasks: nextTasks,
        updatedAt: new Date().toISOString(),
      },
      'update'
    );
  };

  const handleAskNewTask = async () => {
    if (!user?.uid) return;
    const uid = user.uid;

    // Pick from weak chapters or general subjects
    const targetChapter =
      weakChapters.length > 0
        ? weakChapters[Math.floor(Math.random() * weakChapters.length)]
        : 'Important Board Concept Drill';

    const newTask: TaskItem = {
      id: `task_${Date.now()}`,
      taskTitle: `AI Target: Advanced NCERT Problem Drills in ${targetChapter}`,
      subjectName: profileData.stream === 'commerce' ? 'Accountancy' : 'Science & Math',
      chapterName: targetChapter,
      allocatedMinutes: 45,
      isCompleted: false,
      status: 'pending',
    };

    const nextTasks = [...tasks, newTask];
    setTasks(nextTasks);
    setShowCelebrationBanner(false);

    toast.success('Generated personalized AI study task!', { icon: '✨' });

    syncEngine.queueSync(
      uid,
      'users',
      `${uid}/study_plan/current`,
      {
        dailyTasks: nextTasks,
        updatedAt: new Date().toISOString(),
      },
      'update'
    );
  };

  // Rotating Motivational Quote of the Day
  const dailyQuote = useMemo(() => {
    const day = new Date().getDate();
    return MOTIVATIONAL_QUOTES[day % MOTIVATIONAL_QUOTES.length];
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 1. Header Greeting & Status Ribbon */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950 p-6 sm:p-8 text-white shadow-2xl border border-purple-500/25">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-3.5 py-1 text-xs font-semibold text-purple-200 border border-white/15">
              <Sparkles className="h-3.5 w-3.5 text-purple-300" />
              <span>
                {profileData.board || 'CBSE'} Class {profileData.classNumber || 10} • Target{' '}
                {profileData.targetPercentage || 92}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold font-mono">
                <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{statistics.streak || 1} Day Streak</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {greeting}, {profileData.displayName || user?.displayName || 'Student'} 🔥
            </h1>
            <p className="text-xs sm:text-sm text-purple-100/80 max-w-2xl leading-relaxed">
              Your personalized Rankify study engine is active. Today is calibrated to build mastery
              across weak areas while maintaining your pace toward the{' '}
              {profileData.board || 'CBSE'} board exam.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-purple-200">
                <Target className="w-3.5 h-3.5" />
                <span>Today's Goal</span>
              </div>
              <div className="text-xl font-extrabold font-mono mt-1">
                {completedCount} / {totalTasks} Done
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-purple-200">
                <Clock className="w-3.5 h-3.5" />
                <span>Study Minutes</span>
              </div>
              <div className="text-xl font-extrabold font-mono mt-1">
                {statistics.totalStudyMinutes || 0}m
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-purple-200">
                <Calendar className="w-3.5 h-3.5" />
                <span>Exam Countdown</span>
              </div>
              <div className="text-xl font-extrabold font-mono mt-1 text-purple-200">
                {daysRemaining} Days
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-purple-200">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />
                <span>Focus Areas</span>
              </div>
              <div className="text-xl font-extrabold font-mono mt-1 text-rose-300">
                {weakChapters.length} Weak
              </div>
            </div>
          </div>
        </div>

        {/* Ambient Glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* 2. Today's Progress Bar Card */}
      <Card className="p-5 sm:p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-foreground">Today's Study Progress</h3>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300">
                {progressPercent}% Complete
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Complete your daily targets to protect your {statistics.streak || 1}-day study streak.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAskNewTask}
              className="text-xs font-semibold gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Ask for New Task</span>
            </Button>
          </div>
        </div>

        {/* Bar */}
        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700/60 shadow-inner">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
            transition={{ ease: 'easeOut', duration: 0.5 }}
          />
        </div>
      </Card>

      {/* 3. Mission Completed Celebration Banner (Requirement 7) */}
      <AnimatePresence>
        {showCelebrationBanner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 text-white border border-emerald-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-2xl">
                🔥
              </div>
              <div>
                <h4 className="text-lg font-extrabold text-white">
                  🔥 Excellent! Today's mission completed!
                </h4>
                <p className="text-xs text-emerald-200/90 mt-0.5">
                  You conquered all recommended daily tasks and protected your streak. Would you like to keep the momentum going?
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="primary"
                onClick={handleAskNewTask}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 h-10 rounded-xl shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                <span>Continue Studying (More Tasks)</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. AI Recommended Tasks System (Requirement 7) */}
      <Card className="p-5 sm:p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>AI Recommended Tasks</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Dynamically synthesized according to board weightage and weak chapter recovery.
            </p>
          </div>
          <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 font-mono">
            {completedCount} of {totalTasks} Completed
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <p className="text-xs text-muted-foreground">No tasks scheduled yet.</p>
            <Button size="sm" onClick={handleAskNewTask} className="text-xs">
              Generate Today's Tasks
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const isDone = task.isCompleted || task.status === 'completed';
              const isSkipped = task.status === 'skipped';

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isDone
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30 line-through opacity-75'
                      : isSkipped
                      ? 'bg-slate-100/50 dark:bg-slate-800/20 border-slate-300 dark:border-slate-800 opacity-60'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-white/5 hover:border-purple-500/40 shadow-xs'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <button
                      type="button"
                      onClick={() => !isDone && handleCompleteTask(task.id)}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center transition shrink-0 cursor-pointer mt-0.5 sm:mt-0 ${
                        isDone
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:border-purple-500'
                      }`}
                    >
                      {isDone && <CheckCircle2 className="w-4 h-4" />}
                    </button>

                    <div>
                      <div className="font-bold text-xs sm:text-sm text-foreground">
                        {task.taskTitle}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-2 mt-0.5">
                        <span className="font-semibold text-purple-600 dark:text-purple-400">
                          {task.subjectName}
                        </span>
                        <span>•</span>
                        <span>{task.chapterName}</span>
                        <span>•</span>
                        <span className="font-mono">{task.allocatedMinutes} mins</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Complete, Skip */}
                  {!isDone && !isSkipped && (
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSkipTask(task.id)}
                        className="text-[11px] h-8 px-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <SkipForward className="w-3.5 h-3.5 mr-1" />
                        <span>Skip</span>
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleCompleteTask(task.id)}
                        className="text-xs h-8 px-3.5 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white cursor-pointer shadow-sm shadow-purple-600/30"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        <span>Complete</span>
                      </Button>
                    </div>
                  )}

                  {isDone && (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 self-end sm:self-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Completed</span>
                    </span>
                  )}

                  {isSkipped && (
                    <span className="text-xs text-muted-foreground italic self-end sm:self-center">
                      Skipped
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* 5. Two Column Grid: Weak Chapters & Upcoming Exams */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: Weak Chapters Card */}
        <Card className="p-5 sm:p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <h3 className="font-bold text-sm text-foreground">Priority Focus Chapters</h3>
              </div>
              <span className="text-[11px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                Needs Reinforcement
              </span>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              Identified with low confidence or flagged for urgent formula revision before exams.
            </p>

            {weakChapters.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>No high-risk weak chapters found! Keep reviewing regularly.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {weakChapters.slice(0, 4).map((ch, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-white/5 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-foreground line-clamp-1">{ch}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('study')}
                      className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline shrink-0 cursor-pointer"
                    >
                      Study →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="text-muted-foreground font-medium">Interactive Syllabus</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('study')}
              className="text-xs text-purple-600 dark:text-purple-400 font-bold p-0 h-auto cursor-pointer"
            >
              <span>View All Chapters ({Object.keys(contextChapters).length})</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </Card>

        {/* Right: Upcoming Exam & Countdown Card */}
        <Card className="p-5 sm:p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-sm text-foreground">Upcoming Examination</h3>
              </div>
              <span className="text-[11px] font-mono font-bold text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                {examInfo.examType}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 border border-purple-200/60 dark:border-purple-500/20 mb-4">
              <div className="text-xs text-muted-foreground font-semibold">Target Finish Buffer</div>
              <div className="text-3xl font-extrabold text-foreground font-mono mt-1">
                {daysRemaining}{' '}
                <span className="text-xs font-normal text-muted-foreground">Days Remaining</span>
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-300 font-medium mt-1">
                Scheduled for {examInfo.examDate || 'Board Season 2026'}
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Target Score:</span>
                <span className="font-bold text-foreground">
                  {profileData.targetPercentage || 92}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Board Track:</span>
                <span className="font-bold text-foreground">
                  {profileData.board || 'CBSE'} Class {profileData.classNumber || 10}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="text-muted-foreground font-medium">Diagnostic HUD</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('progress')}
              className="text-xs text-purple-600 dark:text-purple-400 font-bold p-0 h-auto cursor-pointer"
            >
              <span>View Progress Analytics</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </Card>
      </div>

      {/* 6. Motivational Mindset Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white border border-purple-500/30 shadow-md flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
          <Quote className="w-5 h-5 text-purple-300" />
        </div>
        <div className="space-y-0.5 flex-1">
          <p className="text-xs sm:text-sm font-medium text-purple-100 italic">
            "{dailyQuote.quote}"
          </p>
          <span className="text-[10px] font-mono text-purple-300 block">
            — {dailyQuote.author}
          </span>
        </div>
      </div>
    </div>
  );
};
