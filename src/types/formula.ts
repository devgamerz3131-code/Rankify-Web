export type FormulaSubject = 'Physics' | 'Chemistry' | 'Mathematics';

export type FormulaType =
  | 'Fundamental Law'
  | 'Working Equation'
  | 'Special Case'
  | 'Derivation Result'
  | 'Empirical Relation';

export type FormulaMasteryLevel =
  | 'not_learned'
  | 'learning'
  | 'practiced'
  | 'strong'
  | 'mastered';

export type FormulaImportance = 'Critical Board' | 'High Weightage' | 'Medium' | 'Supplementary';

export type FormulaDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface FormulaVariable {
  symbol: string;
  name: string;
  meaning: string;
  siUnit: string;
  isConstant?: boolean;
  constantValue?: string;
}

export interface DerivationStep {
  stepNumber: number;
  title: string;
  latexExpression: string;
  conceptualReason: string;
  boardTip?: string;
}

export interface FormulaDerivation {
  title: string;
  assumptions: string[];
  steps: DerivationStep[];
  finalResult: string;
  boardMarks: number;
}

export interface FormulaMemoryBooster {
  mnemonic: string;
  shortcut: string;
  visualMemoryTrick: string;
  storyMethod: string;
  patternRecognition: string;
}

export interface FormulaQuestionItem {
  id: string;
  type: 'ncert' | 'pyq' | 'competency' | 'numerical';
  source: string; // e.g. "CBSE 2024 (3 Marks)"
  question: string;
  givenData: string;
  formulaToApply: string;
  solutionSummary: string;
  answerValue: string;
}

export interface FormulaPracticeExercise {
  id: string;
  type: 'numerical' | 'formula_selection' | 'error_finding';
  difficulty: FormulaDifficulty;
  question: string;
  options?: string[];
  correctOption?: string;
  correctAnswer: string;
  explanation: string;
  trapWarning: string;
}

export interface FormulaItem {
  id: string;
  name: string;
  subject: FormulaSubject;
  chapter: string;
  topic: string;
  formulaType: FormulaType;
  latex: string;
  textDisplay: string;
  dimensions?: string; // e.g. [M L^2 T^-3 A^-1]
  primaryUnit: string; // e.g. "Volts (V)", "Tesla (T)"
  variables: FormulaVariable[];
  conditions: string[];
  applications: string[];
  difficulty: FormulaDifficulty;
  importance: FormulaImportance;

  // AI Deep Dive
  simpleExplanation: string;
  detailedExplanation: string;
  realLifeExample: string;
  whenToUse: string[];
  whenNotToUse: string[];
  commonConfusion: string[];

  // Derivation
  derivation?: FormulaDerivation;

  // Memory & Questions
  memoryBooster: FormulaMemoryBooster;
  relatedQuestions: FormulaQuestionItem[];
  practiceExercises: FormulaPracticeExercise[];

  // Visual simulation toggle
  visualType?: 'drift_velocity' | 'nernst_cell' | 'matrix_inverse' | 'rc_circuit';
}

export interface UserFormulaTelemetry {
  formulaId: string;
  masteryLevel: FormulaMasteryLevel;
  confidenceScore: number; // 0 - 100
  timesPracticed: number;
  timesCorrect: number;
  timesIncorrect: number;
  lastRevisedTimestamp: number;
  nextRevisionDate: string; // YYYY-MM-DD
  isWeak: boolean;
  notes?: string;
  isBookmarked: boolean;
}

export interface FormulaIntelligenceStats {
  totalFormulas: number;
  masteredCount: number;
  strongCount: number;
  practicedCount: number;
  learningCount: number;
  notLearnedCount: number;
  weakCount: number;
  overallMasteryPercent: number;
  averageConfidence: number;
  dueForRevisionToday: number;
  mostForgottenFormulaName: string;
}

export interface FormulaIntelligenceState {
  telemetry: Record<string, UserFormulaTelemetry>;
  stats: FormulaIntelligenceStats;
  lastUpdatedTimestamp: number;
}
