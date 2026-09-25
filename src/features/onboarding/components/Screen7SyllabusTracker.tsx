import React, { useState, useMemo } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { ChapterStatusType, ConfidenceLevel } from '@/types/onboarding';
import {
  ArrowLeft,
  ArrowRight,
  Star,
  CheckCircle,
  AlertTriangle,
  PlayCircle,
  Circle,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Activity,
} from 'lucide-react';

const STATUS_CONFIG: Record<
  ChapterStatusType,
  { label: string; icon: any; activeClass: string; badgeClass: string }
> = {
  'Never Started': {
    label: 'Never Studied',
    icon: Circle,
    activeClass: 'bg-slate-700 text-white border-slate-700 shadow-sm',
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-muted-foreground',
  },
  Started: {
    label: 'Started',
    icon: PlayCircle,
    activeClass: 'bg-blue-600 text-white border-blue-600 shadow-sm',
    badgeClass: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300',
  },
  'Need Revision': {
    label: 'Need Revision',
    icon: AlertTriangle,
    activeClass: 'bg-amber-500 text-white border-amber-500 shadow-sm',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300',
  },
  Completed: {
    label: 'Completed',
    icon: CheckCircle,
    activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-sm',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300',
  },
};

export const Screen7SyllabusTracker: React.FC = () => {
  const {
    chapterProgressMap,
    updateChapterProgress,
    weakSubjectAnalysis,
    selectedSubjectIds,
    nextScreen,
    prevScreen,
    studentDetails,
  } = useOnboarding();

  const chapters = useMemo(() => Object.values(chapterProgressMap), [chapterProgressMap]);

  // Unique subjects from chapters
  const subjectList = useMemo(() => {
    const map = new Map<string, string>();
    for (const ch of chapters) {
      if (!map.has(ch.subjectId)) {
        map.set(ch.subjectId, ch.subjectName);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [chapters]);

  const [activeSubjectTab, setActiveSubjectTab] = useState<string>(() => {
    return subjectList[0]?.id || selectedSubjectIds[0] || 'all';
  });

  const filteredChapters = useMemo(() => {
    if (activeSubjectTab === 'all') return chapters;
    return chapters.filter((c) => c.subjectId === activeSubjectTab);
  }, [chapters, activeSubjectTab]);

  const totalChapters = chapters.length;
  const evaluatedChapters = chapters.filter((c) => c.status !== 'Never Started' || c.confidence !== 3).length;

  return (
    <div className="max-w-4xl mx-auto py-2 sm:py-6 px-3 sm:px-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Complete Syllabus Diagnostic Tracker
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl mx-auto">
          Rate your current progress and confidence on every chapter. Rankify will isolate your weak spots and auto-generate an exam plan.
        </p>
      </div>

      {/* Real-time Weak Subject Analysis HUD */}
      {weakSubjectAnalysis && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-purple-950 to-slate-950 text-white border border-purple-500/20 shadow-xl mb-6 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Diagnostic breakdown */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-purple-200">
                  Live Syllabus Diagnostic Engine
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {/* Weak Subjects */}
                {weakSubjectAnalysis.weakSubjects.length > 0 ? (
                  weakSubjectAnalysis.weakSubjects.map((sub) => (
                    <div
                      key={sub}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40 text-xs font-semibold text-rose-300"
                    >
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>Weak: {sub}</span>
                    </div>
                  ))
                ) : (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-xs text-emerald-300">
                    No critical weak subjects identified
                  </div>
                )}

                {/* Strong Subjects */}
                {weakSubjectAnalysis.strongSubjects.map((sub) => (
                  <div
                    key={sub}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-xs font-semibold text-emerald-300"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Strong: {sub}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Difficulty Score Gauge & Progress */}
            <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-white/10 pt-3 md:pt-0 md:pl-6">
              <div>
                <div className="text-[10px] font-semibold text-purple-200 uppercase tracking-wider flex items-center gap-1">
                  <Activity className="w-3 h-3 text-purple-400" />
                  Difficulty Index
                </div>
                <div className="text-2xl font-extrabold font-mono text-white">
                  {weakSubjectAnalysis.difficultyScore}
                  <span className="text-xs font-normal text-purple-300">/100</span>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold text-purple-200 uppercase tracking-wider">
                  Evaluated
                </div>
                <div className="text-2xl font-extrabold font-mono text-white">
                  {evaluatedChapters}
                  <span className="text-xs font-normal text-purple-300">/{totalChapters}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subject Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveSubjectTab('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
            activeSubjectTab === 'all'
              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
              : 'bg-white/70 dark:bg-slate-900/70 border-slate-200 dark:border-white/10 text-muted-foreground hover:text-foreground'
          }`}
        >
          All Subjects ({chapters.length})
        </button>

        {subjectList.map((sub) => {
          const count = chapters.filter((c) => c.subjectId === sub.id).length;
          return (
            <button
              type="button"
              key={sub.id}
              onClick={() => setActiveSubjectTab(sub.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                activeSubjectTab === sub.id
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-white/70 dark:bg-slate-900/70 border-slate-200 dark:border-white/10 text-muted-foreground hover:text-foreground'
              }`}
            >
              {sub.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Chapters Diagnostic List */}
      <div className="space-y-3 mb-8">
        {filteredChapters.map((ch, idx) => {
          return (
            <div
              key={ch.id}
              className="p-4 sm:p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs transition hover:shadow-md"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Chapter Info */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-300 font-bold">
                      {ch.subjectName}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">
                      Chapter {idx + 1}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-foreground leading-snug">
                    {ch.chapterName}
                  </h3>

                  {ch.topics && ch.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {ch.topics.slice(0, 3).map((topic, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground"
                        >
                          {topic}
                        </span>
                      ))}
                      {ch.topics.length > 3 && (
                        <span className="text-[10px] text-muted-foreground self-center">
                          +{ch.topics.length - 3} more topics
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Status Selector & Confidence */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0">
                  {/* Status Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200/60 dark:border-white/5">
                    {(['Never Started', 'Started', 'Need Revision', 'Completed'] as ChapterStatusType[]).map(
                      (st) => {
                        const isCurrent = ch.status === st;
                        const config = STATUS_CONFIG[st];
                        const Icon = config.icon;
                        return (
                          <button
                            type="button"
                            key={st}
                            onClick={() => updateChapterProgress(ch.id, { status: st })}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                              isCurrent
                                ? config.activeClass
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{config.label}</span>
                          </button>
                        );
                      }
                    )}
                  </div>

                  {/* Confidence 1 - 5 Stars */}
                  <div className="flex items-center gap-1 pl-1">
                    <span className="text-[11px] font-semibold text-muted-foreground mr-1">
                      Confidence:
                    </span>
                    {([1, 2, 3, 4, 5] as ConfidenceLevel[]).map((level) => {
                      const isActive = ch.confidence >= level;
                      return (
                        <button
                          type="button"
                          key={level}
                          onClick={() => updateChapterProgress(ch.id, { confidence: level })}
                          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Star
                            className={`w-4 h-4 transition ${
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
        <Button variant="ghost" onClick={prevScreen} className="gap-2 cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
        <Button
          variant="primary"
          onClick={nextScreen}
          className="gap-2 px-6 h-12 rounded-xl font-bold shadow-lg shadow-purple-600/25 cursor-pointer text-sm"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate AI Study Plan</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
