import React, { useState, memo } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Atom,
  Zap,
  Calculator,
  BookOpen,
  X,
  Star,
  Clock,
  TrendingUp,
  Calendar,
  Pin,
  Edit2,
  Check,
} from 'lucide-react';
import { Conversation } from '../model/types';

export type TimeFilterOption =
  | 'all'
  | 'pinned'
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'favorites'
  | 'most_used';

interface ChatSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilter?: TimeFilterOption;
  onFilterChange?: (filter: TimeFilterOption) => void;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  onRename?: (id: string, newTitle: string) => void;
  onTogglePin?: (id: string) => void;
  onClearAll: () => void;
  onCloseMobile?: () => void;
}

const FILTER_ITEMS: {
  id: TimeFilterOption;
  label: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { id: 'all', label: 'All', icon: Calendar },
  { id: 'pinned', label: 'Pinned', icon: Pin },
  { id: 'today', label: 'Today', icon: Clock },
  { id: 'yesterday', label: 'Yesterday', icon: Clock },
  { id: 'this_week', label: 'This Week', icon: Calendar },
  { id: 'favorites', label: 'Favorites', icon: Star },
  { id: 'most_used', label: 'Most Used', icon: TrendingUp },
];

export const ChatSidebarComponent: React.FC<ChatSidebarProps> = ({
  conversations,
  activeId,
  searchQuery,
  onSearchChange,
  activeFilter = 'all',
  onFilterChange,
  onSelect,
  onNewChat,
  onDelete,
  onRename,
  onTogglePin,
  onClearAll,
  onCloseMobile,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const startEditing = (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (e: React.MouseEvent | React.FormEvent, id: string) => {
    e.stopPropagation();
    if (e.preventDefault) e.preventDefault();
    if (onRename && editTitle.trim()) {
      onRename(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const getSubjectIcon = (subj?: string) => {
    switch (subj) {
      case 'Physics':
        return <Zap className="w-3.5 h-3.5 text-blue-500" />;
      case 'Chemistry':
        return <Atom className="w-3.5 h-3.5 text-emerald-500" />;
      case 'Mathematics':
      case 'Maths':
        return <Calculator className="w-3.5 h-3.5 text-purple-500" />;
      default:
        return <BookOpen className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <aside className="w-full h-full flex flex-col bg-card border-r border-slate-200/80 dark:border-white/10 select-none">
      {/* Sidebar Header & New Chat button */}
      <div className="p-4 border-b border-slate-200/80 dark:border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
              AI
            </div>
            <span className="font-extrabold text-sm tracking-tight text-foreground">
              Study Coach
            </span>
          </div>

          <div className="flex items-center gap-1">
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground md:hidden cursor-pointer"
                title="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* New Chat Button */}
        <button
          onClick={() => {
            onNewChat();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full h-9 px-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Study Session</span>
        </button>

        {/* Search Chats Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search study history..."
            className="w-full h-8 pl-8 pr-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-purple-500/40 border border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* History Grouping Tabs: All, Pinned, Today, Yesterday, This Week, Favorites, Most Used */}
        {onFilterChange && (
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
            {FILTER_ITEMS.map((item) => {
              const Icon = item.icon;
              const isSelected = activeFilter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onFilterChange(item.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-tight whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-muted-foreground hover:text-foreground hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-2.5 h-2.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            {searchQuery
              ? 'No matching chats found.'
              : activeFilter !== 'all'
              ? `No chats found in "${activeFilter.replace('_', ' ')}".`
              : 'No study chats yet. Start asking doubts!'}
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeId;
            const hasFavorite =
              conv.isFavorite || conv.messages.some((m) => m.isFavorite);
            const isPinned = conv.pinned;
            const isEditing = editingId === conv.id;

            return (
              <div
                key={conv.id}
                onClick={() => {
                  onSelect(conv.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                  isActive
                    ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-100 font-semibold border border-purple-200/60 dark:border-purple-800/40 shadow-xs'
                    : 'text-muted-foreground hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-foreground border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-14">
                  {getSubjectIcon(conv.detectedSubject)}
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <form
                        onSubmit={(e) => handleSaveRename(e, conv.id)}
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          autoFocus
                          className="h-6 px-1.5 rounded-md bg-white dark:bg-slate-800 text-xs text-foreground border border-purple-500 focus:outline-hidden w-full font-medium"
                        />
                        <button
                          type="submit"
                          className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          title="Save"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5">
                          {isPinned && (
                            <Pin className="w-3 h-3 text-purple-600 fill-purple-600 dark:text-purple-400 dark:fill-purple-400 shrink-0" />
                          )}
                          <p className="text-xs truncate">{conv.title}</p>
                          {hasFavorite && (
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-normal">
                          {conv.messages.length}{' '}
                          {conv.messages.length === 1 ? 'message' : 'messages'}
                          {conv.detectedSubject ? ` • ${conv.detectedSubject}` : ''}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions: Pin, Rename, Delete */}
                <div className="flex items-center gap-0.5 shrink-0">
                  {/* Pin action */}
                  {onTogglePin && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePin(conv.id);
                      }}
                      title={isPinned ? 'Unpin chat' : 'Pin chat to top'}
                      className={`p-1 rounded-lg transition-all cursor-pointer ${
                        isPinned
                          ? 'text-purple-600 dark:text-purple-400'
                          : 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                      }`}
                    >
                      <Pin className="w-3 h-3" />
                    </button>
                  )}

                  {/* Rename action */}
                  {onRename && (
                    <button
                      type="button"
                      onClick={(e) => startEditing(e, conv)}
                      title="Rename chat"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-all cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}

                  {/* Delete action */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(conv.id);
                    }}
                    title="Delete chat"
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Clear All */}
      {conversations.length > 0 && (
        <div className="p-3 border-t border-slate-200/80 dark:border-white/10">
          <button
            onClick={() => {
              if (window.confirm('Clear all study chats from local storage?')) {
                onClearAll();
              }
            }}
            className="w-full py-1.5 rounded-lg text-[11px] font-semibold text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Chat History</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export const ChatSidebar = memo(ChatSidebarComponent);
