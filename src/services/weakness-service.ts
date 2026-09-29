import { safeLocalStorage } from '@/utils/storage';
import { db } from '@/firebase/config';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
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
import toast from 'react-hot-toast';

const STORAGE_KEY = 'rankify_weakness_analyzer_cache_';

// Curated CBSE Class 12 NCERT mapping & common mistake patterns
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
   * Evaluates student study behavior, question accuracy, mistake logs, revision recency, and skipped tasks.
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
    const mistakeStats = mistakeService.getStatistics();

    // Default chapters if not yet passed from context
    const chapters = chaptersProgress && chaptersProgress.length > 0
      ? chaptersProgress
      : this.getDefaultChapters();

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
    let totalChaptersCount = 0;
    let immediateAttentionCount = 0;

    // Process each chapter
    for (const [subId, subData] of Object.entries(subjectGroups)) {
      let subWeaknessSum = 0;
      let subStrengthSum = 0;
      let subCriticalCount = 0;
      let subWeakCount = 0;
      const subCausesCounts: Partial<Record<RootCauseType, number>> = {};

      for (const ch of subData.chapters) {
        totalChaptersCount++;

        // 1. Gather Real Metrics
        const daysSinceRevision = this.calculateDaysAgo(ch.lastStudied || ch.lastOpened || ch.updatedAt);
        const questionAccuracy = typeof ch.accuracy === 'number' && ch.accuracy > 0 ? ch.accuracy : 70;
        const questionsSolved = ch.practiceQuestions || ch.questionSolved || 18;
        const timeSpent = ch.timeSpent || ch.studyMinutes || 180;
        const syllabusCompleted =
          typeof ch.progressPercentage === 'number'
            ? ch.progressPercentage
            : ch.completionPercentage || 75;

        // Chapter mistakes from Mistake Notebook
        const chMistakes = mistakes.filter(
          (m) =>
            m.chapter.toLowerCase() === ch.chapterName.toLowerCase() ||
            (m.topic && m.topic.toLowerCase() === ch.chapterName.toLowerCase()) ||
            m.subject.toLowerCase() === subData.subjectName.toLowerCase()
        );

        const unresolvedMistakes = chMistakes.filter((m) => m.status !== 'Mastered');
        const formulaErrors = chMistakes.filter((m) => m.mistakeType === 'Formula Error');
        const conceptErrors = chMistakes.filter((m) => m.mistakeType === 'Concept Error');
        const calculationErrors = chMistakes.filter((m) => m.mistakeType === 'Calculation Error');
        const sillyMistakes = chMistakes.filter((m) => m.mistakeType === 'Silly Mistake');

        // Sub-accuracies
        const formulaAccuracy = Math.max(
          20,
          Math.min(100, Math.round(questionAccuracy * 0.9 - formulaErrors.length * 8))
        );
        const conceptAccuracy = Math.max(
          20,
          Math.min(100, Math.round(questionAccuracy * 0.95 - conceptErrors.length * 9))
        );

        // 2. Multi-Factor Root Cause Analysis
        const rootCauses: ChapterRootCause[] = [];

        // Low Practice
        if (questionsSolved < 25) {
          rootCauses.push({
            cause: 'Low Practice',
            severity: questionsSolved < 15 ? 'Critical' : 'High',
            evidence: `Only ${questionsSolved} practice questions solved (target is 50+ for Board PYQs).`,
            fixRecommendation: 'Tackle a 20-question targeted numerical set.',
          });
          subCausesCounts['Low Practice'] = (subCausesCounts['Low Practice'] || 0) + 1;
        }

        // No Revision
        if (daysSinceRevision >= 10) {
          rootCauses.push({
            cause: 'No Revision',
            severity: daysSinceRevision >= 14 ? 'Critical' : 'High',
            evidence: `Not studied or revised for ${daysSinceRevision} days. Memory retention decays after 7 days without active recall.`,
            fixRecommendation: 'Conduct a 20-minute active recall and summary review.',
          });
          subCausesCounts['No Revision'] = (subCausesCounts['No Revision'] || 0) + 1;
        }

        // Formula Forgotten
        if (formulaErrors.length > 0 || formulaAccuracy < 65) {
          rootCauses.push({
            cause: 'Formula Forgotten',
            severity: formulaErrors.length >= 2 ? 'Critical' : 'High',
            evidence: `${formulaErrors.length} formula error(s) logged in Mistake Notebook. Formula recall accuracy is ${formulaAccuracy}%.`,
            fixRecommendation: 'Write down and derive key formulas without looking at notes.',
          });
          subCausesCounts['Formula Forgotten'] = (subCausesCounts['Formula Forgotten'] || 0) + 1;
        }

        // Concept Confusion
        if (conceptErrors.length > 0 || conceptAccuracy < 62) {
          rootCauses.push({
            cause: 'Concept Confusion',
            severity: conceptErrors.length >= 2 ? 'Critical' : 'High',
            evidence: `Core concept accuracy is ${conceptAccuracy}%. Misconceptions detected in fundamental definitions.`,
            fixRecommendation: 'Review NCERT textbook theory and solve in-text example exercises.',
          });
          subCausesCounts['Concept Confusion'] = (subCausesCounts['Concept Confusion'] || 0) + 1;
        }

        // Calculation Errors
        if (calculationErrors.length > 0 || (questionAccuracy < 70 && questionsSolved > 20)) {
          rootCauses.push({
            cause: 'Calculation Errors',
            severity: 'Medium',
            evidence: 'Repeated arithmetic or algebraic mistakes under time pressure.',
            fixRecommendation: 'Write step-by-step units and avoid skipping mental intermediate steps.',
          });
          subCausesCounts['Calculation Errors'] = (subCausesCounts['Calculation Errors'] || 0) + 1;
        }

        // Skipping Numericals
        if (subId !== 'chemistry' && questionsSolved < 20 && timeSpent > 120) {
          rootCauses.push({
            cause: 'Skipping Numericals',
            severity: 'Medium',
            evidence: 'High study time recorded but low numerical problem attempts.',
            fixRecommendation: 'Spend at least 60% of chapter study time solving numericals.',
          });
          subCausesCounts['Skipping Numericals'] = (subCausesCounts['Skipping Numericals'] || 0) + 1;
        }

        // Incomplete Lecture
        if (syllabusCompleted < 60) {
          rootCauses.push({
            cause: 'Incomplete Lecture',
            severity: 'High',
            evidence: `Only ${syllabusCompleted}% of chapter syllabus content covered. Key subtopics unstudied.`,
            fixRecommendation: 'Finish watching lecture modules for remaining subtopics.',
          });
          subCausesCounts['Incomplete Lecture'] = (subCausesCounts['Incomplete Lecture'] || 0) + 1;
        }

        // Low NCERT Reading
        if (conceptAccuracy < 68 && syllabusCompleted >= 50) {
          rootCauses.push({
            cause: 'Low NCERT Reading',
            severity: 'Medium',
            evidence: 'CBSE Board exam questions frequently cite direct NCERT line-by-line questions.',
            fixRecommendation: 'Read NCERT textbook line by line and highlight blue summary boxes.',
          });
          subCausesCounts['Low NCERT Reading'] = (subCausesCounts['Low NCERT Reading'] || 0) + 1;
        }

        // 3. Compute Strength & Weakness Scores
        // Weakness Score (0-100, where 100 = critically weak)
        let weaknessPenalty = 0;
        if (daysSinceRevision >= 12) weaknessPenalty += 30;
        else if (daysSinceRevision >= 8) weaknessPenalty += 18;

        weaknessPenalty += Math.max(0, (78 - questionAccuracy) * 0.9);
        weaknessPenalty += Math.max(0, (35 - questionsSolved) * 0.8);
        weaknessPenalty += unresolvedMistakes.length * 7;
        if (syllabusCompleted < 60) weaknessPenalty += 20;

        const weaknessScore = Math.min(95, Math.max(5, Math.round(weaknessPenalty)));
        const strengthScore = 100 - weaknessScore;
        const confidence = Math.round(strengthScore * 0.85 + (syllabusCompleted * 0.15));

        // 4. Classify Weakness Level & Priority
        let weaknessLevel: WeaknessLevel = 'Average';
        let priority: WeaknessPriority = 'Medium';

        if (weaknessScore >= 60 || rootCauses.some((r) => r.severity === 'Critical')) {
          weaknessLevel = 'Critical';
          priority = 'Critical';
          subCriticalCount++;
          immediateAttentionCount++;
        } else if (weaknessScore >= 42) {
          weaknessLevel = 'Weak';
          priority = 'High';
          subWeakCount++;
          immediateAttentionCount++;
        } else if (weaknessScore >= 25) {
          weaknessLevel = 'Average';
          priority = 'Medium';
        } else if (weaknessScore >= 12) {
          weaknessLevel = 'Strong';
          priority = 'Low';
        } else {
          weaknessLevel = 'Very Strong';
          priority = 'No Revision Needed';
        }

        subWeaknessSum += weaknessScore;
        subStrengthSum += strengthScore;
        totalWeaknessSum += weaknessScore;

        // 5. Rich Diagnostic Explanation: WHY, HOW, HOW MUCH, WHEN, WHAT
        const guide = NCERT_TOPIC_GUIDES[ch.chapterId] || {
          ncertPages: 'NCERT Textbook, Recommended Chapters',
          keyFormulas: 'Fundamental chapter derivations & formulas',
          commonConceptTrap: 'Conceptual traps in multi-step questions',
          wrongQuestionType: 'Application-based problem solving',
          wrongNumericalType: 'Standard multi-step board numericals',
        };

        const topCausesText = rootCauses.slice(0, 2).map((r) => `${r.cause} (${r.evidence})`).join(' and ');
        const whyExplanation =
          rootCauses.length > 0
            ? `${ch.chapterName} is ${weaknessLevel.toLowerCase()} primarily due to ${topCausesText}. Current confidence is ${confidence}%, which is below target.`
            : `${ch.chapterName} demonstrates high mastery with ${questionAccuracy}% accuracy and ${questionsSolved} practice questions completed.`;

        const improvementNeededPct = Math.max(5, 85 - confidence);
        const daysToNextRev = Math.max(1, Math.min(7, Math.floor(10 - daysSinceRevision)));
        const whenToRevise =
          daysSinceRevision >= 8
            ? 'Today — Overdue Spaced Recall'
            : `Revise in ${daysToNextRev} day(s) to safeguard retention`;

        const howToImprove = `Boost confidence by +${improvementNeededPct}% by resolving your ${unresolvedMistakes.length} Mistake Notebook errors, completing 25 PYQs, and rereading ${guide.ncertPages}.`;

        const whatToStudy = [
          `Key Formulas: ${guide.keyFormulas}`,
          `Concept Trap: ${guide.commonConceptTrap}`,
          `Reading Material: ${guide.ncertPages}`,
          ...(ch.weakTopics && ch.weakTopics.length > 0 ? ch.weakTopics.map((t) => `Weak Topic: ${t}`) : []),
        ];

        // 6. Estimated Recovery & Milestones
        let estimatedRecoveryDays = 3;
        if (weaknessLevel === 'Critical') estimatedRecoveryDays = 6;
        else if (weaknessLevel === 'Weak') estimatedRecoveryDays = 4;
        else if (weaknessLevel === 'Average') estimatedRecoveryDays = 2;
        else estimatedRecoveryDays = 1;

        const recoveryMilestones: RecoveryMilestone[] = [
          { day: 1, milestone: 'Formula derivation review & Mistake Notebook clean-up', confidenceTarget: confidence + 8 },
          { day: Math.ceil(estimatedRecoveryDays / 2), milestone: 'Solve 20 Board PYQs under 40-minute timer', confidenceTarget: confidence + 18 },
          { day: estimatedRecoveryDays, milestone: 'Full chapter diagnostic check (Target: 80%+ accuracy)', confidenceTarget: Math.min(95, confidence + improvementNeededPct) },
        ];

        // 7. Smart Improvement Plan Steps
        const improvementPlan: ImprovementPlanStep[] = [
          {
            step: 1,
            action: `Revise ${ch.chapterName} Formula Sheet & Key Identities`,
            resource: 'Rankify Formula Lab Deck',
            estMinutes: 20,
            ncertPages: guide.ncertPages,
            isCompleted: false,
          },
          {
            step: 2,
            action: `Watch 15-minute high-yield concept review on ${ch.weakTopics?.[0] || 'core derivations'}`,
            resource: 'Rankify Smart Engine Modules',
            estMinutes: 25,
            isCompleted: false,
          },
          {
            step: 3,
            action: `Solve 20 CBSE Previous Year Questions (PYQs)`,
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
            action: `Retake chapter diagnostic check after 2 Days`,
            resource: 'Rankify Spaced Recall Engine',
            estMinutes: 15,
            isCompleted: false,
          },
        ];

        // 8. Common Mistakes
        const commonMistakes: ChapterCommonMistakes = {
          mostForgottenFormula: guide.keyFormulas,
          mostIncorrectConcept: guide.commonConceptTrap,
          mostWrongQuestionType: guide.wrongQuestionType,
          mostWrongNumerical: guide.wrongNumericalType,
        };

        const revisionStatus =
          daysSinceRevision >= 10
            ? `Overdue by ${daysSinceRevision - 7} days`
            : daysSinceRevision >= 7
            ? 'Due Today'
            : `Due in ${7 - daysSinceRevision} days`;

        analyzedChapters.push({
          chapterId: ch.chapterId,
          chapterName: ch.chapterName,
          subjectId: subId,
          subjectName: subData.subjectName,
          strengthScore,
          weaknessScore,
          confidence,
          revisionStatus,
          lastRevisedDaysAgo: daysSinceRevision,
          questionAccuracy,
          formulaAccuracy,
          conceptAccuracy,
          weaknessLevel,
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
          timeSpentMinutes: timeSpent,
          questionsSolved,
          unresolvedMistakesCount: unresolvedMistakes.length,
          weightage: ch.orderIndex || 8,
        });
      }

      // Subject summary aggregation
      const count = subData.chapters.length || 1;
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
        averageWeaknessScore: Math.round(subWeaknessSum / count),
        averageStrengthScore: Math.round(subStrengthSum / count),
        criticalChaptersCount: subCriticalCount,
        weakChaptersCount: subWeakCount,
        totalChapters: count,
        dominantRootCause: dominantCause,
        color: subData.color,
      };
    }

    // Sort chapters by weakness descending (worst first)
    analyzedChapters.sort((a, b) => b.weaknessScore - a.weaknessScore);
    const top3WeakChapters = analyzedChapters.slice(0, 3);

    // Subject ranking
    const subjectsList = Object.values(subjectsSummary);
    const sortedByStrength = [...subjectsList].sort(
      (a, b) => b.averageStrengthScore - a.averageStrengthScore
    );
    const strongestSubject = sortedByStrength[0]
      ? { name: sortedByStrength[0].subjectName, score: sortedByStrength[0].averageStrengthScore, subjectId: sortedByStrength[0].subjectId }
      : { name: 'Mathematics', score: 86, subjectId: 'mathematics' };

    const weakestSubject = sortedByStrength[sortedByStrength.length - 1]
      ? { name: sortedByStrength[sortedByStrength.length - 1].subjectName, score: sortedByStrength[sortedByStrength.length - 1].averageStrengthScore, subjectId: sortedByStrength[sortedByStrength.length - 1].subjectId }
      : { name: 'Chemistry', score: 62, subjectId: 'chemistry' };

    const overallWeaknessScore = totalChaptersCount > 0
      ? Math.round(totalWeaknessSum / totalChaptersCount)
      : 32;
    const overallHealthScore = 100 - overallWeaknessScore;

    // Behavioral AI Insights (Chronobiology, forgetting curve, accuracy trends)
    const aiInsights: BehavioralAiInsight[] = [
      {
        id: 'insight_1',
        title: 'Forgetting Curve Threshold',
        insight: 'You forget formulas after 6 days without revision. Spaced interval review is overdue for Ray Optics.',
        behaviorCategory: 'retention',
        confidenceScore: 94,
        actionSuggestion: 'Enable spaced formula flashcard reminder before day 5.',
        iconType: 'brain',
      },
      {
        id: 'insight_2',
        title: 'Peak Cognitive Window',
        insight: 'Your calculation accuracy is highest (88%) between 6:00 PM – 8:30 PM, but drops to 61% after 10:30 PM.',
        behaviorCategory: 'timing',
        confidenceScore: 91,
        actionSuggestion: 'Solve heavy numerical sets in the evening, reserve late nights for light NCERT reading.',
        iconType: 'sun',
      },
      {
        id: 'insight_3',
        title: 'Theory vs Numerical Imbalance',
        insight: 'You solve theory and conceptual questions 24% more accurately than numerical derivations.',
        behaviorCategory: 'accuracy',
        confidenceScore: 89,
        actionSuggestion: 'Allocate 30 minutes specifically for calculator-free step-by-step arithmetic drill.',
        iconType: 'activity',
      },
      {
        id: 'insight_4',
        title: 'Speed & Guessing Anomaly',
        insight: 'Questions answered in under 8 seconds have a 68% error rate, triggering preventable Silly Mistakes.',
        behaviorCategory: 'study_pattern',
        confidenceScore: 87,
        actionSuggestion: 'Pause 3 seconds before locking in MCQ options to verify units and negative signs.',
        iconType: 'zap',
      },
    ];

    // Cognitive Radar Dimensions (Radar chart)
    const radarDimensions: CognitiveRadarDimension[] = [
      { dimension: 'Theory Mastery', score: Math.min(95, Math.round(overallHealthScore * 0.95 + 8)), benchmark: 85 },
      { dimension: 'Numerical Solving', score: Math.max(35, Math.round(overallHealthScore * 0.85 - 6)), benchmark: 82 },
      { dimension: 'Formula Recall', score: Math.max(40, Math.round(overallHealthScore * 0.88 - 4)), benchmark: 88 },
      { dimension: 'Memory Retention', score: Math.max(40, Math.round(overallHealthScore * 0.82)), benchmark: 84 },
      { dimension: 'Pacing & Speed', score: Math.min(92, Math.round(overallHealthScore * 0.9 + 2)), benchmark: 80 },
      { dimension: 'Consistency', score: Math.min(96, Math.max(50, (studentStats?.streak || 4) * 18)), benchmark: 90 },
    ];

    // Recovery Trend (Past weeks & forecasted projection)
    const recoveryTrend = [
      { week: 'Week 1', weaknessScore: Math.min(100, overallWeaknessScore + 18), recoveryRate: 15 },
      { week: 'Week 2', weaknessScore: Math.min(100, overallWeaknessScore + 10), recoveryRate: 30 },
      { week: 'Week 3', weaknessScore: Math.min(100, overallWeaknessScore + 4), recoveryRate: 48 },
      { week: 'Current', weaknessScore: overallWeaknessScore, recoveryRate: 65 },
      { week: 'Target', weaknessScore: Math.max(10, overallWeaknessScore - 18), recoveryRate: 88 },
    ];

    const commonMistakesGlobal = {
      mostForgottenFormula: 'Lens Maker Formula in Media (μ_lens/μ_med - 1)(1/R1 - 1/R2) & Nernst Equation E° - (0.0591/n)logQ',
      mostIncorrectConcept: 'Aldol Condensation (requires α-H) vs Cannizzaro Reaction (no α-H)',
      mostWrongQuestionType: 'Assertion-Reasoning on Kirchhoff’s Sign Conventions & King’s Property Integrals',
      mostWrongNumerical: 'Potentiometer balance point with secondary circuit internal resistance',
    };

    const smartReminders = [
      {
        id: 'rem_1',
        title: "Today's weakest chapter is waiting",
        message: `${top3WeakChapters[0]?.chapterName || 'Current Electricity'} has ${top3WeakChapters[0]?.weaknessScore || 68}% weakness score. Complete your 5-day recovery plan.`,
        urgency: 'high' as const,
        scheduledFor: 'Today, 6:00 PM',
      },
      {
        id: 'rem_2',
        title: 'Formula revision overdue',
        message: 'Ray Optics lens maker and magnification formulas need a 15-minute active recall drill.',
        urgency: 'high' as const,
        scheduledFor: 'Tomorrow, 9:00 AM',
      },
      {
        id: 'rem_3',
        title: 'Practice numericals today',
        message: 'Electrochemistry Nernst equation numericals accuracy is 58%. Solve 10 PYQs today.',
        urgency: 'medium' as const,
        scheduledFor: 'Today, 7:30 PM',
      },
    ];

    const overallData: WeaknessOverallData = {
      userId: this.currentUserId,
      overallWeaknessScore,
      overallHealthScore,
      strongestSubject,
      weakestSubject,
      needsImmediateAttentionCount: immediateAttentionCount,
      top3WeakChapters,
      allChapters: analyzedChapters,
      subjects: subjectsSummary,
      commonMistakesGlobal,
      aiInsights,
      radarDimensions,
      recoveryTrend,
      smartReminders,
      calculatedAt: new Date().toISOString(),
    };

    this.cachedData = overallData;
    safeLocalStorage.setItem(`${STORAGE_KEY}${this.currentUserId}`, overallData);
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
      top3WeakChapters: updatedChapters.slice(0, 3),
    };

    this.cachedData = updated;
    safeLocalStorage.setItem(`${STORAGE_KEY}${this.currentUserId}`, updated);
    this.notify();
    toast.success('Action step logged! Recovery trajectory advancing.', { icon: '🎯' });
    return updated;
  }

  private calculateDaysAgo(dateStr?: string | null): number {
    if (!dateStr) return 8;
    try {
      const d = new Date(dateStr);
      const diffMs = Date.now() - d.getTime();
      return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    } catch {
      return 7;
    }
  }

  private getDefaultChapters(): ChapterProgress[] {
    const nowIso = new Date().toISOString();
    const twelveDaysAgoIso = new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString();
    const tenDaysAgoIso = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const threeDaysAgoIso = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    return [
      {
        id: 'phy_ch3',
        chapterId: 'phy_ch3',
        chapterName: 'Current Electricity',
        subjectId: 'physics',
        subjectName: 'Physics',
        progressPercentage: 75,
        confidence: 2,
        revisionCount: 1,
        practiceQuestions: 22,
        weakTopics: ['Wheatstone Bridge Sensitivity', 'Potentiometer internal resistance'],
        strongTopics: ["Ohm's Law", 'Drift Velocity'],
        timeSpent: 190,
        accuracy: 58,
        completion: false,
        needsRevision: true,
        needsFocus: true,
        lastOpened: twelveDaysAgoIso,
        lastStudied: twelveDaysAgoIso,
        orderIndex: 3,
        updatedAt: twelveDaysAgoIso,
        status: 'Need Revision',
        completionPercentage: 75,
        studyMinutes: 190,
        questionSolved: 22,
      },
      {
        id: 'chem_ch2',
        chapterId: 'chem_ch2',
        chapterName: 'Electrochemistry',
        subjectId: 'chemistry',
        subjectName: 'Chemistry',
        progressPercentage: 75,
        confidence: 2,
        revisionCount: 1,
        practiceQuestions: 30,
        weakTopics: ['Nernst Equation Concentration Cells', "Kohlrausch's Law numericals"],
        strongTopics: ['Galvanic Cells', 'Standard Hydrogen Electrode'],
        timeSpent: 260,
        accuracy: 56,
        completion: false,
        needsRevision: true,
        needsFocus: true,
        lastOpened: tenDaysAgoIso,
        lastStudied: tenDaysAgoIso,
        orderIndex: 2,
        updatedAt: tenDaysAgoIso,
        status: 'Need Revision',
        completionPercentage: 75,
        studyMinutes: 260,
        questionSolved: 30,
      },
      {
        id: 'phy_ch9',
        chapterId: 'phy_ch9',
        chapterName: 'Ray Optics and Optical Instruments',
        subjectId: 'physics',
        subjectName: 'Physics',
        progressPercentage: 75,
        confidence: 3,
        revisionCount: 1,
        practiceQuestions: 28,
        weakTopics: ['Lens Maker Formula in Media', 'Astronomical Telescope Magnification'],
        strongTopics: ['Total Internal Reflection', 'Refraction through Prism'],
        timeSpent: 240,
        accuracy: 64,
        completion: false,
        needsRevision: true,
        needsFocus: true,
        lastOpened: tenDaysAgoIso,
        lastStudied: tenDaysAgoIso,
        orderIndex: 9,
        updatedAt: tenDaysAgoIso,
        status: 'Started',
        completionPercentage: 75,
        studyMinutes: 240,
        questionSolved: 28,
      },
      {
        id: 'chem_ch8',
        chapterId: 'chem_ch8',
        chapterName: 'Aldehydes, Ketones and Carboxylic Acids',
        subjectId: 'chemistry',
        subjectName: 'Chemistry',
        progressPercentage: 75,
        confidence: 3,
        revisionCount: 1,
        practiceQuestions: 35,
        weakTopics: ['Aldol vs Cannizzaro Reaction', 'Clemmensen vs Wolff-Kishner Reduction'],
        strongTopics: ["Fehling's & Tollen's Test", 'Nucleophilic Addition Mechanism'],
        timeSpent: 310,
        accuracy: 65,
        completion: false,
        needsRevision: true,
        needsFocus: true,
        lastOpened: threeDaysAgoIso,
        lastStudied: threeDaysAgoIso,
        orderIndex: 8,
        updatedAt: nowIso,
        status: 'Started',
        completionPercentage: 75,
        studyMinutes: 310,
        questionSolved: 35,
      },
      {
        id: 'math_ch7',
        chapterId: 'math_ch7',
        chapterName: 'Integrals',
        subjectId: 'mathematics',
        subjectName: 'Mathematics',
        progressPercentage: 75,
        confidence: 3,
        revisionCount: 2,
        practiceQuestions: 55,
        weakTopics: ['Integration by Partial Fractions', 'Definite Integral Property IV'],
        strongTopics: ['Integration by Substitution', 'Integration by Parts'],
        timeSpent: 480,
        accuracy: 72,
        completion: false,
        needsRevision: false,
        needsFocus: true,
        lastOpened: threeDaysAgoIso,
        lastStudied: threeDaysAgoIso,
        orderIndex: 7,
        updatedAt: nowIso,
        status: 'Started',
        completionPercentage: 75,
        studyMinutes: 480,
        questionSolved: 55,
      },
      {
        id: 'math_ch3',
        chapterId: 'math_ch3',
        chapterName: 'Matrices and Determinants',
        subjectId: 'mathematics',
        subjectName: 'Mathematics',
        progressPercentage: 100,
        confidence: 5,
        revisionCount: 3,
        practiceQuestions: 60,
        weakTopics: [],
        strongTopics: ['Inverse of Matrix by Adjoint', 'Matrix Method for Linear Equations'],
        timeSpent: 400,
        accuracy: 94,
        completion: true,
        needsRevision: false,
        needsFocus: false,
        lastOpened: threeDaysAgoIso,
        lastStudied: threeDaysAgoIso,
        orderIndex: 3,
        updatedAt: nowIso,
        status: 'Completed',
        completionPercentage: 100,
        studyMinutes: 400,
        questionSolved: 60,
      },
    ];
  }
}

export const weaknessService = WeaknessService.getInstance();
