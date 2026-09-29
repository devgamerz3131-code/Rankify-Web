export type RootCauseType =
  | 'Low Practice'
  | 'No Revision'
  | 'Formula Forgotten'
  | 'Concept Confusion'
  | 'Calculation Errors'
  | 'Guessing Answers'
  | 'Skipping Numericals'
  | 'Incomplete Lecture'
  | 'Low NCERT Reading'
  | 'Poor Consistency';

export type WeaknessLevel = 'Very Strong' | 'Strong' | 'Average' | 'Weak' | 'Critical';

export type WeaknessPriority = 'Critical' | 'High' | 'Medium' | 'Low' | 'No Revision Needed';

export interface ChapterRootCause {
  cause: RootCauseType;
  severity: 'Critical' | 'High' | 'Medium';
  evidence: string; // e.g., "Accuracy on numerical calculations is only 48%"
  fixRecommendation: string;
}

export interface ImprovementPlanStep {
  step: number;
  action: string; // e.g., "Revise Electrochemistry Formula Sheet"
  resource: string; // e.g., "NCERT Page 118-126", "Rankify Formula Deck"
  estMinutes: number;
  ncertPages?: string;
  isCompleted?: boolean;
}

export interface RecoveryMilestone {
  day: number;
  milestone: string;
  confidenceTarget: number;
}

export interface ChapterCommonMistakes {
  mostForgottenFormula: string;
  mostIncorrectConcept: string;
  mostWrongQuestionType: string;
  mostWrongNumerical: string;
}

export interface ChapterWeaknessAnalysis {
  chapterId: string;
  chapterName: string;
  subjectId: string; // 'physics' | 'chemistry' | 'mathematics'
  subjectName: string;
  strengthScore: number; // 0 - 100
  weaknessScore: number; // 0 - 100
  confidence: number; // 0 - 100%
  revisionStatus: string; // e.g. "Overdue by 12 days", "Due in 2 days", "Up to Date"
  lastRevisedDaysAgo: number;
  questionAccuracy: number; // 0 - 100%
  formulaAccuracy: number; // 0 - 100%
  conceptAccuracy: number; // 0 - 100%
  weaknessLevel: WeaknessLevel;
  priority: WeaknessPriority;
  rootCauses: ChapterRootCause[];
  whyExplanation: string; // Non-generic explanation of WHY chapter is weak
  howToImprove: string; // Clear prescriptive guide
  improvementNeededPct: number; // e.g., +38% improvement needed to reach Mastered
  whenToRevise: string; // e.g., "Revise in 2 Days (Thursday, 7:00 PM)"
  whatToStudy: string[]; // Specific focus topics & pages
  improvementPlan: ImprovementPlanStep[];
  estimatedRecoveryDays: number; // e.g., 5 Days
  recoveryMilestones: RecoveryMilestone[];
  commonMistakes: ChapterCommonMistakes;
  timeSpentMinutes: number;
  questionsSolved: number;
  unresolvedMistakesCount: number;
  weightage: number; // CBSE exam marks
}

export interface SubjectWeaknessSummary {
  subjectId: string;
  subjectName: string;
  averageWeaknessScore: number; // 0 - 100
  averageStrengthScore: number; // 0 - 100
  criticalChaptersCount: number;
  weakChaptersCount: number;
  totalChapters: number;
  dominantRootCause: RootCauseType;
  color: string;
}

export interface BehavioralAiInsight {
  id: string;
  title: string;
  insight: string; // e.g. "You forget formulas after 6 days."
  behaviorCategory: 'retention' | 'timing' | 'accuracy' | 'study_pattern';
  confidenceScore: number; // e.g. 92%
  actionSuggestion: string;
  iconType: 'clock' | 'brain' | 'zap' | 'sun' | 'moon' | 'activity';
}

export interface CognitiveRadarDimension {
  dimension: string; // 'Theory Mastery' | 'Numerical Solving' | 'Formula Recall' | 'Memory Retention' | 'Pacing & Speed' | 'Consistency'
  score: number; // 0 - 100
  benchmark: number; // e.g., 85 (topper benchmark)
}

export interface WeaknessOverallData {
  userId: string;
  overallWeaknessScore: number; // 0 - 100 (lower is better, 0 = no weaknesses)
  overallHealthScore: number; // 100 - overallWeaknessScore
  strongestSubject: {
    name: string;
    score: number;
    subjectId: string;
  };
  weakestSubject: {
    name: string;
    score: number;
    subjectId: string;
  };
  needsImmediateAttentionCount: number;
  top3WeakChapters: ChapterWeaknessAnalysis[];
  allChapters: ChapterWeaknessAnalysis[];
  subjects: Record<string, SubjectWeaknessSummary>;
  commonMistakesGlobal: {
    mostForgottenFormula: string;
    mostIncorrectConcept: string;
    mostWrongQuestionType: string;
    mostWrongNumerical: string;
  };
  aiInsights: BehavioralAiInsight[];
  radarDimensions: CognitiveRadarDimension[];
  recoveryTrend: {
    week: string;
    weaknessScore: number;
    recoveryRate: number;
  }[];
  smartReminders: {
    id: string;
    title: string;
    message: string;
    urgency: 'high' | 'medium';
    scheduledFor: string;
  }[];
  calculatedAt: string;
}
