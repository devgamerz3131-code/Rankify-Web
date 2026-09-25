export interface StudyStreak {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
}

export interface ProgressSummary {
  userId: string;
  totalStudyMinutes: number;
  totalQuestionsAttempted: number;
  accuracyRate: number;
  chaptersCompleted: number;
  streak: StudyStreak;
  weeklyActivity: { day: string; minutes: number }[];
}
