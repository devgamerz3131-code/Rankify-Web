import React from 'react';
import { motion } from 'framer-motion';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, User, Award, CheckCircle2, Clock, Calendar, Sparkles, BookOpen } from 'lucide-react';

const STUDY_HOUR_OPTIONS = [3, 4, 5, 6, 8];

export const Screen2StudentDetails: React.FC = () => {
  const {
    studentDetails,
    updateStudentDetails,
    studyRoutine,
    updateStudyRoutine,
    upcomingExam,
    updateUpcomingExam,
    setScreen,
    prevScreen,
  } = useOnboarding();

  const handlePercentageChange = (pct: number) => {
    updateStudentDetails({ targetPercentage: pct });
  };

  const isValid = studentDetails.name.trim().length > 0;

  return (
    <div className="max-w-2xl mx-auto py-2 sm:py-6 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          CBSE Class 12 PCM Setup
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Lock in your study routine and board exam target for the official 2026–2027 curriculum.
        </p>
      </div>

      <div className="space-y-6">
        {/* Full Name */}
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs">
          <label className="flex items-center gap-2 text-xs font-bold text-foreground mb-2">
            <User className="w-4 h-4 text-purple-600" />
            <span>Student Full Name</span>
          </label>
          <input
            type="text"
            value={studentDetails.name}
            onChange={(e) => updateStudentDetails({ name: e.target.value })}
            placeholder="e.g. Aarav Sharma"
            className="w-full px-4 h-11 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-transparent focus:border-purple-500 focus:bg-background text-sm font-medium text-foreground focus:outline-none transition"
          />
        </div>

        {/* Locked Board, Class & Stream Display */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-slate-900/10 border border-purple-500/30 backdrop-blur-xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-600 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Target Curriculum Locked</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold">
              Official Syllabus
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-purple-200 dark:border-purple-500/20 text-center">
              <div className="text-[10px] text-muted-foreground font-semibold">Board</div>
              <div className="text-sm font-extrabold text-foreground mt-0.5">CBSE</div>
            </div>
            <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-purple-200 dark:border-purple-500/20 text-center">
              <div className="text-[10px] text-muted-foreground font-semibold">Class</div>
              <div className="text-sm font-extrabold text-foreground mt-0.5">Class 12</div>
            </div>
            <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-purple-200 dark:border-purple-500/20 text-center">
              <div className="text-[10px] text-muted-foreground font-semibold">Stream</div>
              <div className="text-sm font-extrabold text-purple-600 mt-0.5">PCM Only</div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs font-medium text-muted-foreground pt-1">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
              Physics (14 Ch)
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
              Chemistry (12 Ch)
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
              Maths (14 Ch)
            </span>
          </div>
        </div>

        {/* Daily Available Study Hours */}
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <span>Daily Available Self-Study Time</span>
            </label>
            <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
              {studyRoutine.studyHoursPerDay} Hours / Day
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2 pt-1">
            {STUDY_HOUR_OPTIONS.map((hours) => {
              const isSelected = studyRoutine.studyHoursPerDay === hours;
              return (
                <button
                  type="button"
                  key={hours}
                  onClick={() => updateStudyRoutine({ studyHoursPerDay: hours })}
                  className={`py-2.5 rounded-xl font-bold text-xs sm:text-sm border transition cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/25'
                      : 'bg-slate-100 dark:bg-slate-800 text-foreground border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {hours} hrs
                </button>
              );
            })}
          </div>
        </div>

        {/* Target Percentage */}
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600" />
              <span>Target Board Percentage</span>
            </label>
            <span className="text-sm font-extrabold font-mono text-purple-600 dark:text-purple-400">
              {studentDetails.targetPercentage}%
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 pt-1">
            {[88, 92, 95, 98].map((pct) => {
              const isSelected = studentDetails.targetPercentage === pct;
              return (
                <button
                  type="button"
                  key={pct}
                  onClick={() => handlePercentageChange(pct)}
                  className={`py-2 rounded-xl font-bold text-xs border transition cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-foreground border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {pct}%
                </button>
              );
            })}
          </div>
        </div>

        {/* Exam Date */}
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs space-y-2">
          <label className="text-xs font-bold text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span>Target Examination Date</span>
          </label>
          <input
            type="date"
            value={upcomingExam.examDate}
            onChange={(e) => updateUpcomingExam({ examDate: e.target.value })}
            className="w-full px-4 h-11 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-transparent focus:border-purple-500 focus:bg-background text-sm font-medium text-foreground focus:outline-none transition"
          />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-200/60 dark:border-white/10">
        <Button variant="ghost" onClick={prevScreen} className="gap-2 cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
        <Button
          variant="primary"
          onClick={() => setScreen(7)}
          disabled={!isValid}
          className="gap-2 px-6 h-12 rounded-xl font-bold shadow-lg shadow-purple-600/25 cursor-pointer text-sm"
        >
          <span>Begin Chapter Assessment</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
