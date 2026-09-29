export type ReadinessRating = 'Excellent' | 'Good' | 'Average' | 'Needs Improvement';

export type ChapterReadinessStatus = 'Ready' | 'Needs Revision' | 'Needs Practice' | 'Weak' | 'Mastered';

export interface SubjectReadiness {
  subjectId: string;
  subjectName: string;
  overallScore: number; // 0 - 100
  rating: ReadinessRating;
  progressPercent: number; // Syllabus completed %
  confidencePercent: number; // Subject confidence %
  revisionPercent: number; // Revision recency & frequency %
  practicePercent: number; // Practice questions & accuracy %
  formulaPercent: number; // Formula sheet revision %
  mockPercent: number; // Mock test performance %
  status: ChapterReadinessStatus;
  totalChapters: number;
  masteredChapters: number;
  needsRevisionChapters: number;
  weakChapters: number;
  averageAccuracy: number;
  unresolvedMistakesCount: number;
  totalQuestionsSolved: number;
  color: string;
}

export interface ChapterReadiness {
  chapterId: string;
  chapterName: string;
  subjectId: string;
  subjectName: string;
  confidence: number; // 0 - 100%
  status: ChapterReadinessStatus;
  syllabusCompleted: number; // 0 - 100%
  accuracy: number; // 0 - 100%
  questionsAttempted: number;
  lastRevisedDaysAgo: number;
  unresolvedMistakes: number;
  weightage: number; // Marks in CBSE/Board exam
  weakTopics: string[];
  strongTopics: string[];
  lastStudiedDate?: string;
  needsAttention: boolean;
}

export type DiagnosticType = 'positive' | 'warning' | 'critical';

export interface ReadinessDiagnostic {
  id: string;
  type: DiagnosticType;
  title: string;
  description: string;
  metric: string;
  subject?: string;
  chapter?: string;
  actionableStep?: string;
}

export type ImprovementActionType = 'revise' | 'practice' | 'ncert' | 'pyq' | 'formula' | 'mistakes' | 'mock';

export interface ImprovementAction {
  id: string;
  rank: number;
  title: string;
  subject: string;
  chapter?: string;
  description: string;
  actionType: ImprovementActionType;
  actionLabel: string;
  priority: 'Critical' | 'High' | 'Medium';
  impactPercentage: number; // e.g. +3%
  estimatedMinutes: number;
  isCompleted?: boolean;
}

export type ExamModePhase = '3-days' | '7-days' | '14-days' | '30-days' | 'normal';

export interface ExamModeConfig {
  targetExam: string; // e.g. "CBSE Board Exams", "JEE Main", "NEET UG"
  targetDate: string; // YYYY-MM-DD
  daysRemaining: number;
  phase: ExamModePhase;
  phaseTitle: string;
  badgeText: string;
  strategySummary: string;
  dailyFocusTimeHours: number;
  recommendedActions: string[];
}

export interface ReadinessPrediction {
  currentPreparation: number; // e.g. 74%
  expectedReadiness: number; // projected score e.g. 88%
  potentialGain: number; // expected - current
  highPrioritySubjects: string[];
  lowPrioritySubjects: string[];
  predictedScoreBand: string; // e.g. "88% - 94%"
  paceStatus: 'Ahead of Pace' | 'On Track' | 'Needs Immediate Push';
}

export interface ReadinessWeeklyTrendPoint {
  day: string; // e.g. "Mon", "Tue"
  date: string;
  score: number;
  physicsScore: number;
  chemistryScore: number;
  mathScore: number;
}

export interface ExamReadinessData {
  userId: string;
  overallScore: number; // 0 - 100
  rating: ReadinessRating;
  calculatedAt: string;
  examMode: ExamModeConfig;
  subjects: Record<string, SubjectReadiness>;
  chapters: ChapterReadiness[];
  whyThisScore: {
    summary: string;
    diagnostics: ReadinessDiagnostic[];
    positivePointsCount: number;
    warningPointsCount: number;
    criticalPointsCount: number;
  };
  improvementPlan: ImprovementAction[];
  prediction: ReadinessPrediction;
  weeklyTrend: ReadinessWeeklyTrendPoint[];
  metricsFactors: {
    syllabusCoverageScore: number; // 0-100
    questionAccuracyScore: number; // 0-100
    revisionRecencyScore: number; // 0-100
    practiceVolumeScore: number; // 0-100
    mockPerformanceScore: number; // 0-100
    consistencyStreakScore: number; // 0-100
    mistakeNotebookScore: number; // 0-100
    formulaRevisionScore: number; // 0-100
    lectureCompletionScore: number; // 0-100
  };
}
