import React, { useState } from 'react';
import {
  Shield,
  Upload,
  Music,
  Bell,
  BarChart3,
  FileText,
  CheckCircle2,
  Trash2,
  Plus,
  Play,
  Pause,
  AlertCircle,
  Database,
  Users,
  Sparkles,
} from 'lucide-react';
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
  isPlaying?: boolean;
}

interface Announcement {
  id: string;
  title: string;
  body: string;
  priority: 'high' | 'normal';
  date: string;
}

export const AdminDashboardView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'materials' | 'music' | 'announcements' | 'analytics'>(
    'materials'
  );

  // Sample production-ready materials state
  const [materials, setMaterials] = useState<StudyMaterial[]>([
    {
      id: 'mat_1',
      title: 'Class 12 Physics Complete Ray Optics Master Notes',
      subject: 'Physics',
      chapter: 'Ray Optics',
      type: 'revision_notes',
      size: '2.4 MB',
      uploadedAt: 'Today, 10:30 AM',
    },
    {
      id: 'mat_2',
      title: 'Chemistry 10-Year High-Yield Organic Conversions',
      subject: 'Chemistry',
      chapter: 'Aldehyde Ketone',
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

  // Audio tracks
  const [tracks, setTracks] = useState<StudyTrack[]>([
    { id: 'trk_1', title: 'Deep Focus Alpha Waves 432Hz', duration: '45:00', genre: 'Binaural Beats' },
    { id: 'trk_2', title: 'CBSE Late Night Lofi Study Beats', duration: '60:00', genre: 'Lofi Hip Hop' },
    { id: 'trk_3', title: 'Rainy Day Library Concentration', duration: '30:00', genre: 'Ambient Rain' },
  ]);

  // Announcements
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

  // New item modal states
  const [newMaterialTitle, setNewMaterialTitle] = useState('');
  const [newMaterialSubject, setNewMaterialSubject] = useState('Physics');
  const [newMaterialChapter, setNewMaterialChapter] = useState('Ray Optics');

  const [newTrackTitle, setNewTrackTitle] = useState('');
  const [newTrackDuration, setNewTrackDuration] = useState('30:00');

  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnBody, setNewAnnBody] = useState('');
  const [newAnnPriority, setNewAnnPriority] = useState<'high' | 'normal'>('normal');

  const handleUploadMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterialTitle.trim()) {
      toast.error('Title is required');
      return;
    }
    const item: StudyMaterial = {
      id: `mat_${Date.now()}`,
      title: newMaterialTitle.trim(),
      subject: newMaterialSubject,
      chapter: newMaterialChapter,
      type: 'revision_notes',
      size: '1.2 MB',
      uploadedAt: 'Just now',
    };
    setMaterials([item, ...materials]);
    setNewMaterialTitle('');
    toast.success('Study Material deployed to CBSE Class 12 PCM students!');
  };

  const handleUploadTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrackTitle.trim()) {
      toast.error('Track title is required');
      return;
    }
    const item: StudyTrack = {
      id: `trk_${Date.now()}`,
      title: newTrackTitle.trim(),
      duration: newTrackDuration,
      genre: 'Focus Lofi',
    };
    setTracks([item, ...tracks]);
    setNewTrackTitle('');
    toast.success('Study track added to Rankify Focus Audio!');
  };

  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle.trim() || !newAnnBody.trim()) {
      toast.error('Title and announcement content required');
      return;
    }
    const item: Announcement = {
      id: `ann_${Date.now()}`,
      title: newAnnTitle.trim(),
      body: newAnnBody.trim(),
      priority: newAnnPriority,
      date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    setAnnouncements([item, ...announcements]);
    setNewAnnTitle('');
    setNewAnnBody('');
    toast.success('Broadcast announcement sent to all active students!');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Admin Header Banner */}
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
            CBSE Class 12 Science PCM Curriculum Control, Content Deployment & Analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono font-bold text-emerald-300">Live Sync Active</span>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-white/5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'materials'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Study Materials ({materials.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('music')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'music'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span>Study Audio ({tracks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'announcements'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Announcements ({announcements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'analytics'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Platform Analytics</span>
        </button>
      </div>

      {/* Tab 1: Study Material Upload */}
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
                  value={newMaterialTitle}
                  onChange={(e) => setNewMaterialTitle(e.target.value)}
                  placeholder="e.g. CBSE 2026 Hot Derivations — Ray Optics"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Subject</label>
                <select
                  value={newMaterialSubject}
                  onChange={(e) => setNewMaterialSubject(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-purple-500"
                >
                  <option value="Physics">Physics (042)</option>
                  <option value="Chemistry">Chemistry (043)</option>
                  <option value="Mathematics">Mathematics (041)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Material</span>
              </button>
            </div>
          </form>

          {/* List of uploaded materials */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Currently Deployed Materials
            </h4>
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
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Study Music Upload */}
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
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Audio</span>
              </button>
            </div>
          </form>

          {/* List of study tracks */}
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
                    onClick={() => {
                      toast.success(`Playing preview: ${trk.title}`);
                    }}
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

      {/* Tab 3: Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          <form
            onSubmit={handleAddAnnouncement}
            className="p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-card/60 backdrop-blur-xl shadow-xs space-y-4"
          >
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4 text-purple-600" />
              <span>Broadcast Official Announcement</span>
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
                    <option value="high">High Priority Alert</option>
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
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Publish Announcement</span>
              </button>
            </div>
          </form>

          {/* List of announcements */}
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
                        ann.priority === 'high' ? 'bg-rose-500 animate-ping' : 'bg-blue-500'
                      }`}
                    />
                    <h4 className="font-bold text-xs sm:text-sm text-foreground">{ann.title}</h4>
                    {ann.priority === 'high' && (
                      <span className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200/50">
                        Urgent
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{ann.date}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{ann.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Platform Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-card/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
              <div className="flex items-center gap-2 text-xs text-purple-600 font-bold uppercase tracking-wider">
                <Users className="w-4 h-4" />
                <span>Active Candidates</span>
              </div>
              <div className="text-2xl font-black text-foreground font-mono">1,428</div>
              <p className="text-[11px] text-muted-foreground">CBSE Class 12 Science PCM stream</p>
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
                <span>AI Doubts Resolved</span>
              </div>
              <div className="text-2xl font-black text-blue-600 font-mono">34,120</div>
              <p className="text-[11px] text-muted-foreground">Zero hallucination rate verified</p>
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

          <div className="p-6 rounded-3xl bg-card/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Subject Difficulty Distribution (Aggregated Diagnostic)
            </h4>
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Physics (Ray Optics & Alternating Current)</span>
                  <span className="text-rose-500">62% students flagged as focus</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: '62%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Chemistry (Electrochemistry & Organic Mechanisms)</span>
                  <span className="text-amber-500">48% students flagged as focus</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '48%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Mathematics (Integrals & 3D Geometry)</span>
                  <span className="text-purple-500">55% students flagged as focus</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: '55%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
