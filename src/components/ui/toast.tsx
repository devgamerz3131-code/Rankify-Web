import React, { useEffect } from 'react';
import toast, { Toaster, ToastOptions, useToasterStore } from 'react-hot-toast';
import { CheckCircle2, AlertCircle, Sparkles } from '@/icons';

// Deduplication map: keeps track of recent messages for 3 seconds
const recentToastMessages = new Map<string, number>();

export const ToastProviderComponent: React.FC = () => {
  const { toasts } = useToasterStore();

  // Limit to 1 visible toast at a time (queue others)
  useEffect(() => {
    toasts
      .filter((t) => t.visible)
      .filter((_, i) => i >= 1)
      .forEach((t) => toast.dismiss(t.id));
  }, [toasts]);

  return (
    <Toaster
      position="top-center"
      containerStyle={{
        top: 'calc(env(safe-area-inset-top, 0px) + 68px)',
        zIndex: 9990,
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
