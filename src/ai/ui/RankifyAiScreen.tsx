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

export const RankifyAiScreen: React.FC = () => {
  const {
    currentConversation,
    messages,
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
    setSearchQuery,
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
          onSelect={selectConversation}
          onNewChat={startNewConversation}
          onDelete={deleteConversation}
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
                onSelect={selectConversation}
                onNewChat={startNewConversation}
                onDelete={deleteConversation}
                onClearAll={clearAllConversations}
                onCloseMobile={() => setIsMobileSidebarOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 3. Main Workspace / Thread */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-background/50">
        {/* Workspace Header */}
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
                {currentConversation?.title || 'Rankify AI Prompt Engine'}
              </h1>
              {currentConversation?.detectedChapter && (
                <span className="hidden lg:inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40 truncate max-w-[200px]">
                  {currentConversation.detectedChapter.name}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Offline Safe Tag */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Offline Architecture</span>
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

        {/* Chat Messages Feed / Empty State */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4">
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
                  onRegenerate={msg.role === 'assistant' ? regeneratePrompt : undefined}
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
                  <span>Synthesizing structured CBSE Class 12 prompt...</span>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar Dock */}
        <div className="p-3 sm:p-4 bg-card/60 backdrop-blur-md border-t border-slate-200/80 dark:border-white/10 shrink-0">
          <ChatInput onSend={submitQuery} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};
