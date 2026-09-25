import React, { useState } from 'react';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { Download, Sparkles, X } from '@/icons';
import { Button } from '@/components/ui/button';

export const PWAInstallButton: React.FC<{ variant?: 'compact' | 'full' }> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed, hide prompt
  if (isInstalled) {
    return null;
  }

  // Chromium / Desktop / Android flow
  if (isInstallable) {
    return (
      <Button
        variant="glass"
        size={variant === 'compact' ? 'sm' : 'md'}
        onClick={install}
        className="text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/40 hover:bg-purple-50 dark:hover:bg-purple-950/40"
      >
        <Download className="h-4 w-4" />
        <span>Install App</span>
      </Button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <Button
          variant="glass"
          size={variant === 'compact' ? 'sm' : 'md'}
          onClick={() => setShowIOSGuide(true)}
          className="text-purple-600 dark:text-purple-400"
        >
          <Download className="h-4 w-4" />
          <span>Install</span>
        </Button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl border border-slate-200/80 dark:border-white/10">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-foreground">Install Rankify on iOS</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed space-y-2">
                <span>1. Tap the <strong>Share</strong> icon in the Safari navigation bar.</span>
                <br />
                <span>2. Scroll down and choose <strong>Add to Home Screen</strong>.</span>
                <br />
                <span>3. Launch Rankify directly from your iPhone / iPad home screen for an offline-ready experience.</span>
              </p>
              <Button
                variant="primary"
                size="sm"
                className="w-full mt-5"
                onClick={() => setShowIOSGuide(false)}
              >
                Got It
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
