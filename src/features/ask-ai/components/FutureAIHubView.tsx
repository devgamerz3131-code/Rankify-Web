import React, { useState } from 'react';
import {
  Sparkles,
  Radio,
  FileSearch,
  Camera,
  Image,
  Mic,
  Youtube,
  ArrowRight,
  Clock,
  Layers,
  CheckCircle,
} from 'lucide-react';

interface FutureAIHubViewProps {
  onSelectFeatureTab: (tab: 'classic' | 'image' | 'voice' | 'lecture') => void;
}

interface InDevFeature {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: any;
  status: string;
  targetTab?: 'image' | 'voice' | 'lecture';
  badgeColor: string;
}

const IN_DEV_FEATURES: InDevFeature[] = [
  {
    id: 'voice_tutor',
    name: 'Voice Tutor',
    tagline: 'Bidirectional Voice Interaction',
    description:
      'Ask complex CBSE numericals and conceptual doubts out loud and listen to spoken explanations with formula pronunciation.',
    icon: Mic,
    status: 'Currently under development',
    targetTab: 'voice',
    badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
  },
  {
    id: 'image_gen',
    name: 'Image Generator',
    tagline: 'NCERT Scientific & Ray Diagrams',
    description:
      'Generate high-precision optical ray diagrams, crystal lattice structures, and circuit schematics aligned with CBSE drawing conventions.',
    icon: Image,
    status: 'Coming Soon',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  },
  {
    id: 'lecture_analyzer',
    name: 'Lecture Analyzer',
    tagline: 'YouTube & Video Lecture Indexer',
    description:
      'Turns 1-hour coaching lecture videos into timestamped NCERT chapter notes, formulas, and in-video doubt bookmarks.',
    icon: Youtube,
    status: 'Future Rankify AI feature',
    targetTab: 'lecture',
    badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
  },
  {
    id: 'live_ai',
    name: 'Live AI',
    tagline: 'Multi-Modal Real-Time Study Coach',
    description:
      'Ultra low-latency audio-visual co-pilot for simultaneous notebook inspection, formula checking, and live derivation walkthroughs.',
    icon: Radio,
    status: 'Currently under development',
    badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
  },
  {
    id: 'document_ai',
    name: 'Document AI',
    tagline: 'CBSE Sample Paper & PYQ PDF Extractor',
    description:
      'Upload full-length PDF question papers and answer keys. Automatically extracts marking schemes and generates personalized error analysis.',
    icon: FileSearch,
    status: 'Coming Soon',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
  },
  {
    id: 'camera_solver',
    name: 'Camera Doubt Solver',
    tagline: 'Instant Handwritten OCR & Step-by-Step Solver',
    description:
      'Snap a picture of your notebook, textbook, or rough worksheet to identify errors and receive handwritten-style step corrections.',
    icon: Camera,
    status: 'Currently under development',
    targetTab: 'image',
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  },
];

export const FutureAIHubView: React.FC<FutureAIHubViewProps> = ({ onSelectFeatureTab }) => {
  const [selectedFeature, setSelectedFeature] = useState<InDevFeature | null>(null);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🚧</span>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Rankify Next-Gen AI Hub
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300/50">
              In Development
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            Explore advanced AI features being engineered specifically for CBSE Class 12 Science board examination mastery.
          </p>
        </div>

        <button
          onClick={() => onSelectFeatureTab('classic')}
          className="px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <span>Use Classic AI Tutor</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid of features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {IN_DEV_FEATURES.map((feat) => {
          const Icon = feat.icon;
          return (
            <div
              key={feat.id}
              onClick={() => {
                if (feat.targetTab) {
                  onSelectFeatureTab(feat.targetTab);
                } else {
                  setSelectedFeature(feat);
                }
              }}
              className="p-5 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-card/60 backdrop-blur-xl hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${feat.badgeColor}`}
                  >
                    🚧 {feat.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {feat.name}
                  </h3>
                  <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 mt-0.5">
                    {feat.tagline}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feat.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400">
                <span>{feat.targetTab ? 'Open Preview UI' : 'Feature Roadmap'}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Details Modal for non-tab features */}
      {selectedFeature && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-slate-200 dark:border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚧</span>
                <h3 className="font-bold text-base text-foreground">{selectedFeature.name}</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                {selectedFeature.status}
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {selectedFeature.description}
            </p>

            <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 border border-purple-200/50 text-xs">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Future Rankify AI Feature</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                This engine is scheduled for integration in the next platform phase. Until then, use the Classic AI Tutor for all Class 12 PCM needs.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedFeature(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedFeature(null);
                  onSelectFeatureTab('classic');
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold cursor-pointer"
              >
                Go to Classic AI Tutor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
