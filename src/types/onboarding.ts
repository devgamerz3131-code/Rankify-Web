export type BoardType = 'CBSE' | 'RBSE' | 'ICSE' | 'State Board';
export type ClassNumber = 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type MediumType = 'English' | 'Hindi';
export type PreferredLanguageType = 'English' | 'Hindi' | 'Hinglish';

export interface StudentDetails {
  name: string;
  classNumber: ClassNumber;
  board: BoardType;
  medium: MediumType;
  preferredLanguage: PreferredLanguageType;
  targetPercentage: number;
  stream?: 'science-pcm' | 'science-pcb' | 'science-pcmb' | 'commerce' | 'arts' | 'general';
}

export interface SubjectItem {
  id: string;
  name: string;
  code?: string;
  color: string;
  iconName?: string;
  isCore?: boolean;
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
  holidays: string[]; // e.g. ['Sunday', 'Saturday']
}

export type ExamType = 'School Test' | 'Half Yearly' | 'Boards' | 'JEE' | 'NEET' | 'Custom';

export interface UpcomingExam {
  examType: ExamType;
  customExamName?: string;
  examDate: string;
  daysRemaining?: number;
}

export type LearningStyleType = 'Video' | 'Notes' | 'Questions' | 'Mixed';
export type RevisionStyleType = 'Daily' | 'Alternate Day' | 'Weekend';

export type ChapterStatusType = 'Never Started' | 'Started' | 'Need Revision' | 'Completed';
export type ConfidenceLevel = 1 | 2 | 3 | 4 | 5;

export interface ChapterProgress {
  id: string;
  chapterId: string;
  chapterName: string;
  subjectId: string;
  subjectName: string;
  status: ChapterStatusType;
  confidence: ConfidenceLevel;
  lastStudied: string | null;
  studyMinutes: number;
  questionSolved: number;
  revisionCount: number;
  completionPercentage: number;
  topics?: string[];
  orderIndex: number;
  updatedAt: string;
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
