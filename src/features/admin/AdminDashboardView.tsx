import React, { useState, useEffect } from 'react';
import {
  Shield,
  Upload,
  Music,
  Video,
  Bell,
  BarChart3,
  FileText,
  CheckCircle2,
  Trash2,
  Plus,
  Play,
  Database,
  Users,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  AlertTriangle,
  Star,
  ExternalLink,
} from 'lucide-react';
import { remoteConfig, RemoteConfigState } from '@/services/remote-config';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

interface StudyMaterial {
  id: string;
  title: string;
  subject: string;
  chapter: string;
  type: 'formula_sheet' | 'ncert_solution' | 'pyq_paper' | 'revision_notes';
  size: string;
  uploadedAt: string;
}

interface StudyTrack {
  id: string;
  title: string;
  duration: string;
  genre: string;
  audioUrl?: string;
}

interface FocusVideo {
  id: string;
  title: string;
  channel: string;
  videoUrl: string;
  duration: string;
  subject: string;
}

interface Announcement {
  id: string;
  title: string;
  body: string;
  priority: 'high' | 'normal' | 'urgent';
  date: string;
}

export const AdminDashboardView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'materials' | 'music' | 'videos' | 'announcements' | 'toggles' | 'analytics'
  >('materials');

  const [remoteCfg, setRemoteCfg] = useState<RemoteConfigState>(() => remoteConfig.getConfig());

  useEffect(() => {
    return remoteConfig.subscribe((newCfg) => setRemoteCfg(newCfg));
  }, []);

  // 1. Materials State
  const [materials, setMaterials] = useState<StudyMaterial[]>([
    {
      id: 'mat_1',
      title: 'Class 12 Physics Complete Ray Optics Master Notes',
      subject: 'Physics',
      chapter: 'Ray Optics and Optical Instruments',
      type: 'revision_notes',
      size: '2.4 MB',
      uploadedAt: 'Today, 10:30 AM',
    },
    {
      id: 'mat_2',
      title: 'Chemistry 10-Year High-Yield Organic Conversions',
      subject: 'Chemistry',
      chapter: 'Aldehydes, Ketones and Carboxylic Acids',
      type: 'pyq_paper',
      size: '1.8 MB',
      uploadedAt: 'Yesterday',
    },
    {
      id: 'mat_3',
      title: 'Mathematics Definite Integrals Quick Formula Sheet',
      subject: 'Mathematics',
      chapter: 'Integrals',
      type: 'formula_sheet',
      size: '850 KB',
      uploadedAt: '2 days ago',
    },
  ]);

  // 2. Audio Tracks
  const [tracks, setTracks] = useState<StudyTrack[]>([
    { id: 'trk_1', title: 'Deep Focus Alpha Waves 432Hz', duration: '45:00', genre: 'Binaural Beats' },
    { id: 'trk_2', title: 'CBSE Late Night Lofi Study Beats', duration: '60:00', genre: 'Lofi Hip Hop' },
    { id: 'trk_3', title: 'Rainy Day Library Concentration', duration: '30:00', genre: 'Ambient Rain' },
  ]);

  // 3. Music Videos
  const [videos, setVideos] = useState<FocusVideo[]>([
    {
      id: 'vid_1',
      title: '3-Hour Deep Concentration Lofi Study Session (Pomodoro 25/5)',
      channel: 'Lofi Girl Focus',
      videoUrl: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
      duration: '3:00:00',
      subject: 'All Subjects',
    },
    {
      id: 'vid_2',
      title: 'Class 12 Physics Derivations Visualized in 3D',
      channel: 'Rankify Visual Labs',
      videoUrl: 'https://www.youtube.com/watch?v=physics_3d',
      duration: '45:00',
      subject: 'Physics',
    },
  ]);

  // 4. Announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: 'ann_1',
      title: 'CBSE Class 12 Date Sheet Alignment Active',
      body: 'All study schedules have been calibrated to the latest official CBSE Board circular.',
      priority: 'high',
      date: 'Sep 25, 2026',
    },
    {
      id: 'ann_2',
      title: 'High-Yield PYQ Set Available for Physics',
      body: 'Practice 25 high-frequency questions on Electrostatics and Current Electricity in the Practice tab.',
      priority: 'normal',
      date: 'Sep 23, 2026',
    },
  ]);

  // Form states
  const [newMatTitle, setNewMatTitle] = useState('');
  const [newMatSubject, setNewMatSubject] = useState('Physics');
  const [newMatChapter, setNewMatChapter] = useState('Ray Optics and Optical Instruments');

  const [newTrackTitle, setNewTrackTitle] = useState('');
  const [newTrackDuration, setNewTrackDuration] = useState('30:00');

  const [newVidTitle, setNewVidTitle] = useState('');
  const [newVidUrl, setNewVidUrl] = useState('');
  const [newVidDuration, setNewVidDuration] = useState('45:00');

  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnBody, setNewAnnBody] = useState('');
  const [newAnnPriority, setNewAnnPriority] = useState<'normal' | 'high' | 'urgent'>('normal');

  const handleUploadMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatTitle.trim()) return;
    const item: StudyMaterial = {
      id: `mat_${Date.now()}`,
      title: newMatTitle.trim(),
      subject: newMatSubject,
      chapter: newMatChapter,
      type: 'revision_notes',
      size: '1.4 MB',
      uploadedAt: 'Just now',
    };
    setMaterials([item, ...materials]);
    setNewMatTitle('');
    toast.success('Study Material published to all Class 12 students!');
  };

  const handleUploadTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrackTitle.trim()) return;
    const item: StudyTrack = {
      id: `trk_${Date.now()}`,
      title: newTrackTitle.trim(),
      duration: newTrackDuration,
      genre: 'Focus Lofi',
    };
    setTracks([item, ...tracks]);
    setNewTrackTitle('');
    toast.success('Focus Audio track added to student audio vault!');
  };

  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVidTitle.trim() || !newVidUrl.trim()) return;
    const item: FocusVideo = {
      id: `vid_${Date.now()}`,
      title: newVidTitle.trim(),
      channel: 'CBSE Rankify Studio',
      videoUrl: newVidUrl.trim(),
      duration: newVidDuration,
      subject: 'All PCM',
    };
    setVideos([item, ...videos]);
    setNewVidTitle('');
    setNewVidUrl('');
    toast.success('Study video embedded for candidates!');
  };

  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle.trim() || !newAnnBody.trim()) return;
    const item: Announcement = {
      id: `ann_${Date.now()}`,
      title: newAnnTitle.trim(),
      body: newAnnBody.trim(),
      priority: newAnnPriority,
      date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    setAnnouncements([item, ...announcements]);

    // Also update Remote Config banner for instant broadcast
    remoteConfig.setAnnouncement({
      enabled: true,
      title: newAnnTitle.trim(),
      message: newAnnBody.trim(),
      priority: newAnnPriority,
    });

    setNewAnnTitle('');
    setNewAnnBody('');
    toast.success('Broadcast announcement sent to students!');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Admin Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white border border-indigo-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-black">Rankify Administrator Console</h1>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/40">
              Admin Exclusive
            </span>
          </div>
          <p className="text-xs text-purple-200">
            Control CBSE 12 PCM Curriculum Content, Audio Streams, Remote Flags, and Analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono font-bold text-emerald-300">Live Sync Active</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-white/5 overflow-x-auto scrollbar-none">
        {[
          { id: 'materials', label: 'Study Materials', count: materials.length, icon: Upload },
          { id: 'music', label: 'Audio Vault', count: tracks.length, icon: Music },
          { id: 'videos', label: 'Focus Videos', count: videos.length, icon: Video },
          { id: 'announcements', label: 'Announcements', count: announcements.length, icon: Bell },
          { id: 'toggles', label: 'Feature Toggles', icon: ToggleRight },
          { id: 'analytics', label: 'Platform Analytics', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="text-[10px] opacity-80">({tab.count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 1. Materials Tab */}
      {activeTab === 'materials' && (
        <div className="space-y-6">
          <form
            onSubmit={handleUploadMaterial}
            className="p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-card/60 backdrop-blur-xl shadow-xs space-y-4"
          >
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Upload className="w-4 h-4 text-purple-600" />
              <span>Publish NCERT / CBSE Class 12 Study Notes</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Material Title</label>
                <input
                  type="text"
                  value={newMatTitle}
                  onChange={(e) => setNewMatTitle(e.target.value)}
                  placeholder="e.g. CBSE 2026 Hot Derivations — Ray Optics"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Subject</label>
                <select
                  value={newMatSubject}
                  onChange={(e) => setNewMatSubject(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-purple-500"
                >
                  <option value="Physics">Physics (042)</option>
                  <option value="Chemistry">Chemistry (043)</option>
                  <option value="Mathematics">Mathematics (041)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Button type="submit" variant="primary" className="text-xs font-bold h-9">
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Upload Material</span>
              </Button>
            </div>
          </form>

          <div className="space-y-2">
            {materials.map((mat) => (
              <div
                key={mat.id}
                className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">{mat.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {mat.subject} • {mat.chapter} • {mat.size} • Uploaded {mat.uploadedAt}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setMaterials(materials.filter((m) => m.id !== mat.id));
                    toast.success('Removed material');
                  }}
                  className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Audio Vault Tab */}
      {activeTab === 'music' && (
        <div className="space-y-6">
          <form
            onSubmit={handleUploadTrack}
            className="p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-card/60 backdrop-blur-xl shadow-xs space-y-4"
          >
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Music className="w-4 h-4 text-purple-600" />
              <span>Add Ambient Lofi / Binaural Focus Audio</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Track Title</label>
                <input
                  type="text"
                  value={newTrackTitle}
                  onChange={(e) => setNewTrackTitle(e.target.value)}
                  placeholder="e.g. CBSE 3-Hour Exam Focus Beat"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Duration</label>
                <input
                  type="text"
                  value={newTrackDuration}
                  onChange={(e) => setNewTrackDuration(e.target.value)}
                  placeholder="e.g. 45:00"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Button type="submit" variant="primary" className="text-xs font-bold h-9">
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Publish Audio</span>
              </Button>
            </div>
          </form>

          <div className="space-y-2">
            {tracks.map((trk) => (
              <div
                key={trk.id}
                className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0">
                    <Music className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">{trk.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {trk.genre} • Duration: {trk.duration}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toast.success(`Playing preview: ${trk.title}`)}
                    className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-lg cursor-pointer"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setTracks(tracks.filter((t) => t.id !== trk.id));
                      toast.success('Removed track');
                    }}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Focus Videos Tab */}
      {activeTab === 'videos' && (
        <div className="space-y-6">
          <form
            onSubmit={handleAddVideo}
            className="p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-card/60 backdrop-blur-xl shadow-xs space-y-4"
          >
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Video className="w-4 h-4 text-purple-600" />
              <span>Embed Focus Lofi Study Stream / Derivation Video</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Video Title</label>
                <input
                  type="text"
                  value={newVidTitle}
                  onChange={(e) => setNewVidTitle(e.target.value)}
                  placeholder="e.g. 2-Hour CBSE Study With Me Lofi Livestream"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Stream URL</label>
                <input
                  type="text"
                  value={newVidUrl}
                  onChange={(e) => setNewVidUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Button type="submit" variant="primary" className="text-xs font-bold h-9">
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Embed Video Stream</span>
              </Button>
            </div>
          </form>

          <div className="space-y-2">
            {videos.map((vid) => (
              <div
                key={vid.id}
                className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">{vid.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {vid.channel} • Duration: {vid.duration}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setVideos(videos.filter((v) => v.id !== vid.id));
                    toast.success('Removed video');
                  }}
                  className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Announcements Tab */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          <form
            onSubmit={handleAddAnnouncement}
            className="p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-card/60 backdrop-blur-xl shadow-xs space-y-4"
          >
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4 text-purple-600" />
              <span>Broadcast Official Announcement & Top Banner</span>
            </h3>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Announcement Header</label>
                  <input
                    type="text"
                    value={newAnnTitle}
                    onChange={(e) => setNewAnnTitle(e.target.value)}
                    placeholder="e.g. CBSE Practical Exam Schedule Announced"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Priority</label>
                  <select
                    value={newAnnPriority}
                    onChange={(e) => setNewAnnPriority(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-purple-500"
                  >
                    <option value="normal">Standard Notice</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent Board Alert</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Message Body</label>
                <textarea
                  value={newAnnBody}
                  onChange={(e) => setNewAnnBody(e.target.value)}
                  rows={3}
                  placeholder="Detail instructions for Class 12 candidates..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Button type="submit" variant="primary" className="text-xs font-bold h-9">
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Publish Announcement</span>
              </Button>
            </div>
          </form>

          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 space-y-1.5 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        ann.priority === 'urgent'
                          ? 'bg-rose-500 animate-ping'
                          : ann.priority === 'high'
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    <h4 className="font-bold text-xs sm:text-sm text-foreground">{ann.title}</h4>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{ann.date}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{ann.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Feature Toggles Tab */}
      {activeTab === 'toggles' && (
        <div className="space-y-4 p-6 rounded-3xl bg-card/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <ToggleRight className="w-4 h-4 text-purple-600" />
                <span>Remote Config & Feature Flags</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Toggle capabilities in real time without redeploying code.
              </p>
            </div>
            <span className="text-[10px] font-mono text-purple-600 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full font-bold">
              v{remoteCfg.version.currentVersion}
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {[
              {
                id: 'musicVault',
                label: 'Study Audio & Focus Lofi Vault',
                desc: 'Allow candidates to listen to ambient binaural study audio',
                enabled: remoteCfg.features.musicVault,
              },
              {
                id: 'studyReports',
                label: 'Diagnostic Study Reports',
                desc: 'Generate Daily, Weekly, and Monthly diagnostic cards',
                enabled: remoteCfg.features.studyReports,
              },
              {
                id: 'achievements',
                label: 'Gamified CBSE Achievements',
                desc: 'Reward students with badges for streaks and completed chapters',
                enabled: remoteCfg.features.achievements,
              },
              {
                id: 'shareCards',
                label: 'One-Click Milestone Share Cards',
                desc: 'Enable high-resolution share cards for social milestones',
                enabled: remoteCfg.features.shareCards,
              },
              {
                id: 'practiceMockTests',
                label: 'Board Mock Tests & Practice Bank',
                desc: 'Full access to 10-year official CBSE PYQ database',
                enabled: remoteCfg.features.practiceMockTests,
              },
            ].map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5"
              >
                <div>
                  <div className="text-xs font-bold text-foreground">{f.label}</div>
                  <p className="text-[11px] text-muted-foreground">{f.desc}</p>
                </div>

                <button
                  onClick={() => {
                    remoteConfig.setFeatureFlag(f.id as any, !f.enabled);
                    toast.success(`${f.label} ${!f.enabled ? 'Enabled' : 'Disabled'}`);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                    f.enabled
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-muted-foreground'
                  }`}
                >
                  {f.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-card/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
              <div className="flex items-center gap-2 text-xs text-purple-600 font-bold uppercase tracking-wider">
                <Users className="w-4 h-4" />
                <span>Active Candidates</span>
              </div>
              <div className="text-2xl font-black text-foreground font-mono">1,428</div>
              <p className="text-[11px] text-muted-foreground">CBSE Class 12 Science PCM</p>
            </div>

            <div className="p-5 rounded-3xl bg-card/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
              <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Tasks Completed</span>
              </div>
              <div className="text-2xl font-black text-emerald-600 font-mono">18,940</div>
              <p className="text-[11px] text-muted-foreground">Daily syllabus missions verified</p>
            </div>

            <div className="p-5 rounded-3xl bg-card/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
              <div className="flex items-center gap-2 text-xs text-blue-600 font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>PYQ Questions Solved</span>
              </div>
              <div className="text-2xl font-black text-blue-600 font-mono">34,120</div>
              <p className="text-[11px] text-muted-foreground">Official CBSE answer key verified</p>
            </div>

            <div className="p-5 rounded-3xl bg-card/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
              <div className="flex items-center gap-2 text-xs text-amber-600 font-bold uppercase tracking-wider">
                <Database className="w-4 h-4" />
                <span>Firestore Sync Health</span>
              </div>
              <div className="text-2xl font-black text-amber-600 font-mono">99.98%</div>
              <p className="text-[11px] text-muted-foreground">Debounced batch flushes active</p>
            </div>
          </div>

          {/* Popular Chapters Ranking */}
          <div className="p-6 rounded-3xl bg-card/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Most Studied CBSE Class 12 Chapters This Week
            </h4>
            <div className="space-y-2 pt-1">
              {[
                { name: 'Ray Optics and Optical Instruments', subject: 'Physics', students: '894', pct: 88 },
                { name: 'Electrochemistry', subject: 'Chemistry', students: '782', pct: 76 },
                { name: 'Integrals (Definite & Indefinite)', subject: 'Mathematics', students: '745', pct: 72 },
                { name: 'Aldehydes, Ketones and Carboxylic Acids', subject: 'Chemistry', students: '690', pct: 67 },
                { name: 'Electric Charges and Fields', subject: 'Physics', students: '654', pct: 64 },
              ].map((c, i) => (
                <div
                  key={i}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-muted-foreground w-4 text-center">
                      #{i + 1}
                    </span>
                    <div>
                      <div className="font-bold text-foreground">{c.name}</div>
                      <div className="text-[10px] text-muted-foreground">{c.subject}</div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                    {c.students} Candidates
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
