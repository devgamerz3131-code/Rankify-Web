import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Pin,
  Trash2,
  Sparkles,
  MessageSquare,
  BookOpen,
  X,
  Lock,
} from 'lucide-react';
import {
  promptChatHistoryService,
  PromptChatItem,
} from '@/services/prompt-chat-history';

interface PromptSidebarProps {
  chats: PromptChatItem[];
  activeId: string;
  onSelectChat: (id: string) => void;
  onNewDoubt: () => void;
  onOpenComingSoonModal: () => void;
  onCloseMobile?: () => void;
}

export const PromptSidebar: React.FC<PromptSidebarProps> = ({
  chats,
  activeId,
  onSelectChat,
  onNewDoubt,
  onOpenComingSoonModal,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<'all' | 'Physics' | 'Chemistry' | 'Mathematics'>('all');

  const filteredChats = useMemo(() => {
    return chats.filter((c) => {
      const matchesSearch =
        c.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.chapter.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject = subjectFilter === 'all' || c.subject === subjectFilter;
      return matchesSearch && matchesSubject;
    });
  }, [chats, searchQuery, subjectFilter]);

  const pinnedList = filteredChats.filter((c) => c.isPinned);
  const recentList = filteredChats.filter((c) => !c.isPinned);

  const getSubjectColor = (subject: string) => {
    switch (subject) {
      case 'Physics':
        return 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800/40';
      case 'Chemistry':
        return 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/60 border-pink-200 dark:border-pink-800/40';
      case 'Mathematics':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800/40';
      default:
        return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800/40';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-card/95 border-r border-slate-200/80 dark:border-white/10 select-none">
      {/* 1. Top Action Buttons */}
      <div className="p-4 space-y-3 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-purple-500/30">
              R
            </div>
            <span className="font-black text-sm tracking-tight text-foreground">Rankify Prompts</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold border border-emerald-200 dark:border-emerald-800/40">
              Offline
            </span>
          </div>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground md:hidden cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* New Doubt Button */}
        <button
          onClick={onNewDoubt}
          className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Doubt Prompt</span>
        </button>

        {/* Future Ready "Rankify AI" Button */}
        <button
          onClick={onOpenComingSoonModal}
          className="w-full py-2 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 text-muted-foreground hover:text-foreground font-bold text-xs flex items-center justify-between transition cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            <span>Rankify Native AI</span>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-extrabold border border-purple-200 dark:border-purple-800/40 flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" />
            <span>Coming Soon</span>
          </span>
        </button>

        {/* Search Bar */}
        <div className="relative pt-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved doubts..."
            className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 rounded-xl pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Subject Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pt-1">
          {(['all', 'Physics', 'Chemistry', 'Mathematics'] as const).map((sub) => (
            <button
              key={sub}
              onClick={() => setSubjectFilter(sub)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold capitalize transition-all cursor-pointer shrink-0 ${
                subjectFilter === sub
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground bg-slate-100 dark:bg-slate-800/50'
              }`}
            >
              {sub === 'all' ? 'All' : sub === 'Mathematics' ? 'Maths' : sub}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Scrollable Doubts List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Pinned Doubts */}
        {pinnedList.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground px-2 flex items-center gap-1">
              <Pin className="w-3 h-3 text-purple-600" />
              <span>Pinned Doubts</span>
            </span>
            <div className="space-y-1 pt-1">
              {pinnedList.map((item) => (
                <ChatItem
                  key={item.id}
                  item={item}
                  isActive={item.id === activeId}
                  colorClass={getSubjectColor(item.subject)}
                  onSelect={() => {
                    onSelectChat(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  onTogglePin={() => promptChatHistoryService.togglePin(item.id)}
                  onDelete={() => promptChatHistoryService.deleteChat(item.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recent Doubts */}
        <div className="space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground px-2 flex items-center gap-1">
            <MessageSquare className="w-3 h-3 text-muted-foreground" />
            <span>Recent Doubts ({recentList.length})</span>
          </span>
          {recentList.length === 0 ? (
            <p className="text-[11px] text-muted-foreground px-2 py-3 text-center italic">
              No previous doubts found.
            </p>
          ) : (
            <div className="space-y-1 pt-1">
              {recentList.map((item) => (
                <ChatItem
                  key={item.id}
                  item={item}
                  isActive={item.id === activeId}
                  colorClass={getSubjectColor(item.subject)}
                  onSelect={() => {
                    onSelectChat(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  onTogglePin={() => promptChatHistoryService.togglePin(item.id)}
                  onDelete={() => promptChatHistoryService.deleteChat(item.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Footer */}
      <div className="p-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>No API • 100% Offline</span>
        <button
          onClick={() => {
            if (confirm('Clear saved doubt history?')) {
              promptChatHistoryService.clearAllHistory();
            }
          }}
          className="hover:text-rose-500 font-semibold cursor-pointer flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" />
          <span>Clear All</span>
        </button>
      </div>
    </div>
  );
};

interface ChatItemProps {
  item: PromptChatItem;
  isActive: boolean;
  colorClass: string;
  onSelect: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}

const ChatItem: React.FC<ChatItemProps> = ({
  item,
  isActive,
  colorClass,
  onSelect,
  onTogglePin,
  onDelete,
}) => {
  return (
    <div
      onClick={onSelect}
      className={`group relative p-2.5 rounded-2xl transition-all cursor-pointer flex items-start justify-between gap-2 ${
        isActive
          ? 'bg-purple-50 dark:bg-purple-950/40 border border-purple-500/30 shadow-xs'
          : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60 border border-transparent'
      }`}
    >
      <div className="space-y-1 overflow-hidden flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border shrink-0 ${colorClass}`}
          >
            {item.subject}
          </span>
          <span className="text-xs font-bold text-foreground truncate block">{item.question}</span>
        </div>
        <p className="text-[10px] text-muted-foreground truncate">{item.chapter}</p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer ${
            item.isPinned ? 'text-purple-600' : 'text-muted-foreground'
          }`}
          title={item.isPinned ? 'Unpin' : 'Pin'}
        >
          <Pin className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950/40 text-muted-foreground hover:text-rose-600 cursor-pointer"
          title="Delete doubt"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
