import React, { useState } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import {
  BarChart3,
  Calendar,
  Clock,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Download,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export const StudyReportsView: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const { chapterProgressMap, studentDetails, studyRoutine } = useOnboarding();

  const chapters = Object.values(chapterProgressMap || {});
  const totalChapters = 37;
  const completedChapters = chapters.filter((c) => c.progressPercentage === 100 || c.completion).length;
  const completionPercentage = Math.round((completedChapters / totalChapters) * 100);

  // Subject breakdowns
  const physicsChapters = chapters.filter((c) => c.subjectId === 'physics');
  const chemistryChapters = chapters.filter((c) => c.subjectId === 'chemistry');
  const mathsChapters = chapters.filter((c) => c.subjectId === 'mathematics');

  const physicsHours = period === 'daily' ? 1.5 : period === 'weekly' ? 8.5 : 32.0;
  const chemistryHours = period === 'daily' ? 1.2 : period === 'weekly' ? 7.0 : 26.5;
  const mathsHours = period === 'daily' ? 1.8 : period === 'weekly' ? 9.5 : 36.0;
  const totalHours = (physicsHours + chemistryHours + mathsHours).toFixed(1);

  const weakChapters = chapters.filter((c) => c.confidence <= 2 || c.needsFocus);
  const strongChapters = chapters.filter((c) => c.confidence >= 4);

  const revisionsCount = period === 'daily' ? 1 : period === 'weekly' ? 5 : 18;
  const aiDoubtsCount = period === 'daily' ? 6 : period === 'weekly' ? 24 : 85;
  const averageAccuracy = 78;

  const handleExportReport = () => {
    toast.success(`Academic ${period} report exported!`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white border border-indigo-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <h1 className="text-xl sm:text-2xl font-black">CBSE Class 12 Diagnostic Report</h1>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/40">
              Science PCM
            </span>
          </div>
          <p className="text-xs text-purple-200">
            Comprehensive analytics of your study hours, syllabus mastery, and subject balance.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-white/10 rounded-2xl border border-white/15">
          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                period === p
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-purple-200 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-card/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-purple-600" />
            Hours Studied
          </span>
          <div className="text-2xl font-black text-foreground font-mono">{totalHours}h</div>
          <p className="text-[10px] text-muted-foreground">{period} active study time</p>
        </div>

        <div className="p-4 rounded-2xl bg-card/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Syllabus Covered
          </span>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            {completionPercentage}%
          </div>
          <p className="text-[10px] text-muted-foreground">
            {completedChapters} of 37 Chapters
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-card/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Average Accuracy
          </span>
          <div className="text-2xl font-black text-blue-600 font-mono">{averageAccuracy}%</div>
          <p className="text-[10px] text-muted-foreground">Board PYQ accuracy</p>
        </div>

        <div className="p-4 rounded-2xl bg-card/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            AI Doubts Cleared
          </span>
          <div className="text-2xl font-black text-amber-500 font-mono">{aiDoubtsCount}</div>
          <p className="text-[10px] text-muted-foreground">Concept inquiries resolved</p>
        </div>
      </div>

      {/* Time Distribution across PCM */}
      <div className="p-6 rounded-3xl bg-card/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <span>Time Distribution Across PCM</span>
          </h3>
          <span className="text-xs font-mono font-bold text-muted-foreground">
            Total: {totalHours} Hours
          </span>
        </div>

        {/* Stacked Progress Bar */}
        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
          <div
            className="bg-indigo-500 h-full transition-all"
            style={{ width: `${(physicsHours / Number(totalHours)) * 100}%` }}
            title={`Physics: ${physicsHours}h`}
          />
          <div
            className="bg-pink-500 h-full transition-all"
            style={{ width: `${(chemistryHours / Number(totalHours)) * 100}%` }}
            title={`Chemistry: ${chemistryHours}h`}
          />
          <div
            className="bg-blue-500 h-full transition-all"
            style={{ width: `${(mathsHours / Number(totalHours)) * 100}%` }}
            title={`Mathematics: ${mathsHours}h`}
          />
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40">
            <div className="flex items-center justify-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-300">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span>Physics (042)</span>
            </div>
            <div className="text-lg font-black font-mono mt-1 text-foreground">{physicsHours}h</div>
            <div className="text-[10px] text-muted-foreground">14 Chapters</div>
          </div>

          <div className="p-3 rounded-2xl bg-pink-50 dark:bg-pink-950/40 border border-pink-200/60 dark:border-pink-800/40">
            <div className="flex items-center justify-center gap-1.5 font-bold text-pink-700 dark:text-pink-300">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
              <span>Chemistry (043)</span>
            </div>
            <div className="text-lg font-black font-mono mt-1 text-foreground">{chemistryHours}h</div>
            <div className="text-[10px] text-muted-foreground">10 Chapters</div>
          </div>

          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/40">
            <div className="flex items-center justify-center gap-1.5 font-bold text-blue-700 dark:text-blue-300">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>Mathematics (041)</span>
            </div>
            <div className="text-lg font-black font-mono mt-1 text-foreground">{mathsHours}h</div>
            <div className="text-[10px] text-muted-foreground">13 Chapters</div>
          </div>
        </div>
      </div>

      {/* Weak & Strong Chapters Diagnostic Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Needs Revision / Weak Areas */}
        <div className="p-6 rounded-3xl bg-card/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h4 className="font-bold text-sm text-foreground">Priority Attention Areas</h4>
            </div>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
              {weakChapters.length} Chapters
            </span>
          </div>

          {weakChapters.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              🎉 No low-confidence chapters detected! Keep pacing yourself.
            </p>
          ) : (
            <div className="space-y-2">
              {weakChapters.slice(0, 4).map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-foreground">{c.chapterName}</div>
                    <div className="text-[10px] text-muted-foreground">{c.subjectName}</div>
                  </div>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                    Confidence: {c.confidence}/5
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Strong Subject Areas */}
        <div className="p-6 rounded-3xl bg-card/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <h4 className="font-bold text-sm text-foreground">Mastered Strong Areas</h4>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
              {strongChapters.length} Chapters
            </span>
          </div>

          {strongChapters.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              Complete more revisions and solve PYQs to build high confidence.
            </p>
          ) : (
            <div className="space-y-2">
              {strongChapters.slice(0, 4).map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-foreground">{c.chapterName}</div>
                    <div className="text-[10px] text-muted-foreground">{c.subjectName}</div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                    {c.progressPercentage}% Mastered
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Export / Share actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button onClick={handleExportReport} variant="outline" size="sm" className="text-xs font-bold gap-2 cursor-pointer">
          <Download className="w-3.5 h-3.5" />
          <span>Export Summary Report</span>
        </Button>
      </div>
    </div>
  );
};
