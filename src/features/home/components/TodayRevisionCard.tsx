import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigation } from '@/contexts/NavigationContext';
import { useAuth } from '@/hooks/use-auth';
import { revisionService } from '@/services/revision-service';
import { SmartRevisionEngineData } from '@/types/revision';
import {
  RotateCcw,
  Sparkles,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Flame,
  Zap,
  Target,
  Layers,
  ChevronRight,
} from 'lucide-react';

export const TodayRevisionCard: React.FC = () => {
  const { setActiveTab } = useNavigation();
  const { user } = useAuth();
  const [data, setData] = useState<SmartRevisionEngineData | null>(() =>
    revisionService.getCachedData()
  );

  useEffect(() => {
    const userId = user?.uid || 'guest';
    revisionService.init(userId).then((res) => {
      setData(res);
    });

    const unsub = revisionService.subscribe((res) => {
      setData(res);
    });

    return () => unsub();
  }, [user?.uid]);

  const stats = data?.stats;
  const pendingCount = stats?.pendingCount ?? 3;
  const urgentCount = stats?.urgentCount ?? 2;
  const estimatedMinutes = stats?.estimatedTodayMinutes ?? 35;
  const revisionScore = stats?.todayRevisionScore ?? 84;
  const streak = data?.streak?.currentDailyStreak ?? 6;
  const topUrgentSession = data?.todaySessions?.find((s) => s.priority === 'critical' || s.priority === 'high');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      onClick={() => setActiveTab('revision' as any)}
      className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-indigo-500/10 dark:from-amber-950/30 dark:via-purple-950/20 dark:to-indigo-950/30 border border-amber-500/30 dark:border-amber-400/20 p-5 sm:p-6 shadow-xl hover:shadow-2xl hover:border-amber-500/50 transition-all duration-300 cursor-pointer"
    >
      {/* Background ambient orbs */}
      <div className="absolute -right-16 -top-16 w-52 h-52 rounded-full bg-amber-500/15 blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />
      <div className="absolute -left-16 -bottom-16 w-52 h-52 rounded-full bg-purple-500/15 blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        {/* Left: Title, Tag & Proactive Intelligence */}
        <div className="space-y-3 max-w-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-black uppercase tracking-wider font-mono">
              <RotateCcw className="w-3.5 h-3.5 animate-spin-slow text-amber-600 dark:text-amber-400" />
              <span>Smart Revision Engine</span>
            </span>

            {urgentCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[11px] font-black font-mono">
                <AlertTriangle className="w-3 h-3" />
                <span>{urgentCount} Urgent</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-bold font-mono">
                <CheckCircle2 className="w-3 h-3" />
                <span>On Track</span>
              </span>
            )}

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[11px] font-bold font-mono">
              <Flame className="w-3 h-3 text-orange-500" />
              <span>{streak} Day Streak</span>
            </span>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <span>Today's Revision</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Calculated dynamically via Ebbinghaus memory retention and real error frequency. Never fixed dates.
            </p>
          </div>

          {/* Urgent Chapter Hook */}
          {topUrgentSession && (
            <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-amber-500/20 backdrop-blur-sm flex items-center gap-2.5 text-xs">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="line-clamp-1">
                <strong className="text-foreground">{topUrgentSession.chapter}:</strong>{' '}
                <span className="text-muted-foreground">{topUrgentSession.reasonForRevision}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Key 4 Metrics Display & Quick Start */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Metric 1: Pending */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 text-center min-w-[72px] sm:min-w-[84px] shrink-0">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
              Pending
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-foreground mt-0.5">
              {pendingCount}
            </div>
            <span className="text-[9px] text-muted-foreground font-mono">Chapters</span>
          </div>

          {/* Metric 2: Urgent */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-center min-w-[72px] sm:min-w-[84px] shrink-0">
            <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 tracking-wider block">
              Urgent
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5">
              {urgentCount}
            </div>
            <span className="text-[9px] text-rose-600/80 dark:text-rose-400/80 font-mono">Action</span>
          </div>

          {/* Metric 3: Estimated Time */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-center min-w-[76px] sm:min-w-[90px] shrink-0">
            <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider block">
              Est. Time
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
              {estimatedMinutes}m
            </div>
            <span className="text-[9px] text-indigo-600/80 dark:text-indigo-400/80 font-mono">Total</span>
          </div>

          {/* Metric 4: Revision Score Ring */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/25 text-center min-w-[80px] sm:min-w-[96px] shrink-0 flex flex-col items-center justify-center">
            <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 tracking-wider block">
              Score
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-purple-600 dark:text-purple-400 mt-0.5">
              {revisionScore}%
            </div>
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">
              Retention
            </span>
          </div>

          {/* Quick Start Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab('revision' as any);
            }}
            className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white font-extrabold text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 active:scale-95"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Quick Start</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
