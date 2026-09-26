/**
 * Rankify AI Tutor Models (Phase 1 Local Storage)
 */

export type SubjectType = 'Physics' | 'Chemistry' | 'Mathematics';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  question?: string;
  generatedPrompt?: string;
  subject?: SubjectType;
  chapter?: string;
  timestamp: string;
  isGenerating?: boolean;
}

export interface ChatConversation {
  id: string;
  title: string;
  date: string;
  subject: SubjectType;
  chapter: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}
