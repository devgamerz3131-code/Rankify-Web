import { safeLocalStorage } from '@/utils/storage';
import { db } from '@/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  WeaknessOverallData,
  ChapterWeaknessAnalysis,
  SubjectWeaknessSummary,
  RootCauseType,
  WeaknessLevel,
  WeaknessPriority,
  ChapterRootCause,
  ImprovementPlanStep,
  RecoveryMilestone,
  ChapterCommonMistakes,
  BehavioralAiInsight,
  CognitiveRadarDimension,
} from '@/types/weakness';
import { ChapterProgress, UpcomingExam } from '@/types/onboarding';
import { mistakeService } from './mistake-service';
import { MistakeItem } from '@/types/mistake';
import toast from 'react-hot-toast';
import {
  computeAccuracy,
  getChapterById,
  getAllCanonicalChapters,
} from './chapter-service';

const STORAGE_KEY = 'rankify_weakness_analyzer_cache_';
const SNAPSHOTS_KEY_PREFIX = 'rankify_weakness_snapshots_';

/**
 * Centralized Configuration Constants for Academic Weakness Engine
 * All thresholds live in this config constant.
 */
export const WEAKNESS_CONFIG = {
  // Score thresholds for strength score (0-100)
  LEVEL_THRESHOLDS: {
    CRITICAL_MAX: 39, // Strength score below 40 -> Critical
    WEAK_MAX: 59,     // Strength score 40-59 -> Weak
    AVERAGE_MAX: 74,  // Strength score 60-74 -> Average
    STRONG_MIN: 75,   // Strength score 75+ -> Strong
  },
  // Minimum practice questions attempted before chapter is not flagged for "Low Practice"
  MIN_PRACTICE_QUESTIONS: 20,
  // Minimum attempted chapters required in a subject to evaluate subject weakness
  MIN_CHAPTERS_FOR_SUBJECT_ANALYSIS: 1,
  // Minimum sample size required to generate data-driven behavioral insights
  MIN_INSIGHT_SAMPLE_SIZE: 5,
  // Single labeled target benchmark
  TARGET_BENCHMARK: 85,
} as const;

export interface ChapterWeaknessCalculation {
  isAttempted: boolean;
  attemptedCount: number;
  correctCount: number | null;
  accuracy: number | null;
  completionPercentage: number;
  revisionCount: number;
  openMistakesCount: number;
  strengthScore: number | null;
  weaknessScore: number | null;
  weaknessLevel: WeaknessLevel;
  causeTags: RootCauseType[];
}

/**
 * Chapter Strength Calculation Formula:
 * 
 * Rules:
 * 1. Skip chapters with 0 attempted questions:
 *    level = "Not started" (consistent with earlier accuracy fix).
 *    strengthScore = null, weaknessScore = null.
 *    They are never classified as Weak or Critical.
 * 
 * 2. For attempted chapters (attemptedCount > 0):
 *    Compute strength score from real values only:
 *    - Question Accuracy (50% weight): (correct / attempted) * 100 -> 0 to 50 pts
 *    - Syllabus Completion (30% weight): completion percentage -> 0 to 30 pts
 *    - Revision Count (up to +15 pts bonus): min(revisions, 5) * 3 -> 0 to 15 pts
 *    - Open Mistakes Penalty (up to -25 pts): -5 pts per unresolved mistake in Mistake Vault, capped at -25 pts
 * 
 *    Formula:
 *    Raw Strength = (accuracy * 0.50) + (completion * 0.30) + (min(revisions, 5) * 3) - (min(openMistakes, 5) * 5)
 *    strengthScore = Math.max(0, Math.min(100, Math.round(Raw Strength)))
 *    weaknessScore = 100 - strengthScore
 * 
 * 3. Levels from score (config):
 *    Critical: below 40
 *    Weak: 40 - 59
 *    Average: 60 - 74
 *    Strong: 75 and above
 */
export function getChapterWeakness(
  chapter: ChapterProgress,
  allMistakes: MistakeItem[] = []
): ChapterWeaknessCalculation {
  const attemptedCount = Math.max(
    0,
    (chapter as any).attempted ??
      (chapter as any).questionsAttempted ??
      chapter.practiceQuestions ??
      chapter.questionSolved ??
      0
  );
  const correctCount = (chapter as any).correct ?? (chapter as any).questionsCorrect ?? null;
  const computedAcc = computeAccuracy(attemptedCount, correctCount, chapter.accuracy);
  const isAttempted = attemptedCount > 0;

  const canonical = getChapterById(chapter.chapterName || chapter.chapterId || chapter.id);
  const chMistakes = allMistakes.filter((m) => {
    if (m.status === 'Mastered') return false;
    const mCanonical = getChapterById(m.chapter);
    if (mCanonical.id && canonical.id && mCanonical.id === canonical.id) return true;
    return (
      m.chapter?.toLowerCase() === chapter.chapterName?.toLowerCase() ||
      m.chapter?.toLowerCase() === chapter.id?.toLowerCase()
    );
  });
  const openMistakesCount = chMistakes.length;

  if (!isAttempted) {
    return {
      isAttempted: false,
      attemptedCount: 0,
      correctCount: null,
      accuracy: null,
      completionPercentage: chapter.progressPercentage ?? chapter.completionPercentage ?? 0,
      revisionCount: chapter.revisionCount || 0,
      openMistakesCount,
      strengthScore: null,
      weaknessScore: null,
      weaknessLevel: 'Not started',
      causeTags: [],
    };
  }

  const accuracy = computedAcc !== null ? computedAcc : (chapter.accuracy ?? 0);
  const completion = Math.max(0, Math.min(100, chapter.progressPercentage ?? chapter.completionPercentage ?? 0));
  const revisions = Math.max(0, chapter.revisionCount || 0);

  // Strength score formula
  const rawStrength =
    accuracy * 0.5 +
    completion * 0.3 +
    Math.min(revisions, 5) * 3 -
    Math.min(openMistakesCount, 5) * 5;
  const strengthScore = Math.max(0, Math.min(100, Math.round(rawStrength)));
  const weaknessScore = 100 - strengthScore;

  let weaknessLevel: WeaknessLevel = 'Average';
  if (strengthScore < WEAKNESS_CONFIG.LEVEL_THRESHOLDS.CRITICAL_MAX + 1) {
    weaknessLevel = 'Critical';
  } else if (strengthScore <= WEAKNESS_CONFIG.LEVEL_THRESHOLDS.WEAK_MAX) {
    weaknessLevel = 'Weak';
  } else if (strengthScore <= WEAKNESS_CONFIG.LEVEL_THRESHOLDS.AVERAGE_MAX) {
    weaknessLevel = 'Average';
  } else {
    weaknessLevel = 'Strong';
  }

  // Days since revision
  let daysSinceRev = 0;
  const lastDate = chapter.lastStudied || chapter.lastOpened || chapter.updatedAt;
  if (lastDate) {
    try {
      const diffMs = Date.now() - new Date(lastDate).getTime();
      daysSinceRev = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    } catch {
      daysSinceRev = 0;
    }
  }

  // Real signal cause tags
  const causeTags: RootCauseType[] = [];
  if (attemptedCount < WEAKNESS_CONFIG.MIN_PRACTICE_QUESTIONS) {
    causeTags.push('Low Practice');
  }
  if (chMistakes.some((m) => m.mistakeType === 'Formula Error')) {
    causeTags.push('Formula Forgotten');
  }
  if (chMistakes.some((m) => m.mistakeType === 'Concept Error')) {
    causeTags.push('Concept Gap');
  }
  if (chMistakes.some((m) => m.mistakeType === 'Calculation Error' || m.mistakeType === 'Silly Mistake')) {
    causeTags.push('Calculation Slip');
  }

  const hasDueMistake = chMistakes.some((m) => {
    if (!m.nextRevisionDue) return false;
    try {
      return new Date(m.nextRevisionDue).getTime() <= Date.now();
    } catch {
      return false;
    }
  });

  if (daysSinceRev >= 7 || chapter.needsRevision || hasDueMistake) {
    causeTags.push('Revision Due');
  }

  return {
    isAttempted: true,
    attemptedCount,
    correctCount,
    accuracy,
    completionPercentage: completion,
    revisionCount: revisions,
    openMistakesCount,
    strengthScore,
    weaknessScore,
    weaknessLevel,
    causeTags,
  };
}

/**
 * Common helper for Home Exam Status and Weakness Analyzer:
 * Weakest Subject: ONE subject with lowest average strength score across ATTEMPTED chapters.
 * Highest Priority: Syllabus chapter name chosen by lowest score among attempted chapters,
 * ties broken by open mistakes, then by weightage.
 */
export function getWeakestSubjectAndPriorityChapter(
  chaptersProgress: ChapterProgress[] = [],
  mistakes: MistakeItem[] = []
): {
  weakestSubjectName: string | null;
  weakestSubjectScore: number | null;
  highestPriorityChapterName: string | null;
  highestPriorityChapterScore: number | null;
  highestPriorityChapterId: string | null;
} {
  const subjectsMap: Record<string, { name: string; sumStrength: number; count: number }> = {
    physics: { name: 'Physics', sumStrength: 0, count: 0 },
    chemistry: { name: 'Chemistry', sumStrength: 0, count: 0 },
    mathematics: { name: 'Mathematics', sumStrength: 0, count: 0 },
  };

  const attemptedChapters: {
    canonicalName: string;
    canonicalId: string;
    strengthScore: number;
    openMistakes: number;
    weightage: number;
  }[] = [];

  for (const ch of chaptersProgress) {
    const calc = getChapterWeakness(ch, mistakes);
    if (!calc.isAttempted || calc.strengthScore === null) continue;

    const subId = (ch.subjectId || 'physics').toLowerCase();
    if (subjectsMap[subId]) {
      subjectsMap[subId].sumStrength += calc.strengthScore;
      subjectsMap[subId].count += 1;
    }

    const canonical = getChapterById(ch.chapterName || ch.chapterId || ch.id);
    attemptedChapters.push({
      canonicalName: canonical.name,
      canonicalId: canonical.id,
      strengthScore: calc.strengthScore,
      openMistakes: calc.openMistakesCount,
      weightage: ch.orderIndex || 8,
    });
  }

  let weakestSubjectName: string | null = null;
  let lowestAvgStrength = Infinity;
  let weakestSubScore: number | null = null;

  for (const sub of Object.values(subjectsMap)) {
    if (sub.count >= WEAKNESS_CONFIG.MIN_CHAPTERS_FOR_SUBJECT_ANALYSIS) {
      const avg = Math.round(sub.sumStrength / sub.count);
      if (avg < lowestAvgStrength) {
        lowestAvgStrength = avg;
        weakestSubjectName = sub.name;
        weakestSubScore = avg;
      }
    }
  }

  if (attemptedChapters.length === 0) {
    return {
      weakestSubjectName,
      weakestSubjectScore: weakestSubScore,
      highestPriorityChapterName: null,
      highestPriorityChapterScore: null,
      highestPriorityChapterId: null,
    };
  }

  attemptedChapters.sort((a, b) => {
    if (a.strengthScore !== b.strengthScore) {
      return a.strengthScore - b.strengthScore;
    }
    if (a.openMistakes !== b.openMistakes) {
      return b.openMistakes - a.openMistakes;
    }
    return b.weightage - a.weightage;
  });

  const topPriority = attemptedChapters[0];
  return {
    weakestSubjectName,
    weakestSubjectScore: weakestSubScore,
    highestPriorityChapterName: topPriority.canonicalName,
    highestPriorityChapterScore: topPriority.strengthScore,
    highestPriorityChapterId: topPriority.canonicalId,
  };
}

/**
 * ISO Week Key builder using UTC Y-M-D (Safari, iOS, Android safe)
 */
export function getIsoWeekKey(d: Date = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export interface WeaknessWeeklySnapshot {
  weekKey: string;
  weakChapterShare: number;
  attemptedCount: number;
  weakCount: number;
  recordedAt: string;
}

export function getStoredWeaknessSnapshots(userId: string): WeaknessWeeklySnapshot[] {
  try {
    return (
      safeLocalStorage.getItem<WeaknessWeeklySnapshot[]>(
        `${SNAPSHOTS_KEY_PREFIX}${userId || 'guest'}`,
        []
      ) || []
    );
  } catch {
    return [];
  }
}

export function saveWeaknessWeeklySnapshot(
  userId: string,
  attemptedCount: number,
  weakCount: number
): WeaknessWeeklySnapshot[] {
  if (attemptedCount === 0) {
    return getStoredWeaknessSnapshots(userId);
  }

  const currentWeekKey = getIsoWeekKey();
  const weakShare = Math.round((weakCount / attemptedCount) * 100);
  const existing = getStoredWeaknessSnapshots(userId);

  const foundIndex = existing.findIndex((s) => s.weekKey === currentWeekKey);
  const updatedSnapshot: WeaknessWeeklySnapshot = {
    weekKey: currentWeekKey,
    weakChapterShare: weakShare,
    attemptedCount,
    weakCount,
    recordedAt: new Date().toISOString(),
  };

  let updatedList: WeaknessWeeklySnapshot[];
  if (foundIndex >= 0) {
    updatedList = [...existing];
    updatedList[foundIndex] = updatedSnapshot;
  } else {
    updatedList = [...existing, updatedSnapshot];
  }

  updatedList.sort((a, b) => a.weekKey.localeCompare(b.weekKey));
  if (updatedList.length > 5) {
    updatedList = updatedList.slice(-5);
  }

  try {
    safeLocalStorage.setItem(`${SNAPSHOTS_KEY_PREFIX}${userId || 'guest'}`, updatedList);
  } catch (err) {
    console.warn('[WeaknessService] Storage error for snapshots:', err);
  }

  if (userId && userId !== 'guest') {
    try {
      const snapDoc = doc(db, 'users', userId, 'weakness_snapshots', currentWeekKey);
      setDoc(snapDoc, updatedSnapshot, { merge: true }).catch((err) => {
        console.warn('[WeaknessService] Firestore snapshot error:', err);
      });
    } catch (err) {
      console.warn('[WeaknessService] Firestore snapshot write exception:', err);
    }
  }

  return updatedList;
}

// Curated CBSE Class 12 NCERT mapping & common mistake patterns for surgery guidance
const NCERT_TOPIC_GUIDES: Record<
  string,
  {
    ncertPages: string;
    keyFormulas: string;
    commonConceptTrap: string;
    wrongQuestionType: string;
    wrongNumericalType: string;
  }
> = {
  phy_ch1: {
    ncertPages: 'NCERT Part 1, Pages 1–45',
    keyFormulas: 'E = λ / (2πε₀r), Gauss Law Φ = q / ε₀',
    commonConceptTrap: 'Direction of electric field for dipole on equatorial line vs axial line',
    wrongQuestionType: 'Assertion-Reasoning on Electric Flux',
    wrongNumericalType: 'Superposition principle vector summation of 3 charges',
  },
  phy_ch2: {
    ncertPages: 'NCERT Part 1, Pages 52–89',
    keyFormulas: 'C = ε₀A/d, U = ½CV², V = kq/r',
    commonConceptTrap: 'Dielectric insertion with battery connected vs disconnected',
    wrongQuestionType: 'Dielectric slab insertion in capacitor circuit',
    wrongNumericalType: 'Energy lost on connecting two charged capacitors',
  },
  phy_ch3: {
    ncertPages: 'NCERT Part 1, Pages 93–128',
    keyFormulas: 'V = E - Ir, Drift velocity vd = eEτ/m, Wheatstone R1/R2 = R3/R4',
    commonConceptTrap: 'Terminal potential difference during charging vs discharging of cell',
    wrongQuestionType: 'Kirchhoff’s Loop rule sign convention problems',
    wrongNumericalType: 'Internal resistance calculation from potentiometer balance point',
  },
  phy_ch9: {
    ncertPages: 'NCERT Part 2, Pages 309–348',
    keyFormulas: '1/f = (μ_lens/μ_med - 1)(1/R1 - 1/R2), Magnification m = -v/u',
    commonConceptTrap: 'Lens focal length change when submerged in higher refractive index liquid',
    wrongQuestionType: 'Ray diagrams for compound microscope intermediate image',
    wrongNumericalType: 'Combination of thin lenses separated by finite distance d',
  },
  chem_ch1: {
    ncertPages: 'NCERT Chemistry Part 1, Pages 1–28',
    keyFormulas: 'ΔTb = Kb · m, Π = iCRT, Van’t Hoff factor i = 1 + (n - 1)α',
    commonConceptTrap: 'Degree of association vs dissociation effect on boiling point elevation',
    wrongQuestionType: 'Abnormal molar mass reasoning questions',
    wrongNumericalType: 'Depression in freezing point with electrolyte dissociation',
  },
  chem_ch2: {
    ncertPages: 'NCERT Chemistry Part 1, Pages 31–62',
    keyFormulas: 'E_cell = E°_cell - (0.0591/n) log Q, Λm = (κ × 1000) / M',
    commonConceptTrap: 'Number of electrons exchanged (n) in unbalanced redox half-cells',
    wrongQuestionType: 'Kohlrausch’s law calculation for weak electrolyte (CH3COOH)',
    wrongNumericalType: 'Nernst equation for concentration cell with varying ion valence',
  },
  chem_ch8: {
    ncertPages: 'NCERT Chemistry Part 2, Pages 352–390',
    keyFormulas: 'Aldol: α-H presence required; Cannizzaro: no α-H with 50% NaOH',
    commonConceptTrap: 'Differentiating Aldol Condensation from Cannizzaro based on α-hydrogen',
    wrongQuestionType: 'Chemical tests: Tollens vs Fehling vs Iodoform test distinction',
    wrongNumericalType: 'Multi-step organic synthesis of carboxylic acids from alkylbenzenes',
  },
  math_ch3: {
    ncertPages: 'NCERT Mathematics Part 1, Pages 56–98',
    keyFormulas: '(AB)ᵀ = BᵀAᵀ, A⁻¹ = (1/|A|) adj(A), |adj(A)| = |A|ⁿ⁻¹',
    commonConceptTrap: 'Matrix multiplication is non-commutative (AB ≠ BA in general)',
    wrongQuestionType: 'Finding inverse using elementary row transformation',
    wrongNumericalType: 'Evaluating 3×3 matrix adjoint power formulas',
  },
  math_ch7: {
    ncertPages: 'NCERT Mathematics Part 2, Pages 287–350',
    keyFormulas: '∫ eˣ[f(x) + f\'(x)] dx = eˣf(x) + C, Definite property ∫₀ᵃ f(x)dx = ∫₀ᵃ f(a-x)dx',
    commonConceptTrap: 'Missing the constant derivative component in Integration by Parts',
    wrongQuestionType: 'Integration by partial fractions with non-repeated quadratic factors',
    wrongNumericalType: 'Definite integral evaluation involving King’s Property and modulus',
  },
};

export class WeaknessService {
  private static instance: WeaknessService;
  private currentUserId: string = 'guest';
  private cachedData: WeaknessOverallData | null = null;
  private listeners: Set<(data: WeaknessOverallData) => void> = new Set();
  private isLoaded: boolean = false;

  private constructor() {
    // Singleton
  }

  public static getInstance(): WeaknessService {
    if (!WeaknessService.instance) {
      WeaknessService.instance = new WeaknessService();
    }
    return WeaknessService.instance;
  }

  public subscribe(listener: (data: WeaknessOverallData) => void): () => void {
    this.listeners.add(listener);
    if (this.cachedData) {
      listener(this.cachedData);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    if (this.cachedData) {
      for (const listener of this.listeners) {
        listener(this.cachedData);
      }
    }
  }

  public async init(userId: string): Promise<WeaknessOverallData> {
    this.currentUserId = userId || 'guest';
    const local = safeLocalStorage.getItem<WeaknessOverallData | null>(
      `${STORAGE_KEY}${this.currentUserId}`,
      null
    );
    if (local) {
      this.cachedData = local;
      this.notify();
    }

    if (userId && userId !== 'guest') {
      try {
        const docRef = doc(db, 'users', userId, 'weakness_analysis', 'current');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const remoteData = snap.data() as WeaknessOverallData;
          this.cachedData = remoteData;
          safeLocalStorage.setItem(`${STORAGE_KEY}${this.currentUserId}`, remoteData);
          this.notify();
        }
      } catch (err) {
        console.warn('[WeaknessService] Remote fetch fallback to deterministic analysis:', err);
      }
    }

    this.isLoaded = true;
    if (!this.cachedData) {
      return this.analyze();
    }
    return this.cachedData;
  }

  public getCachedData(): WeaknessOverallData | null {
    return this.cachedData;
  }

  /**
   * Continuous Non-Random AI Analysis Engine
   * Evaluates student study behavior, question accuracy, mistake logs, revision recency from real data.
   */
  public analyze(
    chaptersProgress?: ChapterProgress[],
    studentStats?: {
      streak?: number;
      totalStudyMinutes?: number;
      questionsSolved?: number;
      accuracy?: number;
    },
    upcomingExam?: UpcomingExam
  ): WeaknessOverallData {
    const mistakes = mistakeService.getMistakes();

    let chapters: ChapterProgress[];
    if (chaptersProgress && chaptersProgress.length > 0) {
      chapters = chaptersProgress;
    } else {
      // Build non-started chapters directly from official canonical syllabus
      const canonicals = getAllCanonicalChapters();
      chapters = canonicals.map((c, idx) => ({
        id: c.id,
        chapterId: c.id,
        chapterName: c.name,
        subjectId: c.subjectId as any,
        subjectName: c.subjectName as any,
        progressPercentage: 0,
        confidence: 1 as any,
        revisionCount: 0,
        practiceQuestions: 0,
        weakTopics: [],
        strongTopics: [],
        timeSpent: 0,
        accuracy: 0,
        completion: false,
        needsRevision: false,
        needsFocus: false,
        lastOpened: null,
        lastStudied: null,
        orderIndex: idx,
        updatedAt: new Date().toISOString(),
        status: 'Not Started' as any,
        completionPercentage: 0,
        studyMinutes: 0,
        questionSolved: 0,
      }));
    }

    const subjectGroups: Record<
      string,
      {
        subjectId: string;
        subjectName: string;
        chapters: ChapterProgress[];
        color: string;
      }
    > = {
      physics: { subjectId: 'physics', subjectName: 'Physics', chapters: [], color: '#8B5CF6' },
      chemistry: { subjectId: 'chemistry', subjectName: 'Chemistry', chapters: [], color: '#EC4899' },
      mathematics: { subjectId: 'mathematics', subjectName: 'Mathematics', chapters: [], color: '#3B82F6' },
    };

    for (const ch of chapters) {
      const subId = (ch.subjectId || 'physics').toLowerCase();
      if (!subjectGroups[subId]) {
        subjectGroups[subId] = {
          subjectId: subId,
          subjectName: ch.subjectName || subId.toUpperCase(),
          chapters: [],
          color: '#6366F1',
        };
      }
      subjectGroups[subId].chapters.push(ch);
    }

    const analyzedChapters: ChapterWeaknessAnalysis[] = [];
    const subjectsSummary: Record<string, SubjectWeaknessSummary> = {};

    let totalWeaknessSum = 0;
    let totalAttemptedChaptersCount = 0;
    let immediateAttentionCount = 0;

    // Process each chapter
    for (const [subId, subData] of Object.entries(subjectGroups)) {
      let subWeaknessSum = 0;
      let subStrengthSum = 0;
      let subAttemptedCount = 0;
      let subCriticalCount = 0;
      let subWeakCount = 0;
      const subCausesCounts: Partial<Record<RootCauseType, number>> = {};

      for (const ch of subData.chapters) {
        // Calculate weakness using the ONE single calculation helper
        const calc = getChapterWeakness(ch, mistakes);
        const canonical = getChapterById(ch.chapterName || ch.chapterId || ch.id);

        let daysSinceRevision = 0;
        const lastDate = ch.lastStudied || ch.lastOpened || ch.updatedAt;
        if (lastDate) {
          try {
            const diffMs = Date.now() - new Date(lastDate).getTime();
            daysSinceRevision = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
          } catch {
            daysSinceRevision = 0;
          }
        }

        const rootCauses: ChapterRootCause[] = calc.causeTags.map((tag) => {
          subCausesCounts[tag] = (subCausesCounts[tag] || 0) + 1;
          if (tag === 'Low Practice') {
            return {
              cause: 'Low Practice',
              severity: calc.attemptedCount < 10 ? 'Critical' : 'High',
              evidence: `${calc.attemptedCount} practice questions attempted (minimum target is ${WEAKNESS_CONFIG.MIN_PRACTICE_QUESTIONS}).`,
              fixRecommendation: 'Solve a targeted 20-question practice set.',
            };
          }
          if (tag === 'Formula Forgotten') {
            return {
              cause: 'Formula Forgotten',
              severity: 'High',
              evidence: 'Active formula errors recorded in your Mistake Vault.',
              fixRecommendation: 'Derive key chapter formulas on paper without checking notes.',
            };
          }
          if (tag === 'Concept Gap') {
            return {
              cause: 'Concept Gap',
              severity: 'High',
              evidence: 'Concept misconceptions recorded in Mistake Vault.',
              fixRecommendation: 'Reread foundational NCERT theory and work through in-text examples.',
            };
          }
          if (tag === 'Calculation Slip') {
            return {
              cause: 'Calculation Slip',
              severity: 'Medium',
              evidence: 'Arithmetic or algebraic calculation mistakes logged.',
              fixRecommendation: 'Write complete intermediate steps on scratch paper.',
            };
          }
          return {
            cause: 'Revision Due',
            severity: 'High',
            evidence: daysSinceRevision >= 7 ? `Not revised in ${daysSinceRevision} days.` : 'Scheduled spaced revision is due.',
            fixRecommendation: 'Conduct a 15-minute active recall review.',
          };
        });

        if (calc.isAttempted && calc.strengthScore !== null && calc.weaknessScore !== null) {
          totalAttemptedChaptersCount++;
          subAttemptedCount++;
          subWeaknessSum += calc.weaknessScore;
          subStrengthSum += calc.strengthScore;
          totalWeaknessSum += calc.weaknessScore;

          if (calc.weaknessLevel === 'Critical') {
            subCriticalCount++;
            immediateAttentionCount++;
          } else if (calc.weaknessLevel === 'Weak') {
            subWeakCount++;
            immediateAttentionCount++;
          }
        }

        const guide = NCERT_TOPIC_GUIDES[canonical.id] || {
          ncertPages: 'NCERT Textbook, Recommended Chapters',
          keyFormulas: 'Fundamental chapter derivations & formulas',
          commonConceptTrap: 'Conceptual traps in multi-step questions',
          wrongQuestionType: 'Application-based problem solving',
          wrongNumericalType: 'Standard multi-step board numericals',
        };

        const whyExplanation = !calc.isAttempted
          ? `${canonical.name} has not been attempted yet. Complete practice questions to evaluate diagnostic mastery.`
          : rootCauses.length > 0
          ? `${canonical.name} is scored at ${calc.strengthScore}% primarily due to ${rootCauses.map((r) => r.cause).join(', ')}.`
          : `${canonical.name} demonstrates solid mastery with ${calc.accuracy ?? 100}% accuracy across ${calc.attemptedCount} attempted questions.`;

        const improvementNeededPct = calc.strengthScore !== null ? Math.max(0, WEAKNESS_CONFIG.TARGET_BENCHMARK - calc.strengthScore) : 0;
        const whenToRevise = !calc.isAttempted
          ? 'Not started'
          : daysSinceRevision >= 7
          ? 'Today — Spaced revision overdue'
          : `Revise in ${Math.max(1, 7 - daysSinceRevision)} day(s)`;

        const howToImprove = !calc.isAttempted
          ? 'Begin by reading NCERT theory and solving 15 in-text practice questions.'
          : `Reach target (${WEAKNESS_CONFIG.TARGET_BENCHMARK}%) by resolving open mistakes in the Mistake Vault and solving 20 Board PYQs.`;

        const whatToStudy = [
          `Key Formulas: ${guide.keyFormulas}`,
          `Concept Trap: ${guide.commonConceptTrap}`,
          `Reading Material: ${guide.ncertPages}`,
          ...(ch.weakTopics && ch.weakTopics.length > 0 ? ch.weakTopics.map((t) => `Weak Topic: ${t}`) : []),
        ];

        let estimatedRecoveryDays = 2;
        if (calc.weaknessLevel === 'Critical') estimatedRecoveryDays = 6;
        else if (calc.weaknessLevel === 'Weak') estimatedRecoveryDays = 4;
        else if (calc.weaknessLevel === 'Average') estimatedRecoveryDays = 2;
        else if (calc.weaknessLevel === 'Strong') estimatedRecoveryDays = 1;

        const baseConf = calc.strengthScore ?? 50;
        const recoveryMilestones: RecoveryMilestone[] = [
          { day: 1, milestone: 'Formula derivation review & Mistake Vault clean-up', confidenceTarget: Math.min(100, baseConf + 8) },
          { day: Math.ceil(estimatedRecoveryDays / 2), milestone: 'Solve 20 Board PYQs under timed conditions', confidenceTarget: Math.min(100, baseConf + 18) },
          { day: estimatedRecoveryDays, milestone: `Full chapter diagnostic check (Target: ${WEAKNESS_CONFIG.TARGET_BENCHMARK}%+)`, confidenceTarget: Math.min(95, baseConf + improvementNeededPct) },
        ];

        const improvementPlan: ImprovementPlanStep[] = [
          {
            step: 1,
            action: `Revise ${canonical.name} Formula Sheet & Key Identities`,
            resource: 'Rankify Formula Lab Deck',
            estMinutes: 20,
            ncertPages: guide.ncertPages,
            isCompleted: false,
          },
          {
            step: 2,
            action: `Watch high-yield concept review on ${ch.weakTopics?.[0] || 'core derivations'}`,
            resource: 'Rankify Smart Engine Modules',
            estMinutes: 25,
            isCompleted: false,
          },
          {
            step: 3,
            action: 'Solve 20 CBSE Previous Year Questions (PYQs)',
            resource: 'Rankify 10-Year Question Bank',
            estMinutes: 35,
            isCompleted: false,
          },
          {
            step: 4,
            action: `Read ${guide.ncertPages}`,
            resource: 'Official NCERT Textbook',
            estMinutes: 30,
            ncertPages: guide.ncertPages,
            isCompleted: false,
          },
          {
            step: 5,
            action: 'Retake chapter diagnostic check after 2 Days',
            resource: 'Rankify Spaced Recall Engine',
            estMinutes: 15,
            isCompleted: false,
          },
        ];

        const commonMistakes: ChapterCommonMistakes = {
          mostForgottenFormula: guide.keyFormulas,
          mostIncorrectConcept: guide.commonConceptTrap,
          mostWrongQuestionType: guide.wrongQuestionType,
          mostWrongNumerical: guide.wrongNumericalType,
        };

        const revisionStatus = !calc.isAttempted
          ? 'Not started'
          : daysSinceRevision >= 7
          ? `Overdue by ${daysSinceRevision - 7} days`
          : `Due in ${7 - daysSinceRevision} days`;

        let priority: WeaknessPriority = 'Low';
        if (calc.weaknessLevel === 'Critical') priority = 'Critical';
        else if (calc.weaknessLevel === 'Weak') priority = 'High';
        else if (calc.weaknessLevel === 'Average') priority = 'Medium';
        else if (calc.weaknessLevel === 'Strong') priority = 'No Revision Needed';

        analyzedChapters.push({
          chapterId: canonical.id,
          chapterName: canonical.name,
          subjectId: subId,
          subjectName: subData.subjectName,
          strengthScore: calc.strengthScore,
          weaknessScore: calc.weaknessScore,
          confidence: calc.strengthScore ?? 0,
          revisionStatus,
          lastRevisedDaysAgo: daysSinceRevision,
          questionAccuracy: calc.accuracy,
          formulaAccuracy: Math.max(20, Math.min(100, Math.round((calc.accuracy ?? 70) * 0.9))),
          conceptAccuracy: Math.max(20, Math.min(100, Math.round((calc.accuracy ?? 70) * 0.95))),
          weaknessLevel: calc.weaknessLevel,
          priority,
          rootCauses,
          whyExplanation,
          howToImprove,
          improvementNeededPct,
          whenToRevise,
          whatToStudy,
          improvementPlan,
          estimatedRecoveryDays,
          recoveryMilestones,
          commonMistakes,
          timeSpentMinutes: ch.timeSpent || ch.studyMinutes || 0,
          questionsSolved: calc.attemptedCount,
          unresolvedMistakesCount: calc.openMistakesCount,
          weightage: ch.orderIndex || 8,
        });
      }

      // Subject summary aggregation
      let dominantCause: RootCauseType = 'Low Practice';
      let maxCauseCount = 0;
      for (const [cause, c] of Object.entries(subCausesCounts)) {
        if (c && c > maxCauseCount) {
          maxCauseCount = c;
          dominantCause = cause as RootCauseType;
        }
      }

      subjectsSummary[subId] = {
        subjectId: subId,
        subjectName: subData.subjectName,
        averageWeaknessScore: subAttemptedCount > 0 ? Math.round(subWeaknessSum / subAttemptedCount) : null,
        averageStrengthScore: subAttemptedCount > 0 ? Math.round(subStrengthSum / subAttemptedCount) : null,
        criticalChaptersCount: subCriticalCount,
        weakChaptersCount: subWeakCount,
        attemptedChaptersCount: subAttemptedCount,
        totalChapters: subData.chapters.length,
        dominantRootCause: dominantCause,
        color: subData.color,
      };
    }

    // Sort chapters: Attempted first (weakest first), unattempted last
    analyzedChapters.sort((a, b) => {
      if (a.weaknessLevel === 'Not started' && b.weaknessLevel !== 'Not started') return 1;
      if (a.weaknessLevel !== 'Not started' && b.weaknessLevel === 'Not started') return -1;
      return (b.weaknessScore ?? -1) - (a.weaknessScore ?? -1);
    });

    const top3WeakChapters = analyzedChapters
      .filter((c) => c.weaknessLevel === 'Critical' || c.weaknessLevel === 'Weak')
      .slice(0, 3);

    // Subject and Priority Chapter calculation (using unified helper)
    const priorityResult = getWeakestSubjectAndPriorityChapter(chapters, mistakes);

    const strongestSubject = priorityResult.weakestSubjectName
      ? (() => {
          const attemptedSubs = Object.values(subjectsSummary).filter(
            (s) => (s.attemptedChaptersCount || 0) > 0 && s.averageStrengthScore !== null
          );
          if (attemptedSubs.length === 0) return null;
          attemptedSubs.sort((a, b) => (b.averageStrengthScore || 0) - (a.averageStrengthScore || 0));
          return {
            name: attemptedSubs[0].subjectName,
            score: attemptedSubs[0].averageStrengthScore,
            subjectId: attemptedSubs[0].subjectId,
          };
        })()
      : null;

    const weakestSubject = priorityResult.weakestSubjectName
      ? {
          name: priorityResult.weakestSubjectName,
          score: priorityResult.weakestSubjectScore,
          subjectId: priorityResult.weakestSubjectName.toLowerCase(),
        }
      : null;

    const highestPriorityChapter = priorityResult.highestPriorityChapterName
      ? {
          name: priorityResult.highestPriorityChapterName,
          score: priorityResult.highestPriorityChapterScore,
          chapterId: priorityResult.highestPriorityChapterId || '',
        }
      : null;

    const overallWeaknessScore = totalAttemptedChaptersCount > 0
      ? Math.round(totalWeaknessSum / totalAttemptedChaptersCount)
      : null;
    const overallHealthScore = overallWeaknessScore !== null ? 100 - overallWeaknessScore : null;

    // Behavioral AI Insights (Purely derived from real data, zero fake confidence %)
    const aiInsights: BehavioralAiInsight[] = [];
    const minSample = WEAKNESS_CONFIG.MIN_INSIGHT_SAMPLE_SIZE;

    // 1. Cross-Subject Comparison (Needs at least 2 subjects with attempts)
    const attemptedSubjects = Object.values(subjectsSummary).filter(
      (s) => (s.attemptedChaptersCount || 0) > 0 && s.averageStrengthScore !== null
    );

    if (attemptedSubjects.length >= 2) {
      const sortedSubs = [...attemptedSubjects].sort(
        (a, b) => (b.averageStrengthScore || 0) - (a.averageStrengthScore || 0)
      );
      const topSub = sortedSubs[0];
      const bottomSub = sortedSubs[sortedSubs.length - 1];
      const attemptedQuestionsTotal = analyzedChapters
        .filter((c) => c.subjectId === topSub.subjectId || c.subjectId === bottomSub.subjectId)
        .reduce((sum, c) => sum + c.questionsSolved, 0);

      if (attemptedQuestionsTotal >= minSample) {
        aiInsights.push({
          id: 'insight_subject_balance',
          title: 'Subject Strength Distribution',
          insight: `Score in ${topSub.subjectName} is ${topSub.averageStrengthScore}% vs ${bottomSub.averageStrengthScore}% in ${bottomSub.subjectName} (based on ${attemptedQuestionsTotal} attempted questions).`,
          behaviorCategory: 'accuracy',
          actionSuggestion: `Dedicate extra practice questions to ${bottomSub.subjectName} to equalize subject readiness.`,
          iconType: 'activity',
        });
      }
    }

    // 2. Mistake Vault Pattern
    const openMistakes = mistakes.filter((m) => m.status !== 'Mastered');
    if (openMistakes.length >= 2) {
      const formulaErrorsCount = openMistakes.filter((m) => m.mistakeType === 'Formula Error').length;
      const calcErrorsCount = openMistakes.filter((m) => m.mistakeType === 'Calculation Error' || m.mistakeType === 'Silly Mistake').length;
      const conceptErrorsCount = openMistakes.filter((m) => m.mistakeType === 'Concept Error').length;

      if (formulaErrorsCount >= 2 && formulaErrorsCount >= calcErrorsCount && formulaErrorsCount >= conceptErrorsCount) {
        aiInsights.push({
          id: 'insight_mistake_formula',
          title: 'Formula Retention Pattern',
          insight: `${formulaErrorsCount} unresolved formula error(s) detected across your recent Mistake Vault entries.`,
          behaviorCategory: 'retention',
          actionSuggestion: 'Review chapter formula derivations before beginning new numerical sets.',
          iconType: 'brain',
        });
      } else if (calcErrorsCount >= 2 && calcErrorsCount >= conceptErrorsCount) {
        aiInsights.push({
          id: 'insight_mistake_calc',
          title: 'Calculation Slip Pattern',
          insight: `${calcErrorsCount} calculation slip(s) logged in your recent problem solving attempts.`,
          behaviorCategory: 'accuracy',
          actionSuggestion: 'Write down intermediate arithmetic steps on rough paper to eliminate sign traps.',
          iconType: 'zap',
        });
      } else if (conceptErrorsCount >= 2) {
        aiInsights.push({
          id: 'insight_mistake_concept',
          title: 'Concept Misconceptions',
          insight: `${conceptErrorsCount} fundamental concept error(s) logged in your Mistake Vault.`,
          behaviorCategory: 'study_pattern',
          actionSuggestion: 'Reread the relevant NCERT theory sections and solve in-text example questions.',
          iconType: 'brain',
        });
      }
    }

    // 3. Spaced Revision Overdue
    const overdueAttemptedChapters = analyzedChapters.filter(
      (c) => c.weaknessLevel !== 'Not started' && c.lastRevisedDaysAgo >= 7
    );
    if (overdueAttemptedChapters.length > 0) {
      const names = overdueAttemptedChapters.map((c) => c.chapterName);
      aiInsights.push({
        id: 'insight_spaced_overdue',
        title: 'Spaced Revision Due',
        insight: `${overdueAttemptedChapters.length} chapter(s) have not been revised in over 7 days (${names.slice(0, 2).join(', ')}${names.length > 2 ? ` +${names.length - 2} more` : ''}).`,
        behaviorCategory: 'timing',
        actionSuggestion: 'Complete a 15-minute active recall review to preserve memory retention before the exam.',
        iconType: 'clock',
      });
    }

    // 4. Overall Question Volume
    const totalAttemptedQuestions = analyzedChapters.reduce((sum, c) => sum + c.questionsSolved, 0);
    const attemptedChaptersTotal = totalAttemptedChaptersCount;
    if (totalAttemptedQuestions >= minSample && attemptedChaptersTotal > 0) {
      const totalCorrect = analyzedChapters.reduce(
        (sum, c) => sum + Math.round((c.questionsSolved * (c.questionAccuracy || 0)) / 100),
        0
      );
      const overallAcc = Math.round((totalCorrect / totalAttemptedQuestions) * 100);
      aiInsights.push({
        id: 'insight_practice_volume',
        title: 'Problem-Solving Volume',
        insight: `${totalAttemptedQuestions} total questions attempted across ${attemptedChaptersTotal} chapter(s) with ${overallAcc}% overall accuracy.`,
        behaviorCategory: 'study_pattern',
        actionSuggestion: 'Continue targeted PYQ sets to turn borderline chapters into high-scoring strengths.',
        iconType: 'activity',
      });
    }

    // Cognitive Radar Dimensions (Only computable dimensions, no topper claims)
    const radarDimensions: CognitiveRadarDimension[] = [];
    const target = WEAKNESS_CONFIG.TARGET_BENCHMARK;

    // 1. Theory Mastery (Derived from real completion percentage)
    const totalChaptersWithData = chapters.length || 1;
    const avgCompletion = Math.round(
      chapters.reduce((sum, c) => sum + (c.progressPercentage || c.completionPercentage || 0), 0) /
        totalChaptersWithData
    );
    radarDimensions.push({
      dimension: 'Theory Mastery',
      score: Math.min(100, Math.max(0, avgCompletion)),
      benchmark: target,
    });

    // 2. Question Accuracy (Only when questions have been attempted)
    if (totalAttemptedQuestions > 0) {
      const totalCorrect = analyzedChapters.reduce(
        (sum, c) => sum + Math.round((c.questionsSolved * (c.questionAccuracy || 0)) / 100),
        0
      );
      const overallAcc = Math.round((totalCorrect / totalAttemptedQuestions) * 100);
      radarDimensions.push({
        dimension: 'Question Accuracy',
        score: Math.min(100, Math.max(0, overallAcc)),
        benchmark: target,
      });
    }

    // 3. Revision Consistency (Only when attempted chapters exist)
    if (attemptedChaptersTotal > 0) {
      const revisedChaptersCount = analyzedChapters.filter(
        (c) => c.weaknessLevel !== 'Not started' && (c as any).revisionCount > 0
      ).length;
      const revPct = Math.round((revisedChaptersCount / attemptedChaptersTotal) * 100);
      radarDimensions.push({
        dimension: 'Revision Consistency',
        score: Math.min(100, Math.max(0, revPct)),
        benchmark: target,
      });
    }

    // 4. Study Consistency (Only when streak is tracked)
    const streakDays = studentStats?.streak || 0;
    if (streakDays > 0) {
      const streakScore = Math.min(100, Math.round((streakDays / 7) * 100));
      radarDimensions.push({
        dimension: 'Consistency',
        score: streakScore,
        benchmark: target,
      });
    }

    // If fewer than 3 dimensions can be computed, radar dimensions remain empty
    const finalRadarDimensions = radarDimensions.length >= 3 ? radarDimensions : [];

    // Record weekly snapshot and compute trend
    let recoveryTrend: { week: string; weaknessScore: number; recoveryRate: number }[] = [];
    let recoveryTrendSentence: string | undefined = undefined;

    const criticalOrWeakCount = analyzedChapters.filter(
      (c) => c.weaknessLevel === 'Critical' || c.weaknessLevel === 'Weak'
    ).length;

    const snapshots = saveWeaknessWeeklySnapshot(
      this.currentUserId,
      attemptedChaptersTotal,
      criticalOrWeakCount
    );

    if (snapshots.length >= 1) {
      recoveryTrend = snapshots.map((s) => ({
        week: s.weekKey,
        weaknessScore: s.weakChapterShare,
        recoveryRate: 100 - s.weakChapterShare,
      }));
    }

    // Days remaining to exam
    let daysToExam: number | null = null;
    if (upcomingExam?.examDate) {
      try {
        const diffMs = new Date(upcomingExam.examDate).getTime() - Date.now();
        daysToExam = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      } catch {
        daysToExam = null;
      }
    }

    if (snapshots.length >= 2) {
      const latest = snapshots[snapshots.length - 1];
      const previous = snapshots[snapshots.length - 2];
      const diff = latest.weakChapterShare - previous.weakChapterShare;
      const daysStr = daysToExam !== null ? ` • ${daysToExam} days left to exam` : '';

      if (diff < 0) {
        recoveryTrendSentence = `Weakness share improved by ${Math.abs(diff)}% since last week${daysStr}.`;
      } else if (diff === 0) {
        recoveryTrendSentence = `Weakness share held steady at ${latest.weakChapterShare}%${daysStr}.`;
      } else {
        recoveryTrendSentence = `Weakness share increased by ${diff}% since last week. Focus on critical chapters${daysStr}.`;
      }
    } else if (snapshots.length === 1) {
      recoveryTrendSentence = 'Tracking starts this week. Complete weekly practice to measure weakness reduction.';
    }

    // Derive Global Common Mistakes from real Mistake Vault items
    const formulaErrors = mistakes.filter((m) => m.mistakeType === 'Formula Error');
    const conceptErrors = mistakes.filter((m) => m.mistakeType === 'Concept Error');
    const calcErrors = mistakes.filter((m) => m.mistakeType === 'Calculation Error' || m.mistakeType === 'Silly Mistake');

    const qTypeCounts: Record<string, number> = {};
    for (const m of mistakes) {
      if (m.questionType) {
        qTypeCounts[m.questionType] = (qTypeCounts[m.questionType] || 0) + 1;
      }
    }
    let topQType = 'No mistake records logged yet';
    let maxQCount = 0;
    for (const [qt, cnt] of Object.entries(qTypeCounts)) {
      if (cnt > maxQCount) {
        maxQCount = cnt;
        topQType = `${qt} Questions (${cnt} errors logged)`;
      }
    }

    const commonMistakesGlobal = {
      mostForgottenFormula:
        formulaErrors.length > 0
          ? `${formulaErrors[0].topic || formulaErrors[0].chapter}: ${formulaErrors[0].question.slice(0, 90)}...`
          : 'No formula mistakes logged yet',
      mostIncorrectConcept:
        conceptErrors.length > 0
          ? `${conceptErrors[0].topic || conceptErrors[0].chapter}: ${conceptErrors[0].question.slice(0, 90)}...`
          : 'No concept mistakes logged yet',
      mostWrongQuestionType: topQType,
      mostWrongNumerical:
        calcErrors.length > 0
          ? `${calcErrors[0].topic || calcErrors[0].chapter}: ${calcErrors[0].question.slice(0, 90)}...`
          : 'No numerical errors logged yet',
    };

    // Derive smart reminders from real urgent items
    const smartReminders: {
      id: string;
      title: string;
      message: string;
      urgency: 'high' | 'medium';
      scheduledFor: string;
    }[] = [];

    if (overdueAttemptedChapters.length > 0) {
      smartReminders.push({
        id: 'rem_overdue',
        title: `Spaced Revision Due: ${overdueAttemptedChapters[0].chapterName}`,
        message: `${overdueAttemptedChapters[0].chapterName} has not been revised in ${overdueAttemptedChapters[0].lastRevisedDaysAgo} days. Conduct a quick active recall session.`,
        urgency: 'high',
        scheduledFor: 'Today, 6:00 PM',
      });
    }

    const topCritical = analyzedChapters.find((c) => c.weaknessLevel === 'Critical');
    if (topCritical) {
      smartReminders.push({
        id: 'rem_critical',
        title: `Critical Chapter Focus: ${topCritical.chapterName}`,
        message: `${topCritical.chapterName} has score ${topCritical.strengthScore}%. Complete targeted practice.`,
        urgency: 'high',
        scheduledFor: 'Tomorrow, 9:00 AM',
      });
    }

    if (openMistakes.length > 0) {
      smartReminders.push({
        id: 'rem_mistakes',
        title: `${openMistakes.length} Unresolved Mistakes in Vault`,
        message: 'Review and re-attempt unmastered errors in your Mistake Vault.',
        urgency: 'medium',
        scheduledFor: 'Today, 8:00 PM',
      });
    }

    const overallData: WeaknessOverallData = {
      userId: this.currentUserId,
      overallWeaknessScore,
      overallHealthScore,
      strongestSubject,
      weakestSubject,
      highestPriorityChapter,
      needsImmediateAttentionCount: immediateAttentionCount,
      top3WeakChapters,
      allChapters: analyzedChapters,
      subjects: subjectsSummary,
      commonMistakesGlobal,
      aiInsights,
      radarDimensions: finalRadarDimensions,
      recoveryTrend,
      recoveryTrendSentence,
      smartReminders,
      calculatedAt: new Date().toISOString(),
    };

    this.cachedData = overallData;
    try {
      safeLocalStorage.setItem(`${STORAGE_KEY}${this.currentUserId}`, overallData);
    } catch (err) {
      console.warn('[WeaknessService] Storage cache write failed:', err);
    }
    this.notify();

    // Firebase background sync
    if (this.currentUserId && this.currentUserId !== 'guest') {
      try {
        const docRef = doc(db, 'users', this.currentUserId, 'weakness_analysis', 'current');
        setDoc(docRef, overallData, { merge: true }).catch((err) => {
          console.warn('[WeaknessService] Firestore sync error:', err);
        });
      } catch (err) {
        console.warn('[WeaknessService] Cloud save exception:', err);
      }
    }

    return overallData;
  }

  public completeChapterActionStep(chapterId: string, stepIndex: number): WeaknessOverallData | null {
    if (!this.cachedData) return null;

    const updatedChapters = this.cachedData.allChapters.map((ch) => {
      if (ch.chapterId === chapterId) {
        const updatedPlan = ch.improvementPlan.map((p, idx) =>
          idx === stepIndex ? { ...p, isCompleted: !p.isCompleted } : p
        );
        return { ...ch, improvementPlan: updatedPlan };
      }
      return ch;
    });

    const updated = {
      ...this.cachedData,
      allChapters: updatedChapters,
      top3WeakChapters: updatedChapters
        .filter((c) => c.weaknessLevel === 'Critical' || c.weaknessLevel === 'Weak')
        .slice(0, 3),
    };

    this.cachedData = updated;
    try {
      safeLocalStorage.setItem(`${STORAGE_KEY}${this.currentUserId}`, updated);
    } catch (err) {
      console.warn('[WeaknessService] Storage cache write failed:', err);
    }
    this.notify();
    toast.success('Action step logged! Recovery trajectory advancing.', { icon: '🎯' });
    return updated;
  }
}

export const weaknessService = WeaknessService.getInstance();
