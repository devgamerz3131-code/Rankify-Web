import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NcertChapter, NcertSubject } from '@/types/ncert';
import { ncertService } from '@/services/ncert-service';
import { SmartReaderView } from './components/SmartReaderView';
import { RevisionModeModal } from './components/RevisionModeModal';
import {
  BookOpen,
  Search,
  Sparkles,
  Zap,
  Target,
  Award,
  Clock,
  Bookmark,
  Highlighter,
  ArrowRight,
  TrendingUp,
  Brain,
  CheckCircle2,
  FileText,
  Filter,
  X,
  ExternalLink,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import toast from 'react-hot-toast';

export const NcertLibraryView: React.FC = () => {
  const [activeChapter, setActiveChapter] = useState<NcertChapter | null>(null);
  const [revisionModalChapter, setRevisionModalChapter] = useState<NcertChapter | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<'All' | NcertSubject>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ReturnType<typeof ncertService.searchNcert>>([]);
  const [state, setState] = useState(() => ncertService.getCachedState());

  useEffect(() => {
    const unsub = ncertService.subscribe((s) => {
      setState(s);
    });
    return () => unsub();
  }, []);

  const chapters = ncertService.getChapters();

  const filteredChapters = chapters.filter((ch) => {
    if (selectedSubject !== 'All' && ch.subject !== selectedSubject) return false;
    return true;
  });

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (q.trim().length >= 2) {
      const results = ncertService.searchNcert(q);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectSearchResult = (result: (typeof searchResults)[0]) => {
    const targetChapter = chapters.find((ch) => ch.id === result.chapterId);
    if (targetChapter) {
      setActiveChapter(targetChapter);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  // If student is reading a chapter, show SmartReaderView
  if (activeChapter) {
    return (
      <>
        <SmartReaderView
          chapter={activeChapter}
          onBack={() => setActiveChapter(null)}
          onOpenRevisionModal={() => setRevisionModalChapter(activeChapter)}
        />
        {revisionModalChapter && (
          <RevisionModeModal
            chapter={revisionModalChapter}
            isOpen={!!revisionModalChapter}
            onClose={() => setRevisionModalChapter(null)}
          />
        )}
      </>
    );
  }

  const { overallStats, progressMap } = state;

  return (
    <div className="max-w-7xl mx-auto space-y-7 pb-28 select-none px-2 sm:px-4">
      {/* 1. HERO BANNER: NCERT INTELLIGENCE ENGINE */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-purple-950 to-indigo-950 p-6 sm:p-8 text-white shadow-2xl border border-purple-500/30">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/25 border border-purple-400/40 text-purple-300 text-xs font-black uppercase tracking-wider font-mono">
                <BookOpen className="w-3.5 h-3.5 text-purple-300" />
                <span>NCERT Intelligence Engine</span>
              </span>

              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider font-mono border bg-amber-500/20 text-amber-300 border-amber-500/40">
                Interactive Learning
              </span>

              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[11px] font-mono">
                Never Read A Boring PDF
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Every NCERT Line Connected To AI Explanations & Board PYQs.
            </h1>

            <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed italic">
              "Transform textbook reading with paragraph-level intuitive explanations, memory mnemonics, audio speech mode, and automatic revision cheatsheets."
            </p>
          </div>

          {/* Right Metrics summary */}
          <div className="flex flex-row sm:flex-row items-center gap-3 w-full lg:w-auto justify-around sm:justify-end">
            <div className="p-4 rounded-3xl bg-purple-900/40 border border-purple-400/30 text-center min-w-[120px] shrink-0 backdrop-blur-md">
              <span className="text-[10px] text-purple-200 font-bold uppercase tracking-wider block">
                Total Reading Time
              </span>
              <div className="text-3xl font-black font-mono text-white mt-1">
                {overallStats.totalReadingTimeMinutes}m
              </div>
              <span className="text-[10px] text-purple-300 font-mono">Active Focus</span>
            </div>

            <div className="p-4 rounded-3xl bg-indigo-900/40 border border-indigo-400/30 text-center min-w-[120px] shrink-0 backdrop-blur-md">
              <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider block">
                Avg. Confidence
              </span>
              <div className="text-3xl font-black font-mono text-emerald-400 mt-1">
                {overallStats.averageConfidence}%
              </div>
              <span className="text-[10px] text-emerald-300 font-mono">Exam Readiness</span>
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative z-10 mt-6 pt-4 border-t border-white/10">
          <div className="relative max-w-xl">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search entire NCERT (e.g. 'drift velocity', 'Nernst', 'adjoint', 'Wheatstone')..."
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-purple-200/60 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-400 backdrop-blur-md"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 max-w-xl mt-2 p-3 rounded-2xl bg-card border border-slate-200 dark:border-white/10 shadow-2xl z-50 space-y-2 max-h-72 overflow-y-auto text-xs text-foreground">
              <span className="text-[10px] font-black uppercase text-purple-600 font-mono block px-2">
                Found {searchResults.length} Match(es) across NCERT:
              </span>
              {searchResults.map((res, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSearchResult(res)}
                  className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer space-y-0.5 border border-transparent hover:border-purple-300"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-purple-600 uppercase font-mono">{res.subject} • {res.chapterTitle}</span>
                    <span className="px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-600 font-mono uppercase">{res.matchType}</span>
                  </div>
                  <p className="text-foreground text-xs font-semibold line-clamp-1">{res.snippet}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. SUBJECT & PART FILTERS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase text-muted-foreground font-mono">Subject:</span>
          {(['All', 'Physics', 'Chemistry', 'Mathematics'] as const).map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedSubject === sub
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
          <span>{filteredChapters.length} Active Chapter(s) Available</span>
        </div>
      </div>

      {/* 3. CHAPTERS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredChapters.map((ch) => {
          const progress = progressMap[ch.id] || {
            completionPercent: 0,
            readingMinutes: 0,
            confidenceScore: 50,
          };

          return (
            <div
              key={ch.id}
              className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4 hover:border-purple-500/60 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase font-mono text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
                    {ch.subject} • {ch.bookPart}
                  </span>
                  <span className="text-xs font-mono font-black text-foreground">
                    {ch.weightageMarks} Marks
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-lg text-foreground line-clamp-1">
                    {ch.chapterNumber}. {ch.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                    {ch.summary}
                  </p>
                </div>

                {/* Reading Progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Reading Progress</span>
                    <span className="font-bold text-foreground">{progress.completionPercent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                      style={{ width: `${progress.completionPercent}%` }}
                    />
                  </div>
                </div>

                {/* Sub-stats */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 space-y-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Time Spent</span>
                    <div className="text-sm font-black font-mono text-foreground">{progress.readingMinutes}m</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 space-y-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Confidence</span>
                    <div className="text-sm font-black font-mono text-emerald-500">{progress.confidenceScore}%</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200/60 dark:border-white/5 flex items-center gap-2">
                <button
                  onClick={() => setActiveChapter(ch)}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Smart Reader</span>
                </button>

                <button
                  onClick={() => setRevisionModalChapter(ch)}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-500/10 hover:text-purple-600 text-foreground font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                  title="Open Rapid Revision Pack"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Revision</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revision Modal */}
      {revisionModalChapter && (
        <RevisionModeModal
          chapter={revisionModalChapter}
          isOpen={!!revisionModalChapter}
          onClose={() => setRevisionModalChapter(null)}
        />
      )}
    </div>
  );
};
