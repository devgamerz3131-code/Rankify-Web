import React, { useState, useEffect } from 'react';
import { remoteConfig, CURRENT_APP_VERSION } from '@/services/remote-config';
import { Sparkles, ArrowRight, ShieldAlert, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const AppUpdateModal: React.FC = () => {
  const [updateInfo, setUpdateInfo] = useState(() => remoteConfig.isUpdateRequired());
  const [dismissed, setDismissed] = useState(false);
  const [config, setConfig] = useState(() => remoteConfig.getConfig());

  useEffect(() => {
    return remoteConfig.subscribe((newCfg) => {
      setConfig(newCfg);
      setUpdateInfo(remoteConfig.isUpdateRequired());
    });
  }, []);

  const handleUpdateNow = () => {
    // Reloads to clear service worker and load latest app bundle
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  // 1. Mandatory Update Blocking Screen
  if (updateInfo.required) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl bg-card border border-rose-500/30 p-8 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center text-3xl">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-foreground">Critical CBSE Update Required</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your version (v{CURRENT_APP_VERSION}) needs to be synchronized to v{updateInfo.latest} to maintain syllabus alignment and zero-hallucination doubt resolution.
            </p>
          </div>

          <Button onClick={handleUpdateNow} variant="primary" className="w-full text-xs font-bold h-11 bg-rose-600 hover:bg-rose-500">
            <RefreshCw className="w-4 h-4 mr-2" />
            <span>Update Rankify Now</span>
          </Button>
        </div>
      </div>
    );
  }

  // 2. Optional Update Dialog
  if (updateInfo.optional && !dismissed) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl bg-card border border-purple-500/30 p-6 sm:p-8 space-y-5 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center text-xl shadow-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">
                New Version Available
              </span>
              <h3 className="text-base sm:text-lg font-black text-foreground">
                Rankify v{updateInfo.latest} is Ready!
              </h3>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <p className="font-semibold text-foreground">What's new in this update:</p>
            <ul className="space-y-1.5 text-muted-foreground">
              {config.version.releaseNotes.map((note, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              onClick={() => setDismissed(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Later
            </button>
            <Button onClick={handleUpdateNow} variant="primary" className="text-xs font-bold h-10 px-5">
              <span>Update Now</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
