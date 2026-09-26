import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { syncEngine } from '@/services/sync-engine';
import { generateAIStudyPlan } from '@/services/ai-plan-generator';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  BrainCircuit,
  Clock,
  Award,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ArrowRight,
  TrendingUp,
  Compass,
  Check,
  X,
  Target,
  Layers,
} from 'lucide-react';
import { LearningStyleType } from '@/types/onboarding';

export interface StudyJourneyData {
  preparationLevel: string;
  dailyStudyHours: number;
  strongSubjects: string[];
  weakSubjects: string[];
  examTarget: number;
  learningStyle: LearningStyleType;
}

interface StudyJourneyFlowProps {
  onComplete: () => void;
  onCancel?: () => void;
  isModal?: boolean;
}

const PREPARATION_LEVELS = [
  {
    id: 'beginner',
    title: 'Just Starting Out',
    desc: 'Covering core syllabus foundations and NCERT concepts.',
    tag: 'Foundation Mode',
  },
  {
    id: 'intermediate',
    title: 'Covered ~50% Syllabus',
    desc: 'Moderate confidence in basics; transitioning to solving PYQs.',
    tag: 'Accelerated Mode',
  },
  {
    id: 'advanced',
    title: 'Advanced / Revision Stage',
    desc: 'Most chapters complete; focusing on speed, mocks, and weak areas.',
    tag: 'Sprint Mode',
  },
  {
    id: 'topper',
    title: 'Board Topper Level',
    desc: 'Mastered all chapters; perfecting step marking & derivations.',
    tag: 'Mastery Mode',
  },
];

const DAILY_HOURS_OPTIONS = [
  { hours: 2, label: '2 - 3 Hours', desc: 'Consistent light study' },
  { hours: 4, label: '4 - 5 Hours', desc: 'Recommended for CBSE 12' },
  { hours: 6, label: '6 - 7 Hours', desc: 'Intensive prep sprint' },
  { hours: 8, label: '8+ Hours', desc: 'Full-time board immersion' },
];

const SUBJECTS_LIST = [
  { id: 'Physics', name: 'Physics', color: 'from-blue-500 to-indigo-600', count: '14 Chapters' },
  { id: 'Chemistry', name: 'Chemistry', color: 'from-emerald-500 to-teal-600', count: '10 Chapters' },
  { id: 'Mathematics', name: 'Mathematics', color: 'from-purple-500 to-pink-600', count: '13 Chapters' },
  { id: 'Biology', name: 'Biology', color: 'from-amber-500 to-orange-600', count: '16 Chapters' },
  { id: 'English', name: 'English', color: 'from-rose-500 to-red-600', count: 'Core' },
];

const EXAM_TARGETS = [
  { target: 85, label: '85%+', badge: 'Distinction' },
  { target: 90, label: '90%+', badge: 'Star Performer' },
  { target: 95, label: '95%+', badge: 'Topper Bracket' },
  { target: 98, label: '98%+', badge: 'State Rank' },
  { target: 100, label: 'AIR 1 / 100%', badge: 'Absolute Mastery' },
];

const LEARNING_STYLES: { id: LearningStyleType; label: string; desc: string; icon: any }[] = [
  {
    id: 'Notes',
    label: 'NCERT Theory & Derivations',
    desc: 'Step-by-step textbook reading with structured chapter notes.',
    icon: BookOpen,
  },
  {
    id: 'Questions',
    label: 'Problem Solving & PYQs',
    desc: 'Drilling numericals, high-yield questions, and past year papers.',
    icon: Target,
  },
  {
    id: 'Video',
    label: 'Visual & One-Shot Lectures',
    desc: 'Mind maps, conceptual walkthroughs, and animated visualizations.',
    icon: Zap,
  },
  {
    id: 'Flashcards',
    label: 'Formula Sheets & Active Recall',
    desc: 'Rapid formula recitation, named reactions, and fast memory hacks.',
    icon: Sparkles,
  },
];

const ROADMAP_GENERATION_STAGES = [
  'Evaluating preparation level & baseline confidence...',
  'Balancing daily study hours against CBSE Class 12 weightage...',
  'Prioritizing weak subjects & weak chapter recovery drills...',
  'Generating daily actionable tasks & 4-week progressive targets...',
  'Synthesizing your personalized Rankify SmartPlan...',
];

export const StudyJourneyFlow: React.FC<StudyJourneyFlowProps> = ({
  onComplete,
  onCancel,
  isModal = false,
}) => {
  const { user } = useAuth();
  const {
    studentDetails,
    updateStudentDetails,
    studyRoutine,
    updateStudyRoutine,
    upcomingExam,
    chapterProgressMap,
    learningStyle: contextLearningStyle,
    updateLearningStyle,
    revisionStyle,
    setAiStudyPlan,
  } = useOnboarding();

  // Form State
  const [preparationLevel, setPreparationLevel] = useState<string>('intermediate');
  const [dailyHours, setDailyHours] = useState<number>(studyRoutine?.studyHoursPerDay || 4);
  const [strongSubjects, setStrongSubjects] = useState<string[]>(['Chemistry']);
  const [weakSubjects, setWeakSubjects] = useState<string[]>(['Physics']);
  const [examTarget, setExamTarget] = useState<number>(studentDetails?.targetPercentage || 95);
  const [learningStyle, setLearningStyle] = useState<LearningStyleType>(
    contextLearningStyle || 'Questions'
  );

  // Flow State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [animationProgress, setAnimationProgress] = useState<number>(0);
  const [stageIndex, setStageIndex] = useState<number>(0);

  // Toggle Subject Helper
  const toggleStrongSubject = (subjectId: string) => {
    setStrongSubjects((prev) => {
      const next = prev.includes(subjectId)
        ? prev.filter((s) => s !== subjectId)
        : [...prev, subjectId];
      // A subject cannot be both strong and weak simultaneously
      if (next.includes(subjectId)) {
        setWeakSubjects((w) => w.filter((s) => s !== subjectId));
      }
      return next;
    });
  };

  const toggleWeakSubject = (subjectId: string) => {
    setWeakSubjects((prev) => {
      const next = prev.includes(subjectId)
        ? prev.filter((s) => s !== subjectId)
        : [...prev, subjectId];
      // A subject cannot be both strong and weak simultaneously
      if (next.includes(subjectId)) {
        setStrongSubjects((s) => s.filter((sub) => sub !== subjectId));
      }
      return next;
    });
  };

  // Run the 2-3 second animation after submission
  useEffect(() => {
    if (!isSubmitting) return;

    const totalDuration = 2700; // 2.7 seconds
    const intervalTime = 40;
    const increment = 100 / (totalDuration / intervalTime);

    const timer = setInterval(() => {
      setAnimationProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isSubmitting]);

  // Update stages in sync with progress
  useEffect(() => {
    if (!isSubmitting) return;
    const stage = Math.min(
      ROADMAP_GENERATION_STAGES.length - 1,
      Math.floor((animationProgress / 100) * ROADMAP_GENERATION_STAGES.length)
    );
    setStageIndex(stage);

    if (animationProgress >= 100) {
      // Small timeout to show 100% completion before concluding
      const completeTimer = setTimeout(() => {
        finishPlanGeneration();
      }, 500);
      return () => clearTimeout(completeTimer);
    }
  }, [animationProgress, isSubmitting]);

  const handleSubmitJourney = () => {
    setIsSubmitting(true);
    setAnimationProgress(0);
  };

  const finishPlanGeneration = async () => {
    const uid = user?.uid || 'guest_user';

    try {
      // 1. Update Context
      updateStudentDetails({ targetPercentage: examTarget });
      updateStudyRoutine({ studyHoursPerDay: dailyHours });
      updateLearningStyle(learningStyle);

      // 2. Generate Plan with customized inputs
      const chaptersList = Object.values(chapterProgressMap);
      const generatedPlan = generateAIStudyPlan(
        uid,
        {
          ...studentDetails,
          targetPercentage: examTarget,
        },
        {
          ...studyRoutine,
          studyHoursPerDay: dailyHours,
        },
        upcomingExam,
        learningStyle,
        revisionStyle || 'Daily',
        chaptersList
      );

      // Enhance daily tasks with difficulty badges
      const enrichedDailyTasks = generatedPlan.dailyTasks.map((task, idx) => {
        const isWeak = weakSubjects.some((s) => s.toLowerCase() === task.subjectName.toLowerCase());
        const difficulty =
          idx === 0
            ? 'Board Level'
            : isWeak
            ? 'Foundation'
            : examTarget >= 95
            ? 'Topper Level'
            : 'Board Level';
        return {
          ...task,
          difficulty,
        };
      });

      generatedPlan.dailyTasks = enrichedDailyTasks;

      // 3. User Study Profile Object
      const studyProfile: StudyJourneyData = {
        preparationLevel,
        dailyStudyHours: dailyHours,
        strongSubjects,
        weakSubjects,
        examTarget,
        learningStyle,
      };

      // 4. Update Context Plan State
      setAiStudyPlan(generatedPlan);

      // 5. Save to local storage & Firestore
      syncEngine.setLocalCache('study_journey_completed', true, uid);
      syncEngine.setLocalCache('study_journey_profile', studyProfile, uid);
      syncEngine.setLocalCache('active_study_plan', generatedPlan, uid);
      syncEngine.setLocalCache('current_study_plan', generatedPlan, uid);

      if (user?.uid) {
        // Sync to Firebase
        const userRef = doc(db, 'users', user.uid);
        const profileData = {
          studyJourneyCompleted: true,
          studyProfile,
          targetPercentage: examTarget,
          studyHoursPerDay: dailyHours,
          learningStyle,
          updatedAt: new Date().toISOString(),
        };

        try {
          await updateDoc(userRef, profileData);
        } catch {
          await setDoc(userRef, profileData, { merge: true });
        }

        syncEngine.queueSync(uid, 'users', `${uid}/study_profile`, studyProfile as unknown as Record<string, unknown>);
        syncEngine.queueSync(
          uid,
          'users',
          `${uid}/study_plan/current`,
          {
            ...generatedPlan,
            updatedAt: new Date().toISOString(),
          } as unknown as Record<string, unknown>,
          'set'
        );
      }

      // 6. Confetti & Celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#6366f1', '#3b82f6', '#10b981'],
      });

      toast.success('Your personalized Rankify SmartPlan is ready!', {
        icon: '🚀',
        duration: 3500,
      });

      // 7. Transition to Home Screen
      onComplete();
    } catch (err) {
      console.error('Error generating smart plan:', err);
      // Fallback: still proceed to Home Screen
      syncEngine.setLocalCache('study_journey_completed', true, uid);
      onComplete();
    }
  };

  return (
    <div
      className={
        isModal
          ? 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xl overflow-y-auto'
          : 'min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground py-8 px-4 sm:px-6 flex flex-col justify-center'
      }
    >
      <div className="w-full max-w-3xl mx-auto">
        {/* VIEW 1: GENERATION ANIMATION (When user submits) */}
        {isSubmitting ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 sm:py-20 px-6 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-purple-500/30 shadow-2xl backdrop-blur-2xl relative overflow-hidden"
          >
            {/* Animated Glowing Brain Core */}
            <div className="relative w-44 h-44 mx-auto flex items-center justify-center mb-8">
              {/* Outer Orbiting Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border-2 border-dashed border-purple-500/40 pointer-events-none"
              />

              {/* Glowing Ambient Halo */}
              <motion.div
                animate={{
                  scale: [1, 1.25, 1],
                  opacity: [0.35, 0.7, 0.35],
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-2 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 blur-2xl pointer-events-none"
              />

              {/* Center Core */}
              <div className="relative z-10 w-28 h-28 rounded-3xl bg-slate-950 border border-purple-500/50 shadow-2xl flex flex-col items-center justify-center backdrop-blur-xl">
                <BrainCircuit className="w-12 h-12 text-purple-400 animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-purple-300 mt-1 uppercase tracking-wider">
                  SmartPlan AI
                </span>
              </div>
            </div>

            {/* Exact Requested Animation Heading */}
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight max-w-xl mx-auto">
              Rankify is creating your personalized study roadmap...
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Tailoring daily tasks, weekly targets, and weak-topic recovery for{' '}
              <strong className="text-purple-600 dark:text-purple-400 font-semibold">
                {studentDetails.name || 'Student'}
              </strong>{' '}
              (CBSE Class 12 PCM).
            </p>

            {/* Progress Bar & Stage Indicator */}
            <div className="max-w-md mx-auto mt-8 space-y-2.5">
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700 shadow-inner">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 rounded-full"
                  style={{ width: `${Math.round(animationProgress)}%` }}
                  transition={{ ease: 'easeOut', duration: 0.15 }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>{ROADMAP_GENERATION_STAGES[stageIndex]}</span>
                </span>
                <span className="text-foreground">{Math.round(animationProgress)}%</span>
              </div>
            </div>

            {/* Stage Checklist */}
            <div className="max-w-md mx-auto mt-6 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/10 p-3.5 text-left space-y-1.5">
              {ROADMAP_GENERATION_STAGES.map((stg, i) => {
                const isPassed = stageIndex > i || animationProgress === 100;
                const isCurrent = stageIndex === i && animationProgress < 100;

                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between text-[11px] px-2.5 py-1 rounded-lg transition-all ${
                      isCurrent
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-300 font-bold'
                        : isPassed
                        ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                        : 'text-muted-foreground opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                          isPassed
                            ? 'bg-emerald-500 text-white'
                            : isCurrent
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-300 dark:bg-slate-700 text-muted-foreground'
                        }`}
                      >
                        {isPassed ? <Check className="w-2.5 h-2.5" /> : i + 1}
                      </div>
                      <span className="truncate">{stg}</span>
                    </div>
                    {isPassed && <span className="text-[10px] font-mono text-emerald-500 font-bold">Ready</span>}
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          /* VIEW 2: INTERACTIVE QUESTIONNAIRE */
          <Card className="rounded-3xl border-2 border-purple-500/30 dark:border-purple-500/20 bg-card/90 backdrop-blur-2xl shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
            {/* Modal Close Button */}
            {isModal && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="absolute top-5 right-5 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Header */}
            <div className="text-center max-w-xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 text-xs font-bold border border-purple-500/20 shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Rankify SmartPlan • AI Study Roadmap</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                Let's understand your study journey
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                We'll configure your daily targets, weak-topic prioritization, and CBSE Class 12 PCM schedule to maximize retention and exam score.
              </p>
            </div>

            {/* QUESTION 1: Current preparation level */}
            <div className="space-y-2.5 pt-2">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span>1. Current Preparation Level</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PREPARATION_LEVELS.map((level) => {
                  const isSelected = preparationLevel === level.id;
                  return (
                    <button
                      type="button"
                      key={level.id}
                      onClick={() => setPreparationLevel(level.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-purple-600 bg-purple-500/10 dark:bg-purple-950/40 shadow-sm ring-2 ring-purple-600/30'
                          : 'border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-slate-900/40 hover:border-purple-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-extrabold text-foreground">{level.title}</span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                            isSelected
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-muted-foreground'
                          }`}
                        >
                          {level.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug">{level.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* QUESTION 2: Daily available study time */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>2. Daily Available Study Time</span>
                </label>
                <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                  {dailyHours} Hours / Day
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {DAILY_HOURS_OPTIONS.map((opt) => {
                  const isSelected = dailyHours === opt.hours;
                  return (
                    <button
                      type="button"
                      key={opt.hours}
                      onClick={() => setDailyHours(opt.hours)}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-500/10 dark:bg-indigo-950/40 text-foreground ring-2 ring-indigo-600/30 shadow-xs'
                          : 'border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-slate-900/40 hover:border-indigo-400 text-muted-foreground'
                      }`}
                    >
                      <div className="text-sm font-black text-foreground">{opt.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* QUESTION 3 & 4: Strong Subjects & Weak Subjects */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strong Subjects */}
              <div className="space-y-2 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>3. Strong Subjects</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground">Select 1 or more</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUBJECTS_LIST.map((sub) => {
                    const isSelected = strongSubjects.includes(sub.id);
                    return (
                      <button
                        type="button"
                        key={sub.id}
                        onClick={() => toggleStrongSubject(sub.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-foreground border border-slate-200 dark:border-white/10 hover:border-emerald-500'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        <span>{sub.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Weak Subjects */}
              <div className="space-y-2 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>4. Weak Subjects (Needs Focus)</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground">Prioritized in plan</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUBJECTS_LIST.map((sub) => {
                    const isSelected = weakSubjects.includes(sub.id);
                    return (
                      <button
                        type="button"
                        key={sub.id}
                        onClick={() => toggleWeakSubject(sub.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-foreground border border-slate-200 dark:border-white/10 hover:border-rose-500'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        <span>{sub.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* QUESTION 5: Exam Target */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>5. Board Exam Target</span>
                </label>
                <span className="text-sm font-extrabold font-mono text-purple-600 dark:text-purple-400">
                  {examTarget}% Target
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {EXAM_TARGETS.map((tgt) => {
                  const isSelected = examTarget === tgt.target;
                  return (
                    <button
                      type="button"
                      key={tgt.target}
                      onClick={() => setExamTarget(tgt.target)}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/25 ring-2 ring-purple-600/30'
                          : 'border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-slate-900/40 text-foreground hover:border-purple-400'
                      }`}
                    >
                      <div className="text-xs font-black">{tgt.label}</div>
                      <div
                        className={`text-[9px] mt-0.5 font-semibold ${
                          isSelected ? 'text-purple-100' : 'text-muted-foreground'
                        }`}
                      >
                        {tgt.badge}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* QUESTION 6: Preferred Learning Style */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>6. Preferred Learning Style</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {LEARNING_STYLES.map((style) => {
                  const Icon = style.icon;
                  const isSelected = learningStyle === style.id;
                  return (
                    <button
                      type="button"
                      key={style.id}
                      onClick={() => setLearningStyle(style.id)}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'border-purple-600 bg-purple-500/10 dark:bg-purple-950/40 shadow-xs ring-2 ring-purple-600/30'
                          : 'border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-slate-900/40 hover:border-purple-400'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-muted-foreground'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">{style.label}</div>
                        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{style.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground text-center sm:text-left">
                <span className="font-semibold text-foreground">CBSE Class 12 PCM Curriculum:</span> All chapters auto-calibrated.
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {isModal && onCancel && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    onClick={onCancel}
                    className="flex-1 sm:flex-initial rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="button"
                  size="lg"
                  onClick={handleSubmitJourney}
                  className="flex-1 sm:flex-initial px-8 h-12 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold shadow-lg shadow-purple-600/30 cursor-pointer gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Build My Rankify SmartPlan</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
