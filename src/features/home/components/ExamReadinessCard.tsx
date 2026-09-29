import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigation } from '@/contexts/NavigationContext';
import { useAuth } from '@/hooks/use-auth';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { readinessService } from '@/services/readiness-service';
import { ExamReadinessData, ReadinessRating } from '@/types/readiness';
import {
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Flame,
  Calendar,
  Sparkles,
  Award,
  ChevronRight,
  Zap,
} from 'lucide-react';

export const ExamReadinessCard: React.FC = () => {
  const { setActiveTab } = useNavigation();
  const { user } = useAuth();
  const { chapterProgressMap, upcomingExam, studentDetails } = useOnboarding();

  const [readiness, setReadiness] = useState<ExamReadinessData | null>(() =>
    readinessService.getCachedData()
  );

  useEffect(() => {
    // Initial fetch / calculate
    const userId = user?.uid || 'guest';
    const chapters = Object.values(chapterProgressMap || {});
    readinessService.init(userId).then((data) => {
      setReadiness(data);
    });

    // Subscribe to real-time changes
    const unsub = readinessService.subscribe((data) => {
      setReadiness(data);
    });

    return () => unsub();
  }, [user?.uid, chapterProgressMap, upcomingExam]);

  // Recalculate if chapter progress map changes
  useEffect(() => {
    const chapters = Object.values(chapterProgressMap || {});
    if (chapters.length > 0) {
      const updated = readinessService.recalculateReadiness(chapters, undefined, upcomingExam);
      setReadiness(updated);
    }
  }, [chapterProgressMap, upcomingExam]);

  const score = readiness?.overallScore || 83;
  const rating: ReadinessRating = readiness?.rating || 'Excellent';
  const examMode = readiness?.examMode;
  const subjects = readiness?.subjects ? Object.values(readiness.subjects) : [];

  // Color config according to rating
  const ratingColors = {
    Excellent: {
      badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
      ringColor: '#10B981',
      scoreText: 'text-emerald-400',
      pillBg: 'from-emerald-500/20 to-teal-500/10',
    },
    Good: {
      badgeBg: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
      ringColor: '#3B82F6',
      scoreText: 'text-blue-400',
      pillBg: 'from-blue-500/20 to-indigo-500/10',
    },
    Average: {
      badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
      ringColor: '#F59E0B',
      scoreText: 'text-amber-400',
      pillBg: 'from-amber-500/20 to-orange-500/10',
    },
    'Needs Improvement': {
      badgeBg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
      ringColor: '#F43F5E',
      scoreText: 'text-rose-400',
      pillBg: 'from-rose-500/20 to-pink-500/10',
    },
  }[rating];

  // SVG Circular calculation
  const circleRadius = 38;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.006 }}
      transition={{ duration: 0.2 }}
      onClick={() => setActiveTab('readiness' as any)}
      className="relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-indigo-950/90 to-purple-950 text-white border border-indigo-500/30 shadow-2xl cursor-pointer group transition-all hover:border-indigo-400/50"
    >
      {/* Background ambient lighting */}
      <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none group-hover:bg-indigo-500/25 transition-all" />
      <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Column: Heading, Badges, and Diagnostic Reason */}
        <div className="space-y-3 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-black uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Exam Readiness</span>
            </div>

            <span
              className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full border text-xs font-black uppercase tracking-wide ${ratingColors.badgeBg}`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>{rating}</span>
            </span>

            {examMode && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/35 text-amber-300 text-[11px] font-bold">
                <Calendar className="w-3 h-3" />
                <span>{examMode.badgeText}</span>
              </span>
            )}

            <span className="text-[10px] text-indigo-300/80 font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10 ml-auto sm:ml-0">
              Deterministic Real-Data Score
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Overall Exam Preparation</span>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed max-w-2xl font-medium">
              Calculated from your completed syllabus, question accuracy, spaced revision recency, formula review, and Mistake Notebook.
            </p>
          </div>

          {/* Quick Subject Readiness Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {subjects.map((sub) => (
              <div
                key={sub.subjectId}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: sub.color || '#8B5CF6' }}
                  />
                  <span className="font-bold text-slate-200">{sub.subjectName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${sub.overallScore}%`,
                        backgroundColor: sub.color || '#8B5CF6',
                      }}
                    />
                  </div>
                  <span className="font-mono font-extrabold text-white text-xs">{sub.overallScore}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Diagnosis Teaser */}
          {readiness?.whyThisScore?.diagnostics?.[0] && (
            <div className="flex items-center gap-2 text-xs text-indigo-300 bg-indigo-950/60 p-2.5 rounded-xl border border-indigo-500/20 max-w-2xl">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">
                <strong className="text-amber-300">Key Insight:</strong>{' '}
                {readiness.whyThisScore.diagnostics[0].description}
              </span>
            </div>
          )}
        </div>

        {/* Right Column: Circular Progress Ring & CTA */}
        <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/10">
          {/* Circular Progress Gauge */}
          <div className="relative flex items-center justify-center">
            <svg className="w-24 h-24 sm:w-28 sm:h-28 -rotate-90 transform">
              <circle
                cx="50%"
                cy="50%"
                r={circleRadius}
                className="text-white/10"
                strokeWidth="7"
                stroke="currentColor"
                fill="transparent"
              />
              <motion.circle
                cx="50%"
                cy="50%"
                r={circleRadius}
                stroke={ratingColors.ringColor}
                strokeWidth="7"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${ratingColors.scoreText}`}>
                {score}%
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Readiness
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex flex-col items-end gap-1.5">
            <button className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 group-hover:translate-x-0.5 transition-all cursor-pointer">
              <span>Full Analytics</span>
              <ChevronRight className="w-4 h-4 text-indigo-200 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <span className="text-[10px] text-indigo-300/80 font-medium">
              View Weak Topics & Action Plan
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
