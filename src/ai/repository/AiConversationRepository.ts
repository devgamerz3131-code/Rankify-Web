/**
 * Local Repository for Rankify AI Module Conversations
 */

import { Conversation, Message, DetectedSubject, DetectedChapter } from '../model/chat-models';

const STORAGE_KEY = 'rankify_ai_module_conversations_v2';

const DEFAULT_CONVERSATION: Conversation = {
  id: 'conv_default',
  title: 'Explain Electrochemistry',
  date: new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }),
  subject: 'Chemistry',
  chapter: 'Electrochemistry',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  messages: [
    {
      id: 'msg_1_user',
      role: 'user',
      text: 'Explain Electrochemistry',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'msg_1_assistant',
      role: 'assistant',
      text: 'Generating the best AI prompt...',
      question: 'Explain Electrochemistry',
      promptResult: {
        subject: 'Chemistry',
        chapter: 'Electrochemistry',
        category: 'concept',
        rawPrompt: `You are an expert CBSE Class 12 Chemistry teacher.

Explain Electrochemistry.

Include:

NCERT explanation

Board pattern

Important formulas

Common mistakes

Memory tricks

Practice questions

Revision notes

Numericals

Simple language`,
      },
      timestamp: new Date().toISOString(),
      isGenerating: false,
    },
  ],
};

class AiConversationRepository {
  private static instance: AiConversationRepository;
  private conversations: Conversation[] = [];
  private listeners: Set<() => void> = new Set();

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): AiConversationRepository {
    if (!AiConversationRepository.instance) {
      AiConversationRepository.instance = new AiConversationRepository();
    }
    return AiConversationRepository.instance;
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
      console.error('Failed to save AI module conversations to localStorage:', err);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public getAllConversations(): Conversation[] {
    return [...this.conversations].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  public getConversationById(id: string): Conversation | null {
    return this.conversations.find((c) => c.id === id) || null;
  }

  public createConversation(
    initialQuestion: string,
    subject: DetectedSubject,
    chapter: DetectedChapter
  ): Conversation {
    const now = new Date();
    const newConv: Conversation = {
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

  public addMessage(conversationId: string, message: Message): Conversation | null {
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (!conv) return null;

    conv.messages.push(message);
    conv.updatedAt = new Date().toISOString();

    if (message.promptResult) {
      conv.subject = message.promptResult.subject;
      conv.chapter = message.promptResult.chapter;
    }

    this.saveToStorage();
    return conv;
  }

  public updateMessage(conversationId: string, messageId: string, updates: Partial<Message>) {
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

  public searchConversations(query: string): Conversation[] {
    const q = query.toLowerCase().trim();
    if (!q) return this.getAllConversations();

    return this.getAllConversations().filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.chapter.toLowerCase().includes(q) ||
        c.messages.some((m) => m.text.toLowerCase().includes(q))
    );
  }
}

export const aiConversationRepository = AiConversationRepository.getInstance();
