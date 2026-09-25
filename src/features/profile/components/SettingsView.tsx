import React, { useState } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { notificationEngine, NotificationTone } from '@/services/notification-service';
import {
  Sun,
  Moon,
  Laptop,
  Bell,
  Volume2,
  Globe,
  RotateCcw,
  Trash2,
  Shield,
  Info,
  MessageSquare,
  Mail,
  Check,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const SettingsView: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { user, signOutUser } = useAuth();
  const { setScreen } = useOnboarding();

  const [notifSettings, setNotifSettings] = useState(() => notificationEngine.getSettings());
  const [selectedLanguage, setSelectedLanguage] = useState<'English' | 'Hindi'>('English');
  const [showResetModal, setShowResetModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  const handleToggleNotifications = async () => {
    if (!notifSettings.permissionGranted) {
      const granted = await notificationEngine.requestPermission();
      setNotifSettings((prev) => ({ ...prev, permissionGranted: granted, enabled: granted }));
    } else {
      const nextState = !notifSettings.enabled;
      notificationEngine.saveSettings({ enabled: nextState });
      setNotifSettings((prev) => ({ ...prev, enabled: nextState }));
      toast.success(nextState ? 'Notifications enabled' : 'Notifications muted');
    }
  };

  const handleToneChange = (tone: NotificationTone) => {
    notificationEngine.saveSettings({ tone });
    setNotifSettings((prev) => ({ ...prev, tone }));
    toast.success(`Reminder style set to: ${tone}`);
  };

  const handleTestNotification = () => {
    notificationEngine.sendTestNotification(
      notifSettings.tone === 'balanced' ? 'motivational' : (notifSettings.tone as any)
    );
  };

  const handleClearCache = () => {
    try {
      // Clear session memory & non-essential local caches
      localStorage.removeItem('rankify_ai_session_memory');
      toast.success('Local AI & response caches cleared safely!');
    } catch {
      toast.error('Failed to clear local cache');
    }
  };

  const handleResetOnboarding = () => {
    try {
      localStorage.removeItem('onboarding_completed');
      localStorage.removeItem('onboarding_screen');
      setShowResetModal(false);
      setScreen(1);
      toast.success('Onboarding diagnostic re-initialized');
      window.location.reload();
    } catch {
      toast.error('Failed to reset onboarding');
    }
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    toast.success('Thank you for helping us polish Rankify for CBSE Class 12!');
    setFeedbackText('');
    setShowFeedbackModal(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Theme Configuration */}
      <div className="p-6 rounded-3xl bg-card/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Sun className="w-4 h-4 text-purple-600" />
            <span>Appearance & Theme</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select light, dark, or automatic system appearance.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setTheme('light')}
            className={`p-3.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-2 transition-all cursor-pointer ${
              theme === 'light'
                ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 shadow-xs'
                : 'border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sun className="w-5 h-5 text-amber-500" />
            <span>Light</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`p-3.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-2 transition-all cursor-pointer ${
              theme === 'dark'
                ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 shadow-xs'
                : 'border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-muted-foreground hover:text-foreground'
            }`}
          >
            <Moon className="w-5 h-5 text-indigo-400" />
            <span>Dark</span>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`p-3.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-2 transition-all cursor-pointer ${
              theme === 'system'
                ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 shadow-xs'
                : 'border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-muted-foreground hover:text-foreground'
            }`}
          >
            <Laptop className="w-5 h-5 text-purple-500" />
            <span>System</span>
          </button>
        </div>
      </div>

      {/* 2. Notification Center */}
      <div className="p-6 rounded-3xl bg-card/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4 text-purple-600" />
              <span>Adaptive Study Reminders</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Intelligent notifications that automatically quiet down when you're already studying.
            </p>
          </div>

          <button
            onClick={handleToggleNotifications}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              notifSettings.enabled
                ? 'bg-purple-600 text-white'
                : 'bg-slate-200 dark:bg-slate-800 text-muted-foreground'
            }`}
          >
            {notifSettings.enabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {/* Tone Selection */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/5">
          <label className="text-xs font-semibold text-muted-foreground">Reminder Tone</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'motivational', label: 'Motivational' },
              { id: 'savage', label: 'Savage / Direct' },
              { id: 'funny', label: 'Humorous' },
              { id: 'balanced', label: 'Balanced' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => handleToneChange(t.id as any)}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-colors cursor-pointer ${
                  notifSettings.tone === t.id
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                    : 'border-slate-200 dark:border-slate-800 text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Test Notification Trigger */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">Test notification dispatch:</span>
          <button
            onClick={handleTestNotification}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-foreground text-xs font-semibold border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            Send Test Alert
          </button>
        </div>
      </div>

      {/* 3. Language & Medium */}
      <div className="p-6 rounded-3xl bg-card/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Globe className="w-4 h-4 text-purple-600" />
            <span>Curriculum Medium & Language</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Calibrated for CBSE Class 12 Science (PCM).
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <button
            onClick={() => {
              setSelectedLanguage('English');
              toast.success('Curriculum language set to English');
            }}
            className={`p-3 rounded-2xl border text-xs font-bold transition-colors cursor-pointer ${
              selectedLanguage === 'English'
                ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                : 'border-slate-200 dark:border-slate-800 text-muted-foreground'
            }`}
          >
            English (Standard CBSE)
          </button>

          <button
            onClick={() => {
              setSelectedLanguage('Hindi');
              toast.success('Curriculum language set to Hindi / Hinglish');
            }}
            className={`p-3 rounded-2xl border text-xs font-bold transition-colors cursor-pointer ${
              selectedLanguage === 'Hindi'
                ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                : 'border-slate-200 dark:border-slate-800 text-muted-foreground'
            }`}
          >
            Hinglish / Hindi Terms
          </button>
        </div>
      </div>

      {/* 4. Cache & Diagnostic Management */}
      <div className="p-6 rounded-3xl bg-card/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-purple-600" />
            <span>Data & Diagnostic Reset</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage local storage and chapter assessments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleClearCache}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-foreground text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-amber-500" />
            <span>Clear Local AI Cache</span>
          </button>

          <button
            onClick={() => setShowResetModal(true)}
            className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-900/40 flex items-center gap-1.5 cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Reset Onboarding Assessment</span>
          </button>
        </div>
      </div>

      {/* 5. About Rankify & Support */}
      <div className="p-6 rounded-3xl bg-card/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-purple-600" />
            <span className="font-bold text-sm text-foreground">About Rankify</span>
          </div>
          <span className="text-[11px] font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full">
            v6.0.0 CBSE Class 12 PCM Edition
          </span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Rankify is an intelligent study OS built exclusively for CBSE Class 12 Science students. Powered by real-time syllabus tracking, persistent Firebase cloud sync, and server-side Gemini AI tutoring for 95%+ board examination results.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => setShowFeedbackModal(true)}
            className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Send Academic Feedback</span>
          </button>

          <a
            href="mailto:devgamerz3131@gmail.com"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Contact Support</span>
          </a>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-slate-200 dark:border-white/10 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-base text-foreground">Reset Assessment?</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This will re-launch the CBSE Class 12 onboarding setup to recalibrate your chapter confidence ratings and study schedule.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleResetOnboarding}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
              >
                Yes, Reset Onboarding
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitFeedback}
            className="bg-card border border-slate-200 dark:border-white/10 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl"
          >
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              <span>Academic Feedback & Suggestions</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Suggest improvements for Class 12 Physics, Chemistry, or Maths chapters.
            </p>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={4}
              placeholder="What can we improve in your CBSE preparation experience?"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-purple-500"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowFeedbackModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold cursor-pointer"
              >
                Send Feedback
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
