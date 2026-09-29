import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigation } from '@/contexts/NavigationContext';
import { useAuth } from '@/hooks/use-auth';
import { brainService } from '@/services/brain-service';
import { RankifyBrainData, CoachPersonality } from '@/types/brain';
import {
  Brain,
  Sparkles,
  Zap,
  Clock,
  Award,
  ArrowRight,
  Flame,
  Shield,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const RankifyBrainCard: React.FC = () => {
  const { setActiveTab, navigateToAi } = useNavigation();
  const { user } = useAuth();
  const [data, setData] = useState<RankifyBrainData | null>(() =>
    brainService.getCachedData()
  );
  const [isChangingPersonality, setIsChangingPersonality] = useState(false);

  useEffect(() => {
    const userId = user?.uid || 'guest';
    brainService.init(userId).then((res) => {
      setData(res);
    });

    const unsub = brainService.subscribe((res) => {
      setData(res);
    });

    return () => unsub();
  }, [user?.uid]);

  const handlePersonalityChange = async (e: React.MouseEvent, p: CoachPersonality) => {
    e.stopPropagation();
    await brainService.updatePersonality(p);
    toast.success(`AI Coach switched to ${p.toUpperCase()} mode!`);
    setIsChangingPersonality(false);
  };

  const advice = data?.dailyAdvice;
  const mood = advice?.mood;
  const personality = data?.personality || 'mentor';
  const readinessScore = data?.goals?.boardExam?.projectedPercentage || 88;
  const countdown = data?.examCountdownDays || 18;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.004 }}
      transition={{ duration: 0.25 }}
      onClick={() => setActiveTab('brain' as any)}
      className="relative overflow-hidden rounded-3xl p-5 sm:p-7 bg-gradient-to-br from-slate-950 via-purple-950/90 to-indigo-950 text-white border border-purple-500/30 shadow-2xl cursor-pointer group transition-all hover:border-purple-400/50"
    >
      {/* Background Animated Ambient Lights */}
      <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-purple-600/15 blur-3xl pointer-events-none group-hover:bg-purple-600/25 transition-all duration-700" />
      <div className="absolute -left-20 -bottom-20 w-72 h-72 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none group-hover:bg-indigo-600/20 transition-all duration-700" />
      <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Top Ribbon & Personality Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/25 to-indigo-500/25 border border-purple-400/40 text-purple-300 text-xs font-black uppercase tracking-wider shadow-sm">
              <Brain className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
              <span>Rankify Brain</span>
            </span>

            {/* Current Mood Badge */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                advice?.moodBadgeColor || 'bg-purple-500/15 text-purple-300 border-purple-500/30'
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>Mood: {advice?.moodLabel || 'Laser Focused'}</span>
            </span>

            {/* Exam Countdown Badge */}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-bold font-mono">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{countdown} Days to CBSE Exam</span>
            </span>
          </div>

          {/* Personality Switcher Pill Dropdown */}
          <div className="flex items-center gap-2 relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsChangingPersonality(!isChangingPersonality);
              }}
              className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold border border-white/15 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="text-purple-300 font-normal">Tone:</span>
              <span className="capitalize">{personality} Coach</span>
              <ChevronRight className={`w-3 h-3 transition-transform ${isChangingPersonality ? 'rotate-90' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isChangingPersonality && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  className="absolute right-0 top-9 z-30 w-44 rounded-2xl bg-slate-900 border border-purple-500/30 shadow-2xl p-1.5 space-y-1 backdrop-blur-xl"
                >
                  {(['strict', 'friendly', 'savage', 'mentor', 'calm'] as CoachPersonality[]).map((p) => (
                    <button
                      key={p}
                      onClick={(e) => handlePersonalityChange(e, p)}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold capitalize flex items-center justify-between transition-colors ${
                        personality === p
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span>{p} Coach</span>
                      {personality === p && <CheckCircle2 className="w-3 h-3" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Hero Section: Today's AI Advice */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-purple-300">
              Today's AI Mentor Observation
            </span>
          </div>

          <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-snug">
            {advice?.headline || "Your potential is limitless. Today's focus unlocks 95%+ Board Readiness."}
          </h3>

          <p className="text-xs sm:text-sm text-purple-100/80 leading-relaxed font-normal max-w-3xl">
            {advice?.subtext ||
              'Rankify Brain is continuously observing your study rhythm, question accuracy, and revision recency. Follow today’s tailored priority to maximize score velocity.'}
          </p>
        </div>

        {/* Core Intelligence Grid: Today's Priority, Estimated Time, Exam Readiness */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Today's Priority */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1.5">
            <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider block">
              🎯 Today's AI Priority
            </span>
            <div className="text-xs sm:text-sm font-extrabold text-white line-clamp-2">
              {advice?.priorityTask || 'Current Electricity Kirchhoff & Drift Velocity Derivations'}
            </div>
            <div className="text-[10px] text-purple-200/70 font-medium">
              High-yield board questions • +6 Marks
            </div>
          </div>

          {/* Estimated Study Time */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1.5">
            <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">
              ⏱️ Estimated Study Time
            </span>
            <div className="text-lg sm:text-xl font-black font-mono text-white flex items-baseline gap-1">
              <span>{advice?.estimatedMinutes || 40}</span>
              <span className="text-xs font-sans text-indigo-200">minutes required</span>
            </div>
            <div className="text-[10px] text-indigo-200/70 font-medium">
              Best window: 6:00 PM – 8:00 PM
            </div>
          </div>

          {/* Exam Readiness Live Score */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1.5">
            <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">
              🏆 Exam Readiness Gauge
            </span>
            <div className="text-lg sm:text-xl font-black font-mono text-emerald-400 flex items-baseline gap-1.5">
              <span>{readinessScore}%</span>
              <span className="text-[11px] font-sans text-emerald-300/80 font-bold">
                Projected Board Score
              </span>
            </div>
            <div className="text-[10px] text-emerald-200/70 font-medium">
              Target: 95%+ • Pacing on track
            </div>
          </div>
        </div>

        {/* Motivational Quote Ribbon */}
        {advice?.motivationalQuote && (
          <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs italic text-purple-200/90 flex items-center justify-between gap-3">
            <p className="line-clamp-1">{advice.motivationalQuote}</p>
            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider shrink-0 font-mono">
              — AI Coach
            </span>
          </div>
        )}

        {/* Bottom Actions Bar */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-purple-200/70">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Continuous background monitoring active</span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Action Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (advice?.quickAction) {
                  setActiveTab(advice.quickAction.actionType as any);
                } else {
                  setActiveTab('study');
                }
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-1.5 cursor-pointer group-hover:translate-x-0.5"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{advice?.quickAction?.label || 'Start Priority Mission'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Open Studio Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab('brain' as any);
              }}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Coach Studio</span>
              <ChevronRight className="w-3.5 h-3.5 text-white/70" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
