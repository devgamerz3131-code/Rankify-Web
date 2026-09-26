export interface FunItem {
  id: string;
  type: 'challenge' | 'lucky' | 'quote' | 'tip';
  title: string;
  content: string;
  actionText?: string;
  promptToAsk?: string;
}

export const STUDY_CHALLENGES: FunItem[] = [
  {
    id: 'ch_1',
    type: 'challenge',
    title: '⚡ 15-Minute Derivation Sprint',
    content: 'Derive the Lens Maker Formula on blank paper without checking notes once.',
    actionText: 'Ask Derivation Steps',
    promptToAsk: 'Explain the complete step-by-step NCERT derivation for Lens Maker Formula with sign conventions and ray diagrams',
  },
  {
    id: 'ch_2',
    type: 'challenge',
    title: '🧠 Nernst Equation Rapid Drill',
    content: 'Solve 2 numericals on cell EMF with non-standard concentrations under 10 minutes.',
    actionText: 'Practice Nernst Numericals',
    promptToAsk: 'Provide 3 high-yield CBSE board numericals on Nernst Equation and equilibrium constant with step-by-step marking',
  },
  {
    id: 'ch_3',
    type: 'challenge',
    title: '📐 Integration by Parts Blitz',
    content: 'Evaluate the integral of x * sec^2(x) dx without using a calculator or skipping steps.',
    actionText: 'Solve Integral Step by Step',
    promptToAsk: 'Solve integration of x*sec^2(x) dx step by step with clear integration by parts ILATE rule explanation',
  },
  {
    id: 'ch_4',
    type: 'challenge',
    title: '🔥 Organic Conversions Master',
    content: 'Write out the 3-step conversion from Benzene to Aniline with reagents and temperatures.',
    actionText: 'Practice Organic Conversions',
    promptToAsk: 'Detail top repeated CBSE organic conversions involving Benzene and Amines with reaction conditions',
  },
];

export const LUCKY_QUESTIONS: FunItem[] = [
  {
    id: 'lq_1',
    type: 'lucky',
    title: '🍀 Lucky Board Question (5 Marks)',
    content: 'State Gauss’s Law. Use it to find electric field due to an infinitely long straight wire.',
    actionText: 'Ask Full 5-Marker Answer',
    promptToAsk: 'Write model 5-mark CBSE answer for Gauss Law statement and electric field due to infinitely long straight wire',
  },
  {
    id: 'lq_2',
    type: 'lucky',
    title: '🍀 Lucky Board Question (3 Marks)',
    content: 'Explain why transition metals exhibit catalytic properties and variable oxidation states.',
    actionText: 'Ask Scientific Reason',
    promptToAsk: 'Explain why transition elements exhibit catalytic properties and variable oxidation states with NCERT reasoning',
  },
  {
    id: 'lq_3',
    type: 'lucky',
    title: '🍀 Lucky Board Question (4 Marks - Case Study)',
    content: 'CBSE Competency: Electric Dipole placed in a uniform external electrostatic field.',
    actionText: 'Ask Case Study Drill',
    promptToAsk: 'Generate CBSE competency-based case study question on electric dipole in uniform field with 4 sub-questions and answer key',
  },
  {
    id: 'lq_4',
    type: 'lucky',
    title: '🍀 Lucky Board Question (3 Marks)',
    content: 'Find the shortest distance between two skew lines in 3D vector and cartesian form.',
    actionText: 'Ask Vector Formula & Steps',
    promptToAsk: 'Explain formula and step-by-step solution for shortest distance between two skew lines in 3D Geometry for CBSE Boards',
  },
];

export const MOTIVATION_QUOTES: FunItem[] = [
  {
    id: 'mq_1',
    type: 'quote',
    title: '💡 Board Exam Mindset',
    content: '“95% in CBSE isn’t created by 14-hour burnout. It’s built by 5 solved PYQs with 100% conceptual clarity every single day.”',
  },
  {
    id: 'mq_2',
    type: 'quote',
    title: '💡 Persistence Pays',
    content: '“Every single derivation you write down today with your own hands is guaranteed marks secured in March.”',
  },
  {
    id: 'mq_3',
    type: 'quote',
    title: '💡 Precision over Speed',
    content: '“Board examiners award marks step-by-step. Show your given data, formula, and units clearly—never rush calculations.”',
  },
  {
    id: 'mq_4',
    type: 'quote',
    title: '💡 Smart Work',
    content: '“NCERT textbooks contain 90% of your board exam answers. Master the in-text questions and back exercises first.”',
  },
];

export const DAILY_TIPS: FunItem[] = [
  {
    id: 'dt_1',
    type: 'tip',
    title: '⚡ Board Pro Tip: Physics Numericals',
    content: 'Always draw a rough sketch and state SI units before substituting numbers. You earn 1 full mark even if the final arithmetic has an error.',
  },
  {
    id: 'dt_2',
    type: 'tip',
    title: '⚡ Board Pro Tip: Organic Chemistry',
    content: 'Underline IUPAC names, catalyst names (e.g. anhydrous AlCl3), and temperatures directly below reaction arrows.',
  },
  {
    id: 'dt_3',
    type: 'tip',
    title: '⚡ Board Pro Tip: Mathematics',
    content: 'Always state the constant of integration "+ C" in indefinite integrals. Examiners penalize 1/2 mark for omission in CBSE boards.',
  },
  {
    id: 'dt_4',
    type: 'tip',
    title: '⚡ Board Pro Tip: Assertion-Reason',
    content: 'First check if Statement 1 and Statement 2 are independently true. Only if both are TRUE, ask: "Does Statement 2 directly cause Statement 1?"',
  },
];

export function getRandomStudyChallenge(): FunItem {
  const index = Math.floor(Math.random() * STUDY_CHALLENGES.length);
  return STUDY_CHALLENGES[index];
}

export function getLuckyQuestion(): FunItem {
  const index = Math.floor(Math.random() * LUCKY_QUESTIONS.length);
  return LUCKY_QUESTIONS[index];
}

export function getRandomMotivationQuote(): FunItem {
  const index = Math.floor(Math.random() * MOTIVATION_QUOTES.length);
  return MOTIVATION_QUOTES[index];
}

export function getDailyTip(): FunItem {
  const index = Math.floor(Math.random() * DAILY_TIPS.length);
  return DAILY_TIPS[index];
}
