import React from 'react';
import { APP_CONFIG } from '@/constants/config';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200/60 dark:border-white/5 py-8 mt-auto text-xs text-muted-foreground select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center sm:justify-start">
        <span className="font-medium text-muted-foreground">
          <span className="font-semibold text-foreground">{APP_CONFIG.name}</span> - {APP_CONFIG.tagline}
        </span>
      </div>
    </footer>
  );
};

