export type CoachPersonality = 'strict' | 'friendly' | 'savage' | 'mentor' | 'calm';

export type StudentMood =
  | 'laser_focused'
  | 'fatigue_detected'
  | 'need_boost'
  | 'in_the_flow'
  | 'exam_ready';

export type ExamModePhase =
  | '30_days'
  | '14_days'
  | '7_days'
  | '3_days'
  | '1_day'
  | 'standard';

export interface BrainQuickAction {
  label: string;
  actionType: 'study' | 'practice' | 'mistakes' | 'readiness' | 'ai' | 'weakness' | 'replay';
  subject?: string;
  chapter?: string;
  taskTitle?: string;
  prefill?: {
    subject?: string;
    topic?: string;
    action?: 'explain' | 'roadmap' | 'quiz' | 'exam_tips';
    initialPrompt?: string;
  };
}

export interface BrainDailyAdvice {
  headline: string;
  subtext: string;
  priorityTask: string;
  estimatedMinutes: number;
  mood: StudentMood;
  moodLabel: string;
  moodBadgeColor: string;
  motivationalQuote: string;
  quickAction: BrainQuickAction;
  generatedAt: string;
}

export interface PersonalAiInsight {
  id: string;
  category: 'strength' | 'weakness' | 'timing' | 'habit' | 'warning';
  title: string;
  explanation: string;
  metric: string;
  iconType: 'sparkles' | 'flame' | 'clock' | 'alert' | 'book' | 'trending';
  actionLabel?: string;
  actionRoute?: 'study' | 'practice' | 'mistakes' | 'readiness' | 'weakness' | 'replay';
}

export interface MissionItem {
  id: string;
  text: string;
  category: 'study' | 'revision' | 'practice' | 'ncert';
  subjectName: string;
  chapterName: string;
  allocatedMinutes: number;
  isDone: boolean;
  points: number;
}

export interface SmartCoachingMission {
  date: string;
  title: string;
  subtitle: string;
  items: MissionItem[];
  targetStudyMinutes: number;
  completedMinutes: number;
  completionRate: number;
}

export interface AiMemoryProfile {
  favouriteStudyTime: string;
  favouriteSubject: string;
  weakSubjects: string[];
  strongestSubject: string;
  completedChaptersCount: number;
  skippedChaptersCount: number;
  studyHabits: string[];
  revisionHabits: string[];
  mostCommonMistakes: string[];
  chronobiologicalPeak: string;
  daysWithoutSubject: Record<string, number>;
  lastObservedAccuracy: number;
  totalStudyDaysObserved: number;
}

export interface WeeklyReviewReport {
  weekRange: string;
  studyHours: number;
  targetStudyHours: number;
  consistencyScore: number; // 0 - 100
  mostImprovedSubject: string;
  weakestSubject: string;
  revisionScore: number; // 0 - 100
  motivationScore: number; // 0 - 100
  aiSummary: string;
  keyWins: string[];
  actionPlanForNextWeek: string[];
  generatedOn: string;
}

export interface MonthlyReviewReport {
  month: string;
  totalHours: number;
  targetHours: number;
  achievements: string[];
  biggestImprovements: string[];
  pendingWork: string[];
  suggestedStrategy: string;
  projectedBoardScore: number;
}

export interface AiWarning {
  id: string;
  severity: 'critical' | 'high' | 'medium';
  title: string;
  message: string;
  detectedAt: string;
  actionLabel: string;
  actionRoute: 'study' | 'practice' | 'mistakes' | 'readiness' | 'weakness' | 'replay';
}

export interface SmartRecommendation {
  id: string;
  type: 'next_chapter' | 'revision' | 'lecture' | 'practice' | 'mock_test' | 'formula' | 'ncert';
  typeLabel: string;
  subject: string;
  chapter: string;
  title: string;
  description: string;
  urgency: 'high' | 'medium' | 'routine';
  estimatedMinutes: number;
  actionLabel: string;
  actionRoute: 'study' | 'practice' | 'mistakes' | 'readiness' | 'weakness' | 'replay';
}

export interface GoalTrackerState {
  daily: {
    currentMinutes: number;
    targetMinutes: number;
    tasksDone: number;
    targetTasks: number;
  };
  weekly: {
    currentHours: number;
    targetHours: number;
    mockTestsDone: number;
    targetMockTests: number;
  };
  monthly: {
    targetChapterCount: number;
    completedChapterCount: number;
  };
  boardExam: {
    targetPercentage: number;
    projectedPercentage: number;
    gap: number;
    examDateString: string;
    daysRemaining: number;
  };
}

export interface SmartReminder {
  id: string;
  message: string;
  type: 'urgency' | 'streak' | 'subject' | 'break';
  timestamp: string;
}

export interface AiChatContextPayload {
  studentName: string;
  board: string;
  cbseClass: number;
  examCountdownDays: number;
  weakChapters: { name: string; subject: string; confidence: number }[];
  strongestSubject: string;
  recentMistakes: string[];
  coachPersonality: CoachPersonality;
  suggestedInitialPrompt: string;
}

export interface RankifyBrainData {
  personality: CoachPersonality;
  examModePhase: ExamModePhase;
  examCountdownDays: number;
  dailyAdvice: BrainDailyAdvice;
  insights: PersonalAiInsight[];
  mission: SmartCoachingMission;
  memory: AiMemoryProfile;
  weeklyReview: WeeklyReviewReport;
  monthlyReview: MonthlyReviewReport;
  warnings: AiWarning[];
  recommendations: SmartRecommendation[];
  goals: GoalTrackerState;
  reminders: SmartReminder[];
  lastCalculatedAt: string;
}
