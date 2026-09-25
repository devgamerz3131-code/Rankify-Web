import { OFFICIAL_CBSE_12_PCM_TEMPLATE } from '@/services/syllabus-templates';

export interface AskAIRequest {
  question: string;
  subject?: string;
  chapter?: string;
  mode?:
    | 'ask-doubt'
    | 'explain-concept'
    | 'formula-explanation'
    | 'numerical-help'
    | 'ncert-explanation'
    | 'pyq-discussion'
    | 'short-notes'
    | 'revision-mode'
    | 'practice-questions';
  history?: Array<{ sender: 'user' | 'ai'; text: string }>;
  memoryContext?: {
    currentSubject?: string;
    currentChapter?: string;
    recentDoubts?: string[];
    recentWeakTopics?: string[];
  };
}

export interface AskAIResponse {
  reply: string;
  fallback?: boolean;
  fromCache?: boolean;
  subject?: string;
  chapter?: string;
  mode?: string;
  error?: string;
}

export interface AIRecommendationItem {
  type: string;
  title: string;
  chapter: string;
  subject: string;
  action: string;
  reason: string;
}

// Client-side cache to minimize latency & repeated queries
const clientCache = new Map<string, { data: AskAIResponse; timestamp: number }>();
const CLIENT_CACHE_TTL = 1000 * 60 * 15; // 15 mins

// In-flight request tracker
const inFlightRequests = new Map<string, Promise<AskAIResponse>>();

/**
 * Intelligent Subject & Chapter detector based on CBSE Class 12 PCM terminology.
 */
export function detectSubjectAndChapter(query: string): {
  detectedSubject: 'Physics' | 'Chemistry' | 'Mathematics' | null;
  detectedChapter: string | null;
} {
  const q = query.toLowerCase();

  // 1. Check Physics
  if (
    q.includes('coulomb') ||
    q.includes('electric charge') ||
    q.includes('gauss') ||
    q.includes('electric field')
  ) {
    return { detectedSubject: 'Physics', detectedChapter: 'Electric Charges and Fields' };
  }
  if (q.includes('capacit') || q.includes('equipotential') || q.includes('dielectric')) {
    return { detectedSubject: 'Physics', detectedChapter: 'Electrostatic Potential and Capacitance' };
  }
  if (q.includes('ohm') || q.includes('drift velocity') || q.includes('kirchhoff') || q.includes('wheatstone')) {
    return { detectedSubject: 'Physics', detectedChapter: 'Current Electricity' };
  }
  if (q.includes('biot') || q.includes('ampere') || q.includes('galvanometer') || q.includes('lorentz')) {
    return { detectedSubject: 'Physics', detectedChapter: 'Moving Charges and Magnetism' };
  }
  if (q.includes('faraday') || q.includes('lenz') || q.includes('eddy current') || q.includes('inductance')) {
    return { detectedSubject: 'Physics', detectedChapter: 'Electromagnetic Induction' };
  }
  if (q.includes('ac circuit') || q.includes('alternating current') || q.includes('transformer') || q.includes('lcr')) {
    return { detectedSubject: 'Physics', detectedChapter: 'Alternating Current' };
  }
  if (q.includes('lens') || q.includes('refraction') || q.includes('mirror') || q.includes('optics') || q.includes('telescope')) {
    return { detectedSubject: 'Physics', detectedChapter: 'Ray Optics and Optical Instruments' };
  }
  if (q.includes('interference') || q.includes('diffraction') || q.includes('young') || q.includes('wave optics')) {
    return { detectedSubject: 'Physics', detectedChapter: 'Wave Optics' };
  }
  if (q.includes('photoelectric') || q.includes('work function') || q.includes('de broglie') || q.includes('dual nature')) {
    return { detectedSubject: 'Physics', detectedChapter: 'Dual Nature of Radiation and Matter' };
  }
  if (q.includes('semiconductor') || q.includes('diode') || q.includes('p-n junction') || q.includes('rectifier')) {
    return { detectedSubject: 'Physics', detectedChapter: 'Semiconductor Electronics: Materials, Devices and Simple Circuits' };
  }

  // 2. Check Chemistry
  if (q.includes('raoult') || q.includes('colligative') || q.includes('osmotic') || q.includes('molarity') || q.includes('van\'t hoff')) {
    return { detectedSubject: 'Chemistry', detectedChapter: 'Solutions' };
  }
  if (q.includes('nernst') || q.includes('kohlrausch') || q.includes('galvanic') || q.includes('electrochemistry')) {
    return { detectedSubject: 'Chemistry', detectedChapter: 'Electrochemistry' };
  }
  if (q.includes('rate constant') || q.includes('arrhenius') || q.includes('activation energy') || q.includes('half life') || q.includes('kinetics')) {
    return { detectedSubject: 'Chemistry', detectedChapter: 'Chemical Kinetics' };
  }
  if (q.includes('lanthanoid') || q.includes('transition element') || q.includes('kmno4') || q.includes('d block') || q.includes('f block')) {
    return { detectedSubject: 'Chemistry', detectedChapter: 'The d- and f-Block Elements' };
  }
  if (q.includes('werner') || q.includes('crystal field') || q.includes('ligand') || q.includes('coordination')) {
    return { detectedSubject: 'Chemistry', detectedChapter: 'Coordination Compounds' };
  }
  if (q.includes('sn1') || q.includes('sn2') || q.includes('haloalkane') || q.includes('haloarene')) {
    return { detectedSubject: 'Chemistry', detectedChapter: 'Haloalkanes and Haloarenes' };
  }
  if (q.includes('phenol') || q.includes('reimer') || q.includes('kolbe') || q.includes('williamson') || q.includes('ether') || q.includes('alcohol')) {
    return { detectedSubject: 'Chemistry', detectedChapter: 'Alcohols, Phenols and Ethers' };
  }
  if (q.includes('aldol') || q.includes('cannizzaro') || q.includes('aldehyde') || q.includes('ketone') || q.includes('carboxylic') || q.includes('hvz')) {
    return { detectedSubject: 'Chemistry', detectedChapter: 'Aldehydes, Ketones and Carboxylic Acids' };
  }
  if (q.includes('amine') || q.includes('hoffmann bromamide') || q.includes('diazonium')) {
    return { detectedSubject: 'Chemistry', detectedChapter: 'Amines' };
  }
  if (q.includes('glucose') || q.includes('fructose') || q.includes('peptide') || q.includes('dna') || q.includes('biomolecule')) {
    return { detectedSubject: 'Chemistry', detectedChapter: 'Biomolecules' };
  }

  // 3. Check Mathematics
  if (q.includes('relation') || q.includes('reflexive') || q.includes('symmetric') || q.includes('transitive') || q.includes('one-one') || q.includes('onto')) {
    return { detectedSubject: 'Mathematics', detectedChapter: 'Relations and Functions' };
  }
  if (q.includes('inverse trig') || q.includes('principal value') || q.includes('sin^-1') || q.includes('cos^-1') || q.includes('tan^-1')) {
    return { detectedSubject: 'Mathematics', detectedChapter: 'Inverse Trigonometric Functions' };
  }
  if (q.includes('matrix') || q.includes('matrices') || q.includes('skew symmetric') || q.includes('transpose')) {
    return { detectedSubject: 'Mathematics', detectedChapter: 'Matrices' };
  }
  if (q.includes('determinant') || q.includes('cramer') || q.includes('adjoint') || q.includes('cofactor')) {
    return { detectedSubject: 'Mathematics', detectedChapter: 'Determinants' };
  }
  if (q.includes('continuity') || q.includes('continuous function') || q.includes('differentiab') || q.includes('chain rule') || q.includes('implicit derivative') || q.includes('logarithmic diff')) {
    return { detectedSubject: 'Mathematics', detectedChapter: 'Continuity and Differentiability' };
  }
  if (q.includes('maxima') || q.includes('minima') || q.includes('rate of change') || q.includes('increasing decreasing')) {
    return { detectedSubject: 'Mathematics', detectedChapter: 'Application of Derivatives' };
  }
  if (q.includes('integral') || q.includes('integrat') || q.includes('partial fraction') || q.includes('by parts')) {
    return { detectedSubject: 'Mathematics', detectedChapter: 'Integrals' };
  }
  if (q.includes('differential equation') || q.includes('integrating factor') || q.includes('order and degree')) {
    return { detectedSubject: 'Mathematics', detectedChapter: 'Differential Equations' };
  }
  if (q.includes('dot product') || q.includes('cross product') || q.includes('vector') || q.includes('direction cosine')) {
    return { detectedSubject: 'Mathematics', detectedChapter: 'Vector Algebra' };
  }
  if (q.includes('3d') || q.includes('skew lines') || q.includes('shortest distance') || q.includes('equation of line in space') || q.includes('three-dimensional')) {
    return { detectedSubject: 'Mathematics', detectedChapter: 'Three-Dimensional Geometry' };
  }
  if (q.includes('linear program') || q.includes('feasible region') || q.includes('objective function')) {
    return { detectedSubject: 'Mathematics', detectedChapter: 'Linear Programming' };
  }
  if (q.includes('bayes') || q.includes('conditional probability') || q.includes('random variable') || q.includes('probability')) {
    return { detectedSubject: 'Mathematics', detectedChapter: 'Probability' };
  }

  return { detectedSubject: null, detectedChapter: null };
}

/**
 * Sends student doubt to Rankify Full-Stack AI engine with deduplication and retry.
 */
export async function askAITutor(req: AskAIRequest): Promise<AskAIResponse> {
  const subject = req.subject || 'Physics';
  const chapter = req.chapter || 'Electric Charges and Fields';
  const mode = req.mode || 'ask-doubt';
  const cacheKey = `${subject}::${chapter}::${mode}::${req.question.trim().toLowerCase()}`;

  // 1. Check local cache
  const cached = clientCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CLIENT_CACHE_TTL) {
    return {
      ...cached.data,
      fromCache: true,
    };
  }

  // 2. Check in-flight requests (prevent duplicate concurrent calls)
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey)!;
  }

  const promise = (async () => {
    let attempt = 0;
    const maxAttempts = 2;

    while (attempt < maxAttempts) {
      attempt++;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 18000);

        const res = await fetch('/api/ai/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: req.question,
            subject,
            chapter,
            mode,
            history: req.history,
            memoryContext: req.memoryContext,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`);
        }

        const data: AskAIResponse = await res.json();
        clientCache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      } catch (err: any) {
        console.warn(`AI request attempt ${attempt} failed:`, err?.message || err);
        if (attempt >= maxAttempts) {
          // Graceful local fallback to prevent any UI freezing
          return getInstantClientFallback(req);
        }
        // Small exponential delay before retry
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    return getInstantClientFallback(req);
  })();

  inFlightRequests.set(cacheKey, promise);

  try {
    return await promise;
  } finally {
    inFlightRequests.delete(cacheKey);
  }
}

/**
 * Instant client-side fallback if network is completely offline.
 */
function getInstantClientFallback(req: AskAIRequest): AskAIResponse {
  const subject = req.subject || 'Physics';
  const chapter = req.chapter || 'Electric Charges and Fields';

  return {
    reply: `### 📚 CBSE Class 12 ${subject} — Academic Guidance
**Chapter:** ${chapter}
**CBSE Status:** Offline Resilient Mode Active

---

#### 📌 Core Concept & NCERT Focus
In the CBSE Class 12 curriculum for **${chapter}**, concepts are tested both through theoretical derivations and quantitative applications. Ensure definitions adhere strictly to NCERT wording.

#### 📐 Key Formulas to Review
- Review standard SI units and dimensional formulae.
- State vector directions for field quantities.
- Check sign conventions explicitly before substituting numerical values.

#### 💡 CBSE Exam Tip
- Draw labeled diagrams wherever applicable (awards 1 mark in 3-mark & 5-mark questions).
- Always write the final numerical answer with appropriate SI units.

*(Note: Network connectivity is currently limited. Rankify offline mentor provided this structured review.)*`,
    fallback: true,
    subject,
    chapter,
    mode: req.mode,
  };
}

/**
 * Fetches dynamic study recommendations based on student's chapter progress.
 */
export async function getStudyRecommendations(chapters: any[]): Promise<AIRecommendationItem[]> {
  try {
    const res = await fetch('/api/ai/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapters }),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.recommendations) && data.recommendations.length > 0) {
        return data.recommendations;
      }
    }
  } catch (err) {
    console.warn('Failed to load remote recommendations, using local heuristic:', err);
  }

  // Local fallback recommendations
  return [
    {
      type: 'weak_chapter',
      title: 'High Priority Weak Chapter',
      chapter: 'Ray Optics',
      subject: 'Physics',
      action: 'Deep Doubt & Concept Session',
      reason: '10 marks weightage in CBSE Board exams with high frequency of derivation questions.',
    },
    {
      type: 'next_chapter',
      title: 'Recommended Next Chapter',
      chapter: 'Electrochemistry',
      subject: 'Chemistry',
      action: 'Start NCERT Reading & Notes',
      reason: '9 marks weightage; builds foundational concepts for chemical thermodynamics.',
    },
    {
      type: 'revision_chapter',
      title: 'Spaced Repetition Due',
      chapter: 'Integrals',
      subject: 'Mathematics',
      action: '10 High-Yield PYQs & Formulas',
      reason: 'Calculus carries 35 marks overall in CBSE Class 12 Mathematics.',
    },
    {
      type: 'formula_revision',
      title: 'Master Formula Sheet',
      chapter: 'Electric Charges and Fields',
      subject: 'Physics',
      action: 'Gauss Law & Coulomb Vector Form',
      reason: 'Guaranteed 3-mark derivation on flux or continuous charge distributions.',
    },
  ];
}

/**
 * Validates YouTube URL with the Lecture Analyzer endpoint.
 */
export async function analyzeLectureUrl(url: string): Promise<{
  valid: boolean;
  message: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/ai/lecture-analyzer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { valid: false, message: '', error: data.error || 'Invalid YouTube URL' };
    }
    return { valid: true, message: data.message };
  } catch (err) {
    return {
      valid: false,
      message: '',
      error: 'Network connection error. Please try again.',
    };
  }
}
