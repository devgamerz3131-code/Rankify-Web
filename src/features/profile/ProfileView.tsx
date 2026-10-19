import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useSync } from '@/contexts/SyncContext';
import { SettingsView } from './components/SettingsView';
import { AppearanceLabView } from './components/AppearanceLabView';
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
  LayoutGrid,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Database,
  ShieldCheck,
  AlertTriangle,
  WifiOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { TOTAL_OFFICIAL_CHAPTERS } from '@/services/chapter-service';

export const ProfileView: React.FC = () => {
  const { user, signOutUser } = useAuth();
  const { setActiveTab: setGlobalNavTab } = useNavigation();
  const { studentDetails, studyRoutine, chapterProgressMap } = useOnboarding();
  const {
    syncAllUnified,
    isSyncingAll,
    syncStatus,
    pendingCount,
    lastError,
    lastSyncedAt,
    nextAutoSyncMinutes,
  } = useSync();
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'settings' | 'appearance' | 'admin'>('overview');
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === 'admin' || user?.email === 'devgamerz3131@gmail.com';

  const updateTabsFade = useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;
    el.setAttribute('data-fade-left', el.scrollLeft > 4 ? 'true' : 'false');
    el.setAttribute(
      'data-fade-right',
      el.scrollLeft + el.clientWidth < el.scrollWidth - 4 ? 'true' : 'false'
    );
  }, []);

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const activeBtn = el.querySelector('[data-active="true"]') as HTMLElement | null;
    if (activeBtn && el.scrollWidth > el.clientWidth) {
      const targetLeft = activeBtn.offsetLeft - el.clientWidth / 2 + activeBtn.clientWidth / 2;
      el.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
    }
    updateTabsFade();
    window.addEventListener('resize', updateTabsFade);
    return () => window.removeEventListener('resize', updateTabsFade);
  }, [activeTab, updateTabsFade]);

  const handleSyncAllData = async () => {
    try {
      const res = await syncAllUnified({ isManual: true });
      if (res.success) {
        toast.success('Synced to cloud');
      } else {
        toast.error(res.error || 'Failed to sync data');
      }
    } catch {
      toast.error('Sync encountered an error');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      toast.success('Signed out successfully');
      window.location.reload();
    } catch {
      toast.error('Failed to sign out');
    }
  };

  const totalChapters = Object.keys(chapterProgressMap || {}).length || TOTAL_OFFICIAL_CHAPTERS;
  const completedChapters = Object.values(chapterProgressMap || {}).filter(
    (c) => c.status === 'Completed' || c.completion || c.progressPercentage === 100
  ).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 select-none">
      {/* Profile Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950 text-white border border-purple-500/25 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-2xl border border-white/20 shadow-xl shrink-0">
              {(studentDetails.name || user?.displayName || 'S').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white whitespace-nowrap truncate">
                  {studentDetails.name || user?.displayName || 'Rankify Student'}
                </h1>
                <p className="text-xs text-purple-200 md:hidden truncate">{user?.email}</p>
                {isAdmin && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/40 whitespace-nowrap shrink-0">
                      Administrator
                    </span>
                  </div>
                )}
              </div>
              <p className="hidden md:block text-xs text-purple-200 mt-0.5 truncate">{user?.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShareModal(true)}
              className="text-xs font-bold border-white/20 text-white hover:bg-white/10 cursor-pointer whitespace-nowrap shrink-0 min-h-[44px] lg:min-h-0 w-full sm:w-auto"
            >
              <Share2 className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              <span>Share Milestone</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAchievementsModal(true)}
              className="text-xs font-bold border-white/20 text-white hover:bg-white/10 cursor-pointer whitespace-nowrap shrink-0 min-h-[44px] lg:min-h-0 w-full sm:w-auto"
            >
              <Award className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              <span>Badges</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="text-xs font-bold border-white/20 text-white hover:bg-white/10 cursor-pointer whitespace-nowrap shrink-0 min-h-[44px] lg:min-h-0 w-full sm:w-auto"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              <span>Log Out</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div
        ref={tabsRef}
        onScroll={updateTabsFade}
        className="flex items-center gap-2 p-1.5 bg-muted rounded-2xl border border-border overflow-x-auto flex-nowrap snap-x snap-mandatory scrollbar-none scroll-edge-fade min-w-0"
      >
        <button
          data-active={activeTab === 'overview'}
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap snap-start min-h-[44px] lg:min-h-0 ${
            activeTab === 'overview'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-foreground/80 hover:text-foreground hover:bg-card'
          }`}
        >
          <User className="w-4 h-4 shrink-0" />
          <span>Academic Profile</span>
        </button>

        <button
          data-active={activeTab === 'reports'}
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap snap-start min-h-[44px] lg:min-h-0 ${
            activeTab === 'reports'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-foreground/80 hover:text-foreground hover:bg-card'
          }`}
        >
          <BarChart3 className="w-4 h-4 shrink-0" />
          <span>Study Reports</span>
        </button>

        <button
          data-active={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap snap-start min-h-[44px] lg:min-h-0 ${
            activeTab === 'settings'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-foreground/80 hover:text-foreground hover:bg-card'
          }`}
        >
          <SettingsIcon className="w-4 h-4 shrink-0" />
          <span>Settings & Backup</span>
        </button>

        {isAdmin && (
          <button
            data-active={activeTab === 'admin'}
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap snap-start min-h-[44px] lg:min-h-0 ${
              activeTab === 'admin'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
            }`}
          >
            <Shield className="w-4 h-4 shrink-0" />
            <span>Admin Console</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 font-mono whitespace-nowrap shrink-0">
              STAFF
            </span>
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'appearance' && <AppearanceLabView />}

      {activeTab === 'reports' && <StudyReportsView />}

      {activeTab === 'settings' && <SettingsView />}

      {activeTab === 'admin' && isAdmin && <AdminDashboardView />}

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-1">
              <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                <Award className="w-4 h-4 text-purple-600" />
                Target Score
              </span>
              <div className="text-2xl font-black text-purple-600 font-mono">
                {studentDetails.targetPercentage}%
              </div>
              <p className="text-[10px] text-muted-foreground">CBSE Class 12 Boards</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-1">
              <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Completed Chapters
              </span>
              <div className="text-2xl font-black text-foreground font-mono">
                {completedChapters} / {totalChapters}
              </div>
              <p className="text-[10px] text-muted-foreground">Physics, Chem & Maths</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-1">
              <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                Daily Routine Target
              </span>
              <div className="text-2xl font-black text-emerald-600 font-mono">
                {studyRoutine.studyHoursPerDay || 4}h
              </div>
              <p className="text-[10px] text-muted-foreground">Allocated study time</p>
            </div>

            <div
              onClick={handleSyncAllData}
              className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-1 cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group select-none"
              title="Click to sync all data right now to Cloud Firestore"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-emerald-500" />
                  Cloud State
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold group-hover:underline flex items-center gap-1">
                  <RefreshCw className={`w-3 h-3 ${isSyncingAll || syncStatus === 'syncing' ? 'animate-spin text-emerald-500' : ''}`} />
                  Sync Now
                </span>
              </div>
              <div className="text-sm font-bold mt-2 flex items-center gap-1.5">
                {isSyncingAll || syncStatus === 'syncing' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-purple-500" />
                    <span className="text-purple-600 dark:text-purple-400">Syncing to Cloud...</span>
                  </>
                ) : syncStatus === 'offline' ? (
                  <>
                    <WifiOff className="w-4 h-4 text-amber-500" />
                    <span className="text-amber-600 dark:text-amber-400">
                      Offline{pendingCount > 0 ? ` (${pendingCount} Queued)` : ''}
                    </span>
                  </>
                ) : syncStatus === 'error' ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span className="text-rose-600 dark:text-rose-400">
                      Sync Failed - Retry{pendingCount > 0 ? ` (${pendingCount})` : ''}
                    </span>
                  </>
                ) : pendingCount > 0 ? (
                  <>
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-blue-600 dark:text-blue-400">
                      Pending Sync ({pendingCount})
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">Synced Properly</span>
                  </>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground truncate">
                {pendingCount > 0
                  ? `${pendingCount} changes waiting to upload`
                  : lastSyncedAt
                  ? `Synced: ${lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Cloud sync active'}
              </p>
            </div>
          </div>

          {/* Academic Details Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card className="p-5 sm:p-6 bg-card border-border shadow-xs space-y-4">
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
                  <span className="text-muted-foreground">Total Syllabus Chapters:</span>
                  <span className="font-bold text-purple-600">{totalChapters} Chapters</span>
                </div>
              </div>
            </Card>

            <Card className="p-5 sm:p-6 bg-card border-border shadow-xs space-y-4">
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
