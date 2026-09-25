import React, { useState } from 'react';
import { Mic, MicOff, Volume2, Sparkles, ArrowRight, User, Bot, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface VoiceTutorViewProps {
  onSwitchToClassicTutor: (prefillPrompt?: string) => void;
}

export const VoiceTutorView: React.FC<VoiceTutorViewProps> = ({ onSwitchToClassicTutor }) => {
  const [isListening, setIsListening] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const [voiceHistory, setVoiceHistory] = useState<
    Array<{ sender: 'user' | 'ai'; text: string; timestamp: string }>
  >([
    {
      sender: 'ai',
      text: 'Voice Tutor interface initialized. Tap the glowing microphone to speak your Physics, Chemistry, or Mathematics doubt.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const toggleMic = () => {
    if (!isListening) {
      setIsListening(true);
      setShowNotice(false);

      // Simulate voice capture and graceful in-development notice
      setTimeout(() => {
        setIsListening(false);
        setShowNotice(true);
        setVoiceHistory((prev) => [
          ...prev,
          {
            sender: 'user',
            text: 'Explain Biot-Savart Law and calculate magnetic field at center of circular loop.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          {
            sender: 'ai',
            text: 'Voice Tutor is under development. Real-time audio streaming is being configured. Please continue this query with the Classic AI Tutor.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        toast('Voice Tutor is under development.', { icon: '🚧' });
      }, 2500);
    } else {
      setIsListening(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Dev Banner */}
      <div className="p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-400 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🚧</span>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider">In Development</div>
            <div className="text-xs text-foreground/80 font-medium">
              Voice Tutor is under development. Low-latency vocal synthesis will be enabled in upcoming releases.
            </div>
          </div>
        </div>
        <button
          onClick={() => onSwitchToClassicTutor()}
          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shrink-0 cursor-pointer transition-colors"
        >
          Classic Tutor →
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-card/60 backdrop-blur-xl p-6 sm:p-8 shadow-sm space-y-6 text-center">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
            <Volume2 className="w-5 h-5 text-purple-600" />
            <span>CBSE Voice Academic Coach</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            Hands-free voice doubts for rapid concept queries and formula checks during study sessions.
          </p>
        </div>

        {/* Mic Visualizer Animation */}
        <div className="py-6 flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            {/* Glowing rings when listening */}
            {isListening && (
              <>
                <div className="absolute inset-0 rounded-full bg-purple-600/30 animate-ping" />
                <div className="absolute -inset-4 rounded-full bg-purple-600/20 animate-pulse" />
                <div className="absolute -inset-8 rounded-full bg-purple-600/10 animate-pulse delay-100" />
              </>
            )}

            <button
              onClick={toggleMic}
              className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 cursor-pointer ${
                isListening
                  ? 'bg-rose-600 text-white scale-110 shadow-rose-500/40'
                  : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white hover:scale-105 shadow-purple-500/30'
              }`}
            >
              {isListening ? <Mic className="w-10 h-10 animate-bounce" /> : <Mic className="w-10 h-10" />}
            </button>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">
              {isListening ? 'Listening for CBSE Doubt...' : 'Tap Microphone to Speak'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isListening ? 'Speak clearly into your microphone' : 'Say: "Explain Lens Maker\'s Formula"'}
            </p>
          </div>
        </div>

        {/* Development Notice Callout */}
        {showNotice && (
          <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/70 dark:bg-indigo-950/30 text-left space-y-2 animate-in fade-in max-w-lg mx-auto">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs uppercase tracking-wider">
              <span>🚧 Voice Tutor is under development</span>
            </div>
            <p className="text-xs text-foreground/80">
              Your voice transcript has been captured. Click below to view the comprehensive step-by-step NCERT explanation in the Classic AI Tutor.
            </p>
            <button
              onClick={() =>
                onSwitchToClassicTutor(
                  'Explain Biot-Savart Law and calculate magnetic field at center of circular loop.'
                )
              }
              className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>Solve with Classic AI Tutor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Voice Conversation History */}
        <div className="text-left space-y-2 pt-4 border-t border-slate-200/60 dark:border-white/5">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Audio Session Transcript
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {voiceHistory.map((item, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl text-xs flex items-start gap-2.5 ${
                  item.sender === 'user'
                    ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 border border-purple-200/50'
                    : 'bg-slate-50 dark:bg-slate-900 text-foreground border border-slate-200/60 dark:border-white/5'
                }`}
              >
                {item.sender === 'user' ? (
                  <User className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                ) : (
                  <Bot className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium leading-relaxed">{item.text}</p>
                  <span className="text-[9px] text-muted-foreground mt-1 block">
                    {item.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
