/**
 * Prompt Engine & Auto Detection Utility (Offline, 0-API)
 */

import {
  DetectedSubject,
  DetectedChapter,
  PromptCategory,
  PromptResult,
} from '../model/chat-models';

export function detectSubjectAndChapter(query: string): {
  subject: DetectedSubject;
  chapter: DetectedChapter;
  category: PromptCategory;
} {
  const q = query.toLowerCase().trim();

  // Category detection
  let category: PromptCategory = 'concept';
  if (q.includes('derive') || q.includes('derivation') || q.includes('proof')) {
    category = 'derivation';
  } else if (q.includes('numerical') || q.includes('solve') || q.includes('calculate')) {
    category = 'numerical';
  } else if (q.includes('mechanism') || q.includes('reaction') || q.includes('sn1') || q.includes('sn2')) {
    category = 'organic';
  } else if (q.includes('pyq') || q.includes('board question') || q.includes('past year')) {
    category = 'pyq';
  } else if (q.includes('revision') || q.includes('formula sheet') || q.includes('summary')) {
    category = 'revision';
  }

  // Physics Chapters
  if (
    q.includes('charge') ||
    q.includes('coulomb') ||
    q.includes('gauss') ||
    q.includes('electric field') ||
    q.includes('dipole')
  ) {
    return { subject: 'Physics', chapter: 'Electric Charges and Fields', category };
  }
  if (
    q.includes('capacit') ||
    q.includes('potential') ||
    q.includes('dielectric')
  ) {
    return { subject: 'Physics', chapter: 'Electrostatic Potential and Capacitance', category };
  }
  if (
    q.includes('current') ||
    q.includes('drift velocity') ||
    q.includes('ohm') ||
    q.includes('kirchhoff') ||
    q.includes('wheatstone') ||
    q.includes('potentiometer') ||
    q.includes('resistance')
  ) {
    return { subject: 'Physics', chapter: 'Current Electricity', category };
  }
  if (
    q.includes('biot savart') ||
    q.includes('ampere') ||
    q.includes('galvanometer') ||
    q.includes('lorentz') ||
    q.includes('moving charge')
  ) {
    return { subject: 'Physics', chapter: 'Moving Charges and Magnetism', category };
  }
  if (q.includes('magnet') || q.includes('hysteresis') || q.includes('paramagnetic')) {
    return { subject: 'Physics', chapter: 'Magnetism and Matter', category };
  }
  if (q.includes('induction') || q.includes('faraday') || q.includes('lenz') || q.includes('inductance')) {
    return { subject: 'Physics', chapter: 'Electromagnetic Induction', category };
  }
  if (q.includes('alternating current') || q.includes('ac circuit') || q.includes('lcr') || q.includes('transformer')) {
    return { subject: 'Physics', chapter: 'Alternating Current', category };
  }
  if (q.includes('em wave') || q.includes('displacement current') || q.includes('spectrum')) {
    return { subject: 'Physics', chapter: 'Electromagnetic Waves', category };
  }
  if (
    q.includes('lens maker') ||
    q.includes('prism') ||
    q.includes('refraction') ||
    q.includes('reflection') ||
    q.includes('telescope') ||
    q.includes('microscope') ||
    q.includes('optics')
  ) {
    return { subject: 'Physics', chapter: 'Ray Optics and Optical Instruments', category };
  }
  if (q.includes('wave optics') || q.includes('interference') || q.includes('diffraction') || q.includes('young') || q.includes('ydse')) {
    return { subject: 'Physics', chapter: 'Wave Optics', category };
  }
  if (q.includes('photoelectric') || q.includes('de broglie') || q.includes('work function') || q.includes('dual nature')) {
    return { subject: 'Physics', chapter: 'Dual Nature of Radiation and Matter', category };
  }
  if (q.includes('bohr') || q.includes('spectrum') || q.includes('atom')) {
    return { subject: 'Physics', chapter: 'Atoms', category };
  }
  if (q.includes('binding energy') || q.includes('fission') || q.includes('fusion') || q.includes('nuclei')) {
    return { subject: 'Physics', chapter: 'Nuclei', category };
  }
  if (q.includes('semiconductor') || q.includes('diode') || q.includes('rectifier') || q.includes('logic gate')) {
    return { subject: 'Physics', chapter: 'Semiconductor Electronics', category };
  }

  // Chemistry Chapters
  if (q.includes('solution') || q.includes('raoult') || q.includes('colligative') || q.includes('molarity') || q.includes('osmotic')) {
    return { subject: 'Chemistry', chapter: 'Solutions', category };
  }
  if (
    q.includes('electrochemistry') ||
    q.includes('nernst') ||
    q.includes('kohlrausch') ||
    q.includes('galvanic') ||
    q.includes('emf') ||
    q.includes('conductance')
  ) {
    return { subject: 'Chemistry', chapter: 'Electrochemistry', category };
  }
  if (q.includes('rate of reaction') || q.includes('kinetics') || q.includes('order of reaction') || q.includes('arrhenius') || q.includes('half life')) {
    return { subject: 'Chemistry', chapter: 'Chemical Kinetics', category };
  }
  if (q.includes('d block') || q.includes('f block') || q.includes('transition element') || q.includes('lanthanoid')) {
    return { subject: 'Chemistry', chapter: 'd- and f-Block Elements', category };
  }
  if (q.includes('coordination') || q.includes('ligand') || q.includes('werner') || q.includes('cft') || q.includes('isomerism')) {
    return { subject: 'Chemistry', chapter: 'Coordination Compounds', category };
  }
  if (q.includes('haloalkane') || q.includes('haloarene') || q.includes('sn1') || q.includes('sn2') || q.includes('grignard')) {
    return { subject: 'Chemistry', chapter: 'Haloalkanes and Haloarenes', category };
  }
  if (q.includes('alcohol') || q.includes('phenol') || q.includes('ether') || q.includes('reimer') || q.includes('kolbe')) {
    return { subject: 'Chemistry', chapter: 'Alcohols, Phenols and Ethers', category };
  }
  if (q.includes('aldehyde') || q.includes('ketone') || q.includes('carboxylic') || q.includes('aldol') || q.includes('cannizzaro')) {
    return { subject: 'Chemistry', chapter: 'Aldehydes, Ketones and Carboxylic Acids', category };
  }
  if (q.includes('amine') || q.includes('diazonium') || q.includes('hoffmann') || q.includes('carbylamine')) {
    return { subject: 'Chemistry', chapter: 'Amines', category };
  }
  if (q.includes('carbohydrate') || q.includes('protein') || q.includes('dna') || q.includes('biomolecules') || q.includes('glucose')) {
    return { subject: 'Chemistry', chapter: 'Biomolecules', category };
  }

  // Mathematics Chapters
  if (q.includes('relation') || q.includes('function') || q.includes('bijective') || q.includes('one-one')) {
    return { subject: 'Mathematics', chapter: 'Relations and Functions', category };
  }
  if (q.includes('inverse trig') || q.includes('sin^-1') || q.includes('cos^-1') || q.includes('tan^-1')) {
    return { subject: 'Mathematics', chapter: 'Inverse Trigonometric Functions', category };
  }
  if (q.includes('matrix') || q.includes('matrices') || q.includes('symmetric') || q.includes('transpose')) {
    return { subject: 'Mathematics', chapter: 'Matrices', category };
  }
  if (q.includes('determinant') || q.includes('adjoint') || q.includes('cramer')) {
    return { subject: 'Mathematics', chapter: 'Determinants', category };
  }
  if (q.includes('continuity') || q.includes('differentiab') || q.includes('derivative') || q.includes('chain rule')) {
    return { subject: 'Mathematics', chapter: 'Continuity and Differentiability', category };
  }
  if (q.includes('maxima') || q.includes('minima') || q.includes('rate of change') || q.includes('aod')) {
    return { subject: 'Mathematics', chapter: 'Application of Derivatives', category };
  }
  if (q.includes('integral') || q.includes('integrate') || q.includes('substitution') || q.includes('by parts')) {
    return { subject: 'Mathematics', chapter: 'Integrals', category };
  }
  if (q.includes('area under curve') || q.includes('bounded area')) {
    return { subject: 'Mathematics', chapter: 'Application of Integrals', category };
  }
  if (q.includes('differential equation') || q.includes('order and degree') || q.includes('integrating factor')) {
    return { subject: 'Mathematics', chapter: 'Differential Equations', category };
  }
  if (q.includes('vector') || q.includes('dot product') || q.includes('cross product')) {
    return { subject: 'Mathematics', chapter: 'Vector Algebra', category };
  }
  if (q.includes('3d') || q.includes('shortest distance') || q.includes('direction cosine')) {
    return { subject: 'Mathematics', chapter: 'Three Dimensional Geometry', category };
  }
  if (q.includes('linear programming') || q.includes('lpp') || q.includes('feasible region')) {
    return { subject: 'Mathematics', chapter: 'Linear Programming', category };
  }
  if (q.includes('probability') || q.includes('bayes') || q.includes('conditional probability')) {
    return { subject: 'Mathematics', chapter: 'Probability', category };
  }

  // Fallbacks
  if (q.includes('chemistry') || q.includes('reaction') || q.includes('acid') || q.includes('base')) {
    return { subject: 'Chemistry', chapter: 'Electrochemistry', category };
  }
  if (q.includes('math') || q.includes('solve') || q.includes('equation')) {
    return { subject: 'Mathematics', chapter: 'Integrals', category };
  }

  return { subject: 'Physics', chapter: 'Current Electricity', category };
}

export function generateStructuredStudyPrompt(
  questionText: string,
  subject: DetectedSubject,
  chapter: DetectedChapter
): PromptResult {
  const cleanQ = questionText.trim();
  const rawPrompt = `You are an expert CBSE Class 12 ${subject} teacher.

Explain ${cleanQ}.

Include:

NCERT explanation

Board pattern

Important formulas

Common mistakes

Memory tricks

Practice questions

Revision notes

Numericals

Simple language`;

  const { category } = detectSubjectAndChapter(cleanQ);

  return {
    rawPrompt,
    subject,
    chapter,
    category,
  };
}
