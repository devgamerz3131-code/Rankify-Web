import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy,
  Check,
  RotateCcw,
  User,
  Sparkles,
  Atom,
  Zap,
  Calculator,
  BookOpen,
  Share2,
  Star,
  ExternalLink,
  Flame,
  CheckCircle2,
  Gauge,
  FileText,
  Clock,
  Compass,
  Download,
  Printer,
  ChevronDown,
} from 'lucide-react';
import { Message } from '../model/types';
import { exportPromptAsTxt, exportPromptAsPdf } from '../utils/export-prompt';

interface ChatBubbleProps {
  message: Message;
  isCopied: boolean;
  onCopy: (text: string, id: string) => void;
  onRegenerate?: (id: string) => void;
  onOpenChatGPT?: (promptText: string, id: string) => void;
  onOpenGemini?: (promptText: string, id: string) => void;
  onShare?: (promptText: string, subject: string, chapter: string) => void;
  onToggleFavorite?: (id: string) => void;
  isRegenerating?: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isCopied,
  onCopy,
  onRegenerate,
  onOpenChatGPT,
  onOpenGemini,
  onShare,
  onToggleFavorite,
  isRegenerating,
}) => {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const isUser = message.role === 'user';
  const prompt = message.promptResult;

  const getSubjectBadge = (subj?: string) => {
    switch (subj) {
      case 'Physics':
        return {
          name: 'Physics',
          icon: Zap,
          cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25',
          glow: 'from-blue-500/10 to-indigo-500/10',
        };
      case 'Chemistry':
        return {
          name: 'Chemistry',
          icon: Atom,
          cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
          glow: 'from-emerald-500/10 to-teal-500/10',
        };
      case 'Mathematics':
      case 'Maths':
        return {
          name: 'Mathematics',
          icon: Calculator,
          cls: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25',
          glow: 'from-purple-500/10 to-pink-500/10',
        };
      default:
        return {
          name: 'General CBSE',
          icon: BookOpen,
          cls: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25',
          glow: 'from-slate-500/10 to-zinc-500/10',
        };
    }
  };

  const badgeInfo = getSubjectBadge(prompt?.subject);
  const SubjectIcon = badgeInfo.icon;

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="flex items-start justify-end gap-2.5 mb-5 group"
      >
        <div className="flex flex-col items-end max-w-[85%] sm:max-w-[70%]">
          <div className="px-4 py-3 rounded-2xl rounded-tr-xs bg-purple-600 text-white font-medium text-sm shadow-md">
            {message.content}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 px-1">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800/40">
          <User className="w-4 h-4" />
        </div>
      </motion.div>
    );
  }

  // Derived metrics
  const charCount = prompt?.promptLength?.chars || message.content.length;
  const wordCount =
    prompt?.promptLength?.words ||
    message.content.trim().split(/\s+/).filter(Boolean).length;

  const qualityScore = prompt?.qualityScore || 'Excellent';
  const difficulty = prompt?.difficulty || 'Board Level';
  const questionType = prompt?.questionType || 'Concept';
  const intent = prompt?.intent || 'Detailed Study';
  const activeBooster = prompt?.activeBooster;
  const estimatedResponseLength =
    prompt?.estimatedResponseLength || '~1,800 - 2,500 words';
  const estimatedStudyTime = prompt?.estimatedStudyTime || '15 - 20 mins';
  const isFavorite = message.isFavorite || prompt?.isFavorite;

  const getQualityBadge = (score: string) => {
    switch (score) {
      case 'Excellent':
        return {
          label: 'Prompt Quality: Excellent',
          stars: '★★★★★',
          cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
        };
      case 'Very High':
        return {
          label: 'Prompt Quality: Very High',
          stars: '★★★★☆',
          cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25',
        };
      case 'High':
        return {
          label: 'Prompt Quality: High',
          stars: '★★★★☆',
          cls: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25',
        };
      default:
        return {
          label: 'Prompt Quality: Good',
          stars: '★★★☆☆',
          cls: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25',
        };
    }
  };

  const qualityBadge = getQualityBadge(qualityScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-3 mb-8 group"
    >
      {/* Bot Icon */}
      <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
        <Sparkles className="w-4 h-4" />
      </div>

      <div className="flex-1 max-w-[98%] sm:max-w-[92%] space-y-3">
        {/* ========================================================= */}
        {/* PROMPT CARD (Material 3 Surface) */}
        {/* ========================================================= */}
        <div className="rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-lg overflow-hidden transition-all hover:border-purple-500/30">
          {/* Card Top Banner: Metadata Chips & Coach Status */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/30 flex flex-wrap items-center justify-between gap-2.5">
            {/* Left Chips: Detected Subject, Detected Chapter, Question Type, Intent, Booster */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Detected Subject Chip */}
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${badgeInfo.cls}`}
              >
                <SubjectIcon className="w-3.5 h-3.5" />
                <span>{badgeInfo.name}</span>
              </span>

              {/* Detected Chapter Chip */}
              {prompt?.chapter?.name && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700/80 shadow-2xs">
                  <FileText className="w-3 h-3 text-purple-500" />
                  <span>{prompt.chapter.name}</span>
                </span>
              )}

              {/* Question Type Chip */}
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-100/70 dark:bg-purple-950/70 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800/60">
                <Flame className="w-3 h-3 text-amber-500" />
                <span>{questionType}</span>
              </span>

              {/* Study Intent Chip */}
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-100/70 dark:bg-sky-950/70 px-2.5 py-0.5 rounded-full border border-sky-200 dark:border-sky-800/60">
                <Compass className="w-3 h-3 text-sky-500" />
                <span>{intent}</span>
              </span>

              {/* Active Booster Pill (if applied) */}
              {activeBooster && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-700/60">
                  <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>{activeBooster}</span>
                </span>
              )}

              {/* Coach Active Pill */}
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700/60">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                <span>Coach Active</span>
              </span>
            </div>

            {/* Right Meta: Favorite & Time */}
            <div className="flex items-center gap-1.5 ml-auto">
              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={() => onToggleFavorite(message.id)}
                  title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                    isFavorite
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-slate-200/60 dark:hover:bg-slate-800 border-transparent'
                  }`}
                >
                  <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-500' : ''}`} />
                </button>
              )}

              <span className="text-[11px] text-muted-foreground font-mono px-1">
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* Card Middle: Key Metrics Bar (Difficulty, Est Response Length, Est Study Time, Prompt Quality) */}
          <div className="px-4 sm:px-5 py-2.5 bg-slate-100/60 dark:bg-slate-900/60 border-b border-slate-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            {/* Difficulty */}
            <div className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-semibold text-foreground/80">Difficulty:</span>
              <span className="font-bold text-foreground">{difficulty}</span>
            </div>

            {/* Estimated Response Length */}
            <div className="flex items-center gap-1.5 font-mono">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span className="font-semibold text-foreground/80">Est. Response:</span>
              <span>{estimatedResponseLength}</span>
            </div>

            {/* Estimated Study Time */}
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-semibold text-foreground/80">Study Time:</span>
              <span className="font-bold text-foreground">{estimatedStudyTime}</span>
            </div>

            {/* Prompt Quality Score: Excellent / Very High / High / Good */}
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${qualityBadge.cls}`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>{qualityBadge.label}</span>
              <span className="tracking-widest ml-0.5">{qualityBadge.stars}</span>
            </div>
          </div>

          {/* Card Body: The Generated Prompt */}
          <div className="p-4 sm:p-5 relative">
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800/80 font-mono text-xs sm:text-sm text-foreground/95 whitespace-pre-wrap leading-relaxed select-all selection:bg-purple-500/25 selection:text-purple-600">
              {message.content}
            </div>
          </div>

          {/* ========================================================= */}
          {/* BUTTONS TOOLBAR */}
          {/* 1. Copy Prompt */}
          {/* 2. Open ChatGPT */}
          {/* 3. Open Gemini */}
          {/* 4. Export (TXT / PDF) */}
          {/* 5. Share */}
          {/* 6. Regenerate Prompt */}
          {/* 7. Favorite */}
          {/* ========================================================= */}
          <div className="p-3 sm:p-4 bg-slate-50/70 dark:bg-slate-900/40 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {/* Copy Prompt Button with smooth animation & feedback */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => onCopy(message.content, message.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                  isCopied
                    ? 'bg-emerald-600 text-white shadow-emerald-500/25 ring-2 ring-emerald-500/30'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20'
                }`}
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white animate-bounce" />
                    <span>Prompt copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Prompt</span>
                  </>
                )}
              </motion.button>

              {/* Open ChatGPT Button */}
              {onOpenChatGPT && (
                <button
                  type="button"
                  onClick={() => onOpenChatGPT(message.content, message.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#10a37f] hover:bg-[#0e8f6f] text-white shadow-xs transition-all cursor-pointer"
                  title="Copy prompt & continue in ChatGPT"
                >
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span>Open ChatGPT</span>
                  <ExternalLink className="w-3 h-3 opacity-70 ml-0.5" />
                </button>
              )}

              {/* Open Gemini Button */}
              {onOpenGemini && (
                <button
                  type="button"
                  onClick={() => onOpenGemini(message.content, message.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xs transition-all cursor-pointer"
                  title="Copy prompt & continue in Gemini"
                >
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span>Open Gemini</span>
                  <ExternalLink className="w-3 h-3 opacity-70 ml-0.5" />
                </button>
              )}
            </div>

            {/* Secondary Actions: Export, Share, Regenerate, Favorite */}
            <div className="flex items-center gap-1.5 ml-auto relative">
              {/* Export Menu (TXT & PDF) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsExportOpen(!isExportOpen)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border border-slate-200 dark:border-slate-700/80"
                  title="Export options"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>

                <AnimatePresence>
                  {isExportOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 bottom-full mb-1.5 w-40 p-1.5 bg-card border border-slate-200/90 dark:border-slate-700 rounded-xl shadow-xl z-20 space-y-0.5"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          exportPromptAsTxt(
                            message.content,
                            badgeInfo.name,
                            prompt?.chapter?.name || 'Class12'
                          );
                          setIsExportOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-foreground hover:bg-purple-50 dark:hover:bg-purple-950/40 text-left transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-purple-600" />
                        <span>Export as TXT</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          exportPromptAsPdf(
                            message.content,
                            badgeInfo.name,
                            prompt?.chapter?.name || 'Class12',
                            qualityScore
                          );
                          setIsExportOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-foreground hover:bg-purple-50 dark:hover:bg-purple-950/40 text-left transition cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Print / Save PDF</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Share Button */}
              {onShare && (
                <button
                  type="button"
                  onClick={() =>
                    onShare(
                      message.content,
                      badgeInfo.name,
                      prompt?.chapter?.name || 'Class 12'
                    )
                  }
                  title="Share prompt"
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200 dark:border-slate-700/80"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              )}

              {/* Regenerate Prompt Button */}
              {onRegenerate && (
                <button
                  type="button"
                  onClick={() => onRegenerate(message.id)}
                  disabled={isRegenerating}
                  title="Regenerate Prompt"
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200 dark:border-slate-700/80 disabled:opacity-50"
                >
                  <RotateCcw
                    className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`}
                  />
                  <span className="hidden sm:inline">Regenerate</span>
                </button>
              )}

              {/* Favorite Button */}
              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={() => onToggleFavorite(message.id)}
                  title={isFavorite ? 'Favorited' : 'Favorite prompt'}
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    isFavorite
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-muted-foreground hover:text-foreground border-slate-200 dark:border-slate-700/80'
                  }`}
                >
                  <Star
                    className={`w-3.5 h-3.5 ${
                      isFavorite ? 'fill-amber-500 text-amber-500' : ''
                    }`}
                  />
                  <span className="hidden sm:inline">
                    {isFavorite ? 'Favorited' : 'Favorite'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
