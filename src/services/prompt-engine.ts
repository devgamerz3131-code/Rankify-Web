/**
 * Rankify Offline Prompt Generation Engine for CBSE Class 12 PCM
 * Automatically detects Subject & Chapter and formulates the highest-yield
 * prompt optimized for ChatGPT and Google Gemini.
 * NO API REQUIRED — 100% Offline & Deterministic.
 */

export interface PromptAnalysis {
  subject: 'Physics' | 'Chemistry' | 'Mathematics';
  chapter: string;
  intent: 'derivation' | 'numerical' | 'mechanism' | 'conceptual' | 'pyq' | 'general';
  generatedPrompt: string;
}

// 37 Canonical CBSE Class 12 PCM Chapters
export const CBSE_12_CHAPTERS = {
  Physics: [
    'Electric Charges and Fields',
    'Electrostatic Potential and Capacitance',
    'Current Electricity',
    'Moving Charges and Magnetism',
    'Magnetism and Matter',
    'Electromagnetic Induction',
    'Alternating Current',
    'Electromagnetic Waves',
    'Ray Optics and Optical Instruments',
    'Wave Optics',
    'Dual Nature of Radiation and Matter',
    'Atoms',
    'Nuclei',
    'Semiconductor Electronics',
  ],
  Chemistry: [
    'Solutions',
    'Electrochemistry',
    'Chemical Kinetics',
    'd- and f-Block Elements',
    'Coordination Compounds',
    'Haloalkanes and Haloarenes',
    'Alcohols, Phenols and Ethers',
    'Aldehydes, Ketones and Carboxylic Acids',
    'Amines',
    'Biomolecules',
  ],
  Mathematics: [
    'Relations and Functions',
    'Inverse Trigonometric Functions',
    'Matrices',
    'Determinants',
    'Continuity and Differentiability',
    'Application of Derivatives',
    'Integrals',
    'Application of Integrals',
    'Differential Equations',
    'Vector Algebra',
    'Three Dimensional Geometry',
    'Linear Programming',
    'Probability',
  ],
};

/**
 * Automatically detects CBSE Class 12 Subject and Chapter from natural language doubt.
 */
export function detectSubjectAndChapter(query: string): {
  subject: 'Physics' | 'Chemistry' | 'Mathematics';
  chapter: string;
  intent: PromptAnalysis['intent'];
} {
  const q = query.toLowerCase();

  // 1. Detect Intent
  let intent: PromptAnalysis['intent'] = 'conceptual';
  if (
    q.includes('derive') ||
    q.includes('derivation') ||
    q.includes('proof') ||
    q.includes('prove that') ||
    q.includes('expression for')
  ) {
    intent = 'derivation';
  } else if (
    q.includes('calculate') ||
    q.includes('numerical') ||
    q.includes('find value') ||
    q.includes('compute') ||
    q.includes('emf') ||
    q.includes('integral') ||
    q.includes('integrate') ||
    q.includes('derivative') ||
    q.includes('differentiate')
  ) {
    intent = 'numerical';
  } else if (
    q.includes('mechanism') ||
    q.includes('reaction') ||
    q.includes('sn1') ||
    q.includes('sn2') ||
    q.includes('aldol') ||
    q.includes('cannizzaro') ||
    q.includes('conversion') ||
    q.includes('reagent')
  ) {
    intent = 'mechanism';
  } else if (
    q.includes('pyq') ||
    q.includes('previous year') ||
    q.includes('board question') ||
    q.includes('marks question')
  ) {
    intent = 'pyq';
  }

  // 2. Detect Physics Chapters
  if (
    q.includes('coulomb') ||
    q.includes('electric charge') ||
    q.includes('gauss') ||
    q.includes('electric flux') ||
    q.includes('dipole')
  ) {
    return { subject: 'Physics', chapter: 'Electric Charges and Fields', intent };
  }
  if (
    q.includes('capacit') ||
    q.includes('equipotential') ||
    q.includes('dielectric') ||
    q.includes('potential energy')
  ) {
    return { subject: 'Physics', chapter: 'Electrostatic Potential and Capacitance', intent };
  }
  if (
    q.includes('current') ||
    q.includes('ohm') ||
    q.includes('drift velocity') ||
    q.includes('kirchhoff') ||
    q.includes('wheatstone') ||
    q.includes('potentiometer') ||
    q.includes('resistivity')
  ) {
    return { subject: 'Physics', chapter: 'Current Electricity', intent };
  }
  if (
    q.includes('biot savart') ||
    q.includes('ampere circuital') ||
    q.includes('lorentz') ||
    q.includes('galvanometer') ||
    q.includes('cyclotron') ||
    q.includes('solenoid') ||
    q.includes('toroid')
  ) {
    return { subject: 'Physics', chapter: 'Moving Charges and Magnetism', intent };
  }
  if (
    q.includes('magnetic field') ||
    q.includes('earth magnetism') ||
    q.includes('paramagnetic') ||
    q.includes('ferromagnetic') ||
    q.includes('hysteresis')
  ) {
    return { subject: 'Physics', chapter: 'Magnetism and Matter', intent };
  }
  if (
    q.includes('faraday') ||
    q.includes('lenz') ||
    q.includes('eddy current') ||
    q.includes('self induct') ||
    q.includes('mutual induct') ||
    q.includes('emi')
  ) {
    return { subject: 'Physics', chapter: 'Electromagnetic Induction', intent };
  }
  if (
    q.includes('alternating current') ||
    q.includes('ac circuit') ||
    q.includes('lcr') ||
    q.includes('resonance') ||
    q.includes('transformer') ||
    q.includes('power factor') ||
    q.includes('rms')
  ) {
    return { subject: 'Physics', chapter: 'Alternating Current', intent };
  }
  if (
    q.includes('em wave') ||
    q.includes('displacement current') ||
    q.includes('electromagnetic wave') ||
    q.includes('spectrum')
  ) {
    return { subject: 'Physics', chapter: 'Electromagnetic Waves', intent };
  }
  if (
    q.includes('lens maker') ||
    q.includes('ray optics') ||
    q.includes('prism') ||
    q.includes('telescope') ||
    q.includes('microscope') ||
    q.includes('refraction') ||
    q.includes('total internal reflection') ||
    q.includes('mirror formula')
  ) {
    return { subject: 'Physics', chapter: 'Ray Optics and Optical Instruments', intent };
  }
  if (
    q.includes('wave optics') ||
    q.includes('huygens') ||
    q.includes('interference') ||
    q.includes('diffraction') ||
    q.includes('young double slit') ||
    q.includes('ydse') ||
    q.includes('fringe width')
  ) {
    return { subject: 'Physics', chapter: 'Wave Optics', intent };
  }
  if (
    q.includes('photoelectric') ||
    q.includes('de broglie') ||
    q.includes('work function') ||
    q.includes('dual nature') ||
    q.includes('einstein photoelectric')
  ) {
    return { subject: 'Physics', chapter: 'Dual Nature of Radiation and Matter', intent };
  }
  if (
    q.includes('bohr model') ||
    q.includes('rutherford') ||
    q.includes('hydrogen spectrum') ||
    q.includes('lyman') ||
    q.includes('balmer') ||
    q.includes('atoms')
  ) {
    return { subject: 'Physics', chapter: 'Atoms', intent };
  }
  if (
    q.includes('mass defect') ||
    q.includes('binding energy') ||
    q.includes('nuclear fission') ||
    q.includes('fusion') ||
    q.includes('nuclei') ||
    q.includes('radioactivity')
  ) {
    return { subject: 'Physics', chapter: 'Nuclei', intent };
  }
  if (
    q.includes('semiconductor') ||
    q.includes('p-n junction') ||
    q.includes('diode') ||
    q.includes('rectifier') ||
    q.includes('logic gate') ||
    q.includes('intrinsic') ||
    q.includes('extrinsic')
  ) {
    return { subject: 'Physics', chapter: 'Semiconductor Electronics', intent };
  }

  // 3. Detect Chemistry Chapters
  if (
    q.includes('raoult') ||
    q.includes('colligative') ||
    q.includes('osmotic pressure') ||
    q.includes('van t hoff') ||
    q.includes('molarity') ||
    q.includes('molality') ||
    q.includes('solution')
  ) {
    return { subject: 'Chemistry', chapter: 'Solutions', intent };
  }
  if (
    q.includes('nernst') ||
    q.includes('kohlrausch') ||
    q.includes('faraday law') ||
    q.includes('galvanic') ||
    q.includes('electrochemistry') ||
    q.includes('electrolysis') ||
    q.includes('conductance')
  ) {
    return { subject: 'Chemistry', chapter: 'Electrochemistry', intent };
  }
  if (
    q.includes('rate of reaction') ||
    q.includes('order of reaction') ||
    q.includes('arrhenius') ||
    q.includes('activation energy') ||
    q.includes('half life') ||
    q.includes('chemical kinetics')
  ) {
    return { subject: 'Chemistry', chapter: 'Chemical Kinetics', intent };
  }
  if (
    q.includes('lanthanoid') ||
    q.includes('actinoid') ||
    q.includes('transition element') ||
    q.includes('d block') ||
    q.includes('f block') ||
    q.includes('kmno4') ||
    q.includes('k2cr2o7')
  ) {
    return { subject: 'Chemistry', chapter: 'd- and f-Block Elements', intent };
  }
  if (
    q.includes('werner') ||
    q.includes('coordination') ||
    q.includes('ligand') ||
    q.includes('crystal field') ||
    q.includes('cft') ||
    q.includes('iupac naming') ||
    q.includes('isomerism')
  ) {
    return { subject: 'Chemistry', chapter: 'Coordination Compounds', intent };
  }
  if (
    q.includes('haloalkane') ||
    q.includes('haloarene') ||
    q.includes('sn1') ||
    q.includes('sn2') ||
    q.includes('elimination') ||
    q.includes('grignard') ||
    q.includes('sandmeyer') ||
    q.includes('wurtz')
  ) {
    return { subject: 'Chemistry', chapter: 'Haloalkanes and Haloarenes', intent: 'mechanism' };
  }
  if (
    q.includes('alcohol') ||
    q.includes('phenol') ||
    q.includes('ether') ||
    q.includes('lucas') ||
    q.includes('reimer tiemann') ||
    q.includes('kolbe') ||
    q.includes('williamson')
  ) {
    return { subject: 'Chemistry', chapter: 'Alcohols, Phenols and Ethers', intent: 'mechanism' };
  }
  if (
    q.includes('aldehyde') ||
    q.includes('ketone') ||
    q.includes('carboxylic') ||
    q.includes('aldol') ||
    q.includes('cannizzaro') ||
    q.includes('clemmensen') ||
    q.includes('rosenmund') ||
    q.includes('fehling') ||
    q.includes('tollens')
  ) {
    return { subject: 'Chemistry', chapter: 'Aldehydes, Ketones and Carboxylic Acids', intent: 'mechanism' };
  }
  if (
    q.includes('amine') ||
    q.includes('diazonium') ||
    q.includes('hoffmann bromamide') ||
    q.includes('carbylamine') ||
    q.includes('gabriel phthalimide')
  ) {
    return { subject: 'Chemistry', chapter: 'Amines', intent: 'mechanism' };
  }
  if (
    q.includes('carbohydrate') ||
    q.includes('protein') ||
    q.includes('dna') ||
    q.includes('rna') ||
    q.includes('peptide') ||
    q.includes('glucose') ||
    q.includes('biomolecules')
  ) {
    return { subject: 'Chemistry', chapter: 'Biomolecules', intent };
  }

  // 4. Detect Mathematics Chapters
  if (
    q.includes('equivalence relation') ||
    q.includes('one-one') ||
    q.includes('onto') ||
    q.includes('bijective') ||
    q.includes('relations and functions')
  ) {
    return { subject: 'Mathematics', chapter: 'Relations and Functions', intent };
  }
  if (
    q.includes('inverse trig') ||
    q.includes('sin^-1') ||
    q.includes('cos^-1') ||
    q.includes('tan^-1') ||
    q.includes('principal value')
  ) {
    return { subject: 'Mathematics', chapter: 'Inverse Trigonometric Functions', intent };
  }
  if (
    q.includes('matrix') ||
    q.includes('matrices') ||
    q.includes('symmetric matrix') ||
    q.includes('skew symmetric') ||
    q.includes('transpose')
  ) {
    return { subject: 'Mathematics', chapter: 'Matrices', intent };
  }
  if (
    q.includes('determinant') ||
    q.includes('cramer') ||
    q.includes('adjoint') ||
    q.includes('inverse of matrix') ||
    q.includes('singular matrix')
  ) {
    return { subject: 'Mathematics', chapter: 'Determinants', intent };
  }
  if (
    q.includes('continuity') ||
    q.includes('differentiab') ||
    q.includes('chain rule') ||
    q.includes('logarithmic differentiation') ||
    q.includes('parametric') ||
    q.includes('second order derivative')
  ) {
    return { subject: 'Mathematics', chapter: 'Continuity and Differentiability', intent: 'numerical' };
  }
  if (
    q.includes('maxima') ||
    q.includes('minima') ||
    q.includes('rate of change') ||
    q.includes('increasing decreasing') ||
    q.includes('application of derivatives') ||
    q.includes('aod')
  ) {
    return { subject: 'Mathematics', chapter: 'Application of Derivatives', intent: 'numerical' };
  }
  if (
    q.includes('integral') ||
    q.includes('integrate') ||
    q.includes('substitution') ||
    q.includes('by parts') ||
    q.includes('partial fraction') ||
    q.includes('definite integral')
  ) {
    return { subject: 'Mathematics', chapter: 'Integrals', intent: 'numerical' };
  }
  if (
    q.includes('area under curve') ||
    q.includes('bounded by') ||
    q.includes('application of integrals')
  ) {
    return { subject: 'Mathematics', chapter: 'Application of Integrals', intent: 'numerical' };
  }
  if (
    q.includes('differential equation') ||
    q.includes('order and degree') ||
    q.includes('integrating factor') ||
    q.includes('variable separable') ||
    q.includes('homogeneous differential')
  ) {
    return { subject: 'Mathematics', chapter: 'Differential Equations', intent: 'numerical' };
  }
  if (
    q.includes('vector') ||
    q.includes('dot product') ||
    q.includes('cross product') ||
    q.includes('unit vector') ||
    q.includes('direction cosine')
  ) {
    return { subject: 'Mathematics', chapter: 'Vector Algebra', intent };
  }
  if (
    q.includes('3d') ||
    q.includes('three dimensional') ||
    q.includes('shortest distance') ||
    q.includes('equation of line') ||
    q.includes('skew lines')
  ) {
    return { subject: 'Mathematics', chapter: 'Three Dimensional Geometry', intent };
  }
  if (
    q.includes('linear programming') ||
    q.includes('lpp') ||
    q.includes('feasible region') ||
    q.includes('corner point') ||
    q.includes('objective function')
  ) {
    return { subject: 'Mathematics', chapter: 'Linear Programming', intent };
  }
  if (
    q.includes('probability') ||
    q.includes('bayes') ||
    q.includes('conditional probability') ||
    q.includes('independent events') ||
    q.includes('random variable')
  ) {
    return { subject: 'Mathematics', chapter: 'Probability', intent };
  }

  // Fallback heuristic: check general words
  if (q.includes('chemistry') || q.includes('reaction') || q.includes('acid') || q.includes('bond')) {
    return { subject: 'Chemistry', chapter: 'Chemical Kinetics', intent };
  }
  if (q.includes('math') || q.includes('solve') || q.includes('equation') || q.includes('graph')) {
    return { subject: 'Mathematics', chapter: 'Integrals', intent: 'numerical' };
  }

  return { subject: 'Physics', chapter: 'Electric Charges and Fields', intent };
}

/**
 * Builds the comprehensive CBSE Class 12 study prompt ready for ChatGPT / Gemini.
 */
export function generateStudyPrompt(
  studentQuery: string,
  overrideSubject?: 'Physics' | 'Chemistry' | 'Mathematics',
  overrideChapter?: string
): PromptAnalysis {
  const detected = detectSubjectAndChapter(studentQuery);
  const subject = overrideSubject || detected.subject;
  const chapter = overrideChapter || detected.chapter;
  const intent = detected.intent;

  // Build subject-tailored prompt sections
  let subjectInstructions = '';
  if (subject === 'Physics') {
    subjectInstructions = `• Conceptual clarity with physical significance
• Complete Derivations (state assumptions, draw/describe ray/circuit diagrams, Cartesian sign conventions, and write EVERY algebraic step without skipping)
• Formula derivation & SI units ($kg, m, s, A, V, T, N, J$)
• Numerical solving framework: Given data, Formula, Step-by-step substitution, Final boxed value with units
• Real-life board exam applications`;
  } else if (subject === 'Chemistry') {
    subjectInstructions = `• Balanced chemical equations with states and reaction conditions (temperature, catalysts, pressure)
• Complete Organic Reaction Mechanisms (nucleophilic/electrophilic steps, carbocation stability, Markovnikov/anti-Markovnikov rules, stereochemical inversion)
• Reagents and conversions tricks
• NCERT exceptions and anomalous trends
• Physical Chemistry numericals: Nernst equation, rate laws, or colligative properties with log calculations`;
  } else {
    subjectInstructions = `• Step-by-step mathematical proof or solution (NEVER skip algebraic calculations or intermediate steps)
• Show every transformation, substitution, and trigonometric identity applied
• Specific Calculus / Algebra rules: Integration by parts, partial fractions, properties of definite integrals, inverse matrix formula
• Standard CBSE board notation and boxed final answers`;
  }

  const prompt = `You are an expert CBSE Class 12 ${subject} senior board teacher and paper evaluator.

Please explain the following doubt in clear, simple language strictly calibrated to the official CBSE Class 12 NCERT curriculum for Chapter: "${chapter}".

STUDENT DOUBT:
"${studentQuery.trim()}"

Please structure your response with extreme pedagogical clarity to help a student score 95%+ marks:

1. 📌 Simple & Intuitive Explanation
Explain the core concept in friendly, simple everyday language first so it is easy to visualize.

2. 🔍 Detailed Step-by-Step Explanation
Provide a rigorous, NCERT-compliant explanation using official board terminology.

3. 📐 Important Formulas, SI Units & Notation
List all relevant formulas, definitions of each variable, and standard SI units.

4. ✍️ ${intent === 'derivation' ? 'Step-by-Step Derivation' : intent === 'numerical' ? 'Step-by-Step Numerical Calculations' : intent === 'mechanism' ? 'Complete Reaction Mechanism & Flow' : 'Core Theoretical Formulation'}
${subjectInstructions}

5. 📖 NCERT Textbook Focus & Section Reference
Reference the exact NCERT Class 12 section and highlight solved examples or exercises from the textbook.

6. 💡 CBSE Board Exam Tips & Step-Marking Scheme
Explain how marks are distributed in CBSE answer sheets (e.g. 0.5 mark for formula, 1 mark for substitution) and what examiners look for.

7. ⚠️ Common Mistakes & Exam Traps
Highlight the typical errors students make in this chapter (e.g. sign conventions, unit mismatches, forgetting $+C$, racemization mistakes).

8. 🏆 Previous Years' Questions (PYQ) Guidance
Explain how CBSE has framed questions from this specific topic in previous 10 years of board exams (1-mark, 3-mark, or 5-mark HOTS).

9. ❓ 1 High-Yield Practice Question
Give 1 board-level question with a step-by-step hint and final answer for the student to practice.

10. 📝 2-Minute Revision Summary & Memory Tricks
Provide a concise bullet-point summary, acronyms, or mnemonics to memorize the key takeaway in 2 minutes.

Please explain step-by-step with zero skipped calculations!`;

  return {
    subject,
    chapter,
    intent,
    generatedPrompt: prompt,
  };
}
