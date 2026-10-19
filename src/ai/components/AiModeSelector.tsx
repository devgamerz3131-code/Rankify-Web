import React from 'react';
import {
  GraduationCap,
  Calculator,
  FileText,
  RotateCcw,
  Calendar,
  Award,
} from 'lucide-react';
import { AiMode } from '../model/types';

interface AiModeSelectorProps {
  activeMode: AiMode;
  onSelectMode: (mode: AiMode) => void;
}

const MODES: {
  id: AiMode;
  label: string;
  icon: React.FC<{ className?: string }>;
  description: string;
}[] = [
  {
    id: 'Tutor',
    label: 'Tutor',
    icon: GraduationCap,
    description: 'Fundamental concept tutor',
  },
  {
    id: 'Solver',
    label: 'Solver',
    icon: Calculator,
    description: 'Step-by-step numerical solver',
  },
  {
    id: 'Notes',
    label: 'Notes',
    icon: FileText,
    description: 'Crisp revision notes & formulas',
  },
  {
    id: 'Revision',
    label: 'Revision',
    icon: RotateCcw,
    description: 'One shot revision sprint',
  },
  {
    id: 'Planner',
    label: 'Planner',
    icon: Calendar,
    description: 'Study sprint planner',
  },
  {
    id: 'Exam',
    label: 'Exam',
    icon: Award,
    description: 'Predicted PYQs & mark schemes',
  },
];

export const AiModeSelector: React.FC<AiModeSelectorProps> = ({
  activeMode,
  onSelectMode,
}) => {
  return (
    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
      <span className="text-[10px] font-extrabold uppercase text-muted-foreground shrink-0 pr-1 hidden sm:inline">
        Mode:
      </span>
      {MODES.map((m) => {
        const Icon = m.icon;
        const isActive = activeMode === m.id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onSelectMode(m.id)}
            title={m.description}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border shadow-2xs ${
              isActive
                ? 'bg-purple-600 text-white border-purple-500 shadow-purple-500/20'
                : 'bg-muted/80 hover:bg-muted text-foreground/80 hover:text-foreground border-border'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-purple-500'}`} />
            <span>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
};
