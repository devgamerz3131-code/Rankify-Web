import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigation } from '@/contexts/NavigationContext';
import { useAuth } from '@/hooks/use-auth';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { weaknessService } from '@/services/weakness-service';
import { WeaknessOverallData } from '@/types/weakness';
import {
  Brain,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Zap,
  Target,
  Clock,
  ShieldAlert,
} from 'lucide-react';

export const WeaknessAnalyzerCard: React.FC = () => {
  const { setActiveTab } = useNavigation();
  const { user } = useAuth();
  const { chapterProgressMap, upcomingExam } = useOnboarding();

  const [data, setData] = useState<WeaknessOverallData | null>(() =>
    weaknessService.getCachedData()
  );

  useEffect(() => {
    const userId = user?.uid || 'guest';
    const chapters = Object.values(chapterProgressMap || {});
    weaknessService.init(userId).then((res) => {
      setData(res);
    });

    const unsub = weaknessService.subscribe((res) => {
      setData(res);
    });

    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    const chapters = Object.values(chapterProgressMap || {});
    if (chapters.length > 0) {
      const res = weaknessService.analyze(chapters, undefined, upcomingExam);
      setData(res);
    }
  }, [chapterProgressMap, upcomingExam]);

  const overallWeakness = data?.overallWeaknessScore ?? 28;
  const healthScore = data?.overallHealthScore ?? 72;
  const strongest = data?.strongestSubject ?? { name: 'Mathematics', score: 88 };
  const weakest = data?.weakestSubject ?? { name: 'Chemistry', score: 58 };
  const urgentCount = data?.needsImmediateAttentionCount ?? 3;
  const top3 = data?.top3WeakChapters?.slice(0, 3) ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.006 }}
      transition={{ duration: 0.2 }}
      onClick={() => setActiveTab('weakness' as any)}
      className="relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-rose-950/80 to-purple-950 text-white border border-rose-500/25 shadow-2xl cursor-pointer group transition-all hover:border-rose-400/40"
    >
      {/* Background ambient lighting */}
      <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-rose-500/10 blur-3xl pointer-events-none group-hover:bg-rose-500/20 transition-all" />
      <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Header Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/35 text-rose-300 text-xs font-black uppercase tracking-wider">
              <Brain className="w-3.5 h-3.5 text-rose-400" />
              <span>AI Weakness Analyzer</span>
            </span>

            {urgentCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/25 border border-rose-500/40 text-rose-300 text-[11px] font-extrabold animate-pulse">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                <span>{urgentCount} Needs Immediate Attention</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 flex items-center gap-1 cursor-pointer transition-colors group-hover:translate-x-0.5">
              <span>Diagnosis & Recovery</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Headline & Overview Split */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Root-Cause Behavioral Diagnosis</span>
            </h3>
            <p className="text-xs text-rose-100/80 leading-relaxed font-medium">
              We don't just say a chapter is weak. Rankify detects <strong className="text-white">WHY</strong> it's struggling (lack of practice, unrevised formulas, calculation traps) and calculates exact recovery timelines.
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[95px]">
              <span className="text-[10px] text-rose-300 font-bold uppercase tracking-wider block">
                Weakness Score
              </span>
              <span className="text-2xl font-black font-mono text-rose-400 mt-0.5 block">
                {overallWeakness}%
              </span>
              <span className="text-[9px] text-slate-300 font-mono">
                {overallWeakness <= 25 ? 'Low Weakness' : 'Action Required'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[95px]">
              <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">
                Health Score
              </span>
              <span className="text-2xl font-black font-mono text-emerald-400 mt-0.5 block">
                {healthScore}%
              </span>
              <span className="text-[9px] text-slate-300 font-mono">
                Mastery Index
              </span>
            </div>
          </div>
        </div>

        {/* Subject Comparison Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Strongest Subject */}
          <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/25 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-emerald-300 font-bold uppercase block">
                  Strongest Subject
                </span>
                <span className="font-extrabold text-xs text-white">
                  {strongest.name}
                </span>
              </div>
            </div>
            <span className="font-mono font-black text-sm text-emerald-400">
              {strongest.score}% Mastery
            </span>
          </div>

          {/* Weakest Subject */}
          <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/25 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <TrendingDown className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-rose-300 font-bold uppercase block">
                  Weakest Subject
                </span>
                <span className="font-extrabold text-xs text-white">
                  {weakest.name}
                </span>
              </div>
            </div>
            <span className="font-mono font-black text-sm text-rose-400">
              {weakest.score}% (Priority)
            </span>
          </div>
        </div>

        {/* Top 3 Weak Chapters List */}
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-bold text-rose-200 uppercase tracking-wider flex items-center justify-between">
            <span>Top 3 Chapters Needing Surgery:</span>
            <span className="text-[10px] text-slate-300 font-normal">Click to open smart recovery plan</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {top3.map((ch, idx) => {
              const rootCause = ch.rootCauses[0]?.cause || 'Low Practice';
              return (
                <div
                  key={ch.chapterId}
                  className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex flex-col justify-between space-y-2"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] text-rose-300 font-bold uppercase truncate">
                        {ch.subjectName}
                      </span>
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {ch.weaknessLevel}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-white line-clamp-1">
                      {ch.chapterName}
                    </h4>

                    <div className="text-[11px] text-amber-300/90 font-medium flex items-center gap-1 mt-1 truncate">
                      <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>Cause: {rootCause}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                    <span className="text-slate-300">
                      Recovery: <strong className="text-white">{ch.estimatedRecoveryDays} Days</strong>
                    </span>
                    <span className="font-mono font-bold text-rose-300">
                      {ch.confidence}% Conf.
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
