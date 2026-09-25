export * from './AskAIView';
export * from './components/ClassicAITutorView';
export * from './components/ImageDoubtSolverView';
export * from './components/VoiceTutorView';
export * from './components/LectureAnalyzerView';
export * from './components/FutureAIHubView';
export * from './components/MarkdownMathRenderer';
export * from './components/StudyRecommendationsWidget';

export interface AIDoubtRequest {
  subjectId: string;
  chapterTitle?: string;
  question: string;
  classNumber: number;
}

export interface AIDoubtResponse {
  stepByStepSolution: string[];
  keyConcept: string;
  ncertReference?: string;
  relatedFormulas?: string[];
}
