type TourActiveListener = (active: boolean) => void;

let tourActiveState = false;
const listeners = new Set<TourActiveListener>();

export const tourToastGate = {
  isActive(): boolean {
    return tourActiveState;
  },
  setActive(active: boolean): void {
    if (tourActiveState === active) return;
    tourActiveState = active;
    if (typeof document !== 'undefined') {
      if (active) {
        document.documentElement.setAttribute('data-tour-active', 'true');
      } else {
        document.documentElement.removeAttribute('data-tour-active');
      }
    }
    listeners.forEach((l) => {
      try {
        l(active);
      } catch {
        // Ignore listener error
      }
    });
  },
  subscribe(listener: TourActiveListener): () => void {
    listeners.add(listener);
    listener(tourActiveState);
    return () => {
      listeners.delete(listener);
    };
  },
};
