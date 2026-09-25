import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import {
  BoardType,
  ClassNumber,
  SyllabusTemplateDocument,
  ChapterProgress,
  ChapterStatusType,
  ConfidenceLevel,
  ProgressPercentage,
} from '@/types/onboarding';

/**
 * Official CBSE Class 12 PCM Syllabus Template.
 * Exactly 40 Chapters across Physics (14), Chemistry (12), and Mathematics (14).
 * Stored in Firestore under `syllabus_templates/cbse_class_12_pcm`.
 */
export const OFFICIAL_CBSE_12_PCM_TEMPLATE: SyllabusTemplateDocument = {
  id: 'cbse_class_12_pcm',
  board: 'CBSE',
  classNumber: 12,
  updatedAt: new Date().toISOString(),
  subjects: [
    {
      subjectId: 'physics',
      subjectName: 'Physics',
      chapters: [
        { id: 'phy_12_01', name: 'Electric Charges and Fields', topics: ['Coulomb’s Law', 'Electric Field Lines', 'Electric Dipole', 'Gauss’s Theorem & Applications'], estimatedHours: 12, weightage: 8 },
        { id: 'phy_12_02', name: 'Electrostatic Potential and Capacitance', topics: ['Equipotential Surfaces', 'Potential Energy of Dipole', 'Capacitors and Capacitance', 'Dielectrics and Polarisation'], estimatedHours: 11, weightage: 8 },
        { id: 'phy_12_03', name: 'Current Electricity', topics: ['Ohm’s Law & Drift Velocity', 'Temperature Dependence of Resistivity', 'Kirchhoff’s Rules', 'Wheatstone Bridge'], estimatedHours: 12, weightage: 9 },
        { id: 'phy_12_04', name: 'Moving Charges and Magnetism', topics: ['Biot-Savart Law', 'Ampere’s Circuital Law', 'Force on Moving Charge', 'Moving Coil Galvanometer'], estimatedHours: 12, weightage: 9 },
        { id: 'phy_12_05', name: 'Magnetism and Matter', topics: ['Magnetic Dipole Moment', 'Earth’s Magnetic Field', 'Para, Dia and Ferromagnetic Substances'], estimatedHours: 6, weightage: 4 },
        { id: 'phy_12_06', name: 'Electromagnetic Induction', topics: ['Faraday’s Laws', 'Lenz’s Law', 'Eddy Currents', 'Self and Mutual Inductance'], estimatedHours: 8, weightage: 6 },
        { id: 'phy_12_07', name: 'Alternating Current', topics: ['LCR Series Circuit', 'Resonance', 'Power in AC Circuits', 'Transformers'], estimatedHours: 10, weightage: 7 },
        { id: 'phy_12_08', name: 'Electromagnetic Waves', topics: ['Displacement Current', 'Characteristics of EM Waves', 'Electromagnetic Spectrum'], estimatedHours: 5, weightage: 4 },
        { id: 'phy_12_09', name: 'Ray Optics', topics: ['Refraction at Spherical Surfaces', 'Lens Maker’s Formula', 'Total Internal Reflection', 'Microscope and Telescope'], estimatedHours: 14, weightage: 10 },
        { id: 'phy_12_10', name: 'Wave Optics', topics: ['Huygens’ Principle', 'Interference and Young’s Double Slit', 'Diffraction at Single Slit'], estimatedHours: 10, weightage: 8 },
        { id: 'phy_12_11', name: 'Dual Nature', topics: ['Photoelectric Effect', 'Einstein’s Photoelectric Equation', 'de Broglie Wavelength'], estimatedHours: 7, weightage: 6 },
        { id: 'phy_12_12', name: 'Atoms', topics: ['Rutherford & Bohr Model of Hydrogen Atom', 'Line Spectra of Hydrogen'], estimatedHours: 6, weightage: 5 },
        { id: 'phy_12_13', name: 'Nuclei', topics: ['Mass Defect and Binding Energy', 'Nuclear Fission and Fusion'], estimatedHours: 5, weightage: 4 },
        { id: 'phy_12_14', name: 'Semiconductors', topics: ['Intrinsic & Extrinsic Semiconductors', 'p-n Junction Diode', 'Rectifier Circuits'], estimatedHours: 8, weightage: 7 },
      ],
    },
    {
      subjectId: 'chemistry',
      subjectName: 'Chemistry',
      chapters: [
        { id: 'chem_12_01', name: 'Solutions', topics: ['Raoult’s Law', 'Colligative Properties', 'Abnormal Molar Mass & van’t Hoff Factor'], estimatedHours: 10, weightage: 7 },
        { id: 'chem_12_02', name: 'Electrochemistry', topics: ['Nernst Equation', 'Conductivity & Kohlrausch’s Law', 'Galvanic Cells & Batteries', 'Fuel Cells'], estimatedHours: 12, weightage: 9 },
        { id: 'chem_12_03', name: 'Chemical Kinetics', topics: ['Rate Law and Order of Reaction', 'Integrated Rate Equations', 'Arrhenius Equation & Activation Energy'], estimatedHours: 10, weightage: 7 },
        { id: 'chem_12_04', name: 'd and f Block', topics: ['Transition Elements Trends', 'Potassium Permanganate & Dichromate', 'Lanthanoid Contraction'], estimatedHours: 10, weightage: 7 },
        { id: 'chem_12_05', name: 'Coordination Compounds', topics: ['Werner’s Theory', 'IUPAC Nomenclature', 'Valence Bond and Crystal Field Theory', 'Isomerism'], estimatedHours: 10, weightage: 7 },
        { id: 'chem_12_06', name: 'Haloalkanes', topics: ['SN1 and SN2 Mechanisms', 'Optical Rotation', 'Elimination Reactions'], estimatedHours: 7, weightage: 5 },
        { id: 'chem_12_07', name: 'Haloarenes', topics: ['Electrophilic Substitution Reactions', 'Nucleophilic Substitution Inactivity', 'Polyhalogen Compounds'], estimatedHours: 6, weightage: 4 },
        { id: 'chem_12_08', name: 'Alcohol Phenol Ether', topics: ['Preparation & Acidity', 'Hydroboration-Oxidation', 'Kolbe’s & Reimer-Tiemann Reactions', 'Williamson Synthesis'], estimatedHours: 10, weightage: 7 },
        { id: 'chem_12_09', name: 'Aldehyde Ketone', topics: ['Nucleophilic Addition Mechanisms', 'Aldol Condensation & Cannizzaro Reaction', 'Oxidation & Reduction Reactions'], estimatedHours: 9, weightage: 6 },
        { id: 'chem_12_10', name: 'Carboxylic Acid', topics: ['Acidity of Carboxylic Acids', 'Decarboxylation & HVZ Reaction', 'Derivatives Formation'], estimatedHours: 6, weightage: 5 },
        { id: 'chem_12_11', name: 'Amines', topics: ['Basicity of Amines in Aqueous & Gas Phase', 'Hoffmann Bromamide Degradation', 'Diazonium Salts Synthesis & Coupling'], estimatedHours: 8, weightage: 6 },
        { id: 'chem_12_12', name: 'Biomolecules', topics: ['Carbohydrates Classification (Glucose & Fructose)', 'Proteins & Denaturation', 'Nucleic Acids (DNA & RNA)', 'Vitamins'], estimatedHours: 8, weightage: 6 },
      ],
    },
    {
      subjectId: 'mathematics',
      subjectName: 'Mathematics',
      chapters: [
        { id: 'math_12_01', name: 'Relations and Functions', topics: ['Types of Relations (Equivalence)', 'One-One and Onto Functions', 'Composite Functions'], estimatedHours: 8, weightage: 5 },
        { id: 'math_12_02', name: 'Inverse Trigonometric Functions', topics: ['Principal Value Branches', 'Graphs and Domain/Range'], estimatedHours: 6, weightage: 4 },
        { id: 'math_12_03', name: 'Matrices', topics: ['Matrix Operations', 'Symmetric & Skew Symmetric', 'Invertible Matrices'], estimatedHours: 8, weightage: 6 },
        { id: 'math_12_04', name: 'Determinants', topics: ['Minors and Cofactors', 'Adjoint and Inverse of a Matrix', 'Solving System of Linear Equations'], estimatedHours: 9, weightage: 7 },
        { id: 'math_12_05', name: 'Continuity', topics: ['Continuity at a Point and in an Interval', 'Algebra of Continuous Functions', 'Discontinuity Points'], estimatedHours: 7, weightage: 5 },
        { id: 'math_12_06', name: 'Differentiability', topics: ['Chain Rule', 'Implicit Differentiation', 'Logarithmic Differentiation', 'Parametric Forms'], estimatedHours: 8, weightage: 6 },
        { id: 'math_12_07', name: 'Application of Derivatives', topics: ['Rate of Change of Quantities', 'Increasing and Decreasing Functions', 'Maxima and Minima'], estimatedHours: 11, weightage: 8 },
        { id: 'math_12_08', name: 'Integrals', topics: ['Integration by Substitution', 'Integration by Parts', 'Partial Fractions', 'Definite Integrals Properties'], estimatedHours: 16, weightage: 12 },
        { id: 'math_12_09', name: 'Application of Integrals', topics: ['Area under Simple Curves (Circles, Parabolas, Ellipses)', 'Area bounded by Line and Curve'], estimatedHours: 7, weightage: 6 },
        { id: 'math_12_10', name: 'Differential Equations', topics: ['Order and Degree', 'Separation of Variables', 'Homogeneous and Linear Differential Equations'], estimatedHours: 10, weightage: 8 },
        { id: 'math_12_11', name: 'Vector Algebra', topics: ['Dot Product (Scalar)', 'Cross Product (Vector)', 'Direction Cosines & Direction Ratios', 'Projection of Vectors'], estimatedHours: 8, weightage: 7 },
        { id: 'math_12_12', name: '3D Geometry', topics: ['Equation of Line in Space', 'Angle between Lines', 'Shortest Distance between Two Skew Lines'], estimatedHours: 9, weightage: 8 },
        { id: 'math_12_13', name: 'Linear Programming', topics: ['Graphical Method for Linear Inequalities', 'Bounded and Unbounded Feasible Regions', 'Optimal Objective Function'], estimatedHours: 6, weightage: 5 },
        { id: 'math_12_14', name: 'Probability', topics: ['Conditional Probability', 'Multiplication Theorem', 'Bayes’ Theorem', 'Random Variables & Probability Distributions'], estimatedHours: 10, weightage: 8 },
      ],
    },
  ],
};

export const CANONICAL_SYLLABUS_TEMPLATES: Record<string, SyllabusTemplateDocument> = {
  cbse_class_12_pcm: OFFICIAL_CBSE_12_PCM_TEMPLATE,
  cbse_class_12: OFFICIAL_CBSE_12_PCM_TEMPLATE,
};

/**
 * Returns strictly CBSE Class 12 PCM subjects.
 */
export function getSubjectsForClassAndBoard(classNumber: ClassNumber = 12, board: BoardType = 'CBSE', stream?: string) {
  return [
    { id: 'physics' as const, name: 'Physics' as const, color: '#6366f1', code: '042', isCore: true },
    { id: 'chemistry' as const, name: 'Chemistry' as const, color: '#ec4899', code: '043', isCore: true },
    { id: 'mathematics' as const, name: 'Mathematics' as const, color: '#3b82f6', code: '041', isCore: true },
  ];
}

/**
 * Fetches syllabus template from Firestore, or defaults to official CBSE Class 12 PCM template.
 */
export async function getOrSeedSyllabusTemplate(
  board: BoardType = 'CBSE',
  classNumber: ClassNumber = 12
): Promise<SyllabusTemplateDocument> {
  const templateId = 'cbse_class_12_pcm';
  const docRef = doc(db, 'syllabus_templates', templateId);

  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as SyllabusTemplateDocument;
    }
  } catch (error) {
    console.warn('Could not read syllabus_template from Firestore, fallback to canonical template', error);
  }

  const templateToSave: SyllabusTemplateDocument = {
    ...OFFICIAL_CBSE_12_PCM_TEMPLATE,
    id: templateId,
    board: 'CBSE',
    classNumber: 12,
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(docRef, templateToSave);
  } catch (err) {
    console.warn('Could not seed syllabus template to Firestore:', err);
  }

  return templateToSave;
}

/**
 * Copies CBSE Class 12 PCM syllabus template chapters into user's chapter_progress structure.
 */
export function buildInitialChapterProgressList(
  template: SyllabusTemplateDocument = OFFICIAL_CBSE_12_PCM_TEMPLATE,
  selectedSubjectIds: string[] = ['physics', 'chemistry', 'mathematics'],
  initialProgressMap?: Record<string, Partial<ChapterProgress>>
): ChapterProgress[] {
  const result: ChapterProgress[] = [];
  let orderCounter = 0;

  for (const subject of template.subjects) {
    if (selectedSubjectIds.length > 0 && !selectedSubjectIds.includes(subject.subjectId)) {
      continue;
    }

    for (const chapter of subject.chapters) {
      const userCustom = initialProgressMap?.[chapter.id];
      const progressPercentage: ProgressPercentage =
        userCustom?.progressPercentage !== undefined
          ? userCustom.progressPercentage
          : userCustom?.completionPercentage !== undefined
          ? (userCustom.completionPercentage >= 100
              ? 100
              : userCustom.completionPercentage >= 75
              ? 75
              : userCustom.completionPercentage >= 50
              ? 50
              : userCustom.completionPercentage >= 25
              ? 25
              : 0)
          : 0;

      const confidence: ConfidenceLevel = userCustom?.confidence || 3;
      const status: ChapterStatusType =
        progressPercentage === 100
          ? 'Completed'
          : progressPercentage >= 50
          ? 'Started'
          : progressPercentage > 0
          ? 'Started'
          : 'Never Started';

      const completion = progressPercentage === 100;
      const needsRevision = userCustom?.needsRevision !== undefined ? userCustom.needsRevision : confidence <= 2;
      const needsFocus = userCustom?.needsFocus !== undefined ? userCustom.needsFocus : (confidence <= 2 || progressPercentage < 50);

      result.push({
        id: chapter.id,
        chapterId: chapter.id,
        chapterName: chapter.name,
        subjectId: subject.subjectId as 'physics' | 'chemistry' | 'mathematics',
        subjectName: subject.subjectName as 'Physics' | 'Chemistry' | 'Mathematics',
        progressPercentage,
        confidence,
        revisionCount: userCustom?.revisionCount || (completion ? 1 : 0),
        practiceQuestions: userCustom?.practiceQuestions || (completion ? 30 : progressPercentage > 0 ? 10 : 0),
        weakTopics: userCustom?.weakTopics || (confidence <= 2 ? (chapter.topics?.slice(0, 2) || []) : []),
        strongTopics: userCustom?.strongTopics || (confidence >= 4 ? (chapter.topics?.slice(0, 2) || []) : []),
        timeSpent: userCustom?.timeSpent || (completion ? 180 : progressPercentage > 0 ? 60 : 0),
        accuracy: userCustom?.accuracy || (confidence >= 4 ? 85 : confidence === 3 ? 70 : 45),
        completion,
        needsRevision,
        needsFocus,
        lastOpened: userCustom?.lastOpened || (progressPercentage > 0 ? new Date().toISOString() : null),
        lastStudied: userCustom?.lastStudied || (progressPercentage > 0 ? new Date().toISOString() : null),
        topics: chapter.topics,
        orderIndex: orderCounter++,
        updatedAt: new Date().toISOString(),
        // Aliases
        status,
        completionPercentage: progressPercentage,
        studyMinutes: userCustom?.timeSpent || (completion ? 180 : progressPercentage > 0 ? 60 : 0),
        questionSolved: userCustom?.practiceQuestions || (completion ? 30 : 0),
      });
    }
  }

  return result;
}
