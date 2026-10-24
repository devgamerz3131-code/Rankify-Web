import React, { useEffect, useRef, useState } from 'react';
import toast, { Toaster, ToastOptions, useToasterStore } from 'react-hot-toast';
import { CheckCircle2, AlertCircle, Sparkles } from '@/icons';
import { tourToastGate } from '@/features/tour/tourToastGate';

// Deduplication map: keeps track of recent messages for 3 seconds
const recentToastMessages = new Map<string, number>();

interface HeldToastItem {
  message: string;
  type: 'success' | 'error' | 'blank' | 'custom' | 'loading';
  icon?: any;
}

export const ToastProviderComponent: React.FC = () => {
  const { toasts } = useToasterStore();
  const [isTourOpen, setIsTourOpen] = useState<boolean>(() => tourToastGate.isActive());
  const heldToastsRef = useRef<HeldToastItem[]>([]);

  useEffect(() => {
    return tourToastGate.subscribe((active) => {
      setIsTourOpen(active);
      if (!active && heldToastsRef.current.length > 0) {
        const queued = [...heldToastsRef.current];
        heldToastsRef.current = [];
        window.setTimeout(() => {
          queued.forEach((item) => {
            if (item.type === 'success') {
              toast.success(item.message, item.icon ? { icon: item.icon } : undefined);
            } else if (item.type === 'error') {
              toast.error(item.message, item.icon ? { icon: item.icon } : undefined);
            } else {
              toast(item.message, item.icon ? { icon: item.icon } : undefined);
            }
          });
        }, 200);
      }
    });
  }, []);

  // Hold toasts during active tour; otherwise limit to 1 visible toast at a time
  useEffect(() => {
    const visibleToasts = toasts.filter((t) => t.visible);
    if (isTourOpen) {
      visibleToasts.forEach((t) => {
        const msgText = typeof t.message === 'string' ? t.message : '';
        if (msgText && !heldToastsRef.current.some((h) => h.message === msgText)) {
          heldToastsRef.current.push({
            message: msgText,
            type: t.type,
            icon: t.icon,
          });
        }
        toast.dismiss(t.id);
      });
      return;
    }

    visibleToasts
      .filter((_, i) => i >= 1)
      .forEach((t) => toast.dismiss(t.id));
  }, [toasts, isTourOpen]);

  return (
    <Toaster
      position="top-center"
      containerStyle={{
        top: 'calc(env(safe-area-inset-top, 0px) + 68px)',
        zIndex: 9990,
        display: isTourOpen ? 'none' : undefined,
      }}
      toastOptions={{
        duration: 3500,
        className:
          '!bg-card !text-foreground !rounded-2xl !border !border-border !shadow-2xl !px-4 !py-3 !text-xs sm:!text-sm !font-semibold !max-w-[92vw] cursor-pointer select-none active:scale-95 transition-transform',
      }}
    >
      {(t) => (
        <div
          onClick={() => toast.dismiss(t.id)}
          className="cursor-pointer"
          role="button"
          tabIndex={0}
          title="Tap to dismiss"
        >
          {typeof t.message === 'function' ? t.message(t) : t.message}
        </div>
      )}
    </Toaster>
  );
};

// Helper to check for duplicate toasts within 3 seconds
const shouldShowToast = (msg: string): boolean => {
  const now = Date.now();
  const lastTime = recentToastMessages.get(msg);
  if (lastTime && now - lastTime < 3000) {
    return false;
  }
  recentToastMessages.set(msg, now);
  // Cleanup old entries
  if (recentToastMessages.size > 50) {
    for (const [k, v] of recentToastMessages.entries()) {
      if (now - v > 4000) {
        recentToastMessages.delete(k);
      }
    }
  }
  return true;
};

export const showRankifyToast = {
  success: (message: string, options?: ToastOptions) => {
    if (!shouldShowToast(message)) return;
    return toast.success(message, {
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
      ...options,
    });
  },
  error: (message: string, options?: ToastOptions) => {
    if (!shouldShowToast(message)) return;
    return toast.error(message, {
      icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      ...options,
    });
  },
  info: (message: string, options?: ToastOptions) => {
    if (!shouldShowToast(message)) return;
    return toast(message, {
      icon: <Sparkles className="h-5 w-5 text-purple-500" />,
      ...options,
    });
  },
};
