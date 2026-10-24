import { useEffect, useRef } from 'react';

/**
 * Shared Android back button / browser back gesture handler hook.
 * Intercepts popstate in the capture phase while `enabled` is true.
 * Returns 'stay' from `onBack` to keep the overlay open (e.g. previous step),
 * or 'close' when the overlay closes (e.g. first step -> skip).
 * Never calls history.back() on close to avoid history loops.
 */
export function useBackHandler(
  enabled: boolean,
  onBack: () => 'stay' | 'close',
  guardKey: string = 'rankify-overlay'
): void {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;
  const pushedGuardRef = useRef(false);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      if (pushedGuardRef.current && typeof window !== 'undefined') {
        pushedGuardRef.current = false;
        try {
          if (window.history.state && window.history.state.__rankifyBackGuard === guardKey) {
            window.history.replaceState(
              null,
              '',
              window.location.pathname + window.location.search + window.location.hash
            );
          }
        } catch {
          // Ignore history replace errors
        }
      }
      return;
    }

    try {
      if (!window.history.state || window.history.state.__rankifyBackGuard !== guardKey) {
        window.history.pushState(
          { ...(window.history.state || {}), __rankifyBackGuard: guardKey },
          '',
          window.location.href
        );
      }
      pushedGuardRef.current = true;
    } catch {
      // Ignore history push errors in restricted environments
    }

    const handlePopState = (e: PopStateEvent) => {
      e.stopImmediatePropagation();
      const action = onBackRef.current();
      if (action === 'stay') {
        try {
          window.history.pushState(
            { ...(window.history.state || {}), __rankifyBackGuard: guardKey },
            '',
            window.location.href
          );
          pushedGuardRef.current = true;
        } catch {
          // Ignore
        }
      } else {
        pushedGuardRef.current = false;
      }
    };

    window.addEventListener('popstate', handlePopState, true);
    return () => {
      window.removeEventListener('popstate', handlePopState, true);
      if (pushedGuardRef.current) {
        pushedGuardRef.current = false;
        try {
          if (window.history.state && window.history.state.__rankifyBackGuard === guardKey) {
            window.history.replaceState(
              null,
              '',
              window.location.pathname + window.location.search + window.location.hash
            );
          }
        } catch {
          // Ignore
        }
      }
    };
  }, [enabled, guardKey]);
}
