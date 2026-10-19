import { CBSEClassNumber } from './cbse';

export type QuestionType =
  | 'MCQ'
  | 'Numerical'
  | 'Short Answer'
  | 'Long Answer'
  | 'Case Based'
  | 'Competency Based'
  | 'Assertion Reason'
  | 'Match the Following'
  | 'Fill in the Blanks'
  | 'True False'
  | 'HOTS'
  | 'Mixed Test';

export type QuestionDifficulty =
  | 'Easy'
  | 'Easy + Medium'
  | 'Medium'
  | 'Medium + Hard'
  | 'Hard'
  | 'Adaptive';

export type ExamMode =
  | 'board-practice'
  | 'chapter-test'
  | 'unit-test'
  | 'half-yearly'
  | 'pre-board'
  | 'final-revision'
  | 'mock-test'
  | 'pyq-style'
  | 'competency-mode';

export type QuestionSource =
  | 'student-weakness'
  | 'mistake-notebook'
  | 'board-pattern'
  | 'ncert-pattern'
  | 'competency-pattern'
  | 'assertion-reason'
  | 'case-study'
  | 'previous-practice'
  | 'revision-history';

export interface FormulaReference {
  name: string;
  equation: string;
  variables: string;
}

export interface NcertReference {
  chapter: string;
  section: string;
  page?: number;
  textbookTitle: string;
}

export interface SmartQuestionExplanation {
  correctSolution: string;
  stepByStep: string[];
  commonMistake: string;
  formulaUsed?: FormulaReference;
  ncertReference: NcertReference;
  difficultyLevel: 'Easy' | 'Medium' | 'Hard';
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface SmartQuestion {
  id: string;
  subject: 'Physics' | 'Chemistry' | 'Mathematics';
  chapter: string;
  topic: string;
  type: QuestionType;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  question: string;
  options?: string[];
  correctAnswer: string | number;
  correctOptionIndex?: number;
  numericalTolerance?: number; // for numericals e.g. 0.05
  numericalUnit?: string;
  matchingPairs?: MatchingPair[]; // for match the following
  casePassage?: string; // for case based
  caseSubQuestions?: {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
  assertion?: string; // for assertion reason
  reason?: string; // for assertion reason
  keyRubric?: string[]; // for short/long answer evaluation
  explanation: SmartQuestionExplanation;
  source: QuestionSource;
  yearOrTag?: string; // e.g., "CBSE 2023", "NCERT Exemplar", "HOTS"
  competencySkill?: string; // e.g. "Critical Thinking", "Problem Solving"
}

export interface SmartTargetingCriteria {
  weakestChapter?: boolean;
  mostForgottenFormula?: boolean;
  recentMistakes?: boolean;
  upcomingExam?: boolean;
  revisionPending?: boolean;
  lowConfidence?: boolean;
}

export interface PracticeSetConfiguration {
  id?: string;
  title: string;
  mode: ExamMode;
  subject: 'All' | 'Physics' | 'Chemistry' | 'Mathematics';
  chapters: string[];
  questionCount: number; // 10, 20, 30, 50 or custom
  difficulty: QuestionDifficulty;
  questionTypes: QuestionType[];
  smartTargeting: SmartTargetingCriteria;
  estimatedMinutes: number;
}

export interface UserQuestionAnswer {
  questionId: string;
  studentAnswer: string | number | Record<string, string>;
  isCorrect: boolean;
  timeSpentSeconds: number;
  markedForReview?: boolean;
  isBookmarked?: boolean;
  difficultyWhenPresented: 'Easy' | 'Medium' | 'Hard';
  mistakeTypeFlagged?: 'Concept Error' | 'Formula Error' | 'Calculation Error' | 'Silly Mistake' | 'Misread Question';
}

export interface PracticeSessionResult {
  id: string;
  title: string;
  timestamp: string;
  totalQuestions: number;
  attemptedCount: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  accuracyPercentage: number;
  totalTimeSeconds: number;
  averageTimePerQuestionSeconds: number;
  speedRating: 'Fast' | 'Optimal' | 'Slow';
  confidenceRating: 'High' | 'Moderate' | 'Low';
  weakConceptsIdentified: string[];
  formulaMistakes: string[];
  carelessMistakes: string[];
  score: number;
  maxScore: number;
  earnedXP: number;
  mode: ExamMode;
  subject: string;
  adaptiveDifficultyTraversed: ('Easy' | 'Medium' | 'Hard')[];
  answers: UserQuestionAnswer[];
  recommendations: {
    revisionChapter?: string;
    formulaIds?: string[];
    ncertChapterId?: string;
    mistakesRecordedCount: number;
  };
}

export interface QuestionBookmarkItem {
  id: string;
  questionId: string;
  question: SmartQuestion;
  bookmarkedAt: string;
  status: 'starred' | 'difficult' | 'doubt' | 'retry_later';
  userNote?: string;
  resolved?: boolean;
}

export interface QuestionGeneratorStats {
  questionsAttempted: number;
  correct: number;
  wrong: number;
  skipped: number;
  averageAccuracy: number;
  averageTimeSeconds: number;
  bestSubject: string;
  weakestSubject: string;
  subjectBreakdown: Record<string, { attempted: number; correct: number; accuracy: number }>;
  modeAttemptCount: Record<string, number>;
  totalSetsCompleted: number;
  streakDays: number;
  lastActiveDate: string;
  todayPracticeScore: number;
}

export interface LeaderboardStudent {
  id: string;
  name: string;
  avatar: string;
  questionsSolved: number;
  accuracy: number;
  streak: number;
  rank: number;
  isCurrentUser?: boolean;
  privacyEnabled?: boolean;
}
