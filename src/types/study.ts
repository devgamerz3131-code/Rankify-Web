import { CBSEClassNumber } from './cbse';

export type StudyMaterialType = 'notes' | 'ncert-solutions' | 'concept-map' | 'formulas' | 'past-papers';

export interface StudyMaterial {
  id: string;
  subjectId: string;
  chapterId: string;
  classNumber: CBSEClassNumber;
  title: string;
  type: StudyMaterialType;
  contentUrl?: string;
  isPremium?: boolean;
  estimatedReadMinutes: number;
  updatedAt: string;
}

export interface UserChapterProgress {
  id: string;
  userId: string;
  chapterId: string;
  completedSubtopics: number;
  totalSubtopics: number;
  percentComplete: number;
  lastStudiedAt: string;
}
