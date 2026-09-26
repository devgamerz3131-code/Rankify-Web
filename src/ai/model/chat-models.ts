/**
 * Rankify AI Data Models (Isolated Module)
 */

export type MessageRole = 'user' | 'assistant';

export type PromptCategory =
  | 'concept'
  | 'derivation'
  | 'numerical'
  | 'organic'
  | 'pyq'
  | 'revision';

export type DetectedSubject = 'Physics' | 'Chemistry' | 'Mathematics';

export type DetectedChapter = string;

export type PromptAction = 'copy' | 'regenerate' | 'continue';

export interface PromptResult {
  rawPrompt: string;
  subject: DetectedSubject;
  chapter: DetectedChapter;
  category: PromptCategory;
}

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: string;
  question?: string;
  promptResult?: PromptResult;
  isGenerating?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  date: string;
  subject: DetectedSubject;
  chapter: DetectedChapter;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}
