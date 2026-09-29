import { safeLocalStorage } from '@/utils/storage';
import { db } from '@/firebase/config';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import {
  NcertChapter,
  NcertSubject,
  NcertParagraph,
  NcertHighlight,
  NcertBookmark,
  NcertPersonalNote,
  UserChapterProgress,
  ReaderSettings,
  NcertIntelligenceState,
} from '@/types/ncert';
import { NCERT_CLASS_12_CHAPTERS } from './ncert-content-data';

const NCERT_STORAGE_KEY = 'rankify_ncert_intelligence_v1';

const DEFAULT_READER_SETTINGS: ReaderSettings = {
  fontSize: 'medium',
  theme: 'light',
  lineHeight: 'relaxed',
  voiceSpeed: 1.0,
  speechPitch: 1.0,
  autoScroll: false,
};

class NcertService {
  private memoryCache: NcertIntelligenceState | null = null;
  private subscribers: ((state: NcertIntelligenceState) => void)[] = [];
  private unsubscribeFirestore: (() => void) | null = null;
  private currentUserId: string = 'guest';

  // Audio speech synthesis instance
  private speechUtterance: SpeechSynthesisUtterance | null = null;
  private speakingParagraphId: string | null = null;

  constructor() {
    this.memoryCache = this.loadLocalCache();
  }

  public getChapters(): NcertChapter[] {
    return NCERT_CLASS_12_CHAPTERS;
  }

  public getChapterById(id: string): NcertChapter | undefined {
    return NCERT_CLASS_12_CHAPTERS.find((ch) => ch.id === id);
  }

  public getChaptersBySubject(subject: NcertSubject): NcertChapter[] {
    return NCERT_CLASS_12_CHAPTERS.filter((ch) => ch.subject === subject);
  }

  public getCachedState(): NcertIntelligenceState {
    if (!this.memoryCache) {
      this.memoryCache = this.getDefaultState();
    }
    return this.memoryCache;
  }

  public subscribe(callback: (state: NcertIntelligenceState) => void): () => void {
    this.subscribers.push(callback);
    if (this.memoryCache) {
      callback(this.memoryCache);
    }
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  private notify() {
    if (this.memoryCache) {
      this.subscribers.forEach((cb) => cb(this.memoryCache!));
    }
  }

  private getDefaultState(): NcertIntelligenceState {
    const progressMap: Record<string, UserChapterProgress> = {};
    NCERT_CLASS_12_CHAPTERS.forEach((ch, idx) => {
      progressMap[ch.id] = {
        chapterId: ch.id,
        readingMinutes: idx === 0 ? 32 : idx === 1 ? 24 : 10,
        completionPercent: idx === 0 ? 68 : idx === 1 ? 50 : 15,
        lastReadParagraphId: ch.topics[0]?.paragraphs[0]?.id || '',
        lastReadTimestamp: Date.now() - idx * 86400000,
        revisionsCount: idx === 0 ? 3 : 1,
        confidenceScore: idx === 0 ? 82 : idx === 1 ? 58 : 65,
        questionsSolvedCount: idx === 0 ? 12 : 5,
        highlightsCount: idx === 0 ? 4 : 2,
        bookmarksCount: idx === 0 ? 2 : 1,
        notesCount: idx === 0 ? 2 : 0,
      };
    });

    return {
      progressMap,
      highlights: {
        phys_current_electricity: [
          {
            id: 'hl_1',
            paragraphId: 'p_phys_3_1_1',
            color: 'yellow',
            textSnippet: 'Current is a scalar quantity even though it has direction',
            createdAt: Date.now() - 3600000,
          },
          {
            id: 'hl_2',
            paragraphId: 'p_phys_3_1_2',
            color: 'green',
            textSnippet: 'semiconductors and insulators, resistivity decreases exponentially with temperature',
            createdAt: Date.now() - 1800000,
          },
        ],
      },
      bookmarks: [
        {
          id: 'bm_1',
          paragraphId: 'p_phys_3_1_1',
          chapterId: 'phys_current_electricity',
          topicTitle: '3.1 Electric Current & Drift Velocity',
          title: 'Electric Current and Current Density Definition',
          createdAt: Date.now() - 7200000,
        },
      ],
      personalNotes: {
        phys_current_electricity: [
          {
            id: 'note_1',
            paragraphId: 'p_phys_3_1_1',
            chapterId: 'phys_current_electricity',
            noteText: 'Must remember: vector current density j = I/A = sigma * E! Always asked in 1-mark CBSE questions.',
            updatedAt: Date.now() - 3600000,
          },
        ],
      },
      readerSettings: DEFAULT_READER_SETTINGS,
      overallStats: {
        totalReadingTimeMinutes: 66,
        completedChaptersCount: 1,
        totalBookmarksCount: 1,
        totalHighlightsCount: 2,
        totalPersonalNotesCount: 1,
        averageConfidence: 68,
        revisionSessionsRun: 4,
      },
    };
  }

  private loadLocalCache(): NcertIntelligenceState | null {
    return safeLocalStorage.getItem<NcertIntelligenceState | null>(NCERT_STORAGE_KEY, null);
  }

  private saveLocalCache(state: NcertIntelligenceState) {
    this.memoryCache = state;
    safeLocalStorage.setItem(NCERT_STORAGE_KEY, state);
    this.notify();
  }

  public async init(userId: string): Promise<NcertIntelligenceState> {
    this.currentUserId = userId || 'guest';

    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
      this.unsubscribeFirestore = null;
    }

    if (!this.memoryCache) {
      this.memoryCache = this.getDefaultState();
      this.saveLocalCache(this.memoryCache);
    }

    if (this.currentUserId && this.currentUserId !== 'guest') {
      try {
        const docRef = doc(db, 'users', this.currentUserId, 'ncert_intelligence', 'current');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const remoteData = snap.data() as NcertIntelligenceState;
          if (remoteData) {
            this.memoryCache = { ...this.memoryCache, ...remoteData };
            this.saveLocalCache(this.memoryCache);
          }
        } else {
          await setDoc(docRef, this.memoryCache, { merge: true });
        }

        this.unsubscribeFirestore = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as NcertIntelligenceState;
            if (data) {
              this.memoryCache = data;
              safeLocalStorage.setItem(NCERT_STORAGE_KEY, data);
              this.notify();
            }
          }
        });
      } catch (err) {
        console.warn('NcertService Firestore sync warning:', err);
      }
    }

    return this.memoryCache;
  }

  // Record reading progress and time
  public async updateReadingProgress(
    chapterId: string,
    paragraphId: string,
    minutesSpent: number,
    completionPercentage: number
  ): Promise<void> {
    const state = this.getCachedState();
    const currentProgress = state.progressMap[chapterId] || {
      chapterId,
      readingMinutes: 0,
      completionPercent: 0,
      lastReadParagraphId: paragraphId,
      lastReadTimestamp: Date.now(),
      revisionsCount: 0,
      confidenceScore: 60,
      questionsSolvedCount: 0,
      highlightsCount: 0,
      bookmarksCount: 0,
      notesCount: 0,
    };

    const newReadingMinutes = currentProgress.readingMinutes + minutesSpent;
    const newCompletion = Math.max(currentProgress.completionPercent, completionPercentage);
    const newConfidence = Math.min(100, Math.round(50 + (newCompletion / 100) * 45));

    const updatedProgress: UserChapterProgress = {
      ...currentProgress,
      readingMinutes: newReadingMinutes,
      completionPercent: newCompletion,
      lastReadParagraphId: paragraphId,
      lastReadTimestamp: Date.now(),
      confidenceScore: newConfidence,
    };

    const newProgressMap = {
      ...state.progressMap,
      [chapterId]: updatedProgress,
    };

    const newOverallStats = {
      ...state.overallStats,
      totalReadingTimeMinutes: state.overallStats.totalReadingTimeMinutes + minutesSpent,
      completedChaptersCount: Object.values(newProgressMap).filter((p) => p.completionPercent >= 90).length,
      averageConfidence: Math.round(
        Object.values(newProgressMap).reduce((sum, p) => sum + p.confidenceScore, 0) /
          Math.max(1, Object.keys(newProgressMap).length)
      ),
    };

    const newState: NcertIntelligenceState = {
      ...state,
      progressMap: newProgressMap,
      overallStats: newOverallStats,
    };

    this.saveLocalCache(newState);
    await this.persistToFirebase(newState);
  }

  // Smart Highlights
  public async addHighlight(
    chapterId: string,
    paragraphId: string,
    color: 'yellow' | 'green' | 'pink' | 'blue' | 'purple',
    textSnippet: string,
    isUnderline: boolean = false
  ): Promise<NcertHighlight> {
    const state = this.getCachedState();
    const chapterHls = state.highlights[chapterId] || [];

    const newHl: NcertHighlight = {
      id: `hl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      paragraphId,
      color,
      isUnderline,
      textSnippet,
      createdAt: Date.now(),
    };

    const updatedChapterHls = [...chapterHls, newHl];
    const newHighlights = {
      ...state.highlights,
      [chapterId]: updatedChapterHls,
    };

    const newState: NcertIntelligenceState = {
      ...state,
      highlights: newHighlights,
      overallStats: {
        ...state.overallStats,
        totalHighlightsCount: state.overallStats.totalHighlightsCount + 1,
      },
    };

    this.saveLocalCache(newState);
    await this.persistToFirebase(newState);
    return newHl;
  }

  public async removeHighlight(chapterId: string, highlightId: string): Promise<void> {
    const state = this.getCachedState();
    const chapterHls = state.highlights[chapterId] || [];
    const updated = chapterHls.filter((h) => h.id !== highlightId);

    const newState: NcertIntelligenceState = {
      ...state,
      highlights: {
        ...state.highlights,
        [chapterId]: updated,
      },
      overallStats: {
        ...state.overallStats,
        totalHighlightsCount: Math.max(0, state.overallStats.totalHighlightsCount - 1),
      },
    };

    this.saveLocalCache(newState);
    await this.persistToFirebase(newState);
  }

  // Bookmarks
  public async toggleBookmark(
    chapterId: string,
    paragraphId: string,
    topicTitle: string,
    title: string
  ): Promise<boolean> {
    const state = this.getCachedState();
    const existingIndex = state.bookmarks.findIndex((b) => b.paragraphId === paragraphId);

    let updatedBookmarks: NcertBookmark[];
    let isNowBookmarked = false;

    if (existingIndex >= 0) {
      updatedBookmarks = state.bookmarks.filter((b) => b.paragraphId !== paragraphId);
      isNowBookmarked = false;
    } else {
      const newBm: NcertBookmark = {
        id: `bm_${Date.now()}`,
        paragraphId,
        chapterId,
        topicTitle,
        title,
        createdAt: Date.now(),
      };
      updatedBookmarks = [newBm, ...state.bookmarks];
      isNowBookmarked = true;
    }

    const newState: NcertIntelligenceState = {
      ...state,
      bookmarks: updatedBookmarks,
      overallStats: {
        ...state.overallStats,
        totalBookmarksCount: updatedBookmarks.length,
      },
    };

    this.saveLocalCache(newState);
    await this.persistToFirebase(newState);
    return isNowBookmarked;
  }

  // Personal Notes
  public async savePersonalNote(
    chapterId: string,
    paragraphId: string,
    noteText: string
  ): Promise<void> {
    const state = this.getCachedState();
    const chapterNotes = state.personalNotes[chapterId] || [];
    const existingIndex = chapterNotes.findIndex((n) => n.paragraphId === paragraphId);

    let updatedNotes: NcertPersonalNote[];
    if (existingIndex >= 0) {
      updatedNotes = chapterNotes.map((n) =>
        n.paragraphId === paragraphId ? { ...n, noteText, updatedAt: Date.now() } : n
      );
    } else {
      const newNote: NcertPersonalNote = {
        id: `note_${Date.now()}`,
        paragraphId,
        chapterId,
        noteText,
        updatedAt: Date.now(),
      };
      updatedNotes = [...chapterNotes, newNote];
    }

    const totalNotesCount = Object.values({ ...state.personalNotes, [chapterId]: updatedNotes }).reduce(
      (sum, list) => sum + list.length,
      0
    );

    const newState: NcertIntelligenceState = {
      ...state,
      personalNotes: {
        ...state.personalNotes,
        [chapterId]: updatedNotes,
      },
      overallStats: {
        ...state.overallStats,
        totalPersonalNotesCount: totalNotesCount,
      },
    };

    this.saveLocalCache(newState);
    await this.persistToFirebase(newState);
  }

  // Reader Settings
  public async updateReaderSettings(settings: Partial<ReaderSettings>): Promise<void> {
    const state = this.getCachedState();
    const updatedSettings = { ...state.readerSettings, ...settings };

    const newState: NcertIntelligenceState = {
      ...state,
      readerSettings: updatedSettings,
    };

    this.saveLocalCache(newState);
    await this.persistToFirebase(newState);
  }

  // Voice Mode (Web Speech API)
  public speakParagraph(paragraphId: string, text: string, rate: number = 1.0, onEnd?: () => void): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis API not supported in this browser environment');
      return;
    }

    window.speechSynthesis.cancel();

    this.speechUtterance = new SpeechSynthesisUtterance(text);
    this.speechUtterance.rate = rate;
    this.speechUtterance.pitch = 1.0;
    this.speakingParagraphId = paragraphId;

    this.speechUtterance.onend = () => {
      this.speakingParagraphId = null;
      if (onEnd) onEnd();
      this.notify();
    };

    this.speechUtterance.onerror = () => {
      this.speakingParagraphId = null;
      this.notify();
    };

    window.speechSynthesis.speak(this.speechUtterance);
    this.notify();
  }

  public pauseVoice(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      this.notify();
    }
  }

  public resumeVoice(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
      this.notify();
    }
  }

  public stopVoice(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.speakingParagraphId = null;
      this.notify();
    }
  }

  public getSpeakingParagraphId(): string | null {
    return this.speakingParagraphId;
  }

  // Search Entire NCERT
  public searchNcert(query: string): {
    chapterId: string;
    chapterTitle: string;
    subject: NcertSubject;
    topicTitle: string;
    paragraphId: string;
    snippet: string;
    matchType: 'keyword' | 'formula' | 'definition' | 'concept';
  }[] {
    if (!query || query.trim().length < 2) return [];

    const lowerQ = query.toLowerCase().trim();
    const results: {
      chapterId: string;
      chapterTitle: string;
      subject: NcertSubject;
      topicTitle: string;
      paragraphId: string;
      snippet: string;
      matchType: 'keyword' | 'formula' | 'definition' | 'concept';
    }[] = [];

    for (const chapter of NCERT_CLASS_12_CHAPTERS) {
      for (const topic of chapter.topics) {
        for (const p of topic.paragraphs) {
          // Check text
          if (p.text.toLowerCase().includes(lowerQ)) {
            results.push({
              chapterId: chapter.id,
              chapterTitle: chapter.title,
              subject: chapter.subject,
              topicTitle: topic.title,
              paragraphId: p.id,
              snippet: p.text.substring(0, 140) + '...',
              matchType: 'keyword',
            });
            continue;
          }

          // Check formulas
          const matchedFormula = p.relatedContent.formulas.find(
            (f) => f.title.toLowerCase().includes(lowerQ) || f.explanation.toLowerCase().includes(lowerQ)
          );
          if (matchedFormula) {
            results.push({
              chapterId: chapter.id,
              chapterTitle: chapter.title,
              subject: chapter.subject,
              topicTitle: topic.title,
              paragraphId: p.id,
              snippet: `${matchedFormula.title}: ${matchedFormula.latex}`,
              matchType: 'formula',
            });
            continue;
          }

          // Check difficult words / definitions
          const matchedDef = p.explanation.difficultWords.find(
            (w) => w.word.toLowerCase().includes(lowerQ) || w.meaning.toLowerCase().includes(lowerQ)
          );
          if (matchedDef) {
            results.push({
              chapterId: chapter.id,
              chapterTitle: chapter.title,
              subject: chapter.subject,
              topicTitle: topic.title,
              paragraphId: p.id,
              snippet: `${matchedDef.word}: ${matchedDef.meaning}`,
              matchType: 'definition',
            });
            continue;
          }

          // Check PYQs
          const matchedPyq = p.relatedContent.pyqs.find((q) => q.question.toLowerCase().includes(lowerQ));
          if (matchedPyq) {
            results.push({
              chapterId: chapter.id,
              chapterTitle: chapter.title,
              subject: chapter.subject,
              topicTitle: topic.title,
              paragraphId: p.id,
              snippet: `PYQ (${matchedPyq.year}): ${matchedPyq.question.substring(0, 120)}...`,
              matchType: 'concept',
            });
          }
        }
      }
    }

    return results.slice(0, 20);
  }

  // Admin Cohort Analytics
  public getCohortReadingAnalytics() {
    return {
      mostReadChapters: [
        { chapter: 'Current Electricity (Physics)', avgReadingMinutes: 54.2, studentsCount: 78, completionRate: 84 },
        { chapter: 'Electrochemistry (Chemistry)', avgReadingMinutes: 48.6, studentsCount: 72, completionRate: 76 },
        { chapter: 'Determinants & Matrices (Math)', avgReadingMinutes: 42.1, studentsCount: 69, completionRate: 88 },
      ],
      leastReadChapters: [
        { chapter: 'Wave Optics (Physics)', avgReadingMinutes: 18.2, studentsCount: 34, completionRate: 32 },
        { chapter: 'Aldehydes & Ketones (Chemistry)', avgReadingMinutes: 21.0, studentsCount: 38, completionRate: 39 },
        { chapter: 'Differential Equations (Math)', avgReadingMinutes: 22.4, studentsCount: 41, completionRate: 45 },
      ],
      averageSessionReadingTimeMinutes: 32.8,
      totalCohortHighlightsLogged: 1420,
      totalCohortBookmarksCreated: 680,
      audioReaderAdoptionPercent: 41,
    };
  }

  private async persistToFirebase(state: NcertIntelligenceState) {
    if (this.currentUserId && this.currentUserId !== 'guest') {
      try {
        const docRef = doc(db, 'users', this.currentUserId, 'ncert_intelligence', 'current');
        await setDoc(docRef, state, { merge: true });
      } catch (err) {
        console.warn('Failed to sync NCERT intelligence state to Firebase:', err);
      }
    }
  }
}

export const ncertService = new NcertService();
