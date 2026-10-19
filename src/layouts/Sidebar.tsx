import React, { useState } from 'react';
import { useNavigation } from '@/contexts/NavigationContext';
import { PRIMARY_NAV_ITEMS, MORE_NAV_ITEMS } from '@/constants/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { TOTAL_OFFICIAL_CHAPTERS } from '@/services/chapter-service';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useNavigation();

  const isMoreChildActive =
    activeTab === 'ncert' ||
    activeTab === 'mistakes' ||
    activeTab === 'weakness' ||
    activeTab === 'more';

  // Keep More expanded if a child route is active
  const [isMoreExpanded, setIsMoreExpanded] = useState<boolean>(true);

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card shrink-0 min-h-[calc(100vh-4rem)] p-4 select-none">
      {/* Navigation List */}
      <div className="space-y-1.5 flex-1">
        <div className="px-3 pb-2 pt-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          Navigation
        </div>

        {PRIMARY_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isMore = item.id === 'more';
          const isActive = isMore ? activeTab === 'more' : activeTab === item.id;

          if (isMore) {
            return (
              <div key={item.id} className="space-y-1 pt-1">
                {/* Main "More" Button in Navigation */}
                <button
                  onClick={() => {
                    setActiveTab('more');
                    setIsMoreExpanded(true);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    activeTab === 'more'
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                      : isMoreChildActive
                      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 ${
                        activeTab === 'more'
                          ? 'text-white'
                          : isMoreChildActive
                          ? 'text-purple-600 dark:text-purple-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMoreExpanded((prev) => !prev);
                    }}
                    className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition"
                  >
                    {isMoreExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 opacity-70" />
                    )}
                  </button>
                </button>

                {/* Moved Nested Items: NCERT, Mistakes, Weakness */}
                {isMoreExpanded && (
                  <div className="ml-4 pl-3 border-l-2 border-purple-500/20 space-y-1 py-0.5">
                    {MORE_NAV_ITEMS.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const isSubActive = activeTab === subItem.id;

                      return (
                        <button
                          key={subItem.id}
                          onClick={() => setActiveTab(subItem.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                            isSubActive
                              ? 'bg-purple-600 text-white font-bold shadow-xs'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <SubIcon
                              className={`h-3.5 w-3.5 ${
                                isSubActive ? 'text-white' : 'text-muted-foreground'
                              }`}
                            />
                            <span>{subItem.label}</span>
                          </div>

                          {subItem.badge && !isSubActive && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono">
                              {subItem.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Target & Status Info Card */}
      <div className="mt-auto pt-4">
        <div className="rounded-2xl border border-border bg-muted/50 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">CBSE Class 12 PCM</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            {TOTAL_OFFICIAL_CHAPTERS} Chapters • Physics, Chemistry & Mathematics
          </p>
        </div>
      </div>
    </aside>
  );
};
