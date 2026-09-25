import React from 'react';
import { motion } from 'framer-motion';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, ShieldCheck, Zap, BrainCircuit, BookOpen } from 'lucide-react';

export const Screen1Welcome: React.FC = () => {
  const { nextScreen, studentDetails, updateStudentDetails } = useOnboarding();

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-8 px-4">
      {/* Hero Badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-center mb-6"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 dark:bg-purple-400/10 border border-purple-500/20 backdrop-blur-md text-xs font-semibold text-purple-600 dark:text-purple-300">
          <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
          <span>Intelligent Academic OS for Classes 6–12</span>
        </div>
      </motion.div>

      {/* Main Title & Subtitle */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-center space-y-4 mb-10"
      >
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
          Welcome to <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent">Rankify</span>
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          The Apple-grade study planning system that diagnoses your weak syllabus chapters, balances your daily school routine, and generates a guaranteed board exam roadmap.
        </p>
      </motion.div>

      {/* Quick Name Greeting Input */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-10 max-w-md mx-auto"
      >
        <label className="block text-xs font-semibold text-muted-foreground mb-2 text-center uppercase tracking-wider">
          What should we call you?
        </label>
        <div className="relative">
          <input
            type="text"
            value={studentDetails.name}
            onChange={(e) => updateStudentDetails({ name: e.target.value })}
            placeholder="Enter your first name..."
            className="w-full text-center text-lg font-semibold h-13 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/90 dark:border-white/10 shadow-lg shadow-purple-500/5 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-xl transition"
          />
        </div>
      </motion.div>

      {/* 3 Core Value Pillars */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10"
      >
        <div className="p-5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/10 backdrop-blur-xl shadow-sm hover:shadow-md transition">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-foreground mb-1">Standardized Curriculums</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Full CBSE, RBSE, ICSE & State Board syllabi with verified chapter-by-chapter weightage.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/10 backdrop-blur-xl shadow-sm hover:shadow-md transition">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-foreground mb-1">Weak Chapter Recovery</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Self-evaluates your confidence on every single topic to prioritize revision where you need it most.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/10 backdrop-blur-xl shadow-sm hover:shadow-md transition">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-foreground mb-1">AI Study Engine</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Creates adaptive 7-day daily tasks and 4-week milestones calibrated to your school timings.
          </p>
        </div>
      </motion.div>

      {/* Action Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="flex flex-col items-center gap-3"
      >
        <Button
          variant="primary"
          size="lg"
          onClick={nextScreen}
          className="w-full sm:w-80 h-13 rounded-2xl text-base font-bold shadow-xl shadow-purple-600/25 cursor-pointer"
        >
          <span>Continue Setup</span>
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Zero cloud loss • Real-time background sync engine active</span>
        </div>
      </motion.div>
    </div>
  );
};
