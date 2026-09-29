import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigation } from '@/contexts/NavigationContext';
import { useAuth } from '@/hooks/use-auth';
import { commandCenterService } from '@/services/command-center-service';
import { ExamCommandCenterData } from '@/types/command-center';
import {
  Compass,
  Clock,
  Sparkles,
  Zap,
  Target,
  ArrowRight,
  TrendingUp,
  Award,
  ChevronRight,
  Flame,
  Shield,
  AlertTriangle,
} from 'lucide-react';

export const ExamCommandCenterCard: React.FC = () => {
  const { setActiveTab } = useNavigation();
  const { user } = useAuth();
  const [data, setData] = useState<ExamCommandCenterData | null>(() =>
    commandCenterService.getCachedData()
  );

  useEffect(() => {
    const userId = user?.uid || 'guest';
    commandCenterService.init(userId).then((res) => {
      setData(res);
    });

    const unsub = commandCenterService.subscribe((res) => {
      setData(res);
    });

    return () => unsub();
  }, [user?.uid]);

  const countdown = data?.countdown;
  const daysLeft = countdown?.daysRemaining || 18;
  const hoursLeft = countdown?.hoursRemaining || 14;
  const readiness = data?.overallReadinessPercent || 84;
  const status = data?.currentPreparationStatus || 'Optimal Sprint';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.004 }}
      transition={{ duration: 0.25 }}
      onClick={() => setActiveTab('command' as any)}
      className="relative overflow-hidden rounded-3xl p-5 sm:p-7 bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white border border-indigo-500/35 shadow-2xl cursor-pointer group transition-all hover:border-indigo-400/50"
    >
      {/* Background Animated Ambient Lights */}
      <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none group-hover:bg-indigo-500/25 transition-all duration-700" />
      <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-purple-500/15 blur-3xl pointer-events-none group-hover:bg-purple-500/20 transition-all duration-700" />

      <div className="relative z-10 space-y-4">
        {/* Top Tag & Status */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/25 border border-indigo-400/40 text-indigo-300 text-xs font-black uppercase tracking-wider shadow-sm">
              <Compass className="w-3.5 h-3.5 text-indigo-300 animate-pulse" />
              <span>Exam Command Center</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/35 text-emerald-300 text-[11px] font-bold font-mono">
              <Flame className="w-3 h-3 text-emerald-400" />
              <span>{status}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button className="px-3.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold border border-white/15 flex items-center gap-1.5 cursor-pointer transition-colors group-hover:translate-x-0.5">
              <span>Enter 30-Sec Dashboard</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Hero Title & Description */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
              Complete Exam Intelligence in Under 30 Seconds
            </h3>
            <p className="text-xs sm:text-sm text-indigo-100/80 leading-relaxed font-normal">
              Live syllabus completion, AI strategy, conservative predicted board ranges, urgent tasks, and time productivity cycles in a single unified command deck.
            </p>
          </div>

          {/* Countdown & Readiness Dual Highlight */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-center min-w-[110px]">
              <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider block">
                Countdown
              </span>
              <div className="text-2xl font-black font-mono text-white mt-0.5">
                {daysLeft}d {hoursLeft}h
              </div>
              <span className="text-[10px] text-indigo-300 font-medium">To Board Exam</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-center min-w-[110px]">
              <span className="text-[10px] text-purple-200 font-bold uppercase tracking-wider block">
                Readiness
              </span>
              <div className="text-2xl font-black font-mono text-emerald-400 mt-0.5">
                {readiness}%
              </div>
              <span className="text-[10px] text-emerald-300 font-medium">Score: 88–94%</span>
            </div>
          </div>
        </div>

        {/* 3 Quick Telemetry Snippets */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs text-xs space-y-1">
            <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">
              🎯 Today's Command Focus
            </span>
            <div className="font-extrabold text-white truncate">
              {data?.aiStrategy?.todaysFocus || 'Electrochemistry & Current Electricity'}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs text-xs space-y-1">
            <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider block">
              ⚠️ Urgent Vulnerability
            </span>
            <div className="font-extrabold text-rose-300 truncate">
              {data?.urgentTasks?.[0]?.title || 'Kirchhoff Loop Sign Rule Trap'}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs text-xs space-y-1">
            <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">
              ⏱️ Golden Focus Window
            </span>
            <div className="font-extrabold text-emerald-400 font-mono">
              6:00 PM – 8:00 PM IST (94% Acc)
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
