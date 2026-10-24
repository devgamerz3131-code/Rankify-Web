import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { syncEngine, SyncStatus, UserSessionState } from '@/services/sync-engine';
import { auth } from '@/firebase/config';

export interface SyncContextValue {
  syncStatus: SyncStatus;
  pendingCount: number;
  lastSyncedAt: Date | null;
  lastError: string | null;
  isSyncingAll: boolean;
  nextAutoSyncMinutes: number;
  isInitialRestoreDone: boolean;
  initialRestoreFailed: boolean;
  syncAllUnified: (options?: { isManual?: boolean }) => Promise<{ success: boolean; itemCount?: number; error?: string }>;
  triggerManualSync: () => Promise<{ success: boolean; itemCount?: number; error?: string }>;
  saveSessionState: (partial: Partial<UserSessionState>) => void;
  sessionState: UserSessionState | null;
}

export const SyncContext = createContext<SyncContextValue | null>(null);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => syncEngine.getStatus());
  const [pendingCount, setPendingCount] = useState<number>(() =>
    typeof window !== 'undefined' && user?.uid ? syncEngine.getPendingCount(user.uid) : 0
  );
  const [lastError, setLastError] = useState<string | null>(() => syncEngine.getLastError());
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(() => {
    try {
      const raw = typeof window !== 'undefined' && user?.uid ? localStorage.getItem(`rankify_last_sync_time_${user.uid}`) : null;
      return raw ? new Date(raw) : null;
    } catch {
      return null;
    }
  });
  const [sessionState, setSessionState] = useState<UserSessionState | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState<boolean>(false);
  const [nextAutoSyncMinutes, setNextAutoSyncMinutes] = useState<number>(45);
  const [isInitialRestoreDone, setIsInitialRestoreDone] = useState<boolean>(false);
  const [initialRestoreFailed, setInitialRestoreFailed] = useState<boolean>(false);

  // Sync user change to SyncEngine
  useEffect(() => {
    syncEngine.setCurrentUser(user?.uid || null);
    if (user?.uid) {
      setIsInitialRestoreDone(false);
      setInitialRestoreFailed(false);
      try {
        const raw = localStorage.getItem(`rankify_last_sync_time_${user.uid}`);
        if (raw) setLastSyncedAt(new Date(raw));
      } catch {
        // Ignore storage error
      }

      setPendingCount(syncEngine.getPendingCount(user.uid));

      // Restore cached session state immediately
      const cached = syncEngine.getLocalCache<UserSessionState>('user_session', user.uid);
      if (cached) {
        setSessionState(cached);
      }

      // Restore full state from cloud
      const currentUid = user.uid;
      syncEngine
        .restoreAllFromCloud(currentUid)
        .then((ok) => {
          const refreshed = syncEngine.getLocalCache<UserSessionState>('user_session', currentUid);
          if (refreshed) {
            setSessionState(refreshed);
          }
          const hasLocalProfile = Boolean(syncEngine.getLocalCache('student_profile', currentUid));
          const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
          setInitialRestoreFailed(!ok && !(isOffline && hasLocalProfile));
          setIsInitialRestoreDone(true);
        })
        .catch(() => {
          setInitialRestoreFailed(true);
          setIsInitialRestoreDone(true);
        });
    } else {
      setSessionState(null);
      setPendingCount(0);
      setIsInitialRestoreDone(false);
      setInitialRestoreFailed(false);
    }
  }, [user?.uid]);

  // Track next auto-sync minutes
  useEffect(() => {
    const updateCountdown = () => {
      if (user?.uid) {
        const msRemaining = syncEngine.getNextAutoSyncRemainingMs(user.uid);
        setNextAutoSyncMinutes(Math.max(1, Math.ceil(msRemaining / (60 * 1000))));
      } else {
        setNextAutoSyncMinutes(45);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 15000);
    return () => clearInterval(interval);
  }, [user?.uid]);

  // Subscribe to SyncEngine status changes (Single Source of Truth)
  useEffect(() => {
    const unsub = syncEngine.subscribeStatus((status, count, err) => {
      setSyncStatus(status);
      setPendingCount(count);
      setLastError(err || null);
      if (status === 'synced') {
        setLastSyncedAt(new Date());
      }
    });

    const handleSyncEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ timestamp: number }>;
      if (customEvent.detail?.timestamp) {
        setLastSyncedAt(new Date(customEvent.detail.timestamp));
      }
    };

    window.addEventListener('rankify-sync-completed', handleSyncEvent);

    return () => {
      unsub();
      window.removeEventListener('rankify-sync-completed', handleSyncEvent);
    };
  }, []);

  // Listen to remote multi-device updates
  useEffect(() => {
    const unsub = syncEngine.subscribeRemoteUpdates((path, data) => {
      if (path === 'session') {
        setSessionState(data as UserSessionState);
      }
    });
    return () => unsub();
  }, []);

  const syncAllUnified = useCallback(
    async (options?: { isManual?: boolean }) => {
      const activeUid = user?.uid || auth.currentUser?.uid || 'guest';
      setIsSyncingAll(true);
      try {
        const result = await syncEngine.syncAllUnified(activeUid, {
          isManual: options?.isManual ?? true,
        });
        if (result.success) {
          setLastSyncedAt(new Date(result.timestamp));
          setPendingCount(0);
          setSyncStatus('synced');
          setLastError(null);
        }
        return result;
      } catch (err: any) {
        return {
          success: false,
          error: err?.message || 'Sync failed unexpectedly',
        };
      } finally {
        setIsSyncingAll(false);
      }
    },
    [user?.uid]
  );

  const triggerManualSync = useCallback(async () => {
    return await syncAllUnified({ isManual: true });
  }, [syncAllUnified]);

  const saveSessionState = useCallback(
    (partial: Partial<UserSessionState>) => {
      if (!user?.uid) return;
      setSessionState((prev) => {
        const next = { ...prev, ...partial, updatedAt: Date.now() };
        syncEngine.saveSession(user.uid, next);
        return next;
      });
    },
    [user?.uid]
  );

  const value = useMemo(
    () => ({
      syncStatus,
      pendingCount,
      lastSyncedAt,
      lastError,
      isSyncingAll,
      nextAutoSyncMinutes,
      isInitialRestoreDone,
      initialRestoreFailed,
      syncAllUnified,
      triggerManualSync,
      saveSessionState,
      sessionState,
    }),
    [
      syncStatus,
      pendingCount,
      lastSyncedAt,
      lastError,
      isSyncingAll,
      nextAutoSyncMinutes,
      isInitialRestoreDone,
      initialRestoreFailed,
      syncAllUnified,
      triggerManualSync,
      saveSessionState,
      sessionState,
    ]
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};

export function useSync(): SyncContextValue {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}
