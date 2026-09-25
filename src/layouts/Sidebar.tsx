import React from 'react';
import { useNavigation } from '@/contexts/NavigationContext';
import { NAV_ITEMS } from '@/constants/navigation';
import { Sparkles, Shield } from '@/icons';
import { useAuth } from '@/hooks/use-auth';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, selectedClass } = useNavigation();
  const { user } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200/80 dark:border-white/10 bg-card/60 backdrop-blur-xl shrink-0 min-h-[calc(100vh-4rem)] p-4 select-none">
      {/* Navigation List */}
      <div className="space-y-1.5 flex-1">
        <div className="px-3 pb-2 pt-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Curriculum & Tools
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                <span>{item.label}</span>
              </div>

              {item.isAi ? (
                <span
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                  }`}
                >
                  <Sparkles className="h-2.5 w-2.5" />
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Target & Role Status Card */}
      <div className="mt-auto pt-4">
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-slate-900/60 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">CBSE Class 12 PCM</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Official 40-chapter curriculum: Physics, Chemistry & Mathematics.
          </p>
          {user?.role === 'admin' && (
            <div className="flex items-center gap-1.5 pt-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
              <Shield className="h-3.5 w-3.5" />
              <span>Admin Access Active</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
