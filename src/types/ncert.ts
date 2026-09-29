export type NcertSubject = 'Physics' | 'Chemistry' | 'Mathematics';

export type ImportantLineTag = 'very_important' | 'board_favourite' | 'frequently_asked' | 'high_weightage';

export type ReaderTheme = 'light' | 'sepia' | 'dark' | 'night';

export type ReaderFontSize = 'small' | 'medium' | 'large' | 'xl';

export type RevisionModeType = '5_min' | '15_min' | '30_min' | 'one_night_before';

export type QuestionType =
  | 'mcq'
  | 'numerical'
  | 'short_answer'
  | 'long_answer'
  | 'case_based'
  | 'competency_based'
  | 'assertion_reason';

export interface NcertParagraphExplanation {
  simpleExplanation: string;
  detailedExplanation: string;
  examPointOfView: string;
  realLifeExample: string;
  commonMistakes: string[];
  difficultWords: { word: string; meaning: string }[];
}

export interface NcertRelatedContent {
  formulas: { title: string; latex: string; explanation: string; variables: string }[];
  derivations: { title: string; steps: string[]; boardMarks: number }[];
  pyqs: { year: string; marks: number; question: string; answerSummary: string; frequencyCount: number }[];
  competencyQuestions: { question: string; realWorldContext: string; solutionKey: string }[];
  assertionReasons: { assertion: string; reason: string; correctOption: 'A' | 'B' | 'C' | 'D'; explanation: string }[];
  caseStudies: { passage: string; subQuestions: string[]; answers: string[] }[];
  lectureVideoId?: string;
  lectureTitle?: string;
  lectureTimestamp?: string;
  flashcardIds?: string[];
  quickNoteSummary?: string;
}

export interface NcertMemoryBooster {
  mnemonic: string;
  story: string;
  visualization: string;
  memoryTrick: string;
  songIdea: string;
  quickRecallPoints: string[];
}

export interface NcertAutoNotes {
  shortNotes: string[];
  detailedNotes: string[];
  onePageNotes: string[];
  examRevisionNotes: string[];
}

export interface NcertPracticeQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  marks: number;
  boardYear?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface NcertParagraph {
  id: string;
  paragraphIndex: number;
  heading?: string;
  subheading?: string;
  text: string;
  importantLineTag?: ImportantLineTag;
  explanation: NcertParagraphExplanation;
  relatedContent: NcertRelatedContent;
  memoryBooster: NcertMemoryBooster;
}

export interface NcertTopic {
  id: string;
  topicIndex: number;
  title: string;
  estimatedMinutes: number;
  paragraphs: NcertParagraph[];
  autoNotes: NcertAutoNotes;
  practiceQuestions: NcertPracticeQuestion[];
}

export interface NcertChapter {
  id: string;
  chapterNumber: number;
  title: string;
  subject: NcertSubject;
  bookPart: 'Part 1' | 'Part 2';
  weightageMarks: number;
  totalEstimatedMinutes: number;
  summary: string;
  topics: NcertTopic[];
  revisionPack: {
    fiveMinRevision: string[];
    fifteenMinRevision: { concept: string; points: string[] }[];
    thirtyMinRevision: { derivation: string; exemplarTraps: string[] }[];
    oneNightBefore: { vitalDefinitions: string[]; boardGuaranteedDerivations: string[] }[];
  };
}

export interface NcertHighlight {
  id: string;
  paragraphId: string;
  color: 'yellow' | 'green' | 'pink' | 'blue' | 'purple';
  isUnderline?: boolean;
  textSnippet: string;
  createdAt: number;
}

export interface NcertBookmark {
  id: string;
  paragraphId: string;
  chapterId: string;
  topicTitle: string;
  title: string;
  createdAt: number;
}

export interface NcertPersonalNote {
  id: string;
  paragraphId: string;
  chapterId: string;
  noteText: string;
  updatedAt: number;
}

export interface UserChapterProgress {
  chapterId: string;
  readingMinutes: number;
  completionPercent: number; // 0 - 100
  lastReadParagraphId: string;
  lastReadTimestamp: number;
  revisionsCount: number;
  confidenceScore: number; // 0 - 100
  questionsSolvedCount: number;
  highlightsCount: number;
  bookmarksCount: number;
  notesCount: number;
}

export interface ReaderSettings {
  fontSize: ReaderFontSize;
  theme: ReaderTheme;
  lineHeight: 'normal' | 'relaxed' | 'loose';
  voiceSpeed: number; // 0.75, 1, 1.25, 1.5, 2
  speechPitch: number;
  autoScroll: boolean;
}

export interface NcertIntelligenceState {
  progressMap: Record<string, UserChapterProgress>;
  highlights: Record<string, NcertHighlight[]>; // keyed by chapterId
  bookmarks: NcertBookmark[];
  personalNotes: Record<string, NcertPersonalNote[]>; // keyed by chapterId
  readerSettings: ReaderSettings;
  overallStats: {
    totalReadingTimeMinutes: number;
    completedChaptersCount: number;
    totalBookmarksCount: number;
    totalHighlightsCount: number;
    totalPersonalNotesCount: number;
    averageConfidence: number;
    revisionSessionsRun: number;
  };
}
