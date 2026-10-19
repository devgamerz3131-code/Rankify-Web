import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Target,
  Clock,
  Zap,
  Brain,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Award,
  Layers,
  ChevronRight,
  Play,
  Flame,
} from 'lucide-react';
import { useNavigation } from '@/contexts/NavigationContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { questionGeneratorService } from '@/services/question-generator-service';
import { QuestionGeneratorStats } from '@/types/question-generator';
import { computeAccuracy, getChapterById } from '@/services/chapter-service';

export const TodaysAiPracticeCard: React.FC = () => {
  const { setActiveTab } = useNavigation();
  const { weakSubjectAnalysis, chapterProgressMap } = useOnboarding();
  const [stats, setStats] = useState<QuestionGeneratorStats>(() => questionGeneratorService.getStats());

  useEffect(() => {
    return questionGeneratorService.subscribe((updated) => {
      setStats(updated);
    });
  }, []);

  // Determine weak chapter dynamically (skip unattempted chapters from accuracy check)
  const weakChapters = Object.values(chapterProgressMap).filter((c) => {
    const attempted = (c as any).attempted ?? (c as any).questionsAttempted ?? c.practiceQuestions ?? c.questionSolved ?? 0;
    const acc = computeAccuracy(attempted, (c as any).correct ?? (c as any).questionsCorrect, c.accuracy);
    return c.needsFocus || (acc !== null && acc < 70);
  });
  const firstWeak = weakChapters[0];
  const primaryWeakChapter = firstWeak
    ? getChapterById(firstWeak.chapterName || firstWeak.id).name
    : weakSubjectAnalysis?.weakSubjects?.[0]
    ? `${weakSubjectAnalysis.weakSubjects[0]} High-Yield`
    : 'Electrochemistry & Ray Optics';

  const recommendedCount = 15;
  const estimatedTime = '22 mins';
  const difficultyDisplay = 'Adaptive • Board Standard';
  const practiceScore = stats.todayPracticeScore || 82;

  const handleStartPractice = () => {
    setActiveTab('practice');
  };

  return (
    <Card className="relative overflow-hidden p-6 sm:p-7 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 border-purple-500/30 shadow-2xl text-white rounded-3xl group">
      {/* Card Header & Tag */}
      <div className="relative z-10 space-y-5">
        {/* Top Tag & Status */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-purple-200">
            <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
            <span>AI Practice Engine</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] text-emerald-300 font-mono">Calibrated</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
              <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{stats.streakDays || 5} Day Drill Streak</span>
            </span>
          </div>
        </div>

        {/* Card Title & Pitch */}
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
            <Target className="w-7 h-7 text-purple-400 shrink-0" />
            <span>Today's AI Practice</span>
          </h2>
          <p className="text-xs sm:text-sm text-purple-200/90 max-w-xl leading-relaxed">
            Rankify Brain crafted your personalized daily practice set, targeting your most forgotten formulas, recent mistakes, and board-standard competency patterns.
          </p>
        </div>

        {/* 5 Core Required Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          {/* 1. Recommended Questions */}
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xs text-purple-200 font-medium">
              <Layers className="w-3.5 h-3.5 text-purple-300" />
              <span>Recommended</span>
            </div>
            <div className="mt-2">
              <div className="text-xl font-black font-mono text-white">
                {recommendedCount} <span className="text-xs font-normal text-purple-300">Questions</span>
              </div>
              <p className="text-[10px] text-purple-200/70 mt-0.5">MCQ + Numerical + HOTS</p>
            </div>
          </div>

          {/* 2. Estimated Time */}
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xs text-purple-200 font-medium">
              <Clock className="w-3.5 h-3.5 text-cyan-300" />
              <span>Estimated Time</span>
            </div>
            <div className="mt-2">
              <div className="text-xl font-black font-mono text-cyan-300">
                {estimatedTime}
              </div>
              <p className="text-[10px] text-purple-200/70 mt-0.5">~1.5 min per question</p>
            </div>
          </div>

          {/* 3. Difficulty */}
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xs text-purple-200 font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Difficulty</span>
            </div>
            <div className="mt-2">
              <div className="text-sm font-extrabold text-amber-300 truncate">
                {difficultyDisplay}
              </div>
              <p className="text-[10px] text-purple-200/70 mt-0.5">Auto-adjusts real-time</p>
            </div>
          </div>

          {/* 4. Weak Chapter */}
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 flex flex-col justify-between col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 text-xs text-rose-300 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Weak Chapter</span>
            </div>
            <div className="mt-2">
              <div className="text-xs font-bold text-white line-clamp-1">
                {primaryWeakChapter}
              </div>
              <p className="text-[10px] text-rose-300/80 mt-0.5">High Weightage Focus</p>
            </div>
          </div>

          {/* 5. Practice Score */}
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 flex flex-col justify-between col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-medium">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>Practice Score</span>
            </div>
            <div className="mt-2">
              <div className="text-xl font-black font-mono text-emerald-300">
                {practiceScore}%
              </div>
              <p className="text-[10px] text-emerald-300/80 mt-0.5">Target: 90%+ Mastery</p>
            </div>
          </div>
        </div>

        {/* Action Button Ribbon */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-purple-200 font-medium">
            <Brain className="w-4 h-4 text-purple-400" />
            <span>Includes step-by-step AI explanations, formula recalls & NCERT page references</span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              onClick={handleStartPractice}
              variant="primary"
              className="bg-white hover:bg-purple-50 text-purple-950 font-black px-6 py-2.5 rounded-2xl shadow-xl shadow-purple-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-purple-950 text-purple-950" />
              <span>Start Today's Practice</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
