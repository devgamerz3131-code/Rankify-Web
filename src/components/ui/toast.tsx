import React from 'react';
import toast, { Toaster, ToastOptions } from 'react-hot-toast';
import { CheckCircle2, AlertCircle, Sparkles } from '@/icons';

export const ToastProviderComponent: React.FC = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        className:
          '!bg-white/90 dark:!bg-slate-900/90 !backdrop-blur-md !text-foreground !rounded-2xl !border !border-slate-200/80 dark:!border-white/10 !shadow-xl !px-4 !py-3 !text-sm !font-medium',
      }}
    />
  );
};

export const showRankifyToast = {
  success: (message: string, options?: ToastOptions) =>
    toast.success(message, {
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
      ...options,
    }),
  error: (message: string, options?: ToastOptions) =>
    toast.error(message, {
      icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      ...options,
    }),
  info: (message: string, options?: ToastOptions) =>
    toast(message, {
      icon: <Sparkles className="h-5 w-5 text-purple-500" />,
      ...options,
    }),
};
