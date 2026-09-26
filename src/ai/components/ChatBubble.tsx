import React from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, RotateCcw, User, Sparkles, Atom, Zap, Calculator, BookOpen } from 'lucide-react';
import { Message } from '../model/types';

interface ChatBubbleProps {
  message: Message;
  isCopied: boolean;
  onCopy: (text: string, id: string) => void;
  onRegenerate?: (id: string) => void;
  isRegenerating?: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isCopied,
  onCopy,
  onRegenerate,
  isRegenerating,
}) => {
  const isUser = message.role === 'user';
  const prompt = message.promptResult;

  const getSubjectBadge = (subj?: string) => {
    switch (subj) {
      case 'Physics':
        return {
          icon: Zap,
          cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        };
      case 'Chemistry':
        return {
          icon: Atom,
          cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        };
      case 'Maths':
        return {
          icon: Calculator,
          cls: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        };
      default:
        return {
          icon: BookOpen,
          cls: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
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
        transition={{ duration: 0.25 }}
        className="flex items-start justify-end gap-2.5 mb-4 group"
      >
        <div className="flex flex-col items-end max-w-[85%] sm:max-w-[70%]">
          <div className="px-4 py-3 rounded-2xl rounded-tr-xs bg-purple-600 text-white font-medium text-sm shadow-md">
            {message.content}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 px-1">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800/40">
          <User className="w-4 h-4" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="flex items-start gap-2.5 mb-6 group"
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
        <Sparkles className="w-4 h-4" />
      </div>

      <div className="flex-1 max-w-[95%] sm:max-w-[85%] space-y-2">
        {/* Header Tags */}
        <div className="flex flex-wrap items-center gap-2">
          {prompt && (
            <>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badgeInfo.cls}`}
              >
                <SubjectIcon className="w-3 h-3" />
                <span>{prompt.subject}</span>
              </span>

              {prompt.chapter?.name && (
                <span className="text-[11px] font-semibold text-muted-foreground bg-slate-100 dark:bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700/60">
                  {prompt.chapter.name}
                </span>
              )}
            </>
          )}

          <span className="text-[10px] text-muted-foreground font-mono ml-auto">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Structured Prompt Container */}
        <div className="p-4 sm:p-5 rounded-2xl rounded-tl-xs bg-card border border-slate-200/80 dark:border-white/10 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Generated CBSE Study Prompt
              </span>
            </div>

            <div className="flex items-center gap-1">
              {onRegenerate && (
                <button
                  onClick={() => onRegenerate(message.id)}
                  disabled={isRegenerating}
                  title="Regenerate Prompt"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                </button>
              )}

              <button
                onClick={() => onCopy(message.content, message.id)}
                title="Copy Prompt"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200/60 dark:border-purple-800/40 transition cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Prompt</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Prompt Body */}
          <div className="font-mono text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed select-all selection:bg-purple-500/20 selection:text-purple-600">
            {message.content}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
