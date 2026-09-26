/**
 * Rankify AI ViewModel (0-API State Manager)
 */

import { useState, useEffect, useCallback } from 'react';
import { Conversation, Message, PromptResult } from '../model/chat-models';
import { aiConversationRepository } from '../repository/AiConversationRepository';
import {
  detectSubjectAndChapter,
  generateStructuredStudyPrompt,
} from '../utils/prompt-detector';
import toast from 'react-hot-toast';

export function useRankifyAiViewModel() {
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    aiConversationRepository.getAllConversations()
  );
  const [activeConversationId, setActiveConversationId] = useState<string>(
    () => aiConversationRepository.getAllConversations()[0]?.id || ''
  );
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Subscribe to repository changes
  useEffect(() => {
    return aiConversationRepository.subscribe(() => {
      setConversations(aiConversationRepository.getAllConversations());
    });
  }, []);

  const currentConversation =
    conversations.find((c) => c.id === activeConversationId) ||
    conversations[0] ||
    null;

  const messages = currentConversation?.messages || [];

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    setDrawerOpen(false);
  }, []);

  const handleNewChat = useCallback(() => {
    setActiveConversationId('');
    setDrawerOpen(false);
  }, []);

  const handleSendMessage = useCallback(
    (customQuery?: string) => {
      const textToSend = (customQuery || inputText).trim();
      if (!textToSend) return;

      const { subject, chapter } = detectSubjectAndChapter(textToSend);

      let targetConvId = activeConversationId;
      if (!targetConvId || !aiConversationRepository.getConversationById(targetConvId)) {
        const newConv = aiConversationRepository.createConversation(
          textToSend,
          subject,
          chapter
        );
        targetConvId = newConv.id;
        setActiveConversationId(newConv.id);
      }

      // User Message
      const userMessage: Message = {
        id: `msg_user_${Date.now()}`,
        role: 'user',
        text: textToSend,
        timestamp: new Date().toISOString(),
      };
      aiConversationRepository.addMessage(targetConvId, userMessage);

      // Assistant Message placeholder
      const assistantMsgId = `msg_ast_${Date.now()}`;
      const assistantMessage: Message = {
        id: assistantMsgId,
        role: 'assistant',
        text: 'Generating the best AI prompt...',
        question: textToSend,
        timestamp: new Date().toISOString(),
        isGenerating: true,
      };
      aiConversationRepository.addMessage(targetConvId, assistantMessage);

      setInputText('');

      // Generate prompt locally (0-API)
      setTimeout(() => {
        const promptResult = generateStructuredStudyPrompt(textToSend, subject, chapter);
        aiConversationRepository.updateMessage(targetConvId, assistantMsgId, {
          promptResult,
          isGenerating: false,
        });
      }, 500);
    },
    [inputText, activeConversationId]
  );

  const handleCopyPrompt = useCallback(async (msgId: string, promptText: string) => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopiedMap((prev) => ({ ...prev, [msgId]: true }));
      toast.success('Study prompt copied!');
      setTimeout(() => {
        setCopiedMap((prev) => ({ ...prev, [msgId]: false }));
      }, 2000);
    } catch {
      toast.error('Failed to copy');
    }
  }, []);

  const handleRegeneratePrompt = useCallback((msgId: string, questionText: string) => {
    const { subject, chapter } = detectSubjectAndChapter(questionText);
    const newPrompt = generateStructuredStudyPrompt(questionText, subject, chapter);

    if (currentConversation) {
      aiConversationRepository.updateMessage(currentConversation.id, msgId, {
        promptResult: newPrompt,
        isGenerating: false,
      });
      toast.success('Prompt regenerated!');
    }
  }, [currentConversation]);

  const handleDeleteConversation = useCallback((id: string) => {
    aiConversationRepository.deleteConversation(id);
    toast.success('Chat deleted');
  }, []);

  const handleRenameConversation = useCallback((id: string, newTitle: string) => {
    aiConversationRepository.renameConversation(id, newTitle);
    toast.success('Chat renamed');
  }, []);

  const filteredConversations = conversations.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.chapter.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    conversations: filteredConversations,
    currentConversation,
    messages,
    inputText,
    setInputText,
    searchQuery,
    setSearchQuery,
    drawerOpen,
    setDrawerOpen,
    copiedMap,
    handleSelectConversation,
    handleNewChat,
    handleSendMessage,
    handleCopyPrompt,
    handleRegeneratePrompt,
    handleDeleteConversation,
    handleRenameConversation,
  };
}
