import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { NavRoute } from '@/types/navigation';
import { CBSEClassNumber } from '@/types/cbse';
import { safeLocalStorage } from '@/utils/storage';
import { APP_CONFIG } from '@/constants/config';
import { syncEngine, UserSessionState } from '@/services/sync-engine';
import { useAuth } from '@/hooks/use-auth';
import { isTourActive } from '@/features/tour/tourReadOnlyGate';

export interface AiPromptPrefill {
  subject?: string;
  chapter?: string;
  difficulty?: string;
  questionType?: string;
  query?: string;
}

export interface NavigationContextValue {
  activeTab: NavRoute;
  setActiveTab: (tab: NavRoute) => void;
  selectedClass: CBSEClassNumber;
  setSelectedClass: (cls: CBSEClassNumber) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  toggleSearch: () => void;
  aiPrefill: AiPromptPrefill | null;
  setAiPrefill: (prefill: AiPromptPrefill | null) => void;
  navigateToAi: (prefill?: AiPromptPrefill) => void;
}

export const NavigationContext = createContext<NavigationContextValue | null>(null);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [activeTab, setActiveTabState] = useState<NavRoute>(() => {
    if (typeof window === 'undefined') return 'home';
    const path = window.location.pathname.replace('/', '') as NavRoute;
    const validTabs: NavRoute[] = [
      'home',
      'study',
      'ai',
      'profile',
      'ncert',
      'settings',
      'admin',
      'mistakes',
      'weakness',
      'halfyearly',
      'more',
    ];
    if (path && validTabs.includes(path)) return path;

    // Check stored active tab from localStorage
    try {
      const storedTab = localStorage.getItem('rankify_last_active_tab') as NavRoute;
      if (storedTab && validTabs.includes(storedTab)) {
        return storedTab;
      }
      const rawSession = localStorage.getItem('rankify_cache_global_user_session');
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        if (parsed.lastActiveTab && validTabs.includes(parsed.lastActiveTab as NavRoute)) {
          return parsed.lastActiveTab as NavRoute;
        }
      }
    } catch {}

    return 'home';
  });

  const [selectedClass, setSelectedClassState] = useState<CBSEClassNumber>(() => {
    return safeLocalStorage.getItem<CBSEClassNumber>(APP_CONFIG.storageKeys.selectedClass, 10);
  });

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [aiPrefill, setAiPrefill] = useState<AiPromptPrefill | null>(null);

  // Restore user session tab on login
  useEffect(() => {
    if (isTourActive()) return;
    if (user?.uid) {
      const cached = syncEngine.getLocalCache<UserSessionState>('user_session', user.uid);
      if (cached?.lastActiveTab && window.location.pathname === '/') {
        setActiveTabState(cached.lastActiveTab as NavRoute);
      }
    }
  }, [user?.uid]);

  // Listen to remote session updates from another device
  useEffect(() => {
    const unsub = syncEngine.subscribeRemoteUpdates((path, data) => {
      if (isTourActive()) return;
      if (path === 'session' && data.lastActiveTab) {
        setActiveTabState(data.lastActiveTab as NavRoute);
      }
    });
    return () => unsub();
  }, []);

  // Sync URL hash or pathname with activeTab and auto-save session
  const setActiveTab = useCallback(
    (tab: NavRoute) => {
      setActiveTabState(tab);
      // Step 1(a) (Phase 3): While the tour is open, do NOT write lastOpened/lastActiveTab or push history
      if (isTourActive()) {
        return;
      }
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('rankify_last_active_tab', tab);
        } catch {}
        const newPath = tab === 'home' ? '/' : `/${tab}`;
        window.history.pushState(null, '', newPath);
      }
      if (user?.uid) {
        syncEngine.saveSession(user.uid, {
          lastActiveTab: tab,
          lastOpenedFeature: tab,
        });
      }
    },
    [user?.uid]
  );

  const navigateToAi = useCallback(
    (prefill?: AiPromptPrefill) => {
      if (prefill) {
        setAiPrefill(prefill);
      }
      setActiveTab('ai');
    },
    [setActiveTab]
  );

  useEffect(() => {
    const handlePopState = () => {
      if (isTourActive()) return;
      const path = window.location.pathname.replace('/', '') as NavRoute;
      const validTabs: NavRoute[] = ['home', 'study', 'ai', 'progress', 'profile', 'tools', 'command', 'briefing', 'formula', 'ncert', 'revision', 'brain', 'replay', 'practice', 'settings', 'admin', 'mistakes', 'readiness', 'weakness', 'halfyearly', 'more'];
      setActiveTabState(validTabs.includes(path) ? path : 'home');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const setSelectedClass = useCallback((cls: CBSEClassNumber) => {
    setSelectedClassState(cls);
    safeLocalStorage.setItem(APP_CONFIG.storageKeys.selectedClass, cls);
  }, []);

  const toggleSearch = useCallback(() => setIsSearchOpen((prev) => !prev), []);

  const value = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      selectedClass,
      setSelectedClass,
      isSearchOpen,
      setIsSearchOpen,
      toggleSearch,
      aiPrefill,
      setAiPrefill,
      navigateToAi,
    }),
    [activeTab, setActiveTab, selectedClass, setSelectedClass, isSearchOpen, toggleSearch, aiPrefill, navigateToAi]
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
