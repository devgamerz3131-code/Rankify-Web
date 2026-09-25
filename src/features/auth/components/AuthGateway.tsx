import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { Sparkles, Shield, BrainCircuit, BookOpen, Layers } from 'lucide-react';

export const AuthGateway: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password'>('login');
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground flex flex-col justify-between selection:bg-purple-500 selection:text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="w-full px-6 sm:px-12 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white font-extrabold text-base shadow-lg shadow-purple-500/25">
            R
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Rankify
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground block -mt-1 tracking-wider uppercase">
              Web OS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">
            {mode === 'login' ? "Don't have an account?" : 'Already a student?'}
          </span>
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </header>

      {/* Main Split Grid */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-4 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        {/* Left Column: Brand & Apple-quality value props */}
        <div className="lg:col-span-6 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-bold text-purple-600 dark:text-purple-300"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
            <span>AI Syllabus Balancing Engine</span>
          </motion.div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.12]">
            Transform your board exam preparation with{' '}
            <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent">
              adaptive precision.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Rankify analyzes your syllabus chapters, computes weak topics, balances your daily school routine, and generates a personalized study roadmap with spaced repetition.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/10 backdrop-blur-xl">
              <BookOpen className="w-4 h-4 text-purple-600 mb-1.5" />
              <div className="font-bold text-xs text-foreground">Complete Syllabi</div>
              <div className="text-[11px] text-muted-foreground">CBSE, ICSE, RBSE & State Boards</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/10 backdrop-blur-xl">
              <BrainCircuit className="w-4 h-4 text-indigo-600 mb-1.5" />
              <div className="font-bold text-xs text-foreground">AI Study Planning</div>
              <div className="text-[11px] text-muted-foreground">Priority queues & daily targets</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/10 backdrop-blur-xl">
              <Layers className="w-4 h-4 text-blue-600 mb-1.5" />
              <div className="font-bold text-xs text-foreground">Chapter Tracker</div>
              <div className="text-[11px] text-muted-foreground">Confidence & completion audit</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/10 backdrop-blur-xl">
              <Shield className="w-4 h-4 text-emerald-600 mb-1.5" />
              <div className="font-bold text-xs text-foreground">Offline Resilience</div>
              <div className="text-[11px] text-muted-foreground">Local cache & automatic cloud sync</div>
            </div>
          </div>
        </div>

        {/* Right Column: Glass Authentication Card */}
        <div className="lg:col-span-6 flex justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/90 dark:border-white/10 shadow-2xl backdrop-blur-2xl"
          >
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
                {mode === 'login' && 'Student Sign In'}
                {mode === 'register' && 'Create Free Account'}
                {mode === 'forgot-password' && 'Reset Password'}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {mode === 'login' && 'Log in to continue your syllabus roadmap'}
                {mode === 'register' && 'Join Rankify and personalize your study plan'}
                {mode === 'forgot-password' && 'Enter your email to receive recovery instructions'}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {mode === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <LoginForm
                    onSwitchToRegister={() => setMode('register')}
                    onSwitchToForgot={() => setMode('forgot-password')}
                  />
                </motion.div>
              )}

              {mode === 'register' && (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <RegisterForm onSwitchToLogin={() => setMode('login')} />
                </motion.div>
              )}

              {mode === 'forgot-password' && (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <ForgotPasswordForm onSwitchToLogin={() => setMode('login')} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-muted-foreground border-t border-slate-200/40 dark:border-white/5 z-10">
        Rankify Web • Production Educational Architecture
      </footer>
    </div>
  );
};
