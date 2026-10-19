import React, { createContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  Theme,
  ResolvedTheme,
  ThemeContextValue,
  AppearanceSettings,
  DEFAULT_APPEARANCE_SETTINGS,
  UiPreset,
  AccentColor,
} from '@/types/theme';
import { safeLocalStorage } from '@/utils/storage';
import { APP_CONFIG } from '@/constants/config';
import { db, auth } from '@/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY_APPEARANCE = 'rankify_appearance_settings';

// Accent Color HSL Palette
const ACCENT_COLORS: Record<
  AccentColor,
  { primary: string; ring: string; accent: string; darkAccent: string }
> = {
  Purple: {
    primary: '262 83% 58%',
    ring: '262 83% 58%',
    accent: '262 83% 95%',
    darkAccent: '262 70% 20%',
  },
  Blue: {
    primary: '217 91% 60%',
    ring: '217 91% 60%',
    accent: '217 91% 95%',
    darkAccent: '217 70% 20%',
  },
  Green: {
    primary: '142 76% 36%',
    ring: '142 76% 36%',
    accent: '142 76% 95%',
    darkAccent: '142 70% 20%',
  },
  Orange: {
    primary: '24 95% 53%',
    ring: '24 95% 53%',
    accent: '24 95% 95%',
    darkAccent: '24 70% 20%',
  },
  Red: {
    primary: '0 84% 60%',
    ring: '0 84% 60%',
    accent: '0 84% 95%',
    darkAccent: '0 70% 20%',
  },
  Pink: {
    primary: '330 81% 60%',
    ring: '330 81% 60%',
    accent: '330 81% 95%',
    darkAccent: '330 70% 20%',
  },
  Teal: {
    primary: '174 77% 38%',
    ring: '174 77% 38%',
    accent: '174 77% 95%',
    darkAccent: '174 70% 20%',
  },
  'Dynamic System Color': {
    primary: '262 83% 58%',
    ring: '262 83% 58%',
    accent: '262 83% 95%',
    darkAccent: '262 70% 20%',
  },
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    return safeLocalStorage.getItem<Theme>(APP_CONFIG.storageKeys.theme, 'system');
  });

  const [appearance, setAppearanceState] = useState<AppearanceSettings>(() => {
    try {
      const saved = safeLocalStorage.getItem<string>(STORAGE_KEY_APPEARANCE, '');
      if (saved) {
        return { ...DEFAULT_APPEARANCE_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_APPEARANCE_SETTINGS;
  });

  const [systemDark, setSystemDark] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Track system dark mode change
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', handler);
      return () => media.removeEventListener('change', handler);
    }
  }, []);

  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (theme === 'system') {
      return systemDark ? 'dark' : 'light';
    }
    return theme;
  }, [theme, systemDark]);

  // Load from Firebase on user login
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser?.uid) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid, 'settings', 'appearance');
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data() as Partial<AppearanceSettings>;
            setAppearanceState((prev) => {
              const merged = { ...prev, ...data };
              safeLocalStorage.setItem(STORAGE_KEY_APPEARANCE, JSON.stringify(merged));
              return merged;
            });
          }
        } catch {
          // Offline fallback
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Apply all CSS variables and classes dynamically to documentElement
  useEffect(() => {
    const root = document.documentElement;

    // 1. Light/Dark theme class and CSS color-scheme
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }

    // 2. Accent Color
    const palette = ACCENT_COLORS[appearance.accentColor] || ACCENT_COLORS.Purple;
    root.style.setProperty('--primary', palette.primary);
    root.style.setProperty('--ring', palette.ring);
    root.style.setProperty(
      '--accent',
      resolvedTheme === 'dark' ? palette.darkAccent : palette.accent
    );

    // 3. Corner Radius
    const radiusMap: Record<string, { sm: string; md: string; lg: string; xl: string; '2xl': string }> = {
      Small: { sm: '0.25rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem', '2xl': '1rem' },
      Medium: { sm: '0.375rem', md: '0.5rem', lg: '0.75rem', xl: '1rem', '2xl': '1.25rem' },
      Large: { sm: '0.5rem', md: '0.75rem', lg: '1rem', xl: '1.25rem', '2xl': '1.5rem' },
      'Extra Large': { sm: '0.75rem', md: '1rem', lg: '1.5rem', xl: '1.75rem', '2xl': '2rem' },
    };
    const rad = radiusMap[appearance.radiusPreset] || radiusMap.Large;
    root.style.setProperty('--radius', rad.lg);
    root.style.setProperty('--radius-sm', rad.sm);
    root.style.setProperty('--radius-md', rad.md);
    root.style.setProperty('--radius-lg', rad.lg);
    root.style.setProperty('--radius-xl', rad.xl);
    root.style.setProperty('--radius-2xl', rad['2xl']);

    // 4. Material 3 Surface and Elevation System
    const isBatterySaver = appearance.performanceMode === 'Battery Saver';
    root.style.setProperty('--surface-0', resolvedTheme === 'dark' ? 'hsl(225 18% 9%)' : 'hsl(225 25% 97%)');
    root.style.setProperty('--surface-1', resolvedTheme === 'dark' ? 'hsl(225 18% 13%)' : 'hsl(0 0% 100%)');
    root.style.setProperty('--surface-2', resolvedTheme === 'dark' ? 'hsl(225 18% 16%)' : 'hsl(220 18% 94%)');
    root.style.setProperty('--surface-3', resolvedTheme === 'dark' ? 'hsl(225 18% 20%)' : 'hsl(220 18% 90%)');

    // 5. Font Size
    const fontScaleMap: Record<string, string> = {
      Small: '14px',
      Normal: '16px',
      Large: '18px',
      'Extra Large': '20px',
    };
    root.style.fontSize = fontScaleMap[appearance.fontSize] || '16px';

    // 6. UI Scale
    const scaleMap: Record<string, string> = {
      '90%': '0.9',
      '100%': '1',
      '110%': '1.1',
      '125%': '1.25',
    };
    root.style.setProperty('--app-scale', scaleMap[appearance.uiScale] || '1');

    // 7. Motion & Animations
    if (appearance.reduceMotion || appearance.animationLevel === 'Off' || isBatterySaver) {
      root.classList.add('reduce-motion');
      root.style.setProperty('--animation-duration', '0.01ms');
    } else {
      root.classList.remove('reduce-motion');
      root.style.setProperty('--animation-duration', '200ms');
    }

    // 8. Meta Theme Color (matches active theme's header surface color)
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        resolvedTheme === 'dark' ? '#191c24' : '#ffffff'
      );
    }
  }, [resolvedTheme, appearance]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    safeLocalStorage.setItem(APP_CONFIG.storageKeys.theme, newTheme);
  };

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const updateAppearance = useCallback(
    (partial: Partial<AppearanceSettings>) => {
      setAppearanceState((prev) => {
        const next = { ...prev, ...partial };
        safeLocalStorage.setItem(STORAGE_KEY_APPEARANCE, JSON.stringify(next));

        // Save to Firebase asynchronously
        const currentUser = auth.currentUser;
        if (currentUser?.uid) {
          const userDocRef = doc(db, 'users', currentUser.uid, 'settings', 'appearance');
          setDoc(userDocRef, next, { merge: true }).catch(() => {});
        }

        return next;
      });
    },
    []
  );

  const applyPreset = useCallback(
    (preset: UiPreset) => {
      let nextPresetSettings: Partial<AppearanceSettings> = { uiPreset: preset };

      switch (preset) {
        case 'Minimal':
          nextPresetSettings = {
            uiPreset: preset,
            shadowIntensity: 'Off',
            radiusPreset: 'Medium',
            animationLevel: 'Low',
            cardDensity: 'Compact',
            backgroundStyle: 'Solid',
          };
          break;
        case 'Material 3':
          nextPresetSettings = {
            uiPreset: preset,
            shadowIntensity: 'Soft',
            radiusPreset: 'Extra Large',
            animationLevel: 'Normal',
            cardDensity: 'Comfortable',
            backgroundStyle: 'Solid',
          };
          break;
        case 'Modern Flat':
          nextPresetSettings = {
            uiPreset: preset,
            shadowIntensity: 'Off',
            radiusPreset: 'Small',
            animationLevel: 'Normal',
            cardDensity: 'Comfortable',
            backgroundStyle: 'Solid',
          };
          break;
        case 'Professional':
          nextPresetSettings = {
            uiPreset: preset,
            shadowIntensity: 'Soft',
            radiusPreset: 'Medium',
            animationLevel: 'Normal',
            cardDensity: 'Comfortable',
            backgroundStyle: 'Solid',
            accentColor: 'Blue',
          };
          break;
        case 'High Contrast':
          nextPresetSettings = {
            uiPreset: preset,
            shadowIntensity: 'Strong',
            radiusPreset: 'Medium',
            animationLevel: 'Low',
            cardDensity: 'Comfortable',
            backgroundStyle: 'Solid',
          };
          break;
        default:
          nextPresetSettings = {
            uiPreset: 'Material 3',
            shadowIntensity: 'Soft',
            radiusPreset: 'Extra Large',
            cardDensity: 'Comfortable',
            backgroundStyle: 'Solid',
          };
          break;
      }

      updateAppearance(nextPresetSettings);
    },
    [updateAppearance]
  );

  const resetAppearance = useCallback(() => {
    setAppearanceState(DEFAULT_APPEARANCE_SETTINGS);
    safeLocalStorage.setItem(STORAGE_KEY_APPEARANCE, JSON.stringify(DEFAULT_APPEARANCE_SETTINGS));

    const currentUser = auth.currentUser;
    if (currentUser?.uid) {
      const userDocRef = doc(db, 'users', currentUser.uid, 'settings', 'appearance');
      setDoc(userDocRef, DEFAULT_APPEARANCE_SETTINGS).catch(() => {});
    }
  }, []);

  const saveAsAdminDefault = useCallback(async () => {
    try {
      const configRef = doc(db, 'app_config', 'default_appearance');
      await setDoc(configRef, appearance, { merge: true });
    } catch {
      // Offline fallback
    }
  }, [appearance]);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
      appearance,
      updateAppearance,
      applyPreset,
      resetAppearance,
      saveAsAdminDefault,
    }),
    [
      theme,
      resolvedTheme,
      appearance,
      updateAppearance,
      applyPreset,
      resetAppearance,
      saveAsAdminDefault,
    ]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
