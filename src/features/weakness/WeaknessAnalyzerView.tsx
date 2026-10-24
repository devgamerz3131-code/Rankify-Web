import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { useNavigation } from '@/contexts/NavigationContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { weaknessService, WEAKNESS_CONFIG } from '@/services/weakness-service';
import { notificationEngine } from '@/services/notification-service';
import { isTourActive } from '@/features/tour/tourReadOnlyGate';
import {
  WeaknessOverallData,
  ChapterWeaknessAnalysis,
  CognitiveRadarDimension,
} from '@/types/weakness';
import {
  Brain,
  AlertTriangle,
  TrendingDown,
  RefreshCw,
  Search,
  Clock,
  Target,
  BookOpen,
  Zap,
  Calendar,
  Sparkles,
  Layers,
  BookX,
  Check,
  ChevronRight,
  Sun,
  Moon,
  Activity,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
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
  const subjectTabsRef = useRef<HTMLDivElement>(null);

  const updateSubjectTabsFade = useCallback(() => {
    const el = subjectTabsRef.current;
    if (!el) return;
    el.setAttribute('data-fade-left', el.scrollLeft > 4 ? 'true' : 'false');
    el.setAttribute(
      'data-fade-right',
      el.scrollLeft + el.clientWidth < el.scrollWidth - 4 ? 'true' : 'false'
    );
  }, []);

  useEffect(() => {
    const el = subjectTabsRef.current;
    if (!el) return;
    const activeBtn = el.querySelector('[data-active="true"]') as HTMLElement | null;
    if (activeBtn && el.scrollWidth > el.clientWidth) {
      const targetLeft = activeBtn.offsetLeft - el.clientWidth / 2 + activeBtn.clientWidth / 2;
      el.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
    }
    updateSubjectTabsFade();
    window.addEventListener('resize', updateSubjectTabsFade);
    return () => window.removeEventListener('resize', updateSubjectTabsFade);
  }, [selectedSubjectFilter, updateSubjectTabsFade]);

  useEffect(() => {
    const userId = user?.uid || 'guest';
    weaknessService.init(userId).then((res) => {
      const chapters = Object.values(chapterProgressMap || {});
      const analyzed = weaknessService.analyze(chapters, undefined, upcomingExam);
      setData(analyzed || res);
    });

    const unsub = weaknessService.subscribe((res) => {
      setData(res);
      setActiveChapterModal((currentModal) => {
        if (!currentModal) return null;
        const found = res.allChapters.find((c) => c.chapterId === currentModal.chapterId);
        return found || currentModal;
      });
    });

    return () => unsub();
  }, [user?.uid]);

  // Recalculate whenever chapter progress map or exam changes
  useEffect(() => {
    const chapters = Object.values(chapterProgressMap || {});
    const res = weaknessService.analyze(chapters, undefined, upcomingExam);
    setData(res);
  }, [chapterProgressMap, upcomingExam]);

  const handleManualAnalyze = async () => {
    if (isTourActive()) return;
    setIsAnalyzing(true);
    const chapters = Object.values(chapterProgressMap || {});
    const res = weaknessService.analyze(chapters, undefined, upcomingExam);
    setData(res);

    notificationEngine.triggerNotification(
      '🧠 Weakness Analyzer Updated',
      res.needsImmediateAttentionCount > 0
        ? `Identified ${res.needsImmediateAttentionCount} chapter(s) needing attention.`
        : 'Weakness analysis refreshed from your study records.',
      'weakness-analysis'
    );

    setTimeout(() => {
      setIsAnalyzing(false);
      toast.success('Weakness analysis refreshed from live student logs!', { icon: '🧠' });
    }, 600);
  };

  const handleTogglePlanStep = (chapterId: string, stepIndex: number) => {
    weaknessService.completeChapterActionStep(chapterId, stepIndex);
  };

  // Dynamic Causes Filter: List ONLY causes that actually occur across chapters
  const availableCauses = useMemo(() => {
    if (!data?.allChapters) return [];
    const set = new Set<string>();
    for (const ch of data.allChapters) {
      for (const rc of ch.rootCauses) {
        if (rc.cause) set.add(rc.cause);
      }
    }
    return Array.from(set);
  }, [data?.allChapters]);

  // Reset selectedCauseFilter if it's no longer in availableCauses
  useEffect(() => {
    if (selectedCauseFilter !== 'all' && !availableCauses.includes(selectedCauseFilter)) {
      setSelectedCauseFilter('all');
    }
  }, [availableCauses, selectedCauseFilter]);

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

  const overallWeakness = data?.overallWeaknessScore ?? null;
  const healthScore = data?.overallHealthScore ?? null;
  const urgentCount = data?.needsImmediateAttentionCount ?? 0;
  const subjects = data?.subjects ? Object.values(data.subjects) : [];

  // Helper for Radar Chart SVG vertices
  const renderRadarPolygon = (dimensions: CognitiveRadarDimension[], key: 'score' | 'benchmark') => {
    const center = 100;
    const radius = 75;
    const total = dimensions.length;

    const points = dimensions.map((d, i) => {
      const angle = ((Math.PI * 2) / total) * i - Math.PI / 2;
      const val = key === 'score' ? d.score : d.benchmark;
      const r = (val / 100) * radius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x},${y}`;
    });

    return points.join(' ');
  };

  // Lowest radar dimension for summary footer
  const lowestRadarDim = useMemo(() => {
    if (!data?.radarDimensions || data.radarDimensions.length < 3) return null;
    const sorted = [...data.radarDimensions].sort((a, b) => a.score - b.score);
    return sorted[0];
  }, [data?.radarDimensions]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* 1. HERO BANNER: WEAKNESS OVERVIEW & DIAGNOSTIC HEALTH */}
      <div
        data-tour="weakness-header"
        className="rounded-2xl p-6 sm:p-8 bg-slate-900 text-white border border-slate-800 shadow-xl"
      >
        <div className="space-y-6">
          {/* Top header navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-rose-200">
                <Brain className="w-4 h-4 text-rose-400" />
                <span>Rankify AI Weakness Analyzer</span>
              </div>

              {urgentCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-black uppercase tracking-wider animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>{urgentCount} Critical Interventions Needed</span>
                </span>
              )}

              <span className="text-[10px] text-rose-300/80 font-mono bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
                Chapter Weakness Analysis
              </span>
            </div>

            <button
              onClick={handleManualAnalyze}
              disabled={isAnalyzing}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>Refresh Analysis</span>
            </button>
          </div>

          {/* Headline & Overview */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pt-2">
            <div className="space-y-2 flex-1">
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                Weakness Score:{' '}
                <span className="text-rose-400">
                  {overallWeakness !== null ? `${overallWeakness}%` : 'Not started'}
                </span>{' '}
                {healthScore !== null && (
                  <span className="text-xs sm:text-sm font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 align-middle ml-2">
                    Health: {healthScore}%
                  </span>
                )}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl font-medium">
                Rankify computes chapter strength from your real problem-solving accuracy, syllabus completion, spaced revisions, and unresolved mistakes in your Mistake Vault.
              </p>
            </div>

            {/* Overall Score Badges */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 text-center min-w-[110px]">
                <span className="text-[10px] text-rose-300 font-bold uppercase tracking-wider block">
                  Weakness
                </span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-rose-400 mt-1 block">
                  {overallWeakness !== null ? `${overallWeakness}%` : '–'}
                </span>
                <span className="text-[10px] text-slate-300 font-medium">
                  {overallWeakness === null
                    ? 'No attempts'
                    : overallWeakness <= 25
                    ? 'Low (Nominal)'
                    : 'Needs Focus'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 text-center min-w-[110px]">
                <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">
                  Subject Health
                </span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 mt-1 block">
                  {healthScore !== null ? `${healthScore}%` : '–'}
                </span>
                <span className="text-[10px] text-slate-300 font-medium">
                  Mastery Level
                </span>
              </div>
            </div>
          </div>

          {/* Quick Subject Strengths Ribbon */}
          <div data-tour="weakness-summary" className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {subjects.map((sub) => (
              <div
                key={sub.subjectId}
                className="p-3.5 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: sub.color }}
                    />
                    <span className="font-extrabold text-xs text-white truncate">{sub.subjectName}</span>
                  </div>
                  <span className="text-[10px] text-rose-200/80 block mt-0.5 truncate">
                    {sub.attemptedChaptersCount && sub.attemptedChaptersCount > 0
                      ? `Signal: ${sub.dominantRootCause}`
                      : 'Not started'}
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono font-black text-sm text-white block">
                    {sub.averageStrengthScore !== null ? `Score ${sub.averageStrengthScore}%` : '–'}
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
        <Card
          data-tour="weakness-insights"
          className="p-5 sm:p-6 bg-card border border-border shadow-xs flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-extrabold text-base text-foreground">Behavioral Insights</h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                Real Study Signals
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Derived directly from your attempted questions, subject scores, and Mistake Vault records:
            </p>

            {data?.aiInsights && data.aiInsights.length > 0 ? (
              <div className="space-y-3">
                {data.aiInsights.map((insight) => {
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
                      className="p-3.5 rounded-2xl bg-card border border-border text-card-foreground shadow-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {icon}
                          <h4 className="font-extrabold text-xs text-card-foreground">
                            {insight.title}
                          </h4>
                        </div>
                      </div>

                      <p className="text-xs text-card-foreground/90 font-medium pl-6 leading-relaxed">
                        {insight.insight}
                      </p>

                      <div className="text-[11px] text-purple-600 dark:text-purple-400 pl-6 flex items-center gap-1 font-semibold">
                        <Zap className="w-3 h-3 text-purple-500 shrink-0" />
                        <span>Action: {insight.actionSuggestion}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl border border-dashed border-border space-y-2">
                <Sparkles className="w-7 h-7 text-muted-foreground mx-auto" />
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  Not enough study data yet. Attempt at least {WEAKNESS_CONFIG.MIN_INSIGHT_SAMPLE_SIZE} practice questions or log entries in your Mistake Vault to see data-backed insights.
                </p>
              </div>
            )}
          </div>

          {/* Smart Reminders preview */}
          {data?.smartReminders?.[0] && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5 truncate">
                <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <strong className="text-foreground">Reminder:</strong> {data.smartReminders[0].title}
              </span>
              <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full shrink-0">
                {data.smartReminders[0].scheduledFor}
              </span>
            </div>
          )}
        </Card>

        {/* Right: COGNITIVE RADAR CHART & DIMENSIONS */}
        <Card
          data-tour="weakness-radar"
          className="p-5 sm:p-6 bg-card border border-border shadow-xs flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-extrabold text-base text-foreground">Cognitive Radar Analysis</h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                Your Target: {WEAKNESS_CONFIG.TARGET_BENCHMARK}%
              </span>
            </div>

            {data?.radarDimensions && data.radarDimensions.length >= 3 ? (
              <>
                {/* Radar Chart SVG & Bars Split */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  {/* Responsive SVG Radar Chart */}
                  <div className="relative w-full max-w-[180px] aspect-square shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 200 200">
                      {/* Concentric guide circles */}
                      <circle cx="100" cy="100" r="25" fill="none" stroke="currentColor" strokeOpacity="0.1" />
                      <circle cx="100" cy="100" r="50" fill="none" stroke="currentColor" strokeOpacity="0.1" />
                      <circle cx="100" cy="100" r="75" fill="none" stroke="currentColor" strokeOpacity="0.15" />

                      {/* Target Polygon */}
                      <polygon
                        points={renderRadarPolygon(data.radarDimensions, 'benchmark')}
                        fill="#6366F1"
                        fillOpacity="0.1"
                        stroke="#6366F1"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />

                      {/* Student Score Polygon */}
                      <polygon
                        points={renderRadarPolygon(data.radarDimensions, 'score')}
                        fill="#F43F5E"
                        fillOpacity="0.25"
                        stroke="#F43F5E"
                        strokeWidth="2"
                      />
                    </svg>

                    {/* Center label */}
                    <div className="absolute text-center">
                      <span className="text-[9px] font-black uppercase text-muted-foreground block">
                        Health
                      </span>
                      <span className="text-xs font-black font-mono text-foreground">
                        {healthScore !== null ? `${healthScore}%` : '–'}
                      </span>
                    </div>
                  </div>

                  {/* Dimension Metrics */}
                  <div className="space-y-3 w-full flex-1">
                    {data.radarDimensions.map((dim, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="font-semibold text-muted-foreground">{dim.dimension}</span>
                          <span className="font-mono font-bold text-foreground flex items-center gap-1.5 shrink-0">
                            <span>{dim.score}%</span>
                            <span className="text-[10px] text-muted-foreground font-normal">
                              (Target: {dim.benchmark}%)
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
                    <span className="text-muted-foreground font-medium">
                      Your Target ({WEAKNESS_CONFIG.TARGET_BENCHMARK}%)
                    </span>
                  </span>
                </div>
              </>
            ) : (
              <div className="p-8 text-center rounded-2xl border border-dashed border-border space-y-2">
                <Target className="w-7 h-7 text-muted-foreground mx-auto" />
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  Not enough data yet. Attempt questions in a few chapters to see this.
                </p>
              </div>
            )}
          </div>

          {lowestRadarDim && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">Lowest dimension:</span>
              <span className="font-bold text-rose-500">
                {lowestRadarDim.dimension} ({lowestRadarDim.score}%)
              </span>
            </div>
          )}
        </Card>
      </div>

      {/* 3. COMMON MISTAKES & RECOVERY TREND SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Global Common Mistakes Card */}
        <Card
          data-tour="weakness-vault-summary"
          className="p-5 sm:p-6 bg-card border border-border shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookX className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <h3 className="font-extrabold text-base text-foreground">Mistake Vault Summary</h3>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              Logged Errors
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/30 space-y-1">
              <span className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400 block">
                ⚡ Formula Error Log
              </span>
              <p className="font-semibold text-foreground">
                {data?.commonMistakesGlobal?.mostForgottenFormula || 'No formula mistakes logged yet'}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/30 space-y-1">
              <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 block">
                🧠 Concept Error Log
              </span>
              <p className="font-semibold text-foreground">
                {data?.commonMistakesGlobal?.mostIncorrectConcept || 'No concept mistakes logged yet'}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-900/30 space-y-1">
              <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 block">
                ❓ Most Frequent Question Type
              </span>
              <p className="font-semibold text-foreground">
                {data?.commonMistakesGlobal?.mostWrongQuestionType || 'No mistake records logged yet'}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-900/30 space-y-1">
              <span className="text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400 block">
                📐 Calculation / Numerical Error Log
              </span>
              <p className="font-semibold text-foreground">
                {data?.commonMistakesGlobal?.mostWrongNumerical || 'No numerical errors logged yet'}
              </p>
            </div>
          </div>
        </Card>

        {/* Weakness Recovery Trend Card */}
        <Card
          data-tour="weakness-trajectory"
          className="p-5 sm:p-6 bg-card border border-border shadow-xs flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-extrabold text-base text-foreground">Weakness Reduction Trajectory</h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Weekly Snapshots
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Weekly snapshots of your weak-chapter share recorded over time:
            </p>

            {data?.recoveryTrend && data.recoveryTrend.length >= 2 ? (
              <div className="flex items-end justify-around gap-3 pt-3 h-36">
                {data.recoveryTrend.map((pt, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1 max-w-[56px]">
                    <span className="font-mono font-bold text-xs text-foreground">
                      {pt.weaknessScore}%
                    </span>
                    <div className="w-full h-24 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 flex items-end">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(8, pt.weaknessScore)}%` }}
                        transition={{ duration: 0.6, delay: i * 0.08 }}
                        className="w-full rounded-lg bg-rose-500/75 dark:bg-rose-500/60"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground truncate max-w-full">
                      {pt.week}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl border border-dashed border-border space-y-2">
                <TrendingDown className="w-7 h-7 text-muted-foreground mx-auto" />
                <div className="text-xs font-bold text-foreground">Tracking starts this week</div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {data?.recoveryTrend?.length === 1
                    ? `Week ${data.recoveryTrend[0].week} baseline saved (${data.recoveryTrend[0].weaknessScore}% weak share). Trajectory chart unlocks once a second weekly snapshot is recorded.`
                    : 'Attempt questions in your chapters to save your first weekly snapshot.'}
                </p>
              </div>
            )}
          </div>

          {data?.recoveryTrendSentence && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground shrink-0">Status:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-right">
                {data.recoveryTrendSentence}
              </span>
            </div>
          )}
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
          <div data-tour="weakness-levels" className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Critical (&lt;40%)
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Weak (40–59%)
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Average (60–74%)
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Strong (75%+)
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              Not started
            </span>
          </div>
        </div>

        {/* Filter Controls */}
        <div
          data-tour="weakness-filters"
          className="p-4 rounded-2xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3"
        >
          {/* Subject Tabs - Horizontal scroll without clipped half-chip */}
          <div
            ref={subjectTabsRef}
            onScroll={updateSubjectTabsFade}
            className="flex items-center gap-1.5 overflow-x-auto scrollbar-none scroll-edge-fade flex-nowrap snap-x snap-mandatory w-full lg:w-auto min-w-0 pb-1 lg:pb-0"
          >
            {['all', 'physics', 'chemistry', 'mathematics'].map((subId) => (
              <button
                key={subId}
                data-active={selectedSubjectFilter === subId}
                onClick={() => setSelectedSubjectFilter(subId)}
                className={`px-3.5 py-2 lg:py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap snap-start min-h-[44px] lg:min-h-0 ${
                  selectedSubjectFilter === subId
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-card text-muted-foreground hover:text-foreground border border-border'
                }`}
              >
                {subId === 'all'
                  ? 'All Subjects'
                  : subId.charAt(0).toUpperCase() + subId.slice(1)}
              </button>
            ))}
          </div>

          {/* Level, Cause, Search */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1 min-w-[160px] lg:w-48">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search chapter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 lg:h-8 pl-8 pr-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-rose-500"
              />
            </div>

            {/* Level Filter */}
            <select
              value={selectedLevelFilter}
              onChange={(e) => setSelectedLevelFilter(e.target.value)}
              className="h-10 lg:h-8 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-foreground focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Levels</option>
              <option value="Critical">Critical</option>
              <option value="Weak">Weak</option>
              <option value="Average">Average</option>
              <option value="Strong">Strong</option>
              <option value="Not started">Not started</option>
            </select>

            {/* Root Cause Filter (Lists ONLY causes that actually occur) */}
            <select
              value={selectedCauseFilter}
              onChange={(e) => setSelectedCauseFilter(e.target.value)}
              className="h-10 lg:h-8 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-foreground focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Causes</option>
              {availableCauses.map((cause) => (
                <option key={cause} value={cause}>
                  {cause}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chapters Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChapters.map((ch, idx) => {
            const levelColor = {
              Critical: 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300',
              Weak: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-300',
              Average: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-300',
              Strong: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300',
              'Very Strong': 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300',
              'Not started': 'bg-card border-border text-foreground',
            }[ch.weaknessLevel] || 'bg-card border-border text-foreground';

            const badgeBg = {
              Critical: 'bg-rose-600 text-white',
              Weak: 'bg-amber-500 text-slate-950 font-bold',
              Average: 'bg-blue-600 text-white',
              Strong: 'bg-emerald-600 text-white',
              'Very Strong': 'bg-emerald-600 text-white',
              'Not started': 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
            }[ch.weaknessLevel] || 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300';

            return (
              <motion.div
                key={ch.chapterId}
                data-tour={idx === 0 ? 'weakness-chapter-card' : undefined}
                whileHover={{ scale: 1.01 }}
                onClick={() => {
                  if (isTourActive()) return;
                  setActiveChapterModal(ch);
                }}
                className={`p-4 rounded-3xl border ${levelColor} shadow-xs hover:shadow-md cursor-pointer transition-all flex flex-col justify-between space-y-3`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                      {ch.subjectName}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {ch.weaknessLevel !== 'Not started' && ch.strengthScore !== null && (
                        <span className="text-[10px] font-mono font-bold text-foreground">
                          Score {ch.strengthScore}%
                        </span>
                      )}
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${badgeBg}`}>
                        {ch.weaknessLevel}
                      </span>
                    </div>
                  </div>

                  {/* Allow chapter names to wrap to 2 lines instead of cutting off */}
                  <h4 className="font-extrabold text-sm text-foreground line-clamp-2 min-h-[2.5rem] leading-snug">
                    {ch.chapterName}
                  </h4>

                  {/* Root Causes tags (Only rendered when signals exist) */}
                  {ch.rootCauses.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {ch.rootCauses.map((rc, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-foreground flex items-center gap-1"
                        >
                          <Zap className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                          <span>{rc.cause}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {ch.whyExplanation}
                  </p>
                </div>

                <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">
                      Recovery:{' '}
                      <strong className="text-foreground">
                        {ch.weaknessLevel === 'Not started' ? '–' : `${ch.estimatedRecoveryDays} Days`}
                      </strong>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-card border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-7 space-y-6 text-foreground"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                      {activeChapterModal.subjectName} • Board Weightage ~{activeChapterModal.weightage} Marks
                    </span>
                    {activeChapterModal.strengthScore !== null && (
                      <span className="text-[10px] font-mono font-bold text-foreground bg-muted px-2 py-0.5 rounded-full">
                        Score {activeChapterModal.strengthScore}%
                      </span>
                    )}
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      {activeChapterModal.weaknessLevel}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-foreground mt-1">
                    {activeChapterModal.chapterName}
                  </h2>
                </div>

                <button
                  onClick={() => setActiveChapterModal(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer text-sm font-bold shrink-0"
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
                    <span>DIAGNOSTIC ASSESSMENT</span>
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
                    <span>TARGET GAP</span>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed font-medium">
                    {activeChapterModal.strengthScore !== null ? (
                      <>
                        Current Score:{' '}
                        <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                          {activeChapterModal.strengthScore}%
                        </strong>
                        . Target is {WEAKNESS_CONFIG.TARGET_BENCHMARK}%+. Need{' '}
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          +{activeChapterModal.improvementNeededPct}%
                        </strong>{' '}
                        improvement.
                      </>
                    ) : (
                      'Not started yet. Attempt practice questions to measure your baseline score.'
                    )}
                  </p>
                </div>

                {/* WHEN to revise */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">
                    <Clock className="w-3.5 h-3.5" />
                    <span>WHEN TO REVISE</span>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed font-medium">
                    <strong className="text-amber-600 dark:text-amber-400">{activeChapterModal.whenToRevise}</strong>. Status: {activeChapterModal.revisionStatus}.
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
              <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
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
                      className="p-2.5 rounded-xl bg-muted/60 border border-border flex items-center justify-between text-xs"
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
