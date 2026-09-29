import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigation } from '@/contexts/NavigationContext';
import { briefingService } from '@/services/briefing-service';
import { BriefingState, BriefingTone } from '@/types/briefing';
import {
  Sparkles,
  Zap,
  Flame,
  Clock,
  Award,
  ChevronRight,
  ArrowRight,
  Smile,
  ShieldAlert,
  Compass,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export const DailyBriefingHomeCard: React.FC = () => {
  const { setActiveTab } = useNavigation();
  const [state, setState] = useState<BriefingState>(() => briefingService.getCachedState());

  useEffect(() => {
    const unsub = briefingService.subscribe((s) => {
      setState(s);
    });
    return () => unsub();
  }, []);

  const { currentBriefing, memoryProfile } = state;
  const topMission = currentBriefing.missions[0];

  const getToneIcon = (tone: BriefingTone) => {
    switch (tone) {
      case 'savage_friend':
        return Flame;
      case 'motivational_mentor':
        return Zap;
      case 'strict_coach':
        return ShieldAlert;
      case 'friendly_teacher':
        return Smile;
      case 'calm_guide':
        return Compass;
      default:
        return Sparkles;
    }
  };

  const ToneIcon = getToneIcon(currentBriefing.tone);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      onClick={() => setActiveTab('briefing' as any)}
      className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-500/15 via-indigo-500/10 to-pink-500/10 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-pink-950/20 border border-purple-500/35 dark:border-purple-400/25 p-5 sm:p-6 shadow-xl hover:shadow-2xl hover:border-purple-500/60 transition-all duration-300 cursor-pointer"
    >
      <div className="absolute -right-16 -top-16 w-52 h-52 rounded-full bg-purple-500/20 blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />
      <div className="absolute -left-16 -bottom-16 w-52 h-52 rounded-full bg-pink-500/15 blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-3 max-w-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-xs font-black uppercase tracking-wider font-mono">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>AI Daily Briefing Engine</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-bold font-mono">
              <ToneIcon className="w-3 h-3 text-amber-500" />
              <span className="capitalize">{currentBriefing.tone.replace('_', ' ')}</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold font-mono">
              <span>{memoryProfile.streakDays}-Day Streak</span>
            </span>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <span>{currentBriefing.greetingTitle}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </h2>
            <p className="text-xs sm:text-sm text-foreground/80 font-medium italic mt-1 line-clamp-2">
              "{currentBriefing.aiMessage}"
            </p>
          </div>

          {/* Top Priority Mission Highlight */}
          {topMission && (
            <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-purple-500/20 backdrop-blur-sm flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 line-clamp-1">
                <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 font-mono text-[10px] font-bold uppercase shrink-0">
                  Top Priority
                </span>
                <span className="text-foreground font-semibold truncate">{topMission.title}</span>
              </div>

              <span className="text-[10px] font-mono text-muted-foreground shrink-0 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{topMission.durationMinutes}m</span>
              </span>
            </div>
          )}
        </div>

        {/* Right Metrics & Quick Launch */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="p-3 sm:p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 text-center min-w-[76px] sm:min-w-[84px] shrink-0">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
              Readiness
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-500 mt-0.5">
              {currentBriefing.readinessScore}%
            </div>
            <span className="text-[9px] text-muted-foreground font-mono">Score</span>
          </div>

          <div className="p-3 sm:p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-center min-w-[76px] sm:min-w-[84px] shrink-0">
            <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider block">
              Countdown
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
              {currentBriefing.examCountdownDays}d
            </div>
            <span className="text-[9px] text-indigo-600/80 dark:text-indigo-400/80 font-mono">To Board</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab('briefing' as any);
            }}
            className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-extrabold text-xs shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 active:scale-95"
          >
            <Sparkles className="w-4 h-4 fill-white" />
            <span>Open Briefing</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
