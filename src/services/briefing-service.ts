import { safeLocalStorage } from '@/utils/storage';
import { db } from '@/firebase/config';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import {
  BriefingTone,
  BriefingPeriod,
  DailyMissionItem,
  EnergyPlanSlot,
  YesterdayRecap,
  EveningReportData,
  NightReflectionData,
  AiMemoryProfile,
  DailyBriefingData,
  BriefingNotificationRule,
  BriefingState,
  SampleStudentBriefing,
  AdminCustomBriefingRequest,
} from '@/types/briefing';
import { readinessService } from './readiness-service';
import { revisionService } from './revision-service';
import { mistakeService } from './mistake-service';
import { formulaService } from './formula-service';
import { replayService } from './replay-service';

const BRIEFING_STORAGE_KEY = 'rankify_daily_briefing_v1';

class BriefingService {
  private memoryCache: BriefingState | null = null;
  private subscribers: ((state: BriefingState) => void)[] = [];
  private unsubscribeFirestore: (() => void) | null = null;
  private currentUserId: string = 'guest';

  constructor() {
    this.memoryCache = this.loadLocalCache();
  }

  public getCachedState(): BriefingState {
    if (!this.memoryCache) {
      this.memoryCache = this.generateDefaultBriefing('Devgamerz', 'savage_friend');
    }
    return this.memoryCache;
  }

  public subscribe(callback: (state: BriefingState) => void): () => void {
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

  // Determine current day period
  public getCurrentPeriod(): BriefingPeriod {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'midday';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  // Generate dynamic AI message matching personality tone
  public generateAiMessage(
    tone: BriefingTone,
    streakDays: number,
    weakSubject: string,
    overdueChapter: string,
    readinessScore: number
  ): string {
    switch (tone) {
      case 'friendly_teacher':
        return `Good day! Small, steady progress today makes tomorrow's board paper so much easier. Let's tackle ${overdueChapter} together step-by-step; you are doing wonderfully.`;

      case 'strict_coach':
        return `Zero excuses today. ${overdueChapter} has been overdue for days while exam countdown is ticking. Complete your revision drill before touching any new material.`;

      case 'savage_friend':
        return `Your ${weakSubject} notes have been waiting longer than your unread phone notifications 😅. Give it 35 solid minutes today before ${overdueChapter} comes back to haunt your mock test!`;

      case 'motivational_mentor':
        return `You are on a ${streakDays}-day winning streak! Elite scorers protect their daily momentum at all costs. Today's missions will push your readiness to ${readinessScore + 3}%.`;

      case 'calm_guide':
        return `Take a calm, centered breath. Don't worry about the whole syllabus right now. One focused 45-minute derivation session today creates lasting mastery.`;

      default:
        return `Focus on high-yield ${overdueChapter} questions today to solidify your exam readiness score.`;
    }
  }

  public generateDefaultBriefing(studentName: string = 'Student', tone: BriefingTone = 'savage_friend'): BriefingState {
    const period = this.getCurrentPeriod();
    const todayStr = new Date().toISOString().split('T')[0];

    const readinessData = readinessService.getCachedData();
    const readinessScore = readinessData?.overallScore || 78;
    const examCountdownDays = readinessData?.examMode?.daysRemaining || 45;

    const overdueChapter = 'Electrochemistry (Nernst Calculations)';
    const weakSubject = 'Chemistry';
    const streakDays = 5;

    const greetingTitle =
      period === 'morning'
        ? `Good Morning, ${studentName} 👋`
        : period === 'midday'
        ? `Midday Check-In, ${studentName} ⚡`
        : period === 'evening'
        ? `Good Evening, ${studentName} 🎯`
        : `Night Reflection, ${studentName} 🌙`;

    const aiMessage = this.generateAiMessage(tone, streakDays, weakSubject, overdueChapter, readinessScore);

    const yesterdayRecap: YesterdayRecap = {
      studyMinutes: 80,
      completedTasksCount: 4,
      questionsSolved: 25,
      accuracyPercent: 84,
      subjectsBreakdown: [
        { subject: 'Physics', minutes: 55 },
        { subject: 'Mathematics', minutes: 25 },
      ],
      highlight: '✔ Solved 25 CBSE PYQs on Potentiometer & Kirchhoff loops with 84% accuracy',
    };

    const missions: DailyMissionItem[] = [
      {
        id: 'mis_1',
        title: 'Revise Electrochemistry Nernst Equation & ΔG° relations',
        subject: 'Chemistry',
        chapter: 'Electrochemistry',
        durationMinutes: 35,
        type: 'top_priority',
        isCompleted: false,
        impactScore: 5,
        actionRoute: 'revision',
      },
      {
        id: 'mis_2',
        title: 'Solve 15 CBSE Board Numericals on Wave Optics Fringe Width',
        subject: 'Physics',
        chapter: 'Wave Optics',
        durationMinutes: 45,
        type: 'second_priority',
        isCompleted: false,
        impactScore: 4,
        actionRoute: 'practice',
      },
      {
        id: 'mis_3',
        title: 'Quick 10-Minute Formula Intelligence Drift Velocity Drill',
        subject: 'Physics',
        chapter: 'Current Electricity',
        durationMinutes: 10,
        type: 'quick_win',
        isCompleted: true,
        impactScore: 2,
        actionRoute: 'formula',
      },
      {
        id: 'mis_4',
        title: 'Smart Spaced Recall: Matrices & Determinants Matrix Inversion',
        subject: 'Mathematics',
        chapter: 'Determinants',
        durationMinutes: 25,
        type: 'revision',
        isCompleted: false,
        impactScore: 3,
        actionRoute: 'revision',
      },
      {
        id: 'mis_5',
        title: 'Clear 3 Logged Traps from Mistake Notebook',
        subject: 'Chemistry',
        chapter: 'Solutions',
        durationMinutes: 20,
        type: 'practice',
        isCompleted: false,
        impactScore: 3,
        actionRoute: 'mistakes',
      },
    ];

    const energyPlan: EnergyPlanSlot[] = [
      {
        slot: 'morning',
        timeRange: '06:30 AM - 08:00 AM',
        recommendedActivity: 'Deep Concept Assimilation',
        energyLevel: 'Peak High',
        targetSubject: 'Physics',
        taskDescription: 'Wave Optics Huygens wave front construction & fringe proofs',
        studyDnaReason: 'Your Study DNA indicates 92% cognitive absorption before 08:30 AM.',
      },
      {
        slot: 'afternoon',
        timeRange: '02:00 PM - 04:00 PM',
        recommendedActivity: 'Active Numerical Solving & PYQ Drills',
        energyLevel: 'Moderate Focus',
        targetSubject: 'Mathematics',
        taskDescription: 'Solve 12 definite integral properties problems without looking at hints',
        studyDnaReason: 'Active problem solving prevents afternoon post-lunch cognitive fatigue.',
      },
      {
        slot: 'night',
        timeRange: '08:30 PM - 09:45 PM',
        recommendedActivity: 'Spaced Formula Recall & Mistake Sweep',
        energyLevel: 'Reflective / Light',
        targetSubject: 'Chemistry',
        taskDescription: 'Formula Intelligence sheet review & Mistake Notebook trapdoor review',
        studyDnaReason: 'Pre-sleep spaced retrieval enhances synaptic consolidation during sleep.',
      },
    ];

    const eveningReport: EveningReportData = {
      achievementSummary: 'Completed 3 out of 5 daily targets. Physics and Math on track; Chemistry requires evening push.',
      completedCount: 3,
      missedCount: 2,
      actualStudyMinutes: 70,
      targetStudyMinutes: 135,
      confidenceDelta: '+4.1% Overall Confidence Gain',
      tomorrowPriorityPreview: 'Electrochemistry Galvanic Cell EMF & Ray Optics Prism Derivations',
    };

    const notifications: BriefingNotificationRule[] = [
      {
        period: 'morning',
        timeLabel: '07:00 AM',
        title: 'Good Morning! Today’s Focus: Electrochemistry',
        body: 'Estimated time today: 1h 45m. Launch your morning wave optics derivation session.',
        isTriggered: true,
        priority: 'high',
      },
      {
        period: 'midday',
        timeLabel: '01:30 PM',
        title: 'Midday Pulse: 1 of 5 Missions Complete',
        body: 'Keep the streak alive! You have 15 numericals scheduled for your afternoon peak.',
        isTriggered: false,
        priority: 'medium',
      },
      {
        period: 'evening',
        timeLabel: '06:30 PM',
        title: 'Evening Report Ready',
        body: 'You completed 70 minutes so far. 1 quick formula win left before dinner!',
        isTriggered: false,
        priority: 'medium',
      },
      {
        period: 'night',
        timeLabel: '09:30 PM',
        title: 'Night Reflection Time 🌙',
        body: 'How was your focus today? Rate your session to help Rankify optimize tomorrow’s plan.',
        isTriggered: false,
        priority: 'low',
      },
    ];

    const memoryProfile: AiMemoryProfile = {
      preferredTone: tone,
      bestTiming: 'Morning 06:30 AM - 08:00 AM',
      weakAreas: ['Electrochemistry Nernst logs', 'Wave Optics derivations', 'Definite Integrals'],
      primaryGoal: '95%+ in Class 12 CBSE PCM',
      streakDays: 5,
      totalReflectionsLogged: 14,
      commonDifficulties: ['Algebraic calculation traps', 'Time management on 5-mark derivations'],
    };

    const currentBriefing: DailyBriefingData = {
      id: `brief_${todayStr}`,
      date: todayStr,
      period,
      studentName,
      greetingTitle,
      examCountdownDays,
      readinessScore,
      tone,
      aiMessage,
      todayFocusSubject: 'Chemistry',
      estimatedStudyTimeMinutes: 105,
      yesterdayRecap,
      missions,
      energyPlan,
      eveningReport,
    };

    return {
      currentBriefing,
      memoryProfile,
      reflectionHistory: [
        {
          id: 'ref_yday',
          date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          completedNotes: 'Completed Current Electricity drift velocity derivation and 25 PYQs.',
          difficultTopics: ['Potentiometer null deflection length ratio'],
          focusScore: 4,
          energyLevel: 4,
          mentalFatigue: 'low',
          notes: 'Morning session was exceptionally productive.',
          recordedAt: Date.now() - 86400000,
        },
      ],
      notifications,
      lastGeneratedTimestamp: Date.now(),
    };
  }

  private loadLocalCache(): BriefingState | null {
    return safeLocalStorage.getItem<BriefingState | null>(BRIEFING_STORAGE_KEY, null);
  }

  private saveLocalCache(state: BriefingState) {
    this.memoryCache = state;
    safeLocalStorage.setItem(BRIEFING_STORAGE_KEY, state);
    this.notify();
  }

  public async init(userId: string, studentName: string = 'Devgamerz'): Promise<BriefingState> {
    this.currentUserId = userId || 'guest';

    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
      this.unsubscribeFirestore = null;
    }

    if (!this.memoryCache) {
      this.memoryCache = this.generateDefaultBriefing(studentName);
      this.saveLocalCache(this.memoryCache);
    }

    if (this.currentUserId && this.currentUserId !== 'guest') {
      try {
        const docRef = doc(db, 'users', this.currentUserId, 'daily_briefing', 'current');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const remoteData = snap.data() as BriefingState;
          if (remoteData) {
            this.memoryCache = { ...this.memoryCache, ...remoteData };
            this.saveLocalCache(this.memoryCache);
          }
        } else {
          await setDoc(docRef, this.memoryCache, { merge: true });
        }

        this.unsubscribeFirestore = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as BriefingState;
            if (data) {
              this.memoryCache = data;
              safeLocalStorage.setItem(BRIEFING_STORAGE_KEY, data);
              this.notify();
            }
          }
        });
      } catch (err) {
        console.warn('BriefingService Firestore sync warning:', err);
      }
    }

    return this.memoryCache;
  }

  // Switch AI personality tone
  public async setPreferredTone(tone: BriefingTone): Promise<void> {
    const state = this.getCachedState();
    const briefing = state.currentBriefing;
    const newAiMessage = this.generateAiMessage(
      tone,
      state.memoryProfile.streakDays,
      briefing.todayFocusSubject,
      'Electrochemistry (Nernst Calculations)',
      briefing.readinessScore
    );

    const updatedBriefing: DailyBriefingData = {
      ...briefing,
      tone,
      aiMessage: newAiMessage,
    };

    const updatedProfile: AiMemoryProfile = {
      ...state.memoryProfile,
      preferredTone: tone,
    };

    const newState: BriefingState = {
      ...state,
      currentBriefing: updatedBriefing,
      memoryProfile: updatedProfile,
      lastGeneratedTimestamp: Date.now(),
    };

    this.saveLocalCache(newState);
    await this.persistToFirebase(newState);
  }

  // Toggle mission completion
  public async toggleMission(missionId: string): Promise<void> {
    const state = this.getCachedState();
    const updatedMissions = state.currentBriefing.missions.map((m) =>
      m.id === missionId ? { ...m, isCompleted: !m.isCompleted } : m
    );

    const completedCount = updatedMissions.filter((m) => m.isCompleted).length;
    const newState: BriefingState = {
      ...state,
      currentBriefing: {
        ...state.currentBriefing,
        missions: updatedMissions,
        eveningReport: state.currentBriefing.eveningReport
          ? {
              ...state.currentBriefing.eveningReport,
              completedCount,
              missedCount: updatedMissions.length - completedCount,
            }
          : undefined,
      },
    };

    this.saveLocalCache(newState);
    await this.persistToFirebase(newState);
  }

  // Save Night Reflection
  public async saveNightReflection(
    completedNotes: string,
    difficultTopics: string[],
    focusScore: number,
    energyLevel: number,
    mentalFatigue: 'low' | 'moderate' | 'high',
    notes: string
  ): Promise<NightReflectionData> {
    const state = this.getCachedState();
    const todayStr = new Date().toISOString().split('T')[0];

    const reflection: NightReflectionData = {
      id: `ref_${Date.now()}`,
      date: todayStr,
      completedNotes,
      difficultTopics,
      focusScore,
      energyLevel,
      mentalFatigue,
      notes,
      recordedAt: Date.now(),
    };

    const updatedHistory = [reflection, ...state.reflectionHistory];
    const newWeakAreas = Array.from(new Set([...state.memoryProfile.weakAreas, ...difficultTopics]));

    const updatedProfile: AiMemoryProfile = {
      ...state.memoryProfile,
      weakAreas: newWeakAreas,
      totalReflectionsLogged: state.memoryProfile.totalReflectionsLogged + 1,
    };

    const newState: BriefingState = {
      ...state,
      currentBriefing: {
        ...state.currentBriefing,
        nightReflection: reflection,
      },
      memoryProfile: updatedProfile,
      reflectionHistory: updatedHistory,
    };

    this.saveLocalCache(newState);
    await this.persistToFirebase(newState);
    return reflection;
  }

  // Cohort Analytics for Admin Dashboard
  public getCohortBriefingAnalytics() {
    return {
      averageBriefingOpeningRatePercent: 89.4,
      notificationEngagementByDaypart: [
        { period: 'Morning (07:00 AM)', openRate: 94.2 },
        { period: 'Midday (01:30 PM)', openRate: 72.8 },
        { period: 'Evening (06:30 PM)', openRate: 84.6 },
        { period: 'Night (09:30 PM)', openRate: 79.1 },
      ],
      mostCommonStudentDifficulties: [
        { difficulty: 'Numerical Calculation Speed & Log conversions', reportedCount: 68 },
        { difficulty: 'Derivation Step Memorization', reportedCount: 54 },
        { difficulty: 'Afternoon Focus Slump', reportedCount: 47 },
        { difficulty: 'Formula Confusion under Timed Conditions', reportedCount: 39 },
      ],
      tonePreferencesCohort: [
        { tone: 'Savage Friend', sharePercent: 38 },
        { tone: 'Motivational Mentor', sharePercent: 29 },
        { tone: 'Strict Coach', sharePercent: 18 },
        { tone: 'Friendly Teacher', sharePercent: 10 },
        { tone: 'Calm Guide', sharePercent: 5 },
      ],
    };
  }

  // Admin: Sample student briefings for live inspector
  public getSampleStudentBriefings(): SampleStudentBriefing[] {
    return [
      {
        id: 'stud_1',
        studentName: 'Aarav Sharma',
        tone: 'savage_friend',
        readinessScore: 84,
        streakDays: 12,
        todayFocus: 'Electrochemistry Nernst Calculations',
        targetExam: 'CBSE Class 12 PCM',
        aiMessage: 'Your Chemistry notes have been waiting longer than your phone notifications 😅. Give it 35 solid minutes today!',
        missionsTotal: 5,
        missionsCompleted: 3,
        lastOpenedPeriod: 'morning',
      },
      {
        id: 'stud_2',
        studentName: 'Priya Patel',
        tone: 'motivational_mentor',
        readinessScore: 91,
        streakDays: 19,
        todayFocus: 'Wave Optics Huygens Proofs & Fringe Width',
        targetExam: 'CBSE Class 12 PCM + JEE Main',
        aiMessage: 'You are on a 19-day winning streak! Elite scorers protect their daily momentum at all costs.',
        missionsTotal: 5,
        missionsCompleted: 4,
        lastOpenedPeriod: 'midday',
      },
      {
        id: 'stud_3',
        studentName: 'Rohan Verma',
        tone: 'strict_coach',
        readinessScore: 68,
        streakDays: 2,
        todayFocus: 'Definite Integrals & Invertible Matrices',
        targetExam: 'CBSE Class 12 PCM',
        aiMessage: 'Zero excuses today. Matrices & Calculus are overdue. Complete revision before starting anything new.',
        missionsTotal: 5,
        missionsCompleted: 1,
        lastOpenedPeriod: 'morning',
      },
      {
        id: 'stud_4',
        studentName: 'Ananya Iyer',
        tone: 'calm_guide',
        readinessScore: 88,
        streakDays: 9,
        todayFocus: 'Aldehydes & Ketones Nucleophilic Addition',
        targetExam: 'CBSE Class 12 PCM',
        aiMessage: 'Take a calm, centered breath. One focused 45-minute organic derivation session creates lasting mastery.',
        missionsTotal: 5,
        missionsCompleted: 3,
        lastOpenedPeriod: 'morning',
      },
    ];
  }

  // Admin: Send custom broadcast or targeted briefing to students
  public async adminSendCustomBriefing(req: AdminCustomBriefingRequest): Promise<void> {
    const state = this.getCachedState();
    const updatedBriefing: DailyBriefingData = {
      ...state.currentBriefing,
      greetingTitle: req.title || state.currentBriefing.greetingTitle,
      aiMessage: req.aiMessage,
      tone: req.tone,
      estimatedStudyTimeMinutes: req.estimatedMinutes || state.currentBriefing.estimatedStudyTimeMinutes,
    };

    const newState: BriefingState = {
      ...state,
      currentBriefing: updatedBriefing,
      memoryProfile: {
        ...state.memoryProfile,
        preferredTone: req.tone,
      },
    };

    this.saveLocalCache(newState);
    await this.persistToFirebase(newState);
  }

  // Admin: Override cohort default tone
  public async adminOverrideTone(newTone: BriefingTone): Promise<void> {
    await this.setPreferredTone(newTone);
  }

  private async persistToFirebase(state: BriefingState) {
    if (this.currentUserId && this.currentUserId !== 'guest') {
      try {
        const docRef = doc(db, 'users', this.currentUserId, 'daily_briefing', 'current');
        await setDoc(docRef, state, { merge: true });
      } catch (err) {
        console.warn('Failed to sync daily briefing to Firebase:', err);
      }
    }
  }
}

export const briefingService = new BriefingService();
