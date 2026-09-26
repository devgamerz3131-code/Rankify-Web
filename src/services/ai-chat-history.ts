/**
 * Rankify AI Chat History & Local Storage Service
 * Handles persistence, search, pinning, message editing, and Firestore backup.
 */

import { safeLocalStorage } from '@/utils/storage';
import { syncEngine } from '@/services/sync-engine';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  subject?: 'Physics' | 'Chemistry' | 'Mathematics';
  chapter?: string;
  mode?: string;
  isFallback?: boolean;
  image?: {
    url?: string;
    name?: string;
    mimeType?: string;
  };
}

export interface ConversationSession {
  id: string;
  title: string;
  subject: 'Physics' | 'Chemistry' | 'Mathematics';
  chapter: string;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  messages: ChatMessage[];
  tags: string[];
}

const STORAGE_KEY = 'rankify_ai_conversations_v2';

export const INITIAL_WELCOME_CONVERSATION: ConversationSession = {
  id: 'conv_welcome',
  title: 'CBSE Class 12 PCM Induction',
  subject: 'Physics',
  chapter: 'Electric Charges and Fields',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isPinned: true,
  tags: ['Welcome', 'CBSE Class 12'],
  messages: [
    {
      id: 'msg_welcome',
      sender: 'ai',
      text: `### 🎓 Welcome to Rankify AI Tutor — CBSE Class 12 PCM Edition

I am your dedicated academic mentor calibrated strictly to the official **CBSE Class 12 Science curriculum** (Physics 042, Chemistry 043, and Mathematics 041).

---

#### 🌟 How I Assist Your 95%+ Target:
1. **Automatic Subject & Chapter Detection:** Type or paste any doubt — I will immediately recognize the exact chapter across all 37 official PCM units.
2. **Step-by-Step Derivations & Calculations:** I never skip steps in numericals or proofs. Every algebraic transformation and SI unit is explicitly written out.
3. **Organic Reaction Mechanisms:** Complete reaction flows, reagents, Markovnikov/anti-Markovnikov rules, and stereochemical inversions.
4. **Multimodal Uploads:** Attach question papers, camera photos of tricky diagrams, or handwritten notes.
5. **NCERT & PYQ Alignment:** Every answer highlights marking scheme distribution and high-frequency exam traps.

*Ask a doubt below or tap any suggestion to begin!*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      subject: 'Physics',
      chapter: 'Electric Charges and Fields',
      mode: 'ask-doubt',
    },
  ],
};

class AIChatHistoryService {
  private static instance: AIChatHistoryService;
  private conversations: ConversationSession[] = [];
  private activeConversationId: string = 'conv_welcome';
  private listeners: Set<(conversations: ConversationSession[]) => void> = new Set();

  private constructor() {
    this.conversations = safeLocalStorage.getItem<ConversationSession[]>(
      STORAGE_KEY,
      [INITIAL_WELCOME_CONVERSATION]
    );
    if (!this.conversations.length) {
      this.conversations = [INITIAL_WELCOME_CONVERSATION];
    }
    this.activeConversationId = this.conversations[0]?.id || 'conv_welcome';
  }

  public static getInstance(): AIChatHistoryService {
    if (!AIChatHistoryService.instance) {
      AIChatHistoryService.instance = new AIChatHistoryService();
    }
    return AIChatHistoryService.instance;
  }

  public getConversations(): ConversationSession[] {
    return [...this.conversations];
  }

  public getActiveConversation(): ConversationSession {
    const found = this.conversations.find((c) => c.id === this.activeConversationId);
    return found || this.conversations[0] || INITIAL_WELCOME_CONVERSATION;
  }

  public setActiveConversationId(id: string) {
    this.activeConversationId = id;
    this.notify();
  }

  public createNewConversation(
    subject: 'Physics' | 'Chemistry' | 'Mathematics' = 'Physics',
    chapter: string = 'Electric Charges and Fields'
  ): ConversationSession {
    const newConv: ConversationSession = {
      id: `conv_${Date.now()}`,
      title: `New ${subject} Chat`,
      subject,
      chapter,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPinned: false,
      messages: [],
      tags: [subject, chapter],
    };

    this.conversations.unshift(newConv);
    this.activeConversationId = newConv.id;
    this.saveAndNotify();
    return newConv;
  }

  public addMessage(convId: string, message: ChatMessage, userId?: string) {
    this.conversations = this.conversations.map((conv) => {
      if (conv.id !== convId) return conv;

      const updatedMessages = [...conv.messages, message];

      // Auto-update conversation title from first user query if still generic
      let title = conv.title;
      if (
        message.sender === 'user' &&
        (title.startsWith('New ') || title === 'CBSE Class 12 PCM Induction')
      ) {
        title = message.text.slice(0, 38).trim() + (message.text.length > 38 ? '...' : '');
      }

      const updated: ConversationSession = {
        ...conv,
        title,
        subject: message.subject || conv.subject,
        chapter: message.chapter || conv.chapter,
        updatedAt: new Date().toISOString(),
        messages: updatedMessages,
      };

      // Sync to cloud if user is signed in
      if (userId) {
        syncEngine.queueSync(
          userId,
          'users',
          `${userId}/ai_conversations/${conv.id}`,
          updated as unknown as Record<string, unknown>
        );
      }

      return updated;
    });

    this.saveAndNotify();
  }

  public updateLastAIMessage(convId: string, text: string) {
    this.conversations = this.conversations.map((conv) => {
      if (conv.id !== convId) return conv;
      const msgs = [...conv.messages];
      if (msgs.length > 0 && msgs[msgs.length - 1].sender === 'ai') {
        msgs[msgs.length - 1] = {
          ...msgs[msgs.length - 1],
          text,
        };
      }
      return {
        ...conv,
        updatedAt: new Date().toISOString(),
        messages: msgs,
      };
    });
    this.saveAndNotify();
  }

  public togglePin(convId: string) {
    this.conversations = this.conversations.map((c) =>
      c.id === convId ? { ...c, isPinned: !c.isPinned } : c
    );
    this.saveAndNotify();
  }

  public deleteConversation(convId: string) {
    this.conversations = this.conversations.filter((c) => c.id !== convId);
    if (!this.conversations.length) {
      this.conversations = [INITIAL_WELCOME_CONVERSATION];
    }
    this.activeConversationId = this.conversations[0].id;
    this.saveAndNotify();
  }

  public deleteMessage(convId: string, messageId: string) {
    this.conversations = this.conversations.map((conv) => {
      if (conv.id !== convId) return conv;
      return {
        ...conv,
        messages: conv.messages.filter((m) => m.id !== messageId),
      };
    });
    this.saveAndNotify();
  }

  public clearCurrentMessages(convId: string) {
    this.conversations = this.conversations.map((conv) => {
      if (conv.id !== convId) return conv;
      return {
        ...conv,
        messages: [],
      };
    });
    this.saveAndNotify();
  }

  public clearAllHistory() {
    this.conversations = [INITIAL_WELCOME_CONVERSATION];
    this.activeConversationId = 'conv_welcome';
    this.saveAndNotify();
  }

  public subscribe(listener: (conversations: ConversationSession[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private saveAndNotify() {
    safeLocalStorage.setItem(STORAGE_KEY, this.conversations);
    this.notify();
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.conversations));
  }
}

export const aiChatHistoryService = AIChatHistoryService.getInstance();
