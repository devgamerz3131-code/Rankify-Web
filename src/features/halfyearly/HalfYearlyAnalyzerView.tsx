import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  Check,
  FileText,
  Sparkles,
  TrendingUp,
  Target,
  AlertTriangle,
  Calendar,
  Trophy,
  Play,
  ArrowRight,
  Lock,
  RefreshCw,
  PlusCircle,
  HelpCircle,
  Shield,
  Layers,
  Flame,
  Award,
  BookOpen,
  Compass,
  CheckCircle2,
  Clock,
  BarChart2,
  ListFilter,
  Zap,
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/hooks/use-auth';
import { useNavigation } from '@/contexts/NavigationContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/services/api-client';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// Exact built-in CBSE Class 12 PCM Half-Yearly syllabus (students NEVER enter manually)
export const HALF_YEARLY_SYLLABUS = {
  Physics: {
    maxMarks: 70,
    chapters: [
      'Electric charges and fields',
      'Electrostatic potential and capacitance',
      'Current electricity',
      'Moving Charges and magnetism',
      'Magnetism and matter',
      'Electromagnetic induction',
      'Alternating current',
      'Electromagnetic wave',
    ],
  },
  Chemistry: {
    maxMarks: 70,
    chapters: [
      'Solutions',
      'Electrochemistry',
      'Chemical kinetics',
      'D and f block',
      'Coordination compound',
    ],
  },
  Mathematics: {
    maxMarks: 80,
    chapters: [
      'Inverse trigonometric functions',
      'Matrices',
      'Determinants',
      'Continuity and differentiability',
      'Application of derivatives',
      'Linear programming problem',
    ],
  },
} as const;

export interface ChapterMasteryItem {
  chapterName: string;
  subject: 'Physics' | 'Chemistry' | 'Mathematics';
  mastery: number;
  category: 'Weak' | 'Moderate' | 'Strong';
  priority: 'Critical' | 'High' | 'Medium' | 'Normal';
  weightage: number;
}

export interface SubjectRankingItem {
  subject: string;
  score: number;
  maxMarks: number;
  percentage: number;
  rank: number;
  badge: string;
}

export interface HalfYearlyAnalysisData {
  percentage: number;
  performanceLevel: string;
  confidenceScore: number;
  strengths: string[];
  weaknesses: string[];
  subjectRanking: SubjectRankingItem[];
  chapterMastery: ChapterMasteryItem[];
  likelyWeakChapters: {
    chapterName: string;
    subject: string;
    reason: string;
    priority: 'Critical' | 'High' | 'Medium';
  }[];
  likelyStrongChapters: {
    chapterName: string;
    subject: string;
    reason: string;
  }[];
  boardPrediction: {
    currentScore: number;
    estimatedBoard: number;
    targetScore: number;
    potential: number;
    timeline: string;
  };
  personalizedTasks: {
    id: string;
    taskTitle: string;
    subjectName: string;
    chapterName: string;
    allocatedMinutes: number;
    priority: string;
    isCompleted: boolean;
    status: string;
  }[];
  futureComparisons: {
    examName: string;
    benchmarkScore: number;
    benchmarkPercent: number;
    status: 'Completed' | 'Upcoming';
    targetDate: string;
  }[];
}

const COMMON_MISTAKES = [
  'Concept not clear',
  'Formula forgotten',
  'Calculation mistake',
  'Time management',
  'Question misread',
  'Presentation',
  'Revision not done',
  'Silly mistakes',
];

export function computeChapterAnalysis(
  pScore: number,
  cScore: number,
  mScore: number,
  selectedMistakes: string[]
): ChapterMasteryItem[] {
  const pRatio = Math.min(1, Math.max(0, pScore / 70));
  const cRatio = Math.min(1, Math.max(0, cScore / 70));
  const mRatio = Math.min(1, Math.max(0, mScore / 80));

  const isCalcMistake = selectedMistakes.includes('Calculation mistake');
  const isFormulaForgot = selectedMistakes.includes('Formula forgotten');
  const isConceptUnclear = selectedMistakes.includes('Concept not clear');
  const isTimeMgmt = selectedMistakes.includes('Time management');

  const chapters: ChapterMasteryItem[] = [];

  // Physics Chapters (8 chapters)
  const physicsWeights = [8, 8, 10, 9, 5, 8, 8, 4];
  HALF_YEARLY_SYLLABUS.Physics.chapters.forEach((ch, idx) => {
    let factor = 1.0;
    if (ch === 'Current electricity' || ch === 'Alternating current') {
      factor = isCalcMistake ? 0.85 : 0.96;
    } else if (ch === 'Electric charges and fields' || ch === 'Electromagnetic induction') {
      factor = isFormulaForgot ? 0.88 : 1.02;
    } else if (ch === 'Moving Charges and magnetism' || ch === 'Magnetism and matter') {
      factor = isConceptUnclear ? 0.82 : 0.98;
    } else if (ch === 'Electromagnetic wave') {
      factor = 1.06;
    }
    const mastery = Math.round(Math.min(100, Math.max(12, pRatio * 100 * factor)));
    const category: 'Weak' | 'Moderate' | 'Strong' = mastery < 55 ? 'Weak' : mastery < 75 ? 'Moderate' : 'Strong';
    const priority: 'Critical' | 'High' | 'Medium' | 'Normal' =
      category === 'Weak' && (ch === 'Current electricity' || ch === 'Alternating current' || ch === 'Moving Charges and magnetism')
        ? 'Critical'
        : category === 'Weak'
        ? 'High'
        : category === 'Moderate'
        ? 'Medium'
        : 'Normal';

    chapters.push({
      chapterName: ch,
      subject: 'Physics',
      mastery,
      category,
      priority,
      weightage: physicsWeights[idx] || 8,
    });
  });

  // Chemistry Chapters (5 chapters)
  const chemWeights = [8, 9, 8, 7, 7];
  HALF_YEARLY_SYLLABUS.Chemistry.chapters.forEach((ch, idx) => {
    let factor = 1.0;
    if (ch === 'Electrochemistry' || ch === 'Chemical kinetics') {
      factor = isCalcMistake ? 0.84 : 0.95;
    } else if (ch === 'Coordination compound' || ch === 'D and f block') {
      factor = isConceptUnclear ? 0.82 : 1.01;
    } else if (ch === 'Solutions') {
      factor = 1.05;
    }
    const mastery = Math.round(Math.min(100, Math.max(12, cRatio * 100 * factor)));
    const category: 'Weak' | 'Moderate' | 'Strong' = mastery < 55 ? 'Weak' : mastery < 75 ? 'Moderate' : 'Strong';
    const priority: 'Critical' | 'High' | 'Medium' | 'Normal' =
      category === 'Weak' && (ch === 'Electrochemistry' || ch === 'Coordination compound')
        ? 'Critical'
        : category === 'Weak'
        ? 'High'
        : category === 'Moderate'
        ? 'Medium'
        : 'Normal';

    chapters.push({
      chapterName: ch,
      subject: 'Chemistry',
      mastery,
      category,
      priority,
      weightage: chemWeights[idx] || 7,
    });
  });

  // Mathematics Chapters (6 chapters)
  const mathWeights = [6, 8, 8, 12, 10, 5];
  HALF_YEARLY_SYLLABUS.Mathematics.chapters.forEach((ch, idx) => {
    let factor = 1.0;
    if (ch === 'Continuity and differentiability' || ch === 'Application of derivatives') {
      factor = isConceptUnclear ? 0.82 : 0.94;
    } else if (ch === 'Matrices' || ch === 'Determinants') {
      factor = isCalcMistake ? 0.88 : 1.05;
    } else if (ch === 'Linear programming problem') {
      factor = isTimeMgmt ? 0.85 : 1.08;
    }
    const mastery = Math.round(Math.min(100, Math.max(12, mRatio * 100 * factor)));
    const category: 'Weak' | 'Moderate' | 'Strong' = mastery < 55 ? 'Weak' : mastery < 75 ? 'Moderate' : 'Strong';
    const priority: 'Critical' | 'High' | 'Medium' | 'Normal' =
      category === 'Weak' && (ch === 'Application of derivatives' || ch === 'Continuity and differentiability')
        ? 'Critical'
        : category === 'Weak'
        ? 'High'
        : category === 'Moderate'
        ? 'Medium'
        : 'Normal';

    chapters.push({
      chapterName: ch,
      subject: 'Mathematics',
      mastery,
      category,
      priority,
      weightage: mathWeights[idx] || 8,
    });
  });

  return chapters;
}

export function computeSubjectRankings(pScore: number, cScore: number, mScore: number): SubjectRankingItem[] {
  const pPercent = Math.round((pScore / 70) * 100);
  const cPercent = Math.round((cScore / 70) * 100);
  const mPercent = Math.round((mScore / 80) * 100);

  const subjects = [
    { subject: 'Physics', score: pScore, maxMarks: 70, percentage: pPercent },
    { subject: 'Chemistry', score: cScore, maxMarks: 70, percentage: cPercent },
    { subject: 'Mathematics', score: mScore, maxMarks: 80, percentage: mPercent },
  ];

  subjects.sort((a, b) => b.percentage - a.percentage);

  const badges = ['🥇 Strongest Core', '🥈 Balanced', '🥉 Primary Recovery'];

  return subjects.map((s, idx) => ({
    ...s,
    rank: idx + 1,
    badge: badges[idx] || 'Core',
  }));
}

export const HalfYearlyAnalyzerView: React.FC = () => {
  const { user } = useAuth();
  const { setActiveTab } = useNavigation();

  // Obtained marks states (Max marks: Physics=70, Chemistry=70, Maths=80)
  const [physicsMarks, setPhysicsMarks] = useState<string>('');
  const [chemistryMarks, setChemistryMarks] = useState<string>('');
  const [mathsMarks, setMathsMarks] = useState<string>('');

  // Selected common mistakes
  const [selectedMistakes, setSelectedMistakes] = useState<string[]>([]);

  // File Upload states (optional marksheet upload)
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string; type: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // loading & analysis state
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<HalfYearlyAnalysisData | null>(null);
  const [recoveryApplied, setRecoveryApplied] = useState(false);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<'All' | 'Physics' | 'Chemistry' | 'Mathematics'>('All');

  // Persistence Key for local storage resilience
  const localCacheKey = `rankify_half_yearly_${user?.uid || 'guest'}`;

  // Restore analysis data from Firebase Firestore & Local Storage after refresh
  useEffect(() => {
    // 1. Immediately restore local storage cache for instant rendering
    try {
      const cached = localStorage.getItem(localCacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        if (data.physicsMarks !== undefined) setPhysicsMarks(String(data.physicsMarks));
        if (data.chemistryMarks !== undefined) setChemistryMarks(String(data.chemistryMarks));
        if (data.mathsMarks !== undefined) setMathsMarks(String(data.mathsMarks));
        if (data.selectedMistakes) setSelectedMistakes(data.selectedMistakes);
        if (data.uploadedFileName) {
          setUploadedFile({
            name: data.uploadedFileName,
            size: data.uploadedFileSize || '2.4 MB',
            type: data.uploadedFileType || 'image/png',
          });
        }
        if (data.analysis) {
          setAnalysisResult(data.analysis);
        }
        if (data.recoveryApplied) {
          setRecoveryApplied(true);
        }
      }
    } catch (e) {
      console.warn('Local restore note:', e);
    }

    // 2. Fetch from Firebase Firestore if user exists
    if (!user?.uid) return;

    const fetchAnalysis = async () => {
      try {
        const docRef = doc(db, 'users', user.uid, 'half_yearly_analysis', 'latest');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.physicsMarks !== undefined) setPhysicsMarks(String(data.physicsMarks));
          if (data.chemistryMarks !== undefined) setChemistryMarks(String(data.chemistryMarks));
          if (data.mathsMarks !== undefined) setMathsMarks(String(data.mathsMarks));
          if (data.selectedMistakes) setSelectedMistakes(data.selectedMistakes);
          if (data.uploadedFileName) {
            setUploadedFile({
              name: data.uploadedFileName,
              size: data.uploadedFileSize || '2.4 MB',
              type: data.uploadedFileType || 'image/png',
            });
          }
          if (data.analysis) {
            setAnalysisResult(data.analysis as HalfYearlyAnalysisData);
          }
          if (data.recoveryApplied) {
            setRecoveryApplied(true);
          }
        }
      } catch (err: any) {
        // Log gracefully without alarming UI
        console.warn('Firestore restore skipped or local data prioritized:', err?.message || err);
      }
    };

    fetchAnalysis();
  }, [user?.uid, localCacheKey]);

  const toggleMistake = (mistake: string) => {
    setSelectedMistakes((prev) =>
      prev.includes(mistake) ? prev.filter((m) => m !== mistake) : [...prev, mistake]
    );
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFile({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: file.type,
      });
      toast.success('Marksheet file attached successfully!');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: file.type,
      });
      toast.success('Marksheet file attached successfully!');
    }
  };

  const playCelebration = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleAnalyze = async () => {
    const p = parseFloat(physicsMarks);
    const c = parseFloat(chemistryMarks);
    const m = parseFloat(mathsMarks);

    if (isNaN(p) || p < 0 || p > 70) {
      toast.error('Please enter valid Physics marks (0-70)');
      return;
    }
    if (isNaN(c) || c < 0 || c > 70) {
      toast.error('Please enter valid Chemistry marks (0-70)');
      return;
    }
    if (isNaN(m) || m < 0 || m > 80) {
      toast.error('Please enter valid Mathematics marks (0-80)');
      return;
    }

    setIsLoading(true);
    setRecoveryApplied(false);

    try {
      // 1. Compute deterministic chapter mastery and subject rankings using built-in syllabus
      const chapterMastery = computeChapterAnalysis(p, c, m, selectedMistakes);
      const subjectRanking = computeSubjectRankings(p, c, m);

      // Future exam comparisons benchmarks
      const totalObtained = p + c + m;
      const totalMax = 220; // 70 + 70 + 80
      const currentPercent = Math.round((totalObtained / totalMax) * 100);

      const futureComparisons = [
        {
          examName: 'Unit Test 1 (Term 1 Start)',
          benchmarkScore: Math.round(totalMax * 0.62),
          benchmarkPercent: 62,
          status: 'Completed' as const,
          targetDate: 'July 2024',
        },
        {
          examName: 'Half-Yearly Exam (Current)',
          benchmarkScore: totalObtained,
          benchmarkPercent: currentPercent,
          status: 'Completed' as const,
          targetDate: 'September 2024',
        },
        {
          examName: 'Pre-Board Exam 1',
          benchmarkScore: Math.round(totalMax * Math.min(0.92, (currentPercent + 10) / 100)),
          benchmarkPercent: Math.min(92, currentPercent + 10),
          status: 'Upcoming' as const,
          targetDate: 'December 2024',
        },
        {
          examName: 'CBSE Final Board Exam',
          benchmarkScore: Math.round(totalMax * Math.min(0.96, (currentPercent + 18) / 100)),
          benchmarkPercent: Math.min(96, currentPercent + 18),
          status: 'Upcoming' as const,
          targetDate: 'March 2025',
        },
      ];

      // 2. Fetch AI-powered insights or fallback
      let result: HalfYearlyAnalysisData;
      try {
        const response = await apiClient<{ success: boolean; analysis: Partial<HalfYearlyAnalysisData> }>(
          '/api/analyze-halfyearly',
          {
            method: 'POST',
            body: JSON.stringify({
              physics: p,
              chemistry: c,
              maths: m,
              mistakes: selectedMistakes,
              marksheetUploaded: !!uploadedFile,
            }),
          }
        );

        if (response.data?.success && response.data.analysis) {
          const aiData = response.data.analysis;
          result = {
            percentage: aiData.percentage ?? currentPercent,
            performanceLevel:
              aiData.performanceLevel ??
              (currentPercent >= 85
                ? 'Outstanding'
                : currentPercent >= 70
                ? 'Very Good'
                : currentPercent >= 55
                ? 'Good'
                : currentPercent >= 40
                ? 'Needs Improvement'
                : 'Critical'),
            confidenceScore: aiData.confidenceScore ?? Math.min(96, Math.max(30, currentPercent + 5)),
            strengths: aiData.strengths || [
              `Consistent subject performance in ${subjectRanking[0]?.subject || 'PCM'}.`,
              'Strong grasp on core foundational chapters.',
            ],
            weaknesses: aiData.weaknesses || [
              `Accuracy drop in high-weightage numerical chapters in ${subjectRanking[2]?.subject || 'PCM'}.`,
              `Identified mistake patterns: ${selectedMistakes.join(', ') || 'Calculation and formula recall gaps'}.`,
            ],
            subjectRanking,
            chapterMastery,
            likelyWeakChapters:
              aiData.likelyWeakChapters && aiData.likelyWeakChapters.length > 0
                ? aiData.likelyWeakChapters
                : chapterMastery
                    .filter((ch) => ch.category === 'Weak')
                    .slice(0, 4)
                    .map((ch) => ({
                      chapterName: ch.chapterName,
                      subject: ch.subject,
                      reason: `${ch.chapterName} requires targeted numerical & theoretical revision.`,
                      priority: ch.priority === 'Critical' ? 'Critical' : 'High',
                    })),
            likelyStrongChapters:
              aiData.likelyStrongChapters && aiData.likelyStrongChapters.length > 0
                ? aiData.likelyStrongChapters
                : chapterMastery
                    .filter((ch) => ch.category === 'Strong')
                    .slice(0, 3)
                    .map((ch) => ({
                      chapterName: ch.chapterName,
                      subject: ch.subject,
                      reason: 'Solid foundation and high problem-solving accuracy.',
                    })),
            boardPrediction: aiData.boardPrediction || {
              currentScore: currentPercent,
              estimatedBoard: Math.min(98, currentPercent + 12),
              targetScore: 95,
              potential: Math.max(5, 95 - currentPercent),
              timeline: '4-Week Dynamic Board Recovery Sprint',
            },
            personalizedTasks:
              aiData.personalizedTasks && aiData.personalizedTasks.length > 0
                ? aiData.personalizedTasks
                : chapterMastery
                    .filter((ch) => ch.category === 'Weak')
                    .slice(0, 4)
                    .map((ch, idx) => ({
                      id: `task_rec_hy_${idx}`,
                      taskTitle: `Master ${ch.chapterName}: 15 High-Yield Board Questions`,
                      subjectName: ch.subject,
                      chapterName: ch.chapterName,
                      allocatedMinutes: 45,
                      priority: 'High',
                      isCompleted: false,
                      status: 'pending',
                    })),
            futureComparisons,
          };
        } else {
          throw new Error('Fallback to local calculation');
        }
      } catch {
        // High quality deterministic fallback
        const weakOnes = chapterMastery.filter((c) => c.category === 'Weak');
        const strongOnes = chapterMastery.filter((c) => c.category === 'Strong');

        result = {
          percentage: currentPercent,
          performanceLevel:
            currentPercent >= 85
              ? 'Outstanding'
              : currentPercent >= 70
              ? 'Very Good'
              : currentPercent >= 55
              ? 'Good'
              : currentPercent >= 40
              ? 'Needs Improvement'
              : 'Critical',
          confidenceScore: Math.min(98, Math.max(35, currentPercent + 4)),
          strengths: [
            `Top performing subject: ${subjectRanking[0]?.subject} (${subjectRanking[0]?.percentage}%).`,
            `Mastery demonstrated in: ${strongOnes.slice(0, 2).map((s) => s.chapterName).join(', ') || 'Core concepts'}.`,
          ],
          weaknesses: [
            `Recovery focus required in: ${subjectRanking[2]?.subject} (${subjectRanking[2]?.percentage}%).`,
            `Mistake areas: ${selectedMistakes.join(', ') || 'Formula recall & exam time-management'}.`,
          ],
          subjectRanking,
          chapterMastery,
          likelyWeakChapters: weakOnes.slice(0, 4).map((ch) => ({
            chapterName: ch.chapterName,
            subject: ch.subject,
            reason: `${ch.chapterName} shows accuracy gaps under timed conditions.`,
            priority: ch.priority === 'Critical' ? 'Critical' : 'High',
          })),
          likelyStrongChapters: strongOnes.slice(0, 3).map((ch) => ({
            chapterName: ch.chapterName,
            subject: ch.subject,
            reason: 'High conceptual grasp with consistent accuracy.',
          })),
          boardPrediction: {
            currentScore: currentPercent,
            estimatedBoard: Math.min(98, currentPercent + 14),
            targetScore: 95,
            potential: Math.max(5, 95 - currentPercent),
            timeline: '4-Week Spaced Recovery Sprint',
          },
          personalizedTasks: weakOnes.slice(0, 4).map((ch, idx) => ({
            id: `task_rec_hy_${idx}`,
            taskTitle: `Sprint Practice: 15 Board-Pattern Numericals in ${ch.chapterName}`,
            subjectName: ch.subject,
            chapterName: ch.chapterName,
            allocatedMinutes: 45,
            priority: 'High',
            isCompleted: false,
            status: 'pending',
          })),
          futureComparisons,
        };
      }

      setAnalysisResult(result);

      // Save payload locally for instantaneous restore
      const payload = {
        physicsMarks,
        chemistryMarks,
        mathsMarks,
        selectedMistakes,
        uploadedFileName: uploadedFile?.name || null,
        uploadedFileSize: uploadedFile?.size || null,
        uploadedFileType: uploadedFile?.type || null,
        analysis: result,
        recoveryApplied: false,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(localCacheKey, JSON.stringify(payload));

      // Save to Firebase Firestore safely with deployed rules
      if (user?.uid) {
        try {
          await setDoc(doc(db, 'users', user.uid, 'half_yearly_analysis', 'latest'), payload, { merge: true });
        } catch (fbErr: any) {
          console.warn('Firestore auto-save notice:', fbErr?.message || fbErr);
          // Data is already safely saved in local storage
        }
      }

      toast.success('Half-Yearly Performance Analysis completed!');
      playCelebration();
    } catch (err: any) {
      toast.error(err.message || 'An error occurred during analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyRecoveryPlan = async () => {
    if (!analysisResult) return;

    setIsLoading(true);
    try {
      // 1. Store in local state and local storage immediately
      setRecoveryApplied(true);

      const cached = localStorage.getItem(localCacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.recoveryApplied = true;
        localStorage.setItem(localCacheKey, JSON.stringify(parsed));
      }

      // 2. Also inject tasks into local daily targets cache
      const existingTargets = JSON.parse(localStorage.getItem(`rankify_daily_targets_${user?.uid || 'guest'}`) || '[]');
      const newTargets = [...existingTargets, ...analysisResult.personalizedTasks];
      localStorage.setItem(`rankify_daily_targets_${user?.uid || 'guest'}`, JSON.stringify(newTargets));

      // 3. Persist to Firestore safely
      if (user?.uid) {
        try {
          // Chapter Progress
          for (const ch of analysisResult.likelyWeakChapters) {
            const cleanName = ch.chapterName.toLowerCase().replace(/[^a-z0-9]/g, '_');
            const progressRef = doc(db, 'users', user.uid, 'chapter_progress', `progress_hy_${cleanName}`);
            await setDoc(
              progressRef,
              {
                id: `progress_hy_${cleanName}`,
                chapterName: ch.chapterName,
                subjectName: ch.subject,
                status: 'Need Revision',
                confidence: Math.round(analysisResult.confidenceScore * 0.7),
                lastStudied: new Date().toISOString().split('T')[0],
                completionPercentage: 55,
                updatedAt: new Date().toISOString(),
              },
              { merge: true }
            );
          }

          // Daily targets
          for (const task of analysisResult.personalizedTasks) {
            const targetRef = doc(db, 'users', user.uid, 'daily_targets', task.id);
            await setDoc(targetRef, {
              id: task.id,
              date: new Date().toISOString().split('T')[0],
              chapterName: task.chapterName,
              subjectName: task.subjectName,
              taskTitle: task.taskTitle,
              allocatedMinutes: task.allocatedMinutes,
              isCompleted: false,
              priority: task.priority,
              status: 'pending',
              updatedAt: new Date().toISOString(),
            });
          }

          // Study statistics
          const statsRef = doc(db, 'users', user.uid, 'study_statistics', 'latest');
          await setDoc(
            statsRef,
            {
              userId: user.uid,
              accuracyRate: Math.round(analysisResult.percentage),
              lastActiveDate: new Date().toISOString().split('T')[0],
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );

          // Update latest half-yearly record
          await setDoc(
            doc(db, 'users', user.uid, 'half_yearly_analysis', 'latest'),
            {
              recoveryApplied: true,
            },
            { merge: true }
          );
        } catch (fsErr: any) {
          console.warn('Firestore sync notice:', fsErr?.message || fsErr);
        }
      }

      toast.success("Awesome! Recovery tasks applied to Today's Tasks and Study Planner!");
      playCelebration();
    } catch (err: any) {
      toast.error('Failed to apply recovery plan: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = analysisResult
    ? [
        {
          name: 'Physics',
          score: parseFloat(physicsMarks) || 0,
          max: 70,
          percentage: Math.round(((parseFloat(physicsMarks) || 0) / 70) * 100),
        },
        {
          name: 'Chemistry',
          score: parseFloat(chemistryMarks) || 0,
          max: 70,
          percentage: Math.round(((parseFloat(chemistryMarks) || 0) / 70) * 100),
        },
        {
          name: 'Maths',
          score: parseFloat(mathsMarks) || 0,
          max: 80,
          percentage: Math.round(((parseFloat(mathsMarks) || 0) / 80) * 100),
        },
      ]
    : [];

  const filteredChapters = analysisResult
    ? selectedSubjectFilter === 'All'
      ? analysisResult.chapterMastery
      : analysisResult.chapterMastery.filter((c) => c.subject === selectedSubjectFilter)
    : [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 select-none animate-fadeIn">
      {/* Header and Branding */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold border border-purple-500/20">
            <Trophy className="w-3.5 h-3.5 text-purple-500" />
            <span>AI Cockpit • CBSE Class 12 Science (PCM)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            <span>Half-Yearly Performance Analyzer</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Automatic syllabus recognition for Physics (70M), Chemistry (70M), and Mathematics (80M).
            Simply enter your obtained marks — Rankify AI diagnoses chapter mastery, flags mistake patterns, and orchestrates your personalized board recovery sprint.
          </p>
        </div>

        {analysisResult && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAnalysisResult(null);
              setPhysicsMarks('');
              setChemistryMarks('');
              setMathsMarks('');
              setSelectedMistakes([]);
              setUploadedFile(null);
              localStorage.removeItem(localCacheKey);
            }}
            className="rounded-xl text-xs font-bold gap-1 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Analyzer</span>
          </Button>
        )}
      </div>

      {/* Built-in Syllabus Notice Pill */}
      <div className="bg-purple-500/5 dark:bg-purple-950/20 border border-purple-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">Built-in CBSE Class 12 PCM Half-Yearly Syllabus Pre-Loaded</h4>
            <p className="text-[11px] text-muted-foreground">
              Physics (8 chapters, 70M) • Chemistry (5 chapters, 70M) • Mathematics (6 chapters, 80M) — Total 220 Marks
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-mono">
            <Check className="w-3 h-3" />
            <span>Auto-Configured</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Input area */}
        <div className={`space-y-6 ${analysisResult ? 'lg:col-span-4' : 'lg:col-span-12 max-w-3xl mx-auto w-full'}`}>
          <Card className="p-5 sm:p-6 bg-card border border-border rounded-2xl shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Enter Obtained Marks</h3>
                <p className="text-[11px] text-muted-foreground">Only your marks are required. Max marks are pre-set.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Physics */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center justify-between">
                    <span>Physics</span>
                    <span className="text-[10px] text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded">Max 70</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="70"
                      value={physicsMarks}
                      onChange={(e) => setPhysicsMarks(e.target.value)}
                      placeholder="e.g. 54"
                      disabled={isLoading}
                      className="w-full h-11 px-3 pr-10 text-sm font-semibold rounded-xl bg-slate-50 dark:bg-slate-900 border border-border focus:border-purple-500/50 focus:outline-hidden transition-all text-foreground"
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <Lock className="w-3.5 h-3.5 text-muted-foreground/60" />
                    </div>
                  </div>
                </div>

                {/* Chemistry */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center justify-between">
                    <span>Chemistry</span>
                    <span className="text-[10px] text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded">Max 70</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="70"
                      value={chemistryMarks}
                      onChange={(e) => setChemistryMarks(e.target.value)}
                      placeholder="e.g. 58"
                      disabled={isLoading}
                      className="w-full h-11 px-3 pr-10 text-sm font-semibold rounded-xl bg-slate-50 dark:bg-slate-900 border border-border focus:border-purple-500/50 focus:outline-hidden transition-all text-foreground"
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <Lock className="w-3.5 h-3.5 text-muted-foreground/60" />
                    </div>
                  </div>
                </div>

                {/* Mathematics */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center justify-between">
                    <span>Mathematics</span>
                    <span className="text-[10px] text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded">Max 80</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="80"
                      value={mathsMarks}
                      onChange={(e) => setMathsMarks(e.target.value)}
                      placeholder="e.g. 68"
                      disabled={isLoading}
                      className="w-full h-11 px-3 pr-10 text-sm font-semibold rounded-xl bg-slate-50 dark:bg-slate-900 border border-border focus:border-purple-500/50 focus:outline-hidden transition-all text-foreground"
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <Lock className="w-3.5 h-3.5 text-muted-foreground/60" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Marksheet image / Screenshot */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Upload Marksheet / Result Screenshot</span>
                  <span className="text-[10px] text-muted-foreground font-mono">(Optional)</span>
                </label>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-purple-500 bg-purple-500/5'
                      : uploadedFile
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : 'border-border hover:border-purple-500/40 bg-slate-50/50 dark:bg-slate-900/30'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {uploadedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="text-left overflow-hidden">
                        <p className="text-xs font-bold text-foreground truncate max-w-[200px]">
                          {uploadedFile.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{uploadedFile.size}</p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full ml-auto">
                        Attached
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-2 space-y-1.5">
                      <UploadCloud className="w-5 h-5 text-muted-foreground" />
                      <p className="text-xs font-semibold text-foreground">
                        Drop marksheet image or PDF here, or <span className="text-purple-600 dark:text-purple-400">browse</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">PNG, JPG, PDF up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Mistake Analysis Checklist */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span>Tick Common Mistakes Encountered</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {selectedMistakes.length} selected
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Rankify AI factors these flags into chapter priority and active recovery task generation.
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {COMMON_MISTAKES.map((mistake) => {
                    const isChecked = selectedMistakes.includes(mistake);
                    return (
                      <button
                        key={mistake}
                        type="button"
                        onClick={() => toggleMistake(mistake)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between text-left transition-all border ${
                          isChecked
                            ? 'bg-purple-600/10 border-purple-500/40 text-purple-700 dark:text-purple-300 font-bold'
                            : 'bg-card border-border hover:bg-muted/40 text-muted-foreground'
                        }`}
                      >
                        <span className="truncate pr-1">{mistake}</span>
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${
                            isChecked
                              ? 'bg-purple-600 border-purple-600 text-white'
                              : 'border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Button */}
              <Button
                variant="primary"
                size="md"
                onClick={handleAnalyze}
                disabled={isLoading}
                className="w-full rounded-xl text-xs font-extrabold gap-1.5 pt-2.5 pb-2.5 shadow-md shadow-purple-500/15"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>{isLoading ? 'Computing Recovery Intelligence...' : 'Analyze Half-Yearly Performance'}</span>
              </Button>
            </div>
          </Card>
        </div>

        {/* Dashboard Analysis Output Area */}
        <div className={`lg:col-span-8 space-y-6 ${!analysisResult ? 'hidden' : 'block'}`}>
          {analysisResult && (
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                {/* 1. KEY SCORES OVERVIEW CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Obtained Percentage */}
                  <Card className="p-5 bg-card border border-border rounded-2xl flex items-center justify-between gap-4 shadow-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
                        <span>Half-Yearly Score</span>
                      </span>
                      <div className="text-3xl font-black text-foreground font-mono">
                        {analysisResult.percentage}%
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                          analysisResult.percentage >= 85
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : analysisResult.percentage >= 65
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-rose-500/10 text-rose-600'
                        }`}
                      >
                        {analysisResult.performanceLevel}
                      </span>
                    </div>

                    <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-100 dark:text-slate-800"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-purple-600 dark:text-purple-400"
                          strokeWidth="3.5"
                          strokeDasharray={`${analysisResult.percentage}, 100`}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute text-xs font-black text-foreground font-mono">
                        {Math.round(analysisResult.percentage)}%
                      </div>
                    </div>
                  </Card>

                  {/* Confidence Score */}
                  <Card className="p-5 bg-card border border-border rounded-2xl flex items-center justify-between gap-4 shadow-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>AI Confidence Score</span>
                      </span>
                      <div className="text-3xl font-black text-foreground font-mono">
                        {analysisResult.confidenceScore}%
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        Syllabus depth & precision estimate
                      </p>
                    </div>

                    <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-100 dark:text-slate-800"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-amber-500 dark:text-amber-400"
                          strokeWidth="3.5"
                          strokeDasharray={`${analysisResult.confidenceScore}, 100`}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute text-xs font-black text-foreground font-mono">
                        {analysisResult.confidenceScore}%
                      </div>
                    </div>
                  </Card>

                  {/* Board Predictor Score */}
                  <Card className="p-5 bg-card border border-border rounded-2xl flex items-center justify-between gap-4 shadow-xs bg-gradient-to-br from-purple-950/20 to-indigo-950/20 border-purple-500/20">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 tracking-wider flex items-center gap-1 font-mono">
                        <Award className="w-3.5 h-3.5" />
                        <span>Predicted Board Score</span>
                      </span>
                      <div className="text-3xl font-black text-foreground font-mono flex items-baseline gap-1">
                        <span>{analysisResult.boardPrediction.estimatedBoard}%</span>
                        <span className="text-xs text-emerald-500 font-bold">
                          +{analysisResult.boardPrediction.potential}%
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Target Goal: {analysisResult.boardPrediction.targetScore}%
                      </p>
                    </div>
                  </Card>
                </div>

                {/* 2. SUBJECT RANKINGS CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {analysisResult.subjectRanking.map((sub) => (
                    <Card key={sub.subject} className="p-4 bg-card border border-border rounded-2xl shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">{sub.subject}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-mono">
                          {sub.badge}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <div className="text-2xl font-black text-foreground font-mono">
                          {sub.score}{' '}
                          <span className="text-xs font-normal text-muted-foreground">/ {sub.maxMarks}</span>
                        </div>
                        <div className="text-sm font-bold text-purple-600 dark:text-purple-400 font-mono">
                          {sub.percentage}%
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${sub.percentage}%` }}
                        />
                      </div>
                    </Card>
                  ))}
                </div>

                {/* 3. VISUAL CHARTS & GRAPHS SECTION */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Subject Score Comparison Bar Graph */}
                  <Card className="p-5 sm:p-6 bg-card border border-border rounded-2xl shadow-xs space-y-4">
                    <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      <span>Subject Marks Comparison (%)</span>
                    </h3>

                    <div className="h-52 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                          <XAxis dataKey="name" stroke="rgba(150,150,150,0.5)" fontSize={11} tickLine={false} />
                          <YAxis domain={[0, 100]} stroke="rgba(150,150,150,0.5)" fontSize={11} tickLine={false} />
                          <Tooltip
                            contentStyle={{
                              background: '#1e1b4b',
                              border: '1px solid rgba(139, 92, 246, 0.2)',
                              borderRadius: '12px',
                              fontSize: '11px',
                              color: '#fff',
                            }}
                          />
                          <Bar dataKey="percentage" radius={[8, 8, 0, 0]} barSize={40}>
                            {chartData.map((entry, index) => {
                              const colors = ['#8b5cf6', '#3b82f6', '#10b981'];
                              return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  {/* Future Exam Progression Tracker */}
                  <Card className="p-5 sm:p-6 bg-card border border-border rounded-2xl shadow-xs space-y-4">
                    <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                      <Compass className="w-4 h-4 text-indigo-500" />
                      <span>Exam Score Progression & Roadmap</span>
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Track and project your trajectory from Unit Tests through Half-Yearly to Board Exams.
                    </p>

                    <div className="space-y-3 pt-1">
                      {analysisResult.futureComparisons.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-900/30 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                                item.status === 'Completed'
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : 'bg-purple-500/10 text-purple-600'
                              }`}
                            >
                              {item.status === 'Completed' ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : (
                                <Clock className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-foreground text-xs">{item.examName}</p>
                              <p className="text-[10px] text-muted-foreground">{item.targetDate}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-black font-mono text-xs text-foreground block">
                              {item.benchmarkPercent}%
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {item.benchmarkScore}/220M
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* 4. CHAPTER ANALYSIS & SYLLABUS MASTERY HEATMAP */}
                <Card className="p-5 sm:p-6 bg-card border border-border rounded-2xl shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-3">
                    <div>
                      <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                        <Flame className="w-4 h-4 text-rose-500" />
                        <span>Half-Yearly Chapter Mastery Analysis (19 Chapters)</span>
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Built-in CBSE Class 12 PCM syllabus mastery breakdown computed from obtained marks and mistakes.
                      </p>
                    </div>

                    {/* Filter tabs */}
                    <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-xl">
                      {(['All', 'Physics', 'Chemistry', 'Mathematics'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setSelectedSubjectFilter(tab)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            selectedSubjectFilter === tab
                              ? 'bg-card text-foreground shadow-xs'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                    {filteredChapters.map((ch, idx) => {
                      const isWeak = ch.category === 'Weak';
                      const isModerate = ch.category === 'Moderate';
                      const isStrong = ch.category === 'Strong';

                      return (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-xl border transition-all ${
                            isWeak
                              ? 'bg-rose-500/5 border-rose-500/25 hover:border-rose-500/50'
                              : isModerate
                              ? 'bg-amber-500/5 border-amber-500/25 hover:border-amber-500/50'
                              : 'bg-emerald-500/5 border-emerald-500/25 hover:border-emerald-500/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 block font-mono">
                                {ch.subject}
                              </span>
                              <h4 className="text-xs font-black text-foreground mt-0.5 line-clamp-1">
                                {ch.chapterName}
                              </h4>
                            </div>

                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md font-mono shrink-0 ${
                                ch.priority === 'Critical'
                                  ? 'bg-rose-600 text-white'
                                  : isWeak
                                  ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                                  : isModerate
                                  ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                              }`}
                            >
                              {ch.priority === 'Critical' ? 'Critical' : ch.category}
                            </span>
                          </div>

                          <div className="mt-3 flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground font-mono text-[10px]">
                              Weight: ~{ch.weightage}M
                            </span>
                            <span className="font-extrabold font-mono text-foreground">{ch.mastery}%</span>
                          </div>

                          <div className="w-full h-1 bg-muted rounded-full overflow-hidden mt-1.5">
                            <div
                              className={`h-full rounded-full ${
                                isWeak ? 'bg-rose-500' : isModerate ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${ch.mastery}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* 5. DIAGNOSED WEAK CHAPTERS LIST */}
                <Card className="p-5 sm:p-6 bg-card border border-border rounded-2xl shadow-xs space-y-4">
                  <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span>Likely Weak Half-Yearly Chapters & Action Plans</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysisResult.likelyWeakChapters.map((wc, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/40 space-y-1.5 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-foreground">{wc.chapterName}</span>
                            <span
                              className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                                wc.priority === 'Critical'
                                  ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                                  : 'bg-orange-500/10 text-orange-600 border border-orange-500/20'
                              }`}
                            >
                              {wc.priority} Priority
                            </span>
                          </div>
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block mt-0.5">
                            {wc.subject}
                          </span>
                          <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{wc.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* 6. PERSONALIZED SPRINT TASKS RECOVERY CONTAINER */}
                <Card className="p-5 sm:p-6 bg-card border border-border rounded-2xl shadow-xs space-y-4 bg-gradient-to-br from-slate-900 via-purple-950/10 to-slate-950 border-purple-500/25">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
                        <span>Rankify AI Dynamic Board Recovery Plan</span>
                      </h3>
                      <p className="text-xs text-muted-foreground max-w-xl">
                        A 4-week active recall & numerical problem sprint. Apply this plan to add these tasks straight into Today's Tasks and Study Planner.
                      </p>
                    </div>

                    <Button
                      variant={recoveryApplied ? 'outline' : 'primary'}
                      size="sm"
                      onClick={handleApplyRecoveryPlan}
                      disabled={isLoading || recoveryApplied}
                      className="rounded-xl text-xs font-black gap-1.5 cursor-pointer shrink-0"
                    >
                      {recoveryApplied ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-500" />
                          <span>Recovery Plan Active!</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-white" />
                          <span>Inject Plan Into Study Roadmap</span>
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    {analysisResult.personalizedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-900/60 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-extrabold text-foreground">{task.taskTitle}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {task.subjectName} • {task.chapterName} • {task.allocatedMinutes} Mins
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 font-mono bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                          {task.priority} Priority
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};
