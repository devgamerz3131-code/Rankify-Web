import { useState, useEffect } from 'react';

type ProfileSubTab = 'overview' | 'reports' | 'settings' | 'appearance' | 'admin';
type SettingsSubTab = 'general' | 'appearance' | 'backup';

interface TourReadOnlySnapshot {
  isActive: boolean;
  currentStepId: string | null;
}

let currentSnapshot: TourReadOnlySnapshot = {
  isActive: false,
  currentStepId: null,
};

let pendingProfileReturnTab: ProfileSubTab | null = null;
let pendingSettingsReturnSubTab: SettingsSubTab | null = null;

const listeners = new Set<(snapshot: TourReadOnlySnapshot) => void>();

function emitChange(): void {
  listeners.forEach((listener) => {
    try {
      listener(currentSnapshot);
    } catch {
      // Ignore listener errors
    }
  });
}

/**
 * Synchronous check for whether the guided tour is currently open (read-only mode).
 * While true, screens and services must not write progress, start timers/audio, or make AI requests.
 */
export function isTourActive(): boolean {
  return currentSnapshot.isActive;
}

export function getTourCurrentStepId(): string | null {
  return currentSnapshot.currentStepId;
}

export function setTourActiveState(isActive: boolean, currentStepId: string | null = null): void {
  const nextStepId = isActive ? currentStepId : null;
  if (
    currentSnapshot.isActive === isActive &&
    currentSnapshot.currentStepId === nextStepId
  ) {
    return;
  }
  currentSnapshot = {
    isActive,
    currentStepId: nextStepId,
  };
  emitChange();
}

export function subscribeTourActiveState(
  listener: (snapshot: TourReadOnlySnapshot) => void
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * React hook returning true while the guided tour is open.
 */
export function useIsTourActive(): boolean {
  const [active, setActive] = useState<boolean>(() => currentSnapshot.isActive);

  useEffect(() => {
    setActive(currentSnapshot.isActive);
    return subscribeTourActiveState((snap) => {
      setActive(snap.isActive);
    });
  }, []);

  return active;
}

/**
 * React hook returning both whether the tour is active and the current step ID.
 */
export function useTourActiveSnapshot(): TourReadOnlySnapshot {
  const [snap, setSnap] = useState<TourReadOnlySnapshot>(() => currentSnapshot);

  useEffect(() => {
    setSnap(currentSnapshot);
    return subscribeTourActiveState((nextSnap) => {
      setSnap(nextSnap);
    });
  }, []);

  return snap;
}

export function setPendingProfileReturnTab(tab: ProfileSubTab | null): void {
  pendingProfileReturnTab = tab;
}

export function consumePendingProfileReturnTab(): ProfileSubTab | null {
  const tab = pendingProfileReturnTab;
  pendingProfileReturnTab = null;
  return tab;
}

export function setPendingSettingsReturnSubTab(tab: SettingsSubTab | null): void {
  pendingSettingsReturnSubTab = tab;
}

export function consumePendingSettingsReturnSubTab(): SettingsSubTab | null {
  const tab = pendingSettingsReturnSubTab;
  pendingSettingsReturnSubTab = null;
  return tab;
}

export type TourControllableScreen =
  | 'aiChat'
  | 'mistakes'
  | 'profile'
  | 'profileSettings'
  | 'appearanceLab';

export interface TourViewController {
  getTab: () => string;
  setTab: (tab: string) => void;
  /**
   * Optional check returning true on desktop layouts where the requested panel
   * is already persistently visible without switching the center tab.
   */
  isDesktopAlwaysVisible?: (tab: string) => boolean;
}

const viewControllers = new Map<TourControllableScreen, TourViewController>();
const savedInitialViewTabs = new Map<TourControllableScreen, string>();

/**
 * Registers a screen's UI-only tab controller so the guided tour can switch
 * tabs for demonstration and restore the original tab when the tour ends.
 */
export function registerTourViewController(
  screen: TourControllableScreen,
  controller: TourViewController
): () => void {
  viewControllers.set(screen, controller);
  if (currentSnapshot.isActive && !savedInitialViewTabs.has(screen)) {
    try {
      savedInitialViewTabs.set(screen, controller.getTab());
    } catch {
      // Ignore getter errors
    }
  }
  return () => {
    if (viewControllers.get(screen) === controller) {
      viewControllers.delete(screen);
    }
  };
}

/**
 * Requests a UI-only tab switch on a registered screen.
 * Returns true if a tab change was triggered, or false if already on that tab / visible on desktop.
 */
export function requestTourViewTab(screen: TourControllableScreen, tab: string): boolean {
  // If targeting Settings sub-tabs or Appearance Lab, ensure Profile is on the 'settings' tab first
  if (screen === 'profileSettings' || screen === 'appearanceLab') {
    const profileSwitched = requestTourViewTab('profile', 'settings');
    const targetSubTab = screen === 'appearanceLab' ? 'appearance' : tab;
    const settingsController = viewControllers.get('profileSettings');
    if (!settingsController) {
      return profileSwitched;
    }
    try {
      if (!savedInitialViewTabs.has('profileSettings')) {
        savedInitialViewTabs.set('profileSettings', settingsController.getTab());
      }
      if (settingsController.getTab() !== targetSubTab) {
        settingsController.setTab(targetSubTab);
        return true;
      }
      return profileSwitched;
    } catch {
      return profileSwitched;
    }
  }

  const controller = viewControllers.get(screen);
  if (!controller) return false;

  try {
    if (!savedInitialViewTabs.has(screen)) {
      savedInitialViewTabs.set(screen, controller.getTab());
    }
    if (controller.isDesktopAlwaysVisible && controller.isDesktopAlwaysVisible(tab)) {
      return false;
    }
    const currentTab = controller.getTab();
    if (currentTab === tab) {
      return false;
    }
    controller.setTab(tab);
    return true;
  } catch {
    return false;
  }
}

/**
 * Restores all tour-modified screen tabs to their original values.
 */
export function restoreAllTourViewTabs(): void {
  // Restore child sub-tabs before parent tabs
  const order: TourControllableScreen[] = [
    'profileSettings',
    'appearanceLab',
    'profile',
    'aiChat',
    'mistakes',
  ];
  for (const screen of order) {
    const initialTab = savedInitialViewTabs.get(screen);
    if (initialTab !== undefined) {
      const controller = viewControllers.get(screen);
      if (controller) {
        try {
          if (controller.getTab() !== initialTab) {
            controller.setTab(initialTab);
          }
        } catch {
          // Ignore restore errors
        }
      }
    }
  }
  savedInitialViewTabs.clear();
}


