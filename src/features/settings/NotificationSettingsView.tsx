import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { notificationEngine, NotificationSettings } from '@/services/notification-service';
import {
  Settings,
  Bell,
  Volume2,
  Clock,
  Sparkles,
  BookOpen,
  Calendar,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  VolumeX,
  RefreshCw,
  Info,
  Flame,
  Moon
} from 'lucide-react';
import toast from 'react-hot-toast';

export const NotificationSettingsView: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.uid || 'guest';

  const [settings, setSettings] = useState<NotificationSettings>(() => notificationEngine.getSettings());
  const [permissionState, setPermissionState] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined') {
      const isIframe = window.self !== window.top;
      if (isIframe) return 'granted';
      if ('Notification' in window) {
        return Notification.permission;
      }
    }
    return 'default';
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const isNotificationSupported = typeof window !== 'undefined' && 'Notification' in window;

  // Load preferences from Firebase / cache on mount
  useEffect(() => {
    const loadPrefs = async () => {
      setIsSyncing(true);
      try {
        const cloudSettings = await notificationEngine.loadUserPreferences(userId);
        setSettings(cloudSettings);
      } catch (e) {
        console.warn('Failed to load synced preferences on settings view:', e);
      } finally {
        setIsSyncing(false);
      }
    };
    loadPrefs();
  }, [userId]);

  // Keep browser notification permission state up to date
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const isIframe = window.self !== window.top;
      if (isIframe) {
        setPermissionState('granted');
        return;
      }
      const interval = setInterval(() => {
        setPermissionState(Notification.permission);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, []);

  const handleToggleSetting = async (key: keyof NotificationSettings) => {
    const value = !settings[key];
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    setIsSyncing(true);
    await notificationEngine.saveSettings({ [key]: value });
    setIsSyncing(false);
  };

  const handleSelectFrequency = async (freq: 'low' | 'normal' | 'high') => {
    const updated = { ...settings, frequency: freq };
    setSettings(updated);
    setIsSyncing(true);
    await notificationEngine.saveSettings({ frequency: freq });
    setIsSyncing(false);
  };

  const handleChangeTime = async (key: 'quietHoursStart' | 'quietHoursEnd', val: string) => {
    const updated = { ...settings, quietHoursStart: val, quietHoursEnd: val };
    const updateObj = { [key]: val };
    const updatedState = { ...settings, [key]: val };
    setSettings(updatedState);
    setIsSyncing(true);
    await notificationEngine.saveSettings(updateObj);
    setIsSyncing(false);
  };

  const handleEnableSystemNotifications = async () => {
    const isIframe = typeof window !== 'undefined' && window.self !== window.top;
    if (permissionState === 'denied' && !isIframe) {
      toast.error(
        'System notifications are blocked. Please enable them from your browser address bar settings.',
        { duration: 5000 }
      );
      return;
    }

    const granted = await notificationEngine.requestPermission();
    if (isIframe) {
      setPermissionState('granted');
    } else {
      setPermissionState(granted ? 'granted' : 'denied');
    }
  };

  const handleSendTest = () => {
    if (permissionState !== 'granted' && isNotificationSupported) {
      toast('Please grant notification permission to test system-level alerts.', { icon: '🔔' });
    }
    notificationEngine.sendTestNotification();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 select-none animate-fadeIn">
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-950 to-purple-950 p-6 sm:p-8 text-white shadow-2xl border border-indigo-500/20">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-3 py-1 text-xs font-semibold text-indigo-200 border border-white/15">
              <Bell className="h-3 w-3 text-indigo-300" />
              <span>Android Rankify Experience</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
              <span>Notification Center</span>
              {isSyncing && (
                <RefreshCw className="h-5 w-5 text-indigo-400 animate-spin shrink-0" />
              )}
            </h1>
            <p className="text-xs text-indigo-100/80 max-w-2xl font-medium">
              Configure system alerts, study reminders, savage motivators, and exam countdown frequencies to keep your CBSE PCM preparation fully on track.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSendTest}
            className="h-9 px-4 rounded-xl border-white/10 bg-white/5 hover:bg-white/15 text-white font-bold text-xs shrink-0 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-300 animate-pulse" />
            <span>Send Test Notification</span>
          </Button>
        </div>

        {/* Ambient Glow */}
        <div className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* SYSTEM PERMISSION CARD */}
      <Card className="rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-xs">
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <h4 className="font-extrabold text-sm sm:text-base text-foreground flex items-center gap-2">
                <span>System Permission Status</span>
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    !isNotificationSupported
                      ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                      : permissionState === 'granted'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : permissionState === 'denied'
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {!isNotificationSupported ? 'In-App Mode' : permissionState === 'granted' ? 'Allowed' : permissionState === 'denied' ? 'Blocked' : 'Action Required'}
                </span>
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                {!isNotificationSupported
                  ? 'Your browser does not support desktop notifications. Rankify will instead deliver beautiful in-app study alerts and motivational toasts to defend your streak!'
                  : permissionState === 'granted'
                  ? 'Rankify is fully authorized to send high-priority board exam targets and streak reminders directly to your browser desktop.'
                  : permissionState === 'denied'
                  ? 'System alerts are blocked. You will see gentle in-app toasts, but we highly recommend enabling browser-level notifications to defend your streak.'
                  : 'Get instant study reminders and organic chemistry prompts directly even if the site is in the background.'}
              </p>
            </div>

            {isNotificationSupported && permissionState !== 'granted' && (
              <Button
                onClick={handleEnableSystemNotifications}
                className="h-9 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shrink-0 cursor-pointer shadow-sm"
              >
                <span>Authorize Notifications</span>
              </Button>
            )}
          </div>

          {/* Friendly informative card for denied status */}
          {isNotificationSupported && permissionState === 'denied' && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300"
            >
              <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5 leading-relaxed">
                <span className="font-bold">Why enable notifications?</span>
                <p>
                  Class 12 toppers study consistently. Notifications ensure you stay updated on daily Calculus missions, Revision schedules, and never lose your streak when life gets busy.
                </p>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* NOTIFICATION PREFERENCES MATRIX */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CORE PREFERENCE SWITCHES */}
        <div className="md:col-span-2 space-y-4">
          <Card className="rounded-3xl border border-slate-200 dark:border-white/10 shadow-xs">
            <CardContent className="p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                <h3 className="font-extrabold text-sm sm:text-base text-foreground">Alert Preferences</h3>
                <span className="text-[10px] text-muted-foreground font-mono">Real-time sync active</span>
              </div>

              {/* Switches Matrix */}
              <div className="space-y-4">
                {/* Global Master Switch */}
                <div className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5">
                  <div className="space-y-0.5">
                    <span className="text-xs font-extrabold text-foreground">Master Notifications Toggle</span>
                    <p className="text-[10px] text-muted-foreground">Turn all alerts completely on or off</p>
                  </div>
                  <button
                    onClick={() => handleToggleSetting('enabled')}
                    className={`w-10 h-6 rounded-full transition-all duration-300 focus:outline-none flex items-center p-1 cursor-pointer ${
                      settings.enabled ? 'bg-purple-600 justify-end' : 'bg-slate-200 dark:bg-slate-700 justify-start'
                    }`}
                  >
                    <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-md" />
                  </button>
                </div>

                <AnimatePresence>
                  {settings.enabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      {/* Study Reminders */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <BookOpen className="w-4 h-4 text-purple-600 mt-1 shrink-0" />
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-foreground">Study Reminders</span>
                            <p className="text-[10px] text-muted-foreground">Urgent callouts when SmartPlan chapters are waiting.</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleSetting('studyReminders')}
                          className={`w-9 h-5.5 rounded-full transition-all duration-300 focus:outline-none flex items-center p-0.5 cursor-pointer ${
                            settings.studyReminders ? 'bg-purple-600 justify-end' : 'bg-slate-200 dark:bg-slate-700 justify-start'
                          }`}
                        >
                          <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-xs" />
                        </button>
                      </div>

                      {/* Daily Motivation */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <Sparkles className="w-4 h-4 text-amber-500 mt-1 shrink-0" />
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-foreground">Daily Motivation & Roast Engine</span>
                            <p className="text-[10px] text-muted-foreground">Get Savage, Funny, or high-focus board exam quotes.</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleSetting('dailyMotivation')}
                          className={`w-9 h-5.5 rounded-full transition-all duration-300 focus:outline-none flex items-center p-0.5 cursor-pointer ${
                            settings.dailyMotivation ? 'bg-purple-600 justify-end' : 'bg-slate-200 dark:bg-slate-700 justify-start'
                          }`}
                        >
                          <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-xs" />
                        </button>
                      </div>

                      {/* Exam Countdown */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <Calendar className="w-4 h-4 text-rose-500 mt-1 shrink-0" />
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-foreground">Exam Countdown Updates</span>
                            <p className="text-[10px] text-muted-foreground">Frequencies automatically increase as Boards approach.</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleSetting('examCountdown')}
                          className={`w-9 h-5.5 rounded-full transition-all duration-300 focus:outline-none flex items-center p-0.5 cursor-pointer ${
                            settings.examCountdown ? 'bg-purple-600 justify-end' : 'bg-slate-200 dark:bg-slate-700 justify-start'
                          }`}
                        >
                          <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-xs" />
                        </button>
                      </div>

                      {/* Revision Reminders */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <RefreshCw className="w-4 h-4 text-emerald-500 mt-1 shrink-0" />
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-foreground">Revision Reminders</span>
                            <p className="text-[10px] text-muted-foreground">Optimal alerts based on spaced recall memory intervals.</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleSetting('revisionReminder')}
                          className={`w-9 h-5.5 rounded-full transition-all duration-300 focus:outline-none flex items-center p-0.5 cursor-pointer ${
                            settings.revisionReminder ? 'bg-purple-600 justify-end' : 'bg-slate-200 dark:bg-slate-700 justify-start'
                          }`}
                        >
                          <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-xs" />
                        </button>
                      </div>

                      {/* Streak Protector */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <Flame className="w-4 h-4 text-orange-500 mt-1 shrink-0" />
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-foreground">Streak & Missed Study Alerts</span>
                            <p className="text-[10px] text-muted-foreground">Warning alerts at 24 hours study gap; streak restart support.</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleSetting('streakReminder')}
                          className={`w-9 h-5.5 rounded-full transition-all duration-300 focus:outline-none flex items-center p-0.5 cursor-pointer ${
                            settings.streakReminder ? 'bg-purple-600 justify-end' : 'bg-slate-200 dark:bg-slate-700 justify-start'
                          }`}
                        >
                          <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-xs" />
                        </button>
                      </div>

                      {/* SmartPlan Reminder */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <Zap className="w-4 h-4 text-blue-500 mt-1 shrink-0" />
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-foreground">SmartPlan Goal Sync Alerts</span>
                            <p className="text-[10px] text-muted-foreground">Reminders to lock-in completed status before midnight resets.</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleSetting('smartPlanReminder')}
                          className={`w-9 h-5.5 rounded-full transition-all duration-300 focus:outline-none flex items-center p-0.5 cursor-pointer ${
                            settings.smartPlanReminder ? 'bg-purple-600 justify-end' : 'bg-slate-200 dark:bg-slate-700 justify-start'
                          }`}
                        >
                          <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-xs" />
                        </button>
                      </div>

                      {/* Feature Updates */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <TrendingUp className="w-4 h-4 text-indigo-500 mt-1 shrink-0" />
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-foreground">Rankify OS Updates</span>
                            <p className="text-[10px] text-muted-foreground">Immediate alerts about newly shipped features & materials.</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleSetting('newFeatureUpdates')}
                          className={`w-9 h-5.5 rounded-full transition-all duration-300 focus:outline-none flex items-center p-0.5 cursor-pointer ${
                            settings.newFeatureUpdates ? 'bg-purple-600 justify-end' : 'bg-slate-200 dark:bg-slate-700 justify-start'
                          }`}
                        >
                          <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-xs" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FREQUENCY & QUIET HOURS CONTROLS */}
        <div className="space-y-6">
          {/* FREQUENCY CONTROL */}
          <Card className="rounded-3xl border border-slate-200 dark:border-white/10 shadow-xs">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <h3 className="font-extrabold text-sm sm:text-base text-foreground flex items-center gap-1.5">
                <Clock className="w-4.5 h-4.5 text-purple-600" />
                <span>Alert Frequency</span>
              </h3>

              <div className="grid grid-cols-3 gap-2">
                {(['low', 'normal', 'high'] as const).map((freq) => {
                  const isActive = settings.frequency === freq;
                  return (
                    <button
                      key={freq}
                      onClick={() => handleSelectFrequency(freq)}
                      className={`h-9 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer capitalize ${
                        isActive
                          ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                          : 'border-slate-200 dark:border-white/10 text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {freq}
                    </button>
                  );
                })}
              </div>

              <p className="text-[10px] text-muted-foreground leading-relaxed leading-normal">
                {settings.frequency === 'low'
                  ? 'Reminders are highly restricted and focused only during afternoon slots (once a day).'
                  : settings.frequency === 'normal'
                  ? 'Optimal balance. Triggers once in the morning slot and once in the evening slot.'
                  : 'High focus pacing. Includes multiple daily check-ins to make sure nothing slips.'}
              </p>
            </CardContent>
          </Card>

          {/* QUIET HOURS CONTROL */}
          <Card className="rounded-3xl border border-slate-200 dark:border-white/10 shadow-xs">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <h3 className="font-extrabold text-sm sm:text-base text-foreground flex items-center gap-1.5">
                <Moon className="w-4.5 h-4.5 text-indigo-500" />
                <span>Quiet Hours</span>
              </h3>

              <p className="text-[10px] text-muted-foreground leading-relaxed leading-normal">
                Silence all system study alerts during sleep or personal focus slots.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-indigo-400">Start Time</label>
                  <input
                    type="time"
                    value={settings.quietHoursStart}
                    onChange={(e) => handleChangeTime('quietHoursStart', e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-xs text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-indigo-400">End Time</label>
                  <input
                    type="time"
                    value={settings.quietHoursEnd}
                    onChange={(e) => handleChangeTime('quietHoursEnd', e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-xs text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
