import React from 'react';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { ResponsiveHeader } from './ResponsiveHeader';
import { Footer } from './Footer';
import { AuthModal } from '@/features/auth/components/AuthModal';
import { SearchModal } from '@/components/ui/search-modal';
import { OfflineIndicator } from '@/components/common/offline-indicator';
import { ToastProviderComponent } from '@/components/ui/toast';
import { AnnouncementBanner } from '@/components/common/AnnouncementBanner';
import { AppUpdateModal } from '@/components/common/AppUpdateModal';
import { useAuth } from '@/hooks/use-auth';
import { useNavigation } from '@/contexts/NavigationContext';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { impersonatedUser, stopImpersonation } = useAuth();
  const { setActiveTab } = useNavigation();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      {/* Impersonation Warnings Banner */}
      {impersonatedUser && (
        <div className="bg-amber-500 text-slate-950 font-bold px-4 py-3 text-center text-xs sm:text-sm z-50 flex flex-col sm:flex-row items-center justify-center gap-2 select-none shadow-md border-b border-amber-600/30 animate-fadeIn">
          <span>You are currently viewing this account as an Administrator (Impersonating student <strong className="font-black text-black underline">{impersonatedUser.displayName || impersonatedUser.email}</strong>).</span>
          <div className="flex items-center gap-2 mt-1.5 sm:mt-0">
            <button
              onClick={() => {
                stopImpersonation();
                setActiveTab('admin');
              }}
              className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-3 py-1 rounded-xl text-xs cursor-pointer shadow-xs transition-all shrink-0"
            >
              Return to Admin Dashboard
            </button>
            <button
              onClick={stopImpersonation}
              className="bg-white hover:bg-slate-50 text-slate-950 font-extrabold px-3 py-1 rounded-xl text-xs cursor-pointer shadow-xs transition-all border border-slate-200 shrink-0"
            >
              Exit Impersonation
            </button>
          </div>
        </div>
      )}

      {/* Remote Announcement Banner */}
      <AnnouncementBanner />

      {/* Top Navigation */}
      <TopNav />

      {/* Main App Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop & Tablet Sidebar */}
        <Sidebar />

        {/* Content Viewport */}
        <main className="flex-1 flex flex-col px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-12 max-w-full overflow-hidden">
          <ResponsiveHeader />
          <div className="flex-1">{children}</div>
          <Footer />
        </main>
      </div>

      {/* Floating Mobile Bottom Navigation */}
      <BottomNav />

      {/* Global Modals & System Components */}
      <AuthModal />
      <SearchModal />
      <OfflineIndicator />
      <ToastProviderComponent />
      <AppUpdateModal />
    </div>
  );
};
