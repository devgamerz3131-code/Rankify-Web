import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '../schemas';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock } from '@/icons';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSwitchToForgot: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToRegister,
  onSwitchToForgot,
}) => {
  const { signIn, signInWithGooglePopup, isLoading, error } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await signIn(data.email, data.password);
    } catch {
      // Error handled in AuthContext
    }
  };

  return (
    <div className="space-y-4">
      {/* Google Login */}
      <button
        type="button"
        onClick={() => signInWithGooglePopup()}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-800 text-sm font-medium text-foreground hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-xs transition active:scale-[0.99] cursor-pointer"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        Continue with Google
      </button>

      <div className="relative flex items-center justify-center my-4">
        <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
        <span className="bg-card px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground absolute">
          Or continue with email
        </span>
      </div>

      {error && (
        <div className="p-3 text-xs rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 flex items-start gap-2 animate-in fade-in">
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1 leading-snug">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              {...register('email')}
              placeholder="name@student.edu"
              type="email"
              className="pl-10"
              error={errors.email?.message}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              {...register('password')}
              placeholder="••••••••"
              type="password"
              className="pl-10"
              error={errors.password?.message}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground hover:text-foreground">
            <input
              type="checkbox"
              {...register('rememberMe')}
              className="rounded border-slate-300 dark:border-slate-700 text-purple-600 focus:ring-purple-500"
            />
            Keep me signed in
          </label>
          <button
            type="button"
            onClick={onSwitchToForgot}
            className="text-purple-600 dark:text-purple-400 font-medium hover:underline cursor-pointer"
          >
            Forgot password?
          </button>
        </div>

        <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
          Sign In
        </Button>
      </form>

      <div className="text-center text-xs text-muted-foreground pt-2">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-purple-600 dark:text-purple-400 font-semibold hover:underline cursor-pointer"
        >
          Sign Up for Free
        </button>
      </div>
    </div>
  );
};
