import React from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Clock, Sun, Moon, Calendar, School, BookCheck } from 'lucide-react';

const STUDY_HOUR_OPTIONS = [2, 3, 4, 5, 6, 8];
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const Screen4StudyRoutine: React.FC = () => {
  const { studyRoutine, updateStudyRoutine, nextScreen, prevScreen } = useOnboarding();

  const toggleHoliday = (day: string) => {
    const existing = studyRoutine.holidays || [];
    const nextHolidays = existing.includes(day)
      ? existing.filter((d) => d !== day)
      : [...existing, day];
    updateStudyRoutine({ holidays: nextHolidays });
  };

  return (
    <div className="max-w-2xl mx-auto py-2 sm:py-6 px-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Your Daily Study Routine
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Rankify uses your daily schedule to allocate realistic study blocks and avoid burnout.
        </p>
      </div>

      <div className="space-y-5">
        {/* Daily Self-Study Hours */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <label className="text-xs font-bold text-foreground">Dedicated Self-Study Hours / Day</label>
            </div>
            <span className="text-base font-extrabold text-purple-600 dark:text-purple-400 font-mono">
              {studyRoutine.studyHoursPerDay} Hours
            </span>
          </div>

          <div className="grid grid-cols-6 gap-2">
            {STUDY_HOUR_OPTIONS.map((h) => (
              <button
                type="button"
                key={h}
                onClick={() => updateStudyRoutine({ studyHoursPerDay: h })}
                className={`h-10 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  studyRoutine.studyHoursPerDay === h
                    ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20'
                    : 'bg-slate-100/80 dark:bg-slate-800/80 border-transparent text-foreground hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {h}h
              </button>
            ))}
          </div>
        </div>

        {/* School Timings */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <School className="w-4 h-4 text-blue-600" />
            <label className="text-xs font-bold text-foreground">Regular School Timings</label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[11px] text-muted-foreground block mb-1">Start Time</span>
              <input
                type="time"
                value={studyRoutine.schoolTiming.start}
                onChange={(e) =>
                  updateStudyRoutine({
                    schoolTiming: { ...studyRoutine.schoolTiming, start: e.target.value },
                  })
                }
                className="w-full px-3 h-10 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-transparent text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block mb-1">End Time</span>
              <input
                type="time"
                value={studyRoutine.schoolTiming.end}
                onChange={(e) =>
                  updateStudyRoutine({
                    schoolTiming: { ...studyRoutine.schoolTiming, end: e.target.value },
                  })
                }
                className="w-full px-3 h-10 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-transparent text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Coaching / Tuition Timings */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookCheck className="w-4 h-4 text-indigo-600" />
              <label className="text-xs font-bold text-foreground">Attend Coaching or Tuition Classes?</label>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={studyRoutine.coachingTiming.enabled}
                onChange={(e) =>
                  updateStudyRoutine({
                    coachingTiming: { ...studyRoutine.coachingTiming, enabled: e.target.checked },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {studyRoutine.coachingTiming.enabled && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <span className="text-[11px] text-muted-foreground block mb-1">Coaching Starts</span>
                <input
                  type="time"
                  value={studyRoutine.coachingTiming.start}
                  onChange={(e) =>
                    updateStudyRoutine({
                      coachingTiming: { ...studyRoutine.coachingTiming, start: e.target.value },
                    })
                  }
                  className="w-full px-3 h-10 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-transparent text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block mb-1">Coaching Ends</span>
                <input
                  type="time"
                  value={studyRoutine.coachingTiming.end}
                  onChange={(e) =>
                    updateStudyRoutine({
                      coachingTiming: { ...studyRoutine.coachingTiming, end: e.target.value },
                    })
                  }
                  className="w-full px-3 h-10 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-transparent text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Wake and Sleep Schedule */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground mb-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Wake Up Time</span>
              </div>
              <input
                type="time"
                value={studyRoutine.wakeTime}
                onChange={(e) => updateStudyRoutine({ wakeTime: e.target.value })}
                className="w-full px-3 h-10 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-transparent text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground mb-1.5">
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Sleep Time</span>
              </div>
              <input
                type="time"
                value={studyRoutine.sleepTime}
                onChange={(e) => updateStudyRoutine({ sleepTime: e.target.value })}
                className="w-full px-3 h-10 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-transparent text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Holiday Selection */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <label className="text-xs font-bold text-foreground">Weekly Holidays / Off Days</label>
            </div>
            <span className="text-[11px] text-muted-foreground">Select days for intensive revision</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 pt-1">
            {DAYS_OF_WEEK.map((day) => {
              const isHoliday = studyRoutine.holidays.includes(day);
              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => toggleHoliday(day)}
                  className={`h-9 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    isHoliday
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-100/80 dark:bg-slate-800/80 border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Nav Actions */}
      <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-200/60 dark:border-white/10">
        <Button variant="ghost" onClick={prevScreen} className="gap-2 cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
        <Button
          variant="primary"
          onClick={nextScreen}
          className="gap-2 px-6 h-11 rounded-xl font-bold shadow-md shadow-purple-600/20 cursor-pointer"
        >
          <span>Continue to Exams</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
