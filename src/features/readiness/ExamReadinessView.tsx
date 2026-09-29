import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { useNavigation } from '@/contexts/NavigationContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { readinessService } from '@/services/readiness-service';
import { notificationEngine } from '@/services/notification-service';
import {
  ExamReadinessData,
  ChapterReadiness,
  SubjectReadiness,
  ReadinessRating,
  ChapterReadinessStatus,
  ImprovementAction,
} from '@/types/readiness';
import {
  ShieldCheck,
  Award,
  Calendar,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  BookOpen,
  ArrowRight,
  Flame,
  Zap,
  Info,
  Search,
  Filter,
  Sliders,
  ChevronDown,
  Sparkles,
  BookX,
  ExternalLink,
  Check,
  Activity,
  Layers,
  BarChart3,
  Compass,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export const ExamReadinessView: React.FC = () => {
  const { user } = useAuth();
  const { setActiveTab } = useNavigation();
  const { chapterProgressMap, upcomingExam, studentDetails } = useOnboarding();

  const [readiness, setReadiness] = useState<ExamReadinessData | null>(() =>
    readinessService.getCachedData()
  );
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [selectedSubjectTab, setSelectedSubjectTab] = useState<string>('all');
  const [chapterStatusFilter, setChapterStatusFilter] = useState<string>('all');
  const [chapterSearchQuery, setChapterSearchQuery] = useState<string>('');
  const [selectedChapterDetail, setSelectedChapterDetail] = useState<ChapterReadiness | null>(null);

  // Exam Target edit state
  const [showExamModal, setShowExamModal] = useState(false);
  const [editExamName, setEditExamName] = useState<string>(upcomingExam?.examType || 'CBSE Class 12 Boards');
  const [editExamDate, setEditExamDate] = useState<string>(
    upcomingExam?.examDate || new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  useEffect(() => {
    const userId = user?.uid || 'guest';
    const chapters = Object.values(chapterProgressMap || {});
    readinessService.init(userId).then((data) => {
      setReadiness(data);
    });

    const unsub = readinessService.subscribe((data) => {
      setReadiness(data);
    });

    return () => unsub();
  }, [user?.uid]);

  // Recalculate if user changes progress
  useEffect(() => {
    const chapters = Object.values(chapterProgressMap || {});
    if (chapters.length > 0) {
      const data = readinessService.recalculateReadiness(chapters, undefined, upcomingExam);
      setReadiness(data);
    }
  }, [chapterProgressMap, upcomingExam]);

  const handleManualRecalculate = async () => {
    setIsRecalculating(true);
    const chapters = Object.values(chapterProgressMap || {});
    const updated = readinessService.recalculateReadiness(chapters, undefined, upcomingExam);
    setReadiness(updated);

    // Trigger motivational readiness notification
    if (updated.overallScore >= 80) {
      notificationEngine.triggerNotification(
        '🏆 Exam Readiness High Score!',
        `Your overall exam readiness is at ${updated.overallScore}% (${updated.rating}). Keep up the momentum!`,
        'readiness-update'
      );
    }

    setTimeout(() => {
      setIsRecalculating(false);
      toast.success('Readiness scores recalculated with latest student data!', { icon: '🎯' });
    }, 600);
  };

  const handleUpdateExam = (e: React.FormEvent) => {
    e.preventDefault();
    readinessService.updateExamTarget(editExamName, editExamDate);
    setShowExamModal(false);
  };

  const handleToggleAction = (actionId: string) => {
    readinessService.completeActionItem(actionId);
  };

  const handleActionClick = (action: ImprovementAction) => {
    if (action.actionType === 'mistakes') {
      setActiveTab('mistakes' as any);
    } else if (action.actionType === 'practice' || action.actionType === 'pyq') {
      setActiveTab('practice');
    } else {
      setActiveTab('study');
    }
  };

  // Color config based on readiness rating
  const rating = readiness?.rating || 'Excellent';
  const ratingThemes = {
    Excellent: {
      badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
      ringColor: '#10B981',
      glowBg: 'from-emerald-950/80 via-slate-900 to-indigo-950/90',
      textColor: 'text-emerald-400',
    },
    Good: {
      badgeBg: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
      ringColor: '#3B82F6',
      glowBg: 'from-blue-950/80 via-slate-900 to-indigo-950/90',
      textColor: 'text-blue-400',
    },
    Average: {
      badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
      ringColor: '#F59E0B',
      glowBg: 'from-amber-950/80 via-slate-900 to-indigo-950/90',
      textColor: 'text-amber-400',
    },
    'Needs Improvement': {
      badgeBg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
      ringColor: '#F43F5E',
      glowBg: 'from-rose-950/80 via-slate-900 to-indigo-950/90',
      textColor: 'text-rose-400',
    },
  }[rating];

  // Filtered chapters for chapter list & heatmap
  const filteredChapters = useMemo(() => {
    if (!readiness?.chapters) return [];
    return readiness.chapters.filter((ch) => {
      // Subject filter
      if (selectedSubjectTab !== 'all' && ch.subjectId.toLowerCase() !== selectedSubjectTab.toLowerCase()) {
        return false;
      }
      // Status filter
      if (chapterStatusFilter !== 'all' && ch.status !== chapterStatusFilter) {
        return false;
      }
      // Search query
      if (chapterSearchQuery.trim()) {
        const q = chapterSearchQuery.toLowerCase();
        return (
          ch.chapterName.toLowerCase().includes(q) ||
          ch.subjectName.toLowerCase().includes(q) ||
          ch.weakTopics.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [readiness?.chapters, selectedSubjectTab, chapterStatusFilter, chapterSearchQuery]);

  const score = readiness?.overallScore || 83;
  const examMode = readiness?.examMode;
  const subjects = readiness?.subjects ? Object.values(readiness.subjects) : [];

  // SVG Circular calculation
  const circleRadius = 52;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* 1. Header Hero Card with Circular Gauge & Strategy Mode */}
      <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br ${ratingThemes.glowBg} text-white border border-indigo-500/30 shadow-2xl`}>
        {/* Glow circles */}
        <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Top navigation row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-indigo-200">
                <ShieldCheck className="w-4 h-4 text-indigo-300" />
                <span>Rankify Exam Readiness Engine</span>
              </div>

              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black uppercase tracking-wider ${ratingThemes.badgeBg}`}>
                <Award className="w-3.5 h-3.5" />
                <span>{rating} ({score}%)</span>
              </span>

              {examMode && (
                <button
                  onClick={() => setShowExamModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition-colors cursor-pointer"
                  title="Click to edit exam date"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{examMode.badgeText}</span>
                  <ChevronDown className="w-3 h-3 text-amber-300/80 ml-0.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleManualRecalculate}
                disabled={isRecalculating}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
                <span>Recalculate Score</span>
              </button>
            </div>
          </div>

          {/* Main Hero Split: Gauge + Mission Title */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 pt-2">
            <div className="space-y-2 flex-1">
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                Exam Readiness: <span className={ratingThemes.textColor}>{score}%</span>
              </h1>
              <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed max-w-2xl font-medium">
                {readiness?.whyThisScore?.summary ||
                  'Your preparation is quantified from completed syllabus chapters, question accuracy, spaced revision frequency, formula recall, and error counts.'}
              </p>

              {/* Exam Mode Strategic Banner */}
              {examMode && (
                <div className="p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-amber-500/30 mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-extrabold text-amber-300 uppercase tracking-wider">
                      <Flame className="w-4 h-4 text-amber-400" />
                      <span>{examMode.phaseTitle}</span>
                    </div>
                    <span className="text-[11px] font-mono text-amber-200/80">
                      Target: {examMode.targetExam}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {examMode.strategySummary}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {examMode.recommendedActions.slice(0, 3).map((act, i) => (
                      <span
                        key={i}
                        className="text-[11px] bg-white/10 text-amber-100 px-2.5 py-0.5 rounded-lg border border-white/10"
                      >
                        ✓ {act}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Circular Gauge */}
            <div className="relative flex items-center justify-center shrink-0 self-center lg:self-auto">
              <svg className="w-36 h-36 sm:w-40 sm:h-40 -rotate-90 transform">
                <circle
                  cx="50%"
                  cy="50%"
                  r={circleRadius}
                  className="text-white/10"
                  strokeWidth="9"
                  stroke="currentColor"
                  fill="transparent"
                />
                <motion.circle
                  cx="50%"
                  cy="50%"
                  r={circleRadius}
                  stroke={ratingThemes.ringColor}
                  strokeWidth="9"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${ratingThemes.textColor}`}>
                  {score}%
                </span>
                <span className="text-[11px] font-extrabold uppercase text-slate-300 tracking-wider">
                  {rating}
                </span>
                <span className="text-[9px] text-indigo-300/80 font-mono mt-0.5">
                  100% Real Data
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-indigo-200">
                <Target className="w-3.5 h-3.5 text-indigo-300" />
                <span>Current Prep</span>
              </div>
              <div className="text-xl font-black font-mono mt-1 text-white">
                {readiness?.prediction?.currentPreparation || score}%
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-indigo-200">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
                <span>Expected by Exam</span>
              </div>
              <div className="text-xl font-black font-mono mt-1 text-emerald-300">
                {readiness?.prediction?.expectedReadiness || score + 6}%
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-indigo-200">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />
                <span>High Priority</span>
              </div>
              <div className="text-sm font-extrabold mt-1 text-rose-200 truncate">
                {readiness?.prediction?.highPrioritySubjects?.join(', ') || 'None'}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-indigo-200">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
                <span>Target Score Band</span>
              </div>
              <div className="text-sm font-extrabold mt-1 text-purple-200 truncate">
                {readiness?.prediction?.predictedScoreBand || '90-95% Target'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SUBJECT SCORES SECTION (Physics, Chemistry, Mathematics) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-black text-foreground">Subject Readiness Breakdown</h3>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            Calculated separately with 6-metric multi-factor scoring
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {subjects.map((sub) => {
            const subRatingColors = {
              Excellent: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
              Good: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
              Average: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
              'Needs Improvement': 'text-rose-500 bg-rose-500/10 border-rose-500/20',
            }[sub.rating];

            return (
              <Card
                key={sub.subjectId}
                className="p-5 sm:p-6 bg-card/80 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div className="space-y-4">
                  {/* Subject Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: sub.color }}
                        />
                        <h4 className="text-base font-extrabold text-foreground">{sub.subjectName}</h4>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {sub.totalChapters} chapters • {sub.totalQuestionsSolved} questions solved
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-black font-mono text-foreground">
                        {sub.overallScore}%
                      </div>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${subRatingColors}`}
                      >
                        {sub.rating}
                      </span>
                    </div>
                  </div>

                  {/* 6 Sub-Metrics Breakdown Bars */}
                  <div className="space-y-2.5 pt-2">
                    {/* Progress % */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground font-medium">Progress (Syllabus)</span>
                        <span className="font-mono font-bold text-foreground">{sub.progressPercent}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                          style={{ width: `${sub.progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Confidence % */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground font-medium">Confidence Level</span>
                        <span className="font-mono font-bold text-foreground">{sub.confidencePercent}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-purple-500 transition-all duration-500"
                          style={{ width: `${sub.confidencePercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Revision % */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground font-medium">Revision Recency</span>
                        <span className="font-mono font-bold text-foreground">{sub.revisionPercent}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-500 transition-all duration-500"
                          style={{ width: `${sub.revisionPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Practice % */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground font-medium">Practice & Accuracy</span>
                        <span className="font-mono font-bold text-foreground">{sub.practicePercent}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${sub.practicePercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Formula % */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground font-medium">Formula Mastery</span>
                        <span className="font-mono font-bold text-foreground">{sub.formulaPercent}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                          style={{ width: `${sub.formulaPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Mock % */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground font-medium">Mock Performance</span>
                        <span className="font-mono font-bold text-foreground">{sub.mockPercent}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-rose-500 transition-all duration-500"
                          style={{ width: `${sub.mockPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subject Footer Tag */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-500 font-bold">
                      {sub.masteredChapters} Mastered
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-rose-500 font-bold">
                      {sub.weakChapters} Weak
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedSubjectTab(sub.subjectId);
                      const el = document.getElementById('chapters-heat-map');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>View Chapters</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 3. WHY THIS SCORE (Diagnostic Explanations) & IMPROVEMENT PLAN (Top 5 Actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: WHY THIS SCORE */}
        <Card className="p-5 sm:p-6 bg-card/80 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-extrabold text-base text-foreground">Why This Score?</h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                Deep Diagnostics
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Every score point is derived from your real study logs. Here are the root reasons driving your current exam readiness:
            </p>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {readiness?.whyThisScore?.diagnostics.map((diag) => {
                const diagColors = {
                  critical: 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300',
                  warning: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-300',
                  positive: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300',
                }[diag.type];

                const icon = {
                  critical: <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />,
                  warning: <Clock className="w-4 h-4 text-amber-500 shrink-0" />,
                  positive: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
                }[diag.type];

                return (
                  <div
                    key={diag.id}
                    className={`p-3 rounded-2xl border ${diagColors} text-xs space-y-1`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-extrabold">
                        {icon}
                        <span>{diag.title}</span>
                      </div>
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10">
                        {diag.metric}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pl-5">
                      {diag.description}
                    </p>

                    {diag.actionableStep && (
                      <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400 pl-5 pt-0.5 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                        <span>Fix: {diag.actionableStep}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Actionable bottlenecks:</span>
            <span className="font-bold text-rose-500">
              {readiness?.whyThisScore?.criticalPointsCount || 0} critical issues to fix
            </span>
          </div>
        </Card>

        {/* Right: TOP 5 IMPROVEMENT PLAN */}
        <Card className="p-5 sm:p-6 bg-card/80 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="font-extrabold text-base text-foreground">Top 5 Improvement Actions</h3>
              </div>
              <span className="text-[10px] font-mono font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded border border-purple-500/20">
                High Impact
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Completing these 5 targeted actions will maximize your expected exam readiness by{' '}
              <strong className="text-emerald-500">+{readiness?.prediction?.potentialGain || 12}%</strong>:
            </p>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {readiness?.improvementPlan.map((act) => (
                <div
                  key={act.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    act.isCompleted
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30 line-through opacity-70'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-white/5 hover:border-purple-500/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <button
                        onClick={() => handleToggleAction(act.id)}
                        className={`w-5 h-5 rounded-md border mt-0.5 flex items-center justify-center text-xs cursor-pointer ${
                          act.isCompleted
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 hover:border-purple-500'
                        }`}
                      >
                        {act.isCompleted && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-foreground">
                            {act.rank}. {act.title}
                          </span>
                          <span
                            className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                              act.priority === 'Critical'
                                ? 'bg-rose-500/10 text-rose-500'
                                : 'bg-amber-500/10 text-amber-500'
                            }`}
                          >
                            {act.priority}
                          </span>
                        </div>

                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {act.description}
                        </p>

                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {act.estimatedMinutes} mins
                          </span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            +{act.impactPercentage}% Readiness
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleActionClick(act)}
                      className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold shrink-0 shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <span>Start</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Pace projection:</span>
            <span className="font-bold text-purple-600 dark:text-purple-400">
              {readiness?.prediction?.paceStatus || 'On Track'}
            </span>
          </div>
        </Card>
      </div>

      {/* 4. CHAPTER READINESS & INTERACTIVE HEAT MAP */}
      <div id="chapters-heat-map" className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-lg font-black text-foreground">Chapter Readiness & Heat Map</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Every single chapter evaluated for Confidence (0–100%) and Status (Mastered, Ready, Needs Revision, Needs Practice, Weak).
            </p>
          </div>

          {/* Quick Heat Map Legend */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Mastered
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Ready
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Needs Revision
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Needs Practice
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Weak
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 rounded-2xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Subject Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {['all', 'physics', 'chemistry', 'mathematics'].map((subId) => (
              <button
                key={subId}
                onClick={() => setSelectedSubjectTab(subId)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedSubjectTab === subId
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground'
                }`}
              >
                {subId === 'all'
                  ? 'All Subjects'
                  : subId.charAt(0).toUpperCase() + subId.slice(1)}
              </button>
            ))}
          </div>

          {/* Status & Search */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-56">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search chapter..."
                value={chapterSearchQuery}
                onChange={(e) => setChapterSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Status Dropdown */}
            <select
              value={chapterStatusFilter}
              onChange={(e) => setChapterStatusFilter(e.target.value)}
              className="h-8 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-foreground focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Mastered">Mastered</option>
              <option value="Ready">Ready</option>
              <option value="Needs Revision">Needs Revision</option>
              <option value="Needs Practice">Needs Practice</option>
              <option value="Weak">Weak</option>
            </select>
          </div>
        </div>

        {/* Visual Chapter Heat Map Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredChapters.map((ch) => {
            const statusConfig = {
              Mastered: {
                bg: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
                badgeBg: 'bg-emerald-500 text-white',
              },
              Ready: {
                bg: 'bg-green-500/10 hover:bg-green-500/20 border-green-500/30 text-green-600 dark:text-green-400',
                badgeBg: 'bg-green-600 text-white',
              },
              'Needs Revision': {
                bg: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-600 dark:text-amber-400',
                badgeBg: 'bg-amber-500 text-slate-950 font-bold',
              },
              'Needs Practice': {
                bg: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-600 dark:text-blue-400',
                badgeBg: 'bg-blue-600 text-white',
              },
              Weak: {
                bg: 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-600 dark:text-rose-400',
                badgeBg: 'bg-rose-600 text-white',
              },
            }[ch.status];

            return (
              <motion.div
                key={ch.chapterId}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedChapterDetail(ch)}
                className={`p-3.5 rounded-2xl border ${statusConfig.bg} backdrop-blur-xs flex flex-col justify-between cursor-pointer transition-all min-h-[110px]`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                      {ch.subjectName}
                    </span>
                    <span
                      className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${statusConfig.badgeBg}`}
                    >
                      {ch.status}
                    </span>
                  </div>

                  <h5 className="font-extrabold text-xs text-foreground line-clamp-2 leading-tight">
                    {ch.chapterName}
                  </h5>
                </div>

                <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-muted-foreground">Confidence</span>
                  <span className="font-mono font-black text-foreground">
                    {ch.confidence}%
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredChapters.length === 0 && (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
            <Layers className="w-8 h-8 text-muted-foreground mx-auto" />
            <div className="font-bold text-sm text-foreground">No chapters match this filter</div>
            <p className="text-xs text-muted-foreground">
              Try choosing "All Statuses" or clearing your search query.
            </p>
          </div>
        )}
      </div>

      {/* 5. WEEKLY TREND CHART & SUMMARY */}
      <Card className="p-5 sm:p-6 bg-card/80 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-extrabold text-base text-foreground">Readiness Progression (7 Days)</h3>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            Steady upward trajectory • Target 95%+
          </span>
        </div>

        {/* Weekly Trend Bar Simulation */}
        <div className="grid grid-cols-7 gap-2.5 sm:gap-4 pt-4 pb-2">
          {readiness?.weeklyTrend.map((pt, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <span className="font-mono font-bold text-xs text-foreground">{pt.score}%</span>
              <div className="w-full max-w-[48px] h-32 rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 flex items-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${pt.score}%` }}
                  transition={{ duration: 0.8, delay: i * 0.08 }}
                  className={`w-full rounded-lg ${
                    i === 6
                      ? 'bg-gradient-to-t from-indigo-600 to-purple-500 shadow-md'
                      : 'bg-indigo-500/60 dark:bg-indigo-500/40'
                  }`}
                />
              </div>
              <span className="text-[11px] font-bold text-muted-foreground">{pt.day}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* MODAL: CHAPTER DETAIL DRAWER */}
      <AnimatePresence>
        {selectedChapterDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl bg-card border border-slate-200 dark:border-white/10 shadow-2xl p-6 space-y-5 text-foreground"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    {selectedChapterDetail.subjectName}
                  </span>
                  <h3 className="text-lg font-black text-foreground mt-0.5">
                    {selectedChapterDetail.chapterName}
                  </h3>
                </div>

                <button
                  onClick={() => setSelectedChapterDetail(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Status and Confidence */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/5 space-y-1">
                  <div className="text-[10px] text-muted-foreground font-bold uppercase">
                    Status
                  </div>
                  <div className="text-base font-extrabold text-foreground">
                    {selectedChapterDetail.status}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/5 space-y-1">
                  <div className="text-[10px] text-muted-foreground font-bold uppercase">
                    Confidence
                  </div>
                  <div className="text-base font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                    {selectedChapterDetail.confidence}%
                  </div>
                </div>
              </div>

              {/* Diagnostic Parameters */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-muted-foreground">Syllabus Completed</span>
                  <span className="font-mono font-bold">{selectedChapterDetail.syllabusCompleted}%</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-muted-foreground">Question Accuracy</span>
                  <span className="font-mono font-bold">{selectedChapterDetail.accuracy}%</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-muted-foreground">Questions Attempted</span>
                  <span className="font-mono font-bold">{selectedChapterDetail.questionsAttempted}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-muted-foreground">Last Revised</span>
                  <span className="font-bold text-amber-500">
                    {selectedChapterDetail.lastRevisedDaysAgo} days ago
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-muted-foreground">Unresolved Mistakes in Notebook</span>
                  <span className={`font-bold ${selectedChapterDetail.unresolvedMistakes > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {selectedChapterDetail.unresolvedMistakes} active error(s)
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Board Exam Weightage</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">
                    ~{selectedChapterDetail.weightage} marks
                  </span>
                </div>
              </div>

              {/* Weak Topics */}
              {selectedChapterDetail.weakTopics.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-rose-500 uppercase tracking-wide">
                    Identified Weak Subtopics
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedChapterDetail.weakTopics.map((topic, i) => (
                      <span
                        key={i}
                        className="text-xs bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-lg border border-rose-500/20"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    setSelectedChapterDetail(null);
                    setActiveTab('study');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Start Revision</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedChapterDetail(null);
                    setActiveTab('practice');
                  }}
                  className="px-4 py-2.5 rounded-xl border border-indigo-600/40 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Practice Questions</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT EXAM TARGET */}
      <AnimatePresence>
        {showExamModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-card border border-slate-200 dark:border-white/10 shadow-2xl p-6 space-y-4 text-foreground"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-extrabold text-base text-foreground">Configure Target Exam</h3>
                </div>
                <button
                  onClick={() => setShowExamModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateExam} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Target Exam Name</label>
                  <input
                    type="text"
                    value={editExamName}
                    onChange={(e) => setEditExamName(e.target.value)}
                    placeholder="e.g. CBSE Class 12 Boards, JEE Main 2026"
                    required
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Exam Date</label>
                  <input
                    type="date"
                    value={editExamDate}
                    onChange={(e) => setEditExamDate(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowExamModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    Save & Update Strategy
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
