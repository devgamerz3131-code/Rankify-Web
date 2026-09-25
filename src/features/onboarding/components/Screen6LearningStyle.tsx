import React from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { LearningStyleType, RevisionStyleType } from '@/types/onboarding';
import { ArrowLeft, ArrowRight, Video, FileText, HelpCircle, Layers, Calendar, CheckCircle2 } from 'lucide-react';

const LEARNING_STYLES: { id: LearningStyleType; title: string; desc: string; icon: any }[] = [
  {
    id: 'Video',
    title: 'Visual / Video',
    desc: 'Learn through animated concept maps, video explanations, and visual demonstrations.',
    icon: Video,
  },
  {
    id: 'Notes',
    title: 'Written Notes & Reading',
    desc: 'Deep study with curated NCERT theory, formula cheat-sheets, and concise bullet summaries.',
    icon: FileText,
  },
  {
    id: 'Questions',
    title: 'Problem-Solving & PYQs',
    desc: 'Active recall through practice questions, previous year board papers, and speed tests.',
    icon: HelpCircle,
  },
  {
    id: 'Mixed',
    title: 'Balanced Multi-Modal',
    desc: 'Synergistic combination of theory reading, concept videos, and rigorous practice problems.',
    icon: Layers,
  },
];

const REVISION_STYLES: { id: RevisionStyleType; title: string; desc: string; cadence: string }[] = [
  {
    id: 'Daily',
    title: 'Daily Micro-Revision',
    desc: 'A dedicated 20–30 minute spaced recall cycle every evening before sleep.',
    cadence: 'Daily 24h cycle',
  },
  {
    id: 'Alternate Day',
    title: 'Alternate Day Rotation',
    desc: 'Rotate subjects every 48 hours for interleaved practice and long-term memory consolidation.',
    cadence: '48h Interleaved',
  },
  {
    id: 'Weekend',
    title: 'Weekend Deep Consolidation',
    desc: 'Intensive review sessions on Saturdays and full-length syllabus mock tests on Sundays.',
    cadence: 'Saturday & Sunday',
  },
];

export const Screen6LearningStyle: React.FC = () => {
  const { learningStyle, setLearningStyle, revisionStyle, setRevisionStyle, nextScreen, prevScreen } =
    useOnboarding();

  return (
    <div className="max-w-2xl mx-auto py-2 sm:py-6 px-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Learning & Revision Preferences
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Tell us how your brain absorbs information best so Rankify can generate optimal session lengths and revision prompts.
        </p>
      </div>

      <div className="space-y-6">
        {/* Learning Style Selection */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
            Primary Learning Modality
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {LEARNING_STYLES.map((style) => {
              const Icon = style.icon;
              const isSelected = learningStyle === style.id;
              return (
                <button
                  type="button"
                  key={style.id}
                  onClick={() => setLearningStyle(style.id)}
                  className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'border-purple-600 bg-purple-500/5 dark:bg-purple-950/40 ring-1 ring-purple-600 shadow-sm'
                      : 'border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-foreground">{style.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      {style.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Revision Style Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-600" />
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
              Revision Cadence
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {REVISION_STYLES.map((rev) => {
              const isSelected = revisionStyle === rev.id;
              return (
                <button
                  type="button"
                  key={rev.id}
                  onClick={() => setRevisionStyle(rev.id)}
                  className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'border-purple-600 bg-purple-500/5 dark:bg-purple-950/40 ring-1 ring-purple-600 shadow-sm'
                      : 'border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-foreground">{rev.title}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                    </div>
                    <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300 inline-block mb-1.5 font-bold">
                      {rev.cadence}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-snug">
                      {rev.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Nav Actions */}
      <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-200/60 dark:border-white/10">
        <Button variant="ghost" onClick={prevScreen} className="gap-2 cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
        <Button
          variant="primary"
          onClick={nextScreen}
          className="gap-2 px-6 h-11 rounded-xl font-bold shadow-md shadow-purple-600/20 cursor-pointer"
        >
          <span>Evaluate Syllabus Chapters</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
