import React from 'react';
import { Hammer, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { remoteConfig } from '@/services/remote-config';

export const MaintenanceScreen: React.FC = () => {
  const cfg = remoteConfig.getConfig();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 selection:bg-purple-500">
      <div className="max-w-md w-full rounded-3xl bg-slate-900 border border-purple-500/30 p-8 text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center text-3xl border border-amber-500/30 animate-pulse">
          <Hammer className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white">System Under Maintenance</h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            {cfg.maintenance.message}
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs">
          <span className="text-slate-400">Estimated Duration:</span>
          <span className="font-bold text-purple-300 ml-1.5">{cfg.maintenance.estimatedReturn}</span>
        </div>

        <Button
          onClick={() => window.location.reload()}
          variant="primary"
          className="w-full text-xs font-bold h-11"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          <span>Check Status Again</span>
        </Button>
      </div>
    </div>
  );
};
