import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Lock, LogIn, ShieldAlert } from '@/icons';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  fallbackMessage?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallbackMessage = 'This module requires a verified Rankify student or educator account.',
}) => {
  const { user, isAuthenticated, isLoading, openAuthModal } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
        <p className="text-xs text-muted-foreground">Verifying credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-card p-8 sm:p-12 text-center max-w-lg mx-auto my-8 shadow-xl space-y-4">
        <div className="mx-auto inline-flex p-3 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600">
          <Lock className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-bold text-foreground">Sign In Required</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{fallbackMessage}</p>
        <Button variant="primary" onClick={() => openAuthModal('login')} className="gap-2">
          <LogIn className="h-4 w-4" />
          <span>Sign In to Continue</span>
        </Button>
      </div>
    );
  }

  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return (
      <div className="rounded-3xl border border-red-200 dark:border-red-900/40 bg-card p-8 sm:p-12 text-center max-w-lg mx-auto my-8 shadow-xl space-y-4">
        <div className="mx-auto inline-flex p-3 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-bold text-foreground">Access Restricted</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          This area is restricted to {requiredRole} accounts.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
