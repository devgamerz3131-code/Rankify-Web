import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NcertChapter, RevisionModeType } from '@/types/ncert';
import {
  Clock,
  Zap,
  CheckCircle2,
  Sparkles,
  BookOpen,
  ArrowRight,
  Shield,
  X,
  FileText,
  AlertTriangle,
  Check,
} from 'lucide-react';

interface RevisionModeModalProps {
  chapter: NcertChapter;
  isOpen: boolean;
  onClose: () => void;
}

export const RevisionModeModal: React.FC<RevisionModeModalProps> = ({
  chapter,
  isOpen,
  onClose,
}) => {
  const [activeMode, setActiveMode] = useState<RevisionModeType>('5_min');

  if (!isOpen) return null;

  const { revisionPack } = chapter;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-2xl rounded-3xl bg-card border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-950 text-white flex items-center justify-between border-b border-white/10">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 font-mono flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>NCERT Rapid Revision Suite</span>
            </span>
            <h3 className="text-lg font-black">{chapter.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Mode Buttons */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200/80 dark:border-white/5 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
          {[
            { id: '5_min', label: '5-Minute Blitz', time: '~5 mins', badge: 'High Yield' },
            { id: '15_min', label: '15-Minute Concept Map', time: '~15 mins', badge: 'Formulas' },
            { id: '30_min', label: '30-Minute Derivation', time: '~30 mins', badge: 'Exemplar' },
            { id: 'one_night_before', label: 'One Night Before Exam', time: 'Guaranteed', badge: 'Crucial' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id as RevisionModeType)}
              className={`px-3 py-2 rounded-2xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeMode === mode.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-muted-foreground hover:text-foreground border border-slate-200/60 dark:border-white/5'
              }`}
            >
              <span>{mode.label}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-md font-mono ${
                  activeMode === mode.id
                    ? 'bg-white/20 text-white'
                    : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                }`}
              >
                {mode.badge}
              </span>
            </button>
          ))}
        </div>

        {/* Mode Content Scrollable */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {activeMode === '5_min' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 font-medium">
                ⚡ <strong>5-Minute High-Yield Flashpoints:</strong> Core formulas and physical laws extracted verbatim from the NCERT summary.
              </div>

              <div className="space-y-2">
                {revisionPack.fiveMinRevision.map((point, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-white/5 flex items-start gap-2.5 text-foreground leading-relaxed"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeMode === '15_min' && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-800 dark:text-purple-300 font-medium">
                🧠 <strong>15-Minute Concept Consolidation:</strong> Critical relations, microscopic implications, and solving strategies.
              </div>

              {revisionPack.fifteenMinRevision.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-white/5 space-y-2"
                >
                  <h4 className="font-black text-sm text-foreground">{item.concept}</h4>
                  <div className="space-y-1.5 pl-1">
                    {item.points.map((p, i) => (
                      <div key={i} className="flex items-start gap-2 text-muted-foreground leading-relaxed">
                        <span className="text-purple-600 font-bold">•</span>
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeMode === '30_min' && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-800 dark:text-indigo-300 font-medium">
                🎯 <strong>30-Minute Derivation & Exemplar Traps:</strong> Common deduction errors and tricky board question angles.
              </div>

              {revisionPack.thirtyMinRevision.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-white/5 space-y-2.5"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <h4 className="font-black text-sm text-foreground">{item.derivation}</h4>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1">
                    <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 font-mono block">
                      Exemplar Traps to Avoid:
                    </span>
                    {item.exemplarTraps.map((trap, tIdx) => (
                      <div key={tIdx} className="flex items-start gap-1.5 text-muted-foreground text-[11px]">
                        <span className="text-rose-500 font-bold">⚠️</span>
                        <span>{trap}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeMode === 'one_night_before' && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300 font-medium">
                🌙 <strong>One Night Before Exam Focus:</strong> Exact definitions to write for full marks and guaranteed board derivations.
              </div>

              {revisionPack.oneNightBefore.map((item, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-white/5 space-y-2">
                    <span className="text-[10px] font-black uppercase text-purple-600 font-mono block">
                      Vital Board Definitions (Word-for-Word Scoring):
                    </span>
                    <div className="space-y-2">
                      {item.vitalDefinitions.map((def, dIdx) => (
                        <div key={dIdx} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-white/5 leading-relaxed text-foreground">
                          {def}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-white/5 space-y-2">
                    <span className="text-[10px] font-black uppercase text-emerald-600 font-mono block">
                      Board Guaranteed Derivations:
                    </span>
                    <div className="space-y-1.5">
                      {item.boardGuaranteedDerivations.map((drv, drvIdx) => (
                        <div key={drvIdx} className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/10 text-foreground font-semibold">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{drv}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-900 border-t border-slate-200/80 dark:border-white/5 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground font-mono">
            Class 12 {chapter.subject} • NCERT Intelligence
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs cursor-pointer hover:bg-purple-500 transition-colors"
          >
            Done Reviewing
          </button>
        </div>
      </motion.div>
    </div>
  );
};
