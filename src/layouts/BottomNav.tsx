import React, { useState, useEffect } from 'react';
import { useNavigation } from '@/contexts/NavigationContext';
import { PRIMARY_NAV_ITEMS, MORE_NAV_ITEMS } from '@/constants/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Sparkles } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useNavigation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Global listener: hide nav while any input or textarea is focused
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.getAttribute('contenteditable') === 'true')
      ) {
        setIsKeyboardOpen(true);
      }
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        const active = document.activeElement as HTMLElement | null;
        if (
          !active ||
          (active.tagName !== 'INPUT' &&
            active.tagName !== 'TEXTAREA' &&
            active.getAttribute('contenteditable') !== 'true')
        ) {
          setIsKeyboardOpen(false);
        }
      }, 100);
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);
    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const isMoreActive =
    activeTab === 'more' ||
    activeTab === 'ncert' ||
    activeTab === 'mistakes' ||
    activeTab === 'weakness';

  const handleNavClick = (itemId: string) => {
    if (itemId === 'more') {
      setIsMoreOpen((prev) => !prev);
    } else {
      setIsMoreOpen(false);
      setActiveTab(itemId as any);
    }
  };

  const handleSelectMoreItem = (itemId: string) => {
    setIsMoreOpen(false);
    setActiveTab(itemId as any);
  };

  return (
    <>
      {/* Mobile Slide-Up More Action Sheet */}
      <AnimatePresence>
        {isMoreOpen && (
          <div className="lg:hidden fixed inset-0 z-50 pointer-events-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Sheet Content */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-3xl p-5 pb-8 shadow-2xl max-w-lg mx-auto"
            >
              {/* Drag handle */}
              <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-4" />

              {/* Sheet Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-foreground">More Tools</h3>
                    <p className="text-[11px] text-muted-foreground">NCERT, Mistake Notebook & Weakness</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsMoreOpen(false)}
                  className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Nested Items: Ncert, Mistake, Weakness */}
              <div className="space-y-2">
                {MORE_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isCurrent = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectMoreItem(item.id)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-purple-500/10 border-purple-500/40 text-purple-600 dark:text-purple-400 font-bold'
                          : 'bg-muted/30 border-border hover:bg-muted/60 text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            isCurrent
                              ? 'bg-purple-600 text-white'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold leading-tight">{item.label}</p>
                          <span className="text-[10px] text-muted-foreground">
                            {item.id === 'ncert'
                              ? 'Class 12 Digital Textbooks'
                              : item.id === 'mistakes'
                              ? 'Track & Prevent Exam Errors'
                              : 'Find & Fix Weak Chapters'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.badge && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono">
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-60" />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* View Full More Dashboard Link */}
              <button
                onClick={() => {
                  setIsMoreOpen(false);
                  setActiveTab('more');
                }}
                className="w-full mt-3 py-2.5 rounded-xl border border-dashed border-border hover:border-purple-500/40 hover:bg-muted/40 text-xs font-semibold text-muted-foreground hover:text-foreground text-center transition cursor-pointer"
              >
                Open Full More Dashboard →
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Primary Fixed Bottom Navigation Bar */}
      <nav
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pointer-events-none transition-all duration-200 ${
          isKeyboardOpen || (activeTab === 'ai' && 'group-data-[keyboard=open]:hidden')
            ? 'opacity-0 pointer-events-none translate-y-8'
            : 'opacity-100'
        }`}
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)',
          display: isKeyboardOpen ? 'none' : 'var(--bottom-nav-display, flex)',
        }}
      >
        <div
          data-tour="main-nav"
          className="max-w-md mx-auto h-16 w-full rounded-2xl bg-card border border-border shadow-2xl flex items-center justify-around px-1 pointer-events-auto select-none"
        >
          {PRIMARY_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isItemActive = item.id === 'more' ? isMoreActive : activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                aria-label={item.label}
                aria-current={isItemActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] rounded-2xl transition-all duration-200 cursor-pointer touch-target ${
                  isItemActive
                    ? 'text-purple-600 dark:text-purple-400 font-bold scale-105'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="relative">
                  <Icon className={`h-5 w-5 ${isItemActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
                  {item.id === 'more' && isMoreActive && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-purple-600 ring-2 ring-card" />
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
