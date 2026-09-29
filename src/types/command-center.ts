export type ChapterReadinessStatus = 'ready' | 'needs_revision' | 'critical';

export interface SubjectReadinessDetail {
  subject: 'Physics' | 'Chemistry' | 'Mathematics';
  progress: number; // 0 - 100
  confidence: number; // 0 - 100
  revisionScore: number; // 0 - 100
  practiceCount: number;
  mockScore: number; // percentage
  predictedScoreMin: number;
  predictedScoreMax: number;
  maxScore: number; // 70 for Phys/Chem, 80 for Math
  color: string;
  gradient: string;
}

export interface SyllabusChapterItem {
  id: string;
  name: string;
  subject: 'Physics' | 'Chemistry' | 'Mathematics';
  status: ChapterReadinessStatus;
  confidence: number;
  weightageMarks: number;
  lastRevisedDaysAgo: number;
  accuracy: number;
  formulaCount: number;
  formulasMastered: number;
}

export interface TodayCommandMission {
  id: string;
  title: string;
  subject: string;
  chapter: string;
  allocatedMinutes: number;
  type: 'revision' | 'pyq' | 'lecture' | 'formula' | 'mock';
  isUrgent: boolean;
  isCompleted: boolean;
  impactScore: number; // +X marks or confidence
}

export interface UrgentTask {
  id: string;
  title: string;
  reason: string;
  subject: string;
  deadlineNotice: string;
  estimatedMinutes: number;
  route: 'study' | 'practice' | 'mistakes' | 'readiness' | 'ai' | 'weakness' | 'replay';
}

export interface AiAlert {
  id: string;
  severity: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
  daysAgo?: number;
  suggestedAction: string;
  actionRoute: 'study' | 'practice' | 'mistakes' | 'readiness' | 'weakness';
}

export interface PredictedSubjectBoardScore {
  subject: string;
  minScore: number;
  maxScore: number;
  totalMarks: number;
  percentageRange: string;
  confidenceInterval: string;
  improvementActions: string[];
}

export interface RevisionSchedulePlan {
  today: string[];
  tomorrow: string[];
  thisWeek: string[];
  beforeExam: string[];
  oneNightBefore: string[];
}

export interface QuestionAccuracyBreakdown {
  mcqAccuracy: number;
  numericalAccuracy: number;
  caseStudyAccuracy: number;
  assertionReasonAccuracy: number;
  subjectiveAccuracy: number;
}

export interface TimeProductivityAnalysis {
  todayStudyMinutes: number;
  thisWeekHours: number;
  monthlyAverageHours: number;
  mostProductiveWindow: string; // e.g. "6:00 PM – 8:00 PM"
  leastProductiveWindow: string; // e.g. "After 10:30 PM"
  peakProductivityReason: string;
  dropProductivityReason: string;
}

export interface Last7DaysMetric {
  day: string;
  date: string;
  hours: number;
  tasksCompleted: number;
  accuracy: number;
  improvementDelta: number; // e.g. +3%
}

export interface HighImpactRecommendation {
  rank: number;
  title: string;
  actionText: string;
  impactLabel: string;
  subject: string;
  chapter: string;
  estimatedMinutes: number;
  route: 'study' | 'practice' | 'mistakes' | 'readiness' | 'weakness';
}

export interface FormulaStatusSummary {
  mastered: number;
  pending: number;
  forgotten: number;
  total: number;
  mostUrgentFormulas: { name: string; chapter: string; formula: string }[];
}

export interface ExamCommandCenterData {
  countdown: {
    targetExamDate: string;
    daysRemaining: number;
    hoursRemaining: number;
    minutesRemaining: number;
  };
  motivationalLine: string;
  currentPreparationStatus: 'Optimal Sprint' | 'Needs Acceleration' | 'Defensive Revision' | 'Crisis Mode';
  overallReadinessPercent: number;
  todaysPriority: string;
  aiStrategy: {
    todaysFocus: string;
    actionDirectives: string[];
    whatToSkip: string;
    tacticalPacing: string;
  };
  subjectReadiness: Record<'Physics' | 'Chemistry' | 'Mathematics', SubjectReadinessDetail>;
  syllabusStats: {
    completedChapters: number;
    remainingChapters: number;
    needsRevisionChapters: number;
    weakChapters: number;
    criticalChapters: number;
    totalChapters: number;
  };
  syllabusChapters: SyllabusChapterItem[];
  todaysCommands: TodayCommandMission[];
  urgentTasks: UrgentTask[];
  aiAlerts: AiAlert[];
  predictedPerformance: {
    overallRange: string;
    subjects: PredictedSubjectBoardScore[];
    highYieldActionSteps: string[];
  };
  revisionSchedule: RevisionSchedulePlan;
  formulaStatus: FormulaStatusSummary;
  questionAnalysis: QuestionAccuracyBreakdown;
  timeAnalysis: TimeProductivityAnalysis;
  last7Days: Last7DaysMetric[];
  top10Recommendations: HighImpactRecommendation[];
  lastUpdatedAt: string;
}
