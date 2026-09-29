import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { mistakeService } from '@/services/mistake-service';
import {
  MistakeItem,
  MistakeType,
  MistakeStatus,
  MistakeImportance,
  MistakeDifficulty,
  QuestionType,
  MistakeFilterOptions,
} from '@/types/mistake';
import {
  BookX,
  Flame,
  Search,
  Filter,
  Bookmark,
  Pin,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  BarChart3,
  Calendar,
  AlertTriangle,
  Brain,
  HelpCircle,
  Clock,
  ArrowRight,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Award,
  Layers,
  Star,
  Check,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

const MISTAKE_TYPES: MistakeType[] = [
  'Concept Error',
  'Formula Error',
  'Calculation Error',
  'Reading Error',
  'Silly Mistake',
  'Time Management',
  'Memory Error',
  'Guess',
];

const MISTAKE_TYPE_COLORS: Record<MistakeType, { bg: string; text: string; border: string }> = {
  'Concept Error': { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/25' },
  'Formula Error': { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/25' },
  'Calculation Error': { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/25' },
  'Reading Error': { bg: 'bg-sky-500/10', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-500/25' },
  'Silly Mistake': { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/25' },
  'Time Management': { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/25' },
  'Memory Error': { bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-500/25' },
  'Guess': { bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-500/25' },
};

const STATUS_BADGES: Record<MistakeStatus, { bg: string; text: string; label: string }> = {
  New: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', label: 'New' },
  'Needs Revision': { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', label: 'Needs Revision' },
  Learning: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', label: 'Learning' },
  Improved: { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', label: 'Improved' },
  Mastered: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', label: 'Mastered 🎓' },
};

export const MistakeNotebookView: React.FC = () => {
  const { user } = useAuth();
  const [mistakes, setMistakes] = useState<MistakeItem[]>(() => mistakeService.getMistakes());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters & Search State
  const [filters, setFilters] = useState<MistakeFilterOptions>({
    searchQuery: '',
    subject: 'All',
    chapter: 'All',
    mistakeType: 'All',
    difficulty: 'All',
    revisionDue: 'All',
    status: 'All',
    bookmarkedOnly: false,
    pinnedOnly: false,
  });

  // Active view tab: 'notebook' | 'analytics'
  const [activeTab, setActiveTab] = useState<'notebook' | 'analytics'>('notebook');

  // Quick Revision Interactive Session Modal
  const [revisionSessionActive, setRevisionSessionActive] = useState<boolean>(false);
  const [revisionIndex, setRevisionIndex] = useState<number>(0);
  const [revisionShowAnswer, setRevisionShowAnswer] = useState<boolean>(false);
  const [revisionSelectedOption, setRevisionSelectedOption] = useState<string | null>(null);

  // Single Question Direct Re-test Modal
  const [retestItem, setRetestItem] = useState<MistakeItem | null>(null);
  const [retestSelectedOption, setRetestSelectedOption] = useState<string | null>(null);
  const [retestAnswerRevealed, setRetestAnswerRevealed] = useState<boolean>(false);

  // Manual Add Mistake Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [manualQuestion, setManualQuestion] = useState('');
  const [manualCorrectAnswer, setManualCorrectAnswer] = useState('');
  const [manualStudentAnswer, setManualStudentAnswer] = useState('');
  const [manualExplanation, setManualExplanation] = useState('');
  const [manualSubject, setManualSubject] = useState<'Physics' | 'Chemistry' | 'Mathematics'>('Physics');
  const [manualChapter, setManualChapter] = useState('');
  const [manualMistakeType, setManualMistakeType] = useState<MistakeType>('Concept Error');
  const [manualDifficulty, setManualDifficulty] = useState<MistakeDifficulty>('Medium');

  useEffect(() => {
    if (user?.uid) {
      mistakeService.loadMistakes(user.uid).then((items) => {
        setMistakes(items);
      });
    }

    const unsub = mistakeService.subscribe((updated) => {
      setMistakes(updated);
    });
    return () => unsub();
  }, [user?.uid]);

  // Real-time statistics
  const stats = useMemo(() => mistakeService.getStatistics(), [mistakes]);

  // Unique chapters for filter dropdown
  const uniqueChapters = useMemo(() => {
    const set = new Set<string>();
    mistakes.forEach((m) => {
      if (m.chapter) set.add(m.chapter);
    });
    return Array.from(set);
  }, [mistakes]);

  // Filtered & Sorted Mistakes
  const filteredMistakes = useMemo(() => {
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    return mistakes.filter((m) => {
      // 1. Search Query
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const match =
          m.question.toLowerCase().includes(query) ||
          m.chapter.toLowerCase().includes(query) ||
          (m.topic && m.topic.toLowerCase().includes(query)) ||
          m.explanation.toLowerCase().includes(query) ||
          (m.notes && m.notes.toLowerCase().includes(query));
        if (!match) return false;
      }

      // 2. Subject Filter
      if (filters.subject !== 'All' && m.subject !== filters.subject) {
        return false;
      }

      // 3. Chapter Filter
      if (filters.chapter !== 'All' && m.chapter !== filters.chapter) {
        return false;
      }

      // 4. Mistake Type Filter
      if (filters.mistakeType !== 'All' && m.mistakeType !== filters.mistakeType) {
        return false;
      }

      // 5. Difficulty Filter
      if (filters.difficulty !== 'All' && m.difficulty !== filters.difficulty) {
        return false;
      }

      // 6. Status Filter
      if (filters.status !== 'All' && m.status !== filters.status) {
        return false;
      }

      // 7. Revision Due Filter
      if (filters.revisionDue !== 'All') {
        const dueDate = new Date(m.nextRevisionDue);
        if (filters.revisionDue === 'Due Today') {
          if (m.status === 'Mastered' || dueDate > todayEnd) return false;
        } else if (filters.revisionDue === 'Overdue') {
          if (m.status === 'Mastered' || dueDate > now) return false;
        } else if (filters.revisionDue === 'Upcoming') {
          if (dueDate <= todayEnd) return false;
        }
      }

      // 8. Bookmarked / Pinned
      if (filters.bookmarkedOnly && !m.isBookmarked) return false;
      if (filters.pinnedOnly && !m.isPinned) return false;

      return true;
    }).sort((a, b) => {
      // Pinned items always appear first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      // Then sort by urgency of revision
      return new Date(a.nextRevisionDue).getTime() - new Date(b.nextRevisionDue).getTime();
    });
  }, [mistakes, filters]);

  // Due today mistakes for quick session
  const dueTodayMistakes = useMemo(() => {
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return mistakes.filter((m) => m.status !== 'Mastered' && new Date(m.nextRevisionDue) <= todayEnd);
  }, [mistakes]);

  // Format revision due text
  const formatRevisionDueBadge = (m: MistakeItem) => {
    if (m.status === 'Mastered') {
      return { text: 'Mastered', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
    }
    const due = new Date(m.nextRevisionDue);
    const now = new Date();
    const diffHours = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60));

    if (diffHours < 0) {
      return { text: 'Overdue ⚠️', color: 'text-rose-500 bg-rose-500/10 border-rose-500/30' };
    }
    if (diffHours <= 24) {
      return { text: 'Due Today 🔥', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' };
    }
    const days = Math.ceil(diffHours / 24);
    return { text: `In ${days} days`, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' };
  };

  // Handle Manual Mistake Submission
  const handleCreateManualMistake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQuestion.trim() || !manualCorrectAnswer.trim()) {
      toast.error('Please enter the question and correct answer');
      return;
    }

    await mistakeService.saveMistake({
      question: manualQuestion,
      correctAnswer: manualCorrectAnswer,
      studentAnswer: manualStudentAnswer || 'Not answered',
      explanation: manualExplanation || 'Review the core NCERT textbook derivation for this chapter.',
      subject: manualSubject,
      chapter: manualChapter || 'General Concepts',
      mistakeType: manualMistakeType,
      difficulty: manualDifficulty,
      source: 'Manual Entry (Offline Practice)',
    });

    setShowAddModal(false);
    setManualQuestion('');
    setManualCorrectAnswer('');
    setManualStudentAnswer('');
    setManualExplanation('');
    setManualChapter('');
  };

  // Start Quick Revision Flow
  const startRevisionSession = () => {
    if (dueTodayMistakes.length === 0) {
      toast.success('No mistakes due today! You are all caught up.', { icon: '🎉' });
      return;
    }
    setRevisionIndex(0);
    setRevisionShowAnswer(false);
    setRevisionSelectedOption(null);
    setRevisionSessionActive(true);
  };

  const handleRevisionAnswer = async (wasCorrect: boolean) => {
    const current = dueTodayMistakes[revisionIndex];
    if (current) {
      await mistakeService.recordRevision(current.id, wasCorrect);
    }

    if (revisionIndex + 1 < dueTodayMistakes.length) {
      setRevisionIndex((prev) => prev + 1);
      setRevisionShowAnswer(false);
      setRevisionSelectedOption(null);
    } else {
      setRevisionSessionActive(false);
      toast.success('🎉 Today’s revision session completed! Great memory reinforcement.', { icon: '🏆' });
    }
  };

  // Handle Retest Single Item
  const handleRetestSubmit = async (wasCorrect: boolean) => {
    if (retestItem) {
      await mistakeService.recordRevision(retestItem.id, wasCorrect);
      setRetestItem(null);
      setRetestAnswerRevealed(false);
      setRetestSelectedOption(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 select-none animate-fadeIn">
      {/* 1. HERO HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-950 via-slate-950 to-indigo-950 p-6 sm:p-8 text-white shadow-2xl border border-rose-500/25">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-3 py-1 text-xs font-semibold text-rose-200 border border-white/15">
              <BookX className="h-3.5 w-3.5 text-rose-300" />
              <span>Rankify Core Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight flex items-center gap-2">
              <span>Mistake Notebook</span>
              <span className="text-sm font-bold bg-rose-500/20 text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                Spaced Repetition
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
              Every incorrect question in Practice, NCERT PYQs, or Study Engine is automatically logged here. Re-test on Day 1, Day 3, Day 7, Day 14, and Day 30 to guarantee 100% board accuracy!
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              onClick={startRevisionSession}
              className="h-10 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-rose-950/50 cursor-pointer flex items-center gap-1.5"
            >
              <Flame className="w-4 h-4 fill-amber-300 text-amber-300 animate-pulse" />
              <span>Revise Due Today ({stats.pendingTodayCount})</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowAddModal(true)}
              className="h-10 px-3.5 rounded-xl border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-purple-300" />
              <span>Log Mistake</span>
            </Button>
          </div>
        </div>

        {/* Ambient Glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-rose-500/15 blur-3xl pointer-events-none" />
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span>Total Errors</span>
            <BookX className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-foreground font-mono">{stats.totalMistakes}</div>
          <span className="text-[10px] text-muted-foreground">Auto-saved from sessions</span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span>Mastered Concepts</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-500 font-mono">{stats.resolvedCount}</div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">+{stats.accuracyImprovementPct}% Accuracy boost</span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span>Revise Today</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-500 font-mono">{stats.pendingTodayCount}</div>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Spaced intervals due</span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span>Top Weak Subject</span>
            <Brain className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-lg font-black text-purple-600 dark:text-purple-400 truncate">
            {stats.mostMistakesSubject}
          </div>
          <span className="text-[10px] text-muted-foreground truncate block">
            {stats.mostMistakesChapter}
          </span>
        </div>
      </div>

      {/* 3. NAVIGATION VIEW TOGGLE (Notebook vs Analytics) */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('notebook')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'notebook'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookX className="w-3.5 h-3.5" />
            <span>Mistake Vault ({filteredMistakes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Error Analytics & Diagnostic Charts</span>
          </button>
        </div>

        {/* Bookmark & Pin quick filters */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilters((prev) => ({ ...prev, pinnedOnly: !prev.pinnedOnly }))}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              filters.pinnedOnly
                ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/40'
                : 'bg-card text-muted-foreground border-slate-200 dark:border-white/10 hover:text-foreground'
            }`}
          >
            <Pin className="w-3.5 h-3.5" />
            <span>Pinned</span>
          </button>

          <button
            onClick={() => setFilters((prev) => ({ ...prev, bookmarkedOnly: !prev.bookmarkedOnly }))}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              filters.bookmarkedOnly
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40'
                : 'bg-card text-muted-foreground border-slate-200 dark:border-white/10 hover:text-foreground'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Bookmarked</span>
          </button>
        </div>
      </div>

      {activeTab === 'notebook' ? (
        <div className="space-y-5">
          {/* SEARCH & FILTER CONTROLS */}
          <div className="p-4 rounded-2xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
                placeholder="Search questions, formulas, keywords, chapters, explanations..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-foreground focus:outline-none focus:border-purple-500"
              />
              {filters.searchQuery && (
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Pills Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 pt-1 text-xs">
              {/* Subject */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Subject</label>
                <select
                  value={filters.subject}
                  onChange={(e) => setFilters((prev) => ({ ...prev, subject: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                >
                  <option value="All">All Subjects</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Biology">Biology</option>
                </select>
              </div>

              {/* Mistake Type */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Mistake Type</label>
                <select
                  value={filters.mistakeType}
                  onChange={(e) => setFilters((prev) => ({ ...prev, mistakeType: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                >
                  <option value="All">All Mistake Types</option>
                  {MISTAKE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Revision Due */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Revision Due</label>
                <select
                  value={filters.revisionDue}
                  onChange={(e) => setFilters((prev) => ({ ...prev, revisionDue: e.target.value as any }))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                >
                  <option value="All">All Intervals</option>
                  <option value="Due Today">Due Today 🔥</option>
                  <option value="Overdue">Overdue ⚠️</option>
                  <option value="Upcoming">Upcoming</option>
                </select>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as any }))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="New">New</option>
                  <option value="Needs Revision">Needs Revision</option>
                  <option value="Learning">Learning</option>
                  <option value="Improved">Improved</option>
                  <option value="Mastered">Mastered</option>
                </select>
              </div>

              {/* Difficulty */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Difficulty</label>
                <select
                  value={filters.difficulty}
                  onChange={(e) => setFilters((prev) => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                >
                  <option value="All">All Difficulties</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>
          </div>

          {/* MISTAKE CARDS LIST */}
          {filteredMistakes.length === 0 ? (
            <div className="p-12 text-center bg-card rounded-3xl border border-slate-200/80 dark:border-white/10 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center">
                <BookX className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">No matching mistakes found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Try adjusting your filters or search keywords, or practice targeted questions in the Practice tab to log new questions!
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setFilters({
                    searchQuery: '',
                    subject: 'All',
                    chapter: 'All',
                    mistakeType: 'All',
                    difficulty: 'All',
                    revisionDue: 'All',
                    status: 'All',
                    bookmarkedOnly: false,
                    pinnedOnly: false,
                  })
                }
                className="text-xs font-bold"
              >
                Clear All Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMistakes.map((item) => {
                const isExpanded = expandedId === item.id;
                const typeStyle = MISTAKE_TYPE_COLORS[item.mistakeType] || MISTAKE_TYPE_COLORS['Concept Error'];
                const statusBadge = STATUS_BADGES[item.status] || STATUS_BADGES.New;
                const dueBadge = formatRevisionDueBadge(item);

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-5 rounded-3xl bg-card border shadow-xs transition-all relative space-y-4 ${
                      item.isPinned
                        ? 'border-purple-500/50 bg-gradient-to-r from-purple-500/5 to-transparent'
                        : 'border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    {/* Top Row Badges & Pin/Bookmark Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Subject Badge */}
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-foreground">
                          {item.subject}
                        </span>

                        {/* Chapter */}
                        <span className="text-xs font-bold text-muted-foreground">
                          {item.chapter}
                        </span>

                        {/* Mistake Type Tag */}
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}
                        >
                          {item.mistakeType}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadge.bg} ${statusBadge.text}`}
                        >
                          {statusBadge.label}
                        </span>

                        {/* Revision Due Badge */}
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${dueBadge.color}`}
                        >
                          {dueBadge.text}
                        </span>
                      </div>

                      {/* Right Pin & Bookmark & Delete buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => mistakeService.togglePin(item.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            item.isPinned
                              ? 'text-purple-600 bg-purple-500/15'
                              : 'text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title={item.isPinned ? 'Unpin' : 'Pin to top'}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => mistakeService.toggleBookmark(item.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            item.isBookmarked
                              ? 'text-amber-500 bg-amber-500/15'
                              : 'text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title={item.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => mistakeService.deleteMistake(item.id)}
                          className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Delete mistake"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Question Statement */}
                    <div className="text-sm font-extrabold text-foreground leading-snug">
                      {item.question}
                    </div>

                    {/* Summary Comparison Ribbon */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 space-y-0.5">
                        <span className="text-[10px] font-black uppercase text-rose-500">Your Answer (Slip-up)</span>
                        <div className="font-bold">{item.studentAnswer}</div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 space-y-0.5">
                        <span className="text-[10px] font-black uppercase text-emerald-500">Correct Answer</span>
                        <div className="font-bold">{item.correctAnswer}</div>
                      </div>
                    </div>

                    {/* Expandable Explanation & Notes */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/5 overflow-hidden text-xs"
                        >
                          {/* Explanation */}
                          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
                              💡 Conceptual Takeaway & Explanation
                            </span>
                            <p className="text-foreground leading-relaxed font-medium">
                              {item.explanation}
                            </p>
                          </div>

                          {/* Personal Notes */}
                          {item.notes && (
                            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 space-y-0.5">
                              <span className="text-[10px] font-black uppercase">Personal Revision Note</span>
                              <p className="font-semibold">{item.notes}</p>
                            </div>
                          )}

                          {/* Spaced Repetition Progression Bar */}
                          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5 space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground">
                              <span>Spaced Repetition Mastery Stage</span>
                              <span>Stage {item.revisionStage} of 5</span>
                            </div>
                            <div className="grid grid-cols-5 gap-1.5">
                              {[
                                { stage: 1, label: 'Day 1' },
                                { stage: 2, label: 'Day 3' },
                                { stage: 3, label: 'Day 7' },
                                { stage: 4, label: 'Day 14' },
                                { stage: 5, label: '1 Month' },
                              ].map((st) => (
                                <div
                                  key={st.stage}
                                  className={`h-2 rounded-full transition-all ${
                                    item.revisionStage >= st.stage
                                      ? 'bg-purple-600'
                                      : 'bg-slate-200 dark:bg-slate-800'
                                  }`}
                                  title={`${st.label}: ${item.revisionStage >= st.stage ? 'Completed' : 'Upcoming'}`}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Quick Change Mistake Type */}
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            <span className="text-[10px] font-bold text-muted-foreground">Adjust Error Type:</span>
                            {MISTAKE_TYPES.map((type) => (
                              <button
                                key={type}
                                onClick={() => mistakeService.updateMistake(item.id, { mistakeType: type })}
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                                  item.mistakeType === type
                                    ? 'bg-purple-600 text-white border-purple-600'
                                    : 'bg-card text-muted-foreground border-slate-200 dark:border-white/10 hover:text-foreground'
                                }`}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Bottom Action Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5 text-xs font-bold">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className="text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide Solution' : 'View Full Solution & Reasoning'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setRetestItem(item);
                            setRetestAnswerRevealed(false);
                            setRetestSelectedOption(null);
                          }}
                          className="h-8 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Re-Test Now</span>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ANALYTICS & CHARTS TAB */
        <div className="space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Mistakes By Subject */}
            <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase text-muted-foreground tracking-wider">Mistakes By Subject</h4>
                <span className="text-[10px] font-bold text-purple-600">Distribution</span>
              </div>

              <div className="space-y-3 pt-1">
                {stats.mistakesBySubject.map((item) => (
                  <div key={item.subject} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-foreground">{item.subject}</span>
                      <span className="font-mono text-muted-foreground">
                        {item.count} errors ({item.pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Mistakes Per Week (SVG Trend Curve) */}
            <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase text-muted-foreground tracking-wider">Mistakes Logged Per Week</h4>
                <span className="text-[10px] font-bold text-emerald-500">Decreasing Rate 📉</span>
              </div>

              <div className="w-full h-44 bg-slate-50 dark:bg-slate-900/60 rounded-2xl relative p-3 overflow-hidden border border-slate-100 dark:border-white/5 flex flex-col justify-between">
                <svg viewBox="0 0 100 40" className="w-full h-28 overflow-visible" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="mistake-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d="M 0,10 Q 30,12 50,22 T 80,30 L 100,34 L 100,40 L 0,40 Z" fill="url(#mistake-gradient)" />
                  <path d="M 0,10 Q 30,12 50,22 T 80,30 L 100,34" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
                </svg>

                <div className="flex justify-between text-[9px] font-bold font-mono text-muted-foreground pt-1 border-t border-slate-200/60 dark:border-white/5">
                  {stats.mistakesPerWeek.map((w) => (
                    <span key={w.weekLabel}>{w.weekLabel}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Root Cause Error Breakdown */}
          <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
            <h4 className="text-xs font-black uppercase text-muted-foreground tracking-wider">Root Cause Error Classification</h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-1">
                <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400">Concept Errors</span>
                <div className="text-2xl font-black font-mono text-foreground">{stats.conceptErrorsCount}</div>
                <span className="text-[10px] text-muted-foreground">Theory & mechanisms</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">Calculation Errors</span>
                <div className="text-2xl font-black font-mono text-foreground">{stats.calculationErrorsCount}</div>
                <span className="text-[10px] text-muted-foreground">Arithmetic & powers of 10</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">Formula Errors</span>
                <div className="text-2xl font-black font-mono text-foreground">{stats.formulaErrorsCount}</div>
                <span className="text-[10px] text-muted-foreground">Theorems & equations</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1">
                <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400">Silly Mistakes</span>
                <div className="text-2xl font-black font-mono text-foreground">{stats.sillyMistakesCount}</div>
                <span className="text-[10px] text-muted-foreground">Hurried reading & signs</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK REVISION SESSION MODAL */}
      <AnimatePresence>
        {revisionSessionActive && dueTodayMistakes.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95 }}
              className="bg-card dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl relative"
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-rose-500 uppercase tracking-wider">
                    Spaced Recall Session
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    ({revisionIndex + 1} of {dueTodayMistakes.length})
                  </span>
                </div>
                <button
                  onClick={() => setRevisionSessionActive(false)}
                  className="p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Active question */}
              {dueTodayMistakes[revisionIndex] && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold">
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      {dueTodayMistakes[revisionIndex].subject}
                    </span>
                    <span className="text-muted-foreground">
                      {dueTodayMistakes[revisionIndex].chapter}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-foreground leading-snug">
                    {dueTodayMistakes[revisionIndex].question}
                  </h3>

                  {/* Options if available */}
                  {dueTodayMistakes[revisionIndex].options && (
                    <div className="space-y-2 pt-1">
                      {dueTodayMistakes[revisionIndex].options!.map((opt, idx) => {
                        const isSelected = revisionSelectedOption === opt;
                        const isCorrect = opt === dueTodayMistakes[revisionIndex].correctAnswer;

                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              if (!revisionShowAnswer) {
                                setRevisionSelectedOption(opt);
                                setRevisionShowAnswer(true);
                              }
                            }}
                            className={`w-full text-left p-3 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                              revisionShowAnswer
                                ? isCorrect
                                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                                  : isSelected
                                  ? 'bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300'
                                  : 'bg-card border-slate-200 dark:border-white/10 opacity-70'
                                : isSelected
                                ? 'bg-purple-500/15 border-purple-500 text-purple-600 dark:text-purple-400'
                                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-white/10 hover:border-purple-400'
                            }`}
                          >
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Reveal answer block */}
                  {!revisionShowAnswer ? (
                    <Button
                      onClick={() => setRevisionShowAnswer(true)}
                      className="w-full text-xs font-bold h-10 mt-2 bg-purple-600 hover:bg-purple-500"
                    >
                      <span>Show Correct Answer & Takeaway</span>
                    </Button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4 pt-2"
                    >
                      <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                        <span className="font-black text-emerald-600 dark:text-emerald-400 uppercase text-[10px]">
                          Correct Answer: {dueTodayMistakes[revisionIndex].correctAnswer}
                        </span>
                        <p className="text-foreground leading-relaxed">
                          {dueTodayMistakes[revisionIndex].explanation}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleRevisionAnswer(false)}
                          className="h-10 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-extrabold text-xs cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Still Confused (Reset)</span>
                        </button>

                        <button
                          onClick={() => handleRevisionAnswer(true)}
                          className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Understood (+1 Stage)</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SINGLE ITEM DIRECT RETEST MODAL */}
      <AnimatePresence>
        {retestItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95 }}
              className="bg-card dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-4 shadow-2xl relative"
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-3">
                <span className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                  Targeted Re-Test Mode
                </span>
                <button
                  onClick={() => setRetestItem(null)}
                  className="p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-xs text-muted-foreground font-semibold">
                {retestItem.subject} • {retestItem.chapter}
              </div>

              <h3 className="text-base font-extrabold text-foreground leading-snug">
                {retestItem.question}
              </h3>

              {/* Options */}
              {retestItem.options && (
                <div className="space-y-2 pt-1">
                  {retestItem.options.map((opt, idx) => {
                    const isSelected = retestSelectedOption === opt;
                    const isCorrect = opt === retestItem.correctAnswer;

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setRetestSelectedOption(opt);
                          setRetestAnswerRevealed(true);
                        }}
                        className={`w-full text-left p-3 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                          retestAnswerRevealed
                            ? isCorrect
                              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                              : isSelected
                              ? 'bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300'
                              : 'bg-card border-slate-200 dark:border-white/10 opacity-70'
                            : isSelected
                            ? 'bg-purple-500/15 border-purple-500 text-purple-600 dark:text-purple-400'
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-white/10 hover:border-purple-400'
                        }`}
                      >
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Reveal Solution */}
              {!retestAnswerRevealed ? (
                <Button
                  onClick={() => setRetestAnswerRevealed(true)}
                  className="w-full text-xs font-bold h-10 mt-2 bg-purple-600 hover:bg-purple-500"
                >
                  <span>Reveal Solution & Check</span>
                </Button>
              ) : (
                <div className="space-y-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                    <span className="font-black text-emerald-600 dark:text-emerald-400 uppercase text-[10px]">
                      Correct Answer: {retestItem.correctAnswer}
                    </span>
                    <p className="text-foreground leading-relaxed">{retestItem.explanation}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleRetestSubmit(false)}
                      className="h-10 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-extrabold text-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Still Unsure (Stage 1)</span>
                    </button>

                    <button
                      onClick={() => handleRetestSubmit(true)}
                      className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mastered Recall (+1)</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MANUAL LOG MISTAKE MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95 }}
              className="bg-card dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl relative"
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-3">
                <span className="text-sm font-black text-foreground">Log Offline or Mock Test Mistake</span>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateManualMistake} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground">Question Statement</label>
                  <textarea
                    required
                    value={manualQuestion}
                    onChange={(e) => setManualQuestion(e.target.value)}
                    rows={2}
                    placeholder="Enter the exact question..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground">Correct Answer</label>
                    <input
                      type="text"
                      required
                      value={manualCorrectAnswer}
                      onChange={(e) => setManualCorrectAnswer(e.target.value)}
                      placeholder="e.g. Option B / 45 Joules"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs text-foreground focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground">Your Slip-up Answer</label>
                    <input
                      type="text"
                      value={manualStudentAnswer}
                      onChange={(e) => setManualStudentAnswer(e.target.value)}
                      placeholder="What did you mark?"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs text-foreground focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground">Subject</label>
                    <select
                      value={manualSubject}
                      onChange={(e) => setManualSubject(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs text-foreground focus:outline-none"
                    >
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Mathematics">Mathematics</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground">Chapter Name</label>
                    <input
                      type="text"
                      value={manualChapter}
                      onChange={(e) => setManualChapter(e.target.value)}
                      placeholder="e.g. Ray Optics"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs text-foreground focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground">Mistake Type</label>
                    <select
                      value={manualMistakeType}
                      onChange={(e) => setManualMistakeType(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs text-foreground focus:outline-none"
                    >
                      {MISTAKE_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground">Difficulty</label>
                    <select
                      value={manualDifficulty}
                      onChange={(e) => setManualDifficulty(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs text-foreground focus:outline-none"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground">Key Formula or Explanation</label>
                  <textarea
                    value={manualExplanation}
                    onChange={(e) => setManualExplanation(e.target.value)}
                    rows={2}
                    placeholder="Why was the answer correct? Note down the formula..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-foreground focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                    className="text-xs font-bold"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="text-xs font-bold bg-purple-600 hover:bg-purple-500">
                    Save to Notebook
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
