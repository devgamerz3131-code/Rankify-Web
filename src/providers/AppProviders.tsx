import React from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { ErrorBoundary } from '@/components/common/error-boundary';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <OnboardingProvider>
            <NavigationProvider>
              {children}
            </NavigationProvider>
          </OnboardingProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};
