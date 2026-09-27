import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { syncEngine } from '@/services/sync-engine';
import { db } from '@/firebase/config';
import { collection, doc, getDocs, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import {
  Sparkles,
  Video,
  Play,
  Clock,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Award,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Bookmark,
  Share2,
  Trash2,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Check,
  FileText,
  Activity,
  Compass,
  Copy,
  FolderHeart,
  Calendar,
  Flame,
  User,
  GraduationCap,
  Sparkle,
} from 'lucide-react';

export interface LectureAnalysis {
  url: string;
  videoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  detectedSubject: string;
  detectedChapter: string;
  difficulty: string;
  confidenceScore: number;
  analysisDate: string;
  estimatedStudyTime: string;
  duration: string;
  board?: string;
  language?: string;
  aiSummary: {
    ultraShort: string;
    detailed: string;
    examSummary: string;
    oneMinuteRevision: string;
    teacherNotes?: string;
  };
  keyConcepts: {
    title: string;
    definition: string;
    explanation: string;
    example: string;
    importance: string;
    examImportance?: string;
  }[];
  importantFormulas: {
    name: string;
    formula: string;
    description: string;
    application: string;
    meaning?: string;
    variables?: string;
    units?: string;
    whereUsed?: string;
    commonMistakes?: string;
  }[];
  timeline: {
    timestamp: string;
    title: string;
    description: string;
  }[];
  mcqs: {
    question: string;
    options: string[];
    answer: string;
    explanation: string;
    mistakeAnalysis?: string;
  }[];
  shortQuestions: {
    question: string;
    answer: string;
    points: string[];
    mistakeAnalysis?: string;
  }[];
  longQuestions: {
    question: string;
    answer: string;
    detailedPoints: string[];
    mistakeAnalysis?: string;
  }[];
  hotsQuestions: {
    question: string;
    answer: string;
    explanation: string;
    mistakeAnalysis?: string;
  }[];
  competencyQuestions: {
    scenario: string;
    question: string;
    answer: string;
    explanation: string;
    mistakeAnalysis?: string;
  }[];
  assertionReason: {
    assertion: string;
    reason: string;
    answer: string;
    explanation: string;
    mistakeAnalysis?: string;
  }[];
  caseStudy: {
    scenario: string;
    question: string;
    answer: string;
    explanation: string;
    mistakeAnalysis?: string;
  }[];
  boardPatternQuestions: {
    question: string;
    expectedKeywords: string[];
    answer: string;
    mistakeAnalysis?: string;
  }[];
  numericals?: {
    question: string;
    formulaUsed: string;
    solutionStepByStep: string[];
    finalAnswer: string;
    mistakeAnalysis?: string;
  }[];
  boardExpectedQuestions?: {
    question: string;
    answer: string;
    keywords: string[];
  }[];
  veryImportantQuestions?: {
    question: string;
    answer: string;
    explanation: string;
  }[];
  weakTopics?: {
    concept: string;
    category: string;
    description: string;
  }[];
  smartRecommendations?: {
    type: string;
    recommendationText: string;
    details: string;
  }[];
  revisionMode: {
    revisionNotes: string;
    mindMap: string;
    flashcards: { front: string; back: string }[];
    lastMinuteNotes: string[];
    formulaSheet?: string;
    quickNotes?: string;
    examNotes?: string;
    oneNightBeforeExamNotes?: string;
  };
  savedAt?: string;
}

const ANALYSIS_STAGES = [
  { id: 'fetch', label: 'Fetching video' },
  { id: 'understand', label: 'Understanding lecture' },
  { id: 'subject', label: 'Detecting subject' },
  { id: 'chapter', label: 'Detecting chapter' },
  { id: 'extract', label: 'Extracting concepts' },
  { id: 'notes', label: 'Generating study notes' },
  { id: 'questions', label: 'Preparing questions' },
  { id: 'revision', label: 'Creating revision sheet' },
];

export const LectureLabView: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.uid || 'guest';

  // Core State
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [analysis, setAnalysis] = useState<LectureAnalysis | null>(null);
  const [library, setLibrary] = useState<LectureAnalysis[]>([]);
  const [savedFormulas, setSavedFormulas] = useState<{ name: string; formula: string }[]>([]);
  
  // Video preview and advanced correction settings
  const [previewData, setPreviewData] = useState<{ title: string; channelName: string; thumbnailUrl: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showPreOverrides, setShowPreOverrides] = useState(false);
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [correctedSubject, setCorrectedSubject] = useState('');
  const [correctedChapter, setCorrectedChapter] = useState('');
  const [correctedLanguage, setCorrectedLanguage] = useState('English');

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'summary' | 'concepts' | 'formulas' | 'timeline' | 'questions' | 'revision'>('summary');
  const [summarySubTab, setSummarySummarySubTab] = useState<'ultra' | 'detailed' | 'exam' | 'teacher' | 'onemin'>('ultra');
  const [activeQuestionTab, setActiveQuestionTab] = useState<'mcqs' | 'short' | 'long' | 'hots' | 'competency' | 'assertion' | 'case' | 'board' | 'boardExpected' | 'viqs' | 'numericals'>('mcqs');
  const [activeRevisionTab, setActiveRevisionTab] = useState<'notes' | 'mindmap' | 'flashcards' | 'lastminute' | 'formulaSheet' | 'quickNotes' | 'examNotes' | 'oneNightBeforeExamNotes'>('notes');
  
  // Interactive UI States
  const [isSaved, setIsSaved] = useState(false);
  const [expandedConceptIdx, setExpandedConceptIdx] = useState<number | null>(0);
  const [flippedCardIdx, setExpandedCardIdx] = useState<Record<number, boolean>>({});

  // Practice States
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [mcqScore, setMcqScore] = useState<number | null>(null);
  const [showMcqResults, setShowMcqScore] = useState(false);
  const [arAnswers, setArAnswers] = useState<Record<number, string>>({});
  const [revealedSubjective, setRevealedSubjective] = useState<Record<string, boolean>>({});

  // Initialize
  useEffect(() => {
    if (!userId) return;

    // Load Last Lecture session from Local Cache
    const lastSession = syncEngine.getLocalCache<LectureAnalysis>('lecturelab_last_analyzed', userId);
    if (lastSession) {
      setAnalysis(lastSession);
      const isSavedInCache = syncEngine.getLocalCache<boolean>(`lecturelab_is_saved_${lastSession.videoId}`, userId);
      setIsSaved(!!isSavedInCache);
    }

    // Load saved formulas list
    const cachedFormulas = syncEngine.getLocalCache<{ name: string; formula: string }[]>('lecturelab_saved_formulas', userId);
    if (cachedFormulas) setSavedFormulas(cachedFormulas);

    fetchLibrary();
  }, [userId]);

  const fetchLibrary = async () => {
    try {
      const q = collection(db, 'users', userId, 'lecturelab_analyses');
      const snap = await getDocs(q);
      const items: LectureAnalysis[] = [];
      snap.forEach((doc) => {
        items.push(doc.data() as LectureAnalysis);
      });
      
      // Sort library by savedAt desc
      items.sort((a, b) => {
        const dateA = a.savedAt ? new Date(a.savedAt).getTime() : 0;
        const dateB = b.savedAt ? new Date(b.savedAt).getTime() : 0;
        return dateB - dateA;
      });

      setLibrary(items);
      syncEngine.setLocalCache('lecturelab_library', items, userId);
    } catch (e) {
      console.warn('Failed to fetch library from firestore:', e);
      const cached = syncEngine.getLocalCache<LectureAnalysis[]>('lecturelab_library', userId);
      if (cached) setLibrary(cached);
    }
  };

  // Stage transition simulation for analysis
  useEffect(() => {
    if (!isLoading) return;
    setCurrentStageIdx(0);

    const interval = setInterval(() => {
      setCurrentStageIdx((prev) => {
        if (prev < ANALYSIS_STAGES.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Extract YouTube Video ID
  const extractVideoId = (inputUrl: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = inputUrl.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Live oEmbed URL preview fetcher
  useEffect(() => {
    const videoId = extractVideoId(url);
    if (!videoId) {
      setPreviewData(null);
      return;
    }

    const fetchPreview = async () => {
      setPreviewLoading(true);
      try {
        const oembedUrl = `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`;
        const res = await fetch(oembedUrl);
        if (res.ok) {
          const data = await res.json();
          setPreviewData({
            title: data.title || 'CBSE Class 12 Lecture',
            channelName: data.author_name || 'YouTube Educator',
            thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          });
        } else {
          setPreviewData({
            title: 'CBSE Class 12 Lecture',
            channelName: 'YouTube Educator',
            thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          });
        }
      } catch (e) {
        setPreviewData({
          title: 'CBSE Class 12 Lecture',
          channelName: 'YouTube Educator',
          thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        });
      } finally {
        setPreviewLoading(false);
      }
    };

    fetchPreview();
  }, [url]);

  // Main Companion Analysis trigger
  const handleAnalyzeLecture = async (
    targetUrl?: string,
    subjOverride?: string,
    chapOverride?: string,
    langOverride?: string
  ) => {
    const lectureUrl = targetUrl || url;
    if (!lectureUrl) {
      toast.error('Please paste a valid YouTube lecture link first!');
      return;
    }

    const videoId = extractVideoId(lectureUrl);
    if (!videoId) {
      toast.error('Could not identify a valid YouTube Video ID. Please check the URL format!');
      return;
    }

    // PERFORMANCE: Avoid duplicate analysis if lecture already exists in library (ONLY if no overrides specified)
    const hasOverrides = subjOverride || chapOverride || langOverride;
    if (!hasOverrides) {
      const cachedItem = library.find((item) => item.videoId === videoId);
      if (cachedItem) {
        setAnalysis(cachedItem);
        setIsSaved(true);
        setSelectedAnswers({});
        setMcqScore(null);
        setShowMcqScore(false);
        setArAnswers({});
        setRevealedSubjective({});
        syncEngine.setLocalCache('lecturelab_last_analyzed', cachedItem, userId);
        toast.success('Loaded saved lecture analysis instantly from cache!', { icon: '⚡' });
        return;
      }
    }

    // Call secure backend
    setIsLoading(true);
    setAnalysis(null);
    setSelectedAnswers({});
    setMcqScore(null);
    setShowMcqScore(false);
    setArAnswers({});
    setRevealedSubjective({});

    try {
      const response = await fetch('/api/lecturelab/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: lectureUrl,
          subjectOverride: subjOverride,
          chapterOverride: chapOverride,
          languageOverride: langOverride,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server failed to analyze');
      }

      const data = (await response.json()) as LectureAnalysis;
      setAnalysis(data);
      setIsSaved(false);

      // Cache session locally
      syncEngine.setLocalCache('lecturelab_last_analyzed', data, userId);
      syncEngine.setLocalCache(`lecturelab_is_saved_${data.videoId}`, false, userId);
      toast.success('AI Lecture Companion synthesized successfully!', { icon: '🎓' });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Analysis failed. Please try a different Class 12 video.');
    } finally {
      setIsLoading(false);
    }
  };

  // Save full Companion analysis
  const handleSaveCompanion = async () => {
    if (!analysis) return;
    try {
      const payload: LectureAnalysis = {
        ...analysis,
        savedAt: new Date().toISOString(),
      };

      const docRef = doc(db, 'users', userId, 'lecturelab_analyses', analysis.videoId);
      await setDoc(docRef, payload, { merge: true });

      setIsSaved(true);
      syncEngine.setLocalCache(`lecturelab_is_saved_${analysis.videoId}`, true, userId);
      await fetchLibrary();
      toast.success('AI Lecture Companion saved securely!', { icon: '💾' });
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to save companion file');
    }
  };

  // Delete from Library
  const handleDeleteFromLibrary = async (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const docRef = doc(db, 'users', userId, 'lecturelab_analyses', videoId);
      await deleteDoc(docRef);
      
      if (analysis?.videoId === videoId) {
        setIsSaved(false);
        syncEngine.setLocalCache(`lecturelab_is_saved_${videoId}`, false, userId);
      }

      await fetchLibrary();
      toast.success('Deleted from Lecture Library');
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to delete');
    }
  };

  // Save formula to private vault
  const handleSaveFormula = (name: string, formula: string) => {
    const isAlreadySaved = savedFormulas.some((f) => f.formula === formula);
    if (isAlreadySaved) {
      toast.error('Formula already saved to your private bank!');
      return;
    }
    const updated = [...savedFormulas, { name, formula }];
    setSavedFormulas(updated);
    syncEngine.setLocalCache('lecturelab_saved_formulas', updated, userId);
    toast.success('Formula saved to your personal vault!', { icon: '💖' });
  };

  // Copy Formula to Clipboard
  const handleCopyFormula = (formula: string) => {
    navigator.clipboard.writeText(formula);
    toast.success('Formula copied to clipboard!');
  };

  // Score Practice MCQs
  const handleScoreMcqs = () => {
    if (!analysis) return;
    let score = 0;
    analysis.mcqs.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.answer) {
        score++;
      }
    });
    setMcqScore(score);
    setShowMcqScore(true);
    toast.success(`You scored ${score}/10! Review details below.`);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* 1. COMPANION PREMIUM banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-950 to-purple-950 p-6 sm:p-10 text-white shadow-2xl border border-indigo-500/20">
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-3.5 py-1 text-xs font-semibold text-indigo-200 border border-white/15">
            <Sparkles className="h-3.5 w-3.5 text-indigo-300 animate-pulse" />
            <span>AI Lecture Companion Pro</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            AI Lecture Companion
          </h1>

          <p className="text-sm sm:text-base text-indigo-100/90 max-w-3xl leading-relaxed">
            Unleash full-stack cognitive study. Paste a Class 12 lecture link to map core definitions, spaced timeline markers, copyable formula banks, flashcard decks, and instant interactive board practice suites.
          </p>
        </div>

        {/* Backdrop visual elements */}
        <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-72 h-72 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* 2. ANALYZE LINK FORM */}
      <Card className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl p-6 sm:p-8">
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="text-center space-y-1">
            <h3 className="font-extrabold text-lg text-foreground flex items-center justify-center gap-1.5">
              <Video className="w-5 h-5 text-indigo-500" />
              <span>Companion Video Synthesis</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Paste normal links, shorts, youtu.be, or playlist URLs. Preview details before running elite AI curriculum mapping.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube Link..."
              disabled={isLoading}
              className="flex-1 h-12 px-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold transition"
            />
            <Button
              onClick={() => handleAnalyzeLecture(url, correctedSubject || undefined, correctedChapter || undefined, correctedLanguage || undefined)}
              disabled={isLoading || !url}
              className="h-12 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold shadow-lg shadow-indigo-500/20 shrink-0 gap-2 cursor-pointer transition-colors animate-pulse"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Lecture</span>
                </>
              )}
            </Button>
          </div>

          {/* Video Preview and Custom Settings Selection before Analysis */}
          {previewLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2" />
              <span className="text-xs font-semibold text-muted-foreground">Fetching YouTube video information...</span>
            </div>
          )}

          {previewData && !previewLoading && (
            <div className="p-4 rounded-2xl bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/5 space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="w-28 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-900 shadow border border-slate-200 dark:border-white/10 relative">
                  <img src={previewData.thumbnailUrl} alt="Video Thumbnail" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <Play className="w-5 h-5 text-white fill-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 font-mono">Video Selected</span>
                  <h4 className="text-sm font-extrabold text-foreground truncate">{previewData.title}</h4>
                  <p className="text-xs text-muted-foreground">Channel: {previewData.channelName}</p>
                </div>
              </div>

              {/* Adjust Settings Panel */}
              <div className="border-t border-slate-200 dark:border-white/5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPreOverrides(!showPreOverrides)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>{showPreOverrides ? 'Hide settings customization' : 'Incorrect detection preview? Override subject, chapter, or language'}</span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showPreOverrides ? 'rotate-90' : ''}`} />
                </button>

                {showPreOverrides && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 animate-slideDown">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground block">Correct Subject</label>
                      <select
                        value={correctedSubject}
                        onChange={(e) => setCorrectedSubject(e.target.value)}
                        className="w-full h-9 px-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">-- Let AI Auto-Detect --</option>
                        <option value="Physics">Physics</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Biology">Biology</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground block">Correct Chapter Name</label>
                      <input
                        type="text"
                        value={correctedChapter}
                        onChange={(e) => setCorrectedChapter(e.target.value)}
                        placeholder="E.g., Solutions, Electric Charges..."
                        className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground block">Target Language</label>
                      <select
                        value={correctedLanguage}
                        onChange={(e) => setCorrectedLanguage(e.target.value)}
                        className="w-full h-9 px-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="English">English Only</option>
                        <option value="Hinglish">Hinglish (Hindi + English)</option>
                        <option value="Hindi">Hindi Only</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 3. PREMIUM STAGED LOADING SCREEN */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="p-8 rounded-3xl border border-indigo-500/30 bg-white/95 dark:bg-slate-900/95 text-center shadow-2xl max-w-xl mx-auto space-y-6 relative overflow-hidden backdrop-blur-2xl"
          >
            <div className="relative w-28 h-24 mx-auto flex items-center justify-center">
              <div className="h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-foreground">AI Lecture Companion is synthesizing...</h3>
              <p className="text-xs text-muted-foreground">Mapping your Class 12 syllabus contents using Gemini 3.8 Flash.</p>
            </div>

            {/* Stages Grid with ticking checkmarks */}
            <div className="text-left grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 max-w-md mx-auto">
              {ANALYSIS_STAGES.map((stg, i) => {
                const isPassed = currentStageIdx > i;
                const isCurrent = currentStageIdx === i;

                return (
                  <div
                    key={stg.id}
                    className={`flex items-center gap-2 text-xs font-semibold py-1 px-2.5 rounded-lg transition-all duration-300 ${
                      isCurrent
                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold'
                        : isPassed
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-muted-foreground opacity-50'
                    }`}
                  >
                    <div className="shrink-0">
                      {isPassed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : isCurrent ? (
                        <div className="h-3 w-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
                      )}
                    </div>
                    <span className="truncate">{stg.label}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. ACTIVE UPGRADED COMPANION COMPONENT */}
      {analysis && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* LECTURE DASHBOARD SUMMARY CARD */}
          <Card className="rounded-3xl border-2 border-indigo-500/25 bg-gradient-to-r from-slate-50 to-indigo-50/10 dark:from-slate-900 dark:to-indigo-950/10 p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-center gap-6">
            <div className="w-full md:w-56 h-32 rounded-2xl overflow-hidden relative group shrink-0 shadow-md border border-slate-200/80 dark:border-white/10">
              <img
                src={analysis.thumbnailUrl}
                alt="Thumbnail"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                <Play className="w-10 h-10 text-white fill-white" />
              </div>
            </div>

            <div className="flex-1 space-y-2.5 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  {analysis.detectedSubject}
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  {analysis.detectedChapter}
                </span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {analysis.board || 'CBSE'}
                </span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {analysis.language || 'English'}
                </span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/25">
                  {analysis.difficulty}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-snug truncate" title={analysis.title}>
                {analysis.title}
              </h2>

              <p className="text-xs text-muted-foreground">
                Channel: <strong className="text-foreground">{analysis.channelName}</strong>
              </p>

              {/* Upgraded Dashboard Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 dark:border-white/5 text-[11px] font-mono font-bold text-muted-foreground">
                <div>
                  Duration: <strong className="text-foreground">{analysis.duration}</strong>
                </div>
                <div>
                  Time: <strong className="text-foreground">{analysis.estimatedStudyTime}</strong>
                </div>
                <div>
                  Confidence: <strong className="text-emerald-500">{analysis.confidenceScore || 95}%</strong>
                </div>
                <div>
                  Analyzed: <strong className="text-foreground">{analysis.analysisDate || new Date().toISOString().split('T')[0]}</strong>
                </div>
              </div>

              {/* Post-Analysis Adjustment Correction Panel */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCorrectedSubject(analysis.detectedSubject);
                    setCorrectedChapter(analysis.detectedChapter);
                    setCorrectedLanguage(analysis.language || 'English');
                    setShowCorrectionForm(!showCorrectionForm);
                  }}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>Incorrect auto-detection? Change Subject, Chapter, or Language</span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showCorrectionForm ? 'rotate-90' : ''}`} />
                </button>

                {showCorrectionForm && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-muted-foreground">Correct Subject</label>
                      <select
                        value={correctedSubject}
                        onChange={(e) => setCorrectedSubject(e.target.value)}
                        className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-xs font-semibold"
                      >
                        <option value="Physics">Physics</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Biology">Biology</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-muted-foreground">Correct Chapter</label>
                      <input
                        type="text"
                        value={correctedChapter}
                        onChange={(e) => setCorrectedChapter(e.target.value)}
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-xs font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-muted-foreground">Correct Language</label>
                      <select
                        value={correctedLanguage}
                        onChange={(e) => setCorrectedLanguage(e.target.value)}
                        className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-xs font-semibold"
                      >
                        <option value="English">English</option>
                        <option value="Hinglish">Hinglish</option>
                        <option value="Hindi">Hindi</option>
                      </select>
                    </div>

                    <div className="col-span-1 sm:col-span-3 flex justify-end gap-2 pt-1 border-t border-slate-100 dark:border-white/5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowCorrectionForm(false)}
                        className="h-8 text-xs font-bold rounded-lg"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setShowCorrectionForm(false);
                          handleAnalyzeLecture(analysis.url, correctedSubject, correctedChapter, correctedLanguage);
                        }}
                        className="h-8 text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4"
                      >
                        Re-Analyze with Corrections
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 flex md:flex-col items-center justify-end gap-2 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 md:border-l border-slate-200/60 dark:border-white/5 md:pl-6">
              <Button
                variant={isSaved ? 'outline' : 'primary'}
                onClick={handleSaveCompanion}
                disabled={isSaved}
                className="w-full md:w-44 h-10 rounded-xl font-bold text-xs gap-1.5 cursor-pointer"
              >
                {isSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                    <span>Saved to Companion list</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Save Companion</span>
                  </>
                )}
              </Button>
              
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="h-10 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border-slate-200/80 dark:border-white/10"
                >
                  <span>Print / PDF</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const content = `# ${analysis.title}\nSubject: ${analysis.detectedSubject} | Chapter: ${analysis.detectedChapter}\n\n## Summary\n${analysis.aiSummary.detailed}\n\n## Key Concepts\n${analysis.keyConcepts.map((c, i) => `${i+1}. ${c.title}\nDefinition: ${c.definition}\nExplanation: ${c.explanation}`).join('\n\n')}`;
                    const blob = new Blob([content], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${analysis.detectedSubject}_${analysis.detectedChapter}_Notes.md`.replace(/\s+/g, '_');
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    toast.success('Notes downloaded as markdown package!');
                  }}
                  className="h-10 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border-slate-200/80 dark:border-white/10"
                >
                  <span>Export MD</span>
                </Button>
              </div>

              <a
                href={analysis.url}
                target="_blank"
                rel="noreferrer"
                className="w-full md:w-44 h-10 rounded-xl border border-slate-200/85 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-xs font-bold gap-1.5 transition"
              >
                <span>Watch Video</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </Card>

          {/* Interactive Navigation Menu */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none border-b border-slate-200 dark:border-white/10">
            {[
              { id: 'summary', label: 'AI Summary', icon: FileText },
              { id: 'concepts', label: 'Key Concepts', icon: Layers },
              { id: 'formulas', label: 'Formula Sheet', icon: BookOpen },
              { id: 'timeline', label: 'Topic Timeline', icon: Clock },
              { id: 'questions', label: 'Expected Board Questions', icon: HelpCircle },
              { id: 'revision', label: 'Revision Mode', icon: RotateCcw },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2.5 text-xs sm:text-sm font-extrabold border-b-2 transition cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                    isActive
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* 5. TAB DETAILS */}
          <div className="pt-2">
            {/* TAB: AI SUMMARY */}
            {activeTab === 'summary' && (
              <Card className="rounded-3xl p-6 sm:p-8 bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-white/10 shadow-xs space-y-6">
                <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-white/5 w-full sm:w-auto self-start">
                  {[
                    { id: 'ultra', label: 'Ultra Short' },
                    { id: 'detailed', label: 'Detailed Summary' },
                    { id: 'exam', label: 'Exam Summary' },
                    { id: 'teacher', label: 'Teacher Notes' },
                    { id: 'onemin', label: 'One Minute Revision' },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setSummarySummarySubTab(sub.id as any)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                        summarySubTab === sub.id
                           ? 'bg-white dark:bg-slate-900 text-foreground shadow-xs'
                           : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-sm sm:text-base leading-relaxed text-foreground/90 whitespace-pre-wrap font-medium">
                  {summarySubTab === 'ultra' && analysis.aiSummary.ultraShort}
                  {summarySubTab === 'detailed' && analysis.aiSummary.detailed}
                  {summarySubTab === 'exam' && analysis.aiSummary.examSummary}
                  {summarySubTab === 'teacher' && (analysis.aiSummary.teacherNotes || 'Additional detailed teacher guidance notes are compiled in the Revision Sheet tab.')}
                  {summarySubTab === 'onemin' && analysis.aiSummary.oneMinuteRevision}
                </div>
              </Card>
            )}

            {/* TAB: KEY CONCEPTS */}
            {activeTab === 'concepts' && (
              <div className="space-y-4">
                {analysis.keyConcepts.map((item, idx) => {
                  const isExpanded = expandedConceptIdx === idx;
                  return (
                    <Card key={idx} className="rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 shadow-xs overflow-hidden transition-all duration-300">
                      <button
                        onClick={() => setExpandedConceptIdx(isExpanded ? null : idx)}
                        className="w-full p-4 flex items-center justify-between text-left font-bold text-sm sm:text-base text-foreground cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950"
                      >
                        <div className="flex items-center gap-3 pr-4 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center text-xs shrink-0 font-bold">
                            {idx + 1}
                          </span>
                          <span className="truncate">{item.title}</span>
                        </div>
                        <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isExpanded ? 'rotate-90 text-indigo-500' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden border-t border-slate-100 dark:border-slate-800/80"
                          >
                            <div className="p-4 sm:p-5 space-y-4 text-xs sm:text-sm bg-slate-50/50 dark:bg-slate-950/20">
                              <div>
                                <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 block mb-1">
                                  Official Board Definition:
                                </span>
                                <p className="font-extrabold text-foreground leading-snug">{item.definition}</p>
                              </div>
                              <div>
                                <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 block mb-1">
                                  Explanation & Mechanisms:
                                </span>
                                <p className="text-muted-foreground leading-relaxed font-semibold">{item.explanation}</p>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5">
                                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                                    Practical / CBSE Example:
                                  </span>
                                  <p className="text-[11px] text-muted-foreground italic leading-relaxed">{item.example}</p>
                                </div>
                                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5">
                                  <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block mb-1">
                                    CBSE Board Importance & Weightage:
                                  </span>
                                  <p className="text-[11px] text-muted-foreground leading-relaxed">{item.importance}</p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* TAB: FORMULA SHEET */}
            {activeTab === 'formulas' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.importantFormulas.length === 0 ? (
                  <Card className="col-span-2 p-8 text-center text-muted-foreground italic rounded-3xl">
                    No explicit numerical formulas identified for this topic. Notes or flashcards available instead!
                  </Card>
                ) : (
                  analysis.importantFormulas.map((item, idx) => {
                    const isSavedFormula = savedFormulas.some((f) => f.formula === item.formula);
                    return (
                      <Card key={idx} className="rounded-2xl p-5 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 shadow-xs flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                              {item.name}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleCopyFormula(item.formula)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground hover:text-foreground transition cursor-pointer"
                                title="Copy Formula"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleSaveFormula(item.name, item.formula)}
                                className={`p-1.5 rounded-lg transition cursor-pointer ${isSavedFormula ? 'text-rose-500 bg-rose-500/10' : 'text-muted-foreground hover:text-rose-500'}`}
                                title="Save to Formula Vault"
                              >
                                <FolderHeart className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-slate-900 text-white font-mono font-extrabold text-center text-base sm:text-lg tracking-wider border border-white/5 my-1">
                            {item.formula}
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/80 border border-slate-100 dark:border-white/5">
                              <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider block">Variables Meanings</span>
                              <p className="text-foreground/95 font-semibold leading-relaxed mt-0.5">{item.variables || item.description || 'N/A'}</p>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/80 border border-slate-100 dark:border-white/5">
                              <span className="text-[9px] font-bold text-purple-500 uppercase tracking-wider block">SI / Custom Units</span>
                              <p className="text-foreground/95 font-semibold leading-relaxed mt-0.5">{item.units || 'Standard SI Units'}</p>
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground leading-relaxed">
                            <strong className="text-foreground">Syllabus Meaning:</strong> {item.meaning || item.description}
                          </p>
                          
                          {item.whereUsed && (
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              <strong className="text-foreground">Where Applied:</strong> {item.whereUsed}
                            </p>
                          )}
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                          <div>
                            <span className="font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block text-[10px]">
                              Board Exam Application strategy:
                            </span>
                            <p className="text-muted-foreground text-xs italic">{item.application}</p>
                          </div>

                          {item.commonMistakes && (
                            <div className="p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/10 text-xs">
                              <span className="font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block text-[9px] mb-0.5">
                                Common Numerical Pitfalls:
                              </span>
                              <p className="text-muted-foreground font-semibold leading-relaxed">{item.commonMistakes}</p>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB: TIMELINE */}
            {activeTab === 'timeline' && (
              <Card className="rounded-3xl p-6 sm:p-8 bg-white/80 dark:bg-slate-900/80 border border-slate-200/85 dark:border-white/10 shadow-xs">
                <div className="relative border-l-2 border-indigo-500/30 pl-5 sm:pl-8 ml-2 sm:ml-4 space-y-6">
                  {analysis.timeline.map((item, idx) => (
                    <div key={idx} className="relative">
                      <span className="absolute -left-[29px] sm:-left-[41px] top-1 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white dark:border-slate-900 shadow-md shrink-0" />
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-600 text-white font-mono text-xs font-bold">
                          <Clock className="w-3 h-3" />
                          <span>{item.timestamp}</span>
                        </span>
                        <h4 className="font-extrabold text-sm sm:text-base text-foreground pt-1">
                          {item.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-semibold">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* TAB: QUESTIONS & PRACTICE */}
            {activeTab === 'questions' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-white/5">
                  {[
                    { id: 'mcqs', label: '10 MCQs' },
                    { id: 'short', label: '5 Short Qs' },
                    { id: 'long', label: '3 Long Qs' },
                    { id: 'hots', label: '2 HOTS Qs' },
                    { id: 'competency', label: 'Competency' },
                    { id: 'assertion', label: 'Assertion Reason' },
                    { id: 'case', label: 'Case Study' },
                    { id: 'board', label: 'Board Marking' },
                    { id: 'boardExpected', label: 'Board Expected' },
                    { id: 'viqs', label: 'V.I.Qs' },
                    { id: 'numericals', label: 'Numericals' },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setActiveQuestionTab(sub.id as any)}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-xl transition cursor-pointer ${
                        activeQuestionTab === sub.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-4 pt-1">
                  {/* MCQS PRACTICE MODE */}
                  {activeQuestionTab === 'mcqs' && (
                    <div className="space-y-4">
                      {analysis.mcqs.map((q, qIdx) => {
                        const isSelected = selectedAnswers[qIdx] !== undefined;
                        const isCorrectSelected = selectedAnswers[qIdx] === q.answer;

                        return (
                          <Card key={qIdx} className="rounded-2xl p-5 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-white/10 shadow-xs space-y-4">
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-bold bg-indigo-500/10 text-indigo-600 px-2.5 py-0.5 rounded-full font-mono shrink-0">
                                {qIdx + 1}
                              </span>
                              <h4 className="font-extrabold text-sm sm:text-base text-foreground leading-snug">
                                {q.question}
                              </h4>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-3">
                              {q.options.map((opt, oIdx) => {
                                const isUserSelected = selectedAnswers[qIdx] === opt;
                                const isCorrectOpt = opt === q.answer;

                                return (
                                  <button
                                    key={oIdx}
                                    onClick={() => {
                                      if (showMcqResults) return;
                                      setSelectedAnswers((prev) => ({ ...prev, [qIdx]: opt }));
                                    }}
                                    disabled={showMcqResults}
                                    className={`p-3.5 rounded-xl border text-left text-xs font-bold transition-all ${
                                      isUserSelected
                                        ? showMcqResults
                                          ? isCorrectOpt
                                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                                            : 'bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-400'
                                          : 'bg-indigo-500/10 border-indigo-500 text-indigo-600'
                                        : isCorrectOpt && showMcqResults
                                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200/80 dark:border-white/5 hover:border-indigo-400 text-foreground/80'
                                    }`}
                                  >
                                    <span className="font-bold uppercase font-mono mr-2">{String.fromCharCode(65 + oIdx)}.</span>
                                    <span>{opt}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {showMcqResults && (
                              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-xs leading-relaxed text-muted-foreground font-semibold">
                                <strong className="text-foreground">Solution:</strong> {q.explanation}
                              </div>
                            )}
                          </Card>
                        );
                      })}

                      {/* Grading Score action */}
                      {!showMcqResults && Object.keys(selectedAnswers).length > 0 && (
                        <div className="flex justify-end pt-3">
                          <Button
                            onClick={handleScoreMcqs}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20"
                          >
                            Grade Practice Test ({Object.keys(selectedAnswers).length}/10 answered)
                          </Button>
                        </div>
                      )}

                      {showMcqResults && mcqScore !== null && (
                        <div className="p-5 rounded-3xl bg-indigo-500/15 border border-indigo-500/30 text-center space-y-2">
                          <h4 className="text-lg font-black text-indigo-600 dark:text-indigo-400">Score Summary: {mcqScore} / 10</h4>
                          <p className="text-xs text-muted-foreground max-w-sm mx-auto font-medium">
                            Review explanations above. You can reset anytime using the retry action to perfect your performance.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAnswers({});
                              setMcqScore(null);
                              setShowMcqScore(false);
                            }}
                            className="text-indigo-600 border-indigo-500/20 hover:bg-indigo-500/10 rounded-xl"
                          >
                            Reset Test & Try Again
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SHORT QUESTIONS SUB-TAB */}
                  {activeQuestionTab === 'short' && (
                    <div className="space-y-4">
                      {analysis.shortQuestions.map((sq, idx) => {
                        const isRevealed = revealedSubjective[`short_${idx}`];
                        return (
                          <Card key={idx} className="rounded-2xl p-5 bg-white/95 dark:bg-slate-900/95 border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded">
                                Short Answer #{idx + 1} (2-3 Marks)
                              </span>
                              <button
                                onClick={() => setRevealedSubjective((prev) => ({ ...prev, [`short_${idx}`]: !isRevealed }))}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                              >
                                {isRevealed ? 'Hide Answer' : 'Show Answer'}
                              </button>
                            </div>

                            <h4 className="font-extrabold text-sm sm:text-base text-foreground leading-snug">
                              {sq.question}
                            </h4>

                            {isRevealed && (
                              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-xs space-y-3 animate-fadeIn">
                                <div>
                                  <strong className="text-indigo-600 uppercase text-[9px] tracking-wider block mb-1">Model Answer:</strong>
                                  <p className="text-foreground/90 font-medium leading-relaxed">{sq.answer}</p>
                                </div>
                                <div className="pt-2 border-t border-slate-200/60 dark:border-white/5">
                                  <strong className="text-purple-600 uppercase text-[9px] tracking-wider block mb-1">Step Scoring Points:</strong>
                                  <ul className="list-disc pl-4 space-y-1 text-muted-foreground font-semibold">
                                    {sq.points.map((p, pIdx) => <li key={pIdx}>{p}</li>)}
                                  </ul>
                                </div>
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  {/* LONG QUESTIONS SUB-TAB */}
                  {activeQuestionTab === 'long' && (
                    <div className="space-y-4">
                      {analysis.longQuestions.map((lq, idx) => {
                        const isRevealed = revealedSubjective[`long_${idx}`];
                        return (
                          <Card key={idx} className="rounded-2xl p-5 bg-white/95 dark:bg-slate-900/95 border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded">
                                Long Answer Derivation #{idx + 1} (5 Marks)
                              </span>
                              <button
                                onClick={() => setRevealedSubjective((prev) => ({ ...prev, [`long_${idx}`]: !isRevealed }))}
                                className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-bold"
                              >
                                {isRevealed ? 'Hide Derivation' : 'Show Derivation'}
                              </button>
                            </div>

                            <h4 className="font-extrabold text-sm sm:text-base text-foreground leading-snug">
                              {lq.question}
                            </h4>

                            {isRevealed && (
                              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-xs space-y-3 animate-fadeIn">
                                <div>
                                  <strong className="text-purple-600 uppercase text-[9px] tracking-wider block mb-1">Standard Derivation Scheme:</strong>
                                  <p className="text-foreground/90 font-medium leading-relaxed whitespace-pre-wrap">{lq.answer}</p>
                                </div>
                                <div className="pt-2 border-t border-slate-200/60 dark:border-white/5">
                                  <strong className="text-indigo-600 uppercase text-[9px] tracking-wider block mb-1">Expected Derivation Steps:</strong>
                                  <ol className="list-decimal pl-4 space-y-1 text-muted-foreground font-semibold">
                                    {lq.detailedPoints.map((dp, dIdx) => <li key={dIdx}>{dp}</li>)}
                                  </ol>
                                </div>
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  {/* HOTS QUESTIONS SUB-TAB */}
                  {activeQuestionTab === 'hots' && (
                    <div className="space-y-4">
                      {analysis.hotsQuestions.map((hq, idx) => {
                        const isRevealed = revealedSubjective[`hots_${idx}`];
                        return (
                          <Card key={idx} className="rounded-2xl p-5 bg-white/95 dark:bg-slate-900/95 border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded">
                                High Order Thinking Skill (HOTS) #{idx + 1}
                              </span>
                              <button
                                onClick={() => setRevealedSubjective((prev) => ({ ...prev, [`hots_${idx}`]: !isRevealed }))}
                                className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-bold"
                              >
                                {isRevealed ? 'Hide Conceptual Answer' : 'Show Conceptual Answer'}
                              </button>
                            </div>

                            <h4 className="font-extrabold text-sm sm:text-base text-foreground leading-snug">
                              {hq.question}
                            </h4>

                            {isRevealed && (
                              <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/15 text-xs space-y-2 animate-fadeIn">
                                <p className="font-bold text-foreground">HOTS Explanation / Brainstorm:</p>
                                <p className="text-muted-foreground font-semibold leading-relaxed">{hq.answer}</p>
                                <p className="text-[11px] text-rose-600 dark:text-rose-400 leading-relaxed italic">{hq.explanation}</p>
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  {/* COMPETENCY SUB-TAB */}
                  {activeQuestionTab === 'competency' && (
                    <div className="space-y-4">
                      {analysis.competencyQuestions.map((cq, idx) => {
                        const isRevealed = revealedSubjective[`comp_${idx}`];
                        return (
                          <Card key={idx} className="rounded-2xl p-5 bg-white/95 dark:bg-slate-900/95 border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold bg-amber-500/10 text-amber-600 px-2.5 py-0.5 rounded-full font-mono shrink-0">
                                Competency Scenario #{idx + 1}
                              </span>
                              <button
                                onClick={() => setRevealedSubjective((prev) => ({ ...prev, [`comp_${idx}`]: !isRevealed }))}
                                className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-bold"
                              >
                                {isRevealed ? 'Hide Resolution' : 'Show Resolution'}
                              </button>
                            </div>

                            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 text-xs italic text-foreground/80 leading-relaxed">
                              <strong className="text-amber-700 block not-italic uppercase tracking-wider text-[10px] mb-1">Scenario/Setup:</strong>
                              {cq.scenario}
                            </div>

                            <h4 className="font-extrabold text-sm sm:text-base text-foreground leading-snug">
                              {cq.question}
                            </h4>

                            {isRevealed && (
                              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-xs space-y-1 animate-fadeIn">
                                <strong className="text-emerald-600 block uppercase tracking-wider text-[10px] mb-1">CBSE Standard Answer:</strong>
                                <p className="text-foreground/90 font-medium leading-relaxed">{cq.answer}</p>
                                <p className="text-[11px] text-muted-foreground font-semibold pt-1"><strong>Explanation:</strong> {cq.explanation}</p>
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  {/* ASSERTION REASON PRACTICE SUB-TAB */}
                  {activeQuestionTab === 'assertion' && (
                    <div className="space-y-4">
                      {analysis.assertionReason.map((ar, idx) => {
                        const hasUserAnswered = arAnswers[idx] !== undefined;
                        const isCorrect = arAnswers[idx] === ar.answer;

                        return (
                          <Card key={idx} className="rounded-2xl p-5 bg-white/95 dark:bg-slate-900/95 border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                            <span className="text-xs font-bold bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded">
                              Assertion-Reason Question #{idx + 1}
                            </span>

                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-xs sm:text-sm space-y-3">
                              <div>
                                <span className="font-black text-indigo-500 text-[10px] block mb-1">Assertion (A):</span>
                                <p className="font-semibold text-foreground">{ar.assertion}</p>
                              </div>
                              <div className="pt-2 border-t border-slate-200/60 dark:border-white/5">
                                <span className="font-black text-purple-500 text-[10px] block mb-1">Reason (R):</span>
                                <p className="font-semibold text-foreground">{ar.reason}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-2 pl-2">
                              {[
                                { val: 'Option A', label: 'Both (A) and (R) are true and (R) is the correct explanation of (A).' },
                                { val: 'Option B', label: 'Both (A) and (R) are true but (R) is NOT the correct explanation of (A).' },
                                { val: 'Option C', label: '(A) is true but (R) is false.' },
                                { val: 'Option D', label: '(A) is false but (R) is true.' },
                              ].map((option, oIdx) => {
                                const isUserSelected = arAnswers[idx] === option.val;
                                const isCorrectOpt = option.val === ar.answer || (ar.answer.length === 1 && option.val.endsWith(ar.answer));

                                return (
                                  <button
                                    key={oIdx}
                                    onClick={() => {
                                      if (hasUserAnswered) return;
                                      setArAnswers((prev) => ({ ...prev, [idx]: option.val }));
                                    }}
                                    disabled={hasUserAnswered}
                                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                                      isUserSelected
                                        ? isCorrectOpt
                                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-sm'
                                          : 'bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-400'
                                        : isCorrectOpt && hasUserAnswered
                                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200/80 dark:border-white/5 hover:border-indigo-400 text-foreground/80'
                                    }`}
                                  >
                                    <span className="font-bold mr-2 text-indigo-500">{option.val.split(' ')[1]}:</span>
                                    <span>{option.label}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {hasUserAnswered && (
                              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-xs text-muted-foreground font-semibold leading-relaxed">
                                <strong className="text-foreground">Solution:</strong> {ar.explanation}
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  {/* CASE STUDY SUB-TAB */}
                  {activeQuestionTab === 'case' && (
                    <div className="space-y-4">
                      {analysis.caseStudy.map((cs, idx) => {
                        const isRevealed = revealedSubjective[`case_${idx}`];
                        return (
                          <Card key={idx} className="rounded-2xl p-5 bg-white/95 dark:bg-slate-900/95 border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded">
                                Case Study Question #{idx + 1}
                              </span>
                              <button
                                onClick={() => setRevealedSubjective((prev) => ({ ...prev, [`case_${idx}`]: !isRevealed }))}
                                className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-bold"
                              >
                                {isRevealed ? 'Hide Solutions' : 'Show Solutions'}
                              </button>
                            </div>

                            <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/15 text-xs italic text-foreground/80 leading-relaxed">
                              <strong className="text-indigo-700 block not-italic uppercase tracking-wider text-[10px] mb-1">Case Study Passage / Figure Context:</strong>
                              {cs.scenario}
                            </div>

                            <h4 className="font-extrabold text-sm sm:text-base text-foreground leading-snug">
                              {cs.question}
                            </h4>

                            {isRevealed && (
                              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-xs space-y-1 animate-fadeIn">
                                <strong className="text-emerald-600 block uppercase tracking-wider text-[10px] mb-1">Model Resolution:</strong>
                                <p className="text-foreground/90 font-medium leading-relaxed">{cs.answer}</p>
                                <p className="text-[11px] text-muted-foreground font-semibold pt-1"><strong>Reasoning:</strong> {cs.explanation}</p>
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  {/* BOARD PATTERN SUB-TAB */}
                  {activeQuestionTab === 'board' && (
                    <div className="space-y-4">
                      {analysis.boardPatternQuestions.map((bq, idx) => {
                        const isRevealed = revealedSubjective[`board_${idx}`];
                        return (
                          <Card key={idx} className="rounded-2xl p-5 bg-white/95 dark:bg-slate-900/95 border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded">
                                Board Marking Pattern #{idx + 1}
                              </span>
                              <button
                                onClick={() => setRevealedSubjective((prev) => ({ ...prev, [`board_${idx}`]: !isRevealed }))}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                              >
                                {isRevealed ? 'Hide Keywords Scheme' : 'Show Keywords Scheme'}
                              </button>
                            </div>

                            <h4 className="font-extrabold text-sm sm:text-base text-foreground leading-snug">
                              {bq.question}
                            </h4>

                            {isRevealed && (
                              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-xs space-y-3 animate-fadeIn">
                                <div>
                                  <strong className="text-emerald-600 uppercase text-[9px] tracking-wider block mb-1">Mandatory Keywords (CBSE Step marks scheme):</strong>
                                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                                    {bq.expectedKeywords.map((kw, kIdx) => (
                                      <span key={kIdx} className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600">
                                        {kw}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div className="pt-2.5 border-t border-slate-200/60 dark:border-white/5">
                                  <strong className="text-indigo-600 uppercase text-[9px] tracking-wider block mb-1">Full Model Answer:</strong>
                                  <p className="text-foreground/90 font-medium leading-relaxed">{bq.answer}</p>
                                </div>
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  {/* BOARD EXPECTED QUESTIONS */}
                  {activeQuestionTab === 'boardExpected' && (
                    <div className="space-y-4">
                      {(analysis.boardExpectedQuestions || []).length === 0 ? (
                        <Card className="p-8 text-center text-muted-foreground italic rounded-2xl bg-white/40 dark:bg-slate-900/40">
                          No specific Board Expected Questions generated for this selection. Try re-analyzing!
                        </Card>
                      ) : (
                        (analysis.boardExpectedQuestions || []).map((bq, idx) => {
                          const isRevealed = revealedSubjective[`board_exp_${idx}`];
                          return (
                            <Card key={idx} className="rounded-2xl p-5 bg-white/95 dark:bg-slate-900/95 border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded">
                                  Board Expected Question #{idx + 1}
                                </span>
                                <button
                                  onClick={() => setRevealedSubjective((prev) => ({ ...prev, [`board_exp_${idx}`]: !isRevealed }))}
                                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                                >
                                  {isRevealed ? 'Hide Answer' : 'Show Answer'}
                                </button>
                              </div>

                              <h4 className="font-extrabold text-sm sm:text-base text-foreground leading-snug">
                                {bq.question}
                              </h4>

                              {isRevealed && (
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-xs space-y-3 animate-fadeIn">
                                  <div>
                                    <strong className="text-indigo-600 uppercase text-[9px] tracking-wider block mb-1">Keywords for step scoring:</strong>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {bq.keywords.map((kw, kwIdx) => (
                                        <span key={kwIdx} className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold px-1.5 py-0.5 rounded text-[10px]">
                                          {kw}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="pt-2 border-t border-slate-200/60 dark:border-white/5">
                                    <strong className="text-emerald-600 uppercase text-[9px] tracking-wider block mb-1">Model Answer:</strong>
                                    <p className="text-foreground/90 font-medium leading-relaxed">{bq.answer}</p>
                                  </div>
                                </div>
                              )}
                            </Card>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* VERY IMPORTANT QUESTIONS (VIQs) */}
                  {activeQuestionTab === 'viqs' && (
                    <div className="space-y-4">
                      {(analysis.veryImportantQuestions || []).length === 0 ? (
                        <Card className="p-8 text-center text-muted-foreground italic rounded-2xl bg-white/40 dark:bg-slate-900/40">
                          V.I.Q list is compiled in Key Concepts and Subjective Derivations.
                        </Card>
                      ) : (
                        (analysis.veryImportantQuestions || []).map((vq, idx) => {
                          const isRevealed = revealedSubjective[`viq_${idx}`];
                          return (
                            <Card key={idx} className="rounded-2xl p-5 bg-white/95 dark:bg-slate-900/95 border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded">
                                  Very Important Question #{idx + 1}
                                </span>
                                <button
                                  onClick={() => setRevealedSubjective((prev) => ({ ...prev, [`viq_${idx}`]: !isRevealed }))}
                                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-bold"
                                >
                                  {isRevealed ? 'Hide Explanation' : 'Show Explanation'}
                                </button>
                              </div>

                              <h4 className="font-extrabold text-sm sm:text-base text-foreground leading-snug">
                                {vq.question}
                              </h4>

                              {isRevealed && (
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-xs space-y-2 animate-fadeIn">
                                  <div>
                                    <strong className="text-rose-600 uppercase text-[9px] tracking-wider block mb-1">CBSE Perfect Answer:</strong>
                                    <p className="text-foreground/90 font-medium leading-relaxed">{vq.answer}</p>
                                  </div>
                                  <div className="pt-2 border-t border-slate-200/60 dark:border-white/5">
                                    <strong className="text-purple-600 uppercase text-[9px] tracking-wider block mb-1">Concept Derivation Details:</strong>
                                    <p className="text-muted-foreground font-semibold leading-relaxed">{vq.explanation}</p>
                                  </div>
                                </div>
                              )}
                            </Card>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* NUMERICALS */}
                  {activeQuestionTab === 'numericals' && (
                    <div className="space-y-4">
                      {(analysis.numericals || []).length === 0 ? (
                        <Card className="p-8 text-center text-muted-foreground italic rounded-2xl bg-white/40 dark:bg-slate-900/40 col-span-2">
                          No numerical calculation questions generated for this theoretical syllabus topic.
                        </Card>
                      ) : (
                        (analysis.numericals || []).map((num, idx) => {
                          const isRevealed = revealedSubjective[`num_${idx}`];
                          return (
                            <Card key={idx} className="rounded-2xl p-5 bg-white/95 dark:bg-slate-900/95 border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded">
                                  Numerical Practice #{idx + 1}
                                </span>
                                <button
                                  onClick={() => setRevealedSubjective((prev) => ({ ...prev, [`num_${idx}`]: !isRevealed }))}
                                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                                >
                                  {isRevealed ? 'Hide Step-by-Step Solution' : 'Show Step-by-Step Solution'}
                                </button>
                              </div>

                              <h4 className="font-extrabold text-sm sm:text-base text-foreground leading-snug">
                                {num.question}
                              </h4>

                              <div className="p-3 bg-slate-900 text-white font-mono rounded-xl text-center text-xs">
                                Formula: <strong className="text-yellow-400">{num.formulaUsed}</strong>
                              </div>

                              {isRevealed && (
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-xs space-y-3 animate-fadeIn">
                                  <div>
                                    <strong className="text-indigo-600 uppercase text-[9px] tracking-wider block mb-1">Step-by-step CBSE Marking Scheme:</strong>
                                    <ol className="list-decimal pl-4 space-y-1.5 text-muted-foreground font-semibold">
                                      {num.solutionStepByStep.map((step, sIdx) => (
                                        <li key={sIdx}>{step}</li>
                                      ))}
                                    </ol>
                                  </div>

                                  <div className="pt-2.5 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between">
                                    <span className="font-bold text-foreground">Final Calculated Result:</span>
                                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                      {num.finalAnswer}
                                    </span>
                                  </div>

                                  {num.mistakeAnalysis && (
                                    <div className="p-2 rounded-lg bg-rose-500/5 border border-rose-500/10">
                                      <strong className="text-rose-600 uppercase text-[9px] tracking-wider block mb-0.5">Common Mistake Area:</strong>
                                      <p className="text-muted-foreground font-semibold leading-relaxed">{num.mistakeAnalysis}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </Card>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: REVISION MODE */}
            {activeTab === 'revision' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Revision Modes Ribbon */}
                  <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-white/5">
                    {[
                      { id: 'notes', label: 'Study Notes' },
                      { id: 'formulaSheet', label: 'Formula Sheet' },
                      { id: 'quickNotes', label: 'Quick Notes' },
                      { id: 'examNotes', label: 'Exam Notes' },
                      { id: 'oneNightBeforeExamNotes', label: '1-Night Before' },
                      { id: 'mindmap', label: 'Mind Map' },
                      { id: 'flashcards', label: 'Flashcards' },
                      { id: 'lastminute', label: 'Last Minute' },
                    ].map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => setActiveRevisionTab(sub.id as any)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer text-center ${
                          activeRevisionTab === sub.id
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>

                  {/* SUB TAB PANELS */}
                  <div className="pt-1">
                    {/* STUDY NOTES */}
                    {activeRevisionTab === 'notes' && (
                      <Card className="rounded-3xl p-6 sm:p-8 bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                        <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed font-sans">
                          {analysis.revisionMode.revisionNotes}
                        </div>
                      </Card>
                    )}

                    {/* FORMULA SHEET */}
                    {activeRevisionTab === 'formulaSheet' && (
                      <Card className="rounded-3xl p-6 sm:p-8 bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                        <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed font-sans">
                          {analysis.revisionMode.formulaSheet || 'Formulas list is available in the Formula Sheet navigation tab.'}
                        </div>
                      </Card>
                    )}

                    {/* QUICK NOTES */}
                    {activeRevisionTab === 'quickNotes' && (
                      <Card className="rounded-3xl p-6 sm:p-8 bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                        <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed font-sans">
                          {analysis.revisionMode.quickNotes || 'Summarized quick learning points are compiled in the One Minute Revision summary view.'}
                        </div>
                      </Card>
                    )}

                    {/* EXAM NOTES */}
                    {activeRevisionTab === 'examNotes' && (
                      <Card className="rounded-3xl p-6 sm:p-8 bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                        <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed font-sans">
                          {analysis.revisionMode.examNotes || 'Specialized board scoring guides and notes compiled.'}
                        </div>
                      </Card>
                    )}

                    {/* ONE NIGHT BEFORE EXAM NOTES */}
                    {activeRevisionTab === 'oneNightBeforeExamNotes' && (
                      <Card className="rounded-3xl p-6 sm:p-8 bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                        <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed font-sans animate-fadeIn">
                          {analysis.revisionMode.oneNightBeforeExamNotes || 'Crucial checklists and key derivation diagrams summaries.'}
                        </div>
                      </Card>
                    )}

                    {/* MIND MAP GRAPH */}
                    {activeRevisionTab === 'mindmap' && (
                      <Card className="rounded-3xl p-6 sm:p-8 bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
                        <span className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                          ASCII Conceptual Flowchart
                        </span>
                        <div className="p-5 rounded-2xl bg-slate-900 text-yellow-400 font-mono text-xs sm:text-sm whitespace-pre-wrap leading-relaxed overflow-x-auto tracking-wide border border-white/5">
                          {analysis.revisionMode.mindMap}
                        </div>
                      </Card>
                    )}

                    {/* INTERACTIVE FLASHCARDS */}
                    {activeRevisionTab === 'flashcards' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {analysis.revisionMode.flashcards.map((card, idx) => {
                          const isFlipped = flippedCardIdx[idx] === true;
                          return (
                            <div
                              key={idx}
                              onClick={() => setExpandedCardIdx((prev) => ({ ...prev, [idx]: !isFlipped }))}
                              className="h-44 perspective-1000 cursor-pointer select-none group"
                            >
                              <div
                                className={`relative w-full h-full duration-500 preserve-3d transition-transform ${
                                  isFlipped ? 'rotate-y-180' : ''
                                }`}
                              >
                                {/* Front Card Side */}
                                <div className="absolute inset-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col justify-between shadow-xs backface-hidden">
                                  <div className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                                    Flashcard #{idx + 1}
                                  </div>
                                  <p className="text-sm font-black text-center text-foreground group-hover:scale-102 transition duration-200 leading-snug">
                                    {card.front}
                                  </p>
                                  <div className="text-[10px] text-muted-foreground text-center font-mono">
                                    Click to Flip
                                  </div>
                                </div>

                                {/* Back Card Side */}
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-5 flex flex-col justify-between shadow-xs backface-hidden rotate-y-180 text-white text-center">
                                  <div className="text-[10px] font-black uppercase text-indigo-200 tracking-wider text-left">
                                    Answer Key
                                  </div>
                                  <p className="text-xs sm:text-sm font-bold leading-relaxed px-2">
                                    {card.back}
                                  </p>
                                  <div className="text-[10px] text-indigo-200 font-mono">
                                    Click to Flip Back
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* LAST MINUTE REMINDERS */}
                    {activeRevisionTab === 'lastminute' && (
                      <Card className="rounded-3xl p-6 bg-white/95 dark:bg-slate-900/95 border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                        <h4 className="font-extrabold text-sm text-foreground uppercase tracking-wider text-[10px] text-indigo-600">
                          Rapid Recall Point Reminders
                        </h4>
                        <div className="space-y-3">
                          {analysis.revisionMode.lastMinuteNotes.map((pt, pIdx) => (
                            <div key={pIdx} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed font-semibold">
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                              <span>{pt}</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>
                </div>

                {/* SIDEBAR SAVED FORMULA BANK IN REVISION */}
                <div className="space-y-4">
                  <Card className="rounded-3xl p-5 bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-xs sm:text-sm text-foreground flex items-center gap-1.5">
                        <FolderHeart className="w-4 h-4 text-rose-500 animate-pulse" />
                        <span>Saved Formula Vault</span>
                      </h4>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 font-bold">
                        {savedFormulas.length} Saved
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {savedFormulas.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic text-center py-4">
                          Your formula bank is empty. Click the heart icon on any formula card to save it here!
                        </p>
                      ) : (
                        savedFormulas.map((f, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/70 dark:border-white/5 space-y-1.5 relative group text-xs">
                            <span className="font-bold text-foreground text-[11px] block pr-6 leading-snug">
                              {f.name}
                            </span>
                            <div className="bg-slate-900 text-white font-mono font-bold text-center py-1.5 px-2 rounded-md tracking-wider overflow-x-auto">
                              {f.formula}
                            </div>
                            <button
                              onClick={() => {
                                const next = savedFormulas.filter((item) => item.formula !== f.formula);
                                setSavedFormulas(next);
                                syncEngine.setLocalCache('lecturelab_saved_formulas', next, userId);
                                toast.success('Formula removed from vault');
                              }}
                              className="absolute top-2.5 right-2 text-muted-foreground hover:text-rose-500 opacity-0 group-hover:opacity-100 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* MY LECTURE LIBRARY (Firebase Synced) */}
      <div className="space-y-4 pt-4">
        <div>
          <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-indigo-500" />
            <span>My Lecture Library</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Synchronized with your Firebase account. Access summaries, MCQs and subjective derivations on any device.
          </p>
        </div>

        {library.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground italic rounded-3xl border border-dashed border-slate-200/80 dark:border-white/10 bg-white/40 dark:bg-slate-900/40">
            Your Library is empty. Paste a lecture link above and click "Save to Library" to start saving study blue-prints!
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {library.map((item) => (
              <Card
                key={item.videoId}
                onClick={() => {
                  setAnalysis(item);
                  setIsSaved(true);
                  syncEngine.setLocalCache('lecturelab_last_analyzed', item, userId);
                  syncEngine.setLocalCache(`lecturelab_is_saved_${item.videoId}`, true, userId);
                  window.scrollTo({ top: 400, behavior: 'smooth' });
                  toast.success(`Loaded saved study companion: ${item.detectedChapter}`);
                }}
                className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-indigo-500/40 transition duration-300 cursor-pointer flex flex-col justify-between animate-fadeIn"
              >
                <div>
                  <div className="h-36 relative overflow-hidden bg-slate-900 border-b border-slate-200 dark:border-white/5">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/75 text-white font-bold">
                        {item.duration}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        {item.detectedSubject}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-mono">
                        {item.difficulty}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-xs sm:text-sm text-foreground leading-snug line-clamp-2">
                      {item.title}
                    </h4>

                    <p className="text-[11px] text-muted-foreground truncate">
                      Channel: <strong className="text-foreground">{item.channelName}</strong>
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                    <span>Study blueprint</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                  
                  <button
                    onClick={(e) => handleDeleteFromLibrary(item.videoId, e)}
                    className="p-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                    title="Delete saved lecture"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
