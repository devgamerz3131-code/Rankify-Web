import { FormulaItem } from '@/types/formula';

export const FORMULA_LIBRARY_DATA: FormulaItem[] = [
  // ==========================================
  // 1. PHYSICS: Drift Velocity & Current
  // ==========================================
  {
    id: 'phys_drift_velocity_current',
    name: 'Electric Current & Drift Velocity Relation',
    subject: 'Physics',
    chapter: 'Current Electricity',
    topic: 'Microscopic Conduction & Ohm’s Law',
    formulaType: 'Fundamental Law',
    latex: 'I = n \\cdot e \\cdot A \\cdot v_d',
    textDisplay: 'I = n · e · A · vd',
    dimensions: '[I] = [A], [vd] = [L T⁻¹]',
    primaryUnit: 'Amperes (A)',
    variables: [
      { symbol: 'I', name: 'Electric Current', meaning: 'Rate of flow of charge across cross-section', siUnit: 'A (Amperes)' },
      { symbol: 'n', name: 'Electron Number Density', meaning: 'Number of free conduction electrons per unit volume', siUnit: 'm⁻³' },
      { symbol: 'e', name: 'Elementary Charge', meaning: 'Magnitude of electron charge', siUnit: 'C (1.602 × 10⁻¹⁹ C)', isConstant: true, constantValue: '1.602 × 10⁻¹⁹ C' },
      { symbol: 'A', name: 'Cross-Sectional Area', meaning: 'Area normal to current flow', siUnit: 'm²' },
      { symbol: 'v_d', name: 'Drift Velocity', meaning: 'Average net speed acquired by electrons under electric field', siUnit: 'm/s (typical ~10⁻⁴ m/s)' },
    ],
    conditions: [
      'Steady current flowing through a uniform conductor.',
      'Electric field is uniform throughout the conductor volume.',
      'Free electron model assumes random thermal collisions with lattice ions.',
    ],
    applications: [
      'Derivation of Ohm’s law in microscopic vector form (j = σE).',
      'Calculating electron drift velocity in household wires and semiconductors.',
      'Analyzing Hall effect and carrier mobility in materials science.',
    ],
    difficulty: 'Medium',
    importance: 'Critical Board',
    simpleExplanation:
      'Imagine a water pipe: total water emerging per second equals the water density times the pipe cross-section times the forward flow speed. Here, electrons are the water droplets crawling forward at drift velocity vd while carrying charge e.',
    detailedExplanation:
      'In a conductor without an electric field, free electrons move randomly with high thermal speeds (~10⁵ m/s) with zero net directional displacement. When an external potential difference V is applied across length L, an internal field E = V/L exerts a force F = -eE, giving acceleration a = -eE/m. Between successive ionic collisions separated by relaxation time τ, the average drift speed acquired is vd = (eEτ)/m.',
    realLifeExample:
      'When you toggle a wall switch, the light bulb glows almost instantaneously because the electric field travels at ~3 × 10⁸ m/s, even though individual electrons drift slower than a garden snail (~0.1 mm/s)!',
    whenToUse: [
      'When calculating current, carrier density, or cross-sectional area from drift speed.',
      'When deducing microscopic Ohm’s law or explaining wire heating effects.',
      'When comparing drift speeds in wires of varying diameters connected in series or parallel.',
    ],
    whenNotToUse: [
      'Do NOT use thermal velocity (~10⁵ m/s) in place of drift velocity vd (~10⁻⁴ m/s).',
      'Do NOT assume drift velocity increases if only the wire radius is altered while current I is held constant.',
    ],
    commonConfusion: [
      'Confusing electron thermal speed (10⁵ m/s, random directions, zero net current) with drift velocity (10⁻⁴ m/s, unidirectional drift opposite to E).',
      'Forgetting that current I is scalar, whereas current density j = I/A = n e vd is a true vector.',
    ],
    derivation: {
      title: 'Derivation of I = n A e vd from First Principles',
      assumptions: [
        'Conductor has uniform cross-sectional area A and length L.',
        'Free electron density n is constant throughout the conductor.',
        'All free electrons drift with uniform average velocity vd.',
      ],
      steps: [
        {
          stepNumber: 1,
          title: 'Volume of Conductor Segment',
          latexExpression: 'V_{vol} = A \\cdot L',
          conceptualReason: 'Consider a cylindrical slice of wire of length L and cross-section A.',
          boardTip: 'Draw a neat cylindrical diagram with length L and cross-section A.',
        },
        {
          stepNumber: 2,
          title: 'Total Free Electrons in Segment',
          latexExpression: 'N = n \\cdot V_{vol} = n \\cdot A \\cdot L',
          conceptualReason: 'By definition of number density n (electrons per m³), total electrons N is density times volume.',
          boardTip: 'State clearly that n is the number density of free conduction electrons.',
        },
        {
          stepNumber: 3,
          title: 'Total Mobile Charge in Segment',
          latexExpression: 'Q = N \\cdot e = (n A L) \\cdot e',
          conceptualReason: 'Each electron carries elementary charge e = 1.6 × 10⁻¹⁹ C.',
        },
        {
          stepNumber: 4,
          title: 'Time Taken by Electrons to Traverse Length L',
          latexExpression: 't = \\frac{L}{v_d}',
          conceptualReason: 'Since electrons drift with average speed vd, distance L is covered in time t = L/vd.',
        },
        {
          stepNumber: 5,
          title: 'Electric Current Definition & Final Result',
          latexExpression: 'I = \\frac{Q}{t} = \\frac{n A L e}{L / v_d} = n A e v_d',
          conceptualReason: 'L cancels out cleanly, showing current depends only on microscopic parameters and cross-sectional area.',
          boardTip: 'Conclude with j = I/A = n e vd for 3 full marks.',
        },
      ],
      finalResult: 'I = n · e · A · vd (or in vector form: j = n · e · vd)',
      boardMarks: 3,
    },
    memoryBooster: {
      mnemonic: 'I Need An Egg Very Delicious (I = n A e vd)',
      shortcut: 'vd = I / (n e A) -> Area is in denominator, so thin wire = fast drift!',
      visualMemoryTrick: 'Picture a garden hose nozzle: narrowing the nozzle (smaller A) forces the electrons to spray out faster (higher vd) for the same water flow (I).',
      storyMethod: 'A train station crowd (conductor) has millions of passengers (electrons). The ticket counter opens (voltage), causing the whole crowd to slowly shuffle through the gate (vd) while the bell rings instantly across the hall.',
      patternRecognition: 'Whenever a question mentions "electron density n" and "drift velocity", immediately link to I = n A e vd.',
    },
    relatedQuestions: [
      {
        id: 'q_phys_1_1',
        type: 'pyq',
        source: 'CBSE 2024 (3 Marks)',
        question: 'A copper wire of cross-sectional area 1.0 × 10⁻⁷ m² carries a current of 1.5 A. Assuming free electron density n = 8.5 × 10²⁸ m⁻³, calculate the drift speed of electrons.',
        givenData: 'A = 10⁻⁷ m², I = 1.5 A, n = 8.5 × 10²⁸ m⁻³, e = 1.6 × 10⁻¹⁹ C',
        formulaToApply: 'vd = I / (n · e · A)',
        solutionSummary: 'vd = 1.5 / (8.5 × 10²⁸ × 1.6 × 10⁻¹⁹ × 10⁻⁷) = 1.5 / 1.36 × 10³ = 1.10 × 10⁻³ m/s.',
        answerValue: '1.10 × 10⁻³ m/s (~1.1 mm/s)',
      },
    ],
    practiceExercises: [
      {
        id: 'prac_phys_1_1',
        type: 'formula_selection',
        difficulty: 'Easy',
        question: 'Which formula directly relates macroscopic electric current I with microscopic current density j?',
        options: ['j = I · A', 'j = I / A', 'j = A / I', 'j = I · v_d'],
        correctOption: 'j = I / A',
        correctAnswer: 'j = I / A',
        explanation: 'Current density is current per unit cross-sectional area (j = I/A = n e vd).',
        trapWarning: 'Never multiply I by A; current density is a ratio with units A/m².',
      },
      {
        id: 'prac_phys_1_2',
        type: 'error_finding',
        difficulty: 'Medium',
        question: 'Identify the error in this student’s exam step: "When the radius of a wire carrying constant current I is doubled, vd doubles because vd ∝ r²."',
        correctAnswer: 'vd becomes one-fourth (vd/4), not doubled!',
        explanation: 'Since I = n A e vd and A = πr², for constant current I: vd = I / (n π r² e) ∝ 1/r². Doubling r quadruples area A and reduces vd to vd/4.',
        trapWarning: 'Do not confuse constant voltage V (where E = V/L remains constant so vd remains constant) with constant current I!',
      },
    ],
    visualType: 'drift_velocity',
  },

  // ==========================================
  // 2. CHEMISTRY: Nernst Equation
  // ==========================================
  {
    id: 'chem_nernst_equation',
    name: 'Nernst Equation for Electrochemical Cell EMF',
    subject: 'Chemistry',
    chapter: 'Electrochemistry',
    topic: 'Electrode Potentials & Non-Standard Conditions',
    formulaType: 'Working Equation',
    latex: 'E_{cell} = E^\\circ_{cell} - \\frac{0.0591}{n} \\log_{10} Q',
    textDisplay: 'Ecell = E°cell - (0.0591 / n) · log10(Q)',
    dimensions: '[E] = [M L² T⁻³ A⁻¹]',
    primaryUnit: 'Volts (V)',
    variables: [
      { symbol: 'E_{cell}', name: 'Cell Potential (EMF)', meaning: 'Actual electrical potential under current non-standard concentrations', siUnit: 'V (Volts)' },
      { symbol: 'E^\\circ_{cell}', name: 'Standard Cell Potential', meaning: 'EMF when all ions are at 1 M concentration at 298 K (E°cathode - E°anode)', siUnit: 'V (Volts)' },
      { symbol: 'n', name: 'Moles of Electrons', meaning: 'Net electrons transferred in balanced redox equation', siUnit: 'dimensionless integer' },
      { symbol: 'Q', name: 'Reaction Quotient', meaning: 'Ratio of product ion activities to reactant ion activities raised to stoichiometric powers', siUnit: 'dimensionless' },
      { symbol: 'T', name: 'Absolute Temperature', meaning: 'Standard state temperature', siUnit: '298.15 K', isConstant: true, constantValue: '298 K' },
    ],
    conditions: [
      'Temperature fixed at standard 298.15 K (25 °C).',
      'Concentrations of pure solids (metals) and pure liquids equal 1 (unit activity).',
      'Gas pressures must be substituted in bar or atmospheres.',
    ],
    applications: [
      'Determining actual voltage of batteries as they discharge.',
      'Calculating equilibrium constants: E°cell = (0.0591/n) log10(Kc).',
      'Predicting reaction spontaneity (ΔG = -n F Ecell < 0 for spontaneous discharge).',
    ],
    difficulty: 'Hard',
    importance: 'Critical Board',
    simpleExplanation:
      'As a battery runs, product ions pile up and reactant ions run out. The Nernst equation calculates the exact voltage remaining as the chemicals get depleted!',
    detailedExplanation:
      'Derived from thermodynamics: ΔG = ΔG° + RT ln Q. Since maximum electrical work done by the cell equals -ΔG = n F Ecell, dividing through by -nF yields Ecell = E°cell - (2.303 RT / nF) log10 Q. At 298.15 K, the term 2.303 RT / F evaluates to 0.05916 V.',
    realLifeExample:
      'Your smartphone battery registers 4.2 V when fresh, but drops to ~3.3 V as Lithium ion concentration gradients deplete during use, triggering the low power warning.',
    whenToUse: [
      'When calculating EMF of cells with non-1.0 M ion concentrations.',
      'When calculating equilibrium constant Kc using Ecell = 0 at dead equilibrium.',
      'When evaluating pH of unknown hydrogen half-cells.',
    ],
    whenNotToUse: [
      'Do NOT use 0.0591 if temperature T is explicitly stated as other than 298 K (use 2.303RT/nF instead).',
      'Do NOT include solid metal strips (e.g. Zn(s), Cu(s)) inside the Q expression.',
    ],
    commonConfusion: [
      'Writing E°cell = 0 at equilibrium: false! Ecell (actual EMF) becomes 0 when battery dies; E°cell is an intrinsic thermodynamic constant that never changes.',
      'Forgetting stoichiometric exponents in Q, e.g. for Fe(s) + 2H⁺(aq) → Fe²⁺ + H2(g), Q = [Fe²⁺] / [H⁺]².',
    ],
    derivation: {
      title: 'Thermodynamic Deduction of Nernst Equation',
      assumptions: [
        'Reversible thermodynamic conditions.',
        'Standard temperature T = 298.15 K.',
        'Unit activity for pure solids and solvents.',
      ],
      steps: [
        {
          stepNumber: 1,
          title: 'Van ’t Hoff Reaction Isotherm',
          latexExpression: '\\Delta G = \\Delta G^\\circ + R T \\ln Q',
          conceptualReason: 'Relates actual Gibbs free energy change to standard free energy change and reaction quotient Q.',
          boardTip: 'Start with the thermodynamic Gibbs isotherm.',
        },
        {
          stepNumber: 2,
          title: 'Electrical Work Conversion',
          latexExpression: '\\Delta G = -n F E_{cell}, \\quad \\Delta G^\\circ = -n F E^\\circ_{cell}',
          conceptualReason: 'Non-PV electrical work done by the cell equals the decrease in Gibbs free energy.',
        },
        {
          stepNumber: 3,
          title: 'Substitution into Isotherm',
          latexExpression: '-n F E_{cell} = -n F E^\\circ_{cell} + R T \\ln Q',
          conceptualReason: 'Equating electrical work terms with thermodynamic potential terms.',
        },
        {
          stepNumber: 4,
          title: 'Dividing by -nF and Natural-to-Base10 Log Conversion',
          latexExpression: 'E_{cell} = E^\\circ_{cell} - \\frac{2.303 R T}{n F} \\log_{10} Q',
          conceptualReason: 'Isolating Ecell and converting natural logarithm ln(Q) to decimal log10(Q).',
        },
        {
          stepNumber: 5,
          title: 'Evaluating Numerical Constants at 298 K',
          latexExpression: '\\frac{2.303 \\cdot (8.314) \\cdot (298.15)}{96487} = 0.05915 \\approx 0.0591',
          conceptualReason: 'R = 8.314 J/mol·K, F = 96487 C/mol, T = 298.15 K yields the universal 0.0591 V factor.',
          boardTip: 'Highlight the final 0.0591/n form in a box.',
        },
      ],
      finalResult: 'Ecell = E°cell - (0.0591 / n) · log10(Q)',
      boardMarks: 3,
    },
    memoryBooster: {
      mnemonic: 'Every Cell Needs Fuel (Ecell = E° - 0.0591/n log Q)',
      shortcut: 'Anode goes on top (Products), Cathode goes on bottom (Reactants) in Q!',
      visualMemoryTrick: 'LOAN: Left, Oxidation, Anode, Negative. Ions at the Anode dissolve into liquid, raising the numerator in log Q.',
      storyMethod: 'Zinc dissolves at the Anode table like sugar in tea, pouring Zn²⁺ into the numerator. Copper plates onto the Cathode fork, reducing denominator Cu²⁺. As numerator swells, log Q becomes positive, subtracting more voltage until Ecell hits zero!',
      patternRecognition: 'Whenever ion concentrations are given with decimals like 0.01 M or 10⁻³ M, immediately invoke the Nernst equation.',
    },
    relatedQuestions: [
      {
        id: 'q_chem_1_1',
        type: 'pyq',
        source: 'CBSE 2023 (3 Marks)',
        question: 'Calculate the EMF of the cell at 298 K: Mg(s) | Mg²⁺(0.1 M) || Cu²⁺(10⁻³ M) | Cu(s). Given E°(Mg²⁺/Mg) = -2.37 V, E°(Cu²⁺/Cu) = +0.34 V.',
        givenData: '[Mg²⁺] = 0.1 M, [Cu²⁺] = 10⁻³ M, E°cathode = +0.34 V, E°anode = -2.37 V, n = 2',
        formulaToApply: 'Ecell = E°cell - (0.0591/n) log10([Mg²⁺]/[Cu²⁺])',
        solutionSummary: 'E°cell = 0.34 - (-2.37) = 2.71 V. Ecell = 2.71 - (0.0591/2) log10(0.1 / 10⁻³) = 2.71 - 0.02955 log10(10²) = 2.71 - 0.0591 = 2.651 V.',
        answerValue: '2.651 V',
      },
    ],
    practiceExercises: [
      {
        id: 'prac_chem_1_1',
        type: 'error_finding',
        difficulty: 'Hard',
        question: 'Spot the fatal error in this calculation for reaction Cr(s) + 3Fe²⁺(aq) → 2Cr³⁺(aq) + 3Fe(s): "Student writes Q = [Cr³⁺] / [Fe²⁺] and n = 3."',
        correctAnswer: 'Both Q and n are incorrect! Balanced reaction is 2Cr + 3Fe²⁺ → 2Cr³⁺ + 3Fe; n = 6 and Q = [Cr³⁺]² / [Fe²⁺]³.',
        explanation: 'Electrons transferred: Cr loses 3e⁻ (2 × 3 = 6e⁻) and Fe²⁺ gains 2e⁻ (3 × 2 = 6e⁻), so n = 6. Stoichiometric powers require [Cr³⁺]² / [Fe²⁺]³.',
        trapWarning: 'Always balance the net electron exchange first to find true n!',
      },
    ],
    visualType: 'nernst_cell',
  },

  // ==========================================
  // 3. MATHEMATICS: Matrix Inversion
  // ==========================================
  {
    id: 'math_matrix_inverse_adjoint',
    name: 'Matrix Inversion via Adjoint Formula',
    subject: 'Mathematics',
    chapter: 'Determinants & Matrices',
    topic: 'Invertibility & Matrix Method for Linear Systems',
    formulaType: 'Working Equation',
    latex: 'A^{-1} = \\frac{1}{|A|} \\operatorname{adj}(A), \\quad \\text{where } |A| \\neq 0',
    textDisplay: 'A⁻¹ = (1 / |A|) · adj(A)  [|A| ≠ 0]',
    primaryUnit: 'Dimensionless Matrix Array',
    variables: [
      { symbol: 'A^{-1}', name: 'Inverse Matrix', meaning: 'Unique square matrix satisfying A · A⁻¹ = A⁻¹ · A = I', siUnit: 'dimensionless' },
      { symbol: '|A|', name: 'Determinant of A', meaning: 'Scalar numerical evaluation of square matrix A', siUnit: 'scalar' },
      { symbol: '\\operatorname{adj}(A)', name: 'Adjoint of A', meaning: 'Transpose of the cofactor matrix of A', siUnit: 'matrix' },
      { symbol: 'I', name: 'Identity Matrix', meaning: 'Diagonal identity matrix of order n', siUnit: 'matrix' },
    ],
    conditions: [
      'Matrix A must be a square matrix (n × n).',
      'Determinant |A| must be non-zero (|A| ≠ 0, i.e., non-singular). If |A| = 0, A⁻¹ does not exist.',
    ],
    applications: [
      'Solving 3-variable linear systems AX = B via X = A⁻¹ B (guaranteed 5-mark CBSE question).',
      'Computer graphics transformations, cryptography, and 3D rotational matrices.',
      'Evaluating matrix powers and Cayley-Hamilton characteristic equations.',
    ],
    difficulty: 'Medium',
    importance: 'Critical Board',
    simpleExplanation:
      'Just like dividing numbers (x = b / a = a⁻¹ b), matrix inversion lets you "divide" matrices! You calculate the key scalar |A| and the transpose cofactor matrix adj(A).',
    detailedExplanation:
      'Starting from the fundamental determinant expansion theorem: the sum of the products of elements of any row (or column) with their corresponding cofactors equals |A|, while with cofactors of any other row (or column) is zero. Thus, A · (adj A) = (adj A) · A = |A| · I. Dividing both sides by scalar |A| establishes A · [(1/|A|) adj A] = I.',
    realLifeExample:
      'GPS satellite receivers collect 4 signals and solve a 4×4 matrix inverse system to pinpoint your exact latitude, longitude, and elevation in real time.',
    whenToUse: [
      'When finding the inverse of a 2×2 or 3×3 square matrix.',
      'When solving systems of linear equations AX = B.',
      'When simplifying matrix equation relations like A² - 5A + 7I = 0 to find A⁻¹.',
    ],
    whenNotToUse: [
      'Do NOT attempt inversion on non-square matrices (e.g. 2×3 or 3×2).',
      'Do NOT compute A⁻¹ if |A| = 0 (singular matrix).',
    ],
    commonConfusion: [
      'Forgetting to TRANSPOSE the cofactor matrix! Adjoint is [Cij]ᵀ, not [Cij].',
      'Sign errors in cofactors where i+j is odd (e.g. C12, C21, C23, C32 have negative signs).',
    ],
    derivation: {
      title: 'Proof that A · adj(A) = |A| · I and Deduction of Inverse',
      assumptions: [
        'A is an n × n square matrix.',
        '|A| ≠ 0 (non-singular matrix).',
      ],
      steps: [
        {
          stepNumber: 1,
          title: 'Cofactor Expansion Property',
          latexExpression: '\\sum_{k=1}^n a_{ik} C_{jk} = \\begin{cases} |A| & \\text{if } i = j \\\\ 0 & \\text{if } i \\neq j \\end{cases}',
          conceptualReason: 'Elements multiplied by own cofactors give determinant |A|; by alien cofactors give 0.',
          boardTip: 'State the property of alien cofactors clearly.',
        },
        {
          stepNumber: 2,
          title: 'Definition of Adjoint Matrix',
          latexExpression: '\\operatorname{adj}(A) = [C_{ij}]^T = [C_{ji}]',
          conceptualReason: 'Adjoint is formed by replacing every element with its cofactor and transposing the resulting matrix.',
        },
        {
          stepNumber: 3,
          title: 'Matrix Product A · adj(A)',
          latexExpression: 'A \\cdot \\operatorname{adj}(A) = \\begin{bmatrix} |A| & 0 & 0 \\\\ 0 & |A| & 0 \\\\ 0 & 0 & |A| \\end{bmatrix} = |A| \\cdot I',
          conceptualReason: 'Off-diagonal entries are 0 (alien cofactors); diagonal entries are all |A|.',
        },
        {
          stepNumber: 4,
          title: 'Dividing by Scalar |A| and Final Deduction',
          latexExpression: 'A \\cdot \\left( \\frac{1}{|A|} \\operatorname{adj}(A) \\right) = I \\implies A^{-1} = \\frac{1}{|A|} \\operatorname{adj}(A)',
          conceptualReason: 'By definition of matrix inverse A · A⁻¹ = I, the bracketed term is uniquely A⁻¹.',
          boardTip: 'Conclude with condition |A| ≠ 0.',
        },
      ],
      finalResult: 'A⁻¹ = (1/|A|) · adj(A)',
      boardMarks: 3,
    },
    memoryBooster: {
      mnemonic: 'C-S-T-D (Cofactors, Signs, Transpose, Divide by |A|)',
      shortcut: 'For 2×2 matrix [a b; c d], swap diagonal elements (d, a) and negate off-diagonals (-b, -c), then divide by ad - bc!',
      visualMemoryTrick: 'Think of checkerboard signs: + - + / - + - / + - + overlaid on a tic-tac-toe grid.',
      storyMethod: 'Matrix A is a locked treasure chest. Its determinant |A| is the key number. If key ≠ 0, the Adjoint is the secret decoder map that opens the treasure X = A⁻¹B!',
      patternRecognition: 'Whenever solving 3 equations in 3 variables, rewrite immediately as AX = B, calculate |A|, and apply X = A⁻¹B.',
    },
    relatedQuestions: [
      {
        id: 'q_math_1_1',
        type: 'pyq',
        source: 'CBSE 2024 / 2023 (5 Marks)',
        question: 'Solve using matrix method: 2x + 3y + 3z = 5, x - 2y + z = -4, 3x - y - 2z = 3.',
        givenData: 'A = [[2,3,3],[1,-2,1],[3,-1,-2]], B = [5,-4,3]ᵀ',
        formulaToApply: 'X = A⁻¹ B = (1/|A|) · (adj A) · B',
        solutionSummary: '|A| = 40. Cofactors calculated and transposed into adj(A). Multiplying adj(A) by B gives [40, 80, -40]ᵀ. Dividing by 40 yields x = 1, y = 2, z = -1.',
        answerValue: 'x = 1, y = 2, z = -1',
      },
    ],
    practiceExercises: [
      {
        id: 'prac_math_1_1',
        type: 'formula_selection',
        difficulty: 'Easy',
        question: 'If A is a 3 × 3 matrix and |A| = 5, what is the value of |adj(A)|?',
        options: ['5', '25', '125', '1/5'],
        correctOption: '25',
        correctAnswer: '25',
        explanation: 'For an n × n matrix, |adj A| = |A|^(n - 1). Here n = 3, so |adj A| = |A|² = 5² = 25.',
        trapWarning: 'Do not multiply 3 × 5; the exponent is (n - 1) = 2!',
      },
    ],
    visualType: 'matrix_inverse',
  },

  // ==========================================
  // 4. PHYSICS: Lens Maker’s Formula
  // ==========================================
  {
    id: 'phys_lens_maker',
    name: 'Lens Maker’s Formula',
    subject: 'Physics',
    chapter: 'Ray Optics & Optical Instruments',
    topic: 'Refraction at Spherical Surfaces & Thin Lenses',
    formulaType: 'Working Equation',
    latex: '\\frac{1}{f} = \\left( \\frac{\\mu_2}{\\mu_1} - 1 \\right) \\left( \\frac{1}{R_1} - \\frac{1}{R_2} \\right)',
    textDisplay: '1/f = (μ2/μ1 - 1) · (1/R1 - 1/R2)',
    dimensions: '[f] = [L]',
    primaryUnit: 'Dioptres (D = m⁻¹)',
    variables: [
      { symbol: 'f', name: 'Focal Length', meaning: 'Focal length of thin lens in surrounding medium', siUnit: 'm (Meters)' },
      { symbol: '\\mu_2', name: 'Refractive Index of Lens Material', meaning: 'Index of glass/plastic (usually ~1.5 for crown glass)', siUnit: 'dimensionless' },
      { symbol: '\\mu_1', name: 'Refractive Index of Surrounding Medium', meaning: 'Index of medium (1.0 for air, 1.33 for water)', siUnit: 'dimensionless' },
      { symbol: 'R_1', name: 'Radius of Curvature of 1st Surface', meaning: 'Signed radius of first refracting surface', siUnit: 'm (Meters)' },
      { symbol: 'R_2', name: 'Radius of Curvature of 2nd Surface', meaning: 'Signed radius of second refracting surface', siUnit: 'm (Meters)' },
    ],
    conditions: [
      'Lens is thin (thickness t is negligible compared to R1 and R2).',
      'Aperture of the lens is small so paraxial ray approximations apply.',
      'Surrounding medium is identical on both sides of the lens.',
    ],
    applications: [
      'Designing spectacle lenses, camera objectives, and telescope eyepieces.',
      'Predicting focal length changes when a lens is immersed in water or high-index liquids.',
      'Explaining why a convex lens behaves as a diverging lens in a denser medium (μ1 > μ2).',
    ],
    difficulty: 'Hard',
    importance: 'Critical Board',
    simpleExplanation:
      'Optical manufacturers (lens makers) use this formula to grind glass into exact curvatures R1 and R2 to give glasses the exact power prescription a patient needs.',
    detailedExplanation:
      'Refraction occurs at two consecutive spherical interfaces. At the first surface: μ2/v1 - μ1/u = (μ2 - μ1)/R1. The real or virtual image formed at v1 acts as a virtual object for the second interface: μ1/v - μ2/v1 = (μ1 - μ2)/R2. Adding both equations eliminates intermediate distance v1, and setting u = ∞ yields the Thin Lens Maker equation.',
    realLifeExample:
      'When an eyeglass wearer opens their eyes underwater without goggles, vision is blurry because water has μ1 = 1.33, reducing (μ2/μ1 - 1) from 0.5 to ~0.12, causing focal length to increase fourfold!',
    whenToUse: [
      'When designing lens curvatures or calculating focal length in air vs water.',
      'When determining lens behavior when immersed in liquids of varying refractive indices.',
    ],
    whenNotToUse: [
      'Do NOT forget Cartesian sign conventions: for a biconvex lens, R1 > 0 and R2 < 0!',
    ],
    commonConfusion: [
      'Writing (1/R1 + 1/R2) instead of (1/R1 - 1/R2). Cartesian sign for biconvex makes 1/R1 - 1/(-R2) = 1/R1 + 1/R2.',
      'Forgetting the surrounding medium μ1: if immersed in water, μ2/μ1 = 1.5/1.33 = 1.125, NOT 1.5!',
    ],
    derivation: {
      title: 'Derivation of Lens Maker’s Formula for a Thin Convex Lens',
      assumptions: [
        'Lens is thin with negligible thickness.',
        'Aperture is small and rays make small angles with principal axis.',
      ],
      steps: [
        {
          stepNumber: 1,
          title: 'Refraction at 1st Spherical Surface',
          latexExpression: '\\frac{\\mu_2}{v_1} - \\frac{\\mu_1}{u} = \\frac{\\mu_2 - \\mu_1}{R_1}',
          conceptualReason: 'Standard single spherical surface refraction formula from medium 1 to medium 2.',
          boardTip: 'Draw optical ray diagram with object O and virtual image I1.',
        },
        {
          stepNumber: 2,
          title: 'Refraction at 2nd Spherical Surface',
          latexExpression: '\\frac{\\mu_1}{v} - \\frac{\\mu_2}{v_1} = \\frac{\\mu_1 - \\mu_2}{R_2} = -\\frac{\\mu_2 - \\mu_1}{R_2}',
          conceptualReason: 'Image I1 acts as virtual object for 2nd surface. Rays exit from medium 2 into medium 1.',
        },
        {
          stepNumber: 3,
          title: 'Adding Both Refraction Equations',
          latexExpression: '\\mu_1 \\left( \\frac{1}{v} - \\frac{1}{u} \\right) = (\\mu_2 - \\mu_1) \\left( \\frac{1}{R_1} - \\frac{1}{R_2} \\right)',
          conceptualReason: 'The intermediate image term μ2/v1 cancels out completely upon addition.',
        },
        {
          stepNumber: 4,
          title: 'Dividing by μ1 and Applying Focus Definition (u = ∞, v = f)',
          latexExpression: '\\frac{1}{f} = \\left( \\frac{\\mu_2}{\\mu_1} - 1 \\right) \\left( \\frac{1}{R_1} - \\frac{1}{R_2} \\right)',
          conceptualReason: 'Since 1/v - 1/u = 1/f by thin lens formula, the result is established.',
          boardTip: 'State the final form clearly with Cartesians for biconvex.',
        },
      ],
      finalResult: '1/f = (μ2/μ1 - 1) · (1/R1 - 1/R2)',
      boardMarks: 5,
    },
    memoryBooster: {
      mnemonic: 'One Over Focal = (Medium Ratio Minus 1) Times (Radius Difference)',
      shortcut: 'Equiconvex in air: 1/f = (1.5 - 1)(1/R - (-1/R)) = 0.5(2/R) = 1/R => f = R!',
      visualMemoryTrick: 'Imagine light entering surface 1 (bending toward normal) and exiting surface 2 (bending away). Both curvatures cooperate to converge the rays.',
      storyMethod: 'A master optician grinds two glass bowls of radii R1 and R2. In air, light bends sharply. When submerged in a water tank, the water cushions the light, so it takes 4 times longer distance (focal length × 4) to bend to a focus!',
      patternRecognition: 'Whenever a problem mentions "lens immersed in water or liquid of index 1.6", immediately compare (μ2/μ1 - 1).',
    },
    relatedQuestions: [
      {
        id: 'q_phys_2_1',
        type: 'pyq',
        source: 'CBSE 2024 / 2022 (3 Marks)',
        question: 'A biconvex lens of glass (μ = 1.5) has focal length 20 cm in air. What will be its focal length when completely immersed in water (μ = 4/3)?',
        givenData: 'fair = 20 cm, μglass = 1.5, μwater = 4/3 = 1.333',
        formulaToApply: 'fwater / fair = (μg - 1) / (μg/μw - 1)',
        solutionSummary: 'fwater / 20 = (1.5 - 1) / ((1.5 / (4/3)) - 1) = 0.5 / (1.125 - 1) = 0.5 / 0.125 = 4. Hence fwater = 4 × 20 = 80 cm.',
        answerValue: '80 cm (+4x increase in focal length)',
      },
    ],
    practiceExercises: [
      {
        id: 'prac_phys_2_1',
        type: 'numerical',
        difficulty: 'Medium',
        question: 'What happens to the nature of a glass convex lens (μ = 1.5) when placed in carbon disulphide (μ = 1.63)?',
        correctAnswer: 'It turns into a diverging (concave) lens!',
        explanation: 'Since surrounding medium μ1 = 1.63 > μ2 = 1.5, the factor (μ2/μ1 - 1) becomes (1.5/1.63 - 1) < 0 (negative). A converging shape with negative focal length acts as a diverging lens.',
        trapWarning: 'Whenever medium index exceeds lens index, the converging/diverging nature flips!',
      },
    ],
  },
];
