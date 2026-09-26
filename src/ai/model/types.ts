export type MessageRole = 'user' | 'assistant' | 'system';

export type DetectedSubject = 'Physics' | 'Chemistry' | 'Mathematics' | 'General CBSE';

export type QuestionType =
  | 'Concept'
  | 'Numerical'
  | 'Derivation'
  | 'Formula'
  | 'PYQ'
  | 'MCQ'
  | 'Assertion Reason'
  | 'Competency Question'
  | 'Revision'
  | 'Notes';

export interface DetectedChapter {
  name: string;
  code?: string;
  subject: DetectedSubject;
  standardConfidence?: number;
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
  difficulty: string;
  promptLength: PromptLengthInfo;
  estimatedQuality: string;
  generatedPrompt: string;
  bulletPoints: string[];
  rawQuery: string;
  generatedAt: number;
  isFavorite?: boolean;
  lastUsedAt?: number;
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
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  lastUsedAt?: number;
  messages: Message[];
  detectedSubject?: DetectedSubject;
  detectedChapter?: DetectedChapter;
  pinned?: boolean;
  isFavorite?: boolean;
}

