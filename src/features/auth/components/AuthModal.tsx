import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { RankifyLogo } from '@/icons';

export const AuthModal: React.FC = () => {
  const { modalState, closeAuthModal, openAuthModal } = useAuth();

  const getTitleAndDesc = () => {
    switch (modalState.mode) {
      case 'register':
        return {
          title: 'Join Rankify',
          desc: 'Create your personalized CBSE learning dashboard and track progress.',
        };
      case 'forgot-password':
        return {
          title: 'Reset Password',
          desc: 'Recover access to your CBSE syllabus, tests, and study bookmarks.',
        };
      case 'login':
      default:
        return {
          title: 'Welcome Back',
          desc: 'Log in to continue your CBSE study path and adaptive practice.',
        };
    }
  };

  const { title, desc } = getTitleAndDesc();

  return (
    <Dialog open={modalState.isOpen} onOpenChange={(open) => !open && closeAuthModal()}>
      <div className="flex flex-col items-center text-center mb-5">
        <RankifyLogo size={44} className="mb-3" />
        <DialogHeader className="mb-0 text-center">
          <DialogTitle className="text-xl sm:text-2xl font-bold">{title}</DialogTitle>
          <DialogDescription className="text-xs max-w-xs mx-auto mt-1">{desc}</DialogDescription>
        </DialogHeader>
      </div>

      {modalState.mode === 'login' && (
        <LoginForm
          onSwitchToRegister={() => openAuthModal('register')}
          onSwitchToForgot={() => openAuthModal('forgot-password')}
        />
      )}

      {modalState.mode === 'register' && (
        <RegisterForm onSwitchToLogin={() => openAuthModal('login')} />
      )}

      {modalState.mode === 'forgot-password' && (
        <ForgotPasswordForm onSwitchToLogin={() => openAuthModal('login')} />
      )}
    </Dialog>
  );
};
