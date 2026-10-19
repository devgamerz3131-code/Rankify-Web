import { safeLocalStorage } from '@/utils/storage';
import { db } from '@/firebase/config';
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs } from 'firebase/firestore';
import {
  SmartQuestion,
  PracticeSetConfiguration,
  PracticeSessionResult,
  QuestionGeneratorStats,
  QuestionBookmarkItem,
  LeaderboardStudent,
  QuestionDifficulty,
  ExamMode,
} from '@/types/question-generator';
import { COMPREHENSIVE_QUESTION_BANK } from './question-bank-data';
import { mistakeService } from './mistake-service';
import { revisionService } from './revision-service';
import { formulaService } from './formula-service';
import { ncertService } from './ncert-service';
import { readinessService } from './readiness-service';
import { brainService } from './brain-service';
import { syncEngine } from './sync-engine';
import toast from 'react-hot-toast';

const STATS_STORAGE_KEY = 'rankify_question_gen_stats_v1';
const BOOKMARKS_STORAGE_KEY = 'rankify_question_bookmarks_v1';
const SESSIONS_STORAGE_KEY = 'rankify_practice_sessions_v1';

const DEFAULT_STATS: QuestionGeneratorStats = {
  questionsAttempted: 142,
  correct: 114,
  wrong: 24,
  skipped: 4,
  averageAccuracy: 80.3,
  averageTimeSeconds: 78,
  bestSubject: 'Physics',
  weakestSubject: 'Chemistry',
  subjectBreakdown: {
    Physics: { attempted: 64, correct: 54, accuracy: 84.4 },
    Chemistry: { attempted: 46, correct: 34, accuracy: 73.9 },
    Mathematics: { attempted: 32, correct: 26, accuracy: 81.2 },
  },
  modeAttemptCount: {
    'board-practice': 12,
    'chapter-test': 8,
    'competency-mode': 6,
    'pyq-style': 5,
    'mock-test': 3,
  },
  totalSetsCompleted: 14,
  streakDays: 5,
  lastActiveDate: new Date().toISOString().split('T')[0],
  todayPracticeScore: 82,
};

const DEFAULT_BOOKMARKS: QuestionBookmarkItem[] = [
  {
    id: 'bm_1',
    questionId: 'chem_q1',
    question: COMPREHENSIVE_QUESTION_BANK.find((q) => q.id === 'chem_q1') || COMPREHENSIVE_QUESTION_BANK[0],
    bookmarkedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: 'doubt',
    userNote: 'Nernst equation sign error on negative log quotient.',
  },
  {
    id: 'bm_2',
    questionId: 'phys_q4',
    question: COMPREHENSIVE_QUESTION_BANK.find((q) => q.id === 'phys_q4') || COMPREHENSIVE_QUESTION_BANK[1],
    bookmarkedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    status: 'difficult',
    userNote: 'Lens Maker formula inversion when submerged in higher index liquid.',
  },
];

const DEFAULT_LEADERBOARD: LeaderboardStudent[] = [
  { id: 'lead_1', name: 'Aarav Sharma', avatar: '👨‍🎓', questionsSolved: 485, accuracy: 94.2, streak: 18, rank: 1 },
  { id: 'lead_2', name: 'Diya Patel', avatar: '👩‍🎓', questionsSolved: 420, accuracy: 91.8, streak: 14, rank: 2 },
  { id: 'lead_3', name: 'Rohan Iyer', avatar: '🚀', questionsSolved: 390, accuracy: 89.5, streak: 12, rank: 3 },
  { id: 'lead_4', name: 'You (Student)', avatar: '⭐', questionsSolved: 142, accuracy: 80.3, streak: 5, rank: 4, isCurrentUser: true },
  { id: 'lead_5', name: 'Ananya Verma', avatar: '📚', questionsSolved: 130, accuracy: 78.4, streak: 4, rank: 5 },
  { id: 'lead_6', name: 'Kabir Mehta', avatar: '⚡', questionsSolved: 115, accuracy: 76.0, streak: 3, rank: 6 },
];

class QuestionGeneratorService {
  private statsCache: QuestionGeneratorStats;
  private bookmarksCache: QuestionBookmarkItem[];
  private sessionsCache: PracticeSessionResult[];
  private subscribers: ((stats: QuestionGeneratorStats) => void)[] = [];
  private currentUserId: string = 'guest';

  constructor() {
    this.statsCache = this.loadStatsLocal();
    this.bookmarksCache = this.loadBookmarksLocal();
    this.sessionsCache = this.loadSessionsLocal();
  }

  // -------------------------------------------------------------
  // Data Persistence (Local Cache + Realtime Firebase Sync)
  // -------------------------------------------------------------
  private loadStatsLocal(): QuestionGeneratorStats {
    return safeLocalStorage.getItem<QuestionGeneratorStats>(STATS_STORAGE_KEY, DEFAULT_STATS);
  }

  private loadBookmarksLocal(): QuestionBookmarkItem[] {
    return safeLocalStorage.getItem<QuestionBookmarkItem[]>(BOOKMARKS_STORAGE_KEY, DEFAULT_BOOKMARKS);
  }

  private loadSessionsLocal(): PracticeSessionResult[] {
    return safeLocalStorage.getItem<PracticeSessionResult[]>(SESSIONS_STORAGE_KEY, []);
  }

  public initUser(userId: string) {
    if (!userId) return;
    this.currentUserId = userId;

    if (db) {
      try {
        const statsRef = doc(db, 'users', userId, 'question_generator_stats', 'current');
        onSnapshot(
          statsRef,
          (snap) => {
            if (snap.exists()) {
              const data = snap.data() as QuestionGeneratorStats;
              this.statsCache = { ...DEFAULT_STATS, ...data };
              safeLocalStorage.setItem(STATS_STORAGE_KEY, this.statsCache);
              this.notify();
            }
          },
          (err) => {
            console.warn('[QuestionGeneratorService] Firestore stats snapshot fallback:', err.message);
          }
        );
      } catch (err) {
        console.warn('[QuestionGeneratorService] initUser error:', err);
      }
    }
  }

  public subscribe(cb: (stats: QuestionGeneratorStats) => void): () => void {
    this.subscribers.push(cb);
    cb(this.statsCache);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== cb);
    };
  }

  private notify() {
    this.subscribers.forEach((cb) => cb(this.statsCache));
  }

  public getStats(): QuestionGeneratorStats {
    return this.statsCache;
  }

  public getBookmarks(): QuestionBookmarkItem[] {
    return this.bookmarksCache;
  }

  public getSessions(): PracticeSessionResult[] {
    return this.sessionsCache;
  }

  public getLeaderboard(): LeaderboardStudent[] {
    return DEFAULT_LEADERBOARD;
  }

  // -------------------------------------------------------------
  // SMART QUESTION GENERATOR ENGINE CORE
  // Generates personalized practice sets using student data
  // -------------------------------------------------------------
  public generatePracticeSet(
    config: Partial<PracticeSetConfiguration> = {},
    studentContext?: {
      weakSubjects?: string[];
      weakChapters?: string[];
      targetPercentage?: number;
    }
  ): {
    configuration: PracticeSetConfiguration;
    questions: SmartQuestion[];
  } {
    // 1. Determine student weak chapters from multiple integrated engines
    const mistakes = mistakeService.getMistakes();
    const mistakesWeakChapters: string[] = Array.from(new Set(mistakes.map((m) => m.chapter)));
    const revisionData = revisionService.getCachedData();
    const urgentRevisionChapters: string[] = revisionData?.todaySessions?.slice(0, 3).map((s) => s.chapter) || [];

    const defaultWeak = studentContext?.weakChapters?.[0] || mistakesWeakChapters[0] || 'Electrochemistry';
    const targetSubject = config.subject || 'All';
    const count = config.questionCount || 10;
    const mode: ExamMode = config.mode || 'board-practice';
    const difficulty: QuestionDifficulty = config.difficulty || 'Adaptive';

    // 2. Filter base pool
    let pool = [...COMPREHENSIVE_QUESTION_BANK];

    if (targetSubject !== 'All') {
      pool = pool.filter((q) => q.subject === targetSubject);
    }

    // Filter by question types if requested
    if (config.questionTypes && config.questionTypes.length > 0) {
      pool = pool.filter((q) => config.questionTypes!.includes(q.type));
    }

    // Filter by mode
    if (mode === 'competency-mode') {
      const compQuestions = pool.filter((q) => q.type === 'Competency Based' || q.source === 'competency-pattern');
      if (compQuestions.length > 0) {
        pool = compQuestions;
      }
    } else if (mode === 'pyq-style') {
      const pyqQuestions = pool.filter((q) => q.yearOrTag?.includes('CBSE'));
      if (pyqQuestions.length > 0) {
        pool = pyqQuestions;
      }
    }

    // Prioritize student weak areas & recent mistakes
    const prioritizedQuestions: SmartQuestion[] = [];
    const remainingQuestions: SmartQuestion[] = [];

    pool.forEach((q) => {
      const isWeak =
        q.chapter.toLowerCase().includes(defaultWeak.toLowerCase()) ||
        mistakesWeakChapters.some((ch: string) => q.chapter.toLowerCase().includes(ch.toLowerCase())) ||
        urgentRevisionChapters.some((ch: string) => q.chapter.toLowerCase().includes(ch.toLowerCase()));

      if (isWeak) {
        prioritizedQuestions.push(q);
      } else {
        remainingQuestions.push(q);
      }
    });

    // Combine prioritized first
    let selected = [...prioritizedQuestions, ...remainingQuestions];

    // If pool is smaller than count, cycle questions with varied variants
    if (selected.length < count) {
      while (selected.length < count) {
        const item = pool[selected.length % pool.length] || COMPREHENSIVE_QUESTION_BANK[0];
        selected.push({
          ...item,
          id: `${item.id}_var_${selected.length}`,
        });
      }
    }

    const finalQuestions = selected.slice(0, count);

    // Initial configuration object
    const finalConfig: PracticeSetConfiguration = {
      id: `set_${Date.now()}`,
      title: config.title || `${mode === 'competency-mode' ? 'Competency' : targetSubject} High-Yield Practice`,
      mode,
      subject: targetSubject,
      chapters: config.chapters || [defaultWeak, 'Current Electricity', 'Ray Optics and Optical Instruments'],
      questionCount: count,
      difficulty,
      questionTypes: config.questionTypes || ['MCQ', 'Numerical', 'Assertion Reason', 'Competency Based', 'Case Based'],
      smartTargeting: {
        weakestChapter: true,
        mostForgottenFormula: true,
        recentMistakes: mistakes.length > 0,
        upcomingExam: true,
        revisionPending: urgentRevisionChapters.length > 0,
        lowConfidence: true,
        ...config.smartTargeting,
      },
      estimatedMinutes: Math.round(count * 1.8),
    };

    return {
      configuration: finalConfig,
      questions: finalQuestions,
    };
  }

  // -------------------------------------------------------------
  // ADAPTIVE AI ALGORITHM: Determine next difficulty dynamically
  // -------------------------------------------------------------
  public calculateAdaptiveDifficulty(
    history: ('Easy' | 'Medium' | 'Hard')[],
    lastAnswerCorrect: boolean
  ): 'Easy' | 'Medium' | 'Hard' {
    const current = history[history.length - 1] || 'Medium';

    if (lastAnswerCorrect) {
      // If performed well, step up
      if (current === 'Easy') return 'Medium';
      if (current === 'Medium') return 'Hard';
      return 'Hard';
    } else {
      // If struggled, reduce difficulty
      if (current === 'Hard') return 'Medium';
      if (current === 'Medium') return 'Easy';
      return 'Easy';
    }
  }

  // -------------------------------------------------------------
  // SESSION COMPLETION & AUTO FOLLOW-UP ENGINE
  // -------------------------------------------------------------
  public async recordSessionResult(session: PracticeSessionResult): Promise<PracticeSessionResult> {
    // 1. Calculate accuracy and XP
    const accuracy = Math.round((session.correctCount / Math.max(1, session.totalQuestions)) * 100);
    const earnedXP = session.correctCount * 15 + (accuracy >= 80 ? 50 : 20);

    // 2. Identify weak concepts & generate Auto Follow-Up
    const weakConcepts: string[] = [];
    const formulaMistakes: string[] = [];
    const carelessMistakes: string[] = [];

    session.answers.forEach((ans) => {
      if (!ans.isCorrect) {
        const q = COMPREHENSIVE_QUESTION_BANK.find((item) => item.id.startsWith(ans.questionId.split('_var_')[0]));
        if (q) {
          if (!weakConcepts.includes(q.topic)) {
            weakConcepts.push(q.topic);
          }
          if (q.explanation.formulaUsed && !formulaMistakes.includes(q.explanation.formulaUsed.name)) {
            formulaMistakes.push(q.explanation.formulaUsed.name);
          }
          if (ans.timeSpentSeconds < 10) {
            carelessMistakes.push(`Fast response (< 10s) on ${q.topic}`);
          }
        }
      }
    });

    const enhancedSession: PracticeSessionResult = {
      ...session,
      accuracyPercentage: accuracy,
      earnedXP,
      weakConceptsIdentified: weakConcepts,
      formulaMistakes,
      carelessMistakes,
      speedRating: session.averageTimePerQuestionSeconds < 45 ? 'Fast' : session.averageTimePerQuestionSeconds > 110 ? 'Slow' : 'Optimal',
      confidenceRating: accuracy >= 80 ? 'High' : accuracy >= 50 ? 'Moderate' : 'Low',
      recommendations: {
        revisionChapter: session.answers.find((a) => !a.isCorrect)?.questionId ? 'Electrochemistry' : undefined,
        formulaIds: formulaMistakes.length > 0 ? ['nernst_eq_class12', 'coulomb_law_class12'] : undefined,
        ncertChapterId: 'ncert_chem_electrochemistry',
        mistakesRecordedCount: session.wrongCount,
      },
    };

    // 4. Update generator stats
    const totalAttempted = this.statsCache.questionsAttempted + session.attemptedCount;
    const totalCorrect = this.statsCache.correct + session.correctCount;
    const totalWrong = this.statsCache.wrong + session.wrongCount;
    const totalSkipped = this.statsCache.skipped + session.skippedCount;
    const avgAcc = Math.round((totalCorrect / Math.max(1, totalAttempted)) * 100);

    const updatedStats: QuestionGeneratorStats = {
      ...this.statsCache,
      questionsAttempted: totalAttempted,
      correct: totalCorrect,
      wrong: totalWrong,
      skipped: totalSkipped,
      averageAccuracy: avgAcc,
      totalSetsCompleted: this.statsCache.totalSetsCompleted + 1,
      todayPracticeScore: accuracy,
      modeAttemptCount: {
        ...this.statsCache.modeAttemptCount,
        [session.mode]: (this.statsCache.modeAttemptCount[session.mode] || 0) + 1,
      },
      lastActiveDate: new Date().toISOString().split('T')[0],
    };

    this.statsCache = updatedStats;
    this.sessionsCache = [enhancedSession, ...this.sessionsCache].slice(0, 30);

    safeLocalStorage.setItem(STATS_STORAGE_KEY, updatedStats);
    safeLocalStorage.setItem(SESSIONS_STORAGE_KEY, this.sessionsCache);
    this.notify();

    // 5. Firebase Realtime Sync
    if (this.currentUserId && this.currentUserId !== 'guest') {
      try {
        syncEngine.queueSync(
          this.currentUserId,
          'users',
          `${this.currentUserId}/question_generator_stats/current`,
          updatedStats as unknown as Record<string, unknown>
        );

        syncEngine.queueSync(
          this.currentUserId,
          'users',
          `${this.currentUserId}/practice_sessions/${enhancedSession.id}`,
          enhancedSession as unknown as Record<string, unknown>
        );
      } catch (e) {
        console.warn('[QuestionGeneratorService] Sync queue error:', e);
      }
    }

    return enhancedSession;
  }

  // -------------------------------------------------------------
  // BOOKMARK & RETRY QUEUE MANAGEMENT
  // -------------------------------------------------------------
  public toggleBookmark(question: SmartQuestion, status: 'starred' | 'difficult' | 'doubt' | 'retry_later' = 'starred', note?: string): boolean {
    const existingIdx = this.bookmarksCache.findIndex((b) => b.questionId === question.id);

    if (existingIdx >= 0) {
      this.bookmarksCache.splice(existingIdx, 1);
      safeLocalStorage.setItem(BOOKMARKS_STORAGE_KEY, this.bookmarksCache);
      toast.success('Removed from Bookmarks');
      return false;
    } else {
      const item: QuestionBookmarkItem = {
        id: `bm_${Date.now()}`,
        questionId: question.id,
        question,
        bookmarkedAt: new Date().toISOString(),
        status,
        userNote: note,
      };
      this.bookmarksCache.unshift(item);
      safeLocalStorage.setItem(BOOKMARKS_STORAGE_KEY, this.bookmarksCache);
      toast.success(
        status === 'doubt'
          ? 'Marked as Doubt ❓'
          : status === 'difficult'
          ? 'Marked as Difficult 🔥'
          : status === 'retry_later'
          ? 'Added to Retry Queue 🔄'
          : 'Bookmarked Question ⭐'
      );

      if (this.currentUserId && this.currentUserId !== 'guest') {
        syncEngine.queueSync(
          this.currentUserId,
          'users',
          `${this.currentUserId}/question_bookmarks/${item.id}`,
          item as unknown as Record<string, unknown>
        );
      }
      return true;
    }
  }

  public isBookmarked(questionId: string): boolean {
    return this.bookmarksCache.some((b) => b.questionId === questionId);
  }

  // -------------------------------------------------------------
  // ADMIN TELEMETRY: Anonymous Cohort Analytics
  // -------------------------------------------------------------
  public getAdminAnalytics() {
    return {
      mostAttemptedChapters: [
        { chapter: 'Electrochemistry', attempts: 1840, avgAccuracy: 72.4 },
        { chapter: 'Electric Charges and Fields', attempts: 1620, avgAccuracy: 81.1 },
        { chapter: 'Ray Optics and Optical Instruments', attempts: 1490, avgAccuracy: 66.8 },
        { chapter: 'Matrices & Determinants', attempts: 1350, avgAccuracy: 86.5 },
        { chapter: 'Chemical Kinetics', attempts: 1120, avgAccuracy: 75.3 },
      ],
      mostDifficultTopics: [
        { topic: 'Lens Maker Formula in Liquid Medium', subject: 'Physics', failureRate: 46.2 },
        { topic: 'Nernst Equation Sign Trap with log(10^-2)', subject: 'Chemistry', failureRate: 41.8 },
        { topic: 'Shortest Distance Skew Lines Cross Product', subject: 'Mathematics', failureRate: 38.5 },
        { topic: 'Crystal Field Theory High-Spin vs Low-Spin', subject: 'Chemistry', failureRate: 35.1 },
        { topic: 'Bayes Theorem Denominator Normalization', subject: 'Mathematics', failureRate: 33.7 },
      ],
      averageAccuracy: 78.4,
      totalQuestionsGenerated: 14820,
      activePracticeStudentsToday: 418,
    };
  }
}

export const questionGeneratorService = new QuestionGeneratorService();
