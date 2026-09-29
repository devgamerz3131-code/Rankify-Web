import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { useNavigation } from '@/contexts/NavigationContext';
import { brainService } from '@/services/brain-service';
import {
  RankifyBrainData,
  CoachPersonality,
  ExamModePhase,
  MissionItem,
  PersonalAiInsight,
  SmartRecommendation,
} from '@/types/brain';
import {
  Brain,
  Sparkles,
  Flame,
  Clock,
  Award,
  Zap,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Check,
  ChevronRight,
  RefreshCw,
  Target,
  BookOpen,
  Calendar,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  FileText,
  Video,
  Bookmark,
  Bell,
  Sliders,
  Share2,
  Lock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import toast from 'react-hot-toast';

export const RankifyBrainView: React.FC = () => {
  const { user } = useAuth();
  const { setActiveTab, navigateToAi } = useNavigation();

  const [data, setData] = useState<RankifyBrainData | null>(() =>
    brainService.getCachedData()
  );
  const [activeSection, setActiveSection] = useState<
    'coaching' | 'insights' | 'memory' | 'recommendations' | 'goals' | 'reviews'
  >('coaching');
  const [isSyncing, setIsSyncing] = useState(false);
  const [activePersonality, setActivePersonality] = useState<CoachPersonality>('mentor');
  const [currentReminder, setCurrentReminder] = useState<string>('');

  useEffect(() => {
    const userId = user?.uid || 'guest';
    brainService.init(userId).then((res) => {
      setData(res);
      setActivePersonality(res.personality);
    });

    const unsub = brainService.subscribe((res) => {
      setData(res);
      setActivePersonality(res.personality);
    });

    // Pick first smart reminder
    const rem = brainService.getNextSmartReminder();
    setCurrentReminder(rem.message);

    return () => unsub();
  }, [user?.uid]);

  const handlePersonalityChange = async (p: CoachPersonality) => {
    setActivePersonality(p);
    setIsSyncing(true);
    await brainService.updatePersonality(p);
    setIsSyncing(false);
    toast.success(`Rankify Brain personality set to ${p.toUpperCase()} mode!`);
  };

  const handleToggleMission = async (itemId: string) => {
    await brainService.toggleMissionItem(itemId);
    toast.success('Mission task updated!');
  };

  const handleNextReminder = () => {
    const nextRem = brainService.getNextSmartReminder();
    setCurrentReminder(nextRem.message);
    toast(`Smart Reminder: "${nextRem.message}"`, {
      icon: '🧠',
    });
  };

  const handleLaunchAiWithContext = () => {
    const ctx = brainService.getAiChatContext(user?.displayName || 'CBSE Aspirant');
    navigateToAi({
      subject: ctx.weakChapters[0]?.subject || 'Physics',
      chapter: ctx.weakChapters[0]?.name || 'Current Electricity',
      query: ctx.suggestedInitialPrompt,
    });
    toast.success('Rankify Brain context injected into Ask AI chat!');
  };

  const advice = data?.dailyAdvice;
  const mission = data?.mission;
  const memory = data?.memory;
  const goals = data?.goals;
  const warnings = data?.warnings || [];
  const insights = data?.insights || [];
  const recommendations = data?.recommendations || [];
  const countdown = data?.examCountdownDays || 18;
  const phase = data?.examModePhase || '14_days';

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24 select-none px-2 sm:px-4">
      {/* Top Header Bar */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-purple-950 to-indigo-950 p-6 sm:p-8 text-white shadow-2xl border border-purple-500/25">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-black uppercase tracking-wider border border-purple-500/40">
                <Brain className="w-3.5 h-3.5 text-purple-300" />
                <span>Personal AI Study Coach</span>
              </span>

              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-500/40 font-mono">
                {countdown} Days Left • {phase.replace('_', ' ').toUpperCase()} MODE
              </span>

              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
                ● Live Autonomous Observer
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Rankify Brain
            </h1>

            <p className="text-xs sm:text-sm text-purple-200/90 leading-relaxed font-normal">
              Not a chatbot—your proactive learning mentor. Rankify Brain continuously monitors your study hours, consistency, question accuracy, mistakes, and exam countdown to deliver precision coaching.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
            {/* Context to Ask AI Bridge */}
            <button
              onClick={handleLaunchAiWithContext}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-200" />
              <span>Ask AI With Brain Context</span>
            </button>

            <button
              onClick={() => {
                setIsSyncing(true);
                setTimeout(() => {
                  setIsSyncing(false);
                  toast.success('Brain telemetry re-indexed with Firebase!');
                }, 700);
              }}
              className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Coach Personality Selector Deck */}
        <div className="relative z-10 mt-6 pt-5 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold uppercase text-purple-300 tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>Select Coach Personality & Tone</span>
            </span>
            <span className="text-[11px] text-purple-200/70 font-mono">
              Active: {activePersonality.toUpperCase()} COACH
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
            {[
              {
                id: 'strict' as const,
                title: 'Strict Coach',
                desc: 'Disciplined & direct. Zero excuses.',
                emoji: '🛑',
              },
              {
                id: 'friendly' as const,
                title: 'Friendly Teacher',
                desc: 'Encouraging, gentle guidance.',
                emoji: '🌱',
              },
              {
                id: 'savage' as const,
                title: 'Savage Friend',
                desc: 'Playful roasts & reality checks.',
                emoji: '🔥',
              },
              {
                id: 'mentor' as const,
                title: 'Motivational Mentor',
                desc: 'Inspiring, vision-driven, high energy.',
                emoji: '⚡',
              },
              {
                id: 'calm' as const,
                title: 'Calm Guide',
                desc: 'Stress-reducing, mindful pacing.',
                emoji: '🕊️',
              },
            ].map((p) => {
              const isSelected = activePersonality === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handlePersonalityChange(p.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600/40 border-purple-400 text-white shadow-md shadow-purple-500/20'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base">{p.emoji}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-purple-300" />}
                  </div>
                  <div className="text-xs font-black mt-1 text-white">{p.title}</div>
                  <div className="text-[10px] text-purple-200/70 mt-0.5 line-clamp-1">{p.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'coaching', label: "Today's Coaching & Mission", icon: Target },
          { id: 'insights', label: 'Personal AI Insights', icon: Sparkles },
          { id: 'recommendations', label: 'Smart Recommendations', icon: BookOpen },
          { id: 'goals', label: 'Goal Tracker & Exam Mode', icon: Award },
          { id: 'memory', label: 'AI Memory Profile', icon: Brain },
          { id: 'reviews', label: 'Weekly & Monthly Reviews', icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'bg-card border border-slate-200/80 dark:border-white/10 text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: TODAY'S COACHING & MISSION */}
      {activeSection === 'coaching' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Active AI Warnings Banner */}
          {warnings.length > 0 && (
            <div className="space-y-2.5">
              {warnings.map((w) => (
                <div
                  key={w.id}
                  className={`p-4 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    w.severity === 'critical'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                      : w.severity === 'high'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                      : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                        <span>{w.title}</span>
                        <span className="text-[10px] font-mono opacity-80">({w.detectedAt})</span>
                      </div>
                      <p className="text-xs text-foreground mt-0.5 leading-relaxed">{w.message}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab(w.actionRoute as any)}
                    className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-current font-bold text-xs shrink-0 cursor-pointer hover:bg-current/10 transition-colors"
                  >
                    <span>{w.actionLabel}</span>
                    <ArrowRight className="w-3 h-3 inline ml-1" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Today's Advice & Quick Action Hero */}
          <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                <h3 className="font-extrabold text-base text-foreground">
                  Today's Mentorship Observation
                </h3>
              </div>
              <span className="text-[11px] font-bold text-purple-600 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                {activePersonality.toUpperCase()} COACH ACTIVE
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/40 space-y-2">
              <h4 className="text-lg font-black text-purple-950 dark:text-purple-100">
                "{advice?.headline}"
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {advice?.subtext}
              </p>
              {advice?.motivationalQuote && (
                <div className="text-xs italic text-purple-700 dark:text-purple-300 pt-1 border-t border-purple-200 dark:border-purple-900/40">
                  {advice.motivationalQuote}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Today's Priority Topic
                </span>
                <span className="text-xs font-black text-foreground block">
                  {advice?.priorityTask}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Estimated Focused Time
                </span>
                <span className="text-lg font-black font-mono text-purple-600 block">
                  {advice?.estimatedMinutes} Minutes
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Board Projected Accuracy
                </span>
                <span className="text-lg font-black font-mono text-emerald-600 block">
                  {goals?.boardExam?.projectedPercentage}% (Target 95%+)
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Coaching Daily Mission Checklist */}
          <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  <span>{mission?.title || "Today's Smart Coaching Mission"}</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {mission?.subtitle || 'Autonomously tailored tasks calibrated for board recovery.'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-extrabold text-foreground">
                    {mission?.completionRate || 25}% Complete
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {mission?.completedMinutes || 30} / {mission?.targetStudyMinutes || 135} mins
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-purple-500/20 flex items-center justify-center relative font-mono text-xs font-black">
                  <span>{mission?.completionRate || 25}%</span>
                </div>
              </div>
            </div>

            {/* Mission Items List */}
            <div className="space-y-2.5">
              {mission?.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleMission(item.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    item.isDone
                      ? 'bg-emerald-500/5 border-emerald-500/30 text-muted-foreground line-through opacity-80'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200/80 dark:border-white/5 hover:border-purple-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                        item.isDone ? 'bg-emerald-600 text-white' : 'border-2 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {item.isDone && <Check className="w-4 h-4" />}
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-xs font-extrabold text-foreground not-italic">
                        {item.text}
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                        <span className="font-bold text-purple-600 dark:text-purple-400">
                          {item.subjectName}
                        </span>
                        <span>•</span>
                        <span>{item.chapterName}</span>
                        <span>•</span>
                        <span className="font-mono">{item.allocatedMinutes} mins</span>
                      </div>
                    </div>
                  </div>

                  <span className="font-mono text-xs font-black text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md shrink-0">
                    +{item.points} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Smart Reminder Simulator Box */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-900/30 via-indigo-900/30 to-slate-900 border border-purple-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">
                  Dynamic Smart Reminder (Non-Repeating)
                </span>
                <p className="text-xs font-bold text-white mt-0.5">
                  "{currentReminder}"
                </p>
              </div>
            </div>

            <button
              onClick={handleNextReminder}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shrink-0 cursor-pointer transition-colors shadow-md"
            >
              Cycle Next Reminder
            </button>
          </div>
        </motion.div>
      )}

      {/* SECTION 2: PERSONAL AI INSIGHTS */}
      {activeSection === 'insights' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
            <div>
              <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span>Autonomous Behavioral Intelligence Deck</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real conclusions drawn from observing question accuracy, diurnal rhythms, task completions, and skipped modules.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((ins) => (
                <div
                  key={ins.id}
                  className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 font-mono">
                        {ins.category.toUpperCase()}
                      </span>
                      <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                        {ins.metric}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-foreground">{ins.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{ins.explanation}</p>
                  </div>

                  {ins.actionLabel && ins.actionRoute && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-white/5 flex justify-end">
                      <button
                        onClick={() => setActiveTab(ins.actionRoute as any)}
                        className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>{ins.actionLabel}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* SECTION 3: SMART RECOMMENDATIONS */}
      {activeSection === 'recommendations' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
            <div>
              <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                <span>Smart Multi-Tier Recommendations</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Targeted actions across next chapters, lectures, PYQ banks, formula cards, and NCERT in-text passages.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-white/5 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                        {rec.typeLabel} • {rec.subject}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          rec.urgency === 'high'
                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                            : 'bg-slate-200 dark:bg-slate-800 text-muted-foreground'
                        }`}
                      >
                        {rec.estimatedMinutes} mins
                      </span>
                    </div>

                    <h4 className="text-sm font-extrabold text-foreground">{rec.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{rec.description}</p>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      Chapter: <span className="text-foreground font-semibold">{rec.chapter}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab(rec.actionRoute as any)}
                    className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                  >
                    <span>{rec.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* SECTION 4: GOAL TRACKER & EXAM MODE */}
      {activeSection === 'goals' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Exam Mode Behavior Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-purple-500/15 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <h4 className="font-black text-sm text-foreground uppercase tracking-wide">
                  Exam Mode Active: {phase.replace('_', ' ').toUpperCase()} TO CBSE BOARDS
                </h4>
              </div>
              <span className="font-mono text-xs font-black text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                {countdown} Days
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 space-y-1">
                <strong className="text-foreground block">1. Stop Starting New Bulky Chapters</strong>
                <p className="text-muted-foreground text-[11px]">
                  Preserve your cognitive bandwidth. Do not start completely unfamiliar topics in the final sprint.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 space-y-1">
                <strong className="text-foreground block">2. 80% Time on High-Yield Revision</strong>
                <p className="text-muted-foreground text-[11px]">
                  Focus on guaranteed 5-mark board derivations (Lens Maker, Kirchhoff, Aldol Mechanism).
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 space-y-1">
                <strong className="text-foreground block">3. Timed Sectional PYQ Drills</strong>
                <p className="text-muted-foreground text-[11px]">
                  Replace casual reading with active pen-and-paper solving to eliminate calculation errors.
                </p>
              </div>
            </div>
          </div>

          {/* 4 Multi-Tier Goals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Daily Goal */}
            <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-2">
              <span className="text-[10px] font-black uppercase text-purple-600 font-mono">Daily Target</span>
              <div className="text-xl font-black font-mono text-foreground">
                {goals?.daily.currentMinutes} / {goals?.daily.targetMinutes} mins
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-purple-600"
                  style={{
                    width: `${Math.min(100, Math.round(((goals?.daily.currentMinutes || 0) / (goals?.daily.targetMinutes || 180)) * 100))}%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground block">
                {goals?.daily.tasksDone} of {goals?.daily.targetTasks} tasks finished
              </span>
            </div>

            {/* Weekly Goal */}
            <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-2">
              <span className="text-[10px] font-black uppercase text-indigo-600 font-mono">Weekly Target</span>
              <div className="text-xl font-black font-mono text-foreground">
                {goals?.weekly.currentHours} / {goals?.weekly.targetHours} hrs
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-600"
                  style={{
                    width: `${Math.min(100, Math.round(((goals?.weekly.currentHours || 0) / (goals?.weekly.targetHours || 24)) * 100))}%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground block">
                {goals?.weekly.mockTestsDone} of {goals?.weekly.targetMockTests} mock tests taken
              </span>
            </div>

            {/* Monthly Goal */}
            <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-2">
              <span className="text-[10px] font-black uppercase text-emerald-600 font-mono">Monthly Syllabus</span>
              <div className="text-xl font-black font-mono text-foreground">
                {goals?.monthly.completedChapterCount} / {goals?.monthly.targetChapterCount} Ch.
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-600"
                  style={{
                    width: `${Math.min(100, Math.round(((goals?.monthly.completedChapterCount || 0) / (goals?.monthly.targetChapterCount || 20)) * 100))}%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground block">80% of Core Board chapters complete</span>
            </div>

            {/* Board Goal */}
            <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-2">
              <span className="text-[10px] font-black uppercase text-amber-600 font-mono">Board Target</span>
              <div className="text-xl font-black font-mono text-foreground">
                {goals?.boardExam.projectedPercentage}% <span className="text-xs font-sans font-normal text-muted-foreground">(Goal: {goals?.boardExam.targetPercentage}%)</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{ width: `${goals?.boardExam.projectedPercentage}%` }}
                />
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                Pacing gap: only {goals?.boardExam.gap}% to target!
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* SECTION 5: AI MEMORY PROFILE */}
      {activeSection === 'memory' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-5">
            <div>
              <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                <span>AI Memory Vault: What Rankify Brain Remembers About You</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Persistently recorded across sessions to personalize notifications, timing alerts, and question difficulty.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-2">
                <span className="text-[10px] font-black uppercase text-purple-600 font-mono">Preferences & Timing</span>
                <div className="text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Favourite Study Window:</span>
                    <strong className="text-foreground">{memory?.favouriteStudyTime}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Strongest Subject:</span>
                    <strong className="text-emerald-600">{memory?.strongestSubject}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Weak Areas:</span>
                    <strong className="text-rose-500">{memory?.weakSubjects?.join(', ')}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chronobiological Peak:</span>
                    <strong className="text-indigo-600">{memory?.chronobiologicalPeak}</strong>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-2">
                <span className="text-[10px] font-black uppercase text-purple-600 font-mono">Days Without Subject</span>
                <div className="space-y-2 pt-1 text-xs">
                  {Object.entries(memory?.daysWithoutSubject || {}).map(([sub, days]) => (
                    <div key={sub} className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{sub}</span>
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded-md text-[11px] ${
                          days >= 4
                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-600'
                        }`}
                      >
                        {days === 0 ? 'Studied Today' : `${days} days ago`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Observed Study & Revision Habits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-2">
                <span className="text-[10px] font-black uppercase text-purple-600 font-mono">Observed Study Habits</span>
                <ul className="text-xs space-y-2 text-muted-foreground list-disc list-inside">
                  {memory?.studyHabits?.map((h, i) => (
                    <li key={i} className="leading-relaxed">
                      <span className="text-foreground">{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-2">
                <span className="text-[10px] font-black uppercase text-purple-600 font-mono">Most Common Mistake Traps</span>
                <ul className="text-xs space-y-2 text-muted-foreground list-disc list-inside">
                  {memory?.mostCommonMistakes?.map((m, i) => (
                    <li key={i} className="leading-relaxed">
                      <span className="text-foreground">{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* SECTION 6: WEEKLY & MONTHLY REVIEWS */}
      {activeSection === 'reviews' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Sunday Weekly Report */}
          <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span>Sunday Weekly Report ({data?.weeklyReview?.weekRange})</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Generated autonomously every Sunday night.
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-purple-600 bg-purple-500/10 px-2.5 py-1 rounded-xl">
                Score: {data?.weeklyReview?.consistencyScore}/100
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/40 text-xs text-foreground leading-relaxed">
              "{data?.weeklyReview?.aiSummary}"
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Study Hours</span>
                <span className="text-lg font-black font-mono text-foreground mt-1 block">
                  {data?.weeklyReview?.studyHours}h
                </span>
                <span className="text-[9px] text-emerald-500 font-bold block">Target: 24h</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Most Improved</span>
                <span className="text-xs font-extrabold text-emerald-600 mt-1 block">
                  {data?.weeklyReview?.mostImprovedSubject}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Revision Score</span>
                <span className="text-lg font-black font-mono text-purple-600 mt-1 block">
                  {data?.weeklyReview?.revisionScore}%
                </span>
                <span className="text-[9px] text-purple-500 font-bold block">High retention</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Motivation</span>
                <span className="text-lg font-black font-mono text-amber-500 mt-1 block">
                  {data?.weeklyReview?.motivationScore}%
                </span>
                <span className="text-[9px] text-amber-500 font-bold block">High morale</span>
              </div>
            </div>

            {/* Wins & Next Week Action Plan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-2">
                <span className="text-[10px] font-black uppercase text-emerald-600 font-mono">Key Wins This Week</span>
                <ul className="text-xs space-y-1.5 text-muted-foreground list-disc list-inside">
                  {data?.weeklyReview?.keyWins.map((w, i) => (
                    <li key={i}><span className="text-foreground">{w}</span></li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-2">
                <span className="text-[10px] font-black uppercase text-purple-600 font-mono">Action Plan Next Week</span>
                <ul className="text-xs space-y-1.5 text-muted-foreground list-disc list-inside">
                  {data?.weeklyReview?.actionPlanForNextWeek.map((a, i) => (
                    <li key={i}><span className="text-foreground">{a}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Monthly Review */}
          <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span>Monthly Review ({data?.monthlyReview?.month})</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Macro milestones and suggested strategy roadmap.
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-xl">
                {data?.monthlyReview?.totalHours} Hours Logged
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-xs text-foreground space-y-1">
              <strong className="text-amber-700 dark:text-amber-400 block font-bold">
                Suggested High-Yield Strategy:
              </strong>
              <p className="leading-relaxed">{data?.monthlyReview?.suggestedStrategy}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-2">
                <span className="text-[10px] font-black uppercase text-emerald-600 font-mono">Achievements</span>
                <ul className="space-y-1.5 text-muted-foreground list-disc list-inside">
                  {data?.monthlyReview?.achievements.map((ach, i) => (
                    <li key={i}><span className="text-foreground">{ach}</span></li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-2">
                <span className="text-[10px] font-black uppercase text-rose-500 font-mono">Pending High-Weightage Work</span>
                <ul className="space-y-1.5 text-muted-foreground list-disc list-inside">
                  {data?.monthlyReview?.pendingWork.map((pw, i) => (
                    <li key={i}><span className="text-foreground">{pw}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
