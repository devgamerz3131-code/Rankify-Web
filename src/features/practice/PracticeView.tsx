import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
  CheckCircle2,
  XCircle,
  RotateCcw,
  Bookmark,
  BookOpen,
  HelpCircle,
  Filter,
  Check,
  Share2,
  FileText,
  Sliders,
  Eye,
  BookX,
  Video,
  Shield,
  BarChart3,
  Timer,
  ChevronDown,
  Hash,
  Star,
  RefreshCw,
  Trophy,
  ExternalLink,
  MessageSquare,
  Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { computeAccuracy, getChapterById } from '@/services/chapter-service';

import {
  SmartQuestion,
  PracticeSetConfiguration,
  PracticeSessionResult,
  QuestionDifficulty,
  ExamMode,
  QuestionType,
  QuestionBookmarkItem,
  QuestionGeneratorStats,
  LeaderboardStudent,
  UserQuestionAnswer,
} from '@/types/question-generator';
import { questionGeneratorService } from '@/services/question-generator-service';
import { mistakeService } from '@/services/mistake-service';

export const PracticeView: React.FC = () => {
  const { chapterProgressMap, weakSubjectAnalysis } = useOnboarding();
  const { setActiveTab } = useNavigation();
  const { user } = useAuth();

  // Active top navigation tab
  const [activeViewTab, setActiveViewTab] = useState<'generator' | 'session' | 'analysis' | 'bookmarks' | 'stats'>('generator');

  // Generator & Session State
  const [currentConfig, setCurrentConfig] = useState<PracticeSetConfiguration>(() => {
    const gen = questionGeneratorService.generatePracticeSet();
    return gen.configuration;
  });
  const [sessionQuestions, setSessionQuestions] = useState<SmartQuestion[]>(() => {
    const gen = questionGeneratorService.generatePracticeSet();
    return gen.questions;
  });

  // Test Runner State
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [numericalInput, setNumericalInput] = useState('');
  const [shortAnswerSelfAssessed, setShortAnswerSelfAssessed] = useState<boolean | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [userAnswers, setUserAnswers] = useState<UserQuestionAnswer[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [elapsedSessionSeconds, setElapsedSessionSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Adaptive difficulty tracking
  const [difficultyHistory, setDifficultyHistory] = useState<('Easy' | 'Medium' | 'Hard')[]>(['Medium']);

  // Results State
  const [lastSessionResult, setLastSessionResult] = useState<PracticeSessionResult | null>(null);

  // Bookmarks & Stats State
  const [bookmarks, setBookmarks] = useState<QuestionBookmarkItem[]>(() => questionGeneratorService.getBookmarks());
  const [stats, setStats] = useState<QuestionGeneratorStats>(() => questionGeneratorService.getStats());
  const [leaderboard, setLeaderboard] = useState<LeaderboardStudent[]>(() => questionGeneratorService.getLeaderboard());
  const [leaderboardEnabled, setLeaderboardEnabled] = useState(true);

  // Subscribe to service updates
  useEffect(() => {
    if (user?.uid) {
      questionGeneratorService.initUser(user.uid);
    }
    return questionGeneratorService.subscribe((updatedStats) => {
      setStats(updatedStats);
      setBookmarks(questionGeneratorService.getBookmarks());
    });
  }, [user?.uid]);

  // Session stopwatch timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && activeViewTab === 'session') {
      interval = setInterval(() => {
        setElapsedSessionSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, activeViewTab]);

  // Helper for current question
  const currentQ: SmartQuestion | undefined = sessionQuestions[currentQuestionIdx];

  // -------------------------------------------------------------
  // GENERATOR CONTROLS: Preset & Custom Generator
  // -------------------------------------------------------------
  const handleGenerateSet = (
    options: {
      count?: number;
      mode?: ExamMode;
      subject?: 'All' | 'Physics' | 'Chemistry' | 'Mathematics';
      difficulty?: QuestionDifficulty;
      isRapidQuiz?: boolean;
    } = {}
  ) => {
    const weakList = Object.values(chapterProgressMap)
      .filter((c) => {
        const attempted = (c as any).attempted ?? (c as any).questionsAttempted ?? c.practiceQuestions ?? c.questionSolved ?? 0;
        const acc = computeAccuracy(attempted, (c as any).correct ?? (c as any).questionsCorrect, c.accuracy);
        return c.needsFocus || (acc !== null && acc < 70);
      })
      .map((c) => getChapterById(c.chapterName || c.id).name);

    const generated = questionGeneratorService.generatePracticeSet(
      {
        questionCount: options.count || currentConfig.questionCount,
        mode: options.mode || currentConfig.mode,
        subject: options.subject || currentConfig.subject,
        difficulty: options.difficulty || currentConfig.difficulty,
        title: options.isRapidQuiz ? 'Rapid Recall 5-Min Quiz' : undefined,
      },
      {
        weakChapters: weakList,
        weakSubjects: weakSubjectAnalysis?.weakSubjects,
        targetPercentage: 90,
      }
    );

    setCurrentConfig(generated.configuration);
    setSessionQuestions(generated.questions);
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setNumericalInput('');
    setShortAnswerSelfAssessed(null);
    setIsAnswerRevealed(false);
    setUserAnswers([]);
    setQuestionStartTime(Date.now());
    setElapsedSessionSeconds(0);
    setIsTimerRunning(true);
    setDifficultyHistory([generated.questions[0]?.difficulty || 'Medium']);
    setActiveViewTab('session');
    toast.success(`Generated ${generated.questions.length} questions calibrated for you!`, { icon: '🎯' });
  };

  // -------------------------------------------------------------
  // TEST RUNNER ANSWER SUBMISSION & ADAPTIVE EVALUATION
  // -------------------------------------------------------------
  const handleSubmitAnswer = (submittedAnswer?: any) => {
    if (!currentQ || isAnswerRevealed) return;

    const timeSpent = Math.max(1, Math.round((Date.now() - questionStartTime) / 1000));
    let isCorrect = false;

    // Evaluate based on question type
    if (currentQ.type === 'MCQ' || currentQ.type === 'Competency Based' || currentQ.type === 'Assertion Reason' || currentQ.type === 'True False') {
      const chosenIdx = submittedAnswer !== undefined ? submittedAnswer : selectedOption;
      if (chosenIdx === null) {
        toast.error('Please select an option first');
        return;
      }
      isCorrect = chosenIdx === currentQ.correctOptionIndex;
    } else if (currentQ.type === 'Numerical') {
      const studentVal = parseFloat(numericalInput.trim());
      const correctVal = parseFloat(String(currentQ.correctAnswer).trim());
      const tolerance = currentQ.numericalTolerance || 0.05;
      isCorrect = Math.abs(studentVal - correctVal) <= tolerance;
    } else {
      // Short Answer, Long Answer, Case based rubric self-assessment
      isCorrect = submittedAnswer === true;
    }

    setIsAnswerRevealed(true);

    const currentDiff = difficultyHistory[difficultyHistory.length - 1] || currentQ.difficulty;
    const answerRecord: UserQuestionAnswer = {
      questionId: currentQ.id,
      studentAnswer:
        currentQ.type === 'Numerical'
          ? numericalInput
          : selectedOption !== null && currentQ.options
          ? currentQ.options[selectedOption]
          : isCorrect
          ? 'Correctly Solved'
          : 'Incorrect',
      isCorrect,
      timeSpentSeconds: timeSpent,
      difficultyWhenPresented: currentDiff,
      mistakeTypeFlagged: !isCorrect
        ? timeSpent < 10
          ? 'Silly Mistake'
          : currentQ.explanation.formulaUsed
          ? 'Formula Error'
          : 'Concept Error'
      : undefined,
    };

    setUserAnswers((prev) => [...prev, answerRecord]);

    // Adaptive difficulty update
    if (currentConfig.difficulty === 'Adaptive') {
      const nextDiff = questionGeneratorService.calculateAdaptiveDifficulty(difficultyHistory, isCorrect);
      setDifficultyHistory((prev) => [...prev, nextDiff]);
    }

    if (isCorrect) {
      toast.success('Correct Answer! +15 XP', { icon: '🎯' });
    } else {
      // Auto-save to Mistake Notebook
      mistakeService
        .saveMistake({
          question: currentQ.question,
          correctAnswer: String(currentQ.correctAnswer),
          studentAnswer: String(answerRecord.studentAnswer),
          explanation: currentQ.explanation.correctSolution,
          subject: currentQ.subject,
          chapter: currentQ.chapter,
          topic: currentQ.topic,
          difficulty: currentQ.difficulty,
          questionType:
            currentQ.type === 'MCQ'
              ? 'MCQ'
              : currentQ.type === 'Numerical'
              ? 'Numerical'
              : currentQ.type === 'Long Answer'
              ? 'Derivation'
              : 'Conceptual',
          source: 'Smart Question Generator Engine',
        })
        .catch(console.error);

      toast.error('Saved to Mistake Notebook for Spaced Recall 📕', { icon: '💡' });
    }
  };

  // Next Question or Finish
  const handleNextQuestion = () => {
    if (currentQuestionIdx + 1 < sessionQuestions.length) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setSelectedOption(null);
      setNumericalInput('');
      setShortAnswerSelfAssessed(null);
      setIsAnswerRevealed(false);
      setQuestionStartTime(Date.now());
    } else {
      handleFinishSession();
    }
  };

  // Finish Session & Compute Auto Follow-Up
  const handleFinishSession = async () => {
    setIsTimerRunning(false);
    const correctCount = userAnswers.filter((a) => a.isCorrect).length;
    const wrongCount = userAnswers.filter((a) => !a.isCorrect).length;
    const skippedCount = Math.max(0, sessionQuestions.length - userAnswers.length);

    const sessionPayload: PracticeSessionResult = {
      id: `session_${Date.now()}`,
      title: currentConfig.title,
      timestamp: new Date().toISOString(),
      totalQuestions: sessionQuestions.length,
      attemptedCount: userAnswers.length,
      correctCount,
      wrongCount,
      skippedCount,
      accuracyPercentage: Math.round((correctCount / Math.max(1, sessionQuestions.length)) * 100),
      totalTimeSeconds: elapsedSessionSeconds,
      averageTimePerQuestionSeconds: Math.round(elapsedSessionSeconds / Math.max(1, userAnswers.length)),
      speedRating: 'Optimal',
      confidenceRating: 'High',
      weakConceptsIdentified: [],
      formulaMistakes: [],
      carelessMistakes: [],
      score: correctCount,
      maxScore: sessionQuestions.length,
      earnedXP: 0,
      mode: currentConfig.mode,
      subject: currentConfig.subject,
      adaptiveDifficultyTraversed: difficultyHistory,
      answers: userAnswers,
      recommendations: {
        mistakesRecordedCount: wrongCount,
      },
    };

    const finalResult = await questionGeneratorService.recordSessionResult(sessionPayload);
    setLastSessionResult(finalResult);
    setActiveViewTab('analysis');

    if (finalResult.accuracyPercentage >= 75) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#6366f1', '#10b981'],
      });
    }
  };

  // Toggle Bookmark
  const handleToggleBookmark = (status: 'starred' | 'difficult' | 'doubt' | 'retry_later') => {
    if (!currentQ) return;
    questionGeneratorService.toggleBookmark(currentQ, status);
    setBookmarks(questionGeneratorService.getBookmarks());
  };

  const isCurrentBookmarked = currentQ ? questionGeneratorService.isBookmarked(currentQ.id) : false;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* 1. Header Banner & Material 3 View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Target className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Smart Question Generator Engine
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Personalized board questions synthesized from your weak areas, mistake notebook & CBSE competency blueprints.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-white/5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveViewTab('generator')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeViewTab === 'generator'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Generator</span>
          </button>

          {sessionQuestions.length > 0 && (
            <button
              onClick={() => setActiveViewTab('session')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeViewTab === 'session'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Active Test ({currentQuestionIdx + 1}/{sessionQuestions.length})</span>
            </button>
          )}

          {lastSessionResult && (
            <button
              onClick={() => setActiveViewTab('analysis')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeViewTab === 'analysis'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analysis & Follow-Up</span>
            </button>
          )}

          <button
            onClick={() => setActiveViewTab('bookmarks')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeViewTab === 'bookmarks'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Bookmarks ({bookmarks.length})</span>
          </button>

          <button
            onClick={() => setActiveViewTab('stats')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeViewTab === 'stats'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Telemetry</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: AI GENERATOR DECK                                  */}
      {/* ========================================================= */}
      {activeViewTab === 'generator' && (
        <div className="space-y-6">
          {/* Hero Action Card */}
          <Card className="p-6 sm:p-8 bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-950 text-white rounded-2xl border-purple-500/25 shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-purple-200 border border-white/10 flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-purple-300" />
                  <span>Synthesized with Rankify Brain & Study DNA</span>
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
                  Zero Generic Sets
                </span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black">
                  Craft Your Custom CBSE Class 12 Practice Drill
                </h2>
                <p className="text-xs sm:text-sm text-purple-200/80 max-w-xl mt-1">
                  Choose your question count, target subject, exam mode, and difficulty. The engine dynamically scans your mistake notebook and weakest chapters to generate high-yield questions.
                </p>
              </div>

              {/* Quick Launch Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {[
                  { count: 10, label: '10 Questions', time: '15 mins', desc: 'Standard Drill' },
                  { count: 20, label: '20 Questions', time: '30 mins', desc: 'Half Paper' },
                  { count: 30, label: '30 Questions', time: '45 mins', desc: 'Power Revision' },
                  { count: 50, label: '50 Questions', time: '75 mins', desc: 'Full Mock Set' },
                ].map((preset) => (
                  <button
                    key={preset.count}
                    onClick={() => handleGenerateSet({ count: preset.count })}
                    className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all text-left space-y-1 cursor-pointer group hover:scale-[1.02]"
                  >
                    <div className="text-xs font-black text-white group-hover:text-purple-200 flex items-center justify-between">
                      <span>{preset.label}</span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                    </div>
                    <div className="text-[11px] text-purple-300 font-mono font-bold">{preset.time}</div>
                    <div className="text-[10px] text-purple-200/70">{preset.desc}</div>
                  </button>
                ))}
              </div>

              {/* Rapid Revision & Competency Mode Launchers */}
              <div className="pt-2 flex flex-wrap gap-2.5">
                <Button
                  onClick={() => handleGenerateSet({ count: 5, isRapidQuiz: true })}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs gap-1.5 cursor-pointer shadow-md"
                >
                  <Zap className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Rapid Revision Quiz (5 Questions)</span>
                </Button>

                <Button
                  onClick={() => handleGenerateSet({ count: 10, mode: 'competency-mode' })}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs gap-1.5 cursor-pointer shadow-md"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>100% Competency Mode (CBSE 2024 Blueprint)</span>
                </Button>

                <Button
                  onClick={() => handleGenerateSet({ count: 10, mode: 'pyq-style' })}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs gap-1.5 cursor-pointer shadow-md"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Past 10 Years PYQ Drill</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* Granular Practice Configurator */}
          <Card className="p-6 bg-card border-border rounded-2xl shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-base text-foreground">Custom Practice Configurator</h3>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">Adjust parameters anytime</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 1. Subject */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Target Subject
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['All', 'Physics', 'Chemistry', 'Mathematics'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setCurrentConfig((prev) => ({ ...prev, subject: s }))}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                        currentConfig.subject === s
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-card border-slate-200 dark:border-white/10 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Exam Mode */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Exam Mode
                </label>
                <select
                  value={currentConfig.mode}
                  onChange={(e) => setCurrentConfig((prev) => ({ ...prev, mode: e.target.value as ExamMode }))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-card text-foreground text-xs font-bold cursor-pointer"
                >
                  <option value="board-practice">Board Practice (Standard Blueprint)</option>
                  <option value="chapter-test">Chapter Test (Single Focus)</option>
                  <option value="unit-test">Unit Test (Combined Chapters)</option>
                  <option value="half-yearly">Half Yearly Compilation</option>
                  <option value="pre-board">Pre Board Simulation</option>
                  <option value="final-revision">Final High-Yield Revision</option>
                  <option value="mock-test">Timed Mock Test</option>
                  <option value="pyq-style">PYQ Style (Previous 10 Years)</option>
                  <option value="competency-mode">Competency Mode (Analytical)</option>
                </select>
              </div>

              {/* 3. Difficulty */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Difficulty Level
                </label>
                <select
                  value={currentConfig.difficulty}
                  onChange={(e) =>
                    setCurrentConfig((prev) => ({ ...prev, difficulty: e.target.value as QuestionDifficulty }))
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-card text-foreground text-xs font-bold cursor-pointer"
                >
                  <option value="Adaptive">Adaptive (AI auto-levels in real time)</option>
                  <option value="Easy">Easy (Foundation Recall)</option>
                  <option value="Easy + Medium">Easy + Medium (Balanced)</option>
                  <option value="Medium">Medium (Board Standard)</option>
                  <option value="Medium + Hard">Medium + Hard (Topper Drill)</option>
                  <option value="Hard">Hard (HOTS & Complex Derivations)</option>
                </select>
              </div>
            </div>

            {/* Smart Targeting Badges */}
            <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/30 space-y-2">
              <span className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-purple-600" />
                <span>Active Smart Targeting Criteria</span>
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800/50 text-purple-800 dark:text-purple-300">
                  🎯 Targeting Weakest Chapter: Electrochemistry
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800/50 text-purple-800 dark:text-purple-300">
                  🔢 Incorporating Forgotten Formula: Nernst Eq & Lens Maker
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800/50 text-purple-800 dark:text-purple-300">
                  📕 Injecting Recent Mistakes: 3 Spaced Drills
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => handleGenerateSet()}
                variant="primary"
                className="px-8 py-2.5 rounded-xl font-bold cursor-pointer gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Generate & Start Test</span>
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ACTIVE PRACTICE SESSION (Test Runner)             */}
      {/* ========================================================= */}
      {activeViewTab === 'session' && currentQ && (
        <Card className="p-6 sm:p-8 bg-card border-border rounded-2xl shadow-lg space-y-6">
          {/* Header Ribbon: Progress, Timer, Adaptive Pill & Bookmarks */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-xs font-mono">
                {currentQ.subject} • {currentQ.chapter}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-muted-foreground">
                {currentQ.type}
              </span>
              {currentQ.yearOrTag && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {currentQ.yearOrTag}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              {/* Adaptive difficulty indicator */}
              <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-foreground border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-amber-500" />
                <span>Level: {difficultyHistory[difficultyHistory.length - 1] || currentQ.difficulty}</span>
              </span>

              {/* Session Stopwatch */}
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-muted-foreground px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {Math.floor(elapsedSessionSeconds / 60)}:
                  {(elapsedSessionSeconds % 60).toString().padStart(2, '0')}
                </span>
              </div>

              {/* Bookmark & Actions Dropdown / Quick Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleToggleBookmark('starred')}
                  title="Bookmark Question"
                  className={`p-2 rounded-xl transition cursor-pointer border ${
                    isCurrentBookmarked
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-500'
                      : 'border-slate-200 dark:border-slate-700 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Star className={`w-4 h-4 ${isCurrentBookmarked ? 'fill-amber-500' : ''}`} />
                </button>
                <button
                  onClick={() => handleToggleBookmark('doubt')}
                  title="Mark as Doubt"
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-muted-foreground hover:text-rose-500 transition cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Question Progress Indicator */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
              <span>
                Question <strong>{currentQuestionIdx + 1}</strong> of {sessionQuestions.length}
              </span>
              <span>
                {Math.round(((currentQuestionIdx + 1) / sessionQuestions.length) * 100)}% Complete
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIdx + 1) / sessionQuestions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Case Study Passage (if case-based) */}
          {currentQ.casePassage && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Case Study Passage
              </span>
              <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans">
                {currentQ.casePassage}
              </p>
            </div>
          )}

          {/* Assertion & Reason Box (if Assertion Reason) */}
          {currentQ.assertion && currentQ.reason && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/30 space-y-1">
                <span className="text-[10px] font-bold uppercase text-purple-700 dark:text-purple-300">
                  Assertion (A)
                </span>
                <p className="text-xs sm:text-sm font-medium text-foreground">{currentQ.assertion}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-800/30 space-y-1">
                <span className="text-[10px] font-bold uppercase text-indigo-700 dark:text-indigo-300">
                  Reason (R)
                </span>
                <p className="text-xs sm:text-sm font-medium text-foreground">{currentQ.reason}</p>
              </div>
            </div>
          )}

          {/* Main Question Text */}
          <div className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-foreground leading-snug">
              {currentQ.question}
            </h2>
            {currentQ.competencySkill && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                <Sparkles className="w-3 h-3" />
                <span>Skill Assessed: {currentQ.competencySkill}</span>
              </span>
            )}
          </div>

          {/* Interactive Answer Input based on Type */}
          {/* 1. MCQ / Competency / Assertion-Reason Options */}
          {currentQ.options && currentQ.options.length > 0 && (
            <div className="space-y-2.5">
              {currentQ.options.map((opt, idx) => {
                let btnStyle = 'border-slate-200 dark:border-slate-800 bg-card hover:border-purple-500/50 text-foreground';

                if (isAnswerRevealed) {
                  if (idx === currentQ.correctOptionIndex) {
                    btnStyle = 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold';
                  } else if (idx === selectedOption) {
                    btnStyle = 'bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300 line-through';
                  } else {
                    btnStyle = 'opacity-50 border-slate-200 dark:border-slate-800 text-muted-foreground';
                  }
                } else if (selectedOption === idx) {
                  btnStyle = 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-bold';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isAnswerRevealed}
                    onClick={() => setSelectedOption(idx)}
                    className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm font-medium transition cursor-pointer flex items-center justify-between ${btnStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold font-mono shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt}</span>
                    </div>

                    {isAnswerRevealed && idx === currentQ.correctOptionIndex && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    {isAnswerRevealed && idx === selectedOption && idx !== currentQ.correctOptionIndex && (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* 2. Numerical Input */}
          {currentQ.type === 'Numerical' && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
              <label className="text-xs font-bold text-foreground">
                Enter Calculated Value ({currentQ.numericalUnit || 'Standard Units'}):
              </label>
              <div className="flex items-center gap-2 max-w-sm">
                <input
                  type="text"
                  disabled={isAnswerRevealed}
                  value={numericalInput}
                  onChange={(e) => setNumericalInput(e.target.value)}
                  placeholder="e.g. 1.10"
                  className="flex-1 p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-card font-mono text-sm font-bold text-foreground"
                />
                {currentQ.numericalUnit && (
                  <span className="text-xs font-mono font-bold text-muted-foreground px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                    {currentQ.numericalUnit}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 3. Short / Long Answer Rubric Self-Assessment */}
          {(currentQ.type === 'Short Answer' || currentQ.type === 'Long Answer' || currentQ.type === 'Match the Following') && !isAnswerRevealed && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
              <p className="text-xs text-muted-foreground">
                Solve this comprehensive question on your paper or mentally, then click <strong>"Check Solution & Rubric"</strong> to verify your derivation steps.
              </p>
            </div>
          )}

          {/* AI EXPLANATION BOX (Revealed after submission) */}
          {isAnswerRevealed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 pt-2"
            >
              {/* Correct Solution Breakdown */}
              <div className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 text-xs sm:text-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-purple-900 dark:text-purple-200 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-600" />
                    <span>AI Step-by-Step Solution</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-purple-700 dark:text-purple-300">
                    Correct: {String(currentQ.correctAnswer)}
                  </span>
                </div>

                <p className="text-foreground leading-relaxed">
                  {currentQ.explanation.correctSolution}
                </p>

                {currentQ.explanation.stepByStep && currentQ.explanation.stepByStep.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                      Derivation Checkpoints:
                    </span>
                    <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground">
                      {currentQ.explanation.stepByStep.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>

              {/* 3 Detail Cards: Common Mistake, Formula Used, NCERT Ref */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Common Mistake */}
                <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Common Board Mistake</span>
                  </span>
                  <p className="text-xs text-rose-900 dark:text-rose-200 leading-normal">
                    {currentQ.explanation.commonMistake}
                  </p>
                </div>

                {/* 2. Formula Used */}
                {currentQ.explanation.formulaUsed && (
                  <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      <span>Formula Applied</span>
                    </span>
                    <div className="text-xs font-mono font-bold text-foreground">
                      {currentQ.explanation.formulaUsed.equation}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {currentQ.explanation.formulaUsed.name}
                    </p>
                  </div>
                )}

                {/* 3. NCERT Reference */}
                <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    <span>NCERT Reference</span>
                  </span>
                  <div className="text-xs font-bold text-foreground">
                    {currentQ.explanation.ncertReference.section}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {currentQ.explanation.ncertReference.textbookTitle} • Page {currentQ.explanation.ncertReference.page}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Footer Action Buttons */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveViewTab('generator')}
              className="rounded-xl cursor-pointer"
            >
              Exit Test
            </Button>

            {!isAnswerRevealed ? (
              <Button
                variant="primary"
                onClick={() => handleSubmitAnswer()}
                className="px-6 rounded-xl font-bold cursor-pointer gap-2"
              >
                <span>Submit & Check</span>
                <Check className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleNextQuestion}
                className="px-6 rounded-xl font-bold cursor-pointer gap-2"
              >
                <span>
                  {currentQuestionIdx + 1 < sessionQuestions.length ? 'Next Question' : 'View Performance Analysis'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* ========================================================= */}
      {/* TAB 3: PERFORMANCE ANALYSIS & AUTO FOLLOW-UP             */}
      {/* ========================================================= */}
      {activeViewTab === 'analysis' && lastSessionResult && (
        <div className="space-y-6">
          {/* Hero Result Banner */}
          <Card className="p-6 sm:p-8 bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 text-white rounded-3xl border-purple-500/25 shadow-xl relative overflow-hidden space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-bold uppercase tracking-wider border border-white/10">
                  Performance Diagnostic
                </span>
                <h2 className="text-2xl sm:text-3xl font-black mt-2">
                  Practice Drill Completed!
                </h2>
                <p className="text-xs sm:text-sm text-purple-200/80">
                  {lastSessionResult.title} • {lastSessionResult.mode}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">
                    {lastSessionResult.accuracyPercentage}%
                  </div>
                  <div className="text-[11px] text-purple-200 font-medium">Session Accuracy</div>
                </div>
              </div>
            </div>

            {/* Performance Analysis Ribbons (Speed, Confidence, Weak Concepts, Formula Mistakes) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10">
                <div className="flex items-center gap-1.5 text-xs text-purple-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Correct</span>
                </div>
                <div className="text-xl font-black font-mono mt-1 text-white">
                  {lastSessionResult.correctCount} / {lastSessionResult.totalQuestions}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10">
                <div className="flex items-center gap-1.5 text-xs text-purple-200">
                  <Clock className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Avg Speed</span>
                </div>
                <div className="text-xl font-black font-mono mt-1 text-cyan-300">
                  {lastSessionResult.averageTimePerQuestionSeconds}s <span className="text-xs text-purple-200">({lastSessionResult.speedRating})</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10">
                <div className="flex items-center gap-1.5 text-xs text-purple-200">
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>Confidence</span>
                </div>
                <div className="text-xl font-black font-mono mt-1 text-amber-300">
                  {lastSessionResult.confidenceRating}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10">
                <div className="flex items-center gap-1.5 text-xs text-purple-200">
                  <Award className="w-3.5 h-3.5 text-purple-300" />
                  <span>Earned XP</span>
                </div>
                <div className="text-xl font-black font-mono mt-1 text-purple-200">
                  +{lastSessionResult.earnedXP} XP
                </div>
              </div>
            </div>
          </Card>

          {/* AUTO FOLLOW-UP ENGINE: Recommended actions when errors occur */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-sm sm:text-base text-foreground">
                  AI Auto Follow-Up Recommendations
                </h3>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">Generated from your mistakes</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. Recommend Smart Revision */}
              <Card className="p-5 bg-card border-border rounded-2xl flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-600">
                    <RotateCcw className="w-4 h-4" />
                    <span>Priority Smart Revision</span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground">
                    Reinforce {lastSessionResult.recommendations.revisionChapter || 'Weak Concepts'}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Spaced revision scheduled. Review high-yield notes and trigger active recall drill.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('revision')}
                  className="rounded-xl text-xs font-bold cursor-pointer justify-between w-full"
                >
                  <span>Open Smart Revision Engine</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Card>

              {/* 3. Recommend Formula Revision */}
              <Card className="p-5 bg-card border-border rounded-2xl flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-600">
                    <Hash className="w-4 h-4" />
                    <span>Formula Intelligence Deck</span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground">
                    Master Missing Equations
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Practice interactive derivation cards for Nernst equation and Lens Maker equation.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('formula')}
                  className="rounded-xl text-xs font-bold cursor-pointer justify-between w-full"
                >
                  <span>Open Formula Intelligence</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Card>

              {/* 4. Recommend Mistake Notebook */}
              <Card className="p-5 bg-card border-border rounded-2xl flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-600">
                    <BookX className="w-4 h-4" />
                    <span>Mistake Notebook (Auto-Logged)</span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground">
                    {lastSessionResult.wrongCount} Questions Added to Spaced Recall
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Auto-categorized by error type (Concept vs Calculation vs Silly). Ready for Day 1 recall.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('mistakes')}
                  className="rounded-xl text-xs font-bold cursor-pointer justify-between w-full"
                >
                  <span>Review Mistake Notebook</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Card>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <Button
              variant="primary"
              onClick={() => setActiveViewTab('generator')}
              className="px-8 py-3 rounded-2xl font-bold cursor-pointer gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Practice Another Custom Set</span>
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: BOOKMARKS & RETRY QUEUE                            */}
      {/* ========================================================= */}
      {activeViewTab === 'bookmarks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground">Saved Bookmarks & Retry Queue</h3>
              <p className="text-xs text-muted-foreground">
                Questions you marked for revision, doubts, or difficult challenges.
              </p>
            </div>
            {bookmarks.length > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const retryQuestions = bookmarks.map((b) => b.question);
                  setSessionQuestions(retryQuestions);
                  setCurrentQuestionIdx(0);
                  setSelectedOption(null);
                  setNumericalInput('');
                  setShortAnswerSelfAssessed(null);
                  setIsAnswerRevealed(false);
                  setUserAnswers([]);
                  setActiveViewTab('session');
                  toast.success(`Launching retry drill with ${retryQuestions.length} bookmarked questions!`);
                }}
                className="rounded-xl font-bold text-xs gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Launch Retry Drill</span>
              </Button>
            )}
          </div>

          {bookmarks.length === 0 ? (
            <Card className="p-8 text-center bg-card rounded-2xl border-dashed border-border space-y-2">
              <Bookmark className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
              <p className="text-sm font-bold text-foreground">No bookmarked questions yet</p>
              <p className="text-xs text-muted-foreground">
                During test sessions, click the Star or Doubt icon to save questions here.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {bookmarks.map((bm) => (
                <Card
                  key={bm.id}
                  className="p-5 bg-card border-border rounded-2xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-600">
                        {bm.question.subject} • {bm.question.chapter}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 uppercase">
                        {bm.status}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        questionGeneratorService.toggleBookmark(bm.question);
                        setBookmarks(questionGeneratorService.getBookmarks());
                      }}
                      className="text-xs text-muted-foreground hover:text-rose-500 font-bold cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm font-bold text-foreground">
                    {bm.question.question}
                  </p>

                  {bm.userNote && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-muted-foreground">
                      <strong>Note:</strong> {bm.userNote}
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-slate-100 dark:border-slate-800">
                    <span>Correct Answer: <strong className="text-foreground">{String(bm.question.correctAnswer)}</strong></span>
                    <span className="font-mono text-[11px]">{bm.question.explanation.ncertReference.section}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: LIFETIME STATISTICS & OPTIONAL LEADERBOARD        */}
      {/* ========================================================= */}
      {activeViewTab === 'stats' && (
        <div className="space-y-6">
          {/* Lifetime Telemetry Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <Card className="p-4 bg-card border-border rounded-2xl">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Target className="w-3.5 h-3.5 text-purple-600" />
                <span>Questions Attempted</span>
              </div>
              <div className="text-2xl font-black font-mono mt-1 text-foreground">
                {stats.questionsAttempted}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Across all exam modes</p>
            </Card>

            <Card className="p-4 bg-card border-border rounded-2xl">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                <span>Average Accuracy</span>
              </div>
              <div className="text-2xl font-black font-mono mt-1 text-emerald-600">
                {stats.averageAccuracy}%
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Board Benchmark: 75%+</p>
            </Card>

            <Card className="p-4 bg-card border-border rounded-2xl">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5 text-cyan-600" />
                <span>Average Time</span>
              </div>
              <div className="text-2xl font-black font-mono mt-1 text-cyan-600">
                {stats.averageTimeSeconds}s
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Per problem solved</p>
            </Card>

            <Card className="p-4 bg-card border-border rounded-2xl">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Practice Streak</span>
              </div>
              <div className="text-2xl font-black font-mono mt-1 text-amber-500">
                {stats.streakDays} Days
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Continuous recall</p>
            </Card>
          </div>

          {/* Subject Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-5 bg-card border-border rounded-2xl space-y-3">
              <h4 className="font-bold text-sm text-foreground">Subject Mastery Breakdown</h4>
              <div className="space-y-3">
                {Object.entries(stats.subjectBreakdown).map(([subj, data]) => (
                  <div key={subj} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-foreground">{subj}</span>
                      <span className="font-mono text-purple-600">{data.accuracy}% ({data.correct}/{data.attempted})</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full"
                        style={{ width: `${data.accuracy}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Optional Privacy-First Leaderboard */}
            <Card className="p-5 bg-card border-border rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <h4 className="font-bold text-sm text-foreground">Class Leaderboard (Optional)</h4>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground font-medium">Privacy First</span>
                  <input
                    type="checkbox"
                    checked={leaderboardEnabled}
                    onChange={(e) => setLeaderboardEnabled(e.target.checked)}
                    className="cursor-pointer"
                  />
                </div>
              </div>

              {leaderboardEnabled ? (
                <div className="space-y-2">
                  {leaderboard.map((student) => (
                    <div
                      key={student.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition ${
                        student.isCurrentUser
                          ? 'bg-purple-500/15 border-purple-500/40 text-purple-900 dark:text-purple-200 font-bold'
                          : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-muted-foreground w-4 text-center">
                          #{student.rank}
                        </span>
                        <span>{student.avatar}</span>
                        <span>{student.name}</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-muted-foreground">{student.questionsSolved} Qs</span>
                        <span className="font-bold text-purple-600 dark:text-purple-400">{student.accuracy}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-dashed space-y-1">
                  <Lock className="w-6 h-6 text-muted-foreground mx-auto opacity-50" />
                  <p className="text-xs font-bold text-foreground">Peer Comparison Disabled</p>
                  <p className="text-[11px] text-muted-foreground">
                    Your focus is solely on personal mastery without comparison stress.
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}


    </div>
  );
};
