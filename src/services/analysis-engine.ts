import { ChapterProgress, WeakSubjectAnalysis } from '@/types/onboarding';

/**
 * Calculates weak subjects, strong subjects, difficulty score, and revision priorities
 * based on the student's chapter progress map.
 */
export function calculateWeakSubjectAnalysis(
  chapters: ChapterProgress[]
): WeakSubjectAnalysis {
  if (!chapters.length) {
    return {
      weakSubjects: [],
      strongSubjects: [],
      averageSubjects: [],
      difficultyScore: 50,
      revisionPriority: {},
      subjectStats: {},
    };
  }

  // Group chapters by subject
  const subjectGroups: Record<string, ChapterProgress[]> = {};
  for (const ch of chapters) {
    if (!subjectGroups[ch.subjectId]) {
      subjectGroups[ch.subjectId] = [];
    }
    subjectGroups[ch.subjectId].push(ch);
  }

  const weakSubjects: string[] = [];
  const strongSubjects: string[] = [];
  const averageSubjects: string[] = [];
  const revisionPriority: Record<string, 'High' | 'Medium' | 'Low'> = {};
  const subjectStats: WeakSubjectAnalysis['subjectStats'] = {};

  let totalWeightedDifficulty = 0;
  let totalChaptersCount = 0;

  for (const [subjectId, group] of Object.entries(subjectGroups)) {
    const totalChapters = group.length;
    totalChaptersCount += totalChapters;

    const sumConfidence = group.reduce((acc, c) => acc + c.confidence, 0);
    const avgConfidence = sumConfidence / totalChapters;

    const completedChapters = group.filter((c) => c.status === 'Completed').length;
    const needRevisionChapters = group.filter((c) => c.status === 'Need Revision').length;
    const unstartedChapters = group.filter((c) => c.status === 'Never Started').length;
    const completedRatio = completedChapters / totalChapters;

    // Difficulty factor: low confidence + many unstarted / need revision
    const subjectDifficulty =
      (5 - avgConfidence) * 15 + (needRevisionChapters / totalChapters) * 15 + (unstartedChapters / totalChapters) * 10;
    totalWeightedDifficulty += subjectDifficulty * totalChapters;

    let status: 'Weak' | 'Average' | 'Strong';
    let priority: 'High' | 'Medium' | 'Low';

    if (avgConfidence <= 2.8 || completedRatio < 0.2 || needRevisionChapters >= totalChapters * 0.4) {
      status = 'Weak';
      priority = 'High';
      weakSubjects.push(group[0]?.subjectName || subjectId);
    } else if (avgConfidence >= 3.8 && (completedRatio >= 0.4 || needRevisionChapters === 0)) {
      status = 'Strong';
      priority = 'Low';
      strongSubjects.push(group[0]?.subjectName || subjectId);
    } else {
      status = 'Average';
      priority = 'Medium';
      averageSubjects.push(group[0]?.subjectName || subjectId);
    }

    revisionPriority[subjectId] = priority;
    subjectStats[subjectId] = {
      subjectName: group[0]?.subjectName || subjectId,
      averageConfidence: Number(avgConfidence.toFixed(1)),
      completedRatio: Number(completedRatio.toFixed(2)),
      status,
      totalChapters,
      completedChapters,
    };
  }

  const overallDifficultyScore = Math.min(
    95,
    Math.max(20, Math.round(totalChaptersCount > 0 ? totalWeightedDifficulty / totalChaptersCount : 50))
  );

  return {
    weakSubjects,
    strongSubjects,
    averageSubjects,
    difficultyScore: overallDifficultyScore,
    revisionPriority,
    subjectStats,
  };
}
