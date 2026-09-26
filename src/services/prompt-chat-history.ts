/**
 * Prompt Chat History Service
 * Saves ONLY:
 * - Question
 * - Generated Prompt
 * - Date
 * - Subject
 * - Chapter
 * Do NOT save AI responses (100% Offline & Private).
 */

import { safeLocalStorage } from '@/utils/storage';
import { syncEngine } from '@/services/sync-engine';

export interface PromptChatItem {
  id: string;
  question: string;
  generatedPrompt: string;
  date: string;
  timestampISO: string;
  subject: 'Physics' | 'Chemistry' | 'Mathematics';
  chapter: string;
  isPinned?: boolean;
}

const STORAGE_KEY = 'rankify_prompt_chats_v1';

export const INITIAL_PROMPT_CHAT: PromptChatItem = {
  id: 'prompt_induction',
  question: 'Explain Current Electricity',
  subject: 'Physics',
  chapter: 'Current Electricity',
  date: new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }),
  timestampISO: new Date().toISOString(),
  isPinned: true,
  generatedPrompt: `You are an expert CBSE Class 12 Physics teacher and senior board evaluator.

Please explain Current Electricity in clear, simple language strictly aligned with the official CBSE Class 12 NCERT curriculum for Chapter: "Current Electricity".

The student asked:
"Explain Current Electricity"

Please provide a complete, high-scoring step-by-step masterclass covering:
1. 📌 Simple & Intuitive Explanation: Ohm's Law, drift velocity, Kirchhoff's rules, Wheatstone bridge.
2. 🔍 Detailed Step-by-Step Explanation: Microscopic view of current density J = n e v_d.
3. 📐 Important Formulas & SI Units: Resistance R = ρ L / A, EMF vs Cell Potential, Temperature coefficient α.
4. ✍️ Complete Derivation: Derive J = σ E and Wheatstone bridge balance condition P/Q = R/S.
5. 📖 NCERT Textbook Focus: Highlight solved NCERT examples on cell combination (series/parallel).
6. 💡 CBSE Board Exam Tips & Step-Marking Scheme: 0.5 mark steps for loop equations in Kirchhoff's laws.
7. ⚠️ Common Mistakes: Sign conventions in loop traversal, confusing internal resistance r with load R.
8. 🏆 PYQ Guidance: 3-mark derivation of drift velocity & 5-mark Kirchhoff numericals.
9. ❓ 1 Practice Question: Find current in 3-resistor circuit.
10. 📝 2-Minute Revision Summary: Formula recap sheet.

Explain step-by-step with zero skipped calculations!`,
};

class PromptChatHistoryService {
  private static instance: PromptChatHistoryService;
  private chats: PromptChatItem[] = [];
  private activeChatId: string = 'prompt_induction';
  private listeners: Set<(chats: PromptChatItem[]) => void> = new Set();

  private constructor() {
    this.chats = safeLocalStorage.getItem<PromptChatItem[]>(STORAGE_KEY, [
      INITIAL_PROMPT_CHAT,
    ]);
    if (!this.chats.length) {
      this.chats = [INITIAL_PROMPT_CHAT];
    }
    this.activeChatId = this.chats[0]?.id || 'prompt_induction';
  }

  public static getInstance(): PromptChatHistoryService {
    if (!PromptChatHistoryService.instance) {
      PromptChatHistoryService.instance = new PromptChatHistoryService();
    }
    return PromptChatHistoryService.instance;
  }

  public getChats(): PromptChatItem[] {
    return [...this.chats];
  }

  public getActiveChat(): PromptChatItem | null {
    const found = this.chats.find((c) => c.id === this.activeChatId);
    return found || this.chats[0] || null;
  }

  public setActiveChatId(id: string) {
    this.activeChatId = id;
    this.notify();
  }

  public addPromptChat(
    item: Omit<PromptChatItem, 'id' | 'date' | 'timestampISO'>,
    userId?: string
  ): PromptChatItem {
    const now = new Date();
    const newChat: PromptChatItem = {
      id: `chat_${Date.now()}`,
      question: item.question,
      generatedPrompt: item.generatedPrompt,
      subject: item.subject,
      chapter: item.chapter,
      date: now.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      timestampISO: now.toISOString(),
      isPinned: false,
    };

    this.chats.unshift(newChat);
    this.activeChatId = newChat.id;
    this.saveAndNotify();

    // Sync to Firestore if authenticated (Syncs ONLY question, prompt, subject, chapter, date)
    if (userId) {
      syncEngine.queueSync(
        userId,
        'users',
        `${userId}/prompt_history/${newChat.id}`,
        newChat as unknown as Record<string, unknown>
      );
    }

    return newChat;
  }

  public togglePin(id: string) {
    this.chats = this.chats.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c));
    this.saveAndNotify();
  }

  public deleteChat(id: string) {
    this.chats = this.chats.filter((c) => c.id !== id);
    if (!this.chats.length) {
      this.chats = [INITIAL_PROMPT_CHAT];
    }
    this.activeChatId = this.chats[0].id;
    this.saveAndNotify();
  }

  public clearAllHistory() {
    this.chats = [INITIAL_PROMPT_CHAT];
    this.activeChatId = 'prompt_induction';
    this.saveAndNotify();
  }

  public subscribe(listener: (chats: PromptChatItem[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private saveAndNotify() {
    safeLocalStorage.setItem(STORAGE_KEY, this.chats);
    this.notify();
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.chats));
  }
}

export const promptChatHistoryService = PromptChatHistoryService.getInstance();
