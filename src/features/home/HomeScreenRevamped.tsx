import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/hooks/use-auth';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { syncEngine } from '@/services/sync-engine';
import { safeLocalStorage } from '@/utils/storage';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Bell,
  Flame,
  Sparkles,
  Play,
  ArrowRight,
  Clock,
  Target,
  CheckCircle2,
  Check,
  RotateCcw,
  Compass,
  Brain,
  BookOpen,
  Zap,
  Award,
  Video,
  ChevronRight,
  PlusCircle,
  HelpCircle,
  TrendingUp,
  Trophy,
  Rocket,
  FileText,
  Moon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { questionGeneratorService } from '@/services/question-generator-service';
import { MissionCompleteModal } from '@/features/mission/MissionCompleteModal';
import {
  dailyMissionService,
  DailyMissionReport,
  getTodayDateString,
  generatePersonalizedAiSummary,
  getDynamicMotivationQuote,
  calculateMissionAchievements,
  generateBonusPracticeTasks,
  TaskItem,
} from '@/services/daily-mission-service';
import {
  TOTAL_OFFICIAL_CHAPTERS,
  sanitizeTask,
  sanitizeTasks,
} from '@/services/chapter-service';
import { getWeakestSubjectAndPriorityChapter } from '@/services/weakness-service';
import { mistakeService } from '@/services/mistake-service';
import { readinessService } from '@/services/readiness-service';

export type { TaskItem };

export interface StudyStatistics {
  streak: number;
  completedTasksCount: number;
  todayProgressPercent: number;
  totalStudyMinutes: number;
  questionsSolved: number;
  lastActiveDate: string;
}

function playCelebrationChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
      ctx.resume().catch(() => {});
    }
    const notes = [523.25, 659.25, 783.99, 1046.5];
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
      if (idx === notes.length - 1) {
        osc.onended = () => {
          if (typeof ctx.close === 'function') {
            ctx.close().catch(() => {});
          }
        };
      }
    });
  } catch {
    // Audio context fallback
  }
}

export const HomeScreenRevamped: React.FC = () => {
  const { user } = useAuth();
  const { setActiveTab } = useNavigation();
  const {
    studentDetails,
    chapterProgressMap: contextChapters,
    aiStudyPlan: contextPlan,
    upcomingExam: contextExam,
  } = useOnboarding();

  // Tasks state (Always provides full 6-task PCM daily mission)
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    const userId = user?.uid || 'guest';
    const cached = syncEngine.getLocalCache<{ dailyTasks?: TaskItem[] }>('active_study_plan', userId);
    if (cached?.dailyTasks && cached.dailyTasks.length >= 5) {
      return sanitizeTasks(cached.dailyTasks);
    }
    return sanitizeTasks(dailyMissionService.generateFreshMissionTasks(userId));
  });

  // Statistics (Starts from zero for newly registered students)
  const [statistics, setStatistics] = useState<StudyStatistics>(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (!user?.uid) {
      return {
        streak: 0,
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
        streak: 0,
        completedTasksCount: 0,
        todayProgressPercent: 0,
        totalStudyMinutes: 0,
        questionsSolved: 0,
        lastActiveDate: todayStr,
      }
    );
  });

  // Real-time synchronization of study statistics from Firestore
  useEffect(() => {
    if (!user?.uid) return;
    const statsDocRef = doc(db, 'users', user.uid, 'study_statistics', 'current');
    const unsub = onSnapshot(
      statsDocRef,
      (snap) => {
        if (snap.exists()) {
          const remoteStats = snap.data() as StudyStatistics;
          if (remoteStats) {
            setStatistics((prev) => ({ ...prev, ...remoteStats }));
            syncEngine.setLocalCache('study_statistics', remoteStats, user.uid);
          }
        }
      },
      (err) => console.warn('Study statistics listener notice:', err)
    );

    return () => unsub();
  }, [user?.uid]);

  // Previous Session (Continue Learning - null if no study session started yet)
  const previousSession = useMemo(() => {
    const chList = Object.values(contextChapters || {});
    const activeCh = chList.find((c) => c.progressPercentage > 0 && c.progressPercentage < 100);
    if (activeCh) {
      return {
        chapterName: activeCh.chapterName,
        subjectName: activeCh.subjectName,
        progressPercentage: activeCh.progressPercentage,
      };
    }
    return null;
  }, [contextChapters]);

  // Days remaining (Safari-safe local date calculation)
  const daysRemaining = useMemo(() => {
    if (!contextExam?.examDate) return 74;
    const parts = contextExam.examDate.split('-');
    if (parts.length === 3) {
      const target = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diff = target.getTime() - today.getTime();
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
    const diff = new Date(contextExam.examDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [contextExam?.examDate]);

  // Time of day greeting
  const greetingText = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const studentName = studentDetails?.name || user?.displayName?.split(' ')[0] || 'Student';

  // Mission Complete & Celebration States
  const [missionReport, setMissionReport] = useState<DailyMissionReport | null>(null);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const todayStr = useMemo(() => getTodayDateString(), []);

  // 1. Check for day transition or task reset: ensure all 6 tasks are loaded and fresh
  useEffect(() => {
    const userId = user?.uid || 'guest';
    const planDateKey = `rankify_plan_date_${userId}`;
    const storedDate = safeLocalStorage.getItem<string | null>(planDateKey, null);
    const resetMarkerKey = `rankify_reset_6tasks_applied_${todayStr}_${userId}`;
    const alreadyAppliedReset = safeLocalStorage.getItem<string | null>(resetMarkerKey, null);

    if ((storedDate && storedDate !== todayStr) || !alreadyAppliedReset || tasks.length < 5) {
      // Fresh mission targets: generate full set of 6 tasks and reset today's state
      const freshTasks = dailyMissionService.generateFreshMissionTasks(userId);
      setTasks(freshTasks);
      setMissionReport(null);
      setIsCelebrationOpen(false);
      safeLocalStorage.setItem(planDateKey, todayStr);
      safeLocalStorage.setItem(resetMarkerKey, 'true');
      dailyMissionService.resetTodayMission(userId, todayStr);
      syncEngine.setLocalCache('active_study_plan', { dailyTasks: freshTasks, date: todayStr }, userId);
      if (user?.uid) {
        syncEngine.queueSync(user.uid, 'users', `${user.uid}/study_plan/current`, { dailyTasks: freshTasks, date: todayStr }, 'set');
      }
    } else if (!storedDate) {
      safeLocalStorage.setItem(planDateKey, todayStr);
    }
  }, [user?.uid, todayStr]);

  // 2. Check if today's celebration was already completed or needs re-opening
  useEffect(() => {
    const existing = dailyMissionService.getStoredReport(user?.uid || 'guest', todayStr);
    if (existing && existing.completedAt) {
      setMissionReport(existing);
      // Edge case: if user left during celebration without dismissing, show once on reopen
      if (!existing.isDismissed) {
        setIsCelebrationOpen(true);
      }
    }
  }, [user?.uid, todayStr]);

  // AI Insight (Derived from real onboarding details - zero fake benchmarks)
  const singleAiInsight = useMemo(() => {
    if (studentDetails?.targetPercentage) {
      return `Targeting ${studentDetails.targetPercentage}% in ${studentDetails.board} Class 12. Complete today's tasks to stay on track.`;
    }
    return 'Welcome to Rankify! Solve practice questions and explore formulas to unlock personalized AI insights.';
  }, [studentDetails]);

  // Derived Readiness, Weakest Subject & Highest Priority Chapter from real user data
  const { overallReadiness, weakestSubjectDisplay, highestPriorityChapterDisplay } = useMemo(() => {
    const chapters = Object.values(contextChapters || {});
    const mistakes = mistakeService.getMistakes();
    const result = getWeakestSubjectAndPriorityChapter(chapters, mistakes);

    const cachedReadiness = readinessService.getCachedData();
    let readinessVal = 0;
    if (cachedReadiness && typeof cachedReadiness.overallScore === 'number') {
      readinessVal = cachedReadiness.overallScore;
    } else if (chapters.length > 0) {
      const sum = chapters.reduce(
        (acc, c) => acc + (c.progressPercentage || c.completionPercentage || 0),
        0
      );
      readinessVal = Math.round(sum / chapters.length);
    }

    return {
      overallReadiness: readinessVal,
      weakestSubjectDisplay: result.weakestSubjectName || '-',
      highestPriorityChapterDisplay: result.highestPriorityChapterName || '-',
    };
  }, [contextChapters]);

  // Task filtering: Required tasks vs. Optional Bonus practice
  const requiredTasks = useMemo(() => tasks.filter((t) => !t.isBonus), [tasks]);
  const bonusTasks = useMemo(() => tasks.filter((t) => t.isBonus), [tasks]);
  const completedRequiredCount = useMemo(() => requiredTasks.filter((t) => t.isCompleted).length, [requiredTasks]);
  const totalRequiredCount = requiredTasks.length;
  const isMissionCompleted = useMemo(() => {
    if (missionReport?.completedAt) return true;
    return totalRequiredCount > 0 && completedRequiredCount === totalRequiredCount;
  }, [missionReport, totalRequiredCount, completedRequiredCount]);

  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const totalTasksCount = tasks.length;
  const taskProgressPercent = totalRequiredCount > 0 ? Math.round((completedRequiredCount / totalRequiredCount) * 100) : 0;

  // Toggle task handler
  const handleToggleTask = useCallback(
    (taskId: string) => {
      const nextTasks = tasks.map((t) => {
        if (t.id === taskId) {
          const nextVal = !t.isCompleted;
          return {
            ...t,
            isCompleted: nextVal,
            status: nextVal ? ('completed' as const) : ('pending' as const),
          };
        }
        return t;
      });
      setTasks(nextTasks);

      const activeRequired = nextTasks.filter((t) => !t.isBonus);
      const allRequiredDone = activeRequired.length > 0 && activeRequired.every((t) => t.isCompleted);
      const nextCompletedRequired = activeRequired.filter((t) => t.isCompleted).length;

      // Auto Detection: Trigger celebration automatically when 100% of required tasks are completed
      if (allRequiredDone) {
        const existingReport = dailyMissionService.getStoredReport(user?.uid || 'guest', todayStr);
        if (!existingReport || !existingReport.completedAt) {
          const studyMins = activeRequired.reduce((acc, t) => acc + (t.allocatedMinutes || 30), 0) || 150;
          const questionsCount = Math.max(25, (statistics.questionsSolved || 0) + 15);
          const newStreak = (statistics.streak || 0) + 1;

          const newReport: DailyMissionReport = {
            date: todayStr,
            completedAt: new Date().toISOString(),
            studyMinutes: studyMins,
            tasksCompleted: activeRequired.length,
            totalTasks: activeRequired.length,
            questionsSolved: questionsCount,
            revisionCompleted: 2,
            lecturesCompleted: 1,
            flashcardsReviewed: 15,
            mistakesFixed: 3,
            aiSessions: 2,
            xpEarned: 350,
            currentStreak: newStreak,
            aiSummary: generatePersonalizedAiSummary(nextTasks, studentName, studentDetails?.targetPercentage || 95),
            motivationalQuote: getDynamicMotivationQuote(newStreak),
            unlockedAchievements: calculateMissionAchievements(newStreak, questionsCount, 2),
            bonusTasks: nextTasks.filter((t) => t.isBonus),
            isDismissed: false,
          };

          setMissionReport(newReport);
          dailyMissionService.saveReport(user?.uid || 'guest', newReport);
          playCelebrationChime();
          setIsCelebrationOpen(true);
        }
      }

      if (user?.uid) {
        const completedTotal = nextTasks.filter((t) => t.isCompleted).length;
        const percent = activeRequired.length > 0 ? Math.round((nextCompletedRequired / activeRequired.length) * 100) : 0;

        const updatedStats = {
          ...statistics,
          completedTasksCount: completedTotal,
          todayProgressPercent: percent,
          lastActiveDate: todayStr,
        };
        setStatistics(updatedStats);
        syncEngine.setLocalCache('study_statistics', updatedStats, user.uid);
        syncEngine.queueSync(
          user.uid,
          'users',
          `${user.uid}/study_statistics/current`,
          updatedStats,
          'set'
        );

        syncEngine.setLocalCache('active_study_plan', { dailyTasks: nextTasks }, user.uid);
        syncEngine.queueSync(user.uid, 'users', `${user.uid}/study_plan/current`, { dailyTasks: nextTasks }, 'set');
      }
    },
    [user?.uid, todayStr, studentName, studentDetails?.targetPercentage, statistics, tasks]
  );

  // Done for Today button handler
  const handleDoneForToday = useCallback(() => {
    setIsCelebrationOpen(false);
    dailyMissionService.markReportDismissed(user?.uid || 'guest', todayStr);
    toast.success('🌙 Daily mission saved. Rest well tonight!', { icon: '✨' });
  }, [user?.uid, todayStr]);

  // Extra Practice button handler
  const handleStartExtraPractice = useCallback(() => {
    setIsCelebrationOpen(false);
    const alreadyHasBonus = tasks.some((t) => t.isBonus);
    if (alreadyHasBonus) {
      toast('Scroll down to solve your optional bonus practice drills!', { icon: '🚀' });
      return;
    }

    const newBonus = generateBonusPracticeTasks(
      user?.uid || 'guest',
      tasks,
      contextChapters
    );
    const combined = sanitizeTasks([...tasks, ...newBonus]);
    setTasks(combined);

    syncEngine.setLocalCache('active_study_plan', { dailyTasks: combined }, user?.uid || 'guest');
    if (user?.uid) {
      syncEngine.queueSync(user.uid, 'users', `${user.uid}/study_plan/current`, { dailyTasks: combined }, 'set');
    }
    toast.success('🚀 3 Bonus practice tasks generated! Optional • No Penalty.', { icon: '🎯' });
  }, [user?.uid, tasks, contextChapters]);

  // Reset Today's Tasks button handler
  const handleResetTodayTasks = useCallback(() => {
    const userId = user?.uid || 'guest';
    const freshTasks = sanitizeTasks(dailyMissionService.generateFreshMissionTasks(userId));
    setTasks(freshTasks);
    setMissionReport(null);
    setIsCelebrationOpen(false);

    dailyMissionService.resetTodayMission(userId, todayStr);

    syncEngine.setLocalCache('active_study_plan', { dailyTasks: freshTasks, date: todayStr }, userId);
    if (user?.uid) {
      syncEngine.queueSync(
        user.uid,
        'users',
        `${user.uid}/study_plan/current`,
        { dailyTasks: freshTasks, date: todayStr },
        'set'
      );
    }

    setStatistics((prev) => {
      const updatedStats = {
        ...prev,
        completedTasksCount: 0,
        todayProgressPercent: 0,
        lastActiveDate: todayStr,
      };
      syncEngine.setLocalCache('study_statistics', updatedStats, userId);
      if (user?.uid) {
        syncEngine.queueSync(
          user.uid,
          'users',
          `${user.uid}/study_statistics/current`,
          updatedStats,
          'set'
        );
      }
      return updatedStats;
    });

    toast.success("Today's tasks reset! All 6 missions are fresh and ready.", { icon: '🔄' });
  }, [user?.uid, todayStr]);

  const handleNotificationClick = () => {
    toast('3 study reminders scheduled for today', { icon: '🔔' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 select-none px-1 sm:px-2">
      {/* ========================================================
          1. TOP APP BAR
          ======================================================== */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between pt-1 pb-2 border-b border-border"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('profile')}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 text-white flex items-center justify-center font-bold text-sm shadow-md cursor-pointer border border-white/20 hover:scale-105 transition-transform shrink-0"
          >
            {studentName.charAt(0).toUpperCase()}
          </button>
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              {greetingText}
            </span>
            <h1 className="text-base sm:text-lg font-black text-foreground leading-tight">
              {studentName}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Streak Badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-500/30"
            title={statistics.streak > 0 ? `${statistics.streak} Day Study Streak` : 'Start your study streak today!'}
          >
            <Flame className={`w-4 h-4 text-amber-500 ${statistics.streak > 0 ? 'fill-amber-500 animate-pulse' : 'opacity-60'}`} />
            <span>{statistics.streak > 0 ? `${statistics.streak} Days` : '0 Days'}</span>
          </div>

          {/* Notification Button */}
          <button
            onClick={handleNotificationClick}
            className="p-2 rounded-full bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* ========================================================
          2. HERO SECTION
          ======================================================== */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05 }}
      >
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 text-white shadow-xl border border-purple-500/30 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
                isMissionCompleted
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                  : 'bg-purple-500/20 text-purple-200 border-purple-400/30'
              }`}
            >
              {isMissionCompleted ? (
                <Check className="w-3.5 h-3.5 text-emerald-300 stroke-[3]" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              )}
              <span>{isMissionCompleted ? "Today's Mission: ✅ Completed" : "Today's AI Briefing"}</span>
            </span>

            <div className="flex items-center gap-2 font-mono text-xs font-bold text-amber-300 bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/30">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{daysRemaining} Days to CBSE Exam</span>
            </div>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Goal: {isMissionCompleted ? "Today's Mission ✅ Completed" : (contextPlan?.todaysMission || 'Physics & Calculus Mastery Sprint')}
            </h2>
            <p className="text-xs sm:text-sm text-purple-200 italic mt-1 font-medium">
              "{contextPlan?.motivation || 'Consistent daily practice builds strong concepts and steady exam confidence.'}"
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/10 text-xs">
            <div>
              <span className="text-purple-200/80 text-[10px] uppercase font-bold block">Estimated Study Time</span>
              <span className="text-base font-extrabold text-white font-mono">
                {contextPlan?.dailyGoal?.minutes || 240} Minutes
              </span>
            </div>
            <div>
              <span className="text-purple-200/80 text-[10px] uppercase font-bold block">Target Score Goal</span>
              <span className="text-base font-extrabold text-emerald-300 font-mono">
                {studentDetails?.targetPercentage || 95}% PCM
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => setActiveTab('study')}
              className="w-full sm:w-auto rounded-xl text-xs font-extrabold gap-2 cursor-pointer shadow-md"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Studying</span>
            </Button>

            <Button
              variant="outline"
              size="md"
              onClick={() => setActiveTab('study')}
              className="w-full sm:w-auto rounded-xl text-xs font-bold border-slate-700 text-white hover:bg-slate-800 cursor-pointer gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Continue Previous Session</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ========================================================
          HALF-YEARLY PERFORMANCE ANALYZER ENTRY CARD
          ======================================================== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <Card 
          onClick={() => setActiveTab('halfyearly')}
          className="p-5 sm:p-6 bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-slate-900 border border-purple-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:border-purple-500/60 shadow-lg shadow-purple-500/[0.03] transition-all group"
        >
          <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
            <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-600/25 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="space-y-0.5 min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-black text-foreground flex flex-wrap items-center gap-2 leading-snug">
                <span>📊 Analyze Half-Yearly Performance</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 whitespace-nowrap shrink-0">
                  AI Plan
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Upload your Half-Yearly marks and let Rankify AI create a personalized improvement plan.
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl text-xs font-bold text-purple-600 dark:text-purple-400 gap-1.5 p-0 sm:px-3 hover:bg-transparent group-hover:translate-x-1 transition-transform cursor-pointer shrink-0 whitespace-nowrap self-end sm:self-center"
          >
            <span>Analyze Now</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Card>
      </motion.div>

      {/* ========================================================
          3. TODAY'S TASKS / MISSION COMPLETE CARD
          ======================================================== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {isMissionCompleted ? (
          <Card className="p-5 sm:p-6 bg-gradient-to-r from-emerald-950/20 via-card to-purple-950/20 border border-emerald-500/40 rounded-2xl shadow-md shadow-emerald-500/5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30 shadow-xs">
                  <Trophy className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-foreground tracking-tight">
                      🎉 Mission Complete!
                    </h3>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono">
                      ✅ 100% Target Met
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    You completed all AI-generated study goals for today. Rest well or challenge yourself with optional bonus drills!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
                  {statistics.streak > 0 ? `${statistics.streak} Days 🔥` : '1 Day 🔥'}
                </span>
              </div>
            </div>

            {/* Actions: Primary actions separated from Reset Tasks */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCelebrationOpen(true)}
                  className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer border-purple-500/30 hover:bg-purple-500/10 text-purple-700 dark:text-purple-300 whitespace-nowrap min-h-[44px] lg:min-h-0"
                >
                  <FileText className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>See Today's Report</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('study')}
                  className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer whitespace-nowrap min-h-[44px] lg:min-h-0"
                >
                  <Compass className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Review Progress</span>
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleStartExtraPractice}
                  className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer shadow-xs whitespace-nowrap min-h-[44px] lg:min-h-0"
                >
                  <Rocket className="w-3.5 h-3.5 shrink-0" />
                  <span>Start Bonus Practice</span>
                </Button>
              </div>

              <div className="pt-2 lg:pt-0 border-t lg:border-t-0 lg:border-l border-border lg:pl-3 flex justify-end shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetTodayTasks}
                  className="w-full sm:w-auto rounded-xl text-xs font-bold gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground whitespace-nowrap min-h-[44px] lg:min-h-0"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Reset Tasks</span>
                </Button>
              </div>
            </div>

            {/* Bonus Practice Tasks Section (If student generated bonus tasks) */}
            {bonusTasks.length > 0 && (
              <div className="pt-3 border-t border-border space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <h4 className="text-xs font-bold text-foreground">Bonus Practice Tasks</h4>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-mono">
                    Optional • No Penalty
                  </span>
                </div>

                <div className="space-y-2">
                  {bonusTasks.map((rawTask) => {
                    const task = sanitizeTask(rawTask);
                    return (
                      <div
                        key={task.id}
                        onClick={() => handleToggleTask(task.id)}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          task.isCompleted
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30 line-through opacity-75'
                            : 'bg-muted/40 border-border hover:border-purple-500/40'
                        }`}
                      >
                        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                          <div
                            className={`mt-0.5 sm:mt-0 w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 text-xs transition-colors ${
                              task.isCompleted
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {task.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-xs text-foreground line-clamp-2 leading-snug break-words">{task.taskTitle}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-muted-foreground font-medium">
                              <span>{task.subjectName}</span>
                              <span>•</span>
                              <span>{task.chapterName}</span>
                              <span>•</span>
                              <span>{task.allocatedMinutes}m</span>
                              <span className="sm:hidden text-[9px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-mono">
                                Bonus
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="hidden sm:flex shrink-0 items-center gap-2">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-mono">
                            Bonus
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        ) : (
          <Card className="p-5 sm:p-6 bg-card border border-border rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-sm text-foreground">Today's Tasks</h3>
                <span className="text-[11px] font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                  {completedRequiredCount} / {totalRequiredCount}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetTodayTasks}
                  className="h-9 lg:h-8 px-2.5 text-xs font-semibold rounded-xl text-muted-foreground hover:text-foreground border-border hover:bg-muted/80 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  title="Reset today's tasks"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Reset Tasks</span>
                </Button>
              </div>
            </div>

            <div className="space-y-2.5">
              {tasks.length === 0 ? (
                <div className="p-6 text-center rounded-2xl border border-dashed border-border text-muted-foreground space-y-1.5">
                  <Sparkles className="w-5 h-5 mx-auto text-purple-500 mb-1" />
                  <p className="text-xs font-bold text-foreground">No tasks scheduled for today</p>
                  <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                    Click Reset Tasks to generate your personalized 6-target daily study mission.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetTodayTasks}
                    className="mt-2 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3 mr-1 text-purple-600" />
                    <span>Generate Today's Tasks</span>
                  </Button>
                </div>
              ) : (
                tasks.map((rawTask) => {
                  const task = sanitizeTask(rawTask);
                  return (
                    <div
                      key={task.id}
                      onClick={() => handleToggleTask(task.id)}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        task.isCompleted
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/40 line-through opacity-75'
                          : 'bg-muted border-border hover:border-purple-500/50'
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`mt-0.5 sm:mt-0 w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 text-xs transition-colors ${
                            task.isCompleted
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {task.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs text-foreground line-clamp-2 leading-snug break-words">
                            {task.taskTitle}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-muted-foreground font-medium">
                            <span>{task.subjectName}</span>
                            <span>•</span>
                            <span>{task.allocatedMinutes}m</span>
                            <span
                              className={`sm:hidden text-[9px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap ${
                                task.priority === 'High'
                                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                  : 'bg-background/80 text-muted-foreground border border-border'
                              }`}
                            >
                              {task.priority || 'Medium'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <span
                          className={`hidden sm:inline-block text-[9px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap ${
                            task.priority === 'High'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : 'bg-muted text-muted-foreground border border-border'
                          }`}
                        >
                          {task.priority || 'Medium'}
                        </span>
                        <div className="w-11 h-11 lg:w-8 lg:h-8 min-w-[44px] min-h-[44px] lg:min-w-0 lg:min-h-0 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                          <Play className="w-3.5 h-3.5 lg:w-3 lg:h-3 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        )}
      </motion.div>

      {/* ========================================================
          4. CONTINUE LEARNING (Only displayed if previous study exists)
          ======================================================== */}
      {previousSession && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="p-5 bg-card border border-border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                    Continue Learning
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold">
                    {previousSession.subjectName}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  {previousSession.chapterName}
                </h3>
                <div className="w-48 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full"
                    style={{ width: `${previousSession.progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setActiveTab('study')}
              className="rounded-xl text-xs font-bold gap-2 shrink-0 cursor-pointer shadow-sm"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Card>
        </motion.div>
      )}

      {/* ========================================================
          5. TODAY'S PROGRESS (Compact Card with Animated Circular Progress)
          ======================================================== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-5 sm:p-6 bg-card border border-border rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-sm text-foreground">Today's Progress</h3>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              {taskProgressPercent}%
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Animated Circular Progress Ring */}
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-muted dark:text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-purple-600 transition-all duration-1000 ease-out"
                  strokeDasharray={`${taskProgressPercent}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-xl font-black font-mono text-foreground">{taskProgressPercent}%</span>
                <span className="text-[9px] uppercase font-bold text-muted-foreground block">Complete</span>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full text-xs">
              <div className="p-3 rounded-xl bg-muted border border-border space-y-0.5">
                <span className="text-[10px] text-muted-foreground block font-medium">Study Time</span>
                <span className="text-base font-black text-foreground font-mono">
                  {statistics.totalStudyMinutes || 140}m
                </span>
              </div>

              <div className="p-3 rounded-xl bg-muted border border-border space-y-0.5">
                <span className="text-[10px] text-muted-foreground block font-medium">Tasks Done</span>
                <span className="text-base font-black text-foreground font-mono">
                  {completedCount} / {totalTasksCount}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-muted border border-border space-y-0.5">
                <span className="text-[10px] text-muted-foreground block font-medium">Questions Solved</span>
                <span className="text-base font-black text-purple-600 dark:text-purple-400 font-mono">
                  {statistics.questionsSolved || 0}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-muted border border-border space-y-0.5">
                <span className="text-[10px] text-muted-foreground block font-medium">Current Readiness</span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {overallReadiness}%
                </span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ========================================================
          6. AI INSIGHT (Exactly ONE single card at a time)
          ======================================================== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="p-4 sm:p-5 bg-card border border-border rounded-2xl flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
            <Brain className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
              Study Coach • Daily Tip
            </span>
            <p className="text-xs sm:text-sm font-semibold text-foreground leading-snug mt-0.5">
              {singleAiInsight}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('ai')}
            className="text-xs font-bold text-purple-600 dark:text-purple-400 shrink-0 p-1 cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Card>
      </motion.div>

      {/* ========================================================
          7. QUICK ACTIONS (Only 4 actions)
          ======================================================== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-600" />
              <h3 className="font-bold text-sm text-foreground">Quick Actions</h3>
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Core Study Tools
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Action 1: Study */}
            <button
              onClick={() => setActiveTab('study')}
              className="p-4 rounded-2xl bg-card border border-border hover:border-purple-500/50 hover:shadow-sm transition-all text-left space-y-2 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Study</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">{TOTAL_OFFICIAL_CHAPTERS} CBSE Chapters</p>
              </div>
            </button>

            {/* Action 2: Ask AI */}
            <button
              onClick={() => setActiveTab('ai')}
              className="p-4 rounded-2xl bg-card border border-border hover:border-purple-500/50 hover:shadow-sm transition-all text-left space-y-2 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Ask AI</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">Instant Doubt Solver</p>
              </div>
            </button>

            {/* Action 3: Revision */}
            <button
              onClick={() => setActiveTab('revision')}
              className="p-4 rounded-2xl bg-card border border-border hover:border-purple-500/50 hover:shadow-sm transition-all text-left space-y-2 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Revision</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">Spaced Repetition</p>
              </div>
            </button>
          </div>
        </div>
      </motion.div>

      {/* ========================================================
          8. EXAM STATUS (Compact Card)
          ======================================================== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card className="p-5 sm:p-6 bg-card border border-border rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-purple-600" />
              <h3 className="font-bold text-sm text-foreground">Exam Status</h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
              CBSE Class 12 PCM
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-muted border border-border space-y-0.5">
              <span className="text-[10px] text-muted-foreground block font-medium">Days Remaining</span>
              <span className="text-base font-black text-amber-600 dark:text-amber-400 font-mono">
                {daysRemaining} Days
              </span>
            </div>

            <div className="p-3 rounded-xl bg-muted border border-border space-y-0.5">
              <span className="text-[10px] text-muted-foreground block font-medium">Overall Readiness</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {overallReadiness}%
              </span>
            </div>

            <div className="p-3 rounded-xl bg-muted border border-border space-y-0.5 min-w-0">
              <span className="text-[10px] text-muted-foreground block font-medium">Weakest Subject</span>
              <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400 block line-clamp-2 leading-snug break-words">
                {weakestSubjectDisplay}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-muted border border-border space-y-0.5 min-w-0">
              <span className="text-[10px] text-muted-foreground block font-medium">Highest Priority</span>
              <span
                className="text-xs font-extrabold text-purple-600 dark:text-purple-400 block line-clamp-2 leading-snug break-words"
                title={highestPriorityChapterDisplay}
              >
                {highestPriorityChapterDisplay}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-border flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setActiveTab('command')}
              className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer"
            >
              <span>Open Command Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>
      </motion.div>


      {/* Premium Mission Complete Celebration Overlay */}
      <MissionCompleteModal
        isOpen={isCelebrationOpen}
        report={missionReport}
        onDoneForToday={handleDoneForToday}
        onStartExtraPractice={handleStartExtraPractice}
        onClose={() => setIsCelebrationOpen(false)}
      />
    </div>
  );
};
