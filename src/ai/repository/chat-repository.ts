import { Conversation, Message, DetectedSubject } from '../model/types';

const STORAGE_KEY = 'rankify_ai_conversations_v1';

export class ChatRepository {
  private static instance: ChatRepository;

  private constructor() {}

  public static getInstance(): ChatRepository {
    if (!ChatRepository.instance) {
      ChatRepository.instance = new ChatRepository();
    }
    return ChatRepository.instance;
  }

  /**
   * Retrieves all conversations from local storage, sorted by latest updated.
   */
  public getAllConversations(): Conversation[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.sort((a, b) => b.updatedAt - a.updatedAt);
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Gets single conversation by ID.
   */
  public getConversationById(id: string): Conversation | null {
    const all = this.getAllConversations();
    return all.find((c) => c.id === id) || null;
  }

  /**
   * Creates a new conversation and persists it.
   */
  public createConversation(title?: string, subject?: DetectedSubject): Conversation {
    const now = Date.now();
    const newConv: Conversation = {
      id: `conv_${now}_${Math.random().toString(36).substring(2, 7)}`,
      title: title || 'New Study Session',
      createdAt: now,
      updatedAt: now,
      messages: [],
      detectedSubject: subject,
    };

    const all = this.getAllConversations();
    all.unshift(newConv);
    this.saveAll(all);
    return newConv;
  }

  /**
   * Saves or updates a conversation.
   */
  public saveConversation(conversation: Conversation): void {
    const all = this.getAllConversations();
    const index = all.findIndex((c) => c.id === conversation.id);
    const updated = { ...conversation, updatedAt: Date.now() };

    if (index >= 0) {
      all[index] = updated;
    } else {
      all.unshift(updated);
    }

    this.saveAll(all);
  }

  /**
   * Adds a message to a conversation.
   */
  public addMessage(conversationId: string, message: Message): Conversation | null {
    const all = this.getAllConversations();
    const conv = all.find((c) => c.id === conversationId);
    if (!conv) return null;

    conv.messages.push(message);
    conv.updatedAt = Date.now();

    // Auto-update conversation title if it was default
    if (conv.messages.length === 2 && conv.title === 'New Study Session') {
      const firstUserMsg = conv.messages.find((m) => m.role === 'user');
      if (firstUserMsg) {
        conv.title = firstUserMsg.content.slice(0, 36) + (firstUserMsg.content.length > 36 ? '...' : '');
      }
    }

    if (message.promptResult) {
      conv.detectedSubject = message.promptResult.subject;
      conv.detectedChapter = message.promptResult.chapter;
    }

    this.saveAll(all);
    return conv;
  }

  /**
   * Deletes a conversation by ID.
   */
  public deleteConversation(id: string): void {
    const all = this.getAllConversations();
    const filtered = all.filter((c) => c.id !== id);
    this.saveAll(filtered);
  }

  /**
   * Deletes all conversations.
   */
  public clearAll(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // safe fallback
    }
  }

  /**
   * Search conversations by title or message content.
   */
  public searchConversations(query: string): Conversation[] {
    const all = this.getAllConversations();
    const clean = query.toLowerCase().trim();
    if (!clean) return all;

    return all.filter((conv) => {
      const inTitle = conv.title.toLowerCase().includes(clean);
      const inMessages = conv.messages.some((m) => m.content.toLowerCase().includes(clean));
      const inSubject = conv.detectedSubject?.toLowerCase().includes(clean);
      const inChapter = conv.detectedChapter?.name.toLowerCase().includes(clean);
      return inTitle || inMessages || inSubject || inChapter;
    });
  }

  private saveAll(conversations: Conversation[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch {
      // Storage unavailable or full
    }
  }
}

export const chatRepository = ChatRepository.getInstance();
