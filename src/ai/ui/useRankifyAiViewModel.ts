import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Conversation,
  Message,
  PromptResult,
  PromptBooster,
  SmartPromptOptions,
} from '../model/types';
import { chatRepository } from '../repository/chat-repository';
import { generateStudyPrompt } from '../utils/prompt-engine';
import {
  openChatGPT,
  openGemini,
  sharePrompt,
  triggerHapticFeedback,
} from '../utils/external-ai';
import { getSavedStudentContext } from '../utils/student-context';
import { TimeFilterOption } from '../components/ChatSidebar';
import { useNavigation } from '@/contexts/NavigationContext';

export interface RankifyAiViewModelState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  currentConversationId: string | null;
  messages: Message[];
  generatedPrompt: PromptResult | null;
  isLoading: boolean;
  copiedMessageId: string | null;
  searchQuery: string;
  activeFilter: TimeFilterOption;
  activeBooster: PromptBooster | null;
  promptOptions: SmartPromptOptions;
  filteredConversations: Conversation[];
}

export interface RankifyAiViewModelActions {
  startNewConversation: (title?: string) => Conversation;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, newTitle: string) => void;
  togglePin: (id: string) => void;
  clearAllConversations: () => void;
  submitQuery: (query: string, boosterOverride?: PromptBooster) => Promise<void>;
  regeneratePrompt: (messageId: string) => Promise<void>;
  toggleBooster: (booster: PromptBooster) => void;
  updatePromptOptions: (opts: Partial<SmartPromptOptions>) => void;
  copyPrompt: (text: string, messageId?: string) => Promise<boolean>;
  toggleFavorite: (messageId?: string) => void;
  handleOpenChatGPT: (promptText: string, messageId?: string) => Promise<void>;
  handleOpenGemini: (promptText: string, messageId?: string) => Promise<void>;
  handleShare: (promptText: string, subject: string, chapter: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setActiveFilter: (filter: TimeFilterOption) => void;
}

export type RankifyAiViewModel = RankifyAiViewModelState & RankifyAiViewModelActions;

export function useRankifyAiViewModel(): RankifyAiViewModel {
  const { aiPrefill, setAiPrefill } = useNavigation();

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
  const [activeFilter, setActiveFilter] = useState<TimeFilterOption>('all');
  const [activeBooster, setActiveBooster] = useState<PromptBooster | null>(null);
  const [promptOptions, setPromptOptions] = useState<SmartPromptOptions>({
    level: 'Board Level',
    depth: 'Default',
    language: 'Auto',
  });

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

  // Filter conversations based on timeline / category / search query
  const filteredConversations = useMemo(() => {
    return chatRepository.getFilteredConversations(activeFilter, searchQuery);
  }, [conversations, activeFilter, searchQuery]);

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

  // Rename conversation
  const renameConversation = useCallback(
    (id: string, newTitle: string) => {
      chatRepository.renameConversation(id, newTitle);
      refreshConversations();
      toast.success('Chat renamed ✏️', { duration: 2000 });
    },
    [refreshConversations]
  );

  // Toggle pin conversation
  const togglePin = useCallback(
    (id: string) => {
      const isPinned = chatRepository.togglePin(id);
      refreshConversations();
      toast.success(isPinned ? 'Chat pinned to top 📌' : 'Chat unpinned', {
        duration: 2000,
      });
    },
    [refreshConversations]
  );

  // Clear all conversations
  const clearAllConversations = useCallback(() => {
    chatRepository.clearAll();
    setConversations([]);
    setCurrentConversationId(null);
    setGeneratedPrompt(null);
  }, []);

  // Update prompt options (Level, Depth, Language)
  const updatePromptOptions = useCallback((opts: Partial<SmartPromptOptions>) => {
    setPromptOptions((prev) => ({ ...prev, ...opts }));
  }, []);

  // Submit query: instantaneous synthesis, 0ms delay, no API calls, personalized
  const submitQuery = useCallback(
    async (query: string, boosterOverride?: PromptBooster) => {
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

      // 2. Synthesize personalized prompt instantly with student data, options & active booster
      const boosterToUse = boosterOverride || activeBooster || undefined;
      const promptRes = generateStudyPrompt(
        clean,
        boosterToUse,
        undefined,
        promptOptions
      );
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
        useCount: 1,
      };

      chatRepository.addMessage(targetConvId, assistantMessage);
      refreshConversations();

      // 4. Auto-copy prompt automatically with haptic feedback
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          triggerHapticFeedback();
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
    [currentConversationId, activeBooster, promptOptions, refreshConversations]
  );

  // Toggle booster: updates booster and immediately re-boosts current message if available
  const toggleBooster = useCallback(
    (booster: PromptBooster) => {
      const nextBooster = activeBooster === booster ? null : booster;
      setActiveBooster(nextBooster);

      if (nextBooster) {
        toast.success(`Boosted: ${nextBooster} 🚀`, { duration: 2000 });
      }

      // If there's an active assistant message, re-synthesize with this booster instantly
      if (currentConversation && currentConversation.messages.length > 0) {
        const lastAssistant = [...currentConversation.messages]
          .reverse()
          .find((m) => m.role === 'assistant');

        if (lastAssistant) {
          const rawQuery =
            lastAssistant.promptResult?.rawQuery || lastAssistant.content;
          const boostedPrompt = generateStudyPrompt(
            rawQuery,
            nextBooster || undefined,
            undefined,
            promptOptions
          );

          setGeneratedPrompt(boostedPrompt);
          lastAssistant.content = boostedPrompt.generatedPrompt;
          lastAssistant.promptResult = boostedPrompt;
          lastAssistant.timestamp = Date.now();

          chatRepository.saveConversation(currentConversation);
          refreshConversations();
        }
      }
    },
    [activeBooster, currentConversation, promptOptions, refreshConversations]
  );

  // Regenerate prompt for a specific message (instantaneous)
  const regeneratePrompt = useCallback(
    async (messageId: string) => {
      if (!currentConversation) return;
      const targetMsg = currentConversation.messages.find((m) => m.id === messageId);
      if (!targetMsg) return;

      setIsLoading(true);

      const rawQuery = targetMsg.promptResult?.rawQuery || targetMsg.content;
      const freshPrompt = generateStudyPrompt(
        rawQuery,
        activeBooster || undefined,
        undefined,
        promptOptions
      );
      setGeneratedPrompt(freshPrompt);

      targetMsg.content = freshPrompt.generatedPrompt;
      targetMsg.promptResult = freshPrompt;
      targetMsg.timestamp = Date.now();
      targetMsg.lastUsedAt = Date.now();
      targetMsg.useCount = (targetMsg.useCount || 0) + 1;

      chatRepository.saveConversation(currentConversation);
      refreshConversations();

      // Auto-copy newly regenerated prompt with haptic feedback
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          triggerHapticFeedback();
          await navigator.clipboard.writeText(freshPrompt.generatedPrompt);
          setCopiedMessageId(targetMsg.id);
          toast.success('Prompt copied', {
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
    [currentConversation, activeBooster, promptOptions, refreshConversations]
  );

  // Copy prompt to clipboard manually with haptics
  const copyPrompt = useCallback(async (text: string, messageId?: string): Promise<boolean> => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        triggerHapticFeedback();
        await navigator.clipboard.writeText(text);
        if (messageId) {
          setCopiedMessageId(messageId);
          if (currentConversationId) {
            chatRepository.updateLastUsed(currentConversationId, messageId);
          }
          setTimeout(() => setCopiedMessageId(null), 2500);
        }
        toast.success('Prompt copied', {
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

  // Home Screen / External Task Prefill integration:
  // If user presses Ask AI from Home, automatically fill without asking again!
  useEffect(() => {
    if (aiPrefill) {
      const { query, chapter, subject } = aiPrefill;
      const queryToSubmit =
        query ||
        `Explain ${chapter || 'Core Concepts'} step by step for CBSE Boards`;

      // Clear prefill so it doesn't trigger again on subsequent renders
      setAiPrefill(null);

      // Create new chat and submit immediately
      const newConv = chatRepository.createConversation(
        chapter ? `${chapter} • AI Study` : 'AI Study Session',
        subject as any
      );
      refreshConversations();
      setCurrentConversationId(newConv.id);

      // Submit immediately
      submitQuery(queryToSubmit);
    }
  }, [aiPrefill, setAiPrefill, submitQuery, refreshConversations]);

  // Initialize with a blank conversation if completely empty on first launch
  useEffect(() => {
    if (conversations.length === 0 && !currentConversationId && !aiPrefill) {
      const student = getSavedStudentContext();
      const initialChapter = student.todaysFocusChapter || 'Electrochemistry';
      const initial = chatRepository.createConversation(
        `Study Session • ${initialChapter}`,
        'Chemistry'
      );
      refreshConversations();
      setCurrentConversationId(initial.id);
    }
  }, [conversations.length, currentConversationId, aiPrefill, refreshConversations]);

  return {
    conversations,
    currentConversation,
    currentConversationId,
    messages,
    generatedPrompt,
    isLoading,
    copiedMessageId,
    searchQuery,
    activeFilter,
    activeBooster,
    promptOptions,
    filteredConversations,
    startNewConversation,
    selectConversation,
    deleteConversation,
    renameConversation,
    togglePin,
    clearAllConversations,
    submitQuery,
    regeneratePrompt,
    toggleBooster,
    updatePromptOptions,
    copyPrompt,
    toggleFavorite,
    handleOpenChatGPT,
    handleOpenGemini,
    handleShare,
    setSearchQuery,
    setActiveFilter,
  };
}
