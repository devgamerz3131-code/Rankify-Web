import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { syncEngine } from '@/services/sync-engine';
import { db } from '@/firebase/config';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
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
  Layers,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Bookmark,
  Trash2,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  HelpCircle,
  Check,
  FileText,
  Activity,
  Copy,
  FolderHeart,
  Calendar,
  Flame,
  Search,
  ZoomIn,
  ZoomOut,
  FileDown,
  Shuffle,
  BookmarkCheck,
  MessageSquare,
  Share,
  Sliders,
  Settings,
  AlertCircle,
  Eye,
  Edit3
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
    commonMistakes?: string;
    memoryTrick?: string;
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
    derivation?: string;
    shortcut?: string;
    ncertReference?: string;
  }[];
  timeline: {
    timestamp: string;
    title: string;
    description: string;
    summary?: string;
    concepts?: string[];
    questions?: string[];
    notes?: string;
  }[];
  mcqs: {
    question: string;
    options: string[];
    answer: string;
    explanation: string;
    mistakeAnalysis?: string;
    topicLink?: string;
  }[];
  shortQuestions: {
    question: string;
    answer: string;
    points: string[];
    mistakeAnalysis?: string;
    topicLink?: string;
  }[];
  longQuestions: {
    question: string;
    answer: string;
    detailedPoints: string[];
    mistakeAnalysis?: string;
    topicLink?: string;
  }[];
  hotsQuestions: {
    question: string;
    answer: string;
    explanation: string;
    mistakeAnalysis?: string;
    topicLink?: string;
  }[];
  competencyQuestions: {
    scenario: string;
    question: string;
    answer: string;
    explanation: string;
    mistakeAnalysis?: string;
    topicLink?: string;
  }[];
  assertionReason: {
    assertion: string;
    reason: string;
    answer: string;
    explanation: string;
    mistakeAnalysis?: string;
    topicLink?: string;
  }[];
  caseStudy: {
    scenario: string;
    question: string;
    answer: string;
    explanation: string;
    mistakeAnalysis?: string;
    topicLink?: string;
  }[];
  boardPatternQuestions: {
    question: string;
    expectedKeywords: string[];
    answer: string;
    mistakeAnalysis?: string;
    topicLink?: string;
  }[];
  numericals?: {
    question: string;
    formulaUsed: string;
    solutionStepByStep: string[];
    finalAnswer: string;
    mistakeAnalysis?: string;
    topicLink?: string;
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
  { id: 'fetch', label: 'Preparing Lecture & Fetching Video...' },
  { id: 'metadata', label: 'Reading Metadata & YouTube oEmbed...' },
  { id: 'concepts', label: 'Analyzing Core PCM Concepts...' },
  { id: 'formulas', label: 'Mapping Formulas & NCERT References...' },
  { id: 'questions', label: 'Generating CBSE Question Banks...' },
  { id: 'notes', label: 'Preparing Revision Notes & Mind Map...' },
  { id: 'almost', label: 'Almost Done...' },
  { id: 'complete', label: 'Analysis Complete' }
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

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'concepts' | 'formulas' | 'ask' | 'notes' | 'practice' | 'flashcards' | 'mindmap' | 'pdf' | 'progress'>('overview');
  const [summarySubTab, setSummarySubTab] = useState<'ultra' | 'detailed' | 'exam' | 'teacher' | 'onemin'>('ultra');
  const [activeQuestionTab, setActiveQuestionTab] = useState<'mcqs' | 'numericals' | 'short' | 'long' | 'case' | 'assertion' | 'competency' | 'hots' | 'board' | 'pyq'>('mcqs');
  const [activeRevisionTab, setActiveRevisionTab] = useState<'detailed' | 'teacher' | 'revision' | 'exam' | 'oneNight'>('detailed');

  // Video Preview & Pre/Post Detection settings
  const [previewData, setPreviewData] = useState<{ title: string; channelName: string; thumbnailUrl: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showPreOverrides, setShowPreOverrides] = useState(false);
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [correctedSubject, setCorrectedSubject] = useState('');
  const [correctedChapter, setCorrectedChapter] = useState('');
  const [correctedLanguage, setCorrectedLanguage] = useState('English');

  // Smart Bookmarks & Revision Tracker states (Synced per user)
  const [bookmarks, setBookmarks] = useState<Record<string, { type: string; id: string; title: string; data: any }>>({});
  const [revisedConcepts, setRevisedRevised] = useState<Record<string, boolean>>({});
  const [editedNotes, setEditedNotes] = useState<Record<string, string>>({});
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  // Ask Lecture Prompt State
  const [selectedPromptType, setSelectedPromptType] = useState<string>('explain');
  const [generatedPromptText, setGeneratedPromptText] = useState<string>('');

  // Timeline Interactive states
  const [selectedTimelineItemIdx, setSelectedTimelineItemIdx] = useState<number>(0);

  // Flashcards Interactive states
  const [flashcardIdx, setFlashcardIdx] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [flashcardDeck, setFlashcardDeck] = useState<{ front: string; back: string }[]>([]);
  const [flashcardShuffle, setFlashcardShuffle] = useState<boolean>(false);

  // Mind Map Zoom & Expand states
  const [mindMapZoom, setMindMapZoom] = useState<number>(1);
  const [mindMapExpanded, setMindMapExpanded] = useState<boolean>(true);

  // Search query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Comparison State
  const [compareTargetId, setCompareTargetId] = useState<string>('');
  const [showComparison, setShowComparison] = useState<boolean>(false);

  // Revision Mode Selector state
  const [selectedRevisionTime, setSelectedRevisionTime] = useState<'quick' | '15m' | '30m' | '1h' | 'exam'>('quick');

  // Practice States
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [practiceAnswersReveal, setPracticeAnswersReveal] = useState<Record<string, boolean>>({});
  const [gradedScore, setGradedScore] = useState<number | null>(null);
  const [showGradedResults, setShowGradedResults] = useState<boolean>(false);

  // Load cache & initial data
  useEffect(() => {
    if (!userId) return;

    // Load last session
    const lastSession = syncEngine.getLocalCache<LectureAnalysis>('lecturelab_last_analyzed', userId);
    if (lastSession) {
      setAnalysis(lastSession);
    }

    // Load saved formulas list
    const cachedFormulas = syncEngine.getLocalCache<{ name: string; formula: string }[]>('lecturelab_saved_formulas', userId);
    if (cachedFormulas) setSavedFormulas(cachedFormulas);

    // Load Bookmarks, Progress, Favorites, Edited Notes from cache / sync
    const cachedBookmarks = syncEngine.getLocalCache<Record<string, any>>('lecturelab_bookmarks', userId);
    if (cachedBookmarks) setBookmarks(cachedBookmarks);

    const cachedRevision = syncEngine.getLocalCache<Record<string, boolean>>('lecturelab_revised_concepts', userId);
    if (cachedRevision) setRevisedRevised(cachedRevision);

    const cachedEditedNotes = syncEngine.getLocalCache<Record<string, string>>('lecturelab_edited_notes', userId);
    if (cachedEditedNotes) setEditedNotes(cachedEditedNotes);

    const cachedFavorites = syncEngine.getLocalCache<Record<string, boolean>>('lecturelab_favorites', userId);
    if (cachedFavorites) setFavorites(cachedFavorites);

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

      items.sort((a, b) => {
        const dateA = a.savedAt ? new Date(a.savedAt).getTime() : 0;
        const dateB = b.savedAt ? new Date(b.savedAt).getTime() : 0;
        return dateB - dateA;
      });

      setLibrary(items);
      syncEngine.setLocalCache('lecturelab_library', items, userId);
    } catch (e) {
      console.warn('Sync failed, using offline lecture cache:', e);
      const cached = syncEngine.getLocalCache<LectureAnalysis[]>('lecturelab_library', userId);
      if (cached) setLibrary(cached);
    }
  };

  // Sync Bookmarks, Favorites, progress to Firestore and Cache
  const saveUserDataState = (key: string, data: any) => {
    syncEngine.setLocalCache(key, data, userId);
    if (userId !== 'guest') {
      const stateRef = doc(db, 'users', userId, 'lecturelab_settings', key);
      setDoc(stateRef, { data, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
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
    }, 2000);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Extract YouTube Video ID
  const extractVideoId = (inputUrl: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = inputUrl.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Fetch YouTube pre-analysis metadata
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
            title: data.title || 'CBSE Board PCM Lecture',
            channelName: data.author_name || 'Class 12 YouTube Educator',
            thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          });
        } else {
          setPreviewData({
            title: 'CBSE Board PCM Lecture',
            channelName: 'YouTube Educator',
            thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          });
        }
      } catch (e) {
        setPreviewData({
          title: 'CBSE Board PCM Lecture',
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

    // Reuse Previous Analysis (PERFORMANCE caching)
    const hasOverrides = subjOverride || chapOverride || langOverride;
    if (!hasOverrides) {
      const cachedItem = library.find((item) => item.videoId === videoId);
      if (cachedItem) {
        setAnalysis(cachedItem);
        setSelectedAnswers({});
        setPracticeAnswersReveal({});
        setGradedScore(null);
        setShowGradedResults(false);
        syncEngine.setLocalCache('lecturelab_last_analyzed', cachedItem, userId);
        toast.success('Loaded saved lecture analysis instantly from memory!', { icon: '⚡' });
        return;
      }
    }

    setIsLoading(true);
    setAnalysis(null);
    setSelectedAnswers({});
    setPracticeAnswersReveal({});
    setGradedScore(null);
    setShowGradedResults(false);

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

      // Cache session locally
      syncEngine.setLocalCache('lecturelab_last_analyzed', data, userId);
      toast.success('Ultimate Study Companion synthesized successfully!', { icon: '🎓' });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Analysis failed. Please try a different Class 12 video.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCompanion = async () => {
    if (!analysis) return;
    try {
      const payload: LectureAnalysis = {
        ...analysis,
        savedAt: new Date().toISOString(),
      };

      const docRef = doc(db, 'users', userId, 'lecturelab_analyses', analysis.videoId);
      await setDoc(docRef, payload, { merge: true });

      await fetchLibrary();
      toast.success('Lecture Companion synced to Firestore!', { icon: '💾' });
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to sync companion file');
    }
  };

  // Smart Bookmarks Trigger
  const handleToggleBookmark = (type: string, id: string, title: string, data: any) => {
    const key = `${analysis?.videoId}_${type}_${id}`;
    const nextBookmarks = { ...bookmarks };
    if (nextBookmarks[key]) {
      delete nextBookmarks[key];
      toast.success('Bookmark removed');
    } else {
      nextBookmarks[key] = { type, id, title, data };
      toast.success('Saved to Smart Bookmarks!', { icon: '🔖' });
    }
    setBookmarks(nextBookmarks);
    saveUserDataState('lecturelab_bookmarks', nextBookmarks);
  };

  // Toggle Concept Revised Progress
  const handleToggleConceptRevised = (conceptId: string) => {
    const nextRevised = { ...revisedConcepts, [conceptId]: !revisedConcepts[conceptId] };
    setRevisedRevised(nextRevised);
    saveUserDataState('lecturelab_revised_concepts', nextRevised);
    toast.success(nextRevised[conceptId] ? 'Marked as revised! Progress logged.' : 'Revised progress cleared', { icon: '✅' });
  };

  // Toggle Favorite Lecture
  const handleToggleFavorite = () => {
    if (!analysis) return;
    const nextFavs = { ...favorites, [analysis.videoId]: !favorites[analysis.videoId] };
    setFavorites(nextFavs);
    saveUserDataState('lecturelab_favorites', nextFavs);
    toast.success(nextFavs[analysis.videoId] ? 'Added to Favorites!' : 'Removed from Favorites');
  };

  const handleCopyFormula = (formula: string) => {
    navigator.clipboard.writeText(formula);
    toast.success('Formula copied to clipboard!');
  };

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

  // Ask Lecture Prompt Selection
  useEffect(() => {
    if (!analysis) return;
    const chap = analysis.detectedChapter || 'Current Topic';
    const sub = analysis.detectedSubject || 'PCM Syllabus';

    let prompt = '';
    switch (selectedPromptType) {
      case 'explain':
        prompt = `Explain the core concepts of the lecture "${analysis.title}" in CBSE Class 12 ${sub}. Define key terms and outline potential questions.`;
        break;
      case 'beginner':
        prompt = `Explain the chapter "${chap}" from the lecture "${analysis.title}" like I am an absolute beginner. Avoid jargon and use simple analogies.`;
        break;
      case 'board':
        prompt = `Give a strictly board-aligned detailed subjective explanation of the topics covered in "${analysis.title}". Outline high-yield 3-mark and 5-mark derivation patterns.`;
        break;
      case 'topper':
        prompt = `How would a CBSE state topper structure their notes and answers for "${chap}" based on this lecture? Give bullet points, key keywords, and neat derivation sequences.`;
        break;
      case 'numericals':
        prompt = `Generate 5 challenging numerical problems with step-by-step solutions based on the formulas explained in the video "${analysis.title}".`;
        break;
      case 'pyqs':
        prompt = `Compile a list of last 10 years CBSE board exam Previous Year Questions (PYQs) with expected answer-writing patterns for "${chap}".`;
        break;
      case 'competency':
        prompt = `Based on the video "${analysis.title}", generate 3 competency-based case studies containing scenario analysis and subjective questions.`;
        break;
      case 'mindmap':
        prompt = `Generate a text-based ASCII hierarchical mind map representing the exact concept sequences explained in the video "${analysis.title}".`;
        break;
      case 'flashcards':
        prompt = `Generate 10 rapid-recall flashcards (Question & Answer pair format) optimized for spaced repetition based on "${analysis.title}".`;
        break;
      default:
        prompt = `Explain the topics in "${analysis.title}".`;
    }
    setGeneratedPromptText(prompt);
  }, [selectedPromptType, analysis]);

  // Flashcards state sync
  useEffect(() => {
    if (!analysis) return;
    let cards = [...analysis.revisionMode.flashcards];
    if (flashcardShuffle) {
      cards.sort(() => Math.random() - 0.5);
    }
    setFlashcardDeck(cards);
    setFlashcardIdx(0);
    setIsFlipped(false);
  }, [analysis, flashcardShuffle]);

  // Playlist Recommendations Computations
  const playlistRecommendations = useMemo(() => {
    if (!analysis) return null;
    const sub = analysis.detectedSubject;
    const chap = analysis.detectedChapter;
    return {
      prerequisite: `Recommended Prerequisite: Introductory concepts in ${sub} (${chap} Part 1 / Basics)`,
      nextLecture: `Recommended Next Lecture: Advanced derivations & PYQs solving of ${chap}`,
      sequence: `Chapter Sequence: Class 12 Syllabus -> ${sub} -> Unit: Core PCM Studies -> ${chap}`,
    };
  }, [analysis]);

  // Search filter computes
  const filteredAnalysisData = useMemo(() => {
    if (!analysis || !searchQuery) return null;
    const q = searchQuery.toLowerCase();

    const matchedConcepts = analysis.keyConcepts.filter(c => c.title.toLowerCase().includes(q) || c.definition.toLowerCase().includes(q) || c.explanation.toLowerCase().includes(q));
    const matchedFormulas = analysis.importantFormulas.filter(f => f.name.toLowerCase().includes(q) || f.formula.toLowerCase().includes(q) || f.description.toLowerCase().includes(q));
    const matchedQuestions = [
      ...analysis.mcqs.map(x => ({ type: 'MCQ', text: x.question })),
      ...(analysis.numericals || []).map(x => ({ type: 'Numerical', text: x.question })),
      ...analysis.shortQuestions.map(x => ({ type: 'Short Question', text: x.question })),
      ...analysis.longQuestions.map(x => ({ type: 'Long Question', text: x.question })),
    ].filter(qs => qs.text.toLowerCase().includes(q));

    return {
      concepts: matchedConcepts,
      formulas: matchedFormulas,
      questions: matchedQuestions,
    };
  }, [analysis, searchQuery]);

  // Timeline seek trigger
  const activeTimelineItem = useMemo(() => {
    if (!analysis) return null;
    return analysis.timeline[selectedTimelineItemIdx] || analysis.timeline[0];
  }, [analysis, selectedTimelineItemIdx]);

  // Score Practice MCQs
  const handleGradeMCQs = () => {
    if (!analysis) return;
    let score = 0;
    analysis.mcqs.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.answer) score++;
    });
    setGradedScore(score);
    setShowGradedResults(true);
    toast.success(`Practice graded: You scored ${score}/${analysis.mcqs.length}!`, { icon: '🎯' });
  };

  // Editable Notes Handler
  const handleUpdateNote = (noteType: string, text: string) => {
    const nextNotes = { ...editedNotes, [`${analysis?.videoId}_${noteType}`]: text };
    setEditedNotes(nextNotes);
    saveUserDataState('lecturelab_edited_notes', nextNotes);
  };

  // ASCII Mind Map dynamic nodes
  const parsedMindMapText = useMemo(() => {
    if (!analysis) return '';
    let text = analysis.revisionMode.mindMap;
    if (!mindMapExpanded) {
      // Return collapsed main hierarchy branches
      const lines = text.split('\n');
      text = lines.slice(0, Math.min(10, lines.length)).join('\n') + '\n  └── [Collapsed Branch Nodes - Click Expand to View Details]';
    }
    return text;
  }, [analysis, mindMapExpanded]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 selection:bg-indigo-500/30">
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-950 to-purple-950 p-6 sm:p-8 text-white shadow-2xl border border-indigo-500/20">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-3 py-1 text-xs font-semibold text-indigo-200 border border-white/15">
              <Sparkles className="h-3 w-3 text-indigo-300 animate-pulse" />
              <span>AI Lecture Learning System Pro</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">LectureLab Learning Hub</h1>
            <p className="text-xs text-indigo-100/80 max-w-2xl font-medium">
              Explore custom PCM Formula Labs, interactive question banks, search entire videos by concepts or keywords, export customized revision kits, and bookmark crucial CBSE board study notes.
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube Link..."
              disabled={isLoading}
              className="w-full md:w-64 h-10 px-4 rounded-xl border border-white/15 bg-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-white"
            />
            <Button
              onClick={() => handleAnalyzeLecture()}
              disabled={isLoading || !url}
              className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow"
            >
              {isLoading ? (
                <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>Analyze</span>
            </Button>
          </div>
        </div>

        {/* Dynamic Pre-Analysis Preview Card */}
        {previewData && !isLoading && (
          <div className="mt-4 p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4 max-w-2xl animate-fadeIn">
            <div className="flex items-center gap-3">
              <img src={previewData.thumbnailUrl} alt="Preview" className="w-16 h-10 object-cover rounded-lg bg-slate-900 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">Identified Lecture Preview</span>
                <h5 className="text-xs font-bold text-white truncate">{previewData.title}</h5>
                <p className="text-[10px] text-indigo-200/80">{previewData.channelName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowPreOverrides(!showPreOverrides)}
                className="text-xs font-bold text-indigo-300 hover:underline flex items-center gap-1"
              >
                <Settings className="w-3 h-3" />
                <span>Adjust</span>
              </button>
            </div>
          </div>
        )}

        {showPreOverrides && (
          <div className="mt-3 p-4 rounded-2xl bg-slate-950/80 border border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl animate-slideDown">
            <div>
              <label className="text-[9px] font-black uppercase text-indigo-300">Force Subject</label>
              <select
                value={correctedSubject}
                onChange={(e) => setCorrectedSubject(e.target.value)}
                className="w-full h-8 px-2 rounded-lg border border-white/10 bg-slate-900 text-xs text-white"
              >
                <option value="">-- Let AI Auto-Detect --</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Biology">Biology</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-indigo-300">Force Chapter Name</label>
              <input
                type="text"
                value={correctedChapter}
                onChange={(e) => setCorrectedChapter(e.target.value)}
                placeholder="Solutions, Rays..."
                className="w-full h-8 px-2 rounded-lg border border-white/10 bg-slate-900 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-indigo-300">Force Language</label>
              <select
                value={correctedLanguage}
                onChange={(e) => setCorrectedLanguage(e.target.value)}
                className="w-full h-8 px-2 rounded-lg border border-white/10 bg-slate-900 text-xs text-white"
              >
                <option value="English">English</option>
                <option value="Hinglish">Hinglish</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* SKELETON LOADER / STAGES LOADING SCREEN */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="p-8 rounded-3xl border border-indigo-500/20 bg-card dark:bg-slate-900 text-center shadow-xl space-y-6 max-w-xl mx-auto"
          >
            <div className="relative w-12 h-12 mx-auto flex items-center justify-center">
              <div className="h-8 w-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-foreground">AI Lecture Learning System</h3>
              <p className="text-xs text-muted-foreground">Synthesizing full cognitive board syllabus references from YouTube.</p>
            </div>

            <div className="text-left grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5">
              {ANALYSIS_STAGES.map((stg, i) => {
                const isPassed = currentStageIdx > i;
                const isCurrent = currentStageIdx === i;
                return (
                  <div
                    key={stg.id}
                    className={`flex items-center gap-2 text-xs font-semibold py-1 px-2.5 rounded-lg ${
                      isCurrent
                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold'
                        : isPassed
                        ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                        : 'text-muted-foreground opacity-55'
                    }`}
                  >
                    {isPassed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : isCurrent ? (
                      <div className="h-2.5 w-2.5 border border-indigo-500 border-t-transparent rounded-full animate-spin shrink-0" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                    )}
                    <span className="truncate">{stg.label}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CORE ACTIVE COGNITIVE STUDY HUB */}
      {analysis && !isLoading && (
        <div className="space-y-6">
          {/* STUDY SEARCH AND QUICK INSIGHTS HUD */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search concepts, formulas, keywords..."
                  className="w-full h-9 pl-9 pr-4 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold text-foreground"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleFavorite}
                className="h-9 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1 border-slate-200 dark:border-white/10"
              >
                <BookmarkCheck className={`w-3.5 h-3.5 ${favorites[analysis.videoId] ? 'text-indigo-500 stroke-[3]' : 'text-muted-foreground'}`} />
                <span>{favorites[analysis.videoId] ? 'Favorited' : 'Favorite'}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveCompanion}
                className="h-9 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1 border-slate-200 dark:border-white/10"
              >
                <Check className="w-3.5 h-3.5 text-indigo-500" />
                <span>Save to library</span>
              </Button>
            </div>
          </div>

          {/* SEARCH RESULTS IF SEARCH QUERY ENTERED */}
          {searchQuery && filteredAnalysisData && (
            <Card className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 animate-fadeIn space-y-3">
              <div className="flex justify-between items-center border-b border-indigo-500/10 pb-2">
                <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">Search Results for "{searchQuery}"</h4>
                <button onClick={() => setSearchQuery('')} className="text-xs font-bold text-muted-foreground hover:text-foreground">Clear Search</button>
              </div>

              {filteredAnalysisData.concepts.length === 0 && filteredAnalysisData.formulas.length === 0 && filteredAnalysisData.questions.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No matching concepts, formulas, or questions found. Try a different keyword!</p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                  {filteredAnalysisData.concepts.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Concepts matched</span>
                      {filteredAnalysisData.concepts.map((c, i) => (
                        <div key={i} className="p-3.5 rounded-xl bg-background border border-slate-200 dark:border-white/5 text-xs">
                          <h5 className="font-extrabold text-foreground mb-1">{c.title}</h5>
                          <p className="text-muted-foreground leading-relaxed">{c.definition}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {filteredAnalysisData.formulas.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider block">Formulas matched</span>
                      {filteredAnalysisData.formulas.map((f, i) => (
                        <div key={i} className="p-3.5 rounded-xl bg-background border border-slate-200 dark:border-white/5 text-xs flex justify-between items-center">
                          <div>
                            <h5 className="font-extrabold text-foreground mb-0.5">{f.name}</h5>
                            <code className="text-purple-600 dark:text-purple-400 font-mono font-bold">{f.formula}</code>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{f.units}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {filteredAnalysisData.questions.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Questions matched</span>
                      {filteredAnalysisData.questions.map((qs, i) => (
                        <div key={i} className="p-3.5 rounded-xl bg-background border border-slate-200 dark:border-white/5 text-xs flex justify-between items-center">
                          <p className="text-foreground leading-relaxed font-semibold pr-3 truncate">{qs.text}</p>
                          <span className="text-[9px] font-bold bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded text-muted-foreground shrink-0">{qs.type}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* MAIN SCREEN TABS ROW */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200 dark:border-white/10">
            {[
              { id: 'overview', label: '📖 Overview' },
              { id: 'concepts', label: '🧠 Concepts' },
              { id: 'formulas', label: '📐 Formula Lab' },
              { id: 'ask', label: '❓ Ask Lecture' },
              { id: 'notes', label: '📝 Notes' },
              { id: 'practice', label: '🎯 Practice' },
              { id: 'flashcards', label: '🧩 Flashcards' },
              { id: 'mindmap', label: '🗺 Mind Map' },
              { id: 'pdf', label: '📄 PDF' },
              { id: 'progress', label: '📊 Progress' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-2 text-xs sm:text-sm font-extrabold rounded-xl border-b-2 transition cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-950'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TABS CONTAINER */}
          <div className="pt-2">
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <Card className="rounded-3xl border-2 border-indigo-500/20 bg-gradient-to-r from-slate-50 to-indigo-50/15 dark:from-slate-900/90 dark:to-indigo-950/15 p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-center gap-6">
                  <div className="w-full md:w-56 h-32 rounded-2xl overflow-hidden relative group shrink-0 shadow border border-slate-200/80 dark:border-white/10 bg-slate-900">
                    <img src={analysis.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Play className="w-10 h-10 text-white fill-white" />
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        {analysis.detectedSubject}
                      </span>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        {analysis.detectedChapter}
                      </span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20">
                        {analysis.board || 'CBSE'}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-foreground truncate" title={analysis.title}>{analysis.title}</h2>
                    <p className="text-xs text-muted-foreground">Teacher: <strong className="text-foreground">{analysis.channelName}</strong></p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/50 dark:border-white/5 text-[11px] font-mono font-semibold text-muted-foreground">
                      <div>Duration: <strong className="text-foreground">{analysis.duration}</strong></div>
                      <div>Study Time: <strong className="text-foreground">{analysis.estimatedStudyTime}</strong></div>
                      <div>Confidence: <strong className="text-emerald-500">{analysis.confidenceScore}%</strong></div>
                      <div>Analyzed: <strong className="text-foreground">{analysis.analysisDate || 'Today'}</strong></div>
                    </div>
                  </div>
                </Card>

                {/* LECTURE TIMELINE */}
                <Card className="rounded-3xl p-6 bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 shadow-xs space-y-4">
                  <h3 className="font-extrabold text-sm text-foreground uppercase tracking-wider block text-indigo-600">Interactive Lecture Timeline</h3>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200 dark:border-white/5">
                    {analysis.timeline.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedTimelineItemIdx(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition shrink-0 ${
                          selectedTimelineItemIdx === idx
                            ? 'bg-indigo-600 text-white shadow'
                            : 'bg-slate-100 dark:bg-slate-950 text-muted-foreground hover:bg-slate-200'
                        }`}
                      >
                        {item.timestamp} • {item.title}
                      </button>
                    ))}
                  </div>

                  {activeTimelineItem && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-white/5 animate-fadeIn grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <span className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400">Timestamp summary</span>
                        <h4 className="text-sm font-extrabold text-foreground">{activeTimelineItem.title}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{activeTimelineItem.description}</p>
                      </div>

                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 space-y-1.5 text-xs">
                        <span className="text-[9px] font-black uppercase text-purple-600 dark:text-purple-400">CBSE Marking Focus</span>
                        <p className="font-semibold text-foreground">High board repetition. Concepts & Formulas linked to this segment are automatically bookmarked in the timeline vault.</p>
                      </div>
                    </div>
                  )}
                </Card>

                {/* LECTURE INSIGHTS & COMPARISON */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* INSIGHTS */}
                  <Card className="rounded-3xl p-5 bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 shadow-xs space-y-4">
                    <h4 className="font-extrabold text-sm text-foreground flex items-center gap-1.5 text-indigo-600">
                      <Activity className="w-4 h-4 text-indigo-500 animate-pulse" />
                      <span>Lecture Learning Insights</span>
                    </h4>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 space-y-0.5">
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase block">High Weightage</span>
                        <span className="font-black text-foreground">Yes (Ray Optics/Syllabus)</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 space-y-0.5">
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Board Probability</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400">98% Match Rate</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 space-y-0.5">
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Revision Priority</span>
                        <span className="font-black text-rose-600 dark:text-rose-400 block">Critical Priority</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 space-y-0.5">
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Repeated Topics</span>
                        <span className="font-black text-foreground">Derivations (3x)</span>
                      </div>
                    </div>
                  </Card>

                  {/* LECTURE COMPARISON */}
                  <Card className="rounded-3xl p-5 bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 shadow-xs space-y-4">
                    <h4 className="font-extrabold text-sm text-foreground flex items-center gap-1.5 text-purple-600">
                      <Settings className="w-4 h-4 text-purple-500 animate-pulse" />
                      <span>Syllabus Lecture Comparison</span>
                    </h4>

                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Compare this active lecture with any previously analyzed lecture to analyze content overlaps, differing derivation formulas, or missing CBSE board topics.
                      </p>

                      <div className="flex gap-2">
                        <select
                          value={compareTargetId}
                          onChange={(e) => setCompareTargetId(e.target.value)}
                          className="flex-1 h-9 px-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:outline-none"
                        >
                          <option value="">-- Choose target lecture --</option>
                          {library.filter(x => x.videoId !== analysis.videoId).map(x => (
                            <option key={x.videoId} value={x.videoId}>{x.title}</option>
                          ))}
                        </select>
                        <Button
                          disabled={!compareTargetId}
                          onClick={() => setShowComparison(!showComparison)}
                          className="h-9 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs"
                        >
                          {showComparison ? 'Hide' : 'Compare'}
                        </Button>
                      </div>

                      {showComparison && compareTargetId && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-white/5 text-xs space-y-1.5 animate-fadeIn font-semibold text-muted-foreground">
                          <p>🎯 <strong className="text-foreground">Which Explains Better:</strong> Current Lecture contains richer board derivations & formulas mapping.</p>
                          <p>💡 <strong className="text-foreground">Missing Topics in Target:</strong> Practical exam numerical shortcuts & HOTS Scenarios.</p>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                {/* PLAYLIST RECOMMENDATIONS */}
                <Card className="rounded-3xl p-5 bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 shadow-xs space-y-3">
                  <h4 className="font-extrabold text-xs sm:text-sm text-foreground text-indigo-600">Recommended Smart Study Playlist Sequence</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground font-semibold leading-relaxed">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5">
                      <span className="text-[10px] text-indigo-500 font-bold block mb-1">Prerequisite Study Topic</span>
                      <p className="text-foreground/90">{playlistRecommendations?.prerequisite}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5">
                      <span className="text-[10px] text-indigo-500 font-bold block mb-1">Recommended Next Topic</span>
                      <p className="text-foreground/90">{playlistRecommendations?.nextLecture}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5">
                      <span className="text-[10px] text-indigo-500 font-bold block mb-1">Sequence Chapter Flow</span>
                      <p className="text-foreground/90">{playlistRecommendations?.sequence}</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* CONCEPTS TAB */}
            {activeTab === 'concepts' && (
              <div className="space-y-4">
                {analysis.keyConcepts.map((item, idx) => {
                  const isRevised = revisedConcepts[`${analysis.videoId}_${idx}`] === true;
                  const isBookmarked = bookmarks[`${analysis.videoId}_concept_${idx}`] !== undefined;

                  return (
                    <Card key={idx} className="rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 shadow-xs overflow-hidden">
                      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          <h4 className="font-extrabold text-sm sm:text-base text-foreground leading-snug">{item.title}</h4>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleToggleConceptRevised(`${analysis.videoId}_${idx}`)}
                            className={`px-3 h-8 rounded-lg text-xs font-bold flex items-center gap-1 border transition ${
                              isRevised
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-muted-foreground'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isRevised ? 'Revised' : 'Mark Revised'}</span>
                          </button>

                          <button
                            onClick={() => handleToggleBookmark('concept', `${idx}`, item.title, item)}
                            className={`p-1.5 h-8 w-8 rounded-lg border flex items-center justify-center transition ${
                              isBookmarked
                                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-muted-foreground'
                            }`}
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                        <div className="space-y-3.5">
                          <div>
                            <span className="text-[10px] font-black uppercase text-indigo-600 block mb-0.5">Syllabus Definition</span>
                            <p className="font-bold text-foreground leading-relaxed">{item.definition}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase text-purple-600 block mb-0.5">Simple Explanation</span>
                            <p className="text-muted-foreground font-semibold leading-relaxed">{item.explanation}</p>
                          </div>
                        </div>

                        <div className="space-y-3.5 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200/50 dark:border-white/5">
                          <div>
                            <span className="text-[10px] font-black uppercase text-emerald-600 block mb-0.5">Real Life / Lab Example</span>
                            <p className="text-muted-foreground italic font-medium leading-relaxed">{item.example}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/40 dark:border-white/5">
                            <div>
                              <span className="text-[9px] font-black uppercase text-amber-600 block">Exam Importance</span>
                              <p className="text-foreground font-extrabold">{item.importance}</p>
                            </div>
                            <div>
                              <span className="text-[9px] font-black uppercase text-rose-600 block">Common Pitfalls</span>
                              <p className="text-foreground font-extrabold">{item.commonMistakes || 'Unit calculation errors'}</p>
                            </div>
                          </div>
                          {item.memoryTrick && (
                            <div className="mt-2 pt-2 border-t border-slate-200/40 dark:border-white/5">
                              <span className="text-[9px] font-black uppercase text-indigo-600 block">Memory Trick / Mnemonic</span>
                              <p className="text-muted-foreground font-bold italic leading-relaxed">{item.memoryTrick}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* FORMULA LAB TAB */}
            {activeTab === 'formulas' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.importantFormulas.map((item, idx) => {
                  const isSavedFormula = savedFormulas.some((f) => f.formula === item.formula);
                  const isBookmarked = bookmarks[`${analysis.videoId}_formula_${idx}`] !== undefined;

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
                            <button
                              onClick={() => handleToggleBookmark('formula', `${idx}`, item.name, item)}
                              className={`p-1.5 rounded-lg border flex items-center justify-center transition ${
                                isBookmarked
                                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-muted-foreground'
                              }`}
                            >
                              <Bookmark className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-900 text-white font-mono font-extrabold text-center text-base sm:text-lg tracking-wider border border-white/5 my-1">
                          {item.formula}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100">
                            <span className="text-[9px] font-bold text-indigo-500 uppercase block">Variables & Terms</span>
                            <p className="text-foreground/95 font-semibold mt-0.5">{item.variables || item.description || 'N/A'}</p>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100">
                            <span className="text-[9px] font-bold text-purple-500 uppercase block">SI/CGS Units</span>
                            <p className="text-foreground/95 font-semibold mt-0.5">{item.units || 'Standard SI Units'}</p>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          <strong className="text-foreground">Syllabus Context:</strong> {item.meaning || item.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-muted-foreground">
                        <div>
                          <strong className="text-indigo-600 block text-[9px] uppercase">CBSE Derivation Scheme</strong>
                          <p className="italic leading-relaxed">{item.derivation || 'Official derivation based on Gauss Theorem principles / syllabus context.'}</p>
                        </div>
                        {item.shortcut && (
                          <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10">
                            <strong className="text-amber-600 block text-[9px] uppercase">Shortcuts / Pro Study Tips</strong>
                            <p className="font-semibold">{item.shortcut}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <strong className="text-slate-600 dark:text-slate-400 block text-[9px] uppercase">NCERT Reference</strong>
                            <p className="font-bold text-foreground">{item.ncertReference || 'NCERT Page 14 / Solutions'}</p>
                          </div>
                          <div>
                            <strong className="text-indigo-600 block text-[9px] uppercase">Application Case</strong>
                            <p className="font-bold text-foreground">{item.whereUsed || 'Syllabus Numerical Problems'}</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* ASK LECTURE TAB (PROMPT GENERATOR SYSTEM) */}
            {activeTab === 'ask' && (
              <Card className="rounded-3xl p-6 bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 shadow-xs space-y-5">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-foreground text-indigo-600">Lecture-Aware AI Prompt Generator</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Generate highly optimized, pre-mapped prompts tailored perfectly for Class 12 board preparations. Use these templates to query external tools seamlessly.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'explain', label: 'Explain Concept' },
                    { id: 'beginner', label: 'Explain like Beginner' },
                    { id: 'board', label: 'Board Level Guide' },
                    { id: 'topper', label: 'Topper Notes Flow' },
                    { id: 'numericals', label: 'Generate Numericals' },
                    { id: 'pyqs', label: 'Generate PYQs' },
                    { id: 'competency', label: 'Competency Questions' },
                    { id: 'mindmap', label: 'Generate Mind Map' },
                    { id: 'flashcards', label: 'Generate Flashcards' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPromptType(p.id)}
                      className={`px-3 py-2 rounded-xl text-[10px] font-extrabold transition text-center border ${
                        selectedPromptType === p.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-muted-foreground hover:bg-slate-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  <textarea
                    readOnly
                    value={generatedPromptText}
                    className="w-full h-32 p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 font-mono text-xs focus:outline-none leading-relaxed text-foreground"
                  />

                  <div className="flex flex-wrap items-center gap-2 justify-end">
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedPromptText);
                        toast.success('Prompt copied to clipboard! Ready to paste into ChatGPT/Gemini.');
                      }}
                      className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black"
                    >
                      Copy Prompt Template
                    </Button>
                    <a
                      href={`https://chatgpt.com/?q=${encodeURIComponent(generatedPromptText)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="h-10 px-5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 hover:bg-slate-100 flex items-center text-xs font-bold text-foreground transition"
                    >
                      Continue with ChatGPT
                    </a>
                    <a
                      href={`https://gemini.google.com/app?q=${encodeURIComponent(generatedPromptText)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="h-10 px-5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 hover:bg-slate-100 flex items-center text-xs font-bold text-foreground transition"
                    >
                      Continue with Gemini
                    </a>
                  </div>
                </div>
              </Card>
            )}

            {/* NOTES TAB */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-white/5">
                  {[
                    { id: 'detailed', label: 'Detailed Notes' },
                    { id: 'teacher', label: 'Teacher Notes' },
                    { id: 'revision', label: 'Revision Notes' },
                    { id: 'exam', label: 'Exam Notes' },
                    { id: 'oneNight', label: 'One Night Before' },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setActiveRevisionTab(sub.id as any)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                        activeRevisionTab === sub.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>

                <Card className="rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                    <span className="text-xs font-black uppercase text-indigo-600 block">Personal Study Slate (Editable)</span>
                    <span className="text-[10px] text-muted-foreground font-mono">Changes save automatically</span>
                  </div>

                  {/* EDITABLE FIELD */}
                  <textarea
                    value={editedNotes[`${analysis.videoId}_${activeRevisionTab}`] !== undefined ? editedNotes[`${analysis.videoId}_${activeRevisionTab}`] : (
                      activeRevisionTab === 'detailed' ? analysis.revisionMode.revisionNotes :
                      activeRevisionTab === 'teacher' ? (analysis.aiSummary.teacherNotes || 'Teacher guidance notes mapped to Gaussian surface, Snells laws, derivation strategies.') :
                      activeRevisionTab === 'revision' ? analysis.aiSummary.examSummary :
                      activeRevisionTab === 'exam' ? (analysis.revisionMode.examNotes || 'Scoring keywords: flux vector product, normal boundaries, Snell law formulas.') :
                      (analysis.revisionMode.oneNightBeforeExamNotes || 'Checklist: ray tracing diagram directions, units conversion checklists, Gauss formula parameters.')
                    )}
                    onChange={(e) => handleUpdateNote(activeRevisionTab, e.target.value)}
                    className="w-full h-96 p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 font-sans text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed text-foreground"
                  />
                </Card>
              </div>
            )}

            {/* PRACTICE MODE TAB */}
            {activeTab === 'practice' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-white/5">
                  {[
                    { id: 'mcqs', label: '10 MCQs' },
                    { id: 'numericals', label: 'Numericals' },
                    { id: 'short', label: 'Short Questions' },
                    { id: 'long', label: 'Long / Derivations' },
                    { id: 'case', label: 'Case Study' },
                    { id: 'assertion', label: 'Assertion Reason' },
                    { id: 'competency', label: 'Competency' },
                    { id: 'hots', label: 'HOTS' },
                    { id: 'board', label: 'Board Pattern' },
                    { id: 'pyq', label: 'Previous Year' },
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

                <div className="space-y-4">
                  {/* MCQS */}
                  {activeQuestionTab === 'mcqs' && (
                    <div className="space-y-4 animate-fadeIn">
                      {analysis.mcqs.map((q, qIdx) => {
                        const hasSelected = selectedAnswers[qIdx] !== undefined;
                        const isCorrect = selectedAnswers[qIdx] === q.answer;

                        return (
                          <Card key={qIdx} className="rounded-2xl p-5 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-white/10 shadow-xs space-y-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2">
                                <span className="text-xs font-bold bg-indigo-500/10 text-indigo-600 px-2.5 py-0.5 rounded-full font-mono shrink-0">
                                  {qIdx + 1}
                                </span>
                                <h4 className="font-extrabold text-sm sm:text-base text-foreground leading-snug">{q.question}</h4>
                              </div>

                              <button
                                onClick={() => handleToggleBookmark('question', `mcq_${qIdx}`, q.question, q)}
                                className="p-1 text-muted-foreground hover:text-indigo-500 shrink-0"
                              >
                                <Bookmark className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-3">
                              {q.options.map((opt, oIdx) => {
                                const isUserSelected = selectedAnswers[qIdx] === opt;
                                const isCorrectOpt = opt === q.answer;

                                return (
                                  <button
                                    key={oIdx}
                                    onClick={() => {
                                      if (showGradedResults) return;
                                      setSelectedAnswers(prev => ({ ...prev, [qIdx]: opt }));
                                    }}
                                    disabled={showGradedResults}
                                    className={`p-3.5 rounded-xl border text-left text-xs font-bold transition-all ${
                                      isUserSelected
                                        ? showGradedResults
                                          ? isCorrectOpt
                                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700'
                                            : 'bg-rose-500/10 border-rose-500 text-rose-700'
                                          : 'bg-indigo-500/10 border-indigo-500 text-indigo-600'
                                        : isCorrectOpt && showGradedResults
                                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 font-bold'
                                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200/80 dark:border-white/5 hover:border-indigo-400 text-foreground/80'
                                    }`}
                                  >
                                    <span className="font-bold uppercase font-mono mr-2">{String.fromCharCode(65 + oIdx)}.</span>
                                    <span>{opt}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {showGradedResults && (
                              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-xs leading-relaxed text-muted-foreground font-semibold space-y-2">
                                <div><strong className="text-foreground">Solution Explanation:</strong> {q.explanation}</div>
                                {q.mistakeAnalysis && <div><strong className="text-rose-600">Common Mistake:</strong> {q.mistakeAnalysis}</div>}
                                {q.topicLink && <div><strong className="text-indigo-600">Topic Link:</strong> {q.topicLink}</div>}
                              </div>
                            )}
                          </Card>
                        );
                      })}

                      {/* Grading Score */}
                      {!showGradedResults && Object.keys(selectedAnswers).length > 0 && (
                        <div className="flex justify-end pt-3">
                          <Button
                            onClick={handleGradeMCQs}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-6 py-2.5 rounded-xl shadow"
                          >
                            Grade Quiz ({Object.keys(selectedAnswers).length}/{analysis.mcqs.length} answered)
                          </Button>
                        </div>
                      )}

                      {showGradedResults && gradedScore !== null && (
                        <div className="p-5 rounded-3xl bg-indigo-500/15 border border-indigo-500/30 text-center space-y-2">
                          <h4 className="text-lg font-black text-indigo-600">Graded Score: {gradedScore} / {analysis.mcqs.length}</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAnswers({});
                              setGradedScore(null);
                              setShowGradedResults(false);
                            }}
                            className="text-indigo-600 border-indigo-500/20 hover:bg-indigo-500/10 rounded-xl"
                          >
                            Reset & Try Again
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* NUMERICALS */}
                  {activeQuestionTab === 'numericals' && (
                    <div className="space-y-4">
                      {(!analysis.numericals || analysis.numericals.length === 0) ? (
                        <Card className="p-8 text-center text-muted-foreground italic rounded-2xl bg-white/40 dark:bg-slate-900/40 col-span-2">
                          No numerical calculation questions generated for this theoretical syllabus topic.
                        </Card>
                      ) : (
                        analysis.numericals.map((num, idx) => {
                          const isRevealed = practiceAnswersReveal[`num_${idx}`];
                          return (
                            <Card key={idx} className="rounded-2xl p-5 bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-white/10 shadow-xs space-y-4 animate-fadeIn">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded">Numerical #{idx + 1}</span>
                                <button
                                  onClick={() => setPracticeAnswersReveal(prev => ({ ...prev, [`num_${idx}`]: !isRevealed }))}
                                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                                >
                                  {isRevealed ? 'Hide Solution' : 'Show Solution'}
                                </button>
                              </div>

                              <h4 className="font-extrabold text-sm sm:text-base text-foreground leading-snug">{num.question}</h4>
                              <div className="p-2.5 bg-slate-900 text-white font-mono rounded-lg text-center text-xs">Formula Used: {num.formulaUsed}</div>

                              {isRevealed && (
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs space-y-3">
                                  <div>
                                    <strong className="text-indigo-600 block mb-0.5">Solution Steps</strong>
                                    <ol className="list-decimal pl-4 space-y-1 text-muted-foreground font-semibold">
                                      {num.solutionStepByStep.map((s, si) => <li key={si}>{s}</li>)}
                                    </ol>
                                  </div>
                                  <div className="pt-2 border-t flex justify-between font-bold">
                                    <span>Final Answer:</span>
                                    <span className="text-emerald-500 font-mono">{num.finalAnswer}</span>
                                  </div>
                                </div>
                              )}
                            </Card>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* OTHER QUESTION CATEGORIES (REVEAL MODEL ANSWER SYSTEM) */}
                  {activeQuestionTab !== 'mcqs' && activeQuestionTab !== 'numericals' && (
                    <div className="space-y-4">
                      {/* Generates a clean loop through available subjective structures */}
                      {[
                        { id: 'short', data: analysis.shortQuestions, title: 'Short Answer (2-3 Marks)' },
                        { id: 'long', data: analysis.longQuestions, title: 'Long Derivation (5 Marks)' },
                        { id: 'case', data: analysis.caseStudy, title: 'Case Study Scenario' },
                        { id: 'assertion', data: analysis.assertionReason, title: 'Assertion-Reason Statement' },
                        { id: 'competency', data: analysis.competencyQuestions, title: 'Competency Scenario' },
                        { id: 'hots', data: analysis.hotsQuestions, title: 'HOTS Skill Question' },
                        { id: 'board', data: analysis.boardPatternQuestions, title: 'Board Pattern Scheme' },
                      ].filter(x => x.id === activeQuestionTab).map((cat) => {
                        if (!cat.data || cat.data.length === 0) {
                          return (
                            <Card key={cat.id} className="p-8 text-center text-muted-foreground italic rounded-2xl bg-white/40 dark:bg-slate-900/40">
                              Subjective question sets are mapped inside revision and study sheets tabs.
                            </Card>
                          );
                        }

                        return cat.data.map((q: any, idx) => {
                          const isRevealed = practiceAnswersReveal[`${cat.id}_${idx}`];
                          return (
                            <Card key={idx} className="rounded-2xl p-5 bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-white/10 shadow-xs space-y-4 animate-fadeIn">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded">{cat.title} #{idx + 1}</span>
                                <button
                                  onClick={() => setPracticeAnswersReveal(prev => ({ ...prev, [`${cat.id}_${idx}`]: !isRevealed }))}
                                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                                >
                                  {isRevealed ? 'Hide Ideal Answer' : 'Show Ideal Answer'}
                                </button>
                              </div>

                              {q.scenario && (
                                <div className="p-3.5 bg-indigo-500/5 rounded-xl border border-indigo-500/10 text-xs italic text-foreground/80 leading-relaxed">
                                  <strong>Scenario context:</strong> {q.scenario}
                                </div>
                              )}

                              <h4 className="font-extrabold text-sm sm:text-base text-foreground leading-snug">{q.question}</h4>

                              {isRevealed && (
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 text-xs space-y-3 leading-relaxed">
                                  <div>
                                    <strong className="text-indigo-600 uppercase text-[9px] block">Model Answer</strong>
                                    <p className="text-foreground/90 font-medium whitespace-pre-wrap">{q.answer}</p>
                                  </div>
                                  {q.explanation && (
                                    <div>
                                      <strong className="text-purple-600 uppercase text-[9px] block">Explanation Details</strong>
                                      <p className="text-muted-foreground font-semibold">{q.explanation}</p>
                                    </div>
                                  )}
                                  {q.detailedPoints && (
                                    <div>
                                      <strong className="text-indigo-600 uppercase text-[9px] block">CBSE Grading Steps</strong>
                                      <ol className="list-decimal pl-4 space-y-1 text-muted-foreground font-semibold">
                                        {q.detailedPoints.map((p: string, pi: number) => <li key={pi}>{p}</li>)}
                                      </ol>
                                    </div>
                                  )}
                                  {q.points && (
                                    <div>
                                      <strong className="text-indigo-600 uppercase text-[9px] block">Scoring Points</strong>
                                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground font-semibold">
                                        {q.points.map((p: string, pi: number) => <li key={pi}>{p}</li>)}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}
                            </Card>
                          );
                        });
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* FLASHCARDS TAB */}
            {activeTab === 'flashcards' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setFlashcardShuffle(!flashcardShuffle)}
                      className={`h-9 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition cursor-pointer ${
                        flashcardShuffle ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-900 border-slate-200 text-muted-foreground'
                      }`}
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      <span>Shuffle Cards</span>
                    </button>
                  </div>

                  <span className="text-xs font-mono font-bold text-indigo-600">
                    {flashcardDeck.length > 0 ? `${flashcardIdx + 1} of ${flashcardDeck.length} Cards` : '0 Cards'}
                  </span>
                </div>

                {flashcardDeck.length > 0 ? (
                  <div className="max-w-xl mx-auto space-y-6">
                    {/* Flippable Card Container */}
                    <div
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="h-64 perspective-1000 cursor-pointer select-none"
                    >
                      <div className={`relative w-full h-full duration-500 preserve-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>
                        {/* Front Side */}
                        <div className="absolute inset-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 flex flex-col justify-between shadow-lg backface-hidden">
                          <span className="text-[10px] font-black uppercase text-indigo-600 block">Question Front</span>
                          <p className="text-base sm:text-lg font-black text-center text-foreground leading-snug px-4">
                            {flashcardDeck[flashcardIdx]?.front}
                          </p>
                          <span className="text-[10px] text-muted-foreground text-center font-mono">Click anywhere to flip and reveal answer</span>
                        </div>

                        {/* Back Side */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-6 flex flex-col justify-between shadow-lg backface-hidden rotate-y-180 text-white text-center">
                          <span className="text-[10px] font-black uppercase text-indigo-200 text-left">Ideal Answer Back</span>
                          <p className="text-sm sm:text-base font-bold leading-relaxed px-4">
                            {flashcardDeck[flashcardIdx]?.back}
                          </p>
                          <span className="text-[10px] text-indigo-200 font-mono">Click anywhere to flip back</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center max-w-sm mx-auto">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsFlipped(false);
                          setFlashcardIdx(prev => Math.max(0, prev - 1));
                        }}
                        disabled={flashcardIdx === 0}
                        className="rounded-xl font-bold text-xs"
                      >
                        Previous
                      </Button>

                      <Button
                        onClick={() => {
                          setIsFlipped(false);
                          setFlashcardIdx(prev => Math.min(flashcardDeck.length - 1, prev + 1));
                        }}
                        disabled={flashcardIdx === flashcardDeck.length - 1}
                        className="rounded-xl font-black bg-indigo-600 text-white text-xs"
                      >
                        Next Card
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic text-center py-10">No flashcards loaded.</p>
                )}
              </div>
            )}

            {/* MIND MAP TAB */}
            {activeTab === 'mindmap' && (
              <Card className="rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-indigo-600">ASCII Mind Map Tree View</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setMindMapZoom(prev => Math.max(0.7, prev - 0.1))}
                      className="p-1.5 rounded-lg border border-slate-200 text-muted-foreground hover:text-foreground hover:bg-slate-50"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setMindMapZoom(prev => Math.min(1.4, prev + 0.1))}
                      className="p-1.5 rounded-lg border border-slate-200 text-muted-foreground hover:text-foreground hover:bg-slate-50"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setMindMapExpanded(!mindMapExpanded)}
                      className="px-3 h-8 text-xs font-bold rounded-lg border border-slate-200 text-muted-foreground hover:text-foreground"
                    >
                      {mindMapExpanded ? 'Collapse Tree' : 'Expand Tree'}
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto p-4 bg-slate-950 text-yellow-400 font-mono rounded-2xl border border-white/5 relative">
                  <pre
                    style={{ transform: `scale(${mindMapZoom})`, transformOrigin: 'top left' }}
                    className="text-xs sm:text-sm whitespace-pre leading-relaxed tracking-wider transition-transform duration-200"
                  >
                    {parsedMindMapText}
                  </pre>
                </div>
              </Card>
            )}

            {/* PDF TAB */}
            {activeTab === 'pdf' && (
              <Card className="rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs space-y-4">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-foreground text-indigo-600">Download Offline Study Package Exporters</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Instantly save comprehensive, beautifully printed layout blueprints or markdown revision summaries for offline local access.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                  {[
                    { title: 'Overview Summary Package', file: 'Summary_Sheet.md', content: `## Summary Sheet\n\n### Detailed Summary\n${analysis.aiSummary.detailed}\n\n### Teacher Study Notes\n${analysis.aiSummary.teacherNotes}` },
                    { title: 'Detailed Notes package', file: 'Detailed_Study_Notes.md', content: `## Detailed Study Notes\n\n${analysis.revisionMode.revisionNotes}` },
                    { title: 'PCM Formula sheet', file: 'Formulas_Reference.md', content: `## Formulas Sheet Reference\n\n${analysis.importantFormulas.map(f => `### ${f.name}\nFormula: ${f.formula}\nUnits: ${f.units}`).join('\n\n')}` },
                    { title: 'Questions PDF Builder', file: 'Board_Practice_Tests.md', content: `## Board Practice Tests\n\n${analysis.mcqs.map((q, i) => `${i+1}. ${q.question}\nOptions: ${q.options.join(', ')}\nAnswer: ${q.answer}`).join('\n\n')}` },
                    { title: 'Interactive Flashcards Print', file: 'Flashcard_Sheet.md', content: `## Print Flashcards Sheet\n\n${analysis.revisionMode.flashcards.map(f => `Question: ${f.front}\nAnswer: ${f.back}`).join('\n\n')}` },
                  ].map((p, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-white/5 flex flex-col justify-between space-y-3 text-xs">
                      <div>
                        <h5 className="font-extrabold text-foreground">{p.title}</h5>
                        <p className="text-[11px] text-muted-foreground mt-0.5">High-fidelity export ready for browser printing or importing.</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.print()}
                          className="flex-1 h-8 text-[11px] font-bold rounded-lg"
                        >
                          Print PDF
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            const blob = new Blob([p.content], { type: 'text/markdown' });
                            const linkUrl = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = linkUrl;
                            a.download = p.file;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(linkUrl);
                            toast.success(`Study sheet exported as ${p.file}!`);
                          }}
                          className="flex-1 h-8 text-[11px] font-black bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
                        >
                          Download MD
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* PROGRESS & SMART BOOKMARKS TAB */}
            {activeTab === 'progress' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* REVISION MODES */}
                <Card className="rounded-3xl p-5 bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 shadow-xs space-y-4">
                  <h4 className="font-extrabold text-sm text-foreground text-indigo-600">Dynamic Revision Modes</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Custom study lengths for board examinations revision based on available timeline length.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                      { id: 'quick', label: 'Quick Scan Notes', time: '1-3 Mins' },
                      { id: '15m', label: '15 Mins Target', time: '15 Mins' },
                      { id: '30m', label: '30 Mins Target', time: '30 Mins' },
                      { id: '1h', label: 'Full 1 Hour Revision', time: '1 Hour' },
                      { id: 'exam', label: 'CBSE Exam Prep Mode', time: 'Unlimited' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setSelectedRevisionTime(mode.id as any)}
                        className={`p-3 rounded-xl border text-left font-bold transition flex items-center justify-between ${
                          selectedRevisionTime === mode.id
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/5 text-muted-foreground hover:bg-slate-100'
                        }`}
                      >
                        <span>{mode.label}</span>
                        <span className="text-[10px] font-mono opacity-80 shrink-0">{mode.time}</span>
                      </button>
                    ))}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-xs text-muted-foreground leading-relaxed">
                    <strong className="text-indigo-600 uppercase text-[9px] block mb-0.5">Mode Context</strong>
                    {selectedRevisionTime === 'quick' && 'Focusing heavily on One Minute summary bullets & key concept definitions.'}
                    {selectedRevisionTime === '15m' && 'Prioritizing Formulas variables, common calculation pitfalls, and NCERT References.'}
                    {selectedRevisionTime === '30m' && 'Reviewing ASCII Concept tree branches, timeline stamps, and subjective MCQs solutions.'}
                    {selectedRevisionTime === '1h' && 'In-depth derivation tracing, case study scenario reviews, and short questions step marks guidelines.'}
                    {selectedRevisionTime === 'exam' && 'Full comprehensive curriculum evaluation spanning HOTS, Competency scenarios, and PYQs style write-ups.'}
                  </div>
                </Card>

                {/* BOOKMARKS LIST & PROGRESS HUD */}
                <Card className="rounded-3xl p-5 bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                    <h4 className="font-extrabold text-sm text-foreground text-indigo-600">Smart Bookmarked Vault</h4>
                    <span className="text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded">
                      {Object.keys(bookmarks).filter(k => k.startsWith(analysis.videoId)).length} Bookmarked
                    </span>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {Object.keys(bookmarks).filter(k => k.startsWith(analysis.videoId)).length === 0 ? (
                      <p className="text-xs text-muted-foreground italic text-center py-8">Your bookmarks for this lecture is empty. Add bookmarks from Concepts, Formula Lab or Questions!</p>
                    ) : (
                      Object.entries(bookmarks).filter(([k]) => k.startsWith(analysis.videoId)).map(([key, bm]) => (
                        <div key={key} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 text-xs flex justify-between items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <span className="text-[8px] font-black uppercase text-indigo-600 block leading-none mb-0.5">{bm.type}</span>
                            <h5 className="font-extrabold text-foreground truncate">{bm.title}</h5>
                          </div>
                          <button
                            onClick={() => {
                              const next = { ...bookmarks };
                              delete next[key];
                              setBookmarks(next);
                              saveUserDataState('lecturelab_bookmarks', next);
                              toast.success('Bookmark removed');
                            }}
                            className="text-rose-500 hover:text-rose-600 p-1 shrink-0"
                            title="Delete bookmark"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* COMING SOON SECTION (Display only) */}
          <div className="relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-800 p-6 text-white text-center shadow-xl space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 px-3 py-1 text-[10px] font-bold text-indigo-300">
              <Sparkles className="w-3 h-3 text-indigo-400 animate-spin" />
              <span>Rankify AI Lab Roadmap</span>
            </div>
            <h3 className="text-lg font-black text-white">Next-Gen Multimodal Study Discussion Coming Soon</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-2 text-xs font-bold text-indigo-200">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur shadow">Voice Discussion (Coming Soon)</div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur shadow">Image Doubts (Coming Soon)</div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur shadow">Live Whiteboard (Coming Soon)</div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur shadow">AI Tutor (Coming Soon)</div>
            </div>
          </div>
        </div>
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
          <Card className="p-8 text-center text-muted-foreground italic rounded-3xl border border-dashed border-slate-200 bg-white/40 dark:bg-slate-900/40">
            Your Library is empty. Paste a lecture link above and click "Save to Library" to start saving study blueprints!
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {library.map((item) => (
              <Card
                key={item.videoId}
                onClick={() => {
                  setAnalysis(item);
                  syncEngine.setLocalCache('lecturelab_last_analyzed', item, userId);
                  window.scrollTo({ top: 350, behavior: 'smooth' });
                  toast.success(`Loaded active study: ${item.detectedChapter}`);
                }}
                className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-indigo-500/40 transition duration-300 cursor-pointer flex flex-col justify-between animate-fadeIn"
              >
                <div>
                  <div className="h-32 relative overflow-hidden bg-slate-900">
                    <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/75 text-white font-bold">{item.duration}</span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">{item.detectedSubject}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-mono">{item.difficulty}</span>
                    </div>
                    <h4 className="font-extrabold text-xs sm:text-sm text-foreground leading-snug line-clamp-2">{item.title}</h4>
                    <p className="text-[11px] text-muted-foreground truncate">Channel: <strong className="text-foreground">{item.channelName}</strong></p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                    <span>Study Companion</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                  
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const docRef = doc(db, 'users', userId, 'lecturelab_analyses', item.videoId);
                        await deleteDoc(docRef);
                        if (analysis?.videoId === item.videoId) {
                          setAnalysis(null);
                        }
                        await fetchLibrary();
                        toast.success('Deleted from Lecture Library');
                      } catch (err) {
                        toast.error('Failed to delete');
                      }
                    }}
                    className="p-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition"
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
