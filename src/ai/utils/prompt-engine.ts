import { PromptResult, PromptCategory, QuestionType } from '../model/types';
import { detectSubjectAndChapter, detectQuestionType } from './detector';

/**
 * Extracts a neat topic string from the student's question.
 */
function extractTopicFromQuery(query: string, fallbackChapter: string): string {
  const clean = query.trim();
  // If the query already starts with "Explain", "Teach", etc., preserve the title cleanly
  const explainMatch = clean.match(
    /^(?:explain|teach me|describe|summary of|notes on|guide for|overview of|how to do|what is|define)\s+(.*)$/i
  );
  if (explainMatch && explainMatch[1].trim().length > 2) {
    return explainMatch[1].trim().replace(/[?.!]+$/, '');
  }

  // If query is short, use it directly or fall back to chapter name
  if (clean.length > 0 && clean.length < 50) {
    return clean.replace(/[?.!]+$/, '');
  }

  return fallbackChapter;
}

/**
 * Determines prompt category based on query keywords.
 */
function mapQuestionTypeToCategory(qType: QuestionType): PromptCategory {
  switch (qType) {
    case 'Derivation':
      return 'ncert_derivations';
    case 'Formula':
      return 'formula_sheet';
    case 'PYQ':
    case 'MCQ':
    case 'Assertion Reason':
    case 'Competency Question':
      return 'pyq_drills';
    case 'Numerical':
      return 'numerical_problems';
    case 'Revision':
    case 'Notes':
      return 'revision_notes';
    case 'Concept':
    default:
      return 'concept_explanation';
  }
}

/**
 * Rankify AI Prompt Engine
 * Purely generates structured CBSE Class 12 study prompts.
 * Does NOT call any AI API. Does NOT answer doubts.
 */
export function generateStudyPrompt(userQuery: string): PromptResult {
  const { subject, chapter } = detectSubjectAndChapter(userQuery);
  const questionType = detectQuestionType(userQuery);
  const topic = extractTopicFromQuery(userQuery, chapter.name);
  const category = mapQuestionTypeToCategory(questionType);

  const teacherSubject = subject === 'General CBSE' ? 'Science' : subject;

  // Determine lead task based on question type
  let leadTask = `Explain ${topic} in very simple language.`;
  if (questionType === 'Derivation') {
    leadTask = `Provide the step-by-step NCERT derivation and conceptual breakdown for ${topic}.`;
  } else if (questionType === 'Numerical') {
    leadTask = `Solve and explain representative numerical problems on ${topic} with step-by-step CBSE marking schemes.`;
  } else if (questionType === 'Formula') {
    leadTask = `Provide the master formula sheet, SI units, dimensions, and sign conventions for ${topic}.`;
  } else if (questionType === 'PYQ') {
    leadTask = `Discuss the top CBSE Class 12 Previous Year Questions (PYQs) and answer-key pointers for ${topic}.`;
  } else if (questionType === 'MCQ') {
    leadTask = `Generate top CBSE Class 12 MCQs with step-by-step rationales for ${topic}.`;
  } else if (questionType === 'Assertion Reason') {
    leadTask = `Create and explain high-probability Assertion-Reason questions with crystal clear justifications for ${topic}.`;
  } else if (questionType === 'Competency Question') {
    leadTask = `Provide CBSE Competency-Based Case-Study questions and detailed solutions for ${topic}.`;
  } else if (questionType === 'Revision') {
    leadTask = `Provide a rapid one-shot revision guide for ${topic} in very simple language.`;
  } else if (questionType === 'Notes') {
    leadTask = `Provide crisp, high-yield CBSE revision notes for ${topic}.`;
  }

  // The comprehensive CBSE Class 12 requirements specified in the Prompt Engine design
  const requirements = [
    '• NCERT based',
    '• Board oriented',
    '• Step by step explanation',
    '• Important formulas',
    '• Formula derivations',
    '• Numerical examples',
    '• PYQ discussion',
    '• Common mistakes',
    '• Memory tricks',
    '• One-line revision',
    '• Exam tips',
    '• Practice questions',
    '• Difficulty level:',
    'Easy → Medium → Board Level',
    '',
    'Do not skip any concept.',
  ];

  // Build the exact structured prompt
  const generatedPrompt = [
    `You are an expert CBSE Class 12 ${teacherSubject} teacher.`,
    '',
    leadTask,
    '',
    'Requirements:',
    '',
    ...requirements,
  ].join('\n');

  const charCount = generatedPrompt.length;
  const wordCount = generatedPrompt.trim().split(/\s+/).filter(Boolean).length;

  return {
    subject,
    chapter,
    questionType,
    difficulty: 'Easy → Medium → Board Level',
    promptLength: {
      chars: charCount,
      words: wordCount,
    },
    estimatedQuality: '99.8% (Targeted)',
    generatedPrompt,
    bulletPoints: requirements,
    rawQuery: userQuery,
    generatedAt: Date.now(),
    isFavorite: false,
    lastUsedAt: Date.now(),
  };
}

