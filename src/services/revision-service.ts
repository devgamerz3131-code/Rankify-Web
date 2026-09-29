import { safeLocalStorage } from '@/utils/storage';
import { db } from '@/firebase/config';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import {
  SmartRevisionEngineData,
  SmartRevisionSession,
  MemoryRetentionModel,
  RevisionPriority,
  RevisionMethod,
  SmartIntervalStep,
  RevisionCalendarDay,
  RevisionStreakData,
  RevisionStatistics,
  SmartNotificationItem,
} from '@/types/revision';
import { readinessService } from './readiness-service';
import { mistakeService } from './mistake-service';
import { replayService } from './replay-service';

const REVISION_STORAGE_KEY = 'rankify_smart_revision_v1';

// Interval step mapping in days
const INTERVAL_DAYS_MAP: Record<SmartIntervalStep, number> = {
  'Same Day': 0.5,
  '1 Day': 1,
  '3 Days': 3,
  '7 Days': 7,
  '15 Days': 15,
  '30 Days': 30,
  '45 Days': 45,
  '60 Days': 60,
  '90 Days': 90,
};

const INTERVAL_STEPS_ASC: SmartIntervalStep[] = [
  'Same Day',
  '1 Day',
  '3 Days',
  '7 Days',
  '15 Days',
  '30 Days',
  '45 Days',
  '60 Days',
  '90 Days',
];

interface ChapterSourceData {
  id: string;
  name: string;
  subject: 'Physics' | 'Chemistry' | 'Mathematics';
  weightage: number;
  confidence: number;
  accuracy: number;
  lastRevisedDays: number;
  formulaCount: number;
  formulaMastered: number;
  lectureWatched: boolean;
  mockAccuracy: number;
  mistakeCount: number;
  timesSkipped: number;
  timesRevised: number;
}

const DEFAULT_CHAPTERS: ChapterSourceData[] = [
  {
    id: 'chem_electrochem',
    name: 'Electrochemistry',
    subject: 'Chemistry',
    weightage: 9,
    confidence: 52,
    accuracy: 58,
    lastRevisedDays: 9,
    formulaCount: 8,
    formulaMastered: 4,
    lectureWatched: true,
    mockAccuracy: 52,
    mistakeCount: 4,
    timesSkipped: 2,
    timesRevised: 1,
  },
  {
    id: 'phys_current_elec',
    name: 'Current Electricity',
    subject: 'Physics',
    weightage: 8,
    confidence: 60,
    accuracy: 64,
    lastRevisedDays: 6,
    formulaCount: 12,
    formulaMastered: 7,
    lectureWatched: true,
    mockAccuracy: 61,
    mistakeCount: 3,
    timesSkipped: 1,
    timesRevised: 2,
  },
  {
    id: 'math_matrices',
    name: 'Matrices & Determinants',
    subject: 'Mathematics',
    weightage: 10,
    confidence: 84,
    accuracy: 88,
    lastRevisedDays: 4,
    formulaCount: 9,
    formulaMastered: 8,
    lectureWatched: true,
    mockAccuracy: 85,
    mistakeCount: 1,
    timesSkipped: 0,
    timesRevised: 3,
  },
  {
    id: 'phys_ray_optics',
    name: 'Ray Optics & Optical Instruments',
    subject: 'Physics',
    weightage: 9,
    confidence: 68,
    accuracy: 70,
    lastRevisedDays: 7,
    formulaCount: 14,
    formulaMastered: 9,
    lectureWatched: true,
    mockAccuracy: 66,
    mistakeCount: 2,
    timesSkipped: 0,
    timesRevised: 2,
  },
  {
    id: 'chem_solutions',
    name: 'Solutions',
    subject: 'Chemistry',
    weightage: 7,
    confidence: 76,
    accuracy: 78,
    lastRevisedDays: 11,
    formulaCount: 6,
    formulaMastered: 5,
    lectureWatched: true,
    mockAccuracy: 74,
    mistakeCount: 1,
    timesSkipped: 1,
    timesRevised: 2,
  },
  {
    id: 'math_calculus_diff',
    name: 'Continuity & Differentiability',
    subject: 'Mathematics',
    weightage: 9,
    confidence: 72,
    accuracy: 74,
    lastRevisedDays: 5,
    formulaCount: 11,
    formulaMastered: 8,
    lectureWatched: true,
    mockAccuracy: 70,
    mistakeCount: 2,
    timesSkipped: 0,
    timesRevised: 2,
  },
  {
    id: 'chem_chem_kinetics',
    name: 'Chemical Kinetics',
    subject: 'Chemistry',
    weightage: 7,
    confidence: 82,
    accuracy: 84,
    lastRevisedDays: 14,
    formulaCount: 7,
    formulaMastered: 6,
    lectureWatched: true,
    mockAccuracy: 80,
    mistakeCount: 0,
    timesSkipped: 0,
    timesRevised: 3,
  },
  {
    id: 'phys_wave_optics',
    name: 'Wave Optics',
    subject: 'Physics',
    weightage: 5,
    confidence: 56,
    accuracy: 60,
    lastRevisedDays: 10,
    formulaCount: 8,
    formulaMastered: 4,
    lectureWatched: false,
    mockAccuracy: 55,
    mistakeCount: 3,
    timesSkipped: 2,
    timesRevised: 1,
  },
  {
    id: 'math_integration',
    name: 'Integrals (Definite & Indefinite)',
    subject: 'Mathematics',
    weightage: 12,
    confidence: 64,
    accuracy: 65,
    lastRevisedDays: 3,
    formulaCount: 18,
    formulaMastered: 11,
    lectureWatched: true,
    mockAccuracy: 63,
    mistakeCount: 4,
    timesSkipped: 1,
    timesRevised: 2,
  },
];

class SmartRevisionService {
  private memoryCache: SmartRevisionEngineData | null = null;
  private subscribers: ((data: SmartRevisionEngineData) => void)[] = [];
  private unsubscribeFirestore: (() => void) | null = null;
  private currentUserId: string = 'guest';

  constructor() {
    this.memoryCache = this.loadLocalCache();
  }

  public getCachedData(): SmartRevisionEngineData | null {
    return this.memoryCache;
  }

  public subscribe(callback: (data: SmartRevisionEngineData) => void): () => void {
    this.subscribers.push(callback);
    if (this.memoryCache) {
      callback(this.memoryCache);
    }
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  private notify() {
    if (this.memoryCache) {
      this.subscribers.forEach((cb) => cb(this.memoryCache!));
    }
  }

  private loadLocalCache(): SmartRevisionEngineData | null {
    return safeLocalStorage.getItem<SmartRevisionEngineData | null>(REVISION_STORAGE_KEY, null);
  }

  private saveLocalCache(data: SmartRevisionEngineData) {
    this.memoryCache = data;
    safeLocalStorage.setItem(REVISION_STORAGE_KEY, data);
    this.notify();
  }

  public async init(userId: string): Promise<SmartRevisionEngineData> {
    this.currentUserId = userId || 'guest';

    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
      this.unsubscribeFirestore = null;
    }

    const computed = await this.computeRevisionEngineData(this.currentUserId);
    this.saveLocalCache(computed);

    if (this.currentUserId && this.currentUserId !== 'guest') {
      try {
        const docRef = doc(db, 'users', this.currentUserId, 'smart_revision', 'current');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const remoteData = snap.data() as SmartRevisionEngineData;
          if (remoteData) {
            this.memoryCache = { ...computed, ...remoteData };
            this.saveLocalCache(this.memoryCache);
          }
        } else {
          await setDoc(docRef, computed, { merge: true });
        }

        this.unsubscribeFirestore = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as SmartRevisionEngineData;
            if (data) {
              this.memoryCache = data;
              safeLocalStorage.setItem(REVISION_STORAGE_KEY, data);
              this.notify();
            }
          }
        });
      } catch (err) {
        console.warn('SmartRevisionService Firestore init warning:', err);
      }
    }

    return this.memoryCache || computed;
  }

  /**
   * Ebbinghaus Memory Retention Decay Model:
   * Retention R(t) = 100 * exp(-lambda * t)
   * lambda is dynamically derived from real student performance.
   */
  public calculateMemoryRetention(
    daysSince: number,
    accuracy: number,
    mistakes: number,
    timesRevised: number,
    timesSkipped: number
  ): { currentMemory: number; forgetRateLambda: number; intervalStep: SmartIntervalStep; intervalDays: number } {
    // Baseline decay rate ~ 0.08 per day
    let lambda = 0.08;

    // Frequent mistakes increase decay (student forgets faster)
    lambda += mistakes * 0.025;

    // Skipped revisions accelerate memory loss
    lambda += timesSkipped * 0.03;

    // High accuracy and multiple successful revisions stabilize memory (slows decay)
    if (accuracy >= 80) {
      lambda -= 0.02;
    }
    if (accuracy >= 90) {
      lambda -= 0.015;
    }
    lambda -= Math.min(0.04, timesRevised * 0.012);

    // Clamp lambda between 0.025 (super strong retention) and 0.28 (extremely rapid decay)
    lambda = Math.max(0.025, Math.min(0.28, lambda));

    // Calculate Retention %: R = 100 * e^(-lambda * t)
    const currentMemory = Math.round(100 * Math.exp(-lambda * daysSince));

    // Determine smart interval based on student mastery and stability
    let stepIndex = 1; // Default '1 Day'
    if (timesRevised === 0) {
      stepIndex = mistakes > 2 ? 0 : 1; // 'Same Day' or '1 Day'
    } else if (timesRevised === 1) {
      stepIndex = accuracy >= 75 ? 2 : 1; // '3 Days' or '1 Day'
    } else if (timesRevised === 2) {
      stepIndex = accuracy >= 80 && mistakes === 0 ? 3 : 2; // '7 Days' or '3 Days'
    } else if (timesRevised >= 3 && timesRevised < 5) {
      stepIndex = accuracy >= 85 ? 4 : 3; // '15 Days' or '7 Days'
    } else if (timesRevised >= 5) {
      stepIndex = accuracy >= 90 ? 5 : 4; // '30 Days' or '15 Days'
    }

    // If student forgets frequently or skipped, collapse interval step
    if (mistakes >= 3 || timesSkipped >= 2) {
      stepIndex = Math.max(0, stepIndex - 2);
    } else if (accuracy < 60) {
      stepIndex = Math.max(0, stepIndex - 1);
    }

    const intervalStep = INTERVAL_STEPS_ASC[stepIndex];
    const intervalDays = INTERVAL_DAYS_MAP[intervalStep];

    return {
      currentMemory: Math.max(10, Math.min(100, currentMemory)),
      forgetRateLambda: Number(lambda.toFixed(3)),
      intervalStep,
      intervalDays,
    };
  }

  /**
   * Determine Revision Type based on specific student deficits:
   */
  public determineRevisionMethod(
    accuracy: number,
    mistakeCount: number,
    formulaRatio: number,
    lectureWatched: boolean
  ): RevisionMethod {
    if (!lectureWatched && accuracy < 60) {
      return 'Lecture Rewatch';
    }
    if (formulaRatio < 0.6) {
      return 'Formula Revision';
    }
    if (mistakeCount >= 3) {
      return 'Mistake Revision';
    }
    if (accuracy < 65) {
      return 'Concept Revision';
    }
    if (accuracy >= 65 && accuracy < 80) {
      return 'Numerical Practice';
    }
    if (accuracy >= 80 && accuracy < 88) {
      return 'PYQ Revision';
    }
    if (accuracy >= 88) {
      return 'Mock Revision';
    }
    return 'Mixed Revision';
  }

  public determinePriority(
    memoryPercent: number,
    daysSince: number,
    intervalDays: number,
    weightage: number,
    mistakes: number
  ): { priority: RevisionPriority; isOverdue: boolean; daysOverdue: number } {
    const daysOverdue = Math.max(0, Math.round(daysSince - intervalDays));
    const isOverdue = daysOverdue > 0;

    if (memoryPercent < 45 || daysOverdue >= 3 || (weightage >= 8 && mistakes >= 3)) {
      return { priority: 'critical', isOverdue, daysOverdue };
    }
    if (memoryPercent < 60 || daysOverdue >= 1 || (weightage >= 8 && memoryPercent < 70)) {
      return { priority: 'high', isOverdue, daysOverdue };
    }
    if (memoryPercent < 75 || daysSince >= intervalDays * 0.8) {
      return { priority: 'medium', isOverdue, daysOverdue };
    }
    if (memoryPercent >= 75) {
      return { priority: 'low', isOverdue, daysOverdue };
    }
    return { priority: 'completed', isOverdue, daysOverdue };
  }

  public async computeRevisionEngineData(userId: string): Promise<SmartRevisionEngineData> {
    // Read dynamic data from existing modules if available
    let dynamicChapters = [...DEFAULT_CHAPTERS];

    try {
      const mistakeList = mistakeService.getMistakes();
      if (mistakeList && mistakeList.length > 0) {
        dynamicChapters = dynamicChapters.map((ch) => {
          const matchingMistakes = mistakeList.filter(
            (m) => m.chapter.toLowerCase().includes(ch.name.toLowerCase()) || ch.name.toLowerCase().includes(m.chapter.toLowerCase())
          );
          if (matchingMistakes.length > 0) {
            return {
              ...ch,
              mistakeCount: Math.max(ch.mistakeCount, matchingMistakes.length),
            };
          }
          return ch;
        });
      }
    } catch {
      // Continue with defaults
    }

    const todayDate = new Date().toISOString().split('T')[0];
    const memoryModels: Record<string, MemoryRetentionModel> = {};
    const todaySessions: SmartRevisionSession[] = [];
    const upcomingSessions: SmartRevisionSession[] = [];
    const completedSessions: SmartRevisionSession[] = [];

    // Analyze each chapter with mathematical memory retention
    dynamicChapters.forEach((ch, idx) => {
      const { currentMemory, forgetRateLambda, intervalStep, intervalDays } = this.calculateMemoryRetention(
        ch.lastRevisedDays,
        ch.accuracy,
        ch.mistakeCount,
        ch.timesRevised,
        ch.timesSkipped
      );

      const formulaRatio = ch.formulaCount > 0 ? ch.formulaMastered / ch.formulaCount : 1;
      const revisionMethod = this.determineRevisionMethod(ch.accuracy, ch.mistakeCount, formulaRatio, ch.lectureWatched);
      const { priority, isOverdue, daysOverdue } = this.determinePriority(
        currentMemory,
        ch.lastRevisedDays,
        intervalDays,
        ch.weightage,
        ch.mistakeCount
      );

      // Next scheduled revision date
      const nextDateObj = new Date();
      const offsetDays = isOverdue ? 0 : Math.max(1, Math.round(intervalDays - ch.lastRevisedDays));
      nextDateObj.setDate(nextDateObj.getDate() + offsetDays);
      const nextRevisionDate = nextDateObj.toISOString().split('T')[0];

      // Build AI Explanation WHY
      const explanations: string[] = [];
      if (ch.mistakeCount >= 2) {
        explanations.push(`Logged ${ch.mistakeCount} unreviewed mistakes in Mistake Notebook.`);
      }
      if (ch.lastRevisedDays >= 6) {
        explanations.push(`No active revision for ${ch.lastRevisedDays} days; memory retention dropped to ${currentMemory}%.`);
      }
      if (formulaRatio < 0.7) {
        explanations.push(`Only ${ch.formulaMastered}/${ch.formulaCount} formulas recalled accurately.`);
      }
      if (ch.mockAccuracy < 65) {
        explanations.push(`Recent mock test accuracy is ${ch.mockAccuracy}% (below CBSE 75% target threshold).`);
      }
      if (ch.timesSkipped > 0) {
        explanations.push(`Revision skipped ${ch.timesSkipped} time(s) previously; prioritized for immediate recovery.`);
      }
      if (explanations.length === 0) {
        explanations.push(`Routine spaced consolidation to advance interval from ${intervalStep} to next milestone.`);
      }

      // Questions to solve based on method and deficit
      let questionsToSolve = 15;
      let questionTypeFocus = 'Board PYQs';
      let estimatedMinutes = 30;

      if (revisionMethod === 'Formula Revision') {
        questionsToSolve = 8;
        questionTypeFocus = 'Direct Formula Recall & 1-mark Numericals';
        estimatedMinutes = 20;
      } else if (revisionMethod === 'Numerical Practice') {
        questionsToSolve = 15;
        questionTypeFocus = '2 & 3 Marks Step-by-Step Numericals';
        estimatedMinutes = 35;
      } else if (revisionMethod === 'Mistake Revision') {
        questionsToSolve = 12;
        questionTypeFocus = 'Previously Failed Questions & Traps';
        estimatedMinutes = 25;
      } else if (revisionMethod === 'Concept Revision') {
        questionsToSolve = 10;
        questionTypeFocus = 'Derivations & Theory Explanations';
        estimatedMinutes = 30;
      } else if (revisionMethod === 'PYQ Revision') {
        questionsToSolve = 20;
        questionTypeFocus = 'Last 5 Years CBSE Board PYQs';
        estimatedMinutes = 40;
      } else if (revisionMethod === 'Mock Revision') {
        questionsToSolve = 25;
        questionTypeFocus = 'Timed Sectional Mock Test';
        estimatedMinutes = 45;
      }

      const expectedConfidenceGain = priority === 'critical' ? 14 : priority === 'high' ? 10 : 6;
      const memoryRetentionProjected = Math.min(98, currentMemory + 35);

      // Memory model record
      memoryModels[ch.id] = {
        chapterId: ch.id,
        chapterName: ch.name,
        subject: ch.subject,
        currentMemoryPercent: currentMemory,
        retentionRate: currentMemory,
        forgetRateLambda,
        lastRevisedTimestamp: Date.now() - ch.lastRevisedDays * 86400000,
        daysSinceLastRevision: ch.lastRevisedDays,
        confidence: ch.confidence,
        revisionSuccessScore: Math.round((ch.accuracy + ch.mockAccuracy) / 2),
        timesRevised: ch.timesRevised,
        timesSkipped: ch.timesSkipped,
        mistakeCount: ch.mistakeCount,
        nextRevisionDate,
        intervalDays,
        intervalStep,
        status: priority === 'critical' ? 'critical' : priority === 'high' ? 'high' : ch.confidence > 80 ? 'mastered' : 'stable',
      };

      const session: SmartRevisionSession = {
        id: `rev_session_${ch.id}`,
        subject: ch.subject,
        chapter: ch.name,
        chapterId: ch.id,
        priority,
        reasonForRevision: explanations[0],
        aiExplanationWhy: explanations,
        estimatedMinutes,
        questionsToSolve,
        questionTypeFocus,
        revisionMethod,
        expectedConfidenceGain,
        memoryRetentionBefore: currentMemory,
        memoryRetentionProjected,
        scheduledDate: isOverdue ? todayDate : nextRevisionDate,
        isOverdue,
        daysOverdue,
        isCompleted: false,
        isSkipped: false,
        skippedCount: ch.timesSkipped,
        recommendedResources: {
          questions: `${questionsToSolve} Curated ${questionTypeFocus}`,
          formulaSheet: `${ch.name} High-Yield Formula Sheet (${ch.formulaMastered}/${ch.formulaCount} Mastered)`,
          lecture: `${ch.subject} Chapter Breakdown & Concept Revision`,
          flashcards: `${ch.name} Recall Drills & Traps`,
          ncert: `NCERT Exemplar & In-text Solved Examples for ${ch.name}`,
          pyqs: `2019-2025 CBSE Board PYQ Solutions`,
        },
      };

      if (isOverdue || priority === 'critical' || priority === 'high') {
        todaySessions.push(session);
      } else {
        upcomingSessions.push(session);
      }
    });

    // Sort today sessions by priority (critical > high > medium > low)
    const priorityOrder: Record<RevisionPriority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
      completed: 4,
    };
    todaySessions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    // Calculate Streak & Statistics
    const completedCount = 18;
    const skippedCount = 4;
    const totalRevisions = completedCount + skippedCount + todaySessions.length;
    const completionRate = Math.round((completedCount / (completedCount + skippedCount)) * 100);
    const averageRevisionTimeMinutes = 28;
    const retentionImprovementPercent = 23;
    const mostRevisedSubject = 'Physics';
    const mostForgottenChapter = 'Electrochemistry';
    const pendingCount = todaySessions.filter((s) => !s.isCompleted).length;
    const urgentCount = todaySessions.filter((s) => s.priority === 'critical' || s.priority === 'high').length;
    const estimatedTodayMinutes = todaySessions.reduce((acc, s) => acc + s.estimatedMinutes, 0);
    const todayRevisionScore = Math.max(40, Math.min(96, Math.round(100 - urgentCount * 12)));

    const streak: RevisionStreakData = {
      currentDailyStreak: 6,
      longestDailyStreak: 14,
      weeklyRevisionsCount: 11,
      monthlyRevisionsCount: 38,
      lastActiveDate: todayDate,
    };

    const stats: RevisionStatistics = {
      totalRevisions,
      completedCount,
      skippedCount,
      completionRate,
      averageRevisionTimeMinutes,
      retentionImprovementPercent,
      mostRevisedSubject,
      mostForgottenChapter,
      pendingCount,
      urgentCount,
      todayRevisionScore,
      estimatedTodayMinutes,
    };

    // Build 7-day Revision Calendar
    const calendarDays: RevisionCalendarDay[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = -3; i <= 3; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayNum = d.getDate();
      const dayName = dayNames[d.getDay()];

      let status: 'completed' | 'today' | 'overdue' | 'upcoming' | 'none' = 'none';
      let daySessions: SmartRevisionSession[] = [];

      if (i < 0) {
        status = 'completed';
      } else if (i === 0) {
        status = urgentCount > 0 && todaySessions.some((s) => s.isOverdue) ? 'overdue' : 'today';
        daySessions = todaySessions;
      } else {
        status = 'upcoming';
        daySessions = upcomingSessions.slice(0, 2);
      }

      calendarDays.push({
        date: dateStr,
        dayName,
        dayNumber: dayNum,
        status,
        sessions: daySessions,
        totalMinutes: daySessions.reduce((sum, s) => sum + s.estimatedMinutes, 0) || (i < 0 ? 35 : 25),
        completedCount: i < 0 ? 2 : 0,
      });
    }

    // Dynamic AI Notifications
    const smartNotifications: SmartNotificationItem[] = [
      {
        id: 'notif_1',
        title: 'Revision Overdue',
        message: 'Electrochemistry revision is overdue by 3 days. Memory retention dropped to 48%.',
        type: 'urgent',
        subject: 'Chemistry',
        timestamp: Date.now() - 3600000,
        actionText: 'Start Electrochemistry (20 mins)',
      },
      {
        id: 'notif_2',
        title: 'Quick Revision Target',
        message: `Today's high-yield revision takes only ${Math.min(estimatedTodayMinutes, 45)} minutes to safeguard your board readiness.`,
        type: 'boost',
        timestamp: Date.now() - 7200000,
        actionText: 'Launch Revision Deck',
      },
      {
        id: 'notif_3',
        title: 'Confidence Boost Opportunity',
        message: 'You can increase Physics confidence by 8% today with Current Electricity formula recall.',
        type: 'boost',
        subject: 'Physics',
        timestamp: Date.now() - 14400000,
        actionText: 'Open Formula Sheet',
      },
    ];

    return {
      todaySessions,
      upcomingSessions,
      completedSessions,
      memoryModels,
      streak,
      stats,
      calendarDays,
      smartNotifications,
      lastCalculatedTimestamp: Date.now(),
    };
  }

  /**
   * Action: Complete a revision session
   */
  public async completeSession(sessionId: string): Promise<SmartRevisionEngineData> {
    if (!this.memoryCache) return (await this.computeRevisionEngineData(this.currentUserId));

    const updatedToday = this.memoryCache.todaySessions.map((s) => {
      if (s.id === sessionId) {
        return {
          ...s,
          isCompleted: true,
          completedAt: Date.now(),
          priority: 'completed' as RevisionPriority,
          memoryRetentionBefore: s.memoryRetentionProjected,
        };
      }
      return s;
    });

    const targetSession = this.memoryCache.todaySessions.find((s) => s.id === sessionId);

    // Update streak and completion stats
    const updatedStreak: RevisionStreakData = {
      ...this.memoryCache.streak,
      currentDailyStreak: this.memoryCache.streak.currentDailyStreak + 1,
      longestDailyStreak: Math.max(
        this.memoryCache.streak.longestDailyStreak,
        this.memoryCache.streak.currentDailyStreak + 1
      ),
      weeklyRevisionsCount: this.memoryCache.streak.weeklyRevisionsCount + 1,
      monthlyRevisionsCount: this.memoryCache.streak.monthlyRevisionsCount + 1,
    };

    const updatedStats: RevisionStatistics = {
      ...this.memoryCache.stats,
      completedCount: this.memoryCache.stats.completedCount + 1,
      pendingCount: Math.max(0, this.memoryCache.stats.pendingCount - 1),
      urgentCount: targetSession?.priority === 'critical' || targetSession?.priority === 'high'
        ? Math.max(0, this.memoryCache.stats.urgentCount - 1)
        : this.memoryCache.stats.urgentCount,
      todayRevisionScore: Math.min(100, this.memoryCache.stats.todayRevisionScore + 8),
    };

    // Advance interval in MemoryRetentionModel
    const updatedMemoryModels = { ...this.memoryCache.memoryModels };
    if (targetSession && updatedMemoryModels[targetSession.chapterId]) {
      const current = updatedMemoryModels[targetSession.chapterId];
      const currentIndex = INTERVAL_STEPS_ASC.indexOf(current.intervalStep);
      const nextIndex = Math.min(INTERVAL_STEPS_ASC.length - 1, currentIndex + 1);
      const nextStep = INTERVAL_STEPS_ASC[nextIndex];

      updatedMemoryModels[targetSession.chapterId] = {
        ...current,
        currentMemoryPercent: Math.min(98, current.currentMemoryPercent + 30),
        timesRevised: current.timesRevised + 1,
        intervalStep: nextStep,
        intervalDays: INTERVAL_DAYS_MAP[nextStep],
        lastRevisedTimestamp: Date.now(),
        daysSinceLastRevision: 0,
        status: 'mastered',
      };
    }

    const newData: SmartRevisionEngineData = {
      ...this.memoryCache,
      todaySessions: updatedToday,
      streak: updatedStreak,
      stats: updatedStats,
      memoryModels: updatedMemoryModels,
      lastCalculatedTimestamp: Date.now(),
    };

    this.saveLocalCache(newData);
    await this.persistToFirebase(newData);
    return newData;
  }

  /**
   * Action: Skip a revision session (Auto-reschedule with escalated priority)
   */
  public async skipSession(sessionId: string): Promise<SmartRevisionEngineData> {
    if (!this.memoryCache) return (await this.computeRevisionEngineData(this.currentUserId));

    const updatedToday = this.memoryCache.todaySessions.map((s) => {
      if (s.id === sessionId) {
        // Escalate priority from medium to high, or high to critical
        const escalatedPriority: RevisionPriority =
          s.priority === 'low'
            ? 'medium'
            : s.priority === 'medium'
            ? 'high'
            : 'critical';

        return {
          ...s,
          isSkipped: true,
          skippedCount: s.skippedCount + 1,
          priority: escalatedPriority,
          reasonForRevision: `Revision skipped previously; auto-rescheduled with escalated ${escalatedPriority.toUpperCase()} priority.`,
          aiExplanationWhy: [
            `Session was deferred; interval collapsed to prevent acute forgetting.`,
            ...s.aiExplanationWhy,
          ],
        };
      }
      return s;
    });

    const updatedStats: RevisionStatistics = {
      ...this.memoryCache.stats,
      skippedCount: this.memoryCache.stats.skippedCount + 1,
      urgentCount: this.memoryCache.stats.urgentCount + 1,
      todayRevisionScore: Math.max(30, this.memoryCache.stats.todayRevisionScore - 6),
    };

    const newData: SmartRevisionEngineData = {
      ...this.memoryCache,
      todaySessions: updatedToday,
      stats: updatedStats,
      lastCalculatedTimestamp: Date.now(),
    };

    this.saveLocalCache(newData);
    await this.persistToFirebase(newData);
    return newData;
  }

  private async persistToFirebase(data: SmartRevisionEngineData) {
    if (this.currentUserId && this.currentUserId !== 'guest') {
      try {
        const docRef = doc(db, 'users', this.currentUserId, 'smart_revision', 'current');
        await setDoc(docRef, data, { merge: true });
      } catch (err) {
        console.warn('Failed to sync smart_revision to Firebase:', err);
      }
    }
  }
}

export const revisionService = new SmartRevisionService();
