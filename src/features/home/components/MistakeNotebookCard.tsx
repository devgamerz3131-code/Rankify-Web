import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigation } from '@/contexts/NavigationContext';
import { useAuth } from '@/hooks/use-auth';
import { mistakeService } from '@/services/mistake-service';
import { MistakeStatistics } from '@/types/mistake';
import { BookX, Flame, Calendar, Target, ArrowRight, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export const MistakeNotebookCard: React.FC = () => {
  const { setActiveTab } = useNavigation();
  const { user } = useAuth();
  const [stats, setStats] = useState<MistakeStatistics>(() => mistakeService.getStatistics());

  useEffect(() => {
    if (user?.uid) {
      mistakeService.loadMistakes(user.uid).then(() => {
        setStats(mistakeService.getStatistics());
      });
    }

    const unsub = mistakeService.subscribe(() => {
      setStats(mistakeService.getStatistics());
    });
    return () => unsub();
  }, [user?.uid]);

  const formatLastRevised = (dateIso: string | null) => {
    if (!dateIso) return 'Never';
    const date = new Date(dateIso);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.008 }}
      transition={{ duration: 0.2 }}
      onClick={() => setActiveTab('mistakes' as any)}
      className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-rose-950/70 via-slate-900 to-indigo-950/80 border border-rose-500/25 shadow-xl hover:border-rose-400/40 cursor-pointer group transition-all"
    >
      {/* Background Subtle Ambient Glow */}
      <div className="absolute -right-16 -top-16 w-52 h-52 rounded-full bg-rose-500/10 blur-3xl pointer-events-none group-hover:bg-rose-500/20 transition-all" />
      <div className="absolute -left-16 -bottom-16 w-52 h-52 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Left Info Column */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/35 text-rose-300 text-xs font-extrabold tracking-wide uppercase">
              <BookX className="w-3.5 h-3.5 text-rose-400" />
              <span>Personal Mistake Notebook</span>
            </span>

            {stats.pendingTodayCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30 animate-pulse">
                <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{stats.pendingTodayCount} Due Today</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>All Caught Up</span>
              </span>
            )}
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Learn From Mistakes, Master CBSE PCM</span>
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Every incorrect answer is automatically captured with step-by-step reasoning and spaced repetition recall. Never repeat the same conceptual slip-up in board exams!
          </p>
        </div>

        {/* Right CTA */}
        <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
          <div className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-black text-xs px-4 py-2.5 rounded-2xl shadow-lg shadow-rose-950/40 transition-all group-hover:gap-3">
            <span>Open Mistake Notebook</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>

      {/* 4 Required Metric Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10 relative z-10">
        {/* 1. Total Mistakes */}
        <div className="p-3.5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-rose-200/90 font-bold">
            <span className="text-base">📕</span>
            <span>Total Mistakes</span>
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {stats.totalMistakes}
          </div>
          <p className="text-[10px] text-slate-400">Captured in personal vault</p>
        </div>

        {/* 2. Mistakes to Revise Today */}
        <div className="p-3.5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-amber-200/90 font-bold">
            <span className="text-base">🔥</span>
            <span>Revise Today</span>
          </div>
          <div className="text-2xl font-black font-mono text-amber-300">
            {stats.pendingTodayCount}
          </div>
          <p className="text-[10px] text-amber-200/70">Spaced repetition schedule</p>
        </div>

        {/* 3. Last Revised */}
        <div className="p-3.5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-indigo-200/90 font-bold">
            <span className="text-base">📅</span>
            <span>Last Revised</span>
          </div>
          <div className="text-base sm:text-lg font-black text-indigo-200 pt-1">
            {formatLastRevised(stats.lastRevisedDate)}
          </div>
          <p className="text-[10px] text-slate-400">Recent recall session</p>
        </div>

        {/* 4. Accuracy Improvement */}
        <div className="p-3.5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-emerald-200/90 font-bold">
            <span className="text-base">🎯</span>
            <span>Accuracy Boost</span>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">
            +{stats.accuracyImprovementPct}%
          </div>
          <p className="text-[10px] text-emerald-200/70">{stats.resolvedCount} errors resolved</p>
        </div>
      </div>
    </motion.div>
  );
};
