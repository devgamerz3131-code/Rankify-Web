import React, { useState, useMemo } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { ProgressPercentage, ConfidenceLevel } from '@/types/onboarding';
import {
  ArrowLeft,
  ArrowRight,
  Star,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Activity,
  CheckCircle2,
  Layers,
  Circle,
} from 'lucide-react';

const PROGRESS_OPTIONS: { value: ProgressPercentage; label: string; activeClass: string }[] = [
  { value: 0, label: 'Not Started', activeClass: 'bg-slate-700 text-white border-slate-700 shadow-sm' },
  { value: 25, label: '25%', activeClass: 'bg-amber-600 text-white border-amber-600 shadow-sm' },
  { value: 50, label: '50%', activeClass: 'bg-blue-600 text-white border-blue-600 shadow-sm' },
  { value: 75, label: '75%', activeClass: 'bg-indigo-600 text-white border-indigo-600 shadow-sm' },
  { value: 100, label: 'Completed', activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-sm' },
];

export const Screen7SyllabusTracker: React.FC = () => {
  const {
    chapterProgressMap,
    updateChapterProgress,
    weakSubjectAnalysis,
    nextScreen,
    prevScreen,
    setScreen,
    studentDetails,
  } = useOnboarding();

  const chapters = useMemo(() => Object.values(chapterProgressMap), [chapterProgressMap]);

  const [activeTab, setActiveTab] = useState<'all' | 'physics' | 'chemistry' | 'mathematics'>('all');

  const filteredChapters = useMemo(() => {
    if (activeTab === 'all') return chapters;
    return chapters.filter((c) => c.subjectId === activeTab);
  }, [chapters, activeTab]);

  const totalChapters = chapters.length || 40;
  const evaluatedChapters = chapters.filter((c) => c.progressPercentage > 0 || c.confidence !== 3).length;

  const physicsCount = chapters.filter((c) => c.subjectId === 'physics').length;
  const chemistryCount = chapters.filter((c) => c.subjectId === 'chemistry').length;
  const mathCount = chapters.filter((c) => c.subjectId === 'mathematics').length;

  const averageProgress = useMemo(() => {
    if (chapters.length === 0) return 0;
    const sum = chapters.reduce((acc, c) => acc + (c.progressPercentage || 0), 0);
    return Math.round(sum / chapters.length);
  }, [chapters]);

  return (
    <div className="max-w-4xl mx-auto py-2 sm:py-6 px-3 sm:px-4">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-bold text-purple-600 dark:text-purple-300 mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Full-Screen Initial Assessment • CBSE Class 12 PCM</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Chapter-by-Chapter Progress Assessment
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl mx-auto">
          Specify your current completion level and confidence on every chapter. Rankify AI uses this to balance your daily routine and isolate priority revision targets.
        </p>
      </div>

      {/* Live Diagnostic Ribbon */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-purple-950 to-slate-950 text-white border border-purple-500/30 shadow-xl mb-6 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-200">
              Live Syllabus Diagnostic
            </span>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="text-purple-200">
                Average Coverage: <strong className="text-white font-mono text-sm">{averageProgress}%</strong>
              </span>
              <span className="text-purple-200">
                Assessed: <strong className="text-white font-mono text-sm">{evaluatedChapters} / {totalChapters}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="glass"
              size="sm"
              onClick={() => {
                // Quick preset: Mark unstarted as 25% or completed as desired
                chapters.forEach((ch) => {
                  if (ch.progressPercentage === 0) {
                    updateChapterProgress(ch.id, { progressPercentage: 25 });
                  }
                });
              }}
              className="text-[11px] h-8 text-white border-white/20 hover:bg-white/10 cursor-pointer"
            >
              <span>Quick Preset: In-Progress (25%)</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Subject Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
            activeTab === 'all'
              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
              : 'bg-white/70 dark:bg-slate-900/70 border-slate-200 dark:border-white/10 text-muted-foreground hover:text-foreground'
          }`}
        >
          All PCM Chapters ({totalChapters})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('physics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
            activeTab === 'physics'
              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
              : 'bg-white/70 dark:bg-slate-900/70 border-slate-200 dark:border-white/10 text-muted-foreground hover:text-foreground'
          }`}
        >
          Physics ({physicsCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('chemistry')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
            activeTab === 'chemistry'
              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
              : 'bg-white/70 dark:bg-slate-900/70 border-slate-200 dark:border-white/10 text-muted-foreground hover:text-foreground'
          }`}
        >
          Chemistry ({chemistryCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mathematics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
            activeTab === 'mathematics'
              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
              : 'bg-white/70 dark:bg-slate-900/70 border-slate-200 dark:border-white/10 text-muted-foreground hover:text-foreground'
          }`}
        >
          Mathematics ({mathCount})
        </button>
      </div>

      {/* Chapters Assessment List */}
      <div className="space-y-3 mb-8">
        {filteredChapters.map((ch, idx) => {
          const currentProgress = ch.progressPercentage ?? 0;

          return (
            <div
              key={ch.id}
              className="p-4 sm:p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs transition hover:shadow-md"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Chapter Info */}
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-300 font-bold uppercase">
                      {ch.subjectName}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-semibold">
                      Chapter {idx + 1}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-foreground leading-snug">
                    {ch.chapterName}
                  </h3>

                  {ch.topics && ch.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {ch.topics.slice(0, 3).map((topic, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-muted-foreground"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Progress Selector: ○ Not Started, ○ 25%, ○ 50%, ○ 75%, ○ Completed */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
                  <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200/60 dark:border-white/5">
                    {PROGRESS_OPTIONS.map((opt) => {
                      const isSelected = currentProgress === opt.value;
                      return (
                        <button
                          type="button"
                          key={opt.value}
                          onClick={() => updateChapterProgress(ch.id, { progressPercentage: opt.value })}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                            isSelected
                              ? opt.activeClass
                              : 'border-transparent text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <span
                            className={`w-3 h-3 rounded-full flex items-center justify-center border transition ${
                              isSelected
                                ? 'border-white bg-white/20'
                                : 'border-slate-400 dark:border-slate-600 bg-transparent'
                            }`}
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Confidence 1 - 5 Stars */}
                  <div className="flex items-center gap-0.5 pl-1">
                    <span className="text-[10px] font-semibold text-muted-foreground mr-1">
                      Confidence:
                    </span>
                    {([1, 2, 3, 4, 5] as ConfidenceLevel[]).map((level) => {
                      const isActive = ch.confidence >= level;
                      return (
                        <button
                          type="button"
                          key={level}
                          onClick={() => updateChapterProgress(ch.id, { confidence: level })}
                          className="p-1 rounded-md hover:scale-110 transition cursor-pointer"
                        >
                          <Star
                            className={`w-3.5 h-3.5 transition ${
                              isActive
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300 dark:text-slate-700'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Nav Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200/60 dark:border-white/10">
        <Button variant="ghost" onClick={() => setScreen(2)} className="gap-2 cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Routine</span>
        </Button>
        <Button
          variant="primary"
          onClick={() => setScreen(8)}
          className="gap-2 px-6 h-12 rounded-xl font-bold shadow-lg shadow-purple-600/25 cursor-pointer text-sm"
        >
          <Sparkles className="w-4 h-4" />
          <span>Synthesize AI Study Plan</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
