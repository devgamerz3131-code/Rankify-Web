import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Screen1Welcome } from './Screen1Welcome';
import { Screen2StudentDetails } from './Screen2StudentDetails';
import { Screen3SubjectSelection } from './Screen3SubjectSelection';
import { Screen4StudyRoutine } from './Screen4StudyRoutine';
import { Screen5UpcomingExam } from './Screen5UpcomingExam';
import { Screen6LearningStyle } from './Screen6LearningStyle';
import { Screen7SyllabusTracker } from './Screen7SyllabusTracker';
import { Screen8AIPlan } from './Screen8AIPlan';
import { Cloud, Check, Loader2, Sparkles } from 'lucide-react';

const STEP_TITLES = [
  'Welcome',
  'Student Details',
  'Subjects',
  'Study Routine',
  'Upcoming Exam',
  'Learning Style',
  'Syllabus Tracker',
  'AI Study Plan',
];

export const OnboardingContainer: React.FC = () => {
  const { currentScreen, isSaving } = useOnboarding();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground flex flex-col justify-between selection:bg-purple-500 selection:text-white">
      {/* Top Glass Navbar with Progress & Auto-Save Indicator */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/70 dark:bg-slate-950/70 border-b border-slate-200/60 dark:border-white/10 px-4 sm:px-8 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* Logo & Step indicator */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20 font-extrabold text-sm">
              R
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight flex items-center gap-2">
                <span>Rankify Onboarding</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 font-bold">
                  Step {currentScreen} of 8
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground font-medium hidden sm:block">
                {STEP_TITLES[currentScreen - 1]}
              </div>
            </div>
          </div>

          {/* Stepper Dots (Desktop/Tablet) */}
          <div className="hidden md:flex items-center gap-1.5">
            {STEP_TITLES.map((title, i) => {
              const stepNumber = i + 1;
              const isPast = stepNumber < currentScreen;
              const isCurrent = stepNumber === currentScreen;
              return (
                <div key={title} className="flex items-center">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isCurrent
                        ? 'w-7 bg-purple-600 shadow-sm shadow-purple-500/40'
                        : isPast
                        ? 'w-2 bg-purple-400 dark:bg-purple-600/60'
                        : 'w-2 bg-slate-200 dark:bg-slate-800'
                    }`}
                    title={`Step ${stepNumber}: ${title}`}
                  />
                </div>
              );
            })}
          </div>

          {/* Auto-Save & Cloud Status HUD */}
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            {isSaving ? (
              <span className="inline-flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="text-[11px] font-semibold">Auto-saving...</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold">Saved</span>
              </span>
            )}
            <Cloud className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* Mobile Linear Progress Line */}
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 mt-2.5 rounded-full overflow-hidden md:hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-300 rounded-full"
            style={{ width: `${(currentScreen / 8) * 100}%` }}
          />
        </div>
      </header>

      {/* Main Screen Content with Framer Motion AnimatePresence */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full"
          >
            {currentScreen === 1 && <Screen1Welcome />}
            {currentScreen === 2 && <Screen2StudentDetails />}
            {currentScreen === 3 && <Screen3SubjectSelection />}
            {currentScreen === 4 && <Screen4StudyRoutine />}
            {currentScreen === 5 && <Screen5UpcomingExam />}
            {currentScreen === 6 && <Screen6LearningStyle />}
            {currentScreen === 7 && <Screen7SyllabusTracker />}
            {currentScreen === 8 && <Screen8AIPlan />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Subtle Apple-style Footer */}
      <footer className="w-full py-4 text-center text-[11px] text-muted-foreground border-t border-slate-200/40 dark:border-white/5">
        <div className="flex items-center justify-center gap-2 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
          <span>Rankify Intelligent Academic Engine • Auto-persisted to local cache & cloud Firestore</span>
        </div>
      </footer>
    </div>
  );
};
