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
  SlidersHorizontal,
  Bot,
  MessageSquare,
  Clock,
  Compass,
  ArrowRight,
  Bookmark,
  Library,
  GraduationCap,
  FileText,
  HelpCircle,
  RotateCcw,
  Target,
  Flame,
  Calendar,
} from 'lucide-react';
import { useRankifyAiViewModel } from './useRankifyAiViewModel';
import { ChatSidebar } from '../components/ChatSidebar';
import { ChatBubble } from '../components/ChatBubble';
import { ChatInput } from '../components/ChatInput';
import { EmptyState } from '../components/EmptyState';
import { AiToolsPanel } from '../components/AiToolsPanel';
import { CustomizePanelModal } from '../components/CustomizePanelModal';

export const RankifyAiScreen: React.FC = () => {
  const {
    conversations,
    currentConversation,
    messages,
    isLoading,
    copiedMessageId,
    searchQuery,
    activeFilter,
    activeBooster,
    activeMode,
    isToolsPanelOpen,
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
    setActiveMode,
    updatePromptOptions,
    copyPrompt,
    toggleFavorite,
    handleOpenChatGPT,
    handleOpenGemini,
    handleShare,
    setSearchQuery,
    setActiveFilter,
  } = useRankifyAiViewModel();

  // Navigation tab state inside AI screen: 'chat' | 'tools' | 'history'
  const [activeScreenTab, setActiveScreenTab] = useState<'chat' | 'tools' | 'history'>('chat');
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll helper: scroll to latest message
  const scrollToBottom = (delay = 0) => {
    if (delay > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, delay);
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  // Auto-scroll to bottom of chat on new messages or loading
  useEffect(() => {
    if (activeScreenTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, isLoading, activeScreenTab]);

  // Keyboard and Visual Viewport handling (iOS Safari & Android)
  useEffect(() => {
    const isMobileOrTablet = window.innerWidth < 1024;
    if (!isMobileOrTablet) return;

    const handleViewportUpdate = () => {
      if (window.visualViewport) {
        const height = window.visualViewport.height;
        document.documentElement.style.setProperty('--app-vh', `${height}px`);

        // Check if keyboard is likely open by comparing visualViewport to window.innerHeight
        const isKeyboardUp = window.innerHeight - height > 140;
        if (isKeyboardUp || isInputFocused) {
          document.documentElement.style.setProperty('--bottom-nav-display', 'none');
          document.documentElement.setAttribute('data-keyboard', 'open');
          scrollToBottom(150);
        } else {
          document.documentElement.style.setProperty('--bottom-nav-display', 'flex');
          document.documentElement.removeAttribute('data-keyboard');
        }
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportUpdate);
      window.visualViewport.addEventListener('scroll', handleViewportUpdate);
      handleViewportUpdate();
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportUpdate);
        window.visualViewport.removeEventListener('scroll', handleViewportUpdate);
      }
      document.documentElement.style.removeProperty('--app-vh');
      document.documentElement.style.removeProperty('--bottom-nav-display');
      document.documentElement.removeAttribute('data-keyboard');
    };
  }, [isInputFocused]);

  const handleInputFocus = () => {
    setIsInputFocused(true);
    document.documentElement.style.setProperty('--bottom-nav-display', 'none');
    document.documentElement.setAttribute('data-keyboard', 'open');
    scrollToBottom(200);
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);
    setTimeout(() => {
      if (window.visualViewport && window.innerHeight - window.visualViewport.height <= 140) {
        document.documentElement.style.setProperty('--bottom-nav-display', 'flex');
        document.documentElement.removeAttribute('data-keyboard');
      }
    }, 150);
  };

  const handleCopy = (text: string, messageId: string) => {
    copyPrompt(text, messageId);
  };

  const handleToolLaunch = (promptTemplate: string) => {
    submitQuery(promptTemplate);
    setActiveScreenTab('chat');
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
    <div
      ref={containerRef}
      style={{
        height: 'var(--app-vh, 100dvh)',
      }}
      className="flex flex-col lg:flex-row w-full lg:h-[calc(100vh-6rem)] rounded-none lg:rounded-3xl overflow-hidden bg-card border-0 lg:border border-border shadow-2xl relative [overscroll-behavior:none]"
    >
      {/* 1. DESKTOP ONLY: Persistent Left History Sidebar (Hidden below 1024px) */}
      <div className="hidden lg:block w-64 xl:w-72 shrink-0 h-full border-r border-border">
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

      {/* 2. MAIN CORE DOCK: Chat Workspace or Tools / History Screen Tabs */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-background/50 relative overflow-hidden">
        
        {/* Simplified Header: Fixed height, shrink-0 */}
        <div className="h-14 px-3 sm:px-5 border-b border-border flex items-center justify-between shrink-0 bg-card/90 backdrop-blur-md z-30">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8.5 h-8.5 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
              <Bot className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-black text-xs sm:text-sm text-foreground truncate">
                Rankify AI
              </h1>
              <p className="text-[10px] text-muted-foreground font-semibold truncate flex items-center gap-1">
                <span>Class 12</span>
                {currentConversation?.detectedSubject && (
                  <>
                    <span>•</span>
                    <span className="text-purple-600 dark:text-purple-400 font-bold">{currentConversation.detectedSubject}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Top Sync & Config Indicator (Simplified Sync Status) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Small Sync Status Tag */}
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span>☁️ Synced</span>
            </span>

            {/* Customize Sliders Icon */}
            <button
              onClick={() => setIsCustomizeOpen(true)}
              className="p-1.5 rounded-xl bg-muted/80 hover:bg-muted text-foreground hover:text-purple-600 border border-border transition cursor-pointer flex items-center gap-1"
              title="Tune Output Style"
            >
              <SlidersHorizontal className="w-4 h-4 text-purple-500" />
              <span className="text-[10px] font-bold hidden sm:inline">Settings</span>
            </button>

            {/* Header New Chat Button */}
            <button
              onClick={() => {
                startNewConversation();
                setActiveScreenTab('chat');
              }}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-xs"
              title="Start New Chat"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </div>

        {/* 3. AI NAVIGATION BAR (Primary inside AI Screen) */}
        <div className="px-4 py-2 border-b border-border bg-card/60 flex items-center gap-1.5 shrink-0">
          {(['chat', 'tools', 'history'] as const).map((tab) => {
            const isTabActive = activeScreenTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveScreenTab(tab)}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black capitalize transition duration-150 cursor-pointer text-center ${
                  isTabActive
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 bg-transparent'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* 4. ACTIVE TAB SCREENS */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          
          {/* TAB A: Chat Experience */}
          {activeScreenTab === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
              {/* Messages area: flex-1, min-h-0, overflow-y-auto, overscroll-contain. Minimum 120px height on tablet with split keyboard */}
              <div className="flex-1 min-h-[120px] overflow-y-auto px-3 sm:px-6 py-4 space-y-4 [overscroll-behavior:contain]">
                {messages.length === 0 ? (
                  <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col justify-center">
                    <EmptyState
                      onSelectSuggestion={handleToolLaunch}
                      onSelectChat={(id) => {
                        selectConversation(id);
                        setActiveScreenTab('chat');
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full max-w-2xl lg:max-w-4xl mx-auto space-y-4">
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
                        className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border max-w-sm text-xs text-muted-foreground shadow-sm"
                      >
                        <Sparkles className="w-4 h-4 text-purple-600 animate-spin shrink-0" />
                        <span>Rankify AI is synthesizing study response...</span>
                      </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Prompt Engine Dock at Bottom: shrink-0 flex child, never covered by bottom nav */}
              <div
                style={{
                  paddingBottom:
                    isInputFocused
                      ? 'max(0.75rem, env(safe-area-inset-bottom))'
                      : 'calc(var(--bottom-nav-height, 4rem) + max(0.5rem, env(safe-area-inset-bottom)))',
                }}
                className="shrink-0 p-2 sm:p-4 bg-card/95 backdrop-blur-md border-t border-border z-20 space-y-2 shadow-xl transition-all duration-200 lg:!pb-4"
              >
                <div className="max-w-2xl lg:max-w-4xl mx-auto w-full">
                  <ChatInput
                    onSend={submitQuery}
                    isLoading={isLoading}
                    activeChapterName={currentConversation?.detectedChapter?.name}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB B: Tools screen view */}
          {activeScreenTab === 'tools' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background/25">
              <div className="max-w-4xl mx-auto space-y-6">
                
                {/* Section Title */}
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    <span>AI Study Companion Utilities</span>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Launch high-yield interactive CBSE Class 12 prompts instantly
                  </p>
                </div>

                {/* AI Tools Cards Container */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Tutor */}
                  <button
                    type="button"
                    onClick={() => handleToolLaunch('Act as my CBSE Class 12 AI Tutor. Explain core concepts step by step with everyday analogies.')}
                    className="p-4 rounded-2xl border border-border bg-card hover:border-purple-500/40 text-left transition cursor-pointer flex gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0 border border-purple-500/20">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        AI Concept Tutor
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                        Fundamental explanations, derivations, and board tips
                      </p>
                    </div>
                  </button>

                  {/* Notes */}
                  <button
                    type="button"
                    onClick={() => handleToolLaunch('Generate comprehensive revision notes with formulas and main NCERT definitions.')}
                    className="p-4 rounded-2xl border border-border bg-card hover:border-purple-500/40 text-left transition cursor-pointer flex gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0 border border-blue-500/20">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        Notes Generator
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                        Crisp revision summaries & formula master sheets
                      </p>
                    </div>
                  </button>

                  {/* Planner */}
                  <button
                    type="button"
                    onClick={() => handleToolLaunch('Create a customized 7-day study planner sprint with milestones.')}
                    className="p-4 rounded-2xl border border-border bg-card hover:border-purple-500/40 text-left transition cursor-pointer flex gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/20">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        Revision Planner
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                        Time management plans and daily sprint routines
                      </p>
                    </div>
                  </button>

                  {/* Question Gen */}
                  <button
                    type="button"
                    onClick={() => handleToolLaunch('Predict top expected 2, 3, and 5-mark board exam questions.')}
                    className="p-4 rounded-2xl border border-border bg-card hover:border-purple-500/40 text-left transition cursor-pointer flex gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-500/20">
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        Question Generator
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                        Board expected questions with answer rubrics
                      </p>
                    </div>
                  </button>

                  {/* Formula Mode */}
                  <button
                    type="button"
                    onClick={() => handleToolLaunch('Provide complete formula sheet list with SI units.')}
                    className="p-4 rounded-2xl border border-border bg-card hover:border-purple-500/40 text-left transition cursor-pointer flex gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-500/20">
                      <Calculator className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        Formula Master
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                        Compilations of core mathematical derivations & variables
                      </p>
                    </div>
                  </button>

                  {/* NCERT Companion */}
                  <button
                    type="button"
                    onClick={() => handleToolLaunch('Provide summary and solutions for NCERT textbook problems.')}
                    className="p-4 rounded-2xl border border-border bg-card hover:border-purple-500/40 text-left transition cursor-pointer flex gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-300 flex items-center justify-center shrink-0 border border-teal-500/20">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        NCERT Companion
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                        Clear topic summaries and step-by-step explanations
                      </p>
                    </div>
                  </button>

                  {/* Mock Test */}
                  <button
                    type="button"
                    onClick={() => handleToolLaunch('Generate a mock test paper strictly on CBSE patterns.')}
                    className="p-4 rounded-2xl border border-border bg-card hover:border-purple-500/40 text-left transition cursor-pointer flex gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0 border border-rose-500/20">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        Mock Test Assistant
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                        Board-simulated question sets with time limits
                      </p>
                    </div>
                  </button>

                  {/* Weakness Analyzer */}
                  <button
                    type="button"
                    onClick={() => handleToolLaunch('List the top conceptual errors and common student mistakes for this chapter.')}
                    className="p-4 rounded-2xl border border-border bg-card hover:border-purple-500/40 text-left transition cursor-pointer flex gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-300 flex items-center justify-center shrink-0 border border-orange-500/20">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        Weakness Analyzer
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                        Analyze errors and fix gaps in key textbook topics
                      </p>
                    </div>
                  </button>
                </div>

                {/* Subject Fun Tools */}
                <div className="pt-4 border-t border-border">
                  <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">
                    Daily Smart Activities & Spark Options
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Lucky Question */}
                    <button
                      type="button"
                      onClick={() => handleToolLaunch('Give me a high-yield lucky board question to solve right now.')}
                      className="p-3.5 rounded-xl border border-border bg-card hover:border-purple-500/30 text-left transition cursor-pointer flex items-center gap-2.5 group"
                    >
                      <Zap className="w-4 h-4 text-purple-500" />
                      <span className="font-bold text-xs text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400">
                        Lucky Question
                      </span>
                    </button>

                    {/* Daily Challenge */}
                    <button
                      type="button"
                      onClick={() => handleToolLaunch('Give me a 15-minute intensive board exam prep challenge.')}
                      className="p-3.5 rounded-xl border border-border bg-card hover:border-purple-500/30 text-left transition cursor-pointer flex items-center gap-2.5 group"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span className="font-bold text-xs text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400">
                        Study Challenge
                      </span>
                    </button>

                    {/* Motivation */}
                    <button
                      type="button"
                      onClick={() => handleToolLaunch('Provide a brief positive motivation quote and study advice.')}
                      className="p-3.5 rounded-xl border border-border bg-card hover:border-purple-500/30 text-left transition cursor-pointer flex items-center gap-2.5 group"
                    >
                      <Bot className="w-4 h-4 text-emerald-500" />
                      <span className="font-bold text-xs text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400">
                        Daily Motivation
                      </span>
                    </button>

                    {/* Daily Tip */}
                    <button
                      type="button"
                      onClick={() => handleToolLaunch('Give me an essential tip to maximize board exam scores.')}
                      className="p-3.5 rounded-xl border border-border bg-card hover:border-purple-500/30 text-left transition cursor-pointer flex items-center gap-2.5 group"
                    >
                      <BookOpen className="w-4 h-4 text-blue-500" />
                      <span className="font-bold text-xs text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400">
                        Exam Score Tip
                      </span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB C: History List Screen */}
          {activeScreenTab === 'history' && (
            <div className="flex-1 flex flex-col min-h-0 relative bg-background/25">
              <ChatSidebar
                conversations={filteredConversations}
                activeId={currentConversation?.id || null}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                onSelect={(id) => {
                  selectConversation(id);
                  setActiveScreenTab('chat');
                }}
                onNewChat={() => {
                  startNewConversation();
                  setActiveScreenTab('chat');
                }}
                onDelete={deleteConversation}
                onRename={renameConversation}
                onTogglePin={togglePin}
                onClearAll={clearAllConversations}
              />
            </div>
          )}

        </div>
      </div>

      {/* 5. DESKTOP ONLY: Right Collapsible AI Tools Sidebar (Hidden below 1024px) */}
      <AnimatePresence>
        {isToolsPanelOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="hidden lg:block shrink-0 h-full border-l border-border overflow-hidden"
          >
            <div className="w-72 xl:w-80 h-full">
              <AiToolsPanel
                activeMode={activeMode}
                onSelectMode={setActiveMode}
                onSelectPrompt={handleToolLaunch}
                onSelectChat={(id) => {
                  selectConversation(id);
                  setActiveScreenTab('chat');
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. Settings Customize bottom-sheet modal */}
      <CustomizePanelModal
        isOpen={isCustomizeOpen}
        onClose={() => setIsCustomizeOpen(false)}
        promptOptions={promptOptions}
        onChangeOptions={updatePromptOptions}
        activeMode={activeMode}
        onSelectMode={setActiveMode}
        detectedSubject={currentConversation?.detectedSubject}
      />

    </div>
  );
};
