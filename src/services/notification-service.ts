import { safeLocalStorage } from '@/utils/storage';
import { db } from '@/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { syncEngine } from '@/services/sync-engine';
import toast from 'react-hot-toast';

export type NotificationFrequency = 'low' | 'normal' | 'high';

export interface NotificationSettings {
  enabled: boolean;
  studyReminders: boolean;
  dailyMotivation: boolean;
  examCountdown: boolean;
  revisionReminder: boolean;
  streakReminder: boolean;
  smartPlanReminder: boolean;
  newFeatureUpdates: boolean;
  frequency: NotificationFrequency;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string;   // "07:00"
  permissionDeniedDismissed: boolean;
  hasPromptedPermission: boolean;
  soundEnabled?: boolean;
}

const STORAGE_KEY = 'rankify_notification_settings';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  studyReminders: true,
  dailyMotivation: true,
  examCountdown: true,
  revisionReminder: true,
  streakReminder: true,
  smartPlanReminder: true,
  newFeatureUpdates: true,
  frequency: 'normal',
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  permissionDeniedDismissed: false,
  hasPromptedPermission: false,
  soundEnabled: true,
};

export class NotificationEngine {
  private static instance: NotificationEngine;
  private settings: NotificationSettings;
  private currentUserId: string | null = null;

  private constructor() {
    this.settings = safeLocalStorage.getItem<NotificationSettings>(
      STORAGE_KEY,
      DEFAULT_NOTIFICATION_SETTINGS
    );
    this.registerNotificationServiceWorker();
  }

  public static getInstance(): NotificationEngine {
    if (!NotificationEngine.instance) {
      NotificationEngine.instance = new NotificationEngine();
    }
    return NotificationEngine.instance;
  }

  // Register sw-notifications.js to deliver background alerts
  private async registerNotificationServiceWorker() {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw-notifications.js', {
          scope: '/',
        });
        console.log('[NotificationEngine] Custom background service worker registered successfully!');
      } catch (err) {
        console.warn('[NotificationEngine] Service worker registration ignored or failed:', err);
      }
    }
  }

  // Sync / Load settings from Firestore on user login
  public async loadUserPreferences(userId: string): Promise<NotificationSettings> {
    this.currentUserId = userId;
    if (!userId || userId === 'guest') {
      return this.settings;
    }

    try {
      // 1. Try to load from syncEngine local persistent cache
      const cached = syncEngine.getLocalCache<NotificationSettings>(STORAGE_KEY, userId);
      if (cached) {
        this.settings = { ...DEFAULT_NOTIFICATION_SETTINGS, ...cached };
      }

      // 2. Try to fetch from Firebase Firestore document
      const docRef = doc(db, 'users', userId, 'user_preferences', 'notification_settings');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const cloudData = snap.data();
        if (cloudData && cloudData.data) {
          const syncedSettings = cloudData.data as NotificationSettings;
          this.settings = { ...DEFAULT_NOTIFICATION_SETTINGS, ...syncedSettings };
          // Cache locally
          syncEngine.setLocalCache(STORAGE_KEY, this.settings, userId);
        }
      }
    } catch (err) {
      console.warn('[NotificationEngine] Synced preferences fetch skipped or failed:', err);
    }

    return this.getSettings();
  }

  public getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  public async saveSettings(newSettings: Partial<NotificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    safeLocalStorage.setItem(STORAGE_KEY, this.settings);

    const userId = this.currentUserId;
    if (userId && userId !== 'guest') {
      syncEngine.setLocalCache(STORAGE_KEY, this.settings, userId);
      try {
        const docRef = doc(db, 'users', userId, 'user_preferences', 'notification_settings');
        await setDoc(docRef, { data: this.settings, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (err) {
        console.warn('[NotificationEngine] Failed to sync preferences to Firestore background queue:', err);
      }
    }
  }

  public async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // Detect if the application is loaded inside an iframe (such as AI Studio preview container)
    const isIframe = window.self !== window.top;

    if (!('Notification' in window)) {
      // Standard browser support fallback
      await this.saveSettings({ enabled: true, hasPromptedPermission: true });
      toast.success('In-App study alerts activated successfully!', { icon: '🔔' });
      return true;
    }

    try {
      // Sandboxed preview iframe security blocks standard prompt. Bypass with custom in-app fallback.
      if (isIframe) {
        console.log('[NotificationEngine] Sandboxed iframe environment detected. Activating interactive in-app study notifications.');
        await this.saveSettings({ enabled: true, hasPromptedPermission: true });
        toast.success('In-App study alerts activated successfully!', { icon: '🔔' });
        return true;
      }

      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      
      // Keep enabled as true in either case so in-app falling back is guaranteed to work
      await this.saveSettings({ hasPromptedPermission: true, enabled: true });

      if (granted) {
        toast.success('Awesome! Desktop notification alerts enabled successfully.', { icon: '🎉' });
      } else {
        toast('Browser notifications blocked. Activating custom in-app study alerts instead!', { icon: '🔔', duration: 5000 });
      }
      return true;
    } catch (e) {
      console.warn('[NotificationEngine] Standard permission query failed. Defaulting to in-app alerts:', e);
      await this.saveSettings({ enabled: true, hasPromptedPermission: true });
      toast.success('In-App study alerts activated successfully!', { icon: '🔔' });
      return true;
    }
  }

  // Check if current time is within Quiet Hours window
  private isInQuietHours(): boolean {
    const start = this.settings.quietHoursStart;
    const end = this.settings.quietHoursEnd;
    if (!start || !end) return false;

    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes <= endMinutes) {
      return current >= startMinutes && current <= endMinutes;
    } else {
      // Over midnight
      return current >= startMinutes || current <= endMinutes;
    }
  }

  // Fire system or background notification with in-app sound fallback
  public async triggerNotification(
    title: string,
    body: string,
    icon: string = '/pwa-192x192.png'
  ): Promise<void> {
    if (!this.settings.enabled) return;

    if (this.isInQuietHours()) {
      console.log('[NotificationEngine] Quiet Hours is active. Suppressed alert:', title);
      return;
    }

    if (this.settings.soundEnabled !== false) {
      this.playNotificationChime();
    }

    // Try service worker background notification
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        const reg = await navigator.serviceWorker.getRegistration('/sw-notifications.js');
        if (reg) {
          reg.showNotification(title, {
            body,
            icon,
            badge: '/pwa-192x192.png',
            vibrate: [200, 100, 200],
          } as any);
          return;
        }
      } catch (err) {
        console.warn('[NotificationEngine] SW background notification failed, falling back to window:', err);
      }

      // Fallback to active window notification
      try {
        new Notification(title, {
          body,
          icon,
          badge: '/pwa-192x192.png',
        });
        return;
      } catch (err) {
        console.warn('[NotificationEngine] Window alert failed, falling back to toast:', err);
      }
    }

    // In-app fallback toast
    toast(`${title}\n${body}`, {
      icon: '🔔',
      duration: 6000,
    });
  }

  // Trigger immediate browser test notification
  public sendTestNotification() {
    const funnySavageQuotes = [
      'Books miss you more than Instagram today 😂',
      'Topper banne ka shortcut nahi hai. Open Rankify.',
      'Kal ka "kal" kabhi nahi aata.',
      'Phone charge ho gaya, ab dimaag bhi charge kar.',
      'Physics won\'t study itself 😶',
    ];
    const randomIndex = Math.floor(Math.random() * funnySavageQuotes.length);
    const bodyText = funnySavageQuotes[randomIndex];

    this.triggerNotification('🎯 Rankify Test Notification', bodyText);
  }

  // Generate motivational reminders
  public getMotivationalReminders(): { title: string; body: string }[] {
    return [
      { title: '🤪 Reality Check', body: 'Books miss you more than Instagram today 😂' },
      { title: '🥇 Mission Board Exam', body: 'Topper banne ka shortcut nahi hai. Open Rankify.' },
      { title: '⏳ Procrastinator Warning', body: 'Kal ka "kal" kabhi nahi aata.' },
      { title: '🔋 Battery Full?', body: 'Phone charge ho gaya, ab dimaag bhi charge kar.' },
      { title: '😶 Physics Alert', body: 'Physics won\'t study itself 😶' },
      { title: '⚡ Spark Your Calculus', body: 'Derivations don\'t solve themselves when you scroll Reels!' },
      { title: '🧪 Organic Chemistry', body: 'Aldol Condensation wants to meet you before board exam does!' },
    ];
  }

  // Runs background analysis reminders based on client state
  public async runAutomatedChecks(params: {
    pendingTasksCount: number;
    daysToExam: number;
    streak: number;
    lastStudyTimeElapsedHours?: number;
    hasActiveRevision?: boolean;
    activeChapterName?: string;
  }): Promise<void> {
    if (!this.settings.enabled) return;
    if (this.isInQuietHours()) return;

    const {
      pendingTasksCount,
      daysToExam,
      streak,
      lastStudyTimeElapsedHours = 0,
      hasActiveRevision = false,
      activeChapterName = 'Organic Chemistry',
    } = params;

    const now = new Date();
    const currentHour = now.getHours();

    // Frequency constraints check
    // Low: check only in afternoon (14:00 - 16:00)
    // Normal: check morning (9:00 - 11:00) and evening (18:00 - 20:00)
    // High: check any time
    if (this.settings.frequency === 'low') {
      if (currentHour < 14 || currentHour > 16) return;
    } else if (this.settings.frequency === 'normal') {
      const isMorningSlot = currentHour >= 9 && currentHour <= 11;
      const isEveningSlot = currentHour >= 18 && currentHour <= 20;
      if (!isMorningSlot && !isEveningSlot) return;
    }

    // 1. Study & SmartPlan Reminders
    if (this.settings.studyReminders && pendingTasksCount > 0) {
      const studyPhrases = [
        '📚 Your Physics task is waiting.',
        '⚡ Only 25 minutes today to stay on track.',
        '🎯 Complete today\'s mission.',
      ];
      const randomPhrase = studyPhrases[Math.floor(Math.random() * studyPhrases.length)];
      await this.triggerNotification('📚 SmartPlan Priority Remind', randomPhrase);
      return; // prevent spamming multiple notifications at the exact same tick
    }

    // 2. Revision Reminder
    if (this.settings.revisionReminder && hasActiveRevision) {
      await this.triggerNotification(
        '🔄 Revision Scheduled',
        `Time to revise "${activeChapterName}" now to lock-in long-term memory recall!`
      );
      return;
    }

    // 3. Exam Mode Reminders (Countdown and Frequency Boost)
    if (this.settings.examCountdown && daysToExam > 0) {
      const isExamNear = daysToExam <= 15;
      if (isExamNear || Math.random() < 0.3) {
        await this.triggerNotification(
          '⏳ Exam Mode Boost!',
          `Only ${daysToExam} days left until CBSE Board Exams! Revise your formula sheets now.`
        );
        return;
      }
    }

    // 4. Streak & Missed Study Reminders
    if (this.settings.streakReminder) {
      if (lastStudyTimeElapsedHours >= 24 && lastStudyTimeElapsedHours < 48) {
        await this.triggerNotification(
          '🔥 Streak Alert!',
          `You are about to miss your study today! Revise 5 quick MCQs to protect your ${streak}-day streak.`
        );
        return;
      } else if (lastStudyTimeElapsedHours >= 48) {
        await this.triggerNotification(
          '💔 Streak Broken!',
          `Oh no, your study streak was lost. Restart your momentum today—you can do this!`
        );
        return;
      }
    }

    // 5. Daily Motivation Reminders
    if (this.settings.dailyMotivation && Math.random() < 0.25) {
      const motivators = this.getMotivationalReminders();
      const quote = motivators[Math.floor(Math.random() * motivators.length)];
      await this.triggerNotification(quote.title, quote.body);
    }
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
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // User gesture bypass
    }
  }
}

export const notificationEngine = NotificationEngine.getInstance();
