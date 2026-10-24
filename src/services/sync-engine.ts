import {
  doc,
  getDoc,
  setDoc,
  writeBatch,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from '@/firebase/config';
import { isTourActive } from '@/features/tour/tourReadOnlyGate';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'pending' | 'error';
export const FORTY_FIVE_MINUTES_MS = 45 * 60 * 1000;

export interface PendingSyncItem {
  id: string;
  path: string;
  data: Record<string, unknown>;
  operation: 'set' | 'update';
  timestamp: number;
  retryCount?: number;
}

export interface UserSessionState {
  lastActiveTab?: string;
  lastScreen?: string;
  lastSubject?: string;
  lastChapter?: string;
  lastLectureId?: string;
  lastLectureStep?: string;
  lastOpenedFeature?: string;
  draftNotes?: string;
  aiMemory?: unknown;
  selectedClass?: number;
  filters?: Record<string, unknown>;
  updatedAt?: number;
}

type SyncStatusListener = (status: SyncStatus, pendingCount: number, lastError?: string | null) => void;
type RemoteUpdateListener = (path: string, data: Record<string, unknown>) => void;

/**
 * Strips all undefined values recursively from objects and arrays,
 * converts Dates to ISO strings, and replaces invalid path characters in keys.
 */
export function sanitizeFirestorePayload<T>(value: T): T {
  if (value === undefined) {
    return null as unknown as T;
  }
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString() as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => (item === undefined ? null : sanitizeFirestorePayload(item))) as unknown as T;
  }

  const cleaned: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (val !== undefined && typeof val !== 'function' && typeof val !== 'symbol') {
      const safeKey = key.replace(/[./]/g, '_');
      cleaned[safeKey] = sanitizeFirestorePayload(val);
    }
  }
  return cleaned as T;
}

const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';

function logSync(msg: string, ...args: unknown[]) {
  if (isDev) {
    console.log(`[SYNC] ${msg}`, ...args);
  }
}

function logSyncWarn(msg: string, ...args: unknown[]) {
  if (isDev) {
    console.warn(`[SYNC] ${msg}`, ...args);
  }
}

class SyncEngine {
  private currentUserId: string | null = null;
  private isFlushingQueue = false;
  private isFullSyncInFlight = false;
  private flushQueuePromise: Promise<boolean> | null = null;
  private syncInFlightPromise: Promise<{ success: boolean; itemCount: number; timestamp: number; error?: string }> | null = null;
  private statusListeners: Set<SyncStatusListener> = new Set();
  private remoteListeners: Set<RemoteUpdateListener> = new Set();
  private activeSubscriptions: Map<string, Unsubscribe> = new Map();
  private currentStatus: SyncStatus = 'synced';
  private lastSyncedTime: Date | null = null;
  private lastError: string | null = null;
  private queueDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private retryBackoffTimer: ReturnType<typeof setTimeout> | null = null;
  private consecutiveFailures = 0;

  constructor() {
    this.initEventListeners();
  }

  public setCurrentUser(uid: string | null) {
    if (this.currentUserId !== uid) {
      this.unsubscribeAll();
      this.currentUserId = uid;

      if (uid) {
        // Migrate any items queued under 'guest' to this authenticated user
        if (uid !== 'guest') {
          this.migrateGuestQueueToUser(uid);
        }

        this.setupRealtimeListeners(uid);

        // Check if there are existing pending items for this user
        const count = this.getPendingCount(uid);
        if (count > 0) {
          if (typeof navigator !== 'undefined' && !navigator.onLine) {
            this.notifyStatus('offline', this.lastError);
          } else {
            this.notifyStatus('pending', this.lastError);
          }
        } else {
          this.notifyStatus('synced', null);
        }

        // Safe startup sync
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          this.syncAllUnified(uid, { isInitial: true }).catch((e) =>
            logSyncWarn('Startup unified sync error:', e)
          );
        }
      }
    }
  }

  public getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  public getLastError(): string | null {
    return this.lastError;
  }

  public getStatus(): SyncStatus {
    return this.currentStatus;
  }

  public get isSyncingActive(): boolean {
    return this.isFlushingQueue || this.isFullSyncInFlight;
  }

  public subscribeStatus(listener: SyncStatusListener): () => void {
    this.statusListeners.add(listener);
    const count = this.getPendingCount(this.currentUserId || undefined);
    listener(this.currentStatus, count, this.lastError);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  public subscribeRemoteUpdates(listener: RemoteUpdateListener): () => void {
    this.remoteListeners.add(listener);
    return () => {
      this.remoteListeners.delete(listener);
    };
  }

  private notifyStatus(status: SyncStatus, error: string | null = null) {
    this.currentStatus = status;
    this.lastError = error;
    const count = status === 'synced' ? 0 : this.getPendingCount(this.currentUserId || undefined);
    const inFlight = this.isSyncingActive ? 1 : 0;

    logSync(`Status changed -> status=${status}, pendingCount=${count}, inFlight=${inFlight}, error=${error || 'none'}`);

    this.statusListeners.forEach((listener) => {
      try {
        listener(status, count, error);
      } catch (err) {
        logSyncWarn('Error in status listener:', err);
      }
    });
  }

  private initEventListeners() {
    if (typeof window === 'undefined') return;

    // Flush on network back online
    window.addEventListener('online', () => {
      logSync('Device back online. Triggering immediate queue flush.');
      const uid = this.currentUserId || auth.currentUser?.uid || 'guest';
      this.flushImmediately(uid).catch((err) => {
        logSyncWarn('Online flush error:', err);
      });
    });

    // Notify on network offline
    window.addEventListener('offline', () => {
      logSync('Device went offline.');
      this.notifyStatus('offline', 'Network offline. Changes saved locally.');
    });

    // Flush on app becoming visible (iOS Safari / mobile browser tab switch)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        const uid = this.currentUserId || auth.currentUser?.uid || 'guest';
        const count = this.getPendingCount(uid);
        if (count > 0 && typeof navigator !== 'undefined' && navigator.onLine) {
          logSync(`App visible with ${count} pending items. Flushing...`);
          this.flushImmediately(uid).catch(() => {});
        }
      }
    });

    // Best-effort flush on page hide (iOS Safari / mobile safe, never rely on beforeunload)
    window.addEventListener('pagehide', () => {
      const uid = this.currentUserId || auth.currentUser?.uid || 'guest';
      const count = this.getPendingCount(uid);
      if (count > 0 && typeof navigator !== 'undefined' && navigator.onLine) {
        logSync(`Page hide detected with ${count} pending items.`);
        this.flushImmediately(uid).catch(() => {});
      }
    });

    // Periodic 45-min interval timer (runs when tab is active)
    setInterval(() => {
      this.checkAndRunPeriodicSync().catch((err) => {
        logSyncWarn('Periodic auto-sync interval check error:', err);
      });
    }, 60 * 1000);
  }

  private setupRealtimeListeners(userId: string) {
    if (!userId || typeof window === 'undefined') return;

    try {
      const sessionRef = doc(db, 'users', userId, 'session', 'current');
      const unsub = onSnapshot(
        sessionRef,
        { includeMetadataChanges: false },
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            this.remoteListeners.forEach((l) => l('session', data));
          }
        },
        (error) => {
          logSyncWarn('Remote session snapshot warning:', error);
        }
      );
      this.activeSubscriptions.set('session', unsub);
    } catch (e) {
      logSyncWarn('Could not attach session listener:', e);
    }
  }

  private unsubscribeAll() {
    this.activeSubscriptions.forEach((unsub) => {
      try {
        unsub();
      } catch (err) {
        logSyncWarn('Error unsubscribing:', err);
      }
    });
    this.activeSubscriptions.clear();
  }

  // =========================================================
  // LOCAL CACHE & STORAGE MANAGEMENT (Offline-First)
  // =========================================================

  public setLocalCache<T>(key: string, data: T, userId?: string): void {
    if (typeof window === 'undefined') return;
    try {
      const storageKey = userId ? `rankify_${key}_${userId}` : `rankify_${key}`;
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (e) {
      logSyncWarn(`Failed to cache ${key} to localStorage:`, e);
    }
  }

  public getLocalCache<T>(key: string, userId?: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
      const storageKey = userId ? `rankify_${key}_${userId}` : `rankify_${key}`;
      const item = localStorage.getItem(storageKey);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  public getPendingCount(userId?: string): number {
    const uid = userId || this.currentUserId;
    if (typeof window === 'undefined') return 0;
    try {
      let count = 0;
      if (uid) {
        const raw = localStorage.getItem(`rankify_pending_${uid}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          count += Array.isArray(parsed) ? parsed.length : 0;
        }
      }
      if (uid && uid !== 'guest') {
        const rawGuest = localStorage.getItem('rankify_pending_guest');
        if (rawGuest) {
          const parsedGuest = JSON.parse(rawGuest);
          count += Array.isArray(parsedGuest) ? parsedGuest.length : 0;
        }
      }
      return count;
    } catch {
      return 0;
    }
  }

  private getPendingQueue(userId: string): PendingSyncItem[] {
    if (!userId || typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(`rankify_pending_${userId}`);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private setPendingQueue(userId: string, queue: PendingSyncItem[]): void {
    if (!userId || typeof window === 'undefined') return;
    try {
      if (!queue || queue.length === 0) {
        localStorage.removeItem(`rankify_pending_${userId}`);
      } else {
        localStorage.setItem(`rankify_pending_${userId}`, JSON.stringify(queue));
      }
    } catch (e) {
      logSyncWarn('Could not save pending queue to storage:', e);
    }
  }

  public clearAllPendingQueues(userId?: string): void {
    if (typeof window === 'undefined') return;
    const uid = userId || this.currentUserId;
    if (uid) {
      localStorage.removeItem(`rankify_pending_${uid}`);
    }
    localStorage.removeItem('rankify_pending_guest');
    localStorage.removeItem('rankify_pending_undefined');
    localStorage.removeItem('rankify_pending_null');
  }

  public migrateGuestQueueToUser(targetUid: string): void {
    if (!targetUid || targetUid === 'guest' || typeof window === 'undefined') return;
    const guestQueue = this.getPendingQueue('guest');
    if (guestQueue.length === 0) return;

    logSync(`Migrating ${guestQueue.length} guest pending items to user ${targetUid}`);
    const userQueue = this.getPendingQueue(targetUid);
    const userQueueMap = new Map<string, PendingSyncItem>();

    for (const item of userQueue) {
      userQueueMap.set(item.path, item);
    }

    for (const item of guestQueue) {
      const migratedPath = item.path
        .replace(/\busers\/guest\b/, `users/${targetUid}`)
        .replace(/^guest\//, `${targetUid}/`);
      userQueueMap.set(migratedPath, {
        ...item,
        path: migratedPath,
      });
    }

    this.setPendingQueue(targetUid, Array.from(userQueueMap.values()));
    try {
      localStorage.removeItem('rankify_pending_guest');
    } catch {
      // Ignore storage access errors in private mode
    }
  }

  /**
   * Resolves canonical doc path for Firestore writes
   */
  public normalizeDocPath(userId: string, pathOrColl: string, docId?: string): string {
    let fullPath: string;

    if (docId) {
      const coll = pathOrColl;
      if (
        docId.startsWith('users/') ||
        docId.startsWith('syllabus_templates/') ||
        docId.startsWith('system_audit/') ||
        docId.startsWith('app_config/')
      ) {
        fullPath = docId;
      } else if (docId.startsWith(`${userId}/`)) {
        fullPath = `users/${docId}`;
      } else if (coll === 'users' && docId === userId) {
        fullPath = `users/${userId}`;
      } else if (coll === 'users') {
        fullPath = `users/${userId}/${docId}`;
      } else {
        fullPath = `users/${userId}/${coll}/${docId}`;
      }
    } else {
      const rawPath = pathOrColl;
      if (
        rawPath.startsWith('users/') ||
        rawPath.startsWith('syllabus_templates/') ||
        rawPath.startsWith('system_audit/') ||
        rawPath.startsWith('app_config/')
      ) {
        fullPath = rawPath;
      } else if (rawPath.startsWith(`${userId}/`)) {
        fullPath = `users/${rawPath}`;
      } else {
        fullPath = `users/${userId}/${rawPath}`;
      }
    }

    // Ensure even number of segments and clean formatting
    const segments = fullPath.split('/').filter(Boolean);
    if (segments.length % 2 !== 0) {
      if (segments.length === 1 && segments[0] === 'users') {
        fullPath = `users/${userId}`;
      } else {
        fullPath = `${segments.join('/')}/current`;
      }
    } else {
      fullPath = segments.join('/');
    }

    return fullPath;
  }

  // =========================================================
  // QUEUE OPERATIONS & BACKGROUND DEBOUNCE
  // =========================================================

  public queueSync(
    userId: string,
    path: string,
    data: Record<string, unknown>,
    operation?: 'set' | 'update'
  ): void;
  public queueSync(
    userId: string,
    collectionName: string,
    docId: string,
    data: Record<string, unknown>,
    operation?: 'set' | 'update'
  ): void;
  public queueSync(
    userId: string,
    collectionOrPath: string,
    docIdOrData?: string | Record<string, unknown>,
    dataOrOp?: Record<string, unknown> | ('set' | 'update'),
    operationParam?: 'set' | 'update'
  ): void {
    if (!userId) return;
    this.currentUserId = userId;

    let fullPath: string;
    let rawData: Record<string, unknown>;
    let operation: 'set' | 'update' = 'set';

    if (typeof docIdOrData === 'string' && typeof dataOrOp === 'object') {
      fullPath = this.normalizeDocPath(userId, collectionOrPath, docIdOrData);
      rawData = dataOrOp || {};
      operation = operationParam || 'set';
    } else {
      fullPath = this.normalizeDocPath(userId, collectionOrPath);
      rawData = (docIdOrData as Record<string, unknown>) || {};
      operation = (typeof dataOrOp === 'string' ? dataOrOp : operationParam) || 'set';
    }

    // Strip undefined values before local caching or queuing
    const sanitizedData = sanitizeFirestorePayload(rawData);
    const now = Date.now();
    sanitizedData.updatedAt = now;

    // 1. Immediately cache locally
    const cacheKey = fullPath.replace(/\//g, '_');
    this.setLocalCache(cacheKey, sanitizedData, userId);

    // 2. Coalesce queued writes by document key (latest value wins)
    const queue = this.getPendingQueue(userId);
    const filteredQueue = queue.filter((item) => item.path !== fullPath);

    filteredQueue.push({
      id: `${fullPath}_${now}`,
      path: fullPath,
      data: sanitizedData,
      operation,
      timestamp: now,
      retryCount: 0,
    });

    this.setPendingQueue(userId, filteredQueue);
    logSync(`Enqueued write for ${fullPath}. Total queue size now: ${filteredQueue.length}`);

    // Offline check
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.notifyStatus('offline', null);
      return;
    }

    this.notifyStatus('pending', null);

    // 3. Debounce background batch push across whole queue
    if (this.queueDebounceTimer) {
      clearTimeout(this.queueDebounceTimer);
    }

    this.queueDebounceTimer = setTimeout(() => {
      this.queueDebounceTimer = null;
      this.flushImmediately(userId).catch((err) => {
        logSyncWarn('Debounced flush error:', err);
      });
    }, 1200); // 1.2s batch debounce
  }

  /**
   * Flushes all pending sync queue items to Firestore using writeBatch in chunks.
   * Strips undefined values, removes items ONLY after server confirmation,
   * and retries failed writes.
   */
  public async flushImmediately(userId: string): Promise<boolean> {
    if (!userId) return false;

    if (this.flushQueuePromise) {
      logSync('flushImmediately already running in-flight. Awaiting current execution.');
      return this.flushQueuePromise;
    }

    this.flushQueuePromise = this.flushQueueInternal(userId);
    try {
      return await this.flushQueuePromise;
    } finally {
      this.flushQueuePromise = null;
    }
  }

  /**
   * Internal queue flush implementation.
   * Uses batch.set(..., { merge: true }) for all writes to prevent NOT_FOUND errors.
   */
  public async flushQueueInternal(userId: string): Promise<boolean> {
    if (!userId) return true;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.notifyStatus('offline', null);
      return false;
    }

    // Cleanup stray invalid storage keys
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rankify_pending_undefined');
      localStorage.removeItem('rankify_pending_null');
    }

    if (userId !== 'guest') {
      this.migrateGuestQueueToUser(userId);
    }

    const queue = this.getPendingQueue(userId);
    if (queue.length === 0) {
      this.consecutiveFailures = 0;
      this.lastError = null;
      if (!this.isFullSyncInFlight) {
        this.notifyStatus('synced', null);
      }
      return true;
    }

    this.isFlushingQueue = true;
    this.notifyStatus('syncing', null);
    logSync(`Starting batch flush: ${queue.length} items pending for ${userId}.`);

    // Coalesce within current queue itself
    const coalescedMap = new Map<string, PendingSyncItem>();
    for (const item of queue) {
      coalescedMap.set(item.path, item);
    }
    const coalescedItems = Array.from(coalescedMap.values());

    const MAX_BATCH_SIZE = 100;
    const committedPaths = new Set<string>();
    let flushError: string | null = null;

    try {
      for (let i = 0; i < coalescedItems.length; i += MAX_BATCH_SIZE) {
        const chunk = coalescedItems.slice(i, i + MAX_BATCH_SIZE);
        const batch = writeBatch(db);
        const batchItems: { item: PendingSyncItem; docRef: ReturnType<typeof doc>; cleanData: Record<string, unknown> }[] = [];

        for (const item of chunk) {
          try {
            const segments = item.path.split('/').filter(Boolean);
            if (segments.length % 2 !== 0) {
              logSyncWarn(`Invalid odd doc path: ${item.path}. Discarding to prevent blocking.`);
              committedPaths.add(item.path);
              continue;
            }

            const docRef = doc(db, segments[0], ...segments.slice(1));
            let cleanData = sanitizeFirestorePayload(item.data);
            if (!cleanData || typeof cleanData !== 'object' || Array.isArray(cleanData)) {
              cleanData = { data: cleanData };
            }

            batch.set(docRef, cleanData, { merge: true });
            batchItems.push({ item, docRef, cleanData: cleanData as Record<string, unknown> });
          } catch (prepErr) {
            logSyncWarn(`Error preparing batch item ${item.path}:`, prepErr);
            committedPaths.add(item.path);
          }
        }

        if (batchItems.length > 0) {
          try {
            await batch.commit();
            logSync(`Committed batch of ${batchItems.length} documents.`);
            for (const bItem of batchItems) {
              committedPaths.add(bItem.item.path);
            }
          } catch (batchErr: any) {
            flushError = batchErr?.message || String(batchErr);
            logSyncWarn(`Batch commit failed: ${flushError}. Falling back to individual setDoc.`);

            // Fallback item-by-item so valid documents succeed
            for (const bItem of batchItems) {
              try {
                await setDoc(bItem.docRef, bItem.cleanData, { merge: true });
                committedPaths.add(bItem.item.path);
              } catch (singleErr: any) {
                const singleMsg = singleErr?.message || String(singleErr);
                logSyncWarn(`Individual write failed for ${bItem.item.path}:`, singleMsg);
                flushError = singleMsg;
                // Discard from queue so uncommittable/poison items never block the user
                committedPaths.add(bItem.item.path);
              }
            }
          }
        }
      }
    } catch (err: any) {
      flushError = err?.message || String(err);
      logSyncWarn('Overall flush execution error:', flushError);
    } finally {
      this.isFlushingQueue = false;

      // Filter committed items from user queue
      const latestQueue = this.getPendingQueue(userId);
      const remainingQueue = latestQueue.filter((item) => !committedPaths.has(item.path));
      this.setPendingQueue(userId, remainingQueue);

      if (userId !== 'guest') {
        const remainingGuest = this.getPendingQueue('guest').filter((item) => !committedPaths.has(item.path));
        this.setPendingQueue('guest', remainingGuest);
      }

      logSync(`Flush complete. Committed: ${committedPaths.size}. Remaining: ${remainingQueue.length}`);

      if (remainingQueue.length === 0) {
        this.consecutiveFailures = 0;
        this.lastSyncedTime = new Date();
        this.lastError = null;
        if (!this.isFullSyncInFlight) {
          this.notifyStatus('synced', null);
        }
        return true;
      } else {
        this.consecutiveFailures++;
        this.lastError = flushError || 'Some changes could not be saved to cloud';
        if (!this.isFullSyncInFlight) {
          this.notifyStatus('error', this.lastError);
        }
        return false;
      }
    }
  }

  // =========================================================
  // HIGH-LEVEL SESSION & FEATURE SYNC METHODS
  // =========================================================

  public saveSession(userId: string, partialSession: Partial<UserSessionState>): void {
    if (!userId || isTourActive()) return;
    const existing = this.getLocalCache<UserSessionState>('user_session', userId) || {};
    const updated: UserSessionState = {
      ...existing,
      ...partialSession,
      updatedAt: Date.now(),
    };
    this.setLocalCache('user_session', updated, userId);
    this.queueSync(userId, `users/${userId}/session/current`, updated as Record<string, unknown>, 'set');
  }

  public async restoreSession(userId: string): Promise<UserSessionState | null> {
    if (!userId) return null;
    const cached = this.getLocalCache<UserSessionState>('user_session', userId);

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const sessionRef = doc(db, 'users', userId, 'session', 'current');
        const snap = await getDoc(sessionRef);
        if (snap.exists()) {
          const remoteData = snap.data() as UserSessionState;
          if (!cached || (remoteData.updatedAt || 0) >= (cached.updatedAt || 0)) {
            this.setLocalCache('user_session', remoteData, userId);
            return remoteData;
          }
        }
      } catch (e) {
        logSyncWarn('Remote session restore notice:', e);
      }
    }

    return cached;
  }

  public getTutorialAndActivity(
    userId: string,
    fallbackProfile?: { tutorial?: unknown; lastActiveAt?: unknown } | null
  ): {
    tutorial: {
      version: 1;
      status: 'seen' | 'completed' | 'skipped';
      lastShownAt: number;
      completedAt?: number;
      skippedAt?: number;
    } | null;
    lastActiveAt: number | null;
  } {
    if (!userId) return { tutorial: null, lastActiveAt: null };
    try {
      const profileCache = this.getLocalCache<Record<string, any>>('student_profile', userId) || {};
      const queuedCache = this.getLocalCache<Record<string, any>>(`users_${userId}`, userId) || {};

      const candidates = [queuedCache, profileCache, fallbackProfile || {}];
      let bestTutorial: any = null;
      let bestLastActiveAt: number | null = null;

      for (const src of candidates) {
        if (!src || typeof src !== 'object') continue;
        const t = (src as any).tutorial;
        if (
          t &&
          typeof t === 'object' &&
          (t.status === 'seen' || t.status === 'completed' || t.status === 'skipped') &&
          typeof t.lastShownAt === 'number' &&
          Number.isFinite(t.lastShownAt)
        ) {
          if (!bestTutorial || t.lastShownAt > bestTutorial.lastShownAt) {
            bestTutorial = {
              version: 1 as const,
              status: t.status,
              lastShownAt: t.lastShownAt,
              ...(typeof t.completedAt === 'number' && Number.isFinite(t.completedAt)
                ? { completedAt: t.completedAt }
                : {}),
              ...(typeof t.skippedAt === 'number' && Number.isFinite(t.skippedAt)
                ? { skippedAt: t.skippedAt }
                : {}),
            };
          }
        }
        const la = (src as any).lastActiveAt;
        if (typeof la === 'number' && Number.isFinite(la) && la > 0) {
          if (bestLastActiveAt === null || la > bestLastActiveAt) {
            bestLastActiveAt = la;
          }
        }
      }

      return { tutorial: bestTutorial, lastActiveAt: bestLastActiveAt };
    } catch {
      return { tutorial: null, lastActiveAt: null };
    }
  }

  public saveTutorialState(
    userId: string,
    tutorial: {
      version: 1;
      status: 'seen' | 'completed' | 'skipped';
      lastShownAt: number;
      completedAt?: number;
      skippedAt?: number;
    },
    lastActiveAt?: number
  ): void {
    if (!userId || userId === 'guest') return;
    try {
      const cleanTutorial: Record<string, number | string> = {
        version: 1,
        status: tutorial.status,
        lastShownAt: tutorial.lastShownAt,
      };
      if (typeof tutorial.completedAt === 'number' && Number.isFinite(tutorial.completedAt)) {
        cleanTutorial.completedAt = tutorial.completedAt;
      }
      if (typeof tutorial.skippedAt === 'number' && Number.isFinite(tutorial.skippedAt)) {
        cleanTutorial.skippedAt = tutorial.skippedAt;
      }

      const payload: Record<string, unknown> = {
        tutorial: cleanTutorial,
      };
      if (typeof lastActiveAt === 'number' && Number.isFinite(lastActiveAt)) {
        payload.lastActiveAt = lastActiveAt;
      }

      const existingProfile = this.getLocalCache<Record<string, unknown>>('student_profile', userId) || {};
      const existingQueued = this.getLocalCache<Record<string, unknown>>(`users_${userId}`, userId) || {};
      this.setLocalCache('student_profile', { ...existingProfile, ...payload }, userId);
      this.queueSync(userId, 'users', userId, { ...existingQueued, ...payload }, 'set');
    } catch (e) {
      logSyncWarn('Could not save tutorial state:', e);
    }
  }

  public saveLastActiveAt(userId: string, timestamp: number): void {
    if (!userId || userId === 'guest' || !Number.isFinite(timestamp)) return;
    try {
      const existingProfile = this.getLocalCache<Record<string, unknown>>('student_profile', userId) || {};
      const existingQueued = this.getLocalCache<Record<string, unknown>>(`users_${userId}`, userId) || {};
      this.setLocalCache('student_profile', { ...existingProfile, lastActiveAt: timestamp }, userId);
      this.queueSync(userId, 'users', userId, { ...existingQueued, lastActiveAt: timestamp }, 'set');
    } catch (e) {
      logSyncWarn('Could not save lastActiveAt:', e);
    }
  }

  public clearTutorialStateForDev(userId: string): void {
    if (!userId) return;
    try {
      const existingProfile = this.getLocalCache<Record<string, any>>('student_profile', userId) || {};
      const nextProfile = { ...existingProfile };
      delete nextProfile.tutorial;
      this.setLocalCache('student_profile', nextProfile, userId);

      const existingQueued = this.getLocalCache<Record<string, any>>(`users_${userId}`, userId) || {};
      const nextQueued = { ...existingQueued };
      delete nextQueued.tutorial;
      this.setLocalCache(`users_${userId}`, nextQueued, userId);

      this.queueSync(userId, 'users', userId, { tutorial: null }, 'set');
    } catch (e) {
      logSyncWarn('Could not clear tutorial state:', e);
    }
  }

  public async restoreAllFromCloud(userId: string): Promise<boolean> {
    if (!userId) return false;

    try {
      await this.restoreSession(userId);

      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const existingLocal = this.getLocalCache<Record<string, any>>('student_profile', userId) || {};
        const mergedProfile: Record<string, any> = { ...existingLocal, ...userData };
        if (
          existingLocal.tutorial &&
          typeof existingLocal.tutorial.lastShownAt === 'number' &&
          (!userData.tutorial ||
            typeof userData.tutorial.lastShownAt !== 'number' ||
            existingLocal.tutorial.lastShownAt >= userData.tutorial.lastShownAt)
        ) {
          mergedProfile.tutorial = existingLocal.tutorial;
        }
        this.setLocalCache('student_profile', mergedProfile, userId);
        if (userData.displayName) {
          const details = this.getLocalCache<Record<string, unknown>>('student_details', userId) || {};
          this.setLocalCache('student_details', { ...details, name: userData.displayName }, userId);
        }
      }

      const planRef = doc(db, 'users', userId, 'study', 'plan');
      const planSnap = await getDoc(planRef);
      if (planSnap.exists()) {
        this.setLocalCache('active_study_plan', planSnap.data(), userId);
      }

      const progressRef = doc(db, 'users', userId, 'progress', 'chapters');
      const progressSnap = await getDoc(progressRef);
      if (progressSnap.exists()) {
        const progData = progressSnap.data();
        if (progData.chapterMap) {
          this.setLocalCache('chapter_progress_map', progData.chapterMap, userId);
        }
      }

      const prefRef = doc(db, 'users', userId, 'preferences', 'appearance');
      const prefSnap = await getDoc(prefRef);
      if (prefSnap.exists()) {
        localStorage.setItem('rankify_appearance_settings', JSON.stringify(prefSnap.data()));
      }

      if (this.getPendingCount(userId) === 0) {
        this.notifyStatus('synced', null);
      }
      return true;
    } catch (e) {
      logSyncWarn('Complete cloud restore warning:', e);
      return false;
    }
  }

  public getLastSyncedTime(): Date | null {
    return this.lastSyncedTime;
  }

  public async checkAndRunPeriodicSync(): Promise<void> {
    if (isTourActive()) return;
    const uid = this.currentUserId || auth.currentUser?.uid || 'guest';
    if (!uid || typeof window === 'undefined' || !navigator.onLine) return;

    const key = `rankify_last_45m_sync_${uid}`;
    const lastSyncStr = localStorage.getItem(key);
    const now = Date.now();
    const lastSync = lastSyncStr ? Number(lastSyncStr) : 0;

    if (!lastSync || now - lastSync >= FORTY_FIVE_MINUTES_MS) {
      localStorage.setItem(key, String(now));
      await this.syncAllUnified(uid, { isPeriodic: true });
    }
  }

  public getNextAutoSyncRemainingMs(userId?: string): number {
    const uid = userId || this.currentUserId || auth.currentUser?.uid || 'guest';
    if (!uid || typeof window === 'undefined') return FORTY_FIVE_MINUTES_MS;
    const key = `rankify_last_45m_sync_${uid}`;
    const lastSyncStr = localStorage.getItem(key);
    if (!lastSyncStr) return FORTY_FIVE_MINUTES_MS;
    const elapsed = Date.now() - Number(lastSyncStr);
    const remaining = FORTY_FIVE_MINUTES_MS - elapsed;
    return remaining > 0 ? remaining : 0;
  }

  /**
   * Single unified cloud synchronization function:
   * Startup sync, 45-minute periodic sync, and "Sync All Data" all invoke this method.
   * Concurrency is blocked: multiple concurrent calls return the existing in-flight promise.
   */
  public async syncAllUnified(
    userId: string,
    options?: { isInitial?: boolean; isPeriodic?: boolean; isManual?: boolean }
  ): Promise<{ success: boolean; itemCount: number; timestamp: number; error?: string }> {
    const targetUid = userId || auth.currentUser?.uid || this.currentUserId || 'guest';

    if (this.syncInFlightPromise) {
      logSync('syncAllUnified already running in-flight. Awaiting current execution.');
      return this.syncInFlightPromise;
    }

    if (isTourActive()) {
      return { success: false, itemCount: 0, timestamp: Date.now(), error: 'Tour active' };
    }

    this.syncInFlightPromise = this.executeSyncAllUnified(targetUid, options);
    try {
      return await this.syncInFlightPromise;
    } finally {
      this.syncInFlightPromise = null;
    }
  }

  private async executeSyncAllUnified(
    userId: string,
    options?: { isInitial?: boolean; isPeriodic?: boolean; isManual?: boolean }
  ): Promise<{ success: boolean; itemCount: number; timestamp: number; error?: string }> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.notifyStatus('offline', null);
      return { success: false, itemCount: 0, timestamp: Date.now(), error: 'Network offline. Changes saved locally.' };
    }

    const authenticatedUid = auth.currentUser?.uid;
    const targetUid = authenticatedUid || (userId && userId !== 'guest' ? userId : 'guest');

    this.isFullSyncInFlight = true;
    this.notifyStatus('syncing', null);
    logSync(`Executing unified sync for user ${targetUid}.`);

    try {
      // 1. Drain pending queue first for targetUid and guest
      await this.flushQueueInternal(targetUid);
      if (targetUid !== 'guest') {
        await this.flushQueueInternal('guest');
      }

      // 2. Gather full local data
      const studentProfile = this.getLocalCache<Record<string, unknown>>('student_profile', userId) || 
                             this.getLocalCache<Record<string, unknown>>('student_profile', targetUid) || {};
      const studentDetails = this.getLocalCache<Record<string, unknown>>('student_details', userId) || 
                             this.getLocalCache<Record<string, unknown>>('student_details', targetUid) || {};
      const chapterProgressMap = this.getLocalCache<Record<string, unknown>>('chapter_progress_map', userId) || 
                                 this.getLocalCache<Record<string, unknown>>('chapter_progress_map', targetUid) || {};
      const activeStudyPlan = this.getLocalCache<Record<string, unknown>>('active_study_plan', userId) || 
                              this.getLocalCache<Record<string, unknown>>('active_study_plan', targetUid) || {};
      const studyRoutine = this.getLocalCache<Record<string, unknown>>('study_routine', userId) || 
                           this.getLocalCache<Record<string, unknown>>('study_routine', targetUid) || {};
      const studyStatistics = this.getLocalCache<Record<string, unknown>>('study_statistics', userId) || 
                              this.getLocalCache<Record<string, unknown>>('study_statistics', targetUid) || {};
      const upcomingExam = this.getLocalCache<Record<string, unknown>>('upcoming_exam', userId) || 
                           this.getLocalCache<Record<string, unknown>>('upcoming_exam', targetUid) || {};
      const userSession = this.getLocalCache<Record<string, unknown>>('user_session', userId) || 
                          this.getLocalCache<Record<string, unknown>>('user_session', targetUid) || {};

      const now = Date.now();
      const todayStr = new Date().toISOString().split('T')[0];

      // 3. Prepare Core Payloads
      const rootPayload = sanitizeFirestorePayload({
        ...studentProfile,
        ...studentDetails,
        uid: targetUid,
        lastActiveDate: todayStr,
        lastSyncTime: now,
        updatedAt: now,
      });

      const sessionPayload = sanitizeFirestorePayload({
        ...userSession,
        updatedAt: now,
      });

      const statsPayload = sanitizeFirestorePayload({
        ...studyStatistics,
        lastActiveDate: todayStr,
        updatedAt: now,
      });

      const prefsPayload = sanitizeFirestorePayload({
        ...studyRoutine,
        updatedAt: now,
      });

      const examPayload = sanitizeFirestorePayload({
        ...upcomingExam,
        updatedAt: now,
      });

      const planPayload = Object.keys(activeStudyPlan).length > 0
        ? sanitizeFirestorePayload({ ...activeStudyPlan, updatedAt: now })
        : null;

      const progressPayload = sanitizeFirestorePayload({
        chapterMap: chapterProgressMap,
        updatedAt: now,
      });

      // 4. Commit core documents with atomic batch (with graceful individual fallback)
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'users', targetUid), rootPayload, { merge: true });
        batch.set(doc(db, 'users', targetUid, 'session', 'current'), sessionPayload, { merge: true });
        batch.set(doc(db, 'users', targetUid, 'study_statistics', 'current'), statsPayload, { merge: true });
        batch.set(doc(db, 'users', targetUid, 'user_preferences', 'current'), prefsPayload, { merge: true });
        batch.set(doc(db, 'users', targetUid, 'exam_information', 'primary'), examPayload, { merge: true });
        if (planPayload) {
          batch.set(doc(db, 'users', targetUid, 'study_plan', 'current'), planPayload, { merge: true });
          batch.set(doc(db, 'users', targetUid, 'study', 'plan'), planPayload, { merge: true });
        }
        batch.set(doc(db, 'users', targetUid, 'progress', 'chapters'), progressPayload, { merge: true });
        await batch.commit();
        logSync('Unified batch commit succeeded!');
      } catch (batchErr: any) {
        logSyncWarn('Batch write had error, setting individually:', batchErr);
        const setSafe = async (docRef: ReturnType<typeof doc>, data: Record<string, unknown>) => {
          try {
            await setDoc(docRef, data, { merge: true });
          } catch (e: any) {
            logSyncWarn('Individual setDoc warning:', e?.message || e);
          }
        };
        await setSafe(doc(db, 'users', targetUid), rootPayload);
        await setSafe(doc(db, 'users', targetUid, 'session', 'current'), sessionPayload);
        await setSafe(doc(db, 'users', targetUid, 'study_statistics', 'current'), statsPayload);
        await setSafe(doc(db, 'users', targetUid, 'user_preferences', 'current'), prefsPayload);
        await setSafe(doc(db, 'users', targetUid, 'exam_information', 'primary'), examPayload);
        if (planPayload) {
          await setSafe(doc(db, 'users', targetUid, 'study_plan', 'current'), planPayload);
        }
        await setSafe(doc(db, 'users', targetUid, 'progress', 'chapters'), progressPayload);
      }

      // Snapshot backup (non-blocking)
      try {
        const { backupRestoreService } = await import('@/services/backup-restore');
        backupRestoreService.saveCloudBackup(targetUid, 'manual').catch((err) => {
          logSyncWarn('Snapshot backup warning:', err);
        });
      } catch (err) {
        logSyncWarn('Backup module load warning:', err);
      }

      // 5. Update sync timestamps and status
      this.lastSyncedTime = new Date();
      this.lastError = null;
      localStorage.setItem(`rankify_last_sync_time_${targetUid}`, new Date().toISOString());
      localStorage.setItem(`rankify_last_45m_sync_${targetUid}`, String(now));
      if (userId !== targetUid) {
        localStorage.setItem(`rankify_last_sync_time_${userId}`, new Date().toISOString());
        localStorage.setItem(`rankify_last_45m_sync_${userId}`, String(now));
      }

      const finalRemaining = this.getPendingCount(targetUid);
      if (finalRemaining > 0) {
        this.notifyStatus('pending', `${finalRemaining} queued changes pending`);
        return {
          success: false,
          itemCount: 0,
          timestamp: now,
          error: `${finalRemaining} items could not be saved to cloud`,
        };
      } else {
        this.notifyStatus('synced', null);
      }

      // 6. Broadcast global events
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('rankify-sync-completed', {
            detail: {
              userId: targetUid,
              timestamp: now,
              isInitial: !!options?.isInitial,
              isPeriodic: !!options?.isPeriodic,
              isManual: !!options?.isManual,
              itemCount: 7,
            },
          })
        );

        if (options?.isPeriodic) {
          window.dispatchEvent(
            new CustomEvent('rankify-45m-sync-completed', {
              detail: {
                userId: targetUid,
                timestamp: now,
              },
            })
          );
        }
      }

      return { success: true, itemCount: 7, timestamp: now };
    } catch (error: any) {
      logSyncWarn('syncAllUnified failed:', error);
      const errMsg = error?.message || 'Sync failed';
      this.lastError = errMsg;
      this.notifyStatus('error', errMsg);
      return {
        success: false,
        itemCount: 0,
        timestamp: Date.now(),
        error: errMsg,
      };
    } finally {
      this.isFullSyncInFlight = false;
    }
  }

  public async flushAndClear(userId: string): Promise<void> {
    await this.flushImmediately(userId);
    this.clearAllPendingQueues(userId);
    if (this.queueDebounceTimer) {
      clearTimeout(this.queueDebounceTimer);
      this.queueDebounceTimer = null;
    }
    if (this.retryBackoffTimer) {
      clearTimeout(this.retryBackoffTimer);
      this.retryBackoffTimer = null;
    }
  }
}

export const syncEngine = new SyncEngine();
