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

export function generateAIStudyPlan(
  userId: string,
  studentDetails: StudentDetails,
  studyRoutine: StudyRoutine,
  upcomingExam: UpcomingExam,
  learningStyle: LearningStyleType,
  revisionStyle: RevisionStyleType,
  chapters: ChapterProgress[],
  analysis: WeakSubjectAnalysis
): AIStudyPlan {
  // Categorize chapters
  const weakChapters: string[] = [];
  const strongChapters: string[] = [];

  for (const ch of chapters) {
    if (ch.confidence <= 2 || ch.status === 'Need Revision') {
      weakChapters.push(ch.chapterName);
    } else if (ch.confidence >= 4 && (ch.status === 'Completed' || ch.completionPercentage >= 70)) {
      strongChapters.push(ch.chapterName);
    }
  }

  // Priority Queue: Urgent for low confidence & need revision, High for unstarted, Medium for others
  const priorityQueue: PriorityQueueItem[] = chapters
    .filter((ch) => ch.status !== 'Completed' || ch.confidence <= 2)
    .sort((a, b) => {
      // Sort by confidence ascending, then need revision priority
      if (a.confidence !== b.confidence) return a.confidence - b.confidence;
      if (a.status === 'Need Revision') return -1;
      if (b.status === 'Need Revision') return 1;
      return 0;
    })
    .slice(0, 10)
    .map((ch) => {
      const isUrgent = ch.confidence <= 2 || ch.status === 'Need Revision';
      const isHigh = ch.status === 'Never Started' && ch.confidence <= 3;
      return {
        chapterId: ch.id,
        chapterName: ch.chapterName,
        subjectName: ch.subjectName,
        priority: isUrgent ? 'Urgent' : isHigh ? 'High' : 'Medium',
        reason:
          ch.status === 'Need Revision'
            ? 'Flagged for urgent concept clarification and formula drills'
            : ch.confidence <= 2
            ? 'Low student confidence rating (≤ 2/5). Core fundamentals required'
            : 'Unstarted high-yield board syllabus chapter',
        estimatedMinutes: ch.confidence <= 2 ? 150 : 120,
      };
    });

  // Calculate session length
  let recommendedSessionLength = 45;
  if (learningStyle === 'Video') recommendedSessionLength = 50;
  if (learningStyle === 'Notes') recommendedSessionLength = 40;
  if (learningStyle === 'Questions') recommendedSessionLength = 45;
  if (learningStyle === 'Mixed') recommendedSessionLength = 45;

  // Calculate study hours
  let recommendedStudyHours = studyRoutine.studyHoursPerDay || 4;
  if (studentDetails.targetPercentage >= 95) {
    recommendedStudyHours = Math.max(recommendedStudyHours, 5);
  } else if (studentDetails.targetPercentage >= 90) {
    recommendedStudyHours = Math.max(recommendedStudyHours, 4);
  }

  // Calculate expected completion date
  const examDateObj = upcomingExam.examDate ? new Date(upcomingExam.examDate) : new Date();
  const today = new Date();
  let daysToExam = Math.max(15, Math.ceil((examDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  if (isNaN(daysToExam) || daysToExam <= 0) daysToExam = 60;

  // Plan completion 15 days before the exam for full-syllabus mock tests
  const completionBufferDays = Math.max(5, Math.min(20, Math.floor(daysToExam * 0.25)));
  const completionTargetDays = Math.max(7, daysToExam - completionBufferDays);
  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + completionTargetDays);

  // Generate Daily Targets for Next 7 Days
  const dailyTargets: DailyTargetItem[] = [];
  const focusChapters = priorityQueue.length > 0 ? priorityQueue : chapters.slice(0, 7).map((c) => ({
    chapterId: c.id,
    chapterName: c.chapterName,
    subjectName: c.subjectName,
    priority: 'Medium' as const,
    reason: 'Standard sequence chapter',
    estimatedMinutes: 90,
  }));

  for (let i = 0; i < 7; i++) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + i);
    const dateStr = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
    const targetCh = focusChapters[i % focusChapters.length];

    const taskTitle =
      i % 3 === 0
        ? `NCERT Theory & Concept Notes: ${targetCh.chapterName}`
        : i % 3 === 1
        ? `Exemplar & Previous Year Questions: ${targetCh.chapterName}`
        : `Speed Practice & Self-Quiz: ${targetCh.chapterName}`;

    dailyTargets.push({
      id: `daily_${i + 1}`,
      dayNumber: i + 1,
      date: dateStr,
      chapterName: targetCh.chapterName,
      subjectName: targetCh.subjectName,
      taskTitle,
      allocatedMinutes: Math.min(recommendedStudyHours * 60, targetCh.estimatedMinutes || 90),
      isCompleted: false,
    });
  }

  // Generate Weekly Targets for Next 4 Weeks
  const weeklyTargets: WeeklyTargetItem[] = [
    {
      id: 'week_1',
      weekNumber: 1,
      title: 'Week 1: High Priority Deficit Recovery',
      goals: [
        `Master top 3 weak chapters: ${priorityQueue.slice(0, 3).map((p) => p.chapterName).join(', ') || 'Core Chapters'}`,
        `Solve 50+ NCERT exercise problems with step-by-step documentation`,
        `Execute first ${revisionStyle} revision cycle`,
      ],
      isCompleted: false,
    },
    {
      id: 'week_2',
      weekNumber: 2,
      title: 'Week 2: Mid-Syllabus Acceleration',
      goals: [
        `Complete ongoing topics across ${studentDetails.board} syllabus`,
        `Maintain ${recommendedStudyHours} hrs daily study streak with Pomodoro rhythm`,
        `Timed chapter practice test on Sunday`,
      ],
      isCompleted: false,
    },
    {
      id: 'week_3',
      weekNumber: 3,
      title: 'Week 3: Formula Mastery & Question Banks',
      goals: [
        `Consolidate formula cheat-sheet and concept diagrams`,
        `Focus on ${analysis.weakSubjects[0] || 'core subjects'} higher-order thinking (HOTS) questions`,
        `Weekly syllabus coverage audit`,
      ],
      isCompleted: false,
    },
    {
      id: 'week_4',
      weekNumber: 4,
      title: 'Week 4: Comprehensive Milestone & Mock',
      goals: [
        `Full syllabus unit review across all selected subjects`,
        `Self-assessment test simulating ${upcomingExam.examType} pattern`,
        `Rankify AI study velocity adjustment`,
      ],
      isCompleted: false,
    },
  ];

  // Revision Queue based on revisionStyle
  const revisionQueue: RevisionQueueItem[] = [];
  const revisionCadenceDays = revisionStyle === 'Daily' ? 1 : revisionStyle === 'Alternate Day' ? 2 : 7;
  const chaptersToRevise = chapters.filter((c) => c.status === 'Need Revision' || c.confidence <= 3);
  const revPool = chaptersToRevise.length > 0 ? chaptersToRevise : chapters.slice(0, 5);

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
          ? 'Active Recall via 15 PYQ Flashcards'
          : learningStyle === 'Video'
          ? '1.5x Speed Concept Summary & Mind Map'
          : 'High-Yield Notes Recitation & Formula Sheet',
    });
  });

  // Determine difficulty rating
  let difficultyRating: AIStudyPlan['difficultyRating'] = 'Balanced';
  if (analysis.difficultyScore > 75 || studentDetails.targetPercentage >= 95) {
    difficultyRating = 'Rigorous';
  } else if (analysis.difficultyScore > 50 || daysToExam <= 45) {
    difficultyRating = 'High Intensity';
  } else if (daysToExam > 120 && analysis.difficultyScore < 40) {
    difficultyRating = 'Foundation';
  }

  const summary = `Personalized study plan calibrated for ${studentDetails.name} targeting ${
    studentDetails.targetPercentage
  }% in ${studentDetails.board} Class ${studentDetails.classNumber}. Prioritizes ${
    weakChapters.length
  } chapters needing reinforcement with a ${revisionStyle.toLowerCase()} revision cadence.`;

  return {
    id: `plan_${userId}_${Date.now()}`,
    userId,
    weakChapters,
    strongChapters,
    priorityQueue,
    dailyTargets,
    weeklyTargets,
    revisionQueue,
    recommendedStudyHours,
    expectedCompletionDate: completionDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
    recommendedSessionLength,
    difficultyRating,
    generatedAt: new Date().toISOString(),
    summary,
  };
}
