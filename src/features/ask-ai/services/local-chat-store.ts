/**
 * Local Storage Store for Rankify AI Tutor Conversations (Phase 1)
 */

import { ChatConversation, ChatMessage, SubjectType } from '../models/ai-tutor';

const STORAGE_KEY = 'rankify_ai_tutor_conversations_v1';

const DEFAULT_CONVERSATION: ChatConversation = {
  id: 'conv_default',
  title: 'Current Electricity Basics',
  date: new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }),
  subject: 'Physics',
  chapter: 'Current Electricity',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  messages: [
    {
      id: 'msg_1_user',
      role: 'user',
      text: 'What is Current Electricity?',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'msg_1_assistant',
      role: 'assistant',
      text: 'Generating the best AI prompt...',
      question: 'What is Current Electricity?',
      subject: 'Physics',
      chapter: 'Current Electricity',
      generatedPrompt: `You are an expert CBSE Class 12 Physics teacher.

Explain Current Electricity.

Include:
• NCERT explanation
• Important formulas
• Board tips
• Numericals
• Memory tricks
• PYQs
• Common mistakes
• Practice question

Step-by-step explanation.`,
      timestamp: new Date().toISOString(),
      isGenerating: false,
    },
  ],
};

class LocalChatStore {
  private static instance: LocalChatStore;
  private conversations: ChatConversation[] = [];
  private listeners: Set<() => void> = new Set();

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): LocalChatStore {
    if (!LocalChatStore.instance) {
      LocalChatStore.instance = new LocalChatStore();
    }
    return LocalChatStore.instance;
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.conversations = JSON.parse(raw);
      } else {
        this.conversations = [DEFAULT_CONVERSATION];
        this.saveToStorage();
      }
    } catch {
      this.conversations = [DEFAULT_CONVERSATION];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.conversations));
      this.notify();
    } catch (err) {
      console.error('Failed to save conversations to localStorage:', err);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public getConversations(): ChatConversation[] {
    return [...this.conversations].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  public getConversationById(id: string): ChatConversation | null {
    return this.conversations.find((c) => c.id === id) || null;
  }

  public createConversation(
    initialQuestion: string,
    subject: SubjectType,
    chapter: string
  ): ChatConversation {
    const now = new Date();
    const newConv: ChatConversation = {
      id: `conv_${Date.now()}`,
      title: initialQuestion.length > 30 ? `${initialQuestion.substring(0, 30)}...` : initialQuestion,
      date: now.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      subject,
      chapter,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      messages: [],
    };

    this.conversations.unshift(newConv);
    this.saveToStorage();
    return newConv;
  }

  public addMessageToConversation(
    conversationId: string,
    message: ChatMessage
  ): ChatConversation | null {
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (!conv) return null;

    conv.messages.push(message);
    conv.updatedAt = new Date().toISOString();

    if (message.subject) conv.subject = message.subject;
    if (message.chapter) conv.chapter = message.chapter;

    this.saveToStorage();
    return conv;
  }

  public updateMessageInConversation(
    conversationId: string,
    messageId: string,
    updates: Partial<ChatMessage>
  ) {
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (!conv) return;

    const msg = conv.messages.find((m) => m.id === messageId);
    if (msg) {
      Object.assign(msg, updates);
      conv.updatedAt = new Date().toISOString();
      this.saveToStorage();
    }
  }

  public renameConversation(id: string, newTitle: string) {
    const conv = this.conversations.find((c) => c.id === id);
    if (conv) {
      conv.title = newTitle.trim() || conv.title;
      conv.updatedAt = new Date().toISOString();
      this.saveToStorage();
    }
  }

  public deleteConversation(id: string) {
    this.conversations = this.conversations.filter((c) => c.id !== id);
    if (this.conversations.length === 0) {
      this.conversations = [DEFAULT_CONVERSATION];
    }
    this.saveToStorage();
  }

  public searchConversations(query: string): ChatConversation[] {
    const q = query.toLowerCase().trim();
    if (!q) return this.getConversations();

    return this.getConversations().filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.chapter.toLowerCase().includes(q) ||
        c.messages.some((m) => m.text.toLowerCase().includes(q))
    );
  }
}

export const localChatStore = LocalChatStore.getInstance();
