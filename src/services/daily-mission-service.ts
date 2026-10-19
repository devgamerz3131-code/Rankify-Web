import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { syncEngine } from '@/services/sync-engine';

export interface TaskItem {
  id: string;
  taskTitle: string;
  subjectName: string;
  chapterName: string;
  allocatedMinutes: number;
  priority?: string;
  difficulty?: string;
  isCompleted: boolean;
  status: 'pending' | 'completed' | 'skipped';
  isBonus?: boolean;
  bonusType?: 'weakness' | 'mistake' | 'exam' | 'revision' | 'practice';
}

export interface UnlockedAchievementItem {
  id: string;
  title: string;
  icon: string;
  description: string;
  pointsAward: number;
}

export interface DailyMissionReport {
  date: string;
  completedAt: string;
  studyMinutes: number;
  tasksCompleted: number;
  totalTasks: number;
  questionsSolved: number;
  revisionCompleted: number;
  lecturesCompleted: number;
  flashcardsReviewed: number;
  mistakesFixed: number;
  aiSessions: number;
  xpEarned: number;
  currentStreak: number;
  aiSummary: string;
  motivationalQuote: string;
  unlockedAchievements: UnlockedAchievementItem[];
  bonusTasks: TaskItem[];
  isDismissed: boolean;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function checkIsMissionComplete(tasks: TaskItem[]): boolean {
  const requiredTasks = tasks.filter((t) => !t.isBonus);
  return requiredTasks.length > 0 && requiredTasks.every((t) => t.isCompleted);
}

const MOTIVATIONAL_QUOTES = [
  'Consistency beats intensity. Small daily steps lead to top board exam ranks.',
  'You are one day closer to your CBSE target score.',
  "Today's focused effort is tomorrow's confident exam result.",
  'Unstoppable momentum: discipline is choosing between what you want now and what you want most.',
  'Every derivation and formula mastered today is permanent power for your exams.',
  'Champions are built on ordinary days when nobody is watching.',
];

export function getDynamicMotivationQuote(streak: number): string {
  if (streak >= 7) {
    return `🔥 ${streak}-day streak! Consistency beats intensity. You conquered today's study mission.`;
  }
  const index = Math.abs(new Date().getDate() % MOTIVATIONAL_QUOTES.length);
  return MOTIVATIONAL_QUOTES[index];
}

export function generatePersonalizedAiSummary(
  tasks: TaskItem[],
  studentName: string = 'Student',
  targetPercent: number = 95
): string {
  const requiredTasks = tasks.filter((t) => !t.isBonus && t.isCompleted);
  const subjects = Array.from(new Set(requiredTasks.map((t) => t.subjectName)));
  const chapters = Array.from(new Set(requiredTasks.map((t) => t.chapterName)));

  const primarySub = subjects[0] || 'Physics';
  const secondarySub = subjects[1] || 'Chemistry';
  const primaryCh = chapters[0] || 'Core Derivations';
  const nextTargetTopic = chapters[1] || 'Electrochemistry & Integration';

  return `Excellent consistency today, ${studentName}! You completed all required targets across ${subjects.join(
    ' & '
  )}. Your grasp on ${primaryCh} in ${primarySub} improved significantly. ${secondarySub} revision is now much stronger. Tomorrow we'll prioritize ${nextTargetTopic} to stay on track for ${targetPercent}%.`;
}

import {
  getChapterById,
  getAllCanonicalChapters,
  computeAccuracy,
  sanitizeTask,
  sanitizeTasks,
} from '@/services/chapter-service';
import { MistakeService } from '@/services/mistake-service';
import { safeLocalStorage } from '@/utils/storage';
import { MistakeItem } from '@/types/mistake';

export const BONUS_PRACTICE_CONFIG = {
  WEAK_ACCURACY_THRESHOLD: 70, // Below 70% accuracy is weak / high-deficit
  TARGET_NUMERICALS_COUNT: 5,
  TARGET_ASSERTION_REASON_COUNT: 4,
  TARGET_PRACTICE_MINUTES: 25,
  MISTAKE_RECOVERY_MINUTES: 20,
  EXAM_SPRINT_MINUTES: 15,
};

export function generateBonusPracticeTasks(
  userId: string,
  existingTasks: TaskItem[],
  contextChapters?: any
): TaskItem[] {
  const seed = Date.now();
  const allCanonical = getAllCanonicalChapters();

  // 1. Fetch real mistakes from Mistake Vault (MistakeService or localStorage)
  let openMistakes: MistakeItem[] = [];
  try {
    const allMistakes = MistakeService.getInstance().getMistakes() || [];
    const localMistakes = safeLocalStorage.getItem<MistakeItem[]>(`rankify_mistake_notebook_${userId}`, []);
    const sourceMistakes = allMistakes.length > 0 ? allMistakes : localMistakes;
    openMistakes = (sourceMistakes || []).filter((m) => m && m.status !== 'Mastered');
  } catch {
    openMistakes = [];
  }

  // Count open mistakes per chapter
  const mistakesByChapter = new Map<string, { chapter: ReturnType<typeof getChapterById>; count: number }>();
  for (const m of openMistakes) {
    if (m.chapter) {
      const ch = getChapterById(m.chapter);
      const existing = mistakesByChapter.get(ch.id) || { chapter: ch, count: 0 };
      existing.count++;
      mistakesByChapter.set(ch.id, existing);
    }
  }

  const chaptersWithMistakes = Array.from(mistakesByChapter.values()).sort((a, b) => b.count - a.count);

  // 2. Parse contextChapters to find attempted chapters and not-started chapters
  let rawChapterList: any[] = [];
  if (Array.isArray(contextChapters)) {
    rawChapterList = contextChapters;
  } else if (contextChapters && typeof contextChapters === 'object') {
    rawChapterList = Object.values(contextChapters);
  }

  interface AnalyzedChapter {
    id: string;
    name: string;
    subjectName: 'Physics' | 'Chemistry' | 'Mathematics';
    attempted: number;
    accuracy: number | null;
    isNotStarted: boolean;
  }

  const analyzedMap = new Map<string, AnalyzedChapter>();

  for (const ch of rawChapterList) {
    const id = ch.id || ch.chapterId || ch;
    const info = getChapterById(typeof id === 'string' ? id : ch.chapterName);
    const attempted = ch.attempted ?? ch.questionsAttempted ?? ch.practiceQuestions ?? ch.questionSolved ?? 0;
    const correct = ch.correct ?? ch.questionsCorrect;
    const storedAccuracy = ch.accuracy;
    const accuracy = computeAccuracy(attempted, correct, storedAccuracy);
    const progress = ch.progressPercentage ?? ch.completionPercentage ?? 0;
    const isNotStarted = attempted === 0 && progress === 0;

    analyzedMap.set(info.id, {
      id: info.id,
      name: info.name,
      subjectName: info.subjectName,
      attempted,
      accuracy,
      isNotStarted,
    });
  }

  // Ensure all canonical chapters exist in analyzed list
  for (const can of allCanonical) {
    if (!analyzedMap.has(can.id)) {
      analyzedMap.set(can.id, {
        id: can.id,
        name: can.name,
        subjectName: can.subjectName,
        attempted: 0,
        accuracy: null,
        isNotStarted: true,
      });
    }
  }

  const allAnalyzed = Array.from(analyzedMap.values());
  const attemptedChapters = allAnalyzed
    .filter((c) => c.attempted > 0 && c.accuracy !== null)
    .sort((a, b) => (a.accuracy ?? 100) - (b.accuracy ?? 100));

  const notStartedChapters = allAnalyzed.filter((c) => c.isNotStarted);

  // Chapters already in existing tasks (avoid duplicates where possible)
  const existingChapterNames = new Set(
    existingTasks.map((t) => getChapterById(t.chapterName || t.taskTitle).name.toLowerCase())
  );

  const selectedBonusTasks: TaskItem[] = [];
  const chosenChapterIds = new Set<string>();

  // Task 1: Open Mistakes in Mistake Vault (ONLY generated if real open mistakes exist)
  const mistakeCandidate = chaptersWithMistakes.find((c) => !chosenChapterIds.has(c.chapter.id));
  if (mistakeCandidate && mistakeCandidate.count > 0) {
    const ch = mistakeCandidate.chapter;
    const count = mistakeCandidate.count;
    chosenChapterIds.add(ch.id);

    selectedBonusTasks.push({
      id: `bonus_mistake_${seed}_1`,
      taskTitle: `🔖 Mistake Recovery: Re-attempt ${count} flagged ${
        count === 1 ? 'question' : 'questions'
      } in ${ch.name}`,
      subjectName: ch.subjectName,
      chapterName: ch.name,
      allocatedMinutes: BONUS_PRACTICE_CONFIG.MISTAKE_RECOVERY_MINUTES,
      priority: 'Bonus Practice',
      difficulty: 'Medium',
      isCompleted: false,
      status: 'pending',
      isBonus: true,
      bonusType: 'mistake',
    });
  }

  // Task 2: Lowest Accuracy among attempted chapters (or next prioritized chapter)
  const lowestAccCandidate = attemptedChapters.find((c) => !chosenChapterIds.has(c.id));
  if (lowestAccCandidate) {
    chosenChapterIds.add(lowestAccCandidate.id);
    const isWeak = (lowestAccCandidate.accuracy ?? 100) < BONUS_PRACTICE_CONFIG.WEAK_ACCURACY_THRESHOLD;
    const taskTitle = isWeak && lowestAccCandidate.accuracy !== null
      ? `🎯 Target Drill: Practice session in ${lowestAccCandidate.name} (${lowestAccCandidate.accuracy}% accuracy)`
      : `🎯 Target Drill: Practice session in ${lowestAccCandidate.name}`;

    selectedBonusTasks.push({
      id: `bonus_drill_${seed}_2`,
      taskTitle,
      subjectName: lowestAccCandidate.subjectName,
      chapterName: lowestAccCandidate.name,
      allocatedMinutes: BONUS_PRACTICE_CONFIG.TARGET_PRACTICE_MINUTES,
      priority: 'Bonus Practice',
      difficulty: isWeak ? 'Board Level' : 'Medium',
      isCompleted: false,
      status: 'pending',
      isBonus: true,
      bonusType: 'weakness',
    });
  }

  // Task 3: Not-started chapters (or exam countdown review)
  const notStartedCandidate = notStartedChapters.find(
    (c) => !chosenChapterIds.has(c.id) && !existingChapterNames.has(c.name.toLowerCase())
  ) || notStartedChapters.find((c) => !chosenChapterIds.has(c.id));

  if (notStartedCandidate) {
    chosenChapterIds.add(notStartedCandidate.id);
    selectedBonusTasks.push({
      id: `bonus_primer_${seed}_3`,
      taskTitle: `⚡ Concept Primer: Foundational practice session in ${notStartedCandidate.name}`,
      subjectName: notStartedCandidate.subjectName,
      chapterName: notStartedCandidate.name,
      allocatedMinutes: BONUS_PRACTICE_CONFIG.EXAM_SPRINT_MINUTES,
      priority: 'Bonus Practice',
      difficulty: 'Board Level',
      isCompleted: false,
      status: 'pending',
      isBonus: true,
      bonusType: 'exam',
    });
  }

  // Fill up to 3 bonus tasks if any category was empty using balanced subjects from canonical list
  const remainingSubjects: ('Physics' | 'Chemistry' | 'Mathematics')[] = ['Physics', 'Chemistry', 'Mathematics'];
  for (const subj of remainingSubjects) {
    if (selectedBonusTasks.length >= 3) break;
    const alreadyHasSubj = selectedBonusTasks.some((t) => t.subjectName === subj);
    if (!alreadyHasSubj) {
      const candidate = allCanonical.find((c) => c.subjectName === subj && !chosenChapterIds.has(c.id));
      if (candidate) {
        chosenChapterIds.add(candidate.id);
        selectedBonusTasks.push({
          id: `bonus_practice_${seed}_${selectedBonusTasks.length + 1}`,
          taskTitle: `🎯 Focused Practice: Practice session in ${candidate.name}`,
          subjectName: candidate.subjectName,
          chapterName: candidate.name,
          allocatedMinutes: BONUS_PRACTICE_CONFIG.TARGET_PRACTICE_MINUTES,
          priority: 'Bonus Practice',
          difficulty: 'Board Level',
          isCompleted: false,
          status: 'pending',
          isBonus: true,
          bonusType: 'practice',
        });
      }
    }
  }

  // Sanitize all bonus tasks to guarantee no raw IDs and strictly matching subject names
  return sanitizeTasks(selectedBonusTasks);
}

export function calculateMissionAchievements(
  streak: number,
  totalSolvedQuestions: number,
  revisionTopicsCount: number
): UnlockedAchievementItem[] {
  const achievements: UnlockedAchievementItem[] = [
    {
      id: 'ach_mission_master',
      title: 'Mission Master',
      icon: '🎉',
      description: 'Completed 100% of today’s AI-generated study targets.',
      pointsAward: 100,
    },
  ];

  if (streak >= 7) {
    achievements.push({
      id: 'ach_7_streak',
      title: '7-Day Streak',
      icon: '🔥',
      description: 'Unstoppable consistency! 7 consecutive days of daily missions.',
      pointsAward: 150,
    });
  }

  if (totalSolvedQuestions >= 50) {
    achievements.push({
      id: 'ach_50_questions',
      title: '50 Questions Solved',
      icon: '💯',
      description: 'Solved over 50 CBSE Class 12 board problems.',
      pointsAward: 120,
    });
  }

  if (revisionTopicsCount >= 2) {
    achievements.push({
      id: 'ach_perfect_revision',
      title: 'Perfect Revision',
      icon: '👑',
      description: 'Completed scheduled spaced revision without skips.',
      pointsAward: 80,
    });
  }

  return achievements;
}

export class DailyMissionService {
  private static instance: DailyMissionService;

  private constructor() {}

  public static getInstance(): DailyMissionService {
    if (!DailyMissionService.instance) {
      DailyMissionService.instance = new DailyMissionService();
    }
    return DailyMissionService.instance;
  }

  public getStoredReport(userId: string, date: string = getTodayDateString()): DailyMissionReport | null {
    try {
      const localKey = `rankify_daily_mission_${userId || 'guest'}_${date}`;
      const raw = localStorage.getItem(localKey);
      if (raw) {
        return JSON.parse(raw) as DailyMissionReport;
      }
    } catch (e) {
      console.warn('Failed reading daily mission report from storage:', e);
    }
    return null;
  }

  public async fetchRemoteReport(userId: string, date: string = getTodayDateString()): Promise<DailyMissionReport | null> {
    const local = this.getStoredReport(userId, date);
    if (local) return local;

    if (!userId) return null;

    try {
      const docRef = doc(db, 'users', userId, 'daily_missions', date);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as DailyMissionReport;
        localStorage.setItem(`rankify_daily_mission_${userId}_${date}`, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn('Daily mission fetch remote notice:', err);
    }
    return null;
  }

  public async saveReport(userId: string, report: DailyMissionReport): Promise<void> {
    const localKey = `rankify_daily_mission_${userId || 'guest'}_${report.date}`;
    try {
      localStorage.setItem(localKey, JSON.stringify(report));
    } catch (e) {
      console.warn('Failed to save mission report locally:', e);
    }

    if (!userId) return;

    try {
      const docRef = doc(db, 'users', userId, 'daily_missions', report.date);
      await setDoc(docRef, { ...report, updatedAt: new Date().toISOString() }, { merge: true });

      // Update study statistics in Firestore
      const statsRef = doc(db, 'users', userId, 'study_statistics', 'current');
      await setDoc(
        statsRef,
        {
          userId,
          streak: report.currentStreak,
          todayProgressPercent: 100,
          totalStudyMinutes: report.studyMinutes,
          questionsSolved: report.questionsSolved,
          lastActiveDate: report.date,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err: any) {
      console.warn('Firestore daily mission sync notice:', err?.message || err);
    }
  }

  public markReportDismissed(userId: string, date: string = getTodayDateString()): void {
    const current = this.getStoredReport(userId, date);
    if (current) {
      current.isDismissed = true;
      this.saveReport(userId, current).catch(() => {});
    }
  }

  public resetTodayMission(userId: string, date: string = getTodayDateString()): void {
    const localKey = `rankify_daily_mission_${userId || 'guest'}_${date}`;
    try {
      localStorage.removeItem(localKey);
    } catch (e) {
      console.warn('Failed clearing daily mission report from storage:', e);
    }

    if (!userId) return;

    try {
      const docRef = doc(db, 'users', userId, 'daily_missions', date);
      setDoc(docRef, { completedAt: null, isDismissed: true, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});

      const statsRef = doc(db, 'users', userId, 'study_statistics', 'current');
      setDoc(
        statsRef,
        {
          todayProgressPercent: 0,
          completedTasksCount: 0,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch(() => {});
    } catch (err: any) {
      console.warn('Daily mission reset notice:', err?.message || err);
    }
  }

  public generateFreshMissionTasks(userId: string): TaskItem[] {
    const seed = Date.now();
    return [
      {
        id: `task_${userId}_phy_${seed}_1`,
        taskTitle: 'Electric Charges & Fields: Derive Gauss Law & 5 Dipole Field PYQs',
        subjectName: 'Physics',
        chapterName: 'Electric charges and fields',
        allocatedMinutes: 45,
        priority: 'High',
        difficulty: 'Board Level',
        isCompleted: false,
        status: 'pending',
      },
      {
        id: `task_${userId}_chem_${seed}_2`,
        taskTitle: 'Solutions: Solve 8 Numericals on Colligative Properties & van’t Hoff Factor',
        subjectName: 'Chemistry',
        chapterName: 'Solutions',
        allocatedMinutes: 40,
        priority: 'High',
        difficulty: 'Medium',
        isCompleted: false,
        status: 'pending',
      },
      {
        id: `task_${userId}_math_${seed}_3`,
        taskTitle: 'Matrices & Determinants: Practice 6 Inverse Matrix Proofs & Linear Equations',
        subjectName: 'Mathematics',
        chapterName: 'Matrices',
        allocatedMinutes: 45,
        priority: 'High',
        difficulty: 'Board Level',
        isCompleted: false,
        status: 'pending',
      },
      {
        id: `task_${userId}_chem_${seed}_4`,
        taskTitle: 'Electrochemistry: Nernst Equation Derivations & EMF Cell Potential Problems',
        subjectName: 'Chemistry',
        chapterName: 'Electrochemistry',
        allocatedMinutes: 35,
        priority: 'Medium',
        difficulty: 'Board Level',
        isCompleted: false,
        status: 'pending',
      },
      {
        id: `task_${userId}_phy_${seed}_5`,
        taskTitle: 'Electrostatic Potential & Capacitance: Parallel Plate & Dielectric Slab PYQs',
        subjectName: 'Physics',
        chapterName: 'Electrostatic potential and capacitance',
        allocatedMinutes: 30,
        priority: 'Medium',
        difficulty: 'Board Level',
        isCompleted: false,
        status: 'pending',
      },
      {
        id: `task_${userId}_math_${seed}_6`,
        taskTitle: 'Continuity & Differentiability: Chain Rule, Logarithmic & Second Order Proofs',
        subjectName: 'Mathematics',
        chapterName: 'Continuity and differentiability',
        allocatedMinutes: 35,
        priority: 'Medium',
        difficulty: 'Topper Level',
        isCompleted: false,
        status: 'pending',
      },
    ];
  }
}

export const dailyMissionService = DailyMissionService.getInstance();
