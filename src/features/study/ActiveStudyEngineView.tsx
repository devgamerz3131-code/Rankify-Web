import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressPercentage, ConfidenceLevel } from '@/types/onboarding';
import {
  Sparkles,
  Target,
  CheckCircle2,
  RotateCcw,
  BookOpen,
  Activity,
  Calendar,
  Star,
} from 'lucide-react';
import {
  getSubjectChapterCounts,
  formatAccuracyDisplay,
} from '@/services/chapter-service';

const PROGRESS_PILLS: { value: ProgressPercentage; label: string }[] = [
  { value: 0, label: '0%' },
  { value: 25, label: '25%' },
  { value: 50, label: '50%' },
  { value: 75, label: '75%' },
  { value: 100, label: 'Done' },
];

export const ActiveStudyEngineView: React.FC = () => {
  const {
    chapterProgressMap,
    updateChapterProgress,
    studentDetails,
    setScreen,
  } = useOnboarding();

  const chapters = Object.values(chapterProgressMap);
  const chapterCounts = getSubjectChapterCounts();
  const [selectedSubject, setSelectedSubject] = useState<'All' | 'Physics' | 'Chemistry' | 'Mathematics'>('All');
  const [completedDailyIds, setCompletedDailyIds] = useState<string[]>([]);
  const subjectTabsRef = useRef<HTMLDivElement>(null);

  const updateSubjectFade = useCallback(() => {
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
    updateSubjectFade();
    window.addEventListener('resize', updateSubjectFade);
    return () => window.removeEventListener('resize', updateSubjectFade);
  }, [selectedSubject, updateSubjectFade]);

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
      <div className="rounded-2xl bg-slate-900 p-6 sm:p-10 text-white shadow-xl border border-slate-800">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-900 px-3.5 py-1 text-xs font-semibold text-purple-200 border border-purple-800">
              <Sparkles className="h-3.5 w-3.5 text-purple-300" />
              <span>CBSE Class 12 PCM Study Engine • {chapters.length || chapterCounts.total} Official Chapters</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setScreen(2)}
              className="text-white border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Adjust Routine & Target
            </Button>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Syllabus Tracker & Diagnostic Engine
          </h1>

          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Full official CBSE Class 12 PCM curriculum covering Physics ({chapterCounts.physics}), Chemistry ({chapterCounts.chemistry}), and Mathematics ({chapterCounts.mathematics}). Track your progress percentages, confidence levels, and needs-focus topics.
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
            <div className="p-3.5 rounded-xl bg-slate-800 border border-slate-700">
              <div className="flex items-center gap-1.5 text-xs text-purple-200">
                <Target className="w-3.5 h-3.5" />
                <span>Overall Coverage</span>
              </div>
              <div className="text-xl font-extrabold font-mono mt-1 text-white">
                {overallCoverage}% Done
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800 border border-slate-700">
              <div className="flex items-center gap-1.5 text-xs text-purple-200">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Assessed Chapters</span>
              </div>
              <div className="text-xl font-extrabold font-mono mt-1 text-white">
                {totalAssessed} / {chapters.length}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800 border border-slate-700">
              <div className="flex items-center gap-1.5 text-xs text-rose-300">
                <Activity className="w-3.5 h-3.5 text-rose-300" />
                <span>Needs Focus</span>
              </div>
              <div className="text-xl font-extrabold font-mono mt-1 text-rose-300">
                {chapters.filter((c) => c.needsFocus).length} Chapters
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800 border border-slate-700">
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
      </div>

      {/* Complete Syllabus Tracker Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              Interactive PCM Chapter Matrix
            </h2>
            <p className="text-xs text-muted-foreground">
              Every chapter is individually editable. Updates auto-sync to local cache and cloud Firestore.
            </p>
          </div>

          {/* Subject Filter Pills */}
          <div
            ref={subjectTabsRef}
            onScroll={updateSubjectFade}
            className="flex items-center gap-1.5 overflow-x-auto flex-nowrap snap-x snap-mandatory pb-1 scrollbar-none scroll-edge-fade min-w-0"
          >
            {[
              { id: 'All', label: `All (${chapters.length || chapterCounts.total})` },
              { id: 'Physics', label: `Physics (${chapters.filter((c) => c.subjectName === 'Physics').length || chapterCounts.physics})` },
              { id: 'Chemistry', label: `Chemistry (${chapters.filter((c) => c.subjectName === 'Chemistry').length || chapterCounts.chemistry})` },
              { id: 'Mathematics', label: `Mathematics (${chapters.filter((c) => c.subjectName === 'Mathematics').length || chapterCounts.mathematics})` },
            ].map((s) => (
              <button
                key={s.id}
                data-active={selectedSubject === s.id}
                onClick={() => setSelectedSubject(s.id as any)}
                className={`px-3.5 py-2 lg:py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border shrink-0 whitespace-nowrap snap-start min-h-[44px] lg:min-h-0 ${
                  selectedSubject === s.id
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-card border-slate-200 dark:border-white/10 text-muted-foreground'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chapters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredChapters.map((ch) => {
            const currentProgress = ch.progressPercentage ?? 0;
            const attempted = (ch as any).attempted ?? (ch as any).questionsAttempted ?? ch.practiceQuestions ?? ch.questionSolved ?? 0;
            const correct = (ch as any).correct ?? (ch as any).questionsCorrect;
            const accResult = formatAccuracyDisplay(attempted, correct, ch.accuracy);

            return (
              <Card key={ch.id} className="p-4 sm:p-5 flex flex-col justify-between space-y-4 bg-card border-border shadow-xs">
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
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {ch.topics.slice(0, 3).map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2.5 py-0.5 rounded-md bg-muted text-foreground/90 border border-border font-semibold"
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
                    <span>
                      Accuracy:{' '}
                      <span
                        aria-label={accResult.ariaLabel}
                        className="inline-block min-w-[3ch] text-center font-bold"
                      >
                        {accResult.display}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-2">
                  {/* Progress Selector: 0%, 25%, 50%, 75%, Done */}
                  <div className="grid grid-cols-5 sm:flex items-center gap-1 bg-muted p-1 rounded-xl border border-border">
                    {PROGRESS_PILLS.map((p) => {
                      const isCurrent = currentProgress === p.value;
                      return (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => updateChapterProgress(ch.id, { progressPercentage: p.value })}
                          className={`min-h-[44px] min-w-[44px] lg:min-h-0 lg:min-w-0 px-2 py-1.5 lg:py-0.5 flex items-center justify-center rounded-lg lg:rounded-md text-xs lg:text-[10px] font-bold transition cursor-pointer border whitespace-nowrap ${
                            isCurrent
                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                              : 'border-transparent text-foreground/80 hover:text-foreground hover:bg-card'
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Confidence Stars */}
                  <div className="flex items-center justify-end gap-0.5">
                    {([1, 2, 3, 4, 5] as ConfidenceLevel[]).map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => updateChapterProgress(ch.id, { confidence: star })}
                        className="min-w-[44px] min-h-[44px] lg:min-w-0 lg:min-h-0 p-2 lg:p-0.5 flex items-center justify-center rounded-lg hover:scale-110 transition cursor-pointer"
                      >
                        <Star
                          className={`w-4 h-4 lg:w-3.5 lg:h-3.5 ${
                            ch.confidence >= star
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-400 dark:text-slate-500'
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
