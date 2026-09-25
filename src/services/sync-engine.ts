import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

export interface PendingSyncItem {
  id: string;
  collectionName: string;
  docId: string;
  data: Record<string, unknown>;
  operation: 'set' | 'update';
  timestamp: number;
}

class SyncEngine {
  private debounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private currentUserId: string | null = null;
  private isSyncing = false;

  constructor() {
    this.initEventListeners();
  }

  public setCurrentUser(uid: string | null) {
    this.currentUserId = uid;
    if (uid && navigator.onLine) {
      this.flushImmediately(uid).catch((e) => console.warn('Sync on user change notice:', e));
    }
  }

  private initEventListeners() {
    if (typeof window === 'undefined') return;

    // Immediate sync on beforeunload, pagehide, visibilitychange, and reconnect
    window.addEventListener('beforeunload', () => {
      if (this.currentUserId) {
        this.flushImmediately(this.currentUserId);
      }
    });

    window.addEventListener('pagehide', () => {
      if (this.currentUserId) {
        this.flushImmediately(this.currentUserId);
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && this.currentUserId) {
        this.flushImmediately(this.currentUserId);
      }
    });

    window.addEventListener('online', () => {
      console.log('Online connection detected, triggering immediate sync engine flush...');
      if (this.currentUserId) {
        this.flushImmediately(this.currentUserId);
      }
    });
  }

  /**
   * Reads cached data from localStorage
   */
  public getLocalCache<T = unknown>(key: string, userId?: string): T | null {
    const uid = userId || this.currentUserId;
    if (!uid || typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(`rankify_cache_${uid}_${key}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /**
   * Writes data into local cache
   */
  public setLocalCache<T = unknown>(key: string, data: T, userId?: string): void {
    const uid = userId || this.currentUserId;
    if (!uid || typeof window === 'undefined') return;
    try {
      localStorage.setItem(`rankify_cache_${uid}_${key}`, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not write to local storage cache:', e);
    }
  }

  /**
   * Queues an update:
   * 1. Updates local cache immediately
   * 2. Queues in pending sync items
   * 3. Sets 10-second debounce timer for remote sync
   */
  public queueSync(
    userId: string,
    collectionName: string,
    docId: string,
    data: Record<string, unknown>,
    operation: 'set' | 'update' = 'set'
  ): void {
    if (!userId) return;
    this.currentUserId = userId;

    // 1. Immediately cache locally
    this.setLocalCache(`${collectionName}_${docId}`, data, userId);

    // 2. Append to pending queue
    const pendingKey = `rankify_pending_${userId}`;
    let queue: PendingSyncItem[] = [];
    try {
      const existing = localStorage.getItem(pendingKey);
      if (existing) queue = JSON.parse(existing);
    } catch {
      queue = [];
    }

    // Deduplicate / overwrite existing entry for the same doc
    queue = queue.filter((item) => !(item.collectionName === collectionName && item.docId === docId));
    queue.push({
      id: `${collectionName}_${docId}_${Date.now()}`,
      collectionName,
      docId,
      data,
      operation,
      timestamp: Date.now(),
    });

    try {
      localStorage.setItem(pendingKey, JSON.stringify(queue));
    } catch (e) {
      console.warn('Could not store pending sync queue item:', e);
    }

    // 3. Clear existing debounce timer and set new 10-second timer
    const timerKey = `${userId}`;
    const existingTimer = this.debounceTimers.get(timerKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.flushImmediately(userId);
      this.debounceTimers.delete(timerKey);
    }, 10000); // 10 seconds debounce as requested

    this.debounceTimers.set(timerKey, timer);
  }

  /**
   * Immediately flushes all pending sync queue items to Firestore
   */
  public async flushImmediately(userId: string): Promise<void> {
    if (!userId || this.isSyncing) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('SyncEngine: Offline - changes will remain in local cache until online.');
      return;
    }

    const pendingKey = `rankify_pending_${userId}`;
    let queue: PendingSyncItem[] = [];
    try {
      const raw = localStorage.getItem(pendingKey);
      if (raw) queue = JSON.parse(raw);
    } catch {
      queue = [];
    }

    if (!queue.length) return;

    this.isSyncing = true;
    const remainingQueue: PendingSyncItem[] = [];

    for (const item of queue) {
      try {
        const docRef = doc(db, item.collectionName, item.docId);
        if (item.operation === 'update') {
          await updateDoc(docRef, item.data);
        } else {
          await setDoc(docRef, item.data, { merge: true });
        }
      } catch (error) {
        console.warn(`SyncEngine: sync failed for ${item.collectionName}/${item.docId}:`, error);
        remainingQueue.push(item);
      }
    }

    try {
      if (remainingQueue.length > 0) {
        localStorage.setItem(pendingKey, JSON.stringify(remainingQueue));
      } else {
        localStorage.removeItem(pendingKey);
      }
    } catch (e) {
      console.warn('Could not update pending sync queue in localStorage:', e);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Immediate sync on user logout or critical step
   */
  public async flushAndClear(userId: string): Promise<void> {
    await this.flushImmediately(userId);
    const timer = this.debounceTimers.get(userId);
    if (timer) {
      clearTimeout(timer);
      this.debounceTimers.delete(userId);
    }
  }
}

export const syncEngine = new SyncEngine();
