import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/hooks/use-auth';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { syncEngine } from '@/services/sync-engine';
import { rebalanceNeedsFocus } from '@/services/ai-plan-generator';
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
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ProgressPercentage } from '@/types/onboarding';
import { analytics } from '@/services/analytics';
import { achievementsService } from '@/services/achievements-service';
import { ShareCardModal } from '@/components/common/ShareCardModal';
import { Share2 } from 'lucide-react';

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

/**
 * Web Audio chime for mission completion celebration
 */
function playCelebrationChime() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
    // Audio context may require user interaction
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
      board: 'CBSE',
      classNumber: 12,
      targetPercentage: (cached?.targetPercentage as number) || 95,
      stream: 'science-pcm',
    };
  });

  const [planState, setPlanState] = useState<{
    todaysMission: string;
    todaysChapters: string[];
    todaysQuestions: number;
    revisionTasks: { id: string; title: string; chapterName: string; subjectName: string; isCompleted: boolean }[];
    focusTopic: string;
    estimatedCompletion: string;
    motivation: string;
    accuracy: number;
    weakestChapter: string;
    strongestChapter: string;
    dailyGoal: { minutes: number; tasksCount: number };
    weakChapters: string[];
  }>(() => {
    return {
      todaysMission: contextPlan?.todaysMission || 'Physics & Calculus Mastery Sprint',
      todaysChapters: contextPlan?.todaysChapters || ['Electric Charges and Fields', 'Solutions', 'Integrals'],
      todaysQuestions: contextPlan?.todaysQuestions || 25,
      revisionTasks: contextPlan?.revisionTasks || [
        { id: 'rev_1', title: 'Formula Recall: Ray Optics & Snell’s Law', chapterName: 'Ray Optics', subjectName: 'Physics', isCompleted: false },
        { id: 'rev_2', title: 'Named Reactions: Aldol & Cannizzaro', chapterName: 'Aldehyde Ketone', subjectName: 'Chemistry', isCompleted: false },
        { id: 'rev_3', title: 'Matrices Determinants Quick Drill', chapterName: 'Matrices', subjectName: 'Mathematics', isCompleted: false },
      ],
      focusTopic: contextPlan?.focusTopic || 'Electric Charges & Coulomb’s Law',
      estimatedCompletion: contextPlan?.estimatedCompletion || 'Jan 30, 2027',
      motivation: contextPlan?.motivation || 'Consistency in solving 25 questions daily guarantees CBSE Class 12 PCM distinction.',
      accuracy: contextPlan?.accuracy || 82,
      weakestChapter: contextPlan?.weakestChapter || 'Optics & Differential Equations',
      strongestChapter: contextPlan?.strongestChapter || 'Current Electricity & Matrices',
      dailyGoal: contextPlan?.dailyGoal || { minutes: 240, tasksCount: 4 },
      weakChapters: contextPlan?.weakChapters || ['Wave Optics', 'Electrochemistry', 'Differential Equations'],
    };
  });

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    if (!user?.uid) return [];
    const cached = syncEngine.getLocalCache<any>('active_study_plan', user.uid);
    if (cached?.dailyTasks?.length) {
      return cached.dailyTasks;
    }
    return [
      {
        id: 'task_p1',
        taskTitle: 'Physics: Electric Charges & Gauss Theorem NCERT Derivations',
        subjectName: 'Physics',
        chapterName: 'Electric Charges and Fields',
        allocatedMinutes: 60,
        isCompleted: false,
        status: 'pending',
      },
      {
        id: 'task_c1',
        taskTitle: 'Chemistry: Colligative Properties & Raoult’s Law Numericals',
        subjectName: 'Chemistry',
        chapterName: 'Solutions',
        allocatedMinutes: 50,
        isCompleted: false,
        status: 'pending',
      },
      {
        id: 'task_m1',
        taskTitle: 'Maths: 15 High-Yield Definite Integrals Problems',
        subjectName: 'Mathematics',
        chapterName: 'Integrals',
        allocatedMinutes: 60,
        isCompleted: false,
        status: 'pending',
      },
      {
        id: 'task_rev1',
        taskTitle: 'Needs Focus Drill: Active Recall & Formula Sheets',
        subjectName: 'Physics',
        chapterName: 'Ray Optics',
        allocatedMinutes: 30,
        isCompleted: false,
        status: 'pending',
      },
    ];
  });

  const [statistics, setStatistics] = useState<StudyStatistics>(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (!user?.uid) {
      return {
        streak: 1,
        completedTasksCount: 0,
        todayProgressPercent: 0,
        totalStudyMinutes: 0,
        questionsSolved: 0,
        lastActiveDate: todayStr,
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
        lastActiveDate: todayStr,
      }
    );
  });

  const [examDateStr, setExamDateStr] = useState<string>(
    contextExam.examDate || new Date(new Date().setMonth(new Date().getMonth() + 2)).toISOString().split('T')[0]
  );

  const [hasCelebratedToday, setHasCelebratedToday] = useState(false);
  const [showCelebrationBanner, setShowCelebrationBanner] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // 1. DAILY RESET ENGINE (Section 7)
  // Every midnight Today's progress resets to 0%. Overall progress NEVER resets.
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (statistics.lastActiveDate && statistics.lastActiveDate !== todayStr) {
      console.log('Daily Reset: New day detected, resetting today’s progress to 0%...');
      const resetStats: StudyStatistics = {
        ...statistics,
        todayProgressPercent: 0,
        lastActiveDate: todayStr,
        updatedAt: new Date().toISOString(),
      };
      setStatistics(resetStats);
      setTasks((prev) => prev.map((t) => ({ ...t, isCompleted: false, status: 'pending' as const })));
      setShowCelebrationBanner(false);
      setHasCelebratedToday(false);

      if (user?.uid) {
        syncEngine.queueSync(user.uid, 'users', `${user.uid}/study_statistics`, resetStats as unknown as Record<string, unknown>);
        syncEngine.queueSync(user.uid, 'users', `${user.uid}/study_statistics/current`, resetStats as unknown as Record<string, unknown>);
      }
    }
  }, [statistics, user?.uid]);

  // 2. Real-time Firestore Listeners
  useEffect(() => {
    if (!user?.uid) return;
    const uid = user.uid;

    const unsubUser = onSnapshot(doc(db, 'users', uid), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setProfileData((prev) => ({
          ...prev,
          displayName: d.displayName || prev.displayName,
          targetPercentage: d.targetPercentage || prev.targetPercentage,
        }));
      }
    });

    const unsubPlan = onSnapshot(doc(db, 'users', uid, 'study_plan', 'current'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.dailyTasks?.length) setTasks(d.dailyTasks);
        setPlanState((prev) => ({
          ...prev,
          todaysMission: d.todaysMission || prev.todaysMission,
          todaysChapters: d.todaysChapters || prev.todaysChapters,
          todaysQuestions: d.todaysQuestions || prev.todaysQuestions,
          revisionTasks: d.revisionTasks || prev.revisionTasks,
          focusTopic: d.focusTopic || prev.focusTopic,
          estimatedCompletion: d.estimatedCompletion || prev.estimatedCompletion,
          motivation: d.motivation || prev.motivation,
          accuracy: d.accuracy || prev.accuracy,
          weakestChapter: d.weakestChapter || prev.weakestChapter,
          strongestChapter: d.strongestChapter || prev.strongestChapter,
          dailyGoal: d.dailyGoal || prev.dailyGoal,
          weakChapters: d.weakChapters || prev.weakChapters,
        }));
      }
    });

    const unsubStats = onSnapshot(doc(db, 'users', uid, 'study_statistics', 'current'), (snap) => {
      if (snap.exists()) {
        setStatistics(snap.data() as StudyStatistics);
      }
    }, () => {
      onSnapshot(doc(db, 'users', uid, 'study_statistics'), (snap2) => {
        if (snap2.exists()) setStatistics(snap2.data() as StudyStatistics);
      });
    });

    return () => {
      unsubUser();
      unsubPlan();
      unsubStats();
    };
  }, [user?.uid]);

  // Dynamic Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  // Exam Countdown in days
  const daysRemaining = useMemo(() => {
    const target = new Date(examDateStr).getTime();
    const today = new Date().getTime();
    const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    return isNaN(diff) || diff < 0 ? 0 : diff;
  }, [examDateStr]);

  // Overall syllabus progress calculation
  const chaptersList = useMemo(() => Object.values(contextChapters), [contextChapters]);
  const overallCoverage = useMemo(() => {
    if (chaptersList.length === 0) return 35;
    const sum = chaptersList.reduce((acc, c) => acc + (c.progressPercentage || 0), 0);
    return Math.round(sum / chaptersList.length);
  }, [chaptersList]);

  // Completed tasks count & Today's Progress percentage
  const completedCount = useMemo(() => tasks.filter((t) => t.isCompleted).length, [tasks]);
  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Celebration trigger when all daily tasks are completed
  useEffect(() => {
    if (totalTasks > 0 && completedCount === totalTasks && !hasCelebratedToday) {
      setHasCelebratedToday(true);
      setShowCelebrationBanner(true);
      playCelebrationChime();
      confetti({
        particleCount: 130,
        spread: 85,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#6366f1', '#ec4899', '#3b82f6', '#10b981'],
      });
    }
  }, [completedCount, totalTasks, hasCelebratedToday]);

  // 3. AUTO TASK ENGINE (Section 8 & 9)
  const handleCompleteTask = async (taskId: string) => {
    if (!user?.uid) return;
    const uid = user.uid;

    const taskToUpdate = tasks.find((t) => t.id === taskId);
    if (!taskToUpdate) return;

    const nextTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, isCompleted: true, status: 'completed' as const } : t
    );
    setTasks(nextTasks);

    const newCompletedCount = nextTasks.filter((t) => t.isCompleted).length;
    const newProgressPercent = Math.round((newCompletedCount / nextTasks.length) * 100);

    // Update study statistics instantly
    const newStats: StudyStatistics = {
      ...statistics,
      streak: statistics.streak || 1,
      completedTasksCount: (statistics.completedTasksCount || 0) + 1,
      totalStudyMinutes: (statistics.totalStudyMinutes || 0) + (taskToUpdate.allocatedMinutes || 45),
      questionsSolved: (statistics.questionsSolved || 0) + 10,
      todayProgressPercent: newProgressPercent,
      lastActiveDate: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    };
    setStatistics(newStats);

    // Update the associated chapter progress
    const associatedChapter = chaptersList.find(
      (c) => c.chapterName.toLowerCase() === taskToUpdate.chapterName.toLowerCase()
    );

    if (associatedChapter) {
      const nextProgress = Math.min(100, (associatedChapter.progressPercentage || 0) + 25) as ProgressPercentage;
      const nextAccuracy = Math.min(100, Math.max(55, (associatedChapter.accuracy || 65) + 8));
      const nextQuestions = (associatedChapter.practiceQuestions || 0) + 10;
      const nextRevisions = (associatedChapter.revisionCount || 0) + 1;

      updateChapterProgress(associatedChapter.id, {
        progressPercentage: nextProgress,
        accuracy: nextAccuracy,
        practiceQuestions: nextQuestions,
        revisionCount: nextRevisions,
        timeSpent: (associatedChapter.timeSpent || 0) + (taskToUpdate.allocatedMinutes || 45),
        lastStudied: new Date().toISOString(),
      });

      // Continuous Rebalance for Needs Focus (Section 9)
      const currentSnapshot = chaptersList.map((c) =>
        c.id === associatedChapter.id
          ? {
              ...c,
              progressPercentage: nextProgress,
              accuracy: nextAccuracy,
              practiceQuestions: nextQuestions,
              revisionCount: nextRevisions,
            }
          : c
      );

      const { focusChapters, graduatedChapters } = rebalanceNeedsFocus(currentSnapshot);
      if (graduatedChapters.length > 0) {
        toast.success(
          `Mastery achieved! ${graduatedChapters[0]} graduated from Needs Focus. Syllabus priorities updated.`,
          { duration: 4000, icon: '🎓' }
        );
      }

      if (focusChapters[0]) {
        setPlanState((prev) => ({
          ...prev,
          focusTopic: focusChapters[0].topics?.[0] || `${focusChapters[0].chapterName} Core Drills`,
          weakestChapter: focusChapters[0].chapterName,
        }));
      }
    }

    toast.success(`Completed: ${taskToUpdate.taskTitle}`, { icon: '✅' });

    // Track analytics & evaluate gamified achievements
    analytics.trackTaskCompleted(taskToUpdate.subjectName, taskToUpdate.chapterName, taskToUpdate.taskTitle);
    achievementsService.evaluateProgress({
      streak: newStats.streak,
      totalMinutes: newStats.totalStudyMinutes,
      questionsSolved: newStats.questionsSolved,
    });

    // Sync to Firestore immediately
    syncEngine.setLocalCache('study_statistics', newStats, uid);
    syncEngine.queueSync(uid, 'users', `${uid}/study_statistics`, newStats as unknown as Record<string, unknown>);
    syncEngine.queueSync(uid, 'users', `${uid}/study_statistics/current`, newStats as unknown as Record<string, unknown>);
    syncEngine.queueSync(
      uid,
      'users',
      `${uid}/study_plan/current`,
      {
        dailyTasks: nextTasks,
        todayProgressPercent: newProgressPercent,
        updatedAt: new Date().toISOString(),
      },
      'update'
    );
  };

  const handleSkipTask = (taskId: string) => {
    if (!user?.uid) return;
    const nextTasks = tasks.map((t) => (t.id === taskId ? { ...t, status: 'skipped' as const } : t));
    setTasks(nextTasks);
    toast('Task skipped and moved to tomorrow’s revision queue.', { icon: '⏭️' });

    syncEngine.queueSync(
      user.uid,
      'users',
      `${user.uid}/study_plan/current`,
      {
        dailyTasks: nextTasks,
        updatedAt: new Date().toISOString(),
      },
      'update'
    );
  };

  const handleAddNewTask = () => {
    if (!user?.uid) return;
    const targetChapter = planState.weakestChapter || 'Electromagnetic Induction';

    const newTask: TaskItem = {
      id: `task_${Date.now()}`,
      taskTitle: `Extra Target: Advanced Exemplar Drills in ${targetChapter}`,
      subjectName: 'Physics',
      chapterName: targetChapter,
      allocatedMinutes: 45,
      isCompleted: false,
      status: 'pending',
    };

    const nextTasks = [...tasks, newTask];
    setTasks(nextTasks);
    setShowCelebrationBanner(false);
    toast.success('Generated fresh challenge task!', { icon: '✨' });

    syncEngine.queueSync(
      user.uid,
      'users',
      `${user.uid}/study_plan/current`,
      {
        dailyTasks: nextTasks,
        updatedAt: new Date().toISOString(),
      },
      'update'
    );
  };

  const handleToggleRevisionTask = (revId: string) => {
    setPlanState((prev) => ({
      ...prev,
      revisionTasks: prev.revisionTasks.map((r) =>
        r.id === revId ? { ...r, isCompleted: !r.isCompleted } : r
      ),
    }));
    toast.success('Revision logged! Strengthened memory retention.');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 1. Header Hero Banner with Dynamic Greeting, Streak, Mission & Goal */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950 p-6 sm:p-8 text-white shadow-2xl border border-purple-500/25">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-3.5 py-1 text-xs font-semibold text-purple-200 border border-white/15">
              <Sparkles className="h-3.5 w-3.5 text-purple-300" />
              <span>CBSE Class 12 PCM • Target {profileData.targetPercentage}%</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold font-mono">
                <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{statistics.streak || 1} Day Streak</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {greeting}, {profileData.displayName || user?.displayName || 'Student'} 🔥
            </h1>
            <div className="text-xs sm:text-sm text-purple-100/90 font-medium flex items-center gap-2 pt-0.5">
              <span className="text-purple-300 font-bold">Today's Mission:</span>
              <span className="text-white font-semibold underline decoration-purple-400">
                {planState.todaysMission}
              </span>
            </div>
          </div>

          {/* Key Metrics Ribbon: Daily Goal, Accuracy, Questions, Exam Countdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-purple-200">
                <Target className="w-3.5 h-3.5" />
                <span>Daily Goal</span>
              </div>
              <div className="text-xl font-extrabold font-mono mt-1">
                {completedCount} / {totalTasks} Tasks
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
                <Activity className="w-3.5 h-3.5 text-emerald-300" />
                <span>Accuracy</span>
              </div>
              <div className="text-xl font-extrabold font-mono mt-1 text-emerald-300">
                {planState.accuracy}%
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-purple-200">
                <Calendar className="w-3.5 h-3.5 text-purple-300" />
                <span>Exam Countdown</span>
              </div>
              <div className="text-xl font-extrabold font-mono mt-1 text-purple-200">
                {daysRemaining} Days
              </div>
            </div>
          </div>
        </div>

        {/* Ambient Glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* 2. Today's Progress Bar Card (Resets every midnight) */}
      <Card className="p-5 sm:p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-foreground">Today's Progress (Daily Reset)</h3>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300">
                {progressPercent}% Today
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground">
                Overall Syllabus: {overallCoverage}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Today's targets reset every midnight. Overall Class 12 PCM syllabus progress is permanent.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddNewTask}
              className="text-xs font-semibold gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Add Study Target</span>
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700/60 shadow-inner">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
            transition={{ ease: 'easeOut', duration: 0.5 }}
          />
        </div>
      </Card>

      {/* 3. Mission Completed Celebration Banner */}
      <AnimatePresence>
        {showCelebrationBanner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 text-white border border-emerald-500/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-3xl animate-bounce">
                🎉
              </div>
              <div>
                <h4 className="text-lg sm:text-xl font-black text-white">
                  🎉 Great Job! Today's target completed.
                </h4>
                <p className="text-xs text-emerald-200/90 mt-1 max-w-lg">
                  You conquered your daily CBSE Class 12 tasks! Keep your momentum active with extra revisions or practice tests.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 shrink-0">
              <button
                onClick={() => setShowShareModal(true)}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Milestone</span>
              </button>

              <button
                onClick={handleAddNewTask}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add More Tasks</span>
              </button>

              <button
                onClick={() => setActiveTab('study')}
                className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-white/20 cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Continue Revision</span>
              </button>

              <button
                onClick={() => setActiveTab('practice')}
                className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-white/20 cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <Target className="w-3.5 h-3.5" />
                <span>Take Practice Test</span>
              </button>

              <button
                onClick={() => setActiveTab('progress')}
                className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-white/20 cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>View Progress</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Today's Active Chapters Ribbon */}
      <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-bold text-foreground">Today's Focus Chapters:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {planState.todaysChapters.map((ch, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20"
            >
              <span>{ch}</span>
            </span>
          ))}
          <span className="text-xs font-mono font-semibold text-muted-foreground ml-1">
            Goal: {planState.todaysQuestions} Questions
          </span>
        </div>
      </div>

      {/* 5. Auto Task Engine: Daily Tasks System */}
      <Card className="p-5 sm:p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Today's Actionable Tasks</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Completing a task instantly updates your dashboard, statistics, and chapter completion without refreshing.
            </p>
          </div>
          <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 font-mono">
            {completedCount} of {totalTasks} Completed
          </span>
        </div>

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
      </Card>

      {/* 6. Dynamic Diagnostics: Weakest vs Strongest Chapter + Needs Focus Rebalancer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Needs Focus & Weakest Chapter */}
        <Card className="p-5 sm:p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <h3 className="font-bold text-sm text-foreground">Needs Focus (Priority Chapters)</h3>
              </div>
              <span className="text-[11px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                Rotates on 80%+ Accuracy
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 mb-4 space-y-1">
              <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">
                Current Priority Focus Topic
              </div>
              <div className="text-sm font-extrabold text-foreground">
                {planState.focusTopic}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Weakest Chapter: <strong className="text-rose-500">{planState.weakestChapter}</strong>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-3">
              Needs Focus never stays static. Once you practice enough questions and reach 80%+ accuracy, Rankify automatically moves it to Mastered and promotes the next weak chapter.
            </p>

            <div className="space-y-2">
              {planState.weakChapters.slice(0, 3).map((ch, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-white/5 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-foreground">{ch}</span>
                  <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded">
                    Priority Focus
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Strongest Chapter:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {planState.strongestChapter}
            </span>
          </div>
        </Card>

        {/* Scheduled Revision Tasks & Exam Target */}
        <Card className="p-5 sm:p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-sm text-foreground">Active Spaced Revision Tasks</h3>
              </div>
              <span className="text-[11px] font-mono font-bold text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                Spaced Recall
              </span>
            </div>

            <div className="space-y-2.5 mb-4">
              {planState.revisionTasks.map((rev) => (
                <div
                  key={rev.id}
                  onClick={() => handleToggleRevisionTask(rev.id)}
                  className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                    rev.isCompleted
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30 line-through opacity-70'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-white/5 hover:border-purple-500/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] ${
                        rev.isCompleted
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {rev.isCompleted && <Check className="w-3 h-3" />}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-foreground">{rev.title}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {rev.subjectName} • {rev.chapterName}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-500/20 text-xs space-y-1">
              <div className="text-muted-foreground font-medium">Estimated Syllabus Finish:</div>
              <div className="text-sm font-extrabold text-purple-700 dark:text-purple-300">
                {planState.estimatedCompletion}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Leaves 15+ days buffer for official CBSE Class 12 PCM mock papers.
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="text-muted-foreground font-medium">Interactive Syllabus:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('study')}
              className="text-xs text-purple-600 dark:text-purple-400 font-bold p-0 h-auto cursor-pointer"
            >
              <span>View All 40 Chapters</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </Card>
      </div>

      {/* 7. Quick Actions Hub */}
      <div className="p-5 rounded-3xl bg-card/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-sm text-foreground">Quick Board Actions</h3>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            1-Click Launchers
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setActiveTab('study')}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 hover:border-purple-500 hover:shadow-md transition-all text-left space-y-1.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-foreground">Active Revision</div>
            <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">High-Yield Formulae</p>
          </button>

          <button
            onClick={() => setActiveTab('practice')}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 hover:border-purple-500 hover:shadow-md transition-all text-left space-y-1.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Target className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-foreground">Solve Board PYQs</div>
            <p className="text-[10px] text-muted-foreground">10-Year CBSE bank</p>
          </button>

          <button
            onClick={() => setActiveTab('study')}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 hover:border-purple-500 hover:shadow-md transition-all text-left space-y-1.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-foreground">37 Chapters</div>
            <p className="text-[10px] text-muted-foreground">Official CBSE syllabus</p>
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 hover:border-purple-500 hover:shadow-md transition-all text-left space-y-1.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-foreground">Diagnostic Stats</div>
            <p className="text-[10px] text-muted-foreground">Accuracy & Weak areas</p>
          </button>
        </div>
      </div>

      {/* 8. Recent Doubts & Recent Activity Split Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Priority Revision Hub */}
        <Card className="p-5 sm:p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-sm text-foreground">Priority Revision Hub</h3>
              </div>
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800/40">
                Board Focus
              </span>
            </div>

            <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Review high-weightage chapters, practice NCERT derivations, and solve previous 10-year CBSE board question sets.
              </p>
              <button
                onClick={() => setActiveTab('practice')}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-xs cursor-pointer hover:bg-purple-500 transition-colors"
              >
                Practice Questions
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="text-muted-foreground font-medium">CBSE Question Bank:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('study')}
              className="text-xs text-purple-600 dark:text-purple-400 font-bold p-0 h-auto cursor-pointer"
            >
              <span>Explore Curriculum</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </Card>

        {/* Recent Dynamic Activity Feed */}
        <Card className="p-5 sm:p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-foreground">Recent Study Activity</h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                Real-time
              </span>
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-white/5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <div>
                    <span className="font-bold text-foreground">Daily Mission Synchronized</span>
                    <p className="text-[10px] text-muted-foreground">
                      {completedCount} of {totalTasks} tasks completed today
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">Today</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-white/5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center font-bold text-xs">
                    ★
                  </div>
                  <div>
                    <span className="font-bold text-foreground">Syllabus Progress Verified</span>
                    <p className="text-[10px] text-muted-foreground">
                      {overallCoverage}% of CBSE Class 12 PCM completed
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">Active</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-white/5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold text-xs">
                    🔥
                  </div>
                  <div>
                    <span className="font-bold text-foreground">Streak Protected</span>
                    <p className="text-[10px] text-muted-foreground">
                      {statistics.streak || 1} day active learning streak maintained
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">Live</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="text-muted-foreground font-medium">Continue your streak:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('study')}
              className="text-xs text-emerald-600 dark:text-emerald-400 font-bold p-0 h-auto cursor-pointer"
            >
              <span>Continue Studying</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </Card>
      </div>

      {/* 9. Dynamic Motivation Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white border border-purple-500/30 shadow-md flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
          <Quote className="w-5 h-5 text-purple-300" />
        </div>
        <div className="space-y-0.5 flex-1">
          <p className="text-xs sm:text-sm font-medium text-purple-100 italic">
            "{planState.motivation}"
          </p>
          <span className="text-[10px] font-mono text-purple-300 block">
            — Rankify Academic Coach (CBSE Class 12 PCM)
          </span>
        </div>
      </div>

      {/* Share Milestone Modal */}
      <ShareCardModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        studentName={profileData.displayName || user?.displayName || 'Scholar'}
        streak={statistics.streak}
        studyMinutes={statistics.totalStudyMinutes || 120}
        tasksCompleted={completedCount}
        totalTasks={totalTasks}
        daysToExam={daysRemaining}
        targetScore={profileData.targetPercentage || 95}
      />
    </div>
  );
};
