import { SmartQuestion } from '@/types/question-generator';

export const COMPREHENSIVE_QUESTION_BANK: SmartQuestion[] = [
  // ==========================================
  // PHYSICS: Electric Charges and Fields
  // ==========================================
  {
    id: 'phys_q1',
    subject: 'Physics',
    chapter: 'Electric Charges and Fields',
    topic: "Coulomb's Law & Dielectric Medium",
    type: 'MCQ',
    difficulty: 'Easy',
    question:
      'Two point charges +3 μC and +8 μC repel each other with a force of 40 N. If a charge of -5 μC is added to each of them, the force between them will become:',
    options: ['-10 N (attractive)', '+10 N (repulsive)', '-20 N (attractive)', '+20 N (repulsive)'],
    correctAnswer: '-10 N (attractive)',
    correctOptionIndex: 0,
    source: 'board-pattern',
    yearOrTag: 'CBSE 2022 Term 1',
    explanation: {
      correctSolution:
        'New charges are q1\' = 3 - 5 = -2 μC and q2\' = 8 - 5 = +3 μC. Initial product q1*q2 = 24. New product q1\'*q2\' = (-2)*(+3) = -6. Since distance r is constant, F\' / F = (q1\'*q2\') / (q1*q2) = -6 / 24 = -1/4. Thus F\' = 40 * (-1/4) = -10 N (attractive).',
      stepByStep: [
        'Calculate new charges after adding -5 μC: q1\' = -2 μC, q2\' = +3 μC',
        'State Coulomb\'s Law proportionality: F ∝ q1*q2 when distance r is unchanged',
        'Find ratio: F\' / F = [(-2)(3)] / [(3)(8)] = -6 / 24 = -1/4',
        'Multiply initial force 40 N by (-1/4) = -10 N. The negative sign denotes attraction.'
      ],
      commonMistake: 'Students often forget that the sign of the charges determines attraction versus repulsion and simply calculate magnitudes.',
      formulaUsed: {
        name: "Coulomb's Law",
        equation: 'F = (1 / 4πε₀) · (|q₁q₂| / r²)',
        variables: 'F = electrostatic force (N), q₁, q₂ = charges (C), r = distance (m), ε₀ = permittivity of free space'
      },
      ncertReference: {
        textbookTitle: 'NCERT Physics Class 12 Part 1',
        chapter: 'Electric Charges and Fields',
        section: '1.6 Coulomb’s Law',
        page: 11
      },
      difficultyLevel: 'Easy'
    }
  },
  {
    id: 'phys_q2',
    subject: 'Physics',
    chapter: 'Electric Charges and Fields',
    topic: "Gauss's Law & Flux",
    type: 'Assertion Reason',
    difficulty: 'Medium',
    question:
      'Given below are two statements labeled as Assertion (A) and Reason (R).\n\nAssertion (A): Electric flux through a closed Gaussian surface enclosing no net charge is always zero.\nReason (R): The electric field at any point on the Gaussian surface enclosing zero net charge must be zero.',
    assertion: 'Electric flux through a closed Gaussian surface enclosing no net charge is always zero.',
    reason: 'The electric field at any point on the Gaussian surface enclosing zero net charge must be zero.',
    options: [
      'Both (A) and (R) are true and (R) is the correct explanation of (A).',
      'Both (A) and (R) are true but (R) is NOT the correct explanation of (A).',
      '(A) is true but (R) is false.',
      '(A) is false but (R) is true.'
    ],
    correctAnswer: '(A) is true but (R) is false.',
    correctOptionIndex: 2,
    source: 'assertion-reason',
    yearOrTag: 'CBSE Sample Paper 2024',
    explanation: {
      correctSolution:
        'By Gauss’s Law, ∮ E · dA = q_enclosed / ε₀. If q_enclosed = 0, the total flux is zero (Assertion is True). However, external charges outside the surface can produce an electric field E on the surface points even if total flux is zero (Reason is False).',
      stepByStep: [
        'Recall Gauss’s theorem formula: Φ = ∮ E · dA = Q_in / ε₀.',
        'Evaluate Assertion: If Q_in = 0, Φ = 0 is unconditionally true.',
        'Evaluate Reason: If an electric dipole or an external charge exists outside the sphere, E ≠ 0 everywhere on the sphere boundary, yet incoming flux equals outgoing flux.',
        'Conclude: Assertion is true, but Reason is false.'
      ],
      commonMistake: 'Confusing net flux (integral over entire closed surface) with local electric field at a point.',
      formulaUsed: {
        name: "Gauss's Theorem",
        equation: 'Φ_E = ∮ E · dA = q_enclosed / ε₀',
        variables: 'Φ_E = electric flux, E = electric field vector, dA = area vector, q_enclosed = net enclosed charge'
      },
      ncertReference: {
        textbookTitle: 'NCERT Physics Class 12 Part 1',
        chapter: 'Electric Charges and Fields',
        section: '1.14 Gauss’s Law',
        page: 33
      },
      difficultyLevel: 'Medium'
    }
  },
  {
    id: 'phys_q3',
    subject: 'Physics',
    chapter: 'Current Electricity',
    topic: 'Drift Velocity & Mobility',
    type: 'Numerical',
    difficulty: 'Medium',
    question:
      'A copper wire of cross-sectional area 1.0 × 10⁻⁷ m² carries a current of 1.5 A. Assuming conduction electron density n = 8.5 × 10²⁸ m⁻³ and electron charge e = 1.6 × 10⁻¹⁹ C, calculate the drift velocity of electrons in mm/s (round to two decimal places).',
    correctAnswer: '1.10',
    numericalTolerance: 0.05,
    numericalUnit: 'mm/s',
    source: 'ncert-pattern',
    yearOrTag: 'NCERT In-text & CBSE 2020',
    explanation: {
      correctSolution:
        'I = n·A·e·v_d => v_d = I / (n·A·e). Substituting values: v_d = 1.5 / (8.5 × 10²⁸ × 1.0 × 10⁻⁷ × 1.6 × 10⁻¹⁹) = 1.5 / 1.36 × 10³ = 1.10 × 10⁻³ m/s = 1.10 mm/s.',
      stepByStep: [
        'Write the fundamental current relation: I = n A e v_d',
        'Rearrange for drift speed: v_d = I / (n A e)',
        'Compute denominator: 8.5 × 10²⁸ × 1.0 × 10⁻⁷ × 1.6 × 10⁻¹⁹ = 1360 C/m',
        'Divide 1.5 / 1360 = 0.0011029 m/s',
        'Convert to mm/s: 1.10 mm/s'
      ],
      commonMistake: 'Students often forget unit conversion between meters per second (m/s) and millimeters per second (mm/s).',
      formulaUsed: {
        name: 'Drift Velocity Equation',
        equation: 'v_d = I / (n · A · e)',
        variables: 'v_d = drift velocity (m/s), I = electric current (A), n = free electron density (m⁻³), A = area (m²), e = elementary charge (C)'
      },
      ncertReference: {
        textbookTitle: 'NCERT Physics Class 12 Part 1',
        chapter: 'Current Electricity',
        section: '3.4 Drift of Electrons and the Origin of Resistivity',
        page: 97
      },
      difficultyLevel: 'Medium'
    }
  },
  {
    id: 'phys_q4',
    subject: 'Physics',
    chapter: 'Ray Optics and Optical Instruments',
    topic: 'Lens Maker Formula',
    type: 'Competency Based',
    difficulty: 'Hard',
    question:
      'An equiconvex glass lens of refractive index μ_g = 1.5 has focal length f in air. If this lens is completely immersed in a liquid of refractive index μ_l = 1.6, which statement describes the optical behavior and new focal length f\' of the lens?',
    options: [
      'It acts as a diverging (concave) lens with focal length -8f',
      'It acts as a converging (convex) lens with focal length +4f',
      'It acts as a diverging (concave) lens with focal length -4f',
      'It becomes a plane glass plate with infinite focal length'
    ],
    correctAnswer: 'It acts as a diverging (concave) lens with focal length -8f',
    correctOptionIndex: 0,
    source: 'competency-pattern',
    yearOrTag: 'CBSE Competency 2024 & HOTS',
    competencySkill: 'Analytical Modeling & Real-world Optics',
    explanation: {
      correctSolution:
        'Lens Maker\'s formula: 1/f = (μ_lens / μ_med - 1)(1/R1 - 1/R2). In air: 1/f = (1.5 - 1)(2/R) = 0.5(2/R) = 1/R, so R = f. In liquid: 1/f\' = (1.5 / 1.6 - 1)(2/R) = ((15 - 16)/16)(2/f) = (-1/16)(2/f) = -1 / (8f). Thus f\' = -8f. Because f\' is negative, the convex lens behaves as a diverging (concave) lens.',
      stepByStep: [
        'Apply Lens Maker formula in air: 1/f = (1.5 - 1)(2/R) = 1/R => R = f',
        'Apply Lens Maker formula in medium: 1/f\' = (μ_g / μ_l - 1)(2/R)',
        'Substitute μ_g = 1.5, μ_l = 1.6: (1.5 / 1.6 - 1) = (15/16 - 1) = -1/16',
        '1/f\' = (-1/16) * (2/f) = -1 / (8f)',
        'Invert: f\' = -8f. Negative focal length indicates diverging behavior.'
      ],
      commonMistake: 'Overlooking that when the surrounding refractive index exceeds that of the lens material (μ_medium > μ_lens), the nature of the lens reverses (convex becomes concave).',
      formulaUsed: {
        name: "Lens Maker's Formula",
        equation: '1/f = ( (μ₂ / μ₁) - 1 ) · (1/R₁ - 1/R₂)',
        variables: 'f = focal length, μ₂ = refractive index of lens material, μ₁ = refractive index of medium, R₁, R₂ = radii of curvature'
      },
      ncertReference: {
        textbookTitle: 'NCERT Physics Class 12 Part 2',
        chapter: 'Ray Optics and Optical Instruments',
        section: '9.5 Refraction at Spherical Surfaces and by Lenses',
        page: 326
      },
      difficultyLevel: 'Hard'
    }
  },
  {
    id: 'phys_q5',
    subject: 'Physics',
    chapter: 'Electromagnetic Induction & Alternating Current',
    topic: 'Series LCR Resonance',
    type: 'HOTS',
    difficulty: 'Hard',
    question:
      'In a series L-C-R circuit with L = 0.12 H, C = 480 nF, and R = 23 Ω, connected to a 230 V variable frequency AC supply: At the resonant angular frequency ω₀, what is the Q-factor (quality factor) of the circuit (round to 1 decimal)?',
    correctAnswer: '21.7',
    numericalTolerance: 0.5,
    numericalUnit: 'dimensionless',
    source: 'ncert-pattern',
    yearOrTag: 'NCERT Exemplar Class 12',
    explanation: {
      correctSolution:
        'Resonant frequency ω₀ = 1 / √(LC) = 1 / √(0.12 × 480 × 10⁻⁹) = 1 / √(5.76 × 10⁻⁸) = 1 / (2.4 × 10⁻⁴) = 4166.7 rad/s. Q = (ω₀ · L) / R = (4166.7 × 0.12) / 23 = 500 / 23 ≈ 21.74 ≈ 21.7.',
      stepByStep: [
        'Calculate LC product: L · C = 0.12 × 480 × 10⁻⁹ = 5.76 × 10⁻⁸ s²',
        'Find ω₀ = 1 / √(5.76 × 10⁻⁸) = 1 / (2.4 × 10⁻⁴) = 4166.67 rad/s',
        'Recall Q-factor formula: Q = (ω₀ · L) / R or (1/R)√(L/C)',
        'Calculate: Q = (4166.67 × 0.12) / 23 = 500 / 23 = 21.74'
      ],
      commonMistake: 'Mixing up angular frequency ω₀ (rad/s) with ordinary frequency ν₀ (Hz = ω₀ / 2π).',
      formulaUsed: {
        name: 'Quality Factor (Q-Factor) of Series LCR',
        equation: 'Q = (1 / R) · √(L / C) = (ω₀ · L) / R',
        variables: 'Q = quality factor (sharpness of resonance), R = resistance (Ω), L = inductance (H), C = capacitance (F)'
      },
      ncertReference: {
        textbookTitle: 'NCERT Physics Class 12 Part 1',
        chapter: 'Alternating Current',
        section: '7.6 Power in AC Circuit: The Power Factor',
        page: 249
      },
      difficultyLevel: 'Hard'
    }
  },
  {
    id: 'phys_q6',
    subject: 'Physics',
    chapter: 'Semiconductor Electronics',
    topic: 'p-n Junction Diode',
    type: 'Fill in the Blanks',
    difficulty: 'Easy',
    question:
      'Under forward bias condition of a p-n junction diode, the width of the depletion layer ________ (increases/decreases/remains unchanged) and the barrier height ________ (increases/decreases).',
    correctAnswer: 'decreases, decreases',
    source: 'board-pattern',
    yearOrTag: 'CBSE 2023 All India',
    explanation: {
      correctSolution:
        'In forward bias, the applied positive potential opposes the built-in electric field, which pushes majority carriers across the junction. Therefore, the width of the depletion layer decreases and the potential barrier height decreases.',
      stepByStep: [
        'Identify battery polarities: p-side connected to positive terminal, n-side connected to negative terminal.',
        'Direction of applied field is opposite to the junction built-in barrier field.',
        'Resulting net barrier voltage V_net = V_0 - V.',
        'Depletion region width shrinks and barrier height decreases.'
      ],
      commonMistake: 'Confusing reverse bias with forward bias effects on depletion width.',
      formulaUsed: {
        name: 'Barrier Potential Reduction',
        equation: 'V_barrier_net = V₀ - V_applied',
        variables: 'V₀ = barrier potential at equilibrium, V_applied = forward bias voltage'
      },
      ncertReference: {
        textbookTitle: 'NCERT Physics Class 12 Part 2',
        chapter: 'Semiconductor Electronics: Materials, Devices and Simple Circuits',
        section: '14.6 Semiconductor Diode',
        page: 479
      },
      difficultyLevel: 'Easy'
    }
  },

  // ==========================================
  // CHEMISTRY: Solutions & Electrochemistry & Organics
  // ==========================================
  {
    id: 'chem_q1',
    subject: 'Chemistry',
    chapter: 'Electrochemistry',
    topic: 'Nernst Equation & Cell Potential',
    type: 'Numerical',
    difficulty: 'Medium',
    question:
      'Calculate the cell potential E_cell at 298 K for the Daniel cell: Zn(s) | Zn²⁺(0.01 M) || Cu²⁺(1.0 M) | Cu(s). Given standard reduction potentials E°(Zn²⁺/Zn) = -0.76 V and E°(Cu²⁺/Cu) = +0.34 V. (Use 2.303 RT/F = 0.059 V, round to 2 decimal places).',
    correctAnswer: '1.16',
    numericalTolerance: 0.02,
    numericalUnit: 'V',
    source: 'ncert-pattern',
    yearOrTag: 'NCERT Solved Example 3.1 & CBSE 2023',
    explanation: {
      correctSolution:
        'Standard emf E°_cell = E°_cathode - E°_anode = 0.34 - (-0.76) = 1.10 V. The cell reaction is Zn + Cu²⁺ -> Zn²⁺ + Cu (n = 2 electrons). By Nernst Equation: E_cell = E°_cell - (0.059 / 2) * log10([Zn²⁺] / [Cu²⁺]) = 1.10 - 0.0295 * log10(0.01 / 1.0) = 1.10 - 0.0295 * (-2) = 1.10 + 0.059 = 1.159 V ≈ 1.16 V.',
      stepByStep: [
        'Calculate standard cell potential: E°_cell = +0.34 - (-0.76) = +1.10 V',
        'Identify number of transferred electrons: n = 2',
        'Set up reaction quotient Q: Q = [Zn²⁺] / [Cu²⁺] = 0.01 / 1.0 = 10⁻²',
        'Evaluate log10(Q) = log10(10⁻²) = -2',
        'Apply Nernst correction: -(0.059 / 2) * (-2) = +0.059 V',
        'Final E_cell = 1.10 + 0.059 = 1.159 V ≈ 1.16 V'
      ],
      commonMistake: 'Students frequently make a sign error with log(10^-2) = -2, subtracting instead of adding the correction term.',
      formulaUsed: {
        name: 'Nernst Equation at 298 K',
        equation: 'E_cell = E°_cell - (0.0591 / n) · log₁₀( [Anode Ion] / [Cathode Ion] )',
        variables: 'E_cell = cell EMF, E°_cell = standard EMF, n = number of moles of electrons transferred'
      },
      ncertReference: {
        textbookTitle: 'NCERT Chemistry Class 12 Part 1',
        chapter: 'Electrochemistry',
        section: '3.3 Nernst Equation',
        page: 70
      },
      difficultyLevel: 'Medium'
    }
  },
  {
    id: 'chem_q2',
    subject: 'Chemistry',
    chapter: 'Solutions',
    topic: "Raoult's Law & Colligative Properties",
    type: 'MCQ',
    difficulty: 'Easy',
    question:
      'Which of the following aqueous solutions will exhibit the highest boiling point elevation at 1 atm pressure?',
    options: ['0.1 M NaCl', '0.1 M BaCl₂', '0.1 M Glucose', '0.1 M Urea'],
    correctAnswer: '0.1 M BaCl₂',
    correctOptionIndex: 1,
    source: 'board-pattern',
    yearOrTag: 'CBSE 2022 Term 1',
    explanation: {
      correctSolution:
        'Elevation in boiling point ΔTb = i * Kb * m. For 0.1 M solutions, ΔTb is directly proportional to van\'t Hoff factor i. For BaCl₂ -> Ba²⁺ + 2Cl⁻, i = 3. For NaCl -> Na⁺ + Cl⁻, i = 2. For non-electrolytes Glucose and Urea, i = 1. Hence 0.1 M BaCl₂ has the highest i (i = 3) and highest boiling point elevation.',
      stepByStep: [
        'Recall colligative formula: ΔTb = i · Kb · m',
        'Determine van’t Hoff factor i for each solute:',
        'Glucose: i = 1 (does not dissociate)',
        'Urea: i = 1 (does not dissociate)',
        'NaCl: i = 2 (dissociates into Na⁺ and Cl⁻)',
        'BaCl₂: i = 3 (dissociates into Ba²⁺ and 2 Cl⁻)',
        'Greatest i produces the highest elevation in boiling point.'
      ],
      commonMistake: 'Ignoring the van\'t Hoff factor and assuming all 0.1 M solutions have the exact same boiling point.',
      formulaUsed: {
        name: 'Boiling Point Elevation with van’t Hoff Factor',
        equation: 'ΔT_b = i · K_b · m',
        variables: 'ΔT_b = elevation in boiling point (K), i = van’t Hoff factor, K_b = molal elevation constant, m = molality (mol/kg)'
      },
      ncertReference: {
        textbookTitle: 'NCERT Chemistry Class 12 Part 1',
        chapter: 'Solutions',
        section: '2.6.2 Elevation of Boiling Point',
        page: 50
      },
      difficultyLevel: 'Easy'
    }
  },
  {
    id: 'chem_q3',
    subject: 'Chemistry',
    chapter: 'Chemical Kinetics',
    topic: 'Arrhenius Equation & Activation Energy',
    type: 'Short Answer',
    difficulty: 'Medium',
    question:
      'Explain why the rate of a chemical reaction generally doubles for every 10 °C rise in temperature, even though the average kinetic energy of molecules increases by only about 3%.',
    correctAnswer: 'Exponential increase in fraction of molecules possessing energy ≥ Activation Energy (Ea)',
    source: 'board-pattern',
    yearOrTag: 'CBSE Delhi 2023 (2 Marks)',
    keyRubric: [
      'Mention Arrhenius fraction of molecules e^(-Ea / RT)',
      'Explain that 10 K temperature rise significantly shifts the Maxwell-Boltzmann energy distribution curve to the right',
      'Conclude that the area under the curve representing molecules having kinetic energy greater than or equal to threshold energy (Ea) nearly doubles'
    ],
    explanation: {
      correctSolution:
        'According to the Arrhenius equation and collision theory, the rate depends on the fraction of molecules with kinetic energy equal to or greater than activation energy, given by f = e^(-Ea / RT). A 10 °C increase shifts the peak of the Maxwell-Boltzmann distribution curve slightly rightward and flattens it, but substantially increases the area under the curve beyond the activation energy barrier, effectively doubling the number of effective collisions per second.',
      stepByStep: [
        'Distinguish total collision frequency from effective collision frequency.',
        'Average kinetic energy is proportional to absolute temperature T (~300 K to 310 K is a ~3.3% increase).',
        'However, the Boltzmann factor e^(-Ea/RT) is exponential with respect to temperature.',
        'Thus, the fraction of molecules having energy ≥ Ea approximately doubles, doubling the overall reaction rate.'
      ],
      commonMistake: 'Saying collision frequency doubles; collision frequency increases by only ~1.5%, whereas the fraction of energetic molecules doubles.',
      formulaUsed: {
        name: 'Arrhenius Equation',
        equation: 'k = A · e^(-E_a / RT)',
        variables: 'k = rate constant, A = frequency factor, E_a = activation energy (J/mol), R = gas constant, T = absolute temperature (K)'
      },
      ncertReference: {
        textbookTitle: 'NCERT Chemistry Class 12 Part 1',
        chapter: 'Chemical Kinetics',
        section: '4.5 Temperature Dependence of the Rate of a Reaction',
        page: 112
      },
      difficultyLevel: 'Medium'
    }
  },
  {
    id: 'chem_q4',
    subject: 'Chemistry',
    chapter: 'Aldehydes, Ketones and Carboxylic Acids',
    topic: 'Named Reactions & Organic Conversions',
    type: 'Match the Following',
    difficulty: 'Medium',
    question:
      'Match the organic reaction in Column I with its appropriate reagent/product in Column II:',
    matchingPairs: [
      { id: 'm1', left: 'Rosenmund Reduction', right: 'Acyl chloride + H₂ / Pd-BaSO₄ -> Aldehyde' },
      { id: 'm2', left: 'Etard Reaction', right: 'Toluene + CrO₂Cl₂ / CS₂ -> Benzaldehyde' },
      { id: 'm3', left: 'Cannizzaro Reaction', right: 'Formaldehyde + 50% conc. NaOH' },
      { id: 'm4', left: 'Clemmensen Reduction', right: 'Carbonyl + Zn-Hg / conc. HCl -> Hydrocarbon' }
    ],
    correctAnswer: 'Rosenmund: H2/Pd-BaSO4 | Etard: CrO2Cl2 | Cannizzaro: 50% NaOH | Clemmensen: Zn-Hg/HCl',
    source: 'ncert-pattern',
    yearOrTag: 'CBSE 2024 Blueprint',
    explanation: {
      correctSolution:
        'Rosenmund reduction converts acid chlorides into aldehydes using H₂ gas poisoned over Pd-BaSO₄. Etard reaction oxidizes toluene to benzaldehyde using chromyl chloride (CrO₂Cl₂). Cannizzaro reaction is disproportionation of aldehydes lacking alpha-hydrogens using concentrated alkali. Clemmensen reduction deoxygenates carbonyl groups using zinc amalgam and concentrated hydrochloric acid.',
      stepByStep: [
        'Rosenmund: R-COCl + H₂ --(Pd/BaSO₄)--> R-CHO + HCl',
        'Etard: Ar-CH₃ + CrO₂Cl₂ --(CS₂)--> Chromium complex --(H₃O⁺)--> Ar-CHO',
        'Cannizzaro: 2 HCHO + conc. NaOH -> HCOONa + CH₃OH',
        'Clemmensen: >C=O + 4[H] --(Zn-Hg/HCl)--> >CH₂ + H₂O'
      ],
      commonMistake: 'Confusing Clemmensen reduction (Zn-Hg / HCl, acidic) with Wolff-Kishner reduction (NH₂NH₂ / KOH, basic).',
      formulaUsed: {
        name: 'Named Reaction Reagents Guide',
        equation: '>C=O + Zn-Hg / HCl -> >CH₂ + H₂O',
        variables: 'Acyl chlorides, Carbonyls, Benzylic methyls'
      },
      ncertReference: {
        textbookTitle: 'NCERT Chemistry Class 12 Part 2',
        chapter: 'Aldehydes, Ketones and Carboxylic Acids',
        section: '12.2 Preparation of Aldehydes and Ketones',
        page: 360
      },
      difficultyLevel: 'Medium'
    }
  },
  {
    id: 'chem_q5',
    subject: 'Chemistry',
    chapter: 'Coordination Compounds',
    topic: 'Crystal Field Theory & Magnetic Moment',
    type: 'Case Based',
    difficulty: 'Hard',
    question:
      'Case Study: Crystal Field Theory (CFT) considers the interaction between metal ions and ligands as purely electrostatic. In an octahedral complex [CoF₆]³⁻, fluoride (F⁻) is a weak field ligand (Δ_oct < P), whereas in [Co(NH₃)₆]³⁺, ammonia (NH₃) acts as a strong field ligand (Δ_oct > P).\n\nQuestion: What is the electronic configuration of the d-electrons and the spin-only magnetic moment of [CoF₆]³⁻ in Bohr Magnetons (BM)?',
    casePassage:
      'Crystal Field Theory (CFT) considers the metal-ligand bond as ionic arising from electrostatic interactions. Strong field ligands produce large splitting Δ_oct exceeding pairing energy P, leading to low-spin paired complexes (t2g⁶ eg⁰). Weak field ligands produce small splitting Δ_oct less than P, leading to high-spin complexes (t2g⁴ eg²).',
    options: [
      't₂g⁴ e_g², with μ = √24 BM (≈ 4.90 BM)',
      't₂g⁶ e_g⁰, with μ = 0 BM (diamagnetic)',
      't₂g⁵ e_g¹, with μ = √8 BM (≈ 2.83 BM)',
      't₂g³ e_g³, with μ = √35 BM (≈ 5.92 BM)'
    ],
    correctAnswer: 't₂g⁴ e_g², with μ = √24 BM (≈ 4.90 BM)',
    correctOptionIndex: 0,
    source: 'case-study',
    yearOrTag: 'CBSE Case Study Question 2023',
    explanation: {
      correctSolution:
        'In [CoF₆]³⁻, Co is in +3 oxidation state (Co³⁺: [Ar] 3d⁶). Because F⁻ is a weak field ligand, Δ_oct < P (pairing energy is not overcome). The electrons follow Hund’s rule: 3 electrons enter t₂g, next 2 enter e_g, and the 6th electron pairs in t₂g, yielding t₂g⁴ e_g². There are n = 4 unpaired electrons. Spin-only magnetic moment μ = √(n(n+2)) = √(4(6)) = √24 ≈ 4.90 BM (paramagnetic high spin).',
      stepByStep: [
        'Determine oxidation state of Co in [CoF₆]³⁻: x + 6(-1) = -3 => x = +3',
        'Electronic configuration of Co³⁺ (atomic number 27 - 3) = [Ar] 3d⁶',
        'Analyze ligand strength: F⁻ is a weak field ligand, so Δ_oct < P (no pairing before filling eg)',
        'Fill d-orbitals according to Hund’s rule: t₂g⁴ e_g²',
        'Count unpaired electrons: 2 in t₂g + 2 in eg = 4 unpaired electrons',
        'Compute magnetic moment: μ = √(4 × 6) = √24 ≈ 4.90 BM'
      ],
      commonMistake: 'Assuming Co³⁺ complexes are always diamagnetic low spin regardless of whether the ligand is weak or strong.',
      formulaUsed: {
        name: 'Spin-Only Magnetic Moment Formula',
        equation: 'μ = √( n · (n + 2) ) BM',
        variables: 'μ = magnetic moment in Bohr Magnetons (BM), n = number of unpaired electrons'
      },
      ncertReference: {
        textbookTitle: 'NCERT Chemistry Class 12 Part 1',
        chapter: 'Coordination Compounds',
        section: '9.5 Bonding in Coordination Compounds (CFT)',
        page: 253
      },
      difficultyLevel: 'Hard'
    }
  },

  // ==========================================
  // MATHEMATICS: Calculus, Vectors, 3D & Matrices
  // ==========================================
  {
    id: 'math_q1',
    subject: 'Mathematics',
    chapter: 'Matrices & Determinants',
    topic: 'Adjoint & Inverse Properties',
    type: 'MCQ',
    difficulty: 'Easy',
    question:
      'If A is a square matrix of order 3 × 3 such that |A| = 4, then the determinant of its adjoint matrix, |adj(A)|, is equal to:',
    options: ['4', '16', '64', '12'],
    correctAnswer: '16',
    correctOptionIndex: 1,
    source: 'board-pattern',
    yearOrTag: 'CBSE 2023 Set 1',
    explanation: {
      correctSolution:
        'For an n × n square matrix A, |adj(A)| = |A|^(n - 1). Here n = 3 and |A| = 4. Therefore, |adj(A)| = 4^(3 - 1) = 4² = 16.',
      stepByStep: [
        'Recall fundamental determinant property: A · adj(A) = |A| · I',
        'Taking determinant on both sides: |A| · |adj(A)| = ||A| · I| = |A|^n',
        'Divide by |A|: |adj(A)| = |A|^(n - 1)',
        'Substitute n = 3 and |A| = 4: |adj(A)| = 4^(3 - 1) = 4² = 16'
      ],
      commonMistake: 'Confusing |adj(A)| = |A|^(n-1) with |k A| = k^n |A| or computing 4^3 = 64.',
      formulaUsed: {
        name: 'Determinant of Adjoint Theorem',
        equation: '|adj(A)| = |A|^(n - 1)',
        variables: 'A = square matrix, n = order of matrix (3), |A| = determinant'
      },
      ncertReference: {
        textbookTitle: 'NCERT Mathematics Class 12 Part 1',
        chapter: 'Determinants',
        section: '4.5 Adjoint and Inverse of a Matrix',
        page: 125
      },
      difficultyLevel: 'Easy'
    }
  },
  {
    id: 'math_q2',
    subject: 'Mathematics',
    chapter: 'Integrals',
    topic: 'Definite Integrals Properties',
    type: 'MCQ',
    difficulty: 'Medium',
    question:
      'Evaluate the definite integral: I = ∫ (from 0 to π/2) [ √(sin x) / (√(sin x) + √(cos x)) ] dx.',
    options: ['π', 'π/2', 'π/4', '0'],
    correctAnswer: 'π/4',
    correctOptionIndex: 2,
    source: 'ncert-pattern',
    yearOrTag: 'NCERT Class 12 Standard Property (King’s Rule)',
    explanation: {
      correctSolution:
        'Let I = ∫₀^(π/2) [√sin(x) / (√sin(x) + √cos(x))] dx. By King\'s property ∫₀^a f(x) dx = ∫₀^a f(a - x) dx, replacing x by π/2 - x gives I = ∫₀^(π/2) [√cos(x) / (√cos(x) + √sin(x))] dx. Adding the two equations: 2I = ∫₀^(π/2) 1 dx = [x]₀^(π/2) = π/2. Therefore I = π/4.',
      stepByStep: [
        'Define I = ∫₀^(π/2) [√sin x / (√sin x + √cos x)] dx  ---- (1)',
        'Apply property: ∫₀^a f(x) dx = ∫₀^a f(a - x) dx',
        'sin(π/2 - x) = cos x and cos(π/2 - x) = sin x',
        'Rewrite integral: I = ∫₀^(π/2) [√cos x / (√cos x + √sin x)] dx ---- (2)',
        'Add equations (1) and (2): 2I = ∫₀^(π/2) [(√sin x + √cos x) / (√sin x + √cos x)] dx = ∫₀^(π/2) 1 dx = π/2',
        'Solve for I: I = π/4'
      ],
      commonMistake: 'Forgetting to divide by 2 at the final step, erroneously answering π/2.',
      formulaUsed: {
        name: "King's Definite Integral Property",
        equation: '∫₀^a f(x) dx = ∫₀^a f(a - x) dx',
        variables: 'f(x) = integrable function, a = upper limit of integration'
      },
      ncertReference: {
        textbookTitle: 'NCERT Mathematics Class 12 Part 2',
        chapter: 'Integrals',
        section: '7.11 Some Properties of Definite Integrals',
        page: 341
      },
      difficultyLevel: 'Medium'
    }
  },
  {
    id: 'math_q3',
    subject: 'Mathematics',
    chapter: 'Vectors & 3D Geometry',
    topic: 'Shortest Distance Between Skew Lines',
    type: 'Long Answer',
    difficulty: 'Hard',
    question:
      'Find the shortest distance between the skew lines:\nLine 1: r = (i + 2j + k) + λ (i - j + k)\nLine 2: r = (2i - j - k) + μ (2i + j + 2k).',
    correctAnswer: '3 / √2 ≈ 2.12 units',
    source: 'board-pattern',
    yearOrTag: 'CBSE All India 2023 (5 Marks)',
    keyRubric: [
      'Identify a₁ = i + 2j + k, b₁ = i - j + k, a₂ = 2i - j - k, b₂ = 2i + j + 2k',
      'Compute vector difference: a₂ - a₁ = i - 3j - 2k',
      'Compute cross product b₁ × b₂ = |i j k; 1 -1 1; 2 1 2| = -3i + 0j + 3k',
      'Evaluate magnitude |b₁ × b₂| = √((-3)² + 3²) = 3√2',
      'Evaluate dot product (a₂ - a₁) · (b₁ × b₂) = (1)(-3) + (-3)(0) + (-2)(3) = -9',
      'Apply formula d = |(a₂ - a₁) · (b₁ × b₂)| / |b₁ × b₂| = |-9| / (3√2) = 9 / (3√2) = 3 / √2 units'
    ],
    explanation: {
      correctSolution:
        'Line 1 passes through a₁ = (1, 2, 1) along direction b₁ = (1, -1, 1). Line 2 passes through a₂ = (2, -1, -1) along direction b₂ = (2, 1, 2). The vector (a₂ - a₁) = (1, -3, -2). The cross product b₁ × b₂ = i(-2 - 1) - j(2 - 2) + k(1 + 2) = -3i + 3k. The magnitude |b₁ × b₂| = √(9 + 9) = √18 = 3√2. Dot product (a₂ - a₁) · (b₁ × b₂) = 1(-3) + (-3)(0) + (-2)(3) = -3 - 6 = -9. Shortest distance d = |-9| / (3√2) = 3 / √2 = (3√2) / 2 units.',
      stepByStep: [
        'Identify points and vectors from line equations: a₁ = (1, 2, 1), a₂ = (2, -1, -1), b₁ = (1, -1, 1), b₂ = (2, 1, 2)',
        'Find displacement vector: a₂ - a₁ = (2 - 1)i + (-1 - 2)j + (-1 - 1)k = i - 3j - 2k',
        'Calculate normal vector via cross product: b₁ × b₂ = -3i + 0j + 3k',
        'Compute magnitude |b₁ × b₂| = √((-3)² + 0² + 3²) = √18 = 3√2',
        'Take dot product: (i - 3j - 2k) · (-3i + 0j + 3k) = -3 + 0 - 6 = -9',
        'Shortest distance d = |-9| / (3√2) = 3 / √2 units'
      ],
      commonMistake: 'Calculation errors in the cross product determinant, especially signs in the j component.',
      formulaUsed: {
        name: 'Shortest Distance Between Two Skew Lines',
        equation: 'd = | (a₂ - a₁) · (b₁ × b₂) | / | b₁ × b₂ |',
        variables: 'a₁, a₂ = position vectors on lines; b₁, b₂ = parallel direction vectors'
      },
      ncertReference: {
        textbookTitle: 'NCERT Mathematics Class 12 Part 2',
        chapter: 'Three Dimensional Geometry',
        section: '11.5 Shortest Distance Between Two Lines',
        page: 473
      },
      difficultyLevel: 'Hard'
    }
  },
  {
    id: 'math_q4',
    subject: 'Mathematics',
    chapter: 'Probability',
    topic: "Bayes' Theorem",
    type: 'Competency Based',
    difficulty: 'Hard',
    question:
      'In a factory, machine A produces 60% of daily output and machine B produces 40%. Past records show that 2% of items produced by machine A are defective and 1% of items produced by machine B are defective. If an item is drawn at random from daily output and found to be defective, what is the probability that it was manufactured by machine A?',
    options: ['3/4 (75%)', '2/3 (66.7%)', '4/5 (80%)', '5/7 (71.4%)'],
    correctAnswer: '3/4 (75%)',
    correctOptionIndex: 0,
    source: 'competency-pattern',
    yearOrTag: 'CBSE Competency Exemplar 2024',
    competencySkill: 'Bayesian Inference & Quality Assurance',
    explanation: {
      correctSolution:
        'Let E₁ = produced by machine A, E₂ = produced by machine B, D = item is defective. P(E₁) = 0.60, P(E₂) = 0.40. P(D|E₁) = 0.02, P(D|E₂) = 0.01. By Bayes\' Theorem: P(E₁|D) = [P(E₁) * P(D|E₁)] / [P(E₁) * P(D|E₁) + P(E₂) * P(D|E₂)] = [0.60 * 0.02] / [0.60 * 0.02 + 0.40 * 0.01] = 0.012 / (0.012 + 0.004) = 0.012 / 0.016 = 12 / 16 = 3/4 = 0.75.',
      stepByStep: [
        'Define events: E₁ (from A), E₂ (from B), D (defective item)',
        'State prior probabilities: P(E₁) = 0.6, P(E₂) = 0.4',
        'State likelihoods: P(D|E₁) = 0.02, P(D|E₂) = 0.01',
        'Total probability of defective item: P(D) = (0.6 × 0.02) + (0.4 × 0.01) = 0.012 + 0.004 = 0.016',
        'Posterior probability: P(E₁|D) = (0.6 × 0.02) / 0.016 = 0.012 / 0.016 = 3 / 4'
      ],
      commonMistake: 'Directly taking P(E1) * P(D|E1) without normalizing by the total probability denominator P(D).',
      formulaUsed: {
        name: "Bayes' Theorem",
        equation: 'P(E₁|A) = [ P(E₁) · P(A|E₁) ] / [ ∑ P(Eᵢ) · P(A|Eᵢ) ]',
        variables: 'P(E₁|A) = posterior probability, P(Eᵢ) = prior probabilities, P(A|Eᵢ) = likelihoods'
      },
      ncertReference: {
        textbookTitle: 'NCERT Mathematics Class 12 Part 2',
        chapter: 'Probability',
        section: '13.5 Bayes’ Theorem',
        page: 544
      },
      difficultyLevel: 'Hard'
    }
  },
  {
    id: 'math_q5',
    subject: 'Mathematics',
    chapter: 'Continuity and Differentiability',
    topic: 'Logarithmic Differentiation',
    type: 'True False',
    difficulty: 'Easy',
    question:
      'Statement: If y = x^x for x > 0, then dy/dx = x^x · (1 + ln x). State whether this is True or False.',
    options: ['True', 'False'],
    correctAnswer: 'True',
    correctOptionIndex: 0,
    source: 'ncert-pattern',
    yearOrTag: 'NCERT Standard Derivation',
    explanation: {
      correctSolution:
        'Taking natural logarithm on both sides: ln y = x ln x. Differentiating both sides with respect to x using product rule: (1/y)(dy/dx) = x(1/x) + (1)(ln x) = 1 + ln x. Multiplying by y: dy/dx = y(1 + ln x) = x^x(1 + ln x). Thus the statement is completely True.',
      stepByStep: [
        'Take natural log: ln(y) = ln(x^x) = x · ln(x)',
        'Differentiate implicitly: (1/y) · (dy/dx) = d/dx [x · ln(x)]',
        'Use product rule: x · (1/x) + 1 · ln(x) = 1 + ln(x)',
        'Isolate derivative: dy/dx = y · (1 + ln(x)) = x^x · (1 + ln(x))'
      ],
      commonMistake: 'Incorrectly applying the power rule d/dx(x^n) = n x^(n-1) to variable exponents, giving x · x^(x-1) = x^x.',
      formulaUsed: {
        name: 'Logarithmic Differentiation Rule',
        equation: 'd/dx [ u(x)^v(x) ] = u(x)^v(x) · [ v\'(x)·ln(u(x)) + (v(x)·u\'(x))/u(x) ]',
        variables: 'u(x) = base function, v(x) = exponent function'
      },
      ncertReference: {
        textbookTitle: 'NCERT Mathematics Class 12 Part 1',
        chapter: 'Continuity and Differentiability',
        section: '5.5 Logarithmic Differentiation',
        page: 174
      },
      difficultyLevel: 'Easy'
    }
  },
  {
    id: 'phys_q7',
    subject: 'Physics',
    chapter: 'Moving Charges and Magnetism',
    topic: 'Biot-Savart Law & Circular Coil',
    type: 'MCQ',
    difficulty: 'Medium',
    question:
      'A circular coil of wire consisting of 100 turns, each of radius 8.0 cm carries a current of 0.40 A. What is the magnitude of the magnetic field B at the center of the coil? (Take μ₀ = 4π × 10⁻⁷ T m/A)',
    options: ['3.14 × 10⁻⁴ T', '6.28 × 10⁻⁴ T', '1.57 × 10⁻⁴ T', '3.14 × 10⁻⁵ T'],
    correctAnswer: '3.14 × 10⁻⁴ T',
    correctOptionIndex: 0,
    source: 'ncert-pattern',
    yearOrTag: 'NCERT Example 4.6 & CBSE 2021',
    explanation: {
      correctSolution:
        'Magnetic field at the center of a circular coil of N turns is B = (μ₀ · N · I) / (2 · R). Here N = 100, I = 0.40 A, R = 8.0 cm = 0.08 m. B = (4π × 10⁻⁷ × 100 × 0.40) / (2 × 0.08) = (16π × 10⁻⁵) / 0.16 = 100π × 10⁻⁵ = π × 10⁻⁴ T ≈ 3.14 × 10⁻⁴ T.',
      stepByStep: [
        'Recall center magnetic field formula: B = (μ₀ N I) / (2 R)',
        'Convert units: R = 8 cm = 0.08 m',
        'Substitute values: B = (4π × 10⁻⁷ × 100 × 0.40) / (2 × 0.08)',
        'Simplify numerator: 16π × 10⁻⁵',
        'Divide by denominator 0.16: B = 100π × 10⁻⁵ = 3.14 × 10⁻⁴ T'
      ],
      commonMistake: 'Forgetting to convert the radius from centimeters to meters in the denominator.',
      formulaUsed: {
        name: 'Magnetic Field at Center of Circular Loop',
        equation: 'B = (μ₀ · N · I) / (2 · R)',
        variables: 'B = magnetic field (Tesla), μ₀ = 4π × 10⁻⁷, N = turns, I = current (A), R = radius (m)'
      },
      ncertReference: {
        textbookTitle: 'NCERT Physics Class 12 Part 1',
        chapter: 'Moving Charges and Magnetism',
        section: '4.6 Magnetic Field on the Axis of a Circular Current Loop',
        page: 146
      },
      difficultyLevel: 'Medium'
    }
  },
  {
    id: 'chem_q6',
    subject: 'Chemistry',
    chapter: 'Haloalkanes and Haloarenes',
    topic: 'SN1 vs SN2 Mechanisms',
    type: 'Competency Based',
    difficulty: 'Medium',
    question:
      'Which of the following haloalkanes undergoes nucleophilic substitution primarily via an SN1 mechanism with optical inversion and retention (racemisation)?',
    options: ['(CH₃)₃C-Br (tert-butyl bromide)', 'CH₃-CH₂-Br (ethyl bromide)', 'CH₃-Br (methyl bromide)', 'CH₃-CH₂-CH₂-Cl (1-chloropropane)'],
    correctAnswer: '(CH₃)₃C-Br (tert-butyl bromide)',
    correctOptionIndex: 0,
    source: 'competency-pattern',
    yearOrTag: 'CBSE Competency Board Question',
    competencySkill: 'Reaction Mechanism Deduction',
    explanation: {
      correctSolution:
        'SN1 mechanism proceeds via a flat, carbocation intermediate. Tertiary alkyl halides like (CH₃)₃C-Br form the highly stable tertiary carbocation (stabilized by 9 hyperconjugative alpha-hydrogens and +I effect), making them react predominantly through SN1.',
      stepByStep: [
        'Identify mechanism: SN1 rate = k[R-X], rate determining step is carbocation formation.',
        'Evaluate stability order of carbocations: 3° > 2° > 1° > methyl.',
        '(CH₃)₃C-Br forms a 3° carbocation, which is extremely stable.',
        'Nucleophile can attack the planar carbocation from either face, yielding racemisation.'
      ],
      commonMistake: 'Confusing 3° alkyl halide preference (SN1) with 1° alkyl halide preference (SN2 due to low steric hindrance).',
      formulaUsed: {
        name: 'Carbocation Hyperconjugative Stability',
        equation: 'Stability: 3° (9 α-H) > 2° (6 α-H) > 1° (3 α-H)',
        variables: 'Alpha-hydrogens, inductive effect, steric hindrance'
      },
      ncertReference: {
        textbookTitle: 'NCERT Chemistry Class 12 Part 2',
        chapter: 'Haloalkanes and Haloarenes',
        section: '10.4 Reactions of Haloalkanes',
        page: 300
      },
      difficultyLevel: 'Medium'
    }
  }
];


