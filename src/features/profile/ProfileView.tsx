import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  User,
  Award,
  BookOpen,
  Calendar,
  Clock,
  Sparkles,
  LogOut,
  RotateCcw,
  CheckCircle2,
  Shield,
  Cloud,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ProfileView: React.FC = () => {
  const { user, signOutUser } = useAuth();
  const { studentDetails, studyRoutine, upcomingExam, setScreen } = useOnboarding();

  const handleSignOut = async () => {
    try {
      await signOutUser();
      toast.success('Signed out successfully');
      window.location.reload();
    } catch (e) {
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950 text-white border border-purple-500/25 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl border border-white/20 shadow-xl">
              {(studentDetails.name || user?.displayName || 'S').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                  {studentDetails.name || user?.displayName || 'Rankify Student'}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                  Verified
                </span>
              </div>
              <p className="text-xs text-purple-200 mt-0.5">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="text-xs font-bold border-white/20 text-white hover:bg-white/10 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              <span>Log Out</span>
            </Button>
          </div>
        </div>

        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* Academic Details Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-5 sm:p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-600" />
            <span>Academic Calibration</span>
          </CardTitle>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-muted-foreground">Education Board:</span>
              <span className="font-bold text-foreground">{studentDetails.board}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-muted-foreground">Class Curriculum:</span>
              <span className="font-bold text-foreground">Class {studentDetails.classNumber}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-muted-foreground">Target Percentage:</span>
              <span className="font-bold text-purple-600 font-mono">{studentDetails.targetPercentage}%</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-muted-foreground">Medium / Language:</span>
              <span className="font-bold text-foreground">
                {studentDetails.medium} ({studentDetails.preferredLanguage})
              </span>
            </div>
          </div>
        </Card>

        {/* Study Routine Summary */}
        <Card className="p-5 sm:p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <span>Daily Routine & Timing</span>
          </CardTitle>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-muted-foreground">Planned Study Hours:</span>
              <span className="font-bold text-foreground">{studyRoutine.studyHoursPerDay} hrs / day</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-muted-foreground">School Timings:</span>
              <span className="font-bold text-foreground">
                {studyRoutine.schoolTiming.start} - {studyRoutine.schoolTiming.end}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-muted-foreground">Upcoming Target Exam:</span>
              <span className="font-bold text-foreground">
                {upcomingExam.examType} ({upcomingExam.examDate})
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-muted-foreground">Cloud Sync Engine:</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <Cloud className="w-3.5 h-3.5" />
                <span>Active & Synced</span>
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
