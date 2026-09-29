import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormulaItem, FormulaPracticeExercise } from '@/types/formula';
import { formulaService } from '@/services/formula-service';
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  X,
  ArrowRight,
  HelpCircle,
  Award,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface FormulaPracticeModalProps {
  formula: FormulaItem;
  isOpen: boolean;
  onClose: () => void;
}

export const FormulaPracticeModal: React.FC<FormulaPracticeModalProps> = ({
  formula,
  isOpen,
  onClose,
}) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  if (!isOpen || formula.practiceExercises.length === 0) return null;

  const currentExercise = formula.practiceExercises[currentExerciseIndex] || formula.practiceExercises[0];

  const handleSubmitOption = async (option: string) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(option);
    setIsAnswerSubmitted(true);

    const correct =
      option.trim().toLowerCase() === currentExercise.correctAnswer.trim().toLowerCase() ||
      option.trim() === currentExercise.correctOption?.trim();

    setIsCorrect(correct);

    await formulaService.recordPracticeAttempt(formula.id, correct);

    if (correct) {
      toast.success('Correct formula application! Confidence boosted.', { icon: '🎯' });
    } else {
      toast.error('Trap identified! Formula logged into Mistake Notebook.', { icon: '⚠️' });
    }
  };

  const handleNextExercise = () => {
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setIsCorrect(false);
    if (currentExerciseIndex < formula.practiceExercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg rounded-3xl bg-card border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-950 text-white flex items-center justify-between border-b border-white/10">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 font-mono flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Formula Application Drill • Exercise {currentExerciseIndex + 1} of {formula.practiceExercises.length}
              </span>
            </span>
            <h3 className="text-base font-black truncate">{formula.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-mono font-bold uppercase">
              {currentExercise.type.replace('_', ' ')}
            </span>
            <span className="text-[11px] font-mono text-muted-foreground font-semibold">
              Difficulty: <strong className="text-foreground">{currentExercise.difficulty}</strong>
            </span>
          </div>

          <p className="text-sm font-bold text-foreground leading-relaxed">
            {currentExercise.question}
          </p>

          {/* Multiple Choice Options if present */}
          {currentExercise.options && (
            <div className="space-y-2">
              {currentExercise.options.map((opt, idx) => {
                const isSelected = selectedOption === opt;
                let btnStyle = 'bg-slate-50 dark:bg-slate-900 border-slate-200/80 dark:border-white/5 hover:border-purple-400';

                if (isAnswerSubmitted) {
                  if (opt === currentExercise.correctOption || opt === currentExercise.correctAnswer) {
                    btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-600 font-bold';
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-600 font-bold';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswerSubmitted}
                    onClick={() => handleSubmitOption(opt)}
                    className={`w-full p-3 rounded-2xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {isAnswerSubmitted && (opt === currentExercise.correctOption || opt === currentExercise.correctAnswer) && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* If open question (e.g. error finding) without options */}
          {!currentExercise.options && !isAnswerSubmitted && (
            <div className="space-y-3">
              <button
                onClick={() => handleSubmitOption(currentExercise.correctAnswer)}
                className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer"
              >
                Reveal Solution & Evaluate
              </button>
            </div>
          )}

          {/* Solution & Explanation on Submit */}
          {isAnswerSubmitted && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-2 text-xs"
            >
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                {isCorrect ? (
                  <span className="text-emerald-500 font-black">✓ Correctly Solved!</span>
                ) : (
                  <span className="text-rose-500 font-black">✗ Exam Trap Detected</span>
                )}
              </div>
              <p className="text-muted-foreground leading-relaxed">{currentExercise.explanation}</p>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 text-[11px] font-medium">
                ⚠️ <strong>Board Alert:</strong> {currentExercise.trapWarning}
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-900 border-t border-slate-200/80 dark:border-white/5 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground font-mono">
            {isAnswerSubmitted ? (isCorrect ? 'Recorded as Mastered' : 'Synced to Mistake Notebook') : 'Select an option to verify'}
          </span>
          {isAnswerSubmitted ? (
            <button
              onClick={handleNextExercise}
              className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs cursor-pointer hover:bg-purple-500 flex items-center gap-1.5"
            >
              <span>{currentExerciseIndex < formula.practiceExercises.length - 1 ? 'Next Exercise' : 'Finish Practice'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground text-xs font-semibold cursor-pointer"
            >
              Skip
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
