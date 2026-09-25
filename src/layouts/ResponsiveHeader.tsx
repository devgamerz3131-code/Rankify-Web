import React from 'react';
import { useNavigation } from '@/contexts/NavigationContext';
import { useAuth } from '@/hooks/use-auth';
import { NAV_ITEMS } from '@/constants/navigation';
import { ChevronRight, Award } from '@/icons';

export const ResponsiveHeader: React.FC = () => {
  const { activeTab, selectedClass } = useNavigation();
  const { user } = useAuth();

  const currentNav = NAV_ITEMS.find((item) => item.id === activeTab) || NAV_ITEMS[0];

  return (
    <div className="w-full pb-4 sm:pb-6 border-b border-slate-200/60 dark:border-white/5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Breadcrumb & Section Name */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span>Rankify</span>
            <ChevronRight className="h-3 w-3 opacity-60" />
            <span>Class {selectedClass}</span>
            <ChevronRight className="h-3 w-3 opacity-60" />
            <span className="text-purple-600 dark:text-purple-400 font-semibold capitalize">
              {currentNav.label}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {currentNav.label}
            </h1>
            {currentNav.badge && (
              <span className="rounded-full bg-gradient-to-r from-purple-600 to-blue-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-xs">
                {currentNav.badge}
              </span>
            )}
          </div>
        </div>

        {/* User Status / Badge */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200/80 dark:border-white/10 bg-card shadow-xs">
            <Award className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span className="font-semibold text-foreground">
              {user ? user.displayName || 'Student' : 'Guest Student'}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-purple-600 dark:text-purple-400 font-semibold">
              {user?.role === 'admin' ? 'Educator' : `Class ${selectedClass}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
