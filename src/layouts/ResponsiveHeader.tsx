import React from 'react';
import { useNavigation } from '@/contexts/NavigationContext';
import { NAV_ITEMS } from '@/constants/navigation';
import { ChevronRight } from '@/icons';

export const ResponsiveHeader: React.FC = () => {
  const { activeTab, selectedClass } = useNavigation();

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
      </div>
    </div>
  );
};

