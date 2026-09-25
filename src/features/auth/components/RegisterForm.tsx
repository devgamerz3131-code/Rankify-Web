import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterFormData } from '../schemas';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Mail, Lock, GraduationCap } from '@/icons';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const { signUp, signInWithGooglePopup, isLoading, error } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
      cbseClass: 10,
      role: 'student',
    },
  });

  const selectedClass = watch('cbseClass');
  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await signUp(data.email, data.password, data.displayName, data.role, data.cbseClass);
    } catch {
      // Error handled in AuthContext
    }
  };

  return (
    <div className="space-y-4">
      {/* Google Sign-up */}
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
        Sign up with Google
      </button>

      <div className="relative flex items-center justify-center my-2">
        <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
        <span className="bg-card px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground absolute">
          Or register with email
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
      {/* Name */}
      <div className="relative">
        <User className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
        <Input
          {...register('displayName')}
          placeholder="Student Name"
          type="text"
          className="pl-10"
          error={errors.displayName?.message}
        />
      </div>

      {/* Email */}
      <div className="relative">
        <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
        <Input
          {...register('email')}
          placeholder="student@example.com"
          type="email"
          className="pl-10"
          error={errors.email?.message}
        />
      </div>

      {/* CBSE Class selection pills */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <GraduationCap className="h-3.5 w-3.5" />
          Select CBSE Class
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[9, 10, 11, 12].map((cls) => (
            <button
              type="button"
              key={cls}
              onClick={() => setValue('cbseClass', cls)}
              className={`h-9 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                selectedClass === cls
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-foreground border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Class {cls}
            </button>
          ))}
        </div>
      </div>

      {/* Role selection: Student or Admin */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground">Account Role</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setValue('role', 'student')}
            className={`h-8 rounded-xl text-xs font-medium border transition cursor-pointer ${
              selectedRole === 'student'
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-slate-100 dark:bg-slate-800 text-foreground border-transparent'
            }`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => setValue('role', 'admin')}
            className={`h-8 rounded-xl text-xs font-medium border transition cursor-pointer ${
              selectedRole === 'admin'
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-slate-100 dark:bg-slate-800 text-foreground border-transparent'
            }`}
          >
            Admin / Educator
          </button>
        </div>
      </div>

      {/* Password */}
      <div className="relative">
        <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
        <Input
          {...register('password')}
          placeholder="Password (min 6 characters)"
          type="password"
          className="pl-10"
          error={errors.password?.message}
        />
      </div>

      {/* Confirm Password */}
      <div className="relative">
        <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
        <Input
          {...register('confirmPassword')}
          placeholder="Confirm Password"
          type="password"
          className="pl-10"
          error={errors.confirmPassword?.message}
        />
      </div>

      <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isLoading}>
        Create Rankify Account
      </Button>

      <div className="text-center text-xs text-muted-foreground pt-1">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-purple-600 dark:text-purple-400 font-semibold hover:underline cursor-pointer"
        >
          Sign In
        </button>
      </div>
    </form>
  </div>
  );
};
