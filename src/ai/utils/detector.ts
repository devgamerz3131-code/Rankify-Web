import { DetectedSubject, DetectedChapter } from '../model/types';

interface ChapterMetadata {
  name: string;
  subject: DetectedSubject;
  keywords: string[];
}

const CHAPTER_CATALOG: ChapterMetadata[] = [
  // Chemistry
  {
    name: 'Electrochemistry',
    subject: 'Chemistry',
    keywords: [
      'electrochemistry',
      'nernst',
      'galvanic',
      'electrolysis',
      'conductance',
      'kohlrausch',
      'cell potential',
      'emf',
      'faraday',
      'electrode',
      'batteries',
      'fuel cell',
      'anode',
      'cathode',
    ],
  },
  {
    name: 'Solutions',
    subject: 'Chemistry',
    keywords: [
      'solutions',
      'raoult',
      'colligative',
      'molarity',
      'molality',
      'osmotic pressure',
      'henry',
      'van\'t hoff',
      'ideal solution',
      'non-ideal',
      'azeotropes',
      'depression in freezing point',
      'elevation in boiling point',
    ],
  },
  {
    name: 'Chemical Kinetics',
    subject: 'Chemistry',
    keywords: [
      'chemical kinetics',
      'rate of reaction',
      'order of reaction',
      'molecularity',
      'arrhenius',
      'activation energy',
      'half life',
      'rate constant',
      'pseudo first order',
      'collision theory',
    ],
  },
  {
    name: 'd and f-Block Elements',
    subject: 'Chemistry',
    keywords: [
      'd and f block',
      'transition elements',
      'lanthanoids',
      'actinoids',
      'lanthanoid contraction',
      'permanganate',
      'dichromate',
      'oxidation states',
    ],
  },
  {
    name: 'Coordination Compounds',
    subject: 'Chemistry',
    keywords: [
      'coordination',
      'ligand',
      'werner',
      'iupac naming of complexes',
      'crystal field',
      'cft',
      'isomerism in complexes',
      'chelate',
      'spectrochemical',
    ],
  },
  {
    name: 'Haloalkanes and Haloarenes',
    subject: 'Chemistry',
    keywords: [
      'haloalkanes',
      'haloarenes',
      'sn1',
      'sn2',
      'nucleophilic substitution',
      'grignard',
      'sandmeyer',
      'elimination reaction',
      'enantiomers',
      'chiral',
    ],
  },
  {
    name: 'Alcohols, Phenols and Ethers',
    subject: 'Chemistry',
    keywords: [
      'alcohols',
      'phenols',
      'ethers',
      'kolbe',
      'reimer tiemann',
      'williamson',
      'lucas test',
      'acidic nature of phenol',
      'hydroboration',
    ],
  },
  {
    name: 'Aldehydes, Ketones and Carboxylic Acids',
    subject: 'Chemistry',
    keywords: [
      'aldehydes',
      'ketones',
      'carboxylic acids',
      'aldol',
      'cannizzaro',
      'clemmensen',
      'wolff kishner',
      'tollens',
      'fehling',
      'hell volhard zelinsky',
    ],
  },
  {
    name: 'Amines',
    subject: 'Chemistry',
    keywords: [
      'amines',
      'gabriel phthalimide',
      'carbylamine',
      'hoffmann bromamide',
      'diazotization',
      'hinsberg test',
      'diazonium',
    ],
  },
  {
    name: 'Biomolecules',
    subject: 'Chemistry',
    keywords: [
      'biomolecules',
      'carbohydrates',
      'glucose',
      'fructose',
      'proteins',
      'amino acids',
      'peptide bond',
      'denaturation',
      'dna',
      'rna',
      'nucleic acids',
      'vitamins',
    ],
  },

  // Physics
  {
    name: 'Electric Charges and Fields',
    subject: 'Physics',
    keywords: [
      'electric charges',
      'coulomb',
      'gauss\'s law',
      'gauss law',
      'electric field',
      'electric flux',
      'dipole',
      'charge distribution',
      'permittivity',
    ],
  },
  {
    name: 'Electrostatic Potential and Capacitance',
    subject: 'Physics',
    keywords: [
      'electrostatic potential',
      'capacitance',
      'capacitors',
      'dielectric',
      'equipotential',
      'energy stored in capacitor',
      'parallel plate',
    ],
  },
  {
    name: 'Current Electricity',
    subject: 'Physics',
    keywords: [
      'current electricity',
      'ohm\'s law',
      'kirchhoff',
      'potentiometer',
      'wheatstone',
      'drift velocity',
      'resistivity',
      'internal resistance',
      'meter bridge',
    ],
  },
  {
    name: 'Moving Charges and Magnetism',
    subject: 'Physics',
    keywords: [
      'moving charges',
      'biot savart',
      'ampere circuital',
      'lorentz force',
      'cyclotron',
      'solenoid',
      'toroid',
      'galvanometer',
      'magnetic field',
    ],
  },
  {
    name: 'Magnetism and Matter',
    subject: 'Physics',
    keywords: [
      'magnetism and matter',
      'magnetic dipole',
      'earth magnetism',
      'magnetic susceptibility',
      'hysteresis',
      'ferromagnetic',
      'paramagnetic',
      'diamagnetic',
    ],
  },
  {
    name: 'Electromagnetic Induction',
    subject: 'Physics',
    keywords: [
      'electromagnetic induction',
      'emi',
      'faraday',
      'lenz\'s law',
      'self inductance',
      'mutual inductance',
      'eddy current',
      'motional emf',
    ],
  },
  {
    name: 'Alternating Current',
    subject: 'Physics',
    keywords: [
      'alternating current',
      'ac generator',
      'lcr circuit',
      'resonance in ac',
      'impedance',
      'transformer',
      'power factor',
      'wattless current',
      'phasor',
    ],
  },
  {
    name: 'Electromagnetic Waves',
    subject: 'Physics',
    keywords: [
      'electromagnetic waves',
      'em waves',
      'displacement current',
      'maxwell equations',
      'em spectrum',
      'wavelength frequency',
    ],
  },
  {
    name: 'Ray Optics and Optical Instruments',
    subject: 'Physics',
    keywords: [
      'ray optics',
      'lens maker',
      'refraction',
      'total internal reflection',
      'tir',
      'prism',
      'microscope',
      'telescope',
      'compound microscope',
      'astronomical telescope',
      'mirror formula',
    ],
  },
  {
    name: 'Wave Optics',
    subject: 'Physics',
    keywords: [
      'wave optics',
      'huygens',
      'young\'s double slit',
      'ydse',
      'interference of light',
      'diffraction',
      'fringe width',
      'coherent sources',
    ],
  },
  {
    name: 'Dual Nature of Radiation and Matter',
    subject: 'Physics',
    keywords: [
      'dual nature',
      'photoelectric effect',
      'einstein equation',
      'work function',
      'threshold frequency',
      'de broglie',
      'matter waves',
    ],
  },
  {
    name: 'Atoms',
    subject: 'Physics',
    keywords: [
      'atoms',
      'bohr model',
      'rutherford',
      'hydrogen spectrum',
      'lyman',
      'balmer',
      'rydberg',
    ],
  },
  {
    name: 'Nuclei',
    subject: 'Physics',
    keywords: [
      'nuclei',
      'mass defect',
      'binding energy',
      'nuclear fission',
      'nuclear fusion',
      'nuclear density',
    ],
  },
  {
    name: 'Semiconductor Electronics',
    subject: 'Physics',
    keywords: [
      'semiconductor',
      'p-n junction',
      'pn junction',
      'diode',
      'rectifier',
      'full wave rectifier',
      'half wave rectifier',
      'forward bias',
      'reverse bias',
      'energy bands',
    ],
  },

  // Maths
  {
    name: 'Relations and Functions',
    subject: 'Maths',
    keywords: [
      'relations and functions',
      'equivalence relation',
      'reflexive',
      'symmetric',
      'transitive',
      'one-one',
      'onto',
      'bijective',
    ],
  },
  {
    name: 'Inverse Trigonometric Functions',
    subject: 'Maths',
    keywords: [
      'inverse trigonometric',
      'itf',
      'principal value',
      'sin inverse',
      'cos inverse',
      'tan inverse',
    ],
  },
  {
    name: 'Matrices',
    subject: 'Maths',
    keywords: [
      'matrices',
      'matrix multiplication',
      'transpose',
      'symmetric matrix',
      'skew-symmetric',
      'elementary transformation',
    ],
  },
  {
    name: 'Determinants',
    subject: 'Maths',
    keywords: [
      'determinants',
      'minors',
      'cofactors',
      'adjoint',
      'inverse of matrix',
      'cramer',
      'singular matrix',
      'system of linear equations',
    ],
  },
  {
    name: 'Continuity and Differentiability',
    subject: 'Maths',
    keywords: [
      'continuity',
      'differentiability',
      'chain rule',
      'implicit differentiation',
      'logarithmic differentiation',
      'derivative of parametric',
      'second order derivative',
    ],
  },
  {
    name: 'Applications of Derivatives',
    subject: 'Maths',
    keywords: [
      'applications of derivatives',
      'aod',
      'rate of change',
      'increasing decreasing',
      'maxima and minima',
      'local extrema',
      'critical points',
    ],
  },
  {
    name: 'Integrals',
    subject: 'Maths',
    keywords: [
      'integrals',
      'integration',
      'definite integral',
      'indefinite integral',
      'integration by parts',
      'partial fractions',
      'properties of definite integrals',
      'substitution method',
    ],
  },
  {
    name: 'Applications of Integrals',
    subject: 'Maths',
    keywords: [
      'applications of integrals',
      'aoi',
      'area under curve',
      'area between two curves',
      'area bounded by parabola and line',
    ],
  },
  {
    name: 'Differential Equations',
    subject: 'Maths',
    keywords: [
      'differential equations',
      'order and degree',
      'variable separable',
      'homogeneous differential',
      'linear differential equation',
      'integrating factor',
    ],
  },
  {
    name: 'Vector Algebra',
    subject: 'Maths',
    keywords: [
      'vector algebra',
      'dot product',
      'cross product',
      'scalar product',
      'vector product',
      'direction cosines',
      'unit vector',
      'projection of vector',
    ],
  },
  {
    name: 'Three Dimensional Geometry',
    subject: 'Maths',
    keywords: [
      'three dimensional geometry',
      '3d geometry',
      'direction ratios',
      'shortest distance between skew lines',
      'equation of line in space',
      'coplanar lines',
    ],
  },
  {
    name: 'Linear Programming',
    subject: 'Maths',
    keywords: [
      'linear programming',
      'lpp',
      'feasible region',
      'corner points',
      'objective function',
      'constraints',
    ],
  },
  {
    name: 'Probability',
    subject: 'Maths',
    keywords: [
      'probability',
      'conditional probability',
      'bayes theorem',
      'independent events',
      'random variable',
      'probability distribution',
    ],
  },
];

/**
 * Automatically detects subject and chapter from user prompt query.
 */
export function detectSubjectAndChapter(query: string): {
  subject: DetectedSubject;
  chapter: DetectedChapter;
} {
  const clean = query.toLowerCase().trim();

  // 1. Direct match with chapter catalog
  let bestMatch: ChapterMetadata | null = null;
  let highestScore = 0;

  for (const item of CHAPTER_CATALOG) {
    let score = 0;

    // Direct chapter name inclusion
    if (clean.includes(item.name.toLowerCase())) {
      score += 100;
    }

    // Keyword hits
    for (const kw of item.keywords) {
      if (clean.includes(kw.toLowerCase())) {
        score += kw.length > 6 ? 20 : 10;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  if (bestMatch && highestScore > 0) {
    return {
      subject: bestMatch.subject,
      chapter: {
        name: bestMatch.name,
        subject: bestMatch.subject,
        standardConfidence: Math.min(100, highestScore),
      },
    };
  }

  // 2. Fallback subject keywords check
  if (clean.includes('physics') || clean.includes('current') || clean.includes('ray') || clean.includes('optics') || clean.includes('charge')) {
    return {
      subject: 'Physics',
      chapter: {
        name: 'Electric Charges and Fields',
        subject: 'Physics',
        standardConfidence: 40,
      },
    };
  }

  if (clean.includes('chemistry') || clean.includes('chemical') || clean.includes('reaction') || clean.includes('acid') || clean.includes('molar')) {
    return {
      subject: 'Chemistry',
      chapter: {
        name: 'Electrochemistry',
        subject: 'Chemistry',
        standardConfidence: 40,
      },
    };
  }

  if (clean.includes('math') || clean.includes('calculus') || clean.includes('integral') || clean.includes('matrix') || clean.includes('probability')) {
    return {
      subject: 'Maths',
      chapter: {
        name: 'Integrals',
        subject: 'Maths',
        standardConfidence: 40,
      },
    };
  }

  // General default fallback
  return {
    subject: 'General CBSE',
    chapter: {
      name: 'Class 12 Core Concepts',
      subject: 'General CBSE',
      standardConfidence: 20,
    },
  };
}
