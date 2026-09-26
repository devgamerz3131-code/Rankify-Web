import { PromptResult, PromptCategory } from '../model/types';
import { detectSubjectAndChapter } from './detector';

/**
 * Extracts a neat topic string from the student's question.
 */
function extractTopicFromQuery(query: string, fallbackChapter: string): string {
  const clean = query.trim();
  // If the query already starts with "Explain", "Teach", etc., preserve the title cleanly
  const explainMatch = clean.match(/^(?:explain|teach me|describe|summary of|notes on|guide for|overview of|how to do)\s+(.*)$/i);
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
function determineCategory(query: string): PromptCategory {
  const q = query.toLowerCase();
  if (q.includes('derivation') || q.includes('derive') || q.includes('proof')) {
    return 'ncert_derivations';
  }
  if (q.includes('formula') || q.includes('equation') || q.includes('sheet')) {
    return 'formula_sheet';
  }
  if (q.includes('pyq') || q.includes('question') || q.includes('exam') || q.includes('drill')) {
    return 'pyq_drills';
  }
  if (q.includes('numerical') || q.includes('problem') || q.includes('solve')) {
    return 'numerical_problems';
  }
  if (q.includes('note') || q.includes('revision') || q.includes('short') || q.includes('mindmap')) {
    return 'revision_notes';
  }
  return 'concept_explanation';
}

/**
 * Rankify AI Prompt Engine
 * Purely generates structured CBSE Class 12 study prompts.
 * Does NOT call any AI API. Does NOT answer doubts.
 */
export function generateStudyPrompt(userQuery: string): PromptResult {
  const { subject, chapter } = detectSubjectAndChapter(userQuery);
  const topic = extractTopicFromQuery(userQuery, chapter.name);
  const category = determineCategory(userQuery);

  const teacherSubject = subject === 'General CBSE' ? 'Science' : subject;

  // The 9 standard CBSE requirement bullet points specified in Rankify AI design
  const standardBullets = [
    'NCERT explanation',
    'Board pattern',
    'Important formulas',
    'Common mistakes',
    'Memory tricks',
    'Practice questions',
    'Revision notes',
    'Numericals',
    'Simple language',
  ];

  // Build the exact structured prompt
  const generatedPrompt = [
    `You are an expert CBSE Class 12 ${teacherSubject} teacher.`,
    '',
    `Explain ${topic}.`,
    '',
    'Include:',
    '',
    ...standardBullets.map((item) => `${item}\n`),
  ].join('\n').trim();

  return {
    subject,
    chapter,
    category,
    generatedPrompt,
    bulletPoints: standardBullets,
    rawQuery: userQuery,
    generatedAt: Date.now(),
  };
}
