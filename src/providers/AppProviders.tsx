import React from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { SyncProvider } from '@/contexts/SyncContext';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { ErrorBoundary } from '@/components/common/error-boundary';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <SyncProvider>
            <OnboardingProvider>
              <NavigationProvider>
                {children}
              </NavigationProvider>
            </OnboardingProvider>
          </SyncProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};
