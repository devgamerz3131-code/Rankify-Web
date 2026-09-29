import React, { useState } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, CheckCircle2, XCircle, RotateCcw, Target, Brain, Award, BookX } from 'lucide-react';
import { mistakeService } from '@/services/mistake-service';
import toast from 'react-hot-toast';

interface QuizQuestion {
  question: string;
  subject: string;
  chapter: string;
  options: string[];
  correct: number;
  explanation: string;
  topic?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

const SAMPLE_QUESTIONS: QuizQuestion[] = [
  {
    question: 'According to Ohm’s law, at constant temperature, the current flowing through a conductor is:',
    subject: 'Physics',
    chapter: 'Electricity',
    topic: 'Ohm Law',
    difficulty: 'Easy',
    options: [
      'Inversely proportional to potential difference',
      'Directly proportional to potential difference',
      'Independent of potential difference',
      'Directly proportional to square of resistance',
    ],
    correct: 1,
    explanation: 'V = IR; current I is directly proportional to the potential difference V across the ends at constant temperature.',
  },
  {
    question: 'Which of the following compounds exhibits functional group isomerism with ethanol?',
    subject: 'Chemistry',
    chapter: 'Carbon and its Compounds',
    topic: 'Isomerism',
    difficulty: 'Medium',
    options: ['Methoxymethane', 'Ethanoic acid', 'Propanol', 'Methanal'],
    correct: 0,
    explanation: 'Ethanol (CH3CH2OH, alcohol) and methoxymethane (CH3OCH3, ether) share the identical molecular formula C2H6O but possess different functional groups.',
  },
  {
    question: 'If the discriminant of a quadratic equation ax² + bx + c = 0 is greater than zero, the roots are:',
    subject: 'Mathematics',
    chapter: 'Quadratic Equations',
    topic: 'Discriminant',
    difficulty: 'Easy',
    options: ['Real and equal', 'Real and distinct', 'Complex conjugates', 'Zero'],
    correct: 1,
    explanation: 'When b² - 4ac > 0, the quadratic formula yields two distinct real numerical values.',
  },
  {
    question: 'In flowering plants, the process of double fertilisation results in the formation of:',
    subject: 'Biology',
    chapter: 'Sexual Reproduction in Flowering Plants',
    topic: 'Double Fertilisation',
    difficulty: 'Medium',
    options: ['Zygote only', 'Endosperm only', 'Diploid Zygote and Triploid Endosperm', 'Embryo Sac'],
    correct: 2,
    explanation: 'Syngamy forms the 2n zygote, while triple fusion forms the 3n primary endosperm nucleus.',
  },
  {
    question: 'A convex lens of focal length 20 cm is placed in contact with a concave lens of focal length 25 cm. The power of the combination is:',
    subject: 'Physics',
    chapter: 'Ray Optics',
    topic: 'Lens Combination',
    difficulty: 'Hard',
    options: ['+1.0 D', '-1.0 D', '+9.0 D', '-9.0 D'],
    correct: 0,
    explanation: 'P1 = 100/20 = +5 D. P2 = -100/25 = -4 D. Net power P = P1 + P2 = +5 - 4 = +1.0 D.',
  },
  {
    question: 'Which of the following does NOT give Cannizzaro reaction?',
    subject: 'Chemistry',
    chapter: 'Aldehydes, Ketones and Carboxylic Acids',
    topic: 'Named Reactions',
    difficulty: 'Medium',
    options: ['Formaldehyde', 'Benzaldehyde', 'Acetaldehyde', 'Trimethylacetaldehyde'],
    correct: 2,
    explanation: 'Acetaldehyde contains alpha-hydrogen atoms, so it undergoes aldol condensation rather than Cannizzaro reaction.',
  },
  {
    question: 'The value of definite integral ∫ (from -π/2 to π/2) sin⁷(x) dx is:',
    subject: 'Mathematics',
    chapter: 'Integrals',
    topic: 'Definite Integrals',
    difficulty: 'Medium',
    options: ['1', '0', 'π/2', '2/7'],
    correct: 1,
    explanation: 'f(x) = sin⁷(x) is an odd function because f(-x) = -f(x). The integral of an odd function from -a to a is identically 0.',
  },
];

export const PracticeView: React.FC = () => {
  const { chapterProgressMap, weakSubjectAnalysis } = useOnboarding();
  const { user } = useAuth();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const q = SAMPLE_QUESTIONS[currentIdx];

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);
    if (idx === q.correct) {
      setScore((s) => s + 1);
      toast.success('Correct answer! +10 XP', { icon: '🎯' });
    } else {
      mistakeService.saveMistake({
        question: q.question,
        correctAnswer: q.options[q.correct],
        studentAnswer: q.options[idx],
        explanation: q.explanation,
        subject: q.subject,
        chapter: q.chapter,
        topic: q.topic || 'Core Concept',
        difficulty: q.difficulty || 'Medium',
        questionType: 'MCQ',
        source: 'Targeted Weak Area Drill',
      }).catch(console.error);
      toast.error('Incorrect. Auto-saved to your Mistake Notebook 📕', { icon: '💡' });
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 < SAMPLE_QUESTIONS.length) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Target className="w-6 h-6 text-purple-600" />
            <span>Targeted Weak Area Practice</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Board-standard high-yield problems calibrated to reinforce weak conceptual chapters.
          </p>
        </div>

        {weakSubjectAnalysis?.weakSubjects && weakSubjectAnalysis.weakSubjects.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-xl border border-rose-500/20">
              Focus: {weakSubjectAnalysis.weakSubjects.join(', ')}
            </span>
          </div>
        )}
      </div>

      {!isFinished ? (
        <Card className="p-6 sm:p-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-lg space-y-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 font-bold">
              {q.subject} • {q.chapter}
            </span>
            <span className="font-bold">
              Question {currentIdx + 1} of {SAMPLE_QUESTIONS.length}
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-foreground leading-snug">
            {q.question}
          </h2>

          {/* Options */}
          <div className="space-y-2.5">
            {q.options.map((opt, idx) => {
              let btnClass =
                'border-slate-200 dark:border-slate-800 bg-card hover:border-purple-500/50 text-foreground';

              if (isAnswered) {
                if (idx === q.correct) {
                  btnClass = 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold';
                } else if (idx === selectedOption) {
                  btnClass = 'bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300 line-through';
                } else {
                  btnClass = 'opacity-50 border-slate-200 dark:border-slate-800 text-muted-foreground';
                }
              }

              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm font-medium transition cursor-pointer flex items-center justify-between ${btnClass}`}
                >
                  <span>{opt}</span>
                  {isAnswered && idx === q.correct && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  {isAnswered && idx === selectedOption && idx !== q.correct && (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Box */}
          {isAnswered && (
            <div className="space-y-2">
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-500/30 text-xs space-y-1">
                <span className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5" />
                  <span>Concept Breakdown</span>
                </span>
                <p className="text-purple-900/80 dark:text-purple-200/80 leading-relaxed">
                  {q.explanation}
                </p>
              </div>

              {selectedOption !== q.correct && (
                <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-500/30 text-xs flex items-center justify-between gap-2 text-rose-800 dark:text-rose-200">
                  <div className="flex items-center gap-2">
                    <BookX className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Auto-saved to your <strong>Mistake Notebook</strong>. Scheduled for Day 1, Day 3, Day 7 spaced recall.</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Next Button */}
          {isAnswered && (
            <div className="flex justify-end pt-2">
              <Button onClick={handleNext} variant="primary" className="px-6 rounded-xl font-bold cursor-pointer">
                <span>{currentIdx + 1 < SAMPLE_QUESTIONS.length ? 'Next Question' : 'Finish Drill'}</span>
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-8 text-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-xl space-y-5">
          <div className="w-16 h-16 rounded-full bg-purple-500/20 text-purple-600 flex items-center justify-center mx-auto text-2xl">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Practice Drill Completed!</h2>
          <p className="text-sm text-muted-foreground">
            You scored <strong>{score}</strong> out of <strong>{SAMPLE_QUESTIONS.length}</strong>{' '}
            questions correctly.
          </p>
          <Button onClick={handleRestart} variant="primary" className="px-6 font-bold cursor-pointer gap-2">
            <RotateCcw className="w-4 h-4" />
            <span>Practice Another Set</span>
          </Button>
        </Card>
      )}
    </div>
  );
};
