import React from 'react';
import { Plus, Search, Trash2, MessageSquare, Atom, Zap, Calculator, BookOpen, X } from 'lucide-react';
import { Conversation } from '../model/types';

interface ChatSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onCloseMobile?: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  activeId,
  searchQuery,
  onSearchChange,
  onSelect,
  onNewChat,
  onDelete,
  onClearAll,
  onCloseMobile,
}) => {
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
              Study Chats
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
          <span>New Study Chat</span>
        </button>

        {/* Search Chats Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="w-full h-8 pl-8 pr-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-purple-500/40 border border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            {searchQuery ? 'No matching chats found.' : 'No study chats yet.'}
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeId;
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
                <div className="flex items-center gap-2.5 min-w-0 pr-6">
                  {getSubjectIcon(conv.detectedSubject)}
                  <div className="min-w-0">
                    <p className="text-xs truncate">{conv.title}</p>
                    <p className="text-[10px] text-muted-foreground font-normal">
                      {conv.messages.length} {conv.messages.length === 1 ? 'message' : 'messages'}
                      {conv.detectedSubject ? ` • ${conv.detectedSubject}` : ''}
                    </p>
                  </div>
                </div>

                {/* Delete button on hover / active */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conv.id);
                  }}
                  title="Delete chat"
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
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
