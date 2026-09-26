export type MessageRole = 'user' | 'assistant' | 'system';

export type DetectedSubject = 'Physics' | 'Chemistry' | 'Maths' | 'General CBSE';

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

export type PromptAction = 'copy' | 'regenerate' | 'delete' | 'export';

export interface PromptResult {
  subject: DetectedSubject;
  chapter: DetectedChapter;
  category: PromptCategory;
  generatedPrompt: string;
  bulletPoints: string[];
  rawQuery: string;
  generatedAt: number;
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  promptResult?: PromptResult;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  detectedSubject?: DetectedSubject;
  detectedChapter?: DetectedChapter;
  pinned?: boolean;
}
