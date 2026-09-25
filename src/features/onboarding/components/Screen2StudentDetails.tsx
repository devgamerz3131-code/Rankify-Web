import React from 'react';
import { motion } from 'framer-motion';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { BoardType, ClassNumber, MediumType, PreferredLanguageType } from '@/types/onboarding';
import { ArrowLeft, ArrowRight, User, Award, CheckCircle2 } from 'lucide-react';

const BOARDS: { id: BoardType; name: string; desc: string }[] = [
  { id: 'CBSE', name: 'CBSE', desc: 'Central Board of Secondary Education' },
  { id: 'ICSE', name: 'ICSE', desc: 'Council for the Indian School Certificate Exams' },
  { id: 'RBSE', name: 'RBSE', desc: 'Rajasthan Board of Secondary Education' },
  { id: 'State Board', name: 'State Board', desc: 'State Government Education Board' },
];

const CLASSES: ClassNumber[] = [6, 7, 8, 9, 10, 11, 12];

const STREAMS = [
  { id: 'science-pcm', name: 'Science PCM', desc: 'Physics, Chemistry, Mathematics' },
  { id: 'science-pcb', name: 'Science PCB', desc: 'Physics, Chemistry, Biology' },
  { id: 'commerce', name: 'Commerce', desc: 'Accountancy, Business Studies, Economics' },
  { id: 'arts', name: 'Humanities / Arts', desc: 'History, Political Science, Geography' },
];

export const Screen2StudentDetails: React.FC = () => {
  const { studentDetails, updateStudentDetails, nextScreen, prevScreen } = useOnboarding();

  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateStudentDetails({ targetPercentage: Number(e.target.value) });
  };

  const getTargetBadge = (pct: number) => {
    if (pct >= 95) return { label: 'Top 1% Board Topper', color: 'text-purple-600 bg-purple-500/10 border-purple-500/30' };
    if (pct >= 90) return { label: 'Distinction Honors', color: 'text-indigo-600 bg-indigo-500/10 border-indigo-500/30' };
    if (pct >= 80) return { label: 'First Class Academic', color: 'text-blue-600 bg-blue-500/10 border-blue-500/30' };
    return { label: 'Foundation Mastery', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30' };
  };

  const badge = getTargetBadge(studentDetails.targetPercentage);
  const isValid = studentDetails.name.trim().length > 0;

  return (
    <div className="max-w-2xl mx-auto py-2 sm:py-6 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Student Profile & Academic Target
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Provide your current class, education board, and exam target for curriculum calibration.
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

        {/* Board Selection */}
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs space-y-2">
          <label className="text-xs font-bold text-foreground block">
            Select Your Education Board
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {BOARDS.map((b) => {
              const selected = studentDetails.board === b.id;
              return (
                <button
                  type="button"
                  key={b.id}
                  onClick={() => updateStudentDetails({ board: b.id })}
                  className={`p-3 rounded-xl border text-left transition relative cursor-pointer ${
                    selected
                      ? 'border-purple-600 bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/40 text-foreground hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="font-extrabold text-sm flex items-center justify-between">
                    <span>{b.name}</span>
                    {selected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <div className={`text-[10px] mt-0.5 line-clamp-1 ${selected ? 'text-purple-100' : 'text-muted-foreground'}`}>
                    {b.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Class Selection */}
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground">Select Current Class</label>
            <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
              Class {studentDetails.classNumber} Curriculum
            </span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {CLASSES.map((cls) => {
              const selected = studentDetails.classNumber === cls;
              return (
                <button
                  type="button"
                  key={cls}
                  onClick={() => updateStudentDetails({ classNumber: cls })}
                  className={`h-11 rounded-xl font-bold text-sm transition border cursor-pointer ${
                    selected
                      ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/25 scale-105'
                      : 'bg-slate-100/80 dark:bg-slate-800/80 border-transparent text-foreground hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cls}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stream Selector (If Class 11 or 12) */}
        {studentDetails.classNumber >= 11 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs space-y-2"
          >
            <label className="text-xs font-bold text-foreground block">
              Senior Secondary Stream
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STREAMS.map((s) => {
                const selected = studentDetails.stream === s.id;
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => updateStudentDetails({ stream: s.id as any })}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      selected
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-950 dark:text-purple-200'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/40 text-foreground'
                    }`}
                  >
                    <div className="font-bold text-xs">{s.name}</div>
                    <div className="text-[11px] text-muted-foreground">{s.desc}</div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Medium & Preferred Language */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Medium */}
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs space-y-2">
            <label className="text-xs font-bold text-foreground block">School Medium</label>
            <div className="grid grid-cols-2 gap-2">
              {(['English', 'Hindi'] as MediumType[]).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => updateStudentDetails({ medium: m })}
                  className={`h-9 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    studentDetails.medium === m
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-slate-100/80 dark:bg-slate-800/80 border-transparent text-foreground hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Language */}
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs space-y-2">
            <label className="text-xs font-bold text-foreground block">Preferred Study Language</label>
            <div className="grid grid-cols-3 gap-2">
              {(['English', 'Hindi', 'Hinglish'] as PreferredLanguageType[]).map((l) => (
                <button
                  type="button"
                  key={l}
                  onClick={() => updateStudentDetails({ preferredLanguage: l })}
                  className={`h-9 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    studentDetails.preferredLanguage === l
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-slate-100/80 dark:bg-slate-800/80 border-transparent text-foreground hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Target Percentage Slider */}
        <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600" />
              <label className="text-xs font-bold text-foreground">Target Exam Percentage</label>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                {badge.label}
              </span>
              <span className="text-xl font-extrabold text-foreground font-mono">
                {studentDetails.targetPercentage}%
              </span>
            </div>
          </div>

          <input
            type="range"
            min="60"
            max="100"
            step="1"
            value={studentDetails.targetPercentage}
            onChange={handlePercentageChange}
            className="w-full accent-purple-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
          />

          <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
            <span>60% (Pass)</span>
            <span>75% (First Div)</span>
            <span>85% (Distinction)</span>
            <span>95%+ (Topper)</span>
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
          disabled={!isValid}
          className="gap-2 px-6 h-11 rounded-xl font-bold shadow-md shadow-purple-600/20 cursor-pointer"
        >
          <span>Continue to Subjects</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
