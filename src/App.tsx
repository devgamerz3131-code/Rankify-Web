import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AppProviders } from '@/providers';
import { useAuth } from '@/hooks/use-auth';
import { AuthGateway } from '@/features/auth/components/AuthGateway';
import { OnboardingContainer } from '@/features/onboarding/components/OnboardingContainer';
import { MainLayout } from '@/layouts';
import { useNavigation } from '@/contexts/NavigationContext';
import { HomeScreenRevamped } from '@/features/home/HomeScreenRevamped';
import { ActiveStudyEngineView } from '@/features/study/ActiveStudyEngineView';
import { PracticeView } from '@/features/practice/PracticeView';
import { ProfileView } from '@/features/profile/ProfileView';
import { NotificationSettingsView } from '@/features/settings/NotificationSettingsView';
import { RankifyAiScreen } from '@/ai';
import { StudyJourneyFlow } from '@/features/smartplan/StudyJourneyFlow';
import { AdminDashboardView } from '@/features/admin/AdminDashboardView';
import { MistakeNotebookView } from '@/features/mistakes/MistakeNotebookView';
import { ExamReadinessView } from '@/features/readiness/ExamReadinessView';
import { WeaknessAnalyzerView } from '@/features/weakness/WeaknessAnalyzerView';
import { StudyReplayView } from '@/features/replay/StudyReplayView';
import { RankifyBrainView } from '@/features/brain/RankifyBrainView';
import { ExamCommandCenterView } from '@/features/command/ExamCommandCenterView';
import { SmartRevisionEngineView } from '@/features/revision/SmartRevisionEngineView';
import { NcertLibraryView } from '@/features/ncert/NcertLibraryView';
import { FormulaIntelligenceView } from '@/features/formula/FormulaIntelligenceView';
import { DailyBriefingView } from '@/features/briefing/DailyBriefingView';
import { syncEngine } from '@/services/sync-engine';
import { backupRestoreService } from '@/services/backup-restore';
import { remoteConfig } from '@/services/remote-config';
import { MaintenanceScreen } from '@/components/common/MaintenanceScreen';
import { ErrorBoundary } from '@/components/common/error-boundary';

const AppRouter: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { activeTab, setActiveTab } = useNavigation();
  const [isMaintenance, setIsMaintenance] = useState(() => remoteConfig.isMaintenanceActive());
  const [journeyCompleted, setJourneyCompleted] = useState<boolean>(() => {
    if (!user?.uid) return false;
    const cachedJourney = syncEngine.getLocalCache<boolean>('study_journey_completed', user.uid);
    return cachedJourney === true || (user as any)?.studyJourneyCompleted === true;
  });

  useEffect(() => {
    if (user?.uid) {
      const cached = syncEngine.getLocalCache<boolean>('study_journey_completed', user.uid);
      if (cached === true || (user as any)?.studyJourneyCompleted === true) {
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

  // 1. Maintenance Mode
  if (isMaintenance) {
    return <MaintenanceScreen />;
  }

  // 2. Persistent auth resolving loader
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white px-4 selection:bg-purple-500">
        <motion.div
          animate={{ scale: [1, 1.08, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white font-extrabold text-2xl shadow-2xl shadow-purple-500/40 mb-6 border border-white/20"
        >
          R
        </motion.div>
        <h2 className="text-xl font-bold tracking-tight mb-2">Rankify Intelligent Learning OS</h2>
        <p className="text-xs text-purple-300 font-medium animate-pulse">
          Restoring secure student session...
        </p>
      </div>
    );
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
  // For new users only, after onboarding:
  // Show: "Let's understand your study journey" -> Wait animation 2-3s -> Open Home Screen
  if (!journeyCompleted) {
    return <StudyJourneyFlow onComplete={() => setJourneyCompleted(true)} />;
  }

  // 5. Authenticated & Onboarded: Render Dynamic Tab Views
  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreenRevamped />;
      case 'study':
      case 'progress':
        return <ActiveStudyEngineView />;
      case 'practice':
        return <PracticeView />;
      case 'ai':
        return <RankifyAiScreen />;
      case 'profile':
        return <ProfileView />;
      case 'settings':
        return <NotificationSettingsView />;
      case 'admin':
        if (user?.role !== 'admin') {
          setTimeout(() => setActiveTab('home'), 0);
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
      default:
        return <HomeScreenRevamped />;
    }
  };

  return (
    <MainLayout>
      <ErrorBoundary>
        {renderTabContent()}
      </ErrorBoundary>
    </MainLayout>
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
