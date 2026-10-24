import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/hooks/use-auth';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { NavRoute } from '@/types/navigation';
import { useBackHandler } from '@/hooks/use-back-handler';
import { mistakeService } from '@/services/mistake-service';
import { ncertService } from '@/services/ncert-service';
import {
  CURRENT_TUTORIAL_VERSION,
  getTourSteps,
  TOURS_BY_ID,
  TOPIC_TOUR_ORDER,
  TourId,
  TourRuntimeContext,
  TourStepConfig,
  TourStatus,
  TourUserVariant,
  TutorialStateRecord,
  TourViewStateRequest,
  PointerVerb,
} from './tourSteps';
import {
  setTourActiveState,
  requestTourViewTab,
  restoreAllTourViewTabs,
} from './tourReadOnlyGate';

const LOCAL_STORAGE_PREFIX = 'rankify_tutorial_state_v1_';
const RETURNING_USER_INACTIVE_DAYS = 14;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface TourContextValue {
  isOpen: boolean;
  isTopicMenuOpen: boolean;
  activeTourId: TourId;
  currentStepIndex: number;
  totalSteps: number;
  currentStep: TourStepConfig | null;
  runtimeContext: TourRuntimeContext;
  targetRect: DOMRect | null;
  isWaitingForTarget: boolean;
  canSkipSection: boolean;
  setOverlayMounted: (mounted: boolean) => void;
  startTour: (tourId?: TourId, variant?: TourUserVariant, isReplay?: boolean) => void;
  selectTourFromMenu: (tourId: TourId) => void;
  openTopicMenu: () => void;
  replayTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  skipSection: () => void;
  finishTour: () => void;
}

const TourContext = createContext<TourContextValue | undefined>(undefined);

function getLocalTutorialKey(uid?: string | null): string {
  return `${LOCAL_STORAGE_PREFIX}${uid || 'guest'}`;
}

function readLocalTutorialState(uid?: string | null): TutorialStateRecord | null {
  try {
    const raw = localStorage.getItem(getLocalTutorialKey(uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<TutorialStateRecord>;
    if (!parsed || typeof parsed.status !== 'string') return null;
    return {
      status: parsed.status as TourStatus,
      version: typeof parsed.version === 'number' ? parsed.version : 0,
      lastStepIndex: typeof parsed.lastStepIndex === 'number' ? parsed.lastStepIndex : 0,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
      lastShownAt: typeof parsed.lastShownAt === 'string' ? parsed.lastShownAt : undefined,
    };
  } catch {
    return null;
  }
}

function writeLocalTutorialState(uid: string | null | undefined, record: TutorialStateRecord): void {
  try {
    localStorage.setItem(getLocalTutorialKey(uid), JSON.stringify(record));
  } catch {
    // Ignore storage quota errors
  }
}

function detectPointerVerb(): PointerVerb {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'tap';
  }
  try {
    if (window.matchMedia('(pointer: coarse)').matches) {
      return 'tap';
    }
    if (window.matchMedia('(pointer: fine)').matches) {
      return 'click';
    }
  } catch {
    // Ignore matchMedia errors
  }
  return 'tap';
}

function applyStepViewState(viewState?: TourViewStateRequest): void {
  if (!viewState) return;
  if (viewState.screen === 'appearanceLab') {
    requestTourViewTab('appearanceLab', 'appearance');
    return;
  }
  if (viewState.screen === 'profile') {
    if (viewState.tab) {
      requestTourViewTab('profile', viewState.tab);
    }
    if (viewState.subTab) {
      requestTourViewTab('profileSettings', viewState.subTab);
    }
    return;
  }
  if (viewState.tab) {
    requestTourViewTab(viewState.screen, viewState.tab);
  }
}

/**
 * Finds the first visible element matching selector (supports comma-separated selectors).
 */
function findVisibleElement(selector?: string | null): HTMLElement | null {
  if (!selector || typeof document === 'undefined') return null;
  try {
    const nodes = document.querySelectorAll<HTMLElement>(selector);
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
        continue;
      }
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return el;
      }
    }
  } catch {
    // Ignore invalid selector
  }
  return null;
}

function isRectFullyInViewport(rect: DOMRect): boolean {
  const vw = window.innerWidth || document.documentElement.clientWidth;
  const vh = window.innerHeight || document.documentElement.clientHeight;
  return rect.top >= 12 && rect.left >= 0 && rect.bottom <= vh - 12 && rect.right <= vw;
}

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();
  const { chapterProgressMap, aiStudyPlan } = useOnboarding();
  const { activeTab, setActiveTab } = useNavigation();

  const [isOpen, setIsOpen] = useState(false);
  const [isTopicMenuOpen, setIsTopicMenuOpen] = useState(false);
  const [, setOverlayMounted] = useState(false);
  const [activeTourId, setActiveTourId] = useState<TourId>('quick');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [variant, setVariant] = useState<TourUserVariant>('new_user');
  const [pointerVerb, setPointerVerb] = useState<PointerVerb>(() => detectPointerVerb());
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isWaitingForTarget, setIsWaitingForTarget] = useState(false);

  const isReplaySessionRef = useRef(false);
  const firstRunQuickCompletedRef = useRef(false);
  const hasEvaluatedStartupRef = useRef<string | null>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);
  const activeStepTimerRef = useRef<number | null>(null);
  const stepTransitionDirectionRef = useRef<'forward' | 'backward'>('forward');

  // Return-to-origin state (route + window scrollY)
  const originRouteRef = useRef<NavRoute>('home');
  const originScrollYRef = useRef<number>(0);
  const activeTabRef = useRef<NavRoute>(activeTab);
  activeTabRef.current = activeTab;

  const currentTourSteps = useMemo(() => getTourSteps(activeTourId), [activeTourId]);

  // Listen for pointer type changes (touch vs mouse)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const coarseMql = window.matchMedia('(pointer: coarse)');
    const fineMql = window.matchMedia('(pointer: fine)');
    const updateVerb = () => setPointerVerb(detectPointerVerb());
    updateVerb();
    coarseMql.addEventListener?.('change', updateVerb);
    fineMql.addEventListener?.('change', updateVerb);
    return () => {
      coarseMql.removeEventListener?.('change', updateVerb);
      fineMql.removeEventListener?.('change', updateVerb);
    };
  }, []);

  // Build live runtime context for state-dependent step copy
  const runtimeContext = useMemo<TourRuntimeContext>(() => {
    const mistakes = mistakeService.getMistakes();
    const dailyTasks = aiStudyPlan?.dailyTasks || [];
    const hasTasksToday = dailyTasks.length > 0;
    const completedAllTasksToday = hasTasksToday && dailyTasks.every((t) => t.isCompleted);

    const chaptersList = Object.values(chapterProgressMap || {});
    const visibleStudyCards =
      typeof document !== 'undefined'
        ? document.querySelectorAll('[data-tour="study-card"]').length
        : 0;
    const hasVisibleStudyChapters =
      activeTab === 'study' ? visibleStudyCards > 0 : chaptersList.length > 0;
    const hasStudyProgress = chaptersList.some((ch) => (ch.progressPercentage || 0) > 0);

    const ncertState = ncertService.getCachedState();
    const hasNcertReadProgress = Object.values(ncertState?.progressMap || {}).some(
      (p) => Boolean(p?.lastReadParagraphId) || (p?.completionPercent || 0) > 0
    );

    const hasChatMessages =
      typeof document !== 'undefined' &&
      document.querySelectorAll('[data-tour="ai-response-card"]').length > 0;

    const hasWeaknessData = chaptersList.length > 0 || mistakes.length > 0;

    return {
      variant,
      pointerVerb,
      hasMistakes: mistakes.length > 0,
      hasTasksToday,
      completedAllTasksToday,
      hasVisibleStudyChapters,
      hasStudyProgress,
      hasNcertReadProgress,
      hasChatMessages,
      hasWeaknessData,
    };
  }, [
    variant,
    pointerVerb,
    aiStudyPlan?.dailyTasks,
    chapterProgressMap,
    activeTab,
    isOpen,
    currentStepIndex,
  ]);

  /**
   * Writes tutorial state to localStorage immediately and syncs to Firestore users/{uid}.tutorial
   * (plus lastActiveAt). Never blocks UI or throws.
   */
  const persistTutorialState = useCallback(
    async (
      nextStatus: TourStatus,
      stepIndex: number,
      options?: { isReplayOnly?: boolean; markShown?: boolean }
    ) => {
      const uid = user?.uid ?? null;
      const nowIso = new Date().toISOString();
      const existingLocal = readLocalTutorialState(uid);

      let record: TutorialStateRecord;
      if (options?.isReplayOnly && existingLocal) {
        record = {
          ...existingLocal,
          lastShownAt: nowIso,
          updatedAt: nowIso,
        };
      } else {
        record = {
          status: nextStatus,
          version: CURRENT_TUTORIAL_VERSION,
          lastStepIndex: stepIndex,
          updatedAt: nowIso,
          lastShownAt: options?.markShown ? nowIso : existingLocal?.lastShownAt || nowIso,
        };
      }

      writeLocalTutorialState(uid, record);

      if (uid) {
        try {
          const userRef = doc(db, 'users', uid);
          await setDoc(
            userRef,
            {
              tutorial: record,
              lastActiveAt: nowIso,
            },
            { merge: true }
          );
        } catch {
          // Offline or permission error — localStorage fallback is already saved
        }
      }
    },
    [user?.uid]
  );

  // Sync read-only tour flag with current tour state
  useEffect(() => {
    const stepId = isTopicMenuOpen
      ? 'topic-menu'
      : currentTourSteps[currentStepIndex]?.id ?? null;
    setTourActiveState(isOpen, isOpen ? stepId : null);
    return () => {
      if (!isOpen) {
        setTourActiveState(false, null);
      }
    };
  }, [isOpen, isTopicMenuOpen, currentStepIndex, currentTourSteps]);

  const restoreFocusAndClose = useCallback(() => {
    if (activeStepTimerRef.current !== null) {
      window.clearTimeout(activeStepTimerRef.current);
      activeStepTimerRef.current = null;
    }

    // Turn off read-only gate immediately upon closing
    setTourActiveState(false, null);
    setIsOpen(false);
    setIsTopicMenuOpen(false);
    setTargetRect(null);
    setIsWaitingForTarget(false);

    // Restore any tour-modified view state (AI Chat tab, Mistakes tab, Profile/Settings/Appearance tabs)
    restoreAllTourViewTabs();

    // Return to origin route and restore scroll position on every exit path
    const returnRoute = originRouteRef.current || 'home';
    const returnScrollY = originScrollYRef.current || 0;

    if (activeTabRef.current !== returnRoute) {
      setActiveTab(returnRoute);
    }

    window.setTimeout(() => {
      try {
        window.scrollTo({ top: returnScrollY, behavior: 'auto' });
      } catch {
        window.scrollTo(0, returnScrollY);
      }

      const el = triggerElementRef.current;
      if (el && typeof el.focus === 'function' && document.body.contains(el)) {
        try {
          el.focus({ preventScroll: true });
        } catch {
          // Ignore focus errors
        }
      }
    }, 60);
  }, [setActiveTab]);

  const captureOriginIfStarting = useCallback(
    (defaultOriginRoute?: NavRoute) => {
      if (!isOpen) {
        if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
          triggerElementRef.current = document.activeElement;
        }
        originRouteRef.current = defaultOriginRoute || activeTabRef.current || 'home';
        originScrollYRef.current = typeof window !== 'undefined' ? window.scrollY || 0 : 0;
      }
    },
    [isOpen]
  );

  const startTour = useCallback(
    (
      tourId: TourId = 'quick',
      tourVariant: TourUserVariant = 'new_user',
      isReplay = false
    ) => {
      captureOriginIfStarting(isReplay ? activeTabRef.current || 'home' : 'home');

      isReplaySessionRef.current = isReplay;
      if (!isReplay && tourId === 'quick') {
        firstRunQuickCompletedRef.current = false;
      }
      stepTransitionDirectionRef.current = 'forward';

      const steps = getTourSteps(tourId);
      const firstStepId = steps[0]?.id ?? 'welcome';

      // Enable read-only mode BEFORE navigating or opening steps
      setTourActiveState(true, firstStepId);

      setVariant(tourVariant);
      setActiveTourId(tourId);
      setIsTopicMenuOpen(false);
      setCurrentStepIndex(0);
      setIsOpen(true);

      if (isReplay) {
        void persistTutorialState('completed', 0, { isReplayOnly: true, markShown: true });
      } else {
        void persistTutorialState('in_progress', 0, { markShown: true });
      }
    },
    [captureOriginIfStarting, persistTutorialState]
  );

  /**
   * Opens the Topic Menu inside the tour card.
   * Used when:
   * - User taps "Replay tutorial" in Settings
   * - User taps "More topics" at the end of a topic tour or full tour
   */
  const openTopicMenu = useCallback(() => {
    captureOriginIfStarting(activeTabRef.current || 'home');
    setTourActiveState(true, 'topic-menu');
    setIsTopicMenuOpen(true);
    setTargetRect(null);
    setIsWaitingForTarget(false);
    setIsOpen(true);
  }, [captureOriginIfStarting]);

  /**
   * Triggered when user clicks "Replay tutorial" in Settings.
   * Opens the Topic Menu instead of starting directly.
   */
  const replayTour = useCallback(() => {
    isReplaySessionRef.current = true;
    openTopicMenu();
    void persistTutorialState('completed', 0, { isReplayOnly: true, markShown: true });
  }, [openTopicMenu, persistTutorialState]);

  /**
   * Starts a specific tour selected from the Topic Menu (either from Replay menu,
   * from the Finish step of Quick tour, or from "More topics" at the end of a topic tour).
   */
  const selectTourFromMenu = useCallback(
    (tourId: TourId) => {
      // If the user reached the Finish step of the first-run quick tour and picked a topic,
      // mark the first-run quick tour completed first, then treat topic exploration as replay.
      if (!isReplaySessionRef.current && !firstRunQuickCompletedRef.current) {
        firstRunQuickCompletedRef.current = true;
        void persistTutorialState('completed', QUICK_TOUR_STEPS_LEN - 1, { markShown: true });
      }
      isReplaySessionRef.current = true;
      stepTransitionDirectionRef.current = 'forward';

      const steps = getTourSteps(tourId);
      const firstStepId = steps[0]?.id ?? 'welcome';
      setTourActiveState(true, firstStepId);

      setActiveTourId(tourId);
      setIsTopicMenuOpen(false);
      setCurrentStepIndex(0);
      setIsOpen(true);
      void persistTutorialState('completed', 0, { isReplayOnly: true, markShown: true });
    },
    [persistTutorialState]
  );

  const skipTour = useCallback(() => {
    if (!isReplaySessionRef.current && !firstRunQuickCompletedRef.current) {
      void persistTutorialState('skipped', currentStepIndex);
    } else {
      void persistTutorialState('completed', currentStepIndex, {
        isReplayOnly: true,
        markShown: true,
      });
    }
    restoreFocusAndClose();
  }, [currentStepIndex, persistTutorialState, restoreFocusAndClose]);

  const finishTour = useCallback(() => {
    if (!isReplaySessionRef.current && !firstRunQuickCompletedRef.current) {
      firstRunQuickCompletedRef.current = true;
      void persistTutorialState('completed', currentTourSteps.length - 1);
    } else {
      void persistTutorialState('completed', currentTourSteps.length - 1, {
        isReplayOnly: true,
        markShown: true,
      });
    }
    restoreFocusAndClose();
  }, [currentTourSteps.length, persistTutorialState, restoreFocusAndClose]);

  const nextStep = useCallback(() => {
    stepTransitionDirectionRef.current = 'forward';
    if (currentStepIndex >= currentTourSteps.length - 1) {
      finishTour();
      return;
    }
    const nextIdx = currentStepIndex + 1;
    setCurrentStepIndex(nextIdx);
    if (!isReplaySessionRef.current && !firstRunQuickCompletedRef.current) {
      void persistTutorialState('in_progress', nextIdx);
    }
  }, [currentStepIndex, currentTourSteps.length, finishTour, persistTutorialState]);

  const prevStep = useCallback(() => {
    stepTransitionDirectionRef.current = 'backward';
    if (currentStepIndex <= 0) return;
    const prevIdx = currentStepIndex - 1;
    setCurrentStepIndex(prevIdx);
    if (!isReplaySessionRef.current && !firstRunQuickCompletedRef.current) {
      void persistTutorialState('in_progress', prevIdx);
    }
  }, [currentStepIndex, persistTutorialState]);

  /**
   * "Skip section" — shown ONLY inside the "full" tour.
   * Jumps to the first step of the next section (or finishes when on the last section).
   */
  const skipSection = useCallback(() => {
    if (activeTourId !== 'full') return;
    stepTransitionDirectionRef.current = 'forward';
    const currentSection = currentTourSteps[currentStepIndex]?.section;
    if (!currentSection) return;

    let targetIndex = -1;
    for (let i = currentStepIndex + 1; i < currentTourSteps.length; i++) {
      if (currentTourSteps[i].section !== currentSection) {
        targetIndex = i;
        break;
      }
    }

    if (targetIndex === -1) {
      finishTour();
      return;
    }

    setCurrentStepIndex(targetIndex);
  }, [activeTourId, currentStepIndex, currentTourSteps, finishTour]);

  // Android / browser hardware back button handler while tour is open
  useBackHandler(
    isOpen,
    () => {
      if (isTopicMenuOpen) {
        skipTour();
        return 'close';
      }
      if (currentStepIndex > 0) {
        prevStep();
        return 'stay';
      }
      skipTour();
      return 'close';
    },
    'rankify-tour-overlay'
  );

  // Automatic first-time / returning-user / version-bump detection on startup
  useEffect(() => {
    const isOnboardingCompleted =
      Boolean(user?.onboardingCompleted) ||
      (typeof localStorage !== 'undefined' &&
        localStorage.getItem('onboarding_completed') === 'true');
    if (authLoading || !isOnboardingCompleted) return;

    const uid = user?.uid ?? 'guest';
    if (hasEvaluatedStartupRef.current === uid) return;
    hasEvaluatedStartupRef.current = uid;

    let isCancelled = false;

    const evaluateTourTrigger = async () => {
      const localRecord = readLocalTutorialState(user?.uid);
      let effectiveRecord: TutorialStateRecord | null = localRecord;
      let lastActiveAtIso: string | null = null;

      if (user?.uid) {
        try {
          const userSnap = await getDoc(doc(db, 'users', user.uid));
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (typeof data?.lastActiveAt === 'string') {
              lastActiveAtIso = data.lastActiveAt;
            }
            const remoteTutorial = data?.tutorial as Partial<TutorialStateRecord> | undefined;
            if (remoteTutorial && typeof remoteTutorial.status === 'string') {
              effectiveRecord = {
                status: remoteTutorial.status as TourStatus,
                version:
                  typeof remoteTutorial.version === 'number' ? remoteTutorial.version : 0,
                lastStepIndex:
                  typeof remoteTutorial.lastStepIndex === 'number'
                    ? remoteTutorial.lastStepIndex
                    : 0,
                updatedAt:
                  typeof remoteTutorial.updatedAt === 'string'
                    ? remoteTutorial.updatedAt
                    : new Date().toISOString(),
                lastShownAt:
                  typeof remoteTutorial.lastShownAt === 'string'
                    ? remoteTutorial.lastShownAt
                    : undefined,
              };
              writeLocalTutorialState(user.uid, effectiveRecord);
            }
          }
        } catch {
          // Use local record if offline
        }
      }

      if (isCancelled) return;

      const now = Date.now();
      const nowIso = new Date(now).toISOString();

      // Update lastActiveAt on session start for signed-in users
      if (user?.uid) {
        try {
          await setDoc(doc(db, 'users', user.uid), { lastActiveAt: nowIso }, { merge: true });
        } catch {
          // Ignore offline error
        }
      }

      // Check returning user inactivity (> 14 days since lastActiveAt or updatedAt)
      const referenceTimestamp = lastActiveAtIso || effectiveRecord?.updatedAt || null;
      const isReturningAfterLongBreak =
        referenceTimestamp !== null &&
        !Number.isNaN(Date.parse(referenceTimestamp)) &&
        now - Date.parse(referenceTimestamp) >= RETURNING_USER_INACTIVE_DAYS * MS_PER_DAY;

      // Case 1: Never started, still in_progress, or tutorial version bumped
      if (
        !effectiveRecord ||
        effectiveRecord.status === 'not_started' ||
        effectiveRecord.status === 'in_progress' ||
        effectiveRecord.version < CURRENT_TUTORIAL_VERSION
      ) {
        const chosenVariant: TourUserVariant = isReturningAfterLongBreak
          ? 'returning_user'
          : 'new_user';
        startTour('quick', chosenVariant, false);
        return;
      }

      // Case 2: Completed or skipped previously, but returning after >= 14 days inactive
      if (isReturningAfterLongBreak) {
        const lastShownMs = effectiveRecord.lastShownAt
          ? Date.parse(effectiveRecord.lastShownAt)
          : 0;
        if (!lastShownMs || now - lastShownMs >= RETURNING_USER_INACTIVE_DAYS * MS_PER_DAY) {
          startTour('quick', 'returning_user', true);
        }
      }
    };

    void evaluateTourTrigger();

    return () => {
      isCancelled = true;
    };
  }, [authLoading, user?.onboardingCompleted, user?.uid, startTour]);

  // Step target resolution, route navigation, view-state switching, scroll into view, and 3000ms fallback
  useEffect(() => {
    if (!isOpen || isTopicMenuOpen) {
      setTargetRect(null);
      setIsWaitingForTarget(false);
      return;
    }

    const step = currentTourSteps[currentStepIndex];
    if (!step) return;

    if (activeStepTimerRef.current !== null) {
      window.clearTimeout(activeStepTimerRef.current);
      activeStepTimerRef.current = null;
    }

    // Navigate to the step's route if needed
    const isRouteChanging = Boolean(step.route && step.route !== activeTab);
    if (step.route && step.route !== activeTab) {
      setActiveTab(step.route);
    }

    // Apply UI-only view state if requested by this step
    if (step.viewState) {
      applyStepViewState(step.viewState);
    }

    // Centered steps without a target selector need no DOM lookup
    if (!step.targetSelector) {
      setTargetRect(null);
      setIsWaitingForTarget(false);
      return;
    }

    setIsWaitingForTarget(true);
    const startTime = performance.now();
    const maxWaitMs = 3000;
    const minOptionalWaitMs = isRouteChanging || Boolean(step.viewState) ? 450 : 250;
    let hasScrolledToElement = false;
    let cancelled = false;

    const pollForTarget = () => {
      if (cancelled) return;

      // Re-apply viewState during polling in case the target screen just mounted after a route change
      if (step.viewState) {
        applyStepViewState(step.viewState);
      }

      const el = findVisibleElement(step.targetSelector);
      const elapsed = performance.now() - startTime;

      if (el) {
        const rect = el.getBoundingClientRect();
        if (!hasScrolledToElement && !isRectFullyInViewport(rect)) {
          hasScrolledToElement = true;
          try {
            el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
          } catch {
            el.scrollIntoView();
          }
          activeStepTimerRef.current = window.setTimeout(pollForTarget, 260);
          return;
        }

        const updatedRect = el.getBoundingClientRect();
        setTargetRect(updatedRect);
        setIsWaitingForTarget(false);
        return;
      }

      // If optional step and target isn't present after brief settle, skip silently
      if (step.optional && elapsed >= minOptionalWaitMs) {
        setIsWaitingForTarget(false);
        setTargetRect(null);
        const dir = stepTransitionDirectionRef.current;
        if (dir === 'backward' && currentStepIndex > 0) {
          setCurrentStepIndex((idx) => Math.max(0, idx - 1));
        } else if (currentStepIndex < currentTourSteps.length - 1) {
          setCurrentStepIndex((idx) => Math.min(currentTourSteps.length - 1, idx + 1));
        }
        return;
      }

      // If emptyStateFallbackToCenter is true and screen has settled, show centered card cleanly
      if (step.emptyStateFallbackToCenter && elapsed >= minOptionalWaitMs) {
        setTargetRect(null);
        setIsWaitingForTarget(false);
        return;
      }

      if (elapsed < maxWaitMs) {
        activeStepTimerRef.current = window.setTimeout(pollForTarget, 90);
      } else {
        // Fallback: after 3000ms, show centered card without crashing
        setTargetRect(null);
        setIsWaitingForTarget(false);
      }
    };

    activeStepTimerRef.current = window.setTimeout(
      pollForTarget,
      isRouteChanging || Boolean(step.viewState) ? 140 : 40
    );

    return () => {
      cancelled = true;
      if (activeStepTimerRef.current !== null) {
        window.clearTimeout(activeStepTimerRef.current);
        activeStepTimerRef.current = null;
      }
    };
  }, [isOpen, isTopicMenuOpen, currentStepIndex, currentTourSteps, activeTab, setActiveTab]);

  // Reposition spotlight on window resize, orientationchange, or scroll while open
  useEffect(() => {
    if (!isOpen || isTopicMenuOpen || isWaitingForTarget) return;
    const step = currentTourSteps[currentStepIndex];
    if (!step?.targetSelector) return;

    let rafId: number | null = null;
    const updateRect = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const el = findVisibleElement(step.targetSelector);
        if (el) {
          setTargetRect(el.getBoundingClientRect());
        } else {
          setTargetRect(null);
        }
      });
    };

    window.addEventListener('resize', updateRect, { passive: true });
    window.addEventListener('orientationchange', updateRect, { passive: true });
    window.addEventListener('scroll', updateRect, { passive: true, capture: true });

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('orientationchange', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [isOpen, isTopicMenuOpen, isWaitingForTarget, currentStepIndex, currentTourSteps]);

  // Dev-only console helper (only in DEV builds, tree-shaken from production)
  useEffect(() => {
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      const countWords = (text: string) =>
        text
          .trim()
          .split(/\s+/)
          .filter(Boolean).length;

      const allTourIds: TourId[] = ['quick', 'full', ...TOPIC_TOUR_ORDER];

      (window as unknown as Record<string, unknown>).__rankifyTour = {
        start: (tourId: TourId = 'quick', v: TourUserVariant = 'new_user') =>
          startTour(tourId, v, false),
        replay: () => replayTour(),
        skip: () => skipTour(),
        skipSection: () => skipSection(),
        goto: (tourOrStepId: string, maybeStepId?: string) => {
          let targetTourId: TourId = activeTourId;
          let targetStepId = tourOrStepId;

          if (maybeStepId !== undefined) {
            if (tourOrStepId in TOURS_BY_ID) {
              targetTourId = tourOrStepId as TourId;
            }
            targetStepId = maybeStepId;
          } else if (!(tourOrStepId in TOURS_BY_ID)) {
            const inActive = getTourSteps(activeTourId).findIndex((s) => s.id === tourOrStepId);
            if (inActive === -1) {
              for (const tid of allTourIds) {
                if (getTourSteps(tid).some((s) => s.id === tourOrStepId)) {
                  targetTourId = tid;
                  break;
                }
              }
            }
          }

          const steps = getTourSteps(targetTourId);
          const idx = steps.findIndex(
            (s, i) => s.id === targetStepId || String(i) === String(targetStepId)
          );
          if (idx === -1) {
            console.warn(
              `[RankifyTour] Step "${targetStepId}" not found in tour "${targetTourId}". Call __rankifyTour.listSteps() to view available tours and step IDs.`
            );
            return false;
          }
          captureOriginIfStarting(activeTabRef.current || 'home');
          isReplaySessionRef.current = true;
          setTourActiveState(true, steps[idx].id);
          setActiveTourId(targetTourId);
          setIsTopicMenuOpen(false);
          setIsOpen(true);
          stepTransitionDirectionRef.current = 'forward';
          setCurrentStepIndex(idx);
          return true;
        },
        listSteps: () => {
          const summaryRows = allTourIds.map((tid) => {
            const steps = getTourSteps(tid);
            const totalWords = steps.reduce((sum, step) => {
              const desc = step.getDescription(runtimeContext);
              return sum + countWords(desc);
            }, 0);
            const maxWords = steps.reduce((max, step) => {
              const w = countWords(step.getDescription(runtimeContext));
              return Math.max(max, w);
            }, 0);
            return {
              tourId: tid,
              stepCount: steps.length,
              totalWords,
              maxStepWords: maxWords,
            };
          });
          console.table(summaryRows);
          return summaryRows;
        },
      };
    }
  }, [
    activeTourId,
    captureOriginIfStarting,
    replayTour,
    runtimeContext,
    skipSection,
    skipTour,
    startTour,
  ]);

  const currentStep = isTopicMenuOpen ? null : currentTourSteps[currentStepIndex] || null;
  // "Skip section" is shown ONLY inside the "full" tour.
  const canSkipSection = Boolean(
    activeTourId === 'full' &&
      !isTopicMenuOpen &&
      currentStep &&
      currentStep.section !== 'Welcome' &&
      currentStep.section !== 'Finish'
  );

  const value = useMemo<TourContextValue>(
    () => ({
      isOpen,
      isTopicMenuOpen,
      activeTourId,
      currentStepIndex,
      totalSteps: currentTourSteps.length,
      currentStep,
      runtimeContext,
      targetRect,
      isWaitingForTarget,
      canSkipSection,
      setOverlayMounted,
      startTour,
      selectTourFromMenu,
      openTopicMenu,
      replayTour,
      nextStep,
      prevStep,
      skipTour,
      skipSection,
      finishTour,
    }),
    [
      isOpen,
      isTopicMenuOpen,
      activeTourId,
      currentStepIndex,
      currentTourSteps.length,
      currentStep,
      runtimeContext,
      targetRect,
      isWaitingForTarget,
      canSkipSection,
      startTour,
      selectTourFromMenu,
      openTopicMenu,
      replayTour,
      nextStep,
      prevStep,
      skipTour,
      skipSection,
      finishTour,
    ]
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};

const QUICK_TOUR_STEPS_LEN = getTourSteps('quick').length;

export const useTour = (): TourContextValue => {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return ctx;
};
