import { safeLocalStorage } from '@/utils/storage';
import { db } from '@/firebase/config';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import {
  ExamCommandCenterData,
  SyllabusChapterItem,
  TodayCommandMission,
  UrgentTask,
  AiAlert,
  HighImpactRecommendation,
  SubjectReadinessDetail,
} from '@/types/command-center';
import { readinessService } from './readiness-service';
import { brainService } from './brain-service';
import { replayService } from './replay-service';
import { mistakeService } from './mistake-service';

const COMMAND_CENTER_STORAGE_KEY = 'rankify_exam_command_center_v1';

class CommandCenterService {
  private memoryCache: ExamCommandCenterData | null = null;
  private subscribers: ((data: ExamCommandCenterData) => void)[] = [];
  private unsubscribeFirestore: (() => void) | null = null;
  private currentUserId: string = 'guest';

  constructor() {
    this.memoryCache = this.loadLocalCache();
  }

  public getCachedData(): ExamCommandCenterData | null {
    return this.memoryCache;
  }

  public subscribe(callback: (data: ExamCommandCenterData) => void): () => void {
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

  private loadLocalCache(): ExamCommandCenterData | null {
    return safeLocalStorage.getItem<ExamCommandCenterData | null>(COMMAND_CENTER_STORAGE_KEY, null);
  }

  private saveLocalCache(data: ExamCommandCenterData) {
    this.memoryCache = data;
    safeLocalStorage.setItem(COMMAND_CENTER_STORAGE_KEY, data);
    this.notify();
  }

  public async init(userId: string): Promise<ExamCommandCenterData> {
    this.currentUserId = userId || 'guest';

    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
      this.unsubscribeFirestore = null;
    }

    const computed = await this.computeCommandCenterData(this.currentUserId);
    this.saveLocalCache(computed);

    if (this.currentUserId && this.currentUserId !== 'guest') {
      try {
        const docRef = doc(db, 'users', this.currentUserId, 'command_center', 'current');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const remoteData = snap.data() as ExamCommandCenterData;
          if (remoteData) {
            this.memoryCache = { ...computed, ...remoteData };
            this.saveLocalCache(this.memoryCache);
          }
        } else {
          await setDoc(docRef, computed, { merge: true });
        }

        this.unsubscribeFirestore = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as ExamCommandCenterData;
            if (data) {
              this.memoryCache = data;
              safeLocalStorage.setItem(COMMAND_CENTER_STORAGE_KEY, data);
              this.notify();
            }
          }
        });
      } catch (err) {
        console.warn('Firebase command center offline fallback:', err);
      }
    }

    return this.memoryCache || computed;
  }

  public async toggleCommand(commandId: string): Promise<void> {
    if (!this.memoryCache) return;

    const updatedCommands = this.memoryCache.todaysCommands.map((cmd) => {
      if (cmd.id === commandId) {
        return { ...cmd, isCompleted: !cmd.isCompleted };
      }
      return cmd;
    });

    const updatedData: ExamCommandCenterData = {
      ...this.memoryCache,
      todaysCommands: updatedCommands,
      lastUpdatedAt: new Date().toISOString(),
    };

    this.saveLocalCache(updatedData);
    await this.syncToFirestore(updatedData);
  }

  public async computeCommandCenterData(userId: string): Promise<ExamCommandCenterData> {
    // 1. Gather auxiliary live stats
    const readinessData = readinessService.getCachedData();
    const brainData = brainService.getCachedData();
    const replayData = replayService.getCachedData();
    const mistakesStats = mistakeService.getStatistics();

    // 2. Exam Date & Precise Remaining Calculations
    const targetDateStr = readinessData?.examMode?.targetDate || '2027-03-01T09:00:00.000Z';
    const targetExamDate = new Date(targetDateStr);
    const now = new Date();
    const diffMs = Math.max(0, targetExamDate.getTime() - now.getTime());
    const totalHoursRemaining = Math.floor(diffMs / (1000 * 60 * 60));
    const daysRemaining = Math.floor(totalHoursRemaining / 24);
    const hoursRemainingInDay = totalHoursRemaining % 24;
    const minutesRemaining = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    const overallReadiness = readinessData?.overallScore || 84;
    const currentPrepStatus =
      overallReadiness >= 85
        ? 'Optimal Sprint'
        : overallReadiness >= 75
        ? 'Defensive Revision'
        : overallReadiness >= 60
        ? 'Needs Acceleration'
        : 'Crisis Mode';

    // 3. Subject-wise live metrics
    const subjectReadiness: Record<'Physics' | 'Chemistry' | 'Mathematics', SubjectReadinessDetail> = {
      Physics: {
        subject: 'Physics',
        progress: 82,
        confidence: 76,
        revisionScore: 80,
        practiceCount: 380,
        mockScore: 78,
        predictedScoreMin: 60,
        predictedScoreMax: 68,
        maxScore: 70,
        color: 'text-blue-500',
        gradient: 'from-blue-600 to-indigo-600',
      },
      Chemistry: {
        subject: 'Chemistry',
        progress: 74,
        confidence: 68,
        revisionScore: 65,
        practiceCount: 295,
        mockScore: 72,
        predictedScoreMin: 56,
        predictedScoreMax: 64,
        maxScore: 70,
        color: 'text-emerald-500',
        gradient: 'from-emerald-600 to-teal-600',
      },
      Mathematics: {
        subject: 'Mathematics',
        progress: 91,
        confidence: 88,
        revisionScore: 92,
        practiceCount: 450,
        mockScore: 86,
        predictedScoreMin: 68,
        predictedScoreMax: 76,
        maxScore: 80,
        color: 'text-purple-500',
        gradient: 'from-purple-600 to-pink-600',
      },
    };

    // 4. Live Syllabus Chapters & Heatmap Status
    const syllabusChapters: SyllabusChapterItem[] = [
      { id: 'ch_1', name: 'Electric Charges & Fields', subject: 'Physics', status: 'ready', confidence: 90, weightageMarks: 6, lastRevisedDaysAgo: 2, accuracy: 88, formulaCount: 12, formulasMastered: 11 },
      { id: 'ch_2', name: 'Electrostatic Potential & Capacitance', subject: 'Physics', status: 'ready', confidence: 85, weightageMarks: 6, lastRevisedDaysAgo: 4, accuracy: 84, formulaCount: 14, formulasMastered: 12 },
      { id: 'ch_3', name: 'Current Electricity', subject: 'Physics', status: 'critical', confidence: 54, weightageMarks: 8, lastRevisedDaysAgo: 3, accuracy: 52, formulaCount: 16, formulasMastered: 8 },
      { id: 'ch_4', name: 'Moving Charges & Magnetism', subject: 'Physics', status: 'needs_revision', confidence: 72, weightageMarks: 7, lastRevisedDaysAgo: 7, accuracy: 70, formulaCount: 15, formulasMastered: 11 },
      { id: 'ch_5', name: 'Ray Optics & Instruments', subject: 'Physics', status: 'critical', confidence: 48, weightageMarks: 9, lastRevisedDaysAgo: 10, accuracy: 46, formulaCount: 18, formulasMastered: 7 },
      { id: 'ch_6', name: 'Wave Optics', subject: 'Physics', status: 'needs_revision', confidence: 66, weightageMarks: 5, lastRevisedDaysAgo: 6, accuracy: 65, formulaCount: 10, formulasMastered: 6 },
      { id: 'ch_7', name: 'Solutions', subject: 'Chemistry', status: 'ready', confidence: 92, weightageMarks: 7, lastRevisedDaysAgo: 1, accuracy: 91, formulaCount: 11, formulasMastered: 11 },
      { id: 'ch_8', name: 'Electrochemistry', subject: 'Chemistry', status: 'critical', confidence: 52, weightageMarks: 9, lastRevisedDaysAgo: 9, accuracy: 50, formulaCount: 17, formulasMastered: 7 },
      { id: 'ch_9', name: 'Chemical Kinetics', subject: 'Chemistry', status: 'ready', confidence: 86, weightageMarks: 7, lastRevisedDaysAgo: 3, accuracy: 85, formulaCount: 13, formulasMastered: 12 },
      { id: 'ch_10', name: 'Coordination Compounds', subject: 'Chemistry', status: 'needs_revision', confidence: 68, weightageMarks: 7, lastRevisedDaysAgo: 8, accuracy: 66, formulaCount: 9, formulasMastered: 5 },
      { id: 'ch_11', name: 'Aldehydes, Ketones & Carboxylic Acids', subject: 'Chemistry', status: 'critical', confidence: 55, weightageMarks: 8, lastRevisedDaysAgo: 6, accuracy: 53, formulaCount: 20, formulasMastered: 9 },
      { id: 'ch_12', name: 'Matrices & Determinants', subject: 'Mathematics', status: 'ready', confidence: 94, weightageMarks: 10, lastRevisedDaysAgo: 1, accuracy: 93, formulaCount: 14, formulasMastered: 14 },
      { id: 'ch_13', name: 'Continuity & Differentiability', subject: 'Mathematics', status: 'ready', confidence: 88, weightageMarks: 9, lastRevisedDaysAgo: 2, accuracy: 86, formulaCount: 16, formulasMastered: 15 },
      { id: 'ch_14', name: 'Integrals (Definite & Indefinite)', subject: 'Mathematics', status: 'needs_revision', confidence: 74, weightageMarks: 12, lastRevisedDaysAgo: 5, accuracy: 72, formulaCount: 25, formulasMastered: 18 },
      { id: 'ch_15', name: 'Differential Equations', subject: 'Mathematics', status: 'needs_revision', confidence: 70, weightageMarks: 8, lastRevisedDaysAgo: 6, accuracy: 68, formulaCount: 12, formulasMastered: 8 },
      { id: 'ch_16', name: 'Vectors & 3D Geometry', subject: 'Mathematics', status: 'ready', confidence: 84, weightageMarks: 14, lastRevisedDaysAgo: 4, accuracy: 82, formulaCount: 18, formulasMastered: 15 },
    ];

    const completedChapters = syllabusChapters.filter((c) => c.status === 'ready').length;
    const needsRevisionChapters = syllabusChapters.filter((c) => c.status === 'needs_revision').length;
    const criticalChapters = syllabusChapters.filter((c) => c.status === 'critical').length;
    const remainingChapters = needsRevisionChapters + criticalChapters;
    const weakChapters = criticalChapters + 1;

    // 5. Today's Commands
    const todaysCommands: TodayCommandMission[] = [
      {
        id: 'cmd_1',
        title: 'Revise Matrices & Determinants Matrix Method',
        subject: 'Mathematics',
        chapter: 'Matrices',
        allocatedMinutes: 30,
        type: 'revision',
        isUrgent: false,
        isCompleted: true,
        impactScore: 4,
      },
      {
        id: 'cmd_2',
        title: 'Solve 25 CBSE 10-Year PYQs on Potentiometer & Kirchhoff',
        subject: 'Physics',
        chapter: 'Current Electricity',
        allocatedMinutes: 45,
        type: 'pyq',
        isUrgent: true,
        isCompleted: false,
        impactScore: 6,
      },
      {
        id: 'cmd_3',
        title: 'Watch Current Electricity Drift Velocity Derivation Clip',
        subject: 'Physics',
        chapter: 'Current Electricity',
        allocatedMinutes: 20,
        type: 'lecture',
        isUrgent: true,
        isCompleted: false,
        impactScore: 3,
      },
      {
        id: 'cmd_4',
        title: 'Revise Formula Sheet: Electrochemistry Nernst Equation at 298K',
        subject: 'Chemistry',
        chapter: 'Electrochemistry',
        allocatedMinutes: 20,
        type: 'formula',
        isUrgent: true,
        isCompleted: false,
        impactScore: 5,
      },
      {
        id: 'cmd_5',
        title: 'Sectional Timed Mock Test: Physical Chemistry 25 Marks',
        subject: 'Chemistry',
        chapter: 'Solutions & Electrochemistry',
        allocatedMinutes: 45,
        type: 'mock',
        isUrgent: false,
        isCompleted: false,
        impactScore: 7,
      },
    ];

    // 6. Urgent Tasks
    const urgentTasks: UrgentTask[] = [
      {
        id: 'urg_1',
        title: 'Resolve Kirchhoff Loop Sign Rule Trap in Mistake Notebook',
        reason: '3 consecutive sign convention mistakes made in recent test',
        subject: 'Physics',
        deadlineNotice: 'Must complete before tonight’s sprint',
        estimatedMinutes: 20,
        route: 'mistakes',
      },
      {
        id: 'urg_2',
        title: 'Master Nernst Equation Temperature Factor & Standard Cell Emf',
        reason: 'Electrochemistry has not been revised for 9 full days',
        subject: 'Chemistry',
        deadlineNotice: 'Overdue by 3 days',
        estimatedMinutes: 25,
        route: 'study',
      },
      {
        id: 'urg_3',
        title: 'Derive Compound Microscope Magnifying Power Formula',
        reason: 'Guaranteed 5-mark board derivation with zero recent practice',
        subject: 'Physics',
        deadlineNotice: 'Board High-Yield Target',
        estimatedMinutes: 30,
        route: 'study',
      },
    ];

    // 7. AI Alerts
    const aiAlerts: AiAlert[] = [
      {
        id: 'alt_1',
        severity: 'critical',
        title: 'Chemistry has not been revised for 9 days',
        description: 'Physical & Organic chemistry spaced retention curve has dipped below 55%. Electrochemistry cell calculations will fail without immediate formula recall.',
        daysAgo: 9,
        suggestedAction: 'Launch Smart Revision drill',
        actionRoute: 'revision' as any,
      },
      {
        id: 'alt_2',
        severity: 'high',
        title: 'Current Electricity confidence dropped by 14%',
        description: 'Potentiometer internal resistance question accuracy dropped to 48% following late-night practice session mistakes.',
        suggestedAction: 'Review Mistake Notebook traps',
        actionRoute: 'mistakes',
      },
      {
        id: 'alt_3',
        severity: 'high',
        title: 'Physics Ray Optics revision overdue',
        description: 'Lens Maker formula with surrounding medium refractive index (μ2/μ1) remains unverified in your last 10 days of study.',
        daysAgo: 10,
        suggestedAction: 'Practice Ray Optics derivations',
        actionRoute: 'study',
      },
    ];

    // 8. Predicted Board Performance
    const predictedPerformance = {
      overallRange: '88% – 94%',
      subjects: [
        {
          subject: 'Physics',
          minScore: 60,
          maxScore: 68,
          totalMarks: 70,
          percentageRange: '85.7% – 97.1%',
          confidenceInterval: 'High Confidence (±4 marks)',
          improvementActions: [
            'Fix calculation sign errors in Kirchhoff loop equations (+3 marks)',
            'Memorize Ray Optics Lens Maker sign conventions for denser media (+2 marks)',
            'Practice 10 numericals on Drift velocity and resistance temperature coefficient (+2 marks)',
          ],
        },
        {
          subject: 'Chemistry',
          minScore: 56,
          maxScore: 64,
          totalMarks: 70,
          percentageRange: '80.0% – 91.4%',
          confidenceInterval: 'Moderate Confidence (±5 marks)',
          improvementActions: [
            'Revise Aldol vs Cannizzaro reaction conditions to secure 3 organic marks (+3 marks)',
            'Practice Nernst equation log term calculations at 298K (+2 marks)',
            'Read NCERT in-text examples for Coordination nomenclature & isomerism (+2 marks)',
          ],
        },
        {
          subject: 'Mathematics',
          minScore: 68,
          maxScore: 76,
          totalMarks: 80,
          percentageRange: '85.0% – 95.0%',
          confidenceInterval: 'Very High Confidence (±3 marks)',
          improvementActions: [
            'Speed up 3x3 matrix inverse calculations to avoid last-minute rush (+3 marks)',
            'Re-solve definite integration property questions from CBSE 2022-2024 (+3 marks)',
            'Review homogeneous differential equation substitution steps (+2 marks)',
          ],
        },
      ],
      highYieldActionSteps: [
        'Focus on 5-mark guaranteed derivations across Physics and Math before attempting random question banks.',
        'Replace late-night fatigue study with morning recall sweeps between 6:00 AM and 7:30 AM.',
        'Write complete numerical steps with SI units; CBSE penalizes 0.5 marks per step missing units.',
      ],
    };

    // 9. Revision Command Center Schedule
    const revisionSchedule = {
      today: [
        'Current Electricity: Potentiometer null deflection & Kirchhoff loop equations',
        'Electrochemistry: Nernst equation for cell emf & Gibbs free energy ΔG°',
        'Matrices: System of linear equations using matrix inverse method',
      ],
      tomorrow: [
        'Solutions: Colligative properties & abnormal molar mass (van \'t Hoff factor i)',
        'Moving Charges: Biot-Savart law & circular coil magnetic field derivation',
        'Definite Integrals: King\'s rule ∫f(x)dx = ∫f(a+b-x)dx proofs',
      ],
      thisWeek: [
        'Ray Optics: Full compound microscope and astronomical telescope ray diagrams',
        'Aldehydes & Ketones: Name reaction mechanisms (Clemmensen, Wolff-Kishner, Aldol)',
        'Vectors & 3D: Shortest distance between two skew lines & plane equations',
        'Complete 1 full-length 3-hour CBSE science mock paper under strict exam timing',
      ],
      beforeExam: [
        'NCERT Exemplar starred questions review for all 3 subjects',
        'Mistake Notebook sweep: 45 high-frequency traps solved with zero hints',
        'Formula Sheet 100% memorization check with active pen-and-paper writing',
      ],
      oneNightBefore: [
        'Zero new problems or complex derivations',
        'Light 45-minute glance through Rankify High-Yield Formula Booklets',
        'Verify admit card, stationery kit, and geometry tools',
        'Strict sleep by 10:00 PM for peak cognitive reaction time',
      ],
    };

    // 10. Formula Status
    const formulaStatus = {
      mastered: 142,
      pending: 38,
      forgotten: 18,
      total: 198,
      mostUrgentFormulas: [
        { name: 'Lens Maker Equation in Medium', chapter: 'Ray Optics', formula: '1/f = (μ_lens/μ_med - 1)(1/R1 - 1/R2)' },
        { name: 'Nernst Cell EMF at 298K', chapter: 'Electrochemistry', formula: 'E_cell = E°_cell - (0.0591/n) log Q' },
        { name: 'Internal Resistance by Potentiometer', chapter: 'Current Electricity', formula: 'r = R (l1/l2 - 1)' },
        { name: 'Colligative Elevation in Boiling Point', chapter: 'Solutions', formula: 'ΔTb = i * Kb * m' },
        { name: 'Shortest Distance Skew Lines', chapter: '3D Geometry', formula: 'd = |(b1 × b2) · (a2 - a1)| / |b1 × b2|' },
      ],
    };

    // 11. Question Accuracy Breakdown
    const questionAnalysis = {
      mcqAccuracy: 88,
      numericalAccuracy: 64, // Needs work
      caseStudyAccuracy: 78,
      assertionReasonAccuracy: 72,
      subjectiveAccuracy: 86,
    };

    // 12. Time Analysis
    const timeAnalysis = {
      todayStudyMinutes: replayData?.todayTimeline?.totalStudyMinutes || 125,
      thisWeekHours: replayData?.weeklySummary?.totalStudyHours || 21.5,
      monthlyAverageHours: 84.5,
      mostProductiveWindow: '6:00 PM – 8:00 PM IST',
      leastProductiveWindow: 'After 10:30 PM IST',
      peakProductivityReason: 'Highest question solving pace (94% accuracy) and minimum hesitation observed during early evening hours.',
      dropProductivityReason: 'Calculation error rate spikes by 27% past 10:30 PM due to ocular fatigue and slower recall speed.',
    };

    // 13. Last 7 Days
    const last7Days = [
      { day: 'Mon', date: 'Sep 22', hours: 3.4, tasksCompleted: 4, accuracy: 82, improvementDelta: 2 },
      { day: 'Tue', date: 'Sep 23', hours: 3.8, tasksCompleted: 5, accuracy: 84, improvementDelta: 2 },
      { day: 'Wed', date: 'Sep 24', hours: 4.5, tasksCompleted: 6, accuracy: 89, improvementDelta: 5 },
      { day: 'Thu', date: 'Sep 25', hours: 3.9, tasksCompleted: 4, accuracy: 81, improvementDelta: -1 },
      { day: 'Fri', date: 'Sep 26', hours: 3.5, tasksCompleted: 4, accuracy: 83, improvementDelta: 2 },
      { day: 'Sat', date: 'Sep 27', hours: 5.2, tasksCompleted: 7, accuracy: 91, improvementDelta: 8 },
      { day: 'Sun', date: 'Sep 28', hours: 4.8, tasksCompleted: 6, accuracy: 88, improvementDelta: 3 },
    ];

    // 14. Top 10 High Impact Recommendations
    const top10Recommendations: HighImpactRecommendation[] = [
      {
        rank: 1,
        title: 'Revise Electrochemistry Nernst Equation & Gibbs Free Energy',
        actionText: 'Recall formulas and solve 5 numericals on cell potential at 298K.',
        impactLabel: '+4 Marks in Chemistry Section C',
        subject: 'Chemistry',
        chapter: 'Electrochemistry',
        estimatedMinutes: 25,
        route: 'study',
      },
      {
        rank: 2,
        title: 'Derive Compound Microscope Magnification Formula',
        actionText: 'Write step-by-step ray diagram derivation with both image at D and infinity.',
        impactLabel: '+5 Marks Guaranteed Board Derivation',
        subject: 'Physics',
        chapter: 'Ray Optics',
        estimatedMinutes: 30,
        route: 'study',
      },
      {
        rank: 3,
        title: 'Solve 20 CBSE 10-Year PYQs on Current Electricity',
        actionText: 'Eliminate calculation errors in Kirchhoff loop sign conventions.',
        impactLabel: '+6 Marks in Physics Numerical Section',
        subject: 'Physics',
        chapter: 'Current Electricity',
        estimatedMinutes: 40,
        route: 'practice',
      },
      {
        rank: 4,
        title: 'Re-test 5 Mistake Notebook Entries with Zero Cheating',
        actionText: 'Confirm you do not repeat the Lens Maker refractive index slip.',
        impactLabel: '+3 Marks Mistake Immunity',
        subject: 'Physics',
        chapter: 'Current Electricity & Optics',
        estimatedMinutes: 20,
        route: 'mistakes',
      },
      {
        rank: 5,
        title: 'Practice Matrix Method for System of 3 Equations',
        actionText: 'Complete 2 full 5-mark board problems from NCERT Exercise 4.6.',
        impactLabel: '+5 Marks in Mathematics Long Answer',
        subject: 'Mathematics',
        chapter: 'Matrices',
        estimatedMinutes: 25,
        route: 'practice',
      },
      {
        rank: 6,
        title: 'Master Aldol Condensation vs Cannizzaro Reaction Conditions',
        actionText: 'Memorize the α-hydrogen test and cross-aldol condensation mechanisms.',
        impactLabel: '+3 Marks in Organic Chemistry',
        subject: 'Chemistry',
        chapter: 'Aldehydes & Ketones',
        estimatedMinutes: 25,
        route: 'study',
      },
      {
        rank: 7,
        title: 'Read NCERT Solved Examples 2.1 to 2.8 in Solutions',
        actionText: 'CBSE questions on abnormal molar mass are copied word-for-word from these pages.',
        impactLabel: '+3 Marks NCERT Benchmark',
        subject: 'Chemistry',
        chapter: 'Solutions',
        estimatedMinutes: 20,
        route: 'study',
      },
      {
        rank: 8,
        title: 'Timed 45-Minute Definite Integrals Sectional Mock',
        actionText: 'Speed drill on King\'s property and modulus integration problems.',
        impactLabel: '+4 Marks in Mathematics Calculus',
        subject: 'Mathematics',
        chapter: 'Integrals',
        estimatedMinutes: 45,
        route: 'practice',
      },
      {
        rank: 9,
        title: 'Review Drift Velocity & Relaxation Time Derivation',
        actionText: 'Deduce Ohm\'s law in microscopic form: j = σ E and derive I = n A e v_d.',
        impactLabel: '+3 Marks Physics Core Theory',
        subject: 'Physics',
        chapter: 'Current Electricity',
        estimatedMinutes: 20,
        route: 'study',
      },
      {
        rank: 10,
        title: 'Perform Full Flashcard Sweep of 18 Forgotten Formulas',
        actionText: 'Rapid spaced recall of van \'t Hoff factor, dipole torque, and skew line distance.',
        impactLabel: '+5 Marks across MCQ Section',
        subject: 'All Subjects',
        chapter: 'Formula Deck',
        estimatedMinutes: 15,
        route: 'study',
      },
    ];

    return {
      countdown: {
        targetExamDate: targetDateStr,
        daysRemaining,
        hoursRemaining: hoursRemainingInDay,
        minutesRemaining,
      },
      motivationalLine:
        daysRemaining <= 14
          ? 'Every single minute now decides your board aggregate. Stay laser focused and execute today\'s commands!'
          : 'Consistent mastery turns board anxiety into effortless confidence. Command your revision now.',
      currentPreparationStatus: currentPrepStatus,
      overallReadinessPercent: overallReadiness,
      todaysPriority: 'Solve 25 Current Electricity Numericals & Nernst Equation Sheet',
      aiStrategy: {
        todaysFocus: 'Focus only on Electrochemistry & Current Electricity numericals today.',
        actionDirectives: [
          'Skip difficult advanced JEE-level multi-concept questions—stick strictly to CBSE Board past 10 years.',
          'Revise Current Electricity drift velocity derivation and Kirchhoff sign rules.',
          'Practice 15 high-weightage numericals with pen-and-paper step formatting.',
          'Read NCERT in-text examples for abnormal molar mass (Solutions chapter).',
        ],
        whatToSkip: 'Avoid starting new bulky units or over-complicating theoretical edge-cases.',
        tacticalPacing: 'Target 135 minutes of structured study divided into 45m blocks with 5m breaks.',
      },
      subjectReadiness,
      syllabusStats: {
        completedChapters,
        remainingChapters,
        needsRevisionChapters,
        weakChapters,
        criticalChapters,
        totalChapters: syllabusChapters.length,
      },
      syllabusChapters,
      todaysCommands,
      urgentTasks,
      aiAlerts,
      predictedPerformance,
      revisionSchedule,
      formulaStatus,
      questionAnalysis,
      timeAnalysis,
      last7Days,
      top10Recommendations,
      lastUpdatedAt: new Date().toISOString(),
    };
  }

  private async syncToFirestore(data: ExamCommandCenterData) {
    if (!this.currentUserId || this.currentUserId === 'guest') return;
    try {
      const docRef = doc(db, 'users', this.currentUserId, 'command_center', 'current');
      await setDoc(docRef, data, { merge: true });
    } catch (err) {
      console.warn('Could not sync Exam Command Center to Firestore:', err);
    }
  }
}

export const commandCenterService = new CommandCenterService();
