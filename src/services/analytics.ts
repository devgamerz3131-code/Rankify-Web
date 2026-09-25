/**
 * Rankify Firebase Analytics & Telemetry Service
 * Tracks application usage, academic milestones, and engagement metrics.
 * PRIVACY COMPLIANT: NEVER collects personal question content or private chats.
 */

import { getAnalytics, logEvent, isSupported, Analytics } from 'firebase/analytics';
import { app } from '@/firebase/config';
import { crashReporter } from '@/services/crash-reporter';

export type StandardAnalyticsEvent =
  | 'first_launch'
  | 'sign_up'
  | 'login'
  | 'study_session_started'
  | 'study_session_completed'
  | 'task_completed'
  | 'revision_completed'
  | 'chapter_completed'
  | 'ai_tutor_used'
  | 'question_asked'
  | 'music_opened'
  | 'song_unlocked'
  | 'notification_clicked'
  | 'app_open_duration'
  | 'retention'
  | 'achievement_unlocked'
  | 'share_card_generated';

export interface AnalyticsEventRecord {
  name: string;
  params?: Record<string, string | number | boolean>;
  timestamp: number;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private analyticsInstance: Analytics | null = null;
  private isInitialized = false;
  private sessionStartTime: number = Date.now();
  private eventHistory: AnalyticsEventRecord[] = [];
  private readonly MAX_HISTORY = 50;

  private constructor() {
    this.initFirebaseAnalytics();
    this.initSessionTracking();
    this.checkFirstLaunch();
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private async initFirebaseAnalytics() {
    if (typeof window === 'undefined') return;

    try {
      const supported = await isSupported();
      if (supported) {
        this.analyticsInstance = getAnalytics(app);
        this.isInitialized = true;
      }
    } catch (e) {
      console.warn('Firebase Analytics not supported in this environment, using client analytics buffer.', e);
    }
  }

  private checkFirstLaunch() {
    if (typeof window === 'undefined') return;
    try {
      const hasLaunched = localStorage.getItem('rankify_has_launched_before');
      if (!hasLaunched) {
        localStorage.setItem('rankify_has_launched_before', 'true');
        this.track('first_launch', {
          platform: 'web',
          stream: 'cbse_class_12_pcm',
        });
      } else {
        // Track retention checkpoint
        const lastActive = localStorage.getItem('rankify_last_active_date');
        const todayStr = new Date().toISOString().split('T')[0];
        if (lastActive && lastActive !== todayStr) {
          this.track('retention', {
            previousDate: lastActive,
            currentDate: todayStr,
          });
        }
        localStorage.setItem('rankify_last_active_date', todayStr);
      }
    } catch {}
  }

  private initSessionTracking() {
    if (typeof window === 'undefined') return;

    // Track session duration upon exit/unload
    window.addEventListener('beforeunload', () => {
      const durationSeconds = Math.round((Date.now() - this.sessionStartTime) / 1000);
      if (durationSeconds > 5) {
        this.track('app_open_duration', {
          duration_seconds: durationSeconds,
        });
      }
    });
  }

  /**
   * Sanitizes params to enforce privacy: strips any potential raw questions or sensitive keys.
   */
  private sanitizeParams(
    params?: Record<string, string | number | boolean>
  ): Record<string, string | number | boolean> {
    if (!params) return {};
    const sanitized: Record<string, string | number | boolean> = {};

    for (const [key, value] of Object.entries(params)) {
      // Reject any freeform text that might be student question content
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('query') ||
        lowerKey.includes('question_text') ||
        lowerKey.includes('body') ||
        lowerKey.includes('content') ||
        lowerKey.includes('prompt') ||
        lowerKey.includes('message')
      ) {
        continue;
      }
      sanitized[key] = value;
    }
    return sanitized;
  }

  /**
   * Main telemetry dispatch method.
   */
  public track(
    eventName: StandardAnalyticsEvent | string,
    params?: Record<string, string | number | boolean>
  ) {
    const cleanParams = this.sanitizeParams(params);

    const record: AnalyticsEventRecord = {
      name: eventName,
      params: cleanParams,
      timestamp: Date.now(),
    };

    this.eventHistory.unshift(record);
    if (this.eventHistory.length > this.MAX_HISTORY) {
      this.eventHistory.pop();
    }

    // Add breadcrumb to crash reporter
    crashReporter.addBreadcrumb(
      `Analytics Event: ${eventName}`,
      'action',
      cleanParams
    );

    // Dispatch to Firebase Analytics if available
    if (this.analyticsInstance) {
      try {
        logEvent(this.analyticsInstance, eventName, cleanParams);
      } catch (e) {
        console.warn('Firebase logEvent failed:', e);
      }
    }
  }

  // Convenient helper methods for standard events
  public trackStudySession(subject: string, chapterId: string, durationMinutes: number) {
    this.track('study_session_completed', {
      subject,
      chapter_id: chapterId,
      duration_minutes: durationMinutes,
    });
  }

  public trackTaskCompleted(subject: string, chapterId: string, taskType: string) {
    this.track('task_completed', {
      subject,
      chapter_id: chapterId,
      task_type: taskType,
    });
  }

  public trackChapterCompleted(subject: string, chapterId: string) {
    this.track('chapter_completed', {
      subject,
      chapter_id: chapterId,
    });
  }

  public trackAIQuestion(subject: string, chapter: string, mode: string) {
    this.track('ai_tutor_used', {
      subject,
      chapter,
      mode,
    });
    this.track('question_asked', {
      subject,
      chapter,
      mode,
    });
  }

  public trackMusicOpened(trackTitle?: string) {
    this.track('music_opened', {
      track_name: trackTitle || 'ambient_session',
    });
  }

  public getEventHistory(): AnalyticsEventRecord[] {
    return [...this.eventHistory];
  }
}

export const analytics = AnalyticsService.getInstance();
export const trackEvent = (name: string, params?: Record<string, string | number | boolean>) =>
  analytics.track(name, params);
