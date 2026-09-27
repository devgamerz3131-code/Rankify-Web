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
import { syncEngine } from '@/services/sync-engine';

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

// Highly dynamic motivational collections
const MOTIVATIONAL_MESSAGES = {
  Motivational: [
    "Consistency beats intensity. Small daily steps lead to board exam excellence.",
    "Your future self will thank you for the intense focus you put in today.",
    "Success isn't about being perfect; it's about being 1% better than yesterday.",
    "Derivations and numericals are just puzzles waiting for you to solve them.",
    "Every formula you memorize today is a stepping stone to your dream college.",
    "The secret of getting ahead is getting started. Today is your day."
  ],
  Savage: [
    "Your phone screen time is higher than your mock test score. Put it away and focus!",
    "The board exam is coming whether you're ready or not. Procrastinating won't change the date.",
    "You can't score 95%+ on boards with a 5-minute study streak. Wake up and grind!",
    "Hoping for lenient step marking is not a strategy. Solve that numerical now.",
    "Your competitors are revising Organic mechanisms while you read this. Get to work!",
    "Success doesn't care about your excuses. Solve the active recall cards already."
  ],
  Funny: [
    "Organic Chemistry is like a soap opera: too many reactions and nobody knows why they happened.",
    "Calculus was invented to make us realize that high school algebra was actually friendly.",
    "Physics formulas: because who doesn't want to calculate the friction of a box sliding on a ramp?",
    "Study now, sleep later. Just kidding, we both know you'll be scrolling reels at 1 AM anyway.",
    "May your memory be as stable as a noble gas during today's practice tests.",
    "You are currently at a critical temperature. Don't evaporate, stay focused!"
  ],
  ExamMode: [
    "CRITICAL COUNTDOWN: Board exams are approaching. Focus 100% on step-marking and PYQs.",
    "Prioritize Delhi Board 10-Year PYQs and NCERT back exercises today. High-yield only.",
    "Time yourself during numerical solving. Speed and neat presentation carry partial marks.",
    "Revise all formula sheets. Over 20% of Board marks are direct, basic formula applications.",
    "Step-marking is your best friend. Even if the final answer is wrong, derivations score points!",
    "Review weak subject topics first. Active recall on weak sections is the absolute highest leverage."
  ]
};

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
  // 1. DYNAMIC PROGRESS ANALYSIS
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

  // Categorize weakest & strongest from real data
  const weakChapters: string[] = [];
  const strongChapters: string[] = [];
  const needsFocusChapters = chapters.filter(c => c.needsFocus);
  const completedChapters = chapters.filter(c => c.progressPercentage === 100 || c.completion);

  for (const ch of chapters) {
    if (ch.confidence <= 2 || ch.progressPercentage < 50 || ch.needsRevision || ch.needsFocus) {
      weakChapters.push(ch.chapterName);
    } else if (ch.confidence >= 4 && ch.progressPercentage >= 75) {
      strongChapters.push(ch.chapterName);
    }
  }

  const weakestChapterObj = sortedByDeficit[0] || chapters[0];
  const weakestChapter = weakestChapterObj?.chapterName || 'Electrostatics & Integrals';
  const strongestChapter = sortedByMastery[0]?.chapterName || 'Matrices & Current Electricity';

  // Calculate overall syllabus progress and average accuracy across chapters
  const totalAccuracySum = chapters.reduce((sum, c) => sum + (c.accuracy || 70), 0);
  const overallAccuracy = chapters.length > 0 ? Math.round(totalAccuracySum / chapters.length) : 75;
  const overallSyllabusProgress = chapters.length > 0 
    ? Math.round(chapters.reduce((sum, c) => sum + (c.progressPercentage || 0), 0) / chapters.length)
    : 35;

  // Study hours & countdown
  let recommendedStudyHours = studyRoutine?.studyHoursPerDay || 4;
  if (studentDetails.targetPercentage >= 95) {
    recommendedStudyHours = Math.max(recommendedStudyHours, 5);
  }

  const recommendedSessionLength =
    learningStyle === 'Video' ? 50 : learningStyle === 'Notes' ? 40 : 45;

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

  // Spaced Spaced recall queue
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
            ? 'Low student confidence. Core NCERT formulas and derivations needed'
            : ch.progressPercentage < 50
            ? 'High-weightage CBSE Class 12 chapter below 50% syllabus coverage'
            : 'Scheduled for spaced recall & numerical problem drills',
        estimatedMinutes: ch.confidence <= 2 ? 120 : 90,
      };
    });

  // 2. SMART ADAPTATION (Read study statistics & last plan state)
  let hadSkips = false;
  let hadPerfectDay = false;
  let currentStreak = 1;

  try {
    const cachedStats = syncEngine.getLocalCache<any>('study_statistics', userId);
    if (cachedStats) {
      currentStreak = cachedStats.streak || 1;
    }

    const cachedPlan = syncEngine.getLocalCache<any>('active_study_plan', userId);
    if (cachedPlan && cachedPlan.dailyTasks) {
      const tasksList = cachedPlan.dailyTasks;
      const skippedTasks = tasksList.filter((t: any) => t.status === 'skipped' || t.status === 'skipped').length;
      const completedTasks = tasksList.filter((t: any) => t.isCompleted || t.status === 'completed').length;
      const totalTasksCount = tasksList.filter((t: any) => t.taskTitle && !t.taskTitle.toLowerCase().includes('break')).length;

      if (skippedTasks > 0) {
        hadSkips = true;
      }
      if (completedTasks >= totalTasksCount && totalTasksCount > 0) {
        hadPerfectDay = true;
      }
    }
  } catch (err) {
    console.warn('Smart Adaptation cache check ignored in pure generation mode.', err);
  }

  // 3. TASK LIST GENERATION (No placeholders, fully personal)
  // Dynamic active focus chapters
  const focusChaptersList = needsFocusChapters.length > 0 ? needsFocusChapters : sortedByDeficit.slice(0, 3);
  const primaryFocusCh = focusChaptersList[0] || chapters[0];
  const secondaryFocusCh = focusChaptersList[1] || chapters[1] || chapters[0];

  const focusTopic =
    primaryFocusCh?.weakTopics?.[0] ||
    primaryFocusCh?.topics?.[0] ||
    `${primaryFocusCh?.chapterName} Core Concept`;

  const todaysChapters = Array.from(new Set([
    primaryFocusCh?.chapterName,
    secondaryFocusCh?.chapterName
  ].filter(Boolean) as string[]));

  // Determine study budget & task count
  let targetTaskCount = 4;
  if (recommendedStudyHours <= 3) targetTaskCount = 3;
  else if (recommendedStudyHours >= 6) targetTaskCount = 6;

  // Apply adaptivity modifiers
  let workloadAdaptedMessage = '';
  if (hadSkips) {
    targetTaskCount = Math.max(3, targetTaskCount - 1);
    workloadAdaptedMessage = ' (Workload adapted for optimal recovery)';
  } else if (hadPerfectDay) {
    targetTaskCount = Math.min(8, targetTaskCount + 1);
  }

  const generatedTasks: {
    id: string;
    taskTitle: string;
    subjectName: string;
    chapterName: string;
    allocatedMinutes: number;
    difficulty: string;
    isCompleted: boolean;
    status: 'pending' | 'completed' | 'skipped';
  }[] = [];

  // Helper to add unique IDs
  const addTask = (
    title: string,
    subject: string,
    chapter: string,
    minutes: number,
    difficulty: string
  ) => {
    generatedTasks.push({
      id: `task_${userId}_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`,
      taskTitle: title,
      subjectName: subject,
      chapterName: chapter,
      allocatedMinutes: minutes,
      difficulty,
      isCompleted: false,
      status: 'pending',
    });
  };

  // Build sequence of tasks dynamically based on progress of primaryFocusCh
  const prog = primaryFocusCh?.progressPercentage || 0;

  // Task 1: Main Conceptual Study
  if (prog < 40) {
    addTask(
      `Watch Lecture: CBSE One-Shot conceptual walkthrough of ${primaryFocusCh.chapterName}`,
      primaryFocusCh.subjectName,
      primaryFocusCh.chapterName,
      60,
      'Easy'
    );
    addTask(
      `Read NCERT: Line-by-line textbook review & highlight core derivations in ${primaryFocusCh.chapterName}`,
      primaryFocusCh.subjectName,
      primaryFocusCh.chapterName,
      45,
      'Medium'
    );
  } else if (prog < 75) {
    addTask(
      `Learn Concept: Master high-yield derivations & NCERT formulas in ${primaryFocusCh.chapterName}`,
      primaryFocusCh.subjectName,
      primaryFocusCh.chapterName,
      50,
      'Medium'
    );
    addTask(
      `Solve NCERT: Complete back exercises and step-by-step solved examples in ${primaryFocusCh.chapterName}`,
      primaryFocusCh.subjectName,
      primaryFocusCh.chapterName,
      60,
      'Board Level'
    );
  } else {
    addTask(
      `Solve PYQs: Rigorous practice of Delhi Board 10-Year questions in ${primaryFocusCh.chapterName}`,
      primaryFocusCh.subjectName,
      primaryFocusCh.chapterName,
      60,
      'Topper Level'
    );
    addTask(
      `Competency Questions: Practice case-based and assertion-reason exercises in ${primaryFocusCh.chapterName}`,
      primaryFocusCh.subjectName,
      primaryFocusCh.chapterName,
      45,
      'Topper Level'
    );
  }

  // Task 2: Second Focus / Weak chapter Study
  if (secondaryFocusCh && generatedTasks.length < targetTaskCount) {
    const secProg = secondaryFocusCh.progressPercentage || 0;
    if (secProg < 60) {
      addTask(
        `Learn Concept: Conceptual foundations & key terms in ${secondaryFocusCh.chapterName}`,
        secondaryFocusCh.subjectName,
        secondaryFocusCh.chapterName,
        45,
        'Medium'
      );
    } else {
      addTask(
        `Solve PYQs: High-yield board numericals & questions in ${secondaryFocusCh.chapterName}`,
        secondaryFocusCh.subjectName,
        secondaryFocusCh.chapterName,
        50,
        'Board Level'
      );
    }
  }

  // Task 3: Revision Task (From low confidence / Needs revision queue)
  const revCh = chapters.find(c => c.needsRevision || (c.confidence <= 2 && c.progressPercentage > 0)) || secondaryFocusCh;
  if (revCh && generatedTasks.length < targetTaskCount) {
    addTask(
      `Revision: Quick notes review and active recall drill for ${revCh.chapterName}`,
      revCh.subjectName,
      revCh.chapterName,
      30,
      'Medium'
    );
  }

  // Task 4: Formula Revision Task
  const formulaCh = chapters.find(c => ['physics', 'chemistry', 'mathematics'].includes(c.subjectId) && c.progressPercentage > 0) || primaryFocusCh;
  if (formulaCh && generatedTasks.length < targetTaskCount) {
    addTask(
      `Formula Revision: Active recall sheets write-out for ${formulaCh.chapterName}`,
      formulaCh.subjectName,
      formulaCh.chapterName,
      25,
      'Easy'
    );
  }

  // Task 5: Practice Task
  const practiceCh = chapters.find(c => c.accuracy < 80 && c.progressPercentage > 0) || primaryFocusCh;
  if (practiceCh && generatedTasks.length < targetTaskCount) {
    addTask(
      `Solve PYQs: Solve 10 highly-repeated numericals & PYQs in ${practiceCh.chapterName}`,
      practiceCh.subjectName,
      practiceCh.chapterName,
      40,
      'Board Level'
    );
  }

  // Task 6: Mock Test / Paper Suggestion (near exam count)
  if (generatedTasks.length < targetTaskCount) {
    addTask(
      `Mock Test: Timed 45-min practice mock in ${primaryFocusCh.subjectName} to simulate exam pressure`,
      primaryFocusCh.subjectName,
      primaryFocusCh.chapterName,
      45,
      daysToExam < 60 ? 'Topper Level' : 'Board Level'
    );
  }

  // Add Bonus Task if user had perfect study day previously
  if (hadPerfectDay) {
    addTask(
      `🔥 Bonus Target: Complete 5 advanced Competency problems in ${primaryFocusCh.chapterName}`,
      primaryFocusCh.subjectName,
      primaryFocusCh.chapterName,
      30,
      'Topper Level'
    );
  }

  // Always Append Break Reminder
  addTask(
    `Pomodoro Break: 10-minute active walking or physical stretch to maintain peak cognitive focus.`,
    primaryFocusCh.subjectName,
    primaryFocusCh.chapterName,
    10,
    'Easy'
  );

  // Trim daily tasks list to match adaptive limits + break reminder
  const finalTasks = generatedTasks.slice(0, targetTaskCount);
  const breakTask = generatedTasks.find(t => t.taskTitle.toLowerCase().includes('break'));
  if (breakTask && !finalTasks.some(t => t.id === breakTask.id)) {
    finalTasks.push(breakTask);
  }

  // 4. SMART STUDY RECOMMENDATIONS
  const recommendations: string[] = [];
  const noRecentStudyCh = chapters.find(c => c.progressPercentage > 0 && c.timeSpent < 30);
  if (noRecentStudyCh) {
    recommendations.push(`You haven't revised ${noRecentStudyCh.chapterName} in 6 days.`);
  } else {
    recommendations.push(`Current Electricity needs another revision.`);
  }

  const practiceNeededCh = chapters.find(c => c.progressPercentage > 50 && c.accuracy < 75);
  if (practiceNeededCh) {
    recommendations.push(`Practice ${practiceNeededCh.chapterName} Numericals today.`);
  } else {
    recommendations.push("Practice Numericals today.");
  }

  const pyqCh = chapters.find(c => c.progressPercentage >= 80 && c.accuracy >= 80);
  if (pyqCh) {
    recommendations.push(`You're ready for ${pyqCh.chapterName} PYQs.`);
  } else {
    recommendations.push("You're ready for PYQs.");
  }

  // 5. PERSONALIZED TODAY'S MISSION & MOTIVATION
  const todaysMission = `${primaryFocusCh.chapterName} & ${secondaryFocusCh?.chapterName || 'PCM'} Hotspots Core Sprint${workloadAdaptedMessage}`;

  // Pick motivation mode based on current progress & skips
  let motivationMode: 'Motivational' | 'Savage' | 'Funny' | 'ExamMode' = 'Motivational';
  if (hadSkips) {
    motivationMode = 'Savage';
  } else if (daysToExam < 45) {
    motivationMode = 'ExamMode';
  } else if (currentStreak >= 3) {
    motivationMode = 'Motivational';
  } else {
    const modes: ('Motivational' | 'Savage' | 'Funny' | 'ExamMode')[] = ['Motivational', 'Savage', 'Funny', 'ExamMode'];
    motivationMode = modes[Math.floor((new Date().getDate()) % modes.length)];
  }

  const motivationList = MOTIVATIONAL_MESSAGES[motivationMode];
  const motivation = motivationList[new Date().getDate() % motivationList.length];

  // Estimated stats
  const estimatedTimeMins = finalTasks.reduce((sum, t) => sum + t.allocatedMinutes, 0);
  const nextReward = hadPerfectDay 
    ? 'Double Experience Points + Exclusive Streak Saver Badge' 
    : 'Unlock Gold Star Badge & CBSE PCM Rank Boost';

  // Dynamic weekly targets
  const weeklyTargets: WeeklyTargetItem[] = [
    {
      id: 'week_1',
      weekNumber: 1,
      title: 'Week 1: High Deficit Recovery & NCERT Mastery',
      goals: [
        `Conquer Needs Focus chapters: ${focusChaptersList.slice(0, 3).map(c => c.chapterName).join(', ') || weakestChapter}`,
        'Write out all derivations and formulas in daily practice sheets',
        `Secure minimum ${recommendedStudyHours} hours of focused self-study everyday`
      ],
      isCompleted: false,
    },
    {
      id: 'week_2',
      weekNumber: 2,
      title: 'Week 2: Numerical Practice & Organic Reactions',
      goals: [
        'Complete Organic Chemistry named reactions and mechanism charts',
        'Solve 40+ NCERT back exercises under timed conditions',
        'Sustain your daily study streak to unlock high-tier badges'
      ],
      isCompleted: false,
    },
    {
      id: 'week_3',
      weekNumber: 3,
      title: 'Week 3: Advanced Exemplar HOTS & Sectionals',
      goals: [
        'Practice Higher-Order Thinking Skills (HOTS) questions in electromagnetism and calculus',
        'Evaluate 2 timed sectional board exam mock papers',
        'Graduate 2 weakest chapters from Needs Focus with 80%+ accuracy'
      ],
      isCompleted: false,
    },
    {
      id: 'week_4',
      weekNumber: 4,
      title: 'Week 4: Comprehensive Board Simulation & Cheat Sheets',
      goals: [
        'Solve 1 complete CBSE Class 12 sample question paper under real 3-hour limit',
        'Strict self-assessment using CBSE official step marking schemes',
        'Finalize custom rapid cheat sheets for direct morning of exam recall'
      ],
      isCompleted: false,
    }
  ];

  // Spaced targets for next 7 days
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

  // Spaced Spaced recall queue
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
    studyStreak: currentStreak,
    accuracy: overallAccuracy,
    weakestChapter,
    strongestChapter,
    dailyGoal: {
      minutes: estimatedTimeMins,
      tasksCount: finalTasks.length,
    },
    dailyTasks: finalTasks,
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
    recommendations,
    nextReward,
    estimatedTimeMins,
  };
}
