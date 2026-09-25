import React, { useState } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, CheckCircle2, XCircle, RotateCcw, Target, Brain, Award } from 'lucide-react';
import toast from 'react-hot-toast';

interface QuizQuestion {
  question: string;
  subject: string;
  chapter: string;
  options: string[];
  correct: number;
  explanation: string;
}

const SAMPLE_QUESTIONS: QuizQuestion[] = [
  {
    question: 'According to Ohm’s law, at constant temperature, the current flowing through a conductor is:',
    subject: 'Physics',
    chapter: 'Electricity',
    options: [
      'Inversely proportional to potential difference',
      'Directly proportional to potential difference',
      'Independent of potential difference',
      'Directly proportional to square of resistance',
    ],
    correct: 1,
    explanation: 'V = IR; current I is directly proportional to the potential difference V across the ends.',
  },
  {
    question: 'Which of the following compounds exhibits functional group isomerism with ethanol?',
    subject: 'Chemistry',
    chapter: 'Carbon and its Compounds',
    options: ['Methoxymethane', 'Ethanoic acid', 'Propanol', 'Methanal'],
    correct: 0,
    explanation: 'Ethanol (CH3CH2OH) and methoxymethane (CH3OCH3) have the same molecular formula C2H6O.',
  },
  {
    question: 'If the discriminant of a quadratic equation ax² + bx + c = 0 is greater than zero, the roots are:',
    subject: 'Mathematics',
    chapter: 'Quadratic Equations',
    options: ['Real and equal', 'Real and distinct', 'Complex conjugates', 'Zero'],
    correct: 1,
    explanation: 'When b² - 4ac > 0, the quadratic equation possesses two distinct real roots.',
  },
  {
    question: 'In flowering plants, the process of double fertilisation results in the formation of:',
    subject: 'Biology',
    chapter: 'Sexual Reproduction in Flowering Plants',
    options: ['Zygote only', 'Endosperm only', 'Diploid Zygote and Triploid Endosperm', 'Embryo Sac'],
    correct: 2,
    explanation: 'One male gamete fuses with the egg (syngamy) to form a 2n zygote, while the other fuses with polar nuclei (triple fusion) to form 3n endosperm.',
  },
];

export const PracticeView: React.FC = () => {
  const { chapterProgressMap, weakSubjectAnalysis } = useOnboarding();
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
      toast.error('Incorrect. Review the concept explanation below.', { icon: '💡' });
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
            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-500/30 text-xs space-y-1">
              <span className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" />
                <span>Concept Breakdown</span>
              </span>
              <p className="text-purple-900/80 dark:text-purple-200/80 leading-relaxed">
                {q.explanation}
              </p>
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
