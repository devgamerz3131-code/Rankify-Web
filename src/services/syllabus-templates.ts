import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import {
  BoardType,
  ClassNumber,
  SyllabusTemplateDocument,
  ChapterProgress,
  ChapterStatusType,
  ConfidenceLevel,
} from '@/types/onboarding';

/**
 * Canonical syllabus templates covering classes 6-12 across boards.
 * These are stored in Firestore under `syllabus_templates/{templateId}`.
 */
export const CANONICAL_SYLLABUS_TEMPLATES: Record<string, SyllabusTemplateDocument> = {
  // Class 10 CBSE
  cbse_class_10: {
    id: 'cbse_class_10',
    board: 'CBSE',
    classNumber: 10,
    updatedAt: new Date().toISOString(),
    subjects: [
      {
        subjectId: 'mathematics',
        subjectName: 'Mathematics',
        chapters: [
          { id: 'math_10_01', name: 'Real Numbers', topics: ['Fundamental Theorem of Arithmetic', 'Revisiting Irrational Numbers'], estimatedHours: 6, weightage: 6 },
          { id: 'math_10_02', name: 'Polynomials', topics: ['Geometrical Meaning of Zeroes', 'Relationship between Zeroes and Coefficients'], estimatedHours: 8, weightage: 6 },
          { id: 'math_10_03', name: 'Pair of Linear Equations in Two Variables', topics: ['Graphical Method', 'Substitution Method', 'Elimination Method'], estimatedHours: 10, weightage: 8 },
          { id: 'math_10_04', name: 'Quadratic Equations', topics: ['Factorisation', 'Nature of Roots', 'Quadratic Formula'], estimatedHours: 10, weightage: 8 },
          { id: 'math_10_05', name: 'Arithmetic Progressions', topics: ['nth Term of an AP', 'Sum of First n Terms of an AP'], estimatedHours: 8, weightage: 7 },
          { id: 'math_10_06', name: 'Triangles', topics: ['Similarity of Triangles', 'Criteria for Similarity', 'Basic Proportionality Theorem'], estimatedHours: 12, weightage: 9 },
          { id: 'math_10_07', name: 'Coordinate Geometry', topics: ['Distance Formula', 'Section Formula'], estimatedHours: 6, weightage: 6 },
          { id: 'math_10_08', name: 'Introduction to Trigonometry', topics: ['Trigonometric Ratios', 'Trigonometric Ratios of Specific Angles', 'Trigonometric Identities'], estimatedHours: 10, weightage: 8 },
          { id: 'math_10_09', name: 'Some Applications of Trigonometry', topics: ['Heights and Distances', 'Angle of Elevation and Depression'], estimatedHours: 8, weightage: 7 },
          { id: 'math_10_10', name: 'Circles', topics: ['Tangent to a Circle', 'Number of Tangents from a Point on a Circle'], estimatedHours: 8, weightage: 6 },
          { id: 'math_10_11', name: 'Areas Related to Circles', topics: ['Areas of Sector and Segment of a Circle'], estimatedHours: 6, weightage: 5 },
          { id: 'math_10_12', name: 'Surface Areas and Volumes', topics: ['Surface Area of a Combination of Solids', 'Volume of a Combination of Solids'], estimatedHours: 10, weightage: 8 },
          { id: 'math_10_13', name: 'Statistics', topics: ['Mean of Grouped Data', 'Mode of Grouped Data', 'Median of Grouped Data'], estimatedHours: 8, weightage: 6 },
          { id: 'math_10_14', name: 'Probability', topics: ['Classical Definition of Probability', 'Complementary Events'], estimatedHours: 6, weightage: 5 },
        ],
      },
      {
        subjectId: 'science',
        subjectName: 'Science',
        chapters: [
          { id: 'sci_10_01', name: 'Chemical Reactions and Equations', topics: ['Chemical Equation Balancing', 'Types of Chemical Reactions', 'Oxidation and Reduction', 'Corrosion and Rancidity'], estimatedHours: 8, weightage: 6 },
          { id: 'sci_10_02', name: 'Acids, Bases and Salts', topics: ['Chemical Properties', 'pH Scale Importance', 'Salts & Bleaching Powder, Plaster of Paris'], estimatedHours: 9, weightage: 7 },
          { id: 'sci_10_03', name: 'Metals and Non-metals', topics: ['Physical and Chemical Properties', 'Reactivity Series', 'Ionic Compounds', 'Corrosion Prevention'], estimatedHours: 9, weightage: 7 },
          { id: 'sci_10_04', name: 'Carbon and its Compounds', topics: ['Covalent Bonding', 'Versatile Nature of Carbon', 'Homologous Series', 'Functional Groups', 'Combustion & Saponification'], estimatedHours: 12, weightage: 9 },
          { id: 'sci_10_05', name: 'Life Processes', topics: ['Nutrition (Autotrophic & Heterotrophic)', 'Respiration', 'Transportation in Humans & Plants', 'Excretion'], estimatedHours: 12, weightage: 9 },
          { id: 'sci_10_06', name: 'Control and Coordination', topics: ['Nervous System & Reflex Arc', 'Human Brain', 'Plant Hormones', 'Animal Hormones'], estimatedHours: 8, weightage: 6 },
          { id: 'sci_10_07', name: 'How do Organisms Reproduce?', topics: ['Asexual Reproduction Modes', 'Sexual Reproduction in Flowering Plants', 'Human Reproductive System', 'Reproductive Health'], estimatedHours: 9, weightage: 7 },
          { id: 'sci_10_08', name: 'Heredity and Evolution', topics: ['Mendel’s Experiments', 'Laws of Inheritance', 'Sex Determination in Humans'], estimatedHours: 7, weightage: 5 },
          { id: 'sci_10_09', name: 'Light – Reflection and Refraction', topics: ['Spherical Mirrors & Mirror Formula', 'Refraction & Snell’s Law', 'Lenses & Lens Formula', 'Power of a Lens'], estimatedHours: 12, weightage: 9 },
          { id: 'sci_10_10', name: 'The Human Eye and Colourful World', topics: ['Structure of Eye & Defects', 'Refraction through Prism', 'Dispersion of Light', 'Atmospheric Refraction & Scattering'], estimatedHours: 8, weightage: 6 },
          { id: 'sci_10_11', name: 'Electricity', topics: ['Electric Current & Potential Difference', 'Ohm’s Law & Resistance', 'Series & Parallel Combinations', 'Joule’s Heating Effect', 'Electric Power'], estimatedHours: 11, weightage: 8 },
          { id: 'sci_10_12', name: 'Magnetic Effects of Electric Current', topics: ['Magnetic Field Lines', 'Right Hand Thumb Rule', 'Force on Current-Carrying Conductor', 'Fleming’s Left Hand Rule', 'Domestic Electric Circuits'], estimatedHours: 9, weightage: 6 },
          { id: 'sci_10_13', name: 'Our Environment', topics: ['Eco-system Components', 'Food Chains and Food Webs', 'Ozone Layer Depletion', 'Waste Management'], estimatedHours: 5, weightage: 5 },
        ],
      },
      {
        subjectId: 'social_science',
        subjectName: 'Social Science',
        chapters: [
          { id: 'sst_10_01', name: 'The Rise of Nationalism in Europe', topics: ['French Revolution and the Idea of Nation', 'Making of Nationalism in Europe', 'Age of Revolutions', 'Unification of Germany & Italy'], estimatedHours: 8, weightage: 6 },
          { id: 'sst_10_02', name: 'Nationalism in India', topics: ['First World War & Non-Cooperation', 'Differing Strands within Movement', 'Towards Civil Disobedience', 'Sense of Collective Belonging'], estimatedHours: 9, weightage: 7 },
          { id: 'sst_10_03', name: 'The Making of a Global World', topics: ['Pre-modern World', 'Silk Routes', 'Conquest, Disease and Trade', 'Inter-war Economy'], estimatedHours: 6, weightage: 4 },
          { id: 'sst_10_04', name: 'Resources and Development', topics: ['Classification of Resources', 'Resource Planning in India', 'Land Resources & Soil Types'], estimatedHours: 7, weightage: 5 },
          { id: 'sst_10_05', name: 'Water Resources', topics: ['Water Scarcity and Conservation', 'Multi-purpose River Projects', 'Rainwater Harvesting'], estimatedHours: 6, weightage: 4 },
          { id: 'sst_10_06', name: 'Agriculture', topics: ['Types of Farming', 'Cropping Pattern', 'Major Crops & Technological Reforms'], estimatedHours: 7, weightage: 5 },
          { id: 'sst_10_07', name: 'Power Sharing', topics: ['Case Studies of Belgium and Sri Lanka', 'Majoritarianism', 'Forms of Power Sharing'], estimatedHours: 6, weightage: 4 },
          { id: 'sst_10_08', name: 'Federalism', topics: ['What is Federalism', 'What Makes India a Federal Country', 'Decentralisation in India'], estimatedHours: 7, weightage: 5 },
          { id: 'sst_10_09', name: 'Development', topics: ['What Development Promises', 'Income and Other Goals', 'National Development', 'Sustainable Development'], estimatedHours: 6, weightage: 5 },
          { id: 'sst_10_10', name: 'Sectors of the Indian Economy', topics: ['Primary, Secondary and Tertiary Sectors', 'Rising Importance of Tertiary Sector', 'Division of Sectors (Organised & Unorganised)'], estimatedHours: 7, weightage: 5 },
          { id: 'sst_10_11', name: 'Money and Credit', topics: ['Money as a Medium of Exchange', 'Modern Forms of Money', 'Loan Activities of Banks', 'Terms of Credit & Self-Help Groups'], estimatedHours: 7, weightage: 5 },
        ],
      },
      {
        subjectId: 'english',
        subjectName: 'English Language & Literature',
        chapters: [
          { id: 'eng_10_01', name: 'A Letter to God', topics: ['Faith and Hope', 'Character Sketch of Lencho', 'Irony Analysis'], estimatedHours: 4, weightage: 4 },
          { id: 'eng_10_02', name: 'Nelson Mandela: Long Walk to Freedom', topics: ['Struggle Against Apartheid', 'Courage and Freedom Concepts'], estimatedHours: 5, weightage: 5 },
          { id: 'eng_10_03', name: 'Two Stories about Flying', topics: ['His First Flight', 'The Black Aeroplane'], estimatedHours: 5, weightage: 4 },
          { id: 'eng_10_04', name: 'From the Diary of Anne Frank', topics: ['Adolescent Psychology', 'Historical Background of World War II'], estimatedHours: 5, weightage: 4 },
          { id: 'eng_10_05', name: 'Glimpses of India', topics: ['A Baker from Goa', 'Coorg', 'Tea from Assam'], estimatedHours: 6, weightage: 5 },
          { id: 'eng_10_06', name: 'Formal Letters & Analytical Paragraph', topics: ['Letter of Enquiry / Complaint / Order', 'Data & Chart Interpretation'], estimatedHours: 7, weightage: 8 },
          { id: 'eng_10_07', name: 'Integrated Grammar', topics: ['Tenses', 'Modals', 'Subject-Verb Concord', 'Reported Speech'], estimatedHours: 8, weightage: 10 },
        ],
      },
    ],
  },

  // Class 12 CBSE (PCM / PCB / Commerce / Arts)
  cbse_class_12: {
    id: 'cbse_class_12',
    board: 'CBSE',
    classNumber: 12,
    updatedAt: new Date().toISOString(),
    subjects: [
      {
        subjectId: 'physics',
        subjectName: 'Physics',
        chapters: [
          { id: 'phy_12_01', name: 'Electric Charges and Fields', topics: ['Coulomb’s Law', 'Electric Field Lines', 'Electric Dipole', 'Gauss’s Theorem and Applications'], estimatedHours: 12, weightage: 8 },
          { id: 'phy_12_02', name: 'Electrostatic Potential and Capacitance', topics: ['Equipotential Surfaces', 'Potential Energy of Dipole', 'Capacitors and Capacitance', 'Dielectrics and Polarisation'], estimatedHours: 11, weightage: 8 },
          { id: 'phy_12_03', name: 'Current Electricity', topics: ['Ohm’s Law & Drift Velocity', 'Temperature Dependence of Resistivity', 'Kirchhoff’s Rules', 'Wheatstone Bridge'], estimatedHours: 12, weightage: 9 },
          { id: 'phy_12_04', name: 'Moving Charges and Magnetism', topics: ['Biot-Savart Law', 'Ampere’s Circuital Law', 'Force on Moving Charge', 'Moving Coil Galvanometer'], estimatedHours: 12, weightage: 9 },
          { id: 'phy_12_05', name: 'Magnetism and Matter', topics: ['Magnetic Dipole Moment', 'Earth’s Magnetic Field', 'Para, Dia and Ferromagnetic Substances'], estimatedHours: 6, weightage: 4 },
          { id: 'phy_12_06', name: 'Electromagnetic Induction', topics: ['Faraday’s Laws', 'Lenz’s Law', 'Eddy Currents', 'Self and Mutual Inductance'], estimatedHours: 8, weightage: 6 },
          { id: 'phy_12_07', name: 'Alternating Current', topics: ['LCR Series Circuit', 'Resonance', 'Power in AC Circuits', 'Transformers'], estimatedHours: 10, weightage: 7 },
          { id: 'phy_12_08', name: 'Electromagnetic Waves', topics: ['Displacement Current', 'Characteristics of EM Waves', 'Electromagnetic Spectrum'], estimatedHours: 5, weightage: 4 },
          { id: 'phy_12_09', name: 'Ray Optics and Optical Instruments', topics: ['Refraction at Spherical Surfaces', 'Lens Maker’s Formula', 'Total Internal Reflection', 'Microscope and Telescope'], estimatedHours: 14, weightage: 10 },
          { id: 'phy_12_10', name: 'Wave Optics', topics: ['Huygens’ Principle', 'Interference and Young’s Double Slit', 'Diffraction at Single Slit'], estimatedHours: 10, weightage: 8 },
          { id: 'phy_12_11', name: 'Dual Nature of Radiation and Matter', topics: ['Photoelectric Effect', 'Einstein’s Photoelectric Equation', 'de Broglie Wavelength'], estimatedHours: 7, weightage: 6 },
          { id: 'phy_12_12', name: 'Atoms', topics: ['Rutherford & Bohr Model of Hydrogen Atom', 'Line Spectra of Hydrogen'], estimatedHours: 6, weightage: 5 },
          { id: 'phy_12_13', name: 'Nuclei', topics: ['Mass Defect and Binding Energy', 'Nuclear Fission and Fusion'], estimatedHours: 5, weightage: 4 },
          { id: 'phy_12_14', name: 'Semiconductor Electronics', topics: ['Intrinsic & Extrinsic Semiconductors', 'p-n Junction Diode', 'Rectifier Circuits'], estimatedHours: 8, weightage: 7 },
        ],
      },
      {
        subjectId: 'chemistry',
        subjectName: 'Chemistry',
        chapters: [
          { id: 'chem_12_01', name: 'Solutions', topics: ['Raoult’s Law', 'Colligative Properties', 'Abnormal Molar Mass & van’t Hoff Factor'], estimatedHours: 10, weightage: 7 },
          { id: 'chem_12_02', name: 'Electrochemistry', topics: ['Nernst Equation', 'Conductivity & Kohlrausch’s Law', 'Galvanic Cells & Batteries', 'Fuel Cells'], estimatedHours: 12, weightage: 9 },
          { id: 'chem_12_03', name: 'Chemical Kinetics', topics: ['Rate Law and Order of Reaction', 'Integrated Rate Equations', 'Arrhenius Equation and Activation Energy'], estimatedHours: 10, weightage: 7 },
          { id: 'chem_12_04', name: 'The d- and f-Block Elements', topics: ['Transition Elements Trends', 'Potassium Permanganate and Dichromate', 'Lanthanoid Contraction'], estimatedHours: 10, weightage: 7 },
          { id: 'chem_12_05', name: 'Coordination Compounds', topics: ['Werner’s Theory', 'IUPAC Nomenclature', 'Valence Bond and Crystal Field Theory', 'Isomerism'], estimatedHours: 10, weightage: 7 },
          { id: 'chem_12_06', name: 'Haloalkanes and Haloarenes', topics: ['SN1 and SN2 Mechanisms', 'Optical Rotation', 'Electrophilic Substitution Reactions'], estimatedHours: 9, weightage: 6 },
          { id: 'chem_12_07', name: 'Alcohols, Phenols and Ethers', topics: ['Preparation and Acidity', 'Hydroboration-Oxidation', 'Kolbe’s and Reimer-Tiemann Reactions', 'Williamson Synthesis'], estimatedHours: 10, weightage: 7 },
          { id: 'chem_12_08', name: 'Aldehydes, Ketones and Carboxylic Acids', topics: ['Nucleophilic Addition', 'Aldol and Cannizzaro Reactions', 'Acidity of Carboxylic Acids'], estimatedHours: 12, weightage: 8 },
          { id: 'chem_12_09', name: 'Amines', topics: ['Basicity of Amines', 'Hoffmann Bromamide Degradation', 'Diazonium Salts and Reactions'], estimatedHours: 8, weightage: 6 },
          { id: 'chem_12_10', name: 'Biomolecules', topics: ['Carbohydrates Classification', 'Proteins and Denaturation', 'Nucleic Acids (DNA & RNA)', 'Vitamins'], estimatedHours: 8, weightage: 6 },
        ],
      },
      {
        subjectId: 'mathematics',
        subjectName: 'Mathematics',
        chapters: [
          { id: 'math_12_01', name: 'Relations and Functions', topics: ['Types of Relations', 'One-One and Onto Functions', 'Composition of Functions'], estimatedHours: 8, weightage: 5 },
          { id: 'math_12_02', name: 'Inverse Trigonometric Functions', topics: ['Principal Value Branches', 'Graphs and Domain/Range'], estimatedHours: 6, weightage: 4 },
          { id: 'math_12_03', name: 'Matrices', topics: ['Matrix Operations', 'Symmetric & Skew Symmetric', 'Invertible Matrices'], estimatedHours: 8, weightage: 6 },
          { id: 'math_12_04', name: 'Determinants', topics: ['Minors and Cofactors', 'Adjoint and Inverse of a Matrix', 'Solving System of Equations'], estimatedHours: 9, weightage: 7 },
          { id: 'math_12_05', name: 'Continuity and Differentiability', topics: ['Continuity Criteria', 'Chain Rule', 'Implicit Differentiation', 'Logarithmic Differentiation'], estimatedHours: 12, weightage: 9 },
          { id: 'math_12_06', name: 'Application of Derivatives', topics: ['Rate of Change', 'Increasing and Decreasing Functions', 'Maxima and Minima'], estimatedHours: 11, weightage: 8 },
          { id: 'math_12_07', name: 'Integrals', topics: ['Integration by Substitution', 'Integration by Parts', 'Partial Fractions', 'Definite Integrals Properties'], estimatedHours: 16, weightage: 12 },
          { id: 'math_12_08', name: 'Application of Integrals', topics: ['Area under Simple Curves', 'Area between Two Curves'], estimatedHours: 7, weightage: 6 },
          { id: 'math_12_09', name: 'Differential Equations', topics: ['Order and Degree', 'Separation of Variables', 'Homogeneous and Linear Differential Equations'], estimatedHours: 10, weightage: 8 },
          { id: 'math_12_10', name: 'Vectors', topics: ['Dot Product', 'Cross Product', 'Direction Cosines and Ratios'], estimatedHours: 8, weightage: 7 },
          { id: 'math_12_11', name: 'Three Dimensional Geometry', topics: ['Equation of Line in Space', 'Shortest Distance between Two Skew Lines', 'Planes and Angles'], estimatedHours: 9, weightage: 8 },
          { id: 'math_12_12', name: 'Linear Programming', topics: ['Graphical Solution of Linear Inequalities', 'Bounded and Unbounded Feasible Regions'], estimatedHours: 6, weightage: 5 },
          { id: 'math_12_13', name: 'Probability', topics: ['Conditional Probability', 'Bayes’ Theorem', 'Random Variables and Probability Distribution'], estimatedHours: 10, weightage: 8 },
        ],
      },
      {
        subjectId: 'biology',
        subjectName: 'Biology',
        chapters: [
          { id: 'bio_12_01', name: 'Sexual Reproduction in Flowering Plants', topics: ['Microsporogenesis and Megasporogenesis', 'Pollination Mechanisms', 'Double Fertilisation', 'Endosperm Development'], estimatedHours: 10, weightage: 7 },
          { id: 'bio_12_02', name: 'Human Reproduction', topics: ['Male and Female Reproductive Systems', 'Spermatogenesis and Oogenesis', 'Menstrual Cycle', 'Fertilisation and Implantation'], estimatedHours: 11, weightage: 8 },
          { id: 'bio_12_03', name: 'Reproductive Health', topics: ['Contraceptive Methods', 'Medical Termination of Pregnancy (MTP)', 'STDs and Infertility (ART/IVF)'], estimatedHours: 6, weightage: 5 },
          { id: 'bio_12_04', name: 'Principles of Inheritance and Variation', topics: ['Mendelism', 'Incomplete Dominance and Co-dominance', 'Linkage and Recombination', 'Genetic Disorders'], estimatedHours: 13, weightage: 10 },
          { id: 'bio_12_05', name: 'Molecular Basis of Inheritance', topics: ['Structure of DNA', 'DNA Replication', 'Transcription and Translation', 'Lac Operon', 'Human Genome Project'], estimatedHours: 14, weightage: 11 },
          { id: 'bio_12_06', name: 'Evolution', topics: ['Origin of Life', 'Darwinian Theory of Evolution', 'Hardy-Weinberg Principle', 'Human Evolution'], estimatedHours: 8, weightage: 6 },
          { id: 'bio_12_07', name: 'Human Health and Disease', topics: ['Pathogens (Malaria, Typhoid, AIDS)', 'Immunity (Innate and Acquired)', 'Cancer and Drugs/Alcohol Abuse'], estimatedHours: 10, weightage: 8 },
          { id: 'bio_12_08', name: 'Microbes in Human Welfare', topics: ['Microbes in Household Food and Industry', 'Sewage Treatment and Biogas', 'Biocontrol Agents and Biofertilisers'], estimatedHours: 7, weightage: 5 },
          { id: 'bio_12_09', name: 'Biotechnology: Principles and Processes', topics: ['Recombinant DNA Technology', 'Restriction Enzymes', 'Cloning Vectors and PCR'], estimatedHours: 9, weightage: 7 },
          { id: 'bio_12_10', name: 'Biotechnology and its Applications', topics: ['Bt Cotton and RNA Interference', 'Gene Therapy and Genetically Engineered Insulin', 'Transgenic Animals and Ethical Issues'], estimatedHours: 8, weightage: 6 },
          { id: 'bio_12_11', name: 'Organisms and Populations', topics: ['Organism and its Environment', 'Population Attributes', 'Population Growth Models', 'Population Interactions'], estimatedHours: 8, weightage: 6 },
          { id: 'bio_12_12', name: 'Ecosystem', topics: ['Ecosystem Structure and Function', 'Productivity and Decomposition', 'Energy Flow and Ecological Pyramids'], estimatedHours: 7, weightage: 5 },
          { id: 'bio_12_13', name: 'Biodiversity and Conservation', topics: ['Patterns and Loss of Biodiversity', 'In-situ and Ex-situ Conservation', 'Hotspots and National Parks'], estimatedHours: 6, weightage: 5 },
        ],
      },
      {
        subjectId: 'english_core',
        subjectName: 'English Core',
        chapters: [
          { id: 'engc_12_01', name: 'The Last Lesson & Lost Spring', topics: ['Linguistic Chauvinism', 'Child Labour Realities in Firozabad'], estimatedHours: 6, weightage: 6 },
          { id: 'engc_12_02', name: 'Deep Water & The Rattrap', topics: ['Overcoming Fear', 'Human Kindness and Redemption Themes'], estimatedHours: 6, weightage: 6 },
          { id: 'engc_12_03', name: 'Indigo & Poets and Pancakes', topics: ['Gandhiji and Champaran Movement', 'Gemini Studios Insights'], estimatedHours: 6, weightage: 6 },
          { id: 'engc_12_04', name: 'The Third Level & The Tiger King', topics: ['Psychological Escapism', 'Irony of Fate and Power'], estimatedHours: 6, weightage: 6 },
          { id: 'engc_12_05', name: 'Advanced Writing Skills', topics: ['Notice Writing', 'Formal Invitations & Replies', 'Letter to Editor & Job Application', 'Article & Report Writing'], estimatedHours: 10, weightage: 16 },
        ],
      },
      {
        subjectId: 'computer_science',
        subjectName: 'Computer Science',
        chapters: [
          { id: 'cs_12_01', name: 'Computational Thinking and Programming - 2', topics: ['Python Functions', 'File Handling (Text, Binary, CSV)', 'Data Structures (Stack using Lists)'], estimatedHours: 16, weightage: 18 },
          { id: 'cs_12_02', name: 'Computer Networks', topics: ['Network Devices & Topologies', 'Protocols (TCP/IP, HTTP, DNS)', 'Network Security Concepts'], estimatedHours: 10, weightage: 10 },
          { id: 'cs_12_03', name: 'Database Management', topics: ['Relational Data Model', 'SQL Commands (DDL, DML, Aggregate Functions)', 'Interface Python with SQL Database'], estimatedHours: 14, weightage: 15 },
        ],
      },
    ],
  },

  // Class 11 CBSE
  cbse_class_11: {
    id: 'cbse_class_11',
    board: 'CBSE',
    classNumber: 11,
    updatedAt: new Date().toISOString(),
    subjects: [
      {
        subjectId: 'physics',
        subjectName: 'Physics',
        chapters: [
          { id: 'phy_11_01', name: 'Units and Measurements', topics: ['SI Units', 'Dimensional Analysis and Applications', 'Significant Figures and Errors'], estimatedHours: 8, weightage: 6 },
          { id: 'phy_11_02', name: 'Motion in a Straight Line', topics: ['Frame of Reference', 'Position-Time Graph', 'Kinematic Equations for Uniform Acceleration'], estimatedHours: 9, weightage: 6 },
          { id: 'phy_11_03', name: 'Motion in a Plane', topics: ['Vectors Addition & Resolution', 'Projectile Motion', 'Uniform Circular Motion'], estimatedHours: 10, weightage: 7 },
          { id: 'phy_11_04', name: 'Laws of Motion', topics: ['Newton’s Three Laws', 'Conservation of Linear Momentum', 'Friction & Banking of Roads'], estimatedHours: 11, weightage: 8 },
          { id: 'phy_11_05', name: 'Work, Energy and Power', topics: ['Work-Energy Theorem', 'Conservative and Non-conservative Forces', 'Elastic & Inelastic Collisions'], estimatedHours: 10, weightage: 7 },
          { id: 'phy_11_06', name: 'System of Particles and Rotational Motion', topics: ['Centre of Mass', 'Torque and Angular Momentum', 'Moment of Inertia & Parallel Axis Theorem'], estimatedHours: 13, weightage: 9 },
          { id: 'phy_11_07', name: 'Gravitation', topics: ['Universal Law of Gravitation', 'Acceleration due to Gravity with Altitude & Depth', 'Escape Velocity & Orbital Velocity'], estimatedHours: 9, weightage: 6 },
          { id: 'phy_11_08', name: 'Mechanical Properties of Solids', topics: ['Hooke’s Law', 'Young’s Modulus', 'Bulk Modulus & Shear Modulus'], estimatedHours: 7, weightage: 5 },
          { id: 'phy_11_09', name: 'Mechanical Properties of Fluids', topics: ['Pascal’s Law', 'Viscosity and Stokes’ Law', 'Bernoulli’s Principle and Surface Tension'], estimatedHours: 11, weightage: 8 },
          { id: 'phy_11_10', name: 'Thermal Properties of Matter', topics: ['Thermal Expansion', 'Specific Heat Capacity', 'Calorimetry and Heat Transfer'], estimatedHours: 8, weightage: 5 },
          { id: 'phy_11_11', name: 'Thermodynamics', topics: ['Zeroth & First Law of Thermodynamics', 'Isothermal and Adiabatic Processes', 'Second Law and Reversible Processes'], estimatedHours: 10, weightage: 7 },
          { id: 'phy_11_12', name: 'Kinetic Theory of Gases', topics: ['Ideal Gas Equation', 'RMS Speed and Kinetic Energy', 'Degrees of Freedom and Law of Equipartition'], estimatedHours: 8, weightage: 5 },
          { id: 'phy_11_13', name: 'Oscillations', topics: ['Simple Harmonic Motion', 'Energy in SHM', 'Simple Pendulum and Resonance'], estimatedHours: 9, weightage: 6 },
          { id: 'phy_11_14', name: 'Waves', topics: ['Longitudinal & Transverse Waves', 'Speed of Sound & Laplace Correction', 'Standing Waves in Strings and Organ Pipes', 'Beats'], estimatedHours: 10, weightage: 7 },
        ],
      },
      {
        subjectId: 'chemistry',
        subjectName: 'Chemistry',
        chapters: [
          { id: 'chem_11_01', name: 'Some Basic Concepts of Chemistry', topics: ['Mole Concept and Molar Mass', 'Empirical and Molecular Formula', 'Stoichiometry and Limiting Reagent'], estimatedHours: 10, weightage: 7 },
          { id: 'chem_11_02', name: 'Structure of Atom', topics: ['Bohr’s Model and Limitations', 'de Broglie Relation & Heisenberg Uncertainty', 'Quantum Numbers and Electronic Configuration'], estimatedHours: 12, weightage: 8 },
          { id: 'chem_11_03', name: 'Classification of Elements and Periodicity', topics: ['Periodic Table Modern Law', 'Trends in Atomic Radii & Ionization Enthalpy', 'Electronegativity Trends'], estimatedHours: 8, weightage: 5 },
          { id: 'chem_11_04', name: 'Chemical Bonding and Molecular Structure', topics: ['Lewis Structures', 'VSEPR Theory', 'Valence Bond Theory & Hybridisation', 'Molecular Orbital Theory'], estimatedHours: 14, weightage: 10 },
          { id: 'chem_11_05', name: 'Chemical Thermodynamics', topics: ['First Law of Thermodynamics', 'Enthalpy of Reactions', 'Entropy and Gibbs Free Energy', 'Spontaneity Criteria'], estimatedHours: 12, weightage: 9 },
          { id: 'chem_11_06', name: 'Equilibrium', topics: ['Law of Chemical Equilibrium', 'Le Chatelier’s Principle', 'Ionic Equilibrium & pH', 'Buffer Solutions and Solubility Product'], estimatedHours: 14, weightage: 10 },
          { id: 'chem_11_07', name: 'Redox Reactions', topics: ['Oxidation Number Concept', 'Balancing Redox Equations (Ion-Electron Method)'], estimatedHours: 7, weightage: 4 },
          { id: 'chem_11_08', name: 'Organic Chemistry: Some Basic Principles', topics: ['IUPAC Nomenclature', 'Inductive & Mesomeric Effects', 'Hyperconjugation & Reaction Intermediates'], estimatedHours: 13, weightage: 9 },
          { id: 'chem_11_09', name: 'Hydrocarbons', topics: ['Alkanes, Alkenes and Alkynes', 'Markovnikov’s Rule', 'Aromaticity & Benzene Electrophilic Substitution'], estimatedHours: 12, weightage: 8 },
        ],
      },
      {
        subjectId: 'mathematics',
        subjectName: 'Mathematics',
        chapters: [
          { id: 'math_11_01', name: 'Sets', topics: ['Representation of Sets', 'Subsets and Power Set', 'Venn Diagrams and Set Operations'], estimatedHours: 7, weightage: 5 },
          { id: 'math_11_02', name: 'Relations and Functions', topics: ['Cartesian Product', 'Domain and Range', 'Polynomial, Rational, Modulus and Signum Functions'], estimatedHours: 8, weightage: 6 },
          { id: 'math_11_03', name: 'Trigonometric Functions', topics: ['Angles in Radians & Degrees', 'Trigonometric Identities and Formulas', 'General Solutions'], estimatedHours: 13, weightage: 10 },
          { id: 'math_11_04', name: 'Complex Numbers and Quadratic Equations', topics: ['Algebra of Complex Numbers', 'Modulus and Conjugate', 'Argand Plane'], estimatedHours: 8, weightage: 5 },
          { id: 'math_11_05', name: 'Linear Inequalities', topics: ['Algebraic Solutions of Linear Inequalities in One Variable', 'Graphical Solutions in Two Variables'], estimatedHours: 6, weightage: 4 },
          { id: 'math_11_06', name: 'Permutations and Combinations', topics: ['Fundamental Principle of Counting', 'nPr and nCr Formulas and Applications'], estimatedHours: 9, weightage: 7 },
          { id: 'math_11_07', name: 'Binomial Theorem', topics: ['Binomial Theorem for Positive Integral Index', 'General and Middle Terms'], estimatedHours: 7, weightage: 5 },
          { id: 'math_11_08', name: 'Sequences and Series', topics: ['Arithmetic and Geometric Progressions', 'General Term and Sum of n Terms of GP'], estimatedHours: 9, weightage: 7 },
          { id: 'math_11_09', name: 'Straight Lines', topics: ['Slope of a Line', 'Various Forms of Equations of a Line', 'Distance of a Point from a Line'], estimatedHours: 9, weightage: 7 },
          { id: 'math_11_10', name: 'Conic Sections', topics: ['Circles, Parabola, Ellipse, Hyperbola Equations and Properties'], estimatedHours: 10, weightage: 8 },
          { id: 'math_11_11', name: 'Introduction to 3D Geometry', topics: ['Coordinate Axes and Planes', 'Distance Formula in 3D', 'Section Formula in 3D'], estimatedHours: 6, weightage: 4 },
          { id: 'math_11_12', name: 'Limits and Derivatives', topics: ['Intuitive Idea of Limits', 'Standard Limits Formulas', 'Derivatives of Polynomial and Trigonometric Functions'], estimatedHours: 12, weightage: 9 },
          { id: 'math_11_13', name: 'Statistics', topics: ['Measures of Dispersion', 'Mean Deviation', 'Variance and Standard Deviation'], estimatedHours: 7, weightage: 5 },
          { id: 'math_11_14', name: 'Probability', topics: ['Events and Axiomatic Approach to Probability'], estimatedHours: 7, weightage: 5 },
        ],
      },
      {
        subjectId: 'biology',
        subjectName: 'Biology',
        chapters: [
          { id: 'bio_11_01', name: 'The Living World', topics: ['Characteristics of Living Organisms', 'Binomial Nomenclature', 'Taxonomic Categories'], estimatedHours: 5, weightage: 4 },
          { id: 'bio_11_02', name: 'Biological Classification', topics: ['Five Kingdom Classification', 'Monera, Protista, Fungi', 'Viruses, Viroids, Lichens'], estimatedHours: 8, weightage: 6 },
          { id: 'bio_11_03', name: 'Plant Kingdom', topics: ['Algae, Bryophytes, Pteridophytes, Gymnosperms, Angiosperms', 'Alternation of Generations'], estimatedHours: 9, weightage: 6 },
          { id: 'bio_11_04', name: 'Animal Kingdom', topics: ['Non-chordates (Porifera to Echinodermata)', 'Chordates Classification and Characters'], estimatedHours: 11, weightage: 8 },
          { id: 'bio_11_05', name: 'Morphology of Flowering Plants', topics: ['Root, Stem, Leaf Modifications', 'Inflorescence, Flower, Fruit and Seed'], estimatedHours: 9, weightage: 6 },
          { id: 'bio_11_06', name: 'Anatomy of Flowering Plants', topics: ['Meristematic and Permanent Tissues', 'Internal Structure of Dicot and Monocot Root, Stem, Leaf'], estimatedHours: 8, weightage: 5 },
          { id: 'bio_11_07', name: 'Structural Organisation in Animals', topics: ['Animal Tissues Types', 'Morphology and Anatomy of Frog'], estimatedHours: 7, weightage: 4 },
          { id: 'bio_11_08', name: 'Cell: The Unit of Life', topics: ['Prokaryotic and Eukaryotic Cells', 'Cell Organelles Structure and Function'], estimatedHours: 10, weightage: 7 },
          { id: 'bio_11_09', name: 'Biomolecules', topics: ['Proteins, Carbohydrates, Lipids, Nucleic Acids', 'Enzymes and Factors Affecting Enzyme Activity'], estimatedHours: 9, weightage: 6 },
          { id: 'bio_11_10', name: 'Cell Cycle and Cell Division', topics: ['Interphase', 'Mitosis and Meiosis Stages', 'Significance of Cell Division'], estimatedHours: 8, weightage: 6 },
          { id: 'bio_11_11', name: 'Photosynthesis in Higher Plants', topics: ['Light Reaction', 'Calvin Cycle and C4 Pathway', 'Factors Affecting Photosynthesis'], estimatedHours: 10, weightage: 7 },
          { id: 'bio_11_12', name: 'Respiration in Plants', topics: ['Glycolysis', 'Krebs Cycle and Electron Transport System', 'Respiratory Quotient'], estimatedHours: 9, weightage: 6 },
          { id: 'bio_11_13', name: 'Plant Growth and Development', topics: ['Phases of Growth', 'Plant Growth Regulators (Auxin, GA, Cytokinin, ABA, Ethylene)'], estimatedHours: 7, weightage: 5 },
          { id: 'bio_11_14', name: 'Breathing and Exchange of Gases', topics: ['Respiratory Volumes and Capacities', 'Exchange and Transport of Gases', 'Regulation of Respiration'], estimatedHours: 8, weightage: 5 },
          { id: 'bio_11_15', name: 'Body Fluids and Circulation', topics: ['Blood and Lymph', 'Human Circulatory System and Cardiac Cycle', 'ECG and Disorders'], estimatedHours: 9, weightage: 6 },
          { id: 'bio_11_16', name: 'Excretory Products and their Elimination', topics: ['Urine Formation and Counter Current Mechanism', 'Regulation of Kidney Function'], estimatedHours: 8, weightage: 5 },
          { id: 'bio_11_17', name: 'Locomotion and Movement', topics: ['Types of Movement', 'Mechanism of Muscle Contraction', 'Skeletal System and Joints'], estimatedHours: 8, weightage: 5 },
          { id: 'bio_11_18', name: 'Neural Control and Coordination', topics: ['Structure of Neuron', 'Nerve Impulse Conduction', 'Central and Peripheral Nervous System'], estimatedHours: 8, weightage: 5 },
          { id: 'bio_11_19', name: 'Chemical Coordination and Integration', topics: ['Endocrine Glands and Hormones', 'Mechanism of Hormone Action'], estimatedHours: 8, weightage: 5 },
        ],
      },
      {
        subjectId: 'english_core',
        subjectName: 'English Core',
        chapters: [
          { id: 'engc_11_01', name: 'The Portrait of a Lady & A Photograph', topics: ['Grandmother Characterisation', 'Nostalgia and Transience of Life'], estimatedHours: 5, weightage: 5 },
          { id: 'engc_11_02', name: 'We’re Not Afraid to Die', topics: ['Courage and Teamwork Under Crisis', 'Maritime Vocabulary & Themes'], estimatedHours: 6, weightage: 6 },
          { id: 'engc_11_03', name: 'Discovering Tut: The Saga Continues', topics: ['Forensic Archaeology', 'History of Ancient Egypt'], estimatedHours: 6, weightage: 6 },
          { id: 'engc_11_04', name: 'The Summer of the Beautiful White Horse', topics: ['Garoghlanian Tribe Integrity', 'Childhood Innocence Themes'], estimatedHours: 5, weightage: 5 },
          { id: 'engc_11_05', name: 'The Address & Mother’s Day', topics: ['War Trauma and Memory', 'Family Roles and Gender Dynamics'], estimatedHours: 6, weightage: 6 },
          { id: 'engc_11_06', name: 'Writing Skills & Grammar', topics: ['Poster Making', 'Speech and Debate Writing', 'Tenses and Clauses'], estimatedHours: 10, weightage: 14 },
        ],
      },
    ],
  },
};

/**
 * Returns available subjects for any class and board.
 */
export function getSubjectsForClassAndBoard(classNumber: ClassNumber, board: BoardType, stream?: string) {
  if (classNumber <= 8) {
    return [
      { id: 'science', name: 'Science', color: '#10b981', code: '086' },
      { id: 'mathematics', name: 'Mathematics', color: '#6366f1', code: '041' },
      { id: 'social_science', name: 'Social Science', color: '#f59e0b', code: '087' },
      { id: 'english', name: 'English', color: '#3b82f6', code: '184' },
      { id: 'hindi', name: 'Hindi', color: '#ec4899', code: '002' },
    ];
  }

  if (classNumber <= 10) {
    return [
      { id: 'mathematics', name: 'Mathematics', color: '#6366f1', code: '041', isCore: true },
      { id: 'science', name: 'Science', color: '#10b981', code: '086', isCore: true },
      { id: 'social_science', name: 'Social Science', color: '#f59e0b', code: '087', isCore: true },
      { id: 'english', name: 'English Language & Lit', color: '#3b82f6', code: '184', isCore: true },
      { id: 'hindi', name: 'Hindi Course-A', color: '#ec4899', code: '002' },
      { id: 'information_tech', name: 'Information Technology', color: '#8b5cf6', code: '402' },
    ];
  }

  // Class 11 & 12
  if (stream === 'commerce') {
    return [
      { id: 'accountancy', name: 'Accountancy', color: '#0ea5e9', code: '055', isCore: true },
      { id: 'business_studies', name: 'Business Studies', color: '#f97316', code: '054', isCore: true },
      { id: 'economics', name: 'Economics', color: '#14b8a6', code: '030', isCore: true },
      { id: 'english_core', name: 'English Core', color: '#3b82f6', code: '301', isCore: true },
      { id: 'mathematics', name: 'Applied Mathematics', color: '#6366f1', code: '241' },
      { id: 'physical_education', name: 'Physical Education', color: '#eab308', code: '048' },
    ];
  }

  if (stream === 'arts') {
    return [
      { id: 'history', name: 'History', color: '#d97706', code: '027', isCore: true },
      { id: 'political_science', name: 'Political Science', color: '#2563eb', code: '028', isCore: true },
      { id: 'geography', name: 'Geography', color: '#059669', code: '029', isCore: true },
      { id: 'english_core', name: 'English Core', color: '#3b82f6', code: '301', isCore: true },
      { id: 'economics', name: 'Economics', color: '#14b8a6', code: '030' },
      { id: 'psychology', name: 'Psychology', color: '#ec4899', code: '037' },
    ];
  }

  if (stream === 'science-pcb') {
    return [
      { id: 'physics', name: 'Physics', color: '#6366f1', code: '042', isCore: true },
      { id: 'chemistry', name: 'Chemistry', color: '#ec4899', code: '043', isCore: true },
      { id: 'biology', name: 'Biology', color: '#10b981', code: '044', isCore: true },
      { id: 'english_core', name: 'English Core', color: '#3b82f6', code: '301', isCore: true },
      { id: 'physical_education', name: 'Physical Education', color: '#eab308', code: '048' },
    ];
  }

  // Default Science PCM or PCMB
  return [
    { id: 'physics', name: 'Physics', color: '#6366f1', code: '042', isCore: true },
    { id: 'chemistry', name: 'Chemistry', color: '#ec4899', code: '043', isCore: true },
    { id: 'mathematics', name: 'Mathematics', color: '#3b82f6', code: '041', isCore: true },
    { id: 'english_core', name: 'English Core', color: '#8b5cf6', code: '301', isCore: true },
    { id: 'computer_science', name: 'Computer Science', color: '#06b6d4', code: '083' },
    { id: 'biology', name: 'Biology', color: '#10b981', code: '044' },
    { id: 'physical_education', name: 'Physical Education', color: '#eab308', code: '048' },
  ];
}

/**
 * Fetches syllabus template from Firestore, or defaults to canonical template and seeds it.
 */
export async function getOrSeedSyllabusTemplate(
  board: BoardType,
  classNumber: ClassNumber
): Promise<SyllabusTemplateDocument> {
  const templateId = `${board.toLowerCase().replace(/\s+/g, '_')}_class_${classNumber}`;
  const docRef = doc(db, 'syllabus_templates', templateId);

  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as SyllabusTemplateDocument;
    }
  } catch (error) {
    console.warn('Could not read syllabus_template from Firestore, fallback to canonical template', error);
  }

  // Fallback to canonical dataset matching class
  const fallbackKey =
    classNumber === 11 ? 'cbse_class_11' : classNumber === 12 ? 'cbse_class_12' : 'cbse_class_10';
  const canonical = CANONICAL_SYLLABUS_TEMPLATES[fallbackKey] || CANONICAL_SYLLABUS_TEMPLATES['cbse_class_10'];

  const templateToSave: SyllabusTemplateDocument = {
    ...canonical,
    id: templateId,
    board,
    classNumber,
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
 * Copies selected syllabus template chapters into user's chapter_progress structure.
 */
export function buildInitialChapterProgressList(
  template: SyllabusTemplateDocument,
  selectedSubjectIds: string[],
  initialProgressMap?: Record<string, { status: ChapterStatusType; confidence: ConfidenceLevel }>
): ChapterProgress[] {
  const result: ChapterProgress[] = [];
  let orderCounter = 0;

  for (const subject of template.subjects) {
    if (selectedSubjectIds.length > 0 && !selectedSubjectIds.includes(subject.subjectId)) {
      continue;
    }

    for (const chapter of subject.chapters) {
      const userCustom = initialProgressMap?.[chapter.id];
      const status: ChapterStatusType = userCustom?.status || 'Never Started';
      const confidence: ConfidenceLevel = userCustom?.confidence || 3;
      const completionPercentage =
        status === 'Completed' ? 100 : status === 'Started' ? 40 : status === 'Need Revision' ? 70 : 0;

      result.push({
        id: chapter.id,
        chapterId: chapter.id,
        chapterName: chapter.name,
        subjectId: subject.subjectId,
        subjectName: subject.subjectName,
        status,
        confidence,
        lastStudied: status !== 'Never Started' ? new Date().toISOString() : null,
        studyMinutes: status === 'Completed' ? 180 : status === 'Started' ? 60 : 0,
        questionSolved: status === 'Completed' ? 25 : status === 'Started' ? 8 : 0,
        revisionCount: status === 'Completed' ? 1 : 0,
        completionPercentage,
        topics: chapter.topics,
        orderIndex: orderCounter++,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  return result;
}
