import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { useNavigation } from '@/contexts/NavigationContext';
import { commandCenterService } from '@/services/command-center-service';
import {
  ExamCommandCenterData,
  ChapterReadinessStatus,
  TodayCommandMission,
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
  Share2,
  Shield,
  Video,
  BarChart3,
  Sliders,
  ChevronRight,
  HelpCircle,
  Play,
  RotateCcw,
  Bell,
  Lock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import toast from 'react-hot-toast';

export const ExamCommandCenterView: React.FC = () => {
  const { user } = useAuth();
  const { setActiveTab, navigateToAi } = useNavigation();

  const [data, setData] = useState<ExamCommandCenterData | null>(() =>
    commandCenterService.getCachedData()
  );
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<'All' | 'Physics' | 'Chemistry' | 'Mathematics'>('All');
  const [selectedHeatmapStatus, setSelectedHeatmapStatus] = useState<'all' | 'ready' | 'needs_revision' | 'critical'>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeRevisionTab, setActiveRevisionTab] = useState<'today' | 'tomorrow' | 'thisWeek' | 'beforeExam' | 'oneNightBefore'>('today');

  useEffect(() => {
    const userId = user?.uid || 'guest';
    commandCenterService.init(userId).then((res) => {
      setData(res);
    });

    const unsub = commandCenterService.subscribe((res) => {
      setData(res);
    });

    return () => unsub();
  }, [user?.uid]);

  const handleToggleCommand = async (cmdId: string) => {
    await commandCenterService.toggleCommand(cmdId);
    toast.success('Exam Command updated!');
  };

  const handleRefresh = async () => {
    setIsSyncing(true);
    const userId = user?.uid || 'guest';
    const fresh = await commandCenterService.computeCommandCenterData(userId);
    setData(fresh);
    setIsSyncing(false);
    toast.success('Command Center live telemetry updated with Firebase!');
  };

  const handleTriggerCommandReminder = () => {
    toast(`Command Center Alert: "${data?.aiStrategy?.todaysFocus || 'Focus on Electrochemistry today'}"`, {
      icon: '🎯',
    });
  };

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
        <p className="text-sm font-bold text-muted-foreground font-mono">
          Initializing Exam Command Center...
        </p>
      </div>
    );
  }

  const {
    countdown,
    motivationalLine,
    currentPreparationStatus,
    overallReadinessPercent,
    todaysPriority,
    aiStrategy,
    subjectReadiness,
    syllabusStats,
    syllabusChapters,
    todaysCommands,
    urgentTasks,
    aiAlerts,
    predictedPerformance,
    revisionSchedule,
    formulaStatus,
    questionAnalysis,
    timeAnalysis,
    last7Days,
    top10Recommendations,
  } = data;

  const filteredChapters = syllabusChapters.filter((ch) => {
    if (selectedSubjectFilter !== 'All' && ch.subject !== selectedSubjectFilter) return false;
    if (selectedHeatmapStatus !== 'all' && ch.status !== selectedHeatmapStatus) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-7 pb-28 select-none px-2 sm:px-4">
      {/* 1. TOP SECTION: COMMAND HERO & COUNTDOWN */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-purple-950 p-6 sm:p-8 text-white shadow-2xl border border-indigo-500/30">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/25 to-indigo-500/25 border border-purple-400/40 text-purple-300 text-xs font-black uppercase tracking-wider shadow-sm">
                <Compass className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
                <span>Exam Command Center</span>
              </span>

              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider font-mono border ${
                currentPreparationStatus === 'Optimal Sprint'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : currentPreparationStatus === 'Defensive Revision'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}>
                Status: {currentPreparationStatus}
              </span>

              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[11px] font-mono">
                CBSE Class 12 PCM
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Understand Your Entire Exam In Under 30 Seconds.
            </h1>

            <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed italic">
              "{motivationalLine}"
            </p>

            {/* Today's Priority Highlight */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5 backdrop-blur-xs">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-xs">
                <span className="font-extrabold uppercase text-amber-300 mr-2 font-mono">Today's Priority:</span>
                <span className="font-semibold text-white">{todaysPriority}</span>
              </div>
            </div>
          </div>

          {/* Right Hero Gauges: Countdown Clock & Circular Readiness */}
          <div className="flex flex-row sm:flex-row items-center gap-4 w-full lg:w-auto justify-around sm:justify-end">
            {/* Exam Countdown Box */}
            <div className="p-4 rounded-3xl bg-indigo-900/40 border border-indigo-400/30 text-center min-w-[130px] shrink-0 backdrop-blur-md">
              <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider block">
                Target Exam Countdown
              </span>
              <div className="text-3xl sm:text-4xl font-black font-mono text-white mt-1">
                {countdown.daysRemaining} <span className="text-xs font-normal text-indigo-200">Days</span>
              </div>
              <div className="text-[11px] text-amber-300 font-mono font-bold mt-0.5">
                {countdown.hoursRemaining}h {countdown.minutesRemaining}m Remaining
              </div>
            </div>

            {/* Overall Readiness Circular Gauge */}
            <div className="p-4 rounded-3xl bg-purple-900/40 border border-purple-400/30 text-center min-w-[130px] shrink-0 backdrop-blur-md flex flex-col items-center justify-center">
              <span className="text-[10px] text-purple-200 font-bold uppercase tracking-wider block">
                Overall Readiness
              </span>
              <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-400 mt-1">
                {overallReadinessPercent}%
              </div>
              <span className="text-[10px] text-emerald-300 font-bold mt-0.5">
                High Probability 90%+
              </span>
            </div>
          </div>
        </div>

        {/* Action Toolbar on Banner */}
        <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-indigo-200/80">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-mono text-[11px]">Realtime Firebase Sync Active • Last sync: just now</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerCommandReminder}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-amber-300" />
              <span>Send Reminder</span>
            </button>

            <button
              onClick={handleRefresh}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Recalculate</span>
            </button>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS LAUNCHER BAR */}
      <div className="p-4 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-purple-600" />
            <span>1-Click Launchers (Quick Actions)</span>
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">Fast Execution</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1 text-xs">
          <button
            onClick={() => setActiveTab('study')}
            className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/70 dark:border-purple-500/20 hover:border-purple-500 font-extrabold text-foreground flex flex-col items-center text-center gap-1 transition-all cursor-pointer group"
          >
            <Play className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
            <span>Start Studying</span>
          </button>

          <button
            onClick={() => setActiveTab('study')}
            className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-500/20 hover:border-indigo-500 font-extrabold text-foreground flex flex-col items-center text-center gap-1 transition-all cursor-pointer group"
          >
            <Compass className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
            <span>Open SmartPlan</span>
          </button>

          <button
            onClick={() => setActiveTab('mistakes')}
            className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-500/20 hover:border-rose-500 font-extrabold text-foreground flex flex-col items-center text-center gap-1 transition-all cursor-pointer group"
          >
            <Bookmark className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
            <span>Mistake Notebook</span>
          </button>

          <button
            onClick={() => setActiveTab('study')}
            className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-500/20 hover:border-blue-500 font-extrabold text-foreground flex flex-col items-center text-center gap-1 transition-all cursor-pointer group"
          >
            <Video className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
            <span>Open LectureLab</span>
          </button>

          <button
            onClick={() => setActiveTab('study')}
            className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-500/20 hover:border-amber-500 font-extrabold text-foreground flex flex-col items-center text-center gap-1 transition-all cursor-pointer group"
          >
            <Sparkles className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
            <span>Open Flashcards</span>
          </button>

          <button
            onClick={() => setActiveTab('readiness')}
            className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-500/20 hover:border-emerald-500 font-extrabold text-foreground flex flex-col items-center text-center gap-1 transition-all cursor-pointer group"
          >
            <Shield className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span>Revision Kit</span>
          </button>
        </div>
      </div>

      {/* 2. AI STRATEGY & URGENT TASKS (Side by side) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* AI Strategy Box */}
        <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <span>Personalized AI Exam Strategy</span>
            </h3>
            <span className="text-[10px] font-bold text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 font-mono">
              Calibrated by Rankify Brain
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-500/20 space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Primary Focus Today
            </div>
            <div className="text-sm font-black text-foreground">
              {aiStrategy.todaysFocus}
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="font-extrabold uppercase text-muted-foreground tracking-wider text-[10px]">
              Directives for Today
            </div>
            {aiStrategy.actionDirectives.map((dir, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span className="text-foreground leading-relaxed">{dir}</span>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Tactical Advice: What To Skip</span>
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              {aiStrategy.whatToSkip}
            </p>
          </div>
        </div>

        {/* URGENT TASKS (Separate dedicated section) */}
        <div className="p-6 rounded-3xl bg-card border border-rose-500/30 dark:border-rose-500/20 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500" />
              <h3 className="font-extrabold text-base text-foreground">
                Urgent Tasks Center
              </h3>
            </div>
            <span className="text-[10px] font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 uppercase tracking-wider font-mono">
              Highest Priority Only
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            Critical vulnerabilities that will immediately impact board marks if left unresolved today.
          </p>

          <div className="space-y-3">
            {urgentTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-foreground">
                    {task.title}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded-md shrink-0">
                    {task.estimatedMinutes} mins
                  </span>
                </div>

                <div className="text-[11px] text-muted-foreground">
                  <strong className="text-rose-600 dark:text-rose-400">Reason:</strong> {task.reason}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-rose-200/60 dark:border-rose-900/30 text-[11px]">
                  <span className="text-rose-500 font-semibold font-mono">
                    ⚠️ {task.deadlineNotice}
                  </span>
                  <button
                    onClick={() => setActiveTab(task.route as any)}
                    className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Execute Task</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. AI ALERTS BANNER */}
      {aiAlerts.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Real-Time AI Readiness Alerts</span>
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">Continuous Telemetry</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {aiAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-rose-500/30 dark:border-rose-500/20 space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-rose-500 font-mono">
                      {alert.severity.toUpperCase()} ALERT
                    </span>
                    {alert.daysAgo && (
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {alert.daysAgo} days ago
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-black text-foreground">{alert.title}</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {alert.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between">
                  <button
                    onClick={() => setActiveTab(alert.actionRoute as any)}
                    className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{alert.suggestedAction}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. SUBJECT-WISE READINESS CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600" />
            <span>Subject-Wise Readiness & Target Telemetry</span>
          </h3>
          <span className="text-[10px] text-muted-foreground font-mono">Detailed Dimensions</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['Physics', 'Chemistry', 'Mathematics'] as const).map((subKey) => {
            const subj = subjectReadiness[subKey];
            return (
              <div
                key={subKey}
                className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="font-black text-base text-foreground">{subj.subject}</h4>
                    <span className="text-[10px] text-muted-foreground">
                      Predicted Score: <strong className="text-foreground">{subj.predictedScoreMin}–{subj.predictedScoreMax}</strong> / {subj.maxScore}
                    </span>
                  </div>
                  <span className={`text-xl font-black font-mono ${subj.color}`}>
                    {subj.confidence}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                    <span>Syllabus Progress</span>
                    <span className="font-bold text-foreground">{subj.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${subj.gradient}`}
                      style={{ width: `${subj.progress}%` }}
                    />
                  </div>
                </div>

                {/* 4 Dimension Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 space-y-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Confidence</span>
                    <div className="text-sm font-black font-mono text-foreground">{subj.confidence}%</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 space-y-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Revision Score</span>
                    <div className="text-sm font-black font-mono text-purple-600">{subj.revisionScore}%</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 space-y-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Questions Solved</span>
                    <div className="text-sm font-black font-mono text-foreground">{subj.practiceCount}</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 space-y-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Mock Avg</span>
                    <div className="text-sm font-black font-mono text-emerald-600">{subj.mockScore}%</div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('study')}
                  className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-600 hover:text-white text-foreground font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Practice {subKey}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. TODAY'S COMMANDS & LAST 7 DAYS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Today's Commands Interactive Checklist */}
        <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              <span>Today's Command Missions</span>
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono">
              {todaysCommands.filter((c) => c.isCompleted).length} of {todaysCommands.length} Completed
            </span>
          </div>

          <div className="space-y-2.5">
            {todaysCommands.map((cmd) => (
              <div
                key={cmd.id}
                onClick={() => handleToggleCommand(cmd.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  cmd.isCompleted
                    ? 'bg-emerald-500/5 border-emerald-500/30 text-muted-foreground line-through opacity-80'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200/80 dark:border-white/5 hover:border-purple-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                      cmd.isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'border-2 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {cmd.isCompleted && <Check className="w-4 h-4" />}
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-xs font-black text-foreground not-italic">
                      {cmd.title}
                    </div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                      <span className="font-bold text-purple-600 dark:text-purple-400">
                        {cmd.subject}
                      </span>
                      <span>•</span>
                      <span>{cmd.chapter}</span>
                      <span>•</span>
                      <span className="font-mono">{cmd.allocatedMinutes} mins</span>
                    </div>
                  </div>
                </div>

                <span className="font-mono text-xs font-black text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-md shrink-0">
                  +{cmd.impactScore} Marks
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Last 7 Days Telemetry Card */}
        <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              <span>Last 7 Days Study Velocity</span>
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono">Daily Progression</span>
          </div>

          <div className="space-y-2">
            {last7Days.map((metric, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-muted-foreground w-12">
                    {metric.day} {metric.date.split(' ')[1]}
                  </span>
                  <span className="font-extrabold text-foreground">{metric.hours} hrs</span>
                  <span className="text-[10px] text-muted-foreground">({metric.tasksCompleted} tasks)</span>
                </div>

                <div className="flex items-center gap-3 font-mono">
                  <span className="font-bold text-foreground">{metric.accuracy}% Acc</span>
                  <span
                    className={`font-bold text-[10px] ${
                      metric.improvementDelta >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {metric.improvementDelta >= 0 ? `+${metric.improvementDelta}%` : `${metric.improvementDelta}%`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. LIVE SYLLABUS & EXAM HEATMAP */}
      <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-600" />
              <span>Live Syllabus Readiness & Exam Heatmap</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Green = Ready • Yellow = Needs Revision • Red = Critical Board Vulnerability
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-background text-foreground font-bold"
            >
              <option value="All">All Subjects</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Mathematics">Mathematics</option>
            </select>

            <select
              value={selectedHeatmapStatus}
              onChange={(e) => setSelectedHeatmapStatus(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-background text-foreground font-bold"
            >
              <option value="all">All States</option>
              <option value="ready">Ready (Green)</option>
              <option value="needs_revision">Needs Revision (Yellow)</option>
              <option value="critical">Critical (Red)</option>
            </select>
          </div>
        </div>

        {/* Syllabus Stats Counter Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase block">Completed (Ready)</span>
            <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">{syllabusStats.completedChapters}</span>
          </div>

          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase block">Needs Revision</span>
            <span className="text-xl font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5 block">{syllabusStats.needsRevisionChapters}</span>
          </div>

          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase block">Critical Chapters</span>
            <span className="text-xl font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5 block">{syllabusStats.criticalChapters}</span>
          </div>

          <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase block">Weak Chapters</span>
            <span className="text-xl font-black font-mono text-purple-600 dark:text-purple-400 mt-0.5 block">{syllabusStats.weakChapters}</span>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase block">Total Syllabus</span>
            <span className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400 mt-0.5 block">{syllabusStats.totalChapters} Ch.</span>
          </div>
        </div>

        {/* Heatmap Chapters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredChapters.map((ch) => {
            const isReady = ch.status === 'ready';
            const isNeedsRevision = ch.status === 'needs_revision';
            const isCritical = ch.status === 'critical';

            return (
              <div
                key={ch.id}
                onClick={() => setActiveTab('study')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 hover:scale-[1.01] ${
                  isReady
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : isNeedsRevision
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-rose-500/10 border-rose-500/30'
                }`}
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-extrabold uppercase text-muted-foreground">{ch.subject}</span>
                  <span className="font-mono font-bold">{ch.weightageMarks} Marks</span>
                </div>

                <div className="font-black text-xs text-foreground line-clamp-1">
                  {ch.name}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className={`font-bold ${isReady ? 'text-emerald-600' : isNeedsRevision ? 'text-amber-600' : 'text-rose-600'}`}>
                    {ch.confidence}% Confidence
                  </span>
                  <span className="text-muted-foreground">
                    {ch.lastRevisedDaysAgo === 0 ? 'Today' : `${ch.lastRevisedDaysAgo}d ago`}
                  </span>
                </div>

                <div className="text-[10px] text-muted-foreground font-mono flex items-center justify-between pt-1 border-t border-slate-200/40 dark:border-white/5">
                  <span>Formulas: {ch.formulasMastered}/{ch.formulaCount}</span>
                  <span>Accuracy: {ch.accuracy}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. PREDICTED BOARD PERFORMANCE (Ranges instead of guarantees) */}
      <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span>Predicted Board Exam Performance (Conservative Range Estimation)</span>
          </h3>
          <span className="text-xs font-mono font-black text-purple-600 bg-purple-500/10 px-3 py-1 rounded-full">
            Projected: {predictedPerformance.overallRange}
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          Calculated using factual chapter coverage, mistake frequency, time per question, and historical CBSE Class 12 PCM grade distributions.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {predictedPerformance.subjects.map((pred) => (
            <div
              key={pred.subject}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-white/5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-foreground">{pred.subject}</span>
                <span className="font-mono text-xs font-bold text-muted-foreground">Max {pred.totalMarks}</span>
              </div>

              <div className="text-2xl font-black font-mono text-purple-600">
                {pred.minScore}–{pred.maxScore} <span className="text-xs font-normal text-muted-foreground">/ {pred.totalMarks}</span>
              </div>

              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                {pred.percentageRange} ({pred.confidenceInterval})
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-white/5 text-[11px]">
                <strong className="text-foreground block text-[10px] uppercase font-bold text-muted-foreground">
                  Actions to hit upper limit ({pred.maxScore}/{pred.totalMarks}):
                </strong>
                {pred.improvementActions.map((act, i) => (
                  <div key={i} className="text-muted-foreground leading-relaxed flex items-start gap-1.5">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>{act}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 8. REVISION COMMAND CENTER & FORMULA STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Revision Command Center */}
        <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              <span>Revision Command Center</span>
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono">Spaced Phasing</span>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-xs">
            {[
              { id: 'today', label: "Today's Revision" },
              { id: 'tomorrow', label: 'Tomorrow' },
              { id: 'thisWeek', label: 'This Week' },
              { id: 'beforeExam', label: 'Before Exam' },
              { id: 'oneNightBefore', label: 'One Night Before' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveRevisionTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  activeRevisionTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 space-y-2">
            <div className="text-[10px] font-black uppercase tracking-wider text-purple-600 font-mono">
              Action Items for {activeRevisionTab.replace(/([A-Z])/g, ' $1').toUpperCase()}
            </div>
            {revisionSchedule[activeRevisionTab].map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-foreground leading-relaxed">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Formula Status Summary */}
        <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Formula Mastery & Retention Status</span>
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono">{formulaStatus.total} Total Formulas</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase block">Mastered</span>
              <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">{formulaStatus.mastered}</span>
            </div>

            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase block">Pending</span>
              <span className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1 block">{formulaStatus.pending}</span>
            </div>

            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase block">Forgotten</span>
              <span className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400 mt-1 block">{formulaStatus.forgotten}</span>
            </div>
          </div>

          <div className="space-y-2 pt-1 text-xs">
            <span className="text-[10px] font-black uppercase text-rose-500 font-mono block">
              Urgent Formulas Requiring Recall Drill Tonight:
            </span>
            {formulaStatus.mostUrgentFormulas.slice(0, 3).map((f, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 space-y-0.5">
                <div className="flex justify-between text-muted-foreground text-[10px]">
                  <span>{f.name}</span>
                  <span className="font-bold text-foreground">{f.chapter}</span>
                </div>
                <div className="font-mono font-bold text-purple-600 dark:text-purple-400 text-xs">
                  {f.formula}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 9. QUESTION ACCURACY & TIME PRODUCTIVITY ANALYSIS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Question Type Accuracy Breakdown */}
        <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <span>Question Format Accuracy Analysis</span>
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono">Format Diagnostics</span>
          </div>

          <div className="space-y-3 pt-1 text-xs">
            {[
              { label: 'MCQs & Objective (1 Mark)', value: questionAnalysis.mcqAccuracy, color: 'bg-emerald-500' },
              { label: 'Numerical Calculations (2 & 3 Marks)', value: questionAnalysis.numericalAccuracy, color: 'bg-rose-500', note: 'Priority Bottleneck' },
              { label: 'Case-Based Studies (4 Marks)', value: questionAnalysis.caseStudyAccuracy, color: 'bg-indigo-500' },
              { label: 'Assertion & Reasoning (1 Mark)', value: questionAnalysis.assertionReasonAccuracy, color: 'bg-amber-500' },
              { label: 'Subjective Long Derivations (5 Marks)', value: questionAnalysis.subjectiveAccuracy, color: 'bg-purple-500' },
            ].map((q, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <span>{q.label}</span>
                    {q.note && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-500 font-bold">
                        {q.note}
                      </span>
                    )}
                  </span>
                  <span className="font-mono font-bold text-muted-foreground">{q.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className={`h-full rounded-full ${q.color}`} style={{ width: `${q.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time & Chronobiological Productivity Analysis */}
        <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              <span>Time & Productivity Diurnal Cycles</span>
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono">Cognitive Telemetry</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Today</span>
              <span className="text-lg font-black font-mono text-foreground mt-0.5 block">{timeAnalysis.todayStudyMinutes}m</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">This Week</span>
              <span className="text-lg font-black font-mono text-purple-600 mt-0.5 block">{timeAnalysis.thisWeekHours}h</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Monthly Avg</span>
              <span className="text-lg font-black font-mono text-indigo-600 mt-0.5 block">{timeAnalysis.monthlyAverageHours}h</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
              <div className="text-emerald-600 dark:text-emerald-400 font-bold flex justify-between">
                <span>Peak Productivity Window: {timeAnalysis.mostProductiveWindow}</span>
                <span className="font-mono">94% Speed</span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                {timeAnalysis.peakProductivityReason}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1">
              <div className="text-rose-600 dark:text-rose-400 font-bold flex justify-between">
                <span>Least Productive Window: {timeAnalysis.leastProductiveWindow}</span>
                <span className="font-mono">-27% Precision</span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                {timeAnalysis.dropProductivityReason}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 10. AI RECOMMENDATIONS: TOP 10 HIGHEST IMPACT ACTIONS */}
      <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-5">
        <div>
          <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            <span>Top 10 Highest Impact Board Exam Actions</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ranked mathematically by mark yield per minute spent. Executing these 10 actions will directly maximize board scores.
          </p>
        </div>

        <div className="space-y-2.5">
          {top10Recommendations.map((rec) => (
            <div
              key={rec.rank}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-white/5 hover:border-purple-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-start sm:items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-purple-600 text-white font-mono font-black flex items-center justify-center shrink-0">
                  #{rec.rank}
                </span>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-foreground">{rec.title}</span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-[10px]">
                      {rec.impactLabel}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-[11px]">{rec.actionText}</p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-slate-200/60 dark:border-white/5">
                <span className="font-mono text-muted-foreground text-[11px] shrink-0">
                  ~{rec.estimatedMinutes} mins
                </span>
                <button
                  onClick={() => setActiveTab(rec.route as any)}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>Launch</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
