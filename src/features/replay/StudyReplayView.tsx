import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { useNavigation } from '@/contexts/NavigationContext';
import { replayService } from '@/services/replay-service';
import { notificationEngine } from '@/services/notification-service';
import {
  StudyReplayData,
  TimelineEvent,
  DailyTimeline,
  ActivityEventType,
  StudyMood,
  Achievement,
} from '@/types/replay';
import {
  History,
  PlayCircle,
  PauseCircle,
  Calendar,
  Clock,
  Sparkles,
  Flame,
  Award,
  CheckCircle2,
  Check,
  TrendingUp,
  Download,
  Filter,
  Search,
  BookOpen,
  Target,
  Bookmark,
  FileText,
  Video,
  Zap,
  ArrowRight,
  ArrowLeft,
  Share2,
  Smile,
  Layers,
  ChevronDown,
  RefreshCw,
  Printer,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import toast from 'react-hot-toast';

export const StudyReplayView: React.FC = () => {
  const { user } = useAuth();
  const { setActiveTab } = useNavigation();

  const [data, setData] = useState<StudyReplayData | null>(() =>
    replayService.getCachedData()
  );
  const [selectedViewMode, setSelectedViewMode] = useState<
    'daily' | 'weekly' | 'monthly' | 'yearly' | 'achievements'
  >('daily');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  // Interactive Replay Player Mode
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [isPlayingAuto, setIsPlayingAuto] = useState(false);

  // Export Modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState<'study_report' | 'monthly' | 'yearly'>('study_report');

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

  // Timeline for currently selected date
  const currentDailyTimeline = useMemo(() => {
    if (!data?.dailyTimelines) return null;
    return data.dailyTimelines[selectedDate] || data.todayTimeline;
  }, [data, selectedDate]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    if (!data?.allEvents) return [];
    return data.allEvents.filter((e) => {
      // Date filter in daily mode
      if (selectedViewMode === 'daily' && e.date !== selectedDate) {
        return false;
      }
      // Subject filter
      if (selectedSubject !== 'all' && e.subjectName?.toLowerCase() !== selectedSubject.toLowerCase()) {
        return false;
      }
      // Activity Type filter
      if (filterType !== 'all') {
        if (filterType === 'revision' && e.type !== 'revision_session' && e.type !== 'formula_revision') {
          return false;
        } else if (filterType === 'practice' && e.type !== 'practice_session') {
          return false;
        } else if (filterType === 'mock_test' && e.type !== 'mock_test') {
          return false;
        } else if (filterType === 'lecture' && e.type !== 'lecture_analyzed') {
          return false;
        } else if (filterType === 'tasks' && e.type !== 'task_completed') {
          return false;
        }
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          (e.chapterName && e.chapterName.toLowerCase().includes(q)) ||
          e.subjectName.toLowerCase().includes(q) ||
          (e.notes && e.notes.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [data?.allEvents, selectedViewMode, selectedDate, selectedSubject, filterType, searchQuery]);

  // Replay Player auto-advance
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlayingAuto && filteredEvents.length > 0) {
      timer = setInterval(() => {
        setReplayIndex((prev) => {
          if (prev >= filteredEvents.length - 1) {
            setIsPlayingAuto(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2400);
    }
    return () => clearInterval(timer);
  }, [isPlayingAuto, filteredEvents.length]);

  const stats = data?.statistics;
  const moodIcons: Record<StudyMood, string> = {
    focused: '🎯 Focused',
    energized: '⚡ Energized',
    deep_work: '🧠 Deep Work',
    tired: '😴 Tired',
    unstoppable: '🔥 Unstoppable',
  };

  const handlePrintOrDownload = () => {
    window.print();
    toast.success('Study Replay Report prepared for printing / PDF saving!', { icon: '📄' });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* 1. HERO BANNER: LEARNING DIARY & CONTROLS */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-indigo-950/90 to-purple-950 text-white border border-indigo-500/30 shadow-2xl">
        {/* Glow circles */}
        <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-indigo-200">
                <History className="w-4 h-4 text-indigo-400" />
                <span>Rankify Study Replay & Diary</span>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{stats?.currentStreak || 15} Day Streak Active</span>
              </span>

              <span className="text-[10px] text-indigo-300/80 font-mono bg-white/5 px-2.5 py-0.5 rounded border border-white/10">
                Real-Time Cloud Sync
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsReplaying(true);
                  setReplayIndex(0);
                  setIsPlayingAuto(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Replay Journey Player</span>
              </button>

              <button
                onClick={() => setShowExportModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Report</span>
              </button>
            </div>
          </div>

          {/* Title & Core Summary */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pt-2">
            <div className="space-y-2 flex-1">
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                Personal Learning Diary & Timeline
              </h1>
              <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed max-w-2xl font-medium">
                Step backwards or forward through every hour you invested in CBSE Class 12 PCM. Automatically records task completions, practice accuracy, formula drills, and milestones.
              </p>
            </div>

            {/* Quick Metrics Cards */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center min-w-[110px]">
                <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider block">
                  Total Study
                </span>
                <span className="text-3xl font-black font-mono text-white mt-1 block">
                  {stats?.totalHours || 76.5}h
                </span>
                <span className="text-[10px] text-emerald-300 font-medium">
                  {stats?.totalStudyDays || 18} Active Days
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center min-w-[110px]">
                <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider block">
                  Accuracy
                </span>
                <span className="text-3xl font-black font-mono text-emerald-300 mt-1 block">
                  {stats?.overallAccuracy || 88}%
                </span>
                <span className="text-[10px] text-slate-300 font-medium">
                  {stats?.questionsSolved || 480}+ Questions
                </span>
              </div>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-t border-white/10 pt-4">
            {[
              { id: 'daily', label: 'Daily Timeline', icon: Calendar },
              { id: 'weekly', label: 'Weekly Summary', icon: Clock },
              { id: 'monthly', label: 'Monthly Summary', icon: TrendingUp },
              { id: 'yearly', label: 'Yearly Heatmap', icon: Layers },
              { id: 'achievements', label: 'Milestones & Badges', icon: Award },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedViewMode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedViewMode(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-white text-indigo-950 shadow-md font-extrabold'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. GITHUB-STYLE CONTRIBUTION HEATMAP */}
      <Card className="p-5 sm:p-6 bg-card/80 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-extrabold text-base text-foreground">
                Study Activity Heatmap (12 Weeks Contribution Graph)
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Click any colored square to instantly view complete study activities for that date.
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="w-3 h-3 rounded-xs bg-slate-100 dark:bg-slate-800" title="0 mins" />
            <div className="w-3 h-3 rounded-xs bg-emerald-300 dark:bg-emerald-900" title="1-60 mins" />
            <div className="w-3 h-3 rounded-xs bg-emerald-500 dark:bg-emerald-600" title="61-120 mins" />
            <div className="w-3 h-3 rounded-xs bg-emerald-600 dark:bg-emerald-500" title="121-180 mins" />
            <div className="w-3 h-3 rounded-xs bg-emerald-700 dark:bg-emerald-400" title="180+ mins" />
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto pb-2">
          <div className="inline-grid grid-rows-7 grid-flow-col gap-1.5 min-w-[680px]">
            {data?.heatmapData.map((day, idx) => {
              const isSelected = day.date === selectedDate;
              const colorClass = {
                0: 'bg-slate-100 dark:bg-slate-800/80 hover:ring-1 hover:ring-slate-400',
                1: 'bg-emerald-200 dark:bg-emerald-950/70 hover:ring-1 hover:ring-emerald-400',
                2: 'bg-emerald-400 dark:bg-emerald-700 hover:ring-1 hover:ring-emerald-300',
                3: 'bg-emerald-500 dark:bg-emerald-500 hover:ring-1 hover:ring-emerald-200',
                4: 'bg-emerald-600 dark:bg-emerald-400 hover:ring-1 hover:ring-white',
              }[day.level];

              return (
                <div
                  key={day.date}
                  onClick={() => {
                    setSelectedDate(day.date);
                    setSelectedViewMode('daily');
                    toast(`Selected ${day.date} (${day.minutes} mins studied)`, { icon: '📅' });
                  }}
                  title={`${day.date}: ${day.minutes} mins studied, ${day.tasksCount} tasks completed`}
                  className={`w-4 h-4 rounded-xs cursor-pointer transition-all ${colorClass} ${
                    isSelected ? 'ring-2 ring-indigo-500 scale-125 z-10' : ''
                  }`}
                />
              );
            })}
          </div>
        </div>
      </Card>

      {/* 3. VIEW MODE CONTENT: DAILY TIMELINE */}
      {selectedViewMode === 'daily' && (
        <div className="space-y-6">
          {/* Day Navigation & AI Study Journal Card */}
          <Card className="p-5 sm:p-6 bg-card/80 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-xs space-y-5">
            {/* Date bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const d = new Date(selectedDate);
                    d.setDate(d.getDate() - 1);
                    setSelectedDate(d.toISOString().split('T')[0]);
                  }}
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center cursor-pointer text-xs font-bold"
                  title="Previous Day"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div>
                  <h3 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                    <Calendar className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                    <span>{selectedDate} ({currentDailyTimeline?.dayOfWeek || 'Today'})</span>
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Total: {Math.floor((currentDailyTimeline?.totalStudyMinutes || 0) / 60)}h{' '}
                    {(currentDailyTimeline?.totalStudyMinutes || 0) % 60}m logged
                  </span>
                </div>

                <button
                  onClick={() => {
                    const d = new Date(selectedDate);
                    d.setDate(d.getDate() + 1);
                    setSelectedDate(d.toISOString().split('T')[0]);
                  }}
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center cursor-pointer text-xs font-bold"
                  title="Next Day"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Study Mood badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-semibold">Study Mood:</span>
                <span className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 text-xs font-bold">
                  {moodIcons[currentDailyTimeline?.mood || 'focused']}
                </span>
              </div>
            </div>

            {/* AI Study Journal Story Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-500/20 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>AI Study Journal Entry</span>
              </div>
              <p className="text-sm font-semibold text-foreground leading-relaxed">
                "{currentDailyTimeline?.aiSummary || 'Completed 3 tasks today with consistent focus across PCM.'}"
              </p>
            </div>

            {/* Daily Metrics Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-0.5">
                <span className="text-muted-foreground">Tasks Finished</span>
                <div className="text-base font-extrabold font-mono text-foreground">
                  {currentDailyTimeline?.tasksCompleted || 0}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-0.5">
                <span className="text-muted-foreground">Questions Attempted</span>
                <div className="text-base font-extrabold font-mono text-foreground">
                  {currentDailyTimeline?.questionsSolved || 0}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-0.5">
                <span className="text-muted-foreground">Accuracy Score</span>
                <div className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                  {currentDailyTimeline?.accuracy || 85}%
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-0.5">
                <span className="text-muted-foreground">Revisions Logged</span>
                <div className="text-base font-extrabold font-mono text-purple-600 dark:text-purple-400">
                  {currentDailyTimeline?.revisionsCount || 0}
                </div>
              </div>
            </div>
          </Card>

          {/* Filter & Search Bar */}
          <div className="p-4 rounded-2xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Subject Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              {['all', 'physics', 'chemistry', 'mathematics'].map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedSubject === sub
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {sub === 'all' ? 'All Subjects' : sub.charAt(0).toUpperCase() + sub.slice(1)}
                </button>
              ))}
            </div>

            {/* Activity Type & Search */}
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <div className="relative flex-1 md:w-48">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-foreground placeholder:text-muted-foreground focus:outline-hidden"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="h-8 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-foreground focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Activities</option>
                <option value="practice">Practice Sessions</option>
                <option value="revision">Formula & Revisions</option>
                <option value="mock_test">Mock Tests</option>
                <option value="lecture">Lecture Analysis</option>
                <option value="tasks">Tasks Completed</option>
              </select>
            </div>
          </div>

          {/* Interactive Timeline Stream */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Activity Timeline Stream ({filteredEvents.length} events)</span>
            </h4>

            <div className="space-y-3 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {filteredEvents.map((evt, idx) => {
                const badgeColor =
                  evt.subjectName === 'Physics'
                    ? 'border-purple-500/30 text-purple-600 bg-purple-500/10'
                    : evt.subjectName === 'Chemistry'
                    ? 'border-pink-500/30 text-pink-600 bg-pink-500/10'
                    : evt.subjectName === 'Mathematics'
                    ? 'border-blue-500/30 text-blue-600 bg-blue-500/10'
                    : 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10';

                return (
                  <motion.div
                    key={evt.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative pl-12"
                  >
                    {/* Timeline Node Icon */}
                    <div className="absolute left-2.5 top-3 -translate-x-1/2 w-6 h-6 rounded-full bg-card border-2 border-indigo-600 flex items-center justify-center text-[10px] z-10 shadow-xs">
                      {evt.isMilestone ? '⭐' : '•'}
                    </div>

                    <div className="p-4 rounded-2xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-md transition-all space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${badgeColor}`}>
                            {evt.subjectName}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {evt.time}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {evt.durationMinutes} mins
                          </span>
                          {evt.accuracy && (
                            <span className="text-[11px] font-bold font-mono text-emerald-600 dark:text-emerald-400">
                              {evt.accuracy}% Accuracy
                            </span>
                          )}
                        </div>
                      </div>

                      <h5 className="font-extrabold text-sm text-foreground">
                        {evt.title}
                      </h5>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {evt.description}
                      </p>

                      {evt.chapterName && (
                        <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold pt-1">
                          Chapter: {evt.chapterName}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {filteredEvents.length === 0 && (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2 ml-10">
                  <History className="w-8 h-8 text-muted-foreground mx-auto" />
                  <div className="font-bold text-sm text-foreground">No events recorded for this selection</div>
                  <p className="text-xs text-muted-foreground">
                    Try choosing another date on the calendar or resetting your filters.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. VIEW MODE: WEEKLY SUMMARY */}
      {selectedViewMode === 'weekly' && data?.weeklySummary && (
        <Card className="p-6 bg-card/80 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                {data.weeklySummary.weekLabel}
              </span>
              <h3 className="text-xl font-black text-foreground mt-0.5">
                Weekly Performance Summary
              </h3>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
              Total {data.weeklySummary.totalStudyHours} Hours Logged
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-1">
              <span className="text-muted-foreground">Daily Average</span>
              <div className="text-lg font-black font-mono text-foreground">
                {Math.floor(data.weeklySummary.averageDailyStudyMinutes / 60)}h{' '}
                {data.weeklySummary.averageDailyStudyMinutes % 60}m
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-1">
              <span className="text-muted-foreground">Most Productive Day</span>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {data.weeklySummary.mostProductiveDay}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-1">
              <span className="text-muted-foreground">Tasks Completed</span>
              <div className="text-lg font-black font-mono text-foreground">
                {data.weeklySummary.tasksCompleted} Tasks
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-1">
              <span className="text-muted-foreground">Longest Study Session</span>
              <div className="text-lg font-black font-mono text-purple-600 dark:text-purple-400">
                {data.weeklySummary.longestSessionMinutes}m
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-2">
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                ⭐ Strongest Progress Chapters
              </span>
              <ul className="space-y-1 text-foreground font-semibold">
                {data.weeklySummary.strongChapters.map((ch, i) => (
                  <li key={i}>• {ch}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-500/20 space-y-2">
              <span className="font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
                ⚠️ Weak Chapters Flagged
              </span>
              <ul className="space-y-1 text-foreground font-semibold">
                {data.weeklySummary.weakChapters.map((ch, i) => (
                  <li key={i}>• {ch}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* 5. VIEW MODE: MONTHLY SUMMARY */}
      {selectedViewMode === 'monthly' && data?.monthlySummary && (
        <Card className="p-6 bg-card/80 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                Monthly Aggregation
              </span>
              <h3 className="text-xl font-black text-foreground mt-0.5">
                {data.monthlySummary.monthLabel}
              </h3>
            </div>
            <span className="text-2xl font-black font-mono text-foreground">
              {data.monthlySummary.totalHours} Hours
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-1">
              <span className="text-muted-foreground">Total Questions Solved</span>
              <div className="text-xl font-black font-mono text-foreground">
                {data.monthlySummary.totalQuestions}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-1">
              <span className="text-muted-foreground">Spaced Revisions</span>
              <div className="text-xl font-black font-mono text-purple-600 dark:text-purple-400">
                {data.monthlySummary.totalRevisions}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-1">
              <span className="text-muted-foreground">Lectures Analyzed</span>
              <div className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                {data.monthlySummary.totalLectures}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-1">
              <span className="text-muted-foreground">Daily Average</span>
              <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {Math.floor(data.monthlySummary.dailyAverageMinutes / 60)}h{' '}
                {data.monthlySummary.dailyAverageMinutes % 60}m
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-500/20">
              <span className="text-muted-foreground block mb-1">Most Studied Subject</span>
              <span className="font-extrabold text-foreground text-sm">
                {data.monthlySummary.mostStudiedSubject}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20">
              <span className="text-muted-foreground block mb-1">Most Improved Subject</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                {data.monthlySummary.mostImprovedSubject}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-500/20">
              <span className="text-muted-foreground block mb-1">Needs Focus Attention</span>
              <span className="font-extrabold text-amber-600 dark:text-amber-400 text-sm">
                {data.monthlySummary.mostIgnoredSubject}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* 6. VIEW MODE: ACHIEVEMENTS & MILESTONES */}
      {selectedViewMode === 'achievements' && data?.achievements && (
        <Card className="p-6 bg-card/80 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                Milestone Badges
              </span>
              <h3 className="text-xl font-black text-foreground mt-0.5">
                Unlocked Study Achievements
              </h3>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
              {data.achievements.filter((a) => a.isUnlocked).length} / {data.achievements.length} Unlocked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {data.achievements.map((ach) => (
              <div
                key={ach.id}
                className={`p-4 rounded-3xl border transition-all space-y-2.5 flex flex-col justify-between ${
                  ach.isUnlocked
                    ? 'bg-slate-50 dark:bg-slate-900 border-slate-200/80 dark:border-white/10 shadow-xs'
                    : 'bg-slate-100/40 dark:bg-slate-900/30 border-dashed border-slate-300 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="space-y-2">
                  <div className="text-3xl">{ach.icon}</div>
                  <h4 className="font-extrabold text-sm text-foreground">{ach.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {ach.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[11px]">
                  <span className="font-mono text-muted-foreground">
                    {ach.progress} / {ach.maxProgress}
                  </span>
                  {ach.isUnlocked ? (
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Unlocked</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 font-medium">In Progress</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* MODAL: INTERACTIVE REPLAY JOURNEY PLAYER */}
      <AnimatePresence>
        {isReplaying && filteredEvents.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl rounded-3xl bg-card border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-7 space-y-6 text-foreground"
            >
              {/* Replay Player Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                  <h3 className="font-extrabold text-base text-foreground">
                    Learning Journey Replay Player
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setIsReplaying(false);
                    setIsPlayingAuto(false);
                  }}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    Milestone {replayIndex + 1} of {filteredEvents.length}
                  </span>
                  <span>{filteredEvents[replayIndex]?.date}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                    style={{
                      width: `${((replayIndex + 1) / filteredEvents.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Active Milestone Card */}
              {filteredEvents[replayIndex] && (
                <motion.div
                  key={filteredEvents[replayIndex].id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-500/25 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px]">
                      {filteredEvents[replayIndex].subjectName}
                    </span>
                    <span className="font-mono text-muted-foreground">
                      {filteredEvents[replayIndex].time}
                    </span>
                  </div>

                  <h4 className="text-lg font-black text-foreground">
                    {filteredEvents[replayIndex].title}
                  </h4>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {filteredEvents[replayIndex].description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-indigo-500/10 text-xs">
                    <span className="text-muted-foreground">
                      Duration: <strong className="text-foreground">{filteredEvents[replayIndex].durationMinutes}m</strong>
                    </span>
                    {filteredEvents[replayIndex].accuracy && (
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {filteredEvents[replayIndex].accuracy}% Accuracy
                      </span>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Player Controls */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setReplayIndex((prev) => Math.max(0, prev - 1))}
                  disabled={replayIndex === 0}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>

                <button
                  onClick={() => setIsPlayingAuto(!isPlayingAuto)}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  {isPlayingAuto ? (
                    <>
                      <PauseCircle className="w-4 h-4" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4" />
                      <span>Auto Play</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setReplayIndex((prev) => Math.min(filteredEvents.length - 1, prev + 1))}
                  disabled={replayIndex >= filteredEvents.length - 1}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EXPORT PDF / PRINTABLE REPORT */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl bg-card border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-7 space-y-5 text-foreground"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-extrabold text-base text-foreground">
                    Export Study Replay Report
                  </h3>
                </div>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-foreground">Select Report Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'study_report', label: 'Study PDF' },
                    { id: 'monthly', label: 'Monthly Report' },
                    { id: 'yearly', label: 'Yearly Summary' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setExportType(r.id as any)}
                      className={`p-3 rounded-2xl border text-xs font-bold cursor-pointer transition-all ${
                        exportType === r.id
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 text-muted-foreground'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Printable Document Preview Summary */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-white/5 space-y-2 text-xs">
                <div className="font-extrabold text-foreground">
                  Rankify Study Diary — {user?.displayName || 'Student'}
                </div>
                <div className="text-muted-foreground">
                  CBSE Class 12 PCM • {stats?.totalHours || 76.5}h Study Time • {stats?.currentStreak || 15} Day Streak
                </div>
                <div className="text-muted-foreground">
                  Total Questions: {stats?.questionsSolved || 480} • Accuracy: {stats?.overallAccuracy || 88}%
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={handlePrintOrDownload}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Print / Save as PDF</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
