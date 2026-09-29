import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { useNavigation } from '@/contexts/NavigationContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { weaknessService } from '@/services/weakness-service';
import { notificationEngine } from '@/services/notification-service';
import {
  WeaknessOverallData,
  ChapterWeaknessAnalysis,
  SubjectWeaknessSummary,
  WeaknessLevel,
  WeaknessPriority,
  RootCauseType,
  BehavioralAiInsight,
  CognitiveRadarDimension,
} from '@/types/weakness';
import {
  Brain,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Target,
  BookOpen,
  ArrowRight,
  Flame,
  Zap,
  Info,
  Calendar,
  Sparkles,
  Layers,
  BookX,
  FileText,
  Sliders,
  Check,
  ChevronRight,
  Sun,
  Moon,
  Activity,
  Award,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import toast from 'react-hot-toast';

export const WeaknessAnalyzerView: React.FC = () => {
  const { user } = useAuth();
  const { setActiveTab } = useNavigation();
  const { chapterProgressMap, upcomingExam } = useOnboarding();

  const [data, setData] = useState<WeaknessOverallData | null>(() =>
    weaknessService.getCachedData()
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('all');
  const [selectedCauseFilter, setSelectedCauseFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeChapterModal, setActiveChapterModal] = useState<ChapterWeaknessAnalysis | null>(null);

  useEffect(() => {
    const userId = user?.uid || 'guest';
    const chapters = Object.values(chapterProgressMap || {});
    weaknessService.init(userId).then((res) => {
      setData(res);
    });

    const unsub = weaknessService.subscribe((res) => {
      setData(res);
      // Keep selected chapter in sync if updated
      if (activeChapterModal) {
        const found = res.allChapters.find((c) => c.chapterId === activeChapterModal.chapterId);
        if (found) setActiveChapterModal(found);
      }
    });

    return () => unsub();
  }, [user?.uid]);

  // Recalculate if chapter progress map changes
  useEffect(() => {
    const chapters = Object.values(chapterProgressMap || {});
    if (chapters.length > 0) {
      const res = weaknessService.analyze(chapters, undefined, upcomingExam);
      setData(res);
    }
  }, [chapterProgressMap, upcomingExam]);

  const handleManualAnalyze = async () => {
    setIsAnalyzing(true);
    const chapters = Object.values(chapterProgressMap || {});
    const res = weaknessService.analyze(chapters, undefined, upcomingExam);
    setData(res);

    notificationEngine.triggerNotification(
      '🧠 Weakness Analyzer Updated',
      `Identified ${res.needsImmediateAttentionCount} chapter(s) needing immediate attention. 5-day recovery active.`,
      'weakness-analysis'
    );

    setTimeout(() => {
      setIsAnalyzing(false);
      toast.success('Cognitive weakness analysis refreshed using live student logs!', { icon: '🧠' });
    }, 600);
  };

  const handleTogglePlanStep = (chapterId: string, stepIndex: number) => {
    weaknessService.completeChapterActionStep(chapterId, stepIndex);
  };

  // Filter chapters
  const filteredChapters = useMemo(() => {
    if (!data?.allChapters) return [];
    return data.allChapters.filter((ch) => {
      if (selectedSubjectFilter !== 'all' && ch.subjectId.toLowerCase() !== selectedSubjectFilter.toLowerCase()) {
        return false;
      }
      if (selectedLevelFilter !== 'all' && ch.weaknessLevel !== selectedLevelFilter) {
        return false;
      }
      if (selectedCauseFilter !== 'all' && !ch.rootCauses.some((r) => r.cause === selectedCauseFilter)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          ch.chapterName.toLowerCase().includes(q) ||
          ch.subjectName.toLowerCase().includes(q) ||
          ch.rootCauses.some((r) => r.cause.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [data?.allChapters, selectedSubjectFilter, selectedLevelFilter, selectedCauseFilter, searchQuery]);

  const overallWeakness = data?.overallWeaknessScore ?? 28;
  const healthScore = data?.overallHealthScore ?? 72;
  const urgentCount = data?.needsImmediateAttentionCount ?? 3;
  const subjects = data?.subjects ? Object.values(data.subjects) : [];

  // Helper for Radar Chart SVG vertices
  const renderRadarPolygon = (dimensions: CognitiveRadarDimension[], key: 'score' | 'benchmark') => {
    const center = 100;
    const radius = 75;
    const total = dimensions.length;

    const points = dimensions.map((d, i) => {
      const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
      const val = key === 'score' ? d.score : d.benchmark;
      const r = (val / 100) * radius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x},${y}`;
    });

    return points.join(' ');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* 1. HERO BANNER: WEAKNESS OVERVIEW & DIAGNOSTIC HEALTH */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-rose-950/90 to-purple-950 text-white border border-rose-500/30 shadow-2xl">
        {/* Ambient glow */}
        <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-rose-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Top header navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-rose-200">
                <Brain className="w-4 h-4 text-rose-400" />
                <span>Rankify AI Weakness Analyzer</span>
              </div>

              {urgentCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-black uppercase tracking-wider animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>{urgentCount} Critical Interventions Needed</span>
                </span>
              )}

              <span className="text-[10px] text-rose-300/80 font-mono bg-white/5 px-2.5 py-0.5 rounded border border-white/10">
                Continuous Behavioral Tracking
              </span>
            </div>

            <button
              onClick={handleManualAnalyze}
              disabled={isAnalyzing}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>Run Deep Diagnosis</span>
            </button>
          </div>

          {/* Headline & Overview */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pt-2">
            <div className="space-y-2 flex-1">
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                Weakness Score: <span className="text-rose-400">{overallWeakness}%</span>{' '}
                <span className="text-xs sm:text-sm font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 align-middle ml-2">
                  Health: {healthScore}%
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-rose-100/90 leading-relaxed max-w-2xl font-medium">
                Rankify pinpoints exactly <strong className="text-white">WHY</strong> a chapter is weak (unrevised formulas, missed PYQs, calculation traps), provides tailored recovery roadmaps, and tells you precisely when and what to study.
              </p>
            </div>

            {/* Overall Score Badges */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center min-w-[110px]">
                <span className="text-[10px] text-rose-300 font-bold uppercase tracking-wider block">
                  Weakness
                </span>
                <span className="text-3xl font-black font-mono text-rose-400 mt-1 block">
                  {overallWeakness}%
                </span>
                <span className="text-[10px] text-slate-300 font-medium">
                  {overallWeakness <= 25 ? 'Low (Nominal)' : 'High Friction'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center min-w-[110px]">
                <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">
                  Subject Health
                </span>
                <span className="text-3xl font-black font-mono text-emerald-400 mt-1 block">
                  {healthScore}%
                </span>
                <span className="text-[10px] text-slate-300 font-medium">
                  Mastery Level
                </span>
              </div>
            </div>
          </div>

          {/* Quick Subject Strengths Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {subjects.map((sub) => (
              <div
                key={sub.subjectId}
                className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: sub.color }}
                    />
                    <span className="font-extrabold text-xs text-white">{sub.subjectName}</span>
                  </div>
                  <span className="text-[10px] text-rose-200/80 block mt-0.5">
                    Root Cause: {sub.dominantRootCause}
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-mono font-black text-sm text-white">
                    {sub.averageStrengthScore}% Strength
                  </span>
                  <span className="text-[10px] font-bold text-rose-300 block">
                    {sub.criticalChaptersCount} Critical
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. BEHAVIORAL AI INSIGHTS & RADAR COGNITIVE PROFILE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: AI BEHAVIORAL INSIGHTS */}
        <Card className="p-5 sm:p-6 bg-card/80 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-extrabold text-base text-foreground">Behavioral AI Insights</h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                Cognitive Habits
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Analyzed from time-of-day accuracy, spaced retention intervals, and MCQ reaction speed:
            </p>

            <div className="space-y-3">
              {data?.aiInsights.map((insight) => {
                const icon = {
                  brain: <Brain className="w-4 h-4 text-purple-500" />,
                  sun: <Sun className="w-4 h-4 text-amber-500" />,
                  activity: <Activity className="w-4 h-4 text-emerald-500" />,
                  zap: <Zap className="w-4 h-4 text-rose-500" />,
                  clock: <Clock className="w-4 h-4 text-blue-500" />,
                  moon: <Moon className="w-4 h-4 text-indigo-500" />,
                }[insight.iconType];

                return (
                  <div
                    key={insight.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-white/5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {icon}
                        <h4 className="font-extrabold text-xs text-foreground">
                          {insight.title}
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-muted-foreground bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                        {insight.confidenceScore}% confidence
                      </span>
                    </div>

                    <p className="text-xs text-foreground/90 font-medium pl-6 leading-relaxed">
                      "{insight.insight}"
                    </p>

                    <div className="text-[11px] text-purple-600 dark:text-purple-400 pl-6 flex items-center gap-1 font-semibold">
                      <Zap className="w-3 h-3 text-purple-500 shrink-0" />
                      <span>Action: {insight.actionSuggestion}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Smart Reminders preview */}
          {data?.smartReminders?.[0] && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-rose-500" />
                <strong className="text-foreground">Reminder:</strong> {data.smartReminders[0].title}
              </span>
              <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">
                {data.smartReminders[0].scheduledFor}
              </span>
            </div>
          )}
        </Card>

        {/* Right: COGNITIVE RADAR CHART & DIMENSIONS */}
        <Card className="p-5 sm:p-6 bg-card/80 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-extrabold text-base text-foreground">Cognitive Radar Analysis</h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                Topper Benchmark
              </span>
            </div>

            {/* Radar Chart SVG & Bars Split */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* SVG Radar Chart */}
              <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 200 200">
                  {/* Concentric guide circles */}
                  <circle cx="100" cy="100" r="25" fill="none" stroke="currentColor" strokeOpacity="0.1" />
                  <circle cx="100" cy="100" r="50" fill="none" stroke="currentColor" strokeOpacity="0.1" />
                  <circle cx="100" cy="100" r="75" fill="none" stroke="currentColor" strokeOpacity="0.15" />

                  {/* Benchmark Polygon */}
                  {data?.radarDimensions && (
                    <polygon
                      points={renderRadarPolygon(data.radarDimensions, 'benchmark')}
                      fill="#6366F1"
                      fillOpacity="0.1"
                      stroke="#6366F1"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  )}

                  {/* Student Score Polygon */}
                  {data?.radarDimensions && (
                    <polygon
                      points={renderRadarPolygon(data.radarDimensions, 'score')}
                      fill="#F43F5E"
                      fillOpacity="0.25"
                      stroke="#F43F5E"
                      strokeWidth="2"
                    />
                  )}
                </svg>

                {/* Center label */}
                <div className="absolute text-center">
                  <span className="text-[9px] font-black uppercase text-muted-foreground block">
                    Radar
                  </span>
                  <span className="text-xs font-black font-mono text-foreground">
                    {healthScore}%
                  </span>
                </div>
              </div>

              {/* Dimension Metrics */}
              <div className="space-y-2 w-full flex-1">
                {data?.radarDimensions.map((dim, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-muted-foreground">{dim.dimension}</span>
                      <span className="font-mono font-bold text-foreground">
                        {dim.score}%{' '}
                        <span className="text-[10px] text-muted-foreground font-normal">
                          (Top: {dim.benchmark}%)
                        </span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          dim.score >= dim.benchmark ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${dim.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Radar Legend */}
            <div className="flex items-center justify-center gap-4 text-xs pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-muted-foreground font-medium">Your Profile</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 border border-dashed border-indigo-400" />
                <span className="text-muted-foreground font-medium">CBSE 95%+ Benchmark</span>
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Most critical cognitive gap:</span>
            <span className="font-bold text-rose-500">
              Numerical Solving (-18% below benchmark)
            </span>
          </div>
        </Card>
      </div>

      {/* 3. COMMON MISTAKES & RECOVERY TREND SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Global Common Mistakes Card */}
        <Card className="p-5 sm:p-6 bg-card/80 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookX className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <h3 className="font-extrabold text-base text-foreground">Common Student Traps</h3>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              Error Catalog
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/30 space-y-1">
              <span className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400 block">
                ⚡ Most Forgotten Formula
              </span>
              <p className="font-semibold text-foreground">
                {data?.commonMistakesGlobal?.mostForgottenFormula}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/30 space-y-1">
              <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 block">
                🧠 Most Incorrect Concept
              </span>
              <p className="font-semibold text-foreground">
                {data?.commonMistakesGlobal?.mostIncorrectConcept}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-900/30 space-y-1">
              <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 block">
                ❓ Most Wrong Question Type
              </span>
              <p className="font-semibold text-foreground">
                {data?.commonMistakesGlobal?.mostWrongQuestionType}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-900/30 space-y-1">
              <span className="text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400 block">
                📐 Most Wrong Numerical Pattern
              </span>
              <p className="font-semibold text-foreground">
                {data?.commonMistakesGlobal?.mostWrongNumerical}
              </p>
            </div>
          </div>
        </Card>

        {/* Weakness Recovery Trend Card */}
        <Card className="p-5 sm:p-6 bg-card/80 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-extrabold text-base text-foreground">Weakness Reduction Trajectory</h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Recovery Rate: +65%
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Weakness index over the past 4 weeks with projected target once all Top 3 chapter recovery plans are completed:
            </p>

            <div className="grid grid-cols-5 gap-3 pt-3">
              {data?.recoveryTrend.map((pt, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <span className="font-mono font-bold text-xs text-foreground">
                    {pt.weaknessScore}%
                  </span>
                  <div className="w-full max-w-[44px] h-28 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 flex items-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${pt.weaknessScore}%` }}
                      transition={{ duration: 0.8, delay: i * 0.08 }}
                      className={`w-full rounded-lg ${
                        i === 4
                          ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-md'
                          : 'bg-rose-500/70 dark:bg-rose-500/50'
                      }`}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-muted-foreground">{pt.week}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Recovery Pace:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              On track to reach 10% minimal weakness by exam week
            </span>
          </div>
        </Card>
      </div>

      {/* 4. CHAPTER DIAGNOSTICS & ROOT-CAUSE HEATMAP */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <h3 className="text-lg font-black text-foreground">Chapter Weakness Directory</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Click any chapter to open its Root-Cause Surgery, WHY explanation, and 5-Day Smart Improvement Roadmap.
            </p>
          </div>

          {/* Weakness Level Badges */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Critical
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Weak
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Average
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Strong
            </span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="p-4 rounded-2xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Subject Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {['all', 'physics', 'chemistry', 'mathematics'].map((subId) => (
              <button
                key={subId}
                onClick={() => setSelectedSubjectFilter(subId)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedSubjectFilter === subId
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground'
                }`}
              >
                {subId === 'all'
                  ? 'All Subjects'
                  : subId.charAt(0).toUpperCase() + subId.slice(1)}
              </button>
            ))}
          </div>

          {/* Level, Cause, Search */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-48">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search chapter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-rose-500"
              />
            </div>

            {/* Level Filter */}
            <select
              value={selectedLevelFilter}
              onChange={(e) => setSelectedLevelFilter(e.target.value)}
              className="h-8 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-foreground focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Levels</option>
              <option value="Critical">Critical</option>
              <option value="Weak">Weak</option>
              <option value="Average">Average</option>
              <option value="Strong">Strong</option>
              <option value="Very Strong">Very Strong</option>
            </select>

            {/* Root Cause Filter */}
            <select
              value={selectedCauseFilter}
              onChange={(e) => setSelectedCauseFilter(e.target.value)}
              className="h-8 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-foreground focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Causes</option>
              <option value="Low Practice">Low Practice</option>
              <option value="No Revision">No Revision</option>
              <option value="Formula Forgotten">Formula Forgotten</option>
              <option value="Concept Confusion">Concept Confusion</option>
              <option value="Calculation Errors">Calculation Errors</option>
              <option value="Skipping Numericals">Skipping Numericals</option>
              <option value="Incomplete Lecture">Incomplete Lecture</option>
              <option value="Low NCERT Reading">Low NCERT Reading</option>
            </select>
          </div>
        </div>

        {/* Chapters Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChapters.map((ch) => {
            const levelColor = {
              Critical: 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300',
              Weak: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-300',
              Average: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-300',
              Strong: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300',
              'Very Strong': 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300',
            }[ch.weaknessLevel];

            const badgeBg = {
              Critical: 'bg-rose-600 text-white',
              Weak: 'bg-amber-500 text-slate-950 font-bold',
              Average: 'bg-blue-600 text-white',
              Strong: 'bg-emerald-600 text-white',
              'Very Strong': 'bg-emerald-600 text-white',
            }[ch.weaknessLevel];

            return (
              <motion.div
                key={ch.chapterId}
                whileHover={{ scale: 1.01 }}
                onClick={() => setActiveChapterModal(ch)}
                className={`p-4 rounded-3xl border ${levelColor} shadow-xs hover:shadow-md cursor-pointer transition-all flex flex-col justify-between space-y-3`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                      {ch.subjectName}
                    </span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${badgeBg}`}>
                      {ch.weaknessLevel} ({ch.weaknessScore}% Weak)
                    </span>
                  </div>

                  <h4 className="font-extrabold text-sm text-foreground line-clamp-1">
                    {ch.chapterName}
                  </h4>

                  {/* Root Causes tags */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {ch.rootCauses.slice(0, 2).map((rc, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-foreground flex items-center gap-1"
                      >
                        <Zap className="w-2.5 h-2.5 text-amber-500" />
                        <span>{rc.cause}</span>
                      </span>
                    ))}
                  </div>

                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {ch.whyExplanation}
                  </p>
                </div>

                <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">
                      Recovery: <strong className="text-foreground">{ch.estimatedRecoveryDays} Days</strong>
                    </span>
                    <span className="text-[10px] text-rose-500 font-bold">
                      {ch.revisionStatus}
                    </span>
                  </div>

                  <button className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs flex items-center gap-1 cursor-pointer">
                    <span>Surgery Plan</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredChapters.length === 0 && (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
            <Brain className="w-8 h-8 text-muted-foreground mx-auto" />
            <div className="font-bold text-sm text-foreground">No chapters match this filter</div>
            <p className="text-xs text-muted-foreground">
              Try adjusting your Root Cause or Level filters.
            </p>
          </div>
        )}
      </div>

      {/* 5. MODAL: FULL CHAPTER SURGERY & 5-DAY RECOVERY PLAN */}
      <AnimatePresence>
        {activeChapterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-card border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-7 space-y-6 text-foreground"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                      {activeChapterModal.subjectName} • Board Weightage ~{activeChapterModal.weightage} Marks
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      {activeChapterModal.weaknessLevel} ({activeChapterModal.weaknessScore}% Weak)
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-foreground mt-1">
                    {activeChapterModal.chapterName}
                  </h2>
                </div>

                <button
                  onClick={() => setActiveChapterModal(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* 4 Core Questions: WHY, HOW, HOW MUCH, WHEN, WHAT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* WHY it is weak */}
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1.5 sm:col-span-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 uppercase">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>WHY THIS CHAPTER IS WEAK</span>
                  </div>
                  <p className="text-xs text-foreground/90 font-medium leading-relaxed">
                    {activeChapterModal.whyExplanation}
                  </p>
                </div>

                {/* HOW to improve */}
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>HOW TO IMPROVE</span>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed font-medium">
                    {activeChapterModal.howToImprove}
                  </p>
                </div>

                {/* HOW MUCH improvement is needed */}
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                    <Target className="w-3.5 h-3.5" />
                    <span>HOW MUCH IMPROVEMENT NEEDED</span>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed font-medium">
                    Current Confidence: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{activeChapterModal.confidence}%</strong>. Target is 85%+. Need <strong className="text-emerald-600 dark:text-emerald-400">+{activeChapterModal.improvementNeededPct}%</strong> improvement.
                  </p>
                </div>

                {/* WHEN to revise */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">
                    <Clock className="w-3.5 h-3.5" />
                    <span>WHEN TO REVISE</span>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed font-medium">
                    <strong className="text-amber-600 dark:text-amber-400">{activeChapterModal.whenToRevise}</strong>. Revision status: {activeChapterModal.revisionStatus}.
                  </p>
                </div>

                {/* WHAT to study */}
                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>WHAT TO STUDY</span>
                  </div>
                  <ul className="text-xs text-foreground/90 space-y-1">
                    {activeChapterModal.whatToStudy.map((item, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-purple-500">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 5-DAY RECOVERY MILESTONES */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="font-extrabold text-xs text-foreground uppercase tracking-wider">
                      {activeChapterModal.estimatedRecoveryDays}-Day Recovery Milestones
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Est. Days: {activeChapterModal.estimatedRecoveryDays} Days
                  </span>
                </div>

                <div className="space-y-2">
                  {activeChapterModal.recoveryMilestones.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200/70 dark:border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black text-[10px] flex items-center justify-center shrink-0">
                          D{m.day}
                        </span>
                        <span className="font-medium text-foreground">{m.milestone}</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
                        Target {m.confidenceTarget}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ACTIONABLE IMPROVEMENT PLAN CHECKLIST */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Personalized Smart Action Plan</span>
                  </h4>
                  <span className="text-[10px] text-muted-foreground">
                    Check off steps as you complete them
                  </span>
                </div>

                <div className="space-y-2">
                  {activeChapterModal.improvementPlan.map((step, idx) => (
                    <div
                      key={step.step}
                      className={`p-3 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                        step.isCompleted
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30 line-through opacity-70'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-white/5 hover:border-purple-500/40'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <button
                          onClick={() => handleTogglePlanStep(activeChapterModal.chapterId, idx)}
                          className={`w-5 h-5 rounded-md border mt-0.5 flex items-center justify-center text-xs cursor-pointer ${
                            step.isCompleted
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 dark:border-slate-600 hover:border-purple-500'
                          }`}
                        >
                          {step.isCompleted && <Check className="w-3.5 h-3.5" />}
                        </button>

                        <div className="space-y-0.5">
                          <div className="font-bold text-xs text-foreground">
                            Step {step.step}: {step.action}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            Resource: <strong className="text-foreground">{step.resource}</strong> • ~{step.estMinutes} mins
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                        +{step.estMinutes}m
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    setActiveChapterModal(null);
                    setActiveTab('study');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Start Formula Revision</span>
                </button>

                <button
                  onClick={() => {
                    setActiveChapterModal(null);
                    setActiveTab('practice');
                  }}
                  className="px-4 py-2.5 rounded-xl border border-purple-500/40 hover:bg-purple-50 dark:hover:bg-purple-950/30 text-purple-600 dark:text-purple-400 font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Solve 20 PYQs</span>
                </button>

                <button
                  onClick={() => {
                    setActiveChapterModal(null);
                    setActiveTab('mistakes' as any);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-rose-500/40 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <BookX className="w-3.5 h-3.5" />
                  <span>Review Mistake Notebook</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
