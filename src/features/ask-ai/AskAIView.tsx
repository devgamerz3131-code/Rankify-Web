import React from 'react';
import { Bot, Sparkles, Clock, ArrowLeft, ShieldCheck, Zap } from 'lucide-react';
import { useNavigation } from '@/contexts/NavigationContext';

export const AskAIView: React.FC = () => {
  const { setActiveTab } = useNavigation();

  return (
    <div className="w-full min-h-[580px] max-w-4xl mx-auto py-8 px-4 flex flex-col items-center justify-center text-center space-y-6 select-none">
      <div className="relative">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-2xl shadow-purple-500/30 border border-white/20">
          <Bot className="w-10 h-10" />
        </div>
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-purple-500" />
        </span>
      </div>

      <div className="space-y-2 max-w-md">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-black border border-purple-200 dark:border-purple-800/40">
          <Clock className="w-3.5 h-3.5" />
          <span>Rankify AI Tutor</span>
          <span className="text-amber-600 dark:text-amber-400 font-extrabold">• Coming Soon</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          On-Device CBSE AI Mentor
        </h1>

        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          We are calibrating a custom fine-tuned on-device AI model specifically for CBSE Class 12 Physics, Chemistry, and Mathematics.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl text-left pt-2">
        <div className="p-4 rounded-2xl bg-card border border-slate-200/80 dark:border-white/10 space-y-1">
          <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-xs font-bold text-foreground block">Zero Latency</span>
          <p className="text-[11px] text-muted-foreground">Instant local response without external server calls.</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-slate-200/80 dark:border-white/10 space-y-1">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-bold text-foreground block">100% Private</span>
          <p className="text-[11px] text-muted-foreground">Your doubts stay completely on your device.</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-slate-200/80 dark:border-white/10 space-y-1">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-bold text-foreground block">NCERT Step-by-Step</span>
          <p className="text-[11px] text-muted-foreground">Aligned with official CBSE 12 step-marking schemes.</p>
        </div>
      </div>

      <button
        onClick={() => setActiveTab('home')}
        className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition cursor-pointer flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </button>
    </div>
  );
};
