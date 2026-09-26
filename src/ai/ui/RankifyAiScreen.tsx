import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  Plus,
  Trash2,
  Sparkles,
  ShieldCheck,
  Zap,
  Atom,
  Calculator,
  BookOpen,
} from 'lucide-react';
import { useRankifyAiViewModel } from './useRankifyAiViewModel';
import { ChatSidebar } from '../components/ChatSidebar';
import { ChatBubble } from '../components/ChatBubble';
import { ChatInput } from '../components/ChatInput';
import { EmptyState } from '../components/EmptyState';
import { SmartSuggestions } from '../components/SmartSuggestions';
import { PromptBoostersBar } from '../components/PromptBoostersBar';
import { FunFeaturesBar } from '../components/FunFeaturesBar';

export const RankifyAiScreen: React.FC = () => {
  const {
    currentConversation,
    messages,
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
  } = useRankifyAiViewModel();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat on new messages or loading
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleCopy = (text: string, messageId: string) => {
    copyPrompt(text, messageId);
  };

  const getSubjectIcon = (subj?: string) => {
    switch (subj) {
      case 'Physics':
        return <Zap className="w-4 h-4 text-blue-500" />;
      case 'Chemistry':
        return <Atom className="w-4 h-4 text-emerald-500" />;
      case 'Mathematics':
      case 'Maths':
        return <Calculator className="w-4 h-4 text-purple-500" />;
      default:
        return <BookOpen className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] w-full rounded-3xl overflow-hidden bg-card/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xl relative">
      {/* 1. Desktop Sidebar */}
      <div className="hidden md:block w-72 lg:w-80 shrink-0 h-full">
        <ChatSidebar
          conversations={filteredConversations}
          activeId={currentConversation?.id || null}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          onSelect={selectConversation}
          onNewChat={startNewConversation}
          onDelete={deleteConversation}
          onRename={renameConversation}
          onTogglePin={togglePin}
          onClearAll={clearAllConversations}
        />
      </div>

      {/* 2. Mobile Drawer Sidebar */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-card shadow-2xl md:hidden"
            >
              <ChatSidebar
                conversations={filteredConversations}
                activeId={currentConversation?.id || null}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                onSelect={selectConversation}
                onNewChat={startNewConversation}
                onDelete={deleteConversation}
                onRename={renameConversation}
                onTogglePin={togglePin}
                onClearAll={clearAllConversations}
                onCloseMobile={() => setIsMobileSidebarOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 3. Main Workspace / Thread */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-background/50">
        {/* Workspace Header (ChatGPT + Notion + Arc Browser minimal aesthetic) */}
        <div className="h-14 px-4 sm:px-6 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between shrink-0 bg-card/40 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden cursor-pointer"
              title="Open chats"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Conversation Title & Badge */}
            <div className="flex items-center gap-2 min-w-0">
              {currentConversation?.detectedSubject && (
                <div className="hidden sm:flex items-center justify-center">
                  {getSubjectIcon(currentConversation.detectedSubject)}
                </div>
              )}
              <h1 className="font-extrabold text-sm sm:text-base text-foreground truncate">
                {currentConversation?.title || 'Rankify AI Study Coach'}
              </h1>
              {currentConversation?.detectedChapter && (
                <span className="hidden lg:inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40 truncate max-w-[200px]">
                  {currentConversation.detectedChapter.name}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Fun Features Bar Strip (Challenge, Lucky Question, Motivation, Daily Tip) */}
            <div className="hidden lg:flex items-center">
              <FunFeaturesBar onAskPrompt={submitQuery} />
            </div>

            {/* Offline Safe Tag */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Coach Active</span>
            </div>

            {/* Header New Chat Button */}
            <button
              onClick={() => startNewConversation()}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="New Chat"
            >
              <Plus className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="hidden sm:inline">New Chat</span>
            </button>

            {/* Delete active conversation */}
            {currentConversation && (
              <button
                onClick={() => {
                  if (window.confirm('Delete this study chat?')) {
                    deleteConversation(currentConversation.id);
                  }
                }}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                title="Delete current conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Fun Features Strip */}
        <div className="lg:hidden px-4 pt-2">
          <FunFeaturesBar onAskPrompt={submitQuery} />
        </div>

        {/* Smart Suggestions Bar (Recommended Today banner & quick prompt suggestions) */}
        <SmartSuggestions
          currentChapter={currentConversation?.detectedChapter}
          currentSubject={currentConversation?.detectedSubject}
          onSelectPrompt={submitQuery}
        />

        {/* Chat Messages Feed / Empty State */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          {messages.length === 0 ? (
            <EmptyState onSelectSuggestion={submitQuery} />
          ) : (
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  message={msg}
                  isCopied={copiedMessageId === msg.id}
                  onCopy={handleCopy}
                  onRegenerate={
                    msg.role === 'assistant' ? regeneratePrompt : undefined
                  }
                  onOpenChatGPT={
                    msg.role === 'assistant'
                      ? (text, id) => handleOpenChatGPT(text, id)
                      : undefined
                  }
                  onOpenGemini={
                    msg.role === 'assistant'
                      ? (text, id) => handleOpenGemini(text, id)
                      : undefined
                  }
                  onShare={
                    msg.role === 'assistant'
                      ? (text, subj, chap) => handleShare(text, subj, chap)
                      : undefined
                  }
                  onToggleFavorite={
                    msg.role === 'assistant'
                      ? (id) => toggleFavorite(id)
                      : undefined
                  }
                  isRegenerating={isLoading}
                />
              ))}

              {/* Synthesizing loading skeleton bubble */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-slate-200/80 dark:border-white/10 max-w-sm text-xs text-muted-foreground"
                >
                  <Sparkles className="w-4 h-4 text-purple-600 animate-spin" />
                  <span>Synthesizing personalized CBSE Class 12 coach prompt...</span>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Prompt Boosters Bar, Quick Actions & Input Dock */}
        <div className="p-3 sm:p-4 bg-card/70 backdrop-blur-md border-t border-slate-200/80 dark:border-white/10 shrink-0 space-y-2">
          {/* Prompt Boosters Bar */}
          <PromptBoostersBar
            activeBooster={activeBooster}
            onToggleBooster={toggleBooster}
            isLoading={isLoading}
          />

          {/* Main Input Component (includes 11 Smart Quick Actions chips & Smart Prompt Options) */}
          <ChatInput
            onSend={submitQuery}
            isLoading={isLoading}
            activeChapterName={currentConversation?.detectedChapter?.name}
            promptOptions={promptOptions}
            onChangeOptions={updatePromptOptions}
          />
        </div>
      </div>
    </div>
  );
};
