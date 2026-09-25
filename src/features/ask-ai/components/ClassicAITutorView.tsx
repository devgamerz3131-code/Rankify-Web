import React, { useState, useEffect, useRef } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAIMemory, RecentDoubtItem } from '@/contexts/AIMemoryContext';
import { OFFICIAL_CBSE_12_PCM_TEMPLATE } from '@/services/syllabus-templates';
import {
  askAITutor,
  detectSubjectAndChapter,
  AskAIRequest,
  AskAIResponse,
} from '@/services/ai-tutor-service';
import { MarkdownMathRenderer } from './MarkdownMathRenderer';
import { StudyRecommendationsWidget } from './StudyRecommendationsWidget';
import {
  Sparkles,
  Send,
  Bot,
  User,
  BookOpen,
  RefreshCw,
  Clock,
  History,
  Trash2,
  Bookmark,
  ChevronDown,
  Calculator,
  Flame,
  CheckCircle2,
  FileQuestion,
  HelpCircle,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';

export type TutorMode =
  | 'ask-doubt'
  | 'explain-concept'
  | 'formula-explanation'
  | 'numerical-help'
  | 'ncert-explanation'
  | 'pyq-discussion'
  | 'short-notes'
  | 'revision-mode'
  | 'practice-questions';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  subject?: string;
  chapter?: string;
  mode?: string;
  isFallback?: boolean;
}

const TUTOR_MODES: Array<{ id: TutorMode; label: string; icon: string }> = [
  { id: 'ask-doubt', label: 'Ask Doubt', icon: '❓' },
  { id: 'explain-concept', label: 'Explain Concept', icon: '💡' },
  { id: 'formula-explanation', label: 'Formula Help', icon: '📐' },
  { id: 'numerical-help', label: 'Numerical Help', icon: '🔢' },
  { id: 'ncert-explanation', label: 'NCERT Focus', icon: '📖' },
  { id: 'pyq-discussion', label: 'PYQ Discussion', icon: '🏆' },
  { id: 'short-notes', label: 'Short Notes', icon: '📝' },
  { id: 'revision-mode', label: 'Revision Mode', icon: '🔄' },
  { id: 'practice-questions', label: 'Practice Questions', icon: '🎯' },
];

export const ClassicAITutorView: React.FC = () => {
  const { studentDetails } = useOnboarding();
  const {
    currentSubject,
    currentChapter,
    setCurrentSubject,
    setCurrentChapter,
    recentDoubts,
    recentFormulas,
    recentWeakTopics,
    addRecentDoubt,
    addRecentFormula,
    addWeakTopic,
    clearSessionMemory,
    activeDoubtToContinue,
    setActiveDoubtToContinue,
  } = useAIMemory();

  const [selectedMode, setSelectedMode] = useState<TutorMode>('ask-doubt');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize messages
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome_cbse_12',
      sender: 'ai',
      text: `### 🎓 Welcome to Rankify AI Academic Mentor!
**Exclusively calibrated for CBSE Class 12 Science (PCM).**

I am ready to help you master **Physics (042)**, **Chemistry (043)**, and **Mathematics (041)**.

#### How I assist your board prep:
- **Instant Doubt Resolution:** Complete concept clarity with NCERT definitions.
- **Step-by-Step Derivations & Numericals:** Clear substitution with SI units.
- **CBSE Marking Scheme Insights:** How to score full marks in 3-mark & 5-mark answers.
- **High-Yield PYQ Analysis:** Past 10 years question patterns.

Select your mode above or ask any question below!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      subject: currentSubject,
      chapter: currentChapter,
    },
  ]);

  // Handle Continuing Previous Discussion from AI Memory
  useEffect(() => {
    if (activeDoubtToContinue) {
      setCurrentSubject(activeDoubtToContinue.subject);
      setCurrentChapter(activeDoubtToContinue.chapter);
      setSelectedMode((activeDoubtToContinue.mode as TutorMode) || 'ask-doubt');
      setInput(`Continuing our previous discussion on "${activeDoubtToContinue.question}": `);
      setActiveDoubtToContinue(null);
      toast.success(`Resumed discussion on ${activeDoubtToContinue.chapter}`);
    }
  }, [activeDoubtToContinue, setCurrentSubject, setCurrentChapter, setActiveDoubtToContinue]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Chapters list for active subject
  const currentSubjectTemplate = OFFICIAL_CBSE_12_PCM_TEMPLATE.subjects.find(
    (s) => s.subjectName.toLowerCase() === currentSubject.toLowerCase()
  );
  const chapterOptions = currentSubjectTemplate ? currentSubjectTemplate.chapters : [];

  // Quick preset chips tailored to subject
  const getQuickChips = () => {
    if (currentSubject === 'Physics') {
      return [
        'Lens Maker’s Formula derivation',
        'Gauss Law continuous charge calculation',
        'LCR Series Circuit resonance numerical',
        'p-n junction rectifier working & waveform',
        'Kirchhoff’s Laws circuit with 2 loops',
      ];
    }
    if (currentSubject === 'Chemistry') {
      return [
        'Nernst Equation cell EMF calculation',
        'SN1 vs SN2 mechanism comparison with inversion',
        'Arrhenius Equation activation energy numerical',
        'Aldol Condensation reaction mechanism',
        'Kohlrausch’s Law application for weak electrolytes',
      ];
    }
    return [
      'Integration by Partial Fractions step-by-step',
      'Shortest distance between two skew lines in 3D',
      'Bayes’ Theorem medical test numerical',
      'Find maxima & minima of a cubic function',
      'Inverse of a 3x3 matrix using adjoint method',
    ];
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Response copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (customPrompt?: string) => {
    const questionText = (customPrompt || input).trim();
    if (!questionText || isTyping) return;

    // Intelligent subject and chapter detection
    const { detectedSubject, detectedChapter } = detectSubjectAndChapter(questionText);
    const effectiveSubject = detectedSubject || currentSubject;
    const effectiveChapter = detectedChapter || currentChapter;

    if (detectedSubject && detectedSubject !== currentSubject) {
      setCurrentSubject(detectedSubject);
    }
    if (detectedChapter && detectedChapter !== currentChapter) {
      setCurrentChapter(detectedChapter);
    }

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: questionText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      subject: effectiveSubject,
      chapter: effectiveChapter,
      mode: selectedMode,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response: AskAIResponse = await askAITutor({
        question: questionText,
        subject: effectiveSubject,
        chapter: effectiveChapter,
        mode: selectedMode,
        history: messages.slice(-4).map((m) => ({ sender: m.sender, text: m.text })),
        memoryContext: {
          currentSubject: effectiveSubject,
          currentChapter: effectiveChapter,
          recentDoubts: recentDoubts.map((d) => d.question),
          recentWeakTopics,
        },
      });

      const aiMessage: Message = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        subject: effectiveSubject,
        chapter: effectiveChapter,
        mode: selectedMode,
        isFallback: response.fallback,
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Update AI Session Memory
      addRecentDoubt({
        question: questionText,
        replySnippet: response.reply.slice(0, 120) + '...',
        subject: effectiveSubject,
        chapter: effectiveChapter,
        mode: selectedMode,
      });

      // Extract formulas if found
      const formulaMatch = response.reply.match(/-\s*\*\*([^*]+)\*\*:\s*(\$[^$]+\$)/);
      if (formulaMatch) {
        addRecentFormula({
          title: formulaMatch[1],
          formula: formulaMatch[2],
          subject: effectiveSubject,
          chapter: effectiveChapter,
        });
      }

      // Check if student indicated uncertainty / weakness
      if (
        questionText.toLowerCase().includes('confus') ||
        questionText.toLowerCase().includes('weak') ||
        questionText.toLowerCase().includes('hard')
      ) {
        addWeakTopic(`${effectiveChapter}: ${questionText.slice(0, 40)}`);
      }
    } catch (err: any) {
      toast.error('AI is temporarily busy. Fallback notes applied.');
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_err_${Date.now()}`,
          sender: 'ai',
          text: `### ⚠️ Notice: Network Issue
Rankify AI is temporarily experiencing high demand. Please try asking again in a moment, or review the formula sheets in Revision Mode.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          subject: effectiveSubject,
          chapter: effectiveChapter,
          isFallback: true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controller Bar */}
      <div className="bg-card/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-4 shadow-sm space-y-3.5">
        {/* Row 1: Subject Pills & Chapter Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Subject Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-white/5">
            {(['Physics', 'Chemistry', 'Mathematics'] as const).map((sub) => {
              const isActive = currentSubject.toLowerCase() === sub.toLowerCase();
              return (
                <button
                  key={sub}
                  onClick={() => {
                    setCurrentSubject(sub);
                    const subTemplate = OFFICIAL_CBSE_12_PCM_TEMPLATE.subjects.find(
                      (s) => s.subjectName.toLowerCase() === sub.toLowerCase()
                    );
                    if (subTemplate && subTemplate.chapters.length > 0) {
                      setCurrentChapter(subTemplate.chapters[0].name);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? sub === 'Physics'
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                        : sub === 'Chemistry'
                        ? 'bg-pink-600 text-white shadow-sm shadow-pink-500/30'
                        : 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {sub}
                  <span className="text-[10px] ml-1 opacity-75 font-normal">
                    {sub === 'Physics' ? '042' : sub === 'Chemistry' ? '043' : '041'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Chapter Selector Dropdown */}
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <span className="text-xs font-semibold text-muted-foreground shrink-0 hidden sm:inline">
              Chapter:
            </span>
            <div className="relative flex-1">
              <select
                value={currentChapter}
                onChange={(e) => setCurrentChapter(e.target.value)}
                className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-foreground text-xs font-semibold rounded-xl px-3 py-2 pr-8 focus:outline-none focus:border-purple-500 truncate cursor-pointer"
              >
                {chapterOptions.map((ch) => (
                  <option key={ch.id} value={ch.name}>
                    {ch.name} (wt: {ch.weightage}m)
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* AI Memory & Recommendations Toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMemoryPanel((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                showMemoryPanel
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-foreground hover:bg-slate-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>AI Memory</span>
              {recentDoubts.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                  {recentDoubts.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowRecommendations((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                showRecommendations
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-foreground hover:bg-slate-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Recommendations</span>
            </button>
          </div>
        </div>

        {/* Row 2: Tutor Mode Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {TUTOR_MODES.map((mode) => {
            const isSelected = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/25'
                    : 'bg-slate-100 dark:bg-slate-800/60 text-muted-foreground hover:text-foreground hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                }`}
              >
                <span>{mode.icon}</span>
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Expandable Study Recommendations Widget */}
      {showRecommendations && (
        <div className="p-4 rounded-3xl bg-card/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm transition-all duration-300">
          <StudyRecommendationsWidget
            onSelectRecommendation={(rec) => {
              setCurrentSubject(rec.subject);
              setCurrentChapter(rec.chapter);
              setSelectedMode(rec.mode);
              setShowRecommendations(false);
              handleSend(rec.presetPrompt);
            }}
          />
        </div>
      )}

      {/* Expandable Session AI Memory Drawer */}
      {showMemoryPanel && (
        <div className="p-4 rounded-3xl bg-card/80 backdrop-blur-xl border border-purple-200/80 dark:border-purple-900/40 shadow-md space-y-3 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Session AI Memory & Context
              </h3>
            </div>
            <button
              onClick={clearSessionMemory}
              className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Session</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Recent Doubts */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <span>Recent Doubts ({recentDoubts.length})</span>
              </div>
              {recentDoubts.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No doubts recorded yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {recentDoubts.map((d) => (
                    <div
                      key={d.id}
                      onClick={() => {
                        setActiveDoubtToContinue(d);
                        setShowMemoryPanel(false);
                      }}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:border-purple-400 border border-transparent cursor-pointer text-xs transition-colors"
                    >
                      <div className="font-semibold text-foreground truncate">{d.question}</div>
                      <div className="text-[10px] text-muted-foreground flex items-center justify-between mt-1">
                        <span>{d.chapter}</span>
                        <span className="text-purple-600 dark:text-purple-400 font-bold">Resume →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Formulas */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Formulas Retained ({recentFormulas.length})
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {recentFormulas.map((f, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-xs font-mono border border-slate-200/50 dark:border-white/5"
                  >
                    <div className="font-sans font-bold text-foreground text-[11px]">{f.title}</div>
                    <div className="text-purple-600 dark:text-purple-400 text-[10px] truncate">{f.formula}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Identified Weak Topics */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Tracked Weak Spots ({recentWeakTopics.length})
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {recentWeakTopics.map((wt, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setShowMemoryPanel(false);
                      handleSend(`Help me thoroughly understand ${wt} step-by-step.`);
                    }}
                    className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-xs text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/30 flex items-center justify-between cursor-pointer hover:bg-rose-100/60"
                  >
                    <span className="truncate">{wt}</span>
                    <span className="text-[10px] font-bold">Ask AI →</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Container */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-card/60 backdrop-blur-xl shadow-lg flex flex-col h-[580px] overflow-hidden">
        {/* Messages Feed */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 scrollbar-thin">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-500/20 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-3xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed transition-all ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-xs shadow-md shadow-purple-500/20'
                    : 'bg-white dark:bg-slate-900/90 text-foreground border border-slate-200/80 dark:border-white/10 rounded-tl-xs shadow-sm'
                }`}
              >
                {/* Meta details if available */}
                {m.sender === 'ai' && m.subject && (
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                        {m.subject}
                      </span>
                      {m.chapter && (
                        <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[180px]">
                          {m.chapter}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {m.isFallback && (
                        <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200/50">
                          Resilient Knowledge
                        </span>
                      )}
                      <button
                        onClick={() => handleCopyMessage(m.id, m.text)}
                        className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors cursor-pointer"
                        title="Copy Response"
                      >
                        {copiedId === m.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Body Content */}
                {m.sender === 'user' ? (
                  <p className="whitespace-pre-wrap font-medium">{m.text}</p>
                ) : (
                  <MarkdownMathRenderer content={m.text} />
                )}

                {/* Timestamp */}
                <div
                  className={`text-[9px] mt-2 font-medium ${
                    m.sender === 'user' ? 'text-purple-200 text-right' : 'text-muted-foreground'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>

              {m.sender === 'user' && (
                <div className="w-8 h-8 rounded-2xl bg-slate-200 dark:bg-slate-700 text-foreground flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="w-4 h-4 text-purple-600 animate-spin" />
                <span>
                  Rankify AI is synthesizing CBSE 12 {currentSubject} solution with NCERT focus...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-50/70 dark:bg-slate-900/60 border-t border-slate-200/60 dark:border-white/5 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-500" />
            Quick CBSE Doubts:
          </span>
          {getQuickChips().map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              className="text-[11px] whitespace-nowrap px-3 py-1 rounded-xl bg-white dark:bg-slate-800 text-foreground/80 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0 shadow-xs"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white dark:bg-slate-900/90 border-t border-slate-200/80 dark:border-white/10 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={`Ask any question on ${currentSubject} (${currentChapter})...`}
            className="flex-1 bg-slate-100 dark:bg-slate-800 px-4 h-12 rounded-2xl text-xs sm:text-sm border border-slate-200/80 dark:border-slate-700 focus:outline-none focus:border-purple-500 text-foreground transition-colors"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="h-12 px-5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-purple-500/25 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask Doubt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
