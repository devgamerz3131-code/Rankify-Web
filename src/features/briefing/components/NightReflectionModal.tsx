import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { briefingService } from '@/services/briefing-service';
import {
  Moon,
  Sparkles,
  Star,
  CheckCircle2,
  X,
  Battery,
  Brain,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface NightReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NightReflectionModal: React.FC<NightReflectionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [completedNotes, setCompletedNotes] = useState('Finished Wave Optics numericals and Current Electricity drift formula review.');
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([
    'Numerical Calculation Speed & Log conversions',
  ]);
  const [focusScore, setFocusScore] = useState<number>(4);
  const [energyLevel, setEnergyLevel] = useState<number>(3);
  const [mentalFatigue, setMentalFatigue] = useState<'low' | 'moderate' | 'high'>('low');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const COMMON_DIFFICULTIES = [
    'Numerical Calculation Speed & Log conversions',
    'Derivation Step Memorization',
    'Afternoon Focus Slump',
    'Formula Confusion under Timed Conditions',
    'Definite Integral Transformation Rules',
    'Organic Chemistry Reaction Mechanism Steps',
  ];

  const toggleDifficulty = (item: string) => {
    if (selectedDifficulties.includes(item)) {
      setSelectedDifficulties(selectedDifficulties.filter((d) => d !== item));
    } else {
      setSelectedDifficulties([...selectedDifficulties, item]);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await briefingService.saveNightReflection(
        completedNotes,
        selectedDifficulties,
        focusScore,
        energyLevel,
        mentalFatigue,
        notes
      );
      toast.success('Night Reflection recorded! Rankify AI Memory updated.', {
        icon: '🌙',
      });
      onClose();
    } catch (err) {
      toast.error('Failed to save reflection');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-xl rounded-3xl bg-card border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-indigo-950 to-purple-950 text-white flex items-center justify-between border-b border-white/10">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 font-mono flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-amber-300" />
              <span>Rankify Night Reflection & Cognitive Journal</span>
            </span>
            <h3 className="text-base sm:text-lg font-black">
              How was your study session today?
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Questions Form */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-foreground">
          {/* Question 1: What did you complete? */}
          <div className="space-y-1.5">
            <label className="font-extrabold text-foreground flex items-center gap-1.5 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>What did you accomplish today?</span>
            </label>
            <textarea
              value={completedNotes}
              onChange={(e) => setCompletedNotes(e.target.value)}
              placeholder="e.g. Completed 20 physics numericals and reviewed electrochemistry Nernst derivations..."
              className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs text-foreground resize-none h-18"
            />
          </div>

          {/* Question 2: What was difficult? */}
          <div className="space-y-2">
            <label className="font-extrabold text-foreground flex items-center gap-1.5 text-xs">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>What was difficult or frustrating? (Updates AI Weakness Tracking)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_DIFFICULTIES.map((diff, idx) => {
                const isSelected = selectedDifficulties.includes(diff);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDifficulty(diff)}
                    className={`px-3 py-1.5 rounded-xl border text-[11px] font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300 font-bold'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200/80 dark:border-white/5 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {diff}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question 3: Focus & Energy Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border space-y-2">
              <span className="text-[11px] font-bold text-foreground block">
                Focus Quality: {focusScore}/5
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFocusScore(star)}
                    className="p-1 cursor-pointer transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= focusScore
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300 dark:text-slate-700'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border space-y-2">
              <span className="text-[11px] font-bold text-foreground block">
                Mental Fatigue Level
              </span>
              <div className="grid grid-cols-3 gap-1 text-[11px] font-mono text-center">
                {(['low', 'moderate', 'high'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setMentalFatigue(lvl)}
                    className={`p-1.5 rounded-xl capitalize font-bold border cursor-pointer ${
                      mentalFatigue === lvl
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white dark:bg-slate-800 text-muted-foreground border-slate-200 dark:border-white/5'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Question 4: Additional Notes */}
          <div className="space-y-1.5">
            <label className="font-extrabold text-foreground flex items-center gap-1.5 text-xs">
              <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
              <span>Personal Diary Note (Private to Student)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Slept 7 hours last night, felt sharper before lunch."
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs text-foreground"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-900 border-t border-slate-200/80 dark:border-white/5 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground font-mono">
            Answers refine tomorrow’s Energy-Based Plan
          </span>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs cursor-pointer shadow-md shadow-purple-500/20 disabled:opacity-50"
          >
            {isSubmitting ? 'Recording...' : 'Submit Reflection'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
