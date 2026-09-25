import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressPercentage, ConfidenceLevel } from '@/types/onboarding';
import {
  Sparkles,
  Calendar,
  Clock,
  Zap,
  Target,
  CheckCircle2,
  AlertTriangle,
  Star,
  Activity,
  Layers,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  BookOpen,
} from 'lucide-react';

const PROGRESS_PILLS: { value: ProgressPercentage; label: string }[] = [
  { value: 0, label: '0%' },
  { value: 25, label: '25%' },
  { value: 50, label: '50%' },
  { value: 75, label: '75%' },
  { value: 100, label: 'Done' },
];

export const ActiveStudyEngineView: React.FC = () => {
  const { user } = useAuth();
  const {
    aiStudyPlan,
    chapterProgressMap,
    updateChapterProgress,
    weakSubjectAnalysis,
    studentDetails,
    setScreen,
  } = useOnboarding();

  const chapters = Object.values(chapterProgressMap);
  const [selectedSubject, setSelectedSubject] = useState<'All' | 'Physics' | 'Chemistry' | 'Mathematics'>('All');
  const [completedDailyIds, setCompletedDailyIds] = useState<string[]>([]);

  const filteredChapters =
    selectedSubject === 'All'
      ? chapters
      : chapters.filter((c) => c.subjectName === selectedSubject);

  const toggleDailyTarget = (id: string) => {
    setCompletedDailyIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const totalAssessed = chapters.filter((c) => c.progressPercentage > 0).length;
  const overallCoverage =
    chapters.length > 0
      ? Math.round(chapters.reduce((sum, c) => sum + (c.progressPercentage || 0), 0) / chapters.length)
      : 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Active AI Study Plan Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950 p-6 sm:p-10 text-white shadow-2xl border border-purple-500/20">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-3.5 py-1 text-xs font-semibold text-purple-200 border border-white/15">
              <Sparkles className="h-3.5 w-3.5 text-purple-300" />
              <span>CBSE Class 12 PCM Study Engine • 40 Official Chapters</span>
            </div>

            <Button
              variant="glass"
              size="sm"
              onClick={() => setScreen(2)}
              className="text-white border-white/20 hover:bg-white/10 text-xs font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Adjust Routine & Target
            </Button>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Syllabus Tracker & Diagnostic Engine
          </h1>

          <p className="text-sm text-purple-100/90 max-w-2xl leading-relaxed">
            Full official CBSE Class 12 PCM curriculum covering Physics (14), Chemistry (12), and Mathematics (14). Track your progress percentages, confidence levels, and needs-focus topics.
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-purple-200">
                <Target className="w-3.5 h-3.5" />
                <span>Overall Coverage</span>
              </div>
              <div className="text-xl font-extrabold font-mono mt-1">
                {overallCoverage}% Done
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-purple-200">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Assessed Chapters</span>
              </div>
              <div className="text-xl font-extrabold font-mono mt-1">
                {totalAssessed} / {chapters.length}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-purple-200">
                <Activity className="w-3.5 h-3.5 text-rose-300" />
                <span>Needs Focus</span>
              </div>
              <div className="text-xl font-extrabold font-mono mt-1 text-rose-300">
                {chapters.filter((c) => c.needsFocus).length} Chapters
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-purple-200">
                <Calendar className="w-3.5 h-3.5" />
                <span>Target Score</span>
              </div>
              <div className="text-xl font-extrabold font-mono mt-1 text-purple-200">
                {studentDetails.targetPercentage}%
              </div>
            </div>
          </div>
        </div>

        {/* Ambient glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* Complete Syllabus Tracker Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              Interactive 40-Chapter PCM Matrix
            </h2>
            <p className="text-xs text-muted-foreground">
              Every chapter is individually editable. Updates auto-sync to local cache and cloud Firestore.
            </p>
          </div>

          {/* Subject Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {(['All', 'Physics', 'Chemistry', 'Mathematics'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSubject(s)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border whitespace-nowrap ${
                  selectedSubject === s
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-card border-slate-200 dark:border-white/10 text-muted-foreground'
                }`}
              >
                {s === 'All' ? `All (${chapters.length})` : s}
              </button>
            ))}
          </div>
        </div>

        {/* Chapters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredChapters.map((ch) => {
            const currentProgress = ch.progressPercentage ?? 0;

            return (
              <Card key={ch.id} className="p-4 sm:p-5 flex flex-col justify-between space-y-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-xs">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-300">
                      {ch.subjectName}
                    </span>
                    <div className="flex items-center gap-2">
                      {ch.needsFocus && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                          Needs Focus
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground font-mono font-bold">
                        {currentProgress}% Done
                      </span>
                    </div>
                  </div>

                  <h3 className="font-bold text-sm text-foreground">{ch.chapterName}</h3>

                  {ch.topics && ch.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {ch.topics.slice(0, 3).map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono pt-1">
                    <span>Questions: {ch.practiceQuestions || 0}</span>
                    <span>•</span>
                    <span>Revisions: {ch.revisionCount || 0}</span>
                    <span>•</span>
                    <span>Accuracy: {ch.accuracy || 70}%</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  {/* Progress Selector: 0%, 25%, 50%, 75%, Done */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg">
                    {PROGRESS_PILLS.map((p) => {
                      const isCurrent = currentProgress === p.value;
                      return (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => updateChapterProgress(ch.id, { progressPercentage: p.value })}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer border ${
                            isCurrent
                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                              : 'border-transparent text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Confidence Stars */}
                  <div className="flex items-center gap-0.5">
                    {([1, 2, 3, 4, 5] as ConfidenceLevel[]).map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => updateChapterProgress(ch.id, { confidence: star })}
                        className="p-0.5 hover:scale-110 transition cursor-pointer"
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            ch.confidence >= star
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300 dark:text-slate-700'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
