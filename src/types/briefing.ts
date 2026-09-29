export type BriefingTone =
  | 'friendly_teacher'
  | 'strict_coach'
  | 'savage_friend'
  | 'motivational_mentor'
  | 'calm_guide';

export type BriefingPeriod = 'morning' | 'midday' | 'evening' | 'night';

export type MissionType =
  | 'top_priority'
  | 'second_priority'
  | 'quick_win'
  | 'revision'
  | 'practice';

export interface DailyMissionItem {
  id: string;
  title: string;
  subject: 'Physics' | 'Chemistry' | 'Mathematics';
  chapter: string;
  durationMinutes: number;
  type: MissionType;
  isCompleted: boolean;
  impactScore: number;
  actionRoute: string;
}

export interface EnergyPlanSlot {
  slot: 'morning' | 'afternoon' | 'night';
  timeRange: string;
  recommendedActivity: string;
  energyLevel: 'Peak High' | 'Moderate Focus' | 'Reflective / Light';
  targetSubject: 'Physics' | 'Chemistry' | 'Mathematics';
  taskDescription: string;
  studyDnaReason: string;
}

export interface YesterdayRecap {
  studyMinutes: number;
  completedTasksCount: number;
  questionsSolved: number;
  accuracyPercent: number;
  subjectsBreakdown: { subject: string; minutes: number }[];
  highlight: string;
}

export interface EveningReportData {
  achievementSummary: string;
  completedCount: number;
  missedCount: number;
  actualStudyMinutes: number;
  targetStudyMinutes: number;
  confidenceDelta: string; // e.g. "+3.2% Chemistry"
  tomorrowPriorityPreview: string;
}

export interface NightReflectionData {
  id: string;
  date: string;
  completedNotes: string;
  difficultTopics: string[];
  focusScore: number; // 1 to 5
  energyLevel: number; // 1 to 5
  mentalFatigue: 'low' | 'moderate' | 'high';
  notes: string;
  recordedAt: number;
}

export interface AiMemoryProfile {
  preferredTone: BriefingTone;
  bestTiming: string; // e.g. "Morning 06:30 - 08:00 AM"
  weakAreas: string[];
  primaryGoal: string;
  streakDays: number;
  totalReflectionsLogged: number;
  commonDifficulties: string[];
}

export interface DailyBriefingData {
  id: string;
  date: string; // YYYY-MM-DD
  period: BriefingPeriod;
  studentName: string;
  greetingTitle: string; // e.g. "Good Morning, Devgamerz 👋"
  examCountdownDays: number;
  readinessScore: number;
  tone: BriefingTone;
  aiMessage: string;
  todayFocusSubject: 'Physics' | 'Chemistry' | 'Mathematics';
  estimatedStudyTimeMinutes: number;
  yesterdayRecap: YesterdayRecap;
  missions: DailyMissionItem[];
  energyPlan: EnergyPlanSlot[];
  eveningReport?: EveningReportData;
  nightReflection?: NightReflectionData;
}

export interface BriefingNotificationRule {
  period: BriefingPeriod;
  timeLabel: string;
  title: string;
  body: string;
  isTriggered: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface BriefingState {
  currentBriefing: DailyBriefingData;
  memoryProfile: AiMemoryProfile;
  reflectionHistory: NightReflectionData[];
  notifications: BriefingNotificationRule[];
  lastGeneratedTimestamp: number;
}

export interface SampleStudentBriefing {
  id: string;
  studentName: string;
  tone: BriefingTone;
  readinessScore: number;
  streakDays: number;
  todayFocus: string;
  targetExam: string;
  aiMessage: string;
  missionsTotal: number;
  missionsCompleted: number;
  lastOpenedPeriod: BriefingPeriod;
}

export interface AdminCustomBriefingRequest {
  targetSegment: string;
  title: string;
  focusChapter: string;
  aiMessage: string;
  tone: BriefingTone;
  estimatedMinutes: number;
}
