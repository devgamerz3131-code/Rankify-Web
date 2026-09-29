import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigation } from '@/contexts/NavigationContext';
import { formulaService } from '@/services/formula-service';
import { FormulaIntelligenceState } from '@/types/formula';
import {
  Zap,
  Sparkles,
  Award,
  ChevronRight,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

export const FormulaIntelligenceCard: React.FC = () => {
  const { setActiveTab } = useNavigation();
  const [state, setState] = useState<FormulaIntelligenceState>(() =>
    formulaService.getCachedState()
  );

  useEffect(() => {
    const unsub = formulaService.subscribe((s) => {
      setState(s);
    });
    return () => unsub();
  }, []);

  const { stats } = state;
  const weakFormula = formulaService.getFormulas().find((f) => state.telemetry[f.id]?.isWeak);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      onClick={() => setActiveTab('formula' as any)}
      className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-purple-500/10 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-purple-950/30 border border-amber-500/30 dark:border-amber-400/20 p-5 sm:p-6 shadow-xl hover:shadow-2xl hover:border-amber-500/50 transition-all duration-300 cursor-pointer"
    >
      <div className="absolute -right-16 -top-16 w-52 h-52 rounded-full bg-amber-500/15 blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />
      <div className="absolute -left-16 -bottom-16 w-52 h-52 rounded-full bg-orange-500/15 blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-3 max-w-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-black uppercase tracking-wider font-mono">
              <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 fill-amber-500" />
              <span>Formula Intelligence Engine</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[11px] font-bold font-mono">
              <Award className="w-3 h-3" />
              <span>{stats.masteredCount} Mastered</span>
            </span>

            {stats.dueForRevisionToday > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[11px] font-bold font-mono">
                <AlertTriangle className="w-3 h-3" />
                <span>{stats.dueForRevisionToday} Due Today</span>
              </span>
            )}
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <span>Today's Formula Revision</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Learn what formulas mean, why derivations work, and spot algebraic traps before exams.
            </p>
          </div>

          {/* Weak Formula Spotlight */}
          {weakFormula && (
            <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-amber-500/20 backdrop-blur-sm flex items-center gap-2.5 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <div className="line-clamp-1">
                <strong className="text-rose-600 dark:text-rose-400">Weak Formula Spotlight:</strong>{' '}
                <span className="text-foreground font-semibold">{weakFormula.name}</span>{' '}
                <span className="text-muted-foreground font-mono">({weakFormula.textDisplay})</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Metrics & Quick Launch */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="p-3 sm:p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 text-center min-w-[76px] sm:min-w-[84px] shrink-0">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
              Mastered
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-500 mt-0.5">
              {stats.masteredCount}
            </div>
            <span className="text-[9px] text-muted-foreground font-mono">PCM</span>
          </div>

          <div className="p-3 sm:p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-center min-w-[76px] sm:min-w-[84px] shrink-0">
            <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 tracking-wider block">
              Weak
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5">
              {stats.weakCount}
            </div>
            <span className="text-[9px] text-rose-600/80 dark:text-rose-400/80 font-mono">Traps</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab('formula' as any);
            }}
            className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white font-extrabold text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 active:scale-95"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Launch Engine</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
