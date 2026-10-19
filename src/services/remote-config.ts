/**
 * Rankify Remote Configuration Service
 * Provides dynamic server-driven feature flags, announcements, maintenance modes, and version checks.
 */

import { safeLocalStorage } from '@/utils/storage';

export interface AnnouncementConfig {
  enabled: boolean;
  title: string;
  message: string;
  priority: 'normal' | 'high' | 'urgent';
  linkUrl?: string;
  badgeText?: string;
}

export interface MaintenanceConfig {
  enabled: boolean;
  message: string;
  estimatedReturn: string;
}

export interface AIAvailabilityConfig {
  enabled: boolean;
  notice?: string;
  dailyQuotaFree: number;
}

export interface FeatureFlagsConfig {
  musicVault: boolean;
  studyReports: boolean;
  achievements: boolean;
  shareCards: boolean;
  communityDiscussions: boolean;
  practiceMockTests: boolean;
}

export interface AppVersionConfig {
  currentVersion: string;
  minimumVersion: string;
  latestVersion: string;
  enforceBlock: boolean;
  releaseNotes: string[];
}

export interface RemoteConfigState {
  announcement: AnnouncementConfig;
  maintenance: MaintenanceConfig;
  aiAvailability: AIAvailabilityConfig;
  features: FeatureFlagsConfig;
  version: AppVersionConfig;
  lastUpdated: string;
}

import { TOTAL_OFFICIAL_CHAPTERS } from '@/services/chapter-service';

const STORAGE_KEY = 'rankify_remote_config_state';

export const CURRENT_APP_VERSION = '1.1.0';

export const DEFAULT_REMOTE_CONFIG: RemoteConfigState = {
  announcement: {
    enabled: false,
    title: 'Class 12 PCM Syllabus Tracker',
    message: `All ${TOTAL_OFFICIAL_CHAPTERS} Physics, Chemistry, and Maths chapters available for study and revision.`,
    priority: 'normal',
    badgeText: 'Update',
  },
  maintenance: {
    enabled: false,
    message: 'Rankify is briefly undergoing routine maintenance.',
    estimatedReturn: '15 Minutes',
  },
  aiAvailability: {
    enabled: true,
    notice: 'Study assistant is active across Physics, Chemistry, and Maths.',
    dailyQuotaFree: 100,
  },
  features: {
    musicVault: true,
    studyReports: true,
    achievements: true,
    shareCards: true,
    communityDiscussions: false, // In-development feature flag
    practiceMockTests: true,
  },
  version: {
    currentVersion: CURRENT_APP_VERSION,
    minimumVersion: '1.0.0',
    latestVersion: '1.1.0',
    enforceBlock: false,
    releaseNotes: [
      `${TOTAL_OFFICIAL_CHAPTERS}-chapter CBSE Class 12 PCM syllabus coverage`,
      'Chapter-wise NCERT revision and question sets',
      'Study reports and academic milestones',
      'One-click share cards for study streaks',
    ],
  },
  lastUpdated: new Date().toISOString(),
};

class RemoteConfigService {
  private static instance: RemoteConfigService;
  private config: RemoteConfigState;
  private listeners: Set<(config: RemoteConfigState) => void> = new Set();

  private constructor() {
    const stored = safeLocalStorage.getItem<RemoteConfigState>(
      STORAGE_KEY,
      DEFAULT_REMOTE_CONFIG
    );
    if (
      stored?.announcement?.badgeText === 'Official Notice' ||
      stored?.announcement?.message?.includes('official CBSE')
    ) {
      stored.announcement = { ...DEFAULT_REMOTE_CONFIG.announcement };
      safeLocalStorage.setItem(STORAGE_KEY, stored);
    }
    this.config = stored;
  }

  public static getInstance(): RemoteConfigService {
    if (!RemoteConfigService.instance) {
      RemoteConfigService.instance = new RemoteConfigService();
    }
    return RemoteConfigService.instance;
  }

  public getConfig(): RemoteConfigState {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<RemoteConfigState>) {
    this.config = {
      ...this.config,
      ...newConfig,
      lastUpdated: new Date().toISOString(),
    };
    safeLocalStorage.setItem(STORAGE_KEY, this.config);
    this.notifyListeners();
  }

  public setFeatureFlag(flag: keyof FeatureFlagsConfig, value: boolean) {
    this.updateConfig({
      features: {
        ...this.config.features,
        [flag]: value,
      },
    });
  }

  public setMaintenanceMode(enabled: boolean, message?: string, estimatedReturn?: string) {
    this.updateConfig({
      maintenance: {
        enabled,
        message: message || this.config.maintenance.message,
        estimatedReturn: estimatedReturn || this.config.maintenance.estimatedReturn,
      },
    });
  }

  public setAnnouncement(announcement: Partial<AnnouncementConfig>) {
    this.updateConfig({
      announcement: {
        ...this.config.announcement,
        ...announcement,
      },
    });
  }

  public setAIAvailability(enabled: boolean, notice?: string) {
    this.updateConfig({
      aiAvailability: {
        ...this.config.aiAvailability,
        enabled,
        notice,
      },
    });
  }

  public isFeatureEnabled(flag: keyof FeatureFlagsConfig): boolean {
    return !!this.config.features[flag];
  }

  public isMaintenanceActive(): boolean {
    return this.config.maintenance.enabled;
  }

  public isUpdateRequired(): { required: boolean; optional: boolean; latest: string } {
    const min = this.config.version.minimumVersion;
    const latest = this.config.version.latestVersion;
    const cur = CURRENT_APP_VERSION;

    const isBelowMin = this.compareVersions(cur, min) < 0;
    const isBelowLatest = this.compareVersions(cur, latest) < 0;

    return {
      required: isBelowMin && this.config.version.enforceBlock,
      optional: isBelowLatest && !isBelowMin,
      latest,
    };
  }

  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  }

  public subscribe(listener: (config: RemoteConfigState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => fn(this.config));
  }
}

export const remoteConfig = RemoteConfigService.getInstance();
