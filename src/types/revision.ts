export type RevisionPriority = 'critical' | 'high' | 'medium' | 'low' | 'completed';

export type RevisionMethod =
  | 'Formula Revision'
  | 'Concept Revision'
  | 'Numerical Practice'
  | 'NCERT Reading'
  | 'PYQ Revision'
  | 'Flashcard Revision'
  | 'Mistake Revision'
  | 'Lecture Rewatch'
  | 'Mock Revision'
  | 'Mixed Revision';

export type SmartIntervalStep =
  | 'Same Day'
  | '1 Day'
  | '3 Days'
  | '7 Days'
  | '15 Days'
  | '30 Days'
  | '45 Days'
  | '60 Days'
  | '90 Days';

export interface MemoryRetentionModel {
  chapterId: string;
  chapterName: string;
  subject: 'Physics' | 'Chemistry' | 'Mathematics';
  currentMemoryPercent: number; // 0 - 100
  retentionRate: number; // 0 - 100
  forgetRateLambda: number; // decay coefficient per day, e.g. 0.08
  lastRevisedTimestamp: number;
  daysSinceLastRevision: number;
  confidence: number; // 0 - 100
  revisionSuccessScore: number; // 0 - 100
  timesRevised: number;
  timesSkipped: number;
  mistakeCount: number;
  nextRevisionDate: string; // YYYY-MM-DD
  intervalDays: number;
  intervalStep: SmartIntervalStep;
  status: 'critical' | 'high' | 'stable' | 'mastered';
}

export interface SmartRevisionSession {
  id: string;
  subject: 'Physics' | 'Chemistry' | 'Mathematics';
  chapter: string;
  chapterId: string;
  priority: RevisionPriority;
  reasonForRevision: string;
  aiExplanationWhy: string[];
  estimatedMinutes: number;
  questionsToSolve: number;
  questionTypeFocus: string;
  revisionMethod: RevisionMethod;
  expectedConfidenceGain: number; // e.g. +8
  memoryRetentionBefore: number; // e.g. 54%
  memoryRetentionProjected: number; // e.g. 92%
  scheduledDate: string; // YYYY-MM-DD
  isOverdue: boolean;
  daysOverdue: number;
  isCompleted: boolean;
  completedAt?: number;
  isSkipped: boolean;
  skippedCount: number;
  recommendedResources: {
    questions: string;
    formulaSheet: string;
    lecture: string;
    flashcards: string;
    ncert: string;
    pyqs: string;
  };
}

export interface RevisionCalendarDay {
  date: string; // YYYY-MM-DD
  dayName: string; // 'Mon', 'Tue'
  dayNumber: number; // 1 - 31
  status: 'completed' | 'today' | 'overdue' | 'upcoming' | 'none';
  sessions: SmartRevisionSession[];
  totalMinutes: number;
  completedCount: number;
}

export interface RevisionStreakData {
  currentDailyStreak: number;
  longestDailyStreak: number;
  weeklyRevisionsCount: number;
  monthlyRevisionsCount: number;
  lastActiveDate: string;
}

export interface RevisionStatistics {
  totalRevisions: number;
  completedCount: number;
  skippedCount: number;
  completionRate: number; // 0 - 100
  averageRevisionTimeMinutes: number;
  retentionImprovementPercent: number;
  mostRevisedSubject: string;
  mostForgottenChapter: string;
  pendingCount: number;
  urgentCount: number;
  todayRevisionScore: number; // 0 - 100
  estimatedTodayMinutes: number;
}

export interface SmartNotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'urgent' | 'streak' | 'boost';
  subject?: string;
  timestamp: number;
  actionText: string;
}

export interface SmartRevisionEngineData {
  todaySessions: SmartRevisionSession[];
  upcomingSessions: SmartRevisionSession[];
  completedSessions: SmartRevisionSession[];
  memoryModels: Record<string, MemoryRetentionModel>;
  streak: RevisionStreakData;
  stats: RevisionStatistics;
  calendarDays: RevisionCalendarDay[];
  smartNotifications: SmartNotificationItem[];
  lastCalculatedTimestamp: number;
}
