import React, { useState } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAIMemory } from '@/contexts/AIMemoryContext';
import { ClassicAITutorView } from './components/ClassicAITutorView';
import { ImageDoubtSolverView } from './components/ImageDoubtSolverView';
import { VoiceTutorView } from './components/VoiceTutorView';
import { LectureAnalyzerView } from './components/LectureAnalyzerView';
import { FutureAIHubView } from './components/FutureAIHubView';
import {
  Sparkles,
  Bot,
  Camera,
  Mic,
  Youtube,
  Layers,
  Clock,
  BookOpen,
  HelpCircle,
} from 'lucide-react';

export type AskAITab = 'classic' | 'image' | 'voice' | 'lecture' | 'future_hub';

export const AskAIView: React.FC = () => {
  const { studentDetails } = useOnboarding();
  const { currentSubject, currentChapter, recentDoubts, setActiveDoubtToContinue } = useAIMemory();
  const [activeTab, setActiveTab] = useState<AskAITab>('classic');

  const handleSwitchToClassic = (prefillPrompt?: string) => {
    setActiveTab('classic');
    if (prefillPrompt) {
      setActiveDoubtToContinue({
        id: `trans_${Date.now()}`,
        question: prefillPrompt,
        replySnippet: 'Transferred query from future AI tool',
        subject: currentSubject,
        chapter: currentChapter,
        mode: 'ask-doubt',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-12 select-none">
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/25">
              <Sparkles className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Rankify AI Study Assistant
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
              CBSE Class 12 PCM
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Exclusive board-calibrated mentor for Physics (042), Chemistry (043), and Mathematics (041).
          </p>
        </div>

        {/* Current Active Context Badge */}
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-2xl bg-card/80 border border-slate-200/80 dark:border-white/10 shadow-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-foreground font-bold">{currentSubject}:</span>
          <span className="text-muted-foreground truncate max-w-[140px]">{currentChapter}</span>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-white/5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('classic')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 ${
            activeTab === 'classic'
              ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/30'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Classic AI Tutor</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">Default</span>
        </button>

        <button
          onClick={() => setActiveTab('image')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 ${
            activeTab === 'image'
              ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/30'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Image Doubt</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold">
            🚧 In Dev
          </span>
        </button>

        <button
          onClick={() => setActiveTab('voice')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 ${
            activeTab === 'voice'
              ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/30'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>Voice Tutor</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold">
            🚧 In Dev
          </span>
        </button>

        <button
          onClick={() => setActiveTab('lecture')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 ${
            activeTab === 'lecture'
              ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/30'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Youtube className="w-4 h-4" />
          <span>Lecture Analyzer</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold">
            🚧 In Dev
          </span>
        </button>

        <button
          onClick={() => setActiveTab('future_hub')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 ${
            activeTab === 'future_hub'
              ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/30'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>In Development Hub</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-extrabold">
            6 Models
          </span>
        </button>
      </div>

      {/* Main View Router */}
      <div className="transition-all duration-300">
        {activeTab === 'classic' && <ClassicAITutorView />}
        {activeTab === 'image' && (
          <ImageDoubtSolverView onSwitchToClassicTutor={handleSwitchToClassic} />
        )}
        {activeTab === 'voice' && (
          <VoiceTutorView onSwitchToClassicTutor={handleSwitchToClassic} />
        )}
        {activeTab === 'lecture' && (
          <LectureAnalyzerView onSwitchToClassicTutor={handleSwitchToClassic} />
        )}
        {activeTab === 'future_hub' && (
          <FutureAIHubView
            onSelectFeatureTab={(tab) => {
              if (tab === 'classic') setActiveTab('classic');
              else if (tab === 'image') setActiveTab('image');
              else if (tab === 'voice') setActiveTab('voice');
              else if (tab === 'lecture') setActiveTab('lecture');
            }}
          />
        )}
      </div>
    </div>
  );
};
