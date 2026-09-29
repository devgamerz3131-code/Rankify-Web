import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigation } from '@/contexts/NavigationContext';
import { ncertService } from '@/services/ncert-service';
import { NcertIntelligenceState } from '@/types/ncert';
import {
  BookOpen,
  Sparkles,
  Clock,
  Bookmark,
  Highlighter,
  ArrowRight,
  ChevronRight,
  Zap,
  Award,
} from 'lucide-react';

export const NcertIntelligenceCard: React.FC = () => {
  const { setActiveTab } = useNavigation();
  const [state, setState] = useState<NcertIntelligenceState>(() =>
    ncertService.getCachedState()
  );

  useEffect(() => {
    const unsub = ncertService.subscribe((s) => {
      setState(s);
    });
    return () => unsub();
  }, []);

  const chapters = ncertService.getChapters();
  const currentChapter = chapters[0]; // Current Electricity as top active
  const progress = state.progressMap[currentChapter.id] || {
    completionPercent: 68,
    readingMinutes: 32,
    confidenceScore: 82,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      onClick={() => setActiveTab('ncert' as any)}
      className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-blue-500/10 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-blue-950/30 border border-indigo-500/30 dark:border-indigo-400/20 p-5 sm:p-6 shadow-xl hover:shadow-2xl hover:border-indigo-500/50 transition-all duration-300 cursor-pointer"
    >
      <div className="absolute -right-16 -top-16 w-52 h-52 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />
      <div className="absolute -left-16 -bottom-16 w-52 h-52 rounded-full bg-purple-500/15 blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-3 max-w-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 text-xs font-black uppercase tracking-wider font-mono">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>NCERT Intelligence Engine</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[11px] font-bold font-mono">
              <Award className="w-3 h-3" />
              <span>Interactive Textbook</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold font-mono">
              <span>{state.overallStats.totalReadingTimeMinutes}m Read</span>
            </span>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <span>Smart NCERT Reader</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Read NCERT with instant AI explanations, audio speech, memory mnemonics, and linked board PYQs.
            </p>
          </div>

          {/* Current Chapter In-Progress Card */}
          <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-indigo-500/20 backdrop-blur-sm flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 line-clamp-1">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
              <div>
                <strong className="text-foreground">{currentChapter.title}</strong>{' '}
                <span className="text-muted-foreground">({progress.completionPercent}% complete)</span>
              </div>
            </div>

            <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
              ~{Math.max(10, currentChapter.totalEstimatedMinutes - progress.readingMinutes)}m left
            </span>
          </div>
        </div>

        {/* Right Metric Boxes & Quick Resume */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="p-3 sm:p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 text-center min-w-[76px] sm:min-w-[84px] shrink-0">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
              Confidence
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-500 mt-0.5">
              {progress.confidenceScore}%
            </div>
            <span className="text-[9px] text-muted-foreground font-mono">CBSE 12</span>
          </div>

          <div className="p-3 sm:p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/25 text-center min-w-[76px] sm:min-w-[84px] shrink-0">
            <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 tracking-wider block">
              Saved
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-purple-600 dark:text-purple-400 mt-0.5">
              {state.overallStats.totalBookmarksCount + state.overallStats.totalHighlightsCount}
            </div>
            <span className="text-[9px] text-purple-600/80 dark:text-purple-400/80 font-mono">Highlights</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab('ncert' as any);
            }}
            className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 active:scale-95"
          >
            <BookOpen className="w-4 h-4 fill-white" />
            <span>Open Reader</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
