import React, { createContext, useEffect, useState, useCallback, useMemo } from 'react';
import { UserProfile, AuthState, AuthModalState, UserRole } from '@/types/auth';
import {
  subscribeToAuthState,
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  resetPassword,
  logoutUser,
} from '@/firebase/auth/auth-service';
import { formatAuthError } from '@/utils/auth-error';
import { syncEngine } from '@/services/sync-engine';
import toast from 'react-hot-toast';

export interface AuthContextValue extends AuthState {
  modalState: AuthModalState;
  openAuthModal: (mode?: 'login' | 'register' | 'forgot-password') => void;
  closeAuthModal: () => void;
  clearError: () => void;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string, role?: UserRole, cbseClass?: number) => Promise<void>;
  signInWithGooglePopup: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  markOnboardingComplete: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<AuthModalState>({
    isOpen: false,
    mode: 'login',
  });

  // Listen to persistent Firebase Auth state and auto-restore session
  useEffect(() => {
    const unsubscribe = subscribeToAuthState((profile) => {
      setUser(profile);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const openAuthModal = useCallback((mode: 'login' | 'register' | 'forgot-password' = 'login') => {
    setError(null);
    setModalState({ isOpen: true, mode });
  }, []);

  const closeAuthModal = useCallback(() => {
    setError(null);
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const signIn = useCallback(async (email: string, pass: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const profile = await loginWithEmail(email, pass);
      setUser(profile);
      setModalState((prev) => ({ ...prev, isOpen: false }));
      toast.success(`Welcome back, ${profile.displayName || 'Student'}!`);
    } catch (err: unknown) {
      const formatted = formatAuthError(err);
      setError(formatted);
      toast.error(formatted, { duration: 5000 });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(
    async (email: string, pass: string, name: string, role: UserRole = 'student', cbseClass: number = 12) => {
      setIsLoading(true);
      setError(null);
      try {
        const profile = await registerWithEmail(email, pass, name, role, cbseClass);
        setUser(profile);
        setModalState((prev) => ({ ...prev, isOpen: false }));
        toast.success(`Account created successfully! Welcome to Rankify.`);
      } catch (err: unknown) {
        const formatted = formatAuthError(err);
        setError(formatted);
        toast.error(formatted, { duration: 5000 });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const signInWithGooglePopup = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const profile = await loginWithGoogle();
      setUser(profile);
      setModalState((prev) => ({ ...prev, isOpen: false }));
      toast.success(`Signed in as ${profile.displayName || profile.email}`);
    } catch (err: unknown) {
      const formatted = formatAuthError(err);
      setError(formatted);
      toast.error(formatted, { duration: 5000 });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    setError(null);
    try {
      await resetPassword(email);
      toast.success('Password reset link sent to your email.');
      setModalState({ isOpen: true, mode: 'login' });
    } catch (err: unknown) {
      const formatted = formatAuthError(err);
      setError(formatted);
      toast.error(formatted, { duration: 5000 });
      throw err;
    }
  }, []);

  const signOutUser = useCallback(async () => {
    try {
      if (user?.uid) {
        await syncEngine.flushAndClear(user.uid);
      }
      await logoutUser();
      setUser(null);
      toast.success('Signed out successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error signing out';
      toast.error(msg);
    }
  }, [user?.uid]);

  const markOnboardingComplete = useCallback(() => {
    setUser((prev) => (prev ? { ...prev, onboardingCompleted: true } : null));
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      error,
      modalState,
      openAuthModal,
      closeAuthModal,
      clearError,
      signIn,
      signUp,
      signInWithGooglePopup,
      sendPasswordReset,
      signOutUser,
      markOnboardingComplete,
    }),
    [user, isLoading, error, modalState, openAuthModal, closeAuthModal, clearError, signIn, signUp, signInWithGooglePopup, sendPasswordReset, signOutUser, markOnboardingComplete]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
