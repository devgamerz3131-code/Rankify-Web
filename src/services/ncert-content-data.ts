import { NcertChapter } from '@/types/ncert';

export const NCERT_CLASS_12_CHAPTERS: NcertChapter[] = [
  // ==========================================
  // PHYSICS: Chapter 3 - Current Electricity
  // ==========================================
  {
    id: 'phys_current_electricity',
    chapterNumber: 3,
    title: 'Current Electricity',
    subject: 'Physics',
    bookPart: 'Part 1',
    weightageMarks: 8,
    totalEstimatedMinutes: 45,
    summary:
      'Covers electric current, drift velocity, Ohm’s law, resistivity, Kirchhoff’s rules, Wheatstone bridge, and precision measurement instruments with rigorous board focus.',
    revisionPack: {
      fiveMinRevision: [
        'Electric Current: I = q/t = n·e·A·vd (where vd = eEτ/m)',
        'Resistivity: ρ = m / (n·e²·τ); increases with temperature for metals (positive α) and decreases for semiconductors (negative α)',
        'Kirchhoff’s First Rule (Junction Rule): ΣI = 0 (Conservation of Charge)',
        'Kirchhoff’s Second Rule (Loop Rule): ΣΔV = 0 (Conservation of Energy)',
        'Wheatstone Bridge balance condition: P/Q = R/S (no current flows through galvanometer)',
      ],
      fifteenMinRevision: [
        {
          concept: 'Microscopic Origin of Ohm’s Law & Drift Velocity',
          points: [
            'Drift velocity vd = - (e E τ) / m, typical magnitude ~ 10⁻⁴ m/s',
            'Current density j = σ E = E / ρ, leading directly to macroscopic V = I R',
            'Relaxation time τ decreases with thermal agitation in conductors, increasing resistance',
          ],
        },
        {
          concept: 'Kirchhoff’s Laws Application Strategy',
          points: [
            'Assign loop currents in clockwise or anti-clockwise sense consistently',
            'Battery traversed from - to + gives +E; traversing with current through resistance R gives -IR drop',
            'Always verify junction equations before solving linear matrix systems',
          ],
        },
      ],
      thirtyMinRevision: [
        {
          derivation: 'Derivation of Drift Velocity and Ohm’s Law in Vector Form',
          exemplarTraps: [
            'Writing vd = a·t instead of using statistical relaxation time τ',
            'Confusing electron thermal velocity (~10⁵ m/s) with drift velocity (~10⁻⁴ m/s)',
            'Negative sign significance in vd = -eEτ/m indicates motion opposite to electric field vector',
          ],
        },
        {
          derivation: 'Balanced Wheatstone Bridge Principle using Kirchhoff’s Laws',
          exemplarTraps: [
            'Not stating that potential at detector nodes B and D are equal (VB = VD) at null deflection',
            'Assuming galvanometer resistance matters when Ig = 0',
          ],
        },
      ],
      oneNightBefore: [
        {
          vitalDefinitions: [
            'Current Density (j): Current per unit cross-sectional area perpendicular to flow (j = I/A, vector quantity).',
            'Mobility (μ): Magnitude of drift velocity per unit applied electric field (μ = vd/E = eτ/m, units m² V⁻¹ s⁻¹).',
            'Internal Resistance of Cell (r): Opposition offered by the electrolyte and electrodes to the current flow.',
          ],
          boardGuaranteedDerivations: [
            'Expression for electric current in terms of drift velocity: I = n A e vd',
            'Condition for balance in a Wheatstone Bridge: P/Q = R/S',
            'Combination of cells in parallel: Equivalent emf Eeq/req = E1/r1 + E2/r2',
          ],
        },
      ],
    },
    topics: [
      {
        id: 'top_phys_3_1',
        topicIndex: 1,
        title: '3.1 Electric Current & Drift Velocity',
        estimatedMinutes: 20,
        paragraphs: [
          {
            id: 'p_phys_3_1_1',
            paragraphIndex: 1,
            heading: 'Electric Current and Current Density',
            text:
              'Electric charges in motion constitute an electric current. If a net charge ΔQ flows across any cross-section of a conductor in time Δt, the current I is defined as I = lim(Δt→0) ΔQ/Δt. Current is a scalar quantity even though it has direction, because it obeys scalar laws of addition rather than vector addition. Current density j is defined as the current per unit area normal to the flow, j = I / A, and is an intrinsic vector quantity.',
            importantLineTag: 'board_favourite',
            explanation: {
              simpleExplanation:
                'Think of electric current like water flowing in a pipe: how many coulombs of charge pass through a point every second. Even though it flows along a wire in a direction, you simply add 3A + 2A = 5A using normal addition, so it is a scalar!',
              detailedExplanation:
                'Microscopically, free conduction electrons wander randomly at thermal speeds (~10⁵ m/s). When an external potential difference is applied across the conductor, an electric field E is established inside the conductor at approximately the speed of light, exerting a steady electrostatic force -eE that superimposes a minute net average drift velocity vd.',
              examPointOfView:
                'CBSE often asks: "Why is electric current a scalar quantity despite possessing magnitude and direction?" Answer: Because it does not obey vector algebra (triangle or parallelogram laws). Current density j, however, is a vector.',
              realLifeExample:
                'When you flip a light switch, the light turns on instantly because the electric field propagates across the wire at ~3 × 10⁸ m/s, even though individual electrons crawl at less than 1 mm per second!',
              commonMistakes: [
                'Believing current is a vector because it has arrow marks in circuit diagrams.',
                'Forgetting that current density j has SI units of A/m² and is a vector pointing in the direction of conventional positive charge flow.',
              ],
              difficultWords: [
                { word: 'Cross-section', meaning: 'The surface or shape exposed by making a straight cut through something.' },
                { word: 'Scalar', meaning: 'A physical quantity that is completely described by magnitude alone without spatial direction laws.' },
                { word: 'Constitutes', meaning: 'Makes up or establishes.' },
              ],
            },
            relatedContent: {
              formulas: [
                {
                  title: 'Electric Current Definition',
                  latex: 'I = \\frac{\\Delta Q}{\\Delta t} = n e A v_d',
                  explanation: 'Relates macroscopic current I to microscopic carrier density n and drift velocity vd.',
                  variables: 'n = free electron density (m⁻³), e = 1.6×10⁻¹⁹ C, A = area, vd = drift velocity',
                },
                {
                  title: 'Current Density Vector Relation',
                  latex: '\\vec{j} = n e \\vec{v}_d = \\sigma \\vec{E}',
                  explanation: 'Microscopic Ohm’s law connecting current density, conductivity σ, and electric field E.',
                  variables: 'σ = electrical conductivity (S/m), E = electric field (V/m)',
                },
              ],
              derivations: [
                {
                  title: 'Derivation of I = n A e vd',
                  steps: [
                    'Consider a cylindrical conductor of length L and cross-sectional area A.',
                    'Total volume of the segment = A · L.',
                    'Number of free conduction electrons in segment = n · A · L.',
                    'Total mobile charge in segment ΔQ = (n A L) · e.',
                    'Time taken by electrons to traverse length L at drift speed vd: Δt = L / vd.',
                    'Current I = ΔQ / Δt = (n A L e) / (L / vd) = n A e vd. (Q.E.D.)',
                  ],
                  boardMarks: 3,
                },
              ],
              pyqs: [
                {
                  year: 'CBSE 2024 / 2022',
                  marks: 3,
                  question:
                    'Derive an expression for the drift velocity of free electrons in a conductor in terms of relaxation time and electric field. Hence obtain Ohm’s law.',
                  answerSummary:
                    'Force F = -eE; acceleration a = -eE/m; average velocity vd = a·τ = -eEτ/m. Substituting into I = nAe(eEτ/m) gives I = (ne²τ/m)·(A/L)·V, establishing V = IR where R = mL/(ne²τA).',
                  frequencyCount: 7,
                },
              ],
              competencyQuestions: [
                {
                  question:
                    'If the radius of a copper wire carrying a constant current I is doubled, what happens to the drift velocity of electrons?',
                  realWorldContext: 'High-voltage household vs industrial wiring gauge sizing.',
                  solutionKey:
                    'Since I = n A e vd and A = πr², doubling r quadruples area A. For constant current I, vd decreases to one-fourth (vd/4).',
                },
              ],
              assertionReasons: [
                {
                  assertion: 'Electric current inside a metallic wire is a scalar quantity.',
                  reason: 'Electric current obeys laws of scalar addition and not vector algebra.',
                  correctOption: 'A',
                  explanation: 'Both assertion and reason are true, and reason is the correct explanation.',
                },
              ],
              caseStudies: [
                {
                  passage:
                    'A uniform copper wire of length 2 m and cross-sectional area 1.0 × 10⁻⁶ m² carries a steady current of 3.2 A. The electron density is 8.5 × 10²⁸ m⁻³.',
                  subQuestions: [
                    'Calculate the drift velocity of free electrons.',
                    'Find the time taken by an electron to drift from one end of the wire to the other.',
                  ],
                  answers: [
                    'vd = I / (n e A) = 3.2 / (8.5×10²⁸ × 1.6×10⁻¹⁹ × 10⁻⁶) = 2.35 × 10⁻⁴ m/s.',
                    't = L / vd = 2 / (2.35×10⁻⁴) ≈ 8510 seconds (~2.36 hours).',
                  ],
                },
              ],
              lectureTitle: 'Class 12 Physics: Current Electricity Lecture 01 - Drift Velocity & Microscopic Ohm Law',
              lectureVideoId: 'phys_curr_elec_lec1',
            },
            memoryBooster: {
              mnemonic: 'I Need An Egg Very Delicious (I = n A e vd)',
              story:
                'Imagine a crowded metro platform (conductor) packed with commuters (electrons). When the train doors open (voltage applied), people gently shuffle forward at walking pace (drift velocity), but the announcement horn (electric field) traveled instantly across the station!',
              visualization:
                'Picture billions of billiard balls bouncing rapidly in all directions at random speeds, but an invisible tilted slope pushes the whole swarm slowly downhill at 0.1 mm/second.',
              memoryTrick: 'vd = e·E·τ / m -> "Every Elephant Takes Time to Move"',
              songIdea: 'Electrons drift so slow and low, but the current flows like an instant show!',
              quickRecallPoints: [
                'Current I is scalar (scalar addition).',
                'Current density j is vector (A/m²).',
                'vd = eEτ/m (typically 10⁻⁴ m/s).',
                'Relaxation time τ is time between two successive collisions.',
              ],
            },
          },
          {
            id: 'p_phys_3_1_2',
            paragraphIndex: 2,
            heading: 'Temperature Dependence of Resistivity',
            text:
              'The resistivity of a material is found to be dependent on the temperature. Over a limited range of temperatures, the resistivity of a metallic conductor is approximately given by ρ(T) = ρ₀ [1 + α(T - T₀)], where α is the temperature coefficient of resistivity. For metals, α is positive because lattice vibrations increase with temperature, decreasing the relaxation time τ. For semiconductors and insulators, resistivity decreases exponentially with temperature (negative α) because the carrier density n increases dramatically with thermal excitation.',
            importantLineTag: 'very_important',
            explanation: {
              simpleExplanation:
                'When you heat a metal wire, the atoms shake wildly like people in a crowded room dancing, making it much harder for electrons to pass through (higher resistance). In semiconductors, heat frees trapped electrons, actually making conduction easier!',
              detailedExplanation:
                'Recall ρ = m / (n e² τ). In metals, the free electron density n is constant (~10²⁸ m⁻³); therefore resistivity depends purely on relaxation time τ. As temperature rises, amplitude of ionic lattice oscillations increases, collision frequency increases, and τ decreases. In intrinsic semiconductors, n increases according to n ∝ exp(-Eg / 2kT), which overpowers the small decrease in τ.',
              examPointOfView:
                'CBSE 1-mark & 2-mark questions frequently ask to sketch ρ vs T curves for: (1) Copper (metal), (2) Nichrome (alloy with weak α used in heating elements), and (3) Silicon/Germanium (semiconductor).',
              realLifeExample:
                'Incandescent light bulb filaments have much lower resistance when cold. When first switched on, there is a giant surge current which is why bulbs almost always burn out at the instant of switching on!',
              commonMistakes: [
                'Writing that carrier density n increases in metals when heated (false, n is fixed).',
                'Forgetting that alloys like Manganin and Constantan have nearly zero temperature coefficient of resistivity, which is why standard resistance coils are made from them.',
              ],
              difficultWords: [
                { word: 'Resistivity', meaning: 'An intrinsic material property measuring resistance of a unit cube of material.' },
                { word: 'Lattice', meaning: 'The regular periodic 3D arrangement of atoms or ions in a crystalline solid.' },
                { word: 'Relaxation time', meaning: 'Average time interval elapsed between two successive electron collisions.' },
              ],
            },
            relatedContent: {
              formulas: [
                {
                  title: 'Temperature Dependence of Resistivity',
                  latex: '\\rho(T) = \\rho_0 [1 + \\alpha(T - T_0)]',
                  explanation: 'Linear approximation of metallic resistivity with temperature.',
                  variables: 'α = temperature coefficient of resistivity (K⁻¹ or °C⁻¹)',
                },
                {
                  title: 'Resistivity in terms of Microscopic Quantities',
                  latex: '\\rho = \\frac{m}{n e^2 \\tau}',
                  explanation: 'Fundamental formula showing dependence on electron mass, density, and relaxation time.',
                  variables: 'm = 9.1×10⁻³¹ kg, n = carrier density, τ = mean relaxation time',
                },
              ],
              derivations: [],
              pyqs: [
                {
                  year: 'CBSE 2023',
                  marks: 2,
                  question:
                    'Name a material which has a negative temperature coefficient of resistivity. Sketch a graph showing temperature dependence of resistivity for nichrome.',
                  answerSummary:
                    'Carbon, Silicon, or Germanium (semiconductors). For nichrome, the graph is a nearly straight line with a non-zero intercept showing weak temperature dependence.',
                  frequencyCount: 5,
                },
              ],
              competencyQuestions: [
                {
                  question:
                    'Why are standard resistor coils in laboratory meter bridges constructed from Manganin or Constantan rather than Copper?',
                  realWorldContext: 'Precision physics laboratory measurement instruments.',
                  solutionKey:
                    'Manganin and Constantan possess very high resistivity and an exceptionally low temperature coefficient of resistance (α ≈ 0), so their resistance remains virtually unchanged despite heating.',
                },
              ],
              assertionReasons: [
                {
                  assertion: 'The resistance of a semiconductor decreases with an increase in temperature.',
                  reason: 'In semiconductors, the number density of charge carriers increases exponentially with temperature.',
                  correctOption: 'A',
                  explanation: 'Both assertion and reason are true and reason directly explains the phenomenon.',
                },
              ],
              caseStudies: [],
              lectureTitle: 'Class 12 Physics: Temperature Dependence of Resistance and Carbon Resistors',
              lectureVideoId: 'phys_curr_elec_lec2',
            },
            memoryBooster: {
              mnemonic: 'Metals Shake More (τ drops, R jumps); Semiconductors Free More (n jumps, R drops)',
              story:
                'Think of a metal as a busy highway where heat causes random roadblocks. Think of a semiconductor as a locked garage that opens up more cars whenever the sun shines hot on it!',
              visualization:
                'Imagine red-hot vibrating iron atoms acting like vibrating pinball bumpers, scattering electrons backwards.',
              memoryTrick: 'Alpha is Positive for Platinum/Pure metals; Negative for Non-conductors/Semiconductors.',
              songIdea: 'Heat up copper, resistance goes high; heat up silicon, electrons will fly!',
              quickRecallPoints: [
                'Metals: α > 0, ρ increases with T.',
                'Semiconductors: α < 0, ρ decreases exponentially with T.',
                'Nichrome: high resistivity, very low α (ideal for heating elements).',
                'Manganin/Constantan: used for standard resistance coils.',
              ],
            },
          },
        ],
        autoNotes: {
          shortNotes: [
            'I = n·A·e·vd; current density j = I/A = σ·E.',
            'Drift velocity vd = e·E·τ / m ≈ 10⁻⁴ m/s.',
            'Resistivity ρ = m / (n·e²·τ); Conductivity σ = 1/ρ.',
            'Temperature dependence: ρ = ρ₀[1 + α(T - T₀)].',
          ],
          detailedNotes: [
            '1. Electric current is scalar; current density is a microscopic vector.',
            '2. The direction of electric field inside a current-carrying wire is parallel to the wire surface.',
            '3. In metals, carrier density n is fixed (~10²⁸ m⁻³), so temperature increase reduces relaxation time τ, increasing resistivity.',
            '4. In semiconductors, thermal breakdown of covalent bonds increases n exponentially, resulting in negative α.',
          ],
          onePageNotes: [
            'CURRENT & DRIFT: I = n A e vd | j = σ E = E/ρ | vd = (eEτ)/m | ρ = m/(n e² τ)',
            'TEMPERATURE: ρ(T) = ρ₀[1 + α ΔT] | Metals: α > 0 | Semiconductors: α < 0 | Manganin: α ≈ 0',
          ],
          examRevisionNotes: [
            '⭐ BOARD FOCUS 1: 3-Mark derivation of I = n·A·e·vd and deduction of Ohm’s law.',
            '⭐ BOARD FOCUS 2: Sketching graphs of ρ vs T for Copper, Nichrome, and Silicon.',
            '⭐ BOARD FOCUS 3: Explain why standard resistors use Manganin/Constantan (high ρ, negligible α).',
          ],
        },
        practiceQuestions: [
          {
            id: 'q_phys_3_1_1',
            type: 'mcq',
            question:
              'A potential difference V is applied across a copper wire of diameter d and length L. When only the diameter d is doubled, the drift velocity of free electrons will:',
            options: ['Be doubled', 'Be halved', 'Remain unchanged', 'Become one-fourth'],
            correctAnswer: 'Remain unchanged',
            explanation:
              'Since vd = eEτ/m = e(V/L)τ/m. Notice that drift velocity depends on electric field E = V/L, which is independent of the wire diameter d!',
            marks: 1,
            boardYear: 'CBSE 2021',
            difficulty: 'medium',
          },
          {
            id: 'q_phys_3_1_2',
            type: 'numerical',
            question:
              'A heating element using nichrome connected to a 230 V supply draws an initial current of 3.2 A which settles after a few seconds to a steady value of 2.8 A. What is the steady temperature of the heating element if the room temperature is 27.0 °C? Temperature coefficient of resistance of nichrome averaged over the temperature range involved is 1.70 × 10⁻⁴ °C⁻¹.',
            correctAnswer: '867.4 °C',
            explanation:
              'Initial resistance R1 = 230/3.2 = 71.875 Ω at T1 = 27 °C. Steady resistance R2 = 230/2.8 = 82.143 Ω at T2. Using R2 = R1[1 + α(T2 - T1)], ΔT = (R2 - R1)/(R1·α) = (82.143 - 71.875)/(71.875 × 1.70×10⁻⁴) = 840.4 °C. Therefore, T2 = 27 + 840.4 = 867.4 °C.',
            marks: 3,
            boardYear: 'NCERT Exemplar / CBSE 2020',
            difficulty: 'hard',
          },
        ],
      },
    ],
  },

  // ==========================================
  // CHEMISTRY: Chapter 2 - Electrochemistry
  // ==========================================
  {
    id: 'chem_electrochemistry',
    chapterNumber: 2,
    title: 'Electrochemistry',
    subject: 'Chemistry',
    bookPart: 'Part 1',
    weightageMarks: 9,
    totalEstimatedMinutes: 50,
    summary:
      'Covers Galvanic cells, standard electrode potentials, Nernst equation, electrolytic conductivity, Kohlrausch law, batteries, fuel cells, and corrosion.',
    revisionPack: {
      fiveMinRevision: [
        'Cell EMF: E°cell = E°cathode - E°anode (both written as standard reduction potentials)',
        'Nernst Equation: Ecell = E°cell - (0.0591 / n) · log10([Anode ion] / [Cathode ion]) at 298 K',
        'Gibbs Free Energy: ΔrG° = -n F E°cell; for spontaneous reaction E°cell > 0 and ΔrG° < 0',
        'Kohlrausch Law: Λ°m = ν+ λ°+ + ν- λ°- for infinite dilution limiting molar conductivities',
        'Degree of dissociation for weak electrolyte: α = Λm / Λ°m; Ka = (c α²) / (1 - α)',
      ],
      fifteenMinRevision: [
        {
          concept: 'Nernst Equation Calculations & Concentration Cells',
          points: [
            'Always balance stoichiometric coefficients (n = moles of electrons exchanged)',
            'Pure solids and liquids have unit active mass (activity = 1)',
            'In concentration cells, E°cell = 0; EMF arises purely from concentration gradient',
          ],
        },
        {
          concept: 'Kohlrausch Law & Weak Electrolyte Dissociation',
          points: [
            'Strong electrolytes follow Debye-Hückel-Onsager equation: Λm = Λ°m - A√c',
            'Weak electrolytes (e.g. CH3COOH) can only have Λ°m evaluated indirectly via Kohlrausch law',
          ],
        },
      ],
      thirtyMinRevision: [
        {
          derivation: 'Thermodynamic Relation between Equilibrium Constant Kc and E°cell',
          exemplarTraps: [
            'Forgetting that at equilibrium, Ecell = 0 (not E°cell = 0)',
            'Substituting E°cell = (0.0591 / n) log10(Kc) at 298 K',
            'Confusing natural log ln(Kc) with base-10 log10(Kc)',
          ],
        },
      ],
      oneNightBefore: [
        {
          vitalDefinitions: [
            'Molar Conductivity (Λm): Conducting power of all ions produced by dissolving one mole of an electrolyte in solution (Λm = (κ × 1000) / Molarity).',
            'Kohlrausch’s Law of Independent Migration: Limiting molar conductivity of an electrolyte can be represented as the sum of individual contributions of the anion and cation.',
            'Fuel Cell: Galvanic cells that convert chemical energy of fuel combustion (H2 + O2) directly into electrical energy with ~70% efficiency.',
          ],
          boardGuaranteedDerivations: [
            'Nernst Equation for a general redox reaction',
            'Relation: ΔG° = -nFE°cell = -2.303 RT log10(Kc)',
            'Kohlrausch law calculation of Λ°m for acetic acid using HCl, NaCl, and CH3COONa',
          ],
        },
      ],
    },
    topics: [
      {
        id: 'top_chem_2_1',
        topicIndex: 1,
        title: '2.1 Galvanic Cells & Nernst Equation',
        estimatedMinutes: 25,
        paragraphs: [
          {
            id: 'p_chem_2_1_1',
            paragraphIndex: 1,
            heading: 'Electrochemical Cell and Nernst Equation',
            text:
              'A Galvanic cell converts chemical energy liberated during a spontaneous redox reaction into electrical energy. At the anode, oxidation occurs (Zn → Zn²⁺ + 2e⁻) and at the cathode, reduction occurs (Cu²⁺ + 2e⁻ → Cu). The standard cell potential E°cell is given by E°cathode - E°anode. For non-standard conditions, Walther Nernst showed that the electrode potential depends on electrolyte concentration according to: E = E° - (RT/nF) ln Q. At 298 K, this simplifies to Ecell = E°cell - (0.0591/n) log10([Products]/[Reactants]).',
            importantLineTag: 'high_weightage',
            explanation: {
              simpleExplanation:
                'An electrochemical cell is essentially a battery running on a spontaneous chemical reaction. When battery ions get depleted, its voltage drops. The Nernst equation tells you the exact voltage output at any concentration!',
              detailedExplanation:
                'From thermodynamics, ΔG = ΔG° + RT ln Q. Since electrical work done by the cell is -ΔG = n F Ecell, dividing both sides by -nF yields Ecell = E°cell - (RT/nF) ln Q. Here, Q is the reaction quotient containing ion concentrations raised to their stoichiometric powers.',
              examPointOfView:
                'Guaranteed 3-mark or 5-mark numerical in CBSE Class 12 board paper! Be vigilant with stoichiometric powers, e.g. for Fe(s) + 2H⁺(aq) → Fe²⁺(aq) + H2(g), Q = [Fe²⁺]·P(H2) / [H⁺]².',
              realLifeExample:
                'Smartphone lithium-ion batteries output ~3.7 V when fully charged, but voltage drops toward 3.2 V as discharge reduces reactant concentration, triggering your phone’s low battery alert.',
              commonMistakes: [
                'Forgetting to square or cube ion concentrations when balancing (e.g. [H⁺]²).',
                'Subtracting anode from cathode using oxidation potentials instead of standard reduction potentials.',
                'Assuming E°cell = 0 at equilibrium (Ecell becomes 0 at dead battery, E°cell remains a constant!).',
              ],
              difficultWords: [
                { word: 'Anode', meaning: 'The electrode at which oxidation (loss of electrons) occurs (negative in galvanic cells).' },
                { word: 'Cathode', meaning: 'The electrode at which reduction (gain of electrons) occurs (positive in galvanic cells).' },
                { word: 'Stoichiometric', meaning: 'The quantitative mole relationships between reactants and products in a balanced reaction.' },
              ],
            },
            relatedContent: {
              formulas: [
                {
                  title: 'Nernst Equation at 298 K',
                  latex: 'E_{cell} = E^\\circ_{cell} - \\frac{0.0591}{n} \\log_{10} \\left( \\frac{[\\text{Anode Ion}]^a}{[\\text{Cathode Ion}]^b} \\right)',
                  explanation: 'Used to calculate actual EMF under non-1M concentrations.',
                  variables: 'n = number of moles of electrons transferred, a/b = stoichiometric coefficients',
                },
                {
                  title: 'Equilibrium Constant Relation',
                  latex: 'E^\\circ_{cell} = \\frac{0.0591}{n} \\log_{10} K_c',
                  explanation: 'Equilibrium constant determination from standard potential.',
                  variables: 'Kc = chemical equilibrium constant',
                },
              ],
              derivations: [
                {
                  title: 'Thermodynamic Derivation of Nernst Equation',
                  steps: [
                    'ΔG = ΔG° + 2.303 RT log10(Q)',
                    'Substitute ΔG = -n F Ecell and ΔG° = -n F E°cell',
                    '-n F Ecell = -n F E°cell + 2.303 RT log10(Q)',
                    'Divide entire equation by -nF: Ecell = E°cell - (2.303 RT / nF) log10(Q)',
                    'At T = 298.15 K, R = 8.314 J/mol·K, F = 96487 C/mol: (2.303 RT / F) = 0.0591 V.',
                    'Ecell = E°cell - (0.0591 / n) log10(Q). (Q.E.D.)',
                  ],
                  boardMarks: 3,
                },
              ],
              pyqs: [
                {
                  year: 'CBSE 2024 / 2023 / 2020',
                  marks: 3,
                  question:
                    'Calculate the emf of the cell at 298 K: Mg(s) | Mg²⁺(0.1 M) || Cu²⁺(1 × 10⁻³ M) | Cu(s). Given E°(Mg²⁺/Mg) = -2.37 V, E°(Cu²⁺/Cu) = +0.34 V.',
                  answerSummary:
                    'E°cell = 0.34 - (-2.37) = +2.71 V. n = 2. Ecell = 2.71 - (0.0591/2) log10([Mg²⁺]/[Cu²⁺]) = 2.71 - 0.02955 log10(0.1 / 10⁻³) = 2.71 - 0.02955(2) = 2.71 - 0.0591 = 2.651 V.',
                  frequencyCount: 8,
                },
              ],
              competencyQuestions: [
                {
                  question:
                    'Can you store copper sulphate solution in a zinc container? Explain using standard electrode potentials: E°(Zn²⁺/Zn) = -0.76 V, E°(Cu²⁺/Cu) = +0.34 V.',
                  realWorldContext: 'Industrial chemical storage and corrosion safety.',
                  solutionKey:
                    'No. Since E°(Zn²⁺/Zn) is more negative than E°(Cu²⁺/Cu), Zinc is a stronger reducing agent. Zinc will reduce Cu²⁺ to Cu, dissolving the container: Zn + Cu²⁺ → Zn²⁺ + Cu (E°cell = +1.10 V > 0, spontaneous).',
                },
              ],
              assertionReasons: [
                {
                  assertion: 'For a galvanic cell, Ecell becomes zero at equilibrium.',
                  reason: 'At equilibrium, the rates of forward and reverse electrode reactions become equal, and reaction quotient Q equals Kc.',
                  correctOption: 'A',
                  explanation: 'Both assertion and reason are true and reason correctly accounts for zero EMF.',
                },
              ],
              caseStudies: [
                {
                  passage:
                    'The Daniell cell utilizes Zn and Cu half-cells. A student constructs a cell with [Zn²⁺] = 0.01 M and [Cu²⁺] = 1.0 M.',
                  subQuestions: [
                    'Write the overall cell notation.',
                    'Predict whether the EMF will be higher or lower than 1.10 V.',
                  ],
                  answers: [
                    'Zn(s) | Zn²⁺(0.01 M) || Cu²⁺(1.0 M) | Cu(s)',
                    'Higher: Ecell = 1.10 - (0.0591/2) log(0.01/1) = 1.10 - (0.02955)(-2) = 1.10 + 0.0591 = 1.159 V.',
                  ],
                },
              ],
              lectureTitle: 'Class 12 Chemistry: Electrochemistry Lecture 02 - Nernst Equation Mastery & Cell Potentials',
              lectureVideoId: 'chem_electrochem_lec2',
            },
            memoryBooster: {
              mnemonic: 'AN OIL RIG CAT (Anode: Oxidation Is Loss; Reduction Is Gain: Cathode)',
              story:
                'Imagine Zinc giving away two little electron gifts at the Anode airport gate. The electrons board the wire shuttle to the Cathode resort, where Copper eagerly hugs them to become shiny solid metal!',
              visualization:
                'Picture Zn metal bar shedding ions into water and shrinking, while Cu bar grows thick with red-brown copper plating.',
              memoryTrick: 'LOAN = Left, Oxidation, Anode, Negative.',
              songIdea: 'Oxidation at the Anode left, Reduction at the Cathode right, Nernst equation tells the voltage in the night!',
              quickRecallPoints: [
                'E°cell = E°cathode - E°anode (standard reduction potentials).',
                'Nernst: Ecell = E°cell - (0.0591/n) log10(Q).',
                'At equilibrium: Ecell = 0 and Q = Kc.',
                'ΔG° = -n F E°cell = -RT ln(Kc).',
              ],
            },
          },
        ],
        autoNotes: {
          shortNotes: [
            'E°cell = E°cathode - E°anode.',
            'Nernst: E = E° - (0.0591/n) log10([Anode]/[Cathode]).',
            'Spontaneity: ΔG° < 0 <=> E°cell > 0.',
            'ΔG° = -n F E°cell = -2.303 RT log10(Kc).',
          ],
          detailedNotes: [
            '1. In Galvanic cells, electrons flow externally from anode (-) to cathode (+). Current flows cathode to anode.',
            '2. The salt bridge completes the circuit and maintains electrical neutrality using agar-agar and inert electrolytes (KCl, KNO3, NH4NO3) with equal ionic mobilities.',
            '3. Standard Hydrogen Electrode (SHE) has arbitrary potential assigned as 0.00 V at 1 bar H2 pressure and 1 M H⁺ concentration.',
          ],
          onePageNotes: [
            'GALVANIC CELL: E°cell = E°red(cathode) - E°red(anode)',
            'NERNST AT 298K: Ecell = E°cell - (0.0591/n) log10(Q)',
            'THERMODYNAMICS: ΔrG° = -n F E°cell | log10(Kc) = (n E°cell) / 0.0591',
          ],
          examRevisionNotes: [
            '⭐ BOARD FOCUS 1: 3-Mark Nernst numerical with concentration logs.',
            '⭐ BOARD FOCUS 2: Salt bridge function (electrical neutrality + preventing liquid junction potential).',
            '⭐ BOARD FOCUS 3: Calculating ΔG° and equilibrium constant Kc from E°cell.',
          ],
        },
        practiceQuestions: [
          {
            id: 'q_chem_2_1_1',
            type: 'numerical',
            question:
              'Calculate the standard Gibbs free energy change (ΔrG°) and equilibrium constant for the reaction at 298 K: 2Fe³⁺(aq) + 2I⁻(aq) → 2Fe²⁺(aq) + I2(s). Given E°(Fe³⁺/Fe²⁺) = +0.77 V, E°(I2/I⁻) = +0.54 V, and F = 96500 C/mol.',
            correctAnswer: 'ΔrG° = -44.39 kJ/mol, Kc = 6.02 × 10⁷',
            explanation:
              'E°cell = E°cathode - E°anode = 0.77 - 0.54 = +0.23 V. n = 2 moles of electrons. ΔrG° = -n F E°cell = -2 × 96500 × 0.23 = -44390 J/mol = -44.39 kJ/mol. log10(Kc) = (n E°cell) / 0.0591 = (2 × 0.23) / 0.0591 = 7.783, Kc = 10^(7.783) ≈ 6.07 × 10⁷.',
            marks: 3,
            boardYear: 'CBSE 2023',
            difficulty: 'medium',
          },
        ],
      },
    ],
  },

  // ==========================================
  // MATHEMATICS: Chapter 4 - Determinants & Matrices
  // ==========================================
  {
    id: 'math_matrices_determinants',
    chapterNumber: 4,
    title: 'Determinants & System of Linear Equations',
    subject: 'Mathematics',
    bookPart: 'Part 1',
    weightageMarks: 10,
    totalEstimatedMinutes: 45,
    summary:
      'Covers properties of determinants, minors, cofactors, adjoint of a square matrix, inverse of a matrix, and solving systems of linear equations using the Matrix Inversion Method.',
    revisionPack: {
      fiveMinRevision: [
        'A · (adj A) = (adj A) · A = |A| · I',
        'Inverse Matrix: A⁻¹ = (1 / |A|) · adj(A), exists iff |A| ≠ 0 (non-singular)',
        'System of Equations AX = B: If |A| ≠ 0, unique solution X = A⁻¹ B',
        '|adj A| = |A|^(n - 1) for an n × n matrix',
        '|A · B| = |A| · |B|; |k · A| = k^n · |A|',
      ],
      fifteenMinRevision: [
        {
          concept: 'Matrix Inversion Method for System of Linear Equations',
          points: [
            'Express system as AX = B where A is coefficient matrix, X = [x y z]ᵀ, B = [d1 d2 d3]ᵀ',
            'Compute determinant |A|; if non-zero, compute cofactors Cij = (-1)^(i+j) Mij',
            'Form adjoint adj(A) = [Cij]ᵀ (transpose of cofactor matrix)',
            'Multiply X = (1 / |A|) · (adj A) · B to obtain x, y, and z',
          ],
        },
      ],
      thirtyMinRevision: [
        {
          derivation: 'Proof that |adj A| = |A|^(n-1)',
          exemplarTraps: [
            'Starting from A · (adj A) = |A| · I and taking determinants of both sides: |A · adj A| = ||A| · I|',
            'Applying |k I| = k^n gives |A| · |adj A| = |A|^n, so |adj A| = |A|^(n-1)',
            'Forgetting that scalar factor |A| pulls out with power n when multiplied with n×n identity matrix',
          ],
        },
      ],
      oneNightBefore: [
        {
          vitalDefinitions: [
            'Singular Matrix: A square matrix A is called singular if |A| = 0; non-singular if |A| ≠ 0.',
            'Adjoint of a Matrix: The transpose of the cofactor matrix of square matrix A.',
            'Consistency of Equations: Consistent if at least one solution exists; inconsistent if no solution exists.',
          ],
          boardGuaranteedDerivations: [
            'Derivation of |adj A| = |A|^(n-1) and |adj(adj A)| = |A|^((n-1)²)',
            '5-Mark guaranteed Matrix Method solution for 3 equations in 3 variables',
          ],
        },
      ],
    },
    topics: [
      {
        id: 'top_math_4_1',
        topicIndex: 1,
        title: '4.1 Adjoint, Inverse & System of Linear Equations',
        estimatedMinutes: 30,
        paragraphs: [
          {
            id: 'p_math_4_1_1',
            paragraphIndex: 1,
            heading: 'Matrix Inversion Method (AX = B)',
            text:
              'Consider a system of three linear equations in three unknowns: a1·x + b1·y + c1·z = d1; a2·x + b2·y + c2·z = d2; a3·x + b3·y + c3·z = d3. In matrix notation, this is represented as AX = B. If |A| ≠ 0, then A is invertible and the system has a unique solution given by X = A⁻¹ B = (1 / |A|) · (adj A) · B. If |A| = 0 and (adj A)·B ≠ O (zero matrix), the system is inconsistent with no solution. If |A| = 0 and (adj A)·B = O, the system may have infinitely many solutions or no solution.',
            importantLineTag: 'high_weightage',
            explanation: {
              simpleExplanation:
                'Instead of doing messy high-school elimination with 3 variables, you package all coefficients into matrix A, calculate its inverse A⁻¹, and multiply it by constants B. It immediately reveals x, y, and z!',
              detailedExplanation:
                'The matrix inverse A⁻¹ satisfies A · A⁻¹ = I. Multiplying AX = B from the left by A⁻¹ gives A⁻¹(AX) = A⁻¹B => (A⁻¹A)X = A⁻¹B => I X = A⁻¹B => X = A⁻¹B. Because matrix multiplication is non-commutative, you must multiply by A⁻¹ on the left (pre-multiplication).',
              examPointOfView:
                'Absolute guaranteed 5-mark question in Section D of CBSE Class 12 Mathematics paper every single year! Accuracy in calculating the 9 cofactors without sign mistakes is critical.',
              realLifeExample:
                'GPS triangulation algorithms, airline crew scheduling, and 3D computer game graphics engines solve thousands of such matrix equations AX = B every millisecond.',
              commonMistakes: [
                'Forgetting to transpose the cofactor matrix to get adj(A). Adjoint is the transpose of the cofactor matrix!',
                'Sign errors in cofactors where (i + j) is odd (e.g. C12, C21, C23, C32 have negative signs).',
                'Multiplying B · A⁻¹ instead of A⁻¹ · B.',
              ],
              difficultWords: [
                { word: 'Adjoint', meaning: 'The transpose of the matrix formed by the cofactors of a square matrix.' },
                { word: 'Non-singular', meaning: 'A square matrix whose determinant is not zero; hence its inverse exists.' },
                { word: 'Inconsistent', meaning: 'A system of linear equations that has no set of values satisfying all equations simultaneously.' },
              ],
            },
            relatedContent: {
              formulas: [
                {
                  title: 'Matrix Inverse Formula',
                  latex: 'A^{-1} = \\frac{1}{|A|} \\text{adj}(A)',
                  explanation: 'Direct calculation of inverse using cofactor adjoint.',
                  variables: '|A| = determinant of A, adj(A) = transpose of cofactor matrix',
                },
                {
                  title: 'Solution to Linear System',
                  latex: 'X = A^{-1} B = \\frac{1}{|A|} (\\text{adj} A) B',
                  explanation: 'Unique solution vector [x, y, z]ᵀ.',
                  variables: 'A = 3×3 coefficient matrix, X = 3×1 variable vector, B = 3×1 constants vector',
                },
              ],
              derivations: [],
              pyqs: [
                {
                  year: 'CBSE 2024 / 2023 / 2022',
                  marks: 5,
                  question:
                    'Solve the following system of linear equations using matrix method:\n2x + 3y + 3z = 5\nx - 2y + z = -4\n3x - y - 2z = 3',
                  answerSummary:
                    '|A| = 2(4+1) - 3(-2-3) + 3(-1+6) = 10 + 15 + 15 = 40 ≠ 0. Cofactors: C11=5, C12=5, C13=5; C21=3, C22=-13, C23=11; C31=9, C32=1, C33=-7. Adjoint A is transpose. X = (1/40) · adj(A) · B gives x = 1, y = 2, z = -1.',
                  frequencyCount: 12,
                },
              ],
              competencyQuestions: [],
              assertionReasons: [
                {
                  assertion: 'If A is a square matrix of order 3 and |A| = 4, then |adj A| = 16.',
                  reason: 'For any square matrix A of order n, |adj A| = |A|^(n - 1).',
                  correctOption: 'A',
                  explanation: 'Since n = 3, |adj A| = |A|^(3 - 1) = |A|² = 4² = 16. Reason is correct.',
                },
              ],
              caseStudies: [],
              lectureTitle: 'Class 12 Math: Determinants Lecture 04 - 5-Mark Matrix Inversion Method Mastery',
              lectureVideoId: 'math_matrices_lec4',
            },
            memoryBooster: {
              mnemonic: 'Check-Signs-Transpose-Divide (C-S-T-D for Adjoint)',
              story:
                'Matrix A is like a secure code vault. Its determinant |A| is the security key. If key ≠ 0, its adjoint acts as the secret decoder ring to reveal X = A⁻¹B!',
              visualization:
                'Picture checkerboard +/-/+/-/+ signs overlaid on a 3×3 grid to remind you where the cofactors flip signs.',
              memoryTrick: 'Checkerboard signs: + - + / - + - / + - +.',
              songIdea: 'Minors and cofactors in a row, transpose to adjoint and watch variables show!',
              quickRecallPoints: [
                'Cij = (-1)^(i+j) · Mij.',
                'adj(A) = [Cij]ᵀ (Always remember to transpose!).',
                'A⁻¹ = (1/|A|) · adj(A).',
                'X = A⁻¹ · B.',
              ],
            },
          },
        ],
        autoNotes: {
          shortNotes: [
            'System AX = B has unique solution X = A⁻¹ B when |A| ≠ 0.',
            'A⁻¹ = (1/|A|) · adj(A).',
            '|adj A| = |A|^(n - 1).',
            '|A · adj A| = |A|^n.',
          ],
          detailedNotes: [
            '1. A system of linear equations is consistent if it has one or more solutions; inconsistent if no solution exists.',
            '2. If |A| ≠ 0: Consistent with unique solution X = A⁻¹B.',
            '3. If |A| = 0 and (adj A)B ≠ O: Inconsistent, no solution.',
            '4. If |A| = 0 and (adj A)B = O: Consistent with infinitely many solutions or inconsistent.',
          ],
          onePageNotes: [
            'MATRIX EQUATIONS: AX = B => X = A⁻¹ B',
            'INVERSE: A⁻¹ = (1/|A|) adj(A) | adj(A) = [Cij]ᵀ',
            'PROPERTIES: A·adj(A) = |A| I | |adj A| = |A|^(n-1) | |kA| = k^n |A|',
          ],
          examRevisionNotes: [
            '⭐ GUARANTEED 5 MARKS: Solving 3x3 system AX = B.',
            '⭐ VERIFY: Always plug your final (x, y, z) back into Equation 1 to guarantee 100% full marks.',
            '⭐ 1-MARK TRICK: If |A| of 3x3 is 5, find |2A| => 2³ × 5 = 40; find |adj A| => 5² = 25.',
          ],
        },
        practiceQuestions: [
          {
            id: 'q_math_4_1_1',
            type: 'mcq',
            question: 'If A is a 3 × 3 matrix such that |A| = 5, then the value of |3 · adj(2A)| is:',
            options: ['3³ · 2⁶ · 5²', '3³ · 2³ · 5', '2³ · 5²', '3 · 2⁶ · 5²'],
            correctAnswer: '3³ · 2⁶ · 5²',
            explanation:
              '|3 · adj(2A)|: Pulling out scalar 3 from 3×3 matrix gives 3³ · |adj(2A)|. By property |adj M| = |M|^(3-1) = |M|², we have |adj(2A)| = |2A|² = (2³ · |A|)² = (8 · 5)² = 40² = 1600. So 27 × 1600 = 43200, matching 3³ · 2⁶ · 5² = 27 × 64 × 25 = 43200.',
            marks: 1,
            boardYear: 'CBSE 2024 Sample Paper',
            difficulty: 'hard',
          },
        ],
      },
    ],
  },
];
