import React, { useState } from 'react';
import {
  GraduationCap,
  FileText,
  BookOpen,
  ChevronRight,
  X,
  Sparkles,
  Zap,
  Clock,
} from 'lucide-react';
import { AiMode } from '../model/types';
import { chatRepository } from '../repository/chat-repository';

interface AiToolsPanelProps {
  activeMode: AiMode;
  onSelectMode: (mode: AiMode) => void;
  onSelectPrompt: (promptText: string) => void;
  onSelectChat?: (chatId: string) => void;
  onCloseMobile?: () => void;
}

interface ToolCardItem {
  id: string;
  title: string;
  desc: string;
  mode: AiMode;
  icon: React.FC<{ className?: string }>;
  promptTemplate: string;
  badge: string;
  color: string;
}

const AI_TOOLS: ToolCardItem[] = [
  {
    id: 'tutor',
    title: 'AI Concept Tutor',
    desc: 'Step-by-step fundamental derivations & clear everyday analogies',
    mode: 'Tutor',
    icon: GraduationCap,
    promptTemplate: 'Act as my CBSE Class 12 AI Tutor. Explain fundamental concepts step by step with clear analogies and board exam focus.',
    badge: 'Core Tutor',
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  },
  {
    id: 'notes',
    title: 'Notes Generator',
    desc: 'Crisp, high-yield NCERT revision notes with definitions & formulas',
    mode: 'Notes',
    icon: FileText,
    promptTemplate: 'Generate complete, high-yield short revision notes with key definitions, formulas, and bullet points for my current topic.',
    badge: 'High Yield',
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  {
    id: 'ncert_help',
    title: 'NCERT Companion',
    desc: 'Step-by-step solutions and explanations for NCERT textbook questions',
    mode: 'Tutor',
    icon: BookOpen,
    promptTemplate: 'Provide a clear NCERT textbook summary with core definitions, in-text exercise solutions, and key concepts.',
    badge: 'NCERT Solutions',
    color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
  },
];

export const AiToolsPanel: React.FC<AiToolsPanelProps> = ({
  activeMode,
  onSelectMode,
  onSelectPrompt,
  onSelectChat,
  onCloseMobile,
}) => {
  const [activeTab, setActiveTab] = useState<'tools' | 'chats'>('tools');
  const recentChats = chatRepository.getAllConversations().slice(0, 5);

  const handleToolClick = (tool: ToolCardItem) => {
    onSelectMode(tool.mode);
    onSelectPrompt(tool.promptTemplate);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <div className="w-full h-full flex flex-col bg-card border-l border-border select-none">
      {/* Tools Panel Header */}
      <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-foreground">
            AI Tools & Features
          </span>
        </div>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground md:hidden cursor-pointer"
            title="Close Tools Panel"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tabs: AI Tools vs Recent Chats */}
      <div className="px-4 pt-3 pb-2 border-b border-border flex items-center gap-2 bg-muted/30">
        <button
          type="button"
          onClick={() => setActiveTab('tools')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'tools'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>AI Tools</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('chats')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'chats'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Recent ({recentChats.length})</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {activeTab === 'tools' ? (
          AI_TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isModeActive = activeMode === tool.mode;

            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => handleToolClick(tool)}
                className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer group flex items-start gap-3 hover:shadow-md ${
                  isModeActive
                    ? 'bg-purple-500/10 border-purple-500/40'
                    : 'bg-card border-border hover:border-purple-500/30'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${tool.color}`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-xs text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {tool.title}
                    </span>
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                      {tool.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                    {tool.desc}
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-purple-500 group-hover:translate-x-0.5 transition-transform shrink-0 self-center" />
              </button>
            );
          })
        ) : (
          <div className="space-y-1.5">
            {recentChats.length === 0 ? (
              <p className="text-xs text-muted-foreground p-4 text-center">
                No recent AI conversations yet.
              </p>
            ) : (
              recentChats.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => {
                    if (onSelectChat) onSelectChat(chat.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className="w-full p-2.5 rounded-xl bg-card border border-border hover:border-purple-500/40 text-left transition cursor-pointer flex items-center justify-between group"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-xs font-bold text-foreground truncate group-hover:text-purple-600 dark:group-hover:text-purple-400">
                      {chat.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {chat.messages.length} messages • {chat.detectedSubject || 'CBSE'}
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-purple-500 shrink-0" />
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
