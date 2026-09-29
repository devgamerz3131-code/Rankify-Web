import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { useNavigation } from '@/contexts/NavigationContext';
import { revisionService } from '@/services/revision-service';
import {
  SmartRevisionEngineData,
  SmartRevisionSession,
  MemoryRetentionModel,
  RevisionPriority,
  RevisionMethod,
  SmartIntervalStep,
  RevisionCalendarDay,
} from '@/types/revision';
import {
  RotateCcw,
  Sparkles,
  Clock,
  Target,
  Award,
  AlertTriangle,
  CheckCircle2,
  Check,
  Flame,
  ArrowRight,
  Brain,
  BookOpen,
  Calendar,
  Layers,
  FileText,
  Activity,
  RefreshCw,
  Zap,
  HelpCircle,
  Play,
  TrendingUp,
  Bookmark,
  ChevronRight,
  ChevronDown,
  Info,
  Sliders,
  ExternalLink,
  Shield,
  Lightbulb,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import toast from 'react-hot-toast';

export const SmartRevisionEngineView: React.FC = () => {
  const { user } = useAuth();
  const { setActiveTab } = useNavigation();

  const [data, setData] = useState<SmartRevisionEngineData | null>(() =>
    revisionService.getCachedData()
  );
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<'All' | 'Physics' | 'Chemistry' | 'Mathematics'>('All');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<'all' | 'urgent' | 'medium_low' | 'completed'>('all');
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [activeTabSection, setActiveTabSection] = useState<'sessions' | 'memory' | 'calendar' | 'statistics'>('sessions');
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeDrillSession, setActiveDrillSession] = useState<SmartRevisionSession | null>(null);
  const [drillStep, setDrillStep] = useState<number>(0);

  useEffect(() => {
    const userId = user?.uid || 'guest';
    revisionService.init(userId).then((res) => {
      setData(res);
      if (res.todaySessions.length > 0) {
        setExpandedSessionId(res.todaySessions[0].id);
      }
    });

    const unsub = revisionService.subscribe((res) => {
      setData(res);
    });

    return () => unsub();
  }, [user?.uid]);

  const handleCompleteSession = async (sessionId: string) => {
    const updated = await revisionService.completeSession(sessionId);
    setData(updated);
    toast.success('Revision session recorded! Interval advanced & retention stabilized.', {
      icon: '🧠',
    });
  };

  const handleSkipSession = async (sessionId: string) => {
    const updated = await revisionService.skipSession(sessionId);
    setData(updated);
    toast('Session auto-rescheduled with escalated priority.', {
      icon: '⚠️',
    });
  };

  const handleRecalculate = async () => {
    setIsSyncing(true);
    const userId = user?.uid || 'guest';
    const computed = await revisionService.computeRevisionEngineData(userId);
    setData(computed);
    setIsSyncing(false);
    toast.success('Smart Revision telemetry re-synced with live student history!');
  };

  const handleStartDrill = (session: SmartRevisionSession) => {
    setActiveDrillSession(session);
    setDrillStep(1);
  };

  const handleFinishDrill = async () => {
    if (activeDrillSession) {
      await handleCompleteSession(activeDrillSession.id);
      setActiveDrillSession(null);
      setDrillStep(0);
    }
  };

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RotateCcw className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-sm font-bold text-muted-foreground font-mono">
          Initializing Smart Revision Engine...
        </p>
      </div>
    );
  }

  const { todaySessions, upcomingSessions, memoryModels, streak, stats, calendarDays, smartNotifications } = data;

  const filteredSessions = todaySessions.filter((s) => {
    if (selectedSubjectFilter !== 'All' && s.subject !== selectedSubjectFilter) return false;
    if (selectedPriorityFilter === 'urgent' && s.priority !== 'critical' && s.priority !== 'high') return false;
    if (selectedPriorityFilter === 'medium_low' && s.priority !== 'medium' && s.priority !== 'low') return false;
    if (selectedPriorityFilter === 'completed' && !s.isCompleted) return false;
    return true;
  });

  const selectedDayData = calendarDays.find((d) => d.date === selectedCalendarDate) || calendarDays[3];

  return (
    <div className="max-w-7xl mx-auto space-y-7 pb-28 select-none px-2 sm:px-4">
      {/* 1. TOP HERO BANNER: SMART REVISION ENGINE */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-amber-950/70 to-purple-950 p-6 sm:p-8 text-white shadow-2xl border border-amber-500/30">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/25 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider shadow-sm font-mono">
                <RotateCcw className="w-3.5 h-3.5 text-amber-300 animate-spin-slow" />
                <span>Smart Revision Engine</span>
              </span>

              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider font-mono border bg-purple-500/20 text-purple-300 border-purple-500/40">
                Ebbinghaus Spaced Recall
              </span>

              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[11px] font-mono">
                Never Random • Adaptive Intervals
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Zero Manual Scheduling. AI Decides What, When & How.
            </h1>

            <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed italic">
              "Continuously calculating forget-rate decay from your mistakes, mock scores, and chapter confidences to preserve maximum board retention."
            </p>

            {/* Live Highlight Alert */}
            {smartNotifications[0] && (
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5 backdrop-blur-xs">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-extrabold uppercase text-amber-300 mr-2 font-mono">Engine Directive:</span>
                  <span className="text-white">{smartNotifications[0].message}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Hero Gauges: Revision Score & Streak */}
          <div className="flex flex-row sm:flex-row items-center gap-4 w-full lg:w-auto justify-around sm:justify-end">
            {/* Revision Score Gauge */}
            <div className="p-4 rounded-3xl bg-amber-950/40 border border-amber-400/30 text-center min-w-[130px] shrink-0 backdrop-blur-md">
              <span className="text-[10px] text-amber-200 font-bold uppercase tracking-wider block">
                Today's Revision Score
              </span>
              <div className="text-3xl sm:text-4xl font-black font-mono text-amber-300 mt-1">
                {stats.todayRevisionScore}%
              </div>
              <div className="text-[11px] text-emerald-400 font-mono font-bold mt-0.5">
                +{stats.retentionImprovementPercent}% Retention
              </div>
            </div>

            {/* Streak Counter */}
            <div className="p-4 rounded-3xl bg-purple-900/40 border border-purple-400/30 text-center min-w-[130px] shrink-0 backdrop-blur-md flex flex-col items-center justify-center">
              <span className="text-[10px] text-purple-200 font-bold uppercase tracking-wider block">
                Daily Revision Streak
              </span>
              <div className="text-3xl sm:text-4xl font-black font-mono text-white mt-1 flex items-center gap-1 justify-center">
                <span>{streak.currentDailyStreak}</span>
                <Flame className="w-6 h-6 text-orange-400 fill-orange-400 animate-bounce" />
              </div>
              <span className="text-[10px] text-purple-300 font-mono mt-0.5">
                Record: {streak.longestDailyStreak} Days
              </span>
            </div>
          </div>
        </div>

        {/* Action Toolbar on Hero */}
        <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-200/80">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-mono text-[11px]">Realtime Firebase Sync Active • Continuous Behavioral Analysis</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRecalculate}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Recalculate Intervals</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION SUBTABS (Sessions, Memory Model, Calendar, Statistics) */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 overflow-x-auto scrollbar-none text-xs font-bold">
        {[
          { id: 'sessions', label: "Today's Revision Deck", icon: Target, badge: `${todaySessions.length}` },
          { id: 'memory', label: 'Memory Retention Curves', icon: Brain, badge: 'Ebbinghaus' },
          { id: 'calendar', label: 'Spaced Calendar', icon: Calendar, badge: 'Color Coded' },
          { id: 'statistics', label: 'Analytics & Streaks', icon: Activity, badge: 'Cohort' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTabSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTabSection(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-foreground shadow-sm font-black'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-500' : 'text-muted-foreground'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                    isActive ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold' : 'bg-slate-200 dark:bg-slate-800 text-muted-foreground'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: TODAY'S REVISION DECK & SESSIONS */}
      {/* ======================================================== */}
      {activeTabSection === 'sessions' && (
        <div className="space-y-5">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-muted-foreground font-mono">Filter Subjects:</span>
              {(['All', 'Physics', 'Chemistry', 'Mathematics'] as const).map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubjectFilter(sub)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedSubjectFilter === sub
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground font-mono">Priority:</span>
              <select
                value={selectedPriorityFilter}
                onChange={(e) => setSelectedPriorityFilter(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-background text-foreground font-bold"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent Only (Critical/High)</option>
                <option value="medium_low">Medium & Low</option>
                <option value="completed">Completed Today</option>
              </select>
            </div>
          </div>

          {/* Interactive Sessions List */}
          <div className="space-y-4">
            {filteredSessions.map((session) => {
              const isExpanded = expandedSessionId === session.id;
              const isCritical = session.priority === 'critical';
              const isHigh = session.priority === 'high';

              return (
                <div
                  key={session.id}
                  className={`rounded-3xl border transition-all duration-300 overflow-hidden ${
                    session.isCompleted
                      ? 'bg-emerald-500/5 border-emerald-500/30'
                      : isCritical
                      ? 'bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/40 shadow-xs'
                      : isHigh
                      ? 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/40 shadow-xs'
                      : 'bg-card border-slate-200/80 dark:border-white/10'
                  }`}
                >
                  {/* Session Header Card */}
                  <div
                    onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                    className="p-5 sm:p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none"
                  >
                    <div className="flex items-start gap-4">
                      {/* Priority Icon Badge */}
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                          session.isCompleted
                            ? 'bg-emerald-500 text-white'
                            : isCritical
                            ? 'bg-rose-500 text-white'
                            : isHigh
                            ? 'bg-amber-500 text-white'
                            : 'bg-purple-600 text-white'
                        }`}
                      >
                        {session.isCompleted ? (
                          <Check className="w-6 h-6 stroke-[3]" />
                        ) : isCritical ? (
                          <AlertTriangle className="w-6 h-6" />
                        ) : (
                          <RotateCcw className="w-6 h-6" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black uppercase tracking-wider font-mono text-muted-foreground">
                            {session.subject}
                          </span>
                          <span>•</span>
                          <span
                            className={`text-[10px] font-black uppercase font-mono px-2 py-0.5 rounded-full ${
                              session.isCompleted
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : isCritical
                                ? 'bg-rose-500/20 text-rose-600'
                                : isHigh
                                ? 'bg-amber-500/20 text-amber-600'
                                : 'bg-slate-200 dark:bg-slate-800 text-muted-foreground'
                            }`}
                          >
                            {session.priority.toUpperCase()} PRIORITY
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 font-bold font-mono">
                            {session.revisionMethod}
                          </span>
                          {session.isOverdue && !session.isCompleted && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold font-mono">
                              {session.daysOverdue}d Overdue
                            </span>
                          )}
                        </div>

                        <h3 className="text-base sm:text-lg font-black text-foreground">
                          {session.chapter}
                        </h3>

                        <p className="text-xs text-muted-foreground">
                          <strong className="text-foreground">Reason:</strong> {session.reasonForRevision}
                        </p>
                      </div>
                    </div>

                    {/* Right Session Metrics & Buttons */}
                    <div className="flex items-center gap-3 self-end md:self-center">
                      <div className="text-right hidden sm:block">
                        <div className="text-xs font-mono font-bold text-foreground">
                          ~{session.estimatedMinutes} mins
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                          +{session.expectedConfidenceGain}% Confidence
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartDrill(session);
                        }}
                        disabled={session.isCompleted}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Start Session</span>
                      </button>

                      <ChevronDown
                        className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Expanded Session Deep Dive (Why, Recommendations, Questions to Solve) */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="border-t border-slate-200/70 dark:border-white/5 p-5 sm:p-6 bg-slate-50/50 dark:bg-slate-900/40 space-y-5"
                      >
                        {/* 1. AI EXPLANATION: WHY THIS WAS CHOSEN */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-600 dark:text-amber-400 font-mono">
                            <Brain className="w-4 h-4" />
                            <span>AI Explanation: Why This Revision Was Calculated</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {session.aiExplanationWhy.map((exp, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/5 flex items-start gap-2 text-foreground"
                              >
                                <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                                <span className="leading-relaxed">{exp}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 2. REVISION TARGETS: QUESTIONS TO SOLVE & RETENTION SHIFT */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/5 space-y-1">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                              Required Practice
                            </span>
                            <div className="text-base font-black font-mono text-purple-600">
                              {session.questionsToSolve} Questions
                            </div>
                            <span className="text-[10px] text-muted-foreground">Focus: {session.questionTypeFocus}</span>
                          </div>

                          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/5 space-y-1">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                              Memory Retention Shift
                            </span>
                            <div className="text-base font-black font-mono text-foreground flex items-center gap-2">
                              <span className="text-rose-500">{session.memoryRetentionBefore}%</span>
                              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-emerald-500">{session.memoryRetentionProjected}%</span>
                            </div>
                            <span className="text-[10px] text-emerald-500 font-bold">Predictive Ebbinghaus Curve</span>
                          </div>

                          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/5 space-y-1">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                              Revision Method
                            </span>
                            <div className="text-base font-black text-amber-600 dark:text-amber-400">
                              {session.revisionMethod}
                            </div>
                            <span className="text-[10px] text-muted-foreground">Optimal cognitive format</span>
                          </div>
                        </div>

                        {/* 3. SMART RECOMMENDATIONS */}
                        <div className="space-y-2">
                          <span className="text-xs font-black uppercase text-muted-foreground font-mono block">
                            Recommended Assets & Resources:
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                            <div
                              onClick={() => setActiveTab('study')}
                              className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:border-purple-500 cursor-pointer flex items-center justify-between"
                            >
                              <div className="space-y-0.5">
                                <span className="font-bold text-foreground block">Formula Sheet</span>
                                <span className="text-[10px] text-muted-foreground line-clamp-1">{session.recommendedResources.formulaSheet}</span>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            </div>

                            <div
                              onClick={() => setActiveTab('practice')}
                              className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 hover:border-indigo-500 cursor-pointer flex items-center justify-between"
                            >
                              <div className="space-y-0.5">
                                <span className="font-bold text-foreground block">Curated PYQs</span>
                                <span className="text-[10px] text-muted-foreground line-clamp-1">{session.recommendedResources.questions}</span>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            </div>

                            <div
                              onClick={() => setActiveTab('mistakes')}
                              className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:border-rose-500 cursor-pointer flex items-center justify-between"
                            >
                              <div className="space-y-0.5">
                                <span className="font-bold text-foreground block">Mistake Notebook</span>
                                <span className="text-[10px] text-muted-foreground line-clamp-1">Review prior traps</span>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            </div>
                          </div>
                        </div>

                        {/* 4. ACTION BAR (Complete vs Auto-Reschedule) */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/60 dark:border-white/5">
                          <button
                            onClick={() => handleSkipSession(session.id)}
                            className="text-xs font-bold text-muted-foreground hover:text-rose-500 flex items-center gap-1.5 cursor-pointer"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Skip Today (Auto-Reschedule with Increased Priority)</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCompleteSession(session.id)}
                              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                                session.isCompleted
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{session.isCompleted ? 'Marked Completed' : 'Mark Completed'}</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 2: MEMORY RETENTION MODEL (EBBINGHAUS CURVE) */}
      {/* ======================================================== */}
      {activeTabSection === 'memory' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-lg text-foreground flex items-center gap-2">
                  <Brain className="w-5 h-5 text-amber-500" />
                  <span>Dynamic Ebbinghaus Memory Retention Architecture</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Retention Formula: R = 100 × e^(-λt). The decay rate λ is continuously adjusted by real mistakes, formula accuracy, and skipped sessions.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-xl border border-amber-500/20">
                <span>Adaptive Intervals: Same Day ➔ 90 Days</span>
              </div>
            </div>

            {/* Interval Step Progression Visualizer */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground font-mono block">
                Smart Interval Graduation Chain:
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5 text-center text-xs font-mono">
                {[
                  'Same Day',
                  '1 Day',
                  '3 Days',
                  '7 Days',
                  '15 Days',
                  '30 Days',
                  '45 Days',
                  '60 Days',
                  '90 Days',
                ].map((step, idx) => (
                  <div
                    key={step}
                    className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-white/5 font-bold text-foreground space-y-0.5"
                  >
                    <span className="text-[9px] text-muted-foreground block">Step {idx + 1}</span>
                    <span className="text-[11px] block">{step}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground italic pt-1">
                * If student forgets frequently or logs new mistakes, interval contracts backward. If student achieves 85%+ accuracy, interval advances.
              </p>
            </div>

            {/* Chapter Memory Retention Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {Object.values(memoryModels).map((model) => {
                const isCritical = model.status === 'critical';
                const isHigh = model.status === 'high';
                const isMastered = model.status === 'mastered';

                return (
                  <div
                    key={model.chapterId}
                    className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-white/5 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-muted-foreground font-mono">
                        {model.subject}
                      </span>
                      <span
                        className={`text-[10px] font-black font-mono px-2 py-0.5 rounded-full ${
                          isCritical
                            ? 'bg-rose-500/20 text-rose-600'
                            : isHigh
                            ? 'bg-amber-500/20 text-amber-600'
                            : isMastered
                            ? 'bg-emerald-500/20 text-emerald-600'
                            : 'bg-purple-500/20 text-purple-600'
                        }`}
                      >
                        {model.status.toUpperCase()}
                      </span>
                    </div>

                    <h4 className="font-black text-sm text-foreground line-clamp-1">
                      {model.chapterName}
                    </h4>

                    {/* Retention Progress Ring / Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-muted-foreground">Current Retention</span>
                        <span
                          className={`font-black ${
                            model.currentMemoryPercent < 50
                              ? 'text-rose-500'
                              : model.currentMemoryPercent < 75
                              ? 'text-amber-500'
                              : 'text-emerald-500'
                          }`}
                        >
                          {model.currentMemoryPercent}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            model.currentMemoryPercent < 50
                              ? 'bg-rose-500'
                              : model.currentMemoryPercent < 75
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${model.currentMemoryPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 text-muted-foreground">
                      <div>
                        <span>Decay Rate (λ): </span>
                        <strong className="text-foreground">{model.forgetRateLambda}</strong>
                      </div>
                      <div>
                        <span>Interval: </span>
                        <strong className="text-purple-600">{model.intervalStep}</strong>
                      </div>
                      <div>
                        <span>Revised: </span>
                        <strong className="text-foreground">{model.timesRevised}x</strong>
                      </div>
                      <div>
                        <span>Mistakes: </span>
                        <strong className="text-rose-500">{model.mistakeCount}</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setActiveTabSection('sessions');
                        setExpandedSessionId(`rev_session_${model.chapterId}`);
                      }}
                      className="w-full py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-amber-500 hover:text-white text-foreground font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Inspect Session</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 3: REVISION CALENDAR */}
      {/* ======================================================== */}
      {activeTabSection === 'calendar' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-lg text-foreground flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-500" />
                  <span>Adaptive Revision Calendar</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Green = Completed • Yellow = Today • Red = Overdue • Blue = Upcoming Spaced Interval
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Completed</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Today</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Overdue</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>Upcoming</span>
                </span>
              </div>
            </div>

            {/* Interactive 7-Day Day Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-7 gap-2.5">
              {calendarDays.map((day) => {
                const isSelected = selectedCalendarDate === day.date;
                const isCompleted = day.status === 'completed';
                const isToday = day.status === 'today';
                const isOverdue = day.status === 'overdue';
                const isUpcoming = day.status === 'upcoming';

                return (
                  <div
                    key={day.date}
                    onClick={() => setSelectedCalendarDate(day.date)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-center space-y-1 ${
                      isSelected
                        ? 'ring-2 ring-purple-600 shadow-md scale-102'
                        : 'hover:border-purple-400'
                    } ${
                      isCompleted
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : isOverdue
                        ? 'bg-rose-500/10 border-rose-500/30'
                        : isToday
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-blue-500/10 border-blue-500/30'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block font-mono">
                      {day.dayName}
                    </span>
                    <div className="text-xl font-black font-mono text-foreground">
                      {day.dayNumber}
                    </div>
                    <span
                      className={`text-[9px] font-black uppercase font-mono block ${
                        isCompleted
                          ? 'text-emerald-600'
                          : isOverdue
                          ? 'text-rose-600'
                          : isToday
                          ? 'text-amber-600'
                          : 'text-blue-600'
                      }`}
                    >
                      {day.status}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Tasks Scheduled on Selected Date */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-foreground font-mono">
                  Sessions Scheduled for: {selectedCalendarDate}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {selectedDayData.sessions.length} Session(s) • ~{selectedDayData.totalMinutes} mins
                </span>
              </div>

              {selectedDayData.sessions.length === 0 ? (
                <div className="text-xs text-muted-foreground p-3 text-center">
                  No active revisions scheduled for this date.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDayData.sessions.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-foreground block">{s.chapter}</span>
                        <span className="text-[10px] text-muted-foreground">{s.subject} • {s.revisionMethod} • {s.questionsToSolve} Questions</span>
                      </div>

                      <button
                        onClick={() => {
                          setActiveTabSection('sessions');
                          setExpandedSessionId(s.id);
                        }}
                        className="px-3 py-1 rounded-lg bg-purple-600 text-white font-bold text-[11px]"
                      >
                        Inspect
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 4: STATISTICS & STREAKS */}
      {/* ======================================================== */}
      {activeTabSection === 'statistics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 text-center space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                Total Revisions
              </span>
              <div className="text-3xl font-black font-mono text-foreground">{stats.totalRevisions}</div>
              <span className="text-[10px] text-emerald-500 font-bold font-mono">
                {stats.completedCount} Completed
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 text-center space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                Completion Rate
              </span>
              <div className="text-3xl font-black font-mono text-purple-600">{stats.completionRate}%</div>
              <span className="text-[10px] text-muted-foreground font-mono">
                {stats.skippedCount} Skipped
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 text-center space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                Avg. Revision Time
              </span>
              <div className="text-3xl font-black font-mono text-amber-500">{stats.averageRevisionTimeMinutes}m</div>
              <span className="text-[10px] text-muted-foreground font-mono">Per Chapter Session</span>
            </div>

            <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 text-center space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                Retention Improvement
              </span>
              <div className="text-3xl font-black font-mono text-emerald-500">+{stats.retentionImprovementPercent}%</div>
              <span className="text-[10px] text-emerald-600 font-bold font-mono">Vs. Passive Reading</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Most Revised vs Most Forgotten */}
            <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 space-y-4">
              <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600" />
                <span>Behavioral Insights & Subject Velocity</span>
              </h4>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 flex items-center justify-between">
                  <span className="text-muted-foreground">Most Revised Subject</span>
                  <span className="font-black text-foreground font-mono">{stats.mostRevisedSubject} (14 Sessions)</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
                  <span className="text-rose-600 dark:text-rose-400 font-bold">Most Forgotten Chapter</span>
                  <span className="font-black text-rose-600 dark:text-rose-400 font-mono">{stats.mostForgottenChapter}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 flex items-center justify-between">
                  <span className="text-muted-foreground">Longest Revision Streak</span>
                  <span className="font-black text-purple-600 font-mono">{streak.longestDailyStreak} Consecutive Days</span>
                </div>
              </div>
            </div>

            {/* Streak Metrics Breakdown */}
            <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 space-y-4">
              <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <span>Multi-Period Revision Consistency</span>
              </h4>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 flex items-center justify-between">
                  <span className="text-muted-foreground">This Week's Revisions</span>
                  <span className="font-black text-foreground font-mono">{streak.weeklyRevisionsCount} Sessions</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 flex items-center justify-between">
                  <span className="text-muted-foreground">This Month's Revisions</span>
                  <span className="font-black text-foreground font-mono">{streak.monthlyRevisionsCount} Sessions</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Weekly Consistency Rating</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">94% (Grade A+)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DRILL MODAL (When student clicks "Start Session") */}
      {/* ======================================================== */}
      {activeDrillSession && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg rounded-3xl bg-card border border-slate-200 dark:border-white/10 p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase text-amber-500 font-mono">
                  Interactive Revision Session
                </span>
                <h3 className="text-lg font-black text-foreground">{activeDrillSession.chapter}</h3>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-purple-500/10 text-purple-600">
                Step {drillStep} of 3
              </span>
            </div>

            {drillStep === 1 && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                  <strong className="text-amber-600 dark:text-amber-400 block font-bold">Session Objective:</strong>
                  <p className="text-foreground leading-relaxed">{activeDrillSession.reasonForRevision}</p>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-foreground block">Session Directives:</span>
                  <div className="space-y-1.5">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5">
                      1. Solve {activeDrillSession.questionsToSolve} {activeDrillSession.questionTypeFocus}.
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5">
                      2. Review formulas from: {activeDrillSession.recommendedResources.formulaSheet}.
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5">
                      3. Cross-reference NCERT solved examples for any numerical step errors.
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setDrillStep(2)}
                  className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs cursor-pointer"
                >
                  Proceed to Recall Check
                </button>
              </div>
            )}

            {drillStep === 2 && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-1">
                  <strong className="text-purple-600 dark:text-purple-400 block font-bold">Recall Verification:</strong>
                  <p className="text-foreground leading-relaxed">
                    Did you successfully solve the {activeDrillSession.questionsToSolve} targeted practice questions?
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setDrillStep(3)}
                    className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500 text-emerald-600 font-black cursor-pointer text-center"
                  >
                    Yes, High Accuracy (80%+)
                  </button>
                  <button
                    onClick={() => setDrillStep(3)}
                    className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 hover:border-amber-500 text-amber-600 font-black cursor-pointer text-center"
                  >
                    Partial Recall (Need Repeat Soon)
                  </button>
                </div>
              </div>
            )}

            {drillStep === 3 && (
              <div className="space-y-4 text-xs text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <div>
                  <h4 className="font-black text-base text-foreground">Session Complete!</h4>
                  <p className="text-muted-foreground mt-0.5">
                    Memory retention improved to {activeDrillSession.memoryRetentionProjected}%. Next spaced revision interval advanced.
                  </p>
                </div>

                <button
                  onClick={handleFinishDrill}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer"
                >
                  Record & Close Session
                </button>
              </div>
            )}

            <button
              onClick={() => setActiveDrillSession(null)}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground cursor-pointer pt-1"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};
