import React, { useEffect, useState, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { AppProviders } from '@/providers';
import { useAuth } from '@/hooks/use-auth';
import { AuthGateway } from '@/features/auth/components/AuthGateway';
import { OnboardingContainer } from '@/features/onboarding/components/OnboardingContainer';
import { MainLayout } from '@/layouts';
import { useNavigation } from '@/contexts/NavigationContext';
import { HomeScreenRevamped } from '@/features/home/HomeScreenRevamped';
import { syncEngine } from '@/services/sync-engine';
import { backupRestoreService } from '@/services/backup-restore';
import { remoteConfig } from '@/services/remote-config';
import { MaintenanceScreen } from '@/components/common/MaintenanceScreen';
import { ErrorBoundary } from '@/components/common/error-boundary';
import { StudyJourneyFlow } from '@/features/smartplan/StudyJourneyFlow';
import { Sparkles } from '@/icons';
import { SplashScreen } from '@/components/common/SplashScreen';

import { ActiveStudyEngineView } from '@/features/study/ActiveStudyEngineView';

// Lazy load heavy secondary screens for optimal initial bundle & mobile performance
const PracticeView = lazy(() =>
  import('@/features/practice/PracticeView').then((m) => ({ default: m.PracticeView }))
);
const ProfileView = lazy(() =>
  import('@/features/profile/ProfileView').then((m) => ({ default: m.ProfileView }))
);
const ProgressView = lazy(() =>
  import('@/features/progress/ProgressView').then((m) => ({ default: m.ProgressView }))
);
const ToolsHubView = lazy(() =>
  import('@/features/tools/ToolsHubView').then((m) => ({ default: m.ToolsHubView }))
);
const NotificationSettingsView = lazy(() =>
  import('@/features/settings/NotificationSettingsView').then((m) => ({ default: m.NotificationSettingsView }))
);
const RankifyAiScreen = lazy(() =>
  import('@/ai').then((m) => ({ default: m.RankifyAiScreen }))
);
const AdminDashboardView = lazy(() =>
  import('@/features/admin/AdminDashboardView').then((m) => ({ default: m.AdminDashboardView }))
);
const MistakeNotebookView = lazy(() =>
  import('@/features/mistakes/MistakeNotebookView').then((m) => ({ default: m.MistakeNotebookView }))
);
const ExamReadinessView = lazy(() =>
  import('@/features/readiness/ExamReadinessView').then((m) => ({ default: m.ExamReadinessView }))
);
const WeaknessAnalyzerView = lazy(() =>
  import('@/features/weakness/WeaknessAnalyzerView').then((m) => ({ default: m.WeaknessAnalyzerView }))
);
const StudyReplayView = lazy(() =>
  import('@/features/replay/StudyReplayView').then((m) => ({ default: m.StudyReplayView }))
);
const RankifyBrainView = lazy(() =>
  import('@/features/brain/RankifyBrainView').then((m) => ({ default: m.RankifyBrainView }))
);
const ExamCommandCenterView = lazy(() =>
  import('@/features/command/ExamCommandCenterView').then((m) => ({ default: m.ExamCommandCenterView }))
);
const DailyBriefingView = lazy(() =>
  import('@/features/briefing/DailyBriefingView').then((m) => ({ default: m.DailyBriefingView }))
);
const SmartRevisionEngineView = lazy(() =>
  import('@/features/revision/SmartRevisionEngineView').then((m) => ({ default: m.SmartRevisionEngineView }))
);
const NcertLibraryView = lazy(() =>
  import('@/features/ncert/NcertLibraryView').then((m) => ({ default: m.NcertLibraryView }))
);
const FormulaIntelligenceView = lazy(() =>
  import('@/features/formula/FormulaIntelligenceView').then((m) => ({ default: m.FormulaIntelligenceView }))
);
const HalfYearlyAnalyzerView = lazy(() =>
  import('@/features/halfyearly/HalfYearlyAnalyzerView').then((m) => ({ default: m.HalfYearlyAnalyzerView }))
);
const MoreView = lazy(() =>
  import('@/features/more/MoreView').then((m) => ({ default: m.MoreView }))
);

const ScreenLoadingFallback: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 space-y-3">
    <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center animate-pulse">
      <Sparkles className="w-5 h-5 text-purple-600" />
    </div>
    <p className="text-xs font-semibold text-muted-foreground animate-pulse">
      Loading...
    </p>
  </div>
);

const AppRouter: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { activeTab, setActiveTab } = useNavigation();
  const [isMaintenance, setIsMaintenance] = useState(() => remoteConfig.isMaintenanceActive());
  const [splashFinished, setSplashFinished] = useState(false);
  const [journeyCompleted, setJourneyCompleted] = useState<boolean>(() => {
    if (!user?.uid) return false;
    const cachedJourney = syncEngine.getLocalCache<boolean>('study_journey_completed', user.uid);
    return cachedJourney === true || user.studyJourneyCompleted === true;
  });

  useEffect(() => {
    if (user?.uid) {
      const cached = syncEngine.getLocalCache<boolean>('study_journey_completed', user.uid);
      if (cached === true || user.studyJourneyCompleted === true) {
        setJourneyCompleted(true);
      }
    }
  }, [user]);

  useEffect(() => {
    return remoteConfig.subscribe((cfg) => {
      setIsMaintenance(cfg.maintenance.enabled);
    });
  }, []);

  // Auto-restore backup when user authenticates
  useEffect(() => {
    if (user?.uid) {
      backupRestoreService.restoreCloudBackup(user.uid).catch(() => {});
    }
  }, [user?.uid]);

  const isAdmin = user?.role === 'admin' || user?.email === 'devgamerz3131@gmail.com';

  useEffect(() => {
    if (activeTab === 'admin' && !isLoading && user && !isAdmin) {
      setActiveTab('home');
    }
  }, [activeTab, isLoading, user, isAdmin, setActiveTab]);

  // 1. Maintenance Mode
  if (isMaintenance) {
    return <MaintenanceScreen />;
  }

  // 2. Authenticated & Onboarded: Render Dynamic Tab Views with Lazy-loaded Suspense
  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreenRevamped />;
      case 'study':
        return <ActiveStudyEngineView />;
      case 'practice':
        return <PracticeView />;
      case 'progress':
        return <ProgressView />;
      case 'tools':
        return <ToolsHubView />;
      case 'ai':
        return <RankifyAiScreen />;
      case 'profile':
        return <ProfileView />;
      case 'settings':
        return <NotificationSettingsView />;
      case 'admin':
        if (!isAdmin) {
          return <HomeScreenRevamped />;
        }
        return <AdminDashboardView />;
      case 'mistakes':
        return <MistakeNotebookView />;
      case 'readiness':
        return <ExamReadinessView />;
      case 'weakness':
        return <WeaknessAnalyzerView />;
      case 'replay':
        return <StudyReplayView />;
      case 'brain':
        return <RankifyBrainView />;
      case 'command':
        return <ExamCommandCenterView />;
      case 'briefing':
        return <DailyBriefingView />;
      case 'revision':
        return <SmartRevisionEngineView />;
      case 'ncert':
        return <NcertLibraryView />;
      case 'formula':
        return <FormulaIntelligenceView />;
      case 'halfyearly':
        return <HalfYearlyAnalyzerView />;
      case 'more':
        return <MoreView />;
      default:
        return <HomeScreenRevamped />;
    }
  };

  const renderAppContent = () => {
    if (isLoading) {
      return null;
    }

    // 3. Unauthenticated Gateway
    if (!isAuthenticated || !user) {
      return <AuthGateway />;
    }

    // 4. First Login Detection:
    const cachedCompleted = syncEngine.getLocalCache<boolean>('onboarding_completed', user.uid);
    const isOnboardingCompleted = user.onboardingCompleted === true || cachedCompleted === true;

    if (!isOnboardingCompleted) {
      return <OnboardingContainer />;
    }

    // 4b. First Time User Flow:
    if (!journeyCompleted) {
      return <StudyJourneyFlow onComplete={() => setJourneyCompleted(true)} />;
    }

    return (
      <MainLayout>
        <ErrorBoundary key={activeTab}>
          <Suspense fallback={<ScreenLoadingFallback />}>
            {renderTabContent()}
          </Suspense>
        </ErrorBoundary>
      </MainLayout>
    );
  };

  return (
    <>
      {!splashFinished && (
        <SplashScreen
          isReady={!isLoading}
          onFinished={() => setSplashFinished(true)}
        />
      )}
      {renderAppContent()}
    </>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </ErrorBoundary>
  );
}
