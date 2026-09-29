export type ActivityEventType =
  | 'study_session'
  | 'task_completed'
  | 'chapter_completed'
  | 'lecture_analyzed'
  | 'practice_session'
  | 'revision_session'
  | 'flashcard_review'
  | 'formula_revision'
  | 'mistake_review'
  | 'mock_test'
  | 'smartplan_completed'
  | 'bookmark_created'
  | 'notes_created';

export type StudyMood = 'focused' | 'energized' | 'deep_work' | 'tired' | 'unstoppable';

export interface TimelineEvent {
  id: string;
  userId: string;
  timestamp: string; // ISO string
  date: string; // YYYY-MM-DD
  time: string; // e.g. "10:30 AM"
  type: ActivityEventType;
  title: string;
  description: string;
  subjectId: string; // 'physics' | 'chemistry' | 'mathematics' | 'general'
  subjectName: string;
  chapterId?: string;
  chapterName?: string;
  durationMinutes: number;
  questionsCount?: number;
  accuracy?: number;
  score?: number;
  isMilestone?: boolean;
  mood?: StudyMood;
  notes?: string;
}

export interface DailyTimeline {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // "Monday", "Tuesday", etc.
  totalStudyMinutes: number;
  subjects: { name: string; minutes: number; color: string }[];
  chapters: string[];
  tasksCompleted: number;
  questionsSolved: number;
  accuracy: number;
  mistakesCount: number;
  revisionsCount: number;
  formulaRevisionsCount: number;
  lecturesCount: number;
  mood: StudyMood;
  aiSummary: string;
  events: TimelineEvent[];
}

export interface WeeklySummary {
  weekLabel: string; // e.g. "Sep 22 - Sep 28"
  totalStudyHours: number;
  averageDailyStudyMinutes: number;
  subjectsCovered: string[];
  weakChapters: string[];
  strongChapters: string[];
  tasksCompleted: number;
  mostProductiveDay: string;
  leastProductiveDay: string;
  longestSessionMinutes: number;
}

export interface MonthlySummary {
  monthLabel: string; // e.g. "September 2026"
  totalHours: number;
  totalQuestions: number;
  totalRevisions: number;
  totalLectures: number;
  mostStudiedSubject: string;
  mostImprovedSubject: string;
  mostIgnoredSubject: string;
  dailyAverageMinutes: number;
}

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  minutes: number;
  level: 0 | 1 | 2 | 3 | 4; // 0 = 0m, 1 = 1-60m, 2 = 61-120m, 3 = 121-180m, 4 = 180m+
  tasksCount: number;
  questionsCount: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  badgeColor: string;
  unlockedAt?: string;
  isUnlocked: boolean;
  progress: number;
  maxProgress: number;
}

export interface ReplayStatistics {
  totalHours: number;
  averageDailyHours: number;
  longestSessionMinutes: number;
  shortestSessionMinutes: number;
  questionsSolved: number;
  revisionCount: number;
  mockTestsCount: number;
  overallAccuracy: number;
  totalStudyDays: number;
  skippedDays: number;
  currentStreak: number;
  bestStudyDay: {
    date: string;
    day: string;
    minutes: number;
  };
}

export interface StudyReplayData {
  userId: string;
  statistics: ReplayStatistics;
  todayTimeline: DailyTimeline;
  dailyTimelines: Record<string, DailyTimeline>;
  allEvents: TimelineEvent[];
  weeklySummary: WeeklySummary;
  monthlySummary: MonthlySummary;
  heatmapData: HeatmapDay[];
  achievements: Achievement[];
  lastSyncedAt: string;
}
