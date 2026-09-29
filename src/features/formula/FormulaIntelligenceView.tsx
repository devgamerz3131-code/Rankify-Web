import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FormulaItem,
  FormulaSubject,
  FormulaMasteryLevel,
  FormulaIntelligenceState,
} from '@/types/formula';
import { formulaService } from '@/services/formula-service';
import { FormulaDerivationModal } from './components/FormulaDerivationModal';
import { FormulaPracticeModal } from './components/FormulaPracticeModal';
import { FormulaVisualSimulation } from './components/FormulaVisualSimulation';
import {
  Sparkles,
  Search,
  BookOpen,
  Zap,
  Target,
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Bookmark,
  Sliders,
  Play,
  RotateCcw,
  HelpCircle,
  Eye,
  X,
  FileText,
  Brain,
  TrendingUp,
  Layers,
  ChevronDown,
  Info,
  Lightbulb,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const FormulaIntelligenceView: React.FC = () => {
  const [selectedSubject, setSelectedSubject] = useState<'All' | FormulaSubject>('All');
  const [selectedMasteryFilter, setSelectedMasteryFilter] = useState<'all' | 'mastered' | 'weak' | 'critical'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFormulaId, setExpandedFormulaId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'ai_dive' | 'memory' | 'questions' | 'simulation'>('ai_dive');

  // Modals state
  const [derivationModalFormula, setDerivationModalFormula] = useState<FormulaItem | null>(null);
  const [practiceModalFormula, setPracticeModalFormula] = useState<FormulaItem | null>(null);
  const [showQuickRevisionModal, setShowQuickRevisionModal] = useState<boolean>(false);

  const [state, setState] = useState<FormulaIntelligenceState>(() =>
    formulaService.getCachedState()
  );

  useEffect(() => {
    const unsub = formulaService.subscribe((s) => {
      setState(s);
    });
    return () => unsub();
  }, []);

  const allFormulas = formulaService.getFormulas();

  const filteredFormulas = allFormulas.filter((f) => {
    if (selectedSubject !== 'All' && f.subject !== selectedSubject) return false;

    const telem = state.telemetry[f.id];
    if (selectedMasteryFilter === 'mastered' && telem?.masteryLevel !== 'mastered') return false;
    if (selectedMasteryFilter === 'weak' && !telem?.isWeak) return false;
    if (selectedMasteryFilter === 'critical' && f.importance !== 'Critical Board') return false;

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        f.name.toLowerCase().includes(q) ||
        f.chapter.toLowerCase().includes(q) ||
        f.textDisplay.toLowerCase().includes(q) ||
        f.variables.some((v) => v.name.toLowerCase().includes(q) || v.symbol.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  const { stats, telemetry } = state;

  const handleToggleBookmark = async (e: React.MouseEvent, formulaId: string) => {
    e.stopPropagation();
    const isNow = await formulaService.toggleBookmark(formulaId);
    if (isNow) {
      toast.success('Formula pinned to your Quick Formula Sheet!');
    } else {
      toast('Formula unpinned');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-7 pb-28 select-none px-2 sm:px-4">
      {/* 1. HERO BANNER: FORMULA INTELLIGENCE ENGINE */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-amber-950/60 to-purple-950 p-6 sm:p-8 text-white shadow-2xl border border-amber-500/30">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/25 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider font-mono">
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>Formula Intelligence Engine</span>
              </span>

              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider font-mono border bg-purple-500/20 text-purple-300 border-purple-500/40">
                Never Memorize Blindly
              </span>

              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[11px] font-mono">
                Meaning • Derivations • Traps
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Master the Equations That Guarantee 95%+ in Class 12 Boards.
            </h1>

            <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed italic">
              "Understand what every variable means, why the proof holds, when NOT to use the formula, and how to avoid exam trapdoors."
            </p>
          </div>

          {/* Right Metrics Cards */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto justify-around sm:justify-end">
            <div className="p-4 rounded-3xl bg-amber-950/40 border border-amber-400/30 text-center min-w-[110px] shrink-0 backdrop-blur-md">
              <span className="text-[10px] text-amber-200 font-bold uppercase tracking-wider block">
                Mastered
              </span>
              <div className="text-3xl font-black font-mono text-emerald-400 mt-1">
                {stats.masteredCount}
              </div>
              <span className="text-[10px] text-emerald-300 font-mono">Of {stats.totalFormulas} Formulas</span>
            </div>

            <div className="p-4 rounded-3xl bg-rose-950/40 border border-rose-400/30 text-center min-w-[110px] shrink-0 backdrop-blur-md">
              <span className="text-[10px] text-rose-200 font-bold uppercase tracking-wider block">
                Weak / Due
              </span>
              <div className="text-3xl font-black font-mono text-rose-400 mt-1">
                {stats.weakCount}
              </div>
              <span className="text-[10px] text-rose-300 font-mono">Requires Practice</span>
            </div>

            <div className="p-4 rounded-3xl bg-purple-900/40 border border-purple-400/30 text-center min-w-[110px] shrink-0 backdrop-blur-md">
              <span className="text-[10px] text-purple-200 font-bold uppercase tracking-wider block">
                Mastery Rate
              </span>
              <div className="text-3xl font-black font-mono text-purple-300 mt-1">
                {stats.overallMasteryPercent}%
              </div>
              <span className="text-[10px] text-purple-200 font-mono">Cohort Top 10%</span>
            </div>
          </div>
        </div>

        {/* Global Formula Search Bar */}
        <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full max-w-xl">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search formula by name, symbol, chapter (e.g. 'drift velocity', 'Nernst', 'A⁻¹', 'vd')..."
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-amber-200/60 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-400 backdrop-blur-md"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Revision Modal Trigger */}
          <button
            onClick={() => setShowQuickRevisionModal(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white font-extrabold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-white" />
            <span>5-Min Formula Sheet</span>
          </button>
        </div>
      </div>

      {/* 2. FILTERS BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase text-muted-foreground font-mono">Subject:</span>
          {(['All', 'Physics', 'Chemistry', 'Mathematics'] as const).map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedSubject === sub
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground font-mono">Status:</span>
          <select
            value={selectedMasteryFilter}
            onChange={(e) => setSelectedMasteryFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-background text-foreground font-bold"
          >
            <option value="all">All Formulas ({allFormulas.length})</option>
            <option value="mastered">Mastered Only ({stats.masteredCount})</option>
            <option value="weak">Weak / Traps ({stats.weakCount})</option>
            <option value="critical">Critical Board Only</option>
          </select>
        </div>
      </div>

      {/* 3. FORMULAS DECK */}
      <div className="space-y-5">
        {filteredFormulas.map((f) => {
          const telem = telemetry[f.id] || {
            masteryLevel: 'learning',
            confidenceScore: 50,
            isWeak: false,
            isBookmarked: false,
            nextRevisionDate: 'Soon',
          };

          const isExpanded = expandedFormulaId === f.id;

          return (
            <div
              key={f.id}
              className={`rounded-3xl border transition-all duration-300 overflow-hidden ${
                telem.isWeak
                  ? 'bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/40 shadow-xs'
                  : telem.masteryLevel === 'mastered'
                  ? 'bg-emerald-500/5 border-emerald-500/30'
                  : 'bg-card border-slate-200/80 dark:border-white/10'
              }`}
            >
              {/* Formula Card Header */}
              <div
                onClick={() => setExpandedFormulaId(isExpanded ? null : f.id)}
                className="p-5 sm:p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase font-mono px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      {f.subject} • {f.chapter}
                    </span>

                    <span
                      className={`text-[10px] font-black font-mono px-2 py-0.5 rounded-full ${
                        f.importance === 'Critical Board'
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          : 'bg-slate-200 dark:bg-slate-800 text-muted-foreground'
                      }`}
                    >
                      {f.importance.toUpperCase()}
                    </span>

                    <span
                      className={`text-[10px] font-black uppercase font-mono px-2 py-0.5 rounded-full ${
                        telem.masteryLevel === 'mastered'
                          ? 'bg-emerald-500/20 text-emerald-600'
                          : telem.isWeak
                          ? 'bg-rose-500/20 text-rose-600'
                          : 'bg-indigo-500/20 text-indigo-600'
                      }`}
                    >
                      {telem.masteryLevel.toUpperCase()} ({telem.confidenceScore}%)
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-foreground">
                    {f.name}
                  </h3>

                  {/* High-visibility Mathematical Formula Display */}
                  <div className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 text-center font-mono font-black text-base sm:text-xl text-purple-600 dark:text-purple-300 shadow-xs inline-block max-w-full overflow-x-auto">
                    {f.latex}
                  </div>
                </div>

                {/* Right Quick Actions */}
                <div className="flex flex-wrap md:flex-nowrap items-center gap-2 self-start md:self-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPracticeModalFormula(f);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5 fill-white" />
                    <span>Practice Drill</span>
                  </button>

                  {f.derivation && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDerivationModalFormula(f);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white text-foreground font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                      <span>Derivation</span>
                    </button>
                  )}

                  <button
                    onClick={(e) => handleToggleBookmark(e, f.id)}
                    className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                      telem.isBookmarked
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-500'
                        : 'border-slate-200 dark:border-white/10 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Bookmark className="w-4 h-4 fill-current" />
                  </button>

                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Expanded Formula Deep Dive */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="border-t border-slate-200/70 dark:border-white/5 p-5 sm:p-6 bg-slate-50/50 dark:bg-slate-900/40 space-y-5 text-xs"
                  >
                    {/* Variable Meaning & SI Units Table */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase text-purple-600 font-mono block">
                        Variable Definitions & Dimensions ({f.dimensions || 'Standard'})
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {f.variables.map((v, vIdx) => (
                          <div
                            key={vIdx}
                            className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/5 space-y-0.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-black text-purple-600 text-sm">
                                {v.symbol}
                              </span>
                              <span className="text-[10px] font-mono text-muted-foreground">
                                {v.siUnit}
                              </span>
                            </div>
                            <div className="font-bold text-foreground text-xs">{v.name}</div>
                            <p className="text-[11px] text-muted-foreground">{v.meaning}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Subtabs inside Deep Dive */}
                    <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border w-fit text-xs font-bold">
                      {[
                        { id: 'ai_dive', label: 'AI Explanation & Traps', icon: Brain },
                        { id: 'memory', label: 'Memory Booster', icon: Sparkles },
                        { id: 'questions', label: 'Board PYQs', icon: Target },
                        ...(f.visualType
                          ? [{ id: 'simulation', label: 'Visual Simulation', icon: Play }]
                          : []),
                      ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeSubTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveSubTab(tab.id as any)}
                            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                              isActive
                                ? 'bg-purple-600 text-white shadow-xs font-black'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Subtab 1: AI Explanation */}
                    {activeSubTab === 'ai_dive' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border space-y-2">
                          <span className="text-[10px] font-black uppercase text-purple-600 font-mono flex items-center gap-1">
                            <Lightbulb className="w-3.5 h-3.5" />
                            <span>Intuitive Simple Explanation</span>
                          </span>
                          <p className="text-foreground leading-relaxed">{f.simpleExplanation}</p>
                          <div className="p-2.5 rounded-xl bg-purple-500/10 text-foreground text-[11px]">
                            <strong>Real Life Example:</strong> {f.realLifeExample}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-1.5">
                            <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 font-mono flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>When NOT to Use (CBSE Trap Warnings)</span>
                            </span>
                            <ul className="space-y-1 pl-1">
                              {f.whenNotToUse.map((trap, tIdx) => (
                                <li key={tIdx} className="text-muted-foreground text-[11px] flex items-start gap-1.5">
                                  <span className="text-rose-500 font-bold">•</span>
                                  <span>{trap}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-1.5">
                            <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 font-mono flex items-center gap-1">
                              <Info className="w-3.5 h-3.5" />
                              <span>Common Confusion</span>
                            </span>
                            <ul className="space-y-1 pl-1">
                              {f.commonConfusion.map((conf, cIdx) => (
                                <li key={cIdx} className="text-muted-foreground text-[11px] flex items-start gap-1.5">
                                  <span className="text-amber-500 font-bold">•</span>
                                  <span>{conf}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Subtab 2: Memory Booster */}
                    {activeSubTab === 'memory' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-2">
                          <span className="text-[10px] font-black uppercase text-amber-600 font-mono block">
                            Catchy Mnemonic
                          </span>
                          <div className="text-base font-extrabold text-foreground font-mono">
                            {f.memoryBooster.mnemonic}
                          </div>
                          <p className="text-muted-foreground text-[11px]">
                            <strong>Shortcut:</strong> {f.memoryBooster.shortcut}
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 space-y-2">
                          <span className="text-[10px] font-black uppercase text-purple-600 font-mono block">
                            Story Method & Visual Anchor
                          </span>
                          <p className="text-foreground leading-relaxed">
                            {f.memoryBooster.storyMethod}
                          </p>
                          <div className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
                            👁️ {f.memoryBooster.visualMemoryTrick}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Subtab 3: Questions */}
                    {activeSubTab === 'questions' && (
                      <div className="space-y-3">
                        {f.relatedQuestions.map((q) => (
                          <div
                            key={q.id}
                            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-black text-purple-600 uppercase">
                                {q.source}
                              </span>
                              <span className="text-[10px] font-mono text-emerald-500 font-bold">
                                Answer: {q.answerValue}
                              </span>
                            </div>
                            <p className="font-bold text-foreground">{q.question}</p>
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-[11px] text-muted-foreground">
                              <strong>Formula Substitution:</strong> {q.solutionSummary}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Subtab 4: Visual Simulation */}
                    {activeSubTab === 'simulation' && f.visualType && (
                      <FormulaVisualSimulation type={f.visualType} />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Derivation Modal */}
      {derivationModalFormula && (
        <FormulaDerivationModal
          formula={derivationModalFormula}
          isOpen={!!derivationModalFormula}
          onClose={() => setDerivationModalFormula(null)}
        />
      )}

      {/* Practice Modal */}
      {practiceModalFormula && (
        <FormulaPracticeModal
          formula={practiceModalFormula}
          isOpen={!!practiceModalFormula}
          onClose={() => setPracticeModalFormula(null)}
        />
      )}

      {/* Quick Revision Modal (5-Min Blitz Sheet) */}
      {showQuickRevisionModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl rounded-3xl bg-card border border-slate-200 dark:border-white/10 shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto text-xs"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase text-amber-500 font-mono">
                  Rankify Rapid Revision Sheet
                </span>
                <h3 className="text-lg font-black text-foreground">
                  5-Minute Class 12 PCM Formula Flashcard Deck
                </h3>
              </div>
              <button
                onClick={() => setShowQuickRevisionModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {formulaService.getFiveMinuteRevision().map((group, gIdx) => (
                <div key={gIdx} className="space-y-2">
                  <span className="text-[10px] font-black uppercase font-mono text-purple-600 block">
                    {group.subject} High Yield Formulas:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.items.map((item, iIdx) => (
                      <div
                        key={iIdx}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border space-y-1"
                      >
                        <div className="font-bold text-foreground text-xs">{item.name}</div>
                        <div className="font-mono text-purple-600 font-black text-xs">
                          {item.latex}
                        </div>
                        <p className="text-[10px] text-muted-foreground italic">{item.tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t flex justify-end">
              <button
                onClick={() => setShowQuickRevisionModal(false)}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs cursor-pointer hover:bg-purple-500"
              >
                Close Sheet
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
