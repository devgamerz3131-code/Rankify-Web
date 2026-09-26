import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Menu, Plus, Zap } from 'lucide-react';
import { useRankifyAiViewModel } from './RankifyAiViewModel';
import { ChatSidebar } from '../components/ChatSidebar';
import { PromptCard } from '../components/PromptCard';
import { ChatInputBar } from '../components/ChatInputBar';

const SUGGESTIONS = [
  { text: 'Explain Electrochemistry', subject: 'Chemistry', chapter: 'Electrochemistry' },
  { text: 'What is Current Electricity?', subject: 'Physics', chapter: 'Current Electricity' },
  { text: 'Derive Lens Maker Formula step-by-step', subject: 'Physics', chapter: 'Ray Optics and Optical Instruments' },
  { text: 'How to evaluate definite integral of sin^4 x', subject: 'Mathematics', chapter: 'Integrals' },
];

export const RankifyAiScreen: React.FC = () => {
  const {
    conversations,
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
  } = useRankifyAiViewModel();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, messages]);

  return (
    <div className="w-full h-[calc(100vh-130px)] min-h-[580px] rounded-3xl border border-slate-200/80 dark:border-white/10 bg-card overflow-hidden flex shadow-2xl relative select-none">
      {/* Desktop Left Drawer */}
      <div className="hidden md:block w-72 lg:w-80 h-full shrink-0">
        <ChatSidebar
          conversations={conversations}
          activeId={currentConversation?.id || ''}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          onRenameConversation={handleRenameConversation}
          onDeleteConversation={handleDeleteConversation}
        />
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 md:hidden flex"
          >
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-4/5 max-w-xs h-full bg-card shadow-2xl z-10"
            >
              <ChatSidebar
                conversations={conversations}
                activeId={currentConversation?.id || ''}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSelectConversation={handleSelectConversation}
                onNewChat={handleNewChat}
                onRenameConversation={handleRenameConversation}
                onDeleteConversation={handleDeleteConversation}
                onCloseMobile={() => setDrawerOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 h-full flex flex-col overflow-hidden bg-background">
        {/* Top Header */}
        <div className="p-3.5 sm:px-6 border-b border-slate-200/80 dark:border-white/10 bg-card/80 backdrop-blur-xl flex items-center justify-between gap-3 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground hover:text-foreground md:hidden cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-black text-xs sm:text-sm text-foreground">
                  Rankify AI
                </h2>
                <span className="text-[10px] text-muted-foreground">
                  Class 12 Study Prompt Crafter
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleNewChat}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Chat Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {!currentConversation || messages.length === 0 ? (
            /* Empty State */
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="max-w-xl mx-auto py-12 text-center space-y-6"
            >
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 mx-auto flex items-center justify-center text-white shadow-2xl shadow-purple-500/30">
                <Zap className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-foreground">Rankify AI</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Ask any CBSE Class 12 PCM question. Rankify formats the highest-yield study prompt for your learning session.
                </p>
              </div>

              {/* Suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
                {SUGGESTIONS.map((item, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSendMessage(item.text)}
                    className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-card hover:border-purple-500 hover:shadow-md transition-all text-left space-y-1 cursor-pointer group"
                  >
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 block">
                      {item.subject} • {item.chapter}
                    </span>
                    <p className="text-xs font-medium text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400">
                      "{item.text}"
                    </p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            /* Message List */
            <div className="max-w-3xl mx-auto space-y-6">
              <AnimatePresence initial={false}>
                {messages.map((msg) => {
                  if (msg.role === 'user') {
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.25 }}
                        className="flex gap-3 justify-end"
                      >
                        <div className="p-4 rounded-3xl rounded-tr-sm bg-purple-600 text-white max-w-[85%] shadow-xs">
                          <p className="text-xs sm:text-sm font-medium">{msg.text}</p>
                        </div>
                        <div className="w-8 h-8 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-black text-xs flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800/40">
                          U
                        </div>
                      </motion.div>
                    );
                  }

                  // Assistant Prompt Card
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="flex gap-3 justify-start"
                    >
                      <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                        <Sparkles className="w-4 h-4" />
                      </div>

                      <div className="p-5 rounded-3xl rounded-tl-sm bg-card border border-purple-500/30 text-foreground max-w-[92%] sm:max-w-[88%] shadow-xl">
                        <PromptCard
                          message={msg}
                          isCopied={Boolean(copiedMap[msg.id])}
                          onCopy={handleCopyPrompt}
                          onRegenerate={handleRegeneratePrompt}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Fixed Input Bar */}
        <ChatInputBar
          input={inputText}
          onChangeInput={setInputText}
          onSend={() => handleSendMessage()}
        />
      </div>
    </div>
  );
};
