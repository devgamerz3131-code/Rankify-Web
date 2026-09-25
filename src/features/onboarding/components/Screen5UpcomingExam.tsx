import React, { useMemo } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { ExamType } from '@/types/onboarding';
import { ArrowLeft, ArrowRight, Target, CalendarDays, Flame, CheckCircle2 } from 'lucide-react';

const EXAM_TYPES: { id: ExamType; title: string; subtitle: string }[] = [
  { id: 'Boards', title: 'Board Examinations', subtitle: 'Official 10th or 12th Annual Board Exams' },
  { id: 'Half Yearly', title: 'Half-Yearly / Mid-Terms', subtitle: 'Mid-session school syllabus evaluation' },
  { id: 'School Test', title: 'School Unit Test', subtitle: 'Upcoming periodic test or monthly assessment' },
  { id: 'JEE', title: 'JEE Main / Advanced', subtitle: 'National engineering entrance examination' },
  { id: 'NEET', title: 'NEET UG', subtitle: 'National medical entrance examination' },
  { id: 'Custom', title: 'Custom Exam Target', subtitle: 'Specify your own exam name and date' },
];

export const Screen5UpcomingExam: React.FC = () => {
  const { upcomingExam, updateUpcomingExam, nextScreen, prevScreen } = useOnboarding();

  const daysRemaining = useMemo(() => {
    if (!upcomingExam.examDate) return 60;
    const target = new Date(upcomingExam.examDate).getTime();
    const today = new Date().setHours(0, 0, 0, 0);
    const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [upcomingExam.examDate]);

  return (
    <div className="max-w-2xl mx-auto py-2 sm:py-6 px-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Upcoming Examination Target
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Set your primary milestone date. Rankify will back-solve your syllabus velocity to guarantee completion with revision buffer.
        </p>
      </div>

      <div className="space-y-6">
        {/* Exam Type Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EXAM_TYPES.map((ex) => {
            const isSelected = upcomingExam.examType === ex.id;
            return (
              <button
                type="button"
                key={ex.id}
                onClick={() => updateUpcomingExam({ examType: ex.id })}
                className={`p-4 rounded-2xl border text-left transition relative cursor-pointer ${
                  isSelected
                    ? 'border-purple-600 bg-purple-500/5 dark:bg-purple-950/40 ring-1 ring-purple-600 shadow-sm'
                    : 'border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-sm text-foreground">{ex.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{ex.subtitle}</div>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 ml-2" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Exam Name Input */}
        {upcomingExam.examType === 'Custom' && (
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs">
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Specify Custom Exam Name
            </label>
            <input
              type="text"
              value={upcomingExam.customExamName || ''}
              onChange={(e) => updateUpcomingExam({ customExamName: e.target.value })}
              placeholder="e.g. Pre-Board 1 / Olympiad / KVPY"
              className="w-full px-4 h-11 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-transparent focus:border-purple-500 text-sm font-medium text-foreground focus:outline-none"
            />
          </div>
        )}

        {/* Exam Date Picker with Live Countdown Badge */}
        <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-purple-600" />
                <label className="text-xs font-bold text-foreground">Examination Date</label>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Exact or estimated date when your tests commence.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs font-bold text-purple-600 dark:text-purple-300">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>{daysRemaining} Days Countdown</span>
            </div>
          </div>

          <input
            type="date"
            value={upcomingExam.examDate}
            onChange={(e) => updateUpcomingExam({ examDate: e.target.value })}
            className="w-full px-4 h-12 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-transparent focus:border-purple-500 text-sm font-semibold text-foreground focus:outline-none"
          />

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium">
              <Target className="w-3.5 h-3.5 text-purple-600" />
              Syllabus Completion Deadline
            </span>
            <span className="font-bold text-foreground">
              {daysRemaining > 15 ? `${daysRemaining - 15} days (with 15d revision buffer)` : 'Immediate Sprint'}
            </span>
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
          <span>Continue to Learning Style</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
