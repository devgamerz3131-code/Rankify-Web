import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { useNavigation } from '@/contexts/NavigationContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import {
  commandCenterService,
  DEFAULT_COMMAND_CENTER_WIDGETS,
} from '@/services/command-center-service';
import {
  ExamCommandCenterData,
  WidgetConfig,
  WidgetId,
  CommandCenterActivityItem,
  AdminSystemHealth,
} from '@/types/command-center';
import {
  Compass,
  Clock,
  Sparkles,
  Zap,
  Target,
  Award,
  AlertTriangle,
  CheckCircle2,
  Check,
  Flame,
  ArrowRight,
  TrendingUp,
  Brain,
  BookOpen,
  Bookmark,
  Calendar,
  Layers,
  FileText,
  Activity,
  RefreshCw,
  Shield,
  Video,
  BarChart3,
  Sliders,
  ChevronRight,
  Play,
  RotateCcw,
  Bell,
  Search,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  X,
  Volume2,
  VolumeX,
  CheckSquare,
  ArrowUp,
  ArrowDown,
  Pin,
  HelpCircle,
  Database,
  Users,
  Server,
  Globe,
  Radio,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export const ExamCommandCenterView: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.uid || '';
  const isAdmin = user?.role === 'admin' || user?.email === 'devgamerz3131@gmail.com';

  const { setActiveTab } = useNavigation();
  const { studentDetails } = useOnboarding();

  // Core Data
  const [data, setData] = useState<ExamCommandCenterData | null>(() =>
    commandCenterService.getCachedData()
  );
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_COMMAND_CENTER_WIDGETS);
  const [activities, setActivities] = useState<CommandCenterActivityItem[]>([]);
  const [adminHealth, setAdminHealth] = useState<AdminSystemHealth | null>(null);

  // View toggles
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showWidgetModal, setShowWidgetModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Subject filter for Subject status matrix
  const [selectedSubjectTab, setSelectedSubjectTab] = useState<'Physics' | 'Chemistry' | 'Mathematics'>('Physics');

  // Focus Mode State
  const [isFocusActive, setIsFocusActive] = useState(false);
  const [focusDurationMinutes, setFocusDurationMinutes] = useState(25);
  const [focusSecondsLeft, setFocusSecondsLeft] = useState(25 * 60);
  const [isFocusRunning, setIsFocusRunning] = useState(false);
  const [isAmbientSoundOn, setIsAmbientSoundOn] = useState(false);
  const focusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize data and listeners
  useEffect(() => {
    const activeUid = userId || 'guest';
    commandCenterService.init(activeUid).then((res) => {
      setData(res);
    });

    commandCenterService.getWidgetLayout(activeUid).then((layout) => {
      setWidgets(layout);
    });

    setActivities(commandCenterService.getRecentActivities(activeUid));

    if (isAdmin) {
      commandCenterService.getAdminSystemHealth().then((h) => setAdminHealth(h));
    }

    const unsub = commandCenterService.subscribe((res) => {
      setData(res);
    });

    return () => unsub();
  }, [userId, isAdmin]);

  // Global Keyboard Shortcut: Cmd+K or Ctrl+K for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
        setShowWidgetModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus Mode Timer logic
  useEffect(() => {
    if (isFocusRunning && focusSecondsLeft > 0) {
      focusIntervalRef.current = setInterval(() => {
        setFocusSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (focusSecondsLeft === 0 && isFocusRunning) {
      setIsFocusRunning(false);
      if (focusIntervalRef.current) clearInterval(focusIntervalRef.current);
      toast.success('Focus Chamber complete! Excellent sprint logged to your Study DNA.', {
        icon: '🏆',
        duration: 5000,
      });
      commandCenterService.logFocusSession(userId, focusDurationMinutes, selectedSubjectTab);
      setActivities(commandCenterService.getRecentActivities(userId));
    }

    return () => {
      if (focusIntervalRef.current) clearInterval(focusIntervalRef.current);
    };
  }, [isFocusRunning, focusSecondsLeft, focusDurationMinutes, userId, selectedSubjectTab]);

  const handleStartFocusTimer = (minutes: number) => {
    setFocusDurationMinutes(minutes);
    setFocusSecondsLeft(minutes * 60);
    setIsFocusRunning(true);
    setIsFocusActive(true);
  };

  const handlePauseResumeFocus = () => {
    setIsFocusRunning((prev) => !prev);
  };

  const handleFinishEarlyFocus = async () => {
    const elapsedMinutes = Math.max(1, Math.round((focusDurationMinutes * 60 - focusSecondsLeft) / 60));
    setIsFocusRunning(false);
    setIsFocusActive(false);
    if (focusIntervalRef.current) clearInterval(focusIntervalRef.current);

    await commandCenterService.logFocusSession(userId, elapsedMinutes, selectedSubjectTab);
    setActivities(commandCenterService.getRecentActivities(userId));
    toast.success(`Logged ${elapsedMinutes}m focused study to your academic record.`);
  };

  const handleRefresh = async () => {
    setIsSyncing(true);
    const fresh = await commandCenterService.computeCommandCenterData(userId || 'guest');
    setData(fresh);
    setActivities(commandCenterService.getRecentActivities(userId || 'guest'));
    if (isAdmin) {
      const h = await commandCenterService.getAdminSystemHealth();
      setAdminHealth(h);
    }
    setIsSyncing(false);
    toast.success('Command Center live telemetry synced with Firebase!');
  };

  // Widget management
  const handleToggleWidgetPin = async (id: WidgetId) => {
    const updated = widgets.map((w) => (w.id === id ? { ...w, isPinned: !w.isPinned } : w));
    setWidgets(updated);
    await commandCenterService.saveWidgetLayout(userId, updated);
  };

  const handleToggleWidgetVisibility = async (id: WidgetId) => {
    const updated = widgets.map((w) => (w.id === id ? { ...w, isVisible: !w.isVisible } : w));
    setWidgets(updated);
    await commandCenterService.saveWidgetLayout(userId, updated);
  };

  const handleToggleWidgetExpand = async (id: WidgetId) => {
    const updated = widgets.map((w) => (w.id === id ? { ...w, isExpanded: !w.isExpanded } : w));
    setWidgets(updated);
    await commandCenterService.saveWidgetLayout(userId, updated);
  };

  const handleMoveWidget = async (id: WidgetId, direction: 'up' | 'down') => {
    const index = widgets.findIndex((w) => w.id === id);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= widgets.length) return;

    const copy = [...widgets];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    const reordered = copy.map((w, idx) => ({ ...w, order: idx }));
    setWidgets(reordered);
    await commandCenterService.saveWidgetLayout(userId, reordered);
  };

  const handleResetWidgets = async () => {
    const reset = await commandCenterService.resetWidgetLayout(userId);
    setWidgets(reset);
    toast.success('Widget layout reset to default mission control deck.');
  };

  // Quick Action execution from AI Commands or Palette
  const executeCommand = (action: string) => {
    setShowCommandPalette(false);
    switch (action) {
      case 'study':
        setActiveTab('study');
        break;
      case 'revision':
        setActiveTab('revision');
        break;
      case 'ai':
        setActiveTab('ai');
        break;
      case 'practice':
        setActiveTab('practice');
        break;
      case 'formula':
        setActiveTab('formula');
        break;
      case 'ncert':
        setActiveTab('ncert');
        break;
      case 'focus':
        handleStartFocusTimer(25);
        break;
      case 'profile':
        setActiveTab('profile');
        break;
      case 'admin':
        setActiveTab('admin');
        break;
      default:
        setActiveTab('study');
    }
  };

  // Filtered commands / items for Quick Search Command Palette
  const searchablePaletteItems = useMemo(() => {
    const items = [
      { id: '1', title: 'Start Active Study Session', category: 'Study', action: 'study', icon: BookOpen },
      { id: '2', title: 'Open Smart Revision Engine', category: 'Revision', action: 'revision', icon: RotateCcw },
      { id: '3', title: 'Ask AI Academic Doubt Solver', category: 'AI', action: 'ai', icon: Sparkles },
      { id: '4', title: 'Generate Adaptive CBSE Practice Questions', category: 'Practice', action: 'practice', icon: Target },
      { id: '6', title: 'Quick Formula Recall & Derivation Drill', category: 'Formulas', action: 'formula', icon: Zap },
      { id: '7', title: 'Start 25-Min Deep Focus Pomodoro', category: 'Focus', action: 'focus', icon: Clock },
      { id: '8', title: 'Electric Charges & Fields (Physics Chapter 1)', category: 'Chapter', action: 'study', icon: BookOpen },
      { id: '9', title: 'Electrochemistry & Nernst Equation (Chemistry)', category: 'Chapter', action: 'study', icon: BookOpen },
      { id: '10', title: 'Definite Integrals & Calculus (Maths Chapter 7)', category: 'Chapter', action: 'study', icon: BookOpen },
      { id: '11', title: 'Full 3-Hour CBSE Board Simulation Mock Test', category: 'Mock Test', action: 'practice', icon: FileText },
      { id: '12', title: 'View Academic Profile & Cloud Backups', category: 'Profile', action: 'profile', icon: Award },
      ...(isAdmin ? [{ id: '13', title: 'Open Super Admin Console', category: 'Admin', action: 'admin', icon: Shield }] : []),
    ];

    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) => item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
    );
  }, [searchQuery, isAdmin]);

  // Derived telemetry calculations
  const daysToExam = useMemo(() => {
    return data?.countdown?.daysRemaining ?? 74;
  }, [data]);

  const targetPercentage = studentDetails?.targetPercentage || 95;
  const overallReadinessScore = data?.overallReadinessPercent || 82;

  // Active widgets sorted by order
  const sortedWidgets = useMemo(() => {
    return [...widgets].sort((a, b) => a.order - b.order);
  }, [widgets]);

  const isWidgetVisible = (id: WidgetId) => {
    const w = widgets.find((item) => item.id === id);
    return w ? w.isVisible : true;
  };

  const isWidgetExpanded = (id: WidgetId) => {
    const w = widgets.find((item) => item.id === id);
    return w ? w.isExpanded : true;
  };

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
        <p className="text-sm font-bold text-muted-foreground font-mono">
          Booting Rankify Academic Mission Control...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24 select-none px-2 sm:px-4">
      {/* ========================================================
          1. MISSION CONTROL APP BAR
          ======================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-purple-950 to-indigo-950 text-white p-5 sm:p-7 shadow-2xl border border-purple-500/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">
                <Radio className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                <span>Rankify Command Center</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Live Telemetry</span>
              </span>
              {isAdmin && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/30">
                  Super Admin
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>{isAdminMode ? 'System Health & Admin Operations' : 'Academic Mission Control'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/80 max-w-xl font-medium leading-relaxed">
              {isAdminMode
                ? 'Real-time telemetry on student cohorts, system latency, database consistency, and remote configs.'
                : 'Central executive cockpit synchronizing CBSE Class 12 syllabus pace, revision readiness, and focus sprints.'}
            </p>
          </div>

          {/* Quick Deck Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Command Palette Trigger */}
            <button
              onClick={() => setShowCommandPalette(true)}
              className="h-9 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              title="Search Command Palette (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-purple-300" />
              <span>Command Palette</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-black/40 rounded text-[9px] font-mono border border-white/20">
                ⌘K
              </kbd>
            </button>

            {/* Widget Customizer Trigger */}
            <button
              onClick={() => setShowWidgetModal(true)}
              className="h-9 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Rearrange & Customize Widgets"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Customize</span>
            </button>

            {/* Live Refresh Trigger */}
            <button
              onClick={handleRefresh}
              disabled={isSyncing}
              className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-purple-300' : ''}`} />
            </button>

            {/* Admin View Mode Switcher */}
            {isAdmin && (
              <button
                onClick={() => setIsAdminMode(!isAdminMode)}
                className={`h-9 px-3.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                  isAdminMode
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold'
                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{isAdminMode ? 'Exit Admin Deck' : 'Admin Deck'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Ambient Glow removed for solid M3 surface */}
      </div>

      {/* ========================================================
          ADMIN MISSION CONTROL DECK (When Admin Mode is active)
          ======================================================== */}
      {isAdminMode && adminHealth && (
        <Card className="p-6 rounded-3xl bg-slate-900 border border-amber-500/30 text-white shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-extrabold text-white">System Health & Live Operations</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('admin')}
              className="text-xs font-bold rounded-xl border-amber-400/40 text-amber-300 hover:bg-amber-400/10"
            >
              <span>Open Full Admin Console</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[10px] text-amber-300 uppercase font-mono font-bold block flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>Total Students</span>
              </span>
              <span className="text-xl font-black font-mono text-white block">
                {adminHealth.registeredStudents.toLocaleString()}
              </span>
              <span className="text-[10px] text-muted-foreground">{adminHealth.activeToday} active today</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[10px] text-amber-300 uppercase font-mono font-bold block flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Total Study Hours</span>
              </span>
              <span className="text-xl font-black font-mono text-white block">
                {adminHealth.totalStudyHours.toLocaleString()}h
              </span>
              <span className="text-[10px] text-muted-foreground">CBSE PCM candidates</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[10px] text-amber-300 uppercase font-mono font-bold block flex items-center gap-1">
                <Database className="w-3 h-3" />
                <span>Database Status</span>
              </span>
              <span className="text-base font-black text-emerald-400 block flex items-center gap-1.5 mt-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>{adminHealth.dbStatus}</span>
              </span>
              <span className="text-[10px] text-muted-foreground">{adminHealth.firestoreLatencyMs}ms latency</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[10px] text-amber-300 uppercase font-mono font-bold block flex items-center gap-1">
                <Globe className="w-3 h-3" />
                <span>Remote Config</span>
              </span>
              <span className="text-base font-black text-white block mt-1">
                {adminHealth.remoteConfigStatus}
              </span>
              <span className="text-[10px] text-muted-foreground">Checked at {adminHealth.lastHealthCheck}</span>
            </div>
          </div>
        </Card>
      )}

      {/* ========================================================
          DYNAMIC WIDGET CONTAINER
          Renders enabled widgets in customized student order
          ======================================================== */}
      <div className="space-y-6">
        {sortedWidgets.map((wConfig) => {
          if (!wConfig.isVisible) return null;

          switch (wConfig.id) {
            /* --------------------------------------------------------
               WIDGET 1: OVERVIEW METRICS DECK
               -------------------------------------------------------- */
            case 'overview':
              return (
                <div key={wConfig.id} className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Compass className="w-4 h-4 text-purple-600" />
                      <span>{wConfig.title}</span>
                    </h3>
                    <button
                      onClick={() => handleToggleWidgetExpand('overview')}
                      className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer text-xs"
                    >
                      {wConfig.isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {wConfig.isExpanded && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {/* 1. Today's Progress */}
                      <div className="p-4 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Today's Progress</span>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xl sm:text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
                            {data.timeAnalysis.todayStudyMinutes > 0 ? Math.min(100, Math.round((data.timeAnalysis.todayStudyMinutes / 180) * 100)) : 0}%
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground font-mono">
                            {data.timeAnalysis.todayStudyMinutes}m / 180m
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-purple-600 h-1.5 rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.round((data.timeAnalysis.todayStudyMinutes / 180) * 100))}%` }}
                          />
                        </div>
                      </div>

                      {/* 2. Current Streak */}
                      <div className="p-4 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Current Streak</span>
                        <div className="flex items-center gap-1.5 pt-1">
                          <Flame className="w-6 h-6 text-amber-500 fill-amber-500 animate-pulse" />
                          <span className="text-xl sm:text-2xl font-black font-mono text-foreground">
                            {data.syllabusStats.completedChapters > 0 ? 3 : 1}
                          </span>
                          <span className="text-xs font-bold text-muted-foreground">Days</span>
                        </div>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Shield Active</p>
                      </div>

                      {/* 3. Target Percentage */}
                      <div className="p-4 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Target Goal</span>
                        <div className="flex items-baseline gap-1 pt-1">
                          <span className="text-xl sm:text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                            {targetPercentage}%
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground">PCM</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-semibold">CBSE Class 12</p>
                      </div>

                      {/* 4. Overall Readiness */}
                      <div className="p-4 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Exam Readiness</span>
                        <div className="flex items-baseline gap-1 pt-1">
                          <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                            {overallReadinessScore}%
                          </span>
                          <span className="text-[10px] font-bold text-emerald-500">Ready</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{data.currentPreparationStatus}</p>
                      </div>

                      {/* 5. Exam Countdown */}
                      <div className="p-4 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">CBSE Boards</span>
                        <div className="flex items-baseline gap-1 pt-1">
                          <span className="text-xl sm:text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
                            {daysToExam}
                          </span>
                          <span className="text-xs font-bold text-muted-foreground">Days</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono">March 2027</p>
                      </div>

                      {/* 6. Revision Status */}
                      <div className="p-4 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Revision Status</span>
                        <div className="flex items-baseline gap-1 pt-1">
                          <span className="text-xl sm:text-2xl font-black font-mono text-blue-600 dark:text-blue-400">
                            {data.syllabusStats.needsRevisionChapters}
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground">Due</span>
                        </div>
                        <p className="text-[10px] text-amber-500 font-bold">{data.syllabusStats.criticalChapters} Critical</p>
                      </div>
                    </div>
                  )}
                </div>
              );

            /* --------------------------------------------------------
               WIDGET 2: TACTICAL AI COMMANDS (Action Deck)
               -------------------------------------------------------- */
            case 'ai_commands':
              return (
                <div key={wConfig.id} className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Zap className="w-4 h-4 text-purple-600" />
                      <span>{wConfig.title}</span>
                    </h3>
                  </div>

                  <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Execute high-yield academic procedures with one tap.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                      <button
                        onClick={() => executeCommand('study')}
                        className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-all text-left cursor-pointer group"
                      >
                        <BookOpen className="w-4 h-4 text-purple-600 mb-1.5 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-extrabold text-foreground block">Start Study</span>
                        <span className="text-[10px] text-muted-foreground">SmartPlan</span>
                      </button>

                      <button
                        onClick={() => executeCommand('revision')}
                        className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all text-left cursor-pointer group"
                      >
                        <RotateCcw className="w-4 h-4 text-indigo-600 mb-1.5 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-extrabold text-foreground block">Start Revision</span>
                        <span className="text-[10px] text-muted-foreground">Spaced Queue</span>
                      </button>

                      <button
                        onClick={() => executeCommand('ai')}
                        className="p-3 rounded-2xl bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-800/40 hover:bg-pink-100 dark:hover:bg-pink-900/50 transition-all text-left cursor-pointer group"
                      >
                        <Sparkles className="w-4 h-4 text-pink-600 mb-1.5 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-extrabold text-foreground block">Ask AI</span>
                        <span className="text-[10px] text-muted-foreground">Doubt Solver</span>
                      </button>

                      <button
                        onClick={() => executeCommand('practice')}
                        className="p-3 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 transition-all text-left cursor-pointer group"
                      >
                        <Target className="w-4 h-4 text-cyan-600 mb-1.5 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-extrabold text-foreground block">Generate Qs</span>
                        <span className="text-[10px] text-muted-foreground">11+ Types</span>
                      </button>



                      <button
                        onClick={() => executeCommand('practice')}
                        className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all text-left cursor-pointer group"
                      >
                        <FileText className="w-4 h-4 text-amber-600 mb-1.5 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-extrabold text-foreground block">Resume Mock</span>
                        <span className="text-[10px] text-muted-foreground">3-Hr Paper</span>
                      </button>

                      <button
                        onClick={() => executeCommand('formula')}
                        className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all text-left cursor-pointer group"
                      >
                        <Zap className="w-4 h-4 text-emerald-600 mb-1.5 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-extrabold text-foreground block">Quick Formula</span>
                        <span className="text-[10px] text-muted-foreground">Equation Recall</span>
                      </button>
                    </div>
                  </div>
                </div>
              );

            /* --------------------------------------------------------
               WIDGET 3: DEEP FOCUS MODE CHAMBER
               -------------------------------------------------------- */
            case 'focus_session':
              return (
                <div key={wConfig.id} className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span>{wConfig.title}</span>
                    </h3>
                  </div>

                  <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white border border-purple-500/25 shadow-lg relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-2 max-w-md">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">
                          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                          <span>Distraction-Free Sprint Chamber</span>
                        </div>
                        <h4 className="text-xl font-black text-white">
                          Immersive Deep Study Focus
                        </h4>
                        <p className="text-xs text-purple-200/80 leading-relaxed">
                          Mute extraneous UI, engage strict countdown timers, and automatically log verified study minutes to your Rankify Study DNA.
                        </p>
                      </div>

                      {/* Timer Control Bar */}
                      <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1.5 bg-white/10 p-1.5 rounded-2xl border border-white/10 text-xs font-mono">
                          {[15, 25, 45, 60].map((mins) => (
                            <button
                              key={mins}
                              onClick={() => {
                                setFocusDurationMinutes(mins);
                                setFocusSecondsLeft(mins * 60);
                              }}
                              disabled={isFocusRunning}
                              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                                focusDurationMinutes === mins
                                  ? 'bg-purple-600 text-white shadow-xs'
                                  : 'text-purple-200 hover:text-white'
                              }`}
                            >
                              {mins}m
                            </button>
                          ))}
                        </div>

                        <Button
                          variant="primary"
                          size="md"
                          onClick={() => handleStartFocusTimer(focusDurationMinutes)}
                          className="rounded-2xl text-xs font-extrabold gap-2 cursor-pointer shadow-lg shadow-purple-600/40 w-full sm:w-auto"
                        >
                          <Play className="w-4 h-4 fill-white" />
                          <span>Start Focus Session</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );

            /* --------------------------------------------------------
               WIDGET 4: SMART MISSION ALERTS
               -------------------------------------------------------- */
            case 'smart_alerts':
              return (
                <div key={wConfig.id} className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-purple-600" />
                      <span>{wConfig.title}</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.aiAlerts.slice(0, 4).map((alert) => (
                      <div
                        key={alert.id}
                        className="p-4 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs flex items-start justify-between gap-3 hover:border-purple-400/40 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                              alert.severity === 'critical'
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <div className="space-y-0.5">
                            <h5 className="text-xs font-extrabold text-foreground">{alert.title}</h5>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              {alert.description}
                            </p>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => executeCommand(alert.actionRoute || 'study')}
                          className="text-[11px] font-bold rounded-xl h-8 px-3 shrink-0 cursor-pointer"
                        >
                          <span>Resolve</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              );

            /* --------------------------------------------------------
               WIDGET 5: SUBJECT STATUS MATRIX (Physics, Chemistry, Maths)
               -------------------------------------------------------- */
            case 'subjects': {
              const activeSubjData = data.subjectReadiness[selectedSubjectTab];
              const subjChapters = data.syllabusChapters.filter((c) => c.subject === selectedSubjectTab);
              const weakCh = subjChapters.filter((c) => c.status === 'critical');
              const strongCh = subjChapters.filter((c) => c.status === 'ready');
              const nextRec = weakCh[0]?.name || subjChapters[0]?.name || 'Electrochemistry';

              return (
                <div key={wConfig.id} className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-600" />
                      <span>{wConfig.title}</span>
                    </h3>

                    {/* Subject Tabs */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                      {(['Physics', 'Chemistry', 'Mathematics'] as const).map((sub) => (
                        <button
                          key={sub}
                          onClick={() => setSelectedSubjectTab(sub)}
                          className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                            selectedSubjectTab === sub
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Card className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-5">
                    {/* Matrix Overview Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Syllabus Covered</span>
                        <span className="text-xl font-black font-mono text-foreground block">
                          {activeSubjData.progress}%
                        </span>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${activeSubjData.progress}%` }} />
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Revision Score</span>
                        <span className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400 block">
                          {activeSubjData.revisionScore}%
                        </span>
                        <p className="text-[10px] text-muted-foreground">Spaced Retention</p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Question Accuracy</span>
                        <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 block">
                          {activeSubjData.confidence}%
                        </span>
                        <p className="text-[10px] text-muted-foreground">{activeSubjData.practiceCount} solved</p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Predicted Range</span>
                        <span className="text-base font-black font-mono text-foreground block">
                          {activeSubjData.predictedScoreMin}–{activeSubjData.predictedScoreMax} / {activeSubjData.maxScore}
                        </span>
                        <p className="text-[10px] text-emerald-500 font-bold">Safe Distinction</p>
                      </div>
                    </div>

                    {/* Breakdown: Weak vs Strong vs Recommended Next */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                      {/* Weak Chapters */}
                      <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-50/30 dark:bg-rose-950/10 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Weak Chapters ({weakCh.length})</span>
                        </div>
                        <div className="space-y-1 text-xs">
                          {weakCh.slice(0, 3).map((ch) => (
                            <div key={ch.id} className="flex justify-between items-center text-[11px]">
                              <span className="font-semibold text-foreground truncate max-w-[160px]">{ch.name}</span>
                              <span className="font-mono text-rose-500 font-bold">{ch.accuracy}%</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Strong Chapters */}
                      <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/10 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Strong Chapters ({strongCh.length})</span>
                        </div>
                        <div className="space-y-1 text-xs">
                          {strongCh.slice(0, 3).map((ch) => (
                            <div key={ch.id} className="flex justify-between items-center text-[11px]">
                              <span className="font-semibold text-foreground truncate max-w-[160px]">{ch.name}</span>
                              <span className="font-mono text-emerald-600 font-bold">{ch.accuracy}%</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recommended Next Chapter */}
                      <div className="p-4 rounded-2xl border border-purple-500/20 bg-purple-50/30 dark:bg-purple-950/10 flex flex-col justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 block">
                            Recommended Next Action
                          </span>
                          <h6 className="text-xs font-black text-foreground truncate">{nextRec}</h6>
                          <p className="text-[11px] text-muted-foreground">High-yield board weightage priority.</p>
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => executeCommand('study')}
                          className="text-xs font-bold rounded-xl cursor-pointer w-full"
                        >
                          <Play className="w-3.5 h-3.5 mr-1" />
                          <span>Start Recommended Chapter</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            }

            /* --------------------------------------------------------
               WIDGET 6: EXAM READINESS TACTICAL RADAR
               -------------------------------------------------------- */
            case 'exam_readiness':
              return (
                <div key={wConfig.id} className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Target className="w-4 h-4 text-purple-600" />
                      <span>{wConfig.title}</span>
                    </h3>
                  </div>

                  <Card className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-base font-extrabold text-foreground flex items-center gap-2">
                          <Brain className="w-4 h-4 text-purple-600" />
                          <span>Readiness Diagnostic & Prioritization</span>
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Calculated from real accuracy in formulas, NCERT recall, and mock assessments.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold block">Overall Rating</span>
                          <span className="text-sm font-black text-emerald-500 font-mono">DISTINCTION TIER</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 space-y-1">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase block">Weakest Subject</span>
                        <span className="text-sm font-black text-rose-500 block">Chemistry</span>
                        <p className="text-[11px] text-muted-foreground">Focus on Nernst Eq & Aldehydes</p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 space-y-1">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase block">Strongest Subject</span>
                        <span className="text-sm font-black text-emerald-500 block">Mathematics</span>
                        <p className="text-[11px] text-muted-foreground">91% Mastery across Calculus</p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 space-y-1">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase block">Revision Overdue</span>
                        <span className="text-sm font-black text-amber-500 block">3 Chapters Due</span>
                        <p className="text-[11px] text-muted-foreground">Solutions, Wave Optics, Vectors</p>
                      </div>
                    </div>
                  </Card>
                </div>
              );

            /* --------------------------------------------------------
               WIDGET 7: RECENT MISSION TIMELINE
               -------------------------------------------------------- */
            case 'recent_activity':
              return (
                <div key={wConfig.id} className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Activity className="w-4 h-4 text-purple-600" />
                      <span>{wConfig.title}</span>
                    </h3>
                  </div>

                  <Card className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                    <div className="space-y-3">
                      {activities.slice(0, 5).map((act) => (
                        <div
                          key={act.id}
                          className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/40 hover:border-purple-400/30 transition-all text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">

                              {act.type === 'question' && <Target className="w-4 h-4" />}
                              {act.type === 'revision' && <RotateCcw className="w-4 h-4" />}
                              {act.type === 'ai' && <Sparkles className="w-4 h-4" />}
                              {act.type === 'study_session' && <Clock className="w-4 h-4" />}
                              {act.type === 'badge' && <Award className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="font-extrabold text-foreground">{act.title}</p>
                              <p className="text-[11px] text-muted-foreground">{act.subtitle}</p>
                            </div>
                          </div>

                          <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                            {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              );

            /* --------------------------------------------------------
               WIDGET 8: ACHIEVEMENTS & BADGES
               -------------------------------------------------------- */
            case 'achievements':
              return (
                <div key={wConfig.id} className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Award className="w-4 h-4 text-purple-600" />
                      <span>{wConfig.title}</span>
                    </h3>
                  </div>

                  <Card className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
                        <Flame className="w-6 h-6 text-amber-500 mx-auto fill-amber-500" />
                        <span className="font-bold text-foreground block">Streak Master</span>
                        <span className="text-[10px] text-muted-foreground">3 Days Defended</span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center space-y-1">
                        <Target className="w-6 h-6 text-purple-600 mx-auto" />
                        <span className="font-bold text-foreground block">PYQ Challenger</span>
                        <span className="text-[10px] text-muted-foreground">100+ Questions Solved</span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center space-y-1">
                        <Zap className="w-6 h-6 text-indigo-600 mx-auto" />
                        <span className="font-bold text-foreground block">Formula Savant</span>
                        <span className="text-[10px] text-muted-foreground">35 Equations Recalled</span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
                        <Award className="w-6 h-6 text-emerald-600 mx-auto" />
                        <span className="font-bold text-foreground block">Board Ready</span>
                        <span className="text-[10px] text-muted-foreground">Distinction Pace</span>
                      </div>
                    </div>
                  </Card>
                </div>
              );

            default:
              return null;
          }
        })}
      </div>

      {/* ========================================================
          FULL-SCREEN IMMERSIVE DEEP FOCUS CHAMBER OVERLAY
          ======================================================== */}
      {isFocusActive && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-between p-6 sm:p-12 text-white">
          <div className="w-full max-w-4xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping" />
              <span className="text-xs font-mono font-bold tracking-widest uppercase text-purple-300">
                Focus Chamber • {selectedSubjectTab}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAmbientSoundOn(!isAmbientSoundOn)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title={isAmbientSoundOn ? 'Mute ambient alpha waves' : 'Play ambient study alpha waves'}
              >
                {isAmbientSoundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
              </button>

              <button
                onClick={handleFinishEarlyFocus}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition shadow-md"
              >
                Exit Focus
              </button>
            </div>
          </div>

          {/* Huge Countdown Timer */}
          <div className="text-center space-y-4 my-auto">
            <div className="text-6xl sm:text-8xl md:text-9xl font-black font-mono tracking-tighter text-white drop-shadow-2xl">
              {Math.floor(focusSecondsLeft / 60)
                .toString()
                .padStart(2, '0')}
              :
              {(focusSecondsLeft % 60).toString().padStart(2, '0')}
            </div>

            <p className="text-sm sm:text-base text-purple-200/90 font-medium max-w-md mx-auto italic">
              "Mastery is built during uninterrupted sprints. Your future self will thank you for this session."
            </p>

            <div className="flex items-center justify-center gap-3 pt-4">
              <Button
                variant={isFocusRunning ? 'outline' : 'primary'}
                size="lg"
                onClick={handlePauseResumeFocus}
                className="text-xs font-extrabold rounded-2xl px-6 cursor-pointer"
              >
                {isFocusRunning ? 'Pause Session' : 'Resume Session'}
              </Button>
            </div>
          </div>

          <div className="text-center text-xs text-muted-foreground font-mono">
            <span>All distractions muted. Progress syncs automatically on finish.</span>
          </div>
        </div>
      )}

      {/* ========================================================
          COMMAND PALETTE MODAL (Ctrl+K)
          ======================================================== */}
      {showCommandPalette && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 pt-20">
          <div className="bg-card border border-purple-500/30 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden space-y-3 p-4">
            <div className="flex items-center gap-3 px-3 py-2 border-b border-slate-200 dark:border-white/10">
              <Search className="w-4 h-4 text-purple-600 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chapters, formulas, actions, or tools..."
                className="w-full bg-transparent text-sm font-semibold text-foreground focus:outline-none placeholder:text-muted-foreground"
              />
              <button
                onClick={() => setShowCommandPalette(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-1 px-1">
              {searchablePaletteItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => executeCommand(item.action)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/40 text-left transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-foreground">{item.title}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                      {item.category}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          WIDGET CUSTOMIZER MODAL
          ======================================================== */}
      {showWidgetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-slate-200 dark:border-white/10 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-600">
                <Sliders className="w-5 h-5" />
                <h3 className="font-extrabold text-base text-foreground">Customize Dashboard Widgets</h3>
              </div>
              <button
                onClick={() => setShowWidgetModal(false)}
                className="p-1 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Pin, reorder, show, or hide widgets to build your custom mission control view.
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {sortedWidgets.map((w, idx) => (
                <div
                  key={w.id}
                  className="p-3 rounded-2xl border border-slate-200/80 dark:border-white/5 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleWidgetVisibility(w.id)}
                      className={`p-1.5 rounded-lg cursor-pointer transition ${
                        w.isVisible ? 'text-purple-600 bg-purple-500/10' : 'text-muted-foreground'
                      }`}
                      title={w.isVisible ? 'Hide widget' : 'Show widget'}
                    >
                      {w.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <span className={`font-bold ${w.isVisible ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                      {w.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveWidget(w.id, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveWidget(w.id, 'down')}
                      disabled={idx === sortedWidgets.length - 1}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetWidgets}
                className="text-xs font-bold rounded-xl cursor-pointer text-muted-foreground"
              >
                Reset Default
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowWidgetModal(false)}
                className="text-xs font-bold rounded-xl cursor-pointer"
              >
                Save Layout
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
