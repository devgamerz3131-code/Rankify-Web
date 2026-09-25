import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { SettingsView } from './components/SettingsView';
import { AdminDashboardView } from '@/features/admin/AdminDashboardView';
import { StudyReportsView } from '@/features/reports/StudyReportsView';
import { AchievementsModal } from '@/features/achievements/AchievementsModal';
import { ShareCardModal } from '@/components/common/ShareCardModal';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  User,
  Award,
  BookOpen,
  Clock,
  LogOut,
  Shield,
  Cloud,
  Settings as SettingsIcon,
  CheckCircle2,
  BarChart3,
  Share2,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ProfileView: React.FC = () => {
  const { user, signOutUser } = useAuth();
  const { studentDetails, studyRoutine, chapterProgressMap } = useOnboarding();
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'settings' | 'admin'>('overview');
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.email === 'devgamerz3131@gmail.com';

  const handleSignOut = async () => {
    try {
      await signOutUser();
      toast.success('Signed out successfully');
      window.location.reload();
    } catch {
      toast.error('Failed to sign out');
    }
  };

  const totalChapters = 37;
  const completedChapters = Object.values(chapterProgressMap || {}).filter(
    (c) => c.status === 'Completed' || c.completion || c.progressPercentage === 100
  ).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 select-none">
      {/* Profile Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950 text-white border border-purple-500/25 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-2xl border border-white/20 shadow-xl">
              {(studentDetails.name || user?.displayName || 'S').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  {studentDetails.name || user?.displayName || 'Rankify Student'}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                  Verified Candidate
                </span>
                {isAdmin && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/40">
                    Administrator
                  </span>
                )}
              </div>
              <p className="text-xs text-purple-200 mt-0.5">{user?.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShareModal(true)}
              className="text-xs font-bold border-white/20 text-white hover:bg-white/10 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 mr-1.5" />
              <span>Share Milestone</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAchievementsModal(true)}
              className="text-xs font-bold border-white/20 text-white hover:bg-white/10 cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 mr-1.5" />
              <span>Badges</span>
            </Button>

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

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-white/5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'overview'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Academic Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'reports'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Study Reports</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'settings'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          <span>Settings & Backup</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === 'admin'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Admin Console</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 font-mono">
              STAFF
            </span>
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'reports' && <StudyReportsView />}

      {activeTab === 'settings' && <SettingsView />}

      {activeTab === 'admin' && isAdmin && <AdminDashboardView />}

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Diagnostic Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-card/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
              <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                <Award className="w-4 h-4 text-purple-600" />
                Target Score
              </span>
              <div className="text-2xl font-black text-purple-600 font-mono">
                {studentDetails.targetPercentage}%
              </div>
              <p className="text-[10px] text-muted-foreground">CBSE Class 12 Boards</p>
            </div>

            <div className="p-4 rounded-2xl bg-card/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
              <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Completed Chapters
              </span>
              <div className="text-2xl font-black text-foreground font-mono">
                {completedChapters} / {totalChapters}
              </div>
              <p className="text-[10px] text-muted-foreground">Physics, Chem & Maths</p>
            </div>

            <div className="p-4 rounded-2xl bg-card/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
              <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                Daily Routine Target
              </span>
              <div className="text-2xl font-black text-emerald-600 font-mono">
                {studyRoutine.studyHoursPerDay || 4}h
              </div>
              <p className="text-[10px] text-muted-foreground">Allocated study time</p>
            </div>

            <div className="p-4 rounded-2xl bg-card/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
              <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-amber-500" />
                Cloud State
              </span>
              <div className="text-sm font-bold text-amber-600 mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Synced</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Firestore Real-time</p>
            </div>
          </div>

          {/* Academic Details Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card className="p-5 sm:p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-600" />
                <span>Academic Calibration</span>
              </CardTitle>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-muted-foreground">Education Board:</span>
                  <span className="font-bold text-foreground">CBSE (Central Board)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-muted-foreground">Class Curriculum:</span>
                  <span className="font-bold text-foreground">Class 12</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-muted-foreground">Target Stream:</span>
                  <span className="font-bold text-foreground">Science (PCM: 042, 043, 041)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-muted-foreground">Total Official Chapters:</span>
                  <span className="font-bold text-purple-600">37 Chapters</span>
                </div>
              </div>
            </Card>

            <Card className="p-5 sm:p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>Daily Routine & Schedule</span>
              </CardTitle>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-muted-foreground">Wake Up Time:</span>
                  <span className="font-bold text-foreground">{studyRoutine.wakeTime || '06:00'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-muted-foreground">School Timings:</span>
                  <span className="font-bold text-foreground">
                    {studyRoutine.schoolTiming?.start || '08:00'} - {studyRoutine.schoolTiming?.end || '14:00'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-muted-foreground">Daily Study Target:</span>
                  <span className="font-bold text-purple-600">{studyRoutine.studyHoursPerDay || 4} Hours/Day</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-muted-foreground">Sleep Time:</span>
                  <span className="font-bold text-foreground">{studyRoutine.sleepTime || '23:00'}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Modals */}
      <AchievementsModal
        isOpen={showAchievementsModal}
        onClose={() => setShowAchievementsModal(false)}
      />

      <ShareCardModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        studentName={studentDetails.name || user?.displayName || 'Scholar'}
        targetScore={studentDetails.targetPercentage}
        studyMinutes={studyRoutine.studyHoursPerDay * 60 || 180}
        tasksCompleted={3}
        totalTasks={3}
        daysToExam={58}
      />
    </div>
  );
};
