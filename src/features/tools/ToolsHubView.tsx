import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigation } from '@/contexts/NavigationContext';
import { useAuth } from '@/hooks/use-auth';
import { safeLocalStorage } from '@/utils/storage';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TOTAL_OFFICIAL_CHAPTERS } from '@/services/chapter-service';
import {
  Sparkles,
  Search,
  BookOpen,
  Zap,
  Target,
  RotateCcw,
  Brain,
  Compass,
  History,
  Bookmark,
  Award,
  Video,
  Settings,
  Shield,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  User,
  Activity,
  FileText,
  Pin,
  Star,
  Download,
  Bell,
  HardDrive,
  Calendar,
  BarChart3,
  HelpCircle,
  FileSpreadsheet,
  Palette,
  X,
} from 'lucide-react';
import { NavRoute } from '@/types/navigation';
import toast from 'react-hot-toast';

export type ToolCategory =
  | 'All'
  | 'Favorites'
  | 'Study'
  | 'AI'
  | 'Revision'
  | 'Analytics'
  | 'Utilities'
  | 'Admin';

export interface ToolItem {
  id: string;
  name: string;
  tagline: string;
  category: Exclude<ToolCategory, 'All' | 'Favorites'>;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  route?: NavRoute;
  action?: () => void;
  stat?: string;
  keywords: string[];
}

export const ToolsHubView: React.FC = () => {
  const { setActiveTab } = useNavigation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.email === 'devgamerz3131@gmail.com';

  const [activeCategory, setActiveCategory] = useState<ToolCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const categoryTabsRef = useRef<HTMLDivElement>(null);

  const updateCategoryFade = useCallback(() => {
    const el = categoryTabsRef.current;
    if (!el) return;
    el.setAttribute('data-fade-left', el.scrollLeft > 4 ? 'true' : 'false');
    el.setAttribute(
      'data-fade-right',
      el.scrollLeft + el.clientWidth < el.scrollWidth - 4 ? 'true' : 'false'
    );
  }, []);

  useEffect(() => {
    const el = categoryTabsRef.current;
    if (!el) return;
    const activeBtn = el.querySelector('[data-active="true"]') as HTMLElement | null;
    if (activeBtn && el.scrollWidth > el.clientWidth) {
      const targetLeft = activeBtn.offsetLeft - el.clientWidth / 2 + activeBtn.clientWidth / 2;
      el.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
    }
    updateCategoryFade();
    window.addEventListener('resize', updateCategoryFade);
    return () => window.removeEventListener('resize', updateCategoryFade);
  }, [activeCategory, updateCategoryFade]);

  // State for pinned tools and recently used tools
  const [pinnedToolIds, setPinnedToolIds] = useState<string[]>(() => {
    const saved = safeLocalStorage.getItem<string[] | null>('rankify_pinned_tools', null);
    return saved && Array.isArray(saved) && saved.length > 0
      ? saved
      : ['study-formula', 'ai-brain', 'revision-center'];
  });

  const [recentlyUsedIds, setRecentlyUsedIds] = useState<string[]>(() => {
    const saved = safeLocalStorage.getItem<string[] | null>('rankify_recent_tools', null);
    return saved && Array.isArray(saved) && saved.length > 0
      ? saved
      : ['study-ncert', 'ai-brain'];
  });

  // Save pinned tools to safeLocalStorage
  useEffect(() => {
    safeLocalStorage.setItem('rankify_pinned_tools', pinnedToolIds);
  }, [pinnedToolIds]);

  // Save recently used tools to safeLocalStorage
  useEffect(() => {
    safeLocalStorage.setItem('rankify_recent_tools', recentlyUsedIds);
  }, [recentlyUsedIds]);

  const togglePin = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setPinnedToolIds((prev) => {
      const isPinned = prev.includes(id);
      const next = isPinned ? prev.filter((item) => item !== id) : [...prev, id];
      toast.success(isPinned ? 'Removed from pinned tools' : 'Pinned to top of Tools Hub', {
        icon: isPinned ? '📌' : '⭐',
      });
      return next;
    });
  };

  const handleToolClick = (tool: ToolItem) => {
    // Add to recently used
    setRecentlyUsedIds((prev) => {
      const filtered = prev.filter((id) => id !== tool.id);
      return [tool.id, ...filtered].slice(0, 5);
    });

    if (tool.action) {
      tool.action();
    } else if (tool.route) {
      setActiveTab(tool.route);
    }
  };

  // COMPLETE TOOLS REGISTRY organized strictly by required categories
  const ALL_TOOLS: ToolItem[] = [
    // ==================== 1. STUDY ====================
    {
      id: 'study-ncert',
      name: 'NCERT Library',
      tagline: 'Interactive textbook reader with AI paragraph summaries, audio synthesis & margin notes.',
      category: 'Study',
      badge: 'Textbook AI',
      icon: BookOpen,
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      route: 'ncert',
      stat: `${TOTAL_OFFICIAL_CHAPTERS} Chapters`,
      keywords: ['ncert', 'textbook', 'reader', 'electrostatics', 'solutions', 'integrals'],
    },
    {
      id: 'study-formula',
      name: 'Formula Intelligence',
      tagline: 'Class 12 equation deck with interactive step-by-step derivations & variable checks.',
      category: 'Study',
      badge: 'Equation Deck',
      icon: Zap,
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      iconColor: 'text-amber-600 dark:text-amber-400',
      route: 'formula',
      stat: '40+ Formulas',
      keywords: ['formula', 'equation', 'coulomb', 'nernst', 'snell', 'integration', 'physics', 'maths'],
    },
    {
      id: 'study-flashcards',
      name: 'Rapid Recall Flashcards',
      tagline: 'High-speed 5-minute quiz sets to test high-yield definitions and key constants.',
      category: 'Study',
      badge: 'Quick Drills',
      icon: Zap,
      iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      iconColor: 'text-purple-600 dark:text-purple-400',
      route: 'practice',
      stat: '5-Min Quiz',
      keywords: ['flashcards', 'rapid', 'drill', 'constants', 'definitions'],
    },
    {
      id: 'study-questiongen',
      name: 'Smart Question Generator',
      tagline: 'Adaptive AI tests featuring 11+ question types, board blueprints & step explanations.',
      category: 'Study',
      badge: 'Adaptive Tests',
      icon: Target,
      iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      route: 'practice',
      stat: '11 Question Types',
      keywords: ['question', 'generator', 'mcq', 'assertion', 'numerical', 'case study', 'cbse'],
    },
    {
      id: 'study-mocktests',
      name: 'CBSE Mock Tests',
      tagline: 'Full-length 3-hour timed practice papers following the Class 12 board exam pattern.',
      category: 'Study',
      badge: 'Board Papers',
      icon: FileText,
      iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
      iconColor: 'text-rose-600 dark:text-rose-400',
      route: 'practice',
      stat: '3-Hour Simulation',
      keywords: ['mock', 'test', 'exam', 'simulation', 'board', 'pyq', '10-year'],
    },
    {
      id: 'study-practice',
      name: 'Practice Center',
      tagline: 'Personalized practice arena targeting your specific weak chapters and forgotten formulas.',
      category: 'Study',
      badge: 'Practice Arena',
      icon: Target,
      iconBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      route: 'practice',
      stat: 'Targeted Practice',
      keywords: ['practice', 'center', 'arena', 'weakness', 'drill'],
    },

    // ==================== 2. AI ====================
    {
      id: 'ai-ask',
      name: 'Ask AI (Doubt Solver)',
      tagline: 'Deep academic doubt solver calibrated specifically for CBSE Class 12 PCM physics & maths.',
      category: 'AI',
      badge: 'Instant Tutor',
      icon: Sparkles,
      iconBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      route: 'ai',
      stat: 'Unlimited Doubts',
      keywords: ['ask', 'ai', 'doubt', 'solver', 'chat', 'tutor', 'explanation'],
    },
    {
      id: 'ai-brain',
      name: 'AI Study Coach',
      tagline: 'Personal study coach that tracks your study habits, focus hours & daily progress.',
      category: 'AI',
      badge: 'Study Coach',
      icon: Brain,
      iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      iconColor: 'text-purple-600 dark:text-purple-400',
      route: 'brain',
      stat: 'Study Habits',
      keywords: ['brain', 'ai', 'coach', 'dna', 'mentor', 'habits', 'intelligence'],
    },
    {
      id: 'ai-briefing',
      name: 'Daily Briefing',
      tagline: 'Daily morning focus plan, midday check-ins, evening summary & reflection.',
      category: 'AI',
      badge: 'Daily Plan',
      icon: Sparkles,
      iconBg: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
      iconColor: 'text-pink-600 dark:text-pink-400',
      route: 'briefing',
      stat: 'Morning & Evening',
      keywords: ['briefing', 'morning', 'daily', 'check-in', 'intelligence'],
    },
    {
      id: 'ai-studydna',
      name: 'Study Habits & Focus',
      tagline: 'Tracks your revision consistency and most productive study hours.',
      category: 'AI',
      badge: 'Focus Tracker',
      icon: Activity,
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      route: 'brain',
      stat: 'Focus Hours',
      keywords: ['dna', 'study', 'cognitive', 'behavioral', 'retention', 'profile'],
    },
    {
      id: 'ai-weakness',
      name: 'Weakness Analyzer',
      tagline: 'Identifies weak chapters, error causes, and suggested revision tasks.',
      category: 'AI',
      badge: 'Chapter Analysis',
      icon: Brain,
      iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
      iconColor: 'text-rose-600 dark:text-rose-400',
      route: 'weakness',
      stat: 'Weakness Breakdown',
      keywords: ['weakness', 'analyzer', 'diagnostic', 'bottleneck', 'root cause'],
    },
    {
      id: 'ai-readiness',
      name: 'Exam Readiness Score',
      tagline: 'Calculates your board exam readiness score from your syllabus progress and accuracy.',
      category: 'AI',
      badge: 'Readiness Score',
      icon: Award,
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      iconColor: 'text-amber-600 dark:text-amber-400',
      route: 'readiness',
      stat: '0-100 Score',
      keywords: ['readiness', 'exam', 'score', 'rating', 'board', 'probability'],
    },

    // ==================== 3. REVISION ====================
    {
      id: 'revision-center',
      name: 'Smart Revision',
      tagline: 'Spaced repetition schedule for reviewing chapters on Day 1, 3, 7, 14 & 30.',
      category: 'Revision',
      badge: 'Spaced Recall',
      icon: RotateCcw,
      iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      iconColor: 'text-purple-600 dark:text-purple-400',
      route: 'revision',
      stat: 'Spaced Repetition',
      keywords: ['revision', 'smart', 'spaced', 'recall', 'repetition', 'electrochemistry'],
    },
    {
      id: 'revision-mistakes',
      name: 'Mistake Notebook',
      tagline: 'Auto-logs failed practice questions with root error categorization and review drills.',
      category: 'Revision',
      badge: 'Error Journal',
      icon: Bookmark,
      iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
      iconColor: 'text-rose-600 dark:text-rose-400',
      route: 'mistakes',
      stat: 'Auto Spaced Recall',
      keywords: ['mistake', 'notebook', 'error', 'journal', 'wrong', 'failed'],
    },
    {
      id: 'revision-replay',
      name: 'Study Replay',
      tagline: 'Student learning diary visualizing your daily study timeline and achievements.',
      category: 'Revision',
      badge: 'Diary Timeline',
      icon: History,
      iconBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      route: 'replay',
      stat: 'Daily Journey Log',
      keywords: ['replay', 'history', 'diary', 'timeline', 'journey', 'log'],
    },
    {
      id: 'revision-calendar',
      name: 'Revision Calendar',
      tagline: `Calendar planner mapping out upcoming spaced revision dates for all ${TOTAL_OFFICIAL_CHAPTERS} PCM chapters.`,
      category: 'Revision',
      badge: 'Planner',
      icon: Calendar,
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      iconColor: 'text-blue-600 dark:text-blue-400',
      route: 'revision',
      stat: `${TOTAL_OFFICIAL_CHAPTERS} Chapter Schedule`,
      keywords: ['calendar', 'revision', 'schedule', 'planner', 'dates'],
    },
    {
      id: 'revision-formularevision',
      name: 'Formula Revision',
      tagline: 'Targeted formula recall drills testing variables, units, and derivation assumptions.',
      category: 'Revision',
      badge: 'Equation Drill',
      icon: Zap,
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      iconColor: 'text-amber-600 dark:text-amber-400',
      route: 'formula',
      stat: 'Formula Recall',
      keywords: ['formula', 'revision', 'recall', 'units', 'variables'],
    },

    // ==================== 4. ANALYTICS ====================
    {
      id: 'analytics-progress',
      name: 'Progress Dashboard',
      tagline: 'Complete subject-wise coverage breakdowns, accuracy trends, and chapter completion bars.',
      category: 'Analytics',
      badge: 'Coverage Deck',
      icon: TrendingUp,
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      route: 'progress',
      stat: 'Subject Breakdown',
      keywords: ['progress', 'dashboard', 'analytics', 'accuracy', 'trends', 'coverage'],
    },
    {
      id: 'analytics-stats',
      name: 'Study Statistics',
      tagline: 'Detailed time logging, daily study minutes, streak protection history & question counts.',
      category: 'Analytics',
      badge: 'Time Logging',
      icon: BarChart3,
      iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      route: 'progress',
      stat: 'Study Minutes',
      keywords: ['statistics', 'time', 'streak', 'minutes', 'questions', 'stats'],
    },
    {
      id: 'analytics-achievements',
      name: 'Achievements & Badges',
      tagline: 'Unlock academic milestone badges for solving 100+ questions and maintaining study streaks.',
      category: 'Analytics',
      badge: 'Badges',
      icon: Award,
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      iconColor: 'text-amber-600 dark:text-amber-400',
      route: 'profile',
      stat: 'Academic Badges',
      keywords: ['achievements', 'badges', 'milestones', 'awards', 'streaks'],
    },
    {
      id: 'analytics-heatmaps',
      name: 'Study Heatmaps',
      tagline: 'Visual GitHub-style consistency heatmap displaying daily study density across the year.',
      category: 'Analytics',
      badge: 'Consistency Grid',
      icon: FileSpreadsheet,
      iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      iconColor: 'text-purple-600 dark:text-purple-400',
      route: 'replay',
      stat: '365-Day Heatmap',
      keywords: ['heatmap', 'consistency', 'density', 'grid', 'calendar'],
    },
    {
      id: 'analytics-command',
      name: 'Exam Command Center',
      tagline: '30-second executive summary of days remaining, syllabus pace & readiness rating.',
      category: 'Analytics',
      badge: 'Command Deck',
      icon: Compass,
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      iconColor: 'text-blue-600 dark:text-blue-400',
      route: 'command',
      stat: '30s Intelligence',
      keywords: ['command', 'center', 'executive', 'summary', 'days', 'pace'],
    },

    // ==================== 5. UTILITIES ====================
    {
      id: 'utilities-downloads',
      name: 'Offline Downloads',
      tagline: 'Manage offline cached NCERT chapters, formula cheat sheets & practice question banks.',
      category: 'Utilities',
      badge: 'Offline Cache',
      icon: Download,
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      iconColor: 'text-blue-600 dark:text-blue-400',
      route: 'profile',
      stat: 'Offline Mode',
      keywords: ['downloads', 'offline', 'cache', 'pdf', 'notes'],
    },
    {
      id: 'utilities-bookmarks',
      name: 'Saved Bookmarks',
      tagline: 'Quick access to bookmarked NCERT paragraphs, complex derivations, and tough formulas.',
      category: 'Utilities',
      badge: 'Saved Items',
      icon: Bookmark,
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      iconColor: 'text-amber-600 dark:text-amber-400',
      route: 'mistakes',
      stat: 'Saved Library',
      keywords: ['bookmarks', 'saved', 'items', 'important', 'formulas'],
    },
    {
      id: 'utilities-notes',
      name: 'Saved Notes',
      tagline: 'Student notebook compiling custom AI doubt explanations and personal formula notes.',
      category: 'Utilities',
      badge: 'Notebook',
      icon: FileText,
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      route: 'ncert',
      stat: 'Personal Notes',
      keywords: ['notes', 'notebook', 'saved', 'custom', 'margin'],
    },
    {
      id: 'utilities-notifications',
      name: 'Notification Center',
      tagline: 'Calibrate quiet hours, study reminder frequencies & audio chime preferences.',
      category: 'Utilities',
      badge: 'Reminders',
      icon: Bell,
      iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      iconColor: 'text-purple-600 dark:text-purple-400',
      route: 'settings',
      stat: 'Custom Alerts',
      keywords: ['notification', 'center', 'reminders', 'quiet hours', 'settings'],
    },
    {
      id: 'utilities-appearancelab',
      name: 'Appearance',
      tagline: 'Customize theme, accent colors, card spacing, corner radius & display presets.',
      category: 'Utilities',
      badge: 'Theme',
      icon: Palette,
      iconBg: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
      iconColor: 'text-pink-600 dark:text-pink-400',
      route: 'profile',
      stat: 'Live Studio',
      keywords: ['appearance', 'lab', 'theme', 'accent', 'radius', 'density', 'style', 'presets'],
    },
    {
      id: 'utilities-backup',
      name: 'Backup & Restore',
      tagline: 'Cloud synchronization & instant local JSON data export to protect your study progress.',
      category: 'Utilities',
      badge: 'Data Security',
      icon: HardDrive,
      iconBg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
      iconColor: 'text-slate-600 dark:text-slate-400',
      route: 'settings',
      stat: 'Cloud Sync',
      keywords: ['backup', 'restore', 'json', 'cloud', 'sync', 'security', 'settings'],
    },

    // ==================== 6. ADMIN (Conditional) ====================
    ...(isAdmin
      ? [
          {
            id: 'admin-console',
            name: 'Admin Console',
            tagline: 'Anonymous cohort analytics, student broadcasts & question telemetry.',
            category: 'Admin' as Exclude<ToolCategory, 'All' | 'Favorites'>,
            badge: 'Admin Only',
            icon: Shield,
            iconBg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
            iconColor: 'text-indigo-600 dark:text-indigo-400',
            route: 'admin' as NavRoute,
            stat: 'System Telemetry',
            keywords: ['admin', 'console', 'cohort', 'telemetry', 'broadcasts'],
          },
        ]
      : []),
  ];

  // Filter categories
  const categories: ToolCategory[] = [
    'All',
    'Favorites',
    'Study',
    'AI',
    'Revision',
    'Analytics',
    'Utilities',
    ...(isAdmin ? (['Admin'] as ToolCategory[]) : []),
  ];

  // Pinned tools items
  const pinnedTools = useMemo(() => {
    return ALL_TOOLS.filter((tool) => pinnedToolIds.includes(tool.id));
  }, [pinnedToolIds]);

  // Recently used items
  const recentlyUsedTools = useMemo(() => {
    return recentlyUsedIds
      .map((id) => ALL_TOOLS.find((t) => t.id === id))
      .filter((t): t is ToolItem => Boolean(t));
  }, [recentlyUsedIds]);

  // Universal Smart Search & Category Filter
  const filteredTools = useMemo(() => {
    return ALL_TOOLS.filter((tool) => {
      // Category filter
      if (activeCategory === 'Favorites') {
        if (!pinnedToolIds.includes(tool.id)) return false;
      } else if (activeCategory !== 'All') {
        if (tool.category !== activeCategory) return false;
      }

      // Search query filter
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase().trim();
      const matchName = tool.name.toLowerCase().includes(query);
      const matchTagline = tool.tagline.toLowerCase().includes(query);
      const matchCategory = tool.category.toLowerCase().includes(query);
      const matchKeywords = tool.keywords.some((kw) => kw.toLowerCase().includes(query));

      return matchName || matchTagline || matchCategory || matchKeywords;
    });
  }, [activeCategory, searchQuery, pinnedToolIds]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 select-none">
      {/* ========================================================
          1. HEADER & UNIVERSAL SMART SEARCH BAR
          ======================================================== */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950 text-white border border-purple-500/25 shadow-2xl space-y-5">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-bold border border-white/15">
              <Layers className="w-3.5 h-3.5 text-purple-300" />
              <span>All Study Tools</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Tools Hub
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/80 max-w-xl">
              Access NCERT Reader, Formula Sheet, Spaced Revision, Mistake Notebook, and Practice Tests in one place.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 text-right">
              <div className="text-2xl font-black font-mono text-purple-300">
                {ALL_TOOLS.length}
              </div>
              <div className="text-[10px] uppercase font-bold text-purple-200/70">Tools Available</div>
            </div>
          </div>
        </div>

        {/* Universal Smart Search Bar */}
        <div className="relative z-10 max-w-xl">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Universal Search (e.g., Electrochemistry, Formula, NCERT, Notes, Mock, Derivations)..."
              className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white/10 border border-white/15 text-white placeholder-purple-300/60 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-purple-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          2. RECENTLY USED & PINNED FEATURES (Visible if not searching)
          ======================================================== */}
      {!searchQuery && activeCategory === 'All' && (
        <div className="space-y-6">
          {/* Pinned Features Section */}
          {pinnedTools.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Pin className="w-4 h-4 text-purple-600 rotate-45" />
                <h2 className="text-sm font-bold text-foreground">Pinned & Favorite Tools</h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {pinnedTools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Card
                      key={`pinned-${tool.id}`}
                      onClick={() => handleToolClick(tool)}
                      className="p-3.5 bg-card border-border rounded-xl hover:border-purple-500/50 hover:shadow-md transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className={`w-8 h-8 rounded-xl ${tool.iconBg} flex items-center justify-center shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <button
                          onClick={(e) => togglePin(e, tool.id)}
                          className="min-w-[44px] min-h-[44px] lg:min-w-0 lg:min-h-0 -m-2 lg:m-0 p-2 lg:p-1 flex items-center justify-center text-amber-500 hover:scale-110 transition-transform cursor-pointer rounded-xl"
                          title="Unpin tool"
                        >
                          <Star className="w-4 h-4 lg:w-3.5 lg:h-3.5 fill-amber-400" />
                        </button>
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2 leading-snug break-words">
                          {tool.name}
                        </h3>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{tool.category}</p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recently Used Section */}
          {recentlyUsedTools.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-foreground">Recently Used</h2>
              </div>

              <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
                {recentlyUsedTools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={`recent-${tool.id}`}
                      onClick={() => handleToolClick(tool)}
                      className="p-3 rounded-2xl bg-card border border-slate-200/80 dark:border-white/10 hover:border-purple-500/50 hover:shadow-xs transition-all cursor-pointer flex items-center gap-2.5 shrink-0"
                    >
                      <div className={`w-7 h-7 rounded-lg ${tool.iconBg} flex items-center justify-center shrink-0`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold text-foreground block whitespace-nowrap">
                          {tool.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          3. CATEGORY QUICK FILTERS
          ======================================================== */}
      <div
        ref={categoryTabsRef}
        onScroll={updateCategoryFade}
        className="flex items-center gap-2 overflow-x-auto flex-nowrap snap-x snap-mandatory pb-1 scrollbar-none scroll-edge-fade min-w-0"
      >
        {categories.map((cat) => (
          <button
            key={cat}
            data-active={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap snap-start min-h-[44px] lg:min-h-0 border ${
                activeCategory === cat
                ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20'
                : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {cat === 'Favorites' ? '⭐ Favorites' : cat}
          </button>
        ))}
      </div>

      {/* ========================================================
          4. MAIN TOOLS GRID (Responsive 1-col Phone, 2-col Tablet, 3-4 col Desktop)
          ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {filteredTools.map((tool) => {
          const Icon = tool.icon;
          const isPinned = pinnedToolIds.includes(tool.id);

          return (
            <Card
              key={tool.id}
              onClick={() => handleToolClick(tool)}
              className="p-5 bg-card border-border text-card-foreground rounded-2xl shadow-xs hover:border-purple-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className={`w-11 h-11 rounded-2xl ${tool.iconBg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {tool.badge && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border whitespace-nowrap shrink-0">
                        {tool.badge}
                      </span>
                    )}
                    <button
                      onClick={(e) => togglePin(e, tool.id)}
                      className="min-w-[44px] min-h-[44px] lg:min-w-0 lg:min-h-0 -mr-2 lg:mr-0 p-2.5 lg:p-1.5 flex items-center justify-center rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title={isPinned ? 'Unpin tool' : 'Pin tool to top'}
                    >
                      <Star className={`w-4 h-4 lg:w-3.5 lg:h-3.5 ${isPinned ? 'fill-amber-400 text-amber-500' : 'opacity-40 hover:opacity-100'}`} />
                    </button>
                  </div>
                </div>

                <div className="min-w-0">
                  <h3 className="text-base font-bold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors flex items-center gap-1.5 leading-snug break-words">
                    <span>{tool.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-purple-600" />
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                    {tool.tagline}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-muted-foreground">
                  {tool.stat || tool.category}
                </span>
                <span className="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1 group-hover:underline">
                  <span>Open Tool</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredTools.length === 0 && (
        <Card className="p-12 text-center bg-card rounded-2xl border-dashed border-border space-y-3">
          <Search className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
          <h4 className="text-sm font-bold text-foreground">No matching tools found</h4>
          <p className="text-xs text-muted-foreground">
            Try searching for another keyword like "NCERT", "Formula", "Notes", "Mock", or "Doubt".
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setActiveCategory('All');
              setSearchQuery('');
            }}
            className="rounded-xl text-xs font-bold"
          >
            Clear Search & Filters
          </Button>
        </Card>
      )}

    </div>
  );
};
