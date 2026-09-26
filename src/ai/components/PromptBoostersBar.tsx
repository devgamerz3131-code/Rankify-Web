import React from 'react';
import {
  Sparkles,
  Zap,
  Target,
  Rocket,
  RotateCcw,
  BookOpen,
  Award,
  Calculator,
  Compass,
} from 'lucide-react';
import { PromptBooster } from '../model/types';

interface PromptBoostersBarProps {
  activeBooster: PromptBooster | null;
  onToggleBooster: (booster: PromptBooster) => void;
  isLoading?: boolean;
}

const BOOSTERS: {
  id: PromptBooster;
  label: string;
  icon: React.FC<{ className?: string }>;
  color: string;
}[] = [
  { id: 'Easy Mode', label: 'Easy Mode', icon: Compass, color: 'text-emerald-500' },
  { id: 'Board Mode', label: 'Board Mode', icon: Target, color: 'text-purple-500' },
  { id: 'Topper Mode', label: 'Topper Mode', icon: Zap, color: 'text-amber-500' },
  { id: 'Crash Course', label: 'Crash Course', icon: Rocket, color: 'text-rose-500' },
  { id: 'Revision Only', label: 'Revision Only', icon: RotateCcw, color: 'text-blue-500' },
  { id: 'NCERT Only', label: 'NCERT Only', icon: BookOpen, color: 'text-teal-500' },
  { id: 'PYQs Only', label: 'PYQs Only', icon: Award, color: 'text-indigo-500' },
  { id: 'Numericals Only', label: 'Numericals Only', icon: Calculator, color: 'text-orange-500' },
  { id: 'Formula Only', label: 'Formula Only', icon: Sparkles, color: 'text-cyan-500' },
];

export const PromptBoostersBar: React.FC<PromptBoostersBarProps> = ({
  activeBooster,
  onToggleBooster,
  isLoading,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-1 py-1">
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <span className="text-[10px] uppercase font-bold text-muted-foreground shrink-0 flex items-center gap-1 pr-1">
          <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
          <span>Boosters:</span>
        </span>
        {BOOSTERS.map((b) => {
          const Icon = b.icon;
          const isActive = activeBooster === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onToggleBooster(b.id)}
              disabled={isLoading}
              title={`Boost prompt with ${b.label}`}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold tracking-tight shrink-0 transition-all cursor-pointer shadow-2xs border ${
                isActive
                  ? 'bg-purple-600 text-white border-purple-500 shadow-purple-500/20 ring-1 ring-purple-400/40'
                  : 'bg-card text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/80 dark:border-white/10'
              }`}
            >
              <Icon className={`w-3 h-3 ${isActive ? 'text-white' : b.color}`} />
              <span>{b.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
