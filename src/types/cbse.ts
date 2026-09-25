export type CBSEClassNumber = 9 | 10 | 11 | 12;

export interface CBSEClass {
  id: CBSEClassNumber;
  label: string;
  description: string;
}

export type CBSEStream = 'science' | 'commerce' | 'humanities' | 'general';

export interface CBSESubject {
  id: string;
  name: string;
  code: string;
  classes: CBSEClassNumber[];
  streams?: CBSEStream[];
  icon: string;
  color: string;
}

export interface CBSEChapter {
  id: string;
  subjectId: string;
  classNumber: CBSEClassNumber;
  title: string;
  chapterNumber: number;
  weightage?: number;
  totalSubtopics: number;
}
