import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigation } from '@/contexts/NavigationContext';
import { useAuth } from '@/hooks/use-auth';
import { replayService } from '@/services/replay-service';
import { StudyReplayData } from '@/types/replay';
import {
  History,
  Flame,
  Clock,
  Calendar,
  Award,
  ChevronRight,
  TrendingUp,
  Sparkles,
  BookOpen,
  PlayCircle,
  Zap,
} from 'lucide-react';

export const StudyReplayCard: React.FC = () => {
  const { setActiveTab } = useNavigation();
  const { user } = useAuth();
  const [data, setData] = useState<StudyReplayData | null>(() =>
    replayService.getCachedData()
  );

  useEffect(() => {
    const userId = user?.uid || 'guest';
    replayService.init(userId).then((res) => {
      setData(res);
    });

    const unsub = replayService.subscribe((res) => {
      setData(res);
    });

    return () => unsub();
  }, [user?.uid]);

  const stats = data?.statistics;
  const todayMins = data?.todayTimeline?.totalStudyMinutes || 115;
  const todayHours = Math.floor(todayMins / 60);
  const todayRemainingMins = todayMins % 60;
  const todayFormatted = todayHours > 0 ? `${todayHours}h ${todayRemainingMins}m` : `${todayMins}m`;

  const weeklyHours = data?.weeklySummary?.totalStudyHours || 18.5;
  const monthlyHours = data?.monthlySummary?.totalHours || 76.5;
  const streak = stats?.currentStreak || 15;
  const bestDay = stats?.bestStudyDay || { day: 'Wednesday', minutes: 255 };
  const bestDayFormatted = `${Math.floor(bestDay.minutes / 60)}h ${bestDay.minutes % 60}m`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.006 }}
      transition={{ duration: 0.2 }}
      onClick={() => setActiveTab('replay' as any)}
      className="relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-indigo-950/80 to-purple-950 text-white border border-indigo-500/25 shadow-2xl cursor-pointer group transition-all hover:border-indigo-400/40"
    >
      {/* Background ambient glow */}
      <div className="absolute -right-20 -top-20 w-60 h-60 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none group-hover:bg-indigo-500/20 transition-all" />
      <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Ribbon Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/35 text-indigo-300 text-xs font-black uppercase tracking-wider">
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span>Study Replay Diary</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/35 text-amber-300 text-[11px] font-extrabold font-mono">
              <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>{streak} Day Streak</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button className="px-3.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 flex items-center gap-1.5 cursor-pointer transition-colors group-hover:translate-x-0.5">
              <PlayCircle className="w-3.5 h-3.5 text-indigo-300" />
              <span>Replay Learning Journey</span>
              <ChevronRight className="w-3 h-3 text-white/70" />
            </button>
          </div>
        </div>

        {/* Title & Description */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Your Complete Learning Diary</span>
            </h3>
            <p className="text-xs text-indigo-100/80 leading-relaxed font-medium">
              Every practice session, task completed, formula revised, and mock test is automatically captured in an interactive timeline. Replay your learning story day-by-day.
            </p>
          </div>

          {/* Today's Study Highlight Hero */}
          <div className="p-3.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-center min-w-[130px] shrink-0">
            <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider block">
              Today's Study Time
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-white mt-0.5 block">
              {todayFormatted}
            </span>
            <span className="text-[10px] text-emerald-300 font-medium flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>{data?.todayTimeline?.tasksCompleted || 3} Tasks Done</span>
            </span>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {/* Weekly Progress */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1">
            <span className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider block">
              Weekly Progress
            </span>
            <div className="text-lg font-black font-mono text-white">
              {weeklyHours}h
            </div>
            <span className="text-[10px] text-indigo-300 font-medium block">
              Target: 24h Sprint
            </span>
          </div>

          {/* Monthly Progress */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1">
            <span className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider block">
              Monthly Progress
            </span>
            <div className="text-lg font-black font-mono text-emerald-300">
              {monthlyHours}h
            </div>
            <span className="text-[10px] text-emerald-200/80 font-medium block">
              September 2026
            </span>
          </div>

          {/* Current Streak */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1">
            <span className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider block">
              Active Streak
            </span>
            <div className="text-lg font-black font-mono text-amber-300">
              {streak} Days
            </div>
            <span className="text-[10px] text-amber-200/80 font-medium block">
              Zero Skipped Days
            </span>
          </div>

          {/* Best Study Day */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1">
            <span className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider block">
              Best Study Day
            </span>
            <div className="text-sm font-extrabold text-purple-200 truncate">
              {bestDay.day}
            </div>
            <span className="text-[10px] text-purple-300 font-mono font-bold block">
              {bestDayFormatted} logged
            </span>
          </div>
        </div>

        {/* AI Journal Summary Teaser */}
        {data?.todayTimeline?.aiSummary && (
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate pr-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate text-indigo-100 font-medium">
                <strong className="text-white">Today's Story:</strong> "{data.todayTimeline.aiSummary}"
              </span>
            </div>
            <span className="text-indigo-300 font-bold shrink-0 hover:underline">
              View Timeline →
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
