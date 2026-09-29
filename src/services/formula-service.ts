import { safeLocalStorage } from '@/utils/storage';
import { db } from '@/firebase/config';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import {
  FormulaItem,
  FormulaSubject,
  FormulaMasteryLevel,
  UserFormulaTelemetry,
  FormulaIntelligenceStats,
  FormulaIntelligenceState,
} from '@/types/formula';
import { FORMULA_LIBRARY_DATA } from './formula-data';
import { mistakeService } from './mistake-service';

const FORMULA_STORAGE_KEY = 'rankify_formula_intelligence_v1';

class FormulaService {
  private memoryCache: FormulaIntelligenceState | null = null;
  private subscribers: ((state: FormulaIntelligenceState) => void)[] = [];
  private unsubscribeFirestore: (() => void) | null = null;
  private currentUserId: string = 'guest';

  constructor() {
    this.memoryCache = this.loadLocalCache();
  }

  public getFormulas(): FormulaItem[] {
    return FORMULA_LIBRARY_DATA;
  }

  public getFormulaById(id: string): FormulaItem | undefined {
    return FORMULA_LIBRARY_DATA.find((f) => f.id === id);
  }

  public getFormulasBySubject(subject: FormulaSubject): FormulaItem[] {
    return FORMULA_LIBRARY_DATA.filter((f) => f.subject === subject);
  }

  public getCachedState(): FormulaIntelligenceState {
    if (!this.memoryCache) {
      this.memoryCache = this.getDefaultState();
    }
    return this.memoryCache;
  }

  public subscribe(callback: (state: FormulaIntelligenceState) => void): () => void {
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

  private getDefaultState(): FormulaIntelligenceState {
    const telemetry: Record<string, UserFormulaTelemetry> = {};
    const today = new Date().toISOString().split('T')[0];

    FORMULA_LIBRARY_DATA.forEach((f, idx) => {
      let mastery: FormulaMasteryLevel = 'practiced';
      let confidence = 70;
      let isWeak = false;

      if (idx === 0) {
        mastery = 'mastered';
        confidence = 94;
      } else if (idx === 1) {
        mastery = 'learning';
        confidence = 52;
        isWeak = true;
      } else if (idx === 2) {
        mastery = 'strong';
        confidence = 86;
      } else if (idx === 3) {
        mastery = 'learning';
        confidence = 48;
        isWeak = true;
      }

      // Next revision scheduled
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + (isWeak ? 1 : 4));

      telemetry[f.id] = {
        formulaId: f.id,
        masteryLevel: mastery,
        confidenceScore: confidence,
        timesPracticed: idx === 0 ? 8 : idx === 1 ? 3 : 5,
        timesCorrect: idx === 0 ? 7 : idx === 1 ? 1 : 4,
        timesIncorrect: idx === 0 ? 1 : idx === 1 ? 2 : 1,
        lastRevisedTimestamp: Date.now() - idx * 86400000,
        nextRevisionDate: nextDate.toISOString().split('T')[0],
        isWeak,
        isBookmarked: idx === 1,
      };
    });

    const stats = this.computeStats(telemetry);

    return {
      telemetry,
      stats,
      lastUpdatedTimestamp: Date.now(),
    };
  }

  private computeStats(telemetry: Record<string, UserFormulaTelemetry>): FormulaIntelligenceStats {
    const list = Object.values(telemetry);
    const total = FORMULA_LIBRARY_DATA.length;
    const mastered = list.filter((t) => t.masteryLevel === 'mastered').length;
    const strong = list.filter((t) => t.masteryLevel === 'strong').length;
    const practiced = list.filter((t) => t.masteryLevel === 'practiced').length;
    const learning = list.filter((t) => t.masteryLevel === 'learning').length;
    const notLearned = total - (mastered + strong + practiced + learning);
    const weak = list.filter((t) => t.isWeak).length;

    const todayStr = new Date().toISOString().split('T')[0];
    const dueToday = list.filter((t) => t.nextRevisionDate <= todayStr).length;

    const avgConf =
      list.length > 0
        ? Math.round(list.reduce((sum, t) => sum + t.confidenceScore, 0) / list.length)
        : 70;

    const overallMastery = total > 0 ? Math.round(((mastered + strong * 0.75 + practiced * 0.5) / total) * 100) : 60;

    return {
      totalFormulas: total,
      masteredCount: mastered,
      strongCount: strong,
      practicedCount: practiced,
      learningCount: learning,
      notLearnedCount: Math.max(0, notLearned),
      weakCount: weak,
      overallMasteryPercent: overallMastery,
      averageConfidence: avgConf,
      dueForRevisionToday: Math.max(1, dueToday),
      mostForgottenFormulaName: 'Nernst Equation for Cell EMF',
    };
  }

  private loadLocalCache(): FormulaIntelligenceState | null {
    return safeLocalStorage.getItem<FormulaIntelligenceState | null>(FORMULA_STORAGE_KEY, null);
  }

  private saveLocalCache(state: FormulaIntelligenceState) {
    this.memoryCache = state;
    safeLocalStorage.setItem(FORMULA_STORAGE_KEY, state);
    this.notify();
  }

  public async init(userId: string): Promise<FormulaIntelligenceState> {
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
        const docRef = doc(db, 'users', this.currentUserId, 'formula_intelligence', 'current');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const remoteData = snap.data() as FormulaIntelligenceState;
          if (remoteData) {
            this.memoryCache = { ...this.memoryCache, ...remoteData };
            this.saveLocalCache(this.memoryCache);
          }
        } else {
          await setDoc(docRef, this.memoryCache, { merge: true });
        }

        this.unsubscribeFirestore = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as FormulaIntelligenceState;
            if (data) {
              this.memoryCache = data;
              safeLocalStorage.setItem(FORMULA_STORAGE_KEY, data);
              this.notify();
            }
          }
        });
      } catch (err) {
        console.warn('FormulaService Firestore sync warning:', err);
      }
    }

    return this.memoryCache;
  }

  // Update formula mastery and confidence after practice or review
  public async recordPracticeAttempt(formulaId: string, isCorrect: boolean): Promise<void> {
    const state = this.getCachedState();
    const current = state.telemetry[formulaId] || {
      formulaId,
      masteryLevel: 'learning',
      confidenceScore: 50,
      timesPracticed: 0,
      timesCorrect: 0,
      timesIncorrect: 0,
      lastRevisedTimestamp: Date.now(),
      nextRevisionDate: new Date().toISOString().split('T')[0],
      isWeak: false,
      isBookmarked: false,
    };

    const newPracticed = current.timesPracticed + 1;
    const newCorrect = current.timesCorrect + (isCorrect ? 1 : 0);
    const newIncorrect = current.timesIncorrect + (isCorrect ? 0 : 1);
    const accuracy = Math.round((newCorrect / newPracticed) * 100);

    let newMastery: FormulaMasteryLevel = current.masteryLevel;
    let newConfidence = current.confidenceScore;
    let isWeak = current.isWeak;

    if (isCorrect) {
      newConfidence = Math.min(100, current.confidenceScore + 12);
      if (newPracticed >= 4 && accuracy >= 85) {
        newMastery = 'mastered';
        isWeak = false;
      } else if (newPracticed >= 2 && accuracy >= 70) {
        newMastery = 'strong';
        isWeak = false;
      } else {
        newMastery = 'practiced';
      }
    } else {
      newConfidence = Math.max(25, current.confidenceScore - 15);
      isWeak = true;
      newMastery = 'learning';

      // Automatically log to Mistake Notebook
      try {
        const formulaObj = this.getFormulaById(formulaId);
        if (formulaObj) {
          await mistakeService.saveMistake({
            subject: formulaObj.subject,
            chapter: formulaObj.chapter,
            topic: formulaObj.topic,
            question: `Formula Application Trap: ${formulaObj.name} (${formulaObj.latex})`,
            studentAnswer: 'Incorrect formula substitution or sign convention',
            correctAnswer: formulaObj.textDisplay,
            explanation: `${formulaObj.simpleExplanation} | Key condition: ${formulaObj.conditions[0] || 'Check validity bounds'}`,
            mistakeType: 'Formula Error',
            importance: 'High',
            source: 'Formula Intelligence Practice',
          });
        }
      } catch (err) {
        console.warn('Auto mistake logging notice:', err);
      }
    }

    // Schedule next spaced revision
    const nextDate = new Date();
    const offsetDays = isCorrect ? (newMastery === 'mastered' ? 14 : 7) : 1;
    nextDate.setDate(nextDate.getDate() + offsetDays);

    const updatedTelemetry: UserFormulaTelemetry = {
      ...current,
      masteryLevel: newMastery,
      confidenceScore: newConfidence,
      timesPracticed: newPracticed,
      timesCorrect: newCorrect,
      timesIncorrect: newIncorrect,
      lastRevisedTimestamp: Date.now(),
      nextRevisionDate: nextDate.toISOString().split('T')[0],
      isWeak,
    };

    const newTelemetryMap = {
      ...state.telemetry,
      [formulaId]: updatedTelemetry,
    };

    const newStats = this.computeStats(newTelemetryMap);
    const newState: FormulaIntelligenceState = {
      ...state,
      telemetry: newTelemetryMap,
      stats: newStats,
      lastUpdatedTimestamp: Date.now(),
    };

    this.saveLocalCache(newState);
    await this.persistToFirebase(newState);
  }

  public async toggleBookmark(formulaId: string): Promise<boolean> {
    const state = this.getCachedState();
    const current = state.telemetry[formulaId] || {
      formulaId,
      masteryLevel: 'learning',
      confidenceScore: 50,
      timesPracticed: 0,
      timesCorrect: 0,
      timesIncorrect: 0,
      lastRevisedTimestamp: Date.now(),
      nextRevisionDate: new Date().toISOString().split('T')[0],
      isWeak: false,
      isBookmarked: false,
    };

    const isNow = !current.isBookmarked;
    const updated: UserFormulaTelemetry = {
      ...current,
      isBookmarked: isNow,
    };

    const newTelemetry = {
      ...state.telemetry,
      [formulaId]: updated,
    };

    const newState: FormulaIntelligenceState = {
      ...state,
      telemetry: newTelemetry,
      lastUpdatedTimestamp: Date.now(),
    };

    this.saveLocalCache(newState);
    await this.persistToFirebase(newState);
    return isNow;
  }

  // Search formulas by name, symbol, chapter, topic, or keyword
  public searchFormulas(query: string): FormulaItem[] {
    if (!query || query.trim().length === 0) return FORMULA_LIBRARY_DATA;
    const q = query.toLowerCase().trim();

    return FORMULA_LIBRARY_DATA.filter((f) => {
      return (
        f.name.toLowerCase().includes(q) ||
        f.chapter.toLowerCase().includes(q) ||
        f.topic.toLowerCase().includes(q) ||
        f.textDisplay.toLowerCase().includes(q) ||
        f.variables.some((v) => v.name.toLowerCase().includes(q) || v.symbol.toLowerCase().includes(q))
      );
    });
  }

  // Quick Revision Sheets
  public getFiveMinuteRevision(): { subject: FormulaSubject; items: { name: string; latex: string; tip: string }[] }[] {
    return [
      {
        subject: 'Physics',
        items: [
          { name: 'Drift Velocity Current', latex: 'I = n · e · A · vd', tip: 'vd = eEτ/m; Area is in denominator for constant I' },
          { name: 'Lens Maker Formula', latex: '1/f = (μ2/μ1 - 1)(1/R1 - 1/R2)', tip: 'Cartesian: biconvex has R1 > 0 and R2 < 0' },
        ],
      },
      {
        subject: 'Chemistry',
        items: [
          { name: 'Nernst Equation at 298K', latex: 'Ecell = E°cell - (0.0591/n) log10 Q', tip: 'At dead equilibrium, Ecell = 0, Q = Kc' },
        ],
      },
      {
        subject: 'Mathematics',
        items: [
          { name: 'Matrix Inversion', latex: 'A⁻¹ = (1/|A|) adj(A)', tip: 'adj A is the TRANSPOSE of cofactor matrix' },
        ],
      },
    ];
  }

  // Cohort Analytics for Admin Dashboard
  public getCohortFormulaAnalytics() {
    return {
      mostForgottenFormulas: [
        { formulaName: 'Nernst Equation (Stoichiometric Powers)', forgetRate: 46, subject: 'Chemistry' },
        { formulaName: 'Lens Maker (Medium Immersion μ2/μ1)', forgetRate: 41, subject: 'Physics' },
        { formulaName: 'Matrix Inversion Adjoint Transpose', forgetRate: 34, subject: 'Mathematics' },
      ],
      mostRevisedChapters: [
        { chapter: 'Electrochemistry (Chemistry)', revisionCount: 420 },
        { chapter: 'Current Electricity (Physics)', revisionCount: 390 },
        { chapter: 'Determinants (Mathematics)', revisionCount: 360 },
      ],
      averageCohortMasteryPercent: 74,
      totalPracticeCalculationsLogged: 2840,
    };
  }

  private async persistToFirebase(state: FormulaIntelligenceState) {
    if (this.currentUserId && this.currentUserId !== 'guest') {
      try {
        const docRef = doc(db, 'users', this.currentUserId, 'formula_intelligence', 'current');
        await setDoc(docRef, state, { merge: true });
      } catch (err) {
        console.warn('Failed to sync formula intelligence to Firebase:', err);
      }
    }
  }
}

export const formulaService = new FormulaService();
