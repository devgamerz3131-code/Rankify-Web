import { CBSEClassNumber } from './cbse';

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'board-level';

export interface PracticeQuestion {
  id: string;
  subjectId: string;
  chapterId: string;
  classNumber: CBSEClassNumber;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  difficulty: DifficultyLevel;
  ncertReference?: string;
}

export interface PracticeSession {
  id: string;
  userId: string;
  chapterId: string;
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  timeSpentSeconds: number;
  completedAt: string;
}
