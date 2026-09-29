import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  NcertChapter,
  NcertTopic,
  NcertParagraph,
  ReaderTheme,
  ReaderFontSize,
  ImportantLineTag,
  NcertHighlight,
  NcertBookmark,
} from '@/types/ncert';
import { ncertService } from '@/services/ncert-service';
import {
  BookOpen,
  ArrowLeft,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Bookmark,
  Highlighter,
  Sliders,
  Sun,
  Moon,
  CheckCircle2,
  FileText,
  Brain,
  Zap,
  Target,
  Clock,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Award,
  AlertTriangle,
  Lightbulb,
  Check,
  Video,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigation } from '@/contexts/NavigationContext';

interface SmartReaderViewProps {
  chapter: NcertChapter;
  onBack: () => void;
  onOpenRevisionModal: () => void;
}

export const SmartReaderView: React.FC<SmartReaderViewProps> = ({
  chapter,
  onBack,
  onOpenRevisionModal,
}) => {
  const { setActiveTab } = useNavigation();
  const [selectedTopicIndex, setSelectedTopicIndex] = useState(0);
  const [selectedParagraphId, setSelectedParagraphId] = useState<string>(
    chapter.topics[0]?.paragraphs[0]?.id || ''
  );
  const [activeInspectorTab, setActiveInspectorTab] = useState<
    'explain' | 'related' | 'memory' | 'notes' | 'quiz'
  >('explain');

  // Reader Preferences
  const [theme, setTheme] = useState<ReaderTheme>('light');
  const [fontSize, setFontSize] = useState<ReaderFontSize>('medium');
  const [voiceSpeed, setVoiceSpeed] = useState<number>(1.0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoicePaused, setIsVoicePaused] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [highlightColor, setHighlightColor] = useState<'yellow' | 'green' | 'pink' | 'blue' | 'purple'>('yellow');
  const [newNoteText, setNewNoteText] = useState('');
  const [showNoteEditor, setShowNoteEditor] = useState(false);

  // User Interactive Quiz Answer state
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<string, string>>({});
  const [revealedQuizExplanations, setRevealedQuizExplanations] = useState<Record<string, boolean>>({});

  // Local caching & subscriptions
  const [state, setState] = useState(() => ncertService.getCachedState());

  useEffect(() => {
    const unsub = ncertService.subscribe((s) => {
      setState(s);
    });
    return () => {
      unsub();
      ncertService.stopVoice();
    };
  }, []);

  const currentTopic = chapter.topics[selectedTopicIndex] || chapter.topics[0];
  const currentParagraph =
    currentTopic.paragraphs.find((p) => p.id === selectedParagraphId) ||
    currentTopic.paragraphs[0];

  const chapterProgress = state.progressMap[chapter.id] || {
    chapterId: chapter.id,
    readingMinutes: 15,
    completionPercent: 40,
    lastReadParagraphId: currentParagraph.id,
    lastReadTimestamp: Date.now(),
    revisionsCount: 1,
    confidenceScore: 70,
    questionsSolvedCount: 5,
    highlightsCount: 2,
    bookmarksCount: 1,
    notesCount: 1,
  };

  const chapterHighlights = state.highlights[chapter.id] || [];
  const chapterNotes = state.personalNotes[chapter.id] || [];
  const isCurrentBookmarked = state.bookmarks.some((b) => b.paragraphId === currentParagraph.id);
  const currentNote = chapterNotes.find((n) => n.paragraphId === currentParagraph.id);

  // Audio Voice Controls
  const handleToggleVoice = () => {
    if (isSpeaking && !isVoicePaused) {
      ncertService.pauseVoice();
      setIsVoicePaused(true);
    } else if (isSpeaking && isVoicePaused) {
      ncertService.resumeVoice();
      setIsVoicePaused(false);
    } else {
      setIsSpeaking(true);
      setIsVoicePaused(false);
      ncertService.speakParagraph(
        currentParagraph.id,
        `${currentParagraph.heading ? currentParagraph.heading + '. ' : ''}${currentParagraph.text}`,
        voiceSpeed,
        () => {
          setIsSpeaking(false);
          setIsVoicePaused(false);
        }
      );
    }
  };

  const handleStopVoice = () => {
    ncertService.stopVoice();
    setIsSpeaking(false);
    setIsVoicePaused(false);
  };

  const handleAddHighlight = async () => {
    await ncertService.addHighlight(
      chapter.id,
      currentParagraph.id,
      highlightColor,
      currentParagraph.text.substring(0, 80) + '...'
    );
    toast.success('Paragraph highlighted in ' + highlightColor + '!');
  };

  const handleToggleBookmark = async () => {
    const isNow = await ncertService.toggleBookmark(
      chapter.id,
      currentParagraph.id,
      currentTopic.title,
      currentParagraph.heading || currentParagraph.text.substring(0, 45) + '...'
    );
    if (isNow) {
      toast.success('Paragraph bookmarked!');
    } else {
      toast('Bookmark removed');
    }
  };

  const handleSaveNote = async () => {
    if (!newNoteText.trim()) return;
    await ncertService.savePersonalNote(chapter.id, currentParagraph.id, newNoteText.trim());
    toast.success('Personal annotation saved to NCERT reader!');
    setShowNoteEditor(false);
    setNewNoteText('');
  };

  // Theme container classes
  const themeClasses: Record<ReaderTheme, { bg: string; text: string; cardBg: string; border: string }> = {
    light: {
      bg: 'bg-slate-50',
      text: 'text-slate-900',
      cardBg: 'bg-white',
      border: 'border-slate-200/80',
    },
    sepia: {
      bg: 'bg-[#fcf5e5]',
      text: 'text-[#433422]',
      cardBg: 'bg-[#f7eed9]',
      border: 'border-[#ebd9be]',
    },
    dark: {
      bg: 'bg-slate-950',
      text: 'text-slate-100',
      cardBg: 'bg-slate-900',
      border: 'border-white/10',
    },
    night: {
      bg: 'bg-black',
      text: 'text-neutral-200',
      cardBg: 'bg-neutral-950',
      border: 'border-neutral-800',
    },
  };

  const fontSizeClasses: Record<ReaderFontSize, string> = {
    small: 'text-sm leading-relaxed',
    medium: 'text-base leading-relaxed sm:text-lg sm:leading-loose',
    large: 'text-lg leading-loose sm:text-xl sm:leading-loose',
    xl: 'text-xl leading-loose sm:text-2xl sm:leading-loose',
  };

  const currentThemeStyle = themeClasses[theme];

  return (
    <div className={`min-h-screen ${currentThemeStyle.bg} ${currentThemeStyle.text} transition-colors duration-300 pb-28 select-none`}>
      {/* 1. TOP READER NAVIGATION & PROGRESS BAR */}
      <div className={`sticky top-0 z-30 ${currentThemeStyle.cardBg} border-b ${currentThemeStyle.border} px-4 py-3 backdrop-blur-md bg-opacity-95 shadow-xs`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider font-mono text-purple-600 dark:text-purple-400">
                  NCERT Class 12 {chapter.subject} • Chapter {chapter.chapterNumber}
                </span>
                <span className="hidden sm:inline-block text-[10px] px-2 py-0.2 rounded-full bg-purple-500/10 text-purple-600 font-mono font-bold">
                  {chapter.weightageMarks} Marks
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-black truncate max-w-xs sm:max-w-md">
                {chapter.title}
              </h1>
            </div>
          </div>

          {/* Reader Action Controls */}
          <div className="flex items-center gap-2">
            {/* Rapid Revision Modal Trigger */}
            <button
              onClick={onOpenRevisionModal}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span className="hidden sm:inline">Revision Suite</span>
            </button>

            {/* Voice Mode Audio Trigger */}
            <button
              onClick={handleToggleVoice}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                isSpeaking
                  ? 'bg-amber-500 text-white border-amber-500 animate-pulse'
                  : 'hover:bg-slate-200/60 dark:hover:bg-slate-800 border-slate-300 dark:border-white/10'
              }`}
              title="Read paragraph aloud"
            >
              {isSpeaking && !isVoicePaused ? (
                <Pause className="w-4 h-4" />
              ) : isSpeaking && isVoicePaused ? (
                <Play className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
              <span className="hidden md:inline font-mono">{voiceSpeed}x</span>
            </button>

            {/* Reader Appearance Settings Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="p-2 rounded-xl border border-slate-300 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Reader Appearance Settings"
              >
                <Sliders className="w-4 h-4" />
              </button>

              {/* Appearance Dropdown */}
              {showSettingsMenu && (
                <div className="absolute right-0 top-12 w-64 p-4 rounded-2xl bg-card border border-slate-200 dark:border-white/10 shadow-2xl z-50 space-y-3.5 text-xs text-foreground">
                  <div className="flex items-center justify-between font-bold border-b pb-2 border-slate-200 dark:border-white/10">
                    <span>Reader Appearance</span>
                    <button
                      onClick={() => setShowSettingsMenu(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Theme Select */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Reading Theme</span>
                    <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-[11px]">
                      {(['light', 'sepia', 'dark', 'night'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setTheme(t)}
                          className={`p-2 rounded-xl capitalize font-bold border cursor-pointer ${
                            theme === t
                              ? 'border-purple-600 bg-purple-500/10 text-purple-600'
                              : 'border-slate-200 dark:border-white/10'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Size Select */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Text Size</span>
                    <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-[11px]">
                      {(['small', 'medium', 'large', 'xl'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setFontSize(s)}
                          className={`p-2 rounded-xl uppercase font-bold border cursor-pointer ${
                            fontSize === s
                              ? 'border-purple-600 bg-purple-500/10 text-purple-600'
                              : 'border-slate-200 dark:border-white/10'
                          }`}
                        >
                          {s === 'small' ? 'S' : s === 'medium' ? 'M' : s === 'large' ? 'L' : 'XL'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Audio Speed */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Voice Speed</span>
                    <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-[11px]">
                      {[0.75, 1.0, 1.25, 1.5].map((sp) => (
                        <button
                          key={sp}
                          onClick={() => {
                            setVoiceSpeed(sp);
                            if (isSpeaking) {
                              ncertService.stopVoice();
                              setIsSpeaking(false);
                            }
                          }}
                          className={`p-2 rounded-xl font-bold border cursor-pointer ${
                            voiceSpeed === sp
                              ? 'border-purple-600 bg-purple-500/10 text-purple-600'
                              : 'border-slate-200 dark:border-white/10'
                          }`}
                        >
                          {sp}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reading Progress Line */}
        <div className="max-w-7xl mx-auto mt-2 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Reading Progress: <strong>{chapterProgress.completionPercent}%</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>~{Math.max(10, chapter.totalEstimatedMinutes - chapterProgress.readingMinutes)} mins remaining</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span>Confidence: <strong className="text-emerald-500">{chapterProgress.confidenceScore}%</strong></span>
          </div>
        </div>

        <div className="h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
            style={{ width: `${chapterProgress.completionPercent}%` }}
          />
        </div>
      </div>

      {/* 2. MAIN SPLIT INTERFACE: READER (Left) + AI INTELLIGENCE DRAWER (Right) */}
      <div className="max-w-7xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: NCERT TEXTBOOK SMART READER */}
        <div className="lg:col-span-7 space-y-6">
          {/* Topic Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            {chapter.topics.map((top, idx) => (
              <button
                key={top.id}
                onClick={() => {
                  setSelectedTopicIndex(idx);
                  if (top.paragraphs[0]) {
                    setSelectedParagraphId(top.paragraphs[0].id);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-all ${
                  selectedTopicIndex === idx
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-card border border-slate-200/80 dark:border-white/10 text-muted-foreground hover:text-foreground'
                }`}
              >
                {top.title}
              </button>
            ))}
          </div>

          {/* Chapter Paragraphs Container */}
          <div className="space-y-5">
            {currentTopic.paragraphs.map((p) => {
              const isSelected = selectedParagraphId === p.id;
              const hasHighlight = chapterHighlights.find((h) => h.paragraphId === p.id);
              const tag = p.importantLineTag;

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedParagraphId(p.id)}
                  className={`p-6 rounded-3xl border transition-all duration-300 cursor-pointer relative ${
                    isSelected
                      ? `ring-2 ring-purple-600 shadow-xl ${currentThemeStyle.cardBg}`
                      : `${currentThemeStyle.cardBg} ${currentThemeStyle.border} hover:border-purple-400/60`
                  }`}
                >
                  {/* Paragraph Header: Tags, Audio active indicator & Bookmark */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {p.heading && (
                        <h3 className="font-extrabold text-sm sm:text-base text-foreground">
                          {p.heading}
                        </h3>
                      )}

                      {/* Important Line Board Badge */}
                      {tag && (
                        <span
                          className={`text-[10px] font-black uppercase font-mono px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            tag === 'board_favourite'
                              ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                              : tag === 'high_weightage'
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              : tag === 'very_important'
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          <Award className="w-3 h-3" />
                          <span>{tag.replace('_', ' ')}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedParagraphId(p.id);
                          handleToggleBookmark();
                        }}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          state.bookmarks.some((b) => b.paragraphId === p.id)
                            ? 'text-amber-500'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                        title="Bookmark paragraph"
                      >
                        <Bookmark className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  </div>

                  {/* Paragraph Body Text */}
                  <p
                    className={`${fontSizeClasses[fontSize]} text-foreground select-text font-serif ${
                      hasHighlight
                        ? hasHighlight.color === 'yellow'
                          ? 'bg-amber-300/30 dark:bg-amber-400/20 px-1 rounded-md'
                          : hasHighlight.color === 'green'
                          ? 'bg-emerald-300/30 dark:bg-emerald-400/20 px-1 rounded-md'
                          : 'bg-pink-300/30 dark:bg-pink-400/20 px-1 rounded-md'
                        : ''
                    }`}
                  >
                    {p.text}
                  </p>

                  {/* Highlight & Note Actions Toolbar on Selected Paragraph */}
                  {isSelected && (
                    <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
                      {/* Color Palette for Highlight */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground font-mono">Highlight:</span>
                        {(['yellow', 'green', 'pink', 'blue', 'purple'] as const).map((c) => (
                          <button
                            key={c}
                            onClick={(e) => {
                              e.stopPropagation();
                              setHighlightColor(c);
                              handleAddHighlight();
                            }}
                            className={`w-5 h-5 rounded-full cursor-pointer transition-transform hover:scale-110 ${
                              c === 'yellow'
                                ? 'bg-amber-400'
                                : c === 'green'
                                ? 'bg-emerald-400'
                                : c === 'pink'
                                ? 'bg-pink-400'
                                : c === 'blue'
                                ? 'bg-blue-400'
                                : 'bg-purple-400'
                            }`}
                          />
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowNoteEditor(!showNoteEditor);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-foreground font-semibold flex items-center gap-1 text-[11px] cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                          <span>Add Note</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleVoice();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-foreground font-semibold flex items-center gap-1 text-[11px] cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                          <span>Listen</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Personal Note Editor */}
                  {isSelected && showNoteEditor && (
                    <div className="mt-3 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 space-y-2 text-xs">
                      <textarea
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        placeholder="Write your personal study note or exam reminder for this paragraph..."
                        className="w-full p-2.5 rounded-xl bg-background border border-slate-200 dark:border-white/10 text-foreground text-xs resize-none h-18"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setShowNoteEditor(false)}
                          className="px-3 py-1 rounded-lg text-muted-foreground hover:text-foreground"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveNote}
                          className="px-3 py-1 rounded-lg bg-purple-600 text-white font-bold"
                        >
                          Save Annotation
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Existing Saved Note Badge */}
                  {currentNote && (
                    <div className="mt-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs space-y-0.5">
                      <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 font-mono">
                        Your Personal Annotation:
                      </span>
                      <p className="text-foreground italic">{currentNote.noteText}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: AI INTELLIGENCE DECK & INSPECTOR */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-24 space-y-4">
            {/* Inspector Navigation Sub-tabs */}
            <div className="p-1 rounded-2xl bg-card border border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs font-bold shadow-xs">
              {[
                { id: 'explain', label: 'AI Explain', icon: Brain },
                { id: 'related', label: 'Related', icon: Target },
                { id: 'memory', label: 'Booster', icon: Sparkles },
                { id: 'notes', label: 'Notes', icon: FileText },
                { id: 'quiz', label: 'AI Quiz', icon: Zap },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeInspectorTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveInspectorTab(tab.id as any)}
                    className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-xs font-black'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[11px]">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* INSPECTOR BODY PANELS */}
            <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xl space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* TAB 1: AI EXPLAIN */}
              {activeInspectorTab === 'explain' && (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 font-mono">
                      Paragraph AI Breakdown
                    </span>
                    <h4 className="font-extrabold text-sm text-foreground">
                      {currentParagraph.heading || 'Conceptual Dissection'}
                    </h4>
                  </div>

                  {/* Explain Simply */}
                  <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 space-y-1">
                    <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 font-mono flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>Explain Simply (Intuition)</span>
                    </span>
                    <p className="text-foreground leading-relaxed">
                      {currentParagraph.explanation.simpleExplanation}
                    </p>
                  </div>

                  {/* Exam Point of View */}
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 space-y-1">
                    <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 font-mono flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" />
                      <span>Exam Point of View (CBSE Marking Scheme)</span>
                    </span>
                    <p className="text-foreground leading-relaxed">
                      {currentParagraph.explanation.examPointOfView}
                    </p>
                  </div>

                  {/* Real Life Example */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 space-y-1">
                    <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Real-World Physical Example</span>
                    </span>
                    <p className="text-foreground leading-relaxed">
                      {currentParagraph.explanation.realLifeExample}
                    </p>
                  </div>

                  {/* Common Mistakes */}
                  {currentParagraph.explanation.commonMistakes.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 space-y-1.5">
                      <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 font-mono flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Common Traps to Avoid</span>
                      </span>
                      {currentParagraph.explanation.commonMistakes.map((m, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-muted-foreground text-[11px]">
                          <span className="text-rose-500 font-bold">•</span>
                          <span>{m}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Difficult Words */}
                  {currentParagraph.explanation.difficultWords.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase text-muted-foreground font-mono">
                        Glossary & Specialized Vocabulary:
                      </span>
                      <div className="space-y-1">
                        {currentParagraph.explanation.difficultWords.map((w, idx) => (
                          <div key={idx} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 flex items-start gap-2">
                            <strong className="text-foreground">{w.word}:</strong>
                            <span className="text-muted-foreground">{w.meaning}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: RELATED CONTENT */}
              {activeInspectorTab === 'related' && (
                <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 font-mono block">
                    Curated Formulas, Derivations & PYQs
                  </span>

                  {/* Formulas */}
                  {currentParagraph.relatedContent.formulas.map((f, i) => (
                    <div key={i} className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">{f.title}</span>
                        <span className="text-[9px] font-mono bg-purple-500/20 text-purple-600 px-1.5 py-0.2 rounded">Formula</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border font-mono font-bold text-purple-600 text-center text-xs">
                        {f.latex}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{f.explanation}</p>
                      <div className="text-[10px] text-muted-foreground font-mono">{f.variables}</div>
                    </div>
                  ))}

                  {/* Derivations */}
                  {currentParagraph.relatedContent.derivations.map((d, i) => (
                    <div key={i} className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">{d.title}</span>
                        <span className="text-[10px] font-mono font-bold text-indigo-600">{d.boardMarks} Marks</span>
                      </div>
                      <div className="space-y-1 pl-1">
                        {d.steps.map((st, sIdx) => (
                          <div key={sIdx} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                            <span className="font-mono text-indigo-600 font-bold">{sIdx + 1}.</span>
                            <span>{st}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Related LectureLab Video */}
                  {currentParagraph.relatedContent.lectureTitle && (
                    <div
                      onClick={() => setActiveTab('study')}
                      className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 hover:border-blue-500 cursor-pointer flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black uppercase text-blue-600 font-mono flex items-center gap-1">
                          <Video className="w-3.5 h-3.5" />
                          <span>Related LectureLab Video</span>
                        </span>
                        <span className="font-bold text-foreground text-xs block">{currentParagraph.relatedContent.lectureTitle}</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-blue-600 shrink-0" />
                    </div>
                  )}

                  {/* Related PYQs */}
                  {currentParagraph.relatedContent.pyqs.map((q, i) => (
                    <div key={i} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-purple-600">{q.year}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">Asked {q.frequencyCount} Times</span>
                      </div>
                      <p className="font-bold text-foreground">{q.question}</p>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-800 text-[11px] text-muted-foreground">
                        <strong className="text-foreground">Solution:</strong> {q.answerSummary}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: MEMORY BOOSTER */}
              {activeInspectorTab === 'memory' && (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 font-mono">
                      Cognitive Anchors & Mnemonics
                    </span>
                    <h4 className="font-extrabold text-sm text-foreground">
                      Permanent Long-Term Memory Tricks
                    </h4>
                  </div>

                  {/* Mnemonic */}
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 space-y-1">
                    <span className="text-[10px] font-black uppercase text-amber-600 font-mono">
                      Mnemonic Device
                    </span>
                    <div className="font-bold text-foreground text-xs">
                      {currentParagraph.memoryBooster.mnemonic}
                    </div>
                  </div>

                  {/* Memory Story */}
                  <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 space-y-1">
                    <span className="text-[10px] font-black uppercase text-purple-600 font-mono">
                      Mental Story Hook
                    </span>
                    <p className="text-foreground leading-relaxed">
                      {currentParagraph.memoryBooster.story}
                    </p>
                  </div>

                  {/* Visualization */}
                  <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 space-y-1">
                    <span className="text-[10px] font-black uppercase text-indigo-600 font-mono">
                      Spatial Visualization
                    </span>
                    <p className="text-foreground leading-relaxed">
                      {currentParagraph.memoryBooster.visualization}
                    </p>
                  </div>

                  {/* Song / Rhyme Idea */}
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 space-y-0.5">
                    <span className="text-[10px] font-black uppercase text-emerald-600 font-mono">
                      Rhyme / Audio Hook
                    </span>
                    <p className="text-foreground italic">
                      "{currentParagraph.memoryBooster.songIdea}"
                    </p>
                  </div>

                  {/* Quick Recall Points */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-muted-foreground font-mono">
                      Quick Recall Bullet Points:
                    </span>
                    {currentParagraph.memoryBooster.quickRecallPoints.map((pt, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border text-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: AUTO NOTES */}
              {activeInspectorTab === 'notes' && (
                <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 font-mono block">
                    Auto-Generated Topic Notes
                  </span>

                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border space-y-2">
                      <span className="text-[10px] font-black uppercase text-purple-600 font-mono block">
                        Short & Concise Notes:
                      </span>
                      <div className="space-y-1">
                        {currentTopic.autoNotes.shortNotes.map((n, i) => (
                          <div key={i} className="text-muted-foreground flex items-start gap-1.5">
                            <span className="text-purple-600 font-bold">•</span>
                            <span>{n}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border space-y-2">
                      <span className="text-[10px] font-black uppercase text-amber-600 font-mono block">
                        One-Page Cheatsheet Formats:
                      </span>
                      <div className="space-y-1">
                        {currentTopic.autoNotes.onePageNotes.map((n, i) => (
                          <div key={i} className="p-2 rounded-xl bg-white dark:bg-slate-800 font-mono text-[11px] text-foreground">
                            {n}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/30 space-y-2">
                      <span className="text-[10px] font-black uppercase text-rose-600 font-mono block">
                        Exam Revision Directives:
                      </span>
                      <div className="space-y-1">
                        {currentTopic.autoNotes.examRevisionNotes.map((n, i) => (
                          <div key={i} className="text-foreground font-semibold text-[11px]">
                            {n}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: AI PRACTICE QUIZ */}
              {activeInspectorTab === 'quiz' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 font-mono">
                        Instant NCERT Check
                      </span>
                      <h4 className="font-extrabold text-sm text-foreground">
                        Topic Practice Bank
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {currentTopic.practiceQuestions.length} Questions
                    </span>
                  </div>

                  <div className="space-y-4">
                    {currentTopic.practiceQuestions.map((q) => {
                      const selectedAns = selectedQuizAnswers[q.id];
                      const isRevealed = revealedQuizExplanations[q.id];

                      return (
                        <div
                          key={q.id}
                          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border space-y-3"
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="uppercase font-bold text-purple-600">{q.type.replace('_', ' ')}</span>
                            <span>{q.marks} Mark{q.marks > 1 ? 's' : ''}</span>
                          </div>

                          <p className="font-bold text-foreground leading-relaxed">{q.question}</p>

                          {/* Options if MCQ */}
                          {q.options && (
                            <div className="space-y-1.5">
                              {q.options.map((opt, optIdx) => (
                                <button
                                  key={optIdx}
                                  onClick={() =>
                                    setSelectedQuizAnswers((prev) => ({ ...prev, [q.id]: opt }))
                                  }
                                  className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer text-xs ${
                                    selectedAns === opt
                                      ? opt === q.correctAnswer
                                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 font-bold'
                                        : 'bg-rose-500/20 border-rose-500 text-rose-600 font-bold'
                                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/5 text-foreground hover:border-purple-400'
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Solution & Explanation Toggle */}
                          <div className="pt-2 border-t flex items-center justify-between">
                            <button
                              onClick={() =>
                                setRevealedQuizExplanations((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                              }
                              className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                            >
                              {isRevealed ? 'Hide Solution' : 'View Correct Answer & Steps'}
                            </button>
                          </div>

                          {isRevealed && (
                            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-1 text-xs">
                              <span className="text-[10px] font-black uppercase text-purple-600 font-mono block">
                                Correct Answer: {q.correctAnswer}
                              </span>
                              <p className="text-muted-foreground leading-relaxed">{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
