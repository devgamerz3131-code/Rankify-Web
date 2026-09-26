import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Copy, Check, RefreshCw } from 'lucide-react';
import { Message } from '../model/chat-models';

interface PromptCardProps {
  message: Message;
  isCopied: boolean;
  onCopy: (msgId: string, promptText: string) => void;
  onRegenerate: (msgId: string, questionText: string) => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({
  message,
  isCopied,
  onCopy,
  onRegenerate,
}) => {
  if (message.isGenerating) {
    return (
      <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 py-2">
        <Sparkles className="w-4 h-4 animate-spin" />
        <span>Generating the best AI prompt...</span>
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="font-mono text-purple-500 font-bold"
        >
          ▋
        </motion.span>
      </div>
    );
  }

  const promptResult = message.promptResult;
  if (!promptResult) return null;

  return (
    <div className="space-y-4">
      {/* Subject & Chapter Chips */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-2.5">
        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
          ⚡ {promptResult.subject}
        </span>
        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-foreground border border-slate-200/80 dark:border-slate-700/60">
          📖 {promptResult.chapter}
        </span>
      </div>

      {/* Structured Study Prompt Container */}
      <pre className="p-4 rounded-2xl bg-slate-900 text-purple-100 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto border border-purple-500/20 shadow-inner">
        {promptResult.rawPrompt}
      </pre>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onCopy(message.id, promptResult.rawPrompt)}
          className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition cursor-pointer"
        >
          {isCopied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-300" />
              <span>Prompt Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Prompt</span>
            </>
          )}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onRegenerate(message.id, message.question || message.text)}
          className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-foreground hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-slate-200/80 dark:border-slate-700/60"
        >
          <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Regenerate</span>
        </motion.button>
      </div>
    </div>
  );
};
