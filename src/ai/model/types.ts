export type MessageRole = 'user' | 'assistant' | 'system';

export type DetectedSubject = 'Physics' | 'Chemistry' | 'Mathematics' | 'General CBSE';

export type QuestionType =
  | 'Concept'
  | 'Theory'
  | 'Numerical'
  | 'Derivation'
  | 'Formula'
  | 'NCERT Exercise'
  | 'Example'
  | 'PYQ'
  | 'Assertion Reason'
  | 'MCQ'
  | 'Case Study'
  | 'Competency Question'
  | 'Revision'
  | 'Short Notes'
  | 'Important Questions';

export type StudyIntent =
  | 'Quick Revision'
  | 'Detailed Study'
  | 'Exam Preparation'
  | 'Numerical Practice'
  | 'Formula Revision'
  | 'Board Questions'
  | 'Sample Paper Help';

export type PromptQualityScore = 'Excellent' | 'Very High' | 'High' | 'Good';

export type DifficultyLevel =
  | 'Easy'
  | 'Moderate'
  | 'Board Level'
  | 'Challenge (95%+)';

export interface DetectedChapter {
  name: string;
  code?: string;
  subject: DetectedSubject;
  standardConfidence?: number;
  isWeak?: boolean;
  needsFocus?: boolean;
  isCompleted?: boolean;
}

export type PromptBooster =
  | 'Easy Mode'
  | 'Board Mode'
  | 'Topper Mode'
  | 'Crash Course'
  | 'Revision Only'
  | 'NCERT Only'
  | 'PYQs Only'
  | 'Numericals Only'
  | 'Formula Only';

export interface StudentContextInfo {
  name: string;
  classNumber: number;
  board: string;
  stream: string;
  preferredLanguage: string;
  targetPercentage: number;
  overallProgress: number;
  weakSubjects: string[];
  strongSubjects: string[];
  needsFocusChapters: string[];
  todaysFocusChapter?: string;
  accuracy: number;
  chapterProgressPercentage?: number;
  chapterConfidence?: number;
  chapterWeakTopics?: string[];
  isNeedsFocus?: boolean;
  isCompleted?: boolean;
}

export type PromptCategory =
  | 'concept_explanation'
  | 'ncert_derivations'
  | 'formula_sheet'
  | 'pyq_drills'
  | 'numerical_problems'
  | 'revision_notes';

export type PromptAction =
  | 'copy'
  | 'regenerate'
  | 'delete'
  | 'export'
  | 'open_chatgpt'
  | 'open_gemini'
  | 'share'
  | 'favorite';

export interface PromptLengthInfo {
  chars: number;
  words: number;
}

export interface PromptResult {
  subject: DetectedSubject;
  chapter: DetectedChapter;
  questionType: QuestionType;
  intent: StudyIntent;
  difficulty: DifficultyLevel;
  boardPattern: string;
  qualityScore: PromptQualityScore;
  estimatedQuality: string;
  estimatedResponseLength: string;
  estimatedStudyTime: string;
  promptLength: PromptLengthInfo;
  activeBooster?: PromptBooster;
  studentContext?: StudentContextInfo;
  generatedPrompt: string;
  bulletPoints: string[];
  rawQuery: string;
  generatedAt: number;
  isFavorite?: boolean;
  lastUsedAt?: number;
  useCount?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  promptResult?: PromptResult;
  isFavorite?: boolean;
  lastUsedAt?: number;
  useCount?: number;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  lastUsedAt?: number;
  useCount?: number;
  messages: Message[];
  detectedSubject?: DetectedSubject;
  detectedChapter?: DetectedChapter;
  pinned?: boolean;
  isFavorite?: boolean;
}


