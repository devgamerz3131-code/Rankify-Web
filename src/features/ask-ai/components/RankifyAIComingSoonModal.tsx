import React from 'react';
import { Sparkles, Bot, Lock, CheckCircle2, ArrowRight, X } from 'lucide-react';

interface RankifyAIComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RankifyAIComingSoonModal: React.FC<RankifyAIComingSoonModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-fadeIn">
      <div className="relative w-full max-w-md bg-card border border-purple-500/30 rounded-3xl p-6 shadow-2xl space-y-5 text-foreground">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center mx-auto border border-purple-200 dark:border-purple-800/40 shadow-inner">
          <Bot className="w-7 h-7" />
        </div>

        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-black border border-purple-200 dark:border-purple-800/40">
            <Lock className="w-3 h-3" />
            <span>Rankify Direct AI Engine</span>
            <span className="text-amber-600 dark:text-amber-400 font-extrabold">• Coming Soon</span>
          </div>
          <h3 className="text-xl font-black tracking-tight text-foreground">
            On-Device CBSE AI Mentor
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Our custom fine-tuned on-device AI model for CBSE Class 12 PCM is currently undergoing final board calibration.
          </p>
        </div>

        <div className="space-y-2.5 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-white/5 text-xs">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-foreground">Zero Quota Errors</span>
              <span className="text-muted-foreground text-[11px]">
                Enjoy unlimited offline prompt synthesis for ChatGPT & Gemini.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-foreground">Auto Subject & Chapter Recognition</span>
              <span className="text-muted-foreground text-[11px]">
                Identifies Physics, Chemistry, and Maths units across all 37 NCERT topics.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-foreground">1-Tap App Launching</span>
              <span className="text-muted-foreground text-[11px]">
                One tap copies the prompt and opens ChatGPT or Gemini directly.
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Continue Using Prompt Generator</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
