import React, { useState } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  MessageSquare,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { ChatConversation } from '../models/ai-tutor';

interface ConversationHistoryDrawerProps {
  conversations: ChatConversation[];
  activeId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  onCloseMobile?: () => void;
}

export const ConversationHistoryDrawer: React.FC<ConversationHistoryDrawerProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onDeleteConversation,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitleText, setEditTitleText] = useState('');

  const filtered = conversations.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.chapter.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startEditing = (c: ChatConversation) => {
    setEditingId(c.id);
    setEditTitleText(c.title);
  };

  const saveEditing = (id: string) => {
    if (editTitleText.trim()) {
      onRenameConversation(id, editTitleText.trim());
    }
    setEditingId(null);
  };

  const getSubjectBadge = (subject: string) => {
    switch (subject) {
      case 'Physics':
        return 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/40';
      case 'Chemistry':
        return 'bg-pink-100 dark:bg-pink-950/70 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800/40';
      case 'Mathematics':
        return 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-card/95 border-r border-slate-200/80 dark:border-white/10 select-none">
      {/* Drawer Header */}
      <div className="p-4 space-y-3 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-purple-500/20">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-black text-sm text-foreground">Rankify AI Tutor</span>
          </div>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground md:hidden cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* New Chat Button */}
        <button
          onClick={() => {
            onNewChat();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full py-2.5 px-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-500/25 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 rounded-xl pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* History Conversation List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="flex items-center justify-between px-2 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
          <span>Conversations ({filtered.length})</span>
        </div>

        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6 italic">
            No chats found.
          </p>
        ) : (
          <div className="space-y-1">
            {filtered.map((conv) => {
              const isActive = conv.id === activeId;
              const isEditing = editingId === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    if (!isEditing) {
                      onSelectConversation(conv.id);
                      if (onCloseMobile) onCloseMobile();
                    }
                  }}
                  className={`group relative p-2.5 rounded-2xl transition-all cursor-pointer flex items-start justify-between gap-2 border ${
                    isActive
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500/30 shadow-xs'
                      : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60 border-transparent'
                  }`}
                >
                  <div className="flex-1 overflow-hidden space-y-1">
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editTitleText}
                          onChange={(e) => setEditTitleText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditing(conv.id);
                          }}
                          autoFocus
                          className="w-full text-xs font-bold bg-background border border-purple-500 rounded-lg px-2 py-0.5 text-foreground focus:outline-none"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            saveEditing(conv.id);
                          }}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border shrink-0 ${getSubjectBadge(
                              conv.subject
                            )}`}
                          >
                            {conv.subject}
                          </span>
                          <span className="text-xs font-bold text-foreground truncate block">
                            {conv.title}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="truncate max-w-[130px]">{conv.chapter}</span>
                          <span className="font-mono text-[9px]">{conv.date}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(conv);
                        }}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this chat conversation?')) {
                            onDeleteConversation(conv.id);
                          }
                        }}
                        className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950/40 text-muted-foreground hover:text-rose-600 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
