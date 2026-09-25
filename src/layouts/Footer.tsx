import React from 'react';
import { APP_CONFIG } from '@/constants/config';
import { Sparkles, Shield } from '@/icons';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200/60 dark:border-white/5 py-8 mt-auto text-xs text-muted-foreground select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">Rankify Web</span>
          <span>•</span>
          <span>{APP_CONFIG.tagline}</span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-purple-500" />
            Phase 1 Foundation
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Shield className="h-3 w-3 text-blue-500" />
            CBSE 2026-2027
          </span>
          <span>•</span>
          <span>Netlify & PWA Ready</span>
        </div>
      </div>
    </footer>
  );
};
