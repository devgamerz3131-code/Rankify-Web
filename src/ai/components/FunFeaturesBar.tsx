import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dices,
  Sparkles,
  Quote,
  Lightbulb,
  X,
  ArrowRight,
  Flame,
} from 'lucide-react';
import {
  getRandomStudyChallenge,
  getLuckyQuestion,
  getRandomMotivationQuote,
  getDailyTip,
  FunItem,
} from '../utils/fun-features';

interface FunFeaturesBarProps {
  onAskPrompt: (promptText: string) => void;
}

export const FunFeaturesBarComponent: React.FC<FunFeaturesBarProps> = ({
  onAskPrompt,
}) => {
  const [activeItem, setActiveItem] = useState<FunItem | null>(null);

  const handleOpenChallenge = () => {
    setActiveItem(getRandomStudyChallenge());
  };

  const handleOpenLucky = () => {
    setActiveItem(getLuckyQuestion());
  };

  const handleOpenQuote = () => {
    setActiveItem(getRandomMotivationQuote());
  };

  const handleOpenTip = () => {
    setActiveItem(getDailyTip());
  };

  return (
    <>
      {/* Sleek Arc / Notion Action Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-1">
        <button
          type="button"
          onClick={handleOpenChallenge}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 transition-all cursor-pointer shrink-0 shadow-2xs"
          title="Get a 15-minute study challenge"
        >
          <Dices className="w-3 h-3 text-amber-500" />
          <span>Study Challenge</span>
        </button>

        <button
          type="button"
          onClick={handleOpenLucky}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/20 transition-all cursor-pointer shrink-0 shadow-2xs"
          title="Pick a high-yield lucky board question"
        >
          <Sparkles className="w-3 h-3 text-purple-500" />
          <span>Lucky Question</span>
        </button>

        <button
          type="button"
          onClick={handleOpenQuote}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 transition-all cursor-pointer shrink-0 shadow-2xs"
          title="Daily Motivation Quote"
        >
          <Quote className="w-3 h-3 text-emerald-500" />
          <span>Motivation</span>
        </button>

        <button
          type="button"
          onClick={handleOpenTip}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/20 transition-all cursor-pointer shrink-0 shadow-2xs"
          title="Daily Board Exam Tip"
        >
          <Lightbulb className="w-3 h-3 text-blue-500" />
          <span>Daily Tip</span>
        </button>
      </div>

      {/* Popover / Modal for Active Fun Feature */}
      <AnimatePresence>
        {activeItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md p-5 rounded-3xl bg-card border border-slate-200/90 dark:border-white/10 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                  {activeItem.title}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveItem(null)}
                  className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-foreground/90 leading-relaxed font-medium">
                {activeItem.content}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveItem(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Close
                </button>

                {activeItem.promptToAsk && (
                  <button
                    type="button"
                    onClick={() => {
                      const prompt = activeItem.promptToAsk!;
                      setActiveItem(null);
                      onAskPrompt(prompt);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition cursor-pointer shadow-md"
                  >
                    <span>{activeItem.actionText || 'Ask Coach'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export const FunFeaturesBar = memo(FunFeaturesBarComponent);
