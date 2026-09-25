import React, { useState } from 'react';
import { useNavigation } from '@/contexts/NavigationContext';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { RankifyLogo, Search, Sun, Moon, Laptop, LogIn, ChevronDown, User, LogOut } from '@/icons';
import { Button } from '@/components/ui/button';
import { CBSE_CLASSES } from '@/constants/cbse';
import { PWAInstallButton } from '@/components/common/pwa-install-button';
import { CBSEClassNumber } from '@/types/cbse';

export const TopNav: React.FC = () => {
  const { selectedClass, setSelectedClass, toggleSearch } = useNavigation();
  const { user, isAuthenticated, openAuthModal, signOutUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full glass-nav transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand & Class Picker */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5">
            <RankifyLogo size={36} />
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-lg leading-tight bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent">
                Rankify
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest hidden sm:block">
                CBSE Web
              </span>
            </div>
          </div>

          {/* Class Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-xs font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/60 transition cursor-pointer border border-purple-200/60 dark:border-purple-800/40"
              aria-label="Select CBSE Class"
            >
              <span>Class {selectedClass}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </button>

            {isClassDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsClassDropdownOpen(false)}
                />
                <div className="absolute left-0 mt-2 w-44 rounded-2xl bg-card border border-slate-200/90 dark:border-white/10 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Select Class
                  </div>
                  {CBSE_CLASSES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedClass(c.id as CBSEClassNumber);
                        setIsClassDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer ${
                        selectedClass === c.id ? 'text-purple-600 dark:text-purple-400 font-bold bg-purple-50/60 dark:bg-purple-950/30' : 'text-foreground'
                      }`}
                    >
                      <span>{c.label}</span>
                      {selectedClass === c.id && <span className="h-1.5 w-1.5 rounded-full bg-purple-600" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Global Search Bar Trigger */}
        <div className="flex-1 max-w-md mx-3 hidden md:block">
          <button
            onClick={toggleSearch}
            className="w-full h-9 flex items-center justify-between px-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 text-xs text-muted-foreground hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition border border-transparent hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5" />
              <span>Search subjects, chapters, notes...</span>
            </span>
            <kbd className="inline-flex items-center gap-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold shadow-xs">
              <span>⌘</span>K
            </kbd>
          </button>
        </div>

        {/* Right Actions: Search (Mobile), PWA, Theme, Auth */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Mobile search trigger icon */}
          <button
            onClick={toggleSearch}
            className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* PWA Install */}
          <PWAInstallButton variant="compact" />

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label={`Current theme: ${theme}. Click to switch.`}
            title={`Theme: ${theme}`}
          >
            {theme === 'light' ? (
              <Sun className="h-4 w-4 text-amber-500" />
            ) : theme === 'dark' ? (
              <Moon className="h-4 w-4 text-indigo-400" />
            ) : (
              <Laptop className="h-4 w-4" />
            )}
          </button>

          {/* Auth State Button */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-full border border-slate-200/80 dark:border-white/10 bg-slate-100/60 dark:bg-slate-800/60 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition cursor-pointer"
              >
                <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 text-white flex items-center justify-center text-xs font-bold">
                  {user.displayName?.[0]?.toUpperCase() || 'S'}
                </div>
                <span className="text-xs font-semibold max-w-[80px] truncate hidden sm:inline">
                  {user.displayName?.split(' ')[0] || 'Student'}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>

              {isUserMenuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setIsUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-card border border-slate-200/90 dark:border-white/10 shadow-xl py-2 z-30 animate-in fade-in zoom-in-95">
                    <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-foreground truncate">{user.displayName || 'Student'}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                        {user.role === 'admin' ? 'Educator / Admin' : `Class ${selectedClass} Student`}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        signOutUser();
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => openAuthModal('login')}
              className="gap-1.5"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
