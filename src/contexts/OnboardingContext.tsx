import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  OnboardingState,
  StudentDetails,
  StudyRoutine,
  UpcomingExam,
  LearningStyleType,
  RevisionStyleType,
  ChapterProgress,
  WeakSubjectAnalysis,
  AIStudyPlan,
  ChapterStatusType,
  ConfidenceLevel,
} from '@/types/onboarding';
import {
  getOrSeedSyllabusTemplate,
  buildInitialChapterProgressList,
  getSubjectsForClassAndBoard,
} from '@/services/syllabus-templates';
import { calculateWeakSubjectAnalysis } from '@/services/analysis-engine';
import { generateAIStudyPlan } from '@/services/ai-plan-generator';
import { syncEngine } from '@/services/sync-engine';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import toast from 'react-hot-toast';

interface OnboardingContextType extends OnboardingState {
  setScreen: (screen: number) => void;
  nextScreen: () => void;
  prevScreen: () => void;
  updateStudentDetails: (details: Partial<StudentDetails>) => void;
  toggleSubject: (subjectId: string) => void;
  setSelectedSubjects: (subjectIds: string[]) => void;
  updateStudyRoutine: (routine: Partial<StudyRoutine>) => void;
  updateUpcomingExam: (exam: Partial<UpcomingExam>) => void;
  setLearningStyle: (style: LearningStyleType) => void;
  setRevisionStyle: (style: RevisionStyleType) => void;
  updateChapterProgress: (
    chapterId: string,
    updates: { status?: ChapterStatusType; confidence?: ConfidenceLevel }
  ) => void;
  startAIPlanGeneration: (fastTrack?: boolean) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  saveCurrentStateToCache: () => void;
}

const DEFAULT_DETAILS: StudentDetails = {
  name: '',
  classNumber: 10,
  board: 'CBSE',
  medium: 'English',
  preferredLanguage: 'English',
  targetPercentage: 92,
  stream: 'general',
};

const DEFAULT_ROUTINE: StudyRoutine = {
  studyHoursPerDay: 4,
  schoolTiming: { start: '08:00', end: '14:30' },
  coachingTiming: { start: '16:30', end: '19:00', enabled: false },
  wakeTime: '06:00',
  sleepTime: '23:00',
  holidays: ['Sunday'],
};

const DEFAULT_EXAM: UpcomingExam = {
  examType: 'Boards',
  examDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
};

const AI_GENERATION_MESSAGES = [
  'Analyzing syllabus...',
  'Checking weak chapters...',
  'Calculating available time...',
  'Creating daily targets...',
  'Preparing your roadmap...',
];

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.uid || 'guest';

  // 1. Initial State from local cache if present
  const [currentScreen, setCurrentScreen] = useState<number>(() => {
    const cached = syncEngine.getLocalCache<number>('onboarding_screen', userId);
    return cached && cached >= 1 && cached <= 8 ? cached : 1;
  });

  const [studentDetails, setStudentDetails] = useState<StudentDetails>(() => {
    const cached = syncEngine.getLocalCache<StudentDetails>('student_details', userId);
    return {
      ...DEFAULT_DETAILS,
      name: user?.displayName || '',
      ...cached,
    };
  });

  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(() => {
    const cached = syncEngine.getLocalCache<string[]>('selected_subjects', userId);
    if (cached?.length) return cached;
    const defaultSubs = getSubjectsForClassAndBoard(10, 'CBSE');
    return defaultSubs.map((s) => s.id);
  });

  const [studyRoutine, setStudyRoutine] = useState<StudyRoutine>(() => {
    const cached = syncEngine.getLocalCache<StudyRoutine>('study_routine', userId);
    return cached || DEFAULT_ROUTINE;
  });

  const [upcomingExam, setUpcomingExam] = useState<UpcomingExam>(() => {
    const cached = syncEngine.getLocalCache<UpcomingExam>('upcoming_exam', userId);
    return cached || DEFAULT_EXAM;
  });

  const [learningStyle, setLearningStyleState] = useState<LearningStyleType>(() => {
    const cached = syncEngine.getLocalCache<LearningStyleType>('learning_style', userId);
    return cached || 'Mixed';
  });

  const [revisionStyle, setRevisionStyleState] = useState<RevisionStyleType>(() => {
    const cached = syncEngine.getLocalCache<RevisionStyleType>('revision_style', userId);
    return cached || 'Alternate Day';
  });

  const [chapterProgressMap, setChapterProgressMap] = useState<Record<string, ChapterProgress>>(() => {
    const cached = syncEngine.getLocalCache<Record<string, ChapterProgress>>('chapter_progress_map', userId);
    return cached || {};
  });

  const [aiStudyPlan, setAiStudyPlan] = useState<AIStudyPlan | null>(() => {
    return syncEngine.getLocalCache<AIStudyPlan>('active_study_plan', userId) || null;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isPlanGenerating, setIsPlanGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState(AI_GENERATION_MESSAGES[0]);

  // Derived Weak Subject Analysis
  const weakSubjectAnalysis = useMemo(() => {
    const chapters = Object.values(chapterProgressMap);
    return calculateWeakSubjectAnalysis(chapters);
  }, [chapterProgressMap]);

  // Auto-load template chapters when Class/Board/Subjects change
  useEffect(() => {
    let isMounted = true;
    async function loadChapters() {
      try {
        const template = await getOrSeedSyllabusTemplate(studentDetails.board, studentDetails.classNumber);
        if (!isMounted) return;

        const initialList = buildInitialChapterProgressList(template, selectedSubjectIds, chapterProgressMap);
        setChapterProgressMap((prev) => {
          const updated = { ...prev };
          for (const ch of initialList) {
            if (!updated[ch.id]) {
              updated[ch.id] = ch;
            }
          }
          return updated;
        });
      } catch (e) {
        console.warn('Could not load syllabus template:', e);
      }
    }

    loadChapters();
    return () => {
      isMounted = false;
    };
  }, [studentDetails.board, studentDetails.classNumber, selectedSubjectIds]);

  // Persist state to local cache & queue sync
  const saveCurrentStateToCache = useCallback(() => {
    if (!user?.uid) return;
    setIsSaving(true);
    const now = new Date().toISOString();
    setLastSavedAt(now);

    syncEngine.setLocalCache('onboarding_screen', currentScreen, user.uid);
    syncEngine.setLocalCache('student_details', studentDetails, user.uid);
    syncEngine.setLocalCache('selected_subjects', selectedSubjectIds, user.uid);
    syncEngine.setLocalCache('study_routine', studyRoutine, user.uid);
    syncEngine.setLocalCache('upcoming_exam', upcomingExam, user.uid);
    syncEngine.setLocalCache('learning_style', learningStyle, user.uid);
    syncEngine.setLocalCache('revision_style', revisionStyle, user.uid);
    syncEngine.setLocalCache('chapter_progress_map', chapterProgressMap, user.uid);

    // Queue sync in background (10-second debounce + immediate on blur/close)
    syncEngine.queueSync(
      user.uid,
      'users',
      user.uid,
      {
        displayName: studentDetails.name,
        board: studentDetails.board,
        classNumber: studentDetails.classNumber,
        medium: studentDetails.medium,
        preferredLanguage: studentDetails.preferredLanguage,
        targetPercentage: studentDetails.targetPercentage,
        stream: studentDetails.stream,
        subjects: selectedSubjectIds,
        onboardingStep: currentScreen,
        updatedAt: now,
      },
      'set'
    );

    syncEngine.queueSync(user.uid, 'users', `${user.uid}/user_preferences/current`, {
      userId: user.uid,
      ...studyRoutine,
      learningStyle,
      revisionStyle,
      updatedAt: now,
    });

    syncEngine.queueSync(user.uid, 'users', `${user.uid}/exam_information/primary`, {
      userId: user.uid,
      ...upcomingExam,
      updatedAt: now,
    });

    setTimeout(() => setIsSaving(false), 300);
  }, [
    user?.uid,
    currentScreen,
    studentDetails,
    selectedSubjectIds,
    studyRoutine,
    upcomingExam,
    learningStyle,
    revisionStyle,
    chapterProgressMap,
  ]);

  // Auto-save whenever critical states change
  useEffect(() => {
    saveCurrentStateToCache();
  }, [
    currentScreen,
    studentDetails,
    selectedSubjectIds,
    studyRoutine,
    upcomingExam,
    learningStyle,
    revisionStyle,
    saveCurrentStateToCache,
  ]);

  const setScreen = useCallback((screen: number) => {
    setCurrentScreen(screen);
  }, []);

  const nextScreen = useCallback(() => {
    setCurrentScreen((prev) => Math.min(8, prev + 1));
  }, []);

  const prevScreen = useCallback(() => {
    setCurrentScreen((prev) => Math.max(1, prev - 1));
  }, []);

  const updateStudentDetails = useCallback((details: Partial<StudentDetails>) => {
    setStudentDetails((prev) => {
      const next = { ...prev, ...details };
      // If class changes, re-populate default subjects
      if (details.classNumber && details.classNumber !== prev.classNumber) {
        const subs = getSubjectsForClassAndBoard(details.classNumber, next.board, next.stream);
        setSelectedSubjectIds(subs.map((s) => s.id));
      }
      return next;
    });
  }, []);

  const toggleSubject = useCallback((subjectId: string) => {
    setSelectedSubjectIds((prev) => {
      if (prev.includes(subjectId)) {
        // Keep at least 1 subject selected
        if (prev.length <= 1) {
          toast.error('Select at least one subject to track.');
          return prev;
        }
        return prev.filter((id) => id !== subjectId);
      } else {
        return [...prev, subjectId];
      }
    });
  }, []);

  const setSelectedSubjects = useCallback((subjectIds: string[]) => {
    if (subjectIds.length > 0) {
      setSelectedSubjectIds(subjectIds);
    }
  }, []);

  const updateStudyRoutine = useCallback((routine: Partial<StudyRoutine>) => {
    setStudyRoutine((prev) => ({ ...prev, ...routine }));
  }, []);

  const updateUpcomingExam = useCallback((exam: Partial<UpcomingExam>) => {
    setUpcomingExam((prev) => ({ ...prev, ...exam }));
  }, []);

  const setLearningStyle = useCallback((style: LearningStyleType) => {
    setLearningStyleState(style);
  }, []);

  const setRevisionStyle = useCallback((style: RevisionStyleType) => {
    setRevisionStyleState(style);
  }, []);

  const updateChapterProgress = useCallback(
    (chapterId: string, updates: { status?: ChapterStatusType; confidence?: ConfidenceLevel }) => {
      setChapterProgressMap((prev) => {
        const existing = prev[chapterId];
        if (!existing) return prev;
        const newStatus = updates.status !== undefined ? updates.status : existing.status;
        const newConfidence = updates.confidence !== undefined ? updates.confidence : existing.confidence;
        const completionPercentage =
          newStatus === 'Completed' ? 100 : newStatus === 'Started' ? 40 : newStatus === 'Need Revision' ? 70 : 0;

        const updatedCh: ChapterProgress = {
          ...existing,
          status: newStatus,
          confidence: newConfidence,
          completionPercentage,
          lastStudied: newStatus !== 'Never Started' ? new Date().toISOString() : existing.lastStudied,
          updatedAt: new Date().toISOString(),
        };

        // Queue chapter progress sync
        if (user?.uid) {
          syncEngine.queueSync(
            user.uid,
            'users',
            `${user.uid}/chapter_progress/${chapterId}`,
            updatedCh as unknown as Record<string, unknown>
          );

          // Prompt 4 required structure: users/{uid}/syllabus_progress/{subject}/chapters/{chapterId}
          syncEngine.queueSync(
            user.uid,
            'users',
            `${user.uid}/syllabus_progress/${updatedCh.subjectId}/chapters/${chapterId}`,
            {
              chapterName: updatedCh.chapterName,
              status: updatedCh.status,
              confidence: updatedCh.confidence,
              updatedAt: updatedCh.updatedAt,
              completionPercentage: updatedCh.completionPercentage,
              subjectName: updatedCh.subjectName,
            }
          );
        }

        return {
          ...prev,
          [chapterId]: updatedCh,
        };
      });
    },
    [user?.uid]
  );

  /**
   * AI Plan Generation Screen (Screen 8)
   * Runs calibrated animation duration with changing status messages,
   * while synthesizing the full AI study plan and persisting it to Firestore.
   */
  const startAIPlanGeneration = useCallback(
    async (fastTrack: boolean = false) => {
      setIsPlanGenerating(true);
      setGenerationProgress(0);

      const chapters = Object.values(chapterProgressMap);
      const plan = generateAIStudyPlan(
        user?.uid || 'guest',
        studentDetails,
        studyRoutine,
        upcomingExam,
        learningStyle,
        revisionStyle,
        chapters,
        weakSubjectAnalysis
      );

      // Total animation duration: ~2.5 minutes (150 seconds) in standard mode, or 6 seconds in fastTrack mode
      const totalDurationMs = fastTrack ? 5000 : 120000;
      const stepIntervalMs = totalDurationMs / 100;
      let currentProgress = 0;

      return new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          currentProgress += 1;
          setGenerationProgress(currentProgress);

          const messageIndex = Math.min(
            AI_GENERATION_MESSAGES.length - 1,
            Math.floor((currentProgress / 100) * AI_GENERATION_MESSAGES.length)
          );
          setGenerationMessage(AI_GENERATION_MESSAGES[messageIndex]);

          if (currentProgress >= 100) {
            clearInterval(interval);
            setIsPlanGenerating(false);
            setAiStudyPlan(plan);

            // Persist plan to local cache & Firestore
            if (user?.uid) {
              syncEngine.setLocalCache('active_study_plan', plan, user.uid);
              syncEngine.setLocalCache('current_study_plan', plan, user.uid);

              // 1. Sync study_plan/active
              syncEngine.queueSync(
                user.uid,
                'users',
                `${user.uid}/study_plan/active`,
                plan as unknown as Record<string, unknown>
              );

              // 2. Prompt 4 required structure: users/{uid}/study_plan/current
              // Fields: dailyTasks[], weeklyGoals[], focusChapters[], generatedAt
              const currentPlanData = {
                id: plan.id,
                userId: user.uid,
                dailyTasks: plan.dailyTargets.map((t) => ({
                  id: t.id,
                  taskTitle: t.taskTitle,
                  subjectName: t.subjectName,
                  chapterName: t.chapterName,
                  allocatedMinutes: t.allocatedMinutes,
                  isCompleted: t.isCompleted,
                  status: t.isCompleted ? 'completed' : 'pending',
                })),
                weeklyGoals: plan.weeklyTargets.map((w) => ({
                  id: w.id,
                  weekNumber: w.weekNumber,
                  title: w.title,
                  goals: w.goals,
                  isCompleted: w.isCompleted,
                })),
                focusChapters: plan.priorityQueue.map((p) => ({
                  chapterId: p.chapterId,
                  chapterName: p.chapterName,
                  subjectName: p.subjectName,
                  priority: p.priority,
                  reason: p.reason,
                })),
                weakChapters: plan.weakChapters,
                strongChapters: plan.strongChapters,
                recommendedPractice: plan.revisionQueue,
                upcomingRevision: plan.revisionQueue,
                recommendedStudyHours: plan.recommendedStudyHours,
                expectedCompletionDate: plan.expectedCompletionDate,
                recommendedSessionLength: plan.recommendedSessionLength,
                difficultyRating: plan.difficultyRating,
                summary: plan.summary,
                generatedAt: plan.generatedAt,
                updatedAt: new Date().toISOString(),
              };

              syncEngine.queueSync(
                user.uid,
                'users',
                `${user.uid}/study_plan/current`,
                currentPlanData as unknown as Record<string, unknown>
              );

              // 3. Initialize study statistics
              syncEngine.queueSync(
                user.uid,
                'users',
                `${user.uid}/study_statistics`,
                {
                  streak: 1,
                  completedTasksCount: 0,
                  todayProgressPercent: 0,
                  totalStudyMinutes: 0,
                  questionsSolved: 0,
                  lastActiveDate: new Date().toISOString().split('T')[0],
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              );
            }
            resolve();
          }
        }, stepIntervalMs);
      });
    },
    [
      user?.uid,
      chapterProgressMap,
      studentDetails,
      studyRoutine,
      upcomingExam,
      learningStyle,
      revisionStyle,
      weakSubjectAnalysis,
    ]
  );

  /**
   * Final step: completes onboarding and permanently marks onboardingCompleted = true
   */
  const completeOnboarding = useCallback(async () => {
    if (!user?.uid) {
      toast.error('Please sign in to save your Rankify profile.');
      return;
    }

    try {
      setIsSaving(true);
      const userRef = doc(db, 'users', user.uid);
      const completedData = {
        onboardingCompleted: true,
        displayName: studentDetails.name || user.displayName || 'Student',
        board: studentDetails.board,
        classNumber: studentDetails.classNumber,
        cbseClass: studentDetails.classNumber, // legacy alias
        medium: studentDetails.medium,
        preferredLanguage: studentDetails.preferredLanguage,
        targetPercentage: studentDetails.targetPercentage,
        stream: studentDetails.stream,
        subjects: selectedSubjectIds,
        updatedAt: new Date().toISOString(),
      };

      try {
        await updateDoc(userRef, completedData);
      } catch {
        await setDoc(userRef, completedData, { merge: true });
      }

      // Queue all evaluated chapters into Firestore
      for (const ch of Object.values(chapterProgressMap)) {
        syncEngine.queueSync(
          user.uid,
          'users',
          `${user.uid}/chapter_progress/${ch.id}`,
          ch as unknown as Record<string, unknown>
        );
        syncEngine.queueSync(
          user.uid,
          'users',
          `${user.uid}/syllabus_progress/${ch.subjectId}/chapters/${ch.id}`,
          {
            chapterName: ch.chapterName,
            status: ch.status,
            confidence: ch.confidence,
            updatedAt: ch.updatedAt || new Date().toISOString(),
            completionPercentage: ch.completionPercentage,
            subjectName: ch.subjectName,
          }
        );
      }

      // Flush all pending syncs immediately
      await syncEngine.flushImmediately(user.uid);

      // Update local cache
      syncEngine.setLocalCache('onboarding_completed', true, user.uid);

      toast.success('Onboarding complete! Welcome to your Rankify Study Engine.', {
        duration: 4000,
        icon: '🚀',
      });

      // Reload or trigger user state refresh
      window.location.reload();
    } catch (error) {
      console.warn('Could not finalize onboarding in Firestore:', error);
      // Fallback: update local cache so student is never stuck
      syncEngine.setLocalCache('onboarding_completed', true, user.uid);
      toast.success('Offline mode: Study plan stored locally.');
      window.location.reload();
    } finally {
      setIsSaving(false);
    }
  }, [user, studentDetails, selectedSubjectIds]);

  const value = useMemo(
    () => ({
      currentScreen,
      isSaving,
      lastSavedAt,
      studentDetails,
      selectedSubjectIds,
      studyRoutine,
      upcomingExam,
      learningStyle,
      revisionStyle,
      chapterProgressMap,
      weakSubjectAnalysis,
      aiStudyPlan,
      isPlanGenerating,
      generationProgress,
      generationMessage,
      setScreen,
      nextScreen,
      prevScreen,
      updateStudentDetails,
      toggleSubject,
      setSelectedSubjects,
      updateStudyRoutine,
      updateUpcomingExam,
      setLearningStyle,
      setRevisionStyle,
      updateChapterProgress,
      startAIPlanGeneration,
      completeOnboarding,
      saveCurrentStateToCache,
    }),
    [
      currentScreen,
      isSaving,
      lastSavedAt,
      studentDetails,
      selectedSubjectIds,
      studyRoutine,
      upcomingExam,
      learningStyle,
      revisionStyle,
      chapterProgressMap,
      weakSubjectAnalysis,
      aiStudyPlan,
      isPlanGenerating,
      generationProgress,
      generationMessage,
      setScreen,
      nextScreen,
      prevScreen,
      updateStudentDetails,
      toggleSubject,
      setSelectedSubjects,
      updateStudyRoutine,
      updateUpcomingExam,
      setLearningStyle,
      setRevisionStyle,
      updateChapterProgress,
      startAIPlanGeneration,
      completeOnboarding,
      saveCurrentStateToCache,
    ]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
