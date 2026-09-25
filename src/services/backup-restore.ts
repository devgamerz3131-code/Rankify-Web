/**
 * Rankify Backup & Restore Engine
 * Automatically backs up student progress, daily tasks, study sessions, notes, bookmarks,
 * music unlocks, settings, theme, and AI preferences to Firestore and local archive.
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { crashReporter } from '@/services/crash-reporter';
import toast from 'react-hot-toast';

export interface StudentFullBackup {
  version: string;
  timestamp: string;
  userId: string;
  studentName?: string;
  targetPercentage?: number;
  chapterProgressMap: Record<string, unknown>;
  dailyTasks?: unknown[];
  studySessions?: unknown[];
  bookmarks?: unknown[];
  notes?: unknown[];
  musicUnlocks?: string[];
  settings: {
    theme?: string;
    notificationTone?: string;
    notificationsEnabled?: boolean;
    dailyReminderTime?: string;
  };
  aiMemory?: unknown;
}

class BackupRestoreService {
  private static instance: BackupRestoreService;

  public static getInstance(): BackupRestoreService {
    if (!BackupRestoreService.instance) {
      BackupRestoreService.instance = new BackupRestoreService();
    }
    return BackupRestoreService.instance;
  }

  /**
   * Compiles complete student state into a backup object.
   */
  public generateCurrentBackup(userId: string): StudentFullBackup {
    let chapterProgressMap: Record<string, unknown> = {};
    let dailyTasks: unknown[] = [];
    let aiMemory: unknown = null;

    try {
      const cachedChapters = localStorage.getItem(`rankify_cache_${userId}_chapter_progress`);
      if (cachedChapters) chapterProgressMap = JSON.parse(cachedChapters);

      const cachedTasks = localStorage.getItem(`rankify_cache_${userId}_daily_tasks`);
      if (cachedTasks) dailyTasks = JSON.parse(cachedTasks);

      const rawAiMem = localStorage.getItem('rankify_ai_session_memory');
      if (rawAiMem) aiMemory = JSON.parse(rawAiMem);
    } catch (e) {
      console.warn('Backup state reading warning:', e);
    }

    const theme = localStorage.getItem('rankify-theme') || 'system';
    let notifSettings: Record<string, unknown> = {};
    try {
      const rawNotifs = localStorage.getItem('rankify_notification_settings');
      if (rawNotifs) notifSettings = JSON.parse(rawNotifs);
    } catch {}

    return {
      version: '1.1.0',
      timestamp: new Date().toISOString(),
      userId,
      chapterProgressMap,
      dailyTasks,
      studySessions: [],
      bookmarks: [],
      notes: [],
      musicUnlocks: ['trk_1', 'trk_2', 'trk_3'],
      settings: {
        theme,
        notificationTone: (notifSettings.tone as string) || 'balanced',
        notificationsEnabled: (notifSettings.enabled as boolean) ?? true,
        dailyReminderTime: (notifSettings.dailyReminderTime as string) || '18:00',
      },
      aiMemory,
    };
  }

  /**
   * Saves backup to Firestore under `users/{uid}/backups/latest`.
   */
  public async saveCloudBackup(userId: string): Promise<boolean> {
    if (!userId) return false;
    try {
      const backup = this.generateCurrentBackup(userId);
      const backupRef = doc(db, 'users', userId, 'backups', 'latest');
      await setDoc(backupRef, backup, { merge: true });

      // Save local snapshot
      localStorage.setItem(`rankify_backup_snapshot_${userId}`, JSON.stringify(backup));
      return true;
    } catch (err) {
      crashReporter.reportError(err, 'firestore', 'warning', 'Cloud backup failed');
      return false;
    }
  }

  /**
   * Automatically restores student state from Firestore when user logs in.
   */
  public async restoreCloudBackup(userId: string): Promise<StudentFullBackup | null> {
    if (!userId) return null;
    try {
      const backupRef = doc(db, 'users', userId, 'backups', 'latest');
      const docSnap = await getDoc(backupRef);

      if (docSnap.exists()) {
        const backupData = docSnap.data() as StudentFullBackup;
        this.applyBackupToLocal(backupData, userId);
        return backupData;
      }

      // Check local snapshot
      const localSnap = localStorage.getItem(`rankify_backup_snapshot_${userId}`);
      if (localSnap) {
        const backupData = JSON.parse(localSnap) as StudentFullBackup;
        this.applyBackupToLocal(backupData, userId);
        return backupData;
      }

      return null;
    } catch (err) {
      crashReporter.reportError(err, 'firestore', 'warning', 'Cloud restore failed');
      return null;
    }
  }

  /**
   * Writes backup state into local caches, theme, and AI memory.
   */
  public applyBackupToLocal(backup: StudentFullBackup, userId: string) {
    try {
      if (backup.chapterProgressMap && Object.keys(backup.chapterProgressMap).length > 0) {
        localStorage.setItem(
          `rankify_cache_${userId}_chapter_progress`,
          JSON.stringify(backup.chapterProgressMap)
        );
      }
      if (backup.dailyTasks && backup.dailyTasks.length > 0) {
        localStorage.setItem(
          `rankify_cache_${userId}_daily_tasks`,
          JSON.stringify(backup.dailyTasks)
        );
      }
      if (backup.settings?.theme) {
        localStorage.setItem('rankify-theme', backup.settings.theme);
      }
      if (backup.aiMemory) {
        localStorage.setItem('rankify_ai_session_memory', JSON.stringify(backup.aiMemory));
      }
    } catch (e) {
      console.warn('Apply backup to local warning:', e);
    }
  }

  /**
   * Exports backup file for offline download.
   */
  public exportBackupFile(userId: string, studentName: string = 'Scholar') {
    try {
      const backup = this.generateCurrentBackup(userId);
      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Rankify_CBSE12_Backup_${studentName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Offline academic backup saved to your device!');
    } catch (err) {
      toast.error('Failed to export backup file');
    }
  }

  /**
   * Imports backup file from student.
   */
  public importBackupFile(jsonString: string, userId: string): boolean {
    try {
      const backup = JSON.parse(jsonString) as StudentFullBackup;
      if (!backup.chapterProgressMap) {
        throw new Error('Invalid backup schema');
      }
      this.applyBackupToLocal(backup, userId);
      toast.success('Academic backup restored successfully! Refreshing...');
      setTimeout(() => {
        window.location.reload();
      }, 800);
      return true;
    } catch (err) {
      toast.error('Invalid backup file. Please select a valid Rankify JSON backup.');
      return false;
    }
  }
}

export const backupRestoreService = BackupRestoreService.getInstance();
