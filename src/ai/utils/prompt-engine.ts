import {
  PromptResult,
  PromptCategory,
  QuestionType,
  StudyIntent,
  DifficultyLevel,
  PromptQualityScore,
  DetectedSubject,
  PromptBooster,
  StudentContextInfo,
  SmartPromptOptions,
} from '../model/types';
import {
  detectSubjectAndChapter,
  detectQuestionType,
  detectStudyIntent,
  detectDifficulty,
} from './detector';
import {
  getSavedStudentContext,
  formatStudentCoachDirective,
} from './student-context';

/**
 * Extracts a neat topic string from the student's question.
 */
function extractTopicFromQuery(query: string, fallbackChapter: string): string {
  const clean = query.trim();
  const explainMatch = clean.match(
    /^(?:explain|teach me|describe|summary of|notes on|guide for|overview of|how to do|what is|define|help me with|solve|practice)\s+(.*)$/i
  );
  if (explainMatch && explainMatch[1].trim().length > 2) {
    return explainMatch[1].trim().replace(/[?.!]+$/, '');
  }

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
    case 'Case Study':
    case 'Competency Question':
    case 'Important Questions':
      return 'pyq_drills';
    case 'Numerical':
    case 'Example':
      return 'numerical_problems';
    case 'Revision':
    case 'Short Notes':
      return 'revision_notes';
    case 'Concept':
    case 'Theory':
    case 'NCERT Exercise':
    default:
      return 'concept_explanation';
  }
}

/**
 * Builds the subject-specific pedagogical rule.
 */
function getSubjectPedagogyRule(subject: DetectedSubject): string[] {
  switch (subject) {
    case 'Mathematics':
      return [
        'Special Subject Instructions (Mathematics):',
        '• Solve every step clearly with justification.',
        '• Never skip intermediate calculations or algebra.',
        '• State all theorems, identities, and domain constraints explicitly.',
      ];
    case 'Physics':
      return [
        'Special Subject Instructions (Physics):',
        '• Explain physical intuition and real-world significance before formulas.',
        '• Highlight SI units, vector directions, and sign conventions.',
        '• Include circuit/ray/field line schematic descriptions.',
      ];
    case 'Chemistry':
      return [
        'Special Subject Instructions (Chemistry):',
        '• Explain chemical reactions with underlying mechanism/logic.',
        '• Highlight important exceptions, anomalous behaviors, and trends.',
        '• Specify exact reaction conditions (reagents, temperature, catalysts, IUPAC names).',
      ];
    default:
      return [
        'Special Subject Instructions (CBSE Science):',
        '• Connect theoretical definitions directly to the NCERT textbook.',
        '• Provide concrete illustrative examples.',
      ];
  }
}

/**
 * Builds booster directives if booster is active.
 */
function getBoosterDirective(booster?: PromptBooster): string[] {
  if (!booster) return [];
  switch (booster) {
    case 'Easy Mode':
      return [
        'Active Booster: 🟢 Easy Mode (Beginner Friendly)',
        '• Use intuitive real-world analogies before formal academic jargon.',
        '• Break mathematical steps into atomic chunks with explanatory callouts.',
        '• Define every technical term in plain language.',
      ];
    case 'Board Mode':
      return [
        'Active Booster: 🟣 Board Exam Mode (CBSE Pattern)',
        '• Frame answers strictly as per CBSE marking schemes with explicit mark allocations.',
        '• Highlight essential board keywords to underline in the exam.',
        '• Emphasize point-wise presentation and NCERT diagram labels.',
      ];
    case 'Topper Mode':
      return [
        'Active Booster: ⚡ Topper Mode (95%+ Target)',
        '• Include High-Order Thinking Skills (HOTS) questions and subtle conceptual traps.',
        '• Rigorously state theoretical edge cases, boundary conditions, and proofs.',
        '• Provide challenge numericals requiring cross-chapter synthesis.',
      ];
    case 'Crash Course':
      return [
        'Active Booster: 🚀 Crash Course (High-Density Recall)',
        '• Deliver maximum conceptual density with zero fluff.',
        '• Prioritize high-weightage formulas, definitions, and recurrent exam triggers.',
        '• Use structured comparison tables and rapid-fire bullet points.',
      ];
    case 'Revision Only':
      return [
        'Active Booster: 🔄 Revision Only (Rapid Summary)',
        '• Focus strictly on one-page summary points, key formulas, and memory tricks.',
        '• Skip lengthy introductory prose in favor of direct board points.',
      ];
    case 'NCERT Only':
      return [
        'Active Booster: 📖 NCERT Only (Textbook Grounding)',
        '• Cite exact NCERT chapter sections, solved examples, and in-text questions.',
        '• Restrict definitions to official NCERT phrasing.',
      ];
    case 'PYQs Only':
      return [
        'Active Booster: 🏆 PYQs Only (10-Year Board Focus)',
        '• Structure entire response around verified CBSE Delhi & All India board questions.',
        '• Detail year of appearance, question format (2/3/5 marks), and official key points.',
      ];
    case 'Numericals Only':
      return [
        'Active Booster: 🔢 Numericals Only (Calculation Drill)',
        '• Provide representative numerical problems with given data, formula, and step marking.',
        '• Include SI unit conversions and common calculation errors.',
      ];
    case 'Formula Only':
      return [
        'Active Booster: 📐 Formula Sheet Only (Master Reference)',
        '• Compile complete formula table with symbols, SI units, and dimensions.',
        '• Include sign conventions and applicability limits.',
      ];
    default:
      return [];
  }
}

/**
 * Builds custom directives from SmartPromptOptions (Level, Depth, Language).
 */
function getSmartOptionsDirective(
  options?: SmartPromptOptions,
  studentFallbackLang: string = 'English'
): string[] {
  if (!options) return [];
  const lines: string[] = [];

  // 1. Level directive
  if (options.level === 'Explain Like Beginner') {
    lines.push('Pedagogical Level: Explain like I am a beginner with relatable analogies and intuitive zero-confusion examples.');
  } else if (options.level === 'Topper Level') {
    lines.push('Pedagogical Level: Topper Level (95%+ Target) - Include subtle board exam traps, HOTS problems, and rigorous justifications.');
  } else if (options.level === 'Board Level') {
    lines.push('Pedagogical Level: Standard CBSE Class 12 Board Level - Strict adherence to NCERT syllabus guidelines.');
  }

  // 2. Depth directive
  if (options.depth === 'Very Detailed') {
    lines.push('Depth: Comprehensive & Very Detailed - Break down all intermediate derivations, sub-concepts, and variations.');
  } else if (options.depth === 'Very Short') {
    lines.push('Depth: Ultra Concise & Crisp - Stick to high-yield bullet points, core formulas, and rapid memory triggers.');
  }

  // 3. Language directive
  const activeLang = options.language === 'Auto' ? studentFallbackLang : options.language;
  if (activeLang === 'Hindi') {
    lines.push('Language Instruction: Explain primarily in clear, easy Hindi (Devanagari script with key English scientific terms in brackets).');
  } else if (activeLang === 'Hinglish') {
    lines.push('Language Instruction: Explain in conversational Hinglish (Hindi + English mix) so understanding feels intuitive, friendly, and memorable.');
  } else if (activeLang === 'English') {
    lines.push('Language Instruction: Use fluent, clear English matching CBSE board examination answer standards.');
  }

  return lines;
}

/**
 * Gets customized focus instructions according to question type and study intent.
 */
function getTaskDirective(
  topic: string,
  questionType: QuestionType,
  intent: StudyIntent
): string {
  switch (questionType) {
    case 'Derivation':
      return `Provide the complete, step-by-step NCERT derivation for ${topic}, stating all starting assumptions, diagrams, and concluding relations.`;
    case 'Numerical':
      return `Solve high-yield CBSE numerical problems on ${topic} with complete step-marking, formula substitution, and SI units.`;
    case 'Formula':
      return `Compile the master CBSE formula sheet for ${topic}, including SI units, dimensional formulas, and sign conventions.`;
    case 'PYQ':
      return `Provide the most repeated CBSE Board Previous Year Questions (PYQs) for ${topic} with model marking-scheme answers.`;
    case 'Assertion Reason':
      return `Create and dissect high-probability CBSE Assertion-Reason questions for ${topic}, analyzing both statements and the exact causal explanation.`;
    case 'MCQ':
      return `Generate top CBSE Class 12 MCQs for ${topic}, with realistic board-level distractors and detailed reasoning for each option.`;
    case 'Case Study':
    case 'Competency Question':
      return `Construct a realistic CBSE Competency-Based Case Study passage for ${topic}, followed by 3-4 structured board exam questions with solutions.`;
    case 'Short Notes':
      return `Provide crisp, high-yield NCERT revision notes and mind-map points for ${topic}.`;
    case 'Revision':
      return `Deliver a fast, comprehensive one-shot board revision breakdown for ${topic} covering all essentials.`;
    case 'Important Questions':
      return `Curate the top predicted high-probability CBSE questions for ${topic} sorted by marks (2, 3, and 5 markers).`;
    case 'NCERT Exercise':
      return `Solve and explain essential NCERT in-text and back-exercise questions for ${topic} with board presentation.`;
    case 'Example':
      return `Walk through core NCERT solved examples and illustrations for ${topic} step by step.`;
    case 'Theory':
      return `Explain the complete theoretical foundation, operating principle, and NCERT diagrams for ${topic}.`;
    case 'Concept':
    default:
      return `Explain ${topic} thoroughly in very simple language, then progressively build to CBSE board exam mastery.`;
  }
}

/**
 * Rankify AI Personal Study Coach Prompt Engine
 * Transforms any student doubt into an expert, personalized CBSE Class 12 study prompt.
 * Seamlessly integrates student progress, weak chapters, targets, smart options, and one-tap boosters.
 * Zero external APIs. 100% offline synthesis.
 */
export function generateStudyPrompt(
  userQuery: string,
  customBooster?: PromptBooster,
  explicitStudentContext?: StudentContextInfo,
  promptOptions?: SmartPromptOptions
): PromptResult {
  const { subject, chapter } = detectSubjectAndChapter(userQuery);
  const questionType = detectQuestionType(userQuery);
  const intent = detectStudyIntent(userQuery);
  let difficulty = detectDifficulty(userQuery);

  // If promptOptions level overrides difficulty
  if (promptOptions?.level === 'Explain Like Beginner') {
    difficulty = 'Easy';
  } else if (promptOptions?.level === 'Topper Level') {
    difficulty = 'Challenge (95%+)';
  } else if (promptOptions?.level === 'Board Level') {
    difficulty = 'Board Level';
  }

  const topic = extractTopicFromQuery(userQuery, chapter.name);
  const category = mapQuestionTypeToCategory(questionType);

  const studentContext =
    explicitStudentContext || getSavedStudentContext(subject, chapter);
  const coachDirectives = formatStudentCoachDirective(
    studentContext,
    subject,
    chapter.name
  );
  const boosterDirectives = getBoosterDirective(customBooster);
  const optionsDirectives = getSmartOptionsDirective(
    promptOptions,
    studentContext.preferredLanguage
  );
  const taskDirective = getTaskDirective(topic, questionType, intent);
  const subjectPedagogy = getSubjectPedagogyRule(subject);

  // Standard 16 CBSE Requirements specified in the prompt architecture
  const standardRequirements = [
    '✔ NCERT based explanation',
    '✔ Board pattern',
    '✔ Competency based learning',
    '✔ Common mistakes',
    '✔ Memory tricks',
    '✔ Important formulas',
    '✔ Formula derivation',
    '✔ PYQ discussion',
    '✔ Frequently asked questions',
    '✔ Conceptual understanding',
    '✔ Exam tips',
    '✔ Short notes',
    '✔ One page revision',
    '✔ Practice questions',
    '✔ Challenge questions',
    '✔ Final recap',
  ];

  // Build the intelligent, personalized prompt text
  const promptLines: string[] = [
    'You are an expert CBSE Class 12 teacher and personal academic coach.',
    '',
    ...coachDirectives,
    '',
    ...(optionsDirectives.length > 0 ? [...optionsDirectives, ''] : []),
    ...(boosterDirectives.length > 0 ? [...boosterDirectives, ''] : []),
    `Subject: ${subject}`,
    `Chapter: ${chapter.name}`,
    `Focus Area: ${questionType}`,
    `Study Intent: ${intent}`,
    `Target Difficulty: ${difficulty}`,
    '',
    'Teach according to CBSE Board.',
    '',
    'Explain in beginner friendly language.',
    '',
    'Then gradually increase the level.',
    '',
    `Topic / Core Objective:`,
    taskDirective,
    '',
    'Requirements:',
    '',
    ...standardRequirements,
    '',
    ...subjectPedagogy,
    '',
    'Difficulty Progression:',
    'Easy → Medium → Board Level → 95%+ Target Challenge',
    '',
    'Do not skip any step, calculation, or conceptual foundation.',
  ];

  const generatedPrompt = promptLines.join('\n');
  const charCount = generatedPrompt.length;
  const wordCount = generatedPrompt.trim().split(/\s+/).filter(Boolean).length;

  // Compute Prompt Quality Score: Excellent, Very High, High, Good
  let qualityScore: PromptQualityScore = 'Excellent';
  if (userQuery.trim().length < 8) {
    qualityScore = 'High';
  } else if (subject === 'General CBSE') {
    qualityScore = 'Very High';
  }

  // Estimated response length & study time calculations
  let estimatedResponseLength = '~1,800 - 2,500 words (Comprehensive Board Guide)';
  let estimatedStudyTime = '15 - 20 mins';
  let estimatedReadingTime = '4 min read';
  let estimatedSolvingTime = '12 min solve';

  if (promptOptions?.depth === 'Very Short' || intent === 'Quick Revision' || questionType === 'Formula') {
    estimatedResponseLength = '~800 - 1,200 words (Crisp High-Yield Points)';
    estimatedStudyTime = '8 - 10 mins';
    estimatedReadingTime = '2 min read';
    estimatedSolvingTime = '6 min solve';
  } else if (promptOptions?.depth === 'Very Detailed' || intent === 'Numerical Practice' || questionType === 'Derivation') {
    estimatedResponseLength = '~2,200 - 3,200 words (In-Depth Step Working)';
    estimatedStudyTime = '25 - 35 mins';
    estimatedReadingTime = '6 min read';
    estimatedSolvingTime = '20 min solve';
  } else if (intent === 'Sample Paper Help' || questionType === 'Competency Question') {
    estimatedResponseLength = '~2,000 - 2,800 words (Case Studies & Marking Scheme)';
    estimatedStudyTime = '20 - 30 mins';
    estimatedReadingTime = '5 min read';
    estimatedSolvingTime = '15 min solve';
  }

  return {
    subject,
    chapter,
    questionType,
    intent,
    difficulty,
    boardPattern: 'CBSE 2024-25 / 2025-26 Competency Pattern',
    qualityScore,
    estimatedQuality: `${qualityScore} (Pedagogical CBSE Master Prompt)`,
    estimatedResponseLength,
    estimatedStudyTime,
    estimatedReadingTime,
    estimatedSolvingTime,
    promptLength: {
      chars: charCount,
      words: wordCount,
    },
    activeBooster: customBooster,
    promptOptions,
    studentContext,
    generatedPrompt,
    bulletPoints: standardRequirements,
    rawQuery: userQuery,
    generatedAt: Date.now(),
    isFavorite: false,
    lastUsedAt: Date.now(),
    useCount: 1,
  };
}
