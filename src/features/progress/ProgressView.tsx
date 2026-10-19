import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  Award,
  Clock,
  Target,
  BookOpen,
  ArrowRight,
  Brain,
  Bookmark,
  History,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Sparkles,
} from 'lucide-react';
import { questionGeneratorService } from '@/services/question-generator-service';
import { TOTAL_OFFICIAL_CHAPTERS } from '@/services/chapter-service';

export const ProgressView: React.FC = () => {
  const { studentDetails, chapterProgressMap, upcomingExam } = useOnboarding();
  const { setActiveTab } = useNavigation();

  const [stats] = useState(() => questionGeneratorService.getStats());

  const chapters = Object.values(chapterProgressMap || {});
  const totalChapters = chapters.length || TOTAL_OFFICIAL_CHAPTERS;
  const completedChapters = chapters.filter(
    (c) => c.status === 'Completed' || c.progressPercentage === 100
  ).length;

  const physicsChapters = chapters.filter((c) => c.subjectName === 'Physics');
  const chemChapters = chapters.filter((c) => c.subjectName === 'Chemistry');
  const mathChapters = chapters.filter((c) => c.subjectName === 'Mathematics');

  const calcSubjectCoverage = (subChapters: typeof chapters) => {
    if (!subChapters.length) return 0;
    const total = subChapters.reduce((acc, cur) => acc + (cur.progressPercentage || 0), 0);
    return Math.round(total / subChapters.length);
  };

  const physicsCoverage = calcSubjectCoverage(physicsChapters);
  const chemCoverage = calcSubjectCoverage(chemChapters);
  const mathCoverage = calcSubjectCoverage(mathChapters);

  const overallCoverage =
    chapters.length > 0
      ? Math.round(chapters.reduce((sum, c) => sum + (c.progressPercentage || 0), 0) / chapters.length)
      : 0;

  // Days remaining
  const daysRemaining = upcomingExam?.examDate
    ? Math.max(
        0,
        Math.ceil((new Date(upcomingExam.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      )
    : 74;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 select-none">
      {/* Header Banner */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-white border border-purple-500/25 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-bold border border-white/15">
              <TrendingUp className="w-3.5 h-3.5 text-purple-300" />
              <span>Academic Performance & Mastery Deck</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Progress & Analytics
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/80 max-w-xl">
              Track your CBSE Class 12 syllabus coverage, board readiness rating, practice test accuracy, and chapter mastery in one place.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setActiveTab('tools')}
              className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer"
            >
              <span>Explore Analytics Tools</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* 4 Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 relative z-10">
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10">
            <span className="text-[11px] text-purple-200 font-semibold block">Syllabus Coverage</span>
            <div className="text-2xl font-black text-white font-mono mt-0.5">{overallCoverage}%</div>
            <p className="text-[10px] text-purple-200/70">{completedChapters} of {totalChapters} chapters</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10">
            <span className="text-[11px] text-purple-200 font-semibold block">Target Score</span>
            <div className="text-2xl font-black text-emerald-300 font-mono mt-0.5">
              {studentDetails.targetPercentage || 95}%
            </div>
            <p className="text-[10px] text-purple-200/70">Class 12 Boards</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10">
            <span className="text-[11px] text-purple-200 font-semibold block">Avg Practice Accuracy</span>
            <div className="text-2xl font-black text-purple-300 font-mono mt-0.5">
              {stats.averageAccuracy || 78}%
            </div>
            <p className="text-[10px] text-purple-200/70">{stats.questionsAttempted || 30} questions solved</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10">
            <span className="text-[11px] text-purple-200 font-semibold block">Days Remaining</span>
            <div className="text-2xl font-black text-amber-300 font-mono mt-0.5">
              {daysRemaining}
            </div>
            <p className="text-[10px] text-purple-200/70">Board Countdown</p>
          </div>
        </div>
      </div>

      {/* Subject-Wise Mastery Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-600" />
            <h2 className="text-base font-bold text-foreground">Subject Progress Breakdown</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('study')}
            className="text-xs text-purple-600 dark:text-purple-400 font-bold p-0 h-auto cursor-pointer"
          >
            <span>Open Syllabus Engine</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Physics */}
          <Card className="p-5 bg-card border border-border rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">Physics</span>
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                {physicsCoverage}% Complete
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${physicsCoverage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              14 Chapters • Optics, Electrostatics & Modern Physics
            </p>
          </Card>

          {/* Chemistry */}
          <Card className="p-5 bg-card border border-border rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">Chemistry</span>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {chemCoverage}% Complete
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${chemCoverage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              10 Chapters • Physical, Inorganic & Organic Chemistry
            </p>
          </Card>

          {/* Mathematics */}
          <Card className="p-5 bg-card border border-border rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">Mathematics</span>
              <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                {mathCoverage}% Complete
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-purple-600 rounded-full transition-all duration-500"
                style={{ width: `${mathCoverage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              13 Chapters • Calculus, Vectors, 3D Geometry & Matrices
            </p>
          </Card>
        </div>
      </div>

      {/* Advanced Diagnostics Direct Launchers */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-foreground">Deep Diagnostic Engines</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card
            onClick={() => setActiveTab('readiness')}
            className="p-4 bg-card border border-border rounded-2xl hover:border-purple-500/50 transition-all cursor-pointer space-y-2 group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Award className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-foreground group-hover:text-purple-600 transition-colors">
              Exam Readiness Engine
            </h3>
            <p className="text-[11px] text-muted-foreground line-clamp-2">
              Deterministic scoring of your current board probability based on syllabus & tests.
            </p>
          </Card>

          <Card
            onClick={() => setActiveTab('weakness')}
            className="p-4 bg-card border border-border rounded-2xl hover:border-purple-500/50 transition-all cursor-pointer space-y-2 group"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Brain className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-foreground group-hover:text-purple-600 transition-colors">
              Weakness Analyzer
            </h3>
            <p className="text-[11px] text-muted-foreground line-clamp-2">
              Pinpoints exact conceptual bottlenecks and prescribes remedial problem sets.
            </p>
          </Card>

          <Card
            onClick={() => setActiveTab('mistakes')}
            className="p-4 bg-card border border-border rounded-2xl hover:border-purple-500/50 transition-all cursor-pointer space-y-2 group"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Bookmark className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-foreground group-hover:text-purple-600 transition-colors">
              Mistake Notebook
            </h3>
            <p className="text-[11px] text-muted-foreground line-clamp-2">
              Reviews wrong answers and formula slips with automatic spaced repetition.
            </p>
          </Card>

          <Card
            onClick={() => setActiveTab('replay')}
            className="p-4 bg-card border border-border rounded-2xl hover:border-purple-500/50 transition-all cursor-pointer space-y-2 group"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <History className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-foreground group-hover:text-purple-600 transition-colors">
              Study Replay
            </h3>
            <p className="text-[11px] text-muted-foreground line-clamp-2">
              Visual diary tracking your daily study sessions, focus times, and revision events.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
