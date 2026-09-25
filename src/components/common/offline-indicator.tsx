import React from 'react';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { WifiOff } from '@/icons';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 sm:bottom-6 sm:left-6 z-50 flex items-center gap-2.5 rounded-2xl bg-amber-500/95 text-white backdrop-blur-md px-4 py-2.5 text-xs font-semibold shadow-xl border border-amber-400/40 animate-pulse">
      <WifiOff className="h-4 w-4" />
      <span>Offline Mode — Using cached Rankify study content.</span>
    </div>
  );
};
