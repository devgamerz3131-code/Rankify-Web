import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, Lock, X, Sparkles, Flame, Coins } from 'lucide-react';
import { achievementsService, AchievementBadge } from '@/services/achievements-service';
import { monetizationService } from '@/services/monetization';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ isOpen, onClose }) => {
  const [badges, setBadges] = useState<AchievementBadge[]>(() => achievementsService.getBadges());
  const [points, setPoints] = useState<number>(() => monetizationService.getPointsBalance());

  useEffect(() => {
    const unsubA = achievementsService.subscribe((newBadges) => setBadges(newBadges));
    const unsubM = monetizationService.subscribe((m) => setPoints(m.studyPoints.balance));
    return () => {
      unsubA();
      unsubM();
    };
  }, []);

  if (!isOpen) return null;

  const unlockedCount = badges.filter((b) => b.isUnlocked).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-card border border-slate-200/90 dark:border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg text-foreground flex items-center gap-2">
                <span>CBSE Academic Badges</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  {unlockedCount} / {badges.length} Unlocked
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Earn badges and Study Points by mastering CBSE Class 12 PCM chapters.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-mono text-xs font-bold border border-amber-200 dark:border-amber-800">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span>{points} Points</span>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {badges.map((badge) => {
            const pct = Math.round((badge.progress / badge.maxProgress) * 100);

            return (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                  badge.isUnlocked
                    ? 'border-purple-500/40 bg-purple-50/50 dark:bg-purple-950/20 shadow-xs'
                    : 'border-slate-200/80 dark:border-white/5 bg-slate-50/60 dark:bg-slate-900/40 opacity-80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-xs ${
                        badge.isUnlocked
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-muted-foreground'
                      }`}
                    >
                      {badge.icon}
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-xs font-black text-foreground flex items-center gap-1.5">
                        <span>{badge.title}</span>
                        {badge.isUnlocked ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        {badge.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-muted-foreground">
                      {badge.progress} / {badge.maxProgress}
                    </span>
                    <span className="text-purple-600 dark:text-purple-400 font-mono">
                      +{badge.pointsAward} Points
                    </span>
                  </div>

                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        badge.isUnlocked ? 'bg-purple-600' : 'bg-slate-400 dark:bg-slate-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
