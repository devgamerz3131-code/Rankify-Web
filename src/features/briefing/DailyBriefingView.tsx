import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BriefingState,
  DailyMissionItem,
  EnergyPlanSlot,
  BriefingTone,
} from '@/types/briefing';
import { briefingService } from '@/services/briefing-service';
import { NightReflectionModal } from './components/NightReflectionModal';
import { ToneSelectorModal } from './components/ToneSelectorModal';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Award,
  TrendingUp,
  Brain,
  Sun,
  Moon,
  Flame,
  Shield,
  ArrowRight,
  Smile,
  ShieldAlert,
  Compass,
  Check,
  Calendar,
  Layers,
  ChevronRight,
  Sliders,
} from 'lucide-react';
import { useNavigation } from '@/contexts/NavigationContext';
import toast from 'react-hot-toast';

export const DailyBriefingView: React.FC = () => {
  const { setActiveTab } = useNavigation();
  const [state, setState] = useState<BriefingState>(() => briefingService.getCachedState());
  const [isToneModalOpen, setIsToneModalOpen] = useState(false);
  const [isReflectionModalOpen, setIsReflectionModalOpen] = useState(false);

  useEffect(() => {
    const unsub = briefingService.subscribe((s) => {
      setState(s);
    });
    return () => unsub();
  }, []);

  const { currentBriefing, memoryProfile, reflectionHistory } = state;

  const handleToggleMission = async (missionId: string) => {
    await briefingService.toggleMission(missionId);
    toast.success('Mission progress updated!');
  };

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
    <div className="max-w-7xl mx-auto space-y-7 pb-28 select-none px-2 sm:px-4">
      {/* 1. HERO BANNER: MORNING/DAILY BRIEFING */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-purple-950 to-indigo-950 p-6 sm:p-8 text-white shadow-2xl border border-purple-500/30">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/25 border border-purple-400/40 text-purple-300 text-xs font-black uppercase tracking-wider font-mono">
                <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                <span>AI Daily Briefing Engine</span>
              </span>

              <button
                onClick={() => setIsToneModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold font-mono transition-colors cursor-pointer"
              >
                <ToneIcon className="w-3.5 h-3.5 text-amber-400" />
                <span className="capitalize">{currentBriefing.tone.replace('_', ' ')} Tone</span>
                <Sliders className="w-3 h-3 ml-1 text-purple-300" />
              </button>

              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono">
                {memoryProfile.streakDays}-Day Streak
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              {currentBriefing.greetingTitle}
            </h1>

            {/* AI Personality Quote Callout */}
            <div className="p-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 font-mono flex items-center gap-1">
                <ToneIcon className="w-3.5 h-3.5" />
                <span>AI Mentor Direct Message:</span>
              </span>
              <p className="text-xs sm:text-sm text-purple-100 font-medium leading-relaxed italic">
                "{currentBriefing.aiMessage}"
              </p>
            </div>
          </div>

          {/* Right Metrics cards */}
          <div className="flex flex-row sm:flex-row items-center gap-3 w-full lg:w-auto justify-around sm:justify-end">
            <div className="p-4 rounded-3xl bg-purple-900/40 border border-purple-400/30 text-center min-w-[120px] shrink-0 backdrop-blur-md">
              <span className="text-[10px] text-purple-200 font-bold uppercase tracking-wider block">
                Estimated Time
              </span>
              <div className="text-3xl font-black font-mono text-white mt-1">
                {currentBriefing.estimatedStudyTimeMinutes}m
              </div>
              <span className="text-[10px] text-purple-300 font-mono">Today's Target</span>
            </div>

            <div className="p-4 rounded-3xl bg-indigo-900/40 border border-indigo-400/30 text-center min-w-[120px] shrink-0 backdrop-blur-md">
              <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider block">
                Readiness Score
              </span>
              <div className="text-3xl font-black font-mono text-emerald-400 mt-1">
                {currentBriefing.readinessScore}%
              </div>
              <span className="text-[10px] text-emerald-300 font-mono">
                {currentBriefing.examCountdownDays} Days to Exam
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. YESTERDAY'S RECAP & MOMENTUM CARD */}
      <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <h3 className="font-extrabold text-sm text-foreground">
              Yesterday’s Real Momentum Recap
            </h3>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            {currentBriefing.yesterdayRecap.studyMinutes}m logged • {currentBriefing.yesterdayRecap.accuracyPercent}% accuracy
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <p className="font-bold text-foreground">
              {currentBriefing.yesterdayRecap.highlight}
            </p>
            <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
              {currentBriefing.yesterdayRecap.subjectsBreakdown.map((sb, idx) => (
                <span key={idx} className="font-mono">
                  {sb.subject}: <strong>{sb.minutes}m</strong>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold font-mono text-[11px]">
              +25 Questions Solved
            </span>
          </div>
        </div>
      </div>

      {/* 3. TODAY'S 5 MISSIONS: AUTOMATICALLY GENERATED */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 font-mono">
              Action Priority Engine
            </span>
            <h3 className="text-lg font-black text-foreground">
              Today’s 5 High-Impact Missions
            </h3>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {currentBriefing.missions.filter((m) => m.isCompleted).length} / {currentBriefing.missions.length} Complete
          </span>
        </div>

        <div className="space-y-3">
          {currentBriefing.missions.map((mission) => (
            <div
              key={mission.id}
              className={`p-4 sm:p-5 rounded-3xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                mission.isCompleted
                  ? 'bg-emerald-500/5 border-emerald-500/30'
                  : mission.type === 'top_priority'
                  ? 'bg-purple-500/5 border-purple-500/40 shadow-xs'
                  : 'bg-card border-slate-200/80 dark:border-white/10'
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                <button
                  onClick={() => handleToggleMission(mission.id)}
                  className={`w-6 h-6 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 cursor-pointer transition-colors ${
                    mission.isCompleted
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-slate-300 dark:border-white/20 hover:border-purple-500'
                  }`}
                >
                  {mission.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[9px] font-black uppercase font-mono px-2 py-0.2 rounded-md ${
                        mission.type === 'top_priority'
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          : mission.type === 'second_priority'
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          : mission.type === 'quick_win'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                      }`}
                    >
                      {mission.type.replace('_', ' ')}
                    </span>

                    <span className="text-[10px] font-mono text-muted-foreground">
                      {mission.subject} • {mission.chapter}
                    </span>

                    <span className="text-[10px] font-mono text-purple-600 font-bold">
                      +{mission.impactScore} Readiness Pts
                    </span>
                  </div>

                  <h4
                    className={`font-bold text-sm text-foreground ${
                      mission.isCompleted ? 'line-through text-muted-foreground' : ''
                    }`}
                  >
                    {mission.title}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{mission.durationMinutes}m</span>
                </span>

                <button
                  onClick={() => setActiveTab(mission.actionRoute as any)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  <span>Launch</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. ENERGY BASED PLANNING (STUDY DNA INTEGRATION) */}
      <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 font-mono">
              Study DNA Energy Mapping
            </span>
            <h3 className="font-extrabold text-sm sm:text-base text-foreground">
              Circadian Rhythm & Chronotype Schedule
            </h3>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            Personalized for Devgamerz
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {currentBriefing.energyPlan.map((slot, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-white/5 space-y-2.5 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-purple-600 capitalize flex items-center gap-1">
                    {slot.slot === 'morning' ? (
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                    ) : slot.slot === 'afternoon' ? (
                      <Zap className="w-3.5 h-3.5 text-purple-500" />
                    ) : (
                      <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    )}
                    <span>{slot.slot} Slot</span>
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">{slot.timeRange}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 text-[10px] font-mono font-bold">
                    {slot.energyLevel}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground font-semibold">
                    {slot.targetSubject}
                  </span>
                </div>

                <h4 className="font-bold text-foreground text-xs">{slot.recommendedActivity}</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{slot.taskDescription}</p>
              </div>

              <div className="p-2 rounded-xl bg-purple-500/5 border border-purple-500/15 text-[10px] text-purple-700 dark:text-purple-300 font-medium">
                🧬 <strong>DNA Insight:</strong> {slot.studyDnaReason}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. EVENING REPORT & NIGHT REFLECTION ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Evening Report */}
        {currentBriefing.eveningReport && (
          <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-600" />
                <span>Evening Synthesis Report</span>
              </h4>
              <span className="text-[10px] font-mono text-emerald-500 font-bold">
                {currentBriefing.eveningReport.confidenceDelta}
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {currentBriefing.eveningReport.achievementSummary}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Study Logged</span>
                <div className="text-xl font-black font-mono text-foreground mt-0.5">
                  {currentBriefing.eveningReport.actualStudyMinutes}m
                </div>
                <span className="text-[9px] text-muted-foreground font-mono">Of {currentBriefing.eveningReport.targetStudyMinutes}m Target</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Tomorrow Priority</span>
                <div className="text-xs font-bold text-purple-600 mt-1 line-clamp-2">
                  {currentBriefing.eveningReport.tomorrowPriorityPreview}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Night Reflection Launcher */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white shadow-xl border border-indigo-500/30 space-y-4 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-amber-300" />
              <span className="text-xs font-black uppercase text-purple-300 font-mono">
                Night Reflection Routine
              </span>
            </div>
            <h4 className="text-lg font-black">
              Calibrate Tomorrow’s Plan in 60 Seconds
            </h4>
            <p className="text-xs text-purple-200/80 leading-relaxed">
              Tell Rankify what felt difficult and how your focus held up today. Answers directly refine your morning energy schedule!
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] font-mono text-purple-300">
              {memoryProfile.totalReflectionsLogged} Reflections Logged
            </span>

            <button
              onClick={() => setIsReflectionModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-white text-slate-950 font-black text-xs hover:bg-purple-100 transition-colors cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <Moon className="w-3.5 h-3.5 fill-slate-950" />
              <span>Log Reflection</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tone Selector Modal */}
      <ToneSelectorModal
        currentTone={currentBriefing.tone}
        isOpen={isToneModalOpen}
        onClose={() => setIsToneModalOpen(false)}
        onSelectTone={(t) => {
          // updated via service inside modal
        }}
      />

      {/* Night Reflection Modal */}
      <NightReflectionModal
        isOpen={isReflectionModalOpen}
        onClose={() => setIsReflectionModalOpen(false)}
      />
    </div>
  );
};
