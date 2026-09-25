import React from 'react';
import { motion } from 'framer-motion';
import { AppProviders } from '@/providers';
import { useAuth } from '@/hooks/use-auth';
import { AuthGateway } from '@/features/auth/components/AuthGateway';
import { OnboardingContainer } from '@/features/onboarding/components/OnboardingContainer';
import { MainLayout } from '@/layouts';
import { ActiveStudyEngineView } from '@/features/study/ActiveStudyEngineView';
import { syncEngine } from '@/services/sync-engine';

const AppRouter: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // 1. Apple-grade persistent auth resolving loader
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

  // 2. Unauthenticated Gateway (Email, Google, Forgot Password)
  if (!isAuthenticated || !user) {
    return <AuthGateway />;
  }

  // 3. First Login Detection:
  // Check Firestore user profile onboardingCompleted flag or local cache fallback
  const cachedCompleted = syncEngine.getLocalCache<boolean>('onboarding_completed', user.uid);
  const isOnboardingCompleted = user.onboardingCompleted === true || cachedCompleted === true;

  if (!isOnboardingCompleted) {
    return <OnboardingContainer />;
  }

  // 4. Authenticated & Onboarded: Render Production Syllabus Tracker & AI Study Plan Engine
  return (
    <MainLayout>
      <ActiveStudyEngineView />
    </MainLayout>
  );
};

export default function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}
