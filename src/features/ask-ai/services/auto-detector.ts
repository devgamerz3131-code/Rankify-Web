/**
 * Auto Detection Service for CBSE Class 12 PCM
 * Automatically detects Subject and Chapter, and builds structured study prompts.
 * 100% Offline & Local.
 */

import { SubjectType } from '../models/ai-tutor';

export interface DetectionResult {
  subject: SubjectType;
  chapter: string;
  generatedPrompt: string;
}

export function detectSubjectAndChapter(query: string): {
  subject: SubjectType;
  chapter: string;
} {
  const q = query.toLowerCase();

  // Physics Chapters
  if (
    q.includes('charge') ||
    q.includes('coulomb') ||
    q.includes('gauss') ||
    q.includes('electric field') ||
    q.includes('dipole')
  ) {
    return { subject: 'Physics', chapter: 'Electric Charges and Fields' };
  }
  if (
    q.includes('capacit') ||
    q.includes('equipotential') ||
    q.includes('potential') ||
    q.includes('dielectric')
  ) {
    return { subject: 'Physics', chapter: 'Electrostatic Potential and Capacitance' };
  }
  if (
    q.includes('current') ||
    q.includes('drift velocity') ||
    q.includes('ohm') ||
    q.includes('kirchhoff') ||
    q.includes('wheatstone') ||
    q.includes('potentiometer') ||
    q.includes('resistance') ||
    q.includes('resistivity')
  ) {
    return { subject: 'Physics', chapter: 'Current Electricity' };
  }
  if (
    q.includes('biot savart') ||
    q.includes('ampere') ||
    q.includes('galvanometer') ||
    q.includes('lorentz') ||
    q.includes('magnetic force')
  ) {
    return { subject: 'Physics', chapter: 'Moving Charges and Magnetism' };
  }
  if (q.includes('magnet') || q.includes('hysteresis') || q.includes('paramagnetic')) {
    return { subject: 'Physics', chapter: 'Magnetism and Matter' };
  }
  if (q.includes('induction') || q.includes('faraday') || q.includes('lenz') || q.includes('inductance')) {
    return { subject: 'Physics', chapter: 'Electromagnetic Induction' };
  }
  if (q.includes('alternating current') || q.includes('ac circuit') || q.includes('lcr') || q.includes('transformer')) {
    return { subject: 'Physics', chapter: 'Alternating Current' };
  }
  if (q.includes('em wave') || q.includes('displacement current') || q.includes('spectrum')) {
    return { subject: 'Physics', chapter: 'Electromagnetic Waves' };
  }
  if (
    q.includes('lens maker') ||
    q.includes('prism') ||
    q.includes('refraction') ||
    q.includes('reflection') ||
    q.includes('telescope') ||
    q.includes('microscope') ||
    q.includes('ray optics')
  ) {
    return { subject: 'Physics', chapter: 'Ray Optics and Optical Instruments' };
  }
  if (q.includes('wave optics') || q.includes('interference') || q.includes('diffraction') || q.includes('young') || q.includes('ydse')) {
    return { subject: 'Physics', chapter: 'Wave Optics' };
  }
  if (q.includes('photoelectric') || q.includes('de broglie') || q.includes('work function') || q.includes('dual nature')) {
    return { subject: 'Physics', chapter: 'Dual Nature of Radiation and Matter' };
  }
  if (q.includes('bohr') || q.includes('hydrogen spectrum') || q.includes('atom')) {
    return { subject: 'Physics', chapter: 'Atoms' };
  }
  if (q.includes('mass defect') || q.includes('binding energy') || q.includes('fission') || q.includes('fusion') || q.includes('nuclei')) {
    return { subject: 'Physics', chapter: 'Nuclei' };
  }
  if (q.includes('semiconductor') || q.includes('diode') || q.includes('rectifier') || q.includes('logic gate') || q.includes('p-n junction')) {
    return { subject: 'Physics', chapter: 'Semiconductor Electronics' };
  }

  // Chemistry Chapters
  if (q.includes('solution') || q.includes('raoult') || q.includes('colligative') || q.includes('molarity') || q.includes('osmotic')) {
    return { subject: 'Chemistry', chapter: 'Solutions' };
  }
  if (q.includes('nernst') || q.includes('kohlrausch') || q.includes('galvanic') || q.includes('electrochemistry') || q.includes('emf')) {
    return { subject: 'Chemistry', chapter: 'Electrochemistry' };
  }
  if (q.includes('rate of reaction') || q.includes('order of reaction') || q.includes('arrhenius') || q.includes('kinetics') || q.includes('half life')) {
    return { subject: 'Chemistry', chapter: 'Chemical Kinetics' };
  }
  if (q.includes('d block') || q.includes('f block') || q.includes('transition element') || q.includes('lanthanoid')) {
    return { subject: 'Chemistry', chapter: 'd- and f-Block Elements' };
  }
  if (q.includes('coordination') || q.includes('ligand') || q.includes('werner') || q.includes('cft') || q.includes('isomerism')) {
    return { subject: 'Chemistry', chapter: 'Coordination Compounds' };
  }
  if (q.includes('sn1') || q.includes('sn2') || q.includes('haloalkane') || q.includes('haloarene') || q.includes('grignard')) {
    return { subject: 'Chemistry', chapter: 'Haloalkanes and Haloarenes' };
  }
  if (q.includes('alcohol') || q.includes('phenol') || q.includes('ether') || q.includes('reimer') || q.includes('kolbe')) {
    return { subject: 'Chemistry', chapter: 'Alcohols, Phenols and Ethers' };
  }
  if (q.includes('aldehyde') || q.includes('ketone') || q.includes('carboxylic') || q.includes('aldol') || q.includes('cannizzaro')) {
    return { subject: 'Chemistry', chapter: 'Aldehydes, Ketones and Carboxylic Acids' };
  }
  if (q.includes('amine') || q.includes('diazonium') || q.includes('hoffmann') || q.includes('carbylamine')) {
    return { subject: 'Chemistry', chapter: 'Amines' };
  }
  if (q.includes('carbohydrate') || q.includes('protein') || q.includes('dna') || q.includes('biomolecules') || q.includes('glucose')) {
    return { subject: 'Chemistry', chapter: 'Biomolecules' };
  }

  // Mathematics Chapters
  if (q.includes('relation') || q.includes('function') || q.includes('bijective') || q.includes('one-one')) {
    return { subject: 'Mathematics', chapter: 'Relations and Functions' };
  }
  if (q.includes('inverse trig') || q.includes('sin^-1') || q.includes('cos^-1') || q.includes('tan^-1')) {
    return { subject: 'Mathematics', chapter: 'Inverse Trigonometric Functions' };
  }
  if (q.includes('matrix') || q.includes('matrices') || q.includes('symmetric') || q.includes('transpose')) {
    return { subject: 'Mathematics', chapter: 'Matrices' };
  }
  if (q.includes('determinant') || q.includes('adjoint') || q.includes('cramer')) {
    return { subject: 'Mathematics', chapter: 'Determinants' };
  }
  if (q.includes('continuity') || q.includes('differentiab') || q.includes('derivative') || q.includes('chain rule')) {
    return { subject: 'Mathematics', chapter: 'Continuity and Differentiability' };
  }
  if (q.includes('maxima') || q.includes('minima') || q.includes('rate of change') || q.includes('aod')) {
    return { subject: 'Mathematics', chapter: 'Application of Derivatives' };
  }
  if (q.includes('integral') || q.includes('integrate') || q.includes('substitution') || q.includes('by parts')) {
    return { subject: 'Mathematics', chapter: 'Integrals' };
  }
  if (q.includes('area under curve') || q.includes('bounded area')) {
    return { subject: 'Mathematics', chapter: 'Application of Integrals' };
  }
  if (q.includes('differential equation') || q.includes('order and degree') || q.includes('integrating factor')) {
    return { subject: 'Mathematics', chapter: 'Differential Equations' };
  }
  if (q.includes('vector') || q.includes('dot product') || q.includes('cross product')) {
    return { subject: 'Mathematics', chapter: 'Vector Algebra' };
  }
  if (q.includes('3d') || q.includes('shortest distance') || q.includes('direction cosine')) {
    return { subject: 'Mathematics', chapter: 'Three Dimensional Geometry' };
  }
  if (q.includes('linear programming') || q.includes('lpp') || q.includes('feasible region')) {
    return { subject: 'Mathematics', chapter: 'Linear Programming' };
  }
  if (q.includes('probability') || q.includes('bayes') || q.includes('conditional probability')) {
    return { subject: 'Mathematics', chapter: 'Probability' };
  }

  // Fallbacks
  if (q.includes('chemistry') || q.includes('reaction') || q.includes('compound')) {
    return { subject: 'Chemistry', chapter: 'Solutions' };
  }
  if (q.includes('math') || q.includes('solve') || q.includes('equation')) {
    return { subject: 'Mathematics', chapter: 'Integrals' };
  }

  return { subject: 'Physics', chapter: 'Current Electricity' };
}

export function generateStructuredStudyPrompt(
  questionText: string,
  subject: SubjectType,
  chapter: string
): string {
  const cleanQ = questionText.trim();

  return `You are an expert CBSE Class 12 ${subject} teacher.

Explain ${cleanQ}.

Include:
• NCERT explanation
• Important formulas
• Board tips
• Numericals
• Memory tricks
• PYQs
• Common mistakes
• Practice question

Step-by-step explanation.`;
}
