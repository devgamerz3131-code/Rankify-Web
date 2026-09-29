import React from 'react';
import { motion } from 'framer-motion';
import { BriefingTone } from '@/types/briefing';
import { briefingService } from '@/services/briefing-service';
import {
  Sparkles,
  Check,
  X,
  Smile,
  ShieldAlert,
  Flame,
  Zap,
  Compass,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ToneSelectorModalProps {
  currentTone: BriefingTone;
  isOpen: boolean;
  onClose: () => void;
  onSelectTone: (tone: BriefingTone) => void;
}

export const ToneSelectorModal: React.FC<ToneSelectorModalProps> = ({
  currentTone,
  isOpen,
  onClose,
  onSelectTone,
}) => {
  if (!isOpen) return null;

  const TONES_CONFIG: {
    id: BriefingTone;
    title: string;
    description: string;
    sampleQuote: string;
    icon: any;
    accentColor: string;
  }[] = [
    {
      id: 'savage_friend',
      title: 'Savage Friend 😅',
      description: 'Playful, brutal honesty with memes and zero fluff.',
      sampleQuote:
        'Your Chemistry has been waiting longer than your unread notifications. Give it 35 minutes today before it haunts your mock!',
      icon: Flame,
      accentColor: 'from-orange-500/20 to-rose-500/20 text-rose-500 border-rose-500/30',
    },
    {
      id: 'motivational_mentor',
      title: 'Motivational Mentor 🚀',
      description: 'Elite ambition, consistency streaks, and high-performance mindset.',
      sampleQuote:
        'You are 5 days consistent. Elite board toppers protect momentum at all costs. Don’t break the streak today.',
      icon: Zap,
      accentColor: 'from-purple-500/20 to-indigo-500/20 text-purple-600 border-purple-500/30',
    },
    {
      id: 'strict_coach',
      title: 'Strict Coach ⏱️',
      description: 'Firm, no-excuses discipline focused on urgent deadlines.',
      sampleQuote:
        'Revision overdue by 9 days. Zero distractions until your Electrochemistry derivation drill is 100% complete.',
      icon: ShieldAlert,
      accentColor: 'from-amber-500/20 to-red-500/20 text-amber-600 border-amber-500/30',
    },
    {
      id: 'friendly_teacher',
      title: 'Friendly Teacher 🍎',
      description: 'Encouraging, patient, step-by-step guidance.',
      sampleQuote:
        'Small, steady progress today makes tomorrow’s exam so much easier. You’re doing wonderfully, let’s take it one step at a time.',
      icon: Smile,
      accentColor: 'from-emerald-500/20 to-teal-500/20 text-emerald-600 border-emerald-500/30',
    },
    {
      id: 'calm_guide',
      title: 'Calm Guide 🌿',
      description: 'Mindful, anxiety-reducing, and centered focus.',
      sampleQuote:
        'Take a calm breath. Don’t worry about the entire syllabus right now; 45 minutes of deep focus beats hours of anxious cramming.',
      icon: Compass,
      accentColor: 'from-blue-500/20 to-cyan-500/20 text-blue-600 border-blue-500/30',
    },
  ];

  const handleChoose = async (tone: BriefingTone) => {
    await briefingService.setPreferredTone(tone);
    onSelectTone(tone);
    toast.success(`Briefing persona switched to ${tone.replace('_', ' ')}!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg rounded-3xl bg-card border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-white/10">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 font-mono flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>AI Mentor Persona Selector</span>
            </span>
            <h3 className="text-base sm:text-lg font-black">
              Choose Your Daily Briefing Tone
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Personas List */}
        <div className="p-5 overflow-y-auto space-y-3 text-xs">
          {TONES_CONFIG.map((t) => {
            const isSelected = currentTone === t.id;
            const Icon = t.icon;

            return (
              <div
                key={t.id}
                onClick={() => handleChoose(t.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                  isSelected
                    ? 'ring-2 ring-purple-600 bg-purple-500/10 border-purple-500/40 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/80 dark:border-white/5 hover:border-purple-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${t.accentColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-foreground text-sm">{t.title}</h4>
                      <p className="text-[11px] text-muted-foreground">{t.description}</p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-white/5 text-[11px] italic text-muted-foreground">
                  "{t.sampleQuote}"
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
