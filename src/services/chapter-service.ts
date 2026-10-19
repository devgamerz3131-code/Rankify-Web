import { OFFICIAL_CBSE_12_PCM_TEMPLATE } from '@/services/syllabus-templates';
export interface TaskItem {
  id: string;
  taskTitle: string;
  subjectName: string;
  chapterName: string;
  allocatedMinutes: number;
  priority?: string;
  difficulty?: string;
  isCompleted: boolean;
  status: 'pending' | 'completed' | 'skipped';
  isBonus?: boolean;
  bonusType?: 'weakness' | 'mistake' | 'exam' | 'revision' | 'practice';
}

export interface CanonicalChapter {
  id: string;
  name: string;
  subjectId: 'physics' | 'chemistry' | 'mathematics';
  subjectName: 'Physics' | 'Chemistry' | 'Mathematics';
  topics: string[];
  estimatedHours: number;
  weightage: number;
}

/**
 * Build canonical chapter registry directly from OFFICIAL_CBSE_12_PCM_TEMPLATE
 */
const CANONICAL_CHAPTERS: CanonicalChapter[] = [];
const CHAPTER_LOOKUP_MAP = new Map<string, CanonicalChapter>();
const SUBJECT_COUNTS = {
  total: 0,
  physics: 0,
  chemistry: 0,
  mathematics: 0,
};

// Initialize the registry once at module evaluation
OFFICIAL_CBSE_12_PCM_TEMPLATE.subjects.forEach((subj) => {
  const subjectId = subj.subjectId as 'physics' | 'chemistry' | 'mathematics';
  const subjectName = subj.subjectName as 'Physics' | 'Chemistry' | 'Mathematics';

  subj.chapters.forEach((ch, idx) => {
    const canonical: CanonicalChapter = {
      id: ch.id,
      name: ch.name,
      subjectId,
      subjectName,
      topics: ch.topics || [],
      estimatedHours: ch.estimatedHours || 10,
      weightage: ch.weightage || 7,
    };

    CANONICAL_CHAPTERS.push(canonical);

    // Primary ID key: 'phy_12_01', 'chem_12_02', etc.
    CHAPTER_LOOKUP_MAP.set(ch.id.toLowerCase(), canonical);

    // Shorthand keys: 'phy_ch1', 'chem_ch2', 'math_ch3'
    const shortPrefix = subjectId === 'physics' ? 'phy_ch' : subjectId === 'chemistry' ? 'chem_ch' : 'math_ch';
    CHAPTER_LOOKUP_MAP.set(`${shortPrefix}${idx + 1}`.toLowerCase(), canonical);

    // Short index keys: 'phy_1', 'chem_2', etc.
    const subPrefix = subjectId === 'physics' ? 'phy_' : subjectId === 'chemistry' ? 'chem_' : 'math_';
    CHAPTER_LOOKUP_MAP.set(`${subPrefix}${idx + 1}`.toLowerCase(), canonical);

    // Direct name keys (case-insensitive and trimmed)
    CHAPTER_LOOKUP_MAP.set(ch.name.toLowerCase().trim(), canonical);

    // Normalized slug key (e.g. 'electric_charges_and_fields')
    const slug = ch.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    CHAPTER_LOOKUP_MAP.set(slug, canonical);
    CHAPTER_LOOKUP_MAP.set(`${subjectId}_${slug}`, canonical);

    // Special aliases
    if (ch.name.includes('Chemical Kinetics')) {
      CHAPTER_LOOKUP_MAP.set('chem_chem_kinetics', canonical);
    }
  });

  if (subjectId === 'physics') SUBJECT_COUNTS.physics = subj.chapters.length;
  if (subjectId === 'chemistry') SUBJECT_COUNTS.chemistry = subj.chapters.length;
  if (subjectId === 'mathematics') SUBJECT_COUNTS.mathematics = subj.chapters.length;
});

SUBJECT_COUNTS.total = CANONICAL_CHAPTERS.length;

/**
 * Returns all 37 canonical CBSE Class 12 PCM chapters
 */
export function getAllCanonicalChapters(): CanonicalChapter[] {
  return CANONICAL_CHAPTERS;
}

/**
 * Returns dynamic chapter counts derived from syllabus data
 */
export function getSubjectChapterCounts() {
  return { ...SUBJECT_COUNTS };
}

/**
 * Total official CBSE Class 12 PCM chapter count (dynamically derived)
 */
export const TOTAL_OFFICIAL_CHAPTERS = SUBJECT_COUNTS.total;

/**
 * Lookup a chapter by ID or name. Returns the canonical ID, name, and subject.
 * Guarantees a valid human-readable chapter name and matching subject.
 */
export function getChapterById(idOrName: string | undefined | null): {
  id: string;
  name: string;
  subject: string;
  subjectName: 'Physics' | 'Chemistry' | 'Mathematics';
  topics: string[];
  weightage: number;
} {
  if (!idOrName || typeof idOrName !== 'string') {
    return {
      id: 'phy_12_01',
      name: 'Electric Charges and Fields',
      subject: 'Physics',
      subjectName: 'Physics',
      topics: [],
      weightage: 8,
    };
  }

  const clean = idOrName.trim().toLowerCase();

  // 1. Exact match in map
  if (CHAPTER_LOOKUP_MAP.has(clean)) {
    const c = CHAPTER_LOOKUP_MAP.get(clean)!;
    return {
      id: c.id,
      name: c.name,
      subject: c.subjectName,
      subjectName: c.subjectName,
      topics: c.topics,
      weightage: c.weightage,
    };
  }

  // 2. Fuzzy / partial match against chapter names
  for (const c of CANONICAL_CHAPTERS) {
    const cLower = c.name.toLowerCase();
    if (cLower === clean || clean.includes(cLower) || cLower.includes(clean)) {
      return {
        id: c.id,
        name: c.name,
        subject: c.subjectName,
        subjectName: c.subjectName,
        topics: c.topics,
        weightage: c.weightage,
      };
    }
  }

  // 3. Fallback: Parse subject from prefix or heuristics, capitalize name
  let fallbackSubject: 'Physics' | 'Chemistry' | 'Mathematics' = 'Physics';
  if (clean.startsWith('chem') || clean.includes('chemistry')) fallbackSubject = 'Chemistry';
  else if (clean.startsWith('math') || clean.includes('math')) fallbackSubject = 'Mathematics';

  const readableName = idOrName
    .replace(/^(phy|chem|math)(_12)?_0?/i, '')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return {
    id: idOrName,
    name: readableName || idOrName,
    subject: fallbackSubject,
    subjectName: fallbackSubject,
    topics: [],
    weightage: 7,
  };
}

/**
 * Computes accuracy percentage strictly when attempted > 0.
 * Returns null if attempted === 0.
 * If correct and attempted exist, accuracy = (correct / attempted) * 100.
 * If stored accuracy exists and attempted > 0, keeps stored accuracy.
 * Rounds to a whole number.
 */
export function computeAccuracy(
  attempted?: number | null,
  correct?: number | null,
  storedAccuracy?: number | null
): number | null {
  const attempts = typeof attempted === 'number' && !isNaN(attempted) ? Math.max(0, attempted) : 0;
  if (attempts === 0) {
    return null;
  }

  if (typeof correct === 'number' && !isNaN(correct) && correct >= 0) {
    const ratio = (correct / attempts) * 100;
    return Math.round(Math.min(100, Math.max(0, ratio)));
  }

  if (typeof storedAccuracy === 'number' && !isNaN(storedAccuracy) && storedAccuracy >= 0) {
    return Math.round(Math.min(100, Math.max(0, storedAccuracy)));
  }

  return null;
}

export interface AccuracyDisplayResult {
  display: string;
  ariaLabel: string;
  isAttempted: boolean;
  value: number | null;
}

/**
 * Formats accuracy for UI display.
 * If attempted is 0, returns '-' (en dash) with aria-label "No attempts yet".
 * Never returns NaN, Infinity, or default 70.
 */
export function formatAccuracyDisplay(
  attempted?: number | null,
  correct?: number | null,
  storedAccuracy?: number | null
): AccuracyDisplayResult {
  const val = computeAccuracy(attempted, correct, storedAccuracy);
  if (val === null) {
    return {
      display: '–',
      ariaLabel: 'No attempts yet',
      isAttempted: false,
      value: null,
    };
  }

  return {
    display: `${val}%`,
    ariaLabel: `${val} percent accuracy`,
    isAttempted: true,
    value: val,
  };
}

/**
 * Regex pattern matching raw chapter IDs like:
 * phy_12_01, chem_12_04, math_12_13, phy_ch1, chem_ch2, math_ch3, etc.
 */
const RAW_CHAPTER_ID_REGEX = /\b(phy|chem|math)(_12|_ch)?_[0-9]{1,2}\b/gi;
const RAW_CHAPTER_ID_TEST_REGEX = /\b(phy|chem|math)(_12|_ch)?_[0-9]{1,2}\b/i;

/**
 * Replaces any raw chapter ID inside a title or text string with the official chapter name.
 */
export function cleanTaskTitle(rawText: string): string {
  if (!rawText) return '';
  return rawText.replace(RAW_CHAPTER_ID_REGEX, (match) => {
    const ch = getChapterById(match);
    return ch.name;
  });
}

/**
 * Repairs a single task so that:
 * 1. Raw IDs in taskTitle are replaced with chapter names.
 * 2. Raw IDs in chapterName are replaced with the official chapter name.
 * 3. subjectName is corrected to match the chapter's actual subject.
 */
export function sanitizeTask(task: TaskItem): TaskItem {
  if (!task) return task;

  const rawChapter = task.chapterName || '';
  let resolvedChapter = getChapterById(rawChapter);

  // If chapterName was a raw ID or empty, or title contains a specific raw ID, resolve precisely
  const rawIdInTitle = task.taskTitle ? task.taskTitle.match(RAW_CHAPTER_ID_REGEX) : null;
  if (rawIdInTitle && rawIdInTitle[0]) {
    const fromTitle = getChapterById(rawIdInTitle[0]);
    if (fromTitle) {
      resolvedChapter = fromTitle;
    }
  }

  const isRawChapterId =
    RAW_CHAPTER_ID_TEST_REGEX.test(rawChapter) ||
    rawChapter.startsWith('phy_') ||
    rawChapter.startsWith('chem_') ||
    rawChapter.startsWith('math_');

  const properChapterName = isRawChapterId || !rawChapter ? resolvedChapter.name : getChapterById(rawChapter).name;
  const properSubjectName = resolvedChapter.subjectName;

  // Clean title
  let cleanedTitle = cleanTaskTitle(task.taskTitle || '');
  if (rawChapter && isRawChapterId) {
    cleanedTitle = cleanedTitle.split(rawChapter).join(resolvedChapter.name);
  }

  return {
    ...task,
    taskTitle: cleanedTitle,
    chapterName: properChapterName,
    subjectName: properSubjectName,
  };
}

/**
 * Repairs an array of tasks (resolves IDs at render time & load time)
 */
export function sanitizeTasks(tasks: TaskItem[]): TaskItem[] {
  if (!Array.isArray(tasks)) return [];
  return tasks.map(sanitizeTask);
}
