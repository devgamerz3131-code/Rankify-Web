import React, { useState } from 'react';
import { Share2, Check, Copy, Flame, Award, Calendar, Clock, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { analytics } from '@/services/analytics';
import toast from 'react-hot-toast';

export type ShareCardType = 'progress' | 'streak' | 'achievement' | 'countdown';

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: ShareCardType;
  studentName?: string;
  streak?: number;
  studyMinutes?: number;
  tasksCompleted?: number;
  totalTasks?: number;
  daysToExam?: number;
  targetScore?: number;
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'progress',
  studentName = 'Scholar',
  streak = 4,
  studyMinutes = 120,
  tasksCompleted = 3,
  totalTasks = 3,
  daysToExam = 58,
  targetScore = 95,
}) => {
  const [selectedType, setSelectedType] = useState<ShareCardType>(defaultType);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const getShareText = () => {
    switch (selectedType) {
      case 'streak':
        return `🔥 Kept my ${streak}-day CBSE Class 12 PCM study streak alive on Rankify! Targeting ${targetScore}% in Board Exams! 🎯 #CBSE12 #Rankify`;
      case 'countdown':
        return `⏳ ${daysToExam} Days left for CBSE Class 12 Boards! Today's mission crushed on Rankify! 🚀 #CBSEClass12 #Physics #Chemistry #Maths`;
      case 'achievement':
        return `🏆 Unlocked new academic achievement badge on Rankify! Consistent preparation for CBSE Class 12 PCM! ✨ #BoardExams`;
      case 'progress':
      default:
        return `📚 Logged ${studyMinutes} mins of high-focus CBSE PCM study today on Rankify. Completed ${tasksCompleted}/${totalTasks} daily goals! 🌟 #Rankify`;
    }
  };

  const handleShare = async () => {
    const text = getShareText();
    analytics.track('share_card_generated', { card_type: selectedType });

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'My CBSE Class 12 Progress on Rankify',
          text,
          url: window.location.origin,
        });
        toast.success('Shared successfully!');
        return;
      } catch (e) {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Share card text copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-slate-200/90 dark:border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground font-black text-base">
            <Share2 className="w-5 h-5 text-purple-600" />
            <span>Share Study Milestone</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card Type Selector */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: 'progress', label: 'Progress', icon: Clock },
            { id: 'streak', label: 'Streak', icon: Flame },
            { id: 'countdown', label: 'Exam', icon: Calendar },
            { id: 'achievement', label: 'Badge', icon: Award },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = selectedType === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedType(item.id as ShareCardType)}
                className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-bold">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* The Visual Share Card Preview */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 p-6 text-white border border-purple-500/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-purple-600 flex items-center justify-center font-black text-xs">
                R
              </div>
              <span className="font-black text-sm tracking-tight text-white">Rankify</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-purple-200 font-bold border border-white/15">
              Class 12 Science PCM
            </span>
          </div>

          {/* Dynamic Content */}
          {selectedType === 'progress' && (
            <div className="space-y-2 py-2">
              <span className="text-xs text-purple-300 font-medium">Today's Academic Record</span>
              <div className="text-3xl font-black text-white font-mono">{studyMinutes} Mins</div>
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
                <span>✓ {tasksCompleted}/{totalTasks} Daily Goals Accomplished</span>
              </div>
            </div>
          )}

          {selectedType === 'streak' && (
            <div className="space-y-2 py-2">
              <span className="text-xs text-amber-300 font-medium">Daily Study Streak</span>
              <div className="text-3xl font-black text-amber-400 font-mono flex items-center gap-2">
                <span>🔥 {streak} Days</span>
              </div>
              <p className="text-xs text-slate-300">Unstoppable discipline for CBSE Boards!</p>
            </div>
          )}

          {selectedType === 'countdown' && (
            <div className="space-y-2 py-2">
              <span className="text-xs text-purple-300 font-medium">CBSE Class 12 Board Exam</span>
              <div className="text-3xl font-black text-purple-300 font-mono">⏳ {daysToExam} Days Left</div>
              <p className="text-xs text-slate-300">Target Score: {targetScore}% in Physics, Chem & Maths</p>
            </div>
          )}

          {selectedType === 'achievement' && (
            <div className="space-y-2 py-2">
              <span className="text-xs text-purple-300 font-medium">Academic Achievement</span>
              <div className="text-xl font-black text-white flex items-center gap-2">
                <span>🏆 Centurion Solver Badge</span>
              </div>
              <p className="text-xs text-slate-300">Mastered 100+ Board Questions with AI Tutor</p>
            </div>
          )}

          {/* Watermark Footer */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-purple-300/80">
            <span className="font-semibold">{studentName}</span>
            <span className="font-mono">Created with Rankify • CBSE PCM</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button onClick={handleShare} variant="primary" className="w-full text-xs font-bold h-10 gap-2">
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Summary Copied!' : 'Share Milestone Card'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
