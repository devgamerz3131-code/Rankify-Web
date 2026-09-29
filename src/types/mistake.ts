export type MistakeType =
  | 'Concept Error'
  | 'Formula Error'
  | 'Calculation Error'
  | 'Reading Error'
  | 'Silly Mistake'
  | 'Time Management'
  | 'Memory Error'
  | 'Guess';

export type MistakeStatus =
  | 'New'
  | 'Needs Revision'
  | 'Learning'
  | 'Improved'
  | 'Mastered';

export type MistakeImportance = 'High' | 'Medium' | 'Normal';

export type MistakeDifficulty = 'Easy' | 'Medium' | 'Hard';

export type QuestionType = 'MCQ' | 'Numerical' | 'Conceptual' | 'Derivation' | 'PYQ';

export interface RevisionRecord {
  revisedAt: string; // ISO date
  wasCorrect: boolean;
  notes?: string;
  stageReached: number;
}

export interface MistakeItem {
  id: string;
  userId: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  studentAnswer: string;
  explanation: string;
  subject: string; // 'Physics' | 'Chemistry' | 'Mathematics' | 'Biology'
  chapter: string;
  topic?: string;
  difficulty: MistakeDifficulty;
  questionType: QuestionType;
  mistakeType: MistakeType;
  importance: MistakeImportance;
  confidence: number; // 1 to 5
  status: MistakeStatus;
  source: string; // e.g. "Targeted Weak Area Practice", "PYQ Bank", "Quick Quiz"
  createdAt: string; // ISO date
  lastRevisedAt?: string;
  nextRevisionDue: string; // ISO date
  revisionStage: number; // 0 = New, 1 = 1 day, 2 = 3 days, 3 = 7 days, 4 = 14 days, 5 = 30 days (Mastered)
  revisionHistory: RevisionRecord[];
  isBookmarked: boolean;
  isPinned: boolean;
  notes?: string;
}

export interface MistakeFilterOptions {
  searchQuery: string;
  subject: string; // 'All' | 'Physics' | 'Chemistry' | 'Mathematics'
  chapter: string; // 'All' or chapter name
  mistakeType: string; // 'All' or MistakeType
  difficulty: string; // 'All' | 'Easy' | 'Medium' | 'Hard'
  revisionDue: 'All' | 'Due Today' | 'Overdue' | 'Upcoming';
  status: 'All' | MistakeStatus;
  bookmarkedOnly: boolean;
  pinnedOnly: boolean;
}

export interface MistakeStatistics {
  totalMistakes: number;
  resolvedCount: number; // Mastered or Improved
  pendingTodayCount: number;
  overdueCount: number;
  conceptErrorsCount: number;
  calculationErrorsCount: number;
  formulaErrorsCount: number;
  sillyMistakesCount: number;
  mostMistakesSubject: string;
  mostMistakesChapter: string;
  accuracyImprovementPct: number;
  lastRevisedDate: string | null;
  mistakesPerWeek: { weekLabel: string; count: number }[];
  mistakesBySubject: { subject: string; count: number; pct: number }[];
  improvementTrend: { dayLabel: string; accuracyPct: number; resolvedRate: number }[];
  commonMistakeTopics: { topic: string; subject: string; count: number }[];
  mostDifficultChapters: { chapter: string; subject: string; count: number }[];
}
