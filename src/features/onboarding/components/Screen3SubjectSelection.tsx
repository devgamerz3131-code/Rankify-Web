import React, { useMemo } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { getSubjectsForClassAndBoard } from '@/services/syllabus-templates';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Circle } from 'lucide-react';

export const Screen3SubjectSelection: React.FC = () => {
  const { studentDetails, selectedSubjectIds, toggleSubject, setSelectedSubjects, nextScreen, prevScreen } =
    useOnboarding();

  const availableSubjects = useMemo(() => {
    return getSubjectsForClassAndBoard(
      studentDetails.classNumber,
      studentDetails.board,
      studentDetails.stream
    );
  }, [studentDetails.classNumber, studentDetails.board, studentDetails.stream]);

  const selectAll = () => {
    setSelectedSubjects(availableSubjects.map((s) => s.id));
  };

  return (
    <div className="max-w-2xl mx-auto py-2 sm:py-6 px-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Select Your Subjects
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Showing subjects calibrated for <strong>CBSE Class 12 (SCIENCE PCM)</strong>.
        </p>
      </div>

      {/* Quick Select Bar */}
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-xs font-semibold text-muted-foreground">
          {selectedSubjectIds.length} of {availableSubjects.length} subjects selected
        </span>
        <button
          type="button"
          onClick={selectAll}
          className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
        >
          Select All Core Subjects
        </button>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-8">
        {availableSubjects.map((sub) => {
          const isSelected = selectedSubjectIds.includes(sub.id);
          return (
            <button
              type="button"
              key={sub.id}
              onClick={() => toggleSubject(sub.id)}
              className={`p-4 rounded-2xl border text-left transition-all relative flex items-center justify-between cursor-pointer ${
                isSelected
                  ? 'border-purple-600 bg-purple-500/5 dark:bg-purple-950/30 shadow-sm ring-1 ring-purple-600'
                  : 'border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs font-bold text-sm shrink-0"
                  style={{ backgroundColor: sub.color || '#6366f1' }}
                >
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground flex items-center gap-2">
                    <span>{sub.name}</span>
                    {sub.isCore && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300">
                        Core
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                    Subject Code: {sub.code || '001'}
                  </div>
                </div>
              </div>

              <div className="shrink-0 ml-2">
                {isSelected ? (
                  <CheckCircle2 className="w-5 h-5 text-purple-600" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Nav Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200/60 dark:border-white/10">
        <Button variant="ghost" onClick={prevScreen} className="gap-2 cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
        <Button
          variant="primary"
          onClick={nextScreen}
          disabled={selectedSubjectIds.length === 0}
          className="gap-2 px-6 h-11 rounded-xl font-bold shadow-md shadow-purple-600/20 cursor-pointer"
        >
          <span>Continue to Routine</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
