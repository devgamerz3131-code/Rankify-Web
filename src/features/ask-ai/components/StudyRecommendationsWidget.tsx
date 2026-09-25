import React, { useEffect, useState } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAIMemory } from '@/contexts/AIMemoryContext';
import { getStudyRecommendations, AIRecommendationItem } from '@/services/ai-tutor-service';
import {
  Sparkles,
  ArrowRight,
  RotateCcw,
  AlertCircle,
  FileCheck,
  BookOpen,
  HelpCircle,
  Calculator,
} from 'lucide-react';

interface StudyRecommendationsWidgetProps {
  onSelectRecommendation: (rec: {
    subject: string;
    chapter: string;
    mode: 'ask-doubt' | 'explain-concept' | 'formula-explanation' | 'numerical-help' | 'ncert-explanation' | 'pyq-discussion' | 'short-notes' | 'revision-mode' | 'practice-questions';
    presetPrompt: string;
  }) => void;
}

export const StudyRecommendationsWidget: React.FC<StudyRecommendationsWidgetProps> = ({
  onSelectRecommendation,
}) => {
  const { chapterProgressMap } = useOnboarding();
  const { setCurrentSubject, setCurrentChapter } = useAIMemory();
  const [recommendations, setRecommendations] = useState<AIRecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const chapters = Object.values(chapterProgressMap || {});
    getStudyRecommendations(chapters).then((recs) => {
      if (isMounted) {
        setRecommendations(recs);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [chapterProgressMap]);

  const handleApply = (rec: AIRecommendationItem) => {
    setCurrentSubject(rec.subject);
    setCurrentChapter(rec.chapter);

    let mode: any = 'ask-doubt';
    let prompt = `Please guide me on ${rec.chapter} (${rec.subject}) based on my current study recommendation: ${rec.action}.`;

    if (rec.type === 'weak_chapter') {
      mode = 'explain-concept';
      prompt = `I need help clarifying the hardest concepts in ${rec.chapter} (${rec.subject}) because this is marked as one of my weaker areas. Can you break down the fundamental logic and common board pitfalls?`;
    } else if (rec.type === 'revision_chapter') {
      mode = 'revision-mode';
      prompt = `Provide a rapid revision checklist for ${rec.chapter} (${rec.subject}) with key definitions, 3 essential formulas, and 2 high-yield PYQ patterns.`;
    } else if (rec.type === 'practice_set') {
      mode = 'practice-questions';
      prompt = `Give me 3 high-yield CBSE board level practice questions for ${rec.chapter} (${rec.subject}) with step-by-step solutions.`;
    } else if (rec.type === 'ncert_reading') {
      mode = 'ncert-explanation';
      prompt = `Explain the crucial NCERT textbook in-text problems and key summary points for ${rec.chapter} (${rec.subject}).`;
    } else if (rec.type === 'formula_revision') {
      mode = 'formula-explanation';
      prompt = `Give me a comprehensive formula sheet for ${rec.chapter} (${rec.subject}) with all variables, SI units, and conditions of applicability.`;
    }

    onSelectRecommendation({
      subject: rec.subject,
      chapter: rec.chapter,
      mode,
      presetPrompt: prompt,
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'weak_chapter':
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      case 'next_chapter':
        return <ArrowRight className="w-4 h-4 text-purple-500" />;
      case 'revision_chapter':
        return <RotateCcw className="w-4 h-4 text-blue-500" />;
      case 'practice_set':
        return <FileCheck className="w-4 h-4 text-emerald-500" />;
      case 'ncert_reading':
        return <BookOpen className="w-4 h-4 text-amber-500" />;
      case 'formula_revision':
        return <Calculator className="w-4 h-4 text-indigo-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-purple-500" />;
    }
  };

  if (loading) {
    return (
      <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-card/60 animate-pulse text-xs text-muted-foreground flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-purple-500 animate-spin" />
        <span>Synthesizing smart study recommendations from your dashboard progress...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Personalized CBSE 12 Study Recommendations
          </h3>
        </div>
        <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800/40">
          Live Diagnostic
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {recommendations.slice(0, 6).map((rec, idx) => (
          <div
            key={idx}
            onClick={() => handleApply(rec)}
            className="group p-3 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 hover:border-purple-400 dark:hover:border-purple-600/60 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-foreground/80 flex items-center gap-1.5">
                  {getIcon(rec.type)}
                  {rec.subject}
                </span>
                <span className="text-[10px] font-medium text-muted-foreground">
                  {rec.title}
                </span>
              </div>
              <div className="font-bold text-xs sm:text-sm text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {rec.chapter}
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                {rec.reason}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] font-semibold text-purple-600 dark:text-purple-400">
              <span>{rec.action}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
