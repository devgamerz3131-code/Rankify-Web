import React from 'react';
import { useNavigation } from '@/contexts/NavigationContext';
import { NAV_ITEMS } from '@/constants/navigation';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useNavigation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 pt-1 pointer-events-none">
      <div className="max-w-md mx-auto h-16 rounded-3xl glass-card border border-slate-200/90 dark:border-white/10 shadow-2xl flex items-center justify-around px-2 pointer-events-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-12 rounded-2xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'text-purple-600 dark:text-purple-400 font-bold scale-105'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
                {item.isAi && (
                  <span className="absolute -top-1 -right-2 h-2 w-2 rounded-full bg-purple-500" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
