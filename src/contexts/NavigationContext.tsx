import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { NavRoute } from '@/types/navigation';
import { CBSEClassNumber } from '@/types/cbse';
import { safeLocalStorage } from '@/utils/storage';
import { APP_CONFIG } from '@/constants/config';

export interface NavigationContextValue {
  activeTab: NavRoute;
  setActiveTab: (tab: NavRoute) => void;
  selectedClass: CBSEClassNumber;
  setSelectedClass: (cls: CBSEClassNumber) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  toggleSearch: () => void;
}

export const NavigationContext = createContext<NavigationContextValue | null>(null);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTabState] = useState<NavRoute>(() => {
    if (typeof window === 'undefined') return 'home';
    const path = window.location.pathname.replace('/', '') as NavRoute;
    const validTabs: NavRoute[] = ['home', 'study', 'practice', 'ask-ai', 'progress', 'profile'];
    return validTabs.includes(path) ? path : 'home';
  });

  const [selectedClass, setSelectedClassState] = useState<CBSEClassNumber>(() => {
    return safeLocalStorage.getItem<CBSEClassNumber>(APP_CONFIG.storageKeys.selectedClass, 10);
  });

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Sync URL hash or pathname with activeTab
  const setActiveTab = (tab: NavRoute) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      const newPath = tab === 'home' ? '/' : `/${tab}`;
      window.history.pushState(null, '', newPath);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace('/', '') as NavRoute;
      const validTabs: NavRoute[] = ['home', 'study', 'practice', 'ask-ai', 'progress', 'profile'];
      setActiveTabState(validTabs.includes(path) ? path : 'home');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const setSelectedClass = (cls: CBSEClassNumber) => {
    setSelectedClassState(cls);
    safeLocalStorage.setItem(APP_CONFIG.storageKeys.selectedClass, cls);
  };

  const toggleSearch = () => setIsSearchOpen((prev) => !prev);

  const value = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      selectedClass,
      setSelectedClass,
      isSearchOpen,
      setIsSearchOpen,
      toggleSearch,
    }),
    [activeTab, selectedClass, isSearchOpen]
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
};

export function useNavigation(): NavigationContextValue {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
