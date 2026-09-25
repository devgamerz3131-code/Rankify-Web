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

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
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
