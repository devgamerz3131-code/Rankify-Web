import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/use-theme';

export interface SplashScreenProps {
  isReady: boolean;
  onFinished?: () => void;
  minDisplayMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  isReady,
  onFinished,
  minDisplayMs = 850,
}) => {
  const { resolvedTheme, appearance } = useTheme();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [showFooter, setShowFooter] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const isReducedMotion =
    appearance?.reduceMotion ||
    (typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    // 500ms delay for the subtle footer appearance
    const footerTimer = setTimeout(() => {
      setShowFooter(true);
    }, 500);

    // Minimum display timer so users get a clean, polished branded experience without UI flicker
    const minTimer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, minDisplayMs);

    return () => {
      clearTimeout(footerTimer);
      clearTimeout(minTimer);
    };
  }, [minDisplayMs]);

  // When both the app is ready and minimum display time has passed, trigger exit
  useEffect(() => {
    if (isReady && minTimeElapsed) {
      const exitTimer = setTimeout(() => {
        setIsVisible(false);
      }, 50);
      return () => clearTimeout(exitTimer);
    }
  }, [isReady, minTimeElapsed]);

  return (
    <AnimatePresence onExitComplete={onFinished}>
      {isVisible && (
        <motion.div
          key="rankify-splash-screen"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: isReducedMotion ? 1 : 1.01,
            transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
          }}
          className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between select-none overflow-hidden transition-colors duration-300 ${
            resolvedTheme === 'dark'
              ? 'bg-[#090d16] text-white'
              : 'bg-[#fafbfe] text-slate-900'
          }`}
          style={{
            paddingTop: 'max(env(safe-area-inset-top), 2rem)',
            paddingBottom: 'max(env(safe-area-inset-bottom), 1.75rem)',
          }}
          aria-label="Loading Rankify"
          role="status"
        >
          {/* Top Placeholder to keep Center Logo perfectly balanced */}
          <div className="w-full h-8" />

          {/* Center Brand Identity Container */}
          <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-sm mx-auto">
            {/* Logo Icon */}
            <motion.div
              initial={isReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.82, y: 15 }}
              animate={
                isReducedMotion
                  ? { opacity: 1 }
                  : {
                      opacity: 1,
                      scale: 1,
                      y: 0,
                    }
              }
              transition={{
                duration: 0.65,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative mb-5"
            >
              {/* Main Rounded Logo Container */}
              <motion.div
                animate={
                  isReducedMotion
                    ? {}
                    : {
                        y: [-2, 2, -2],
                      }
                }
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 p-[1.5px] shadow-2xl shadow-purple-600/35 border border-white/25 flex items-center justify-center text-white"
              >
                <div className="w-full h-full rounded-[22px] bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-9 h-9 sm:w-10 sm:h-10 text-white drop-shadow-md"
                  >
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                </div>
              </motion.div>
            </motion.div>

            {/* App Name */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5, ease: 'easeOut' }}
              className="space-y-1"
            >
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight flex items-center justify-center gap-0.5">
                <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent">
                  Rankify
                </span>
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 self-start ml-0.5 mt-0.5">
                  ™
                </span>
              </h1>

              {/* Tagline */}
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.5, ease: 'easeOut' }}
                className="text-xs sm:text-sm font-semibold tracking-wide text-slate-500 dark:text-slate-400"
              >
                Learn Smarter. Revise Better.
              </motion.p>
            </motion.div>

            {/* Elegant Modern Loading Progress Line */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="mt-8 w-44 sm:w-48 h-1 rounded-full bg-slate-200/80 dark:bg-slate-800/80 overflow-hidden relative"
            >
              <motion.div
                initial={{ x: '-100%' }}
                animate={
                  isReducedMotion
                    ? { x: '0%', width: '100%' }
                    : {
                        x: ['-100%', '100%'],
                      }
                }
                transition={
                  isReducedMotion
                    ? { duration: 0.4 }
                    : {
                        duration: 1.4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }
                }
                className="w-1/2 h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500 rounded-full shadow-sm shadow-purple-500/50"
              />
            </motion.div>
          </div>

          {/* Footer Component */}
          <div className="relative z-10 text-center pb-2">
            <AnimatePresence>
              {showFooter && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45 }}
                  className="space-y-0.5"
                >
                  <p className="text-[11px] font-medium tracking-wider text-slate-400 dark:text-slate-500 uppercase flex items-center justify-center gap-1">
                    <span>Made with</span>
                    <span className="text-rose-500 text-xs inline-block animate-pulse">❤️</span>
                  </p>
                  <p className="text-[10px] font-semibold text-slate-400/80 dark:text-slate-500/80 tracking-widest uppercase">
                    by Rankify™
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
