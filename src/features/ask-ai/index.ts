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
