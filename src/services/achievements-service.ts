/**
 * Rankify Gamified Achievements Engine
 * Calculates unlocked badges and awards study points for CBSE Class 12 PCM discipline.
 */

import { safeLocalStorage } from '@/utils/storage';
import { monetizationService } from '@/services/monetization';
import { analytics } from '@/services/analytics';
import toast from 'react-hot-toast';

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'subject' | 'time' | 'discipline' | 'milestone';
  progress: number;
  maxProgress: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  pointsAward: number;
}

const STORAGE_KEY = 'rankify_achievements_state';

export const INITIAL_ACHIEVEMENTS: AchievementBadge[] = [
  {
    id: 'ach_first_session',
    title: 'First Step to 95%',
    description: 'Complete your first CBSE Class 12 study session.',
    icon: '🎯',
    category: 'milestone',
    progress: 1,
    maxProgress: 1,
    isUnlocked: true,
    unlockedAt: '2026-09-01T10:00:00Z',
    pointsAward: 50,
  },
  {
    id: 'ach_7_streak',
    title: 'Unstoppable Momentum',
    description: 'Maintain a 7-day consecutive study streak.',
    icon: '🔥',
    category: 'streak',
    progress: 3,
    maxProgress: 7,
    isUnlocked: false,
    pointsAward: 150,
  },
  {
    id: 'ach_100_questions',
    title: 'Centurion Solver',
    description: 'Solve 100 board practice questions across PCM.',
    icon: '💯',
    category: 'milestone',
    progress: 42,
    maxProgress: 100,
    isUnlocked: false,
    pointsAward: 200,
  },
  {
    id: 'ach_1000_minutes',
    title: 'Focus Marathon',
    description: 'Log 1,000 minutes of active CBSE Class 12 study.',
    icon: '⏱️',
    category: 'time',
    progress: 380,
    maxProgress: 1000,
    isUnlocked: false,
    pointsAward: 250,
  },
  {
    id: 'ach_physics_master',
    title: 'Physics Master',
    description: 'Complete all derivations in Electrostatics and Ray Optics.',
    icon: '⚡',
    category: 'subject',
    progress: 4,
    maxProgress: 14,
    isUnlocked: false,
    pointsAward: 180,
  },
  {
    id: 'ach_chemistry_expert',
    title: 'Chemistry Expert',
    description: 'Master Electrochemistry & Organic Reaction Mechanisms.',
    icon: '🧪',
    category: 'subject',
    progress: 3,
    maxProgress: 10,
    isUnlocked: false,
    pointsAward: 180,
  },
  {
    id: 'ach_math_champion',
    title: 'Math Champion',
    description: 'Conquer Differential & Integral Calculus chapters.',
    icon: '📐',
    category: 'subject',
    progress: 5,
    maxProgress: 13,
    isUnlocked: false,
    pointsAward: 180,
  },
  {
    id: 'ach_night_owl',
    title: 'Night Owl Scholar',
    description: 'Log a focused study session between 10:00 PM and 2:00 AM.',
    icon: '🦉',
    category: 'discipline',
    progress: 1,
    maxProgress: 1,
    isUnlocked: true,
    unlockedAt: '2026-09-20T22:30:00Z',
    pointsAward: 100,
  },
  {
    id: 'ach_early_bird',
    title: 'Early Bird Topper',
    description: 'Complete a study mission before 8:00 AM in peak focus hours.',
    icon: '🌅',
    category: 'discipline',
    progress: 0,
    maxProgress: 1,
    isUnlocked: false,
    pointsAward: 100,
  },
  {
    id: 'ach_revision_king',
    title: 'Spaced Recall King',
    description: 'Complete spaced revisions on 3 or more chapters.',
    icon: '👑',
    category: 'milestone',
    progress: 2,
    maxProgress: 3,
    isUnlocked: false,
    pointsAward: 150,
  },
];

class AchievementsService {
  private static instance: AchievementsService;
  private badges: AchievementBadge[];
  private listeners: Set<(badges: AchievementBadge[]) => void> = new Set();

  private constructor() {
    this.badges = safeLocalStorage.getItem<AchievementBadge[]>(
      STORAGE_KEY,
      INITIAL_ACHIEVEMENTS
    );
  }

  public static getInstance(): AchievementsService {
    if (!AchievementsService.instance) {
      AchievementsService.instance = new AchievementsService();
    }
    return AchievementsService.instance;
  }

  public getBadges(): AchievementBadge[] {
    return [...this.badges];
  }

  public evaluateProgress(params: {
    streak?: number;
    totalMinutes?: number;
    questionsSolved?: number;
    completedChaptersPhysics?: number;
    completedChaptersChemistry?: number;
    completedChaptersMaths?: number;
    revisionsCompleted?: number;
  }) {
    let hasNewUnlock = false;

    this.badges = this.badges.map((b) => {
      let updated = { ...b };

      if (b.id === 'ach_7_streak' && params.streak !== undefined) {
        updated.progress = Math.min(params.streak, b.maxProgress);
      } else if (b.id === 'ach_100_questions' && params.questionsSolved !== undefined) {
        updated.progress = Math.min(params.questionsSolved, b.maxProgress);
      } else if (b.id === 'ach_1000_minutes' && params.totalMinutes !== undefined) {
        updated.progress = Math.min(params.totalMinutes, b.maxProgress);
      } else if (b.id === 'ach_physics_master' && params.completedChaptersPhysics !== undefined) {
        updated.progress = Math.min(params.completedChaptersPhysics, b.maxProgress);
      } else if (b.id === 'ach_chemistry_expert' && params.completedChaptersChemistry !== undefined) {
        updated.progress = Math.min(params.completedChaptersChemistry, b.maxProgress);
      } else if (b.id === 'ach_math_champion' && params.completedChaptersMaths !== undefined) {
        updated.progress = Math.min(params.completedChaptersMaths, b.maxProgress);
      } else if (b.id === 'ach_revision_king' && params.revisionsCompleted !== undefined) {
        updated.progress = Math.min(params.revisionsCompleted, b.maxProgress);
      }

      if (!updated.isUnlocked && updated.progress >= updated.maxProgress) {
        updated.isUnlocked = true;
        updated.unlockedAt = new Date().toISOString();
        hasNewUnlock = true;

        // Award points & track
        monetizationService.earnStudyPoints(
          updated.pointsAward,
          `Unlocked Badge: ${updated.title}`
        );
        analytics.track('achievement_unlocked', {
          badge_id: updated.id,
          badge_name: updated.title,
        });

        toast.success(`🏆 Achievement Unlocked: ${updated.title}! (+${updated.pointsAward} Study Points)`);
      }

      return updated;
    });

    if (hasNewUnlock) {
      this.saveAndNotify();
    }
  }

  public subscribe(listener: (badges: AchievementBadge[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private saveAndNotify() {
    safeLocalStorage.setItem(STORAGE_KEY, this.badges);
    this.listeners.forEach((fn) => fn(this.badges));
  }
}

export const achievementsService = AchievementsService.getInstance();
