import React, { useState, useEffect } from 'react';
import { remoteConfig } from '@/services/remote-config';
import { Bell, AlertTriangle, X, ExternalLink } from 'lucide-react';

export const AnnouncementBanner: React.FC = () => {
  const [config, setConfig] = useState(() => remoteConfig.getConfig());
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    return remoteConfig.subscribe((newCfg) => setConfig(newCfg));
  }, []);

  if (!config.announcement.enabled || dismissed) return null;

  const isUrgent = config.announcement.priority === 'urgent' || config.announcement.priority === 'high';

  return (
    <div
      className={`w-full px-4 py-2 text-xs transition-colors flex items-center justify-between gap-3 ${
        isUrgent
          ? 'bg-rose-600 text-white font-medium'
          : 'bg-gradient-to-r from-purple-900/90 to-indigo-900/90 text-purple-100 border-b border-purple-500/20'
      }`}
    >
      <div className="max-w-7xl mx-auto flex-1 flex items-center justify-center gap-2 text-center flex-wrap">
        <span className="flex items-center gap-1.5 font-bold">
          {isUrgent ? (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
          ) : (
            <Bell className="w-3.5 h-3.5 text-purple-300" />
          )}
          <span>{config.announcement.badgeText || 'Notice'}:</span>
        </span>

        <span className="font-semibold">{config.announcement.title}</span>
        <span className="hidden sm:inline text-white/80">— {config.announcement.message}</span>

        {config.announcement.linkUrl && (
          <a
            href={config.announcement.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-bold text-white hover:text-purple-200 flex items-center gap-1 ml-1"
          >
            <span>Learn more</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="p-1 rounded hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
        title="Dismiss notice"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
