/**
 * Rankify Production Initialization & Fresh Start Engine
 * Admin-only service to wipe all demo content, sample analytics, test accounts,
 * and initialize a 100% clean database for real student onboarding.
 */

import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  setDoc,
  getDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { crashReporter } from '@/services/crash-reporter';
import toast from 'react-hot-toast';

export interface InitializationReport {
  id: string;
  status: 'INITIALIZED_PRODUCTION_READY' | 'FAILED';
  initializedAt: string;
  adminUid: string;
  demoStudentsWiped: number;
  testCollectionsCleared: string[];
  preservedAdminsCount: number;
  systemConfigPreserved: boolean;
  notes: string;
}

const DEMO_STUDENT_UIDS = [
  'stud_topper1',
  'stud_topper2',
  'stud_pcm3',
  'stud_pcm4',
  'sample_student_cbse12',
];

class ProductionInitializationService {
  private static instance: ProductionInitializationService;

  public static getInstance(): ProductionInitializationService {
    if (!ProductionInitializationService.instance) {
      ProductionInitializationService.instance = new ProductionInitializationService();
    }
    return ProductionInitializationService.instance;
  }

  /**
   * Complete Production Initialization:
   * Resets all demo data, test accounts, sample analytics, fake progress,
   * while strictly protecting admin accounts and system configurations.
   */
  public async initializeProductionDatabase(
    adminUid: string
  ): Promise<{ success: boolean; report?: InitializationReport; error?: string }> {
    if (!adminUid) {
      return { success: false, error: 'Unauthorized: Admin authentication required.' };
    }

    try {
      // 1. Verify caller is an authenticated admin
      const adminDoc = await getDoc(doc(db, 'admins', adminUid));
      const userDoc = await getDoc(doc(db, 'users', adminUid));
      const isAdmin = adminDoc.exists() || (userDoc.exists() && userDoc.data()?.role === 'admin');

      if (!isAdmin) {
        return { success: false, error: 'Permission denied: Super Admin privileges required.' };
      }

      const clearedCollections: string[] = [];
      let demoWipedCount = 0;
      let preservedAdmins = 0;

      // 2. Fetch all users to separate admins from demo/test users
      const usersCol = collection(db, 'users');
      const usersSnap = await getDocs(usersCol);

      for (const userSnap of usersSnap.docs) {
        const uData = userSnap.data();
        const uid = userSnap.id;

        // Never touch admin accounts
        if (uData.role === 'admin' || uid === adminUid) {
          preservedAdmins++;
          continue;
        }

        // If user is a demo student, test user, or has sample prefix
        const isDemo =
          DEMO_STUDENT_UIDS.includes(uid) ||
          uid.startsWith('demo_') ||
          uid.startsWith('test_') ||
          uData.email?.includes('topper@gmail.com') ||
          uData.email?.includes('pcm.co.in') ||
          uData.email?.includes('science.org');

        if (isDemo) {
          // Delete student subcollections
          await this.cleanUserSubcollections(uid);
          await deleteDoc(userSnap.ref);
          demoWipedCount++;
        }
      }

      clearedCollections.push('users (demo accounts)', 'study_statistics', 'study_plan', 'mistake_notebook', 'backups_history');

      // 3. Clear Local Storage Demo Artifacts in the current browser
      this.clearLocalDemoArtifacts();

      // 4. Save Official Initialization Audit Log in Firestore
      const reportId = `init_report_${Date.now()}`;
      const report: InitializationReport = {
        id: reportId,
        status: 'INITIALIZED_PRODUCTION_READY',
        initializedAt: new Date().toISOString(),
        adminUid,
        demoStudentsWiped: demoWipedCount,
        testCollectionsCleared: clearedCollections,
        preservedAdminsCount: preservedAdmins,
        systemConfigPreserved: true,
        notes: 'Production database initialized with clean slate. All newly registered students will start from absolute zero.',
      };

      await setDoc(doc(db, 'system_audit', reportId), report);

      // Record in localStorage
      localStorage.setItem('rankify_production_initialized', 'true');
      localStorage.setItem('rankify_last_init_report', JSON.stringify(report));

      return { success: true, report };
    } catch (err: any) {
      crashReporter.reportError(err, 'firestore', 'fatal', 'Production DB initialization failed');
      return { success: false, error: err?.message || 'Failed to initialize database' };
    }
  }

  /**
   * Resets only Demo Students and Mock Profiles.
   */
  public async resetDemoData(
    adminUid: string
  ): Promise<{ success: boolean; count: number; error?: string }> {
    if (!adminUid) return { success: false, count: 0, error: 'Unauthorized' };
    try {
      let count = 0;
      for (const uid of DEMO_STUDENT_UIDS) {
        await this.cleanUserSubcollections(uid);
        await deleteDoc(doc(db, 'users', uid));
        count++;
      }
      this.clearLocalDemoArtifacts();
      return { success: true, count };
    } catch (err: any) {
      return { success: false, count: 0, error: err?.message };
    }
  }

  /**
   * Resets test accounts matching test patterns.
   */
  public async resetTestAccounts(
    adminUid: string
  ): Promise<{ success: boolean; count: number; error?: string }> {
    if (!adminUid) return { success: false, count: 0, error: 'Unauthorized' };
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      let count = 0;
      for (const d of usersSnap.docs) {
        const u = d.data();
        if (
          u.role !== 'admin' &&
          (d.id.startsWith('test_') || u.email?.startsWith('test') || u.displayName?.toLowerCase().includes('test student'))
        ) {
          await this.cleanUserSubcollections(d.id);
          await deleteDoc(d.ref);
          count++;
        }
      }
      return { success: true, count };
    } catch (err: any) {
      return { success: false, count: 0, error: err?.message };
    }
  }

  /**
   * Creates an optional single clean sample student for admin verification.
   * Starts with zero progress.
   */
  public async createSampleStudent(
    adminUid: string
  ): Promise<{ success: boolean; studentUid?: string; error?: string }> {
    if (!adminUid) return { success: false, error: 'Unauthorized' };
    try {
      const sampleUid = 'sample_student_cbse12';
      const sampleData = {
        uid: sampleUid,
        displayName: 'Aarav Sharma (Sample)',
        email: 'sample.candidate@rankify.in',
        photoURL: null,
        role: 'student',
        classNumber: 12,
        cbseClass: 12,
        board: 'CBSE',
        medium: 'English',
        preferredLanguage: 'English',
        targetPercentage: 95,
        stream: 'science-pcm',
        subjects: ['Physics', 'Chemistry', 'Mathematics'],
        school: 'Kendriya Vidyalaya',
        onboardingCompleted: true,
        status: 'active',
        streak: 0, // Starts at 0!
        totalStudyMinutes: 0, // Starts at 0!
        questionsSolved: 0, // Starts at 0!
        completedTasksCount: 0, // Starts at 0!
        accuracy: 0, // Starts at 0!
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        device: 'Desktop • Chrome',
        appVersion: '2.4.2',
        isOnline: true,
      };

      await setDoc(doc(db, 'users', sampleUid), sampleData, { merge: true });
      return { success: true, studentUid: sampleUid };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  /**
   * Helper to clean all subcollections of a specific user.
   */
  private async cleanUserSubcollections(userId: string): Promise<void> {
    const subcollections = [
      'study_statistics',
      'study_plan',
      'chapter_progress',
      'mistake_notebook',
      'backups_history',
      'user_preferences',
      'lecturelab_analyses',
      'session',
    ];

    for (const sub of subcollections) {
      try {
        const subSnap = await getDocs(collection(db, 'users', userId, sub));
        for (const d of subSnap.docs) {
          await deleteDoc(d.ref);
        }
      } catch {}
    }
  }

  /**
   * Cleans local storage demo caches from the current browser session.
   */
  private clearLocalDemoArtifacts(): void {
    if (typeof window === 'undefined') return;
    try {
      for (const uid of DEMO_STUDENT_UIDS) {
        localStorage.removeItem(`rankify_cache_${uid}_student_details`);
        localStorage.removeItem(`rankify_cache_${uid}_chapter_progress_map`);
        localStorage.removeItem(`rankify_cache_${uid}_study_statistics`);
        localStorage.removeItem(`rankify_cache_${uid}_active_study_plan`);
        localStorage.removeItem(`rankify_cache_${uid}_mistake_notebook`);
        localStorage.removeItem(`rankify_cache_${uid}_bookmarks`);
      }
      localStorage.removeItem('rankify_ai_session_memory');
    } catch {}
  }
}

export const productionInitService = ProductionInitializationService.getInstance();
