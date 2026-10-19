import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { syncEngine } from '@/services/sync-engine';
import { useAuth } from '@/hooks/use-auth';
import {
  TaskItem,
  DailyMissionReport,
  dailyMissionService,
  calculateMissionAchievements,
  generatePersonalizedAiSummary,
  getDynamicMotivationQuote,
  generateBonusPracticeTasks,
} from '@/services/daily-mission-service';
import { sanitizeTasks } from '@/services/chapter-service';
import { formatTime } from '@/utils/formatters';

export interface TodayStats {
  todayStr: string;
  tasks: TaskItem[];
  requiredTasks: TaskItem[];
  bonusTasks: TaskItem[];
  requiredDone: number;
  requiredTotal: number;
  percent: number;
  bonusDone: number;
  bonusTotal: number;
  studyMinutes: number;
  studyTimeFormatted: string;
  questionsSolved: number;
  missionCompleted: boolean;
  xpToday: number;
  streak: number;
  streakLabel: string;
  missionReport: DailyMissionReport | null;
  isCelebrationOpen: boolean;
  toggleTask: (taskId: string) => void;
  startExtraPractice: () => void;
  resetTodayTasks: () => void;
  dismissCelebration: () => void;
  openCelebration: () => void;
}

export interface StoredStudyStatistics {
  streak: number;
  lastActiveDate: string;
  totalStudyMinutes: number;
  questionsSolved: number;
  todayProgressPercent: number;
  completedTasksCount: number;
  xpTotal?: number;
  updatedAt?: string;
}

// iOS Safari-safe local calendar date YYYY-MM-DD
export function getLocalTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatStreak(days: number): string {
  const count = Math.max(0, days);
  return count === 1 ? '1 Day' : `${count} Days`;
}

// Global subscriber set to keep all components synced in-memory immediately
type StatsListener = () => void;
const listeners = new Set<StatsListener>();
function notifyListeners() {
  listeners.forEach((l) => {
    try {
      l();
    } catch (e) {
      console.warn('Stats listener error:', e);
    }
  });
}

// In-memory single state reference
let inMemoryDate = getLocalTodayDateString();
let inMemoryTasks: TaskItem[] | null = null;
let inMemoryStats: StoredStudyStatistics | null = null;
let inMemoryReport: DailyMissionReport | null = null;
let inMemoryCelebrationOpen = false;

export function useTodayStats(): TodayStats {
  const { user } = useAuth();
  const userId = user?.uid || 'guest';
  const [, setTick] = useState(0);

  // Subscribe to changes
  useEffect(() => {
    const handleUpdate = () => setTick((t) => t + 1);
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  // Check date rollover on visibilitychange, focus, or interval
  const checkRollover = useCallback(() => {
    const freshDate = getLocalTodayDateString();
    if (freshDate !== inMemoryDate) {
      inMemoryDate = freshDate;
      // Day rollover: load/generate fresh tasks for the new day
      const planKey = `rankify_plan_date_${userId}`;
      try {
        localStorage.setItem(planKey, freshDate);
      } catch (e) {
        console.warn(e);
      }
      inMemoryTasks = dailyMissionService.generateFreshMissionTasks(userId);
      inMemoryReport = null;
      inMemoryCelebrationOpen = false;
      syncEngine.setLocalCache('active_study_plan', { dailyTasks: inMemoryTasks, date: freshDate }, userId);
      notifyListeners();
    }
  }, [userId]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkRollover();
      }
    };
    const handleFocus = () => checkRollover();

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    const interval = setInterval(checkRollover, 60 * 1000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [checkRollover]);

  // Load from persisted cache if null
  useEffect(() => {
    const todayStr = getLocalTodayDateString();
    inMemoryDate = todayStr;

    // 1. Tasks
    const cachedPlan = syncEngine.getLocalCache<{ dailyTasks?: TaskItem[]; date?: string }>('active_study_plan', userId);
    if (cachedPlan?.dailyTasks && cachedPlan.dailyTasks.length >= 5 && cachedPlan.date === todayStr) {
      inMemoryTasks = sanitizeTasks(cachedPlan.dailyTasks);
    } else if (!inMemoryTasks) {
      const storedPlanDate = localStorage.getItem(`rankify_plan_date_${userId}`);
      if (storedPlanDate === todayStr && cachedPlan?.dailyTasks && cachedPlan.dailyTasks.length >= 5) {
        inMemoryTasks = sanitizeTasks(cachedPlan.dailyTasks);
      } else {
        const fresh = sanitizeTasks(dailyMissionService.generateFreshMissionTasks(userId));
        inMemoryTasks = fresh;
        try {
          localStorage.setItem(`rankify_plan_date_${userId}`, todayStr);
        } catch (e) {
          console.warn(e);
        }
        syncEngine.setLocalCache('active_study_plan', { dailyTasks: fresh, date: todayStr }, userId);
      }
    }

    // 2. Statistics
    const cachedStats = syncEngine.getLocalCache<StoredStudyStatistics>('study_statistics', userId);
    if (cachedStats) {
      inMemoryStats = cachedStats;
    } else if (!inMemoryStats) {
      inMemoryStats = {
        streak: 0,
        lastActiveDate: todayStr,
        totalStudyMinutes: 0,
        questionsSolved: 0,
        todayProgressPercent: 0,
        completedTasksCount: 0,
        xpTotal: 0,
      };
    }

    // 3. Stored Report for Today
    const report = dailyMissionService.getStoredReport(userId, todayStr);
    if (report && report.completedAt) {
      inMemoryReport = report;
      // Do not auto-reopen if already dismissed
      if (!report.isDismissed && !inMemoryCelebrationOpen) {
        inMemoryCelebrationOpen = true;
      }
    }

    notifyListeners();
  }, [userId]);

  // Real-time synchronization of study statistics from Firestore
  useEffect(() => {
    if (!user?.uid) return;
    const statsDocRef = doc(db, 'users', user.uid, 'study_statistics', 'current');
    const unsub = onSnapshot(
      statsDocRef,
      (snap) => {
        if (snap.exists()) {
          const remoteStats = snap.data() as StoredStudyStatistics;
          if (remoteStats) {
            inMemoryStats = {
              ...(inMemoryStats || {
                streak: 0,
                lastActiveDate: inMemoryDate,
                totalStudyMinutes: 0,
                questionsSolved: 0,
                todayProgressPercent: 0,
                completedTasksCount: 0,
              }),
              ...remoteStats,
              // Never downgrade streak from remote if local is ahead
              streak: Math.max(inMemoryStats?.streak || 0, remoteStats.streak || 0),
            };
            syncEngine.setLocalCache('study_statistics', inMemoryStats, user.uid);
            notifyListeners();
          }
        }
      },
      (err) => console.warn('Study statistics listener notice:', err)
    );

    return () => unsub();
  }, [user?.uid]);

  // Derived values (STEP 2 & STEP 3 - Pure, single source of truth)
  const currentTasks = inMemoryTasks || [];
  const requiredTasks = useMemo(() => currentTasks.filter((t) => !t.isBonus), [currentTasks]);
  const bonusTasks = useMemo(() => currentTasks.filter((t) => t.isBonus), [currentTasks]);
  const requiredDone = useMemo(() => requiredTasks.filter((t) => t.isCompleted).length, [requiredTasks]);
  const requiredTotal = requiredTasks.length;
  const percent = requiredTotal > 0 ? Math.round((requiredDone / requiredTotal) * 100) : 0;
  const bonusDone = useMemo(() => bonusTasks.filter((t) => t.isCompleted).length, [bonusTasks]);
  const bonusTotal = bonusTasks.length;

  // Single truth for study minutes & questions:
  // Base from completed tasks allocated minutes + tracked questions
  const taskStudyMinutes = useMemo(() => {
    return currentTasks.filter((t) => t.isCompleted).reduce((acc, t) => acc + (t.allocatedMinutes || 30), 0);
  }, [currentTasks]);

  const studyMinutes = useMemo(() => {
    return Math.max(taskStudyMinutes, inMemoryStats?.totalStudyMinutes || 0);
  }, [taskStudyMinutes]);

  const questionsSolved = useMemo(() => {
    const questionsFromTasks = currentTasks.filter((t) => t.isCompleted).length * 5;
    return Math.max(questionsFromTasks, inMemoryStats?.questionsSolved || 0);
  }, [currentTasks]);

  const missionCompleted = useMemo(() => {
    if (inMemoryReport?.completedAt) return true;
    return requiredTotal > 0 && requiredDone === requiredTotal;
  }, [requiredTotal, requiredDone]);

  const streak = inMemoryStats?.streak || (missionCompleted ? 1 : 0);
  const streakLabel = formatStreak(streak);
  const xpToday = inMemoryReport?.xpEarned || (missionCompleted ? 350 : requiredDone * 50);

  // Toggle Task handler
  const toggleTask = useCallback(
    (taskId: string) => {
      const todayStr = getLocalTodayDateString();
      const updated = (inMemoryTasks || []).map((t) => {
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

      inMemoryTasks = updated;
      syncEngine.setLocalCache('active_study_plan', { dailyTasks: updated, date: todayStr }, userId);
      if (user?.uid) {
        syncEngine.queueSync(user.uid, 'users', `${user.uid}/study_plan/current`, { dailyTasks: updated, date: todayStr }, 'set');
      }

      // Recompute required
      const activeRequired = updated.filter((t) => !t.isBonus);
      const isAllReqDone = activeRequired.length > 0 && activeRequired.every((t) => t.isCompleted);

      // STEP 4 & 5: When mission completed for the first time today, increment streak and award XP once
      if (isAllReqDone) {
        const storedReport = dailyMissionService.getStoredReport(userId, todayStr);
        if (!storedReport || !storedReport.completedAt) {
          // Idempotent streak update: only once per date
          const streakAwardKey = `rankify_streak_awarded_${todayStr}_${userId}`;
          const alreadyAwardedStreak = localStorage.getItem(streakAwardKey);

          let newStreak = inMemoryStats?.streak || 0;
          if (!alreadyAwardedStreak) {
            newStreak = newStreak + 1;
            try {
              localStorage.setItem(streakAwardKey, 'true');
            } catch (e) {
              console.warn(e);
            }
          }

          const currentStudyMins = updated.filter((t) => t.isCompleted).reduce((acc, t) => acc + (t.allocatedMinutes || 30), 0);
          const currentQuestions = Math.max(30, (inMemoryStats?.questionsSolved || 0) + 15);

          const newReport: DailyMissionReport = {
            date: todayStr,
            completedAt: new Date().toISOString(),
            studyMinutes: currentStudyMins,
            tasksCompleted: activeRequired.length,
            totalTasks: activeRequired.length,
            questionsSolved: currentQuestions,
            revisionCompleted: 2,
            lecturesCompleted: 1,
            flashcardsReviewed: 15,
            mistakesFixed: 3,
            aiSessions: 2,
            xpEarned: 350,
            currentStreak: newStreak,
            aiSummary: generatePersonalizedAiSummary(updated, user?.displayName?.split(' ')[0] || 'Student', 95),
            motivationalQuote: getDynamicMotivationQuote(newStreak),
            unlockedAchievements: calculateMissionAchievements(newStreak, currentQuestions, 2),
            bonusTasks: updated.filter((t) => t.isBonus),
            isDismissed: false,
          };

          inMemoryReport = newReport;
          inMemoryCelebrationOpen = true;
          dailyMissionService.saveReport(userId, newReport);

          inMemoryStats = {
            ...(inMemoryStats || {
              streak: 0,
              lastActiveDate: todayStr,
              totalStudyMinutes: 0,
              questionsSolved: 0,
              todayProgressPercent: 0,
              completedTasksCount: 0,
            }),
            streak: newStreak,
            totalStudyMinutes: currentStudyMins,
            questionsSolved: currentQuestions,
            todayProgressPercent: 100,
            completedTasksCount: activeRequired.length,
            lastActiveDate: todayStr,
            updatedAt: new Date().toISOString(),
          };

          syncEngine.setLocalCache('study_statistics', inMemoryStats, userId);
          if (user?.uid) {
            syncEngine.queueSync(user.uid, 'users', `${user.uid}/study_statistics/current`, inMemoryStats as any, 'set');
          }
        }
      }

      notifyListeners();
    },
    [userId, user?.uid, user?.displayName]
  );

  // Extra Practice Generator
  const startExtraPractice = useCallback(() => {
    inMemoryCelebrationOpen = false;
    const current = inMemoryTasks || [];
    if (current.some((t) => t.isBonus)) return;

    const newBonus = generateBonusPracticeTasks(userId, current);
    const combined = sanitizeTasks([...current, ...newBonus]);
    inMemoryTasks = combined;
    syncEngine.setLocalCache('active_study_plan', { dailyTasks: combined, date: inMemoryDate }, userId);
    if (userId && userId !== 'guest') {
      syncEngine.queueSync(userId, 'users', `${userId}/study_plan/current`, { dailyTasks: combined, date: inMemoryDate }, 'set');
    }
    notifyListeners();
  }, [userId, user?.uid]);

  // Reset Tasks
  const resetTodayTasks = useCallback(() => {
    const todayStr = getLocalTodayDateString();
    const fresh = dailyMissionService.generateFreshMissionTasks(userId);
    inMemoryTasks = fresh;
    inMemoryReport = null;
    inMemoryCelebrationOpen = false;

    // Reset task completion in stats but KEEP streak and total history intact (STEP 4)
    if (inMemoryStats) {
      inMemoryStats = {
        ...inMemoryStats,
        todayProgressPercent: 0,
        completedTasksCount: 0,
        updatedAt: new Date().toISOString(),
      };
      syncEngine.setLocalCache('study_statistics', inMemoryStats, userId);
      if (user?.uid) {
        syncEngine.queueSync(user.uid, 'users', `${user.uid}/study_statistics/current`, inMemoryStats as any, 'set');
      }
    }

    dailyMissionService.resetTodayMission(userId, todayStr);
    syncEngine.setLocalCache('active_study_plan', { dailyTasks: fresh, date: todayStr }, userId);
    if (user?.uid) {
      syncEngine.queueSync(user.uid, 'users', `${user.uid}/study_plan/current`, { dailyTasks: fresh, date: todayStr }, 'set');
    }
    notifyListeners();
  }, [userId, user?.uid]);

  const dismissCelebration = useCallback(() => {
    inMemoryCelebrationOpen = false;
    dailyMissionService.markReportDismissed(userId, inMemoryDate);
    if (inMemoryReport) {
      inMemoryReport = { ...inMemoryReport, isDismissed: true };
    }
    notifyListeners();
  }, [userId]);

  const openCelebration = useCallback(() => {
    inMemoryCelebrationOpen = true;
    notifyListeners();
  }, []);

  return {
    todayStr: inMemoryDate,
    tasks: currentTasks,
    requiredTasks,
    bonusTasks,
    requiredDone,
    requiredTotal,
    percent,
    bonusDone,
    bonusTotal,
    studyMinutes,
    studyTimeFormatted: formatTime(studyMinutes),
    questionsSolved,
    missionCompleted,
    xpToday,
    streak,
    streakLabel,
    missionReport: inMemoryReport,
    isCelebrationOpen: inMemoryCelebrationOpen,
    toggleTask,
    startExtraPractice,
    resetTodayTasks,
    dismissCelebration,
    openCelebration,
  };
}
