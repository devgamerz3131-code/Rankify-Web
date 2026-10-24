import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  backupRestoreService,
  BackupMetadata,
  StudentFullBackup,
  BackupHealth,
  RestoreMode,
} from '@/services/backup-restore';
import { isTourActive } from '@/features/tour/tourReadOnlyGate';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Cloud,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  Trash2,
  Eye,
  Shield,
  Clock,
  HardDrive,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  FileJson,
  Lock,
  ChevronRight,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const BackupRestoreCenter: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.uid || '';

  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [history, setHistory] = useState<BackupMetadata[]>([]);
  const [health, setHealth] = useState<BackupHealth | null>(null);

  // Modals state
  const [previewBackup, setPreviewBackup] = useState<StudentFullBackup | null>(null);
  const [selectedBackupToRestore, setSelectedBackupToRestore] = useState<BackupMetadata | null>(null);
  const [restoreMode, setRestoreMode] = useState<RestoreMode>('merge');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [backupToDelete, setBackupToDelete] = useState<string | null>(null);

  // File import ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);

  const fetchHealthAndHistory = async () => {
    if (!userId) return;
    setIsLoadingHistory(true);
    try {
      const [hList, hMetrics] = await Promise.all([
        backupRestoreService.getBackupHistory(userId),
        backupRestoreService.getBackupHealth(userId),
      ]);
      setHistory(hList);
      setHealth(hMetrics);
    } catch {
      // offline fallback
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHealthAndHistory();
  }, [userId]);

  const handleManualBackup = async () => {
    if (isTourActive()) return;
    if (!userId) {
      toast.error('Sign in required for cloud backups');
      return;
    }
    setIsBackingUp(true);
    const toastId = toast.loading('Encrypting and syncing academic state to Cloud...');
    const result = await backupRestoreService.saveCloudBackup(userId, 'manual');
    setIsBackingUp(false);

    if (result.success) {
      toast.success('Backup completed! All chapters, tasks & preferences protected.', {
        id: toastId,
      });
      fetchHealthAndHistory();
    } else {
      toast.error(result.error || 'Backup failed. Please check your connection.', {
        id: toastId,
      });
    }
  };

  const handleOpenRestoreConfirm = (meta: BackupMetadata) => {
    if (isTourActive()) return;
    setSelectedBackupToRestore(meta);
    setShowRestoreModal(true);
  };

  const handleExecuteRestore = async () => {
    if (isTourActive()) return;
    if (!userId || !selectedBackupToRestore) return;
    const toastId = toast.loading(`Restoring backup (${restoreMode} mode)...`);
    setShowRestoreModal(false);

    let backupToApply: StudentFullBackup | null = null;
    if (selectedBackupToRestore.id === 'latest') {
      backupToApply = await backupRestoreService.restoreCloudBackup(userId, restoreMode);
    } else {
      backupToApply = await backupRestoreService.getBackupById(
        userId,
        selectedBackupToRestore.id
      );
      if (backupToApply) {
        backupRestoreService.applyBackupToLocal(backupToApply, userId, restoreMode);
      }
    }

    if (backupToApply) {
      toast.success('Academic benchmarks successfully restored! Reloading...', {
        id: toastId,
      });
      setTimeout(() => {
        window.location.reload();
      }, 750);
    } else {
      toast.error('Failed to restore snapshot. Please verify backup validity.', {
        id: toastId,
      });
    }
  };

  const handlePreview = async (backupId: string) => {
    if (isTourActive()) return;
    if (!userId) return;
    const fullBackup = await backupRestoreService.getBackupById(userId, backupId);
    if (fullBackup) {
      setPreviewBackup(fullBackup);
    } else {
      toast.error('Could not load backup details for preview');
    }
  };

  const handleDeleteSingle = async (backupId: string) => {
    if (isTourActive()) return;
    if (!userId) return;
    const success = await backupRestoreService.deleteBackup(userId, backupId);
    setBackupToDelete(null);
    if (success) {
      toast.success('Backup snapshot deleted');
      fetchHealthAndHistory();
    } else {
      toast.error('Failed to delete backup snapshot');
    }
  };

  const handleDeleteAll = async () => {
    if (isTourActive()) return;
    if (!userId) return;
    const success = await backupRestoreService.deleteAllBackups(userId);
    setShowDeleteAllModal(false);
    if (success) {
      toast.success('All backup snapshots cleared');
      fetchHealthAndHistory();
    } else {
      toast.error('Failed to clear backups');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isTourActive()) return;
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (isTourActive()) return;
      const content = event.target?.result as string;
      if (content) {
        const result = backupRestoreService.importBackupFile(content, userId, 'merge');
        if (result.success) {
          toast.success('Imported backup restored successfully! Refreshing...');
          setTimeout(() => window.location.reload(), 800);
        } else {
          toast.error(result.error || 'Failed to import backup');
        }
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div data-tour="settings-cloud-backups" className="space-y-6 select-none max-w-4xl mx-auto">
      {/* 1. Health & Overview Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950 text-white border border-purple-500/25 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Cloud Backup & Recovery Hub</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Enterprise Academic Protection
            </h2>
            <p className="text-xs text-purple-200/80 max-w-lg leading-relaxed">
              Every formula, mistake log, lecture note, and chapter milestone is encrypted and safely stored in Firebase Firestore with multi-version rollback.
            </p>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 shrink-0">
            <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
              <span className="text-[10px] text-purple-200 uppercase font-mono font-bold block">
                Last Backup
              </span>
              <span className="text-xs font-black text-white">
                {health?.lastBackupTime
                  ? new Date(health.lastBackupTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Not backed up yet'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
              <span className="text-[10px] text-purple-200 uppercase font-mono font-bold block">
                Storage Used
              </span>
              <span className="text-xs font-black text-white">
                {formatBytes(health?.totalStorageBytes || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Manual Action Command Deck */}
      <Card className="p-6 bg-card border border-border rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Cloud className="w-4 h-4 text-purple-600" />
              <span>Instant Cloud Backup & Restore</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Create an immutable snapshot right now or restore the latest verified version.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleManualBackup}
              disabled={isBackingUp}
              className="text-xs font-bold rounded-2xl gap-2 cursor-pointer shadow-sm shadow-purple-500/20"
            >
              {isBackingUp ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Backing up...</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Backup Now</span>
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleOpenRestoreConfirm({
                  id: 'latest',
                  version: 'latest',
                  timestamp: new Date().toISOString(),
                  sizeBytes: 0,
                  deviceName: 'Cloud Latest',
                  trigger: 'manual',
                })
              }
              className="text-xs font-bold rounded-2xl gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Latest</span>
            </Button>
          </div>
        </div>

        {/* Export / Import Bar */}
        <div className="pt-3 border-t border-slate-200/60 dark:border-white/5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                backupRestoreService.exportBackupFile(userId, user?.displayName || 'Student', 'json')
              }
              className="text-xs font-bold rounded-xl gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                backupRestoreService.exportBackupFile(userId, user?.displayName || 'Student', 'encrypted')
              }
              className="text-xs font-bold rounded-xl gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Export Encrypted</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-bold rounded-xl gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import File</span>
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json,.rankify"
              className="hidden"
            />
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
            <span>Next Auto-Backup:</span>
            <span className="font-bold text-foreground">
              {health?.nextScheduledBackup || 'Every 24 hours'}
            </span>
          </div>
        </div>
      </Card>

      {/* 3. Version History List */}
      <Card className="p-6 bg-card border border-border rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-foreground">Backup Version History</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono font-bold">
              {history.length} snapshots
            </span>
          </div>

          {history.length > 0 && (
            <button
              onClick={() => setShowDeleteAllModal(true)}
              className="text-xs font-semibold text-rose-500 hover:text-rose-600 cursor-pointer flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {isLoadingHistory ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-600" />
            <span>Loading backup timeline from Firestore...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-muted-foreground space-y-2">
            <Cloud className="w-8 h-8 mx-auto text-purple-400 opacity-60" />
            <p className="text-xs font-bold text-foreground">No cloud backups saved yet</p>
            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
              Tap &quot;Backup Now&quot; above to create your first cloud snapshot. Backups are also created automatically every 24 hours.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/70 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/40 hover:border-purple-400/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-foreground">
                        {new Date(item.timestamp).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        {item.trigger}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                      <span>{item.deviceName}</span>
                      <span>•</span>
                      <span>{formatBytes(item.sizeBytes)}</span>
                      <span>•</span>
                      <span>v{item.version}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handlePreview(item.id)}
                    className="p-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Preview snapshot"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenRestoreConfirm(item)}
                    className="text-xs font-bold rounded-xl h-8 px-3 cursor-pointer"
                  >
                    <span>Restore</span>
                  </Button>

                  <button
                    onClick={() => setBackupToDelete(item.id)}
                    className="p-2 rounded-xl text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    title="Delete snapshot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ========================================================
          MODALS
          ======================================================== */}

      {/* Restore Confirmation Modal (Merge vs Replace) */}
      {showRestoreModal && selectedBackupToRestore && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-slate-200 dark:border-white/10 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-600">
                <RotateCcw className="w-5 h-5" />
                <h3 className="font-extrabold text-base text-foreground">Restore Cloud Backup</h3>
              </div>
              <button
                onClick={() => setShowRestoreModal(false)}
                className="p-1 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Choose how you would like to apply snapshot from{' '}
              <strong className="text-foreground">
                {new Date(selectedBackupToRestore.timestamp).toLocaleString()}
              </strong>
              .
            </p>

            {/* Strategy Options */}
            <div className="space-y-2.5">
              <div
                onClick={() => setRestoreMode('merge')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  restoreMode === 'merge'
                    ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 ring-1 ring-purple-600'
                    : 'border-slate-200/80 dark:border-white/10 bg-card hover:border-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-foreground">
                    Smart Merge (Recommended)
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Safest
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Preserves highest chapter progress percentages, unions bookmarks and notes, and never deletes newer progress.
                </p>
              </div>

              <div
                onClick={() => setRestoreMode('replace')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  restoreMode === 'replace'
                    ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 ring-1 ring-purple-600'
                    : 'border-slate-200/80 dark:border-white/10 bg-card hover:border-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-foreground">Replace Complete State</h4>
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
                    Overwrite
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Resets the current device and cloud state to match this snapshot exactly.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRestoreModal(false)}
                className="text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleExecuteRestore}
                className="text-xs font-bold rounded-xl cursor-pointer"
              >
                Confirm & Restore
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Snapshot Preview Modal */}
      {previewBackup && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-slate-200 dark:border-white/10 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-600">
                <Eye className="w-5 h-5" />
                <h3 className="font-extrabold text-base text-foreground">Snapshot Contents</h3>
              </div>
              <button
                onClick={() => setPreviewBackup(null)}
                className="p-1 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5">
                <span className="text-[10px] text-muted-foreground block">Student</span>
                <span className="font-bold text-foreground truncate block">
                  {previewBackup.metadata.studentName || 'Student'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5">
                <span className="text-[10px] text-muted-foreground block">Completed Chapters</span>
                <span className="font-bold text-foreground">
                  {previewBackup.metadata.chaptersCompletedCount || 0} / 37
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5">
                <span className="text-[10px] text-muted-foreground block">Daily Tasks</span>
                <span className="font-bold text-foreground">
                  {previewBackup.dailyTasks?.length || 0} scheduled
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5">
                <span className="text-[10px] text-muted-foreground block">Theme / Accent</span>
                <span className="font-bold text-foreground">
                  {previewBackup.settings?.theme || 'System'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewBackup(null)}
                className="text-xs font-bold rounded-xl cursor-pointer"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Backup Confirmation */}
      {backupToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-slate-200 dark:border-white/10 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-base text-foreground">Delete Snapshot?</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This snapshot will be permanently removed from your Cloud backup history. Other snapshots will remain intact.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBackupToDelete(null)}
                className="text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeleteSingle(backupToDelete)}
                className="text-xs font-bold rounded-xl cursor-pointer"
              >
                Delete Snapshot
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Confirmation */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-slate-200 dark:border-white/10 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-base text-foreground">Clear All Backups?</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete all historical backup snapshots? Your current active data on this device will not be touched.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteAllModal(false)}
                className="text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteAll}
                className="text-xs font-bold rounded-xl cursor-pointer"
              >
                Clear All History
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
