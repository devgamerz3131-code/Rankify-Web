import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChapterStatusType, ConfidenceLevel, ChapterProgress } from '@/types/onboarding';
import {
  Sparkles,
  Calendar,
  Clock,
  Zap,
  Target,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  Circle,
  Star,
  Activity,
  Layers,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  RotateCcw,
} from 'lucide-react';

const STATUS_ICONS: Record<ChapterStatusType, { label: string; icon: any; color: string }> = {
  'Never Started': { label: 'Never Studied', icon: Circle, color: 'text-slate-400' },
  Started: { label: 'Started', icon: PlayCircle, color: 'text-blue-500' },
  'Need Revision': { label: 'Need Revision', icon: AlertTriangle, color: 'text-amber-500' },
  Completed: { label: 'Completed', icon: CheckCircle2, color: 'text-emerald-500' },
};

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
  const subjects = Array.from(new Set(chapters.map((c) => c.subjectName)));
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
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

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Active AI Study Plan Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950 p-6 sm:p-10 text-white shadow-2xl border border-purple-500/20">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-3.5 py-1 text-xs font-semibold text-purple-200 border border-white/15">
              <Sparkles className="h-3.5 w-3.5 text-purple-300" />
              <span>Active AI Study Engine • {studentDetails.board} Class {studentDetails.classNumber}</span>
            </div>

            <Button
              variant="glass"
              size="sm"
              onClick={() => setScreen(4)}
              className="text-white border-white/20 hover:bg-white/10 text-xs font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Adjust Routine & Plan
            </Button>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Welcome back, {studentDetails.name || user?.displayName || 'Student'}
          </h1>

          <p className="text-sm text-purple-100/90 max-w-2xl leading-relaxed">
            Your customized study roadmap is actively balancing your daily targets with school and coaching schedules. Target: <strong>{studentDetails.targetPercentage}%</strong> in {studentDetails.board} examinations.
          </p>

          {/* Quick Metrics */}
          {aiStudyPlan && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                <div className="flex items-center gap-1.5 text-xs text-purple-200">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Daily Study</span>
                </div>
                <div className="text-xl font-extrabold font-mono mt-1">
                  {aiStudyPlan.recommendedStudyHours}h / day
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                <div className="flex items-center gap-1.5 text-xs text-purple-200">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Pomodoro</span>
                </div>
                <div className="text-xl font-extrabold font-mono mt-1">
                  {aiStudyPlan.recommendedSessionLength} mins
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                <div className="flex items-center gap-1.5 text-xs text-purple-200">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Target Finish</span>
                </div>
                <div className="text-sm font-extrabold mt-1 truncate">
                  {aiStudyPlan.expectedCompletionDate}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                <div className="flex items-center gap-1.5 text-xs text-purple-200">
                  <Activity className="w-3.5 h-3.5 text-rose-300" />
                  <span>Priority Focus</span>
                </div>
                <div className="text-xl font-extrabold font-mono mt-1 text-rose-300">
                  {aiStudyPlan.weakChapters.length} Chapters
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ambient glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* Live Diagnostic HUD */}
      {weakSubjectAnalysis && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Diagnostic Health Status
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {weakSubjectAnalysis.weakSubjects.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20"
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  Weak: {s}
                </span>
              ))}
              {weakSubjectAnalysis.strongSubjects.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Strong: {s}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="text-right">
              <span className="text-muted-foreground block text-[10px]">Difficulty Score</span>
              <span className="text-lg font-extrabold font-mono text-foreground">
                {weakSubjectAnalysis.difficultyScore} / 100
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Daily Actionable Targets Checklist */}
      {aiStudyPlan?.dailyTargets && aiStudyPlan.dailyTargets.length > 0 && (
        <Card className="p-5 sm:p-6">
          <CardHeader className="p-0 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Upcoming 7-Day Targets</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Check off completed tasks to maintain your study streak.
                </p>
              </div>
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                {completedDailyIds.length} / {aiStudyPlan.dailyTargets.length} Completed
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0 space-y-2.5">
            {aiStudyPlan.dailyTargets.map((d) => {
              const isDone = completedDailyIds.includes(d.id);
              return (
                <div
                  key={d.id}
                  onClick={() => toggleDailyTarget(d.id)}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    isDone
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30 line-through opacity-70'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-white/5 hover:border-purple-500/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition ${
                        isDone
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                      }`}
                    >
                      {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-foreground">{d.taskTitle}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {d.date} • {d.subjectName}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-semibold text-muted-foreground shrink-0">
                    {d.allocatedMinutes}m
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Complete Syllabus Tracker Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              Interactive Syllabus Tracker
            </h2>
            <p className="text-xs text-muted-foreground">
              Every chapter is individually editable. Updates auto-sync to local cache and cloud Firestore.
            </p>
          </div>

          {/* Subject Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedSubject('All')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                selectedSubject === 'All'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-card border-slate-200 dark:border-white/10 text-muted-foreground'
              }`}
            >
              All ({chapters.length})
            </button>
            {subjects.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSubject(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border whitespace-nowrap ${
                  selectedSubject === s
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-card border-slate-200 dark:border-white/10 text-muted-foreground'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Chapters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredChapters.map((ch) => {
            const statusConfig = STATUS_ICONS[ch.status];
            const StatusIcon = statusConfig.icon;

            return (
              <Card key={ch.id} className="p-4 sm:p-5 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-300">
                      {ch.subjectName}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-semibold">
                      {ch.completionPercentage}% Done
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-foreground">{ch.chapterName}</h3>

                  {ch.topics && ch.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {ch.topics.slice(0, 2).map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  {/* Status Cycle Button */}
                  <div className="flex items-center gap-1.5">
                    {(['Never Started', 'Started', 'Need Revision', 'Completed'] as ChapterStatusType[]).map(
                      (st) => {
                        const isCurrent = ch.status === st;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => updateChapterProgress(ch.id, { status: st })}
                            className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer border ${
                              isCurrent
                                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                                : 'border-transparent text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {st === 'Never Started'
                              ? 'Never'
                              : st === 'Need Revision'
                              ? 'Revise'
                              : st}
                          </button>
                        );
                      }
                    )}
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
