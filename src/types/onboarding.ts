export type BoardType = 'CBSE';
export type ClassNumber = 12;
export type MediumType = 'English' | 'Hindi';
export type PreferredLanguageType = 'English' | 'Hindi' | 'Hinglish';

export interface StudentDetails {
  name: string;
  classNumber: 12;
  board: 'CBSE';
  medium: MediumType;
  preferredLanguage: PreferredLanguageType;
  targetPercentage: number;
  stream: 'science-pcm';
}

export interface SubjectItem {
  id: 'physics' | 'chemistry' | 'mathematics';
  name: 'Physics' | 'Chemistry' | 'Mathematics';
  code: string;
  color: string;
  iconName?: string;
  isCore: boolean;
}

export interface StudyRoutine {
  studyHoursPerDay: number;
  schoolTiming: {
    start: string;
    end: string;
  };
  coachingTiming: {
    start: string;
    end: string;
    enabled: boolean;
  };
  wakeTime: string;
  sleepTime: string;
  holidays: string[]; // e.g. ['Sunday']
}

export type ExamType = 'Boards' | 'Pre-Boards' | 'School Test' | 'Half Yearly' | 'Custom';

export interface UpcomingExam {
  examType: ExamType;
  customExamName?: string;
  examDate: string;
  daysRemaining?: number;
}

export type LearningStyleType = 'Video' | 'Notes' | 'Questions' | 'Mixed';
export type RevisionStyleType = 'Daily' | 'Alternate Day' | 'Weekend';

export type ChapterStatusType = 'Never Started' | 'Started' | 'Need Revision' | 'Completed';
export type ProgressPercentage = 0 | 25 | 50 | 75 | 100;
export type ConfidenceLevel = 1 | 2 | 3 | 4 | 5;

export interface ChapterProgress {
  id: string;
  chapterId: string;
  chapterName: string;
  subjectId: 'physics' | 'chemistry' | 'mathematics';
  subjectName: 'Physics' | 'Chemistry' | 'Mathematics';
  progressPercentage: ProgressPercentage;
  confidence: ConfidenceLevel;
  revisionCount: number;
  practiceQuestions: number;
  weakTopics: string[];
  strongTopics: string[];
  timeSpent: number; // in minutes
  accuracy: number; // percentage 0 - 100
  completion: boolean;
  needsRevision: boolean;
  needsFocus: boolean;
  lastOpened: string | null;
  lastStudied: string | null;
  topics?: string[];
  orderIndex: number;
  updatedAt: string;
  // Backward compatibility fields
  status: ChapterStatusType;
  completionPercentage: number;
  studyMinutes: number;
  questionSolved: number;
}

export interface SubjectSyllabusTemplate {
  subjectId: string;
  subjectName: string;
  chapters: {
    id: string;
    name: string;
    topics: string[];
    estimatedHours: number;
    weightage?: number;
  }[];
}

export interface SyllabusTemplateDocument {
  id: string; // `${board}_${class}`
  board: BoardType;
  classNumber: ClassNumber;
  subjects: SubjectSyllabusTemplate[];
  updatedAt: string;
}

export interface WeakSubjectAnalysis {
  weakSubjects: string[];
  strongSubjects: string[];
  averageSubjects: string[];
  difficultyScore: number; // 0 - 100
  revisionPriority: Record<string, 'High' | 'Medium' | 'Low'>;
  subjectStats: Record<
    string,
    {
      subjectName: string;
      averageConfidence: number;
      completedRatio: number;
      status: 'Weak' | 'Average' | 'Strong';
      totalChapters: number;
      completedChapters: number;
    }
  >;
}

export interface PriorityQueueItem {
  chapterId: string;
  chapterName: string;
  subjectName: string;
  priority: 'Urgent' | 'High' | 'Medium';
  reason: string;
  estimatedMinutes: number;
}

export interface DailyTargetItem {
  id: string;
  dayNumber: number;
  date: string;
  chapterName: string;
  subjectName: string;
  taskTitle: string;
  allocatedMinutes: number;
  isCompleted: boolean;
}

export interface WeeklyTargetItem {
  id: string;
  weekNumber: number;
  title: string;
  goals: string[];
  isCompleted: boolean;
}

export interface RevisionQueueItem {
  chapterId: string;
  chapterName: string;
  subjectName: string;
  scheduledDate: string;
  revisionMethod: string;
}

export interface AIStudyPlan {
  id: string;
  userId: string;
  todaysMission: string;
  todaysChapters: string[];
  todaysQuestions: number;
  revisionTasks: {
    id: string;
    title: string;
    chapterName: string;
    subjectName: string;
    isCompleted: boolean;
  }[];
  focusTopic: string;
  estimatedCompletion: string;
  motivation: string;
  studyStreak: number;
  accuracy: number;
  weakestChapter: string;
  strongestChapter: string;
  dailyGoal: {
    minutes: number;
    tasksCount: number;
  };
  dailyTasks: {
    id: string;
    taskTitle: string;
    subjectName: string;
    chapterName: string;
    allocatedMinutes: number;
    isCompleted: boolean;
    status: 'pending' | 'completed' | 'skipped';
  }[];
  weakChapters: string[];
  strongChapters: string[];
  priorityQueue: PriorityQueueItem[];
  dailyTargets: DailyTargetItem[];
  weeklyTargets: WeeklyTargetItem[];
  revisionQueue: RevisionQueueItem[];
  recommendedStudyHours: number;
  expectedCompletionDate: string;
  recommendedSessionLength: number; // in minutes (e.g. 45)
  difficultyRating: 'Balanced' | 'High Intensity' | 'Rigorous' | 'Foundation';
  generatedAt: string;
  summary: string;
}

export interface OnboardingState {
  currentScreen: number; // 1 to 8
  isSaving: boolean;
  lastSavedAt: string | null;
  studentDetails: StudentDetails;
  selectedSubjectIds: string[];
  studyRoutine: StudyRoutine;
  upcomingExam: UpcomingExam;
  learningStyle: LearningStyleType;
  revisionStyle: RevisionStyleType;
  chapterProgressMap: Record<string, ChapterProgress>;
  weakSubjectAnalysis: WeakSubjectAnalysis | null;
  aiStudyPlan: AIStudyPlan | null;
  isPlanGenerating: boolean;
  generationProgress: number; // 0 - 100
  generationMessage: string;
}
