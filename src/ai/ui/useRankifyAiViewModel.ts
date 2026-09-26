import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Conversation, Message, PromptResult } from '../model/types';
import { chatRepository } from '../repository/chat-repository';
import { generateStudyPrompt } from '../utils/prompt-engine';
import { openChatGPT, openGemini, sharePrompt } from '../utils/external-ai';

export interface RankifyAiViewModelState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  currentConversationId: string | null;
  messages: Message[];
  generatedPrompt: PromptResult | null;
  isLoading: boolean;
  copiedMessageId: string | null;
  searchQuery: string;
  filteredConversations: Conversation[];
}

export interface RankifyAiViewModelActions {
  startNewConversation: (title?: string) => Conversation;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  clearAllConversations: () => void;
  submitQuery: (query: string) => Promise<void>;
  regeneratePrompt: (messageId: string) => Promise<void>;
  copyPrompt: (text: string, messageId?: string) => Promise<boolean>;
  toggleFavorite: (messageId?: string) => void;
  handleOpenChatGPT: (promptText: string, messageId?: string) => Promise<void>;
  handleOpenGemini: (promptText: string, messageId?: string) => Promise<void>;
  handleShare: (promptText: string, subject: string, chapter: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
}

export type RankifyAiViewModel = RankifyAiViewModelState & RankifyAiViewModelActions;

export function useRankifyAiViewModel(): RankifyAiViewModel {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    return chatRepository.getAllConversations();
  });

  const [currentConversationId, setCurrentConversationId] = useState<string | null>(() => {
    const list = chatRepository.getAllConversations();
    return list.length > 0 ? list[0].id : null;
  });

  const [generatedPrompt, setGeneratedPrompt] = useState<PromptResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Reload conversations from repository
  const refreshConversations = useCallback(() => {
    const all = chatRepository.getAllConversations();
    setConversations(all);
    return all;
  }, []);

  // Sync current conversation
  const currentConversation = useMemo(() => {
    if (!currentConversationId) return null;
    return conversations.find((c) => c.id === currentConversationId) || null;
  }, [conversations, currentConversationId]);

  const messages = useMemo(() => {
    return currentConversation?.messages || [];
  }, [currentConversation]);

  // Filter conversations based on search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase().trim();
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.detectedSubject?.toLowerCase().includes(q) ||
        c.detectedChapter?.name.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [conversations, searchQuery]);

  // Start new conversation
  const startNewConversation = useCallback((title?: string) => {
    const newConv = chatRepository.createConversation(title);
    refreshConversations();
    setCurrentConversationId(newConv.id);
    setGeneratedPrompt(null);
    return newConv;
  }, [refreshConversations]);

  // Select conversation
  const selectConversation = useCallback((id: string) => {
    setCurrentConversationId(id);
    const conv = chatRepository.getConversationById(id);
    if (conv && conv.messages.length > 0) {
      const lastAssistant = [...conv.messages].reverse().find((m) => m.role === 'assistant');
      setGeneratedPrompt(lastAssistant?.promptResult || null);
    } else {
      setGeneratedPrompt(null);
    }
  }, []);

  // Delete conversation
  const deleteConversation = useCallback(
    (id: string) => {
      chatRepository.deleteConversation(id);
      const remaining = refreshConversations();
      if (currentConversationId === id) {
        if (remaining.length > 0) {
          setCurrentConversationId(remaining[0].id);
        } else {
          setCurrentConversationId(null);
          setGeneratedPrompt(null);
        }
      }
    },
    [currentConversationId, refreshConversations]
  );

  // Clear all conversations
  const clearAllConversations = useCallback(() => {
    chatRepository.clearAll();
    setConversations([]);
    setCurrentConversationId(null);
    setGeneratedPrompt(null);
  }, []);

  // Submit query: strictly produces structured prompt via Prompt Engine, zero APIs, zero answering
  const submitQuery = useCallback(
    async (query: string) => {
      const clean = query.trim();
      if (!clean) return;

      setIsLoading(true);

      // Ensure active conversation exists or create one
      let targetConvId = currentConversationId;
      if (!targetConvId || !chatRepository.getConversationById(targetConvId)) {
        const created = chatRepository.createConversation(
          clean.length > 30 ? clean.substring(0, 30) + '...' : clean
        );
        targetConvId = created.id;
        setCurrentConversationId(created.id);
      }

      const now = Date.now();

      // 1. User Message (Question)
      const userMessage: Message = {
        id: `msg_user_${now}_${Math.random().toString(36).substring(2, 6)}`,
        conversationId: targetConvId,
        role: 'user',
        content: clean,
        timestamp: now,
      };

      chatRepository.addMessage(targetConvId, userMessage);
      refreshConversations();

      // 2. Synthesize structured prompt via pure local Prompt Engine (smooth 250ms feedback)
      await new Promise((resolve) => setTimeout(resolve, 250));

      const promptRes = generateStudyPrompt(clean);
      setGeneratedPrompt(promptRes);

      // 3. Assistant Prompt Message
      const assistantMessage: Message = {
        id: `msg_asst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        conversationId: targetConvId,
        role: 'assistant',
        content: promptRes.generatedPrompt,
        timestamp: Date.now(),
        promptResult: promptRes,
        isFavorite: false,
        lastUsedAt: Date.now(),
      };

      chatRepository.addMessage(targetConvId, assistantMessage);
      refreshConversations();

      // 4. Auto-copy prompt automatically as requested & display confirmation
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(promptRes.generatedPrompt);
          setCopiedMessageId(assistantMessage.id);
          toast.success('Prompt copied successfully', {
            icon: '📋',
            duration: 2500,
          });
          setTimeout(() => {
            setCopiedMessageId(null);
          }, 3000);
        }
      } catch {
        // Safe clipboard fallback
      }

      setIsLoading(false);
    },
    [currentConversationId, refreshConversations]
  );

  // Regenerate prompt for a specific message
  const regeneratePrompt = useCallback(
    async (messageId: string) => {
      if (!currentConversation) return;
      const targetMsg = currentConversation.messages.find((m) => m.id === messageId);
      if (!targetMsg) return;

      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 200));

      const rawQuery = targetMsg.promptResult?.rawQuery || targetMsg.content;
      const freshPrompt = generateStudyPrompt(rawQuery);
      setGeneratedPrompt(freshPrompt);

      targetMsg.content = freshPrompt.generatedPrompt;
      targetMsg.promptResult = freshPrompt;
      targetMsg.timestamp = Date.now();
      targetMsg.lastUsedAt = Date.now();

      chatRepository.saveConversation(currentConversation);
      refreshConversations();

      // Auto-copy newly regenerated prompt
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(freshPrompt.generatedPrompt);
          setCopiedMessageId(targetMsg.id);
          toast.success('Prompt copied successfully', {
            icon: '📋',
            duration: 2500,
          });
          setTimeout(() => setCopiedMessageId(null), 3000);
        }
      } catch {
        // Safe clipboard fallback
      }

      setIsLoading(false);
    },
    [currentConversation, refreshConversations]
  );

  // Copy prompt to clipboard manually
  const copyPrompt = useCallback(async (text: string, messageId?: string): Promise<boolean> => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        if (messageId) {
          setCopiedMessageId(messageId);
          if (currentConversationId) {
            chatRepository.updateLastUsed(currentConversationId, messageId);
          }
          setTimeout(() => setCopiedMessageId(null), 2500);
        }
        toast.success('Prompt copied successfully', {
          icon: '📋',
          duration: 2500,
        });
        return true;
      }
      return false;
    } catch {
      toast.error('Failed to copy to clipboard');
      return false;
    }
  }, [currentConversationId]);

  // Toggle favorite on prompt or conversation
  const toggleFavorite = useCallback(
    (messageId?: string) => {
      if (!currentConversationId) return;
      const newState = chatRepository.toggleFavorite(currentConversationId, messageId);
      refreshConversations();
      toast.success(newState ? 'Added to favorites ⭐' : 'Removed from favorites', {
        duration: 2000,
      });
    },
    [currentConversationId, refreshConversations]
  );

  // Open ChatGPT handler
  const handleOpenChatGPT = useCallback(
    async (promptText: string, messageId?: string) => {
      if (currentConversationId && messageId) {
        chatRepository.updateLastUsed(currentConversationId, messageId);
      }
      await openChatGPT(promptText);
    },
    [currentConversationId]
  );

  // Open Gemini handler
  const handleOpenGemini = useCallback(
    async (promptText: string, messageId?: string) => {
      if (currentConversationId && messageId) {
        chatRepository.updateLastUsed(currentConversationId, messageId);
      }
      await openGemini(promptText);
    },
    [currentConversationId]
  );

  // Share handler
  const handleShare = useCallback(
    async (promptText: string, subject: string, chapter: string) => {
      await sharePrompt(promptText, subject, chapter);
    },
    []
  );

  // Initialize with a blank conversation if completely empty on first launch
  useEffect(() => {
    if (conversations.length === 0 && !currentConversationId) {
      const initial = chatRepository.createConversation('Study Session 1', 'Chemistry');
      refreshConversations();
      setCurrentConversationId(initial.id);
    }
  }, [conversations.length, currentConversationId, refreshConversations]);

  return {
    conversations,
    currentConversation,
    currentConversationId,
    messages,
    generatedPrompt,
    isLoading,
    copiedMessageId,
    searchQuery,
    filteredConversations,
    startNewConversation,
    selectConversation,
    deleteConversation,
    clearAllConversations,
    submitQuery,
    regeneratePrompt,
    copyPrompt,
    toggleFavorite,
    handleOpenChatGPT,
    handleOpenGemini,
    handleShare,
    setSearchQuery,
  };
}

