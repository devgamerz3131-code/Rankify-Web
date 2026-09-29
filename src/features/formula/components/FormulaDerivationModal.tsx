import React from 'react';
import { motion } from 'framer-motion';
import { FormulaItem } from '@/types/formula';
import {
  BookOpen,
  CheckCircle2,
  Sparkles,
  Award,
  X,
  Shield,
  ArrowRight,
  Info,
} from 'lucide-react';

interface FormulaDerivationModalProps {
  formula: FormulaItem;
  isOpen: boolean;
  onClose: () => void;
}

export const FormulaDerivationModal: React.FC<FormulaDerivationModalProps> = ({
  formula,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !formula.derivation) return null;

  const { derivation } = formula;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-2xl rounded-3xl bg-card border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-white/10">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 font-mono flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Step-by-Step Derivation Breakdown • {derivation.boardMarks} Marks</span>
            </span>
            <h3 className="text-lg font-black">{derivation.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {/* Important Assumptions Box */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
            <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 font-mono flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              <span>Critical Assumptions for CBSE Board Scoring</span>
            </span>
            <ul className="space-y-1 text-foreground leading-relaxed pl-1">
              {derivation.assumptions.map((assump, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{assump}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Sequential Steps */}
          <div className="space-y-4">
            {derivation.steps.map((step) => (
              <div
                key={step.stepNumber}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-white/5 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-foreground flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-mono text-[10px] flex items-center justify-center">
                      {step.stepNumber}
                    </span>
                    <span>{step.title}</span>
                  </span>
                </div>

                {/* Mathematical Equation Display */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border font-mono font-bold text-center text-purple-600 dark:text-purple-400 text-xs sm:text-sm">
                  {step.latexExpression}
                </div>

                <p className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Why this step:</strong> {step.conceptualReason}
                </p>

                {step.boardTip && (
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                    <span>{step.boardTip}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Final Takeaway Result */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent border border-purple-500/30 text-center space-y-1">
            <span className="text-[10px] font-black uppercase text-purple-600 font-mono block">
              Deduction Concluded (Q.E.D.)
            </span>
            <div className="text-base font-black font-mono text-foreground">
              {derivation.finalResult}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-900 border-t border-slate-200/80 dark:border-white/5 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground font-mono">
            {formula.subject} • {formula.chapter}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs cursor-pointer hover:bg-purple-500 transition-colors"
          >
            Done Reviewing
          </button>
        </div>
      </motion.div>
    </div>
  );
};
