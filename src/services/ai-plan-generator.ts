import {
  StudentDetails,
  StudyRoutine,
  UpcomingExam,
  LearningStyleType,
  RevisionStyleType,
  ChapterProgress,
  WeakSubjectAnalysis,
  AIStudyPlan,
  PriorityQueueItem,
  DailyTargetItem,
  WeeklyTargetItem,
  RevisionQueueItem,
} from '@/types/onboarding';

/**
 * Rebalances "Needs Focus" flag across CBSE Class 12 PCM chapters.
 * Needs Focus should NEVER stay forever:
 * Once a chapter has sufficient progress (>= 75%), accuracy (>= 80%), or revisions (>= 2 with confidence >= 4),
 * it is graduated out of "Needs Focus", and the next weakest chapter is promoted.
 */
export function rebalanceNeedsFocus(chapters: ChapterProgress[]): {
  updatedChapters: ChapterProgress[];
  focusChapters: ChapterProgress[];
  graduatedChapters: string[];
} {
  const graduatedChapters: string[] = [];

  const updatedChapters = chapters.map((ch) => {
    const isMastered =
      (ch.accuracy >= 80 && ch.progressPercentage >= 75) ||
      (ch.revisionCount >= 2 && ch.confidence >= 4) ||
      ch.progressPercentage === 100;

    if (ch.needsFocus && isMastered) {
      graduatedChapters.push(ch.chapterName);
      return {
        ...ch,
        needsFocus: false,
        updatedAt: new Date().toISOString(),
      };
    }
    return ch;
  });

  // Ensure top 3-4 weakest uncompleted chapters have needsFocus set to true
  const currentFocusCount = updatedChapters.filter((c) => c.needsFocus && !c.completion).length;
  if (currentFocusCount < 3) {
    const candidateWeak = updatedChapters
      .filter((c) => !c.completion && !c.needsFocus)
      .sort((a, b) => {
        if (a.confidence !== b.confidence) return a.confidence - b.confidence;
        if (a.progressPercentage !== b.progressPercentage) return a.progressPercentage - b.progressPercentage;
        return (a.accuracy || 0) - (b.accuracy || 0);
      });

    const needed = 3 - currentFocusCount;
    const promotedIds = new Set(candidateWeak.slice(0, needed).map((c) => c.id));

    for (let i = 0; i < updatedChapters.length; i++) {
      if (promotedIds.has(updatedChapters[i].id)) {
        updatedChapters[i] = {
          ...updatedChapters[i],
          needsFocus: true,
          updatedAt: new Date().toISOString(),
        };
      }
    }
  }

  const focusChapters = updatedChapters.filter((c) => c.needsFocus);
  return { updatedChapters, focusChapters, graduatedChapters };
}

export function generateAIStudyPlan(
  userId: string,
  studentDetails: StudentDetails,
  studyRoutine: StudyRoutine,
  upcomingExam: UpcomingExam,
  learningStyle: LearningStyleType,
  revisionStyle: RevisionStyleType,
  chapters: ChapterProgress[],
  analysis?: WeakSubjectAnalysis | null
): AIStudyPlan {
  // Sort chapters by preparation deficit
  const sortedByDeficit = [...chapters].sort((a, b) => {
    if (a.confidence !== b.confidence) return a.confidence - b.confidence;
    if (a.progressPercentage !== b.progressPercentage) return a.progressPercentage - b.progressPercentage;
    return (a.accuracy || 0) - (b.accuracy || 0);
  });

  const sortedByMastery = [...chapters].sort((a, b) => {
    if (b.progressPercentage !== a.progressPercentage) return b.progressPercentage - a.progressPercentage;
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return (b.accuracy || 0) - (a.accuracy || 0);
  });

  // Categorize weakest & strongest
  const weakChapters: string[] = [];
  const strongChapters: string[] = [];

  for (const ch of chapters) {
    if (ch.confidence <= 2 || ch.progressPercentage < 50 || ch.needsRevision || ch.needsFocus) {
      weakChapters.push(ch.chapterName);
    } else if (ch.confidence >= 4 && ch.progressPercentage >= 75) {
      strongChapters.push(ch.chapterName);
    }
  }

  const weakestChapter = sortedByDeficit[0]?.chapterName || 'Electrostatics & Integrals';
  const strongestChapter = sortedByMastery[0]?.chapterName || 'Matrices & Current Electricity';

  // Calculate overall average accuracy across chapters
  const totalAccuracySum = chapters.reduce((sum, c) => sum + (c.accuracy || 70), 0);
  const overallAccuracy = chapters.length > 0 ? Math.round(totalAccuracySum / chapters.length) : 75;

  // Study hours & Pomodoro session
  let recommendedStudyHours = studyRoutine?.studyHoursPerDay || 4;
  if (studentDetails.targetPercentage >= 95) {
    recommendedStudyHours = Math.max(recommendedStudyHours, 5);
  } else if (studentDetails.targetPercentage >= 90) {
    recommendedStudyHours = Math.max(recommendedStudyHours, 4);
  }

  const recommendedSessionLength =
    learningStyle === 'Video' ? 50 : learningStyle === 'Notes' ? 40 : 45;

  // Calculate expected completion date (CBSE boards timeline)
  const examDateObj = upcomingExam?.examDate ? new Date(upcomingExam.examDate) : new Date();
  const today = new Date();
  let daysToExam = Math.max(20, Math.ceil((examDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  if (isNaN(daysToExam) || daysToExam <= 0) daysToExam = 75;

  const targetFinishDays = Math.max(10, daysToExam - 15);
  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + targetFinishDays);
  const estimatedCompletionStr = completionDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Priority Queue: Urgent for low confidence & need revision
  const priorityQueue: PriorityQueueItem[] = sortedByDeficit
    .filter((ch) => ch.progressPercentage < 100 || ch.confidence <= 2)
    .slice(0, 10)
    .map((ch) => {
      const isUrgent = ch.confidence <= 2 || ch.needsFocus || ch.progressPercentage < 25;
      const isHigh = ch.progressPercentage < 50;
      return {
        chapterId: ch.id,
        chapterName: ch.chapterName,
        subjectName: ch.subjectName,
        priority: isUrgent ? 'Urgent' : isHigh ? 'High' : 'Medium',
        reason:
          ch.confidence <= 2
            ? 'Low student confidence (≤ 2/5). Core NCERT formulas and derivations needed'
            : ch.progressPercentage < 50
            ? 'High-weightage CBSE Class 12 chapter below 50% syllabus coverage'
            : 'Scheduled for spaced recall & numerical problem drills',
        estimatedMinutes: ch.confidence <= 2 ? 120 : 90,
      };
    });

  // Select today's 3-4 active chapters covering Physics, Chemistry, Math
  const pChapter = chapters.find((c) => c.subjectId === 'physics' && c.progressPercentage < 100) || chapters[0];
  const cChapter = chapters.find((c) => c.subjectId === 'chemistry' && c.progressPercentage < 100) || chapters[14];
  const mChapter = chapters.find((c) => c.subjectId === 'mathematics' && c.progressPercentage < 100) || chapters[26];

  const todaysChapters = Array.from(new Set([pChapter?.chapterName, cChapter?.chapterName, mChapter?.chapterName].filter(Boolean) as string[]));

  // Focus topic: isolate first weak topic
  const focusTopic =
    sortedByDeficit[0]?.weakTopics?.[0] ||
    sortedByDeficit[0]?.topics?.[0] ||
    `${weakestChapter} Core Derivations`;

  // Today's Mission Title
  const todaysMission = `${pChapter?.chapterName || 'Physics'} & ${mChapter?.chapterName || 'Calculus'} Mastery Sprint`;

  // Generate 4 dynamic daily tasks for Today
  const dailyTasks = [
    {
      id: `task_p1`,
      taskTitle: `Physics Core: NCERT Theory & Derivations in ${pChapter?.chapterName || 'Electric Charges'}`,
      subjectName: 'Physics',
      chapterName: pChapter?.chapterName || 'Electric Charges',
      allocatedMinutes: 60,
      isCompleted: false,
      status: 'pending' as const,
    },
    {
      id: `task_c1`,
      taskTitle: `Chemistry Drill: Reaction Mechanisms & Formulas in ${cChapter?.chapterName || 'Solutions'}`,
      subjectName: 'Chemistry',
      chapterName: cChapter?.chapterName || 'Solutions',
      allocatedMinutes: 50,
      isCompleted: false,
      status: 'pending' as const,
    },
    {
      id: `task_m1`,
      taskTitle: `Maths Practice: 15 High-Yield Exemplar Problems in ${mChapter?.chapterName || 'Matrices'}`,
      subjectName: 'Mathematics',
      chapterName: mChapter?.chapterName || 'Matrices',
      allocatedMinutes: 60,
      isCompleted: false,
      status: 'pending' as const,
    },
    {
      id: `task_rev`,
      taskTitle: `Quick Revision & Flashcards: ${focusTopic}`,
      subjectName: sortedByDeficit[0]?.subjectName || 'Physics',
      chapterName: sortedByDeficit[0]?.chapterName || 'General',
      allocatedMinutes: 30,
      isCompleted: false,
      status: 'pending' as const,
    },
  ];

  // Daily targets for next 7 days
  const dailyTargets: DailyTargetItem[] = [];
  for (let i = 0; i < 7; i++) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + i);
    const dateStr = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
    const targetCh = sortedByDeficit[i % sortedByDeficit.length] || chapters[0];

    dailyTargets.push({
      id: `daily_${i + 1}`,
      dayNumber: i + 1,
      date: dateStr,
      chapterName: targetCh.chapterName,
      subjectName: targetCh.subjectName,
      taskTitle:
        i % 3 === 0
          ? `NCERT Theory & Notes: ${targetCh.chapterName}`
          : i % 3 === 1
          ? `Exemplar & 10-Year PYQ Solving: ${targetCh.chapterName}`
          : `Speed Practice & Formula Self-Audit: ${targetCh.chapterName}`,
      allocatedMinutes: Math.min(recommendedStudyHours * 60, targetCh.timeSpent > 0 ? 90 : 120),
      isCompleted: false,
    });
  }

  // Weekly Targets for 4 weeks
  const weeklyTargets: WeeklyTargetItem[] = [
    {
      id: 'week_1',
      weekNumber: 1,
      title: 'Week 1: High Deficit Recovery & Core NCERT',
      goals: [
        `Master top weak chapters: ${weakChapters.slice(0, 3).join(', ') || weakestChapter}`,
        'Solve 50+ NCERT step-by-step exercise numericals in Physics & Math',
        'Complete formula recitation and named reactions sheet',
      ],
      isCompleted: false,
    },
    {
      id: 'week_2',
      weekNumber: 2,
      title: 'Week 2: Mid-Syllabus Acceleration & 3D Geometry',
      goals: [
        'Complete Calculus integration & Differential Equations problem sets',
        'Consolidate Organic Chemistry mechanisms (Aldehydes, Ketones, Amines)',
        `Maintain ${recommendedStudyHours} hrs daily study streak`,
      ],
      isCompleted: false,
    },
    {
      id: 'week_3',
      weekNumber: 3,
      title: 'Week 3: Speed, Accuracy & Exemplar HOTS',
      goals: [
        'Higher-Order Thinking Skills (HOTS) questions in Magnetism and Optics',
        'Timed 60-minute mathematics section mock test',
        'Clear all remaining Needs Focus chapters',
      ],
      isCompleted: false,
    },
    {
      id: 'week_4',
      weekNumber: 4,
      title: 'Week 4: Comprehensive Board Simulation & Full Revision',
      goals: [
        'Simulate official CBSE Class 12 PCM sample question paper',
        'Step-by-step marking scheme self-evaluation',
        'Finalize rapid cheat-sheet for morning of the exam',
      ],
      isCompleted: false,
    },
  ];

  // Revision tasks & queue
  const revisionTasks = sortedByDeficit.slice(0, 3).map((ch, idx) => ({
    id: `rev_task_${idx + 1}`,
    title: `Active Recall & Formula Drill: ${ch.chapterName}`,
    chapterName: ch.chapterName,
    subjectName: ch.subjectName,
    isCompleted: false,
  }));

  const revisionQueue: RevisionQueueItem[] = [];
  const revisionCadenceDays = revisionStyle === 'Daily' ? 1 : revisionStyle === 'Alternate Day' ? 2 : 7;
  const chaptersToRevise = chapters.filter((c) => c.needsRevision || c.confidence <= 3);
  const revPool = chaptersToRevise.length > 0 ? chaptersToRevise : sortedByDeficit.slice(0, 6);

  revPool.slice(0, 6).forEach((ch, idx) => {
    const revDate = new Date();
    revDate.setDate(revDate.getDate() + (idx + 1) * revisionCadenceDays);
    revisionQueue.push({
      chapterId: ch.id,
      chapterName: ch.chapterName,
      subjectName: ch.subjectName,
      scheduledDate: revDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revisionMethod:
        learningStyle === 'Questions'
          ? 'Active Recall via 15 Previous Year Question (PYQ) Flashcards'
          : learningStyle === 'Video'
          ? '1.5x Speed Derivation Walkthrough & Mind Map'
          : 'High-Yield Notes Recitation & Formula Sheet Write-out',
    });
  });

  // Motivational sentence
  const motivation = `Consistent daily effort on ${weakestChapter} will unlock your ${studentDetails.targetPercentage}% target in CBSE Class 12 PCM.`;

  // Difficulty rating
  const difficultyRating =
    studentDetails.targetPercentage >= 95 || weakChapters.length > 15
      ? 'Rigorous'
      : weakChapters.length > 8
      ? 'High Intensity'
      : 'Balanced';

  const summary = `Personalized study plan calibrated for CBSE Class 12 PCM targeting ${studentDetails.targetPercentage}%. Prioritizes ${weakChapters.length} chapters needing reinforcement with a ${revisionStyle.toLowerCase()} revision cadence.`;

  return {
    id: `plan_${userId}_${Date.now()}`,
    userId,
    todaysMission,
    todaysChapters,
    todaysQuestions: 25,
    revisionTasks,
    focusTopic,
    estimatedCompletion: estimatedCompletionStr,
    motivation,
    studyStreak: 1,
    accuracy: overallAccuracy,
    weakestChapter,
    strongestChapter,
    dailyGoal: {
      minutes: recommendedStudyHours * 60,
      tasksCount: dailyTasks.length,
    },
    dailyTasks,
    weakChapters,
    strongChapters,
    priorityQueue,
    dailyTargets,
    weeklyTargets,
    revisionQueue,
    recommendedStudyHours,
    expectedCompletionDate: estimatedCompletionStr,
    recommendedSessionLength,
    difficultyRating,
    generatedAt: new Date().toISOString(),
    summary,
  };
}
