import React, { useState } from 'react';
import {
  Youtube,
  Search,
  Sparkles,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { analyzeLectureUrl } from '@/services/ai-tutor-service';
import toast from 'react-hot-toast';

interface LectureAnalyzerViewProps {
  onSwitchToClassicTutor: (prefillPrompt?: string) => void;
}

export const LectureAnalyzerView: React.FC<LectureAnalyzerViewProps> = ({
  onSwitchToClassicTutor,
}) => {
  const [url, setUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);

  const steps = [
    'Validating YouTube stream metadata...',
    'Extracting CBSE Class 12 topic timestamps...',
    'Aligning audio transcript with NCERT curriculum...',
    'Checking Rankify analysis backend service...',
  ];

  const handleAnalyze = async () => {
    if (!url.trim()) {
      toast.error('Please enter a YouTube video URL');
      return;
    }

    setIsValidating(true);
    setAnalysisResult(null);
    setStepIndex(0);

    const stepInterval = setInterval(() => {
      setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 600);

    const result = await analyzeLectureUrl(url.trim());

    setTimeout(() => {
      clearInterval(stepInterval);
      setIsValidating(false);

      if (!result.valid && result.error) {
        toast.error(result.error);
        return;
      }

      setAnalysisResult({
        valid: true,
        message: 'Lecture Analysis will be available in a future update.',
      });
      toast('Lecture Analysis will be available in a future update.', {
        icon: '🚧',
      });
    }, 2400);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Dev Banner */}
      <div className="p-4 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🚧</span>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider">In Development</div>
            <div className="text-xs text-foreground/80 font-medium">
              Lecture Analysis will be available in a future update. Never fake analysis — real timestamp indexing is in progress.
            </div>
          </div>
        </div>
        <button
          onClick={() => onSwitchToClassicTutor()}
          className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0 cursor-pointer transition-colors"
        >
          Classic Tutor →
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-card/60 backdrop-blur-xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-600" />
            <span>CBSE YouTube Lecture Analyzer</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Paste any educational YouTube lecture URL to generate NCERT chapter timestamps, formula flashcards, and concept summaries.
          </p>
        </div>

        {/* URL Input Box */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            YouTube Video URL
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                className="w-full bg-slate-100 dark:bg-slate-800 pl-10 pr-4 h-12 rounded-2xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 text-foreground focus:outline-none focus:border-purple-500"
              />
              <Youtube className="w-4 h-4 text-red-500 absolute left-3.5 top-4 pointer-events-none" />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isValidating || !url.trim()}
              className="w-full sm:w-auto px-6 h-12 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-red-500/20 hover:opacity-95 disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isValidating ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Analyze Lecture</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Loading Multi-step Animation */}
        {isValidating && (
          <div className="p-6 rounded-3xl border border-red-200/60 dark:border-red-900/30 bg-red-50/40 dark:bg-red-950/20 space-y-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center animate-spin">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">
                  Processing Class 12 Lecture Stream
                </p>
                <p className="text-[11px] text-muted-foreground">{steps[stepIndex]}</p>
              </div>
            </div>

            {/* Stepper Bars */}
            <div className="grid grid-cols-4 gap-2">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx <= stepIndex ? 'bg-red-600' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Result: Transparent Notice without Faking Analysis */}
        {analysisResult && (
          <div className="p-5 rounded-3xl border border-rose-200/80 dark:border-rose-900/40 bg-rose-50/70 dark:bg-rose-950/30 space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>🚧 {analysisResult.message}</span>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">
              We strictly adhere to factual accuracy and never fake lecture transcript summaries. YouTube video caption ingestion is currently being deployed to our server pipeline.
            </p>
            <div className="pt-2">
              <button
                onClick={() =>
                  onSwitchToClassicTutor(
                    'Summarize the core NCERT derivations and key concepts for this lecture topic.'
                  )
                }
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm hover:bg-rose-700 transition-colors"
              >
                <span>Study Concept in Classic AI Tutor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
