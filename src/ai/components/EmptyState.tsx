import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, BookOpen, Atom, Calculator, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface EmptyStateProps {
  onSelectSuggestion: (promptText: string) => void;
}

const SUGGESTIONS = [
  {
    subject: 'Chemistry',
    title: 'Explain Electrochemistry',
    desc: 'NCERT explanation, Nernst equation, board pattern & numericals',
    icon: Atom,
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  {
    subject: 'Physics',
    title: 'Explain Electric Charges and Fields',
    desc: 'Gauss\'s law, dipole derivations, board PYQs & memory tricks',
    icon: Zap,
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  {
    subject: 'Maths',
    title: 'Explain Integrals',
    desc: 'Integration by parts, substitution, board proofs & formulas',
    icon: Calculator,
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  },
  {
    subject: 'Chemistry',
    title: 'Explain Chemical Kinetics',
    desc: 'Rate laws, Arrhenius equation, order vs molecularity',
    icon: Atom,
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
];

export const EmptyState: React.FC<EmptyStateProps> = ({ onSelectSuggestion }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto my-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-xl shadow-purple-500/20 mb-5 border border-white/20"
      >
        <Sparkles className="w-8 h-8" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="text-2xl font-black tracking-tight text-foreground"
      >
        Rankify AI Prompt Engine
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="text-sm text-muted-foreground mt-2 max-w-md"
      >
        Ask any CBSE Class 12 Science concept. Rankify crafts expert, pedagogical study prompts structured strictly for 95%+ board mastery.
      </motion.p>

      {/* Architecture Badge */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-muted-foreground border border-slate-200 dark:border-slate-700"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>100% Offline Architecture • Zero External API Calls • Private Local Storage</span>
      </motion.div>

      {/* Suggested prompts grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-8 text-left">
        {SUGGESTIONS.map((s, idx) => {
          const Icon = s.icon;
          return (
            <motion.button
              key={s.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 + idx * 0.05 }}
              onClick={() => onSelectSuggestion(s.title)}
              className="p-3.5 rounded-2xl bg-card border border-slate-200/80 dark:border-white/10 hover:border-purple-500/50 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${s.badgeColor}`}
                  >
                    {s.subject}
                  </span>
                  <Icon className="w-4 h-4 text-muted-foreground group-hover:text-purple-500 transition-colors" />
                </div>
                <div className="font-bold text-xs text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {s.title}
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-snug">
                  {s.desc}
                </p>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Generate Prompt</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
