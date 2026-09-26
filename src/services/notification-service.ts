import { safeLocalStorage } from '@/utils/storage';
import toast from 'react-hot-toast';

export type NotificationTone = 'motivational' | 'savage' | 'funny' | 'balanced';

export interface NotificationSettings {
  enabled: boolean;
  permissionGranted: boolean;
  tone: NotificationTone;
  dailyReminderTime: string;
  smartFrequencyReduction: boolean;
  soundEnabled: boolean;
}

const STORAGE_KEY = 'rankify_notification_settings';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  permissionGranted: false,
  tone: 'balanced',
  dailyReminderTime: '18:00',
  smartFrequencyReduction: true,
  soundEnabled: true,
};

export class NotificationEngine {
  private static instance: NotificationEngine;
  private settings: NotificationSettings;

  private constructor() {
    this.settings = safeLocalStorage.getItem<NotificationSettings>(
      STORAGE_KEY,
      DEFAULT_NOTIFICATION_SETTINGS
    );
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.settings.permissionGranted = Notification.permission === 'granted';
    }
  }

  public static getInstance(): NotificationEngine {
    if (!NotificationEngine.instance) {
      NotificationEngine.instance = new NotificationEngine();
    }
    return NotificationEngine.instance;
  }

  public getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  public saveSettings(newSettings: Partial<NotificationSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    safeLocalStorage.setItem(STORAGE_KEY, this.settings);
  }

  public async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.error('Web Notifications are not supported in this browser environment.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      this.saveSettings({ permissionGranted: granted, enabled: granted });

      if (granted) {
        toast.success('Notifications enabled! Rankify will keep you on track.');
      } else {
        toast('Notifications were blocked. In-app alerts will be used.', { icon: 'ℹ️' });
      }
      return granted;
    } catch (e) {
      console.warn('Notification permission error:', e);
      return false;
    }
  }

  /**
   * Generates tailored message based on category and student activity level.
   */
  public generateAdaptiveMessage(params: {
    category:
      | 'funny'
      | 'savage'
      | 'motivational'
      | 'exam_countdown'
      | 'incomplete_task'
      | 'revision'
      | 'weekly_summary'
      | 'morning'
      | 'night'
      | 'missed_study'
      | 'streak'
      | 'goal_completed';
    studentName?: string;
    streak?: number;
    daysToExam?: number;
    pendingTasks?: number;
    activeMinutesToday?: number;
    chapterName?: string;
  }): { title: string; body: string } {
    const {
      category,
      studentName = 'Scholar',
      streak = 1,
      daysToExam = 60,
      pendingTasks = 2,
      activeMinutesToday = 0,
      chapterName = 'Electric Charges and Fields',
    } = params;

    // Smart Frequency Reduction: If student already studied >= 90 mins today, relax reminders
    if (this.settings.smartFrequencyReduction && activeMinutesToday >= 90 && category !== 'goal_completed') {
      return {
        title: '🌟 Outstanding Focus Today!',
        body: `You have logged ${activeMinutesToday} mins of CBSE PCM study today. Keep pacing yourself smoothly!`,
      };
    }

    switch (category) {
      case 'funny':
        return {
          title: '😼 Even Schrödinger’s Cat is Studying',
          body: `Is your physics revision done or not done? Don't leave it in a superposition—open Rankify!`,
        };
      case 'savage':
        return {
          title: '🔥 Real Talk, ' + studentName,
          body: `While you’re relaxing, thousands of Class 12 competitors just mastered Lens Maker's Formula. Get in the game.`,
        };
      case 'motivational':
        return {
          title: '✨ 95%+ Target in Sight',
          body: `Every single derivation solved today compounds for CBSE Board glory. Take on your next mission!`,
        };
      case 'exam_countdown':
        return {
          title: `⏳ ${daysToExam} Days Until CBSE Boards`,
          body: `Every day counts. Today's target: Knock out your high-weightage chapters early.`,
        };
      case 'incomplete_task':
        return {
          title: `📝 ${pendingTasks} Tasks Awaiting Completion`,
          body: `Wrap up today's daily CBSE PCM missions to lock in full completion for your streak!`,
        };
      case 'revision':
        return {
          title: `🔄 Spaced Recall Due: ${chapterName}`,
          body: `Optimal memory retention curve reached for ${chapterName}. A quick 10-minute review locks it in!`,
        };
      case 'weekly_summary':
        return {
          title: '📊 Weekly Performance Report Ready',
          body: `Check out your accuracy and chapter completion stats in the Rankify Diagnostic Dashboard.`,
        };
      case 'morning':
        return {
          title: '☀️ Rise & Conquer CBSE Class 12',
          body: `Peak brain plasticity window is active. Tackle difficult Calculus or Chemistry mechanisms now!`,
        };
      case 'night':
        return {
          title: '🌙 Nighttime Formula Consolidation',
          body: `Reviewing 5 essential formulas before sleep enhances synaptic recall by 40%.`,
        };
      case 'missed_study':
        return {
          title: '⚡ 15 Minutes is All It Takes',
          body: `Don't worry if today was hectic—just solve 5 quick PYQs to keep your momentum alive.`,
        };
      case 'streak':
        return {
          title: `🔥 Defend Your ${streak}-Day Streak!`,
          body: `You've built unstoppable discipline. Finish at least one CBSE task before midnight!`,
        };
      case 'goal_completed':
        return {
          title: '🎉 Target Crushed Today!',
          body: `Phenomenal discipline! All daily CBSE Class 12 tasks completed. Tomorrow we build further.`,
        };
      default:
        return {
          title: 'Rankify Study Reminder',
          body: `Stay consistent with your CBSE Class 12 PCM schedule today!`,
        };
    }
  }

  /**
   * Fires a system notification or in-app toast with sound.
   */
  public triggerNotification(
    title: string,
    body: string,
    icon: string = '/pwa-192x192.png'
  ): void {
    if (this.settings.soundEnabled) {
      this.playNotificationChime();
    }

    // Try Web Notification if permission granted
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification(title, {
          body,
          icon,
          badge: '/pwa-192x192.png',
        });
        return;
      } catch (e) {
        console.warn('System notification trigger failed, falling back to toast:', e);
      }
    }

    // Graceful in-app toast fallback
    toast(`${title}\n${body}`, {
      icon: '🔔',
      duration: 5000,
    });
  }

  /**
   * Immediate test notification button trigger
   */
  public sendTestNotification(category: 'savage' | 'motivational' | 'funny' = 'motivational') {
    const msg = this.generateAdaptiveMessage({
      category,
      studentName: 'Candidate',
      streak: 3,
      daysToExam: 45,
      pendingTasks: 2,
      activeMinutesToday: 40,
    });
    this.triggerNotification(msg.title, msg.body);
  }

  private playNotificationChime() {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15); // E6
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // User gesture might be needed
    }
  }
}

export const notificationEngine = NotificationEngine.getInstance();
