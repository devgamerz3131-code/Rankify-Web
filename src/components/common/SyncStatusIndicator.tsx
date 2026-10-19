import React, { useState, useEffect } from 'react';
import { useSync } from '@/contexts/SyncContext';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export const SyncStatusIndicator: React.FC = () => {
  const { syncStatus, pendingCount, triggerManualSync, isSyncingAll, lastError } = useSync();
  const isOnline = useOnlineStatus();
  const [syncingExceeded5s, setSyncingExceeded5s] = useState(false);

  const isActuallySyncing = syncStatus === 'syncing' || isSyncingAll;

  // Track syncing for more than 5 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isActuallySyncing) {
      timer = setTimeout(() => {
        setSyncingExceeded5s(true);
      }, 5000);
    } else {
      setSyncingExceeded5s(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isActuallySyncing]);

  // If online, no error, and not offline/long-syncing -> show NOTHING
  if (isOnline && syncStatus !== 'error' && syncStatus !== 'offline' && !syncingExceeded5s) {
    return null;
  }

  const handleDotClick = async () => {
    if (syncStatus === 'error') {
      const res = await triggerManualSync();
      if (res.success) {
        toast.success('Sync complete!');
      } else {
        toast.error('Sync failed - Retry');
      }
    } else if (!isOnline || syncStatus === 'offline') {
      toast('Offline — Changes will sync when reconnected.', { icon: '📡' });
    }
  };

  return (
    <div className="flex items-center">
      {syncStatus === 'error' ? (
        <button
          onClick={handleDotClick}
          className="group relative flex items-center justify-center p-1 cursor-pointer focus:outline-hidden"
          title={lastError || 'Sync failed - Retry'}
          aria-label="Sync failed - Retry"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse ring-2 ring-rose-500/30" />
          <span className="sr-only">Sync failed - Retry</span>
        </button>
      ) : !isOnline || syncStatus === 'offline' ? (
        <button
          onClick={handleDotClick}
          className="group relative flex items-center justify-center p-1 cursor-pointer focus:outline-hidden"
          title="Offline"
          aria-label="Offline"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-500" />
          <span className="sr-only">Offline</span>
        </button>
      ) : syncingExceeded5s ? (
        <div
          className="flex items-center justify-center p-1 text-purple-600 dark:text-purple-400"
          title="Syncing..."
          aria-label="Syncing..."
        >
          <RefreshCw className="w-3 h-3 animate-spin opacity-80" />
        </div>
      ) : null}
    </div>
  );
};
